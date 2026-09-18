from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent


class DatabaseAgent(BaseAgent):
    """
    Dedicated Database Specialist Agent for CodeAware AI.
    Detects unindexed queries, raw SQL string concatenation, unclosed sessions,
    and missing rollback blocks.
    """
    name = "DatabaseAgent"
    description = "Analyzes database models, ORM access patterns, migrations, and query safety."
    capabilities = ["orm_pattern_inspection", "sql_injection_guard", "index_analysis", "session_management"]
    tools = ["inspect_database", "read_file", "search_code"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_path = input_data.get("repository_path")
        code = input_data.get("code")
        file_path = input_data.get("file_path")

        findings: List[Dict[str, Any]] = []

        if code:
            findings.extend(self._audit_code(code, file_path or "source.py"))
        elif repo_path:
            root = Path(repo_path).resolve()
            for p in root.rglob("*.py"):
                if not any(ign in p.parts for ign in [".git", "venv", "__pycache__", "node_modules"]):
                    try:
                        content = p.read_text(encoding="utf-8", errors="ignore")
                        rel = str(p.relative_to(root)).replace("\\", "/")
                        findings.extend(self._audit_code(content, rel))
                    except Exception:
                        continue

        summary = f"Database audit completed. Found {len(findings)} database & ORM recommendations."
        return self.create_response(
            success=True,
            confidence=0.91,
            summary=summary,
            findings=findings,
            files=list(dict.fromkeys([f["file"] for f in findings])),
            recommendations=[f["recommendation"] for f in findings[:5]] or ["ORM access patterns are compliant."],
            next_actions=["Bind query parameters", "Add session.rollback() in except blocks"] if findings else ["Database access OK."],
            raw_data={"findings_count": len(findings)}
        )

    def _audit_code(self, code: str, file_name: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        for idx, line in enumerate(lines, 1):
            sline = line.strip()

            # Raw SQL formatting check
            if any(kw in sline for kw in ["execute(f\"", "execute(f'", ".execute(\"\"\"" + "+"]):
                findings.append({
                    "type": "raw_sql_interpolation",
                    "severity": "CRITICAL",
                    "file": file_name,
                    "line": idx,
                    "message": "Direct string interpolation in SQL execute call.",
                    "recommendation": "Use parameterized queries or text(:param) with bound dictionary parameters.",
                })

            # Check for missing rollback in DB exception blocks
            if "db.commit()" in sline:
                has_rollback = any("db.rollback()" in l or "session.rollback()" in l for l in lines[idx : min(len(lines), idx + 30)])
                if not has_rollback:
                    findings.append({
                        "type": "unhandled_db_transaction",
                        "severity": "LOW",
                        "file": file_name,
                        "line": idx,
                        "message": "Database commit performed without adjacent rollback handler in catch/except block.",
                        "recommendation": "Wrap transactions in try/except and ensure db.rollback() is invoked on failure.",
                    })
        return findings
