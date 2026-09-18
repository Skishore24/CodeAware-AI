import os
from pathlib import Path
from app.config.settings import settings

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
REPOSITORIES_DATA_DIR = DATA_DIR / "repositories"
INDEXES_DIR = PROJECT_ROOT / Path(settings.VECTOR_STORAGE_PATH) if not Path(settings.VECTOR_STORAGE_PATH).is_absolute() else Path(settings.VECTOR_STORAGE_PATH)
GRAPHS_DIR = DATA_DIR / "graphs"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"

WORKSPACE_DIR = PROJECT_ROOT / "workspace"
CLONED_REPOSITORIES_DIR = PROJECT_ROOT / Path(settings.REPOSITORY_STORAGE_PATH) if not Path(settings.REPOSITORY_STORAGE_PATH).is_absolute() else Path(settings.REPOSITORY_STORAGE_PATH)
SANDBOX_DIR = PROJECT_ROOT / Path(settings.SANDBOX_STORAGE_PATH) if not Path(settings.SANDBOX_STORAGE_PATH).is_absolute() else Path(settings.SANDBOX_STORAGE_PATH)

DIRECTORIES = [
    DATA_DIR,
    REPOSITORIES_DATA_DIR,
    INDEXES_DIR,
    GRAPHS_DIR,
    EMBEDDINGS_DIR,
    WORKSPACE_DIR,
    CLONED_REPOSITORIES_DIR,
    SANDBOX_DIR,
]

for directory in DIRECTORIES:
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass