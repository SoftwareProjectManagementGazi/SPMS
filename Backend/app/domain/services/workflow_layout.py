"""Workflow layout engine — pure domain service.

AI koordinat üretmez; şekli layout_archetype seçer, koordinatı bu modül basar.
Geometri sabitleri kanonik şablonlardan türetildi (_template_workflows.py).
"""

import math

from app.domain.entities.ai_workflow_suggestion import (
    SuggestedEdge,
    SuggestedNode,
    WorkflowSuggestion,
)


def apply_layout(suggestion: WorkflowSuggestion) -> None:
    """Assign x/y to every node in place, following the chosen archetype."""
    nodes = _flow_order(suggestion.nodes, suggestion.edges)
    if not nodes:
        return

    layout_fn = {
        "PIPELINE": _layout_pipeline,
        "WATERFALL": _layout_waterfall,
        "V_MODEL": _layout_v_model,
        "SPIRAL": _layout_spiral,
        "CYCLE": _layout_cycle,
        "INCREMENTAL_ROWS": _layout_incremental_rows,
        "PROTOTYPE_LOOP": _layout_prototype_loop,
        "PARALLEL_BRANCH": _layout_layered,
        "FREEFORM": _layout_layered,
    }.get(suggestion.layout_archetype, _layout_layered)

    layout_fn(nodes, suggestion.edges)
    _resolve_collisions(nodes)


def _flow_order(
    nodes: list[SuggestedNode], edges: list[SuggestedEdge]
) -> list[SuggestedNode]:
    """Stable Kahn topo-sort on flow edges; emission order breaks ties."""
    index = {n.id: i for i, n in enumerate(nodes)}
    incoming: dict[str, int] = {n.id: 0 for n in nodes}
    outgoing: dict[str, list[str]] = {n.id: [] for n in nodes}
    for e in edges:
        if e.edge_type != "flow":
            continue
        if e.source_id in outgoing and e.target_id in incoming:
            outgoing[e.source_id].append(e.target_id)
            incoming[e.target_id] += 1

    ready = sorted([nid for nid, deg in incoming.items() if deg == 0], key=index.get)
    ordered: list[str] = []
    while ready:
        current = ready.pop(0)
        ordered.append(current)
        for t in sorted(outgoing[current], key=index.get):
            incoming[t] -= 1
            if incoming[t] == 0:
                ready.append(t)
        ready.sort(key=index.get)

    # Flow döngüsü varsa kalanları emisyon sırasıyla ekle (topo tamamlanamaz)
    if len(ordered) < len(nodes):
        seen = set(ordered)
        ordered.extend(n.id for n in nodes if n.id not in seen)

    by_id = {n.id: n for n in nodes}
    return [by_id[nid] for nid in ordered]


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------


def _layout_pipeline(nodes: list[SuggestedNode], _edges: list[SuggestedEdge]) -> None:
    for i, n in enumerate(nodes):
        n.x, n.y = 60 + 260 * i, 200


