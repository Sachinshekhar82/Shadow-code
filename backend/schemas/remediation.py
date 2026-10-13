from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class RemediationActionRequest(BaseModel):
    action: str = Field(..., description="approve, apply, rollback, reject")

class RemediationActionResponse(BaseModel):
    id: str
    finding_id: str
    status: str
    message: str
    applied_at: Optional[datetime] = None
    pre_fix_snapshot: Optional[str] = None
    active_code: str
