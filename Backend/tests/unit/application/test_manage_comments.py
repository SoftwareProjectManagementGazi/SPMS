"""TASK-02: Comment management — real unit tests for the comment use-cases.

Replaces the previous ``xfail(strict=False) + assert False`` stubs, which the
test audit flagged as fake passes (they stayed green no matter what the
production code did). Every test here drives a real use case against an
in-memory ``ICommentRepository`` so that a regression in
``app/application/use_cases/manage_comments.py`` actually fails the test.
"""
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.application.dtos.comment_dtos import CommentCreateDTO, CommentUpdateDTO
from app.application.use_cases.manage_comments import (
    CreateCommentUseCase,
    DeleteCommentUseCase,
    ListCommentsUseCase,
    UpdateCommentUseCase,
)
from app.domain.entities.comment import Comment
from app.domain.entities.user import User
from app.domain.exceptions import CommentNotFoundError


def _make_author(user_id: int = 7, name: str = "Alice") -> User:
    return User(
        id=user_id,
        email=f"u{user_id}@example.com",
        password_hash="x",
        full_name=name,
    )


class FakeCommentRepository:
    """In-memory ``ICommentRepository`` for use-case unit tests.

    Mirrors the real SqlAlchemy repo's observable contract: assigns ids and
    timestamps on create, joinload-attaches the author ``User`` (so the use
    case's ``_map_to_response`` can build the author DTO), excludes
    soft-deleted rows from reads, and edits bump ``updated_at`` past
    ``created_at`` (so ``is_edited`` becomes True).
    """

    def __init__(self, author: User):
        self._author = author
        self._rows: dict[int, Comment] = {}
        self._next_id = 1

    def _attach(self, comment: Comment) -> Comment:
        comment.user = self._author
        return comment

    async def create(self, comment: Comment) -> Comment:
        comment.id = self._next_id
        self._next_id += 1
        ts = datetime(2026, 1, 1, 12, 0, 0)
        comment.created_at = ts
        comment.updated_at = ts
        self._rows[comment.id] = comment
        return self._attach(comment)

    async def get_by_id(self, comment_id: int):
        comment = self._rows.get(comment_id)
        if comment is None or comment.is_deleted:
            return None
        return self._attach(comment)

    async def get_by_task(self, task_id: int):
        return [
            self._attach(c)
            for c in self._rows.values()
            if c.task_id == task_id and not c.is_deleted
        ]

    async def update(self, comment_id: int, content: str):
        comment = self._rows.get(comment_id)
        if comment is None or comment.is_deleted:
            return None
        comment.content = content
        comment.updated_at = (comment.created_at or datetime(2026, 1, 1)) + timedelta(minutes=5)
        return self._attach(comment)

    async def soft_delete(self, comment_id: int) -> bool:
        comment = self._rows.get(comment_id)
        if comment is None:
            return False
        comment.is_deleted = True
        return True


@pytest.mark.asyncio
async def test_create_comment_adds_comment_to_task():
    """CreateCommentUseCase persists the comment against the given task + author."""
    author = _make_author()
    repo = FakeCommentRepository(author)

    result = await CreateCommentUseCase(repo).execute(
        CommentCreateDTO(task_id=55, content="First comment"), author_id=author.id
    )

    assert result.id is not None
    assert result.task_id == 55  # kills mutation: task_id hard-coded to 0
    assert result.content == "First comment"
    assert result.author.id == author.id
    # Round-trip: the comment is actually retrievable for that task.
    listed = await ListCommentsUseCase(repo).execute(task_id=55)
    assert [c.id for c in listed] == [result.id]


@pytest.mark.asyncio
async def test_list_comments_returns_task_comments():
    """ListCommentsUseCase returns only the comments belonging to the given task."""
    author = _make_author()
    repo = FakeCommentRepository(author)
    create = CreateCommentUseCase(repo)
    await create.execute(CommentCreateDTO(task_id=1, content="a"), author_id=author.id)
    await create.execute(CommentCreateDTO(task_id=1, content="b"), author_id=author.id)
    await create.execute(CommentCreateDTO(task_id=2, content="other-task"), author_id=author.id)

    result = await ListCommentsUseCase(repo).execute(task_id=1)

    # kills mutation: get_by_task ignoring task_id would leak "other-task".
    assert [c.content for c in result] == ["a", "b"]
    assert all(c.task_id == 1 for c in result)


@pytest.mark.asyncio
async def test_update_comment_by_author_succeeds():
    """UpdateCommentUseCase lets the author edit, persists it, flags is_edited."""
    author = _make_author(user_id=7)
    repo = FakeCommentRepository(author)
    created = await CreateCommentUseCase(repo).execute(
        CommentCreateDTO(task_id=1, content="original"), author_id=7
    )

    updated = await UpdateCommentUseCase(repo).execute(
        comment_id=created.id, dto=CommentUpdateDTO(content="edited"), requester_id=7
    )

    assert updated.content == "edited"  # kills mutation: author wrongly rejected (would 403)
    assert updated.is_edited is True
    listed = await ListCommentsUseCase(repo).execute(task_id=1)
    assert listed[0].content == "edited"  # change was persisted, not just returned


@pytest.mark.asyncio
async def test_update_comment_missing_raises_not_found():
    """Updating a non-existent comment raises CommentNotFoundError (not a silent pass)."""
    repo = FakeCommentRepository(_make_author())
    with pytest.raises(CommentNotFoundError):
        await UpdateCommentUseCase(repo).execute(
            comment_id=999, dto=CommentUpdateDTO(content="x"), requester_id=7
        )


@pytest.mark.asyncio
async def test_delete_comment_by_non_author_raises_forbidden():
    """DeleteCommentUseCase blocks a non-author (and non-admin) with HTTP 403."""
    author = _make_author(user_id=7)
    repo = FakeCommentRepository(author)
    created = await CreateCommentUseCase(repo).execute(
        CommentCreateDTO(task_id=1, content="mine"), author_id=7
    )

    # requester 99 is neither author nor admin (requester=None -> not admin).
    with pytest.raises(HTTPException) as exc:
        await DeleteCommentUseCase(repo).execute(
            comment_id=created.id, requester_id=99, requester=None
        )
    assert exc.value.status_code == 403  # kills mutation: dropping the 403 guard

    # The authorization block must have prevented the delete entirely.
    listed = await ListCommentsUseCase(repo).execute(task_id=1)
    assert [c.id for c in listed] == [created.id]


@pytest.mark.asyncio
async def test_deleted_comment_not_returned_in_list():
    """A soft-deleted comment is excluded from ListCommentsUseCase results."""
    author = _make_author(user_id=7)
    repo = FakeCommentRepository(author)
    keep = await CreateCommentUseCase(repo).execute(
        CommentCreateDTO(task_id=1, content="keep"), author_id=7
    )
    remove = await CreateCommentUseCase(repo).execute(
        CommentCreateDTO(task_id=1, content="remove"), author_id=7
    )

    await DeleteCommentUseCase(repo).execute(comment_id=remove.id, requester_id=7)

    listed = await ListCommentsUseCase(repo).execute(task_id=1)
    # kills mutation: soft_delete that doesn't set is_deleted would keep "remove".
    assert [c.id for c in listed] == [keep.id]
