"""W2-C1: WorkflowConfig.capabilities round-trip + WorkflowCapabilities validation.

Wave 2 W2-C1 bug fix coverage. Pre-fix `WorkflowConfig.model_config =
ConfigDict(extra="ignore")` silently dropped the `capabilities` sub-object at
PATCH validation (`manage_projects.WorkflowConfigDTO(**wf)`), so user-edited
capability values never reached persistence — the `_migrate_v1_to_v2` entity
normalizer rebuilt them from scratch on every entity load, hiding the bug.

These tests pin down:
- WorkflowCapabilities defaults match design doc §4 (engine-safe).
- All 5 capability fields round-trip through Pydantic validation.
- Invalid types (non-bool for flag fields, non-string for id) raise.
- Extra keys are tolerated for forward compat (Wave 3+ capabilities).
- WorkflowConfig accepts a capabilities sub-object and surfaces it as a
  fully-typed WorkflowCapabilities instance.
- Legacy rows without capabilities parse as `capabilities=None`.
- `model_dump()` re-emits the capabilities dict so the persistence layer sees
  the user-edited values (not stripped).
"""
import pytest
from pydantic import ValidationError

from app.application.dtos.workflow_dtos import (
    WorkflowCapabilities,
    WorkflowConfig,
    WorkflowNode,
)


def _valid_workflow_shell(**overrides):
    """V2 minimal shell — 1 initial + 1 final node, no edges (passes D-19 rule 4)."""
    base = {
        "mode": "flexible",
        "nodes": [
            {
                "id": "nd_test000001",
                "name": "Start",
                "x": 0,
                "y": 0,
                "color": "#888",
                "is_initial": True,
            },
            {
                "id": "nd_test000002",
                "name": "End",
                "x": 100,
                "y": 0,
                "color": "#888",
                "is_final": True,
            },
        ],
        "edges": [],
        "groups": [],
    }
    base.update(overrides)
    return base


class TestWorkflowCapabilities:
    def test_default_values(self):
        caps = WorkflowCapabilities()
        assert caps.enforce_wip_limits is False
        assert caps.enforce_sequential_dependencies is False
        assert caps.restrict_expired_sprints is False
        assert caps.has_recurring is True
        assert caps.initial_node_id is None

    def test_all_fields_round_trip(self):
        caps = WorkflowCapabilities(
            enforce_wip_limits=True,
            enforce_sequential_dependencies=True,
            restrict_expired_sprints=True,
            has_recurring=False,
            initial_node_id="nd_abc1234567",
        )
        dumped = caps.model_dump()
        assert dumped["enforce_wip_limits"] is True
        assert dumped["enforce_sequential_dependencies"] is True
        assert dumped["restrict_expired_sprints"] is True
        assert dumped["has_recurring"] is False
        assert dumped["initial_node_id"] == "nd_abc1234567"

    def test_initial_node_id_empty_string_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowCapabilities(initial_node_id="")

    def test_extra_keys_ignored(self):
        # Forward compat: Wave 3+ capability flags must not break Wave 2 parse.
        caps = WorkflowCapabilities.model_validate(
            {"enforce_wip_limits": True, "future_field": "ignored"}
        )
        assert caps.enforce_wip_limits is True
        assert not hasattr(caps, "future_field")


class TestWorkflowConfigCapabilitiesRoundTrip:
    def test_capabilities_persisted_on_validate(self):
        shell = _valid_workflow_shell(
            capabilities={
                "enforce_wip_limits": True,
                "enforce_sequential_dependencies": True,
            }
        )
        wf = WorkflowConfig.model_validate(shell)
        assert wf.capabilities is not None
        assert wf.capabilities.enforce_wip_limits is True
        assert wf.capabilities.enforce_sequential_dependencies is True
        # Defaults filled in for unspecified flags
        assert wf.capabilities.has_recurring is True
        assert wf.capabilities.restrict_expired_sprints is False

    def test_capabilities_absent_yields_none(self):
        # Legacy JSONB shape (no capabilities key) — must parse cleanly.
        wf = WorkflowConfig.model_validate(_valid_workflow_shell())
        assert wf.capabilities is None

    def test_capabilities_dumped_back_to_dict(self):
        shell = _valid_workflow_shell(
            capabilities={
                "enforce_wip_limits": True,
                "initial_node_id": "nd_test000001",
            }
        )
        wf = WorkflowConfig.model_validate(shell)
        dumped = wf.model_dump()
        assert dumped["capabilities"]["enforce_wip_limits"] is True
        assert dumped["capabilities"]["initial_node_id"] == "nd_test000001"

    def test_invalid_capability_value_raises(self):
        # Use a string OUTSIDE Pydantic v2's bool-coercion table. The library
        # coerces "yes"/"true"/"1"/"on"/"y" -> True (and their false twins ->
        # False) per its documented LaxBool conversion. Anything else (here
        # "maybe") raises ValidationError, which is the bug-fix contract we
        # want to assert: silently-dropped capabilities are gone, AND clearly
        # malformed flag values now surface as 422 at the API boundary.
        shell = _valid_workflow_shell(
            capabilities={"enforce_wip_limits": "maybe"}
        )
        with pytest.raises(ValidationError):
            WorkflowConfig.model_validate(shell)


