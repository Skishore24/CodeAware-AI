from typing import Any, Dict, List, Optional
from pathlib import Path
from app.agents.base_agent import BaseAgent
from app.analysis.code_analyzer import CodeAnalyzer
from app.config.settings import CLONED_REPOSITORIES_DIR


class CodeAgent(BaseAgent):
    """
    Analyzes AST symbol definitions, function signatures, class hierarchies,
    and code structural metrics across the repository.
    """

    name = "CodeAnalysisAgent"
    description = "Extracts functions, classes, AST relationships, and structural symbols."

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
                summary=f"Repository not found at {repository_path}",
                error="Path does not exist."
            )

        try:
            analyzer = CodeAnalyzer(repo)
            result = analyzer.analyze()

            files = result.get("files", [])
            total_funcs = result.get("total_functions", 0)
            total_classes = result.get("total_classes", 0)

            findings = []
            for f in files[:20]:
                for fn in f.get("functions", []):
                    findings.append({
                        "type": "function",
                        "name": fn.get("name"),
                        "file": f.get("relative_file", f.get("file")),
                        "line": fn.get("line"),
                        "calls_count": len(fn.get("calls", []))
                    })
                for cls in f.get("classes", []):
                    findings.append({
                        "type": "class",
                        "name": cls.get("name"),
                        "file": f.get("relative_file", f.get("file")),
                        "line": cls.get("line"),
                        "methods_count": len(cls.get("methods", []))
                    })

            summary = (
                f"AST code analysis complete: Discovered {total_funcs} functions and {total_classes} classes "
                f"across {result.get('total_files', len(files))} source files."
            )

            return self.create_response(
                success=True,
                confidence=0.96,
                summary=summary,
                findings=findings[:50],
                files=[f.get("relative_file", f.get("file")) for f in files[:20]],
                recommendations=[
                    "Use ImpactAgent to inspect call hierarchies for critical functions",
                    "Keep cyclomatic complexity low by refactoring functions with heavy call counts"
                ],
                evidence=[{"total_functions": total_funcs, "total_classes": total_classes}],
                next_actions=["Explore Knowledge Graph", "Search Symbols"],
                raw_data=result
            )

        except Exception as exc:
            return self.create_response(
                success=False,
                summary=f"AST analysis failed: {exc}",
                error=str(exc)
            )