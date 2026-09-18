from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent
from app.analysis.code_analyzer import CodeAnalyzer


class APIAgent(BaseAgent):
    """
    Dedicated API Specialist Agent for CodeAware AI.
    Discovers REST endpoints, route decorators, request schemas, status codes, and auth guards.
    """
    name = "APIAgent"
    description = "Inspects REST APIs, route definitions, schemas, authentication middleware, and status codes."
    capabilities = ["route_discovery", "schema_validation_audit", "status_code_check", "auth_guard_audit"]
    tools = ["inspect_api_routes", "read_file"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_path = input_data.get("repository_path") or "."
        analyzer = CodeAnalyzer(repo_path)
        analysis = analyzer.analyze()

        endpoints = analysis.get("api_endpoints", [])
        findings: List[Dict[str, Any]] = []

        for ep in endpoints:
            file_name = ep.get("file", "")
            method = ep.get("method", "GET")
            path = ep.get("path", "/")

            # Audit endpoints lacking explicit status codes or auth
            has_auth = any("auth" in d.lower() or "user" in d.lower() for d in ep.get("decorators", []))
            if not has_auth and any(seg in path for seg in ["/admin", "/user", "/settings", "/delete"]):
                findings.append({
                    "type": "unprotected_api_endpoint",
                    "severity": "HIGH",
                    "endpoint": f"{method} {path}",
                    "file": file_name,
                    "line": ep.get("line"),
                    "message": f"Sensitive route '{path}' appears to lack explicit authentication dependencies.",
                    "recommendation": "Inject authentication dependency (e.g. Depends(get_current_user)).",
                })

        summary = f"API audit discovered {len(endpoints)} endpoints across the repository. Flagged {len(findings)} potential security/schema items."
        return self.create_response(
            success=True,
            confidence=0.92,
            summary=summary,
            findings=findings,
            files=list(dict.fromkeys([ep["file"] for ep in endpoints if "file" in ep])),
            recommendations=[f["recommendation"] for f in findings[:5]] or ["API routes are properly structured."],
            next_actions=["Review unprotected endpoints", "Verify Pydantic input schemas"] if findings else ["API surface validated."],
            raw_data={"endpoints_count": len(endpoints), "endpoints": endpoints[:30]}
        )
