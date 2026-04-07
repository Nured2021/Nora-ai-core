"""
NORA Phase 6 — Business Logic Module.

Handles: organizations, workspaces, team invites, audit logging,
backups, deploy environments, health checks, analytics.
"""
import uuid
import time
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.phase6 import (
    Organization, Workspace, TeamMember, AuditLog, BackupRecord, DeployEnvironment,
)
from app.models.user import User
from app.models.job import Job
from app.models.deployment import Deployment


# ─── Organization ─────────────────────────────────────────────────────────────

async def create_organization(db: AsyncSession, owner_id: int, name: str, slug: str, plan: str = "free") -> Organization:
    org = Organization(name=name, slug=slug, owner_id=owner_id, plan=plan)
    db.add(org)
    await db.flush()
    await write_audit(db, owner_id, "org_create", "organization", str(org.id), f"Created org: {name}")
    return org


async def list_organizations(db: AsyncSession, owner_id: Optional[int] = None) -> List[Organization]:
    q = select(Organization).where(Organization.active == True)
    if owner_id:
        q = q.where(Organization.owner_id == owner_id)
    result = await db.execute(q.order_by(Organization.created_at.desc()))
    return list(result.scalars().all())


# ─── Workspace ────────────────────────────────────────────────────────────────

async def create_workspace(
    db: AsyncSession,
    owner_id: int,
    name: str,
    slug: str,
    description: Optional[str] = None,
    template: Optional[str] = None,
    org_id: Optional[int] = None,
) -> Workspace:
    ws = Workspace(
        name=name, slug=slug, owner_id=owner_id,
        description=description, template=template, org_id=org_id,
    )
    db.add(ws)
    await db.flush()
    await write_audit(db, owner_id, "workspace_create", "workspace", str(ws.id), f"Created workspace: {name}")
    return ws


async def list_workspaces(db: AsyncSession, owner_id: Optional[int] = None) -> List[Workspace]:
    q = select(Workspace).where(Workspace.active == True)
    if owner_id:
        q = q.where(Workspace.owner_id == owner_id)
    result = await db.execute(q.order_by(Workspace.created_at.desc()))
    return list(result.scalars().all())


# ─── Team ─────────────────────────────────────────────────────────────────────

async def invite_team_member(
    db: AsyncSession,
    invited_by_id: int,
    username: str,
    role: str = "VIEWER",
    org_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
) -> dict:
    result = await db.execute(select(User).where(User.username == username))
    target = result.scalar_one_or_none()
    if not target:
        return {"success": False, "message": f"User '{username}' not found"}

    member = TeamMember(
        org_id=org_id,
        workspace_id=workspace_id,
        user_id=target.id,
        invited_by_id=invited_by_id,
        role=role,
        status="active",
    )
    db.add(member)
    await db.flush()
    await write_audit(db, invited_by_id, "team_invite", "team_member", str(member.id),
                      f"Invited {username} as {role}")
    return {"success": True, "member_id": member.id, "message": f"Invited {username} ({role})"}


async def list_team_members(
    db: AsyncSession,
    org_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
) -> List[TeamMember]:
    q = select(TeamMember)
    if org_id:
        q = q.where(TeamMember.org_id == org_id)
    if workspace_id:
        q = q.where(TeamMember.workspace_id == workspace_id)
    result = await db.execute(q.order_by(TeamMember.created_at.desc()))
    return list(result.scalars().all())


# ─── Audit ────────────────────────────────────────────────────────────────────

async def write_audit(
    db: AsyncSession,
    user_id: int,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    status: str = "success",
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        status=status,
    )
    db.add(entry)
    await db.flush()
    return entry


async def get_audit_log(db: AsyncSession, limit: int = 100) -> List[AuditLog]:
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


# ─── Backup ───────────────────────────────────────────────────────────────────

async def create_backup_record(
    db: AsyncSession,
    triggered_by_id: int,
    workspace_id: Optional[int] = None,
    note: Optional[str] = None,
) -> BackupRecord:
    backup_id = f"BCK-{uuid.uuid4().hex[:8].upper()}"
    record = BackupRecord(
        backup_id=backup_id,
        triggered_by_id=triggered_by_id,
        workspace_id=workspace_id,
        status="pending",
        note=note,
    )
    db.add(record)
    await db.flush()
    await write_audit(db, triggered_by_id, "backup_run", "backup", backup_id, note or "Backup initiated")
    return record


