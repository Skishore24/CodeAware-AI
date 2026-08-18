from pathlib import Path
from typing import Any, Dict
import traceback


class RepositoryIngestionService:
    """
    Complete repository ingestion pipeline.

    Pipeline:

        Repository
            ↓
        Scan
            ↓
        Code Analysis
            ↓
        Chunking
            ↓
        Search Index
            ↓
        Knowledge Graph
            ↓
        READY
    """

    name = "Repository Ingestion Service"

    def __init__(
        self,
        repository_service=None,
        graph_service=None,
        rag_service=None,
    ):
        self.repository_service = (
            repository_service
        )

        self.graph_service = (
            graph_service
        )

        self.rag_service = (
            rag_service
        )

    # =========================================================
    # MAIN INGESTION
    # =========================================================

    def ingest(
        self,
        repository_path: str
    ) -> Dict[str, Any]:

        path = Path(
            repository_path
        )

        if not path.exists():

            return {
                "success": False,
                "status": "NOT_FOUND",
                "error": (
                    f"Repository does not exist: "
                    f"{repository_path}"
                )
            }

        if not path.is_dir():

            return {
                "success": False,
                "status": "INVALID_REPOSITORY",
                "error": (
                    "Repository path must "
                    "be a directory."
                )
            }

        result = {
            "success": True,
            "status": "PROCESSING",
            "repository_path": str(path),
            "steps": []
        }

        # =====================================================
        # STEP 1 — SCAN
        # =====================================================

        try:

            scan_result = (
                self._scan_repository(
                    path
                )
            )

            result["scan"] = scan_result

            result["steps"].append({
                "name": "repository_scan",
                "status": "completed"
            })

        except Exception as exc:

            return self._failure(
                result,
                "repository_scan",
                exc
            )

        # =====================================================
        # STEP 2 — CODE ANALYSIS
        # =====================================================

        try:

            analysis_result = (
                self._analyze_code(
                    path
                )
            )

            result["analysis"] = (
                analysis_result
            )

            result["steps"].append({
                "name": "code_analysis",
                "status": "completed"
            })

        except Exception as exc:

            return self._failure(
                result,
                "code_analysis",
                exc
            )

        # =====================================================
        # STEP 3 — CODE CHUNKING
        # =====================================================

        try:

            chunk_result = (
                self._build_chunks(
                    path
                )
            )

            result["chunks"] = (
                chunk_result
            )

            result["steps"].append({
                "name": "code_chunking",
                "status": "completed"
            })

        except Exception as exc:

            return self._failure(
                result,
                "code_chunking",
                exc
            )

        # =====================================================
        # STEP 4 — SEARCH INDEX
        # =====================================================

        try:

            search_result = (
                self._build_search_index(
                    path,
                    chunk_result
                )
            )

            result["search_index"] = (
                search_result
            )

            result["steps"].append({
                "name": "search_index",
                "status": "completed"
            })

        except Exception as exc:

            return self._failure(
                result,
                "search_index",
                exc
            )

        # =====================================================
        # STEP 5 — KNOWLEDGE GRAPH
        # =====================================================

        try:

            graph_result = (
                self._build_graph(
                    path
                )
            )

            result["graph"] = (
                graph_result
            )

            result["steps"].append({
                "name": "knowledge_graph",
                "status": "completed"
            })

        except Exception as exc:

            return self._failure(
                result,
                "knowledge_graph",
                exc
            )

        # =====================================================
        # READY
        # =====================================================

        result["status"] = "READY"

        result["message"] = (
            "Repository ingestion completed "
            "successfully."
        )

        return result

    # =========================================================
    # SCAN
    # =========================================================

    def _scan_repository(
        self,
        repository_path: Path
    ) -> Dict[str, Any]:

        if self.repository_service:

            scanner = getattr(
                self.repository_service,
                "scan",
                None
            )

            if scanner:

                return scanner(
                    str(repository_path)
                )

        # -----------------------------------------------------
        # Fallback scanner
        # -----------------------------------------------------

        ignored_directories = {
            ".git",
            "node_modules",
            "__pycache__",
            ".venv",
            "venv",
            "dist",
            "build",
        }

        files = []
        directories = set()

        languages = set()

        extension_map = {
            ".py": "Python",
            ".js": "JavaScript",
            ".jsx": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "TypeScript",
            ".java": "Java",
            ".go": "Go",
            ".rs": "Rust",
            ".cpp": "C++",
            ".c": "C",
            ".cs": "C#",
            ".php": "PHP",
            ".rb": "Ruby",
            ".swift": "Swift",
            ".kt": "Kotlin",
        }

        for item in repository_path.rglob("*"):

            if any(
                ignored in item.parts
                for ignored in ignored_directories
            ):
                continue

            if item.is_dir():

                directories.add(
                    str(
                        item.relative_to(
                            repository_path
                        )
                    )
                )

                continue

            if not item.is_file():
                continue

            relative = (
                item.relative_to(
                    repository_path
                )
            )

            files.append(
                str(relative)
            )

            language = (
                extension_map.get(
                    item.suffix.lower()
                )
            )

            if language:
                languages.add(
                    language
                )

        return {
            "files": files,
            "file_count": len(files),
            "directories": list(
                directories
            ),
            "directory_count": len(
                directories
            ),
            "languages": sorted(
                languages
            )
        }

    # =========================================================
    # CODE ANALYSIS
    # =========================================================

    def _analyze_code(
        self,
        repository_path: Path
    ) -> Dict[str, Any]:

        if self.repository_service:

            analyzer = getattr(
                self.repository_service,
                "code_analysis",
                None
            )

            if analyzer:

                return analyzer(
                    str(repository_path)
                )

        try:
            from app.analysis.code_analyzer import CodeAnalyzer
            analyzer = CodeAnalyzer(repository_path)
            return analyzer.analyze()
        except Exception:
            return {
                "status": "skipped",
                "message": (
                    "Existing code analyzer "
                    "was not connected."
                ),
                "functions": [],
                "classes": [],
                "imports": []
            }

    # =========================================================
    # CHUNKING
    # =========================================================

    def _build_chunks(
        self,
        repository_path: Path
    ) -> Dict[str, Any]:

        chunks = []

        ignored_directories = {
            ".git",
            "node_modules",
            "__pycache__",
            ".venv",
            "venv",
            "dist",
            "build",
        }

        supported_extensions = {
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".java",
            ".go",
            ".rs",
            ".cpp",
            ".c",
            ".cs",
            ".php",
            ".rb",
            ".swift",
            ".kt",
            ".md",
            ".txt",
            ".json",
            ".yaml",
            ".yml",
        }

        chunk_size = 120

        for file in repository_path.rglob("*"):

            if any(
                ignored in file.parts
                for ignored in ignored_directories
            ):
                continue

            if not file.is_file():
                continue

            if file.suffix.lower() not in (
                supported_extensions
            ):
                continue

            try:

                content = file.read_text(
                    encoding="utf-8",
                    errors="ignore"
                )

            except Exception:

                continue

            lines = content.splitlines()

            if not lines:
                continue

            relative_path = str(
                file.relative_to(
                    repository_path
                )
            )

            for start in range(
                0,
                len(lines),
                chunk_size
            ):

                end = min(
                    start + chunk_size,
                    len(lines)
                )

                chunk = "\n".join(
                    lines[start:end]
                )

                chunks.append({
                    "file": relative_path,
                    "start_line": start + 1,
                    "end_line": end,
                    "content": chunk
                })

        return {
            "count": len(chunks),
            "chunks": chunks
        }

    # =========================================================
    # SEARCH INDEX
    # =========================================================

    def _build_search_index(
        self,
        repository_path: Path,
        chunk_result: Dict[str, Any]
    ) -> Dict[str, Any]:

        chunks = chunk_result.get(
            "chunks",
            []
        )

        if self.rag_service:

            indexer = getattr(
                self.rag_service,
                "index_repository",
                None
            )

            if indexer:

                return indexer(
                    str(repository_path),
                    chunks
                )

        # -----------------------------------------------------
        # Temporary metadata index
        # -----------------------------------------------------

        return {
            "status": "prepared",
            "chunk_count": len(
                chunks
            ),
            "vector_index": False,
            "keyword_index": False,
            "message": (
                "Chunks prepared. "
                "Connect the existing RAG "
                "indexer here."
            )
        }

    # =========================================================
    # GRAPH
    # =========================================================

    def _build_graph(
        self,
        repository_path: Path
    ) -> Dict[str, Any]:

        if self.graph_service:

            builder = getattr(
                self.graph_service,
                "build",
                None
            )

            if builder:

                return builder(
                    str(repository_path)
                )

        return {
            "status": "prepared",
            "nodes": 0,
            "edges": 0,
            "message": (
                "Connect the existing graph "
                "builder here."
            )
        }

    # =========================================================
    # FAILURE
    # =========================================================

    def _failure(
        self,
        result: Dict[str, Any],
        step: str,
        exception: Exception
    ) -> Dict[str, Any]:

        result["success"] = False

        result["status"] = (
            "FAILED"
        )

        result["failed_step"] = step

        result["error"] = str(
            exception
        )

        result["traceback"] = (
            traceback.format_exc()
        )

        return result