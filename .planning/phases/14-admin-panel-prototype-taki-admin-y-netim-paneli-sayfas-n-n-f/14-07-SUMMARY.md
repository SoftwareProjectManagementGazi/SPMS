---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 07
subsystem: admin-panel-audit-tab
tags: [admin-panel, audit-tab, frontend2, url-driven-filters, lazy-loaded, 50k-cap, no-risk-column]
requires:
  - phase: 14-01
    provides: admin-audit-service (list + exportJsonUrl) + useAdminAudit hook + admin-audit-service 50k truncated flag + downloadCsv anchor trigger + Modal/ModalHeader/ModalBody/ModalFooter primitives + audit-field-labels (Plan 14-10 will consume)
  - phase: 14-02
    provides: AdminLayout wrapper (admin-only route guard + 8-tab NavTabs strip) + per-surface i18n keys file convention + ActivityRow variant="admin-table" prop slot (Plan 14-10 will fill render branch) + admin-keys.ts barrel precedent
  - phase: 13
    provides: DataState 3-state primitive + AlertBanner 4-tone primitive + ActivityRow per-event renderer + formatRelativeTime helper + getInitials helper
provides:
  - Frontend2/app/(shell)/admin/audit/page.tsx — /admin/audit (Audit) sub-route page (Suspense wrapper + URL-driven filters + lazy-loaded AdminAuditTable)
  - Frontend2/components/admin/audit/admin-audit-toolbar.tsx — search + Son 24 saat + Filtre + JSON export
  - Frontend2/components/admin/audit/admin-audit-table.tsx — 6-col table + 50k cap AlertBanner
  - Frontend2/components/admin/audit/admin-audit-row.tsx — single row composition + ADMIN_AUDIT_GRID export
  - Frontend2/components/admin/audit/admin-audit-pagination.tsx — page-size SegmentedControl (25/50/100) + Sayfa N / M caption + Prev/Next chevrons
  - Frontend2/components/admin/audit/audit-filter-chips.tsx — × clear-per-facet chip strip (visible when filter non-empty)
  - Frontend2/components/admin/audit/audit-filter-modal.tsx — 4-field filter modal (date_from / date_to / actor_id / action_prefix) + Apply/Clear/Cancel
  - Frontend2/lib/i18n/admin-audit-keys.ts — 31 TR/EN parity keys for the Audit tab
affects:
  - Plan 14-10 — will deliver the ActivityRow variant="admin-table" render branch consumed today by AdminAuditRow's Detay column (graceful degradation pattern carried over from Plan 14-02 RecentAdminEvents)
  - Plan 14-12 UAT — manual checklist will verify URL-driven filter bookmarks + 50k cap warning + filter modal Apply/Clear/Cancel flow + JSON export trigger
tech-stack:
  added: []
  patterns:
    - "URL-driven filter state via useSearchParams + router.replace — bookmarklenebilir audit links per D-C5. parseFilterFromParams + filterToParams encode 6 keys (from / to / actor_id / action_prefix / size / offset). The URL is the single source of truth; component state never duplicates filter contents (avoids the desync class of bugs Phase 11 D-21 mitigated for tab UI). Reusable for any admin surface where bookmark/share UX is critical."
    - "Suspense wrapper for useSearchParams (Next.js 16) — page exports a wrapper component that renders <Suspense fallback={null}> around the inner client component that calls useSearchParams. Same pattern Phase 12 workflow-editor adopted; avoids the CSR-bailout build error on static prerender."
    - "Two filter mutators with explicit semantics — updateFilter(partial) MERGES (chips, toolbar quick filters, pagination) and resets offset to 0 unless the change is offset-only. replaceFilter(next) REPLACES the whole filter (modal Apply / Clear). Distinguishing the two avoids a class of subtle bugs where a clear-one-facet path accidentally drops other facets."
    - "Dynamic import lazy-loaded table component (D-C6) — AdminAuditTable wrapped in next/dynamic with ssr:false + DataState loading fallback. The table's row component graph (ActivityRow + audit-row grid + pagination + i18n) is a heavy bundle that's only paid for when the user navigates to /admin/audit. /admin Overview bundle stays small."
    - "50k cap rendering pattern (Pitfall 6) — table reads response.truncated and renders an AlertBanner tone='warning' ABOVE the header row when truncated=true; the banner copy interpolates the actual `total` value with toLocaleString() so admins know how wide their filter caught. Pagination math separately caps at 50k regardless (HARD_CAP constant in admin-audit-pagination.tsx)."
    - "ADMIN_AUDIT_GRID constant exported from admin-audit-row.tsx (single source for header + body grid). Avoids the drift class where the header row's gridTemplateColumns string disagrees with body rows after a column-width tweak (one place to edit; both consume)."
