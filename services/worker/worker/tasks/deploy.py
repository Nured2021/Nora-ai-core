"""
NORA Phase 4 — Deployment & Public Access System

run_publish: copies a built project's static output into the shared
/deployments/{deployment_id}/ directory that is served by the nginx proxy
at http://localhost:8080/d/{deployment_id}/.

run_deploy: legacy HumanLoop-triggered deploy task (kept from Phase 1).
"""
import os
import shutil
import time

from worker.celery_app import celery_app
from worker.db import get_session
from worker.pubsub import publish_status, publish_deploy
from worker.helpers import update_job_status, log

DEPLOYMENTS_ROOT: str = os.getenv("DEPLOYMENTS_ROOT", "/deployments")
PROXY_HOST: str = os.getenv("PROXY_HOST", "http://localhost:8080")


# ---------------------------------------------------------------------------
# Phase 4 — real publish task
# ---------------------------------------------------------------------------

@celery_app.task(name="worker.tasks.deploy.run_publish", bind=True)
def run_publish(self, deployment_id: str, job_id: str, project_path: str, stack: str, user_id: int):
    """
    NORA-DEPLOY Phase 4: Copies the built project files into the nginx-served
    /deployments/{deployment_id}/ directory and updates the deployment record.
    """
    from worker.db import get_session as _gs

    session = _gs()
    try:
        publish_status(job_id, "running", f"Deploying {deployment_id}…")

        step = 0
        step += 1
        log(session, job_id, f"[NORA-DEPLOY] Starting deployment {deployment_id}", step=step)
        log(session, job_id, f"[NORA-DEPLOY] Source: {project_path}", step=step)
        log(session, job_id, f"[NORA-DEPLOY] Stack:  {stack}", step=step)
        time.sleep(0.3)

        # ------------------------------------------------------------------ #
        # 1. Locate build output inside the project workspace
        # ------------------------------------------------------------------ #
        step += 1
        source_dir = _find_deploy_source(project_path, stack)
        log(session, job_id, f"[NORA-DEPLOY] Build output: {source_dir}", step=step)

        if not source_dir or not os.path.isdir(source_dir):
            error_msg = f"No build output found at {source_dir or project_path}"
            log(session, job_id, f"[NORA-DEPLOY] ✗ {error_msg}", step=step, level="ERROR")
            _update_deployment(session, deployment_id, "failed", error=error_msg)
            publish_deploy(deployment_id, job_id, deployment_id, "", "failed", error_msg)
            return {"deployed": False, "error": error_msg}

        # ------------------------------------------------------------------ #
        # 2. Copy files to /deployments/{deployment_id}/
        # ------------------------------------------------------------------ #
        step += 1
        dest_dir = os.path.join(DEPLOYMENTS_ROOT, deployment_id)
        log(session, job_id, f"[NORA-DEPLOY] Copying to {dest_dir}…", step=step)

        os.makedirs(DEPLOYMENTS_ROOT, exist_ok=True)
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        shutil.copytree(source_dir, dest_dir)

        files_copied = sum(len(fs) for _, _, fs in os.walk(dest_dir))
        log(session, job_id, f"[NORA-DEPLOY] ✓ {files_copied} files copied", step=step)
        time.sleep(0.3)

        # ------------------------------------------------------------------ #
        # 3. Build public URL
        # ------------------------------------------------------------------ #
        step += 1
        public_url = f"{PROXY_HOST}/d/{deployment_id}/"
        log(session, job_id, f"[NORA-DEPLOY] ✓ Deployment LIVE!", step=step, level="SUCCESS")
        log(session, job_id, f"[NORA-DEPLOY] 🌐  Public URL: {public_url}", step=step, level="SUCCESS")
        log(session, job_id, "─" * 48, step=step)
        log(session, job_id, "🚀  DEPLOYMENT LINKS", step=step, level="SUCCESS")
        log(session, job_id, f"  Public app : {public_url}", step=step, level="SUCCESS")
        log(session, job_id, f"  Deployment : {deployment_id}", step=step, level="SUCCESS")
        log(session, job_id, "─" * 48, step=step)

        # ------------------------------------------------------------------ #
        # 4. Persist in DB + broadcast
        # ------------------------------------------------------------------ #
        _update_deployment(session, deployment_id, "live", public_url=public_url)
        publish_deploy(deployment_id, job_id, deployment_id, public_url, "live")
        publish_status(job_id, "completed", f"Deployment live: {public_url}")

        result = {
            "deployed": True,
            "deployment_id": deployment_id,
            "public_url": public_url,
            "files_copied": files_copied,
        }
        return result

    except Exception as exc:
        error_msg = f"Deployment failed: {str(exc)}"
        try:
            log(session, job_id, f"[NORA-DEPLOY] ERROR: {error_msg}", level="ERROR")
            _update_deployment(session, deployment_id, "failed", error=error_msg)
            publish_deploy(deployment_id, job_id, deployment_id, "", "failed", error_msg)
            publish_status(job_id, "failed", error_msg)
        except Exception:
            pass
        raise

    finally:
        session.close()


