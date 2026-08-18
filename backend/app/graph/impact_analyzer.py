from typing import Any, Dict, List

from app.graph.code_knowledge_graph import (
    CodeKnowledgeGraph
)


class ImpactAnalyzer:
    """
    Determines which code entities may be
    affected when a symbol changes.
    """

    def __init__(
        self,
        knowledge_graph: CodeKnowledgeGraph
    ):

        self.knowledge_graph = (
            knowledge_graph
        )

    # =========================================================
    # ANALYZE
    # =========================================================

    def analyze(
        self,
        symbol: str,
        depth: int = 3
    ) -> Dict[str, Any]:

        graph = (
            self.knowledge_graph.graph
        )

        matches = (
            self.knowledge_graph.find_symbol(
                symbol
            )
        )

        if not matches:

            return {
                "success": True,
                "symbol": symbol,
                "matches": [],
                "impact": [],
                "count": 0
            }

        impact = []

        visited = set()

        for match in matches:

            node_id = match["id"]

            queue = [
                (
                    node_id,
                    0
                )
            ]

            while queue:

                current, current_depth = (
                    queue.pop(0)
                )

                if current in visited:
                    continue

                visited.add(
                    current
                )

                if current_depth >= depth:
                    continue

                # -------------------------------------------------
                # Find nodes that call/import/contain current node
                # -------------------------------------------------

                for predecessor in (
                    graph.predecessors(
                        current
                    )
                ):

                    edge_data = (
                        graph.get_edge_data(
                            predecessor,
                            current
                        )
                        or {}
                    )

                    predecessor_data = (
                        graph.nodes[
                            predecessor
                        ]
                    )

                    impact.append({
                        "id":
                            predecessor,

                        "name":
                            predecessor_data.get(
                                "name"
                            ),

                        "type":
                            predecessor_data.get(
                                "type"
                            ),

                        "relationship":
                            edge_data.get(
                                "type"
                            ),

                        "depth":
                            current_depth + 1
                    })

                    queue.append(
                        (
                            predecessor,
                            current_depth + 1
                        )
                    )

        # -----------------------------------------------------
        # Remove duplicates
        # -----------------------------------------------------

        unique = {}

        for item in impact:

            unique[
                item["id"]
            ] = item

        impact = list(
            unique.values()
        )

        return {
            "success": True,

            "symbol": symbol,

            "matches": matches,

            "impact": impact,

            "count":
                len(impact)
        }