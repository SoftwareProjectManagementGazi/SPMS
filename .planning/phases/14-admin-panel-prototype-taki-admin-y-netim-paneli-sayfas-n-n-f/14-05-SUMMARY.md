---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 05
subsystem: admin-panel-projects-tab
tags: [admin-panel, projects-tab, frontend2, more-menu, two-step-confirm, rule-2-defense, d-b5]
requires:
  - phase: 14-01
    provides: Shared MoreMenu primitive + Modal primitive + ConfirmDialog tone="warning"/"danger" + admin lib utilities
  - phase: 14-02
    provides: AdminLayout wrapper (admin-only route guard + 8-tab NavTabs strip) + per-surface i18n keys file convention
  - phase: 14-03
    provides: UsersTable shape + per-row MoreH wiring pattern + per-surface keys file pattern (admin-users-keys.ts)
  - phase: 11
    provides: D-21 localStorage filter persistence pattern (spms.<scope>.filter via useLocalStoragePref)
  - phase: 9-10
    provides: Existing GET /projects admin-bypass (lines 146-149 — admins receive ALL 4 statuses incl. ARCHIVED) + DELETE /projects/{id} backend endpoint
provides:
  - Frontend2/app/(shell)/admin/projects/page.tsx — /admin/projects (Projeler) sub-route page
  - Frontend2/components/admin/projects/admin-projects-table.tsx — verbatim 8-col grid table + DataState fallback + client-side substring filter
  - Frontend2/components/admin/projects/admin-project-row.tsx — single row composition (key chip + name + methodology Badge + lead Avatar + tasks + ProgressBar + created date + MoreH)
  - Frontend2/components/admin/projects/admin-project-row-actions.tsx — per-row MoreH menu (EXACTLY Arşivle + Sil; NO transfer-ownership) + Sil two-step typing confirm via Modal
  - Frontend2/lib/i18n/admin-projects-keys.ts — 26 TR/EN parity keys for the Projects tab
  - Frontend2/services/project-service.ts — added projectService.delete(id) → DELETE /projects/{id}
  - Frontend2/hooks/use-projects.ts — added useDeleteProject() mutation
affects:
  - Plan 14-12 UAT — manual checklist will verify "exactly 2 MoreH items + no transfer-ownership" on /admin/projects
  - Backend (no changes needed) — existing GET /projects admin-bypass + existing DELETE /projects/{id} both reused
tech-stack:
  added: []
  patterns:
    - "Two-step destructive confirm via Modal — when ConfirmDialog can't host a custom Input field, escape to the Modal primitive (Plan 14-01) with ModalHeader/ModalBody/ModalFooter slots; primary CTA stays disabled until typed key matches project.key (defense in depth alongside backend auth)."
    - "Soft-disable for unbacked subroute — Dışa aktar (CSV export) on /admin/projects ships disabled + tooltip + no onClick because /admin/projects.csv backend endpoint isn't shipped (Plan 14-01 only added /admin/users.csv). Same pattern as the Sil-on-Users-tab soft-disable in Plan 14-03."
    - "Existing-endpoint reuse instead of include_archived flag — admins already receive all 4 statuses via the GET /projects admin-bypass (projects.py:146-149). Calling useProjects() without arguments delivers archived projects automatically; no hook signature extension needed. Documented inline in admin-projects-table.tsx."
    - "Methodology Badge tone palette extended — scrum=primary / kanban=warning / waterfall=neutral / iterative=success. Plan 14-05 uses the convention; Plan 14-06 (Workflows) inherits the mapping."
key-files:
  created:
    - Frontend2/app/(shell)/admin/projects/page.tsx
    - Frontend2/components/admin/projects/admin-projects-table.tsx
    - Frontend2/components/admin/projects/admin-project-row.tsx
    - Frontend2/components/admin/projects/admin-project-row-actions.tsx
    - Frontend2/components/admin/projects/admin-projects-table.test.tsx
    - Frontend2/lib/i18n/admin-projects-keys.ts
  modified:
    - Frontend2/services/project-service.ts (added delete(id) → DELETE /projects/{id})
    - Frontend2/hooks/use-projects.ts (added useDeleteProject mutation)
