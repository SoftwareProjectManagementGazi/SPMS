# Phase 6: Reporting & Analytics - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Managers and project owners can view graphical progress summaries on the `/reports` page (global top-level route), apply a global filter bar (project, assignee, status/priority, date range), export filtered data as PDF or Excel, and see per-member performance metrics. The manager dashboard (`components/dashboard/manager-view.tsx`) is wired to real data and gains a compact "Takım Performansı" leaderboard section.

Requirements in scope: REPT-01, REPT-02, REPT-03, REPT-04, REPT-05.

</domain>

<decisions>
## Implementation Decisions

### Charts & Layout (REPT-01)

**Four panels kept from stubs** — Sprint Burndown, Task Distribution, Velocity Trend, Team Performance.

**Chart types:**
- **Sprint Burndown** → Area chart (recharts `AreaChart`). Filled area strongly visualizes remaining work shrinking.
- **Task Distribution** → Donut chart (recharts `PieChart` with `innerRadius`). Status/Priority toggle at the top of the panel — one chart, switch between views.
  - Toggle style: tab switch (Status | Priority). Single chart redraws with different data slice. Saves panel space.
- **Velocity Trend** → Bar chart (recharts `BarChart`). X-axis: per sprint when project uses sprints; per calendar week when project has no sprints (auto-detect project mode).
- **Team Performance** → Leaderboard-style shadcn/ui `Table`. Columns: Avatar, Name, Atanan (Assigned), Tamamlanan (Completed), Zamanında % (On-time %), Devam Eden (In-progress). Inline mini progress bar for on-time %. Sortable by all columns.

**Sprint Burndown empty state:**
Modern overlay on top of the last completed sprint's chart (chart is faded/blurred behind overlay). Center content:
- "Aktif sprint bulunmuyor." text + relevant icon
- Primary CTA: "Yeni Sprint Başlat" → routes to sprint creation (`/projects/[id]/sprints`)
- Secondary CTA: "Son Sprinti Göster" → removes overlay to reveal the last sprint's full chart

**All UI text must be in Turkish.** (Consistent with Phase 5 decision.)

---

### Filter Bar (REPT-02)

**Single global filter bar** at the top of `/reports`. Changing any filter simultaneously updates all 4 panels.

| Filter | Behavior |
|--------|----------|
| **Proje** (Project) | Mandatory. Defaults to most recently active (or most recently created) project on initial load. Prevents empty-screen UX. |
| **Atanan** (Assignee) | Optional multi-select. Scopes charts AND the Team Performance table. |
| **Durum / Öncelik** (Status/Priority) | Optional. Scopes chart data for all panels. |
| **Tarih Aralığı** (Date Range) | Optional. Defaults to **Son 30 Gün** (Last 30 Days). Controls all charts and performance metrics. |

**Leaderboard drill-down:** Clicking a row in the Team Performance table sets the Assignee filter to that person — all 4 charts update to show only their tasks.

---

### Export (REPT-03)

**Both PDF and Excel** are delivered in Phase 6.

**Trigger:** Single "Dışa Aktar" button in the filter bar area. Clicking opens a dropdown:
- "PDF olarak indir"
- "Excel olarak indir"

When a format is clicked:
- Dropdown closes
- "Dışa Aktar" button shows loading spinner + becomes disabled
- File generates on the backend (respecting current filter state) and downloads automatically

**Filenames:** `SPMS_Report_[Project_Key]_[YYYY-MM-DD].pdf` / `.xlsx`

**Export content — data tables only** (no chart images).

| Format | Columns |
|--------|---------|
| **PDF** | Task key, title, status, assignee, priority, due date *(core fields — fits page width)* |
| **Excel** | All task fields: task key, title, status, assignee, priority, sprint, points, created date, due date, updated date, reporter |

**PDF document structure:**
- Header: "SPMS Raporu", project name, applied filters summary, generation timestamp
- Data table below

**Backend libraries to add to `requirements.txt`:**
- `weasyprint` (HTML → PDF via Jinja2 templates — same template system used in Phase 5 email templates)
- `openpyxl` (Excel generation)

