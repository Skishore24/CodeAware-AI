from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.deep_agent.agent import DeepAgent
from app.db.database import get_db
from app.models.entities import AgentRun
import datetime

router = APIRouter(
    prefix="/deep-agent",
    tags=["DeepAgent Long-Horizon Execution"],
)

deep_agent_runner = DeepAgent()


class DeepAgentRequest(BaseModel):
    goal: str = Field(..., description="High-level engineering task or bug repair goal")
    repository_path: Optional[str] = None
    repository_name: Optional[str] = None
    max_iterations: int = Field(default=5, ge=1, le=15)
    timeout_seconds: int = Field(default=120, ge=10, le=600)


@router.post("/run")
def run_deep_agent(
    request: DeepAgentRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Execute a long-horizon autonomous engineering loop with tool budget,
    isolated sandbox testing, and plan revision.
    """
    try:
        # Create database record
        agent_run = AgentRun(
            agent_type="DeepAgent",
            task_goal=request.goal,
            status="RUNNING",
        )
        db.add(agent_run)
        db.commit()
        db.refresh(agent_run)

        result = deep_agent_runner.run(
            goal=request.goal,
            repository_path=request.repository_path,
            max_iterations=request.max_iterations,
            timeout_seconds=request.timeout_seconds,
        )

        # Update run in database
        agent_run.status = result.get("status", "COMPLETED")
        agent_run.duration_seconds = result.get("duration_sec", 0.0)
        agent_run.iterations_count = result.get("iterations", 1)
        agent_run.result_summary = result.get("final_report")
        agent_run.result_json = result
        db.commit()

        return {
            "success": result.get("success", False),
            "status": agent_run.status,
            "run_id": agent_run.id,
            "result": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status/{run_id}")
def get_deep_agent_status(run_id: int, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found.")
    return {
        "success": True,
        "status": run.status,
        "run_id": run.id,
        "run": {
            "id": run.id,
            "goal": run.task_goal,
            "status": run.status,
            "iterations": run.iterations_count,
            "duration": run.duration_seconds,
            "summary": run.result_summary,
            "created_at": run.created_at.isoformat() if run.created_at else None,
        }
    }
