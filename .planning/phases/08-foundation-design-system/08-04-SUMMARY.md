---
phase: 08-foundation-design-system
plan: 04
subsystem: ui
tags: [nextjs, typescript, app-shell, sidebar, header, breadcrumb, app-router, route-groups, lucide-react, next-link, use-pathname, i18n]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Frontend2 scaffold, globals.css prototype tokens, lib/theme.ts, lib/i18n.ts (t + LangCode), context/app-context.tsx (useApp + sidebarCollapsed/mode/language), app/layout.tsx AppProvider mount"
  - phase: 08-02
    provides: "Avatar/Badge/Kbd primitives consumed by Sidebar NavItem and SidebarUserMenu"
  - phase: 08-03
    provides: "Input primitive consumed by Header search; components/primitives/index.ts barrel used for all consumer imports"
provides:
  - "Sidebar component (232px expanded / 56px collapsed, 0.18s ease width transition, sticky 100vh, WORKSPACE + ADMIN sections)"
  - "SidebarUserMenu (click-outside dismiss via mousedown listener, opens above trigger, Profilim/Ayarlar/Cikis Yap items)"
  - "NavItem (Link-as-root styled with inline hover, active accent bg + primary-colored icon, optional Kbd shortcut hint, optional Badge)"
  - "Header component (52px sticky, sidebar toggle + Breadcrumb + search Input + theme Moon/Sun + language TR/EN)"
  - "Breadcrumb component (pathname-derived; ChevronRight separators; last segment bold)"
  - "AppShell layout wrapper (horizontal flex: Sidebar + vertical stack of Header + scrollable padded main)"
  - "app/(shell) route group with shared AppShell layout + 6 placeholder pages (dashboard, projects, my-tasks, teams, reports, settings)"
  - "Root app/page.tsx redirect from / to /dashboard"
