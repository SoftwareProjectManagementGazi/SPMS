---
phase: 12
plan: 05
plan_id: "12-05"
subsystem: lifecycle-milestones-timeline-flagline
status: completed
completed_at: 2026-04-25
duration_min: 8
tasks_completed: 2
files_created: 3
files_modified: 4
tags:
  - frontend
  - lifecycle
  - milestones-subtab
  - milestone-inline-add-row
  - timeline-flagline
  - life-05
  - tdd
  - rtl
requirements:
  - LIFE-05
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: Consumes useMilestones / useCreateMilestone / useUpdateMilestone / useDeleteMilestone hooks (optimistic + rollback per Phase 11 D-38) and Milestone DTO mappers from milestone-service.ts. Also consumes useTransitionAuthority for permission gating (D-40).
    - phase: 12
      plan: 02
      reason: Plugs the MilestonesSubTab INTO the LifecycleTab outer shell. Plan 12-04 wired the 4-sub-tab Tabs primitive with a placeholder for milestones; Plan 12-05 replaces that placeholder.
    - phase: 11
      reason: Extends the Phase 11 custom SVG Gantt (timeline-tab.tsx D-27/D-28) with a new aria-labeled `<g>` group for milestone flag-lines + popover. The change is additive — the original 5 Phase 11 tests still pass.
    - phase: 10
      reason: Reuses the Phase 10 D-25 ConfirmDialog (`@/components/projects/confirm-dialog`) for delete confirmation. RESEARCH RESOLVED Q3 in CONTEXT — the dialog lives in components/projects/, not components/toast/ as UI-SPEC line 88 originally claimed.
  provides:
    - id: 12-05-milestones-subtab
      label: MilestonesSubTab — milestones list cards with inline-add row reveal + edit-in-place + ConfirmDialog delete + permission gate
    - id: 12-05-milestone-inline-add-row
      label: MilestoneInlineAddRow — Card with name+date inputs + multi-select chip picker for linked_phase_ids (non-archived nodes only) + Save/Cancel; reused for both create AND edit
    - id: 12-05-timeline-flagline-layer
      label: TimelineTab milestones prop — extends the Phase 11 SVG Gantt with `<g aria-label="milestones-layer">` rendering vertical dashed flag-lines + label chips + click-to-open popover (name + status + days-remaining + linked phases)
  affects:
    - Frontend2/app/(shell)/projects/[id]/page.tsx (page-level useMilestones prefetch removed — shell-level fetch is now the single source of truth)
    - Frontend2/components/project-detail/project-detail-shell.tsx (added useMilestones hook + forwards milestones prop to TimelineTab)
    - Frontend2/components/lifecycle/lifecycle-tab.tsx (replaced milestones placeholder with `<MilestonesSubTab/>`)
tech_stack:
  added: []
  patterns:
    - "Optimistic CRUD via Plan 12-01 useCreateMilestone hook — onMutate inserts at top with negative temp id, onError rolls back via setQueryData(prev), onSettled invalidates queryKey ['milestones', 'project', projectId]"
    - "Single-component create + edit reuse: MilestoneInlineAddRow accepts an optional `initial?: Partial<MilestoneCreateDraft>` prop. The parent decides POST vs PATCH via the onSave callback — same UX, two callers (top-of-list create row, in-list edit-in-place row)"
    - "Click-outside dismiss for chip-picker dropdown — document.addEventListener('mousedown') gated on chipOpen state, attached inside React.useEffect with cleanup. Phase 8 SidebarUserMenu pattern"
    - "Permission gate (D-40) via useTransitionAuthority — single source of truth from Plan 12-01. Add button hidden when canEdit=false; per-card Edit + Delete buttons hidden in same condition. Backend re-checks every action (defense in depth)"
    - "Empty linked_phase_ids accepted (Phase 9 D-24) — no min-length check on the chip picker; POST body has `linked_phase_ids: []` for project-wide milestones. Backend Pydantic validates each id against workflow.nodes when non-empty (T-12-05-01 mitigation)"
    - "Non-archived nodes filter for chip-picker dropdown — `workflow.nodes.filter(n => !n.isArchived)` so archived phases never appear as link options (CONTEXT D-50)"
    - "Timeline flag-line at correct x-position via the SAME formula as the today-line (line 156 in timeline-tab.tsx): `((target - min) / MS_PER_DAY) * DAY_WIDTH[view]`. Hard-coded reuse — no new coordinate math"
    - "TanStack Query de-duped milestones cache: page-level prefetch (Plan 12-04) → shell-level fetch (Plan 12-05) → MilestonesSubTab fetch (Plan 12-05) — all hit the same queryKey ['milestones', 'project', projectId] so the network call fires once and propagates to all 3 consumers"
