import os
import shutil
import stat
from pathlib import Path
from urllib.parse import urlparse
import re
from git import Repo
from git.exc import GitCommandError


import subprocess
import logging

logger = logging.getLogger(__name__)


def _force_writable(path: str | Path):
    try:
        os.chmod(path, stat.S_IWRITE | stat.S_IWUSR | stat.S_IRUSR)
    except Exception:
        pass


def robust_rmtree(target_dir: Path | str):
    """
    Robust recursive directory deletion on Windows and POSIX.
    Handles Git pack files, read-only attributes, and Windows permission locks.
    """
    p = Path(target_dir).resolve()
    if not p.exists():
        return

    # Step 1: Recursively strip Windows read-only attributes
    for root, dirs, files in os.walk(str(p)):
        for fname in files:
            _force_writable(os.path.join(root, fname))
        for dname in dirs:
            _force_writable(os.path.join(root, dname))
    _force_writable(p)

    # Step 2: Try Python shutil.rmtree
    def _handle_error(func, path, exc_info):
        _force_writable(path)
        try:
            func(path)
        except Exception:
            pass

    try:
        # Python 3.12+ supports onexc parameter
        try:
            def on_exc(func, path, exc):
                _force_writable(path)
                try:
                    func(path)
                except Exception:
                    pass
            shutil.rmtree(p, onexc=on_exc)
        except TypeError:
            shutil.rmtree(p, onerror=_handle_error)
    except Exception as e:
        logger.warning(f"shutil.rmtree raised exception: {e}")

    # Step 3: Windows native fallback cmd /c rmdir /s /q
    if p.exists() and os.name == "nt":
        try:
            subprocess.run(
                ["cmd", "/c", "rmdir", "/s", "/q", str(p)],
                capture_output=True,
                check=False,
                timeout=15,
            )
        except Exception as e:
            logger.warning(f"cmd rmdir fallback failed: {e}")

    # Step 4: Windows PowerShell fallback
    if p.exists() and os.name == "nt":
        try:
            subprocess.run(
                ["powershell", "-NoProfile", "-Command", f'Remove-Item -LiteralPath "{str(p)}" -Recurse -Force'],
                capture_output=True,
                check=False,
                timeout=15,
            )
        except Exception as e:
            logger.warning(f"powershell Remove-Item fallback failed: {e}")

    if p.exists():
        raise RuntimeError(f"Could not remove repository directory '{p}'. Files may be locked by another process.")



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

    def delete_repository(self, repository_name: str) -> dict:
        """
        Safely delete a cloned repository from the local workspace.
        """
        sanitized_name = re.sub(r"[^A-Za-z0-9_\-\.]", "_", repository_name.strip())
        target_dir = (self.workspace_dir / sanitized_name).resolve()

        # Path traversal guard
        if not str(target_dir).startswith(str(self.workspace_dir)):
            raise ValueError("Target repository directory escapes the workspace.")

        if not target_dir.exists():
            logger.info(f"Repository '{sanitized_name}' was not found on disk (already removed).")
            return {
                "success": True,
                "message": f"Repository '{sanitized_name}' was already removed from workspace.",
                "repository_name": sanitized_name,
            }

        try:
            robust_rmtree(target_dir)
        except Exception as exc:
            raise RuntimeError(f"Failed to delete repository directory: {exc}") from exc

        return {
            "success": True,
            "message": f"Repository '{sanitized_name}' deleted successfully.",
            "repository_name": sanitized_name,
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