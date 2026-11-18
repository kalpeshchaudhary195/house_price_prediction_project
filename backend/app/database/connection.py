"""Database connection management supporting PostgreSQL with graceful fallback."""

import logging
import os
import re
from typing import Dict, Any, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

logger = logging.getLogger("house_pricing.database")
Base = declarative_base()

_engine = None
_SessionLocal = None
_db_status: Dict[str, Any] = {
    "configured": False,
    "type": "none",
    "status": "uninitialized",
    "message": "",
}


def get_database_url() -> str:
    """Retrieves and sanitizes database connection string from environment."""
    url = os.getenv("DATABASE_URL", "").strip()

    # Also support component env vars
    if not url:
        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT", "5432")
        user = os.getenv("DB_USER")
        password = os.getenv("DB_PASSWORD")
        name = os.getenv("DB_NAME")
        if host and user and name:
            pwd_part = f":{password}" if password else ""
            url = f"postgresql://{user}{pwd_part}@{host}:{port}/{name}"

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url


def sanitize_url_for_logging(url: str) -> str:
    """Masks database credentials for secure logging and API status."""
    if not url:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", url)


def init_db():
    """Initializes database engine and tables, with graceful fallback if PostgreSQL is absent."""
    global _engine, _SessionLocal, _db_status

    target_url = get_database_url()
    is_postgres = bool(target_url and "postgresql" in target_url)

    if is_postgres:
        try:
            logger.info("Attempting connection to PostgreSQL at %s", sanitize_url_for_logging(target_url))
            engine = create_engine(target_url, pool_pre_ping=True, pool_size=5, max_overflow=10)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            _engine = engine
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
            _db_status = {
                "configured": True,
                "type": "postgresql",
                "status": "connected",
                "url": sanitize_url_for_logging(target_url),
                "message": "Connected to PostgreSQL successfully.",
            }
            logger.info("PostgreSQL connected successfully.")
            Base.metadata.create_all(bind=_engine)
            return _engine
        except Exception as e:
            logger.warning("PostgreSQL connection failed (%s). Falling back to SQLite local storage.", e)
            _db_status = {
                "configured": True,
                "type": "sqlite-fallback",
                "status": "fallback",
                "url": "sqlite:///predictions.db",
                "message": f"PostgreSQL connection failed ({e}). Operating on local fallback SQLite storage.",
            }
    else:
        logger.info("PostgreSQL not configured in DATABASE_URL. Using SQLite fallback for local persistence.")
        _db_status = {
            "configured": False,
            "type": "sqlite-fallback",
            "status": "fallback",
            "url": "sqlite:///predictions.db",
            "message": "PostgreSQL not configured. Set DATABASE_URL=postgresql://user:pass@localhost:5432/dbname in .env to enable. Operating on SQLite fallback.",
        }

    # SQLite fallback
    fallback_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "predictions.db")
    fallback_url = f"sqlite:///{fallback_path}"
    _engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    Base.metadata.create_all(bind=_engine)
    return _engine


def get_db_status() -> Dict[str, Any]:
    """Returns database status dictionary."""
    if _engine is None:
        init_db()
    return _db_status


def get_db() -> Generator[Session, None, None]:
    """Yields a database session."""
    if _SessionLocal is None:
        init_db()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()

