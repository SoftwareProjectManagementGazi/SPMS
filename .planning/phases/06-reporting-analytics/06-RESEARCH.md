# Phase 6: Reporting & Analytics - Research

**Researched:** 2026-04-07
**Domain:** Data aggregation, chart rendering (recharts), file export (openpyxl, WeasyPrint), FastAPI reporting endpoints
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Charts & Layout (REPT-01)**
- Four panels: Sprint Burndown (AreaChart), Task Distribution (PieChart donut with Status/Priority toggle), Velocity Trend (BarChart), Team Performance (shadcn/ui Table leaderboard).
- Sprint Burndown empty state: modern overlay on faded/blurred last sprint chart. "Aktif sprint bulunmuyor." + "Yeni Sprint Başlat" CTA + "Son Sprinti Göster" secondary.
- Task Distribution toggle: tab-style "Status | Priority" — single chart redraws.
- Velocity Trend: auto-detect — sprint names on X if project has sprints, else calendar weeks.
- Team Performance columns: Avatar, Name, Atanan, Tamamlanan, Zamanında %, Devam Eden. Sortable. Inline mini progress bar for on-time %.
- **All UI text in Turkish.**

**Filter Bar (REPT-02)**
- Single global filter bar at top of `/reports`. All 4 panels update simultaneously on any filter change.
- Proje: mandatory, defaults to most recently active project on load.
- Atanan: optional multi-select. Durum/Öncelik: optional. Tarih Aralığı: optional, defaults to Son 30 Gün.
- Leaderboard row click sets Assignee filter — all charts update.

**Export (REPT-03)**
- Both PDF and Excel in Phase 6.
- "Dışa Aktar" dropdown button → "PDF olarak indir" / "Excel olarak indir".
- Button: loading spinner + disabled during generation → auto-download on completion.
- Filenames: `SPMS_Report_[Project_Key]_[YYYY-MM-DD].pdf` / `.xlsx`
- PDF: data table only (task key, title, status, assignee, priority, due date). Header: "SPMS Raporu" + project name + filter summary + timestamp.
- Excel: all task fields (task key, title, status, assignee, priority, sprint, points, created, due, updated, reporter).
- Backend libraries: `weasyprint` (HTML→PDF via Jinja2), `openpyxl` (Excel). Add both to `requirements.txt`.

**Performance Metrics (REPT-04)**
- On-time: task moved to "done" status on or before `due_date`. Fallback: if no `due_date` but has sprint, use sprint `end_date`. Tasks with neither are excluded.
- Time period: controlled by global date range filter. Default: Son 30 Gün.

**Manager Dashboard (REPT-05)**
- Wire "Active Tasks" and "Completed Tasks" metrics in `manager-view.tsx` to real API data.
- New "Takım Performansı" section below Project Portfolio table: reuses leaderboard component, top 5 only, "Tüm Raporları Gör →" link to `/reports`.
- All dashboard text in Turkish.

**Access Control**
- All roles can access `/reports`; data scoped to projects user is a member of. Admins see all.

### Claude's Discretion

- Backend API endpoint structure (single `/reports` with query params vs multiple `/reports/burndown`, `/reports/velocity`, etc.)
- Whether "done" status detection uses `board_columns` name matching or a dedicated `is_done` boolean
- Exact Jinja2 PDF template design (layout, typography, SPMS branding colors)
- openpyxl cell styling (header row formatting, column widths)
- How "most recently active project" is determined
- recharts `ResponsiveContainer` configuration and color palette

### Deferred Ideas (OUT OF SCOPE)

- Chart images in PDF export (server-side rendering with matplotlib/Pillow)
- Per-chart independent filters
- Column-picker for export (user selects fields)
- Notification digest emails with performance data
- Cross-project aggregate charts
- WebSocket-based live chart updates
- View preference sync to backend across devices
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REPT-01 | Proje ilerleme durumu grafiksel olarak sunulur (görev tamamlanma oranı, sprint ilerleme grafiği) | recharts AreaChart/PieChart/BarChart APIs documented; burndown data aggregation query patterns identified; ResponsiveContainer usage confirmed |
| REPT-02 | Raporlar kullanıcı, görev ve proje bazlı filtrelenebilir | React state + TanStack Query re-fetch on filter param change; URL search params pattern; multi-select dropdown via existing Radix DropdownMenuCheckboxItem |
| REPT-03 | Rapor çıktısı PDF veya Excel formatında dışa aktarılabilir | openpyxl 3.1.2 present in venv; WeasyPrint NOT yet installed (requires pip install + system deps cairo/pango); FastAPI StreamingResponse pattern for file download confirmed |
| REPT-04 | Kullanıcı performans metrikleri hesaplanır (tamamlanan görev sayısı, zamanında teslim oranı) | on-time calculation rule defined; AuditLogModel has action/timestamp for "moved to done" detection; TaskModel has due_date and sprint_id |
| REPT-05 | Yönetici dashboard'unda performans verileri özet olarak gösterilir | manager-view.tsx examined; metrics array with "-" placeholders identified; leaderboard component reuse pattern defined |
</phase_requirements>

---

## Summary

Phase 6 wires the existing 4-panel `/reports` stub page to real backend data, adds a global filter bar, implements PDF/Excel export via backend generation, and upgrades the manager dashboard with real task counts and a team leaderboard.

The frontend already has all chart libraries installed (`recharts` 2.15.4, all shadcn/ui primitives). The backend already has `openpyxl` 3.1.2 in the venv but `weasyprint` is NOT installed — this is the critical dependency to address in Wave 0. WeasyPrint also requires system-level libraries (`pango`, `cairo`) via Homebrew that are not currently installed on this machine.

The core backend work is writing new SQL aggregation queries (burndown series, velocity series, task distribution counts, on-time rate per member) and exposing them as FastAPI endpoints with query-param filtering. The "done" column detection (ilike('%done%') pattern, already used in Phase 4 sprint closing) is the right approach and avoids schema changes. All aggregation is read-only — no new database tables or migrations are needed.

