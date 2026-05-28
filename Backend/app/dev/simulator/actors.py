"""Actor profiles for the discrete-event simulator.

An *actor* is a project-member with a daily budget of events. We do not
simulate the entire 100-user roster — only users who are members of at
least one project produce events. Idle users (no projects) skip the loop
naturally.

Daily budgets are picked once per (role, project) pair so the same person
can produce more events on a large project they manage than on a tiny
project they only attend.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.project import ProjectModel, project_members
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel


# Role buckets used by the event-weight tables. The DB has many display
# names (Project Manager / PM / Member / Admin) — we collapse them here.
ROLE_ADMIN = "admin"
ROLE_PM = "pm"
ROLE_MEMBER = "member"


# Daily event budget per role. Sampled per actor at startup so heavy/light
# users stay consistent across the 90-day timeline (a "lazy" PM stays lazy).
_BUDGET_RANGES: Dict[str, tuple[int, int]] = {
    ROLE_ADMIN: (1, 2),
    ROLE_PM: (6, 12),
    ROLE_MEMBER: (3, 8),
}


# Action weights — role × methodology, normalised at sample time.
# Action keys map 1:1 to events.py factory function names.
_WEIGHTS_PM: Dict[str, Dict[str, int]] = {
    "SCRUM":     {"create_task": 25, "transition_task": 20, "assign_task": 15,
                  "comment_task": 15, "milestone_update": 10, "idle": 15},
    "KANBAN":    {"create_task": 25, "transition_task": 25, "assign_task": 15,
                  "comment_task": 15, "milestone_update": 10, "idle": 10},
    "WATERFALL": {"create_task": 20, "transition_task": 25, "assign_task": 15,
                  "comment_task": 15, "milestone_update": 15, "idle": 10},
    "ITERATIVE": {"create_task": 22, "transition_task": 23, "assign_task": 15,
                  "comment_task": 15, "milestone_update": 12, "idle": 13},
}
_WEIGHTS_MEMBER: Dict[str, Dict[str, int]] = {
    "SCRUM":     {"create_task": 15, "transition_task": 35, "comment_task": 30,
                  "assign_task": 5, "idle": 15},
    "KANBAN":    {"create_task": 15, "transition_task": 40, "comment_task": 25,
                  "assign_task": 5, "idle": 15},
    "WATERFALL": {"create_task": 10, "transition_task": 35, "comment_task": 30,
                  "assign_task": 5, "idle": 20},
    "ITERATIVE": {"create_task": 15, "transition_task": 35, "comment_task": 30,
                  "assign_task": 5, "idle": 15},
}
_WEIGHTS_ADMIN: Dict[str, Dict[str, int]] = {
    # Admins barely act in normal day-to-day; one stray comment per day.
    "SCRUM":     {"comment_task": 100},
    "KANBAN":    {"comment_task": 100},
    "WATERFALL": {"comment_task": 100},
    "ITERATIVE": {"comment_task": 100},
}


def _classify_role(role_name: str | None) -> str:
    if not role_name:
        return ROLE_MEMBER
    rn = role_name.strip().lower()
    if "admin" in rn:
        return ROLE_ADMIN
    if "manager" in rn or rn in ("pm", "project manager"):
        return ROLE_PM
    return ROLE_MEMBER


@dataclass
class Actor:
    user_id: int
    role: str  # admin / pm / member (normalised)
    project_ids: List[int] = field(default_factory=list)
    daily_budget: int = 0  # picked per project per day

    def weights_for(self, methodology: str) -> Dict[str, int]:
        if self.role == ROLE_PM:
            return _WEIGHTS_PM.get(methodology.upper(), _WEIGHTS_PM["SCRUM"])
        if self.role == ROLE_ADMIN:
            return _WEIGHTS_ADMIN.get(methodology.upper(), _WEIGHTS_ADMIN["SCRUM"])
        return _WEIGHTS_MEMBER.get(methodology.upper(), _WEIGHTS_MEMBER["SCRUM"])


async def build_actors(session: AsyncSession, rng: random.Random) -> List[Actor]:
    """Load users + memberships into Actor objects.

    Users with no project membership are excluded — they would never act.
    Daily budget is sampled once per actor (range driven by role).
    """
    # Pull (user_id, role_name) pairs once.
    user_q = (
        select(UserModel.id, RoleModel.name)
        .join(RoleModel, UserModel.role_id == RoleModel.id, isouter=True)
        .where(UserModel.is_active == True)  # noqa: E712
    )
    rows = (await session.execute(user_q)).all()
    role_by_uid = {uid: _classify_role(rname) for uid, rname in rows}

    # Pull memberships.
    mem_q = select(project_members.c.user_id, project_members.c.project_id)
    mem_rows = (await session.execute(mem_q)).all()
    memberships: Dict[int, List[int]] = {}
    for uid, pid in mem_rows:
        memberships.setdefault(uid, []).append(pid)

    actors: List[Actor] = []
    for uid, role in role_by_uid.items():
        pids = memberships.get(uid, [])
        if not pids:
            continue  # skip users with no projects — they'd never act
        low, high = _BUDGET_RANGES[role]
        actors.append(Actor(
            user_id=uid,
            role=role,
            project_ids=pids,
            daily_budget=rng.randint(low, high),
        ))
    return actors


def pick_event_type(actor: Actor, methodology: str, rng: random.Random) -> str:
    """Weighted choice from the actor's action table."""
    weights = actor.weights_for(methodology)
    keys = list(weights.keys())
    values = list(weights.values())
    return rng.choices(keys, weights=values, k=1)[0]
