---
phase: 12
plan: 10
plan_id: "12-10"
subsystem: lifecycle-phase-gate-workflow-editor
tags: [presets, preset-menu, uat-checklist, EDIT-07, phase-finalization, uat-deferred]
requirements_satisfied: [EDIT-07]
dependency_graph:
  requires:
    - "Frontend2/lib/lifecycle/workflow-validators.ts — validateWorkflow (Plan 12-01)"
    - "Frontend2/services/lifecycle-service.ts — WorkflowConfig type (Plan 12-01)"
    - "Frontend2/components/projects/confirm-dialog.tsx — Phase 10 D-25"
    - "Frontend2/components/workflow-editor/editor-page.tsx — toolbar shell (Plan 12-07/08/09)"
    - "Frontend2/hooks/use-editor-history.ts — push/clear (Plan 12-01)"
  provides:
    - "PRESETS_BY_ID with 9 preset workflows: Scrum / Waterfall / Kanban / Iterative / V-Model / Spiral / Incremental / Evolutionary / RAD"
    - "resolvePreset(id) deep-clone helper"
    - "PRESET_LABELS_TR / PRESET_LABELS_EN localization tables"
    - "PresetMenu — Şablon Yükle dropdown trigger + dirty-aware ConfirmDialog flow"
    - "EditorPage applyPreset handler — pushes current workflow to undo, swaps to preset, sets dirty=true"
    - "12-UAT-CHECKLIST.md — 15-row manual UAT checklist artifact (LIFE-01..07 + EDIT-01..07 + viewport)"
  affects:
    - "Frontend2/lib/lifecycle/presets.ts (NEW)"
    - "Frontend2/lib/lifecycle/presets.test.ts (NEW — 11 tests)"
    - "Frontend2/components/workflow-editor/preset-menu.tsx (NEW)"
    - "Frontend2/components/workflow-editor/preset-menu.test.tsx (NEW — 6 tests)"
    - "Frontend2/components/workflow-editor/editor-page.tsx — applyPreset wiring"
    - "Frontend2/components/workflow-editor/editor-page.test.tsx — preset-replace integration test"
    - ".planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UAT-CHECKLIST.md (NEW)"
tech_stack:
  added: []
  patterns:
    - "Pure lookup-table preset definitions (zero React imports — unit-testable in vitest without jsdom)"
    - "Dirty-aware preset apply: ConfirmDialog when dirty=true, direct apply when dirty=false"
    - "Deep-clone via JSON.parse(JSON.stringify) in resolvePreset so consumers can mutate without affecting the canonical preset"
    - "history.push(workflow) before setWorkflow(next) in applyPreset — Cmd+Z restores the pre-preset state"
    - "validateWorkflow(preset).errors === [] enforced at unit-test time (Pitfall: silent invalid preset)"
key_files:
  created:
    - Frontend2/lib/lifecycle/presets.ts
    - Frontend2/lib/lifecycle/presets.test.ts
    - Frontend2/components/workflow-editor/preset-menu.tsx
    - Frontend2/components/workflow-editor/preset-menu.test.tsx
    - .planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UAT-CHECKLIST.md
  modified:
    - Frontend2/components/workflow-editor/editor-page.tsx
    - Frontend2/components/workflow-editor/editor-page.test.tsx
