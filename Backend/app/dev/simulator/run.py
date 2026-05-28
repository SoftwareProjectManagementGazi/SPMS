"""Main entry point for the discrete-event simulator.

Usage (from Backend/ dir):

    python -m app.dev.simulator.run --days 90 --seed 42

Behaviour:
  1. Connect to the configured database via the regular async session.
  2. Truncate + reseed baseline (no tasks). See ``bootstrap.py``.
  3. Install the SQL timestamp patcher + time-machine freeze.
  4. Walk forward day-by-day, picking actors and event types, calling the
     event factories. The clock advances by jittery minutes between events
     and resets at the start of each business day (09:00 local).
  5. Commit periodically so a crash mid-run leaves a partial-but-valid DB.
  6. Print summary stats — caller wraps with pg_dump in a shell script.

Determinism: a single ``random.Random(seed)`` is threaded into every helper
that picks something. Running twice with the same seed against the same
baseline produces identical audit timelines.
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as _dt
import logging
import random
import sys

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dev.simulator import actors as actor_mod
from app.dev.simulator import bootstrap as bootstrap_mod
from app.dev.simulator import clock as clock_mod
from app.dev.simulator import events as events_mod
from app.dev.simulator import patcher as patcher_mod
from app.infrastructure.database.database import AsyncSessionLocal
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.project import ProjectModel
from app.infrastructure.database.models.task import TaskModel


logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("simulator")


# Commit cadence — flush every N events. Lower = safer on crash, higher =
# faster. 200 hits a reasonable trade-off (~few seconds of work).
_COMMIT_EVERY = 200


async def _load_projects(session: AsyncSession) -> list[ProjectModel]:
    res = await session.execute(
        select(ProjectModel)
        .where(ProjectModel.is_deleted == False)  # noqa: E712
        .where(ProjectModel.status != "ARCHIVED")
    )
    return list(res.scalars().all())


async def _refresh_project_ctxs(
    session: AsyncSession,
    projects: list[ProjectModel],
) -> dict[int, events_mod.ProjectCtx]:
    """Build a ProjectCtx per project once at the top of each day. Cheaper
    than building inside every event."""
    ctxs: dict[int, events_mod.ProjectCtx] = {}
    for p in projects:
        ctxs[p.id] = await events_mod.load_project_ctx(session, p)
    return ctxs


def _per_day_activity_scale(day_index: int, total_days: int) -> float:
    """Ramp-up curve: simulated org adoption grows over time.

    Week-1 traffic is ~40% of week-13's traffic. The curve eases off so the
    last 30 days plateau at full volume — that's what the rapor screens
    will look like in production.
    """
    # 0.4 → 1.0 across the timeline, linear with a soft cap.
    ratio = day_index / max(total_days - 1, 1)
    return 0.4 + 0.6 * min(ratio, 1.0)


async def _run_one_day(
    session: AsyncSession,
    day: _dt.date,
    day_index: int,
    total_days: int,
    actors: list[actor_mod.Actor],
    projects: list[ProjectModel],
    ctxs: dict[int, events_mod.ProjectCtx],
    clock: clock_mod.Clock,
    rng: random.Random,
    events_counter: list[int],  # mutable single-element list — running total
) -> None:
    """Run all actors' activity for a single business day."""
    weekday = day.weekday()  # 0=Mon..6=Sun
    weekend = weekday >= 5
    scale = _per_day_activity_scale(day_index, total_days)
    if weekend:
        scale *= 0.15  # weekend traffic — a few stragglers

    # Set clock to 09:00 of this day.
    clock.set(_dt.datetime.combine(day, _dt.time(9, 0)))

    # Iterate actors in shuffled order so the day's events don't always
    # bunch by user.
    shuffled = list(actors)
    rng.shuffle(shuffled)

    for actor in shuffled:
        if not actor.project_ids:
            continue
        # Sample budget from actor's daily range scaled by adoption + weekend.
        budget = max(0, int(round(actor.daily_budget * scale)))
        for _ in range(budget):
            project_id = rng.choice(actor.project_ids)
            ctx = ctxs.get(project_id)
            if ctx is None:
                continue
            event_type = actor_mod.pick_event_type(actor, ctx.methodology, rng)
            try:
                produced = await events_mod.execute_event(
                    event_type, session, actor, ctx, clock, rng,
                )
            except Exception as exc:
                # Single-event failure shouldn't abort the day. Log + skip.
                logger.warning(
                    f"event {event_type} failed for actor {actor.user_id} on {day}: {exc}"
                )
                continue
            if produced:
                events_counter[0] += 1
                if events_counter[0] % _COMMIT_EVERY == 0:
                    await session.commit()
            # Advance clock 5-25 minutes between events.
            clock.jitter_minutes(5, 25)


async def run_simulation(days: int, seed: int) -> None:
    """Top-level orchestrator."""
    logger.info(f"SIMULATOR: starting — days={days} seed={seed}")

    rng = random.Random(seed)
    # Compute the start day so the timeline ends today (so rapor windows
    # 7/30/90 land sensibly).
    today = _dt.date.today()
    start_day = today - _dt.timedelta(days=days - 1)
    logger.info(f"SIMULATOR: timeline {start_day} → {today} ({days} days)")

    async with AsyncSessionLocal() as session:
        # Phase 1: bootstrap baseline (TRUNCATE + reseed without tasks).
        await bootstrap_mod.bootstrap_baseline(session)

        # Phase 2: prepare actors + project ctxs.
        actors = await actor_mod.build_actors(session, rng)
        logger.info(f"SIMULATOR: {len(actors)} actors in scope")
        projects = await _load_projects(session)
        logger.info(f"SIMULATOR: {len(projects)} active projects")

        # Phase 3: install clock + patcher hooks. Both stay live for the
        # entire timeline — uninstall happens in finally.
        clock = clock_mod.make_clock(_dt.datetime.combine(start_day, _dt.time(9, 0)))
        patcher_mod.install(clock)
        clock.freeze()

        events_counter = [0]
        try:
            # Rebuild ctxs daily so new columns / sprints (none right now,
            # but cheap insurance) get picked up.
            for day_idx in range(days):
                day = start_day + _dt.timedelta(days=day_idx)
                # Refresh ctxs on a coarser cadence — every 7 days is plenty
                # since the simulator doesn't add columns or sprints. This
                # halves the simulator's per-day query budget.
                if day_idx % 7 == 0:
                    ctxs = await _refresh_project_ctxs(session, projects)
                await _run_one_day(
                    session, day, day_idx, days, actors, projects, ctxs,
                    clock, rng, events_counter,
                )
                if day_idx % 10 == 0:
                    logger.info(
                        f"SIMULATOR: day {day_idx + 1}/{days} "
                        f"({day}) — events so far {events_counter[0]}"
                    )
            # Final commit for any tail events under the commit cadence.
            await session.commit()
        finally:
            clock.stop()
            patcher_mod.uninstall()

        # Phase 4: report.
        task_count = await session.scalar(select(func.count()).select_from(TaskModel))
        audit_count = await session.scalar(select(func.count()).select_from(AuditLogModel))
        logger.info(
            f"SIMULATOR: DONE — events emitted={events_counter[0]}, "
            f"tasks={task_count}, audit_log rows={audit_count}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="SPMS discrete-event simulator")
    parser.add_argument("--days", type=int, default=90, help="Days to simulate (default 90)")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed (default 42)")
    args = parser.parse_args()

    try:
        asyncio.run(run_simulation(days=args.days, seed=args.seed))
    except KeyboardInterrupt:
        sys.exit(130)


if __name__ == "__main__":
    main()
