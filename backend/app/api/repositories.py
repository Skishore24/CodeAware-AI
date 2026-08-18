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

            "message": (
                "Code analysis completed."
            ),

            "analysis": result,

        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
