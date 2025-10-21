"""Database base utilities and helpers."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from services.database.config import get_settings
from services.database.session import Base, SessionLocal, engine as default_engine


def get_engine() -> Engine:
    """Get the database engine."""
    return default_engine


def init_db() -> None:
    """Initialize database tables.

    Creates all tables defined in models that inherit from Base.
    This should be called on application startup or via migrations.
    """
    Base.metadata.create_all(bind=default_engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database sessions.

    Usage in FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager for database sessions.

    Usage:
        with db_session() as db:
            db.add(item)
            db.commit()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
