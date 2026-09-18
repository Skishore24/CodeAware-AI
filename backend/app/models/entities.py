import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


# ==============================================================================
# AUTHENTICATION & ACCESS CONTROL (RBAC)
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(100), default="USER", index=True)  # USER, ADMIN, LEAD
    organization = Column(String(255), default="Engineering Core")
    two_factor_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    resource = Column(String(100), nullable=False)  # repos, agents, security, patches
    action = Column(String(50), nullable=False)     # read, write, execute, delete
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), index=True)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), index=True)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(100), default="Developer")
    status = Column(String(50), default="Active")
    last_active = Column(String(100), default="Just now")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==============================================================================
# PROJECTS & REPOSITORIES
# ==============================================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    repositories = relationship("Repository", back_populates="project")


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    clone_url = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=False)
    default_branch = Column(String(100), default="main")
    primary_language = Column(String(100), default="General")
    files_count = Column(Integer, default=0)
    total_functions = Column(Integer, default=0)
    total_classes = Column(Integer, default=0)
    languages_json = Column(JSON, nullable=True)
    frameworks_json = Column(JSON, nullable=True)
    is_indexed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="repositories")
    files = relationship("RepositoryFile", back_populates="repository", cascade="all, delete-orphan")
    commits = relationship("RepositoryCommit", back_populates="repository", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="repository", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="repository", cascade="all, delete-orphan")
    security_findings = relationship("SecurityFinding", back_populates="repository", cascade="all, delete-orphan")
    review_records = relationship("ReviewRecord", back_populates="repository", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="repository", cascade="all, delete-orphan")
    patches = relationship("Patch", back_populates="repository", cascade="all, delete-orphan")


class RepositoryFile(Base):
    __tablename__ = "repository_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    language = Column(String(50), default="plaintext")
    size_bytes = Column(Integer, default=0)
    lines_count = Column(Integer, default=0)
    ast_summary = Column(JSON, nullable=True)
    last_modified = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="files")
    __table_args__ = (Index("idx_repo_file", "repository_id", "file_path"),)


class RepositoryCommit(Base):
    __tablename__ = "repository_commits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False)
    commit_hash = Column(String(100), nullable=False)
    author = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    committed_at = Column(DateTime, nullable=True)

    repository = relationship("Repository", back_populates="commits")
    __table_args__ = (Index("idx_repo_commit", "repository_id", "commit_hash"),)


# ==============================================================================
# ANALYSIS, BUGS, SECURITY & REVIEWS
# ==============================================================================

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False)
    run_type = Column(String(50), default="full_scan")  # full_scan, security_scan, ast_scan
    status = Column(String(50), default="COMPLETED")     # RUNNING, COMPLETED, FAILED
    duration_seconds = Column(Float, default=0.0)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="analysis_runs")
    results = relationship("AnalysisResult", back_populates="run", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("analysis_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    category = Column(String(100), nullable=False)  # AST, METRICS, GRAPH, RAG
    data_json = Column(JSON, nullable=False)

    run = relationship("AnalysisRun", back_populates="results")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False)
    issue_type = Column(String(50), default="BUG")  # BUG, SECURITY, SMELL, PERFORMANCE
    severity = Column(String(50), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(50), default="Open")  # Open, Fixing, Verified, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="issues")


class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    bug_type = Column(String(100), nullable=False)  # syntax, logic, runtime, unhandled_exception
    severity = Column(String(50), default="HIGH")
    message = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=False)
    severity = Column(String(50), index=True, nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    finding_type = Column(String(255), nullable=False)          # SQLi, XSS, Secret, Path Traversal
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    evidence_snippet = Column(Text, nullable=True)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="security_findings")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=False)
    overall_score = Column(Integer, default=85)
    summary = Column(Text, nullable=True)
    dimensions_json = Column(JSON, nullable=True)
    findings_json = Column(JSON, nullable=True)
    recommendations_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="review_records")


