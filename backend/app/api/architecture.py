from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.agents.architecture_agent import ArchitectureAgent


router = APIRouter(
    prefix="/architecture",
    tags=["Architecture Analysis"]
)

arch_agent = ArchitectureAgent()


class ArchitectureRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None


@router.post("/analyze")
@router.post("/map")
@router.post("/overview")
def analyze_architecture(request: ArchitectureRequest) -> Dict[str, Any]:
    try:
        return arch_agent.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analyze")
@router.get("/map")
@router.get("/overview")
def get_architecture_analysis(
    repository_name: Optional[str] = Query(None, description="Repository name"),
    repository_path: Optional[str] = Query(None, description="Filesystem path of repository"),
) -> Dict[str, Any]:
    try:
        payload = {
            "repository_name": repository_name,
            "repository_path": repository_path,
        }
        return arch_agent.run(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
