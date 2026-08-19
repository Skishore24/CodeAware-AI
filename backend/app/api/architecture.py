from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
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
def analyze_architecture(request: ArchitectureRequest) -> Dict[str, Any]:
    try:
        return arch_agent.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
