# Phase 13: Reporting, Activity & User Profile — Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** ~95 new/modified files (10 plans)
**Analogs found:** 78 / 95 (the rest flagged "no analog — new shape; closest reference for code style: …")

> Companion to `13-CONTEXT.md`, `13-RESEARCH.md`, `13-UI-SPEC.md`. Per-file pattern assignments grouped by Plan number, then by layer (Backend → Frontend services → Frontend hooks → Frontend libs → Frontend primitives → Frontend components → Frontend routes → Tests → E2E → Artifacts). Excerpts cite real lines from the analog file the planner should imitate. Every divergence is called out.

---

## File Classification

### Plan 13-01 — Shared Infra (fat plan, ~28 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Backend/app/api/v1/charts.py` | backend router | aggregation read-only | `Backend/app/api/v1/activity.py` | exact (router shape) |
| `Backend/app/application/use_cases/get_project_cfd.py` | backend use_case | aggregation | `Backend/app/application/use_cases/get_project_activity.py` | role-match |
| `Backend/app/application/use_cases/get_project_lead_cycle.py` | backend use_case | aggregation | `Backend/app/application/use_cases/get_project_activity.py` | role-match |
| `Backend/app/application/use_cases/get_project_iteration.py` | backend use_case | aggregation | `Backend/app/application/use_cases/get_project_activity.py` | role-match |
| `Backend/app/application/use_cases/get_user_activity.py` | backend use_case | filtered read-only | `Backend/app/application/use_cases/get_project_activity.py` | exact |
| `Backend/app/application/dtos/chart_dtos.py` | backend DTO | n/a | `Backend/app/application/dtos/activity_dtos.py` | exact |
| `Backend/app/infrastructure/database/repositories/audit_repo.py` (EXTEND) | backend repository | aggregation SQL | `Backend/app/infrastructure/database/repositories/audit_repo.py` (existing methods) | exact (file extends) |
| `Backend/app/domain/repositories/audit_repository.py` (EXTEND) | backend interface | n/a | same file existing methods | exact |
| `Backend/app/api/v1/users.py` (EXTEND) | backend router | filtered read-only | same file (`/users/{id}/summary`) | exact |
| `Backend/app/domain/services/chart_applicability.py` (NEW — Strategy Pattern) | backend domain service | pure logic | `Backend/app/application/services/phase_gate_service.py` (closest service-style file) | role-match |
| `Backend/app/api/main.py` (EXTEND — register charts router) | backend wiring | n/a | same file lines 163–166 (existing activity / users include) | exact |
| `Backend/tests/integration/test_get_project_cfd.py` | backend test | n/a | `Backend/tests/integration/test_execute_phase_transition.py` | exact (in-memory fakes) |
| `Backend/tests/integration/test_get_project_lead_cycle.py` | backend test | n/a | same | exact |
| `Backend/tests/integration/test_get_project_iteration.py` | backend test | n/a | same | exact |
| `Backend/tests/integration/test_get_user_activity.py` | backend test | n/a | same + `Backend/tests/integration/test_activity.py` | exact |
| `Frontend2/services/chart-service.ts` | frontend service | read-only | `Frontend2/services/phase-report-service.ts` | exact |
| `Frontend2/services/profile-service.ts` | frontend service | read-only | `Frontend2/services/phase-report-service.ts` | exact |
| `Frontend2/services/activity-service.ts` (or extend `project-service.ts`) | frontend service | read-only | `Frontend2/services/phase-report-service.ts` | exact |
| `Frontend2/hooks/use-cfd.ts` | frontend hook | read-only | `Frontend2/hooks/use-phase-reports.ts` (`usePhaseReports` shape) | exact |
| `Frontend2/hooks/use-lead-cycle.ts` | frontend hook | read-only | same | exact |
| `Frontend2/hooks/use-iteration.ts` | frontend hook | read-only | same | exact |
| `Frontend2/hooks/use-user-activity.ts` | frontend hook | read-only | same | exact |
| `Frontend2/hooks/use-user-summary.ts` | frontend hook | read-only | same | exact |
| `Frontend2/hooks/use-project-activity.ts` | frontend hook | read-only | same + existing `useGlobalActivity` in `Frontend2/hooks/use-projects.ts` | exact |
| `Frontend2/lib/audit-event-mapper.ts` | frontend utility | pure mapping | no analog — new shape; closest style: `Frontend2/lib/methodology-matrix.ts` (constant table + helper) | partial |
| `Frontend2/lib/activity-date-format.ts` | frontend utility | pure date math | `Frontend2/components/dashboard/activity-feed.tsx` lines 19–47 (`formatTime`) | exact (LIFT, see Pitfall 6 of RESEARCH.md) |
| `Frontend2/lib/charts/buckets.ts` | frontend utility | pure constants | `Frontend2/lib/methodology-matrix.ts` | role-match |
| `Frontend2/lib/charts/applicability.ts` | frontend utility | pure mapping | `Frontend2/lib/methodology-matrix.ts` | exact |
| `Frontend2/components/primitives/data-state.tsx` | frontend primitive | pure render switch | `Frontend2/components/primitives/alert-banner.tsx` (closest primitive shape) | role-match |
| `Frontend2/components/primitives/index.ts` (EXTEND barrel export) | frontend wiring | n/a | same file existing exports | exact |
| `Frontend2/components/reports/chart-card.tsx` (base shell scaffold only) | frontend component | nav-only | `Frontend2/components/dashboard/stat-card.tsx` (Card + tone slot pattern) | partial |
| `Frontend2/components/shell/avatar-dropdown.tsx` (component scaffolding only — full impl in Plan 13-02) | frontend component | nav-only | `SidebarUserMenu` in `Frontend2/components/sidebar.tsx` lines 154–289 | exact |
| `Frontend2/package.json` (ADD `recharts: 3.8.1`) | dep manifest | n/a | same file (existing `@xyflow/react: 12.10.2` exact-pin) | exact |

### Plan 13-02 — Header AvatarDropdown + Sidebar Refactor (~7 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/components/shell/avatar-dropdown.tsx` (full impl) | frontend component | nav-only | `Frontend2/components/sidebar.tsx` `SidebarUserMenu` lines 154–289 | exact |
| `Frontend2/components/header.tsx` (EXTEND — mount dropdown top-right) | frontend component | nav-only | same file lines 102–131 (existing theme + lang button area) | exact |
| `Frontend2/components/sidebar.tsx` (REMOVE `SidebarUserMenu` + footer block) | frontend component | nav-only | same file lines 154–289 + 417–423 (the deleted block) | exact |
| `Frontend2/lib/initials.ts` (LIFT existing `getInitials` from activity-feed) | frontend utility | pure | `Frontend2/components/dashboard/activity-feed.tsx` lines 49–56 | exact (LIFT) |
| `Frontend2/components/shell/avatar-dropdown.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact (vitest+RTL+vi.mock) |
| `Frontend2/components/header.test.tsx` (NEW or EXTEND) | frontend test (RTL) | n/a | `Frontend2/components/header/create-button.test.tsx` (closest header test) | role-match |
| `Frontend2/test/helpers/render-with-providers.tsx` (verify auth mock fits) | test helper | n/a | same file (existing) | exact (no edit, only consumed) |

### Plan 13-03 — Cross-Site Avatar `href` + DataState Adoption (~12 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/components/primitives/avatar.tsx` (EXTEND — add optional `href`) | frontend primitive | nav | same file (existing) | exact |
| `Frontend2/components/primitives/avatar.test.tsx` (NEW or EXTEND) | frontend test | n/a | `Frontend2/components/lifecycle/mini-metric.test.tsx` (closest primitive test) | role-match |
| `Frontend2/components/primitives/avatar-stack.tsx` (EXTEND — pass `href` per inner Avatar; +N chip stays unlinked) | frontend primitive | nav | same file (existing lines 22–75) | exact |
| `Frontend2/components/dashboard/activity-feed.tsx` (PATCH — pass `href={`/users/${item.user_id}`}` on actor avatar; adopt `<DataState/>` for empty state) | frontend component | nav | same file lines 74–82 (empty branch) + line 108 (Avatar) | exact |
| `Frontend2/components/dashboard/portfolio-table.tsx` (PATCH — line 134 Avatar) | frontend component | nav | same file line 134 | exact |
| `Frontend2/components/my-tasks/task-row.tsx` (PATCH — line 378 Avatar) | frontend component | nav | same file line 378 | exact |
| `Frontend2/components/project-detail/list-tab.tsx` (PATCH — line 217 Avatar) | frontend component | nav | same file line 217 | exact |
| `Frontend2/components/project-detail/board-card.tsx` (PATCH — lines 216, 230 Avatar) | frontend component | nav | same file | exact |
| `Frontend2/components/project-detail/backlog-task-row.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/project-detail/members-tab.tsx` (PATCH — line 57 Avatar) | frontend component | nav | same file | exact |
| `Frontend2/components/projects/project-card.tsx` (PATCH — managerAvatars in AvatarStack) | frontend component | nav | same file lines 130–140 | exact |
| `Frontend2/components/lifecycle/artifact-inline-expand.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/lifecycle/artifacts-subtab.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/lifecycle/overview-subtab.tsx` (PATCH — actor Avatars in activity items) | frontend component | nav | same file | exact |
| `Frontend2/components/task-detail/comments-section.tsx` (PATCH — comment author + composer Avatars) | frontend component | nav | same file lines 186–193, 357 | exact |
| `Frontend2/components/task-detail/properties-sidebar.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/task-detail/attachments-section.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/task-detail/sub-tasks-list.tsx` (PATCH) | frontend component | nav | same file | exact |
| `Frontend2/components/task-detail/history-section.tsx` (PATCH — actor Avatars) | frontend component | nav | same file | exact |

> **Plan 13-03 explicitly skips** `Frontend2/components/task-detail/assignee-picker.tsx` (button-onClick semantics conflict — RESEARCH.md table) and `Frontend2/components/project-detail/backlog-panel.tsx` (no user identity at the call site).

