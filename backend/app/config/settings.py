# ---------------------------------------------------------
# settings.py — re-exports from paths.py
#
# All path constants are now defined in paths.py.
# This file exists for backwards-compatibility so that
# existing imports (from app.config.settings import ...)
# continue to work without changes.
# ---------------------------------------------------------

from app.config.paths import (  # noqa: F401
    PROJECT_ROOT,
    BACKEND_DIR,
    WORKSPACE_DIR,
    CLONED_REPOSITORIES_DIR,
    SANDBOX_DIR,
    DATA_DIR,
    REPOSITORIES_DIR,
    INDEXES_DIR,
    GRAPHS_DIR,
    EMBEDDINGS_DIR,
)