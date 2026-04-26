---
phase: 13-reporting-activity-user-profile
plan: 06
subsystem: web
tags: [react, profile, prof-02, projects-tab, activity-tab, project-card, datastate]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: useUserSummary hook (queryKey ['user-summary',id], staleTime 30s) — projects[] field is the data source for the new ProjectsTab grid; useUserActivity hook + privacy-filtered /users/{id}/activity backend endpoint that the ActivityTab userId variant routes through
  - phase: 13-reporting-activity-user-profile
    plan: 04
    provides: canonical ActivityTab component with discriminated-union (projectId XOR userId variant) — REUSED via <ActivityTab userId={id} variant="full"/> on the profile Activity branch
  - phase: 13-reporting-activity-user-profile
    plan: 05
    provides: /users/[id] route shell + ProfileProjectsTab stub + Activity branch placeholder (// Plan 13-06 will replace this with...) — both REPLACED in this plan
  - phase: 10-shell-pages-project-features
    provides: ProjectCard component (interactive Card + status strip + AvatarStack + 3-dot menu) — REUSED unchanged per CONTEXT D-C5 reuse contract

provides:
  - ProfileProjectsTab full impl — DataState-wrapped 3-col grid of <ProjectCard/> sourced from useUserSummary().data.projects (no second network call)
  - in-file adaptSummaryProject helper — adapts the lean UserSummaryProject shape ({id,key,name,status} from /summary endpoint) to the full Phase 10 Project interface that ProjectCard expects (description/dates/methodology/manager/progress/columns default to safe empty values; v2.1 candidate to enrich via per-id /projects/{id} fetch)
  - .profile-projects-grid className container — Plan 13-09 will attach @media (max-width: 1024px) → 2-col + @media (max-width: 640px) → 1-col bodies in globals.css without a JSX change here
  - "Henüz proje yok." empty fallback (D-F2) — matches /projects list page empty copy
  - Activity tab branch on /users/[id]/page.tsx mounts <ActivityTab userId={userId} variant="full"/> from Plan 13-04 — viewer-privacy filter applied server-side via /users/{id}/activity per Plan 13-01 D-X4

affects: [13-09]
  # Plan 13-09 (mobile + a11y) attaches @media (max-width: 1024px / 640px) bodies
  #   to the .profile-projects-grid selector in globals.css — selector hook is
  #   already in place from this plan; 13-09 only needs the CSS body addition.

tech-stack:
  added: []
  patterns:
    - "Reuse-without-rewrite via in-file shape adapter — when a downstream component (Phase 10 ProjectCard) expects a richer interface than what the available data source (Phase 9 D-48 /users/{id}/summary) returns, the consumer adapts at the boundary with safe defaults rather than forking the downstream component or expanding the backend DTO. Single-consumer adapter stays in-file (matches the SummaryStrip mode-chip + lifecycle formatDateShort co-located strategy) — lift to lib/ only when a second consumer needs the same adaptation"
    - "Discriminated-union prop reuse proven in production — Plan 13-04 ActivityTab's `{projectId} XOR {userId}` signature carries a different prop shape on the profile Activity tab than on the project Activity tab; the same component, the same UI, the same DataState slot — the only difference is which hook fires (useUserActivity vs useProjectActivity, decided inside the component via the enabled flag). Zero new component, zero design work — pure prop swap"
    - "Stub-marker pattern lifecycle complete — Plan 13-05 left `// STUB` in profile-projects-tab.tsx + `// Plan 13-06 will replace this with...` in page.tsx as substitution markers; this plan's executor found both markers via grep and replaced the bodies. Pattern proven end-to-end across two plans"

key-files:
  created:
    - Frontend2/components/profile/profile-projects-tab.test.tsx
  modified:
    - Frontend2/components/profile/profile-projects-tab.tsx (Plan 13-05 stub body REPLACED with full 3-col ProjectCard grid + adapter)
    - Frontend2/app/(shell)/users/[id]/page.tsx (Activity tab branch placeholder REPLACED with <ActivityTab userId={userId} variant="full"/>; ProfileProjectsTab import unchanged; header docstring refreshed for Plan 13-06)

key-decisions:
  - "[13-06] In-file adaptSummaryProject helper bridges the schema gap between UserSummaryProject ({id,key,name,status}) and the full Phase 10 Project ({...} description/dates/methodology/manager/progress/columns). Defaults to safe empty values: description=null, progress=0, methodology='', manager fields=null, columns=[]. The adapter is intentional — D-C5 mandates ProjectCard reuse without modification, and the v2.0 backend doesn't carry full project metadata in the user summary payload. v2.1 candidate: extend /users/{id}/summary to include full Project DTOs (or add a new /users/{id}/projects endpoint) so the adapter can be removed and the cards render with real progress + manager + dates. Documented inline."
  - "[13-06] Inline grid + .profile-projects-grid className together — the className enables Plan 13-09 mobile responsive @media bodies, the inline `gridTemplateColumns: repeat(3, 1fr)` is the v2.0 baseline so the layout works TODAY without waiting on globals.css. Once 13-09 lands the @media bodies, the inline style still works as a graceful fallback (CSS specificity: inline beats class, so the responsive rule needs `!important` or higher specificity at 13-09 time — flagged for the 13-09 executor). Pattern matches /projects list page's .projects-grid in globals.css"
  - "[13-06] Test 3 (DataState loading) was the ONLY one that passed against the Plan 13-05 stub — the stub already returns DataState empty=true with the 'Yükleniyor…' fallback inside, so the loading-test substring assertion 'Yükleniyor…' was satisfied by the stub even before GREEN. Tests 1 and 2 (3-card render + empty copy) failed correctly during RED. The asymmetric RED reflects the stub's deliberate choice to render a benign placeholder rather than a bare null"
  - "[13-06] Stale page.tsx header comment (Plan 13-05 listed Plan 13-06 work as still-pending) refreshed in a separate docs() commit AFTER the GREEN feat() commit — keeps the test/feat/docs gate sequence visible in git log without folding two intents into one commit. Pattern: the substantive commit lands first, the doc-housekeeping follows"

requirements-completed: [PROF-02]

duration: ~4min
completed: 2026-04-26
---

# Phase 13 Plan 13-06: Profile Projects Tab Full Impl + Activity Tab Wire-Up Summary

**Closes the PROF-02 contract by replacing Plan 13-05's two profile-tab placeholders with their final implementations: ProfileProjectsTab now renders a 3-column grid of Phase 10 ProjectCard components sourced from the existing useUserSummary().data.projects field (no extra fetch), and the /users/[id] route Activity tab branch now mounts <ActivityTab userId={userId} variant="full"/> from Plan 13-04 — viewer-privacy filter applied server-side via /users/{id}/activity per Plan 13-01 D-X4. Zero new components, zero new endpoints, zero rewrites of Phase 10 ProjectCard — D-C5 reuse contract honored exactly.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-26T02:07:53Z
- **Completed:** 2026-04-26T02:11:25Z
- **Tasks:** 1 (type=auto with tdd="true" — strict RED → GREEN gate sequence)
- **Files created:** 1 (RTL test file)
- **Files modified:** 2 (profile-projects-tab.tsx body REPLACE + page.tsx Activity branch wire-up + header docstring refresh)
- **Tests added:** 3 NEW frontend tests, all green; vitest baseline 19 fail / 513 pass (was 19/510), zero regressions

## Accomplishments

- **ProfileProjectsTab ships the full 3-col ProjectCard grid (D-C5)** — `useUserSummary(userId)` is the single data source (already called by the route — no second network call); `summary?.projects ?? []` flows through the in-file `adaptSummaryProject` helper (fills the Phase 10 `Project` interface gap with safe defaults) and into `<ProjectCard project={...}/>` for each entry. The grid uses `display: grid; gridTemplateColumns: repeat(3, 1fr); gap: 14` inline (works v2.0 baseline) plus `className="profile-projects-grid"` (Plan 13-09 hook for the mobile responsive @media bodies).
- **DataState integration** — handles loading (DataState's default "Yükleniyor…" copy), error (DataState's default AlertBanner), and empty (the new prototype-faithful `Henüz proje yok.` literal per D-F2). Empty state matches the /projects list page copy verbatim — same pattern, same string, single source of truth.
- **Activity tab branch wired (D-C7)** — the route's `{activeTab === "activity" && (...)}` placeholder block is replaced with `<ActivityTab userId={userId} variant="full"/>`. This is the FIRST production consumer of Plan 13-04's `userId` variant; Test 2 in Plan 13-04's suite already proved the routing (`useUserActivity` fires when `userId` is supplied), so the wire-up here adds zero new logic — it just imports the component and passes the prop. Privacy filter is enforced server-side (Plan 13-01's `/users/{id}/activity` endpoint joins audit_log → projects user has membership in → returns only events the viewer is allowed to see; admin viewers bypass).
- **Plan 13-05 stub markers retired** — the literal `// STUB` token in profile-projects-tab.tsx and the `// Plan 13-06 will replace this with <ActivityTab userId={userId} variant="full"/>` comment in page.tsx are both gone. The grep-driven substitution markers worked end-to-end; pattern proven across two plans.
- **Zero regressions** — vitest baseline went from 19 fail / 510 pass → 19 fail / 513 pass (+3 new from this plan, same pre-existing 19 workflow-editor failures). The 7 page.test.tsx tests from Plan 13-05 still pass without modification (none of the 7 navigates to the activity tab, so the new ActivityTab import is silent in the test environment).

