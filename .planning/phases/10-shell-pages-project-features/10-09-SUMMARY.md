---
phase: 10-shell-pages-project-features
plan: "09"
subsystem: ui
tags: [nextjs, react, tanstack-query, typescript, header, project-status, theme, toast, seeder]

# Dependency graph
requires:
  - phase: 10-shell-pages-project-features/10-08
    provides: ArchiveBanner component + projects/[id] stub page
  - phase: 10-shell-pages-project-features/10-05
    provides: ProjectCard, STATUS_BADGE_TONE pattern, ToastProvider
  - phase: 10-shell-pages-project-features/10-03
    provides: useProjects hook, project-service, auth middleware
  - phase: 10-shell-pages-project-features/10-01
    provides: AppShell, Header component, theme system
provides:
  - Header Create button wired to /projects/new (resolves STATE.md 08-04 deferral)
  - Dynamic project status badge in header on /projects/{id} routes (PROJ-02)
  - Full Phase 10 integration verified via human-verify checkpoint (all 9 plans)
  - 14 post-checkpoint gap-closure fixes across auth, theming, seeder, UI, backend
affects:
  - Phase 11 (TaskFeatures) — all Phase 10 pages verified and stable
  - Phase 10 P10 — backend integration tests + final build verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - usePathname + useProjects cache lookup for header context badge (no extra API call)
    - Post-checkpoint gap-closure iteration cycle (14 targeted fix commits)
    - Inline theme-init script with PRESETS to eliminate FOUC on F5
    - CSS dark token pre-declaration to prevent hydration flicker

key-files:
  created: []
  modified:
    - Frontend2/components/app-shell.tsx
    - Frontend2/app/(shell)/layout.tsx
    - Frontend2/components/dashboard/activity-feed.tsx
    - Frontend2/components/projects/project-card.tsx
    - Frontend2/components/ui/toast.tsx
    - Frontend2/components/wizard/create-project-wizard.tsx
    - Frontend2/app/globals.css
    - Backend/app/infrastructure/database/seeder.py
    - Backend/app/api/v1/projects.py
    - Backend/app/api/v1/process_templates.py
    - Backend/app/application/dtos/project_dto.py
    - Backend/app/infrastructure/database/repositories/project_repo.py

key-decisions:
  - "Header badge reads from useProjects() TanStack Query cache — zero extra network calls on /projects/{id} routes already visited"
  - "theme-init inline script embeds full PRESETS + brand derivation to eliminate button-color flicker (FOUC guard via body visibility:hidden before data-mode set)"
  - "Seeder idempotency guard on projects not users — prevents duplicate project creation on re-run without wiping user accounts"
  - "Process templates seeded as built-in Scrum/Kanban/Waterfall entries — wizard can display them without prior admin action"
  - "Status transitions persisted via DTO status field + updatable_fields in repo — PATCH /projects/{id} now correctly applies status changes"
  - "Toast repositioned to top-right at top:72 (below 64px header) with solid red/white error variant for visibility"
  - "403 vs 404 distinction on project update surfaces accurate error toast (not a generic failure message)"
  - "ActivityFeed capped at 360px with internal scroll + overscroll-contain to prevent page scroll capture"
  - "ProjectCard footer anchored to card bottom via flex column + mt-auto regardless of description length"

patterns-established:
  - "Post-checkpoint gap-closure: each user-reported issue addressed in a dedicated atomic fix commit before APPROVED signal"
  - "Header dynamic badge: usePathname() match → id extract → useProjects() cache find → conditional Badge render"
  - "FOUC prevention: inline <script> in <head> sets data-mode before React hydration; body starts visibility:hidden, script sets visible"

requirements-completed: [PAGE-01, PAGE-02, PROJ-02]

# Metrics
duration: ~60min (Task 1 automated + 14-iteration human-verify cycle)
completed: 2026-04-21
---

# Phase 10 Plan 09: Wire Header Create Button + Full Phase 10 Human-Verify Summary

**Header Create button wired to /projects/new + dynamic project status badge in header (PROJ-02) + all Phase 10 pages verified across 14 post-checkpoint gap-closure iterations**

## Performance

- **Duration:** ~60 min total (Task 1 automated + extended human-verify checkpoint cycle)
- **Started:** 2026-04-21
- **Completed:** 2026-04-21
- **Tasks:** 2 (Task 1: auto; Task 2: checkpoint:human-verify — APPROVED after 14 iterations)
- **Files modified:** 12+ across frontend and backend

