from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import (
    CLONED_REPOSITORIES_DIR
)

from app.services.graph_service import (
    GraphService
)


router = APIRouter(
    prefix="/graph",
    tags=["Code Graph"],
)


class GraphRequest(BaseModel):

    repository_name: str


class ImpactRequest(BaseModel):

    repository_name: str

    symbol_name: str


# ---------------------------------------------------------
# Graph summary
# ---------------------------------------------------------

@router.post("/summary")
def graph_summary(
    request: GraphRequest
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

    service = GraphService(
        repository_path
    )

    return {

        "success": True,

        "graph": service.get_summary(),

    }


# ---------------------------------------------------------
# Full graph
# ---------------------------------------------------------

@router.post("/build")
def build_graph(
    request: GraphRequest
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

    service = GraphService(
        repository_path
    )

    return {

        "success": True,

        "graph": service.get_graph(),

    }


# ---------------------------------------------------------
# Impact analysis
# ---------------------------------------------------------

@router.post("/impact")
def impact_analysis(
    request: ImpactRequest
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

    service = GraphService(
        repository_path
    )

    return service.get_impact(
        request.symbol_name
    )