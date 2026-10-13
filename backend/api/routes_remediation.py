import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import RemediationProposal, Finding, Scan
from backend.schemas.remediation import RemediationActionRequest, RemediationActionResponse

router = APIRouter(prefix="/api/remediations", tags=["Remediation"])

@router.get("/{remediation_id}")
def get_remediation(remediation_id: str, db: Session = Depends(get_db)):
    rem = db.query(RemediationProposal).filter(RemediationProposal.id == remediation_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Remediation proposal not found")
    return rem

@router.post("/{remediation_id}/action", response_model=RemediationActionResponse)
def handle_remediation_action(
    remediation_id: str,
    req: RemediationActionRequest,
    db: Session = Depends(get_db)
):
    rem = db.query(RemediationProposal).filter(RemediationProposal.id == remediation_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Remediation proposal not found")

    finding = db.query(Finding).filter(Finding.id == rem.finding_id).first()
    action = req.action.lower()

    if action == "approve":
        rem.status = "approved"
        db.commit()
        return RemediationActionResponse(
            id=rem.id,
            finding_id=rem.finding_id,
            status=rem.status,
            message="Patch proposal approved by developer. Ready for safe application.",
            applied_at=rem.applied_at,
            pre_fix_snapshot=rem.pre_fix_snapshot,
            active_code=rem.proposed_code
        )

    elif action == "apply":
        if not rem.syntax_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot apply invalid patch. Syntax validation failed: {rem.validation_message}"
            )
        rem.status = "applied"
        rem.applied_at = datetime.datetime.utcnow()
        if finding:
            finding.status = "resolved"
        db.commit()
        return RemediationActionResponse(
            id=rem.id,
            finding_id=rem.finding_id,
            status=rem.status,
            message="Patch safely applied to code snapshot. Finding marked as resolved.",
            applied_at=rem.applied_at,
            pre_fix_snapshot=rem.pre_fix_snapshot,
            active_code=rem.proposed_code
        )

    elif action == "rollback":
        rem.status = "rolled_back"
        if finding:
            finding.status = "open"
        db.commit()
        return RemediationActionResponse(
            id=rem.id,
            finding_id=rem.finding_id,
            status=rem.status,
            message="Rollback executed. Original pre-fix snapshot restored.",
            applied_at=None,
            pre_fix_snapshot=rem.pre_fix_snapshot,
            active_code=rem.original_code
        )

    elif action == "reject":
        rem.status = "rejected"
        db.commit()
        return RemediationActionResponse(
            id=rem.id,
            finding_id=rem.finding_id,
            status=rem.status,
            message="Remediation proposal rejected by developer.",
            applied_at=None,
            pre_fix_snapshot=rem.pre_fix_snapshot,
            active_code=rem.original_code
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be: approve, apply, rollback, or reject")
