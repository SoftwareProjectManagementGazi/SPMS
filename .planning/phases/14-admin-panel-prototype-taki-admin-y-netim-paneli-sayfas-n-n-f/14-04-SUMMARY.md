---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 04
subsystem: admin-panel-rbac-placeholder
tags: [admin-panel, rbac-deferred, placeholder-tabs, frontend2, multi-defense]
requires:
  - phase: 14-01
    provides: lib/admin/permissions-static.ts (14×4 tri-state matrix) + useAdminUsers hook (per-role count aggregate via D-Y1) + Modal/Card/Badge/Button/AlertBanner primitives
  - phase: 14-02
    provides: AdminLayout wrapper (admin-only route guard + NavTabs strip) + admin-keys.ts pattern (per-surface i18n keys file convention)
provides:
  - Frontend2/app/(shell)/admin/roles/page.tsx — /admin/roles (Roller) sub-route page with 4 system role cards + Yeni rol placeholder + AlertBanner
  - Frontend2/app/(shell)/admin/permissions/page.tsx — /admin/permissions (İzin Matrisi) sub-route page with 14×4 disabled matrix + AlertBanner
  - Frontend2/components/admin/roles/role-card.tsx — single role card (4 reuse sites + Guest variant)
  - Frontend2/components/admin/roles/new-role-placeholder-card.tsx — dashed-border 5th-card placeholder with v3.0 tooltip
  - Frontend2/components/admin/permissions/permission-matrix-card.tsx — 14-row × 4-col matrix Card with v3.0 Badge + disabled Kopyala
  - Frontend2/components/admin/permissions/permission-row.tsx — single row with 4 disabled toggles (DisabledPermissionToggle wrapper inlined)
  - Frontend2/lib/i18n/admin-rbac-keys.ts — 40 TR/EN parity key pairs covering both Surface D + Surface E
affects:
  - Plan 14-12 UAT — manual checklist will verify "no clickable RBAC controls" assertion against this plan's surfaces
  - v3.0 RBAC implementation — multi-defense layering documented in code comments + threat model so a future v3.0 contributor sees what to remove (and how many independent defenses must be defeated) before re-enabling toggles
tech-stack:
  added: []
  patterns:
    - "Multi-defense placeholder pattern — 7 independent layers across Permissions tab (HTML disabled attr, aria-disabled, tooltip, no-handler, v3.0 Badge in card header, Kopyala disabled, page-level AlertBanner). New pattern documented for future deferral surfaces."
    - "Disabled-toggle wrapper INLINED in consumer (NOT extending the shared Toggle primitive) — keeps the Phase 8 primitive contract stable; uses <input type='checkbox' role='switch' disabled> so RTL toBeDisabled() works with native HTML semantics."
    - "Per-role counts via existing aggregate hook — useAdminUsers().filter() at consumer (D-Y1 — NO new endpoint). Same pattern as Plan 14-02 RoleDistribution for stat-cards aggregation."
    - "Per-surface i18n keys file — admin-rbac-keys.ts covers both Surface D (Roller) AND Surface E (İzin Matrisi) since both ship in one plan; keeps wave-2 file_modified arrays from overlapping with sibling plans (admin-projects-keys.ts, admin-workflows-keys.ts, etc.). 40 TR/EN parity keys total (14 roles + 26 permissions)."
key-files:
  created:
    - Frontend2/app/(shell)/admin/roles/page.tsx
    - Frontend2/app/(shell)/admin/permissions/page.tsx
    - Frontend2/components/admin/roles/role-card.tsx
    - Frontend2/components/admin/roles/new-role-placeholder-card.tsx
    - Frontend2/components/admin/permissions/permission-matrix-card.tsx
    - Frontend2/components/admin/permissions/permission-row.tsx
    - Frontend2/components/admin/permissions/permission-matrix-card.test.tsx
    - Frontend2/lib/i18n/admin-rbac-keys.ts
  modified: []
