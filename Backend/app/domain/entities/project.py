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
CURRENT_SCHEMA_VERSION = 1
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
    new.setdefault("enforce_sequential_dependencies", False)
    new.setdefault("enforce_wip_limits", False)
    new.setdefault("restrict_expired_sprints", False)
    new["schema_version"] = 1
    return new


_MIGRATIONS = {
    0: _migrate_v0_to_v1,
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
