"""
NORA Phase 6 — Pydantic schemas (FastAPI I/O).
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ─── Organization ─────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"


class OrganizationOut(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    plan: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Workspace ────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    template: Optional[str] = None
    org_id: Optional[int] = None


class WorkspaceOut(BaseModel):
    id: int
    name: str
    slug: str
    org_id: Optional[int]
    owner_id: int
    description: Optional[str]
    template: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Team Member ──────────────────────────────────────────────────────────────

class TeamInvite(BaseModel):
    username: str
    role: str = "VIEWER"
    org_id: Optional[int] = None
    workspace_id: Optional[int] = None


class TeamMemberOut(BaseModel):
    id: int
    org_id: Optional[int]
    workspace_id: Optional[int]
    user_id: int
    invited_by_id: int
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Backup ───────────────────────────────────────────────────────────────────

class BackupRecordOut(BaseModel):
    id: int
    backup_id: str
    triggered_by_id: int
    workspace_id: Optional[int]
    status: str
    size_mb: Optional[float]
    location: Optional[str]
    note: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Deploy Environment ───────────────────────────────────────────────────────

class DeployEnvironmentOut(BaseModel):
    id: int
    name: str
    env_type: str
    workspace_id: Optional[int]
    owner_id: int
    url: Optional[str]
    status: str
    promoted_from: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Health ───────────────────────────────────────────────────────────────────

class ServiceHealth(BaseModel):
    name: str
    status: str
    latency_ms: float
    details: Optional[str] = None


class SystemHealthOut(BaseModel):
    overall: str
    services: List[ServiceHealth]
    orgs: int
    workspaces: int
    team_members: int
    recent_audits: int
    backups_completed: int
    checked_at: datetime


# ─── Analytics ────────────────────────────────────────────────────────────────

class AnalyticsSummaryOut(BaseModel):
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    total_deployments: int
    live_deployments: int
    total_commands: int
    top_commands: List[dict]
    jobs_last_7d: List[dict]
    generated_at: datetime


# ─── Promotion ────────────────────────────────────────────────────────────────

class PromoteRequest(BaseModel):
    environment_id: int
    target: str = "production"
    note: Optional[str] = None


class PromoteOut(BaseModel):
    promoted: bool
    environment_id: int
    target: str
    message: str
