"""Phase 11 D-51 — labels endpoints integration tests.

RED phase scaffolding: verifies the Clean Architecture slice (entity, repo
interface, exception, use cases, SQLAlchemy impl) plus the HTTP surface
(GET /projects/{id}/labels, POST /labels with 201/409/422).
"""
import pytest
import pytest_asyncio
from sqlalchemy import text
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Domain + Application — pure unit-style tests (no DB, no HTTP)
# ---------------------------------------------------------------------------


def test_label_entity_accepts_usage_count():
    """Label entity must expose a usage_count field defaulting to 0."""
    from app.domain.entities.label import Label

    label = Label(id=1, project_id=5, name="Bug", color="#ff0000")
    assert label.usage_count == 0

    label2 = Label(id=2, project_id=5, name="Feature", color="#00ff00", usage_count=7)
    assert label2.usage_count == 7


def test_label_entity_model_validate_from_orm_like_object():
    """Label supports ConfigDict(from_attributes=True) — required for repo mapping."""
    from app.domain.entities.label import Label

    class _FakeModel:
        id = 3
        project_id = 9
        name = "Urgent"
        color = "#cc0000"

    label = Label.model_validate(_FakeModel(), from_attributes=True)
    assert label.id == 3 and label.project_id == 9
    assert label.name == "Urgent" and label.color == "#cc0000"
    assert label.usage_count == 0


def test_label_repository_is_abc_with_three_methods():
    """ILabelRepository must be an ABC with exactly three abstract methods."""
    from app.domain.repositories.label_repository import ILabelRepository

    assert ILabelRepository.__abstractmethods__ == {
        "list_by_project",
        "get_by_name_in_project",
        "create",
    }


def test_label_name_already_exists_error_carries_context():
    """LabelNameAlreadyExistsError exposes project_id and name attributes."""
    from app.domain.exceptions import LabelNameAlreadyExistsError, DomainError

    exc = LabelNameAlreadyExistsError(project_id=5, name="Bug")
    assert isinstance(exc, DomainError)
    assert exc.project_id == 5
    assert exc.name == "Bug"
    assert "Bug" in str(exc)
    assert "5" in str(exc)


@pytest.mark.asyncio
async def test_create_label_use_case_raises_on_duplicate():
    """CreateLabelUseCase raises LabelNameAlreadyExistsError on duplicate name."""
    from app.domain.entities.label import Label
    from app.domain.repositories.label_repository import ILabelRepository
    from app.domain.exceptions import LabelNameAlreadyExistsError
    from app.application.use_cases.manage_labels import CreateLabelUseCase
    from app.application.dtos.label_dtos import LabelCreateDTO

    class _DupRepo(ILabelRepository):
        async def list_by_project(self, project_id):  # pragma: no cover
            return []

        async def get_by_name_in_project(self, project_id, name):
            return Label(id=1, project_id=project_id, name=name, color="#ff0000")

        async def create(self, project_id, name, color):  # pragma: no cover
            raise AssertionError("create must not run when duplicate exists")

    use_case = CreateLabelUseCase(_DupRepo())
    with pytest.raises(LabelNameAlreadyExistsError) as excinfo:
        await use_case.execute(LabelCreateDTO(project_id=5, name="Bug", color=None))
    assert excinfo.value.project_id == 5


@pytest.mark.asyncio
async def test_create_label_use_case_applies_default_color_when_none():
    """CreateLabelUseCase fills default color '#94a3b8' when dto.color is None/empty."""
    from app.domain.entities.label import Label
    from app.domain.repositories.label_repository import ILabelRepository
    from app.application.use_cases.manage_labels import CreateLabelUseCase
    from app.application.dtos.label_dtos import LabelCreateDTO

    captured = {}

    class _FakeRepo(ILabelRepository):
        async def list_by_project(self, project_id):  # pragma: no cover
            return []

        async def get_by_name_in_project(self, project_id, name):
            return None

        async def create(self, project_id, name, color):
            captured["color"] = color
            return Label(id=1, project_id=project_id, name=name, color=color)

    use_case = CreateLabelUseCase(_FakeRepo())
    await use_case.execute(LabelCreateDTO(project_id=5, name="Bug", color=None))
    assert captured["color"] == "#94a3b8"

    captured.clear()
    await use_case.execute(LabelCreateDTO(project_id=5, name="Feature", color="   "))
    assert captured["color"] == "#94a3b8"


@pytest.mark.asyncio
async def test_list_project_labels_use_case_returns_response_dtos():
    """ListProjectLabelsUseCase maps Label entities to LabelResponseDTOs."""
    from app.domain.entities.label import Label
    from app.domain.repositories.label_repository import ILabelRepository
    from app.application.use_cases.manage_labels import ListProjectLabelsUseCase

    class _FakeRepo(ILabelRepository):
        async def list_by_project(self, project_id):
            return [
                Label(id=1, project_id=project_id, name="Bug", color="#ff0000", usage_count=3),
                Label(id=2, project_id=project_id, name="Feature", color="#00ff00", usage_count=0),
            ]

        async def get_by_name_in_project(self, project_id, name):  # pragma: no cover
            return None

        async def create(self, project_id, name, color):  # pragma: no cover
            return None

    use_case = ListProjectLabelsUseCase(_FakeRepo())
    result = await use_case.execute(7)
    assert len(result) == 2
    assert result[0].name == "Bug" and result[0].usage_count == 3
    assert result[1].usage_count == 0


