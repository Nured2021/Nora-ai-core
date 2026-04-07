import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.job import CommandInput, JobOut, JobLogOut
from app.modules.nora_cmd import parse_command
from app.modules.nora_ops import get_job, update_job_status, get_job_logs, list_jobs
from app.modules.nora_brain import record_command_history
from app.modules.nora_human import create_approval_request
from app.core.websocket import manager

router = APIRouter(prefix="/api/commands", tags=["commands"])


@router.post("/", response_model=dict)
async def dispatch_command(
    body: CommandInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    command, cleaned_input, job_id_hint = parse_command(body.input_text)

    await record_command_history(db, current_user.id, command, body.input_text)

    # /status
    if command == "/status":
        if job_id_hint:
            job = await get_job(db, job_id_hint)
            if not job:
                # try numeric id
                try:
                    result = await db.execute(select(Job).where(Job.id == int(job_id_hint)))
                    job = result.scalar_one_or_none()
                except Exception:
                    pass
            if job:
                return {"type": "status", "job": JobOut.model_validate(job).model_dump()}
        jobs = await list_jobs(db, limit=10)
        return {"type": "status", "jobs": [JobOut.model_validate(j).model_dump() for j in jobs]}

    # /stop
    if command == "/stop":
        target_id = job_id_hint or cleaned_input.strip()
        job = await get_job(db, target_id)
        if not job:
            return {"type": "error", "message": f"Job '{target_id}' not found"}
        if job.status in ("completed", "failed", "cancelled"):
            return {"type": "info", "message": f"Job {target_id} already in status: {job.status}"}
        # Revoke celery task
        if job.celery_task_id:
            from app.worker_client import celery_app
            celery_app.control.revoke(job.celery_task_id, terminate=True)
        await update_job_status(db, target_id, "cancelled")
        await manager.broadcast(target_id, {
            "type": "job_update",
            "job_id": target_id,
            "status": "cancelled",
            "message": f"Job {target_id} cancelled by user",
        })
        return {"type": "cancelled", "job_id": target_id}

    # /deploy requires HumanLoop approval
    if command == "/deploy":
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            job_id=job_id,
            user_id=current_user.id,
            command=command,
            input_text=body.input_text,
            status="awaiting_approval",
        )
        db.add(job)
        await db.flush()

        approval = await create_approval_request(
            db=db,
            job_id=job_id,
            requested_by_id=current_user.id,
            action="DEPLOY",
            details=body.input_text,
        )
        await manager.broadcast(job_id, {
            "type": "approval_required",
            "job_id": job_id,
            "request_id": approval.request_id,
            "action": "DEPLOY",
            "details": body.input_text,
        })
        return {
            "type": "approval_required",
            "job_id": job_id,
            "request_id": approval.request_id,
            "message": "Deploy requires HumanLoop approval",
        }

    # /build or chat build → queue AI build job (Phase 2: NORA-ARCH + NORA-CODE)
    if command in ("/build", "chat"):
        from app.worker_client import dispatch_ai_build_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            job_id=job_id,
            user_id=current_user.id,
            command="/build",
            input_text=body.input_text,
            status="queued",
        )
        db.add(job)
        await db.flush()

        # Dispatch AI build task (no-stop: runs even if browser closes)
        celery_task_id = dispatch_ai_build_job(job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)

        await manager.broadcast(job_id, {
            "type": "job_created",
            "job_id": job_id,
            "command": "/build",
            "input_text": body.input_text,
            "status": "queued",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued"}

    return {"type": "unknown", "message": f"Unrecognized command: {command}"}
