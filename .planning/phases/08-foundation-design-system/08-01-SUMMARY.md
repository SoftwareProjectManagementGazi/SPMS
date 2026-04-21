---
phase: 08-foundation-design-system
plan: 01
subsystem: ui
tags: [nextjs, tailwind-v4, typescript, oklch, theme-tokens, i18n, react-context]

# Dependency graph
requires:
  - phase: --
    provides: "(no prior phase -- Frontend2 is built from scratch)"
provides:
  - "Frontend2/ Next.js 16 + Tailwind v4 + TypeScript project scaffold"
  - "Prototype CSS token system (--bg/--surface/--fg family + status/priority/shadow/inset/avatar)"
  - "6 theme presets (default/ocean/forest/monochrome/midnight/graphite) with exact oklch values"
  - "deriveFromBrand() for custom brand colors from any oklch hue"
  - "applyTokens/applyMode/applyRadius/resolvePreset theme runtime utilities"
  - "STRINGS dictionary (TR default + EN) with nav, common, priority, dashboard, project, workflow sections"
  - "t(path, lang) dot-notation resolver with Turkish fallback (D-06)"
  - "AppProvider/useApp with localStorage persistence (spms.* keys) and mode auto-switch"
affects: [08-02-primitives, 08-03-primitives, 08-04-app-shell, all subsequent frontend phases]

# Tech tracking
tech-stack:
  added: [next@16.2.4, react@19.2.4, tailwindcss@4, typescript@5, clsx, tailwind-merge, @tanstack/react-query, axios, lucide-react, inter-font, geist-mono-font]
  patterns: ["Prototype CSS token names used directly (D-02)", "Tailwind v4 @custom-variant dark targeting [data-mode=\"dark\"]", "Client-only React context provider with localStorage persistence via try/catch", "SSR-safe theme effects guarded by typeof document/window checks", "cn() utility for className merging (clsx + tailwind-merge)"]

key-files:
  created:
    - Frontend2/package.json
    - Frontend2/tsconfig.json
    - Frontend2/app/globals.css
    - Frontend2/app/page.tsx
    - Frontend2/lib/utils.ts
    - Frontend2/lib/theme.ts
    - Frontend2/lib/i18n.ts
    - Frontend2/context/app-context.tsx
  modified:
    - Frontend2/app/layout.tsx

key-decisions:
  - "Scaffolded via create-next-app with lowercase 'frontend2' name, then renamed to 'Frontend2' (npm name restriction forbids capital letters)"
  - "globals.css uses prototype token names directly per D-02 (no mapping to --background/--card/--foreground)"
  - "Used Tailwind v4 @custom-variant dark directive (scaffold landed Tailwind 4 with @import tailwindcss syntax)"
  - "next/font Inter + Geist_Mono exposed as --font-sans / --font-mono CSS variables on body className"
  - "localStorage helpers gated on typeof window === 'undefined' for SSR safety"
  - "applyTokens/applyMode/applyRadius guarded by typeof document checks to support SSR-side import"

patterns-established:
  - "CSS token hierarchy: core surface/fg/border/primary/accent/ring + semantic status/priority + depth shadow/inset + utility avatar -- all using prototype naming"
  - "Theme runtime split: resolvePreset + applyTokens + applyMode + applyRadius (imperative DOM writes from effects)"
  - "i18n: single STRINGS literal + t(path, lang) resolver, Turkish fallback default"
  - "App-level context: useApp() throws when outside provider; memoized value object"
  - "Mode auto-switch couples light presets (default/ocean/forest/monochrome) with light mode and dark presets (midnight/graphite) with dark mode when customColors is false"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04]

# Metrics
duration: 6min
completed: 2026-04-21
---

# Phase 08 Plan 01: Foundation Scaffold & Theme Infrastructure Summary

**Frontend2 Next.js 16 + Tailwind v4 project with full prototype CSS token system, 6-preset theme runtime with deriveFromBrand(), Turkish-default i18n resolver, and AppProvider context wired through root layout.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-21T05:31:26Z
- **Completed:** 2026-04-21T05:37:35Z
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 1
- **Build status:** `npx next build` succeeded after each task

## Accomplishments

