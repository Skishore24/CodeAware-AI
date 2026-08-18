from pathlib import Path
from typing import Any, Dict, List, Optional
import ast
import subprocess
import sys
import tempfile


class TestAgent:
    """
    Test generation and test execution agent.

    Responsibilities:
    1. Find Python functions.
    2. Understand their parameters.
    3. Generate basic pytest tests.
    4. Write tests into a temporary test directory.
    5. Optionally execute pytest.
    6. Return structured test results.

    This implementation does not require an external
    LLM or API.
    """

    name = "Test Agent"

    description = (
        "Generates and executes basic automated tests "
        "for Python functions."
    )

    SUPPORTED_EXTENSIONS = {
        ".py"
    }

    IGNORED_DIRECTORIES = {
        ".git",
        ".venv",
        "venv",
        "env",
        "node_modules",
        "__pycache__",
        ".idea",
        ".vscode",
        "dist",
        "build",
    }

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

        repository_name = input_data.get(
            "repository_name"
        )

        file_path = input_data.get(
            "file_path"
        )

        function_name = input_data.get(
            "function_name"
        )

        code = input_data.get(
            "code"
        )

        run_tests = input_data.get(
            "run_tests",
            False
        )

        # =====================================================
        # Direct code
        # =====================================================

        if code:

            return self._process_code(
                code=code,
                file_name=file_path or "input_code.py",
                function_name=function_name,
                run_tests=run_tests
            )

        # =====================================================
        # Resolve repository
        # =====================================================

        if not repository_path and repository_name:

            from app.config.paths import (
                CLONED_REPOSITORIES_DIR
            )

            repository_path = (
                CLONED_REPOSITORIES_DIR
                / repository_name
            )

        if not repository_path:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Provide repository_path, "
                    "repository_name, or code."
                )
            }

        repository_path = Path(
            repository_path
        )

        # =====================================================
        # Validate repository
        # =====================================================

        if not repository_path.exists():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Repository does not exist: "
                    f"{repository_path}"
                )
            }

        if not repository_path.is_dir():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Repository path is not a directory."
                )
            }

        # =====================================================
        # Specific file
        # =====================================================

        if file_path:

            target_file = (
                repository_path
                / file_path
            )

            if not target_file.exists():

                return {
                    "success": False,
                    "agent": self.name,
                    "error": (
                        "File does not exist: "
                        f"{target_file}"
                    )
                }

            try:

                source = target_file.read_text(
                    encoding="utf-8",
                    errors="ignore"
                )

                return self._process_code(
                    code=source,
                    file_name=file_path,
                    function_name=function_name,
                    run_tests=run_tests,
                    repository_path=repository_path
                )

            except Exception as exc:

                return {
                    "success": False,
                    "agent": self.name,
                    "error": str(exc)
                }

        # =====================================================
        # Repository function discovery
        # =====================================================

        discovered_functions = []

        try:

            for path in repository_path.rglob("*.py"):

                if self._should_ignore(
                    path,
                    repository_path
                ):
                    continue

                try:

                    source = path.read_text(
                        encoding="utf-8",
                        errors="ignore"
                    )

                    functions = (
                        self._extract_functions(
                            source
                        )
                    )

                    relative_path = str(
                        path.relative_to(
                            repository_path
                        )
                    )

                    for function in functions:

                        discovered_functions.append(
                            {
                                "file": relative_path,
                                **function
                            }
                        )

                except Exception:
                    continue

            # -------------------------------------------------
            # If a function was requested, filter it
            # -------------------------------------------------

            if function_name:

                discovered_functions = [
                    item
                    for item in discovered_functions
                    if item["name"]
                    == function_name
                ]

            # -------------------------------------------------
            # Generate tests
            # -------------------------------------------------

            tests = []

            for item in discovered_functions:

                tests.append(
                    self._generate_test_for_function(
                        item
                    )
                )

            return {
                "success": True,
                "agent": self.name,
                "repository": str(
                    repository_path
                ),
                "functions_found": len(
                    discovered_functions
                ),
                "tests_generated": len(
                    tests
                ),
                "functions": (
                    discovered_functions
                ),
                "tests": tests,
                "message": (
                    f"Generated {len(tests)} "
                    "test specification(s)."
                )
            }

        except Exception as exc:

            return {
                "success": False,
                "agent": self.name,
                "error": str(exc)
            }

    # =========================================================
    # PROCESS CODE
    # =========================================================

    def _process_code(
        self,
        code: str,
        file_name: str,
        function_name: Optional[str],
        run_tests: bool,
        repository_path: Optional[Path] = None
    ) -> Dict[str, Any]:

        functions = self._extract_functions(
            code
        )

        if function_name:

            functions = [
                item
                for item in functions
                if item["name"]
                == function_name
            ]

        if not functions:

            return {
                "success": False,
                "agent": self.name,
                "file": file_name,
                "error": (
                    "No Python functions found."
                )
            }

        tests = []

        for function in functions:

            test = (
                self._generate_test_for_function(
                    {
                        **function,
                        "file": file_name
                    }
                )
            )

            tests.append(test)

        result = {
            "success": True,
            "agent": self.name,
            "file": file_name,
            "functions_found": len(
                functions
            ),
            "tests_generated": len(
                tests
            ),
            "tests": tests
        }

        # =====================================================
        # Execute generated tests
        # =====================================================

        if run_tests:

            execution = (
                self._execute_generated_tests(
                    code=code,
                    file_name=file_name,
                    tests=tests,
                    repository_path=repository_path
                )
            )

            result["execution"] = execution

        return result

    # =========================================================
    # EXTRACT FUNCTIONS
    # =========================================================

    def _extract_functions(
        self,
        code: str
    ) -> List[Dict[str, Any]]:

        functions = []

        try:

            tree = ast.parse(
                code
            )

        except SyntaxError as exc:

            return [
                {
                    "name": "__syntax_error__",
                    "line": exc.lineno or 1,
                    "parameters": [],
                    "error": str(exc)
                }
            ]

        for node in ast.walk(tree):

            if isinstance(
                node,
                (ast.FunctionDef, ast.AsyncFunctionDef)
            ):

                parameters = []

                for argument in node.args.args:

                    parameters.append(
                        argument.arg
                    )

                return_annotation = None

                if node.returns:

                    try:

                        return_annotation = (
                            ast.unparse(
                                node.returns
                            )
                        )

                    except Exception:

                        return_annotation = None

                functions.append(
                    {
                        "name": node.name,
                        "line": node.lineno,
                        "parameters": parameters,
                        "return_type": (
                            return_annotation
                        ),
                        "async": isinstance(
                            node,
                            ast.AsyncFunctionDef
                        )
                    }
                )

        return functions

    # =========================================================
    # GENERATE TEST
    # =========================================================

    def _generate_test_for_function(
        self,
        function: Dict[str, Any]
    ) -> Dict[str, Any]:

        name = function.get(
            "name",
            "unknown_function"
        )

        parameters = function.get(
            "parameters",
            []
        )

        file_path = function.get(
            "file",
            ""
        )

        # -----------------------------------------------------
        # Generate generic test cases
        # -----------------------------------------------------

        test_cases = [
            {
                "name": (
                    f"test_{name}_exists"
                ),
                "purpose": (
                    "Verify that the function "
                    "can be imported."
                )
            },
            {
                "name": (
                    f"test_{name}_normal_case"
                ),
                "purpose": (
                    "Test the function with "
                    "normal input values."
                )
            },
            {
                "name": (
                    f"test_{name}_edge_case"
                ),
                "purpose": (
                    "Test an edge case such as "
                    "zero, empty input, or boundary values."
                )
            },
            {
                "name": (
                    f"test_{name}_invalid_input"
                ),
                "purpose": (
                    "Test how the function handles "
                    "invalid input."
                )
            }
        ]

        # -----------------------------------------------------
        # Build pytest source
        # -----------------------------------------------------

        test_source = (
            self._build_pytest_source(
                function_name=name,
                file_path=file_path,
                parameters=parameters
            )
        )

        return {
            "function": name,
            "file": file_path,
            "parameters": parameters,
            "test_cases": test_cases,
            "pytest_code": test_source
        }

    # =========================================================
    # BUILD PYTEST
    # =========================================================

    def _build_pytest_source(
        self,
        function_name: str,
        file_path: str,
        parameters: List[str]
    ) -> str:

        module_name = Path(
            file_path
        ).stem

        # -----------------------------------------------------
        # Handle unknown input code
        # -----------------------------------------------------

        if not module_name:

            module_name = "module"

        return f'''"""
Auto-generated tests by CodeAware AI.
"""

from {module_name} import {function_name}


def test_{function_name}_exists():
    assert {function_name} is not None


def test_{function_name}_normal_case():
    """
    TODO:
    Replace these values with meaningful
    inputs for the function.
    """
    # Generated test placeholder.
    assert callable({function_name})


def test_{function_name}_edge_case():
    """
    TODO:
    Add boundary-value testing.
    """
    assert callable({function_name})


def test_{function_name}_invalid_input():
    """
    TODO:
    Add invalid-input testing.
    """
    assert callable({function_name})
'''

    # =========================================================
    # EXECUTE TESTS
    # =========================================================

    def _execute_generated_tests(
        self,
        code: str,
        file_name: str,
        tests: List[Dict[str, Any]],
        repository_path: Optional[Path]
    ) -> Dict[str, Any]:

        """
        Executes generated tests in a temporary directory.

        IMPORTANT:
        Running repository code executes arbitrary code.
        Only use this with trusted repositories.
        """

        try:

            with tempfile.TemporaryDirectory(
                prefix="codeaware_tests_"
            ) as temp_dir:

                temp_path = Path(
                    temp_dir
                )

                source_file = temp_path / (
                    Path(file_name).name
                )

                source_file.write_text(
                    code,
                    encoding="utf-8"
                )

                test_file = (
                    temp_path
                    / f"test_{source_file.stem}.py"
                )

                combined_tests = "\n\n".join(
                    item["pytest_code"]
                    for item in tests
                )

                test_file.write_text(
                    combined_tests,
                    encoding="utf-8"
                )

                # -------------------------------------------------
                # Run pytest
                # -------------------------------------------------

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
                    "Test execution timed out "
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
    # IGNORE DIRECTORIES
    # =========================================================

    def _should_ignore(
        self,
        path: Path,
        repository_path: Path
    ) -> bool:

        try:

            relative = path.relative_to(
                repository_path
            )

            return any(
                part in self.IGNORED_DIRECTORIES
                for part in relative.parts
            )

        except ValueError:

            return True