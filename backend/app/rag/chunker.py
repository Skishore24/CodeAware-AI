from pathlib import Path
from typing import Dict, List, Optional
import re


class CodeChunker:
    """
    Splits repository source files into semantic, symbol-aware searchable chunks
    with metadata (file, language, symbol, start_line, end_line, chunk_type).
    """

    SUPPORTED_EXTENSIONS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h",
        ".cs", ".go", ".rs", ".php", ".rb", ".html", ".css", ".sql", ".md", ".json", ".yaml", ".yml"
    }

    IGNORED_DIRECTORIES = {
        ".git", ".venv", "venv", "env", "__pycache__", "node_modules",
        "dist", "build", "coverage", ".pytest_cache", ".idea", ".vscode", "out", "target"
    }

    def __init__(
        self,
        repository_path: Optional[Path | str] = None,
        chunk_size: int = 50,
        overlap: int = 12,
    ):
        self.repository_path = Path(repository_path) if repository_path else None
        self.chunk_size = chunk_size
        self.overlap = overlap

    def get_source_files(self) -> List[Path]:
        if not self.repository_path or not self.repository_path.exists():
            return []

        files = []
        for path in self.repository_path.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue
            if any(part in self.IGNORED_DIRECTORIES for part in path.parts):
                continue
            files.append(path)
        return files

    def read_file(self, path: Path) -> str:
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    def chunk_repository(self, repository_path: Optional[Path | str] = None) -> List[Dict]:
        if repository_path is not None:
            self.repository_path = Path(repository_path)

        if not self.repository_path:
            return []

        documents = []
        files = self.get_source_files()
        repo_name = self.repository_path.name

        for file_path in files:
            source = self.read_file(file_path)
            lines = source.splitlines()
            if not lines:
                continue

            rel_path = str(file_path.relative_to(self.repository_path)).replace("\\", "/")
            ext = file_path.suffix.lower()
            lang = ext.replace(".", "")

            start = 0
            chunk_idx = 0
            while start < len(lines):
                end = min(start + self.chunk_size, len(lines))
                chunk_lines = lines[start:end]
                chunk_text = "\n".join(chunk_lines)

                current_symbol = ""
                current_symbol_type = ""

                # Detect symbol in this chunk
                for cl in chunk_lines:
                    scl = cl.strip()
                    if scl.startswith("def ") or scl.startswith("async def "):
                        current_symbol = scl.split("(")[0].replace("async def ", "").replace("def ", "").strip()
                        current_symbol_type = "function"
                        break
                    elif scl.startswith("class "):
                        current_symbol = scl.split("(")[0].split(":")[0].replace("class ", "").strip()
                        current_symbol_type = "class"
                        break
                    elif scl.startswith("function ") or "=>" in scl:
                        match = re.search(r"(?:function\s+([A-Za-z0-9_]+)|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=)", scl)
                        if match:
                            current_symbol = next(g for g in match.groups() if g is not None)
                            current_symbol_type = "function"
                            break

                if chunk_text.strip():
                    documents.append({
                        "id": f"{rel_path}:chunk:{chunk_idx}",
                        "repository": repo_name,
                        "file": rel_path,
                        "language": lang,
                        "symbol": current_symbol,
                        "symbol_type": current_symbol_type or "code",
                        "start_line": start + 1,
                        "end_line": end,
                        "chunk_index": chunk_idx,
                        "content": f"FILE: {rel_path} (Lines {start + 1}-{end})\n" + chunk_text,
                        "raw_code": chunk_text
                    })
                    chunk_idx += 1

                if end >= len(lines):
                    break
                start = max(end - self.overlap, start + 1)

        return documents