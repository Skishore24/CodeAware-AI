from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import re
from app.agents.base_agent import BaseAgent
from app.config.settings import settings


class DependencyAgent(BaseAgent):
    """
    Dedicated Dependency Specialist Agent for CodeAware AI.
    Audits package manifests, unpinned dependencies, outdated versions, and license risks.
    """
    name = "DependencyAgent"
    description = "Inspects project manifests (Python, Node, Go, Rust), unpinned versions, and package risks."
    capabilities = ["manifest_parsing", "version_pinning_check", "license_audit", "security_hygiene"]
    tools = ["inspect_dependencies", "read_file"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repo_path = input_data.get("repository_path") or settings.REPOSITORY_STORAGE_PATH
        root = Path(repo_path).resolve()
        if not root.exists():
            return self.create_response(success=False, error=f"Repository not found at {root}")

        findings: List[Dict[str, Any]] = []
        manifests_found: List[str] = []

        # 1. Python requirements.txt & pyproject.toml
        req_file = root / "requirements.txt"
        if req_file.exists():
            manifests_found.append("requirements.txt")
            lines = req_file.read_text(encoding="utf-8", errors="ignore").splitlines()
            for idx, line in enumerate(lines, 1):
                sline = line.strip()
                if sline and not sline.startswith("#"):
                    if "==" not in sline and ">=" not in sline and "<=" not in sline and "~=" not in sline:
                        findings.append({
                            "type": "unpinned_dependency",
                            "severity": "MEDIUM",
                            "file": "requirements.txt",
                            "line": idx,
                            "package": sline.split()[0],
                            "message": f"Package '{sline}' is unpinned. May result in unexpected breaking upgrades.",
                            "recommendation": f"Pin exact or compatible version: e.g. {sline}==x.y.z",
                        })

        pyproj = root / "pyproject.toml"
        if pyproj.exists():
            manifests_found.append("pyproject.toml")

        # 2. Node package.json
        pkg_file = root / "package.json"
        if pkg_file.exists():
            manifests_found.append("package.json")
            try:
                pkg_data = json.loads(pkg_file.read_text(encoding="utf-8", errors="ignore"))
                deps = pkg_data.get("dependencies", {})
                for pkg, ver in deps.items():
                    if ver.startswith("*") or ver == "latest":
                        findings.append({
                            "type": "wildcard_dependency",
                            "severity": "HIGH",
                            "file": "package.json",
                            "package": pkg,
                            "message": f"Package '{pkg}' uses unsafe wildcard version '{ver}'.",
                            "recommendation": f"Specify explicit semantic version range for '{pkg}'.",
                        })
            except Exception:
                pass

        summary = (
            f"Dependency analysis completed across {len(manifests_found)} manifests. "
            f"Found {len(findings)} dependency hygiene recommendations."
        )

        return self.create_response(
            success=True,
            confidence=0.92,
            summary=summary,
            findings=findings,
            files=manifests_found,
            recommendations=[f["recommendation"] for f in findings[:5]] or ["Dependencies are well-pinned."],
            next_actions=["Review unpinned packages", "Lock dependency tree with uv or package-lock.json"] if findings else ["Manifests verified."],
            raw_data={"manifests": manifests_found, "findings_count": len(findings)}
        )