**Primary recommendation:** Build the backend reporting endpoints first (they are the dependency for all frontend charts), then build frontend components from the filter bar down to individual charts, and tackle PDF/WeasyPrint last (most complex dependency chain).

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` exists in this project. No project-specific constraints beyond what is documented in CONTEXT.md and the established codebase patterns described below.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.15.4 (in project) | AreaChart, BarChart, PieChart (donut), ResponsiveContainer, Tooltip, Legend | Already installed; used in Phase 4 stub layout; React-native chart library |
| openpyxl | 3.1.2 (in project venv) | Excel .xlsx generation | Already in venv; Python's de-facto xlsx library; confirmed via `pip list` |
| weasyprint | NOT installed — must add | HTML→PDF generation via Jinja2 templates | Decided in CONTEXT.md; same template system as Phase 5 email templates |
| Jinja2 | 3.1.4 (in project venv) | HTML template rendering for PDF | Already used in Phase 5 fastapi-mail templates |
| TanStack Query | ^5.90.16 (in project) | `useQuery` with filter params for chart data fetching | Project-wide standard |
| FastAPI StreamingResponse | (fastapi 0.133.0) | Stream generated PDF/Excel bytes to browser | Built-in; enables content-disposition: attachment header |
| shadcn/ui Table | (in project) | Team Performance leaderboard | Already used in manager-view.tsx and Phase 4 list view |
| Radix DropdownMenu | (in project) | "Dışa Aktar" button dropdown + multi-select assignee filter | Already installed; DropdownMenuCheckboxItem used in Phase 4 |
| Radix Tabs | (in project) | Status/Priority toggle on Task Distribution panel | Already installed |
| sonner | ^1.7.4 (in project) | Export success/error toast feedback | Project-wide standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | latest (in project) | Date range calculations, week grouping for velocity | Already in project; used in Phase 4 calendar |
| SQLAlchemy | 2.0.46 (in project venv) | Async aggregation queries (func.count, group_by) | All DB access goes through SQLAlchemy async |
| FastAPI BackgroundTasks | (built-in) | Non-blocking generation — return StreamingResponse directly (not background task, since we need the bytes synchronously to stream them) | For async email; NOT the right fit here — see Pitfall 3 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| weasyprint | reportlab | reportlab is programmatic (no HTML template reuse); weasyprint reuses existing Jinja2 HTML template system from Phase 5 |
| weasyprint | pdfkit (wkhtmltopdf) | pdfkit requires wkhtmltopdf binary (larger dep); weasyprint is pure Python install |
| openpyxl | xlsxwriter | openpyxl already in venv; xlsxwriter is more performant for large files but overkill here |
| recharts | chart.js / react-chartjs-2 | recharts already installed; switching adds no value |
| Multiple `/reports/*` endpoints | Single `/reports` with query params | CONTEXT.md leaves this to Claude's discretion — see Architecture Patterns recommendation |

**Installation (backend — add to requirements.txt):**
```bash
# In Backend/.venv (or requirements.txt)
pip install weasyprint

# System dependencies (macOS — must be done BEFORE pip install)
brew install pango  # pulls in cairo, glib, harfbuzz, gdk-pixbuf as deps
```

**Version verification:**
- `recharts` 2.15.4 is in project `package.json` — confirmed against npm latest (3.8.1). The API used (AreaChart, BarChart, PieChart, ResponsiveContainer) is stable and unchanged between 2.x and 3.x for the components used here. No upgrade needed.
- `openpyxl` 3.1.2 verified via `.venv/bin/pip list`.
- `weasyprint` pip latest: 68.1 — install into `.venv`.

---

## Architecture Patterns

### Recommended Project Structure

```
Backend/app/
├── api/v1/reports.py                         # NEW: reports router
├── application/
│   ├── dtos/report_dtos.py                   # NEW: response DTOs
│   └── use_cases/generate_reports.py         # NEW: all reporting use cases
├── domain/repositories/report_repository.py  # NEW: IReportRepository interface
└── infrastructure/
    ├── database/repositories/report_repo.py  # NEW: SQL aggregation queries
    └── email/templates/report.html           # NEW: Jinja2 PDF template

Frontend/
├── app/reports/page.tsx                      # REPLACE: full rewrite
├── services/report-service.ts               # NEW: API calls
└── components/reports/
    ├── filter-bar.tsx                        # NEW: global filter state + controls
    ├── sprint-burndown-chart.tsx             # NEW: AreaChart panel
    ├── task-distribution-chart.tsx           # NEW: PieChart (donut) panel
    ├── velocity-trend-chart.tsx              # NEW: BarChart panel
    ├── team-performance-table.tsx            # NEW: leaderboard table (reusable)
    └── export-button.tsx                     # NEW: dropdown + loading state
```

### Pattern 1: Backend Endpoint Structure (Claude's Discretion resolved)

**Recommendation: Multiple focused endpoints under `/api/v1/reports/`**, not a single monolithic endpoint. Reason: each chart needs different aggregation SQL; bundling them means one slow query blocks all charts. Each chart fetches independently and shows its own loading state.

```
GET /api/v1/reports/summary         # Active + Completed task counts (manager dashboard)
GET /api/v1/reports/burndown        # Sprint burndown series [{date, remaining, total}]
GET /api/v1/reports/velocity        # Velocity series [{sprint_name|week, completed_points}]
GET /api/v1/reports/distribution    # Task distribution [{status|priority, count}]
GET /api/v1/reports/performance     # Per-member metrics [{user_id, name, assigned, completed, on_time_pct, in_progress}]
GET /api/v1/reports/export/pdf      # StreamingResponse — PDF download
GET /api/v1/reports/export/excel    # StreamingResponse — Excel download
```

All data endpoints accept common query params: `project_id` (required), `assignee_ids` (optional, comma-separated), `date_from` (optional ISO date), `date_to` (optional ISO date).

**Router registration in `main.py`:**
```python
from app.api.v1.reports import router as reports_router
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
```

### Pattern 2: "Done" Column Detection (Claude's Discretion resolved)

**Recommendation: Use `ilike('%done%')` on `BoardColumnModel.name`** — consistent with the Phase 4 sprint-closing pattern already in the codebase (`[04-01]: Sprint done detection uses ilike('%done%') column name matching`). No schema change needed. Do NOT add an `is_done` boolean to `BoardColumnModel` in Phase 6 (that is a Phase 7+ concern).

```python
# Source: Phase 4 established pattern (board_column_repo.py)
from sqlalchemy import func
done_columns = (
    select(BoardColumnModel.id)
    .where(
        BoardColumnModel.project_id == project_id,
        BoardColumnModel.name.ilike("%done%")
    )
)
```

### Pattern 3: On-Time Rate Calculation

```python
# Source: CONTEXT.md REPT-04 rule
# Task is on-time if: moved to done column on or before due_date (or sprint.end_date as fallback)
# Detection: AuditLogModel action="updated" + field_name="column_id" + new_value IN done_column_ids

# Step 1: find done column IDs for project
# Step 2: query AuditLog for entity_type="task", action="updated", field_name="column_id",
#         new_value IN [done_col_ids as strings], timestamp BETWEEN date_from AND date_to
# Step 3: for each task's first "moved to done" audit entry:
#         compare timestamp.date() <= task.due_date OR sprint.end_date
# Step 4: on_time_pct = (on_time_count / total_done_count) * 100, rounded to 1 decimal
```

**Note:** `AuditLogModel.new_value` is `Text` (stores the new column_id as a string). The done detection join must cast to int or compare as string.

### Pattern 4: recharts Chart Components

```typescript
// Source: recharts 2.15.4 — AreaChart (Sprint Burndown)
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

<ResponsiveContainer width="100%" height={220}>
  <AreaChart data={burndownData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="remaining" stroke="#4f46e5" fill="#ede9fe" />
  </AreaChart>
</ResponsiveContainer>
```

```typescript
// Source: recharts 2.15.4 — PieChart donut (Task Distribution)
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

<ResponsiveContainer width="100%" height={220}>
  <PieChart>
    <Pie data={distributionData} cx="50%" cy="50%"
         innerRadius={55} outerRadius={85}
         dataKey="count" nameKey="label">
      {distributionData.map((_, i) => (
        <Cell key={i} fill={COLORS[i % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

```typescript
// Source: recharts 2.15.4 — BarChart (Velocity Trend)
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

<ResponsiveContainer width="100%" height={220}>
  <BarChart data={velocityData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
    <YAxis />
    <Tooltip />
    <Bar dataKey="points" fill="#4f46e5" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Pattern 5: FastAPI File Export via StreamingResponse

```python
# Source: FastAPI docs — StreamingResponse for file download
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import io
import openpyxl
from datetime import date

@router.get("/export/excel")
async def export_excel(
    project_id: int,
    date_from: date = Query(None),
    date_to: date = Query(None),
    current_user: User = Depends(get_current_user),
    # ... repos
):
    tasks = await fetch_filtered_tasks(project_id, date_from, date_to, ...)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "SPMS Raporu"
    headers = ["Görev Kodu", "Başlık", "Durum", "Atanan", "Öncelik",
               "Sprint", "Puan", "Oluşturulma", "Bitiş Tarihi", "Güncelleme", "Raporlayan"]
    ws.append(headers)
    for task in tasks:
        ws.append([task.task_key, task.title, ...])
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    filename = f"SPMS_Report_{project_key}_{date.today()}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
```

```python
# Source: WeasyPrint docs — HTML string → PDF bytes
from weasyprint import HTML
import jinja2

template_loader = jinja2.FileSystemLoader("app/infrastructure/email/templates")
env = jinja2.Environment(loader=template_loader)
template = env.get_template("report.html")
html_string = template.render(project=project, tasks=tasks, filters=filters, generated_at=...)
pdf_bytes = HTML(string=html_string).write_pdf()
buffer = io.BytesIO(pdf_bytes)
return StreamingResponse(buffer, media_type="application/pdf",
    headers={"Content-Disposition": f"attachment; filename={filename}"})
```

### Pattern 6: TanStack Query with Filter Params (established pattern)

```typescript
// Source: Phase 4 established pattern — re-fetch when filter state changes
const [filters, setFilters] = useState<ReportFilters>({
  projectId: defaultProjectId,
  assigneeIds: [],
  dateFrom: subDays(new Date(), 30),
  dateTo: new Date(),
})

const { data: burndownData, isLoading } = useQuery({
  queryKey: ["reports", "burndown", filters],
  queryFn: () => reportService.getBurndown(filters),
  enabled: !!filters.projectId,
})
```

### Pattern 7: "Most Recently Active Project" (Claude's Discretion resolved)

**Recommendation:** Use the project with the most recent `updated_at` among the current user's member projects. This is the simplest query (no extra joins beyond project membership) and correctly reflects "most recently touched" regardless of methodology. The `/reports/summary` or a new lightweight `/reports/default-project` endpoint can return this as part of initial page load.

### Pattern 8: Clean Architecture for Reporting Use Cases

```
# New interfaces added to domain layer
Backend/app/domain/repositories/report_repository.py

class IReportRepository(ABC):
    async def get_summary(self, project_id, user_id, ...) -> SummaryDTO: ...
    async def get_burndown(self, project_id, sprint_id, ...) -> list[BurndownPoint]: ...
    async def get_velocity(self, project_id, ...) -> list[VelocityPoint]: ...
    async def get_distribution(self, project_id, ...) -> list[DistributionPoint]: ...
    async def get_performance(self, project_id, ...) -> list[MemberPerformance]: ...
    async def get_tasks_for_export(self, project_id, ...) -> list[TaskExportRow]: ...
```

### Anti-Patterns to Avoid

- **Joining AuditLog for every task row in a single query:** Group the audit log lookup separately; a massive JOIN across all tasks × all audit entries will be slow.
- **Returning raw SQLAlchemy models from reporting queries:** Use lightweight dataclass/TypedDict result objects to avoid N+1 lazy-load issues.
- **Putting chart-rendering logic in `page.tsx`:** Each chart must be a standalone component in `components/reports/` so the leaderboard can be reused in `manager-view.tsx`.
- **Using BackgroundTasks for synchronous file generation:** `BackgroundTasks` runs AFTER the response is sent — you cannot stream a file that way. Generate synchronously inside the endpoint, then return `StreamingResponse`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel file generation | Custom CSV/XML writer | `openpyxl` (already in venv) | Cell formatting, column width, headers — openpyxl handles all of it |
| PDF generation | Custom HTML string concat | `weasyprint` + Jinja2 HTML template | CSS layout, page breaks, character encoding — WeasyPrint handles all of it; Jinja2 template system already in place |
| Chart rendering | Custom SVG/Canvas components | `recharts` (already installed) | Axis scaling, tooltips, legends, responsive layout — recharts handles all of it |
| Date range arithmetic | Manual date math | `date-fns` (already installed) | DST edge cases, week numbering, locale |
| Filter state synchronization | Manual prop drilling | `useState` at page level + pass to `useQuery` queryKey | TanStack Query re-fetches automatically when queryKey changes |
| "done" status detection | Hardcoded status string enum | `ilike('%done%')` on `board_columns.name` | Project already uses this pattern (Phase 4); handles custom column names |

**Key insight:** All the heavy lifting libraries (recharts, openpyxl, Jinja2, TanStack Query, shadcn/ui Table) are already installed. The work is wiring them together with aggregation queries — not building infrastructure.

---

## Common Pitfalls

### Pitfall 1: WeasyPrint Missing System Dependencies on macOS

**What goes wrong:** `pip install weasyprint` succeeds but `import weasyprint; HTML(string="<p>test</p>").write_pdf()` raises `OSError: cannot load library 'libpango-1.0.0'` at runtime.

**Why it happens:** WeasyPrint relies on `pango` and `cairo` system libraries (via `cffi` bindings) that are NOT bundled in the pip package. On macOS, these must be installed via Homebrew.

**How to avoid:** Install system deps BEFORE `pip install weasyprint`:
```bash
brew install pango   # pulls cairo, glib, harfbuzz, gdk-pixbuf as transitive deps
pip install weasyprint
```
Verify: `python3 -c "from weasyprint import HTML; print(HTML(string='<p>ok</p>').write_pdf()[:4])"` should print `b'%PDF'`.

**Warning signs:** `OSError` or `ImportError` mentioning `libpango`, `libcairo`, or `libgobject` on first PDF generation.

**Current state:** `cairo` and `pango` are NOT installed on this machine. This is a Wave 0 blocker for PDF export.

---

### Pitfall 2: WeasyPrint NOT in venv — Must Be Added to requirements.txt

**What goes wrong:** `weasyprint` is decided in CONTEXT.md but is missing from both `requirements.txt` and the `.venv`. The planner must create an install task.

**How to avoid:** Wave 0 plan must include:
1. Add `weasyprint` to `Backend/requirements.txt`
2. `brew install pango` (system dep)
3. `.venv/bin/pip install weasyprint`

---

### Pitfall 3: BackgroundTasks Cannot Stream File to Client

**What goes wrong:** Using `FastAPI BackgroundTasks` for PDF/Excel generation because "it's non-blocking." But `BackgroundTasks` runs AFTER the response is sent — you cannot attach a file to a response that was already committed.

**Why it happens:** Confusion between "background task" (fire-and-forget after response) and "async endpoint" (still within the request/response cycle).

**How to avoid:** Generate the file synchronously inside the async endpoint, wrap in `io.BytesIO`, return `StreamingResponse`. The generation itself is fast (small report, in-memory) — no need for task queues.

---

### Pitfall 4: AuditLog new_value Is Text, Not Integer

**What goes wrong:** On-time rate calculation queries `AuditLogModel.new_value IN [done_column_ids]` but `done_column_ids` is a list of `int`. SQLAlchemy will not auto-cast; the comparison always returns no rows.

**Why it happens:** `AuditLogModel.new_value` is `Column(Text, ...)`. When a task moves to a column, the column_id integer is stored as a string (`"7"`).

**How to avoid:** Cast in the query:
```python
# Use CAST or compare as string
AuditLogModel.new_value.in_([str(cid) for cid in done_column_ids])
```

---

### Pitfall 5: recharts ResponsiveContainer Needs a Sized Parent

**What goes wrong:** Chart renders at zero height (invisible) because `ResponsiveContainer width="100%" height={220}` is inside a `CardContent` with no explicit height constraint, and the parent collapses.

**Why it happens:** `ResponsiveContainer` uses percentage dimensions relative to its parent. If the parent has `display: flex` with no `height`, it collapses.

**How to avoid:** Wrap in a `div` with explicit height:
```tsx
<CardContent>
  <div style={{ width: "100%", height: 220 }}>
    <ResponsiveContainer width="100%" height="100%">
      {/* chart */}
    </ResponsiveContainer>
  </div>
