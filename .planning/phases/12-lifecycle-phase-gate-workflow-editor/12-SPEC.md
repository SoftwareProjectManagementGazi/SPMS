# Phase 12: Lifecycle, Phase Gate & Workflow Editor — Specification

**Created:** 2026-04-25
**Ambiguity score:** 0.07 (gate: ≤ 0.20)
**Requirements:** 14 locked

## Goal

Replace the Phase 11 Lifecycle/Settings>Lifecycle/Workflow-editor stubs with a fully functional lifecycle experience: a 4-sub-tab Lifecycle tab (Overview/Milestones/History/Artifacts) with read-only canvas and inline Phase Gate, a Settings > Yaşam Döngüsü criteria editor with `enable_phase_assignment` toggle, and a standalone `/workflow-editor?projectId=X` page built on React Flow that supports flow/verification/feedback edge types, swimlane groups, sequential-flexible mode, BFS-driven node state with parallel actives, per-node cycle counter badges, and Incremental/Evolutionary/RAD preset templates.

## Background

Phase 9 already shipped every backend dependency: Phase Gate endpoint with advisory lock + idempotency + criteria evaluation, Milestone/Artifact/PhaseReport CRUD + PDF export, activity feed, `process_config` JSONB with `schema_version` normalizer, WorkflowConfig Pydantic validation, `enable_phase_assignment` toggle, `phase_completion_criteria` storage, `users/me/led-teams` for team-leader permission, and 4-mode workflow support (`flexible`, `sequential-locked`, `continuous`, `sequential-flexible`).

Phase 11 placed three stubs that Phase 12 must replace:
- `Frontend2/components/project-detail/lifecycle-stub-tab.tsx` — single AlertBanner "Bu sekme Faz 12'de aktive edilecek."
- `Frontend2/components/project-detail/settings-tab.tsx` `sub === "lifecycle"` branch — same AlertBanner stub.
- The Settings > İş Akışı sub-tab already shows a "Workflow Editörünü Aç" button linking to `/workflow-editor?projectId={id}`, but the route itself does not exist.

The HTML prototype (`New_Frontend/src/pages/lifecycle-tab.jsx` 500 lines + `workflow-editor.jsx` 313 lines) is the visual authority — Frontend2 must reproduce its visual output 1:1 using existing Frontend2 primitives (no shadcn/ui, no copy from old `Frontend/`).

The backend `WorkflowEdge` Pydantic model (`Backend/app/application/dtos/workflow_dtos.py:24-29`) currently has only `{ id, source, target, type, label }`. Phase 12 introduces two new optional edge fields (`bidirectional: bool = False`, `is_all_gate: bool = False`). Because the project has zero production users in v2.0 and no live data exists outside the seeder + tests, the new fields ship as additive Pydantic defaults with a seeder update only — **no `_migrate_v1_to_v2` normalizer is written, no `CURRENT_SCHEMA_VERSION` bump is required**. Any pre-existing in-memory or test workflows whose edges lack the new fields are read correctly because Pydantic uses the field defaults.

## Requirements

1. **LIFE-01 — Phase completion criteria editor**: Per-phase auto + manual completion criteria editable in Settings > Yaşam Döngüsü.
   - Current: Settings > Yaşam Döngüsü shows AlertBanner stub "Bu sekme Faz 12'de aktive edilecek." `process_config.phase_completion_criteria` JSONB exists in backend but no UI reads or writes it.
   - Target: Sub-tab renders a left-side phase picker (iterates `workflow.nodes`, skips archived) and a right-side editor for the selected phase. Editor shows three Toggle primitives for auto criteria (`all_tasks_done`, `no_critical_tasks`, `no_blockers`) and a dynamic manual-criteria list (Input + Add button + per-row delete X). A sibling block at the top of the sub-tab exposes the project-level `enable_phase_assignment` Toggle. Save → PATCH `/projects/{id}` with `process_config.phase_completion_criteria[phase_id] = { auto: {...}, manual: [...] }`. Phase 11 D-11 stub is deleted.
   - Acceptance: For a SCRUM project with workflow.nodes=[planning, execution, closure], the user opens Settings > Yaşam Döngüsü, selects "execution", toggles `all_tasks_done=true`, adds a manual criterion "QA imza", clicks Kaydet; reloading the page restores the same state; GET `/projects/{id}` returns the saved criteria. The `enable_phase_assignment` Toggle persists independently.

