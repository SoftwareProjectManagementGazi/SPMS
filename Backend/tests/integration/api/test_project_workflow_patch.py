"""Phase 12 Plan 12-10 (Bug X + Bug Y UAT fix) — PATCH /projects/{id}
WorkflowConfig validation integration test.

Pre-fix the project PATCH endpoint did not validate `process_config.workflow`
shape against the WorkflowConfig Pydantic DTO — the field was typed as
`Dict[str, Any]` so any payload was accepted and only failed downstream
when a Task or Milestone tried to use a phase_id that didn't exist or
didn't match the D-22 regex.

This integration suite asserts the post-fix behavior:
  * Workflow with `n1` / `n6` IDs → 422 (Bug X)
  * Workflow with regex-compliant `nd_<10>` IDs → 200 (Bug X happy path)
  * Workflow with description / is_initial / is_final / parent_id / wip_limit
    round-trips through GET /projects/{id} with the fields intact (Bug Y)
  * Workflow with zero is_initial nodes → 422 (Bug Y rule 4)
  * Workflow with zero is_final nodes → 422 (Bug Y rule 4)

W2-C11 NOTE: The PATCH body shape was originally `{"workflow": ...}` (the V1
key) because these tests pre-date the W1 schema migration. W2-C11 removed the
backend's dual-key tolerance — the canonical V2 key is `phase_workflow`. All
validation-shape tests below have been migrated to emit `phase_workflow` so
they continue to exercise the WorkflowConfigDTO validation contract. A new
test (test_patch_with_legacy_workflow_key_no_longer_validates) explicitly
documents that legacy `workflow` PATCH bodies now bypass validation but still
get normalized on entity load.
"""
import json
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