</CardContent>
```

---

### Pitfall 6: Velocity Trend X-Axis Label Overflow

**What goes wrong:** Sprint names ("Sprint 1 — Frontend MVP") are long and overflow or overlap on the BarChart X-axis.

**How to avoid:** Truncate sprint names to 12 characters in the frontend mapper, or use `angle={-30}` on `XAxis tick` with `height={50}`. For calendar weeks, use `"W{n}"` format (e.g., "W14").

---

### Pitfall 7: Multi-Select Assignee Filter Causes Full Page Re-render on Each Click

**What goes wrong:** Each checkbox click in the Assignee multi-select triggers a new `useQuery` fetch for all 4 charts simultaneously, causing a flash of loading states.

**How to avoid:** Debounce the filter state change by 300ms before propagating to `useQuery`. Or use a local "pending filters" state that only commits to `useQuery` on "Apply" — but CONTEXT.md says filters update immediately, so use debounce only.

---

### Pitfall 8: Project Membership Scoping on Report Endpoints

**What goes wrong:** Forgetting to check that `project_id` in the query param belongs to a project the current user is a member of (or is admin). All existing project-scoped endpoints use `get_project_member` dependency.

**How to avoid:** Use the existing `get_project_member` dependency pattern or replicate its membership check inline (as done in sprint/comment endpoints). Add `get_project_member` check to all report endpoints.

---

## Code Examples

### Burndown Data Aggregation (Backend)

```python
# Source: SQLAlchemy 2.0 async pattern — used throughout project
from sqlalchemy import select, func, and_
from datetime import date, timedelta

