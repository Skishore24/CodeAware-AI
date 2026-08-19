from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.code_review_agent import CodeReviewAgent


router = APIRouter(
    prefix="/review",
    tags=["Code Review"]
)

review_agent = CodeReviewAgent()


class CodeReviewRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    code: Optional[str] = None


@router.post("/code")
def review_code(request: CodeReviewRequest) -> Dict[str, Any]:
    try:
        return review_agent.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
