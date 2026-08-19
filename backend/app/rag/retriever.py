from typing import Dict, List, Optional
from app.rag.keyword_search import KeywordSearch
from app.rag.vector_store import TFIDFVectorStore


class HybridRetriever:
    """
    Hybrid Retriever ranking code chunks using Keyword exact matches,
    TF-IDF semantic vector similarity, symbol matching, and path weighting.
    """

    def __init__(self, documents: List[Dict]):
        self.documents = documents
        self.keyword_search = KeywordSearch(documents)
        self.vector_store = TFIDFVectorStore()
        self.vector_store.build(documents)

    def retrieve(self, query: str, top_k: int = 8, filters: Optional[Dict] = None) -> List[Dict]:
        if not self.documents:
            return []

        query_lower = query.lower()
        keyword_results = self.keyword_search.search(query, top_k=top_k * 3)
        vector_results = self.vector_store.search(query, top_k=top_k * 3)

        combined: Dict[str, Dict] = {}

        for res in keyword_results:
            doc_id = res["id"]
            combined.setdefault(doc_id, {**res, "keyword_score": 0.0, "vector_score": 0.0})
            combined[doc_id]["keyword_score"] = float(res.get("keyword_score", 0.0))

        for res in vector_results:
            doc_id = res["id"]
            combined.setdefault(doc_id, {**res, "keyword_score": 0.0, "vector_score": 0.0})
            combined[doc_id]["vector_score"] = float(res.get("vector_score", 0.0))

        # Re-score with symbol match and path match boosts
        ranked = []
        for doc in combined.values():
            file_name = doc.get("file", "").lower()
            symbol = (doc.get("symbol") or "").lower()
            content = (doc.get("content") or "").lower()

            kw_s = doc.get("keyword_score", 0.0)
            vec_s = doc.get("vector_score", 0.0)

            # Boosts
            symbol_boost = 0.35 if (symbol and symbol in query_lower) else 0.0
            path_boost = 0.20 if any(part in file_name for part in query_lower.split() if len(part) > 3) else 0.0

            final_score = (kw_s * 0.35) + (vec_s * 0.45) + symbol_boost + path_boost
            doc["retrieval_score"] = round(final_score, 4)
            doc["score"] = doc["retrieval_score"]
            doc["text"] = doc.get("raw_code", doc.get("content", ""))

            # Filter checking
            if filters:
                lang_f = filters.get("language")
                if lang_f and doc.get("language", "").lower() != lang_f.lower():
                    continue
                path_f = filters.get("file_path")
                if path_f and path_f.lower() not in file_name:
                    continue

            ranked.append(doc)

        ranked.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return ranked[:top_k]