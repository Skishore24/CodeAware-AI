from pathlib import Path
from typing import Any, Dict, List, Optional
from app.analysis.ast_parser import PythonASTAnalyzer, GenericCodeAnalyzer


class CodeAnalyzer:
    """
    Analyzes source code symbols, structures, metrics, and builds a unified symbol table
    across an entire repository. Supports Python, JavaScript, TypeScript, Go, Java, C++, C#, Rust.
    """

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".c", ".h", ".cs", ".rs"
    }

    IGNORED_DIRS = {
        ".git", ".venv", "venv", "env", "__pycache__", "node_modules",
        "dist", "build", "coverage", ".cache", ".idea", ".vscode"
    }

    def __init__(self, repository_path: Path | str):
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
        file_results = []
        symbol_table: Dict[str, List[Dict[str, Any]]] = {}
        api_endpoints = []
        total_functions = 0
        total_classes = 0

        for file_path in source_files:
            rel_path = str(file_path.relative_to(self.repository_path)).replace("\\", "/")
            if file_path.suffix.lower() == ".py":
                analyzer = PythonASTAnalyzer(file_path)
            else:
                analyzer = GenericCodeAnalyzer(file_path)

            res = analyzer.analyze()
            res["relative_file"] = rel_path
            file_results.append(res)

            # Record functions in symbol table
            for fn in res.get("functions", []):
                total_functions += 1
                sym_name = fn["name"]
                symbol_table.setdefault(sym_name, []).append({
                    "symbol": sym_name,
                    "type": fn.get("type", "function"),
                    "file": rel_path,
                    "line": fn.get("line", 1),
                    "end_line": fn.get("end_line", fn.get("line", 1)),
                    "docstring": fn.get("docstring", ""),
                    "parameters": fn.get("parameters", []),
                    "calls": fn.get("calls", []),
                })

            # Record classes in symbol table
            for cls in res.get("classes", []):
                total_classes += 1
                sym_name = cls["name"]
                symbol_table.setdefault(sym_name, []).append({
                    "symbol": sym_name,
                    "type": "class",
                    "file": rel_path,
                    "line": cls.get("line", 1),
                    "end_line": cls.get("end_line", cls.get("line", 1)),
                    "docstring": cls.get("docstring", ""),
                    "bases": cls.get("bases", []),
                    "methods": [m["name"] for m in cls.get("methods", [])],
                })
                # Index class methods too
                for m in cls.get("methods", []):
                    total_functions += 1
                    m_name = f"{sym_name}.{m['name']}"
                    symbol_table.setdefault(m_name, []).append({
                        "symbol": m_name,
                        "class": sym_name,
                        "type": m.get("type", "method"),
                        "file": rel_path,
                        "line": m.get("line", 1),
                        "end_line": m.get("end_line", m.get("line", 1)),
                        "docstring": m.get("docstring", ""),
                        "parameters": m.get("parameters", []),
                        "calls": m.get("calls", []),
                    })

            # Collect API endpoints
            for ep in res.get("api_endpoints", []):
                api_endpoints.append({
                    **ep,
                    "file": rel_path
                })

        return {
            "repository": self.repository_path.name,
            "total_files": len(source_files),
            "total_functions": total_functions,
            "total_classes": total_classes,
            "total_symbols": len(symbol_table),
            "api_endpoints_count": len(api_endpoints),
            "api_endpoints": api_endpoints,
            "symbol_table": symbol_table,
            "files": file_results,
        }

    def find_symbol(self, symbol_name: str) -> List[Dict[str, Any]]:
        analysis = self.analyze()
        symbols = analysis.get("symbol_table", {})
        sym_lower = symbol_name.lower()
        results = []
        for name, entries in symbols.items():
            if name.lower() == sym_lower or name.lower().endswith(f".{sym_lower}"):
                results.extend(entries)
        return results