from typing import Any, Dict, List

import networkx as nx


class ImpactAnalyzer:
    """
    Finds code that may be affected by changing
    a particular function, class or symbol.
    """

    def __init__(
        self,
        graph: nx.DiGraph
    ):

        self.graph = graph

    # ---------------------------------------------------------
    # Find node by name
    # ---------------------------------------------------------

    def find_nodes(
        self,
        name: str
    ) -> List[str]:

        matches = []

        search_name = name.lower()

        for node_id, data in self.graph.nodes(
            data=True
        ):

            node_name = str(
                data.get(
                    "name",
                    ""
                )
            ).lower()

            if node_name == search_name:

                matches.append(
                    node_id
                )

        return matches

    # ---------------------------------------------------------
    # Find affected nodes
    # ---------------------------------------------------------

    def find_impact(
        self,
        name: str
    ) -> Dict[str, Any]:

        matching_nodes = self.find_nodes(
            name
        )

        if not matching_nodes:

            return {
                "success": False,
                "message": (
                    f"Symbol '{name}' "
                    "was not found."
                ),
            }

        affected = []

        for node_id in matching_nodes:

            # -------------------------------------------------
            # Find predecessors
            # -------------------------------------------------

            predecessors = nx.ancestors(
                self.graph,
                node_id
            )

            for predecessor in predecessors:

                data = self.graph.nodes[
                    predecessor
                ]

                affected.append(
                    {
                        "id": predecessor,
                        "name": data.get(
                            "name"
                        ),
                        "type": data.get(
                            "type"
                        ),
                        "file": data.get(
                            "file"
                        ),
                    }
                )

        # Remove duplicates
        unique = {}

        for item in affected:

            unique[item["id"]] = item

        return {

            "success": True,

            "target": name,

            "matching_nodes": (
                matching_nodes
            ),

            "affected_nodes": list(
                unique.values()
            ),

        }