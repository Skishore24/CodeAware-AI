"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    # 1. users
    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("full_name", sa.String(255), nullable=False),
            sa.Column("role", sa.String(100), default="USER", index=True),
            sa.Column("organization", sa.String(255), default="Engineering Core"),
            sa.Column("two_factor_enabled", sa.Boolean(), default=False),
            sa.Column("is_active", sa.Boolean(), default=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        )

    # 2. roles
    if "roles" not in existing_tables:
        op.create_table(
            "roles",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(100), unique=True, nullable=False),
            sa.Column("description", sa.String(255), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 3. permissions
    if "permissions" not in existing_tables:
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(100), unique=True, nullable=False),
            sa.Column("description", sa.String(255), nullable=True),
            sa.Column("resource", sa.String(100), nullable=False),
            sa.Column("action", sa.String(50), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 4. user_roles
    if "user_roles" not in existing_tables:
        op.create_table(
            "user_roles",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True),
            sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), index=True),
        )

    # 5. role_permissions
    if "role_permissions" not in existing_tables:
        op.create_table(
            "role_permissions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), index=True),
            sa.Column("permission_id", sa.Integer(), sa.ForeignKey("permissions.id", ondelete="CASCADE"), index=True),
        )

    # 6. team_members
    if "team_members" not in existing_tables:
        op.create_table(
            "team_members",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("role", sa.String(100), default="Developer"),
            sa.Column("status", sa.String(50), default="Active"),
            sa.Column("last_active", sa.String(100), default="Just now"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 7. projects
    if "projects" not in existing_tables:
        op.create_table(
            "projects",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        )

    # 8. repositories
    if "repositories" not in existing_tables:
        op.create_table(
            "repositories",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
            sa.Column("name", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("clone_url", sa.String(500), nullable=True),
            sa.Column("local_path", sa.String(500), nullable=False),
            sa.Column("default_branch", sa.String(100), default="main"),
            sa.Column("primary_language", sa.String(100), default="General"),
            sa.Column("files_count", sa.Integer(), default=0),
            sa.Column("total_functions", sa.Integer(), default=0),
            sa.Column("total_classes", sa.Integer(), default=0),
            sa.Column("languages_json", sa.JSON(), nullable=True),
            sa.Column("frameworks_json", sa.JSON(), nullable=True),
            sa.Column("is_indexed", sa.Boolean(), default=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("last_scanned_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 9. repository_files
    if "repository_files" not in existing_tables:
        op.create_table(
            "repository_files",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("language", sa.String(50), default="plaintext"),
            sa.Column("size_bytes", sa.Integer(), default=0),
            sa.Column("lines_count", sa.Integer(), default=0),
            sa.Column("ast_summary", sa.JSON(), nullable=True),
            sa.Column("last_modified", sa.DateTime(), server_default=sa.func.now()),
        )

    # 10. repository_commits
    if "repository_commits" not in existing_tables:
        op.create_table(
            "repository_commits",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("commit_hash", sa.String(100), nullable=False),
            sa.Column("author", sa.String(255), nullable=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("committed_at", sa.DateTime(), nullable=True),
        )

    # 11. analysis_runs
    if "analysis_runs" not in existing_tables:
        op.create_table(
            "analysis_runs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("run_type", sa.String(50), default="full_scan"),
            sa.Column("status", sa.String(50), default="COMPLETED"),
            sa.Column("duration_seconds", sa.Float(), default=0.0),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 12. analysis_results
    if "analysis_results" not in existing_tables:
        op.create_table(
            "analysis_results",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("run_id", sa.Integer(), sa.ForeignKey("analysis_runs.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("category", sa.String(100), nullable=False),
            sa.Column("data_json", sa.JSON(), nullable=False),
        )

    # 13. issues
    if "issues" not in existing_tables:
        op.create_table(
            "issues",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("issue_type", sa.String(50), default="BUG"),
            sa.Column("severity", sa.String(50), default="MEDIUM"),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("line_number", sa.Integer(), nullable=True),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("recommendation", sa.Text(), nullable=True),
            sa.Column("status", sa.String(50), default="Open"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 14. bugs
    if "bugs" not in existing_tables:
        op.create_table(
            "bugs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("line_number", sa.Integer(), nullable=True),
            sa.Column("bug_type", sa.String(100), nullable=False),
            sa.Column("severity", sa.String(50), default="HIGH"),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("code_snippet", sa.Text(), nullable=True),
            sa.Column("recommendation", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 15. security_findings
    if "security_findings" not in existing_tables:
        op.create_table(
            "security_findings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("severity", sa.String(50), index=True, nullable=False),
            sa.Column("finding_type", sa.String(255), nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("line_number", sa.Integer(), nullable=True),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("recommendation", sa.Text(), nullable=True),
            sa.Column("evidence_snippet", sa.Text(), nullable=True),
            sa.Column("status", sa.String(50), default="Open"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 16. review_records
    if "review_records" not in existing_tables:
        op.create_table(
            "review_records",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("overall_score", sa.Integer(), default=85),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("dimensions_json", sa.JSON(), nullable=True),
            sa.Column("findings_json", sa.JSON(), nullable=True),
            sa.Column("recommendations_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 17. test_runs
    if "test_runs" not in existing_tables:
        op.create_table(
            "test_runs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("framework", sa.String(50), default="pytest"),
            sa.Column("total_tests", sa.Integer(), default=0),
            sa.Column("passed_tests", sa.Integer(), default=0),
            sa.Column("failed_tests", sa.Integer(), default=0),
            sa.Column("duration_seconds", sa.Float(), default=0.0),
            sa.Column("output_log", sa.Text(), nullable=True),
            sa.Column("status", sa.String(50), default="PASSED"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 18. generated_tests
    if "generated_tests" not in existing_tables:
        op.create_table(
            "generated_tests",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("target_file", sa.String(500), nullable=False),
            sa.Column("target_function", sa.String(255), nullable=True),
            sa.Column("framework", sa.String(50), default="pytest"),
            sa.Column("test_code", sa.Text(), nullable=False),
            sa.Column("validation_status", sa.String(50), default="VERIFIED"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 19. patches
    if "patches" not in existing_tables:
        op.create_table(
            "patches",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), index=True, nullable=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("target_file", sa.String(500), nullable=False),
            sa.Column("problem_statement", sa.Text(), nullable=False),
            sa.Column("unified_diff", sa.Text(), nullable=False),
            sa.Column("original_code", sa.Text(), nullable=True),
            sa.Column("patched_code", sa.Text(), nullable=True),
            sa.Column("backup_file_path", sa.String(500), nullable=True),
            sa.Column("is_applied", sa.Boolean(), default=False),
            sa.Column("applied_at", sa.DateTime(), nullable=True),
            sa.Column("rollback_available", sa.Boolean(), default=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 20. autonomous_fixes
    if "autonomous_fixes" not in existing_tables:
        op.create_table(
            "autonomous_fixes",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("problem_description", sa.Text(), nullable=False),
            sa.Column("original_code", sa.Text(), nullable=True),
            sa.Column("patched_code", sa.Text(), nullable=True),
            sa.Column("validation_status", sa.String(50), default="Verified"),
            sa.Column("is_applied", sa.Boolean(), default=False),
            sa.Column("applied_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 21. agent_runs
    if "agent_runs" not in existing_tables:
        op.create_table(
            "agent_runs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("agent_type", sa.String(100), nullable=False),
            sa.Column("task_goal", sa.Text(), nullable=False),
            sa.Column("status", sa.String(50), default="RUNNING"),
            sa.Column("duration_seconds", sa.Float(), default=0.0),
            sa.Column("iterations_count", sa.Integer(), default=1),
            sa.Column("result_summary", sa.Text(), nullable=True),
            sa.Column("result_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 22. agent_tasks
    if "agent_tasks" not in existing_tables:
        op.create_table(
            "agent_tasks",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("run_id", sa.Integer(), sa.ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("assigned_agent", sa.String(100), nullable=False),
            sa.Column("task_name", sa.String(255), nullable=False),
            sa.Column("status", sa.String(50), default="PENDING"),
            sa.Column("input_json", sa.JSON(), nullable=True),
            sa.Column("output_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 23. agent_events
    if "agent_events" not in existing_tables:
        op.create_table(
            "agent_events",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("run_id", sa.Integer(), sa.ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("event_type", sa.String(100), nullable=False),
            sa.Column("sender_agent", sa.String(100), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("payload_json", sa.JSON(), nullable=True),
            sa.Column("timestamp", sa.DateTime(), server_default=sa.func.now()),
        )

    # 24. agent_messages
    if "agent_messages" not in existing_tables:
        op.create_table(
            "agent_messages",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("run_id", sa.Integer(), sa.ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("sender", sa.String(100), nullable=False),
            sa.Column("recipient", sa.String(100), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 25. rag_documents
    if "rag_documents" not in existing_tables:
        op.create_table(
            "rag_documents",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("total_chunks", sa.Integer(), default=0),
            sa.Column("language", sa.String(50), default="plaintext"),
            sa.Column("indexed_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 26. rag_chunks
    if "rag_chunks" not in existing_tables:
        op.create_table(
            "rag_chunks",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("document_id", sa.Integer(), sa.ForeignKey("rag_documents.id", ondelete="CASCADE"), index=True, nullable=False),
            sa.Column("chunk_index", sa.Integer(), nullable=False),
            sa.Column("symbol", sa.String(255), nullable=True, index=True),
            sa.Column("symbol_type", sa.String(50), default="code"),
            sa.Column("start_line", sa.Integer(), nullable=False),
            sa.Column("end_line", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
        )

    # 27. embeddings_metadata
    if "embeddings_metadata" not in existing_tables:
        op.create_table(
            "embeddings_metadata",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("model_name", sa.String(100), nullable=False),
            sa.Column("vector_dimension", sa.Integer(), default=768),
            sa.Column("total_vectors", sa.Integer(), default=0),
            sa.Column("index_file_path", sa.String(500), nullable=True),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 28. knowledge_graph_nodes
    if "knowledge_graph_nodes" not in existing_tables:
        op.create_table(
            "knowledge_graph_nodes",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("node_id", sa.String(255), index=True, nullable=False),
            sa.Column("node_type", sa.String(50), nullable=False),
            sa.Column("label", sa.String(255), nullable=False),
            sa.Column("file_path", sa.String(500), nullable=True),
            sa.Column("line_number", sa.Integer(), nullable=True),
            sa.Column("properties_json", sa.JSON(), nullable=True),
        )

    # 29. knowledge_graph_edges
    if "knowledge_graph_edges" not in existing_tables:
        op.create_table(
            "knowledge_graph_edges",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=False),
            sa.Column("source_node_id", sa.String(255), index=True, nullable=False),
            sa.Column("target_node_id", sa.String(255), index=True, nullable=False),
            sa.Column("relationship_type", sa.String(50), nullable=False),
        )

    # 30. chat_sessions
    if "chat_sessions" not in existing_tables:
        op.create_table(
            "chat_sessions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=True),
            sa.Column("title", sa.String(255), default="New Chat"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        )

    # 31. chat_messages
    if "chat_messages" not in existing_tables:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("session_id", sa.Integer(), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=True),
            sa.Column("user_email", sa.String(255), index=True, nullable=True),
            sa.Column("repository_name", sa.String(255), index=True, nullable=True),
            sa.Column("role", sa.String(50), nullable=False),
            sa.Column("message_text", sa.Text(), nullable=False),
            sa.Column("structured_data_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )

    # 32. settings
    if "settings" not in existing_tables:
        op.create_table(
            "settings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("key", sa.String(100), unique=True, index=True, nullable=False),
            sa.Column("value", sa.Text(), nullable=False),
            sa.Column("description", sa.String(255), nullable=True),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        )

    # 33. audit_logs
    if "audit_logs" not in existing_tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("target_resource", sa.String(255), nullable=False),
            sa.Column("details_json", sa.JSON(), nullable=True),
            sa.Column("ip_address", sa.String(50), nullable=True),
            sa.Column("timestamp", sa.DateTime(), server_default=sa.func.now()),
        )


def downgrade() -> None:
    pass
