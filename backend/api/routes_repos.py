import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import Repository, Scan, Finding
from backend.schemas.repository import RepositoryCreateRequest, RepositoryResponse

router = APIRouter(prefix="/api/repositories", tags=["Repositories"])

@router.get("", response_model=List[RepositoryResponse])
def list_repositories(db: Session = Depends(get_db)):
    repos = db.query(Repository).order_by(Repository.created_at.desc()).all()
    if not repos:
        # Seed default demo repository and user's github repo
        demo_repo = Repository(
            id="repo-demo",
            name="Shadow-Code Demo",
            url="https://github.com/Sachinshekhar82/Shadow-code.git",
            default_branch="main",
            integration_mode="local_demo",
            status="connected",
            scan_count=0
        )
        db.add(demo_repo)
        db.commit()
        repos = [demo_repo]
    return repos

@router.post("", response_model=RepositoryResponse)
def create_repository(req: RepositoryCreateRequest, db: Session = Depends(get_db)):
    repo_id = f"repo-{uuid.uuid4().hex[:8]}"
    repo = Repository(
        id=repo_id,
        name=req.name,
        url=req.url,
        default_branch=req.default_branch,
        integration_mode=req.integration_mode,
        status="connected",
        scan_count=0
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)
    return repo

@router.get("/{repo_id}")
def get_repository_details(repo_id: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    scans = db.query(Scan).filter(Scan.repository_id == repo_id).order_by(Scan.created_at.desc()).limit(10).all()
    findings = db.query(Finding).filter(Finding.repository_id == repo_id).all()

    crit = sum(1 for f in findings if f.severity == "Critical")
    high = sum(1 for f in findings if f.severity == "High")
    med = sum(1 for f in findings if f.severity == "Medium")
    low = sum(1 for f in findings if f.severity == "Low")

    return {
        "repository": repo,
        "metrics": {
            "total_scans": len(scans),
            "total_findings": len(findings),
            "critical": crit,
            "high": high,
            "medium": med,
            "low": low
        },
        "recent_scans": scans
    }
