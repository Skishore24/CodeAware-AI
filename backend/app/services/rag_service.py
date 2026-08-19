from typing import Any, Dict, List, Optional
from pathlib import Path
from app.rag.chunker import CodeChunker
from app.rag.retriever import HybridRetriever


class RAGService:
    """
    Repository-aware RAG service.
    Manages indexing, chunk extraction, and hybrid multi-factor retrieval.
    """

    def __init__(self):
        self.chunker = CodeChunker()
        self.retrievers: Dict[str, HybridRetriever] = {}
        self.repositories: Dict[str, Dict[str, Any]] = {}

    def index_repository(
        self,
        repository_path: str,
        chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        p = Path(repository_path)
        if not p.exists():
            return {
                "status": "failed",
                "repository_path": repository_path,
                "error": f"Path not found: {repository_path}"
            }

        if chunks is None:
            chunks = self.chunker.chunk_repository(p)

        self.repositories[str(p)] = {"chunks": chunks}
        try:
            self.retrievers[str(p)] = HybridRetriever(chunks)
            return {
                "status": "ready",
                "repository_path": str(p),
                "chunk_count": len(chunks),
                "retriever_status": "ready"
            }
        except Exception as exc:
            return {
                "status": "partial",
                "repository_path": str(p),
                "chunk_count": len(chunks),
                "retriever_status": "failed",
                "error": str(exc)
            }

    def search(
        self,
        repository_path: str,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        if not query.strip():
            return {"results": [], "chunks": [], "context": ""}

        p_str = str(Path(repository_path))
        if p_str not in self.retrievers:
            self.index_repository(p_str)

        retriever = self.retrievers.get(p_str)
        if not retriever:
            return {"results": [], "chunks": [], "context": ""}

        results = retriever.retrieve(query=query, top_k=top_k, filters=filters)
        context = self._build_context(results)

        return {
            "results": results,
            "chunks": results,
            "context": context,
            "count": len(results)
        }

    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        context_parts = []
        for c in chunks:
            file_name = c.get("file", "unknown")
            start = c.get("start_line", 1)
            end = c.get("end_line", start)
            code = c.get("raw_code", c.get("content", ""))
            symbol = c.get("symbol", "")

            header = f"FILE: {file_name} (Lines {start}-{end})" + (f" [Symbol: {symbol}]" if symbol else "")
            context_parts.append(f"{header}\n{code}\n")

        return "\n---\n".join(context_parts)