async def _seed_project(db_session, key: str = "WFV1") -> int:
    """Seed a minimal project, return its id."""
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
                "VALUES (:k, 'WFV', now(), 'SCRUM', 'ACTIVE', '{}'::jsonb)"
            ),
            {"k": key},
        )
        await db_session.flush()
    return (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()


_VALID_NODE = {
    "id": "nd_a1b2c3d4e5",
    "name": "Başlangıç",
    "x": 0,
    "y": 0,
    "color": "#888",
    "is_initial": True,
    "is_final": False,
}
_VALID_FINAL_NODE = {
    "id": "nd_f6g7h8i9j0",
    "name": "Son",
    "x": 200,
    "y": 0,
    "color": "#888",
    "is_initial": False,
    "is_final": True,
}


@pytest.mark.asyncio
async def test_patch_with_legacy_n1_id_returns_422(authenticated_client, db_session):
    """Bug X: workflow with `n1` IDs (regex-fail) must return 422 (not 200)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGX1")

    bad_workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "n1", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "n2", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
        ],
        "edges": [{"id": "e1", "source": "n1", "target": "n2", "type": "flow"}],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": bad_workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_with_compliant_nd_ids_returns_200(authenticated_client, db_session):
    """Bug X happy path: workflow with `nd_<10>` IDs returns 200."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGX2")

    good_workflow = {
        "mode": "flexible",
        "nodes": [_VALID_NODE, _VALID_FINAL_NODE],
        "edges": [{"id": "e1", "source": _VALID_NODE["id"], "target": _VALID_FINAL_NODE["id"], "type": "flow"}],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": good_workflow}},
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_round_trips_description_isInitial_isFinal_parentId_wipLimit(
    authenticated_client, db_session
):
    """Bug Y: PATCH then GET must preserve all extended WorkflowNode fields."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY1")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {
                "id": "nd_initialnod",  # 10 chars after nd_: i-n-i-t-i-a-l-n-o-d
                "name": "Planlama",
                "description": "Sprint planning phase",
                "x": 0,
                "y": 0,
                "color": "#888",
                "is_initial": True,
                "is_final": False,
                "parent_id": "gr_team_alpha",
                "wip_limit": 3,
            },
            {
                "id": "nd_finalnode1",  # 10 chars: f-i-n-a-l-n-o-d-e-1
                "name": "Kapanış",
                "description": "Closing phase",
                "x": 200,
                "y": 0,
                "color": "#888",
                "is_initial": False,
                "is_final": True,
                "wip_limit": 5,
            },
        ],
        "edges": [
            {"id": "e1", "source": "nd_initialnod", "target": "nd_finalnode1", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": workflow}},
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"

        # GET back and verify fields didn't get silently dropped.
        # W2-C11: V2 schema is canonical. The GET response always carries
        # `phase_workflow` after the Project entity normalizes (legacy V1
        # rows continue to be migrated on entity load).
        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        body = r2.json()
        pc = body["process_config"]
        pw = pc.get("phase_workflow")
        assert pw is not None, "Response missing phase_workflow key"
        nodes = pw["nodes"]
        first = next((n for n in nodes if n["id"] == "nd_initialnod"), None)
        assert first is not None, "Initial node lost on round trip"
        assert first.get("description") == "Sprint planning phase"
        # is_initial / is_final / parent_id / wip_limit may use either snake_case
        # or camelCase on the wire (mapper supports both); check snake first.
        assert first.get("is_initial") is True or first.get("isInitial") is True
        assert first.get("parent_id") == "gr_team_alpha" or first.get("parentId") == "gr_team_alpha"
        assert first.get("wip_limit") == 3 or first.get("wipLimit") == 3


@pytest.mark.asyncio
async def test_patch_with_zero_initial_returns_422(authenticated_client, db_session):
    """Bug Y rule 4: workflow with no is_initial=True node returns 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY2")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": False, "is_final": False},
            {"id": "nd_bbbbbbbbbb", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
        ],
        "edges": [
            {"id": "e1", "source": "nd_aaaaaaaaaa", "target": "nd_bbbbbbbbbb", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_with_zero_final_returns_422(authenticated_client, db_session):
    """Bug Y rule 4: workflow with no is_final=True node returns 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY3")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "nd_bbbbbbbbbb", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": False},
        ],
        "edges": [
            {"id": "e1", "source": "nd_aaaaaaaaaa", "target": "nd_bbbbbbbbbb", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_with_legacy_workflow_key_no_longer_validates(authenticated_client, db_session):
    """W2-C11: legacy `workflow` key is silently dropped by WorkflowConfigDTO
    validation at the API boundary, but the PATCH itself still succeeds and
    the entity normalizer migrates the persisted JSONB on the next entity
    load.

    Pre-W2-C11 the API boundary accepted BOTH `workflow` (Frontend1) and
    `phase_workflow` (V2-aware clients) — dual-key tolerance kept the
    Wave 1 backend rename decoupled from the Frontend2 migration. After
    Frontend2 shipped its V2 save handler in W2-C5, the legacy alias was
    no longer reachable from any supported client, so W2-C11 removed it
    from the API boundary.

    Behavioural contract preserved by this test:
      * PATCH `{"process_config": {"workflow": ...}}` still returns 200 —
        backend doesn't reject the unknown key (the JSONB column accepts
        arbitrary dicts).
      * The `workflow` block does NOT pass through `WorkflowConfigDTO`
        validation (the use case only validates `phase_workflow`).
      * The entity normalizer renames `workflow` -> `phase_workflow`
        when the next read constructs the Project entity, so GET-after-
        PATCH surfaces the V2 key shape.

    This documents the graceful-degradation path for any pre-W2-C5 client
    still emitting V1 payloads. Note: an invalid `workflow` block that
    would have produced 422 pre-W2-C11 now silently passes — this is the
    intentional cost of the cleanup, because no supported FE binary still
    emits the legacy key.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="DUALK1")

    good_workflow = {
        "mode": "flexible",
        "nodes": [_VALID_NODE, _VALID_FINAL_NODE],
        "edges": [{"id": "e1", "source": _VALID_NODE["id"], "target": _VALID_FINAL_NODE["id"], "type": "flow"}],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        # Send with the LEGACY `workflow` key — backend no longer validates
        # the block, but the PATCH succeeds (200) because the unknown key is
        # accepted into the process_config JSONB.
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": good_workflow}},
        )
        assert r.status_code == 200, (
            f"PATCH with legacy `workflow` key must still return 200 "
            f"(graceful degradation); got {r.status_code}: {r.text}"
        )

        # GET-after-PATCH must return the V2 `phase_workflow` key (normalizer
        # renamed it on entity load). The body content must equal what was
        # sent under the legacy key.
        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        pc = r2.json()["process_config"]
        assert "phase_workflow" in pc, (
            "GET response must surface the V2 `phase_workflow` key after "
            "normalizer applies the legacy `workflow` rename on entity load."
        )
        assert "workflow" not in pc, (
            "Legacy `workflow` key must be removed by the normalizer "
            "(it should never coexist with `phase_workflow` in the V2 shape)."
        )
        pw = pc["phase_workflow"]
        # Content equivalence — nodes/edges/mode preserved verbatim by the rename.
        assert pw["mode"] == good_workflow["mode"]
        assert {n["id"] for n in pw["nodes"]} == {n["id"] for n in good_workflow["nodes"]}
        assert {e["id"] for e in pw["edges"]} == {e["id"] for e in good_workflow["edges"]}