async def list_backups(db: AsyncSession, limit: int = 50) -> List[BackupRecord]:
    result = await db.execute(
        select(BackupRecord).order_by(BackupRecord.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


async def get_latest_backup(db: AsyncSession) -> Optional[BackupRecord]:
    result = await db.execute(
        select(BackupRecord)
        .where(BackupRecord.status == "completed")
        .order_by(BackupRecord.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def update_backup_status(
    db: AsyncSession, backup_id: str, status: str, size_mb: Optional[float] = None, location: Optional[str] = None
) -> Optional[BackupRecord]:
    result = await db.execute(select(BackupRecord).where(BackupRecord.backup_id == backup_id))
    record = result.scalar_one_or_none()
    if record:
        record.status = status
        if size_mb is not None:
            record.size_mb = size_mb
        if location is not None:
            record.location = location
        if status == "completed":
            record.completed_at = datetime.now(timezone.utc)
        await db.flush()
    return record


# ─── Deploy Environment ───────────────────────────────────────────────────────

async def create_environment(
    db: AsyncSession,
    owner_id: int,
    name: str,
    env_type: str = "staging",
    workspace_id: Optional[int] = None,
) -> DeployEnvironment:
    env = DeployEnvironment(
        name=name, env_type=env_type, owner_id=owner_id, workspace_id=workspace_id, status="inactive"
    )
    db.add(env)
    await db.flush()
    await write_audit(db, owner_id, "env_create", "environment", str(env.id), f"Created {env_type} env: {name}")
    return env


async def list_environments(db: AsyncSession, owner_id: Optional[int] = None) -> List[DeployEnvironment]:
    q = select(DeployEnvironment)
    if owner_id:
        q = q.where(DeployEnvironment.owner_id == owner_id)
    result = await db.execute(q.order_by(DeployEnvironment.created_at.desc()))
    return list(result.scalars().all())


async def promote_environment(
    db: AsyncSession, env_id: int, target: str, user_id: int, note: Optional[str] = None
) -> dict:
    result = await db.execute(select(DeployEnvironment).where(DeployEnvironment.id == env_id))
    env = result.scalar_one_or_none()
    if not env:
        return {"promoted": False, "environment_id": env_id, "target": target,
                "message": f"Environment {env_id} not found"}

    env.promoted_from = env.env_type
    env.env_type = target
    env.status = "active"
    await db.flush()
    msg = f"Environment '{env.name}' promoted from {env.promoted_from} → {target}"
    await write_audit(db, user_id, "env_promote", "environment", str(env_id), note or msg)
    return {"promoted": True, "environment_id": env_id, "target": target, "message": msg}


# ─── Health Check ─────────────────────────────────────────────────────────────

async def run_health_check(db: AsyncSession) -> dict:
    services = []
    t0 = time.monotonic()
    try:
        await db.execute(text("SELECT 1"))
        services.append({"name": "database", "status": "ok", "latency_ms": round((time.monotonic() - t0) * 1000, 2)})
    except Exception as e:
        services.append({"name": "database", "status": "error", "latency_ms": 0.0, "details": str(e)})

    # Count org/workspace/team rows
    orgs = (await db.execute(select(func.count()).where(Organization.active == True))).scalar_one()
    workspaces = (await db.execute(select(func.count()).where(Workspace.active == True))).scalar_one()
    members = (await db.execute(select(func.count(TeamMember.id)))).scalar_one()
    audits = (await db.execute(
        select(func.count(AuditLog.id))
    )).scalar_one()
    backups = (await db.execute(
        select(func.count()).where(BackupRecord.status == "completed")
    )).scalar_one()

    overall = "ok" if all(s["status"] == "ok" for s in services) else "degraded"
    return {
        "overall": overall,
        "services": services,
        "orgs": orgs,
        "workspaces": workspaces,
        "team_members": members,
        "recent_audits": audits,
        "backups_completed": backups,
        "checked_at": datetime.now(timezone.utc),
    }


# ─── Analytics ────────────────────────────────────────────────────────────────

async def get_analytics(db: AsyncSession) -> dict:
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar_one()
    completed_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == "completed"))).scalar_one()
    failed_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == "failed"))).scalar_one()
    total_deps = (await db.execute(select(func.count(Deployment.id)))).scalar_one()
    live_deps = (await db.execute(select(func.count(Deployment.id)).where(Deployment.status == "live"))).scalar_one()

    # Command breakdown from brain memories (layer 1 = command history)
    from app.models.brain import BrainMemory
    cmd_rows = (await db.execute(
        select(BrainMemory.value, func.count(BrainMemory.id).label("cnt"))
        .where(BrainMemory.layer == 1)
        .group_by(BrainMemory.value)
        .order_by(func.count(BrainMemory.id).desc())
        .limit(10)
    )).fetchall()
    top_commands = [{"command": r.value, "count": r.cnt} for r in cmd_rows]
    total_cmds = sum(r["count"] for r in top_commands)

    # Jobs per day (last 7 days) — simple approach using created_at
    day_rows = (await db.execute(
        text("""
            SELECT date(created_at) AS day, count(*) AS cnt
            FROM jobs
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY day ORDER BY day
        """)
    )).fetchall()
    jobs_7d = [{"day": str(r[0]), "count": r[1]} for r in day_rows]

    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "total_deployments": total_deps,
        "live_deployments": live_deps,
        "total_commands": total_cmds,
        "top_commands": top_commands,
        "jobs_last_7d": jobs_7d,
        "generated_at": datetime.now(timezone.utc),
    }
