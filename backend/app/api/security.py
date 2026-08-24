from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.security_agent import SecurityAgent
from app.config.settings import CLONED_REPOSITORIES_DIR
from app.db.database import SessionLocal
from app.db.models import SecurityFinding


router = APIRouter(
    prefix="/security",
    tags=["Security Analysis"]
)

security_agent = SecurityAgent()


class SecurityScanRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: Optional[str] = None
    code: Optional[str] = None


@router.post("/scan")
def run_security_scan(request: SecurityScanRequest) -> Dict[str, Any]:
    try:
        res = security_agent.run(request.model_dump())
        
        # Persist findings to MySQL database
        if SessionLocal and res.get("findings"):
            try:
                repo_name = request.repository_name or (Path(request.repository_path).name if request.repository_path else "default")
                with SessionLocal() as db:
                    # Clear old findings for this repo to keep fresh
                    db.query(SecurityFinding).filter(SecurityFinding.repository_name == repo_name).delete()
                    for f in res["findings"]:
                        db_finding = SecurityFinding(
                            repository_name=repo_name,
                            severity=f.get("severity", "MEDIUM"),
                            finding_type=f.get("type", "Vulnerability"),
                            file_path=f.get("file", ""),
                            line_number=f.get("line"),
                            description=f.get("message") or f.get("description", ""),
                            recommendation=f.get("recommendation", ""),
                        )
                        db.add(db_finding)
                    db.commit()
            except Exception:
                pass

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
