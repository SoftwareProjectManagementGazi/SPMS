# Reports Migration Plan v2 (Prototype-Fidelity + Strategy D)

**Status:** DRAFT v2 (post peer review, awaiting user approval)
**Author:** Claude (Opus 4.7)
**Created:** 2026-05-20
**Revised:** 2026-05-20 after peer review by 2 senior architect agents
**Strategy:** D — Capability + Data-Driven Chart Gating, with **strict prototype fidelity** for visual layout
**Scope:** Wire `Frontend2/app/(shell)/reports/page.tsx` to live data, replace 4 placeholders, add capability-driven visibility gating. Backend refactor of `chart_applicability.py` ships in the same PR.

---

## 0. Change Log vs v1

| v1 (rejected) | v2 (this doc) | Rationale |
|---|---|---|
| Source: legacy `Frontend/app/reports/page.tsx` | Source: prototype `New_Frontend/src/pages/misc.jsx:356-534` | Memory rule violation — "ALL UI from prototype" |
| 5 new chart components (Burndown, Distribution, Velocity, TeamPerf, PhaseProgress) | 3 components (Burndown, TeamLoadCard, PhaseProgressChart) — Distribution/Velocity/TeamPerformanceTable dropped | Not in prototype |
| AssigneeFilter + multi-select + custom date picker + FilterBar | None — prototype has only [Q2 2026] + [PDF] buttons right-aligned | Not in prototype |
| Sparklines on StatCards | None — prototype StatCard uses `delta` prop (already shipped) | Not in prototype |
| PDF Preview Modal | `window.open(blobUrl)` direct view; download as default | CSP risk + no modal in prototype |
| Toast primitive (NEW) | AlertBanner reuse | Memory rule violation |
| DropdownMenu primitive (NEW) | Two separate buttons (PDF / Excel) OR single button + browser native menu | Memory rule violation |
| `useState` filters | `useSearchParams` URL state (Next.js 16 Suspense pattern) | Audit page precedent + bookmark-shareable |
| FE-side capability composition (3 hooks) | BE endpoint `/projects/{id}/chart-capabilities` → 1 hook | Both peer reviewers required this |
| `chart_applicability_for` shim kept 1 phase | Delete in same commit (only 1 caller exists) | Single-caller, no external consumer |
| `NoIterationDataError` HTTP 422 | Return `200 + sprints=[]` (consistent with `get_burndown` empty pattern) | Empty result ≠ unprocessable entity |
| PhaseProgress FE aggregation from `useTasksByProject` | BE endpoint `/projects/{id}/charts/phase-progress` | N-task fetch is perf regression at scale |
| 22 small commits across 7 waves | 8-10 logical commits across 5 waves | Reviewer feedback: smaller scope = cleaner PR |
| `ChartCapabilitySnapshot` dataclass (6 fields) | Rule registry `CHART_CAPABILITY_RULES: dict[str, Callable]` (OCP-clean) | Backend reviewer A1 |

---

## 1. Prototype Visual Contract

**Source of truth:** `New_Frontend/src/pages/misc.jsx:356-534`.

```
┌─────────────────────────────────────────────────────────────┐
│ Raporlar                                                     │
│ Performans ve verimlilik metrikleri    [Q2 2026 ▾] [PDF ▾]  │
├─────────────────────────────────────────────────────────────┤
│ [Sprint Velocity 48 +6pts] [Cycle 3.2d -0.4d]                │
│ [Completed 124 +18%]       [Blockers 3 -2]                   │  ← StatCard×4 WITH delta prop
├──────────────────────────────────┬───────────────────────────┤
│ Burndown — Sprint 23 (1.5fr)     │ Takım Yükü (1fr)          │
│ ─ Ideal line (dashed)            │ • User 1 ── 65%           │
│ ─ Actual line (solid + dots)     │ • User 2 ── 80% (orange)  │
│ X: D1..D15  Y: remaining         │ • User 3 ── 92% (red)     │
│                                  │ • User 4..6               │
├──────────────────────────────────┴───────────────────────────┤
│ CFD (full width) — already shipped (Phase 13)                │
├──────────────────────────────────┬───────────────────────────┤
│ Lead Time (1fr) — already shipped│ Cycle Time (1fr) — done   │
├──────────────────────────────────┴───────────────────────────┤
│ Iteration Comparison (full) — already shipped                │
├─────────────────────────────────────────────────────────────┤
│ Phase Progress (full) — NEW, Strategy D differentiator       │
│ (justified: prototype's "Faz Raporları" table replaced       │
│  by a chart-style progress visualization for projects with   │
│  phase_workflow.nodes; the existing PhaseReportsSection      │
│  remains BELOW it as the report archive)                     │
├─────────────────────────────────────────────────────────────┤
│ Faz Raporları (existing PhaseReportsSection, unchanged)      │
└─────────────────────────────────────────────────────────────┘
```

