---
phase: 08-foundation-design-system
plan: 02
subsystem: ui
tags: [nextjs, typescript, react, tailwind-v4, primitives, oklch, color-mix, inset-shadows]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Frontend2 scaffold, globals.css prototype tokens, cn() helper, @/lib + @/context path aliases"
provides:
  - "Avatar primitive (initials on --av-* colored background with optional focus ring)"
  - "AvatarStack primitive (-6px overlap layout with +N overflow circle)"
  - "Badge primitive (7 tones: neutral/primary/success/warning/danger/info/mono; 2 sizes: xs/sm; color-mix bgs as inline styles)"
  - "Button primitive (5 variants: primary/secondary/ghost/subtle/danger; 5 sizes: xs/sm/md/lg/icon; --inset-* shadow tokens; translateY(0.5px) mouseDown feedback)"
  - "Card primitive (--shadow + --inset-card depth; interactive prop lifts to --shadow-md + translateY(-1px))"
  - "Kbd primitive (mono keyboard hint with inset border shadow)"
  - "Tabs primitive (bar with 2px solid var(--primary) active underline; Badge for tab.badge counts)"
  - "Section primitive (heading with optional subtitle + action slot over children)"
affects: [08-03-primitives, 08-04-app-shell, all subsequent frontend phases consuming primitives]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client primitives: every component starts with \"use client\" (RULE 1)"
    - "Named function exports only (RULE 5) -- no default exports, consistent with barrel export plan"
    - "Namespace React import: import * as React from \"react\" (RULE 2)"
    - "color-mix(in oklch, ...) tone expressions retained as inline style={} on Badge -- not lowered to Tailwind arbitrary values (RULE 8)"
    - "--inset-primary-top/--inset-primary-bottom/--inset-top/--inset-bottom tokens composed in inline boxShadow strings for Button raised-look"
    - "Prototype var() token names referenced directly (--bg, --surface, --fg, --primary, --inset-*) -- zero mapping to shadcn naming (D-02)"
    - "Explicit TypeScript prop interfaces with optional className + style on every primitive (RULE 3, RULE 4)"
    - "Card inline mouseEnter/mouseLeave handlers mutate currentTarget.style for hover lift (prototype pattern preserved)"
    - "Sibling imports with relative paths (./avatar, ./badge) -- primitives form a self-contained unit"

key-files:
  created:
    - Frontend2/components/primitives/avatar.tsx
    - Frontend2/components/primitives/avatar-stack.tsx
    - Frontend2/components/primitives/badge.tsx
    - Frontend2/components/primitives/button.tsx
    - Frontend2/components/primitives/card.tsx
    - Frontend2/components/primitives/kbd.tsx
    - Frontend2/components/primitives/tabs.tsx
    - Frontend2/components/primitives/section.tsx
  modified: []

key-decisions:
  - "AvatarStackUser extends AvatarUser with an id field (id: string | number); primitives.jsx uses u.id for the key prop but only typed initials/avColor -- making id explicit in TypeScript preserves the prototype contract without silently accepting any shape"
  - "cn() used on Kbd only (where the \"mono\" utility class is merged with an optional caller className); other primitives apply className directly because their base uses inline style, and Tailwind utilities from the caller never conflict with our style-driven base"
  - "CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, \"style\" | \"children\"> so consumers can pass through arbitrary div attributes (data-*, aria-*, onClick, etc.) while our explicit style and children props retain their precise types"
  - "Tone/size maps hoisted out of component bodies as module-level Records so they allocate once per module load rather than per render; same shape as the prototype's local const objects"
  - "Kept the prototype's fallback (tones[tone] || tones.neutral) even though the BadgeTone union prevents invalid inputs at the type level -- defensive at runtime if a JS consumer (e.g. from shell glue) passes an unexpected string"
  - "Active Button state (active prop) overrides variant background/color via a tail-spread object so variant visual stays the base and active only swaps the two fields -- matches prototype ordering"

requirements-completed: [FOUND-02]

# Metrics
duration: 2min
completed: 2026-04-21
---

# Phase 08 Plan 02: Primitives Batch 1 (Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section) Summary

**Eight prototype-faithful TypeScript primitives with `"use client"`, named exports, and prototype token references -- Badge color-mix and Button inset shadows preserved as inline styles.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-21T05:43:07Z
- **Completed:** 2026-04-21T05:45:34Z
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 0
- **Build status:** `npx next build` in Frontend2/ succeeded after each task (4/4 pages, 0 TS errors, 0 lint warnings)

## Accomplishments

