---
phase: 10-shell-pages-project-features
plan: "05"
subsystem: frontend-projects
tags: [nextjs-page, projects-list, project-card, segmented-control, toast, confirm-dialog, tanstack-query, page-02, proj-02, proj-04, proj-05]

dependency_graph:
  requires:
    - 10-01 (apiClient, AuthProvider, useAuth)
    - 10-03 (projectService, useProjects, useUpdateProjectStatus, QueryClientProvider in shell layout)
    - 10-04 (shell layout pattern, AppShell)
  provides:
    - ToastProvider + useToast hook (Frontend2/components/toast/index.tsx)
    - ConfirmDialog component (Frontend2/components/projects/confirm-dialog.tsx)
    - ProjectCard with status strip, overflow menu, confirm integration (Frontend2/components/projects/project-card.tsx)
    - Projects list page with SegmentedControl filter + responsive 3-column grid (Frontend2/app/(shell)/projects/page.tsx)
    - .projects-grid responsive CSS in globals.css
  affects:
    - 10-06+ (any page needing toast can import useToast from @/components/toast)
    - 10-09 (AppShell wraps ToastProvider — global toast available everywhere in shell)

tech-stack:
  added: []
  patterns:
    - "ToastProvider: custom React context + useState stack, no library — D-07 Claude's Discretion resolution"
    - "Toast color-mix(in oklch, var(--token) 10%, var(--surface)) — same pattern as AlertBanner"
    - "ProjectCard status strip: 4px div height, border-radius top-only, STATUS_STRIP Record<string,string> map"
    - "Overflow menu: position absolute + click-outside useEffect pattern (same as SidebarUserMenu)"
    - "SegmentedControl options use id field (not value) — adapted from primitive contract"
    - "AvatarStackUser initials derived from managerName split+map (no raw name/avatar fields)"
    - ".projects-grid CSS class with @media breakpoints at 768px/1280px in globals.css"

key-files:
  created:
    - Frontend2/components/toast/index.tsx
    - Frontend2/components/projects/confirm-dialog.tsx
    - Frontend2/components/projects/project-card.tsx
  modified:
    - Frontend2/app/(shell)/projects/page.tsx (replaced stub with full PAGE-02 implementation)
    - Frontend2/app/(shell)/layout.tsx (added ToastProvider wrapping AppShell)
    - Frontend2/app/globals.css (appended .projects-grid responsive CSS)

key-decisions:
  - "SegmentedControl options use id not value — primitive SegmentedOption interface uses { id, label } not { value, label }; STATUS_SEGMENTS adapted accordingly"
  - "AvatarStack managerAvatars built from initials derived via split+slice+map — AvatarUser requires initials (not name/avatar raw strings); avColor hardcoded to 1 as placeholder"
  - "ToastProvider placed inside QueryClientProvider but outside AppShell — toast available to all shell pages including any future modal/overlay layers"
  - "ConfirmDialog uses backdrop onClick=onCancel + inner onClick=stopPropagation — keyboard bypass prevented per T-10-05-02 mitigation"
  - "ProjectCard opacity:0.6 for ARCHIVED applied via Card style prop — satisfies PROJ-04 D-23"
  - "CONFIRM_TITLE_TR covers all 4 status values including ACTIVE (for reactivate) — safe fallback for unknown statuses"

metrics:
  duration_seconds: 171
  duration_display: "~3 min"
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_modified: 6
  files_created: 3
---

# Phase 10 Plan 05: Projects List Page with Card Grid, Status Filter, Toast, and Confirm Dialog Summary

**Custom ToastProvider + ConfirmDialog + ProjectCard with status strip/overflow menu + Projects page with SegmentedControl filter and 3-column responsive grid — PAGE-02, PROJ-02, PROJ-04, PROJ-05 complete**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-21T19:26:29Z
- **Completed:** 2026-04-21T19:29:20Z
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

### Task 1 — ToastProvider + ConfirmDialog + ProjectCard components

- **Frontend2/components/toast/index.tsx**: Custom `ToastProvider` + `useToast` hook. No external library. Fixed bottom-right position (bottom:20, right:20), `color-mix(in oklch, var(--token) 10%, var(--surface))` backgrounds matching prototype AlertBanner pattern, 4s auto-dismiss for success/warning/info, 6s for error, manual close button (×), `column-reverse` flex so newest toast appears at bottom. Wired into shell layout inside `QueryClientProvider`.
- **Frontend2/components/projects/confirm-dialog.tsx**: `ConfirmDialog` with fixed overlay backdrop (blur 2px, 40% black), backdrop click cancels (onCancel), inner div stops propagation (T-10-05-02 spoofing mitigation). Turkish copy: "Onayla"/"İptal". Accepts `open`, `title`, `body`, `onConfirm`, `onCancel` props.
- **Frontend2/components/projects/project-card.tsx**: `ProjectCard` with full prototype spec:
  - 4px top status strip with `STATUS_STRIP` map (ACTIVE→primary, COMPLETED→status-done, ON_HOLD→status-review, ARCHIVED→fg-muted)
  - `opacity: isArchived ? 0.6 : 1` on Card (PROJ-04 / D-23)
  - `STATUS_BADGE_TONE` map driving Badge tone (success/info/warning/neutral)
  - 3-dot overflow menu (SVG MoreH icon, absolute positioned, click-outside dismiss via useEffect + mousedown)
  - `getMenuActions()` returns ACTIVE-specific actions (Tamamla/Askıya Al/Arşivle) or ARCHIVED single action (Aktif Et)
  - `CONFIRM_TITLE_TR` record with all status confirmation texts; `ConfirmDialog` opens on menu action click
  - `handleConfirm` calls `useUpdateProjectStatus` mutate, shows success/error toast via `useToast`
  - AvatarStack built from manager info with initials derived from `managerName.split(' ').map(w => w[0])` (AvatarUser requires `initials` field)
  - End date formatted via `toLocaleDateString` with TR/EN locale
