"""Team entity factory."""
from typing import Any, Optional
from app.domain.entities.team import Team

_counter = {"value": 0}


def make_team(
    name: Optional[str] = None,
    owner_id: int = 1,
    leader_id: Optional[int] = None,
    id: Optional[int] = None,
    **extra: Any,
) -> Team:
    _counter["value"] += 1
    n = _counter["value"]
    # leader_id only supported after plan 09-04 extends Team entity — pass via extra for now
    kwargs: dict = dict(
        id=id,
        name=name or f"Team {n}",
        owner_id=owner_id,
        **extra,
    )
    if leader_id is not None:
        kwargs["leader_id"] = leader_id
    return Team(**kwargs)
