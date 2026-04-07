from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.job import JobOut, JobLogOut
from app.modules.nora_ops import get_job, get_job_logs, list_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/", response_model=List[JobOut])
async def get_jobs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ADMIN/DEVELOPER see all jobs; VIEWER sees own
    if current_user.role == "VIEWER":
        jobs = await list_jobs(db, user_id=current_user.id, limit=limit)
    else:
        jobs = await list_jobs(db, limit=limit)
    return [JobOut.model_validate(j) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
async def get_job_detail(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role == "VIEWER" and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return JobOut.model_validate(job)


@router.get("/{job_id}/logs", response_model=List[JobLogOut])
async def get_job_log_entries(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    logs = await get_job_logs(db, job_id)
    return [JobLogOut.model_validate(log) for log in logs]
