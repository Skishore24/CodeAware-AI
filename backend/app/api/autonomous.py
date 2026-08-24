from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.services.autonomous_workflow import AutonomousWorkflow
from app.db.database import SessionLocal
from app.db.models import AutonomousFixRecord
import datetime


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
        res = workflow.run(request.model_dump())
        
        # Persist generated patch to MySQL database
        if SessionLocal and res:
            try:
                repo_name = request.repository_name or (request.repository_path.split("/")[-1] if request.repository_path else "default")
                with SessionLocal() as db:
                    raw = res.get("raw_data", {})
                    fix_rec = AutonomousFixRecord(
                        repository_name=repo_name,
                        file_path=request.file_path,
                        problem_description=request.problem,
                        original_code=raw.get("original_code", ""),
                        patched_code=raw.get("patched_code", ""),
                        validation_status="Verified" if res.get("success") else "Failed",
                        is_applied=False,
                    )
                    db.add(fix_rec)
                    db.commit()
            except Exception:
                pass

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/approve")
def approve_fix(request: ApprovalRequest):
    try:
        data = request.model_dump()
        if not data.get("patched_code") and data.get("modified_code"):
            data["patched_code"] = data["modified_code"]
        res = workflow.approve_and_apply(data)

        # Mark applied in MySQL database
        if SessionLocal and res.get("success"):
            try:
                with SessionLocal() as db:
                    repo_name = request.repository_name or "default"
                    latest_fix = (
                        db.query(AutonomousFixRecord)
                        .filter(AutonomousFixRecord.file_path == request.file_path)
                        .order_by(AutonomousFixRecord.id.desc())
                        .first()
                    )
                    if latest_fix:
                        latest_fix.is_applied = True
                        latest_fix.applied_at = datetime.datetime.utcnow()
                        db.commit()
            except Exception:
                pass

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/create-pr")
def create_pull_request(request: PRRequest):
    try:
        return workflow.create_pull_request(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))