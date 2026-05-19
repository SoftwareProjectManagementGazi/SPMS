"""AI Workflow Generator — Application DTOs.

Input/output data contracts between API ↔ Use Case ↔ Port.
Locked decisions: D-03 (bug_extra_verification), D-04 (sector maxLength=80).

Plan reference: .planning/ai-workflow-generator-plan.md §4.2.2
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Methodology — single source of truth (mirrors Frontend2/lib/methodology-matrix.ts)
# ---------------------------------------------------------------------------

Methodology = Literal[
    "SCRUM",
    "KANBAN",
    "WATERFALL",
    "ITERATIVE",
    "INCREMENTAL",
    "EVOLUTIONARY",
    "RAD",
]


# ---------------------------------------------------------------------------
# Lifecycle Form Input
# ---------------------------------------------------------------------------


class LifecycleFormDTO(BaseModel):
    """User-submitted form for lifecycle generation.

    All optional fields convey "user did not specify" — Use Case + Prompt
    Builder use sane defaults so AI still produces meaningful output.
    """

    model_config = ConfigDict(from_attributes=True)

    methodology: Methodology

    # Team
    team_size: int | None = Field(None, ge=1, le=999)
    multi_team: bool = False

    # Duration
    duration_value: int | None = Field(None, ge=1, le=999)
    duration_unit: Literal["week", "month", "year"] | None = None
    open_ended: bool = False  # "Süresiz" — duration_value/unit ignored when True

    # Quality controls (5 toggles per UI)
    quality_code_review: bool = False
    quality_ci: bool = False
    quality_manual_qa: bool = False
    quality_uat: bool = False
    quality_security_audit: bool = False

    # Sector / domain
    sector: str | None = Field(
        None,
        max_length=80,  # D-04
        description="Chip ID (e.g. 'web_saas') or free text up to 80 chars",
    )

    # Deployment
    deployment_model: Literal["saas", "versioned", "mobile"] | None = None

    # Free-form
    additional_context: str = Field(default="", max_length=500)

    @field_validator("sector")
    @classmethod
    def _strip_sector(cls, v: str | None) -> str | None:
        return v.strip() if v else v


# ---------------------------------------------------------------------------
# Task Status Form Input
# ---------------------------------------------------------------------------


class TaskStatusFormDTO(BaseModel):
    """User-submitted form for task status (kanban-style) generation."""

    model_config = ConfigDict(from_attributes=True)

    methodology: Methodology

    target_column_count: int | None = Field(
        None,
        ge=5,
        le=10,
        description="None = AI decides. Per UI prompt, below 5 user is told to use manual.",
    )

    # Stages / gates
    has_code_review: bool = False
    has_qa_column: bool = False
    has_uat: bool = False
    has_security_audit: bool = False

    # D-03: Bug için ayrı doğrulama (multi-type yerine tek toggle)
    bug_extra_verification: bool = False

    # Special states (multi-select)
    special_states: list[str] = Field(
        default_factory=list,
        description="Chip IDs: Blocked, On Hold, Cancelled, Rejected, "
        "Müşteri Onayı Bekliyor, Dış Bağımlılık, Yeniden Açıldı",
    )

    wip_limits_enabled: bool = True

    additional_context: str = Field(default="", max_length=500)


# ---------------------------------------------------------------------------
# Streaming event envelope (API → Frontend)
# ---------------------------------------------------------------------------


class WorkflowEventDTO(BaseModel):
    """Single SSE event sent down the wire.

    Frontend `lib/ai/sse-client.ts` parses these and dispatches based on
    `type` field. Payload shape varies per type but is always a plain dict
    for JSON-serialization simplicity.
    """

    model_config = ConfigDict(from_attributes=True)

    type: Literal[
        "text_token",     # AI chat narration token (small string)
        "node_added",     # Lifecycle node (SuggestedNode shape)
        "edge_added",     # Lifecycle edge (SuggestedEdge shape)
        "column_added",   # Task status column (SuggestedColumn shape)
        "rationale",      # Final "Neden bu workflow?" explanation
        "done",           # Stream complete; summary in payload
        "error",          # Failure; payload.kind in {service_down, rate_limit, invalid}
    ]
    payload: dict
