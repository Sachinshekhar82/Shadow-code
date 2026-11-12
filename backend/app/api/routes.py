import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Response, status

from backend.app.db.mongo import get_database, is_database_mock, get_db_health
from backend.app.services.db_service import db_service
from backend.app.schemas.domain import (
    FindingSchema,
    ScanSchema,
    ScanCreateRequest,
    RepositorySchema,
    RepositoryCreateRequest,
    RemediationSchema,
    PullRequestSchema,
    PullRequestCreateRequest,
    AgentRunSchema,
    ChatRequest,
    ChatResponse,
    DashboardOverview
)
from backend.app.services.scanner import scanner_engine
from backend.app.services.reports import (
    generate_json_report,
    generate_csv_report,
    generate_pdf_report
)
from backend.app.services.chatbot import chatbot_service
from backend.app.agents.orchestrator import orchestrator
from backend.app.agents.pr_reporting_agent import pr_reporting_agent
from backend.app.security.webhook import verify_github_webhook_signature
from backend.app.core.config import settings
from backend.app.services.github_service import github_service
from backend.app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api")

# --- System & Health ---
@router.get("/health")
def health_check():
    db_health = get_db_health()
    overall_status = "healthy" if db_health.get("connected") else "degraded"
    
    return {
        "status": overall_status,
        "service": "Shadow-Code DevSecOps Platform",
        "database": "persistent_mongodb" if not db_health.get("is_mock") else "in_memory_mock",
        "database_health": db_health,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "semgrep_available": os.path.exists(scanner_engine.semgrep_bin),
        "bandit_available": os.path.exists(scanner_engine.bandit_bin),
        "github_configured": bool(settings.GITHUB_TOKEN),
        "gemini_configured": gemini_service.is_configured(),
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_provider": "google_genai"
    }

@router.get("/ai/status")
def get_ai_status():
    """Confirms Google Gemini API connectivity and active model without exposing credentials."""
    return gemini_service.check_availability()

@router.get("/github/status")
def test_github_connection():
    """Confirms GitHub authentication and repository access without exposing tokens."""
    return github_service.test_connectivity()

@router.get("/test-file")
def get_staged_test_file():
    """Returns local staged test file content and metadata for DevSecOps pre-push security gating."""
    file_path = os.path.join(settings.WORKSPACE_ROOT, "vulnerable_api_service.py")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Test file 'vulnerable_api_service.py' not found")
    
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
        
    return {
        "filename": "vulnerable_api_service.py",
        "path": "vulnerable_api_service.py",
        "absolute_path": file_path,
        "line_count": len(content.splitlines()),
        "content": content,
        "language": "python",
        "repository_id": "repo-shadow-code",
        "remote_repo": "https://github.com/Sachinshekhar82/Shadow-code.git",
        "vulnerabilities": [
            {"type": "Hard-coded Secret (sk_live_...)", "cwe": "CWE-798", "severity": "CRITICAL", "line": 12},
            {"type": "Weak Cryptographic Hash (MD5)", "cwe": "CWE-328", "severity": "MEDIUM", "line": 16},
            {"type": "SQL Injection (String interpolation)", "cwe": "CWE-89", "severity": "HIGH", "line": 22},
            {"type": "OS Command Injection (shell=True)", "cwe": "CWE-78", "severity": "CRITICAL", "line": 28},
            {"type": "Untrusted Deserialization (pickle)", "cwe": "CWE-502", "severity": "CRITICAL", "line": 35}
        ]
    }

# --- Dashboard & Analytics ---
@router.get("/dashboard", response_model=DashboardOverview)
def get_dashboard_summary():
    metrics = db_service.get_dashboard_metrics()
    return DashboardOverview(
        total_repositories=metrics["total_repositories"],
        total_scans=metrics["total_scans"],
        open_findings=metrics["open_findings"],
        security_health_score=metrics["security_health_score"],
        severity_breakdown=metrics["severity_breakdown"],
        recent_scans=[ScanSchema(**s) for s in metrics["recent_scans"]],
        recent_findings=[FindingSchema(**f) for f in metrics["recent_findings"]],
        pending_remediations=metrics["pending_remediations"],
        active_prs=metrics["active_prs"],
        database_mode=metrics["database_mode"]
    )

@router.get("/analytics/trends")
def get_analytics_trends(limit: int = Query(20, ge=1, le=100)):
    trends = db_service.get_analytics_trends(limit=limit)
    return {"trends": trends}