class TestWorkflowNodeEngineFields:
    """W2-C7: WorkflowNode engine field round-trip + validation.

    Wave 2 W2-C7 extends WorkflowNode with the 5 BoardColumn engine fields
    (category, is_terminal, max_duration_days, entry_policy, exit_policy)
    so lifecycle-mode nodes can persist them into phase_workflow.nodes JSON.
    Pre-W2-C7 the editor's SelectionPanel.NodeEditor already surfaced these
    inputs in both modes (W2-C6) and writes them onto the local workflow
    state, but `extra="ignore"` on the API boundary silently dropped them at
    PATCH validation — so a lifecycle-mode user editing `category=in_progress`
    + Save + reload saw the field disappear. These tests pin the Pydantic
    fix so the regression cannot recur.
    """

    def test_engine_fields_default_to_none_or_false(self):
        node = WorkflowNode.model_validate(
            {"id": "nd_test000001", "name": "A", "x": 0, "y": 0, "color": "#888"}
        )
        assert node.category is None
        assert node.is_terminal is False
        assert node.max_duration_days is None
        assert node.entry_policy is None
        assert node.exit_policy is None

    def test_engine_fields_round_trip(self):
        node = WorkflowNode.model_validate(
            {
                "id": "nd_test000001",
                "name": "A",
                "x": 0,
                "y": 0,
                "color": "#888",
                "category": "in_progress",
                "is_terminal": True,
                "max_duration_days": 14,
                "entry_policy": "edges_only",
                "exit_policy": "terminal_lock",
            }
        )
        assert node.category == "in_progress"
        assert node.is_terminal is True
        assert node.max_duration_days == 14
        assert node.entry_policy == "edges_only"
        assert node.exit_policy == "terminal_lock"
        # And model_dump re-emits them so persistence sees the values.
        dumped = node.model_dump()
        assert dumped["category"] == "in_progress"
        assert dumped["is_terminal"] is True
        assert dumped["max_duration_days"] == 14
        assert dumped["entry_policy"] == "edges_only"
        assert dumped["exit_policy"] == "terminal_lock"

    def test_invalid_category_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate(
                {
                    "id": "nd_test000001",
                    "name": "A",
                    "x": 0,
                    "y": 0,
                    "color": "#888",
                    "category": "wat",
                }
            )

    def test_max_duration_days_zero_rejected(self):
        # ge=1 mirrors the BoardColumn DB constraint (alembic 013); a 0-day
        # cap is meaningless and would let the engine flag every task as
        # over-due immediately on entry.
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate(
                {
                    "id": "nd_test000001",
                    "name": "A",
                    "x": 0,
                    "y": 0,
                    "color": "#888",
                    "max_duration_days": 0,
                }
            )

    def test_invalid_entry_policy_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate(
                {
                    "id": "nd_test000001",
                    "name": "A",
                    "x": 0,
                    "y": 0,
                    "color": "#888",
                    "entry_policy": "freeform",
                }
            )

    def test_invalid_exit_policy_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate(
                {
                    "id": "nd_test000001",
                    "name": "A",
                    "x": 0,
                    "y": 0,
                    "color": "#888",
                    "exit_policy": "locked-tight",
                }
            )

    def test_engine_fields_persisted_through_workflow_validate(self):
        # Full WorkflowConfig round-trip — confirms the engine fields survive
        # the parent validator (D-19 rule 4) and re-emit through model_dump.
        shell = _valid_workflow_shell()
        # Attach engine fields to the initial node.
        shell["nodes"][0].update(
            {
                "category": "todo",
                "is_terminal": False,
                "max_duration_days": 7,
                "entry_policy": "any",
                "exit_policy": "edges_only",
            }
        )
        wf = WorkflowConfig.model_validate(shell)
        first = wf.nodes[0]
        assert first.category == "todo"
        assert first.max_duration_days == 7
        assert first.entry_policy == "any"
        assert first.exit_policy == "edges_only"
        dumped = wf.model_dump()
        node_dump = dumped["nodes"][0]
        assert node_dump["category"] == "todo"
        assert node_dump["max_duration_days"] == 7
        assert node_dump["entry_policy"] == "any"
        assert node_dump["exit_policy"] == "edges_only"
