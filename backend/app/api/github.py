from fastapi import APIRouter
from pydantic import BaseModel

from app.services.github_service import GitHubService
from app.config.paths import CLONED_REPOSITORIES_DIR


router = APIRouter(
    prefix="/github",
    tags=["GitHub"],
)


class CloneRequest(BaseModel):

    github_url: str


@router.post("/clone")
def clone_repository(
    request: CloneRequest,
):
    service = GitHubService(
        str(CLONED_REPOSITORIES_DIR)
    )

    return service.clone_repository(
        request.github_url
    )