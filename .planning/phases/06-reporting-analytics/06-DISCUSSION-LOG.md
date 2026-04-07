# Phase 6: Reporting & Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 06-reporting-analytics
**Areas discussed:** Chart content & layout, Reports page scope, Export output, Performance metrics definition

---

## Chart Content & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Keep all 4 panels | Sprint Burndown, Task Distribution, Velocity Trend, Team Performance | ✓ |
| Swap some out | Replace one or more with different charts | |
| Add a 5th chart | Keep 4 + add another panel | |

**User's choice:** Keep all 4 panels.

---

| Option | Description | Selected |
|--------|-------------|----------|
| By status | Pie/donut showing tasks per status column | |
| By priority | Breakdown by CRITICAL/HIGH/MEDIUM/LOW | |
| Both (tabs or stacked) | Toggle or two sub-charts | ✓ |

**User's choice:** Both — toggle/tab switch (Status | Priority) in a single panel.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle / tab switch | One chart, switch between Status/Priority views | ✓ |
| Two sub-charts side by side | Status donut and Priority donut shown simultaneously | |

**User's choice:** Toggle / tab switch (recommended).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Last completed sprint's burndown | Fallback to most recent closed sprint | |
| Empty state with message only | "Aktif sprint bulunmuyor." | |
| Modern overlay (custom) | Faded/blurred chart behind overlay with "Aktif sprint bulunmuyor.", "Yeni Sprint Başlat" (primary CTA), "Son Sprinti Göster" (secondary CTA) | ✓ |

**User's choice:** Modern overlay on faded/blurred last sprint chart with two action buttons.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Per sprint | Each sprint = one bar | |
| Per week / calendar period | Weekly bars regardless of sprint | |
| Both (project mode) | Auto-detect: sprints → per sprint; no sprints → per week | ✓ |

**User's choice:** Both — project mode detection.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Start unfiltered (all projects), then filter | Aggregate data, user drills down | |
| Always require project selection | Charts empty until project picked | |
| Auto-select most recently active project | Prevents empty screen, defaults to last active project | ✓ |

**User's choice:** Auto-select most recently active (or most recently created) project on initial load.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Global filter bar | Single filter updates all 4 charts | ✓ (with detail) |
| Per-chart filters | Each chart has its own filters | |

**User's choice:** Global filter bar. Project mandatory (default: last active). Assignee, Status/Priority, Date Range are optional. All charts + leaderboard table update together. Note: "Task-based filter" in REPT-02 is addressed by the Status/Priority filter dimension.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sprint Burndown=Line, Distribution=Donut, Velocity=Bar, Performance=Table | Standard industry chart types | |
| All bar charts | Uniform visual style | |
| Mixed with area chart for burndown | Filled area chart for Sprint Burndown | ✓ (extended) |

**User's choice:** Area chart (Sprint Burndown), Donut (Task Distribution), Bar (Velocity Trend), modern leaderboard Table with avatars + inline mini progress bars (Team Performance).

---

## Reports Page Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Global top-level route /reports | Own page in main sidebar nav | ✓ |
| Project-scoped tab /projects/[id]/reports | Reports as tab in project detail | |
| Both | Global + project-scoped tab | |

**User's choice:** Global /reports page (already stubbed at this path).

---

| Option | Description | Selected |
|--------|-------------|----------|
| All roles, filtered by access | Everyone sees /reports, data scoped to their projects | ✓ |
| Managers and Admins only | Members blocked from /reports | |
| Per-project: managers see team, members see own | Role-aware data | |

**User's choice:** All roles, filtered by project membership.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full Turkish | Page title, chart labels, filter labels all in Turkish | ✓ |
| Keep English | Reports page stays in English | |
| Mixed | Headers Turkish, data labels English | |

**User's choice:** Full Turkish.

---

## Export Output

| Option | Description | Selected |
|--------|-------------|----------|
| Both PDF and Excel | WeasyPrint + openpyxl, both in Phase 6 | ✓ (with rules) |
| Excel only | Simpler, PDF deferred | |
| PDF only | WeasyPrint, Excel deferred | |

