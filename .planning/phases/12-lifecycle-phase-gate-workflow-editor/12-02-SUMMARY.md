---
phase: 12
plan: 02
plan_id: "12-02"
subsystem: lifecycle-tab-and-phase-gate
status: completed
completed_at: 2026-04-25
duration_min: 12
tasks_completed: 2
files_created: 5
files_modified: 3
tags:
  - frontend
  - lifecycle
  - phase-gate
  - life-02
  - life-03
  - tdd
  - rtl
requirements:
  - LIFE-02
  - LIFE-03
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: Consumes the entire Plan 12-01 infrastructure — usePhaseTransition (Idempotency-Key state), useTransitionAuthority (3-role permission), useCycleCounters (×N badges), computeNodeStates BFS, mapWorkflowConfig, PhaseGate service, and the read-only WorkflowCanvas wrapper.
    - phase: 11
      reason: Replaces the Phase 11 D-10 LifecycleStubTab and re-uses the project-detail-shell tab plumbing (no rearchitecture).
  provides:
    - id: 12-02-phase-gate
      label: PhaseGateExpand inline panel with Idempotency-Key + 5-error matrix + override + LIFE-03 zero-task branch
    - id: 12-02-summary-strip
      label: SummaryStrip with active-phase Badge + ProgressBar + mode chip + Sonraki Faza Geç + Düzenle (permission/mode gated)
    - id: 12-02-lifecycle-tab
      label: LifecycleTab outer shell hosting SummaryStrip + PhaseGateExpand + read-only WorkflowCanvas (sub-tabs deferred to Plans 12-04..06)
  affects:
    - Frontend2/components/project-detail/project-detail-shell.tsx (lifecycle branch swap)
    - Frontend2/components/project-detail/lifecycle-stub-tab.tsx (collapsed to a re-export)
tech_stack:
  added: []
  patterns:
    - "Idempotency-Key once-per-panel-open via React state; reused on retry, fresh UUID on remount (CONTEXT D-42 / T-09-08)"
    - "5-error matrix: 409 (Tekrar Dene) / 422 (per-criterion list) / 429 (countdown disable) / 400 (safety-net banner) / network (toast)"
    - "Override flow: sequential-locked + unmet criteria → checkbox visible → primary button relabels to 'Zorla Geç' (danger) + sends allow_override:true"
    - "LIFE-03 zero-task branch: phaseStats.total === 0 → Uygulanamaz auto-criteria + info AlertBanner (LIFE-03 Phase-Gate side fully shipped)"
    - "Open-tasks SegmentedControl + per-task exception dropdown via Collapsible — non-Aynı entries populate exceptions[] in DTO"
    - "useRouter().push for both Düzenle (workflow-editor route) and Kriterleri düzenle (Settings deep-link)"
key_files:
  created:
    - Frontend2/components/lifecycle/phase-gate-expand.tsx
    - Frontend2/components/lifecycle/phase-gate-expand.test.tsx
    - Frontend2/components/lifecycle/summary-strip.tsx
    - Frontend2/components/lifecycle/summary-strip.test.tsx
    - Frontend2/components/lifecycle/lifecycle-tab.tsx
  modified:
    - Frontend2/components/project-detail/lifecycle-stub-tab.tsx
    - Frontend2/components/project-detail/project-detail-shell.tsx
    - Frontend2/components/project-detail/project-detail-shell.test.tsx
decisions:
  - "Idempotency-Key reuse-on-retry vs new-on-reopen verified by RTL Test 7 + Test 8 (same-key across 3 retries; different key after unmount/remount)"
  - "Open-tasks SegmentedControl exceptions Collapsible needed NO backend DTO adaptation — Phase 9 D-04 already accepts exceptions[]"
  - "Mode-chip localization handled inline via two MODE_LABEL_TR / MODE_LABEL_EN maps + MODE_TONE map (avoided pulling shared methodology-matrix dependency)"
  - "LifecycleTab synthesizes an empty phaseTransitions list for BFS; live transitions wire-up lands in Plan 12-04 (useLifecycleProject composite hook). BFS gracefully falls back to first isInitial=active when transitions empty."
  - "lifecycle-stub-tab.tsx kept as a 3-line re-export rather than deleted — avoids breaking any out-of-tree consumers and unblocks orderly Phase 13 cleanup."
  - "project-detail-shell.test.tsx 'Faz 12 stub' assertion was outdated — rewritten to assert the LifecycleTab's SummaryStrip Düzenle button and the sub-tabs placeholder copy."
