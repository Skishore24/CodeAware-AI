from pathlib import Path
from typing import Any, Dict

from app.analysis.code_analyzer import CodeAnalyzer
from app.graph.code_graph import CodeKnowledgeGraph
from app.graph.impact_analysis import ImpactAnalyzer


class GraphService:

    def __init__(
        self,
        repository_path: Path
    ):

        self.repository_path = Path(
            repository_path
        )

    # ---------------------------------------------------------
    # Build graph
    # ---------------------------------------------------------

    def build_graph(self):

        analyzer = CodeAnalyzer(
            self.repository_path
        )

        analysis = analyzer.analyze()

        graph = CodeKnowledgeGraph()

        graph.build_from_analysis(
            analysis
        )

        return graph

    # ---------------------------------------------------------
    # Graph summary
    # ---------------------------------------------------------

    def get_summary(self):

        graph = self.build_graph()

        return graph.summary()

    # ---------------------------------------------------------
    # Full graph
    # ---------------------------------------------------------

    def get_graph(self):

        graph = self.build_graph()

        return graph.export()

    # ---------------------------------------------------------
    # Impact analysis
    # ---------------------------------------------------------

    def get_impact(
        self,
        symbol_name: str
    ) -> Dict[str, Any]:

        graph = self.build_graph()

        analyzer = ImpactAnalyzer(
            graph.graph
        )

        return analyzer.find_impact(
            symbol_name
        )