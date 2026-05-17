from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from app.domain.entities.board_column import BoardColumn
from app.domain.exceptions import ProcessConfigSchemaError


class Methodology(str, Enum):
    SCRUM = "SCRUM"
    KANBAN = "KANBAN"
    WATERFALL = "WATERFALL"
    ITERATIVE = "ITERATIVE"


class ProjectStatus(str, Enum):
    """BACK-01 / D-34. Stored as VARCHAR(20) in projects.status. Default ACTIVE."""
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    ARCHIVED = "ARCHIVED"


# BACK-03 / D-33 — process_config schema version
# C1 (workflow engine refactor): bumped to 2.
#   V2 changes: rename `workflow` -> `phase_workflow`; nest engine flags
#   (enforce_wip_limits / enforce_sequential_dependencies / restrict_expired_sprints)
#   under `phase_workflow.capabilities`. See .planning/workflow-engine-design.md.
CURRENT_SCHEMA_VERSION = 2
_MAX_MIGRATION_ITERATIONS = 20  # Pitfall 4 guard against infinite loop


def _migrate_v0_to_v1(config: dict) -> dict:
    """Legacy V0 (no schema_version, may have methodology at top level) -> V1 canonical (D-33)."""
    new = dict(config)
    # Rename old top-level methodology if present
    if "methodology" in new and "methodology_legacy" not in new:
        new["methodology_legacy"] = new.pop("methodology")
    # Seed defaults for missing keys
    new.setdefault("workflow", {"mode": "flexible", "nodes": [], "edges": [], "groups": []})
    new.setdefault("phase_completion_criteria", {})
    new.setdefault("enable_phase_assignment", False)
    # Workflow engine flags — seeded per process template by migration_005.py:
    #   Scrum    -> restrict_expired_sprints=True
    #   Kanban   -> enforce_wip_limits=True
    #   Waterfall-> enforce_sequential_dependencies=True
    # No use case reads these yet; they are the contract for the upcoming
    # workflow engine (Strangler target — see workflow motor design).
    # NOTE (C1): V2 migration moves these into phase_workflow.capabilities;
    # at V1 they still live at the top level so this seed is intentional.
    new.setdefault("enforce_sequential_dependencies", False)
    new.setdefault("enforce_wip_limits", False)
    new.setdefault("restrict_expired_sprints", False)
    # Phase 11 D-17 / D-43 additions — additive, idempotent.
    new.setdefault("backlog_definition", "cycle_null")
    new.setdefault("cycle_label", None)
    new["schema_version"] = 1
    return new


def _migrate_v1_to_v2(config: dict) -> dict:
    """V1 -> V2: rename `workflow` -> `phase_workflow`; nest engine flags under `capabilities`.

    Idempotent and defensive — safe to run on partially-migrated configs in the wild
    (e.g. a V1 row that already has `phase_workflow` because it was touched by a
    forward-compatible client). Behavioural impact is zero; only the JSONB shape
    changes. See .planning/workflow-engine-design.md and the C1 plan section in
    .planning/workflow-engine-implementation.md.
    """
    new = dict(config)
    # 1. Rename workflow -> phase_workflow (only if old key exists AND new key does not).
    if "workflow" in new and "phase_workflow" not in new:
        new["phase_workflow"] = new.pop("workflow")
    elif "workflow" in new:
        # Both present — keep phase_workflow as canonical, drop the legacy alias.
        new.pop("workflow", None)

    # 2. Build capabilities sub-object by pulling from top-level flags.
    caps = {
        "enforce_wip_limits": new.pop("enforce_wip_limits", False),
        "enforce_sequential_dependencies": new.pop(
            "enforce_sequential_dependencies", False
        ),
        "restrict_expired_sprints": new.pop("restrict_expired_sprints", False),
        # initial_node_id is derived from nodes when any node has is_initial=True.
        "initial_node_id": None,
    }
    pw = new.get("phase_workflow") or {}
    if isinstance(pw, dict):
        for n in pw.get("nodes", []) or []:
            if isinstance(n, dict) and n.get("is_initial"):
                caps["initial_node_id"] = n.get("id")
                break
        # Idempotency for partial pre-V2 configs in the wild: only set capabilities
        # if it isn't already present. Do NOT overwrite a pre-existing block.
        pw.setdefault("capabilities", caps)
        new["phase_workflow"] = pw
    else:
        # Highly defensive: phase_workflow was non-dict (e.g. None). Seed a minimal
        # canonical block so downstream readers don't NPE.
        new["phase_workflow"] = {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": caps,
        }

    # task_workflow placeholder — engine reads it in C5+; safe default is empty.
    # Idempotency: setdefault on outer key + nested setdefault on capabilities so
    # that a partially-migrated config (where task_workflow exists without 'capabilities')
    # is healed without clobbering existing values.
    # C9: `has_recurring` (default True) gates the recurring-next-instance trigger
    # in UpdateTaskUseCase; nested setdefault guarantees pre-V2-of-V2 rows (those
    # touched by C2 but predating C9) also pick up the default on re-normalisation.
    tw = new.setdefault("task_workflow", {
        "capabilities": {
            "enforce_wip_limits": False,
            "has_recurring": True,
            "initial_node_id": None,
        },
        "edges": [],
        "groups": [],
    })
    if isinstance(tw, dict):
        tw.setdefault("capabilities", {})
        if isinstance(tw["capabilities"], dict):
            tw["capabilities"].setdefault("enforce_wip_limits", False)
            tw["capabilities"].setdefault("has_recurring", True)
            tw["capabilities"].setdefault("initial_node_id", None)
        tw.setdefault("edges", [])
        tw.setdefault("groups", [])

    new["schema_version"] = 2
    return new


