# Architecture Patterns

**Domain:** Software Project Management — v2.0 Frontend Overhaul & Backend Expansion
**Researched:** 2026-04-20

## Recommended Architecture

The v2.0 milestone is an integration challenge: a completely new frontend design system (inline styles + CSS variables with oklch) must coexist with Next.js App Router, while the backend gains 3 new entities and workflow extensions that must fit the existing Clean Architecture.

### High-Level Integration Strategy

```
New_Frontend Prototype (JSX, inline styles, CSS vars, mock data)
        |
        | "Design Freeze Conversion"
        v
Next.js 14 App Router (TypeScript, real API, same visual output)
        |
        | TanStack Query + Services
        v
FastAPI Backend (Clean Architecture: Domain > Application > Infrastructure > API)
        |
        v
PostgreSQL 15 (existing 20+ tables + 3 new tables + 2 column additions)
```

---

## Component Boundaries

### Frontend — New Components Needed

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ThemeProvider` (new) | Applies oklch CSS variables, presets, mode, radius, density | Root layout, all components |
| `I18nProvider` (new) | TR/EN string lookup via `useI18n()` hook | All pages/components |
| `WorkflowCanvas` | SVG-based lifecycle/status graph renderer | LifecycleTab, WorkflowEditorPage |
| `PhaseGateExpand` | Inline criteria check + phase transition UI | LifecycleTab |
| `CreateProjectWizard` | Multi-step project creation with methodology | ProjectsPage, Backend API |
| `CreateTaskModal` (overhaul) | Rich task creation with phase assignment | Header, ProjectDetailPage |
| `LifecycleTab` | Phase canvas + milestones + artifacts + history | ProjectDetailPage |
| `ActivityTab` | Real-time project activity feed | ProjectDetailPage |
| `BacklogPanel` | Sliding side panel for global backlog | ProjectDetailPage |
| `UserProfilePage` | User stats, tasks, activity | Router |
| `MilestoneService` (new) | CRUD for milestones | LifecycleTab, MilestonesSubTab |
| `ArtifactService` (new) | CRUD for artifacts | LifecycleTab, ArtifactsSubTab |
| `PhaseGateService` (new) | Phase transition API calls | LifecycleTab, PhaseGateExpand |
| `ActivityService` (new) | Project activity stream | ActivityTab |
| `graph-utils.ts` (new) | BFS phase state computation (shared logic) | WorkflowCanvas, LifecycleTab |

### Frontend — Modified Components

| Component | Modification | Why |
|-----------|-------------|-----|
| `app/layout.tsx` | Add ThemeProvider, I18nProvider, swap font system | New design system tokens |
| `globals.css` | Replace Tailwind utilities with CSS variable declarations | Design freeze: inline styles + vars |
| `app-shell.tsx` | Rebuild with new Sidebar/Header from prototype | New visual design |
| `project/[id]/page.tsx` | Add LifecycleTab, ActivityTab, BacklogPanel | New sub-features |
| `lib/types.ts` | Add Milestone, Artifact, PhaseReport, ProjectStatus, edge types | New entities |
| `services/project-service.ts` | Add status field, phase-transition calls | ProjectStatus extension |
| `services/task-service.ts` | Add phase_id field support | Task-phase assignment |

### Backend — New Components

| Component | Layer | Responsibility |
|-----------|-------|---------------|
| `domain/entities/milestone.py` | Domain | Milestone entity (Pydantic) |
| `domain/entities/artifact.py` | Domain | Artifact entity (Pydantic) |
| `domain/entities/phase_report.py` | Domain | PhaseReport entity (Pydantic) |
| `domain/repositories/milestone_repository.py` | Domain | IMilestoneRepository interface |
| `domain/repositories/artifact_repository.py` | Domain | IArtifactRepository interface |
| `domain/repositories/phase_report_repository.py` | Domain | IPhaseReportRepository interface |
| `infrastructure/database/models/milestone.py` | Infrastructure | MilestoneModel (SQLAlchemy) |
| `infrastructure/database/models/artifact.py` | Infrastructure | ArtifactModel (SQLAlchemy) |
| `infrastructure/database/models/phase_report.py` | Infrastructure | PhaseReportModel (SQLAlchemy) |
| `infrastructure/database/repositories/milestone_repo.py` | Infrastructure | SqlAlchemyMilestoneRepository |
| `infrastructure/database/repositories/artifact_repo.py` | Infrastructure | SqlAlchemyArtifactRepository |
| `infrastructure/database/repositories/phase_report_repo.py` | Infrastructure | SqlAlchemyPhaseReportRepository |
| `application/dtos/milestone_dtos.py` | Application | Create/Update/Response DTOs |
| `application/dtos/artifact_dtos.py` | Application | Create/Update/Response DTOs |
| `application/dtos/phase_report_dtos.py` | Application | Create/Update/Response DTOs |
| `application/use_cases/manage_milestones.py` | Application | CRUD use cases |
| `application/use_cases/manage_artifacts.py` | Application | CRUD + auto-seed use cases |
| `application/use_cases/manage_phase_reports.py` | Application | CRUD + PDF export |
| `application/use_cases/transition_phase.py` | Application | Phase gate logic + audit |
| `application/use_cases/get_project_activity.py` | Application | Activity stream from audit log |
| `application/services/phase_computation.py` | Application | BFS graph traversal (Python) |
| `api/v1/milestones.py` | API | Milestone endpoints |
| `api/v1/artifacts.py` | API | Artifact endpoints |
| `api/v1/phase_reports.py` | API | PhaseReport endpoints |
| `api/v1/phase_gate.py` | API | Phase transition endpoint |

### Backend — Modified Components

| Component | Modification | Why |
|-----------|-------------|-----|
| `domain/entities/project.py` | Add `ProjectStatus` enum, `status` field | Project lifecycle states |
| `domain/entities/task.py` | Add `phase_id: Optional[str]` field | Task-phase assignment |
| `infrastructure/database/models/project.py` | Add `status` column (VARCHAR) | DB schema |
| `infrastructure/database/models/task.py` | Add `phase_id` column (VARCHAR nullable) | DB schema |
| `application/dtos/project_dtos.py` | Add status in create/update/response DTOs | API contract |
| `application/dtos/task_dtos.py` | Add phase_id in create/update/response DTOs | API contract |
| `api/v1/projects.py` | Add `?status=` filter, status update validation | Filtering |
| `api/v1/tasks.py` | Add `?phase_id=` filter | Filtering |
| `api/dependencies.py` | Add milestone/artifact/phase_report repo factories | DI wiring |

---

## Data Flow

### Phase Transition Flow (New)

```
1. User clicks "Next Phase" in LifecycleTab
2. PhaseGateExpand renders with criteria status
3. Frontend calls GET /projects/{id}/tasks?phase_id={current}&status!=done (check auto criteria)
4. User confirms transition, optionally adds note
5. Frontend calls POST /projects/{id}/phase-transition
   Body: { from_phase_id, to_phase_id, note, move_incomplete_tasks: true/false }
