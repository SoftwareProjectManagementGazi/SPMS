"""API-01 / D-01..D-12 Phase Gate use case.

Single atomic transaction (D-10):
  1. acquire_project_lock_or_fail -> 409 on contention
  2. Load project, normalize process_config
  3. Check workflow.mode (D-07) -> 400 for continuous
  4. Validate source/target phase IDs (D-19, D-21)
  5. Evaluate criteria (D-03, D-05) -> 422 unless allow_override
  6. Apply open_tasks_action with exceptions (D-04)
  7. Insert audit_log with full envelope (D-08)
Commit releases advisory lock automatically.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.application.services.phase_gate_service import acquire_project_lock_or_fail
from app.application.dtos.phase_transition_dtos import (
    PhaseTransitionRequestDTO, PhaseTransitionResponseDTO, CriterionResult,
)
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.phase_report_repository import IPhaseReportRepository
from app.domain.entities.phase_report import PhaseReport
from app.domain.exceptions import (
    ProjectNotFoundError,
    CriteriaUnmetError,
    PhaseGateNotApplicableError,
    ArchivedNodeReferenceError,
    InvalidTransitionError,
)


def _task_is_done(t) -> bool:
    """Language-agnostic done detection using order_index.

    A task is done when its column has the highest order_index among all
    project columns — covers 'Done' (English), 'Bitti' (Turkish), and any
    custom last-column name.  Falls back to name-based check when project
    columns are not loaded.
    """
    col = getattr(t, "column", None)
    if col is None:
        return False
    project = getattr(t, "project", None)
    proj_cols = getattr(project, "columns", None) if project else None
    if proj_cols:
        max_order = max(
            (getattr(c, "order_index", 0) for c in proj_cols), default=0
        )
        return int(getattr(col, "order_index", -1)) == max_order
    # Fallback: name-based (covers English defaults)
    return str(getattr(col, "name", "")).upper() in ("DONE", "COMPLETED", "CLOSED")


class ExecutePhaseTransitionUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        task_repo: ITaskRepository,
        audit_repo: IAuditRepository,
        session: AsyncSession,
        phase_report_repo: IPhaseReportRepository | None = None,
    ):
        self.project_repo = project_repo
        self.task_repo = task_repo
        self.audit_repo = audit_repo
        self.session = session
        self.phase_report_repo = phase_report_repo

    async def execute(
        self, project_id: int, dto: PhaseTransitionRequestDTO, user_id: int
    ) -> PhaseTransitionResponseDTO:
        # All steps inside a single atomic tx; commit releases advisory lock.
        # NOTE: caller (router) opens/closes the outer session; here we use session.begin_nested
        # only if we need a savepoint. Default behavior: rely on FastAPI Depends session lifecycle
        # (session.commit on return, rollback on exception) which satisfies D-10.

        # 1. Advisory lock (409 on contention)
        await acquire_project_lock_or_fail(self.session, project_id)

        # 2. Load project (entity normalizes process_config via @model_validator)
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        pc = project.process_config or {}
        workflow = pc.get("workflow", {})
        mode = workflow.get("mode", "flexible")

        # 3. Mode guard (D-07)
        if mode == "continuous":
            raise PhaseGateNotApplicableError(mode=mode)

        # 4. Phase ID existence + archived check (D-19, D-21)
        nodes = workflow.get("nodes", [])
        node_map = {n["id"]: n for n in nodes}
        for pid, label in ((dto.source_phase_id, "source"), (dto.target_phase_id, "target")):
            node = node_map.get(pid)
            if node is None:
                raise ArchivedNodeReferenceError(node_id=pid, reason=f"non-existent in project workflow ({label})")
            if node.get("is_archived"):
                raise ArchivedNodeReferenceError(node_id=pid, reason=f"archived ({label})")

        # 4.5. Edge existence + direction check (Phase 12 D-16, D-17)
        # Three ways a transition can be allowed:
        #   (a) direct edge: source -> target exists
        #   (b) bidirectional pair-wise reverse: target -> source edge with bidirectional=True
        #       (NOT transitive — D-16 explicitly forbids transitive closure)
        #   (c) is_all_gate=True edge with target=requested_target (D-17 Jira-style;
        #       any non-archived source allowed — source check above still enforced)
        # Edge type (flow / verification / feedback) is intentionally NOT consulted here:
        # the existence of an edge with matching source+target signals the transition
        # is structurally permitted. The mode-specific cycle/feedback rules live in
        # workflow_dtos._has_cycle (D-55 rule 3) and apply at config-validation time.
        edges = workflow.get("edges", [])
        direct_edge = next(
            (e for e in edges
             if e.get("source") == dto.source_phase_id
             and e.get("target") == dto.target_phase_id),
            None,
        )
        reverse_edge = next(
            (e for e in edges
             if e.get("source") == dto.target_phase_id
             and e.get("target") == dto.source_phase_id
             and e.get("bidirectional")),
            None,
        )
        all_gate_edge = next(
            (e for e in edges
             if e.get("is_all_gate")
             and e.get("target") == dto.target_phase_id),
            None,
        )
        if not (direct_edge or reverse_edge or all_gate_edge):
            raise InvalidTransitionError(
                source_phase_id=dto.source_phase_id,
                target_phase_id=dto.target_phase_id,
                reason="No edge connects source to target (direct, bidirectional, or is_all_gate)",
            )

        # 5. Criteria evaluation (D-03)
        criteria = pc.get("phase_completion_criteria", {}).get(dto.source_phase_id, {})
        unmet = await self._evaluate_criteria(project_id, dto.source_phase_id, criteria)
        if unmet and not dto.allow_override:
            raise CriteriaUnmetError(unmet=[c.model_dump() for c in unmet])

        override_used = bool(unmet and dto.allow_override)

        # 6. Apply open_tasks_action (D-04)
        moved_count = await self._apply_task_moves(
            project_id, dto.source_phase_id, dto.target_phase_id,
            dto.open_tasks_action, dto.exceptions,
        )

        # 7. Audit envelope (D-08)
        envelope = {
            "source_phase_id": dto.source_phase_id,
            "source_phase_name": node_map[dto.source_phase_id].get("name"),
            "target_phase_id": dto.target_phase_id,
            "target_phase_name": node_map[dto.target_phase_id].get("name"),
            "workflow_mode": mode,
            "criteria_snapshot": criteria,
            "unmet_criteria": [c.model_dump() for c in unmet],
            "override_used": override_used,
            "open_tasks_action": dto.open_tasks_action,
            "exceptions": [e.model_dump() for e in dto.exceptions],
            "moved_task_count": moved_count,
            "note": dto.note,
        }
        await self.audit_repo.create_with_metadata(
            entity_type="project",
            entity_id=project_id,
            action="phase_transition",
            user_id=user_id,
            metadata=envelope,
        )

        # Commit the main transaction (task moves + audit log) FIRST.
        # The PhaseReport snapshot below is supplementary and must never
        # roll back the already-durable audit entry.
        await self.session.commit()

        # 8. Auto-create PhaseReport snapshot in a separate transaction.
        # Non-blocking: any failure here is silently skipped so the phase
        # transition itself is always visible in the History tab.
        if self.phase_report_repo is not None:
            try:
                # Snapshot task counts.  Include tasks explicitly assigned to
                # the source phase AND tasks with phase_id=None (board backlog),
                # because the frontend board shows backlog tasks inside the
                # currently active phase.
                phase_tasks = await self.task_repo.list_by_project_and_phase(
                    project_id, dto.source_phase_id
                )
                # Null-phase tasks: call with None then filter — safe because
                # the phase_id=None path passes Pydantic validation.
                all_tasks = await self.task_repo.list_by_project_and_phase(
                    project_id, None
                )
                null_tasks = [
                    t for t in all_tasks
                    if getattr(t, "phase_id", None) is None
                ]
                snapshot_tasks = phase_tasks + null_tasks
                snapshot_total = len(snapshot_tasks)
                # Done detection: language-agnostic order_index approach
                # (same logic as _is_done in _apply_task_moves). The last
                # column by order_index is "done" regardless of column name
                # ("Done", "Bitti", "Tamamlandı", …).
                snapshot_done = sum(
                    1 for t in snapshot_tasks
                    if _task_is_done(t)
                )

                existing = await self.phase_report_repo.get_latest_by_project_phase(
                    project_id, dto.source_phase_id
                )
                next_cycle = (existing.cycle_number + 1) if existing else 1
                auto_report = PhaseReport(
                    project_id=project_id,
                    phase_id=dto.source_phase_id,
                    cycle_number=next_cycle,
                    revision=1,
                    summary_task_count=snapshot_total,
                    summary_done_count=snapshot_done,
                    summary_moved_count=moved_count,
                    summary_duration_days=0,
                    created_by=user_id,
                )
                await self.phase_report_repo.create(auto_report)
                await self.session.commit()
            except Exception:
                await self.session.rollback()

        return PhaseTransitionResponseDTO(
            moved_count=moved_count,
            override_used=override_used,
            unmet_criteria=unmet,
            source_phase_id=dto.source_phase_id,
            target_phase_id=dto.target_phase_id,
        )

    async def _evaluate_criteria(
        self, project_id: int, source_phase_id: str, criteria: dict
    ) -> List[CriterionResult]:
        """D-03 auto-criteria. Returns list of failed criteria.

        auto checks supported:
          - all_tasks_done: every task with phase_id=source must be DONE
          - no_critical_tasks: no CRITICAL priority task with phase_id=source is non-DONE
          - no_blockers: (heuristic) no dependency-graph incoming edges block completion (simplified v2.0)
        manual checks (in criteria['manual']) require user confirmation — evaluated as unmet unless allow_override.
        """
        unmet: List[CriterionResult] = []
        auto = criteria.get("auto", {}) or {}
        manual = criteria.get("manual", []) or []
        # Fetch phase tasks
        tasks = await self.task_repo.list_by_project_and_phase(project_id, source_phase_id)

        if auto.get("all_tasks_done"):
            done = sum(1 for t in tasks if str(getattr(t, "status", "")).upper() == "DONE" or
                                         (getattr(t, "column", None) and getattr(t.column, "name", "").upper() == "DONE"))
            total = len(tasks)
            if total > 0 and done < total:
                unmet.append(CriterionResult(
                    check="all_tasks_done", passed=False,
                    detail=f"{done}/{total} done",
                ))

        if auto.get("no_critical_tasks"):
            critical_open = [t for t in tasks if str(getattr(t, "priority", "")).upper() == "CRITICAL"
                             and str(getattr(t, "status", "")).upper() != "DONE"]
            if critical_open:
                unmet.append(CriterionResult(
                    check="no_critical_tasks", passed=False,
                    detail=f"{len(critical_open)} critical task(s) still open",
                ))

        if auto.get("no_blockers"):
            # Simplified v2.0: count tasks with non-null status != DONE
            blockers = [t for t in tasks if str(getattr(t, "status", "")).upper() in ("BLOCKED", "REVIEW")]
            if blockers:
                unmet.append(CriterionResult(
                    check="no_blockers", passed=False,
                    detail=f"{len(blockers)} task(s) blocked",
                ))

        # Manual items — each item an unmet criterion until user override/signoff
        for item in manual:
            unmet.append(CriterionResult(
                check=f"manual:{item}", passed=False,
                detail="Requires manual confirmation (use allow_override or complete manually)",
            ))

        return unmet

    async def _apply_task_moves(
        self, project_id: int, source_phase_id: str, target_phase_id: str,
        action: str, exceptions: list,
    ) -> int:
        """D-04: bulk action with per-task exceptions.

        Processes two sets of tasks:
        1. Tasks explicitly assigned to source_phase_id.
        2. Tasks with phase_id=None (backlog) — the board treats them as part of
           the active phase.  DONE backlog tasks are stamped with source_phase_id
           so they don't bleed into future phases.  Non-DONE backlog tasks follow
           the same open_tasks_action as phase-assigned tasks.
        """
        # Fetch phase-assigned tasks
        phase_tasks = await self.task_repo.list_by_project_and_phase(
            project_id, source_phase_id
        )
        # Fetch backlog tasks (phase_id=None) — filter in Python
        all_tasks = await self.task_repo.list_by_project_and_phase(project_id, None)
        backlog_tasks = [t for t in all_tasks if getattr(t, "phase_id", None) is None]

        exc_map = {e.task_id: e.action for e in exceptions}

        # Buckets for bulk updates (task_id lists per destination)
        to_source: List[int] = []   # stamp with source_phase_id (done backlog)
        to_target: List[int] = []   # move to target_phase_id
        to_backlog: List[int] = []  # clear phase (set to null)

        # Phase-assigned tasks
        for t in phase_tasks:
            eff_action = exc_map.get(t.id, action)
            if eff_action == "move_to_next":
                to_target.append(t.id)
            elif eff_action == "move_to_backlog":
                to_backlog.append(t.id)
            # keep_in_source: no-op — already has correct phase_id

        # Backlog tasks
        for t in backlog_tasks:
            if _task_is_done(t):
                # Stamp completed backlog tasks with the source phase so they
                # don't appear in future phases.
                to_source.append(t.id)
            else:
                eff_action = exc_map.get(t.id, action)
                if eff_action == "move_to_next":
                    to_target.append(t.id)
                elif eff_action == "keep_in_source":
                    to_source.append(t.id)
                # move_to_backlog / default: leave as null (stay in backlog)

        # Persist via bulk SQL UPDATE — no per-row ORM tracking
        if to_source:
            await self.task_repo.bulk_stamp_phase(to_source, source_phase_id)
        if to_target:
            await self.task_repo.bulk_stamp_phase(to_target, target_phase_id)
        if to_backlog:
            await self.task_repo.bulk_stamp_phase(to_backlog, None)

        moved = len(to_source) + len(to_target) + len(to_backlog)
        return moved