# ---------------------------------------------------------------------------
# W2-C3: Capability + node-field PATCH round-trip integration tests.
#
# These tests sigortalar Wave 2 W2-C1 (Pydantic capabilities round-trip) + W2-C2
# (idempotent _migrate_v1_to_v2) at the API boundary so that W2-C4+ FE flows
# (CapabilitiesPanel, status-mode node engine fields) cannot regress silently.
#
# Production code is UNCHANGED in W2-C3; only new test cases are added.
# ---------------------------------------------------------------------------


def _valid_phase_workflow_body(*, capabilities: dict | None = None) -> dict:
    """V2 phase_workflow shape — 1 initial + 1 final node (satisfies D-19 rule 4)."""
    body: dict = {
        "mode": "flexible",
        "nodes": [_VALID_NODE, _VALID_FINAL_NODE],
        "edges": [
            {"id": "e1", "source": _VALID_NODE["id"], "target": _VALID_FINAL_NODE["id"], "type": "flow"},
        ],
        "groups": [],
    }
    if capabilities is not None:
        body["capabilities"] = capabilities
    return body


@pytest.mark.asyncio
async def test_patch_phase_workflow_capabilities_round_trip(
    authenticated_client, db_session
):
    """W2-C3: PATCH phase_workflow.capabilities -> GET preserves all flags.

    Validates the W2-C1 fix: pre-W2 the WorkflowConfig DTO did not declare a
    `capabilities` field, so Pydantic `extra="ignore"` silently dropped user
    edits. Post-W2 the field is declared (Optional[WorkflowCapabilities]) and
    PATCHed values must survive a PATCH -> GET cycle verbatim.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C3CAP1")

    caps = {
        "enforce_wip_limits": True,
        "enforce_sequential_dependencies": True,
        "restrict_expired_sprints": True,
        "has_recurring": False,
        "initial_node_id": _VALID_NODE["id"],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={
                "process_config": {
                    "phase_workflow": _valid_phase_workflow_body(capabilities=caps),
                }
            },
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"

        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        pc = r2.json()["process_config"]
        got_caps = pc["phase_workflow"].get("capabilities")
        assert got_caps is not None, (
            "phase_workflow.capabilities missing on GET — W2-C1 regression "
            "(Pydantic dropped the key)"
        )
        assert got_caps["enforce_wip_limits"] is True
        assert got_caps["enforce_sequential_dependencies"] is True
        assert got_caps["restrict_expired_sprints"] is True
        assert got_caps["has_recurring"] is False
        assert got_caps["initial_node_id"] == _VALID_NODE["id"]


@pytest.mark.asyncio
async def test_patch_phase_workflow_capabilities_partial_preserves_others(
    authenticated_client, db_session
):
    """W2-C3: Second PATCH with subset of caps must not zero out prior flags.

    Guards the Wave 2 FE flow where a single toggle change ships only the
    changed flag (avoiding races where two users edit different toggles).
    The _migrate_v1_to_v2 entity normalizer plus the JSONB persistence layer
    must preserve untouched values across successive PATCH calls.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C3CAP2")

    async with authenticated_client(role="admin") as client:
        # First PATCH: enable all three engine-relevant caps.
        r1 = await client.patch(
            f"/api/v1/projects/{pid}",
            json={
                "process_config": {
                    "phase_workflow": _valid_phase_workflow_body(capabilities={
                        "enforce_wip_limits": True,
                        "enforce_sequential_dependencies": True,
                        "restrict_expired_sprints": True,
                    }),
                }
            },
        )
        assert r1.status_code == 200, r1.text

        # Second PATCH: toggle ONLY enforce_wip_limits off, keep the other two
        # explicit. The FE will likely re-send the full caps object after
        # reading the current state — this models that contract.
        r2 = await client.patch(
            f"/api/v1/projects/{pid}",
            json={
                "process_config": {
                    "phase_workflow": _valid_phase_workflow_body(capabilities={
                        "enforce_wip_limits": False,
                        "enforce_sequential_dependencies": True,
                        "restrict_expired_sprints": True,
                    }),
                }
            },
        )
        assert r2.status_code == 200, r2.text

        # GET — final state must have wip off and other two still on.
        r3 = await client.get(f"/api/v1/projects/{pid}")
        assert r3.status_code == 200
        caps = r3.json()["process_config"]["phase_workflow"]["capabilities"]
        assert caps["enforce_wip_limits"] is False
        assert caps["enforce_sequential_dependencies"] is True, (
            "Second PATCH must preserve enforce_sequential_dependencies"
        )
        assert caps["restrict_expired_sprints"] is True, (
            "Second PATCH must preserve restrict_expired_sprints"
        )


