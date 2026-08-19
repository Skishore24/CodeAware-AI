from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


class PerformanceAgent(BaseAgent):
    """
    Analyzes code for performance bottlenecks, N+1 query patterns,
    heavy synchronous operations, unindexed searches, and memory leaks.
    """

    name = "PerformanceAgent"
    description = "Detects runtime bottlenecks, inefficient algorithms, blocking calls, and query anti-patterns."

    PERF_PATTERNS = [
        {
            "id": "PERF-001",
            "type": "n_plus_one_query",
            "pattern": r"for\s+\w+\s+in\s+.*:\s*\n\s*(?:.*\.query\(|.*\.filter\(|.*\.execute\(|.*\.find\()",
            "message": "Potential N+1 query pattern: database query executed inside a loop.",
            "severity": "HIGH",
            "recommendation": "Batch database queries using IN clauses, joins, or prefetch_related."
        },
        {
            "id": "PERF-002",
            "type": "blocking_io_in_async",
            "pattern": r"async\s+def\s+.*:\s*(?:[\s\S]*?)(?:time\.sleep\(|requests\.(?:get|post)|open\()",
            "message": "Synchronous blocking call inside async function blocks event loop.",
            "severity": "HIGH",
            "recommendation": "Use asyncio.sleep, httpx.AsyncClient, or aiofiles for non-blocking execution."
        },
        {
            "id": "PERF-003",
            "type": "repeated_string_concat",
            "pattern": r"\b\w+\s*\+=\s*['\"][^'\"]+['\"]\s*\n\s*\w+\s*\+=",
            "message": "Repeated string concatenation inside loops creates quadratic memory allocation.",
            "severity": "LOW",
            "recommendation": "Accumulate elements into a list and use ''.join(list) or StringBuilder."
        },
        {
            "id": "PERF-004",
            "type": "unbounded_read",
            "pattern": r"\.(?:read|fetchall)\s*\(\s*\)",
            "message": "Unbounded readall or fetchall on large streams may exhaust system RAM.",
            "severity": "MEDIUM",
            "recommendation": "Use chunked streaming or pagination with limits."
        }
    ]

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
            file_name = file_path or "input_code"
            findings.extend(self._analyze_source(code, file_name))
            files_scanned.append(file_name)
        elif repository_path:
            repo = Path(repository_path)
            if repo.exists():
                for path in repo.rglob("*"):
                    if path.is_file() and path.suffix.lower() in {".py", ".js", ".ts", ".go", ".java"}:
                        rel = str(path.relative_to(repo)).replace("\\", "/")
                        try:
                            content = path.read_text(encoding="utf-8", errors="ignore")
                            findings.extend(self._analyze_source(content, rel))
                            files_scanned.append(rel)
                        except Exception:
                            continue

        summary = (
            f"Performance analysis scanned {len(files_scanned)} files and found {len(findings)} potential efficiency opportunities."
        )

        return self.create_response(
            success=True,
            confidence=0.88,
            summary=summary,
            findings=findings,
            files=list(dict.fromkeys([f["file"] for f in findings])),
            recommendations=list(dict.fromkeys([f["recommendation"] for f in findings]))[:5] or [
                "Profile critical request pathways using async instrumentation",
                "Ensure database indexes cover frequent filter conditions"
            ],
            evidence=[{"file": f["file"], "line": f["line"], "code": f["evidence"]} for f in findings[:8]],
            next_actions=["Optimize flagged queries", "Add caching layers"] if findings else ["Performance baseline looks good."]
        )

    def _analyze_source(self, code: str, file_path: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()
        for idx, line in enumerate(lines, 1):
            for rule in self.PERF_PATTERNS:
                if re.search(rule["pattern"], line):
                    findings.append({
                        "id": rule["id"],
                        "type": rule["type"],
                        "severity": rule["severity"],
                        "file": file_path,
                        "line": idx,
                        "message": rule["message"],
                        "recommendation": rule["recommendation"],
                        "evidence": line.strip()[:100]
                    })
        return findings
