import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.db.mongo import get_db_manager, get_database, is_database_mock
from backend.app.services.db_service import db_service
from backend.app.api.routes import router as api_router
from backend.app.services.scanner import scanner_engine
from backend.app.agents.orchestrator import orchestrator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("shadow_code.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed default repository and initial baseline security audit scan."""
    try:
        db = get_database()
        logger.info("Initializing Shadow-Code SDLC Auditor service...")

        # Ensure default repository exists
        default_repo = db.repositories.find_one({"id": "repo-shadow-code"})
        if not default_repo:
            repo_doc = {
                "id": "repo-shadow-code",
                "name": "Shadow-Code Core Gateway",
                "url": settings.DEFAULT_REPO_URL,
                "default_branch": "main",
                "description": "Primary repository audited by Shadow-Code autonomous security agents.",
                "status": "connected",
                "health_score": 100.0,
                "scan_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.repositories.insert_one(repo_doc)
            logger.info(f"Registered default monitored repository: {settings.DEFAULT_REPO_URL}")

        # Seed baseline audit scan if database is empty
        scan_count = db.scans.count_documents({})
        if scan_count == 0:
            logger.info("Database scan records empty. Executing baseline security audit scan...")
            scan_obj, findings = scanner_engine.execute_scan(
                repository_id="repo-shadow-code",
                commit_sha="HEAD",
                branch="main",
                trigger="system_init"
            )
            db.scans.insert_one(scan_obj.model_dump())
            if findings:
                db.findings.insert_many([f.model_dump() for f in findings])
                try:
                    # Automatically orchestrate analysis for the highest severity finding
                    crit_finding = next((f for f in findings if f.severity in ["CRITICAL", "HIGH"]), findings[0])
                    orchestrator.orchestrate_finding_workflow(crit_finding)
                except Exception as orch_err:
                    logger.warning(f"Notice during initial orchestration: {orch_err}")

            db.repositories.update_one(
                {"id": "repo-shadow-code"},
                {"$set": {"scan_count": 1, "last_scanned_commit": scan_obj.commit_sha, "last_scan_status": scan_obj.status}}
            )
            logger.info(f"Baseline audit completed: {len(findings)} findings discovered and persisted.")
    except Exception as e:
        logger.warning(f"Notice during lifespan startup: {e}")

    yield
    logger.info("Shutting down Shadow-Code service...")
    get_db_manager().disconnect()

app = FastAPI(
    title=settings.PROJECT_TITLE,
    description="Autonomous Agentic DevSecOps Platform for Static Analysis, Threat Reasoning, and Validated Patch Remediation.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Serve production frontend build if dist directory exists
frontend_dist = os.path.join(settings.WORKSPACE_ROOT, "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
            return {"detail": "Not found"}
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "platform": settings.PROJECT_TITLE,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "health_check": "/api/health",
            "status": "active"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
