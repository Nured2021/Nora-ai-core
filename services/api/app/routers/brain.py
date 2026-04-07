from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.brain import Tactic, BrainMemory
from app.schemas.brain import TacticCreate, TacticOut, BrainMemoryOut
from app.modules.nora_brain import recall_memory, BRAIN_LAYERS
from app.worker_client import dispatch_build_job
from app.modules.nora_ops import update_job_status
from app.core.websocket import manager
from app.models.job import Job
import uuid

router = APIRouter(prefix="/api/brain", tags=["brain"])


@router.get("/layers", response_model=dict)
async def get_layers(current_user: User = Depends(get_current_user)):
    return {"layers": BRAIN_LAYERS}


@router.get("/memories", response_model=List[BrainMemoryOut])
async def get_memories(
    layer: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memories = await recall_memory(db, current_user.id, layer)
    return [BrainMemoryOut.model_validate(m) for m in memories]


@router.get("/tactics", response_model=List[TacticOut])
async def list_tactics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Tactic).order_by(Tactic.name))
    return [TacticOut.model_validate(t) for t in result.scalars().all()]


@router.post("/tactics", response_model=TacticOut)
async def create_tactic(
    body: TacticCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tactic = Tactic(
        name=body.name,
        description=body.description,
        steps=body.steps,
        created_by_id=current_user.id,
    )
    db.add(tactic)
    await db.flush()
    await db.commit()
    await db.refresh(tactic)
    return TacticOut.model_validate(tactic)


@router.post("/tactics/{tactic_id}/run", response_model=dict)
async def run_tactic(
    tactic_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Tactic).where(Tactic.id == tactic_id))
    tactic = result.scalar_one_or_none()
    if not tactic:
        raise HTTPException(status_code=404, detail="Tactic not found")

    tactic.run_count += 1
    job_ids = []
    for step in tactic.steps:
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            job_id=job_id,
            user_id=current_user.id,
            command="/build",
            input_text=str(step),
            status="queued",
        )
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_build_job(job_id, str(step), current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        job_ids.append(job_id)
        await manager.broadcast(job_id, {
            "type": "job_created",
            "job_id": job_id,
            "command": "/build",
            "input_text": str(step),
            "status": "queued",
            "tactic": tactic.name,
        })

    return {"tactic": tactic.name, "job_ids": job_ids}
