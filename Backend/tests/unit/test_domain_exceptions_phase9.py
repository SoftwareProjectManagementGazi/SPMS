"""Smoke test for Phase 9 domain exceptions.

Verifies each exception class imports, raises with the expected detail shape,
and inherits from DomainError so router try/except blocks catch correctly.
"""
import pytest
from app.domain.exceptions import (
    DomainError,
    PhaseGateLockedError,
    CriteriaUnmetError,
    PhaseGateNotApplicableError,
    ArchivedNodeReferenceError,
    CrossProjectPhaseReferenceError,
    WorkflowValidationError,
    ProcessConfigSchemaError,
)


def test_phase_gate_locked_error():
    e = PhaseGateLockedError(project_id=42)
    assert isinstance(e, DomainError)
    assert e.project_id == 42
    assert "42" in str(e)


def test_criteria_unmet_error_exposes_unmet_criteria():
    unmet = [
        {"check": "all_tasks_done", "passed": False, "detail": "3/5 done"},
        {"check": "no_critical_tasks", "passed": False, "detail": "1 critical open"},
    ]
    e = CriteriaUnmetError(unmet=unmet)
    assert isinstance(e, DomainError)
    assert e.unmet_criteria == unmet
    assert "2 check(s) failed" in str(e)


def test_phase_gate_not_applicable_error_message_shape():
    e = PhaseGateNotApplicableError(mode="continuous")
    assert isinstance(e, DomainError)
    assert e.mode == "continuous"
    assert "continuous" in str(e)
    assert "not applicable" in str(e).lower()


def test_archived_node_reference_error_carries_node_id():
    e = ArchivedNodeReferenceError(node_id="nd_V1StGXR8_Z", reason="archived")
    assert isinstance(e, DomainError)
    assert e.node_id == "nd_V1StGXR8_Z"
    assert e.reason == "archived"
    assert "nd_V1StGXR8_Z" in str(e)


def test_cross_project_phase_reference_error():
    e = CrossProjectPhaseReferenceError(project_id=5, referenced_node="nd_abc")
    assert isinstance(e, DomainError)
    assert e.project_id == 5
    assert e.referenced_node == "nd_abc"


def test_workflow_validation_error_holds_errors_list():
    errors = [{"loc": ["nodes", 0, "id"], "msg": "bad format"}]
    e = WorkflowValidationError(errors=errors)
    assert isinstance(e, DomainError)
    assert e.errors == errors


def test_process_config_schema_error():
    e = ProcessConfigSchemaError(from_version=0, to_version=2)
    assert isinstance(e, DomainError)
    assert e.from_version == 0
    assert e.to_version == 2
    assert "0" in str(e) and "2" in str(e)


@pytest.mark.parametrize(
    "exc_cls,args",
    [
        (PhaseGateLockedError, {"project_id": 1}),
        (CriteriaUnmetError, {"unmet": []}),
        (PhaseGateNotApplicableError, {"mode": "m"}),
        (ArchivedNodeReferenceError, {"node_id": "nd_x"}),
        (CrossProjectPhaseReferenceError, {"project_id": 1, "referenced_node": "nd_x"}),
        (WorkflowValidationError, {"errors": []}),
        (ProcessConfigSchemaError, {"from_version": 0, "to_version": 1}),
    ],
)
def test_all_phase9_exceptions_inherit_domain_error(exc_cls, args):
    with pytest.raises(DomainError):
        raise exc_cls(**args)
