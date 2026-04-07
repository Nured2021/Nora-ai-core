"""
NORA-ARCH Agent — Phase 2

Takes a user command/prompt and returns a structured build plan via AI.
"""
from __future__ import annotations

from app.ai.ai_service import generate_plan


async def run_arch(prompt: str) -> dict:
    """
    Generate a structured build plan for the given prompt.

    Returns:
        {
            "name": str,
            "stack": list[str],
            "steps": list[str],
            "files": list[str]
        }
    """
    return generate_plan(prompt)
