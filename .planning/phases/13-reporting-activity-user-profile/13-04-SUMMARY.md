---
phase: 13-reporting-activity-user-profile
plan: 04
subsystem: web
tags: [react, activity-timeline, audit-log, datastate, localstorage, prof-01, click-to-profile]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: useProjectActivity / useUserActivity hooks (200-cap server fetch + refetchOnWindowFocus); audit-event-mapper (10 SemanticEventType + semanticToFilterChip); DataState 3-state primitive; activity-date-format helpers; broadened /projects/{id}/activity SQL UNION
  - phase: 13-reporting-activity-user-profile
    plan: 02
    provides: lib/initials.ts (third consumer trigger) — used by ActivityFilter actor row + ActivityRow initials fallback
  - phase: 13-reporting-activity-user-profile
    plan: 03
    provides: Avatar primitive optional href + e.stopPropagation() (D-D4 backwards-compat guarantee); existing 19 Avatar consumers verified clean
  - phase: 11-task-features-board-enhancements
    provides: useLocalStoragePref / TaskModalProvider / useTaskModal().openTaskModal — D-B7 persistence + D-F4 empty-state CTA
  - phase: 11-task-features-board-enhancements
    provides: ActivityStubTab placeholder (Phase 11 D-10) — REPLACED by this plan

provides:
  - Canonical ActivityTab component with discriminated-union projectId XOR userId routing — REUSABLE on Plan 13-06 user-profile Activity tab without rewrites
  - ActivityRow per-event renderer that derives icon/color/verb via mapAuditToSemantic + eventMeta — single source of truth for the 10 event types (no second hardcoded switch)
  - ActivityFilter SegmentedControl 6 chips (Tümü / Oluşturma / Durum / Atama / Yorum / Yaşam Döngüsü) + actor-avatar filter row + count caption per UI-SPEC §C.1
  - ActivityEmpty distinguishing filter-empty vs zero-total empty states — CTA opens TaskCreateModal via useTaskModal().openTaskModal()
  - ActivityTimelineSkeleton (10 placeholder rows + shimmer) for DataState loading slot
  - lib/activity/event-meta.ts — 10-type icon/color/verb table; locale-aware verb function
  - lib/activity/group-by-date.ts — pure function ActivityItem[] → DateGroup[] using formatActivityDate (Today / Yesterday / This Week / exact date for >7 days)
  - globals.css gains @keyframes shimmer + .skeleton class + prefers-reduced-motion guard (REUSED by Plans 13-07/08 chart skeletons)
  - globals.css gains 4 bare .activity-* selector hooks for Plan 13-09 mobile @media body
  - ActivityStubTab REPLACED — re-exports the canonical ActivityTab with projectId scoping; ProjectDetailShell now passes project.id to it

affects: [13-06, 13-09]
  # 13-06 user-profile Activity tab — mounts <ActivityTab userId={id} variant="full"/> using the SAME component (D-B4 reuse contract proven by Test 2)
  # 13-09 mobile + a11y — attaches @media body to the .activity-* selector hooks declared here

tech-stack:
  added: []
  patterns:
    - "Discriminated-union prop routing — `{projectId} | {userId}` mutually exclusive; both hooks called every render (Rules of Hooks), enabled flag inside each hook decides actual fetch (RESEARCH §Pattern 4 verbatim)"
    - "Single semantic-event lookup table — eventMeta keyed by SemanticEventType so adding a new event type = one row in event-meta.ts + one branch in audit-event-mapper.ts (CLAUDE.md §4.1 OCP)"
    - "Comment XSS defense — strip(/<[^>]*>/g) BEFORE clamp(160) — matches Phase 11 D-09 / T-11-09-01 pattern (T-13-04-01 mitigation)"
    - "useLocalStoragePref + Map insertion-order grouping — filter persistence per-(project|user) without a separate normalizer (D-B7)"
    - "Single 200-cap server fetch + client-side slice — satisfies prototype Daha-fazla-yükle UX (D-B2) without per-click network calls (v2.1 candidate to rewire as offset-paginated)"
    - "Defensive useTaskModal try/catch — ActivityEmpty stays renderable when mounted outside the TaskModalProvider (forward-compat for stand-alone harnesses + future placements)"

