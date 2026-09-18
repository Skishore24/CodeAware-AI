from typing import Any, Dict, Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agents.code_review_agent import CodeReviewAgent
from app.core.logging import get_logger
from app.db.database import SessionLocal, get_db
from app.db.models import ReviewRecord

logger = get_logger("app.api.review")

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
                    logger.info(f"Persisted ReviewRecord id={rec.id} to MySQL for {repo_name}")
            except Exception as dberr:
                logger.error(f"Failed to persist review record to MySQL: {dberr}", exc_info=True)

        return res
    except Exception as exc:
        logger.error(f"Review code failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/history")
def get_review_history(
    repository_name: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Fetch stored review records from MySQL workbench / codeaware_db."""
    try:
        query = db.query(ReviewRecord).order_by(ReviewRecord.created_at.desc())
        if repository_name:
            query = query.filter(ReviewRecord.repository_name == repository_name)
        records = query.limit(limit).all()
        return {
            "success": True,
            "count": len(records),
            "records": [
                {
                    "id": r.id,
                    "repository_name": r.repository_name,
                    "overall_score": r.overall_score,
                    "summary": r.summary,
                    "dimensions": r.dimensions_json,
                    "findings": r.findings_json,
                    "recommendations": r.recommendations_json,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in records
            ],
        }
    except Exception as exc:
        logger.error(f"Failed to fetch review history: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

