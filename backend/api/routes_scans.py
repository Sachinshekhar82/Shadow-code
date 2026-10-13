import os
import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import Scan, Finding, AgentExecution, ScanLog, Repository
from backend.schemas.scans import ScanCreateRequest, ScanDetailResponse, ScanListItem
from backend.pipeline.orchestrator import ShadowCodeOrchestrator

router = APIRouter(prefix="/api/scans", tags=["Scans"])

@router.post("", response_model=ScanDetailResponse)
def create_scan(req: ScanCreateRequest, db: Session = Depends(get_db)):
    orchestrator = ShadowCodeOrchestrator(db)
    scan_record = orchestrator.execute_scan(
        code=req.code,
        language=req.language,
        filename=req.filename,
        repository_id=req.repository_id,
        scan_mode=req.scan_mode
    )
    return scan_record

@router.post("/demo-run", response_model=ScanDetailResponse)
def run_demo_scan(db: Session = Depends(get_db)):
    """One-click demo scan using the intentionally vulnerable sample."""
    sample_path = os.path.join(os.path.dirname(__file__), "..", "samples", "vulnerable_app.py")
    with open(sample_path, "r", encoding="utf-8") as f:
        code = f.read()

    orchestrator = ShadowCodeOrchestrator(db)
    scan_record = orchestrator.execute_scan(
        code=code,
        language="python",
        filename="vulnerable_app.py",
        scan_mode="local_demo",
        branch="main",
        commit_hash="c3a4f8e",
        commit_message="Feat: Add customer banking transfer and profile query endpoint",
        author="Sachin Shekhar (Demo)"
    )
    return scan_record

@router.get("", response_model=List[ScanListItem])
def list_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    repository_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Scan)
    if repository_id:
        query = query.filter(Scan.repository_id == repository_id)
    scans = query.order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for s in scans:
        repo_name = s.repository.name if s.repository else "Local Submission"
        items.append(ScanListItem(
            id=s.id,
            repository_id=s.repository_id,
            repository_name=repo_name,
            scan_mode=s.scan_mode,
            status=s.status,
            branch=s.branch,
            language=s.language,
            filename=s.filename,
            total_findings=s.total_findings,
            critical_count=s.critical_count,
            high_count=s.high_count,
            medium_count=s.medium_count,
            low_count=s.low_count,
            duration_ms=s.duration_ms,
            created_at=s.created_at
        ))
    return items

@router.get("/{scan_id}", response_model=ScanDetailResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{scan_id}/report")
def get_scan_report(scan_id: str, format: str = Query("json", pattern="^(json|csv)$"), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Finding ID", "Severity", "Score", "CWE", "CVE", "Title", "File", "Line", "Status", "Detection Source"])
        for f in findings:
            writer.writerow([f.id, f.severity, f.numeric_score, f.cwe_id, f.cve_id, f.title, f.file_path, f.line_start, f.status, f.detection_source])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=shadow_code_report_{scan_id[:8]}.csv"}
        )

    # Return structured JSON report
    return {
        "scan_id": scan.id,
        "filename": scan.filename,
        "language": scan.language,
        "timestamp": scan.created_at.isoformat(),
        "duration_ms": scan.duration_ms,
        "scan_mode": scan.scan_mode,
        "status": scan.status,
        "summary": {
            "total_findings": scan.total_findings,
            "critical": scan.critical_count,
            "high": scan.high_count,
            "medium": scan.medium_count,
            "low": scan.low_count
        },
        "findings": [
            {
                "id": f.id,
                "rule_id": f.rule_id,
                "title": f.title,
                "severity": f.severity,
                "score": f.numeric_score,
                "rationale": f.severity_rationale,
                "cwe": f.cwe_id,
                "cve": f.cve_id,
                "references": f.cve_references,
                "file": f.file_path,
                "line_start": f.line_start,
                "line_end": f.line_end,
                "snippet": f.code_snippet,
                "detection_source": f.detection_source,
                "status": f.status,
                "remediation": {
                    "diff": f.remediation.diff if f.remediation else None,
                    "explanation": f.remediation.explanation if f.remediation else None,
                    "syntax_valid": f.remediation.syntax_valid if f.remediation else None,
                    "status": f.remediation.status if f.remediation else None
                } if f.remediation else None
            }
            for f in findings
        ]
    }
