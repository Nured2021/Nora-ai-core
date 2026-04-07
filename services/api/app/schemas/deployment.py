from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DeploymentCreate(BaseModel):
    job_id: str


class DeploymentOut(BaseModel):
    id: int
    deployment_id: str
    job_id: str
    user_id: int
    name: str
    stack: Optional[str] = None
    status: str
    public_url: Optional[str] = None
    project_path: Optional[str] = None
    files_count: int
    error: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
