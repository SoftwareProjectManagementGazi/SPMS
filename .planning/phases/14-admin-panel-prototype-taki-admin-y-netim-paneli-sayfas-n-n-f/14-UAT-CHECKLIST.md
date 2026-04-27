---
phase: 14
slug: admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
type: uat-checklist
audience: gsd-verify-work + human reviewer
created: 2026-04-27
last_updated: 2026-04-27
related_plans: [14-01, 14-02, 14-03, 14-04, 14-05, 14-06, 14-07, 14-08, 14-09, 14-10, 14-11, 14-12]
---

# Phase 14 — UAT Checklist (Admin Panel)

> Manual verification queue for the `/gsd-verify-work` post-merge pass.
> Each row references the locked decision (D-XX) it verifies — see
> `14-CONTEXT.md` for the canonical decisions list.
>
> **Pre-flight:** dev server (Frontend2 + Backend) running, dev DB seeded with
> at least 1 admin user, 1 PM, 1 Member, 2-3 projects across methodologies,
> 5+ pending join requests, ~50 audit_log rows spanning the last 30 days.
>
> **Locale switch:** every surface row implicitly has a locale parity check
> consolidated in the Cross-cutting section (rows U-14-29 / U-14-30) — flip
> the locale once and re-walk only if a TR/EN delta is suspected on a row.

---

## Surface A — Admin Layout (Plans 14-02 + 14-11)

- [ ] **U-14-01**: Anonymous user navigates directly to `/admin/users` → bounced to `/auth/login` with `?next=` param; NO `Yönetim Konsolu` heading flashes during transition (verifies: D-C3, Pitfall 10 server-edge gate)
- [ ] **U-14-02**: Member-role user navigates to `/admin` → bounced to `/dashboard`; Toast "Bu sayfaya erişim yetkiniz yok." renders (TR) / "You don't have permission to access this page." (EN) (verifies: D-C3, Pitfall 3 client-side guard with `isLoading` bail)
- [ ] **U-14-03**: Admin user navigates to `/admin` → 8 NavTabs render with localized labels in canonical order: Genel · Kullanıcılar · Roller · İzin Matrisi · Projeler · Şablonlar · Audit · İstatistik (verifies: D-C2, D-C4)
- [ ] **U-14-04**: Click header "Rapor al" → `admin-summary.pdf` downloads via Content-Disposition: attachment; opens in PDF viewer with sections: user count + delta, top-5 projects, top-5 users (verifies: D-B6, manual binary inspection in VALIDATION.md)
- [ ] **U-14-05**: Click header "Denetim günlüğü" → URL changes to `/admin/audit`; AdminAuditTable mounts with default 50-row page (verifies: D-B6 client-side router.push)
- [ ] **U-14-06**: AvatarDropdown → click "Yönetim Paneli" / "Admin Panel" menuitem → URL changes to `/admin`; Overview tab is active (verifies: Phase 13 D-D2 cross-phase contract; Plan 14-11 Test 14)

## Surface B — Genel / Overview (Plan 14-02)

- [ ] **U-14-07**: 5 StatCards render in a 5-column grid: Kullanıcı / Aktif Proje / Onay Bekleyen / Şablon / Depolama; counts match dev DB (Storage shows the verbatim "12.4 GB" / "%62 dolu" mock per CONTEXT D-Y1) (verifies: D-W1, D-Y1)
- [ ] **U-14-08**: Pending Project Join Requests Card renders top-5 items with Approve / Reject buttons; Approve fires optimistic update (row vanishes immediately, Toast on success); click "Tümünü gör" → modal "Tüm bekleyen istekler" opens with full list (verifies: D-A1, D-W2)
- [ ] **U-14-09**: Role distribution renders pure-CSS bars for Admin / PM / Member; ratios sum to 100%; counts match the Users tab role filter (verifies: D-W1, D-Y1, D-X3)
- [ ] **U-14-10**: Recent admin events list renders 10 rows in Jira-style enriched format ("<actor> <verb> <target>" with relative timestamp); detail variant matches the Plan 14-10 audit-event-mapper output (verifies: D-D1..D6, D-W1)

## Surface C — Kullanıcılar / Users (Plan 14-03)