2. **LIFE-02 — Phase Gate inline expand**: "Sonraki Faza Geç" button in the Lifecycle summary strip opens an inline panel that submits a phase transition.
   - Current: Lifecycle tab is the AlertBanner stub. No Phase Gate UI exists. Backend `POST /projects/{id}/phase-transitions` is fully implemented.
   - Target: When the user clicks "Sonraki Faza Geç", a panel expands between the summary strip and the canvas containing: current→next phase header; task summary (Toplam/Tamamlanan/Açık); auto criteria with check icons; manual criteria with checkboxes + a "Kriterleri düzenle →" deep link to Settings > Yaşam Döngüsü with `?phase={id}`; an "Açık Görevler" SegmentedControl ("Sonraki faza taşı"/"Backlog'a taşı"/"Bu fazda bırak") + "Farklı davranış gerekli?" Collapsible listing every open task with a per-row mini dropdown (Aynı/Sonraki/Backlog/Kalsın); a 500-char transition note textarea with live counter; AlertBanner for mode warnings; "Faz Geçişini Onayla" submit button + a conditional "Zorla Geç" override checkbox visible only when criteria fail in `sequential-locked` mode. Submit sends `Idempotency-Key` (UUID generated on panel open), `allow_override`, `exceptions[]`, and `note`. The button is hidden when `use-transition-authority` returns `false` and when `workflow.mode === 'continuous'` (Kanban).
   - Acceptance: On a Waterfall project with all auto criteria satisfied, clicking "Sonraki Faza Geç" → panel opens → "Faz Geçişini Onayla" → toast "Geçiş tamam" + active phase badge updates to next node + activity feed includes a new `phase_transition` row. On a `sequential-locked` project with unmet criteria, the override checkbox appears, submit relabels to "Zorla Geç", and a successful submit records `override_used:true` in the audit log.

3. **LIFE-03 — Zero-task phase handling**: Phases with no tasks show "---" metrics and "Uygulanamaz" gate criteria.
   - Current: No phase metric rendering exists in Frontend2; prototype's `phaseStats.total===0` branch is the visual reference.
   - Target: When `phaseStats.total === 0` for a node: the Overview sub-tab MiniMetric values (Toplam/Tamamlanan/Devam/İlerleme) render `---` in mono font; the Phase Gate auto-criteria checklist renders each item as "Uygulanamaz" + grey Circle icon; an `info` AlertBanner above the gate panel reads "Bu fazda henüz görev yok. Geçiş serbestçe yapılabilir."; submit requires only manual criteria + note (auto-criteria are bypassed in the request body).
   - Acceptance: Create a project, do not create any tasks for the active phase, open the Lifecycle tab → MiniMetrics show `---`; open Phase Gate → auto-criteria show "Uygulanamaz"; submit with note only succeeds.

4. **LIFE-04 — History sub-tab task detail Collapsible**: Past phase cards expand to show their done tasks via the MTTaskRow compact component.
   - Current: No History sub-tab exists in Frontend2. Phase 11 D-32 ships `Frontend2/components/my-tasks/task-row.tsx` (MTTaskRow compact) but it is not yet reused outside MyTasks.
   - Target: Each card in the History sub-tab carries a Collapsible labeled "Görev Detayları (N)". On first expand, TanStack Query lazy-fetches `GET /api/v1/tasks/project/{id}?phase_id=X&status=done` (cache key `['tasks','project',projectId,{phase_id}]`); subsequent re-opens hit the cache. Tasks render through `task-row.tsx` in compact mode (key + title + status dot + assignee + due date).
   - Acceptance: For a project with 2 closed phases, each having 3 done tasks, the History sub-tab shows 2 cards with "Görev Detayları (3)" Collapsibles. First click on a Collapsible triggers a network request; subsequent toggles do not.

