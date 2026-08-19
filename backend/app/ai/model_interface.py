from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class AIModel(ABC):
    """
    Abstract Base Class for all AI and reasoning models in CodeAware AI.
    Provides a standardized interface for local deterministic reasoners
    and optional future local offline LLM integrations (e.g. Ollama, Llama.cpp).
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        """
        Generate a structured response given a query and repository context.
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Return accurate metadata about the current reasoning engine.
        """
        pass