# ---------------------------------------------------------------------------
# Legacy HumanLoop deploy task (Phase 1 stub — kept unchanged)
# ---------------------------------------------------------------------------

@celery_app.task(name="worker.tasks.deploy.run_deploy", bind=True)
def run_deploy(self, job_id: str, input_text: str, user_id: int):
    """
    NORA-DEPLOY: Deploys the project. Requires HumanLoop approval first.
    """
    session = get_session()
    try:
        update_job_status(session, job_id, "running")
        publish_status(job_id, "running", f"Starting deployment: {input_text}")

        step = 0

        step += 1
        log(session, job_id, f"[NORA-DEPLOY] HumanLoop approved. Starting: {input_text}", step=step)
        time.sleep(1)

        step += 1
        log(session, job_id, "[NORA-DEPLOY] Packaging application...", step=step)
        time.sleep(2)
        log(session, job_id, "[NORA-DEPLOY] → Docker image built: nora-app:latest", step=step)

        step += 1
        log(session, job_id, "[NORA-DEPLOY] Pushing to container registry...", step=step)
        time.sleep(2)
        log(session, job_id, "[NORA-DEPLOY] → Pushed: registry.example.com/nora-app:latest", step=step)

        step += 1
        log(session, job_id, "[NORA-DEPLOY] Deploying to cloud infrastructure...", step=step)
        time.sleep(2)
        log(session, job_id, "[NORA-DEPLOY] → Scaling up: 2 replicas", step=step)
        time.sleep(1)
        log(session, job_id, "[NORA-DEPLOY] → Health checks passing ✓", step=step)

        step += 1
        log(session, job_id, "[NORA-DEPLOY] ✓ Deployment LIVE!", step=step)
        log(session, job_id, "[NORA-DEPLOY] → URL: https://app.example.com", step=step)

        result = {
            "deployed": True,
            "url": "https://app.example.com",
            "replicas": 2,
            "image": "nora-app:latest",
            "input": input_text,
        }
        update_job_status(session, job_id, "completed", result=result)
        publish_status(job_id, "completed", "Deployment LIVE!")
        return result

    except Exception as exc:
        error_msg = f"Deployment failed: {str(exc)}"
        try:
            log(session, job_id, f"[NORA-OPS] ERROR: {error_msg}", level="ERROR")
            update_job_status(session, job_id, "failed", error=error_msg)
            publish_status(job_id, "failed", error_msg)
        except Exception:
            pass
        raise

    finally:
        session.close()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _find_deploy_source(project_path: str, stack: str) -> str | None:
    """
    Return the directory that should be copied into the nginx-served folder.
    For React/static: prefer build/, dist/, out/.
    For FastAPI/Python: serve the whole project root.
    """
    if stack in ("react", "static", "unknown"):
        # Try common frontend sub-directories first
        for subdir in ("frontend", "app", "web", "client", "ui", ""):
            base = os.path.join(project_path, subdir) if subdir else project_path
            for build in ("build", "dist", "out"):
                candidate = os.path.join(base, build)
                if os.path.isdir(candidate):
                    return candidate
        # No build dir — serve project root (index.html may be there)
        return project_path

    if stack == "fastapi":
        # Serve the whole project so uvicorn/static files are accessible
        return project_path

    return project_path


def _update_deployment(session, deployment_id: str, status: str, public_url: str = None, error: str = None):
    """Synchronous DB update for deployment status (worker side)."""
    from sqlalchemy import text
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()
    updates = [f"status = '{status}'", f"updated_at = '{now}'"]
    if public_url is not None:
        updates.append(f"public_url = '{public_url}'")
    if error is not None:
        escaped = error.replace("'", "''")
        updates.append(f"error = '{escaped}'")
    sql = f"UPDATE deployments SET {', '.join(updates)} WHERE deployment_id = '{deployment_id}'"
    session.execute(text(sql))
    session.commit()

