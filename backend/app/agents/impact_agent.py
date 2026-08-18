from pathlib import Path
from typing import Any, Dict

from app.services.graph_service import GraphService


class ImpactAgent:
    """
    Analyzes the potential impact of changing
    a function, class, method, or symbol.
    """

    name = "Impact Agent"

    description = (
        "Analyzes code dependencies and determines "
        "which functions and files may be affected "
        "by changing a symbol."
    )

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        # =================================================
        # Read input
        # =================================================

        repository_path = input_data.get(
            "repository_path"
        )

        repository_name = input_data.get(
            "repository_name"
        )

        symbol = (
            input_data.get("symbol")
            or input_data.get("symbol_name")
        )

        # =================================================
        # Resolve repository path
        # =================================================

        if not repository_path:

            if not repository_name:

                return {
                    "success": False,
                    "agent": self.name,
                    "error": (
                        "repository_name or "
                        "repository_path is required."
                    )
                }

            from app.config.paths import (
                CLONED_REPOSITORIES_DIR
            )

            repository_path = (
                CLONED_REPOSITORIES_DIR
                / repository_name
            )

        repository_path = Path(
            repository_path
        )

        # =================================================
        # Validate repository
        # =================================================

        if not repository_path.exists():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Repository does not exist: "
                    f"{repository_path}"
                )
            }

        if not repository_path.is_dir():

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "Repository path is not a directory: "
                    f"{repository_path}"
                )
            }

        # =================================================
        # Validate symbol
        # =================================================

        if not symbol:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "symbol or symbol_name is required."
                )
            }

        # =================================================
        # Build graph and analyze impact
        # =================================================

        try:

            graph_service = GraphService(
                repository_path
            )

            result = graph_service.get_impact(
                symbol
            )

            # ---------------------------------------------
            # Handle graph failure
            # ---------------------------------------------

            if not result.get(
                "success",
                False
            ):

                return {
                    "success": False,
                    "agent": self.name,
                    "target": symbol,
                    "message": result.get(
                        "message",
                        "Symbol was not found."
                    ),
                    "matching_nodes": result.get(
                        "matching_nodes",
                        []
                    ),
                    "affected_nodes": []
                }

            # ---------------------------------------------
            # Affected nodes
            # ---------------------------------------------

            affected_nodes = result.get(
                "affected_nodes",
                []
            )

            affected_count = len(
                affected_nodes
            )

            # ---------------------------------------------
            # Risk calculation
            # ---------------------------------------------

            if affected_count == 0:

                risk = "LOW"

            elif affected_count <= 3:

                risk = "MEDIUM"

            else:

                risk = "HIGH"

            # ---------------------------------------------
            # Collect affected files
            # ---------------------------------------------

            affected_files = set()

            for node in affected_nodes:

                file_path = node.get(
                    "file"
                )

                if file_path:

                    affected_files.add(
                        str(file_path)
                    )

            # ---------------------------------------------
            # Return result
            # ---------------------------------------------

            return {

                "success": True,

                "agent": self.name,

                "target": symbol,

                "risk": risk,

                "affected_count": (
                    affected_count
                ),

                "affected_files": sorted(
                    affected_files
                ),

                "affected_nodes": (
                    affected_nodes
                ),

                "matching_nodes": (
                    result.get(
                        "matching_nodes",
                        []
                    )
                ),

                "message": (
                    f"Changing '{symbol}' "
                    f"may affect "
                    f"{affected_count} "
                    f"code entities."
                )

            }

        except Exception as exc:

            return {

                "success": False,

                "agent": self.name,

                "target": symbol,

                "error": str(exc)

            }