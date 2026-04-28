---
status: complete
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
source:
  - 14-UAT-CHECKLIST.md
  - 14-01-SUMMARY.md through 14-12-SUMMARY.md
  - 14-VERIFICATION.md
started: 2026-04-28T08:37:16Z
updated: 2026-04-28T15:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Stop any running Frontend2 (port 3000) and Backend (port 8000) processes. Start Backend fresh, then Frontend2. Server boots without errors, alembic migrations apply through 006_phase14_admin_panel, homepage at http://localhost:3000 loads, and admin seed user can log in.
result: issue
reported: |
  Backend (:8000) and Frontend2 (:3000) both boot, but every POST to
  /api/v1/auth/login is rejected by browser with:
    "Access to XMLHttpRequest at 'http://localhost:8000/api/v1/auth/login'
     from origin 'http://localhost:3000' has been blocked by CORS policy:
     No 'Access-Control-Allow-Origin' header is present on the requested
     resource." → net::ERR_FAILED
  /api/v1/auth/me also returns 401 on first paint (expected pre-login).
  Login flow is unreachable from the browser, so admin auth is broken.
severity: blocker
root_cause: |
  CORS error was a SYMPTOM, not the cause. Backend traceback (revealed
  in second debug.md capture) shows POST /api/v1/auth/login crashed with:
    ValueError: password cannot be longer than 72 bytes
  origin: passlib 1.7.4 ↔ bcrypt 5.0.0 incompatibility. passlib's
  detect_wrap_bug() self-test feeds bcrypt a long secret; bcrypt >=4.1
  raises instead of silently truncating. Login endpoint 500s; Starlette
  BaseHTTPMiddleware closes the response without CORS headers, so the
  browser misreports it as "no Access-Control-Allow-Origin".
fix_applied: |
  - Backend/requirements.txt — pinned `bcrypt<4.1` with explanatory
    comment so a fresh `pip install -r requirements.txt` won't pull
    the broken combo again.
  - Local venv — `pip install "bcrypt<4.1"` ran cleanly, bcrypt 5.0.0
    uninstalled, bcrypt 4.0.1 installed.
  - Verified in isolation: passlib CryptContext hash + verify both work
    against bcrypt 4.0.1 (test in fresh interpreter — no exception).
fix_status: |
  Backend MUST be restarted to load the new bcrypt; the running uvicorn
  process still has bcrypt 5.0.0 in memory. Awaiting user restart +
  re-attempt of login before continuing UAT walkthrough.

### 2. U-14-01 — Anonymous redirect to /auth/login (server-edge gate)
expected: As anonymous user, navigate directly to /admin/users → bounced to /auth/login with ?next= param; NO "Yönetim Konsolu" heading flashes during transition (verifies D-C3, Pitfall 10).
result: pass
note: |
  Behavior verified: anonymous → bounced to /auth/login with target
  preserved; no admin heading flash. Implementation uses ?from= (not
  ?next=) — confirmed param value: from=%2Fadmin%2Fusers (decodes to
  /admin/users). Spec wording in 14-UAT-CHECKLIST.md should be updated
  to ?from= to match the actual implementation.

### 3. U-14-02 — Member-role redirect with toast
expected: As Member-role user, navigate to /admin → bounced to /dashboard; toast "Bu sayfaya erişim yetkiniz yok." (TR) / "You don't have permission to access this page." (EN) renders (verifies D-C3, Pitfall 3).
result: pass

### 4. U-14-03 — Admin sees 8 NavTabs in canonical order
expected: As Admin, navigate to /admin → 8 NavTabs render with localized labels in order: Genel · Kullanıcılar · Roller · İzin Matrisi · Projeler · Şablonlar · Audit · İstatistik (verifies D-C2, D-C4).
result: pass
side_finding: |
  While testing as Member, user clicked AvatarDropdown → "Çıkış yap"
  and was redirected to /auth/login → 404 Not Found. The actual login
  route is /login (confirmed by anonymous-redirect Test 2 landing on
  /login?from=...). Logout target hardcodes /auth/login somewhere —
  separate bug, logged as its own gap.

### 5. U-14-04 — Header "Rapor al" downloads admin-summary.pdf
expected: Click header "Rapor al" → admin-summary.pdf downloads via Content-Disposition: attachment; opens in PDF viewer with sections: user count + delta, top-5 projects, top-5 users (verifies D-B6).
result: issue
reported: |
  Clicked "Rapor al" — browser shows download with retry icon, file
  cannot be opened. Effectively no PDF is delivered (or the download
  fails mid-stream / returns non-PDF content).
severity: blocker

### 6. U-14-05 — Header "Denetim günlüğü" navigates to /admin/audit
expected: Click header "Denetim günlüğü" → URL changes to /admin/audit; AdminAuditTable mounts with default 50-row page (verifies D-B6 client-side router.push).
result: pass

### 7. U-14-06 — Avatar dropdown "Yönetim Paneli" link to /admin
expected: AvatarDropdown → click "Yönetim Paneli" / "Admin Panel" menuitem → URL changes to /admin; Overview tab is active (verifies Phase 13 D-D2; Plan 14-11 Test 14).
result: pass

### 8. U-14-07 — Overview 5 StatCards row
expected: 5 StatCards render in 5-column grid: Kullanıcı / Aktif Proje / Onay Bekleyen / Şablon / Depolama; counts match dev DB (Storage shows verbatim "12.4 GB" / "%62 dolu" mock per D-Y1) (verifies D-W1, D-Y1).
result: pass

