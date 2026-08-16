from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.orchestrator import (
    CodeAwareOrchestrator
)


router = APIRouter(
    prefix="/agents",
    tags=["Agents"],
)


orchestrator = CodeAwareOrchestrator()


class AgentRequest(BaseModel):

    task: str

    input_data: Dict[str, Any]


@router.post("/run")
def run_agent(
    request: AgentRequest
):

    return orchestrator.run(

        task=request.task,

        input_data=request.input_data,

    )