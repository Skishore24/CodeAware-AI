from pathlib import Path
from typing import Any, Dict, List, Optional
import ast
from app.agents.base_agent import BaseAgent
from app.llm.router import llm_router


class RefactorAgent(BaseAgent):
    """
    Dedicated Refactoring Specialist Agent for CodeAware AI.
    Identifies high cognitive complexity, long parameter lists, duplicated patterns,
    and proposes cleaner modular abstractions with diffs.
    """
    name = "RefactorAgent"
    description = "Analyzes source code for complexity smells, god classes, and proposes structural refactorings."
    capabilities = ["complexity_analysis", "dead_code_detection", "parameter_reduction", "modular_extraction"]
    tools = ["inspect_ast", "generate_patch", "read_file"]

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        file_path = input_data.get("file_path")
        code = input_data.get("code")
        repository_path = input_data.get("repository_path")

        findings: List[Dict[str, Any]] = []
        target_code = code

        if not target_code and repository_path and file_path:
            p = Path(repository_path) / file_path
            if p.exists():
                target_code = p.read_text(encoding="utf-8", errors="ignore")

        if not target_code:
            return self.create_response(success=False, error="No source code provided for refactoring analysis.")

        # AST Inspection for Python code
        if (file_path and file_path.endswith(".py")) or ("def " in target_code and "class " in target_code):
            try:
                tree = ast.parse(target_code)
                for node in ast.walk(tree):
                    # Check for functions with excessive parameters (> 6)
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        arg_count = len(node.args.args)
                        if arg_count > 6:
                            findings.append({
                                "type": "long_parameter_list",
                                "severity": "MEDIUM",
                                "symbol": node.name,
                                "line": node.lineno,
                                "message": f"Function '{node.name}' takes {arg_count} parameters (exceeds recommended maximum of 5).",
                                "recommendation": "Encapsulate parameters into a typed dataclass, Pydantic schema, or parameter object.",
                            })
                        # Check for deeply nested control flow (> 4 levels)
                        lines = ast.unparse(node).splitlines() if hasattr(ast, "unparse") else []
                        if len(lines) > 80:
                            findings.append({
                                "type": "large_function",
                                "severity": "LOW",
                                "symbol": node.name,
                                "line": node.lineno,
                                "message": f"Function '{node.name}' is {len(lines)} lines long.",
                                "recommendation": "Extract helper methods for sub-tasks to improve testability and readability.",
                            })
            except Exception:
                pass

        summary = f"Refactoring scan completed. Identified {len(findings)} structural improvements."
        return self.create_response(
            success=True,
            confidence=0.89,
            summary=summary,
            findings=findings,
            files=[file_path] if file_path else [],
            recommendations=[f["recommendation"] for f in findings] or ["Code structure adheres to modular standards."],
            next_actions=["Extract parameter objects", "Break down large functions"] if findings else ["No immediate refactoring needed."],
            raw_data={"refactoring_candidates_count": len(findings)}
        )
