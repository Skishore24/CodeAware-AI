from pathlib import Path
from typing import Any, Dict

import networkx as nx


class CodeKnowledgeGraph:
    """
    Builds a graph representing relationships
    between files, classes, functions and calls.
    """

    def __init__(self):
        self.graph = nx.DiGraph()

    # ---------------------------------------------------------
    # Add a node
    # ---------------------------------------------------------

    def add_node(
        self,
        node_id: str,
        node_type: str,
        name: str,
        **metadata
    ):

        self.graph.add_node(
            node_id,
            type=node_type,
            name=name,
            **metadata
        )

    # ---------------------------------------------------------
    # Add relationship
    # ---------------------------------------------------------

    def add_relationship(
        self,
        source: str,
        target: str,
        relationship: str
    ):

        self.graph.add_edge(
            source,
            target,
            relationship=relationship
        )

    # ---------------------------------------------------------
    # Build graph from code analysis
    # ---------------------------------------------------------

    def build_from_analysis(
        self,
        analysis: Dict[str, Any]
    ):

        files = analysis.get(
            "files",
            []
        )

        for file_data in files:

            file_path = file_data.get(
                "file"
            )

            if not file_path:
                continue

            file_id = f"file:{file_path}"

            self.add_node(
                node_id=file_id,
                node_type="file",
                name=Path(file_path).name,
                path=file_path,
            )

            # -------------------------------------------------
            # Imports
            # -------------------------------------------------

            for import_name in file_data.get(
                "imports",
                []
            ):

                import_id = (
                    f"module:{import_name}"
                )

                self.add_node(
                    node_id=import_id,
                    node_type="module",
                    name=import_name,
                )

                self.add_relationship(
                    file_id,
                    import_id,
                    "imports",
                )

            # -------------------------------------------------
            # From imports
            # -------------------------------------------------

            for import_data in file_data.get(
                "from_imports",
                []
            ):

                module = import_data.get(
                    "module"
                )

                if not module:
                    continue

                module_id = (
                    f"module:{module}"
                )

                self.add_node(
                    node_id=module_id,
                    node_type="module",
                    name=module,
                )

                self.add_relationship(
                    file_id,
                    module_id,
                    "imports",
                )

            # -------------------------------------------------
            # Classes
            # -------------------------------------------------

            for class_data in file_data.get(
                "classes",
                []
            ):

                class_name = class_data.get(
                    "name"
                )

                if not class_name:
                    continue

                class_id = (
                    f"class:{file_path}:{class_name}"
                )

                self.add_node(
                    node_id=class_id,
                    node_type="class",
                    name=class_name,
                    file=file_path,
                    line=class_data.get(
                        "line"
                    ),
                )

                self.add_relationship(
                    file_id,
                    class_id,
                    "contains",
                )

                # ---------------------------------------------
                # Class methods
                # ---------------------------------------------

                for method in class_data.get(
                    "methods",
                    []
                ):

                    method_name = method.get(
                        "name"
                    )

                    if not method_name:
                        continue

                    method_id = (
                        f"method:{file_path}:"
                        f"{class_name}:"
                        f"{method_name}"
                    )

                    self.add_node(
                        node_id=method_id,
                        node_type="method",
                        name=method_name,
                        file=file_path,
                        class_name=class_name,
                        line=method.get(
                            "line"
                        ),
                    )

                    self.add_relationship(
                        class_id,
                        method_id,
                        "contains",
                    )

                    # -----------------------------------------
                    # Method calls
                    # -----------------------------------------

                    for call in method.get(
                        "calls",
                        []
                    ):

                        call_id = (
                            f"symbol:{call}"
                        )

                        self.add_node(
                            node_id=call_id,
                            node_type="symbol",
                            name=call,
                        )

                        self.add_relationship(
                            method_id,
                            call_id,
                            "calls",
                        )

            # -------------------------------------------------
            # Functions
            # -------------------------------------------------

            for function in file_data.get(
                "functions",
                []
            ):

                function_name = function.get(
                    "name"
                )

                if not function_name:
                    continue

                function_id = (
                    f"function:{file_path}:"
                    f"{function_name}"
                )

                self.add_node(
                    node_id=function_id,
                    node_type="function",
                    name=function_name,
                    file=file_path,
                    line=function.get(
                        "line"
                    ),
                )

                self.add_relationship(
                    file_id,
                    function_id,
                    "contains",
                )

                # -------------------------------------------------
                # Function calls
                # -------------------------------------------------

                for call in function.get(
                    "calls",
                    []
                ):

                    call_id = (
                        f"symbol:{call}"
                    )

                    self.add_node(
                        node_id=call_id,
                        node_type="symbol",
                        name=call,
                    )

                    self.add_relationship(
                        function_id,
                        call_id,
                        "calls",
                    )

        return self

    # ---------------------------------------------------------
    # Get graph summary
    # ---------------------------------------------------------

    def summary(self):

        node_types = {}

        for _, data in self.graph.nodes(
            data=True
        ):

            node_type = data.get(
                "type",
                "unknown"
            )

            node_types[node_type] = (
                node_types.get(
                    node_type,
                    0
                ) + 1
            )

        relationship_types = {}

        for _, _, data in self.graph.edges(
            data=True
        ):

            relationship = data.get(
                "relationship",
                "unknown"
            )

            relationship_types[
                relationship
            ] = (
                relationship_types.get(
                    relationship,
                    0
                ) + 1
            )

        return {

            "nodes": self.graph.number_of_nodes(),

            "edges": self.graph.number_of_edges(),

            "node_types": node_types,

            "relationship_types": (
                relationship_types
            ),

        }

    # ---------------------------------------------------------
    # Export graph
    # ---------------------------------------------------------

    def export(self):

        nodes = []

        for node_id, data in self.graph.nodes(
            data=True
        ):

            nodes.append(
                {
                    "id": node_id,
                    **data,
                }
            )

        edges = []

        for source, target, data in self.graph.edges(
            data=True
        ):

            edges.append(
                {
                    "source": source,
                    "target": target,
                    **data,
                }
            )

        return {
            "nodes": nodes,
            "edges": edges,
        }