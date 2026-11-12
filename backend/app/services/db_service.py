import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from bson import ObjectId

from backend.app.db.mongo import get_db_manager, DatabaseConnectionError
from backend.app.schemas.domain import (
    ScanSchema,
    FindingSchema,
    RemediationSchema,
    RepositorySchema,
    PullRequestSchema,
    AgentRunSchema
)

logger = logging.getLogger("shadow_code.services.db")

def _clean_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Recursively converts MongoDB ObjectId and datetime to JSON-friendly primitives."""
    if doc is None:
        return None
    cleaned = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        elif isinstance(v, ObjectId):
            cleaned[k] = str(v)
        elif isinstance(v, datetime):
            cleaned[k] = v.isoformat()
        elif isinstance(v, dict):
            cleaned[k] = _clean_doc(v)
        elif isinstance(v, list):
            cleaned[k] = [
                _clean_doc(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item.isoformat() if isinstance(item, datetime)
                else item
                for item in v
            ]
        else:
            cleaned[k] = v
    return cleaned

class DatabaseService:
    """
    Data Access Layer providing type-safe persistence, query isolation,
    and business domain operations over MongoDB collections.
    """

    def __init__(self):
        self.mgr = get_db_manager()

    # --- Repositories ---
    def get_repository(self, repo_id: str) -> Optional[Dict[str, Any]]:
        doc = self.mgr.repositories.find_one({"id": repo_id})
        return _clean_doc(doc)

    def list_repositories(self, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        cursor = self.mgr.repositories.find({}).sort("created_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    def upsert_repository(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_id = repo_data["id"]
        now_iso = datetime.now(timezone.utc).isoformat()
        repo_data.setdefault("created_at", now_iso)
        repo_data["updated_at"] = now_iso
        self.mgr.repositories.update_one(
            {"id": repo_id},
            {"$set": repo_data},
            upsert=True
        )
        return self.get_repository(repo_id) or repo_data

    # --- Scans ---
    def create_scan(self, scan_obj: ScanSchema) -> Dict[str, Any]:
        doc = scan_obj.model_dump()
        self.mgr.scans.update_one(
            {"id": scan_obj.id},
            {"$set": doc},
            upsert=True
        )
        return _clean_doc(doc)

    def get_scan(self, scan_id: str) -> Optional[Dict[str, Any]]:
        doc = self.mgr.scans.find_one({"id": scan_id})
        return _clean_doc(doc)

    def list_scans(self, repository_id: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        query = {}
        if repository_id:
            query["repository_id"] = repository_id
        cursor = self.mgr.scans.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    def count_scans(self, repository_id: Optional[str] = None) -> int:
        query = {"repository_id": repository_id} if repository_id else {}
        return self.mgr.scans.count_documents(query)

    # --- Findings ---
    def save_findings(self, findings: List[FindingSchema]) -> int:
        if not findings:
            return 0
        docs = [f.model_dump() for f in findings]
        inserted = 0
        for d in docs:
            res = self.mgr.findings.update_one({"id": d["id"]}, {"$set": d}, upsert=True)
            if res.upserted_id or res.modified_count > 0:
                inserted += 1
        return inserted

    def get_finding(self, finding_id: str) -> Optional[Dict[str, Any]]:
        doc = self.mgr.findings.find_one({"id": finding_id})
        return _clean_doc(doc)

    def list_findings(
        self,
        scan_id: Optional[str] = None,
        repository_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if scan_id:
            query["scan_id"] = scan_id
        if repository_id:
            query["repository_id"] = repository_id
        if severity:
            query["severity"] = severity.upper()
        if status:
            query["remediation_status"] = status
        
        cursor = self.mgr.findings.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    def count_findings(
        self,
        scan_id: Optional[str] = None,
        repository_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        query: Dict[str, Any] = {}
        if scan_id:
            query["scan_id"] = scan_id
        if repository_id:
            query["repository_id"] = repository_id
        if severity:
            query["severity"] = severity.upper()
        if status:
            query["remediation_status"] = status
        return self.mgr.findings.count_documents(query)

    def update_finding(self, finding_id: str, updates: Dict[str, Any]) -> bool:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.mgr.findings.update_one({"id": finding_id}, {"$set": updates})
        return res.modified_count > 0 or res.matched_count > 0

    # --- Remediations ---
    def save_remediation(self, rem: RemediationSchema) -> Dict[str, Any]:
        doc = rem.model_dump()
        self.mgr.remediations.update_one({"id": rem.id}, {"$set": doc}, upsert=True)
        return _clean_doc(doc)

    def get_remediation(self, remediation_id: str) -> Optional[Dict[str, Any]]:
        doc = self.mgr.remediations.find_one({"id": remediation_id})
        return _clean_doc(doc)

    def get_remediation_by_finding(self, finding_id: str) -> Optional[Dict[str, Any]]:
        doc = self.mgr.remediations.find_one({"finding_id": finding_id})
        return _clean_doc(doc)

    def list_remediations(self, approval_status: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        query = {"approval_status": approval_status} if approval_status else {}
        cursor = self.mgr.remediations.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    def update_remediation(self, remediation_id: str, updates: Dict[str, Any]) -> bool:
        res = self.mgr.remediations.update_one({"id": remediation_id}, {"$set": updates})
        return res.modified_count > 0 or res.matched_count > 0

    # --- Pull Requests ---
    def save_pull_request(self, pr: PullRequestSchema) -> Dict[str, Any]:
        doc = pr.model_dump()
        doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.mgr.pull_requests.update_one({"id": pr.id}, {"$set": doc}, upsert=True)
        return _clean_doc(doc)

    def list_pull_requests(self, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        cursor = self.mgr.pull_requests.find({}).sort("created_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    # --- Agent Runs ---
    def save_agent_run(self, run: AgentRunSchema) -> Dict[str, Any]:
        doc = run.model_dump()
        self.mgr.agent_runs.update_one({"id": run.id}, {"$set": doc}, upsert=True)
        return _clean_doc(doc)

    def list_agent_runs(self, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        cursor = self.mgr.agent_runs.find({}).sort("started_at", -1).skip(skip).limit(limit)
        return [_clean_doc(d) for d in cursor]

    # --- Metrics & Dashboard ---
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        total_repos = self.mgr.repositories.count_documents({})
        total_scans = self.mgr.scans.count_documents({})
        open_findings = self.mgr.findings.count_documents({"remediation_status": "open"})
        
        crit = self.mgr.findings.count_documents({"severity": "CRITICAL", "remediation_status": "open"})
        high = self.mgr.findings.count_documents({"severity": "HIGH", "remediation_status": "open"})
        med = self.mgr.findings.count_documents({"severity": "MEDIUM", "remediation_status": "open"})
        low = self.mgr.findings.count_documents({"severity": {"$in": ["LOW", "INFO"]}, "remediation_status": "open"})
        
        # Health score formula: Max 100 - (Crit*25 + High*10 + Med*4 + Low*1), min 0
        deduction = (crit * 25) + (high * 10) + (med * 4) + (low * 1)
        health_score = max(0.0, min(100.0, 100.0 - deduction))

        recent_scans = self.list_scans(limit=5)
        recent_findings = self.list_findings(limit=6)
        pending_remediations = self.mgr.remediations.count_documents({"approval_status": "pending"})
        active_prs = self.mgr.pull_requests.count_documents({"status": "open"})

        return {
            "total_repositories": total_repos,
            "total_scans": total_scans,
            "open_findings": open_findings,
            "security_health_score": round(health_score, 1),
            "severity_breakdown": {"CRITICAL": crit, "HIGH": high, "MEDIUM": med, "LOW": low},
            "recent_scans": recent_scans,
            "recent_findings": recent_findings,
            "pending_remediations": pending_remediations,
            "active_prs": active_prs,
            "database_mode": "Persistent MongoDB Atlas" if not self.mgr.is_mock else "In-Memory Session"
        }

    def get_analytics_trends(self, limit: int = 20) -> List[Dict[str, Any]]:
        cursor = self.mgr.scans.find({}).sort("created_at", 1).limit(limit)
        trends = []
        for idx, s in enumerate(cursor):
            label = s.get("created_at", "")[:10] or f"Scan {idx+1}"
            trends.append({
                "scan_id": s.get("id"),
                "date": label,
                "critical": s.get("critical_count", 0),
                "high": s.get("high_count", 0),
                "medium": s.get("medium_count", 0),
                "low": s.get("low_count", 0),
                "total": s.get("total_findings", 0)
            })
        return trends

db_service = DatabaseService()
