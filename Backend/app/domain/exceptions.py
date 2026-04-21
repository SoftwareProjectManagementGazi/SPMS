class DomainError(Exception):
    """Base class for domain exceptions"""
    pass

class UserAlreadyExistsError(DomainError):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"User with email {email} already exists")

class InvalidCredentialsError(DomainError):
    def __init__(self):
        super().__init__("Invalid email or password")

class ProjectNotFoundError(DomainError):
    def __init__(self, project_id: int):
        super().__init__(f"Project with id {project_id} not found")

class TaskNotFoundError(DomainError):
    def __init__(self, task_id: int):
        super().__init__(f"Task with id {task_id} not found")

class SprintNotFoundError(DomainError):
    def __init__(self, sprint_id: int):
        super().__init__(f"Sprint with id {sprint_id} not found")

class UserNotFoundError(DomainError):
    def __init__(self, user_id: int):
        super().__init__(f"User with id {user_id} not found")

class CommentNotFoundError(DomainError):
    def __init__(self, comment_id: int):
        super().__init__(f"Comment with id {comment_id} not found")

class AttachmentNotFoundError(DomainError):
    def __init__(self, file_id: int):
        super().__init__(f"Attachment with id {file_id} not found")

class DependencyAlreadyExistsError(DomainError):
    def __init__(self, task_id: int, depends_on_id: int):
        super().__init__(f"Dependency between task {task_id} and task {depends_on_id} already exists")


# ---------------------------------------------------------------------------
# Phase 9 domain exceptions (BACK-04..06, API-01, API-10)
# ---------------------------------------------------------------------------


class PhaseGateLockedError(DomainError):
    """Raised when pg_advisory_xact_lock cannot be acquired for a project's phase transition (D-01, D-02).

    Router maps this to HTTP 409 Conflict.
    """
    def __init__(self, project_id: int):
        self.project_id = project_id
        super().__init__(f"Phase transition lock held for project {project_id}")


class CriteriaUnmetError(DomainError):
    """Raised when Phase Gate auto-criteria fail and allow_override is False (D-03, D-05).

    The router converts this to HTTP 422 with `detail={"unmet": [...]}`.
    Attribute `unmet_criteria` is the list of criterion check dicts, e.g.:
        [{"check": "all_tasks_done", "passed": False, "detail": "3/5 done"}]
    """
    def __init__(self, unmet: list):
        self.unmet_criteria = list(unmet)
        super().__init__(f"Phase completion criteria unmet: {len(self.unmet_criteria)} check(s) failed")


class PhaseGateNotApplicableError(DomainError):
    """Raised when Phase Gate is invoked for a workflow mode that does not support phase transitions
    (D-07: continuous/Kanban mode). Router maps this to HTTP 400 Bad Request.
    """
    def __init__(self, mode: str):
        self.mode = mode
        super().__init__(f"Phase Gate not applicable for workflow mode '{mode}'")


class ArchivedNodeReferenceError(DomainError):
    """Raised when a create/update references an archived or non-existent workflow node (D-19, D-21).

    Router maps to HTTP 400 Bad Request.
    """
    def __init__(self, node_id: str, reason: str = "archived or non-existent"):
        self.node_id = node_id
        self.reason = reason
        super().__init__(f"Node '{node_id}' is {reason} and cannot be referenced")


class CrossProjectPhaseReferenceError(DomainError):
    """Raised when an entity references a phase node owned by a different project (D-20).

    Router maps to HTTP 400 Bad Request.
    """
    def __init__(self, project_id: int, referenced_node: str):
        self.project_id = project_id
        self.referenced_node = referenced_node
        super().__init__(
            f"Node '{referenced_node}' does not belong to project {project_id}; cross-project references forbidden"
        )


class WorkflowValidationError(DomainError):
    """Raised by WorkflowConfig Pydantic business-rule validators (D-54, D-55).

    Router maps to HTTP 422. `errors` is a list of validation failure dicts.
    """
    def __init__(self, errors: list):
        self.errors = list(errors)
        super().__init__(f"Workflow validation failed: {len(self.errors)} error(s)")


class ProcessConfigSchemaError(DomainError):
    """Raised when process_config schema_version migration chain has a gap (Pitfall 4).

    E.g., schema_version=3 but only _MIGRATIONS[0]..[1] defined.
    Router maps to HTTP 500 (Internal Server Error — represents developer error, not user input).
    """
    def __init__(self, from_version: int, to_version: int):
        self.from_version = from_version
        self.to_version = to_version
        super().__init__(
            f"No migration path from process_config schema_version {from_version} to {to_version}"
        )
