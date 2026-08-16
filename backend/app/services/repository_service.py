from pathlib import Path
from urllib.parse import urlparse

from git import Repo
from git.exc import GitCommandError


class RepositoryService:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)

    def extract_repository_name(self, repository_url: str) -> str:
        """
        Extract repository name from a GitHub URL.

        Example:
        https://github.com/user/project.git
        -> project
        """

        parsed = urlparse(repository_url)

        if parsed.netloc.lower() != "github.com":
            raise ValueError("Only GitHub repositories are supported.")

        path = parsed.path.strip("/")

        if not path:
            raise ValueError("Invalid GitHub repository URL.")

        repository_name = path.split("/")[-1]

        if repository_name.endswith(".git"):
            repository_name = repository_name[:-4]

        if not repository_name:
            raise ValueError("Could not determine repository name.")

        return repository_name

    def clone_repository(self, repository_url: str) -> dict:
        """
        Clone a GitHub repository into the CodeAware workspace.
        """

        repository_name = self.extract_repository_name(repository_url)

        destination = self.workspace_dir / repository_name

        # Remove old repository handling will be added later.
        if destination.exists():
            return {
                "success": True,
                "message": "Repository already exists.",
                "repository_name": repository_name,
                "path": str(destination),
            }

        try:
            Repo.clone_from(repository_url, destination)

        except GitCommandError as exc:
            raise RuntimeError(
                f"Failed to clone repository: {exc}"
            ) from exc

        return {
            "success": True,
            "message": "Repository cloned successfully.",
            "repository_name": repository_name,
            "path": str(destination),
        }