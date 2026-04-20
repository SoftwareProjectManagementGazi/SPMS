# Phase 8: Foundation & Design System - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the base infrastructure for all subsequent frontend work: theme token system (6 presets + custom brand derivation), full primitive component library (16 components), i18n (TR/EN), and App Shell conversion from HTML prototype to Next.js — with zero visual change from the prototype design.

**Source of truth:** `New_Frontend/` directory contains the HTML prototype. All conversion work references this prototype. The old `Frontend/` codebase serves only as the existing Next.js project to build into — its design/styling is being replaced by the prototype's design.

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
- **D-07:** App Shell will be rewritten from the prototype (`shell.jsx`) to TSX, replacing the current `app-shell.tsx`. This includes Sidebar (collapsible, nav items with keyboard shortcuts, admin section, user area), Header (breadcrumb, search, notifications, theme toggle, create button, user menu), and the AppContext provider.
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

### Existing Frontend (build target)
- `Frontend/app/globals.css` — Current CSS tokens (will be replaced/updated)
- `Frontend/components/app-shell.tsx` — Current App Shell (will be rewritten)
- `Frontend/components/ui/` — Existing shadcn/ui components (kept for overlays)

### Project Context
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-05 requirements for this phase
- `.planning/codebase/CONVENTIONS.md` — Frontend naming, import, and component conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Frontend/components/ui/` — 59 shadcn/ui components. Dialog, Popover, Sheet, Select, DropdownMenu, Command, etc. will be reused for complex overlays.
- `Frontend/components/ui/collapsible.tsx` — Shadcn Collapsible exists but prototype has its own styled Collapsible — prototype version takes precedence.
- `Frontend/components/ui/progress.tsx` — Basic shadcn Progress exists — prototype's ProgressBar (with color, bg, height props) replaces it.
- `Frontend/lib/api-client.ts` — Axios instance with auth interceptors — unchanged, used by Shell for API calls.
- `Frontend/context/auth-context.tsx` — Auth state management — Shell's AuthGuard integrates with this.

### Established Patterns
- All client components use `"use client"` directive
- Named exports for components (`export function ComponentName`)
- `@/` path alias for all imports
- TanStack Query for server state
- `React.useState` (namespace access, not destructured)

### Integration Points
- `Frontend/app/layout.tsx` — Root layout where AppContext provider and theme setup goes
- `Frontend/app/*/page.tsx` — Existing pages that will use the new Shell and primitives
- `Frontend/components/providers/query-provider.tsx` — QueryProvider wraps the app

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