key_files:
  created:
    - Frontend2/components/lifecycle/milestones-subtab.tsx
    - Frontend2/components/lifecycle/milestones-subtab.test.tsx
    - Frontend2/components/lifecycle/milestone-inline-add-row.tsx
  modified:
    - Frontend2/components/lifecycle/lifecycle-tab.tsx
    - Frontend2/components/project-detail/timeline-tab.tsx
    - Frontend2/components/project-detail/timeline-tab.test.tsx
    - Frontend2/components/project-detail/project-detail-shell.tsx
    - Frontend2/app/(shell)/projects/[id]/page.tsx
decisions:
  - "Chip picker built INLINE inside MilestoneInlineAddRow, NOT lifted to a shared primitive. CONTEXT D-50 references Phase 11 D-51 label chip picker for consistency, but Phase 11 D-51 is itself colocated inside `task-create-modal.tsx` (verified by grep — no shared `chip-picker.tsx` primitive exists in Frontend2). Shipping a generic ChipPicker primitive would be premature abstraction; lift only when a third consumer arrives. The implementation pattern (popover with checkbox-like rows + chip rendering with X to remove + click-outside dismiss) is documented in this file so a future lift is straightforward"
  - "Milestones prop drilled from ProjectDetailShell → TimelineTab. Choice was between (a) shell calls useMilestones and forwards (b) timeline-tab calls useMilestones directly. Picked (a) for symmetry with the Plan 11-04 pattern where shell fetches columns + tasks once and forwards via prop. Both approaches work via TanStack Query cache de-dup, but the explicit prop makes the data-flow visible at the call site and matches the test fixture pattern (tests pass milestones as a direct prop)"
  - "Page-level useMilestones prefetch (added in Plan 12-04) REMOVED in Plan 12-05. The shell-level fetch is now the source of truth — page-level was a one-line side-effect comment that became redundant once the shell explicitly forwards. No behavior change because TanStack Query cache de-dup made the page-level call redundant the moment the shell-level call landed"
  - "Milestone progress derivation when linkedPhaseIds.length === 0 = renders an em-dash (`—`) NOT 0% — the milestone is project-wide and has no phases to derive progress from, so a zero-percentage bar would be misleading. The ProgressBar still renders at 0 width (legible visual), but the inline-text shows `—`. When linkedPhaseIds is non-empty, a status-derived heuristic ships (COMPLETED→100, IN_PROGRESS→50, else 0). Plan 12-06 will replace the heuristic with real per-phase task counts"
  - "Inline `formatDateShort(iso, lang)` helper inside timeline-tab.tsx — short month + day formatting reused 2x in this file (flag label + popover date row). Co-located rather than lifted to lib/ until a third consumer needs it (matches the Plan 12-04 SummaryStrip mode-chip kept-co-located strategy)"
  - "Click-outside dismiss for the milestone popover uses `mousedown` (not `click`) for the same reason as the chip-picker — `mousedown` fires before the React click handler can stop propagation, ensuring the listener can dismiss without racing the toggle click that opened it"
  - "Test M3 (popover-on-click) clicks on the inner `<g>` (not the outer `<g aria-label='milestones-layer'>`) because each milestone is wrapped in its own `<g onClick={...}>` for individual click targeting. The outer layer is layout-only"
metrics:
  duration_min: 8
  task_count: 2
  files_created: 3
  test_files_added: 1
  tests_added: 13
  full_suite_tests: 248
  full_suite_test_files: 40
---

# Phase 12 Plan 05: Milestones Sub-Tab + Timeline Flag-Line Integration Summary

LIFE-05 fully delivered — the Milestones sub-tab is now live in the Lifecycle tab, replacing the Plan 12-04 placeholder with a full CRUD experience: cards listing each milestone (name + status Badge + target date + ProgressBar + linked-phase chips), an inline-add row reveal pattern (Ekle button → Card with name Input + date Input + multi-select chip picker for `linked_phase_ids` + Save/Cancel), edit-in-place using the same inline-add component seeded from the existing milestone, and ConfirmDialog-gated delete. The Phase 11 Timeline tab Gantt is additively extended with a milestones-layer `<g>` group rendering vertical dashed flag-lines at each milestone target date (using the same `((target - min) / MS_PER_DAY) * DAY_WIDTH[view]` formula as the today-line), top label-chip "Alpha Launch · 15 Nis", and a click-to-open popover (name + status Badge + days-remaining + linked phase names). All 5 Phase 11 timeline tests still pass (additive change). 3 new files, 4 modifications, 13 new RTL test cases, 248/248 full suite green — zero regressions vs the 235 Plan 12-04 baseline.

