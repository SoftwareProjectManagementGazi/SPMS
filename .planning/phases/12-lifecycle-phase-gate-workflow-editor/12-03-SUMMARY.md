---
phase: 12
plan: 03
plan_id: "12-03"
subsystem: lifecycle-criteria-editor-and-methodology-lock
status: completed
completed_at: 2026-04-25
duration_min: 6
tasks_completed: 2
files_created: 2
files_modified: 4
tags:
  - frontend
  - lifecycle
  - settings
  - criteria-editor
  - methodology-lock
  - life-01
  - tdd
  - rtl
requirements:
  - LIFE-01
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: Consumes useCriteriaEditor (Plan 01 hook) for the per-phase draft state, useTransitionAuthority for the permission gate, and the workflow-editor Tooltip primitive for the methodology read-only info icon. Also imports apiClient + useToast — established Phase 10 patterns.
    - phase: 11
      reason: Replaces the Phase 11 D-11 Settings > Yaşam Döngüsü AlertBanner stub. Phase 11 D-60 placed methodology in Settings > General; Phase 12 D-60 is what actually locks it.
  provides:
    - id: 12-03-criteria-editor
      label: CriteriaEditorPanel — Settings > Yaşam Döngüsü real editor (LIFE-01) with phase picker + per-phase auto/manual criteria editor + project-level enable_phase_assignment Toggle
    - id: 12-03-deep-link-target
      label: Phase Gate inline-expand "Kriterleri düzenle →" deep link round-trips here via ?phase={id}
    - id: 12-03-methodology-lock
      label: Settings > General methodology field is read-only display + Tooltip per CONTEXT D-60
  affects:
    - Frontend2/components/project-detail/settings-tab.tsx (lifecycle branch swap)
    - Frontend2/components/project-detail/settings-general-subtab.tsx (methodology field added as read-only)
tech_stack:
  added: []
  patterns:
    - "useCriteriaEditor draft pattern: per-phase drafts seeded from project.processConfig.phase_completion_criteria; reset() reverts to initial; dirty flag drives İptal button enable"
    - "Independent persist contract: enable_phase_assignment Toggle PATCHes inside its own onChange handler with phase_completion_criteria preserved verbatim from project.processConfig (Test 6)"
    - "Deep-link auto-scroll: useSearchParams() reads ?phase={id}, useEffect sets active phase + 50ms-deferred scrollIntoView via scrollAnchorRef"
    - "Stable string deps for useMemo seeding (`rawNodes.map(n=>n.id).join('|') + JSON.stringify(initialCriteria)`) to avoid OOM-loop on fresh-array references — Phase 11 D-44 pattern"
    - "Permission gate: canEdit = useTransitionAuthority(project) && !isArchived; AlertBanner warning + all controls disabled when false (T-12-03-01)"
    - "Methodology read-only: METHODOLOGY_LABEL_TR/EN map covers all 7 methodologies; the editable input is REMOVED from the DOM entirely (T-12-03-02 — UI-surface tampering eliminated)"
key_files:
  created:
    - Frontend2/components/lifecycle/criteria-editor-panel.tsx
    - Frontend2/components/lifecycle/criteria-editor-panel.test.tsx
    - Frontend2/components/project-detail/settings-general-subtab.test.tsx
  modified:
    - Frontend2/components/project-detail/settings-tab.tsx
    - Frontend2/components/project-detail/settings-tab.test.tsx
    - Frontend2/components/project-detail/settings-general-subtab.tsx
