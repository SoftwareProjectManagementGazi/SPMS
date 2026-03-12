"""Phase 2 schema: teams, team_members, team_projects, password_reset_tokens.

This file provides an idempotent async upgrade function that can be called
directly (e.g., from a management script or lifespan hook) without running
the full Alembic CLI. For Alembic-managed environments use the corresponding
file in alembic/versions/002_phase2_schema.py instead.

Covers:
- AUTH-02: teams, team_members, team_projects tables
- AUTH-03: password_reset_tokens table
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


async def upgrade(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        # teams table
        if not await _table_exists(conn, "teams"):
            await conn.execute(
                text("""
                    CREATE TABLE teams (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        owner_id INTEGER NOT NULL REFERENCES users(id),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        version INTEGER NOT NULL DEFAULT 1,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                        deleted_at TIMESTAMP WITH TIME ZONE
                    )
                """)
            )

        # team_members join table
        if not await _table_exists(conn, "team_members"):
            await conn.execute(
                text("""
                    CREATE TABLE team_members (
                        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (team_id, user_id)
                    )
                """)
            )

        # team_projects join table
        if not await _table_exists(conn, "team_projects"):
            await conn.execute(
                text("""
                    CREATE TABLE team_projects (
                        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
                        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (team_id, project_id)
                    )
                """)
            )

        # password_reset_tokens table
        if not await _table_exists(conn, "password_reset_tokens"):
            await conn.execute(
                text("""
                    CREATE TABLE password_reset_tokens (
                        id SERIAL PRIMARY KEY,
                        token_hash VARCHAR(64) NOT NULL UNIQUE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        used_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            )
            await conn.execute(
                text(
                    "CREATE INDEX ix_password_reset_tokens_token_hash "
                    "ON password_reset_tokens(token_hash)"
                )
            )
            await conn.execute(
                text(
                    "CREATE INDEX ix_password_reset_tokens_user_id "
                    "ON password_reset_tokens(user_id)"
                )
            )