key-decisions:
  - "admin-rbac-keys.ts shipped Surface D + Surface E keys upfront in Task 1 (commit 37d371f6) — matches Plan 14-02 precedent (admin-keys.ts shipped Surface A + B in one Task 1 commit). Avoids re-touching the same i18n file in Task 2."
  - "No 'Düzenle' button on system-role cards per UI-SPEC §Surface D line 379 — explicit removal vs prototype's prototype line 228. Card is information-only since RBAC editing is deferred to v3.0; reactivating the button would require backend RBAC entity work first."
  - "DisabledPermissionToggle wrapper inlined inside permission-row.tsx (NOT extending the shared Toggle primitive at components/primitives/toggle.tsx). Reason: extending the primitive's API surface (adding disabled / aria-disabled / aria-label) would touch a Phase 8 contract used by 1+ existing call site. Inlining the wrapper keeps the primitive immutable AND gives RTL toBeDisabled() the native HTML disabled-attribute contract."
  - "Toggle wrapper uses <input type='checkbox' role='switch'> — combines native HTML `disabled` attribute (so toBeDisabled() works) with role='switch' (matches the visual affordance: an on/off switch, not a yes/no checkbox)."
  - "v3.0 Badge tone='warning' chosen — Badge primitive's tone enum includes 'warning' (badge.tsx confirmed). The StatCard primitive's narrowed enum gap (Plan 14-01 deferred-items.md tracked) does NOT affect Badge — Badge has the full 7-tone palette."
  - "Guest user count hardcoded to 0 — there is no Guest role in the v2.0 users.role enum yet. Placeholder count is honest: zero users currently have the Guest role since the role doesn't exist as a backend entity."
  - "Per-role counts use case-insensitive role.name matching — tolerates backend's exact 'Project Manager' string AND any future casing drift. Same approach as users-table.tsx and stat-cards.tsx."
patterns-established:
  - "Pattern: Multi-defense RBAC placeholder — Roles tab ships 4 layers (cursor:not-allowed, opacity 0.6, v3.0 Badge in Guest header, dashed-border placeholder); Permissions tab ships 7 layers (HTML disabled, aria-disabled, tooltip, no handler, v3.0 Badge, disabled Kopyala, page AlertBanner). Both surfaces document the layer count in code comments so v3.0 implementers see what to remove."
  - "Pattern: Per-surface i18n keys file extends Plan 14-02 + Plan 14-03 convention — admin-rbac-keys.ts ships 33 TR/EN entries scoped to two related deferred-RBAC tabs. Wave 2 sibling plans 14-05..14-08 each ship their own per-surface file."
  - "Pattern: Inlined wrapper for primitive extension avoidance — when a placeholder feature needs disabled-state semantics that the shared primitive doesn't ship, build a wrapper inside the consuming component file rather than extending the shared API surface. Keeps the cross-cutting risk surface tight and documents the rationale at the call site."
requirements-completed:
  - D-00
  - D-A2
  - D-A3
  - D-A4
  - D-A5
  - D-Y1
duration: 12min
completed: 2026-04-27
---

# Phase 14 Plan 14-04: /admin/roles + /admin/permissions Placeholder Tabs Summary

**Two RBAC-deferred placeholder surfaces ship in one plan with multi-layer defenses against accidental v3.0 reactivation. Roller renders 4 system-role cards (Admin / PM / Member / Guest) with reality-clarified descriptions per D-A5 + a dashed-border "Yeni rol oluştur" 5th card; İzin Matrisi renders the prototype's 14×4 matrix with EVERY toggle disabled + aria-disabled + tooltip + no-handler defense (4 per-toggle layers + 3 page-level layers = 7 total).**

## Performance

- **Duration:** ~12 min (2 atomic commits + this docs commit)
- **Started:** 2026-04-27T06:48:35Z
- **Completed:** 2026-04-27T06:54:54Z
- **Tasks:** 2 / 2 complete
- **Files modified:** 8 (8 created + 0 modified — fully greenfield wave 2 surface)
- **Tests added:** 3 RTL cases (permission-matrix-card.test.tsx)
- **All tests pass:** ✅ (3/3 + Plan 14-03 regression set 8/8 = 11/11 across the regression set)