5. **LIFE-05 — Milestone sub-tab**: List, create, edit, and delete milestones with status badges, ProgressBar, and Timeline integration.
   - Current: Milestone CRUD endpoints exist (Phase 9 API-07). No frontend integration.
   - Target: Sub-tab fetches `GET /api/v1/projects/{id}/milestones` and renders a list of cards (name + target date + status chip + ProgressBar derived from linked phases). "Ekle" button reveals an inline add row (name Input + target-date Input + multi-select chip picker for `linked_phase_ids` sourced from non-archived `workflow.nodes`) with Kaydet/İptal buttons. Edit mode opens inline on existing cards. Delete is gated by ConfirmDialog. Milestones are also rendered as vertical flag lines on the Phase 11 Timeline tab Gantt by passing a new `milestones` prop to `timeline-tab.tsx` — clicking a flag opens a popover with name + status + days-remaining + linked phases.
   - Acceptance: Create a milestone "Alpha Launch" linked to phase `planning`, due in 12 days. The Milestone sub-tab shows a card with the new milestone; the Timeline tab Gantt displays a vertical labeled line at the target date; deleting the milestone removes both the card and the flag line.

6. **LIFE-06 — Artifact sub-tab**: List methodology-default artifacts, edit status, attach a file, and add custom artifacts.
   - Current: Artifact CRUD endpoints exist (Phase 9 API-08); `ArtifactSeeder` runs on project create (Phase 9 D-28). No frontend integration.
   - Target: Sub-tab renders a row table (artefakt adı + durum chip + son güncelleme + sorumlu Avatar + more-kebab). Click row → inline expand: name Input + status SegmentedControl (Yok/Taslak/Tamam) + note textarea + "Dosya Ekle" button (single file per artifact). Single-assignee dropdown sourced from project members. Adding a custom artifact uses an inline-add pattern matching the Milestone sub-tab. PM with transition-authority can delete "not-created" artifacts; in-progress artifacts surface a soft warning before delete. Methodology change is a no-op on existing artifacts (Phase 9 D-29 preserved).
   - Acceptance: Create a Scrum project — artifact rows for "Sprint Planı / Sprint Backlog / Daily Notes / Sprint Review / Retrospective" appear (sourced from `ProcessTemplate.default_artifacts`). Click "Sprint Planı" → expand → upload a file → status SegmentedControl flips to "Tamam" → save → reloading the page persists status and file link.

7. **LIFE-07 — Evaluation Report inline expand + PDF**: Past phase cards expand to a hybrid auto-prefill / PM-editable evaluation report with PDF download.
   - Current: PhaseReport CRUD + sync PDF export exist (Phase 9 API-09 + D-58 fpdf2). No frontend integration.
   - Target: Each History card carries a "Rapor" button. Click → inline expand: read-only summary fields (`summary_task_count`, `summary_done_count`, `summary_moved_count`, `summary_duration_days`) pre-filled from `GET /api/v1/projects/{id}/phase-reports`; free-text textareas for `issues`, `lessons`, `recommendations` start empty with placeholder copy; Save → PATCH `/phase-reports/{id}` with backend auto-incrementing `revision`. "PDF" button → `GET /phase-reports/{id}/pdf` Blob download with filename `Phase-Report-{project-key}-{phase-slug}-rev{N}.pdf`; button enters loading state ("PDF oluşturuluyor…" + disabled + spinner); 429 surfaces "30 saniye bekleyin" toast; success surfaces "PDF indirildi".
   - Acceptance: Open a closed phase's "Rapor" → summary fields populated, free text empty → type "API yanıt süresi gecikti, Redis cache ile çözüldü." into "issues" → save → reload → text persists, `revision` incremented in payload. Click "PDF" → file downloads with the expected filename pattern.

