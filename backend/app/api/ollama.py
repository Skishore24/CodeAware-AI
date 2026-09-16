from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.services.ollama_service import ollama_service

router = APIRouter(
    prefix="/ollama",
    tags=["Ollama Local LLM"],
)

RECOMMENDED_MODELS = [
    {
        "id": "qwen2.5-coder:7b",
        "name": "Qwen 2.5 Coder (7B)",
        "tagline": "Best Overall for Code & Bug Fixing",
        "recommended": True,
        "ram_required": "8 GB RAM",
        "pull_cmd": "ollama pull qwen2.5-coder:7b",
        "description": "State-of-the-art coding benchmark scores (HumanEval 88.4%). Excellent at patch synthesis, AST reasoning, and multi-file debugging.",
        "best_for": "Bug fixing, patch generation, and code review",
    },
    {
        "id": "qwen2.5-coder:14b",
        "name": "Qwen 2.5 Coder (14B)",
        "tagline": "Top-Tier Coding Intelligence for High-End PCs",
        "recommended": False,
        "ram_required": "16 GB RAM / 8GB VRAM",
        "pull_cmd": "ollama pull qwen2.5-coder:14b",
        "description": "Larger capacity model with deeper understanding of complex architectural coupling, refactoring, and large AST context.",
        "best_for": "Complex architectural refactoring and multi-step bug repairs",
    },
    {
        "id": "deepseek-r1:8b",
        "name": "DeepSeek R1 (8B)",
        "tagline": "Best for Chain-of-Thought Root Cause Analysis",
        "recommended": False,
        "ram_required": "8 GB RAM",
        "pull_cmd": "ollama pull deepseek-r1:8b",
        "description": "Specialized reasoning model that outputs step-by-step thinking traces to deeply diagnose tricky race conditions and logic flaws.",
        "best_for": "Root-cause diagnostics and tricky algorithmic debugging",
    },
    {
        "id": "llama3.1:8b",
        "name": "Meta Llama 3.1 (8B)",
        "tagline": "Great General Purpose Assistant",
        "recommended": False,
        "ram_required": "8 GB RAM",
        "pull_cmd": "ollama pull llama3.1:8b",
        "description": "Strong general language capabilities for documentation generation, architectural summaries, and user chat.",
        "best_for": "Documentation and conversational explanations",
    },
    {
        "id": "codellama:7b",
        "name": "Code Llama (7B)",
        "tagline": "Lightweight Code Completion",
        "recommended": False,
        "ram_required": "6 GB RAM",
        "pull_cmd": "ollama pull codellama:7b",
        "description": "Meta's dedicated code model, fast and responsive on moderate hardware.",
        "best_for": "Basic code completion and explanations",
    },
]


class OllamaConfigRequest(BaseModel):
    base_url: Optional[str] = None
    model: Optional[str] = None


class OllamaGenerateRequest(BaseModel):
    prompt: str
    system: Optional[str] = None
    context: Optional[str] = None
    model: Optional[str] = None


@router.get("/status")
def get_ollama_status() -> Dict[str, Any]:
    """
    Check Ollama connection health, version, and active model.
    """
    status = ollama_service.check_connection()
    installed = []
    if status.get("connected"):
        installed = ollama_service.list_installed_models()

    return {
        "success": True,
        "connection": status,
        "installed_models": installed,
        "active_model": ollama_service.model,
        "base_url": ollama_service.base_url,
        "recommendations": RECOMMENDED_MODELS,
    }


@router.get("/models")
def get_ollama_models() -> Dict[str, Any]:
    """
    List installed models and curated recommendations.
    """
    installed = ollama_service.list_installed_models()
    return {
        "success": True,
        "installed": installed,
        "recommendations": RECOMMENDED_MODELS,
        "active_model": ollama_service.model,
    }


@router.post("/config")
def update_ollama_config(request: OllamaConfigRequest) -> Dict[str, Any]:
    """
    Update Ollama server URL and active model.
    """
    if request.base_url:
        ollama_service.base_url = request.base_url.rstrip("/")
    if request.model:
        ollama_service.model = request.model

    status = ollama_service.check_connection()
    return {
        "success": True,
        "base_url": ollama_service.base_url,
        "model": ollama_service.model,
        "connection": status,
    }


@router.post("/generate")
def generate_ollama(request: OllamaGenerateRequest) -> Dict[str, Any]:
    """
    Test direct prompt generation through Ollama.
    """
    resp = ollama_service.generate(
        prompt=request.prompt,
        system=request.system,
        context=request.context,
        model=request.model,
    )
    if resp is None:
        raise HTTPException(
            status_code=503,
            detail="Ollama server is unavailable or generation timed out. Ensure Ollama is running.",
        )
    return {
        "success": True,
        "model": request.model or ollama_service.model,
        "response": resp,
    }