### Plan 13-04 — ProjectDetail Activity Tab (full) (~7 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/components/activity/activity-tab.tsx` (canonical) | frontend component | read-only | `Frontend2/components/dashboard/activity-feed.tsx` (closest existing activity surface) | role-match (different layout — vertical timeline vs flat list) |
| `Frontend2/components/activity/activity-row.tsx` (per-event row, 10 event types) | frontend component | read-only | `Frontend2/components/dashboard/activity-feed.tsx` lines 91–125 | role-match |
| `Frontend2/components/activity/activity-filter.tsx` (SegmentedControl + user avatar row) | frontend component | nav-only | `Frontend2/components/my-tasks/mt-toolbar.tsx` (closest filter-bar pattern) | partial |
| `Frontend2/components/activity/activity-empty.tsx` (friendly empty state) | frontend component | read-only | `Frontend2/components/my-tasks/mt-empty.tsx` | exact |
| `Frontend2/components/activity/activity-skeleton.tsx` (10-row shimmer) | frontend component | n/a | no analog — new shape; closest style: existing shimmer keyframe in `Frontend2/app/globals.css` | partial |
| `Frontend2/components/project-detail/activity-stub-tab.tsx` (REPLACE body with `<ActivityTab projectId={id} variant="full"/>`) | frontend component | read-only | same file (existing 21-line stub) | exact (REPLACE) |
| `Frontend2/components/activity/activity-tab.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact |
| `Frontend2/components/activity/activity-row.test.tsx` | frontend test (RTL) | n/a | same | exact |

### Plan 13-05 — User Profile Page Route + Tasks Tab (~7 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/app/(shell)/users/[id]/page.tsx` | frontend route | read-only | `Frontend2/app/(shell)/projects/[id]/page.tsx` | exact (dynamic route + `useParams` + load + tabs) |
| `Frontend2/components/profile/profile-header.tsx` | frontend component | read-only | `Frontend2/components/dashboard/stat-card.tsx` (Card + tone slot) + project-detail page header (`projects/[id]/page.tsx` lines 53–70) | partial |
| `Frontend2/components/profile/profile-tasks-tab.tsx` | frontend component | read-only | `Frontend2/components/my-tasks/task-group-list.tsx` (closest "group-by-project + MTTaskRow density compact" surface) | role-match |
| `Frontend2/components/profile/profile-projects-tab.tsx` (placeholder for Plan 13-06 — Projects + Activity) | frontend component | nav-only | `Frontend2/components/projects/project-card.tsx` consumer (e.g. `Frontend2/app/(shell)/projects/page.tsx`) | exact |
| `Frontend2/components/profile/profile-header.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact |
| `Frontend2/components/profile/profile-tasks-tab.test.tsx` | frontend test (RTL) | n/a | same | exact |

### Plan 13-06 — Profile Projects + Activity Tabs (~3 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/components/profile/profile-projects-tab.tsx` (full impl — 3-col `ProjectCard` grid; reuse `ProjectCard` from Plan 10) | frontend component | nav-only | `Frontend2/components/projects/project-card.tsx` consumers + `Frontend2/app/globals.css` `.projects-grid` lines 173–183 | exact |
| `Frontend2/app/(shell)/users/[id]/page.tsx` (EXTEND — Activity tab content = `<ActivityTab userId={id} variant="full"/>`) | frontend route | read-only | same file (Plan 13-05 base) | exact |
| `Frontend2/components/profile/profile-projects-tab.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact |

### Plan 13-07 — Reports Page CFD + Lead/Cycle Charts (~8 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/app/(shell)/reports/page.tsx` (REWRITE — entire 12-line stub replaced) | frontend route | read-only | `Frontend2/app/(shell)/projects/[id]/page.tsx` (closest "page that loads + composes many child cards" pattern) | partial |
| `Frontend2/components/reports/chart-card.tsx` (full impl — header + DataState + footer) | frontend component | read-only | `Frontend2/components/dashboard/stat-card.tsx` (Card padding + tone shell) | partial |
| `Frontend2/components/reports/cfd-chart.tsx` (Recharts AreaChart 4-band stacked) | frontend component | read-only | no analog — new shape (Recharts wrapping); closest style: RESEARCH.md §Pattern 1 | new |
| `Frontend2/components/reports/lead-cycle-chart.tsx` (Recharts BarChart histogram + percentile row) | frontend component | read-only | no analog — new shape | new |
| `Frontend2/components/reports/cfd-skeleton.tsx`, `lead-cycle-skeleton.tsx` (chart-shape shimmer) | frontend component | n/a | no analog — new shape; closest style: shimmer keyframe in `Frontend2/app/globals.css` | partial |
| `Frontend2/components/reports/date-range-filter.tsx` (SegmentedControl + context strip) | frontend component | nav-only | `Frontend2/components/primitives/segmented-control.tsx` (consumer pattern; example: `Frontend2/components/my-tasks/mt-toolbar.tsx`) | role-match |
| `Frontend2/components/reports/project-picker.tsx` (native `<select>` styled to match Input) | frontend component | nav-only | `Frontend2/components/primitives/input.tsx` (closest existing styled input) | role-match |
| `Frontend2/components/reports/cfd-chart.test.tsx`, `lead-cycle-chart.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact |

### Plan 13-08 — Iteration Comparison + Faz Raporları Section (~6 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/components/reports/iteration-chart.tsx` (Recharts BarChart grouped 3-series) | frontend component | read-only | no analog — new shape (Recharts BarChart); closest style: RESEARCH.md §Pattern 1 | new |
| `Frontend2/components/reports/iteration-skeleton.tsx` | frontend component | n/a | no analog | partial |
| `Frontend2/components/reports/phase-reports-section.tsx` (outer Tabs + cascading pickers + recent rows + EvaluationReportCard mount) | frontend component | read-only + nav | `Frontend2/components/lifecycle/history-subtab.tsx` (closest "list of phase rows + click → inline card" pattern) | role-match |
| `Frontend2/app/(shell)/reports/page.tsx` (EXTEND — append IterationChart + PhaseReportsSection) | frontend route | read-only | same file (Plan 13-07 base) | exact |
| `Frontend2/components/reports/iteration-chart.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` | exact |
| `Frontend2/components/reports/phase-reports-section.test.tsx` | frontend test (RTL) | n/a | `Frontend2/components/lifecycle/history-subtab.test.tsx` | exact |

### Plan 13-09 — Mobile Breakpoints + A11y Polish (~9 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/app/globals.css` (EXTEND — Phase 13 grid classes + ≤1024 + ≤640 media queries) | css | n/a | same file lines 172–206 (existing `.projects-grid`, `.task-detail-grid`, `.pd-tabs-wrap` Phase 11 D-54 patterns) | exact |
| `Frontend2/components/reports/cfd-chart.tsx` (PATCH — `aria-label` + tabular fallback toggle on `<svg>`) | frontend component | n/a | RESEARCH.md §Pitfall 4 (custom Tooltip pattern) | partial |
| `Frontend2/components/reports/lead-cycle-chart.tsx` (PATCH — same a11y wiring) | frontend component | n/a | same | partial |
| `Frontend2/components/reports/iteration-chart.tsx` (PATCH — same) | frontend component | n/a | same | partial |
| `Frontend2/components/shell/avatar-dropdown.tsx` (PATCH — Tab focus trap, Arrow keys, `role="menu"`/`menuitem`) | frontend component | nav-only | UI-SPEC §A.4 aria attribute table (no existing menu primitive) | partial |
| `Frontend2/components/profile/profile-header.tsx` (PATCH — `<h1>` semantic, `aria-label` on StatCards) | frontend component | n/a | UI-SPEC §D.4 a11y note | partial |
| `Frontend2/components/activity/activity-row.tsx` (PATCH — row `aria-label="{actor} {verb} — {time}"`) | frontend component | n/a | UI-SPEC §G copy table | partial |
| `Frontend2/components/activity/activity-tab.tsx` (PATCH — mobile `.activity-mobile` class adoption) | frontend component | n/a | UI-SPEC §C.1 mobile note | partial |
| `Frontend2/test/responsive.test.tsx` (NEW — viewport tests if applicable) | frontend test | n/a | `Frontend2/components/lifecycle/viewport-fallback.test.tsx` | exact |

### Plan 13-10 — E2E Smoke + UAT Artifact (~4 files)

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `Frontend2/e2e/reports-charts.spec.ts` (Playwright smoke — charts render with mock data) | e2e | n/a | `Frontend2/e2e/task-create.spec.ts` | exact (skip-guard pattern) |
| `Frontend2/e2e/profile-page.spec.ts` (own + other user profile loads; tab nav) | e2e | n/a | `Frontend2/e2e/task-detail-inline-edit.spec.ts` | exact |
| `Frontend2/e2e/avatar-dropdown.spec.ts` (open menu → click logout → /auth/login lands) | e2e | n/a | `Frontend2/e2e/task-create.spec.ts` | exact |
| `Frontend2/e2e/activity-tab.spec.ts` (filter persists across page reload) | e2e | n/a | same | exact |
| `.planning/phases/13-reporting-activity-user-profile/13-UAT-CHECKLIST.md` (15–20-row UAT artifact) | artifact | n/a | `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UAT-CHECKLIST.md` (if present) or `.planning/phases/11-task-features-board-enhancements/11-UAT-CHECKLIST.md` | role-match |

---

## Pattern Assignments

### Plan 13-01 — Backend Layer

#### `Backend/app/api/v1/charts.py` (NEW backend router)

**Analog:** `Backend/app/api/v1/activity.py` (lines 1–80)

**Imports + decorator pattern** (lines 1–17):
```python
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime

from app.api.deps.project import get_project_member
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.get_project_activity import GetProjectActivityUseCase
from app.application.dtos.activity_dtos import ActivityResponseDTO

router = APIRouter()
```

**Project-member-gated endpoint pattern** (lines 46–80 — reuse verbatim, change names + DTO):
```python
@router.get(
    "/projects/{project_id}/charts/cfd",
    response_model=CFDResponseDTO,
)
async def get_project_cfd(
    project_id: int,
    range: int = Query(default=30, ge=7, le=90),  # validated 7|30|90 in use case
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
    task_repo=Depends(get_task_repo),
) -> CFDResponseDTO:
    """D-X1 CFD daily snapshot, member-gated, range-validated."""
    use_case = GetProjectCFDUseCase(audit_repo, task_repo)
    return await use_case.execute(project_id=project_id, range_days=range)
```

**Validate `range`/`count` against allowed set inside the use case** (RESEARCH.md §Code Examples). Return HTTP 422 with Phase 9 `error_code` taxonomy on disallowed values.

**Wire 4 endpoints in this single file:** `cfd`, `lead-cycle`, `iteration`, plus the existing precedent in `activity.py` for the `/users/{user_id}/activity` route. Per CONTEXT canonical refs the user-activity endpoint EXTENDS `Backend/app/api/v1/users.py` (not `charts.py`); see file-specific pattern below.

**Divergences from analog:**
- New endpoints are aggregation, not row-paginated; no `limit/offset` on cfd/lead-cycle/iteration.
- Iteration uses `count` parameter rather than `range`.
- Chart use cases inject **two** repos (`audit_repo`, `task_repo`); iteration also uses `sprint_repo` per RESEARCH.md system architecture.

---

#### `Backend/app/api/v1/users.py` (EXTEND — add `/users/{user_id}/activity`)

**Analog:** same file lines 18–34 (`get_user_summary`); RESEARCH.md §Code Examples lines 1029–1051

**Existing endpoint shape to mimic** (lines 18–34):
```python
@router.get("/users/{user_id}/summary", response_model=UserSummaryResponseDTO)
async def get_user_summary(
    user_id: int,
    include_archived: bool = Query(default=False),
    _current=Depends(get_current_user),
    user_repo=Depends(get_user_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
    task_repo=Depends(get_task_repo),
) -> UserSummaryResponseDTO:
    uc = GetUserSummaryUseCase(user_repo, project_repo, audit_repo, task_repo)
    return await uc.execute(user_id=user_id, include_archived=include_archived)
```

**New endpoint to add — verbatim from RESEARCH.md §Code Examples lines 1030–1051:**
```python
@router.get("/users/{user_id}/activity", response_model=ActivityResponseDTO)
async def get_user_activity(
    user_id: int,
    type: Optional[List[str]] = Query(default=None, alias="type[]"),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user=Depends(get_current_user),
    audit_repo=Depends(get_audit_repo),
) -> ActivityResponseDTO:
    """D-X4 user activity feed, viewer-privacy-filtered."""
    is_admin = (current_user.role or "").lower() == "admin"
    use_case = GetUserActivityUseCase(audit_repo)
    return await use_case.execute(
        target_user_id=user_id,
        viewer_user_id=current_user.id,
        is_admin=is_admin,
        types=type, date_from=date_from, date_to=date_to,
        limit=limit, offset=offset,
    )
```

**Divergences:**
- Privacy filter (D-C7) — viewer's project membership is the join key, not the target user's. See `Backend/app/infrastructure/database/repositories/audit_repo.py` extension below for the SQL.
- Page size capped at 200 (Phase 9 D-44 convention — already enforced in `activity.py` line 56).

---

#### `Backend/app/application/use_cases/get_project_cfd.py` (NEW)

**Analog:** `Backend/app/application/use_cases/get_project_activity.py` (full file)