**Deliberate prototype extensions** (per `feedback_quality_bar.md` clause c — explicit justification required):

| Extension | Justification |
|---|---|
| `Phase Progress chart` | Strategy D needs a meaningful chart for projects with `phase_workflow.nodes.length > 0` (Waterfall, Iterative, custom workflows). Without it, those projects see a Reports page where Burndown is gated and Iteration is gated — they get only summary + Lead/Cycle. Phase Progress fills the missing visualization. The visualization (horizontal step strip with progress bars per phase) is consistent with the prototype's StatCard + ProgressBar primitives — no new visual idiom is introduced. |
| `Capability gate AlertBanner CTAs` | Prototype shows static fake data only. Strategy D gates each card behind capability. When gated, the card needs to tell the user how to enable it (link to workflow-editor or sprints page). This is a 1-sentence text + link inside an existing AlertBanner primitive — no new visual idiom. |
| `URL-state filters (search params)` | Prototype doesn't address state persistence; legacy v1.0 uses local `useState` which loses on refresh. `Frontend2/app/(shell)/admin/audit/page.tsx` already establishes the URL-state pattern. Adopting it here is consistency, not extension. |

**Everything else NOT in this list is OUT OF SCOPE.** No Velocity Trend BarChart, no Distribution PieChart, no TeamPerformanceTable, no AssigneeFilter, no FilterBar, no sparklines, no PDF preview modal, no Toast, no DropdownMenu, no custom date popover.

---

## 2. Current Frontend2 Gap Analysis

| Prototype element | Frontend2 status today | Action |
|---|---|---|
| Header title + subtitle | ✅ shipped (`page.tsx:84-112`) | Keep |
| `[Q2 2026]` button | ✅ shipped as `DateRangeFilter` SegmentedControl | Keep |
| `[PDF]` button | ⚠️ non-functional Button (`page.tsx:119-121`) | Wire to `reportService.exportPdf()` + Excel sibling |
| 4 StatCards | ⚠️ hardcoded `value="—"` (`page.tsx:137-160`) | Wire to `useSummary(filters)`, populate `delta` from prev-period diff |
| Burndown card (1.5fr) | ⚠️ placeholder text "v1.0 verisi" (`page.tsx:175-191`) | Replace with `<BurndownChart>` |
| Team Load card (1fr) | ⚠️ single `"—"` + 0% bar (`page.tsx:192-212`) | Replace with `<TeamLoadCard>` |
| CFD | ✅ shipped (Phase 13) | Refactor capability gate to use new hook |
| Lead Time + Cycle Time | ✅ shipped (Phase 13) | Refactor capability gate to use new hook |
| Iteration Comparison | ✅ shipped (Phase 13) | Refactor capability gate to use new hook |
| Phase Reports table | ✅ shipped as `PhaseReportsSection` (Phase 13) | Keep as-is, move below new Phase Progress card |
| Phase Progress (new) | ❌ doesn't exist | Build `<PhaseProgressChart>` consuming new BE endpoint |

**Net new components:** 3 (`BurndownChart`, `TeamLoadCard`, `PhaseProgressChart`).
**Net wired components:** 1 (StatCard row).
**Net wired button:** 1 (PDF/Excel export).

---

## 3. Strategy D Recap (unchanged from v1)

Each chart asks **(a) do I have the capability/structure?** and **(b) do I have data?** in that order:

| Chart | Capability gate (Wave 1 rule) | Data gate |
|---|---|---|
| Summary StatCards | always | zeros OK |
| Burndown | `inputs.sprint_count > 0` | series non-empty |
| CFD | `inputs.has_all_categories` (todo+in_progress+done) | days non-empty |
| Lead Time | always | series non-empty |
| Cycle Time | always | series non-empty |
| Iteration | `inputs.sprint_count > 0` | sprints non-empty |
| Phase Progress | `inputs.phase_node_count > 0` | aggregation non-empty |
| Team Load | `inputs.member_count > 0` | loaded users non-empty |
| Phase Reports | always | list non-empty |

The page renders all 9 sections for every project; per-card gates flip between (chart | empty-state | capability AlertBanner with CTA).

---

## 4. Backend Changes — Wave 1a