- [ ] **U-14-11**: UsersTable renders 9-col grid (checkbox, avatar+name, email, role, status, last_active, projects_count, ⋮); search filter narrows rows by query; SegmentedControl filter toggles role (Tümü/Admin/PM/Member); state persists in localStorage `spms.admin.users.filter` (verifies: D-A6, D-C5, D-W3)
- [ ] **U-14-12**: Click "Kullanıcı ekle" → AddUserModal opens; submit valid email + role → modal closes, Toast confirms; new row appears in table on cache refresh; SMTP delivers invite email with set-password link that lands on the password-set page (verifies: D-B2, mailhog manual inspection per VALIDATION.md)
- [ ] **U-14-13**: Click "Toplu davet" → BulkInviteModal opens; paste 5 valid CSV rows (`email,role,name`) → preview shows 5 valid rows; submit → summary shows "5/5 başarılı" (verifies: D-B4 happy path, papaparse Plan 14-01)
- [ ] **U-14-14**: BulkInviteModal — paste 3 valid + 2 invalid CSV rows → preview shows valid count + per-row errors; submit → summary shows "3/5 başarılı + 2 hata" with error codes per row; 500-row cap enforced both client + server (verifies: D-B4 error mix, Plan 14-03 Pitfall 5 RFC 5322 lax regex)
- [ ] **U-14-15**: Click "CSV" toolbar button → `/admin/users.csv?<filter params>` downloads with UTF-8 BOM prefix; opens in Excel without mojibake on Turkish characters (verifies: D-W3 server-rendered, manual binary inspection)
- [ ] **U-14-16**: Select 2+ rows via checkboxes → UserBulkBar appears with "Toplu Pasifleştir" + "Rol değiştir" actions; "Sil" is soft-disabled with tooltip "v3.0 — RBAC" (verifies: D-A2..A5 RBAC defer, D-B7 v2.0/v2.1 split)

## Surface D — Roller / Roles (Plan 14-04)

- [ ] **U-14-17**: 4 role cards render (Admin / PM / Member / Owner) + 1 dashed-border placeholder card "Yeni rol" / "New role"; clicking the placeholder shows the deferred-to-v3.0 AlertBanner explaining RBAC defer (verifies: D-A2, D-A4, D-A5, D-Y1)
- [ ] **U-14-18**: Per-role user counts on each card match the Users tab role filter counts; clicking "Görüntüle" filters Users tab by that role (verifies: D-W1 cross-tab data consistency)

## Surface E — İzin Matrisi / Permissions (Plan 14-04)

- [ ] **U-14-19**: 14×4 toggle matrix renders (14 permission scopes × 4 roles); ALL toggles are disabled with `aria-disabled="true"`; AlertBanner above the matrix explains "Permission editing — v3.0 (RBAC genel kapsamlı sürümü)" (verifies: D-A2, D-A3 multiple-defenses defer, D-Y1)

## Surface F — Projeler / Projects (Plan 14-05)

- [ ] **U-14-20**: AdminProjectsTable renders 8-col grid (name / methodology / owner / status / created_at / archived_at / member_count / ⋮); MoreH menu opens with EXACTLY 2 items: "Arşivle" + "Sil" — NO transfer-ownership menu item (verifies: D-B1, D-B5)
- [ ] **U-14-21**: Click "Arşivle" → ConfirmDialog (tone=primary) opens; Confirm sends archive request; row updates `archived_at` immediately; un-archive shows in row context menu (verifies: D-B1, ConfirmDialog tone wired in Plan 14-01)
- [ ] **U-14-22**: Click "Sil" on a project → 2-step ConfirmDialog (tone=danger); Step 2 requires typing the project name verbatim before Confirm activates; click Confirm → row vanishes; Toast confirms deletion (verifies: D-B5 v2.0 destructive guard, ConfirmDialog tone)

## Surface G — Şablonlar / Templates (Plan 14-06)

- [ ] **U-14-23**: AdminTemplatesGrid renders template cards (icon + name + description + usage count + ⋮); click "Düzenle" → router.push to `/workflow-editor?template_id=<id>` (verifies: D-B1)
- [ ] **U-14-24**: Click "Sil" on a template with `active_project_count > 0` → ConfirmDialog (tone=warning) shows the impact count + a "Yine de sil" / "Delete anyway" checkbox; Confirm is disabled until the checkbox is checked; Confirm sends delete request only when checkbox is checked (verifies: D-B1 impact-aware destructive guard)