6. Backend TransitionPhaseUseCase:
   a. Validates workflow mode allows this transition (sequential-locked: only forward, flexible: any connected)
   b. Validates criteria met (auto + manual)
   c. Optionally moves incomplete tasks to next phase
   d. Creates AuditLog entry with action="phase_transition"
   e. Returns updated project state
7. Frontend invalidates project queries, re-renders canvas
```

### Workflow Data Evolution

The `process_config` JSON column on `projects` table evolves from:

```json
// v1.0 (current)
{
  "methodology": "WATERFALL",
  "enforce_sequential_dependencies": true,
  "enforce_wip_limits": false,
  "restrict_expired_sprints": false
}
```

To:

```json
// v2.0 (extended)
{
  "methodology": "WATERFALL",
  "enforce_sequential_dependencies": true,
  "enforce_wip_limits": false,
  "restrict_expired_sprints": false,
  "enable_phase_assignment": true,
  "lifecycle": {
    "mode": "sequential-locked",
    "nodes": [
      { "id": "n1", "name": "Requirements", "x": 60, "y": 120, "color": "status-todo", "description": "..." },
      ...
    ],
    "edges": [
      { "id": "e1", "source": "n1", "target": "n2", "type": "flow" },
      ...
    ],
    "groups": [
      { "id": "g1", "name": "Development", "x": 40, "y": 60, "width": 520, "height": 200, "color": "status-progress" }
    ]
  },
  "phase_completion_criteria": {
    "n1": {
      "auto": { "all_tasks_done": true, "no_critical_tasks": true, "no_blockers": false },
      "manual": ["SRS approved", "Stakeholder sign-off"]
    }
  }
}
```

This is a **non-breaking extension**: existing projects without these keys continue working. The frontend uses sensible defaults (no lifecycle = no LifecycleTab, no criteria = auto-pass gate).

### Graph Traversal (BFS) — Shared Logic Strategy

The BFS algorithm for computing phase states runs in TWO places:

1. **Frontend (TypeScript)** — `lib/graph-utils.ts` — for real-time canvas rendering without API calls
2. **Backend (Python)** — `application/services/phase_computation.py` — for API responses, reports, phase transition validation

Strategy: **Duplicate with tests, not shared runtime.** The algorithm is simple (30 lines), deterministic, and easy to unit test identically on both sides. Sharing via WASM or microservice adds complexity disproportionate to benefit.

```typescript
// Frontend: lib/graph-utils.ts
export function computePhaseStates(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  activeNodeIds: Set<string>
): Record<string, 'active' | 'past' | 'future' | 'unreachable'> {
  const flowEdges = edges.filter(e => e.type !== 'verification');
  // Reverse BFS from active nodes to find "past"
  // Forward BFS from active nodes to find "future"
  // Remainder = "unreachable"
}
```

```python
# Backend: application/services/phase_computation.py
def compute_phase_states(nodes, edges, active_node_ids):
    # Identical logic in Python
    # Used by: TransitionPhaseUseCase, GetProjectActivityUseCase, reports
