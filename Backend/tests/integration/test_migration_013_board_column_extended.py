"""Phase 17 C4 — migration 013 schema + backfill smoke test.

Asserts the six new ``board_columns`` workflow-engine fields exist on the
test database with the expected types & defaults, and that the backfill UPDATE
correctly derives ``is_initial`` / ``is_terminal`` / ``category`` from each
project's ``order_index`` range.

Marked ``requires_db`` so the conftest auto-skip hook drops this when Postgres
is unreachable (matches the pattern in test_migration_007_idempotency.py).
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.requires_db


_EXPECTED_NEW_COLUMNS = {
    "category",
    "is_initial",
    "is_terminal",
    "max_duration_days",
    "entry_policy",
    "exit_policy",
}


@pytest.mark.asyncio
async def test_migration_013_added_six_new_columns(db_session):
    """All six workflow-engine fields show up in information_schema after upgrade head."""
    from sqlalchemy import text

    result = await db_session.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name='board_columns'"
        )
    )
    present = {row[0] for row in result}
    missing = _EXPECTED_NEW_COLUMNS - present
    assert not missing, f"Migration 013 didn't add: {missing}"


@pytest.mark.asyncio
async def test_migration_013_server_defaults_match_design(db_session):
    """``category='todo'``, ``is_initial=false``, ``entry_policy='any'`` etc.

    These DB-level defaults guarantee that any future migration / raw SQL
    INSERT that forgets to specify the new columns still lands in a sane state.
    """
    from sqlalchemy import text

    result = await db_session.execute(
        text(
            "SELECT column_name, column_default "
            "FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name='board_columns' "
            "AND column_name = ANY(:names)"
        ),
        {"names": list(_EXPECTED_NEW_COLUMNS)},
    )
    defaults = {row[0]: (row[1] or "").lower() for row in result}

    # PostgreSQL renders the default as "'todo'::character varying" so we just
    # substring-match — robust to PG version cosmetic differences.
    assert "'todo'" in defaults.get("category", "")
    assert "false" in defaults.get("is_initial", "")
    assert "false" in defaults.get("is_terminal", "")
    assert "'any'" in defaults.get("entry_policy", "")
    assert "'any'" in defaults.get("exit_policy", "")
    # max_duration_days intentionally has NO default (NULL = unbounded).
    assert defaults.get("max_duration_days", "") in ("", "null")


@pytest.mark.asyncio
async def test_migration_013_backfills_first_column_is_initial(db_session):
    """Seed three columns inside a fresh project, NULL their workflow fields,
    re-run the same backfill UPDATE migration 013 uses, and assert the
    derivation matches the design contract:

      * smallest order_index → is_initial=True,  category='todo'
      * largest  order_index → is_terminal=True, category='done'
      * middle                → is_initial=False, is_terminal=False, category='in_progress'

    We use raw SQL throughout (no ORM) to avoid pulling every NOT-NULL on
    ``projects`` (key/methodology/status etc.) into scope. We also pick a
    project_id well above any seeded fixture (-1) so the project_id partitioned
    SELECT MIN/MAX inside the backfill only sees these three test rows.
    """
    from sqlalchemy import text

    # Use project_id = -1 (no FK on board_columns.project_id direction, only
    # ON DELETE CASCADE — so an orphan -1 won't fault the constraint).
    # Actually project_id has an FK; safer to discover an existing project_id.
    existing_pid_result = await db_session.execute(
        text("SELECT id FROM projects ORDER BY id LIMIT 1")
    )
    real_pid = existing_pid_result.scalar()
    if real_pid is None:
        pytest.skip("No existing project to attach test board_columns to")

    # Insert three columns with order_index values that are guaranteed higher
    # than any pre-existing column on that project, so the MIN/MAX partition
    # contains a mix of real + test rows but our three appear at fixed slots.
    # To keep semantics simple, we put them into a brand-new project_id range
    # by spinning a temporary project via raw SQL with all NOT NULL columns.
    temp_pid_result = await db_session.execute(
        text(
            """
            INSERT INTO projects (key, name, methodology, status, version, is_deleted, manager_id)
            VALUES (:k, :n, 'KANBAN', 'ACTIVE', 1, FALSE, NULL)
            RETURNING id
            """
        ),
        {"k": "M13-T", "n": "MIG013 BackfillTest"},
    )
    pid = temp_pid_result.scalar()
    await db_session.flush()

    # Three columns, explicit NULL on the workflow fields.
    await db_session.execute(
        text(
            """
            INSERT INTO board_columns (project_id, name, order_index, wip_limit,
                                       category, is_initial, is_terminal)
            VALUES
              (:p, 'First',  0, 0, NULL, NULL, NULL),
              (:p, 'Middle', 1, 0, NULL, NULL, NULL),
              (:p, 'Last',   2, 0, NULL, NULL, NULL)
            """
        ),
        {"p": pid},
    )
    await db_session.flush()

    # Re-run the same backfill query migration 013 executes — scoped to our pid.
    await db_session.execute(
        text(
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
                bc.project_id = :pid
                AND (bc.is_initial IS NULL OR bc.is_terminal IS NULL
                     OR bc.category IS NULL OR bc.category = 'todo')
            """
        ),
        {"pid": pid},
    )
    await db_session.flush()

    # Verify.
    result = await db_session.execute(
        text(
            "SELECT name, order_index, is_initial, is_terminal, category "
            "FROM board_columns WHERE project_id = :pid ORDER BY order_index"
        ),
        {"pid": pid},
    )
    rows = result.all()
    assert len(rows) == 3

    first, middle, last = rows
    assert first.is_initial is True and first.is_terminal is False
    assert first.category == "todo"
    assert middle.is_initial is False and middle.is_terminal is False
    assert middle.category == "in_progress"
    assert last.is_initial is False and last.is_terminal is True
    assert last.category == "done"