---

### Performance Metrics (REPT-04)

**On-time delivery rate calculation:**
- **Primary rule:** Task is on-time if moved to a "done" status on or before its `due_date`.
- **Secondary fallback:** If task has no `due_date` but belongs to a sprint, use sprint `end_date` as the deadline.
- **Excluded:** Tasks with neither `due_date` nor sprint assignment are excluded from the on-time rate.
- Works across all methodologies (Scrum, Kanban, Waterfall) without special-casing.

**Time period:** Controlled by the global date range filter. Default: **Son 30 Gün**.

---

### Manager Dashboard (REPT-05)

**Wire existing mock metrics in `manager-view.tsx`:**
- "Active Tasks" (`-`) → real count via `/reports/summary` or equivalent API endpoint
- "Completed Tasks" (`-`) → real count

**New section below the Project Portfolio table:**
- Label: "Takım Performansı"
- Reuses the same leaderboard component built for `/reports`. Shows **top 5** members (by completed task count for the current period).
- "Tüm Raporları Gör →" link to `/reports`

**All dashboard text in Turkish:** "Aktif Görevler", "Tamamlanan Görevler", "Takım Performansı", "Tüm Raporları Gör →", etc.

---

### Access Control

All roles can access `/reports` but only see data for projects they are a member of. Admins see all projects. No role-based blocking of the page itself.

---

### Claude's Discretion

- Backend API endpoint structure for reports (single `/reports` endpoint with query params vs multiple `/reports/burndown`, `/reports/velocity` etc.)
- Whether "done" status detection uses `board_columns` name matching or a dedicated `is_done` boolean on the column model
- Exact Jinja2 PDF template design (layout, typography, SPMS branding colors)
- openpyxl cell styling (header row formatting, column widths)
- How "most recently active project" is determined (most recent task update, most recent login to that project, or most recently created)
- recharts responsive container configuration and color palette

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Reporting & Analytics (REPT) — REPT-01 through REPT-05 (exact acceptance criteria for all reporting requirements)

### Roadmap
- `.planning/ROADMAP.md` §Phase 6 — Goal, success criteria, and requirement mapping

### Existing stubs to replace
- `Frontend/app/reports/page.tsx` — current "coming soon" stub; Phase 6 replaces this entirely
- `Frontend/components/dashboard/manager-view.tsx` — manager dashboard with mock "-" values; Phase 6 wires real data and adds leaderboard section

