from typing import Any, Dict, List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.rag_service import RAGService


router = APIRouter(
    prefix="/code-search",
    tags=["Code Search"]
)

rag_service = RAGService()


class CodeSearchRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    query: str
    top_k: int = 10
    language: Optional[str] = None
    file_path: Optional[str] = None
    symbol: Optional[str] = None


@router.post("/search")
def search_code(request: CodeSearchRequest) -> Dict[str, Any]:
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    repo_ref = request.repository_path or request.repository_name
    if not repo_ref:
        raise HTTPException(status_code=400, detail="repository_name or repository_path is required.")

    p = Path(repo_ref)
    if not p.is_absolute() or not p.exists():
        candidate = Path(CLONED_REPOSITORIES_DIR) / repo_ref
        if candidate.exists():
            p = candidate
        elif not p.exists():
            raise HTTPException(status_code=404, detail=f"Repository not found at: {repo_ref}")

    filters = {}
    if request.language:
        filters["language"] = request.language
    if request.file_path:
        filters["file_path"] = request.file_path

    try:
        search_res = rag_service.search(
            repository_path=str(p),
            query=request.query,
            top_k=request.top_k,
            filters=filters
        )

        results = search_res.get("results", [])
        formatted = []
        for r in results:
            file_name = r.get("file", "unknown")
            start = r.get("start_line", 1)
            end = r.get("end_line", start)
            score = round(float(r.get("score", 0.0)), 3)
            sym = r.get("symbol", "")

            formatted.append({
                "file": file_name,
                "symbol": sym,
                "start_line": start,
                "end_line": end,
                "score": score,
                "language": r.get("language", ""),
                "why_matched": f"Matched terms with relevance score {score}" + (f" in symbol '{sym}'" if sym else ""),
                "content": r.get("raw_code", r.get("content", ""))
            })

        return {
            "success": True,
            "query": request.query,
            "count": len(formatted),
            "results": formatted
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))