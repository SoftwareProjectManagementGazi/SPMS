"""Phase 9 schema: Project.status, Task.phase_id, Team.leader_id,
ProcessTemplate new columns, audit_log.metadata JSONB column,
and 3 new tables (milestones, artifacts, phase_reports).

Revision ID: 005_phase9
Revises: 004_phase5
Create Date: 2026-04-21

Covers:
- BACK-01: projects.status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
- BACK-02: tasks.phase_id VARCHAR(20) NULL
- D-08:  audit_log.metadata JSONB NULL (Python attr: extra_metadata to avoid Base.metadata clash — Pitfall 7)
- D-13:  teams.leader_id INTEGER NULL FK users(id)
- D-27:  process_templates.default_artifacts, default_phase_criteria, default_workflow JSONB columns
- D-43:  process_templates.cycle_label_tr, cycle_label_en VARCHAR(50) columns
- D-45:  projects.process_template_id INTEGER NULL FK process_templates(id) + backfill from methodology
- BACK-04: CREATE TABLE milestones (with GIN index on linked_phase_ids)
- BACK-05: CREATE TABLE artifacts
- BACK-06: CREATE TABLE phase_reports (with partial unique index ux_phase_reports_active)
- D-34:  Backfill process_config.schema_version = 1 for all existing projects

NOTE: projects.methodology column is NOT dropped in this migration.
D-45 explicitly defers the methodology drop to migration 006 (planned for Phase 10+)
after the frontend fully switches to process_template_id. This preserves a safe
rollback window during active v2.0 rollout.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = "005_phase9"
down_revision = "004_phase5"
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# Idempotent helpers — copied verbatim from 004_phase5_schema.py lines 25-48
# ---------------------------------------------------------------------------

def _table_exists(table_name: str) -> bool:
    """Check if a table already exists (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


def _enum_value_exists(enum_name: str, value: str) -> bool:
    """Check if an enum value already exists in a PostgreSQL enum type.

    Copied for forward compatibility — not used in this migration but
    maintained here so the pattern is available when 006 extends enums.
    """
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_enum e "
            "JOIN pg_type t ON e.enumtypid = t.oid "
            "WHERE t.typname = :enum_name AND e.enumlabel = :value"
        ),
        {"enum_name": enum_name, "value": value},
    )
    return result.scalar() > 0


