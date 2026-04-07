from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/jobs/{job_id}")
async def job_websocket(websocket: WebSocket, job_id: str):
    """Subscribe to live log stream for a specific job."""
    await manager.connect_job(websocket, job_id)
    try:
        while True:
            # Keep alive — client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_job(websocket, job_id)


@router.websocket("/ws/feed")
async def global_feed_websocket(websocket: WebSocket):
    """Subscribe to global live job feed (all jobs)."""
    await manager.connect_global(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_global(websocket)