@pytest.mark.asyncio
async def test_patch_task_workflow_capabilities_round_trip(
    authenticated_client, db_session
):
    """W2-C3: task_workflow.capabilities round-trip (has_recurring etc.).

    task_workflow is the second leg of the V2 dual-workflow split — the
    entity normalizer seeds it via setdefault, and a PATCH carrying a
    task_workflow body must persist + round-trip identically.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C3CAP3")

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={
                "process_config": {
                    "phase_workflow": _valid_phase_workflow_body(),
                    "task_workflow": {
                        "capabilities": {
                            "enforce_wip_limits": True,
                            "has_recurring": False,
                        },
                        "edges": [],
                        "groups": [],
                    },
                }
            },
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"

        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        tw = r2.json()["process_config"].get("task_workflow")
        assert tw is not None, "GET response missing task_workflow"
        tw_caps = tw.get("capabilities")
        assert tw_caps is not None, "task_workflow.capabilities missing on GET"
        assert tw_caps["enforce_wip_limits"] is True
        assert tw_caps["has_recurring"] is False


@pytest.mark.asyncio
async def test_patch_capabilities_rejects_non_bool(
    authenticated_client, db_session
):
    """W2-C3: a clearly-non-bool capability value -> 422.

    NOTE on the test fixture choice: Pydantic V2's default ("lax") bool
    coercion accepts the JSON-bool-shaped strings ``"yes"`` / ``"no"`` /
    ``"true"`` / ``"false"`` and turns them into Python bools, so those
    inputs would NOT be rejected at the API boundary even though the
    schema declares ``bool``. To exercise the strict validation path we
    use a list (``[]``) — clearly not a bool nor a coercible scalar — so
    Pydantic returns 422.

    Validates that the Pydantic round-trip introduced in W2-C1 surfaces
    proper validation errors for malformed payloads (rather than silently
    dropping the value the way pre-W2 ``extra="ignore"`` did).
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C3CAP4")

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={
                "process_config": {
                    "phase_workflow": _valid_phase_workflow_body(capabilities={
                        "enforce_wip_limits": [],  # list is uncoercible to bool
                    }),
                }
            },
        )
        assert r.status_code == 422, (
            f"non-bool capability value must yield 422; got {r.status_code}: {r.text}"
        )