## Accomplishments

- Wired Header "Yeni proje" button to navigate to `/projects/new`, resolving the explicit deferral from STATE.md 08-04
- Implemented PROJ-02: dynamic project status badge in header via `usePathname()` + `useProjects()` TanStack Query cache lookup — zero extra API calls
- Completed 14-iteration human-verify checkpoint cycle: user reported issues after visual walkthrough, each fixed in a targeted atomic commit, verified, and approved

## Task Commits

1. **Task 1: Wire Header Create button + dynamic status badge** - `aabbf5a` (feat)
2. **Task 2: Human-verify checkpoint** - APPROVED after 14 post-checkpoint iterations (see below)

## Files Created/Modified

- `Frontend2/components/app-shell.tsx` - Header Create button onClick + PROJ-02 status badge (usePathname + useProjects)
- `Frontend2/app/globals.css` - CSS dark token pre-declaration to prevent hydration/theme flicker
- `Frontend2/app/(shell)/layout.tsx` - Inline theme-init script with full PRESETS for FOUC prevention
- `Frontend2/components/dashboard/activity-feed.tsx` - Height cap 360px with internal scroll
- `Frontend2/components/projects/project-card.tsx` - Footer anchored to bottom, badge/menu spacing (paddingRight 28)
- `Frontend2/components/ui/toast.tsx` - Repositioned to top-right below header, solid error variant
- `Frontend2/components/wizard/create-project-wizard.tsx` - Empty-state for no templates
- `Backend/app/infrastructure/database/seeder.py` - Idempotency guard on projects; seed built-in process templates
- `Backend/app/api/v1/projects.py` - 403 vs 404 distinction; task stats endpoint; admin bypass
- `Backend/app/api/v1/process_templates.py` - Allow any authenticated user to list templates
- `Backend/app/application/dtos/project_dto.py` - status field added to update DTO
- `Backend/app/infrastructure/database/repositories/project_repo.py` - status added to updatable_fields

## Decisions Made

- Header badge reads from `useProjects()` TanStack Query cache — no dedicated endpoint, no extra network request when navigating from /projects to /projects/{id}
- `theme-init` inline `<script>` embeds full PRESETS + brand token derivation so the initial paint never shows the wrong button color (FOUC eliminated at source)
- Body starts `visibility:hidden` and the theme-init script sets it to `visible` after `data-mode` is applied — prevents flash of unstyled content on F5/hard reload
- Seeder idempotency guard placed on projects (not users) — allows re-seeding project data without requiring user account deletion
- Built-in process templates (Scrum/Kanban/Waterfall) seeded as fixture data so the Create Project wizard always has templates to display
- Status transitions now persist end-to-end: DTO accepts `status` field, repository `updatable_fields` includes it — PATCH /projects/{id} was previously silently ignoring status

## Post-Checkpoint Fixes

The human-verify checkpoint (Task 2) required 14 targeted fix commits before the user approved. Each commit addresses a specific issue reported during the visual walkthrough:

| # | Commit | Description |
|---|--------|-------------|
| 1 | `2895d83` | Task stats endpoint added (GET /tasks filter by project) + admin project list bypass so admin sees all projects regardless of team membership |
| 2 | `3f17bb4` | Hydration mismatch on Header theme toggle — server/client HTML differed on initial render due to theme state derivation before hydration |
| 3 | `bc443aa` | Theme-mode flicker on initial load eliminated — CSS dark tokens pre-declared in globals.css + inline script sets `data-mode` before React paint |
| 4 | `6f067e2` | FOUC guard added: body set to `visibility:hidden` in CSS; theme-init script sets `visible` after `data-mode` applied, preventing flash on F5 |
| 5 | `b2d5f77` | Inline theme-init script extended to embed full PRESETS array + brand color derivation — eliminates residual button-color flicker even with cached CSS |
| 6 | `d00e20f` | Seeder idempotency guard moved to projects table (was on users) — re-running seeder no longer creates duplicate projects while preserving user accounts |
| 7 | `d76f2d0` | ActivityFeed height capped at 360px with `overflow-y: auto` + `overscroll-behavior: contain` — prevents the feed from expanding the page and capturing scroll |
| 8 | `f182455` | Process templates list endpoint: permission check relaxed from admin-only to any authenticated user — wizard could not fetch templates for non-admin users |
| 9 | `bf60733` | Project update endpoint distinguishes 403 (insufficient permissions) vs 404 (not found) — frontend toast now surfaces the accurate error message |
| 10 | `75c8798` | Toast repositioned to top-right; ProjectCard badge/menu spacing set to `paddingRight: 28` to prevent overflow-menu button from overlapping status badge |
| 11 | `b996d20` | Error toast styled as solid red background / white text (was semi-transparent); `top` adjusted to `72px` to sit below the 64px fixed header |
| 12 | `21e0429` | Built-in process templates (Scrum, Kanban, Waterfall) seeded in seeder + wizard renders empty-state when no templates returned from API |
| 13 | `24dae60` | ProjectCard footer anchored to card bottom via `mt-auto` in flex column layout — cards with short descriptions no longer have floating footers |
| 14 | `2b6ab40` | Status transitions persisted end-to-end: `status` field added to `ProjectUpdateDTO` + `updatable_fields` in repo; sidebar logout button wired to auth signOut |

