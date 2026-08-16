from pathlib import Path
from typing import Dict

from app.rag.chunker import CodeChunker
from app.rag.retriever import HybridRetriever
from app.rag.context_builder import (
    ContextBuilder
)


class RAGService:

    def __init__(
        self,
        repository_path: Path
    ):

        self.repository_path = Path(
            repository_path
        )

        self.chunker = CodeChunker(
            self.repository_path
        )

        self.context_builder = (
            ContextBuilder()
        )

        self.documents = (
            self.chunker.chunk_repository()
        )

        self.retriever = HybridRetriever(
            self.documents
        )

    # ---------------------------------------------------------
    # Retrieve
    # ---------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int = 8
    ) -> Dict:

        results = self.retriever.retrieve(
            query=query,
            top_k=top_k
        )

        context = (
            self.context_builder.build(
                results
            )
        )

        return {

            "query": query,

            "total_documents": len(
                self.documents
            ),

            "results": results,

            "context": context,

        }