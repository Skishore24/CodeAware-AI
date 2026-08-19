from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.rag_service import RAGService


class SearchAgent(BaseAgent):
    """
    Specialist agent for natural language code search, symbol lookup,
    and repository chunk matching.
    """

    name = "SearchAgent"
    description = "Searches codebase for symbols, functions, endpoints, and implementations."

    def __init__(self, rag_service: Optional[RAGService] = None):
        self.rag_service = rag_service or RAGService()

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query") or input_data.get("question") or input_data.get("task", "")
        repository_name = input_data.get("repository_name")
        repository_path = input_data.get("repository_path")
        filters = input_data.get("filters", {})

        if not query:
            return self.create_response(
                success=False,
                summary="Search query is required.",
                error="Missing search query."
            )

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path or repository_name is required.",
                error="No repository specified for search."
            )

        try:
            results = self.rag_service.search(
                repository_path=repository_path,
                query=query,
                top_k=input_data.get("top_k", 8)
            )

            chunks = results.get("chunks", [])
            matched_files = list(dict.fromkeys([c.get("file", "") for c in chunks if c.get("file")]))
            
            evidence = []
            findings = []
            for c in chunks:
                start_l = c.get("start_line", 1)
                end_l = c.get("end_line", start_l)
                file_name = c.get("file", "unknown")
                symbol = c.get("symbol", "")
                score = round(float(c.get("score", 0.0)), 3)
                
                findings.append({
                    "file": file_name,
                    "symbol": symbol,
                    "start_line": start_l,
                    "end_line": end_l,
                    "score": score,
                    "language": c.get("language", ""),
                    "why_matched": f"Matched search terms '{query[:40]}' with score {score}" + (f" in symbol '{symbol}'" if symbol else ""),
                    "code": c.get("text", "")[:400]
                })

                evidence.append({
                    "file": file_name,
                    "line": start_l,
                    "citation": f"{file_name}:{start_l}-{end_l}",
                    "snippet": c.get("text", "")[:200]
                })

            summary = f"Found {len(chunks)} relevant code locations matching '{query}' across {len(matched_files)} files."

            return self.create_response(
                success=True,
                confidence=0.92 if chunks else 0.40,
                summary=summary,
                findings=findings,
                files=matched_files,
                recommendations=[
                    "Inspect matched functions and citations for implementation details",
                    "Use ImpactAgent to check callers of found symbols"
                ] if chunks else ["Try broader keywords or checking symbol names."],
                evidence=evidence,
                next_actions=["View full file source", "Run impact analysis", "Inspect references"],
                raw_data={"total_matches": len(chunks)}
            )

        except Exception as exc:
            return self.create_response(
                success=False,
                summary=f"Search failed: {exc}",
                error=str(exc)
            )
