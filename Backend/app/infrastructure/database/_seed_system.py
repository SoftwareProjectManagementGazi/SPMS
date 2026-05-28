"""Idempotent runtime seed for ``system_config`` + process_templates cleanup.

Background
----------
Migration ``migration_005.py`` originally created and seeded both tables
*inside* a ``if not _table_exists(...)`` block. That meant the seed only
fired on first DB creation — any new key added to the list later never
landed on existing installs, and the admin UI silently lacked the
corresponding setting.

This module owns the runtime side:

* ``seed_system_config`` re-applies the canonical key/value list on every
  boot. ``ON CONFLICT (key) DO NOTHING`` keeps it safe; user-edited values
  are preserved because the row already exists.
* ``cleanup_uppercase_templates`` deletes the legacy ``SCRUM`` / ``KANBAN``
  / ``WATERFALL`` / ``ITERATIVE`` rows that migration_005 used to insert.
  Those collided with ``seeder.py::seed_process_templates`` which seeds the
  TitleCase variants (``Scrum``, ``Kanban``, ``Waterfall``) — having both
  produced ghost templates in the Create Project wizard. We delete the
  UPPERCASE rows only when their TitleCase counterpart exists, so no data
  is lost on DBs that somehow only have the UPPERCASE seed.

Both functions guard against missing tables so partial-alembic states
short-circuit cleanly.
"""
from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# CANONICAL system_config key/value pairs. Add new keys here — they'll
# land on every existing install at the next boot.
SYSTEM_CONFIG_DEFAULTS: list[tuple[str, str]] = [
    ("default_sprint_duration_days", "14"),
    ("max_task_limit", "100"),
    ("default_notification_frequency", "instant"),
    ("reporting_module_enabled", "true"),
    ("integrations_enabled", "true"),
    ("primary_brand_color", ""),
    ("chart_theme", "default"),
]


# UPPERCASE template names that migration_005 used to insert. We delete
# these in favour of seeder.py's TitleCase canonical seeds — but only
# when the TitleCase row exists, otherwise the wizard would be empty.
_LEGACY_UPPERCASE_TEMPLATES: list[tuple[str, str]] = [
    ("SCRUM", "Scrum"),
    ("KANBAN", "Kanban"),
    ("WATERFALL", "Waterfall"),
    # ITERATIVE is not in seeder.py's canonical TitleCase list, so we
    # don't delete it — that would orphan any project that referenced it.
]


async def _table_exists(session: AsyncSession, name: str) -> bool:
    res = await session.execute(
        text(
            "SELECT to_regclass(:n) IS NOT NULL"
        ),
        {"n": f"public.{name}"},
    )
    return bool(res.scalar())


async def seed_system_config(session: AsyncSession) -> None:
    """Re-apply the canonical system_config defaults idempotently.

    Existing rows are left alone (ON CONFLICT DO NOTHING). New keys added
    to ``SYSTEM_CONFIG_DEFAULTS`` land on every install at next boot.
    """
    if not await _table_exists(session, "system_config"):
        logger.info("SEEDER: system_config table missing — skipping config top-up")
        return

    inserted = 0
    for key, value in SYSTEM_CONFIG_DEFAULTS:
        res = await session.execute(
            text(
                "INSERT INTO system_config (key, value) "
                "VALUES (:key, :value) "
                "ON CONFLICT (key) DO NOTHING"
            ),
            {"key": key, "value": value},
        )
        inserted += res.rowcount or 0
    await session.commit()
    if inserted:
        logger.info(f"SEEDER: system_config top-up — inserted {inserted} new key(s)")


async def cleanup_uppercase_templates(session: AsyncSession) -> None:
    """Drop legacy UPPERCASE process_templates rows when their TitleCase
    twin already exists.

    Safety:
      * Only deletes when BOTH the upper and title row are present, so a
        DB with only UPPERCASE rows survives untouched.
      * UPDATEs ``projects.process_template_id`` to point at the TitleCase
        row before deleting, so any project that referenced the upper row
        keeps its template association.
      * ITERATIVE is excluded from the list because seeder.py doesn't ship
        an "Iterative" TitleCase template; deleting the upper row would
        orphan referencing projects.
    """
    if not await _table_exists(session, "process_templates"):
        return

    deleted = 0
    for upper_name, title_name in _LEGACY_UPPERCASE_TEMPLATES:
        # Look up both rows.
        res = await session.execute(
            text(
                "SELECT name, id FROM process_templates "
                "WHERE name IN (:u, :t)"
            ),
            {"u": upper_name, "t": title_name},
        )
        rows = {row[0]: row[1] for row in res.fetchall()}
        upper_id = rows.get(upper_name)
        title_id = rows.get(title_name)

        if upper_id is None or title_id is None:
            # Either the legacy row is already gone OR the canonical row
            # is missing — in both cases we can't safely delete.
            continue

        # Re-point any project referencing the upper row to the title row.
        await session.execute(
            text(
                "UPDATE projects SET process_template_id = :title "
                "WHERE process_template_id = :upper"
            ),
            {"title": title_id, "upper": upper_id},
        )
        # Then drop the upper row.
        res = await session.execute(
            text("DELETE FROM process_templates WHERE id = :upper"),
            {"upper": upper_id},
        )
        deleted += res.rowcount or 0

    if deleted:
        await session.commit()
        logger.info(
            f"SEEDER: process_templates cleanup — removed {deleted} legacy "
            f"UPPERCASE template row(s)"
        )
