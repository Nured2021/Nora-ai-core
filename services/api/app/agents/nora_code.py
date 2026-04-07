"""
NORA-CODE Agent — Phase 2

Takes a plan from NORA-ARCH and generates source files via AI.
"""
from __future__ import annotations

from app.ai.ai_service import generate_code


async def run_code(plan: dict) -> list[dict]:
    """
    Generate source files from a structured plan.

    Returns:
        [{"path": str, "content": str}, ...]
    """
    return generate_code(plan)