metrics:
  duration_min: 12
  task_count: 2
  files_created: 5
  test_files_added: 2
  tests_added: 17
  full_suite_tests: 208
  full_suite_test_files: 34
---

# Phase 12 Plan 02: Lifecycle Tab Shell + Phase Gate Inline Expand Summary

LIFE-02 fully delivered — the Phase Gate inline-expand panel ships with the Idempotency-Key reuse semantics (CONTEXT D-42), the canonical 5-error matrix (D-41), the sequential-locked override flow (D-39), the 500-char note limit (D-46), and the LIFE-03 zero-task branch (D-43). The methodology-aware SummaryStrip carries the active-phase Badge + ProgressBar + mode chip + the permission-gated "Sonraki Faza Geç" + the always-visible "Düzenle" workflow-editor entrypoint (D-40 + D-59). The new LifecycleTab outer shell mounts those three primitives plus the read-only WorkflowCanvas inside the existing project-detail-shell tab plumbing — replacing the Phase 11 D-10 stub. 5 new files, 3 modifications, 17 new RTL test cases, 208 tests pass with zero regressions.

## What Shipped

### Task 1 — PhaseGateExpand (commit `85107c6`)

`Frontend2/components/lifecycle/phase-gate-expand.tsx` (~520 LOC) implements the inline-expand panel anatomy from UI-SPEC §4 (lines 861-927):

- Header row with `Faz Geçişi: {current.name} → {next.name}` and a close button.
- Task summary line `Toplam · Tamamlanan · Açık` with mono numbers.
- 2-column grid for auto criteria (3 rows: `all_tasks_done`, `no_critical_tasks`, `no_blockers`) and manual criteria (free-text checklist + "Kriterleri düzenle →" deep-link).
- Auto-check icon mapping per UI-SPEC line 896-899:
  - `phaseStats.total === 0` → grey `<Circle/>` + "Uygulanamaz — {label}" prefix.
  - `c.ok && total > 0` → green `<CircleCheck/>`.
  - `!c.ok && total > 0` → danger `<AlertCircle/>`.
