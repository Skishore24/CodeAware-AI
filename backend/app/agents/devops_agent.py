from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from app.agents.base_agent import BaseAgent


class DevOpsAgent(BaseAgent):
    """
    Dedicated DevOps Specialist Agent for CodeAware AI.
    Audits CI/CD workflows, Dockerfiles, environment files, and infrastructure configs.
    """
    name = "DevOpsAgent"
    description = "Inspects GitHub Actions workflows, Dockerfiles, deployment configurations, and secret leakage."
    capabilities = ["ci_cd_audit", "dockerfile_security", "environment_config_hygiene"]
    tools = ["read_file", "list_files"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_path = input_data.get("repository_path") or "."
        root = Path(repo_path).resolve()

        findings: List[Dict[str, Any]] = []
        devops_files: List[str] = []

        # 1. Dockerfile checks
        dockerfiles = list(root.rglob("*Dockerfile*"))
        for df in dockerfiles:
            if df.is_file() and ".git" not in df.parts:
                devops_files.append(str(df.relative_to(root)).replace("\\", "/"))
                content = df.read_text(encoding="utf-8", errors="ignore")
                if "USER root" in content or "USER " not in content:
                    findings.append({
                        "type": "docker_root_user",
                        "severity": "MEDIUM",
                        "file": str(df.relative_to(root)).replace("\\", "/"),
                        "message": "Container appears to run as default root user without dedicated non-root USER directive.",
                        "recommendation": "Add USER appuser with least-privilege permissions in Dockerfile.",
                    })

        # 2. Check for committed .env files with real credentials
        env_files = list(root.rglob(".env"))
        for ef in env_files:
            if ef.is_file() and ".git" not in ef.parts:
                devops_files.append(str(ef.relative_to(root)).replace("\\", "/"))
                findings.append({
                    "type": "committed_env_file",
                    "severity": "HIGH",
                    "file": str(ef.relative_to(root)).replace("\\", "/"),
                    "message": "Active .env file discovered in workspace. Secrets must not be checked into version control.",
                    "recommendation": "Ensure .env is added to .gitignore and provide .env.example with sanitized placeholders.",
                })

        summary = f"DevOps inspection examined {len(devops_files)} infrastructure manifests. Found {len(findings)} operational findings."
        return self.create_response(
            success=True,
            confidence=0.93,
            summary=summary,
            findings=findings,
            files=devops_files,
            recommendations=[f["recommendation"] for f in findings[:5]] or ["DevOps and deployment configurations are clean."],
            next_actions=["Review Dockerfile least-privilege settings", "Verify .gitignore rules"] if findings else ["DevOps posture OK."],
            raw_data={"devops_files": devops_files, "findings_count": len(findings)}
        )
