from typing import Any, Dict
from pathlib import Path

from app.agents.base_agent import BaseAgent
from app.analysis.code_analyzer import CodeAnalyzer


class CodeAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            name="Code Agent",
            description=(
                "Understands source code, "
                "functions, classes, imports "
                "and code relationships."
            ),
        )

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        repository_path = input_data.get(
            "repository_path"
        )

        if not repository_path:

            return {
                "success": False,
                "agent": self.name,
                "error": (
                    "repository_path is required"
                ),
            }

        try:

            analyzer = CodeAnalyzer(
                Path(repository_path)
            )

            result = analyzer.analyze()

            return {

                "success": True,

                "agent": self.name,

                "result": result,

            }

        except Exception as exc:

            return {

                "success": False,

                "agent": self.name,

                "error": str(exc),

            }