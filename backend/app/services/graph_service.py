from typing import Any, Dict, List, Optional
from pathlib import Path
from app.graph.code_knowledge_graph import CodeKnowledgeGraph
from app.graph.impact_analyzer import ImpactAnalyzer


class GraphService:
    """
    Central service for managing repository knowledge graphs, topological exports,
    symbol lookup, and blast radius analysis.
    """

    def __init__(self):
        self.graphs: Dict[str, CodeKnowledgeGraph] = {}

    def _get_graph(self, repository_path: str) -> CodeKnowledgeGraph:
        p_str = str(Path(repository_path).resolve())
        if p_str not in self.graphs:
            graph = CodeKnowledgeGraph()
            graph.build(p_str)
            self.graphs[p_str] = graph
        return self.graphs[p_str]

    def build(self, repository_path: str) -> Dict[str, Any]:
        p_str = str(Path(repository_path).resolve())
        graph = CodeKnowledgeGraph()
        result = graph.build(p_str)
        self.graphs[p_str] = graph
        return {
            "status": "ready",
            "repository_path": p_str,
            **result
        }

    def summary(self, repository_path: str) -> Dict[str, Any]:
        graph = self._get_graph(repository_path)
        return graph.summary()

    def export(self, repository_path: str) -> Dict[str, Any]:
        graph = self._get_graph(repository_path)
        return graph.export()

    def impact(self, repository_path: str, symbol: str, depth: int = 3) -> Dict[str, Any]:
        graph = self._get_graph(repository_path)
        analyzer = ImpactAnalyzer(graph)
        return analyzer.analyze(symbol=symbol, depth=depth)

    def find_symbol(self, repository_path: str, symbol: str) -> List[Dict[str, Any]]:
        graph = self._get_graph(repository_path)
        return graph.find_symbol(symbol)