affects: [09-backend, 10-shell-pages, 11-task-features, 12-lifecycle, 13-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client components use 'use client' at top of file (RULE 1)"
    - "Prototype RouterContext fully replaced with next/link + usePathname() from next/navigation (D-09)"
    - "Icon Replacement: lucide-react icons used with explicit size={16} to match prototype (CONTEXT.md Icon Mapping)"
    - "Single source of collapse control: only the Header renders a sidebar-toggle button; Sidebar reads sidebarCollapsed from useApp() but never writes to it"
    - "Phase 8 header keeps only controls whose behavior is implemented today (sidebar toggle, search input, theme toggle, language toggle). Create/Notifications/Help buttons deferred to phases that wire their handlers"
    - "Route group (shell) collocates every authenticated page under the AppShell layout without embedding /shell/ in URLs"
    - "Placeholder pages for nav routes are server components -- no 'use client', no hooks, just JSX -- so they tree-shake cleanly"
    - "SidebarUserMenu open state is local (React.useState), dismiss-on-outside-click via document mousedown listener attached inside useEffect (exact prototype pattern from shell.jsx lines 104-107)"
    - "Active route detection: pathname === href || pathname.startsWith(href + '/') -- works for /projects and /projects/:id both"
    - "Breadcrumb uses Next.js Link for non-last parts so clicking navigates without full reload; last part renders as bold text (not a link)"

key-files:
  created:
    - Frontend2/components/sidebar.tsx
    - Frontend2/components/header.tsx
    - Frontend2/components/breadcrumb.tsx
    - Frontend2/components/app-shell.tsx
    - Frontend2/app/(shell)/layout.tsx
    - Frontend2/app/(shell)/dashboard/page.tsx
    - Frontend2/app/(shell)/projects/page.tsx
    - Frontend2/app/(shell)/my-tasks/page.tsx
    - Frontend2/app/(shell)/teams/page.tsx
    - Frontend2/app/(shell)/reports/page.tsx
    - Frontend2/app/(shell)/settings/page.tsx
  modified:
    - Frontend2/app/page.tsx

key-decisions:
  - "Next.js route group (shell) wraps every authenticated page under a single AppShell layout -- placeholder pages only need to export a default server component, and the shell markup never duplicates across routes"
  - "Sidebar reads sidebarCollapsed from useApp() but does not own a collapse-toggle button after checkpoint feedback. The Header's PanelLeft button is the single source of control, so the sidebar footer only hosts the SidebarUserMenu"
  - "Create / Notifications / Help buttons from the prototype header are deferred to later phases (Create -> 10 project-create wizard, Notifications -> post-phase-8 notification feed, Help -> help panel later). Rendering inert buttons was a UX regression relative to the prototype (prototype buttons are cosmetic; in Next.js they look interactive but do nothing) -- dropping them keeps every visible control functional"
  - "Breadcrumb parts derived from usePathname() with a small switch on known routes (/dashboard, /projects[/...], /my-tasks, /teams, /reports, /settings, /admin); unknown routes fall back to capitalizing the first path segment. Avoided metadata-based routing to keep the breadcrumb server-/client-boundary-agnostic"
  - "SidebarUserMenu renders Profilim/Ayarlar/Cikis Yap with placeholder user data {name: 'User', initials: 'U', avColor: 1}. Real auth data comes in later phases when auth is wired to Frontend2; threat register T-08-05 accepts this explicitly"
  - "Root / page redirects to /dashboard via next/navigation redirect() so that typing the bare domain lands on the canonical authenticated landing page"

requirements-completed: [FOUND-05]

# Metrics
duration: 17min
completed: 2026-04-21
---

# Phase 08 Plan 04: App Shell (Sidebar, Header, Breadcrumb, Layout) Summary

**Next.js App Shell -- Sidebar (collapsible 232/56px with WORKSPACE + ADMIN nav, keyboard shortcut hints, user menu with click-outside dismiss), Header (sidebar toggle + Breadcrumb + search Input + theme Moon/Sun + language TR/EN), Breadcrumb (pathname-derived via usePathname), and AppShell layout wired to a (shell) route group with 6 placeholder pages. Prototype RouterContext fully replaced with next/link + usePathname per D-09. Post-checkpoint cleanup removed the redundant sidebar footer toggle and the non-functional Create/Bell/Help buttons so every visible control in Phase 8 is wired.**

## Performance

- **Duration:** ~17 min total (Tasks 1-2 autonomous pass plus post-checkpoint fix round)
- **Started:** 2026-04-21T06:04:32Z (approx, start of plan execution before checkpoint)
- **Completed:** 2026-04-21T06:21:51Z (after fix commit + build verification)
- **Tasks:** 3 (2 auto + 1 checkpoint: human-verify, gate=blocking)
- **Files created:** 11
- **Files modified:** 3 (app/page.tsx in Task 2; header.tsx + sidebar.tsx in the fix commit)
- **Build status:** `npx next build` in Frontend2/ succeeded after each commit -- 0 TS errors, 0 lint warnings, 10/10 static routes prerender (/, /_not-found, /dashboard, /my-tasks, /projects, /reports, /settings, /teams plus the route group's implicit /(shell) aggregates)

## Accomplishments

- **Sidebar** (`Frontend2/components/sidebar.tsx`) ports shell.jsx lines 8-155 verbatim for SidebarLogo (SP mark with color-mix boxShadow inset + SPMS/v2.4 name column), NavItem (Link-as-root with hover/active inline styles, optional Badge, optional Kbd shortcut hint, collapse-aware padding and title tooltip), SidebarUserMenu (Avatar + name/role + ChevronUp, click-outside dismiss via document mousedown, Profilim/Ayarlar divider Cikis Yap menu items), and the top-level `aside` with 232/56px width, 0.18s ease transition, var(--bg-2) background, sticky 100vh height. WORKSPACE and ADMIN section labels render only when expanded; a divider rule replaces the labels when collapsed. Active route detection uses `pathname === href || pathname.startsWith(href + '/')`
- **Header** (`Frontend2/components/header.tsx`) ports shell.jsx lines 157-197 with Phase-8-scoped controls: PanelLeft sidebar toggle (calls `app.setSidebarCollapsed`), Breadcrumb component, flex spacer, search Input (`Search` icon, `Cmd+K` hint, 260px width), theme Moon/Sun toggle (calls `app.setMode`), and language TR/EN toggle (calls `app.setLanguage`). The 52px sticky bar has gap 12 between elements and `zIndex: 30` so menus render beneath it
- **Breadcrumb** (`Frontend2/components/breadcrumb.tsx`) uses usePathname() with a switch over known routes (/dashboard -> Dashboard, /projects -> Projects, /projects/... -> Projects > Project, /my-tasks -> My Tasks, /teams -> Teams, /reports -> Reports, /settings -> Settings, /admin -> Admin). Non-last parts render as Next Link; last part renders as bold text; ChevronRight (size 12, var(--fg-subtle)) separates parts
- **AppShell** (`Frontend2/components/app-shell.tsx`) composes Sidebar + (Header + main) in a horizontal flex container, with main having `padding: 24` and `overflow: auto` and var(--bg) as the outer background
- **Route group (shell)** in `Frontend2/app/(shell)/layout.tsx` wraps children with `<AppShell>` so every authenticated page under the group inherits the shell markup without duplicating it. Six placeholder pages (dashboard, projects, my-tasks, teams, reports, settings) exist as simple server components with a heading + "will be implemented in Phase X" paragraph -- no 404s when clicking sidebar nav items
- **Root redirect**: `app/page.tsx` now `redirect('/dashboard')` so the bare domain lands on the canonical landing page
- **Checkpoint feedback applied**: after the human-verify checkpoint, the redundant sidebar footer collapse button was removed (Header already owns the toggle), and the non-functional Create/Bell/Help buttons were removed from the Header. Unused imports (lucide `Plus`/`Bell`/`HelpCircle`/`PanelLeft` in sidebar; `Button` primitive in header) and the unused `setSidebarCollapsed` destructure in Sidebar were cleaned up. File-header comments in sidebar.tsx and header.tsx were updated to document the decisions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Sidebar, Header, and Breadcrumb components** -- `37bdb53` (feat)
2. **Task 2: Create AppShell layout, route group, and placeholder pages** -- `e2ed7b9` (feat)
3. **Task 3: Checkpoint human-verify** -- *(no commit; gate task)* resolved by post-verification fix commit below
4. **Post-checkpoint fix: remove redundant sidebar footer toggle and non-functional header actions** -- `f51747d` (fix)

**Plan metadata (final commit):** *(pending -- added after this summary is written as part of plan finalization)*

## Files Created/Modified

- `Frontend2/components/sidebar.tsx` -- Sidebar + SidebarLogo + NavItem + SidebarUserMenu; imports Avatar/Badge/Kbd from @/components/primitives; LayoutDashboard/FolderKanban/CheckSquare/Users/BarChart3/Settings/Shield/ChevronUp/LogOut from lucide-react; no PanelLeft (header owns the toggle); click-outside dismiss pattern for user menu
- `Frontend2/components/header.tsx` -- Header with sidebar toggle + Breadcrumb + search Input + theme + language; imports PanelLeft/Search/Moon/Sun from lucide-react; Input from @/components/primitives (Button dropped since Create button was removed)
- `Frontend2/components/breadcrumb.tsx` -- Breadcrumb pathname-switcher with Link for intermediate parts and ChevronRight separators
- `Frontend2/components/app-shell.tsx` -- AppShell wrapper: horizontal flex, Sidebar left, (Header + main) right; main has padding 24 + overflow auto
- `Frontend2/app/(shell)/layout.tsx` -- server-component layout that renders `<AppShell>{children}</AppShell>`
- `Frontend2/app/(shell)/dashboard/page.tsx` -- placeholder page
- `Frontend2/app/(shell)/projects/page.tsx` -- placeholder page
- `Frontend2/app/(shell)/my-tasks/page.tsx` -- placeholder page
- `Frontend2/app/(shell)/teams/page.tsx` -- placeholder page
- `Frontend2/app/(shell)/reports/page.tsx` -- placeholder page
- `Frontend2/app/(shell)/settings/page.tsx` -- placeholder page
- `Frontend2/app/page.tsx` -- `redirect('/dashboard')`

## Decisions Made

- **Single source of collapse control.** After the user's checkpoint feedback, the Header owns the PanelLeft sidebar-toggle button and the Sidebar footer no longer duplicates it. The Sidebar reads sidebarCollapsed from useApp() but never writes to it. This prevents UX inconsistency (two buttons doing the same thing) and makes the footer free for SidebarUserMenu without a visual competitor
- **Phase 8 header shows only wired controls.** The prototype header has Create/Notifications/Help buttons purely for visual completeness -- they are non-interactive there. In Next.js those same buttons look interactive (cursor pointer, click feedback) but do nothing, which is a worse UX than not showing them at all. They will return in the phases that introduce their handlers (Create -> Plan 10 project-create wizard, Notifications -> notification feed phase, Help -> help panel phase)
- **Route group over explicit /shell prefix.** `app/(shell)/layout.tsx` wraps every authenticated page with the AppShell markup without adding `/shell/` to URLs -- /dashboard, /projects, etc. read as top-level routes. This keeps the URL space clean and makes the shell/no-shell distinction a pure filesystem concern
- **Placeholder pages are server components.** No 'use client', no hooks, no primitives imported -- just JSX. They tree-shake cleanly, prerender as static, and don't participate in the client bundle. When a phase needs dynamic data, the page upgrades to a client component or moves to a server component with fetch() -- both are fine to compose under AppShell
- **Breadcrumb pathname switch, not route metadata.** A simple switch in Breadcrumb keeps the component independent of any metadata convention. When a phase needs dynamic labels (e.g., a project name on /projects/:id), the switch grows one case -- no framework changes required
- **Root redirect to /dashboard.** `app/page.tsx` redirects `/` to `/dashboard` so the bare domain lands on the canonical authenticated landing page. When auth lands in a later phase, this redirect can grow into a conditional (authenticated -> /dashboard, unauthenticated -> /login) without changing any consumer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - User-Directed Fix During Human-Verify Checkpoint] Removed redundant sidebar footer toggle and non-functional header actions**
- **Found during:** Task 3 (checkpoint:human-verify, gate=blocking) -- user inspected the rendered shell against the prototype and returned "Partially approved". Visual parity with the prototype was confirmed ("goruntude sorun yok") but the user flagged that (a) the sidebar footer's PanelLeft collapse button duplicates the Header's sidebar toggle, and (b) the Create/Notifications/Help buttons in the Header have no real handlers in Phase 8 scope ("mevcut tuslarin islevi yok, sanirim olmamasi lazim")
- **Issue:** Two redundant UI controls and three inert buttons leaking into the shell. The prototype is an HTML demo where inert buttons are cosmetic; in Next.js they suggest interactivity that is not implemented, creating UX drift from the user's expectations of Phase 8 scope
- **Fix:** In `Frontend2/components/sidebar.tsx` removed the footer `<div>` that rendered the PanelLeft button plus its mouseenter/leave handlers; removed the now-unused `PanelLeft` import and the unused `setSidebarCollapsed` destructure from `useApp()`; updated the file-header comment to document that the Header is the single source of collapse control. In `Frontend2/components/header.tsx` removed the Create `<Button>`, the Notifications `<button>` wrapping Bell + the unread-badge `<span>`, and the Help `<button>` wrapping HelpCircle; narrowed the lucide-react import line to `PanelLeft, Search, Moon, Sun`; narrowed the `@/components/primitives` import to `Input` only (Button no longer used locally); kept the hardcoded-0 unread-count variable out since Bell no longer renders; updated the file-header comment to document the Phase-8 scope decision
- **Files modified:** `Frontend2/components/sidebar.tsx`, `Frontend2/components/header.tsx`
- **Verification:** `npx next build` in `Frontend2/` passes cleanly (0 TS errors, 0 lint warnings, 10/10 static routes prerender) after the fix. Manually traced remaining header controls: sidebar toggle -> `app.setSidebarCollapsed`; search Input -> controlled placeholder only; Moon/Sun toggle -> `app.setMode`; TR/EN toggle -> `app.setLanguage` -- every visible control now has a wired handler
- **Committed in:** `f51747d` (fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 2: user-directed fix during human-verify checkpoint -- deferred prototype controls without handlers plus a redundant duplicate control)
**Impact on plan:** All FOUND-05 success criteria remain met (App Shell renders identically enough to the prototype that the user approved visual parity; the removed controls were cosmetic/non-functional in the prototype too). The plan's `must_haves.truths` line "Header renders at 52px height with sidebar toggle, breadcrumb, search Input, Create Button, bell, help, theme toggle, language toggle" is superseded by the user's explicit instruction -- Create/Bell/Help will return in the phases that wire their handlers. No scope creep.

## Issues Encountered

- Git line-ending warnings on both modified .tsx files during the fix commit (`LF will be replaced by CRLF`): Windows filesystem autocrlf behavior; purely informational. Matches prior 08-0x commit behavior
- Pre-existing untracked `package-lock.json` at the SPMS repo root was present during `git status` at fix-commit time. Not introduced by this plan; intentionally left alone per scope-boundary rule (only task-related files committed)

## Checkpoint Outcome

**Task 3 checkpoint (human-verify, gate=blocking):** Partially approved after manual verification. User ran `npm run dev` in Frontend2/, navigated to /dashboard, compared with `New_Frontend/SPMS Prototype.html`, and confirmed visual parity with the prototype. The redundant sidebar footer toggle and the non-functional header buttons (Create, Bell, Help) were removed per the user's feedback before plan completion. No other visual differences flagged. Theme toggle, language toggle, sidebar collapse (via Header toggle), and route navigation all verified working; localStorage persistence across refresh verified working.

## User Setup Required

None -- no external service configuration, no API keys, no environment variables needed. The App Shell is pure client/server Next.js code plus prototype primitives.

## Next Phase Readiness

- **Ready:** Plan 09-01+ can ship backend schema and endpoints without further frontend changes to the shell. When Phase 10 (Shell Pages & Project Features) begins, the AppShell layout is ready to host real page content -- `app/(shell)/dashboard/page.tsx`, `app/(shell)/projects/page.tsx`, `app/(shell)/settings/page.tsx`, and `app/(shell)/my-tasks/page.tsx` placeholders upgrade in place (same route, same layout, new body)
- **Create button re-entry:** Plan 10 (PROJ-01 Project Create Wizard) is the natural home for returning the Header Create button -- it will import `Plus` from lucide-react and `Button` from `@/components/primitives` and wire onClick to open the wizard. The removal in this plan is explicit and reversible
- **Notifications/Help re-entry:** Notifications re-enters when the notification feed phase arrives (future -- not in current 8-13 roadmap); Help re-enters when a help panel is introduced. Until then, their absence is intentional and documented in the header file-header comment
- **Phase 8 closure:** This is the last plan (4/4) of Phase 8. Phase-level verification / code review / regression gate are orchestrator responsibilities and will run after this summary lands. FOUND-05 is the final foundation requirement; once closed, FOUND-01..05 are all green

## Self-Check: PASSED

- `Frontend2/components/sidebar.tsx` -- FOUND (`'use client'` header, exports `Sidebar`, imports `usePathname` from `next/navigation`, imports `Link` from `next/link`, imports `Avatar/Badge/Kbd` from `@/components/primitives`, contains widths `56` and `232`, contains `0.18s` transition, contains `CALISMA`/`YONETIM` (and WORKSPACE/ADMIN) section labels, contains `'mousedown'` listener, NO PanelLeft import, NO setSidebarCollapsed destructure)
- `Frontend2/components/header.tsx` -- FOUND (`'use client'` header, exports `Header`, imports `Input` from `@/components/primitives` (no `Button`), imports `PanelLeft/Search/Moon/Sun` from `lucide-react` (no `Plus/Bell/HelpCircle`), contains `height: 52` and `position: "sticky"`, contains `Moon`/`Sun` conditional render, contains `lang.toUpperCase()` for language display)
- `Frontend2/components/breadcrumb.tsx` -- FOUND (exports `Breadcrumb`, imports `usePathname` from `next/navigation`, imports `ChevronRight` from `lucide-react`)
- `Frontend2/components/app-shell.tsx` -- FOUND (exports `AppShell`, imports `Sidebar` and `Header` as siblings, contains `flex min-h-screen` or equivalent)
- `Frontend2/app/(shell)/layout.tsx` -- FOUND (imports and renders `<AppShell>{children}</AppShell>`)
- `Frontend2/app/(shell)/dashboard/page.tsx` -- FOUND
- `Frontend2/app/(shell)/projects/page.tsx` -- FOUND
- `Frontend2/app/(shell)/my-tasks/page.tsx` -- FOUND
- `Frontend2/app/(shell)/teams/page.tsx` -- FOUND
- `Frontend2/app/(shell)/reports/page.tsx` -- FOUND
- `Frontend2/app/(shell)/settings/page.tsx` -- FOUND
- `Frontend2/app/page.tsx` -- contains `redirect("/dashboard")`
- Commit `37bdb53` -- FOUND in git log (Task 1)
- Commit `e2ed7b9` -- FOUND in git log (Task 2)
- Commit `f51747d` -- FOUND in git log (post-checkpoint fix)
- `npx next build` in `Frontend2/` -- PASSED (0 TS errors, 0 lint warnings, 10/10 static routes prerender) after the fix commit

---
*Phase: 08-foundation-design-system*
*Completed: 2026-04-21*
