"""
Shared database session for the worker.
Uses synchronous SQLAlchemy for Celery compatibility.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_SYNC_URL = os.getenv(
    "DATABASE_SYNC_URL", "postgresql://nora:nora_pass@postgres:5432/nora_db"
)

engine = create_engine(DATABASE_SYNC_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_session():
    return SessionLocal()