def test_manage_labels_has_no_sqlalchemy_import():
    """CLAUDE.md §4.2 DIP rule — application layer must NOT import sqlalchemy or infrastructure."""
    import inspect
    from app.application.use_cases import manage_labels

    src = inspect.getsource(manage_labels)
    assert "import sqlalchemy" not in src, "DIP violation: manage_labels imports sqlalchemy"
    assert "from sqlalchemy" not in src, "DIP violation: manage_labels imports from sqlalchemy"
    assert "from app.infrastructure" not in src, (
        "DIP violation: manage_labels imports from app.infrastructure"
    )


# ---------------------------------------------------------------------------
# Dependency shim
# ---------------------------------------------------------------------------


def test_dependencies_shim_reexports_get_label_repo():
    """`from app.api.dependencies import get_label_repo` must work (legacy compat)."""
    from app.api.dependencies import get_label_repo

    assert callable(get_label_repo)


# ---------------------------------------------------------------------------
# Router registration
# ---------------------------------------------------------------------------


def test_labels_router_registers_expected_routes():
    """FastAPI app must expose both /projects/{project_id}/labels and /labels."""
    from app.api.main import app

    paths = [r.path for r in app.routes if hasattr(r, "path")]
    assert "/api/v1/projects/{project_id}/labels" in paths, paths
    assert "/api/v1/labels" in paths, paths


# ---------------------------------------------------------------------------
# Integration — HTTP-level with DB
# ---------------------------------------------------------------------------


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


async def _seed_project(db_session, key: str) -> int:
    """Seed a project (as ACTIVE SCRUM) and return its id (idempotent on key)."""
    existing_pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing_pid:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'LBL', now(), 'SCRUM', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()
    pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    return pid


@pytest.mark.asyncio
async def test_list_project_labels_admin_returns_200(authenticated_client, db_session):
    """GET /projects/{id}/labels returns 200 + list[LabelResponseDTO] for admin."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLLS1")
    async with authenticated_client(role="admin") as ac:
        resp = await ac.get(f"/api/v1/projects/{pid}/labels")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data, list)
    for item in data:
        assert {"id", "project_id", "name", "color", "usage_count"}.issubset(item.keys())


@pytest.mark.asyncio
async def test_create_label_admin_returns_201(authenticated_client, db_session):
    """POST /labels creates a new label scoped to project_id and returns 201."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLCR1")
    async with authenticated_client(role="admin") as ac:
        resp = await ac.post(
            "/api/v1/labels",
            json={"project_id": pid, "name": "Bug", "color": "#ff0000"},
        )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Bug"
    assert body["color"] == "#ff0000"
    assert body["project_id"] == pid
    assert body["usage_count"] == 0


@pytest.mark.asyncio
async def test_create_label_default_color_when_omitted(authenticated_client, db_session):
    """POST /labels without color uses default '#94a3b8'."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLCR2")
    async with authenticated_client(role="admin") as ac:
        resp = await ac.post(
            "/api/v1/labels",
            json={"project_id": pid, "name": "Triage"},
        )
    assert resp.status_code == 201, resp.text
    assert resp.json()["color"] == "#94a3b8"


@pytest.mark.asyncio
async def test_create_label_duplicate_returns_409(authenticated_client, db_session):
    """Duplicate POST with same (project_id, name) returns 409 Conflict."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLCR3")
    payload = {"project_id": pid, "name": "Duplicate", "color": "#123456"}
    async with authenticated_client(role="admin") as ac:
        r1 = await ac.post("/api/v1/labels", json=payload)
        assert r1.status_code == 201, r1.text
        r2 = await ac.post("/api/v1/labels", json=payload)
    assert r2.status_code == 409, r2.text
    assert "already exists" in r2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_label_empty_name_returns_422(authenticated_client, db_session):
    """Empty name triggers Pydantic 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLCR4")
    async with authenticated_client(role="admin") as ac:
        resp = await ac.post("/api/v1/labels", json={"project_id": pid, "name": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_labels_non_member_returns_403(authenticated_client, db_session):
    """GET /projects/{id}/labels returns 403 for non-member (non-admin)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLLS2")
    async with authenticated_client(role="member") as ac:
        resp = await ac.get(f"/api/v1/projects/{pid}/labels")
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_create_label_non_member_returns_403(authenticated_client, db_session):
    """POST /labels by a non-member (non-admin) returns 403 (T-11-03-01 IDOR mitigation)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping label API tests")
    pid = await _seed_project(db_session, key="LBLCR5")
    async with authenticated_client(role="member") as ac:
        resp = await ac.post(
            "/api/v1/labels",
            json={"project_id": pid, "name": "IntruderLabel", "color": "#ff0000"},
        )
    assert resp.status_code == 403, resp.text
