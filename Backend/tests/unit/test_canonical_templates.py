"""Kanonik 9 SDLC şablonu — içerik doğruluğu + illüstrasyon geometrisi.

Her şablonun grafı WorkflowConfig doğrulamasından geçmeli VE kanvas yerleşimi
modelin ders-kitabı çizimini yansıtmalı (V-Modeli gerçekten V, şelale merdiven,
spiral içten dışa, döngülü modellerde geri besleme kenarı, artırımlı modelde
kayan satırlar). Geometri assert'leri layout'u sessizce bozan değişiklikleri
yakalar.
"""
from __future__ import annotations

import pytest

from app.application.dtos.workflow_dtos import WorkflowConfig
from app.domain.entities.task import NODE_ID_REGEX
from app.infrastructure.database._template_workflows import (
    CANONICAL_TEMPLATE_NAMES,
    CANONICAL_TEMPLATES,
    OBSOLETE_TEMPLATE_NAMES,
    OBSOLETE_TEMPLATE_REMAP,
)

BY_NAME = {t["name"]: t for t in CANONICAL_TEMPLATES}


def _nodes(name: str) -> dict[str, dict]:
    return {n["id"]: n for n in BY_NAME[name]["default_workflow"]["nodes"]}


def _edges(name: str) -> list[dict]:
    return BY_NAME[name]["default_workflow"]["edges"]


# ──────────────────────────── küme + şema ────────────────────────────

def test_exactly_nine_canonical_templates():
    expected = {
        "Scrum", "Kanban", "Waterfall", "V-Modeli", "Spiral Model",
        "Yinelemeli Model", "Artırımlı Model", "Prototipleme Modeli",
        "RAD (Hızlı Uygulama Geliştirme)",
    }
    assert set(CANONICAL_TEMPLATE_NAMES) == expected
    assert len(CANONICAL_TEMPLATES) == 9


def test_obsolete_remap_targets_are_canonical():
    for old, new in OBSOLETE_TEMPLATE_REMAP.items():
        assert new in CANONICAL_TEMPLATE_NAMES, f"{old} → {new} kanonik değil"
        assert old not in CANONICAL_TEMPLATE_NAMES
    assert len(OBSOLETE_TEMPLATE_NAMES) == 9


@pytest.mark.parametrize("tpl", CANONICAL_TEMPLATES, ids=lambda t: t["name"])
def test_every_workflow_passes_pydantic_validation(tpl):
    """D-22 id regex + D-55 kuralları + D-19 initial/final — hepsi geçmeli."""
    config = WorkflowConfig(**tpl["default_workflow"])
    assert len(config.nodes) == len(tpl["default_workflow"]["nodes"])


@pytest.mark.parametrize("tpl", CANONICAL_TEMPLATES, ids=lambda t: t["name"])
def test_node_ids_unique_and_d22_compliant(tpl):
    ids = [n["id"] for n in tpl["default_workflow"]["nodes"]]
    assert len(ids) == len(set(ids))
    for nid in ids:
        assert NODE_ID_REGEX.match(nid), nid


@pytest.mark.parametrize("tpl", CANONICAL_TEMPLATES, ids=lambda t: t["name"])
def test_groups_reference_existing_nodes(tpl):
    node_ids = {n["id"] for n in tpl["default_workflow"]["nodes"]}
    for g in tpl["default_workflow"].get("groups", []):
        for child in g["children"]:
            assert child in node_ids, f"{tpl['name']}: grup {g['id']} ölü çocuk {child}"


@pytest.mark.parametrize("tpl", CANONICAL_TEMPLATES, ids=lambda t: t["name"])
def test_no_overlapping_node_positions(tpl):
    """Aynı noktaya iki node koymak illüstrasyonu bozar — asgari ayrım iste."""
    seen: list[tuple[float, float]] = []
    for n in tpl["default_workflow"]["nodes"]:
        for (px, py) in seen:
            assert abs(n["x"] - px) >= 60 or abs(n["y"] - py) >= 50, (
                f"{tpl['name']}: {n['id']} başka bir node'la çakışıyor"
            )
        seen.append((n["x"], n["y"]))


