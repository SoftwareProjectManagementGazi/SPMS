from typing import List

from fastapi import HTTPException, status

from app.domain.entities.comment import Comment
from app.domain.repositories.comment_repository import ICommentRepository
from app.domain.exceptions import CommentNotFoundError
from app.application.dtos.comment_dtos import (
    CommentCreateDTO,
    CommentUpdateDTO,
    CommentResponseDTO,
    CommentAuthorDTO,
)


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
    def __init__(self, comment_repo: ICommentRepository):
        self.comment_repo = comment_repo

    async def execute(self, dto: CommentCreateDTO, author_id: int) -> CommentResponseDTO:
        comment = Comment(
            task_id=dto.task_id,
            user_id=author_id,
            content=dto.content,
        )
        created = await self.comment_repo.create(comment)
        return _map_to_response(created)


class UpdateCommentUseCase:
    def __init__(self, comment_repo: ICommentRepository):
        self.comment_repo = comment_repo

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
        return _map_to_response(updated)


class DeleteCommentUseCase:
    def __init__(self, comment_repo: ICommentRepository):
        self.comment_repo = comment_repo

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
