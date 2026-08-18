from pathlib import Path
from typing import Any, Dict, List, Optional
import ast
import difflib
import re


class FixAgent:
    """
    CodeAware Fix Agent.

    Responsibilities:
    - Understand a reported code problem.
    - Inspect the target source file.
    - Create a proposed code modification.
    - Generate a unified diff.
    - Never automatically overwrite the original file.

    This is intentionally a deterministic starter implementation.
    Later, a local/custom reasoning model can be connected here.
    """

    name = "Fix Agent"

    description = (
        "Analyzes a reported code problem and "
        "generates a proposed source-code patch."
    )

    # =========================================================
    # MAIN ENTRY POINT
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

        problem = input_data.get(
            "problem"
        )

        error_message = input_data.get(
            "error_message"
        )

        suggested_fix = input_data.get(
            "suggested_fix"
        )

        # -----------------------------------------------------
        # Resolve repository by name
        # -----------------------------------------------------

        if not repository_path and repository_name:

            try:

                from app.config.paths import (
                    CLONED_REPOSITORIES_DIR
                )

                repository_path = (
                    CLONED_REPOSITORIES_DIR
                    / repository_name
                )

            except Exception as exc:

                return {
                    "success": False,
                    "agent": self.name,
                    "error": str(exc)
                }

        # -----------------------------------------------------
        # Validate required inputs
        # -----------------------------------------------------

        if not repository_path:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "repository_path or "
                    "repository_name is required."
                )
            }

        if not file_path:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "file_path is required."
                )
            }

        if not problem and not error_message:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Provide problem or error_message."
                )
            }

        repository_path = Path(
            repository_path
        )

        if not repository_path.exists():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Repository does not exist: "
                    f"{repository_path}"
                )
            }

        target_file = (
            repository_path / file_path
        )

        # -----------------------------------------------------
        # Security: prevent path escaping repository
        # -----------------------------------------------------

        try:

            target_file = (
                target_file
                .resolve()
            )

            repository_root = (
                repository_path
                .resolve()
            )

            target_file.relative_to(
                repository_root
            )

        except ValueError:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Invalid file path. "
                    "File must be inside the repository."
                )
            }

        # -----------------------------------------------------
        # Check target file
        # -----------------------------------------------------

        if not target_file.exists():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Target file does not exist: "
                    f"{file_path}"
                )
            }

        if not target_file.is_file():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Target path is not a file."
                )
            }

        # -----------------------------------------------------
        # Read source
        # -----------------------------------------------------

        try:

            original_code = target_file.read_text(
                encoding="utf-8",
                errors="ignore"
            )

        except Exception as exc:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    f"Could not read file: {exc}"
                )
            }

        # -----------------------------------------------------
        # Analyze source
        # -----------------------------------------------------

        analysis = self._analyze_source(
            original_code
        )

        # -----------------------------------------------------
        # Generate fix
        # -----------------------------------------------------

        fix_result = self._generate_fix(
            code=original_code,
            problem=problem,
            error_message=error_message,
            suggested_fix=suggested_fix,
            analysis=analysis
        )

        if not fix_result["changed"]:

            return {
                "success": True,
                "agent": self.name,
                "file": file_path,
                "changed": False,
                "message": (
                    "No safe automatic patch could "
                    "be generated."
                ),
                "analysis": analysis,
                "reason": fix_result["reason"]
            }

        modified_code = (
            fix_result["modified_code"]
        )

        # -----------------------------------------------------
        # Generate diff
        # -----------------------------------------------------

        diff = self._create_diff(
            original_code,
            modified_code,
            file_path
        )

        return {
            "success": True,
            "agent": self.name,
            "file": file_path,
            "changed": True,
            "message": (
                "A proposed fix was generated. "
                "Original source was not modified."
            ),
            "problem": problem,
            "error_message": error_message,
            "analysis": analysis,
            "reason": fix_result["reason"],
            "original_code": original_code,
            "modified_code": modified_code,
            "diff": diff,
            "requires_validation": True
        }

    # =========================================================
    # SOURCE ANALYSIS
    # =========================================================

    def _analyze_source(
        self,
        code: str
    ) -> Dict[str, Any]:

        result = {
            "language": "unknown",
            "syntax_valid": True,
            "functions": [],
            "classes": [],
            "imports": [],
            "lines": len(
                code.splitlines()
            )
        }

        try:

            tree = ast.parse(
                code
            )

            result["language"] = "python"

            for node in ast.walk(tree):

                if isinstance(
                    node,
                    (
                        ast.FunctionDef,
                        ast.AsyncFunctionDef
                    )
                ):

                    result["functions"].append(
                        {
                            "name": node.name,
                            "line": node.lineno
                        }
                    )

                elif isinstance(
                    node,
                    ast.ClassDef
                ):

                    result["classes"].append(
                        {
                            "name": node.name,
                            "line": node.lineno
                        }
                    )

                elif isinstance(
                    node,
                    ast.Import
                ):

                    for alias in node.names:

                        result["imports"].append(
                            alias.name
                        )

                elif isinstance(
                    node,
                    ast.ImportFrom
                ):

                    if node.module:

                        result["imports"].append(
                            node.module
                        )

        except SyntaxError as exc:

            result["syntax_valid"] = False
            result["syntax_error"] = str(exc)

        return result

    # =========================================================
    # FIX GENERATION
    # =========================================================

    def _generate_fix(
        self,
        code: str,
        problem: Optional[str],
        error_message: Optional[str],
        suggested_fix: Optional[str],
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:

        combined_problem = " ".join(
            [
                str(problem or ""),
                str(error_message or ""),
                str(suggested_fix or "")
            ]
        ).lower()

        # =====================================================
        # FIX 1: NoneType iterable
        # =====================================================

        if (
            "nonetype" in combined_problem
            and "iterable" in combined_problem
        ):

            result = self._fix_none_iterable(
                code
            )

            if result:

                return {
                    "changed": True,
                    "modified_code": result,
                    "reason": (
                        "Added a safe empty-list "
                        "fallback for a None result."
                    )
                }

        # =====================================================
        # FIX 2: Undefined variable
        # =====================================================

        if (
            "nameerror" in combined_problem
            or "undefined variable" in combined_problem
        ):

            result = self._fix_simple_name_error(
                code,
                combined_problem
            )

            if result:

                return {
                    "changed": True,
                    "modified_code": result,
                    "reason": (
                        "Applied a conservative "
                        "NameError correction."
                    )
                }

        # =====================================================
        # FIX 3: Missing return
        # =====================================================

        if (
            "missing return" in combined_problem
            or "does not return" in combined_problem
        ):

            return {
                "changed": False,
                "modified_code": code,
                "reason": (
                    "Missing-return fixes require "
                    "understanding the expected "
                    "function output."
                )
            }

        # =====================================================
        # FIX 4: SQL injection
        # =====================================================

        if (
            "sql injection" in combined_problem
            or "sql" in combined_problem
            and "injection" in combined_problem
        ):

            return {
                "changed": False,
                "modified_code": code,
                "reason": (
                    "SQL injection requires "
                    "framework/database-specific "
                    "parameterization."
                )
            }

        # =====================================================
        # FIX 5: Hardcoded secret
        # =====================================================

        if (
            "hardcoded secret" in combined_problem
            or "hardcoded password" in combined_problem
            or "hardcoded api key" in combined_problem
        ):

            return {
                "changed": False,
                "modified_code": code,
                "reason": (
                    "Secrets should be moved to "
                    "environment/configuration storage. "
                    "Automatic replacement is disabled."
                )
            }

        # =====================================================
        # No safe deterministic fix
        # =====================================================

        return {
            "changed": False,
            "modified_code": code,
            "reason": (
                "No deterministic safe fix rule "
                "matched this problem."
            )
        }

    # =========================================================
    # NONE ITERABLE FIX
    # =========================================================

    def _fix_none_iterable(
        self,
        code: str
    ) -> Optional[str]:

        lines = code.splitlines()

        changed = False

        new_lines = []

        for line in lines:

            stripped = line.strip()

            # -------------------------------------------------
            # Example:
            #
            # return None
            #
            # becomes:
            #
            # return []
            # -------------------------------------------------

            if stripped == "return None":

                indentation = (
                    line[:len(line) - len(line.lstrip())]
                )

                new_lines.append(
                    f"{indentation}return []"
                )

                changed = True

                continue

            new_lines.append(
                line
            )

        if not changed:

            return None

        ending = (
            "\n"
            if code.endswith("\n")
            else ""
        )

        return "\n".join(
            new_lines
        ) + ending

    # =========================================================
    # NAME ERROR FIX
    # =========================================================

    def _fix_simple_name_error(
        self,
        code: str,
        problem: str
    ) -> Optional[str]:

        # -----------------------------------------------------
        # Extract variable name from:
        #
        # NameError: name 'foo' is not defined
        # -----------------------------------------------------

        match = re.search(
            r"name ['\"]([A-Za-z_][A-Za-z0-9_]*)['\"] "
            r"is not defined",
            problem
        )

        if not match:

            return None

        variable_name = (
            match.group(1)
        )

        # -----------------------------------------------------
        # We do NOT blindly invent a value.
        # -----------------------------------------------------

        return None

    # =========================================================
    # CREATE DIFF
    # =========================================================

    def _create_diff(
        self,
        original: str,
        modified: str,
        file_path: str
    ) -> str:

        original_lines = (
            original.splitlines(
                keepends=True
            )
        )

        modified_lines = (
            modified.splitlines(
                keepends=True
            )
        )

        diff = difflib.unified_diff(
            original_lines,
            modified_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}"
        )

        return "".join(
            diff
        )