from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.github_service import (
    GitHubService
)


router = APIRouter(
    prefix="/github",
    tags=["GitHub"]
)


github_service = GitHubService()


# =========================================================
# REQUEST MODEL
# =========================================================

class CloneRequest(BaseModel):

    url: str = Field(
        ...,
        description="Public GitHub repository URL"
    )


# =========================================================
# CLONE
# =========================================================

@router.post("/clone")
def clone_repository(
    request: CloneRequest
):

    try:

        result = (
            github_service.clone_repository(
                request.url
            )
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except RuntimeError as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected error: {str(error)}"
            )
        )