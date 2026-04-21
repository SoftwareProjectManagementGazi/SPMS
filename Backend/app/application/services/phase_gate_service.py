"""API-01 / D-02, D-10: pg_try_advisory_xact_lock helper.

Non-blocking lock acquisition — returns False immediately if held (D-01 semantics).
Releases automatically at transaction commit/rollback (xact_lock).
"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.exceptions import PhaseGateLockedError


def _lock_key(project_id: int) -> int:
    """Mask to 63 bits per Pitfall 3: Postgres bigint is signed int64."""
    return hash(f"phase_gate:{project_id}") & 0x7FFFFFFFFFFFFFFF


async def acquire_project_lock_or_fail(session: AsyncSession, project_id: int) -> None:
    """Acquire per-project advisory lock within current transaction.

    Raises PhaseGateLockedError if another tx holds the lock. Lock auto-releases at tx end.
    """
    key = _lock_key(project_id)
    result = await session.execute(select(func.pg_try_advisory_xact_lock(key)))
    acquired = result.scalar_one()
    if not acquired:
        raise PhaseGateLockedError(project_id=project_id)
