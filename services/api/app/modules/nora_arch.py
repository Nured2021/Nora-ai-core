"""
NORA-ARCH: Designs systems: frontend, backend, database, queues.
Generates system architecture plans from natural language input.
"""
from typing import TypedDict


class ArchPlan(TypedDict):
    frontend: list[str]
    backend: list[str]
    database: list[str]
    queues: list[str]
    description: str


def design_architecture(input_text: str) -> ArchPlan:
    """
    Analyze the input description and return a structured architecture plan.
    Phase 1: deterministic mock output based on keywords.
    """
    text = input_text.lower()

    frontend: list[str] = []
    backend: list[str] = []
    database: list[str] = []
    queues: list[str] = []

    # Frontend detection
    if any(k in text for k in ["react", "frontend", "ui", "dashboard", "app", "web"]):
        frontend = [
            "frontend/src/App.tsx",
            "frontend/src/components/",
            "frontend/src/pages/",
            "frontend/src/hooks/",
            "frontend/package.json",
            "frontend/tsconfig.json",
        ]
    else:
        frontend = ["frontend/src/App.tsx", "frontend/package.json"]

    # Backend detection
    if any(k in text for k in ["api", "backend", "fastapi", "rest", "server"]):
        backend = [
            "backend/app/main.py",
            "backend/app/routers/",
            "backend/app/models/",
            "backend/app/schemas/",
            "backend/requirements.txt",
        ]
    else:
        backend = ["backend/app/main.py", "backend/requirements.txt"]

    # Database detection
    if any(k in text for k in ["postgres", "database", "sql", "db", "data", "store"]):
        database = [
            "database/migrations/001_init.sql",
            "database/schema.sql",
        ]
    else:
        database = ["database/migrations/001_init.sql"]

    # Queue detection
    if any(k in text for k in ["queue", "celery", "redis", "worker", "async", "background"]):
        queues = ["worker/tasks/", "worker/celery_app.py"]

    description = f"Architecture for: {input_text}"

    return ArchPlan(
        frontend=frontend,
        backend=backend,
        database=database,
        queues=queues,
        description=description,
    )


def get_file_tree(arch: ArchPlan) -> list[str]:
    """Return the complete flat file list from an architecture plan."""
    return arch["frontend"] + arch["backend"] + arch["database"] + arch["queues"]
