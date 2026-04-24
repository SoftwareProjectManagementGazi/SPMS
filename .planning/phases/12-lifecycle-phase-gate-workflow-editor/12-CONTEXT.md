# Phase 12: Lifecycle, Phase Gate & Workflow Editor - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the full **Lifecycle tab** (4 sub-tabs: Overview + Milestones + History + Artifacts, plus canvas + Phase Gate inline expand), the **Settings > Yaşam Döngüsü sub-tab** (per-phase completion criteria editor + `enable_phase_assignment` toggle), and a standalone `/workflow-editor?projectId=X` page built on **React Flow** with edge types (flow/verification/feedback), bidirectional pair-wise semantic, "All" source-agnostic gate, swimlane groups (cloud-shaped), sequential-flexible mode, BFS-driven node state (active/past/future/unreachable) with parallel actives, per-node cycle counter badges, and Incremental/Evolutionary/RAD preset templates.

**Scope (v2.0 requirements):** LIFE-01..07 + EDIT-01..07 (14 total, ~10 plans).

**Backend:** Already delivered in Phase 9. No new backend work except a Pydantic-model extension + schema_version bump to **v2** for two new optional edge fields (`bidirectional: bool`, `is_all_gate: bool`). This is a normalizer-only change (Phase 9 D-32 pattern), no new migration.

**NOT in scope:**
- Activity tab content (Phase 13 — PROF-01)
- User Profile pages (Phase 13 — PROF-02..04)
- Reporting charts (Phase 13 — REPT-01..04)
- Reports page "Faz Raporları" section (Phase 13 — REPT-04; Phase 12 delivers the PhaseReport CRUD UI inline on History cards only)
- Methodology change mapping wizard (deferred to v2.1)
- Full auto-layout algorithm (dagre/ELK) — only basic grid-snap + align helpers in Phase 12
- Full dagre auto-layout button
- WebSocket / real-time concurrent transition detection
- Methodology-level changes to process_config.methodology (Settings > General locks the field read-only)
- AI-powered workflow suggestions (v3.0 per PROJECT.md)
- Multi-file artifact attachments (v2.0 supports 1 file per artifact)

**Cross-phase contracts:**
- Phase 12 REPLACES Phase 11 D-10 `LifecycleStubTab` with the real Lifecycle experience.
- Phase 12 REPLACES Phase 11 D-11 Settings > Yaşam Döngüsü stub with real criteria editor + `enable_phase_assignment` toggle.
- Phase 12 TARGETS the Phase 11 D-11 `/workflow-editor?projectId=X` link-out; that page is built in this phase.
- Phase 12 EXTENDS the Phase 11 Timeline tab (Gantt) with vertical milestone flag lines (small additive change, no rearchitecture).
- Phase 12 WRITES cycle_label updates are optional on process_config (Phase 11 D-42/D-43 honors user overrides).

</domain>

<decisions>
## Implementation Decisions

### Plan Decomposition & Build Order