decisions:
  - "Stable-string useMemo dep for seeding drafts (rawNodes.map(n=>n.id).join('|') + JSON.stringify(initialCriteria)) avoids OOM-loop from useQuery's fresh-array references — Phase 11 D-44 pattern reused"
  - "useTransitionAuthority + isArchived combine into a single canEdit boolean threaded through every interactive control; AlertBanner tone='warning' surfaces the lock state (T-12-03-01)"
  - "enable_phase_assignment Toggle persists immediately on change (PATCH on toggle, not on Save) — independent of the Kaydet button at the editor's bottom; this matches the LIFE-01 acceptance test that toggles EPA without touching per-phase criteria"
  - "PATCH body for criteria save spreads (project.processConfig ?? {}) so existing keys (workflow / backlog_definition / cycle_label / schema_version) are preserved — backend normalizer fills any missing defaults on read (Phase 9 D-32 pattern)"
  - "Methodology localized labels live module-top in settings-general-subtab.tsx (METHODOLOGY_LABEL_TR / METHODOLOGY_LABEL_EN). Lifting to lib/methodology-matrix.ts deferred until a second consumer needs them — same kept-co-located strategy as the SummaryStrip mode-chip maps in Plan 12-02."
  - "settings-tab.tsx no longer imports AlertBanner — only the lifecycle branch used it; the workflow branch still uses Card + Button + Link, none of which need AlertBanner. Removed import to satisfy TypeScript noUnusedImports."
metrics:
  duration_min: 6
  task_count: 2
  files_created: 2
  test_files_added: 1
  tests_added: 10
  full_suite_tests: 218
  full_suite_test_files: 36
---

# Phase 12 Plan 03: Criteria Editor + Methodology Lock Summary

LIFE-01 fully delivered — the Settings > Yaşam Döngüsü sub-tab now hosts a real two-column editor: a left-side phase picker (iterates `workflow.nodes`, archived phases shown with `(Arşiv)` suffix in `--fg-subtle`) and a right-side editor exposing the three auto-criteria Toggles (`all_tasks_done` / `no_critical_tasks` / `no_blockers`) plus a dynamic manual-criteria list (Input + Add + per-row delete X). A sibling `enable_phase_assignment` Toggle lives at the top of the panel and PATCHes independently of the per-phase criteria. Save → `PATCH /projects/{id}` with the full `process_config` payload preserving existing keys. The Phase Gate inline-expand "Kriterleri düzenle →" link round-trips here via `?phase={id}`, which auto-selects + smooth-scrolls the matching row. CONTEXT D-60 methodology lock shipped: Settings > General now displays methodology as a localized read-only label + info-icon Tooltip with the canonical T-12-03-02 mitigation copy; no editable input element exists in the DOM. 2 new files, 4 modifications (counting the test rewrite), 10 new RTL test cases, 218 tests pass — zero regressions vs the 208 baseline.

## What Shipped

### Task 1 — CriteriaEditorPanel (commits `46d8837` + `6ee82fb`)

`Frontend2/components/lifecycle/criteria-editor-panel.tsx` (~605 LOC) implements the UI-SPEC §5 anatomy (lines 928-986):

- **Outer Card (padding 20)** hosts the project-level `enable_phase_assignment` Toggle row. The row title `Görev–Faz Ataması` + subtitle "Açıkken görev formuna ve board kartlarına faz alanı eklenir." renders on the left; the Toggle on the right. Toggling fires `persistEPA(next)` which PATCHes `/projects/{id}` immediately with `{ process_config: { ...project.processConfig, enable_phase_assignment: next, phase_completion_criteria: project.processConfig?.phase_completion_criteria ?? {} } }`. The explicit `phase_completion_criteria` preservation satisfies the Test 6 independent-persist contract — toggling EPA never overwrites per-phase criteria with stale draft state.
- **2-column grid (220px 1fr)** below: left = phase picker, right = active-phase editor.
- **Phase picker** iterates `workflow.nodes`, normalizing snake_case + camelCase. Each row is a `<button>` with `data-phase-row={n.id}` for testability. The active row gets `background: var(--accent)` + `borderLeft: 2px solid var(--primary)` + `fontWeight: 600`. Archived rows render in `var(--fg-subtle)` with the localized `(Arşiv)` / `(Archive)` suffix. Hover swaps to `var(--surface-2)`.
- **Right editor:** when no node is active or the active node is archived, an `AlertBanner tone="info"` blocks editing. Otherwise:
  - `data-criteria-section="auto"` block with three `CriteriaToggleRow` instances (`all_tasks_done` / `no_critical_tasks` / `no_blockers`). Each row carries `data-criteria-row` for testability.
  - `data-criteria-section="manual"` block listing `draft.manual` as `<ul>` items with bullet glyph + remove button (`aria-label={T('Kriteri sil','Remove criterion')}`). Empty state renders the localized "Henüz manuel kriter eklenmedi." copy.
  - Add row at the bottom: `<Input value={addInput}/>` + `<Button icon={<Plus/>}>{T('Ekle','Add')}</Button>` (disabled when `!addInput.trim()`).
  - Bottom-right action row: `<Button variant="ghost">{T('İptal','Cancel')}</Button>` (disabled when `!editor.dirty`) + `<Button variant="primary">{T('Kaydet','Save')}</Button>`.