8. **EDIT-01 — Edge types (flow/verification/feedback)**: Workflow edges support three types with distinct visuals and right-panel selection.
   - Current: `WorkflowEdge.type` is a `Literal["flow","verification","feedback"]` in the backend. No frontend editor exists.
   - Target: Custom React Flow edge renderer paints `flow` solid (`var(--fg-subtle)`), `verification` dashed `6 3` (`var(--status-progress)`), `feedback` dashed `8 4 2 4` (`var(--status-review)`). Right side panel shows a 3-option SegmentedControl for the selected edge's `type`. Saving writes the type back through PATCH `/projects/{id}` `process_config.workflow.edges[i].type`.
   - Acceptance: Open `/workflow-editor?projectId=X`, click an edge, switch its type to `verification` via the SegmentedControl → stroke updates immediately; click Save → reload → edge stays `verification`.

9. **EDIT-02 — Swimlane groups (cloud-shaped)**: Nodes can be grouped into smooth cloud-shaped containers via 5 entry points.
   - Current: `WorkflowGroup` Pydantic model exists with `{ id, name, x, y, width, height, color }`. No frontend grouping UI.
   - Target: Five group-creation methods are wired: drag-rectangle on empty canvas (Grup mode crosshair), Shift+click multi-select + "Grup" button, drag a loose node into an existing group, multi-select group + node + "Grup", and right-click context menu "Grupla". The group visual is a smooth cloud-shaped SVG path (concave-hull or convex-hull-plus-padding fallback) recomputed on every drag frame. Groups carry `{ id, type:'group', name, color, children: [nodeIds] }`; nodes inside have `parentId` pointing to the group. The "Grup" button toggle-labels to "Grubu Çöz" when the selection is already a group; the same toggle is mirrored in the right-click menu.
   - Acceptance: Multi-select two non-grouped nodes → click "Grup" → cloud-shaped path encloses both nodes → drag one node, the cloud morphs in real time without snap-to-hull → click the group → button label flips to "Grubu Çöz" → click → group is dissolved, both nodes are loose again. Save persists `groups[]` and `parentId` references.

10. **EDIT-03 — sequential-flexible mode**: 4th workflow mode allowing sequential progression with defined feedback returns.
    - Current: Backend Pydantic model accepts `Literal["flexible", "sequential-locked", "continuous", "sequential-flexible"]` and validates that flow-type edges form no cycles in this mode (`workflow_dtos.py:78-83`). No frontend UI surfaces the option.
    - Target: Workflow Editor mode SegmentedControl exposes the 4 options with localized labels (Esnek/Sıralı·kilitli/Sürekli/Sıralı·esnek). Selecting `sequential-flexible` wires the Phase Gate use case to permit forward transitions OR feedback-typed edge transitions, but blocks backward flow-typed transitions. The validator panel surfaces a blocking error if flow edges form a cycle in this mode (`workflow_validators.ts` rule 5).
    - Acceptance: Switch a project to `sequential-flexible` mode in the editor → save → in Phase Gate, the user can transition forward via a flow edge AND can return to a previous node via a feedback edge → activity feed records both transitions.

11. **EDIT-04 — BFS-driven node state computation**: Active/past/future/unreachable node states derive from a graph traversal, not a hardcoded index.
    - Current: Prototype uses `phaseMap = { initiation: 0, planning: 1, ... }` (`lifecycle-tab.jsx:17`) — a hardcoded dictionary. No traversal logic exists in Frontend2.
    - Target: `Frontend2/lib/lifecycle/graph-traversal.ts::computeNodeStates(workflow, phaseTransitions) → Map<nodeId, 'active'|'past'|'future'|'unreachable'>` is a pure function with no React or HTTP dependency. It consumes the workflow JSON + the list of `phase_transition` entries from `GET /projects/{id}/activity?type[]=phase_transition`. The result map drives node ring/dim/icon rendering in both the LifecycleTab read-only canvas and the editable Workflow Editor.
    - Acceptance: Unit-test suite passes: linear chain (`A→B→C` with one transition `A→B`) returns `{A:past, B:active, C:future}`; disconnected node `D` returns `{D:unreachable}`; bidirectional edge with two transitions back-and-forth returns the latest active node correctly; benchmark with 100 nodes runs under 50 ms.

