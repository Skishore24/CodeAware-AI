import ast
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class PythonASTAnalyzer:
    """
    Advanced Python AST Analyzer for CodeAware AI.
    Extracts classes, methods, functions, async functions, decorators, API routes,
    database operations, imports, docstrings, parameters with type hints, returns, and call graphs.
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

    def get_parameters(self, node: Any) -> List[Dict[str, Any]]:
        parameters = []
        if hasattr(node, "args") and hasattr(node.args, "args"):
            for argument in node.args.args:
                type_hint = ""
                if argument.annotation:
                    try:
                        type_hint = ast.unparse(argument.annotation)
                    except Exception:
                        type_hint = "Any"
                parameters.append({
                    "name": argument.arg,
                    "type_hint": type_hint
                })
        return parameters

    def get_decorators(self, node: Any) -> List[str]:
        decorators = []
        if hasattr(node, "decorator_list"):
            for dec in node.decorator_list:
                try:
                    decorators.append(ast.unparse(dec))
                except Exception:
                    name = self.get_node_name(dec)
                    if name:
                        decorators.append(name)
        return decorators

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
        if isinstance(node, ast.Call):
            return self.get_node_name(node.func)
        return ""

    def get_calls(self, node: ast.AST) -> List[str]:
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                name = self.get_node_name(child.func)
                if name:
                    calls.append(name)
        return sorted(list(set(calls)))

    def get_returns(self, node: ast.AST) -> List[str]:
        returns = []
        for child in ast.walk(node):
            if isinstance(child, ast.Return):
                if child.value is None:
                    returns.append("None")
                else:
                    try:
                        returns.append(ast.unparse(child.value))
                    except Exception:
                        val_name = self.get_node_name(child.value)
                        returns.append(val_name or "value")
        return sorted(list(set(returns)))

    def detect_api_route(self, decorators: List[str]) -> Optional[Dict[str, Any]]:
        for dec in decorators:
            dec_lower = dec.lower()
            if any(method in dec_lower for method in ["get(", "post(", "put(", "delete(", "patch(", "route(", "api_view"]):
                # Extract HTTP method and route path if possible
                method_match = re.search(r"\b(get|post|put|delete|patch)\b", dec_lower)
                path_match = re.search(r"[\"'](/[^\"']*)[\"']", dec)
                return {
                    "is_api_route": True,
                    "method": method_match.group(1).upper() if method_match else "GET",
                    "path": path_match.group(1) if path_match else "/",
                    "decorator": dec
                }
        return None

    def detect_database_ops(self, node: ast.AST) -> List[Dict[str, Any]]:
        ops = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                call_name = self.get_node_name(child.func).lower()
                if any(kw in call_name for kw in ["filter", "query", "execute", "select", "insert", "update", "delete", "fetchall", "fetchone", "commit", "objects.get", "objects.all"]):
                    ops.append({
                        "operation": call_name,
                        "line": getattr(child, "lineno", 1)
                    })
        return ops

    def analyze_function(self, node: Any, is_async: bool = False) -> Dict[str, Any]:
        decorators = self.get_decorators(node)
        api_route = self.detect_api_route(decorators)
        db_ops = self.detect_database_ops(node)
        docstring = ast.get_docstring(node) or ""

        return {
            "name": node.name,
            "type": "async_function" if is_async else "function",
            "line": node.lineno,
            "end_line": getattr(node, "end_lineno", node.lineno),
            "docstring": docstring,
            "decorators": decorators,
            "parameters": [p["name"] for p in self.get_parameters(node)],
            "parameters_detailed": self.get_parameters(node),
            "calls": self.get_calls(node),
            "returns": self.get_returns(node),
            "api_route": api_route,
            "database_operations": db_ops,
            "is_api_endpoint": api_route is not None,
            "has_db_operations": len(db_ops) > 0,
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
                methods.append(self.analyze_function(item, is_async=False))
            elif isinstance(item, ast.AsyncFunctionDef):
                methods.append(self.analyze_function(item, is_async=True))

        decorators = self.get_decorators(node)
        docstring = ast.get_docstring(node) or ""

        return {
            "name": node.name,
            "type": "class",
            "line": node.lineno,
            "end_line": getattr(node, "end_lineno", node.lineno),
            "docstring": docstring,
            "bases": bases,
            "decorators": decorators,
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
                "api_endpoints": [],
            }

        classes = []
        functions = []
        imports = []
        api_endpoints = []

        for node in getattr(tree, "body", []):
            if isinstance(node, ast.ClassDef):
                cls_data = self.analyze_class(node)
                classes.append(cls_data)
                for m in cls_data.get("methods", []):
                    if m.get("is_api_endpoint"):
                        api_endpoints.append({**m, "class": cls_data["name"]})
            elif isinstance(node, ast.FunctionDef):
                fn_data = self.analyze_function(node, is_async=False)
                functions.append(fn_data)
                if fn_data.get("is_api_endpoint"):
                    api_endpoints.append(fn_data)
            elif isinstance(node, ast.AsyncFunctionDef):
                fn_data = self.analyze_function(node, is_async=True)
                functions.append(fn_data)
                if fn_data.get("is_api_endpoint"):
                    api_endpoints.append(fn_data)
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
            "api_endpoints": api_endpoints,
        }


class GenericCodeAnalyzer:
    """
    Structural symbol and reference analyzer for JavaScript, TypeScript, Go, Java, C++, C#.
    Uses robust regular expressions to extract classes, functions, parameters, imports, and calls.
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
                "imports": [],
                "api_endpoints": []
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
            ".rs": "rust",
            ".php": "php",
            ".rb": "ruby",
        }.get(ext, "unknown")

        classes = []
        functions = []
        imports = []
        api_endpoints = []

        lines = source.splitlines()
        for idx, line in enumerate(lines, 1):
            sline = line.strip()
            if not sline or sline.startswith("//") or sline.startswith("/*") or sline.startswith("*"):
                continue

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

            # Function declarations (JS/TS/Go/Java/C#/Rust)
            fn_match = re.search(
                r"(?:function\s+([A-Za-z0-9_]+)|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|func\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)|(?:public|private|protected)?\s+(?:static\s+)?(?:async\s+)?[\w<>[\]]+\s+([A-Za-z0-9_]+)\s*\(|fn\s+([A-Za-z0-9_]+))",
                sline
            )
            if fn_match:
                fn_name = next(g for g in fn_match.groups() if g is not None)
                if fn_name not in ("if", "for", "while", "switch", "catch"):
                    # Check for API endpoint decorators / routing patterns in JS/TS/Go
                    is_route = any(r in sline.lower() for r in ["app.get", "app.post", "router.get", "router.post", "@get", "@post"])
                    fn_entry = {
                        "name": fn_name,
                        "type": "function",
                        "line": idx,
                        "parameters": [],
                        "calls": []
                    }
                    functions.append(fn_entry)
                    if is_route:
                        api_endpoints.append(fn_entry)
                continue

            # Imports
            if sline.startswith("import ") or sline.startswith("from ") or "require(" in sline or sline.startswith("package ") or sline.startswith("using "):
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
            "api_endpoints": api_endpoints,
        }