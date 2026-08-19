from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.graph_service import GraphService


class ImpactAgent(BaseAgent):
    """
    Analyzes code dependencies and calculates blast radius, callers, callees,
    affected APIs, and potentially broken tests when a symbol or file is changed.
    """

    name = "ImpactAgent"
    description = "Calculates blast radius, callers, callees, and affected dependencies."

    def __init__(self, graph_service: Optional[GraphService] = None):
        self.graph_service = graph_service or GraphService()

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        symbol = input_data.get("symbol") or input_data.get("symbol_name") or input_data.get("target")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path is required.",
                error="Missing repository."
            )

        if not symbol:
            return self.create_response(
                success=False,
                summary="Symbol name is required for impact analysis.",
                error="Missing symbol."
            )

        try:
            impact_res = self.graph_service.get_impact(
                repository_path=str(repository_path),
                symbol_name=str(symbol)
            )

            direct = impact_res.get("direct_callers", [])
            indirect = impact_res.get("indirect_callers", [])
            dependent_files = impact_res.get("dependent_files", [])
            affected_apis = impact_res.get("affected_apis", [])
            broken_tests = impact_res.get("potentially_broken_tests", [])
            blast_radius = impact_res.get("blast_radius_score", "LOW")
            count = impact_res.get("count", 0)

            findings = []
            for d in direct:
                findings.append({
                    "name": d.get("name"),
                    "type": d.get("type"),
                    "file": d.get("path"),
                    "relation": "Direct Caller",
                    "severity": "HIGH"
                })
            for ind in indirect[:10]:
                findings.append({
                    "name": ind.get("name"),
                    "type": ind.get("type"),
                    "file": ind.get("path"),
                    "relation": "Indirect Dependency",
                    "severity": "MEDIUM"
                })

            summary = (
                f"Blast Radius for '{symbol}': {blast_radius} ({count} affected nodes across {len(dependent_files)} files). "
                f"Identified {len(direct)} direct callers, {len(affected_apis)} affected APIs, and {len(broken_tests)} test suites."
            )

            return self.create_response(
                success=True,
                confidence=0.95,
                summary=summary,
                findings=findings,
                files=dependent_files,
                recommendations=[
                    f"Refactor direct callers in: {', '.join([d.get('path', '') for d in direct[:3]])}",
                    "Run regression test suites before and after symbol modifications",
                    "Maintain backwards compatibility if modifying public API signatures"
                ] if count > 0 else ["Symbol has no detected downstream dependents in knowledge graph."],
                evidence=[{"symbol": symbol, "blast_radius": blast_radius, "count": count}],
                next_actions=["Run affected test suites", "Inspect caller call-sites", "Generate unified diff"],
                raw_data=impact_res
            )

        except Exception as exc:
            return self.create_response(
                success=False,
                summary=f"Impact analysis failed: {exc}",
                error=str(exc)
            )