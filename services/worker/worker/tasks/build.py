"""
NORA-BUILDER / NORA-CODE / NORA-ARCH / NORA-TEST build task.
Runs as a Celery task — survives browser close (no-stop).
"""
import time
from datetime import datetime, timezone

from worker.celery_app import celery_app
from worker.db import get_session
from worker.pubsub import publish_log, publish_status


def _update_job_status(session, job_id: str, status: str, error: str = None, result: dict = None):
    from sqlalchemy import text
    params = {"status": status, "job_id": job_id}
    set_clauses = ["status = :status"]
    if status == "running":
        set_clauses.append("started_at = :started_at")
        params["started_at"] = datetime.now(timezone.utc)
    if status in ("completed", "failed", "cancelled"):
        set_clauses.append("completed_at = :completed_at")
        params["completed_at"] = datetime.now(timezone.utc)
    if error:
        set_clauses.append("error = :error")
        params["error"] = error
    if result:
        import json
        set_clauses.append("result = :result")
        params["result"] = json.dumps(result)
    sql = f"UPDATE jobs SET {', '.join(set_clauses)} WHERE job_id = :job_id"
    session.execute(text(sql), params)
    session.commit()


def _append_log(session, job_id: str, message: str, level: str = "INFO", step: int = None):
    from sqlalchemy import text
    session.execute(
        text("INSERT INTO job_logs (job_id, message, level, step) VALUES (:job_id, :message, :level, :step)"),
        {"job_id": job_id, "message": message, "level": level, "step": step},
    )
    session.commit()


def _log(session, job_id: str, message: str, level: str = "INFO", step: int = None):
    _append_log(session, job_id, message, level, step)
    publish_log(job_id, message, level, step)


@celery_app.task(name="worker.tasks.build.run_build", bind=True)
def run_build(self, job_id: str, input_text: str, user_id: int):
    """
    NORA-BUILDER: Simulates building a project from natural language.
    Steps: ARCH → CODE → TEST → complete.
    No-stop: runs until done or cancelled.
    """
    session = get_session()
    try:
        _update_job_status(session, job_id, "running")
        publish_status(job_id, "running", f"Starting build: {input_text}")

        step = 0

        # NORA-ARCH: Design the system
        step += 1
        _log(session, job_id, f"[NORA-ARCH] Analyzing request: '{input_text}'", step=step)
        time.sleep(1)
        _log(session, job_id, "[NORA-ARCH] Designing system architecture...", step=step)
        time.sleep(1)
        _log(session, job_id, "[NORA-ARCH] ✓ Architecture designed: frontend + backend + database", step=step)

        # NORA-CODE: Write frontend
        step += 1
        _log(session, job_id, "[NORA-CODE] Writing frontend code (React/TypeScript)...", step=step)
        time.sleep(1.5)
        _log(session, job_id, "[NORA-CODE] → Created frontend/src/App.tsx", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] → Created frontend/src/components/", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] ✓ Frontend code complete", step=step)

        # NORA-CODE: Write backend
        step += 1
        _log(session, job_id, "[NORA-CODE] Writing backend code (FastAPI/Python)...", step=step)
        time.sleep(1.5)
        _log(session, job_id, "[NORA-CODE] → Created backend/app/main.py", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] → Created backend/app/routers/", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] → Created backend/app/models/", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] ✓ Backend code complete", step=step)

        # NORA-CODE: Write database schema
        step += 1
        _log(session, job_id, "[NORA-CODE] Writing database schema (PostgreSQL)...", step=step)
        time.sleep(1)
        _log(session, job_id, "[NORA-CODE] → Created database/migrations/001_init.sql", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-CODE] ✓ Database schema complete", step=step)

        # NORA-TEST: Run tests
        step += 1
        _log(session, job_id, "[NORA-TEST] Running tests...", step=step)
        time.sleep(2)
        _log(session, job_id, "[NORA-TEST] → Frontend tests: 12/12 PASSED ✓", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-TEST] → Backend tests: 8/8 PASSED ✓", step=step)
        time.sleep(0.5)
        _log(session, job_id, "[NORA-TEST] ✓ All tests passed", step=step)

        # NORA-CHAT: Summary
        step += 1
        _log(session, job_id, f"[NORA-CHAT] Build complete! I built: {input_text}", step=step)
        _log(session, job_id, "[NORA-CHAT] NORA: I also added authentication and API documentation.", step=step)

        result = {
            "files_created": [
                "frontend/src/App.tsx",
                "frontend/src/components/",
                "backend/app/main.py",
                "backend/app/routers/",
                "backend/app/models/",
                "database/migrations/001_init.sql",
            ],
            "tests_passed": 20,
            "input": input_text,
        }
        _update_job_status(session, job_id, "completed", result=result)
        publish_status(job_id, "completed", f"Build complete: {input_text}")
        return result

    except Exception as exc:
        error_msg = f"Build failed: {str(exc)}"
        try:
            _log(session, job_id, f"[NORA-OPS] ERROR: {error_msg}", level="ERROR")
            _update_job_status(session, job_id, "failed", error=error_msg)
            publish_status(job_id, "failed", error_msg)
        except Exception:
            pass
        raise

    finally:
        session.close()
