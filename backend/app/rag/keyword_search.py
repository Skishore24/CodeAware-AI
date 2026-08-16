import re
from typing import Dict, List


class KeywordSearch:

    def __init__(
        self,
        documents: List[Dict]
    ):
        self.documents = documents

    # ---------------------------------------------------------
    # Tokenize
    # ---------------------------------------------------------

    def tokenize(
        self,
        text: str
    ) -> List[str]:

        return re.findall(
            r"[a-zA-Z_][a-zA-Z0-9_]*",
            text.lower()
        )

    # ---------------------------------------------------------
    # Search
    # ---------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int = 10
    ) -> List[Dict]:

        query_tokens = set(
            self.tokenize(query)
        )

        results = []

        for document in self.documents:

            content = document.get(
                "content",
                ""
            )

            file_name = document.get(
                "file",
                ""
            )

            content_tokens = set(
                self.tokenize(
                    content
                )
            )

            file_tokens = set(
                self.tokenize(
                    file_name
                )
            )

            content_matches = (
                query_tokens
                & content_tokens
            )

            file_matches = (
                query_tokens
                & file_tokens
            )

            score = (
                len(content_matches)
                +
                len(file_matches) * 2
            )

            if score > 0:

                results.append({

                    **document,

                    "keyword_score": score,

                })

        results.sort(
            key=lambda x: x[
                "keyword_score"
            ],
            reverse=True
        )

        return results[:top_k]