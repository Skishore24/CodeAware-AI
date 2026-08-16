from typing import Any, Dict, List

from app.ai.model_interface import AIModel


class CodeAwareReasoner(AIModel):
    """
    Initial CodeAware reasoning engine.

    This version focuses on structured reasoning over
    retrieved repository context.

    Later this class can be replaced by our trained
    CodeAware language model.
    """

    def __init__(self):

        self.model_name = (
            "CodeAware-Reasoner-v0"
        )

    # ---------------------------------------------------------
    # Generate answer
    # ---------------------------------------------------------

    def generate(
        self,
        prompt: str,
        context: str = "",
        **kwargs: Any
    ) -> str:

        if not context.strip():

            return (
                "I could not find relevant code "
                "in the repository."
            )

        question = prompt.strip()

        files = self.extract_files(
            context
        )

        answer_parts = []

        answer_parts.append(
            f"Question: {question}"
        )

        if files:

            answer_parts.append(
                "\nRelevant files:"
            )

            for file_path in files:

                answer_parts.append(
                    f"- {file_path}"
                )

        answer_parts.append(
            "\nRepository context was retrieved "
            "using CodeAware hybrid search."
        )

        answer_parts.append(
            "\nRelevant code:\n"
            + context
        )

        return "\n".join(
            answer_parts
        )

    # ---------------------------------------------------------
    # Extract files from context
    # ---------------------------------------------------------

    def extract_files(
        self,
        context: str
    ) -> List[str]:

        files = []

        for line in context.splitlines():

            line = line.strip()

            if line.startswith("FILE:"):

                file_path = (
                    line.replace(
                        "FILE:",
                        "",
                        1
                    )
                    .strip()
                )

                if file_path:
                    files.append(
                        file_path
                    )

        return list(
            dict.fromkeys(files)
        )

    # ---------------------------------------------------------
    # Model information
    # ---------------------------------------------------------

    def get_model_info(
        self
    ) -> Dict[str, Any]:

        return {

            "name": self.model_name,

            "type": "CodeAware reasoning engine",

            "version": "0.1.0",

            "external_api": False,

            "status": "development",

        }