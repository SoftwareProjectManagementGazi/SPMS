"""Phase 15 RBAC-01 unit tests for Permission entity (Plan 15-04)."""
import pytest
from pydantic import ValidationError

from app.domain.entities.permission import Permission


class TestPermissionEntity:
    def test_minimal_construction_with_required_fields(self):
        perm = Permission(key="task.create", scope="project")
        assert perm.key == "task.create"
        assert perm.scope == "project"
        assert perm.id is None
        assert perm.label_tr is None
        assert perm.label_en is None

    def test_construction_with_all_fields(self):
        perm = Permission(
            id=1,
            key="admin.users.invite",
            label_tr="Kullanıcı davet et",
            label_en="Invite user",
            scope="system",
        )
        assert perm.id == 1
        assert perm.scope == "system"
        assert perm.label_tr == "Kullanıcı davet et"

    def test_invalid_scope_rejected(self):
        with pytest.raises(ValidationError):
            Permission(key="task.create", scope="workspace")

    def test_missing_required_key_rejected(self):
        with pytest.raises(ValidationError):
            Permission(scope="project")

    def test_orm_model_validate(self):
        class FakeOrm:
            id = 5
            key = "comment.create"
            label_tr = "Yorum ekle"
            label_en = "Add comment"
            scope = "project"

        perm = Permission.model_validate(FakeOrm())
        assert perm.id == 5
        assert perm.scope == "project"