- **Save flow:** `apiClient.patch('/projects/' + project.id, { process_config: { ...processConfig, phase_completion_criteria: editor.drafts, enable_phase_assignment: localEPA } })`. Success → toast "Kriterler kaydedildi." + invalidate `['project', project.id]`. Error → toast with `backendErrorMessage(err)` fallback.
- **Deep-link consumption:** `useSearchParams().get('phase')` is read once; a `useEffect` whose deps include both the deep-link value and the stable-string node-id list seeds `editor.setActivePhaseId(deepLinkPhase)` and queues a `scrollIntoView({ behavior: 'smooth', block: 'center' })` via `setTimeout(50)` so the picker's render attaches `scrollAnchorRef` before the scroll. The Plan 12-02 Phase Gate inline-expand "Kriterleri düzenle →" button targets `/projects/{id}?tab=settings&sub=lifecycle&phase={id}` and lands here. The deep-link round-trip is verified end-to-end.
- **Permission gate:** `canEdit = useTransitionAuthority(project) && !isArchived`. When false: top-of-panel `AlertBanner tone="warning"` "Bu sekmeyi düzenleme yetkiniz yok. Görüntüleme modunda."; every Toggle, Input, and Button receives `disabled` (or `onChange` early-return). Backend re-checks every action (Phase 9 RPTA) so a transient false here is safe (T-12-03-01 mitigation, defense in depth).
- **Empty workflow guard:** when `rawNodes.length === 0`, the panel collapses to a single full-bleed `AlertBanner tone="info"` with "Bu projede aktif workflow tanımlanmamış." — no picker, no editor, no Save buttons.

`Frontend2/components/lifecycle/criteria-editor-panel.test.tsx` ships 8 RTL cases: phase picker render with archived suffix, auto Toggle persist, manual criterion add, manual criterion delete, deep-link `?phase=execution` auto-select + scroll, `enable_phase_assignment` independent persist, round-trip render with saved state, İptal reverts toggles.

### Task 2 — settings-tab swap + methodology read-only (commits `5c4768a` + `f0f4cc7`)

`Frontend2/components/project-detail/settings-tab.tsx`:
- Drops the `sub === "lifecycle"` AlertBanner stub.
- Imports `CriteriaEditorPanel` from `@/components/lifecycle/criteria-editor-panel`.
- The `lifecycle` branch now renders `<CriteriaEditorPanel project={project} isArchived={isArchived}/>`.
- `AlertBanner` import dropped — only the lifecycle branch used it; TypeScript flagged the unused import.

`Frontend2/components/project-detail/settings-general-subtab.tsx`:
- Adds two module-top `Record<string, string>` maps (`METHODOLOGY_LABEL_TR` / `METHODOLOGY_LABEL_EN`) covering all 7 methodologies (SCRUM/KANBAN/WATERFALL/ITERATIVE/INCREMENTAL/EVOLUTIONARY/RAD).
- A new `methodologyLabel(methodology, lang)` helper returns the localized label.
- A new field row inside the `Genel` Card displays the localized methodology name in a non-interactive container (`background: var(--surface-2)` + same inset border as Input primitive) with an info-icon Tooltip carrying the canonical D-60 copy: `"Metodoloji proje oluşturulduğu an sabittir. Değiştirmek için yeni proje oluşturun."` / `"Methodology is fixed at project creation. Create a new project to change it."`.
- T-12-03-02 mitigation: the editable methodology input is **NOT** placed in the DOM. There is no `<select>`, no `<input name="methodology"/>`, no `onChange` handler that PATCHes methodology. Backend Phase 9 D-29 already no-ops the change as the second defense.