### 4.1 Delete `chart_applicability.py` legacy contract

**File:** `Backend/app/domain/services/chart_applicability.py` — **rewrite from scratch**.

```python
"""Capability + data-presence rules for chart gating.

Each chart's visibility is a pure function of project state + workflow
capabilities, NEVER the methodology enum. New chart = add 1 lambda to the
registry (OCP per CLAUDE.md §4.1).
"""
from dataclasses import dataclass
from typing import Callable, Dict
from app.domain.entities.project import Project


@dataclass(frozen=True)
class CapabilityInputs:
    """Aggregated project-state inputs. Built by a SINGLE repository query."""
    sprint_count: int
    closed_sprint_count: int
    phase_node_count: int
    column_count: int
    member_count: int
    has_all_categories: bool  # {todo, in_progress, done} all present in columns


CapabilityRule = Callable[[Project, CapabilityInputs], bool]

CHART_CAPABILITY_RULES: Dict[str, CapabilityRule] = {
    "burndown":       lambda _p, i: i.sprint_count > 0,
    "iteration":      lambda _p, i: i.sprint_count > 0,
    "cfd":            lambda _p, i: i.has_all_categories,
    "lead_cycle":     lambda _p, _i: True,
    "phase_progress": lambda _p, i: i.phase_node_count > 0,
    "team_load":      lambda _p, i: i.member_count > 0,
    "summary":        lambda _p, _i: True,
}


def chart_capabilities(project: Project, inputs: CapabilityInputs) -> Dict[str, bool]:
    """Return the gating boolean for every chart in the registry."""
    return {name: rule(project, inputs) for name, rule in CHART_CAPABILITY_RULES.items()}
```

**Deleted:** `ChartApplicability` dataclass, `ITERATION_METHODOLOGIES` frozenset, `chart_applicability_for(methodology)` function. Tests in `Backend/tests/integration/test_charts.py` lines 218-294 also removed.

**Why no shim:** only 1 production caller (`GetProjectIterationUseCase`); rewritten in the same commit.

### 4.2 New repository method — `IProjectRepository.get_capability_inputs`

**File:** `Backend/app/domain/repositories/project_repository.py`

```python
@abstractmethod
async def get_capability_inputs(self, project_id: int) -> CapabilityInputs:
    """One-shot aggregation for chart capability gating.
    Returns CapabilityInputs (sprint counts, phase node count, etc.) via
    a SINGLE SQL query. Never N+1.
    """
```

**Implementation:** `Backend/app/infrastructure/database/repositories/project_repo.py` adds a `SELECT ... LEFT JOIN sprints ... LEFT JOIN board_columns ... LEFT JOIN project_members ...` returning the 6 fields as a tuple, mapped to `CapabilityInputs`.

### 4.3 New use case + endpoint — chart capabilities

**Use case:** `Backend/app/application/use_cases/get_chart_capabilities.py`

```python
class GetChartCapabilitiesUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int) -> Dict[str, bool]:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)
        inputs = await self.project_repo.get_capability_inputs(project_id)
        return chart_capabilities(project, inputs)
```

**Endpoint:** `Backend/app/api/v1/charts.py` adds:

```python
@router.get("/projects/{project_id}/chart-capabilities")
async def get_chart_capabilities(
    project_id: int,
    _member=Depends(get_project_member),
    use_case: GetChartCapabilitiesUseCase = Depends(get_chart_capabilities_use_case),
):
    return await use_case.execute(project_id)
```

**Response shape:** `{"burndown": bool, "iteration": bool, "cfd": bool, "lead_cycle": bool, "phase_progress": bool, "team_load": bool, "summary": bool}`.

### 4.4 New use case + endpoint — phase progress

**Use case:** `Backend/app/application/use_cases/get_project_phase_progress.py`

Aggregates: per `phase_workflow.nodes` entry, count tasks `{total, done, in_progress, todo}` based on `task.column.category`.

**DTO:** `PhaseProgressResponseDTO(phases=[PhaseProgressEntryDTO(id, name, order, total, done, in_progress, todo)])`.

**Endpoint:** `GET /api/v1/projects/{id}/charts/phase-progress`, gated by `get_project_member`.

### 4.5 Refactor `GetProjectIterationUseCase`

**File:** `Backend/app/application/use_cases/get_project_iteration.py`

```python
class GetProjectIterationUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(self, project_id: int, count: int) -> IterationResponseDTO:
        if count not in _VALID_COUNTS:
            raise ValueError(f"count must be one of {sorted(_VALID_COUNTS)}, got {count}")
        sprints = await self.audit_repo.get_iteration_data(project_id, count)
        return IterationResponseDTO(sprints=[IterationSprintDTO(**s) for s in sprints])
```

