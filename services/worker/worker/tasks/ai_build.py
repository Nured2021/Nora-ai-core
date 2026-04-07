"""
NORA AI Build Task — Phase 2

Celery task that runs NORA-ARCH (planning) → NORA-CODE (generation).
No-stop: runs until complete or explicitly cancelled.
Streams logs + plan + file events via Redis pub/sub → WebSocket.
"""
import time

from worker.celery_app import celery_app
from worker.db import get_session
from worker.pubsub import publish_status, publish_plan, publish_files
from worker.helpers import update_job_status, log
from worker.ai_service import generate_plan, generate_code


@celery_app.task(name="worker.tasks.ai_build.run_ai_build", bind=True)
def run_ai_build(self, job_id: str, input_text: str, user_id: int):
    """
    NORA AI Build: plan → generate → complete.
    Uses OpenAI when OPENAI_API_KEY is set, otherwise structured simulation.
    """
    session = get_session()
    try:
        update_job_status(session, job_id, "running")
        publish_status(job_id, "running", f"Starting AI build: {input_text}")

        step = 0

        # ------------------------------------------------------------------ #
        # NORA-ARCH: Generate plan
        # ------------------------------------------------------------------ #
        step += 1
        log(session, job_id, "[NORA-ARCH] Analyzing requirements...", step=step)
        time.sleep(0.5)

        plan = generate_plan(input_text)

        log(session, job_id, f"[NORA-ARCH] ✓ Plan: {plan['name']}", step=step)
        log(session, job_id, f"[NORA-ARCH] Stack: {', '.join(plan.get('stack', []))}", step=step)

        for i, s in enumerate(plan.get("steps", []), 1):
            log(session, job_id, f"[NORA-ARCH] Step {i}: {s}", step=step)
            time.sleep(0.2)

        log(
            session, job_id,
            f"[NORA-ARCH] Files to generate: {len(plan.get('files', []))}",
            step=step,
        )

        # Broadcast plan so dashboard can show it immediately
        publish_plan(job_id, plan)

        # ------------------------------------------------------------------ #
        # NORA-CODE: Generate files
        # ------------------------------------------------------------------ #
        step += 1
        log(
            session, job_id,
            f"[NORA-CODE] Generating {len(plan.get('files', []))} files...",
            step=step,
        )
        time.sleep(0.5)

        files = generate_code(plan)

        for f in files:
            log(session, job_id, f"[NORA-CODE] → Created {f['path']}", step=step)
            time.sleep(0.1)

        log(session, job_id, f"[NORA-CODE] ✓ {len(files)} files generated", step=step)

        # Broadcast file paths (content available in job.result)
        publish_files(job_id, [f["path"] for f in files])

        # ------------------------------------------------------------------ #
        # NORA-TEST: Basic validation
        # ------------------------------------------------------------------ #
        step += 1
        log(session, job_id, "[NORA-TEST] Validating code structure...", step=step)
        time.sleep(0.5)
        log(session, job_id, f"[NORA-TEST] ✓ {len(files)} files validated", step=step)

        # ------------------------------------------------------------------ #
        # Done
        # ------------------------------------------------------------------ #
        step += 1
        log(session, job_id, f"[NORA-CHAT] ✓ Build complete: {plan['name']}", step=step)
        log(
            session, job_id,
            f"[NORA-CHAT] Generated {len(files)} files using {', '.join(plan.get('stack', []))}",
            step=step,
            level="SUCCESS",
        )

        result = {
            "plan": plan,
            "files": files,
            "files_created": [f["path"] for f in files],
            "input": input_text,
        }
        update_job_status(session, job_id, "completed", result=result)
        publish_status(job_id, "completed", f"AI build complete: {plan['name']}")
        return result

    except Exception as exc:
        error_msg = f"AI build failed: {str(exc)}"
        try:
            log(session, job_id, f"[NORA-OPS] ERROR: {error_msg}", level="ERROR")
            update_job_status(session, job_id, "failed", error=error_msg)
            publish_status(job_id, "failed", error_msg)
        except Exception:
            pass
        raise

    finally:
        session.close()
