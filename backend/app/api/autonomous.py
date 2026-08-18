from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.services.autonomous_workflow import (
    AutonomousWorkflow
)


router = APIRouter(
    prefix="/autonomous",
    tags=["Autonomous Development"]
)


workflow = AutonomousWorkflow()


class AutonomousRequest(BaseModel):

    repository_path: str

    file_path: str

    problem: str

    function_name: Optional[str] = None

    original_code: Optional[str] = None

    max_retries: int = Field(
        default=2,
        ge=0,
        le=5
    )


class ApprovalRequest(BaseModel):

    repository_path: str

    file_path: str

    modified_code: str

    branch_name: str

    commit_message: str = (
        "CodeAware: apply validated fix"
    )

    approved: bool = False

    push: bool = False


class PRRequest(BaseModel):

    owner: str

    repo_name: str

    head_branch: str

    base_branch: str = "main"

    title: Optional[str] = None

    body: Optional[str] = None

    problem: Optional[str] = None

    validation_status: str = "Passed"

    approved: bool = False


# =========================================================
# START AUTONOMOUS WORKFLOW
# =========================================================

@router.post("/run")
def run_autonomous_workflow(
    request: AutonomousRequest
):

    return workflow.run(
        request.model_dump()
    )


# =========================================================
# APPROVE FIX
# =========================================================

@router.post("/approve")
def approve_fix(
    request: ApprovalRequest
):

    return workflow.approve(
        request.model_dump()
    )


# =========================================================
# CREATE PR
# =========================================================

@router.post("/create-pr")
def create_pull_request(
    request: PRRequest
):

    return workflow.create_pr(
        request.model_dump()
    )