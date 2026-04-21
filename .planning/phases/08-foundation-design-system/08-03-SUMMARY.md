---
phase: 08-foundation-design-system
plan: 03
subsystem: ui
tags: [nextjs, typescript, react, tailwind-v4, primitives, color-mix, i18n, status-blocked, barrel-export]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Frontend2 scaffold, globals.css with --status-*/--priority-* tokens, cn(), lib/i18n.ts t() + LangCode"
  - phase: 08-02
    provides: "Avatar/AvatarStack/Badge/Button/Card/Kbd/Tabs/Section primitives (imported by barrel + Kbd used by Input, Badge used by Collapsible)"
provides:
  - "PriorityChip primitive (rotated 45deg diamond + i18n-localized label; 4 levels with medium -> med token mapping)"
  - "StatusDot primitive (5 statuses including blocked for FOUND-04, using --status-* tokens directly)"
  - "Input primitive (container + icon slot + native input + Kbd hint; sm/md/lg heights 28/32/38)"
  - "ProgressBar primitive (percent-width inner bar with configurable color/bg/height)"
  - "SegmentedControl primitive (xs/sm sizes; active --shadow-sm + --inset-top raised look)"
  - "Collapsible primitive (lucide-react ChevronRight 0->90deg rotation; Badge for optional count)"
  - "AlertBanner primitive (4 tones: warning/danger/success/info with color-mix(in oklch,...) as inline styles)"
  - "Toggle primitive (sliding knob with --inset-primary-top/bottom on-state; left 0.12s transition)"
  - "components/primitives/index.ts barrel -- all 16 primitives re-exported (named + types) for @/components/primitives imports"
affects: [08-04-app-shell, all subsequent frontend phases consuming primitives]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client primitives: every component starts with \"use client\" (RULE 1)"
    - "Named function exports only (RULE 5) -- no default exports"
    - "Namespace React import: import * as React from \"react\" (RULE 2)"
    - "color-mix(in oklch, ...) tone expressions retained as inline style={} on AlertBanner -- not lowered to Tailwind arbitrary values (RULE 8)"
    - "--inset-primary-top/--inset-primary-bottom/--inset-top/--shadow-sm tokens composed in inline boxShadow strings for SegmentedControl active + Toggle on states"
    - "Prototype var() token names referenced directly (--primary, --surface, --surface-2, --border, --border-strong, --priority-*, --status-*, --inset-*, --shadow-*, --fg, --fg-muted, --fg-subtle, --radius-sm) -- zero mapping to shadcn naming (D-02)"
    - "Explicit TypeScript prop interfaces with optional className + style on every primitive (RULE 3, RULE 4)"
    - "Sibling imports with relative paths (./kbd from input, ./badge from collapsible) -- primitives form a self-contained unit"
    - "Barrel re-exports use explicit named form (export { X } from ./x) so IDE/tree-shaking resolve correctly; type exports use `export type { ... }`"
    - "PriorityChip token bridge: level='medium' maps to --priority-med (prototype CSS uses the shortened name)"
    - "ChevronRight imported from lucide-react (replaces prototype Icons.ChevronRight) -- matches CONTEXT.md Icon Replacement pattern"

key-files:
  created:
    - Frontend2/components/primitives/priority-chip.tsx
    - Frontend2/components/primitives/status-dot.tsx
    - Frontend2/components/primitives/input.tsx
    - Frontend2/components/primitives/progress-bar.tsx
    - Frontend2/components/primitives/segmented-control.tsx
    - Frontend2/components/primitives/collapsible.tsx
    - Frontend2/components/primitives/alert-banner.tsx
    - Frontend2/components/primitives/toggle.tsx
    - Frontend2/components/primitives/index.ts
  modified: []

key-decisions:
  - "PriorityChip token bridge: level='medium' maps to --priority-med at the token level while the public API keeps the 'medium' string (prototype CSS exposes --priority-med, not --priority-medium)"
  - "StatusDot typed as \"todo\"|\"progress\"|\"review\"|\"done\"|\"blocked\" with `var(--status-${status})` direct substitution -- simpler than prototype's nested ternary and maps 1:1 to CSS tokens including --status-blocked (FOUND-04)"
  - "AlertBanner tone -> CSS variable mapping hoisted to a module-level TONE_VARS Record<AlertTone,string> so it allocates once per module load (prototype inlined the ternary in the component body)"
  - "Toggle DIMS hoisted to module-level Record<ToggleSize, {w,h,d}> constant instead of per-render ternaries; offset (h-d)/2 precomputed once per render for left/top reuse"
  - "Barrel index.ts exports both values and types using the explicit `export type` syntax -- ensures isolatedModules compatibility and makes downstream imports symmetric (BadgeTone from the barrel just like Badge itself)"
  - "Input stays pure-controlled: accepts value + onChange with native ChangeEvent<HTMLInputElement> signature; no defensive value fallback because a truly uncontrolled use-case is rare enough to warrant a separate 'Uncontrolled' wrapper later"
  - "SegmentedControl size union narrowed to 'xs' | 'sm' (matches prototype); avoided introducing 'md'/'lg' that the prototype did not define"
  - "Collapsible guards the optional badge render with `badge != null` so a value of 0 still renders (matching the prototype semantics where 0 is a legal count)"

