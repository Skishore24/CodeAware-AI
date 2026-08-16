from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import (
    CLONED_REPOSITORIES_DIR
)

from app.services.rag_service import (
    RAGService
)


router = APIRouter(
    prefix="/rag",
    tags=["Code RAG"],
)


class RAGRequest(BaseModel):

    repository_name: str

    query: str

    top_k: int = 8


@router.post("/search")
def search_repository(
    request: RAGRequest
):

    repository_path = (
        Path(CLONED_REPOSITORIES_DIR)
        / request.repository_name
    )

    if not repository_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Repository not found."
        )

    try:

        service = RAGService(
            repository_path
        )

        result = service.search(
            query=request.query,
            top_k=request.top_k
        )

        return {

            "success": True,

            "result": result,

        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )