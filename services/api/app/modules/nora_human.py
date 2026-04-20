"""
NORA-HUMAN: Asks user for approval. Takes corrections.
HumanLoop gate for critical actions.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.approval import ApprovalRequest


APPROVAL_TIMEOUT_MINUTES = 30
# Commands that require HumanLoop approval before execution
REQUIRES_APPROVAL_COMMANDS = ["/deploy"]


def needs_approval(command: str) -> bool:
    return command in REQUIRES_APPROVAL_COMMANDS


async def create_approval_request(
    db: AsyncSession,
    job_id: Optional[str],
    requested_by_id: int,
    action: str,
    details: str,
) -> ApprovalRequest:
    request_id = f"APPROVAL-{uuid.uuid4().hex[:8].upper()}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=APPROVAL_TIMEOUT_MINUTES)
    req = ApprovalRequest(
        request_id=request_id,
        job_id=job_id,
        requested_by_id=requested_by_id,
        action=action,
        details=details,
        status="pending",
        expires_at=expires_at,
    )
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


async def decide_approval(
    db: AsyncSession,
    request_id: str,
    decision: str,
    decision_by_id: int,
    note: Optional[str] = None,
) -> Optional[ApprovalRequest]:
    result = await db.execute(
        select(ApprovalRequest).where(ApprovalRequest.request_id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        return None
    if req.status != "pending":
        return req
    req.status = decision
    req.decision_by_id = decision_by_id
    req.decision_note = note
    req.decided_at = datetime.now(timezone.utc)
    await db.flush()
    return req


async def get_pending_approvals(db: AsyncSession) -> list:
    result = await db.execute(
        select(ApprovalRequest)
        .where(ApprovalRequest.status == "pending")
        .order_by(ApprovalRequest.created_at.desc())
    )
    return result.scalars().all()


async def get_approval(db: AsyncSession, request_id: str) -> Optional[ApprovalRequest]:
    result = await db.execute(
        select(ApprovalRequest).where(ApprovalRequest.request_id == request_id)
    )
    return result.scalar_one_or_none()