key-files:
  created:
    - Frontend2/lib/activity/event-meta.ts
    - Frontend2/lib/activity/group-by-date.ts
    - Frontend2/components/activity/activity-tab.tsx
    - Frontend2/components/activity/activity-tab.test.tsx
    - Frontend2/components/activity/activity-row.tsx
    - Frontend2/components/activity/activity-row.test.tsx
    - Frontend2/components/activity/activity-filter.tsx
    - Frontend2/components/activity/activity-empty.tsx
    - Frontend2/components/activity/activity-skeleton.tsx
  modified:
    - Frontend2/app/globals.css (appended @keyframes shimmer + .skeleton class + 4 .activity-* hooks)
    - Frontend2/components/project-detail/activity-stub-tab.tsx (BODY REPLACED — now re-exports canonical ActivityTab with projectId prop)
    - Frontend2/components/project-detail/project-detail-shell.tsx (passes projectId={project.id} to ActivityStubTab; updated activity tab comment)
    - Frontend2/components/project-detail/project-detail-shell.test.tsx (Aktivite tab assertion updated — old stub copy gone, new check on ActivityTimelineSkeleton aria-busy + Tümü chip presence)

key-decisions:
  - "[13-04] useTaskModal API = openTaskModal (NOT openCreate as the plan snippet suggested) — verified at Frontend2/context/task-modal-context.tsx; 6 existing call sites use openTaskModal({...}) with optional defaults including defaultProjectId"
  - "[13-04] Defensive try/catch around useTaskModal() in ActivityEmpty — the hook throws when called outside TaskModalProvider; the catch returns undefined and the CTA branch renders only when openTaskModal is available. Stand-alone test harnesses + future profile-page mounts (which are inside the shell tree) all stay safe"
  - "[13-04] ActivityRow entity_label fallback to metadata.task_key — backend audit_log writes entity_label as the task key today (e.g. 'MOBIL-12'), but the metadata JSONB column carries task_key + task_title + phase_id explicitly. Defensive read covers both shapes; ref click uses task_key for /tasks/[key] routing OR phase_id for ?tab=lifecycle&sub=history"
  - "[13-04] Status badge tone mapping is best-effort — backend writes column_id (integer) in old_value/new_value, NOT status names. The toLowerCase + includes('done|progress|review') heuristic catches future name-based payloads while integer ids fall through to neutral. Real status-name lookup would require a column-meta cache (out of scope; tracked as future polish)"
  - "[13-04] Single 200-cap server fetch + client-side slice — accepts the v2.0 D-B2 deviation explicitly logged by 13-CONTEXT deferred section. Tests 5 verifies slice growth in 30-event chunks against a 60-event mock. v2.1 candidate: rewire as offset-paginated calls"
  - "[13-04] localStorage key passed to useLocalStoragePref WITHOUT spms. prefix — the hook auto-prepends; on-disk key becomes spms.activity.filter.{id} matching D-B7. Verified by Test 4 reading the on-disk JSON shape directly"
  - "[13-04] Project-detail shell test updated to use ActivityTimelineSkeleton aria-busy as the synchronous DOM marker — old assertion ('Bu sekme Faz 13'te aktive edilecek') referenced copy that this plan intentionally removed (Rule 3 blocking-issue auto-fix). Skeleton check runs synchronously without racing the async useQuery resolution"
  - "[13-04] Mock api-client at the renderWithProviders helper level returns {data:[]}; the activity service's `data.items ?? [] / data.total ?? 0` fallback then resolves to empty list — no test crash, downstream tests use vi.mock at the hook level for explicit control"
  - "[13-04] ActivityTab exposes `variant` prop in the type signature but the v2.0 implementation only handles 'full'. Compact variant is reserved for D-B8 future placement; the void-cast keeps the prop forward-compat without an unused-var lint failure"
  - "[13-04] Reverse-chronological sort happens BEFORE Map-based grouping in groupByDate — Map insertion order is the contract that gives groups[] reverse-chronological order (most recent group first); within each group events keep the same order from the same sort"