**Removed:** `chart_applicability_for` import, `InvalidMethodologyError` raise, `_REQUIRED_METHODOLOGIES` constant, `project_repo` dependency.

**Empty result:** when no sprints, returns `IterationResponseDTO(sprints=[])`. FE renders empty state.

**Endpoint cleanup:** `Backend/app/api/v1/charts.py:68-93` — remove `InvalidMethodologyError` `except` block.

**Exception cleanup:** `Backend/app/domain/exceptions.py:232-243` — delete `InvalidMethodologyError` class if no other callers (`grep` confirms 0 after this change).

### 4.6 `BoardColumn.category` as primary done-detection source

**File:** new shared helper at `Backend/app/infrastructure/database/util/done_columns.py`:

```python
async def resolve_done_column_ids(
    session: AsyncSession, project_id: int
) -> tuple[list[int], bool]:
    """Return (done_column_ids, used_fallback).

    Primary lookup: BoardColumn.category == 'done'.
    Fallback (logged WARN + metric counter): name ILIKE '%done%'.
    """
    # Primary
    stmt = select(BoardColumnModel.id).where(
        BoardColumnModel.project_id == project_id,
        BoardColumnModel.category == "done",
    )
    rows = (await session.execute(stmt)).scalars().all()
    if rows:
        return list(rows), False
    # Fallback
    logger.warning("done_column_category_fallback project_id=%s", project_id)
    DONE_COLUMN_FALLBACK_COUNTER.labels(project_id=str(project_id)).inc()
    stmt = select(BoardColumnModel.id).where(
        BoardColumnModel.project_id == project_id,
        func.lower(BoardColumnModel.name).ilike("%done%"),
    )
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows), True
```

**Replace all 8 ILIKE call sites** in `report_repo.py` (lines 31-38, 155, 227, 308-309, 391) + `audit_repo.py` (lines 521, 563, 649) to consume this helper.

**Telemetry:** new Prometheus counter `done_column_fallback_total{project_id}`. Wave 1a includes a one-shot script `Backend/scripts/audit_done_column_categories.py` to scan projects and report which lack `category="done"` — operators can run it before flipping a future feature flag.

### 4.7 Extend `BoardColumnLite` DTO to expose `category` to FE

**File:** `Backend/app/application/dtos/project_dtos.py` (or equivalent) — add `category: Optional[str]` to the column response shape.

**File:** `Frontend2/services/project-service.ts:3-6` — extend interface:

```ts
export interface BoardColumnLite {
  id: number;
  name: string;
  category?: "todo" | "in_progress" | "done";  // NEW
  isInitial?: boolean;                          // NEW
  isTerminal?: boolean;                         // NEW
}
```

Wire `mapProject` in `project-service.ts` to carry the new fields through.

### 4.8 Wave 1a Definition of Done

- [ ] `chart_applicability.py` rewritten with rule registry; old types deleted.
- [ ] `InvalidMethodologyError` deleted (or kept iff `grep` finds other callers).
- [ ] `IProjectRepository.get_capability_inputs` added + tested with 6 project shape fixtures.
- [ ] `/projects/{id}/chart-capabilities` endpoint returns correct gates for: Scrum+sprints, Kanban+categories, Waterfall+phases, Custom-hybrid, Empty project, Iterative+no-sprints.
- [ ] `/projects/{id}/charts/phase-progress` returns correct aggregation; tested against fixture with 4 phases × 10 tasks.
- [ ] `GetProjectIterationUseCase` returns empty list for projects with no sprints; no exception raised.
- [ ] `resolve_done_column_ids` shared helper used by all 8 call sites; WARN log + counter fires on ILIKE fallback.
- [ ] `BoardColumnLite` DTO exposes `category`, `is_initial`, `is_terminal`.
- [ ] Backend pytest suite green; 3 deleted tests + ~10 new tests.

---

## 5. Frontend Changes — Waves 1b–5

### 5.1 Wave 1b — Capability hook + URL state foundation

**New file:** `Frontend2/hooks/use-chart-capabilities.ts`

