---
phase: 12
plan: 04
plan_id: "12-04"
subsystem: lifecycle-overview-history-subtabs
status: completed
completed_at: 2026-04-25
duration_min: 9
tasks_completed: 2
files_created: 5
files_modified: 3
tags:
  - frontend
  - lifecycle
  - overview-subtab
  - history-subtab
  - mini-metric
  - life-03
  - life-04
  - tdd
  - rtl
requirements:
  - LIFE-03
  - LIFE-04
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: Consumes lifecycleService.getPhaseTransitions, useTasks, useMilestones, computeNodeStates BFS, mapWorkflowConfig, and the canonical Phase 12 type set (WorkflowConfig / WorkflowNode / PhaseTransitionEntry).
    - phase: 12
      plan: 02
      reason: Plugs sub-tab content INTO the LifecycleTab outer shell ('summary-strip + phase-gate + canvas + sub-tab placeholder' from Plan 12-02). Plan 12-04 replaces that placeholder with a Tabs primitive routing between Overview / Milestones / History / Artifacts.
    - phase: 11
      reason: Reuses MTTaskRow compact (Phase 11 D-32) inside HistoryCard's 'Görev Detayları' Collapsible. The compact prop already existed — no modification needed (RESEARCH Open Question 4 resolved via verification grep).
  provides:
    - id: 12-04-mini-metric
      label: MiniMetric primitive — 4-cell metric tile with LIFE-03 '---' mono branch
    - id: 12-04-overview-subtab
      label: OverviewSubTab — default 4-metric variant (Toplam / Tamamlanan / Devam / İlerleme) + Kanban 3-metric variant (Lead / Cycle / WIP) + Faz Özeti + Yaklaşan Teslimler columns
    - id: 12-04-history-subtab
      label: HistorySubTab + HistoryCard — closed-phase cards with lazy-fetch 'Görev Detayları (N)' Collapsible (LIFE-04 contract)
    - id: 12-04-tabs-wiring
      label: LifecycleTab Tabs primitive routing — Overview + History live; Milestones + Artifacts placeholders for Plans 12-05/06
  affects:
    - Frontend2/components/project-detail/project-detail-shell.test.tsx (stale 'Alt sekmeler...' assertion rewired to four Tabs labels)
    - Frontend2/app/(shell)/projects/[id]/page.tsx (page-level useMilestones() prefetch)
tech_stack:
  added: []
  patterns:
    - "TanStack Query lazy-fetch via projectId-nulling: useTasks(open ? projectId : null, filters) — query disabled until first expand, cache hit on re-expand"
    - "Memoized filter object (`useMemo` on phase.id) for referentially-stable queryKey across re-renders"
    - "LIFE-03 contract — `value === '---'` triggers BOTH mono font AND var(--fg-subtle) color regardless of caller's `color`/`mono` props"
    - "Methodology-aware Tabs configuration — Kanban hides History + Artifacts (CONTEXT D-59); methodology branching kept inline rather than via lib/methodology-matrix.ts (matches SummaryStrip mode-chip kept-co-located strategy)"
    - "Closed-phase derivation from phase_transition activity feed — any node appearing as source_phase_id is treated as 'closed at least once'; first/last created_at + count aggregated client-side (no new backend endpoint)"
    - "Page-level useMilestones() pre-fetch primes the TanStack cache for both LifecycleTab Overview consumers and Plan 12-05's Timeline tab without prop drilling"
key_files:
  created:
    - Frontend2/components/lifecycle/mini-metric.tsx
    - Frontend2/components/lifecycle/mini-metric.test.tsx
    - Frontend2/components/lifecycle/overview-subtab.tsx
    - Frontend2/components/lifecycle/overview-subtab.test.tsx
    - Frontend2/components/lifecycle/history-card.tsx
    - Frontend2/components/lifecycle/history-subtab.tsx
    - Frontend2/components/lifecycle/history-subtab.test.tsx
  modified:
    - Frontend2/components/lifecycle/lifecycle-tab.tsx
    - Frontend2/components/project-detail/project-detail-shell.test.tsx
    - Frontend2/app/(shell)/projects/[id]/page.tsx
