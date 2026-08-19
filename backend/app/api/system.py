from typing import Any, Dict
from fastapi import APIRouter
from app.ai.reasoner import CodeAwareReasoner

router = APIRouter(
    prefix="/system",
    tags=["System Status"]
)

reasoner = CodeAwareReasoner()


@router.get("/status")
def system_status() -> Dict[str, Any]:
    return {
        "success": True,
        "service": "CodeAware AI",
        "version": "1.0.0",
        "inference": {
            "mode": "Local Deterministic Intelligence",
            "language_model": "None (Local-First Deterministic Engine)",
            "reasoning_engine": reasoner.model_name,
            "embeddings": "Local TF-IDF & Symbol Vectorizer",
            "external_apis": False,
            "status": "Ready"
        },
        "components": {
            "backend": "Healthy",
            "repository_scanner": "Ready",
            "search_engine": "Ready",
            "rag_pipeline": "Ready",
            "knowledge_graph": "Ready",
            "agents_orchestrator": "Ready (15 Specialist Agents Active)",
            "validation_agent": "Ready"
        },
        "agents_count": 15,
        "supported_intents": 15,
        "local_first": True
    }
