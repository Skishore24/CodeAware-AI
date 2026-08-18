"""
Code analysis utilities.

Function and class extraction will be implemented
in the next stage.
"""

from pathlib import Path
from typing import Any, Dict, List

from app.analysis.ast_parser import PythonASTAnalyzer


class CodeAnalyzer:
    """
    Analyzes source code across an entire repository.
    """

    def __init__(self, repository_path: Path):

        self.repository_path = Path(
            repository_path
        )

    # ---------------------------------------------------------
    # Find Python files
    # ---------------------------------------------------------

    def get_python_files(self) -> List[Path]:

        ignored = {
            ".git",
            ".venv",
            "venv",
            "env",
            "__pycache__",
            "node_modules",
        }

        files = []

        for path in self.repository_path.rglob("*.py"):

            if any(
                part in ignored
                for part in path.parts
            ):

                continue

            files.append(path)

        return files

    # ---------------------------------------------------------
    # Analyze repository
    # ---------------------------------------------------------

    def analyze(self) -> Dict[str, Any]:

        python_files = self.get_python_files()

        results = []

        total_functions = 0
        total_classes = 0

        for file_path in python_files:

            analyzer = PythonASTAnalyzer(
                file_path
            )

            result = analyzer.analyze()

            results.append(result)

            if "functions" in result:

                total_functions += len(
                    result["functions"]
                )

            if "classes" in result:

                total_classes += len(
                    result["classes"]
                )

        return {

            "repository": self.repository_path.name,

            "python_files": len(
                python_files
            ),

            "total_functions": (
                total_functions
            ),

            "total_classes": (
                total_classes
            ),

            "files": results,

        }