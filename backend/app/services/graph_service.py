from typing import Any, Dict

from app.graph.code_knowledge_graph import (
    CodeKnowledgeGraph
)

from app.graph.impact_analyzer import (
    ImpactAnalyzer
)


class GraphService:

    def __init__(self):

        self.graphs = {}

    # =========================================================
    # GET GRAPH
    # =========================================================

    def _get_graph(
        self,
        repository_path: str
    ):

        if repository_path not in (
            self.graphs
        ):

            graph = (
                CodeKnowledgeGraph()
            )

            graph.build(
                repository_path
            )

            self.graphs[
                repository_path
            ] = graph

        return self.graphs[
            repository_path
        ]

    # =========================================================
    # BUILD
    # =========================================================

    def build(
        self,
        repository_path: str
    ) -> Dict[str, Any]:

        graph = (
            CodeKnowledgeGraph()
        )

        result = graph.build(
            repository_path
        )

        self.graphs[
            repository_path
        ] = graph

        return {
            "status": "ready",
            "repository_path":
                repository_path,
            **result
        }

    # =========================================================
    # SUMMARY
    # =========================================================

    def summary(
        self,
        repository_path: str
    ) -> Dict[str, Any]:

        graph = self._get_graph(
            repository_path
        )

        return graph.summary()

    # =========================================================
    # EXPORT
    # =========================================================

    def export(
        self,
        repository_path: str
    ) -> Dict[str, Any]:

        graph = self._get_graph(
            repository_path
        )

        return graph.export()

    # =========================================================
    # IMPACT
    # =========================================================

    def impact(
        self,
        repository_path: str,
        symbol: str,
        depth: int = 3
    ) -> Dict[str, Any]:

        graph = self._get_graph(
            repository_path
        )

        analyzer = (
            ImpactAnalyzer(
                graph
            )
        )

        return analyzer.analyze(
            symbol=symbol,
            depth=depth
        )