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
- Reusable shadcn/ui overlay components (Dialog, Popover, Sheet, Select, etc.) should be copied from `Frontend/components/ui/` into `Frontend2/` — not imported across folders

</domain>

<decisions>
## Implementation Decisions

### Theme Token Migration
- **D-01:** Prototype components (`New_Frontend/src/primitives.jsx`) will be converted to TypeScript React components. Shadcn/ui components are retained only for complex overlays (Dialog, Popover, Sheet, Select, etc.) — all visual primitives come from the prototype.
- **D-02:** Token names will be mapped to shadcn/ui naming conventions (`--bg` → `--background`, `--surface` → `--card`, `--fg` → `--foreground`, etc.). Prototype-specific extra tokens (`--bg-2`, `--surface-2`, `--fg-subtle`, `--border-strong`, `--primary-hover`, `--primary-fg`, `--inset-*`, `--status-*`, `--priority-*`, `--shadow-*`) will be added as-is alongside shadcn tokens. Theme presets and `deriveFromBrand()` function will be updated to use the mapped names.

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
- `data-mode="dark"` (prototype) vs `.dark` class (shadcn) for dark mode — whichever approach lets both prototype and shadcn components work

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

### Legacy Frontend (reference only — DO NOT modify)
- `Frontend/components/ui/` — Shadcn/ui overlay components to be COPIED into Frontend2/ (Dialog, Popover, Sheet, Select, DropdownMenu, Command, etc.)
- `Frontend/lib/api-client.ts` — Axios instance with auth interceptors — reference for recreating in Frontend2/
- `Frontend/context/auth-context.tsx` — Auth state management — reference for recreating in Frontend2/

### Build Target (new folder)
- `Frontend2/` — New Next.js project created from scratch in this phase. All output goes here.

### Project Context
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-05 requirements for this phase
- `.planning/codebase/CONVENTIONS.md` — Frontend naming, import, and component conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Assets to Copy from Legacy Frontend/
- `Frontend/components/ui/` — 59 shadcn/ui overlay components (Dialog, Popover, Sheet, Select, DropdownMenu, Command, etc.) to be copied into `Frontend2/components/ui/`
- `Frontend/lib/api-client.ts` — Axios instance with auth interceptors — copy and adapt for Frontend2/
- `Frontend/context/auth-context.tsx` — Auth state management — copy and adapt for Frontend2/
- `Frontend/components/providers/query-provider.tsx` — QueryProvider — copy into Frontend2/

### Established Patterns (carry forward to Frontend2/)
- All client components use `"use client"` directive
- Named exports for components (`export function ComponentName`)
- `@/` path alias for all imports
- TanStack Query for server state
- `React.useState` (namespace access, not destructured)

### Frontend2/ Structure (new project)
- `Frontend2/app/layout.tsx` — Root layout where AppContext provider and theme setup goes
- `Frontend2/app/globals.css` — New CSS tokens from prototype
- `Frontend2/components/primitives/` — New primitive components from prototype
- `Frontend2/components/ui/` — Copied shadcn/ui overlay components
- `Frontend2/context/app-context.tsx` — New AppContext provider
- `Frontend2/lib/theme.ts` — Theme system from prototype
- `Frontend2/lib/i18n.ts` — i18n system from prototype

</code_context>

<specifics>
## Specific Ideas

- Prototype uses `data-mode="dark"` attribute for dark mode switching — this needs to coexist with or replace the shadcn `.dark` class approach
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
