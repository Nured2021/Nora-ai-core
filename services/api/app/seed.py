"""
Seed database with default users for local testing.
Default credentials:
  admin     / nora-admin-2024  (ADMIN)
  developer / nora-dev-2024    (DEVELOPER)
  viewer    / nora-view-2024   (VIEWER)
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.models.brain import Tactic
from app.core.auth import get_password_hash
from app.core.config import settings
from app.core.database import Base

engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

SEED_USERS = [
    {"username": "admin", "email": "admin@nora.local", "password": "nora-admin-2024", "role": "ADMIN", "workspace": "WorkspaceA"},
    {"username": "developer", "email": "developer@nora.local", "password": "nora-dev-2024", "role": "DEVELOPER", "workspace": "WorkspaceA"},
    {"username": "viewer", "email": "viewer@nora.local", "password": "nora-view-2024", "role": "VIEWER", "workspace": "WorkspaceB"},
]

SEED_TACTICS = [
    {
        "name": "full-stack-app",
        "description": "Build a full-stack application with frontend, backend, and database",
        "steps": [
            "build React frontend with TypeScript",
            "build FastAPI backend with Postgres",
            "build database schema and migrations",
            "run tests for frontend and backend",
        ],
    },
    {
        "name": "todo-app",
        "description": "Quick todo app scaffold",
        "steps": [
            "build todo app with React and local storage",
        ],
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # Seed users
        for u in SEED_USERS:
            result = await db.execute(select(User).where(User.username == u["username"]))
            if not result.scalar_one_or_none():
                user = User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"],
                    workspace=u["workspace"],
                )
                db.add(user)

        await db.flush()

        # Get admin user for tactics
        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()

        if admin:
            for t in SEED_TACTICS:
                result = await db.execute(select(Tactic).where(Tactic.name == t["name"]))
                if not result.scalar_one_or_none():
                    tactic = Tactic(
                        name=t["name"],
                        description=t["description"],
                        steps=t["steps"],
                        created_by_id=admin.id,
                    )
                    db.add(tactic)

        await db.commit()
        print("✅ Seed data inserted successfully")


if __name__ == "__main__":
    asyncio.run(seed())
