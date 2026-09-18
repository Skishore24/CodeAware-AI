import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central Application Settings using Pydantic Settings.
    Reads from environment variables and backend/.env file.
    """
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General
    APP_NAME: str = "CodeAware AI"
    APP_ENV: str = "development"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # MySQL Database Settings
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: Optional[str] = None
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "codeaware_db"
    DATABASE_URL: Optional[str] = None

    # Ollama Local LLM Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_FAST_MODEL: str = "llama3.2:3b"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text:latest"
    OLLAMA_TIMEOUT_SECONDS: int = 60

    # JWT Authentication
    JWT_SECRET_KEY: str = "codeaware-ai-enterprise-jwt-super-secret-key-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Storage Paths
    REPOSITORY_STORAGE_PATH: str = "workspace/cloned_repositories"
    VECTOR_STORAGE_PATH: str = "data/indexes"
    SANDBOX_STORAGE_PATH: str = "workspace/sandbox"

    # GitHub
    GITHUB_TOKEN: Optional[str] = None

    @property
    def effective_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        pw = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
        return f"mysql+pymysql://{self.MYSQL_USER}{pw}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"


settings = Settings()

# Backward compatibility exports
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
WORKSPACE_DIR = PROJECT_ROOT / "workspace"
CLONED_REPOSITORIES_DIR = Path(settings.REPOSITORY_STORAGE_PATH) if Path(settings.REPOSITORY_STORAGE_PATH).is_absolute() else PROJECT_ROOT / settings.REPOSITORY_STORAGE_PATH
SANDBOX_DIR = Path(settings.SANDBOX_STORAGE_PATH) if Path(settings.SANDBOX_STORAGE_PATH).is_absolute() else PROJECT_ROOT / settings.SANDBOX_STORAGE_PATH