**Class shell pattern** (`get_project_activity.py` lines 8–29):
```python
class GetProjectActivityUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(
        self,
        project_id: int,
        types: Optional[List[str]] = None,
        ...
    ) -> ActivityResponseDTO:
        items, total = await self.audit_repo.get_project_activity(...)
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
```

**Adapt to CFD per RESEARCH.md §Code Examples lines 731–749:**
```python
class GetProjectCFDUseCase:
    def __init__(self, audit_repo: IAuditRepository, task_repo: ITaskRepository):
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(self, project_id: int, range_days: Literal[7, 30, 90]) -> CFDResponseDTO:
        date_to = date.today()
        date_from = date_to - timedelta(days=range_days - 1)
        snapshots = await self.audit_repo.get_cfd_snapshots(
            project_id=project_id, date_from=date_from, date_to=date_to,
        )
        avg_wip = sum(s["progress"] + s["review"] for s in snapshots) / len(snapshots) if snapshots else 0.0
        avg_completion = sum(s["done"] for s in snapshots) / len(snapshots) if snapshots else 0.0
        return CFDResponseDTO(
            days=[CFDDayDTO(**s) for s in snapshots],
            avg_wip=round(avg_wip, 1),
            avg_completion_per_day=round(avg_completion, 1),
        )
```

**Divergences:**
- Two repos injected (audit + task) per CLAUDE.md §4.2 DIP.
- `range_days` validated against {7, 30, 90} — raise `ValueError` (use case layer) → translate to HTTP 422 in router via Phase 9 error mapper.

---

#### `Backend/app/application/use_cases/get_project_lead_cycle.py` (NEW)

**Analog:** same as CFD; SQL pattern from RESEARCH.md §Code Examples lines 818–887

Returns `LeadCycleResponseDTO` with shape `{lead: {avg_days, p50, p85, p95, buckets}, cycle: {…}}` per D-X2.

---

#### `Backend/app/application/use_cases/get_project_iteration.py` (NEW)

**Analog:** same as CFD; SQL pattern from RESEARCH.md §Code Examples lines 894–924

**Methodology gate** — raise `InvalidMethodologyError` (NEW domain exception in `Backend/app/domain/exceptions.py`) for methodologies not in `{"SCRUM", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD"}`. Translate to HTTP 422 `INVALID_METHODOLOGY` per Phase 9 error taxonomy. Use `chart_applicability.py` (Strategy Pattern, see below) instead of an inline conditional.

---

#### `Backend/app/application/use_cases/get_user_activity.py` (NEW)

**Analog:** `Backend/app/application/use_cases/get_project_activity.py` (full file) + RESEARCH.md §Code Examples lines 999–1023

**Verbatim pattern from RESEARCH.md (the only departure: Plan adds `viewer_user_id` and `is_admin`):**
```python
class GetUserActivityUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(
        self,
        target_user_id: int,
        viewer_user_id: int,
        is_admin: bool,
        types: Optional[list[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30, offset: int = 0,
    ) -> ActivityResponseDTO:
        items, total = await self.audit_repo.get_user_activity(
            target_user_id=target_user_id,
            viewer_user_id=viewer_user_id,
            is_admin=is_admin,
            types=types, date_from=date_from, date_to=date_to,
            limit=limit, offset=offset,
        )
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
```

---

#### `Backend/app/application/dtos/chart_dtos.py` (NEW)

**Analog:** `Backend/app/application/dtos/activity_dtos.py` (full file)

**Pattern (verbatim file shape):**
```python
"""Phase 13 chart DTOs."""
from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class CFDDayDTO(BaseModel):
    date: str
    todo: int
    progress: int
    review: int
    done: int

    model_config = ConfigDict(from_attributes=True)


class CFDResponseDTO(BaseModel):
    days: List[CFDDayDTO]
    avg_wip: float
    avg_completion_per_day: float

    model_config = ConfigDict(from_attributes=True)
```

Add the parallel DTOs `LeadCycleResponseDTO` (with nested `LeadCycleStatsDTO` for `lead`/`cycle`) and `IterationResponseDTO` per CONTEXT D-X2/D-X3 shapes.

---

#### `Backend/app/infrastructure/database/repositories/audit_repo.py` (EXTEND — add 4 query methods)

**Analog:** same file lines 103–181 (`get_project_activity`) + lines 241–261 (`get_recent_by_user`)

**Imports + class shell** (lines 1–10):
```python
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from app.domain.repositories.audit_repository import IAuditRepository
from app.infrastructure.database.models.audit_log import AuditLogModel


class SqlAlchemyAuditRepository(IAuditRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
```

**Existing pattern for filter conditions + count + items query** (lines 120–181):
```python
conditions = [
    AuditLogModel.entity_type == "project",
    AuditLogModel.entity_id == project_id,
]
if types:
    conditions.append(AuditLogModel.action.in_(types))
# ...
count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*conditions)
total = (await self.session.execute(count_stmt)).scalar() or 0
items_stmt = (
    select(...)
    .select_from(AuditLogModel)
    .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
    .where(*conditions)
    .order_by(AuditLogModel.timestamp.desc())
    .limit(limit)
    .offset(offset)
)
```