`Frontend2/components/project-detail/settings-tab.test.tsx`:
- The "shows the Faz 12 stub" assertion is rewritten to verify CriteriaEditorPanel mounts on the Yaşam Döngüsü sub-tab — looks for the "Görev–Faz Ataması" + "Faz Seç" headers and asserts the stub copy `Faz 12'de aktive edilecek` is gone.

`Frontend2/components/project-detail/settings-general-subtab.test.tsx` (NEW):
- 2 RTL cases enforcing CONTEXT D-60: no `name="methodology"` form elements anywhere in the DOM, no `<select>` elements, the localized methodology label (Scrum) renders for the SCRUM project fixture.

## Deep-link round-trip — confirmation

The Phase Gate inline-expand panel from Plan 12-02 (`Frontend2/components/lifecycle/phase-gate-expand.tsx`) carries a "Kriterleri düzenle →" button that calls `router.push(/projects/${projectId}?tab=settings&sub=lifecycle&phase=${currentPhase.id})`. Plan 12-03's `CriteriaEditorPanel` consumes that query parameter via `useSearchParams().get('phase')` in a `useEffect` and:

1. Sets `editor.setActivePhaseId(deepLinkPhase)` so the matching picker row is highlighted.
2. After 50ms (one paint frame allowance for the picker to attach `scrollAnchorRef` to the active row), calls `scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })`.

Test 5 in `criteria-editor-panel.test.tsx` exercises this end-to-end:

- Mocks `useSearchParams` to return `new URLSearchParams("phase=execution")`.
- Stubs `Element.prototype.scrollIntoView` (jsdom does not implement it) with `vi.fn()`.
- Asserts (a) the "Yürütme" picker row's inline `style.background` contains `--accent` (active selection visual), and (b) `scrollIntoView` was invoked.

Both assertions pass. The end-to-end "click in Phase Gate → land on the right phase in Settings" flow is wired.

## Phase 9 D-29 backend no-op verification

CONTEXT D-60 specifies that the methodology field is read-only in the UI **and** the Phase 9 D-29 backend no-op behavior is the second defense. Phase 12 Plan 12-03 does not introduce any UI path that PATCHes methodology — the editable input is removed from the DOM entirely. The backend Phase 9 D-29 no-op behavior (UpdateProjectUseCase ignores methodology changes during update) was implemented and tested in Phase 9 P05 (`Phase 9 P05 | 7min | 2 tasks | 11 files` per STATE.md). It is **not** re-verified inside Plan 12-03 because:

1. No new code path in Plan 12-03 calls PATCH `/projects/{id}` with a `methodology` field. The backend test suite from Phase 9 covers the no-op contract.
2. UI-surface tampering is the higher-priority defense: removing the input element prevents accidental + casual tampering at the rendering layer.
3. A dedicated regression test on the backend layer would require running the integration test suite (`Backend/tests/integration`) which is out of scope for Plan 12-03's frontend deliverable.

If a future plan wants to add a UI-driven methodology change path (e.g., the deferred v2.1 mapping wizard mentioned in CONTEXT D-60), the regression test should be added at that time. Logged in `deferred-items.md` for visibility.

## Test Coverage

| File                                              | Test cases | Notes                                                                                                                   |
|---------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------|
| `criteria-editor-panel.test.tsx` (NEW)            | 8          | Picker render with archive suffix; auto Toggle persist; manual add; manual delete; deep-link auto-select+scroll; EPA independent persist; round-trip; İptal reverts |
| `settings-tab.test.tsx` (rewired)                 | 7          | 6 pre-existing + 1 rewritten Yaşam Döngüsü assertion (was: "Faz 12 stub", now: CriteriaEditorPanel mounts)              |
| `settings-general-subtab.test.tsx` (NEW)          | 2          | No name=methodology / no `<select>` / Tooltip + Scrum label render                                                      |

`cd Frontend2 && npm run test -- criteria-editor-panel settings-tab settings-general-subtab` exits 0 with all 17 cases green. Full suite: 218 / 218 pass, **0 regressions** vs the 208-test baseline (10 net new — 8 in criteria-editor-panel + 2 in settings-general-subtab).