requirements-completed: [FOUND-02, FOUND-04]

# Metrics
duration: 3min
completed: 2026-04-21
---

# Phase 08 Plan 03: Primitives Batch 2 (PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle) + Barrel Export Summary

**Eight prototype-faithful TypeScript primitives completing the 16-component library, plus `components/primitives/index.ts` barrel re-exporting every primitive (value + type) for clean `@/components/primitives` imports. AlertBanner color-mix and Toggle inset-primary-* shadows preserved as inline styles. StatusDot supports "blocked" (FOUND-04).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-21T05:50:27Z
- **Completed:** 2026-04-21T05:53:08Z
- **Tasks:** 2
- **Files created:** 9
- **Files modified:** 0
- **Build status:** `npx next build` in Frontend2/ succeeded after each task and after the final barrel (4/4 pages, 0 TS errors, 0 lint warnings)

## Accomplishments

- All 8 primitives created under `Frontend2/components/primitives/` with TypeScript prop interfaces, named function exports, `"use client"` directive, and optional `className`/`style` props added per the conversion rules
- Barrel `components/primitives/index.ts` re-exports all 16 primitives (Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle) using the explicit `export { X } from ./x` form and `export type { ... }` for every component's companion types -- downstream consumers can `import { Badge, StatusDot, type BadgeTone } from "@/components/primitives"` directly
- Prototype visual fidelity preserved for every primitive:
  - **PriorityChip** renders an 8x8 px diamond via `transform: rotate(45deg)` with `var(--priority-${tokenLevel})` background; label text comes from `t(\`priority.${level}\`, lang)`; `"medium"` -> `"med"` bridge applied before template expansion
  - **StatusDot** renders a colored circle with `var(--status-${status})` -- all five statuses (todo/progress/review/done/blocked) map 1:1 to CSS tokens, with `--status-blocked` directly supporting FOUND-04
  - **Input** renders container with `boxShadow: "inset 0 0 0 1px var(--border)"`, sm/md/lg heights (28/32/38 from HEIGHTS Record), optional icon slot (color `var(--fg-subtle)`), transparent native input, optional `<Kbd>` hint
  - **ProgressBar** outer div has `height`, `bg`, `borderRadius: height`, `overflow: hidden`; inner div has `width: ${Math.min((value/max)*100, 100)}%`, `transition: width 0.2s`; defaults `color: var(--primary)`, `bg: var(--surface-2)`
  - **SegmentedControl** active option fills `var(--surface)` with `boxShadow: "var(--shadow-sm), var(--inset-top)"`; inactive is transparent with muted text; xs/sm sizing swaps padding/fontSize
  - **Collapsible** uses `ChevronRight` from lucide-react (`size={13}`) rotating `0deg` -> `90deg` via `transform` + 0.15s transition; Badge size="xs" tone="neutral" shown when `badge != null` so 0 still renders; content block only when `open` with `borderTop: "1px solid var(--border)"`
  - **AlertBanner** maps 4 tones to CSS vars (danger -> --priority-critical, success -> --status-done, info -> --status-progress, warning -> --status-review) and composes `color-mix(in oklch, var(${colorVar}) 10%, var(--surface))` background, `color-mix(in oklch, var(${colorVar}) 25%, transparent)` border, and `var(${colorVar})` text as inline styles
  - **Toggle** on-state wires `var(--inset-primary-top), var(--inset-primary-bottom)` and `var(--primary)` bg; off-state wires `inset 0 0 0 1px var(--border-strong)` and `var(--surface-2)` bg; knob slides with `left 0.12s` from `(h-d)/2` to `w - d - (h-d)/2`
- Sibling imports verified: `input.tsx` imports `Kbd` from `./kbd`; `collapsible.tsx` imports `Badge` from `./badge` and `ChevronRight` from `lucide-react`; barrel imports from the eight new siblings plus the eight existing siblings
- Zero shadcn references (`@/components/ui/`), zero shadcn token names (`var(--background)`, `var(--card)`, `var(--foreground)`) -- D-01 and D-02 both honored across all 9 files
- Build passes cleanly after each task: TypeScript errors = 0, lint warnings = 0, 4 static pages prerender as expected

