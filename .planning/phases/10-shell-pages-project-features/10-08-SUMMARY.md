---
phase: 10-shell-pages-project-features
plan: "08"
subsystem: ui
tags: [nextjs, react, tanstack-query, archive-banner, project-detail]

requires:
  - phase: 10-05
    provides: useUpdateProjectStatus mutation + ConfirmDialog component

provides:
  - ArchiveBanner component (AlertBanner tone=warning + Aktif Et confirm dialog + reactivation mutation)
  - /projects/[id] route stub with archive detection and D-34 disabled edit buttons

affects:
  - Phase 11 (project detail full page inherits isArchived pattern and ArchiveBanner)

tech-stack:
  added: []
  patterns:
    - ArchiveBanner wraps AlertBanner + ConfirmDialog + useUpdateProjectStatus mutation at component level
    - isArchived boolean derived from project.status === 'ARCHIVED' as single source of truth for D-34 disabled state

key-files:
  created:
    - Frontend2/components/projects/archive-banner.tsx
    - Frontend2/app/(shell)/projects/[id]/page.tsx
  modified: []

key-decisions:
  - "ArchiveBanner owns its own ConfirmDialog state — keeps reactivation flow self-contained; page only passes projectId + projectName"
  - "isArchived boolean is derived live from fetched project.status — not stored in local state — so after reactivation TanStack Query invalidation auto-updates the boolean and re-enables all buttons"
  - "NaN guard for [id] route param: Number(params.id) on non-numeric string gives NaN; enabled: !!projectId in useProject prevents API call (T-10-08-02 mitigated)"

patterns-established:
  - "isArchived pattern: const isArchived = project.status === 'ARCHIVED'; disabled={isArchived} on all edit Buttons — Phase 11 inherits this exact pattern for real action buttons"

requirements-completed:
  - PROJ-03
  - PROJ-04

duration: 2min
completed: "2026-04-21"
---

# Phase 10 Plan 08: ArchiveBanner + Project Detail Stub Summary

**ArchiveBanner component with AlertBanner tone=warning, Aktif Et confirm-then-PATCH reactivation, and a /projects/[id] stub page that conditionally renders the banner and enforces D-34 disabled edit buttons from isArchived**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-21T19:41:33Z
- **Completed:** 2026-04-21T19:42:53Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- ArchiveBanner: AlertBanner tone=warning showing "Bu proje arşivlenmiştir" with Aktif Et button that opens ConfirmDialog before calling PATCH /projects/{id} status→ACTIVE with success/error toast
- /projects/[id] page stub: fetches project via useProject(id), renders ArchiveBanner at top when ARCHIVED, shows project name/key/methodology header, placeholder Phase 11 card — all edit Buttons carry disabled={isArchived} per D-34
- TypeScript exits clean — npx tsc --noEmit produces zero errors

## Task Commits

1. **Task 1: ArchiveBanner component + project detail stub page (PROJ-03, D-34)** - `da8be46` (feat)

**Plan metadata:** _(final docs commit recorded below)_

## Files Created/Modified

- `Frontend2/components/projects/archive-banner.tsx` — ArchiveBanner: AlertBanner tone=warning + Aktif Et Button + ConfirmDialog + useUpdateProjectStatus mutation
- `Frontend2/app/(shell)/projects/[id]/page.tsx` — Project detail stub: useParams, useProject, isArchived derivation, ArchiveBanner conditional render, D-34 disabled Buttons

## Decisions Made

- ArchiveBanner owns its own ConfirmDialog state — keeps reactivation flow self-contained; page only passes projectId + projectName
- isArchived boolean derived live from fetched project.status (not local state) so after reactivation TanStack Query invalidation auto-enables buttons without extra logic
- NaN guard for [id] route: Number(params.id) returns NaN for non-numeric params; enabled: !!projectId in useProject prevents the API call (T-10-08-02 mitigated structurally)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PROJ-03 and D-34 structurally satisfied — Phase 11 (project detail full page) can replace stub content with Board/List/Timeline tabs while inheriting `isArchived` pattern and ArchiveBanner intact
- ArchiveBanner is fully wired to real PATCH endpoint — verifiable now with any ARCHIVED project in the seed data

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `Frontend2/app/(shell)/projects/[id]/page.tsx` | Placeholder Phase 11 card content | Intentional — Phase 11 replaces with real Board/List/Timeline tabs per plan scope |

## Threat Flags

None — no new network endpoints or auth paths introduced. Reactivation PATCH goes through existing useUpdateProjectStatus mutation, which is gated by Phase 9 require_project_transition_authority (T-10-08-01). NaN guard prevents unbounded API calls (T-10-08-02).

## Self-Check: PASSED

- `Frontend2/components/projects/archive-banner.tsx` — FOUND
- `Frontend2/app/(shell)/projects/[id]/page.tsx` — FOUND
- Commit `da8be46` — FOUND (git log confirms)
- TypeScript check — PASSED (npx tsc --noEmit exits 0)

---
*Phase: 10-shell-pages-project-features*
*Completed: 2026-04-21*