- **D-01:** **Lifecycle-first sequencing.** Plans 12-01..06 deliver Lifecycle tab + Phase Gate + Settings > Lifecycle + Milestones + Artifacts + History/Evaluation Report. Plans 12-07..10 deliver the Workflow Editor. Rationale: Phase Gate + Milestones are highest user-visible value; the editor is internal tooling used by fewer users. If the phase runs long, users still get the critical flow; editor can land in a follow-up phase if absolutely needed.
- **D-02:** **Plan 01 = full shared infra.** Ships `<WorkflowCanvas readOnly?/>` primitive (shared by LifecycleTab read-only and Workflow Editor editable modes), `services/lifecycle-service.ts` + `phase-gate-service.ts` + `milestone-service.ts` + `artifact-service.ts` + `phase-report-service.ts`, `hooks/use-milestones.ts` + `use-artifacts.ts` + `use-phase-reports.ts` + `use-phase-transitions.ts`, **`lib/lifecycle/graph-traversal.ts`** (pure BFS function), **`lib/lifecycle/workflow-validators.ts`** (5-rule validator), and **`hooks/use-transition-authority.ts`** (composed permission hook — see D-03). ~20-25 files. Subsequent plans consume this infra.
- **D-03:** **`use-transition-authority.ts` is a 3-role hook.** Internal composition: `useAuth().user.role === 'Admin'` OR `project.manager_id === user.id` OR `useLedTeams()` returns a match for `project.id`. `useLedTeams()` calls `GET /users/me/led-teams` (Phase 9 D-17) via TanStack Query, `staleTime: 5 * 60 * 1000` (5 min — roles don't change often). Same hook used by: Phase Gate button visibility, Milestone POST/PATCH/DELETE guards, Artifact POST/DELETE guards, PhaseReport all-CRUD guards, Workflow Editor save button enable.
- **D-04:** **Per-plan unit + integration testing; no E2E in Phase 12.** Matches Phase 11 pattern — Phase 11 shipped E2E with defensive skip-guards because no seeded test DB exists; Phase 12's Gate + Report flow has more backend dependencies. Unit tests for pure logic (BFS traversal, cycle counter aggregation, criteria evaluation, workflow validators) + RTL component tests for UI. E2E smoke suite deferred until a test-DB seeder lands.

### Workflow Editor — Core Architecture

- **D-05:** **React Flow (`@xyflow/react`) library.** User-chosen over custom SVG. Adds ~70KB gzipped. Constraint: we use React Flow's graph model + DnD + minimap + pan/zoom **plumbing only**; all node and edge visuals are custom-rendered to match the prototype's oklch token system (see D-08).
- **D-06:** **Single `<WorkflowCanvas workflow readOnly onNodeClick activePhase selected ... />` primitive** shared by LifecycleTab (readOnly=true) and Workflow Editor (readOnly=false). Ships in Plan 01 per D-02. Zero component duplication; visual consistency guaranteed.
- **D-07:** **Dynamic import with `ssr: false`.** `const WorkflowCanvas = dynamic(() => import('./workflow-canvas'), { ssr: false, loading: <CanvasSkeleton/> })`. Matches Phase 11 D-36 TipTap pattern. Required because React Flow depends on `window`, `ResizeObserver`, `getBoundingClientRect` — none of which exist in Node.js SSR. `"use client"` alone is insufficient — it still SSR-renders. Loading skeleton shows prototype-styled placeholder.
- **D-08:** **Custom renderers, 100% prototype-faithful.** `<PhaseNode/>` (140×60 div with oklch bg, boxShadow rings for active/selected, status dot + name + description + WIP indicator + cycle counter badge) and `<PhaseEdge/>` (SVG path with strokeDasharray per type: flow=solid, verification=`6 3`, feedback=`8 4 2 4`, color via `color-mix(in oklch, ...)`). React Flow's default visuals are discarded. Honors v2.0 "no shadcn/ui, 100% prototype fidelity" rule.

### Workflow Editor — Graph State Computation

- **D-09:** **Frontend-only BFS via pure function.** `lib/lifecycle/graph-traversal.ts::computeNodeStates(workflow, phaseTransitions) → Map<nodeId, 'active'|'past'|'future'|'unreachable'>`. Input = workflow JSON + list of `phase_transition` audit entries from `GET /projects/{id}/activity?type[]=phase_transition`. Output map consumed by both LifecycleTab canvas (highlight active/past) and Workflow Editor (visualize state). Testable in isolation with vitest. No backend endpoint.
- **D-10:** **Parallel actives supported in flexible + sequential-flexible modes.** A node is `active` if: (a) it is the starting node of an uncompleted forward chain, OR (b) a feedback edge has returned control to it. Example: V-Model can show "Module Design" + "Unit Test" both active simultaneously (verification edge pattern). Sequential-locked mode always produces exactly 1 active. Continuous mode always produces exactly 1 active. Rule encoded in BFS traversal function.
- **D-11:** **Cycle counter derived client-side from `/activity` endpoint.** `useCycleCounters(projectId)` hook calls `GET /projects/{id}/activity?type[]=phase_transition`, groups by `metadata.source_phase_id`, returns `Map<nodeId, number>`. Cached via TanStack Query. Consumed by the canvas to render `<span className="badge xN">×N</span>` in node's top-right corner, visible only when count ≥ 2. Hover tooltip: "Bu faz N kere kapatıldı (Spiral/iterative döngüleri)". No new backend endpoint.

### Workflow Editor — Edge & Node Interactions

- **D-12:** **4-way source/target handles per node.** Each node exposes top/right/bottom/left handles, each simultaneously usable as source and target. React Flow handle ids: `top-source`, `top-target`, `right-source`, `right-target`, etc. Required for V-Model (vertical verification edges) and Spiral (feedback loops). Prototype's 2-handle horizontal pattern is insufficient.
- **D-13:** **Edge creation via drag-from-handle-to-handle.** React Flow default pattern: hover node → 4 handles visible → click-hold a handle → drag to another node's handle → release creates edge with default `type: "flow"`. Edge type switched via right side panel SegmentedControl after selection.
- **D-14:** **Edge label inline edit via double-click.** Double-click on edge's label pill → pill becomes input, Enter commits, Esc cancels. Also editable via right side panel "Etiket" field (prototype parity). Both paths write to the same edge object.
- **D-15:** **Node inline edit: double-click name; everything else in side panel.** Double-click node → name becomes inline input, Enter commits, Esc cancels. Description, color, WIP limit, `isInitial`, `isFinal`, archive flag all edited via right side panel `<Field/>` components (prototype parity).

### Workflow Editor — Edge Semantics

- **D-16:** **Bidirectional is strictly pair-wise, NOT transitive.** `{ source, target, type, label, bidirectional: boolean }` edge shape. `bidirectional=true` adds reverse transition **only between those two specific nodes** — `A ↔ B` and `B ↔ C` do NOT implicitly allow `A → C`. Phase Gate validation checks direct edge existence only; no transitive closure. Visual: arrow markers on both ends + `"bidirectional": true` flag. Ships with the v2 schema bump (D-18).
- **D-17:** **"All" gate — source-agnostic transition target** (Jira workflow pattern). New optional edge field: `is_all_gate: boolean`. `is_all_gate=true` means "any non-archived node in the workflow can transition TO this edge's target". Backend validation in `ExecutePhaseTransitionUseCase`: when checking `source→target` transition, if a matching `is_all_gate=true` edge with that target exists, the transition is allowed regardless of source. Visual: target node displays an "All" pill (T('Hepsi', 'All')) adjacent to the edge's target endpoint; source handle is not rendered on the edge path. Ships with the v2 schema bump (D-18).
- **D-18:** **`process_config.schema_version` bumps to v2 for D-16 + D-17.** Phase 9 D-32 schema_version normalizer pattern:
  - Add `WorkflowEdge` Pydantic fields: `bidirectional: bool = False`, `is_all_gate: bool = False` (both optional, default false).
  - Add `_migrate_v1_to_v2(process_config)` method on the Project entity validator — iterates `workflow.edges`, fills defaults on any edge missing those fields.
  - `current_version: int = 2` in the normalizer.
  - No Alembic migration needed (process_config is JSONB; defaults applied on read).
  - Backend Phase Gate use-case updated to honor `bidirectional` + `is_all_gate` in transition validation.
- **D-19:** **Workflow validation rules (5 rules).** `lib/lifecycle/workflow-validators.ts::validateWorkflow(wf) → { errors: [], warnings: [] }`:
  1. At least 1 node (blocking).
  2. Node IDs unique within workflow (blocking).
  3. Edge source/target must reference existing non-archived nodes (blocking). `is_all_gate=true` exempts source from this check.
  4. At least 1 `isInitial` node AND at least 1 `isFinal` node (blocking).
  5. In `sequential-locked` and `sequential-flexible` modes: flow-type edges must not form cycles (topological sort check). Feedback + verification edges exempt (Phase 9 D-55). Warning if violated in `flexible` mode (non-blocking).
  Validation panel runs with 300ms debounce on every canvas mutation. Displayed in right panel.

### Workflow Editor — Groups (Swimlanes)

- **D-20:** **5 ways to create a group**, all supported:
  1. **Drag-rectangle on empty canvas:** Click "Grup" in bottom toolbar → cursor becomes crosshair → click-drag rectangle → nodes spatially inside the rectangle are auto-grouped.
  2. **Multi-select + Grup button:** Shift+click nodes OR marquee drag-select → click "Grup" in toolbar → group created around selected nodes.
  3. **Drag node into existing group zone:** Drag a loose node into a group's cloud → node joins that group.
  4. **Select group cloud + loose node + Grup button:** Shift+click a group and a non-grouped node → "Grup" → node added to group.
  5. **Right-click context menu:** Right-click on node(s) or group → menu with "Grupla" / "Grubu Çöz" options.
- **D-21:** **"Grup" button is bidirectional.** Labels as "Grupla" when selection is ungroupable, "Grubu Çöz" when selection is already a group (or all selected nodes share the same parent group). Right-click context menu mirrors.
- **D-22:** **Group visual = smooth cloud shape.** Custom SVG `<path d="..." />` computed from the union of grouped nodes' bounding boxes + padding (margin around the cluster), with smooth/rounded corners like a thought bubble. **NOT** the prototype's sharp-edged `border: dashed; border-radius: 12px` rectangle. Uses a concave-hull algorithm (or convex-hull-plus-padding as a simpler baseline) + CSS transition for smooth updates. Path recomputes on every node move (live morph).
- **D-23:** **Live morph on node drag** (no snap-to-hull). Group cloud recomputes on every drag frame (React Flow's `onNodeDrag` callback). Target 60fps. Node count expected <50 per project, so the hull computation stays cheap.
- **D-24:** **Data model uses React Flow's parent-child pattern.** Custom `group` node type holds `{ id, type: 'group', name, color, children: [nodeIds] }`. Nodes inside a group have `parentId` pointing to the group node. Matches Phase 9 D-54 WorkflowGroup schema `{ id, name, x, y, width, height, color }` but extends with `children: []` for persistence. Schema v2 normalizer fills `children` from nodes' `parentId` on read if missing.

### Workflow Editor — Controls

- **D-25:** **React Flow `<Controls/>` with custom CSS theme.** Prototype's `+/-/fit/Maximize` button set adopted visually via CSS variable overrides on React Flow's default controls component. Trackpad pinch + scroll-to-zoom built-in. Keyboard: `+`, `-`, `0` (reset). Minimap interaction: click-to-pan + drag viewport rectangle (React Flow's `<MiniMap/>` default).
- **D-26:** **Multi-select pattern:** Shift+click for individual toggle, marquee drag-select on empty canvas for rectangle selection (intersects both nodes and edges). Cmd/Ctrl+A selects all. Bulk actions on selection: Delete (remove), Arrow keys (1px move, Shift+Arrow 10px), Cmd/Ctrl+G (group/ungroup), Cmd/Ctrl+D (duplicate). React Flow natively supports.
- **D-27:** **Local in-memory undo/redo stack, cleared on Save.** `useEditorHistory(workflow)` hook tracks every mutation: node-add, node-delete, node-move, edge-add, edge-delete, edge-change, node-edit, mode-change, group-change. Stack lives in component state, clears on save. Keyboard: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo). ~100-line implementation.
- **D-28:** **Basic grid-snap + align helpers in Phase 12.** Snap-to-20px during drag. Align actions: `Ctrl+Shift+L` distributes selected nodes evenly horizontally; `Ctrl+Shift+T/B` aligns to top/bottom; `Ctrl+Shift+V/H` centers vertically/horizontally. ~80 lines, no dependency. Bottom toolbar "Sınıflandır" dropdown exposes these. Full dagre/ELK auto-layout algorithm deferred to v2.1 (see Deferred Ideas).
- **D-29:** **Dirty-save protection: `beforeunload` + router intercept.** `useEffect` attaches `window.addEventListener('beforeunload')` for browser close/refresh (native dialog). Next.js `router.push` / `<Link>` click triggers a ConfirmDialog: "Kaydedilmemiş değişiklikler var. Çıkılsın mı?" [Vazgeç / Atıp Çık / Kaydet ve Çık]. When `dirty=false` nothing fires.

### Workflow Editor — Node Attributes

- **D-30:** **Node color picker: 8 preset swatches (status/priority tokens).** `status-todo`, `status-progress`, `status-review`, `status-done`, `status-blocked`, `priority-critical`, `priority-high`, `primary`. Right panel "Renk" field = 8 clickable swatch grid. No custom hex (brand consistency). Selected swatch updates node + outgoing flow edge color.
- **D-31:** **`isInitial` / `isFinal` flags supported in both lifecycle and status flow editor modes.** Right panel has "Başlangıç düğümü" and "Bitiş düğümü" checkboxes. Initial badge = small primary-tone dot (prototype: `Badge size=xs tone=primary`); Final badge = success-tone hexagon (prototype: `Badge tone=success`). Validator enforces ≥1 initial + ≥1 final per workflow (rule 4 in D-19).

### Workflow Editor — Save Flow

- **D-32:** **Save flow: full error matrix with TanStack Query invalidation.** PATCH `/projects/{id}` body `{ process_config: { ...cur, workflow: newWorkflow } }`.
  - **200** → Toast "Kaydedildi" + dirty=false + clear undo stack + invalidate `['project', id]`.
  - **422** (validation) → Toast "Doğrulama hatası" + validation panel populates per-error from Phase 9 D-54/D-55 Pydantic error response.
  - **409** (concurrent edit) → AlertBanner "Başka bir kullanıcı aynı anda değiştirdi. Yenileyin." + "Yenile" button (refetches project, but merge-resolution UI **deferred**).
  - **429** (rate-limit) → Toast "Rate limit" + 5s countdown + auto-enable retry.
  - **Network err** → Toast "Bağlantı hatası, tekrar dene".

### Workflow Editor — Additional UI

- **D-33:** **"AI öner" button placeholder with "Yakında" badge.** Prototype bottom-toolbar button retained visually but disabled + badge `<Badge size="xs" tone="neutral">Yakında</Badge>`. Hover tooltip: "AI önerileri gelecek sürümde aktif olacak." Preserves design fidelity; no broken interaction.
- **D-34:** **"All" gate label localized:** `T('Hepsi', 'All')` via `useApp().language`. Pill rendered adjacent to edge's target endpoint when `is_all_gate=true`.
- **D-35:** **Core 8 keyboard shortcuts:** `Cmd/Ctrl+S` (save), `Cmd/Ctrl+Z` (undo), `Cmd/Ctrl+Shift+Z` (redo), `N` (add node at cursor), `Delete/Backspace` (delete selection), `Cmd/Ctrl+A` (select all), `F` (fit view), `Esc` (deselect + close side panel edit). Right-panel "Kısayollar" section lists them via `<Kbd/>` primitive (prototype parity). Supplement with arrow keys for move, Cmd+G group, Cmd+D duplicate — see D-26.

### Phase Gate

- **D-36:** **Phase Gate UX = inline expand in Lifecycle tab summary strip** (prototype `PhaseGateExpand` pattern). "Sonraki Faza Geç" button lives in the Lifecycle tab's summary strip (above the canvas). On click: inline panel expands between strip and canvas, showing:
  - Current phase → Next phase header
  - Task summary (Toplam / Tamamlanan / Açık)
  - Auto criteria with check icons
  - Manual criteria with checkboxes + "Kriterleri düzenle →" link (deep-links to Settings > Yaşam Döngüsü for the current phase)
  - "Açık Görevler (N)" SegmentedControl + exceptions Collapsible (see D-38)
  - Transition note textarea (500 char limit, counter)
  - AlertBanner for mode warnings (sequential-locked + not all passed)
  - "Faz Geçişini Onayla" button + "Zorla Geç" override button (see D-39)
- **D-37:** **Criteria editor lives in Settings > Yaşam Döngüsü sub-tab (replaces Phase 11 D-11 stub).** Left-side phase picker (iterates `workflow.nodes`, skipping archived). Right-side editor for the selected phase:
  - "Otomatik Kriterler" section with 3 Toggle primitives: `all_tasks_done`, `no_critical_tasks`, `no_blockers` (Phase 9 D-06 shape).
  - "Manuel Kriterler" section with dynamic list: Input + Add button; each entry has X delete icon.
  - `enable_phase_assignment` Toggle lives in a sibling block at the top of the sub-tab (project-level, not per-phase — Phase 11 D-40 refers).
  - Save button → PATCH `/projects/{id}` with `process_config.phase_completion_criteria[phase_id] = { auto: {...}, manual: [...] }`.
  - Phase Gate expand's "Kriterleri düzenle →" link deep-links here with `?phase={phase_id}` query for auto-scroll.
- **D-38:** **Open tasks action = SegmentedControl + per-task exceptions Collapsible** (Phase 9 D-04). SegmentedControl options: "Sonraki faza taşı" / "Backlog'a taşı" / "Bu fazda bırak". Below: "Farklı davranış gerekli?" Collapsible. When open, list every open task in the current phase with a row `[key + title + mini dropdown("Aynı" / "Sonraki" / "Backlog" / "Kalsın")]`. Any non-"Aynı" selections populate request body's `exceptions: [{task_id, action}]` array.
- **D-39:** **Override UX: conditional checkbox + two-button pattern** (Phase 9 D-05). When criteria not all pass in `sequential-locked` mode: AlertBanner `tone=danger` + below it a checkbox "Kriterler karşılanmadan geçilsin" (default unchecked). When checked, the primary "Faz Geçişini Onayla" button relabels to "Zorla Geç" with danger tone + enabled. Clicking submits with `allow_override=true`. Audit log records `override_used: true`. In `flexible` / `sequential-flexible` modes with unmet criteria, AlertBanner `tone=warning` only; no override checkbox needed (warning does not block submission).
- **D-40:** **Permission gating via `use-transition-authority.ts` hook** (D-03). Phase Gate "Sonraki Faza Geç" button is hidden if the hook returns `false`. Milestone POST/PATCH/DELETE buttons, Artifact POST/DELETE buttons, PhaseReport all-CRUD buttons, and Workflow Editor Save button all share the same gating.
- **D-41:** **Error handling matrix** (Phase Gate `POST /projects/{id}/phase-transitions`):
  - **409** Locked → inline AlertBanner `tone=warning` "Başka bir kullanıcı aynı anda geçiş yapıyor. Bekleyin veya tekrar deneyin." + "Tekrar Dene" button.
  - **422** CriteriaUnmet → AlertBanner + per-criterion failure list rendered from response `unmet: [{check, passed, detail}]` (Phase 9 D-03).
  - **429** RateLimit → countdown toast "10 saniye bekleyin" + auto-enable retry after countdown.
  - **400** Wrong-mode → AlertBanner "Kanban projeler için Phase Gate geçerli değil." (Safety net — button normally hidden in continuous mode.)
  - **Network err** → Toast "Bağlantı hatası, tekrar deneyin."
- **D-42:** **Idempotency-Key generated once per Gate expand session.** `crypto.randomUUID()` on Gate expand open, stored in React state, sent as `Idempotency-Key` header on every submit retry. Phase 9 D-50 caches response for 10 min — retries within window return cached response without re-executing. Gate panel close → uuid discarded; reopen → new uuid.
- **D-43:** **0-task phase handling (LIFE-03):** Phase metrics display `---` across Toplam/Tamamlanan/Devam/İlerleme (mono font). Auto criteria all render as "Uygulanamaz" + grey Circle icon (prototype's `phaseStats.total===0` branch already implements this visual). Above the Gate expand: AlertBanner `tone=info`: "Bu fazda henüz görev yok. Geçiş serbestçe yapılabilir." Submit requires only manual criteria + note; auto criteria bypassed.
- **D-44:** **Concurrent transition detection = optimistic + 409 handling** (no polling, no WebSocket). When our submit returns 409: refetch `['project', id]` + `['activity', id]` via TanStack Query invalidate → Lifecycle tab rebuilds with current state → user sees new active phase. Relies on Phase 9 D-02 backend advisory lock for correctness.
- **D-45:** **`cycle_number` auto-calculated backend-side** (Phase 9 D-25). Frontend never sends `cycle_number` in the POST body. Backend computes `COUNT(audit_log WHERE action='phase_transition' AND source_phase_id=X) + 1`. Same for PhaseReport create.
- **D-46:** **Transition note: optional, 500 char limit + live counter.** Textarea below criteria. `<small>N/500</small>` counter; border turns red on overflow. Submit disabled when `note.length > 500`. Empty submission accepted.
- **D-47:** **Cycle counter (×N badge) position = top-right corner of node, absolute** (Phase 12 canvas only, both LifecycleTab readOnly + Workflow Editor editable modes). Visible only when count ≥ 2. Hover tooltip exposes the count in Turkish ("Bu faz 2 kere kapatıldı").

### Lifecycle Sub-Tabs

- **D-48:** **Overview sub-tab ships (default sub-tab).** Port prototype `OverviewSubTab` verbatim into `components/lifecycle/overview-subtab.tsx`: 4 MiniMetric cards (Toplam / Tamamlanan / Devam / İlerleme) + 2-column card layout (Faz Özeti + Yaklaşan Teslimler). Data: `useTasks(projectId)` + derived `phaseStats` via `computeNodeStates` (D-09). Kanban overrides to 3 MiniMetric cards (Ortalama Lead Time / Ortalama Cycle Time / WIP). ~200 lines port.
- **D-49:** **Milestone sub-tab: inline add row** (prototype pattern). "Ekle" button → inline Card with isim Input + tarih Input + linked_phase_ids chip picker + Kaydet/İptal. Optimistic insert at list top. Edit mode inline (click existing card). Delete confirm via ConfirmDialog (Phase 10 pattern).
- **D-50:** **Milestone `linked_phase_ids` = multi-select chip picker.** In inline add row: "Bağlı Fazlar" label + chip input. Dropdown sourced from `workflow.nodes` (non-archived). Multi-select, empty allowed (project-wide milestone per Phase 9 D-24). Same UX as Phase 11 D-51 label chip input for consistency.
- **D-51:** **Milestones render in Phase 11 Timeline tab (Gantt).** Small additive integration: Phase 11's custom SVG Gantt receives a `milestones` prop; renders vertical colored lines at milestone dates + top label chip "Alpha Launch · 15 Nis". Click → milestone detail popover ("name + status badge + days-remaining + linked phases"). No new Gantt library — Phase 11's Gantt is custom SVG already.
- **D-52:** **Artifact sub-tab: prototype row table + inline expand.** Row table: Artefakt adı + durum chip + son güncelleme + sorumlu avatar + more-kebab. Click row → inline expand (prototype pattern): isim Input + durum SegmentedControl (Yok/Taslak/Tamam) + not textarea + "Dosya Ekle" button. File upload wires to existing file entity (Phase 9 D-41 `Artifact.file_id`), reusing Phase 3 file-upload machinery.
- **D-53:** **Artifact assignee picker = project members dropdown.** Uses existing project members endpoint. Single assignee per artifact.
- **D-54:** **Artifact auto-seed + user edit/delete/custom-add flow.** On project create (Phase 10), `ArtifactSeeder` uses `ProcessTemplate.default_artifacts` to seed artifacts (Phase 9 D-28 already wired). Phase 12 UI displays seeded list. PM with transition-authority (D-40) can delete "not-created" artifacts; can't delete already-in-progress ones (soft warning). Methodology change = no-op on existing artifacts (Phase 9 D-29); user manages list manually from that point.
- **D-55:** **History sub-tab reuses Phase 11 MTTaskRow compact for "Görev Detayları" Collapsible.** Each history card gets a Collapsible labeled "Görev Detayları (N)". On expand, TanStack Query fetches tasks for that closed phase: `GET /api/v1/tasks/project/{id}?phase_id=X&status=done`. Only fetched on first expand (lazy); cached per-phase. Tasks rendered via `components/my-tasks/task-row.tsx` in compact mode — key + title + status + assignee + due.
- **D-56:** **History task data source: lazy-fetch on expand.** No pre-loading of all closed-phase tasks. Accordion-driven. TanStack Query cache key `['tasks', 'project', projectId, { phase_id }]` so re-open hits cache.
- **D-57:** **Evaluation Report = hybrid auto-prefill + PM-editable** (LIFE-07). On first open: backend PhaseReport response pre-fills summary fields read-only (`summary_task_count`, `summary_done_count`, `summary_moved_count`, `summary_duration_days` from Phase 9 PhaseReport entity). Free-text fields (`issues`, `lessons`, `recommendations`) start empty; PM types in. Placeholders show example text ("API yanıt süresi gecikti, Redis cache ile çözüldü."). Save → PATCH `/phase-reports/{id}` with auto `revision += 1` (Phase 9 D-25).
- **D-58:** **PDF export = direct download with loading state.** "PDF" button → `GET /phase-reports/{id}/pdf` (Phase 9 D-58 fpdf2 sync). Response Blob downloaded with filename `Phase-Report-{project-key}-{phase-slug}-rev{N}.pdf`. Button enters loading state ("PDF oluşturuluyor…" + disabled + spinner). 30s rate limit (Phase 9 D-51) → 429 toast "30 saniye bekleyin". Success toast "PDF indirildi".
- **D-59:** **Kanban methodology Lifecycle tab shows Overview + Milestones only.** `isKanban` detection via `project.methodology === 'KANBAN'` (until migration 006 drops the field; then via `project.process_template.name`). History and Artifacts sub-tabs hidden (prototype already implements this conditional). Canvas shows single node "Sürekli Akış" (from `DEFAULT_LIFECYCLES.kanban`). Phase Gate button also hidden (`workflow.mode === 'continuous'` → Phase 9 D-07 backend 400).

### Methodology Field Locked

- **D-60:** **Methodology field is read-only in Settings > General** after project creation. Field displays current value + small info-icon tooltip: "Metodoloji proje oluşturulduğu an sabittir. Değiştirmek için yeni proje oluşturun." Admin/PM cannot PATCH via UI. Phase 9 D-29 no-op behavior preserved at the API layer, but frontend hard-blocks the action. **Deferred:** manual mapping wizard for methodology change, if the user need becomes real, is scoped for v2.1 (see Deferred Ideas).

### Claude's Discretion

- React Flow version pinning (target latest stable `@xyflow/react`).
- Exact concave-hull algorithm for group cloud (concave-hull-js library, or reduced-point-set convex hull as simpler baseline).
- Exact `CanvasSkeleton` component styling — match prototype canvas loading state.
- Exact animation durations for cloud morph + group expand transitions.
- SVG path smoothing coefficients (bezier tension) for group clouds.
- Right-click context menu library / custom implementation.
- Debounce value for validation-panel recompute (300ms baseline; tune to feel).
- Toast library reuse — Phase 10 D-07 ToastProvider.
- ConfirmDialog reuse — Phase 10 D-25.
- Pydantic schema for `is_all_gate` / `bidirectional` field validators (backend — Phase 9 pattern).
- Exact "Sınıflandır" dropdown menu layout in bottom toolbar.
- Exact behavior when a grouped node is dragged OUTSIDE the group cloud — snap back, or drop parent association? (Default: drop association, cloud reshrinks.)

### Folded Todos

None — no pending todos matched Phase 12 scope per STATE.md (2026-04-23 snapshot) and `gsd-sdk todo.match-phase 12` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files (design authority — read first)
- `New_Frontend/src/pages/lifecycle-tab.jsx` — Full 500-line Lifecycle tab rebuild (LifecycleTabV2 + OverviewSubTab + MilestonesSubTab + HistorySubTab + ArtifactsSubTab + MiniMetric + PhaseGateExpand components). Match visually; port verbatim with TypeScript + useApp i18n.
- `New_Frontend/src/pages/workflow-editor.jsx` — Full 313-line editor (WorkflowCanvas + WorkflowEditorPage + Field + ValidationItem). Visual reference for React Flow custom renderers (D-08). Match edge strokeDasharray values + node 140×60 sizing + right-panel Flow Rules section + minimap + bottom toolbar exactly.
- `New_Frontend/src/pages/settings.jsx` — Settings page including Lifecycle sub-tab layout (phase picker + criteria editor). Port the Settings > Yaşam Döngüsü section to match D-37.
- `New_Frontend/src/data.jsx` — `DEFAULT_LIFECYCLES` (scrum/waterfall/kanban defaults), `EXTRA_LIFECYCLES` (v-model with verification edges + spiral with feedback edges + groups), `CYCLE_LABELS` map, `MILESTONES` / `ARTIFACTS` / `PHASE_HISTORY` mock shapes (reference for DTO alignment with Phase 9 backend).
- `jira_workflow.jpeg` (project root) — Visual reference for "All" gate semantic (D-17) and bidirectional pair-wise pattern (D-16). Study the CANCELLED/TO DO/PENDING nodes with adjacent "All" pills.

### Frontend2 Existing Code (build on top of)
- `Frontend2/components/project-detail/lifecycle-stub-tab.tsx` — Phase 11 stub. Phase 12 REPLACES content.
- `Frontend2/components/project-detail/settings-tab.tsx` — Phase 11 4-sub-tab shell. Phase 12 REPLACES the `sub === "lifecycle"` AlertBanner with the real criteria editor per D-37.
- `Frontend2/components/project-detail/timeline-tab.tsx` — Phase 11 custom SVG Gantt. Phase 12 EXTENDS with milestone flag lines per D-51.
- `Frontend2/components/my-tasks/task-row.tsx` (from Phase 11 D-32) — MTTaskRow compact component reused by D-55 History task details.
- `Frontend2/components/primitives/` — All 16 primitives (Button, Card, AlertBanner, SegmentedControl, ProgressBar, Toggle, Collapsible, Tabs, Input, Badge, Avatar, StatusDot, Kbd, Section) reused across Lifecycle + Settings + Editor.
- `Frontend2/context/auth-context.tsx` + `useAuth()` — Permission composition input for `use-transition-authority` (D-03).
- `Frontend2/lib/methodology-matrix.ts` — Phase 11 methodology lookups. Phase 12 may extend for `isKanban` helper if needed (else derive from `project.methodology`).
- `Frontend2/hooks/use-projects.ts` / `services/project-service.ts` — Pattern reference for new services/hooks.
- `Frontend2/components/project-detail/project-detail-context.tsx` — Project detail context. Lifecycle tab consumes for project, searchQuery, densityMode.

### Frontend2 New Files (non-exhaustive)

- `Frontend2/app/(shell)/workflow-editor/page.tsx` — New standalone editor page (reads `?projectId=X` query).
- `Frontend2/app/(shell)/projects/[id]/page.tsx` lifecycle-tab.tsx inlining — Replace lifecycle-stub-tab with real `<LifecycleTab project={project}/>`.
- `Frontend2/components/lifecycle/` — lifecycle-tab.tsx, summary-strip.tsx, overview-subtab.tsx, milestones-subtab.tsx, history-subtab.tsx, artifacts-subtab.tsx, phase-gate-expand.tsx, mini-metric.tsx, evaluation-report-card.tsx, criteria-editor-panel.tsx (for Settings).
- `Frontend2/components/workflow-editor/` — workflow-canvas.tsx (dynamic-imported), phase-node.tsx, phase-edge.tsx, all-gate-edge.tsx, group-cloud-node.tsx, bottom-toolbar.tsx, right-panel.tsx, selection-panel.tsx, validation-panel.tsx, flow-rules.tsx, context-menu.tsx, editor-page.tsx.
- `Frontend2/lib/lifecycle/` — graph-traversal.ts (BFS), workflow-validators.ts, cloud-hull.ts, align-helpers.ts, shortcuts.ts.
- `Frontend2/hooks/` — use-milestones.ts, use-artifacts.ts, use-phase-reports.ts, use-phase-transitions.ts, use-transition-authority.ts, use-led-teams.ts, use-cycle-counters.ts, use-editor-history.ts, use-criteria-editor.ts.
- `Frontend2/services/` — lifecycle-service.ts, phase-gate-service.ts, milestone-service.ts, artifact-service.ts, phase-report-service.ts, led-teams-service.ts.

### Backend API Endpoints (Phase 9 — all implemented)
- `POST /api/v1/projects/{id}/phase-transitions` — Phase Gate execute (Phase 9 API-01). Rate-limited 10s/user-project; Idempotency-Key cached 10 min; 409 on lock contention; 422 on criteria unmet with detail; allow_override + exceptions[] in body.
- `GET /api/v1/projects/{id}/activity?type[]=phase_transition` — Phase 9 API-02. Source for D-09 BFS input + D-11 cycle counter.
- `GET /api/v1/projects/{id}` — Full project with `process_config` JSONB. Phase 12 reads `workflow`, `phase_completion_criteria`, `enable_phase_assignment`, `cycle_label`, `backlog_definition`.
- `PATCH /api/v1/projects/{id}` — Updates `process_config` (including workflow JSON, criteria, enable_phase_assignment). Backend validates via Pydantic WorkflowConfig (Phase 9 D-54). Phase 12 v2 schema bump adds new `WorkflowEdge` fields.
- `GET /api/v1/projects/{id}/milestones` + POST + PATCH + DELETE (Phase 9 API-07).
- `GET /api/v1/projects/{id}/artifacts` + POST + PATCH + DELETE (Phase 9 API-08).
- `PATCH /api/v1/artifacts/{id}/mine` — assignee-only update path (Phase 9 D-36 split URL).
- `GET /api/v1/projects/{id}/phase-reports` + POST + PATCH + DELETE (Phase 9 API-09).
- `GET /api/v1/phase-reports/{id}/pdf` — Phase 9 D-58 fpdf2 sync PDF (30s rate limit, Phase 9 D-51).
- `GET /api/v1/users/me/led-teams` — Phase 9 D-17. Returns teams user leads + their project memberships. Feeds `use-transition-authority` team-leader branch (D-03).
- `GET /api/v1/tasks/project/{id}?phase_id=X&status=done` — Phase 9 API-05 phase_id filter. Powers D-55 History task details.
- `POST /api/v1/projects/{id}/criteria` + PATCH — Phase 9 API-06 CRUD for phase completion criteria (composed into PATCH /projects/{id} process_config, or dedicated sub-route — verify during plan).

### Backend Extension (Phase 12 scope)
- **Extend `WorkflowEdge` Pydantic model** with `bidirectional: bool = False` + `is_all_gate: bool = False` optional fields. Normalizer v1→v2 migration: iterate `workflow.edges`, add defaults (Phase 9 D-32 pattern).
- **Extend `ExecutePhaseTransitionUseCase`** to honor `bidirectional` + `is_all_gate` in transition validation. If `is_all_gate=true` edge points to target, source-check bypassed (still check source is non-archived, project-local).
- Update `Backend/app/domain/services/process_config_normalizer.py` with `_migrate_v1_to_v2` method.

### Design Source Documents (intent)
- `tasarım.md` §Lego Mimari (lines 722-1073) — Methodology-agnostic architecture. Phase 12 UI decisions must respect: `workflow.mode` drives behavior, NOT `project.methodology`. No hardcoded methodology branches in feature logic (exception: D-59 Kanban sub-tab visibility is a cosmetic methodology branch, acceptable per prototype).
- `tasarım.md` §Ortak Bileşenler (lines 667-720) — PhaseMetrics, PhaseCard, ActivityTimeline, CompletionChecklist component signatures to match.
- `UI-Tasarim-Backend.md` §4 Graph Traversal — backend helper for Phase Gate (D-09 frontend pure fn approach; backend still does its own validation per Phase 9 D-54/D-55).
- `UI-Tasarim-Backend.md` §5 Workflow Veri Yapısı — shape reference for WorkflowConfig. Extended by D-18 schema v2.
- `UI-Tasarim-Backend.md` §6 Faz Geçişi — Phase Gate behavior spec.
- `UI-TASARIM-PLANI.md` §4 Phase Gate Inline Expand (lines 193-212) — authoritative UX behavior.
- `UI-TASARIM-PLANI.md` §5 Faz Tamamlanma Kriterleri (lines 216-226) — Settings > Lifecycle criteria editor spec.
- `UI-TASARIM-PLANI.md` §Metodoloji Davranış Özeti (lines 660-675) — per-methodology lifecycle visibility. Methodology-agnostic architecture supersedes per-methodology hardcoding except for the Kanban sub-tab visibility exception (D-59).

### Project Context
- `.planning/REQUIREMENTS.md` — LIFE-01..07 + EDIT-01..07 formal requirements + traceability table.
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules.
- `.planning/codebase/CONVENTIONS.md` — Naming conventions (snake_case files, PascalCase classes, I-prefix interfaces, DTO suffix).
- `.planning/codebase/STACK.md` — Tech stack baseline (FastAPI, SQLAlchemy async, Next.js 14 → 16, React 19).
- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — All Phase 9 D-01..D-60 decisions; Phase 12 references D-02, D-03, D-04, D-05, D-06, D-07, D-12, D-17, D-18, D-21, D-22, D-24, D-25, D-29, D-32, D-36, D-41, D-44, D-50, D-51, D-54, D-55, D-58.
- `.planning/phases/11-task-features-board-enhancements/11-CONTEXT.md` — Phase 11 decisions; Phase 12 references D-10, D-11, D-32 (MTTaskRow compact), D-36 (TipTap SSR pattern), D-40 (enable_phase_assignment read location), D-51 (chip picker).
- `Frontend2/CLAUDE.md` + `Frontend2/AGENTS.md` — "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices." Applies to React Flow SSR work (D-07).
- `jira_workflow.jpeg` (project root) — Visual reference for "All" gate (D-17) + bidirectional pair-wise (D-16).

### Research Items (for gsd-phase-researcher)
- **React Flow v12+ theming guide**: Custom node/edge renderers with CSS-variable-driven tokens (oklch); disabling default node/edge visuals; controlling handle positions and ids; parent-child node grouping; minimap customization; pan/zoom controls theming; SSR/dynamic-import pattern for Next.js 16.
- **Concave-hull algorithm for group cloud (D-22)**: Candidate libraries (`concaveman`, `concave-hull`, `d3-polygon` + smoothing) vs. a simple convex-hull + padding baseline. Benchmark for <50 nodes, React render cost.
- **Schema version normalizer v1→v2 migration (D-18)**: Concrete Pydantic validator implementation that extends `WorkflowEdge` on read without breaking existing workflows. Tests must cover: edge without fields → defaults applied; edge with both fields → unchanged; mixed workflow with some edges versioned and some not.
- **Jira "All" gate pattern (D-17)**: Validate that any-source transition semantic is correctly wired through Phase Gate use case. Backend test: is_all_gate=true edge with target=N; transition request from random non-archived node → allowed.
- **Canvas skeleton design**: Prototype-faithful loading placeholder for `dynamic({ ssr: false, loading: ... })` — not a blank box.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All 16 Frontend2 primitives** — Used extensively across Lifecycle + Editor + Settings (Button, Card, AlertBanner, SegmentedControl, ProgressBar, Toggle, Collapsible, Tabs, Input, Badge, Avatar, StatusDot, Kbd, Section).
- **MTTaskRow compact (Phase 11 D-32)** — Reused for D-55 History task details. Located at `Frontend2/components/my-tasks/task-row.tsx`.
- **Phase 11 Timeline SVG Gantt** — Extended for D-51 milestone flag lines (additive prop, no rearchitecture).
- **ConfirmDialog (Phase 10 D-25)** — Reused for methodology-change block, milestone/artifact delete confirms, workflow-editor dirty-save intercept.
- **ToastProvider (Phase 10 D-07)** — Success/error toasts for save flows, PDF download, phase transitions.
- **useAuth() (Phase 10)** — Composed into `use-transition-authority` hook (D-03).
- **Phase 9 `process_config_normalizer`** — Extended with v1→v2 migration for D-18. Pattern well-established.
- **fpdf2 PDF service (Phase 9 D-58/D-59)** — Used as-is by D-58 direct-download flow.
- **TanStack Query v5** — Extensive use for caching milestones/artifacts/phase-reports/activity, 5min staleTime for led-teams, cache invalidation on mutation.

### Established Patterns
- **`"use client"` directive** on interactive components.
- **Named exports** (`export function X`).
- **`@/` path alias**.
- **Inline styles with CSS tokens** — `style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--border)" }}`. Preserved for all Phase 12 custom renderers.
- **Axios + interceptors** from Phase 10.
- **TanStack Query invalidation** after mutations.
- **Optimistic updates** — `setQueryData` + rollback on error (Phase 11 D-38 pattern).
- **Form validation** — minimal; button disabled until required fields set.
- **Turkish-first strings with T() / useApp().language helper**.
- **Dynamic import with `ssr: false`** — Established by Phase 11 D-36 TipTap; reused for React Flow (D-07).
- **Phase 9 normalizer on_read** — `@model_validator(mode='before')` on `Project` entity (Phase 9 D-32). Pattern replicated for v2 schema bump (D-18).
- **Service layer + hooks layer** — Phase 10/11 pattern (services/*.ts calls axios; hooks/use-*.ts wraps TanStack Query).
- **Error code taxonomy** — Phase 9 convention: `{ error_code: "PHASE_GATE_LOCKED", detail: "..." }`. Phase 12 UI reads `error_code` for exact matching + `detail` for display.

### Integration Points
- **`Frontend2/app/(shell)/workflow-editor/page.tsx`** — NEW route. Reads `?projectId=X` query; redirects to `/projects` if missing. Mounts `<WorkflowEditor project={project}/>` with React Flow canvas (dynamic-imported).
- **`Frontend2/app/(shell)/projects/[id]/page.tsx`** — MODIFIED. Replace `<LifecycleStubTab/>` with `<LifecycleTab project={project}/>`.
- **`Frontend2/components/project-detail/settings-tab.tsx`** — MODIFIED. Replace `sub === "lifecycle"` AlertBanner with `<LifecycleSettingsSubtab project={project}/>` real editor (D-37).
- **`Frontend2/components/project-detail/timeline-tab.tsx`** — MODIFIED. Accept `milestones` prop; render vertical flag lines per D-51.
- **`Frontend2/components/project-detail/settings-general-subtab.tsx`** — MODIFIED. Metodoloji field switched to read-only display + tooltip per D-60.
- **`Backend/app/domain/services/process_config_normalizer.py`** — MODIFIED. Add `_migrate_v1_to_v2` method.
- **`Backend/app/domain/entities/workflow.py`** (or equivalent) — MODIFIED. `WorkflowEdge` gains optional `bidirectional: bool = False` + `is_all_gate: bool = False` fields.
- **`Backend/app/application/use_cases/execute_phase_transition.py`** — MODIFIED. Honor `is_all_gate` in transition validation; honor `bidirectional` when evaluating reverse transitions.
- **Root layout `Frontend2/app/layout.tsx`** — No changes (existing providers cover all Phase 12 needs).

### Cross-File Dependency Rules
- React Flow canvas is dynamically imported (D-07). Never imported statically in an SSR page.
- `use-transition-authority` hook is the single source of truth for permission gating. Components do NOT re-implement the 3-role check.
- `graph-traversal.ts` + `workflow-validators.ts` are **pure functions** — no React, no API calls. Import anywhere (server components, client components, unit tests).
- Workflow schema version bump (D-18) must ship before any edge UI that writes `bidirectional` / `is_all_gate` — otherwise old backends reject the payload. Plan order must respect this: backend change in Plan 08 or 09, UI consumers in Plan 09 or 10.

</code_context>

<specifics>
## Specific Ideas

- **Jira workflow "All" gate** (D-17): target-side pill with `T('Hepsi', 'All')` adjacent to the edge's target node, source handle hidden. Matches Jira visual convention. Backend treats it as "source=any non-archived node". Phase Gate accepts transitions from any source if an `is_all_gate=true` edge points to the target.
- **Bidirectional pair-wise semantic** (D-16): `A↔B` + `B↔C` does not imply `A↔C`. Phase Gate validation looks only at direct edge existence, never transitive closure. Audit logs record the actual direction traversed.
- **Smooth cloud-shaped group visual** (D-22): User explicitly wants "a thought-bubble shape", not a sharp-edged rectangle. Concave-hull + smoothing > convex hull for visual feel. Live-morph during drag (D-23) for 60fps responsiveness.
- **Fully bidirectional "Grupla / Grubu Çöz" button + right-click context menu** (D-20, D-21): Five ways to create a group; same button flips labels based on selection state. Right-click mirrors via context menu.
- **"AI öner" button kept visually as "Yakında" placeholder** (D-33): Design fidelity preserved; no broken interaction. v3.0 candidate for actual AI suggestion integration.
- **V-Model workflow has vertical verification edges** (from `New_Frontend/src/data.jsx` EXTRA_LIFECYCLES). Requires 4-way handles (D-12) — top/bottom handles for the verification arrows; left/right for the main flow arrows. 2-way handles fail here.
- **Spiral workflow has feedback edges** (from same source): feedback edges exempt from cycle check (Phase 9 D-55 + D-19 rule 5).
- **Settings > Lifecycle "Kriterleri düzenle →" link deep-links into Settings tab** with `?phase={phase_id}` query for auto-scroll. Phase Gate inline expand uses this when the user clicks the link from within the gate.
- **Methodology change is forbidden in Phase 12** (D-60) but the deferred-items list captures that a manual mapping wizard may land in v2.1. User explicitly asked to note this ("note al").
- **Milestones appear on the Gantt as vertical flag lines** (D-51) — small additive extension to Phase 11's custom SVG Gantt. Not a new library.
- **Cycle counter badge only visible when count ≥ 2** (D-47): avoids visual clutter for single-cycle projects (Scrum/Waterfall).
- **Prototype's `OverviewSubTab` is ported ~200 lines verbatim** (D-48): the metric card layout and "Yaklaşan Teslimler" pattern are expected to match exactly.

</specifics>

<deferred>
## Deferred Ideas

### Pushed to v2.1 / Phase 13+

- **Methodology change with manual mapping wizard** (D-60 note al): User → new methodology → wizard: "Eski fazlarınızı yeni fazlara eşleştirin (nd_old1 → nd_new1)". Also maps board columns and task statuses. Rare use case; ~2-3 plan cost. Implement only when real users hit the pain.
- **Full dagre/ELK auto-layout algorithm** (D-28 note — "basit grid snap- align layout - daha detaylı bir tasarım daha sonra olabilir"): Current Phase 12 ships grid-snap + 5 align helpers; full "Auto-arrange" button calling dagre/ELK deferred.
- **Workflow merge-resolution UI for 409 conflicts** (D-32): Current flow = "Yenile" button + manual re-apply. A diff-and-resolve UI would be nicer when two users concurrently edit.
- **WebSocket / real-time concurrent transition detection** (D-44): Current approach = optimistic + 409 + refetch. WebSocket would enable proactive UI updates; out of scope per PROJECT.md.
- **Multi-file artifact attachments** (Phase 9 D-41 deferred + Phase 12 D-52): 1 file per artifact only in Phase 12.
- **Async PDF generation job queue** (Phase 9 D-60 deferred): Sync PDF still fine for Phase 12 scope.
- **Reports page "Faz Raporları" section** (REQUIREMENTS.md REPT-04): Phase 12 delivers inline PhaseReport create/edit on History cards; the Reports-page aggregate section lands in Phase 13.

### Pushed to Phase 13

- **Activity tab content** (PROF-01 timeline with icons, filters, pagination). Phase 12 stub (Phase 11 placed it) stays.
- **User Profile pages** (PROF-02..04). Phase 12 untouched.
- **All reporting charts** (REPT-01..04): CFD, Lead/Cycle Time, Iteration Comparison. Phase 12 untouched.
- **AI-powered workflow suggestion** (D-33 "AI öner" button): placeholder only in Phase 12. Actual implementation is v3.0 per PROJECT.md Out of Scope.

### Bulk Edit / Advanced Editor Features

- **Keyboard shortcuts beyond core 8** (D-35): Cmd+D duplicate, Cmd+G group, arrow-key move, Shift+arrow 10px move are included but "Advanced shortcuts panel" UI is deferred.
- **Edge path routing algorithms** (orthogonal, smooth step, etc.): React Flow default bezier is used; user-configurable routing per edge deferred.
- **Node collapse / expand (parent-child hierarchy beyond groups)**: Nested workflow nodes (a node that contains a sub-workflow) not in scope.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 12 scope per STATE.md (2026-04-23 snapshot) and `gsd-sdk todo.match-phase 12` returned zero matches.

### Cross-phase scope flags (Phase 13 must address)

- **Activity tab content needs phase-transition entries**: Phase 9 audit_log writes them; Phase 12 consumes for cycle counter (D-11); Phase 13 renders them in the Activity tab timeline.
- **User Profile projects list** should honor `project.status NOT IN ('ARCHIVED')` per Phase 9 D-49 default. Phase 12 does not touch this.
- **Reports page Phase Reports section** (REPT-04) reads from `GET /phase-reports` across all projects user has access to. Phase 12 only creates/edits reports; aggregate display is Phase 13.

</deferred>

---

*Phase: 12-lifecycle-phase-gate-workflow-editor*
*Context gathered: 2026-04-24*
