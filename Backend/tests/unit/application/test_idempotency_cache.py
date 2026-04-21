"""D-50 idempotency cache unit tests."""
from datetime import datetime, timedelta
import pytest
from app.application.services import idempotency_cache


def setup_function():
    idempotency_cache.reset_for_tests()


def test_rate_limit_allows_first_request():
    assert idempotency_cache.check_rate_limit(1, 1) is None


def test_rate_limit_blocks_within_window():
    idempotency_cache.record_request(1, 1)
    remaining = idempotency_cache.check_rate_limit(1, 1)
    assert remaining is not None and 0 < remaining <= idempotency_cache.RATE_LIMIT_SECONDS


def test_rate_limit_allows_after_window(monkeypatch):
    idempotency_cache.record_request(1, 1)
    # Advance internal clock
    past = datetime.utcnow() - timedelta(seconds=11)
    idempotency_cache._last_request[(1, 1)] = past
    assert idempotency_cache.check_rate_limit(1, 1) is None


def test_lookup_returns_stored_value():
    idempotency_cache.store(1, 1, "key", {"ok": True})
    assert idempotency_cache.lookup(1, 1, "key") == {"ok": True}


def test_lookup_expires_after_ttl():
    idempotency_cache.store(1, 1, "key", {"ok": True})
    idempotency_cache._cache[(1, 1, "key")].stored_at = datetime.utcnow() - timedelta(minutes=11)
    assert idempotency_cache.lookup(1, 1, "key") is None


def test_cache_keyed_by_user():
    idempotency_cache.store(1, 1, "same", "u1")
    idempotency_cache.store(2, 1, "same", "u2")
    assert idempotency_cache.lookup(1, 1, "same") == "u1"
    assert idempotency_cache.lookup(2, 1, "same") == "u2"
