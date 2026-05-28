"""SQLAlchemy session hook that anchors created_at / updated_at / timestamp
columns to the simulator's frozen clock.

Why this exists
---------------
19 SQLAlchemy models declare ``server_default=func.now()`` for at least one
timestamp column. Postgres ``NOW()`` runs server-side, so time-machine's
Python-side freeze cannot reach it — every server-defaulted row would land
at real wall time and the 90-day audit timeline would collapse to "now".

Strategy: install a ``Session.before_flush`` listener that walks
``session.new`` / ``session.dirty`` and sets those columns explicitly to
``clock.current``. SQLAlchemy then emits an INSERT/UPDATE that carries the
explicit value and the server default is skipped.

Why ``before_flush`` and not Mapper events: SQLAlchemy 2.x rejects raw
``event.listen(Mapper, ...)`` because Mapper is no longer the canonical
target — Session-level flush events catch every persistence path and avoid
the registry-shape issue.

The hook is installed once before the simulation loop and removed in a
``finally`` so the pytest suite (which shares the process during dev) is
not polluted afterwards.
"""

from __future__ import annotations

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.dev.simulator.clock import Clock


# Columns we anchor to simulated time.  ``timestamp`` covers audit_log;
# ``created_at`` / ``updated_at`` cover everything else with the standard
# ``TimestampedMixin`` shape.
_TIMESTAMP_FIELDS = ("created_at", "updated_at", "timestamp")


_handlers: list[tuple[str, object]] = []  # [(event_name, fn)] — for uninstall


def install(clock: Clock) -> None:
    """Wire the Session.before_flush listener that rewrites timestamps.

    Idempotent — calling install() twice is a no-op on the second pass.
    """
    if _handlers:
        return

    def _before_flush(session, flush_context, instances):
        now = clock.current
        # session.new: pending INSERTs. Fill timestamps the server default
        # would otherwise populate at NOW().
        for obj in session.new:
            for field in _TIMESTAMP_FIELDS:
                if not hasattr(obj, field):
                    continue
                if getattr(obj, field) is None:
                    setattr(obj, field, now)
        # session.dirty: pending UPDATEs. Only updated_at is moved — the
        # other fields are one-shot at insert.
        for obj in session.dirty:
            if hasattr(obj, "updated_at"):
                setattr(obj, "updated_at", now)

    # Session-level event — fires for both sync and async sessions because
    # AsyncSession delegates flush to its underlying sync Session.
    event.listen(Session, "before_flush", _before_flush)
    _handlers.append(("before_flush", _before_flush))


def uninstall() -> None:
    """Remove the listener. Safe to call when none are installed."""
    for ev, fn in list(_handlers):
        try:
            event.remove(Session, ev, fn)
        except Exception:
            # Defensive: SQLAlchemy raises InvalidRequestError when the
            # listener was never registered with the given target.
            pass
    _handlers.clear()
