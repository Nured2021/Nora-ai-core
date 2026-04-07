"""
NORA AI Build Task — Phase 2 + Phase 3

Celery task: NORA-ARCH (plan) → NORA-CODE (generate) → fs_writer (disk) →
             git_ops (commit) → preview (install + serve).

No-stop: runs until complete or explicitly cancelled.
Streams logs + plan + file + phase + preview events via Redis pub/sub → WebSocket.
"""
import os
import time

from worker.celery_app import celery_app
from worker.db import get_session
from worker.pubsub import publish_status, publish_plan, publish_files, publish_phase, publish_preview
from worker.helpers import update_job_status, log
from worker.ai_service import generate_plan, generate_code
from worker.fs_writer import write_files
from worker.git_ops import init_repo, GIT_UNAVAILABLE
from worker.preview import detect_stack, run_install, start_preview_server


@celery_app.task(name="worker.tasks.ai_build.run_ai_build", bind=True)
def run_ai_build(self, job_id: str, input_text: str, user_id: int):
    """
    NORA full build pipeline:
      planning → generating → writing → installing → running → completed
    """
    session = get_session()
    try:
        update_job_status(session, job_id, "running")
        publish_status(job_id, "running", f"Starting AI build: {input_text}")

        step = 0

        # ------------------------------------------------------------------ #
        # Phase 2 — NORA-ARCH: Generate plan
        # ------------------------------------------------------------------ #
        step += 1
        publish_phase(job_id, "planning", "NORA-ARCH is analyzing requirements")
        log(session, job_id, "[NORA-ARCH] Analyzing requirements...", step=step)
        time.sleep(0.5)

        plan = generate_plan(input_text)

        log(session, job_id, f"[NORA-ARCH] ✓ Plan: {plan['name']}", step=step)
        log(session, job_id, f"[NORA-ARCH] Stack: {', '.join(plan.get('stack', []))}", step=step)
        for i, s in enumerate(plan.get("steps", []), 1):
            log(session, job_id, f"[NORA-ARCH] Step {i}: {s}", step=step)
            time.sleep(0.2)
        log(session, job_id, f"[NORA-ARCH] Files to generate: {len(plan.get('files', []))}", step=step)

        publish_plan(job_id, plan)

        # ------------------------------------------------------------------ #
        # Phase 2 — NORA-CODE: Generate files
        # ------------------------------------------------------------------ #
        step += 1
        publish_phase(job_id, "generating", "NORA-CODE is writing source files")
        log(session, job_id, f"[NORA-CODE] Generating {len(plan.get('files', []))} files...", step=step)
        time.sleep(0.5)

        files = generate_code(plan)

        for f in files:
            log(session, job_id, f"[NORA-CODE] → Created {f['path']}", step=step)
            time.sleep(0.1)
        log(session, job_id, f"[NORA-CODE] ✓ {len(files)} files generated", step=step)

        publish_files(job_id, [f["path"] for f in files])

        # ------------------------------------------------------------------ #
        # Phase 3 — Write files to disk
        # ------------------------------------------------------------------ #
        step += 1
        publish_phase(job_id, "writing", "Writing files to disk")
        log(session, job_id, "[NORA-FS] Writing files to /workspace/...", step=step)
        time.sleep(0.3)

        project_path = write_files(job_id, files)

        log(session, job_id, f"[NORA-FS] ✓ Project written to {project_path}", step=step)
        log(session, job_id, f"[NORA-FS] {len(files)} files saved on disk", step=step)

        # ------------------------------------------------------------------ #
        # Phase 3 — Git init
        # ------------------------------------------------------------------ #
        log(session, job_id, "[NORA-GIT] Initializing git repository...", step=step)
        git_commit = init_repo(project_path)
        if not git_commit or git_commit in (GIT_UNAVAILABLE,) or git_commit.startswith("git-error"):
            log(session, job_id, f"[NORA-GIT] ⚠ Git skipped: {git_commit}", step=step, level="WARN")
            git_commit = ""
        else:
            log(session, job_id, f"[NORA-GIT] ✓ Initial commit: {git_commit}", step=step)

        # ------------------------------------------------------------------ #
        # Phase 3 — Install dependencies
        # ------------------------------------------------------------------ #
        step += 1
        stack = detect_stack(plan)
        publish_phase(job_id, "installing", f"Installing {stack} dependencies")
        log(session, job_id, f"[NORA-INSTALL] Detected stack: {stack}", step=step)
        log(session, job_id, f"[NORA-INSTALL] Installing dependencies for {stack}...", step=step)

        install_ok, install_out = run_install(project_path, stack)

        if install_ok:
            log(session, job_id, f"[NORA-INSTALL] ✓ Dependencies installed", step=step)
        else:
            log(session, job_id, f"[NORA-INSTALL] ⚠ Install incomplete: {install_out[:200]}", step=step, level="WARN")

        # ------------------------------------------------------------------ #
        # Phase 3 — Start preview server
        # ------------------------------------------------------------------ #
        step += 1
        preview_url = None
        if install_ok:
            publish_phase(job_id, "running", "Starting preview server")
            log(session, job_id, "[NORA-PREVIEW] Starting preview server...", step=step)
            preview_url = start_preview_server(project_path, stack, job_id)
            if preview_url:
                log(session, job_id, f"[NORA-PREVIEW] ✓ Preview live: {preview_url}", step=step, level="SUCCESS")
                publish_preview(job_id, preview_url, project_path, git_commit)
            else:
                log(session, job_id, "[NORA-PREVIEW] ⚠ Preview server not started (files available on disk)", step=step, level="WARN")
        else:
            log(session, job_id, "[NORA-PREVIEW] Skipping preview — install did not complete", step=step, level="WARN")
            log(session, job_id, f"[NORA-PREVIEW] Project files available at: {project_path}", step=step)

        # ------------------------------------------------------------------ #
        # Done — print access links clearly
        # ------------------------------------------------------------------ #
        dashboard_url = os.getenv("DASHBOARD_URL", "http://localhost:3000")

        step += 1
        publish_phase(job_id, "completed", "Build complete")
        log(session, job_id, f"[NORA-CHAT] ✓ Build complete: {plan['name']}", step=step)
        log(session, job_id, f"[NORA-CHAT] Stack: {', '.join(plan.get('stack', []))}", step=step, level="SUCCESS")
        log(session, job_id, f"[NORA-CHAT] Project path: {project_path}", step=step, level="SUCCESS")
        if git_commit:
            log(session, job_id, f"[NORA-CHAT] Git commit: {git_commit}", step=step)

        # Access links block
        log(session, job_id, "─" * 48, step=step)
        log(session, job_id, "🔗  ACCESS LINKS", step=step, level="SUCCESS")
        log(session, job_id, f"  Dashboard : {dashboard_url}", step=step, level="SUCCESS")
        if preview_url:
            log(session, job_id, f"  App preview: {preview_url}", step=step, level="SUCCESS")
        else:
            log(session, job_id, "  App preview: (not started — see project files on disk)", step=step, level="WARN")
        log(session, job_id, "─" * 48, step=step)

        result = {
            "plan": plan,
            "files": files,
            "files_created": [f["path"] for f in files],
            "project_path": project_path,
            "git_commit": git_commit,
            "preview_url": preview_url or "",
            "input": input_text,
        }
        update_job_status(session, job_id, "completed", result=result)
        publish_status(job_id, "completed", f"Build complete: {plan['name']}")
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