def _index_exists(index_name: str) -> bool:
    """Check if an index already exists in the public schema (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_indexes "
            "WHERE schemaname='public' AND indexname=:n"
        ),
        {"n": index_name},
    )
    return result.scalar() > 0


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # -------------------------------------------------------------------------
    # BACK-01: projects.status (ACTIVE / COMPLETED / ON_HOLD / ARCHIVED)
    # VARCHAR(20) NOT NULL with server_default so no table rewrite is required
    # on Postgres 11+ (metadata-only ALTER when default is set at column level).
    # -------------------------------------------------------------------------
    if not _column_exists("projects", "status"):
        op.add_column(
            "projects",
            sa.Column(
                "status",
                sa.String(20),
                nullable=False,
                server_default="ACTIVE",
            ),
        )
    if not _index_exists("ix_projects_status"):
        op.create_index("ix_projects_status", "projects", ["status"])

    # -------------------------------------------------------------------------
    # D-45: projects.process_template_id (nullable FK to process_templates.id)
    # Backfill: map existing methodology enum → process_templates row by UPPER(name).
    # Both columns coexist until migration 006 drops methodology (after Phase 10+).
    # -------------------------------------------------------------------------
    if not _column_exists("projects", "process_template_id"):
        op.add_column(
            "projects",
            sa.Column(
                "process_template_id",
                sa.Integer(),
                sa.ForeignKey("process_templates.id"),
                nullable=True,
            ),
        )
    if not _index_exists("ix_projects_process_template_id"):
        op.create_index(
            "ix_projects_process_template_id",
            "projects",
            ["process_template_id"],
        )
    # Backfill: match by UPPER(name) = methodology text value for existing rows.
    # Safe to re-run: WHERE clause excludes already-filled rows.
    op.execute(
        sa.text(
            "UPDATE projects p "
            "SET process_template_id = pt.id "
            "FROM process_templates pt "
            "WHERE UPPER(pt.name) = p.methodology::text "
            "AND p.process_template_id IS NULL"
        )
    )

    # -------------------------------------------------------------------------
    # BACK-02: tasks.phase_id (nullable VARCHAR(20) — node ID reference)
    # -------------------------------------------------------------------------
    if not _column_exists("tasks", "phase_id"):
        op.add_column(
            "tasks",
            sa.Column("phase_id", sa.String(20), nullable=True),
        )
    if not _index_exists("ix_tasks_phase_id"):
        op.create_index("ix_tasks_phase_id", "tasks", ["phase_id"])

    # -------------------------------------------------------------------------
    # D-13: teams.leader_id (nullable FK to users.id)
    # Team Leader is organizational, not project-level (see CONTEXT.md D-13).
    # -------------------------------------------------------------------------
    if not _column_exists("teams", "leader_id"):
        op.add_column(
            "teams",
            sa.Column(
                "leader_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=True,
            ),
        )
    if not _index_exists("ix_teams_leader_id"):
        op.create_index("ix_teams_leader_id", "teams", ["leader_id"])

    # -------------------------------------------------------------------------
    # D-27, D-43: process_templates new columns
    # JSONB columns for default artifact/phase/workflow definitions;
    # VARCHAR(50) cycle label i18n columns.
    # -------------------------------------------------------------------------
    for col_name, col_type in [
        ("default_artifacts", JSONB),
        ("default_phase_criteria", JSONB),
        ("default_workflow", JSONB),
    ]:
        if not _column_exists("process_templates", col_name):
            op.add_column(
                "process_templates",
                sa.Column(col_name, col_type, nullable=True),
            )
    if not _column_exists("process_templates", "cycle_label_tr"):
        op.add_column(
            "process_templates",
            sa.Column("cycle_label_tr", sa.String(50), nullable=True),
        )
    if not _column_exists("process_templates", "cycle_label_en"):
        op.add_column(
            "process_templates",
            sa.Column("cycle_label_en", sa.String(50), nullable=True),
        )

    # -------------------------------------------------------------------------
    # D-08: audit_log.metadata JSONB column
    # DB column is literally "metadata"; Python ORM attribute is "extra_metadata"
    # to avoid clashing with SQLAlchemy's reserved Base.metadata attribute
    # (Pitfall 7 — see audit_log.py for the Column("metadata", ...) alias trick).
    # -------------------------------------------------------------------------
    if not _column_exists("audit_log", "metadata"):
        op.add_column(
            "audit_log",
            sa.Column("metadata", JSONB, nullable=True),
        )

    # -------------------------------------------------------------------------
    # BACK-04: milestones table
    # -------------------------------------------------------------------------
    if not _table_exists("milestones"):
        op.create_table(
            "milestones",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("target_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "status",
                sa.String(20),
                nullable=False,
                server_default="pending",
            ),
            sa.Column(
                "linked_phase_ids",
                JSONB,
                nullable=False,
                server_default="[]",
            ),
            sa.Column(
                "version",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _index_exists("ix_milestones_project_id"):
        op.create_index("ix_milestones_project_id", "milestones", ["project_id"])
    if not _index_exists("ix_milestones_id"):
        op.create_index("ix_milestones_id", "milestones", ["id"])
    # GIN index for JSONB containment queries (@>) — cannot use op.create_index
    # because GIN requires raw DDL for jsonb_ops (Pitfall 6).
    if not _index_exists("ix_milestones_linked_phase_ids_gin"):
        op.execute(
            "CREATE INDEX ix_milestones_linked_phase_ids_gin ON milestones USING GIN (linked_phase_ids)"
        )

    # -------------------------------------------------------------------------
    # BACK-05: artifacts table
    # -------------------------------------------------------------------------
    if not _table_exists("artifacts"):
        op.create_table(
            "artifacts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column(
                "status",
                sa.String(20),
                nullable=False,
                server_default="not_created",
            ),
            sa.Column(
                "assignee_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=True,
            ),
            sa.Column("linked_phase_id", sa.String(20), nullable=True),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column(
                "file_id",
                sa.Integer(),
                sa.ForeignKey("files.id"),
                nullable=True,
            ),
            sa.Column(
                "version",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _index_exists("ix_artifacts_project_id"):
        op.create_index("ix_artifacts_project_id", "artifacts", ["project_id"])
    if not _index_exists("ix_artifacts_assignee_id"):
        op.create_index("ix_artifacts_assignee_id", "artifacts", ["assignee_id"])
    if not _index_exists("ix_artifacts_linked_phase_id"):
        op.create_index(
            "ix_artifacts_linked_phase_id",
            "artifacts",
            ["linked_phase_id"],
        )
    if not _index_exists("ix_artifacts_id"):
        op.create_index("ix_artifacts_id", "artifacts", ["id"])

    # -------------------------------------------------------------------------
    # BACK-06: phase_reports table
    # -------------------------------------------------------------------------
    if not _table_exists("phase_reports"):
        op.create_table(
            "phase_reports",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("phase_id", sa.String(20), nullable=False),
            sa.Column(
                "cycle_number",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "revision",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column("summary_task_count", sa.Integer(), nullable=True),
            sa.Column("summary_done_count", sa.Integer(), nullable=True),
            sa.Column("summary_moved_count", sa.Integer(), nullable=True),
            sa.Column("summary_duration_days", sa.Integer(), nullable=True),
            sa.Column(
                "completed_tasks_notes",
                JSONB,
                nullable=False,
                server_default="{}",
            ),
            sa.Column("issues", sa.Text(), nullable=True),
            sa.Column("lessons", sa.Text(), nullable=True),
            sa.Column("recommendations", sa.Text(), nullable=True),
            sa.Column(
                "created_by",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=True,
            ),
            sa.Column(
                "version",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _index_exists("ix_phase_reports_project_id"):
        op.create_index(
            "ix_phase_reports_project_id",
            "phase_reports",
            ["project_id"],
        )
    if not _index_exists("ix_phase_reports_id"):
        op.create_index("ix_phase_reports_id", "phase_reports", ["id"])
    # Partial unique index: only one active (non-deleted) report per
    # (project_id, phase_id, cycle_number) combination.
    # Raw SQL required because partial WHERE clauses cannot be expressed
    # via op.create_index (Pitfall 8).
    if not _index_exists("ux_phase_reports_active"):
        op.execute(
            "CREATE UNIQUE INDEX ux_phase_reports_active ON phase_reports (project_id, phase_id, cycle_number) WHERE is_deleted = FALSE"
        )

    # -------------------------------------------------------------------------
    # D-34: Backfill schema_version on existing projects
    # Ensures every project has process_config.schema_version = 1.
    # jsonb_set with COALESCE handles both NULL process_config and
    # existing non-null objects that just lack the schema_version key.
    # Safe to re-run: WHERE clause skips rows already having schema_version.
    # -------------------------------------------------------------------------
    op.execute(
        sa.text(
            "UPDATE projects "
            "SET process_config = jsonb_set("
            "    COALESCE(process_config, '{}'::jsonb), "
            "    '{schema_version}', "
            "    '1'::jsonb"
            ") "
            "WHERE process_config IS NULL OR NOT (process_config ? 'schema_version')"
        )
    )

    # -------------------------------------------------------------------------
    # D-45 NOTE: projects.methodology column is intentionally NOT dropped here.
    # The drop is deferred to migration 006 (Phase 10+) once the frontend fully
    # uses process_template_id and the safe rollback window has passed.
    # -------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Reverse in the opposite order of upgrade.

    # phase_reports (drop partial index first, then table)
    if _index_exists("ux_phase_reports_active"):
        op.execute("DROP INDEX IF EXISTS ux_phase_reports_active")
    if _index_exists("ix_phase_reports_id"):
        op.drop_index("ix_phase_reports_id", table_name="phase_reports")
    if _index_exists("ix_phase_reports_project_id"):
        op.drop_index("ix_phase_reports_project_id", table_name="phase_reports")
    if _table_exists("phase_reports"):
        op.drop_table("phase_reports")

    # artifacts
    if _index_exists("ix_artifacts_id"):
        op.drop_index("ix_artifacts_id", table_name="artifacts")
    if _index_exists("ix_artifacts_linked_phase_id"):
        op.drop_index("ix_artifacts_linked_phase_id", table_name="artifacts")
    if _index_exists("ix_artifacts_assignee_id"):
        op.drop_index("ix_artifacts_assignee_id", table_name="artifacts")
    if _index_exists("ix_artifacts_project_id"):
        op.drop_index("ix_artifacts_project_id", table_name="artifacts")
    if _table_exists("artifacts"):
        op.drop_table("artifacts")

    # milestones (drop GIN index first, then regular indexes, then table)
    if _index_exists("ix_milestones_linked_phase_ids_gin"):
        op.execute("DROP INDEX IF EXISTS ix_milestones_linked_phase_ids_gin")
    if _index_exists("ix_milestones_id"):
        op.drop_index("ix_milestones_id", table_name="milestones")
    if _index_exists("ix_milestones_project_id"):
        op.drop_index("ix_milestones_project_id", table_name="milestones")
    if _table_exists("milestones"):
        op.drop_table("milestones")

    # audit_log.metadata
    if _column_exists("audit_log", "metadata"):
        op.drop_column("audit_log", "metadata")

    # process_templates new columns (reverse order)
    for col in [
        "cycle_label_en",
        "cycle_label_tr",
        "default_workflow",
        "default_phase_criteria",
        "default_artifacts",
    ]:
        if _column_exists("process_templates", col):
            op.drop_column("process_templates", col)

    # teams.leader_id
    if _index_exists("ix_teams_leader_id"):
        op.drop_index("ix_teams_leader_id", table_name="teams")
    if _column_exists("teams", "leader_id"):
        op.drop_column("teams", "leader_id")

    # tasks.phase_id
    if _index_exists("ix_tasks_phase_id"):
        op.drop_index("ix_tasks_phase_id", table_name="tasks")
    if _column_exists("tasks", "phase_id"):
        op.drop_column("tasks", "phase_id")

    # projects.process_template_id
    if _index_exists("ix_projects_process_template_id"):
        op.drop_index("ix_projects_process_template_id", table_name="projects")
    if _column_exists("projects", "process_template_id"):
        op.drop_column("projects", "process_template_id")

    # projects.status
    if _index_exists("ix_projects_status"):
        op.drop_index("ix_projects_status", table_name="projects")
    if _column_exists("projects", "status"):
        op.drop_column("projects", "status")

    # NOTE: The schema_version backfill is NOT reversed because:
    # 1. process_config is a JSON blob — its content changes are non-destructive
    # 2. Restoring pre-backfill state would require knowing which rows had NULL
    #    process_config (information not stored at upgrade time)
    # 3. The presence of schema_version=1 in process_config is harmless to
    #    pre-Phase-9 code that ignores unknown keys
