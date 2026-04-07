"""
Celery worker configuration.
No-Stop Queue: jobs continue running even if browser closes.
"""
from celery import Celery
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "nora_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["worker.tasks.build", "worker.tasks.deploy", "worker.tasks.ai_build"],
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
    # No-stop: no time limit on tasks
    task_time_limit=None,
    task_soft_time_limit=None,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)