decisions:
  - "MTTaskRow compact prop ALREADY EXISTED (Phase 11 D-32 baseline). RESEARCH Open Question 4 resolved by source grep at Task 2 start: 7 references to `compact` already in `task-row.tsx`. No modification needed — HistoryCard imports TaskRow and passes `compact` directly."
  - "Lazy-fetch implemented via projectId-nulling rather than `enabled: open`. The shared `useTasks` hook uses `enabled: !!projectId` internally, so passing `open ? project.id : null` achieves the same gate. Equivalent semantics — `enabled: open` would have required modifying use-tasks.ts (out of scope), this approach keeps the hook signature unchanged."
  - "Closed-phase data source = phase_transition activity feed (already wired in Plan 12-01's lifecycleService.getPhaseTransitions). PhaseSummary counts (total/done/moved/note) shipped as optional overlay props (`phaseDoneCounts`, etc.) — Plan 12-06's PhaseReport service will replace these with real summaries; Plan 12-04 only needs the lazy-fetch infrastructure to satisfy LIFE-04."
  - "Tabs primitive accepts only `id: string`. The LifecycleTab type-narrows via a local `SubTabId` union and casts the onChange callback parameter — type-safe at the boundary."
  - "Memoized filters object in HistoryCard (`useMemo(() => ({ phase_id, status }), [phase.id])`) belt-and-braces for cache stability. TanStack Query v5 hashes queryKeys on value not reference, but the explicit memo guarantees referential stability for any future custom queryKeyHashFn override and is cheaper than recomputing the hash each render."
  - "OverviewSubTab Kanban detection uses `project.methodology === 'KANBAN' || workflow.mode === 'continuous'` — either signal triggers the 3-metric variant. Single-source-of-truth via lib/methodology-matrix.ts deferred until a third consumer needs it (matches the SummaryStrip / CriteriaEditorPanel kept-co-located strategy from Plans 12-02 + 12-03)."
metrics:
  duration_min: 9
  task_count: 2
  files_created: 5
  test_files_added: 3
  tests_added: 17
  full_suite_tests: 235
  full_suite_test_files: 39
---

# Phase 12 Plan 04: Overview + History Sub-Tabs Summary

