"""
NORA-BUILDER / NORA-CODE / NORA-ARCH / NORA-TEST build task.
Runs as a Celery task — survives browser close (no-stop).
Pipeline driven by worker.nora_builder: ARCH → CODE → TEST → complete.
"""
import time

from worker.celery_app import celery_app
from worker.db import get_session
from worker.pubsub import publish_status
from worker.helpers import update_job_status, log
from worker.nora_builder import get_build_steps, build_result


@celery_app.task(name="worker.tasks.build.run_build", bind=True)
def run_build(self, job_id: str, input_text: str, user_id: int):
    """
    NORA-BUILDER: Builds a project from natural language.
    Pipeline: NORA-ARCH → NORA-CODE → NORA-TEST → NORA-CHAT summary.
    No-stop: runs until done or cancelled.
    """
    session = get_session()
    try:
        update_job_status(session, job_id, "running")
        publish_status(job_id, "running", f"Starting build: {input_text}")

        # Get dynamic build steps from NORA-BUILDER pipeline
        steps = get_build_steps(input_text)
        for (step_num, message, delay) in steps:
            log(session, job_id, message, step=step_num)
            publish_status(job_id, "running", message)
            if delay > 0:
                time.sleep(delay)

        # Collect full result from NORA-BUILDER
        result = build_result(input_text)
        update_job_status(session, job_id, "completed", result=result)
        publish_status(job_id, "completed", f"Build complete: {input_text}")
        return result

    except Exception as exc:
        error_msg = f"Build failed: {str(exc)}"
        try:
            log(session, job_id, f"[NORA-OPS] ERROR: {error_msg}", level="ERROR")
            update_job_status(session, job_id, "failed", error=error_msg)
            publish_status(job_id, "failed", error_msg)
        except Exception:
            pass
        raise

    finally:
        session.close()
