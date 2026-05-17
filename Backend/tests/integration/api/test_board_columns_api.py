"""W2-C3: BoardColumn engine-field PATCH/GET round-trip integration tests.

Wave 1 (Phase 17 / migration 013) added six engine fields to the board_columns
table: ``category``, ``is_initial``, ``is_terminal``, ``max_duration_days``,
``entry_policy``, ``exit_policy``. Wave 1 also wired them through the
``UpdateColumnDTO`` Pydantic boundary (all six fields Optional, ``None`` means
"leave unchanged" per the existing patch semantics).

What was NOT validated end-to-end in Wave 1:
  * The PATCH /api/v1/projects/{project_id}/columns/{col_id} endpoint actually
    persists every engine field through SQLAlchemy.
  * GET /api/v1/projects/{project_id}/columns returns every engine field on
    every column (so the FE can render them without a separate fetch).
  * The Optional[int] ge=1 / Literal enum validators surface 422 properly.

W2-C3 closes that gap so W2-C6+ FE node engine field editor cannot regress
the contract silently.

Production code is UNCHANGED in W2-C3; this commit only adds tests.
"""
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


async def _seed_project_with_columns(db_session, key: str) -> tuple[int, list[int]]:
    """Seed a minimal project + 3 board_columns rows, return (project_id, [column_ids]).

    Uses raw SQL (the API CreateProjectUseCase does not seed columns inline —
    that lives in SeedDefaultColumnsUseCase which is exercised by the project
    creation endpoint, but for an isolated PATCH/GET test we want a deterministic
    row layout independent of any seeding side-effects).
    """
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
                "VALUES (:k, 'W2C3 Cols', now(), 'SCRUM', 'ACTIVE', '{}'::jsonb)"
            ),
            {"k": key},
        )
        await db_session.flush()
    pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()

    # Reset any pre-existing columns to keep the test deterministic when the
    # session reuses the same key on a previous (rolled-back) run.
    await db_session.execute(
        text("DELETE FROM board_columns WHERE project_id=:p"), {"p": pid}
    )
    # Insert three columns. is_initial / is_terminal seeded explicitly so the
    # GET round-trip can verify the defaults round-trip too.
    await db_session.execute(
        text(
            """
            INSERT INTO board_columns
                (project_id, name, order_index, wip_limit,
                 category, is_initial, is_terminal, max_duration_days,
                 entry_policy, exit_policy)
            VALUES
                (:p, 'Backlog', 0, 0, 'todo',        TRUE,  FALSE, NULL, 'any', 'any'),
                (:p, 'Doing',   1, 0, 'in_progress', FALSE, FALSE, NULL, 'any', 'any'),
                (:p, 'Done',    2, 0, 'done',        FALSE, TRUE,  NULL, 'any', 'any')
            """
        ),
        {"p": pid},
    )
    await db_session.flush()

    rows = (
        await db_session.execute(
            text(
                "SELECT id FROM board_columns WHERE project_id=:p "
                "ORDER BY order_index ASC"
            ),
            {"p": pid},
        )
    ).fetchall()
    return pid, [r[0] for r in rows]


