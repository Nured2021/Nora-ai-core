"""
NORA Phase 5 — REST API Router.

GET  /api/phase5/modules          — list all 50 AI modules
GET  /api/phase5/status           — consciousness / system status
GET  /api/phase5/god-mode         — current god mode state
POST /api/phase5/god-mode/toggle  — toggle god mode on/off
GET  /api/phase5/personality      — list personality traits
POST /api/phase5/personality      — set a personality trait
GET  /api/phase5/global-network   — global network status
GET  /api/phase5/evolved-modules  — list evolved (user-created) modules
POST /api/phase5/memory/search    — search brain memories
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.ai.phase5_modules import get_all_modules, get_phase5_modules
from app.modules.nora_phase5 import (
    get_system_status,
    get_god_mode,
    toggle_god_mode,
    set_god_mode,
    get_personality,
    set_personality_trait,
    get_global_network,
    list_evolved_modules,
    search_memories,
)
from app.schemas.phase5 import (
    Phase5ModuleOut,
    PersonalityTraitSet,
    PersonalityStateOut,
    GodModeStateOut,
    GodModeToggleOut,
    SystemStatusOut,
    GlobalNetworkOut,
    EvolvedModuleOut,
    MemorySearchResult,
)

router = APIRouter(prefix="/api/phase5", tags=["phase5"])


@router.get("/modules", response_model=List[Phase5ModuleOut])
async def list_all_modules(
    phase5_only: bool = Query(False, description="Return only Phase 5 modules (41-50)"),
    current_user: User = Depends(get_current_user),
):
    """Return the full 50-module AI registry, or just Phase 5 modules."""
    modules = get_phase5_modules() if phase5_only else get_all_modules()
    return modules


@router.get("/status", response_model=SystemStatusOut)
async def consciousness_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-CONSCIOUS: Full system awareness and state report."""
    return await get_system_status(db, current_user.id)


@router.get("/god-mode", response_model=GodModeStateOut)
async def god_mode_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return current GOD MODE state for the user."""
    state = await get_god_mode(db, current_user.id)
    return state


@router.post("/god-mode/toggle", response_model=GodModeToggleOut)
async def god_mode_toggle(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-GOD: Toggle GOD MODE on/off. ADMIN or DEVELOPER only."""
    if current_user.role not in ("ADMIN", "DEVELOPER"):
        raise HTTPException(status_code=403, detail="GOD MODE requires ADMIN or DEVELOPER role")
    state = await toggle_god_mode(db, current_user.id)
    msg = (
        "⚡ GOD MODE ACTIVATED — NORA has full autonomous control."
        if state.active
        else "GOD MODE deactivated — returning to standard operation."
    )
    return {"active": state.active, "message": msg}


@router.post("/god-mode/on", response_model=GodModeToggleOut)
async def god_mode_on(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Explicitly activate GOD MODE."""
    if current_user.role not in ("ADMIN", "DEVELOPER"):
        raise HTTPException(status_code=403, detail="GOD MODE requires ADMIN or DEVELOPER role")
    state = await set_god_mode(db, current_user.id, True)
    return {
        "active": True,
        "message": "⚡ GOD MODE ACTIVATED — NORA has full autonomous control.",
    }


@router.post("/god-mode/off", response_model=GodModeToggleOut)
async def god_mode_off(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Explicitly deactivate GOD MODE."""
    state = await set_god_mode(db, current_user.id, False)
    return {
        "active": False,
        "message": "GOD MODE deactivated.",
    }


@router.get("/personality", response_model=List[PersonalityStateOut])
async def list_personality(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-SOUL: Return all personality traits for the current user."""
    return await get_personality(db, current_user.id)


@router.post("/personality", response_model=PersonalityStateOut)
async def update_personality(
    body: PersonalityTraitSet,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-SOUL: Set a personality trait (e.g. tone=friendly, style=concise)."""
    trait = await set_personality_trait(db, current_user.id, body.trait.strip().lower(), body.value.strip())
    return trait


@router.get("/global-network", response_model=GlobalNetworkOut)
async def global_network_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-GLOBAL: Return global NORA network node status."""
    return await get_global_network(db, current_user.id)


@router.get("/evolved-modules", response_model=List[EvolvedModuleOut])
async def list_evolutions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-EVOLVE: List all AI modules created by evolution."""
    return await list_evolved_modules(db)


@router.post("/memory/search", response_model=List[MemorySearchResult])
async def memory_search(
    query: str = Query(..., description="Search term for key or value"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NORA-MEMORY: Search all brain memory entries by key or value."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    return await search_memories(db, current_user.id, query.strip())