**New methods to add (raw SQL via `text()` per RESEARCH.md §Code Examples):**
- `get_cfd_snapshots(project_id, date_from, date_to) -> list[dict]` — see RESEARCH.md lines 757–808
- `get_lead_cycle_data(project_id, range_days) -> dict` — see RESEARCH.md lines 818–887
- `get_iteration_data(project_id, count) -> list[dict]` — see RESEARCH.md lines 894–923
- `get_user_activity(target_user_id, viewer_user_id, is_admin, types, date_from, date_to, limit, offset) -> tuple[list[dict], int]` — see RESEARCH.md lines 931–992 (privacy filter via viewer's `team_projects` subquery)

**Divergences:**
- The 3 chart methods use `sqlalchemy.text()` raw SQL (not the ORM query builder) because the queries use `generate_series`, `percentile_cont`, and CTEs. Existing `get_project_activity` is ORM-based — Plan 13-01 mixes both styles in one file (acceptable; raw SQL is the established pattern for `count_phase_transitions` line 61 which uses `extra_metadata->>'…'`).
- `get_user_activity` uses the privacy filter pattern (RESEARCH.md §Pitfall 9) — `WITH viewer_projects AS (SELECT project_id FROM team_projects WHERE user_id = :viewer)`.

---

#### `Backend/app/domain/repositories/audit_repository.py` (EXTEND — add 4 abstract methods)

**Analog:** same file (existing methods lines 1–88)

**Existing abstract method pattern** (lines 56–71):
```python
@abstractmethod
async def get_project_activity(
    self,
    project_id: int,
    types: Optional[List[str]] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 30,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """D-46 / D-47: paginated, filtered activity feed for a project."""
    pass
```

Mirror four new abstract method declarations matching the `audit_repo.py` extension above.

---

#### `Backend/app/domain/services/chart_applicability.py` (NEW — Strategy Pattern per CLAUDE.md §4.1 OCP)

**Analog:** No direct analog (no `domain/services/` chart-style helper today). Closest existing pattern is `Backend/app/application/services/phase_gate_service.py` (rule-evaluation service) and `Frontend2/lib/methodology-matrix.ts` for the constant-table shape.

**Pattern (per RESEARCH.md §Project Constraints item 4):**
```python
"""Phase 13 D-A4 + D-X3: chart applicability rules per methodology.

Single source of truth for which charts are valid against which methodology.
NOT inline `if methodology == 'KANBAN'` checks scattered across the codebase.
"""
from dataclasses import dataclass


ITERATION_METHODOLOGIES = frozenset({
    "SCRUM", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD",
})


@dataclass(frozen=True)
class ChartApplicability:
    cfd: bool
    iteration: bool
    lead_cycle: bool
    burndown: bool


def for_methodology(methodology: str) -> ChartApplicability:
    return ChartApplicability(
        cfd=methodology == "KANBAN",
        iteration=methodology in ITERATION_METHODOLOGIES,
        lead_cycle=True,
        burndown=methodology == "SCRUM",
    )
```

---

#### `Backend/app/api/main.py` (EXTEND — register charts router)

**Analog:** same file lines 163–166 (existing activity + users include)

**Pattern (verbatim style):**
```python
from app.api.v1 import charts as charts_router
app.include_router(charts_router.router, prefix="/api/v1", tags=["charts"])
```

Add immediately after the existing `users_router` line so charts come right after activity/users in the registration block.

---

### Plan 13-01 — Backend Tests

#### `Backend/tests/integration/test_get_project_cfd.py` (and 3 siblings)

**Analog:** `Backend/tests/integration/test_execute_phase_transition.py` (full file, especially lines 28–101 in-memory fakes)

**In-memory fakes pattern** (verbatim from analog lines 28–101):
```python
from dataclasses import dataclass
import pytest


@dataclass
class FakeProject:
    id: int
    process_config: dict
    methodology: str = "SCRUM"


class FakeAuditRepo:
    def __init__(self, snapshots):
        self._snapshots = snapshots

    async def get_cfd_snapshots(self, project_id, date_from, date_to):
        return [s for s in self._snapshots if date_from <= s["date"] <= date_to]


class FakeTaskRepo:
    pass  # not used by CFD use-case


@pytest.mark.asyncio
async def test_cfd_returns_daily_snapshots_for_30d_range():
    today = date.today()
    snapshots = [
        {"date": (today - timedelta(days=i)).isoformat(), "todo": 5, "progress": 3, "review": 2, "done": 10}
        for i in range(0, 30)
    ]
    use_case = GetProjectCFDUseCase(audit_repo=FakeAuditRepo(snapshots), task_repo=FakeTaskRepo())
    result = await use_case.execute(project_id=42, range_days=30)
    assert len(result.days) == 30
    assert result.avg_wip == 5.0
    assert result.avg_completion_per_day == 10.0
```

Verbatim from RESEARCH.md §Code Examples lines 1058–1095. Single-class pytest module per use case (4 files, one per use case).

**Auth/HTTP integration tests** for the new endpoints follow the `Backend/tests/integration/test_activity.py` pattern (lines 12–38) — admin role, non-admin role, unauthenticated. Use the `authenticated_client` fixture from `conftest.py`.

**Divergences:**
- No real DB session — `FakeSession` from analog lines 70–101 is reused only for use cases that take `session` (none of the chart use cases do; only `GetUserActivityUseCase` may need `viewer_project_ids` join, but that's wrapped inside the repo).
- Phase 12 D-09 `idempotency_cache.reset_for_tests()` autouse fixture is NOT needed (chart endpoints are read-only).

---

### Plan 13-01 — Frontend Service Layer

#### `Frontend2/services/chart-service.ts` (NEW)

**Analog:** `Frontend2/services/phase-report-service.ts` (full file, esp. lines 80–117)

**Imports + interfaces + service object pattern** (analog lines 1–117):
```ts
// Phase 13 chart service — read-only fetchers for CFD / Lead-Cycle / Iteration.
import { apiClient } from "@/lib/api-client"

export interface CFDDay {
  date: string
  todo: number
  progress: number
  review: number
  done: number
}

export interface CFDResponse {
  days: CFDDay[]
  avgWip: number
  avgCompletionPerDay: number
}

interface CFDResponseDTO {
  days: Array<{ date: string; todo: number; progress: number; review: number; done: number }>
  avg_wip: number
  avg_completion_per_day: number
}

function mapCFD(d: CFDResponseDTO): CFDResponse {
  return {
    days: d.days,
    avgWip: d.avg_wip,
    avgCompletionPerDay: d.avg_completion_per_day,
  }
}

export const chartService = {
  getCFD: async (projectId: number, range: 7 | 30 | 90): Promise<CFDResponse> => {
    const resp = await apiClient.get<CFDResponseDTO>(
      `/projects/${projectId}/charts/cfd?range=${range}`,
    )
    return mapCFD(resp.data)
  },
  getLeadCycle: async (projectId: number, range: 7 | 30 | 90): Promise<LeadCycleResponse> => { /* … */ },
  getIteration: async (projectId: number, count: 3 | 4 | 6): Promise<IterationResponse> => { /* … */ },
}
```

**Divergences:**
- snake_case → camelCase mapping in `mapCFD` mirrors `mapReport` in analog line 61.
- All three methods are GET-only (no POST/PATCH/DELETE).

---

#### `Frontend2/services/profile-service.ts` (NEW)

**Analog:** `Frontend2/services/phase-report-service.ts`

Same pattern. Provides `getUserSummary(userId)` (existing endpoint), `getUserActivity(userId, params)`, `getUserTasks(userId, status)` (proxies `/tasks?assignee_id=…`).

---

#### `Frontend2/services/activity-service.ts` (NEW or extend `project-service.ts`)

**Analog:** `Frontend2/services/phase-report-service.ts` + `Frontend2/services/project-service.ts` (existing `getActivity` per `useGlobalActivity` consumer)

Provides `getProjectActivity(projectId, params)` and `getUserActivity(userId, params)` calling the respective backend endpoints.

---

### Plan 13-01 — Frontend Hook Layer

#### `Frontend2/hooks/use-cfd.ts` (NEW) + `use-lead-cycle.ts` + `use-iteration.ts`

**Analog:** `Frontend2/hooks/use-phase-reports.ts` lines 16–22 (`usePhaseReports`)

**Verbatim hook shape:**
```ts
import { useQuery } from "@tanstack/react-query"
import { chartService, type CFDResponse } from "@/services/chart-service"

export function useCFD(projectId: number | null | undefined, range: 7 | 30 | 90) {
  return useQuery<CFDResponse>({
    queryKey: ["chart", "cfd", projectId, range],
    queryFn: () => chartService.getCFD(projectId!, range),
    enabled: !!projectId,
    refetchOnWindowFocus: true,  // Phase 13 D-B3 (extends to charts too)
  })
}
```

**Divergences:**
- `refetchOnWindowFocus: true` is explicit per D-B3.
- No `useMutation` — charts are read-only (analog had create/update/PDF mutations).

---

#### `Frontend2/hooks/use-user-activity.ts` + `use-project-activity.ts`

**Analog:** `Frontend2/hooks/use-phase-reports.ts` (`usePhaseReports`) + RESEARCH.md §Pattern 4 (discriminated union)

**Pattern with privacy/filter awareness:**
```ts
import { useQuery } from "@tanstack/react-query"
import { activityService, type ActivityResponse, type ActivityFilter } from "@/services/activity-service"

export function useUserActivity(
  userId: number | null | undefined,
  filter: ActivityFilter,
) {
  return useQuery<ActivityResponse>({
    queryKey: ["activity", "user", userId, filter],
    queryFn: () => activityService.getUserActivity(userId!, filter),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  })
}
```

---

#### `Frontend2/hooks/use-user-summary.ts`

**Analog:** `Frontend2/hooks/use-phase-reports.ts`

```ts
export function useUserSummary(userId: number | null | undefined) {
  return useQuery({
    queryKey: ["user-summary", userId],
    queryFn: () => profileService.getUserSummary(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}
```

---

### Plan 13-01 — Frontend Lib Layer

#### `Frontend2/lib/audit-event-mapper.ts` (NEW)

**Analog:** No analog — new shape; closest style: `Frontend2/lib/methodology-matrix.ts` (constant table + helper function).

**Pattern (verbatim from RESEARCH.md §Pattern 7 lines 482–505):**
```ts
import type { ActivityItem } from "@/services/activity-service"

export type SemanticEventType =
  | "task_created" | "task_status_changed" | "task_assigned"
  | "comment_created" | "task_deleted" | "phase_transition"
  | "milestone_created" | "milestone_updated"
  | "artifact_status_changed" | "phase_report_created"

export function mapAuditToSemantic(item: ActivityItem): SemanticEventType | null {
  if (item.entity_type === "task" && item.action === "updated" && item.field_name === "column_id") return "task_status_changed"
  if (item.entity_type === "task" && item.action === "updated" && item.field_name === "assignee_id") return "task_assigned"
  if (item.entity_type === "task" && item.action === "created") return "task_created"
  if (item.entity_type === "task" && item.action === "deleted") return "task_deleted"
  if (item.action === "phase_transition") return "phase_transition"
  if (item.entity_type === "comment" && item.action === "created") return "comment_created"
  if (item.entity_type === "milestone" && item.action === "created") return "milestone_created"
  if (item.entity_type === "milestone" && item.action === "updated") return "milestone_updated"
  if (item.entity_type === "artifact" && item.action === "updated" && item.field_name === "status") return "artifact_status_changed"
  if (item.entity_type === "phase_report" && item.action === "created") return "phase_report_created"
  return null
}

export function semanticToFilterChip(t: SemanticEventType): "create" | "status" | "assign" | "comment" | "lifecycle" | "all" {
  if (t === "task_created") return "create"
  if (t === "task_status_changed") return "status"
  if (t === "task_assigned") return "assign"
  if (t === "comment_created") return "comment"
  return "lifecycle"
}
```

**This is the single-most-critical file in Plan 13-01** per RESEARCH.md §Pitfall 1 — without it the activity timeline renders empty.

---

#### `Frontend2/lib/activity-date-format.ts` (NEW — LIFT existing `formatTime`)

**Analog:** `Frontend2/components/dashboard/activity-feed.tsx` lines 19–47 (`formatTime`)

**Lift verbatim** (existing code; rename function + add `formatActivityDate` per RESEARCH.md §Pattern 6 lines 436–463):
```ts
export function formatRelativeTime(timestamp: string | Date, language: "tr" | "en"): string {
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  if (diffMin < 1) return language === "tr" ? "şimdi" : "now"
  if (diffMin < 60) return language === "tr" ? `${diffMin} dk` : `${diffMin}m`
  if (diffHr < 24) return language === "tr" ? `${diffHr} sa` : `${diffHr}h`
  // …
}
```

Then update `Frontend2/components/dashboard/activity-feed.tsx` to import the lifted function (single source of truth).

---

#### `Frontend2/lib/charts/buckets.ts` + `applicability.ts` (NEW)

**Analog:** `Frontend2/lib/methodology-matrix.ts` (full file)

**Pattern (constant tables + lookup function — analog lines 14–25):**
```ts
// applicability.ts — Phase 13 D-A4 + RESEARCH.md §Code Examples lines 1183–1199
export const ITERATION_METHODOLOGIES: ReadonlySet<Methodology> = new Set([
  "SCRUM", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD",
])

export function chartApplicabilityFor(methodology: Methodology): ChartApplicability {
  return {
    cfd: methodology === "KANBAN",
    iteration: ITERATION_METHODOLOGIES.has(methodology),
    leadCycle: true,
    burndown: methodology === "SCRUM",
  }
}
```

```ts
// buckets.ts — D-A2 lead/cycle bucket definitions
export const LEAD_CYCLE_BUCKETS = ["0-1d", "1-3d", "3-5d", "5-10d", "10d+"] as const
export type LeadCycleBucket = typeof LEAD_CYCLE_BUCKETS[number]
```

---

### Plan 13-01 — Frontend Primitive

#### `Frontend2/components/primitives/data-state.tsx` (NEW)

**Analog:** `Frontend2/components/primitives/alert-banner.tsx` (closest existing primitive shape — exports type, named export, default fallback)

**Existing primitive pattern** (analog lines 1–66):
```tsx
"use client"
// AlertBanner: 4 tones (warning/danger/success/info) with color-mix backgrounds
import * as React from "react"

export type AlertTone = "warning" | "danger" | "success" | "info"

export interface AlertBannerProps {
  tone?: AlertTone
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function AlertBanner({ tone = "warning", … }: AlertBannerProps) { /* … */ }
```

**DataState shape (verbatim from RESEARCH.md §Pattern 2 lines 263–308):**
```tsx
"use client"
import * as React from "react"
import { AlertBanner } from "./alert-banner"
import { Button } from "./button"
import { useApp } from "@/context/app-context"

interface DataStateProps {
  loading?: boolean
  loadingFallback?: React.ReactNode
  error?: unknown
  errorFallback?: React.ReactNode
  empty?: boolean
  emptyFallback?: React.ReactNode
  onRetry?: () => void
  children: React.ReactNode
}

export function DataState({ loading, loadingFallback, error, errorFallback, empty, emptyFallback, onRetry, children }: DataStateProps) {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => lang === "tr" ? tr : en
  if (loading) return <>{loadingFallback ?? <div style={{ padding: 16, color: "var(--fg-muted)", fontSize: 13 }}>{T("Yükleniyor…", "Loading…")}</div>}</>
  if (error)   return <>{errorFallback   ?? <AlertBanner tone="danger">{T("Veri alınamadı.", "Couldn't load data.")} {onRetry && <Button size="xs" variant="ghost" onClick={onRetry}>{T("Tekrar dene", "Try again")}</Button>}</AlertBanner>}</>
  if (empty)   return <>{emptyFallback   ?? <div style={{ padding: 24, textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>{T("Veri yok.", "No data.")}</div>}</>
  return <>{children}</>
}
```

**Render priority:** `error > loading > empty > children` (RESEARCH.md §Pattern 2 + UI-SPEC §F.1).

**Divergences from AlertBanner analog:**
- Conditional Fragment renders (no wrapper DOM box) — primitive is layout-neutral.
- Accepts 4 separate optional props, not a single `tone`.

---

#### `Frontend2/components/primitives/index.ts` (EXTEND barrel)

**Analog:** same file (existing) lines 1–56

**Pattern (existing line 5–6):**
```ts
export { Avatar } from "./avatar"
export type { AvatarUser, AvatarProps } from "./avatar"
```

**Add:**
```ts
export { DataState } from "./data-state"
export type { DataStateProps } from "./data-state"
```

---

### Plan 13-02 — Header AvatarDropdown + Sidebar Refactor

#### `Frontend2/components/shell/avatar-dropdown.tsx` (full impl)

**Analog:** `Frontend2/components/sidebar.tsx` `SidebarUserMenu` lines 154–289 (verbatim port of click-outside dismiss + menu items + logout)

**Imports + open/close state pattern** (analog lines 161–183):
```tsx
"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Users, Settings, Shield, Globe, ChevronRight, Check } from "lucide-react"
import { Avatar, Badge } from "@/components/primitives"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"

export function AvatarDropdown() {
  const [open, setOpen] = React.useState(false)
  const [dilOpen, setDilOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const { user, logout } = useAuth()
  const { language, setLanguage } = useApp()
  const router = useRouter()
  const pathname = usePathname()
```

**Click-outside dismiss (verbatim from analog lines 175–183):**
```tsx
React.useEffect(() => {
  if (!open) return
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
  }
  document.addEventListener("mousedown", handler)
  return () => document.removeEventListener("mousedown", handler)
}, [open])
```

**Esc + nav-away dismiss (NEW per D-D7 — RESEARCH.md §Pitfall 6):**
```tsx
React.useEffect(() => {
  if (!open) return
  const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
  document.addEventListener("keydown", escHandler)
  return () => document.removeEventListener("keydown", escHandler)
}, [open])

React.useEffect(() => {
  if (open) setOpen(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pathname])
```

**Menu item style + logout pattern (verbatim from analog lines 185–196 + 169–173):**
```tsx
const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, width: "100%",
  padding: "6px 10px", borderRadius: "var(--radius-sm)",
  fontSize: 12.5, textAlign: "left", background: "transparent",
}

const handleLogout = () => {
  setOpen(false)
  logout()
  router.push("/auth/login")
}
```

**Aria attributes (UI-SPEC §A.4):**
```tsx
<button
  onClick={() => setOpen(!open)}
  aria-haspopup="menu"
  aria-expanded={open}
  aria-controls="avatar-dropdown-menu"
  aria-label={language === "tr" ? "Hesap menüsü" : "Account menu"}
>
  <Avatar user={triggerUser} size={28} />
</button>
{open && (
  <div role="menu" id="avatar-dropdown-menu" aria-orientation="vertical" style={{ /* … */ }}>
    {/* MiniProfileHeader (32px Avatar + name + role badge + email row) */}
    {/* … menu items … */}
  </div>
)}
```

**Mini-profile header anatomy (UI-SPEC §A.1):** `Avatar size=32 + name (12.5/600) + Badge tone-by-role + email (11px --fg-subtle)`.

**Admin item conditional render (UI-SPEC §A.1 line 366):**
```tsx
{user?.role?.name === "Admin" && (
  <button role="menuitem" tabIndex={open ? 0 : -1} className="hover-row" style={menuItemStyle} onClick={() => { setOpen(false); router.push("/admin") }}>
    <Shield size={13} />
    {T("Yönetim Paneli", "Admin Panel")}
  </button>
)}
```

**Divergences from analog (`SidebarUserMenu`):**
- Mounted top-right in header, not bottom-up in sidebar — uses `top: calc(100% + 8px); right: 0` instead of `bottom: 100%; left: 0`.
- 5 menu items (`Profilim` / `Ayarlar` / `Yönetim Paneli` admin-only / `Dil` submenu / `Çıkış Yap`) vs analog's 3.
- Uses real `user` from `useAuth().user` — analog uses `PLACEHOLDER_USER` (Phase 8 placeholder).
- Logout target is `/auth/login` (Phase 13 D-D3) — analog uses `/login` (the older route).
- Full a11y wiring (analog has none).

---

#### `Frontend2/components/header.tsx` (EXTEND — mount dropdown)

**Analog:** same file lines 102–131 (existing theme + lang button area)

**Add `<AvatarDropdown/>` between language button and end of header (after line 132):**
```tsx
import { AvatarDropdown } from "./shell/avatar-dropdown"

// … inside <header> after the language button …
<AvatarDropdown />
```

Existing theme + language buttons stay (D-D2 explicit — theme stays in header).

---

#### `Frontend2/components/sidebar.tsx` (REMOVE `SidebarUserMenu`)

**Analog:** same file lines 154–289 (the deleted block) + 417–423 (footer wrapper to also remove)

**Action:** delete the entire `SidebarUserMenu` function (lines 149–289) AND the footer `<div style={{ borderTop: …, padding: 10 }}>` wrapper (lines 417–424). The sidebar's flex layout flows naturally to bottom without the footer block per CONTEXT D-D1 ("sidebar footer area becomes a pure nav region (or empty)").

---

#### `Frontend2/lib/initials.ts` (LIFT existing helper)

**Analog:** `Frontend2/components/dashboard/activity-feed.tsx` lines 49–56 (`getInitials`)

**Lift verbatim:**
```ts
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}
```

Then update `activity-feed.tsx` to import from `@/lib/initials` (single source of truth — RESEARCH.md "Don't Hand-Roll" table).

---

#### `Frontend2/components/shell/avatar-dropdown.test.tsx`

**Analog:** RESEARCH.md §Code Examples lines 1103–1140 (verbatim test pattern based on `Frontend2/components/lifecycle/evaluation-report-card.test.tsx`)

**Verbatim pattern (from RESEARCH.md):**
```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AvatarDropdown } from "./avatar-dropdown"

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 7, full_name: "Test User", email: "[email protected]", role: { name: "Admin" } },
    logout: vi.fn(),
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}))

describe("AvatarDropdown", () => {
  it("renders trigger avatar with initials", () => { /* … */ })
  it("opens menu on trigger click and shows admin item for Admin role", async () => { /* … */ })
  it("dismisses on Escape key", async () => { /* … */ })
})
```

---

### Plan 13-03 — Cross-Site Avatar `href` + DataState Adoption

#### `Frontend2/components/primitives/avatar.tsx` (EXTEND — add optional `href`)

**Analog:** same file (existing 56 lines)

**Existing structure** (lines 9–55):
```tsx
export interface AvatarProps {
  user: AvatarUser | null
  size?: number
  ring?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Avatar({ user, size = 28, ring = false, className, style }: AvatarProps) {
  if (!user) return null
  return (
    <div className={className} style={{ /* avatarStyles … */ }}>
      {user.initials}
    </div>
  )
}
```

**Extension (verbatim from RESEARCH.md §Pattern 3 lines 313–349):**
```tsx
import Link from "next/link"

export interface AvatarProps {
  user: AvatarUser | null
  size?: number
  ring?: boolean
  className?: string
  style?: React.CSSProperties
  href?: string                                 // NEW
  onClick?: (e: React.MouseEvent) => void       // NEW (per UI-SPEC §B.6 ActivityTab user-filter row)
}

export function Avatar({ user, size = 28, ring = false, className, style, href, onClick }: AvatarProps) {
  if (!user) return null
  const visual = (
    <div className={className} style={{ /* unchanged inline styles */ }} onClick={onClick}>
      {user.initials}
    </div>
  )
  if (!href) return visual
  return (
    <Link
      href={href}
      onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
      style={{ display: "inline-block", borderRadius: "50%", lineHeight: 0 }}
    >
      {visual}
    </Link>
  )
}
```

**Critical:** `e.stopPropagation()` on the Link prevents conflict with parent row-click handlers (e.g. `<MTTaskRow onClick={navigate to task-detail}/>`). 19 consumer files identified in RESEARCH.md table.

---

#### `Frontend2/components/primitives/avatar-stack.tsx` (EXTEND — pass `href` per inner Avatar)

**Analog:** same file (existing 75 lines)

**Existing pattern** (lines 36–51):
```tsx
{shown.map((u, i) => (
  <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -6, position: "relative", zIndex: 10 - i }}>
    <Avatar user={u} size={size} style={{ boxShadow: "0 0 0 2px var(--surface)" }} />
  </div>
))}
```

**Extend `AvatarStackUser` to optionally carry `href` and forward it (UI-SPEC §B.6):**
```tsx
export interface AvatarStackUser extends AvatarUser {
  id: string | number
  href?: string  // NEW — per-user link target
}

// Inside map:
<Avatar user={u} size={size} href={u.href} style={{ boxShadow: "0 0 0 2px var(--surface)" }} />
```

**Critical:** the `+N` overflow chip (lines 52–72) is NOT an `<Avatar/>` instance — it stays a non-clickable styled `<div>` per RESEARCH.md §Pattern 3 "AvatarStack overflow handling".

---

#### Avatar consumer patches (15+ files)

For each file in the consumer table, the patch is identical:

**Existing pattern (example from `Frontend2/components/my-tasks/task-row.tsx` line 378):**
```tsx
{assigneeAvatar ? (
  <Avatar user={assigneeAvatar} size={avatarSize} />
) : (
  <span style={{ width: avatarSize }} />
)}
```

**Patch — add optional `href`:**
```tsx
{assigneeAvatar ? (
  <Avatar
    user={assigneeAvatar}
    size={avatarSize}
    href={task.assigneeId ? `/users/${task.assigneeId}` : undefined}
  />
) : (
  <span style={{ width: avatarSize }} />
)}
```

Per CONTEXT D-D4: "EXTEND the `Avatar` primitive (Phase 8 D-02) with an optional `href` prop so any rendered avatar … navigates to `/users/[id]` on click." Each consumer must verify a valid user id is available before adding `href`. Where there is no id (e.g. assignee picker option button — RESEARCH.md table), do NOT add `href`.

#### `Frontend2/components/dashboard/activity-feed.tsx` (PATCH — DataState adoption + Avatar `href`)

**Analog:** same file (existing structure lines 74–82 empty branch + line 108 Avatar)

**Existing empty branch:**
```tsx
{items.length === 0 ? (
  <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 12.5, color: "var(--fg-subtle)" }}>
    {language === "tr" ? "Henüz aktivite yok." : "No activity yet."}
  </div>
) : (
  /* … list … */
)}
```

**Patched with `<DataState/>` per D-F2 — adopt the new primitive in this already-shipped surface:**
```tsx
import { DataState } from "@/components/primitives"

<DataState
  empty={items.length === 0}
  emptyFallback={
    <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 12.5, color: "var(--fg-subtle)" }}>
      {language === "tr" ? "Henüz aktivite yok." : "No activity yet."}
    </div>
  }
>
  {/* … existing list … */}
</DataState>
```

**Avatar patch (line 108):**
```tsx
<Avatar
  user={avatarUser}
  size={22}
  href={item.user_id ? `/users/${item.user_id}` : undefined}
/>
```

---

### Plan 13-04 — ProjectDetail Activity Tab (full)

#### `Frontend2/components/activity/activity-tab.tsx` (canonical)

**Analog:** `Frontend2/components/dashboard/activity-feed.tsx` (closest existing activity surface — for actor render + relative-time helpers); RESEARCH.md §Pattern 4 (discriminated union)

**Discriminated-union prop pattern (RESEARCH.md §Pattern 4 lines 386–401):**
```tsx
"use client"
import { useProjectActivity } from "@/hooks/use-project-activity"
import { useUserActivity } from "@/hooks/use-user-activity"
import { mapAuditToSemantic, semanticToFilterChip } from "@/lib/audit-event-mapper"
import { formatActivityDate, formatRelativeTime } from "@/lib/activity-date-format"
import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"
import { DataState, SegmentedControl, Card, Avatar, Badge, Button } from "@/components/primitives"

type ActivityTabProps =
  | { projectId: number; userId?: never; variant?: "full" | "compact" }
  | { projectId?: never; userId: number; variant?: "full" | "compact" }

export function ActivityTab(props: ActivityTabProps) {
  const variant = props.variant ?? "full"
  const projectQuery = useProjectActivity(props.projectId, !!props.projectId)
  const userQuery    = useUserActivity   (props.userId,    !!props.userId)
  const query = props.projectId ? projectQuery : userQuery
  // …
}
```

**localStorage filter persistence (RESEARCH.md §Pattern 5 lines 411–429):**
```tsx
const key = props.projectId
  ? `activity.filter.${props.projectId}`
  : `activity.filter.user.${props.userId}`

interface ActivityFilter {
  type: "all" | "create" | "status" | "assign" | "comment" | "lifecycle"
  userIdFilter: number | null
  showCount: number
}

const [filter, setFilter] = useLocalStoragePref<ActivityFilter>(
  key,
  { type: "all", userIdFilter: null, showCount: 30 }
)
```

**Layout (verbatim from UI-SPEC §C.1 — vertical timeline):**
```tsx
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
  {/* Filter bar */}
  <ActivityFilter filter={filter} setFilter={setFilter} actors={uniqueActors} />

  {/* Timeline Card */}
  <Card padding={0}>
    <div style={{ position: "relative", paddingLeft: 32 }}>
      {/* Vertical line */}
      <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "var(--border)" }}/>

      <DataState
        loading={query.isLoading}
        loadingFallback={<ActivitySkeleton />}
        error={query.error}
        empty={!filteredEvents.length}
        emptyFallback={<ActivityEmpty filtered={filter.type !== "all"} />}
      >
        {groupedByDate.map(group => (
          <div key={group.label}>
            <div style={{ padding: "14px 16px 8px", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {group.label}
            </div>
            {group.events.map(e => <ActivityRow key={e.id} event={e} />)}
          </div>
        ))}

        {/* Daha fazla yükle */}
        {filteredEvents.length > filter.showCount && (
          <div style={{ padding: 16, textAlign: "center" }}>
            <Button variant="ghost" size="sm" onClick={() => setFilter({ ...filter, showCount: filter.showCount + 30 })}>
              {T("Daha fazla yükle", "Load more")}
            </Button>
          </div>
        )}
      </DataState>
    </div>
  </Card>
</div>
```

**Divergences from analog (`activity-feed.tsx`):**
- Vertical timeline with absolute line vs flat list.
- Date-aware grouping via `formatActivityDate` (UI-SPEC §C.1 — Today / Yesterday / This Week / exact date).
- Uses `mapAuditToSemantic` to derive `semanticType`; uses `eventMeta(semanticType)` to render icon/color/verb.

---

#### `Frontend2/components/activity/activity-row.tsx`

**Analog:** `Frontend2/components/dashboard/activity-feed.tsx` lines 91–125 (per-row render); UI-SPEC §C.1 EventRow anatomy

**Per-row pattern (verbatim from UI-SPEC §C.1):**
```tsx
<div className="hover-row" style={{ display: "flex", gap: 12, padding: "12px 16px", position: "relative" }}>
  {/* Avatar+badge */}
  <div style={{ position: "relative", zIndex: 1 }}>
    <Avatar user={actorAvatar} size={28} href={`/users/${event.actorId}`} />
    <div style={{
      position: "absolute", bottom: -2, right: -2, width: 16, height: 16,
      borderRadius: "50%", background: meta.color,
      boxShadow: "0 0 0 2px var(--surface)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      <meta.Icon size={9} color="var(--primary-fg)" />
    </div>
  </div>

  {/* Content */}
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 12.5 }}>
      <span style={{ fontWeight: 600 }}>{firstName(event.actorName)}</span>
      <span style={{ color: "var(--fg-muted)" }}> {meta.verb} </span>
      <span style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 500 }}
            onClick={() => router.push(`/projects/${event.projectId}/tasks/${event.taskKey}`)}>
        {event.taskKey}
      </span>
    </div>
    {event.taskTitle && (
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
        {event.taskTitle}
      </div>
    )}
    {/* status pair, assign target, comment block — per event type */}
    <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>
      {formatRelativeTime(event.timestamp, lang)}
    </div>
  </div>
</div>
```

---

#### `Frontend2/components/activity/activity-filter.tsx`

**Analog:** `Frontend2/components/my-tasks/mt-toolbar.tsx` (closest filter-bar pattern with SegmentedControl)

Verbatim layout from UI-SPEC §C.1 — `flex align:center gap:10 flexWrap:wrap` containing SegmentedControl + vertical separator + user-avatar row + count caption.

---

#### `Frontend2/components/activity/activity-empty.tsx`

**Analog:** `Frontend2/components/my-tasks/mt-empty.tsx`

**Pattern** (UI-SPEC §C.4):
- Filter-active empty: `"Bu filtreyle eşleşen olay yok."` muted
- Total-empty: `"Henüz aktivite yok."` + `"Bir görev oluştur"` ghost Button → opens TaskCreateModal via `useTaskModal().openCreate()`

---

#### `Frontend2/components/activity/activity-skeleton.tsx`

**Analog:** No analog — new shape; closest style: shimmer keyframe in `Frontend2/app/globals.css` lines 211–214

10 placeholder rows, each with avatar circle + 2-line shimmer text. Uses `@keyframes shimmer` — Plan 13-04 may need to ADD this keyframe to `globals.css` (currently only `fadeIn` exists per UI-SPEC reference + RESEARCH.md §Code Examples lines 1146–1175).

---

#### `Frontend2/components/project-detail/activity-stub-tab.tsx` (REPLACE)

**Analog:** same file (existing 21-line stub)

**Action:** replace entire body with:
```tsx
"use client"
import { ActivityTab } from "@/components/activity/activity-tab"

export function ActivityStubTab({ projectId }: { projectId: number }) {
  return <ActivityTab projectId={projectId} variant="full" />
}
```

Or rename file to `activity-tab-mount.tsx` and update consumer (`project-detail-shell.tsx`). Plan author chooses.

---

### Plan 13-05 — User Profile Page Route + Tasks Tab

#### `Frontend2/app/(shell)/users/[id]/page.tsx`

**Analog:** `Frontend2/app/(shell)/projects/[id]/page.tsx` (full file)

**Imports + dynamic-route + useParams pattern** (analog lines 1–17):
```tsx
"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import { useUserSummary } from "@/hooks/use-user-summary"
import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export default function UserProfilePage() {
  const params = useParams()
  const userId = Number(params.id)
  const { language } = useApp()
  const { data: summary, isLoading } = useUserSummary(userId)
```

**Loading + 404 pattern (verbatim from analog lines 22–38):**
```tsx
if (isLoading) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)" }}>
      {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
    </div>
  )
}

if (!summary) {
  return (
    <Card padding={40}>
      <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
        {language === 'tr' ? 'Kullanıcı bulunamadı.' : 'User not found.'}
      </div>
    </Card>
  )
}
```

**Tabs + URL `?tab=` query param sync (UI-SPEC §D.4) — match Phase 11 D-04 ProjectDetail pattern:**
```tsx
const [activeTab, setActiveTab] = React.useState<TabId>("tasks")
// useEffect to sync ?tab= → activeTab on mount + activeTab → URL on change
```

Page layout: `flex column gap:20, max-width: 1100px` per UI-SPEC §D.1.

---

#### `Frontend2/components/profile/profile-header.tsx`

**Analog:** Composite — `Frontend2/components/dashboard/stat-card.tsx` (Card + tone slot pattern) + `Frontend2/app/(shell)/projects/[id]/page.tsx` lines 53–70 (page header structure with title row + button)

**Card + flex row pattern (analog stat-card.tsx lines 30–73):**
```tsx
<Card padding={24}>
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <Avatar user={user} size={64} ring={isSelf} style={{ fontSize: 24 }} />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{user.name}</h1>
        <Badge tone={roleTone}>{user.role}</Badge>
        {isSelf && <Badge tone="primary" size="xs">{T("Sen", "You")}</Badge>}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>{user.email}</div>
      {/* Inline metrics row */}
    </div>
    {isSelf && <Button variant="secondary" size="sm" icon={<Edit size={13} />}>{T("Düzenle", "Edit")}</Button>}
  </div>
</Card>
```

`isSelf = useAuth().user?.id === userId` (UI-SPEC §D.4).

---

#### `Frontend2/components/profile/profile-tasks-tab.tsx`

**Analog:** `Frontend2/components/my-tasks/task-group-list.tsx` (closest "group-by-project + MTTaskRow density compact" surface)

**Pattern (UI-SPEC §D.1 TasksTab inner layout):**
```tsx
<div>
  {/* Filter bar */}
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <SegmentedControl
      options={[
        { id: "active", label: T("Aktif", "Active") },
        { id: "completed", label: T("Tamamlanan", "Completed") },
        { id: "all", label: T("Tümü", "All") },
      ]}
      value={filter}
      onChange={setFilter}
    />
    <div style={{ flex: 1 }}/>
    <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
      {filteredTasks.length} {T("görev", "tasks")}
    </span>
  </div>

  {/* Per-project group */}
  {Object.entries(grouped).map(([projectId, group]) => (
    <Card key={projectId} padding={0} style={{ marginBottom: 12 }}>
      <div style={{
        padding: "10px 14px", background: "var(--surface-2)",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(--av-${(group.projectId % 8) + 1})` }}/>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{group.projectKey}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{group.projectName}</span>
        <Badge size="xs">{group.tasks.length}</Badge>
      </div>
      {group.tasks.map(task => (
        <TaskRow key={task.id} task={task} density="compact" showProject={false} />
      ))}
    </Card>
  ))}
