"""002_add_missing_columns

Revision ID: 002_add_missing_columns
Revises: 001_initial_schema
Create Date: 2026-09-17 19:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = '002_add_missing_columns'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)

    # 1. repositories: add project_id and default_branch
    if inspector.has_table("repositories"):
        existing_cols = {c["name"] for c in inspector.get_columns("repositories")}
        if "project_id" not in existing_cols:
            op.add_column("repositories", sa.Column("project_id", sa.Integer(), nullable=True))
            try:
                op.create_foreign_key(
                    "fk_repositories_project_id",
                    "repositories",
                    "projects",
                    ["project_id"],
                    ["id"],
                    ondelete="SET NULL",
                )
            except Exception:
                pass
        if "default_branch" not in existing_cols:
            op.add_column("repositories", sa.Column("default_branch", sa.String(100), server_default="main", nullable=True))

    # 2. security_findings: add repository_id and evidence_snippet
    if inspector.has_table("security_findings"):
        existing_cols = {c["name"] for c in inspector.get_columns("security_findings")}
        if "repository_id" not in existing_cols:
            op.add_column("security_findings", sa.Column("repository_id", sa.Integer(), nullable=True))
            try:
                op.create_foreign_key(
                    "fk_security_findings_repository_id",
                    "security_findings",
                    "repositories",
                    ["repository_id"],
                    ["id"],
                    ondelete="CASCADE",
                )
                op.create_index("ix_security_findings_repository_id", "security_findings", ["repository_id"])
            except Exception:
                pass
        if "evidence_snippet" not in existing_cols:
            op.add_column("security_findings", sa.Column("evidence_snippet", sa.Text(), nullable=True))

    # 3. review_records: add repository_id
    if inspector.has_table("review_records"):
        existing_cols = {c["name"] for c in inspector.get_columns("review_records")}
        if "repository_id" not in existing_cols:
            op.add_column("review_records", sa.Column("repository_id", sa.Integer(), nullable=True))
            try:
                op.create_foreign_key(
                    "fk_review_records_repository_id",
                    "review_records",
                    "repositories",
                    ["repository_id"],
                    ["id"],
                    ondelete="CASCADE",
                )
                op.create_index("ix_review_records_repository_id", "review_records", ["repository_id"])
            except Exception:
                pass

    # 4. chat_messages: add session_id
    if inspector.has_table("chat_messages"):
        existing_cols = {c["name"] for c in inspector.get_columns("chat_messages")}
        if "session_id" not in existing_cols:
            op.add_column("chat_messages", sa.Column("session_id", sa.Integer(), nullable=True))
            try:
                op.create_foreign_key(
                    "fk_chat_messages_session_id",
                    "chat_messages",
                    "chat_sessions",
                    ["session_id"],
                    ["id"],
                    ondelete="CASCADE",
                )
                op.create_index("ix_chat_messages_session_id", "chat_messages", ["session_id"])
            except Exception:
                pass


def downgrade() -> None:
    # Optional downgrade logic
    pass