```

Test parity: Same test vectors run against both implementations to ensure identical output.

---

## Patterns to Follow

### Pattern 1: Design System Token Layer (Frontend)

**What:** Replace shadcn/ui + Tailwind with CSS custom properties + inline styles (matching prototype)

**When:** All new v2.0 pages

**Implementation:**

```typescript
// context/theme-context.tsx
"use client"

import * as React from "react"

const PRESETS = { /* oklch token sets from prototype theme.jsx */ };

interface ThemeState {
  preset: string;
  mode: 'light' | 'dark';
  radius: number;
  density: 'compact' | 'cozy' | 'comfortable';
  // ... from prototype useAppState
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Manages CSS variable application to :root
  // Persists to localStorage (same keys as prototype for compat)
  // Applies tokens via document.documentElement.style.setProperty
}
```

**Key decision:** The new design system does NOT use Tailwind classes. Components use `style={{}}` with `var(--token)` references. This means:
- shadcn/ui components are NOT used in new pages
- New primitive components (Button, Card, Badge, etc.) are ported from `primitives.jsx`
- Existing v1.0 pages can optionally remain on shadcn until migrated

### Pattern 2: Scoped New Entity (Backend)

**What:** Each new entity (Milestone, Artifact, PhaseReport) follows the full Clean Architecture vertical slice.

**When:** Adding any new backend entity.

**File creation order:**
1. Domain entity (Pydantic model)
2. Domain repository interface (ABC)
3. ORM model (SQLAlchemy)
4. Repository implementation
5. DTOs (create/update/response)
6. Use case(s)
7. API router
8. DI factory in dependencies.py
9. Migration SQL

### Pattern 3: Project-Scoped Nested Resources

**What:** Milestones, Artifacts, and PhaseReports are always accessed through their parent project.

**When:** Any resource that belongs to a project.

```python
# Router pattern
@router.get("/projects/{project_id}/milestones")
async def list_milestones(
    project_id: int,
    current_user: User = Depends(get_project_member),  # Enforces membership
    milestone_repo: IMilestoneRepository = Depends(get_milestone_repo),
):
    use_case = ListMilestonesUseCase(milestone_repo)
    return await use_case.execute(project_id)
```

### Pattern 4: Frontend Service + Hook per Entity

**What:** Each backend resource gets a service file and optionally a hook file.

**When:** Any new API resource.

```typescript
// services/milestone-service.ts
export const milestoneService = {
  getByProject: async (projectId: number): Promise<Milestone[]> => { ... },
  create: async (projectId: number, dto: CreateMilestoneDTO): Promise<Milestone> => { ... },
  update: async (id: number, dto: UpdateMilestoneDTO): Promise<Milestone> => { ... },
  delete: async (id: number): Promise<void> => { ... },
};
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixed Design Systems on Same Page

