from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.repository_service import RepositoryService
from app.services.graph_service import GraphService
from app.services.rag_service import RAGService
from app.services.repository_ingestion import RepositoryIngestionService
from app.analysis.repository_scanner import RepositoryScanner
from app.analysis.code_analyzer import CodeAnalyzer
from app.db.database import get_db, SessionLocal
from app.db.models import Repository as DBRepository

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)


repository_service = RepositoryService(
    CLONED_REPOSITORIES_DIR
)
graph_service = GraphService()
rag_service = RAGService()
ingestion_service = RepositoryIngestionService(
    repository_service=repository_service,
    graph_service=graph_service,
    rag_service=rag_service,
)


from typing import Optional

class RepositoryRequest(BaseModel):

    repository_url: Optional[HttpUrl] = None
    url: Optional[HttpUrl] = None

    def get_target_url(self) -> str:
        target = self.repository_url or self.url
        if not target:
            raise ValueError("Repository URL is required.")
        return str(target)


class ScanRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None

class CodeAnalysisRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None

def _resolve_repo_path(repo_name: Optional[str], repo_path: Optional[str]) -> Path:
    ref = repo_path or repo_name
    if not ref:
        raise HTTPException(
            status_code=400,
            detail="Either repository_name or repository_path must be provided."
        )
    p = Path(ref)
    if p.is_absolute() and p.exists():
        return p
    target = Path(CLONED_REPOSITORIES_DIR) / ref
    if target.exists():
        return target
    if p.exists():
        return p
    raise HTTPException(
        status_code=404,
        detail=f"Repository not found at: {ref}"
    )

# ---------------------------------------------------------
# List Cloned Repositories
# ---------------------------------------------------------

@router.get("/list")
@router.get("")
def list_repositories():
    """
    List all repositories currently cloned in the workspace.
    """
    repos = repository_service.list_repositories()
    return {
        "success": True,
        "count": len(repos),
        "repositories": repos,
    }


# ---------------------------------------------------------
# Clone Repository
# ---------------------------------------------------------

