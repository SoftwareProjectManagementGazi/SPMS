"""Workflow Engine — JSON-driven procedural lifecycle (Q1-Q5 in workflow-engine-design.md).

Pure domain service: ZERO infrastructure imports. Consumers (use cases) instantiate
per-call with the relevant workflow + columns, then call methods.

The engine handles two workflows in one project:
    - `phase_workflow` — coarse SDLC phases (Requirements -> Design -> ...)
    - `task_workflow` — fine-grained kanban columns
Both share the same JSON shape and engine method surface.
"""
from typing import List, Optional, Tuple
from app.domain.entities.board_column import BoardColumn


class WorkflowEngine:
    """State-less engine — instantiate per call with workflow config + columns.

    Args:
        workflow: process_config['phase_workflow'] or process_config['task_workflow'] dict.
            Must contain {capabilities, nodes?, edges, groups?}. May be None / empty.
        columns: ordered list of BoardColumn entities for the project (task_workflow).
            For phase_workflow, pass [] — phase nodes live inside workflow['nodes'].
    """

    def __init__(
        self,
        workflow: Optional[dict],
        columns: Optional[List[BoardColumn]] = None,
    ):
        self._wf = workflow or {}
        self._cols = columns or []
        self._caps = (self._wf.get("capabilities") or {})
        self._edges = self._wf.get("edges") or []
        # Build lookups
        self._cols_by_id = {c.id: c for c in self._cols if c.id is not None}
        self._cols_by_name = {c.name.lower(): c for c in self._cols}

    # ---------- Capability queries ----------

    def cap(self, name: str, default=False):
        """Read a capability flag (enforce_wip_limits, enforce_sequential_dependencies, ...)."""
        return self._caps.get(name, default)

    # ---------- Node / Column queries ----------

    def is_terminal(self, column_or_node) -> bool:
        """True if the given column/node is in a 'done' state.

        Resolution order:
          1. If passed a BoardColumn entity with .is_terminal True -> True.
          2. If passed a BoardColumn entity, look up max(order_index) -> True if matches.
          3. If passed a dict (phase node) with .is_terminal or .is_final -> True.
        """
        if column_or_node is None:
            return False
        # BoardColumn entity path (check BEFORE dict-instance to handle Pydantic models)
        if isinstance(column_or_node, BoardColumn):
            if column_or_node.is_terminal:
                return True
            # Backfill fallback: highest order_index is terminal
            if self._cols:
                max_order = max(c.order_index for c in self._cols)
                return column_or_node.order_index == max_order
            return False
        # Dict path (phase node)
        if isinstance(column_or_node, dict):
            return bool(
                column_or_node.get("is_terminal")
                or column_or_node.get("is_final")
            )
        return False

    def is_initial(self, column_or_node) -> bool:
        """True if the given column/node is the start state."""
        if column_or_node is None:
            return False
        if isinstance(column_or_node, BoardColumn):
            if column_or_node.is_initial:
                return True
            if self._cols:
                min_order = min(c.order_index for c in self._cols)
                return column_or_node.order_index == min_order
            return False
        if isinstance(column_or_node, dict):
            return bool(column_or_node.get("is_initial"))
        return False

    def get_terminal_columns(self) -> List[BoardColumn]:
        """All terminal columns in the project (1 or more, depending on workflow)."""
        return [c for c in self._cols if self.is_terminal(c)]

    def get_initial_columns(self) -> List[BoardColumn]:
        return [c for c in self._cols if self.is_initial(c)]

    # ---------- Transition queries ----------

    def can_move(self, from_id, to_id) -> Tuple[bool, Optional[str]]:
        """Check if a transition from from_id -> to_id is allowed.

        Returns (allowed, reason_if_not).

        Allowance rules:
          - Direct edge exists: source=from_id, target=to_id  -> allowed
          - bidirectional edge: target=from_id, source=to_id, bidirectional=True -> allowed
          - is_all_gate edge: target=to_id, is_all_gate=True -> allowed from any source
          - is_any_gate edge: source=from_id, is_any_gate=True -> allowed to any target
          - If exit_policy of from_node is 'any' -> allowed (bypass edge check)
          - Otherwise denied
        """
        if from_id == to_id:
            return True, None  # no-op move always allowed

        # Resolve from_node exit_policy
        from_node = self._lookup(from_id)
        if from_node is not None:
            exit_pol = self._policy(from_node, "exit_policy", default="any")
            if exit_pol == "any":
                return True, None
            if exit_pol == "terminal_lock" and self.is_terminal(from_node):
                return False, f"Source node {from_id} is terminal and exit_policy=terminal_lock"

        # Direct edge
        if any(self._edge_match(e, from_id, to_id) for e in self._edges):
            return True, None
        # Bidirectional reverse
        if any(
            self._edge_match(e, to_id, from_id) and e.get("bidirectional")
            for e in self._edges
        ):
            return True, None
        # is_all_gate
        if any(
            e.get("is_all_gate") and self._edge_target(e) == to_id
            for e in self._edges
        ):
            return True, None
        # is_any_gate
        if any(
            e.get("is_any_gate") and self._edge_source(e) == from_id
            for e in self._edges
        ):
            return True, None

        return False, f"No edge connects {from_id} -> {to_id}"

    # ---------- WIP enforcement ----------

    def check_wip(self, column: BoardColumn, current_count: int) -> Tuple[bool, Optional[str]]:
        """Returns (allowed, reason).

        Allowed if:
          - capability `enforce_wip_limits` is False (engine disabled), OR
          - column.wip_limit is 0 / None (no limit), OR
          - current_count < column.wip_limit
        """
        if not self.cap("enforce_wip_limits"):
            return True, None
        limit = column.wip_limit or 0
        if limit <= 0:
            return True, None
        if current_count >= limit:
            return False, f"WIP limit {limit} reached for column '{column.name}' ({current_count} tasks)"
        return True, None

    # ---------- Staleness (Q4 — read-time) ----------

    def is_stale(self, column: BoardColumn, last_transition_at, now) -> bool:
        """True if (now - last_transition_at) > column.max_duration_days."""
        if column.max_duration_days is None or column.max_duration_days <= 0:
            return False
        if last_transition_at is None:
            return False
        delta_days = (now - last_transition_at).days
        return delta_days > column.max_duration_days

    # ---------- Private helpers ----------

    def _lookup(self, id_):
        # Try BoardColumn (id is int)
        if isinstance(id_, int):
            return self._cols_by_id.get(id_)
        # Try phase_workflow nodes (id is str)
        if isinstance(id_, str):
            for n in (self._wf.get("nodes") or []):
                if n.get("id") == id_:
                    return n
        return None

    @staticmethod
    def _policy(node_or_col, key, default):
        # Pydantic BaseModel: hasattr returns True; dict: use .get
        if isinstance(node_or_col, dict):
            return node_or_col.get(key, default)
        if hasattr(node_or_col, key):
            return getattr(node_or_col, key)
        return default

    @staticmethod
    def _edge_match(edge: dict, from_id, to_id) -> bool:
        return (
            WorkflowEngine._edge_source(edge) == from_id
            and WorkflowEngine._edge_target(edge) == to_id
        )

    @staticmethod
    def _edge_source(edge: dict):
        # Phase 12 edges use 'source', some use 'from' (V2 design)
        return edge.get("source") or edge.get("from")

    @staticmethod
    def _edge_target(edge: dict):
        return edge.get("target") or edge.get("to")
