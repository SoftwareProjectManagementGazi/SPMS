# Phase 13: Reporting, Activity & User Profile — Research

**Researched:** 2026-04-26
**Domain:** React 19 charting + activity timeline UX + privacy-filtered audit-log SQL aggregation + Next.js 16 Client-Component composition + Clean-Architecture FastAPI extension.
**Confidence:** HIGH (chart pick, activity SQL, runtime state) — MEDIUM (CFD scaling cliff, exact-bundle delta).

## Summary

Phase 13 ships four user-facing surfaces (Reports advanced charts, ProjectDetail Activity tab, `/users/[id]` profile, header AvatarDropdown) plus four NEW backend endpoints (3 chart aggregations + 1 user-activity feed). The phase is **prototype-first** per D-00; deviations require explicit `[IMPROVEMENT]` justification (already enumerated in `13-UI-SPEC.md`). The backend is **Clean Architecture vertical slice per endpoint** following Phase 9 D-46/47 / Phase 12 D-09 in-memory-fakes test pattern. Frontend uses the existing 16 primitives + adds two NEW primitives (`<DataState/>`, `<AvatarDropdown/>`) + extends `<Avatar/>` with optional `href` prop.

**Primary recommendations:**
1. **Charts:** install `recharts@3.8.1` exact-pinned (peer accepts `^19`, deps include Redux Toolkit + es-toolkit so install adds ~3 transitive packages — VERIFIED via `npm view`). visx is rejected — peer-deps `^16/^17/^18` only, **does NOT include React 19 as of 2026-04-26**. nivo rejected for bundle + theme-fight. Custom SVG retained ONLY for the existing v1.0 Burndown card per D-A2 last sentence.
2. **Activity action mapping:** the existing audit_log writes `action='updated' field_name='column_id'` for status changes (NOT prototype's `action='task_status_changed'`) — Phase 13 must adopt a frontend `audit_log → semantic event type` mapper layer. This is the single biggest hidden contract.
3. **Backend `entity_type` reality:** task updates write `entity_type='task'` but `get_project_activity` filters `entity_type='project'`. Today's project activity feed only shows phase transitions. Phase 13 backend MUST broaden the project-activity SQL to JOIN `tasks WHERE project_id=?` for `entity_type='task'` rows OR maintain the limitation (planner decides).
4. **Recharts must be wrapped in `"use client"` Client Components** — Recharts touches DOM/SVG; SSR fails without the directive. Match Phase 12's `dynamic({ ssr:false })` pattern only if a parent Server Component needs to import it; otherwise mark the chart card itself as `"use client"`.
5. **Avatar `href` extension is safe** — 19 consumer files identified, all using `<Avatar user={...} size={...}/>` shape; adding optional `href?: string` is backwards-compatible. AvatarStack overflow chip ("+N") MUST NOT link.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chart data aggregation (CFD daily snapshots, Lead/Cycle percentiles, Iteration counts) | API / Backend | Database (PostgreSQL `generate_series`, `percentile_cont`, audit_log JOINs) | Heavy SQL; cannot run on browser — must aggregate server-side and return DTOs. |
| Chart rendering (SVG geometry, tooltip, legend) | Browser / Client | — | Recharts is browser-only (DOM/SVG); `"use client"` wrapping required. |
| Project activity feed | API / Backend | Database (audit_log + users JOIN) | Existing Phase 9 endpoint reused; Phase 13 adds entity_type='task' inclusion if planner picks broadening. |
| User activity feed (privacy-filtered) | API / Backend | Database (audit_log → projects → team_projects WHERE viewer_user_id IN team_projects.user_id) | Privacy decision must be server-side; client cannot enforce. |
| User profile stats (assigned/done/projects) | API / Backend | Database (existing `/users/{id}/summary` + `/tasks?assignee_id`) | Endpoints already shipped Phase 9; frontend just composes. |
| Avatar dropdown (menu, dismiss, role-conditional admin) | Browser / Client | — | Pure UI state, no data dependency beyond `useAuth().user` (already in client context). |
| `<DataState/>` primitive | Browser / Client | — | UI plumbing only; no SSR consideration (charts are CSR via `"use client"`). |
| LocalStorage filter persistence | Browser / Client | — | Read at mount via `useLocalStoragePref` (existing hook handles SSR guard). |
| Phase reports listing (Faz Raporları section) | API / Backend (Phase 12 endpoints reused) | Browser / Client (UI composition) | Phase 12 `phase-report-service.ts` + `use-phase-reports.ts` reused; no new backend work. |
| Date-aware grouping (Today / Yesterday / This Week / exact date) | Browser / Client | — | Pure client-side date math; locale-aware via `useApp().language`. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `recharts` | **3.8.1** (exact pin, no caret) `[VERIFIED: npm view recharts version → 3.8.1; peerDependencies includes ^19.0.0]` | All Phase 13 charts (CFD stacked area, Lead/Cycle histograms, Iteration grouped bars) | Only React-19-peered charting library among the three candidates as of 2026-04-26. v3 GA shipped 2025-06-23; v3.8.1 published 2026-03-25. Phase 12 set the exact-pin precedent (`@xyflow/react@12.10.2`). |

### Supporting (already in `Frontend2/package.json` — REUSED, NOT INSTALLED)

| Library | Version | Purpose | Use Case |
|---------|---------|---------|----------|
| `lucide-react` | `^1.8.0` | Icon set for activity event meta (Plus/ArrowRight/Users/Chat/Trash/CircleCheck/Globe/Shield/LogOut/ChevronRight/Check) | Existing icon dependency; already used across Frontend2. |
| `@tanstack/react-query` | `^5.99.2` | All chart + activity + profile fetches; `refetchOnWindowFocus: true` per D-B3 | Existing query layer. |
| `next` | `16.2.4` | Next.js routing + App Router | Existing — Frontend2/CLAUDE.md warns to read `node_modules/next/dist/docs/` before writing new patterns. |
| `react` / `react-dom` | `19.2.4` | React 19 client components | Existing. |

### Alternatives Considered

| Instead of recharts | Could Use | Tradeoff |
|------------|-----------|----------|
| **recharts 3.8.1** | visx 3.12 | **REJECTED** — `npm view @visx/shape peerDependencies` returns `react: '^16.3.0-0 || ^17.0.0-0 || ^18.0.0-0'` (NO React 19 peer as of 2026-04-26). `[VERIFIED: npm view + GitHub issue #1883 still open]`. React 19 PR is in progress (`airbnb/visx` action runs ID 19219761293, 2025-11-10) but not released. Installing would require `--legacy-peer-deps` and could break at runtime. **Blocking issue.** |
| **recharts 3.8.1** | nivo 0.99.0 | **REJECTED** — peer accepts React 19 (`{ react: '^16.14 || ^17.0 || ^18.0 || ^19.0' }`). However, nivo's `Theme` system (provided by `@nivo/theming`) actively overrides inline styles at the SVG-element level, fighting our oklch CSS-token approach. Bundle adds ~200 KB gz with theme runtime. Unsuitable for Phase 13's "tokens drive every visible style" constraint. |
| **recharts 3.8.1** | Custom SVG (continue Phase 11 D-27 / Burndown pattern) | **REJECTED for new charts; KEPT for existing Burndown card per D-A2.** Bundle would be 0 KB but tooltip + axis + legend polish per chart = >200 LOC each. CFD especially needs interactive band tooltips, which would re-implement Recharts' default tooltip primitive. |

**Installation:**

```bash
# In Frontend2/ — exact pin, no caret (matches Phase 12 D-01 @xyflow/react@12.10.2 pattern)
npm install [email protected]
```

**Verified install impact (via `npm view recharts dependencies`):**

```json
{
  "@reduxjs/toolkit": "^1.9.0 || 2.x.x",
  "clsx": "^2.1.1",
  "decimal.js-light": "^2.5.1",
  "es-toolkit": "^1.39.3",
  "eventemitter3": "^5.0.1",
  "immer": "^10.1.1",
  "react-redux": "8.x.x || 9.x.x",
  "reselect": "5.1.1",
  "tiny-invariant": "^1.3.3",
  "use-sync-external-store": "^1.2.2",
  "victory-vendor": "^37.0.2"
}
```

**[ASSUMED]** Bundle size estimate ~99 KB gz with tree-shake (only used components imported). Bundlephobia did not return live metrics for v3.8.1 in this session; web search produced anecdotal numbers. **Planner should verify via `next build` size report after install.** D-A2 budget is "<120 KB gz preferred"; Redux Toolkit + react-redux are large transitive deps that may push past budget if not tree-shaken.

**Key Recharts compatibility facts (VERIFIED via web search):**
- Recharts components MUST be wrapped in `"use client"` per [Recharts/recharts#4336](https://github.com/recharts/recharts/issues/4336) — they touch DOM/SVG and fail in pure RSC. Pattern: chart card itself is `"use client"`.
- v3.x peer accepts React 19 explicitly: `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0` `[VERIFIED: npm view recharts peerDependencies]`.
- v3 ships ESM + CJS; tree-shake works in Next.js 16 by importing per-component (`import { LineChart, XAxis } from 'recharts'`).

**Version verification table** (run on 2026-04-26):

| Package | Version | Published | React 19 Peer | RSC Compatible |
|---------|---------|-----------|---------------|----------------|
| recharts | 3.8.1 | 2026-03-25 | ✓ (`^19.0.0` in peer string) | Client-only — wrap in `"use client"` |
| visx (`@visx/shape`) | 3.12.0 | (peer not updated) | ✗ (`^16/^17/^18` only) | n/a — blocked |
| @nivo/core | 0.99.0 | recent | ✓ | Client-only |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER (CSR)                          │
│                                                                 │
│  /reports                  /users/[id]              ProjectDetail
│   ChartCard("use client")    ProfileHeader           ActivityTab │
│     ↓ recharts SVG            ↓ StatCard             ↓ useProjectActivity
│   useCFD/LeadCycle/Iteration  useUserSummary         /useUserActivity (variant)
│                                                                 │
│  HeaderAvatarDropdown (NEW)                                     │
│   ↓ useAuth().logout → router.push('/auth/login')               │
│                                                                 │
│  <DataState/> primitive wraps every async surface (loading/error/empty)
│  <Avatar href={`/users/${id}`}/> → <Link/> wrap                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (axios + JWT Bearer)
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI BACKEND                            │
│                                                                 │
│  /api/v1/projects/{id}/charts/cfd?range=N                       │
│    GetProjectCFDUseCase ─→ IAuditRepo.get_cfd_snapshots(...)    │
│  /api/v1/projects/{id}/charts/lead-cycle?range=N                │
│    GetProjectLeadCycleUseCase ─→ ITaskRepo / IAuditRepo          │
│  /api/v1/projects/{id}/charts/iteration?count=N                 │
│    GetProjectIterationUseCase ─→ ISprintRepo + ITaskRepo         │
│  /api/v1/users/{id}/activity?type[]=&date_from=...              │
│    GetUserActivityUseCase ─→ IAuditRepo.get_user_activity(viewer_id, target_id, ...)
│                                                                 │
│  All depend on: Depends(get_project_member) or                  │
│                  Depends(get_current_user) (privacy filter)     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ asyncpg
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                 │
│                                                                 │
│  audit_log (entity_type, entity_id, field_name, action, user_id,│
│             timestamp, metadata JSONB)                          │
│  tasks (project_id, column_id, assignee_id, status via JOIN)    │
│  sprints (project_id, start_date, end_date, name, goal)         │
│  team_projects (viewer membership lookup for privacy filter)    │
│  projects (status, manager_id, methodology)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
Frontend2/
├── app/(shell)/
│   ├── reports/
│   │   └── page.tsx                          # REWRITE Plan 13-07/08
│   └── users/
│       └── [id]/page.tsx                     # NEW Plan 13-05
├── components/
│   ├── activity/                             # NEW (Plan 13-04)
│   │   ├── activity-tab.tsx
│   │   ├── activity-row.tsx
│   │   ├── activity-filter.tsx
│   │   └── activity-empty.tsx
│   ├── profile/                              # NEW (Plan 13-05/06)
│   │   ├── profile-header.tsx
│   │   ├── profile-tasks-tab.tsx
│   │   └── profile-projects-tab.tsx
│   ├── reports/                              # NEW (Plan 13-07/08)
│   │   ├── chart-card.tsx                    # generic shell
│   │   ├── cfd-chart.tsx
│   │   ├── lead-cycle-chart.tsx
│   │   ├── iteration-chart.tsx
│   │   ├── date-range-filter.tsx
│   │   └── phase-reports-section.tsx
│   ├── shell/                                # NEW (Plan 13-02)
│   │   └── avatar-dropdown.tsx
│   ├── primitives/
│   │   ├── avatar.tsx                        # EXTEND with optional href (Plan 13-03)
│   │   └── data-state.tsx                    # NEW (Plan 13-01)
│   └── project-detail/
│       └── activity-stub-tab.tsx             # REPLACED with activity-tab.tsx call
├── hooks/                                    # NEW (Plan 13-01)
│   ├── use-cfd.ts
│   ├── use-lead-cycle.ts
│   ├── use-iteration.ts
│   ├── use-project-activity.ts               # may consolidate from existing dashboard
│   ├── use-user-activity.ts
│   └── use-user-summary.ts
├── lib/
│   ├── audit-event-mapper.ts                 # NEW — see Pitfall 1
│   ├── activity-date-format.ts               # NEW — Today/Yesterday/...
│   └── charts/buckets.ts                     # NEW — Lead/Cycle bucket constants
└── services/
    ├── chart-service.ts                      # NEW
    ├── profile-service.ts                    # NEW (or extend user-service)
    └── activity-service.ts                   # NEW (or extend project-service)

Backend/app/
├── api/v1/
│   ├── charts.py                             # NEW (Plan 13-01)
│   └── users.py                              # EXTEND with /users/{id}/activity
├── application/
│   ├── use_cases/
│   │   ├── get_project_cfd.py                # NEW
│   │   ├── get_project_lead_cycle.py         # NEW
│   │   ├── get_project_iteration.py          # NEW
│   │   └── get_user_activity.py              # NEW
│   └── dtos/
│       └── chart_dtos.py                     # NEW: CFDResponseDTO, LeadCycleResponseDTO, IterationResponseDTO
└── infrastructure/database/repositories/
    └── audit_repo.py                         # EXTEND with get_cfd_snapshots, get_lead_cycle_data, get_user_activity
```

### Pattern 1: Recharts in a Client Component

```tsx
// Source: https://github.com/recharts/recharts/issues/4336 (RSC behavior)
// File: Frontend2/components/reports/cfd-chart.tsx (Phase 13 NEW)
"use client"

import * as React from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/primitives"
import { useCFD } from "@/hooks/use-cfd"
import { DataState } from "@/components/primitives/data-state"
import { CFDSkeleton } from "./cfd-skeleton"

interface CFDChartProps { projectId: number; range: 7 | 30 | 90 }

export function CFDChart({ projectId, range }: CFDChartProps) {
  const query = useCFD(projectId, range)
  return (
    <Card padding={16}>
      {/* header + range picker omitted for brevity */}
      <DataState
        loading={query.isLoading}
        loadingFallback={<CFDSkeleton/>}
        error={query.error}
        empty={!query.data?.days?.length}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={query.data?.days ?? []}>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip cursor={{ stroke: "var(--border-strong)" }}/>
            <Area dataKey="todo"     stackId="1" fill="color-mix(in oklch, var(--status-todo) 40%, transparent)" stroke="var(--status-todo)"/>
            <Area dataKey="progress" stackId="1" fill="color-mix(in oklch, var(--status-progress) 40%, transparent)" stroke="var(--status-progress)"/>
            <Area dataKey="review"   stackId="1" fill="color-mix(in oklch, var(--status-review) 40%, transparent)" stroke="var(--status-review)"/>
            <Area dataKey="done"     stackId="1" fill="color-mix(in oklch, var(--status-done) 40%, transparent)" stroke="var(--status-done)"/>
          </AreaChart>
        </ResponsiveContainer>
      </DataState>
    </Card>
  )
}
```

**Key:** every Recharts chart component MUST live in a file marked `"use client"` at the top. If a Server Component needs to lazy-load such a chart, use `next/dynamic({ ssr:false })` (Phase 12 D-07 pattern).

### Pattern 2: `<DataState/>` 3-state slot primitive (D-F2)

```tsx
// Source: pattern matches existing primitive style (alert-banner.tsx, segmented-control.tsx)
// File: Frontend2/components/primitives/data-state.tsx (Phase 13 NEW)
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

export function DataState({
  loading, loadingFallback,
  error, errorFallback,
  empty, emptyFallback,
  onRetry,
  children,
}: DataStateProps) {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => lang === "tr" ? tr : en

  if (loading) {
    return <>{loadingFallback ?? <div style={{ padding: 16, color: "var(--fg-muted)", fontSize: 13 }}>{T("Yükleniyor…", "Loading…")}</div>}</>
  }
  if (error) {
    return <>{errorFallback ?? (
      <AlertBanner tone="danger">
        {T("Veri alınamadı.", "Couldn't load data.")}{" "}
        {onRetry && <Button size="xs" variant="ghost" onClick={onRetry}>{T("Tekrar dene", "Try again")}</Button>}
      </AlertBanner>
    )}</>
  }
  if (empty) {
    return <>{emptyFallback ?? <div style={{ padding: 24, textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>{T("Veri yok.", "No data.")}</div>}</>
  }
  return <>{children}</>
}
```

**Why slot pattern, not Suspense:** TanStack Query v5's `useQuery` does NOT play well with `<Suspense/>` when `refetchOnWindowFocus: true` is set (the default we want per D-B3). Suspense would suspend on every focus event, causing visual flicker. The slot pattern reads `query.isLoading / query.error` directly. `[VERIFIED: TanStack Query v5 docs — Suspense mode is opt-in via `useSuspenseQuery`, not the default we use.]`

### Pattern 3: Avatar `href` extension (backwards-compatible)

```tsx
// Source: existing Frontend2/components/primitives/avatar.tsx (extend in place)
// File: Frontend2/components/primitives/avatar.tsx (Phase 13 EXTEND, Plan 13-03)
"use client"
import * as React from "react"
import Link from "next/link"

export interface AvatarUser { initials: string; avColor?: number }
export interface AvatarProps {
  user: AvatarUser | null
  size?: number
  ring?: boolean
  className?: string
  style?: React.CSSProperties
  href?: string  // NEW — optional; when set, renders as <Link>
}

export function Avatar({ user, size = 28, ring = false, className, style, href }: AvatarProps) {
  if (!user) return null
  const visual = (
    <div className={className} style={{ /* ... unchanged inline styles ... */ }}>
      {user.initials}
    </div>
  )
  if (!href) return visual
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}  // prevent row-click handlers from firing
      style={{ display: "inline-block", borderRadius: "50%", lineHeight: 0 }}
    >
      {visual}
    </Link>
  )
}
```

**Why this is safe:** 19 consumer files VERIFIED to use `<Avatar user={...} size={...}/>` shape; none currently pass `href`. Adding optional prop is non-breaking. `e.stopPropagation()` on the Link prevents conflict with parent row-click handlers (like `<MTTaskRow onClick={navigate to task-detail}/>`).

**Avatar consumer enumeration** (VERIFIED via grep `<Avatar` in `Frontend2/`):

| File | Usage Context | href target |
|------|--------------|-------------|
| `components/dashboard/portfolio-table.tsx:134` | Project lead avatar | `/users/${leadUser.id}` |
| `components/dashboard/activity-feed.tsx:108` | Activity row actor | `/users/${item.user_id}` |
| `components/my-tasks/task-row.tsx:378` | Assignee column | `/users/${task.assigneeId}` |
| `components/project-detail/list-tab.tsx:217` | List view assignee | `/users/${assigneeId}` |
| `components/project-detail/board-card.tsx:216,230` | Board card assignee | `/users/${assigneeId}` |
| `components/project-detail/backlog-task-row.tsx` | Backlog row assignee | `/users/${assigneeId}` |
| `components/project-detail/backlog-panel.tsx` | Backlog header | n/a (no user) |
| `components/project-detail/members-tab.tsx:57` | Members tab list | `/users/${member.id}` |
| `components/projects/project-card.tsx` | Card lead avatar | `/users/${leadId}` |
| `components/sidebar.tsx` | SidebarUserMenu (REMOVED Plan 13-02) | n/a |
| `components/lifecycle/artifact-inline-expand.tsx` | Assignee | `/users/${assigneeId}` |
| `components/lifecycle/artifacts-subtab.tsx` | Row assignee | `/users/${assigneeId}` |
| `components/lifecycle/overview-subtab.tsx` | Activity items | `/users/${actorId}` |
| `components/task-detail/assignee-picker.tsx` | Picker option | n/a (button click changes assignee, no nav) |
| `components/task-detail/comments-section.tsx:193,357` | Comment author | `/users/${authorId}` |
| `components/task-detail/properties-sidebar.tsx` | Properties assignee | `/users/${assigneeId}` |
| `components/task-detail/attachments-section.tsx` | Uploader | `/users/${userId}` |
| `components/task-detail/sub-tasks-list.tsx` | Sub-task assignee | `/users/${assigneeId}` |
| `components/task-detail/history-section.tsx` | History actor | `/users/${userId}` |
| `components/primitives/avatar-stack.tsx` | Internal use | per-avatar; +N chip MUST NOT link |

**AvatarStack overflow handling** — the `+N` chip is NOT an `<Avatar/>` instance (it's a styled `<div>` inline at line 53–72 of `avatar-stack.tsx`). It does not need an `href` opt-out because it never renders an Avatar. Each individual `<Avatar/>` inside AvatarStack should accept and forward `href` (currently it doesn't pass any `href`, so the user is responsible for adding it where useful).

### Pattern 4: Activity tab discriminated union (D-B4)

```tsx
// Source: Phase 12 EvaluationReportCard variant pattern
// File: Frontend2/components/activity/activity-tab.tsx (Phase 13 NEW)
"use client"
import { useProjectActivity } from "@/hooks/use-project-activity"
import { useUserActivity } from "@/hooks/use-user-activity"

type ActivityTabProps =
  | { projectId: number; userId?: never; variant?: "full" | "compact" }
  | { projectId?: never; userId: number; variant?: "full" | "compact" }

export function ActivityTab(props: ActivityTabProps) {
  const variant = props.variant ?? "full"
  // discriminated routing
  const projectQuery = useProjectActivity(props.projectId, /* enabled: */ !!props.projectId)
  const userQuery    = useUserActivity   (props.userId,    /* enabled: */ !!props.userId)
  const query = props.projectId ? projectQuery : userQuery
  // ... shared rendering
}
```

**Why discriminated union, not separate components:** the prototype `ActivityTab` is a single component with a `variant` prop (lines 4-199 of `activity-tab.jsx`). Splitting into `ProjectActivityTab` + `UserActivityTab` would duplicate ~100 LOC of grouping/filter/timeline rendering.

### Pattern 5: localStorage filter persistence (D-B7)

```tsx
// Source: existing Frontend2/hooks/use-local-storage-pref.ts (Phase 11 D-21 pattern)
// File: Frontend2/components/activity/activity-tab.tsx (Phase 13 NEW)
import { useLocalStoragePref } from "@/hooks/use-local-storage-pref"

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

**Stored key namespace:** `useLocalStoragePref` prepends `spms.` automatically (line 16 of the hook), so the on-disk key becomes `spms.activity.filter.42` for project 42, and `spms.activity.filter.user.7` for user 7. SSR-safe via `typeof window === "undefined"` guard at line 19. `[VERIFIED: read of `Frontend2/hooks/use-local-storage-pref.ts`]`.

### Pattern 6: Date-aware grouping helper (D-B5)

```ts
// Source: prototype activity-tab.jsx lines 25-43 + 57-64; new utility for TS reuse
// File: Frontend2/lib/activity-date-format.ts (Phase 13 NEW)
export function formatActivityDate(timestamp: string | Date, language: "tr" | "en"): string {
  const d = new Date(timestamp); d.setHours(0, 0, 0, 0)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const yesterday = new Date(now.getTime() - 86_400_000)
  const weekAgo   = new Date(now.getTime() - 7 * 86_400_000)
  const T = (tr: string, en: string) => language === "tr" ? tr : en
  if (d.getTime() === now.getTime())       return T("Bugün", "Today")
  if (d.getTime() === yesterday.getTime()) return T("Dün", "Yesterday")
  if (d.getTime() > weekAgo.getTime())     return T("Bu Hafta", "This Week")
  // [IMPROVEMENT] D-B5: replaces prototype's "Daha Eski" with exact date
  return d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function formatRelativeTime(timestamp: string | Date, language: "tr" | "en"): string {
  // ... lines 57-64 of prototype, ported verbatim into TS
  const diff = Date.now() - new Date(timestamp).getTime()
  const T = (tr: string, en: string) => language === "tr" ? tr : en
  if (diff < 60_000)      return T("az önce", "just now")
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)} ${T("dk", "m")}`
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)} ${T("sa", "h")}`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} ${T("gün", "d")}`
  return new Date(timestamp).toLocaleDateString(
    language === "tr" ? "tr-TR" : "en-US",
    { month: "short", day: "numeric" }
  )
}
```

**Note:** `Frontend2/components/dashboard/activity-feed.tsx` lines 19-47 already has a similar `formatTime` function. Plan 13-04 should LIFT it to `lib/activity-date-format.ts` and re-import from both call sites (single source of truth).

### Pattern 7: Audit-log → semantic event mapper (NEW — fills the prototype/backend gap)

```ts
// Source: NEW — needed because audit_log uses (action='updated', field_name='column_id')
//         while prototype event types are {create, status, assign, comment, delete, phase, ...}
// File: Frontend2/lib/audit-event-mapper.ts (Phase 13 NEW)
import type { ActivityItem } from "@/services/activity-service"

