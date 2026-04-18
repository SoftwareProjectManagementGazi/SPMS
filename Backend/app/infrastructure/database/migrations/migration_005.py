"""Phase 7 schema: ITERATIVE enum value, process_config column on projects,
process_templates table, system_config table, and seed data.

This file provides an idempotent async upgrade function that can be called
directly from a lifespan hook without running the full Alembic CLI. For
Alembic-managed environments use the corresponding file in
alembic/versions/005_phase7_schema.py instead.

Covers:
- PROC-01: Add ITERATIVE value to methodology_type enum
- PROC-01/PROC-02: Add process_config JSONB column to projects table
- PROC-04/ADAPT-02: Create process_templates table with 4 built-in seeds
- ADAPT-05/ADAPT-06: Create system_config key-value table with default seeds
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


async def _table_exists(conn, table_name: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


async def _column_exists(conn, table_name: str, column_name: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


async def _enum_value_exists(conn, enum_name: str, value: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM pg_enum e "
            "JOIN pg_type t ON e.enumtypid = t.oid "
            "WHERE t.typname = :enum_name AND e.enumlabel = :value"
        ),
        {"enum_name": enum_name, "value": value},
    )
    return result.scalar() > 0


async def upgrade(engine: AsyncEngine) -> None:
    # -------------------------------------------------------------------------
    # PROC-01: Add ITERATIVE value to methodology_type enum.
    # CRITICAL: ALTER TYPE ADD VALUE cannot run inside a transaction block.
    # Use a raw connection with AUTOCOMMIT isolation level.
    # -------------------------------------------------------------------------
    autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with autocommit_engine.connect() as conn:
        if not await _enum_value_exists(conn, "methodology_type", "ITERATIVE"):
            await conn.execute(
                text("ALTER TYPE methodology_type ADD VALUE IF NOT EXISTS 'ITERATIVE'")
            )

    # -------------------------------------------------------------------------
    # All remaining DDL runs inside a regular transaction
    # -------------------------------------------------------------------------
    async with engine.begin() as conn:
        # PROC-01/PROC-02: Add process_config JSONB column to projects
        if not await _column_exists(conn, "projects", "process_config"):
            await conn.execute(
                text(
                    "ALTER TABLE projects "
                    "ADD COLUMN process_config JSONB"
                )
            )

        # PROC-04/ADAPT-02: Create process_templates table
        if not await _table_exists(conn, "process_templates"):
            await conn.execute(
                text("""
                    CREATE TABLE process_templates (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL UNIQUE,
                        is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
                        columns JSONB NOT NULL DEFAULT '[]',
                        recurring_tasks JSONB NOT NULL DEFAULT '[]',
                        behavioral_flags JSONB NOT NULL DEFAULT '{}',
                        description TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                    )
                """)
            )
            # Index on name for fast lookup
            await conn.execute(
                text(
                    "CREATE UNIQUE INDEX ix_process_templates_name "
                    "ON process_templates(name)"
                )
            )

            # Seed 4 built-in process templates (ON CONFLICT DO NOTHING for idempotency)
            await conn.execute(
                text("""
                    INSERT INTO process_templates (name, is_builtin, columns, recurring_tasks, behavioral_flags, description)
                    VALUES
                    (
                        'SCRUM',
                        TRUE,
                        '[{"name": "Is Birikimi", "order": 0}, {"name": "Yapilacaklar", "order": 1}, {"name": "Devam Eden", "order": 2}, {"name": "Inceleme", "order": 3}, {"name": "Tamamlandi", "order": 4}]'::jsonb,
                        '[{"name": "Gunluk Toplanti", "recurrence_type": "daily"}, {"name": "Sprint Degerlendirmesi", "recurrence_type": "weekly"}]'::jsonb,
                        '{"restrict_expired_sprints": true, "enforce_wip_limits": false, "enforce_sequential_dependencies": false}'::jsonb,
                        'Scrum surecine gore proje yonetimi. Sprint bazli calisma, gunluk toplantılar ve retrospektif toplantılar icerir.'
                    ),
                    (
                        'KANBAN',
                        TRUE,
                        '[{"name": "Yapilacaklar", "order": 0, "wip_limit": 0}, {"name": "Devam Eden", "order": 1, "wip_limit": 3}, {"name": "Test", "order": 2, "wip_limit": 0}, {"name": "Tamamlandi", "order": 3, "wip_limit": 0}]'::jsonb,
                        '[{"name": "Haftalik Senkronizasyon", "recurrence_type": "weekly"}]'::jsonb,
                        '{"enforce_wip_limits": true, "restrict_expired_sprints": false, "enforce_sequential_dependencies": false}'::jsonb,
                        'Kanban surecine gore surekli akis ile proje yonetimi. WIP limitleri ve gorsel pano merkezdedir.'
                    ),
                    (
                        'WATERFALL',
                        TRUE,
                        '[{"name": "Gereksinimler", "order": 0}, {"name": "Tasarim", "order": 1}, {"name": "Gelistirme", "order": 2}, {"name": "Test", "order": 3}, {"name": "Dagitim", "order": 4}]'::jsonb,
                        '[{"name": "Asama Degerlendirmesi", "recurrence_type": "weekly"}]'::jsonb,
                        '{"enforce_sequential_dependencies": true, "enforce_wip_limits": false, "restrict_expired_sprints": false}'::jsonb,
                        'Sirayla tamamlanan asama bazli proje yonetimi. Her asamanin tamamlanmasi bir sonraki asama icin gereklidir.'
                    ),
                    (
                        'ITERATIVE',
                        TRUE,
                        '[{"name": "Planlama", "order": 0}, {"name": "Analiz", "order": 1}, {"name": "Gelistirme", "order": 2}, {"name": "Degerlendirme", "order": 3}]'::jsonb,
                        '[{"name": "Iterasyon Planlama", "recurrence_type": "weekly"}]'::jsonb,
                        '{"enforce_sequential_dependencies": false, "enforce_wip_limits": false, "restrict_expired_sprints": false}'::jsonb,
                        'Tekrarlayan iterasyonlarla surekli iyilestirme surecidir. Her iterasyon planlama, analiz, gelistirme ve degerlendirme asamalari icerir.'
                    )
                    ON CONFLICT (name) DO NOTHING
                """)
            )

        # ADAPT-05/ADAPT-06: Create system_config key-value table
        if not await _table_exists(conn, "system_config"):
            await conn.execute(
                text("""
                    CREATE TABLE system_config (
                        key VARCHAR(100) PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                    )
                """)
            )

            # Seed default system_config values (ON CONFLICT DO NOTHING for idempotency)
            await conn.execute(
                text("""
                    INSERT INTO system_config (key, value)
                    VALUES
                    ('default_sprint_duration_days', '14'),
                    ('max_task_limit', '100'),
                    ('default_notification_frequency', 'instant'),
                    ('reporting_module_enabled', 'true'),
                    ('integrations_enabled', 'true'),
                    ('primary_brand_color', ''),
                    ('chart_theme', 'default')
                    ON CONFLICT (key) DO NOTHING
                """)
            )
