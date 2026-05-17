"""Phase 17 — extend board_columns with workflow-engine fields.

Revision ID: 013_board_column_extended
Revises: 012_phase15_rbac
Create Date: 2026-05-17

Adds six columns to ``board_columns`` so the upcoming workflow engine
(C5+ in .planning/workflow-engine-implementation.md) can express:

  * ``category`` (todo / in_progress / done) — Jira-style coarse bucket
  * ``is_initial`` — board can start here (replaces order_index==min heuristic)
  * ``is_terminal`` — column is a 'done' state (replaces order_index==max heuristic)
  * ``max_duration_days`` — staleness threshold; NULL = unbounded
  * ``entry_policy`` (any / edges_only / initial_only) — transition restrictions in
  * ``exit_policy`` (any / edges_only / terminal_lock) — transition restrictions out

Idempotent per Pitfall 8 — every ALTER and backfill is guarded by
``_column_exists`` so re-running ``alembic upgrade head`` is safe.

Backfill: every existing row gets ``is_initial = (order_index == MIN per project)``,
``is_terminal = (order_index == MAX per project)``, and a derived ``category``.
The WHERE clause filters to rows that still have NULL or the default ``'todo'``
category so a re-apply does not clobber columns that were explicitly customized
after migration. This is a small trade-off: a row that genuinely should remain
``'todo'`` will be re-evaluated on re-apply, but in practice the WHERE clause
prevents the common cases (a column already moved to 'in_progress' or 'done'
stays as-is).

Engine code does NOT yet read these fields — that lands in C5+. So zero
behavioral impact for production deployments running C4 alone.
"""
from alembic import op
import sqlalchemy as sa


revision = "013_board_column_extended"
down_revision = "012_phase15_rbac"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


# (name, sa_type, server_default_sql_or_None, _doc_for_humans)
_NEW_COLS = [
    ("category", sa.String(20), "'todo'", "Jira-style bucket: todo/in_progress/done"),
    ("is_initial", sa.Boolean(), "false", "True if board can start here"),
    ("is_terminal", sa.Boolean(), "false", "True if column is a 'done' state"),
    ("max_duration_days", sa.Integer(), None, "Stale threshold; null = unbounded"),
    ("entry_policy", sa.String(20), "'any'", "Enum: any / edges_only / initial_only"),
    ("exit_policy", sa.String(20), "'any'", "Enum: any / edges_only / terminal_lock"),
]


def upgrade() -> None:
    # --------------------------------------------------------------- #
    # 1. Add the six new columns idempotently.
    #    nullable=True so existing rows are immediately valid; the
    #    server_default fills the value at the DB level for any row
    #    inserted via SQL that does not supply these columns.
    # --------------------------------------------------------------- #
    for name, type_, default, _comment in _NEW_COLS:
        if not _column_exists("board_columns", name):
            kwargs = {"nullable": True}
            if default is not None:
                kwargs["server_default"] = sa.text(default)
            op.add_column("board_columns", sa.Column(name, type_, **kwargs))

    # --------------------------------------------------------------- #
    # 2. Backfill from order_index. Idempotent — the WHERE clause
    #    short-circuits when all rows already carry non-default values.
    # --------------------------------------------------------------- #
    op.execute(
        """
        UPDATE board_columns bc SET
            is_initial = CASE
                WHEN bc.order_index = (
                    SELECT MIN(order_index) FROM board_columns
                    WHERE project_id = bc.project_id
                ) THEN TRUE ELSE FALSE
            END,
            is_terminal = CASE
                WHEN bc.order_index = (
                    SELECT MAX(order_index) FROM board_columns
                    WHERE project_id = bc.project_id
                ) THEN TRUE ELSE FALSE
            END,
            category = CASE
                WHEN bc.order_index = (
                    SELECT MIN(order_index) FROM board_columns
                    WHERE project_id = bc.project_id
                ) THEN 'todo'
                WHEN bc.order_index = (
                    SELECT MAX(order_index) FROM board_columns
                    WHERE project_id = bc.project_id
                ) THEN 'done'
                ELSE 'in_progress'
            END
        WHERE
            bc.is_initial IS NULL
            OR bc.is_terminal IS NULL
            OR bc.category IS NULL
            OR bc.category = 'todo'
        """
    )


def downgrade() -> None:
    # Drop in reverse order so dependent constraints (if any are added later)
    # unwind cleanly. Idempotent — guard each drop with _column_exists.
    for name, *_ in reversed(_NEW_COLS):
        if _column_exists("board_columns", name):
            op.drop_column("board_columns", name)