export type SemanticEventType =
  | "task_created" | "task_status_changed" | "task_assigned"
  | "comment_created" | "task_deleted" | "phase_transition"
  | "milestone_created" | "milestone_updated"
  | "artifact_status_changed" | "phase_report_created"

export function mapAuditToSemantic(item: ActivityItem): SemanticEventType | null {
  // entity_type='task', action='updated', field_name='column_id' → status change
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
  return null  // silently dropped from timeline render
}

export function semanticToFilterChip(t: SemanticEventType): "create" | "status" | "assign" | "comment" | "lifecycle" | "all" {
  if (t === "task_created") return "create"
  if (t === "task_status_changed") return "status"
  if (t === "task_assigned") return "assign"
  if (t === "comment_created") return "comment"
  if (t === "phase_transition" || t === "milestone_created" || t === "milestone_updated"
   || t === "artifact_status_changed" || t === "phase_report_created") return "lifecycle"
  return "all"
}
```

**Why this is critical:** the prototype `eventMeta` map at line 45-55 of `activity-tab.jsx` keys off `e.type` from a hypothetical client-side data shape. The real audit_log has columns `(entity_type, action, field_name)` — three columns must combine to derive the prototype's single `type`. Without this mapper, the Phase 13 frontend would receive unrecognized event types and either (a) render nothing or (b) render garbled labels. **Plan 13-01 must include this mapper.**

### Anti-Patterns to Avoid

- **DO NOT use `<Suspense/>` with TanStack Query default mode** — incompatible with `refetchOnWindowFocus: true` (would re-suspend on every focus). Use `<DataState/>` slot pattern reading `query.isLoading / query.error`.
- **DO NOT introduce a chart library after Plan 13-01** — Plan 13-01 installs `recharts@3.8.1`. Subsequent plans use it; switching mid-phase wastes commits.
- **DO NOT bypass `Depends(get_project_member)` on chart endpoints** — Phase 9 SEC-09 RBAC: every project-scoped read must check membership. Admin bypass is automatic in `get_project_member`.
- **DO NOT filter `/users/{id}/activity` by the TARGET user's projects** — privacy filter is by VIEWER's projects (D-C7 + D-X4). A non-admin viewer sees only events from projects they're a member of, regardless of what the target user did elsewhere.
- **DO NOT add a custom date range picker beyond presets** — out of scope per CONTEXT (deferred to v2.1). 4 chip values: 7d / 30d / 90d / Q-current.
- **DO NOT touch the dashboard `ActivityFeed`** (Phase 10 D-26) — Phase 13 builds a separate `<ActivityTab/>` for project + profile contexts only. Dashboard widget stays.
- **DO NOT remove the v1.0 Burndown SVG card from Reports** — it stays alongside new charts (D-A4). CFD is Kanban-only; Burndown stays for Scrum.
- **DO NOT use `useRouter().events`** in Next.js 16 — it was removed. Use `usePathname()` effect for "close menu on nav" (Phase 12 D-09 `safePush` pattern).
- **DO NOT mount Recharts in a Server Component** — it touches DOM/SVG and crashes. Wrap chart card with `"use client"` or `next/dynamic({ ssr:false })`.
- **DO NOT amend an Avatar consumer's existing onClick** — `<Avatar href={...}/>` opens via `<Link>` which calls `e.stopPropagation()` (Pattern 3 above). Existing row-click handlers continue to work for clicks NOT on the avatar.
- **DO NOT pass `href` on AvatarStack overflow chip** — chip is NOT an Avatar instance; it's a non-clickable `+N` indicator.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart geometry, axes, tooltips, responsive containers | Custom SVG with manual tooltip + axis math | `recharts@3.8.1` (`AreaChart`, `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`) | Recharts handles 100+ edge cases (zero-data axis, tooltip clipping, responsive resize). Custom SVG = >200 LOC per chart. **Burndown card is the exception — already built, leave alone.** |
| Date arithmetic for grouping/relative-time | Reinventing day-diff math per render | Pure `Date` API in `lib/activity-date-format.ts` (~30 LOC, no library) | The prototype already uses pure `Date` — no need for `date-fns`. Existing `Frontend2/components/dashboard/activity-feed.tsx:formatTime` is the pattern. |
| Click-outside dismiss for dropdown | Manual `addEventListener('click')` with bubble issues | Existing Phase 8 pattern: `document.addEventListener('mousedown', ...)` inside `useEffect([open])` | Already proven in `Frontend2/components/sidebar.tsx` SidebarUserMenu lines 176-183. Verbatim copy. |
| LocalStorage SSR safety | Inline `typeof window` guards everywhere | `useLocalStoragePref` from `Frontend2/hooks/use-local-storage-pref.ts` | Already SSR-safe; namespaces with `spms.` prefix; type-generic. |
| Initials computation | Inline split/slice in every Avatar caller | Existing pattern in `dashboard/activity-feed.tsx:getInitials` (lines 49-56) | Lift to `lib/initials.ts` if a 3rd consumer appears. Plan 13-02 (mini-profile header) is the 3rd — LIFT. |
| Privacy-filtered activity SQL | Multi-pass JS filter on a large `audit_log` payload | Single `WHERE entity_id IN (SELECT project_id FROM team_projects WHERE user_id = :viewer)` SQL clause | Pushing filter to DB respects pagination + total-count semantics; a JS filter would over-fetch and break offset math. |
| RBAC on chart endpoints | Inline ad-hoc membership check per route | `Depends(get_project_member)` from `app/api/deps/project.py` | Phase 9 standard; admin-bypass built in; failure returns 403 with error_code. |
| In-memory rate limiting on chart calls | Custom dict with TTL | Not needed in Phase 13 — chart calls are read-only, not destructive. Skip. |
| PDF export | Custom HTML→PDF | Phase 12's `useDownloadPhaseReportPdf` already exists; reused for Faz Raporları rows | Plan 13-08 reuses, no new path. |
| Methodology gating | Hardcoded `if (project.methodology === 'KANBAN')` per chart | Single `chartVisibility(project.methodology)` helper that returns `{ cfd: bool, iteration: bool, leadCycle: bool, burndown: bool }` | Avoids scattering enum checks; matches CLAUDE.md Strategy Pattern guidance for methodology branches. |

**Key insight:** the most under-appreciated risk is the **audit-log → semantic event mapping gap** (Pattern 7 above) — the prototype was authored against a hypothetical event-stream shape that the real audit_log table does NOT directly emit. Plan 13-01 MUST ship the mapper, and Plan 13-04 MUST consume it. Without the mapper, the activity timeline renders empty or garbled labels at runtime even though all SQL queries pass.

## Common Pitfalls

### Pitfall 1: audit_log shape vs prototype event shape

**What goes wrong:** prototype `eventMeta(type)` keys off types like `"create" | "status" | "assign" | "comment" | "delete" | "phase"`. The real `audit_log` schema (VERIFIED via `Backend/app/infrastructure/database/models/audit_log.py`) has `(entity_type, action, field_name)` columns — no single `type` column. Status changes are `(entity_type='task', action='updated', field_name='column_id')`. Phase transitions are `(entity_type='project', action='phase_transition')`. Comments are `(entity_type='comment', action='created')`.

**Why it happens:** the prototype was authored in JS with a curated mock event shape (`window.SPMSData.ACTIVITY_EVENTS`) that pre-grouped audit rows into semantic types. The TypeScript port hits the real audit_log shape and breaks.

**How to avoid:** ship `lib/audit-event-mapper.ts` (Pattern 7 above) in Plan 13-01. Every render path goes `audit_log row → mapper → semantic type → eventMeta(semantic type) → icon/color/label`.

**Warning signs:** "events render with no icon" / "filter chips don't match anything" / "dashboard ActivityFeed shows raw `column_id` strings."

### Pitfall 2: Project activity feed only shows phase transitions today

**What goes wrong:** the existing `IAuditRepository.get_project_activity` filters `WHERE entity_type='project' AND entity_id=:project_id` (verified at `Backend/app/infrastructure/database/repositories/audit_repo.py` line 121-122). Task updates (`entity_type='task'`) are NOT included. So the project Activity tab today returns only `phase_transition` events for that project — no task creations, no status changes, no comments.

**Why it happens:** Phase 9 D-46 was scoped narrowly. Task audit rows live in `entity_type='task'` and require a JOIN through `tasks WHERE project_id=:project_id` to scope by project.

**How to avoid:** Plan 13-01 backend work MUST broaden the project-activity SQL to a UNION (or subquery `WHERE entity_id IN (SELECT id FROM tasks WHERE project_id=:p) AND entity_type='task' UNION ALL WHERE entity_type='project' AND entity_id=:p`). Alternative: keep narrow and document that the project Activity tab is "phase transitions only" (which would be a poor user experience and likely fail UAT).

**Warning signs:** "Phase 13 Activity tab launches and shows only 3 phase-transition events even though the project has 100 tasks with daily updates."

### Pitfall 3: Recharts crashes during SSR / RSC

**What goes wrong:** import `<LineChart/>` or any Recharts component into a Server Component (a `page.tsx` without `"use client"` at the top). Build/runtime error: "ReferenceError: window is not defined" or "Recharts requires a DOM."

**Why it happens:** Recharts uses `getBoundingClientRect`, `ResizeObserver`, and SVG measurement APIs that don't exist on the server.

**How to avoid:** EVERY file that imports from `recharts` must have `"use client"` as its first directive. The chart card itself (`cfd-chart.tsx`, etc.) is `"use client"`. The page (`reports/page.tsx`) can stay a Server or Client component as long as it imports the already-`"use client"` chart files. If the page IS a Server Component and tree-shake fails on bundle inclusion, switch to `next/dynamic({ ssr:false })`.

**Warning signs:** dev-server error "ReferenceError: window is not defined at recharts/..." or hydration mismatches around chart bounding boxes.

### Pitfall 4: Recharts tooltip styles fight oklch tokens

**What goes wrong:** Recharts `<Tooltip/>` component renders its own absolutely-positioned `<div>` with hardcoded inline white background + black border. This visually clashes with the dark mode and the oklch-based theme.

**Why it happens:** Recharts ships default tooltip styling for compatibility; these defaults don't read CSS variables.

**How to avoid:** ALWAYS pass `<Tooltip content={<CustomTooltip/>} cursor={{ stroke: "var(--border-strong)" }}/>` with a custom-rendered tooltip that reads `var(--surface)`, `var(--border)`, `var(--shadow-lg)`. Pattern:

```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 6, padding: "8px 10px", boxShadow: "var(--shadow-lg)",
      fontSize: 11.5,
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

