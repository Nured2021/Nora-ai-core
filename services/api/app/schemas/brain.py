from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class TacticCreate(BaseModel):
    name: str
    description: str
    steps: List[str]


class TacticOut(BaseModel):
    id: int
    name: str
    description: str
    steps: List[Any]
    created_by_id: int
    run_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrainMemoryOut(BaseModel):
    id: int
    user_id: int
    layer: int
    layer_name: str
    key: str
    value: str
    created_at: datetime

    model_config = {"from_attributes": True}