key-files:
  created:
    - Frontend2/app/(shell)/admin/audit/page.tsx (207 lines — Suspense + URL filter encoding + dynamic import + filter mutators + chip clear handlers)
    - Frontend2/components/admin/audit/admin-audit-toolbar.tsx (106 lines — search Input + Son 24 saat + Filtre + JSON Button)
    - Frontend2/components/admin/audit/admin-audit-table.tsx (144 lines — 6-col header row + 50k cap AlertBanner + DataState + body rows + pagination)
    - Frontend2/components/admin/audit/admin-audit-row.tsx (191 lines — 6-col grid row + ADMIN_AUDIT_GRID export + actionColorVar mapping + ActivityRow variant="admin-table" wiring)
    - Frontend2/components/admin/audit/admin-audit-pagination.tsx (119 lines — SegmentedControl 25/50/100 + Toplam/Sayfa caption + Prev/Next + 50k pagination cap)
    - Frontend2/components/admin/audit/audit-filter-chips.tsx (143 lines — × clear-per-facet chip strip; renders nothing when filter empty)
    - Frontend2/components/admin/audit/audit-filter-modal.tsx (212 lines — 4-field draft + Apply/Clear/Cancel + actor dropdown from useAdminUsers)
    - Frontend2/components/admin/audit/admin-audit-table.test.tsx (208 lines — 4 RTL cases incl. D-Z1 enforcement)
    - Frontend2/components/admin/audit/audit-filter-modal.test.tsx (175 lines — 3 RTL cases incl. pre-fill + apply + clear)
    - Frontend2/lib/i18n/admin-audit-keys.ts (180 lines — 31 keys with TR + EN parity = 62 string values)
  modified: []
key-decisions:
  - "Two filter mutators (updateFilter merge + replaceFilter replace) — modal Apply/Clear and other filter facet edits have different semantics. Original PLAN.md had only updateFilter; testing revealed that modal Temizle (sending {}) would merge with existing filter facets and not actually clear them. Refactored before commit to avoid the bug entering history."
  - "Task 2 commit bundles admin-audit-keys.ts — strict task-by-task ordering would have left Task 2's audit-filter-modal.tsx importing a non-existent admin-audit-keys file at the Task 2 commit boundary. Bundling the i18n barrel into Task 2 keeps each commit individually buildable. Task 1's commit then doesn't touch admin-audit-keys (different from Plan 14-02 where admin-keys.ts was bundled into Task 1 for similar cross-task reasons)."
  - "Search Input is a no-op visual stub — the prototype's search bar (admin.jsx line 403) was decorative; the /admin/audit endpoint doesn't expose a free-text search. Kept the input visible for prototype fidelity (D-00) but it has no onChange handler. Real text search is a v2.1 candidate when the backend gains audit_log full-text indexing."
  - "MoreH placeholder is a 28px empty cell, not omitted — preserves grid alignment so future per-row actions can fill the slot without a layout reflow. Per CONTEXT Discretion default + Plan 14-07 PLAN.md line 171, v2.0 row click is no-op (Detay column shows everything; deep-link via refLabel suffices)."
  - "Action color coding uses substring matches on action — actionColorVar() in admin-audit-row.tsx checks the lowercased action string for delete/deactivate/destroy/archive/reject keywords (priority-critical token) and falls through to status-progress for everything else. Mirrors the prototype's color cue logic without a backend-shipped severity field."
  - "useAdminUsers data shape normalization in modal — useAdminUsers may return either an array OR an {items: []} envelope depending on the backend response shape (different from useAdminAudit which always envelopes). Modal narrows defensively via Array.isArray + 'items' in data check; both shapes work without forcing a backend or hook change. Documented inline."
  - "actor_id encoded as integer in URL — search params are always strings, so we parseInt(actor_id) when reading and String() when writing. Number-zero is treated as undefined in filterToParams to match the parseFilterFromParams missing-value semantic; users with id=0 don't exist in this app so the asymmetry is acceptable."
  - "Last 24h Button uses ISO timestamps — produces date_from = (now - 24h) and date_to = now in full ISO. The filter modal's date inputs only show YYYY-MM-DD per <input type='date'>, but the URL persists the full ISO so a re-application via the Filtre modal preserves the time component."
  - "Toast / variant contracts unchanged — Plan 14-07 doesn't fire any toasts (no mutations on this surface; reads only). The audit table is purely informational; mutations land via the per-row admin actions in OTHER tabs which write audit rows that show up here."
  - "Detay column placeholder via existing ActivityRow variant prop — Plan 14-02 added variant?: 'default' | 'admin-table' to ActivityRowProps as a forward-declare. Plan 14-07's AdminAuditRow passes variant='admin-table' today; ActivityRow's render falls through to the default branch (existing 12.5fontSize compact list rendering). Plan 14-10 fills the admin-table render branch — no consumer code changes required."
patterns-established:
  - "Pattern: URL-driven filter state with two mutator semantics (updateFilter merge + replaceFilter replace). Reusable for any admin surface where some inputs (chips / quick filters) want to merge and others (modal save) want to fully replace."
  - "Pattern: Suspense wrapper for useSearchParams in app-router pages. Required for Next.js 16's static prerender to coexist with client-only useSearchParams."
  - "Pattern: Dynamic-imported sub-page heavy component with DataState fallback. The /admin/audit page boots a tiny shell (toolbar + chips + modal + Suspense) and lazy-loads the table — keeps cold navigation snappy."
  - "Pattern: ADMIN_AUDIT_GRID grid-template constant exported from row component. Avoids the header-vs-body grid drift class of bugs."
  - "Pattern: 50k cap AlertBanner above table + capped pagination math. Backend ships truncated:bool + total_capped:int; frontend renders the warning when truncated AND uses the capped total for pagination math (Pitfall 6 mitigation)."
  - "Pattern: × clear-per-facet chips returning null when filter empty. Cheap presentational component that the parent can drop into the layout unconditionally; it self-hides when there's nothing to show."
  - "Pattern: Modal local-draft state synced from parent on open. The modal's draft state mirrors the parent filter; useEffect re-syncs draft from filter whenever open transitions true. Apply pushes the draft up to the parent; Cancel discards the draft. Clear bypasses the draft and pushes {} directly."