```ts
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface ChartCapabilities {
  burndown: boolean
  iteration: boolean
  cfd: boolean
  lead_cycle: boolean
  phase_progress: boolean
  team_load: boolean
  summary: boolean
}

export function useChartCapabilities(projectId: number | null | undefined) {
  return useQuery<ChartCapabilities>({
    queryKey: ["chart", "capabilities", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/chart-capabilities`)
      return data
    },
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,  // Capabilities change rarely; don't thrash on tab focus
  })
}
```

**Delete:** `Frontend2/lib/charts/applicability.ts` and `Frontend2/lib/charts/applicability.test.ts`. Update `Frontend2/app/(shell)/reports/page.tsx:50-51` import.

**URL-state migration:** Adopt the pattern from `Frontend2/app/(shell)/admin/audit/page.tsx:104-218`:
- `projectId`, `range` (`7|30|90|q2`), and `sprintId` (optional, for Burndown drill-down) → URL search params.
- Wrap `ReportsPage` body in `<React.Suspense fallback={null}>` per Next.js 16 `useSearchParams` CSR-bailout requirement.
- `setFilters` becomes `router.replace(...)`.

### 5.2 Wave 2 — Data fetchers

**New file:** `Frontend2/services/report-service.ts`

Direct port of legacy DTOs (summary, burndown, velocity for the StatCards' delta) BUT only the 3 endpoints we actually need:

```ts
export interface SummaryData {
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  // Phase 2 delta computation: backend returns prev-period deltas
  velocityDelta?: number;
  cycleDelta?: number;
  completedDelta?: number;
  blockersDelta?: number;
}

export interface BurndownPoint { date: string; remaining: number; total: number }
export interface BurndownData { sprintName: string; sprintId: number; series: BurndownPoint[]; idealLine?: BurndownPoint[] }

export interface TeamLoadEntry {
  userId: number;
  fullName: string;
  avatarPath: string | null;
  loadPct: number;
  activeTasks: number;
}
export interface TeamLoadData { entries: TeamLoadEntry[] }

export interface PhaseProgressEntry {
  id: string;
  name: string;
  order: number;
  total: number;
  done: number;
  inProgress: number;
  todo: number;
}
export interface PhaseProgressData { phases: PhaseProgressEntry[] }

