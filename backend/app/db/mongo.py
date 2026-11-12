import re
import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, PyMongoError

from backend.app.core.config import settings

logger = logging.getLogger("shadow_code.db")

def mask_mongodb_uri(uri: str) -> str:
    """Masks username:password in MongoDB connection URIs to avoid exposing credentials."""
    if not uri:
        return ""
    return re.sub(r"(mongodb(?:\+srv)?://[^:]+:)([^@]+)(@)", r"\1*****\3", uri)

class DatabaseConnectionError(Exception):
    """Raised when MongoDB is unreachable and cannot fulfill persistent operations."""
    pass

class MongoDBManager:
    _instance: Optional["MongoDBManager"] = None
    _client: Optional[MongoClient] = None
    _db = None
    _is_mock: bool = False
    _connected: bool = False
    _last_error: Optional[str] = None
    _last_ping_ms: Optional[float] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBManager, cls).__new__(cls)
            cls._instance._init_connection()
        return cls._instance

    def _init_connection(self):
        uri = settings.MONGODB_URI
        masked = mask_mongodb_uri(uri)
        db_name = settings.MONGODB_DATABASE or settings.MONGODB_DB_NAME or "shadow_code"

        logger.info(f"Connecting to MongoDB database '{db_name}' at {masked}...")
        try:
            start_ping = time.time()
            client = MongoClient(
                uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                appname="ShadowCodeAuditor"
            )
            # Verify connectivity via ping command
            client.admin.command("ping")
            ping_ms = round((time.time() - start_ping) * 1000, 2)
            self._client = client
            self._db = self._client[db_name]
            self._is_mock = False
            self._connected = True
            self._last_error = None
            self._last_ping_ms = ping_ms
            logger.info(f"Successfully verified MongoDB connection to '{db_name}' (Ping: {ping_ms}ms).")
            self._ensure_indexes()

        except (ConnectionFailure, ServerSelectionTimeoutError, PyMongoError, Exception) as exc:
            err_msg = f"Failed to connect to MongoDB at {masked}: {exc}"
            self._last_error = err_msg
            self._connected = False
            self._client = None
            self._db = None
            logger.error(err_msg)

            # If remote database is unreachable (e.g. IP whitelist restriction, offline, or test mode),
            # initialize mongomock to ensure the platform remains fully operational without crashing.
            try:
                import mongomock
                logger.warning(
                    "Remote MongoDB Atlas connection could not be established (likely network/IP whitelist restriction). "
                    "Failing over to in-memory mongomock database to preserve platform uptime."
                )
                self._client = mongomock.MongoClient()
                self._db = self._client[db_name]
                self._is_mock = True
                self._connected = True
                self._ensure_indexes()
            except Exception as mock_err:
                logger.error(f"Failed to initialize mock fallback: {mock_err}")
                self._is_mock = False

    def _ensure_indexes(self):
        if self._db is None:
            return
        try:
            # 1. Repositories
            self._db.repositories.create_index([("id", ASCENDING)], unique=True)
            self._db.repositories.create_index([("url", ASCENDING)])
            self._db.repositories.create_index([("created_at", DESCENDING)])

            # 2. Scans
            self._db.scans.create_index([("id", ASCENDING)], unique=True)
            self._db.scans.create_index([("repository_id", ASCENDING), ("commit_sha", ASCENDING)])
            self._db.scans.create_index([("created_at", DESCENDING)])
            self._db.scans.create_index([("status", ASCENDING)])

            # 3. Findings
            self._db.findings.create_index([("id", ASCENDING)], unique=True)
            self._db.findings.create_index([("scan_id", ASCENDING)])
            self._db.findings.create_index([("repository_id", ASCENDING)])
            self._db.findings.create_index([("severity", ASCENDING)])
            self._db.findings.create_index([("remediation_status", ASCENDING)])
            self._db.findings.create_index([("created_at", DESCENDING)])

            # 4. Remediations
            self._db.remediations.create_index([("id", ASCENDING)], unique=True)
            self._db.remediations.create_index([("finding_id", ASCENDING)])
            self._db.remediations.create_index([("scan_id", ASCENDING)])
            self._db.remediations.create_index([("approval_status", ASCENDING)])
            self._db.remediations.create_index([("validation_status", ASCENDING)])
            self._db.remediations.create_index([("created_at", DESCENDING)])

            # 5. Agent Runs
            self._db.agent_runs.create_index([("id", ASCENDING)], unique=True)
            self._db.agent_runs.create_index([("scan_id", ASCENDING)])
            self._db.agent_runs.create_index([("finding_id", ASCENDING)])
            self._db.agent_runs.create_index([("started_at", DESCENDING)])

            # 6. Pull Requests
            self._db.pull_requests.create_index([("id", ASCENDING)], unique=True)
            self._db.pull_requests.create_index([("repository_id", ASCENDING)])
            self._db.pull_requests.create_index([("scan_id", ASCENDING)])
            self._db.pull_requests.create_index([("remediation_id", ASCENDING)])
            self._db.pull_requests.create_index([("status", ASCENDING)])
            self._db.pull_requests.create_index([("created_at", DESCENDING)])

            logger.info("Persistent MongoDB collections and query indexes ensured.")
        except Exception as e:
            logger.warning(f"Notice during index creation: {e}")

    def ping(self) -> bool:
        """Verifies active connectivity via admin ping command."""
        if not self._client or not self._connected or self._db is None:
            self._init_connection()
        if not self._client:
            raise DatabaseConnectionError(self._last_error or "Database client is not initialized")
        try:
            start_ping = time.time()
            self._client.admin.command("ping")
            self._last_ping_ms = round((time.time() - start_ping) * 1000, 2)
            self._connected = True
            return True
        except Exception as exc:
            self._connected = False
            self._last_error = str(exc)
            raise DatabaseConnectionError(f"Database ping failed: {exc}")

    def disconnect(self):
        """Closes active client connections cleanly."""
        if self._client:
            try:
                self._client.close()
                logger.info("MongoDB client connections closed cleanly.")
            except Exception as e:
                logger.warning(f"Notice while closing MongoDB connection: {e}")
            finally:
                self._client = None
                self._db = None
                self._connected = False

    def get_health_status(self) -> Dict[str, Any]:
        """Returns health diagnostics without exposing credentials."""
        db_name = settings.MONGODB_DATABASE or settings.MONGODB_DB_NAME or "shadow_code"
        try:
            self.ping()
            return {
                "status": "healthy",
                "connected": True,
                "database": db_name,
                "is_mock": self._is_mock,
                "ping_ms": self._last_ping_ms,
                "error": None
            }
        except Exception as exc:
            return {
                "status": "unhealthy",
                "connected": False,
                "database": db_name,
                "is_mock": self._is_mock,
                "error": str(exc),
                "ping_ms": None
            }

    @property
    def db(self):
        if self._db is None or not self._connected:
            self._init_connection()
        if self._db is None:
            if self._last_error:
                raise DatabaseConnectionError(f"Database unavailable: {self._last_error}")
            raise DatabaseConnectionError("Database connection has not been initialized.")
        return self._db

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def is_mock(self) -> bool:
        return self._is_mock

    # Direct Collection Accessors
    @property
    def repositories(self):
        return self.db.repositories

    @property
    def scans(self):
        return self.db.scans

    @property
    def findings(self):
        return self.db.findings

    @property
    def remediations(self):
        return self.db.remediations

    @property
    def agent_runs(self):
        return self.db.agent_runs

    @property
    def pull_requests(self):
        return self.db.pull_requests

_manager_instance: Optional[MongoDBManager] = None

def get_db_manager() -> MongoDBManager:
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = MongoDBManager()
    return _manager_instance

def get_database():
    return get_db_manager().db

def is_database_mock() -> bool:
    return get_db_manager().is_mock

def get_db_health() -> Dict[str, Any]:
    return get_db_manager().get_health_status()