# ──────────────────────────── geometri: şekiller ────────────────────────────

def test_waterfall_is_a_descending_staircase():
    order = ["nd_wfreq00001", "nd_wfdes00002", "nd_wfimp00003",
             "nd_wftst00004", "nd_wfdep00005", "nd_wfmnt00006"]
    nodes = _nodes("Waterfall")
    for a, b in zip(order, order[1:]):
        assert nodes[b]["x"] > nodes[a]["x"], "şelale sağa akmalı"
        assert nodes[b]["y"] > nodes[a]["y"], "şelale aşağı düşmeli (merdiven)"


def test_vmodel_is_an_actual_v_shape():
    nodes = _nodes("V-Modeli")
    left = ["nd_vmreqs0001", "nd_vmsdes0002", "nd_vmarch0003", "nd_vmmodd0004"]
    bottom = "nd_vmcode0005"
    right = ["nd_vmunit0006", "nd_vmintg0007", "nd_vmsyst0008", "nd_vmacpt0009"]

    # Sol kol iner (x artar, y artar) ve dibe bağlanır.
    for a, b in zip(left, left[1:]):
        assert nodes[b]["x"] > nodes[a]["x"] and nodes[b]["y"] > nodes[a]["y"]
    assert nodes[bottom]["y"] > nodes[left[-1]]["y"]

    # Sağ kol çıkar (x artar, y azalır).
    chain = [bottom] + right
    for a, b in zip(chain, chain[1:]):
        assert nodes[b]["x"] > nodes[a]["x"] and nodes[b]["y"] < nodes[a]["y"]

    # Dip, grafın en alt noktası; iki uç aynı yükseklikte (simetrik V).
    assert nodes[bottom]["y"] == max(n["y"] for n in nodes.values())
    assert nodes[left[0]]["y"] == nodes[right[-1]]["y"]

    # Doğrulama köprüleri karşılıklı fazları YATAY eşler (aynı y).
    for src, tgt in [
        ("nd_vmreqs0001", "nd_vmacpt0009"),
        ("nd_vmsdes0002", "nd_vmsyst0008"),
        ("nd_vmarch0003", "nd_vmintg0007"),
        ("nd_vmmodd0004", "nd_vmunit0006"),
    ]:
        assert nodes[src]["y"] == nodes[tgt]["y"], f"{src}↔{tgt} köprüsü yatay değil"
        kinds = {e["type"] for e in _edges("V-Modeli")
                 if {e["source"], e["target"]} == {src, tgt}}
        assert "verification" in kinds


def test_spiral_rings_grow_outward():
    """Her tur bir öncekini ÇEVRELEMELİ (içten dışa sarmal)."""
    nodes = _nodes("Spiral Model")
    rings = [
        ["nd_sp1pln0001", "nd_sp1rsk0002", "nd_sp1eng0003", "nd_sp1eva0004"],
        ["nd_sp2pln0005", "nd_sp2rsk0006", "nd_sp2eng0007", "nd_sp2eva0008"],
        ["nd_sp3pln0009", "nd_sp3rsk0012", "nd_sp3eng0010", "nd_sp3eva0011"],
    ]
    boxes = []
    for ring in rings:
        xs = [nodes[n]["x"] for n in ring]
        ys = [nodes[n]["y"] for n in ring]
        boxes.append((min(xs), min(ys), max(xs), max(ys)))
    for inner, outer in zip(boxes, boxes[1:]):
        assert outer[0] < inner[0] and outer[1] < inner[1], "dış tur solda/üstte taşmalı"
        assert outer[2] > inner[2] and outer[3] > inner[3], "dış tur sağda/altta taşmalı"
    # Her turda risk → planlama geri beslemesi (Boehm kadran dönüşü).
    fb = [e for e in _edges("Spiral Model") if e["type"] == "feedback"]
    assert len(fb) == 3


