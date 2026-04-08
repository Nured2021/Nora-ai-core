"""
Redis pub/sub listener that forwards worker messages to WebSocket clients.
Runs as a background task in the API server.
"""
import asyncio
import json
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.websocket import manager

WS_CHANNEL = "nora:ws:broadcast"


async def listen_and_forward():
    """
    Subscribe to Redis channel and forward messages to WebSocket clients.
    This bridges the Celery worker (sync) → WebSocket (async).
    """
    while True:
        try:
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            pubsub = r.pubsub()
            await pubsub.subscribe(WS_CHANNEL)

            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        job_id = data.get("job_id")
                        if job_id:
                            await manager.broadcast(job_id, data)
                        else:
                            await manager.broadcast_global(data)
                    except Exception:
                        pass
        except Exception:
            await asyncio.sleep(2)
