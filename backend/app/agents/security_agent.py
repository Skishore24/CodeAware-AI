from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


class SecurityAgent(BaseAgent):
    """
    Dedicated Security Agent for CodeAware AI.
    Performs static security analysis and audits for OWASP Top 10 vulnerabilities,
    hardcoded credentials, injection vectors, unsafe deserialization, and dangerous APIs.
    """

    name = "SecurityAgent"
    description = "Scans source code for security vulnerabilities, secrets, and dangerous patterns."

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".cpp", ".c", ".php", ".cs"
    }

    IGNORED_DIRS = {
        ".git", ".venv", "venv", "env", "node_modules", "__pycache__", "dist", "build"
    }

    # Vulnerability Pattern Rules
    SECURITY_RULES = [
        {
            "id": "SEC-001",
            "type": "hardcoded_secret",
            "severity": "CRITICAL",
            "pattern": r"(?:password|passwd|api[_-]?key|secret[_-]?key|auth[_-]?token|private[_-]?key)\s*[:=]\s*['\"][A-Za-z0-9_\-+=/]{8,}['\"]",
            "message": "Potential hardcoded secret or credential in source code.",
            "recommendation": "Use environment variables (.env) or a secure secrets vault (e.g. AWS Secrets Manager, HashiCorp Vault)."
        },
        {
            "id": "SEC-002",
            "type": "sql_injection",
            "severity": "CRITICAL",
            "pattern": r"(?:(?:execute|raw|query)\s*\(\s*(?:f['\"].*SELECT|['\"].*%s|['\"].*\+\s*\w+|['\"].*\.format\()|f['\"].*SELECT\s+.*FROM\s+.*WHERE\s+.*\{)",
            "message": "Potential SQL Injection vulnerability from raw string interpolation.",
            "recommendation": "Use parameterized queries or ORM abstractions with bound parameters."
        },
        {
            "id": "SEC-003",
            "type": "command_injection",
            "severity": "CRITICAL",
            "pattern": r"(?:subprocess\.(?:Popen|call|run|check_output)\s*\([^)]*shell\s*=\s*True|os\.system\s*\([^)]*\+|os\.popen\s*\([^)]*\+)",
            "message": "Potential Command Injection via unescaped shell execution.",
            "recommendation": "Avoid shell=True and pass command arguments as an array with input validation."
        },
        {
            "id": "SEC-004",
            "type": "dangerous_eval",
            "severity": "HIGH",
            "pattern": r"\b(?:eval|exec)\s*\([^)]+\)",
            "message": "Dynamic code execution via eval() or exec() can execute untrusted payloads.",
            "recommendation": "Replace dynamic evaluation with explicit parsing (e.g. ast.literal_eval, JSON.parse)."
        },
        {
            "id": "SEC-005",
            "type": "unsafe_deserialization",
            "severity": "HIGH",
            "pattern": r"(?:pickle\.loads?\s*\(|yaml\.load\s*\([^)]*Loader\s*=\s*(?:yaml\.)?Loader)",
            "message": "Unsafe deserialization can lead to arbitrary remote code execution.",
            "recommendation": "Use yaml.safe_load() or JSON serialization instead of pickle on untrusted data."
        },
        {
            "id": "SEC-006",
            "type": "path_traversal",
            "severity": "HIGH",
            "pattern": r"(?:open|os\.path\.join|Path)\s*\([^)]*(?:req|request|params|input)[\w.\[\]]*\)",
            "message": "Potential Path Traversal if user-supplied paths are not sanitized with os.path.abspath / resolve.",
            "recommendation": "Sanitize path inputs against a fixed base directory and check for directory escapes ('..')."
        },
        {
            "id": "SEC-007",
            "type": "weak_cryptography",
            "severity": "MEDIUM",
            "pattern": r"(?:hashlib\.(?:md5|sha1)\s*\(|Crypto\.Cipher\.DES)",
            "message": "Use of cryptographically weak hashing/cipher algorithm (MD5/SHA1/DES).",
            "recommendation": "Use SHA-256 / SHA-3 for digests and bcrypt / Argon2 for password hashing."
        },
        {
            "id": "SEC-008",
            "type": "insecure_cors",
            "severity": "MEDIUM",
            "pattern": r"allow_origins\s*=\s*\[\s*['\"]\*['\"]\s*\]\s*,\s*allow_credentials\s*=\s*True",
            "message": "Permissive CORS wildcard with allow_credentials=True allows cross-site data theft.",
            "recommendation": "Specify explicit trusted origins when credentials/cookies are enabled."
        }
    ]

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        code = input_data.get("code")

        # Resolve path
        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        findings: List[Dict[str, Any]] = []
        files_scanned: List[str] = []

        if code:
            file_label = file_path or "input_code"
            findings.extend(self._scan_source(code, file_label))
            files_scanned.append(file_label)
        elif repository_path:
            repo = Path(repository_path)
            if not repo.exists():
                return self.create_response(
                    success=False,
                    confidence=0.0,
                    summary=f"Repository path not found: {repository_path}",
                    error=f"Repository not found at {repository_path}"
                )

            if file_path:
                target = repo / file_path
                if target.exists() and target.is_file():
                    try:
                        content = target.read_text(encoding="utf-8", errors="ignore")
                        findings.extend(self._scan_source(content, str(file_path)))
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
                            findings.extend(self._scan_source(content, rel))
                            files_scanned.append(rel)
                        except Exception:
                            continue

        # Summarize findings
        critical_count = sum(1 for f in findings if f["severity"] == "CRITICAL")
        high_count = sum(1 for f in findings if f["severity"] == "HIGH")
        med_count = sum(1 for f in findings if f["severity"] == "MEDIUM")

        recommendations = list(dict.fromkeys([f["recommendation"] for f in findings]))
        affected_files = list(dict.fromkeys([f["file"] for f in findings]))

        summary = (
            f"Security scan completed across {len(files_scanned)} files. "
            f"Found {len(findings)} security issues ({critical_count} Critical, {high_count} High, {med_count} Medium)."
        )

        return self.create_response(
            success=True,
            confidence=0.95,
            summary=summary,
            findings=findings,
            files=affected_files,
            recommendations=recommendations[:6],
            evidence=[{"file": f["file"], "line": f["line"], "code": f["evidence"]} for f in findings[:10]],
            next_actions=[
                "Remediate CRITICAL injection and credential findings immediately",
                "Apply proposed security patches via Autonomous Fix",
                "Run static security verification tests"
            ] if findings else ["No immediate security vulnerabilities detected."],
            raw_data={
                "files_scanned_count": len(files_scanned),
                "total_vulnerabilities": len(findings),
                "critical": critical_count,
                "high": high_count,
                "medium": med_count,
            }
        )

    def _scan_source(self, code: str, file_path: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        for line_num, line in enumerate(lines, 1):
            sline = line.strip()
            if not sline or sline.startswith("#") or sline.startswith("//"):
                continue

            for rule in self.SECURITY_RULES:
                match = re.search(rule["pattern"], line, re.IGNORECASE)
                if match:
                    findings.append({
                        "id": rule["id"],
                        "type": rule["type"],
                        "severity": rule["severity"],
                        "file": file_path,
                        "line": line_num,
                        "message": rule["message"],
                        "recommendation": rule["recommendation"],
                        "evidence": sline[:120],
                    })
        return findings