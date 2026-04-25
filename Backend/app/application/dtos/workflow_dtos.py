"""API-10 / D-54, D-55: WorkflowConfig Pydantic nested validation."""
from collections import defaultdict, deque
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.domain.entities.task import NODE_ID_REGEX  # WARNING-2 fix: single source of truth for D-22 (regex defined in 09-04)


class WorkflowNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    color: str
    # Phase 12 Plan 12-10 (Bug Y UAT fix) — extend WorkflowNode to round-trip
    # the FE-side fields the editor was already sending. Pre-fix Pydantic v2
    # `extra="ignore"` (BaseModel default) silently dropped these keys at
    # PATCH time, so a user editing description / isInitial / isFinal /
    # parentId / wipLimit, hitting Save, then reloading saw the fields
    # disappear. The new fields are all Optional with safe defaults so
    # legacy JSONB rows (no new keys) still parse — Pitfall 9: additive
    # Pydantic only, no schema-version bump required.
    description: Optional[str] = None
    is_initial: bool = False  # D-31
    is_final: bool = False    # D-31
    is_archived: bool = False
    parent_id: Optional[str] = None  # D-24 (group child relation)
    wip_limit: Optional[int] = Field(default=None, ge=0)  # Plan 12-08 SelectionPanel

    @field_validator("id")
    @classmethod
    def validate_id_format(cls, v):
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid node ID format: {v!r}")
        return v

    @field_validator("parent_id")
    @classmethod
    def validate_parent_id_format(cls, v):
        # parent_id targets a Group id (gr_*), not another node id, so the
        # node-id regex does NOT apply here. We only enforce that the value
        # is a non-empty string when present so the caller can correlate it
        # with WorkflowGroup.id at the application layer.
        if v is not None and not isinstance(v, str):
            raise ValueError(f"parent_id must be a string, got {type(v).__name__}")
        if v is not None and not v:
            raise ValueError("parent_id must be non-empty when provided")
        return v


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["flow", "verification", "feedback"] = "flow"
    label: Optional[str] = None
    # Phase 12 D-16 — pair-wise reverse transition allowed (NOT transitive).
    # Pre-existing JSONB edges read with default False (Pitfall 9 / SPEC line 22 +
    # line 163 — additive Pydantic only, no schema-version bump).
    bidirectional: bool = False
    # Phase 12 D-17 — Jira-style source-agnostic gate. When True, ANY non-archived
    # source node may transition to this edge's target.
    is_all_gate: bool = False


class WorkflowGroup(BaseModel):
    """Phase 12 Plan 12-10 (Bug Y UAT fix) — align backend group shape with
    the FE-side `WorkflowGroup` (Frontend2/services/lifecycle-service.ts).

    Pre-fix the backend required `x/y/width/height` geometry on the group,
    but the FE never persists those — group bounds are recomputed at render
    time from the children's positions via `computeHull` (cloud-hull.ts).
    The persisted shape carries only `{id, name, color, children}` plus an
    optional bag of geometry hints for backwards compatibility with any
    pre-Phase-12 rows that already wrote x/y/width/height.

    Additive — pre-existing JSONB rows with `x/y/width/height` continue
    to parse via Pydantic v2's `extra="ignore"` (default).
    """

    id: str
    name: str
    color: Optional[str] = None
    children: List[str] = Field(default_factory=list)
    # Optional legacy geometry fields — accepted but ignored (kept Optional
    # so pre-Phase-12 rows that wrote them still parse without failing the
    # check_bounds invariant which we no longer enforce).
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class WorkflowConfig(BaseModel):
    mode: Literal["flexible", "sequential-locked", "continuous", "sequential-flexible"]
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    groups: List[WorkflowGroup] = []

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="after")
    def validate_business_rules(self):
        # D-55 rule 1: node IDs unique
        ids = [n.id for n in self.nodes]
        if len(ids) != len(set(ids)):
            raise ValueError("Node IDs must be unique within workflow")

        # D-55 rule 2: edge source/target must reference non-archived nodes
        active = {n.id for n in self.nodes if not n.is_archived}
        for e in self.edges:
            if e.source not in active:
                raise ValueError(
                    f"Edge {e.id}: source '{e.source}' references non-existent or archived node"
                )
            if e.target not in active:
                raise ValueError(
                    f"Edge {e.id}: target '{e.target}' references non-existent or archived node"
                )

        # D-55 rule 3: sequential-flexible mode — flow edges must not form cycles
        if self.mode == "sequential-flexible":
            flow_edges = [e for e in self.edges if e.type == "flow"]
            if _has_cycle(active, flow_edges):
                raise ValueError(
                    "Flow edges form a cycle in sequential-flexible mode (feedback edges are exempt)"
                )

        # Phase 12 Plan 12-10 (Bug Y UAT fix) — D-19 rule 4: a non-empty
        # workflow MUST have at least one initial node AND at least one
        # final node. Pre-fix the FE validator (validateWorkflow) enforced
        # this but the backend Pydantic did not, letting bad payloads land
        # in the DB and then fail downstream when execute_phase_transition
        # tried to bootstrap a phase.
        if self.nodes:
            initial_count = sum(1 for n in self.nodes if n.is_initial)
            final_count = sum(1 for n in self.nodes if n.is_final)
            if initial_count < 1:
                raise ValueError(
                    "Workflow must have at least one node with is_initial=True (D-19 rule 4)"
                )
            if final_count < 1:
                raise ValueError(
                    "Workflow must have at least one node with is_final=True (D-19 rule 4)"
                )

        return self


def _has_cycle(node_ids: set, edges: list) -> bool:
    """Kahn's topological sort; returns True if a cycle exists among input edges."""
    in_degree: dict = defaultdict(int)
    adj: dict = defaultdict(list)
    for e in edges:
        adj[e.source].append(e.target)
        in_degree[e.target] += 1
    queue = deque([n for n in node_ids if in_degree[n] == 0])
    processed = 0
    while queue:
        n = queue.popleft()
        processed += 1
        for m in adj[n]:
            in_degree[m] -= 1
            if in_degree[m] == 0:
                queue.append(m)
    return processed != len(node_ids)
