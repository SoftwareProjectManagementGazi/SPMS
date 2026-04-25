"""API-10 / D-54, D-55: WorkflowConfig Pydantic nested validation."""
from collections import defaultdict, deque
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from app.domain.entities.task import NODE_ID_REGEX  # WARNING-2 fix: single source of truth for D-22 (regex defined in 09-04)


class WorkflowNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    color: str
    is_archived: bool = False

    @field_validator("id")
    @classmethod
    def validate_id_format(cls, v):
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid node ID format: {v!r}")
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
    id: str
    name: str
    x: float
    y: float
    width: float
    height: float
    color: str

    @model_validator(mode="after")
    def check_bounds(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError("Group width and height must be > 0")
        if self.x < 0 or self.y < 0:
            raise ValueError("Group x and y must be >= 0")
        return self


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
