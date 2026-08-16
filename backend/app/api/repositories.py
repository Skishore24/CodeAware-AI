from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.config.settings import CLONED_REPOSITORIES_DIR
from app.services.repository_service import RepositoryService
from app.analysis.repository_scanner import RepositoryScanner
from app.analysis.code_analyzer import CodeAnalyzer

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)


repository_service = RepositoryService(
    CLONED_REPOSITORIES_DIR
)


class RepositoryRequest(BaseModel):

    repository_url: HttpUrl


class ScanRequest(BaseModel):

    repository_name: str

class CodeAnalysisRequest(BaseModel):

    repository_name: str

# ---------------------------------------------------------
# Clone Repository
# ---------------------------------------------------------

@router.post("/clone")
def clone_repository(
    request: RepositoryRequest
):

    try:

        result = repository_service.clone_repository(
            str(request.repository_url)
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
# Analyze Repository
# ---------------------------------------------------------

@router.post("/scan")
def scan_repository(
    request: ScanRequest
):

    repository_path = (
        Path(CLONED_REPOSITORIES_DIR)
        / request.repository_name
    )

    if not repository_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Repository not found. "
                "Clone the repository first."
            ),
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

    repository_path = (
        Path(CLONED_REPOSITORIES_DIR)
        / request.repository_name
    )

    if not repository_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Repository not found. "
                "Clone it first."
            ),
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