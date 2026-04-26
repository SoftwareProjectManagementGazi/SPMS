# Phase 13 — UAT Checklist

**Phase:** 13-reporting-activity-user-profile
**Drafted:** 2026-04-26
**Status:** awaiting `/gsd-verify-work 13` manual sign-off (deferred per CONTEXT)
**Sign-off rule:** Each row PASS / FAIL with optional notes. ALL rows must PASS for phase verification to close.

---

## How to use

For each row, follow the **Steps** column in a real browser (Chromium recommended) against a development server with seeded data. Tick the checkbox when the **Expected** outcome matches what you observe. If FAIL, note the discrepancy and file a follow-up issue.

Run prerequisites side-by-side:

```bash
cd Backend && uvicorn app.main:app --reload     # backend on :8000
cd Frontend2 && npm run dev                      # frontend on :3000
```

Sign in with Admin + non-Admin accounts to cover the role-gated rows (PROF-03 admin gating + activity privacy filter).

---

| Tags meaning |
| --- |
| `[REPT-XX]` — Reporting & Charts requirement |
| `[PROF-XX]` — Activity / Profile requirement |
| `[D-XX]` — locked decision from CONTEXT.md |
| `[viewport]` — viewport-specific (use DevTools to switch) |
| `[a11y]` — accessibility-specific (use Tab + Arrow keys; or screen reader) |

---

## REPT-01 — Cumulative Flow Diagram (Kanban-only)

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 1 | /reports CFD card on a Kanban project | 1. Sign in. 2. Open /reports. 3. From the project picker, choose a Kanban project. 4. Wait for chart load. | CFD card renders 4 stacked area bands (todo / progress / review / done) with token colors. Footer shows Avg WIP and Avg Completion mono values. Per-card SegmentedControl shows 7d / 30d / 90d (default 30d). | [REPT-01] [D-A2] [D-A4] | ☐ |
| 2 | /reports CFD card on a non-Kanban project | 1. Switch project picker to a Scrum / Waterfall project. | AlertBanner (info tone) replaces the chart with: "Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir." Card title still visible. Layout doesn't jump. | [REPT-01] [D-A4] | ☐ |
| 3 | /reports CFD per-card range override | 1. With a Kanban project selected, click "7 gün" on the CFD card range picker. | Chart re-fetches data for 7-day range; the global toolbar's date-range filter UNCHANGED (still 30d). Per-card override is independent of global. | [REPT-01] [D-A5] | ☐ |

## REPT-02 — Lead / Cycle Time histograms

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 4 | /reports Lead/Cycle row | 1. From the project picker, choose any project. | Two cards side-by-side: Lead Time (left, --primary 70% bars) and Cycle Time (right, --status-progress 70% bars). Each shows a 5-bucket histogram (0-1d / 1-3d / 3-5d / 5-10d / 10d+). Footer shows P50 / P85 / P95 mono. | [REPT-02] | ☐ |
| 5 | /reports Lead/Cycle empty path | 1. Choose a project with no done tasks. | DataState empty fallback ("Veri yok." or context-specific) inside both cards; no JS error. | [REPT-02] [D-F2] | ☐ |

## REPT-03 — Iteration Comparison

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 6 | /reports Iteration card on a Scrum project | 1. Choose a Scrum project. | Iteration Comparison card visible BELOW the Lead/Cycle row. Grouped 3-bar series per sprint (Planlanan / Tamamlanan / Taşınan) with --status-progress / --status-done / --status-review color tokens. Default = last 4 sprints. | [REPT-03] [D-A6] | ☐ |
| 7 | /reports Iteration card hides for non-cycle methodology | 1. Choose a Kanban project. | Iteration card NOT rendered (no card, no banner). | [REPT-03] [D-A4] | ☐ |
| 8 | /reports Iteration N override | 1. With a Scrum project, click "6" on the Iteration card N picker. | Chart re-fetches data for last 6 sprints; bars update; the global filter unchanged. | [REPT-03] [D-A6] | ☐ |

## REPT-04 — Faz Raporları section

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 9 | /reports Faz Raporları outer tabs | 1. Scroll to the Faz Raporları section. | Two outer tabs: "Aktif + Tamamlanan" (active default) and "Arşivlenmiş". Below: project picker + phase picker (cascading). Phase picker disabled until a project is chosen. | [REPT-04] [D-E1] | ☐ |
| 10 | /reports Faz Raporları cascading + inline expand | 1. Choose a project + phase that has a saved PhaseReport. | EvaluationReportCard expands inline (read-only mode); shows metrics + issues + lessons + recommendations + PDF download button. NO Save / Delete in this context. | [REPT-04] [D-E2] | ☐ |
| 11 | /reports Faz Raporları empty state with deep-link | 1. Choose a phase that has no PhaseReport. | Inline message "Bu faz için rapor oluşturulmamış. ..." plus a button "Yaşam Döngüsü'ne git". Clicking the button navigates to `/projects/{id}?tab=lifecycle&sub=history`. | [REPT-04] [D-E4] | ☐ |

