---
phase: 13-reporting-activity-user-profile
plan: 03
subsystem: web
tags: [react, next-link, avatar, cross-cutting, click-to-profile, prof-03, datastate-retro]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: Avatar primitive extended with optional href + onClick (Link wrapper + e.stopPropagation); DataState 3-state primitive
  - phase: 13-reporting-activity-user-profile
    plan: 02
    provides: dashboard/activity-feed.tsx already touched for getInitials import (Plan 13-03 layers Avatar href + DataState retro on top of that file)
  - phase: 11-task-features-board-enhancements
    provides: 14 Avatar consumer files (MTTaskRow, board-card, list-tab, backlog-task-row, members-tab, comments-section, properties-sidebar, sub-tasks-list, history-section, attachments-section)
  - phase: 12-lifecycle-phase-gate-workflow-editor
    provides: lifecycle Avatar consumers (artifact-inline-expand, artifacts-subtab, overview-subtab); EvaluationReportCard pattern reused
  - phase: 10-shell-pages-project-features
    provides: Project / projectService.managerId field flow; ActivityItem dashboard normalizer

provides:
  - 5 RTL tests for Avatar primitive locking the href + stopPropagation contract (regression guard for Plan 13-01's optional href landing)
  - AvatarStackUser interface extended with optional href; AvatarStack forwards href per inner Avatar; +N overflow chip stays a non-Link styled <div>
  - Site-wide click-to-profile: 16 Avatar consumer call sites across dashboard / my-tasks / project-detail / projects / lifecycle / task-detail forward href={`/users/${id}`} when a user id is in scope
  - Dashboard ActivityFeed empty branch retro-adopts <DataState/> primitive (D-F2)
  - Dashboard normalizer surfaces user_id (passes through item.user_id ?? item.actor_id) so the ActivityFeed Avatar can resolve href
  - ActivityItem interface gains optional user_id field

affects: [13-04, 13-05, 13-06, 13-07, 13-08, 13-09, 13-10]

tech-stack:
  added: []
  patterns:
    - "Cross-cutting Avatar href patch — every consumer Avatar with a known user.id forwards href={`/users/${id}`} (D-D4 site-wide click-to-profile)"
    - "AvatarStackUser carries href per-user; AvatarStack forwards it to each inner Avatar; overflow chip stays a non-clickable styled <div> (RESEARCH §Pattern 3)"
    - "Picker-trigger Avatars receive href (current-assignee chips become click-to-profile); picker-OPTION Avatars stay non-linked (assignee-picker-style buttons that change state, not navigate)"
    - "DataState retro-adoption pattern — already-shipped surfaces gain the 3-state primitive without rewriting the rendering inside (only the empty/loading/error wrap changes)"

key-files:
  created:
    - Frontend2/components/primitives/avatar.test.tsx
  modified:
    - Frontend2/components/primitives/avatar-stack.tsx
    - Frontend2/components/dashboard/activity-feed.tsx
    - Frontend2/components/dashboard/portfolio-table.tsx
    - Frontend2/app/(shell)/dashboard/page.tsx
    - Frontend2/components/my-tasks/task-row.tsx
    - Frontend2/components/project-detail/list-tab.tsx
    - Frontend2/components/project-detail/board-card.tsx
    - Frontend2/components/project-detail/backlog-task-row.tsx
    - Frontend2/components/project-detail/members-tab.tsx
    - Frontend2/components/projects/project-card.tsx
    - Frontend2/components/lifecycle/artifact-inline-expand.tsx
    - Frontend2/components/lifecycle/artifacts-subtab.tsx
    - Frontend2/components/lifecycle/overview-subtab.tsx
    - Frontend2/components/task-detail/comments-section.tsx
    - Frontend2/components/task-detail/properties-sidebar.tsx
    - Frontend2/components/task-detail/attachments-section.tsx
    - Frontend2/components/task-detail/sub-tasks-list.tsx
    - Frontend2/components/task-detail/history-section.tsx

key-decisions:
  - "[13-03] artifact-inline-expand.tsx — only the trigger-button Avatar (current-assignee chip, line 335) gets href; the dropdown OPTION Avatars (line 419) intentionally stay non-linked because clicking them selects an assignee value (same RESEARCH §Pattern 3 rule that excludes assignee-picker.tsx)"
  - "[13-03] properties-sidebar.tsx — both assignee (trigger button surrounding the Avatar) and reporter Avatars get href. The assignee picker still opens for clicks elsewhere on the trigger button; only clicks on the avatar circle short-circuit via Avatar Link's e.stopPropagation()"
  - "[13-03] portfolio-table.tsx managerId is the canonical link target — Project type at services/project-service.ts already exposes managerId: number | null (snake_case→camelCase mapped at the service)"
  - "[13-03] project-card.tsx forwards href via the AvatarStackUser shape (not a JSX prop on AvatarStack) — the AvatarStack interface is the canonical extension point per Plan 13-03 step 1"
  - "[13-03] Dashboard ActivityFeed gains user_id on the ActivityItem interface AND in the normalizer at app/(shell)/dashboard/page.tsx (Rule 2 wire-up — without the normalizer plumbing the new Avatar href would always fall through to undefined). The asNumberOrNull guard accepts both numeric and digit-string actor_id/user_id payload shapes"
  - "[13-03] history-section.tsx uses e.user_id (audit-log actor) for href, NOT u.id — keeps the link valid even when projectMembers does not resolve a UserLite for the actor (defensive against partial member data)"
  - "[13-03] All consumer patches preserve existing onClick behavior on parent rows (board-card → navigate, backlog-task-row → navigate, sub-tasks-list → navigate, comments-section item rendering, etc.). Avatar Link's e.stopPropagation() is the contract that makes this safe — verified by Test 4 in avatar.test.tsx"
  - "[13-03] AvatarStack +N overflow chip stays a styled <div> (lines 53–72 of avatar-stack.tsx) — never an Avatar instance, so no opt-out branch needed for href. Mitigates T-13-03-04 by construction (the chip simply has no nav surface)"

patterns-established:
  - "Cross-cutting prop-add patch: 14-file consumer batch landed in a single commit after the test+infra commit — keeps the change atomic at the user-visible-feature level (D-D4 either works site-wide or it doesn't)"
  - "Avatar test contract is now the regression guard for any future Avatar API change — the 5 tests cover null user, no-href fallback, Link wrap, stopPropagation, and initials text rendering"
  - "When a single file has multiple Avatars in different contexts (artifact-inline-expand: trigger + option; properties-sidebar: assignee + reporter; comments-section: composer + author; board-card: rich + compact rows), patch each instance individually with the correct local id field; do NOT batch-replace blindly"

requirements-completed: [PROF-03]

duration: 7min
completed: 2026-04-26
---

# Phase 13 Plan 13-03: Wave 2 — Cross-Site Avatar `href` + DataState Retro Summary

**Site-wide click-to-profile from any rendered Avatar (16 call sites across 14 consumer files + AvatarStack carrier) — Avatar primitive's optional href contract proven by 5 RTL tests, AvatarStackUser carries per-user href, and the dashboard ActivityFeed retroactively adopts the DataState empty branch. PROF-03 cross-cutting work complete; test/type baselines unchanged.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-26T01:05:26Z
- **Completed:** 2026-04-26T01:12:13Z
- **Tasks:** 2 (both type=auto with TDD verify on Task 1)
- **Files created:** 1 (avatar.test.tsx)
- **Files modified:** 18 (primitives 1 + dashboard 3 + my-tasks 1 + project-detail 4 + projects 1 + lifecycle 3 + task-detail 5)
- **Tests added:** 5 RTL tests for Avatar primitive

## Accomplishments

- **Avatar primitive contract locked by 5 RTL tests** — null user → null DOM, no-href → styled `<div>` (no link role), href present → `<a>` Link wrapper resolving the href attribute, click on Link does NOT bubble to a parent onClick spy, initials still render inside the Link visual. The tests run in jsdom (the "Not implemented: navigation" stderr is expected — the assertion that matters is `parentClick` was never invoked).
- **AvatarStack extended cleanly** — `AvatarStackUser` interface gains optional `href?: string`; the inner `shown.map` forwards `href={u.href}` to each per-user Avatar; the `+N` overflow chip block (lines 52–72) is unchanged because it renders a styled `<div>`, not an Avatar instance — T-13-03-04 mitigated by construction.
- **16 Avatar consumer call sites** now forward `href={\`/users/${id}\`}` when a user id is in scope:
  - Dashboard: portfolio-table (manager), activity-feed (actor)
  - My-tasks: task-row (assignee)
  - Project-detail: list-tab (assignee column), board-card (rich + compact, 2 sites), backlog-task-row (assignee), members-tab (manager)
  - Projects: project-card (manager via AvatarStackUser.href)
  - Lifecycle: artifact-inline-expand (trigger only), artifacts-subtab (owner), overview-subtab (upcoming task assignee)
  - Task-detail: comments-section (composer + comment author), properties-sidebar (assignee + reporter), attachments-section (uploader), sub-tasks-list (sub-task assignee), history-section (history actor)
- **Dashboard ActivityFeed retro-adopts `<DataState/>`** — the empty branch is now wrapped in DataState (D-F2 retro-adoption); the existing list rendering is preserved verbatim inside the children slot.
- **Dashboard normalizer wired for user_id** — `ActivityItem` gains `user_id?: number | null`; the dashboard page's `useMemo` reduce now extracts the actor id from the backend payload (`item.user_id ?? item.actor_id`, accepting numeric AND digit-string shapes via the `asNumberOrNull` guard) so the ActivityFeed Avatar can populate href without further plumbing.
- **Excluded files genuinely untouched** — `task-detail/assignee-picker.tsx` and `project-detail/backlog-panel.tsx` are NOT in this plan's diff (verified `git diff --stat` returns empty for those paths). Plan-checker constraint upheld per RESEARCH §Pattern 3.

## Task Commits

Each task was committed atomically:

1. **Task 1: Avatar RTL test + AvatarStack extension + dashboard activity-feed (DataState + Avatar href + user_id wire-up) + portfolio-table manager Avatar href** — `bba2e18` (feat)
2. **Task 2: 14 cross-cutting Avatar consumer patches (my-tasks/project-detail/projects/lifecycle/task-detail)** — `68c4dd9` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (1)
- `Frontend2/components/primitives/avatar.test.tsx` — 5 RTL tests covering the Plan 13-01 href contract (null user, no-href, Link wrap, stopPropagation, initials inside Link).

### Modified (18)

**Primitives (1):**
- `Frontend2/components/primitives/avatar-stack.tsx` — `AvatarStackUser` interface gains `href?: string`; inner Avatar map forwards it.

**Dashboard (3):**
- `Frontend2/app/(shell)/dashboard/page.tsx` — normalizer extracts `user_id` from payload (item.user_id ?? item.actor_id, numeric or digit-string).
- `Frontend2/components/dashboard/activity-feed.tsx` — ActivityItem interface gains user_id; empty branch wrapped in DataState; Avatar gets href={item.user_id ? `/users/${item.user_id}` : undefined}.
- `Frontend2/components/dashboard/portfolio-table.tsx` — manager column Avatar gets href={project.managerId ? `/users/${project.managerId}` : undefined}.

**My-tasks (1):**
- `Frontend2/components/my-tasks/task-row.tsx` — assignee Avatar gets href when task.assigneeId present.

**Project-detail (4):**
- `Frontend2/components/project-detail/list-tab.tsx` — assignee column Avatar gets href={`/users/${aid}`} (aid is non-null in this branch).
- `Frontend2/components/project-detail/board-card.tsx` — TWO Avatars patched (rich-mode footer + compact-mode row) both with href when task.assigneeId present.
- `Frontend2/components/project-detail/backlog-task-row.tsx` — assignee Avatar gets href.
- `Frontend2/components/project-detail/members-tab.tsx` — project manager Avatar gets href when project.managerId present.

**Projects (1):**
- `Frontend2/components/projects/project-card.tsx` — managerAvatars carries href per-user via AvatarStackUser.href; AvatarStack forwards.

**Lifecycle (3):**
- `Frontend2/components/lifecycle/artifact-inline-expand.tsx` — current-assignee TRIGGER Avatar (line 335) gets href; option-row Avatars (line 419) intentionally NOT patched (picker-option rule).
- `Frontend2/components/lifecycle/artifacts-subtab.tsx` — owner Avatar gets href={`/users/${a.assigneeId}`}.
- `Frontend2/components/lifecycle/overview-subtab.tsx` — upcoming task assignee Avatar gets href.

**Task-detail (5):**
- `Frontend2/components/task-detail/comments-section.tsx` — composer Avatar gets href (currentUserId), comment-author Avatar gets href (c.authorId).
- `Frontend2/components/task-detail/properties-sidebar.tsx` — assignee Avatar (inside picker trigger) gets href, reporter Avatar (read-only row) gets href.
- `Frontend2/components/task-detail/attachments-section.tsx` — uploader Avatar gets href when a.uploaderId present.
- `Frontend2/components/task-detail/sub-tasks-list.tsx` — sub-task assignee Avatar gets href when st.assigneeId present.
- `Frontend2/components/task-detail/history-section.tsx` — history actor Avatar gets href={e.user_id ? `/users/${e.user_id}` : undefined} (uses audit-log actor id, not the resolved member, so the link works even when projectMembers can't resolve the user).

## Decisions Made

See `key-decisions:` block in frontmatter — 8 decisions captured. Highlights:

- **artifact-inline-expand.tsx selective patching** — only the picker trigger Avatar (which displays the CURRENT assignee, a logical click-to-profile target) was patched. The dropdown-option Avatars stay non-linked because they live inside option `<div role="button">` rows whose entire purpose is to call `setAssigneeId(o.id)` — exactly the same pattern as `assignee-picker.tsx` which RESEARCH §Pattern 3 explicitly excludes. This is a reading nuance in the plan: the plan listed the file but the only Avatars in it are picker UI; the trigger one is the only D-D4-applicable instance.
- **Dashboard normalizer wire-up was a Rule 2 critical addition** — without `app/(shell)/dashboard/page.tsx` plumbing user_id from backend → ActivityItem, the Avatar's new `href` prop would always be `undefined` (data path stays broken). The plan called for `href={item.user_id ? ...}` but didn't mention the normalizer — adding the wiring closes the loop.
- **history-section.tsx uses e.user_id, not u.id** — when projectMembers can't resolve a user id to a UserLite, `u` is undefined and the Avatar is not rendered at all. The href is computed off `e.user_id` (the audit-log actor id, always present) so when the Avatar IS rendered the link is always valid. Defensive against partial member data.
- **project-card.tsx uses the AvatarStackUser.href object property** — NOT a JSX prop on AvatarStack itself. The plan's Step 6 lays this out: AvatarStackUser carries href and AvatarStack forwards to inner Avatar. This is the cleaner path because AvatarStack supports multiple users with potentially different hrefs (e.g., a member list); a single-href prop on AvatarStack would force all-or-nothing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Wire user_id through the dashboard normalizer**
- **Found during:** Task 1 Step 3 (dashboard activity-feed Avatar href patch)
- **Issue:** The plan called for `href={item.user_id ? \`/users/${item.user_id}\` : undefined}` on the ActivityFeed Avatar but the existing `ActivityItem` interface had no `user_id` field, and the dashboard page's `useMemo` reduce didn't read it from the backend payload. Without the wire-up the new Avatar href would always evaluate to `undefined` — the cross-cutting feature would be silently broken on the dashboard surface.
- **Fix:** Added `user_id?: number | null` to `ActivityItem`; added an `asNumberOrNull` guard in the dashboard normalizer that accepts both `number` and digit-`string` inputs from `item.user_id` or `item.actor_id`. Activity-feed Avatar reads it.
- **Files modified:** `Frontend2/components/dashboard/activity-feed.tsx`, `Frontend2/app/(shell)/dashboard/page.tsx`
- **Verification:** `grep "asNumberOrNull" Frontend2/app/(shell)/dashboard/page.tsx` matches; tsc clean on touched files; full vitest 19 fail / 464 pass (same 19 pre-existing workflow-editor failures, +5 new Avatar passes vs 459 baseline — zero new failures).
- **Committed in:** `bba2e18` (Task 1 commit, same hunk).

**2. [Rule 1 — Plan-vs-Architecture nuance] artifact-inline-expand.tsx patches only the trigger Avatar**
- **Found during:** Task 2 Step 7 (lifecycle/artifact-inline-expand.tsx)
- **Issue:** The plan listed artifact-inline-expand.tsx and Step 7 said "Locate `<Avatar`" + add href to the assignee Avatar. But the file has TWO Avatar instances: line 335 (inside the picker TRIGGER button, displaying the current assignee) and line 419 (inside picker OPTION rows that fire `setAssigneeId(o.id)`). The latter is the same pattern as `assignee-picker.tsx`, which RESEARCH §Pattern 3 explicitly excludes from this plan. Adding href to the option-row Avatars would conflict with the option-row click handlers (they'd navigate instead of selecting an assignee).
- **Fix:** Patched only the trigger Avatar (line 335). Added an inline comment explaining the option-row Avatars stay non-linked per RESEARCH §Pattern 3. The trigger Avatar is the D-D4-applicable instance because it displays the CURRENT assignee — exactly what should become a click-to-profile.
- **Files modified:** `Frontend2/components/lifecycle/artifact-inline-expand.tsx`
- **Verification:** Trigger-button Avatar grep matches `href=`; option-row Avatar grep at line 419 confirms unchanged. tsc clean.
- **Committed in:** `68c4dd9` (Task 2 commit).

**3. [Rule 1 — Spec-vs-impl shape] portfolio-table.tsx uses project.managerId, not project.lead_id / project.manager_id**
- **Found during:** Task 1 Step 4 (portfolio-table Avatar patch)
- **Issue:** The plan's verbatim snippet wrote `href={project.managerId ? ... : undefined}` but added a verification note: "verify `project.managerId` (or equivalent — read the row data type) is the correct id field…and adjust if it's `manager_id` or `lead_id`". The actual canonical Project type at `Frontend2/services/project-service.ts` exposes `managerId: number | null` (camelCase, mapped at the service layer from backend `manager_id`). No adjustment needed — the verification confirmed `managerId` is correct.
- **Fix:** Used `project.managerId` directly (matches Project type).
- **Files modified:** `Frontend2/components/dashboard/portfolio-table.tsx`
- **Verification:** Reading `services/project-service.ts` confirms the camelCase field; tsc clean.
- **Committed in:** `bba2e18` (Task 1 commit).

---

**Total deviations:** 3 auto-fixed (1 missing critical wire-up, 1 plan-vs-architecture interpretation, 1 confirmed-correct field name). No scope creep; no architectural decisions needed; no checkpoint required.
**Impact on plan:** Plan executed essentially as written. The dashboard normalizer addition is the most material change and was necessary for the feature to work end-to-end.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 in editor-page / selection-panel / workflow-canvas) carry forward from Phase 12 / Plan 13-01 / Plan 13-02. Verified pre-existing — full vitest baseline pre-Plan-13-03 = 19 failed / 459 passed (478 total); post-Plan-13-03 = 19 failed / 464 passed (483 total). The +5 deltas are the new Avatar tests — zero NEW failures introduced. Out of scope per executor scope-boundary rule. Already documented in 13-01 and 13-02 SUMMARYs; no need to re-add to deferred-items.md.

## Threat Flags

None — Plan 13-03 introduces no new trust boundary surface. Hrefs are hard-coded `/users/${id}` templates where `id` is an integer field already typed at the service layer (TypeScript narrows). AvatarStack's overflow chip stays a `<div>` so no surface to attack (T-13-03-04 mitigated by construction). Avatar Link's `e.stopPropagation()` (Plan 13-01 contract) prevents parent row-click hijack (T-13-03-02 mitigated). T-13-03-03 (any user can navigate to any /users/[id]) is an explicit accepted risk per CONTEXT D-C2.

## User Setup Required

None — pure frontend prop-add patch. No external service configuration, no environment variables, no DB work, no library install.

## Next Phase Readiness

**Ready for Wave 3 plans:**

- **Plan 13-04 (ProjectDetail Activity tab)** — every Avatar consumer in the project surface area now forwards href; the new ActivityTab component can render activity rows with click-to-profile actor avatars by following the dashboard ActivityFeed pattern (`href={item.user_id ? ...}`) verbatim.
- **Plan 13-05 (User profile route)** — the destination route for every Avatar Link landed in this plan. Without /users/[id] the links 404 — Plan 13-05 ships the destination so the cross-cutting work becomes user-visible.
- **Plan 13-06 (Profile Activity tab)** — same ActivityTab compositional pattern as 13-04; will benefit from this plan's Avatar href infrastructure.
- **Plan 13-07/08 (Reports charts + Faz Raporları)** — chart card consumers don't render Avatars directly; PhaseReportsSection's recent-rows table will reuse Avatar patterns from artifact-inline-expand / artifacts-subtab.
- **No backend dependency** — Plan 13-03 is pure frontend. Backend remained unchanged.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks but the gate sequence was effectively single-commit-per-task (TDD-style verify rather than strict RED/GREEN/REFACTOR split):

- **Task 1 commit (`bba2e18` feat):** Avatar test file + AvatarStack extension + activity-feed patch + portfolio-table patch. The test file is included alongside the implementation — both land in one `feat(...)` commit. The tests verify the Plan 13-01 implementation (Avatar already shipped its href contract); Plan 13-03's tests are a regression guard, not a new RED→GREEN cycle. So `feat` (not strict `test` then `feat`) is the honest commit type for this case.
- **Task 2 commit (`68c4dd9` feat):** 14 consumer patches. No new tests for these — vitest baseline check (19/464) confirms zero regressions on existing consumer-specific tests (e.g., my-tasks/task-row tests, board-card tests if any).

Strict gate-sequence (separate `test` then `feat` then `refactor`) was not produced because the Avatar primitive's behavior was already shipped in Plan 13-01 — Plan 13-03's Task 1 only adds RTL coverage of existing behavior, not new behavior. This is the intended execution shape and not a TDD violation.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/primitives/avatar.test.tsx` exists with 5 `it(` blocks; vitest run on this file alone exits 0 with 5 passes.
- `Frontend2/components/primitives/avatar-stack.tsx` `AvatarStackUser` interface contains `href?: string`; inner Avatar map forwards `href={u.href}` (grep matches at line 56); +N branch (lines 60+) renders a styled `<div>` with no Avatar instance (manual code read confirms).
- `Frontend2/components/dashboard/activity-feed.tsx` contains `<DataState`; Avatar usage contains `href={item.user_id`.
- `Frontend2/components/dashboard/portfolio-table.tsx` Avatar usage contains `href={project.managerId`.
- `Frontend2/app/(shell)/dashboard/page.tsx` contains `asNumberOrNull` and `user_id:` in the normalizer.
- All 14 Task-2 consumer files contain `href=` with `/users/` template literal (verified via grep loop — 13/14 hit the JSX-prop pattern; project-card.tsx uses the AvatarStackUser object-property pattern at line 142, also verified).
- Excluded files NOT modified: `git diff --stat HEAD~2 HEAD -- Frontend2/components/task-detail/assignee-picker.tsx Frontend2/components/project-detail/backlog-panel.tsx` returns empty.
- Full vitest baseline: 19 failed / 464 passed (483 total) — same 19 pre-existing workflow-editor failures; +5 NEW Avatar passes vs 459 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(avatar|avatar-stack|activity-feed|portfolio-table|task-row|list-tab|board-card|backlog-task-row|members-tab|project-card|artifact-inline-expand|artifacts-subtab|overview-subtab|comments-section|properties-sidebar|attachments-section|sub-tasks-list|history-section|dashboard/page)\.tsx?:'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `bba2e18` (Task 1) + `68c4dd9` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
