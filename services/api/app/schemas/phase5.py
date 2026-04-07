"""
NORA Phase 5 — Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class Phase5ModuleOut(BaseModel):
    number: int
    name: str
    description: str
    phase: int
    active: bool


class PersonalityTraitSet(BaseModel):
    trait: str
    value: str


class PersonalityStateOut(BaseModel):
    id: int
    user_id: int
    trait: str
    value: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class GodModeStateOut(BaseModel):
    user_id: int
    active: bool
    activated_at: Optional[datetime]
    updated_at: datetime

    model_config = {"from_attributes": True}


class GodModeToggleOut(BaseModel):
    active: bool
    message: str


class SystemStatusOut(BaseModel):
    god_mode_active: bool
    active_modules: int
    total_modules: int
    brain_layers: int
    evolved_modules: int
    dream_mode: str
    global_network: str
    personality_traits: int
    consciousness_level: str


class GlobalNetworkOut(BaseModel):
    status: str
    nodes: List[dict]
    last_sync: Optional[str]
    message: str


class EvolvedModuleCreate(BaseModel):
    name: str
    description: str
    capabilities: str


class EvolvedModuleOut(BaseModel):
    id: int
    name: str
    description: str
    capabilities: str
    created_by_id: int
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MemorySearchResult(BaseModel):
    id: int
    user_id: int
    layer: int
    layer_name: str
    key: str
    value: str
    created_at: datetime

    model_config = {"from_attributes": True}