_MIGRATIONS = {
    0: _migrate_v0_to_v1,
    1: _migrate_v1_to_v2,
    # When bumping CURRENT_SCHEMA_VERSION, add migration handler here.
}


def _normalize_process_config(config: Any) -> dict:
    """Pure function: migrate process_config dict to CURRENT_SCHEMA_VERSION.

    Handles:
      - None -> returns None (caller decides semantics)
      - empty dict -> returns V1 canonical empty shape
      - legacy dict (no schema_version) -> applies _MIGRATIONS[0] chain
      - current dict -> idempotent, returns copy unchanged

    Raises ProcessConfigSchemaError if a migration gap exists.
    """
    if config is None:
        return None  # type: ignore
    if not isinstance(config, dict):
        return config  # Pydantic will raise on final validation if wrong type
    current = config.get("schema_version", 0)
    iterations = 0
    while current < CURRENT_SCHEMA_VERSION:
        if iterations >= _MAX_MIGRATION_ITERATIONS:
            raise ProcessConfigSchemaError(from_version=current, to_version=CURRENT_SCHEMA_VERSION)
        if current not in _MIGRATIONS:
            raise ProcessConfigSchemaError(from_version=current, to_version=CURRENT_SCHEMA_VERSION)
        migrate_fn = _MIGRATIONS[current]
        config = migrate_fn(config)
        new_version = config.get("schema_version", current + 1)
        if new_version <= current:
            # Pitfall 4: migration function forgot to bump schema_version
            raise ProcessConfigSchemaError(from_version=current, to_version=CURRENT_SCHEMA_VERSION)
        current = new_version
        iterations += 1
    return config


class Project(BaseModel):
    id: Optional[int] = None
    key: str
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    methodology: Methodology  # kept for backward compat; D-42 defers dropping to Phase 10+
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    manager_avatar: Optional[str] = None
    created_at: Optional[datetime] = None
    columns: List[BoardColumn] = []
    custom_fields: Optional[Dict[str, Any]] = None
    process_config: Optional[Dict[str, Any]] = None
    # --- Phase 9 additions ---
    status: ProjectStatus = ProjectStatus.ACTIVE  # BACK-01
    process_template_id: Optional[int] = None  # D-45
    process_template_name: Optional[str] = None  # populated from relationship in repo

    @model_validator(mode="before")
    @classmethod
    def normalize_process_config(cls, values):
        """BACK-03 / D-32: lazy-migrate process_config to current schema_version.

        Runs before field validation. Handles both dict (DTO/API body) and
        SQLAlchemy ORM object (from_attributes mode). Pitfall 5.
        """
        if isinstance(values, dict):
            pc = values.get("process_config")
            if pc is not None:
                values["process_config"] = _normalize_process_config(pc)
            return values
        # Likely a SQLAlchemy ORM model — extract attributes to dict once, normalize pc
        if hasattr(values, "__table__"):
            out: Dict[str, Any] = {}
            for c in values.__table__.columns:
                out[c.name] = getattr(values, c.name)
            # Copy known relationship attrs explicitly (columns, manager_*)
            for attr in ("columns", "manager_name", "manager_avatar"):
                if hasattr(values, attr):
                    out[attr] = getattr(values, attr)
            if out.get("process_config") is not None:
                out["process_config"] = _normalize_process_config(out["process_config"])
            return out
        return values

    model_config = ConfigDict(from_attributes=True)
