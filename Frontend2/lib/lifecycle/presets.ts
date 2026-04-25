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

// ----------------------------------------------------------------------------
// 1. Scrum (port from DEFAULT_LIFECYCLES.scrum, 5-phase flexible)
// ----------------------------------------------------------------------------
const SCRUM: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Başlatma", description: "Vizyon ve hedefler", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Planlama", description: "Backlog ve sprint planning", x: 280, y: 120, color: "status-todo" },
    { id: "n3", name: "Yürütme", description: "Sprint'ler", x: 500, y: 120, color: "status-progress" },
    { id: "n4", name: "İzleme", description: "Metrikler ve retro", x: 720, y: 120, color: "status-review" },
    { id: "n5", name: "Kapanış", description: "Teslim ve ders", x: 940, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n3", type: "feedback", label: "Retro" },
    { id: "e5", source: "n4", target: "n5", type: "flow" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 2. Waterfall (port from DEFAULT_LIFECYCLES.waterfall, 6-phase sequential)
// ----------------------------------------------------------------------------
const WATERFALL: WorkflowConfig = {
  mode: "sequential-locked",
  nodes: [
    { id: "n1", name: "Gereksinimler", description: "Kapsam ve dokümantasyon", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Tasarım", description: "Mimari ve UI", x: 280, y: 120, color: "status-progress" },
    { id: "n3", name: "Uygulama", description: "Geliştirme", x: 500, y: 120, color: "status-progress" },
    { id: "n4", name: "Test", description: "QA ve UAT", x: 720, y: 120, color: "status-review" },
    { id: "n5", name: "Yayın", description: "Dağıtım", x: 940, y: 120, color: "status-done" },
    { id: "n6", name: "Bakım", description: "Destek", x: 1160, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "e5", source: "n5", target: "n6", type: "flow" },
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
      id: "n1",
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
    { id: "n1", name: "Planlama", description: "Hedef belirleme", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Tasarım", description: "Yineleme tasarımı", x: 260, y: 120, color: "status-progress" },
    { id: "n3", name: "Uygulama", description: "Geliştirme ve test", x: 460, y: 120, color: "status-progress" },
    { id: "n4", name: "Değerlendirme", description: "İnceleme ve karar", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n1", type: "feedback", label: "Yeni iterasyon" },
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
    { id: "n1", name: "Gereksinimler", description: "Sistem gereksinimleri", x: 60, y: 60, color: "status-todo", isInitial: true },
    { id: "n2", name: "Sistem Tasarımı", description: "Yüksek seviye tasarım", x: 260, y: 60, color: "status-todo" },
    { id: "n3", name: "Modül Tasarımı", description: "Detaylı tasarım", x: 460, y: 60, color: "status-progress" },
    { id: "n4", name: "Kodlama", description: "Geliştirme", x: 460, y: 220, color: "status-progress" },
    { id: "n5", name: "Birim Testi", description: "Unit test", x: 460, y: 380, color: "status-review" },
    { id: "n6", name: "Entegrasyon Testi", description: "Integration test", x: 260, y: 380, color: "status-review" },
    { id: "n7", name: "Sistem Testi", description: "System test", x: 60, y: 380, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "e5", source: "n5", target: "n6", type: "flow" },
    { id: "e6", source: "n6", target: "n7", type: "flow" },
    { id: "ev1", source: "n3", target: "n5", type: "verification", label: "Doğrula" },
    { id: "ev2", source: "n2", target: "n6", type: "verification", label: "Doğrula" },
    { id: "ev3", source: "n1", target: "n7", type: "verification", label: "Doğrula" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 6. Spiral (port from EXTRA_LIFECYCLES.spiral, 4-phase flexible with feedback)
// ----------------------------------------------------------------------------
const SPIRAL: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Planlama", description: "Hedef ve risk planı", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Risk Analizi", description: "Risk azaltma", x: 260, y: 120, color: "status-review" },
    { id: "n3", name: "Geliştirme", description: "Prototip ve test", x: 460, y: 120, color: "status-progress" },
    { id: "n4", name: "Değerlendirme", description: "Müşteri onayı", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n1", type: "feedback", label: "Yeni döngü" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 7. Incremental (NEW per EDIT-07) — 5-phase flexible with feedback loop
// ----------------------------------------------------------------------------
const INCREMENTAL: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Planlama", description: "Artım planlaması", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Artırım 1", description: "İlk işlevsel parça", x: 260, y: 120, color: "status-progress" },
    { id: "n3", name: "Artırım 2", description: "İkinci işlevsel parça", x: 460, y: 120, color: "status-progress" },
    { id: "n4", name: "Bütünleştirme", description: "Parçaların birleştirilmesi", x: 660, y: 120, color: "status-review" },
    { id: "n5", name: "Yayın", description: "Müşteriye teslim", x: 860, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "fb1", source: "n3", target: "n2", type: "feedback", label: "Geri besleme" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 8. Evolutionary (NEW per EDIT-07) — prototype-driven evolution flexible mode
// ----------------------------------------------------------------------------
const EVOLUTIONARY: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Analiz", description: "İhtiyaç ve hedef", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Prototip", description: "İlk prototip", x: 260, y: 120, color: "status-progress" },
    { id: "n3", name: "Geri Bildirim", description: "Kullanıcı geri bildirimi", x: 460, y: 120, color: "status-review" },
    { id: "n4", name: "Evrim", description: "İyileştirme döngüsü", x: 660, y: 120, color: "status-progress" },
    { id: "n5", name: "Yayın", description: "Olgunlaşan ürün", x: 860, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "fb1", source: "n4", target: "n2", type: "feedback", label: "Yeniden prototipleme" },
  ],
  groups: [],
}

// ----------------------------------------------------------------------------
// 9. RAD (NEW per EDIT-07) — Rapid Application Development with parallel tracks
// ----------------------------------------------------------------------------
const RAD: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "İş Modelleme", description: "Süreç ve veri akışı", x: 60, y: 120, color: "status-todo", isInitial: true },
    { id: "n2", name: "Veri Modelleme", description: "Veri yapıları", x: 260, y: 50, color: "status-progress" },
    { id: "n3", name: "Süreç Modelleme", description: "Fonksiyonlar", x: 260, y: 190, color: "status-progress" },
    { id: "n4", name: "Uygulama Üretimi", description: "Hızlı prototip", x: 460, y: 120, color: "status-review" },
    { id: "n5", name: "Test ve Devreye Alma", description: "Kabul ve yayın", x: 660, y: 120, color: "status-done", isFinal: true },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n1", target: "n3", type: "flow" },
    { id: "e3", source: "n2", target: "n4", type: "flow" },
    { id: "e4", source: "n3", target: "n4", type: "flow" },
    { id: "e5", source: "n4", target: "n5", type: "flow" },
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
