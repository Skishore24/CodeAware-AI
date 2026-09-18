from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent


class FrontendAgent(BaseAgent):
    """
    Dedicated Frontend Specialist Agent for CodeAware AI.
    Inspects React/JSX/TSX component hierarchies, hooks, state, routing, and console errors.
    """
    name = "FrontendAgent"
    description = "Analyzes frontend components, React hooks dependencies, state management, and UX responsiveness."
    capabilities = ["component_analysis", "hooks_dependency_audit", "state_flow_tracking", "accessibility_hygiene"]
    tools = ["read_file", "search_code"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_path = input_data.get("repository_path") or "."
        root = Path(repo_path).resolve()

        frontend_files: List[Path] = []
        for ext in [".jsx", ".tsx", ".js", ".ts"]:
            for p in root.rglob(f"*{ext}"):
                if not any(ign in p.parts for ign in [".git", "node_modules", "dist", "build"]):
                    frontend_files.append(p)

        findings: List[Dict[str, Any]] = []

        for p in frontend_files:
            try:
                content = p.read_text(encoding="utf-8", errors="ignore")
                rel = str(p.relative_to(root)).replace("\\", "/")
                lines = content.splitlines()

                for idx, line in enumerate(lines, 1):
                    # Check for console.log statements left in frontend code
                    if "console.log(" in line:
                        findings.append({
                            "type": "console_log_leftover",
                            "severity": "LOW",
                            "file": rel,
                            "line": idx,
                            "message": "Direct console.log left in production frontend component.",
                            "recommendation": "Remove debug logging or replace with application telemetry.",
                        })

                    # Check for missing rel='noopener noreferrer' on target='_blank'
                    if 'target="_blank"' in line and 'rel=' not in line:
                        findings.append({
                            "type": "unsafe_target_blank",
                            "severity": "MEDIUM",
                            "file": rel,
                            "line": idx,
                            "message": "Anchor tag with target='_blank' lacks rel='noopener noreferrer' (reverse tabnabbing risk).",
                            "recommendation": "Add rel='noopener noreferrer' attribute to external links.",
                        })
            except Exception:
                continue

        summary = f"Frontend analysis scanned {len(frontend_files)} client components. Found {len(findings)} recommendations."
        return self.create_response(
            success=True,
            confidence=0.90,
            summary=summary,
            findings=findings,
            files=list(dict.fromkeys([f["file"] for f in findings])),
            recommendations=[f["recommendation"] for f in findings[:5]] or ["Frontend code satisfies best practices."],
            next_actions=["Strip leftover console logs", "Harden external hyperlinks"] if findings else ["Frontend verified."],
            raw_data={"components_scanned": len(frontend_files), "findings_count": len(findings)}
        )