LIFE-03 fully completed (in conjunction with Plan 12-02's Phase-Gate "Uygulanamaz" coverage) — the MiniMetric primitive ships with the canonical zero-task `---` branch (mono `var(--font-mono)` + `var(--fg-subtle)` regardless of caller props), and OverviewSubTab integrates the branch by passing the literal `'---'` to all 4 metric values when `phaseStats.total === 0`. LIFE-04 fully delivered — HistoryCard's "Görev Detayları (N)" Collapsible lazy-fetches `GET /tasks/project/{id}?phase_id=X&status=done` only on first expand, with TanStack Query cache reuse on subsequent re-opens (verified by `mock.calls.length === 1` after collapse + reopen in Test 2). The LifecycleTab outer shell from Plan 12-02 now hosts a 4-sub-tab Tabs primitive (Genel Bakış / Kilometre Taşları / Geçmiş / Artefaktlar) — Overview + History live; Milestones + Artifacts placeholders for Plans 12-05/06; Kanban methodology hides History + Artifacts per CONTEXT D-59. 5 new files, 3 modifications, 17 new RTL test cases, 235/235 full suite green — zero regressions vs the 218 baseline (17 net new + 1 rewired).

## What Shipped

### Task 1 — MiniMetric + OverviewSubTab (commits `03bbe01` + `a4ed2e7`)

`Frontend2/components/lifecycle/mini-metric.tsx` (~70 LOC) is the prototype-faithful 4-cell tile:

- Layout: `padding: 10`, `background: var(--surface-2)`, `borderRadius: var(--radius-sm)`, text-align center.
- Value: `fontSize: 18`, `fontWeight: 600`, `fontVariantNumeric: tabular-nums`. Color falls through to `color` prop or `var(--fg)`.
- Label: `fontSize: 10.5`, `color: var(--fg-muted)`, `marginTop: 4`.
- **LIFE-03 contract:** when `value === "---"`, BOTH `fontFamily: var(--font-mono)` AND `color: var(--fg-subtle)` are forced regardless of `color`/`mono` props the caller passed. This guarantees the zero-task signature is identical across every consumer (Overview / History / Phase Gate header).

`Frontend2/components/lifecycle/overview-subtab.tsx` (~530 LOC) ports `lifecycle-tab.jsx:130-204` ~200 lines verbatim per CONTEXT D-48 budget:

- **Active phase detail Card:** name + Aktif Badge + (info badge if zero-task) + 4-metric grid + ProgressBar.
- **Default 4-metric variant:** Toplam / Tamamlanan / Devam Eden / İlerleme — labels match UI-SPEC §3.5 + i18n.
- **Kanban 3-metric variant** (`project.methodology === 'KANBAN' || workflow.mode === 'continuous'`): Ortalama Lead Time / Ortalama Cycle Time / WIP. Lead/Cycle render em-dash placeholders (real metrics derive from task lifecycle in a follow-up); WIP counts in-progress tasks.
- **Zero-task branch (LIFE-03):** when `phaseStats.total === 0`, all 4 metric values become the literal string `'---'`, which MiniMetric renders in mono+grey.
- **2-column layout below:** Faz Özeti (per-phase row with StatusDot + name + ProgressBar + mono percent; active row gets `var(--accent)` background + 600 weight) + Yaklaşan Teslimler (task entries with key/title/Avatar/days-left, plus optional milestone entries with KT badge + name + days). Both columns surface graceful empty states.

`Frontend2/components/lifecycle/mini-metric.test.tsx` ships 4 RTL cases (Tests 1-3 + 3b mono prop check). `Frontend2/components/lifecycle/overview-subtab.test.tsx` ships 6 RTL cases (Tests 4-7 + 7b populated + 7c Faz Özeti rows).

### Task 2 — HistoryCard + HistorySubTab + Tabs wiring (commits `98d9405` + `08f1441`)

**Step 1 — MTTaskRow compact prop verification.** Source grep at task start showed 7 existing references to `compact` in `Frontend2/components/my-tasks/task-row.tsx` — Phase 11 D-32 already shipped `compact?: boolean` with `padY = compact ? 4 : 8` + `fontSize = compact ? 12.5 : 13` + `Avatar size compact ? 18 : 20`. **No modification needed.** RESEARCH Open Question 4 resolved by verification.

**Step 2 — `Frontend2/components/lifecycle/history-card.tsx`** (~265 LOC) — past-phase card per UI-SPEC §3 lines 820-859:

- Header row: `phase.name` + `<Badge size="xs" tone="neutral">{durationDays} gün</Badge>` + mono `closedAt` date row.
- 4-MiniMetric strip: Toplam / Tamamlanan / Taşınan / Başarı (with appropriate color tokens per metric and `'---'` fallback when summary.total === 0).
- Optional italic note quotation in `var(--surface-2)` callout.
- **"Görev Detayları (N)" Collapsible** with LIFE-04 lazy-fetch:
  - Local `[open, setOpen] = useState(false)` state.
  - `useTasks(open ? project.id : null, filters)` — passing `null` for projectId disables the underlying TanStack `useQuery` (semantically equivalent to `enabled: open`).
  - Memoized `filters = useMemo(() => ({ phase_id, status: 'done' }), [phase.id])` — referentially stable across re-renders.
  - Skeleton 3-row placeholder during `isLoading`; empty state copy on `closedTasks.length === 0`; `closedTasks.map(t => <TaskRow compact starred={false} onToggleStar={() => undefined} />)` on success.
  - The "(N)" label shows `closedTasks.length` post-load and falls back to `summary.done` pre-load for an instantly-correct visual.
- ChevronRight unicode glyph rotates 90° on open (`transition: transform 0.15s`).

**Step 3 — `Frontend2/components/lifecycle/history-subtab.tsx`** (~165 LOC) — closed-phase list shell:

- `deriveClosedPhases(workflow, activity, ...overlayCounts)` aggregates the activity feed by `extra_metadata.source_phase_id` and emits a `ClosedPhaseInfo[]` sorted by most-recent close.
- Optional overlay props (`phaseDoneCounts`, `phaseTotalCounts`, `phaseMovedCounts`, `phaseNotes`) feed the per-card `PhaseSummary`. Plan 12-06's PhaseReport service will replace these with real backend summaries.
- Section header `Kapatılmış Fazlar — {N} faz tamamlandı`. Empty state surface `Henüz kapatılmış faz yok.`.

`Frontend2/components/lifecycle/history-subtab.test.tsx` ships 7 RTL cases:
- Test 1: lazy-fetch — `mockedTaskGetByProject` count is 0 pre-expand, becomes 1 post-click with `{ phase_id: 'planning', status: 'done' }` filters.
- Test 2: cache reuse — close + reopen the Collapsible, assert call count stays at 1.
- Test 3: HistoryCard direct render — Collapsible label is `Görev Detayları (4)` with `summary.done = 4`.
- Test 4: empty state — `closedTasks.length === 0` after fetch → `Bu faz için kayıtlı görev bulunamadı.`.
- Test 5: TaskRow rows render — `Görev A` + `Görev B` text appears post-expand (compact prop pass-through verified by source grep).
- Test 6: workflow with no activity → `Henüz kapatılmış faz yok.`.
- Test 7: LIFE-04 acceptance — 2 closed phases (planning + execution) with overlay `{ planning: 3, execution: 3 }` → 2 cards, both with `Görev Detayları (3)`.

**Step 5 — `Frontend2/components/lifecycle/lifecycle-tab.tsx`** modifications:

- Imports: `Tabs` + `TabItem` from primitives, `lifecycleService` + `PhaseTransitionEntry` from lifecycle-service, `useQuery` from TanStack, `OverviewSubTab` + `HistorySubTab` from sibling files.
- Wires `useQuery(['activity', project.id, 'phase-transition'], () => lifecycleService.getPhaseTransitions(project.id))` — no longer synthesizing an empty array as Plan 12-02 did.
- New state: `const [subTab, setSubTab] = useState<SubTabId>("overview")` + `const isKanban = project.methodology === "KANBAN" || workflow?.mode === "continuous"`.
- Replaces the `Alt sekmeler Plan 12-04..06'da geliyor.` placeholder div with:
  - `<Tabs/>` primitive (4 tabs default; 2 tabs Kanban variant).
  - Conditional sub-tab content: Overview always; History only when `!isKanban`; Milestones + Artifacts as `<Card padding={20}>` placeholders citing the future plans.

**Step 6 — `Frontend2/app/(shell)/projects/[id]/page.tsx`** adds `useMilestones(projectId)` at page level. The hook returns are intentionally unused at page scope — the side effect is priming the TanStack cache so LifecycleTab Overview's Yaklaşan Teslimler column and Plan 12-05's Timeline flag-line integration both hit cache without prop drilling.

**Step 7 — `Frontend2/components/project-detail/project-detail-shell.test.tsx`** rewired (Rule 1 — bug). The Plan 12-02 test asserted `getByText(/Alt sekmeler Plan 12-04/)` against the placeholder copy that Plan 12-04 just removed. Updated to assert all 4 Tabs labels (Genel Bakış / Kilometre Taşları / Geçmiş / Artefaktlar) render after clicking the Yaşam Döngüsü tab.

## RESEARCH Open Question 4 — MTTaskRow compact prop resolution

**Question:** Does `Frontend2/components/my-tasks/task-row.tsx` already accept a `compact?: boolean` prop, or does Plan 12-04 need to add one?

**Answer (verified at Task 2 start):** Already accepts `compact?: boolean` (Phase 11 D-32 ships it as the dashboard-embedding density flag). Source grep:

```
6:// the "cozy" density baseline and a `compact` flag for dashboard embedding.
24:  compact?: boolean
45:  compact,
57:  const padY = compact ? 4 : 8
58:  const fontSize = compact ? 12.5 : 13
182:        <Avatar user={assigneeAvatar} size={compact ? 18 : 20} />
184:        <span style={{ width: compact ? 18 : 20 }} />
```

**Resolution:** Zero modifications to `task-row.tsx`. HistoryCard imports `TaskRow` from `@/components/my-tasks/task-row` and passes `compact` directly. The Phase 11 D-32 baseline is non-breaking — UI-SPEC line 1380 specs the History compact size delta (padY 4 vs 8, font 12.5 vs 13), exactly what the existing prop enables.

## Lazy-fetch test mock — call-count assertion semantics

Test 2 (cache hit) is the LIFE-04 acceptance check. The test:

1. Renders `<HistorySubTab/>` with one closed-phase activity entry.
2. Asserts `mockedTaskGetByProject.toHaveBeenCalledTimes(0)` pre-expand — the Collapsible is closed, `useTasks` is called with `projectId: null`, query disabled.
3. Clicks the Collapsible button → asserts `mockedTaskGetByProject.toHaveBeenCalledTimes(1)` after waitFor — first expand triggered the fetch.
4. Clicks the Collapsible again to collapse → re-clicks to re-expand.
5. Awaits 50 ms then asserts `mockedTaskGetByProject.toHaveBeenCalledTimes(1)` — TanStack Query returned the cached data without re-firing the mutation (`staleTime: Infinity` in the test QueryClient ensures cache validity).

The semantic this verifies:
- **Lazy:** the network call only fires when the user opens the Collapsible.
- **Cached:** subsequent re-opens of the same Collapsible (with the same `phase_id` filter) reuse the cached result via TanStack's queryKey hash equivalence.

This satisfies the CONTEXT D-56 contract literally (`No pre-loading of all closed-phase tasks. Accordion-driven. TanStack Query cache key ['tasks', 'project', projectId, { phase_id }] so re-open hits cache.`) and the SPEC LIFE-04 acceptance (`First click on a Collapsible triggers a network request; subsequent toggles do not.`).

## OverviewSubTab port — deviations from prototype

The prototype `lifecycle-tab.jsx:130-204` is the 1:1 reference. Plan 12-04 deviations are minimal and documented:

1. **`window.SPMSData.MILESTONES` → `milestones` prop.** Prototype reads from a global module; Frontend2 wires this via TanStack Query at page level (`useMilestones(projectId)`). The OverviewSubTab `milestones` prop accepts the result; falls back to `[]` when undefined. Effectively equivalent.
2. **`window.SPMSData.getUser(t.assigneeId)` → inline avatar fallback.** Prototype calls a global lookup to construct the Avatar user object; Frontend2 builds the same `{ initials, avColor }` shape directly from `task.assigneeId` (matches Phase 11 D-32 MTTaskRow pattern).
3. **Status normalizer.** Prototype tests `t.status !== "done"` directly; Frontend2 normalizes via `normalizeStatus()` so backend statuses (`in_progress`, `completed`, `closed`) coerce to canonical values. Defensive — prototype's data shape was tighter.
4. **Phase summary state derivation.** Prototype uses `phaseMap[stage] === phaseStage` ordering; Frontend2 uses `findIndex(activePhase.id) → i < idx ? past : future`. Matches the BFS contract from Plan 12-01 graphTraversal — same per-row visual outcome.

No visual or copy deviation — every label, color token, padding, and grid template matches the prototype.

## Test Coverage

| File                                                   | Test cases | Notes                                                                                       |
|--------------------------------------------------------|------------|---------------------------------------------------------------------------------------------|
| `mini-metric.test.tsx` (NEW)                           | 4          | Value rendering + label + LIFE-03 `---` mono branch + explicit mono prop                    |
| `overview-subtab.test.tsx` (NEW)                       | 6          | 4-metric default + Kanban 3-metric + LIFE-03 zero-task + Yaklaşan Teslimler empty + populated + Faz Özeti rows |
| `history-subtab.test.tsx` (NEW)                        | 7          | Lazy-fetch + cache reuse + label + empty + compact + workflow-empty + LIFE-04 2×3 acceptance |
| `project-detail-shell.test.tsx` (rewired)              | 7          | 6 pre-existing + 1 rewritten (sub-tabs placeholder removed; 4 Tabs labels asserted)          |

Full Frontend2 suite: 235 / 235 tests across 39 files — **zero regressions** vs the 218-test Plan 12-03 baseline (17 net new + 1 rewired).

`cd Frontend2 && npm run test -- mini-metric overview-subtab history-subtab` exits 0 with all 17 new cases green.

## Acceptance grep matrix (Plan 12-04)

| Acceptance check                                                                       | Result |
|----------------------------------------------------------------------------------------|--------|
| `value === '---' / '---' literal` in mini-metric.tsx                                   | 4 hits |
| `var(--font-mono)` in mini-metric.tsx                                                  | 1 hit  |
| `methodology === 'KANBAN'` in overview-subtab.tsx                                      | 1 hit  |
| `Lead Time / Cycle Time / WIP` in overview-subtab.tsx                                  | 6 hits |
| `Toplam / Tamamlanan / Devam / İlerleme` in overview-subtab.tsx                        | 4 hits |
| `Yaklaşan Teslim` in overview-subtab.tsx                                               | 5 hits |
| `compact` in task-row.tsx (pre-existing Phase 11 D-32)                                 | 7 hits |
| `compact` forwarded in history-card.tsx                                                | 3 hits (1 prop, 2 doc lines) |
| `enabled: open` lazy-fetch guard via `open ? project.id : null` in history-card.tsx     | 1 runtime + 2 doc lines |
| `phase_id` filter in history-card.tsx                                                  | 3 hits |
| `status: "done"` filter in history-card.tsx                                            | 1 hit  |
| `Görev Detayları` label in history-card.tsx                                            | 4 hits |
| `Tabs` primitive in lifecycle-tab.tsx                                                  | 2 hits |
| `OverviewSubTab` + `HistorySubTab` in lifecycle-tab.tsx                                | 4 hits |
| `isKanban / methodology === "KANBAN"` in lifecycle-tab.tsx                              | 5 hits |

All grep checks pass.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] `project-detail-shell.test.tsx` 'Alt sekmeler Plan 12-04..06' assertion was stale.**
- Found during: full-suite re-run after Task 2.
- Issue: Plan 12-02 placed the assertion `expect(getByText(/Alt sekmeler Plan 12-04/)).toBeInTheDocument()` against the deferred-sub-tabs placeholder copy in `lifecycle-tab.tsx`. Plan 12-04's whole point is to remove that placeholder by replacing it with the Tabs primitive — so the assertion failed at Task 2 GREEN.
- Fix: rewired the assertion to verify the four Tabs labels render after clicking Yaşam Döngüsü (Genel Bakış / Kilometre Taşları / Geçmiş / Artefaktlar).
- File: `Frontend2/components/project-detail/project-detail-shell.test.tsx`.