- Frontend2/ scaffolded from scratch as a Next.js 16 + TypeScript + Tailwind v4 project; no shadcn/ui, no components.json, no @shadcn packages
- Full prototype CSS token system in `app/globals.css` using prototype names directly (--bg, --surface, --fg, --status-blocked, --priority-med, --av-1...--av-8, five shadow levels, five inset tokens, density selectors) with light defaults and [data-mode="dark"] overrides
- `lib/theme.ts` ports all six presets verbatim (default, ocean, forest, monochrome, midnight, graphite) with exact oklch values and exposes `deriveFromBrand`, `applyTokens`, `applyMode`, `applyRadius`, `resolvePreset`, `oklchLightness`, `estimateContrast`
- `lib/i18n.ts` ports the complete STRINGS object (nav, common with 26 keys including draft/saved/unsaved, priority, dashboard, project, workflow sections) with Turkish/English values verbatim and a typed `t(path, lang)` resolver defaulting to Turkish
- `context/app-context.tsx` provides AppProvider + useApp with localStorage persistence (spms.* keys), theme application effects, radius application, density attribute wiring, and the mode auto-switch between light/dark preset pairs
- `app/layout.tsx` wraps children with AppProvider, applies Inter + Geist Mono via next/font/google as --font-sans / --font-mono CSS variables, uses `suppressHydrationWarning` on the html element, sets lang="tr" and SPMS metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Frontend2 project + prototype globals.css** — `fe2ee84` (feat)
2. **Task 2: Theme system + i18n + AppContext + layout wiring** — `81a1b5e` (feat)

## Files Created/Modified

- `Frontend2/package.json` — scaffolded, with runtime deps added (clsx, tailwind-merge, @tanstack/react-query, axios, lucide-react); no shadcn packages
- `Frontend2/tsconfig.json` — scaffolded with `@/*` path alias already configured
- `Frontend2/app/globals.css` — prototype token system; @import "tailwindcss", @custom-variant dark, :root + [data-mode="dark"] blocks, density selectors, base reset + scrollbar styles
- `Frontend2/app/page.tsx` — minimal placeholder home page (`<main className="p-6"><h1>SPMS Frontend2</h1></main>`)
- `Frontend2/app/layout.tsx` — AppProvider wrapping, next/font Inter + Geist Mono, suppressHydrationWarning, lang="tr", metadata
- `Frontend2/lib/utils.ts` — `cn()` helper combining clsx + tailwind-merge
- `Frontend2/lib/theme.ts` — TypeScript port of theme.jsx: 6 PRESETS with exact oklch values, deriveFromBrand, applyTokens/Mode/Radius, resolvePreset, contrast utilities
- `Frontend2/lib/i18n.ts` — TypeScript port of i18n.jsx: full STRINGS dictionary + typed t() resolver
- `Frontend2/context/app-context.tsx` — AppProvider with localStorage persistence, theme effects, mode auto-switch, custom brand color support

## Decisions Made

- **npm naming workaround:** `create-next-app` rejects capital letters in the project name, so scaffolding used lowercase `frontend2` followed by a rename to `Frontend2` via intermediate directory (npm is not involved again after scaffold). Package.json still carries `"name": "frontend2"` (lowercase), which is invisible outside npm and required for npm validation; the on-disk folder is `Frontend2` as specified in CONTEXT.md.
- **Tailwind v4 in scaffold:** Next 16 scaffolded Tailwind 4, so `@import "tailwindcss"` plus `@custom-variant dark (...)` is used exactly as the patterns doc specifies. No legacy `@tailwind base/components/utilities` directives needed.
- **Token names per D-02:** `applyTokens` writes CSS properties using prototype names directly (`--bg`, `--surface`, `--fg`, etc.) with zero mapping to shadcn's `--background/--card/--foreground` naming. Decision override of RESEARCH.md documented inline in theme.ts comment.
- **SSR-safety for theme effects:** `applyTokens`, `applyMode`, `applyRadius` all guard against missing `document` so the module can be imported from server boundaries without crashing. localStorage helpers similarly guard on `typeof window`.
- **Font wiring:** Used `next/font/google` Inter + Geist_Mono with `variable: "--font-sans"` and `variable: "--font-mono"` — prototype's `--font-sans` declaration in globals.css provides the fallback stack, and next/font overrides it on the body via the scoped className.

## Deviations from Plan

**1. [Rule 3 - Blocking] npm naming restriction required lowercase scaffold then rename**
- **Found during:** Task 1 (scaffold Frontend2)
- **Issue:** `npx create-next-app@latest Frontend2 ...` failed with "name can no longer contain capital letters"
- **Fix:** Ran scaffold with lowercase `frontend2`, then renamed the directory to `Frontend2` via `mv frontend2 Frontend2-tmp && mv Frontend2-tmp Frontend2` (Windows case-insensitive rename workaround). The on-disk folder name now matches CONTEXT.md exactly.
- **Files modified:** (directory rename, no file changes)
- **Verification:** `ls` confirms `Frontend2/` (capital F) exists; package.json `name` is "frontend2" (lowercase, required by npm) which does not affect on-disk paths, import aliases, or external interfaces.
- **Committed in:** fe2ee84 (Task 1)