## PROF-01 — Project Activity tab

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 12 | /projects/{id}?tab=activity timeline | 1. Open a project with task activity. 2. Click the Aktivite tab. | Vertical timeline visible (.activity-timeline). 6 filter chips: Tümü / Oluşturma / Durum / Atama / Yorum / Yaşam Döngüsü. Date groups (Bugün / Dün / Bu Hafta / exact date >7 days). | [PROF-01] [D-B1] [D-B5] | ☐ |
| 13 | Project Activity filter persistence | 1. Click the "Yaşam Döngüsü" chip. 2. Reload the page. | Filter state persists — "Yaşam Döngüsü" chip still active after reload. localStorage key `spms.activity.filter.{projectId}` contains `"type":"lifecycle"`. | [PROF-01] [D-B7] | ☐ |
| 14 | Project Activity comment preview | 1. Find a comment_created event in the timeline. | Comment body renders inside a tinted block (var(--surface-2)) with up to 160 chars + ellipsis. HTML tags stripped (no XSS render). | [PROF-01] [D-B6] | ☐ |
| 15 | Project Activity refresh on window focus | 1. Stay on the Activity tab. 2. Switch tabs in your browser. 3. Switch back. | Timeline refetches automatically (network panel shows GET /projects/{id}/activity). No manual refresh button. | [PROF-01] [D-B3] | ☐ |

## PROF-02 — User Profile page

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 16 | /users/[currentUserId] self profile | 1. Click avatar → Profilim. | Self profile loads. Avatar (64px) has primary-color RING. "Sen" badge visible next to the name. "Düzenle" button visible top-right of header. 3 StatCards row + Tabs (Görevler default + Projeler + Aktivite). | [PROF-02] [D-C6] [D-C8] | ☐ |
| 17 | /users/[otherUserId] other profile | 1. Navigate to /users/N where N is another user's id. | Other profile loads. NO ring on avatar. NO "Sen" badge. NO "Düzenle" button. Same 3 StatCards + Tabs visible. | [PROF-02] [D-C6] | ☐ |
| 18 | Profile tab routing via ?tab= | 1. Open /users/N?tab=projects directly via the URL bar. 2. Click the "Aktivite" tab. | Projects tab is active on initial load. Activity tab activates after click; URL updates to /users/N?tab=activity. | [PROF-02] [D-G3] | ☐ |
| 19 | Profile Activity tab privacy filter | 1. Sign in as User A (member of Project X only). 2. Open /users/B (where B is a member of both Project X and Project Y). 3. Click the Aktivite tab. | Activity tab shows ONLY events from Project X (not Y). As Admin: bypass — sees all events. | [PROF-02] [D-C7] | ☐ |

## PROF-03 — Header avatar dropdown

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 20 | Avatar dropdown open + 5 menu items | 1. Click the header avatar (top-right). | Menu opens 8px below the trigger, 260px wide. Mini-profile header (Avatar 32 + name + role badge + email). 5 menu items: Profilim / Ayarlar / Yönetim Paneli (admin only) / Dil / Çıkış Yap. | [PROF-03] [D-D2] [D-D5] | ☐ |
| 21 | Admin gating | 1. Sign in as a non-admin. Open the dropdown. 2. Sign in as Admin. Open the dropdown. | Non-admin: NO "Yönetim Paneli" item. Admin: "Yönetim Paneli" item visible. | [PROF-03] [D-D2] | ☐ |
| 22 | Logout flow | 1. Click "Çıkış Yap". | Lands on `/auth/login` (NOT `/login`). localStorage `auth_token` cleared. No flash of authenticated UI. | [PROF-03] [D-D3] | ☐ |
| 23 | 3-way dismiss (Esc + click-outside + nav-away) | 1. Open the menu. Press Esc → menu closes. 2. Open the menu. Click outside → menu closes. 3. Open the menu. Click any menu item that navigates → menu closes after the nav. | All three dismissal paths work. | [PROF-03] [D-D7] | ☐ |
| 24 | Keyboard nav | 1. Tab to focus the avatar trigger. Press Enter → menu opens. 2. ArrowDown moves focus to the first menu item. Continue ArrowDown — focus walks down. ArrowUp walks up. End → last item. Home → first item. | Full keyboard accessibility. Esc returns focus to the trigger. | [PROF-03] [a11y] | ☐ |

## PROF-04 — MTTaskRow compact reuse + Cross-cutting

| # | Surface | Steps | Expected | Tag | PASS/FAIL |
|---|---------|-------|----------|-----|-----------|
| 25 | Profile Tasks tab uses MTTaskRow compact | 1. Open the profile Tasks tab. | Each task row is the MTTaskRow compact density (matches MyTasks compact view). Filter SegmentedControl (Aktif / Tamamlanan / Tümü). Tasks grouped by project header card with color dot + key + name + count badge. | [PROF-04] [D-C4] | ☐ |
| 26 | Avatar click-to-profile site-wide | 1. From any board card / activity row / member list / comment / project card, click an avatar. | Navigates to /users/{userId}. Parent row click handler does NOT also fire (Avatar Link e.stopPropagation). | [PROF-03] [D-D4] | ☐ |
| 27 | [viewport] Mobile ≤640px Reports + Profile + Activity + Dropdown | 1. DevTools viewport 375×812. Visit /reports, /users/1, /projects/1?tab=activity, click the avatar. | All grids collapse to 1 column. Chart heights tighten (CFD 160, Lead/Cycle 100, Iteration 140). Profile header stacks (avatar above name+stats). Activity row uses 22px avatars. Dropdown menu width = 100vw - 32px. | [viewport] [D-F1] | ☐ |
| 28 | [a11y] Chart SVG aria-label | 1. Inspect any chart card SVG (CFD / Lead/Cycle / Iteration). | The container div has role="img" with aria-label summarizing the data (e.g. "Kümülatif akış diyagramı, 30 gün, ortalama WIP X, günlük Y tamamlanma"). | [a11y] [D-G2] | ☐ |

---

## Sign-off

- [ ] All 28 rows PASS
- [ ] No FAIL (any FAIL blocks the phase verification)
- [ ] Notes / discrepancies recorded below

**Sign-off date:** _______
**Sign-off by:** _______

## Notes

_Manually fill in any FAIL details or environment caveats here._
