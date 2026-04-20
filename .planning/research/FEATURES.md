# Feature Landscape

**Domain:** Software Project Management (methodology-aware, lifecycle-driven)
**Researched:** 2026-04-20
**Context:** v2.0 milestone — 16 UI gaps + new backend entities for existing SPMS platform

---

## Table Stakes

Features users expect from a methodology-aware PM tool. Missing = product feels incomplete for Waterfall/Iterative users, limits Kanban metrics credibility.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Backlog Panel** (E1) | Every PM tool (Jira, Azure Boards, ClickUp) has a dedicated backlog view. Without it, unassigned tasks are invisible | Medium | Existing Task CRUD, Board views, @dnd-kit already in stack | Jira pattern: side panel with drag-to-sprint, search, priority filter, bulk select. Must support drag into phases/sprints |
| **Phase Gate System** (Phase transition + completion criteria) | Core Waterfall principle. Without phase gates, Waterfall mode is cosmetic — just renamed Kanban columns | High | New backend entity (phase_completion_criteria in process_config), Lifecycle Tab, Workflow Editor | Auto-criteria (all tasks done, no blockers) + manual checklist. Transition must be auditable |
| **Task-Phase Assignment** (phase_id + mini stepper) | If system claims phase-based lifecycle, tasks must belong to phases. Otherwise lifecycle tab is decoration | Medium | Backend: task.phase_id column, process_config.enable_phase_assignment flag. Frontend: Board filtering, List column | Conditional display based on methodology. Mini stepper on parent tasks showing child phase distribution |
| **Project Status Management** (active/completed/on_hold/archived) | Universal in PM tools (Jira, Asana, Monday, ClickUp all have this). Users need to distinguish live from dead projects | Low | Backend: project.status column, GET filter. Frontend: status badge, archive banner | Standard states: Active, Completed, On Hold, Archived. Transitions: any-to-archived, archived-to-active |
| **Archived Project Banner** (E4) | Users must know they are viewing read-only data. Every tool shows a warning banner on archived items | Low | Project Status feature above | Yellow/amber banner with "This project is archived" + "Reactivate" button. Block task creation |
| **CFD Chart** (Cumulative Flow Diagram) | Kanban fundamental metric. Defined in Kanban template's dashboardWidgets but not implemented. Any Kanban-supporting tool offers this | Medium | Existing task history/audit data, date-based status snapshots | Stacked area chart. X-axis = time, Y-axis = task count per status. Needs historical status snapshots (daily aggregation) |
| **Lead Time / Cycle Time Charts** | Core Kanban metrics alongside CFD. Kanban without these is incomplete | Medium | Task timestamps (created_at, first_in_progress_at, completed_at). May need additional timestamp columns | Lead time = created to done. Cycle time = in-progress to done. Show as scatter plot + rolling average |
| **Task Create Modal** | Every PM tool has quick-create overlay. Linear's C shortcut, Jira's inline create, ClickUp's modal. Current create flow likely requires page navigation | Medium | Existing task CRUD endpoints, form validation (React Hook Form + Zod already in stack) | Overlay modal, not page. Pre-populate project/sprint context. Support keyboard shortcut trigger (C key) |
| **Project Activity Timeline** | GitHub, Jira, ClickUp all show project-level activity feed. Existing audit_log table stores data but no UI exposes it at project level | Low-Medium | Existing AuditLogModel, new GET /projects/{id}/activity endpoint | Filtered feed: task changes, member changes, phase transitions. Infinite scroll. Filter by type/user |
| **User Profile Page** | Team members need visibility into who does what. Every collaborative tool has profile pages beyond settings | Low-Medium | Existing user/task data, new GET /users/{id}/summary endpoint | Stats cards (active tasks, completed, projects), recent activity, project list. Reuse MTTaskRow component |

---

## Differentiators

