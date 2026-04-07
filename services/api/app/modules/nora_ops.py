"""
NORA-OPS: Watches jobs. Fixes failures. Never stops.
Job lifecycle management and monitoring.
"""
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.job import Job, JobLog


async def get_job(db: AsyncSession, job_id: str) -> Optional[Job]:
    result = await db.execute(select(Job).where(Job.job_id == job_id))
    return result.scalar_one_or_none()


async def update_job_status(
    db: AsyncSession,
    job_id: str,
    status: str,
    celery_task_id: Optional[str] = None,
    result: Optional[dict] = None,
    error: Optional[str] = None,
):
    updates = {"status": status}
    if celery_task_id:
        updates["celery_task_id"] = celery_task_id
    if result is not None:
        updates["result"] = result
    if error is not None:
        updates["error"] = error
    if status == "running":
        updates["started_at"] = datetime.now(timezone.utc)
    if status in ("completed", "failed", "cancelled"):
        updates["completed_at"] = datetime.now(timezone.utc)

    await db.execute(update(Job).where(Job.job_id == job_id).values(**updates))
    await db.flush()


async def append_log(
    db: AsyncSession,
    job_id: str,
    message: str,
    level: str = "INFO",
    step: Optional[int] = None,
):
    log = JobLog(job_id=job_id, message=message, level=level, step=step)
    db.add(log)
    await db.flush()
    return log


async def get_job_logs(db: AsyncSession, job_id: str) -> list:
    result = await db.execute(
        select(JobLog).where(JobLog.job_id == job_id).order_by(JobLog.created_at)
    )
    return result.scalars().all()


async def list_jobs(db: AsyncSession, user_id: Optional[int] = None, limit: int = 50) -> list:
    query = select(Job).order_by(Job.created_at.desc()).limit(limit)
    if user_id is not None:
        query = query.where(Job.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()
