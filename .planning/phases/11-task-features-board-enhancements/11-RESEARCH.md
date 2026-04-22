# Phase 11 — Technical Research

**Researched:** 2026-04-22
**Domain:** Next.js 16 + React 19 frontend; drag-drop, rich text, data tables, Gantt, backend Clean Architecture extension
**Confidence:** HIGH on primary libs (dnd-kit, TipTap, TanStack Table, TanStack Query — all verified via npm registry April 2026). HIGH on backend Clean Architecture pattern (established in Phase 9 per CLAUDE.md + .planning/STATE.md). MEDIUM-HIGH on Gantt selection (all three Gantt candidates from CONTEXT.md D-27 have disqualifying issues; recommendation is a custom SVG implementation with fallback to gantt-task-react behind adapter).

## Summary

Phase 11 is a large, visually-precise frontend build on top of an already-mature Frontend2 scaffold (Next.js 16.2.4 App Router, React 19.2.4, TanStack Query 5.99.2, Axios with interceptors — all in place from Phase 10). The 8-tab ProjectDetail page, Task Create Modal, Task Detail page, Backlog Panel, and MyTasks experience must match the New_Frontend prototype exactly and use only the 16 primitive components plus the CSS token system in `Frontend2/app/globals.css`. The UI-SPEC contract (55 locked decisions D-01 through D-55) is rigid; research identifies specific libraries and install commands, not alternatives.

Four library choices drive the phase: **@dnd-kit/core 6.3.1** (stable, MIT, production-grade for Kanban cross-container DnD; the newer @dnd-kit/react 0.4.0 is pre-stable and explicitly rejected); **@tiptap/react 3.22.4** + **@tiptap/starter-kit 3.22.4** + **@tiptap/extension-image 3.22.4** (MIT, April 2026, React 19 confirmed peer-dep; starter-kit v3 already bundles Bold/Italic/Underline/Strike/Link/BulletList/OrderedList/Blockquote/Code/CodeBlock/Heading/HorizontalRule — only Image needs a separate install); **@tanstack/react-table 8.21.3** (MIT, headless — styles come from our inline-style + token system, no theme fights); and for Gantt, **a custom SVG implementation scoped to ~250 lines** because all three CONTEXT.md candidates have fatal issues (`svar-gantt` and `@wojtekmaj/react-timeline-gantt` do not exist on npm at those names; the actual SVAR package `wx-react-gantt` is **GPLv3** which forces GPL on our proprietary codebase; `frappe-gantt` ships as vanilla JS with no maintained React 19 wrapper; `gantt-task-react` is dead at v0.3.9 from 2022).

**Backend work is small and fits CLAUDE.md Clean Architecture exactly:** one missing vertical slice — labels (endpoint `GET /api/v1/projects/{id}/labels` + `POST /api/v1/labels`). The `LabelModel` SQLAlchemy table is already present (`Backend/app/infrastructure/database/models/label.py`) but has no domain entity, no repository interface, no use case, no router. The audit-log endpoint `GET /tasks/{id}/history` already exists and returns the flat shape the Geçmiş tab consumes (`{field_name, old_value, new_value, user_id, action, timestamp}`), with `extra_metadata` available for phase transitions.

**Primary recommendation:** Install the five verified npm packages (commands below), build the Gantt custom in-house to avoid licensing / staleness risk, scope the backend work to a single labels slice, and lean on the existing Phase 10 patterns (QueryClientProvider at shell layout, ToastProvider, inline-style tokenized primitives, `"use client"` subtree).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| ProjectDetail 8-tab rendering | Browser (Client) | Frontend Server (RSC shell) | Tab state is `useState` per D-09; all 8 tabs are interactive (DnD, scroll, charts) — must be `"use client"` subtree |
| Task Create Modal | Browser (Client) | API | Controlled form state, TaskModalContext, keyboard shortcuts (Ctrl+Enter) are browser-only; API only for POST /tasks |
| Board DnD (task status change) | Browser (Client) | API | @dnd-kit sensors + DragOverlay are browser; optimistic PATCH /tasks/{id} on drop |
| Backlog Panel | Browser (Client) | API | Panel state in localStorage (per-project key); drag-drop handoff to Board; backlog query filtered server-side via `in_backlog` flag |
| List tab (sortable table) | Browser (Client) | — | TanStack Table is headless React; sort state is session-only per D-26 |
| Timeline (Gantt) | Browser (Client) | — | Custom SVG renders in browser from `task.start`/`task.due`; no backend work |
| Calendar tab | Browser (Client) | — | Custom 6×7 grid; scroll-zoom is `wheel` event; localStorage for zoom level |
| MyTasks page | Browser (Client) | API | localStorage overrides + `/api/v1/tasks/my-tasks`; all filter/sort/group logic client-side |
| Task Detail page | Browser (Client) | API | 2-column layout, inline-edit, TipTap rich editor (SSR-disabled), attachment drag-drop |
| TipTap rich editor | Browser (Client, dynamic) | — | `dynamic(() => import(...), { ssr: false })` + `immediatelyRender: false` — mandatory per TipTap + Next.js 16 docs |
| Comments / @mention | Browser (Client) | API | @mention dropdown is local state + filter; POST /comments on submit |
| Labels (chip picker) | Browser (Client) | API (new slice) | GET /projects/{id}/labels (Phase 11 backend work); POST /labels with auto-create |
| Audit log (Geçmiş tab) | Browser (Client) | API | Existing GET /tasks/{id}/history; frontend resolves field_name → localized label |
| Header search autocomplete | Browser (Client) | API | Cmd/Ctrl+K shortcut is browser-only; parallel GET /tasks/search + GET /projects |
| Labels vertical slice | API (Backend) | Domain / Repository | Clean Architecture per CLAUDE.md: entity + ILabelRepository + use case + router |

## Gantt Library Selection (D-27)

### Comparison Table

| Library | Version | React 19 | Next.js 16 | Theming (CSS vars) | Bundle (gz) | Drag-resize | Dep arrows | Last publish | TS types | License | Verdict |
|---------|---------|----------|-----------|---------------------|-------------|-------------|-----------|---------------|----------|---------|---------|
| `svar-gantt` | — | — | — | — | — | — | — | — | — | — | `[VERIFIED: npm registry]` 404 Not Found — does NOT exist on npm under this name. CONTEXT.md D-27 was wrong about the package name. The real SVAR package is `wx-react-gantt`. |
| `wx-react-gantt` (SVAR) | 1.3.1 | peer `^18.3.1` (no 19) | Needs verification | Unknown — their docs show CSS-var theming claim for the PRO edition | — | Yes | Yes | 2025-02-03 | Likely yes | **GPLv3** `[VERIFIED: npm view wx-react-gantt license]` | **REJECT** — GPLv3 forces GPL on SPMS (proprietary), AND peer-dep locks to React 18 |
| `frappe-gantt` (vanilla) | 1.2.2 | N/A (vanilla JS) | Needs wrapper | CSS file overridable | ~20 KB gz (est) | Yes | Yes (visual only) | 2026-02-25 `[VERIFIED: npm view frappe-gantt time.modified]` | None (vanilla) | MIT | **REJECT for Phase 11** — no React 19 wrapper; the existing `frappe-gantt-react` (2022-06) + `react-frappe-gantt` (2022-05) are 4 years stale and pre-React-19. Using vanilla frappe inside a React 19 tree requires hand-written integration (useEffect + imperative API). Cost equals building a custom SVG Gantt but loses theme fidelity. |
| `@wojtekmaj/react-timeline-gantt` | — | — | — | — | — | — | — | — | — | — | `[VERIFIED: npm registry]` 404 Not Found — does NOT exist on npm. CONTEXT.md D-27 listed a non-existent package. |
| `gantt-task-react` | 0.3.9 | peer `^18.0.0` (no 19) | — | CSS file + some inline | ~25 KB gz (est) | Yes | Yes | 2022-07-10 `[VERIFIED: npm view gantt-task-react time.modified]` | Yes | MIT | **REJECT** — 4 years stale, not React 19 compatible, abandoned |
| **Custom SVG in `Frontend2/components/project-detail/timeline-tab.tsx`** | n/a | ✓ (we own it) | ✓ | Native (oklch CSS vars) | 0 (own code) | Optional (stretch) | Deferred to v3 per REQUIREMENTS.md | n/a | Native | n/a | **RECOMMEND** |

### Recommendation: Custom SVG Gantt

**Why it beats the others:**

1. **License hygiene.** SVAR (the only modern React Gantt with active maintenance) is GPLv3 `[VERIFIED]`. SPMS is a proprietary v2.0 SaaS — GPL would either force us to open-source the whole frontend or buy SVAR's PRO edition ([pricing page](https://svar.dev/react/gantt/pricing/) — commercial license, not free). A custom SVG component has no license overhead.

2. **React 19 / Next.js 16 compat.** All three npm-available candidates declare peer-dep to React 18 (wx-react-gantt: `^18.3.1`; gantt-task-react: `^18.0.0`). `--force` or `--legacy-peer-deps` would install them but we would be on unsupported ground for a v2.0 release. A custom component uses React 19 natively — no peer conflict.

3. **Theming fidelity.** The UI-SPEC §16 Timeline theming contract requires: bar fill `color-mix(in oklch, var(--priority-{priority}) 60%, transparent)`, bar left accent `2px solid var(--priority-{priority})`, today line `2px solid var(--primary) dashed`, header row bg `var(--surface-2)`, grid lines `1px solid var(--border)`, alternating row bg `var(--surface)` / `var(--surface-2)`. Third-party Gantts fight against this — they ship default CSS that has to be overridden with `!important` hacks or CSS cascade tricks. Custom SVG uses our tokens natively.

4. **Scope is bounded.** The v1 feature set per CONTEXT.md D-28 is read-only with Day/Week/Month view toggle. Drag-to-reschedule is explicitly a stretch goal. Dependency arrows are deferred to v3 per REQUIREMENTS.md. The feature surface fits in ~250 SVG lines. We are not building a full Gantt product — just a read mode with a view toggle, which is tractable custom work.

5. **No npm weight.** Adds 0 KB to the bundle (only the code we write). The three candidates would add 20-50 KB gzipped each.

**What we give up:** Built-in drag-to-resize, built-in arrow routing for dependencies. Both are nice-to-have. Drag-to-reschedule is a documented stretch goal that can be tackled incrementally; dependency arrows are v3.

**Fallback plan:** If custom Gantt timeline proves bigger than 250 LOC, the planner can consider `frappe-gantt` vanilla wrapped in a `useEffect`-based React 19 adapter we own. But that adapter would itself be ~100 LOC, so custom SVG is the better path.

`[CITED: https://svar.dev/licenses/]` SVAR's own license page confirms GPLv3 for free edition.
`[CITED: https://svar.dev/react/gantt/pricing/]` SVAR's pricing page confirms commercial alternative requires paid license.
`[CITED: https://www.npmjs.com/package/frappe-gantt]` frappe-gantt 1.2.2 npm page.
`[CITED: https://www.npmjs.com/package/gantt-task-react]` gantt-task-react 0.3.9 (last pub 2022).