### Prior phase context (patterns to follow)
- `.planning/phases/05-notifications/05-CONTEXT.md` — Jinja2 email templates pattern; WeasyPrint/openpyxl note in deferred section
- `.planning/phases/04-views-ui/04-CONTEXT.md` — List view sort/filter pattern, ConfirmDialog pattern, shadcn/ui Table usage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recharts` (2.15.4) — already installed in Frontend. Use `AreaChart`, `PieChart`, `BarChart`, `ResponsiveContainer`, `Tooltip`, `Legend`.
- `Frontend/app/reports/page.tsx` — 4-panel stub layout already structured as a `grid grid-cols-1 md:grid-cols-2`. Replace `CardContent` stubs with real chart components.
- `Frontend/components/dashboard/manager-view.tsx` — `metrics` array with "Active Tasks" / "Completed Tasks" as `"-"` — wire these to real API data.
- `shadcn/ui Table`, `Badge`, `Avatar`, `Card`, `Tabs` — all installed; use for leaderboard table and filter toggles.
- `Backend/app/infrastructure/database/models/audit_log.py` — `AuditLogModel` with `entity_type`, `entity_id`, `action`, `timestamp`, `user_id`. Source for task activity history used in performance metrics.
- `Backend/app/infrastructure/database/models/task.py` — `TaskModel` has `due_date`, `created_at`, `updated_at`, `assignee_id`, `sprint_id`, `column_id`, `points`, `priority`, `task_key`.
- `Backend/app/infrastructure/database/models/` — `SprintModel` has `start_date`, `end_date`; `BoardColumnModel` exists (use for "done" detection).
- Phase 5 Jinja2 HTML email templates in `Backend/` — reuse template system for PDF generation via WeasyPrint.
- `TanStack Query` — `useQuery` with filter params for data fetching; standard pattern across all phases.
- `sonner` (toast) — already installed; use for export success/error feedback.

### Established Patterns
- Clean Architecture: new reporting use cases live in `app/application/use_cases/`, repository interfaces in `app/domain/`, SQL implementations in `app/infrastructure/database/repositories/`.
- `FastAPI BackgroundTasks` — use for async PDF/Excel generation (non-blocking response). Return a task ID or stream the file directly.
- `TanStack Query` `useQuery` with filter query params — charts re-fetch when filter state changes.
- Phase 4 List view sort pattern — click column header to toggle `asc`/`desc`. Replicate in leaderboard table.
- Phase 5 notification preferences — per-type settings stored in DB. Follow same pattern for report filter persistence if needed.
- Load More pagination — not needed for charts; backend aggregation endpoints return summary data directly.

### Integration Points
- `Backend/app/api/v1/` — new `reports.py` router: `GET /reports/summary`, `GET /reports/burndown`, `GET /reports/velocity`, `GET /reports/distribution`, `GET /reports/performance`, `GET /reports/export/pdf`, `GET /reports/export/excel`
- `Frontend/app/reports/page.tsx` — full replacement of stubs with real chart components + global filter bar + export button
- `Frontend/components/dashboard/manager-view.tsx` — wire real task counts + add leaderboard section
- New: `Frontend/services/report-service.ts` — API calls for all reporting endpoints
- New: `Frontend/components/reports/` — chart components, filter bar, leaderboard table, export button

</code_context>

<specifics>
## Specific Ideas

- Sprint Burndown empty state: modern overlay (faded/blurred chart behind), "Aktif sprint bulunmuyor." + icon, "Yeni Sprint Başlat" primary button (routes to sprint creation), "Son Sprinti Göster" secondary button (removes overlay).
- Task Distribution donut: single panel with Status | Priority toggle at top. One chart redraws — no two separate charts.
- Velocity Trend: auto-detect methodology — if project has sprints, X-axis = sprint names. If no sprints, X-axis = calendar weeks.
- Default project on /reports load: most recently active project (avoids empty screen, satisfies REPT-02 without forcing explicit selection).
- Leaderboard row click = set Assignee filter. All 4 charts update automatically. No modal, no new page.
- PDF columns: task key, title, status, assignee, priority, due date (fits page width).
- Excel columns: all task fields (task key, title, status, assignee, priority, sprint, points, created, due, updated, reporter).
- PDF header: "SPMS Raporu" + project name + filter summary + timestamp.
- Filename format: `SPMS_Report_[Project_Key]_[YYYY-MM-DD].pdf` / `.xlsx`
- Export button UX: dropdown closes → button shows spinner + disabled → file downloads → button re-enables.
- Manager dashboard leaderboard: top 5 members only (compact version of /reports leaderboard). "Tüm Raporları Gör →" link.
- All UI text in Turkish throughout (page title: "Raporlar", filter labels in Turkish, chart tooltips in Turkish).

</specifics>

<deferred>
## Deferred Ideas

- Chart images in PDF export — server-side chart rendering (matplotlib/Pillow). Deferred; data table only is sufficient for Phase 6.
- Per-chart independent filters — each panel with its own filter set. Deferred; global filter bar is cleaner.
- Column-picker for export — user selects which fields to include. Deferred; format-based column sets (PDF=core, Excel=all) is simpler.
- Notification digest emails with performance data — future enhancement.
- Cross-project aggregate charts (comparing multiple projects simultaneously) — deferred to Phase 7+.
- WebSocket-based live chart updates — current approach is fetch-on-filter. Real-time deferred.
- View preference sync to backend (remembering last project selection across devices) — Claude's discretion or Phase 7.

</deferred>

---

*Phase: 06-reporting-analytics*
*Context gathered: 2026-04-07*
