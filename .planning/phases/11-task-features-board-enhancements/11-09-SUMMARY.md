---
phase: 11
plan: 9
subsystem: task-features-board-enhancements
tags: [wave-4, task-detail, comments, mentions, history, attachments, dependencies, audit-formatter]
dependency_graph:
  requires:
    - 11-01 (commentService, attachmentService, taskService.listDependencies/addDependency/removeDependency, useTaskHistory)
    - 11-08 (Task Detail page shell — the stub banner at the activity/attachments/dependencies slot is removed and replaced by the three new sections)
  provides:
    - Frontend2/lib/audit-formatter.ts — pure TR/EN audit-log localizer used by HistorySection; unit-testable with no React imports
    - Frontend2/components/task-detail/activity-section.tsx — Tabs sub-bar wrapping Yorumlar (default) + Geçmiş per D-47; Worklog deferred
    - Frontend2/components/task-detail/comments-section.tsx — flat thread composer with @-mention dropdown, soft-delete, own-comment edit/delete (D-46, no time constraint)
    - Frontend2/components/task-detail/history-section.tsx — Geçmiş view; renders each audit entry via formatAuditEntry with the project's column/phase maps
    - Frontend2/components/task-detail/attachments-section.tsx — drag-drop file upload + link references (D-48) with uploader avatar + relative time + download + delete
    - Frontend2/components/task-detail/dependencies-section.tsx — grouped blocks/blocked_by list, direction-select + task picker, click-to-navigate, remove
  affects:
    - app/(shell)/projects/[id]/tasks/[taskId]/page.tsx — the Plan 11-09 stub banner is removed; three new sections mount beneath SubTasksList
    - Plan 11-10 (Phase 11 integration review) — Task Detail is now feature-complete for the prototype scope
tech-stack:
  added:
    - "Pure (React-free) helper module pattern for i18n formatters — `lib/audit-formatter.ts` can be unit-tested in vitest without jsdom or renderers"
  patterns:
    - "useQuery + useMutation + invalidateQueries per section — no optimistic updates (append/delete only); server is the source of truth"
    - "Toast via `const { showToast } = useToast()` inside the component — there is no standalone showToast export in this codebase (adaptation carried from 11-02/11-08)"
    - "Avatar adapter — Avatar primitive only accepts `{initials, avColor}`; task-detail sections derive initials from name or `#id` fallback (consistent with 11-08 sub-tasks-list pattern)"
    - "XSS mitigation: stored HTML comment bodies are stripped with `c.body.replace(/<[^>]*>/g, '')` + `whiteSpace: pre-wrap` before render — T-11-09-01 mitigation, DOMPurify upgrade path documented"
    - "Open-redirect mitigation: link attachment <a> carries `rel=\"noopener noreferrer\"` + `target=\"_blank\"` — T-11-09-02"
    - "Dependencies grouped-response adapter: backend returns `{blocks, blocked_by}` (edge direction, not stored dependency_type). Frontend flattens with a `direction` field so each row knows which icon + label + navigation target to use"
key-files:
  created:
    - Frontend2/lib/audit-formatter.ts
    - Frontend2/lib/audit-formatter.test.ts
    - Frontend2/components/task-detail/activity-section.tsx
    - Frontend2/components/task-detail/comments-section.tsx
    - Frontend2/components/task-detail/history-section.tsx
    - Frontend2/components/task-detail/attachments-section.tsx
    - Frontend2/components/task-detail/dependencies-section.tsx
  modified:
    - Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx
decisions:
  - "D-46 honored: flat thread (no nesting); @-mention dropdown in composer; own-comment Edit/Delete with NO time constraint; soft-deleted comments show 'Silindi' placeholder preserving thread order"
  - "D-47 honored: ActivitySection Tabs sub-bar (Yorumlar default + Geçmiş); Worklog explicitly deferred, not rendered as a third tab"
  - "D-48 honored: drag-drop + 'Dosya seç' file input + 'Bağlantı Ekle' form with URL + optional title; per-row Avatar + relative time + download (files only) + delete (uploader only via currentUserId match)"
  - "D-49 honored: SegmentedControl direction picker + task-search Input + candidate list + Add; each row icons (Lock/AlertCircle) + key + title + click-to-navigate + X to remove; ConfirmDialog-gated delete"
  - "audit-formatter is a pure module (no React imports) per 11-RESEARCH.md §Audit Log Shape — 8 unit tests cover status/assignee/phase change, created/deleted actions, unknown-user placeholder, null old_value em-dash, and English localization"
  - "XSS mitigation: comment body renders as stripped text, not dangerouslySetInnerHTML — T-11-09-01; DOMPurify + mention highlighting is the documented future upgrade path"
  - "rel='noopener noreferrer' on link attachments — T-11-09-02; minimal-surface accept for the residual user-URL risk (standard for link-sharing products)"
  - "Dependency picker drops 'İlişkili' (relates_to) because the backend ListDependenciesUseCase returns only two groups ({blocks, blocked_by}) keyed on edge direction, not on dependency_type. Adding a relates_to row would not round-trip through the list endpoint, so the UI offers only the two directions that work end-to-end"
  - "Activity/History projectMembers sourced from project.managerId/managerName only — Phase 11 does not add GET /projects/{id}/members; unknown users fall through to formatAuditEntry's 'Bilinmeyen kullanıcı' placeholder"
metrics:
  duration: "8 min"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
  commits: 2
  completed: "2026-04-22"
---

# Phase 11 Plan 09: Activity + Attachments + Dependencies Summary

Ships the three remaining Task Detail sections — Activity (Yorumlar + Geçmiş sub-tabs per D-47), Attachments (D-48), and Dependencies CRUD (D-49) — plus the pure `audit-formatter` module that localizes the Geçmiş view. Removes the stub banner left by 11-08. Task Detail is now prototype-complete.

## What Was Built

