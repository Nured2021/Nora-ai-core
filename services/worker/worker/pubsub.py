"""
Redis client for broadcasting WebSocket messages from worker.
Worker publishes log events; API server subscribes and forwards to WebSocket clients.
"""
import json
import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
_redis = redis.from_url(REDIS_URL, decode_responses=True)

WS_CHANNEL = "nora:ws:broadcast"


def publish_log(job_id: str, message: str, level: str = "INFO", step: int = None):
    event = {
        "type": "job_log",
        "job_id": job_id,
        "level": level,
        "message": message,
        "step": step,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))


def publish_status(job_id: str, status: str, message: str = ""):
    event = {
        "type": "job_update",
        "job_id": job_id,
        "status": status,
        "message": message,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))


def publish_plan(job_id: str, plan: dict):
    """Broadcast the AI-generated plan to the dashboard in real-time."""
    event = {
        "type": "ai_plan",
        "job_id": job_id,
        "plan": plan,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))


def publish_files(job_id: str, file_paths: list):
    """Broadcast the list of generated file paths to the dashboard."""
    event = {
        "type": "ai_files",
        "job_id": job_id,
        "file_paths": file_paths,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))
