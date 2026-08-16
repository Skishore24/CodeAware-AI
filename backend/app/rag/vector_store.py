from typing import Dict, List

from sklearn.feature_extraction.text import (
    TfidfVectorizer
)

from sklearn.metrics.pairwise import (
    cosine_similarity
)


class TFIDFVectorStore:

    def __init__(self):

        self.vectorizer = (
            TfidfVectorizer(
                lowercase=True,
                stop_words="english"
            )
        )

        self.documents: List[Dict] = []

        self.matrix = None

    # ---------------------------------------------------------
    # Build index
    # ---------------------------------------------------------

    def build(
        self,
        documents: List[Dict]
    ):

        self.documents = documents

        if not documents:

            self.matrix = None

            return

        texts = [
            document.get(
                "content",
                ""
            )
            for document in documents
        ]

        self.matrix = (
            self.vectorizer.fit_transform(
                texts
            )
        )

    # ---------------------------------------------------------
    # Search
    # ---------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int = 10
    ) -> List[Dict]:

        if (
            not self.documents
            or self.matrix is None
        ):

            return []

        query_vector = (
            self.vectorizer.transform(
                [query]
            )
        )

        similarities = (
            cosine_similarity(
                query_vector,
                self.matrix
            )[0]
        )

        ranked_indices = (
            similarities.argsort()[::-1]
        )

        results = []

        for index in ranked_indices:

            score = float(
                similarities[index]
            )

            if score <= 0:
                continue

            document = dict(
                self.documents[index]
            )

            document[
                "vector_score"
            ] = score

            results.append(
                document
            )

            if len(results) >= top_k:
                break

        return results