from typing import List, Optional

from fastapi import HTTPException, status

from app.domain.entities.comment import Comment
from app.domain.repositories.comment_repository import ICommentRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.exceptions import CommentNotFoundError
from app.application.dtos.comment_dtos import (
    CommentCreateDTO,
    CommentUpdateDTO,
    CommentResponseDTO,
    CommentAuthorDTO,
)


# Plan 14-09 D-D2: 160-char hard cap for comment body excerpt in audit metadata.
# The Comment table itself remains the source of truth; audit log only stores
# this preview to avoid PII leak when the row is rendered admin-side.
COMMENT_EXCERPT_MAX_CHARS = 160


def _build_comment_excerpt(body: Optional[str]) -> Optional[str]:
    """D-D2 PII guardrail — truncate comment body to <=160 chars + ellipsis if longer.

    Never persists the full comment body in audit_log. None / empty returns None.
    """
    if body is None:
        return None
    if len(body) > COMMENT_EXCERPT_MAX_CHARS:
        return body[:COMMENT_EXCERPT_MAX_CHARS] + "…"
    return body


async def _build_comment_audit_metadata(
    comment: Comment,
    task_repo: Optional[ITaskRepository],
) -> dict:
    """Compose the D-D2 audit metadata envelope for a comment lifecycle event."""
    task_key = None
    task_title = None
    if task_repo is not None and comment.task_id is not None:
        task = await task_repo.get_by_id(comment.task_id)
        if task is not None:
            task_key = task.task_key
            task_title = task.title
    return {
        "task_id": comment.task_id,
        "task_key": task_key,
        "task_title": task_title,
        "comment_id": comment.id,
        "comment_excerpt": _build_comment_excerpt(comment.content),
    }


def _is_admin(user) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


def _map_to_response(comment: Comment) -> CommentResponseDTO:
    """Map a Comment domain entity to CommentResponseDTO."""
    user = comment.user
    author = CommentAuthorDTO(
        id=user.id,
        full_name=user.full_name,
        avatar_path=getattr(user, "avatar", None),
    )
    is_edited = bool(
        comment.updated_at is not None
        and comment.created_at is not None
        and comment.updated_at > comment.created_at
    )
    return CommentResponseDTO(
        id=comment.id,
        task_id=comment.task_id,
        content=comment.content,
        author=author,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        is_edited=is_edited,
    )


class ListCommentsUseCase:
    def __init__(self, comment_repo: ICommentRepository):
        self.comment_repo = comment_repo

    async def execute(self, task_id: int) -> List[CommentResponseDTO]:
        comments = await self.comment_repo.get_by_task(task_id)
        return [_map_to_response(c) for c in comments]


class CreateCommentUseCase:
    def __init__(
        self,
        comment_repo: ICommentRepository,
        audit_repo: Optional[IAuditRepository] = None,
        task_repo: Optional[ITaskRepository] = None,
    ):
        self.comment_repo = comment_repo
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(self, dto: CommentCreateDTO, author_id: int) -> CommentResponseDTO:
        comment = Comment(
            task_id=dto.task_id,
            user_id=author_id,
            content=dto.content,
        )
        created = await self.comment_repo.create(comment)
        # Plan 14-09 D-D2: emit enriched audit row with PII-safe excerpt.
        # audit_repo + task_repo are optional so legacy callers (and the older
        # test suites that constructed CreateCommentUseCase with one arg) keep
        # working — the audit row simply isn't written in that path.
        if self.audit_repo is not None:
            metadata = await _build_comment_audit_metadata(created, self.task_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="comment",
                entity_id=created.id or 0,
                action="created",
                user_id=author_id,
                metadata=metadata,
                field_name="content",
            )
        return _map_to_response(created)


class UpdateCommentUseCase:
    def __init__(
        self,
        comment_repo: ICommentRepository,
        audit_repo: Optional[IAuditRepository] = None,
        task_repo: Optional[ITaskRepository] = None,
    ):
        self.comment_repo = comment_repo
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(
        self, comment_id: int, dto: CommentUpdateDTO, requester_id: int, requester=None
    ) -> CommentResponseDTO:
        comment = await self.comment_repo.get_by_id(comment_id)
        if comment is None:
            raise CommentNotFoundError(comment_id)

        # Authorization: must be author or admin
        if requester_id != comment.user_id:
            if requester is None or not _is_admin(requester):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not the author of this comment",
                )

        updated = await self.comment_repo.update(comment_id, dto.content)
        if updated is None:
            raise CommentNotFoundError(comment_id)
        if self.audit_repo is not None:
            metadata = await _build_comment_audit_metadata(updated, self.task_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="comment",
                entity_id=updated.id or comment_id,
                action="updated",
                user_id=requester_id,
                metadata=metadata,
                field_name="content",
            )
        return _map_to_response(updated)


class DeleteCommentUseCase:
    def __init__(
        self,
        comment_repo: ICommentRepository,
        audit_repo: Optional[IAuditRepository] = None,
        task_repo: Optional[ITaskRepository] = None,
    ):
        self.comment_repo = comment_repo
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(
        self, comment_id: int, requester_id: int, requester=None
    ) -> None:
        comment = await self.comment_repo.get_by_id(comment_id)
        if comment is None:
            raise CommentNotFoundError(comment_id)

        # Authorization: must be author or admin
        if requester_id != comment.user_id:
            if requester is None or not _is_admin(requester):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not the author of this comment",
                )

        await self.comment_repo.soft_delete(comment_id)
        if self.audit_repo is not None:
            metadata = await _build_comment_audit_metadata(comment, self.task_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="comment",
                entity_id=comment_id,
                action="deleted",
                user_id=requester_id,
                metadata=metadata,
                field_name="content",
            )
