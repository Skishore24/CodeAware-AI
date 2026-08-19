from pathlib import Path
from typing import Any, Dict, List
from app.analysis.ast_parser import PythonASTAnalyzer, GenericCodeAnalyzer


class CodeAnalyzer:
    """
    Analyzes source code symbols, structures, and metrics across an entire repository.
    Supports Python, JavaScript, TypeScript, Go, Java, C++, C#.
    """

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".c", ".h", ".cs"
    }

    IGNORED_DIRS = {
        ".git", ".venv", "venv", "env", "__pycache__", "node_modules",
        "dist", "build", "coverage", ".cache", ".idea", ".vscode"
    }

    def __init__(self, repository_path: Path):
        self.repository_path = Path(repository_path)

    def get_source_files(self) -> List[Path]:
        files = []
        if not self.repository_path.exists():
            return []
        for path in self.repository_path.rglob("*"):
            if not path.is_file():
                continue
            if any(part in self.IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                files.append(path)
        return files

    def analyze(self) -> Dict[str, Any]:
        source_files = self.get_source_files()
        results = []
        total_functions = 0
        total_classes = 0

        for file_path in source_files:
            rel_path = str(file_path.relative_to(self.repository_path))
            if file_path.suffix.lower() == ".py":
                analyzer = PythonASTAnalyzer(file_path)
            else:
                analyzer = GenericCodeAnalyzer(file_path)

            file_result = analyzer.analyze()
            file_result["relative_file"] = rel_path
            results.append(file_result)

            total_functions += len(file_result.get("functions", []))
            total_classes += len(file_result.get("classes", []))

        return {
            "repository": self.repository_path.name,
            "total_files": len(source_files),
            "total_functions": total_functions,
            "total_classes": total_classes,
            "files": results,
        }