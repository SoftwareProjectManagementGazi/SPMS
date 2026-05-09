from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, func
from sqlalchemy.exc import IntegrityError

from app.domain.entities.team import Team
from app.domain.repositories.team_repository import ITeamRepository
from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel


class SqlAlchemyTeamRepository(ITeamRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TeamModel) -> Team:
        return Team.model_validate(model)

    def _get_base_query(self):
        """Return base select for non-deleted teams."""
        return (
            select(TeamModel)
            .where(TeamModel.is_deleted == False)  # noqa: E712
        )

    async def create(
        self,
        name: str,
        description: Optional[str],
        owner_id: int,
        color: str = "#3b82f6",
        department: Optional[str] = None,
        leader_id: Optional[int] = None,
    ) -> Team:
        model = TeamModel(
            name=name,
            description=description,
            owner_id=owner_id,
            color=color,
            department=department,
            leader_id=leader_id,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        # Re-fetch to ensure all columns populated
        stmt = self._get_base_query().where(TeamModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)

    async def get_by_id(self, team_id: int) -> Optional[Team]:
        stmt = self._get_base_query().where(TeamModel.id == team_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(self, user_id: int) -> List[Team]:
        """Return teams where the user is owner OR a member."""
        # Teams where user is owner
        owner_stmt = self._get_base_query().where(TeamModel.owner_id == user_id)

        # Teams where user is a member (via team_members table)
        member_stmt = (
            self._get_base_query()
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .where(TeamMemberModel.user_id == user_id)
        )

        owner_result = await self.session.execute(owner_stmt)
        member_result = await self.session.execute(member_stmt)

        owner_teams = {m.id: m for m in owner_result.scalars().all()}
        member_teams = {m.id: m for m in member_result.scalars().all()}

        # Merge and deduplicate
        all_teams = {**member_teams, **owner_teams}
        return [self._to_entity(m) for m in all_teams.values()]

    async def add_member(self, team_id: int, user_id: int) -> None:
        """Add a user to team. Idempotent — silently ignores duplicate membership."""
        member = TeamMemberModel(team_id=team_id, user_id=user_id)
        self.session.add(member)
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            # Duplicate membership — rollback and ignore
            await self.session.rollback()

    async def remove_member(self, team_id: int, user_id: int) -> None:
        stmt = delete(TeamMemberModel).where(
            TeamMemberModel.team_id == team_id,
            TeamMemberModel.user_id == user_id,
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_members(self, team_id: int) -> List[int]:
        """Return list of user_ids who are members of the team."""
        stmt = select(TeamMemberModel.user_id).where(TeamMemberModel.team_id == team_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def soft_delete(self, team_id: int) -> None:
        stmt = self._get_base_query().where(TeamModel.id == team_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()
            await self.session.commit()

    async def user_leads_any_team_on_project(self, user_id: int, project_id: int) -> bool:
        """D-16 / D-14: EXISTS(Teams t JOIN TeamProjects tp ON t.id=tp.team_id
        WHERE t.leader_id = :user_id AND tp.project_id = :project_id AND t.is_deleted = FALSE)."""
        from app.infrastructure.database.models.team import TeamProjectModel
        stmt = (
            select(TeamModel.id)
            .join(TeamProjectModel, TeamProjectModel.team_id == TeamModel.id)
            .where(
                TeamModel.leader_id == user_id,
                TeamProjectModel.project_id == project_id,
                TeamModel.is_deleted == False,  # noqa: E712
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.first() is not None

    async def get_teams_led_by(self, user_id: int) -> list:
        """D-16 / D-17: all teams where leader_id = user_id."""
        from app.domain.entities.team import Team
        stmt = (
            select(TeamModel)
            .where(TeamModel.leader_id == user_id, TeamModel.is_deleted == False)  # noqa: E712
        )
        result = await self.session.execute(stmt)
        return [Team.model_validate(m) for m in result.scalars().all()]

    async def update(self, team) -> "Team":
        """Persist name, description, leader_id, color, department changes from a Team entity."""
        stmt = self._get_base_query().where(TeamModel.id == team.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"Team {team.id} not found")
        model.name = team.name
        if hasattr(team, "description"):
            model.description = team.description
        model.leader_id = team.leader_id
        if hasattr(team, "color") and team.color is not None:
            model.color = team.color
        if hasattr(team, "department"):
            model.department = team.department
        await self.session.flush()
        await self.session.commit()
        # Re-fetch
        stmt2 = self._get_base_query().where(TeamModel.id == team.id)
        result2 = await self.session.execute(stmt2)
        refreshed = result2.scalar_one()
        return self._to_entity(refreshed)

    # ---------------------------------------------------------------
    # Yeni metodlar — Teams sayfası stats / projects / activity
    # ---------------------------------------------------------------

    async def get_stats_for_user(self, user_id: int) -> dict:
        """Sayfa üstü stats strip için toplu sayım:
        toplam takım, toplam üye, aktif görev, tamamlanma oranı."""
        from app.infrastructure.database.models.team import TeamProjectModel
        from app.infrastructure.database.models.task import TaskModel
        from app.infrastructure.database.models.board_column import BoardColumnModel
        from app.infrastructure.database.repositories.project_repo import DONE_COLUMN_NAMES

        teams = await self.list_by_user(user_id)
        team_ids = [t.id for t in teams]
        if not team_ids:
            return {
                "total_teams": 0,
                "total_members": 0,
                "active_tasks": 0,
                "completion_rate": 0.0,
            }

        # Toplam üye (DISTINCT user_id) + owner sayısı
        member_stmt = select(func.count(func.distinct(TeamMemberModel.user_id))).where(
            TeamMemberModel.team_id.in_(team_ids)
        )
        member_count = (await self.session.execute(member_stmt)).scalar() or 0
        owner_count = len({t.owner_id for t in teams})
        total_members = member_count + owner_count

        # Bu takımlara atanmış proje id'leri
        proj_stmt = select(TeamProjectModel.project_id).where(
            TeamProjectModel.team_id.in_(team_ids)
        )
        project_ids = list({
            pid for pid in (await self.session.execute(proj_stmt)).scalars().all()
        })

        active_tasks = 0
        completion_rate = 0.0
        if project_ids:
            # "Aktif" = column adı DONE_COLUMN_NAMES içinde olmayan görevler
            done_stmt = (
                select(func.count(TaskModel.id))
                .join(BoardColumnModel, TaskModel.column_id == BoardColumnModel.id, isouter=True)
                .where(
                    TaskModel.project_id.in_(project_ids),
                    func.lower(BoardColumnModel.name).in_(DONE_COLUMN_NAMES),
                )
            )
            total_stmt = select(func.count(TaskModel.id)).where(
                TaskModel.project_id.in_(project_ids)
            )
            done_tasks = (await self.session.execute(done_stmt)).scalar() or 0
            total_tasks = (await self.session.execute(total_stmt)).scalar() or 0
            active_tasks = total_tasks - done_tasks
            if total_tasks > 0:
                completion_rate = done_tasks / total_tasks

        return {
            "total_teams": len(teams),
            "total_members": total_members,
            "active_tasks": active_tasks,
            "completion_rate": round(completion_rate, 4),
        }

    async def get_projects(self, team_id: int) -> list:
        """Detay sayfası → Projeler sekmesi: takıma bağlı projeler ve ilerleme."""
        from app.infrastructure.database.models.team import TeamProjectModel
        from app.infrastructure.database.models.project import ProjectModel
        from app.infrastructure.database.models.task import TaskModel
        from app.infrastructure.database.models.board_column import BoardColumnModel
        from sqlalchemy import case
        from app.infrastructure.database.repositories.project_repo import DONE_COLUMN_NAMES

        stmt = (
            select(ProjectModel)
            .join(TeamProjectModel, TeamProjectModel.project_id == ProjectModel.id)
            .where(TeamProjectModel.team_id == team_id)
        )
        projects = (await self.session.execute(stmt)).scalars().all()

        out = []
        for p in projects:
            total_q = select(func.count(TaskModel.id)).where(TaskModel.project_id == p.id)
            done_q = (
                select(func.count(TaskModel.id))
                .join(BoardColumnModel, TaskModel.column_id == BoardColumnModel.id, isouter=True)
                .where(
                    TaskModel.project_id == p.id,
                    func.lower(BoardColumnModel.name).in_(DONE_COLUMN_NAMES),
                )
            )
            total = (await self.session.execute(total_q)).scalar() or 0
            done = (await self.session.execute(done_q)).scalar() or 0
            progress = (done / total) if total > 0 else 0.0
            out.append({
                "id": p.id,
                "name": p.name,
                "description": getattr(p, "description", None),
                "status": getattr(p, "status", None),
                "progress": round(progress, 4),
                "member_count": 0,
                "task_count": total,
                "done_count": done,
            })
        return out

    async def assign_project(self, team_id: int, project_id: int) -> None:
        """team_projects tablosuna satır ekle. Idempotent — duplicate'i yoksay."""
        row = TeamProjectModel(team_id=team_id, project_id=project_id)
        self.session.add(row)
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()

    async def unassign_project(self, team_id: int, project_id: int) -> None:
        """team_projects tablosundan satırı sil."""
        stmt = delete(TeamProjectModel).where(
            TeamProjectModel.team_id == team_id,
            TeamProjectModel.project_id == project_id,
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_member_stats(self, team_id: int) -> list:
        """Takım üyelerinin takıma bağlı projelerdeki toplam ve tamamlanan görev sayıları.

        Returns list of {user_id, full_name, total_count, done_count} sorted by total_count DESC.
        """
        from app.infrastructure.database.models.task import TaskModel
        from app.infrastructure.database.models.board_column import BoardColumnModel
        from app.infrastructure.database.models.user import UserModel
        from app.infrastructure.database.repositories.project_repo import DONE_COLUMN_NAMES

        # 1. Bu takıma bağlı proje id'leri
        proj_stmt = select(TeamProjectModel.project_id).where(
            TeamProjectModel.team_id == team_id
        )
        proj_ids = list((await self.session.execute(proj_stmt)).scalars().all())
        if not proj_ids:
            return []

        # 2. Üye başına toplam görev sayısı
        total_stmt = (
            select(
                TaskModel.assignee_id,
                UserModel.full_name,
                func.count(TaskModel.id).label("total_count"),
            )
            .join(UserModel, UserModel.id == TaskModel.assignee_id)
            .where(
                TaskModel.project_id.in_(proj_ids),
                TaskModel.is_deleted == False,  # noqa: E712
                TaskModel.assignee_id.is_not(None),
            )
            .group_by(TaskModel.assignee_id, UserModel.full_name)
        )
        total_rows = (await self.session.execute(total_stmt)).all()
        total_map = {row[0]: (row[1], row[2]) for row in total_rows}

        if not total_map:
            return []

        # 3. Üye başına tamamlanan görev sayısı
        done_stmt = (
            select(
                TaskModel.assignee_id,
                func.count(TaskModel.id).label("done_count"),
            )
            .join(BoardColumnModel, BoardColumnModel.id == TaskModel.column_id, isouter=True)
            .where(
                TaskModel.project_id.in_(proj_ids),
                TaskModel.is_deleted == False,  # noqa: E712
                TaskModel.assignee_id.in_(list(total_map.keys())),
                func.lower(BoardColumnModel.name).in_(DONE_COLUMN_NAMES),
            )
            .group_by(TaskModel.assignee_id)
        )
        done_rows = (await self.session.execute(done_stmt)).all()
        done_map = {row[0]: row[1] for row in done_rows}

        # 4. Birleştir, toplam göreve göre sırala
        result = []
        for user_id, (full_name, total_count) in total_map.items():
            result.append({
                "user_id": user_id,
                "full_name": full_name,
                "total_count": total_count,
                "done_count": done_map.get(user_id, 0),
            })
        result.sort(key=lambda x: x["total_count"], reverse=True)
        return result

    async def get_activity(self, team_id: int, limit: int = 50) -> list:
        """Detay sayfası → Aktivite sekmesi: takıma bağlı projelerdeki görev aktiviteleri.

        Takıma atanmış projelerin görevlerindeki audit log olaylarını döndürür.
        Takım üyelerinin proje içindeki aktivitelerini göstermek için task event'leri kullanılır.
        """
        from app.infrastructure.database.models.audit_log import AuditLogModel
        from app.infrastructure.database.models.user import UserModel
        from app.infrastructure.database.models.task import TaskModel

        # 1. Bu takıma bağlı proje id'lerini bul
        proj_stmt = select(TeamProjectModel.project_id).where(
            TeamProjectModel.team_id == team_id
        )
        proj_ids = list((await self.session.execute(proj_stmt)).scalars().all())

        if not proj_ids:
            return []

        # 2. O projelerdeki görev id'lerini subquery olarak kullan
        task_ids_subq = select(TaskModel.id).where(TaskModel.project_id.in_(proj_ids))

        # 3. Audit log'tan görev olaylarını çek
        stmt = (
            select(AuditLogModel, UserModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .where(
                AuditLogModel.entity_type == "task",
                AuditLogModel.entity_id.in_(task_ids_subq),
            )
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()

        def _action_label(action: str, field_name: str | None, metadata: dict | None) -> str:
            """Human-readable action label for the activity feed."""
            md = metadata or {}
            if action == "created":
                title = md.get("task_title") or md.get("new_value") or ""
                return f"görev oluşturdu: {title}" if title else "görev oluşturdu"
            if action == "updated":
                if field_name == "column_id":
                    old = md.get("old_value_label", "")
                    new = md.get("new_value_label", "")
                    if old and new:
                        return f"görevi taşıdı: {old} → {new}"
                    return "görevi taşıdı"
                if field_name == "assignee_id":
                    return "görevi atadı"
                return f"güncelledi: {field_name or 'alan'}"
            if action == "deleted":
                return "görevi sildi"
            return action

        return [
            {
                "id": log.id,
                "actor_id": log.user_id,
                "actor_name": (user.full_name if user else None),
                "action": _action_label(
                    log.action,
                    log.field_name,
                    log.extra_metadata if isinstance(log.extra_metadata, dict) else None,
                ),
                "target_type": log.entity_type,
                "target_id": log.entity_id,
                "target_label": (
                    (log.extra_metadata or {}).get("task_title")
                    or (log.extra_metadata or {}).get("task_key")
                ),
                "created_at": log.timestamp,
            }
            for log, user in rows
        ]