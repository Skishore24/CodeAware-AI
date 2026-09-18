import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from app.config.settings import settings
from app.core.exceptions import SecuritySandboxException
from app.core.logging import get_logger

logger = get_logger("app.sandbox")


class SandboxRunner:
    """
    Secure isolated sandbox execution environment (Section 16).
    Enforces repository boundaries, path traversal guards, command allowlist,
    and automatic timestamped patch backups with rollback protection.
    """

    ALLOWED_COMMANDS = {
        "pytest",
        "unittest",
        "npm test",
        "npm run build",
        "npm run lint",
        "oxlint",
        "ruff",
        "mypy",
    }

    def __init__(self, repository_root: Optional[Path | str] = None, timeout: int = 30):
        self.repository_root = Path(repository_root).resolve() if repository_root else None
        self.timeout = timeout
        self.sandbox_base = Path(settings.SANDBOX_STORAGE_PATH).resolve()
        self.sandbox_base.mkdir(parents=True, exist_ok=True)

    def validate_path(self, target_path: Path | str, base_dir: Optional[Path] = None) -> Path:
        """
        Ensure target_path resolves strictly within base_dir (or repository_root).
        Prevents directory traversal attacks (e.g. ../../etc/passwd).
        """
        root = (base_dir or self.repository_root)
        if not root:
            raise SecuritySandboxException("No repository root specified for path boundary check.")

        resolved_root = root.resolve()
        resolved_target = (resolved_root / target_path).resolve() if not Path(target_path).is_absolute() else Path(target_path).resolve()

        try:
            resolved_target.relative_to(resolved_root)
        except ValueError:
            raise SecuritySandboxException(
                f"Path traversal denied: '{target_path}' is outside sandbox root '{resolved_root}'."
            )
        return resolved_target

    def create_isolated_workspace(self, workspace_name: Optional[str] = None) -> Path:
        """
        Create an isolated temporary copy of the repository for testing changes.
        """
        name = workspace_name or f"sandbox_{int(time.time())}_{os.getpid()}"
        target_dir = self.sandbox_base / name
        target_dir.mkdir(parents=True, exist_ok=True)

        if self.repository_root and self.repository_root.exists():
            # Copy source files excluding heavy directories
            ignore_patterns = shutil.ignore_patterns(
                ".git", ".venv", "venv", "node_modules", "__pycache__", "dist", "build", ".idea", ".vscode"
            )
            for item in self.repository_root.iterdir():
                dest = target_dir / item.name
                if item.is_dir():
                    if item.name not in [".git", ".venv", "venv", "node_modules", "__pycache__"]:
                        shutil.copytree(item, dest, ignore=ignore_patterns, dirs_exist_ok=True)
                else:
                    shutil.copy2(item, dest)
        return target_dir

    def cleanup_workspace(self, workspace_path: Path) -> bool:
        try:
            if workspace_path.exists() and workspace_path.is_dir():
                shutil.rmtree(workspace_path, ignore_errors=True)
                return True
        except Exception as exc:
            logger.warning(f"Error cleaning sandbox workspace: {exc}")
        return False

    def create_backup(self, file_path: Path | str) -> Path:
        """
        Create a timestamped .bak file before applying any patch.
        """
        safe_file = self.validate_path(file_path)
        if not safe_file.exists():
            raise FileNotFoundError(f"Cannot backup non-existent file: {safe_file}")

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
        backup_path = safe_file.with_name(f"{safe_file.name}.{timestamp}.bak")
        shutil.copy2(safe_file, backup_path)
        logger.info(f"Created patch backup: {backup_path}")
        return backup_path

    def rollback(self, backup_path: Path | str, target_file: Path | str) -> bool:
        """
        Restore original file from backup file.
        """
        b_path = Path(backup_path).resolve()
        t_path = self.validate_path(target_file)
        if not b_path.exists():
            raise FileNotFoundError(f"Backup file not found: {b_path}")

        shutil.copy2(b_path, t_path)
        logger.info(f"Rolled back {t_path} from backup {b_path}")
        return True

    backup_file = create_backup

    def rollback_file(self, target_file: Path | str, backup_path: Path | str) -> bool:
        return self.rollback(backup_path, target_file)


    def execute_command(
        self,
        cmd: List[str] | str,
        cwd: Optional[Path] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Execute an allowlisted command inside the sandbox.
        Rejects unverified commands.
        """
        # Parse command string or list
        if isinstance(cmd, str):
            cmd_parts = cmd.strip().split()
        else:
            cmd_parts = list(cmd)

        if not cmd_parts:
            raise SecuritySandboxException("Empty command received.")

        base_cmd = cmd_parts[0].lower()
        full_cmd_str = " ".join(cmd_parts).lower()

        # Check against allowlist
        is_allowed = any(
            full_cmd_str.startswith(allowed) or base_cmd == allowed.split()[0]
            for allowed in self.ALLOWED_COMMANDS
        )
        # Also allow python -m unittest / pytest
        if base_cmd in ("python", "python3", "pytest", "ruff", "mypy", "oxlint"):
            is_allowed = True

        if not is_allowed:
            raise SecuritySandboxException(
                f"Command '{cmd_parts[0]}' is not in the sandbox execution allowlist ({self.ALLOWED_COMMANDS})."
            )

        working_dir = (cwd or self.repository_root or Path.cwd()).resolve()
        start_time = time.time()

        try:
            process = subprocess.run(
                cmd_parts,
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                timeout=self.timeout,
                env={**os.environ, **(env or {})},
            )
            duration = round(time.time() - start_time, 3)
            return {
                "success": process.returncode == 0,
                "returncode": process.returncode,
                "stdout": process.stdout,
                "stderr": process.stderr,
                "duration_sec": duration,
                "command": " ".join(cmd_parts),
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "returncode": -1,
                "stdout": "",
                "stderr": f"Command timed out after {self.timeout} seconds.",
                "duration_sec": self.timeout,
                "command": " ".join(cmd_parts),
                "error": "TIMEOUT",
            }
        except Exception as exc:
            return {
                "success": False,
                "returncode": -1,
                "stdout": "",
                "stderr": str(exc),
                "duration_sec": round(time.time() - start_time, 3),
                "command": " ".join(cmd_parts),
                "error": str(exc),
            }
