from fastapi import APIRouter
from pydantic import BaseModel

from app.services.repository_ingestion import (
    RepositoryIngestionService
)


router = APIRouter(
    prefix="/ingestion",
    tags=["Repository Ingestion"]
)


ingestion_service = (
    RepositoryIngestionService()
)


class IngestionRequest(BaseModel):

    repository_path: str


@router.post("/run")
def run_ingestion(
    request: IngestionRequest
):

    return ingestion_service.ingest(
        request.repository_path
    )