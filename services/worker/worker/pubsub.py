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
