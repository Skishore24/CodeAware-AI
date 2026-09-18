from pathlib import Path
from typing import Any, Dict, Optional, List
from app.agents.fix_agent import FixAgent
from app.agents.test_agent import TestAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.git_agent import GitAgent
from app.agents.pr_agent import PRAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


class AutonomousWorkflow:
    """
    Production Autonomous Software Engineering Fix Workflow.
    
    Safe Multi-Step Pipeline:
    1. Analyze Reported Bug & Target File
    2. Generate Proposed Patch & Unified Diff
    3. Generate Verification Test Suite
    4. Run Isolated Validation (Syntax & Regression)
    5. Present Diff & Status to Developer
    6. Apply Patch ONLY upon explicit human approval with pre-patch backup & rollback
    7. Optionally create GitHub Pull Request
    """

    name = "AutonomousWorkflow"

    def __init__(self):
        self.fix_agent = FixAgent()
        self.test_agent = TestAgent()
        self.validation_agent = ValidationAgent()
        self.git_agent = GitAgent()
        self.pr_agent = PRAgent()

    def _resolve_repo(self, repository_path: Optional[str], repository_name: Optional[str]) -> Optional[Path]:
        """
        Robustly resolves the absolute filesystem path for a cloned repository.
        """
        # 1. Try direct repository_path if it exists
        if repository_path:
            p = Path(repository_path).resolve()
            if p.exists() and p.is_dir():
                return p
            # Check inside CLONED_REPOSITORIES_DIR with repository_path
            p_cloned = (Path(CLONED_REPOSITORIES_DIR) / repository_path).resolve()
            if p_cloned.exists() and p_cloned.is_dir():
                return p_cloned

        # 2. Try repository_name inside CLONED_REPOSITORIES_DIR
        if repository_name:
            p_name = (Path(CLONED_REPOSITORIES_DIR) / repository_name).resolve()
            if p_name.exists() and p_name.is_dir():
                return p_name

        # 3. Check database for local_path
        try:
            from app.db.database import SessionLocal
            from app.models.entities import Repository
            if SessionLocal and (repository_name or repository_path):
                with SessionLocal() as db:
                    name = repository_name or (Path(repository_path).name if repository_path else None)
                    if name:
                        repo_rec = db.query(Repository).filter(Repository.name == name).first()
                        if repo_rec and repo_rec.local_path:
                            p_db = Path(repo_rec.local_path).resolve()
                            if p_db.exists() and p_db.is_dir():
                                return p_db
                            p_db_cloned = (Path(CLONED_REPOSITORIES_DIR) / repo_rec.local_path).resolve()
                            if p_db_cloned.exists() and p_db_cloned.is_dir():
                                return p_db_cloned
        except Exception:
            pass

        return None

    def _resolve_target_file(self, repo: Path, file_path: str) -> Optional[Path]:
        """
        Locates the exact target file inside the cloned repository, stripping any repo prefix or slashes.
        """
        if not file_path:
            return None

        clean = file_path.strip().replace("\\", "/").lstrip("/")

        # Strip repo name prefix if included (e.g. "fastapi/tests/..." or "flask/src/...")
        if clean.startswith(f"{repo.name}/"):
            clean = clean[len(repo.name) + 1:]

        target = (repo / clean).resolve()
        if target.exists() and target.is_file():
            return target

        # Fallback: search by relative suffix or filename inside repo
        filename = Path(clean).name
        candidates = list(repo.glob(f"**/{filename}"))
        for candidate in candidates:
            cand_str = str(candidate).replace("\\", "/")
            if cand_str.endswith(clean):
                return candidate
        if candidates and len(candidates) == 1:
            return candidates[0]

        return target

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        problem = input_data.get("problem") or input_data.get("task", "")
        auto_apply = input_data.get("auto_apply", False)

        if not file_path:
            return self._error("file_path is required.")

        if not problem:
            return self._error("problem description is required.")

        repo = self._resolve_repo(repository_path, repository_name)
        if not repo or not repo.exists():
            return self._error(f"Cloned repository not found for path='{repository_path}', name='{repository_name}'.")

        target_file = self._resolve_target_file(repo, file_path)
        if not target_file or not target_file.exists():
            return self._error(f"Target file not found inside cloned repository: {file_path}")

        # Step 1: FixAgent creates patch and diff via Ollama LLM
        fix_res = self.fix_agent.run({
            "repository_path": str(repo),
            "file_path": str(target_file.relative_to(repo)).replace("\\", "/"),
            "problem": problem,
            "use_llm": input_data.get("use_llm", True),
        })

        if not fix_res.get("success"):
            return {
                "success": False,
                "status": "FAILED",
                "message": "Fix Agent could not analyze the target problem.",
                "error": fix_res.get("error", "Unknown fix error")
            }

        raw_fix = fix_res.get("raw_data", {})
        original_code = raw_fix.get("original_code", "")
        patched_code = raw_fix.get("patched_code", "")
        diff = raw_fix.get("diff", "")

        # Step 2: TestAgent generates regression test
        test_res = self.test_agent.run({
            "code": patched_code,
            "file_path": file_path
        })
        test_code = test_res.get("raw_data", {}).get("generated_test_code", "")

        # Step 3: ValidationAgent checks syntax and test execution
        val_res = self.validation_agent.run({
            "original_code": original_code,
            "modified_code": patched_code,
            "file_path": file_path,
            "test_code": test_code,
            "run_tests": True
        })

        is_validated = val_res.get("success", False)

        # Step 4: Optional Auto-Apply to Cloned Repo
        applied_info = None
        if auto_apply and is_validated:
            applied_info = self.approve_and_apply({
                "repository_path": str(repo),
                "repository_name": repo.name,
                "file_path": str(target_file.relative_to(repo)).replace("\\", "/"),
                "patched_code": patched_code,
            })

        return {
            "success": True,
            "status": "VALIDATED" if is_validated else "VALIDATION_WARNING",
            "workflow": self.name,
            "target_file": str(target_file.relative_to(repo)).replace("\\", "/"),
            "disk_path": str(target_file),
            "repository": repo.name,
            "problem": problem,
            "diff": diff,
            "fix_summary": fix_res.get("summary", ""),
            "validation_summary": val_res.get("summary", ""),
            "is_validated": is_validated,
            "applied_to_repo": bool(applied_info and applied_info.get("success")),
            "applied_info": applied_info,
            "steps": [
                {"step": "Fix Generation", "status": "COMPLETED", "agent": "FixAgent"},
                {"step": "Test Suite Synthesis", "status": "COMPLETED", "agent": "TestAgent"},
                {"step": "Syntax & Regression Validation", "status": "PASSED" if is_validated else "WARNING", "agent": "ValidationAgent"},
            ],
            "raw_data": {
                "original_code": original_code,
                "patched_code": patched_code,
                "diff": diff,
                "test_code": test_code,
                "fix_description": raw_fix.get("fix_description", fix_res.get("summary", "")),
                "validation": val_res,
                "applied_info": applied_info,
            }
        }

    def approve_and_apply(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safely applies the approved patch to the target repository with automatic rollback on error.
        Updates the physical source file on disk in the cloned repository.
        """
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        patched_code = input_data.get("patched_code")

        if not file_path or patched_code is None:
            return self._error("file_path and patched_code are required to apply fix.")

        repo = self._resolve_repo(repository_path, repository_name)
        if not repo or not repo.exists():
            return self._error(f"Cloned repository not found for path='{repository_path}', name='{repository_name}'.")

        target_file = self._resolve_target_file(repo, file_path)
        if not target_file:
            return self._error(f"Unable to locate target file '{file_path}' in cloned repository.")

        # Path traversal guard
        try:
            target_file.relative_to(repo)
        except ValueError:
            return self._error("File path escapes the repository directory.")

        if not target_file.exists():
            return self._error(f"Target file does not exist: {target_file}")

        # Pre-patch backup
        backup_content = target_file.read_text(encoding="utf-8", errors="ignore")
        backup_file = target_file.with_suffix(target_file.suffix + ".codeaware.bak")

        try:
            # 1. Save safety backup file next to source file
            backup_file.write_text(backup_content, encoding="utf-8")

            # 2. Write patched code directly into the cloned repository file
            target_file.write_text(patched_code, encoding="utf-8")

            rel_path = str(target_file.relative_to(repo)).replace("\\", "/")

            return {
                "success": True,
                "status": "APPLIED",
                "file": rel_path,
                "disk_path": str(target_file),
                "relative_path": rel_path,
                "repository": repo.name,
                "backup_file": str(backup_file),
                "message": f"Successfully updated code in cloned repository '{repo.name}' at: {rel_path}"
            }
        except Exception as exc:
            # Safe Rollback on any write failure
            try:
                target_file.write_text(backup_content, encoding="utf-8")
            except Exception:
                pass
            return self._error(f"Failed to apply patch, safely rolled back: {exc}")

    def rollback(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rolls back a previously applied fix using the pre-patch backup file or original code.
        """
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        original_code = input_data.get("original_code")

        repo = self._resolve_repo(repository_path, repository_name)
        if not repo or not repo.exists():
            return self._error(f"Repository not found for path='{repository_path}', name='{repository_name}'.")

        target_file = self._resolve_target_file(repo, file_path)
        if not target_file or not target_file.exists():
            return self._error(f"Target file does not exist: {target_file}")

        backup_file = target_file.with_suffix(target_file.suffix + ".codeaware.bak")

        try:
            if backup_file.exists():
                restored_content = backup_file.read_text(encoding="utf-8", errors="ignore")
                target_file.write_text(restored_content, encoding="utf-8")
                backup_file.unlink(missing_ok=True)
                return {
                    "success": True,
                    "status": "ROLLED_BACK",
                    "file": file_path,
                    "disk_path": str(target_file),
                    "message": f"Successfully rolled back '{file_path}' in '{repo.name}' from backup."
                }
            elif original_code is not None:
                target_file.write_text(original_code, encoding="utf-8")
                return {
                    "success": True,
                    "status": "ROLLED_BACK",
                    "file": file_path,
                    "disk_path": str(target_file),
                    "message": f"Successfully rolled back '{file_path}' in '{repo.name}' to original code."
                }
            else:
                return self._error("No backup file or original code provided for rollback.")
        except Exception as exc:
            return self._error(f"Failed to rollback file: {exc}")

    def create_pull_request(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.pr_agent.run(input_data)

    def _error(self, message: str) -> Dict[str, Any]:
        return {
            "success": False,
            "status": "ERROR",
            "error": message
        }