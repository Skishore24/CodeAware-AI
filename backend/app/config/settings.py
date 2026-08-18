from pathlib import Path

from app.config.paths import (
    PROJECT_ROOT,
    DATA_DIR,
    WORKSPACE_DIR,
    CLONED_REPOSITORIES_DIR,
    SANDBOX_DIR,
)


class Settings:
    """
    Central application settings.
    """

    APP_NAME = "CodeAware AI"

    VERSION = "1.0.0"

    DEBUG = True

    PROJECT_ROOT: Path = PROJECT_ROOT

    DATA_DIR: Path = DATA_DIR

    WORKSPACE_DIR: Path = WORKSPACE_DIR

    CLONED_REPOSITORIES_DIR: Path = (
        CLONED_REPOSITORIES_DIR
    )

    SANDBOX_DIR: Path = (
        SANDBOX_DIR
    )


settings = Settings()