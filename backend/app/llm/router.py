import logging
from typing import Any, AsyncIterator, Dict, List, Optional
from app.config.settings import settings
from app.llm.base import LLMProvider
from app.llm.ollama import OllamaProvider
from app.llm.test_provider import TestLLMProvider
from app.llm.schemas import LLMRequest, LLMResponse, ModelInfo

logger = logging.getLogger("app.llm.router")


class ModelRouter:
    """
    Intelligent Model Router for CodeAware AI (Section 8).
    Selects the optimal local model based on task category and available hardware,
    and switches between OllamaProvider and TestLLMProvider for CI.
    """

    def __init__(self):
        self.ollama_provider = OllamaProvider()
        self.test_provider = TestLLMProvider()

    @property
    def provider(self) -> LLMProvider:
        if settings.APP_ENV == "test":
            return self.test_provider
        return self.ollama_provider

    def select_model(self, task_type: str = "general") -> str:
        """
        Choose the model based on task complexity.
        """
        task_clean = task_type.lower()
        # 1. Fast lightweight tasks: classification, quick explanations
        if any(kw in task_clean for kw in ["intent", "classify", "fast", "summary", "quick"]):
            return settings.OLLAMA_FAST_MODEL

        # 2. Deep reasoning, code repair, multi-agent planning
        if any(kw in task_clean for kw in ["patch", "fix", "repair", "deep", "plan", "review", "security", "test_gen"]):
            return settings.OLLAMA_MODEL

        # Default to primary model
        return settings.OLLAMA_MODEL

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        context: Optional[str] = None,
        task_type: str = "general",
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        chosen_model = model or self.select_model(task_type)
        req = LLMRequest(
            prompt=prompt,
            system=system,
            context=context,
            model=chosen_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return self.provider.generate(req)

    async def generate_async(
        self,
        prompt: str,
        system: Optional[str] = None,
        context: Optional[str] = None,
        task_type: str = "general",
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        chosen_model = model or self.select_model(task_type)
        req = LLMRequest(
            prompt=prompt,
            system=system,
            context=context,
            model=chosen_model,
            temperature=temperature,
        )
        return await self.provider.generate_async(req)

    async def stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        context: Optional[str] = None,
        task_type: str = "general",
        model: Optional[str] = None,
    ) -> AsyncIterator[str]:
        chosen_model = model or self.select_model(task_type)
        req = LLMRequest(
            prompt=prompt,
            system=system,
            context=context,
            model=chosen_model,
            stream=True,
        )
        async for chunk in self.provider.stream_generate(req):
            yield chunk

    def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        target_model = model or settings.OLLAMA_EMBEDDING_MODEL
        return self.provider.embed(texts, model=target_model)

    def check_health(self) -> Dict[str, Any]:
        return self.provider.check_health()

    def list_models(self) -> List[ModelInfo]:
        return self.provider.list_models()


llm_router = ModelRouter()
