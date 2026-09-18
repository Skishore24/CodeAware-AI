from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.security_agent import SecurityAgent
from app.config.settings import CLONED_REPOSITORIES_DIR
from app.core.logging import get_logger
from app.db.database import SessionLocal
from app.db.models import SecurityFinding

logger = get_logger("app.api.security")


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
                    logger.info(f"Persisted {len(res['findings'])} security findings to MySQL for {repo_name}")
            except Exception as dberr:
                logger.error(f"Failed to persist security findings for '{repo_name}' to MySQL: {dberr}", exc_info=True)

        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/findings")
@router.get("/list")
def get_security_findings(
    repository_name: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Fetch stored security findings from the database without requiring a new scan.
    """
    try:
        with SessionLocal() as db:
            query = db.query(SecurityFinding)
            if repository_name:
                query = query.filter(SecurityFinding.repository_name == repository_name)
            if severity:
                query = query.filter(SecurityFinding.severity.ilike(severity))

            total = query.count()
            findings = query.order_by(SecurityFinding.id.desc()).offset(offset).limit(limit).all()

            return {
                "success": True,
                "count": len(findings),
                "total": total,
                "repository_name": repository_name,
                "findings": [
                    {
                        "id": f.id,
                        "repository_name": f.repository_name,
                        "severity": f.severity,
                        "type": f.finding_type,
                        "file": f.file_path,
                        "line": f.line_number,
                        "message": f.description,
                        "description": f.description,
                        "recommendation": f.recommendation,
                        "status": f.status or "Open",
                        "created_at": f.created_at.isoformat() if hasattr(f, "created_at") and f.created_at else None,
                    }
                    for f in findings
                ],
            }
    except Exception as exc:
        logger.error(f"Failed to fetch security findings: {exc}", exc_info=True)
        return {
            "success": False,
            "error": str(exc),
            "findings": [],
            "count": 0,
            "total": 0,
        }
