from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.orchestrator import (
    CodeAwareOrchestrator
)
from app.db.database import SessionLocal
from app.db.models import ChatMessage


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

    res = orchestrator.run(
        task=request.task,
        input_data=request.input_data,
    )

    if SessionLocal:
        try:
            repo_name = request.input_data.get("repository_name") or "default"
            with SessionLocal() as db:
                user_msg = ChatMessage(
                    repository_name=repo_name,
                    role="user",
                    message_text=request.task,
                )
                db.add(user_msg)

                assistant_text = res.get("summary") if isinstance(res, dict) else str(res)
                assistant_msg = ChatMessage(
                    repository_name=repo_name,
                    role="assistant",
                    message_text=assistant_text or "Analysis completed.",
                    structured_data_json=res if isinstance(res, dict) else None,
                )
                db.add(assistant_msg)
                db.commit()
        except Exception:
            pass

    return res