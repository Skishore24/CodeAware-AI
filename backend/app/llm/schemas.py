from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LLMMessage(BaseModel):
    role: str = "user"  # system, user, assistant
    content: str


class LLMRequest(BaseModel):
    prompt: str
    messages: Optional[List[LLMMessage]] = None
    system: Optional[str] = None
    context: Optional[str] = None
    model: Optional[str] = None
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_tokens: Optional[int] = None
    stream: bool = False


class LLMResponse(BaseModel):
    content: str
    model: str
    success: bool = True
    duration_ms: float = 0.0
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    finish_reason: Optional[str] = "stop"
    error: Optional[str] = None


class ModelInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    size_bytes: Optional[int] = None
    ram_required: Optional[str] = None
    recommended: bool = False
    is_installed: bool = False
    best_for: Optional[str] = None
    pull_cmd: Optional[str] = None
