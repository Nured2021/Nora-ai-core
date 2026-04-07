"""
NORA Phase 3 — File System Writer

Writes AI-generated files into /workspace/{job_id}/ on disk.
"""
from __future__ import annotations

import os
from pathlib import Path

WORKSPACE_ROOT: str = os.getenv("WORKSPACE_ROOT", "/workspace")


def create_project_folder(job_id: str) -> str:
    """Create /workspace/{job_id}/ and return its absolute path."""
    path = os.path.join(WORKSPACE_ROOT, job_id)
    os.makedirs(path, exist_ok=True)
    return path


def write_files(job_id: str, files: list[dict[str, str]]) -> str:
    """
    Write a list of {path, content} dicts into /workspace/{job_id}/.
    Parent directories are created automatically.
    Returns the project root path.
    """
    project_path = create_project_folder(job_id)
    for file in files:
        file_abs = os.path.join(project_path, file["path"])
        # Prevent path traversal
        if not os.path.abspath(file_abs).startswith(os.path.abspath(project_path)):
            continue
        os.makedirs(os.path.dirname(file_abs), exist_ok=True)
        with open(file_abs, "w", encoding="utf-8") as fh:
            fh.write(file.get("content", ""))
    return project_path
