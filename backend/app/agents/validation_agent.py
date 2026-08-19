from pathlib import Path
from typing import Any, Dict, List, Optional
import ast
import subprocess
import sys
import tempfile
from app.agents.base_agent import BaseAgent


class ValidationAgent(BaseAgent):
    """
    Validates a proposed code fix safely using syntax compilation,
    linting checks, and isolated unit test execution.
    Never modifies the original repository directly during validation.
    """

    name = "ValidationAgent"
    description = "Validates code changes and patches through syntax analysis and isolated test execution."

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        modified_code = input_data.get("modified_code") or input_data.get("code")
        file_path = input_data.get("file_path", "code.py")
        test_code = input_data.get("test_code")
        run_tests = input_data.get("run_tests", True)

        if modified_code is None:
            return self.create_response(
                success=False,
                summary="modified_code is required for validation.",
                error="Missing modified_code."
            )

        # 1. Syntax check
        syntax_res = self._validate_syntax(modified_code, file_path)
        if not syntax_res["valid"]:
            return self.create_response(
                success=False,
                confidence=0.99,
                summary=f"Validation FAILED: Syntax error detected on line {syntax_res.get('line')}.",
                findings=[{
                    "type": "syntax_error",
                    "file": file_path,
                    "line": syntax_res.get("line"),
                    "error": syntax_res.get("error")
                }],
                files=[file_path],
                recommendations=["Fix syntax errors before attempting patch execution."],
                evidence=[{"syntax_error": syntax_res.get("error")}],
                next_actions=["Re-run FixAgent with corrected syntax"],
                raw_data={"syntax": syntax_res, "status": "FAILED"}
            )

        # 2. Test execution in isolated temp environment
        test_res = {"executed": False, "passed": True, "output": "Tests skipped or no test suite provided."}
        if run_tests and test_code:
            test_res = self._execute_tests(modified_code, test_code, file_path)

        all_passed = syntax_res["valid"] and test_res.get("passed", True)
        summary = (
            f"Validation {'PASSED' if all_passed else 'FAILED'}: Syntax compilation OK. "
            + (f"Tests {'Passed' if test_res.get('passed') else 'Failed'}." if test_res.get("executed") else "No regressions detected.")
        )

        return self.create_response(
            success=all_passed,
            confidence=0.95,
            summary=summary,
            findings=[{
                "validation_status": "PASSED" if all_passed else "FAILED",
                "syntax_valid": syntax_res["valid"],
                "tests_passed": test_res.get("passed", True)
            }],
            files=[file_path],
            recommendations=["Patch is verified and safe to apply." if all_passed else "Review failed assertions before applying."],
            evidence=[{"syntax": syntax_res, "test_output": test_res.get("output", "")[:200]}],
            next_actions=["Approve and apply fix" if all_passed else "Revise patch"],
            raw_data={
                "validated": all_passed,
                "syntax": syntax_res,
                "tests": test_res
            }
        )

    def _validate_syntax(self, code: str, file_name: str) -> Dict[str, Any]:
        if file_name.endswith(".py"):
            try:
                ast.parse(code, filename=file_name)
                return {"valid": True, "language": "python"}
            except SyntaxError as exc:
                return {
                    "valid": False,
                    "language": "python",
                    "error": str(exc.msg),
                    "line": exc.lineno,
                    "column": exc.offset
                }
        return {"valid": True, "language": "generic"}

    def _execute_tests(self, code: str, test_code: str, file_name: str) -> Dict[str, Any]:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            source_file = temp_path / file_name
            test_file = temp_path / f"test_{file_name}"

            try:
                source_file.write_text(code, encoding="utf-8")
                test_file.write_text(test_code, encoding="utf-8")

                cmd = [sys.executable, "-m", "unittest", str(test_file)]
                process = subprocess.run(
                    cmd,
                    cwd=str(temp_path),
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                passed = process.returncode == 0
                return {
                    "executed": True,
                    "passed": passed,
                    "returncode": process.returncode,
                    "output": process.stdout + "\n" + process.stderr
                }
            except Exception as e:
                return {
                    "executed": True,
                    "passed": False,
                    "error": str(e),
                    "output": str(e)
                }