async def get_burndown(self, project_id: int, sprint_id: int, session: AsyncSession):
    # Get sprint date range
    sprint = await session.get(SprintModel, sprint_id)
    if not sprint:
        return []

    # Get done column IDs
    done_cols = (await session.execute(
        select(BoardColumnModel.id)
        .where(BoardColumnModel.project_id == project_id,
               BoardColumnModel.name.ilike("%done%"))
    )).scalars().all()

    # Total tasks in sprint at start
    total_stmt = select(func.count(TaskModel.id)).where(
        TaskModel.sprint_id == sprint_id,
        TaskModel.deleted_at.is_(None)
    )
    total = (await session.execute(total_stmt)).scalar_one()

    # Build daily series: for each day, count tasks NOT yet moved to done
    series = []
    current = sprint.start_date
    while current <= min(sprint.end_date, date.today()):
        done_by_day = (await session.execute(
            select(func.count()).select_from(AuditLogModel)
            .where(
                AuditLogModel.entity_type == "task",
                AuditLogModel.field_name == "column_id",
                AuditLogModel.new_value.in_([str(c) for c in done_cols]),
                func.date(AuditLogModel.timestamp) <= current,
                # Only tasks in this sprint
            )
        )).scalar_one()
        series.append({"date": str(current), "remaining": total - done_by_day})
        current += timedelta(days=1)
    return series
