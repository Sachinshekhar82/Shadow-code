from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import FeedbackDecision, AdaptiveProfile, Repository
from backend.schemas.feedback import FeedbackResponse

router = APIRouter(prefix="/api/adaptive-memory", tags=["Adaptive Memory"])

@router.get("/decisions", response_model=List[FeedbackResponse])
def get_feedback_history(
    repository_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(FeedbackDecision)
    if repository_id:
        query = query.filter(FeedbackDecision.repository_id == repository_id)
    return query.order_by(FeedbackDecision.created_at.desc()).limit(limit).all()

@router.get("/profiles")
def get_adaptive_profiles(
    repository_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AdaptiveProfile)
    if repository_id:
        query = query.filter(AdaptiveProfile.repository_id == repository_id)
    profiles = query.all()

    total_overrides = sum(p.override_count for p in profiles)
    total_fps = sum(p.false_positive_count for p in profiles)
    total_accepts = sum(p.accept_count for p in profiles)

    return {
        "repository_id": repository_id or "all",
        "total_rules_adapted": len(profiles),
        "total_overrides": total_overrides,
        "total_false_positives": total_fps,
        "total_accepts": total_accepts,
        "profiles": [
            {
                "rule_id": p.rule_id,
                "category": p.category,
                "overrides": p.override_count,
                "false_positives": p.false_positive_count,
                "accepts": p.accept_count,
                "weight_adjustment": p.weight_adjustment,
                "last_updated": p.last_updated.isoformat()
            }
            for p in profiles
        ]
    }

@router.post("/reset")
def reset_adaptive_memory(
    repository_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Reset adaptive learning weights for a specific repository or globally."""
    query = db.query(AdaptiveProfile)
    if repository_id:
        query = query.filter(AdaptiveProfile.repository_id == repository_id)
    deleted_profiles = query.delete(synchronize_session=False)

    db.commit()
    return {
        "status": "success",
        "message": f"Adaptive memory reset successfully. Removed {deleted_profiles} learned profile(s)."
    }
