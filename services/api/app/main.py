import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.routers import auth, commands, jobs, humanloop, users, brain, websocket, deployments
from app.routers import phase5
from app.seed import seed
from app.core.pubsub import listen_and_forward


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB tables and seed data on startup
    await init_db()
    await seed()
    # Start Redis pub/sub listener (bridges worker logs → WebSocket)
    task = asyncio.create_task(listen_and_forward())
    yield
    task.cancel()


app = FastAPI(
    title="NORA AI Core API",
    description="NORA AI Phase 1 — Pilot Mode, No-Stop Queue, HumanLoop, Multi-User",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://dashboard:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(commands.router)
app.include_router(jobs.router)
app.include_router(humanloop.router)
app.include_router(users.router)
app.include_router(brain.router)
app.include_router(deployments.router)
app.include_router(phase5.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nora-api"}
