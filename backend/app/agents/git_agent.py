from pathlib import Path
from typing import Any, Dict, Optional
import subprocess


class GitAgent:
    """
    Git Agent for CodeAware AI.

    Handles Git operations for validated changes.

    IMPORTANT:
    This agent does not automatically push changes unless
    explicitly requested through input_data.

    Workflow:

        validated fix
             ↓
        create branch
             ↓
        apply patch
             ↓
        git diff
             ↓
        commit
             ↓
        optional push
    """

    name = "Git Agent"

    description = (
        "Manages Git branches, patches, commits, "
        "and optional pushes for validated CodeAware fixes."
    )

    # =========================================================
    # MAIN
    # =========================================================

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        repository_path = input_data.get(
            "repository_path"
        )

        branch_name = input_data.get(
            "branch_name"
        )

        file_path = input_data.get(
            "file_path"
        )

        modified_code = input_data.get(
            "modified_code"
        )

        commit_message = input_data.get(
            "commit_message",
            "CodeAware: apply validated fix"
        )

        push = input_data.get(
            "push",
            False
        )

        create_branch = input_data.get(
            "create_branch",
            True
        )

        # -----------------------------------------------------
        # Validate repository
        # -----------------------------------------------------

        if not repository_path:

            return self._error(
                "repository_path is required."
            )

        repository_path = Path(
            repository_path
        )

        if not repository_path.exists():

            return self._error(
                f"Repository does not exist: "
                f"{repository_path}"
            )

        if not repository_path.is_dir():

            return self._error(
                "repository_path must be a directory."
            )

        # -----------------------------------------------------
        # Validate Git repository
        # -----------------------------------------------------

        if not (
            repository_path / ".git"
        ).exists():

            return self._error(
                "The specified directory is not "
                "a Git repository."
            )

        # -----------------------------------------------------
        # Check Git status
        # -----------------------------------------------------

        status_result = self._git(
            repository_path,
            [
                "status",
                "--short"
            ]
        )

        if not status_result["success"]:

            return status_result

        # -----------------------------------------------------
        # Create branch
        # -----------------------------------------------------

        branch_result = None

        if create_branch:

            if not branch_name:

                return self._error(
                    "branch_name is required when "
                    "create_branch=true."
                )

            branch_result = (
                self._create_branch(
                    repository_path,
                    branch_name
                )
            )

            if not branch_result["success"]:

                return branch_result

        # -----------------------------------------------------
        # Apply modified code
        # -----------------------------------------------------

        if modified_code is not None:

            if not file_path:

                return self._error(
                    "file_path is required when "
                    "modified_code is provided."
                )

            write_result = (
                self._write_file(
                    repository_path,
                    file_path,
                    modified_code
                )
            )

            if not write_result["success"]:

                return write_result

        # -----------------------------------------------------
        # Get diff
        # -----------------------------------------------------

        diff_result = self._git(
            repository_path,
            [
                "diff",
                "--",
                file_path
            ] if file_path else [
                "diff"
            ]
        )

        if not diff_result["success"]:

            return diff_result

        diff = diff_result["stdout"]

        # -----------------------------------------------------
        # Nothing changed
        # -----------------------------------------------------

        if not diff.strip():

            return {
                "success": True,
                "agent": self.name,
                "changed": False,
                "message": (
                    "No Git changes were detected."
                ),
                "branch": (
                    branch_name
                    if create_branch
                    else None
                )
            }

        # -----------------------------------------------------
        # Stage file
        # -----------------------------------------------------

        if file_path:

            add_result = self._git(
                repository_path,
                [
                    "add",
                    "--",
                    file_path
                ]
            )

        else:

            add_result = self._git(
                repository_path,
                [
                    "add",
                    "-A"
                ]
            )

        if not add_result["success"]:

            return add_result

        # -----------------------------------------------------
        # Commit
        # -----------------------------------------------------

        commit_result = self._git(
            repository_path,
            [
                "commit",
                "-m",
                commit_message
            ]
        )

        if not commit_result["success"]:

            return commit_result

        # -----------------------------------------------------
        # Optional push
        # -----------------------------------------------------

        push_result = None

        if push:

            push_result = self._push(
                repository_path,
                branch_name
            )

            if not push_result["success"]:

                return {
                    "success": False,
                    "agent": self.name,
                    "message": (
                        "Commit succeeded, but "
                        "push failed."
                    ),
                    "commit": commit_result,
                    "push": push_result
                }

        # -----------------------------------------------------
        # Final result
        # -----------------------------------------------------

        return {
            "success": True,
            "agent": self.name,
            "changed": True,
            "branch": (
                branch_name
                if create_branch
                else None
            ),
            "diff": diff,
            "commit": commit_result,
            "push": push_result,
            "message": (
                "Git operation completed successfully."
            )
        }

    # =========================================================
    # CREATE BRANCH
    # =========================================================

    def _create_branch(
        self,
        repository_path: Path,
        branch_name: str
    ) -> Dict[str, Any]:

        # -----------------------------------------------------
        # Basic branch-name validation
        # -----------------------------------------------------

        if not branch_name:

            return self._error(
                "Branch name cannot be empty."
            )

        if any(
            character in branch_name
            for character in [
                " ",
                "~",
                "^",
                ":",
                "?",
                "*",
                "[",
                "\\"
            ]
        ):

            return self._error(
                "Invalid Git branch name."
            )

        # -----------------------------------------------------
        # Check whether branch already exists
        # -----------------------------------------------------

        existing = self._git(
            repository_path,
            [
                "branch",
                "--list",
                branch_name
            ]
        )

        if not existing["success"]:

            return existing

        if existing["stdout"].strip():

            checkout = self._git(
                repository_path,
                [
                    "switch",
                    branch_name
                ]
            )

            return checkout

        # -----------------------------------------------------
        # Create branch
        # -----------------------------------------------------

        return self._git(
            repository_path,
            [
                "switch",
                "-c",
                branch_name
            ]
        )

    # =========================================================
    # WRITE FILE
    # =========================================================

    def _write_file(
        self,
        repository_path: Path,
        file_path: str,
        modified_code: str
    ) -> Dict[str, Any]:

        target = (
            repository_path / file_path
        )

        # -----------------------------------------------------
        # Resolve path
        # -----------------------------------------------------

        try:

            repository_root = (
                repository_path
                .resolve()
            )

            target = (
                target.resolve()
            )

            target.relative_to(
                repository_root
            )

        except ValueError:

            return self._error(
                "Invalid file path. "
                "The file must remain inside "
                "the repository."
            )

        # -----------------------------------------------------
        # Create parent directories if needed
        # -----------------------------------------------------

        target.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        try:

            target.write_text(
                modified_code,
                encoding="utf-8"
            )

            return {
                "success": True,
                "path": str(target)
            }

        except Exception as exc:

            return self._error(
                f"Could not write file: {exc}"
            )

    # =========================================================
    # PUSH
    # =========================================================

    def _push(
        self,
        repository_path: Path,
        branch_name: Optional[str]
    ) -> Dict[str, Any]:

        if not branch_name:

            return self._error(
                "branch_name is required for push."
            )

        # -----------------------------------------------------
        # Determine remote
        # -----------------------------------------------------

        remote_result = self._git(
            repository_path,
            [
                "remote",
                "get-url",
                "origin"
            ]
        )

        if not remote_result["success"]:

            return remote_result

        return self._git(
            repository_path,
            [
                "push",
                "-u",
                "origin",
                branch_name
            ]
        )

    # =========================================================
    # GIT COMMAND
    # =========================================================

    def _git(
        self,
        repository_path: Path,
        arguments: list[str]
    ) -> Dict[str, Any]:

        try:

            process = subprocess.run(
                [
                    "git",
                    *arguments
                ],
                cwd=repository_path,
                capture_output=True,
                text=True,
                timeout=60
            )

            return {
                "success": (
                    process.returncode == 0
                ),
                "return_code": (
                    process.returncode
                ),
                "stdout": process.stdout.strip(),
                "stderr": process.stderr.strip()
            }

        except FileNotFoundError:

            return self._error(
                "Git was not found. "
                "Make sure Git is installed "
                "and available on PATH."
            )

        except subprocess.TimeoutExpired:

            return self._error(
                "Git command timed out."
            )

        except Exception as exc:

            return self._error(
                str(exc)
            )

    # =========================================================
    # ERROR
    # =========================================================

    def _error(
        self,
        message: str
    ) -> Dict[str, Any]:

        return {
            "success": False,
            "agent": self.name,
            "error": message
        }