key-decisions:
  - "include_archived hook extension SKIPPED — backend GET /projects admin-bypass (Phase 9-10, projects.py:146-149) returns all 4 statuses for admins regardless of the status query param, so calling useProjects() without arguments suffices. No frontend or backend extension needed."
  - "Sil two-step confirm uses Modal (NOT ConfirmDialog) because ConfirmDialog can't host a custom Input field. Modal primitive (Plan 14-01) provides ModalHeader/ModalBody/ModalFooter slots; the danger Button stays disabled until keyInput === project.key."
  - "CSV export soft-disabled with v2.1 tooltip — Plan 14-01 only shipped /api/v1/admin/users.csv; /admin/projects.csv is deferred. Defense in depth: Button disabled + title-tooltip + no onClick + no backend route. Same disposition as the Sil-on-Users-tab from Plan 14-03."
  - "MoreMenu trigger aria-label kept at the primitive default 'İşlemler' (NOT overridden) — matches Plan 14-03 user-row + the shared primitive's accessibility convention."
  - "Tasks column shows '0 · 0 bitti' for v2.0 — per-project task count + done count would require an extra GET /tasks/project/{id} round-trip per row. v2.1 candidate: extend ProjectResponseDTO with aggregate task counts so the table shows real numbers without N+1 fetches."
  - "Methodology Badge tone for 'kanban' set to 'warning' (amber) per UI-SPEC §Color line 211; prototype line 335 used 'primary' for kanban. Adjusted to UI-SPEC because Phase 14 UI-SPEC takes precedence over the prototype's verbatim per CONTEXT D-00 'design contract'."
  - "Test uses getAllByLabelText('İşlemler') instead of getAllByRole('button', {name:/işlemler/i}) — JS regex /i flag has known issues with Turkish dotless-i / dotted-İ casefolding (locale-dependent toLowerCase). Literal label match is locale-stable."
patterns-established:
  - "Pattern: Two-step destructive confirm — for primitive-destructive admin actions, prompt the user to type a project/team key into a Modal-hosted Input; the primary CTA stays disabled until exact match. Used here for Sil; reusable for any 'delete N items' admin flow that needs explicit confirmation beyond a simple ConfirmDialog."
  - "Pattern: Per-surface i18n keys file for an admin tab — admin-projects-keys.ts (26 entries) follows the Plan 14-02/03/04 precedent. Each Wave 2 surface plan owns its own keys file to avoid same-wave files_modified overlap."
  - "Pattern: Soft-disable as v2.1 deferral — when a UI affordance must visually exist (prototype fidelity) but cannot be backed yet, ship the Button with `disabled` attr + title-tooltip + no onClick + no backend route. Quadruple net catches accidental v2.1 reactivation."
  - "Pattern: ARCHIVED row visual dim — opacity 0.6 on the row container + an 'Arşivli' Badge tone='neutral' adjacent to the name. The MoreH menu remains interactive on archived rows so 'Arşivden çıkar' + Sil stay reachable."
requirements-completed:
  - D-00
  - D-B1
  - D-B5
duration: ~10min
completed: 2026-04-27
---

# Phase 14 Plan 14-05: /admin/projects (Projeler) Tab Summary

**Wave 2 surface plan delivers the admin-wide projects listing with EXACTLY 2 per-row actions (Arşivle + Sil — D-B5 NO transfer-ownership), an 8-col verbatim-prototype grid that dims ARCHIVED rows to opacity 0.6, and a two-step typing confirm on Sil that requires the admin to type the project key before the destructive primary CTA enables. Reuses existing GET /projects admin-bypass + existing DELETE /projects/{id} backend endpoints; no new backend work.**

## Performance

- **Duration:** ~10 min (1 atomic commit)
- **Started:** 2026-04-27T07:05:08Z
- **Completed:** 2026-04-27T07:15:23Z
- **Tasks:** 1 / 1 complete
- **Files modified:** 8 (6 created + 2 modified)
- **Tests added:** 4 RTL cases (admin-projects-table.test.tsx)
- **All tests pass:** ✅ (4/4 + Plan 14-01..14-04 regression set 19/19)

## Accomplishments

