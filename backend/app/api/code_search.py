from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_service import RAGService


router = APIRouter(
    prefix="/code-search",
    tags=["Code Search"]
)


rag_service = RAGService()


class CodeSearchRequest(BaseModel):
    repository_path: str
    query: str
    top_k: int = 10


class SearchResult(BaseModel):
    file: str
    content: str
    score: float = 0.0
    start_line: int | None = None
    end_line: int | None = None


@router.post("/search")
def search_code(
    request: CodeSearchRequest
) -> Dict[str, Any]:

    if not request.query.strip():
        return {
            "success": False,
            "error": "Search query cannot be empty."
        }

    if request.top_k < 1:
        return {
            "success": False,
            "error": "top_k must be at least 1."
        }

    try:

        # -------------------------------------------------
        # Try the existing RAG service
        # -------------------------------------------------

        search_method = getattr(
            rag_service,
            "search",
            None
        )

        if search_method is None:

            search_method = getattr(
                rag_service,
                "retrieve",
                None
            )

        if search_method is None:

            return {
                "success": False,
                "error": (
                    "RAGService does not currently "
                    "have a search/retrieve method."
                )
            }

        results = search_method(
            repository_path=request.repository_path,
            query=request.query,
            top_k=request.top_k
        )

        # -------------------------------------------------
        # Normalize result
        # -------------------------------------------------

        normalized: List[Dict[str, Any]] = []

        if results is None:
            results = []

        for item in results:

            if isinstance(item, dict):

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
                        item.get("score", 0.0)
                    ),

                    "start_line": item.get(
                        "start_line"
                    ),

                    "end_line": item.get(
                        "end_line"
                    )
                })

            else:

                normalized.append({
                    "file": "Unknown",
                    "content": str(item),
                    "score": 0.0,
                    "start_line": None,
                    "end_line": None
                })

        return {
            "success": True,
            "query": request.query,
            "count": len(normalized),
            "results": normalized[
                :request.top_k
            ]
        }

    except Exception as exc:

        return {
            "success": False,
            "error": str(exc)
        }