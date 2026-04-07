"""
NORA AI Service — Phase 2

OpenAI integration for plan generation and code generation.
Falls back gracefully to structured simulation when OPENAI_API_KEY is not set
or when the openai package is not available.
"""
from __future__ import annotations

import json
import os
from typing import Any

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

_PLAN_SYSTEM = """\
You are NORA-ARCH, an expert software architect.
Given a user request, produce a JSON plan in exactly this format:
{
  "name": "<short project name (kebab-case)>",
  "stack": ["<tech1>", "<tech2>"],
  "steps": ["<step1>", "<step2>", ...],
  "files": ["<file_path1>", "<file_path2>", ...]
}
Return only valid JSON with no markdown fences."""

_CODE_SYSTEM = """\
You are NORA-CODE, an expert software engineer.
Given a JSON plan, generate all source files listed in plan.files.
Return a JSON array in exactly this format:
[
  {"path": "<file_path>", "content": "<full file content>"},
  ...
]
Generate complete, working code for every file. Return only valid JSON."""


def _get_client() -> Any | None:
    if not OPENAI_API_KEY:
        return None
    try:
        from openai import OpenAI  # type: ignore
        return OpenAI(api_key=OPENAI_API_KEY)
    except ImportError:
        return None


def generate_plan(prompt: str) -> dict[str, Any]:
    """Call OpenAI to generate a structured build plan, or return a fallback."""
    client = _get_client()
    if client:
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": _PLAN_SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            return json.loads(resp.choices[0].message.content)
        except Exception:
            pass
    return _fallback_plan(prompt)


def generate_code(plan: dict[str, Any]) -> list[dict[str, str]]:
    """Call OpenAI to generate source files from a plan, or return fallback stubs."""
    client = _get_client()
    if client:
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": _CODE_SYSTEM},
                    {"role": "user", "content": json.dumps(plan)},
                ],
                temperature=0.2,
            )
            raw = resp.choices[0].message.content.strip()
            # Strip markdown fences if present
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception:
            pass
    return _fallback_code(plan)


# ---------------------------------------------------------------------------
# Fallback helpers (used when OpenAI is unavailable)
# ---------------------------------------------------------------------------

def _fallback_plan(prompt: str) -> dict[str, Any]:
    lower = prompt.lower()
    if "todo" in lower or "task list" in lower:
        return {
            "name": "todo-app",
            "stack": ["React", "TypeScript", "FastAPI", "PostgreSQL"],
            "steps": [
                "Design React todo UI with add/remove/toggle",
                "Create FastAPI backend with CRUD endpoints",
                "Set up PostgreSQL database schema",
                "Wire frontend to backend REST API",
                "Add Docker configuration",
            ],
            "files": [
                "frontend/src/App.tsx",
                "frontend/src/components/TodoList.tsx",
                "frontend/src/components/TodoItem.tsx",
                "backend/app/main.py",
                "backend/app/models.py",
                "backend/app/database.py",
                "docker-compose.yml",
            ],
        }
    if "crm" in lower:
        return {
            "name": "crm-app",
            "stack": ["React", "TypeScript", "FastAPI", "PostgreSQL"],
            "steps": [
                "Design contact management UI",
                "Create contacts CRUD API",
                "Add dashboard with statistics",
                "Set up database schema for contacts/deals",
                "Add Docker configuration",
            ],
            "files": [
                "frontend/src/App.tsx",
                "frontend/src/pages/Contacts.tsx",
                "frontend/src/pages/Dashboard.tsx",
                "backend/app/main.py",
                "backend/app/routers/contacts.py",
                "backend/app/models.py",
                "docker-compose.yml",
            ],
        }
    if "rest" in lower or "api" in lower:
        return {
            "name": "rest-api",
            "stack": ["FastAPI", "PostgreSQL", "Docker"],
            "steps": [
                "Set up FastAPI project structure",
                "Create database models with SQLAlchemy",
                "Implement CRUD endpoints",
                "Add JWT authentication middleware",
                "Create Docker configuration",
            ],
            "files": [
                "app/main.py",
                "app/routers/items.py",
                "app/models.py",
                "app/database.py",
                "app/schemas.py",
                "Dockerfile",
                "docker-compose.yml",
            ],
        }
    if "dashboard" in lower or "chart" in lower:
        return {
            "name": "analytics-dashboard",
            "stack": ["React", "TypeScript", "Recharts", "FastAPI"],
            "steps": [
                "Design dashboard layout with sidebar",
                "Add chart components for analytics",
                "Create data API endpoints",
                "Wire charts to live data",
                "Add Docker configuration",
            ],
            "files": [
                "frontend/src/App.tsx",
                "frontend/src/components/Sidebar.tsx",
                "frontend/src/components/ChartPanel.tsx",
                "frontend/src/pages/Dashboard.tsx",
                "backend/app/main.py",
                "backend/app/routers/analytics.py",
                "docker-compose.yml",
            ],
        }
    # Generic fallback
    words = prompt.strip().split()
    slug = "-".join(w.lower() for w in words[:3] if w.isalpha()) or "nora-app"
    return {
        "name": slug,
        "stack": ["React", "FastAPI", "PostgreSQL", "Docker"],
        "steps": [
            f"Analyze requirements: {prompt[:80]}",
            "Design application architecture",
            "Generate frontend components",
            "Generate backend REST API",
            "Add Docker configuration",
        ],
        "files": [
            "frontend/src/App.tsx",
            "frontend/src/components/Main.tsx",
            "backend/app/main.py",
            "backend/app/models.py",
            "docker-compose.yml",
        ],
    }


def _fallback_code(plan: dict[str, Any]) -> list[dict[str, str]]:
    name = plan.get("name", "app")
    files = plan.get("files", [])
    result = []
    for path in files:
        result.append({"path": path, "content": _stub_content(path, name)})
    return result


def _stub_content(path: str, name: str) -> str:  # noqa: C901
    if path.endswith(".tsx") and "App" in path:
        return f"""\
import React from 'react';
import './index.css';

function App() {{
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
        <p className="text-gray-500 mt-2">Generated by NORA AI — Phase 2</p>
      </div>
    </div>
  );
}}

export default App;
"""
    if path.endswith(".tsx"):
        component = path.split("/")[-1].replace(".tsx", "")
        return f"""\
import React from 'react';

interface {component}Props {{
  // props
}}

export const {component}: React.FC<{component}Props> = () => {{
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">{component}</h2>
    </div>
  );
}};

export default {component};
"""
    if path.endswith("main.py"):
        return f"""\
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="{name}", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {{"status": "ok", "service": "{name}"}}
"""
    if path.endswith("models.py"):
        return f"""\
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
"""
    if path.endswith("database.py"):
        return """\
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
engine = create_async_engine(DATABASE_URL)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with SessionLocal() as db:
        yield db
"""
    if "docker-compose" in path:
        safe_name = name.replace("-", "_")
        return f"""\
version: '3.9'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://app:app_pass@postgres/{safe_name}_db
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: {safe_name}_db
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app_pass
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
"""
    if path.endswith("Dockerfile"):
        return """\
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    if path.endswith(".py"):
        return f"# Generated by NORA-CODE for {name}\n# File: {path}\n\n"
    if path.endswith(".ts") or path.endswith(".tsx"):
        return f"// Generated by NORA-CODE for {name}\n// File: {path}\n\n"
    return f"# Generated by NORA-CODE for {name}\n# File: {path}\n"
