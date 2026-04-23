---
status: partial
phase: 11-task-features-board-enhancements
source: [11-VERIFICATION.md]
started: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Drag a backlog task onto a Board column for a Scrum/Waterfall/Custom project — confirm the row visually disappears from the backlog panel after drop
expected: Row leaves the backlog immediately after the optimistic PATCH settles (single drop = one invalidation round-trip). For Kanban this Just Works; for non-Kanban methodologies the current client-side PATCH only sends `{status}` and does NOT clear `cycle_id` / `phase_id` / `in_backlog`, so the row may reappear after the backlog query refetches.
result: [pending]

### 2. Create a task via Header Oluştur → fill Title + Project → submit — confirm success toast and the task appears on the target project Board immediately
expected: Toast "Görev oluşturuldu" fires, modal closes, Board refetches and shows the new card.
result: [pending]

### 3. Toggle the Backlog panel on a <1280px viewport and verify the auto-close + "Dar ekranda kısıtlı görünüm" hint
expected: Panel auto-closes when the viewport narrows below 1280px; a hint banner appears if the user force-opens at that size.
result: [pending]

### 4. Inline-edit a property in the Task Detail sidebar (e.g. Priority) and confirm optimistic UI + rollback on simulated network failure
expected: Value flips immediately on Enter, PATCH fires, rolls back on error via `useUpdateTask.onError`.
result: [pending]

### 5. Open the Task Detail page for a sub-task and confirm the ParentTaskLink breadcrumb appears ABOVE the title with a clickable chevron that navigates to the parent
expected: Breadcrumb: FolderIcon + project name + chevron + parent key + parent title → click navigates to `/projects/{id}/tasks/{parentId}`.
result: [pending]

### 6. Use the header search autocomplete (Cmd/Ctrl+K) — type 2+ chars and confirm Projects (up to 3) + Tasks (up to 7) + "Tümünü gör" footer appear, arrow keys navigate, Enter selects
expected: Debounced dropdown with both result groups rendered, keyboard shortcuts work, outside-click closes the dropdown.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
