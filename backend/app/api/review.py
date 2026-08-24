from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.code_review_agent import CodeReviewAgent
from app.db.database import SessionLocal
from app.db.models import ReviewRecord


router = APIRouter(
    prefix="/review",
    tags=["Code Review"]
)

review_agent = CodeReviewAgent()


class CodeReviewRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    code: Optional[str] = None


@router.post("/code")
def review_code(request: CodeReviewRequest) -> Dict[str, Any]:
    try:
        res = review_agent.run(request.model_dump())
        
        # Persist review result to MySQL database
        if SessionLocal and res:
            try:
                repo_name = request.repository_name or "default"
                with SessionLocal() as db:
                    raw = res.get("raw_data", {})
                    rec = ReviewRecord(
                        repository_name=repo_name,
                        overall_score=raw.get("overall_score", 88),
                        summary=res.get("summary", ""),
                        dimensions_json=raw.get("dimensions", []),
                        findings_json=res.get("findings", []),
                        recommendations_json=res.get("recommendations", []),
                    )
                    db.add(rec)
                    db.commit()
            except Exception:
                pass

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
