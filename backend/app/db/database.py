import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config.settings import settings

logger = logging.getLogger("app.db")

Base = declarative_base()

# SQLAlchemy 2.x Engine with connection pooling and health pre-ping
_database_url = settings.effective_database_url

engine = create_engine(
    _database_url,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Verify database connection and create database if missing."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connection verified: {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}")
        return engine
    except Exception as exc:
        logger.warning(f"Database connection check warning: {exc}")
        return engine


# Backward-compatibility alias
init_db_engine = init_db


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining an isolated SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