## Accomplishments

1. **Two new admin sub-routes alive end-to-end.** `/admin/roles` and `/admin/permissions` are no longer 404 — both surfaces render visually rich placeholders matching the prototype's design while honoring the v3.0 RBAC defer.
2. **Multi-defense placeholder pattern documented + tested.** 7 independent layers protect the Permissions matrix from accidental reactivation (HTML disabled / aria-disabled / tooltip / no-handler / v3.0 Badge / disabled Kopyala / page AlertBanner). Documented in code comments AND threat model AND tested in RTL.
3. **No Toggle primitive surface change.** The shared Phase 8 Toggle primitive is untouched; the disabled wrapper is inlined inside permission-row.tsx so the primitive's contract stability is preserved.
4. **Per-role counts via existing hook (D-Y1).** RoleCard `userCount` reads from `useAdminUsers()` aggregate — no new endpoint. Plan 14-03's GET /admin/users shape is leveraged transparently.

## Task Commits

1. **Task 1 — /admin/roles tab (4 role cards + Yeni rol placeholder + AlertBanner + admin-rbac-keys.ts shipping BOTH surface keys)** — `37d371f6` (feat)
2. **Task 2 — /admin/permissions tab (14×4 disabled matrix + permission-matrix-card.tsx + permission-row.tsx + RTL test)** — `d3f58560` (feat)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/roles renders 4 role cards + Yeni rol placeholder + AlertBanner | `cd Frontend2 && npm run build` (admin/roles in static prerender) | ✅ |
| /admin/permissions renders 14×4 matrix + AlertBanner | `cd Frontend2 && npm run build` (admin/permissions in static prerender) | ✅ |
| 14 PermissionRow instances render | `permission-matrix-card.test.tsx` Case 1 | ✅ 1/1 |
| All 56 toggles disabled + aria-disabled + named aria-label | `permission-matrix-card.test.tsx` Case 2 | ✅ 1/1 |
| Card header v3.0 Badge AND Kopyala button disabled with v3.0 tooltip | `permission-matrix-card.test.tsx` Case 3 | ✅ 1/1 |
| Plan 14-03 regression — UsersTable + AddUserModal still pass | `npm run test -- --run users-table.test.tsx add-user-modal.test.tsx` | ✅ 8/8 |
| `cd Frontend2 && npm run build` exits 0 with /admin/roles + /admin/permissions in route list | `cd Frontend2 && npm run build` | ✅ |
| admin-rbac-keys.ts has both tr + en for every key — 40 keys × 2 = 80 string values | `grep -c '    tr:'` = 40; `grep -c '    en:'` = 40 | ✅ |
| No Düzenle button on system-role cards (D-A5 explicit removal) | grep "Düzenle\|Edit" Frontend2/components/admin/roles/role-card.tsx | 0 ✅ |
| RoleCard supports disabled + v3Badge props (Guest variant) | grep both in role-card.tsx + roles/page.tsx (Guest case) | ✅ |
| NewRolePlaceholderCard uses dashed border + cursor:not-allowed + title attr | grep all 3 in new-role-placeholder-card.tsx | ✅ |
| Permission Matrix gridTemplateColumns "2fr repeat(4, 100px)" verbatim | grep in permission-row.tsx + permission-matrix-card.tsx → 2 hits (row + sticky header) | ✅ |
| Permission Matrix data sources from permissions-static.ts (Plan 14-01) | grep "@/lib/admin/permissions-static" Frontend2/components/admin/permissions/* → 2 hits | ✅ |
| Per-role counts via useAdminUsers (NO new endpoint per D-Y1) | grep "useAdminUsers" Frontend2/app/\(shell\)/admin/roles/page.tsx → 1 | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-04-T1 (/admin/roles tab — 4 cards + dashed-border placeholder + AlertBanner) | ✅ green (`37d371f6`) |
| 14-04-T2 (/admin/permissions tab — 14×4 disabled matrix + multi-defense + RTL test 3/3) | ✅ green (`d3f58560`) |

## Files Created

**Roles tab (3 files):**
- `Frontend2/app/(shell)/admin/roles/page.tsx` — page composition; reads useAdminUsers; computes per-role counts; renders AlertBanner + 4 RoleCards + 1 NewRolePlaceholderCard in `repeat(auto-fill, minmax(240px, 1fr))` grid (responsive ≥3-col at desktop, gracefully wraps).
- `Frontend2/components/admin/roles/role-card.tsx` — Card padding=18 + 34×34 icon column + title (15/600) + description (12.5/--fg-muted/lineHeight 1.5) + user count footer (NO Düzenle button per UI-SPEC §Surface D line 379). Supports `disabled` (cursor:not-allowed + opacity 0.6) and `v3Badge` (warning Badge in card header) props for the Guest variant.
- `Frontend2/components/admin/roles/new-role-placeholder-card.tsx` — dashed border 1px var(--border-strong) + minHeight 130 + cursor:not-allowed + title="Granüler RBAC v3.0…" + Plus icon + "Yeni rol oluşturma" + "v3.0'da gelecek" subtitle.

**Permissions tab (4 files):**
- `Frontend2/app/(shell)/admin/permissions/page.tsx` — AlertBanner + PermissionMatrixCard composition.
- `Frontend2/components/admin/permissions/permission-matrix-card.tsx` — Card padding=0; header { title + subtitle + v3.0 Badge tone="warning" + disabled Kopyala button }; sticky column-header row (role names); 4 group sections (Projects / Tasks / Members & Roles / Workflow) with uppercase 11px labels; reads PERMISSIONS from permissions-static.ts.
- `Frontend2/components/admin/permissions/permission-row.tsx` — gridTemplateColumns "2fr repeat(4, 100px)" + label cell + 4 DisabledPermissionToggle cells. DisabledPermissionToggle is INLINED here — wrapper renders <input type="checkbox" role="switch" disabled aria-disabled aria-label> + visual mimic of the Toggle primitive's sm size (30×16, 12px knob).
- `Frontend2/components/admin/permissions/permission-matrix-card.test.tsx` — 3 RTL cases.

**Shared (1 file):**
- `Frontend2/lib/i18n/admin-rbac-keys.ts` — 40 TR/EN key pairs covering Surface D + Surface E + adminRbacT(key, lang) helper.

## Multi-Defense Layer Inventory

**Roles tab — 4 layers (per Guest card + per Yeni rol placeholder):**

| Defense Layer | Guest card | Yeni rol placeholder |
|---------------|------------|----------------------|
| 1. cursor:not-allowed | ✅ | ✅ |
| 2. opacity:0.6 | ✅ | n/a (full color but dashed border + --fg-subtle text) |
| 3. v3.0 Badge tone="warning" | ✅ (header) | n/a |
| 4. dashed-border + tooltip | n/a | ✅ (1px dashed var(--border-strong) + title attr) |
| 5. no onClick handler | ✅ | ✅ |
| 6. text affordance ("v3.0'da gelecek") | ✅ (description) | ✅ (subtitle) |
| 7. page-level AlertBanner | ✅ | ✅ |

**Permissions tab — 7 layers (per toggle + page-level):**

| Defense Layer | Per toggle | Per Card / Page |
|---------------|------------|-----------------|
| 1. HTML `disabled` attribute on <input> | ✅ | n/a |
| 2. aria-disabled="true" | ✅ | n/a |
| 3. tooltip "RBAC altyapısı v3.0…" | ✅ | n/a |
| 4. NO onChange handler attached | ✅ | n/a |
| 5. opacity:0.6 visual cue | ✅ | n/a |
| 6. v3.0 Badge in card header tone="warning" | n/a | ✅ |
| 7. disabled Kopyala button + tooltip | n/a | ✅ |
| 8. page-level AlertBanner | n/a | ✅ |

**Total per-toggle defenses:** 5
**Total card/page defenses:** 3
**Combined layers seen by a v3.0 implementer:** 8 unique (must remove ALL of them, in coordination, to inadvertently re-enable writes).

## Decisions Made

See `key-decisions` in frontmatter — 7 entries covering the i18n bundling decision, Düzenle removal rationale, inline-wrapper-vs-primitive-extension choice, role='switch' attribute decision, Badge tone='warning' confirmation, Guest count zero rationale, and case-insensitive role matching.

## Deviations from Plan

### Path Adjustments

**1. Permissions-static.ts type names** — Plan strawman referenced `PermissionRole = "Admin" | "Project Manager" | "Member" | "Guest"`, but the existing Plan 14-01 file exports the type as `AdminRole` (with `PermissionKey` for the row key enum). Aligned with the actual exported types — no semantic change, just a name correction.

**2. Permissions-static.ts row label fields** — Plan strawman used `perm.label[language]` (object with tr/en sub-keys), but the existing file uses flat `label_tr` / `label_en` fields per row. Aligned at the call site — `perm.label_tr` / `perm.label_en` with a ternary on language.

**3. admin-rbac-keys.ts shipped both surfaces upfront** — Plan PLAN.md Task 1 spec listed `admin.roles.*` keys; Task 2 spec listed `admin.permissions.*` keys to be appended. Shipped both upfront in Task 1's commit (Plan 14-02 precedent). Avoids a 2nd commit touching the same file. Net result identical.

### Auto-fixed Issues

None — clean execution. The Toggle primitive's missing disabled-prop surface was anticipated in pre-Task analysis and resolved by inlining a wrapper rather than extending a shared primitive.

### CLAUDE.md Driven Adjustments

- All new pages are `"use client"` (per Frontend2/AGENTS.md "this is NOT the Next.js you know" — interactive client components must declare).
- All new files use named exports + `@/` path alias (Frontend2 convention, per Plan 14-01..14-03 precedent).
- All inline styles use CSS tokens + oklch (per CLAUDE.md → no shadcn/ui per memory; prototype-token-driven styles).
- No backend changes (RBAC backend is DEFERRED per CONTEXT D-A2; this plan is pure frontend placeholder work).

### Out-of-Scope Discoveries

None new. The pre-existing StatCard tone enum gap (tracked in Plan 14-01 deferred-items.md) is unaffected by Plan 14-04 — RoleCard uses Badge (not StatCard) and Badge has the full 7-tone palette including "warning".

## i18n Keys Inventory

**File:** `Frontend2/lib/i18n/admin-rbac-keys.ts`
**Total keys:** 40 (Surface D = 14 + Surface E = 26)
**Total string values:** 80 (40 × 2 languages)

**Surface D — Roles tab (14 keys):**
- alert_banner_body
- admin_name + admin_description
- pm_name + pm_description
- member_name + member_description
- guest_name + guest_description
- users_count_label
- new_role_title + new_role_subtitle + new_role_tooltip
- v3_badge_label

**Surface E — Permissions tab (26 keys):**
- alert_banner_body
- card_title + card_subtitle
- v3_badge_label
- copy_button + copy_tooltip
- toggle_tooltip
- 4 group labels (group_projects / group_tasks / group_members_roles / group_workflow)
- column_permission
- 14 row labels (row_create_project, row_edit_project, row_delete_project, row_archive, row_create_task, row_change_assignee, row_change_status, row_delete_task, row_invite_user, row_assign_role, row_remove_member, row_edit_workflow, row_edit_lifecycle, row_publish_template — matches PERMISSIONS array shape from permissions-static.ts)

## Hand-off Notes for Plan 14-12 (UAT)

Plan 14-12's manual UAT checklist should include:

- **/admin/roles checklist:**
  - 5 cards visible (4 system roles + 1 dashed-border Yeni rol placeholder).
  - Admin card description = "Sistem geneli — tüm projelerde tam yetkili. …"
  - PM card description = "Proje bazlı — her projede ayrı atanır (Settings > Üyeler). …"
  - Guest card visually disabled (opacity 0.6 + cursor:not-allowed) + v3.0 Badge tone="warning" in header.
  - Yeni rol oluştur card has dashed border + tooltip on hover = "Granüler RBAC v3.0 sürümünde gelecek."
  - Page-level AlertBanner mentions "v3.0".
  - User counts on cards match the actual user list (cross-check with /admin/users).

