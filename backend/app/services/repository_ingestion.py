from pathlib import Path
from typing import Any, Dict, Optional
import traceback
from app.analysis.repository_scanner import RepositoryScanner
from app.analysis.code_analyzer import CodeAnalyzer
from app.services.graph_service import GraphService
from app.services.rag_service import RAGService


class RepositoryIngestionService:
    """
    Complete production repository ingestion pipeline.

    Progression:
        QUEUED
          ↓
        SCANNING (Files, ignore rules, frameworks, entry points)
          ↓
        PARSING (AST analysis, symbol table, API routes, DB ops)
          ↓
        INDEXING (Semantic chunking, TF-IDF vectorization)
          ↓
        GRAPH_BUILDING (Knowledge graph nodes & edges, call-graphs)
          ↓
        READY
    """

    name = "Repository Ingestion Service"

    def __init__(
        self,
        repository_service=None,
        graph_service: Optional[GraphService] = None,
        rag_service: Optional[RAGService] = None,
    ):
        self.repository_service = repository_service
        self.graph_service = graph_service or GraphService()
        self.rag_service = rag_service or RAGService()

    def ingest(self, repository_path: str | Path) -> Dict[str, Any]:
        path = Path(repository_path).resolve()

        if not path.exists():
            return {
                "success": False,
                "status": "FAILED",
                "failed_step": "VALIDATION",
                "error": f"Repository path does not exist: {repository_path}"
            }

        if not path.is_dir():
            return {
                "success": False,
                "status": "FAILED",
                "failed_step": "VALIDATION",
                "error": "Repository path must be a directory."
            }

        result: Dict[str, Any] = {
            "success": True,
            "status": "PROCESSING",
            "repository_name": path.name,
            "repository_path": str(path),
            "steps": []
        }

        # Step 1: Repository Scan
        try:
            scanner = RepositoryScanner(path)
            scan_res = scanner.scan()
            result["scan"] = scan_res
            result["steps"].append({"name": "SCANNING", "status": "COMPLETED"})
        except Exception as exc:
            return self._failure(result, "SCANNING", exc)

        # Step 2: AST & Code Analysis
        try:
            analyzer = CodeAnalyzer(path)
            analysis_res = analyzer.analyze()
            result["analysis"] = {
                "total_functions": analysis_res.get("total_functions", 0),
                "total_classes": analysis_res.get("total_classes", 0),
                "total_symbols": analysis_res.get("total_symbols", 0),
                "api_endpoints_count": analysis_res.get("api_endpoints_count", 0),
                "api_endpoints": analysis_res.get("api_endpoints", []),
            }
            result["steps"].append({"name": "PARSING", "status": "COMPLETED"})
        except Exception as exc:
            return self._failure(result, "PARSING", exc)

        # Step 3: Semantic Chunking & Search Index
        try:
            rag_res = self.rag_service.index_repository(str(path))
            result["search_index"] = rag_res
            result["steps"].append({"name": "INDEXING", "status": "COMPLETED"})
        except Exception as exc:
            return self._failure(result, "INDEXING", exc)

        # Step 4: Knowledge Graph Building
        try:
            graph_res = self.graph_service.build(str(path))
            result["graph"] = graph_res
            result["steps"].append({"name": "GRAPH_BUILDING", "status": "COMPLETED"})
        except Exception as exc:
            return self._failure(result, "GRAPH_BUILDING", exc)

        # Final Status
        result["status"] = "READY"
        result["message"] = f"Repository '{path.name}' ingested and ready for code intelligence."
        return result

    def _failure(self, result: Dict[str, Any], step: str, exception: Exception) -> Dict[str, Any]:
        result["success"] = False
        result["status"] = "FAILED"
        result["failed_step"] = step
        result["error"] = str(exception)
        result["traceback"] = traceback.format_exc()
        return result