**User's choice:** Both. Enforced rules: (1) export must respect current filter state; (2) loading spinner + disabled button while generating; (3) timestamped filenames `SPMS_Report_[Project_Key]_[YYYY-MM-DD].(pdf/xlsx)`.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Export button with dropdown | "Dışa Aktar" → "PDF olarak indir" / "Excel olarak indir" | ✓ (with UX rule) |
| Two separate buttons | "PDF İndir" + "Excel İndir" side by side | |
| Export modal | Modal with format choice + options | |

**User's choice:** Dropdown button. UX rule: dropdown closes → button shows spinner + disabled → file downloads → button re-enables.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Data tables only | No chart images, just structured data | ✓ (format-specific columns) |
| Charts + data table | Static chart images + data table | |
| Charts only (summary report) | Visual summary, no raw data | |

**User's choice:** Data tables only. PDF = core columns (task key, title, status, assignee, priority, due date). Excel = all columns (adds sprint, points, reporter, created/updated dates).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Task key, title, status, assignee, priority, due date, created date | Core task fields | — |
| All task fields | Comprehensive export | — |
| Configurable per export | Column-picker step | — |
| Format-specific (custom) | PDF = core; Excel = all | ✓ |

**User's choice:** Format-based: PDF gets core 6 fields (page width constraint); Excel gets all fields (spreadsheet can accommodate wide data).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — header with title + filter summary | "SPMS Raporu", project name, filters, timestamp | ✓ |
| No branding | Raw table only | |
| Claude's discretion | Claude designs layout | |

**User's choice:** PDF header with branding.

---

## Performance Metrics Definition

| Option | Description | Selected |
|--------|-------------|----------|
| Done before due_date | Task marked done ≤ due_date | |
| Done within the sprint it was assigned to | Uses sprint end_date | |
| Done within N days of due_date (grace period) | 1-day grace | |
| Multi-rule (custom) | Primary: due_date; fallback: sprint end_date; exclude if neither | ✓ |

**User's choice:** Dynamic calculation — Primary: done before due_date. Secondary fallback: done before sprint end_date (if no due_date but has sprint). Excluded: neither due_date nor sprint. Works across all methodologies.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Controlled by global date range filter | Same filter scopes metrics | ✓ (with default) |
| Current sprint only | Always active sprint | |
| All time | All tasks ever | |

**User's choice:** Global date range filter controls metrics. Default: Son 30 Gün (Last 30 Days) on initial load.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Wire '-' metrics + compact per-member leaderboard | Reuse leaderboard component, top 5, Turkish text | ✓ |
| Add a mini chart to dashboard | Bar chart on manager dashboard | |
| Dashboard links to /reports only | Just wire metrics, add link | |

**User's choice:** Option 1 with rules: (1) reuse exact same leaderboard component from /reports (DRY); (2) show top 5 mini-version; (3) all text in Turkish ("Aktif Görevler", "Tamamlanan Görevler", "Takım Performansı", "Tüm Raporları Gör →").

---

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar, Name, Assigned, Completed, On-time %, In-progress | Core performance view | ✓ |
| Avatar, Name, Completed, On-time %, Overdue count | Emphasizes deadlines | |
| Avatar, Name, Assigned, Completed, On-time %, Points earned | Includes story points | |

**User's choice:** Avatar, Name, Atanan (Assigned), Tamamlanan (Completed), Zamanında % (On-time %), Devam Eden (In-progress). Inline mini progress bar for on-time %.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, sortable by all columns | Click header to sort asc/desc | ✓ |
| Default sort only | Most completed, no interactive re-sort | |

**User's choice:** Sortable by all columns.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — filter scopes the table too | Assignee filter filters leaderboard rows | ✓ |
| No — table always shows full team | Assignee filter only affects charts | |

**User's choice:** Assignee filter scopes the leaderboard table (consistent with global filter).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Row click sets Assignee filter | All 4 charts update to show only that member | ✓ |
| Row click opens detail modal | Modal with full task list for that member | |
| No drill-down in Phase 6 | Deferred | |

**User's choice:** Row click sets Assignee filter (all charts update).

---

## Claude's Discretion

- Backend API endpoint structure for reports
- "Done" status detection approach (column name matching vs `is_done` boolean)
- Jinja2 PDF template design
- openpyxl cell styling
- "Most recently active project" determination logic
- recharts color palette and responsive container configuration

