# Phase 11: Task Features & Board Enhancements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 11-task-features-board-enhancements
**Areas discussed:** Task Create Modal, ProjectDetail 8-tab, Backlog Panel, Board+WIP, List/Timeline/Calendar, MyTasks+TaskDetail, Phase assignment, Cycle label, Rich text editor, Header Create button, Comments, Attachments, Dependencies, Header search, Labels, History tab, Board card interaction, Dashboard reuse, Watcher toggle, Responsive, Inline edit

---

## Gray Area Selection

User selected ALL 8 initially-presented gray areas across both questions:
- Core: Task Create Modal, ProjectDetail 8-tab, Backlog Panel, Board+WIP
- More: List/Timeline/Calendar, MyTasks+Task Detail, Phase assignment, Cycle label

User then requested additional exploration and discussed 11 more sub-areas.

---

## Task Create Modal (TASK-01)

| Question | Options | Selected |
|----------|---------|----------|
| Modal state management | Global TaskModalContext / Per-page useState / Dedicated route | **Global TaskModalContext** ✓ |
| Draft persistence | sessionStorage / None (close discards) / localStorage | **None — close discards** ✓ |
| Post-submit behavior | Close+toast+invalidate / Close+navigate to detail / Stay+clear | **Close + toast + stay + invalidate** ✓ |
| Required fields | Title+Project / +Priority+Assignee / +Due date | **Title + Project only** (matches prototype) ✓ |

**User rationale:** Global context matches prototype's `window.__openTaskModal` pattern. Discards acceptable for short form. Stay+invalidate enables rapid sequential task creation.

---

## ProjectDetail 8-Tab Structure (PAGE-03)

| Question | Options | Selected |
|----------|---------|----------|
| Tab routing | URL ?tab=board / React state / Path-based | **React state only** ✓ |
| Activity/Lifecycle tab handling | "Coming soon" stub / Hide / Disabled | **Render tabs with "coming soon" stub** ✓ |
| Settings sub-tabs in Phase 11 | General / Columns / Workflow link / Lifecycle | **General + Columns + Workflow link** (Lifecycle deferred to Phase 12) ✓ |
| enable_phase_assignment toggle UI | Wait Phase 12 / Show read-only now / Build now | **Wait for Phase 12** ✓ |

---

## Backlog Panel (TASK-02)

| Question | Options | Selected |
|----------|---------|----------|
| Placement | Fixed column pushes content / Slide-over overlay / Always visible | **Fixed column pushes content** ✓ |
| Open-state persistence | Per-project localStorage / Session-only / Global preference | **Per-project localStorage** ✓ |
| v1 features | Search / Priority+Assignee filter / Drag-drop / Bulk ops | **Search + Filter + Drag-drop** (bulk ops DEFERRED) ✓ |
| Backlog definition | cycle_id=null / status=todo / new flag / Methodology-dependent | **Methodology-dependent, configurable per project, with defaults** ✓ |

**User notes (verbatim):** "lets define it on project creation, it can be methodology dependent, we need to make a list how can be defined in different methodologies, so we can ensure user freely define"
**User notes (verbatim):** "defer bulk operations, i want it after"

→ Action: CONTEXT.md includes a **Backlog Definition Matrix** per methodology (Scrum/Kanban/Waterfall/Iterative/Incremental/Evolutionary/RAD) with configurable override in Settings > General.

---

## Board Tab + WIP Violation (PAGE-07)

| Question | Options | Selected |
|----------|---------|----------|
| Drag-drop implementation | Native HTML5 / @dnd-kit/core / react-beautiful-dnd | **@dnd-kit/core with smooth animations + consistent actions** ✓ |
| WIP violation behavior | Hard-block / Warn + allow / Soft-block confirm | **Warn + allow (matches prototype)** ✓ |
| Card compact/rich toggle | Yes full / Only rich / Only compact | **Yes full compact/rich toggle** ✓ |
| Toolbar controls | Search / Density / Cycle badge / Phase filter | **All four selected** ✓ |

**User notes (verbatim):** "i want smooth animations and consistent actions"

---

## List / Timeline / Calendar Views