## What Shipped

### Task 1 — MilestonesSubTab + MilestoneInlineAddRow (commits `c5f434b` + `a20e590`)

`Frontend2/components/lifecycle/milestone-inline-add-row.tsx` (~210 LOC) per UI-SPEC §6 lines 988-1014:

- Card padding 14, marginBottom 12. 2-column grid `1fr 140px` for name + date. Full-width chip picker for `linked_phase_ids`. Bottom: 2 Buttons (Kaydet / İptal).
- Local state: `name`, `targetDate`, `linkedPhaseIds`, `chipOpen`, `submitting`. All seeded from optional `initial` prop (used by edit mode).
- **Chip picker dropdown** sources from `workflow.nodes.filter(n => !n.isArchived)`. Multi-select with checkbox-like rows. Click-outside dismiss via document `mousedown` listener gated on `chipOpen`. Selected chips render inside the trigger row as `<Badge size="xs" tone="primary">{nodeName} <X/></Badge>` with click-X to remove.
- **Save button enable**: requires `name.trim()` AND `targetDate`. **Empty `linked_phase_ids` IS allowed** — no min-length check (Phase 9 D-24 project-wide milestone).
- onSave is async — caller awaits the mutation result before closing the row. Submission disables the Save button to prevent double-submit.

`Frontend2/components/lifecycle/milestones-subtab.tsx` (~330 LOC) per UI-SPEC §3.6:

- **Section header** "Kilometre Taşları" + count + Ekle button (visible only when `canEdit && !adding`).
- **Inline add row** at the TOP of the list when `adding=true`.
- **Each milestone Card**: borderLeft red/primary depending on overdue status, header row with name + mono-font target-date + days-left/overdue + status Badge with dot + (if canEdit) Edit (pencil) + Delete (trash) icon buttons.
- **Linked phases preview**: when `linkedPhaseIds.length > 0`, renders a row of `<Badge size="xs" tone="neutral">{nodeName}</Badge>` chips below the header.
- **ProgressBar derivation**: status-driven heuristic (COMPLETED→100, IN_PROGRESS→50, else 0) when `linkedPhaseIds.length > 0`; em-dash text when project-wide (linkedPhaseIds empty). Plan 12-06 will replace the heuristic with per-phase task counts.
- **Edit-in-place**: when `editingId === ms.id`, the card is replaced by `<MilestoneInlineAddRow initial={...}/>` so the same component handles both Create AND Edit flows.
- **Delete confirm**: ConfirmDialog from `@/components/projects/confirm-dialog` (Phase 10 D-25). Title "Kilometre Taşını Sil", body includes the milestone name with "geri alınamaz" warning, confirm CTA "Sil".
- **Empty state** copy "Henüz kilometre taşı tanımlanmamış." per UI-SPEC line 1411 — only shown when `!isLoading && milestones.length === 0 && !adding`.
- **Permission gate**: `useTransitionAuthority(project)` returns boolean. When false: Add button hidden, Edit + Delete icon buttons hidden per-card. Backend re-checks every action (defense in depth — T-11-03 carry-forward).

`Frontend2/components/lifecycle/milestones-subtab.test.tsx` ships **8 RTL test cases**:

1. **Test 1 — list render**: 2 milestones from `apiClient.get` mock → 2 cards with names rendered.
2. **Test 2 — Ekle reveals inline-add**: click Ekle → name placeholder + Kaydet/İptal buttons appear.
3. **Test 3 — chip picker multi-select**: open dropdown, verify non-archived nodes appear (Planlama + Yürütme), archived "Eski" does NOT appear, click 2 → both rendered as chips.
4. **Test 4 — empty linked_phase_ids accepted**: type name + date but pick zero chips, click Kaydet → POST `/projects/7/milestones` with body `{name, target_date, linked_phase_ids: []}`. Critical: array present and empty.
5. **Test 5 — optimistic + rollback**: POST 422 → mock rejects → optimistic insert rolls back via setQueryData(prev) → "Bad Milestone" not in DOM.
6. **Test 6 — delete confirm**: click trash → ConfirmDialog opens → İptal sends no DELETE; re-trigger + Sil sends DELETE `/milestones/11`.
7. **Test 7 — permission gate**: `useTransitionAuthority` mocked to false → no Ekle button visible, no per-card Sil button visible.
8. **Test 8 — empty state**: `apiClient.get` returns `[]` → "Henüz kilometre taşı tanımlanmamış." copy renders.