## Task Commits

Each task was committed atomically:

1. **Task 1: PriorityChip, StatusDot, Input, ProgressBar** -- `31d3a13` (feat)
2. **Task 2: SegmentedControl, Collapsible, AlertBanner, Toggle + barrel export** -- `361f8d5` (feat)

## Files Created/Modified

- `Frontend2/components/primitives/priority-chip.tsx` -- `PriorityLevel` union, `PriorityChipProps`; imports `{ t, type LangCode }` from `@/lib/i18n`; handles medium -> med token bridge; rotated 45deg diamond with optional label
- `Frontend2/components/primitives/status-dot.tsx` -- `StatusValue` union (5 statuses including `"blocked"` for FOUND-04), `StatusDotProps`; renders `var(--status-${status})` colored circle with default size 8
- `Frontend2/components/primitives/input.tsx` -- `InputSize` union, `InputProps`; module-level `HEIGHTS` Record; inset border shadow container with optional icon + native input + optional Kbd hint; imports `Kbd` from `./kbd`
- `Frontend2/components/primitives/progress-bar.tsx` -- `ProgressBarProps`; default color `var(--primary)` and bg `var(--surface-2)`; `Math.min((value/max)*100, 100)` percentage; animated 0.2s width transition
- `Frontend2/components/primitives/segmented-control.tsx` -- `SegmentedSize` union (xs/sm), `SegmentedOption`, `SegmentedControlProps`; inline-flex container with active `var(--shadow-sm), var(--inset-top)` raised look; xs=3px 8px/11px, sm=4px 10px/11.5px
- `Frontend2/components/primitives/collapsible.tsx` -- `CollapsibleProps`; imports `ChevronRight` (lucide-react) + `Badge` (./badge); `React.useState(defaultOpen)`; chevron 0->90 rotation with 0.15s transition; optional badge rendered with `badge != null` (so 0 renders)
- `Frontend2/components/primitives/alert-banner.tsx` -- `AlertTone` union (4 tones), `AlertBannerProps`; module-level `TONE_VARS` map (danger/success/info/warning -> --priority-critical/--status-done/--status-progress/--status-review); color-mix(in oklch,...) bg + border + text color as inline styles
- `Frontend2/components/primitives/toggle.tsx` -- `ToggleSize` union, `ToggleProps`; module-level `DIMS` Record; sliding knob with `left 0.12s` transition; on-state uses `var(--inset-primary-top), var(--inset-primary-bottom)`; off-state uses `inset 0 0 0 1px var(--border-strong)`
- `Frontend2/components/primitives/index.ts` -- barrel re-exports all 16 primitives with explicit `export { X } from ./x` and companion types via `export type { ... }`; covers Avatar/AvatarStack/Badge/Button/Card/Kbd/Tabs/Section (Wave 2) + PriorityChip/StatusDot/Input/ProgressBar/SegmentedControl/Collapsible/AlertBanner/Toggle (Wave 3)

## Decisions Made

- **PriorityChip token bridge:** the prototype CSS file exposes `--priority-med` (not `--priority-medium`) so the component needs a name bridge between the public API ("medium") and the CSS token ("med"). A local `tokenLevel = level === "medium" ? "med" : level` variable handles this at the render site -- simpler than adding a map, and explicit about the one special case
- **StatusDot simpler than prototype:** the prototype's StatusDot nested five ternaries just to echo the status string back into the token name. Since every value in the union is a legal token suffix, direct template substitution `var(--status-${status})` is equivalent and lets the type system catch typos at compile time. This also makes adding new statuses a zero-body change
- **AlertBanner TONE_VARS module scope:** prototype re-derived the CSS variable name via a 3-way ternary on every render. Hoisting `TONE_VARS` to a module-level `Record<AlertTone, string>` allocates the map once per module load; the defensive `TONE_VARS[tone] || TONE_VARS.warning` fallback is kept for JS callers passing runtime strings outside the union
- **Toggle offset precomputation:** prototype re-evaluated `(h - d) / 2` three times (top, left on, left off) per render. Precomputing to a local `offset` variable and then reusing it keeps the math identical and makes the intent readable: `left: on ? w - d - offset : offset`
- **Barrel type exports:** every primitive gets its companion types re-exported via `export type { ... }` so consumers can `import { Badge, type BadgeTone } from "@/components/primitives"` symmetrically. This matches how Tabs exports `TabItem` and avoids the awkward split of importing components from the barrel but types from sibling files
- **Collapsible badge guard:** `badge != null` rather than truthy check so a numeric `0` still renders -- a count of zero is a legitimate display in several upstream contexts (e.g., a collapsed section with a computed empty list)