12. **EDIT-05 — Parallel active phases**: Multiple nodes can carry the "active" ring simultaneously.
    - Current: Hardcoded index allows exactly one active phase. No parallel-actives logic exists.
    - Target: A node is `active` if (a) it is the head of an uncompleted forward chain, OR (b) a feedback edge has returned control to it. `flexible` and `sequential-flexible` modes can produce multiple actives; `sequential-locked` and `continuous` always produce exactly one. Encoded in the BFS function. Both LifecycleTab canvas and editor render every active node with the primary-tone ring; cycle counter badges (EDIT-06) augment the visual when applicable.
    - Acceptance: Load a V-Model project (EXTRA_LIFECYCLES) with simultaneous "Module Design" + "Unit Test" actives → both nodes render with the active ring → switch the project to `sequential-locked` → only the latest single active remains highlighted.

13. **EDIT-06 — Cycle counter badge (×N)**: Repeating phase transitions show a counter at the node's top-right corner.
    - Current: No counter exists. Backend audit log records every transition with `extra_metadata->>'source_phase_id'`.
    - Target: `useCycleCounters(projectId)` hook calls `GET /projects/{id}/activity?type[]=phase_transition`, groups by `metadata.source_phase_id`, returns `Map<nodeId, number>`. Badge `<span className="badge xN">×N</span>` is absolutely positioned at top-right of the node, visible only when count ≥ 2; hover tooltip in Turkish "Bu faz N kere kapatıldı (Spiral/iterative döngüleri)". Same component is used in both LifecycleTab and Workflow Editor canvases.
    - Acceptance: Spiral project with 3 closures of phase `risk-analysis` → node displays `×3` badge in the top-right corner; hover shows the Turkish tooltip; counter updates after a new closure without a manual refresh (TanStack invalidation on transition).

14. **EDIT-07 — Incremental/Evolutionary/RAD preset templates**: 3 new starter workflows selectable from the editor's preset menu.
    - Current: Only Scrum/Waterfall/Kanban defaults exist (`DEFAULT_LIFECYCLES` in prototype `data.jsx`). V-Model + Spiral exist as `EXTRA_LIFECYCLES` but are not exposed.
    - Target: The editor's "Şablon Yükle" / preset menu adds three entries (Artırımlı/Evrimsel/RAD) with prebuilt nodes + edges + groups + mode that satisfy the validator. Selecting a preset replaces the canvas state (with dirty-save guard prompting if unsaved changes exist).
    - Acceptance: Open the editor on an existing project, click "Şablon Yükle" → "Artırımlı" → ConfirmDialog "Mevcut değişiklikler kaybolacak..." → confirm → canvas swaps to the Incremental layout → click Save → GET `/projects/{id}` returns the new workflow.

## Boundaries

