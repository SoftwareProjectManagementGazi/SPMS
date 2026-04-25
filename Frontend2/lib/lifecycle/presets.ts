// Pure preset workflow definitions (Phase 12 Plan 12-10).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumers live in
// Frontend2/components/workflow-editor/preset-menu.tsx and
// Frontend2/components/workflow-editor/editor-page.tsx.
//
// Ships 9 preset workflows for "Şablon Yükle" (EDIT-07 + visual parity with
// New_Frontend/src/data.jsx DEFAULT_LIFECYCLES + EXTRA_LIFECYCLES):
//   1. scrum         — flexible Scrum lifecycle (5 phases)
//   2. waterfall     — sequential-locked classic waterfall (6 phases)
//   3. kanban        — continuous single-flow Kanban
//   4. iterative     — flexible cyclic iteration (4 phases)
//   5. vmodel        — flexible 7-phase V-Model with verification edges
//   6. spiral        — flexible 4-phase spiral with feedback edge
//   7. incremental   — NEW (EDIT-07) — 5 phases with feedback loop
//   8. evolutionary  — NEW (EDIT-07) — 5 phases prototype evolution
//   9. rad           — NEW (EDIT-07) — Rapid Application Development parallel
//
// Every preset MUST satisfy validateWorkflow() with zero errors. The unit
// suite Frontend2/lib/lifecycle/presets.test.ts iterates the table and
// asserts errors === [] for each id.

import type { WorkflowConfig } from "@/services/lifecycle-service"

export type PresetId =
  | "scrum"
  | "waterfall"
  | "kanban"
  | "iterative"
  | "vmodel"
  | "spiral"
  | "incremental"
  | "evolutionary"
  | "rad"

// Phase 12 Plan 12-10 (Bug X UAT fix) — every node id MUST satisfy the D-22
// regex `^nd_[A-Za-z0-9_-]{10}$` (defined in Backend/app/domain/entities/task.py
// and re-imported by Backend/app/application/dtos/workflow_dtos.py
// WorkflowNode.validate_id_format). Pre-fix the presets shipped `n1`/`n6`/etc.
// which fail the regex; once a user clicked "Şablon Yükle" + Save, the PATCH
// would 422 on backend WorkflowConfig validation. The deterministic readable
// suffixes below mirror the seeder's `_DEFAULT_WORKFLOW_*` IDs so a user
// switching between seeded data and "Şablon Yükle" sees the same node
// identities for matching methodology pairs (no churn on apply).

