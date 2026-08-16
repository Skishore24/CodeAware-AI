from abc import ABC, abstractmethod
from typing import Any, Dict


class AIModel(ABC):
    """
    Common interface for every CodeAware AI model.

    Later we can replace the implementation with
    our own trained model without changing the RAG system.
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:
        """
        Generate an answer using the supplied context.
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Return information about the model.
        """
        pass