"""Discrete-event simulator clock.

Two-layer time control:

1. **Python side** — time-machine freezes ``datetime.now()`` / ``utcnow()``
   so every Use Case that stamps timestamps in pure Python (the 9 audit/
   write paths) lands on simulated wall time.

2. **Postgres side** — many models use ``server_default=func.now()`` for
   ``created_at`` / ``timestamp`` columns. SQL ``NOW()`` runs server-side
   and cannot be mocked from Python. ``patcher.py`` rewrites those rows
   after each event using the current simulated clock.

The clock is driven by a single global ``Clock`` instance — the simulator
is sequential, so there's no need for per-task isolation. Use
``with clock.frozen(): ...`` inside a context where ``set(...)`` will be
called per event.
"""

from __future__ import annotations

import datetime as _dt
import random
from dataclasses import dataclass

import time_machine


@dataclass
class Clock:
    """Single mutable simulator clock.

    ``current`` is the wall time the simulator believes it is now. The
    ``_traveller`` / ``_coordinates`` pair is the active time-machine
    binding — None when ``freeze()`` has not been called yet.

    time-machine separates the *traveller* (which owns ``.start()`` and
    ``.stop()``) from the *coordinates* it hands back (which owns
    ``.move_to()``). We hold both so ``set()`` can move the clock without
    re-starting the freeze.
    """

    current: _dt.datetime
    _traveller: object | None = None
    _coordinates: object | None = None

    def set(self, dt: _dt.datetime) -> None:
        """Move clock to ``dt`` and update the active time_machine binding."""
        self.current = dt
        if self._coordinates is not None:
            self._coordinates.move_to(dt)  # type: ignore[union-attr]

    def advance(
        self,
        seconds: int = 0,
        minutes: int = 0,
        hours: int = 0,
        days: int = 0,
    ) -> _dt.datetime:
        """Add the delta to the clock and return the new wall time."""
        self.set(
            self.current
            + _dt.timedelta(
                seconds=seconds, minutes=minutes, hours=hours, days=days
            )
        )
        return self.current

    def jitter_minutes(self, low: int, high: int) -> _dt.datetime:
        """Advance by a random minute count in [low, high]. Used between events
        so adjacent audit rows don't share an identical timestamp."""
        return self.advance(minutes=random.randint(low, high))

    def freeze(self) -> None:
        """Start the time_machine travel. Caller is responsible for stopping
        it via ``stop()``."""
        if self._traveller is not None:
            return  # already frozen
        # tick=False keeps the clock fixed between explicit moves — the
        # simulator advances time deterministically via ``advance()``.
        self._traveller = time_machine.travel(self.current, tick=False)
        self._coordinates = self._traveller.start()  # type: ignore[union-attr]

    def stop(self) -> None:
        if self._traveller is not None:
            self._traveller.stop()  # type: ignore[union-attr]
            self._traveller = None
            self._coordinates = None


def make_clock(start: _dt.datetime) -> Clock:
    """Factory — returns an un-frozen Clock at ``start``."""
    return Clock(current=start)


def workday_jitter(base_date: _dt.date, rng: random.Random) -> _dt.datetime:
    """Random business-hour timestamp for ``base_date`` (09:00–18:00 local).

    The simulator uses this when picking the wall-clock start of a day's
    activity. Weekends still produce timestamps but the day-budget logic
    upstream typically reduces volume — see ``actors.py``.
    """
    minute_of_day = rng.randint(9 * 60, 18 * 60)
    return _dt.datetime.combine(
        base_date,
        _dt.time(hour=minute_of_day // 60, minute=minute_of_day % 60),
    )