## Deviations from Plan

None -- the plan executed exactly as written. No Rule 1-4 deviations arose; no checkpoints are defined; no auth gates were encountered. Every acceptance criterion for both tasks was met on the first build.

## Issues Encountered

- Git line-ending warnings on every new .tsx/.ts file (`LF will be replaced by CRLF`): Windows filesystem autocrlf behavior; purely informational and does not affect file content when Git stores them as LF. Matches 08-01/08-02 commit behavior.

## User Setup Required

None -- no external service configuration, no API keys, no environment variables needed. These are pure presentational components that compile and render without any runtime setup.

## Next Phase Readiness

- **Ready:** Plan 08-04 (App Shell) can now import primitives via the single barrel (`@/components/primitives`) for the Header (`Button` Create action, `Input` search with `Kbd` Cmd+K hint, `Badge` nav counts, notification `Badge`), Sidebar (`Avatar` user area, `Kbd` shortcuts, `Badge` nav counts), Breadcrumb (no primitive dependency directly, but Card/Section likely for dashboard widgets), and all 16 UI eksik tamamlamalarin (via the Collapsible/AlertBanner/Toggle etc.)
- **Plan 08-04 direct consumers identified:** `Input` + `Kbd` used by Header search, `Button` used by Create action, `Avatar` + (later) `AvatarStack` used by SidebarUserMenu, `Badge` used by NavItem counts. All of these are now available under `@/components/primitives` with their prop interfaces and tone/size unions
- **Import patterns established:** every downstream consumer should prefer the barrel `@/components/primitives` over deep imports so the primitives folder remains internally refactorable (sibling file renames, type consolidation) without breaking callers
- **Build health:** `npx next build` in `Frontend2/` completes cleanly with 0 TypeScript errors and 0 lint warnings after every commit in this plan. Both static routes (`/` and `/_not-found`) prerender as expected

## Self-Check: PASSED

- `Frontend2/components/primitives/priority-chip.tsx` -- FOUND (starts `"use client"`, exports `PriorityChip`, imports `t, LangCode` from `@/lib/i18n`, contains `rotate(45deg)` and `"med"` bridge)
- `Frontend2/components/primitives/status-dot.tsx` -- FOUND (exports `StatusDot`, type includes `"blocked"` (FOUND-04), renders `var(--status-${status})`)
- `Frontend2/components/primitives/input.tsx` -- FOUND (exports `Input`, imports `Kbd` from `./kbd`, contains `inset 0 0 0 1px var(--border)` and HEIGHTS values 28/32/38)
- `Frontend2/components/primitives/progress-bar.tsx` -- FOUND (exports `ProgressBar`, contains `Math.min((value / max) * 100, 100)`, default color `var(--primary)` and bg `var(--surface-2)`)
- `Frontend2/components/primitives/segmented-control.tsx` -- FOUND (exports `SegmentedControl`, contains `var(--shadow-sm), var(--inset-top)` for active state)
- `Frontend2/components/primitives/collapsible.tsx` -- FOUND (exports `Collapsible`, imports `ChevronRight` from `"lucide-react"` and `Badge` from `"./badge"`, contains `rotate(90deg)`)
- `Frontend2/components/primitives/alert-banner.tsx` -- FOUND (exports `AlertBanner`, maps all 4 tones to `--priority-critical`/`--status-done`/`--status-progress`/`--status-review`, contains `color-mix(in oklch` inline)
- `Frontend2/components/primitives/toggle.tsx` -- FOUND (exports `Toggle`, contains `var(--inset-primary-top)` on-state shadow and `left 0.12s` knob transition)
- `Frontend2/components/primitives/index.ts` -- FOUND (16 `export { X } from ./x` statements covering all primitives; companion type exports via `export type`)
- All 8 new files start with `"use client"` directive -- VERIFIED via `head -1`
- No file imports from `@/components/ui/` -- VERIFIED (grep returned no matches)
- No file references `var(--background)`, `var(--card)`, or `var(--foreground)` (shadcn token names) -- VERIFIED (grep returned no matches)
- Commit `31d3a13` -- FOUND in git log (Task 1)
- Commit `361f8d5` -- FOUND in git log (Task 2)
- `npx next build` in Frontend2/ -- PASSED (0 TS errors, 0 lint warnings, 4 static routes) after every commit

---
*Phase: 08-foundation-design-system*
*Completed: 2026-04-21*
