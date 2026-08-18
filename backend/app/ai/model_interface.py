from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class AIModel(ABC):
    """
    Abstract Base Class for all AI and LLM models in CodeAware AI.
    
    Isolates external AI provider logic (OpenAI, Anthropic, Ollama, local models,
    or custom fine-tuned models) behind a clean unified interface.
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        """
        Generate a text response given a prompt and optional repository context.
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Return metadata about the current model provider.
        """
        pass


class LocalModel(AIModel):
    """
    Local / Rule-based / Fallback model representation.
    Used when no external AI API key or local LLM server is active.
    """

    def __init__(self, model_name: str = "CodeAware-Local-v1"):
        self.model_name = model_name

    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        if context.strip():
            return f"[{self.model_name}] Analyzed context:\n{context[:500]}\n\nResponse to prompt: {prompt}"
        return f"[{self.model_name}] Processing query: {prompt}"

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "provider": "local",
            "type": "fallback_reasoner",
            "status": "active",
        }


class CodeModel(AIModel):
    """
    Code-specialized AI model wrapper (e.g. CodeLlama, DeepSeek-Coder, StarCoder).
    """

    def __init__(self, model_name: str = "CodeAware-CodeModel-v1"):
        self.model_name = model_name

    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        prefix = f"### Context:\n{context}\n\n" if context else ""
        return f"{prefix}### Code Analysis & Proposal:\n{prompt}"

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "provider": "code_specialized",
            "type": "code_intelligence",
            "status": "ready",
        }


class OwnModel(AIModel):
    """
    Future proprietary fine-tuned CodeAware AI model.
    """

    def __init__(self, model_name: str = "CodeAware-Custom-v1"):
        self.model_name = model_name

    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        return f"[{self.model_name}] Custom inference for: {prompt}"

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "provider": "proprietary",
            "type": "custom_trained",
            "status": "development",
        }