Features that set SPMS apart. Not universally expected, but provide methodology-aware value that generic tools lack.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Milestone Entity** (project-level milestones linked to phases) | Most tools treat milestones as fancy due dates. SPMS links milestones to lifecycle phases — showing which phases must complete for a milestone to be achieved | Medium | New backend entity, Lifecycle Tab, Gantt integration | Milestones are NOT tasks. Separate entity with target_date, linked_phase_ids, status. Render as diamonds on Gantt/Timeline |
| **Artifact Tracking** (methodology-specific documents) | Unique to process-heavy tools (Planview, Cora PPM). Tracks SRS/SDD/STD etc. as first-class entities tied to phases, not just file uploads | Medium | New backend entity, process template artifact definitions, phase linkage | Auto-seed from methodology template. Status tracking (not_created/draft/completed). Assignee per artifact |
| **Phase Report** (evaluation report with auto-summary + PDF) | Supports Iterative/Spiral retrospective workflow. Auto-generates summary from phase task data, allows manual lessons/recommendations | Medium-High | Phase Gate system, task-phase assignment, PDF export (fpdf2 already in stack) | Semi-automatic: system fills task stats, user fills issues/lessons/recommendations. Export as PDF |
| **Project Create Wizard** (4-step methodology-aware setup) | Most tools have simple "name + template" creation. A guided wizard that configures lifecycle, board columns, and features based on methodology choice is differentiated | Medium | Existing process templates, lifecycle presets, React Hook Form multi-step | Steps: Basics (name, key, dates) > Methodology (template cards) > Lifecycle (preset or custom canvas) > Configuration (features, columns, members) |
| **Workflow Editor Extensions** (edge types, swimlanes, sequential-flexible mode) | Jira/Monday have fixed workflows. A visual node-based lifecycle editor with flow/verification/feedback edge types and swimlane grouping is rare outside enterprise tools | High | React Flow/xyflow (already chosen), existing workflow editor base, graph traversal algorithm | Edge types: flow (normal), verification (dashed, V-Model), feedback (curved, geri-bildirim). Swimlane = visual grouping only. New mode: sequential-flexible |
| **Iteration Comparison Charts** | Beyond basic velocity chart. Shows scope change, carried-over tasks, new additions across iterations — trend analysis unavailable in most non-enterprise tools | Medium | Sprint/cycle history data, existing reporting infrastructure | Bar chart comparing iterations: planned vs completed vs carried over. Line overlay for scope change |
| **Graph Traversal Active Phase Calculation** (E9) | Enables V-Model, Spiral, and branching lifecycle support. Linear index-based approach fails for non-linear models | Medium | Workflow editor data structure, task-phase assignment | BFS from active nodes backward (past) and forward (future). Supports parallel active phases |
| **Parallel Active Phases** (E10) | Incremental/V-Model methodologies require multiple simultaneous active phases. Unique to lifecycle-aware tools | Low-Medium | Graph traversal, task-phase assignment producing multiple distinct phase_ids | Active phases derived from tasks: SELECT DISTINCT phase_id WHERE status != 'done'. No longer single activePhase prop |
| **Cycle Counter Badge** (E11) | Spiral methodology iterates phases multiple times. Badge showing "x3" on a node indicates third pass through that phase | Low | Phase transition history (audit_log counting transitions per node) | COUNT transitions into this node from audit_log. Render as small badge on workflow node |

---

## Anti-Features

Features to explicitly NOT build. Avoid scope creep, maintain focus.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time collaborative editing (Google Docs-style) | Massive complexity for 2-person team. WebSocket infrastructure not in scope | Polling-based refresh (already implemented). Optimistic updates with TanStack Query invalidation |
| Custom workflow designer for task statuses (Jira-style) | Confuses with lifecycle workflow. Two editors = cognitive overload | Keep board columns as simple status workflow. Lifecycle editor handles process phases |
| Time tracking / timesheets | Scope creep into HR territory. Estimate fields exist but punch-clock tracking is different product | Keep estimateHours field. Lead/cycle time calculated from timestamps, not manual entry |
| File versioning / document editor | Artifact tracking tracks metadata (status, assignee, phase). Full document management is separate product (Confluence, Notion) | Link external documents by URL/reference. Track artifact status, not content |
| Resource allocation / capacity planning | Enterprise feature requiring team availability, vacation tracking, skills matrix | Show workload via task count per person. No resource pool management |
| Hybrid/Flex lifecycle builder (custom methodology from scratch) | Deferred per EKSIK-SAYFALAR.md priority. Existing 4+ templates with visual editor cover 95% of cases | Allow template customization via Workflow Editor. Don't build methodology creation wizard |
| AI-powered task suggestions or auto-assignment | Trendy but low-value without training data. 2-person academic project | Focus on manual workflows that are reliable and predictable |
| Guest/external user access | Explicitly out of scope per PROJECT.md | All users are registered team members |

