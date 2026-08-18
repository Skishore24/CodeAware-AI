from typing import Any, Dict, List

from app.rag.chunker import CodeChunker
from app.rag.retriever import HybridRetriever


class RAGService:
    """
    Repository-aware RAG service.

    Responsibilities:

    1. Prepare repository chunks
    2. Build retrieval indexes
    3. Search repository code
    4. Combine retrieval results
    """

    def __init__(self):
        self.chunker = CodeChunker()
        self.retriever = HybridRetriever([])

        self.repositories: Dict[
            str,
            Dict[str, Any]
        ] = {}

    # =========================================================
    # INDEX REPOSITORY
    # =========================================================

    def index_repository(
        self,
        repository_path: str,
        chunks: List[Dict[str, Any]] | None = None
    ) -> Dict[str, Any]:

        if chunks is None:
            chunks = self.chunker.chunk_repository(
                repository_path
            )

        self.repositories[
            repository_path
        ] = {
            "chunks": chunks
        }

        try:
            self.retriever = HybridRetriever(chunks)
        except Exception as exc:

            return {
                "status": "partial",
                "repository_path":
                    repository_path,
                "chunk_count":
                    len(chunks),
                "retriever_status":
                    "failed",
                "error": str(exc)
            }

        return {
            "status": "ready",
            "repository_path":
                repository_path,
            "chunk_count":
                len(chunks),
            "retriever_status":
                "ready"
        }

    # =========================================================
    # SEARCH
    # =========================================================

    def search(
        self,
        repository_path: str,
        query: str,
        top_k: int = 10
    ) -> Dict[str, Any]:
        """Search and return a dict with 'results' and 'context' keys."""

        if not query.strip():
            return {"results": [], "context": ""}

        repository = (
            self.repositories.get(
                repository_path
            )
        )

        # -----------------------------------------------------
        # If repository wasn't indexed in this process,
        # build the index now.
        # -----------------------------------------------------

        if repository is None:

            self.index_repository(
                repository_path
            )

            repository = (
                self.repositories.get(
                    repository_path
                )
            )

        if not repository:
            return {"results": [], "context": ""}

        chunks = repository.get(
            "chunks",
            []
        )

        # -----------------------------------------------------
        # Use existing HybridRetriever
        # -----------------------------------------------------

        try:

            search_method = getattr(
                self.retriever,
                "search",
                None
            )

            if search_method:

                results = search_method(
                    query=query,
                    top_k=top_k
                )

                results = self._normalize_results(results, top_k)
                context = self._build_context(results)
                return {"results": results, "context": context}

        except TypeError:

            # Some implementations may use
            # positional arguments.

            try:

                results = (
                    self.retriever.search(
                        query,
                        top_k
                    )
                )

                results = self._normalize_results(results, top_k)
                context = self._build_context(results)
                return {"results": results, "context": context}

            except Exception:
                pass

        except Exception:
            pass

        # -----------------------------------------------------
        # Fallback keyword retrieval
        # -----------------------------------------------------

        results = self._keyword_fallback(chunks, query, top_k)
        context = self._build_context(results)
        return {"results": results, "context": context}

    # =========================================================
    # BUILD CONTEXT STRING
    # =========================================================

    def _build_context(
        self,
        results: List[Dict[str, Any]],
        max_chars: int = 8000,
    ) -> str:
        """Join result snippets into a single context string for the reasoner."""
        parts = []
        total = 0
        for r in results:
            file_name = r.get("file", "unknown")
            content   = r.get("content", "")
            snippet = f"# {file_name}\n{content}\n"
            if total + len(snippet) > max_chars:
                break
            parts.append(snippet)
            total += len(snippet)
        return "\n".join(parts)

    # =========================================================
    # NORMALIZE RESULTS
    # =========================================================

    def _normalize_results(
        self,
        results,
        top_k: int
    ) -> List[Dict[str, Any]]:

        if not results:
            return []

        normalized = []

        for item in results:

            if isinstance(
                item,
                dict
            ):

                normalized.append({
                    "file": (
                        item.get("file")
                        or item.get("path")
                        or item.get("file_path")
                        or "Unknown"
                    ),

                    "content": (
                        item.get("content")
                        or item.get("text")
                        or ""
                    ),

                    "score": float(
                        item.get(
                            "score",
                            0.0
                        )
                    ),

                    "start_line":
                        item.get(
                            "start_line"
                        ),

                    "end_line":
                        item.get(
                            "end_line"
                        ),

                    "source":
                        item.get(
                            "source",
                            "hybrid"
                        )
                })

            else:

                normalized.append({
                    "file": "Unknown",
                    "content": str(item),
                    "score": 0.0,
                    "source": "hybrid"
                })

        normalized.sort(
            key=lambda item:
                item.get(
                    "score",
                    0.0
                ),
            reverse=True
        )

        return normalized[:top_k]

    # =========================================================
    # KEYWORD FALLBACK
    # =========================================================

    def _keyword_fallback(
        self,
        chunks: List[Dict[str, Any]],
        query: str,
        top_k: int
    ) -> List[Dict[str, Any]]:

        query_words = {
            word.lower()
            for word in query.split()
            if len(word) > 2
        }

        scored = []

        for chunk in chunks:

            content = (
                chunk.get(
                    "content",
                    ""
                )
            )

            file_name = (
                chunk.get(
                    "file",
                    ""
                )
            )

            searchable = (
                f"{file_name} "
                f"{content}"
            ).lower()

            score = 0

            for word in query_words:

                if word in searchable:
                    score += 1

                # File path matches are more useful.
                if word in file_name.lower():
                    score += 2

            if score > 0:

                scored.append({
                    "file":
                        file_name,

                    "content":
                        content,

                    "score":
                        float(score),

                    "start_line":
                        chunk.get(
                            "start_line"
                        ),

                    "end_line":
                        chunk.get(
                            "end_line"
                        ),

                    "source":
                        "keyword"
                })

        scored.sort(
            key=lambda item:
                item["score"],
            reverse=True
        )

        return scored[:top_k]   