**In scope:**
- LifecycleTab component replacing `lifecycle-stub-tab.tsx` with summary strip + canvas + 4 sub-tabs (Overview/Milestones/History/Artifacts) + Phase Gate inline expand
- Settings > Yaşam Döngüsü sub-tab replacing the AlertBanner stub with the criteria editor + `enable_phase_assignment` toggle
- Standalone `/workflow-editor?projectId=X` page with React Flow canvas, custom node + edge renderers, right side panel, bottom toolbar, validation panel, undo/redo, dirty-save guard, presets, save-flow with full error matrix
- `WorkflowCanvas` shared primitive (readOnly toggle) used by LifecycleTab and Editor
- 7 services + 7 hooks (`lifecycle-service.ts`, `phase-gate-service.ts`, `milestone-service.ts`, `artifact-service.ts`, `phase-report-service.ts`, `led-teams-service.ts`, plus `use-milestones`, `use-artifacts`, `use-phase-reports`, `use-phase-transitions`, `use-transition-authority`, `use-led-teams`, `use-cycle-counters`, `use-editor-history`, `use-criteria-editor`)
- Pure-logic libraries (`lib/lifecycle/graph-traversal.ts`, `lib/lifecycle/workflow-validators.ts`, `lib/lifecycle/cloud-hull.ts`, `lib/lifecycle/align-helpers.ts`, `lib/lifecycle/shortcuts.ts`)
- Backend additive change: extend `WorkflowEdge` Pydantic model with `bidirectional: bool = False` + `is_all_gate: bool = False`; extend `ExecutePhaseTransitionUseCase` to honor both fields; update `Backend/app/infrastructure/database/seeder.py` so newly seeded projects emit the new fields with defaults — no normalizer migration, no `CURRENT_SCHEMA_VERSION` bump
- Phase 11 Timeline tab Gantt receives a `milestones` prop and renders vertical flag lines + popover (additive change, no rearchitecture)
- Settings > General `methodology` field becomes read-only display + info tooltip
- Manual UAT click-through checklist for every requirement + Playwright E2E smoke specs for the two highest-risk golden flows (Phase Gate transition + Workflow Editor save)
- Unit + integration tests for pure logic (BFS traversal, workflow validators, cycle counter aggregation, criteria CRUD round-trip, schema additive read)

**Out of scope:**
- Activity tab content (Phase 13, PROF-01 — Phase 12 ships only the activity feed *consumer* for cycle counters)
- User Profile pages (Phase 13, PROF-02..04)
- Reporting charts CFD / Lead-Cycle / Iteration Comparison (Phase 13, REPT-01..03)
- Reports page "Faz Raporları" aggregate section (Phase 13, REPT-04 — Phase 12 ships only inline PhaseReport CRUD on History cards)
- Methodology change mapping wizard (deferred to v2.1; Phase 12 hard-blocks methodology change with a read-only field)
- Full dagre/ELK auto-layout button (Phase 12 ships grid-snap + 5 align helpers only)
- Workflow merge-resolution UI for 409 concurrent-edit conflicts (Phase 12 surfaces an AlertBanner + "Yenile" button only)
- WebSocket / real-time concurrent transition detection (Phase 12 uses optimistic + 409 + refetch only)
- Multi-file artifact attachments (Phase 12 supports 1 file per artifact)
- Async PDF generation queue (Phase 12 uses sync fpdf2 from Phase 9)
- AI-powered workflow suggestion engine (`AI öner` button is a "Yakında" placeholder badge, real implementation v3.0)
- Mobile / tablet Workflow Editor support — editor requires viewport ≥ 1024px; below that the page renders a "Workflow editörü 1024px+ ekran gerektirir." fallback
- `_migrate_v1_to_v2` normalizer / `CURRENT_SCHEMA_VERSION` bump — there are zero production users in v2.0, so the additive Pydantic field defaults plus a seeder update are sufficient
- Bulk operations on Backlog Panel (deferred per Phase 11 D-15)
- Edge path routing customization (React Flow default bezier only)
- Nested workflow nodes (a node containing a sub-workflow)

**Cross-phase contracts:**
- Phase 12 REPLACES the Phase 11 D-10 `LifecycleStubTab` and the Phase 11 D-11 Settings > Yaşam Döngüsü stub
- Phase 12 BUILDS the destination of the Phase 11 `/workflow-editor?projectId=X` link-out
- Phase 12 EXTENDS Phase 11's Timeline tab Gantt with a `milestones` prop
- Phase 12 CONSUMES Phase 11 D-32 `MTTaskRow compact` for History task details
- Phase 12 RESPECTS Phase 11 D-42/D-43 user-overridden `cycle_label` and `backlog_definition`

## Constraints

- **Performance (hard targets):**
  - Cloud-hull recompute on node drag holds ≥ 60 fps for workflows up to 50 nodes (≤ 16 ms per frame)
  - `computeNodeStates` BFS returns under 50 ms for a 100-node workflow on dev hardware
  - Workflow Editor first-paint after dynamic import completes within 1 s on dev hardware
