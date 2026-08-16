from pathlib import Path
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.services.rag_service import RAGService
from app.ai.reasoner import CodeAwareReasoner
from app.config.paths import CLONED_REPOSITORIES_DIR


class RAGAgent(BaseAgent):

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
    # Run
    # ---------------------------------------------------------

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        repository_path = input_data.get(
            "repository_path"
        )

        repository_name = input_data.get(
            "repository_name"
        )

        question = input_data.get(
            "question"
        )

        top_k = input_data.get(
            "top_k",
            8
        )

        # -----------------------------------------------------
        # Resolve repository name to path
        # -----------------------------------------------------

        if not repository_path:

            if not repository_name:

                return {
                    "success": False,
                    "agent": self.name,
                    "error": (
                        "repository_name or "
                        "repository_path is required."
                    ),
                }

            repository_path = (
                CLONED_REPOSITORIES_DIR
                / repository_name
            )

        repository_path = Path(
            repository_path
        )

        # -----------------------------------------------------
        # Validate repository
        # -----------------------------------------------------

        if not repository_path.exists():

            return {

                "success": False,

                "agent": self.name,

                "error": (
                    "Repository does not exist: "
                    f"{repository_path}"
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
                repository_path
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

                "repository": (
                    str(repository_path)
                ),

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