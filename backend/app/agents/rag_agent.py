from pathlib import Path
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.services.rag_service import RAGService
from app.ai.reasoner import CodeAwareReasoner


class RAGAgent(BaseAgent):
    """
    Retrieves relevant repository code and passes
    it to the CodeAware reasoning layer.
    """

    def __init__(self):

        super().__init__(
            name="RAG Agent",
            description=(
                "Retrieves relevant repository "
                "information and produces "
                "repository-aware answers."
            ),
        )

        self.reasoner = CodeAwareReasoner()

    # ---------------------------------------------------------
    # Run RAG agent
    # ---------------------------------------------------------

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        repository_path = input_data.get(
            "repository_path"
        )

        question = input_data.get(
            "question"
        )

        top_k = input_data.get(
            "top_k",
            8
        )

        if not repository_path:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "repository_path is required."
                ),
            }

        if not question:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "question is required."
                ),
            }

        try:

            rag_service = RAGService(
                Path(repository_path)
            )

            retrieval = rag_service.search(
                query=question,
                top_k=top_k
            )

            context = retrieval.get(
                "context",
                ""
            )

            answer = self.reasoner.generate(
                prompt=question,
                context=context
            )

            return {

                "success": True,

                "agent": self.name,

                "question": question,

                "answer": answer,

                "retrieval": retrieval,

                "model": (
                    self.reasoner
                    .get_model_info()
                ),

            }

        except Exception as exc:

            return {

                "success": False,

                "agent": self.name,

                "error": str(exc),

            }