## Task Commits

Each task ran with strict TDD gate sequence:

1. **Task 1 RED: failing tests for ProfileProjectsTab full impl** — `95c32dd` (test)
2. **Task 1 GREEN: ProfileProjectsTab full impl + Activity tab wire-up** — `32076e5` (feat)
3. **Doc refresh: page.tsx header comment** — `cb5e35b` (docs)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (1)

- `Frontend2/components/profile/profile-projects-tab.test.tsx` — 78 lines. 3 RTL tests: 3-card render assertion (mocks useUserSummary with 3 projects, ProjectCard data-testid stub), empty state copy "Henüz proje yok." assertion, DataState loading branch assertion (isLoading=true). Mocks: useApp (TR locale), ProjectCard (data-testid stub so we don't boot Phase 10 interactive Card chrome — keeps tests scoped to THIS component's contract), useUserSummary (controlled per-test).

### Modified (2)

- `Frontend2/components/profile/profile-projects-tab.tsx` — 105 lines (was 49). Body fully REPLACED. Imports `ProjectCard` from `@/components/projects/project-card` + `useUserSummary` from `@/hooks/use-user-summary` + `Project` type from `@/services/project-service` + `UserSummaryProject` type from `@/services/profile-service`. In-file `adaptSummaryProject` helper bridges the shape gap. Renders `DataState` with loading/error/empty branches; the happy path is a `.profile-projects-grid` className `<div>` with inline 3-col grid + 14px gap, mapping each `summary.projects` entry to a `<ProjectCard project={adapted}/>`. The Plan 13-05 `// STUB` marker is gone; the docstring at the top documents the adapter trade-off + the Plan 13-09 responsive @media hook.
- `Frontend2/app/(shell)/users/[id]/page.tsx` — added `import { ActivityTab } from "@/components/activity/activity-tab"`; replaced the `{activeTab === "activity" && (<div ... Yükleniyor… ...)}` block with `{activeTab === "activity" && <ActivityTab userId={userId} variant="full" />}`; the `// Plan 13-06 will replace this with...` comment is gone; the page-level header docstring updated in a separate commit to reflect the new state.