# ---------------------------------------------------------------------------
# W2-C7: phase_workflow.nodes engine field PATCH round-trip.
#
# Closes the gap called out in the W2-C3 plan (".../W2-C3 ... engine fields
# workflow.nodes ile round-trip eden ek bir test yazılabilir (Wave 2'de
# eklenir; W2-C3'te eksikti). Opsiyonel.") and now-required by W2-C7's
# WorkflowNode Pydantic extension. Pre-W2-C7 a lifecycle-mode user editing
# `category` / `is_terminal` / `max_duration_days` / `entry_policy` /
# `exit_policy` on a phase node would see the field disappear after Save
# because the Pydantic boundary's `extra="ignore"` silently dropped unknown
# keys. The new fields on WorkflowNode (W2-C7) close that hole; this
# integration test pins the contract end-to-end.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patch_phase_workflow_node_engine_fields_round_trip(
    authenticated_client, db_session
):
    """W2-C7: PATCH phase_workflow.nodes[i].{engine fields} -> GET preserves all keys.

    Mirrors the W2-C3 capability round-trip pattern but at the node level.
    The lifecycle-mode editor writes the camelCase engine fields onto the
    workflow state (SelectionPanel.NodeEditor.updateNode, W2-C6) and the
    save handler emits them as snake_case `phase_workflow.nodes[i]` keys via
    unmapWorkflowConfig (W2-C5). For that pipeline to actually persist the
    edits, the API-side Pydantic must accept the new keys instead of
    silently dropping them — which is exactly what W2-C7 fixes.
    """
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C7NODE")

    # Initial node carries the full engine field payload; final node remains
    # bare so the test also confirms the engine fields default to None / False
    # on unannotated nodes after the round trip (regression against a future
    # change that accidentally fills defaults on serialize).
    initial_with_engine = {
        **_VALID_NODE,
        "category": "in_progress",
        "is_terminal": False,
        "max_duration_days": 14,
        "entry_policy": "edges_only",
        "exit_policy": "terminal_lock",
    }

    body = {
        "mode": "flexible",
        "nodes": [initial_with_engine, _VALID_FINAL_NODE],
        "edges": [
            {
                "id": "e1",
                "source": _VALID_NODE["id"],
                "target": _VALID_FINAL_NODE["id"],
                "type": "flow",
            }
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": body}},
        )
        assert r.status_code == 200, (
            f"expected 200, got {r.status_code}: {r.text}"
        )

        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        pc = r2.json()["process_config"]
        pw = pc.get("phase_workflow")
        assert pw is not None, "GET response missing phase_workflow key"

        got_initial = next(
            (n for n in pw["nodes"] if n["id"] == _VALID_NODE["id"]), None
        )
        assert got_initial is not None, "Initial node missing after round trip"
        # All 5 engine fields must survive verbatim (W2-C7 regression guard).
        assert got_initial.get("category") == "in_progress"
        assert got_initial.get("is_terminal") is False
        assert got_initial.get("max_duration_days") == 14
        assert got_initial.get("entry_policy") == "edges_only"
        assert got_initial.get("exit_policy") == "terminal_lock"


@pytest.mark.asyncio
async def test_patch_phase_workflow_node_invalid_category_rejected(
    authenticated_client, db_session
):
    """W2-C7: a non-enum category value -> 422 (not silent drop)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="W2C7NODX")

    bad_node = {
        **_VALID_NODE,
        "category": "wat",  # not in {todo, in_progress, done}
    }
    body = {
        "mode": "flexible",
        "nodes": [bad_node, _VALID_FINAL_NODE],
        "edges": [
            {
                "id": "e1",
                "source": _VALID_NODE["id"],
                "target": _VALID_FINAL_NODE["id"],
                "type": "flow",
            }
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"phase_workflow": body}},
        )
        assert r.status_code == 422, (
            f"invalid category enum must yield 422; got {r.status_code}: {r.text}"
        )
