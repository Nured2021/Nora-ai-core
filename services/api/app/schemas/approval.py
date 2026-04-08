from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ApprovalRequestCreate(BaseModel):
    job_id: Optional[str] = None
    action: str
    details: str


class ApprovalDecision(BaseModel):
    decision: str  # "approved" | "rejected" | "modified"
    note: Optional[str] = None


class ApprovalRequestOut(BaseModel):
    id: int
    request_id: str
    job_id: Optional[str] = None
    requested_by_id: int
    action: str
    details: str
    status: str
    decision_by_id: Optional[int] = None
    decision_note: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