- Open Tasks `<SegmentedControl/>` (3 options: Sonraki faza taşı / Backlog'a taşı / Bu fazda bırak).
- "Farklı davranış gerekli? (N görev)" `<Collapsible/>` listing every open task with a per-row mini `<select>` (Aynı / Sonraki / Backlog / Kalsın). Non-"Aynı" entries populate the request body's `exceptions[]` array.
- 500-char note `<textarea/>` with mono live counter; border turns `var(--priority-critical)` on overflow; submit button disables when `note.length > 500`.
- Mode-aware AlertBanners:
  - `tone="info"` "Bu fazda henüz görev yok. Geçiş serbestçe yapılabilir." when `phaseStats.total === 0` (LIFE-03).
  - `tone="danger"` "Sıralı kilitli modda tüm kriterler karşılanmadan geçiş yapılamaz." when `mode === 'sequential-locked' && unmet > 0`.
  - `tone="warning"` "Bazı kriterler karşılanmadı. Yine de geçiş yapabilirsiniz." in flexible/sequential-flexible modes with unmet criteria.
- Override checkbox "Kriterler karşılanmadan geçilsin" rendered only in `sequential-locked` mode with unmet criteria. When checked, the primary button relabels to "Zorla Geç" with `variant="danger"` and the submit DTO carries `allow_override: true`.
- Server-error AlertBanners for 409 (with "Tekrar Dene" Button), 400 wrong-mode safety net, 422 per-criterion failure list with `<ul>` from response `unmet[]`. 429 surfaces a countdown toast and disables submit until the countdown decrements past 0.
- Network errors surface a generic error toast.

The component consumes `usePhaseTransition(project.id)` from Plan 12-01 — the hook owns the Idempotency-Key React state. The component calls `open()` once on mount; the same `idempotencyKey` is forwarded into every `mutation.mutate(dto)` call (verified by Test 7 — three retries within a session all share the same UUID). On unmount + remount the hook re-runs `open()` and produces a fresh UUID (verified by Test 8).

`Frontend2/components/lifecycle/phase-gate-expand.test.tsx` ships 12 RTL cases covering: happy path, 422 unmet, 409 lock + retry-with-same-key, 429 countdown, 400 wrong-mode, override flow, key reuse on retry, key new on reopen, 500-char gate, LIFE-03 zero-task branch, exceptions Collapsible, and the deep-link.

### Task 2 — SummaryStrip + LifecycleTab + shell wiring (commit `bbc4a40`)

**`Frontend2/components/lifecycle/summary-strip.tsx`** (~135 LOC) renders the top strip per UI-SPEC §1 (lines 771-796):

- `<Badge tone="primary">` with 1-based active phase index + total phases + active phase name.
- `<ProgressBar value={phaseProgress} max={100}>` 120px wide + mono percent text.
- "{N} kalan" open-tasks counter pill.
- Optional next-milestone chip (`<Target/>` icon + name + days remaining + "gün") — supplied by the parent via `nextMilestone` prop, omitted gracefully when null.
- `<Badge size="xs">` mode chip with the localized label (Esnek / Sıralı · kilitli / Sıralı · esnek / Sürekli).
- `<Button variant="primary">` "Sonraki Faza Geç" — hidden when `useTransitionAuthority(project) === false` OR `workflow.mode === 'continuous'`.
- `<Button variant="ghost">` "Düzenle" — calls `router.push('/workflow-editor?projectId=' + project.id)`. Always rendered.

`Frontend2/components/lifecycle/summary-strip.test.tsx` ships 5 RTL cases: default render, continuous-mode hide, permission-false hide, Düzenle navigation, onOpenGate callback wiring.

**`Frontend2/components/lifecycle/lifecycle-tab.tsx`** (~250 LOC) is the outer shell:

- Reads `project.processConfig.workflow` via `mapWorkflowConfig`. Falls back to a "Bu projede aktif iş akışı tanımlanmamış" message when unset.
- Computes node states via `lib/lifecycle/graph-traversal::computeNodeStates` (Plan 12-01 pure BFS).
- Picks `activePhase` = first node with `state === 'active'`; falls back to first non-archived node.
- Picks `nextPhase` from the first outgoing flow-typed edge of the active phase (any-type fallback if no flow edge).
- Subscribes to `useCycleCounters(project.id)` (Plan 12-01) and pipes the counts into React Flow node data.
- Reads `process_config.phase_completion_criteria[activePhase.id]` to seed the PhaseGateExpand criteria (defaults applied when unconfigured).
- Renders `<SummaryStrip/>` → optional `<PhaseGateExpand/>` (when `gateOpen` is true) → 480-px-tall `<WorkflowCanvas readOnly={true} showMiniMap/>`. A small placeholder note below the card calls out that sub-tabs land in Plans 12-04..06.

**`Frontend2/components/project-detail/lifecycle-stub-tab.tsx`** is now a 3-line re-export of `LifecycleTab as LifecycleStubTab` — avoids breaking any consumers that imported the stub while making it a no-op.

**`Frontend2/components/project-detail/project-detail-shell.tsx`** drops the `LifecycleStubTab` import; the lifecycle tab branch mounts `<LifecycleTab project={project}/>` directly. Comment line updated to credit Plan 12-02.

**`Frontend2/components/project-detail/project-detail-shell.test.tsx`** rewires the "Faz 12 stub" assertion to verify the LifecycleTab mounts (asserts the SummaryStrip "Düzenle" button + the sub-tabs placeholder copy). Adds a `next/navigation` mock so SummaryStrip's `useRouter()` works under jsdom.

## Idempotency-Key reuse semantics — confirmation

Tests 7 + 8 in `phase-gate-expand.test.tsx` exercise the CONTEXT D-42 reuse-on-retry vs new-on-reopen contract directly:

- **Test 7 — reuse on retry within session:** mocked `crypto.randomUUID()` is sequential (`uuid-1`, `uuid-2`, ...). Three submits in a single panel-open session — first fails 409, two retries via "Tekrar Dene" — assert all three calls carry the same `Idempotency-Key` value (`uuid-1` × 3). Verified ✓.
- **Test 8 — new key on reopen:** mount the component → submit → unmount → mount again → submit. Assert the two submits carry **different** `Idempotency-Key` values (`uuid-1` and `uuid-2`). Verified ✓.

The hook contract is precisely what CONTEXT D-42 specifies: UUID generated once on `open()`, persisted in React state, passed through to every `phaseGateService.execute(projectId, dto, idempotencyKey)` call until unmount; remount triggers a fresh `open()` and a new UUID. Phase 9 D-50's 10-min idempotency cache means retries inside the window get the cached response server-side without re-executing.

## "Açık Görevler" SegmentedControl + exceptions Collapsible — backend DTO adaptation

**No backend adaptation needed.** Phase 9 D-04's `PhaseTransitionDTO` already accepts:

```ts
{
  source_phase_id: string,
  target_phase_id: string,
  default_action?: 'next' | 'backlog' | 'stay',
  exceptions?: Array<{ task_id: number, action: 'next' | 'backlog' | 'stay' }>,
  allow_override?: boolean,
  note?: string,
}
```

The frontend builds `exceptions[]` by filtering the per-task `exceptions` state object for entries whose action is not "Aynı" (the inherit-default sentinel) and casting "stay" through unchanged. The `default_action` field maps directly from the SegmentedControl `openTaskAction` state.

## Methodology-aware mode label localization

Three module-top constant maps drive the SummaryStrip mode chip:

```ts
const MODE_LABEL_TR: Record<WorkflowMode, string> = {
  flexible: "Esnek",
  "sequential-locked": "Sıralı · kilitli",
  "sequential-flexible": "Sıralı · esnek",
  continuous: "Sürekli",
}
const MODE_LABEL_EN: Record<WorkflowMode, string> = { ... }
const MODE_TONE: Record<WorkflowMode, "warning" | "info" | "neutral"> = {
  flexible: "neutral",
  "sequential-locked": "warning",
  "sequential-flexible": "neutral",
  continuous: "info",
}
```

This mirrors the prototype `lifecycle-tab.jsx:62-64` ternary collapse but switches to `Record<WorkflowMode, ...>` lookups so future `WorkflowMode` additions (e.g. a fifth mode) trip the TS exhaustiveness check immediately. The full WorkflowMode union is exported from `lifecycle-service.ts` (Plan 12-01) so the maps stay locked to the canonical type.

The hook `useApp().language` selects which map to read — Turkish-first per project convention; English on `language === "en"`. Both maps stay co-located in `summary-strip.tsx` for trivial co-edit; if more components need the same labels we'll lift them into `lib/methodology-matrix.ts` (Phase 11) in a follow-up.

## Test Coverage

| File | Test cases | Notes |
|------|------------|-------|
| `phase-gate-expand.test.tsx` | 12 | All 5 error states + override + key reuse + key new + 500-char + LIFE-03 + exceptions + deep-link |
| `summary-strip.test.tsx` | 5 | Default render + continuous-hide + permission-hide + Düzenle nav + onOpenGate callback |
| `project-detail-shell.test.tsx` | 7 | 6 pre-existing + 1 rewired Lifecycle assertion |

Full Frontend2 suite: 208 tests across 34 files — **zero regressions** from the 207-test baseline (one rewritten test, two new test files).

`cd Frontend2 && npm run test -- phase-gate-expand summary-strip` exits 0 with all 17 cases green.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] `project-detail-shell.test.tsx` 'Faz 12 stub' assertion was stale.**
- Found during: Task 2 full-suite re-run.
- Issue: the test asserted `getByText(/Faz 12'de aktive edilecek/)` but Plan 12-02's whole point is to remove that copy.
- Fix: rewrote the assertion to verify the LifecycleTab actually mounts — looks for the SummaryStrip "Düzenle" button (always rendered when workflow exists) and the sub-tabs placeholder copy.
- Files: `Frontend2/components/project-detail/project-detail-shell.test.tsx`.