patterns-established:
  - "Activity surface composition: ActivityTab (composer) → ActivityFilter (chips + actor row) → DataState (loading/error/empty switch) → groupByDate (date buckets) → ActivityRow (per-event) — same shape will work for Plan 13-06 user-profile Activity tab (proven by Test 2 mounting userId={7} and verifying useUserActivity routing)"
  - "Comment XSS hardening pattern reused: regex strip + clamp + whiteSpace pre-wrap is now the canonical comment-render path (Phase 11 D-09 → Phase 13 Plan 13-04). Future plans showing user-supplied text in non-DOMPurify contexts adopt the same trio"
  - "DataState retro-adoption gradient: Plan 13-01 introduced the primitive, Plan 13-03 retro-adopted dashboard ActivityFeed, Plan 13-04 uses it natively. Pattern: chart cards / activity timelines / profile tabs all wrap their content in DataState — empty/error/loading copy is then a 1-prop change per surface"
  - "Stub-replace pattern: keep the file name + export so consumer imports stay valid; replace body with a re-export to the new canonical implementation. Avoids cross-tree imports drift while landing the real feature"

requirements-completed: [PROF-01]

duration: 9min
completed: 2026-04-26
---

# Phase 13 Plan 13-04: ProjectDetail Activity Tab (Full) Summary

**Replaces Phase 11 `activity-stub-tab.tsx` with the canonical vertical-timeline ActivityTab — 10 audit event types render through the audit-event-mapper hidden contract, 6-chip SegmentedControl filter (incl. Yaşam Döngüsü aggregating 5 lifecycle types per D-B1), date-aware grouping (Bugün / Dün / Bu Hafta / exact date), 30-step "Daha fazla yükle" against the 200-cap server fetch (D-B2), per-(project|user) localStorage persistence, comment 160-char clamp with HTML strip (T-13-04-01), and full DataState integration. Discriminated-union prop signature ready for Plan 13-06 user-profile Activity tab to consume the SAME component without rewrites.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-26T01:20:22Z
- **Completed:** 2026-04-26T01:29:24Z
- **Tasks:** 2 (both type=auto with TDD verify)
- **Files created:** 9 (5 components + 2 pure libs + 2 RTL test files)
- **Files modified:** 4 (globals.css + activity-stub-tab + project-detail-shell + project-detail-shell.test)
- **Tests added:** 16 NEW frontend tests + 1 updated test = 17 total touched, all green

## Accomplishments

- **Canonical ActivityTab shipped with discriminated-union prop signature** — `<ActivityTab projectId={n} variant="full"/>` for project tabs, `<ActivityTab userId={n} variant="full"/>` for the upcoming user-profile activity surface. TypeScript enforces mutual exclusion. Both hooks (`useProjectActivity`, `useUserActivity`) are called every render to satisfy Rules of Hooks; the `enabled: !!id` flag inside each hook decides actual fetch. Test 2 verifies the userId path doesn't fire the project hook with a real id.
- **10 SemanticEventType values render through the audit-event-mapper alone** — no second hardcoded switch in ActivityRow. Adding a new event type is a 2-line edit (one row in `event-meta.ts`, one branch in `audit-event-mapper.ts`). The parametric Test 11 smokes all 10 types in a single loop.
- **D-B6 + T-13-04-01 comment hardening** — comment body is HTML-stripped via `replace(/<[^>]*>/g, "")` BEFORE the 160-char clamp + ellipsis. Test 10b verifies a `<script>alert(1)</script>` payload renders as plain text without the tag. Pattern matches Phase 11 D-09 / `comments-section.tsx`.
- **D-B7 localStorage filter persistence** — key is `spms.activity.filter.{projectId}` (auto-prepended by `useLocalStoragePref`). Tests 3 and 4 verify both directions: seed localStorage → mount → SegmentedControl initial value matches; mount → click chip → on-disk JSON updates.
- **D-B2 "Daha fazla yükle" UX** — server fetch is single-shot at 200-cap (Phase 9 D-46 hard limit); client-side `showCount` slices in 30-event chunks. Test 5 mocks 60 events, asserts 30 visible at first paint, clicks the button, asserts 60 visible after. Documented as v2.1 candidate to rewire as offset-paginated network calls.
- **D-F4 distinguished empty states** — filter-empty renders "Bu filtreyle eşleşen olay yok." (muted text only); zero-total renders "Henüz aktivite yok." + "Bir görev oluştur" ghost Button that opens TaskCreateModal via `useTaskModal().openTaskModal({})`. Tests 6 and 7 cover both branches.
- **D-F3 chart skeleton infrastructure** — `globals.css` gains `@keyframes shimmer` + `.skeleton` class with `prefers-reduced-motion` guard. ActivityTimelineSkeleton (10 placeholder rows) consumes it; Plans 13-07 / 13-08 chart skeletons will reuse the same primitive without a duplicate keyframes block.
- **D-B5 date-aware grouping** — `groupByDate` is a pure function (no React); reverse-chronological sort BEFORE Map insertion gives most-recent group first. `formatActivityDate` (Plan 13-01) drives the labels: Bugün / Dün / Bu Hafta / exact date for >7 days.
- **Stub replaced cleanly** — `activity-stub-tab.tsx` now re-exports `<ActivityTab projectId variant="full"/>`. Existing `project-detail-shell.tsx` import resolves; the shell now passes `project.id` to the prop. The Phase 11 stub copy "Bu sekme Faz 13'te aktive edilecek." is gone from the repo.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure libs (event-meta + group-by-date) + globals.css shimmer + ActivityFilter + ActivityEmpty + ActivitySkeleton** — `28219d3` (feat)
2. **Task 2: ActivityRow + canonical ActivityTab + activity-stub-tab REPLACE + 16 RTL tests + shell test fix** — `bfb565b` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (9)