`Frontend2/components/lifecycle/lifecycle-tab.tsx` modified:
- Added `import { MilestonesSubTab } from "./milestones-subtab"`.
- Replaced the placeholder Card with `<MilestonesSubTab project={project} workflow={workflow}/>` inside `subTab === "milestones"` branch.

### Task 2 — TimelineTab milestone flag-line layer + popover (commits `03049d1` + `9d75df3`)

`Frontend2/components/project-detail/timeline-tab.tsx` modifications:

- New props interface `TimelineTabProps { project; milestones?: Milestone[] }` — milestones default to `[]` so existing callers don't break.
- `formatDateShort(iso, lang)` helper — TR/EN short month+day formatter (`15 Nis` / `Apr 15`) using `toLocaleDateString` with `tr-TR` / `en-US` locale.
- `phaseNameById` Map memoized from `project.processConfig.workflow.nodes` — populates the popover's linked-phase chip names without an extra prop.
- `[openMilestoneId, setOpenMilestoneId]` state + `popoverRef` + click-outside `mousedown` listener gated on open state (effect cleanup on close).
- **`<g aria-label="milestones-layer">`** rendered inside the SVG (after task bars, before `</svg>`), only when `milestones.length > 0`. Each milestone's flag uses the **same coordinate formula as the today-line**: `x = ((target - min.getTime()) / MS_PER_DAY) * DAY_WIDTH[view]`. Off-canvas (x<0 or x>width) milestones return null. Each flag emits:
  - `<line stroke="--priority-high" strokeDasharray="6 3" strokeWidth=1.5>` from y=0 to y=height.
  - `<rect>` label background (auto-sized to text width via `Math.max(120, labelText.length * 6.5)`) with `--priority-high` border.
  - `<text fontSize=10.5 textAnchor=middle>` showing `{name} · {short-date}`.
  - Wrapped in a `<g onClick={() => setOpenMilestoneId(m.id)}>` for click targeting.
- **Popover** (`<div><Card padding=12>`) rendered below the SVG (so it can break out of `overflow:auto` clip). Shows name + status Badge tone=info + mono-font date row + days-remaining/overdue copy + linked phase Badge chips. Dismisses on click-outside.

`Frontend2/components/project-detail/timeline-tab.test.tsx` adds **5 new RTL test cases** (M1-M5):

- **M1 — flag-line x-position**: with one milestone at 2026-04-15 and chart `min=2026-04-10` (earliest task start), default Week view (DAY_WIDTH=24), expected `x = 5 days × 24 = 120`. Asserts the flag's `<line stroke-dasharray="6 3">` `x1` attribute is close to 120.
- **M2 — label chip text**: asserts `<text>` content matches `/Alpha Launch.*·/` (TR locale formatter outputs `15 Nis` — assertion is robust to the format choice).
- **M3 — popover-on-click**: clicks the inner `<g aria-label="milestones-layer"> > g`, awaits the linked phase name "Analiz" appearing in the popover (sourced from `mockProjects[0].processConfig.workflow.nodes[0]` whose id is `n1` — the milestone fixture uses `linkedPhaseIds: ["n1"]`).
- **M4 — multi-milestone**: 3 milestones produce 3 distinct `<line stroke-dasharray="6 3">` elements inside the layer.
- **M5 — no layer when empty**: omitting the `milestones` prop → no `<g aria-label="milestones-layer">` element renders.

`Frontend2/components/project-detail/project-detail-shell.tsx` modified:
- Added `import { useMilestones } from "@/hooks/use-milestones"`.
- Added `const { data: milestones = [] } = useMilestones(project.id)`.
- Forwarded `<TimelineTab project={project} milestones={milestones}/>`.

`Frontend2/app/(shell)/projects/[id]/page.tsx` modified:
- Removed the now-redundant page-level `useMilestones(projectId)` prefetch (added in Plan 12-04 as a cache-priming side effect). The shell-level fetch is the single source of truth — TanStack Query de-dup ensures the MilestonesSubTab and TimelineTab both hit cache.

## Plan 12-05 Output Spec — Resolutions

The plan output spec asks 3 questions:

**1. Whether the chip-picker is built inline or reuses an existing Phase 11 chip-picker pattern (CONTEXT D-50 + D-51 reference)?**

Built **inline** inside `MilestoneInlineAddRow`. CONTEXT D-50 cites Phase 11 D-51 "label chip input" for consistency, but Phase 11 D-51 itself co-locates the chip-picker inside `task-create-modal.tsx` — there is no shared `chip-picker.tsx` primitive in Frontend2. Lifting to a shared primitive now would be premature abstraction (only two consumers exist: Phase 11 label picker + Plan 12-05 phase picker, with different selection-source semantics). Pattern documented in this summary so a future lift (3rd consumer) is straightforward.

**2. The data flow chosen for milestones-to-TimelineTab (prop drill from page or hook in timeline-tab itself)?**

**Prop drill from `ProjectDetailShell`** — the shell calls `useMilestones(project.id)` and forwards via `<TimelineTab project={project} milestones={milestones}/>`. Picked over (b) "timeline-tab calls useMilestones directly" because:

- Symmetric with Phase 11 D-09 shell-fetches-tasks-and-forwards pattern (BoardTab/ListTab/CalendarTab consumers all receive `project` and either use the same useTasks hook or receive forwarded data).
- Test fixture passes `milestones` as a direct prop — explicit prop matches the test contract.
- The page-level prefetch from Plan 12-04 is now superseded; shell is the single source of truth.

Both approaches work via TanStack Query cache de-dup — the choice is one of explicitness, not behavior.

**3. Notes on milestone progress derivation when `linkedPhaseIds.length === 0` (project-wide — show "—" or 0%?)?**

**Show "—"** in the inline percent text, but render the ProgressBar at 0 width (legible visual). Rationale: a project-wide milestone has no phases to derive progress from, so a literal "0%" would be misleading (it implies "no progress yet" when the actual semantic is "not phase-anchored"). The em-dash signals "not applicable" without breaking the card layout. When `linkedPhaseIds.length > 0`, a status-driven heuristic ships (COMPLETED→100, IN_PROGRESS→50, else 0). **Plan 12-06 follow-up**: replace the heuristic with real per-phase task counts via the PhaseReport service.

## RESEARCH RESOLVED Q3 — ConfirmDialog location

CONTEXT note (additional_context block): "ConfirmDialog from `@/components/projects/confirm-dialog` (RESEARCH RESOLVED Q3 — actual location is `components/projects/`, not `components/toast/` as UI-SPEC line 88 claimed)."

Verified by `Frontend2/components/projects/confirm-dialog.tsx` source read. The dialog accepts `{ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }`. Note: it does NOT accept a `confirmTone` prop — UI-SPEC mentioned `confirmTone="danger"` but no current consumer in Frontend2 uses it (`grep confirmTone` returns 0 hits). Plan 12-05 omits `confirmTone` and the existing primary tone is preserved. Future hardening: if a true danger-style is desired (red Sil button instead of primary), extend the ConfirmDialog primitive in a follow-up plan; this is a primitive enhancement, not a Plan 12-05 scope item.

## Test Coverage

| File                                                            | Test cases | Notes                                                                                                            |
|-----------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------|
| `milestones-subtab.test.tsx` (NEW)                              | 8          | List render + Ekle reveal + chip multi-select + empty linked_phase_ids + optimistic+rollback + delete confirm + permission gate + empty state |
| `timeline-tab.test.tsx` (extended)                              | 10         | 5 pre-existing Phase 11 cases + 5 new milestone cases (M1 flag-line x-position, M2 label chip, M3 popover-on-click, M4 multi-milestone, M5 no-layer) |

Full Frontend2 suite: **248 / 248 tests** across 40 files — zero regressions vs the 235-test Plan 12-04 baseline (13 net new).

`cd Frontend2 && npm run test -- milestones-subtab timeline-tab` exits 0 with all 18 cases green.

## Acceptance grep matrix (Plan 12-05)