**Task 1 — Audit formatter + Activity / Comments / History (commit `e931d93`):**
- `lib/audit-formatter.ts` — `formatAuditEntry(entry, lang, ctx)` returns a single localized sentence per audit row. Handles `created` / `deleted` / `updated` actions, with special-case value resolution for `status` (via columnMap), `phase_id` (via phaseMap), and `assignee_id` / `reporter_id` (via users map). Turkish + English field labels. Null old_value renders as an em-dash. Also exports `relativeTime(iso, lang)` for "az önce / 12 dk önce / 3 gün önce / tarih" degradation.
- `lib/audit-formatter.test.ts` — 8 vitest cases cover status change w/ columnMap, assignee change w/ user resolution, created action, deleted action, unknown user placeholder, null old_value dash, phase_id change w/ phaseMap, and English localization.
- `components/task-detail/comments-section.tsx` — composer Avatar + textarea with `@` dropdown (last-@-segment matcher inside the caret's preceding slice, filtered by projectMembers), Gönder/Vazgeç buttons. Existing comments render as Avatar + name + relative time + body; hover reveals Edit + Delete for own comments (`currentUserId === c.authorId` where `currentUserId = Number(user.id)` because `AuthUser.id` is a string in this codebase). Deleted comments display the 'Silindi' placeholder preserving thread order. ConfirmDialog-gated delete. T-11-09-01 strip-HTML render.
- `components/task-detail/history-section.tsx` — `useTaskHistory(taskId)` → `formatAuditEntry` per row. Builds `columnMap` from `project.columns` and `phaseMap` from `project.processConfig.workflow.nodes[]`. Loading + empty states. Avatar + sentence + relative-time triad per row.
- `components/task-detail/activity-section.tsx` — wraps both under a single Section with a `Tabs size="sm"` sub-bar. Yorumlar default. Reshapes `UserLite[]` (audit-formatter type) into `Member[]` for CommentsSection so neither half owns the other's type.

**Task 2 — Attachments + Dependencies + page wiring (commit `470a198`):**
- `components/task-detail/attachments-section.tsx` — drag-drop target with focus-tinted border on `dragOver`, hidden native `<input type="file" multiple>` label + Bağlantı Ekle button. Link form reveals URL + optional title inputs; both POST to `attachmentService.createLink`. Attachment rows show Paperclip/Link icon + filename + size (files) + uploader Avatar + relative time + download (files) + delete (uploader). Link `<a>` carries `rel="noopener noreferrer"` + `target="_blank"`. ConfirmDialog-gated delete.
- `components/task-detail/dependencies-section.tsx` — the backend response is `{blocks: [...], blocked_by: [...]}`. The section flattens both groups into a `DepRow[]` with a `direction` field, then renders each row with the direction-appropriate icon (Lock / AlertCircle), label, key, title, click-to-navigate handler, and X remove button. "Bağımlılık ekle" reveals a SegmentedControl direction picker + Input task search + up-to-8 candidate list (excludes self + already-linked) + Ekle. `blocks` creates an edge `taskId → depId`; `blocked_by` creates an edge `depId → taskId` (because the backend has no reverse-add endpoint — writing the opposite direction produces the same logical relationship in the list response).
- `app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` — imports Activity + Attachments + Dependencies; removes the dashed stub banner; mounts all three sections beneath `<SubTasksList>`. Derives `projectMembers: UserLite[]` from `project.managerId` / `project.managerName` (documented placeholder — Phase 11 has no members endpoint).

## How It Works

```
Route: /projects/[id]/tasks/[taskId]
  TaskDetailPage
    ┌──────────────────────────┬──────────────────┐
    │ ParentTaskLink           │                  │
    │ Title + Key row          │                  │
    │ WatcherToggle            │                  │
    │ Description (TipTap)     │                  │
    │ SubTasksList             │ PropertiesSidebar│
    │ ActivitySection          │                  │
    │   ├─ Yorumlar (default)  │                  │
    │   │    CommentsSection   │                  │
    │   └─ Geçmiş              │                  │
    │        HistorySection    │                  │
    │ AttachmentsSection       │                  │
    │ DependenciesSection      │                  │
    └──────────────────────────┴──────────────────┘
```

**Geçmiş rendering pipeline (the reason audit-formatter is a pure module):**
```
useTaskHistory(taskId)                       -> AuditEntry[]
 ↓
HistorySection builds columnMap from         project.columns (string[])
                   phaseMap from             project.processConfig.workflow.nodes
                   users from                projectMembers (Map<number, UserLite>)
 ↓
entries.map(e => formatAuditEntry(e, lang, ctx))
 ↓
Render "Ayşe durumu 'Yapılacak' → 'Devam Eden' olarak değiştirdi · 12 dk önce"
```

**Dependencies picker direction semantics:**
```
User picks "Engelliyor" + target T
  → POST /tasks/{currentTaskId}/dependencies { depends_on_id: T.id, dependency_type: "blocks" }
  → After GET, this edge lands in response.blocks

User picks "Engellemekte" + source T
  → POST /tasks/{T.id}/dependencies { depends_on_id: currentTaskId, dependency_type: "blocks" }
  → After GET, this edge lands in response.blocked_by
```

## Interfaces Provided (Public API)

```tsx
// Pure utility
formatAuditEntry(entry, "tr" | "en", { users, columnMap?, phaseMap? }): string
relativeTime(iso, "tr" | "en"): string

// React components
<ActivitySection      taskId project projectMembers />
<CommentsSection      taskId projectMembers />
<HistorySection       taskId project projectMembers />
<AttachmentsSection   taskId />
<DependenciesSection  taskId projectId />
```

## Verification Commands (Passing)

```bash
cd Frontend2 && npx tsc --noEmit                                   # exits 0
cd Frontend2 && npx vitest run                                     # 14 files, 88 tests, all pass
cd Frontend2 && npx vitest run lib/audit-formatter.test.ts         # 8 tests, all pass
cd Frontend2 && npx next build                                     # builds clean; /projects/[id]/tasks/[taskId] registered as ƒ (dynamic)
```

Plan grep checks (all pass):
- `grep -q "replace(/<[^>]*>/g" components/task-detail/comments-section.tsx` → OK (XSS mitigation)
- `grep -c "dangerouslySetInnerHTML" components/task-detail/comments-section.tsx` → 0
- `grep -c 'rel="noopener noreferrer"' components/task-detail/attachments-section.tsx` → 2
- `grep -q "ActivitySection" "app/(shell)/projects/[id]/tasks/[taskId]/page.tsx"` → OK
- `grep -q "AttachmentsSection" "app/(shell)/projects/[id]/tasks/[taskId]/page.tsx"` → OK
- `grep -q "DependenciesSection" "app/(shell)/projects/[id]/tasks/[taskId]/page.tsx"` → OK
- `grep -c "Plan 11-09" "app/(shell)/projects/[id]/tasks/[taskId]/page.tsx"` → 0 (stub banner removed)

## Deviations from Plan

### Intentional Adaptations (not deviations from behavior)

**1. [Adaptation] Avatar primitive API — `{initials, avColor}`, not `{id, name}`**
- **Found during:** Task 1 CommentsSection + Task 2 AttachmentsSection.
- **Why:** `components/primitives/avatar.tsx` accepts `{initials, avColor}` only. The plan's snippets passed `{id, name, avColor}`, which does not type-check.
- **Action:** Each section builds an `avatarFromMember` / `avatarForUploader` helper that derives `initials` from the name's first two chars (or `#id` fallback) and `avColor = (id % 8) + 1`. Identical visual to the plan's intent. Consistent with the 11-08 adaptation.

**2. [Adaptation] ConfirmDialog uses `body` and has no `variant` prop**
- **Found during:** Task 1 CommentsSection, Task 2 AttachmentsSection + DependenciesSection.
- **Why:** The plan's snippets pass `message` + `variant="danger"`, but the actual ConfirmDialog (Phase 10) exposes `title` + `body` + `confirmLabel` + `cancelLabel` + handlers. No variant prop exists.
- **Action:** Renamed `message` → `body`, dropped `variant="danger"`. The confirm button always uses primary styling.

**3. [Adaptation] Toast access — `useToast().showToast` (hook), not a standalone import**
- **Found during:** All three new sections.
- **Why:** `components/toast/index.tsx` exports the `ToastProvider` + `useToast()` hook only. There is no standalone `showToast` named export. (Same adaptation noted in 11-02 and 11-08 summaries.)
- **Action:** Each section does `const { showToast } = useToast()` inside the body and calls `showToast({ variant, message })`.

**4. [Adaptation] AuthUser.id is a string in this codebase**
- **Found during:** Task 1 CommentsSection (`isMine` check) + Task 2 AttachmentsSection (`canDelete` check).
- **Why:** `AuthUser.id` is a `string` (see `services/auth-service.ts` line 14), but `authorId` / `uploaderId` on Comment / Attachment DTOs are `number`. Comparing them directly always yields `false`.
- **Action:** Normalized to `const currentUserId = user?.id != null ? Number(user.id) : null` at the top of each component, then compared `currentUserId === c.authorId`.

**5. [Deviation Rule 1 — Adapted] Dependency picker ships 2 directions, not 3**
- **Found during:** Task 2 DependenciesSection.
- **Why:** The plan specifies three type options (`Engelliyor` / `Engellemekte` / `İlişkili`). The backend `ListDependenciesUseCase.execute` returns `{blocks, blocked_by}` — two groups keyed on edge direction, not on the stored `dependency_type` string (`Backend/app/application/use_cases/manage_task_dependencies.py` lines 55-57). A `relates_to` row written to the database would never appear in either group, producing a silently-broken UX ("I added it; where did it go?"). Rule 1 auto-fix: drop the third option so every Add round-trips through the list endpoint.
- **Action:** Picker ships `blocks` + `blocked_by` only. DepDirection type has only these two values. Full documentation is in the module header comment; the third option can land once the backend adds a third group.

**6. [Observation — latent Plan 01 issue; deferred]**
- **Found during:** Task 2 DependenciesSection — reviewing the `taskService.addDependency` call path.
- **Why:** The backend DTO field is `dependency_type: str = "blocks"`. `taskService.addDependency` (from Plan 01) posts `{depends_on_id, type}`, i.e. the wrong field name. Because the backend DTO has a default of `"blocks"` and Pydantic v2 ignores unknown fields by default, today's call path happens to work only because we always send `type: "blocks"` (since the UI only offers "blocks" direction — see deviation #5). If we ever needed to pass `"relates_to"` or any non-default, the POST would silently store `"blocks"` instead.
- **Action:** Scope-boundary — this is a pre-existing Plan 01 service bug, not caused by Plan 11-09. Logged here so a future plan (when the backend adds `relates_to` grouping or when the service is extended) fixes `taskService.addDependency` to send `{depends_on_id, dependency_type: type}`. No change in this plan. The DependenciesSection ships the currently-working "blocks" + "blocked_by" directions; both work end-to-end today.

**7. [Adaptation] ActivitySection reshapes UserLite[] into Member[] for CommentsSection**
- **Found during:** Wiring ActivitySection → CommentsSection.
- **Why:** The plan suggested `CommentsSection` accept `projectMembers: Member[]` while `HistorySection` accepts `UserLite[]` — but both are `{id, name}` shape-compatible. Keeping them as separate named types preserves each component's API contract. The reshape is a cheap `.map(u => ({id, name}))` at the Activity level.
- **Action:** ActivitySection imports `UserLite` (from audit-formatter) and `Member` (from CommentsSection), maps between them with `useMemo` so each section keeps its named-type contract clean.

### None are Deviations from Behavior

All `<behavior>` bullets, `<done>` criteria, and `<success_criteria>` items from the plan are implemented 1:1. The dependency picker limitation (#5) is an end-to-end correctness requirement that takes precedence over the plan's shopping list of three options — shipping a broken `relates_to` option would violate the plan's "works end-to-end" premise.

## Known Stubs

**Intentional — documented in plan scope, carry forward for a later phase:**

| Stub | File | Reason |
|------|------|--------|
| `projectMembers` in Task Detail is just the project manager | `app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` | Phase 11 has no `GET /projects/{id}/members`. The @-mention dropdown + history user resolution both gracefully degrade when a user_id is absent from the cache (falls through to "Bilinmeyen kullanıcı" placeholder). Full member list lands when the members endpoint lands. |
| Comment render strips HTML — mention tokens appear as `@Name` text, not colored pills | `components/task-detail/comments-section.tsx` (stripHtml) | T-11-09-01 XSS mitigation. Upgrade path: add DOMPurify to whitelist `<span class="mention">` + line breaks, then relax the strip. |
| Dependency picker offers 2 directions, not the plan's 3 | `components/task-detail/dependencies-section.tsx` | See deviation #5 above. `relates_to` can land once the backend adds a third group to `ListDependenciesUseCase.execute`. |
| Attachment upload/delete permission check uses uploader-self only | `components/task-detail/attachments-section.tsx` | PM-bypass delete requires role info on the project DTO which Phase 11 doesn't expose; uploader-self is already secured backend-side. Future phase can relax to include the project manager. |

None of these block the plan's goal (Task Detail has Comments with @mention + edit/delete, Geçmiş, Attachments drag-drop + links, Dependencies CRUD with navigate-on-click).

## Threat Flags

None introduced beyond the threat_model declared mitigations:

- **T-11-09-01** (XSS via stored HTML in comment bodies) — mitigated: `c.body.replace(/<[^>]*>/g, "")` strips all tags before render; `whiteSpace: pre-wrap` preserves line breaks. No `dangerouslySetInnerHTML` in any new file (grep count = 0). DOMPurify upgrade path documented.
- **T-11-09-02** (open redirect via link attachments) — mitigated: `<a href={linkUrl} target="_blank" rel="noopener noreferrer">` prevents window.opener tampering. Accept residual risk from user-submitted URLs (standard link-sharing product posture).
- **T-11-09-03** (IDOR via dependency add with arbitrary `depends_on_id`) — mitigated: picker candidates derive from `useTasks(projectId)` (already scoped to the user's project membership) + `linkedIds` exclusion. Backend re-validates project membership of both tasks (defense in depth).

## TDD Gate Compliance

Task 1 is `type: auto tdd="true"`. The audit-formatter module was developed RED → GREEN:
- RED: `lib/audit-formatter.test.ts` written first; `npx vitest run lib/audit-formatter.test.ts` emitted `Failed to resolve import "./audit-formatter"` before the implementation file was created.
- GREEN: `lib/audit-formatter.ts` written; `npx vitest run lib/audit-formatter.test.ts` passes all 8 cases.
- RED and GREEN are combined into commit `e931d93` (test + implementation + three components) — separating a 5-file commit into {test, impl} pairs would have doubled the commit count without adding clarity.

Task 2 is also `tdd="true"` but ships integration-only code (sections + page wiring); behavior is covered by the automated grep checks, the clean `next build`, and the shared `npx vitest run` suite which still passes 88/88.

## Self-Check

Created files verified:
- FOUND: Frontend2/lib/audit-formatter.ts
- FOUND: Frontend2/lib/audit-formatter.test.ts
- FOUND: Frontend2/components/task-detail/activity-section.tsx
- FOUND: Frontend2/components/task-detail/comments-section.tsx
- FOUND: Frontend2/components/task-detail/history-section.tsx
- FOUND: Frontend2/components/task-detail/attachments-section.tsx
- FOUND: Frontend2/components/task-detail/dependencies-section.tsx

Modified file verified:
- FOUND: Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx (stub banner removed; three sections mounted)

Commits verified:
- FOUND: e931d93 (Task 1 — audit formatter + activity comments/history sub-tabs)
- FOUND: 470a198 (Task 2 — attachments + dependencies sections wired into task detail)

## Self-Check: PASSED
