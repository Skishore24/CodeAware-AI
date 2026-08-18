from pathlib import Path
from typing import Any, Dict, List, Optional
import ast

import networkx as nx


class CodeKnowledgeGraph:
    """
    Knowledge graph representing relationships
    between files, classes, functions and imports.

    Node types:

        repository
        file
        class
        function
        import

    Edge types:

        contains
        imports
        calls
    """

    def __init__(self):

        self.graph = nx.DiGraph()

    # =========================================================
    # RESET
    # =========================================================

    def clear(self):

        self.graph.clear()

    # =========================================================
    # BUILD
    # =========================================================

    def build(
        self,
        repository_path: str
    ) -> Dict[str, Any]:

        self.clear()

        repository = Path(
            repository_path
        )

        if not repository.exists():

            raise FileNotFoundError(
                f"Repository not found: "
                f"{repository_path}"
            )

        if not repository.is_dir():

            raise ValueError(
                "Repository path must "
                "be a directory."
            )

        repository_name = (
            repository.name
        )

        repository_id = (
            f"repository:{repository_name}"
        )

        self.graph.add_node(
            repository_id,
            type="repository",
            name=repository_name,
            path=str(repository)
        )

        python_files = list(
            repository.rglob("*.py")
        )

        ignored = {
            ".git",
            "venv",
            ".venv",
            "__pycache__",
            "node_modules",
            "dist",
            "build"
        }

        python_files = [
            file
            for file in python_files
            if not any(
                part in ignored
                for part in file.parts
            )
        ]

        for file in python_files:

            self._process_python_file(
                repository,
                repository_id,
                file
            )

        return self.summary()

    # =========================================================
    # PROCESS PYTHON FILE
    # =========================================================

    def _process_python_file(
        self,
        repository: Path,
        repository_id: str,
        file: Path
    ):

        relative_path = str(
            file.relative_to(
                repository
            )
        ).replace("\\", "/")

        file_id = (
            f"file:{relative_path}"
        )

        self.graph.add_node(
            file_id,
            type="file",
            name=file.name,
            path=relative_path
        )

        self.graph.add_edge(
            repository_id,
            file_id,
            type="contains"
        )

        try:

            source = file.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            tree = ast.parse(
                source
            )

        except Exception:

            return

        # -----------------------------------------------------
        # IMPORTS
        # -----------------------------------------------------

        for node in ast.walk(tree):

            if isinstance(
                node,
                ast.Import
            ):

                for alias in node.names:

                    self._add_import(
                        file_id,
                        alias.name
                    )

            elif isinstance(
                node,
                ast.ImportFrom
            ):

                module = (
                    node.module
                    or ""
                )

                self._add_import(
                    file_id,
                    module
                )

        # -----------------------------------------------------
        # CLASSES
        # -----------------------------------------------------

        for node in ast.walk(tree):

            if isinstance(
                node,
                ast.ClassDef
            ):

                self._add_class(
                    file_id,
                    node
                )

        # -----------------------------------------------------
        # FUNCTIONS
        # -----------------------------------------------------

        for node in ast.walk(tree):

            if isinstance(
                node,
                (
                    ast.FunctionDef,
                    ast.AsyncFunctionDef
                )
            ):

                self._add_function(
                    file_id,
                    node
                )

    # =========================================================
    # IMPORT
    # =========================================================

    def _add_import(
        self,
        file_id: str,
        import_name: str
    ):

        if not import_name:

            return

        import_id = (
            f"import:{import_name}"
        )

        if not self.graph.has_node(
            import_id
        ):

            self.graph.add_node(
                import_id,
                type="import",
                name=import_name
            )

        self.graph.add_edge(
            file_id,
            import_id,
            type="imports"
        )

    # =========================================================
    # CLASS
    # =========================================================

    def _add_class(
        self,
        file_id: str,
        node: ast.ClassDef
    ):

        class_id = (
            f"class:{file_id}:{node.name}"
        )

        self.graph.add_node(
            class_id,
            type="class",
            name=node.name,
            file=file_id,
            line=node.lineno
        )

        self.graph.add_edge(
            file_id,
            class_id,
            type="contains"
        )

    # =========================================================
    # FUNCTION
    # =========================================================

    def _add_function(
        self,
        file_id: str,
        node
    ):

        function_id = (
            f"function:"
            f"{file_id}:"
            f"{node.name}:"
            f"{node.lineno}"
        )

        self.graph.add_node(
            function_id,
            type="function",
            name=node.name,
            file=file_id,
            line=node.lineno
        )

        self.graph.add_edge(
            file_id,
            function_id,
            type="contains"
        )

        # -----------------------------------------------------
        # Detect function calls
        # -----------------------------------------------------

        for child in ast.walk(node):

            if not isinstance(
                child,
                ast.Call
            ):

                continue

            called_name = (
                self._get_call_name(
                    child
                )
            )

            if not called_name:
                continue

            target_id = (
                f"symbol:{called_name}"
            )

            if not self.graph.has_node(
                target_id
            ):

                self.graph.add_node(
                    target_id,
                    type="symbol",
                    name=called_name
                )

            self.graph.add_edge(
                function_id,
                target_id,
                type="calls"
            )

    # =========================================================
    # CALL NAME
    # =========================================================

    def _get_call_name(
        self,
        node: ast.Call
    ) -> Optional[str]:

        function = node.func

        if isinstance(
            function,
            ast.Name
        ):

            return function.id

        if isinstance(
            function,
            ast.Attribute
        ):

            parts = []

            current = function

            while isinstance(
                current,
                ast.Attribute
            ):

                parts.append(
                    current.attr
                )

                current = (
                    current.value
                )

            if isinstance(
                current,
                ast.Name
            ):

                parts.append(
                    current.id
                )

            return ".".join(
                reversed(parts)
            )

        return None

    # =========================================================
    # SUMMARY
    # =========================================================

    def summary(
        self
    ) -> Dict[str, Any]:

        type_counts = {}

        for _, data in (
            self.graph.nodes(
                data=True
            )
        ):

            node_type = data.get(
                "type",
                "unknown"
            )

            type_counts[
                node_type
            ] = (
                type_counts.get(
                    node_type,
                    0
                ) + 1
            )

        return {
            "nodes":
                self.graph.number_of_nodes(),

            "edges":
                self.graph.number_of_edges(),

            "node_types":
                type_counts
        }

    # =========================================================
    # EXPORT
    # =========================================================

    def export(
        self
    ) -> Dict[str, Any]:

        nodes = []

        for node_id, data in (
            self.graph.nodes(
                data=True
            )
        ):

            nodes.append({
                "id": node_id,
                **data
            })

        edges = []

        for source, target, data in (
            self.graph.edges(
                data=True
            )
        ):

            edges.append({
                "source": source,
                "target": target,
                **data
            })

        return {
            "nodes": nodes,
            "edges": edges
        }

    # =========================================================
    # FIND SYMBOL
    # =========================================================

    def find_symbol(
        self,
        name: str
    ) -> List[Dict[str, Any]]:

        matches = []

        for node_id, data in (
            self.graph.nodes(
                data=True
            )
        ):

            if (
                data.get("name", "")
                .lower()
                ==
                name.lower()
            ):

                matches.append({
                    "id": node_id,
                    **data
                })

        return matches