| Acceptance check                                                                            | Result |
|---------------------------------------------------------------------------------------------|--------|
| `useMilestones / useCreateMilestone / useDeleteMilestone` in milestones-subtab.tsx          | 9 hits |
| `ConfirmDialog` in milestones-subtab.tsx                                                    | 3 hits |
| `useTransitionAuthority / canEdit` in milestones-subtab.tsx                                  | 7 hits |
| `linked_phase_ids` in milestone-inline-add-row.tsx                                          | 6 hits |
| `isArchived` filter in milestone-inline-add-row.tsx                                          | 1 hit  |
| `MilestonesSubTab` in lifecycle-tab.tsx                                                     | 2 hits |
| `milestones` in timeline-tab.tsx                                                            | 7 hits |
| `DAY_WIDTH[view]` in timeline-tab.tsx                                                       | 6 hits |
| `milestones-layer` in timeline-tab.tsx                                                      | 1 hit  |
| `openMilestoneId / setOpenMilestoneId` in timeline-tab.tsx                                  | 9 hits |
| `formatDateShort / toLocaleDateString` in timeline-tab.tsx                                  | 5 hits |
| `it()` count in timeline-tab.test.tsx                                                       | 10 cases (5 baseline + 5 new) |

All 12 grep checks pass.

## Deviations from Plan

### Auto-fixed issues

None — the plan executed cleanly with no Rule 1/2/3 deviations triggered.

### Plan-explicit choices

- **Chip picker built inline, not lifted to a primitive.** Rationale documented in the Plan 12-05 Output Spec section above.
- **Milestones data flow = shell-level prop drill, not timeline-tab internal hook.** Rationale documented above.
- **Page-level useMilestones prefetch removed.** Plan 12-04 added a cache-priming side-effect call in the page; Plan 12-05 makes the shell the source of truth, so the page-level call became redundant. No behavior change because TanStack Query de-dup made the page-level call redundant the moment the shell-level call landed.
- **ConfirmDialog `confirmTone="danger"` prop NOT passed.** The current ConfirmDialog primitive (Phase 10 D-25) does not accept a `confirmTone` prop. UI-SPEC mentioned `confirmTone="danger"` but no Frontend2 consumer uses it. Omitted to avoid type errors; future hardening (red-tone confirm button) deferred to a primitive enhancement plan.
- **Project-wide milestone progress shows "—" not 0%.** Rationale documented above (project-wide milestones have no phases to derive progress from; em-dash is the more accurate signal).

### Threat surface scan

No new network endpoints or trust-boundary changes beyond those enumerated in `<threat_model>`:
- T-11-03 (carry-forward): Milestone POST mitigated by Phase 9 D-46 RPTA membership check + frontend `useTransitionAuthority` defense-in-depth. Honored.
- T-12-05-01: linked_phase_ids tampering mitigated by backend Pydantic validation against `workflow.nodes` (Phase 9 D-50 + manage_milestones.py:20-41). Frontend chip picker is sourced from the same list — backend remains authoritative.

## Self-Check: PASSED

- All 3 created files exist:
  - `Frontend2/components/lifecycle/milestones-subtab.tsx` (FOUND)
  - `Frontend2/components/lifecycle/milestones-subtab.test.tsx` (FOUND)
  - `Frontend2/components/lifecycle/milestone-inline-add-row.tsx` (FOUND)
- All 4 modified files updated:
  - `Frontend2/components/lifecycle/lifecycle-tab.tsx` (MilestonesSubTab wired into Tabs)
  - `Frontend2/components/project-detail/timeline-tab.tsx` (milestones prop + flag-line layer + popover)
  - `Frontend2/components/project-detail/timeline-tab.test.tsx` (extended with 5 milestone cases)
  - `Frontend2/components/project-detail/project-detail-shell.tsx` (useMilestones + forward to TimelineTab)
  - `Frontend2/app/(shell)/projects/[id]/page.tsx` (page-level prefetch removed — shell is the source)
- Four task commits exist:
  - `c5f434b` test(12-05): add failing tests for MilestonesSubTab
  - `a20e590` feat(12-05): ship MilestonesSubTab + MilestoneInlineAddRow with full CRUD
  - `03049d1` test(12-05): add failing tests for timeline-tab milestone flag-line layer
  - `9d75df3` feat(12-05): extend Timeline Gantt with milestone flag-line layer + popover
- 248 / 248 tests pass; 0 regressions vs the 235 Plan 12-04 baseline.
- `cd Frontend2 && npm run test -- milestones-subtab timeline-tab` exits 0 (8 + 10 = 18 cases green).
- No imports from `Frontend/` (old frontend) — verified via grep on the 3 new files + 2 modified files.
- No imports from `shadcn/ui` — verified via grep.
- Acceptance grep matrix all green (12/12 checks).
- Post-commit deletion check: only the placeholder copy in lifecycle-tab.tsx was removed — intentional (Plan 12-05's purpose).
- TypeScript: no new errors. The pre-edit IDE hint about MilestonesSubTab being unused was resolved by the time the placeholder replacement landed.
