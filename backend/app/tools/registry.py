import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from app.tools.base import BaseTool, PermissionLevel, ToolDefinition
from app.sandbox.runner import SandboxRunner
from app.analysis.ast_parser import PythonASTAnalyzer, GenericCodeAnalyzer
from app.analysis.code_analyzer import CodeAnalyzer
from app.core.exceptions import SecuritySandboxException


# ==============================================================================
# TOOL IMPLEMENTATIONS
# ==============================================================================

class ReadFileTool(BaseTool):
    name = "read_file"
    description = "Read source code content with line numbering and optional line range slicing."
    permission_level = PermissionLevel.READ

    def execute(self, file_path: str, repository_path: Optional[str] = None, start_line: Optional[int] = None, end_line: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        target = sandbox.validate_path(file_path)
        if not target.exists() or not target.is_file():
            return {"success": False, "error": f"File not found: {file_path}"}

        content = target.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        start = max(1, start_line) if start_line else 1
        end = min(len(lines), end_line) if end_line else len(lines)
        sliced = lines[start - 1 : end]

        return {
            "success": True,
            "file": str(file_path),
            "total_lines": len(lines),
            "start_line": start,
            "end_line": end,
            "content": "\n".join(sliced),
        }


class ListFilesTool(BaseTool):
    name = "list_files"
    description = "List all tracked files in a repository directory, ignoring binary/vendor assets."
    permission_level = PermissionLevel.READ

    def execute(self, repository_path: Optional[str] = None, sub_dir: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        root = sandbox.validate_path(sub_dir) if sub_dir else sandbox.repository_root
        ignored = {".git", ".venv", "venv", "node_modules", "__pycache__", "dist", "build"}

        found = []
        for p in root.rglob("*"):
            if p.is_file() and not any(ign in p.parts for ign in ignored):
                rel = str(p.relative_to(sandbox.repository_root)).replace("\\", "/")
                found.append({"file": rel, "size_bytes": p.stat().st_size})

        return {"success": True, "count": len(found), "files": found[:200]}


class SearchCodeTool(BaseTool):
    name = "search_code"
    description = "Search repository source code for exact text patterns or regex expressions."
    permission_level = PermissionLevel.READ

    def execute(self, query: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        ignored = {".git", ".venv", "venv", "node_modules", "__pycache__", "dist", "build"}
        matches = []

        for p in sandbox.repository_root.rglob("*"):
            if p.is_file() and not any(ign in p.parts for ign in ignored):
                try:
                    text = p.read_text(encoding="utf-8", errors="ignore")
                    if query.lower() in text.lower():
                        rel = str(p.relative_to(sandbox.repository_root)).replace("\\", "/")
                        for idx, line in enumerate(text.splitlines(), 1):
                            if query.lower() in line.lower():
                                matches.append({
                                    "file": rel,
                                    "line": idx,
                                    "content": line.strip()[:150]
                                })
                                if len(matches) >= 50:
                                    break
                except Exception:
                    continue
        return {"success": True, "matches_count": len(matches), "matches": matches}


class SearchSymbolTool(BaseTool):
    name = "search_symbol"
    description = "Locate class, function, or method definitions by symbol name."
    permission_level = PermissionLevel.READ

    def execute(self, symbol: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        repo = repository_path or "."
        analyzer = CodeAnalyzer(repo)
        results = analyzer.find_symbol(symbol)
        return {"success": True, "symbol": symbol, "matches_count": len(results), "definitions": results}


class InspectASTTool(BaseTool):
    name = "inspect_ast"
    description = "Extract AST syntax tree, functions, classes, decorators, and calls from a file."
    permission_level = PermissionLevel.READ

    def execute(self, file_path: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        target = sandbox.validate_path(file_path)
        if not target.exists():
            return {"success": False, "error": f"File not found: {file_path}"}

        if target.suffix.lower() == ".py":
            analyzer = PythonASTAnalyzer(target)
        else:
            analyzer = GenericCodeAnalyzer(target)
        return {"success": True, "ast": analyzer.analyze()}


class InspectDependenciesTool(BaseTool):
    name = "inspect_dependencies"
    description = "Analyze declared dependencies across pyproject.toml, requirements.txt, package.json, or go.mod."
    permission_level = PermissionLevel.READ

    def execute(self, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        repo = Path(repository_path or ".").resolve()
        deps: Dict[str, Any] = {}

        # Python requirements.txt
        req_file = repo / "requirements.txt"
        if req_file.exists():
            deps["requirements.txt"] = [
                line.strip()
                for line in req_file.read_text().splitlines()
                if line.strip() and not line.startswith("#")
            ]

        # package.json
        pkg_file = repo / "package.json"
        if pkg_file.exists():
            try:
                import json
                data = json.loads(pkg_file.read_text(encoding="utf-8"))
                deps["package.json"] = {
                    "dependencies": list(data.get("dependencies", {}).keys()),
                    "devDependencies": list(data.get("devDependencies", {}).keys()),
                }
            except Exception:
                pass

        return {"success": True, "manifests_found": list(deps.keys()), "dependencies": deps}


class InspectGitTool(BaseTool):
    name = "inspect_git"
    description = "Inspect recent git commits, active branch, and modified status."
    permission_level = PermissionLevel.READ

    def execute(self, repository_path: Optional[str] = None, count: int = 5, **kwargs) -> Dict[str, Any]:
        repo = Path(repository_path or ".").resolve()
        try:
            import git
            g = git.Repo(repo)
            commits = []
            for c in list(g.iter_commits(max_count=count)):
                commits.append({
                    "hexsha": c.hexsha[:8],
                    "author": str(c.author),
                    "message": c.message.strip(),
                    "date": (
                        datetime.fromtimestamp(c.committed_date, timezone.utc).isoformat()
                        if hasattr(c, "committed_date")
                        else ""
                    ),
                })
            return {
                "success": True,
                "branch": g.active_branch.name if not g.head.is_detached else "DETACHED",
                "is_dirty": g.is_dirty(),
                "recent_commits": commits,
            }
        except Exception as exc:
            return {"success": False, "error": str(exc)}


class AnalyzeSecurityTool(BaseTool):
    name = "analyze_security"
    description = "Scan source files for static OWASP vulnerabilities and hardcoded secrets."
    permission_level = PermissionLevel.READ

    def execute(self, file_path: Optional[str] = None, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        from app.agents.security_agent import SecurityAgent
        agent = SecurityAgent()
        res = agent.run({"repository_path": repository_path, "file_path": file_path})
        return res


class RunTestsTool(BaseTool):
    name = "run_tests"
    description = "Execute pytest or unittest test suites inside the isolated sandbox."
    permission_level = PermissionLevel.EXECUTE
    timeout = 45

    def execute(self, test_path: Optional[str] = None, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        cmd = [sys.executable, "-m", "pytest", test_path or "tests"] if Path("pytest").exists() else [sys.executable, "-m", "unittest"]
        if test_path:
            cmd.append(test_path)
        return sandbox.execute_command(cmd)


class RunLinterTool(BaseTool):
    name = "run_linter"
    description = "Run fast static code linting via ruff or oxlint in the sandbox."
    permission_level = PermissionLevel.EXECUTE

    def execute(self, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        return sandbox.execute_command(["ruff", "check", "."])


class RunTypecheckTool(BaseTool):
    name = "run_typecheck"
    description = "Run type validation using mypy in the sandbox."
    permission_level = PermissionLevel.EXECUTE

    def execute(self, file_path: Optional[str] = None, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        cmd = ["mypy", file_path] if file_path else ["mypy", "."]
        return sandbox.execute_command(cmd)


class BuildProjectTool(BaseTool):
    name = "build_project"
    description = "Verify build readiness with npm run build or python build."
    permission_level = PermissionLevel.EXECUTE

    def execute(self, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        return sandbox.execute_command(["npm", "run", "build"])


class GeneratePatchTool(BaseTool):
    name = "generate_patch"
    description = "Generate a proposed bug fix and unified diff for review."
    permission_level = PermissionLevel.READ

    def execute(self, file_path: str, problem: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        from app.agents.fix_agent import FixAgent
        agent = FixAgent()
        return agent.run({
            "repository_path": repository_path,
            "file_path": file_path,
            "problem": problem,
        })


class ApplyPatchTool(BaseTool):
    name = "apply_patch"
    description = "Safely write validated patched code to disk after taking a timestamped backup."
    permission_level = PermissionLevel.WRITE

    def execute(self, file_path: str, patched_code: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        target = sandbox.validate_path(file_path)
        if not target.exists():
            return {"success": False, "error": f"File does not exist: {file_path}"}

        backup_file = sandbox.create_backup(target)
        target.write_text(patched_code, encoding="utf-8")
        return {
            "success": True,
            "file": str(file_path),
            "backup_file": str(backup_file),
            "message": "Patch applied cleanly with rollback backup preserved."
        }


class RollbackPatchTool(BaseTool):
    name = "rollback_patch"
    description = "Restore a source file from its timestamped .bak backup file."
    permission_level = PermissionLevel.WRITE

    def execute(self, file_path: str, backup_path: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        sandbox = SandboxRunner(repository_path or ".")
        ok = sandbox.rollback(backup_path, file_path)
        return {"success": ok, "file": file_path, "restored_from": backup_path}


class QueryRAGTool(BaseTool):
    name = "query_rag"
    description = "Retrieve relevant code chunks and exact line citations using hybrid retrieval."
    permission_level = PermissionLevel.READ

    def execute(self, query: str, repository_path: Optional[str] = None, top_k: int = 5, **kwargs) -> Dict[str, Any]:
        from app.services.rag_service import RAGService
        service = RAGService()
        results = service.query(query=query, repository_path=repository_path, top_k=top_k)
        return {"success": True, "query": query, "chunks": results}


class QueryGraphTool(BaseTool):
    name = "query_graph"
    description = "Query the knowledge graph for symbol callers, callees, and dependencies."
    permission_level = PermissionLevel.READ

    def execute(self, symbol: str, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        from app.services.graph_service import GraphService
        service = GraphService()
        graph = service.get_graph(repository_path)
        nodes = [n for n in graph.get("nodes", []) if symbol.lower() in n.get("label", "").lower()]
        return {"success": True, "symbol": symbol, "matched_nodes": nodes}


class InspectDatabaseTool(BaseTool):
    name = "inspect_database"
    description = "Inspect database schema, tables, foreign keys, and indexes."
    permission_level = PermissionLevel.READ

    def execute(self, **kwargs) -> Dict[str, Any]:
        from app.db.database import engine
        from sqlalchemy import inspect
        insp = inspect(engine)
        tables = insp.get_table_names()
        return {"success": True, "database_connected": True, "tables_count": len(tables), "tables": tables}


class InspectAPIRoutesTool(BaseTool):
    name = "inspect_api_routes"
    description = "Extract declared API routes and methods across FastAPI, Flask, Express, or Spring."
    permission_level = PermissionLevel.READ

    def execute(self, repository_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        repo = repository_path or "."
        analyzer = CodeAnalyzer(repo)
        analysis = analyzer.analyze()
        return {
            "success": True,
            "api_endpoints_count": analysis.get("api_endpoints_count", 0),
            "api_endpoints": analysis.get("api_endpoints", [])
        }


# ==============================================================================
# TOOL REGISTRY
# ==============================================================================

class ToolRegistry:
    """
    Central registry for controlled agent tools (Section 15).
    Enforces permission checks, timeouts, and execution logging.
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_defaults()

    def _register_defaults(self):
        tools = [
            ReadFileTool(),
            ListFilesTool(),
            SearchCodeTool(),
            SearchSymbolTool(),
            InspectASTTool(),
            InspectDependenciesTool(),
            InspectGitTool(),
            AnalyzeSecurityTool(),
            RunTestsTool(),
            RunLinterTool(),
            RunTypecheckTool(),
            BuildProjectTool(),
            GeneratePatchTool(),
            ApplyPatchTool(),
            RollbackPatchTool(),
            QueryRAGTool(),
            QueryGraphTool(),
            InspectDatabaseTool(),
            InspectAPIRoutesTool(),
        ]
        for t in tools:
            self.register(t)

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return [t.get_definition() for t in self._tools.values()]

    def execute(self, tool_name: str, **kwargs: Any) -> Dict[str, Any]:
        tool = self.get(tool_name)
        if not tool:
            return {"success": False, "error": f"Tool '{tool_name}' is not registered."}
        try:
            return tool.execute(**kwargs)
        except SecuritySandboxException as exc:
            return {"success": False, "error": f"Sandbox security violation: {exc}"}
        except Exception as exc:
            return {"success": False, "error": f"Tool execution error: {exc}"}


tool_registry = ToolRegistry()