decisions:
  - "[12-10] 9 presets shipped as a single lookup table (PRESETS_BY_ID) plus parallel TR/EN label tables. Pure module — zero React imports — so vitest can run the suite without jsdom. Pattern matches lib/methodology-matrix.ts."
  - "[12-10] resolvePreset(id) returns a JSON.parse(JSON.stringify(...)) deep clone so editor consumers can mutate node positions / edge ids freely without poisoning the canonical preset for the next call."
  - "[12-10] applyPreset in editor-page calls history.push(workflow) BEFORE setWorkflow(next) so Cmd+Z rolls back to the pre-preset state — same single-mutation-entry-point contract Plan 12-08 established."
  - "[12-10] Three NEW EDIT-07 presets (Incremental / Evolutionary / RAD) designed from scratch per CONTEXT D-01: Incremental uses repeated-increment + feedback edge, Evolutionary uses prototype-feedback-loop, RAD uses parallel data/process-modeling tracks merging into application generation."
  - "[12-10] PresetMenu's dirty branch fires ConfirmDialog ('Mevcut değişiklikler kaybolacak…') with confirmTone='danger'; clicking Devam Et applies the preset, clicking Vazgeç keeps the current workflow. dirty=false skips the dialog and applies directly — matches Plan 12-09 dirty-save dialog UX."
  - "[12-10] detectCurrentPresetId(workflow) is best-effort — compares node count + edge count + mode to each preset and returns the first match; custom workflows return null and the toolbar Badge is suppressed."
  - "[12-10] UAT checklist artifact covers 15 rows (LIFE-01..07 + EDIT-01..07 + EPA toggle independence + bonus viewport row from SPEC Constraints). Sign-off lines reserved for tester name + date."
  - "[12-10] Manual UAT sign-off (Task 3 human-verify checkpoint) DEFERRED per user request. Phase 12 is code-complete; UAT verification is moved to the project-wide deferred queue and will be picked up in a later /gsd-verify-work pass against the 12-UAT-CHECKLIST.md rows."
  - "[12-10] Post-checkpoint polish (the ~35 commits between Plan 12-10's Tasks 1+2 and this finalization) was driven by in-session UAT feedback that revealed visual/functional regressions across multiple subsystems (my-tasks rebuild, task-detail header + sidebar + activity + comments + attachments, primitives 4-bar PriorityChip + interactive StatusDot, hydration safety, backend AttributeError on PATCH, task_key/due_date field-mapping, assignee picker). All polish remained scoped inside the Phase 12 surface; nothing introduced a new requirement."
metrics:
  duration: 30
  completed: 2026-04-25
  task_count: 3
  task_count_completed: 2
  task_count_deferred: 1
  file_count: 7
  test_count_added: 17 (11 presets + 6 preset-menu)
  uat_status: deferred
---

# Phase 12 Plan 12-10: Preset Templates + Şablon Yükle Menu + UAT Checklist

**One-liner:** 9 preset workflows (3 NEW per EDIT-07) + dirty-aware ConfirmDialog menu + 15-row manual UAT artifact; UAT sign-off deferred per user.

## Outcome

- `lib/lifecycle/presets.ts` exports `PRESETS_BY_ID` with 9 entries: Scrum / Waterfall / Kanban / Iterative / V-Model / Spiral / Incremental / Evolutionary / RAD. Each preset passes `validateWorkflow()` with zero errors (verified by 9 unit cases).
- `resolvePreset(id)` deep-clones the canonical config so consumers mutate freely.
- `PRESET_LABELS_TR` + `PRESET_LABELS_EN` localization tables for the menu.
- `PresetMenu` component (Şablon Yükle dropdown) with dirty-aware ConfirmDialog flow + click-outside dismiss + current-preset Badge.
- `EditorPage.applyPreset` wires `history.push(workflow)` → `setWorkflow(next)` → `setDirty(true)` so Cmd+Z rolls back the swap.
- `12-UAT-CHECKLIST.md` artifact: 15 rows covering all 14 LIFE-* / EDIT-* requirements plus a viewport-gate bonus row from SPEC Constraints.
- Phase 12 code-complete: every requirement (FOUND, BACK, API, LIFE, EDIT) marked Complete in REQUIREMENTS.md after this plan.

## UAT — DEFERRED

Task 3 of this plan was the human-verify checkpoint to run the 15-row manual UAT click-through and sign each row Pass/Fail. Per user request, the sign-off is **deferred** out of this plan and will be picked up by a later `/gsd-verify-work` pass.

The artifact at `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UAT-CHECKLIST.md` is fully populated and ready to sign — only the tester rows + dates are unfilled.

The deferral reflects the volume of in-session post-checkpoint visual/functional polish (~35 commits across UAT rounds 1-15) that re-shaped the surface area enough that a clean batch UAT pass at this exact moment would be lossy. The deferred sign-off carries the canonical scope.

## Tasks Status

| Task | Status | Notes |
|------|--------|-------|
| 1: presets.ts + 11 tests | Complete | commit `60b4020` |
| 2: preset-menu.tsx + editor-page wiring + 7 tests | Complete | commit `9d596c8` |
| 3: 12-UAT-CHECKLIST.md + manual UAT sign-off | **Artifact done; sign-off DEFERRED** | commit `1cdde82` for the artifact; sign-off moved to global deferred queue |

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| Frontend2 presets.test.ts | 11 | PASS (9 preset-validity + resolvePreset deep-clone + reference identity) |
| Frontend2 preset-menu.test.tsx | 6 | PASS |
| Frontend2 editor-page.test.tsx | 12 | PASS (1 new preset-replace integration case + the 11 from Plan 12-09) |
| Frontend2 full suite | 424 | PASS (zero regressions across 61 files) |