## Surface H — Audit (Plans 14-07 + 14-09 + 14-10)

- [ ] **U-14-25**: AuditTable renders with 6 cols (Zaman / Aktör / İşlem / Hedef / IP / Detay); NO Risk column (verifies: D-C5, D-Z1, D-Z2 — risk column deferred-to-v3.0)
- [ ] **U-14-26**: Click "Filtre" → AuditFilterModal opens with 4 fields (Başlangıç / Bitiş / Aktör / İşlem öneki); set Başlangıç to 2026-04-01 → click Uygula → URL contains `?from=2026-04-01`; chip "Tarih: 2026-04-01 →" appears above table; click chip × → URL param drops + chip vanishes (verifies: D-C5 URL-driven filter contract, D-Z2 chip facet semantics)
- [ ] **U-14-27**: Click "JSON" → `/admin/audit.json?<filter params>` downloads JSON file with current filter applied (verifies: D-W3 server-rendered, D-Z1)
- [ ] **U-14-28**: Force a result set ≥50,000 rows (mock or seeded) → AlertBanner above table renders "Sonuç 50.000 satırla sınırlandı; daraltmak için filtre kullanın" / "Result truncated to 50,000 rows" (verifies: D-Z1 50k cap, Plan 14-07 truncated:true marker)
- [ ] **U-14-29**: Detay column renders enriched Jira-style sentences for at least 5 distinct event types (task.create, project.archive, comment.create, milestone.update, audit_log permission.deny) using the Plan 14-10 audit-event-mapper extension; PII guardrail caps comment excerpts at 160 chars (verifies: D-D1..D6, Plan 14-09 enrichment, Plan 14-10 mapper extension)

## Surface I — İstatistik / Stats (Plan 14-08)

- [ ] **U-14-30**: 3 charts mount on `/admin/stats` — ActiveUsersTrendChart (recharts LineChart with 30-day x-axis), MethodologyBars (3 pure-CSS bars summing to 100%), VelocityCardsGrid (top-30 cap, last-bar primary tone); empty states render fallback messages when data is sparse (verifies: D-A7 single round trip, D-X1, D-X2, D-X4 top-30 cap, D-C6 lazy-load)
- [ ] **U-14-31**: Click into a Velocity card project name → router.push to that project's detail page; recharts LineChart hover tooltip shows the date + count (verifies: D-X4 cross-link)

## Cross-cutting (i18n + viewport)

- [ ] **U-14-32**: Toggle locale TR ↔ EN via header `<select>` (Plan 13 D-D6) → walk every admin tab + open every modal; NO fallback strings (`__MISSING__`, raw key names like `admin.users.csv_button`) appear; all 9 surfaces show fully localized copy (verifies: i18n parity per VALIDATION.md manual row)
- [ ] **U-14-33**: Resize browser to 1280px (admin desktop-first per CONTEXT) → 5-col StatCards row stays on one line; AuditTable's 6 cols remain visible without horizontal scroll; admin layout NavTabs strip is single-line (verifies: CONTEXT desktop-first scope, UI-SPEC §Spacing fixed widths)

---

## Verification Steps (for each row above)

1. Run `cd Frontend2 && npm run dev` (port 3000) + `cd Backend && uvicorn app.main:app` (port 8000).
2. Seed dev DB: `cd Backend && python scripts/seed_dev_data.py` (or whichever seeder ships with the test rig).
3. Walk the rows in order. Tick each box only after observing the expected behavior.
4. For any failed row: file a regression bug with the row number + screenshot + actual vs expected delta.

## Sign-Off

- **UAT verifier:** ___________________________
- **Date:** ___________________________
- **Verdict:** ☐ All passed → flip Phase 14 to `complete` in STATE.md / ROADMAP.md
- **Verdict:** ☐ Failed rows: _________________ → file bugs, re-walk after fix

---

> **Decision coverage check:** This checklist references D-00, D-01, D-A1..A8, D-B1..B7, D-C2..C6, D-D1..D6, D-W1..W3, D-X1..X4, D-Y1, D-Z1..Z2 across the 33 rows above (38 distinct decisions verified — exceeds the 30 minimum requirement).
