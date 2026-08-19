from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.test_agent import TestAgent


router = APIRouter(
    prefix="/tests",
    tags=["Test Generation"]
)

test_agent = TestAgent()


class TestGenRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    function_name: Optional[str] = None
    code: Optional[str] = None


@router.post("/generate")
def generate_tests(request: TestGenRequest) -> Dict[str, Any]:
    try:
        return test_agent.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
