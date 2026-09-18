import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_path = str(Path(__file__).parent.parent / "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Set test environment
os.environ["APP_ENV"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-codeaware-ai-platform-testing"

import pytest
from app.config.settings import settings
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

settings.APP_ENV = "test"

from app.core.security import get_password_hash
from app.db.database import Base, get_db
from app.llm.router import ModelRouter
from app.main import app
from app.models import (
    Role,
    User,
)

# In-memory SQLite for instant, isolated test runs in CI
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all database schema tables for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provides a fresh isolated database transaction per test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed default test roles and test user
    admin_role = session.query(Role).filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Full administrator access")
        dev_role = Role(name="developer", description="Developer access")
        session.add_all([admin_role, dev_role])
        session.commit()

    test_user = session.query(User).filter_by(email="test@codeaware.ai").first()
    if not test_user:
        test_user = User(
            email="test@codeaware.ai",
            hashed_password=get_password_hash("TestPassword123!"),
            full_name="Test User",
            role="ADMIN",
            is_active=True,
        )
        session.add(test_user)
        session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden database session and test auth."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def model_router():
    """Model router in test mode using TestLLMProvider."""
    router = ModelRouter()
    return router


@pytest.fixture
def temp_workspace(tmp_path):
    """Temporary repository workspace for file and sandbox testing."""
    repo_dir = tmp_path / "sample_repo"
    repo_dir.mkdir()
    
    src_dir = repo_dir / "src"
    src_dir.mkdir()
    
    main_file = src_dir / "calculator.py"
    main_file.write_text(
        "def add(a: int, b: int) -> int:\n"
        "    return a + b\n\n"
        "def divide(a: int, b: int) -> float:\n"
        "    if b == 0:\n"
        "        raise ValueError('Division by zero')\n"
        "    return a / b\n"
    )
    return repo_dir
