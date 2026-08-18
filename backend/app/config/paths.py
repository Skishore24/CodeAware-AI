from pathlib import Path


# =========================================================
# PROJECT ROOT
# =========================================================

BACKEND_DIR = Path(__file__).resolve().parents[2]

PROJECT_ROOT = BACKEND_DIR.parent


# =========================================================
# DATA DIRECTORIES
# =========================================================

DATA_DIR = PROJECT_ROOT / "data"

REPOSITORIES_DATA_DIR = (
    DATA_DIR / "repositories"
)

INDEXES_DIR = (
    DATA_DIR / "indexes"
)

GRAPHS_DIR = (
    DATA_DIR / "graphs"
)

EMBEDDINGS_DIR = (
    DATA_DIR / "embeddings"
)


# =========================================================
# WORKSPACE
# =========================================================

WORKSPACE_DIR = (
    PROJECT_ROOT / "workspace"
)

CLONED_REPOSITORIES_DIR = (
    WORKSPACE_DIR / "cloned_repositories"
)

SANDBOX_DIR = (
    WORKSPACE_DIR / "sandbox"
)


# =========================================================
# CREATE DIRECTORIES
# =========================================================

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
    directory.mkdir(
        parents=True,
        exist_ok=True
    )