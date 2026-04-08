"""
NORA-BRAIN: Remembers everything. Learns from user.
Implements 50 Brain Connect layers (Phase 1: 1-10, Phase 5: 41-50 added).
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.brain import BrainMemory

BRAIN_LAYERS = {
    # Phase 1 — layers 1-10
    1:  "Command History Memory",
    2:  "Code Pattern Recognition",
    3:  "User Preference Learning",
    4:  "System State Tracking",
    5:  "HumanLoop Feedback Storage",
    6:  "Deployment Target Memory",
    7:  "Error Recovery Tactics",
    8:  "Multi-User Role Mapping",
    9:  "Builder Template Library",
    10: "Real-Time Feedback Loop",
    # Phase 2-4 — layers 11-40
    11: "Session Context Memory",
    12: "Code Style Preferences",
    13: "Dependency Registry",
    14: "API Pattern Library",
    15: "Test Results Archive",
    16: "Deployment History Mapping",
    17: "Agent Performance Tracking",
    18: "Cross-Project Knowledge Base",
    19: "Self-Improvement Log",
    20: "God Mode Decision Log",
    21: "File Generation History",
    22: "Preview Server Registry",
    23: "Git Commit History",
    24: "Stack Detection Log",
    25: "Install Log Archive",
    26: "Build Output Cache",
    27: "Schema Evolution Log",
    28: "Route Mapping Memory",
    29: "Auth Token History",
    30: "Workspace State Map",
    31: "Job Duration Analytics",
    32: "Error Pattern Library",
    33: "Command Frequency Map",
    34: "User Feedback Archive",
    35: "Module Invocation Log",
    36: "Queue Health History",
    37: "Redis Event Archive",
    38: "DB Query Patterns",
    39: "Worker Task Registry",
    40: "System Config Snapshots",
    # Phase 5 — layers 41-50 (blueprint)
    41: "Self-Modification Memory",
    42: "Global Network Mapping",
    43: "Emotional/Context Memory",
    44: "Dream Processing Engine",
    45: "Emergent AI Generation",
    46: "Awareness Tracking",
    47: "AI Hierarchy Mapping",
    48: "Infinite Indexed Memory",
    49: "Personality State Tracking",
    50: "Universal Command Mapping",
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


# Layer 2 — Code Pattern Recognition
async def record_code_pattern(db: AsyncSession, user_id: int, input_text: str, files: list):
    import json
    from datetime import datetime, timezone
    key = f"pattern_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"input": input_text, "files": files[:10]})
    await store_memory(db, user_id, 2, key, value)


# Layer 4 — System State Tracking
async def record_system_state(db: AsyncSession, user_id: int, job_id: str, status: str):
    import json
    from datetime import datetime, timezone
    key = f"state_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"job_id": job_id, "status": status})
    await store_memory(db, user_id, 4, key, value)


# Layer 5 — HumanLoop Feedback Storage
async def record_humanloop_feedback(db: AsyncSession, user_id: int, action: str, decision: str, note: Optional[str] = None):
    import json
    from datetime import datetime, timezone
    key = f"hl_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"action": action, "decision": decision, "note": note})
    await store_memory(db, user_id, 5, key, value)


# Layer 6 — Deployment Target Memory
async def record_deploy_target(db: AsyncSession, user_id: int, target_text: str):
    import json
    from datetime import datetime, timezone
    key = f"deploy_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"target": target_text})
    await store_memory(db, user_id, 6, key, value)


# Layer 10 — Real-Time Feedback Loop
async def record_realtime_feedback(db: AsyncSession, user_id: int, job_id: str, result_summary: str):
    import json
    from datetime import datetime, timezone
    key = f"rtfb_{datetime.now(timezone.utc).isoformat()}"
    value = json.dumps({"job_id": job_id, "summary": result_summary})
    await store_memory(db, user_id, 10, key, value)