// ----------------------------------------------------------------------------
// 1. Scrum (port from DEFAULT_LIFECYCLES.scrum, 5-phase flexible)
// ----------------------------------------------------------------------------
const SCRUM: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_scinit0001", name: "Başlatma", description: "Vizyon ve hedefler", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_scplan0002", name: "Planlama", description: "Backlog ve sprint planning", x: 280, y: 120, color: "status-todo" },
    { id: "nd_scexec0003", name: "Yürütme", description: "Sprint'ler", x: 500, y: 120, color: "status-progress" },
    { id: "nd_scmoni0004", name: "İzleme", description: "Metrikler ve retro", x: 720, y: 120, color: "status-review" },
    { id: "nd_sccls00005", name: "Kapanış", description: "Teslim ve ders", x: 940, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_scinit0001", target: "nd_scplan0002", type: "flow" },
    { id: "e2", source: "nd_scplan0002", target: "nd_scexec0003", type: "flow" },
    { id: "e3", source: "nd_scexec0003", target: "nd_scmoni0004", type: "flow" },
    { id: "e4", source: "nd_scmoni0004", target: "nd_scexec0003", type: "feedback", label: "Retro" },
    { id: "e5", source: "nd_scmoni0004", target: "nd_sccls00005", type: "flow" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 2. Waterfall (port from DEFAULT_LIFECYCLES.waterfall, 6-phase sequential)
// ----------------------------------------------------------------------------
const WATERFALL: WorkflowConfig = {
  mode: "sequential-locked",
  nodes: [
    { id: "nd_wfreq00001", name: "Gereksinimler", description: "Kapsam ve dokümantasyon", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_wfdes00002", name: "Tasarım", description: "Mimari ve UI", x: 280, y: 120, color: "status-progress" },
    { id: "nd_wfimp00003", name: "Uygulama", description: "Geliştirme", x: 500, y: 120, color: "status-progress" },
    { id: "nd_wftst00004", name: "Test", description: "QA ve UAT", x: 720, y: 120, color: "status-review" },
    { id: "nd_wfdep00005", name: "Yayın", description: "Dağıtım", x: 940, y: 120, color: "status-done" },
    { id: "nd_wfmnt00006", name: "Bakım", description: "Destek", x: 1160, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_wfreq00001", target: "nd_wfdes00002", type: "flow" },
    { id: "e2", source: "nd_wfdes00002", target: "nd_wfimp00003", type: "flow" },
    { id: "e3", source: "nd_wfimp00003", target: "nd_wftst00004", type: "flow" },
    { id: "e4", source: "nd_wftst00004", target: "nd_wfdep00005", type: "flow" },
    { id: "e5", source: "nd_wfdep00005", target: "nd_wfmnt00006", type: "flow" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 3. Kanban (port from DEFAULT_LIFECYCLES.kanban, single-node continuous)
// ----------------------------------------------------------------------------
const KANBAN: WorkflowConfig = {
  mode: "continuous",
  nodes: [
    {
      id: "nd_kbflow0001",
      name: "Sürekli Akış",
      description: "Tek aktif faz",
      x: 400,
      y: 120,
      color: "status-progress",
      // Single node fills both initial + final roles to satisfy rule 4.
      isInitial: true,
      isFinal: true,
    },
  ],
  edges: [],
  groups: [],
}

// ----------------------------------------------------------------------------
// 4. Iterative (4-phase cyclic flexible)
// ----------------------------------------------------------------------------
const ITERATIVE: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_itplan0001", name: "Planlama", description: "Hedef belirleme", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_itdes00002", name: "Tasarım", description: "Yineleme tasarımı", x: 260, y: 120, color: "status-progress" },
    { id: "nd_itimp00003", name: "Uygulama", description: "Geliştirme ve test", x: 460, y: 120, color: "status-progress" },
    { id: "nd_iteva00004", name: "Değerlendirme", description: "İnceleme ve karar", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_itplan0001", target: "nd_itdes00002", type: "flow" },
    { id: "e2", source: "nd_itdes00002", target: "nd_itimp00003", type: "flow" },
    { id: "e3", source: "nd_itimp00003", target: "nd_iteva00004", type: "flow" },
    { id: "e4", source: "nd_iteva00004", target: "nd_itplan0001", type: "feedback", label: "Yeni iterasyon" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 5. V-Model (port from EXTRA_LIFECYCLES.vmodel, 7-phase V with verification)
// Mode is "flexible" — verification edges between dev and test legs are not
// the main flow edges, so they do not violate sequential-locked rule 5 even
// at the FE validator level. The prototype uses sequential-flexible; we use
// flexible here so the preset is portable across all 4 modes.
// ----------------------------------------------------------------------------
const VMODEL: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_vmreq00001", name: "Gereksinimler", description: "Sistem gereksinimleri", x: 60, y: 60, color: "status-todo", isInitial: true },
    { id: "nd_vmsys00002", name: "Sistem Tasarımı", description: "Yüksek seviye tasarım", x: 260, y: 60, color: "status-todo" },
    { id: "nd_vmmod00003", name: "Modül Tasarımı", description: "Detaylı tasarım", x: 460, y: 60, color: "status-progress" },
    { id: "nd_vmcod00004", name: "Kodlama", description: "Geliştirme", x: 460, y: 220, color: "status-progress" },
    { id: "nd_vmunt00005", name: "Birim Testi", description: "Unit test", x: 460, y: 380, color: "status-review" },
    { id: "nd_vmint00006", name: "Entegrasyon Testi", description: "Integration test", x: 260, y: 380, color: "status-review" },
    { id: "nd_vmsts00007", name: "Sistem Testi", description: "System test", x: 60, y: 380, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_vmreq00001", target: "nd_vmsys00002", type: "flow" },
    { id: "e2", source: "nd_vmsys00002", target: "nd_vmmod00003", type: "flow" },
    { id: "e3", source: "nd_vmmod00003", target: "nd_vmcod00004", type: "flow" },
    { id: "e4", source: "nd_vmcod00004", target: "nd_vmunt00005", type: "flow" },
    { id: "e5", source: "nd_vmunt00005", target: "nd_vmint00006", type: "flow" },
    { id: "e6", source: "nd_vmint00006", target: "nd_vmsts00007", type: "flow" },
    { id: "ev1", source: "nd_vmmod00003", target: "nd_vmunt00005", type: "verification", label: "Doğrula" },
    { id: "ev2", source: "nd_vmsys00002", target: "nd_vmint00006", type: "verification", label: "Doğrula" },
    { id: "ev3", source: "nd_vmreq00001", target: "nd_vmsts00007", type: "verification", label: "Doğrula" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 6. Spiral (port from EXTRA_LIFECYCLES.spiral, 4-phase flexible with feedback)
// ----------------------------------------------------------------------------
const SPIRAL: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_spplan0001", name: "Planlama", description: "Hedef ve risk planı", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_sprisk0002", name: "Risk Analizi", description: "Risk azaltma", x: 260, y: 120, color: "status-review" },
    { id: "nd_spdev00003", name: "Geliştirme", description: "Prototip ve test", x: 460, y: 120, color: "status-progress" },
    { id: "nd_speval0004", name: "Değerlendirme", description: "Müşteri onayı", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_spplan0001", target: "nd_sprisk0002", type: "flow" },
    { id: "e2", source: "nd_sprisk0002", target: "nd_spdev00003", type: "flow" },
    { id: "e3", source: "nd_spdev00003", target: "nd_speval0004", type: "flow" },
    { id: "e4", source: "nd_speval0004", target: "nd_spplan0001", type: "feedback", label: "Yeni döngü" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 7. Incremental (NEW per EDIT-07) — 5-phase flexible with feedback loop
// ----------------------------------------------------------------------------
const INCREMENTAL: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_inplan0001", name: "Planlama", description: "Artım planlaması", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_ininc01002", name: "Artırım 1", description: "İlk işlevsel parça", x: 260, y: 120, color: "status-progress" },
    { id: "nd_ininc02003", name: "Artırım 2", description: "İkinci işlevsel parça", x: 460, y: 120, color: "status-progress" },
    { id: "nd_inintg0004", name: "Bütünleştirme", description: "Parçaların birleştirilmesi", x: 660, y: 120, color: "status-review" },
    { id: "nd_inrel00005", name: "Yayın", description: "Müşteriye teslim", x: 860, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_inplan0001", target: "nd_ininc01002", type: "flow" },
    { id: "e2", source: "nd_ininc01002", target: "nd_ininc02003", type: "flow" },
    { id: "e3", source: "nd_ininc02003", target: "nd_inintg0004", type: "flow" },
    { id: "e4", source: "nd_inintg0004", target: "nd_inrel00005", type: "flow" },
    { id: "fb1", source: "nd_ininc02003", target: "nd_ininc01002", type: "feedback", label: "Geri besleme" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 8. Evolutionary (NEW per EDIT-07) — prototype-driven evolution flexible mode
// ----------------------------------------------------------------------------
const EVOLUTIONARY: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_evanl00001", name: "Analiz", description: "İhtiyaç ve hedef", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_evpro00002", name: "Prototip", description: "İlk prototip", x: 260, y: 120, color: "status-progress" },
    { id: "nd_evfbk00003", name: "Geri Bildirim", description: "Kullanıcı geri bildirimi", x: 460, y: 120, color: "status-review" },
    { id: "nd_evevo00004", name: "Evrim", description: "İyileştirme döngüsü", x: 660, y: 120, color: "status-progress" },
    { id: "nd_evrel00005", name: "Yayın", description: "Olgunlaşan ürün", x: 860, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_evanl00001", target: "nd_evpro00002", type: "flow" },
    { id: "e2", source: "nd_evpro00002", target: "nd_evfbk00003", type: "flow" },
    { id: "e3", source: "nd_evfbk00003", target: "nd_evevo00004", type: "flow" },
    { id: "e4", source: "nd_evevo00004", target: "nd_evrel00005", type: "flow" },
    { id: "fb1", source: "nd_evevo00004", target: "nd_evpro00002", type: "feedback", label: "Yeniden prototipleme" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 9. RAD (NEW per EDIT-07) — Rapid Application Development with parallel tracks
// ----------------------------------------------------------------------------
const RAD: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "nd_rdbiz00001", name: "İş Modelleme", description: "Süreç ve veri akışı", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "nd_rddata0002", name: "Veri Modelleme", description: "Veri yapıları", x: 260, y: 50, color: "status-progress" },
    { id: "nd_rdproc0003", name: "Süreç Modelleme", description: "Fonksiyonlar", x: 260, y: 190, color: "status-progress" },
    { id: "nd_rdgen00004", name: "Uygulama Üretimi", description: "Hızlı prototip", x: 460, y: 120, color: "status-review" },
    { id: "nd_rdtest0005", name: "Test ve Devreye Alma", description: "Kabul ve yayın", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "nd_rdbiz00001", target: "nd_rddata0002", type: "flow" },
    { id: "e2", source: "nd_rdbiz00001", target: "nd_rdproc0003", type: "flow" },
    { id: "e3", source: "nd_rddata0002", target: "nd_rdgen00004", type: "flow" },
    { id: "e4", source: "nd_rdproc0003", target: "nd_rdgen00004", type: "flow" },
    { id: "e5", source: "nd_rdgen00004", target: "nd_rdtest0005", type: "flow" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// Lookup table — maps every PresetId to its WorkflowConfig.
// ----------------------------------------------------------------------------
export const PRESETS_BY_ID: Record<PresetId, WorkflowConfig> = {
  scrum: SCRUM,
  waterfall: WATERFALL,
  kanban: KANBAN,
  iterative: ITERATIVE,
  vmodel: VMODEL,
  spiral: SPIRAL,
  incremental: INCREMENTAL,
  evolutionary: EVOLUTIONARY,
  rad: RAD,
}

/**
 * Deep-clone the preset so consumers can mutate without affecting the
 * lookup table. Uses JSON.parse(JSON.stringify(...)) — the preset shape is
 * pure JSON (no Date / Map / undefined keys), so the round-trip is safe.
 */
export function resolvePreset(id: PresetId): WorkflowConfig {
  return JSON.parse(JSON.stringify(PRESETS_BY_ID[id])) as WorkflowConfig
}

/** Localized labels — Turkish (default UI language). */
export const PRESET_LABELS_TR: Record<PresetId, string> = {
  scrum: "Scrum",
  waterfall: "Şelale",
  kanban: "Kanban",
  iterative: "Yinelemeli",
  vmodel: "V-Modeli",
  spiral: "Spiral",
  incremental: "Artırımlı",
  evolutionary: "Evrimsel",
  rad: "RAD",
}

/** Localized labels — English (alternative). */
export const PRESET_LABELS_EN: Record<PresetId, string> = {
  scrum: "Scrum",
  waterfall: "Waterfall",
  kanban: "Kanban",
  iterative: "Iterative",
  vmodel: "V-Model",
  spiral: "Spiral",
  incremental: "Incremental",
  evolutionary: "Evolutionary",
  rad: "RAD",
}