### Theme Adaptation Strategy

Custom SVG naturally consumes our CSS custom properties. No adaptation layer needed. SVG elements can either:

1. Use `fill={var(--priority-high)}` via JSX `style` attribute (works in SVG `<rect>`, `<path>`, `<line>`).
2. Use `className` and define `.gantt-bar-high { fill: var(--priority-high); }` in a scoped stylesheet.

Pattern recommendation: inline `style={{ fill: 'var(--priority-high)' }}` for dynamic per-task colors; class-based for static scaffold (grid lines, header row).

### SSR / Dynamic Import Pattern

Custom SVG is pure declarative JSX — no `ssr: false` needed. It server-renders fine. If we add `wheel` event zoom later, we gate that inside a `useEffect` (client-only).

### POC Snippet

```tsx
// Frontend2/components/project-detail/timeline-tab.tsx
"use client"
import * as React from "react"
import type { Task } from "@/services/task-service"

type GanttView = "day" | "week" | "month"

interface TimelineTabProps {
  tasks: Task[]
  lang: "tr" | "en"
}

const DAY_WIDTH: Record<GanttView, number> = { day: 48, week: 24, month: 8 }
const ROW_HEIGHT = 32
const HEADER_HEIGHT = 40

export function TimelineTab({ tasks, lang }: TimelineTabProps) {
  const [view, setView] = React.useState<GanttView>("week")

  // Filter tasks with real dates; sort by start
  const scheduled = React.useMemo(
    () => tasks.filter(t => t.start && t.due).sort((a, b) =>
      new Date(a.start!).getTime() - new Date(b.start!).getTime()
    ),
    [tasks]
  )

  // Compute chart bounds
  const { min, max, totalDays } = React.useMemo(() => {
    if (scheduled.length === 0) return { min: new Date(), max: new Date(), totalDays: 0 }
    const starts = scheduled.map(t => new Date(t.start!).getTime())
    const ends = scheduled.map(t => new Date(t.due!).getTime())
    const minT = Math.min(...starts)
    const maxT = Math.max(...ends)
    const days = Math.ceil((maxT - minT) / 86400000) + 1
    return { min: new Date(minT), max: new Date(maxT), totalDays: days }
  }, [scheduled])

  const width = totalDays * DAY_WIDTH[view]
  const height = HEADER_HEIGHT + scheduled.length * ROW_HEIGHT
  const todayX = ((Date.now() - min.getTime()) / 86400000) * DAY_WIDTH[view]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Toolbar — matches UI-SPEC §16 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {lang === "tr" ? "Zaman çizelgesi" : "Timeline"}
        </div>
        <div style={{ flex: 1 }} />
        {(["day", "week", "month"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: view === v ? 600 : 500,
              background: view === v ? "var(--surface)" : "transparent",
              boxShadow: view === v ? "inset 0 0 0 1px var(--border)" : "none",
              borderRadius: 4,
              color: view === v ? "var(--fg)" : "var(--fg-muted)",
            }}
          >
            {v === "day" ? (lang === "tr" ? "Gün" : "Day")
             : v === "week" ? (lang === "tr" ? "Hafta" : "Week")
             : (lang === "tr" ? "Ay" : "Month")}
          </button>
        ))}
      </div>

      {/* SVG chart */}
      <div style={{ overflowX: "auto", boxShadow: "inset 0 0 0 1px var(--border)", borderRadius: "var(--radius-sm)" }}>
        <svg width={width} height={height} style={{ display: "block" }}>
          {/* Header row background */}
          <rect x={0} y={0} width={width} height={HEADER_HEIGHT} fill="var(--surface-2)" />

          {/* Date tick marks on header */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const tickX = i * DAY_WIDTH[view]
            const d = new Date(min.getTime() + i * 86400000)
            return (
              <g key={i}>
                <line x1={tickX} y1={0} x2={tickX} y2={height} stroke="var(--border)" strokeWidth={1} />
                {i % (view === "day" ? 1 : view === "week" ? 7 : 30) === 0 && (
                  <text
                    x={tickX + 4} y={24}
                    fontSize={10.5}
                    fill="var(--fg-subtle)"
                    fontFamily="var(--font-mono)"
                    style={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                  >
                    {d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })}
                  </text>
                )}
              </g>
            )
          })}

          {/* Today line */}
          {todayX >= 0 && todayX <= width && (
            <line
              x1={todayX} y1={HEADER_HEIGHT} x2={todayX} y2={height}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {/* Task bars */}
          {scheduled.map((t, i) => {
            const rowY = HEADER_HEIGHT + i * ROW_HEIGHT
            const startDay = (new Date(t.start!).getTime() - min.getTime()) / 86400000
            const endDay = (new Date(t.due!).getTime() - min.getTime()) / 86400000
            const barX = startDay * DAY_WIDTH[view]
            const barW = Math.max(8, (endDay - startDay) * DAY_WIDTH[view])
            const prio = t.priority ?? "med"
            // Alternating row bg (UI-SPEC contract)
            return (
              <g key={t.id}>
                <rect
                  x={0} y={rowY} width={width} height={ROW_HEIGHT}
                  fill={i % 2 === 0 ? "var(--surface)" : "var(--surface-2)"}
                />
                {/* Priority left accent */}
                <rect x={barX} y={rowY + 6} width={2} height={ROW_HEIGHT - 12} fill={`var(--priority-${prio})`} />
                {/* Bar body */}
                <rect
                  x={barX + 2} y={rowY + 6} width={barW - 2} height={ROW_HEIGHT - 12}
                  rx={4}
                  style={{ fill: `color-mix(in oklch, var(--priority-${prio}) 60%, transparent)` }}
                />
                <text
                  x={barX + 8} y={rowY + 20}
                  fontSize={12}
                  fill="var(--fg)"
                  style={{ pointerEvents: "none" }}
                >
                  {t.key} · {t.title}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
```

This POC is ~100 lines and covers: Day/Week/Month view toggle, priority-colored bars with left accent, today line, header row with tick marks, alternating row bg, proper CSS variable usage. Drag-to-resize and dependency arrows would add another ~100-150 lines each if/when needed.

## @dnd-kit Drag-Drop Patterns

### Library Selection

**Use `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` + `@dnd-kit/modifiers@9.0.0` + `@dnd-kit/utilities@3.2.2`** `[VERIFIED: npm view <pkg> version 2026-04-22]`.

**Do NOT use `@dnd-kit/react@0.4.0`** (published 2026-04-19, three days before this research was conducted). It is a v0.x release, still pre-stable, the roadmap discussion thread on GitHub remains unanswered by maintainers `[CITED: https://github.com/clauderic/dnd-kit/discussions/1842]`, and the migration guide (`[CITED: https://dndkit.com/react/guides/migration/]`) doesn't make stability claims. @dnd-kit/core 6.3.1 is battle-tested, MIT, peer-deps `react: >=16.8` (covers React 19), and has extensive Kanban examples in the wild `[CITED: https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit]`.

### Cross-Container Drag Pattern (Backlog ↔ Board)

