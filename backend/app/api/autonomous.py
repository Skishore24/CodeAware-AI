from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.services.autonomous_workflow import AutonomousWorkflow


router = APIRouter(
    prefix="/autonomous",
    tags=["Autonomous Development"]
)

workflow = AutonomousWorkflow()


class AutonomousRequest(BaseModel):
    repository_path: Optional[str] = None
    repository_name: Optional[str] = None
    file_path: str
    problem: str
    function_name: Optional[str] = None
    original_code: Optional[str] = None
    max_retries: int = Field(default=2, ge=0, le=5)


class ApprovalRequest(BaseModel):
    repository_path: Optional[str] = None
    repository_name: Optional[str] = None
    file_path: str
    patched_code: Optional[str] = None
    modified_code: Optional[str] = None
    branch_name: Optional[str] = "main"
    commit_message: str = "CodeAware: apply validated fix"
    approved: bool = True


class PRRequest(BaseModel):
    owner: str
    repo_name: str
    head_branch: str
    base_branch: str = "main"
    title: Optional[str] = None
    body: Optional[str] = None
    approved: bool = True
    github_token: Optional[str] = None


@router.post("/run")
def run_autonomous_workflow(request: AutonomousRequest):
    try:
        return workflow.run(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/approve")
def approve_fix(request: ApprovalRequest):
    try:
        data = request.model_dump()
        if not data.get("patched_code") and data.get("modified_code"):
            data["patched_code"] = data["modified_code"]
        return workflow.approve_and_apply(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/create-pr")
def create_pull_request(request: PRRequest):
    try:
        return workflow.create_pull_request(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))