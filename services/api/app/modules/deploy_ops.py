"""
NORA-DEPLOY: Database operations for the Deployment model (Phase 4).
"""
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.deployment import Deployment


async def create_deployment(
    db: AsyncSession,
    deployment_id: str,
    job_id: str,
    user_id: int,
    name: str,
    stack: Optional[str] = None,
    project_path: Optional[str] = None,
    files_count: int = 0,
) -> Deployment:
    deployment = Deployment(
        deployment_id=deployment_id,
        job_id=job_id,
        user_id=user_id,
        name=name,
        stack=stack,
        status="pending",
        project_path=project_path,
        files_count=files_count,
    )
    db.add(deployment)
    await db.flush()
    return deployment


async def get_deployment(db: AsyncSession, deployment_id: str) -> Optional[Deployment]:
    result = await db.execute(
        select(Deployment).where(Deployment.deployment_id == deployment_id)
    )
    return result.scalar_one_or_none()


async def list_deployments(
    db: AsyncSession,
    user_id: Optional[int] = None,
    limit: int = 50,
) -> list:
    query = select(Deployment).order_by(Deployment.created_at.desc()).limit(limit)
    if user_id is not None:
        query = query.where(Deployment.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()


async def update_deployment_status(
    db: AsyncSession,
    deployment_id: str,
    status: str,
    public_url: Optional[str] = None,
    error: Optional[str] = None,
) -> None:
    values: dict = {
        "status": status,
        "updated_at": datetime.now(timezone.utc),
    }
    if public_url is not None:
        values["public_url"] = public_url
    if error is not None:
        values["error"] = error
    await db.execute(
        update(Deployment).where(Deployment.deployment_id == deployment_id).values(**values)
    )
    await db.flush()