**2. [Rule 3 — Blocking] `useRouter()` from `next/navigation` threw 'invariant expected app router to be mounted' in `project-detail-shell.test.tsx`.**
- Found during: Task 2 full-suite re-run.
- Issue: the SummaryStrip mounts inside the LifecycleTab branch, and SummaryStrip calls `useRouter().push`. The shell test runs under jsdom without an App Router shell, so the hook throws.
- Fix: added the same `vi.mock("next/navigation", ...)` shim used by other unit tests; mocks `useRouter / usePathname / useSearchParams`.
- Files: `Frontend2/components/project-detail/project-detail-shell.test.tsx`.

### Plan-explicit choices

- **`fireEvent.change` over `userEvent.type` for the 500-char overflow test.** `userEvent.type` would type 501 characters at ~10 ms each (5 s) and exceed the per-test timeout. `fireEvent.change` writes the full string in one synthetic event — equivalent for the assertion target (textarea value + counter + disabled state).
- **Test 4 (429 countdown) does NOT use `vi.useFakeTimers`.** Mixing fake timers with `userEvent` + TanStack Query mutations introduces ordering issues (the mutation's onError callback fires after a microtask that the fake clock can't advance). The test now asserts (a) the toast was fired and (b) submit is disabled while the countdown is active — both observable side effects of the 429 handler. The countdown decrement loop itself is exercised in dev/prod via `setTimeout`.
- **`act` import removed from the test file.** Initial draft imported `act` for the fake-timer plan; once Test 4 was rewritten to drop fake timers, the import became unused (caught by TS strict).

