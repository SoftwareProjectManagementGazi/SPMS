---
phase: 02-authentication-team-management
plan: 06
subsystem: ui
tags: [react, nextjs, shadcn, alertdialog, form, avatar, file-upload, confirmation]

requires:
  - phase: 02-03
    provides: PUT /auth/me and POST /auth/me/avatar backend endpoints

provides:
  - Settings page wired to live PUT /auth/me with full_name/email/current_password
  - Avatar upload via POST /auth/me/avatar with file input
  - Reusable ConfirmDialog and TypeToConfirmDialog components
  - Delete project guarded by TypeToConfirmDialog (type-name-to-confirm)
  - Delete task guarded by ConfirmDialog (Cancel/Confirm)

affects:
  - 02-07-teams-frontend
  - future feature pages with destructive actions

tech-stack:
  added: []
  patterns:
    - "No optimistic updates: UI state set only after server confirms success"
    - "Conditional field pattern: current_password appears only when email differs from originalEmail"
    - "Reusable dialog components accept open/onOpenChange props — no internal trigger, caller controls state"
    - "Avatar URL reconstruction: uploads/avatars/uuid.ext -> API_BASE/auth/avatar/uuid.ext"

key-files:
  created:
    - Frontend/components/ui/confirm-dialog.tsx
  modified:
    - Frontend/app/settings/page.tsx
    - Frontend/services/auth-service.ts
    - Frontend/app/projects/[id]/page.tsx
    - Frontend/app/tasks/[id]/page.tsx
    - Frontend/services/project-service.ts

key-decisions:
  - "mapUserResponseToUser extracted as module-level function in auth-service.ts so updateProfile and uploadAvatar can reuse it without duplicating mapping logic"
  - "User.role type is { name: string } not { name, description } — description field stripped from mapper to match existing type"
  - "deleteProject() added to projectService (DELETE /projects/:id) as part of wiring TypeToConfirmDialog — projects page previously had no delete call"
  - "Pre-existing TypeScript errors in mock-data.ts, app/page.tsx, task-header.tsx are out-of-scope; plan files (settings, auth-service, confirm-dialog, projects, tasks) compile clean"

patterns-established:
  - "ConfirmDialog: controlled open state, destructive prop adds red styling, confirmLabel configurable"
  - "TypeToConfirmDialog: resets input on close via useEffect, confirm button disabled until inputValue === confirmText"

requirements-completed:
  - AUTH-01
  - SAFE-01

duration: 18min
completed: 2026-03-12
---

# Phase 2 Plan 06: Settings Form + Confirmation Dialogs Summary

**Settings page wired to PUT /auth/me with conditional current_password field, avatar upload via POST /auth/me/avatar, and reusable ConfirmDialog/TypeToConfirmDialog components guarding delete project and delete task actions.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-12T20:30:00Z
- **Completed:** 2026-03-12T20:48:00Z
- **Tasks:** 2
- **Files modified:** 5 (+ 1 created)

## Accomplishments

- Settings page fully wired: controlled form with save button, loading state, success/error feedback, no optimistic updates
- Conditional current_password field appears only when email value changes from original
- Avatar file input calls uploadAvatar(), renders authenticated avatar URL from /auth/avatar/{filename}
- ConfirmDialog and TypeToConfirmDialog created as reusable components in components/ui/
- Delete Project wrapped in TypeToConfirmDialog (user must type project name exactly to confirm)
- Delete Task wrapped in ConfirmDialog (Cancel / Delete Task buttons, destructive styling)

## Task Commits

1. **Task 1: Settings page profile form save + avatar upload wiring** - `ebe3425` (feat)
2. **Task 2: Reusable confirmation dialogs and wiring to destructive actions** - `7dc375e` (feat)

## Files Created/Modified

- `Frontend/services/auth-service.ts` - Extracted mapUserResponseToUser helper; added updateProfile() and uploadAvatar() methods
- `Frontend/app/settings/page.tsx` - Full form wiring: controlled inputs, conditional password field, avatar upload, save handler with loading/success/error states
- `Frontend/components/ui/confirm-dialog.tsx` - New file: ConfirmDialog and TypeToConfirmDialog exports
- `Frontend/app/projects/[id]/page.tsx` - Added TypeToConfirmDialog, deleteDialogOpen state, handleDeleteProject handler, Delete Project dropdown item
- `Frontend/app/tasks/[id]/page.tsx` - Added ConfirmDialog, deleteDialogOpen state, handleDeleteTask handler, Delete Task button with Trash2 icon
- `Frontend/services/project-service.ts` - Added deleteProject() method calling DELETE /projects/:id

## Decisions Made

- Extracted `mapUserResponseToUser` as a module-level function (not inline in getCurrentUser) so the new updateProfile and uploadAvatar methods can reuse it cleanly without duplicating the User DTO mapping logic.
- `User.role` type is `{ name: string }` (no description field) per lib/types.ts — removed the description property from the mapper to match the existing type contract.
- Added `deleteProject()` to projectService as part of this plan's wiring work (the projects page had no delete functionality at all).
- Pre-existing TypeScript errors in mock-data.ts and other unrelated files are out of scope; all files modified in this plan compile without errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript errors: user.name and user.email possibly undefined**
- **Found during:** Task 1 (settings page)
- **Issue:** User.name and User.email are typed as `string | undefined` in lib/types.ts, causing TS2345 errors when passed to `setState<string>`
- **Fix:** Added `?? ""` nullish coalescing fallback on all setFullName/setEmail/setOriginalEmail calls
- **Files modified:** Frontend/app/settings/page.tsx
- **Verification:** tsc --noEmit shows no settings page errors
- **Committed in:** ebe3425 (Task 1 commit)

**2. [Rule 1 - Bug] mapUserResponseToUser role type mismatch**
- **Found during:** Task 1 (auth-service.ts refactor)
- **Issue:** Original getCurrentUser returned `{ name, description }` for role but User type only allows `{ name: string }` — TypeScript TS2322 error surfaced when extracting to standalone function
- **Fix:** Stripped `description` from the role object in mapUserResponseToUser to match the User interface
- **Files modified:** Frontend/services/auth-service.ts
- **Verification:** tsc --noEmit shows no auth-service errors
- **Committed in:** ebe3425 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - type bugs exposed during refactor)
**Impact on plan:** Both fixes were correctness requirements; no scope creep.

## Issues Encountered

None beyond the type fixes documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUTH-01 frontend complete: users can save profile changes via the live API
- SAFE-01 complete: delete project (TypeToConfirmDialog) and delete task (ConfirmDialog) both require explicit confirmation
- ConfirmDialog and TypeToConfirmDialog are reusable — Plan 02-07 can import ConfirmDialog for Remove Team Member confirmation
- Settings page ready for any future profile field additions

---

*Phase: 02-authentication-team-management*
*Completed: 2026-03-12*

## Self-Check: PASSED

- Frontend/components/ui/confirm-dialog.tsx: FOUND
- Frontend/app/settings/page.tsx: FOUND
- Frontend/services/auth-service.ts: FOUND
- Commit ebe3425: FOUND
- Commit 7dc375e: FOUND
