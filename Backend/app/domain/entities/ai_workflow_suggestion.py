"""AI Workflow Generator — Domain entities (v3.0).

Pure Pydantic models. Zero framework dependencies. Both the Gemini adapter
and the Mock adapter produce instances of these entities; both Lifecycle
and Task Status variants share the same provider port.

Plan reference: .planning/ai-workflow-generator-plan.md §4.1.1
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


# AI metodolojiye kilitlenmez: methodology_label serbest metin (hibrit olabilir),
# layout_archetype ise çizim şeklini seçer — layout motoru bu enum'a bağlı.
LayoutArchetype = Literal[
    "WATERFALL",          # sağa-aşağı merdiven
    "V_MODEL",            # inen kol + dipte kodlama + çıkan kol
    "SPIRAL",             # içten dışa dikdörtgen sarmal
    "CYCLE",              # giriş → döngü çemberi → çıkış (Scrum/Iterative)
    "INCREMENTAL_ROWS",   # kayan artırım satırları
    "PROTOTYPE_LOOP",     # tasarla-yap-değerlendir dörtgeni + çıkış hattı
    "PARALLEL_BRANCH",    # fork eden paralel kollar (RAD)
    "PIPELINE",           # düz yatay akış (Kanban)
    "FREEFORM",           # hiçbiri uymazsa BFS katmanlı yerleşim
]


# ---------------------------------------------------------------------------
# Lifecycle variant — phase-based workflow (Gereksinim → Tasarım → Test → ...)
# ---------------------------------------------------------------------------


class SuggestedNode(BaseModel):
    """Single phase node in a lifecycle suggestion.

    Coordinates are emitted by the adapter (methodology-aware layout) — e.g.
    V-Model returns a V-shape, RAD returns parallel branches. Frontend renders
    nodes at these exact positions instead of re-layouting client-side, which
    avoids React Flow's auto-fit jitter as nodes stream in.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Stable id, e.g. 'nd_aiplan001'")
    label: str = Field(..., description="Türkçe phase name, e.g. 'Gereksinim Analizi'")
    description: str = Field(..., description="One-sentence Türkçe explanation")
    color: Literal[
        "status-todo",
        "status-progress",
        "status-review",
        "status-done",
        "status-blocked",
    ] = "status-todo"
    x: int = Field(default=0, description="Layout X (adapter-decided)")
    y: int = Field(default=0, description="Layout Y (adapter-decided)")


class SuggestedEdge(BaseModel):
    """Edge between two nodes."""

    model_config = ConfigDict(from_attributes=True)

    source_id: str
    target_id: str
    edge_type: Literal["flow", "verification", "feedback"]
    bidirectional: bool = False
    is_all_gate: bool = False
    label: str | None = None  # short edge annotation, optional


class WorkflowSuggestion(BaseModel):
    """Complete lifecycle workflow suggestion (v3.0 schema v1)."""

    model_config = ConfigDict(from_attributes=True)

    methodology_label: str = Field(..., description="Kısa Türkçe süreç adı; hibrit olabilir")
    layout_archetype: LayoutArchetype = "FREEFORM"
    nodes: list[SuggestedNode]
    edges: list[SuggestedEdge]
    rationale: str = Field(
        ..., description="2-3 cümle Türkçe — 'Neden bu workflow?' açıklaması"
    )


# ---------------------------------------------------------------------------
# Task Status variant — column-based kanban workflow
# ---------------------------------------------------------------------------


class SuggestedColumn(BaseModel):
    """Single column in a task status workflow."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str  # "Sprint Backlog", "Devam Ediyor"
    description: str
    color: Literal[
        "status-todo",
        "status-progress",
        "status-review",
        "status-done",
        "status-blocked",
    ] = "status-todo"
    wip_limit: int | None = None  # None = unlimited (e.g. backlog, done)
    is_initial: bool = False
    is_final: bool = False
    is_special: bool = False  # Blocked, Cancelled, Dış Bağımlılık etc.


class TaskStatusSuggestion(BaseModel):
    """Complete task status workflow suggestion."""

    model_config = ConfigDict(from_attributes=True)

    methodology_label: str
    columns: list[SuggestedColumn]
    rationale: str