# ==============================================================================
# TESTS & AUTONOMOUS FIXES
# ==============================================================================

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False)
    framework = Column(String(50), default="pytest")  # pytest, unittest, npm_test
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    output_log = Column(Text, nullable=True)
    status = Column(String(50), default="PASSED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="test_runs")


class GeneratedTest(Base):
    __tablename__ = "generated_tests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    target_file = Column(String(500), nullable=False)
    target_function = Column(String(255), nullable=True)
    framework = Column(String(50), default="pytest")
    test_code = Column(Text, nullable=False)
    validation_status = Column(String(50), default="VERIFIED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Patch(Base):
    __tablename__ = "patches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=False)
    target_file = Column(String(500), nullable=False)
    problem_statement = Column(Text, nullable=False)
    unified_diff = Column(Text, nullable=False)
    original_code = Column(Text, nullable=True)
    patched_code = Column(Text, nullable=True)
    backup_file_path = Column(String(500), nullable=True)
    is_applied = Column(Boolean, default=False)
    applied_at = Column(DateTime, nullable=True)
    rollback_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="patches")


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


# ==============================================================================
# AGENT RUNS, TASKS & EVENTS
# ==============================================================================

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    agent_type = Column(String(100), nullable=False)  # Specialist, MultiAgent, DeepAgent
    task_goal = Column(Text, nullable=False)
    status = Column(String(50), default="RUNNING")     # RUNNING, COMPLETED, FAILED, CANCELLED
    duration_seconds = Column(Float, default=0.0)
    iterations_count = Column(Integer, default=1)
    result_summary = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="agent_runs")
    tasks = relationship("AgentTask", back_populates="run", cascade="all, delete-orphan")
    events = relationship("AgentEvent", back_populates="run", cascade="all, delete-orphan")
    messages = relationship("AgentMessage", back_populates="run", cascade="all, delete-orphan")


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    assigned_agent = Column(String(100), nullable=False)
    task_name = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING")
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    run = relationship("AgentRun", back_populates="tasks")


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String(100), nullable=False)  # PLAN, TOOL_CALL, EVIDENCE, DECISION, ERROR
    sender_agent = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    payload_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    run = relationship("AgentRun", back_populates="events")


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    sender = Column(String(100), nullable=False)
    recipient = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    run = relationship("AgentRun", back_populates="messages")


# ==============================================================================
# RAG, CHUNKS & EMBEDDINGS
# ==============================================================================

class RAGDocument(Base):
    __tablename__ = "rag_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    total_chunks = Column(Integer, default=0)
    language = Column(String(50), default="plaintext")
    indexed_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("RAGChunk", back_populates="document", cascade="all, delete-orphan")


class RAGChunk(Base):
    __tablename__ = "rag_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("rag_documents.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    symbol = Column(String(255), nullable=True, index=True)
    symbol_type = Column(String(50), default="code")  # function, class, module
    start_line = Column(Integer, nullable=False)
    end_line = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    document = relationship("RAGDocument", back_populates="chunks")
    __table_args__ = (Index("idx_rag_symbol_file", "document_id", "symbol"),)


class EmbeddingsMetadata(Base):
    __tablename__ = "embeddings_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), unique=True, index=True, nullable=False)
    model_name = Column(String(100), nullable=False)  # nomic-embed-text or tf-idf
    vector_dimension = Column(Integer, default=768)
    total_vectors = Column(Integer, default=0)
    index_file_path = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==============================================================================
# KNOWLEDGE GRAPH NODES & EDGES
# ==============================================================================

class KnowledgeGraphNode(Base):
    __tablename__ = "knowledge_graph_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    node_id = Column(String(255), index=True, nullable=False)
    node_type = Column(String(50), nullable=False)  # file, class, function, endpoint
    label = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    line_number = Column(Integer, nullable=True)
    properties_json = Column(JSON, nullable=True)

    __table_args__ = (Index("idx_kg_repo_node", "repository_name", "node_id"),)


class KnowledgeGraphEdge(Base):
    __tablename__ = "knowledge_graph_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_name = Column(String(255), index=True, nullable=False)
    source_node_id = Column(String(255), index=True, nullable=False)
    target_node_id = Column(String(255), index=True, nullable=False)
    relationship_type = Column(String(50), nullable=False)  # contains, calls, imports, defines, inherits

    __table_args__ = (Index("idx_kg_edge", "repository_name", "source_node_id", "target_node_id"),)


# ==============================================================================
# CHAT, SETTINGS & AUDIT LOGS
# ==============================================================================

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=True)
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=True)
    user_email = Column(String(255), index=True, nullable=True)
    repository_name = Column(String(255), index=True, nullable=True)
    role = Column(String(50), nullable=False)  # user, assistant, system
    message_text = Column(Text, nullable=False)
    structured_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class SystemSetting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    target_resource = Column(String(255), nullable=False)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
