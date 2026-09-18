import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.entities import ChatSession, ChatMessage
from app.llm.router import llm_router
from app.services.rag_service import RAGService

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat & Sessions"],
)

rag_service = RAGService()


class ChatSendMessageRequest(BaseModel):
    session_id: Optional[int] = None
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    message: str
    user_email: Optional[str] = "alex.morgan@codeaware.ai"
    stream: bool = False


class CreateSessionRequest(BaseModel):
    repository_name: Optional[str] = None
    title: Optional[str] = "New Chat Session"
    user_id: Optional[int] = None


@router.get("/sessions")
def list_chat_sessions(
    repository_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ChatSession)
    if repository_name:
        query = query.filter(ChatSession.repository_name == repository_name)
    sessions = query.order_by(ChatSession.updated_at.desc()).limit(20).all()
    return {
        "success": True,
        "count": len(sessions),
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "repository_name": s.repository_name,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in sessions
        ],
    }


@router.post("/sessions")
def create_session(request: CreateSessionRequest, db: Session = Depends(get_db)):
    sess = ChatSession(
        repository_name=request.repository_name,
        title=request.title or "New Chat",
        user_id=request.user_id,
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"success": True, "session": {"id": sess.id, "title": sess.title}}


@router.get("/history/{session_id}")
def get_session_history(session_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "success": True,
        "session_id": session_id,
        "count": len(messages),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.message_text,
                "data": m.structured_data_json,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.post("/send")
def send_chat_message(request: ChatSendMessageRequest, db: Session = Depends(get_db)):
    """
    Send a message in an AI chat session. Automatically retrieves relevant RAG code chunks
    and invokes local Ollama with citations.
    """
    repo_name = request.repository_name or "default"

    # Retrieve context via RAG
    rag_chunks = []
    context_str = ""
    try:
        rag_chunks = rag_service.query(query=request.message, repository_path=request.repository_path, top_k=4)
        if rag_chunks:
            context_str = "\n\n".join([f"FILE: {c.get('file')} (Lines {c.get('start_line')}-{c.get('end_line')}):\n{c.get('raw_code', '')}" for c in rag_chunks])
    except Exception:
        pass

    # Record user message in DB
    user_msg = ChatMessage(
        session_id=request.session_id,
        repository_name=repo_name,
        user_email=request.user_email,
        role="user",
        message_text=request.message,
    )
    db.add(user_msg)
    db.commit()

    # Generate response with Ollama LLM router
    system_prompt = (
        "You are CodeAware AI, a repository-aware coding assistant. "
        "Answer the user query accurately based on the provided repository context. "
        "Cite exact source file paths and functions."
    )
    llm_resp = llm_router.generate(
        prompt=request.message,
        system=system_prompt,
        context=context_str,
        task_type="reasoning",
    )

    assistant_content = llm_resp.content if (llm_resp and llm_resp.content) else "Analysis complete."

    # Record assistant message in DB
    asst_msg = ChatMessage(
        session_id=request.session_id,
        repository_name=repo_name,
        role="assistant",
        message_text=assistant_content,
        structured_data_json={"citations": [c.get("file") for c in rag_chunks], "model": llm_resp.model},
    )
    db.add(asst_msg)
    db.commit()

    return {
        "success": True,
        "role": "assistant",
        "content": assistant_content,
        "model": llm_resp.model,
        "citations": [
            {
                "file": c.get("file"),
                "lines": f"{c.get('start_line')}-{c.get('end_line')}",
                "symbol": c.get("symbol"),
            }
            for c in rag_chunks
        ],
        "duration_ms": llm_resp.duration_ms,
    }
