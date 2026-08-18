from typing import Any, Dict, List


class ContextBuilder:
    """
    Converts retrieved repository chunks
    into structured context for the AI reasoner.
    """

    def __init__(
        self,
        max_chunks: int = 8,
        max_characters: int = 24000
    ):

        self.max_chunks = max_chunks

        self.max_characters = (
            max_characters
        )

    # =========================================================
    # BUILD
    # =========================================================

    def build(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        if not results:

            return {
                "context": "",
                "sources": [],
                "chunk_count": 0
            }

        selected = results[
            :self.max_chunks
        ]

        sections = []

        sources = []

        total_characters = 0

        for index, item in enumerate(
            selected,
            start=1
        ):

            file_name = (
                item.get(
                    "file",
                    "Unknown"
                )
            )

            content = (
                item.get(
                    "content",
                    ""
                )
            )

            start_line = (
                item.get(
                    "start_line"
                )
            )

            end_line = (
                item.get(
                    "end_line"
                )
            )

            score = (
                item.get(
                    "score",
                    0.0
                )
            )

            section = (
                f"--- SOURCE {index} ---\n"
                f"File: {file_name}\n"
                f"Lines: "
                f"{start_line} - "
                f"{end_line}\n"
                f"Score: {score}\n\n"
                f"{content}\n"
                f"--- END SOURCE {index} ---"
            )

            if (
                total_characters
                + len(section)
                > self.max_characters
            ):
                break

            sections.append(
                section
            )

            sources.append({
                "file":
                    file_name,

                "start_line":
                    start_line,

                "end_line":
                    end_line,

                "score":
                    score
            })

            total_characters += (
                len(section)
            )

        return {
            "context":
                "\n\n".join(
                    sections
                ),

            "sources":
                sources,

            "chunk_count":
                len(sections)
        }

    # =========================================================
    # SIMPLE TEXT
    # =========================================================

    def build_text(
        self,
        results
    ) -> str:

        result = self.build(
            results
        )

        return result[
            "context"
        ]