- `Frontend2/lib/activity/event-meta.ts` — 91 lines. Single export `eventMeta: Record<SemanticEventType, EventMeta>` with all 10 keys; verb is a `(lang) => string` function for i18n.
- `Frontend2/lib/activity/group-by-date.ts` — 49 lines. Single export `groupByDate(events, language) → DateGroup[]`. Pure function (no React), reverse-chronological sort + Map insertion-order preserving grouping; missing-timestamp events bucket under "Bilinmeyen" / "Unknown".
- `Frontend2/components/activity/activity-tab.tsx` — 175 lines. Canonical composer; discriminated union; chip filter; actor filter; date-grouped rendering; load-more; DataState wrap; first non-comment line is `"use client"`.
- `Frontend2/components/activity/activity-tab.test.tsx` — 8 RTL tests covering routing, persistence, load-more, empty states, loading skeleton.
- `Frontend2/components/activity/activity-row.tsx` — 220 lines. Per-event renderer; status pair / assign target / comment block branches per semantic type; HTML strip + 160-char clamp; Avatar href to `/users/${user_id}`; ref click routes to `/projects/${id}/tasks/${key}` or lifecycle history.
- `Frontend2/components/activity/activity-row.test.tsx` — 8 RTL tests (status pair, comment clamp + HTML strip, parametric 10-type smoke, Avatar href, taskKey nav, phase nav, null shape).
- `Frontend2/components/activity/activity-filter.tsx` — 162 lines. SegmentedControl 6 chips + actor-avatar row (button-wrapped Avatars with ring=true on active) + count caption. Unique actors derived from full events list (not filtered).
- `Frontend2/components/activity/activity-empty.tsx` — 75 lines. Two empty branches; defensive `try/catch` around `useTaskModal()` so the component degrades gracefully outside the provider tree.
- `Frontend2/components/activity/activity-skeleton.tsx` — 51 lines. 10 rows × (28px round + 60% line + 40% line); `aria-busy="true"` on wrapper; `.skeleton` class drives the shimmer animation from globals.css.

### Modified (4)

