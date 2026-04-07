import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.job import CommandInput, JobOut, JobLogOut
from app.modules.nora_cmd import parse_command
from app.modules.nora_ops import get_job, update_job_status, get_job_logs, list_jobs
from app.modules.nora_brain import record_command_history
from app.modules.nora_human import create_approval_request
from app.core.websocket import manager

router = APIRouter(prefix="/api/commands", tags=["commands"])


@router.post("/", response_model=dict)
async def dispatch_command(
    body: CommandInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    command, cleaned_input, job_id_hint = parse_command(body.input_text)

    await record_command_history(db, current_user.id, command, body.input_text)

    # /status
    if command == "/status":
        if job_id_hint:
            job = await get_job(db, job_id_hint)
            if not job:
                # try numeric id
                try:
                    result = await db.execute(select(Job).where(Job.id == int(job_id_hint)))
                    job = result.scalar_one_or_none()
                except Exception:
                    pass
            if job:
                return {"type": "status", "job": JobOut.model_validate(job).model_dump()}
        jobs = await list_jobs(db, limit=10)
        return {"type": "status", "jobs": [JobOut.model_validate(j).model_dump() for j in jobs]}

    # /stop
    if command == "/stop":
        target_id = job_id_hint or cleaned_input.strip()
        job = await get_job(db, target_id)
        if not job:
            return {"type": "error", "message": f"Job '{target_id}' not found"}
        if job.status in ("completed", "failed", "cancelled"):
            return {"type": "info", "message": f"Job {target_id} already in status: {job.status}"}
        # Revoke celery task
        if job.celery_task_id:
            from app.worker_client import celery_app
            celery_app.control.revoke(job.celery_task_id, terminate=True)
        await update_job_status(db, target_id, "cancelled")
        await manager.broadcast(target_id, {
            "type": "job_update",
            "job_id": target_id,
            "status": "cancelled",
            "message": f"Job {target_id} cancelled by user",
        })
        return {"type": "cancelled", "job_id": target_id}

    # /deploy requires HumanLoop approval
    if command == "/deploy":
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            job_id=job_id,
            user_id=current_user.id,
            command=command,
            input_text=body.input_text,
            status="awaiting_approval",
        )
        db.add(job)
        await db.flush()

        approval = await create_approval_request(
            db=db,
            job_id=job_id,
            requested_by_id=current_user.id,
            action="DEPLOY",
            details=body.input_text,
        )
        await manager.broadcast(job_id, {
            "type": "approval_required",
            "job_id": job_id,
            "request_id": approval.request_id,
            "action": "DEPLOY",
            "details": body.input_text,
        })
        return {
            "type": "approval_required",
            "job_id": job_id,
            "request_id": approval.request_id,
            "message": "Deploy requires HumanLoop approval",
        }

    # /publish {job_id} → Phase 4: publish a completed build to a stable public URL
    if command == "/publish":
        target_job_id = job_id_hint or cleaned_input.strip()
        if not target_job_id:
            return {"type": "error", "message": "Usage: /publish {job_id}"}
        target_job = await get_job(db, target_job_id)
        if not target_job:
            return {"type": "error", "message": f"Job '{target_job_id}' not found"}
        if target_job.status != "completed":
            return {
                "type": "error",
                "message": f"Job must be completed before publishing (current: {target_job.status})",
            }
        if not target_job.result or not target_job.result.get("project_path"):
            return {"type": "error", "message": "Job has no built project to deploy"}

        from app.modules.deploy_ops import create_deployment
        from app.worker_client import dispatch_publish_job

        result = target_job.result
        deployment_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"
        name = result.get("plan", {}).get("name", target_job.input_text[:60])
        stack_list = result.get("plan", {}).get("stack") or []
        stack = stack_list[0] if stack_list else None

        deployment = await create_deployment(
            db=db,
            deployment_id=deployment_id,
            job_id=target_job_id,
            user_id=current_user.id,
            name=name,
            stack=stack,
            project_path=result.get("project_path"),
            files_count=len(result.get("files_created", [])),
        )

        dispatch_publish_job(
            deployment_id=deployment_id,
            job_id=target_job_id,
            project_path=result.get("project_path", ""),
            stack=stack or "unknown",
            user_id=current_user.id,
        )

        await manager.broadcast(target_job_id, {
            "type": "deploy_started",
            "deployment_id": deployment_id,
            "job_id": target_job_id,
            "name": name,
            "status": "deploying",
            "message": f"Publishing '{name}' — deployment {deployment_id}",
        })

        return {
            "type": "deploy_started",
            "deployment_id": deployment_id,
            "job_id": target_job_id,
            "message": f"Deployment {deployment_id} queued — publishing '{name}'",
        }

    # /build or chat build → queue AI build job (Phase 2: NORA-ARCH + NORA-CODE)
    if command in ("/build", "chat"):
        from app.worker_client import dispatch_ai_build_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            job_id=job_id,
            user_id=current_user.id,
            command="/build",
            input_text=body.input_text,
            status="queued",
        )
        db.add(job)
        await db.flush()

        # Dispatch AI build task (no-stop: runs even if browser closes)
        celery_task_id = dispatch_ai_build_job(job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)

        await manager.broadcast(job_id, {
            "type": "job_created",
            "job_id": job_id,
            "command": "/build",
            "input_text": body.input_text,
            "status": "queued",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued"}

    # ------------------------------------------------------------------ #
    # Phase 5 — /god mode on|off
    # ------------------------------------------------------------------ #
    if command == "/god":
        from app.modules.nora_phase5 import set_god_mode, get_god_mode
        rest = cleaned_input.lower()
        if "off" in rest:
            state = await set_god_mode(db, current_user.id, False)
            msg = "GOD MODE deactivated."
        else:
            # /god mode on (default: activate)
            if current_user.role not in ("ADMIN", "DEVELOPER"):
                return {"type": "error", "message": "GOD MODE requires ADMIN or DEVELOPER role"}
            state = await set_god_mode(db, current_user.id, True)
            msg = "⚡ GOD MODE ACTIVATED — NORA has full autonomous control."
        await manager.broadcast("system", {
            "type": "god_mode_change",
            "active": state.active,
            "user_id": current_user.id,
            "message": msg,
        })
        return {"type": "god_mode", "active": state.active, "message": msg}

    # ------------------------------------------------------------------ #
    # Phase 5 — /self-upgrade: queue self-upgrade job
    # ------------------------------------------------------------------ #
    if command == "/self-upgrade":
        from app.worker_client import dispatch_phase5_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/self-upgrade", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase5_job("run_self_upgrade", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/self-upgrade", "status": "queued",
            "message": "NORA-SELF: Self-upgrade initiated",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": "NORA-SELF: Analyzing and upgrading system code..."}

    # ------------------------------------------------------------------ #
    # Phase 5 — /global connect|sync
    # ------------------------------------------------------------------ #
    if command == "/global":
        from app.worker_client import dispatch_phase5_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/global", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase5_job("run_global_sync", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/global", "status": "queued",
            "message": "NORA-GLOBAL: Connecting to global network...",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": "NORA-GLOBAL: Connecting to global NORA network..."}

    # ------------------------------------------------------------------ #
    # Phase 5 — /dream on|off
    # ------------------------------------------------------------------ #
    if command == "/dream":
        from app.worker_client import dispatch_phase5_job
        rest = cleaned_input.lower()
        if "off" in rest:
            return {"type": "dream_mode", "active": False,
                    "message": "NORA-DREAM: Dream mode deactivated."}
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/dream", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase5_job("run_dream_job", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/dream", "status": "queued",
            "message": "NORA-DREAM: Dream mode activated. Running idle generation...",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": "NORA-DREAM: Dream mode activated. NORA will run creative jobs while idle."}

    # ------------------------------------------------------------------ #
    # Phase 5 — /evolve new <module_name>
    # ------------------------------------------------------------------ #
    if command == "/evolve":
        from app.worker_client import dispatch_phase5_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/evolve", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase5_job("run_evolve", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/evolve", "status": "queued",
            "message": f"NORA-EVOLVE: Creating new AI module — {cleaned_input}",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": f"NORA-EVOLVE: Evolving new AI module from: {cleaned_input}"}

    # ------------------------------------------------------------------ #
    # Phase 5 — /consciousness (synchronous: returns status inline)
    # ------------------------------------------------------------------ #
    if command == "/consciousness":
        from app.modules.nora_phase5 import get_system_status
        status = await get_system_status(db, current_user.id)
        return {"type": "consciousness", "status": status,
                "message": f"NORA-CONSCIOUS: Consciousness level — {status['consciousness_level']}"}

    # ------------------------------------------------------------------ #
    # Phase 5 — /personality set <trait> <value>
    # ------------------------------------------------------------------ #
    if command == "/personality":
        from app.modules.nora_phase5 import set_personality_trait
        parts = cleaned_input.split(None, 2)
        # /personality set tone friendly  OR  /personality tone friendly
        if len(parts) >= 3 and parts[0].lower() == "set":
            trait, value = parts[1], parts[2]
        elif len(parts) >= 2:
            trait, value = parts[0], parts[1]
        else:
            return {"type": "error",
                    "message": "Usage: /personality set <trait> <value> — e.g. /personality set tone friendly"}
        await set_personality_trait(db, current_user.id, trait.lower(), value)
        return {"type": "personality_set", "trait": trait.lower(), "value": value,
                "message": f"NORA-SOUL: Personality trait '{trait}' set to '{value}'"}

    # ------------------------------------------------------------------ #
    # Phase 5 — /memory search <query>
    # ------------------------------------------------------------------ #
    if command == "/memory":
        from app.modules.nora_phase5 import search_memories
        parts = cleaned_input.split(None, 1)
        if len(parts) >= 2 and parts[0].lower() == "search":
            query = parts[1]
        elif len(parts) >= 1 and parts[0].lower() != "search":
            query = cleaned_input
        else:
            return {"type": "error",
                    "message": "Usage: /memory search <query> — e.g. /memory search build"}
        results = await search_memories(db, current_user.id, query)
        return {
            "type": "memory_search",
            "query": query,
            "count": len(results),
            "results": [
                {"layer": m.layer, "layer_name": m.layer_name, "key": m.key, "value": m.value}
                for m in results[:20]
            ],
            "message": f"NORA-MEMORY: Found {len(results)} memories matching '{query}'",
        }

    # ------------------------------------------------------------------ #
    # Phase 6 — /workspace create <name>
    # ------------------------------------------------------------------ #
    if command == "/workspace":
        from app.worker_client import dispatch_phase6_job
        parts = cleaned_input.split(None, 2)
        sub = parts[0].lower() if parts else "create"
        if sub == "create":
            ws_name = parts[1] if len(parts) > 1 else "workspace-default"
            job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
            job = Job(job_id=job_id, user_id=current_user.id,
                      command="/workspace", input_text=body.input_text, status="queued")
            db.add(job)
            await db.flush()
            celery_task_id = dispatch_phase6_job("run_workspace_create", job_id, body.input_text, current_user.id)
            await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
            await manager.broadcast(job_id, {
                "type": "job_created", "job_id": job_id,
                "command": "/workspace", "status": "queued",
                "message": f"Creating workspace: {ws_name}",
            })
            return {"type": "job_created", "job_id": job_id, "status": "queued",
                    "message": f"Workspace '{ws_name}' creation queued."}
        return {"type": "workspace", "action": sub,
                "message": f"Workspace sub-command '{sub}' acknowledged."}

    # ------------------------------------------------------------------ #
    # Phase 6 — /org create <name>
    # ------------------------------------------------------------------ #
    if command == "/org":
        from app.modules.nora_phase6 import create_organization
        parts = cleaned_input.split(None, 2)
        org_name = parts[1] if len(parts) > 1 else f"org-{uuid.uuid4().hex[:6]}"
        org_slug = org_name.lower().replace(" ", "-")
        org = await create_organization(db, current_user.id, org_name, org_slug)
        return {"type": "org_created", "org_id": org.id, "name": org.name,
                "message": f"Organization '{org.name}' created."}

    # ------------------------------------------------------------------ #
    # Phase 6 — /team invite <username>
    # ------------------------------------------------------------------ #
    if command == "/team":
        from app.modules.nora_phase6 import invite_team_member
        parts = cleaned_input.split(None, 2)
        sub = parts[0].lower() if parts else ""
        if sub == "invite" and len(parts) >= 2:
            result = await invite_team_member(db, current_user.id, parts[1])
            return {"type": "team_invite", **result}
        return {"type": "team", "message": "Usage: /team invite <username>"}

    # ------------------------------------------------------------------ #
    # Phase 6 — /approve queue
    # ------------------------------------------------------------------ #
    if command == "/approve":
        from app.modules.nora_ops import list_jobs
        from app.schemas.job import JobOut
        pending = await list_jobs(db, limit=20)
        awaiting = [j for j in pending if j.status == "awaiting_approval"]
        return {
            "type": "approve_queue",
            "count": len(awaiting),
            "jobs": [JobOut.model_validate(j).model_dump() for j in awaiting],
            "message": f"{len(awaiting)} job(s) awaiting approval.",
        }

    # ------------------------------------------------------------------ #
    # Phase 6 — /promote staging
    # ------------------------------------------------------------------ #
    if command == "/promote":
        from app.worker_client import dispatch_phase6_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/promote", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase6_job("run_promote_staging", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/promote", "status": "queued",
            "message": "Promoting staging → production...",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": "Staging promotion pipeline queued."}

    # ------------------------------------------------------------------ #
    # Phase 6 — /backup run
    # ------------------------------------------------------------------ #
    if command == "/backup":
        from app.worker_client import dispatch_phase6_job
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(job_id=job_id, user_id=current_user.id,
                  command="/backup", input_text=body.input_text, status="queued")
        db.add(job)
        await db.flush()
        celery_task_id = dispatch_phase6_job("run_backup_run", job_id, body.input_text, current_user.id)
        await update_job_status(db, job_id, "queued", celery_task_id=celery_task_id)
        await manager.broadcast(job_id, {
            "type": "job_created", "job_id": job_id,
            "command": "/backup", "status": "queued",
            "message": "Backup job queued.",
        })
        return {"type": "job_created", "job_id": job_id, "status": "queued",
                "message": "Backup run queued."}

    # ------------------------------------------------------------------ #
    # Phase 6 — /restore latest
    # ------------------------------------------------------------------ #
    if command == "/restore":
        from app.modules.nora_phase6 import get_latest_backup, write_audit
        backup = await get_latest_backup(db)
        if not backup:
            return {"type": "error", "message": "No completed backup found to restore."}
        await write_audit(db, current_user.id, "backup_restore", "backup", backup.backup_id,
                          "Restore via /restore latest command")
        return {"type": "restore_started", "backup_id": backup.backup_id,
                "message": f"Restoring from backup {backup.backup_id}"}

    # ------------------------------------------------------------------ #
    # Phase 6 — /health full
    # ------------------------------------------------------------------ #
    if command == "/health":
        from app.modules.nora_phase6 import run_health_check
        health = await run_health_check(db)
        return {"type": "health", "overall": health["overall"],
                "services": health["services"],
                "message": f"System health: {health['overall'].upper()}"}

    # ------------------------------------------------------------------ #
    # Phase 6 — /analytics dashboard
    # ------------------------------------------------------------------ #
    if command == "/analytics":
        from app.modules.nora_phase6 import get_analytics
        data = await get_analytics(db)
        return {
            "type": "analytics",
            "total_jobs": data["total_jobs"],
            "completed_jobs": data["completed_jobs"],
            "failed_jobs": data["failed_jobs"],
            "total_deployments": data["total_deployments"],
            "live_deployments": data["live_deployments"],
            "top_commands": data["top_commands"][:5],
            "message": f"Analytics: {data['total_jobs']} jobs, {data['live_deployments']} live deployments.",
        }

    return {"type": "unknown", "message": f"Unrecognized command: {command}"}