- All 8 primitives created under `Frontend2/components/primitives/` with TypeScript prop interfaces, named function exports, `"use client"` directive, and optional `className`/`style` props added per the conversion rules
- Prototype visual fidelity preserved for every primitive:
  - **Avatar** renders `var(--av-${user.avColor || 1})` background with `#fff` initials; the `ring` prop toggles `0 0 0 2px var(--surface), 0 0 0 4px var(--primary)` focus shadow vs default inset 0 0 0 1px oklch(0 0 0 / 0.08)
  - **AvatarStack** overlaps with `marginLeft: i === 0 ? 0 : -6` and `zIndex: 10 - i`; overflow `+N` circle uses `var(--surface-2)` bg with `var(--fg-muted)` text, ringed by `0 0 0 2px var(--surface), inset 0 0 0 1px var(--border)`
  - **Badge** renders 7 tones with color-mix backgrounds as inline styles (neutral/primary/success/warning/danger/info/mono), two sizes (xs 18px/10.5px, sm 20px/11.5px), and an optional 6x6 dot in `s.fg`
  - **Button** renders 5 variants and 5 sizes; primary wires `var(--inset-primary-top)` + `var(--inset-primary-bottom)`; secondary wires `var(--inset-top)` + `var(--inset-bottom)` + `inset 0 0 0 1px var(--border-strong)`; mouseDown applies `translateY(0.5px)` and mouseUp/mouseLeave restores `translateY(0)`; active prop swaps to `var(--accent)` / `var(--accent-fg)`
  - **Card** applies `var(--shadow), var(--inset-card)` at rest; interactive mode transitions to `var(--shadow-md), var(--inset-card)` + `translateY(-1px)` on mouseEnter and restores on mouseLeave
  - **Kbd** uses the `.mono` utility class from globals.css (merged via `cn()`) with `inset 0 0 0 1px var(--border), 0 1px 0 var(--border)` double-shadow border
  - **Tabs** renders active tab with `2px solid var(--primary)` bottom border and `fontWeight: 600`; imports `Badge` for the optional `tab.badge` count (xs size, primary when active, neutral otherwise)
  - **Section** renders 13px/600 title, optional 12px subtitle in `var(--fg-muted)`, and right-aligned action slot over children with `marginBottom: 12`
- Two sibling imports verified: `avatar-stack.tsx` imports `Avatar` + `AvatarUser` from `./avatar`; `tabs.tsx` imports `Badge` from `./badge`
- Zero shadcn references (`@/components/ui/`), zero shadcn token names (`var(--background)`, `var(--card)`, `var(--foreground)`) -- D-01 and D-02 both honored across all 8 files
- Build passes cleanly after each task: TypeScript errors = 0, lint warnings = 0, 4 static pages prerender as expected

## Task Commits

Each task was committed atomically:

1. **Task 1: Avatar, AvatarStack, Badge, Button** — `2478e49` (feat)
2. **Task 2: Card, Kbd, Tabs, Section** — `ff65093` (feat)

## Files Created/Modified

- `Frontend2/components/primitives/avatar.tsx` — `AvatarUser` + `AvatarProps` types, renders initials on `--av-*` bg with optional focus ring
- `Frontend2/components/primitives/avatar-stack.tsx` — `AvatarStackUser` (extends `AvatarUser` with `id`) + `AvatarStackProps`; imports `Avatar`, applies -6px overlap and +N overflow circle
- `Frontend2/components/primitives/badge.tsx` — `BadgeTone` union (7 values), `BadgeSize` union (xs/sm), module-level `TONES` record with color-mix expressions and `SIZES` record; renders span with inline style map
- `Frontend2/components/primitives/button.tsx` — `ButtonVariant` union (5), `ButtonSize` union (5), module-level `VARIANTS` + `SIZES`; handles disabled, active, mouse feedback transform, and exposes icon/iconRight slots
- `Frontend2/components/primitives/card.tsx` — `CardProps` extends Omit<HTMLDivAttributes, "style"|"children">; spreads rest to underlying div, conditional mouseEnter/mouseLeave only when `interactive`
- `Frontend2/components/primitives/kbd.tsx` — `KbdProps`, span with `cn("mono", className)`, inline inset+offset border shadow
- `Frontend2/components/primitives/tabs.tsx` — `TabsSize`, `TabItem`, `TabsProps`; module-level `PAD_MAP` + `FONT_MAP`; uses `Badge` for counts and the 2px primary underline for active
- `Frontend2/components/primitives/section.tsx` — `SectionProps`, two-row layout with flex-end aligned header and children below

## Decisions Made

