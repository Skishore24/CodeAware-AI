from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.rag_service import RAGService

router = APIRouter(
    prefix="/rag",
    tags=["Code RAG"],
)

rag_service = RAGService()


class RAGSearchRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    query: str
    top_k: int = 8


class RAGAskRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    question: str
    top_k: int = 8


def _resolve_repo_path(repo_name: Optional[str], repo_path: Optional[str]) -> Path:
    ref = repo_path or repo_name
    if not ref:
        raise HTTPException(status_code=400, detail="repository_name or repository_path is required.")
    p = Path(ref)
    if p.is_absolute() and p.exists():
        return p
    candidate = Path(CLONED_REPOSITORIES_DIR) / ref
    if candidate.exists():
        return candidate
    if p.exists():
        return p
    raise HTTPException(status_code=404, detail=f"Repository not found: {ref}")


@router.post("/search")
def search_repository(request: RAGSearchRequest):
    repo_path = _resolve_repo_path(request.repository_name, request.repository_path)
    try:
        result = rag_service.search(
            repository_path=str(repo_path),
            query=request.query,
            top_k=request.top_k
        )
        return {
            "success": True,
            "result": result,
            "chunks": result.get("chunks", []),
            "context": result.get("context", ""),
            "count": result.get("count", 0),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ask")
def ask_repository(request: RAGAskRequest):
    repo_path = _resolve_repo_path(request.repository_name, request.repository_path)
    try:
        return rag_service.ask(
            repository_path=str(repo_path),
            question=request.question,
            top_k=request.top_k
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))