from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.base_agent import BaseAgent
from app.analysis.repository_scanner import RepositoryScanner
from app.config.settings import CLONED_REPOSITORIES_DIR


class RepositoryAgent(BaseAgent):
    """
    Analyzes repository structure, languages, frameworks, entry points, and statistics.
    """

    name = "RepositoryAgent"
    description = "Analyzes repository structure, files, languages, and project overview."

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path is required.",
                error="No repository provided."
            )

        repo = Path(repository_path)
        if not repo.exists():
            return self.create_response(
                success=False,
                summary=f"Repository path not found: {repository_path}",
                error="Path does not exist."
            )

        try:
            scanner = RepositoryScanner(repo)
            analysis = scanner.scan()

            total_files = analysis.get("total_files", 0)
            total_lines = analysis.get("total_lines", 0)
            primary_lang = analysis.get("primary_language", "Unknown")
            frameworks = analysis.get("frameworks", [])
            languages = analysis.get("languages", {})

            findings = [
                {"title": "Primary Language", "value": primary_lang},
                {"title": "Total Files", "value": total_files},
                {"title": "Total Lines of Code", "value": total_lines},
                {"title": "Detected Frameworks", "value": ", ".join(frameworks) if frameworks else "Standard Lib"},
                {"title": "Entry Points", "value": ", ".join(analysis.get("entry_points", [])) or "None detected"}
            ]

            summary = (
                f"Repository '{repo.name}' contains {total_files} files (~{total_lines:,} lines of code) "
                f"primarily in {primary_lang}. Detected frameworks: {', '.join(frameworks) if frameworks else 'Standard'}."
            )

            return self.create_response(
                success=True,
                confidence=0.98,
                summary=summary,
                findings=findings,
                files=[f["path"] for f in analysis.get("files", [])[:20]],
                recommendations=[
                    f"Explore key entry points: {', '.join(analysis.get('entry_points', [])[:3])}" if analysis.get("entry_points") else "Review top-level project files",
                    "Run Code Review for full quality and security audit"
                ],
                evidence=[{"languages": languages, "frameworks": frameworks}],
                next_actions=["Run Security Scan", "View Knowledge Graph", "Search Code"],
                raw_data=analysis
            )

        except Exception as exc:
            return self.create_response(
                success=False,
                summary=f"Repository analysis failed: {exc}",
                error=str(exc)
            )