## Decisions Made

See `key-decisions:` block in frontmatter — 4 decisions captured. Highlights:

- **In-file adaptSummaryProject helper** — D-C5 mandates ProjectCard reuse without modification, but `/users/{id}/summary` (Phase 9 D-48) only carries `{id,key,name,status}` per project. The full Phase 10 `Project` interface needs description/dates/methodology/manager/progress/columns. The adapter at the consumer boundary fills with safe defaults (description=null, progress=0, etc.) so ProjectCard renders gracefully — cards on the profile look slightly less rich than cards on /projects (no progress bar value, no manager avatar, no end date), but they ARE clickable and navigate to /projects/[id] which has the full data. Documented as a v2.1 candidate to enrich the summary endpoint or add a dedicated `/users/{id}/projects` endpoint that returns full Project DTOs.
- **Inline grid + .profile-projects-grid className** — the inline `gridTemplateColumns: repeat(3, 1fr)` is the v2.0 baseline so the layout works TODAY; the className is the Plan 13-09 responsive hook. CSS specificity caveat: inline styles beat classes, so when 13-09 attaches @media bodies they need `!important` or higher specificity. Flagged for the 13-09 executor.
- **Test 3 asymmetric RED** — the loading-test passed even against the Plan 13-05 stub because the stub already used DataState empty=true with the "Yükleniyor…" fallback. Tests 1 and 2 (3-card + empty copy) failed correctly. The asymmetric RED is intentional, not a test design flaw — it documents that the stub deliberately rendered a benign placeholder rather than a bare null.
- **Stale doc comment refreshed in a separate docs() commit** — keeps the test → feat → docs gate sequence visible in git log; the substantive feat() commit lands first, the housekeeping follows. Pattern reusable for future refactor passes that touch comments alongside code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale Plan 13-05 docstring referenced Plan 13-06 work as still-pending**

