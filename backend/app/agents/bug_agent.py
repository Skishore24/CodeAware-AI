from pathlib import Path
from typing import Any, Dict, List
import re

from app.analysis.code_analyzer import CodeAnalyzer


class BugAgent:
    """
    Analyzes source code and tries to identify
    common programming bugs and suspicious patterns.

    This agent is intentionally deterministic.
    It does not require an external LLM/API.
    """

    name = "Bug Agent"

    description = (
        "Analyzes source code for common bugs, "
        "unsafe patterns, syntax-related problems, "
        "and suspicious coding practices."
    )

    # ---------------------------------------------------------
    # Supported source files
    # ---------------------------------------------------------

    SUPPORTED_EXTENSIONS = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".cs",
        ".go",
    }

    # ---------------------------------------------------------
    # Main entry point
    # ---------------------------------------------------------

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

        code = input_data.get(
            "code"
        )

        # =====================================================
        # Resolve repository
        # =====================================================

        if not repository_path:

            if repository_name:

                from app.config.paths import (
                    CLONED_REPOSITORIES_DIR
                )

                repository_path = (
                    CLONED_REPOSITORIES_DIR
                    / repository_name
                )

        # =====================================================
        # Direct code analysis
        # =====================================================

        if code:

            findings = self._analyze_code(
                code,
                file_path or "input_code"
            )

            return self._build_result(
                findings,
                file_path or "input_code"
            )

        # =====================================================
        # Repository analysis
        # =====================================================

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
                    "Repository path is not a directory: "
                    f"{repository_path}"
                )
            }

        # =====================================================
        # Analyze one file
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

                findings = self._analyze_code(
                    source,
                    str(file_path)
                )

                return self._build_result(
                    findings,
                    str(file_path)
                )

            except Exception as exc:

                return {
                    "success": False,
                    "agent": self.name,
                    "error": str(exc)
                }

        # =====================================================
        # Analyze complete repository
        # =====================================================

        all_findings: List[Dict[str, Any]] = []

        files_scanned = 0

        try:

            for path in repository_path.rglob("*"):

                if not path.is_file():
                    continue

                # Ignore common generated directories
                if self._should_ignore(path):
                    continue

                if path.suffix.lower() not in (
                    self.SUPPORTED_EXTENSIONS
                ):
                    continue

                files_scanned += 1

                try:

                    source = path.read_text(
                        encoding="utf-8",
                        errors="ignore"
                    )

                    findings = self._analyze_code(
                        source,
                        str(
                            path.relative_to(
                                repository_path
                            )
                        )
                    )

                    all_findings.extend(
                        findings
                    )

                except Exception:
                    # Continue scanning other files
                    continue

            return {
                "success": True,
                "agent": self.name,
                "files_scanned": files_scanned,
                "bugs_found": len(all_findings),
                "findings": all_findings,
                "summary": self._create_summary(
                    all_findings
                )
            }

        except Exception as exc:

            return {
                "success": False,
                "agent": self.name,
                "error": str(exc)
            }

    # =========================================================
    # Analyze source code
    # =========================================================

    def _analyze_code(
        self,
        code: str,
        file_name: str
    ) -> List[Dict[str, Any]]:

        findings: List[Dict[str, Any]] = []

        lines = code.splitlines()

        # -----------------------------------------------------
        # Empty source
        # -----------------------------------------------------

        if not code.strip():

            return findings

        # -----------------------------------------------------
        # Python syntax validation
        # -----------------------------------------------------

        if file_name.endswith(".py"):

            try:

                compile(
                    code,
                    file_name,
                    "exec"
                )

            except SyntaxError as exc:

                findings.append(
                    {
                        "type": "syntax_error",
                        "severity": "CRITICAL",
                        "file": file_name,
                        "line": exc.lineno,
                        "message": (
                            f"Python syntax error: "
                            f"{exc.msg}"
                        ),
                        "recommendation": (
                            "Fix the syntax error before "
                            "running the program."
                        )
                    }
                )

        # -----------------------------------------------------
        # TODO / FIXME markers
        # -----------------------------------------------------

        for number, line in enumerate(
            lines,
            start=1
        ):

            upper_line = line.upper()

            if "TODO" in upper_line:

                findings.append(
                    {
                        "type": "todo",
                        "severity": "LOW",
                        "file": file_name,
                        "line": number,
                        "message": (
                            "TODO marker found."
                        ),
                        "code": line.strip(),
                        "recommendation": (
                            "Review and complete the "
                            "unfinished implementation."
                        )
                    }
                )

            if "FIXME" in upper_line:

                findings.append(
                    {
                        "type": "fixme",
                        "severity": "MEDIUM",
                        "file": file_name,
                        "line": number,
                        "message": (
                            "FIXME marker found."
                        ),
                        "code": line.strip(),
                        "recommendation": (
                            "Investigate and fix the "
                            "marked problem."
                        )
                    }

                )

        # -----------------------------------------------------
        # Python dangerous patterns
        # -----------------------------------------------------

        if file_name.endswith(".py"):

            for number, line in enumerate(
                lines,
                start=1
            ):

                stripped = line.strip()

                # eval()
                if re.search(
                    r"\beval\s*\(",
                    stripped
                ):

                    findings.append(
                        {
                            "type": "dangerous_eval",
                            "severity": "HIGH",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "Use of eval() detected."
                            ),
                            "code": stripped,
                            "recommendation": (
                                "Avoid eval() on untrusted "
                                "input. Use explicit parsing "
                                "instead."
                            )
                        }
                    )

                # exec()
                if re.search(
                    r"\bexec\s*\(",
                    stripped
                ):

                    findings.append(
                        {
                            "type": "dangerous_exec",
                            "severity": "HIGH",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "Use of exec() detected."
                            ),
                            "code": stripped,
                            "recommendation": (
                                "Avoid dynamically executing "
                                "untrusted code."
                            )
                        }
                    )

                # bare except
                if stripped == "except:":

                    findings.append(
                        {
                            "type": "bare_except",
                            "severity": "MEDIUM",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "Bare except detected."
                            ),
                            "code": stripped,
                            "recommendation": (
                                "Catch a specific exception "
                                "instead of using bare except."
                            )
                        }
                    )

        # -----------------------------------------------------
        # JavaScript / TypeScript patterns
        # -----------------------------------------------------

        if file_name.endswith(
            (".js", ".jsx", ".ts", ".tsx")
        ):

            for number, line in enumerate(
                lines,
                start=1
            ):

                stripped = line.strip()

                if re.search(
                    r"\beval\s*\(",
                    stripped
                ):

                    findings.append(
                        {
                            "type": "dangerous_eval",
                            "severity": "HIGH",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "JavaScript eval() detected."
                            ),
                            "code": stripped,
                            "recommendation": (
                                "Avoid eval() and use "
                                "explicit parsing."
                            )
                        }
                    )

                if "console.log(" in stripped:

                    findings.append(
                        {
                            "type": "debug_log",
                            "severity": "LOW",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "Debug console.log() found."
                            ),
                            "code": stripped,
                            "recommendation": (
                                "Remove unnecessary debug "
                                "logging before production."
                            )
                        }
                    )

        # -----------------------------------------------------
        # Hardcoded secret patterns
        # -----------------------------------------------------

        secret_patterns = [
            r"password\s*=\s*['\"][^'\"]+['\"]",
            r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]",
            r"secret\s*=\s*['\"][^'\"]+['\"]",
            r"token\s*=\s*['\"][^'\"]+['\"]",
        ]

        for number, line in enumerate(
            lines,
            start=1
        ):

            for pattern in secret_patterns:

                if re.search(
                    pattern,
                    line,
                    re.IGNORECASE
                ):

                    findings.append(
                        {
                            "type": "hardcoded_secret",
                            "severity": "CRITICAL",
                            "file": file_name,
                            "line": number,
                            "message": (
                                "Possible hardcoded "
                                "credential detected."
                            ),
                            "recommendation": (
                                "Move secrets to environment "
                                "variables or a secure secret "
                                "manager."
                            )
                        }
                    )

                    break

        return findings

    # =========================================================
    # Ignore directories
    # =========================================================

    def _should_ignore(
        self,
        path: Path
    ) -> bool:

        ignored = {
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

        return any(
            part in ignored
            for part in path.parts
        )

    # =========================================================
    # Build single-file result
    # =========================================================

    def _build_result(
        self,
        findings: List[Dict[str, Any]],
        file_name: str
    ) -> Dict[str, Any]:

        return {
            "success": True,
            "agent": self.name,
            "file": file_name,
            "bugs_found": len(findings),
            "findings": findings,
            "summary": self._create_summary(
                findings
            )
        }

    # =========================================================
    # Create summary
    # =========================================================

    def _create_summary(
        self,
        findings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        summary = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }

        for finding in findings:

            severity = (
                finding
                .get("severity", "LOW")
                .lower()
            )

            if severity in summary:

                summary[severity] += 1

        return summary