### Plan-explicit choices

- **`enabled: open` lazy-fetch implemented via `useTasks(open ? project.id : null, filters)`.** Plan wording was `useTasks(project.id, { phase_id, status: 'done' }, { enabled: open })`. The shared `useTasks` hook (Phase 11) does not accept a third `options` parameter — modifying it was out of scope. The projectId-nulling pattern leverages the hook's existing `enabled: !!projectId` gate to achieve the identical semantic: query disabled until first expand → fires once → cache hit on re-open. Verified by Test 2's call-count assertion.
- **`phaseDoneCounts` overlay prop** on HistorySubTab. The plan's Test 7 acceptance ("2 closed phases × 3 done") needed a way to inject the per-phase done count without depending on the (Plan 12-06) PhaseReport service. Used an optional `phaseDoneCounts: Record<string, number>` prop to satisfy the test deterministically. Plan 12-06 will swap this for the real PhaseReport-driven counts.
- **`compact` prop verification by source grep, not modification.** Plan Step 1 said "if no, add a compact?: boolean prop". The grep confirmed it already exists, so no change to `task-row.tsx`. RESEARCH Open Question 4 resolved.
- **Page-level `useMilestones(projectId)` call.** Plan said "MODIFY .../page.tsx ... pass them as a `milestones` prop to ProjectDetailShell". `ProjectDetailShell` does not currently accept a `milestones` prop, and adding one is logical Plan 12-05 surface. Minimal correct interpretation: just call `useMilestones` at the page level so TanStack cache primes. Both LifecycleTab Overview and Plan 12-05's Timeline tab can re-call `useMilestones(project.id)` and hit the cache via queryKey equivalence.

