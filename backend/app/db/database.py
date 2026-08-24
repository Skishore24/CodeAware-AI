import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Database Configuration
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", None)
if MYSQL_PASSWORD == "":
    MYSQL_PASSWORD = None
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_DB = os.getenv("MYSQL_DB", "codeaware_db")

# Build URLs with SQLAlchemy URL.create
MYSQL_SERVER_URL = URL.create(
    drivername="mysql+pymysql",
    username=MYSQL_USER,
    password=MYSQL_PASSWORD,
    host=MYSQL_HOST,
    port=MYSQL_PORT,
)

MYSQL_DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=MYSQL_USER,
    password=MYSQL_PASSWORD,
    host=MYSQL_HOST,
    port=MYSQL_PORT,
    database=MYSQL_DB,
)

SQLITE_FALLBACK_URL = "sqlite:///./codeaware.db"

Base = declarative_base()
engine = None
SessionLocal = None


def init_db_engine():
    global engine, SessionLocal
    try:
        server_engine = create_engine(
            MYSQL_SERVER_URL,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2},
        )
        with server_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
            conn.commit()
        logger.info(f"Connected to MySQL on {MYSQL_HOST}:{MYSQL_PORT}. Database '{MYSQL_DB}' ensured.")

        engine = create_engine(
            MYSQL_DATABASE_URL,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2},
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return engine
    except Exception as e:
        logger.warning(
            f"MySQL connection ({e}). Falling back to SQLite database for uninterrupted operations."
        )
        engine = create_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return engine


def get_db():
    if SessionLocal is None:
        init_db_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