### 9. U-14-08 — Pending join requests card with optimistic Approve
expected: Pending Project Join Requests Card renders top-5 items with Approve / Reject buttons; Approve fires optimistic update (row vanishes immediately, Toast on success); click "Tümünü gör" → modal "Tüm bekleyen istekler" opens with full list (verifies D-A1, D-W2).
result: skipped
reason: |
  No pending project join requests in dev DB to test against. Card
  presumably renders empty state, but Approve / Reject / "Tümünü gör"
  flows could not be exercised. Re-run after seeding ≥5 pending join
  requests (per UAT-CHECKLIST pre-flight requirement).

### 10. U-14-09 — Role distribution bars
expected: Role distribution renders pure-CSS bars for Admin / PM / Member; ratios sum to 100%; counts match the Users tab role filter (verifies D-W1, D-Y1, D-X3).
result: pass

### 11. U-14-10 — Recent admin events Jira-style enriched
expected: Recent admin events list renders 10 rows in Jira-style enriched format ("<actor> <verb> <target>" with relative timestamp); detail variant matches Plan 14-10 audit-event-mapper output (verifies D-D1..D6, D-W1).
result: issue
reported: |
  Screenshot ("Son Yönetim Olayları" card) shows 10 rows but enrichment
  is missing AND the visuals are off:

  Content: All 10 rows display the generic Turkish phrase "değiştirdi
  bir görev alanını" with no specific target — no task title, no field
  name, no old→new value. Actors are real (Mehmet/Yusuf/Elif/Ayşe/Ali/
  Sistem), but the verb-object is the same boilerplate fallback for
  every row. All timestamps identical ("6 gün") suggesting either stale
  seed data OR the relative-time formatter is collapsing.

  Visual: CSS drift vs prototype — spacing tight, "Audit'a g…" footer
  link is being overlapped/clipped by a decorative palm-tree placeholder
  graphic in the bottom-right corner; the card chrome looks unfinished.

  This points to Plan 14-10 audit-event-mapper extension NOT firing the
  per-event-type render branches in the activity-row admin-table variant
  — every row falls through to a `task_field_updated` generic catch-all
  instead of resolving to the specific SemanticEventType (task.create,
  project.archive, comment.create, milestone.update, etc).
severity: major

### 12. U-14-11 — UsersTable filters + localStorage persistence
expected: UsersTable renders 9-col grid (checkbox, avatar+name, email, role, status, last_active, projects_count, ⋮); search filter narrows rows; SegmentedControl filter toggles role (Tümü/Admin/PM/Member); state persists in localStorage spms.admin.users.filter (verifies D-A6, D-C5, D-W3).
result: pass
side_finding: |
  Functional behavior verified, but UX is glitchy: every keystroke in
  the search input triggers a full row refresh (visible flash). Likely
  missing input debounce + react-query cache invalidation hammering
  the network. Cosmetic but distracting — should be addressed.

### 13. U-14-12 — Add User modal + invite email
expected: Click "Kullanıcı ekle" → AddUserModal opens; submit valid email + role → modal closes, Toast confirms; new row appears in table on cache refresh; SMTP delivers invite email with set-password link that lands on the password-set page (verifies D-B2, mailhog inspection).
result: pass
note: |
  Verified end-to-end via backend log: POST /api/v1/admin/users → 201
  Created (user deneme@gmail.com, id=9, role Member, is_active=False);
  password_reset_token row inserted; audit_log entry written
  ('invited' action with target_role + requested_by_admin_id metadata).
  Invite link logged to console (SMTP not configured locally per
  VALIDATION.md, so console-only is the dev-mode behavior):
    http://localhost:3000/auth/set-password?token=...
  Open question: invite link uses /auth/set-password — same /auth/...
  prefix family that 404s for logout (Test 4 side-finding). Need to
  verify /auth/set-password route actually serves a page.

### 14. U-14-13 — Bulk invite happy path 5/5
expected: Click "Toplu davet" → BulkInviteModal opens; paste 5 valid CSV rows (email,role,name) → preview shows 5 valid rows; submit → summary shows "5/5 başarılı" (verifies D-B4, papaparse Plan 14-01).
result: pass

### 15. U-14-14 — Bulk invite mixed valid/invalid + 500-cap
expected: Paste 3 valid + 2 invalid CSV rows → preview shows valid count + per-row errors; submit → summary shows "3/5 başarılı + 2 hata" with error codes; 500-row cap enforced both client + server (verifies D-B4 error mix, Plan 14-03 Pitfall 5).
result: pass

### 16. U-14-15 — CSV export with UTF-8 BOM
expected: Click "CSV" toolbar button → /admin/users.csv?<filter params> downloads with UTF-8 BOM prefix; opens in Excel without mojibake on Turkish characters (verifies D-W3 server-rendered).
result: issue
reported: |
  Browser network log: GET http://localhost:8000/api/v1/admin/users.csv
  → 401 (Unauthorized). The CSV download was triggered by handleCsvExport
  → downloadCsv (anchor-trigger pattern in lib/admin/download.ts or
  equivalent). Anchor-based downloads (<a href> / window.location) do
  NOT include the JWT bearer token from axios/fetch interceptors, so the
  request hits /admin/users.csv unauthenticated → backend require_admin
  returns 401 → no file content delivered.
severity: blocker
related_to: |
  Same root cause as Test 5 (Rapor al PDF download) — both endpoints
  use the same anchor-trigger pattern, both require admin auth, both
  silently strip the Authorization header.

### 17. U-14-16 — UserBulkBar with v3.0-deferred Sil
expected: Select 2+ rows via checkboxes → UserBulkBar appears with "Toplu Pasifleştir" + "Rol değiştir" actions; "Sil" is soft-disabled with tooltip "v3.0 — RBAC" (verifies D-A2..A5 RBAC defer, D-B7).
result: pass

