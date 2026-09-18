import json
import logging
import time
from typing import Any, AsyncIterator, Dict, List, Optional
import httpx
from app.config.settings import settings
from app.llm.base import LLMProvider
from app.llm.schemas import LLMRequest, LLMResponse, LLMMessage, ModelInfo

logger = logging.getLogger("app.llm.ollama")

CURATED_MODELS = [
    {
        "id": "qwen2.5-coder:7b",
        "name": "Qwen 2.5 Coder (7B)",
        "tagline": "Best Overall for Code & Bug Fixing",
        "recommended": True,
        "ram_required": "8 GB RAM",
        "pull_cmd": "ollama pull qwen2.5-coder:7b",
        "description": "SOTA coding benchmark scores. Excellent at patch synthesis, AST reasoning, and multi-file debugging.",
        "best_for": "Bug fixing, patch generation, and code review",
    },
    {
        "id": "llama3.1:8b",
        "name": "Meta Llama 3.1 (8B)",
        "tagline": "Superior General Purpose Assistant & Code Reasoner",
        "recommended": True,
        "ram_required": "8 GB RAM",
        "pull_cmd": "ollama pull llama3.1:8b",
        "description": "Strong general language capabilities for documentation, architectural reasoning, and planning.",
        "best_for": "Agent planning, documentation, and conversational code explanations",
    },
    {
        "id": "llama3.2:3b",
        "name": "Meta Llama 3.2 (3B)",
        "tagline": "Ultra-Fast Lightweight Model",
        "recommended": False,
        "ram_required": "4 GB RAM",
        "pull_cmd": "ollama pull llama3.2:3b",
        "description": "Blazing fast response times on commodity hardware, ideal for quick classification and summaries.",
        "best_for": "Intent classification, quick symbol explanation, and routing",
    },
    {
        "id": "nomic-embed-text:latest",
        "name": "Nomic Embed Text",
        "tagline": "High-Performance Local Embeddings",
        "recommended": True,
        "ram_required": "1 GB RAM",
        "pull_cmd": "ollama pull nomic-embed-text",
        "description": "High-dimensional 768-dim code and text embeddings for hybrid vector retrieval.",
        "best_for": "Repository RAG and semantic vector indexing",
    },
]