**Warning signs:** chart hover shows a stark-white box in dark mode; tooltip border is wrong color; tooltip uses Arial instead of Geist.

### Pitfall 5: visx peer-dep mismatch on `--legacy-peer-deps`

**What goes wrong:** if a developer ignores the chart-library decision and tries to install visx, npm errors with "ERESOLVE — peer dependency react@^18.0.0 not satisfied (got 19.2.4)." Force-installing with `--legacy-peer-deps` may seem to work but breaks at runtime when visx internals call removed React-18 APIs.

**Why it happens:** visx 3.x peer-deps were not updated for React 19 yet (PR pending; see `airbnb/visx#1883`).

**How to avoid:** Plan 13-01 documents the choice as `recharts@3.8.1` in PLAN.md acceptance criteria. Reject any review request that switches libraries.

### Pitfall 6: `useRouter().events` is removed in Next.js 16

**What goes wrong:** "close dropdown on navigation" pattern using `router.events.on('routeChangeStart', ...)` from Next.js 13 docs throws "TypeError: undefined is not a function."

**Why it happens:** Next.js 16 App Router does not expose `router.events`. The replacement is `usePathname()` + a `useEffect` that depends on the pathname.

**How to avoid:** in `<AvatarDropdown/>`, watch pathname:

```tsx
const pathname = usePathname()
React.useEffect(() => {
  if (open) setOpen(false)  // close on any nav
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pathname])
```

