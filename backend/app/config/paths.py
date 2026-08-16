from pathlib import Path


# ---------------------------------------------------------
# Project root directories
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[2]

PROJECT_ROOT = BACKEND_DIR.parent


# ---------------------------------------------------------
# Workspace
# ---------------------------------------------------------

WORKSPACE_DIR = PROJECT_ROOT / "workspace"

CLONED_REPOSITORIES_DIR = WORKSPACE_DIR / "cloned_repositories"

SANDBOX_DIR = WORKSPACE_DIR / "sandbox"


# ---------------------------------------------------------
# Data storage
# ---------------------------------------------------------

DATA_DIR = PROJECT_ROOT / "data"

REPOSITORIES_DIR = DATA_DIR / "repositories"

INDEXES_DIR = DATA_DIR / "indexes"

GRAPHS_DIR = DATA_DIR / "graphs"

EMBEDDINGS_DIR = DATA_DIR / "embeddings"


# ---------------------------------------------------------
# Auto-create all required directories
# ---------------------------------------------------------

for _directory in [
    WORKSPACE_DIR,
    CLONED_REPOSITORIES_DIR,
    SANDBOX_DIR,
    DATA_DIR,
    REPOSITORIES_DIR,
    INDEXES_DIR,
    GRAPHS_DIR,
    EMBEDDINGS_DIR,
]:
    _directory.mkdir(parents=True, exist_ok=True)