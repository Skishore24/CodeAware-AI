from typing import Any, Dict, List, Optional
from app.graph.code_knowledge_graph import CodeKnowledgeGraph


class ImpactAnalyzer:
    """
    Advanced Blast Radius and Impact Analyzer for CodeAware AI.
    Calculates direct callers, indirect callers, affected APIs, dependent files,
    potentially broken tests, and overall risk rating when a symbol is changed.
    """

    def __init__(self, knowledge_graph: CodeKnowledgeGraph):
        self.knowledge_graph = knowledge_graph

    def analyze(self, symbol: str, depth: int = 3) -> Dict[str, Any]:
        graph = self.knowledge_graph.graph

        matches = self.knowledge_graph.find_symbol(symbol)
        if not matches:
            return {
                "success": True,
                "symbol": symbol,
                "matches": [],
                "impact": [],
                "direct_callers": [],
                "indirect_callers": [],
                "dependent_files": [],
                "affected_apis": [],
                "potentially_broken_tests": [],
                "blast_radius_score": "LOW",
                "risk_level": "LOW",
                "count": 0,
                "summary": f"No symbol matching '{symbol}' found in knowledge graph."
            }

        direct_callers = []
        indirect_callers = []
        dependent_files = set()
        affected_apis = []
        potentially_broken_tests = []
        all_impact = []
        visited = set()

        for match in matches:
            node_id = match["id"]
            queue = [(node_id, 0)]

            while queue:
                current, current_depth = queue.pop(0)
                if current in visited:
                    continue
                visited.add(current)

                if current_depth >= depth:
                    continue

                for predecessor in graph.predecessors(current):
                    edge_data = graph.get_edge_data(predecessor, current) or {}
                    pdata = graph.nodes.get(predecessor, {})
                    pname = pdata.get("name", "")
                    ptype = pdata.get("type", "")
                    ppath = pdata.get("path", "") or pdata.get("file", "")

                    if ppath:
                        dependent_files.add(ppath)

                    item = {
                        "id": predecessor,
                        "name": pname,
                        "type": ptype,
                        "path": ppath,
                        "relationship": edge_data.get("type", "calls"),
                        "depth": current_depth + 1
                    }
                    all_impact.append(item)

                    if current_depth == 0:
                        direct_callers.append(item)
                    else:
                        indirect_callers.append(item)

                    # Classify APIs / Routes
                    if "api" in ppath.lower() or "route" in ppath.lower() or "endpoint" in pname.lower():
                        affected_apis.append(item)

                    # Classify Tests
                    if "test" in ppath.lower() or "test_" in pname.lower():
                        potentially_broken_tests.append(item)

                    queue.append((predecessor, current_depth + 1))

        # Deduplicate
        unique_impact = {item["id"]: item for item in all_impact}
        impact_list = list(unique_impact.values())

        # Determine Risk Level & Blast Radius Score
        total_affected = len(impact_list)
        if total_affected > 10 or len(affected_apis) > 2:
            blast_radius = "HIGH"
            risk_level = "CRITICAL" if total_affected > 20 else "HIGH"
        elif total_affected > 3 or len(affected_apis) > 0:
            blast_radius = "MEDIUM"
            risk_level = "MEDIUM"
        else:
            blast_radius = "LOW"
            risk_level = "LOW"

        summary = (
            f"Modifying '{symbol}' affects {len(direct_callers)} direct callers, "
            f"{len(indirect_callers)} indirect dependencies across {len(dependent_files)} files. "
            f"Blast radius: {blast_radius} ({len(affected_apis)} APIs, {len(potentially_broken_tests)} test suites)."
        )

        return {
            "success": True,
            "symbol": symbol,
            "matches": matches,
            "impact": impact_list,
            "direct_callers": direct_callers,
            "indirect_callers": indirect_callers,
            "dependent_files": sorted(list(dependent_files)),
            "affected_apis": affected_apis,
            "potentially_broken_tests": potentially_broken_tests,
            "blast_radius_score": blast_radius,
            "risk_level": risk_level,
            "count": total_affected,
            "summary": summary
        }