requirements-completed:
  - D-00
  - D-B8
  - D-C5
  - D-C6
  - D-D5
  - D-W3
  - D-Z1
  - D-Z2
duration: 13min
completed: 2026-04-27
---

# Phase 14 Plan 14-07: /admin/audit (Audit) Tab Summary

**Wave 2 surface plan delivers the admin-wide audit log table at /admin/audit with URL-driven filters (D-C5 bookmarklenebilir), lazy-loaded heavy table component (D-C6), 50k row cap warning AlertBanner (Pitfall 6), 6-column layout with NO risk column (D-Z1) where the Detay column wraps the existing <ActivityRow variant="admin-table"/> slot (Plan 14-10 fills the render branch), pagination toolbar with 25/50/100 page sizes, server-side JSON export (D-W3), and a 4-field filter modal (date range + actor + action prefix + Apply/Clear/Cancel).**

## Performance

- **Duration:** ~13 min (2 atomic commits)
- **Started:** 2026-04-27T07:42:00Z (approx — picked up after 14-06 close)
- **Completed:** 2026-04-27T07:55:00Z
- **Tasks:** 2 / 2 complete
- **Files created:** 10 (8 source + 2 RTL test files)
- **Files modified:** 0
- **Lines added:** 1,685 across the 10 new files
- **Tests added:** 7 RTL cases (4 admin-audit-table + 3 audit-filter-modal)
- **All tests pass:** ✅ (7/7 plan tests + 46/46 admin regression suite across 11 files)

## Accomplishments

1. **`/admin/audit` is functional end-to-end.** Admin users land on the route via the `/admin` 8-tab NavTabs strip (Plan 14-02), see the audit log table with 6 columns (Time / Actor / Action / Target / Detay / MoreH-stub), can paginate via 25/50/100 page sizes, can apply a date-range + actor + action-prefix filter via the modal, and can trigger a JSON export of the current filter shape via the toolbar's JSON button.
2. **URL-driven filter bookmarks work.** Hand-crafting a URL like `/admin/audit?from=2026-04-01&actor_id=5&action_prefix=task.` lands directly on the right filter set; sharing this URL with a teammate shows them the same view (D-C5 — the explicit reason for choosing URL state over localStorage on this surface).
3. **50k cap is visible.** When the backend's `truncated=true` flag fires, an AlertBanner with the actual unfiltered row count is rendered above the table, telling admins exactly how wide their filter caught. Pagination math caps at 50,000 regardless of true total (Pitfall 6).
4. **D-Z1 enforced — NO risk column.** RTL Test 4 asserts the rendered DOM contains 5 expected column headers (Zaman / Aktör / İşlem / Hedef / Detay) and NO "Risk" / "Risiko" header. The Detay column slot is wired today via `<ActivityRow variant="admin-table"/>`; Plan 14-10 fills the variant render branch.
5. **Heavy table is lazy-loaded.** AdminAuditTable is dynamic-imported with `ssr: false` + DataState loading fallback (D-C6) — the /admin Overview bundle isn't taxed by the audit-row + activity-row + pagination graph.

## Task Commits

