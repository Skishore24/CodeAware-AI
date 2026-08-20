from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import ast
import re
import networkx as nx


class CodeKnowledgeGraph:
    """
    Advanced Knowledge Graph representing structural dependencies and call-graphs across a repository.
    
    Node types:
      - repository: Root codebase
      - file: Source file
      - class: Class definition
      - function: Function or method
      - module: Imported module / package
      - endpoint: API route definition
    
    Edge types:
      - contains: Structural containment (repo -> file, class -> method)
      - defines: Symbol declaration (file -> class, file -> function)
      - imports: Dependency import (file -> module)
      - calls: Invocation relationship (function -> function, method -> method)
      - inherits: Class inheritance (class -> class)
      - routes_to: API endpoint binding (endpoint -> function)
    """

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".c", ".cs", ".rs"
    }

    IGNORED_DIRS = {
        ".git", "venv", ".venv", "__pycache__", "node_modules", "dist", "build", ".cache", ".idea", ".vscode", ".pytest_cache"
    }

    def __init__(self):
        self.graph = nx.DiGraph()

    def clear(self):
        self.graph.clear()

    def build(self, repository_path: str | Path) -> Dict[str, Any]:
        self.clear()
        repository = Path(repository_path)

        if not repository.exists():
            raise FileNotFoundError(f"Repository not found: {repository_path}")
        if not repository.is_dir():
            raise ValueError("Repository path must be a directory.")

        repository_name = repository.name
        repository_id = f"repository:{repository_name}"

        self.graph.add_node(
            repository_id,
            type="repository",
            name=repository_name,
            path=str(repository)
        )

        for path in repository.rglob("*"):
            if not path.is_file():
                continue
            if any(part in self.IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                if path.suffix.lower() == ".py":
                    self._process_python_file(repository, repository_id, path)
                else:
                    self._process_generic_file(repository, repository_id, path)

        return self.summary()

    def _process_python_file(self, repository: Path, repository_id: str, file: Path):
        relative_path = str(file.relative_to(repository)).replace("\\", "/")
        file_id = f"file:{relative_path}"

        self.graph.add_node(
            file_id,
            type="file",
            name=file.name,
            path=relative_path,
            language="python"
        )
        self.graph.add_edge(repository_id, file_id, type="contains")

        try:
            source = file.read_text(encoding="utf-8", errors="ignore")
            tree = ast.parse(source)
        except Exception:
            return

        for node in getattr(tree, "body", []):
            if isinstance(node, ast.ClassDef):
                class_id = f"class:{relative_path}:{node.name}"
                self.graph.add_node(
                    class_id,
                    type="class",
                    name=node.name,
                    file=relative_path,
                    line=node.lineno
                )
                self.graph.add_edge(file_id, class_id, type="defines")

                for base in node.bases:
                    base_name = self._get_node_name(base)
                    if base_name:
                        self.graph.add_edge(class_id, f"class:{base_name}", type="inherits")

                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        method_name = f"{node.name}.{item.name}"
                        func_id = f"function:{relative_path}:{method_name}"
                        self.graph.add_node(
                            func_id,
                            type="function",
                            name=method_name,
                            file=relative_path,
                            line=item.lineno
                        )
                        self.graph.add_edge(class_id, func_id, type="contains")
                        self._extract_python_calls(item, func_id)

            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_id = f"function:{relative_path}:{node.name}"
                self.graph.add_node(
                    func_id,
                    type="function",
                    name=node.name,
                    file=relative_path,
                    line=node.lineno
                )
                self.graph.add_edge(file_id, func_id, type="defines")
                self._extract_python_calls(node, func_id)

            elif isinstance(node, ast.Import):
                for alias in node.names:
                    mod_id = f"module:{alias.name}"
                    self.graph.add_node(mod_id, type="module", name=alias.name)
                    self.graph.add_edge(file_id, mod_id, type="imports")

            elif isinstance(node, ast.ImportFrom):
                mod_name = node.module or ""
                mod_id = f"module:{mod_name}"
                self.graph.add_node(mod_id, type="module", name=mod_name)
                self.graph.add_edge(file_id, mod_id, type="imports")

    def _get_node_name(self, node: ast.AST) -> str:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            return f"{self._get_node_name(node.value)}.{node.attr}"
        return ""

    def _extract_python_calls(self, node: ast.AST, caller_id: str):
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                name = self._get_node_name(child.func)
                if name:
                    # Match against existing or target function symbols
                    for n, data in self.graph.nodes(data=True):
                        if data.get("type") == "function" and (data.get("name") == name or data.get("name", "").endswith(f".{name}")):
                            self.graph.add_edge(caller_id, n, type="calls")
                            break

    def _process_generic_file(self, repository: Path, repository_id: str, file: Path):
        relative_path = str(file.relative_to(repository)).replace("\\", "/")
        file_id = f"file:{relative_path}"

        self.graph.add_node(
            file_id,
            type="file",
            name=file.name,
            path=relative_path,
            language=file.suffix.replace(".", "")
        )
        self.graph.add_edge(repository_id, file_id, type="contains")

        try:
            source = file.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return

        lines = source.splitlines()
        for idx, line in enumerate(lines, 1):
            sline = line.strip()
            # Functions
            fn_match = re.search(r"(?:function\s+([A-Za-z0-9_]+)|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|func\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)|fn\s+([A-Za-z0-9_]+))", sline)
            if fn_match:
                fn_name = next(g for g in fn_match.groups() if g is not None)
                func_id = f"function:{relative_path}:{fn_name}"
                self.graph.add_node(
                    func_id,
                    type="function",
                    name=fn_name,
                    file=relative_path,
                    line=idx
                )
                self.graph.add_edge(file_id, func_id, type="defines")

            # Classes
            class_match = re.search(r"\bclass\s+([A-Za-z0-9_]+)", sline)
            if class_match:
                cls_name = class_match.group(1)
                class_id = f"class:{relative_path}:{cls_name}"
                self.graph.add_node(
                    class_id,
                    type="class",
                    name=cls_name,
                    file=relative_path,
                    line=idx
                )
                self.graph.add_edge(file_id, class_id, type="defines")

    def find_symbol(self, symbol: str) -> List[Dict[str, Any]]:
        matches = []
        sym_lower = symbol.lower().strip()
        for node_id, data in self.graph.nodes(data=True):
            name = data.get("name", "")
            if name.lower() == sym_lower or name.lower().endswith(f".{sym_lower}"):
                matches.append({
                    "id": node_id,
                    "name": name,
                    "type": data.get("type"),
                    "file": data.get("file") or data.get("path"),
                    "line": data.get("line"),
                })
        return matches

    def get_callers(self, node_id: str) -> List[Dict[str, Any]]:
        callers = []
        for predecessor in self.graph.predecessors(node_id):
            edge = self.graph.get_edge_data(predecessor, node_id) or {}
            data = self.graph.nodes.get(predecessor, {})
            callers.append({
                "id": predecessor,
                "name": data.get("name", predecessor),
                "type": data.get("type", "unknown"),
                "file": data.get("file") or data.get("path", ""),
                "relationship": edge.get("type", "relies_on")
            })
        return callers

    def get_callees(self, node_id: str) -> List[Dict[str, Any]]:
        callees = []
        for successor in self.graph.successors(node_id):
            edge = self.graph.get_edge_data(node_id, successor) or {}
            data = self.graph.nodes.get(successor, {})
            callees.append({
                "id": successor,
                "name": data.get("name", successor),
                "type": data.get("type", "unknown"),
                "file": data.get("file") or data.get("path", ""),
                "relationship": edge.get("type", "calls")
            })
        return callees

    def export(self) -> Dict[str, Any]:
        """Export nodes and links for visual graph rendering."""
        nodes = []
        for node_id, data in self.graph.nodes(data=True):
            nodes.append({
                "id": node_id,
                "name": data.get("name", node_id),
                "type": data.get("type", "unknown"),
                "file": data.get("file") or data.get("path", ""),
                "line": data.get("line", 1)
            })

        links = []
        for src, dst, data in self.graph.edges(data=True):
            links.append({
                "source": src,
                "target": dst,
                "type": data.get("type", "contains")
            })

        return {
            "nodes": nodes,
            "links": links,
            "summary": self.summary()
        }

    def summary(self) -> Dict[str, Any]:
        node_types = {}
        for _, data in self.graph.nodes(data=True):
            t = data.get("type", "unknown")
            node_types[t] = node_types.get(t, 0) + 1

        edge_types = {}
        for _, _, data in self.graph.edges(data=True):
            t = data.get("type", "unknown")
            edge_types[t] = edge_types.get(t, 0) + 1

        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "node_types": node_types,
            "edge_types": edge_types,
        }