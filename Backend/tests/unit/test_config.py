"""
Unit tests for Settings config behavior — DEBUG flag and CORS origins parsing.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-02 (config hardening).
"""
import pytest


@pytest.mark.xfail(reason="pending implementation in 01-02 — config hardening not yet applied")
def test_debug_false_sets_echo_false():
    """Settings(DEBUG=False) results in SQLAlchemy engine echo=False."""
    # Stub: will verify that engine created with DEBUG=False has echo=False
    raise NotImplementedError("DEBUG/echo config linkage not yet implemented")


@pytest.mark.xfail(reason="pending implementation in 01-02 — CORS origins parsing not yet implemented")
def test_cors_origins_parsed_from_env():
    """Settings(CORS_ORIGINS='http://a.com,http://b.com').cors_origins_list == ['http://a.com', 'http://b.com']."""
    # Stub: will verify comma-separated env var is parsed into a list
    raise NotImplementedError("CORS_ORIGINS parsing not yet implemented")


@pytest.mark.xfail(reason="pending implementation in 01-02 — CORS origins whitespace stripping not yet implemented")
def test_cors_origins_strips_whitespace():
    """'http://a.com, http://b.com' parses correctly with stripped spaces."""
    # Stub: will verify that leading/trailing whitespace is stripped from each origin
    raise NotImplementedError("CORS_ORIGINS whitespace stripping not yet implemented")