</div>
```

---

### Plan 13-06 — Profile Projects + Activity Tabs

#### `Frontend2/components/profile/profile-projects-tab.tsx` (full impl)

**Analog:** `Frontend2/components/projects/project-card.tsx` consumer + `Frontend2/app/globals.css` `.projects-grid` lines 173–183

**Pattern (3-col grid reusing existing CSS class):**
```tsx
import { ProjectCard } from "@/components/projects/project-card"

<div className="projects-grid">
  {projects.map(p => <ProjectCard key={p.id} project={p} />)}
</div>
```

Empty state per UI-SPEC §D.4: `"Henüz proje yok."` (NEW per D-F2).

---

#### `Frontend2/app/(shell)/users/[id]/page.tsx` (EXTEND — Activity tab)

**Analog:** Plan 13-05 base + `<ActivityTab/>` from Plan 13-04

**Pattern:**
```tsx
{activeTab === "activity" && <ActivityTab userId={userId} variant="full" />}
```

---

### Plan 13-07 — Reports Page CFD + Lead/Cycle Charts

#### `Frontend2/app/(shell)/reports/page.tsx` (REWRITE)

**Analog:** `Frontend2/app/(shell)/projects/[id]/page.tsx` (closest "page that loads + composes many child cards" pattern)

**Page shell + composition per UI-SPEC §E.1 hierarchy:**
```tsx
"use client"
import * as React from "react"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import { ProjectPicker } from "@/components/reports/project-picker"
import { DateRangeFilter } from "@/components/reports/date-range-filter"
import { CFDChart } from "@/components/reports/cfd-chart"
import { LeadCycleChart } from "@/components/reports/lead-cycle-chart"
import { Button, StatCard } from "@/components/primitives"
import { Download } from "lucide-react"
import { chartApplicabilityFor } from "@/lib/charts/applicability"

