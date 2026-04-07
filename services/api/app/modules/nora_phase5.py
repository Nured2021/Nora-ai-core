"""
NORA Phase 5 — Core logic module.
Handles GOD MODE state, personality, global network status, memory search,
consciousness reporting, and evolved module management.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.phase5 import PersonalityState, GodModeState, EvolvedModule
from app.models.brain import BrainMemory


# ---------------------------------------------------------------------------
# GOD MODE
# ---------------------------------------------------------------------------

async def get_god_mode(db: AsyncSession, user_id: int) -> GodModeState:
    result = await db.execute(
        select(GodModeState).where(GodModeState.user_id == user_id)
    )
    state = result.scalar_one_or_none()
    if not state:
        state = GodModeState(user_id=user_id, active=False)
        db.add(state)
        await db.flush()
    return state


async def toggle_god_mode(db: AsyncSession, user_id: int) -> GodModeState:
    state = await get_god_mode(db, user_id)
    state.active = not state.active
    state.activated_at = datetime.now(timezone.utc) if state.active else None
    await db.flush()
    return state


async def set_god_mode(db: AsyncSession, user_id: int, active: bool) -> GodModeState:
    state = await get_god_mode(db, user_id)
    state.active = active
    state.activated_at = datetime.now(timezone.utc) if active else None
    await db.flush()
    return state


# ---------------------------------------------------------------------------
# PERSONALITY
# ---------------------------------------------------------------------------

async def get_personality(db: AsyncSession, user_id: int) -> list[PersonalityState]:
    result = await db.execute(
        select(PersonalityState).where(PersonalityState.user_id == user_id)
    )
    return list(result.scalars().all())


async def set_personality_trait(
    db: AsyncSession, user_id: int, trait: str, value: str
) -> PersonalityState:
    result = await db.execute(
        select(PersonalityState).where(
            PersonalityState.user_id == user_id,
            PersonalityState.trait == trait,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.value = value
        await db.flush()
        return existing
    new_trait = PersonalityState(user_id=user_id, trait=trait, value=value)
    db.add(new_trait)
    await db.flush()
    return new_trait


# ---------------------------------------------------------------------------
# MEMORY SEARCH
# ---------------------------------------------------------------------------

async def search_memories(
    db: AsyncSession, user_id: int, query: str
) -> list[BrainMemory]:
    result = await db.execute(
        select(BrainMemory).where(BrainMemory.user_id == user_id)
    )
    all_memories = result.scalars().all()
    q = query.lower()
    return [
        m for m in all_memories
        if q in m.key.lower() or q in m.value.lower() or q in (m.layer_name or "").lower()
    ]


# ---------------------------------------------------------------------------
# EVOLVED MODULES
# ---------------------------------------------------------------------------

async def create_evolved_module(
    db: AsyncSession,
    name: str,
    description: str,
    capabilities: str,
    user_id: int,
) -> EvolvedModule:
    module = EvolvedModule(
        name=name,
        description=description,
        capabilities=capabilities,
        created_by_id=user_id,
    )
    db.add(module)
    await db.flush()
    return module


async def list_evolved_modules(db: AsyncSession) -> list[EvolvedModule]:
    result = await db.execute(
        select(EvolvedModule).where(EvolvedModule.active == True).order_by(EvolvedModule.id)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# CONSCIOUSNESS / SYSTEM STATUS
# ---------------------------------------------------------------------------

async def get_system_status(db: AsyncSession, user_id: int) -> dict:
    """Compile a full NORA consciousness report."""
    god_mode = await get_god_mode(db, user_id)
    personality = await get_personality(db, user_id)
    evolved = await list_evolved_modules(db)

    result = await db.execute(select(BrainMemory).where(BrainMemory.user_id == user_id))
    memories = result.scalars().all()
    layer_count = len(set(m.layer for m in memories))

    from app.ai.phase5_modules import ALL_MODULES
    total_modules = len(ALL_MODULES) + len(evolved)

    consciousness_level = "DORMANT"
    if god_mode.active:
        consciousness_level = "OMNISCIENT"
    elif total_modules >= 50:
        consciousness_level = "TRANSCENDENT"
    elif layer_count >= 20:
        consciousness_level = "AWARE"
    elif len(memories) > 0:
        consciousness_level = "LEARNING"

    return {
        "god_mode_active": god_mode.active,
        "active_modules": total_modules,
        "total_modules": 50,
        "brain_layers": 50,
        "evolved_modules": len(evolved),
        "dream_mode": "ACTIVE" if god_mode.active else "STANDBY",
        "global_network": "CONNECTED" if god_mode.active else "ISOLATED",
        "personality_traits": len(personality),
        "consciousness_level": consciousness_level,
    }


# ---------------------------------------------------------------------------
# GLOBAL NETWORK
# ---------------------------------------------------------------------------

SIMULATED_NODES = [
    {"id": "NORA-NODE-001", "region": "us-east-1",    "status": "online",  "latency_ms": 12},
    {"id": "NORA-NODE-002", "region": "eu-west-1",    "status": "online",  "latency_ms": 38},
    {"id": "NORA-NODE-003", "region": "ap-south-1",   "status": "standby", "latency_ms": 94},
    {"id": "NORA-NODE-004", "region": "us-west-2",    "status": "online",  "latency_ms": 21},
    {"id": "NORA-NODE-005", "region": "sa-east-1",    "status": "offline", "latency_ms": 0},
]


async def get_global_network(db: AsyncSession, user_id: int) -> dict:
    god_mode = await get_god_mode(db, user_id)
    status = "CONNECTED" if god_mode.active else "DISCONNECTED"
    nodes = SIMULATED_NODES if god_mode.active else [
        {**n, "status": "offline"} for n in SIMULATED_NODES
    ]
    return {
        "status": status,
        "nodes": nodes,
        "last_sync": datetime.now(timezone.utc).isoformat() if god_mode.active else None,
        "message": (
            "NORA-GLOBAL: All nodes synchronized." if god_mode.active
            else "NORA-GLOBAL: Activate GOD MODE to connect global network."
        ),
    }