### Threat surface scan

No new network endpoints or trust-boundary changes beyond those enumerated in `<threat_model>`:

- T-12-04-01 (I — History Collapsible task list information disclosure) → accept (mitigated by Phase 9 backend project-membership enforcement on `GET /tasks/project/{id}`). No new attack surface.

## Self-Check: PASSED

- All 5 created files exist:
  - `Frontend2/components/lifecycle/mini-metric.tsx` (FOUND)
  - `Frontend2/components/lifecycle/mini-metric.test.tsx` (FOUND)
  - `Frontend2/components/lifecycle/overview-subtab.tsx` (FOUND)
  - `Frontend2/components/lifecycle/overview-subtab.test.tsx` (FOUND)
  - `Frontend2/components/lifecycle/history-card.tsx` (FOUND)
  - `Frontend2/components/lifecycle/history-subtab.tsx` (FOUND)
  - `Frontend2/components/lifecycle/history-subtab.test.tsx` (FOUND)
- All 3 modified files updated:
  - `Frontend2/components/lifecycle/lifecycle-tab.tsx` (Tabs primitive + sub-tab content wired; phase-transition useQuery added)
  - `Frontend2/components/project-detail/project-detail-shell.test.tsx` (Plan 12-02 assertion rewired to 4 Tabs labels)
  - `Frontend2/app/(shell)/projects/[id]/page.tsx` (useMilestones page-level prefetch added)
- Four task commits exist:
  - `03bbe01` test(12-04): add failing tests for MiniMetric + OverviewSubTab
  - `a4ed2e7` feat(12-04): ship MiniMetric + OverviewSubTab with LIFE-03 zero-task branch
  - `98d9405` test(12-04): add failing tests for HistorySubTab + HistoryCard
  - `08f1441` feat(12-04): ship HistoryCard + HistorySubTab + Tabs primitive wiring
- 235 / 235 tests pass; 0 regressions.
- `cd Frontend2 && npm run test -- mini-metric overview-subtab history-subtab` exits 0 (17 new cases green).
- No imports from `Frontend/` (old frontend) — verified via grep on the 5 new files.
- No imports from `shadcn/ui` — verified via grep on the 5 new files.
- Acceptance grep matrix all green (15/15 checks).
- Post-commit deletion check: no files deleted in either feat commit.
- TypeScript: no new errors introduced. The IDE hint diagnostics about unused imports during the multi-edit Tabs wiring are resolved by the time all edits land (Tabs/TabItem/lifecycleService/etc. are all consumed in the final state).