- **Found during:** Post-GREEN stub-pattern scan (executor's pre-summary stub check)
- **Issue:** The page.tsx file-level docstring (lines 9-10) listed `(Plan 13-06 fills)` and `Activity placeholder (Plan 13-06 mounts ActivityTab)` as future work. Plan 13-06 has now landed both, so the comment was misleading — readers seeing the file fresh would think the wire-up was still pending.
- **Fix:** Updated the docstring to acknowledge Plan 13-06's contribution alongside Plan 13-05's, with a 1-line summary: "ProfileProjectsTab + ActivityTab (userId variant; Plan 13-04 component with viewer-privacy filter applied server-side per Plan 13-01 D-X4)".
- **Files modified:** `Frontend2/app/(shell)/users/[id]/page.tsx`
- **Verification:** Grep confirms no remaining "Plan 13-06 will replace" or "Plan 13-06 fills" markers; no behavior change, pure documentation refresh.
- **Committed in:** `cb5e35b` (separate docs() commit after the GREEN feat() commit, to keep the gate sequence visible).

---

**Total deviations:** 1 auto-fixed (stale doc refresh). No scope expansion; no architectural decisions; no checkpoint required.

**Impact on plan:** Plan executed essentially as written. The single deviation is a 6-line comment refresh — pure documentation, zero behavior change. The plan's `<action>` block + `<acceptance_criteria>` were honored verbatim.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-05 / 13-07. Verified pre-existing by re-running pre- and post-Plan-13-06 vitest: both runs show 19 failures in identical files (510 → 513 passes, +3 net new from this plan). Out of scope per executor scope-boundary rule. Already documented in 13-01..13-05 / 13-07 SUMMARYs; no need to re-add to deferred-items.md.

## Threat Flags

None — Plan 13-06 introduces no new trust boundary surface. The three threats from the plan's `<threat_model>` are all handled per their disposition:

- **T-13-06-01 (Information Disclosure: Projects tab leaks projects the viewer is not a member of)** — `accept` per CONTEXT D-C2 (any auth user sees any profile, full payload includes projects); Phase 9 D-48 already returns the full project list per user. The route is auth-gated by Phase 10 middleware. Future hardening (pivot summary endpoint to viewer-filter) is a v2.1 candidate.
- **T-13-06-02 (Information Disclosure: Activity tab leaks events from projects the viewer cannot access)** — `mitigate` via Plan 13-01 D-X4: backend `/users/{id}/activity` joins audit_log → projects the viewer has membership in → returns only events the viewer is allowed to see; admin viewers bypass. The frontend simply mounts `<ActivityTab userId={userId} variant="full"/>` — no client-side filter needed because the server already enforces.
- **T-13-06-03 (Tampering: XSS via project.name in ProjectCard render)** — `mitigate` via React's default escaping; ProjectCard is a Phase 10 component already in production with this hardening (no `dangerouslySetInnerHTML`).

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. The useUserSummary + DataState + ProjectCard + ActivityTab infrastructure all landed in earlier plans; Plan 13-06 composes them.

## Next Phase Readiness

**Ready for Wave 4 plans:**

- **Plan 13-08 (Faz Raporları on /reports)** — independent of Plan 13-06 (different file set). Can proceed in parallel.
- **Plan 13-09 (Mobile + a11y)** — direct consumer. Will:
  - Attach `.profile-projects-grid` @media bodies in `Frontend2/app/globals.css`: `@media (max-width: 1024px) { .profile-projects-grid { grid-template-columns: repeat(2, 1fr) !important; } }` and `@media (max-width: 640px) { .profile-projects-grid { grid-template-columns: 1fr !important; } }`. The `!important` is needed because the v2.0 baseline uses inline `gridTemplateColumns` (CSS specificity rule: inline beats class). Alternatively 13-09 can remove the inline style here and rely on the class — also fine.
  - Apply mobile compression to the `.activity-*` selector hooks already declared by Plan 13-04 (avatar 28→22, paddingLeft 32→16, vertical line `left:11`, gap 12→8).
- **Plan 13-10 (E2E + final QA)** — direct consumer. Profile route now serves all 3 tabs end-to-end; E2E specs can navigate `/users/7?tab=projects` and assert the 3-col grid renders, then `/users/7?tab=activity` and assert the activity timeline renders with privacy-filtered events.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on its single task. Strict RED → GREEN gate sequence in git log:

- **Task 1 RED:** `95c32dd` (test) — adds 3 RTL tests for ProfileProjectsTab. Tests 1 (3-card render) and 2 (empty copy) fail correctly against the Plan 13-05 stub; Test 3 (DataState loading) passes asymmetrically because the stub already uses DataState empty=true with the "Yükleniyor…" fallback (intentional documented in key-decisions [13-06]).
- **Task 1 GREEN:** `32076e5` (feat) — ProfileProjectsTab full impl + Activity tab wire-up + adaptSummaryProject helper. After implementation lands, all 3 tests pass; full vitest baseline shifts from 19/510 to 19/513 (zero regressions).
- **Doc refresh:** `cb5e35b` (docs) — page.tsx header comment refresh; no test impact.

Both gate commits honor the test → feat sequence. No REFACTOR commit needed (impl landed clean on first GREEN attempt). No fix attempts needed (zero auto-fix retry budget consumed).

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/profile/profile-projects-tab.tsx` exists; first non-comment line is `"use client"`; exports `function ProfileProjectsTab`; imports `ProjectCard` from `@/components/projects/project-card` (1 import); imports `useUserSummary` from `@/hooks/use-user-summary` (1 import); calls `useUserSummary(userId)`; renders `<ProjectCard project={...}/>` inside a `.profile-projects-grid` className container (grep returns 2 occurrences: className declaration + closing braces context); empty fallback contains the literal `Henüz proje yok.` (grep returns 2 — TR + EN T() pair); does NOT contain `// STUB` (grep returns 0).
- `Frontend2/components/profile/profile-projects-tab.test.tsx` exists; first import is `* as React from "react"`; describes `ProfileProjectsTab` block with 3 `it(...)` cases; mocks `@/components/projects/project-card` to return a data-testid stub; vitest run on the file exits 0 with 3 passed.
- `Frontend2/app/(shell)/users/[id]/page.tsx` contains the literal `<ActivityTab userId={userId} variant="full"` (grep returns 1); does NOT contain the comment `Plan 13-06 will replace` (grep returns 0); imports `ActivityTab` from `@/components/activity/activity-tab` (1 import); the `Yükleniyor…` literal appears EXACTLY 1 time (the page-level loading state, NOT the activity-branch placeholder — verified by grep returning 1, was 2 before this plan).
- `cd Frontend2 && npx vitest run components/profile/profile-projects-tab.test.tsx --reporter=basic` exits 0 with 3 tests passing.
- `cd Frontend2 && npx vitest run "app/(shell)/users/[id]/page.test.tsx" --reporter=basic` exits 0 with 7 tests passing — no Plan 13-05 page test regression (no activity-tab vi.mock needed because none of the 7 tests navigates to the activity tab).
- Full vitest baseline: 19 failed / 513 passed (532 total). Same 19 pre-existing workflow-editor failures; +3 NEW passing tests vs the 19/510 pre-Plan-13-06 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(profile-projects-tab|users/\[id\]/page)\.(tsx?|test\.tsx?):'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `95c32dd` (Task 1 RED), `32076e5` (Task 1 GREEN), `cb5e35b` (docs refresh) all found in `git log --oneline`.
- 13-06 substitution markers removed: `// STUB` count in profile-projects-tab.tsx = 0 (was 1); `Plan 13-06 will replace` count in page.tsx = 0 (was 1).

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