```

### openpyxl Header Row Styling

```python
# Source: openpyxl docs — header formatting
from openpyxl.styles import Font, PatternFill, Alignment

ws = wb.active
header_font = Font(bold=True, color="FFFFFF")
header_fill = PatternFill("solid", fgColor="1a1a2e")  # SPMS brand dark
for col_num, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_num, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center")

# Auto column widths
for col in ws.columns:
    max_length = max(len(str(cell.value or "")) for cell in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_length + 4, 40)
```

### Export Button with Loading State (Frontend)

```typescript
// Source: established pattern — sonner + useState for async operations
const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null)

const handleExport = async (format: "pdf" | "excel") => {
  setExporting(format)
  try {
    const blob = await reportService.exportReport(format, filters)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `SPMS_Report_${filters.projectKey}_${format === "pdf" ? "pdf" : "xlsx"}`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error("Dışa aktarma başarısız oldu.")
  } finally {
    setExporting(null)
  }
}
```

### Manager Dashboard Summary Query (Backend)

```python
# GET /api/v1/reports/summary?project_id=X
# Returns active + completed task counts scoped to project

active_count = select(func.count(TaskModel.id)).where(
    TaskModel.project_id == project_id,
    TaskModel.column_id.not_in(done_col_ids),
    TaskModel.deleted_at.is_(None)
)
completed_count = select(func.count(TaskModel.id)).where(
    TaskModel.project_id == project_id,
    TaskModel.column_id.in_(done_col_ids),
    TaskModel.deleted_at.is_(None)
)
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| recharts | All chart components | Yes | 2.15.4 (in package.json) | — |
| openpyxl | Excel export | Yes | 3.1.2 (in .venv pip list) | — |
| Jinja2 | PDF HTML template | Yes | 3.1.4 (in .venv pip list) | — |
| weasyprint | PDF export | No | Not installed | Must install (pip + brew system deps) |
| pango (system) | weasyprint dep | No | Not installed | Must install via `brew install pango` |
| cairo (system) | weasyprint dep (transitive) | No | Not installed | Installed as pango dep automatically |
| TanStack Query | Filter re-fetching | Yes | ^5.90.16 (in package.json) | — |
| shadcn/ui Table | Leaderboard | Yes | (in project) | — |
| FastAPI StreamingResponse | File download | Yes | fastapi 0.133.0 (built-in) | — |
| date-fns | Date range math | Yes | latest (in package.json) | — |
| Node.js / npm | Frontend build | Yes | (project already running) | — |
| Python 3.11 | Backend | Yes | 3.11.14 (.venv) | — |

