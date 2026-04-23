---
status: resolved
phase: 11-task-features-board-enhancements
source: [11-VERIFICATION.md]
started: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:00:00Z
resolved: 2026-04-23T00:00:00Z
---

## Current Test

[approved by user after live browser walkthrough]

## Tests

### 1. Drag a backlog task onto a Board column for a Scrum/Waterfall/Custom project — confirm the row visually disappears from the backlog panel after drop
expected: Row leaves the backlog immediately after the optimistic PATCH settles (single drop = one invalidation round-trip). For Kanban this Just Works; for non-Kanban methodologies the current client-side PATCH only sends `{status}` and does NOT clear `cycle_id` / `phase_id` / `in_backlog`, so the row may reappear after the backlog query refetches.
result: passed

### 2. Create a task via Header Oluştur → fill Title + Project → submit — confirm success toast and the task appears on the target project Board immediately
expected: Toast "Görev oluşturuldu" fires, modal closes, Board refetches and shows the new card.
result: passed

### 3. Toggle the Backlog panel on a <1280px viewport and verify the auto-close + "Dar ekranda kısıtlı görünüm" hint
expected: Panel auto-closes when the viewport narrows below 1280px; a hint banner appears if the user force-opens at that size.
result: passed

### 4. Inline-edit a property in the Task Detail sidebar (e.g. Priority) and confirm optimistic UI + rollback on simulated network failure
expected: Value flips immediately on Enter, PATCH fires, rolls back on error via `useUpdateTask.onError`.
result: passed

### 5. Open the Task Detail page for a sub-task and confirm the ParentTaskLink breadcrumb appears ABOVE the title with a clickable chevron that navigates to the parent
expected: Breadcrumb: FolderIcon + project name + chevron + parent key + parent title → click navigates to `/projects/{id}/tasks/{parentId}`.
result: passed

### 6. Use the header search autocomplete (Cmd/Ctrl+K) — type 2+ chars and confirm Projects (up to 3) + Tasks (up to 7) + "Tümünü gör" footer appear, arrow keys navigate, Enter selects
expected: Debounced dropdown with both result groups rendered, keyboard shortcuts work, outside-click closes the dropdown.
result: passed

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Resolution Notes

- Board tab crash (`tasks.filter is not a function`) surfaced during live walkthrough; fixed in commit `89e5b58` (unwrap PaginatedResponse envelope in `task-service.getByProject` + drop the duplicate inline cache-poisoning query in `project-detail-shell.tsx` + add defensive `Array.isArray` guard in `board-tab.tsx` + 4 new regression tests in `services/task-service.test.ts`).
- After the fix the user re-tested the 6 items live and approved closure.

## Gaps