Per CONTEXT.md D-13 and UI-SPEC §4 (Backlog Panel), the backlog panel and the 4-column board must share a drag space so a user can drop a backlog task into a board column (which sets the task's status + removes the `in_backlog` flag). The pattern:

1. One `<DndContext>` wraps BOTH the backlog panel and the board columns in the ProjectDetail page.
2. Each column (Backlog, To-Do, Doing, In-Review, Done) is a separate `<SortableContext>` with its own list of task IDs.
3. `<DndContext onDragOver>` detects when a card crosses container boundaries; `onDragEnd` commits the final placement.
4. `<DragOverlay>` renders the ghost card floating with the cursor.

### Sensor Config

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)
```

The `distance: 8` activation constraint prevents accidental drags during click (board card click = navigate to detail per D-23). Keyboard sensor wires arrow-key DnD for accessibility.

### Mount Point Recommendation

**Mount `<DndContext>` at the ProjectDetail page level**, NOT at the shell layout level. Rationale:
- Per D-13 the backlog is scoped to a project (its localStorage key is `spms.backlog.open.{projectId}`).
- The board columns are scoped to a project.
- Tasks only move between columns within the same project.
- Cross-project drag makes no sense.
- Lifting DnD to the shell layout would hold drag state across route changes — unnecessary and risky.

File: `Frontend2/app/(shell)/projects/[id]/page.tsx` wraps its children in `<ProjectDnDProvider projectId={project.id}>` which mounts `<DndContext>` + `<DragOverlay>`.

### onDragEnd Handler Shape

```tsx
type ActiveTask = { id: number; status: string; inBacklog: boolean }

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return

  const draggedId = Number(active.id)
  const sourceColumnId = active.data.current?.columnId as string | undefined
  const targetColumnId = over.data.current?.columnId as string | undefined
  if (!targetColumnId || sourceColumnId === targetColumnId) return

  // WIP check per D-20 — Warn + Allow (soft)
  const targetColumn = columns.find(c => c.id === targetColumnId)
  const newTaskCount = (taskMap[targetColumnId]?.length ?? 0) + 1
  if (targetColumn?.wipLimit && newTaskCount > targetColumn.wipLimit) {
    showToast({
      variant: "warning",
      message: lang === "tr" ? "WIP limiti aşıldı" : "WIP limit exceeded",
    })
    // DO NOT return — allow drop per D-20 authoritative decision
  }

  // Optimistic UI update — move task in local state immediately
  setTaskMap(prev => {
    const next = { ...prev }
    next[sourceColumnId!] = next[sourceColumnId!].filter(t => t.id !== draggedId)
    const movedTask = prev[sourceColumnId!].find(t => t.id === draggedId)!
    next[targetColumnId] = [...(next[targetColumnId] ?? []), { ...movedTask, status: targetColumnId }]
    return next
  })

  // Optimistic TanStack Query update
  queryClient.setQueryData(['tasks', 'project', projectId], (old: Task[] | undefined) =>
    old?.map(t => t.id === draggedId ? { ...t, status: targetColumnId } : t) ?? []
  )

  // Fire PATCH + rollback on error
  updateTaskStatus.mutate(
    { id: draggedId, status: targetColumnId },
    {
      onError: () => {
        // Rollback
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', projectId] })
        showToast({ variant: "error", message: lang === "tr" ? "Durum güncellenemedi" : "Failed to update status" })
      },
    }
  )
}
```

### WIP Check — Warn + Allow (authoritative per D-20)

CONTEXT.md D-20 is explicit: "WIP violation = **Warn + Allow** (soft). ... Drop succeeds regardless — team self-polices." The Phase 11 additional context note in the task description ("ROADMAP success criterion 5 says 'prevents dropping' — CONTEXT.md is authoritative, use Warn + Allow") confirms this. The planner MUST implement the Warn + Allow pattern above, NOT a blocking drop.

Visual feedback per UI-SPEC §3 BoardColumn:
- Column background tints to `color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))` when over limit.
- `<AlertBanner tone="danger">` renders inside column header area with text "WIP limiti aşıldı".
- Transition duration: 150ms on `background`.

## TipTap Rich Editor

### Library Versions

```bash
npm install @tiptap/react@3.22.4 @tiptap/starter-kit@3.22.4 @tiptap/extension-image@3.22.4
```

`[VERIFIED: npm view @tiptap/react version 2026-04-22]` → `3.22.4`, last published 2026-04-18 (4 days before research).
`[VERIFIED: npm view @tiptap/react peerDependencies]` → `react: ^17.0.0 || ^18.0.0 || ^19.0.0` — React 19 confirmed.
`[VERIFIED: npm view @tiptap/starter-kit dependencies]` → bundles 24 internal extensions including `@tiptap/extension-underline@3.22.4` and `@tiptap/extension-link@3.22.4` (the UI-SPEC Rich toolbar explicitly needs both).

**No need to install @tiptap/extension-underline or @tiptap/extension-link separately** — starter-kit v3 includes them `[CITED: https://tiptap.dev/docs/editor/extensions/functionality/starterkit]`. Only `@tiptap/extension-image` is a separate install because Image is NOT in starter-kit.

### SSR / Dynamic Import Pattern (Next.js 16 App Router)

Per official TipTap Next.js docs `[CITED: https://tiptap.dev/docs/editor/getting-started/install/nextjs]`:

```tsx
// Frontend2/components/task-detail/description-editor.tsx
"use client"
import * as React from "react"
import dynamic from "next/dynamic"

// Dynamic import — SSR disabled. Required per TipTap Next.js docs + GitHub issue #5856.
const RichEditor = dynamic(() => import("./description-editor-rich"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 120,
      background: "var(--surface-2)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "inset 0 0 0 1px var(--border)",
    }} />
  ),
})

interface DescriptionEditorProps {
  value: string
  onChange: (html: string) => void
  mode: "plain" | "rich"
}

export function DescriptionEditor({ value, onChange, mode }: DescriptionEditorProps) {
  if (mode === "plain") {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        style={{ /* inputStyle from UI-SPEC */ }}
      />
    )
  }
  return <RichEditor value={value} onChange={onChange} />
}
```

```tsx
// Frontend2/components/task-detail/description-editor-rich.tsx
"use client"
import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"

export default function RichEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
    ],
    content: value,
    // CRITICAL for Next.js SSR — prevents hydration mismatches.
    // Source: https://github.com/ueberdosis/tiptap/issues/5856
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Debounced 2s save per D-36
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onChange(editor.getHTML())
      }, 2000)
    },
  })

  React.useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  if (!editor) return null
  return (
    <div>
      <RichToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
```

### Why Both `dynamic(..., { ssr: false })` AND `immediatelyRender: false`?

Belt-and-suspenders pattern `[CITED: https://github.com/ueberdosis/tiptap/issues/5856]`:

1. `dynamic(ssr: false)` prevents Next.js from attempting to render the component server-side at all.
2. `immediatelyRender: false` is a TipTap-level flag that prevents the editor from attempting initial render on the server (needed even with `ssr: false` because client hydration might still trigger it before mount).

The TipTap team explicitly says: **"If you're using Next.js (App Router or Pages Router) or any other SSR framework, always set `immediatelyRender: false`. Failing to do so will cause hydration errors and other unexpected behavior."** `[CITED: https://tiptap.dev/docs/editor/getting-started/install/nextjs]`.

### Toolbar Composition (Reuse `Button` Primitive)

The UI-SPEC §7 Description section defines the toolbar: Bold, Italic, Underline, Strike, H1/H2/H3, Bullet list, Numbered list, Blockquote, Code, Code block, Link, Image, HR.

```tsx
import { Button } from "@/components/primitives"
import type { Editor } from "@tiptap/react"
import { Bold, Italic, Underline, Strike, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, SquareCode, Link, Image as ImageIcon, Minus } from "lucide-react"

function RichToolbar({ editor }: { editor: Editor }) {
  const btn = (icon: React.ReactNode, action: () => boolean, active: boolean, title: string) => (
    <Button
      size="xs"
      variant="ghost"
      icon={icon}
      onClick={action}
      title={title}
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-fg)" : "var(--fg-muted)",
      }}
    />
  )
  return (
    <div style={{
      display: "flex", gap: 2, padding: 6,
      borderBottom: "1px solid var(--border)",
      background: "var(--surface-2)",
    }}>
      {btn(<Bold size={14} />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold")}
      {btn(<Italic size={14} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic")}
      {btn(<Underline size={14} />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Underline")}
      {btn(<Strike size={14} />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Strike")}
      <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
      {btn(<Heading1 size={14} />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }), "H1")}
      {btn(<Heading2 size={14} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), "H2")}
      {btn(<Heading3 size={14} />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }), "H3")}
      {/* ... Bullet, OrderedList, Blockquote, Code, CodeBlock, Link, Image, HR ... */}
    </div>
  )
}
```

### HTML Storage and 2s Debounced Save

`editor.getHTML()` returns a serialized HTML string stable across TipTap versions (the output of ProseMirror serialization, which is deterministic for a given schema). Store directly in `task.description` column (existing TEXT field). The 2s debounce is per CONTEXT.md D-36 — `setTimeout` inside `onUpdate` callback, cleared on next keystroke, cleaned up on unmount.

### Bundle Size Note

TipTap is heavy: starter-kit alone pulls in ~24 internal @tiptap/extension-* packages plus ProseMirror core. Bundlephobia measured recent starter-kit at ~150-200 KB gzipped (full editor + core + all starter extensions). `[CITED: https://bundlephobia.com/package/@tiptap/starter-kit]`. The `dynamic({ ssr: false })` ensures this chunk is split out of the initial page load and only downloaded when the user clicks "Zengin" mode in the SegmentedControl.

## TanStack Table v8 (List tab)

### Version

```bash
npm install @tanstack/react-table@8.21.3
```

`[VERIFIED: npm view @tanstack/react-table version]` → `8.21.3`, MIT, peer-deps `react: >=16.8` — React 19 compatible.

### Column Defs

```tsx
// Frontend2/components/project-detail/list-tab.tsx
"use client"
import { useReactTable, getCoreRowModel, getSortedRowModel,
  type ColumnDef, type SortingState } from "@tanstack/react-table"
import { Badge, PriorityChip, StatusDot, Avatar } from "@/components/primitives"
import type { Task, Project } from "@/services/task-service"
import { Bug } from "lucide-react"

export function ListTab({ project, tasks, lang }: { project: Project; tasks: Task[]; lang: "tr" | "en" }) {
  const phaseEnabled = project.process_config?.enable_phase_assignment === true

  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    const cols: ColumnDef<Task>[] = [
      {
        accessorKey: "key",
        header: lang === "tr" ? "ANAHTAR" : "KEY",
        cell: info => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: lang === "tr" ? "BAŞLIK" : "TITLE",
        cell: info => {
          const t = info.row.original
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t.type === "bug" && <Bug size={12} color="var(--priority-critical)" />}
              <span style={{ fontSize: 12.5 }}>{t.title}</span>
            </span>
          )
        },
      },
      { accessorKey: "status", header: lang === "tr" ? "DURUM" : "STATUS",
        cell: info => <><StatusDot status={info.getValue() as string} /> <span>{info.getValue() as string}</span></> },
      { accessorKey: "priority", header: lang === "tr" ? "ÖNCELİK" : "PRIORITY",
        cell: info => <PriorityChip level={info.getValue() as "low"|"medium"|"high"|"critical"} /> },
      { accessorKey: "assignee_id", header: lang === "tr" ? "ATANAN" : "ASSIGNEE",
        cell: info => <Avatar userId={info.getValue() as number} size={20} /> },
      { accessorKey: "due", header: lang === "tr" ? "BİTİŞ" : "DUE", cell: info => formatDate(info.getValue() as string) },
      { accessorKey: "points", header: "SP", cell: info => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{String(info.getValue() ?? "—")}</span>
      ) },
    ]
    if (phaseEnabled) {
      cols.push({
        accessorKey: "phase_id",
        header: lang === "tr" ? "FAZ" : "PHASE",
        cell: info => {
          const nodeName = project.process_config?.workflow?.nodes?.find(n => n.id === info.getValue())?.name ?? "—"
          return <Badge size="xs" tone="neutral">{nodeName}</Badge>
        },
      })
    }
    return cols
  }, [lang, phaseEnabled, project])

  // Per D-26: default sort Priority desc → Due asc → Key asc
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "priority", desc: true },
    { id: "due", desc: false },
    { id: "key", desc: false },
  ])

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div style={{ display: "grid", gridTemplateColumns: phaseEnabled
      ? "80px 2fr 110px 110px 120px 90px 60px 100px"
      : "80px 2fr 110px 110px 120px 90px 60px",
      boxShadow: "inset 0 0 0 1px var(--border)",
      borderRadius: "var(--radius-sm)",
    }}>
      {/* Header */}
      {table.getHeaderGroups().map(hg => hg.headers.map(h => (
        <div key={h.id}
          onClick={h.column.getToggleSortingHandler()}
          style={{
            padding: "8px 16px", fontSize: 11, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 0.4,
            color: "var(--fg-subtle)",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer",
          }}>
          {flexRender(h.column.columnDef.header, h.getContext())}
          {/* sort indicator: ChevronUp / ChevronDown after label */}
        </div>
      )))}
      {/* Rows */}
      {table.getRowModel().rows.map(r => r.getVisibleCells().map(c => (
        <div key={c.id} style={{ padding: "8px 16px", fontSize: 12.5, borderBottom: "1px solid var(--border)" }}>
          {flexRender(c.column.columnDef.cell, c.getContext())}
        </div>
      )))}
    </div>
  )
}
```

### Tokenized Styling (no @tanstack/react-table theme system)

TanStack Table is **headless** — it exposes data-processing APIs (`useReactTable`, `getHeaderGroups`, `getRowModel`) and lets the consumer render any DOM. There is no theming API to fight. We render a `<div>`-grid with inline styles that reference our CSS custom properties. `[CITED: https://tanstack.com/table/v8/docs/introduction]`

### Search Query Sharing (Board toolbar ↔ List tab)

CONTEXT.md D-25 says "Search input shared with Board toolbar search (same query string via URL or context)". Recommendation: **React Context at the ProjectDetail page level**. Reasons:

- URL state would require `useRouter` + searchParams mutation — per Next.js 16 async searchParams, this adds complexity.
- Per D-09 tab state is React `useState` not URL — consistent with not using URL for derived UI state.
- The search query is scoped to the project detail view and shouldn't leak across navigation.

```tsx
// Frontend2/components/project-detail/project-detail-context.tsx
"use client"
import * as React from "react"

interface ProjectDetailState {
  searchQuery: string
  setSearchQuery: (q: string) => void
  // also: density, phase filter, etc.
}
const Ctx = React.createContext<ProjectDetailState | null>(null)

export function ProjectDetailProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = React.useState("")
  return <Ctx.Provider value={{ searchQuery, setSearchQuery }}>{children}</Ctx.Provider>
}

export function useProjectDetail() {
  const v = React.useContext(Ctx)
  if (!v) throw new Error("useProjectDetail must be used within ProjectDetailProvider")
  return v
}
```

Both the Board toolbar search input and the List tab header filter read/write via `useProjectDetail()`.

## React 19 / Next.js 16 Compatibility Notes

### React 19 Compatibility (All primary libs verified)

| Library | React 19 peer-dep | Status |
|---------|---------------------|--------|
| `@dnd-kit/core@6.3.1` | `react: >=16.8.0` | ✓ `[VERIFIED: npm view peerDependencies]` |
| `@dnd-kit/sortable@10.0.0` | same as core | ✓ |
| `@dnd-kit/modifiers@9.0.0` | `react: >=16.8.0` | ✓ |
| `@dnd-kit/utilities@3.2.2` | same | ✓ |
| `@tiptap/react@3.22.4` | `react: ^17 \|\| ^18 \|\| ^19` | ✓ explicit 19 support |
| `@tiptap/starter-kit@3.22.4` | inherits from @tiptap/react | ✓ |
| `@tanstack/react-table@8.21.3` | `react: >=16.8` | ✓ |
| `@tanstack/react-query@5.99.2` | `react: ^18 \|\| ^19` | ✓ already installed |

### Next.js 16 Breaking Changes Relevant to Phase 11

From `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`:

1. **Async `params` and `searchParams` in page.tsx / layout.tsx.** Previously sync, now Promises `[CITED: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md]`. Phase 11 introduces new routes:
   - `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` — MUST use `async function Page(props: PageProps<'/projects/[id]/tasks/[taskId]'>) { const { id, taskId } = await props.params; ... }` pattern.
   - Existing `Frontend2/app/(shell)/projects/[id]/page.tsx` is currently a `"use client"` component that uses `useParams()` — that remains valid for client components. But if we switch to a server wrapper + client child pattern, the server wrapper MUST use `await params`.

2. **Turbopack is the default** for `next dev` and `next build` (no more `--turbopack` flag needed). Already in Frontend2/package.json.

3. **`next/dynamic` unchanged** — the TipTap `dynamic({ ssr: false })` pattern still works exactly as before `[CITED: node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md]`.

4. **React 19.2 features available.** React Compiler is stable but OFF by default. We don't need to enable it for Phase 11.

### Provider Tree Ordering (root layout + shell layout)

Current `Frontend2/app/layout.tsx` (root) tree:
```
<html>
  <body>
    <AppProvider>          ← theme, language, density (existing)
      <AuthProvider>       ← current user (existing)
        {children}
      </AuthProvider>
    </AppProvider>
  </body>
</html>
```

Current `Frontend2/app/(shell)/layout.tsx` (shell, client):
```
<QueryClientProvider>      ← TanStack Query (existing, module-scope client)
  <ToastProvider>          ← Phase 10 D-07
    <AppShell>             ← Header + Sidebar
      {children}
    </AppShell>
  </ToastProvider>
</QueryClientProvider>
```

**Phase 11 extensions (ordering matters):**

```
<QueryClientProvider>
  <ToastProvider>
    <TaskModalProvider>    ← NEW — D-01: single modal instance at shell level
      <AppShell>
        {children}          ← ProjectDetailProvider mounts inside route, with DndContext + SortableContext
      </AppShell>
    </TaskModalProvider>
  </ToastProvider>
</QueryClientProvider>
```

**Why TaskModalProvider at shell level, not root:** The modal needs `useQueryClient()` (for task invalidation), `useToast()` (for success toast), and `useAuth()` (for current user — reporter auto-fill). Root layout runs before QueryClientProvider, which is the hard constraint. Also, Task Modal only exists in authenticated shell routes — auth routes should never show it.

**Why DndContext inside ProjectDetail route, not shell:** Drag state is scoped to a project. Shell-level DnD would be confused by route changes.

## Bundle Size Budget

| Addition | Gzipped | Strategy |
|----------|---------|----------|
| `@dnd-kit/core` + `/sortable` + `/modifiers` + `/utilities` | ~12 KB `[CITED: bundlephobia search result]` | Loaded on project detail route only |
| `@tanstack/react-table` | ~15 KB gz | Loaded on project detail route (List tab) |
| `@tiptap/react` + `starter-kit` + `extension-image` | ~150-200 KB gz | **Chunk-split via `dynamic({ ssr: false })`** — only downloaded when user clicks "Zengin" tab |
| `@tiptap/pm` (ProseMirror core) | Included in starter-kit deps above | Same chunk |
| Custom SVG Gantt | 0 KB | Own code |
| New Frontend2 components (board-tab, list-tab, backlog, etc.) | ~20-40 KB gz | Route-split by Next.js |

**Total estimated impact on project-detail route initial bundle:** ~50 KB gzipped additional (dnd-kit + tanstack-table + new components).
**TipTap is NOT in initial bundle** — it's behind a user interaction (clicking "Zengin" SegmentedControl). Lazy chunk.

If total project-detail client bundle exceeds 500 KB gzipped target, the planner can use `next.config.js` `optimizePackageImports` for `lucide-react` (already heavy due to hundreds of icon modules) `[CITED: https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports]`. This is a judgment call for the planner.

## Audit Log Shape (Geçmiş tab)

### Endpoint (Already Exists)

```
GET /api/v1/tasks/{task_id}/history
```

Returns `List[Any]` (untyped response), but the actual shape per `Backend/app/infrastructure/database/repositories/audit_repo.py::get_by_entity` is:

```json
[
  {
    "entity_type": "task",
    "entity_id": 123,
    "field_name": "status",       // Python attr column name: "status", "priority", "assignee_id", etc.
    "old_value": "todo",           // Stringified
    "new_value": "progress",       // Stringified
    "user_id": 5,
    "action": "updated",           // "created" | "updated" | "deleted"
    "timestamp": "2026-04-22T12:34:56Z"
  }
]
```

`[VERIFIED: Backend/app/infrastructure/database/repositories/audit_repo.py lines 36-59]`

### Gaps and Rendering Strategy

**Missing fields the Geçmiş tab display needs:**
- `user_name` and `user_avatar` — NOT returned by `/tasks/{id}/history`. (The richer `get_project_activity` method DOES return these via JOIN but the task-history endpoint uses the thinner `get_by_entity`.) **Action:** Either extend `get_by_entity` to JOIN users (small backend patch), or have the frontend resolve `user_id` via the existing `/api/v1/users/{id}` / cached users query. Frontend-side resolution is simpler and avoids a backend change.

**Field name resolution (localization):**
- Backend stores `field_name` = DB column name (e.g., `"status"`, `"assignee_id"`, `"priority"`, `"due"`, `"points"`).
- Frontend Geçmiş tab must translate: `"status"` → `lang === "tr" ? "Durumu" : "Status"`; `"assignee_id"` → `"Atanan kişiyi" / "Assignee"`; etc.
- Value localization: `"status": "progress"` → TR `"Devam Eden"`, EN `"In Progress"`. Existing status value maps already live in the prototype / Frontend2 primitives.

**Rendering contract:**
```
{user_name (resolved from user_id)} {verb(action, field_name)} {field_localized} {old_localized} → {new_localized} {time}
```

Example rendered output: `"Ayşe Yılmaz durumu Yapılacak'tan Devam Eden'e değiştirdi · 12 dakika önce"`.

**Pure helper function** in `Frontend2/lib/audit-formatter.ts` (unit-testable) that takes `(entry, lang, users, columnMap, phaseMap)` and returns the formatted string. This is a Wave 0 testable module.

## Backend Work Items

### Missing: GET /api/v1/projects/{id}/labels + POST /api/v1/labels

**Current state (verified):**
- ✓ `LabelModel` SQLAlchemy table exists: `Backend/app/infrastructure/database/models/label.py` (id, project_id FK, name, color, task_labels m2m association)
- ✗ No `Label` domain entity (Pydantic)
- ✗ No `ILabelRepository` abstract class
- ✗ No `SqlAlchemyLabelRepository` implementation
- ✗ No use cases
- ✗ No router

**Clean Architecture scaffolding (per CLAUDE.md strict enforcement):**

**1. Domain** (`Backend/app/domain/`)
```python
# app/domain/entities/label.py
from pydantic import BaseModel, ConfigDict
from typing import Optional

class Label(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    name: str
    color: str
    # denormalized for list endpoint
    usage_count: Optional[int] = 0

# app/domain/repositories/label_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.label import Label

class ILabelRepository(ABC):
    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Label]: ...

    @abstractmethod
    async def get_by_name_in_project(self, project_id: int, name: str) -> Optional[Label]: ...

    @abstractmethod
    async def create(self, project_id: int, name: str, color: str) -> Label: ...

# app/domain/exceptions.py — add:
class LabelNameAlreadyExistsError(Exception):
    pass
```

**2. Infrastructure** (`Backend/app/infrastructure/database/repositories/label_repo.py`)
```python
from typing import List, Optional
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.repositories.label_repository import ILabelRepository
from app.domain.entities.label import Label
from app.infrastructure.database.models.label import LabelModel, task_labels

class SqlAlchemyLabelRepository(ILabelRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_project(self, project_id: int) -> List[Label]:
        # JOIN task_labels to compute usage_count
        usage = (
            select(task_labels.c.label_id, sqlfunc.count(task_labels.c.task_id).label("cnt"))
            .group_by(task_labels.c.label_id)
            .subquery()
        )
        stmt = (
            select(LabelModel, sqlfunc.coalesce(usage.c.cnt, 0).label("usage_count"))
            .join(usage, usage.c.label_id == LabelModel.id, isouter=True)
            .where(LabelModel.project_id == project_id)
            .order_by(LabelModel.name)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            Label.model_validate({
                **{col: getattr(model, col) for col in ("id", "project_id", "name", "color")},
                "usage_count": int(cnt or 0),
            })
            for model, cnt in rows
        ]

    async def get_by_name_in_project(self, project_id: int, name: str) -> Optional[Label]:
        stmt = select(LabelModel).where(LabelModel.project_id == project_id, LabelModel.name == name)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return Label.model_validate(model) if model else None

    async def create(self, project_id: int, name: str, color: str) -> Label:
        model = LabelModel(project_id=project_id, name=name, color=color)
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        return Label.model_validate(model)
```

**3. Application** (`Backend/app/application/`)
```python
# app/application/dtos/label_dtos.py
from pydantic import BaseModel, Field
from typing import Optional

class LabelCreateDTO(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=50)
    color: Optional[str] = None  # null → auto-derive from name hash

class LabelResponseDTO(BaseModel):
    id: int
    project_id: int
    name: str
    color: str
    usage_count: int

# app/application/use_cases/manage_labels.py
from app.domain.repositories.label_repository import ILabelRepository
from app.domain.exceptions import LabelNameAlreadyExistsError
from app.application.dtos.label_dtos import LabelCreateDTO, LabelResponseDTO

class ListProjectLabelsUseCase:
    def __init__(self, repo: ILabelRepository):
        self.repo = repo
    async def execute(self, project_id: int):
        return await self.repo.list_by_project(project_id)

class CreateLabelUseCase:
    def __init__(self, repo: ILabelRepository):
        self.repo = repo
    async def execute(self, dto: LabelCreateDTO) -> LabelResponseDTO:
        # Uniqueness within project
        existing = await self.repo.get_by_name_in_project(dto.project_id, dto.name)
        if existing is not None:
            raise LabelNameAlreadyExistsError(f"Label '{dto.name}' already exists in project {dto.project_id}")
        # Color: either provided or auto-derive (hue hash on frontend is simpler — accept '#RRGGBB' default for DB)
        color = dto.color or "#94a3b8"
        return await self.repo.create(dto.project_id, dto.name, color)
```

**4. API** (`Backend/app/api/v1/labels.py`)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_label_repo, get_current_user, get_project_member
from app.application.dtos.label_dtos import LabelCreateDTO, LabelResponseDTO
from app.application.use_cases.manage_labels import ListProjectLabelsUseCase, CreateLabelUseCase
from app.domain.exceptions import LabelNameAlreadyExistsError
from app.domain.repositories.label_repository import ILabelRepository
from app.domain.entities.user import User
from typing import List

router = APIRouter()

# Listing is under the project resource per CONTEXT.md D-51
@router.get("/projects/{project_id}/labels", response_model=List[LabelResponseDTO])
async def list_project_labels(
    project_id: int,
    repo: ILabelRepository = Depends(get_label_repo),
    current_user: User = Depends(get_project_member),  # membership check
):
    return await ListProjectLabelsUseCase(repo).execute(project_id)

# Creation is under the labels resource with project_id in body
@router.post("/labels", response_model=LabelResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_label(
    dto: LabelCreateDTO,
    repo: ILabelRepository = Depends(get_label_repo),
    current_user: User = Depends(get_current_user),
):
    # TODO: membership check on dto.project_id
    try:
        return await CreateLabelUseCase(repo).execute(dto)
    except LabelNameAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
```

**5. DI Wiring** (`Backend/app/api/deps/label.py` — new file in the deps submodule per Phase 9 D-31 split)
```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.repositories.label_repository import ILabelRepository
from app.infrastructure.database.repositories.label_repo import SqlAlchemyLabelRepository
from app.api.deps.db import get_db

def get_label_repo(session: AsyncSession = Depends(get_db)) -> ILabelRepository:
    return SqlAlchemyLabelRepository(session)
```

Then re-export from `Backend/app/api/dependencies.py` (the compat shim).

**6. Router Registration** (`Backend/app/main.py` or wherever `include_router` is called):
```python
from app.api.v1 import labels
app.include_router(labels.router, prefix="/api/v1", tags=["labels"])
```

**No migration needed** — the `labels` and `task_labels` tables already exist per migration history (Phase 2 TASK-05 era).

**Auto-create on first use (per D-51):** Frontend calls `GET /projects/{id}/labels` to fetch existing. When user types a name that doesn't match, frontend calls `POST /labels` with `{project_id, name}`, then attaches the returned label id to the task PATCH. The 409 conflict shouldn't happen in practice because frontend checks before POST, but handle it gracefully (re-fetch list, link to existing).

## Library Versions (as of 2026-04-22)

All versions verified via `npm view <pkg> version` on 2026-04-22:

```bash
# Drag-and-drop
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/modifiers@9.0.0 @dnd-kit/utilities@3.2.2

# Rich text (TipTap)
npm install @tiptap/react@3.22.4 @tiptap/starter-kit@3.22.4 @tiptap/extension-image@3.22.4
# NOTE: Link and Underline are already bundled in starter-kit v3 — no separate install needed

# Headless table (List tab)
npm install @tanstack/react-table@8.21.3

# NOT installing a Gantt library — custom SVG implementation in Frontend2/components/project-detail/timeline-tab.tsx
```

**Publish date sanity:** `[VERIFIED: npm view <pkg> time.modified]`
- @tiptap/starter-kit: 2026-04-18 (4 days old at research time)
- @dnd-kit/core: 2024-12-05 (mature and stable)
- @tanstack/react-table: 2024-12-04 (stable)
- @tanstack/react-query: 2026-04-19 (fresh, already on 5.99.2)

## Validation Architecture

**Framework status:** No test framework installed in Frontend2 as of Phase 11 start. `package.json` has no `test` script. Need Wave 0 setup.

| Property | Value |
|----------|-------|
| Framework | **Vitest 1.x + React Testing Library** (recommended) — Vitest is Vite-native, first-class ESM, fast; works cleanly alongside Next.js 16 / Turbopack; mature React 19 support. Alternative: Jest 29+. |
| Config file | `Frontend2/vitest.config.ts` (TO CREATE in Wave 0) |
| Quick run command | `npx vitest run <path>` |
| Full suite command | `npx vitest run` |
| E2E | **Playwright** — already standard for Next.js; tests run against `npm run dev` server. |
| E2E config file | `Frontend2/playwright.config.ts` (TO CREATE in Wave 0) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-01 | Task Create Modal: required field validation (disabled until title+project) | unit | `npx vitest run components/task-modal/task-create-modal.test.tsx` | ❌ Wave 0 |
| TASK-01 | Task Create Modal: Ctrl/Cmd+Enter submits | unit | same file | ❌ Wave 0 |
| TASK-01 | Task Create Modal: Esc closes without draft | unit | same file | ❌ Wave 0 |
| TASK-02 | Backlog panel: localStorage persistence key `spms.backlog.open.{projectId}` | unit | `npx vitest run components/project-detail/backlog-panel.test.tsx` | ❌ Wave 0 |
| TASK-02 | Backlog → Board drop moves task, optimistic update, PATCH fires | integration | `npx vitest run lib/dnd/board-dnd.test.tsx` | ❌ Wave 0 |
| TASK-02 | Methodology matrix: backlog-definition query builder returns correct filter | unit | `npx vitest run lib/methodology-matrix.test.ts` | ❌ Wave 0 |
| TASK-03 | Phase dropdown appears when `enable_phase_assignment=true`; hidden otherwise | unit | `npx vitest run components/task-modal/task-create-modal.test.tsx` | ❌ Wave 0 |
| TASK-04 | Phase mini-stepper counts sub-tasks per phase correctly | unit | `npx vitest run components/task-detail/phase-stepper.test.tsx` | ❌ Wave 0 |
| TASK-05 | Board toolbar phase filter reflects in displayed cards | integration | `npx vitest run components/project-detail/board-tab.test.tsx` | ❌ Wave 0 |
| TASK-05 | List tab Phase column renders when `enable_phase_assignment=true` | unit | `npx vitest run components/project-detail/list-tab.test.tsx` | ❌ Wave 0 |
| TASK-06 | Cycle label renders based on methodology (Sprint for Scrum, hidden for Kanban, disabled for others) | unit | `npx vitest run lib/cycle-label.test.ts` | ❌ Wave 0 |
| PAGE-03 | 8-tab bar renders; tab switching via useState | unit | `npx vitest run app/(shell)/projects/[id]/page.test.tsx` | ❌ Wave 0 |
| PAGE-03 | Settings > Columns: rename + WIP limit edit | integration | `npx vitest run components/project-detail/settings-tab.test.tsx` | ❌ Wave 0 |
| PAGE-04 | MyTasksExperience: smart-sort, due-bucket, saved views | unit | `npx vitest run lib/my-tasks/smart-sort.test.ts lib/my-tasks/due-bucket.test.ts` | ❌ Wave 0 |
| PAGE-04 | MyTasks localStorage overrides | unit | `npx vitest run hooks/use-my-tasks-store.test.ts` | ❌ Wave 0 |
| PAGE-07 | WIP violation shows AlertBanner + column bg tint, drop SUCCEEDS (Warn + Allow per D-20) | integration | `npx vitest run lib/dnd/board-dnd.test.tsx` | ❌ Wave 0 |
| D-50 | Header Cmd/Ctrl+K focuses search input | unit | `npx vitest run components/header/search-autocomplete.test.tsx` | ❌ Wave 0 |
| D-51 | Label auto-create on first use: existing match returns id, new name creates | integration | `npx vitest run hooks/use-labels.test.ts` | ❌ Wave 0 |
| D-47 | Audit-log formatter resolves field_name + localizes values | unit | `npx vitest run lib/audit-formatter.test.ts` | ❌ Wave 0 |
| E2E | Full create-task happy path | e2e | `npx playwright test tests/e2e/create-task.spec.ts` | ❌ Wave 0 |
| E2E | Open task detail, inline-edit status via sidebar | e2e | `npx playwright test tests/e2e/task-detail-inline-edit.spec.ts` | ❌ Wave 0 |
| E2E | Add dependency from properties sidebar | e2e | `npx playwright test tests/e2e/task-dependency.spec.ts` | ❌ Wave 0 |
| E2E | Upload attachment (drag-drop) | e2e | `npx playwright test tests/e2e/task-attachment.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Run vitest for files touched by that task: `npx vitest run <changed-paths>`
- **Per wave merge:** Run full vitest suite: `npx vitest run`
- **Phase gate:** Full vitest + Playwright green before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `Frontend2/package.json` — add dev deps: `vitest@1.6.0`, `@testing-library/react@16.0.0`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom@24`, `@playwright/test`
- [ ] `Frontend2/vitest.config.ts` — jsdom environment, React plugin, setup file for `@testing-library/jest-dom`
- [ ] `Frontend2/tests/setup.ts` — global test setup (cleanup, fetch polyfill, localStorage mock)
- [ ] `Frontend2/playwright.config.ts` — point to `npm run dev` localhost:3000, trace on failure
- [ ] `Frontend2/tests/helpers/render-with-providers.tsx` — wraps render() with QueryClientProvider + AppProvider + AuthProvider + ToastProvider for component tests
- [ ] `Frontend2/tests/fixtures/tasks.ts`, `projects.ts` — shared test data
- [ ] Add scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`

**Estimated Wave 0 setup cost:** 1 plan (2 tasks) — install + configure + write render-with-providers helper + write first trivial smoke test to prove the rig works.

## Performance: MyTasks List Virtualization

**Decision: Virtualization NOT NEEDED for Phase 11.**

Rationale:
- User story says "200+ tasks in MyTasks". 200 DOM rows with inline styles and a 32-34px row height is ~7000px tall — render cost is acceptable on any modern browser.
- The prototype (`New_Frontend/src/pages/my-tasks.jsx`) renders plain list without virtualization and is the design source. Matching it visually means matching its rendering strategy.
- Virtualization introduces complexity: intersection observers, scroll-restoration, accessibility (keyboard navigation skips unmounted rows), grouping (collapsed group headers).
- TanStack Virtual is available if needed later — adding it in a future phase is a drop-in replacement.

**Trigger for future virtualization:** When real user data shows >500 tasks per user OR MyTasks scroll FPS drops below 30 on mid-range hardware. At that point, re-evaluate with `@tanstack/react-virtual@3.13.24` (MIT, React 19 compatible).

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives apply to Phase 11:

### Frontend (Clean Architecture doesn't literally apply to UI, but...)
- CLAUDE.md is Python/FastAPI backend guidance. The frontend is governed by CONTEXT.md + UI-SPEC + the prototype.
- Memory: "No shadcn/ui" (MEMORY.md) — strictly honored; prototype + 16 primitives only.
- Memory: "Frontend2 rebuild strategy — ZERO from old Frontend/, ALL UI from prototype" — Phase 11 uses ONLY `New_Frontend/src/` as design source, never `Frontend/src/`.

### Backend (for the labels vertical slice)
- **Dependency Rule.** `app/application/use_cases/manage_labels.py` must NOT import SQLAlchemy or `app.infrastructure.*`. It depends on `ILabelRepository` from `app.domain.repositories.*` only.
- **Strategy Pattern for methodology.** Not applicable to labels (labels are not methodology-dependent).
- **Single Responsibility.** `CreateLabelUseCase` creates labels; `ListProjectLabelsUseCase` lists them. No combined services.
- **Dependency Injection.** Wire `SqlAlchemyLabelRepository` to `ILabelRepository` in `Backend/app/api/deps/label.py`. Never import `SqlAlchemyLabelRepository` inside the use case.
- **Implementation order.** DOMAIN (entity, repo interface, exceptions) → INFRASTRUCTURE (SQLAlchemy model already exists, write repository impl + mapper) → APPLICATION (DTOs, use cases) → API (dependencies.py wiring, router, include_router).
- **Audit log.** PATCH operations on labels (when we add them — not in Phase 11) MUST log to audit_log.

## Standard Stack

### Core (already in Frontend2 from prior phases)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | App Router, routing, build | `[VERIFIED: package.json]` — locked Phase 8 |
| react | 19.2.4 | UI runtime | `[VERIFIED: package.json]` |
| @tanstack/react-query | 5.99.2 | Server state | `[VERIFIED: package.json]` — Phase 10 D-05 |
| axios | 1.15.1 | HTTP client + interceptors | `[VERIFIED: package.json]` — Phase 10 D-02 |
| lucide-react | 1.8.0 | Icons | `[VERIFIED: package.json]` |

### Phase 11 Additions
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | Drag-drop primitives | Industry standard for headless DnD; MIT; React 19 compatible `[VERIFIED]` |
| @dnd-kit/sortable | 10.0.0 | Sortable preset | Pairs with core |
| @dnd-kit/modifiers | 9.0.0 | Axis-lock modifiers | Optional but handy |
| @dnd-kit/utilities | 3.2.2 | CSS transform helpers | Needed by SortableContext |
| @tiptap/react | 3.22.4 | Rich text editor React bindings | Modern, ProseMirror-based, React 19 peer `[VERIFIED]` |
| @tiptap/starter-kit | 3.22.4 | Standard editor extensions | Bundles 24 extensions incl. Underline + Link `[VERIFIED]` |
| @tiptap/extension-image | 3.22.4 | Image node | Not in starter-kit; needed per UI-SPEC |
| @tanstack/react-table | 8.21.3 | Headless data table | Pairs with Query; same auth as project |

### Alternatives Considered (and rejected)
| Instead of | Could Use | Why Rejected |
|------------|-----------|--------------|
| @dnd-kit/core 6.3.1 | @dnd-kit/react 0.4.0 | v0.x pre-stable; 3 days old; roadmap unclear |
| @dnd-kit | react-beautiful-dnd | Unmaintained since 2022; known React 18/19 issues |
| @dnd-kit | native HTML5 DnD | Poor touch/keyboard support; no overlay; per D-19 explicitly rejected |
| Custom Gantt | wx-react-gantt | GPLv3 blocks proprietary use |
| Custom Gantt | frappe-gantt (vanilla) + self-wrapper | Wrapper cost ~= custom build cost; lose theme fidelity |
| Custom Gantt | gantt-task-react | 4 years dead; React 18 peer |
| TanStack Table | AG Grid / Tabulator | Heavy; theme fights; overkill for our feature set |
| TipTap | Lexical (Meta) | More complex, younger; toolbar matching prototype harder |
| TipTap | SlateJS | Slower API churn; less batteries-included |

### Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop across containers | Custom HTML5 DnD | @dnd-kit/core | Keyboard a11y, touch support, overlay rendering, collision detection — all solved |
| Rich text editor | contenteditable + toolbar | @tiptap/react + starter-kit | ProseMirror handles selection/undo/IME/accessibility; we don't |
| Sortable table with headers | Manual sort state + callback | @tanstack/react-table | Column defs, multi-column sort, row models — don't rebuild |
| HTTP client | fetch() boilerplate | axios (already in) | Interceptors, cancellation, request composition already configured |
| Async state | Hand-rolled fetch + cache | @tanstack/react-query (already in) | Caching, invalidation, optimistic updates, retry — solved |
| Date math | Hand-rolled date arithmetic | Built-ins `new Date()` + ms math | Lightweight; date-fns or dayjs overkill for calendar cell math |

**Key insight:** These libraries are all headless/minimal-theme — they fit our "inline styles + CSS custom properties" system cleanly. No "theme override" battles because they don't ship a default theme.

## Architecture Patterns

### System Architecture Diagram

```
USER BROWSER (Next.js 16 App Router, React 19 — all "use client" subtree for Phase 11)
┌────────────────────────────────────────────────────────────────────────────┐
│ app/layout.tsx (Server)                                                     │
│  └─ AppProvider → AuthProvider                                              │
│                                                                             │
│     app/(shell)/layout.tsx (Client — "use client")                          │
│      └─ QueryClientProvider → ToastProvider → TaskModalProvider → AppShell  │
│                                                    │                        │
│                     ┌──────────────────────────────┼──────────────────┐     │
│                     ↓                              ↓                  ↓     │
│              /projects/[id]/page.tsx     /my-tasks/page.tsx  /dashboard/... │
│              ProjectDetailProvider        MyTasksExperience                 │
│              <DndContext>+<SortableCtx>                                     │
│                 │                                                           │
│                 ├─ 8 Tabs (useState)                                        │
│                 │  ├─ Board tab      (uses DndContext)                      │
│                 │  │  └─ 4 BoardColumn + N BoardCard (useDraggable)         │
│                 │  ├─ List tab       (TanStack Table)                       │
│                 │  ├─ Timeline tab   (Custom SVG Gantt — ours)              │
│                 │  ├─ Calendar tab   (Custom 6×7 grid)                      │
│                 │  ├─ Activity stub                                         │
│                 │  ├─ Lifecycle stub                                        │
│                 │  ├─ Members tab                                           │
│                 │  └─ Settings tab (sub-tabs)                               │
│                 └─ BacklogPanel (uses same DndContext — cross-container)    │
│                                                                             │
│              /projects/[id]/tasks/[taskId]/page.tsx                         │
│              Task Detail                                                    │
│                 ├─ Parent-task-link (if subtask)                            │
│                 ├─ DescriptionEditor (plain / TipTap Rich via dynamic())    │
│                 ├─ Sub-tasks list                                           │
│                 ├─ Comments + @mention                                      │
│                 ├─ Audit log (Geçmiş)                                       │
│                 ├─ Attachments (drag-drop zone)                             │
│                 └─ PropertiesSidebar (InlineEdit wrappers)                  │
│                    └─ PhaseStepper (when enable_phase_assignment=true)      │
└────────────────────────────────────────────────────────────────────────────┘
                          ↓ HTTP (axios + interceptors)
┌────────────────────────────────────────────────────────────────────────────┐
│ BACKEND FastAPI (Clean Architecture, existing + 1 new slice)                │
│                                                                             │
│  API Layer (app/api/v1/)                                                    │
│   ├─ tasks.py              (existing — /tasks/*)                            │
│   ├─ projects.py           (existing — /projects/*)                         │
│   ├─ sprints.py            (existing — cycles for Scrum)                    │
│   ├─ comments.py           (existing)                                       │
│   ├─ attachments.py        (existing)                                       │
│   ├─ notifications.py      (existing — watcher toggles emit)                │
│   └─ labels.py             ← NEW Phase 11                                   │
│                                                                             │
│  Application Layer (app/application/)                                       │
│   └─ use_cases/                                                             │
│       ├─ manage_tasks.py   (existing — Create/Update/Delete/Get)            │
│       ├─ manage_comments.py                                                 │
│       └─ manage_labels.py  ← NEW                                            │
│                                                                             │
│  Domain Layer (app/domain/)                                                 │
│   ├─ entities/{task, project, user, label (NEW)}.py                         │
│   └─ repositories/{task, project, ..., label (NEW)}.py (ABCs)               │
│                                                                             │
│  Infrastructure Layer (app/infrastructure/)                                 │
│   ├─ database/models/label.py         (ALREADY EXISTS — just need ORM)      │
│   └─ database/repositories/label_repo.py  ← NEW (SQLAlchemy impl)           │
└────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure for Phase 11 Additions

```
Frontend2/
├── app/
│   ├── layout.tsx                  # + TaskModalProvider slot (if we choose root)
│   └── (shell)/
│       ├── layout.tsx              # + TaskModalProvider here (recommended)
│       └── projects/
│           ├── page.tsx            # + permission-gated Yeni Proje button (D-08)
│           └── [id]/
│               ├── page.tsx        # REPLACES placeholder with 8-tab layout
│               └── tasks/
│                   └── [taskId]/
│                       └── page.tsx   # NEW — Task Detail
│
├── components/
│   ├── task-modal/
│   │   ├── task-create-modal.tsx
│   │   ├── task-modal-provider.tsx
│   │   └── use-task-modal.ts
│   ├── project-detail/
│   │   ├── project-detail-shell.tsx
│   │   ├── board-tab.tsx
│   │   ├── board-column.tsx
│   │   ├── board-card.tsx
│   │   ├── list-tab.tsx
│   │   ├── timeline-tab.tsx           # Custom SVG Gantt
│   │   ├── calendar-view.tsx
│   │   ├── members-tab.tsx
│   │   ├── settings-tab.tsx
│   │   ├── backlog-panel.tsx
│   │   ├── backlog-toggle.tsx
│   │   └── project-detail-context.tsx
│   ├── task-detail/
│   │   ├── properties-sidebar.tsx
│   │   ├── inline-edit.tsx
│   │   ├── description-editor.tsx         # Plain/Rich toggle router
│   │   ├── description-editor-rich.tsx    # TipTap — dynamic import target
│   │   ├── description-toolbar.tsx
│   │   ├── sub-tasks-list.tsx
│   │   ├── comments-section.tsx
│   │   ├── history-section.tsx
│   │   ├── attachments-section.tsx
│   │   ├── dependencies-section.tsx
│   │   ├── parent-task-link.tsx
│   │   └── phase-stepper.tsx
│   ├── my-tasks/
│   │   ├── my-tasks-experience.tsx
│   │   ├── saved-views-tabs.tsx
│   │   ├── task-filter-bar.tsx
│   │   ├── task-group-list.tsx
│   │   └── task-row.tsx
│   └── header/
│       ├── create-button.tsx              # Wires to openTaskModal
│       └── search-autocomplete.tsx        # Cmd/Ctrl+K
│
├── services/
│   ├── task-service.ts                    # NEW
│   ├── label-service.ts                   # NEW
│   ├── comment-service.ts                 # NEW
│   └── attachment-service.ts              # NEW
│
├── hooks/
│   ├── use-tasks.ts                       # NEW
│   ├── use-task-detail.ts                 # NEW
│   ├── use-backlog.ts                     # NEW
│   ├── use-labels.ts                      # NEW
│   ├── use-watchers.ts                    # NEW
│   └── use-my-tasks-store.ts              # NEW — localStorage persistence
│
└── lib/
    ├── methodology-matrix.ts              # NEW — D-16 / D-42 single source
    ├── label-color.ts                     # NEW — hash → oklch derivation
    ├── audit-formatter.ts                 # NEW — audit-log row → Turkish string
    ├── dnd/
    │   ├── dnd-provider.tsx
    │   └── board-dnd.ts                   # onDragEnd handler
    └── my-tasks/
        ├── smart-sort.ts
        └── due-bucket.ts
```

## Code Examples

### Cross-Container DnD Provider (D-13, D-19)

```tsx
// Frontend2/lib/dnd/dnd-provider.tsx
"use client"
import * as React from "react"
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import type { Task } from "@/services/task-service"
import { BoardCardGhost } from "@/components/project-detail/board-card"

interface ProjectDnDProviderProps {
  projectId: number
  onTaskDropped: (taskId: number, sourceColumnId: string, targetColumnId: string) => void
  children: React.ReactNode
}

export function ProjectDnDProvider({ projectId, onTaskDropped, children }: ProjectDnDProviderProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(event.active.data.current?.task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return
    const sourceColumnId = active.data.current?.columnId as string
    const targetColumnId = over.data.current?.columnId as string
    if (!targetColumnId || sourceColumnId === targetColumnId) return
    onTaskDropped(Number(active.id), sourceColumnId, targetColumnId)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {activeTask && <BoardCardGhost task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
```

### Optimistic Inline Edit Pattern (D-38)

```tsx
// Frontend2/components/task-detail/inline-edit.tsx
"use client"
import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"
import { showToast } from "@/components/toast"
import { useApp } from "@/context/app-context"

interface InlineEditProps<V> {
  taskId: number
  field: string
  value: V
  renderDisplay: (v: V) => React.ReactNode
  renderEditor: (v: V, setV: (nv: V) => void, commit: () => void, cancel: () => void) => React.ReactNode
  disabled?: boolean
}

export function InlineEdit<V>({ taskId, field, value, renderDisplay, renderEditor, disabled }: InlineEditProps<V>) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<V>(value)
  const qc = useQueryClient()
  const lang = useApp().language

  // Optimistic update via cache write
  const mutate = useMutation({
    mutationFn: (newVal: V) => taskService.patchField(taskId, field, newVal),
    onMutate: async (newVal) => {
      await qc.cancelQueries({ queryKey: ['tasks', taskId] })
      const prev = qc.getQueryData(['tasks', taskId])
      qc.setQueryData(['tasks', taskId], (old: any) => old ? { ...old, [field]: newVal } : old)
      return { prev }
    },
    onError: (_err, _newVal, ctx) => {
      qc.setQueryData(['tasks', taskId], ctx?.prev)
      showToast({
        variant: "error",
        message: lang === "tr" ? "Kaydedilemedi. Lütfen tekrar deneyin." : "Failed to save.",
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
  })

  if (!editing) {
    return (
      <button
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        style={{
          background: "transparent", border: "none", padding: 0,
          cursor: disabled ? "default" : "pointer",
          color: "var(--fg)",
          textAlign: "left",
        }}>
        {renderDisplay(value)}
      </button>
    )
  }

  function commit() {
    if (draft !== value) mutate.mutate(draft)
    setEditing(false)
  }
  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div style={{
      outline: "2px solid var(--ring)",
      outlineOffset: 1,
      borderRadius: 4,
    }}>
      {renderEditor(draft, setDraft, commit, cancel)}
    </div>
  )
}
```

## Common Pitfalls

### Pitfall 1: Next.js 16 async params/searchParams
**What goes wrong:** Writing a server page `export default function Page({ params }) { const { id } = params; ... }` throws at runtime in Next.js 16.
**Why it happens:** `params` and `searchParams` are now Promises. Breaking change from 15 → 16.
**How to avoid:** Either use `"use client"` + `useParams()` (as `Frontend2/app/(shell)/projects/[id]/page.tsx` does today), OR use async Page: `export default async function Page(props: PageProps<'/path'>) { const { id } = await props.params; ... }`.
**Warning signs:** TypeScript error "params is Promise"; runtime error "params is not a plain object".

### Pitfall 2: TipTap SSR hydration mismatch
**What goes wrong:** Rich editor renders on server with initial content, client re-hydrates, React throws "Hydration mismatch".
**Why it happens:** TipTap/ProseMirror reads `window`, generates different DOM server vs client.
**How to avoid:** ALWAYS both: (1) wrap TipTap component in `dynamic(() => import(...), { ssr: false })`, AND (2) pass `immediatelyRender: false` to `useEditor`.
**Warning signs:** Console error "Hydration failed because the server rendered HTML didn't match the client."

### Pitfall 3: @dnd-kit PointerSensor without activation constraint
**What goes wrong:** Every mousedown on a board card triggers a drag, consuming click navigation.
**Why it happens:** Default PointerSensor activates immediately.
**How to avoid:** `useSensor(PointerSensor, { activationConstraint: { distance: 8 } })` — drag activates only after 8px pointer movement, letting clicks pass through (per D-23 click = navigate to detail).
**Warning signs:** User reports "can't click cards, everything tries to drag."

### Pitfall 4: QueryClient re-created per render
**What goes wrong:** React Query cache loses data on every ShellLayout re-render.
**Why it happens:** `const queryClient = new QueryClient()` inside the component body.
**How to avoid:** Module-scope constant — **already correctly done in Frontend2/app/(shell)/layout.tsx line 9** per Phase 10 Pitfall 2. Preserve this pattern for TaskModalProvider and DnDProvider; any state they initialize must be refs or module-scope.
**Warning signs:** Cards flash skeleton on every tab switch.

### Pitfall 5: localStorage writes fire on every keystroke
**What goes wrong:** Scroll-zoom calendar writes `spms.calendar.zoom.{projectId}` to localStorage 60+ times/second during scroll.
**Why it happens:** Naive `onWheel` → `localStorage.setItem` direct wire.
**How to avoid:** Debounce localStorage writes with 300ms timeout. State updates happen real-time (React state), but localStorage writes are debounced.
**Warning signs:** Devtools Storage panel flickers during scroll; main-thread cost during zoom.

### Pitfall 6: Optimistic update rollback leaves stale UI
**What goes wrong:** PATCH fails, `onError` calls `setQueryData(prev)`, but the next `invalidateQueries` fetches fresh data overwriting the rollback with server truth — which might differ from the user's view.
**Why it happens:** Rollback + invalidate race.
**How to avoid:** `onSettled` (runs after both success and error) always invalidates. `onError` uses captured `ctx.prev` for the rollback snapshot. Documented by TanStack Query `[CITED: https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates]`.
**Warning signs:** Value flickers during error: shows rolled-back value, then shows current server value — user confused.

### Pitfall 7: Label auto-create race
**What goes wrong:** User types "Bug" label, frontend doesn't find existing match (newly joined project), fires POST /labels. Backend returns 409 because another user in the same project just created "Bug" at the same moment.
**Why it happens:** Normal concurrent editing.
**How to avoid:** Frontend handles 409 gracefully: re-fetch labels, find the now-existing one by name, use its id. Show no error toast.
**Warning signs:** Users report "my label didn't save" error toasts during busy collaboration.

### Pitfall 8: WIP check miscounted (self-inclusion)
**What goes wrong:** User drags a card within the same column (reorder); WIP check fires for target column + 1, even though count shouldn't change.
**Why it happens:** `newLength = current + 1` assumes new arrival; but same-column reorder has same length.
**How to avoid:** Early-return when `sourceColumnId === targetColumnId` — the current `onDragEnd` skeleton in §2 already does this.
**Warning signs:** Fake WIP warning on same-column reorder.

### Pitfall 9: TipTap image extension not in starter-kit
**What goes wrong:** Toolbar shows "Image" button, but clicking does nothing, and JSX `<img>` in content gets stripped.
**Why it happens:** `Image` node is NOT in `@tiptap/starter-kit` v3. Needs separate `@tiptap/extension-image` install + `extensions: [StarterKit, Image]` array.
**How to avoid:** Install `@tiptap/extension-image@3.22.4` (the extra install listed in §Versions).
**Warning signs:** Image toolbar button is a no-op.

### Pitfall 10: CLAUDE.md dependency inversion violation in labels use case
**What goes wrong:** `manage_labels.py` directly imports `from app.infrastructure.database.models.label import LabelModel`, breaking the Dependency Rule.
**Why it happens:** Easy to write when the ORM is sitting right there.
**How to avoid:** Use case imports ONLY from `app.domain.*`. The `ILabelRepository` abstraction hides SQLAlchemy. Verified at PR review per CLAUDE.md section 4.2 rule: "The application folder must NEVER contain `import sqlalchemy` or `import app.infrastructure`."
**Warning signs:** Unit-testing the use case in isolation fails because it needs a DB connection.

## Runtime State Inventory

*Not applicable — Phase 11 is greenfield feature work (new files and new vertical slices). It does NOT rename or refactor existing code. Section omitted per researcher protocol.*

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build | `[VERIFIED: prior phases run successfully]` | 20+ expected (Next 16 requires 20.9+) | — |
| npm | Package installs | ✓ | already in use | — |
| PostgreSQL | Backend label storage | ✓ (from Phase 9) | — | — |
| @dnd-kit/core | Drag-drop | ✗ (not installed yet) | — | Install as part of Wave 0 |
| @tiptap/* | Rich editor | ✗ | — | Install as part of Wave 0 |
| @tanstack/react-table | List tab | ✗ | — | Install as part of Wave 0 |
| vitest | Unit tests | ✗ | — | Install as part of Wave 0 setup |
| @playwright/test | E2E tests | ✗ | — | Install as part of Wave 0 setup |

**Missing dependencies with no fallback:** None blocking — all deferred to Wave 0 installs.

**Missing dependencies with fallback:** None.

## Security Domain

Phase 11 is primarily UI + a small labels CRUD. Security surface is narrow but non-zero:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (indirectly) | Reuse existing JWT auth from Phase 10; no new auth code |
| V3 Session Management | yes (indirectly) | Reuse existing — no change |
| V4 Access Control | yes | Labels endpoint must check project membership — use existing `get_project_member` dependency |
| V5 Input Validation | yes | Pydantic DTOs (LabelCreateDTO) with Field constraints (min_length, max_length); TipTap HTML should be sanitized on render (NOT on save) — or use TipTap's built-in sanitizer via `htmlAttributes` |
| V6 Cryptography | no | No new crypto |
| V11 Business Logic | yes | WIP soft limit is business logic; audit-log writes on every task PATCH |
| V14 Configuration | yes | CORS, CSP inherited from existing backend config |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via TipTap rich text HTML | Tampering | TipTap generates well-formed HTML from a closed schema; when rendering saved descriptions, render through `<div dangerouslySetInnerHTML>` but run through DOMPurify first OR use TipTap read-only editor to render. Recommendation: read-only TipTap editor for render — no dangerouslySetInnerHTML needed. |
| @mention stored XSS | Tampering | Mention dropdown writes `<span class="mention" data-user-id="X">@Name</span>` — user-controlled input only in the visible `@Name` text, which is rendered as HTML. Sanitize `@Name` via DOMPurify or restrict to alphanumeric+space via server-side validation on comment submit. |
| CSRF on state-changing requests | Repudiation / Tampering | Existing JWT auth + same-site cookie guidance from prior phases |
| SQL injection on labels query | Tampering | SQLAlchemy ORM with parameterized queries — inherent to `select().where(col == value)` pattern |
| Authz bypass on cross-project task access | Elevation of Privilege | `get_project_member` dependency already enforces project membership on /tasks; labels endpoint must reuse same dependency per CLAUDE.md / existing pattern |
| DoS via giant description | DoS | Max 50k chars soft limit on `task.description` — document, enforce at DTO level |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@tiptap/starter-kit@3.22.4` includes Underline and Link (the UI-SPEC needs both) | TipTap Rich Editor | If wrong, install fails or toolbar broken. `[VERIFIED: npm view @tiptap/starter-kit dependencies]` shows extension-underline and extension-link in deps. Risk = low. |
| A2 | TipTap `immediatelyRender: false` + `dynamic({ ssr: false })` is the correct Next.js 16 pattern | TipTap SSR | `[CITED: TipTap official Next.js docs April 2026]`. If wrong: hydration errors. Mitigate by running a smoke test in Wave 0. |
| A3 | Custom SVG Gantt at ~250 LOC can deliver UI-SPEC §16 read-mode contract | Gantt Library Selection | If underestimated: Timeline tab takes longer than planned. Mitigate by scoping timeline as its own plan and deferring drag-to-reschedule. |
| A4 | The 200-task MyTasks threshold doesn't need virtualization | Performance | If wrong: sluggish scroll. Mitigate by adding @tanstack/react-virtual later — drop-in. |
| A5 | Labels 409 conflict handling (auto-create race) is a rare case | Common Pitfalls #7 | Untested assumption; handle gracefully regardless. |
| A6 | Bundle size estimates (~150-200 KB gz for TipTap) are in the right order of magnitude | Bundle Size Budget | `[CITED: bundlephobia search result]` — precise numbers not fetched from Bundlephobia. Plan should verify with `next build --analyze` when TipTap is integrated. |
| A7 | Audit log endpoint returns the flat shape and does NOT include user_name | Audit Log Shape | `[VERIFIED: Backend/app/infrastructure/database/repositories/audit_repo.py]` confirms. Frontend must resolve user_id client-side. |
| A8 | `enable_phase_assignment` default `false` normalizer is already in place backend-side | Phase Assignment Gating | `[VERIFIED: grep -n "enable_phase_assignment" Backend/app/domain/entities/project.py]` line 38 sets default. |
| A9 | `@dnd-kit/react@0.4.0` is too fresh to rely on | dnd-kit version choice | Published 2026-04-19, 3 days before research. Migration guide exists but no stability claims. Safer to stay on @dnd-kit/core 6.3.1. |
| A10 | Custom SVG Gantt is a pragmatic choice given license+React-19 constraints | Gantt Library Selection | If Gantt scope expands (e.g., need complex drag-to-reschedule with snap, or dependency arrows with routing), custom implementation can become costly. Plan should revisit if timeline v1 reveals we need a commercial Gantt; SVAR PRO commercial license is an explicit fallback. |

**Status:** Core library choices verified HIGH. Gantt recommendation is LOW-risk given UI-SPEC's modest scope (read + view toggle; drag + arrows deferred).

## Open Questions for Planner

1. **TipTap toolbar — exact grouping and separators.** UI-SPEC §7 lists the icons but doesn't mandate exact grouping. Recommend: [Bold, Italic, Underline, Strike] | [H1, H2, H3] | [Bullet, Ordered, Blockquote] | [Code, CodeBlock] | [Link, Image, HR]. Planner decides final order.

2. **Comment @mention server-side vs client-side user resolution.** Do we POST the rendered HTML with `<span class="mention" data-user-id="X">@Name</span>` (frontend-rendered), or do we POST structured JSON like `{body_template: "hey @user:5 please check"}` and render server-side? Recommendation: client-renders HTML, server stores HTML — simpler, matches existing comment body storage. Planner confirms.

3. **TipTap output sanitization on render.** Phase 11 plan should either (a) render saved descriptions through a read-only TipTap editor (no XSS risk because TipTap only produces schema-valid HTML), OR (b) render via `dangerouslySetInnerHTML` + DOMPurify. Recommendation: (a) — read-only TipTap. Zero new dependencies.

4. **Attachment file size limit.** UI-SPEC doesn't specify max upload size. Backend `attachments.py` likely has a limit. Planner should verify and surface it in the UI (helper text: "Max 10MB").

5. **Custom Gantt drag-to-reschedule scope.** D-28 says "if library supports it cleanly, include; otherwise defer." For a custom Gantt, "cleanly" means ~50-100 LOC of drag handler + PATCH wiring. Planner decides: include in v1 or defer to follow-up.

6. **Header search — cross-project behavior.** D-50 says projects + tasks in parallel. Should the task search be project-scoped when user is on `/projects/{id}`, or always global? Recommendation: always global (search for "login" across all projects user has access to) — matches Linear/Notion.

7. **TaskModalContext provider placement.** Shell layout vs root layout. Recommendation (per §Provider Tree Ordering): shell layout, inside QueryClientProvider. Planner confirms.

8. **Kanban column "Backlog" for D-16 Kanban branch.** Is the leftmost column always called "Backlog", or is the user configuring which column id counts as backlog? Need clarification — but D-17 introduces `project.process_config.backlog_definition` which handles this. Recommend: store `"kanban_first_column_id"` in process_config when Kanban is chosen at project creation time.

9. **Testing ENG budget.** If the planner scopes all E2E tests in-phase, E2E setup + 4 happy-path scenarios ≈ 1 full plan. Planner decides: include in Phase 11 or defer most E2Es to Phase 11.5 / 13?

10. **Mobile tap targets below 1024px.** UI-SPEC D-54 says tabs become horizontally scrollable. But the 44px tap target guarantee for buttons (WCAG 2.5.5) should be preserved. Planner confirms per-component tap target compliance.

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: npm registry]` — Library versions and peer dependencies retrieved 2026-04-22 via `npm view`:
  - `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/modifiers@9.0.0`, `@dnd-kit/utilities@3.2.2`
  - `@tiptap/react@3.22.4`, `@tiptap/starter-kit@3.22.4`, `@tiptap/extension-image@3.22.4`
  - `@tanstack/react-table@8.21.3`, `@tanstack/react-query@5.99.2`, `@tanstack/react-virtual@3.13.24`
  - `wx-react-gantt@1.3.1` (GPLv3), `frappe-gantt@1.2.2` (MIT but vanilla), `gantt-task-react@0.3.9` (stale 2022)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — async params/searchParams; verified from local `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- [Next.js 16 Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — local file
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) — local file
- [TipTap Next.js Integration Guide](https://tiptap.dev/docs/editor/getting-started/install/nextjs) — canonical SSR pattern
- [TipTap React Integration](https://tiptap.dev/docs/editor/getting-started/install/react) — useEditor API
- [TipTap StarterKit Extensions List](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — confirms Underline + Link included
- [TipTap Issue #5856 — immediatelyRender SSR](https://github.com/ueberdosis/tiptap/issues/5856)
- [TanStack Table v8 Docs](https://tanstack.com/table/v8/docs/introduction) — headless design
- [TanStack Table v8 Column Defs](https://tanstack.com/table/v8/docs/guide/column-defs)
- `[VERIFIED: Backend/app/infrastructure/database/repositories/audit_repo.py]` — audit log response shape
- `[VERIFIED: Backend/app/infrastructure/database/models/label.py]` — Label table exists; entity/repo/router missing
- `[VERIFIED: Backend/app/domain/entities/project.py:38]` — `enable_phase_assignment` default false normalizer

### Secondary (MEDIUM confidence)

- [SVAR Gantt License Page](https://svar.dev/licenses/) — GPLv3 open-source, commercial PRO edition
- [SVAR React Gantt Pricing](https://svar.dev/react/gantt/pricing/) — PRO licensing tiers
- [dnd-kit Migration Guide React](https://dndkit.com/react/guides/migration/) — existence of @dnd-kit/react
- [dnd-kit Discussion #1842](https://github.com/clauderic/dnd-kit/discussions/1842) — roadmap question (unanswered)
- [Kanban with dnd-kit — Chetan Verma blog](https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit) — cross-container pattern reference
- [Best JavaScript Gantt Chart Libraries 2025-2026 (AnyChart)](https://www.anychart.com/blog/2025/11/05/best-javascript-gantt-chart-libraries/) — landscape overview
- [Bundlephobia @tiptap/starter-kit](https://bundlephobia.com/package/@tiptap/starter-kit) — referenced but exact KB not fetched
- [Bundlephobia @dnd-kit/core](https://bundlephobia.com/package/@dnd-kit/core) — referenced but exact KB not fetched

### Tertiary (LOW confidence)

- Web search general guidance on optimizePackageImports, @tanstack/react-table styling strategies — cross-reference only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions and peer deps verified via npm registry on 2026-04-22
- Architecture patterns: HIGH — patterns established in Phase 10 are reapplied; CLAUDE.md + STATE.md provide the backend rules
- Pitfalls: HIGH — known Next.js 16 + React 19 + TipTap + dnd-kit gotchas verified against official docs and GitHub issues
- Gantt selection: MEDIUM-HIGH — logic is sound (license + React 19 compat problems are HIGH confidence), but custom-build LOC estimate is a planning assumption
- Backend labels slice: HIGH — Clean Architecture scaffold matches Phase 9 conventions exactly

**Research date:** 2026-04-22
**Valid until:** ~2026-06-22 (60 days; Next.js/React ecosystem moves fast; re-verify npm versions and TipTap breaking changes at that point)

## RESEARCH COMPLETE