## Post-Checkpoint Polish (Reference)

Between Tasks 1+2 commits (60b4020, 9d596c8) and this finalization, 15 UAT rounds surfaced a steady stream of visual / functional issues across the broader phase surface. All fixes were scoped inside the Phase 12 deliverables — no requirement was added or scope-creeped. Representative commit lineage (chronological):

- LIFE-01 empty state + editor undo per-frame coalescing (`a998c2a`, `21fce83`)
- Backlog reopen functional setState (`a8a424a`)
- Avatar palette retune (`80e4e16`)
- NODE_ID_REGEX enforcement across presets/seeder/editor + WorkflowNode Pydantic round-trip (`a4eb6f7`, `d0e2b71`, `4f8c2aa`)
- /activity admin-gate + console silencing (`54580ed`, `3ca0a56`)
- /my-tasks 1:1 prototype rebuild — Hero / QuickAdd / Toolbar / RightRail / card frame (`a899503`, `dd8ffb9`, `f63fdaa`, `0880389`)
- Primitives upgrade — 4-bar PriorityChip + interactive StatusDot with optional onChange (`90141d3`)
- TaskRow rebuild + status mutation wiring (`948a8d6`)
- task-service backend field normalization (priority/status uppercase + task_key/due_date renames + assignee.username surfacing) (`c3f9f36`, `55b7b0f`)
- Hydration mismatch fixes — useLocalStoragePref hook + MTHero deferred Date (`7e2b700`, `5ee7048`, `1ce3cfb`)
- Comments endpoint correction + null guards + DOMPurify sanitize + structured mention (`ed481d4`, `9ce76f7`, `166c89e`)
- Task-detail layout — description Card + Bitir, attachments above activity, dependencies in sidebar (`dc2fcd9`, `0a295c4`, `567a019`)
- Sub-tasks 1:1 prototype layout — checkbox + tone Badge + raw column-name display (`4a8ac95`, `ea3cc2a`)
- TaskGroupList sticky header + colored icon + project progress bar + maxHeight scroll (`f0a58ce`)
- QuickAdd MTPicker + focus glow + asymmetric padding (`d522d73`)
- mt-toolbar inline input → Input primitive + type narrowing (`058a3af`)
- Task-detail header rebuild (breadcrumb every task, action bar, drop "key·type") (`e1e0c25`)
- Properties sidebar enrichment — Reporter row + Sprint badge tone + label name resolution + status tone palette + InlineEdit outline cleanup (`c623cc3`)
- Activity pill-tabs + Worklog placeholder (`166c89e`)
- Attachments validation — MIME + size + accept attribute + filename guard (`1739172`)
- i18n taskDetail namespace seed + :focus-visible verify (`971538e`)
- **PATCH save root cause** — backend `dto.status_id` AttributeError → 500 → CORS-shaped browser error → fixed via `dto.column_id` rename + frontend field map (due→due_date, cycle_id→sprint_id) + boardColumns id+name pairs (`84d5213`)
- Searchable assignee picker with debounced server-side filter + right-aligned popover (`f9e5e4a`, `c91ac33`)

The polish lineage is captured here so a future `/gsd-verify-work` pass running the UAT checklist can correlate any "expected behavior" mismatch with a specific commit.

## Files Touched

**Created (Plan 12-10 scope):**
- `Frontend2/lib/lifecycle/presets.ts`
- `Frontend2/lib/lifecycle/presets.test.ts`
- `Frontend2/components/workflow-editor/preset-menu.tsx`
- `Frontend2/components/workflow-editor/preset-menu.test.tsx`
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UAT-CHECKLIST.md`

**Modified (Plan 12-10 scope):**
- `Frontend2/components/workflow-editor/editor-page.tsx`
- `Frontend2/components/workflow-editor/editor-page.test.tsx`

## Decisions Carried Forward

See the `decisions:` block in the frontmatter. Three highlights:
1. UAT sign-off deferred — Phase 12 is code-complete but awaits manual click-through verification.
2. Preset apply pushes the prior workflow to history first so Cmd+Z is non-destructive even across template swaps.
3. Three NEW EDIT-07 presets (Incremental / Evolutionary / RAD) are designed from scratch — not ported from prototype — and each is verified by `validateWorkflow().errors === []`.

## Next

- Phase 12 is plans-complete. The orchestrator advances STATE.md to record completion + add UAT to the deferred queue.
- A future `/gsd-verify-work 12` pass will load the UAT checklist artifact, run each row, and convert this deferred sign-off into a closed verification record.