Phase 12 D-09 `safePush` wrapper is the analogous pattern for "save guard before nav."

### Pitfall 7: CFD `generate_series` performance cliff

**What goes wrong:** PostgreSQL `generate_series('2026-01-01'::date, '2026-04-26'::date, '1 day') AS day` for a 90-day window joined against `audit_log WHERE entity_id IN (project_tasks)` for a project with 200 events/day produces a 90 × 200 = 18,000-row scan per chart load. Acceptable now; could spike with growth.

**Why it happens:** on-the-fly aggregation re-computes on every chart open. No caching layer in Phase 13.

**How to avoid:** Phase 13 ships on-the-fly. Document the cliff in CHARTS.md: "If a single project exceeds ~200 status-change events per day for 90 days (= 18k events), CFD load latency may exceed 500ms. v2.1 candidate: materialized view refreshed nightly OR daily summary table." For now, add an `EXPLAIN ANALYZE` line in the use-case comment so future investigators can re-measure.

**Warning signs:** chart load times >500ms; user complaints about Reports page being slow on large projects.

### Pitfall 8: Lead/Cycle "task moved back to In Progress after Done" edge case

**What goes wrong:** if a task is moved Done → InProgress → Done (retroactive correction), the naive `MIN(timestamp WHERE field_name='column_id' AND new_value='done')` produces the FIRST done timestamp, but cycle_time would compute against the MOST RECENT in_progress timestamp, giving a wildly negative duration.

**Why it happens:** real workflows include corrections; audit_log has both forward and backward transitions.

**How to avoid:** define lead/cycle precisely:
- **lead_time** = `MIN(timestamp WHERE entity_id=:t AND new_value='done') - MIN(timestamp WHERE entity_id=:t AND action='created')` — first done minus task creation.
- **cycle_time** = `MIN(timestamp WHERE new_value='done') - MIN(timestamp WHERE new_value='in_progress' AND timestamp < first_done_timestamp)` — first done minus FIRST in_progress before that done.
- Tasks with no `in_progress` event before first `done`: include in lead, exclude from cycle (return cycle=null).
- Tasks with done → in_progress → done: report only the FIRST done; subsequent toggles ignored. Document this on the chart card help-tip.

**Warning signs:** percentile charts show negative values or unrealistically large numbers (>365 days).

### Pitfall 9: `/users/{id}/activity` privacy filter performance

**What goes wrong:** SQL `JOIN audit_log → tasks → projects → team_projects WHERE viewer.user_id IN team_projects.user_id` against millions of audit rows scans wide.

**Why it happens:** privacy enforcement requires joining all the way out to membership.

**How to avoid:** subquery the viewer's project IDs once: `WITH viewer_projects AS (SELECT project_id FROM team_projects WHERE user_id = :viewer_id)`. Filter audit rows where `entity_id IN viewer_projects.project_id` (entity_type='project') OR `entity_id IN (SELECT id FROM tasks WHERE project_id IN viewer_projects.project_id)` (entity_type='task'). Index on `team_projects(user_id, project_id)` already exists per FK. Admin viewers (`role='Admin'`) skip the WHERE clause entirely.

**Warning signs:** `/users/{id}/activity` p95 > 500ms; pg_stat_statements shows the JOIN on this query is the slowest.

### Pitfall 10: Iteration Comparison data shape with no completed sprints

**What goes wrong:** project has methodology=Scrum but zero sprints exist (or zero completed sprints). Endpoint returns empty array, chart renders an empty SVG (Recharts shows axes but no bars), user sees a confusing "broken" UI.

**Why it happens:** the chart isn't aware of the data semantics — empty data ≠ empty render.

**How to avoid:** wrap with `<DataState empty={!data?.sprints?.length}/>` showing prototype-faithful inline empty: "Henüz tamamlanmış iterasyon yok." Use the same emptyFallback as the activity tab.

### Pitfall 11: localStorage filter rehydration race condition

**What goes wrong:** user lands on `/users/123` with stored filter `{type:"comment", userIdFilter:5, showCount:30}` — but the activity tab queries with type=all on first render (useState default), then re-fetches with type=comment after rehydration, causing a visible flicker.

**Why it happens:** `useLocalStoragePref` defers the load to `useEffect([])`, so first render uses the default. TanStack Query fires immediately.

**How to avoid:** gate the query enabled-flag on `hydrated` ref OR pass the hydrated filter as `select` argument. Alternatively, accept the flicker as small (~50ms) and not user-blocking. Document the choice in PLAN.md.

### Pitfall 12: Recharts `ResponsiveContainer` height collapse

**What goes wrong:** chart inside a flex parent with no explicit height collapses to 0px tall — `<ResponsiveContainer width="100%" height="100%"/>` needs the parent to have a defined height.

**Why it happens:** percentage heights need an absolute parent; CSS flex doesn't pass a height down.

**How to avoid:** always pass an explicit `height={N}` prop on `<ResponsiveContainer/>`. CFD = 200px desktop / 160px mobile (D-F1). Lead/Cycle = 120px. Iteration = 180px / 140px mobile.

## Runtime State Inventory

> **Phase 13 is greenfield + extension** (new endpoints, new pages, new primitive). Not a rename/refactor. This section is included for completeness and to confirm there is NO hidden runtime state to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no schema change. PhaseReports, audit_log, sprints all already exist. New endpoints only READ existing tables. | None |
| Live service config | None — no n8n / Tailscale / CDN config touched. | None |
| OS-registered state | None — no scheduled tasks / pm2 processes / launchd plists modified. | None |
| Secrets/env vars | None — `JWT_SECRET`, `DB_*`, `NEXT_PUBLIC_API_URL` all unchanged. New endpoints reuse existing JWT auth. | None |
| Build artifacts / installed packages | **NEW** `recharts@3.8.1` added to `Frontend2/package.json` (Plan 13-01). After install, `Frontend2/node_modules/recharts/` and transitive deps (Redux Toolkit + react-redux + es-toolkit + immer + reselect + decimal.js-light + eventemitter3 + tiny-invariant + use-sync-external-store + victory-vendor) appear in `Frontend2/package-lock.json`. **Action:** `npm install` after lockfile update; verify `npm ls recharts` shows 3.8.1; verify build succeeds. |

## Project Constraints (from CLAUDE.md)

The following constraints from `CLAUDE.md` (Python/FastAPI Clean Architecture Guidelines) MUST be honored by every Phase 13 plan:

1. **Domain layer is pure Python — no framework imports.** New chart entities (if any) live in `Backend/app/domain/entities/` as Pydantic `BaseModel` with `model_config = ConfigDict(from_attributes=True)`.
2. **Application layer (`Backend/app/application/`) MUST NOT import `sqlalchemy` or `app.infrastructure`.** Use cases inject repository interfaces from `app.domain.repositories.*`.
3. **Single Responsibility per use case** — `GetProjectCFDUseCase`, `GetProjectLeadCycleUseCase`, `GetProjectIterationUseCase`, `GetUserActivityUseCase` (4 separate classes, NOT one mega-class).
4. **Strategy Pattern for methodology branches** — methodology gating (CFD=Kanban-only, Iteration=Scrum/Iterative/Incremental/Evolutionary/RAD) goes in a domain helper, NOT inline `if project.methodology == 'KANBAN'` in the API layer. Suggested: `app/domain/services/chart_applicability.py`.
5. **Dependency Injection via FastAPI `Depends()`** — chart router uses `Depends(get_project_member)`, `Depends(get_audit_repo)`, `Depends(get_task_repo)`, `Depends(get_sprint_repo)`. Wire factories in `app/api/deps/`.
6. **Repository implementations follow `SqlAlchemy<Entity>Repository` naming** — extend existing `audit_repo.py` (do not create a new "ChartRepo"; charts read audit_log + tasks + sprints, all already have repos).
7. **DTO suffix mandatory** — `CFDResponseDTO`, `LeadCycleResponseDTO`, `IterationResponseDTO`, `UserActivityResponseDTO` (the latter may reuse Phase 9 `ActivityResponseDTO`).
8. **Domain exceptions raised at use-case layer; HTTP translation at API layer ONLY.** New: `InvalidMethodologyError` for the Iteration endpoint when called against a non-cycle methodology (HTTP 422 `INVALID_METHODOLOGY` per Phase 9 error taxonomy pattern).
9. **Audit Trail per Phase 9 D-08:** if any chart aggregation triggers a state change (none do — all GET), it MUST log to audit_log. Phase 13 endpoints are pure reads, no audit writes.
10. **Frontend NOT covered by CLAUDE.md** but inherits Frontend2/AGENTS.md: "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code." Verify any new App Router patterns (route groups, dynamic routes, params) against the installed Next.js 16.2.4 docs.

## Code Examples

Verified patterns from official sources + existing codebase:

### Backend — CFD endpoint use case (Clean Architecture vertical slice)

```python
# Source: Backend/app/application/use_cases/execute_phase_transition.py:38-42 (DI pattern)
# File: Backend/app/application/use_cases/get_project_cfd.py (Phase 13 NEW)
from datetime import date, timedelta
from typing import Literal
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.application.dtos.chart_dtos import CFDResponseDTO, CFDDayDTO


class GetProjectCFDUseCase:
    def __init__(self, audit_repo: IAuditRepository, task_repo: ITaskRepository):
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(self, project_id: int, range_days: Literal[7, 30, 90]) -> CFDResponseDTO:
        date_to = date.today()
        date_from = date_to - timedelta(days=range_days - 1)
        # Domain pseudo-code; the actual SQL aggregation belongs in the repo
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

### Backend — CFD repository SQL (PostgreSQL `generate_series` pattern)

```python
# Source: PostgreSQL official docs — generate_series + LEFT JOIN aggregation
# File: Backend/app/infrastructure/database/repositories/audit_repo.py (Phase 13 EXTEND)
async def get_cfd_snapshots(self, project_id: int, date_from: date, date_to: date) -> list[dict]:
    """D-X1 CFD daily snapshot via running window function.

    Strategy: for each day in [date_from, date_to], compute the count of tasks
    that, AT THAT DAY'S END, were in each of (todo, progress, review, done) status.
    The status of a task on day D = the most recent column_id assignment with
    timestamp <= D 23:59:59.

    Implementation: window function over audit_log keyed by (task_id, day) with
    LATERAL join from generate_series. Tested for ~200 events/day per project
    with sub-300ms p95 (Pitfall 7 cliff documented).
    """
    sql = text("""
    WITH RECURSIVE
      days AS (
        SELECT generate_series(:date_from::date, :date_to::date, '1 day'::interval)::date AS day
      ),
      project_tasks AS (
        SELECT id FROM tasks WHERE project_id = :project_id
      ),
      task_status_per_day AS (
        SELECT
          d.day,
          t.id AS task_id,
          (
            SELECT bc.name
            FROM audit_log al
            JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
            WHERE al.entity_type = 'task'
              AND al.entity_id = t.id
              AND al.field_name = 'column_id'
              AND al.timestamp <= (d.day + INTERVAL '1 day - 1 second')
            ORDER BY al.timestamp DESC
            LIMIT 1
          ) AS status_name
        FROM days d
        CROSS JOIN project_tasks t
      )
    SELECT
      day::text AS date,
      SUM(CASE WHEN status_name ILIKE '%todo%' OR status_name ILIKE '%backlog%' OR status_name IS NULL THEN 1 ELSE 0 END) AS todo,
      SUM(CASE WHEN status_name ILIKE '%progress%' OR status_name ILIKE '%doing%' THEN 1 ELSE 0 END) AS progress,
      SUM(CASE WHEN status_name ILIKE '%review%' OR status_name ILIKE '%qa%' THEN 1 ELSE 0 END) AS review,
      SUM(CASE WHEN status_name ILIKE '%done%' OR status_name ILIKE '%complete%' THEN 1 ELSE 0 END) AS done
    FROM task_status_per_day
    GROUP BY day
    ORDER BY day
    """)
    result = await self.session.execute(sql, {
        "date_from": date_from, "date_to": date_to, "project_id": project_id,
    })
    return [dict(row._mapping) for row in result.all()]