| Question | Options | Selected |
|----------|---------|----------|
| List tab impl | Prototype CSS grid / TanStack Table / AG Grid | **TanStack Table (headless)** ✓ |
| Timeline tab | Match prototype as-is / Full Gantt library / Defer to Phase 13 | **Full Gantt library — bulletproof quality-first** ✓ |
| Calendar tab | Match prototype / react-big-calendar / FullCalendar | **Match prototype visual + power (scroll-zoom)**; asked about theme consistency ✓ |

**User notes (verbatim):** "full gant library, in the legacy frontend, i have some issues wtih consistent view of gantt chart, gitches etc. this time, i want bulletproff, action consistent, glitch-free, smooth transition and animations. make sure from its quality while keeping things as simple as possible, no spagetti code"
**User notes (verbatim):** "i want match prototype visual while givin power to user as much as possible, like changin scale with scroll etc just like outlook. fullcallendar as a industry standart might be good but what about visual consistency in changing themes ?"

→ Claude responded on calendar theme concerns: custom calendar avoids library theme-override fight; gains Outlook-style scroll-zoom. Flagged Gantt library as **research priority** for gsd-phase-researcher.

---

## MyTasks + Task Detail

| Question | Options | Selected |
|----------|---------|----------|
| MyTasks depth | Full MyTasksExperience / MVP / Wrapper with defaults | **Full MyTasksExperience, componentized for reuse** ✓ |
| Task Detail routing | Separate page / Slide-over sidebar / Modal | **Separate page /projects/[id]/tasks/[taskId]** ✓ |
| Task Detail scope | Properties / Description / Sub-tasks / Comments+Activity+Deps | **All four + rich text toggle + parent-task link + fully functional sidebar + rich sub-issue rows** ✓ |
| TASK-04 phase stepper placement | Horizontal mini in sidebar / Separate section / Tooltip | **Horizontal mini in sidebar** ✓ |

**User notes (verbatim, task detail):** "Description section must be jira like or other tools, it must have a jira like choice rich or plain text and when rich toggled bar on top of the section for rich text controls ( heading ,italic etc, make sure to research well what other tools have) matching prototypes design system / also properties side bar must be fully function, rightnow most of its static. make it flawless action consistent, and match prototypes design system / and i forgot to say that sub-issue section would not have checkbox , it needs to list very clearly( like legacy ones task-key- header, status, due, assigne photo ,labels etc) an when clicked it must go task details page, / task detail page must have a section if the task is sub task, pointing the main task, similar to jiras epic link"

---

## Phase Assignment Gating (TASK-03/04/05)

| Question | Options | Selected |
|----------|---------|----------|
| How to READ enable_phase_assignment | process_config flag / Derived from methodology / Always on | **Read process_config.enable_phase_assignment (default false)** ✓ |
| Phase list source | process_config.workflow.nodes / Separate endpoint / Hardcoded | **process_config.workflow.nodes** ✓ |

---

## Cycle Label Mapping (TASK-06)

| Question | Options | Selected |
|----------|---------|----------|
| Cycle label mapping | Methodology defaults / scrum=Sprint others=Döngü / User-defined | **Methodology-agnostic, user-overridable, methodology defaults as initial value** ✓ |
| Cycle data source | Scrum-only in Phase 11 / Polymorphic cycles / JSONB store | **Scrum-only: /api/v1/sprints; others disabled** ✓ |

**User notes (verbatim):** "we need to stay methodology agnostic so user can have the name he wants. but initial default for methodology might be good ( the recomended options fields: scrum=sprint , kanban=N/A, waterfall=faz etc.)"

---

## Rich Text Editor

| Question | Options | Selected |
|----------|---------|----------|
| Editor library | TipTap / Lexical / Slate.js / Custom textarea | **TipTap** ✓ |

---

## Header Create Button (REVISES Phase 10 D-09)

| Question | Options | Selected |
|----------|---------|----------|
| Header Create exposure | Dropdown menu / Two buttons / Type picker modal / Context-aware | **Neither — user directed: PRIMARY = Task Modal, Project Create moves to /projects page, permission-gated** ✓ |

**User notes (verbatim):** "create buttons prior function must be creating in project tasks. if user want to create project, which will likely less occur then creating task, he needs to use project pages create project button ( which must be invisible, and unaccassible to users that has no permission)"

