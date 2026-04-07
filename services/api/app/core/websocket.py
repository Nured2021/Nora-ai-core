import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # job_id -> set of websockets
        self.job_connections: Dict[str, Set[WebSocket]] = {}
        # global feed subscribers
        self.global_connections: Set[WebSocket] = set()

    async def connect_job(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.job_connections:
            self.job_connections[job_id] = set()
        self.job_connections[job_id].add(websocket)

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self.global_connections.add(websocket)

    def disconnect_job(self, websocket: WebSocket, job_id: str):
        if job_id in self.job_connections:
            self.job_connections[job_id].discard(websocket)
            if not self.job_connections[job_id]:
                del self.job_connections[job_id]

    def disconnect_global(self, websocket: WebSocket):
        self.global_connections.discard(websocket)

    async def broadcast_to_job(self, job_id: str, message: dict):
        payload = json.dumps(message)
        if job_id in self.job_connections:
            dead = set()
            for ws in list(self.job_connections[job_id]):
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.job_connections[job_id].discard(ws)

    async def broadcast_global(self, message: dict):
        payload = json.dumps(message)
        dead = set()
        for ws in list(self.global_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.global_connections.discard(ws)

    async def broadcast(self, job_id: str, message: dict):
        await asyncio.gather(
            self.broadcast_to_job(job_id, message),
            self.broadcast_global(message),
        )


manager = ConnectionManager()