@pytest.mark.asyncio
async def test_patch_column_engine_fields_round_trip(authenticated_client, db_session):
    """W2-C3: PATCH all six engine fields, GET response must surface every one.

    Pre-fix W1-C4 validation gap: although ``UpdateColumnDTO`` declared the
    fields and the UseCase applied them, no end-to-end integration test
    asserted the values land in the DB AND surface on GET. This guards
    W2-C6 (status-mode node engine field editor) from regressing.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL1")
    target_id = col_ids[1]  # middle column ('Doing')

    patch_body = {
        "category": "in_progress",
        "is_initial": False,
        "is_terminal": True,
        "max_duration_days": 7,
        "entry_policy": "edges_only",
        "exit_policy": "terminal_lock",
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}/columns/{target_id}", json=patch_body
        )
        assert r.status_code == 200, (
            f"PATCH must accept all six engine fields; got {r.status_code}: {r.text}"
        )

        r2 = await client.get(f"/api/v1/projects/{pid}/columns")
        assert r2.status_code == 200
        cols = r2.json()
        target = next((c for c in cols if c["id"] == target_id), None)
        assert target is not None, f"Column id {target_id} missing from GET response"

        assert target["category"] == "in_progress"
        assert target["is_initial"] is False
        assert target["is_terminal"] is True
        assert target["max_duration_days"] == 7
        assert target["entry_policy"] == "edges_only"
        assert target["exit_policy"] == "terminal_lock"


@pytest.mark.asyncio
async def test_patch_column_max_duration_days_null_leaves_unchanged(
    authenticated_client, db_session
):
    """W2-C3: ``max_duration_days=null`` PATCH leaves the prior value intact.

    Wave 1 ``UpdateColumnDTO`` defines every engine field as Optional with the
    documented contract "None means leave unchanged" (mirrors the existing
    UpdateColumnUseCase patch semantics for ``name`` / ``wip_limit``). To
    *clear* a previously-set ``max_duration_days`` would require a separate
    endpoint or a sentinel — Wave 3 territory if requested.

    This test pins the current behavior so a future PATCH-semantics change
    surfaces as a deliberate test edit, not a silent breakage.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL2")
    target_id = col_ids[0]

    async with authenticated_client(role="admin") as client:
        # Step 1: set max_duration_days = 14.
        r1 = await client.patch(
            f"/api/v1/projects/{pid}/columns/{target_id}",
            json={"max_duration_days": 14},
        )
        assert r1.status_code == 200, r1.text

        # Step 2: PATCH with explicit null. Per UpdateColumnDTO contract this
        # is "leave unchanged" — the existing 14 must survive.
        r2 = await client.patch(
            f"/api/v1/projects/{pid}/columns/{target_id}",
            json={"max_duration_days": None},
        )
        assert r2.status_code == 200, r2.text

        r3 = await client.get(f"/api/v1/projects/{pid}/columns")
        target = next(c for c in r3.json() if c["id"] == target_id)
        assert target["max_duration_days"] == 14, (
            "PATCH with null must leave prior value intact "
            "(W1-C4 UpdateColumnDTO 'None means unchanged' semantic)"
        )


@pytest.mark.asyncio
async def test_patch_column_invalid_entry_policy_rejected(
    authenticated_client, db_session
):
    """W2-C3: Literal[``any``, ``edges_only``, ``initial_only``] enum -> 422 on garbage."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL3")

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}/columns/{col_ids[0]}",
            json={"entry_policy": "wat"},
        )
        assert r.status_code == 422, (
            f"unknown entry_policy enum must yield 422; got {r.status_code}: {r.text}"
        )


@pytest.mark.asyncio
async def test_patch_column_invalid_category_rejected(
    authenticated_client, db_session
):
    """W2-C3: Literal[``todo``, ``in_progress``, ``done``] enum -> 422 on garbage."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL4")

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}/columns/{col_ids[0]}",
            json={"category": "wat"},
        )
        assert r.status_code == 422, (
            f"unknown category enum must yield 422; got {r.status_code}: {r.text}"
        )


@pytest.mark.asyncio
async def test_patch_column_max_duration_zero_rejected(
    authenticated_client, db_session
):
    """W2-C3: max_duration_days ge=1 -> 422 on 0 / negative.

    A "less than 1 day stale" cap is nonsensical for board columns
    (UpdateColumnDTO uses Field(None, ge=1)).
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL5")

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}/columns/{col_ids[0]}",
            json={"max_duration_days": 0},
        )
        assert r.status_code == 422, (
            f"max_duration_days=0 must yield 422 (ge=1); got {r.status_code}: {r.text}"
        )


@pytest.mark.asyncio
async def test_get_columns_returns_all_engine_fields(authenticated_client, db_session):
    """W2-C3: GET /columns response includes every engine field on every column.

    Pre-W2 the FE could not safely read engine fields without dual-fetch
    workarounds. This test makes the response shape an explicit contract:
    every BoardColumnDTO must surface category / is_initial / is_terminal /
    max_duration_days / entry_policy / exit_policy on each row.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid, col_ids = await _seed_project_with_columns(db_session, key="W2C3COL6")

    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/projects/{pid}/columns")
        assert r.status_code == 200, r.text
        cols = r.json()
        assert len(cols) == 3, f"expected 3 seeded columns, got {len(cols)}"

        for col in cols:
            for key in (
                "category",
                "is_initial",
                "is_terminal",
                "max_duration_days",
                "entry_policy",
                "exit_policy",
            ):
                assert key in col, (
                    f"BoardColumnDTO missing engine field '{key}' on column "
                    f"id={col.get('id')} name={col.get('name')!r}"
                )

        # Seeded layout: first is_initial=True, last is_terminal=True.
        cols_sorted = sorted(cols, key=lambda c: c["order_index"])
        assert cols_sorted[0]["is_initial"] is True
        assert cols_sorted[0]["is_terminal"] is False
        assert cols_sorted[-1]["is_initial"] is False
        assert cols_sorted[-1]["is_terminal"] is True
        # Middle column has neither flag set.
        assert cols_sorted[1]["is_initial"] is False
        assert cols_sorted[1]["is_terminal"] is False