**What:** Using shadcn/ui Button next to new primitives-based Button on the same page.

**Why bad:** Inconsistent visuals, double styling overhead, confusing component naming.

**Instead:** Each page is either fully v1.0 design (shadcn/ui + Tailwind) or fully v2.0 design (inline styles + CSS vars). No mixing within a single page component tree.

### Anti-Pattern 2: Storing Computed State in Database

**What:** Saving `active_phase_ids` as a column on the project table.

**Why bad:** Stale data when tasks change status. Must be recalculated anyway. Creates sync bugs.

**Instead:** Derive active phases from task data:
```sql
SELECT DISTINCT phase_id FROM tasks
WHERE project_id = :id AND status != 'DONE' AND phase_id IS NOT NULL
```

### Anti-Pattern 3: Monolithic process_config Updates

**What:** Frontend sends the entire process_config JSON on every small change.

**Why bad:** Race conditions when two users edit different parts. Lost data on partial reads.

**Instead:** API accepts JSON Merge Patch for specific sub-keys:
```
PATCH /projects/{id}/process-config
Body: { "phase_completion_criteria": { "n1": { ... } } }
```
Backend deep-merges into existing config.

### Anti-Pattern 4: Tight Coupling Between Lifecycle and Task Status

**What:** Making task status transitions depend on lifecycle phase position.

**Why bad:** Kanban has no phases. Flexible-mode allows any movement. Creates hard-to-debug constraints.

**Instead:** Phase assignment is orthogonal to task status. A task in phase "Design" can be TODO, IN_PROGRESS, REVIEW, or DONE independently. Only the `sequential-locked` mode restricts which phases can receive new tasks.

---

## Suggested Build Order (Dependency-Aware)

### Phase 1: Foundation Layer (Backend Schema + Frontend Theme)

Build order rationale: Everything else depends on the schema changes and the design system.

**Backend (parallel):**
1. Add `ProjectStatus` enum + `status` column to Project entity/model/DTO
2. Add `phase_id` column to Task entity/model/DTO
3. Create Milestone entity full vertical slice (domain > infra > app > API)
4. Create Artifact entity full vertical slice
5. Create PhaseReport entity full vertical slice
6. Migration SQL for all schema changes

**Frontend (parallel with backend):**
7. Create `ThemeProvider` (port theme.jsx logic to React context)
8. Create new CSS variable declarations (replace or augment globals.css)
9. Port `primitives.jsx` to TypeScript components: `components/v2/button.tsx`, `card.tsx`, `badge.tsx`, etc.
10. Create `I18nProvider` (port i18n.jsx to context + hook)
11. Create `lib/graph-utils.ts` (BFS algorithm)

**Why first:** Schema must exist before any API work. Theme must exist before any page conversion.

### Phase 2: Core APIs + Shell Conversion

**Backend:**
1. Implement `phase_computation.py` (BFS service)
2. Implement `transition_phase.py` use case (depends on: audit_repo, project_repo, phase_computation)
3. Implement Phase Gate API endpoint
4. Implement Activity API endpoint (reuses existing audit_log)
5. Implement User Summary API endpoint
6. Add `?status=` filter to projects, `?phase_id=` filter to tasks

**Frontend:**
7. Convert Shell (Sidebar + Header) using new primitives (high visual impact, proves design system)
8. Create services: `milestone-service.ts`, `artifact-service.ts`, `phase-gate-service.ts`, `activity-service.ts`
9. Convert Dashboard page (from prototype dashboard.jsx)

**Why second:** Shell conversion validates the entire design system works in Next.js. APIs provide data for subsequent pages.

### Phase 3: Project Features (Lifecycle + Workflow)

**Frontend (builds on Phase 2 APIs):**
1. Convert LifecycleTab (with WorkflowCanvas, PhaseGateExpand)
2. Convert MilestonesSubTab (connects to milestone API)
3. Convert ArtifactsSubTab (connects to artifact API)
4. Convert HistorySubTab (connects to phase-transition/activity API)
5. Convert WorkflowEditorPage (full editor, uses graph-utils)
6. Convert ActivityTab (connects to activity API)
7. Build BacklogPanel component

