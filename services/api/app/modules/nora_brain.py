"""
NORA-BRAIN: Remembers everything. Learns from user.
Implements the 10 Brain Connect layers.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.brain import BrainMemory

BRAIN_LAYERS = {
    1: "Command History Memory",
    2: "Code Pattern Recognition",
    3: "User Preference Learning",
    4: "System State Tracking",
    5: "HumanLoop Feedback Storage",
    6: "Deployment Target Memory",
    7: "Error Recovery Tactics",
    8: "Multi-User Role Mapping",
    9: "Builder Template Library",
    10: "Real-Time Feedback Loop",
}


async def store_memory(
    db: AsyncSession,
    user_id: int,
    layer: int,
    key: str,
    value: str,
):
    layer_name = BRAIN_LAYERS.get(layer, f"Layer {layer}")
    result = await db.execute(
        select(BrainMemory).where(
            BrainMemory.user_id == user_id,
            BrainMemory.layer == layer,
            BrainMemory.key == key,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.value = value
    else:
        db.add(BrainMemory(user_id=user_id, layer=layer, layer_name=layer_name, key=key, value=value))
    await db.flush()


async def recall_memory(
    db: AsyncSession,
    user_id: int,
    layer: Optional[int] = None,
) -> list:
    query = select(BrainMemory).where(BrainMemory.user_id == user_id)
    if layer is not None:
        query = query.where(BrainMemory.layer == layer)
    query = query.order_by(BrainMemory.layer, BrainMemory.key)
    result = await db.execute(query)
    return result.scalars().all()


async def record_command_history(db: AsyncSession, user_id: int, command: str, input_text: str):
    import json
    from datetime import datetime, timezone
    key = f"cmd_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"command": command, "input": input_text})
    await store_memory(db, user_id, 1, key, value)


async def record_user_preference(db: AsyncSession, user_id: int, pref_key: str, pref_value: str):
    await store_memory(db, user_id, 3, pref_key, pref_value)


async def record_error_recovery(db: AsyncSession, user_id: int, error: str, recovery: str):
    import json
    from datetime import datetime, timezone
    key = f"err_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"error": error, "recovery": recovery})
    await store_memory(db, user_id, 7, key, value)
