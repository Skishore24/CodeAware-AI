from pathlib import Path
import re
import shutil
import subprocess

from app.config.paths import CLONED_REPOSITORIES_DIR


class GitHubService:
    """
    Handles GitHub repository operations.
    """

    def __init__(self):
        self.base_directory = CLONED_REPOSITORIES_DIR

    # =====================================================
    # REPOSITORY NAME
    # =====================================================

    def get_repository_name(self, github_url: str) -> str:
        """
        Extract repository name from GitHub URL.
        """

        cleaned_url = github_url.strip().rstrip("/")

        name = cleaned_url.split("/")[-1]

        if name.endswith(".git"):
            name = name[:-4]

        # Keep only safe filesystem characters
        name = re.sub(
            r"[^a-zA-Z0-9_.-]",
            "_",
            name
        )

        return name

    # =====================================================
    # VALIDATE URL
    # =====================================================

    def validate_github_url(self, github_url: str) -> bool:
        """
        Check whether URL looks like a GitHub repository URL.
        """

        pattern = (
            r"^https?://github\.com/"
            r"[^/]+/"
            r"[^/]+"
            r"(?:\.git)?/?$"
        )

        return bool(
            re.match(
                pattern,
                github_url.strip()
            )
        )

    # =====================================================
    # CLONE REPOSITORY
    # =====================================================

    def clone_repository(
        self,
        github_url: str
    ) -> dict:

        github_url = github_url.strip()

        # -------------------------------------------------
        # Validate URL
        # -------------------------------------------------

        if not self.validate_github_url(github_url):

            raise ValueError(
                "Invalid GitHub repository URL."
            )

        # -------------------------------------------------
        # Repository name
        # -------------------------------------------------

        repository_name = (
            self.get_repository_name(github_url)
        )

        repository_path = (
            self.base_directory /
            repository_name
        )

        # -------------------------------------------------
        # Existing repository
        # -------------------------------------------------

        if repository_path.exists():

            return {
                "success": True,
                "message": (
                    "Repository already exists."
                ),
                "repository_name": repository_name,
                "repository_path": str(
                    repository_path
                ),
                "already_exists": True,
            }

        # -------------------------------------------------
        # Clone
        # -------------------------------------------------

        command = [
            "git",
            "clone",
            "--depth",
            "1",
            github_url,
            str(repository_path),
        ]

        try:

            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=300,
            )

        except FileNotFoundError:

            raise RuntimeError(
                "Git is not installed or not available "
                "in PATH."
            )

        except subprocess.TimeoutExpired:

            # Remove incomplete repository
            if repository_path.exists():
                shutil.rmtree(
                    repository_path,
                    ignore_errors=True
                )

            raise RuntimeError(
                "Git clone timed out."
            )

        # -------------------------------------------------
        # Clone failed
        # -------------------------------------------------

        if result.returncode != 0:

            if repository_path.exists():
                shutil.rmtree(
                    repository_path,
                    ignore_errors=True
                )

            error_message = (
                result.stderr.strip()
                or "Git clone failed."
            )

            raise RuntimeError(
                error_message
            )

        # -------------------------------------------------
        # Success
        # -------------------------------------------------

        return {
            "success": True,
            "message": (
                "Repository cloned successfully."
            ),
            "repository_name": repository_name,
            "repository_path": str(
                repository_path
            ),
            "already_exists": False,
        }