from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.base_agent import BaseAgent
from app.services.rag_service import RAGService
from app.ai.reasoner import CodeAwareReasoner
from app.config.settings import CLONED_REPOSITORIES_DIR


class RAGAgent(BaseAgent):
    """
    RAG Agent retrieving relevant repository chunks, AST symbols,
    and synthesizing citations and explanations using the CodeAware Local Reasoner.
    """

    name = "RAGAgent"
    description = "Retrieves relevant repository chunks and produces structured answers with source citations."

    def __init__(self, rag_service: Optional[RAGService] = None, reasoner: Optional[CodeAwareReasoner] = None):
        self.rag_service = rag_service or RAGService()
        self.reasoner = reasoner or CodeAwareReasoner()

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        question = input_data.get("question") or input_data.get("task", "")
        top_k = input_data.get("top_k", 8)

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path is required.",
                error="Missing repository."
            )

        if not question:
            return self.create_response(
                success=False,
                summary="Question is required.",
                error="Missing question."
            )

        repo = Path(repository_path)
        if not repo.exists():
            return self.create_response(
                success=False,
                summary=f"Repository not found at {repository_path}",
                error="Repository does not exist."
            )

        try:
            retrieval = self.rag_service.search(
                repository_path=str(repo),
                query=question,
                top_k=top_k
            )

            context = retrieval.get("context", "")
            chunks = retrieval.get("chunks", [])

            # Generate structured response with citations
            answer = self.reasoner.generate(
                prompt=question,
                context=context
            )

            matched_files = list(dict.fromkeys([c.get("file", "") for c in chunks if c.get("file")]))
            citations = self.reasoner.extract_citations(context)

            findings = []
            for c in chunks:
                findings.append({
                    "file": c.get("file"),
                    "symbol": c.get("symbol"),
                    "start_line": c.get("start_line", 1),
                    "end_line": c.get("end_line", 1),
                    "score": round(float(c.get("score", 0.0)), 3),
                    "code_snippet": c.get("text", "")[:250]
                })

            summary = f"Retrieved {len(chunks)} code chunks from {len(matched_files)} files to answer: '{question[:50]}'."

            return self.create_response(
                success=True,
                confidence=0.92 if chunks else 0.50,
                summary=summary,
                findings=findings,
                files=matched_files,
                recommendations=[
                    "Inspect line citations in the code editor",
                    "Run impact analysis on referenced symbols"
                ] if chunks else ["Try searching for specific function or class names."],
                evidence=[{"citation": f"{c['file']}:{c['start']}-{c['end']}"} for c in citations[:8]],
                next_actions=["View full source files", "Ask follow-up questions on symbols"],
                raw_data={
                    "answer": answer,
                    "model_info": self.reasoner.get_model_info(),
                    "chunks": chunks
                }
            )

        except Exception as exc:
            return self.create_response(
                success=False,
                summary=f"RAG reasoning failed: {exc}",
                error=str(exc)
            )