def _loop_geometry(name: str, loop_group_id: str, feedback_pairs: list[tuple[str, str]]):
    nodes = _nodes(name)
    groups = {g["id"]: g for g in BY_NAME[name]["default_workflow"]["groups"]}
    loop = groups[loop_group_id]["children"]
    ys = [nodes[n]["y"] for n in loop]
    xs = [nodes[n]["x"] for n in loop]
    mid_y = (min(ys) + max(ys)) / 2
    # Çember hissi: döngü node'ları hem üst hem alt yarıya dağılmalı ve
    # yatayda tek kolona yığılmamalı.
    assert any(y < mid_y for y in ys) and any(y > mid_y for y in ys)
    assert max(xs) - min(xs) >= 300
    for src, tgt in feedback_pairs:
        assert any(
            e["source"] == src and e["target"] == tgt and e["type"] == "feedback"
            for e in _edges(name)
        ), f"{name}: {src}→{tgt} feedback kenarı yok"


def test_scrum_is_a_sprint_loop():
    _loop_geometry(
        "Scrum", "gr_scsprnt",
        [("nd_scretr0006", "nd_scplan0002"), ("nd_scdaly0004", "nd_scdev00003")],
    )
    nodes = _nodes("Scrum")
    # Backlog soldan girer, Artırım sağdan çıkar.
    assert nodes["nd_scbklg0001"]["x"] == min(n["x"] for n in nodes.values())
    assert nodes["nd_scincr0007"]["x"] == max(n["x"] for n in nodes.values())


def test_iterative_is_a_cycle_with_exit():
    _loop_geometry(
        "Yinelemeli Model", "gr_itloop1",
        [("nd_itevl00006", "nd_itpln00002")],
    )
    nodes = _nodes("Yinelemeli Model")
    assert nodes["nd_itdep00007"]["x"] == max(n["x"] for n in nodes.values())


def test_incremental_rows_shift_down_and_right():
    nodes = _nodes("Artırımlı Model")
    rows = [
        ["nd_in1des0002", "nd_in1dev0003", "nd_in1tst0004", "nd_in1del0005"],
        ["nd_in2des0006", "nd_in2dev0007", "nd_in2tst0008", "nd_in2del0009"],
        ["nd_in3des0010", "nd_in3dev0011", "nd_in3tst0012", "nd_in3del0013"],
    ]
    for row in rows:
        ys = {nodes[n]["y"] for n in row}
        assert len(ys) == 1, "her artırım kendi yatay satırında olmalı"
        xs = [nodes[n]["x"] for n in row]
        assert xs == sorted(xs), "mini-şelale soldan sağa akmalı"
    # Satırlar aşağı ve sağa kayar (ürünün artarak büyüdüğü illüstrasyonu).
    for prev, nxt in zip(rows, rows[1:]):
        assert nodes[nxt[0]]["y"] > nodes[prev[0]]["y"]
        assert nodes[nxt[0]]["x"] > nodes[prev[0]]["x"]
    # Teslimler bir sonraki artırımın tasarımına akar.
    for src, tgt in [("nd_in1del0005", "nd_in2des0006"), ("nd_in2del0009", "nd_in3des0010")]:
        assert any(e["source"] == src and e["target"] == tgt for e in _edges("Artırımlı Model"))


def test_prototype_has_design_build_evaluate_loop():
    edges = _edges("Prototipleme Modeli")
    assert any(
        e["source"] == "nd_pteva00004" and e["target"] == "nd_ptdsg00002"
        and e["type"] == "feedback"
        for e in edges
    )
    # Onay çıkışı döngüden ürün hattına gider.
    assert any(
        e["source"] == "nd_pteva00004" and e["target"] == "nd_ptimp00005"
        and e["type"] == "flow"
        for e in edges
    )


def test_rad_has_user_design_construction_loop():
    edges = _edges("RAD (Hızlı Uygulama Geliştirme)")
    assert any(
        e["source"] == "nd_radcon0001" and e["target"] == "nd_raduds0001"
        and e["type"] == "feedback"
        for e in edges
    )
    # Self-loop kalıntısı olmamalı.
    assert all(e["source"] != e["target"] for e in edges)


def test_kanban_is_single_continuous_node():
    wf = BY_NAME["Kanban"]["default_workflow"]
    assert wf["mode"] == "continuous"
    assert len(wf["nodes"]) == 1
    n = wf["nodes"][0]
    assert n["is_initial"] is True and n["is_final"] is True