### 18. U-14-17 — Roles tab 4 cards + dashed placeholder
expected: 4 role cards render (Admin / PM / Member / Owner) + 1 dashed-border placeholder card "Yeni rol" / "New role"; clicking the placeholder shows the deferred-to-v3.0 AlertBanner explaining RBAC defer (verifies D-A2, D-A4, D-A5, D-Y1).
result: pass

### 19. U-14-18 — Roles per-card counts cross-link to Users
expected: Per-role user counts on each card match the Users tab role filter counts; clicking "Görüntüle" filters Users tab by that role (verifies D-W1 cross-tab data consistency).
result: issue
reported: |
  Two distinct sub-failures:
  (1) Each role card shows literal "Kullanıcı: =" instead of an actual
      count number — rendering placeholder is leaking through, suggests
      either the API isn't returning per-role counts in the response or
      the template binding (e.g., {count}) isn't being substituted.
  (2) Clicking "Görüntüle" on any role card does NOT navigate to the
      Users tab with the role filter pre-applied — either the link is
      a no-op or the navigation lands on /admin/users without the
      ?role= query param being parsed/applied.
severity: major

### 20. U-14-19 — Permissions matrix 14×4 disabled + AlertBanner
expected: 14×4 toggle matrix renders (14 permission scopes × 4 roles); ALL toggles disabled with aria-disabled="true"; AlertBanner above the matrix explains "Permission editing — v3.0 (RBAC genel kapsamlı sürümü)" (verifies D-A2, D-A3, D-Y1).
result: pass

### 21. U-14-20 — AdminProjectsTable MoreH = exactly 2 items
expected: AdminProjectsTable renders 8-col grid; MoreH menu opens with EXACTLY 2 items: "Arşivle" + "Sil" — NO transfer-ownership menu item (verifies D-B1, D-B5).
result: pass

### 22. U-14-21 — Archive project ConfirmDialog (primary tone)
expected: Click "Arşivle" → ConfirmDialog (tone=primary) opens; Confirm sends archive request; row updates archived_at immediately; un-archive shows in row context menu (verifies D-B1).
result: pass
side_finding: |
  Functional: Archive + un-archive both work. Visual: when a row is
  archived, the styling cascade dims the entire row INCLUDING the ⋮
  MoreH button AND the ConfirmDialog when re-opened on that row, so
  the menu and dialog look "silik" (faded/grayed) and unreadable.
  Expected: only the row body should be dimmed (archived state), but
  the MoreH button must stay solid with a white background indicator
  so it's discoverable, and the ConfirmDialog must render at full
  opacity regardless of source-row archive state.

### 23. U-14-22 — Delete project 2-step ConfirmDialog (danger tone)
expected: Click "Sil" on a project → 2-step ConfirmDialog (tone=danger); Step 2 requires typing project name verbatim before Confirm activates; click Confirm → row vanishes; Toast confirms deletion (verifies D-B5).
result: issue
reported: |
  Click "Sil" → ConfirmDialog opens (verified). User typed project name
  to enable Confirm. Click Confirm → backend log shows:
    DELETE /api/v1/projects/4 → 404 Not Found (16ms)
  Project 4 still in the table after refetch.
root_cause: |
  Backend/app/application/use_cases/manage_projects.py:185-190 —
  DeleteProjectUseCase.execute() raises ProjectNotFoundError if
  `project.manager_id != manager_id`. The endpoint catches this and
  returns 404 (info-disclosure-safe). Admin user is logged in but is
  NOT the project's manager, so the use case rejects the delete.
  Plan 14-05 promised "reused existing endpoints" but never added an
  admin-bypass to this use case — admins cannot delete projects they
  don't manage. Same root-cause family will affect any admin-scoped
  destructive ops that route through PM-scoped use cases.
severity: blocker

### 24. U-14-23 — Templates grid + edit deep link
expected: AdminTemplatesGrid renders template cards (icon + name + description + usage count + ⋮); click "Düzenle" → router.push to /workflow-editor?template_id=<id> (verifies D-B1).
result: issue
reported: |
  Click "Düzenle" on a template card → does NOT navigate to
  /workflow-editor?template_id=<id>. Instead the user lands on the
  /projects page, and that view triggers a downstream 404 (project
  id 9 not found). Wrong route target — handler is wired to the
  projects router push instead of the workflow-editor deep link.
severity: major

### 25. U-14-24 — Delete template impact-aware ConfirmDialog
expected: Click "Sil" on a template with active_project_count > 0 → ConfirmDialog (tone=warning) shows impact count + a "Yine de sil" / "Delete anyway" checkbox; Confirm disabled until checkbox is checked; Confirm sends delete request only when checkbox is checked (verifies D-B1).
result: skipped
reason: |
  Could not exercise the impact-aware ConfirmDialog flow — every
  available template in the dev seed is a built-in (system-protected)
  template, and the UI shows "Built-in Templates cannot be deleted"
  rather than the warning-tone ConfirmDialog with the "Yine de sil"
  checkbox. To re-test: seed at least one custom template that has
  active_project_count > 0 (i.e., is referenced by ≥1 ACTIVE project)
  and re-run.
side_finding: |
  User asks for a separate verification: when a custom template IS
  deleted, the system MUST NOT cascade-delete child projects' workflow
  state — projects should keep their cloned workflow snapshot and
  continue operating independently of the source template (Plan 14-06
  D-B1 implies "client-side composed clone via existing GET + POST",
  which suggests projects already own their cloned workflow, but this
  needs a behavioral test on next session).