## Acceptance grep matrix (Plan 12-03)

| Acceptance check                                                       | Result   |
|------------------------------------------------------------------------|----------|
| `useSearchParams\|searchParams\.get\(['\"]phase['\"]` in panel          | 2 hits   |
| `scrollIntoView` in panel                                               | 1 hit    |
| `all_tasks_done\|no_critical_tasks\|no_blockers` in panel              | 12 hits  |
| `enable_phase_assignment` in panel                                      | 11 hits  |
| `phase_completion_criteria` in panel                                    | 6 hits   |
| `useTransitionAuthority\|canEdit` in panel                              | 18 hits  |
| `it(` count in panel test                                               | 8        |
| `CriteriaEditorPanel` in settings-tab                                   | 3 hits   |
| `Faz 12'de aktive edilecek` in settings-tab                             | 0 hits   |
| `name="methodology"\|onChange.*methodology` in settings-general-subtab  | 0 hits   |
| `Tooltip` in settings-general-subtab                                    | 5 hits   |
| `Metodoloji proje oluşturulduğu an sabittir` in settings-general-subtab | 1 hit    |

All checks pass.

## Deviations from Plan

**None.** The plan executed exactly as written.

A few minor implementation choices made within plan latitude:

- **Stable-string useMemo dep for seeding drafts.** Plan only required seeding drafts from `project.processConfig.phase_completion_criteria`; the implementation uses `rawNodes.map(n=>n.id).join('|') + JSON.stringify(initialCriteria)` as the dep array per Phase 11 D-44 pattern to avoid an OOM feedback loop when useQuery emits fresh array references. No behavior change vs the plan.
- **`AlertBanner` import removed from settings-tab.tsx.** Only the lifecycle branch used it; TypeScript flagged the unused import after the swap. Trivial cleanup, no plan latitude issue.
- **`Genel` sub-tab placement of methodology field.** Plan didn't pin a specific row position; placed after Backlog Tanımı (the last methodology-driven field in the Card). Visually contiguous with backlog/cycle settings.

### Threat surface scan

No new network endpoints or trust-boundary changes introduced beyond those enumerated in `<threat_model>`:

- T-12-03-01 (E — Save button) → mitigated as designed (canEdit gate + AlertBanner + backend RPTA).
- T-12-03-02 (T — methodology PATCH) → fully mitigated: the editable input is removed from the DOM; backend Phase 9 D-29 is the second defense.
- T-12-03-03 (T — manual criteria free-text XSS) → accepted as v2.0 baseline per plan; identical surface to Phase 9 audit log free-text fields.

## Self-Check: PASSED

- All created files exist:
  - `Frontend2/components/lifecycle/criteria-editor-panel.tsx` (FOUND)
  - `Frontend2/components/lifecycle/criteria-editor-panel.test.tsx` (FOUND)
  - `Frontend2/components/project-detail/settings-general-subtab.test.tsx` (FOUND)
- All modified files updated:
  - `Frontend2/components/project-detail/settings-tab.tsx` (CriteriaEditorPanel imported + mounted; AlertBanner stub removed)
  - `Frontend2/components/project-detail/settings-tab.test.tsx` (assertion rewritten)
  - `Frontend2/components/project-detail/settings-general-subtab.tsx` (methodology read-only display + Tooltip added)
- 4 task commits exist:
  - `46d8837` test(12-03): add failing tests for CriteriaEditorPanel
  - `6ee82fb` feat(12-03): ship CriteriaEditorPanel for Settings > Yaşam Döngüsü
  - `5c4768a` test(12-03): swap stub assertion + add D-60 methodology read-only test
  - `f0f4cc7` feat(12-03): wire CriteriaEditorPanel + lock methodology read-only
- 218 / 218 tests pass; 0 regressions.
- `cd Frontend2 && npm run test -- criteria-editor-panel settings-tab settings-general-subtab` exits 0 (17 cases green).
- No imports from `Frontend/` (old frontend) — verified via grep.
- No imports from `shadcn/ui` — verified via grep.
- Acceptance grep matrix all green (12/12 checks).
