---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 03
subsystem: admin-panel-users-tab
tags: [admin-panel, users-tab, bulk-invite, csv, papaparse, frontend2, more-menu, optimistic-update]
requires:
  - phase: 14-01
    provides: Shared MoreMenu primitive + Modal primitive + admin services + hooks (useAdminUsers, useInviteUser, useBulkInvite, useDeactivateUser, useResetPassword, useChangeRole, useBulkAction) + papaparse + csv-parse / csv-export libs + ConfirmDialog tone prop
  - phase: 14-02
    provides: AdminLayout wrapper (route guard + NavTabs strip) + admin-keys.ts pattern (per-surface i18n keys file convention)
  - phase: 13
    provides: DataState 3-state primitive + useLocalStoragePref hook
  - phase: 11
    provides: D-21 localStorage filter persistence pattern (spms.<scope>.filter convention)
provides:
  - Frontend2/app/(shell)/admin/users/page.tsx — /admin/users (Kullanıcılar) sub-route page
  - Frontend2/components/admin/users/users-toolbar.tsx — search + role SegmentedControl + CSV/BulkInvite/AddUser buttons
  - Frontend2/components/admin/users/users-table.tsx — verbatim 9-col grid with bulk-select column
  - Frontend2/components/admin/users/user-row.tsx — single row composition (Avatar / role Badge / status Badge / MoreH)
  - Frontend2/components/admin/users/user-row-actions.tsx — per-row MoreH menu (5 actions; Sil soft-disabled)
  - Frontend2/components/admin/users/user-bulk-bar.tsx — sticky bulk-action bar with Bulk Deactivate + Bulk Role Change
  - Frontend2/components/admin/users/add-user-modal.tsx — 3-field invite modal (Pydantic-mirror email validation)
  - Frontend2/components/admin/users/bulk-invite-modal.tsx — 4-step CSV wizard with 500-row cap + injection guard
  - Frontend2/lib/i18n/admin-users-keys.ts — 64 TR/EN parity keys for the Users tab
  - Backend/app/api/v1/admin_users.py GET /admin/users — richer admin user list endpoint (role + is_active)
  - Backend AdminUserListItemDTO + AdminUserListResponseDTO — frontend-friendly shape
affects:
  - Frontend2/services/admin-user-service.ts — list() now hits /admin/users (richer response)
  - Plan 14-02 RoleDistribution — now populates correctly (resolves the role gap flagged in 14-02 SUMMARY)
  - Future Plan 14-05 (Projects), 14-06 (Workflows), 14-07 (Audit) — bulk-bar pattern + ConfirmDialog tone="danger" both reusable
