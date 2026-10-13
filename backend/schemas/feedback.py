from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class FeedbackCreateRequest(BaseModel):
    decision: str = Field(..., description="accepted, rejected, overridden, false_positive")
    reason: Optional[str] = Field(default="", description="Developer justification or context")

class FeedbackResponse(BaseModel):
    id: str
    finding_id: str
    scan_id: str
    repository_id: Optional[str] = None
    rule_id: str
    decision: str
    reason: Optional[str] = None
    previous_severity: str
    adjusted_severity: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
