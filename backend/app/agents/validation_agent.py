from pathlib import Path
from typing import Any, Dict, Optional
import ast
import subprocess
import sys
import tempfile


class ValidationAgent:
    """
    Validates a proposed code fix before it is accepted.

    Validation pipeline:

        Proposed Fix
             ↓
        Syntax Check
             ↓
        Test Execution
             ↓
        Result
             ↓
        PASS / FAIL

    The original repository is never modified.
    """

    name = "Validation Agent"

    description = (
        "Validates proposed code changes using "
        "syntax checks and automated tests."
    )

    # =========================================================
    # MAIN
    # =========================================================

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        original_code = input_data.get(
            "original_code"
        )

        modified_code = input_data.get(
            "modified_code"
        )

        file_path = input_data.get(
            "file_path",
            "code.py"
        )

        test_code = input_data.get(
            "test_code"
        )

        run_tests = input_data.get(
            "run_tests",
            True
        )

        # -----------------------------------------------------
        # Validate input
        # -----------------------------------------------------

        if modified_code is None:

            return {
                "success": False,
                "agent": self.name,
                "status": "REJECTED",
                "error": (
                    "modified_code is required."
                )
            }

        # -----------------------------------------------------
        # Syntax validation
        # -----------------------------------------------------

        syntax_result = (
            self._validate_syntax(
                modified_code,
                file_path
            )
        )

        if not syntax_result["valid"]:

            return {
                "success": True,
                "agent": self.name,
                "status": "FAILED",
                "validated": False,
                "syntax": syntax_result,
                "tests": {
                    "executed": False
                },
                "message": (
                    "The proposed fix contains "
                    "a syntax error."
                )
            }

        # -----------------------------------------------------
        # No tests requested
        # -----------------------------------------------------

        if not run_tests:

            return {
                "success": True,
                "agent": self.name,
                "status": "PASSED",
                "validated": True,
                "syntax": syntax_result,
                "tests": {
                    "executed": False,
                    "reason": (
                        "Test execution was disabled."
                    )
                },
                "message": (
                    "Syntax validation passed. "
                    "Tests were not executed."
                )
            }

        # -----------------------------------------------------
        # Test validation
        # -----------------------------------------------------

        if not test_code:

            return {
                "success": True,
                "agent": self.name,
                "status": "PARTIAL",
                "validated": False,
                "syntax": syntax_result,
                "tests": {
                    "executed": False,
                    "reason": (
                        "No test code was provided."
                    )
                },
                "message": (
                    "Syntax passed, but the fix "
                    "cannot be fully validated "
                    "without tests."
                )
            }

        test_result = (
            self._run_tests(
                modified_code=modified_code,
                file_path=file_path,
                test_code=test_code
            )
        )

        # -----------------------------------------------------
        # Test passed
        # -----------------------------------------------------

        if test_result.get("passed"):

            return {
                "success": True,
                "agent": self.name,
                "status": "PASSED",
                "validated": True,
                "syntax": syntax_result,
                "tests": test_result,
                "message": (
                    "The proposed fix passed "
                    "syntax validation and tests."
                )
            }

        # -----------------------------------------------------
        # Test failed
        # -----------------------------------------------------

        return {
            "success": True,
            "agent": self.name,
            "status": "FAILED",
            "validated": False,
            "syntax": syntax_result,
            "tests": test_result,
            "message": (
                "The proposed fix did not pass "
                "the validation tests."
            )
        }

    # =========================================================
    # SYNTAX VALIDATION
    # =========================================================

    def _validate_syntax(
        self,
        code: str,
        file_path: str
    ) -> Dict[str, Any]:

        extension = Path(
            file_path
        ).suffix.lower()

        # -----------------------------------------------------
        # Python
        # -----------------------------------------------------

        if extension == ".py":

            try:

                ast.parse(
                    code,
                    filename=file_path
                )

                return {
                    "valid": True,
                    "language": "python",
                    "message": (
                        "Python syntax is valid."
                    )
                }

            except SyntaxError as exc:

                return {
                    "valid": False,
                    "language": "python",
                    "line": exc.lineno,
                    "column": exc.offset,
                    "error": exc.msg,
                    "message": (
                        "Python syntax validation failed."
                    )
                }

        # -----------------------------------------------------
        # Unsupported language
        # -----------------------------------------------------

        return {
            "valid": True,
            "language": extension or "unknown",
            "message": (
                "No language-specific syntax "
                "validator is currently configured."
            )
        }

    # =========================================================
    # RUN TESTS
    # =========================================================

    def _run_tests(
        self,
        modified_code: str,
        file_path: str,
        test_code: str
    ) -> Dict[str, Any]:

        try:

            with tempfile.TemporaryDirectory(
                prefix="codeaware_validation_"
            ) as temp_dir:

                temp_path = Path(
                    temp_dir
                )

                source_name = Path(
                    file_path
                ).name

                # ---------------------------------------------
                # Make sure the source has .py extension
                # ---------------------------------------------

                if not source_name.endswith(
                    ".py"
                ):

                    source_name = (
                        Path(source_name).stem
                        + ".py"
                    )

                source_file = (
                    temp_path / source_name
                )

                source_file.write_text(
                    modified_code,
                    encoding="utf-8"
                )

                # ---------------------------------------------
                # Determine module name
                # ---------------------------------------------

                module_name = (
                    source_file.stem
                )

                # ---------------------------------------------
                # If test imports a different module name,
                # replace the first simple import.
                # ---------------------------------------------

                adjusted_test_code = (
                    self._prepare_test_code(
                        test_code,
                        module_name
                    )
                )

                test_file = (
                    temp_path
                    / "test_validation.py"
                )

                test_file.write_text(
                    adjusted_test_code,
                    encoding="utf-8"
                )

                # ---------------------------------------------
                # Execute pytest
                # ---------------------------------------------

                process = subprocess.run(
                    [
                        sys.executable,
                        "-m",
                        "pytest",
                        str(test_file),
                        "-q"
                    ],
                    cwd=temp_path,
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                return {
                    "executed": True,
                    "passed": (
                        process.returncode == 0
                    ),
                    "return_code": (
                        process.returncode
                    ),
                    "stdout": process.stdout,
                    "stderr": process.stderr
                }

        except subprocess.TimeoutExpired:

            return {
                "executed": False,
                "passed": False,
                "error": (
                    "Validation tests timed out "
                    "after 30 seconds."
                )
            }

        except FileNotFoundError:

            return {
                "executed": False,
                "passed": False,
                "error": (
                    "pytest is not installed."
                )
            }

        except Exception as exc:

            return {
                "executed": False,
                "passed": False,
                "error": str(exc)
            }

    # =========================================================
    # PREPARE TEST CODE
    # =========================================================

    def _prepare_test_code(
        self,
        test_code: str,
        module_name: str
    ) -> str:

        lines = test_code.splitlines()

        modified_lines = []

        replaced_import = False

        for line in lines:

            stripped = line.strip()

            # ---------------------------------------------
            # Replace simple:
            #
            # from calculator import calculate_total
            #
            # ---------------------------------------------

            if (
                stripped.startswith(
                    "from "
                )
                and " import " in stripped
                and not replaced_import
            ):

                parts = stripped.split(
                    " import ",
                    1
                )

                if len(parts) == 2:

                    imported_names = parts[1]

                    modified_lines.append(
                        f"from {module_name} "
                        f"import {imported_names}"
                    )

                    replaced_import = True

                    continue

            # ---------------------------------------------
            # Replace:
            #
            # import calculator
            # ---------------------------------------------

            if (
                stripped.startswith(
                    "import "
                )
                and not replaced_import
            ):

                imported_name = (
                    stripped[7:].strip()
                )

                if (
                    imported_name
                    and " " not in imported_name
                ):

                    modified_lines.append(
                        f"import {module_name}"
                    )

                    replaced_import = True

                    continue

            modified_lines.append(
                line
            )

        return "\n".join(
            modified_lines
        )