- **Frontend2/app/(shell)/layout.tsx**: Added `ToastProvider` import + wrap around `AppShell` inside `QueryClientProvider`.

### Task 2 — Projects page with SegmentedControl filter + card grid (PAGE-02)

- **Frontend2/app/(shell)/projects/page.tsx**: Replaced 12-line stub with full implementation.
  - `STATUS_SEGMENTS` and `STATUS_SEGMENTS_EN` arrays use `{ id, label }` shape to match `SegmentedOption` interface (id is the filter value)
  - `useProjects(statusFilter || undefined)` — "Tümü"/empty string omits status param per D-24 (PROJ-05)
  - Client-side search Input filters on `p.name` and `p.key` (case-insensitive) layered on top of API results
  - Header: 24px bold title, project count subtitle, SegmentedControl + Input + "Yeni proje" Button (link to /projects/new)
  - Loading state: centered "Yükleniyor..." text
  - Empty state: SVG icon + "Henüz proje yok." text + "Yeni proje" CTA button
  - Grid: `<div className="projects-grid">` with `ProjectCard` per project
- **Frontend2/app/globals.css**: Appended `.projects-grid` CSS — `grid-template-columns: 1fr` base, `repeat(2, 1fr)` at 768px, `repeat(3, 1fr)` at 1280px. gap: 16px.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ToastProvider + ConfirmDialog + ProjectCard components | 4a6f919 | toast/index.tsx, confirm-dialog.tsx, project-card.tsx, (shell)/layout.tsx |
| 2 | Projects list page with SegmentedControl filter + responsive card grid | db8b788 | (shell)/projects/page.tsx, globals.css |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AvatarStackUser requires initials — plan used name/avatar raw fields**
- **Found during:** Task 1 (TypeScript error on first tsc run)
- **Issue:** Plan's ProjectCard template passed `{ id, name, avatar }` to AvatarStack, but `AvatarUser` interface requires `initials: string` (no `name` or `avatar` fields exist on the type)
- **Fix:** Derive initials from `project.managerName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')`; use `avColor: 1` as placeholder
- **Files modified:** Frontend2/components/projects/project-card.tsx
- **Commit:** 4a6f919

**2. [Rule 1 - Bug] SegmentedControl uses id not value in SegmentedOption**
- **Found during:** Task 2 (pre-emptive check of primitive contract before writing page)
- **Issue:** Plan's STATUS_SEGMENTS used `{ label, value }` shape, but `SegmentedOption` interface in segmented-control.tsx uses `{ id, label }`. The component compares `value === opt.id` internally.
- **Fix:** Changed STATUS_SEGMENTS entries to use `id` field instead of `value`. `statusFilter` state string is compared against `opt.id` by the primitive — semantics unchanged.
- **Files modified:** Frontend2/app/(shell)/projects/page.tsx
- **Commit:** db8b788

## Known Stubs

- **ProjectCard AvatarStack**: Only shows manager avatar (single entry derived from `project.managerName`). Full team member list not available on `Project` shape from project-service.ts (same limitation as PortfolioTable from Plan 04). Phase 11 project detail work will expand this when the backend returns member arrays.
- **ProjectCard task count**: Footer shows static "görev"/"tasks" label with no numeric count — `Project` shape carries no task count field. Phase 11 will wire real task counts from project detail endpoint.

## Threat Flags

None — no new network endpoints or auth paths introduced. Status change PATCH gated by ConfirmDialog (T-10-05-02 mitigated). 403 responses from `require_project_transition_authority` surface as error toasts via `onError` callback in `handleConfirm` (T-10-05-01 mitigated client-side).

## Self-Check: PASSED

Files exist:
- Frontend2/components/toast/index.tsx: FOUND
- Frontend2/components/projects/confirm-dialog.tsx: FOUND
- Frontend2/components/projects/project-card.tsx: FOUND
- Frontend2/app/(shell)/projects/page.tsx: FOUND (replaced stub)
- Frontend2/app/(shell)/layout.tsx: FOUND (modified — ToastProvider added)
- Frontend2/app/globals.css: FOUND (modified — .projects-grid appended)

Commits exist:
- 4a6f919: FOUND (Task 1)
- db8b788: FOUND (Task 2)

TypeScript: npx tsc --noEmit exits 0 (confirmed)
Build: npx next build exits 0 — 13/13 pages generated