def _layout_waterfall(nodes: list[SuggestedNode], _edges: list[SuggestedEdge]) -> None:
    n_count = len(nodes)
    dy = 110 if n_count <= 7 else max(60, 660 // max(1, n_count - 1))
    for i, n in enumerate(nodes):
        n.x, n.y = 60 + 230 * i, 40 + dy * i


def _layout_v_model(nodes: list[SuggestedNode], edges: list[SuggestedEdge]) -> None:
    n_count = len(nodes)
    if n_count < 5:
        _layout_waterfall(nodes, edges)
        return
    left = (n_count - 1) // 2
    for i in range(left):
        nodes[i].x, nodes[i].y = 60 + 160 * i, 60 + 130 * i
    apex = nodes[left]
    apex.x, apex.y = 60 + 160 * left, 60 + 130 * (left - 1) + 80
    base_y = 60 + 130 * (left - 1)
    for j, n in enumerate(nodes[left + 1:], start=1):
        n.x, n.y = apex.x + 160 * j, max(60, base_y - 130 * (j - 1))


def _layout_spiral(nodes: list[SuggestedNode], _edges: list[SuggestedEdge]) -> None:
    cx, cy = 620, 330
    # Tur sayısı tam + 1 artıyorsa son node sarmaldan çıkış (teslimat)
    has_exit = len(nodes) % 4 == 1 and len(nodes) > 4
    body = nodes[:-1] if has_exit else nodes
    turns = max(1, math.ceil(len(body) / 4))
    for i, n in enumerate(body):
        t, q = divmod(i, 4)
        hw, hh = 130 + 150 * t, 80 + 110 * t
        corners = [(cx - hw, cy - hh), (cx + hw, cy - hh), (cx + hw, cy + hh), (cx - hw, cy + hh)]
        n.x, n.y = corners[q]
    if has_exit:
        nodes[-1].x, nodes[-1].y = cx + (130 + 150 * (turns - 1)) + 200, cy


def _layout_cycle(nodes: list[SuggestedNode], edges: list[SuggestedEdge]) -> None:
    if len(nodes) < 4:
        _layout_pipeline(nodes, edges)
        return
    cx, cy, rx, ry = 620, 300, 280, 220
    nodes[0].x, nodes[0].y = 60, cy
    nodes[-1].x, nodes[-1].y = cx + rx + 280, cy
    middle = nodes[1:-1]
    m = len(middle)
    for i, n in enumerate(middle):
        angle = math.radians(150 - i * (300 / (m - 1))) if m > 1 else math.radians(90)
        n.x = round(cx + rx * math.cos(angle))
        n.y = round(cy - ry * math.sin(angle))


def _layout_incremental_rows(nodes: list[SuggestedNode], _edges: list[SuggestedEdge]) -> None:
    nodes[0].x, nodes[0].y = 60, 80
    rest = nodes[1:]
    for i, n in enumerate(rest):
        r, j = divmod(i, 4)
        n.x, n.y = 300 + 60 * r + 220 * j, 80 + 160 * r


def _layout_prototype_loop(nodes: list[SuggestedNode], edges: list[SuggestedEdge]) -> None:
    if len(nodes) < 5:
        _layout_pipeline(nodes, edges)
        return
    coords = [(60, 190), (330, 90), (610, 90), (610, 310)]
    for n, (x, y) in zip(nodes[:4], coords):
        n.x, n.y = x, y
    for k, n in enumerate(nodes[4:]):
        n.x, n.y = 890 + 260 * k, 190


def _layout_layered(nodes: list[SuggestedNode], edges: list[SuggestedEdge]) -> None:
    """BFS seviyeleri: paralel kollar aynı sütunda dikine açılır."""
    incoming: dict[str, list[str]] = {n.id: [] for n in nodes}
    for e in edges:
        if e.edge_type == "flow" and e.target_id in incoming and e.source_id in incoming:
            incoming[e.target_id].append(e.source_id)

    level: dict[str, int] = {n.id: 0 for n in nodes if not incoming[n.id]}
    queue = list(level.keys())
    while queue:
        current = queue.pop(0)
        for e in edges:
            if e.edge_type != "flow" or e.source_id != current:
                continue
            new_level = level[current] + 1
            if e.target_id in incoming and level.get(e.target_id, -1) < new_level:
                level[e.target_id] = new_level
                queue.append(e.target_id)

    by_level: dict[int, list[SuggestedNode]] = {}
    for n in nodes:
        by_level.setdefault(level.get(n.id, 0), []).append(n)

    for lvl, group in by_level.items():
        spread = 220 if len(group) > 1 else 0
        top = 200 - spread * (len(group) - 1) // 2
        for idx, n in enumerate(group):
            n.x, n.y = 60 + 250 * lvl, top + spread * idx


def _resolve_collisions(nodes: list[SuggestedNode]) -> None:
    seen: set[tuple[int, int]] = set()
    for n in nodes:
        while (n.x, n.y) in seen:
            n.y += 50
        seen.add((n.x, n.y))
