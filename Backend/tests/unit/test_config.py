"""
Unit tests for Settings config behavior — DEBUG flag and CORS origins parsing.
"""
import pytest


def test_engine_echo_is_derived_from_debug_flag():
    """database.py builds the engine with `echo=settings.DEBUG`. Assert the LIVE
    engine reflects that derivation — the old test only re-asserted the DEBUG value
    it passed into Settings (tautological), never touching the echo derivation it
    was named for. A hard-coded echo would break this whenever it diverges from DEBUG."""
    from app.infrastructure.database.database import engine
    from app.infrastructure.config import settings

    assert bool(engine.sync_engine.echo) == bool(settings.DEBUG)


def test_cors_origins_parsed_from_env():
    """Settings(CORS_ORIGINS='http://a.com,http://b.com').cors_origins_list == ['http://a.com', 'http://b.com']."""
    from app.infrastructure.config import Settings

    s = Settings(
        CORS_ORIGINS="http://a.com,http://b.com",
        JWT_SECRET="safe_jwt_secret",
        DB_PASSWORD="safe_db_password",
    )
    assert s.cors_origins_list == ["http://a.com", "http://b.com"]


def test_cors_origins_strips_whitespace():
    """'http://a.com, http://b.com' parses correctly with stripped spaces."""
    from app.infrastructure.config import Settings

    s = Settings(
        CORS_ORIGINS="http://a.com, http://b.com",
        JWT_SECRET="safe_jwt_secret",
        DB_PASSWORD="safe_db_password",
    )
    assert s.cors_origins_list == ["http://a.com", "http://b.com"]