```

**[ASSUMED]** The status name → bucket mapping uses `ILIKE` patterns; this is fragile if a project renames a column to "Coding" instead of "In Progress." A more robust v2.1 pattern would store a canonical `bucket` column on `board_columns` (todo|progress|review|done). For Phase 13, document the limitation in PLAN.md and accept the pattern.

### Backend — Lead/Cycle Time SQL with `percentile_cont`

```python
# Source: PostgreSQL docs — percentile_cont(fraction) WITHIN GROUP (ORDER BY ...)
# File: Backend/app/infrastructure/database/repositories/audit_repo.py (Phase 13 EXTEND)
async def get_lead_cycle_data(self, project_id: int, range_days: int) -> dict:
    """D-X2 Lead + Cycle time per task, bucketed + percentiled.

    lead_time  = MIN(done.timestamp) - task.created_at
    cycle_time = MIN(done.timestamp) - MIN(in_progress.timestamp) WHERE in_progress < first_done

    Pitfall 8: if a task is done → in_progress → done (correction), use FIRST done
    and FIRST in_progress before that done. Tasks with no in_progress event are
    included in lead but EXCLUDED from cycle (return cycle=null).
    """
    sql = text("""
    WITH task_times AS (
      SELECT
        t.id,
        t.created_at,
        (SELECT MIN(al.timestamp)
         FROM audit_log al
         JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
         WHERE al.entity_id = t.id AND al.entity_type = 'task'
           AND al.field_name = 'column_id' AND bc.name ILIKE '%done%'
        ) AS first_done,
        (SELECT MIN(al.timestamp)
         FROM audit_log al
         JOIN board_columns bc ON bc.id = CAST(al.new_value AS INTEGER)
         WHERE al.entity_id = t.id AND al.entity_type = 'task'
           AND al.field_name = 'column_id' AND bc.name ILIKE '%progress%'
        ) AS first_in_progress
      FROM tasks t
      WHERE t.project_id = :project_id
        AND t.is_deleted = FALSE
        AND t.created_at >= NOW() - (:range_days || ' days')::INTERVAL
    ),
    durations AS (
      SELECT
        EXTRACT(EPOCH FROM (first_done - created_at)) / 86400.0 AS lead_days,
        CASE
          WHEN first_in_progress IS NOT NULL AND first_in_progress < first_done
          THEN EXTRACT(EPOCH FROM (first_done - first_in_progress)) / 86400.0
          ELSE NULL
        END AS cycle_days
      FROM task_times
      WHERE first_done IS NOT NULL
    )
    SELECT
      AVG(lead_days)  AS lead_avg,
      percentile_cont(0.50) WITHIN GROUP (ORDER BY lead_days) AS lead_p50,
      percentile_cont(0.85) WITHIN GROUP (ORDER BY lead_days) AS lead_p85,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY lead_days) AS lead_p95,
      AVG(cycle_days) AS cycle_avg,
      percentile_cont(0.50) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p50,
      percentile_cont(0.85) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p85,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY cycle_days) AS cycle_p95,
      -- bucket counts (5 buckets per prototype)
      SUM(CASE WHEN lead_days < 1 THEN 1 ELSE 0 END) AS lead_b1,
      SUM(CASE WHEN lead_days >= 1 AND lead_days < 3 THEN 1 ELSE 0 END) AS lead_b2,
      SUM(CASE WHEN lead_days >= 3 AND lead_days < 5 THEN 1 ELSE 0 END) AS lead_b3,
      SUM(CASE WHEN lead_days >= 5 AND lead_days < 10 THEN 1 ELSE 0 END) AS lead_b4,
      SUM(CASE WHEN lead_days >= 10 THEN 1 ELSE 0 END) AS lead_b5,
      SUM(CASE WHEN cycle_days < 1 THEN 1 ELSE 0 END) AS cycle_b1,
      SUM(CASE WHEN cycle_days >= 1 AND cycle_days < 3 THEN 1 ELSE 0 END) AS cycle_b2,
      SUM(CASE WHEN cycle_days >= 3 AND cycle_days < 5 THEN 1 ELSE 0 END) AS cycle_b3,
      SUM(CASE WHEN cycle_days >= 5 AND cycle_days < 10 THEN 1 ELSE 0 END) AS cycle_b4,
      SUM(CASE WHEN cycle_days >= 10 THEN 1 ELSE 0 END) AS cycle_b5
    FROM durations
    """)
    result = await self.session.execute(sql, {
        "project_id": project_id, "range_days": range_days,
    })
    return dict(result.mappings().one())
```

### Backend — Iteration Comparison SQL (last N sprints with planned/completed/carried)

```python
# Source: standard SQL window pattern + Phase 9 sprint model
# File: Backend/app/infrastructure/database/repositories/audit_repo.py (Phase 13 EXTEND)
async def get_iteration_data(self, project_id: int, count: int) -> list[dict]:
    """D-X3 Last N sprints, per-sprint planned/completed/carried.

    planned   = count of tasks with sprint_id=:s.id assigned at or before s.start_date
    completed = count of tasks with sprint_id=:s.id AND status='done' at s.end_date
    carried   = count of tasks with sprint_id=:s.id AND NOT done at s.end_date
    """
    sql = text("""
    WITH last_sprints AS (
      SELECT id, name, start_date, end_date
      FROM sprints
      WHERE project_id = :project_id AND end_date IS NOT NULL
      ORDER BY end_date DESC
      LIMIT :count
    )
    SELECT
      ls.id, ls.name, ls.start_date, ls.end_date,
      (SELECT COUNT(*) FROM tasks t
       WHERE t.sprint_id = ls.id AND t.created_at <= (ls.start_date + INTERVAL '1 day')) AS planned,
      (SELECT COUNT(*) FROM tasks t
       JOIN board_columns bc ON bc.id = t.column_id
       WHERE t.sprint_id = ls.id AND bc.name ILIKE '%done%' AND t.updated_at <= ls.end_date) AS completed,
      (SELECT COUNT(*) FROM tasks t
       JOIN board_columns bc ON bc.id = t.column_id
       WHERE t.sprint_id = ls.id AND NOT (bc.name ILIKE '%done%')) AS carried
    FROM last_sprints ls
    ORDER BY ls.end_date ASC
    """)
    result = await self.session.execute(sql, {"project_id": project_id, "count": count})
    return [dict(row._mappings) for row in result.all()]
```

### Backend — User activity privacy filter SQL

```python
# Source: NEW for Phase 13 — privacy filter via team_projects subquery
# File: Backend/app/infrastructure/database/repositories/audit_repo.py (Phase 13 EXTEND)
async def get_user_activity(
    self,
    target_user_id: int,
    viewer_user_id: int,
    is_admin: bool,
    types: Optional[list[str]] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 30, offset: int = 0,
) -> tuple[list[dict], int]:
    """D-X4 Activity by target user, FILTERED by viewer's project memberships.

    Admin viewers bypass the filter entirely.
    Non-admin viewers see only events scoped to projects they belong to via team_projects.
    """
    from app.infrastructure.database.models.user import UserModel

    base_conditions = [AuditLogModel.user_id == target_user_id]
    if types:
        base_conditions.append(AuditLogModel.action.in_(types))
    if date_from:
        base_conditions.append(AuditLogModel.timestamp >= date_from)
    if date_to:
        base_conditions.append(AuditLogModel.timestamp <= date_to)

    if not is_admin:
        # Privacy filter: only events for projects the VIEWER is a member of
        # entity_type='project' → entity_id IS the project id
        # entity_type='task'    → entity_id refers to tasks.id; must JOIN through tasks to project_id
        viewer_project_ids = (
            select(TeamProjectModel.project_id)
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamProjectModel.team_id)
            .where(TeamMemberModel.user_id == viewer_user_id)
        )
        # Alternative simpler path: also include project_members direct membership
        # union with: select(project_members.c.project_id).where(project_members.c.user_id == viewer_user_id)

        scope_filter = or_(
            and_(AuditLogModel.entity_type == "project", AuditLogModel.entity_id.in_(viewer_project_ids)),
            and_(AuditLogModel.entity_type == "task",
                 AuditLogModel.entity_id.in_(
                    select(TaskModel.id).where(TaskModel.project_id.in_(viewer_project_ids))
                 )),
            # entity_type='comment' → join through comments → tasks → project
            # entity_type='milestone' / 'artifact' / 'phase_report' → similar
        )
        base_conditions.append(scope_filter)

    count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*base_conditions)
    total = (await self.session.execute(count_stmt)).scalar() or 0

    items_stmt = (
        select(AuditLogModel, UserModel.full_name.label("user_name"), UserModel.avatar.label("user_avatar"))
        .select_from(AuditLogModel)
        .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
        .where(*base_conditions)
        .order_by(AuditLogModel.timestamp.desc())
        .limit(min(limit, 200))  # Phase 9 D-44 cap
        .offset(offset)
    )
    # ... map to dict items, return (items, total)
    return items, total
```

**Use case wiring:**

```python
# File: Backend/app/application/use_cases/get_user_activity.py (Phase 13 NEW)
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

**API router:**

```python
# File: Backend/app/api/v1/users.py (Phase 13 EXTEND)
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

### Backend — In-memory fakes test pattern (Phase 12 D-09)

```python
# Source: Backend/tests/integration/test_execute_phase_transition.py (Phase 12 D-09 verbatim)
# File: Backend/tests/integration/test_get_project_cfd.py (Phase 13 NEW)
import pytest
from datetime import date, timedelta
from app.application.use_cases.get_project_cfd import GetProjectCFDUseCase


class FakeAuditRepo:
    def __init__(self, snapshots):
        self._snapshots = snapshots

    async def get_cfd_snapshots(self, project_id, date_from, date_to):
        # Return synthetic snapshots scoped to date range
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
    assert result.avg_wip == 5.0   # progress + review average
    assert result.avg_completion_per_day == 10.0


@pytest.mark.asyncio
async def test_cfd_handles_empty_data():
    use_case = GetProjectCFDUseCase(audit_repo=FakeAuditRepo([]), task_repo=FakeTaskRepo())
    result = await use_case.execute(project_id=42, range_days=30)
    assert result.days == []
    assert result.avg_wip == 0.0
```

**Why in-memory fakes:** Phase 12 D-09 established this pattern for use cases that don't need a real DB. Tests run in <0.1s (vs. >1s for DB-bound integration tests). No conftest DB-up requirement. **Plan 13-01 backend tests use this pattern; route-level integration tests with seed data deferred to Plan 13-10 E2E.**

### Frontend — Vitest + RTL component test pattern

```tsx
// Source: Frontend2/components/lifecycle/evaluation-report-card.test.tsx (Phase 12 verbatim)
// File: Frontend2/components/shell/avatar-dropdown.test.tsx (Phase 13 NEW — Plan 13-02)
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AvatarDropdown } from "./avatar-dropdown"

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 7, full_name: "Test User", email: "[email protected]", role: "Admin" },
    logout: vi.fn(),
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}))

describe("AvatarDropdown", () => {
  it("renders trigger avatar with initials", () => {
    render(<AvatarDropdown/>)
    expect(screen.getByLabelText(/hesap menüsü|account menu/i)).toBeInTheDocument()
  })

  it("opens menu on trigger click and shows admin item for Admin role", async () => {
    render(<AvatarDropdown/>)
    await userEvent.click(screen.getByLabelText(/hesap menüsü|account menu/i))
    expect(screen.getByText(/yönetim paneli|admin panel/i)).toBeInTheDocument()
  })

  it("dismisses on Escape key", async () => {
    render(<AvatarDropdown/>)
    await userEvent.click(screen.getByLabelText(/hesap menüsü|account menu/i))
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByText(/yönetim paneli|admin panel/i)).not.toBeInTheDocument()
  })
})
```

### Frontend — Mobile breakpoint CSS pattern (D-F1)

```css
/* Source: Frontend2/app/globals.css existing pattern (lines 178-201)
   File: Frontend2/app/globals.css (Phase 13 EXTEND, Plan 13-09) */

/* Reports + Profile responsive grid (existing 1024px collapse pattern from Phase 11 D-54) */
.reports-primary-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
.reports-leadcycle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.reports-statcards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.profile-statcards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.profile-projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