→ This is a REVISION of Phase 10 D-09 and is captured as D-07/D-08 in CONTEXT.md.

---

## Comments

| Question | Options | Selected |
|----------|---------|----------|
| Comments depth | Flat+@mention+edit/delete / Flat+markdown no mentions / Nested / Rich text | **Flat + @mention + edit/delete** with NO time-based delete constraint ✓ |

**User notes (verbatim):** "flat thread @mention + edit/delete but no N minute time te delete constaint"

---

## Attachments

| Question | Options | Selected |
|----------|---------|----------|
| Attachments scope | Upload/list/delete / Defer Phase 13 / + link references | **Upload/list/delete + link references** ✓ |

---

## Task Dependencies

| Question | Options | Selected |
|----------|---------|----------|
| Dependencies UI | Full CRUD in sidebar / Read-only list / Dedicated tab | **Full CRUD in sidebar** ✓ |

---

## Header Search

| Question | Options | Selected |
|----------|---------|----------|
| Search wiring | Autocomplete dropdown / Navigate to /search / Defer | **Autocomplete dropdown (projects+tasks) with Cmd/Ctrl+K** ✓ |

---

## Task Labels

| Question | Options | Selected |
|----------|---------|----------|
| Label source & mgmt | Project-scoped auto-create / Global / Plain string array | **Project-scoped with auto-create on first use** ✓ |

---

## Task History / Audit Tab

| Question | Options | Selected |
|----------|---------|----------|
| Activity sub-tabs | Yorumlar / Geçmiş / Worklog / Attachments | **Yorumlar + Geçmiş** (Worklog + Attachments-as-tab DEFERRED) ✓ |

---

## Board Card Interaction

| Question | Options | Selected |
|----------|---------|----------|
| Card click behavior | Click=navigate / Double-click rename+hover edits / Slide-over quick edit | **Click = navigate to detail; drag = reorder** (matches prototype) ✓ |

---

## Dashboard Member View Reuse

| Question | Options | Selected |
|----------|---------|----------|
| Dashboard Member view | Reuse MyTasksExperience compact / Separate simpler widget / Defer | **Reuse MyTasksExperience in compact mode** ✓ |

---

## Task Watcher Toggle

| Question | Options | Selected |
|----------|---------|----------|
| Watcher button wiring | Wire full in header / Move to sidebar / Defer Phase 13 | **Wire full in task detail header** (Takip et ↔ Takipte) ✓ |

---

## Properties Sidebar Inline Edit Mechanics

| Question | Options | Selected |
|----------|---------|----------|
| Sidebar edit pattern | Click value → inline select / Click → dropdown menu / Edit button per row / Single "Düzenle" modal | **Click value → inline select opens in place** (Linear/Notion style) ✓ |

---

## Responsive Behavior

| Question | Options | Selected |
|----------|---------|----------|
| Responsive rules | Backlog auto-close <1280 / Tabs scrollable / Sidebar stacks / Desktop-only | **All three breakpoint rules (backlog + tabs + sidebar)** Desktop-only option NOT selected ✓ |

---

## Claude's Discretion (user delegated)

- Exact @dnd-kit sensor/modifier configuration
- TipTap extension configuration
- Debounce values for search/rich-text save
- Animation duration for backlog panel slide
- Toast library choice (reuse from Phase 10)
- Confirmation dialog reuse
- Label color derivation algorithm
- Phase stepper visual treatment details
- Context provider composition order in root layout
- Test coverage strategy

## Deferred Ideas (noted for future phases)

- **Lifecycle tab content** → Phase 12
- **Activity tab content** → Phase 13
- **Workflow editor** → Phase 12
- **Cycle endpoints non-Scrum** → Phase 12/13 backend
- **User Profile pages** → Phase 13
- **Reporting charts** → Phase 13
- **Full /search page** → Phase 13+
- **Worklog tab** → Phase 13+
- **Bulk operations on backlog** → Phase 12/13 (user explicit: "i want it after")
- **Board card inline quick-edit** → not planned
- **Dedicated mobile optimization** → beyond v2.0