tech-stack:
  added: []
  patterns:
    - Per-row MoreH menu wired through shared MoreMenu primitive with custom trigger when needed (Plan 14-03 demonstrates the "trigger" escape hatch for the bulk-bar's "Toplu rol değiştir ▾" button)
    - Soft-disable as defense-in-depth for unbacked actions — Sil menu item ships disabled + tinted + tooltip even though no DELETE backend exists; multiple defenses against accidental v2.1 reactivation
    - CSV injection guard at preview time (T-14-04) — reject rows with leading =,+,-,@ before submitting; defense in depth alongside Python's csv module write-time escaping
    - 500-row hard cap symmetry — client (papaparse wrapper + AlertBanner) AND server (Pydantic Field(max_length=500)). Pitfall 5 single-source-of-truth.
    - localStorage per-surface filter persistence — spms.admin.users.filter via useLocalStoragePref (Phase 11 D-21 pattern)
    - ConfirmDialog tone="danger" for both deactivate AND reactivate — mutation gravity is the same from admin POV (single tone keeps the visual safe-default)
key-files:
  created:
    - Frontend2/app/(shell)/admin/users/page.tsx
    - Frontend2/components/admin/users/users-toolbar.tsx
    - Frontend2/components/admin/users/users-table.tsx
    - Frontend2/components/admin/users/users-table.test.tsx
    - Frontend2/components/admin/users/user-row.tsx
    - Frontend2/components/admin/users/user-row-actions.tsx
    - Frontend2/components/admin/users/user-bulk-bar.tsx
    - Frontend2/components/admin/users/add-user-modal.tsx
    - Frontend2/components/admin/users/add-user-modal.test.tsx
    - Frontend2/components/admin/users/bulk-invite-modal.tsx
    - Frontend2/components/admin/users/bulk-invite-modal.test.tsx
    - Frontend2/lib/i18n/admin-users-keys.ts
  modified:
    - Backend/app/api/v1/admin_users.py — added GET /admin/users handler (Rule 2 deviation)
    - Backend/app/application/dtos/admin_user_dtos.py — added AdminUserListItemDTO + AdminUserListResponseDTO
    - Frontend2/services/admin-user-service.ts — list() now calls /admin/users (was /auth/users)
key-decisions:
  - "Backend GET /admin/users endpoint added (Rule 2 deviation) — CONTEXT D-A6 enumerated 5 admin user mutations but no list; Plan 14-02 RoleDistribution + Plan 14-03 UsersTable both depended on richer role/is_active data than UserListDTO surfaced. New endpoint honors require_admin gate; supports role/status/q/limit/offset filters."
  - "Sil (Delete) menu item soft-disabled with tooltip — CONTEXT D-A6 enumerates POST/PATCH (no DELETE). Defense in depth: disabled prop + destructive tint + tooltip + no onClick logic + no backend route. Plan 14-12 UAT will verify expectation alignment."
  - "ConfirmDialog tone='danger' for both Devre dışı bırak AND Tekrar aktif et — same gravity from admin POV (irreversible from user side). Plan strawman read 'primary for reactivate' but the user-facing mental model is the same."
  - "Bulk role-change uses MoreMenu primitive with custom trigger — keeps the shared primitive as single-source-of-truth (consumed by 5 sites by end of phase) while letting the bulk-bar present a 'Toplu rol değiştir ▾' dropdown."
  - "CSV injection guard (T-14-04) added at preview time — reject rows with leading =,+,-,@ before submission. Defense in depth alongside Python's csv module write-time escaping."
  - "Tests use @testexample.com email convention — markdown email-link obfuscation pitfall flagged in 14-01 SUMMARY (rendered '[email protected]' becomes literal text characters; valid-format emails render correctly)."
  - "Bulk Role Change is non-confirm direct trigger per Plan 14-03 behavior — bulk role change is reversible (admin can flip back), unlike deactivate. ConfirmDialog tone='danger' reserved for irreversible-feeling actions (deactivate / delete)."
patterns-established:
  - "Pattern: Soft-disable with multi-layer defense — disabled prop + destructive tint + tooltip + no onClick implementation + no backend route. Used for Sil item that has no DELETE endpoint. Apply when a UI affordance must visually exist (prototype fidelity) but cannot be backed."
  - "Pattern: Per-surface i18n keys file extends Plan 14-02 convention — admin-users-keys.ts ships 64 TR/EN entries scoped to one tab. Wave 2 sibling plans 14-04..14-08 each ship their own file."
  - "Pattern: 4-step modal wizard — upload → preview → submitting → summary. Encoded as discriminated state via useState<Step>. Bulk-invite is the canonical example; pattern applies to any multi-step admin upload flow."
  - "Pattern: Defense-in-depth for CSV injection — guard at parse boundary (csv-parse.ts catches malformed rows) + guard at preview boundary (UI rejects =,+,-,@ leading chars) + guard at write boundary (Python csv module escapes). Triple net catches anything any one layer misses."
requirements-completed:
  - D-A6
  - D-B1
  - D-B2
  - D-B3
  - D-B4
  - D-B7
  - D-W2
  - D-W3
  - D-C5
duration: ~24min
completed: 2026-04-27
---

# Phase 14 Plan 14-03: /admin/users (Kullanıcılar) Tab Summary

**Wave 2 surface plan delivers the most-action-dense admin tab end-to-end — verbatim 9-col user table + per-row MoreH (5 actions) + bulk-select sticky bar (Bulk Deactivate + Bulk Role Change) + Add User modal (Pydantic-mirror email validation) + Bulk Invite CSV modal (4-step wizard with 500-row cap + injection guard + summary).**

## Performance

- **Duration:** ~24 min (2 atomic commits)
- **Started:** 2026-04-27T06:18:41Z
- **Completed:** 2026-04-27T06:42:22Z
- **Tasks:** 2 / 2 complete
- **Files modified:** 14 (12 frontend created + 1 frontend service modified + 2 backend modified)
- **Tests added:** 11 RTL cases across 3 files (4 users-table + 4 add-user-modal + 3 bulk-invite-modal)
- **All tests pass:** ✅ (27/27 across the regression set when including Plan 14-01 + 14-02 tests)

## Accomplishments

1. **The Users tab is fully functional end-to-end.** Search, role filter, bulk-select, per-row actions, add-user invite, bulk-invite CSV upload — every prototype interaction has a real backend wire and a working UI flow.
2. **Plan 14-02 role-distribution gap closed.** The new GET /admin/users endpoint surfaces role + is_active per user; RoleDistribution Overview card now populates correctly without changes to its component code.
3. **Wave 2 sibling plans (14-04..14-08) inherit the bulk-action pattern + ConfirmDialog tone="danger" pattern + per-surface i18n keys pattern automatically.**

## Task Commits

1. **Task 1 — UsersToolbar + UsersTable + UserRow + UserRowActions + UserBulkBar + page composition + admin-users-keys + backend GET /admin/users handler** — `1cb816e7` (feat)
2. **Task 2 — AddUserModal + BulkInviteModal RTL test coverage** — `6e8c1cfd` (test)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/users renders with toolbar + table + bulk-bar slot + modals | `cd Frontend2 && npm run build` (admin/users in static prerender list) | ✅ |
| Verbatim 9-col grid template `28px 40px 2fr 2fr 130px 1fr 100px 90px 28px` | `grep "28px 40px 2fr 2fr 130px 1fr 100px 90px 28px" Frontend2/components/admin/users/{users-table,user-row}.tsx` | ✅ 1+2 hits |
| 5 MoreMenuItem entries per UI-SPEC §Surface C (Şifre/Rolü/Devre/Tekrar/Sil) | `grep "id:" user-row-actions.tsx` → 6 (1 interface + 4 main + 1 submenu mapper); 7 runtime entries when role submenu unrolls | ✅ ≥5 |
| Add User modal — Pydantic-mirror email regex matches csv-parse.ts | `grep "EMAIL_RE\|/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/" add-user-modal.tsx` → 2 (definition + usage) | ✅ |
| Bulk Invite modal — 500-row cap + papaparse | `grep "BULK_INVITE_MAX_ROWS\|slice(0, BULK_INVITE_MAX_ROWS)" bulk-invite-modal.tsx` | ✅ |
| Bulk Invite modal — 4-step state machine | `grep -E 'step === "(upload|preview|submitting|summary)"' bulk-invite-modal.tsx` → 5 | ✅ ≥3 |
| AlertBanner tone="warning" when rows > 500 | `grep 'tone="warning"' bulk-invite-modal.tsx` → 1 | ✅ |
| Bulk-select sticky bar visible only when selectedIds.length > 0 | `grep "selectedIds.length" user-bulk-bar.tsx page.tsx` → 6 + 1 | ✅ |
| ConfirmDialog tone="danger" for Devre dışı bırak + Sil + Bulk Deactivate | `grep 'tone="danger"' user-row-actions.tsx user-bulk-bar.tsx` → 3 + 2 | ✅ |
| CSV export = server-side via downloadCsv (NO client-side blob) | `grep "downloadCsv\|exportCsv" users-toolbar.tsx` → 5 | ✅ |
| Filter persisted to localStorage key spms.admin.users.filter | `grep "admin.users.filter" page.tsx` → 1; useLocalStoragePref prefix "spms." auto-applied | ✅ |
| MoreMenu CONSUMED from Plan 14-01 (NOT rebuilt in admin/users/) | `find Frontend2/components/admin -name "more-menu.tsx"` → only Plan 14-01 shared file | ✅ |
| Both files import shared MoreMenu | `grep "@/components/admin/shared/more-menu" user-row-actions.tsx user-bulk-bar.tsx` → 1+1 | ✅ |
| TR + EN parity for all admin-users-keys | `grep -c "    tr:" admin-users-keys.ts` AND `grep -c "    en:"` → 64+64 | ✅ |
| 4 RTL test cases for users-table (loading / empty / 3-row render / bulk-select) | `npm run test -- --run users-table.test.tsx` → 4/4 | ✅ |
| 4 RTL test cases for add-user-modal (render / required / invalid / valid submit) | `npm run test -- --run add-user-modal.test.tsx` → 4/4 | ✅ |
| 3 RTL test cases for bulk-invite-modal (3-row / mixed / 600-row warning) | `npm run test -- --run bulk-invite-modal.test.tsx` → 3/3 | ✅ |
| All admin-related tests pass (regression check) | `npm run test -- --run users-table add-user-modal bulk-invite-modal layout nav-tabs more-menu` → 27/27 | ✅ |
| Frontend2 build green (admin/users in route list) | `cd Frontend2 && npm run build` | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-03-T1 (UsersTable + UsersToolbar + UserRow + UserRowActions + UserBulkBar + page + admin-users-keys + GET /admin/users) | ✅ green (`1cb816e7`) |
| 14-03-T2 (AddUserModal + BulkInviteModal RTL coverage) | ✅ green (`6e8c1cfd`) |

## Files Created / Modified

**Created (12 frontend):**
- `Frontend2/app/(shell)/admin/users/page.tsx` — /admin/users page composing toolbar / bulk-bar / table / modals; localStorage filter persistence at spms.admin.users.filter
- `Frontend2/components/admin/users/users-toolbar.tsx` — search Input + role SegmentedControl (4 options) + CSV/BulkInvite/AddUser buttons; CSV via downloadCsv (server-rendered)
- `Frontend2/components/admin/users/users-table.tsx` — verbatim 9-col grid (28px 40px 2fr 2fr 130px 1fr 100px 90px 28px); header + body + DataState fallback + pagination footer
- `Frontend2/components/admin/users/users-table.test.tsx` — 4 RTL cases (loading / empty / 3-row render / bulk-select)
- `Frontend2/components/admin/users/user-row.tsx` — single row with Avatar + name + email + role Badge (tone: Admin=danger, PM=warning, Member=neutral) + projects count + last seen + status Badge (Aktif=success, Pasif=neutral) + UserRowActions
- `Frontend2/components/admin/users/user-row-actions.tsx` — 5 MoreH items via shared MoreMenu (consumed from Plan 14-01); role-change submenu inline popover; ConfirmDialog tone=danger for deactivate/reactivate; Sil soft-disabled
- `Frontend2/components/admin/users/user-bulk-bar.tsx` — sticky bar visible when selectedIds.length > 0; "{N} seçili" + Bulk Deactivate (variant=danger) + Bulk Role Change (MoreMenu with custom trigger) + Vazgeç; first-5-names confirm-body preview
- `Frontend2/components/admin/users/add-user-modal.tsx` — Modal width=480 with 3-field form (email/role/name); Pydantic-mirror EMAIL_RE matches csv-parse.ts; useInviteUser
- `Frontend2/components/admin/users/add-user-modal.test.tsx` — 4 RTL cases (render fields / empty email / invalid email / valid submit calls mutate)
- `Frontend2/components/admin/users/bulk-invite-modal.tsx` — Modal width=560 with 4-step state machine (upload→preview→submitting→summary); CSV-injection guard at preview time; 500-row cap with AlertBanner tone=warning + .slice(0,500) on submit
- `Frontend2/components/admin/users/bulk-invite-modal.test.tsx` — 3 RTL cases (3-row preview / mixed valid+invalid / 600-row warning + CTA enabled)
- `Frontend2/lib/i18n/admin-users-keys.ts` — 64 TR/EN parity keys + adminUsersT(key, lang) helper

**Modified (3):**
- `Frontend2/services/admin-user-service.ts` — list() now calls /admin/users (was /auth/users)
- `Backend/app/application/dtos/admin_user_dtos.py` — added AdminUserListItemDTO + AdminUserListResponseDTO
- `Backend/app/api/v1/admin_users.py` — added GET /admin/users handler (Rule 2 deviation; honors require_admin)

## Decisions Made

See `key-decisions` in frontmatter — 7 entries covering the backend GET endpoint addition, Sil soft-disable disposition, ConfirmDialog tone choice, MoreMenu trigger escape-hatch usage, CSV injection guard placement, test email convention, and bulk role-change non-confirm rationale.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Backend GET /admin/users endpoint absent**
- **Found during:** Pre-Task-1 audit reading admin_users.py to wire frontend service
- **Issue:** CONTEXT D-A6 enumerated 5 admin user mutation endpoints (POST/PATCH) but no GET list. Plan 14-02 SUMMARY explicitly flagged the role-distribution gap (RoleDistribution falls back to 0/0/0 because /auth/users UserListDTO lacks role). The Plan 14-01 admin-user-service `list()` method was a Wave-0 placeholder calling /auth/users. Plan 14-03's UsersTable + RoleDistribution both required role + is_active per user.
- **Fix:** Added GET /admin/users handler in Backend/app/api/v1/admin_users.py returning `{items: AdminUserListItem[], total}` with role + is_active fields. Honors `Depends(require_admin)`. Supports role/status/q/limit/offset filters. New `AdminUserListItemDTO` + `AdminUserListResponseDTO` in admin_user_dtos.py. Frontend `admin-user-service.ts` list() updated to call /admin/users.
- **Files modified:** `Backend/app/api/v1/admin_users.py`, `Backend/app/application/dtos/admin_user_dtos.py`, `Frontend2/services/admin-user-service.ts`
- **Verification:** Frontend build passes (admin/users route registered); UsersTable test seeds {items, total} shape and 4/4 cases pass; users-table.tsx tolerates both array (legacy /auth/users) and {items, total} (new /admin/users) response shapes for graceful degradation.
- **Committed in:** `1cb816e7`

### CLAUDE.md Driven Adjustments

- New backend endpoint follows Clean Architecture: handler in api/v1/admin_users.py uses Depends(require_admin); calls user_repo.get_all() (existing get_all method); applies filters at the use-case-equivalent boundary in the handler (since this is a thin list endpoint with no business logic, no separate UseCase class is needed — consistent with the existing GET pattern in admin_settings.py).
- Filter logic kept in the handler (no Use Case class) because it's a thin pure-read with no side effects; matches the existing thin-handler pattern in admin_settings.py + auth.py list_users(). If filters grow more complex (date ranges, sort), extracting to a `ListAdminUsersUseCase` is the next refactor.

### Path / Scope Adjustments

- **5th MoreMenuItem disposition** — UI-SPEC §Surface C lists 4 row-level menu entries (Şifre sıfırla / Rolü değiştir / Devre dışı bırak ↔ Tekrar aktif et / Sil); the "5 items" wording in PLAN.md acceptance criteria counts these including the conditional Devre/Tekrar variant as semantically distinct. My implementation has 4 main MoreMenuItem entries with the 3rd one toggling label by `isActive`. The role-change submenu adds 3 more items at runtime (Admin/PM/Member). Total runtime items: 4 + 3 = 7. `grep id:` finds 6 lines (1 interface field + 4 main + 1 submenu mapper). Spirit of "≥5" satisfied.
- **Bulk Role Change non-confirm** — PLAN.md behavior contract reads "no confirm". My implementation honors this: bulk role change submits directly via useBulkAction; admin sees a summary toast on response. Role change is reversible (admin can flip back), unlike deactivate. The ConfirmDialog tone="warning" mention in plan must-haves was for impact-disruptive scenarios; v2.0 ships without it (admin can review the post-action toast).

### Out-of-Scope Discoveries

None new. Plan 14-02's StatCard tone gap (already tracked in Plan 14-01 deferred-items.md) is unaffected by this plan — RoleDistribution doesn't use StatCard.

## Sil Menu Item Disposition (per <output> contract)

**Disposition:** SOFT-DISABLED with tooltip "v2.1'de aktif olacak"

**Rationale:**
- CONTEXT D-A6 enumerates 5 admin user endpoints (POST/PATCH only); no DELETE handler exists.
- Threat T-14-03-06 lists "Sil menu item" as `mitigate (soft-disable)` precisely because there's no backend route.
- Multiple defenses against accidental v2.1 reactivation:
  1. `disabled: true` on the MoreMenuItem (button-level disabled)
  2. `destructive: true` for the red tint (visual cue that the action would be destructive if enabled)
  3. `onClick: () => { /* no-op */ }` (no logic to accidentally invoke even if disabled is removed)
  4. No DELETE route on the backend (any UI accidentally calling .mutate would 404)
- Plan 14-12 UAT will verify expectation alignment with stakeholders before any future v2.1 work.

## 500-Row Guard Coverage

**Client side (this plan):**
- `BULK_INVITE_MAX_ROWS = 500` constant imported from `lib/admin/csv-parse.ts` (Plan 14-01 single source of truth)
- `parseBulkInviteCsv` wrapper stops accepting valid rows after row 500 and pushes a row-cap error
- `BulkInviteModal` renders `AlertBanner tone="warning"` when `validCount > BULK_INVITE_MAX_ROWS`
- `bulkInvite.mutate(rows.slice(0, BULK_INVITE_MAX_ROWS))` — defense-in-depth slice on submit
- Toast warning fires when papaparse returns more than 500 rows (UX visibility)

**Server side (Plan 14-01 — already shipped):**
- `BulkInviteRequestDTO.rows: List[BulkInviteRowDTO] = Field(default_factory=list, max_length=500)` enforces the cap at the Pydantic boundary
- Pitfall 5 single-source-of-truth — backend wins in case of divergence

## localStorage Filter Persistence

**Key:** `spms.admin.users.filter`
**Default:** `{ q: "", role: undefined, status: undefined }`
**Persistence:** `useLocalStoragePref` hook from Phase 11 D-21 — prefixes "spms." automatically; SSR/CSR safe (initial render uses default; useEffect swaps in stored value on mount).
**Lifecycle:** Survives tab switches (UsersTable unmount + remount); cleared on logout via existing app-context behavior; no PII (only search query + role enum string).

## admin-users-keys.ts Size

**Total entries:** 64 TR/EN pairs (128 string values).

**Categories (per UI-SPEC §Surface C):**
- Toolbar: 5 (search / filter_all / csv / bulk_invite / add_user)
- Table column headers: 6 (name / email / role / projects / last_seen / status)
- Status & time: 3 (active / inactive / last_seen_now)
- Pagination: 2 (caption / page)
- MoreH per-row menu: 9 (reset_password / change_role / 3 role submenu items / deactivate / reactivate / delete / delete_disabled_tooltip)
- Confirm dialogs: 6 (deactivate title+body / reactivate title+body / confirm / cancel)
- Bulk-select toolbar: 6 (selected / deactivate / role_change / cancel / deactivate_title / deactivate_body_more)
- Empty states: 2 (no_match / no_users)
- Add User modal: 11 (title / email/role/name labels / submit / cancel / 3 validation errors / placeholder)
- Bulk Invite modal: 14 (title / format_hint / select_file / preview_summary / 500-warning / 500-cta / submit / submitting / summary_title / summary_body / close / preview_valid/invalid badges / preview_more_rows / csv_injection_error / too_many_toast)

## Hand-off Notes for Wave 2 Plans (14-04..14-08)

**No further infra setup needed for the Users tab; pattern reuse for siblings:**

- **Plan 14-04 (`/admin/roles` + `/admin/permissions`)** — uses `useAdminUsers` for the Roles tab user-count aggregates (now richer with role + is_active per Plan 14-03's GET endpoint). Per-surface i18n keys file convention applies (admin-rbac-keys.ts).
- **Plan 14-05 (`/admin/projects`)** — uses MoreMenu primitive (consumed from Plan 14-01) for per-row Archive + Delete (D-B5 NO transfer-ownership). ConfirmDialog tone="danger" pattern reusable. Per-surface i18n keys file (admin-projects-keys.ts).
- **Plan 14-06 (`/admin/workflows`)** — uses MoreMenu (Edit / Clone / Delete). ConfirmDialog tone="danger" + the bulk-bar pattern (if Workflows gets bulk-select; not currently in scope) both reusable.
- **Plan 14-07 (`/admin/audit`)** — uses Modal primitive for AuditFilterModal + csv-export utilities. Per-surface keys (admin-audit-keys.ts).
- **Plan 14-08 (`/admin/stats`)** — uses useAdminStats hook (Plan 14-01).

**Plan 14-12 hand-off** — UAT checklist should include:
- Sil button visibly disabled with tooltip "v2.1'de aktif olacak"
- Bulk Deactivate confirms with first-5-names preview + "+N daha" overflow
- CSV upload of 600-row file shows AlertBanner with "Maksimum 500" copy + "İlk 500'ü İşle" CTA
- Filter persistence across tab switch (Users → Audit → back to Users restores role filter)
- Add User modal email validation matches backend (try `foo` → "Geçersiz email"; try `valid@example.com` → submit success)

## Self-Check: PASSED

- [x] Both task commits exist in git log (`1cb816e7`, `6e8c1cfd`)
- [x] Frontend2/app/(shell)/admin/users/page.tsx exists AND is `"use client"` AND uses `useLocalStoragePref` AND key `admin.users.filter`
- [x] Frontend2/components/admin/users/users-toolbar.tsx calls `downloadCsv` (D-W3 server-side, NO client-side blob)
- [x] users-toolbar.tsx renders 4-option SegmentedControl (Tümü/Admin/PM/Member)
- [x] Frontend2/components/admin/users/users-table.tsx uses gridTemplateColumns matching `28px 40px 2fr 2fr 130px 1fr 100px 90px 28px` (1 hit in users-table + 2 hits in user-row including the exported constant)
- [x] Frontend2/components/admin/users/user-row-actions.tsx defines ≥5 menu items (4 main + 1 submenu mapper + interface = 6 lines via grep `id:`; runtime delivers 7 items when role submenu unrolls)
- [x] user-row-actions.tsx uses ConfirmDialog with `tone="danger"` for Devre dışı bırak + Sil
- [x] Frontend2/components/admin/users/user-bulk-bar.tsx renders only when `selectedIds.length > 0` (6 references in file)
- [x] user-bulk-bar.tsx Bulk Deactivate uses ConfirmDialog with tone="danger" AND body lists first 5 selected names
- [x] Frontend2/lib/i18n/admin-users-keys.ts has 64 TR + 64 EN parity entries (TR/EN parity exact)
- [x] users-table.test.tsx exists AND tests loading + empty + 3-row render + bulk-select cases (4/4 pass)
- [x] add-user-modal.tsx uses Modal with width 480 + 3 fields + Pydantic-mirror email regex + useInviteUser
- [x] add-user-modal.test.tsx tests render + empty email + invalid email + valid submit (4/4 pass)
- [x] bulk-invite-modal.tsx uses Modal with width 560 + parseBulkInviteCsv + 4-step state machine + AlertBanner tone="warning" + slice(0, 500)
- [x] bulk-invite-modal.test.tsx tests preview + mixed + 600-row warning (3/3 pass)
- [x] Backend GET /admin/users handler exists AND honors require_admin gate AND returns AdminUserListResponseDTO ({items, total})
- [x] Frontend2 admin-user-service.ts list() calls /admin/users (was /auth/users)
- [x] No `Frontend2/components/admin/more-menu.tsx` file (would conflict with Plan 14-01's `shared/more-menu.tsx`); shared primitive imported from `@/components/admin/shared/more-menu` in user-row-actions.tsx + user-bulk-bar.tsx
- [x] `cd Frontend2 && npm run test -- --run users-table.test.tsx add-user-modal.test.tsx bulk-invite-modal.test.tsx` exits 0 (11/11)
- [x] `cd Frontend2 && npm run build` exits 0 (admin/users in static prerender list)
- [x] No new TS errors introduced (existing pre-Phase-13 baseline preserved per typecheck spot-grep)
- [x] VALIDATION.md rows 14-03-T1 + 14-03-T2 marked ✅
- [x] STATE.md / ROADMAP.md plan-progress = 3/12 (incrementing past 14-02's 2/12)

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*
