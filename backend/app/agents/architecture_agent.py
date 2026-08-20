from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR
from app.analysis.repository_scanner import RepositoryScanner


class ArchitectureAgent(BaseAgent):
    """
    Analyzes project architecture, detected layers (frontend, backend, API, services, models, db),
    coupling risks, and modular structure. Supports both whole-repo and code snippet analysis.
    """

    name = "ArchitectureAgent"
    description = "Analyzes repository architecture, layer separation, module boundaries, and design patterns."

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        code = input_data.get("code")
        file_path = input_data.get("file_path", "snippet.py")

        # Snippet-level analysis
        if code and not repository_path and not repository_name:
            lines = code.splitlines()
            findings = []
            has_api = any("get(" in l.lower() or "post(" in l.lower() or "route" in l.lower() for l in lines)
            has_db = any("select" in l.lower() or "query" in l.lower() or "filter" in l.lower() for l in lines)
            has_class = any("class " in l for l in lines)
            
            if has_api: findings.append({"layer": "API / Routes", "status": "Detected"})
            if has_db: findings.append({"layer": "Data / Models / Database", "status": "Detected"})
            if has_class: findings.append({"layer": "Domain Classes", "status": "Detected"})
            
            return self.create_response(
                success=True,
                confidence=0.90,
                summary=f"Architecture analysis for '{file_path}': Analyzed {len(lines)} lines of source code.",
                findings=findings,
                files=[file_path],
                recommendations=["Keep controller logic lean by delegating domain operations to dedicated services."],
                evidence=[{"total_lines": len(lines)}],
                next_actions=["Extract domain services", "Add interface boundaries"]
            )

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path is required.",
                error="No repository provided."
            )

        repo = Path(repository_path)
        if not repo.exists():
            return self.create_response(
                success=False,
                summary=f"Repository not found at {repository_path}",
                error="Path does not exist."
            )

        scanner = RepositoryScanner(repo)
        scan_res = scanner.scan()

        files = scan_res.get("files", [])
        languages = scan_res.get("languages", {})
        frameworks = scan_res.get("frameworks", [])

        # Categorize architectural layers
        layers: Dict[str, List[str]] = {
            "API / Routes": [],
            "Services / Business Logic": [],
            "Data / Models / Database": [],
            "Frontend / UI": [],
            "Configuration / Infrastructure": [],
            "Utilities / Common": [],
            "Tests / Specs": [],
        }

        large_files = []

        for f in files:
            p = f["path"].lower()
            rel = f["path"]
            lines = f.get("lines", 0)

            if lines > 400:
                large_files.append({"file": rel, "lines": lines})

            if "test" in p or "spec" in p:
                layers["Tests / Specs"].append(rel)
            elif "api" in p or "route" in p or "controller" in p or "endpoint" in p:
                layers["API / Routes"].append(rel)
            elif "service" in p or "agent" in p or "core" in p or "domain" in p:
                layers["Services / Business Logic"].append(rel)
            elif "model" in p or "schema" in p or "db" in p or "entity" in p or "migration" in p:
                layers["Data / Models / Database"].append(rel)
            elif "component" in p or "page" in p or "view" in p or "frontend" in p or "ui" in p or ".jsx" in p or ".tsx" in p or ".vue" in p:
                layers["Frontend / UI"].append(rel)
            elif "config" in p or "setting" in p or "docker" in p or ".yaml" in p or ".json" in p or ".env" in p:
                layers["Configuration / Infrastructure"].append(rel)
            else:
                layers["Utilities / Common"].append(rel)

        findings = []
        for layer_name, layer_files in layers.items():
            if layer_files:
                findings.append({
                    "layer": layer_name,
                    "file_count": len(layer_files),
                    "sample_files": layer_files[:5],
                    "status": "Healthy"
                })

        # Risk assessments
        risk_areas = []
        if len(large_files) > 0:
            risk_areas.append(f"{len(large_files)} large modules detected (>400 lines of code) which may violate Single Responsibility.")
        if not layers["Tests / Specs"]:
            risk_areas.append("No dedicated test suites or test directories identified.")
        if len(layers["API / Routes"]) > 0 and len(layers["Services / Business Logic"]) == 0:
            risk_areas.append("Controllers directly handle logic without an explicit service layer (tight coupling).")

        summary = (
            f"Architecture overview for '{repo.name}': Detected {len([k for k, v in layers.items() if v])} distinct architectural layers "
            f"powered by {', '.join(frameworks) if frameworks else 'Standard libraries'} ({scan_res.get('primary_language', 'Code')})."
        )

        return self.create_response(
            success=True,
            confidence=0.92,
            summary=summary,
            findings=findings,
            files=[f["path"] for f in files[:20]],
            recommendations=[
                "Maintain separation between API routing and business service logic",
                "Decompose large modules into focused domain helpers",
                "Ensure comprehensive integration test coverage for critical endpoints"
            ],
            evidence=[{"item": r} for r in risk_areas],
            next_actions=["Review large modules", "Inspect dependency boundaries", "Generate missing tests"],
            raw_data={
                "layers": {k: len(v) for k, v in layers.items()},
                "large_modules": large_files[:5],
                "frameworks": frameworks,
                "languages": languages
            }
        )