---

## Feature Dependencies

```
Project Status → Archived Project Banner (banner needs status field)
Project Status → Project card status badge (E13)

Task-Phase Assignment → Board phase filter (E5)
Task-Phase Assignment → List Tab phase column (E5)
Task-Phase Assignment → Mini Stepper on parent tasks (E3)
Task-Phase Assignment → Phase Gate auto-criteria ("all tasks done" needs phase_id query)
Task-Phase Assignment → CFD per-phase breakdown (optional enhancement)

Phase Gate System → Phase transition history
Phase Gate System → Phase Report (report generated at transition)
Phase Gate System → Lifecycle Tab "transition" button (E7)

Workflow Editor extensions → Graph traversal (E9)
Graph Traversal → Parallel active phases (E10)
Graph Traversal → Cycle counter badge (E11)
Workflow Editor extensions → New preset templates (E12 — Incremental, Evolutionary, RAD)
Workflow Editor extensions → Sequential-flexible mode

Milestone Entity → Gantt milestone diamonds (visual only)
Milestone Entity → Linked phases (requires lifecycle node IDs)

Artifact Entity → Process template artifact definitions (seed from template)
Artifact Entity → Phase linkage (linked_phase_id)

Phase Report → Task-phase assignment (needs phase task data)
Phase Report → PDF export (fpdf2 backend)

Project Activity Timeline → AuditLog table (already exists)
User Profile → Existing task/project APIs + new summary endpoint

Project Create Wizard → Process templates (methodology selection)
Project Create Wizard → Lifecycle presets (canvas initialization)
Project Create Wizard → Board column configuration

Lead/Cycle Time → Task timestamp tracking (may need in_progress_at field)
CFD → Historical daily snapshots (new data requirement — daily cron or derived from audit_log)

Iteration Comparison → Sprint/cycle completion history
Iteration Comparison → Velocity data (already in reporting)
```

---

## Expected Behaviors and Edge Cases

### Backlog Panel

**Expected behavior:**
- Side panel (300px) toggling from project detail page
- Shows tasks with no sprint/phase assignment (sprint_id IS NULL AND phase_id IS NULL)
- Drag-drop TO sprints/phases (Jira pattern: drag items into sprint sections)
- Search by title, filter by priority, sort by priority/date/custom
- Multi-select mode: shift+click for range, ctrl+click for individual. Bulk assign sprint, phase, priority
- Empty state when all tasks assigned

**Edge cases:**
- Task has dependencies on tasks in different phase — warn but allow
- Dragging task with subtasks: move parent only or all children? Standard: move parent only, children inherit
- WIP limit hit in target column during drag: show warning but allow (Kanban permissive mode) or block (strict mode based on enforce_wip_limits)
- Backlog panel open while board also shows — same task list? No: backlog = unassigned only
- Archived project: backlog panel should be read-only (no drag operations)

### Phase Gate System

**Expected behavior:**
- Each phase has configurable completion criteria (auto + manual checklist)
- Auto criteria: all_tasks_done, no_critical_tasks (priority=critical with status!=done), no_blockers (blocked status tasks)
- Manual criteria: free-text checklist items, each individually checkable
- Gate evaluation: show criteria as checklist with pass/fail indicators
- Transition flow: click "Transition" > see criteria status > if all pass, confirm > transition recorded in audit_log
- Override option: PM can force-transition even if criteria not met (with note explaining why)

**Edge cases:**
- Zero tasks in phase: auto criteria = "not applicable" (gray/disabled), only manual criteria evaluated
- Phase has tasks in "blocked" status but no_blockers is disabled: passes
- Concurrent transitions in branching lifecycles: V-Model may have test phase completing while deployment phase starts
- Transition rollback: NOT supported. If wrong phase activated, PM must manually reassign tasks. Audit trail preserves history
- Sequential-flexible mode: only allow transitions along flow edges. Feedback edges allow going BACK

### Task-Phase Assignment

