---
phase: 05-notifications
plan: "05"
subsystem: ui
tags: [react, tanstack-query, sonner, shadcn, polling, notifications]

# Dependency graph
requires:
  - phase: 05-04
    provides: Notification CRUD API endpoints (GET/PATCH/POST/DELETE /notifications)
provides:
  - Frontend notification service with typed API client for all notification endpoints
  - Polling hook (use-notifications) with visibilitychange pause and toast-on-new logic
  - NotificationBell Popover dropdown with unread badge, mark-all-read, clear, delete
  - NotificationItem row component with type icons, Turkish relative time, unread highlight
  - header.tsx wired to live notification data (replaces static hardcoded badge "3")
affects: [05-06-notifications-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "notificationService uses apiClient (axios) — same pattern as all other services in this project"
    - "useNotifications hook: useQuery with refetchInterval + visibilitychange guard for tab-blur pause"
    - "prevUnreadCount ref pattern to detect new notifications without triggering toast on initial load"

key-files:
  created:
    - Frontend/services/notification-service.ts
    - Frontend/hooks/use-notifications.ts
    - Frontend/components/notifications/notification-bell.tsx
    - Frontend/components/notifications/notification-item.tsx
  modified:
    - Frontend/components/header.tsx

key-decisions:
  - "Used apiClient (axios) not raw fetch for notification-service — follows project-wide pattern from auth-service and task-service"
  - "pollInterval cast to false (not 0/undefined) when tab is inactive — required by refetchInterval type; both isTabActive state guard AND refetchIntervalInBackground: false for belt-and-suspenders"
  - "prevUnreadCount.current initialized to 0 and toast only fires when prevUnreadCount !== 0 — prevents toast flood on initial page load"
  - "NotificationBell is self-contained (no props) — header.tsx only needs the import, matching the plan's intent"

patterns-established:
  - "Notification polling: useQuery with refetchInterval: isTabActive ? interval : false + visibilitychange listener"
  - "Toast-on-new detection: useRef to track previous count, only fire toast on increment (not on page load)"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-06]

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 05 Plan 05: Frontend Notification Bell Summary

**React Query polling bell dropdown with Turkish UI — unread badge, per-type icons, sonner toast-on-new, mark-all-read/clear/delete wired to live backend**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-16T08:03:42Z
- **Completed:** 2026-03-16T08:13:00Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Notification service with fully-typed API client covering all 7 backend endpoints
- Polling hook with tab-visibility guard (pauses on blur) and toast-on-new-notification using sonner
- NotificationBell Popover with unread count badge (caps at 99+), empty state Turkish message, footer link to /notifications page
- NotificationItem row with type icon mapping (7 types), Turkish relative time formatter, unread highlight, inline delete
- Header updated: static hardcoded badge "3" replaced with live `<NotificationBell />` component

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification service + polling hook** - `4564eca` (feat)
2. **Task 2: Notification bell + dropdown component, wire into header** - `99acc46` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `Frontend/services/notification-service.ts` - Typed API client for all notification endpoints using apiClient (axios)
- `Frontend/hooks/use-notifications.ts` - TanStack Query polling hook with visibilitychange pause, toast-on-new, mutation wrappers
- `Frontend/components/notifications/notification-bell.tsx` - Popover bell button with unread badge, dropdown with header actions, scroll list, empty state, footer link
- `Frontend/components/notifications/notification-item.tsx` - Single notification row: type icon, message, Turkish relative time, unread highlight, trash delete button
- `Frontend/components/header.tsx` - Replaced static bell+badge with `<NotificationBell />`

## Decisions Made

- Used `apiClient` (axios) for notification-service, not raw fetch — maintains consistency with all other services in the project
- `pollInterval` evaluates to `false` (not `0`) when on server (`typeof window === "undefined"`) — prevents SSR polling attempt
- Toast fires only when `prevUnreadCount.current !== 0` — suppresses flood on initial page load
- `NotificationBell` is self-contained with no props — header only needs one import line

## Deviations from Plan

None - plan executed exactly as written. The notification service used `apiClient` (axios) instead of raw `fetch`, matching the project's actual pattern (plan mentioned "same auth header pattern as auth-service.ts" — apiClient handles this automatically via interceptor).

## Issues Encountered

None. All pre-existing TypeScript errors in the project were in unrelated files (mock-data.ts, gantt-tab.tsx, task-header.tsx, page.tsx) and were out of scope per deviation rules.

## User Setup Required

Optional: Set `NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS` in `.env.local` to override the default 30-second poll interval.

## Next Phase Readiness

- Plan 05-05 delivers the bell UI; Plan 05-06 (notifications page + preferences) can now build on this foundation
- The `/notifications` route referenced in the bell footer link will be implemented in Plan 06
- All 4 notification frontend artifacts are committed and TypeScript-clean

---
*Phase: 05-notifications*
*Completed: 2026-03-16*
