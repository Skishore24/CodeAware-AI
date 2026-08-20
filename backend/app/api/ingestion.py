from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.repository_ingestion import RepositoryIngestionService
from app.services.graph_service import GraphService
from app.services.rag_service import RAGService
from app.services.repository_service import RepositoryService


router = APIRouter(
    prefix="/ingestion",
    tags=["Repository Ingestion"]
)

graph_service = GraphService()
rag_service = RAGService()
repository_service = RepositoryService(CLONED_REPOSITORIES_DIR)
ingestion_service = RepositoryIngestionService(
    repository_service=repository_service,
    graph_service=graph_service,
    rag_service=rag_service,
)


class IngestionRequest(BaseModel):
    repository_path: Optional[str] = None
    repository_name: Optional[str] = None


@router.post("/run")
def run_ingestion(request: IngestionRequest):
    ref = request.repository_path or request.repository_name
    if not ref:
        raise HTTPException(status_code=400, detail="repository_path or repository_name is required.")

    p = Path(ref)
    if not p.is_absolute() or not p.exists():
        candidate = Path(CLONED_REPOSITORIES_DIR) / ref
        if candidate.exists():
            p = candidate

    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Repository path not found: {ref}")

    return ingestion_service.ingest(str(p))