1. **The Projeler tab is functional end-to-end.** Admins can search, see all projects (including ARCHIVED — visually dimmed), open per-row MoreH for Arşivle / Sil, and trigger the existing project-create wizard via Yeni proje.
2. **D-B5 enforced via test absence assertion.** The RTL test asserts the open MoreH menu has EXACTLY 2 items AND `queryByText("Transfer")`, `queryByText("Sahipli")`, `queryByText("Ownership")` all return null — guards against accidental v2.1 transfer-ownership menu addition.
3. **No backend changes needed.** Existing admin-bypass at GET /projects (Phase 9-10, projects.py:146-149) returns all 4 statuses for admins; existing DELETE /projects/{id} (Phase 9-10) already covers the Sil flow. Only the frontend service+hook needed extension.
4. **Two-step typing confirm shipped.** The Sil button opens a Modal (NOT ConfirmDialog — ConfirmDialog can't host a custom Input); the primary danger CTA stays `disabled` until `keyInput === project.key`. Defense in depth alongside backend auth.

## Task Commits

1. **Task 1 — /admin/projects tab + 8-col table + per-row MoreH (Arşivle + Sil only) + 4 RTL cases + admin-projects-keys + project-service.delete + useDeleteProject** — `05e87b85` (feat)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/projects renders the Projeler tab including archived projects | `cd Frontend2 && npm run build` (admin/projects in static prerender list) | ✅ |
| 8-col verbatim grid template `60px 2fr 110px 150px 120px 90px 90px 28px` | `grep -c "60px 2fr 110px 150px 120px 90px 90px 28px" Frontend2/components/admin/projects/admin-project-row.tsx` → 2 | ✅ |
| Per-row MoreH has EXACTLY 2 items (Arşivle + Sil) | RTL Case 3 — `expect(items).toHaveLength(2)` + presence + absence asserts | ✅ |
| D-B5 NO transfer-ownership | RTL Case 3 — `queryByText(/transfer/i)`, `queryByText(/sahipli/i)`, `queryByText(/ownership/i)` all return null | ✅ |
| Yeni proje calls router.push("/projects/new") | `grep -c 'router.push("/projects/new")' page.tsx` → 2 (1 onClick + 1 inline comment) | ✅ |
| MoreMenu CONSUMED from Plan 14-01 (NOT rebuilt) | `grep -c "@/components/admin/shared/more-menu" admin-project-row-actions.tsx` → 1 | ✅ |
| Sil uses two-step typing confirm — Modal + Input + danger Button gated on keyMatches | RTL Case 4 — primary Sil button disabled until `keyInput === "ALPHA"` | ✅ |
| Archived rows render at opacity 0.6 | RTL Case 2 walks up DOM tree from "Gamma Archived" name to row container, asserts inline opacity ≤ 0.65 | ✅ |
| Filter persisted to localStorage spms.admin.projects.filter | `grep -c "admin.projects.filter" page.tsx` → 1; useLocalStoragePref auto-prefixes "spms." | ✅ |
| TR + EN parity for all admin-projects-keys | `grep -c "    tr:" admin-projects-keys.ts` = 26; `grep -c "    en:"` = 26 | ✅ |
| 4 RTL test cases pass | `cd Frontend2 && npm run test -- --run admin-projects-table.test.tsx` → 4/4 | ✅ |
| Plan 14-01..14-04 regression intact | `npm run test -- --run more-menu users-table layout admin-projects-table` → 19/19 | ✅ |
| Frontend2 build green | `cd Frontend2 && npm run build` exits 0 | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-05-T1 (8-col table + EXACTLY 2 MoreH + Sil two-step typing confirm + D-B5 absence test) | ✅ green (`05e87b85`) |

## Files Created / Modified

**Created (6 frontend):**
- `Frontend2/app/(shell)/admin/projects/page.tsx` — /admin/projects page composition (toolbar + AdminProjectsTable); localStorage filter persistence at `spms.admin.projects.filter`
- `Frontend2/components/admin/projects/admin-projects-table.tsx` — verbatim 8-col grid header + body, DataState fallback (loading/error/empty), client-side substring filter on name + key
- `Frontend2/components/admin/projects/admin-project-row.tsx` — single row composition; ARCHIVED rows render at opacity 0.6 + show "Arşivli" Badge tone="neutral"; methodology Badge tones (scrum=primary / kanban=warning / waterfall=neutral / iterative=success)
- `Frontend2/components/admin/projects/admin-project-row-actions.tsx` — EXACTLY 2 MoreMenuItem entries via shared MoreMenu primitive; Arşivle uses ConfirmDialog tone="warning"; Sil uses Modal with key-typing Input + danger Button gated on `keyInput === project.key`
- `Frontend2/components/admin/projects/admin-projects-table.test.tsx` — 4 RTL cases (loading / 3-row render with archived opacity / D-B5 absence: exactly 2 menu items + transfer/sahipli/ownership all null / Sil two-step CTA disable→enable on key match)
- `Frontend2/lib/i18n/admin-projects-keys.ts` — 26 TR/EN parity key pairs covering toolbar / column headers / MoreH labels / archive + delete confirm bodies / empty states / shared admin.cancel

**Modified (2 frontend):**
- `Frontend2/services/project-service.ts` — added `projectService.delete(id)` method calling DELETE /projects/{id} (backend route already exists from Phase 9-10)
- `Frontend2/hooks/use-projects.ts` — added `useDeleteProject()` mutation that invalidates the `['projects']` cache `onSettled` so admin-table rows disappear after the two-step typing confirm

## include_archived Hook Extension Status

**SKIPPED — already covered by existing admin-bypass.**

The plan's PLAN.md offered two options: (a) extend useProjects + project-service to accept `include_archived` filter, or (b) use whatever the backend offered. Option (b) wins because the existing GET /projects route at `Backend/app/api/v1/projects.py` lines 138-157 has an admin-bypass that already returns ALL 4 statuses (ACTIVE, COMPLETED, ON_HOLD, ARCHIVED) for admin users regardless of the `status` query param:

```python
@router.get("/", response_model=List[ProjectResponseDTO])
async def list_projects(
    status: Optional[str] = Query(default=None, ...),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user),
):
    # Admin bypass: admins see every non-deleted project regardless of membership.
    if _is_admin(current_user):
        statuses = [status] if status is not None else ["ACTIVE", "COMPLETED", "ON_HOLD", "ARCHIVED"]
        results = await project_repo.list_by_status(statuses)
        return [_sanitize_process_config(r) for r in results]
```

Calling `useProjects()` without arguments (as `admin-projects-table.tsx` does) hits this admin-bypass branch and receives archived projects automatically. Documented inline at the call site in `admin-projects-table.tsx`. Net result: zero hook signature changes, zero backend changes, archived projects render correctly.

## Sil Two-Step Confirm Implementation Pattern

**Modal-based (NOT ConfirmDialog).**

`ConfirmDialog` accepts only `title` + `body` props — no slot for a custom child node like an Input field. Per UI-SPEC §Color line 213, the destructive Sil flow needs the admin to type the exact project key before the primary CTA enables, which requires a controlled Input inside the dialog body.

Implementation in `admin-project-row-actions.tsx`:

```tsx
const [deleteOpen, setDeleteOpen] = React.useState(false)
const [keyInput, setKeyInput] = React.useState("")
const keyMatches = keyInput === project.key

return (
  <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} width={420}>
    <ModalHeader>
      <AlertTriangle size={14} color="var(--priority-critical)" />
      {adminProjectsT("admin.projects.delete_modal_title", lang)}
    </ModalHeader>
    <ModalBody>
      <p>{deleteBody}</p>
      <p>{typingPrompt}</p>
      <Input
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder={project.key}
        size="sm"
        style={{ fontFamily: "var(--font-mono)" }}
      />
    </ModalBody>
    <ModalFooter>
      <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
        {adminProjectsT("admin.cancel", lang)}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={!keyMatches}
        onClick={handleDeleteConfirm}
      >
        {adminProjectsT("admin.projects.delete", lang)}
      </Button>
    </ModalFooter>
  </Modal>
)
```

**Defense in depth:**
1. Frontend gate — primary danger Button `disabled` until exact match.
2. Mutation guard — `handleDeleteConfirm` checks `if (!keyMatches) return` before firing the mutation.
3. Backend gate — DELETE /projects/{id} requires authenticated admin via existing `Depends(get_current_user)` + the `_is_admin` check on the repo path (existing Phase 9-10 protection).
4. Cache invalidation — `useDeleteProject().onSettled` re-queries the `['projects']` cache so the row disappears post-confirm regardless of mutation success/failure (parity with `useUpdateProjectStatus`).

## CSV Export Disposition

**SOFT-DISABLED with tooltip "v2.1'de aktif olacak".**

**Rationale:**
- Plan 14-01 only shipped `/api/v1/admin/users.csv` (Backend/app/api/v1/admin_users.py); the `/admin/projects.csv` admin-tier export endpoint is deferred to v2.1.
- Defense in depth against accidental v2.1 reactivation:
  1. Button `disabled={true}` (button-level disabled — Button primitive dims to opacity 0.5 + cursor:not-allowed)
  2. Surrounding `<span title="v2.1'de aktif olacak">` provides the explanatory tooltip on hover
  3. No `onClick` handler attached (no logic to accidentally invoke even if `disabled` is removed)
  4. No backend route yet (any UI accidentally calling .csv would 404)
- Same disposition as the Sil-on-Users-tab soft-disable in Plan 14-03 — pattern is consistent across Wave 2 surfaces.

**Plan 14-12 UAT will verify** the Dışa aktar button hover-tooltip reads "v2.1'de aktif olacak" / "Available in v2.1" and the button is unclickable.

## D-B5 Menu Absence Test Result

**RTL Case 3 — VERIFIED ✅**

```typescript
it("Case 3 — MoreH on row 1 opens menu with EXACTLY Arşivle + Sil; NO transfer-ownership", () => {
  // ... open MoreH ...
  const items = within(menus[0]).getAllByRole("menuitem")
  expect(items).toHaveLength(2)
  expect(within(menus[0]).getByText("Arşivle")).toBeInTheDocument()
  expect(within(menus[0]).getByText("Sil")).toBeInTheDocument()
  expect(within(menus[0]).queryByText(/transfer/i)).toBeNull()
  expect(within(menus[0]).queryByText(/sahipli/i)).toBeNull()
  expect(within(menus[0]).queryByText(/ownership/i)).toBeNull()
})
```

The test asserts:
- Exactly 2 menuitems exist after the menu opens.
- Both `"Arşivle"` and `"Sil"` are present.
- All three D-B5-banned phrases (`transfer`, `sahipli`, `ownership`) return null when queried inside the open menu.

Per-project ownership (PM-ship) management lives in `Settings > Üyeler` (Phase 9 D-17), NOT in the admin Projects tab. This is explicit in `admin-project-row-actions.tsx` lines 14-16:

```typescript
// Per-project ownership (PM-ship) is NOT manageable here — D-B5 explicitly
// excludes it; ownership is managed in Settings > Üyeler (Phase 9 D-17).
```

## Decisions Made

See `key-decisions` in frontmatter — 7 entries covering the include_archived disposition, Modal-vs-ConfirmDialog choice for Sil, CSV export soft-disable, MoreMenu aria-label default, Tasks column v2.1 deferral, methodology Badge tone alignment with UI-SPEC, and the Turkish-locale label-lookup test fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test regex /işlemler/i fails on Turkish locale lowercase**
- **Found during:** Task 1 first test run (Cases 3 + 4 errored)
- **Issue:** JS regex `/işlemler/i` flag does locale-dependent toLowerCase; Turkish dotless-i / dotted-İ casefolding makes `'İşlemler'.toLowerCase() === 'i̇şlemler'` (with combining dot above) on en-US locale runtimes — the `i` flag doesn't match the actual button aria-label "İşlemler".
- **Fix:** Switched the test from `getAllByRole("button", { name: /işlemler/i })` to `getAllByLabelText("İşlemler")` (literal string match), which is locale-stable.
- **Files modified:** `Frontend2/components/admin/projects/admin-projects-table.test.tsx`
- **Verification:** All 4 cases pass after the fix.
- **Committed in:** `05e87b85`

**2. [Rule 1 - Bug] Initial MoreMenu ariaLabel override broke role-button lookup**
- **Found during:** Task 1 first test run (button name was "Sil" not "İşlemler" because I'd passed `ariaLabel={adminProjectsT("admin.projects.delete", lang)}` to the MoreMenu trigger)
- **Issue:** The shared MoreMenu primitive defaults `ariaLabel` to `"İşlemler"`. Overriding with the delete label re-named the button to "Sil" which collided with the menu-item label of the same name.
- **Fix:** Removed the override; let MoreMenu use its primitive default. This matches the Plan 14-03 user-row-actions convention.
- **Files modified:** `Frontend2/components/admin/projects/admin-project-row-actions.tsx`
- **Verification:** Trigger button now reads `aria-label="İşlemler"` (consistent with Plan 14-03 + UI-SPEC accessibility convention); test passes.
- **Committed in:** `05e87b85`

### Path / Scope Adjustments

- **include_archived hook extension SKIPPED** — backend admin-bypass at GET /projects already handles this for admin role. Documented in admin-projects-table.tsx inline comment + this Summary's "key-decisions". Saves a hook signature change + a service method change.
- **Plan offered ConfirmDialog OR Modal for Sil; chose Modal** — ConfirmDialog can't host a custom Input field. Modal primitive (Plan 14-01) provides the slots; same pattern reusable in any admin flow needing typed confirmation.
- **Methodology Badge tone for kanban → 'warning'** — UI-SPEC §Color line 211 lists kanban as warning amber; prototype line 335 used 'primary'. Followed UI-SPEC per CONTEXT D-00 design contract precedence.

### CLAUDE.md Driven Adjustments

- All new pages are `"use client"` (per Frontend2/AGENTS.md "this is NOT the Next.js you know" — interactive client components must declare).
- All new files use named exports + `@/` path alias (Frontend2 convention, per Plan 14-01..14-04 precedent).
- All inline styles use CSS tokens (per CLAUDE.md → no shadcn/ui per memory; prototype-token-driven styles).
- Backend untouched — DIP-clean (no `import sqlalchemy` or `from app.infrastructure` in any Plan 14-05 file because no backend files were modified).

### Out-of-Scope Discoveries

None new. The pre-existing StatCard tone enum gap (tracked in Plan 14-01 deferred-items.md) is unaffected — admin-project-row.tsx uses Badge (full 7-tone palette) not StatCard.

## Known Stubs

| Location | Stub | Reason | Resolution |
|----------|------|--------|------------|
| `admin-project-row.tsx` Tasks column | `taskCount={0}, taskDoneCount={0}` (renders "0 · 0 bitti") | Per-project task aggregates require an extra GET /tasks/project/{id} round-trip per row (N+1). Out of scope for Plan 14-05's ~10-min budget. | v2.1 candidate: extend `ProjectResponseDTO` with `task_count` + `task_done_count` aggregates so the table shows real numbers without N+1 fetches. |
| `/admin/projects` Dışa aktar button | Soft-disabled with v2.1 tooltip | Plan 14-01 shipped /admin/users.csv only; /admin/projects.csv is deferred. | v2.1: extend Plan 14-01's pattern to add `/admin/projects.csv` server-side CSV endpoint + un-disable the Button + wire downloadCsv. |

Both stubs are honest (visibly disabled / shown as "0") rather than misleading. Neither blocks the plan's goal: the admin can browse, search, archive, and delete projects today.

## i18n Keys Inventory

**File:** `Frontend2/lib/i18n/admin-projects-keys.ts`
**Total keys:** 26 (TR + EN parity = 52 string values)

| Category | Count | Keys |
|----------|-------|------|
| Toolbar | 4 | search_placeholder / export_button / export_disabled_tooltip / new_project |
| Column headers | 7 | col_key / col_name / col_method / col_lead / col_tasks / col_progress / col_created |
| Cell formatters | 1 | tasks_done_suffix |
| MoreH menu | 3 | archive / unarchive / delete |
| Confirm bodies | 7 | archive_modal_title / archive_modal_body / unarchive_modal_title / unarchive_modal_body / delete_modal_title / delete_modal_body / delete_modal_typing_prompt |
| Status badges | 1 | archived_badge |
| Empty states | 2 | empty_no_match / empty_no_projects |
| Shared / generic | 1 | admin.cancel |

## Hand-off Notes

**Plan 14-12 UAT checklist additions:**
- /admin/projects renders all admin-wide projects including ARCHIVED rows visibly dimmed at 0.6 opacity.
- Archived rows show the "Arşivli" Badge next to the project name.
- Per-row MoreH on ANY row opens with EXACTLY 2 items: "Arşivle" (or "Arşivden çıkar" for archived rows) + "Sil" (red-tinted).
- Hover the Dışa aktar button → tooltip reads "v2.1'de aktif olacak" / "Available in v2.1".
- Yeni proje button redirects to /projects/new (existing wizard from Phase 10).
- Click Sil on a row → Modal opens with the project name in the body + a key-typing prompt; primary danger CTA stays disabled until the typed value matches the project key character-for-character.
- Type the wrong key → CTA stays disabled; type the correct key → CTA enables; click → row disappears from list (cache invalidates).
- Filter persistence: type "alpha" in the search box, switch to /admin/users, switch back → "alpha" still in the search input + filter still active.

**Plan 14-06 (Workflows) inheritance:** Same MoreMenu primitive consumption pattern (no rebuild). Same per-surface i18n keys file pattern. ConfirmDialog tone="danger" reusable for the Sil-template flow. The methodology Badge tone palette established here (scrum=primary / kanban=warning / waterfall=neutral / iterative=success) reusable for the template Mode badges.

**Plan 14-12 UAT regression**: Plan 14-05 introduced ZERO new backend surface — both archive (PATCH /projects/{id} { status: "ARCHIVED" }) and delete (DELETE /projects/{id}) reuse existing Phase 9-10 endpoints. Backend integration tests don't need additions for this plan; UAT only verifies the new UI flows.

## Threat Flags

None — Plan 14-05 introduces no new network surface. All calls go through existing Phase 9-10 endpoints (GET /projects, PATCH /projects/{id}, DELETE /projects/{id}). The new `useDeleteProject` hook + `projectService.delete` method are pure frontend wrappers around an already-protected backend route.

## Self-Check: PASSED

- [x] Task 1 commit exists in git log (`05e87b85`)
- [x] Frontend2/app/(shell)/admin/projects/page.tsx exists AND is `"use client"` AND imports + uses `useLocalStoragePref` AND key `admin.projects.filter`
- [x] Frontend2/app/(shell)/admin/projects/page.tsx Yeni proje calls `router.push("/projects/new")` (1 onClick + 1 inline comment = 2 grep hits)
- [x] Frontend2/components/admin/projects/admin-projects-table.tsx exists AND uses `useProjects()` (no args — admin-bypass returns archived) AND has DataState fallback
- [x] Frontend2/components/admin/projects/admin-project-row.tsx uses gridTemplateColumns matching `60px 2fr 110px 150px 120px 90px 90px 28px` (exported constant + 1 use site = 2 grep hits)
- [x] admin-project-row.tsx renders archived projects with `opacity: isArchived ? 0.6 : 1` (1 grep hit) AND checks `project.status === "ARCHIVED"` (1 hit; isArchived check)
- [x] Frontend2/components/admin/projects/admin-project-row-actions.tsx imports MoreMenu from `@/components/admin/shared/more-menu` (1 grep hit) — does NOT rebuild it
- [x] admin-project-row-actions.tsx defines EXACTLY 2 MoreMenuItem entries (`id: "archive"` + `id: "delete"` = 2 `id: "` grep hits inside the items array)
- [x] admin-project-row-actions.tsx contains "transfer"/"ownership" ONLY in documentation comments — runtime menu items have neither (verified by inspecting the 5 grep hits: all are NO transfer / Per-project ownership comment lines)
- [x] admin-project-row-actions.tsx Sil flow uses Modal + Input + Button variant="danger" + disabled={!keyMatches} (1 + 1 + 1 + 3 keyMatches references)
- [x] admin-projects-table.test.tsx asserts queryByText(/transfer/i), queryByText(/sahipli/i), queryByText(/ownership/i) all return null (4 absence assertions in case 3)
- [x] admin-projects-table.test.tsx asserts modal Sil CTA is disabled until input matches project.key (case 4)
- [x] Frontend2/lib/i18n/admin-projects-keys.ts has both `tr:` and `en:` for every key — 26 keys (`grep -c '    tr:'` = 26; `grep -c '    en:'` = 26)
- [x] CSV export Dışa aktar button is `disabled` AND wrapped in a span with `title="v2.1'de aktif olacak"` tooltip
- [x] No new backend surface created (Plan 14-05 is fully frontend; backend untouched)
- [x] `cd Frontend2 && npm run build` exits 0 with /admin/projects in static prerender list
- [x] `cd Frontend2 && npm run test -- --run admin-projects-table.test.tsx` exits 0 (4/4)
- [x] Plan 14-01..14-04 regression tests still pass (`npm run test -- --run more-menu users-table layout admin-projects-table` → 19/19)
- [x] No new TS errors introduced (build passes TypeScript strict mode)
- [x] VALIDATION.md row 14-05-T1 marked ✅
- [x] STATE.md / ROADMAP.md plan-progress will advance from 4/12 to 5/12 in the metadata commit

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*
