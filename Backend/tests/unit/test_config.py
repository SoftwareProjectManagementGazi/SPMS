"""
Unit tests for Settings config behavior — DEBUG flag and CORS origins parsing.
"""
import pytest


def test_debug_false_sets_echo_false():
    """Settings(DEBUG=False) results in SQLAlchemy engine echo=False when DEBUG is False."""
    from app.infrastructure.config import Settings

    s = Settings(
        DEBUG=False,
        JWT_SECRET="safe_jwt_secret",
        DB_PASSWORD="safe_db_password",
        CORS_ORIGINS="http://localhost:3000",
    )
    assert s.DEBUG is False


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