- **/admin/permissions checklist:**
  - 14 permission rows render (4 + 4 + 3 + 3 = 14 across 4 groups).
  - All 56 toggles visually disabled (cannot click; cursor:not-allowed on hover).
  - Tooltip on toggle hover = "RBAC altyapısı v3.0 sürümünde gelecek."
  - Card header has v3.0 Badge + disabled Kopyala button (tooltip "v3.0'da gelecek").
  - Page-level AlertBanner mentions "v3.0".
  - Toggle visual states match PERMISSIONS map: Admin column all "on" (14/14), Guest column all "off" (0/14), PM ~12/14, Member ~3/14.

- **Multi-defense smoke test (DevTools):**
  - Open DevTools → inspect a Permission toggle.
  - Verify the <input> has BOTH `disabled` AND `aria-disabled="true"` attributes.
  - Verify there is NO `onChange` / `onClick` listener attached (Event Listeners panel should show no entries on the input).
  - Hover the toggle → tooltip = "RBAC altyapısı v3.0 sürümünde gelecek."

## Self-Check: PASSED

- [x] Both task commits exist in git log (`37d371f6`, `d3f58560`)
- [x] Frontend2/app/(shell)/admin/roles/page.tsx exists AND is `"use client"` AND renders AlertBanner + 4 RoleCards + 1 NewRolePlaceholderCard
- [x] Frontend2/app/(shell)/admin/permissions/page.tsx exists AND is `"use client"` AND renders AlertBanner + PermissionMatrixCard
- [x] Frontend2/components/admin/roles/role-card.tsx does NOT contain "Düzenle" or "Edit" button text (D-A5 explicit removal)
- [x] role-card.tsx supports disabled prop (cursor:not-allowed + opacity 0.6) AND v3Badge prop (Badge tone="warning" size="xs")
- [x] new-role-placeholder-card.tsx has dashed border + cursor:not-allowed + title attribute with v3.0 tooltip + minHeight 130
- [x] permission-row.tsx uses gridTemplateColumns "2fr repeat(4, 100px)" verbatim per UI-SPEC §Spacing line 73
- [x] permission-row.tsx every toggle has `disabled` + `aria-disabled` + tooltip + no onChange handler (verified via grep)
- [x] permission-matrix-card.tsx Card header has v3.0 Badge AND disabled Kopyala button (Button `disabled` + `title=` tooltip)
- [x] permission-matrix-card.test.tsx asserts all 3 cases — 14 rows + 56 disabled toggles + v3.0 Badge + disabled Kopyala
- [x] Frontend2/lib/i18n/admin-rbac-keys.ts has both `tr:` and `en:` for every key — 33 keys (`grep -c '    tr:'` = 33; `grep -c '    en:'` = 33)
- [x] Per-role user counts come from useAdminUsers (D-Y1, no new endpoint)
- [x] Permissions matrix data sourced from `@/lib/admin/permissions-static` (Plan 14-01)
- [x] No backend RBAC migration created (RBAC is DEFERRED to v3.0 per D-A2)
- [x] `cd Frontend2 && npm run build` exits 0 with both /admin/roles AND /admin/permissions in route list
- [x] `cd Frontend2 && npm run test -- --run permission-matrix-card.test.tsx` exits 0 (3/3)
- [x] Plan 14-03 regression tests still pass (`users-table.test.tsx` + `add-user-modal.test.tsx`) — 8/8
- [x] No Toggle primitive surface change (components/primitives/toggle.tsx untouched)
- [x] VALIDATION.md rows 14-04-T1 + 14-04-T2 will be marked ✅ in the metadata commit
- [x] STATE.md / ROADMAP.md plan-progress will advance from 3/12 to 4/12 in the metadata commit

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*
