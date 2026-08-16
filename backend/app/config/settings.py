from pathlib import Path


# ---------------------------------------------------------
# Project directories
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR.parent / "data"

REPOSITORIES_DIR = DATA_DIR / "repositories"

INDEXES_DIR = DATA_DIR / "indexes"

GRAPHS_DIR = DATA_DIR / "graphs"

EMBEDDINGS_DIR = DATA_DIR / "embeddings"

WORKSPACE_DIR = BASE_DIR.parent / "workspace"

CLONED_REPOSITORIES_DIR = WORKSPACE_DIR / "cloned_repositories"

SANDBOX_DIR = WORKSPACE_DIR / "sandbox"


# ---------------------------------------------------------
# Create directories automatically
# ---------------------------------------------------------

for directory in [
    DATA_DIR,
    REPOSITORIES_DIR,
    INDEXES_DIR,
    GRAPHS_DIR,
    EMBEDDINGS_DIR,
    WORKSPACE_DIR,
    CLONED_REPOSITORIES_DIR,
    SANDBOX_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)