**Missing dependencies with no fallback:**
- `weasyprint` (pip) — blocks PDF export. Must be installed before PDF endpoint can be implemented.
- `pango` (brew system lib) — blocks weasyprint import. Must be installed first.

**Missing dependencies with fallback:**
- None beyond weasyprint/pango.

**Wave 0 action required:**
```bash
brew install pango          # system dependency for WeasyPrint
.venv/bin/pip install weasyprint
# Add 'weasyprint' to Backend/requirements.txt
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts 2.x (installed) | recharts 3.x (npm latest) | 2024 | 2.x is still maintained; API for AreaChart/BarChart/PieChart is identical. No upgrade needed. |
| openpyxl 3.0.x | openpyxl 3.1.2 (in venv) | 2023 | No breaking changes for usage pattern here. |
| TanStack Query v4 (onSuccess in useQuery) | TanStack Query v5 (no onSuccess) | 2023 | **Critical:** `onSuccess` removed from `useQuery`. Use `useEffect` for side effects on data change. Already addressed in Phase 4 `[04-03]` decision. |
| FastAPI BackgroundTasks for file gen | FastAPI StreamingResponse (in-endpoint) | N/A | BackgroundTasks cannot stream files — use synchronous endpoint with StreamingResponse. |

**Deprecated/outdated:**
- `onSuccess` in `useQuery` (TanStack Query v5): replaced by `useEffect(() => {...}, [data])`. All Phase 5 and 4 code already follows this.

---

## Open Questions

1. **WeasyPrint CSS support scope on macOS**
   - What we know: WeasyPrint 68.x supports CSS flexbox, fonts, tables. Does not support CSS grid fully.
   - What's unclear: Whether the SPMS brand font (likely system font) renders correctly in WeasyPrint PDF.
   - Recommendation: Use only basic CSS in the PDF template (table layout, no CSS grid, specify `font-family: Arial, sans-serif` for universal render). Test with a minimal template in Wave 0.

2. **Burndown data for projects without an active sprint**
   - What we know: CONTEXT.md defines the empty-state UI (overlay with CTA). The backend endpoint receives a `sprint_id` param.
   - What's unclear: How `sprint_id` is determined when multiple sprints exist. Should the frontend auto-select the active sprint (`is_active = True`)?
   - Recommendation: Backend `/reports/burndown` requires `sprint_id`. Frontend auto-selects the active sprint from the sprint list; if none is active, renders the empty state overlay instead of calling the burndown endpoint.

3. **Velocity trend grouping by calendar week when no sprints**
   - What we know: X-axis should be calendar weeks. `date-fns` `getWeek()` provides ISO week numbers.
   - What's unclear: Should velocity count completed task points or task count when a project has no `points` set?
   - Recommendation: If `points` is null for a task, count as 1 point (treat as unestimated task count). Document this in a comment in the aggregation query.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection — `Frontend/app/reports/page.tsx`, `Frontend/components/dashboard/manager-view.tsx`, `Backend/app/api/main.py`, `Backend/app/infrastructure/database/models/task.py`, `Backend/app/infrastructure/database/models/audit_log.py`, `Backend/app/infrastructure/database/models/board_column.py`, `Backend/app/infrastructure/database/models/sprint.py`, `Backend/app/infrastructure/database/models/project.py`
- `.venv/bin/pip list` — openpyxl 3.1.2, Jinja2 3.1.4, fastapi 0.133.0, SQLAlchemy 2.0.46 confirmed installed
- `Frontend/package.json` — recharts 2.15.4, @tanstack/react-query ^5.90.16, sonner ^1.7.4, date-fns confirmed installed
- `brew info weasyprint` — version 68.1, not installed
- `brew info pango` — version 1.57.1, not installed
- `Backend/app/api/main.py` — router registration pattern confirmed
- `Backend/app/api/dependencies.py` — DI container pattern confirmed
- Phase 4 STATE.md decision `[04-01]` — ilike('%done%') column detection pattern
- Phase 5 STATE.md decision `[05-07]` — BackgroundTasks is a FastAPI special param pattern

### Secondary (MEDIUM confidence)
- npm registry: recharts latest 3.x — confirmed 2.x API compatibility for used components
- WeasyPrint official docs (https://doc.courtbouillon.org/weasyprint/stable/) — CSS support matrix, system deps requirement
- openpyxl official docs (https://openpyxl.readthedocs.io) — Workbook/Worksheet API

### Tertiary (LOW confidence)
- None — all claims are backed by primary or secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via codebase inspection and pip/npm lists
- Architecture: HIGH — endpoint patterns derived from existing router code; Clean Architecture structure consistent with all prior phases
- Pitfalls: HIGH — WeasyPrint missing deps verified by `brew list`; AuditLog text type verified by model inspection; BackgroundTasks behavior verified by FastAPI docs + Phase 5 pattern
- Environment: HIGH — verified via direct tool probing (`brew`, `.venv/bin/pip list`)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable libraries; WeasyPrint system dep check should be re-verified at plan execution time)