- **AvatarStack id typing:** prototype uses `u.id` for React keys but the TS port needed an explicit shape; introduced `AvatarStackUser extends AvatarUser` with `id: string | number` so consumers get a precise error when an `id` is missing rather than a runtime-only warning
- **cn() scope:** only Kbd uses `cn()` because it merges the `.mono` utility class. The other 7 primitives are style-driven at the base level, so any caller `className` can be assigned directly without utility-class conflict resolution; `tailwind-merge` would be overhead with zero benefit on the inline-style surfaces
- **CardProps rest passthrough:** `CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "children">` so consumers can spread `data-*`, `aria-*`, `onClick` onto the root div while keeping our typed `style` and `children` intact. The prototype used `{...rest}` implicitly; the TS port makes this contract explicit
- **Tone/size records at module scope:** prototype re-allocates the maps in every render; the port hoists them out of the component body as module-level `Record<Union, ...>` constants (allocate once, reference by name). Zero semantic change, lower per-render cost
- **Defensive fallback retained in Badge:** the union type prevents invalid tone at compile time, but `TONES[tone] || TONES.neutral` stays for JS callers (e.g. dynamic tone strings passed from glue code) -- matches prototype behavior

## Deviations from Plan

None -- the plan executed exactly as written. No Rule 1-4 deviations arose; no checkpoints are defined; no auth gates were encountered. Every acceptance criterion for both tasks was met on the first build.

## Issues Encountered

- Git line-ending warnings on every new .tsx file (`LF will be replaced by CRLF`): Windows filesystem autocrlf behavior; purely informational and does not affect file content when Git stores them as LF. Matches the 08-01 commit behavior.

## User Setup Required

None -- no external service configuration, no API keys, no environment variables needed. These are pure presentational components that compile and render without any runtime setup.

## Next Phase Readiness

- **Ready:** Plan 08-03 can now port the remaining 8 primitives (PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle) and add the barrel export `components/primitives/index.ts`. The App Shell (08-04) can consume `Button` in the Header (Create action), `Kbd` + `Badge` in Sidebar nav items, `Avatar` + `AvatarStack` in the user menu / project member UI, `Card` in dashboard widgets, `Tabs` in project detail, and `Section` as the page-header layout building block
- **Import patterns established:** primitives import siblings via relative paths (`./avatar`, `./badge`). Downstream consumers will import from the forthcoming barrel (`@/components/primitives`) -- sibling paths inside the folder remain stable under that aggregation
- **Build health:** `npx next build` in `Frontend2/` completes cleanly with 0 TypeScript errors and 0 lint warnings after every commit in this plan. Both static routes (`/` and `/_not-found`) prerender as expected

## Self-Check: PASSED

- `Frontend2/components/primitives/avatar.tsx` — FOUND (starts `"use client"`, exports `Avatar`, contains `var(--av-${user.avColor`)
- `Frontend2/components/primitives/avatar-stack.tsx` — FOUND (exports `AvatarStack`, contains `marginLeft: i === 0 ? 0 : -6`, imports from `./avatar`)
- `Frontend2/components/primitives/badge.tsx` — FOUND (exports `Badge`, all 7 tone keys present -- neutral/primary/success/warning/danger/info/mono -- with `color-mix(in oklch` occurrences in inline styles)
- `Frontend2/components/primitives/button.tsx` — FOUND (exports `Button`, all 5 variant keys present -- primary/secondary/ghost/subtle/danger -- with `var(--inset-primary-top)`, `var(--inset-primary-bottom)`, and `translateY(0.5px)`)
- `Frontend2/components/primitives/card.tsx` — FOUND (exports `Card`, contains `var(--shadow), var(--inset-card)` at rest and `var(--shadow-md)` in the interactive mouseEnter)
- `Frontend2/components/primitives/kbd.tsx` — FOUND (exports `Kbd`, `"mono"` class merged via `cn`, contains `inset 0 0 0 1px var(--border), 0 1px 0 var(--border)`)
- `Frontend2/components/primitives/tabs.tsx` — FOUND (exports `Tabs`, imports from `./badge`, contains `2px solid var(--primary)` for active underline)
- `Frontend2/components/primitives/section.tsx` — FOUND (exports `Section`, renders title + optional subtitle + action + children)
- All 8 files start with `"use client"` directive — VERIFIED
- No file imports from `@/components/ui/` — VERIFIED
- No file references `var(--background)`, `var(--card)`, or `var(--foreground)` (shadcn token names) — VERIFIED
- Commit `2478e49` — FOUND in git log
- Commit `ff65093` — FOUND in git log
- `npx next build` in Frontend2/ — PASSED (0 TS errors, 0 lint warnings, 4 static routes)

---
*Phase: 08-foundation-design-system*
*Completed: 2026-04-21*