# --- Repositories ---
@router.get("/repositories", response_model=List[RepositorySchema])
def list_repositories(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    repos = db_service.list_repositories(limit=limit, skip=skip)
    return [RepositorySchema(**r) for r in repos]

@router.post("/repositories", response_model=RepositorySchema, status_code=status.HTTP_201_CREATED)
def create_repository(req: RepositoryCreateRequest):
    repo_id = f"repo-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    repo_doc = {
        "id": repo_id,
        "name": req.name,
        "url": req.url,
        "default_branch": req.default_branch,
        "description": req.description or "",
        "status": "connected",
        "health_score": 100.0,
        "scan_count": 0,
        "created_at": now_iso
    }
    saved = db_service.upsert_repository(repo_doc)
    return RepositorySchema(**saved)

@router.get("/repositories/{repository_id}", response_model=RepositorySchema)
def get_repository(repository_id: str):
    repo = db_service.get_repository(repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepositorySchema(**repo)

# --- Scans ---
@router.post("/scans", response_model=ScanSchema, status_code=status.HTTP_202_ACCEPTED)
def trigger_scan(req: ScanCreateRequest):
    repo = db_service.get_repository(req.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail=f"Configured repository {req.repository_id} not found")

    scan_obj, findings = scanner_engine.execute_scan(
        repository_id=req.repository_id,
        commit_sha=req.commit_sha or "HEAD",
        target_path=req.target_path or (req.target_files[0] if req.target_files else None),
        code_snippet=req.code_snippet,
        snippet_filename=req.snippet_filename,
        branch=req.branch or "main",
        trigger=req.trigger
    )

    # Persist Scan and Findings in MongoDB
    db_service.create_scan(scan_obj)
    if findings:
        db_service.save_findings(findings)

    # Update Repository metadata
    db_service.upsert_repository({
        "id": req.repository_id,
        "scan_count": repo.get("scan_count", 0) + 1,
        "last_scanned_commit": scan_obj.commit_sha,
        "last_scan_status": scan_obj.status
    })

    scan_obj.findings = findings
    return scan_obj

@router.get("/scans", response_model=List[ScanSchema])
def list_scans(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    scans = db_service.list_scans(limit=limit, skip=skip)
    return [ScanSchema(**s) for s in scans]

@router.get("/scans/{scan_id}", response_model=ScanSchema)
def get_scan(scan_id: str):
    scan = db_service.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found")
    findings = db_service.list_findings(scan_id=scan_id)
    scan["findings"] = findings
    return ScanSchema(**scan)

@router.get("/scans/{scan_id}/findings", response_model=List[FindingSchema])
def get_scan_findings(scan_id: str):
    findings = db_service.list_findings(scan_id=scan_id)
    for f in findings:
        if not f.get("remediation"):
            rem = db_service.get_remediation_by_finding(f.get("id"))
            if rem:
                f["remediation"] = rem
    return [FindingSchema(**f) for f in findings]

# --- Findings ---
@router.get("/findings", response_model=List[FindingSchema])
def list_findings(
    severity: Optional[str] = None,
    repository_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    findings = db_service.list_findings(
        repository_id=repository_id,
        severity=severity,
        status=status_filter,
        limit=limit,
        skip=skip
    )
    for f in findings:
        if not f.get("remediation"):
            rem = db_service.get_remediation_by_finding(f.get("id"))
            if rem:
                f["remediation"] = rem
    return [FindingSchema(**f) for f in findings]

@router.get("/findings/{finding_id}", response_model=FindingSchema)
def get_finding(finding_id: str):
    finding = db_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")
    if not finding.get("remediation"):
        rem = db_service.get_remediation_by_finding(finding_id)
        if rem:
            finding["remediation"] = rem
    return FindingSchema(**finding)

@router.post("/findings/{finding_id}/analyze")
def analyze_finding(finding_id: str):
    finding_doc = db_service.get_finding(finding_id)
    if not finding_doc:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")
    
    finding = FindingSchema(**finding_doc)
    res = orchestrator.orchestrate_finding_workflow(finding)
    
    # Persist updated finding and remediation
    if "remediation" in res:
        db_service.save_remediation(res["remediation"])
    db_service.update_finding(finding_id, {
        "ai_analysis_status": finding.ai_analysis_status,
        "ai_reasoning": finding.ai_reasoning
    })
    return res

@router.post("/findings/{finding_id}/remediate", response_model=RemediationSchema)
def remediate_finding(finding_id: str):
    finding_doc = db_service.get_finding(finding_id)
    if not finding_doc:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")
    
    finding = FindingSchema(**finding_doc)
    res = orchestrator.orchestrate_finding_workflow(finding)
    rem = res["remediation"]
    db_service.save_remediation(rem)
    return rem

# --- Remediations ---
@router.get("/remediations", response_model=List[RemediationSchema])
def list_remediations(
    approval_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    remediations = db_service.list_remediations(approval_status=approval_status, limit=limit, skip=skip)
    return [RemediationSchema(**r) for r in remediations]

@router.get("/remediations/{remediation_id}", response_model=RemediationSchema)
def get_remediation(remediation_id: str):
    rem = db_service.get_remediation(remediation_id)
    if not rem:
        raise HTTPException(status_code=404, detail=f"Remediation '{remediation_id}' not found")
    return RemediationSchema(**rem)

@router.post("/remediations/{remediation_id}/validate")
def validate_remediation(remediation_id: str):
    rem_doc = db_service.get_remediation(remediation_id)
    if not rem_doc:
        raise HTTPException(status_code=404, detail=f"Remediation '{remediation_id}' not found")
    
    rem = RemediationSchema(**rem_doc)
    finding_doc = db_service.get_finding(rem.finding_id)
    if not finding_doc:
        raise HTTPException(status_code=404, detail="Parent finding not found")
    
    from backend.app.agents.validation_agent import validation_agent
    status_val, details = validation_agent.validate_patch(rem, FindingSchema(**finding_doc))
    
    db_service.update_remediation(remediation_id, {
        "validation_status": status_val,
        "validation_details": details
    })
    return {"validation_status": status_val, "details": details}

@router.post("/remediations/{remediation_id}/create-pr", response_model=PullRequestSchema)
def create_remediation_pr(remediation_id: str):
    """
    Requires explicit human authorization to publish branch and Pull Request to GitHub.
    """
    rem_doc = db_service.get_remediation(remediation_id)
    if not rem_doc:
        raise HTTPException(status_code=404, detail=f"Remediation '{remediation_id}' not found")

    rem = RemediationSchema(**rem_doc)
    finding_doc = db_service.get_finding(rem.finding_id)
    if not finding_doc:
        raise HTTPException(status_code=404, detail="Parent finding not found")

    finding = FindingSchema(**finding_doc)
    repo_doc = db_service.get_repository(finding.repository_id)
    repo_url = repo_doc["url"] if repo_doc else settings.DEFAULT_REPO_URL

    pr = pr_reporting_agent.create_pull_request(
        repository_url=repo_url,
        finding=finding,
        remediation=rem,
        target_branch="main"
    )

    db_service.save_pull_request(pr)
    db_service.update_remediation(remediation_id, {"approval_status": "approved", "pr_id": pr.id})
    db_service.update_finding(finding.id, {"remediation_status": "in_review"})

    return pr

@router.post("/remediations/{remediation_id}/apply-local")
def apply_remediation_locally(remediation_id: str):
    """Applies the verified AI remediation patch directly to the local source file on disk."""
    rem_doc = db_service.get_remediation(remediation_id)
    if not rem_doc:
        raise HTTPException(status_code=404, detail=f"Remediation '{remediation_id}' not found")

    file_path = rem_doc.get("file_path") or "vulnerable_api_service.py"
    target_abs = os.path.join(settings.WORKSPACE_ROOT, file_path) if not os.path.isabs(file_path) else file_path

    if not os.path.exists(target_abs):
        raise HTTPException(status_code=404, detail=f"Target file '{file_path}' not found on workstation")

    with open(target_abs, "r", encoding="utf-8", errors="replace") as f:
        orig_text = f.read()

    orig_code = rem_doc.get("original_code") or ""
    patch_code = rem_doc.get("proposed_patch") or rem_doc.get("proposed_code") or ""

    if orig_code and orig_code in orig_text:
        updated_text = orig_text.replace(orig_code, patch_code)
    else:
        updated_text = orig_text + f"\n\n# Shadow-Code Applied Patch:\n{patch_code}\n"

    with open(target_abs, "w", encoding="utf-8") as f:
        f.write(updated_text)

    now_iso = datetime.now(timezone.utc).isoformat()
    db_service.update_remediation(remediation_id, {
        "approval_status": "applied",
        "applied_at": now_iso
    })
    finding_id = rem_doc.get("finding_id")
    if finding_id:
        db_service.update_finding(finding_id, {"remediation_status": "remediated"})

    return {
        "status": "applied",
        "file_path": file_path,
        "message": f"Successfully applied AI patch to {file_path}. File is now secured!"
    }


# --- Pull Requests ---
@router.get("/pull-requests", response_model=List[PullRequestSchema])
def list_pull_requests(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    prs = db_service.list_pull_requests(limit=limit, skip=skip)
    return [PullRequestSchema(**p) for p in prs]

# --- Agent Activity ---
@router.get("/agent-runs", response_model=List[AgentRunSchema])
def list_agent_runs(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    runs = db_service.list_agent_runs(limit=limit, skip=skip)
    return [AgentRunSchema(**r) for r in runs]

# --- Chatbot ---
@router.post("/chat", response_model=ChatResponse)
def chat_with_security_assistant(req: ChatRequest):
    return chatbot_service.process_chat(req)

# --- Reports & Downloads ---
@router.get("/reports/{scan_id}")
def get_or_download_report(
    scan_id: str,
    format: Optional[str] = Query(None, pattern="^(json|csv|pdf)$")
):
    """
    Returns audit report data. If `format` is specified, initiates file download.
    Otherwise, returns validated JSON report payload for inspection.
    """
    scan = db_service.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found.")

    findings = db_service.list_findings(scan_id=scan_id)
    repo = db_service.get_repository(scan.get("repository_id", ""))
    remediations = db_service.list_remediations()
    pull_requests = db_service.list_pull_requests()

    if format == "pdf":
        pdf_bytes = generate_pdf_report(scan, findings, repo, remediations, pull_requests)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="shadow-code-audit-{scan_id}.pdf"',
                "Content-Length": str(len(pdf_bytes))
            }
        )
    elif format == "csv":
        csv_data = generate_csv_report(scan, findings, repo, pull_requests)
        return Response(
            content=csv_data,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="shadow-code-audit-{scan_id}.csv"'
            }
        )
    elif format == "json":
        json_data = generate_json_report(scan, findings, repo, remediations, pull_requests)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="shadow-code-audit-{scan_id}.json"'
            }
        )
    else:
        # Default report JSON structure
        json_data = generate_json_report(scan, findings, repo, remediations, pull_requests)
        return Response(content=json_data, media_type="application/json")

@router.get("/reports/{scan_id}/download")
def download_scan_report(
    scan_id: str,
    format: str = Query("json", pattern="^(json|csv|pdf)$")
):
    """
    Dedicated binary and text file download endpoint supporting PDF, CSV, and JSON.
    """
    return get_or_download_report(scan_id=scan_id, format=format)

# --- GitHub Webhook ---
@router.post("/webhook/github")
async def github_webhook(payload_body: bytes = Depends(verify_github_webhook_signature)):
    """Handles GitHub push and pull_request webhook events."""
    import json
    try:
        event_data = json.loads(payload_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    repo_info = event_data.get("repository", {})
    repo_url = repo_info.get("clone_url", repo_info.get("html_url", settings.DEFAULT_REPO_URL))
    commit_sha = event_data.get("after") or event_data.get("pull_request", {}).get("head", {}).get("sha", "HEAD")

    # Match or create repo
    all_repos = db_service.list_repositories()
    matching = next((r for r in all_repos if r.get("url") == repo_url), None)
    if not matching:
        repo_id = f"repo-{uuid.uuid4().hex[:8]}"
        saved_repo = db_service.upsert_repository({
            "id": repo_id,
            "name": repo_info.get("name", "Shadow-Code-Repository"),
            "url": repo_url,
            "default_branch": repo_info.get("default_branch", "main"),
            "status": "connected",
            "health_score": 100.0,
            "scan_count": 0
        })
    else:
        repo_id = matching["id"]

    # Trigger scan
    scan_obj, findings = scanner_engine.execute_scan(
        repository_id=repo_id,
        commit_sha=commit_sha,
        trigger="webhook"
    )
    db_service.create_scan(scan_obj)
    if findings:
        db_service.save_findings(findings)

    return {"status": "scan_completed", "scan_id": scan_obj.id, "findings_count": len(findings)}
