"""
Shared helper utilities for Celery tasks.
Extracted to avoid duplication between build and deploy tasks.
"""
import json
from datetime import datetime, timezone
from sqlalchemy import text


def update_job_status(session, job_id: str, status: str, error: str = None, result: dict = None):
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
        set_clauses.append("result = :result")
        params["result"] = json.dumps(result)
    sql = f"UPDATE jobs SET {', '.join(set_clauses)} WHERE job_id = :job_id"
    session.execute(text(sql), params)
    session.commit()


def append_log(session, job_id: str, message: str, level: str = "INFO", step: int = None):
    session.execute(
        text(
            "INSERT INTO job_logs (job_id, message, level, step) "
            "VALUES (:job_id, :message, :level, :step)"
        ),
        {"job_id": job_id, "message": message, "level": level, "step": step},
    )
    session.commit()


def log(session, job_id: str, message: str, level: str = "INFO", step: int = None):
    """Log to DB and broadcast via Redis pub/sub."""
    from worker.pubsub import publish_log
    append_log(session, job_id, message, level, step)
    publish_log(job_id, message, level, step)
