"""Phase 13 D-X2 — Lead/Cycle Time use case.

Single Responsibility (CLAUDE.md §4.1 S): map repository result dict into
``LeadCycleResponseDTO`` with paired lead/cycle stats and 5-bucket histograms.

DIP: only domain repository imported.
"""
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.chart_dtos import (
    LeadCycleResponseDTO,
    LeadCycleStatsDTO,
    LeadCycleBucketDTO,
)


_VALID_RANGES = (7, 30, 90)

# Bucket labels MUST match Frontend2/lib/charts/buckets.ts LEAD_CYCLE_BUCKETS
# (RESEARCH.md §Code Examples line 875). Same labels used for both lead + cycle.
_BUCKET_LABELS = ("0-1d", "1-3d", "3-5d", "5-10d", "10d+")


def _coerce_float(value, default: float = 0.0) -> float:
    """Pull a numeric value out of the repo dict, tolerating ``None``."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_int(value, default: int = 0) -> int:
    """Pull an integer bucket count, tolerating ``None`` (no rows)."""
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _build_stats(data: dict, prefix: str) -> LeadCycleStatsDTO:
    """Build a ``LeadCycleStatsDTO`` from the flat repo dict.

    ``prefix`` is either ``lead`` or ``cycle`` — the repo flattens both
    directions into a single row so we can issue one SQL query.
    """
    buckets = [
        LeadCycleBucketDTO(
            range=label,
            count=_coerce_int(data.get(f"{prefix}_b{idx}")),
        )
        for idx, label in enumerate(_BUCKET_LABELS, start=1)
    ]

    return LeadCycleStatsDTO(
        avg_days=round(_coerce_float(data.get(f"{prefix}_avg")), 2),
        p50=round(_coerce_float(data.get(f"{prefix}_p50")), 2),
        p85=round(_coerce_float(data.get(f"{prefix}_p85")), 2),
        p95=round(_coerce_float(data.get(f"{prefix}_p95")), 2),
        buckets=buckets,
    )


class GetProjectLeadCycleUseCase:
    """D-X2 Lead/Cycle use case — paired stats + 5-bucket histograms."""

    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(self, project_id: int, range_days: int) -> LeadCycleResponseDTO:
        """Return ``LeadCycleResponseDTO`` for the requested project + range.

        Range gate: only 7/30/90. Raises ``ValueError`` (router → 422 INVALID_RANGE).
        """
        if range_days not in _VALID_RANGES:
            raise ValueError(
                f"range_days must be one of {sorted(_VALID_RANGES)}, got {range_days}"
            )

        data = await self.audit_repo.get_lead_cycle_data(
            project_id=project_id, range_days=range_days,
        )

        return LeadCycleResponseDTO(
            lead=_build_stats(data, "lead"),
            cycle=_build_stats(data, "cycle"),
        )