**Why third:** These are the most complex frontend features and depend on all Phase 1+2 work.

### Phase 4: Remaining Pages + Polish

**Frontend:**
1. Convert ProjectsPage (with status badges, filters)
2. Convert ProjectDetailPage (orchestrates all tabs)
3. Convert CreateProjectWizard
4. Convert CreateTaskModal (with phase_id support)
5. Convert MyTasksPage
6. Convert UserProfilePage
7. Convert SettingsPage (with phase completion criteria form)
8. Address all 16 EKSIK-KONTROL items that depend on the above

**Backend:**
9. Artifact auto-seed on project creation
10. Phase report PDF export
11. Process config PATCH (JSON merge) endpoint

**Why last:** These pages are either simpler conversions or depend on features built in Phases 2-3.

---

## Database Schema Changes Summary

```sql
-- New columns on existing tables
ALTER TABLE projects ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE tasks ADD COLUMN phase_id VARCHAR(50) NULL;

-- New tables
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    target_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    linked_phase_ids JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE artifacts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_created',
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    linked_phase_id VARCHAR(50),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE phase_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id VARCHAR(50) NOT NULL,
    cycle_number INTEGER NOT NULL DEFAULT 1,
    summary JSONB NOT NULL DEFAULT '{}',
    issues TEXT,
    lessons TEXT,
    recommendations TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_phase_reports_project ON phase_reports(project_id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id) WHERE phase_id IS NOT NULL;
```

---

## Frontend Architecture: Coexistence Strategy

The critical architectural decision: v1.0 pages (shadcn/ui + Tailwind) and v2.0 pages (inline + CSS vars) must coexist during the transition.

### Approach: Parallel Design Systems with Shared Provider Layer

```
app/layout.tsx
  ├── QueryProvider (shared — TanStack Query)
  ├── AuthProvider (shared — auth context)
  ├── ThemeProvider (NEW — CSS vars, replaces next-themes for v2.0 pages)
  ├── I18nProvider (NEW — TR/EN strings)
  └── SystemConfigProvider (shared)
```

**CSS strategy:**
- `globals.css` declares CSS custom properties that the new design system uses
- Tailwind config remains for any v1.0 pages not yet converted
- New pages use ONLY `style={{}}` with `var(--token)` — no Tailwind classes
- The ThemeProvider applies oklch tokens to `:root`, which means even old Tailwind pages get the new color palette "for free" if their color utilities map to the same vars

**Component namespace:**
```
components/
  ui/          ← shadcn/ui primitives (v1.0, unchanged)
  v2/          ← new design system primitives (ported from primitives.jsx)
    button.tsx
    card.tsx
    badge.tsx
    input.tsx
    tabs.tsx
    avatar.tsx
    progress-bar.tsx
    toggle.tsx
    collapsible.tsx
    alert-banner.tsx
  workflow/     ← workflow-specific (WorkflowCanvas, PhaseGateExpand)
  lifecycle/    ← lifecycle tab and sub-tabs
  project/     ← existing + new project components
  dashboard/   ← converted dashboard
  ...
```

---

## Scalability Considerations

| Concern | Current (100 users) | At 10K users | At 1M users |
|---------|---------------------|--------------|-------------|
| Process config JSON size | ~2KB per project, no concern | Same | Consider extracting lifecycle to separate table |
| Phase computation (BFS) | Negligible (<1ms for 10 nodes) | Same | Same (graph is small, <50 nodes max) |
| Activity stream query | Simple audit_log filter | Add pagination, index on (entity_id, timestamp) | Consider separate activity table with denormalized data |
| Milestone/artifact count | <20 per project | Same | Same (bounded by project lifecycle) |
| Task phase_id filtering | Index adequate | Composite index (project_id, phase_id, status) | Same |

---

## Sources

- Existing codebase analysis (`.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `STACK.md`)
- New frontend prototype (`New_Frontend/src/`) — direct code inspection
- Backend design document (`UI-Tasarim-Backend.md`) — direct code inspection
- Gap analysis (`EKSIK-KONTROL.md`) — direct inspection
- Project context (`.planning/PROJECT.md`) — direct inspection
- Confidence: HIGH — all findings from primary source code and design documents in the repository
