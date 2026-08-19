import ast
import re
from pathlib import Path
from typing import Any, Dict, List, Optional


class PythonASTAnalyzer:
    """
    Analyzes Python source code using Python's built-in AST module.
    Extracts classes, methods, functions, async functions, imports, docstrings, and call graphs.
    """

    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)

    def read_source(self) -> str:
        try:
            return self.file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception as exc:
            raise RuntimeError(f"Unable to read {self.file_path}: {exc}") from exc

    def parse(self):
        source = self.read_source()
        try:
            return ast.parse(source, filename=str(self.file_path))
        except SyntaxError as exc:
            return {
                "syntax_error": True,
                "error": str(exc),
                "line": exc.lineno,
                "column": exc.offset,
            }

    def get_parameters(self, node: Any) -> List[str]:
        parameters = []
        if hasattr(node, "args") and hasattr(node.args, "args"):
            for argument in node.args.args:
                parameters.append(argument.arg)
        return parameters

    def get_calls(self, node: ast.AST) -> List[str]:
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                function_name = self.get_node_name(child.func)
                if function_name:
                    calls.append(function_name)
        return sorted(list(set(calls)))

    def get_node_name(self, node: ast.AST) -> str:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            parts = []
            current = node
            while isinstance(current, ast.Attribute):
                parts.append(current.attr)
                current = current.value
            if isinstance(current, ast.Name):
                parts.append(current.id)
            return ".".join(reversed(parts))
        return ""

    def get_returns(self, node: ast.AST) -> List[str]:
        returns = []
        for child in ast.walk(node):
            if isinstance(child, ast.Return):
                if child.value is None:
                    returns.append("None")
                else:
                    val_name = self.get_node_name(child.value)
                    if val_name:
                        returns.append(val_name)
                    else:
                        try:
                            returns.append(ast.unparse(child.value))
                        except Exception:
                            returns.append("value")
        return returns

    def analyze_function(self, node: ast.FunctionDef) -> Dict[str, Any]:
        return {
            "name": node.name,
            "type": "function",
            "line": node.lineno,
            "end_line": getattr(node, "end_lineno", node.lineno),
            "docstring": ast.get_docstring(node) or "",
            "parameters": self.get_parameters(node),
            "calls": self.get_calls(node),
            "returns": self.get_returns(node),
        }

    def analyze_async_function(self, node: ast.AsyncFunctionDef) -> Dict[str, Any]:
        return {
            "name": node.name,
            "type": "async_function",
            "line": node.lineno,
            "end_line": getattr(node, "end_lineno", node.lineno),
            "docstring": ast.get_docstring(node) or "",
            "parameters": self.get_parameters(node),
            "calls": self.get_calls(node),
            "returns": self.get_returns(node),
        }

    def analyze_class(self, node: ast.ClassDef) -> Dict[str, Any]:
        methods = []
        bases = []
        for base in node.bases:
            name = self.get_node_name(base)
            if name:
                bases.append(name)

        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                methods.append(self.analyze_function(item))
            elif isinstance(item, ast.AsyncFunctionDef):
                methods.append(self.analyze_async_function(item))

        return {
            "name": node.name,
            "type": "class",
            "line": node.lineno,
            "end_line": getattr(node, "end_lineno", node.lineno),
            "docstring": ast.get_docstring(node) or "",
            "bases": bases,
            "methods": methods,
        }

    def analyze_import(self, node: ast.Import) -> List[Dict[str, Any]]:
        imports = []
        for alias in node.names:
            imports.append({
                "type": "import",
                "module": alias.name,
                "alias": alias.asname,
                "line": node.lineno,
            })
        return imports

    def analyze_import_from(self, node: ast.ImportFrom) -> List[Dict[str, Any]]:
        imports = []
        module = node.module or ""
        for alias in node.names:
            imports.append({
                "type": "import_from",
                "module": module,
                "name": alias.name,
                "alias": alias.asname,
                "line": node.lineno,
            })
        return imports

    def analyze(self) -> Dict[str, Any]:
        tree = self.parse()
        if isinstance(tree, dict) and tree.get("syntax_error"):
            return {
                "file": str(self.file_path),
                "language": "python",
                "syntax_error": True,
                "error": tree["error"],
                "classes": [],
                "functions": [],
                "imports": [],
            }

        classes = []
        functions = []
        imports = []

        for node in getattr(tree, "body", []):
            if isinstance(node, ast.ClassDef):
                classes.append(self.analyze_class(node))
            elif isinstance(node, ast.FunctionDef):
                functions.append(self.analyze_function(node))
            elif isinstance(node, ast.AsyncFunctionDef):
                functions.append(self.analyze_async_function(node))
            elif isinstance(node, ast.Import):
                imports.extend(self.analyze_import(node))
            elif isinstance(node, ast.ImportFrom):
                imports.extend(self.analyze_import_from(node))

        return {
            "file": str(self.file_path),
            "language": "python",
            "classes": classes,
            "functions": functions,
            "imports": imports,
        }


class GenericCodeAnalyzer:
    """
    Fallback structural symbol analyzer for JavaScript, TypeScript, Go, Java, C++, C#.
    Uses regex patterns to extract classes, functions, and import declarations.
    """

    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)

    def analyze(self) -> Dict[str, Any]:
        try:
            source = self.file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return {
                "file": str(self.file_path),
                "language": "unknown",
                "classes": [],
                "functions": [],
                "imports": []
            }

        ext = self.file_path.suffix.lower()
        lang = {
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".go": "go",
            ".java": "java",
            ".cpp": "cpp",
            ".c": "c",
            ".cs": "csharp",
        }.get(ext, "unknown")

        classes = []
        functions = []
        imports = []

        lines = source.splitlines()
        for idx, line in enumerate(lines, 1):
            sline = line.strip()

            # Class declarations
            class_match = re.search(r"\bclass\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?", sline)
            if class_match:
                classes.append({
                    "name": class_match.group(1),
                    "type": "class",
                    "line": idx,
                    "bases": [class_match.group(2)] if class_match.group(2) else [],
                    "methods": []
                })
                continue

            # Function declarations (JS/TS/Go/Java)
            fn_match = re.search(
                r"(?:function\s+([A-Za-z0-9_]+)|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|func\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)|public\s+(?:static\s+)?[\w<>[\]]+\s+([A-Za-z0-9_]+)\s*\()",
                sline
            )
            if fn_match:
                fn_name = next(g for g in fn_match.groups() if g is not None)
                functions.append({
                    "name": fn_name,
                    "type": "function",
                    "line": idx,
                    "parameters": [],
                    "calls": []
                })
                continue

            # Imports
            if sline.startswith("import ") or sline.startswith("from ") or "require(" in sline:
                imports.append({
                    "type": "import",
                    "statement": sline,
                    "line": idx
                })

        return {
            "file": str(self.file_path),
            "language": lang,
            "classes": classes,
            "functions": functions,
            "imports": imports,
        }