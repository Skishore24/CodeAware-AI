from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.agents.impact_agent import ImpactAgent
from app.services.graph_service import GraphService

router = APIRouter(
    prefix="/impact",
    tags=["Impact Analysis & Blast Radius"],
)

graph_service = GraphService()
impact_agent = ImpactAgent(graph_service=graph_service)


class ImpactRequest(BaseModel):
    symbol: str
    repository_path: Optional[str] = None
    repository_name: Optional[str] = None


@router.post("/analyze")
@router.post("/overview")
def analyze_symbol_impact(request: ImpactRequest) -> Dict[str, Any]:
    try:
        res = impact_agent.run(request.model_dump())
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analyze")
@router.get("/overview")
def get_symbol_impact(
    symbol: str = Query(..., description="Target symbol/function/class to analyze"),
    repository_name: Optional[str] = Query(None, description="Repository name"),
    repository_path: Optional[str] = Query(None, description="Filesystem path of repository"),
) -> Dict[str, Any]:
    try:
        payload = {
            "symbol": symbol,
            "repository_name": repository_name,
            "repository_path": repository_path,
        }
        return impact_agent.run(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