export default function ReportsPage() {
  const { language } = useApp()
  const { data: projects } = useProjects("ACTIVE,COMPLETED")
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null)
  const [globalRange, setGlobalRange] = React.useState<7 | 30 | 90 | "q2">(30)

  const project = projects?.find(p => p.id === selectedProjectId)
  const applicable = project ? chartApplicabilityFor(project.methodology) : null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + ProjectPicker + DateRangeFilter + PDF Button */}
      {/* 4 StatCards (existing prototype layout — verbatim from misc.jsx 374–379) */}
      {/* Burndown + Team Load row (PRESERVED — existing custom SVG) */}
      <CFDChart projectId={selectedProjectId} range={globalRange} applicable={applicable?.cfd} />
      <div className="reports-leadcycle-grid">
        <LeadCycleChart projectId={selectedProjectId} kind="lead" range={globalRange} />
        <LeadCycleChart projectId={selectedProjectId} kind="cycle" range={globalRange} />
      </div>
      {/* Plan 13-08 appends IterationChart + PhaseReportsSection */}
    </div>
  )
}
```

**Divergences from analog:**
- Loads project list (not single project) — uses `useProjects("ACTIVE,COMPLETED")`.
- Burndown + Team Load are PRESERVED as inline SVG (D-A2 explicit).
- Chart cards are conditionally gated by methodology (D-A4) — per `chartApplicabilityFor()`.

---

#### `Frontend2/components/reports/chart-card.tsx`

**Analog:** `Frontend2/components/dashboard/stat-card.tsx` (Card + tone slot shell)

**Pattern (UI-SPEC §E.1 ChartCard internal anatomy):**
```tsx
"use client"
import * as React from "react"
import { Card, AlertBanner, SegmentedControl } from "@/components/primitives"
import { DataState } from "@/components/primitives"

