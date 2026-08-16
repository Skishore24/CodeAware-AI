import re
import subprocess
from pathlib import Path
from typing import Dict


class GitHubService:
    """
    Handles GitHub repository cloning.
    """

    def __init__(
        self,
        workspace_path: str
    ):

        self.workspace_path = Path(
            workspace_path
        )

        self.workspace_path.mkdir(
            parents=True,
            exist_ok=True
        )

    # ---------------------------------------------------------
    # Get repository name
    # ---------------------------------------------------------

    def get_repository_name(
        self,
        github_url: str
    ) -> str:

        url = github_url.strip().rstrip("/")

        if url.endswith(".git"):
            url = url[:-4]

        match = re.search(
            r"github\.com/[^/]+/([^/]+)$",
            url
        )

        if not match:
            raise ValueError(
                "Invalid GitHub repository URL."
            )

        return match.group(1)

    # ---------------------------------------------------------
    # Validate URL
    # ---------------------------------------------------------

    def validate_url(
        self,
        github_url: str
    ) -> bool:

        pattern = (
            r"^https://github\.com/"
            r"[^/]+/[^/]+(?:\.git)?/?$"
        )

        return bool(
            re.match(
                pattern,
                github_url.strip()
            )
        )

    # ---------------------------------------------------------
    # Clone repository
    # ---------------------------------------------------------

    def clone_repository(
        self,
        github_url: str
    ) -> Dict:

        github_url = github_url.strip()

        if not self.validate_url(
            github_url
        ):

            return {
                "success": False,
                "error": (
                    "Invalid GitHub URL."
                )
            }

        try:

            repository_name = (
                self.get_repository_name(
                    github_url
                )
            )

            repository_path = (
                self.workspace_path
                / repository_name
            )

            # Already cloned
            if repository_path.exists():

                return {
                    "success": True,
                    "message": (
                        "Repository already exists."
                    ),
                    "repository_name": (
                        repository_name
                    ),
                    "repository_path": str(
                        repository_path.resolve()
                    ),
                    "already_exists": True,
                }

            # Clone
            result = subprocess.run(
                [
                    "git",
                    "clone",
                    github_url,
                    str(repository_path),
                ],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode != 0:

                return {
                    "success": False,
                    "error": (
                        result.stderr.strip()
                        or "Git clone failed."
                    ),
                }

            return {
                "success": True,
                "message": (
                    "Repository cloned successfully."
                ),
                "repository_name": (
                    repository_name
                ),
                "repository_path": str(
                    repository_path.resolve()
                ),
                "already_exists": False,
            }

        except FileNotFoundError:

            return {
                "success": False,
                "error": (
                    "Git was not found. "
                    "Make sure Git is installed "
                    "and available in PATH."
                ),
            }

        except subprocess.TimeoutExpired:

            return {
                "success": False,
                "error": (
                    "Git clone timed out."
                ),
            }

        except Exception as exc:

            return {
                "success": False,
                "error": str(exc),
            }