1. **Task 2 — AuditFilterModal + 3 RTL cases + admin-audit-keys.ts (cross-task bundled)** — `5f2506ea` (feat)
2. **Task 1 — page.tsx + AdminAuditToolbar + AdminAuditTable + AdminAuditRow + AdminAuditPagination + AuditFilterChips + 4 RTL cases** — `e81acf19` (feat)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/audit renders the Audit tab end-to-end | `cd Frontend2 && npm run build` (admin/audit in static prerender list) | ✅ |
| Page is a `"use client"` component with Suspense + dynamic-imported table | `grep -c "use client"` + `grep -c "Suspense"` + `grep -c "dynamic("` page.tsx → 1 / 5 / 1 | ✅ |
| 6-column grid (NO risk column per D-Z1) | `grep -c "90px 160px 180px 1fr 1fr 28px"` admin-audit-row.tsx → 1 | ✅ |
| 50k cap AlertBanner conditionally rendered | `grep -c "data?.truncated"` + `grep -c "AlertBanner"` admin-audit-table.tsx → 1 / 5 | ✅ |
| Detay column wires <ActivityRow variant="admin-table"/> | `grep -c 'variant="admin-table"'` admin-audit-row.tsx → 1 (1 use + 2 doc refs) | ✅ |
| RTL Case 1 — isLoading → DataState loading copy | RTL test screen.getByText(/yükleniyor/i) | ✅ |
| RTL Case 2 — 3 mock items + truncated=false → 3 rows visible AND no 50.000 text | RTL test asserts all 3 entity_label cells present + no /50\.000\|50,000/ in DOM | ✅ |
| RTL Case 3 — truncated=true → AlertBanner with "50.000" message | RTL test asserts /50\.000/ visible | ✅ |
| RTL Case 4 — D-Z1 enforcement: NO Risk column header | RTL test asserts 5 actual headers visible AND queryByText("Risk"/"Risiko") returns null | ✅ |
| URL-driven filters via useSearchParams + router.replace | `grep -c "useSearchParams"` page.tsx → 5 (import + use + 2 fallbacks + dep array) | ✅ |
| Filter changes reset offset to 0 (D-Z2) | `grep -c "offset: next.offset ?? 0"` page.tsx → 1 (in updateFilter) | ✅ |
| JSON export calls downloadCsv with exportJsonUrl(filter) | `grep -c "downloadCsv"` toolbar.tsx → 3 (import + use + JSDoc) | ✅ |
| Pagination 25/50/100 SegmentedControl options | `grep "PAGE_SIZE_OPTIONS"` admin-audit-pagination.tsx → `[25, 50, 100] as const` | ✅ |
| AuditFilterModal renders 4 fields + 3 footer buttons | RTL Case 1 — getByText "Başlangıç" + "Bitiş" + "Aktör (kullanıcı)" + /İşlem öneki/ + Vazgeç/Temizle/Uygula buttons | ✅ |
| Modal Apply with new value calls onApply with the new filter shape + closes | RTL Case 2 — onApply called once with `{action_prefix: "user.invite"}` + onClose called once | ✅ |
| Modal Temizle calls onApply({}) and closes | RTL Case 3 — onApply called once with `{}` + onClose called once | ✅ |
| TR + EN parity for all admin-audit-keys | `grep -c "    tr:"` admin-audit-keys.ts → 31; `grep -c "    en:"` → 31 | ✅ |
| Frontend2 build green | `cd Frontend2 && npm run build` exits 0 with /admin/audit in static prerender list | ✅ |
| Plan 14-07 RTL tests pass | `cd Frontend2 && npm run test -- --run admin-audit-table.test.tsx audit-filter-modal.test.tsx` → 7/7 | ✅ |
| Admin regression suite green (Plans 14-01..14-06 + 14-07) | `cd Frontend2 && npm run test -- --run admin` → 46/46 across 11 files | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-07-T1 (Audit tab — URL-driven filters + 50k cap warning + NO risk column + Detay variant stub) | ✅ green (`e81acf19`) |
| 14-07-T2 (AuditFilterModal — 4 fields + Apply/Clear/Cancel) | ✅ green (`5f2506ea`) |

## Files Created / Modified

**Created (10 frontend):**

