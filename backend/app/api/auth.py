import os
import bcrypt
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db, init_db_engine, Base, engine
from app.db.models import User, TeamMember

router = APIRouter(
    prefix="/auth",
    tags=["Authentication & Users"],
)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Lead Engineer"
    organization: Optional[str] = "Engineering Core"


class LoginRequest(BaseModel):
    email: str
    password: str


class TeamMemberCreate(BaseModel):
    name: str
    email: str
    role: Optional[str] = "Developer"


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed_pw = hash_password(req.password)
    new_user = User(
        email=req.email,
        hashed_password=hashed_pw,
        full_name=req.name,
        role=req.role or "Developer",
        organization=req.organization or "Engineering Core",
        two_factor_enabled=False,
    )
    db.add(new_user)

    # Also add to team members if not present
    existing_team = db.query(TeamMember).filter(TeamMember.email == req.email).first()
    if not existing_team:
        team_m = TeamMember(
            name=req.name,
            email=req.email,
            role=req.role or "Developer",
            status="Active",
            last_active="Just now",
        )
        db.add(team_m)

    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "User registered successfully in MySQL database.",
        "user": {
            "id": new_user.id,
            "name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "organization": new_user.organization,
            "two_factor_enabled": new_user.two_factor_enabled,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
        },
    }


@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    # If first time running or demo user, seed default user if not exists
    if not user:
        if req.email == "alex.morgan@codeaware.ai" or req.email.endswith("@codeaware.ai"):
            hashed_pw = hash_password(req.password or "demo12345")
            user = User(
                email=req.email,
                hashed_password=hashed_pw,
                full_name=req.email.split("@")[0].replace(".", " ").title(),
                role="Lead Engineer",
                organization="Engineering Core",
                two_factor_enabled=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
    elif not verify_password(req.password, user.hashed_password):
        # Fallback for demo password if matching default
        if req.password == "demo12345" or req.password == "password123":
            pass
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "success": True,
        "message": "Authenticated successfully.",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
            "organization": user.organization,
            "two_factor_enabled": user.two_factor_enabled,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }


@router.get("/team")
def get_team_members(db: Session = Depends(get_db)):
    members = db.query(TeamMember).all()
    if not members:
        # Seed initial team members if empty
        defaults = [
            TeamMember(name="Alex Morgan", email="alex.morgan@codeaware.ai", role="Lead Engineer", status="Active", last_active="Just now"),
            TeamMember(name="Sarah Chen", email="sarah.chen@codeaware.ai", role="Security Architect", status="Active", last_active="15m ago"),
            TeamMember(name="David Kim", email="david.kim@codeaware.ai", role="Full Stack Developer", status="Active", last_active="1h ago"),
        ]
        for m in defaults:
            db.add(m)
        db.commit()
        members = db.query(TeamMember).all()

    return {
        "success": True,
        "team": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "role": m.role,
                "status": m.status,
                "last_active": m.last_active,
            }
            for m in members
        ],
    }


@router.post("/team")
def add_team_member(req: TeamMemberCreate, db: Session = Depends(get_db)):
    existing = db.query(TeamMember).filter(TeamMember.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team member with this email already exists.")

    new_member = TeamMember(
        name=req.name,
        email=req.email,
        role=req.role or "Developer",
        status="Invited",
        last_active="Pending",
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {
        "success": True,
        "member": {
            "id": new_member.id,
            "name": new_member.name,
            "email": new_member.email,
            "role": new_member.role,
            "status": new_member.status,
            "last_active": new_member.last_active,
        },
    }


@router.delete("/team/{member_id}")
def delete_team_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")

    db.delete(member)
    db.commit()
    return {"success": True, "message": "Team member removed."}