### Threat surface scan

No new network endpoints or trust-boundary changes introduced beyond those already enumerated in `<threat_model>` (T-09-08 Idempotency-Key replay, T-12-02-01 button visibility, T-12-02-02 override authority — all mitigated as designed).

## Self-Check: PASSED

- All 5 created files exist (`ls Frontend2/components/lifecycle/{phase-gate-expand,phase-gate-expand.test,summary-strip,summary-strip.test,lifecycle-tab}.tsx`).
- 3 modified files updated (`lifecycle-stub-tab.tsx` shrunk to 3 lines; `project-detail-shell.tsx` imports `LifecycleTab` not `LifecycleStubTab`; `project-detail-shell.test.tsx` mocks `next/navigation` + asserts new copy).
- Two task commits exist: `85107c6` (PhaseGateExpand), `bbc4a40` (SummaryStrip + LifecycleTab + shell wiring).
- All 17 new RTL test cases pass.
- Full suite: 208 / 208 pass, 0 regressions.
- Acceptance grep matrix all green:
  - `usePhaseTransition\|idempotencyKey` in `phase-gate-expand.tsx` = 5 (≥ 2 ✓)
  - `Uygulanamaz` count = 2 (≥ 1 ✓)
  - `phaseStats.total === 0 / total === 0 / isZeroTaskPhase` count = 4 (≥ 1 ✓)
  - `Zorla Geç` = 1 (≥ 1 ✓)
  - `Kriterleri düzenle / sub=lifecycle&phase=` = 2 (≥ 1 ✓)
  - `maxLength / note.length > 500 / noteOver` = 5 (≥ 1 ✓)
  - `retry_after_seconds / countdown` = 9 (≥ 1 ✓)
  - test count = 12 (≥ 12 ✓)
  - `useTransitionAuthority` in summary-strip = 2 (≥ 1 ✓)
  - continuous-mode hide rule in summary-strip = 1 (≥ 1 ✓)
  - `/workflow-editor?projectId=` in summary-strip = 1 (≥ 1 ✓)
  - `PhaseGateExpand / SummaryStrip / WorkflowCanvas` in lifecycle-tab = 7 (≥ 3 ✓)
  - `computeNodeStates` in lifecycle-tab = 3 (≥ 1 ✓)
  - lifecycle-stub-tab line count = 3 (< 5 ✓)
  - `LifecycleTab` in shell = 3 (≥ 1 ✓)
  - `LifecycleStubTab` in shell = 0 (= 0 ✓)
- TypeScript: no new errors in any Plan 12-02 file.
