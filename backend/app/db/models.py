import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(100), default="Developer")
    organization = Column(String(255), default="Engineering Core")
    two_factor_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    clone_url = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=False)
    primary_language = Column(String(100), default="General")
    files_count = Column(Integer, default=0)
    total_functions = Column(Integer, default=0)
    total_classes = Column(Integer, default=0)
    languages_json = Column(JSON, nullable=True)
    frameworks_json = Column(JSON, nullable=True)
    is_indexed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_scanned_at = Column(DateTime, default=datetime.datetime.utcnow)


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    severity = Column(String(50), index=True, nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    finding_type = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    overall_score = Column(Integer, default=88)
    summary = Column(Text, nullable=True)
    dimensions_json = Column(JSON, nullable=True)
    findings_json = Column(JSON, nullable=True)
    recommendations_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_email = Column(String(255), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=True)
    role = Column(String(50), nullable=False) # user, assistant
    message_text = Column(Text, nullable=False)
    structured_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AutonomousFixRecord(Base):
    __tablename__ = "autonomous_fixes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    problem_description = Column(Text, nullable=False)
    original_code = Column(Text, nullable=True)
    patched_code = Column(Text, nullable=True)
    validation_status = Column(String(50), default="Verified")
    is_applied = Column(Boolean, default=False)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(100), default="Developer")
    status = Column(String(50), default="Active")
    last_active = Column(String(100), default="Just now")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