export const reportService = {
  getSummary(projectId, range): Promise<SummaryData>,
  getBurndown(projectId, sprintId?): Promise<BurndownData>,
  getTeamLoad(projectId): Promise<TeamLoadData>,
  getPhaseProgress(projectId): Promise<PhaseProgressData>,
  exportPdf(projectId, range): Promise<Blob>,
  exportExcel(projectId, range): Promise<Blob>,
}
```

**Note:** `velocityDelta` / `cycleDelta` / `completedDelta` / `blockersDelta` are new BE fields for StatCard `delta` props matching the prototype. Two implementation options:
- **(a) BE adds fields to `SummaryDTO`** (recommended — single round trip, BE owns prev-period math).
- (b) FE computes delta from two `getSummary` calls (current + previous period). Worse caching, fragile.

Pick (a). Adjust §4 Wave 1a DoD to include `SummaryDTO` extension.

**4 TanStack hooks:**
- `Frontend2/hooks/use-summary.ts`
- `Frontend2/hooks/use-burndown.ts`
- `Frontend2/hooks/use-team-load.ts`
- `Frontend2/hooks/use-phase-progress.ts`

Each follows the `useCFD` template: `enabled: !!projectId && (caps?.<kind> ?? false)`, `staleTime: 30_000`, `refetchOnWindowFocus: true`, key `["chart", "<kind>", projectId, ...args]`.

### 5.3 Wave 3 — Chart components (prototype-fidelity)

**Three new files under `Frontend2/components/reports/`:**

#### 5.3.1 `burndown-chart.tsx`

* Recharts `AreaChart` (matches `cfd-chart.tsx` pattern).
* Two series: `remaining` (actual, solid) + `idealRemaining` (ideal line, dashed).
* `Area` fill: `color-mix(in oklch, var(--status-progress) 35%, transparent)`, stroke: `var(--status-progress)`.
* Ideal `<Line>` overlay: `strokeDasharray="4 4"`, stroke `var(--fg-subtle)`.
* Data points: small dots at each data, fill `var(--primary)`.
* Custom Tooltip (CFD's `CustomTooltip` pattern, possibly extracted to shared `chart-tooltip.tsx`).
* Footer metrics row: *"Bugün kalan: <N>"* + *"Sprint sonu: <date>"* (mono).
* Renders inside `ChartCard`; gating handled by parent page composer (no gate logic inside this component — Rules-of-Hooks safety per Frontend reviewer 2.2).
* `isAnimationActive={false}` (perf default per Frontend reviewer 2.10).
* a11y: container `role="img"` + concise `aria-label="Burndown chart, sprint 23, 12 days remaining"` + visually-hidden `<table>` sibling for screen readers (Frontend reviewer 3.3).

#### 5.3.2 `team-load-card.tsx`

* Not a Recharts chart — a primitive list. Matches `misc.jsx:397-410`.
* `<Card padding={16}>` → title row → up to 6 rows of `{Avatar, name, ProgressBar, percent}`.
* Color thresholds: `loadPct > 85 → var(--priority-critical)`, `> 65 → var(--status-review)`, else `var(--status-progress)`.
* Mono percent value right-aligned.
* Empty state: *"Henüz aktif görev yok"* + secondary CTA "Görev ata".
* Gating handled by parent page.

#### 5.3.3 `phase-progress-chart.tsx` (deliberate prototype extension)

* Reads BE endpoint via `useChartPhaseProgress(projectId)`.
* Horizontal step strip — `Card padding={16}` containing a flex row of phase cells.
* Each cell: phase name (mono small uppercase) → `ProgressBar value={done/total*100}` height 6 → mono `done / total`.
* Arrows between cells: CSS `::after` chevron, `color: var(--fg-subtle)`.
* Tone color: `--status-progress` (consistent with Burndown).
* No Recharts dependency (uses primitives only).
* Gating handled by parent page (`caps.phase_progress`).
* a11y: `role="img"` + `aria-label="<N> phases, X% complete"`.

**Note on existing 3 charts (CFD, Lead, Cycle, Iteration):** they currently consume `applicable: boolean | null` derived from `chartApplicabilityFor(methodology)`. After Wave 1b, change call sites in `page.tsx` to `applicable={caps.cfd}` etc. This is a 4-line change per usage; chart component internals unchanged.

### 5.4 Wave 4 — Polish (lean, no new primitives)

Per peer review, polish is **only** the things that don't violate the prototype-fidelity rule:

1. **Shared `chart-tooltip.tsx`** — extracted from CFDChart's existing `CustomTooltip`. Accepts `formatValue?: (v) => string` for per-chart unit formatting.
2. **All chart fills use `color-mix(in oklch, var(--status-X) ...%, transparent)`** — no hex anywhere in chart rendering code.
3. **Custom mono font on axis ticks + tooltip numbers**: `tick={{ fontFamily: "var(--font-mono)" }}`.
4. **`isAnimationActive={false}`** on every Recharts series across all 7 charts (existing + new).
5. **`prefers-reduced-motion` honor** — skeleton shimmer animation already CSS-gated; verify Recharts initial-mount animations also disabled.
6. **Chart skeleton shapes** — one shared `ChartSkeleton({ shape })` primitive (per Frontend reviewer 3.6) replacing the 3 separate cfd-/lead-cycle-/iteration-skeleton files. Shapes: `"area" | "bars" | "list" | "strip"`. Net: -2 files, +1 primitive.
7. **`staleTime: 30_000`** default applied to every chart hook (existing + new) — see Frontend reviewer 6.4.
8. **`placeholderData: keepPreviousData`** on chart queries — prevents skeleton flicker when filter changes but data refetches.
9. **`retry: 1`** — bounded retries prevent thundering herd on outage.

**Explicitly NOT in Wave 4:** sparklines, custom date picker, PDF preview modal, popover primitive, toast primitive. All deferred to future phases with explicit user request.

### 5.5 Wave 5 — Export & page rewire

#### 5.5.1 `export-button.tsx` (NEW)

* Two primitive `Button`s in a flex row: `[PDF ▾] [Excel ▾]` (or per design, a single primary `[Dışa Aktar]` plus a secondary `▾`). **No DropdownMenu primitive** — straight two buttons per Frontend reviewer Q4.
* Loading state: button icon → spinner, disable trigger.
* `downloadBlob(blob, filename)` helper for direct download.
* **"View in browser" alternative:** secondary action `window.open(URL.createObjectURL(blob), "_blank")` — uses native PDF viewer in Chrome/Firefox/Safari, no modal, no CSP risk (Frontend reviewer 2.7).
* Success/failure surface: existing `AlertBanner` injected at top of page for ~3s (manual `useEffect` timer). **No toast primitive.**

#### 5.5.2 Page rewire (`Frontend2/app/(shell)/reports/page.tsx`)

**Removals:**
* Placeholder Burndown Card (lines 175-191).
* Placeholder Team Load Card (lines 192-212).
* Hardcoded 4 StatCards with `value="—"` (lines 137-160).
* Non-functional PDF Button (lines 119-121).
* `chartApplicabilityFor` import + call (lines 50-51, 71-74).

**Additions:**
* `useChartCapabilities(filters.projectId)` → `caps`.
* `useSummary(filters)` → wires StatCard values + `delta`.
* `<BurndownChart>` (gated by `caps.burndown`).
* `<TeamLoadCard>` (gated by `caps.team_load`).
* `<PhaseProgressChart>` (gated by `caps.phase_progress`) — appears between Iteration and PhaseReports.
* `<ExportButton>` replacing the static PDF button.
* `<React.Suspense fallback={null}>` wrapping the body for URL-state.
* All gates resolved in page composer (no per-chart gate logic).

**State:** `useSearchParams` + `useRouter().replace` per audit page pattern. Encoded params: `?projectId=&range=&sprintId=`.

### 5.6 Wave 5 — Test coverage

* **Vitest** per new component: 4 states each (loading / error / empty / populated) → 12 tests.
* **`Frontend2/lib/charts/__tests__/capabilities-fixtures.test.ts`** — 6 BE-response fixtures.
* **`hooks/use-chart-capabilities.test.ts`** — mock TanStack scenarios.
* **E2E** (extend `Frontend2/e2e/reports-charts.spec.ts`):
  - Verify all 9 cards render on a fully-equipped project.
  - Verify capability-gate AlertBanner for a Kanban-no-sprints project (Burndown + Iteration gated).
  - Verify URL param `?projectId=42&range=30` correctly hydrates state on refresh.
  - Verify PDF + Excel downloads trigger correct `.pdf`/`.xlsx` blobs.
  - Verify Suspense fallback never flashes after first paint.
* **Backend pytest** new tests:
  - `test_get_capability_inputs_single_query` — assert ONE SQL execution (use `sqlalchemy.event.listen` or `caplog` from sql echo).
  - `test_chart_capability_rules` — parametrised on every rule × ≥3 inputs each.
  - `test_iteration_empty_when_no_sprints` — Kanban project with no sprints returns `sprints=[]`.
  - `test_iteration_returns_data_for_any_methodology_with_sprints` — parametrised on methodology enum.
  - `test_done_column_fallback_logs_and_counts` — assert WARN log + counter increment when ILIKE path hits.
  - `test_phase_progress_endpoint_aggregates_correctly` — fixture with 4 phases × 10 tasks.

### 5.7 Frontend Definition of Done

- [ ] No `chartApplicabilityFor` imports anywhere in `Frontend2`.
- [ ] No `methodology === "X"` strings in `Frontend2/components/reports/**`.
- [ ] No `methodology` reads in `Frontend2/lib/charts/**`.
- [ ] StatCard values + deltas live-wired from `useSummary`.
- [ ] BurndownChart renders Recharts AreaChart + dashed ideal line for Scrum-with-sprints projects; AlertBanner CTA for projects without sprints.
- [ ] TeamLoadCard renders up to 6 user rows with Avatar + ProgressBar + color thresholds.
- [ ] PhaseProgressChart renders horizontal step strip for projects with `phase_workflow.nodes`.
- [ ] Export button downloads PDF + Excel; "View in browser" opens native viewer in new tab.
- [ ] All filters round-trip via URL search params (refresh/bookmark/share work).
- [ ] All existing Phase 13 charts (CFD, Lead, Cycle, Iteration) refactored to consume `caps` instead of `chartApplicabilityFor`.
- [ ] Vitest + Playwright green.
- [ ] Dark mode visual pass complete (manual QA, screenshots in PR).

---

## 6. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `BoardColumn.category` unpopulated on legacy projects → ILIKE fallback masks bugs | Medium | Medium | WARN log + Prometheus counter + `audit_done_column_categories.py` script; surface fallback rate in admin dashboard. |
| R2 | `summary.delta` BE field requires new aggregation logic | Medium | Low | Compute as `(current - prev) / prev * 100` where `prev = summary(date_from - range_days, date_to - range_days)`. Single SQL CTE. |
| R3 | URL-state migration breaks existing chart deep-links if any exist | Low | Low | `grep -r "reports?" Frontend2` confirms no existing deep links; backward-compat shim trivial. |
| R4 | Recharts isAnimationActive=false changes test snapshots | Low | Low | Update snapshots in same PR. |
| R5 | Chart capability endpoint adds 1 round trip to first page paint | Medium | Low | `staleTime: 30_000` + `refetchOnWindowFocus: false`; capability rarely changes mid-session. |
| R6 | Phase progress BE endpoint diverges from `phase_workflow.nodes` JSONB schema | Medium | Medium | Endpoint reads `process_config.phase_workflow.nodes` server-side; emit typed `PhaseProgressEntryDTO` so FE never reads raw JSONB. |
| R7 | "View in browser" fails on Safari (blob URL CSP) | Low | Medium | Fallback: if `window.open` returns null (popup blocked), trigger download instead. Show AlertBanner explaining. |
| R8 | Capability gates flicker between (loading → granted → ungranted) on cold load | Low | Low | Chart `enabled` waits on `caps.data !== undefined` (not just `caps.<kind>`). Skeleton shown during capability resolution. |

---

## 7. Open Questions (answered post-peer-review)

| # | v1 question | v2 decision | Source |
|---|---|---|---|
| Q1 | Where does `chart_applicability_for` shim live? | **No shim. Delete.** | Both reviewers, plan §4.1 |
| Q2 | PhaseProgress FE vs BE aggregation? | **BE endpoint** `/projects/{id}/charts/phase-progress` | Both reviewers, plan §4.4 |
| Q3 | Sparkline downsample algorithm? | **Out of scope (no sparklines in v2)** | Frontend reviewer 2.1 |
| Q4 | Toast primitive ship vs defer? | **Defer indefinitely. AlertBanner.** | Frontend reviewer 2.8 |
| Q5 | Capability endpoint Wave 1 vs defer? | **Wave 1. Ship.** | Both reviewers, plan §4.3 |

---

## 8. Execution Order — 8 logical commits

```
Wave 1a — Backend (1 commit):
  Backend: chart_applicability rule registry + capability endpoint
  + phase-progress endpoint + iteration empty refactor
  + resolve_done_column_ids helper + BoardColumnLite category
  + summary delta fields + tests.

Wave 1b — Frontend foundation (1 commit):
  use-chart-capabilities hook + URL-state migration on reports page
  + Suspense wrapper + delete applicability.ts.

Wave 2 — FE data layer (1 commit):
  report-service.ts + 4 hooks (useSummary, useBurndown,
  useTeamLoad, usePhaseProgress) + unit tests.

Wave 3 — FE chart components (1 commit):
  burndown-chart.tsx + team-load-card.tsx + phase-progress-chart.tsx
  + Vitest coverage.

Wave 4 — Polish (1 commit):
  Shared chart-tooltip.tsx + ChartSkeleton primitive
  + isAnimationActive=false + staleTime/retry/keepPreviousData defaults
  + token-only palette pass.

Wave 5 — Export + page rewire (1 commit):
  export-button.tsx + page.tsx rewrite (placeholder removal,
  capability gates wiring, ExportButton placement) + E2E coverage.

Wave 6 — Cleanup (1 commit):
  Existing 3 charts (CFD, LeadCycle, Iteration) refactored to consume
  caps instead of legacy applicable prop. Delete dead code.

Wave 7 — QA (1 commit):
  Dark mode pass + accessibility pass + cross-browser PDF check
  + screenshots in PR description.
```

Estimated: 8-10 commits, 4-5 working sessions.

---

## 9. Rollback Plan

* Each Wave commits independently; reverting any leaves the previous Wave functional.
* **Wave 1a backend** is the most disruptive — full rollback requires undoing the rule registry + endpoint + `IProjectRepository` extension. The deleted `chart_applicability_for` function can be restored from git if needed; only 1 caller is affected.
* **Wave 5 page rewire** keeps the old placeholder blocks in a separate `_legacy/` directory until E2E passes; remove during Wave 7 cleanup.
* No DB migration in this plan → no data-layer rollback complexity.

---

## 10. Out-of-Scope (deferred to future phases)

* Velocity Trend BarChart (legacy v1.0 feature, not in prototype).
* Task Distribution PieChart (legacy v1.0 feature, not in prototype).
* Team Performance Table — sortable on-time % (legacy v1.0 feature, not in prototype).
* AssigneeFilter multi-select dropdown (legacy v1.0 feature, not in prototype).
* StatCard sparklines (not in prototype, no clear justification yet).
* Custom date range picker w/ popover (not in prototype, increases scope materially).
* PDF Preview Modal (CSP risk + not in prototype; `window.open` covers the use case).
* Toast primitive (memory rule).
* DropdownMenu primitive (memory rule).
* Real-time chart updates via WebSocket.
* Drill-down navigation from chart points to filtered task lists.
* Custom report builder / saved presets.
* Cross-project comparison.

If user later requests any of these, each gets a separate phase with explicit justification per `feedback_quality_bar.md`.

---

**End of plan v2.** Awaiting user approval before Wave 1a backend work begins.