interface ChartCardProps {
  title: string
  rangePicker?: React.ReactNode
  legend?: React.ReactNode
  footerMetrics?: React.ReactNode
  methodologyMessage?: string  // when set, replaces content with AlertBanner info
  query: { isLoading: boolean; error?: unknown; data?: unknown }
  loadingFallback: React.ReactNode  // chart-shape skeleton
  emptyFallback?: React.ReactNode
  children: React.ReactNode  // the actual chart SVG
}

export function ChartCard({ title, rangePicker, legend, footerMetrics, methodologyMessage, query, loadingFallback, emptyFallback, children }: ChartCardProps) {
  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600 }}>{title}</h3>
        <div style={{ flex: 1 }}/>
        {rangePicker}
      </div>
      {methodologyMessage ? (
        <AlertBanner tone="info">{methodologyMessage}</AlertBanner>
      ) : (
        <DataState
          loading={query.isLoading}
          loadingFallback={loadingFallback}
          error={query.error}
          emptyFallback={emptyFallback}
        >
          {children}
        </DataState>
      )}
      {(legend || footerMetrics) && (
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5 }}>
          {legend}
          <div style={{ flex: 1 }}/>
          {footerMetrics}
        </div>
      )}
    </Card>
  )
}
```

---

#### `Frontend2/components/reports/cfd-chart.tsx`

**Analog:** No analog — new shape; closest style: RESEARCH.md §Pattern 1 lines 215–256

**Verbatim Recharts pattern from RESEARCH.md §Pattern 1:**
```tsx
"use client"
import * as React from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "./chart-card"
import { useCFD } from "@/hooks/use-cfd"
import { CFDSkeleton } from "./cfd-skeleton"

interface CFDChartProps { projectId: number | null; range: 7 | 30 | 90; applicable: boolean | null }

export function CFDChart({ projectId, range, applicable }: CFDChartProps) {
  const query = useCFD(projectId, range)
  return (
    <ChartCard
      title={T("Kümülatif Akış Diyagramı", "Cumulative Flow Diagram")}
      methodologyMessage={applicable === false
        ? T("Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir.",
            "Cumulative Flow Diagram is only available for Kanban projects.")
        : undefined}
      query={query}
      loadingFallback={<CFDSkeleton />}
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={query.data?.days ?? []}>
          <XAxis dataKey="date"/>
          <YAxis/>
          <Tooltip cursor={{ stroke: "var(--border-strong)" }}/>
          <Area dataKey="todo"     stackId="1" fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"     stroke="var(--status-todo)"/>
          <Area dataKey="progress" stackId="1" fill="color-mix(in oklch, var(--status-progress) 40%, transparent)" stroke="var(--status-progress)"/>
          <Area dataKey="review"   stackId="1" fill="color-mix(in oklch, var(--status-review) 40%, transparent)"   stroke="var(--status-review)"/>
          <Area dataKey="done"     stackId="1" fill="color-mix(in oklch, var(--status-done) 40%, transparent)"     stroke="var(--status-done)"/>
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
```

**Critical:** the `"use client"` directive is mandatory per RESEARCH.md §Pitfall 3 — Recharts crashes during SSR.

**Custom Tooltip per RESEARCH.md §Pitfall 4** (avoid Recharts default white box):
```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 6, padding: "8px 10px", boxShadow: "var(--shadow-lg)", fontSize: 11.5,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }}/>
          <span>{p.name}:</span><span className="mono">{p.value}</span>
        </div>
      ))}
    </div>
  )
}
```

---

#### `Frontend2/components/reports/lead-cycle-chart.tsx`

**Analog:** No analog — new shape

Recharts `BarChart` with 5-bucket histogram + percentile annotation row. Pattern mirrors `cfd-chart.tsx` shell + custom tooltip; bars use `<Bar dataKey="count" fill="color-mix(in oklch, var(--primary) 70%, transparent)"/>` for Lead and `var(--status-progress)` for Cycle (UI-SPEC §E.3 color table).

---

#### `Frontend2/components/reports/cfd-skeleton.tsx` + `lead-cycle-skeleton.tsx`

**Analog:** No analog — new shape; closest style: shimmer keyframe in `Frontend2/app/globals.css`

**Pattern:** chart-shape SVG with `@keyframes shimmer` animation. CFD = 4 stacked area shimmer bands; Lead/Cycle = 5-bar histogram shimmer. Plan 13-09 (mobile + a11y) adds the `@keyframes shimmer` to `globals.css` if not already added by Plan 13-04.

---

#### `Frontend2/components/reports/date-range-filter.tsx`

**Analog:** `Frontend2/components/primitives/segmented-control.tsx` (consumer)

**Pattern (Claude's Discretion picked SegmentedControl reuse per UI-SPEC §E.1):**
```tsx
"use client"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export function DateRangeFilter({ value, onChange }: { value: 7 | 30 | 90 | "q2"; onChange: (v: 7 | 30 | 90 | "q2") => void }) {
  const { language } = useApp()
  return (
    <SegmentedControl
      options={[
        { id: "7",  label: language === "tr" ? "Son 7 gün"  : "Last 7 days" },
        { id: "30", label: language === "tr" ? "Son 30 gün" : "Last 30 days" },
        { id: "90", label: language === "tr" ? "Son 90 gün" : "Last 90 days" },
        { id: "q2", label: "Q2 2026" },
      ]}
      value={String(value)}
      onChange={(v) => onChange(v === "q2" ? "q2" : Number(v) as 7 | 30 | 90)}
      size="sm"
    />
  )
}
```

---

#### `Frontend2/components/reports/project-picker.tsx`

**Analog:** `Frontend2/components/primitives/input.tsx` (closest existing styled input)

**Pattern (native `<select>` styled to match Input primitive):**
```tsx
import { useProjects } from "@/hooks/use-projects"

export function ProjectPicker({ value, onChange }: { value: number | null; onChange: (id: number) => void }) {
  const { data: projects } = useProjects("ACTIVE,COMPLETED")
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        padding: "6px 10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12.5,
        color: "var(--fg)",
      }}
    >
      <option value="" disabled>{T("Proje seç", "Select project")}</option>
      {projects?.map(p => <option key={p.id} value={p.id}>{p.key} — {p.name}</option>)}
    </select>
  )
}
```

---

### Plan 13-08 — Iteration Comparison + Faz Raporları Section

#### `Frontend2/components/reports/iteration-chart.tsx`

**Analog:** No analog — new shape; same Recharts shell as `cfd-chart.tsx`

**Recharts grouped BarChart** with 3 series per sprint (Planlanan / Tamamlanan / Taşınan) per UI-SPEC §E.3 color table.

---

#### `Frontend2/components/reports/phase-reports-section.tsx`

**Analog:** `Frontend2/components/lifecycle/history-subtab.tsx` (closest "list of phase rows + click → inline expand card" pattern)

**Pattern (UI-SPEC §E.1 PhaseReportsSection hierarchy + D-E1 2-tab outer Tabs):**
```tsx
"use client"
import * as React from "react"
import { Tabs, Card } from "@/components/primitives"
import { EvaluationReportCard } from "@/components/lifecycle/evaluation-report-card"
import { useProjects } from "@/hooks/use-projects"
import { usePhaseReports } from "@/hooks/use-phase-reports"

export function PhaseReportsSection() {
  const [outerTab, setOuterTab] = React.useState<"active" | "archived">("active")
  const [pickerProject, setPickerProject] = React.useState<number | null>(null)
  const [pickerPhase, setPickerPhase] = React.useState<string | null>(null)

  const { data: projects } = useProjects(outerTab === "active" ? "ACTIVE,COMPLETED" : "ARCHIVED")
  const { data: reports } = usePhaseReports(pickerProject)

  return (
    <Card padding={16}>
      <Tabs
        tabs={[
          { id: "active", label: T("Aktif + Tamamlanan", "Active + Completed") },
          { id: "archived", label: T("Arşivlenmiş", "Archived") },
        ]}
        active={outerTab}
        onChange={setOuterTab}
        size="md"
      />
      {/* Picker row + recent rows + inline EvaluationReportCard expand */}
    </Card>
  )
}
```

**Critical (RESEARCH.md §Cross-File Dependency Rules):** `EvaluationReportCard` is reused in **read-only mode** — pass `canEdit=false` (or whatever flag the existing component exposes per Phase 12 D-40). Plan 13-08's RTL test must verify the card mounts cleanly outside its Lifecycle context.

---

### Plan 13-09 — Mobile Breakpoints + A11y Polish

#### `Frontend2/app/globals.css` (EXTEND)

**Analog:** same file lines 172–206 (existing `.projects-grid`, `.task-detail-grid`, `.pd-tabs-wrap` Phase 11 D-54 patterns)

**Existing pattern to imitate (lines 185–195):**
```css
/* Phase 11 D-54: Task Detail responsive */
.task-detail-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  min-height: 0;
}
@media (max-width: 1024px) {
  .task-detail-grid { grid-template-columns: 1fr; }
}
```

**Add Phase 13 grid classes per RESEARCH.md §Code Examples lines 1149–1175:**
```css
/* Phase 13 D-F1: Reports + Profile responsive grids */
.reports-primary-grid    { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
.reports-leadcycle-grid  { display: grid; grid-template-columns: 1fr 1fr;     gap: 16px; }
.reports-statcards-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.profile-statcards-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.profile-projects-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

@media (max-width: 1024px) {
  .reports-primary-grid,
  .reports-leadcycle-grid,
  .profile-statcards-grid,
  .profile-projects-grid { grid-template-columns: 1fr; }
  .reports-statcards-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .reports-statcards-grid { grid-template-columns: 1fr; }
  .chart-cfd-svg       { height: 160px !important; }
  .chart-leadcycle-svg { height: 120px !important; }
  .chart-iteration-svg { height: 140px !important; }
  .profile-header-card { flex-direction: column !important; align-items: flex-start !important; }
  .activity-row-avatar { width: 22px !important; height: 22px !important; }
}

/* Plan 13-04 may also need to add this if not already shipped: */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
```

---

### Plan 13-10 — E2E Smoke + UAT Artifact

#### `Frontend2/e2e/reports-charts.spec.ts` (and 3 sibling specs)

**Analog:** `Frontend2/e2e/task-create.spec.ts` (full file, esp. lines 21–80 skip-guard pattern)

**Skip-guard pattern (verbatim from analog lines 21–43):**
```ts
import { test, expect } from "@playwright/test"

test.describe("Phase 13 — Reports charts smoke", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "chromium-only for Phase 13")

  test("CFD chart renders for first project", async ({ page }) => {
    await page.goto("/reports")

    const projectPicker = page.locator("select").first()
    const visible = await projectPicker.isVisible({ timeout: 5000 }).catch(() => false)
    if (!visible) {
      test.skip(true, "Project picker not visible — auth/seed unavailable")
      return
    }

    const options = await projectPicker.locator("option").allTextContents()
    const firstReal = options.find(o => o.trim() && !o.toLowerCase().includes("seç"))
    if (!firstReal) {
      test.skip(true, "No project options available — seed data missing")
      return
    }
    await projectPicker.selectOption({ label: firstReal })

    // CFD chart card title visible
    await expect(page.getByText(/Kümülatif Akış|Cumulative Flow/i)).toBeVisible({ timeout: 5000 })
  })
})
```

**Pattern for the 3 siblings:**
- `profile-page.spec.ts` — load `/users/{id}` for own + other user; verify Düzenle button visibility differs.
- `avatar-dropdown.spec.ts` — open menu via avatar click, click "Çıkış Yap", verify URL is `/auth/login`.
- `activity-tab.spec.ts` — navigate to project Activity tab, set filter to "Yorum", reload, verify filter persisted.

All 4 specs ship with defensive skip-guards (no test-DB seeder yet — RESEARCH.md "Cross-phase scope flags").

---

#### `.planning/phases/13-reporting-activity-user-profile/13-UAT-CHECKLIST.md`

**Analog:** Phase 12 / Phase 11 UAT checklists (look in `.planning/phases/11-task-features-board-enhancements/` or `.planning/phases/12-lifecycle-phase-gate-workflow-editor/` — most recent shipped UAT checklists)

**Pattern:** 15–20 row table with columns `# | Requirement (REPT/PROF code) | Surface | Click-through Steps | Pass/Fail | Notes`. Each row maps to a CONTEXT requirement (REPT-01..04 + PROF-01..04). Used by `/gsd-verify-work 13`.