- **Viewport:** Workflow Editor is desktop-only (≥ 1024 px viewport). Below 1024 px the page renders a fallback message in Turkish/English (use `useApp().language`). LifecycleTab itself stays inside the existing project detail responsive shell from Phase 11 D-54.
- **Schema additivity:** No Alembic migration. No `CURRENT_SCHEMA_VERSION` bump. New `WorkflowEdge` fields are Pydantic optional with `default=False`. `Backend/app/infrastructure/database/seeder.py` is updated so new seeded workflows emit the new edge fields explicitly.
- **SSR safety:** `WorkflowCanvas` is `dynamic({ ssr: false })` per the Phase 11 D-36 TipTap pattern. React Flow depends on `window`, `ResizeObserver`, and `getBoundingClientRect`, none of which exist in Node.js SSR.
- **Visual fidelity:** All node and edge visuals are custom-rendered with the prototype's oklch token system. React Flow's default node + edge styles are not used. No shadcn/ui imports anywhere in Phase 12 code.
- **Permission:** Phase Gate "Sonraki Faza Geç", Milestone POST/PATCH/DELETE, Artifact POST/DELETE, PhaseReport CRUD, and Workflow Editor "Kaydet" all gate on a single hook (`use-transition-authority`) that returns true iff the user is Admin OR `project.manager_id === user.id` OR `users/me/led-teams` includes the project. The hook caches `staleTime: 5 * 60 * 1000`.
- **Idempotency:** Phase Gate submit sends `Idempotency-Key: <uuid>` generated once per panel-open session.
- **Backend reuse:** No new database migrations beyond the seeder update. No new entities. Phase 9 endpoints, error codes, and rate limits are reused as-is.
- **Dynamic import + accessible loading state:** The dynamic-imported canvas surfaces a prototype-styled `CanvasSkeleton` placeholder during load.

## Acceptance Criteria

