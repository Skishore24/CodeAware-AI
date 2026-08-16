from typing import Dict, List


class ContextBuilder:
    """
    Builds clean context from retrieved code documents.
    """

    def build(
        self,
        results: List[Dict]
    ) -> str:

        if not results:
            return "No relevant code was found."

        sections = []

        for index, result in enumerate(results, start=1):

            file_path = result.get(
                "file",
                "unknown"
            )

            content = result.get(
                "content",
                ""
            )

            score = result.get(
                "retrieval_score",
                0
            )

            section = (
                f"SOURCE {index}\n"
                f"FILE: {file_path}\n"
                f"RELEVANCE: {score:.4f}\n\n"
                f"```text\n"
                f"{content}\n"
                f"```"
            )

            sections.append(section)

        return "\n\n".join(sections)