---

## Shared Patterns

### Authentication / Authorization (Backend)

**Source:** `Backend/app/api/deps/project.py` lines 16–38 (`get_project_member`)
**Apply to:** all 3 chart endpoints (`charts.py`)

```python
async def get_project_member(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
) -> User:
    if _is_admin(current_user):
        return current_user
    project = await project_repo.get_by_id_and_user(project_id, current_user.id)
    if project is None:
        raise HTTPException(status_code=403, detail="Access denied to this project")
    return current_user
```

`/users/{id}/activity` uses `Depends(get_current_user)` only (privacy filter is inside the use case via `viewer_user_id` + `is_admin`).

### Repository DI Factory (Backend)

**Source:** `Backend/app/api/deps/audit.py` lines 1–18
**Apply to:** all chart endpoints

```python
def get_audit_repo(session: AsyncSession = Depends(get_db_session)) -> IAuditRepository:
    return SqlAlchemyAuditRepository(session)
```

If a new chart-aggregation repo emerges, mirror this pattern in `Backend/app/api/deps/chart.py`. CONTEXT predicts none needed (charts read audit_log + tasks + sprints — all already have repos).

### Pydantic DTO Convention (Backend)

**Source:** `Backend/app/application/dtos/activity_dtos.py` lines 1–29
**Apply to:** all 3 chart DTO files

```python
from pydantic import BaseModel, ConfigDict

class CFDDayDTO(BaseModel):
    # …fields…
    model_config = ConfigDict(from_attributes=True)
```

Per CLAUDE.md §3 Domain layer rule. DTO suffix mandatory (CLAUDE.md §6 Project Constraints item 7).

### Service-Layer Mapping snake_case → camelCase (Frontend)

**Source:** `Frontend2/services/phase-report-service.ts` lines 61–78 (`mapReport`)
**Apply to:** every new service file (chart-service, profile-service, activity-service)

```ts
function mapCFD(d: CFDResponseDTO): CFDResponse {
  return {
    days: d.days,
    avgWip: d.avg_wip,
    avgCompletionPerDay: d.avg_completion_per_day,
  }
}
```

### TanStack Query Hook Convention (Frontend)

**Source:** `Frontend2/hooks/use-phase-reports.ts` lines 16–22 (`usePhaseReports`)
**Apply to:** every new chart/activity/profile hook

```ts
export function useCFD(projectId: number | null | undefined, range: 7 | 30 | 90) {
  return useQuery({
    queryKey: ["chart", "cfd", projectId, range],
    queryFn: () => chartService.getCFD(projectId!, range),
    enabled: !!projectId,
    refetchOnWindowFocus: true,  // D-B3
  })
}
```

`refetchOnWindowFocus: true` is mandatory for Phase 13 hooks per D-B3.

### `"use client"` Directive (Frontend)

**Source:** every existing `Frontend2/components/**/*.tsx` interactive component (e.g. `avatar.tsx` line 1, `sidebar.tsx` line 1)
**Apply to:** every new Phase 13 component AND every Recharts file (RESEARCH.md §Pitfall 3 — Recharts crashes in SSR without it)

### Click-Outside Dismiss (Frontend)

**Source:** `Frontend2/components/sidebar.tsx` lines 175–183 (verbatim port of `shell.jsx` lines 104–107)
**Apply to:** AvatarDropdown (Plan 13-02), and any future menu-style component

```tsx
React.useEffect(() => {
  if (!open) return
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
  }
  document.addEventListener("mousedown", handler)
  return () => document.removeEventListener("mousedown", handler)
}, [open])
```

### Logout Flow (Frontend)

**Source:** `Frontend2/components/sidebar.tsx` lines 169–173 (`handleLogout`) + `Frontend2/context/auth-context.tsx` lines 54–68 (`logout`)
**Apply to:** AvatarDropdown's Çıkış Yap menu item

**Plan 13-02 divergence:** target is `/auth/login` (Phase 13 D-D3), not `/login` (the older route the analog uses). Verify route exists; fall back to `/login` only if `/auth/login` is not registered.

### `useLocalStoragePref` for Filter Persistence (Frontend)

**Source:** `Frontend2/hooks/use-local-storage-pref.ts` (full file — lines 37–58)
**Apply to:** ActivityTab (Plan 13-04) per D-B7

```ts
const [filter, setFilter] = useLocalStoragePref<ActivityFilter>(
  `activity.filter.${projectId}`,
  { type: "all", userIdFilter: null, showCount: 30 }
)
```

The `spms.` prefix is automatic (line 16). SSR-safe via `typeof window === "undefined"` guard (line 19).

### Vitest + RTL Test Pattern (Frontend)

**Source:** `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` lines 1–60 (full mock + render scaffold) + `Frontend2/test/helpers/render-with-providers.tsx` (full file)
**Apply to:** every new component test in Plans 13-02, 13-04, 13-05, 13-06, 13-07, 13-08

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { renderWithProviders } from "@/test/helpers/render-with-providers"

vi.mock("@/context/auth-context", () => ({ useAuth: () => ({ user: { … }, logout: vi.fn() }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/dashboard" }))
```

The shared provider wrapper (`renderWithProviders`) mounts `AppProvider`, `AuthProvider`, `ToastProvider`, `TaskModalProvider`, and a fresh `QueryClient`.

### Backend In-Memory Fakes (Backend Tests)

**Source:** `Backend/tests/integration/test_execute_phase_transition.py` lines 28–101 (full fakes block)
**Apply to:** all 4 Plan 13-01 backend integration tests

`FakeAuditRepo`, `FakeTaskRepo`, `FakeProject`, `FakeSession` — mirror the analog's dataclass + minimal-interface style. No real DB; tests run in <0.1s.

### E2E Skip-Guard Pattern (E2E)

**Source:** `Frontend2/e2e/task-create.spec.ts` lines 21–43 (skip-when-not-seeded pattern)
**Apply to:** all 4 Plan 13-10 specs

```ts
test.skip(({ browserName }) => browserName !== "chromium", "chromium-only for Phase 13")
const visible = await locator.isVisible({ timeout: 5000 }).catch(() => false)
if (!visible) { test.skip(true, "auth/seed unavailable"); return }
```

### Methodology Gating (Strategy Pattern — both sides)

**Source — Frontend:** `Frontend2/lib/methodology-matrix.ts` (full file — constant table + lookup helper)
**Source — Backend:** `Backend/app/domain/services/chart_applicability.py` (NEW — see Plan 13-01 above)
**Apply to:** every chart card (CFD/Iteration gating) + Iteration use case

Avoid scattering `if methodology === 'KANBAN'` checks. Import `chartApplicabilityFor()` (frontend) / `for_methodology()` (backend) wherever the decision is made. CLAUDE.md §4.1 OCP.

### Card + DataState Composition (Frontend)

**Source:** `Frontend2/components/dashboard/stat-card.tsx` (Card padding shell) + `Frontend2/components/primitives/alert-banner.tsx` (tone slot pattern)
**Apply to:** every chart card (Plan 13-07/08), profile tab content, Faz Raporları rows

```tsx
<Card padding={16}>
  {/* header */}
  <DataState
    loading={query.isLoading}
    loadingFallback={<Skeleton/>}
    error={query.error}
    emptyFallback={<Empty/>}
  >
    {/* content */}
  </DataState>
</Card>
```

---

## No Analog Found

Files where the codebase has no close match. Planner should consult RESEARCH.md primitives or UI-SPEC anatomy directly (each cited inline in the plan-specific sections above).

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `Backend/app/domain/services/chart_applicability.py` | domain service | pure logic | No existing `domain/services/` chart helper. Closest style: `application/services/phase_gate_service.py` (rule eval) + `Frontend2/lib/methodology-matrix.ts` (constant table). |
| `Frontend2/components/primitives/data-state.tsx` | primitive | render switch | No existing 3-state slot primitive. Closest style: `alert-banner.tsx` for type/export shape. |
| `Frontend2/components/reports/cfd-chart.tsx` | component | read-only | No existing Recharts file. Pattern source: RESEARCH.md §Pattern 1 lines 215–256. |
| `Frontend2/components/reports/lead-cycle-chart.tsx` | component | read-only | Same — first Recharts BarChart. |
| `Frontend2/components/reports/iteration-chart.tsx` | component | read-only | Same — first Recharts grouped BarChart. |
| `Frontend2/components/reports/cfd-skeleton.tsx`, `lead-cycle-skeleton.tsx`, `iteration-skeleton.tsx` | component | n/a | No existing chart-shape skeleton. Closest: `globals.css` shimmer keyframe. |
| `Frontend2/lib/audit-event-mapper.ts` | utility | pure mapping | First audit→semantic mapper. Closest style: `lib/methodology-matrix.ts`. **CRITICAL — RESEARCH.md §Pitfall 1 ranks this as the highest hidden risk in Phase 13.** |
| `Frontend2/lib/charts/buckets.ts` + `applicability.ts` | utility | constants | First chart-domain helpers. Closest style: `lib/methodology-matrix.ts`. |
| `Frontend2/components/activity/activity-skeleton.tsx` | component | n/a | First timeline skeleton. Pattern: 10 placeholder rows + shimmer; add `@keyframes shimmer` to `globals.css` if not present. |

---

## Metadata

**Analog search scope:**
- `Backend/app/api/v1/`, `Backend/app/application/{use_cases,dtos,services}/`, `Backend/app/domain/repositories/`, `Backend/app/infrastructure/database/repositories/`, `Backend/app/api/deps/`, `Backend/tests/integration/`
- `Frontend2/app/(shell)/`, `Frontend2/components/{primitives,dashboard,my-tasks,project-detail,projects,lifecycle,task-detail,header,shell}/`, `Frontend2/components/sidebar.tsx`, `Frontend2/components/header.tsx`, `Frontend2/services/`, `Frontend2/hooks/`, `Frontend2/lib/`, `Frontend2/context/`, `Frontend2/test/helpers/`, `Frontend2/e2e/`, `Frontend2/app/globals.css`, `Frontend2/app/layout.tsx`, `Frontend2/package.json`

**Files scanned:** ~85 (sample of files actually read; many more inspected via `Bash(ls)` listings to confirm path layout).

**Pattern extraction date:** 2026-04-26.

**Key cross-cutting risk surfaced:** the `audit_log → semantic event mapper` (Plan 13-01 `Frontend2/lib/audit-event-mapper.ts`) is the SINGLE highest hidden contract in Phase 13. RESEARCH.md §Pitfall 1 + §Don't Hand-Roll explicitly call it out. Without this mapper Phase 13's ActivityTab renders empty even when all backend SQL succeeds. The planner MUST include this file in Plan 13-01 acceptance criteria.

**Companion contract risk:** the existing `IAuditRepository.get_project_activity` filters `entity_type='project'` only (verified — `audit_repo.py` lines 120–122). Plan 13-01 backend extension MUST broaden the project-activity SQL via UNION on `entity_type='task'` (RESEARCH.md §Pitfall 2) OR document the limitation. Planner decides.
