from typing import Dict, List

from app.rag.keyword_search import (
    KeywordSearch
)

from app.rag.vector_store import (
    TFIDFVectorStore
)


class HybridRetriever:

    def __init__(
        self,
        documents: List[Dict]
    ):

        self.documents = documents

        self.keyword_search = (
            KeywordSearch(
                documents
            )
        )

        self.vector_store = (
            TFIDFVectorStore()
        )

        self.vector_store.build(
            documents
        )

    # ---------------------------------------------------------
    # Search
    # ---------------------------------------------------------

    def retrieve(
        self,
        query: str,
        top_k: int = 8
    ) -> List[Dict]:

        keyword_results = (
            self.keyword_search.search(
                query,
                top_k=top_k * 2
            )
        )

        vector_results = (
            self.vector_store.search(
                query,
                top_k=top_k * 2
            )
        )

        combined = {}

        # -----------------------------------------------------
        # Add keyword results
        # -----------------------------------------------------

        for result in keyword_results:

            document_id = result["id"]

            combined.setdefault(
                document_id,
                {
                    **result,
                    "keyword_score": 0,
                    "vector_score": 0,
                }
            )

            combined[
                document_id
            ]["keyword_score"] = result.get(
                "keyword_score",
                0
            )

        # -----------------------------------------------------
        # Add vector results
        # -----------------------------------------------------

        for result in vector_results:

            document_id = result["id"]

            combined.setdefault(
                document_id,
                {
                    **result,
                    "keyword_score": 0,
                    "vector_score": 0,
                }
            )

            combined[
                document_id
            ]["vector_score"] = result.get(
                "vector_score",
                0
            )

        # -----------------------------------------------------
        # Combined ranking
        # -----------------------------------------------------

        results = []

        for document in combined.values():

            keyword_score = float(
                document.get(
                    "keyword_score",
                    0
                )
            )

            vector_score = float(
                document.get(
                    "vector_score",
                    0
                )
            )

            final_score = (
                keyword_score * 0.4
                +
                vector_score * 0.6
            )

            document[
                "retrieval_score"
            ] = final_score

            results.append(
                document
            )

        results.sort(
            key=lambda x: x[
                "retrieval_score"
            ],
            reverse=True
        )

        return results[:top_k]