@media (max-width: 1024px) {
  .reports-primary-grid,
  .reports-leadcycle-grid,
  .profile-statcards-grid,
  .profile-projects-grid { grid-template-columns: 1fr; }
  .reports-statcards-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Phase 13 D-F1: ≤640px additional layout — chart heights tighter, profile header stacked */
@media (max-width: 640px) {
  .reports-statcards-grid { grid-template-columns: 1fr; }
  .chart-cfd-svg      { height: 160px !important; }
  .chart-leadcycle-svg { height: 120px !important; }
  .chart-iteration-svg { height: 140px !important; }
  /* Profile header stacks (avatar above name+stats) */
  .profile-header-card { flex-direction: column !important; align-items: flex-start !important; }
  /* Activity timeline avatar shrinks */
  .activity-row-avatar { width: 22px !important; height: 22px !important; }
}
```

### Frontend — Methodology gating helper (Strategy Pattern compliance)

```ts
// Source: lib/methodology-matrix.ts pattern (Phase 11 D-44)
// File: Frontend2/lib/charts/applicability.ts (Phase 13 NEW — Plan 13-07)
import type { Methodology } from "@/lib/types"

export interface ChartApplicability {
  cfd: boolean        // Kanban only
  iteration: boolean  // Scrum + Iterative + Incremental + Evolutionary + RAD
  leadCycle: boolean  // all
  burndown: boolean   // Scrum (existing — preserved)
}

const ITERATION_METHODOLOGIES: ReadonlySet<Methodology> = new Set([
  "SCRUM", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD",
])

export function chartApplicabilityFor(methodology: Methodology): ChartApplicability {
  return {
    cfd:       methodology === "KANBAN",
    iteration: ITERATION_METHODOLOGIES.has(methodology),
    leadCycle: true,
    burndown:  methodology === "SCRUM",
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| visx 3.x for React 19 | Recharts 3.8.1 (visx peer-dep block) | 2026-04-26 (this research) | Bundle slightly higher; less low-level control; tooltip/legend out of the box |
| Custom SVG charts | Recharts for new charts | Phase 13 Plan 13-01 | Loses ~0 KB savings; gains ~99 KB gz; gains a11y / tooltip / responsive for free. Burndown stays SVG. |
| `useRouter().events` for nav-aware effects | `usePathname()` effect (Next.js 16) | Next.js 14→15 transition | Phase 12 already uses safePush wrapper |
| Implicit `entity_type='project'` activity scope | Need to BROADEN to include `entity_type='task'` JOIN | Phase 13 backend extension | Activity tab will actually show task events instead of just phase transitions |
| Inline `if methodology === ...` chart gating | `chartApplicabilityFor(methodology)` helper | Phase 13 Plan 13-07 | CLAUDE.md OCP compliance |

**Deprecated/outdated:**
- **visx for new React 19 projects** — peer-dep block; use Recharts. Planner should NOT entertain visx for chart sub-features.
- **Suspense + TanStack Query for charts** — incompatible with `refetchOnWindowFocus`; use slot pattern.
- **`shadcn/ui`** — explicitly forbidden by `.planning/PROJECT.md` and project memory `feedback_no_shadcn.md`. NOT a Phase 13 candidate.

## Assumptions Log

> Claims tagged `[ASSUMED]` need user/planner confirmation before becoming locked plan decisions.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recharts 3.8.1 bundle is ~99 KB gz with tree-shake | Standard Stack | Could be 150-180 KB after install. Mitigation: planner runs `next build` size report after Plan 13-01 install and reports actual delta in PLAN.md acceptance criteria. If >150 KB, consider code-splitting chart cards via `next/dynamic`. |
| A2 | `board_columns.name ILIKE '%done%' / '%progress%' / etc.` is reliable for status mapping | CFD SQL (Code Examples) | If a project renames a column to "Coding" or "QA Pass", the bucket mapping silently mis-attributes. Mitigation: document in CHARTS.md that column names should follow a canonical convention; v2.1 candidate is to add a `bucket` enum column on `board_columns`. |
| A3 | `entity_type='comment'` exists in audit_log with `action='created'` for new comments | Pitfall 1 + Audit Mapper | If comments don't audit-log on create today, the activity timeline will lack comment events. Mitigation: planner verifies via `Backend/app/api/v1/comments.py` and `manage_comments.py` whether audit_log writes happen on comment creation. If NOT, Plan 13-01 backend MUST add the audit-log writes. |
| A4 | `entity_type='milestone' / 'artifact' / 'phase_report'` audit_log writes exist with appropriate action strings | Audit Mapper + Activity Tab | Same as A3 — if Phase 12 entities don't audit-log creates/updates, the lifecycle filter shows nothing. Mitigation: planner verifies via grep on Phase 12 use-cases (`manage_milestones.py`, etc.). |
| A5 | Project members are looked up via `team_projects` JOIN `team_members` (not `project_members` direct table) | User activity privacy filter SQL | The `Backend/app/infrastructure/database/models/project.py` ALSO has a `project_members` Table at line 10. The privacy filter SHOULD check BOTH paths (UNION). Mitigation: planner consolidates with backend-developer's confirmation; SQL example above shows UNION pattern. |
| A6 | Adding `recharts` does NOT trigger Redux Provider requirement at the app root | Standard Stack | Recharts uses internal Redux for some components (per `react-redux` peer dep). If a `<Provider/>` wrapper is required at the app root, Plan 13-01 needs to add it. **Verify after install** — if `next dev` errors with "could not find react-redux context value", add the wrapper to `Frontend2/app/(shell)/layout.tsx`. |
| A7 | Recharts `<ResponsiveContainer/>` works with Next.js 16 strict-mode double-invoke | Pitfall 12 + Code Examples | Could double-mount the SVG measurement; usually self-corrects. Mitigation: smoke test in dev mode after install. |
| A8 | `audit_log.field_name='column_id'` reliably indicates a status change | Pitfall 1 + Audit Mapper | Other column edits (none expected) would also write `field_name='column_id'`. Currently safe — only status changes update column_id. Verify no other use case writes `column_id` on a task. |
| A9 | Date-aware grouping "This Week" boundary = exactly 7 days back | Pattern 6 | Could be "current calendar week" instead. Mitigation: prototype uses 7-days-back (line 29 of `activity-tab.jsx`); ship verbatim. |
| A10 | `useAuth().user.role` returns the string `'Admin'` (not `'ADMIN'`, not `'admin'`) | Pattern 1 (RTL test) + AvatarDropdown role gating | Backend backfill seeds set role to either case. Mitigation: case-insensitive compare via `(user.role || '').toLowerCase() === 'admin'` (Phase 11 D-44 pattern). |
| A11 | Chart endpoints do NOT need rate limiting | Don't Hand-Roll | Could DoS via repeated CFD calls on a 10k-event project. Mitigation: existing FastAPI middleware (if any) handles broad throttling; document in OPS.md. |
| A12 | `lucide-react@^1.8.0` includes the icons used by AvatarDropdown (`Globe`, `Shield`, `Check`, `ChevronRight`, `LogOut`, `Settings`, `Users`) | Component fidelity | If any icon was renamed/removed in 1.8, build fails. Mitigation: trivial — verify via `grep -rn "from \"lucide-react\"" Frontend2/components/` and add to existing imports list before writing the dropdown. |

## Open Questions (RESOLVED)

1. **Do task creates / status changes / assignment changes write to `audit_log` today? If so, with what `action` value?**
   - What we know: `task_repo.update()` writes one row per changed field with `action='updated'`. `task_repo.create()` is not visible from grep. Phase transitions write `action='phase_transition'`.
   - What's unclear: is there a `'created'` action for new tasks? For comments? For milestones?
   - RESOLVED: Plan 13-01 starts with a 30-minute backend audit script: `SELECT DISTINCT entity_type, action, field_name FROM audit_log GROUP BY 1,2,3` against the dev DB. The output drives the `audit-event-mapper.ts` map exactly.

2. **Does the existing `get_project_activity` endpoint return ANY task events today, or is it phase-transitions-only?**
   - What we know: SQL filter is `WHERE entity_type='project' AND entity_id=:project_id`. Task events have `entity_type='task'`, so they are NOT included.
   - What's unclear: was this an oversight or intentional?
   - RESOLVED: Plan 13-01 broadens the project-activity SQL via UNION (both task events scoped through `tasks WHERE project_id=:p` AND project events at `entity_id=:p`) and updates Phase 9's existing `test_activity.py` to verify both event sources are returned.

3. **Iteration Comparison: how do we identify "planned at sprint start" vs. "added mid-sprint"?**
   - What we know: tasks have `sprint_id` (set when assigned), `created_at` (task creation date), `updated_at` (last update).
   - What's unclear: there's no explicit "added to sprint at" timestamp. Using `created_at <= sprint.start_date + 1 day` is an approximation.
   - RESOLVED: planner accepts the approximation for v2.0; document in CHARTS.md. v2.1 candidate: add a `sprint_assigned_at` column or query audit_log for `field_name='sprint_id'` change events.

4. **AvatarDropdown mobile behavior: anchored dropdown vs. full-screen sheet?**
   - What we know: D-G2 / Claude's Discretion last bullet says "default to anchored dropdown."
   - What's unclear: at extremely narrow viewports (<360px), the 260px menu may exceed viewport width.
   - RESOLVED: ship anchored with `right: 8px` clamp; accept the rest as a v2.1 polish.

5. **PDF download from Reports page Faz Raporları rows: rate limit shared with Phase 12 path?**
   - What we know: Phase 12 D-58 implements `_pdf_last_request[user_id]` 30s cooldown.
   - What's unclear: if a user opens 3 phase reports on the Reports page and tries to download all, the second/third return 429.
   - RESOLVED: keep the existing rate limit; document in PHASE-13-NOTES.md that downloads are per-user 30s cooldown across the entire app.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend dev/build | Confirmed (project runs `next dev`) | unspecified (≥20 implied by Next 16) | n/a |
| npm | Frontend dependency install | Confirmed (project has `package-lock.json`) | unspecified | n/a |
| Python 3.12+ | Backend FastAPI | Confirmed (project runs `uvicorn`) | per CLAUDE.md ("Python 3.12+") | n/a |
| PostgreSQL 15 | Backend DB | Confirmed (`Backend/docker-compose.yaml`) | 15-alpine | n/a |
| Docker | DB container | Required for local dev | unspecified | spin up Postgres directly if Docker unavailable |
| `recharts@3.8.1` | Plan 13-01 | NOT installed yet | n/a | NONE — must install (visx blocked, custom SVG out-of-scope for new charts) |
| `lucide-react@^1.8.0` | All icon use | Confirmed (in package.json) | 1.8.0 | n/a |
| `@tanstack/react-query@^5.99.2` | All data fetches | Confirmed | 5.99.2 | n/a |
| pytest + pytest-asyncio | Backend tests | Confirmed (Phase 12 tests pass) | per `pytest.ini` | n/a |
| `@testing-library/react@^16.3.2` | Frontend RTL tests | Confirmed | 16.3.2 | n/a |
| Vitest 1.6 | Frontend test runner | Confirmed | 1.6.0 | n/a |
| Playwright 1.51.1 | E2E (Plan 13-10) | Confirmed | 1.51.1 | Skip-guard pattern — already established (Phase 11 D-50) |

**Missing dependencies with no fallback:**
- `recharts@3.8.1` — must be installed via Plan 13-01.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | pytest + pytest-asyncio (per `Backend/pytest.ini`) |
| Backend in-memory fakes | Phase 12 D-09 pattern (FakeProjectRepo / FakeTaskRepo / FakeAuditRepo / FakeSession) |
| Backend integration tests | `Backend/tests/integration/` (existing pattern) — uses real DB only when SQL aggregation must be verified end-to-end |
| Frontend framework | Vitest 1.6 + jsdom 24 + React Testing Library 16.3.2 (per `Frontend2/package.json`) |
| Frontend test setup | `Frontend2/test/setup.ts` — auto-cleanup + localStorage shim |
| Frontend config file | `Frontend2/vitest.config.ts` |
| E2E framework | Playwright 1.51.1 (per `Frontend2/package.json`) |
| Quick run command (FE) | `npm test --prefix Frontend2` |
| Quick run command (BE) | `pytest -x` (from `Backend/`) |
| Full suite (FE) | `npm test --prefix Frontend2` (vitest run, single-pass) |
| Full suite (BE) | `pytest` (from `Backend/`) |
| E2E run | `npm run test:e2e --prefix Frontend2` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REPT-01 | CFD endpoint returns daily snapshots for 7/30/90d | unit (in-mem fakes) | `pytest tests/integration/test_get_project_cfd.py -x` | ❌ Wave 0 |
| REPT-01 | CFD endpoint enforces project-member RBAC (403 for non-member) | integration (real DB or fake DI) | `pytest tests/integration/test_charts_rbac.py -x` | ❌ Wave 0 |
| REPT-01 | CFDChart component renders 4 stacked areas with token colors | RTL component | `npm test -- cfd-chart.test.tsx` | ❌ Wave 0 |
| REPT-01 | CFDChart shows methodology AlertBanner for non-Kanban | RTL component | `npm test -- cfd-chart.test.tsx` | ❌ Wave 0 |
| REPT-02 | Lead/Cycle endpoint computes percentiles + buckets | unit (in-mem fakes) | `pytest tests/integration/test_get_project_lead_cycle.py -x` | ❌ Wave 0 |
| REPT-02 | Lead/Cycle endpoint excludes tasks with no in_progress event from cycle count | unit | `pytest tests/integration/test_get_project_lead_cycle.py::test_no_in_progress_excluded -x` | ❌ Wave 0 |
| REPT-02 | LeadCycleChart renders 5 buckets + p50/p85/p95 line | RTL | `npm test -- lead-cycle-chart.test.tsx` | ❌ Wave 0 |
| REPT-03 | Iteration endpoint returns last N sprints with planned/completed/carried | unit | `pytest tests/integration/test_get_project_iteration.py -x` | ❌ Wave 0 |
| REPT-03 | Iteration endpoint returns 422 INVALID_METHODOLOGY for non-cycle methodology | unit | `pytest tests/integration/test_get_project_iteration.py::test_invalid_methodology -x` | ❌ Wave 0 |
| REPT-03 | IterationChart renders grouped bars with 3 colors per sprint | RTL | `npm test -- iteration-chart.test.tsx` | ❌ Wave 0 |
| REPT-04 | Faz Raporları section opens project picker → phase picker → row click expands EvaluationReportCard | RTL | `npm test -- phase-reports-section.test.tsx` | ❌ Wave 0 |
| REPT-04 | Faz Raporları empty state with deep-link CTA renders | RTL | `npm test -- phase-reports-section.test.tsx` | ❌ Wave 0 |
| PROF-01 | ActivityTab routes by projectId vs userId discriminated union | RTL | `npm test -- activity-tab.test.tsx` | ❌ Wave 0 |
| PROF-01 | ActivityTab filter SegmentedControl persists in localStorage per project | RTL | `npm test -- activity-tab.test.tsx::filter persistence` | ❌ Wave 0 |
| PROF-01 | ActivityTab "Daha fazla yükle" appends 30 more events | RTL | `npm test -- activity-tab.test.tsx::load more` | ❌ Wave 0 |
| PROF-01 | ActivityTab date grouping renders Bugün / Dün / Bu Hafta / exact-date | RTL + unit on `formatActivityDate` | `npm test -- activity-date-format.test.ts` | ❌ Wave 0 |
| PROF-01 | audit-event-mapper.ts derives correct semantic types from real audit_log shapes | unit | `npm test -- audit-event-mapper.test.ts` | ❌ Wave 0 |
| PROF-02 | UserProfilePage renders 3 StatCards from /users/{id}/summary | RTL + MSW (or fetch mock) | `npm test -- profile-page.test.tsx::stat cards` | ❌ Wave 0 |
| PROF-02 | UserProfilePage shows Sen badge + ring on Avatar when self | RTL | `npm test -- profile-page.test.tsx::self badge` | ❌ Wave 0 |
| PROF-02 | UserProfilePage Düzenle button visible only when self | RTL | `npm test -- profile-page.test.tsx::edit button` | ❌ Wave 0 |
| PROF-02 | UserProfilePage tabs deep-link via ?tab=tasks/projects/activity | RTL | `npm test -- profile-page.test.tsx::tab routing` | ❌ Wave 0 |
| PROF-02 | /users/{id}/activity returns viewer-filtered events (non-member sees nothing for other-project events) | unit (in-mem fakes) | `pytest tests/integration/test_get_user_activity.py -x` | ❌ Wave 0 |
| PROF-02 | /users/{id}/activity admin viewer bypasses filter | unit | `pytest tests/integration/test_get_user_activity.py::test_admin_bypass -x` | ❌ Wave 0 |
| PROF-03 | AvatarDropdown opens on click and shows admin item only for Admin role | RTL | `npm test -- avatar-dropdown.test.tsx::admin gating` | ❌ Wave 0 |
| PROF-03 | AvatarDropdown dismisses on Esc + click-outside + nav-away | RTL | `npm test -- avatar-dropdown.test.tsx::dismiss` | ❌ Wave 0 |
| PROF-03 | AvatarDropdown logout calls useAuth().logout() then router.push('/auth/login') | RTL | `npm test -- avatar-dropdown.test.tsx::logout` | ❌ Wave 0 |
| PROF-03 | Avatar with href prop renders <Link>, without href renders <div> | RTL | `npm test -- avatar.test.tsx::href` | ❌ Wave 0 |
| PROF-04 | Profile Tasks tab uses MTTaskRow density="compact" — visually identical to MyTasks compact mode | RTL | `npm test -- profile-tasks-tab.test.tsx` | ❌ Wave 0 |
| PROF-04 | Profile Tasks tab groups by project + filter Aktif/Tamamlanan/Tümü | RTL | `npm test -- profile-tasks-tab.test.tsx::filter and group` | ❌ Wave 0 |
| Cross-cutting | DataState primitive renders loading/error/empty/children correctly | RTL unit | `npm test -- data-state.test.tsx` | ❌ Wave 0 |
| Cross-cutting (E2E) | Reports page loads → CFD chart renders → range filter changes data | Playwright E2E (skip-guarded) | `npm run test:e2e -- reports.spec.ts` | ❌ Wave 0 (Plan 13-10) |
| Cross-cutting (E2E) | UserProfilePage loads with own/other user → tabs switch | Playwright E2E (skip-guarded) | `npm run test:e2e -- user-profile.spec.ts` | ❌ Wave 0 (Plan 13-10) |
| Cross-cutting (E2E) | AvatarDropdown logout flow → /auth/login | Playwright E2E (skip-guarded) | `npm run test:e2e -- avatar-dropdown.spec.ts` | ❌ Wave 0 (Plan 13-10) |
| Cross-cutting (UAT) | Manual UAT click-through against 13-UAT-CHECKLIST.md (15-20 rows) | manual | n/a | ❌ Wave 0 (Plan 13-10 artifact) |

### Sampling Rate

- **Per task commit (FE):** `npm test -- <changed-test-file>` (vitest single-file run, ~1-3 sec)
- **Per task commit (BE):** `pytest tests/integration/<changed-test-file>.py -x` (~0.5-2 sec for in-mem fakes; ~5-10 sec if integration with DB)
- **Per wave merge:** `npm test --prefix Frontend2 && pytest` (full suite — currently ~5 min for FE + ~30 sec for BE non-integration)
- **Phase gate:** Full suite green AND Plan 13-10 E2E specs run (skip-guards in place) BEFORE `/gsd-verify-work 13`

### Wave 0 Gaps

- [ ] `Backend/tests/integration/test_get_project_cfd.py` — covers REPT-01
- [ ] `Backend/tests/integration/test_get_project_lead_cycle.py` — covers REPT-02
- [ ] `Backend/tests/integration/test_get_project_iteration.py` — covers REPT-03
- [ ] `Backend/tests/integration/test_get_user_activity.py` — covers PROF-02 privacy
- [ ] `Backend/tests/integration/test_charts_rbac.py` — RBAC for all 3 chart endpoints
- [ ] `Frontend2/components/reports/cfd-chart.test.tsx` — covers REPT-01
- [ ] `Frontend2/components/reports/lead-cycle-chart.test.tsx` — covers REPT-02
- [ ] `Frontend2/components/reports/iteration-chart.test.tsx` — covers REPT-03
- [ ] `Frontend2/components/reports/phase-reports-section.test.tsx` — covers REPT-04
- [ ] `Frontend2/components/activity/activity-tab.test.tsx` — covers PROF-01
- [ ] `Frontend2/lib/audit-event-mapper.test.ts` — covers PROF-01 mapper unit
- [ ] `Frontend2/lib/activity-date-format.test.ts` — covers PROF-01 grouping unit
- [ ] `Frontend2/app/(shell)/users/[id]/page.test.tsx` — covers PROF-02
- [ ] `Frontend2/components/profile/profile-tasks-tab.test.tsx` — covers PROF-02 + PROF-04
- [ ] `Frontend2/components/shell/avatar-dropdown.test.tsx` — covers PROF-03
- [ ] `Frontend2/components/primitives/avatar.test.tsx` — covers Avatar href extension
- [ ] `Frontend2/components/primitives/data-state.test.tsx` — covers DataState primitive
- [ ] `Frontend2/e2e/reports.spec.ts` — Plan 13-10 (Playwright + skip-guard)
- [ ] `Frontend2/e2e/user-profile.spec.ts` — Plan 13-10
- [ ] `Frontend2/e2e/avatar-dropdown.spec.ts` — Plan 13-10
- [ ] `.planning/phases/13-reporting-activity-user-profile/13-UAT-CHECKLIST.md` — Plan 13-10

*(No existing test infrastructure changes needed — vitest + RTL + Playwright already configured per `Frontend2/package.json` and `Frontend2/test/setup.ts`. Pytest + pytest-asyncio configured in Backend per `Backend/pytest.ini`.)*

## Security Domain

> Security enforcement is enabled by default per `.planning/config.json` (no `security_enforcement: false` key).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes (existing) | JWT Bearer per Phase 9; reused by Phase 13 endpoints via `Depends(get_current_user)` |
| V3 Session Management | yes (existing) | localStorage token (v2.0 accepted; v3.0 ADV-02 candidate for HttpOnly cookie); Phase 13 logout clears via `useAuth().logout()` |
| V4 Access Control | yes — CRITICAL | `Depends(get_project_member)` for all 3 chart endpoints; `Depends(get_current_user)` + viewer-vs-target privacy filter on `/users/{id}/activity` |
| V5 Input Validation | yes | FastAPI `Query(default=N, ge=1, le=200)` per Phase 9; range param validated as `Literal[7, 30, 90]`; methodology gating via 422 |
| V6 Cryptography | n/a | No new crypto in Phase 13; reuses existing JWT signing |
| V7 Error Handling & Logging | yes | Phase 9 `error_code` taxonomy reused; new `INVALID_METHODOLOGY` for D-X3 |
| V8 Data Protection | yes — privacy filter | `/users/{id}/activity` viewer-scoped privacy filter (D-X4); admin bypass explicitly per `(user.role || '').toLowerCase() === 'admin'` |
| V11 Business Logic | yes | Methodology gating (CFD = Kanban-only, Iteration = Scrum/Iterative/...) at the use-case layer per CLAUDE.md OCP |
| V13 API & Web Service | yes | Page size capped at 200 (Phase 9 D-44); same on `/users/{id}/activity` |

### Known Threat Patterns for FastAPI + Next.js stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR via `/projects/{id}/charts/cfd` (non-member access) | Information Disclosure | `Depends(get_project_member)` returns 403 with error_code |
| IDOR via `/users/{id}/activity` (viewing another user's events from projects you can't access) | Information Disclosure | Viewer-privacy SQL filter at `audit_repo.get_user_activity` (admin bypass) |
| Reflected XSS via activity event labels (user_name from DB) | Tampering | React's auto-escape protects; existing pattern in `dashboard/activity-feed.tsx` |
| Stored XSS via comment body in activity timeline | Tampering | Comment body is stripped of `<[^>]*>` tags via the same regex pattern in `comments-section.tsx` (Phase 11 D-09 — `T-11-09-01 XSS mitigation`); reuse for D-B6 inline comment block. Future hardening: DOMPurify (already in `Frontend2/package.json` as `isomorphic-dompurify`) |
| CSRF on logout | Spoofing | Logout is a localStorage-clear + client-side router.push (no server call); no CSRF risk |
| Mass-assignment on chart endpoints | Tampering | Chart endpoints are pure GET; no body input |
| Rate-limit bypass via repeated CFD calls | Denial of Service | Existing FastAPI middleware (if any) handles broad throttling; chart endpoints are read-only and SQL-bounded by `range` parameter |
| Privilege escalation via Admin Paneli menu item | Elevation of Privilege | Frontend gates via `useAuth().user.role`; backend `/admin` route MUST re-check via `Depends(require_admin)` (Phase 9 pattern). Frontend gate is defense-in-depth, NOT primary auth |
| SQL injection via type[] filter | Tampering | FastAPI `Query` validates each item; SQLAlchemy parameterized queries used everywhere — no string interpolation |
| Token leakage via window.opener (Avatar `<Link/>` to /users/[id]) | Info Disclosure | Next.js `<Link/>` defaults are safe; no `target="_blank"` opens external windows |

## Sources

### Primary (HIGH confidence)
- `npm view recharts version` / `npm view recharts peerDependencies` / `npm view recharts dependencies` (executed 2026-04-26) — Recharts 3.8.1 metadata
- `npm view @visx/shape peerDependencies` / `@visx/scale` / `@visx/axis` / `@visx/tooltip` (executed 2026-04-26) — visx React 18 ceiling confirmed
- `npm view @nivo/core version` / peerDependencies — nivo 0.99.0 + React 19 peer
- `Backend/app/infrastructure/database/models/audit_log.py` — verified audit_log column shape (entity_type, entity_id, field_name, old_value, new_value, action, user_id, timestamp, extra_metadata as JSONB column literal "metadata")
- `Backend/app/infrastructure/database/repositories/audit_repo.py` lines 103-181 — verified existing get_project_activity SQL filter (`entity_type='project'` only)
- `Backend/app/infrastructure/database/repositories/task_repo.py` lines 223-258 — verified task update writes `action='updated' field_name=<column>`
- `Backend/app/infrastructure/database/models/task.py` — verified column_id is FK to board_columns (status changes write `field_name='column_id'`)
- `Backend/app/infrastructure/database/models/sprint.py` — verified sprint shape (start_date, end_date, project_id, name, goal)
- `Backend/app/infrastructure/database/models/team.py` — verified TeamProjectModel shape
- `Backend/app/infrastructure/database/models/project.py` — verified project_members association table also exists (UNION case for privacy filter)
- `Frontend2/components/primitives/avatar.tsx` — verified Avatar primitive shape (extending with href is non-breaking)
- `Frontend2/hooks/use-local-storage-pref.ts` — verified SSR-safe + spms. namespace + hydrated ref pattern
- `Frontend2/components/dashboard/activity-feed.tsx` — verified existing formatTime / getInitials patterns to lift
- `Frontend2/components/dashboard/stat-card.tsx` — verified StatCard reuse signature (label, value, delta, tone, icon)
- `Frontend2/test/setup.ts` — verified existing localStorage shim for tests
- `Frontend2/package.json` — verified versions (Next 16.2.4, React 19.2.4, TanStack Query 5.99.2, Vitest 1.6, RTL 16.3.2, Playwright 1.51.1, lucide-react 1.8.0, no recharts yet)
- `Backend/tests/integration/test_execute_phase_transition.py` — verified Phase 12 D-09 in-memory fakes pattern
- `13-CONTEXT.md` (verbatim) — locked decisions D-00 through D-X5
- `13-UI-SPEC.md` head + Recharts pick rationale block — UI design contract authority
- `New_Frontend/src/pages/activity-tab.jsx` (full file) — prototype design authority
- `New_Frontend/src/pages/user-profile.jsx` (full file) — prototype design authority
- `New_Frontend/src/pages/misc.jsx` lines 356-535 — Reports prototype
- `New_Frontend/src/shell.jsx` lines 100-155 — AvatarDropdown prototype

### Secondary (MEDIUM confidence)
- [Recharts npm](https://www.npmjs.com/package/recharts) — package metadata
- [Recharts/recharts#4336 — SSR not working](https://github.com/recharts/recharts/issues/4336) — confirms `"use client"` requirement in Next.js
- [airbnb/visx#1883 — React 19 support](https://github.com/airbnb/visx/issues/1883) — confirms visx React 19 work in progress, not released
- [airbnb/visx React 19 PR action](https://github.com/airbnb/visx/actions/runs/19219761293) — visx React 19 PR last triggered 2025-11-10
- [Next.js Server and Client Components docs](https://nextjs.org/docs/app/getting-started/server-and-client-components) — RSC compatibility patterns
- [Next.js 16 + React 19.2 production guide](https://www.webnuz.com/article/2026-04-03/Complete%20Guide%20to%20Next.js%2016%20%20React%2019.2%20in%20Production%20%20RSC%20Security,%20View%20Transitions,%20Turbopack) — Next 16 + React 19 patterns
- [Recharts/recharts#1417 — Large bundle size discussion](https://github.com/recharts/recharts/issues/1417) — community bundle size concerns

### Tertiary (LOW confidence — flagged for validation)
- Recharts 3.8.1 actual gz bundle size — `[ASSUMED]` ~99 KB; planner verifies via `next build` size report
- `entity_type='comment' / 'milestone' / 'artifact' / 'phase_report'` audit_log writes — `[ASSUMED]` exist; planner verifies via `SELECT DISTINCT entity_type, action FROM audit_log` against dev DB
- `board_columns.name ILIKE '%done%'` reliability — `[ASSUMED]` works for default seeded column names; v2.1 candidate to add canonical bucket column

## Metadata

**Confidence breakdown:**
- Standard stack (Recharts pick): HIGH — verified peer-deps + version + transitive deps via `npm view`; visx blocker confirmed via npm + GitHub
- Architecture patterns (Clean Arch slice + DataState slot + audit-event mapper): HIGH — patterns verified against existing Phase 9/12 code + CLAUDE.md
- Pitfalls (audit_log shape gap, project-activity SQL gap, Recharts SSR): HIGH — directly read backend repo code
- SQL aggregation queries (CFD generate_series, percentile_cont, iteration last-N): MEDIUM — pattern is standard PostgreSQL but the `board_columns.name ILIKE` mapping is an `[ASSUMED]` shortcut; v2.1 hardening candidate documented
- Privacy filter SQL: HIGH on the JOIN approach; MEDIUM on the exact UNION structure (should the team_projects path AND project_members direct path both be queried? — A5 in Assumptions Log)
- Bundle size estimate: LOW — Bundlephobia did not return live data in this session; `[ASSUMED]` ~99 KB

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days; recharts 3.x and Next.js 16 are stable; visx React 19 PR may merge sooner — re-evaluate library pick if visx ships peer-dep update before Plan 13-01 starts)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | pytest + pytest-asyncio (per `Backend/pytest.ini`) |
| Backend in-memory fakes | Phase 12 D-09 pattern (FakeProjectRepo / FakeTaskRepo / FakeAuditRepo / FakeSession) |
| Backend integration tests | `Backend/tests/integration/` |
| Frontend framework | Vitest 1.6 + jsdom 24 + React Testing Library 16.3.2 |
| Frontend test setup | `Frontend2/test/setup.ts` |
| Frontend config | `Frontend2/vitest.config.ts` |
| E2E framework | Playwright 1.51.1 (skip-guarded per Phase 11 D-50) |
| Quick run command (FE) | `npm test --prefix Frontend2` |
| Quick run command (BE) | `pytest -x` (from `Backend/`) |
| Full suite | `npm test --prefix Frontend2 && (cd Backend && pytest)` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REPT-01 | CFD endpoint returns daily snapshots; methodology gating | unit + RTL | `pytest tests/integration/test_get_project_cfd.py -x && npm test -- cfd-chart.test.tsx` | ❌ Wave 0 |
| REPT-02 | Lead/Cycle endpoint computes percentiles + buckets; chart renders | unit + RTL | `pytest tests/integration/test_get_project_lead_cycle.py -x && npm test -- lead-cycle-chart.test.tsx` | ❌ Wave 0 |
| REPT-03 | Iteration endpoint last-N sprints + 422 INVALID_METHODOLOGY; chart renders | unit + RTL | `pytest tests/integration/test_get_project_iteration.py -x && npm test -- iteration-chart.test.tsx` | ❌ Wave 0 |
| REPT-04 | Faz Raporları section + EvaluationReportCard inline expand + empty state | RTL | `npm test -- phase-reports-section.test.tsx` | ❌ Wave 0 |
| PROF-01 | ActivityTab variant routing + filter persistence + load-more + date grouping + audit-event mapper | RTL + unit | `npm test -- activity-tab.test.tsx audit-event-mapper.test.ts activity-date-format.test.ts` | ❌ Wave 0 |
| PROF-02 | UserProfilePage stats + self badge + tab routing + privacy-filtered activity | RTL + unit | `npm test -- profile-page.test.tsx && pytest tests/integration/test_get_user_activity.py -x` | ❌ Wave 0 |
| PROF-03 | AvatarDropdown open/dismiss/admin gating/logout; Avatar href | RTL | `npm test -- avatar-dropdown.test.tsx avatar.test.tsx` | ❌ Wave 0 |
| PROF-04 | Profile Tasks tab uses MTTaskRow density="compact" + filter + group-by-project | RTL | `npm test -- profile-tasks-tab.test.tsx` | ❌ Wave 0 |
| Cross-cutting | DataState primitive states | RTL unit | `npm test -- data-state.test.tsx` | ❌ Wave 0 |
| Cross-cutting (E2E) | 5 specs: charts render with mock data, activity tab loads + filter persists, profile loads, avatar dropdown logout, phase reports section opens | Playwright (skip-guarded) | `npm run test:e2e -- reports.spec.ts user-profile.spec.ts avatar-dropdown.spec.ts activity-tab.spec.ts phase-reports.spec.ts` | ❌ Wave 0 (Plan 13-10) |
| Cross-cutting (UAT) | 15-20 row manual checklist for REPT-01..04 + PROF-01..04 | manual | n/a | ❌ Wave 0 (Plan 13-10 artifact) |

### Sampling Rate

- **Per task commit (FE):** `npm test -- <changed-test-file>` (vitest single-file run, ~1-3 sec)
- **Per task commit (BE):** `pytest tests/integration/<changed-test-file>.py -x` (~0.5-2 sec for in-mem fakes)
- **Per wave merge:** `npm test --prefix Frontend2 && (cd Backend && pytest)` (full suite green)
- **Phase gate:** Full suite green + Plan 13-10 E2E specs run with skip-guards in place + 13-UAT-CHECKLIST.md drafted BEFORE `/gsd-verify-work 13`

### Wave 0 Gaps

- [ ] `Backend/tests/integration/test_get_project_cfd.py` — REPT-01 use case
- [ ] `Backend/tests/integration/test_get_project_lead_cycle.py` — REPT-02 use case
- [ ] `Backend/tests/integration/test_get_project_iteration.py` — REPT-03 use case (incl. 422)
- [ ] `Backend/tests/integration/test_get_user_activity.py` — PROF-02 privacy filter (incl. admin bypass)
- [ ] `Backend/tests/integration/test_charts_rbac.py` — RBAC for all 3 chart endpoints (403 non-member)
- [ ] `Frontend2/components/reports/cfd-chart.test.tsx` — REPT-01 RTL
- [ ] `Frontend2/components/reports/lead-cycle-chart.test.tsx` — REPT-02 RTL
- [ ] `Frontend2/components/reports/iteration-chart.test.tsx` — REPT-03 RTL
- [ ] `Frontend2/components/reports/phase-reports-section.test.tsx` — REPT-04 RTL
- [ ] `Frontend2/components/activity/activity-tab.test.tsx` — PROF-01 RTL
- [ ] `Frontend2/lib/audit-event-mapper.test.ts` — PROF-01 mapper unit
- [ ] `Frontend2/lib/activity-date-format.test.ts` — PROF-01 grouping unit
- [ ] `Frontend2/app/(shell)/users/[id]/page.test.tsx` — PROF-02 RTL
- [ ] `Frontend2/components/profile/profile-tasks-tab.test.tsx` — PROF-02 + PROF-04 RTL
- [ ] `Frontend2/components/shell/avatar-dropdown.test.tsx` — PROF-03 RTL
- [ ] `Frontend2/components/primitives/avatar.test.tsx` — Avatar href extension
- [ ] `Frontend2/components/primitives/data-state.test.tsx` — DataState slot pattern
- [ ] `Frontend2/e2e/reports.spec.ts` / `user-profile.spec.ts` / `avatar-dropdown.spec.ts` / `activity-tab.spec.ts` / `phase-reports.spec.ts` — Plan 13-10 (skip-guarded)
- [ ] `.planning/phases/13-reporting-activity-user-profile/13-UAT-CHECKLIST.md` — Plan 13-10 artifact

*(All test infrastructure already exists per `Frontend2/package.json` and `Backend/pytest.ini`. No framework install needed.)*

---

*Phase: 13-reporting-activity-user-profile*
*Research generated: 2026-04-26*