### 26. U-14-25 — AuditTable 5 cols (Path B per Plan 14-16), NO Risk column, NO IP column
expected: AuditTable renders with 5 cols (Zaman / Aktör / İşlem / Hedef / Detay) — IP deferred to v2.1 per plan 14-16 user signoff (Path B); NO Risk column (verifies D-C5, D-Z1, D-Z2 — risk column deferred-to-v3.0). All 5 column header cells use role="columnheader"; body rows use role="row" + role="cell"; rightmost cell is Detay (no duplicate Zaman). Hedef column renders the resolved entity_label from audit_repo._resolve_entity_label (project_name / task_title / milestone_title / artifact_name / "yorum:" prefix / f"{ENTITY}-{id}" legacy fallback) — never empty / never raw entity_id.
result: pending_reverify
reported_legacy: |
  (Original UAT pre-Plan-14-16) Column layout was wrong:
  - Hedef column rendered empty for every row
  - IP column was missing from header + body
  - Rightmost column had no header label and re-displayed Zaman (time)
    a second time, yielding ~4-5 distinct columns instead of the
    legacy 6-col contract.
fix_summary: |
  Plan 14-16 (Cluster D, Path B) reduces the contract to 5 columns
  permanently per user_decision_locked 2026-04-28 ("IP kolonu sil,
  relevant bir kolon varsa onu koyalım"). Backend
  audit_repo.get_global_audit now emits entity_label via cross-table
  resolver. Frontend ADMIN_AUDIT_GRID = "90px 160px 180px 1fr 1.5fr"
  (5 tracks); admin-audit-table.tsx header drops the aria-hidden
  filler; admin-audit-row.tsx drops the 28px MoreH placeholder; Detay
  cell wraps <ActivityRow variant="admin-table" hideTimestamp={true}/>
  to suppress the inner mono timestamp.
severity_legacy: major

### 27. U-14-26 — Audit URL-driven filters + chip facets
expected: Click "Filtre" → AuditFilterModal opens with 4 fields (Başlangıç / Bitiş / Aktör / İşlem öneki); set Başlangıç to 2026-04-01 → click Uygula → URL contains ?from=2026-04-01; chip "Tarih: 2026-04-01 →" appears above table; click chip × → URL param drops + chip vanishes (verifies D-C5, D-Z2).
result: pass
side_finding: |
  Filter chips render the Aktör (actor) facet as the user's numeric ID
  ("Aktör: 2") instead of the user's display name. Chip should resolve
  the id to a friendly label (full_name or email) before rendering —
  user-facing labels should never expose raw foreign keys.

### 28. U-14-27 — Audit JSON export filter-aware
expected: Click "JSON" → /admin/audit.json?<filter params> downloads JSON file with current filter applied (verifies D-W3, D-Z1).
result: issue
reported: |
  Click "JSON" → 401 Unauthorized. Same root cause family as Test 16
  (CSV export) and Test 5 (PDF export): anchor-trigger download does
  not include the JWT bearer header, so the require_admin gate on
  GET /api/v1/admin/audit.json rejects it. Filter-aware behavior
  cannot be verified until auth is fixed at the source.
severity: blocker
related_to: 5, 16

### 29. U-14-28 — Audit 50k cap AlertBanner
expected: Force a result set ≥50,000 rows (mock or seeded) → AlertBanner above table renders "Sonuç 50.000 satırla sınırlandı; daraltmak için filtre kullanın" / "Result truncated to 50,000 rows" (verifies D-Z1, Plan 14-07 truncated:true marker).
result: skipped
reason: |
  Dev DB does not have ≥50,000 audit rows to trigger the truncation
  banner. Re-run after seeding a synthetic 50k+ audit_log dataset, OR
  hit the endpoint directly with a custom fixture in an integration
  test (Plan 14-07 already verifies truncated:true marker server-side
  per VERIFICATION.md, so this UAT row is a UI-only re-confirmation).

### 30. U-14-29 — Detay column Jira-style for ≥5 event types + PII guardrail
expected: Detay column renders enriched Jira-style sentences for at least 5 distinct event types (task.create, project.archive, comment.create, milestone.update, audit_log permission.deny) using Plan 14-10 audit-event-mapper extension; PII guardrail caps comment excerpts at 160 chars (verifies D-D1..D6).
result: issue
reported: |
  Enrichment IS firing for project events — example captured by
  copy-paste:
    "Sistem proje durumunu değiştirdi 'Yapay Zeka Modülü': ARCHIVED
     ACTIVE"
  But the Detay cell is truncating mid-string in the rendered UI —
  the visible portion clips at e.g. 'Yapay Zeka Modül(' and the rest
  ("ü': ARCHIVED ACTIVE") only appears via clipboard. Two distinct
  problems:
  (1) UI truncation is hiding semantic content; tooltip / line-wrap
      / fixed-row-height needs to expand or the cell needs a "see
      more" hover affordance.
  (2) Cross-check with Test 11 (Recent admin events on /admin
      Overview): same data backend, but Recent Events showed only
      generic "değiştirdi bir görev alanını" for every row — the
      enrichment IS available in /admin/audit but the Recent Events
      consumer falls through to the catch-all. Inconsistent rendering
      between the two consumers of the same audit-event-mapper.
severity: major
related_to: 11

### 31. U-14-30 — Stats 3 charts + empty states
expected: 3 charts mount on /admin/stats — ActiveUsersTrendChart (recharts LineChart with 30-day x-axis), MethodologyBars (3 pure-CSS bars summing to 100%), VelocityCardsGrid (top-30 cap, last-bar primary tone); empty states render fallback messages when data is sparse (verifies D-A7, D-X1, D-X2, D-X4, D-C6).
result: pass
side_findings: |
  All 3 charts mount without error. Three product-level concerns:
  (1) "Velocity" chart name is Scrum-specific terminology. We are a
      multi-methodology app (Scrum / Kanban / Waterfall), so a
      generic name like "Tamamlama hızı" / "Completion rate" or
      "Throughput" would fit Kanban + Waterfall projects too.
  (2) Velocity bars show 0% even on projects that have completed
      tasks — likely the "done" detection regex / column-name match
      isn't recognizing the local board column names. Cross-check
      with the SQL `lower(board_columns.name) IN ('done','completed',
      'closed','tamamlandı','tamamlandi','bitti','bitirildi')`
      condition observed in Test 23 log — if a project's "done"
      column is named differently (e.g. "Bitti ✓"), it falls outside
      this whitelist and reports 0%.
  (3) "Metodoloji Kullanımı" chart legend / Y-axis is unclear — does
      the bar represent project count, task count, user count, or
      something else? Add a tooltip or subtitle to disambiguate.

### 32. U-14-31 — Velocity card cross-link + LineChart hover tooltip
expected: Click into a Velocity card project name → router.push to that project's detail page; recharts LineChart hover tooltip shows the date + count (verifies D-X4).
result: issue
reported: |
  Velocity card project name renders as plain text, not as a clickable
  link. No hover state, no cursor:pointer, no underline animation —
  there is no affordance suggesting the user can click through to the
  project detail page. The cross-link contract from D-X4 is not wired
  on the consumer side.
severity: major

### 33. U-14-32 — Locale TR ↔ EN parity sweep
expected: Toggle locale TR ↔ EN via header <select> → walk every admin tab + open every modal; NO fallback strings (__MISSING__, raw key names like admin.users.csv_button) appear; all 9 surfaces show fully localized copy (verifies i18n parity per VALIDATION.md).
result: pass

### 34. U-14-33 — 1280px viewport layout integrity
expected: Resize browser to 1280px (admin desktop-first per CONTEXT) → 5-col StatCards row stays on one line; AuditTable's 5 cols (Plan 14-16 Path B) remain visible without horizontal scroll; admin layout NavTabs strip is single-line (verifies CONTEXT desktop-first scope, UI-SPEC §Spacing).
result: issue
reported: |
  When the viewport is narrowed below the design width, the rightmost
  columns overlap each other (visually stack on top of one another)
  and content is hidden, NOT gracefully wrapped or scrolled. There is
  no column-width adjustment / responsive breakpoint behavior — the
  layout simply trims/truncates the rightmost cells without exposing
  a horizontal scrollbar or letting cells flow. Either: (a) the table
  needs an overflow-x:auto wrapper to surface a scrollbar at narrow
  widths, OR (b) min-width per column should be enforced so that
  narrowing the viewport surfaces the scrollbar before columns
  collide. Current behavior is silently destructive (data invisible).
severity: major

## Summary

total: 34
passed: 19
issues: 12
pending: 0
skipped: 3
side_findings: 7

## Gaps

- truth: "Backend boots on :8000 and accepts authenticated login from Frontend2 origin (http://localhost:3000)"
  status: failed
  reason: |
    User reported: every POST /api/v1/auth/login from origin
    http://localhost:3000 is rejected by browser CORS preflight —
    "No 'Access-Control-Allow-Origin' header is present on the requested
    resource", net::ERR_FAILED. /api/v1/auth/me also 401s pre-login.
    Login is unreachable from the running dev frontend, so the entire
    admin panel UAT walk-through (Tests 3–34, anything requiring auth)
    is blocked downstream.
  severity: blocker
  test: 1
  artifacts: []
  missing: []
  resolution: |
    Root cause: passlib 1.7.4 ↔ bcrypt 5.0.0 incompat (detect_wrap_bug
    feeds long secret; bcrypt >=4.1 raises ValueError instead of
    truncating). 500 from /auth/login → BaseHTTPMiddleware closes
    response without CORS headers → browser misreports as CORS error.
    Fix: pinned bcrypt<4.1 in Backend/requirements.txt + downgraded
    venv to bcrypt 4.0.1. User confirmed login works after Backend
    restart.

- truth: "Header 'Rapor al' delivers a valid admin-summary.pdf with user count + delta + top-5 projects + top-5 users sections"
  status: failed
  reason: |
    User reported: clicking "Rapor al" triggers a download but the
    browser shows the file with a retry icon and the file cannot be
    opened. Confirmed root cause via Test 16 cross-check: anchor-trigger
    download pattern (downloadCsv / downloadPdf in lib/admin/download.ts
    or equivalent) does NOT include the Authorization header from the
    axios/fetch interceptor → backend require_admin returns 401 →
    browser receives empty/error response → "retry" indicator in download
    bar. Same root cause as Test 16 (CSV export 401).
  severity: blocker
  test: 5
  artifacts:
    - lib/admin/download.ts (or wherever downloadCsv / downloadPdf live)
    - app/(shell)/admin/layout.tsx Rapor al onClick handler
    - Backend/app/api/v1/admin_summary.py (require_admin gated endpoint)
  missing:
    - Authenticated download mechanism (fetch with credentials → blob → object URL → programmatic anchor click)
    - OR short-lived signed-URL endpoint that puts the JWT in the query string
    - OR cookie-based auth path for binary endpoints

- truth: "AvatarDropdown logout action signs the user out and lands on the actual login route"
  status: failed
  reason: |
    User reported (side-finding while testing as Member): clicking
    "Çıkış yap" in AvatarDropdown navigates to /auth/login → 404 Not
    Found. The actual login route is /login (verified by Test 2 where
    the anonymous-redirect from /admin/users lands on /login?from=...).
    Logout target hardcodes the wrong path — search for /auth/login
    string literal in components/shell/avatar-dropdown.tsx (or its
    onLogout callback chain).
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "Recent admin events list (Overview /admin) renders 10 Jira-style enriched rows with per-event-type detail (target name, field, old→new) per Plan 14-10 audit-event-mapper extension"
  status: failed
  reason: |
    User reported with screenshot: 10 rows render but every single row
    falls through to the generic Turkish phrase "değiştirdi bir görev
    alanını" — no task title, no field name, no old→new value. All
    timestamps collapse to "6 gün". Real actors render (Mehmet, Yusuf,
    Elif, Ayşe, Ali, Sistem) so the data fetch is fine; the
    audit-event-mapper extension (Plan 14-10) is failing to dispatch
    per-SemanticEventType render branches in the activity-row admin-
    table variant — every event resolves to the task_field_updated
    catch-all. Visual: card chrome shows CSS drift vs prototype, and
    a decorative palm-tree placeholder graphic overlaps the
    "Audit'a git" footer link.
  severity: major
  test: 11
  artifacts:
    - components/activity/activity-row.tsx (admin-table variant, lines 459-555)
    - lib/audit-event-mapper.ts (semantic-type dispatch, lines 30-55 + 86-93)
    - components/admin/overview/recent-admin-events.tsx (consumer)
  missing:
    - Per-event-type render branches firing for non-task events
    - Localized verb-object string for each SemanticEventType in TR/EN
    - Card-chrome polish + footer overlap fix vs decorative graphic

- truth: "CSV export from /admin/users delivers a UTF-8 BOM-prefixed CSV via authenticated GET /api/v1/admin/users.csv"
  status: failed
  reason: |
    Browser network log shows GET http://localhost:8000/api/v1/admin/
    users.csv → 401 Unauthorized. The CSV download was triggered by
    handleCsvExport → downloadCsv anchor-trigger pattern. Anchor /
    window.location-based downloads do NOT include the JWT bearer
    token from the axios/fetch interceptor. Backend require_admin
    therefore rejects the request with 401, no file content is
    delivered. Same root cause as Test 5 (PDF download).
  severity: blocker
  test: 16
  related_to: 5
  artifacts:
    - lib/admin/download.ts (or wherever downloadCsv lives)
    - components/admin/users/users-toolbar.tsx (CSV button onClick)
    - Backend/app/api/v1/admin_users.py (.csv endpoint, require_admin gate)
  missing:
    - Authenticated download mechanism (fetch with Authorization header
      → blob → URL.createObjectURL → programmatic anchor click +
      revokeObjectURL)
    - OR signed-URL endpoint with JWT-in-query-string + short TTL
    - UTF-8 BOM presence in delivered file (not yet observable until
      auth issue is fixed)

- truth: "UsersTable search input is debounced and does not visibly thrash the row data on every keystroke"
  status: failed
  reason: |
    User reported (side-finding on Test 12): every keystroke in the
    search input triggers a full row refresh visible as a flash. Likely
    no client-side input debounce + react-query refetch firing on each
    state update. UX is functional but glitchy.
  severity: minor
  test: 12
  artifacts:
    - components/admin/users/users-toolbar.tsx (search input handler)
    - hooks/admin/use-admin-users.ts (or equivalent — refetch trigger)
  missing:
    - Input debounce (200-300ms) on the search field before query state
      update
    - keepPreviousData on react-query so the table doesn't blank during
      refetch

- truth: "Roles tab cards display real per-role user counts and 'Görüntüle' navigates to /admin/users with the role filter pre-applied"
  status: failed
  reason: |
    Two sub-failures observed (Test 19):
    (1) Counts render literal "Kullanıcı: =" — placeholder leakage. The
        API response shape may not include per-role counts, OR the
        component's template binding (e.g., {count}) isn't substituted.
    (2) "Görüntüle" link does not pass through a role filter — clicking
        either does nothing or navigates to /admin/users without the
        ?role= query param picked up by the localStorage filter state.
  severity: major
  test: 19
  artifacts:
    - components/admin/roles/role-card.tsx (count rendering + link)
    - hooks/admin/use-roles-overview.ts (or equivalent count source)
    - app/(shell)/admin/users/page.tsx (?role= URL param parser)
  missing:
    - Real count value bound into role-card template
    - Click handler on "Görüntüle" → router.push('/admin/users?role=<id>')
    - Users page reads ?role= and seeds the SegmentedControl filter +
      writes through to localStorage spms.admin.users.filter

- truth: "Admin can delete any project from /admin/projects regardless of project ownership"
  status: failed
  reason: |
    Test 23 — DELETE /api/v1/projects/4 returned 404 because the
    DeleteProjectUseCase (Backend/app/application/use_cases/manage_
    projects.py:185-190) raises ProjectNotFoundError when
    `project.manager_id != manager_id`. Admin user (id=1) is not the
    manager of project 4, so the use case rejects the delete with the
    info-disclosure-safe 404. Plan 14-05 chose to "reuse existing
    endpoints" but never added an admin-bypass to this use case, so
    admins cannot perform destructive ops on projects they don't manage.
    This pattern likely affects any other admin-scoped destructive op
    that delegates to a PM-scoped use case (e.g., archive may have the
    same risk if it routes through a similar guard — Test 22 happened
    to work because the user happened to be the manager of that project,
    or the archive use case has different semantics).
  severity: blocker
  test: 23
  artifacts:
    - Backend/app/application/use_cases/manage_projects.py (lines 181-190 DeleteProjectUseCase)
    - Backend/app/api/v1/projects.py (lines 239-258 delete_project endpoint)
    - components/admin/projects/admin-project-row-actions.tsx (consumer)
  missing:
    - Admin-bypass in DeleteProjectUseCase (e.g., accept actor User
      object instead of manager_id and skip the ownership check when
      `actor.role.name == "admin"`)
    - Audit-log entry for admin-initiated deletes that records actor +
      target manager (compliance trail)
    - Same audit pass on archive / un-archive / any other admin-scoped
      destructive flow

- truth: "Archived row styling does not cascade to the row's MoreH (⋮) button or its ConfirmDialog"
  status: failed
  reason: |
    User reported (side-finding on Test 22): when a project row is in
    archived state, the dimming opacity bleeds into the ⋮ MoreH button
    and the ConfirmDialog re-opened from that row, making them appear
    "silik" (faded) and unreadable. Functional behavior is fine but
    discoverability suffers. Need to scope the .archived (or whatever
    class) opacity to the row content cells only — exclude the actions
    cell (or layer the ⋮ button on a white background indicator) and
    teach the ConfirmDialog to render at full opacity in a portal /
    layer above the table regardless of source-row state.
  severity: minor
  test: 22
  artifacts:
    - components/admin/projects/admin-projects-table.tsx (row class application)
    - components/admin/shared/more-menu.tsx (button styling under archived parent)
    - components/ui/confirm-dialog.tsx (portal opacity inheritance)
  missing:
    - .archived opacity scoped to .row-content (NOT the actions cell)
    - White background indicator behind the ⋮ button when row is archived
    - ConfirmDialog rendered in a portal with explicit opacity:1

- truth: "AdminTemplatesGrid 'Düzenle' navigates to /workflow-editor?template_id=<id>"
  status: failed
  reason: |
    Test 24 — Click "Düzenle" navigates to /projects (wrong route),
    which then 404s on a downstream project lookup (project id 9 not
    found). The handler is wired to the projects router push instead
    of the workflow-editor deep-link contract from Plan 14-06 D-B1.
  severity: major
  test: 24
  artifacts:
    - components/admin/workflows/template-row-actions.tsx (Düzenle handler)
    - app/(shell)/admin/workflows/page.tsx
    - app/workflow-editor/page.tsx (target with template_id query parser)
  missing:
    - router.push(`/workflow-editor?template_id=${template.id}`) in the
      Düzenle onClick (NOT a projects route push)
    - workflow-editor page reads template_id query param and seeds
      editor with that template's content

- truth: "AuditTable on /admin/audit renders the contracted 5 columns (Zaman / Aktör / İşlem / Hedef / Detay) with all cells populated — IP column deferred to v2.1 per Plan 14-16 Path B user signoff"
  status: closed_pending_reverify
  reason: |
    Test 26 closed by Plan 14-16 (Cluster D, Path B) per
    user_decision_locked 2026-04-28 ("IP kolonu sil, relevant bir kolon
    varsa onu koyalım"). Original 6-col contract was reduced to 5
    columns permanently because the codebase has 12 create_with_metadata
    call sites — exceeding the 5-site Path A threshold by 2.4×, so
    Path A (full IP column with migration 007 + 12 call-site updates)
    requires explicit user opt-in via plan 14-19 (NOT spawned).
    Plan 14-16 ships:
    - Backend: audit_repo._resolve_entity_label populates Hedef from
      enriched extra_metadata (Plan 14-09); legacy rows fall back to
      f"{ENTITY}-{id}" (D-D6); never empty / never raw entity_id.
    - Frontend: ADMIN_AUDIT_GRID = "90px 160px 180px 1fr 1.5fr"
      (5 tracks); aria-hidden filler removed; 28px MoreH stub removed;
      Detay cell wraps <ActivityRow hideTimestamp={true}/> via M-4
      hideTimestamp prop to suppress the inner mono timestamp.
    UAT re-verification on next session: walk to /admin/audit, count
    5 column headers in order [Zaman, Aktör, İşlem, Hedef, Detay], confirm
    Hedef shows project/task names (or f"TASK-42" for legacy rows),
    confirm rightmost cell is Detay text not a duplicate Zaman.
  severity: major
  test: 26
  artifacts:
    - components/admin/audit/admin-audit-table.tsx (5-cell header,
      role="columnheader" semantics)
    - components/admin/audit/admin-audit-row.tsx (5-track grid,
      hideTimestamp passthrough, role="row"/role="cell")
    - components/activity/activity-row.tsx (hideTimestamp prop,
      default false)
    - Backend/app/infrastructure/database/repositories/audit_repo.py
      (_resolve_entity_label helper)
    - Backend/tests/integration/test_admin_audit_serialization.py
      (4 mandatory + 2 defensive resolver tests)
  fix_commits: |
    feat(14-16): emit entity_label cross-table resolver in get_global_audit (Cluster D Path B)
    test(14-16): RED — failing tests for 5-col grid + Hedef position + hideTimestamp prop
    feat(14-16): GREEN — 5-col grid + role-based ARIA + hideTimestamp prop
  ip_column_status: deferred_to_v21_with_user_approval_requirement

- truth: "JSON export from /admin/audit delivers an authenticated, filter-aware JSON file"
  status: failed
  reason: |
    Test 28 — GET /admin/audit.json → 401 Unauthorized. Same root
    cause family as Test 5 (PDF) and Test 16 (CSV): anchor-trigger
    download does NOT include the Authorization header, so backend
    require_admin rejects it. Filter-aware payload is unverifiable
    until auth is fixed at the source.
  severity: blocker
  test: 28
  related_to: 5, 16
  artifacts:
    - lib/admin/download.ts (or wherever downloadJson lives)
    - components/admin/audit/admin-audit-toolbar.tsx (JSON button)
    - Backend/app/api/v1/admin_audit.py (.json endpoint, require_admin)
  missing:
    - Same authenticated-download fix as the CSV/PDF gaps; once
      shared download helper is patched, this gap closes for free

- truth: "Detay column on /admin/audit renders enriched Jira-style strings WITHOUT mid-string truncation, and the SAME enrichment is consumed by Recent Events on /admin Overview"
  status: failed
  reason: |
    Test 30 — Two related failures:
    (1) Enrichment IS firing for project-scoped events on /admin/audit
        (e.g., "Sistem proje durumunu değiştirdi 'Yapay Zeka Modülü':
        ARCHIVED ACTIVE"), but the visible cell text clips mid-word
        ("'Yapay Zeka Modül(") with no tooltip / hover expand —
        clipboard inspection reveals the rest, so the data is in the
        DOM but visually amputated.
    (2) The SAME audit-event-mapper output is rendered on the /admin
        Overview Recent Events card (Test 11), but there every row
        falls through to the generic catch-all "değiştirdi bir görev
        alanını" — meaning the Recent Events consumer ignores the
        per-event-type render branches that the audit-table consumer
        partially honors. Inconsistent rendering between two consumers
        of the same source.
  severity: major
  test: 30
  related_to: 11
  artifacts:
    - components/activity/activity-row.tsx (admin-table variant for /audit)
    - components/admin/overview/recent-admin-events.tsx (Overview consumer)
    - lib/audit-event-mapper.ts (semantic dispatch)
  missing:
    - Cell text wrap / "show more" hover affordance on Detay column
    - Recent Events consumer must use the SAME render branch dispatch
      that admin-table variant uses (not fall through to catch-all)

- truth: "Velocity card project name on /admin/stats is a clickable link with hover affordance that navigates to that project's detail page"
  status: failed
  reason: |
    Test 32 — Project names on velocity cards are plain text. No
    cursor:pointer, no underline-on-hover, no link element — the
    cross-link contract from D-X4 is unimplemented on the consumer
    side. Test 31 confirmed the velocity grid renders, so this is a
    pure consumer wiring bug, not a data bug.
  severity: major
  test: 32
  artifacts:
    - components/admin/stats/velocity-cards-grid.tsx (project-name binding)
    - app/projects/[id]/page.tsx (target detail route)
  missing:
    - Wrap project name in <Link href={`/projects/${id}`}>
    - Add hover state (color + underline transition) so clickability is
      discoverable

- truth: "Admin layout responds gracefully to viewport narrowing (≤1280px) without overlapping or silently hiding rightmost columns"
  status: failed
  reason: |
    Test 34 — When the browser is narrowed below the design width,
    the rightmost columns visually stack on top of one another and
    content is hidden, NOT scrolled or wrapped. There is no
    overflow-x:auto wrapper to surface a horizontal scrollbar, and
    no min-width per column to keep cells from colliding. Current
    behavior is silently destructive — data becomes invisible without
    the user being told it's there.
  severity: major
  test: 34
  artifacts:
    - components/admin/users/users-table.tsx (and other admin tables)
    - components/admin/audit/admin-audit-table.tsx
    - components/admin/projects/admin-projects-table.tsx
    - app/(shell)/admin/layout.tsx (if shared overflow wrapper lives there)
  missing:
    - <div className="overflow-x-auto"> wrapper around each admin table
    - min-width per column (or table min-width) to enforce predictable
      column collapse before the scrollbar appears
    - OR responsive breakpoint that hides lower-priority columns at
      narrow widths (with a "+" expand row affordance)

- truth: "Audit filter chip Aktör facet renders the actor's display name, not the raw user id"
  status: failed
  reason: |
    Test 27 side-finding — Selecting a user as Aktör in the filter
    modal applies correctly (URL param works, results filter), but
    the rendered chip displays "Aktör: 2" (numeric user id) instead
    of "Aktör: Yusuf Bayrakcı" (full_name) or the email. User-facing
    chips should never expose raw foreign keys.
  severity: minor
  test: 27
  artifacts:
    - components/admin/audit/audit-filter-chips.tsx
    - hooks/admin/use-users-lookup.ts (or equivalent id→name resolver)
  missing:
    - Resolve actor_id to user.full_name (or fallback email) before
      rendering chip label

- truth: "Stats Velocity chart uses methodology-neutral terminology and accurately reports completion rate across all board column naming variants"
  status: failed
  reason: |
    Test 31 side-findings — Three product issues on /admin/stats:
    (1) Chart name "Velocity" is Scrum-specific and misleading on a
        multi-methodology app (Scrum / Kanban / Waterfall). Generic
        labels ("Tamamlama hızı" / "Throughput") fit all three.
    (2) Velocity bars show 0% on projects WITH completed tasks. The
        backend's "done" detection (audit_repo / charts query) uses
        a fixed whitelist of column names: 'done','completed','closed',
        'tamamlandı','tamamlandi','bitti','bitirildi'. Projects whose
        "done" column is named differently (e.g., "Bitti ✓", "Tamam",
        "Closed - Released") fall outside the whitelist and are
        reported as 0% completion. Either the whitelist needs expansion
        OR projects need to flag their terminal column explicitly.
    (3) "Metodoloji Kullanımı" chart is unclear — the legend / Y-axis
        does not say what is being counted (projects? tasks? users?).
        Add a tooltip or subtitle to disambiguate.
  severity: major
  test: 31
  artifacts:
    - components/admin/stats/velocity-cards-grid.tsx
    - components/admin/stats/methodology-bars.tsx
    - Backend/app/infrastructure/database/repositories/charts_repo.py (done detection)
    - Backend/app/api/v1/admin_stats.py (composite payload)
  missing:
    - Methodology-neutral chart name (i18n key + copy update)
    - Either: explicit terminal-column flag on board_columns table
      (preferred), OR an expanded done-name whitelist that includes
      common variants
    - Tooltip / subtitle on Metodoloji chart explaining the unit
