# Phase 8: Foundation & Design System - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the base infrastructure for all subsequent frontend work: theme token system (6 presets + custom brand derivation), full primitive component library (16 components), i18n (TR/EN), and App Shell conversion from HTML prototype to Next.js — with zero visual change from the prototype design.

**Source of truth:** `New_Frontend/` directory contains the HTML prototype. All conversion work references this prototype.

**CRITICAL CONSTRAINT — Parallel Folder Strategy:**
- The existing `Frontend/` folder MUST NOT be modified during this phase or any v2.0 rebuild phase
- A new `Frontend2/` folder will be created as a fresh Next.js project, built from scratch using the `New_Frontend/` prototype as the design reference
- When all frontend rebuild phases are complete, `Frontend2/` will be renamed to `Frontend` and the legacy folder deleted
- All file paths in this phase target `Frontend2/`, NOT `Frontend/`
- NOTHING is copied from `Frontend/` — no shadcn/ui, no components, no context, no utils
- ALL UI comes 100% from the `New_Frontend/` prototype — birebir aynı görünecek
- shadcn/ui is NOT used at all — not even for overlays. All components are built from prototype

</domain>

<decisions>
## Implementation Decisions

### Theme Token Migration
- **D-01:** ALL components come from the prototype (`New_Frontend/src/primitives.jsx`) and will be converted to TypeScript React components. shadcn/ui is NOT used at all — not even for overlays. Every UI element must be 100% faithful to the prototype design.
- **D-02:** Token names from the prototype will be used directly as-is (`--bg`, `--bg-2`, `--surface`, `--surface-2`, `--fg`, `--fg-subtle`, `--border`, `--border-strong`, `--primary`, `--primary-hover`, `--primary-fg`, `--inset-*`, `--status-*`, `--priority-*`, `--shadow-*`). No mapping to shadcn naming conventions — the prototype's token system IS the design system. Theme presets and `deriveFromBrand()` function ported directly from `theme.jsx`.

### Primitive Component Design
- **D-03:** All 16 primitive components from `primitives.jsx` will be converted in this phase: Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle. This gives subsequent phases a complete, ready-to-use component library.
- **D-04:** Inline styles from the prototype will be converted to Tailwind CSS utility classes — matching the existing project convention. CSS custom properties (token references) will be used via Tailwind's `var()` syntax where needed.

### I18n Architecture
- **D-05:** Simple i18n approach — `useApp().language` React context provides the current language, `t()` function resolves dot-notation keys (e.g., `t('nav.dashboard')`), all strings stored in a single `strings.ts` file. The prototype's `i18n.jsx` STRINGS object will be directly ported. No external i18n library (next-intl, react-i18next, etc.) will be used.
- **D-06:** Default language is Turkish (tr). Language switching will be available through Settings. The `t()` function falls back to Turkish if a key's English translation is missing.

### App Shell Conversion
- **D-07:** App Shell will be created in `Frontend2/` from the prototype (`shell.jsx`) as new TSX files. This includes Sidebar (collapsible, nav items with keyboard shortcuts, admin section, user area), Header (breadcrumb, search, notifications, theme toggle, create button, user menu), and the AppContext provider. The existing `Frontend/components/app-shell.tsx` is NOT modified.
- **D-08:** Full theme system implemented in this phase — 6 color presets (Default/Terracotta, Ocean, Forest, Monochrome, Midnight, Graphite), light/dark mode toggle, and custom brand color derivation via `deriveFromBrand()`. All integrated into the App Shell header.
- **D-09:** Next.js App Router used for routing — prototype's client-side RouterContext is removed. File-based routing (`/dashboard`, `/projects`, `/settings`, etc.) replaces the SPA-style page switching. Navigation components updated to use `next/link` and `useRouter` from `next/navigation`.

### Claude's Discretion
- Component file organization (e.g., `components/primitives/` vs `components/ui/` vs flat structure)
- Whether to split `strings.ts` into multiple files by feature area or keep it monolithic
- Specific Tailwind class choices for prototype fidelity (exact spacing, sizing)
- Whether `AppContext` stays in a single provider or splits into `ThemeContext` + `LanguageContext`
- `data-mode="dark"` attribute from prototype for dark mode switching

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files
- `New_Frontend/SPMS Prototype.html` — Full HTML prototype with CSS tokens, base styles, and page structure
- `New_Frontend/src/theme.jsx` — 6 theme presets, deriveFromBrand(), applyTokens(), applyMode(), contrast utilities
- `New_Frontend/src/primitives.jsx` — All 16 primitive components (Avatar through Toggle) with full API and styling
- `New_Frontend/src/i18n.jsx` — STRINGS object with TR/EN translations, t() function
- `New_Frontend/src/shell.jsx` — Sidebar, Header, NavItem, AppContext, RouterContext, useApp()
- `New_Frontend/src/icons.jsx` — Icon components used throughout prototype
- `New_Frontend/src/data.jsx` — Mock data structure (shows expected data shapes)
- `New_Frontend/src/tweaks.jsx` — Theme tweaks panel (reference for Settings theme UI)

### Build Target (new folder — built from scratch)
- `Frontend2/` — New Next.js project created from scratch in this phase. All output goes here.
- `Frontend/` is IGNORED — nothing is read from or copied from the legacy frontend.

### Project Context
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-05 requirements for this phase
- `.planning/codebase/CONVENTIONS.md` — Frontend naming, import, and component conventions

</canonical_refs>

<code_context>
## Code Insights

### Patterns for Frontend2/ (fresh project)
- All client components use `"use client"` directive
- Named exports for components (`export function ComponentName`)
- `@/` path alias for all imports
- TanStack Query for server state
- `React.useState` (namespace access, not destructured)

### Frontend2/ Structure (100% from prototype)
- `Frontend2/app/layout.tsx` — Root layout where AppContext provider and theme setup goes
- `Frontend2/app/globals.css` — CSS tokens directly from prototype
- `Frontend2/components/primitives/` — All primitive components from prototype
- `Frontend2/context/app-context.tsx` — AppContext provider from prototype
- `Frontend2/lib/theme.ts` — Theme system from prototype
- `Frontend2/lib/i18n.ts` — i18n system from prototype

</code_context>

<specifics>
## Specific Ideas

- Prototype uses `data-mode="dark"` attribute for dark mode switching — use this approach directly
- Prototype's `--inset-*` shadow tokens create a distinctive "raised button" look with top/bottom edge highlights — must be preserved in Tailwind conversion
- `deriveFromBrand()` allows users to pick any brand color and get a full derived palette — this is a key feature of the theme system
- Prototype's `color-mix(in oklch, ...)` is used extensively in Badge and AlertBanner tones — ensure browser support is adequate
- Shell keyboard shortcuts (`G D`, `G P`, `G T`) shown in sidebar — implement with keyboard event listeners

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-foundation-design-system*
*Context gathered: 2026-04-20*
