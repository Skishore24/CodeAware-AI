from pathlib import Path
from typing import Dict, List


class CodeChunker:
    """
    Converts repository source files into searchable chunks.
    """

    SUPPORTED_EXTENSIONS = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".cpp",
        ".c",
        ".cs",
        ".go",
        ".rs",
        ".php",
        ".rb",
        ".html",
        ".css",
        ".sql",
        ".md",
    }

    IGNORED_DIRECTORIES = {
        ".git",
        ".venv",
        "venv",
        "env",
        "__pycache__",
        "node_modules",
        "dist",
        "build",
    }

    def __init__(
        self,
        repository_path: Path,
        chunk_size: int = 80,
        overlap: int = 15,
    ):
        self.repository_path = Path(
            repository_path
        )

        self.chunk_size = chunk_size
        self.overlap = overlap

    # ---------------------------------------------------------
    # Find source files
    # ---------------------------------------------------------

    def get_source_files(self) -> List[Path]:

        files = []

        for path in self.repository_path.rglob("*"):

            if not path.is_file():
                continue

            if path.suffix.lower() not in (
                self.SUPPORTED_EXTENSIONS
            ):
                continue

            if any(
                part in self.IGNORED_DIRECTORIES
                for part in path.parts
            ):
                continue

            files.append(path)

        return files

    # ---------------------------------------------------------
    # Read file
    # ---------------------------------------------------------

    def read_file(
        self,
        path: Path
    ) -> str:

        try:

            return path.read_text(
                encoding="utf-8",
                errors="ignore"
            )

        except Exception:

            return ""

    # ---------------------------------------------------------
    # Split source into chunks
    # ---------------------------------------------------------

    def create_chunks(
        self,
        text: str
    ) -> List[str]:

        lines = text.splitlines()

        if not lines:
            return []

        chunks = []

        start = 0

        while start < len(lines):

            end = min(
                start + self.chunk_size,
                len(lines)
            )

            chunk = "\n".join(
                lines[start:end]
            )

            if chunk.strip():

                chunks.append(chunk)

            if end >= len(lines):
                break

            start = max(
                end - self.overlap,
                start + 1
            )

        return chunks

    # ---------------------------------------------------------
    # Chunk entire repository
    # ---------------------------------------------------------

    def chunk_repository(
        self
    ) -> List[Dict]:

        documents = []

        files = self.get_source_files()

        for file_path in files:

            source = self.read_file(
                file_path
            )

            chunks = self.create_chunks(
                source
            )

            relative_path = (
                file_path.relative_to(
                    self.repository_path
                )
            )

            for index, chunk in enumerate(
                chunks
            ):

                documents.append({

                    "id": (
                        f"{relative_path}:"
                        f"chunk:{index}"
                    ),

                    "file": str(
                        relative_path
                    ),

                    "chunk_index": index,

                    "content": chunk,

                })

        return documents