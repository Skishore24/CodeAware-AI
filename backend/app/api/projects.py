from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.entities import Project, Repository

router = APIRouter(
    prefix="/projects",
    tags=["Project Management"],
)


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


@router.get("")
@router.get("/list")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return {
        "success": True,
        "count": len(projects),
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "repositories_count": len(p.repositories) if p.repositories else 0,
            }
            for p in projects
        ],
    }


@router.post("")
def create_project(request: ProjectCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.name == request.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists.")

    proj = Project(
        name=request.name.strip(),
        description=request.description,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {
        "success": True,
        "project": {
            "id": proj.id,
            "name": proj.name,
            "description": proj.description,
        }
    }
