"""Wave 2 W2-C9: add process_templates.default_columns JSONB column.

Revision ID: 014_template_default_columns
Revises: 013_board_column_extended
Create Date: 2026-05-17

Adds a new JSONB column ``default_columns`` to ``process_templates``. This
carries engine-aware default column specs (``category``, ``is_initial``,
``is_terminal``, ``max_duration_days``, ``entry_policy``, ``exit_policy``)
that ``CreateProjectUseCase`` (W2-C10) will use to seed columns for new
projects, replacing the hard-coded 5-column list in
``SeedDefaultColumnsUseCase``.

The existing ``columns`` JSONB (shape: ``{name, order, wip_limit?}``) is
preserved as a read fallback for clients that have not migrated to the
new shape. W2-C10's seed logic prefers ``default_columns`` when present.

**Source of truth:** The seed payload is imported from
``app.infrastructure.database._default_columns`` so the alembic backfill,
the runtime seeder, and any future W2-C10 ``CreateProjectUseCase`` logic
all share a single Python module. If the lists drift, every consumer
breaks at once — which is the desired blast radius for a structured
data contract.

**Idempotency:**

  * Column add is guarded by ``_column_exists`` so re-running
    ``alembic upgrade head`` is safe.
  * Backfill ``UPDATE`` uses ``WHERE default_columns IS NULL`` so a
    re-apply does not clobber rows that customized the field after the
    first run.
"""
from __future__ import annotations

import json

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# Single-source default column lists shared with the runtime seeder so
# the SQL backfill below and seeder.py emit byte-identical payloads.
from app.infrastructure.database._default_columns import (
    KANBAN_DEFAULT_COLUMNS,
    SCRUM_DEFAULT_COLUMNS,
    WATERFALL_DEFAULT_COLUMNS,
)


revision = "014_template_default_columns"
down_revision = "013_board_column_extended"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Postgres-only existence probe — mirrors migration 013's helper.

    The whole test suite runs on Postgres (see ``tests/conftest.py`` which
    parses ``settings.DATABASE_URL`` and provisions a real Postgres test DB),
    so ``information_schema`` is safe. If a SQLite fallback is ever added
    we'd switch to ``sa.inspect(bind).has_column(...)`` which is cross-DB.
    """
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


# Backfill dispatch: each tuple maps the builtin template name to the
# default-column payload shared from _default_columns.py. Template names
# match the seeder's casing exactly (``Scrum``/``Kanban``/``Waterfall``).
# Adding more templates (e.g., V-Modeli, Spiral) is intentionally out of
# scope for this migration — they're seeded by ``seeder_extended.py`` and
# carry only the legacy ``columns`` shape today; promoting them to
# ``default_columns`` is a follow-up.
_BACKFILL_TEMPLATES = (
    ("Scrum", SCRUM_DEFAULT_COLUMNS),
    ("Kanban", KANBAN_DEFAULT_COLUMNS),
    ("Waterfall", WATERFALL_DEFAULT_COLUMNS),
)


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Add the column idempotently. JSONB chosen so Postgres can query
    #    inside the array (W2-C10 may want to assert exactly one
    #    ``is_initial=true`` row at runtime).
    # ------------------------------------------------------------------ #
    if not _column_exists("process_templates", "default_columns"):
        op.add_column(
            "process_templates",
            sa.Column("default_columns", JSONB, nullable=True),
        )

    # ------------------------------------------------------------------ #
    # 2. Backfill the three built-in templates with engine-aware shapes.
    #    Parameterized via op.execute + a bound `default_columns` literal
    #    rather than f-string interpolation so we do not have to hand-
    #    escape single quotes inside the JSON payload (column names like
    #    "Bakım" stay clean, and any future name carrying an apostrophe
    #    is also safe).
    # ------------------------------------------------------------------ #
    for template_name, default_cols in _BACKFILL_TEMPLATES:
        payload = json.dumps(default_cols)
        op.execute(
            sa.text(
                "UPDATE process_templates "
                "SET default_columns = CAST(:payload AS JSONB) "
                "WHERE name = :name AND default_columns IS NULL"
            ).bindparams(payload=payload, name=template_name)
        )


def downgrade() -> None:
    # Drop the column outright; we deliberately don't try to preserve the
    # JSONB into a side table — the data can be re-derived from
    # ``_default_columns.py`` on a subsequent upgrade.
    if _column_exists("process_templates", "default_columns"):
        op.drop_column("process_templates", "default_columns")