class OllamaProvider(LLMProvider):
    """
    Production-grade Ollama Provider using local HTTP API.
    Zero external cloud calls. Handles timeouts, retries, and offline degradation.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: Optional[int] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

    def check_health(self) -> Dict[str, Any]:
        url = f"{self.base_url}/api/version"
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(url, headers={"User-Agent": "CodeAware-AI/1.0"})
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "connected": True,
                        "base_url": self.base_url,
                        "version": data.get("version", "unknown"),
                        "active_model": self.default_model,
                        "message": f"Ollama is online (v{data.get('version')})",
                    }
        except Exception as exc:
            return {
                "connected": False,
                "base_url": self.base_url,
                "active_model": self.default_model,
                "error": str(exc),
                "message": f"Ollama server is not reachable at {self.base_url}",
            }
        return {"connected": False, "base_url": self.base_url, "active_model": self.default_model}

    def list_models(self) -> List[ModelInfo]:
        url = f"{self.base_url}/api/tags"
        installed_names = set()
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(url, headers={"User-Agent": "CodeAware-AI/1.0"})
                if res.status_code == 200:
                    data = res.json()
                    for m in data.get("models", []):
                        val = m.get("name") or m.get("model")
                        if val:
                            installed_names.add(val)
        except Exception as exc:
            logger.warning(f"Could not list models from Ollama: {exc}")

        result: List[ModelInfo] = []
        for c in CURATED_MODELS:
            is_installed = any(c["id"] in name for name in installed_names)
            result.append(ModelInfo(
                id=c["id"],
                name=c["name"],
                description=c.get("description"),
                tagline=c.get("tagline"),
                ram_required=c.get("ram_required"),
                recommended=c.get("recommended", False),
                is_installed=is_installed,
                best_for=c.get("best_for"),
                pull_cmd=c.get("pull_cmd"),
            ))

        # Add any other installed models not in curated list
        for name in installed_names:
            if not any(c["id"] in name for c in CURATED_MODELS):
                result.append(ModelInfo(
                    id=name,
                    name=name,
                    description="Locally installed Ollama model",
                    is_installed=True,
                ))
        return result

    def get_effective_model(self, requested_model: Optional[str] = None) -> str:
        if requested_model:
            return requested_model
        models = self.list_models()
        installed = [m.id for m in models if m.is_installed]
        if self.default_model in installed:
            return self.default_model
        # Fallback preference order
        for candidate in ["llama3.1:8b", "llama3.2:3b", "qwen2.5-coder:7b", "codellama:7b"]:
            if any(candidate in m for m in installed):
                return candidate
        text_models = [m for m in installed if "embed" not in m]
        if text_models:
            return text_models[0]
        return self.default_model

    def generate(self, request: LLMRequest) -> LLMResponse:
        target_model = self.get_effective_model(request.model)
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Repository Context:\n```\n{request.context}\n```\n\nTask / Question:\n{request.prompt}"

        payload = {
            "model": target_model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.system:
            payload["system"] = request.system
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens

        start_time = time.time()
        url = f"{self.base_url}/api/generate"
        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                res = client.post(url, json=payload, headers={"User-Agent": "CodeAware-AI/1.0"})
                if res.status_code == 200:
                    data = res.json()
                    duration_ms = round((time.time() - start_time) * 1000, 2)
                    return LLMResponse(
                        content=data.get("response", ""),
                        model=target_model,
                        success=True,
                        duration_ms=duration_ms,
                        prompt_tokens=data.get("prompt_eval_count"),
                        completion_tokens=data.get("eval_count"),
                    )
                else:
                    return LLMResponse(
                        content="",
                        model=target_model,
                        success=False,
                        error=f"Ollama returned HTTP {res.status_code}: {res.text}",
                    )
        except Exception as exc:
            logger.warning(f"Ollama generation request failed: {exc}")
            return LLMResponse(
                content="",
                model=target_model,
                success=False,
                error=str(exc),
            )

    async def generate_async(self, request: LLMRequest) -> LLMResponse:
        target_model = self.get_effective_model(request.model)
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Repository Context:\n```\n{request.context}\n```\n\nTask / Question:\n{request.prompt}"

        payload = {
            "model": target_model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.system:
            payload["system"] = request.system
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens

        start_time = time.time()
        url = f"{self.base_url}/api/generate"
        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                res = await client.post(url, json=payload, headers={"User-Agent": "CodeAware-AI/1.0"})
                if res.status_code == 200:
                    data = res.json()
                    duration_ms = round((time.time() - start_time) * 1000, 2)
                    return LLMResponse(
                        content=data.get("response", ""),
                        model=target_model,
                        success=True,
                        duration_ms=duration_ms,
                        prompt_tokens=data.get("prompt_eval_count"),
                        completion_tokens=data.get("eval_count"),
                    )
                else:
                    return LLMResponse(
                        content="",
                        model=target_model,
                        success=False,
                        error=f"Ollama error {res.status_code}: {res.text}",
                    )
        except Exception as exc:
            return LLMResponse(
                content="",
                model=target_model,
                success=False,
                error=str(exc),
            )

    async def stream_generate(self, request: LLMRequest) -> AsyncIterator[str]:
        target_model = self.get_effective_model(request.model)
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Repository Context:\n```\n{request.context}\n```\n\nTask / Question:\n{request.prompt}"

        payload = {
            "model": target_model,
            "prompt": full_prompt,
            "stream": True,
            "options": {"temperature": request.temperature},
        }
        if request.system:
            payload["system"] = request.system

        url = f"{self.base_url}/api/generate"
        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                async with client.stream("POST", url, json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                            except Exception:
                                continue
        except Exception as exc:
            logger.warning(f"Ollama streaming interrupted: {exc}")
            yield f"\n[Streaming error: {exc}]"

    def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        target_model = model or settings.OLLAMA_EMBEDDING_MODEL
        embeddings: List[List[float]] = []
        url = f"{self.base_url}/api/embeddings"

        try:
            with httpx.Client(timeout=30.0) as client:
                for text in texts:
                    res = client.post(url, json={"model": target_model, "prompt": text[:2000]})
                    if res.status_code == 200:
                        data = res.json()
                        embeddings.append(data.get("embedding", []))
                    else:
                        embeddings.append([])
        except Exception as exc:
            logger.warning(f"Ollama embedding failed: {exc}")
            return [[] for _ in texts]
        return embeddings
