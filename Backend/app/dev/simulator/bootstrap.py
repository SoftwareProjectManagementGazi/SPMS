"""Bootstrap stage of the simulator.

Step 1: wipe every data table while keeping the schema and migration
history. ``alembic_version`` and ``system_config`` are preserved so we
don't have to re-run migrations or re-seed admin-tuned config keys.

Step 2: call the existing seed helpers with ``skip_tasks=True`` so the
baseline (roles, users, templates, projects, columns, sprints, teams,
milestones, artifacts) is in place — but no synthetic tasks or audit_log
rows are written. The discrete-event simulator then drives those on top.
"""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


logger = logging.getLogger(__name__)


# alembic_version: schema migration history — never wipe.
# system_config: admin-tunable runtime settings — leave alone.
_KEEP_TABLES = {"alembic_version", "system_config"}


async def truncate_all_data(session: AsyncSession) -> None:
    """Single CASCADE TRUNCATE across all non-system tables.

    RESTART IDENTITY resets per-table sequences so post-bootstrap IDs start
    from 1 — that keeps snapshot SQL files small and human-readable.
    """
    res = await session.execute(
        text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
    )
    tables = [row[0] for row in res.fetchall() if row[0] not in _KEEP_TABLES]
    if not tables:
        return
    logger.info(f"BOOTSTRAP: truncating {len(tables)} data tables")
    # ``RESTART IDENTITY CASCADE`` — sequences reset and dependent rows in
    # tables not in the list (none expected here, but defensive) follow.
    await session.execute(
        text("TRUNCATE TABLE " + ", ".join(tables) + " RESTART IDENTITY CASCADE")
    )
    await session.commit()


async def bootstrap_baseline(session: AsyncSession) -> None:
    """Truncate + reseed-without-tasks. Leaves DB ready for the event loop."""
    from app.infrastructure.database.seeder import seed_data

    await truncate_all_data(session)
    logger.info("BOOTSTRAP: seeding baseline (skip_tasks=True)")
    await seed_data(session, skip_tasks=True)
    logger.info("BOOTSTRAP: baseline complete")