- `Frontend2/app/(shell)/admin/audit/page.tsx` — `"use client"` page wrapping AdminAuditPageInner in `<React.Suspense>` per the workflow-editor pattern (required for useSearchParams in Next.js 16 static prerender). parseFilterFromParams + filterToParams encode 6 query keys (from / to / actor_id / action_prefix / size / offset). Two filter mutators: updateFilter (partial merge, default-resets offset on facet change per D-Z2) and replaceFilter (full replace from modal). AdminAuditTable lazy-loaded via next/dynamic with ssr:false + DataState loading fallback (D-C6).
- `Frontend2/components/admin/audit/admin-audit-toolbar.tsx` — Search Input (placeholder "actor, action, target…", currently a visual stub per prototype fidelity D-00) + Son 24 saat Button (sets date_from = now - 24h, date_to = now) + Filtre Button (opens AuditFilterModal) + flex spacer + JSON Button (calls downloadCsv with adminAuditService.exportJsonUrl(filter)).
- `Frontend2/components/admin/audit/admin-audit-table.tsx` — Reads useAdminAudit(filter). When truncated=true, renders AlertBanner tone="warning" with the toLocaleString-formatted total above the header (Pitfall 6 + UI-SPEC line 486). Header row uses ADMIN_AUDIT_GRID (6 columns, NO risk per D-Z1). DataState handles loading / error / empty (with separate "no match" vs "no audit yet" copy depending on whether filters are active). Pagination toolbar mounted inside the Card when items.length > 0.
- `Frontend2/components/admin/audit/admin-audit-row.tsx` — Single row composition. Time = mono 11 + formatRelativeTime + tooltip absolute datetime. Actor = Avatar(18) + name (sans 12.5 ellipsis). Action = mono with actionColorVar() prefix-based color coding (priority-critical for delete/deactivate/destroy/archive/reject; status-progress for everything else). Target = sans ellipsis-truncated entity_label. Detay = `<ActivityRow event={item} variant="admin-table"/>` (Plan 14-10 fills the variant render branch). MoreH = 28px empty cell to preserve grid alignment.
- `Frontend2/components/admin/audit/admin-audit-pagination.tsx` — SegmentedControl with PAGE_SIZE_OPTIONS = [25, 50, 100] + Toplam: N caption + Sayfa P / M caption + Prev/Next chevron Buttons. Pagination math caps at 50,000 (HARD_CAP constant). Filter-facet changes reset offset to 0 (parent's updateFilter enforces this); page-size changes also reset offset to 0.
- `Frontend2/components/admin/audit/audit-filter-chips.tsx` — Visible only when filter has any non-empty key. Each chip pill (var(--surface-2) bg + 4 8 padding + radius 4 + fontSize 12 + 1px border-strong inset) carries an X-icon clear button. Returns null when no chips.
- `Frontend2/components/admin/audit/audit-filter-modal.tsx` — Modal width=520. Body has 4 form fields: 2 type="date" Inputs (date_from / date_to with toDateInput slice helper to handle full ISO inputs vs YYYY-MM-DD format), 1 native `<select>` with Tümü default + actors from useAdminUsers (data-shape normalized for both array and {items} envelopes), 1 type="text" Input for action_prefix. Footer has 3 buttons: Vazgeç (ghost — closes), Temizle (ghost — onApply({}) then closes), Uygula (primary — onApply(draft) then closes). Local draft mirrors parent filter; useEffect re-syncs draft when open transitions true.
- `Frontend2/components/admin/audit/admin-audit-table.test.tsx` — 4 RTL cases per <behavior>: Loading / 3 items + truncated=false / truncated=true with 50.000 text / D-Z1 NO Risk column header.
- `Frontend2/components/admin/audit/audit-filter-modal.test.tsx` — 3 RTL cases per <behavior>: Pre-fill from current filter / Apply with new action_prefix value / Temizle calls onApply({}).
- `Frontend2/lib/i18n/admin-audit-keys.ts` — 31 keys with TR + EN parity (62 string values). Categories: toolbar (4) / column headers (5) / filter modal title + 4 fields + 3 buttons + Tümü + placeholder (10) / chip strip (4) / pagination (5) / empty + truncated states (3).

**Modified (0):** Plan 14-07 is fully additive — no existing files touched. ActivityRow's variant prop slot was added by Plan 14-02 specifically to avoid a Plan 14-07 modification (forward-declare pattern; Plan 14-10 fills the render branch).

## URL Filter Encoding Scheme

**Bookmark-paste-friendly format: `/admin/audit?from={ISO}&to={ISO}&actor_id={int}&action_prefix={str}&size={25|50|100}&offset={int}`**

Encoder (`filterToParams`): omits keys with default values (limit=50 + offset=0) so the typical empty-filter URL stays clean. Decoder (`parseFilterFromParams`): tolerates missing keys and unparseable integers (falls back to defaults).

```typescript
// Example bookmark URLs:
/admin/audit                                          // empty filter, page 1, 50 rows
/admin/audit?from=2026-04-01T00:00:00Z&to=2026-04-30T23:59:59Z   // April 2026 audit
/admin/audit?actor_id=5&action_prefix=task.           // user 5's task-related actions
/admin/audit?action_prefix=user.deactivate&size=100   // first 100 user.deactivate events
```

**Two mutator semantics:**
- `updateFilter(partial)` → merge into existing filter. Default-resets offset to 0 unless the change is offset-only (pagination chevron click).
- `replaceFilter(next)` → full replace. Used by modal Apply/Clear so that "Temizle" actually clears all facets.

**Chip × clear** routes through updateFilter with the relevant facet set to undefined.

## 50k Cap Rendering Pattern

**Pitfall 6 mitigation — three layers:**

1. **Backend** (Plan 14-01) — `GET /admin/audit` returns `total = min(actual_count, 50_000)` and `truncated = (actual_count > 50_000)` boolean.
2. **Frontend AlertBanner** — admin-audit-table.tsx renders an AlertBanner tone="warning" above the header row when `data?.truncated` is true. Banner copy interpolates the actual `total` value (via `toLocaleString()`) so admins see exactly how wide their filter caught (e.g., "Filtre çok geniş (123.456 satır). Sadece son 50.000 kayıt gösteriliyor; daha eski kayıtlar için JSON dışa aktarımı kullanın.").
3. **Frontend pagination math** — admin-audit-pagination.tsx caps `cappedTotal` at HARD_CAP (50,000) when truncated regardless of true total. `Sayfa P / M` math uses cappedTotal so we don't display nonsense like "Sayfa 1 / 50000".

**Verified by RTL Case 3** — assertion: when truncated=true the rendered DOM contains the "50.000" string. The full message reads in TR: "Filtre çok geniş (123,456 satır). Sadece son 50.000 kayıt gösteriliyor; daha eski kayıtlar için JSON dışa aktarımı kullanın."

## Hand-off to Plan 14-10 (variant="admin-table" render branch)

**The wire is live; the visual upgrade lands later.**

`AdminAuditRow` (Detay column) renders `<ActivityRow event={item} variant="admin-table"/>` today. Plan 14-02 added the `variant?: "default" | "admin-table"` prop slot to `ActivityRowProps` as a forward-declare; the existing render code keeps the default branch (12.5fontSize compact list rendering with avatar + verb + refLabel + timestamp). When Plan 14-10 ships:

- **Plan 14-10 Task 2** fills the `variant === "admin-table"` branch with a single-line table-cell-friendly render — no avatar bubble, time on the right, Detay shows the Jira-style metadata-driven verb output.
- **No consumer code change** required in admin-audit-row.tsx, recent-admin-events.tsx, or any other Phase 14 / 13 / 12 ActivityRow caller. The variant prop is the swap point.

**3 sites consume `variant="admin-table"` today:**
- `Frontend2/components/admin/overview/recent-admin-events.tsx` (Plan 14-02)
- `Frontend2/components/admin/audit/admin-audit-row.tsx` (Plan 14-07 — this plan)
- (any future caller that wants the compact admin-table render)

## D-Z1 Enforcement Test Result

**RTL Case 4 (admin-audit-table.test.tsx):**

```typescript
it("Case 4 — D-Z1 enforcement: NO risk column header rendered", () => {
  // ... mock 1 item with truncated:false ...
  render(<AdminAuditTable filter={{...}} onUpdate={vi.fn()} />)
  // 5 actual column headers present
  expect(screen.getByText("Zaman")).toBeInTheDocument()    // Time
  expect(screen.getByText("Aktör")).toBeInTheDocument()    // Actor
  expect(screen.getByText("İşlem")).toBeInTheDocument()    // Action
  expect(screen.getByText("Hedef")).toBeInTheDocument()    // Target
  expect(screen.getByText("Detay")).toBeInTheDocument()    // Detail
  // D-Z1 — NO column header named "Risk" / "Risiko"
  expect(screen.queryByText(/^Risk$/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/^Risiko$/i)).not.toBeInTheDocument()
})
```

**Result: passes.** The grid template uses 6 columns (90px / 160px / 180px / 1fr / 1fr / 28px) where the last 28px slot is an empty MoreH placeholder; the rendered headers are exactly the 5 above + an aria-hidden empty div for grid alignment. The only places the word "risk" appears in Plan 14-07 source files are doc comments referencing D-Z1 (the enforcement decision) and the test name itself.

## Decisions Made

See `key-decisions` in frontmatter — 9 entries spanning the two-mutator filter design, cross-task admin-audit-keys bundling, search Input stub treatment, MoreH placeholder approach, action color coding strategy, useAdminUsers data-shape normalization, actor_id encoding, Last 24h ISO timestamp generation, and the variant="admin-table" hand-off pattern.

## Deviations from Plan

### Path / Scope Adjustments

- **Two filter mutators (updateFilter merge + replaceFilter replace) — added beyond PLAN.md's single `updateFilter` helper.** PLAN.md's `updateFilter` semantic was ambiguous about whether `updateFilter({})` (modal Temizle) should clear all facets or just merge an empty change. Implementing the strict single-mutator design surfaced a bug (Temizle preserved existing facets), so the two-mutator design replaced it before the commit boundary. Documented in key-decisions.
- **Task 2 commit bundles admin-audit-keys.ts** — strict task-by-task ordering would have left Task 2's audit-filter-modal.tsx importing a non-existent admin-audit-keys file at the Task 2 commit boundary. Bundling the i18n barrel into Task 2 keeps each commit individually buildable. Task 1's commit (page + table + toolbar + row + pagination + chips) then doesn't touch admin-audit-keys. (Same cross-task bundling rationale as Plan 14-02 used for admin-keys.ts.)
- **Search Input is a no-op visual stub** — prototype admin.jsx line 403 had a search input with no working backend. /admin/audit endpoint exposes only structured filters (date / actor / action_prefix), not free-text search. Kept the input visible per D-00 prototype fidelity but removed onChange wiring. Documented as v2.1 candidate.
- **MoreH placeholder is a 28px empty cell, not omitted** — Plan 14-07 PLAN.md line 171 says MoreH "MAY be omitted for v2.0". Chose to keep the 28px slot for grid alignment so future per-row actions can fill the slot without a layout reflow. CONTEXT Discretion default is no-op row click (Detay column shows everything; deep-link suffices via refLabel inside ActivityRow).

### Auto-fixed Issues

**1. [Rule 1 — Bug] modal Temizle leaked existing facets when only updateFilter helper existed**
- **Found during:** Task 1 + Task 2 integration design, before commit
- **Issue:** Single `updateFilter` helper that merged partial changes meant `onApply({})` (modal Temizle) merged an empty object into the existing filter — facets like date_from / actor_id stayed populated. The intent of Temizle is full reset.
- **Fix:** Added a separate `replaceFilter` helper that does a full replace; modal Apply + Clear use replaceFilter; chip × clears + toolbar Last 24h + pagination chevrons use updateFilter (merge). Distinguishing the two semantics avoids the bug class entirely.
- **Files modified:** `Frontend2/app/(shell)/admin/audit/page.tsx` (added replaceFilter)
- **Verification:** Build green. Both task RTL test files pass (7/7).
- **Committed in:** `e81acf19` (Task 1 commit — Task 1 is where the page.tsx lives)

**2. [Rule 1 — Test bug] Turkish dotted İ regex matching**
- **Found during:** Task 2 RTL Case 1 first run
- **Issue:** Test used `screen.getByText(/işlem öneki/i)` to find the "İşlem öneki..." label. JS RegExp `/i` flag uses ASCII casefolding and doesn't fold İ (U+0130) → `i`. Test failed with "unable to find element".
- **Fix:** Switched to `screen.getByText(/İşlem öneki/, { exact: false })` — exact-substring match, no case folding required. Documented as inline comment for the next maintainer.
- **Files modified:** `Frontend2/components/admin/audit/audit-filter-modal.test.tsx`
- **Verification:** RTL Case 1 passes; all 3 cases green.
- **Committed in:** `5f2506ea` (Task 2 commit; was caught and fixed before that commit)

### CLAUDE.md Driven Adjustments

- All new pages + components are `"use client"` (per Frontend2/AGENTS.md "this is NOT the Next.js you know" — interactive client components must declare).
- All new files use named exports + `@/` path alias (Frontend2 convention).
- All inline styles use CSS tokens (per CLAUDE.md / memory: no shadcn/ui; prototype-token-driven styles). Zero new tokens introduced.
- Backend untouched — DIP-clean (no `import sqlalchemy` or `from app.infrastructure` in any Plan 14-07 file because no backend files were modified).
- Per CLAUDE.md §4.1 OCP: extended ActivityRow's `variant` prop slot (added by Plan 14-02) rather than forking the component; the audit-table render branch lands in Plan 14-10 without modifying any existing variant="default" call site.

### Out-of-Scope Discoveries

- **Pre-existing workflow-editor RTL failures (16 tests in editor-page.test.tsx + 2 in workflow-canvas.test.tsx + 1 in selection-panel.test.tsx)** — origin Phase 12 tests; failures predate Plan 14-07. Confirmed by running `npm run test -- --run components/workflow-editor/editor-page.test.tsx` against HEAD~1 (before Plan 14-07's commits): 16/16 fail identically. Out of scope for this plan; logged here for visibility but NOT fixed (different phase / different scope).

## Known Stubs

| Location | Stub | Reason | Resolution |
|----------|------|--------|------------|
| `admin-audit-toolbar.tsx` search Input | no onChange wiring | Prototype admin.jsx line 403 had a decorative search; /admin/audit endpoint doesn't expose free-text search. | v2.1 candidate when backend gains audit_log full-text indexing — closest server-side approximation today is action_prefix in the filter modal. |
| `admin-audit-row.tsx` Detay column | passes variant="admin-table" but ActivityRow renders default branch | Plan 14-02 added the prop slot as a forward-declare; Plan 14-10 fills the variant render branch. | Plan 14-10 Task 2 — fills the `variant === "admin-table"` branch with the single-line Jira-style render. No consumer-side change needed. |
| `admin-audit-row.tsx` MoreH cell | empty 28px placeholder | CONTEXT Discretion default is no-op row click (Detay column shows everything). | If a future plan wants per-row admin actions (e.g., re-classify event, mark as audited), drop a `<MoreMenu>` into the slot — grid layout already reserved. |

All three stubs are honest — the rendered surface is functionally correct today; the stubs are intentional incremental delivery boundaries hand-off to documented future work.

## i18n Keys Inventory

**File:** `Frontend2/lib/i18n/admin-audit-keys.ts`
**Total keys:** 31 (TR + EN parity = 62 string values; ≥ 22 acceptance — exceeds by 9)

| Category | Count | Keys |
|----------|-------|------|
| Toolbar | 4 | search_placeholder / last_24h / filter_button / json_button |
| Column headers | 5 | col_time / col_actor / col_action / col_target / col_detay |
| Filter modal — title + fields + buttons + helpers | 10 | filter_modal_title / filter_date_from / filter_date_to / filter_actor / filter_actor_all / filter_action_prefix / filter_action_prefix_placeholder / filter_apply / filter_clear / filter_cancel |
| Active filter chips | 4 | chip_actor_label / chip_action_label / chip_date_range_label / chip_clear_aria |
| Pagination | 5 | pagination_size_label / pagination_page / pagination_total / pagination_prev_aria / pagination_next_aria |
| Empty + warning states | 3 | empty_no_match / empty_no_audit / truncated_warning |

## Threat Mitigation Summary

**T-14-07-01 — Information Disclosure: Audit JSON export with wide filter** — MITIGATED.
- Backend Plan 14-01 enforces 50k row hard cap (`get_global_audit` + `audit.json` endpoint).
- Frontend renders AlertBanner when `truncated === true`, telling admins they need a narrower filter.
- JSON export honors current filter (not unfiltered) so the cap also applies to the download.

**T-14-07-02 — Information Disclosure: URL-shareable audit filter contains actor_id PII** — ACCEPTED per threat model.
- /admin/audit is admin-only (3-layer gate: middleware cookie + AdminLayout client guard + backend require_admin).
- Sharing filter URLs is the explicit feature (D-C5 bookmarklenebilir).
- actor_id is an opaque integer, not directly PII.

**T-14-07-03 — Tampering: Filter offset reset to 0 on filter change** — MITIGATED.
- updateFilter helper resets offset to 0 unless the change is offset-only (pagination chevron). replaceFilter (modal save) resets offset to 0 unless explicitly set. Both paths covered.
- Pagination math caps at HARD_CAP regardless of true total (Pitfall 6).

**T-14-07-04 — Elevation of Privilege: Audit endpoint without admin gate** — MITIGATED (Plan 14-01).
- Backend `/admin/audit` + `/admin/audit.json` both gated via `Depends(require_admin)`. Frontend gates are UX, not security.

**T-14-07-05 — Information Disclosure: Risk column resurrection (D-Z1)** — MITIGATED.
- RTL Case 4 asserts no rendered "Risk" / "Risiko" column header. Detay column replaces it.
- Documented in CONTEXT D-Z1 + UI-SPEC §Surface H + admin-audit-table.tsx + admin-audit-row.tsx + the test itself.

**T-14-07-06 — Tampering: XSS via audit metadata in Detay column** — MITIGATED.
- ActivityRow uses React's default escaping. NO dangerouslySetInnerHTML on audit data.
- Comment_excerpt is 160-char capped (Plan 14-09 backend D-D2).
- Detay column wraps `<ActivityRow event={item} variant="admin-table"/>` — same XSS-hardened renderer used by 4+ surfaces (Activity tab + Profile + Dashboard ActivityFeed + Recent admin events).

## Hand-off Notes

**Plan 14-08 (Stats tab):** No dependency on Plan 14-07. Same dynamic-import lazy-load pattern (D-C6). Same per-surface i18n keys file convention (admin-stats-keys.ts). Already has useAdminStats hook from Plan 14-01.

**Plan 14-10 (frontend Jira-style audit render):** Will deliver the `variant === "admin-table"` render branch in `Frontend2/components/activity/activity-row.tsx`. The 3 current consumers of `variant="admin-table"` (recent-admin-events / admin-audit-row / future) get the visual upgrade for free. Plan 14-10 Task 2 RTL test should assert the new branch render visibly differs from the default (e.g., no avatar bubble; time on the right).

**Plan 14-11 (header buttons + dropdown verification):** Will swap AdminLayout's "Denetim günlüğü" stub button onClick from `console.log` to `router.push('/admin/audit')`. The /admin/audit route is now reachable + functional, so the wire-up is a 1-line change.

**Plan 14-12 UAT checklist additions:**
- /admin/audit renders the table with 6 columns (Time / Actor / Action / Target / Detay / MoreH-stub) and NO Risk column.
- Apply a filter via the modal (e.g., date range Apr 1-30 + action_prefix "task.") → URL updates to `/admin/audit?from=...&to=...&action_prefix=task.` and the table refetches.
- Bookmark that URL, copy-paste in another tab → lands on the same filtered view.
- Click a chip's × → that facet clears; URL drops the corresponding query param; offset resets to 0.
- Click "JSON" → server endpoint downloads JSON file honoring current filter.
- Click "Son 24 saat" → date_from/date_to set to a 24h window; offset resets.
- Switch page size 25/50/100 → offset resets to 0; rows per page change.
- Backend returns truncated=true (large filter) → AlertBanner with "50.000" message visible above the table; pagination caps at 50k.

**v2.1 backlog:**
- Backend audit_log full-text indexing → wire the toolbar search Input.
- Per-row click → entity deep-link (currently no-op per CONTEXT Discretion default).
- Plan 14-10's variant="admin-table" branch render polish.

## Threat Flags

None — Plan 14-07 introduces no new network surface beyond what GET /admin/audit + GET /admin/audit.json already expose (Plan 14-01). All new code is frontend.

## Self-Check: PASSED

- [x] Both task commits exist in git log (`5f2506ea`, `e81acf19`)
- [x] `Frontend2/app/(shell)/admin/audit/page.tsx` exists AND is `"use client"` AND wraps inner page in `<React.Suspense>` AND uses useSearchParams AND lazy-imports AdminAuditTable via next/dynamic
- [x] `Frontend2/components/admin/audit/admin-audit-table.tsx` renders AlertBanner tone="warning" when `data?.truncated` is true (1 grep hit)
- [x] `Frontend2/components/admin/audit/admin-audit-row.tsx` exports ADMIN_AUDIT_GRID = "90px 160px 180px 1fr 1fr 28px" (1 grep hit)
- [x] `Frontend2/components/admin/audit/admin-audit-row.tsx` passes `variant="admin-table"` to ActivityRow (3 grep hits — 1 use + 2 doc refs)
- [x] `Frontend2/components/admin/audit/audit-filter-chips.tsx` renders × clear button per facet via X icon import (1 grep hit)
- [x] `Frontend2/components/admin/audit/admin-audit-pagination.tsx` SegmentedControl options = [25, 50, 100] (PAGE_SIZE_OPTIONS const)
- [x] `Frontend2/components/admin/audit/admin-audit-toolbar.tsx` JSON button calls downloadCsv AND uses exportJsonUrl(filter) (3 + 2 grep hits including JSDoc)
- [x] `Frontend2/components/admin/audit/admin-audit-table.test.tsx` asserts truncated=true case renders AlertBanner with "50.000" text
- [x] `Frontend2/components/admin/audit/admin-audit-table.test.tsx` asserts no rendered Risk/Risiko column (D-Z1)
- [x] `Frontend2/components/admin/audit/audit-filter-modal.tsx` uses Modal width=520 (1 grep hit)
- [x] `Frontend2/components/admin/audit/audit-filter-modal.tsx` has 4 form fields (2 type="date" Inputs + 1 native select + 1 type="text" Input)
- [x] `Frontend2/components/admin/audit/audit-filter-modal.tsx` footer has 3 buttons: Vazgeç (ghost), Temizle (ghost — onApply({})), Uygula (primary — onApply(draft))
- [x] `Frontend2/components/admin/audit/audit-filter-modal.test.tsx` asserts pre-fill from current filter AND apply with new value AND clear case (3/3)
- [x] `Frontend2/lib/i18n/admin-audit-keys.ts` has 31 keys (≥ 22) with TR + EN parity (`grep -c "    tr:"` = 31; `grep -c "    en:"` = 31)
- [x] No new backend surface created (Plan 14-07 is fully frontend; backend untouched)
- [x] `cd Frontend2 && npm run build` exits 0 with /admin/audit in static prerender list
- [x] `cd Frontend2 && npm run test -- --run admin-audit-table.test.tsx audit-filter-modal.test.tsx` exits 0 (7/7)
- [x] Plan 14-01..14-06 + 14-07 admin regression tests pass (`npm run test -- --run admin` → 46/46 across 11 files)
- [x] No new TS errors introduced (build passes TypeScript strict mode)
- [x] VALIDATION.md rows 14-07-T1 + 14-07-T2 marked ✅
- [x] STATE.md / ROADMAP.md plan-progress will advance from 6/12 to 7/12 in the metadata commit

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*
