"""
Celery worker client - dispatches tasks to the queue.
Jobs run on the worker server even if browser closes.
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "nora_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_send_task_events=True,
    task_send_sent_event=True,
    # No-stop: tasks don't expire
    task_time_limit=None,
    task_soft_time_limit=None,
)


def dispatch_build_job(job_id: str, input_text: str, user_id: int) -> str:
    """Dispatch legacy simulated build (used by tactics)."""
    result = celery_app.send_task(
        "worker.tasks.build.run_build",
        args=[job_id, input_text, user_id],
        queue="default",
    )
    return result.id


def dispatch_ai_build_job(job_id: str, input_text: str, user_id: int) -> str:
    """Dispatch Phase 2 AI build (NORA-ARCH + NORA-CODE)."""
    result = celery_app.send_task(
        "worker.tasks.ai_build.run_ai_build",
        args=[job_id, input_text, user_id],
        queue="default",
    )
    return result.id


def dispatch_deploy_job(job_id: str, input_text: str, user_id: int) -> str:
    result = celery_app.send_task(
        "worker.tasks.deploy.run_deploy",
        args=[job_id, input_text, user_id],
        queue="default",
    )
    return result.id


def dispatch_publish_job(
    deployment_id: str,
    job_id: str,
    project_path: str,
    stack: str,
    user_id: int,
) -> str:
    """Dispatch Phase 4 publish task — copies build to nginx volume and returns public URL."""
    result = celery_app.send_task(
        "worker.tasks.deploy.run_publish",
        args=[deployment_id, job_id, project_path, stack, user_id],
        queue="default",
    )
    return result.id


def dispatch_phase5_job(task_name: str, job_id: str, input_text: str, user_id: int) -> str:
    """Dispatch a Phase 5 task (self-upgrade, dream, evolve, global-sync)."""
    result = celery_app.send_task(
        f"worker.tasks.phase5.{task_name}",
        args=[job_id, input_text, user_id],
        queue="default",
    )
    return result.id
