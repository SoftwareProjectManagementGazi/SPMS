"""Direct-ORM event factories used by the discrete-event run loop.

Why direct-ORM (not Use Case dispatch): the Use Case layer assumes a
FastAPI Depends() container is in scope and a real HTTP user. Wiring that
inside an offline simulator would mean reconstructing the whole DI graph
per event — strictly more code for no behavioural win.

What we keep: every model insert/update still goes through SQLAlchemy
ORM, the patcher hooks pick up created_at / updated_at / timestamp
columns, and each event emits the same audit_log row shape the read-side
rapor endpoints expect (see audit_repo.py:get_cfd_snapshots — depends on
field_name IN ('column_id', 'status') with new_value = column name).
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dev.simulator.actors import Actor
from app.dev.simulator.clock import Clock
from app.dev.simulator.transitions import (
    find_path_for_columns,
    initial_column,
    is_terminal,
    next_step,
)
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.comment import CommentModel
from app.infrastructure.database.models.notification import (
    NotificationModel,
    NotificationType,
)
from app.infrastructure.database.models.project import (
    ProjectModel,
    project_members,
)
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.task import TaskModel, TaskPriority


# Lightweight content templates so generated titles / comments don't all
# read alike. Kept short — full domain-specific generation lives in the
# legacy seeder; the simulator's job is volume + timestamp realism.
_TASK_TITLE_FRAGMENTS = [
    "API endpoint", "veri modeli", "UI komponenti", "rapor sayfası",
    "performans iyileştirmesi", "bug fix", "entegrasyon", "test suite",
    "doküman güncellemesi", "güvenlik denetimi", "telemetri", "ölçüm",
    "log toplama", "cache stratejisi", "kuyruk işlemcisi",
]
_TASK_ACTIONS = [
    "geliştir", "düzelt", "iyileştir", "refaktör et", "belgele",
    "test et", "yeniden tasarla", "optimize et",
]
_COMMENT_LINES = [
    "İyi gidiyor, yarın PR açacağım.",
    "Burada bir blocker var, yardım gerek.",
    "Tasarım gözden geçirme tamamlandı.",
    "Code review notlarını uyguladım.",
    "Performans testi sonuçları beklediğimiz aralıkta.",
    "Production'a hazır, deploy edebiliriz.",
    "Lütfen şu bağımlılığa tekrar bakar mısın.",
    "Sprint sonuna kadar tamamlanacak.",
]


# ---------------------------------------------------------------------------
# Context object passed to every event
# ---------------------------------------------------------------------------


@dataclass
class ProjectCtx:
    """Snapshot of a project's mutable state — refreshed before each event
    so we don't run a query inside every factory."""
    project_id: int
    project_key: str  # used to build task_key like "SPMS-42"
    methodology: str  # SCRUM / KANBAN / WATERFALL / ITERATIVE
    columns_by_name: dict[str, BoardColumnModel]  # name -> column row
    path: List[str]  # canonical ordered names (subset of columns)
    member_ids: List[int]
    active_sprint_id: Optional[int]


