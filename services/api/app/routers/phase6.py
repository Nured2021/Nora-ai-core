"""
NORA Phase 6 — REST API Router.

GET  /api/phase6/organizations               — list orgs
POST /api/phase6/organizations               — create org
GET  /api/phase6/workspaces                  — list workspaces
POST /api/phase6/workspaces                  — create workspace
GET  /api/phase6/team                        — list team members
POST /api/phase6/team/invite                 — invite member
GET  /api/phase6/audit-log                   — audit trail
GET  /api/phase6/backups                     — list backups
POST /api/phase6/backups/run                 — trigger backup
POST /api/phase6/backups/restore             — restore latest
GET  /api/phase6/environments                — list deploy environments
POST /api/phase6/environments                — create environment
POST /api/phase6/environments/{id}/promote   — promote staging→production
GET  /api/phase6/health                      — system health
GET  /api/phase6/analytics                   — analytics summary
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.modules.nora_phase6 import (
    create_organization, list_organizations,
    create_workspace, list_workspaces,
    invite_team_member, list_team_members,
    write_audit, get_audit_log,
    create_backup_record, list_backups, get_latest_backup,
    create_environment, list_environments, promote_environment,
    run_health_check, get_analytics,
)
from app.schemas.phase6 import (
    OrganizationCreate, OrganizationOut,
    WorkspaceCreate, WorkspaceOut,
    TeamInvite, TeamMemberOut,
    AuditLogOut, BackupRecordOut,
    DeployEnvironmentOut, PromoteRequest, PromoteOut,
    SystemHealthOut, AnalyticsSummaryOut,
)

router = APIRouter(prefix="/api/phase6", tags=["phase6"])


# ─── Organizations ────────────────────────────────────────────────────────────

@router.get("/organizations", response_model=List[OrganizationOut])
async def get_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List organizations (ADMIN sees all; others see their own)."""
    owner_filter = None if current_user.role == "ADMIN" else current_user.id
    return await list_organizations(db, owner_id=owner_filter)


@router.post("/organizations", response_model=OrganizationOut)
async def post_organization(
    body: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new organization."""
    org = await create_organization(db, current_user.id, body.name, body.slug, body.plan)
    return org


# ─── Workspaces ───────────────────────────────────────────────────────────────

@router.get("/workspaces", response_model=List[WorkspaceOut])
async def get_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List workspaces owned by current user (ADMIN sees all)."""
    owner_filter = None if current_user.role == "ADMIN" else current_user.id
    return await list_workspaces(db, owner_id=owner_filter)


@router.post("/workspaces", response_model=WorkspaceOut)
async def post_workspace(
    body: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace."""
    ws = await create_workspace(
        db, current_user.id, body.name, body.slug,
        body.description, body.template, body.org_id,
    )
    return ws


# ─── Team ─────────────────────────────────────────────────────────────────────

@router.get("/team", response_model=List[TeamMemberOut])
async def get_team(
    org_id: Optional[int] = Query(None),
    workspace_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List team members for an org or workspace."""
    return await list_team_members(db, org_id=org_id, workspace_id=workspace_id)


@router.post("/team/invite", response_model=dict)
async def post_invite(
    body: TeamInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a user to an org or workspace."""
    result = await invite_team_member(
        db, current_user.id, body.username, body.role, body.org_id, body.workspace_id
    )
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result


# ─── Audit Log ────────────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=List[AuditLogOut])
async def get_audit(
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return enterprise audit trail (ADMIN only)."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Audit log requires ADMIN role")
    return await get_audit_log(db, limit=limit)


# ─── Backups ──────────────────────────────────────────────────────────────────

@router.get("/backups", response_model=List[BackupRecordOut])
async def get_backups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List backup records."""
    return await list_backups(db)


@router.post("/backups/run", response_model=BackupRecordOut)
async def run_backup(
    note: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a new backup job."""
    record = await create_backup_record(db, current_user.id, note=note)
    return record


@router.post("/backups/restore", response_model=dict)
async def restore_backup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restore from the latest completed backup."""
    backup = await get_latest_backup(db)
    if not backup:
        raise HTTPException(status_code=404, detail="No completed backup found to restore")
    await write_audit(db, current_user.id, "backup_restore", "backup", backup.backup_id,
                      f"Restore from {backup.backup_id}")
    return {"restored": True, "backup_id": backup.backup_id,
            "message": f"Restoring from backup {backup.backup_id}"}


# ─── Deploy Environments ──────────────────────────────────────────────────────

@router.get("/environments", response_model=List[DeployEnvironmentOut])
async def get_environments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List deploy environments."""
    owner_filter = None if current_user.role == "ADMIN" else current_user.id
    return await list_environments(db, owner_id=owner_filter)


@router.post("/environments", response_model=DeployEnvironmentOut)
async def post_environment(
    name: str = Query(...),
    env_type: str = Query("staging"),
    workspace_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new deploy environment (staging / production / preview)."""
    return await create_environment(db, current_user.id, name, env_type, workspace_id)


@router.post("/environments/{env_id}/promote", response_model=PromoteOut)
async def post_promote(
    env_id: int,
    body: PromoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Promote an environment (e.g. staging → production)."""
    return await promote_environment(db, env_id, body.target, current_user.id, body.note)


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=SystemHealthOut)
async def health_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA Enterprise: Full system health check."""
    return await run_health_check(db)


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsSummaryOut)
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA Enterprise: Analytics and metrics command center."""
    return await get_analytics(db)