**Expected behavior:**
- Conditional: only visible when process_config.enable_phase_assignment = true
- Dropdown in task detail sidebar showing lifecycle phase nodes
- Board view: filter by phase (dropdown in toolbar)
- List view: "Phase" column (conditional)
- Mini stepper on parent tasks: horizontal progress indicator showing child task distribution across phases
- Task creation: phase_id optional, can be assigned later (from backlog)

**Edge cases:**
- Methodology change mid-project: existing phase_id values become orphaned if nodes removed. Show "Unknown phase" badge, allow reassignment
- Subtask inherits parent phase by default but can be overridden
- Phase deleted from lifecycle editor: tasks with that phase_id need migration prompt
- Bulk phase assignment from backlog: assign 20 tasks to "Design" phase at once

### Milestone Entity

**Expected behavior:**
- Separate from tasks — milestones are checkpoints, not work items
- Fields: name, target_date, description, status (pending/in_progress/completed/overdue), linked_phase_ids
- Overdue auto-detection: if target_date < today AND status != completed, status = overdue
- Render as diamond markers on Gantt/Timeline views
- List view in Lifecycle Tab showing all milestones with progress
- Milestone completed when: all linked phases have transitioned past it (manual or auto)

**Edge cases:**
- Milestone with no linked phases: pure date-based checkpoint (manual completion only)
- All linked phases complete but milestone not explicitly marked: auto-complete or require PM confirmation?
  Recommendation: auto-suggest completion with confirmation toast
- Milestone target_date in past but linked phases not done: mark as "overdue" with visual warning
- Project archived: milestones become read-only

### Artifact Tracking

**Expected behavior:**
- Auto-seeded from process template when project created (e.g., Waterfall gets SRS, SDD, STD, Release Notes)
- Status progression: not_created > draft > completed
- Each artifact: name, status, assignee, linked_phase_id, note, updated_at
- Card/list view in project detail (possibly sub-tab of Lifecycle or dedicated section)
- Manual creation allowed (PM adds custom artifacts beyond template defaults)

