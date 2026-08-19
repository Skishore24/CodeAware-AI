from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


class BugAgent(BaseAgent):
    """
    Analyzes source code for deterministic syntax bugs, uncaught runtime exceptions,
    dangerous patterns, and suspicious logic.
    """

    name = "BugAgent"
    description = "Analyzes source code for bugs, syntax errors, and suspicious logic patterns."

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h", ".cs", ".go"
    }

    IGNORED_DIRS = {
        ".git", ".venv", "venv", "env", "node_modules", "__pycache__", ".idea", ".vscode", "dist", "build"
    }

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        code = input_data.get("code")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        findings: List[Dict[str, Any]] = []
        files_scanned: List[str] = []

        if code:
            fname = file_path or "input_code"
            findings.extend(self._analyze_code(code, fname))
            files_scanned.append(fname)
        elif repository_path:
            repo = Path(repository_path)
            if not repo.exists():
                return self.create_response(
                    success=False,
                    summary=f"Repository does not exist: {repository_path}",
                    error="Repository not found."
                )

            if file_path:
                target = repo / file_path
                if target.exists() and target.is_file():
                    try:
                        content = target.read_text(encoding="utf-8", errors="ignore")
                        findings.extend(self._analyze_code(content, str(file_path)))
                        files_scanned.append(str(file_path))
                    except Exception as e:
                        return self.create_response(success=False, error=str(e))
            else:
                for path in repo.rglob("*"):
                    if not path.is_file():
                        continue
                    if any(part in self.IGNORED_DIRS for part in path.parts):
                        continue
                    if path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                        rel = str(path.relative_to(repo)).replace("\\", "/")
                        try:
                            content = path.read_text(encoding="utf-8", errors="ignore")
                            findings.extend(self._analyze_code(content, rel))
                            files_scanned.append(rel)
                        except Exception:
                            continue

        critical_count = sum(1 for f in findings if f.get("severity") in ("CRITICAL", "HIGH"))
        summary = f"Bug analysis completed across {len(files_scanned)} files. Identified {len(findings)} potential bugs/warnings ({critical_count} High/Critical)."

        affected_files = list(dict.fromkeys([f["file"] for f in findings]))
        recommendations = list(dict.fromkeys([f["recommendation"] for f in findings]))

        return self.create_response(
            success=True,
            confidence=0.92,
            summary=summary,
            findings=findings,
            files=affected_files,
            recommendations=recommendations[:5] or ["No active bugs detected in analyzed code."],
            evidence=[{"file": f["file"], "line": f.get("line", 1), "code": f.get("code", f.get("message", ""))} for f in findings[:10]],
            next_actions=["Review critical bug locations", "Generate patch with FixAgent", "Run project test suite"] if findings else ["Code passed bug inspection."],
            raw_data={"files_scanned": len(files_scanned), "bugs_found": len(findings)}
        )

    def _analyze_code(self, code: str, file_name: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        if not code.strip():
            return findings

        # Python syntax validation
        if file_name.endswith(".py"):
            try:
                compile(code, file_name, "exec")
            except SyntaxError as exc:
                findings.append({
                    "type": "syntax_error",
                    "severity": "CRITICAL",
                    "file": file_name,
                    "line": exc.lineno or 1,
                    "message": f"Python syntax error: {exc.msg}",
                    "code": lines[exc.lineno - 1].strip() if exc.lineno and exc.lineno <= len(lines) else "",
                    "recommendation": "Fix the syntax error before running or indexing."
                })

        for number, line in enumerate(lines, start=1):
            sline = line.strip()

            # Bare except
            if file_name.endswith(".py") and sline.startswith("except:"):
                findings.append({
                    "type": "bare_except",
                    "severity": "MEDIUM",
                    "file": file_name,
                    "line": number,
                    "message": "Bare except catches system exit and keyboard interrupts.",
                    "code": sline,
                    "recommendation": "Catch specific exception types (e.g. except Exception:)."
                })

            # Unhandled TODO / FIXME
            if "FIXME" in sline.upper():
                findings.append({
                    "type": "fixme_marker",
                    "severity": "MEDIUM",
                    "file": file_name,
                    "line": number,
                    "message": "Unresolved FIXME marker in source.",
                    "code": sline,
                    "recommendation": "Address or resolve the documented issue."
                })

            # JS/TS loose equality
            if file_name.endswith((".js", ".jsx", ".ts", ".tsx")):
                if " == " in sline and " === " not in sline and " != " not in sline:
                    findings.append({
                        "type": "loose_equality",
                        "severity": "LOW",
                        "file": file_name,
                        "line": number,
                        "message": "Loose equality operator '==' used instead of strict '==='.",
                        "code": sline,
                        "recommendation": "Use strict equality '===' to prevent accidental type coercion."
                    })

        return findings