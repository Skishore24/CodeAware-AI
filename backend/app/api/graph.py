from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.graph_service import GraphService


router = APIRouter(
    prefix="/graph",
    tags=["Code Graph"],
)


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

class GraphRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None


class ImpactRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    symbol_name: str


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _resolve_path(repo_name: Optional[str], repo_path: Optional[str]) -> str:
    """Resolve a repository name or path to a string path."""
    ref = repo_path or repo_name
    if not ref:
        raise HTTPException(
            status_code=400,
            detail="repository_name or repository_path is required.",
        )

    p = Path(ref)

    # Absolute path that exists — use it directly
    if p.is_absolute() and p.exists():
        return str(p)

    # Try looking it up under the cloned repos directory
    candidate = Path(CLONED_REPOSITORIES_DIR) / ref
    if candidate.exists():
        return str(candidate)

    # Relative path that happens to exist
    if p.exists():
        return str(p)

    raise HTTPException(
        status_code=404,
        detail=f"Repository not found: {ref}",
    )


def _make_service() -> GraphService:
    """Create a fresh GraphService instance (no constructor args)."""
    return GraphService()


# ---------------------------------------------------------
# /graph/summary
# ---------------------------------------------------------

@router.post("/summary")
def graph_summary(request: GraphRequest):
    repo_path = _resolve_path(request.repository_name, request.repository_path)
    service   = _make_service()
    try:
        data = service.summary(repo_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"success": True, "graph": data}


# ---------------------------------------------------------
# /graph/build  (builds and then exports the full graph)
# ---------------------------------------------------------

@router.post("/build")
def build_graph(request: GraphRequest):
    repo_path = _resolve_path(request.repository_name, request.repository_path)
    service   = _make_service()
    try:
        service.build(repo_path)
        data = service.export(repo_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"success": True, "graph": data}


# ---------------------------------------------------------
# /graph/impact
# ---------------------------------------------------------

@router.post("/impact")
def impact_analysis(request: ImpactRequest):
    repo_path = _resolve_path(request.repository_name, request.repository_path)
    service   = _make_service()
    try:
        data = service.impact(repo_path, request.symbol_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"success": True, **data}