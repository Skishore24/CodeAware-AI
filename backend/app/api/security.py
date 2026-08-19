from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.security_agent import SecurityAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


router = APIRouter(
    prefix="/security",
    tags=["Security Analysis"]
)

security_agent = SecurityAgent()


class SecurityScanRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    code: Optional[str] = None


@router.post("/scan")
def run_security_scan(request: SecurityScanRequest) -> Dict[str, Any]:
    try:
        return security_agent.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