@router.post("/clone")
def clone_repository(
    request: RepositoryRequest
):

    try:

        result = repository_service.clone_repository(
            request.get_target_url()
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except RuntimeError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ---------------------------------------------------------
# Delete Cloned Repository
# ---------------------------------------------------------

class DeleteRepositoryRequest(BaseModel):
    repository_name: str


@router.delete("/{repository_name}")
def delete_repository_by_name(repository_name: str):
    """
    Remove a cloned repository and its indexed records from the workspace.
    """
    try:
        result = repository_service.delete_repository(repository_name)

        # Also remove from database if present
        if SessionLocal:
            try:
                with SessionLocal() as db:
                    existing = db.query(DBRepository).filter(DBRepository.name == repository_name).first()
                    if existing:
                        db.delete(existing)
                        db.commit()
            except Exception:
                pass

        return result
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.post("/delete")
def delete_repository_post(request: DeleteRepositoryRequest):
    """
    Alternative POST endpoint to delete a repository.
    """
    return delete_repository_by_name(request.repository_name)



# ---------------------------------------------------------
# Clone and Ingest Repository
# ---------------------------------------------------------

@router.post("/clone-and-ingest")
def clone_and_ingest_repository(
    request: RepositoryRequest
):
    try:
        repository_url = request.get_target_url()
    except ValueError as exc:
        return {
            "success": False,
            "status": "FAILED",
            "failed_stage": "CLONING",
            "error": str(exc),
        }

    # 1. Clone Stage
    try:
        clone_result = repository_service.clone_repository(
            repository_url
        )
    except Exception as exc:
        return {
            "success": False,
            "status": "FAILED",
            "failed_stage": "CLONING",
            "error": str(exc),
        }

    repository_path = clone_result.get("path")
    repository_name = clone_result.get("repository_name")

    if not repository_path or not Path(repository_path).exists():
        return {
            "success": False,
            "status": "FAILED",
            "failed_stage": "CLONING",
            "error": f"Repository directory does not exist: {repository_path}",
        }

    # 2. Ingestion Stage (Scan -> Code Analysis -> Chunking -> Indexing -> Knowledge Graph)
    try:
        ingestion_result = ingestion_service.ingest(
            repository_path
        )
    except Exception as exc:
        return {
            "success": False,
            "status": "FAILED",
            "failed_stage": "INGESTION",
            "error": str(exc),
        }

    if not ingestion_result.get("success", False):
        return {
            "success": False,
            "status": "FAILED",
            "failed_stage": ingestion_result.get("failed_step", "INGESTION"),
            "error": ingestion_result.get("error", "Ingestion failed"),
        }

    return {
        "success": True,
        "message": "Repository cloned and ingestion completed",
        # top-level convenience field consumed by the frontend
        "repository_path": repository_path,
        "repository": {
            "url": repository_url,
            "name": repository_name,
            "path": repository_path,
            "repository_path": repository_path,
        },
        "status": "READY",
        "scan": ingestion_result.get("scan", {}),
        "analysis": ingestion_result.get("analysis", {}),
        "ingestion": ingestion_result,
        "graph": ingestion_result.get("graph", {}),
    }


# ---------------------------------------------------------
# Analyze Repository
# ---------------------------------------------------------

@router.post("/scan")
def scan_repository(
    request: ScanRequest
):

    repository_path = _resolve_repo_path(
        request.repository_name,
        request.repository_path
    )

    try:

        scanner = RepositoryScanner(
            repository_path
        )

        result = scanner.scan()

        # Persist to MySQL database
        if SessionLocal:
            try:
                with SessionLocal() as db:
                    repo_name = repository_path.name
                    existing = db.query(DBRepository).filter(DBRepository.name == repo_name).first()
                    if not existing:
                        existing = DBRepository(
                            name=repo_name,
                            local_path=str(repository_path),
                        )
                        db.add(existing)
                    existing.files_count = result.get("total_files", 0)
                    existing.primary_language = result.get("primary_language", "General")
                    existing.total_functions = result.get("total_functions", 0)
                    existing.total_classes = result.get("total_classes", 0)
                    existing.languages_json = result.get("languages", {})
                    existing.frameworks_json = result.get("frameworks", [])
                    db.commit()
            except Exception as dberr:
                pass

        return {

            "success": True,

            "message": (
                "Repository scanned successfully."
            ),

            "analysis": result,

        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

@router.post("/code-analysis")
def analyze_code(
    request: CodeAnalysisRequest
):

    repository_path = _resolve_repo_path(
        request.repository_name,
        request.repository_path
    )

    try:

        analyzer = CodeAnalyzer(
            repository_path
        )

        result = analyzer.analyze()

        return {
            "success": True,
            "message": "Code analysis completed.",
            "analysis": result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ---------------------------------------------------------
# Get File Content (Secure Source Viewer Endpoint)
# ---------------------------------------------------------

class FileContentRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None


@router.post("/file-content")
def get_file_content(request: FileContentRequest):
    repo_path = _resolve_repo_path(
        request.repository_name,
        request.repository_path
    )

    # Sanitize and resolve file path
    clean_rel_path = request.file_path.lstrip("/\\")
    target_file = (repo_path / clean_rel_path).resolve()

    # Security: Ensure target file is within repo_path
    try:
        target_file.relative_to(repo_path.resolve())
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Path traversal outside repository root is disallowed."
        )

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.file_path}"
        )

    try:
        content = target_file.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        total_lines = len(lines)

        ext = target_file.suffix.lower()
        language_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".json": "json",
            ".md": "markdown",
            ".html": "html",
            ".css": "css",
            ".go": "go",
            ".java": "java",
            ".cpp": "cpp",
            ".c": "c",
            ".cs": "csharp",
            ".rs": "rust",
            ".yaml": "yaml",
            ".yml": "yaml",
            ".sh": "bash",
        }
        lang = language_map.get(ext, "plaintext")

        start = max(1, request.start_line) if request.start_line else 1
        end = min(total_lines, request.end_line) if request.end_line else total_lines

        sliced_lines = [
            {"line_number": i, "content": lines[i - 1]}
            for i in range(start, min(end + 1, total_lines + 1))
        ]

        return {
            "success": True,
            "file_path": str(target_file.relative_to(repo_path.resolve())).replace("\\", "/"),
            "absolute_path": str(target_file),
            "language": lang,
            "total_lines": total_lines,
            "start_line": start,
            "end_line": end,
            "content": content,
            "lines": sliced_lines,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read file: {exc}"
        )

