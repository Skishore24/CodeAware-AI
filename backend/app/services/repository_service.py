from pathlib import Path
from urllib.parse import urlparse
import re
from git import Repo
from git.exc import GitCommandError


class RepositoryService:
    def __init__(self, workspace_dir: Path | str):
        self.workspace_dir = Path(workspace_dir).resolve()
        self.workspace_dir.mkdir(parents=True, exist_ok=True)

    def extract_repository_name(self, repository_url: str) -> str:
        """
        Extract and sanitize repository name from a GitHub or Git URL.
        Example: https://github.com/user/project.git -> project
        """
        clean_url = repository_url.strip()
        parsed = urlparse(clean_url)

        path = parsed.path.strip("/")
        if not path:
            raise ValueError("Invalid repository URL.")

        repository_name = path.split("/")[-1]
        if repository_name.endswith(".git"):
            repository_name = repository_name[:-4]

        # Sanitize name
        sanitized = re.sub(r"[^A-Za-z0-9_\-\.]", "_", repository_name)
        if not sanitized:
            raise ValueError("Could not determine valid repository name.")

        return sanitized

    def clone_repository(self, repository_url: str) -> dict:
        """
        Clone a Git repository safely into the CodeAware workspace.
        """
        repository_name = self.extract_repository_name(repository_url)
        destination = (self.workspace_dir / repository_name).resolve()

        # Path traversal guard
        if not str(destination).startswith(str(self.workspace_dir)):
            raise ValueError("Target repository directory escapes the workspace.")

        if destination.exists():
            return {
                "success": True,
                "message": "Repository already exists.",
                "repository_name": repository_name,
                "path": str(destination),
            }

        try:
            Repo.clone_from(repository_url.strip(), destination, depth=50)
        except GitCommandError as exc:
            raise RuntimeError(f"Failed to clone repository: {exc}") from exc

        return {
            "success": True,
            "message": "Repository cloned successfully.",
            "repository_name": repository_name,
            "path": str(destination),
        }

    def list_repositories(self) -> list:
        """
        List all cloned repositories in the workspace directory with file counts.
        """
        repos = []
        if not self.workspace_dir.exists():
            return repos

        ignored_names = {".git", ".venv", "venv", "__pycache__", "node_modules", "dist", "build"}

        for item in self.workspace_dir.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                try:
                    file_count = sum(
                        1 for p in item.rglob("*")
                        if p.is_file() and not any(part in ignored_names or part.startswith(".") for part in p.parts)
                    )
                except Exception:
                    file_count = 0

                repos.append({
                    "name": item.name,
                    "path": str(item.resolve()),
                    "files_count": file_count,
                })

        repos.sort(key=lambda r: r["name"].lower())
        return repos