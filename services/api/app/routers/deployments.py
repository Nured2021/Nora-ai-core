"""
NORA Phase 4 — Deployments REST API

POST /api/deployments          — publish a completed build job
GET  /api/deployments          — list deployments (ADMIN/DEVELOPER see all; VIEWER own)
GET  /api/deployments/{id}     — get single deployment
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.deployment import DeploymentCreate, DeploymentOut
from app.modules.deploy_ops import create_deployment, get_deployment, list_deployments
from app.modules.nora_ops import get_job
from app.worker_client import dispatch_publish_job
from app.core.websocket import manager

router = APIRouter(prefix="/api/deployments", tags=["deployments"])


@router.post("/", response_model=DeploymentOut)
async def publish_deployment(
    body: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail=f"Job must be completed (current: {job.status})")
    if not job.result or not job.result.get("project_path"):
        raise HTTPException(status_code=400, detail="Job has no built project to deploy")

    result = job.result
    deployment_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"
    name = result.get("plan", {}).get("name", job.input_text[:60])
    stack = (result.get("plan", {}).get("stack") or ["unknown"])[0] if result.get("plan") else None

    deployment = await create_deployment(
        db=db,
        deployment_id=deployment_id,
        job_id=body.job_id,
        user_id=current_user.id,
        name=name,
        stack=stack,
        project_path=result.get("project_path"),
        files_count=len(result.get("files_created", [])),
    )

    celery_task_id = dispatch_publish_job(
        deployment_id=deployment_id,
        job_id=body.job_id,
        project_path=result.get("project_path", ""),
        stack=stack or "unknown",
        user_id=current_user.id,
    )

    await manager.broadcast(body.job_id, {
        "type": "deploy_started",
        "deployment_id": deployment_id,
        "job_id": body.job_id,
        "name": name,
        "status": "deploying",
        "message": f"Publishing '{name}' — deployment {deployment_id}",
    })

    return DeploymentOut.model_validate(deployment)


@router.get("/", response_model=List[DeploymentOut])
async def get_deployments(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "VIEWER":
        items = await list_deployments(db, user_id=current_user.id, limit=limit)
    else:
        items = await list_deployments(db, limit=limit)
    return [DeploymentOut.model_validate(d) for d in items]


@router.get("/{deployment_id}", response_model=DeploymentOut)
async def get_deployment_detail(
    deployment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dep = await get_deployment(db, deployment_id)
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if current_user.role == "VIEWER" and dep.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return DeploymentOut.model_validate(dep)
