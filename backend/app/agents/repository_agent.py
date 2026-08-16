from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.analysis.repository_scanner import RepositoryScanner


class RepositoryAgent(BaseAgent):

    def __init__(self):
        super().__init__(
            name="Repository Agent",
            description=(
                "Analyzes repository structure, "
                "files, languages and project information."
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
                "error": "repository_path is required",
            }

        try:

            scanner = RepositoryScanner(
                repository_path
            )

            analysis = scanner.scan()

            return {
                "success": True,
                "agent": self.name,
                "result": analysis,
            }

        except Exception as exc:

            return {
                "success": False,
                "agent": self.name,
                "error": str(exc),
            }