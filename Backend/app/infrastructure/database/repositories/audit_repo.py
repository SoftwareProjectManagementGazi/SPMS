from typing import Optional, List, Tuple
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc, text, or_, and_

from app.domain.repositories.audit_repository import IAuditRepository
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.team import TeamProjectModel, TeamMemberModel


class SqlAlchemyAuditRepository(IAuditRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        old_value: Optional[str],
        new_value: Optional[str],
        user_id: Optional[int],
        action: str,
    ) -> None:
        entry = AuditLogModel(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            user_id=user_id,
            action=action,
        )
        self.session.add(entry)
        await self.session.commit()

    async def get_by_entity(self, entity_type: str, entity_id: int) -> list[dict]:
        stmt = (
            select(AuditLogModel)
            .where(
                AuditLogModel.entity_type == entity_type,
                AuditLogModel.entity_id == entity_id,
            )
            .order_by(AuditLogModel.timestamp.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "field_name": row.field_name,
                "old_value": row.old_value,
                "new_value": row.new_value,
                "user_id": row.user_id,
                "action": row.action,
                "timestamp": row.timestamp,
            }
            for row in rows
        ]

    async def count_phase_transitions(self, project_id: int, source_phase_id: str) -> int:
        """D-25: count phase transitions for a project+source_phase, used for cycle_number auto-calc."""
        stmt = (
            select(sqlfunc.count(AuditLogModel.id))
            .where(AuditLogModel.entity_type == "project")
            .where(AuditLogModel.entity_id == project_id)
            .where(AuditLogModel.action == "phase_transition")
            # D-08: extra_metadata JSONB carries the source_phase_id
            .where(AuditLogModel.extra_metadata["source_phase_id"].astext == source_phase_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ):
        """D-08: insert audit_log row with full JSON envelope in extra_metadata column.

        Note: DB column is literally `metadata`; Python attr is `extra_metadata` (Pitfall 7).
        """
        log = AuditLogModel(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            extra_metadata=metadata,
        )
        self.session.add(log)
        await self.session.flush()
        return log

    async def get_project_activity(
        self,
        project_id: int,
        types: Optional[List[str]] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """D-46 / D-47: return (items, total).

        Each item is a denormalized dict with user_name + user_avatar from users table JOIN.
        entity_label is derived from entity_type + related entity lookups (best-effort; None allowed).

        D-13-01: BROADENED — entity_type='task' rows for project tasks now
        included via subquery (RESEARCH §Pitfall 2). Without this UNION the
        Activity tab would only surface phase_transition events even though
        the project has hundreds of task updates per day.
        """
        from app.infrastructure.database.models.user import UserModel

        # Phase 13 broadening: project rows OR task rows whose task belongs to the project.
        project_task_ids = select(TaskModel.id).where(TaskModel.project_id == project_id)
        scope_filter = or_(
            and_(
                AuditLogModel.entity_type == "project",
                AuditLogModel.entity_id == project_id,
            ),
            and_(
                AuditLogModel.entity_type == "task",
                AuditLogModel.entity_id.in_(project_task_ids),
            ),
        )
        conditions = [scope_filter]

        if types:
            conditions.append(AuditLogModel.action.in_(types))
        if user_id is not None:
            conditions.append(AuditLogModel.user_id == user_id)
        if date_from is not None:
            conditions.append(AuditLogModel.timestamp >= date_from)
        if date_to is not None:
            conditions.append(AuditLogModel.timestamp <= date_to)

        # Total count
        count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        # Items with LEFT JOIN on users for denormalization (D-47)
        items_stmt = (
            select(
                AuditLogModel.id,
                AuditLogModel.action,
                AuditLogModel.entity_type,
                AuditLogModel.entity_id,
                AuditLogModel.field_name,
                AuditLogModel.old_value,
                AuditLogModel.new_value,
                AuditLogModel.user_id,
                UserModel.full_name.label("user_name"),
                UserModel.avatar.label("user_avatar"),
                AuditLogModel.timestamp,
                AuditLogModel.extra_metadata,
            )
            .select_from(AuditLogModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .where(*conditions)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.mappings().all()
        items = [
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "entity_label": None,  # Future: resolve from entity_type (task title, milestone name, etc.)
                "field_name": row["field_name"],
                "old_value": row["old_value"],
                "new_value": row["new_value"],
                "user_id": row["user_id"],
                "user_name": row["user_name"],
                "user_avatar": row["user_avatar"],
                "timestamp": row["timestamp"],
                "metadata": row["extra_metadata"],
            }
            for row in rows
        ]
        return items, total

    async def get_global_activity(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """D-28: global activity feed across all projects/entities (no project_id filter).

        Returns (items, total) with user_name + user_avatar via LEFT JOIN on users.
        """
        from app.infrastructure.database.models.user import UserModel

        # No WHERE conditions — queries ALL audit_log rows across all entities
        count_stmt = select(sqlfunc.count(AuditLogModel.id))
        total = (await self.session.execute(count_stmt)).scalar() or 0

        items_stmt = (
            select(
                AuditLogModel.id,
                AuditLogModel.action,
                AuditLogModel.entity_type,
                AuditLogModel.entity_id,
                AuditLogModel.field_name,
                AuditLogModel.old_value,
                AuditLogModel.new_value,
                AuditLogModel.user_id,
                UserModel.full_name.label("user_name"),
                UserModel.avatar.label("user_avatar"),
                AuditLogModel.timestamp,
                AuditLogModel.extra_metadata,
            )
            .select_from(AuditLogModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.mappings().all()
        items = [
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "entity_label": None,
                "field_name": row["field_name"],
                "old_value": row["old_value"],
                "new_value": row["new_value"],
                "user_id": row["user_id"],
                "user_name": row["user_name"],
                "user_avatar": row["user_avatar"],
                "timestamp": row["timestamp"],
                "metadata": row["extra_metadata"],
            }
            for row in rows
        ]
        return items, total

    async def get_recent_by_user(self, user_id: int, limit: int = 5) -> List[dict]:
        """D-48: recent activity for a user (any entity)."""
        stmt = (
            select(AuditLogModel)
            .where(AuditLogModel.user_id == user_id)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "timestamp": r.timestamp,
                "metadata": r.extra_metadata,
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Phase 13 chart aggregation + user activity privacy filter (D-X1..X4)
    # ------------------------------------------------------------------

    async def get_cfd_snapshots(
        self, project_id: int, date_from: date, date_to: date,
    ) -> List[dict]:
        """D-X1 CFD daily snapshot via running window function.

        Strategy: for each day in [date_from, date_to], compute the count of
        tasks that were in each of (todo, progress, review, done) at the end
        of that day. Status is determined by the most recent column_id audit
        row with timestamp <= day-end (window query inside CROSS JOIN).

        Bucket mapping uses ILIKE patterns on the column name — fragile but
        unavoidable until board_columns gains a canonical bucket column
        (RESEARCH §Code Examples line 811 [ASSUMED]; v2.1 candidate). Tasks
        with no matching status row are counted in `todo` so the daily totals
        sum to the project's task count.
        """
        sql = text("""
        WITH days AS (
          SELECT generate_series(:date_from::date, :date_to::date, '1 day'::interval)::date AS day
        ),
        project_tasks AS (
          SELECT id FROM tasks WHERE project_id = :project_id
        ),
        task_status_per_day AS (
          SELECT
            d.day,
            t.id AS task_id,
            (
              SELECT bc.name
              FROM audit_log al
              JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
              WHERE al.entity_type = 'task'
                AND al.entity_id = t.id
                AND al.field_name = 'column_id'
                AND al.timestamp <= (d.day + INTERVAL '1 day - 1 second')
              ORDER BY al.timestamp DESC
              LIMIT 1
            ) AS status_name
          FROM days d
          CROSS JOIN project_tasks t
        )
        SELECT
          day::text AS date,
          SUM(CASE WHEN status_name ILIKE '%todo%' OR status_name ILIKE '%backlog%' OR status_name IS NULL THEN 1 ELSE 0 END) AS todo,
          SUM(CASE WHEN status_name ILIKE '%progress%' OR status_name ILIKE '%doing%' THEN 1 ELSE 0 END) AS progress,
          SUM(CASE WHEN status_name ILIKE '%review%' OR status_name ILIKE '%qa%' THEN 1 ELSE 0 END) AS review,
          SUM(CASE WHEN status_name ILIKE '%done%' OR status_name ILIKE '%complete%' THEN 1 ELSE 0 END) AS done
        FROM task_status_per_day
        GROUP BY day
        ORDER BY day
        """)
        result = await self.session.execute(sql, {
            "date_from": date_from,
            "date_to": date_to,
            "project_id": project_id,
        })
        return [
            {
                "date": row._mapping["date"],
                "todo": int(row._mapping["todo"] or 0),
                "progress": int(row._mapping["progress"] or 0),
                "review": int(row._mapping["review"] or 0),
                "done": int(row._mapping["done"] or 0),
            }
            for row in result.all()
        ]

    async def get_lead_cycle_data(
        self, project_id: int, range_days: int,
    ) -> dict:
        """D-X2 Lead + Cycle time per task, bucketed + percentiled.

        lead_time  = MIN(done.timestamp) - task.created_at
        cycle_time = MIN(done.timestamp) - MIN(in_progress.timestamp WHERE in_progress < first_done)

        Pitfall 8: tasks with no in_progress event are included in lead but
        EXCLUDED from cycle (NULL cycle_days). Done → in_progress → done
        corrections use FIRST done; subsequent toggles are ignored.
        """
        sql = text("""
        WITH task_times AS (
          SELECT
            t.id,
            t.created_at,
            (SELECT MIN(al.timestamp)
             FROM audit_log al
             JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
             WHERE al.entity_id = t.id AND al.entity_type = 'task'
               AND al.field_name = 'column_id' AND bc.name ILIKE '%done%'
            ) AS first_done,
            (SELECT MIN(al.timestamp)
             FROM audit_log al
             JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
             WHERE al.entity_id = t.id AND al.entity_type = 'task'
               AND al.field_name = 'column_id' AND bc.name ILIKE '%progress%'
            ) AS first_in_progress
          FROM tasks t
          WHERE t.project_id = :project_id
            AND t.created_at >= NOW() - (:range_days || ' days')::INTERVAL
        ),
        durations AS (
          SELECT
            EXTRACT(EPOCH FROM (first_done - created_at)) / 86400.0 AS lead_days,
            CASE
              WHEN first_in_progress IS NOT NULL AND first_in_progress < first_done
              THEN EXTRACT(EPOCH FROM (first_done - first_in_progress)) / 86400.0
              ELSE NULL
            END AS cycle_days
          FROM task_times
          WHERE first_done IS NOT NULL
        )
        SELECT
          AVG(lead_days)  AS lead_avg,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY lead_days) AS lead_p50,
          percentile_cont(0.85) WITHIN GROUP (ORDER BY lead_days) AS lead_p85,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY lead_days) AS lead_p95,
          AVG(cycle_days) AS cycle_avg,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p50,
          percentile_cont(0.85) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p85,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p95,
          SUM(CASE WHEN lead_days < 1 THEN 1 ELSE 0 END) AS lead_b1,
          SUM(CASE WHEN lead_days >= 1 AND lead_days < 3 THEN 1 ELSE 0 END) AS lead_b2,
          SUM(CASE WHEN lead_days >= 3 AND lead_days < 5 THEN 1 ELSE 0 END) AS lead_b3,
          SUM(CASE WHEN lead_days >= 5 AND lead_days < 10 THEN 1 ELSE 0 END) AS lead_b4,
          SUM(CASE WHEN lead_days >= 10 THEN 1 ELSE 0 END) AS lead_b5,
          SUM(CASE WHEN cycle_days < 1 THEN 1 ELSE 0 END) AS cycle_b1,
          SUM(CASE WHEN cycle_days >= 1 AND cycle_days < 3 THEN 1 ELSE 0 END) AS cycle_b2,
          SUM(CASE WHEN cycle_days >= 3 AND cycle_days < 5 THEN 1 ELSE 0 END) AS cycle_b3,
          SUM(CASE WHEN cycle_days >= 5 AND cycle_days < 10 THEN 1 ELSE 0 END) AS cycle_b4,
          SUM(CASE WHEN cycle_days >= 10 THEN 1 ELSE 0 END) AS cycle_b5
        FROM durations
        """)
        result = await self.session.execute(sql, {
            "project_id": project_id,
            "range_days": range_days,
        })
        row = result.mappings().first()
        if row is None:
            # Empty / no rows — return zeroed dict so use case maps cleanly.
            return {
                "lead_avg": 0.0, "lead_p50": 0.0, "lead_p85": 0.0, "lead_p95": 0.0,
                "cycle_avg": 0.0, "cycle_p50": 0.0, "cycle_p85": 0.0, "cycle_p95": 0.0,
                "lead_b1": 0, "lead_b2": 0, "lead_b3": 0, "lead_b4": 0, "lead_b5": 0,
                "cycle_b1": 0, "cycle_b2": 0, "cycle_b3": 0, "cycle_b4": 0, "cycle_b5": 0,
            }
        return dict(row)

    async def get_iteration_data(
        self, project_id: int, count: int,
    ) -> List[dict]:
        """D-X3 Last N sprints, per-sprint planned/completed/carried.

        planned   = tasks assigned to the sprint at or before its start_date.
        completed = tasks in the sprint with a Done column at sprint end.
        carried   = tasks in the sprint NOT in a Done column.

        Sprints are ordered by end_date ASC for chart x-axis chronology.
        """
        sql = text("""
        WITH last_sprints AS (
          SELECT id, name, start_date, end_date
          FROM sprints
          WHERE project_id = :project_id AND end_date IS NOT NULL
          ORDER BY end_date DESC
          LIMIT :count
        )
        SELECT
          ls.id, ls.name,
          (SELECT COUNT(*) FROM tasks t
           WHERE t.sprint_id = ls.id
             AND t.created_at <= (ls.start_date + INTERVAL '1 day')) AS planned,
          (SELECT COUNT(*) FROM tasks t
           JOIN board_columns bc ON bc.id = t.column_id
           WHERE t.sprint_id = ls.id
             AND bc.name ILIKE '%done%'
             AND t.updated_at <= (ls.end_date + INTERVAL '1 day')) AS completed,
          (SELECT COUNT(*) FROM tasks t
           JOIN board_columns bc ON bc.id = t.column_id
           WHERE t.sprint_id = ls.id
             AND NOT (bc.name ILIKE '%done%')) AS carried
        FROM last_sprints ls
        ORDER BY ls.end_date ASC
        """)
        result = await self.session.execute(sql, {
            "project_id": project_id,
            "count": count,
        })
        return [
            {
                "id": int(row._mapping["id"]),
                "name": row._mapping["name"],
                "planned": int(row._mapping["planned"] or 0),
                "completed": int(row._mapping["completed"] or 0),
                "carried": int(row._mapping["carried"] or 0),
            }
            for row in result.all()
        ]

    async def get_user_activity(
        self,
        target_user_id: int,
        viewer_user_id: int,
        is_admin: bool,
        types: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """D-X4 User activity feed, viewer-privacy-filtered (admin bypass).

        Non-admin viewer: only audit rows scoped to projects the viewer is a
        member of via team_projects → team_members. Admin viewer: bypass.

        Page size hard-capped at 200 (Phase 9 D-44 / T-13-01-04 DoS mitigation).
        """
        from app.infrastructure.database.models.user import UserModel

        base_conditions = [AuditLogModel.user_id == target_user_id]
        if types:
            base_conditions.append(AuditLogModel.action.in_(types))
        if date_from is not None:
            base_conditions.append(AuditLogModel.timestamp >= date_from)
        if date_to is not None:
            base_conditions.append(AuditLogModel.timestamp <= date_to)

        if not is_admin:
            # Viewer's project memberships via team_projects → team_members.
            viewer_project_ids = (
                select(TeamProjectModel.project_id)
                .join(
                    TeamMemberModel,
                    TeamMemberModel.team_id == TeamProjectModel.team_id,
                )
                .where(TeamMemberModel.user_id == viewer_user_id)
            )
            scope_filter = or_(
                and_(
                    AuditLogModel.entity_type == "project",
                    AuditLogModel.entity_id.in_(viewer_project_ids),
                ),
                and_(
                    AuditLogModel.entity_type == "task",
                    AuditLogModel.entity_id.in_(
                        select(TaskModel.id).where(
                            TaskModel.project_id.in_(viewer_project_ids),
                        )
                    ),
                ),
            )
            base_conditions.append(scope_filter)

        capped_limit = min(limit, 200)

        count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*base_conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        items_stmt = (
            select(
                AuditLogModel.id,
                AuditLogModel.action,
                AuditLogModel.entity_type,
                AuditLogModel.entity_id,
                AuditLogModel.field_name,
                AuditLogModel.old_value,
                AuditLogModel.new_value,
                AuditLogModel.user_id,
                UserModel.full_name.label("user_name"),
                UserModel.avatar.label("user_avatar"),
                AuditLogModel.timestamp,
                AuditLogModel.extra_metadata,
            )
            .select_from(AuditLogModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .where(*base_conditions)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(capped_limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.mappings().all()
        items = [
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "entity_label": None,
                "field_name": row["field_name"],
                "old_value": row["old_value"],
                "new_value": row["new_value"],
                "user_id": row["user_id"],
                "user_name": row["user_name"],
                "user_avatar": row["user_avatar"],
                "timestamp": row["timestamp"],
                "metadata": row["extra_metadata"],
            }
            for row in rows
        ]
        return items, total
