"""Migration 007: Backfill projects.process_template_id from methodology name.

Context
-------
ProjectCreateUseCase used to look up a process_template by methodology name
but never persisted the resolved template_id onto the project row. As a
result, every project created via the wizard (or any code path that didn't
seed it manually) shipped with `process_template_id = NULL`, and the
`process_template_name` join in the read DTO came back empty.

Frontend2 then fell back to displaying the raw `methodology` enum
("SCRUM" / "KANBAN" / "WATERFALL") in project cards, the portfolio table,
and the project detail header. The fix on the write side (manage_projects.py
CreateProjectUseCase now sets project.process_template_id) only covers
projects created after deploy — this one-off migration closes the gap for
existing rows.

Strategy
--------
Match each NULL project to the first built-in template whose name equals
the project's methodology, case-insensitive. The seeded templates landed
as "Scrum" / "Kanban" / "Waterfall" (TitleCase, from seeder.py), but a
migration-005 deployment path can leave them in upper case — so we match
loosely. Projects whose methodology has no matching template (e.g.
ITERATIVE on a DB that didn't seed an Iterative template) stay NULL; the
display layer keeps a defensive fallback for that case.

Idempotent: re-running is a no-op because the WHERE clause excludes any
project that already has a template_id, and rows with no template match
are guarded by an EXISTS check so the UPDATE doesn't blank them.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


async def upgrade(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        # Guard: the projects table or process_templates table may not exist
        # yet on a fresh DB during the very first lifespan pass; skip silently
        # in that case so migration ordering doesn't trip us up.
        check = await conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name IN "
                "('projects','process_templates')"
            )
        )
        if (check.scalar() or 0) < 2:
            return

        await conn.execute(
            text(
                """
                UPDATE projects AS p
                SET process_template_id = (
                    SELECT pt.id
                    FROM process_templates AS pt
                    WHERE LOWER(pt.name) = LOWER(p.methodology::text)
                    ORDER BY pt.is_builtin DESC, pt.id ASC
                    LIMIT 1
                )
                WHERE p.process_template_id IS NULL
                  AND p.is_deleted = FALSE
                  AND EXISTS (
                      SELECT 1 FROM process_templates AS pt
                      WHERE LOWER(pt.name) = LOWER(p.methodology::text)
                  )
                """
            )
        )
