from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Dict, List, Optional
from app.llm.schemas import LLMRequest, LLMResponse, LLMMessage, ModelInfo


class LLMProvider(ABC):
    """
    Abstract Base Class for LLM Providers.
    All local AI models and test providers implement this interface.
    """

    @abstractmethod
    def generate(self, request: LLMRequest) -> LLMResponse:
        """Synchronous text generation."""
        pass

    @abstractmethod
    async def generate_async(self, request: LLMRequest) -> LLMResponse:
        """Asynchronous text generation."""
        pass

    @abstractmethod
    async def stream_generate(self, request: LLMRequest) -> AsyncIterator[str]:
        """Asynchronous streaming text generation yielding tokens."""
        pass

    @abstractmethod
    def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Compute dense vector embeddings."""
        pass

    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        """Check connection status and provider availability."""
        pass

    @abstractmethod
    def list_models(self) -> List[ModelInfo]:
        """List available and installed models."""
        pass