**Edge cases:**
- Template change: if methodology changes, existing artifacts remain (don't delete user data). New template artifacts added
- Artifact without phase link: allowed (cross-cutting documents like "Project Charter")
- Artifact deletion: soft-delete. PM may accidentally remove seeded artifact
- Multiple assignees: NOT supported in v2. Single assignee per artifact. Use notes for collaboration context

### Phase Report (Evaluation Report)

**Expected behavior:**
- Generated at phase completion or on-demand
- Auto-filled summary: task_count, done_count, moved_count (carried to next phase), duration_days, critical_task_count
- Manual fields: issues encountered (free text), lessons learned, recommendations for next iteration
- Cycle_number field for Spiral: "3rd pass through Design phase"
- PDF export using fpdf2 (consistent with existing report export pattern)
- History: all past phase reports viewable in Lifecycle Tab history section

**Edge cases:**
- Phase report for phase with 0 tasks: allowed (summary shows zeros), useful for documentation-only phases
- Editing after creation: allowed. Track updated_at
- Multiple reports per phase (Spiral/Iterative): use cycle_number to differentiate
- PDF generation failure: return error, don't block UI. Allow retry

### Project Activity Timeline

**Expected behavior:**
- Infinite-scroll feed of project-level events
- Event types: task_created, status_changed, assigned, comment_added, phase_transition, member_added, sprint_started/closed
- Each event: avatar, user name, action description, relative timestamp, link to entity
- Filters: by event type (multi-select), by user, date range
- New events appear at top (reverse chronological)

**Edge cases:**
- High-activity projects: paginate server-side (limit=30, offset). Don't load all history
- Deleted tasks: activity entry references non-existent entity. Show "[Deleted task]" placeholder
- Bulk operations (bulk assign 20 tasks): collapse into single "X assigned 20 tasks to Sprint 5" entry, expandable
- Permission: all project members see all activity. No per-event access control

### User Profile Page

**Expected behavior:**
- Stats summary: active tasks, completed (last 30 days), project count
- Project list with methodology badge, task count per project
- Recent tasks (reuse MTTaskRow component per plan E15)
- Activity feed (cross-project, filtered to this user)
- Avatar, name, email, role badge, join date

**Edge cases:**
- User viewing their own profile vs viewing teammate: same view, but own profile links to /settings for editing
- User with no projects: empty state with helpful message
- User removed from project: historical data still shows in profile activity, but project not in "active projects"
- Performance: profile of highly active user — paginate tasks and activity

### Project Create Wizard

**Expected behavior:**
- 4 steps with progress indicator (stepper)
- Step 1 — Basics: name (required), key (auto-generated, editable), description, start_date, end_date, team
- Step 2 — Methodology: card selection from process templates. Show description, recommended for, key differences
- Step 3 — Lifecycle: show preset workflow canvas for chosen methodology. Allow customization (add/remove/rename nodes). Or "blank canvas" option
- Step 4 — Configuration: columns (pre-filled from template), enabled task fields, behavioral flags (WIP limits, sequential dependencies, phase assignment)
- Review summary before creation (optional — Linear skips this for speed)
- Back/Next navigation. Data persists across steps (form state)

**Edge cases:**
- User navigates away mid-wizard: lose data (no draft save for v2). Confirm dialog on exit
- Duplicate project key: validate uniqueness real-time with debounced API call
- Template with no lifecycle preset: skip step 3 or show blank canvas
- Team selection with no teams created: show "create team first" link or allow project without team

### Task Create Modal

**Expected behavior:**
- Overlay modal (not full page). Triggered by: header "Create" button, keyboard shortcut (C), board "+" button
- Core fields: title (required), description (rich text), assignee, priority, status, sprint/cycle, due_date
- Conditional fields: phase (if enable_phase_assignment), story_points (if enabled), labels, severity, risk
- Project context: auto-set if created from within a project. Selectable if from global
- Quick create mode: just title + enter = creates task with defaults. Full form available for details
- Success: close modal, optimistic add to board/list, toast notification

**Edge cases:**
- Modal open while another modal is open (e.g., task detail): stack modals or close first? Recommendation: close task detail, open create
- Creating task in archived project: block. Show error
- Required fields missing on submit: inline validation, don't close modal
- Creating task from backlog context: no sprint/phase pre-selected (that's the point — add to backlog)
- Keyboard shortcut conflict: C key should only trigger when not focused on text input

### CFD / Lead-Cycle Time / Iteration Comparison Charts

**CFD Expected behavior:**
- Stacked area chart. Each band = one board column/status
- X-axis: time (daily granularity). Y-axis: cumulative task count
- Widening band = bottleneck. Narrowing = improvement
- Date range selector (last 2 weeks, 1 month, 3 months, all time)
- Data source: daily snapshots of task count per status (needs scheduled aggregation or derived from audit_log)

**Lead/Cycle Time Expected behavior:**
- Scatter plot: each dot = one completed task. X-axis: completion date. Y-axis: duration (days)
- Two series: lead time (created_at to completed_at), cycle time (first_in_progress_at to completed_at)
- Rolling average line (7-day or 14-day)
- Percentile lines (50th, 85th, 95th) for SLA targets

**Iteration Comparison Expected behavior:**
- Grouped bar chart comparing N iterations
- Per iteration: planned count, completed count, carried over count, scope added mid-iteration
- Velocity trend line overlay
- Table below chart with detailed numbers

**Edge cases (all charts):**
- New project with < 7 days history: show "insufficient data" message, not empty chart
- Task status changed multiple times in one day: use end-of-day snapshot for CFD
- Task never moved to "in progress" (directly to done): cycle time = 0, lead time still valid
- Very long lead times (outliers): include but allow toggling outlier visibility
- No completed tasks in time range: show flat chart with message

### Workflow Editor Extensions

**Expected behavior:**
- Edge types with visual distinction: flow (solid arrow), verification (dashed), feedback (curved/dotted)
- Swimlane groups: draggable rectangles that visually group nodes. Label at top. Color-coded. No logic impact
- Sequential-flexible mode: forward transitions enforced by flow edges, backward transitions only via feedback edges
- New preset templates: V-Model (already exists), Spiral (exists), Incremental, Evolutionary, RAD (missing E12)
- Edge creation: select edge type from dropdown/palette before drawing, or change type after creation

**Edge cases:**
- Deleting edge between nodes with assigned tasks: warn that transition path is being removed
- Circular feedback loops: detect and warn (BFS from start — if can't reach all nodes, warn "unreachable node")
- Swimlane resizing: auto-expand when node dragged inside. Manual resize handle
- Switching mode (flexible to sequential-locked): may invalidate current active phases. Warn PM
- Template application to existing project: nodes match by name? By position? Recommendation: offer "reset lifecycle" vs "merge changes" options

---

## MVP Recommendation

### Must-Have for v2.0 (addresses structural gaps):

1. **Project Status + Archived Banner** (Low complexity, unblocks all status-related features)
2. **Task-Phase Assignment** (enables lifecycle tab to be meaningful, unblocks phase gate)
3. **Phase Gate System** (core Waterfall/Iterative value proposition)
4. **Backlog Panel** (table stakes for any PM tool)
5. **Task Create Modal** (table stakes UX, replaces page navigation)
6. **Project Activity Timeline** (leverages existing audit_log, low new backend)
7. **User Profile Page** (leverages existing data, relatively simple)
8. **CFD + Lead/Cycle Time** (completes Kanban metrics promise)

### Important but Can Follow:

9. **Milestone Entity** (valuable for Waterfall, separate from core flow)
10. **Artifact Tracking** (valuable for Waterfall/Iterative, separate from core flow)
11. **Phase Report** (depends on phase gate being solid first)
12. **Project Create Wizard** (enhances onboarding but existing create flow works)
13. **Iteration Comparison** (nice to have, existing velocity chart partially covers)

### Defer if Time-Constrained:

14. **Workflow Editor extensions** (High complexity. Current editor works for linear flows. Extensions needed only for V-Model/Spiral/RAD)
15. **New preset templates** (E12 — data-only, low complexity but needs workflow editor extensions to render properly)

---

## Complexity Estimates

| Feature | Backend | Frontend | Total |
|---------|---------|----------|-------|
| Project Status + Banner | 1-2 days | 1 day | 2-3 days |
| Task-Phase Assignment | 2-3 days | 2-3 days | 4-6 days |
| Phase Gate System | 3-4 days | 3-4 days | 6-8 days |
| Backlog Panel | 1 day (filter endpoint) | 3-4 days | 4-5 days |
| Task Create Modal | 0 (existing endpoints) | 2-3 days | 2-3 days |
| Activity Timeline | 1-2 days | 2-3 days | 3-5 days |
| User Profile | 1 day | 2-3 days | 3-4 days |
| CFD + Lead/Cycle Time | 2-3 days (snapshots) | 3-4 days | 5-7 days |
| Milestone Entity | 2-3 days | 2-3 days | 4-6 days |
| Artifact Tracking | 2-3 days | 2-3 days | 4-6 days |
| Phase Report | 2-3 days | 2-3 days | 4-6 days |
| Project Create Wizard | 0-1 day | 3-4 days | 3-5 days |
| Iteration Comparison | 1-2 days | 2-3 days | 3-5 days |
| Workflow Editor Extensions | 1-2 days (data model) | 5-7 days | 6-9 days |

**Total estimate:** 50-72 developer-days for all features

---

## Sources

- [Atlassian — Backlog Management Tools](https://www.atlassian.com/agile/project-management/backlog-management-tools)
- [Azure Boards Backlog Overview](https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/backlogs-overview)
- [Asana — Stage Gate Process](https://asana.com/resources/stage-gate-process)
- [Cora Systems — Phase Gate Implementation Guide](https://corasystems.com/guidebooks/phase-gate-implementation-guide-ppm-technology)
- [Wrike — Phase Gate Process](https://www.wrike.com/blog/phase-gate-process-project-management/)
- [monday.com — Cumulative Flow Diagrams 2026 Guide](https://monday.com/blog/project-management/cumulative-flow-diagrams/)
- [Atlassian — 4 Kanban Metrics](https://www.atlassian.com/agile/project-management/kanban-metrics)
- [Azure DevOps — CFD/Cycle/Lead Time Guidance](https://learn.microsoft.com/en-us/azure/devops/report/dashboards/cumulative-flow-cycle-lead-time-guidance)
- [React Flow — Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor)
- [Linear — Create Issues Docs](https://linear.app/docs/creating-issues)
- [NN/g — Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/)
- [ClickUp — Milestone Tracking Software](https://clickup.com/blog/milestone-tracking-software/)
- [Eleken — Wizard UI Pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)
- [Businessmap — Lead Time vs Cycle Time](https://businessmap.io/kanban-resources/kanban-software/kanban-lead-cycle-time)