**2. [Rule 3 - Blocking] create-next-app flag `--src-dir=false` replaced with `--no-src-dir`**
- **Found during:** Task 1 (scaffold invocation)
- **Issue:** Plan used `--src-dir=false` which is not a valid create-next-app flag in v16.
- **Fix:** Used `--no-src-dir` (the correct boolean-off form for create-next-app).
- **Files modified:** (none -- CLI invocation only)
- **Verification:** Scaffold succeeded; `Frontend2/app/` exists at project root (not `Frontend2/src/app/`).
- **Committed in:** fe2ee84 (Task 1)

**3. [Rule 3 - Blocking] Local git identity required via `-c` flags**
- **Found during:** Task 1 commit
- **Issue:** No git user.name or user.email configured in the repo or globally; `git commit` aborted with "Author identity unknown".
- **Fix:** Used `git -c user.email=cakarert123@gmail.com -c user.name=ERTUGRUL commit -m ...` to supply the identity inline for each commit. Per GSD rules, `git config --global` is prohibited; inline `-c` flags are scoped to a single invocation and do not modify persistent config.
- **Files modified:** (none)
- **Verification:** Both commits recorded (`fe2ee84`, `81a1b5e`) with the provided identity.
- **Committed in:** fe2ee84 and 81a1b5e

---

**Total deviations:** 3 auto-fixed (all Rule 3 blocking issues encountered during Task 1 setup)
**Impact on plan:** All deviations are mechanical CLI/environment corrections with zero impact on plan scope, acceptance criteria, or file structure. Every acceptance criterion in both tasks was met.

## Issues Encountered

- Two PreToolUse:Edit/Write hook reminders fired on `globals.css`, `page.tsx`, and `layout.tsx` even though those files had been Read earlier in the session. The writes succeeded in each case; hook warnings were informational rather than blocking.

## User Setup Required

None — no external service configuration, API keys, or environment variables needed for this plan.

## Next Phase Readiness

- **Ready:** Primitive component phases (08-02, 08-03) and App Shell (08-04) can now import from `@/lib/theme`, `@/lib/i18n`, `@/context/app-context`, and `@/lib/utils` (cn). All files use `@/*` path alias. Components can call `useApp()` to consume language, mode, preset, density, and sidebar state.
- **Build health:** `npx next build` in Frontend2/ completes cleanly with 0 TypeScript errors and 0 lint warnings. Both static routes (`/` and `/_not-found`) prerender as expected.
- **Token verification:** `grep -nE "^--(bg|surface|fg|status-blocked|priority-med|av-1|inset-top|shadow-sm):" Frontend2/app/globals.css` returns the expected prototype names, confirming D-02 is honored.

## Self-Check: PASSED

- `Frontend2/package.json` — FOUND (contains next, react, clsx, tailwind-merge, @tanstack/react-query, axios, lucide-react; no @shadcn)
- `Frontend2/tsconfig.json` — FOUND (`"@/*": ["./*"]` path alias)
- `Frontend2/app/globals.css` — FOUND (contains --bg, --surface, --fg, --status-blocked, --priority-med, --av-1..--av-8, --shadow-sm..--shadow-xl, --inset-top in :root + [data-mode="dark"], density selectors, @custom-variant dark)
- `Frontend2/app/page.tsx` — FOUND
- `Frontend2/app/layout.tsx` — FOUND (imports AppProvider, suppressHydrationWarning, lang="tr")
- `Frontend2/lib/utils.ts` — FOUND (exports `cn`)
- `Frontend2/lib/theme.ts` — FOUND (exports PRESETS with all 6 keys, deriveFromBrand, applyTokens with prototype names, applyMode with dataset.mode, applyRadius, resolvePreset)
- `Frontend2/lib/i18n.ts` — FOUND (exports STRINGS with nav/common/priority/dashboard/project/workflow; common contains draft/saved/unsaved; t() with `lang: LangCode = "tr"` default)
- `Frontend2/context/app-context.tsx` — FOUND (starts with "use client", exports useApp + AppProvider, localStorage.getItem("spms.*), mode auto-switch with midnight/default preset switching)
- `Frontend2/components.json` — CORRECTLY ABSENT (no shadcn initialization)
- Commit `fe2ee84` — FOUND in git log
- Commit `81a1b5e` — FOUND in git log

---
*Phase: 08-foundation-design-system*
*Completed: 2026-04-21*
