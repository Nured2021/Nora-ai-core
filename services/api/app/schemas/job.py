from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class JobCreate(BaseModel):
    input_text: str


class JobOut(BaseModel):
    id: int
    job_id: str
    command: str
    input_text: str
    status: str
    celery_task_id: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JobLogOut(BaseModel):
    id: int
    job_id: str
    level: str
    message: str
    step: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CommandInput(BaseModel):
    input_text: str