## Deviations from Plan

The plan specified one auto task (Task 1) and one checkpoint. Task 1 executed as planned. The checkpoint surfaced 14 issues that were not anticipated in the plan — all addressed via Rule 1 (bug fix) and Rule 2 (missing critical functionality) deviation rules.

### Auto-fixed Issues (Post-Checkpoint)

**1. [Rule 1 - Bug] Hydration mismatch on theme toggle** — `3f17bb4`
- Theme state computed differently on server vs client first render

**2. [Rule 1 - Bug] FOUC / theme flicker on F5** — `bc443aa`, `6f067e2`, `b2d5f77`
- Three-commit progression: CSS tokens → body visibility guard → full PRESETS inline

**3. [Rule 1 - Bug] Status transitions not persisted** — `2b6ab40`
- DTO missing status field + repository not including it in updatable_fields

**4. [Rule 1 - Bug] Seeder creates duplicate projects on re-run** — `d00e20f`
- Idempotency guard was on users, not projects

**5. [Rule 2 - Missing Critical] Task stats endpoint absent** — `2895d83`
- Dashboard StatCard 4 had no data source; admin needed project list bypass

**6. [Rule 2 - Missing Critical] Process templates locked to admin** — `f182455`
- Wizard inaccessible for non-admin users; any authenticated user should list templates

**7. [Rule 2 - Missing Critical] Built-in templates not seeded** — `21e0429`
- Wizard showed empty state; Scrum/Kanban/Waterfall templates must exist out-of-box

**8. [Rule 1 - Bug] 403/404 conflation on project update** — `bf60733`
- Single error handler masked permission errors vs not-found errors

**9. [Rule 1 - Bug] ActivityFeed captured page scroll** — `d76f2d0`
- No height constraint; overscroll bled to page

**10. [Rule 1 - Bug] ProjectCard footer not anchored to bottom** — `24dae60`
- Flex layout missing `mt-auto` on footer; short descriptions caused float

**11. [Rule 1 - Bug] Toast position overlapped header + poor error visibility** — `75c8798`, `b996d20`
- Two-commit fix: position → then color/opacity

**12. [Rule 1 - Bug] Sidebar logout not wired** — `2b6ab40`
- Logout button in sidebar user menu had no onClick handler

---

**Total deviations:** 14 post-checkpoint fixes (10 Rule 1 bugs, 4 Rule 2 missing critical)
**Impact on plan:** All fixes necessary for correctness, visual fidelity, and usability. No scope creep beyond resolving direct user-reported issues.

## Issues Encountered

- Theme FOUC required a three-commit iterative approach (CSS tokens first, then body visibility guard, then full PRESETS inline) because each layer exposed the next level of flicker
- Status persistence required coordinated backend DTO + repository change (two systems); detected only during live testing when status changes appeared to succeed but reverted on refresh

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 10 deliverables verified and approved by user
- Plan 10-10 (backend integration tests + final build verification) is the last plan in Phase 10
- Post-checkpoint fixes have closed all known gaps; 10-10 can run integration test suite and declare Phase 10 complete

---
*Phase: 10-shell-pages-project-features*
*Completed: 2026-04-21*
