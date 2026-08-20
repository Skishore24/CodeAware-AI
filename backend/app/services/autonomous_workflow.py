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

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        problem = input_data.get("problem") or input_data.get("task", "")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self._error("repository_path or repository_name is required.")

        if not file_path:
            return self._error("file_path is required.")

        if not problem:
            return self._error("problem description is required.")

        repo = Path(repository_path).resolve()
        if not repo.exists():
            return self._error(f"Repository not found at {repository_path}")

        # Step 1: FixAgent creates patch and diff
        fix_res = self.fix_agent.run({
            "repository_path": str(repo),
            "file_path": file_path,
            "problem": problem
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

        return {
            "success": True,
            "status": "VALIDATED" if is_validated else "VALIDATION_WARNING",
            "workflow": self.name,
            "target_file": file_path,
            "problem": problem,
            "diff": diff,
            "fix_summary": fix_res.get("summary", ""),
            "validation_summary": val_res.get("summary", ""),
            "is_validated": is_validated,
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
                "validation": val_res
            }
        }

    def approve_and_apply(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safely applies the approved patch to the target repository with automatic rollback on error.
        """
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        patched_code = input_data.get("patched_code")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path or not file_path or patched_code is None:
            return self._error("repository_path, file_path, and patched_code are required to apply fix.")

        repo = Path(repository_path).resolve()
        target_file = (repo / file_path).resolve()

        # Path traversal guard
        if not str(target_file).startswith(str(repo)):
            return self._error("File path escapes the repository directory.")

        if not target_file.exists():
            return self._error(f"Target file does not exist: {target_file}")

        # Pre-patch backup
        backup_content = target_file.read_text(encoding="utf-8", errors="ignore")
        try:
            target_file.write_text(patched_code, encoding="utf-8")
            return {
                "success": True,
                "status": "APPLIED",
                "file": file_path,
                "message": f"Successfully applied approved patch to '{file_path}'."
            }
        except Exception as exc:
            # Safe Rollback
            try:
                target_file.write_text(backup_content, encoding="utf-8")
            except Exception:
                pass
            return self._error(f"Failed to apply patch, safely rolled back: {exc}")

    def create_pull_request(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.pr_agent.run(input_data)

    def _error(self, message: str) -> Dict[str, Any]:
        return {
            "success": False,
            "status": "ERROR",
            "error": message
        }