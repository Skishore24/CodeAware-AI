from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.agents.bug_agent import BugAgent
from app.db.database import get_db
from app.models.entities import Bug

router = APIRouter(
    prefix="/bugs",
    tags=["Bug Detection & Classification"],
)

bug_agent = BugAgent()


class BugScanRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    code: Optional[str] = None


@router.post("/scan")
def scan_bugs(request: BugScanRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        res = bug_agent.run(request.model_dump())
        repo_name = request.repository_name or "default"

        # Persist findings
        if res.get("findings"):
            for f in res["findings"]:
                db_bug = Bug(
                    repository_name=repo_name,
                    file_path=f.get("file", ""),
                    line_number=f.get("line", 1),
                    bug_type=f.get("type", "syntax_error"),
                    severity=f.get("severity", "MEDIUM"),
                    message=f.get("message", ""),
                    code_snippet=f.get("code", ""),
                    recommendation=f.get("recommendation", ""),
                )
                db.add(db_bug)
            db.commit()

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/list")
def list_bugs(repository_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Bug)
    if repository_name:
        query = query.filter(Bug.repository_name == repository_name)
    bugs = query.order_by(Bug.id.desc()).limit(100).all()
    return {
        "success": True,
        "count": len(bugs),
        "bugs": [
            {
                "id": b.id,
                "file": b.file_path,
                "line": b.line_number,
                "type": b.bug_type,
                "severity": b.severity,
                "message": b.message,
                "code": b.code_snippet,
                "recommendation": b.recommendation,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bugs
        ]
    }