- [ ] `Frontend2/components/project-detail/lifecycle-stub-tab.tsx` is removed and replaced by a real `<LifecycleTab project={project}/>` mounted from `projects/[id]/page.tsx`
- [ ] `Frontend2/components/project-detail/settings-tab.tsx` `sub === "lifecycle"` branch renders the criteria editor + `enable_phase_assignment` toggle (no AlertBanner stub)
- [ ] `Frontend2/app/(shell)/workflow-editor/page.tsx` exists, reads `?projectId=X`, redirects to `/projects` if missing, mounts the editor with React Flow loaded via `dynamic({ ssr: false })`
- [ ] Settings > General `methodology` field is read-only with an info tooltip; the field cannot be PATCHed via the UI
- [ ] All 14 requirements (LIFE-01..07 + EDIT-01..07) ship in this phase — no requirement is folded to a follow-up phase
- [ ] Backend `WorkflowEdge` Pydantic model adds `bidirectional: bool = False` + `is_all_gate: bool = False` (defaults applied on read for any edge missing the fields)
- [ ] Backend `ExecutePhaseTransitionUseCase` honors both new fields in transition validation (unit + integration tests pass)
- [ ] `Backend/app/infrastructure/database/seeder.py` produces edges that explicitly include the two new fields (with defaults `false`)
- [ ] No `_migrate_v1_to_v2` function exists; `CURRENT_SCHEMA_VERSION` remains at `1`
- [ ] No new Alembic migration is added in Phase 12
- [ ] `WorkflowCanvas` shared primitive renders identically in `readOnly={true}` (LifecycleTab) and `readOnly={false}` (editor) modes — visual diff is zero
- [ ] `lib/lifecycle/graph-traversal.ts` is a pure function with zero React or HTTP imports; unit-test suite covers linear / disconnected / cyclic / parallel-actives cases
- [ ] `lib/lifecycle/workflow-validators.ts` is a pure function returning `{ errors, warnings }`; unit-test suite covers all 5 rules
- [ ] Cycle counter badge appears at top-right of nodes only when count ≥ 2
- [ ] Drag a node in a 50-node workflow → measured frame time stays ≤ 16 ms for ≥ 95 % of frames during the drag
- [ ] `computeNodeStates` benchmark with 100 nodes returns in < 50 ms (vitest `bench` or perf-marker test)
- [ ] Editor first-paint after dynamic import completes within 1 s on dev hardware
- [ ] Editor shows a "Workflow editörü 1024px+ ekran gerektirir." (Turkish) / English equivalent fallback when viewport width < 1024 px
- [ ] Phase Gate submit sends `Idempotency-Key` UUID header; second submit within 10 min returns the cached response without re-executing
- [ ] Phase Gate `429` rate-limit response surfaces a countdown toast and re-enables the button after the countdown
- [ ] Phase Gate `409` lock surfaces "Başka bir kullanıcı aynı anda geçiş yapıyor" AlertBanner + "Tekrar Dene" button
- [ ] Phase Gate `422` criteria-unmet response renders the per-criterion failure list from `unmet[]`
- [ ] Override checkbox appears only when criteria fail in `sequential-locked` mode; the primary button relabels to "Zorla Geç" (danger tone)
- [ ] Manual UAT click-through checklist (one row per requirement, 14 total) is documented in the Phase 12 verification artifact and signed off
- [ ] Two Playwright E2E smoke specs exist and pass: (1) Phase Gate transition golden flow, (2) Workflow Editor open → drag node → switch edge type → save → reload → state persists
- [ ] No imports from `Frontend/` (old frontend) in any Phase 12 code; no shadcn/ui imports anywhere
- [ ] All user-facing strings render in Turkish + English via `useApp().language`
- [ ] All Phase 12 code commits run on Frontend2's existing build/test pipeline without regressions in pre-Phase-12 tests

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                       |
|--------------------|-------|------|--------|-----------------------------------------------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | Single-sentence goal with named deliverables                                |
| Boundary Clarity   | 0.92  | 0.70 | ✓      | 13 explicit out-of-scope items + 5 cross-phase contracts                    |
| Constraint Clarity | 0.92  | 0.65 | ✓      | Hard perf targets, viewport floor, schema additivity, permission gating     |
| Acceptance Criteria| 0.92  | 0.70 | ✓      | 27 falsifiable pass/fail checkboxes including E2E + perf + cleanup checks   |
| **Ambiguity**      | 0.07  | ≤0.20| ✓      |                                                                             |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary                                       | Decision locked                                                                                  |
|-------|----------------|--------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| 0     | (priors)       | Initial assessment from REQUIREMENTS + ROADMAP + CONTEXT | Acceptance Criteria below minimum — interview required                                            |
| 1     | Boundary Keeper| Acceptance method: manual UAT vs automated vs hybrid?   | Manual UAT click-through + 2 Playwright E2E smoke specs (Phase Gate + Editor save)                |
| 1     | Boundary Keeper| MVP cut: which slice MUST ship if phase runs long?       | All 14 requirements (LIFE-01..07 + EDIT-01..07) MUST ship — no fold-to-followup                  |
| 2     | Seed Closer    | Editor performance bar — hard target or feel-based?      | Hard targets: 60 fps drag at 50 nodes, BFS < 50 ms at 100 nodes, first-paint < 1 s on dev HW     |
| 2     | Seed Closer    | Editor mobile/tablet support?                            | Desktop-only (≥1024 px); fallback message below                                                  |
| 2     | Seed Closer    | Schema v1→v2 backcompat strictness?                      | No normalizer migration. Seeder-only update. Defaults applied via Pydantic optional fields        |

---

*Phase: 12-lifecycle-phase-gate-workflow-editor*
*Spec created: 2026-04-25*
*Next step: /gsd-discuss-phase 12 will detect SPEC.md and re-focus on implementation decisions only — note that 12-CONTEXT.md from prior discuss-phase already captures most of those decisions (D-01..D-60); the user may choose to skip discuss-phase and go straight to /gsd-plan-phase 12.*