async def load_project_ctx(session: AsyncSession, project: ProjectModel) -> ProjectCtx:
    """Build a ProjectCtx from a freshly loaded ProjectModel.

    Caller is responsible for loading project with eager columns / members
    when they want to avoid this method's queries. Bundled here so the run
    loop can keep its body short.
    """
    cols_res = await session.execute(
        select(BoardColumnModel).where(BoardColumnModel.project_id == project.id)
    )
    cols = cols_res.scalars().all()
    cols_by_name = {c.name: c for c in cols}
    path = find_path_for_columns(
        project.methodology.value if hasattr(project.methodology, "value")
        else str(project.methodology),
        [c.name for c in cols],
    )

    mem_res = await session.execute(
        select(project_members.c.user_id).where(project_members.c.project_id == project.id)
    )
    member_ids = [r[0] for r in mem_res.fetchall()]

    sprint_res = await session.execute(
        select(SprintModel.id)
        .where(SprintModel.project_id == project.id)
        .where(SprintModel.is_active == True)  # noqa: E712
        .limit(1)
    )
    active_sprint = sprint_res.scalar_one_or_none()

    return ProjectCtx(
        project_id=project.id,
        project_key=project.key,
        methodology=(project.methodology.value if hasattr(project.methodology, "value")
                     else str(project.methodology)),
        columns_by_name=cols_by_name,
        path=path,
        member_ids=member_ids,
        active_sprint_id=active_sprint,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_task_title(rng: random.Random) -> str:
    return f"{rng.choice(_TASK_ACTIONS).title()}: {rng.choice(_TASK_TITLE_FRAGMENTS)}"


def _make_comment(rng: random.Random) -> str:
    return rng.choice(_COMMENT_LINES)


async def _next_task_seq(session: AsyncSession, project_id: int) -> int:
    """Increment projects.task_seq and return the new value (matches the
    semantics CreateTaskUseCase uses for the {KEY}-N task suffix)."""
    res = await session.execute(
        select(ProjectModel).where(ProjectModel.id == project_id)
    )
    project = res.scalar_one()
    project.task_seq = (project.task_seq or 0) + 1
    await session.flush()
    return project.task_seq


def _write_audit(
    session: AsyncSession,
    entity_type: str,
    entity_id: int,
    user_id: int,
    action: str,
    *,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> None:
    """Compact audit_log writer used by every event."""
    session.add(AuditLogModel(
        entity_type=entity_type,
        entity_id=entity_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        user_id=user_id,
        action=action,
        extra_metadata=metadata or {},
    ))


# ---------------------------------------------------------------------------
# Event factories
# ---------------------------------------------------------------------------


async def create_task(
    session: AsyncSession,
    actor: Actor,
    ctx: ProjectCtx,
    clock: Clock,
    rng: random.Random,
) -> Optional[TaskModel]:
    """Add a fresh task in the leftmost column with the actor as reporter.

    Emits audit_log with action='created' + extra_metadata.task_title +
    project_name so the global activity feed can render it.
    """
    initial = initial_column(ctx.path)
    if not initial or initial not in ctx.columns_by_name:
        return None
    column = ctx.columns_by_name[initial]

    if not ctx.member_ids:
        return None
    assignee_id = rng.choice(ctx.member_ids)

    seq = await _next_task_seq(session, ctx.project_id)
    title = _make_task_title(rng)

    # Due date: ~30% overdue (set in the past), 50% near-term, 20% further out.
    due_offset = rng.choices(
        [rng.randint(-25, -1), rng.randint(1, 21), rng.randint(22, 75)],
        weights=[30, 50, 20], k=1,
    )[0]
    from datetime import timedelta
    due_date = clock.current + timedelta(days=due_offset)

    task = TaskModel(
        project_id=ctx.project_id,
        column_id=column.id,
        sprint_id=ctx.active_sprint_id if ctx.methodology == "SCRUM" else None,
        title=title,
        description=f"Otomatik üretilen görev — {title}",
        reporter_id=actor.user_id,
        assignee_id=assignee_id,
        priority=rng.choice(list(TaskPriority)),
        points=rng.choice([1, 2, 3, 5, 8, 13]),
        due_date=due_date,
        task_key=f"{ctx.project_key}-{seq}",
    )
    session.add(task)
    await session.flush()

    _write_audit(
        session,
        entity_type="task",
        entity_id=task.id,
        user_id=actor.user_id,
        action="created",
        field_name="status",
        old_value=None,
        new_value=column.name,
        metadata={
            "task_title": title,
            "project_id": ctx.project_id,
            "task_key": f"{seq}",
        },
    )

    if assignee_id and assignee_id != actor.user_id:
        session.add(NotificationModel(
            user_id=assignee_id,
            type=NotificationType.TASK_ASSIGNED,
            message=f"Yeni görev atandı: {title}",
            related_entity_id=task.id,
            is_read=False,
        ))

    return task


async def _pick_task(
    session: AsyncSession,
    ctx: ProjectCtx,
    clock: Clock,
    *,
    require_non_terminal: bool = True,
    min_dwell_hours: int = 0,
) -> Optional[TaskModel]:
    """Pick a random task in the project subject to dwell + terminal filters."""
    from datetime import timedelta
    cutoff = clock.current - timedelta(hours=min_dwell_hours)
    res = await session.execute(
        select(TaskModel)
        .where(TaskModel.project_id == ctx.project_id)
        .where(TaskModel.updated_at <= cutoff)
        .order_by(func.random())
        .limit(1)
    )
    task = res.scalar_one_or_none()
    if task is None:
        return None
    if require_non_terminal:
        # Resolve current column name
        col = next(
            (c for c in ctx.columns_by_name.values() if c.id == task.column_id),
            None,
        )
        if col is None or is_terminal(col.name, ctx.path):
            return None
    return task


async def transition_task(
    session: AsyncSession,
    actor: Actor,
    ctx: ProjectCtx,
    clock: Clock,
    rng: random.Random,
) -> Optional[TaskModel]:
    """Move a non-terminal task along its column path (or invoke an edge case)."""
    task = await _pick_task(
        session, ctx, clock,
        require_non_terminal=True,
        min_dwell_hours=rng.randint(4, 24),
    )
    if task is None:
        return None

    cur_col = next(
        (c for c in ctx.columns_by_name.values() if c.id == task.column_id),
        None,
    )
    if cur_col is None:
        return None
    target_name = next_step(cur_col.name, ctx.path, rng)
    if not target_name or target_name not in ctx.columns_by_name:
        return None
    target_col = ctx.columns_by_name[target_name]
    task.column_id = target_col.id

    _write_audit(
        session,
        entity_type="task",
        entity_id=task.id,
        user_id=actor.user_id,
        action="updated",
        field_name="column_id",
        old_value=cur_col.name,
        new_value=target_col.name,
        metadata={
            "task_title": task.title,
            "project_id": ctx.project_id,
            "phase_transition": True,
        },
    )
    return task


async def assign_task(
    session: AsyncSession,
    actor: Actor,
    ctx: ProjectCtx,
    clock: Clock,
    rng: random.Random,
) -> Optional[TaskModel]:
    """Change the assignee of an existing task."""
    task = await _pick_task(
        session, ctx, clock,
        require_non_terminal=True,
        min_dwell_hours=rng.randint(2, 12),
    )
    if task is None or not ctx.member_ids:
        return None
    new_assignee = rng.choice(ctx.member_ids)
    if new_assignee == task.assignee_id:
        return None
    old_assignee = task.assignee_id
    task.assignee_id = new_assignee

    _write_audit(
        session,
        entity_type="task",
        entity_id=task.id,
        user_id=actor.user_id,
        action="updated",
        field_name="assignee_id",
        old_value=str(old_assignee) if old_assignee else None,
        new_value=str(new_assignee),
        metadata={"task_title": task.title, "project_id": ctx.project_id},
    )

    session.add(NotificationModel(
        user_id=new_assignee,
        type=NotificationType.TASK_ASSIGNED,
        message=f"Görev sana atandı: {task.title}",
        related_entity_id=task.id,
        is_read=False,
    ))
    return task


async def comment_task(
    session: AsyncSession,
    actor: Actor,
    ctx: ProjectCtx,
    clock: Clock,
    rng: random.Random,
) -> Optional[CommentModel]:
    """Append a comment to a random task in the project."""
    task = await _pick_task(
        session, ctx, clock,
        require_non_terminal=False,
        min_dwell_hours=rng.randint(0, 6),
    )
    if task is None:
        return None
    text = _make_comment(rng)
    comment = CommentModel(
        task_id=task.id,
        user_id=actor.user_id,
        content=text,
    )
    session.add(comment)
    await session.flush()

    _write_audit(
        session,
        entity_type="comment",
        entity_id=comment.id,
        user_id=actor.user_id,
        action="created",
        # audit_log.field_name is NOT NULL — comments use the sentinel
        # "content" so the activity feed knows this row is a fresh comment.
        field_name="content",
        new_value=text[:60],
        metadata={
            "task_id": task.id,
            "task_title": task.title,
            "project_id": ctx.project_id,
            "comment_excerpt": text[:60],
        },
    )
    return comment


# Used by run.py — single dispatch dict keeps the loop simple.
EVENT_DISPATCH = {
    "create_task": create_task,
    "transition_task": transition_task,
    "assign_task": assign_task,
    "comment_task": comment_task,
}


async def execute_event(
    event_name: str,
    session: AsyncSession,
    actor: Actor,
    ctx: ProjectCtx,
    clock: Clock,
    rng: random.Random,
) -> bool:
    """Dispatch + safety net. Returns True iff something was inserted."""
    if event_name == "idle":
        return False
    fn = EVENT_DISPATCH.get(event_name)
    if fn is None:
        return False
    result = await fn(session, actor, ctx, clock, rng)
    return result is not None