- `Frontend2/app/globals.css` — appended `@keyframes shimmer` + `.skeleton` class with linear-gradient + `prefers-reduced-motion` guard; appended 4 bare `.activity-*` selector hooks (zero-rule placeholders for Plan 13-09 to attach @media bodies).
- `Frontend2/components/project-detail/activity-stub-tab.tsx` — BODY FULLY REPLACED. Now imports `ActivityTab` and re-exports `ActivityStubTab({projectId})` as a thin mount. The Phase 11 AlertBanner placeholder + the "Bu sekme Faz 13'te aktive edilecek" copy are gone.
- `Frontend2/components/project-detail/project-detail-shell.tsx` — passes `projectId={project.id}` to `<ActivityStubTab/>`; updated the docstring entry for the activity tab to point at the new ActivityTab mount.
- `Frontend2/components/project-detail/project-detail-shell.test.tsx` — Aktivite tab assertion updated to check on `[aria-busy="true"]` (ActivityTimelineSkeleton presence) + the "Tümü" SegmentedControl chip; previous assertion checked the now-removed stub copy.

## Decisions Made

See `key-decisions:` block in frontmatter — 10 decisions captured. Highlights:

- **`useTaskModal` API mismatch** — the plan's snippet referenced `useTaskModal().openCreate()` but the canonical context exposes `openTaskModal()`. Verified at `Frontend2/context/task-modal-context.tsx`; 6 existing call sites use `openTaskModal()`. Implementation uses the real API; ActivityEmpty's CTA fires `openTaskModal({})`.
- **Defensive `useTaskModal()` try/catch in ActivityEmpty** — the hook throws when called outside TaskModalProvider. The catch returns `undefined` so the CTA branch renders only when the hook resolves cleanly. Keeps the component safe for stand-alone test harnesses + the upcoming user-profile activity tab (which IS inside the shell tree, but the defense is cheap and forward-compat).
- **Single 200-cap server fetch + client-side slice for D-B2** — explicitly accepts the v2.0 deviation logged in 13-CONTEXT deferred. Test 5 (60-event mock + load-more click → 30→60 visible) proves the slice math. v2.1 candidate is to rewire as offset-paginated network calls.
- **Project-detail-shell test fix is a Rule 3 blocking-issue auto-fix** — the existing test asserted the now-deleted stub copy; updating to check on the ActivityTimelineSkeleton's `aria-busy` attribute keeps the test synchronous (no race against async useQuery) and meaningful (proves the new component took over).
- **Status badge tone mapping is best-effort** — backend writes `column_id` (integer) in `old_value/new_value`. The `toLowerCase + includes('done|progress|review')` heuristic catches future name-based payloads; integer ids fall through to `neutral`. A real status-name lookup would require a column-meta cache (out of scope; tracked as future polish via the `statusLabel`/`statusBadgeTone` helpers' co-located docstrings).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Plan snippet referenced `useTaskModal().openCreate` but the canonical context exposes `openTaskModal`**

- **Found during:** Task 1 Step 4 (ActivityEmpty implementation)
- **Issue:** The plan's `<action>` block for ActivityEmpty wrote `taskModal?.openCreate({})` and the success criterion grep checked for that string. The canonical Frontend2 context at `Frontend2/context/task-modal-context.tsx` exposes `openTaskModal({defaults})` instead, with no `openCreate` symbol anywhere in the file.
- **Fix:** Used the real API name (`openTaskModal({})`) in `ActivityEmpty`. Updated the docstring in the file + this Summary to reflect the actual API. The plan's stricter "contains call to `taskModal?.openCreate`" acceptance grep would fail on the real implementation, but the spirit of the criterion (CTA wires through the TaskModal context) is satisfied — verified by Test 7 which renders the CTA button "Bir görev oluştur" only when `openTaskModal` is provided through the mock.
- **Files modified:** `Frontend2/components/activity/activity-empty.tsx`
- **Verification:** Test 7 passes (`zero-total empty — no events + default filter`); the CTA button is in the DOM and clickable.
- **Committed in:** 28219d3 (Task 1 commit, original implementation).

**2. [Rule 3 — Blocking] project-detail-shell.test.tsx asserted the now-deleted Phase 11 stub copy**

- **Found during:** full-vitest baseline run after Task 2 commit
- **Issue:** `it("shows the Faz 13 stub on the Aktivite tab", ...)` asserted on the literal text `Faz 13'te aktive edilecek`, which Plan 13-04 explicitly REMOVES (it's the Phase 11 placeholder copy that the new ActivityTab replaces). The test would fail forever after this plan landed.
- **Fix:** Updated the assertion to check on (a) presence of the SegmentedControl "Tümü" chip and (b) presence of `[aria-busy="true"]` (the ActivityTimelineSkeleton wrapper). Both are synchronous DOM markers that don't race the async useQuery resolution. Renamed the test to `"mounts the canonical ActivityTab on the Aktivite tab (Plan 13-04)"`.
- **Files modified:** `Frontend2/components/project-detail/project-detail-shell.test.tsx`
- **Verification:** Test now passes; full vitest baseline 19 failed / 480 passed (was 19/464 → +16 new passes from this plan: 8 new ActivityTab tests + 8 new ActivityRow tests; the updated shell test was already counted in the 464 baseline as 1 — so net delta is +16 new passing tests, zero new failures).
- **Committed in:** bfb565b (Task 2 commit, alongside the new components).

---

**Total deviations:** 2 auto-fixed (1 plan-vs-impl API mismatch, 1 stale-test-assertion fix). No scope expansion; no architectural decisions; no checkpoint required.
**Impact on plan:** Plan executed essentially as written. The TaskModal API correction is a single-symbol rename in 1 file; the test update is a 5-line assertion swap. Both shipped in the same commits as the work that triggered them.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-03. Verified pre-existing by re-running pre- and post-Plan-13-04 vitest: both runs show 19 failures in identical files. Out of scope per executor scope-boundary rule. Already documented in 13-01, 13-02, 13-03 SUMMARYs; no need to re-add to deferred-items.md.

## Threat Flags

None — Plan 13-04 introduces no new trust boundary surface. The four threats from the plan's `<threat_model>` are all mitigated:

- **T-13-04-01 (XSS via comment body)** — `event.new_value.replace(/<[^>]*>/g, "")` strips HTML before render; React's auto-escape handles residual special chars. Test 10b locks the regression guard with a `<script>` payload.
- **T-13-04-02 (Reflected XSS via entity_label)** — rendered inside `<span>` text node; React escapes by default.
- **T-13-04-03 (Open-redirect via taskKey)** — hard-coded route templates `/projects/${projectId}/tasks/${taskKey}`; `projectId` is integer prop and `taskKey` flows through `useRouter`. No string interpolation of unknown URLs.
- **T-13-04-04 (Cross-project info disclosure)** — backend `/projects/{id}/activity` is gated by `Depends(get_project_member)` (Plan 13-01 unchanged); frontend never queries cross-project. The userId variant uses `/users/{id}/activity` which has the viewer-privacy filter (Plan 13-01 D-X4).
- **T-13-04-05 (localStorage rehydration crash)** — `useLocalStoragePref` wraps `JSON.parse` in try/catch and falls back to the default value (verified at `Frontend2/hooks/use-local-storage-pref.ts` lines 21-25).

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. The audit-event-mapper + DataState + Avatar href + useLocalStoragePref + useProjectActivity + useUserActivity infrastructure all landed in Plans 13-01..13-03; Plan 13-04 composes them.

## Next Phase Readiness

**Ready for Wave 3 plans:**

- **Plan 13-05 (User profile route)** — independent of Plan 13-04 (different file set). The new `/users/[id]` route can be built in parallel without touching ActivityTab.
- **Plan 13-06 (Profile Activity tab)** — direct consumer. Will mount `<ActivityTab userId={id} variant="full"/>` which routes through `useUserActivity` automatically. Test 2 in this plan's test suite verifies the routing works; Plan 13-06 will add its own test for the user-profile mount context.
- **Plan 13-07 / 13-08 (Reports charts + Faz Raporları)** — chart skeleton consumers will reuse the `@keyframes shimmer` + `.skeleton` class added here without re-adding the keyframes (RESEARCH §pitfall 3 confirmed `globals.css` only had `fadeIn` before this plan).
- **Plan 13-09 (Mobile + a11y)** — the 4 bare `.activity-*` selector hooks added here give Plan 13-09 stable selectors to attach `@media (max-width: 640px)` bodies for the activity row compression (avatar 28→22, paddingLeft 32→16, vertical line `left:11`, gap 12→8).
- **No backend dependency** — Plan 13-04 consumes the broadened `/projects/{id}/activity` from Plan 13-01 via the existing `useProjectActivity` hook. Backend remained unchanged.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Gate sequence in git log:

- **Task 1 commit (`28219d3` feat):** Implementation + supporting libs + CSS keyframes. No test file landed in Task 1 because the tests for event-meta + group-by-date were folded into Task 2's RTL coverage (the plan's `<behavior>` block lists these as Test 11 parametric / inferred via ActivityRow). Strict RED→GREEN split was not produced because the deliverables in Task 1 are pure libs + sub-components consumed only by Task 2's ActivityTab/ActivityRow.
- **Task 2 commit (`bfb565b` feat):** ActivityRow + ActivityTab + 16 RTL tests + activity-stub replace + project-detail-shell test fix. The test file lands in the SAME commit as the implementation it covers (matches Plan 13-02 / 13-03 precedent — single `feat(...)` commit per task). All 16 new tests pass on first execution + the updated shell test passes.

Strict gate-sequence (separate `test(` then `feat(` then `refactor(` commits) was not produced because the plan's `<action>` block embeds the exact final implementation alongside the test contracts. Splitting would require reverting impl mid-task. This is the intended execution shape per Plan 13-02 / 13-03 precedent in this phase.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/lib/activity/event-meta.ts` exists; exports `eventMeta`; contains EXACTLY 10 keyed entries matching SemanticEventType (verified by `grep -c "^  [a-z_]*: {$"` returning 10).
- `Frontend2/lib/activity/group-by-date.ts` exists; exports `groupByDate(events, language) → DateGroup[]`; DateGroup interface has `label` + `events`.
- `Frontend2/app/globals.css` contains the literal `@keyframes shimmer` AND `.skeleton {` AND `@media (prefers-reduced-motion: reduce)` blocks (4 grep hits as expected).
- `Frontend2/components/activity/activity-tab.tsx` first non-comment line is `"use client"`; exports `ActivityTab` function; discriminated-union type defined; calls BOTH `useProjectActivity` AND `useUserActivity`; calls `useLocalStoragePref` with prefix `activity.filter.`.
- `Frontend2/components/activity/activity-row.tsx` calls `mapAuditToSemantic`; strips HTML via `replace(/<[^>]*>/g, "")`; clamps comment preview at 160 chars + ellipsis; Avatar receives `href={event.user_id ? `/users/${event.user_id}` : undefined}`.
- `Frontend2/components/activity/activity-filter.tsx` SegmentedControl options array has exactly 6 entries (grep `{ id: "` count = 6).
- `Frontend2/components/activity/activity-empty.tsx` distinguishes the two empty states; CTA wires through `useTaskModal().openTaskModal({})` (the real API; the plan's `openCreate` was a typo per Deviation 1).
- `Frontend2/components/activity/activity-skeleton.tsx` renders 10 rows; each row has 3 `.skeleton` elements (verified by grep returning 3 per render — 30 total / 10 rows = 3 each: avatar circle + 2 text bars).
- `Frontend2/components/project-detail/activity-stub-tab.tsx` body REPLACED — does NOT contain "Bu sekme Faz 13'te aktive edilecek" (count = 0); contains `<ActivityTab` and accepts `projectId` prop.
- `Frontend2/components/project-detail/project-detail-shell.tsx` passes `projectId={project.id}` to `<ActivityStubTab/>`.
- `cd Frontend2 && npx vitest run components/activity/ --reporter=basic` exits 0 — 16 tests pass (8 ActivityTab + 8 ActivityRow).
- `cd Frontend2 && npx vitest run components/project-detail/project-detail-shell.test.tsx` exits 0 — 8 tests pass (the updated activity tab assertion among them).
- Full vitest baseline: 19 failed / 480 passed (499 total). Same 19 pre-existing workflow-editor failures; +16 NEW passing tests vs the 19/464 pre-Plan-13-04 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(activity-tab|activity-row|activity-stub-tab|activity-filter|activity-empty|activity-skeleton|event-meta|group-by-date|project-detail-shell)\.tsx?:'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `28219d3` (Task 1) + `bfb565b` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
