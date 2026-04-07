from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.approval import ApprovalRequestOut, ApprovalDecision, ApprovalRequestCreate
from app.modules.nora_human import (
    create_approval_request,
    decide_approval,
    get_pending_approvals,
    get_approval,
)
from app.core.websocket import manager

router = APIRouter(prefix="/api/humanloop", tags=["humanloop"])


@router.get("/pending", response_model=List[ApprovalRequestOut])
async def list_pending(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "DEVELOPER")),
):
    items = await get_pending_approvals(db)
    return [ApprovalRequestOut.model_validate(i) for i in items]


@router.post("/", response_model=ApprovalRequestOut)
async def request_approval(
    body: ApprovalRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await create_approval_request(
        db=db,
        job_id=body.job_id,
        requested_by_id=current_user.id,
        action=body.action,
        details=body.details,
    )
    return ApprovalRequestOut.model_validate(req)


@router.post("/{request_id}/decide", response_model=ApprovalRequestOut)
async def decide(
    request_id: str,
    body: ApprovalDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "DEVELOPER")),
):
    if body.decision not in ("approved", "rejected", "modified"):
        raise HTTPException(status_code=400, detail="Decision must be approved, rejected, or modified")

    req = await decide_approval(
        db=db,
        request_id=request_id,
        decision=body.decision,
        decision_by_id=current_user.id,
        note=body.note,
    )
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    # If approved, proceed with the job (trigger worker)
    if body.decision == "approved" and req.job_id:
        from app.worker_client import dispatch_deploy_job
        from app.modules.nora_ops import update_job_status, get_job
        job = await get_job(db, req.job_id)
        if job:
            celery_task_id = dispatch_deploy_job(req.job_id, job.input_text, job.user_id)
            await update_job_status(db, req.job_id, "queued", celery_task_id=celery_task_id)
            await manager.broadcast(req.job_id, {
                "type": "job_approved",
                "job_id": req.job_id,
                "request_id": request_id,
                "status": "queued",
                "message": f"Deployment approved by {current_user.username}",
            })

    if body.decision == "rejected" and req.job_id:
        from app.modules.nora_ops import update_job_status
        await update_job_status(db, req.job_id, "cancelled", error="Rejected by HumanLoop")
        await manager.broadcast(req.job_id, {
            "type": "job_rejected",
            "job_id": req.job_id,
            "request_id": request_id,
            "status": "cancelled",
            "message": f"Deployment rejected by {current_user.username}",
        })

    return ApprovalRequestOut.model_validate(req)


@router.get("/{request_id}", response_model=ApprovalRequestOut)
async def get_approval_detail(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await get_approval(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    return ApprovalRequestOut.model_validate(req)
