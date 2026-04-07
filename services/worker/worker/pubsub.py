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


def publish_phase(job_id: str, phase: str, message: str = ""):
    """Broadcast the current execution phase (Phase 3 extended status)."""
    event = {
        "type": "job_phase",
        "job_id": job_id,
        "phase": phase,
        "message": message,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))


def publish_preview(job_id: str, preview_url: str, project_path: str, git_commit: str = ""):
    """Broadcast preview URL and project path once the build is ready."""
    event = {
        "type": "preview_ready",
        "job_id": job_id,
        "preview_url": preview_url,
        "project_path": project_path,
        "git_commit": git_commit,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))


def publish_deploy(deployment_id: str, job_id: str, name: str, public_url: str, status: str, error: str = ""):
    """Broadcast deployment ready/failed event (Phase 4)."""
    event = {
        "type": "deploy_ready" if status == "live" else "deploy_failed",
        "deployment_id": deployment_id,
        "job_id": job_id,
        "name": name,
        "public_url": public_url,
        "status": status,
        "error": error,
    }
    _redis.publish(WS_CHANNEL, json.dumps(event))
