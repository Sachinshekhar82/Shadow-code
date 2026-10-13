import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import Finding, FeedbackDecision, AdaptiveProfile, Scan
from backend.schemas.scans import FindingSchema
from backend.schemas.feedback import FeedbackCreateRequest, FeedbackResponse

router = APIRouter(prefix="/api/findings", tags=["Findings"])

@router.get("", response_model=List[FindingSchema])
def list_findings(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    scan_id: Optional[str] = None,
    repository_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Finding)
    if scan_id:
        query = query.filter(Finding.scan_id == scan_id)
    if repository_id:
        query = query.filter(Finding.repository_id == repository_id)
    if severity and severity.lower() != "all":
        query = query.filter(Finding.severity.ilike(severity))
    if status and status.lower() != "all":
        query = query.filter(Finding.status == status)
    if search:
        s_term = f"%{search}%"
        query = query.filter((Finding.title.ilike(s_term)) | (Finding.description.ilike(s_term)) | (Finding.rule_id.ilike(s_term)))

    return query.order_by(Finding.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{finding_id}", response_model=FindingSchema)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return f

@router.post("/{finding_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    finding_id: str,
    req: FeedbackCreateRequest,
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    decision = req.decision.lower()
    valid_decisions = ["accepted", "rejected", "overridden", "false_positive", "resolved"]
    if decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Must be one of: {valid_decisions}")

    prev_severity = finding.severity
    adjusted_severity = prev_severity

    # Update finding status
    finding.status = decision

    # Record adaptive adjustment if overridden or false-positive
    repo_id = finding.repository_id or "default_repo"
    profile = db.query(AdaptiveProfile).filter(
        AdaptiveProfile.repository_id == repo_id,
        AdaptiveProfile.rule_id == finding.rule_id
    ).first()

    if not profile:
        profile = AdaptiveProfile(
            id=str(uuid.uuid4()),
            repository_id=repo_id,
            rule_id=finding.rule_id,
            category=finding.category,
            override_count=0,
            false_positive_count=0,
            accept_count=0,
            weight_adjustment=0.0
        )
        db.add(profile)

    if decision in ["overridden", "false_positive"]:
        if decision == "overridden":
            profile.override_count += 1
            profile.weight_adjustment = max(-2.5, profile.weight_adjustment - 0.5)
        else:
            profile.false_positive_count += 1
            profile.weight_adjustment = max(-3.0, profile.weight_adjustment - 0.8)

        # Re-evaluate severity with safety guardrail:
        # Critical findings are NEVER suppressed below High!
        if finding.numeric_score >= 9.0:
            adjusted_severity = "High" # Guardrail retains high visibility
        elif finding.numeric_score >= 7.0:
            adjusted_severity = "Medium"
        else:
            adjusted_severity = "Low"
        finding.severity = adjusted_severity
    elif decision == "accepted":
        profile.accept_count += 1

    feedback_entry = FeedbackDecision(
        id=str(uuid.uuid4()),
        finding_id=finding.id,
        scan_id=finding.scan_id,
        repository_id=finding.repository_id,
        rule_id=finding.rule_id,
        decision=decision,
        reason=req.reason,
        previous_severity=prev_severity,
        adjusted_severity=adjusted_severity,
        created_at=datetime.datetime.utcnow()
    )
    db.add(feedback_entry)
    db.commit()
    db.refresh(feedback_entry)

    return feedback_entry
