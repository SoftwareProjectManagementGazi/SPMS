# Technology Stack

**Project:** SPMS v2.0 Frontend Overhaul & Backend Expansion
**Researched:** 2026-04-20
**Overall Confidence:** HIGH

## Context: Two Frontends, One Decision

The project has two distinct frontend codebases:

1. **v1 Frontend** (`/Frontend`) — Next.js 16 + shadcn/ui + TailwindCSS v4 + Recharts. Fully working with API integration, auth, RBAC, all v1.0 features. Uses Inter font + oklch CSS variables via shadcn theming conventions.

2. **New Prototype** (`/New_Frontend`) — Single HTML file with JSX loaded via React CDN. Uses inline styles exclusively, custom primitives (Card, Badge, Button, Tabs, etc.), CSS variables with oklch color space, `color-mix()`, custom SVG workflow canvas, localStorage-based routing (`useRouter().go()`). No build system, no TypeScript, no API calls.

**The Core Decision:** Convert the prototype's *visual design* into the existing Next.js codebase. Do NOT create a third frontend. The prototype is a design reference, not a codebase to port wholesale.

---

## Recommended Stack Additions

### Styling Strategy: Hybrid Tailwind + CSS Variables (NOT inline styles)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TailwindCSS | ^4.1.9 (already installed) | Utility-first styling | Already in project; v4 natively supports oklch + CSS variables |
| CSS Variables (oklch) | N/A | Dynamic theming, runtime color switching | Prototype's theme system uses oklch tokens; TailwindCSS v4 exposes all theme values as CSS vars |
| `@theme inline` directive | TailwindCSS v4 | Register prototype's token names as Tailwind theme vars | Allows `bg-[--surface]` syntax, keeps Tailwind DX while respecting prototype tokens |

**Rationale — Why NOT keep inline styles:**

The prototype uses inline styles because it runs without a build system (raw `<script>` tags loading React from CDN). In a Next.js build with Tailwind v4:

1. **Inline styles are not extractable** — they ship in HTML/JS, cannot be cached separately, increase payload per page
2. **No hover/focus/responsive** — inline styles cannot express `:hover`, `@media`, `:focus-visible`; the prototype hacks this with `onMouseEnter`/`onMouseLeave` handlers which is fragile and inaccessible
3. **No Server Component optimization** — inline styles force everything client-side; Tailwind classes work in RSC
4. **Tailwind v4 already uses oklch** — default palette is oklch, `@theme inline` allows custom token registration
5. **shadcn/ui compatibility** — components use `cn()` (clsx + tailwind-merge); inline styles break this pattern

**Migration strategy:** Map prototype CSS variables (e.g., `--surface`, `--fg-muted`, `--primary`) to Tailwind's `@theme inline` directive in `globals.css`. Then use utility classes like `bg-[--surface]` or extend semantic utilities. The prototype's exact pixel values translate to Tailwind classes with near 1:1 fidelity.

### Theme System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS custom properties | N/A | Runtime theme switching (presets + custom brand color) | Prototype has 6 presets + custom oklch brand derivation; CSS vars enable this without JS re-renders |
| `color-mix()` CSS function | N/A | Dynamic opacity/shade variants | Prototype uses `color-mix(in oklch, var(--primary) 12%, transparent)` extensively; 93%+ browser support in 2026 |
| next-themes | ^0.4.6 (already installed) | Light/dark mode toggle | Already handles `data-mode` attribute switching |

**Implementation approach:** Port `theme.jsx`'s `deriveFromBrand()` and `applyTokens()` logic into a React context + utility module. Use `document.documentElement.style.setProperty()` for runtime token updates (same as prototype does). Register the static token names in Tailwind's `@theme inline` so utilities work.

### Charts & Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.15.4 (already installed) | Standard charts (burndown, velocity, distribution) | Already used in v1 reports; keep for existing chart types |
| Custom SVG components | N/A | Workflow canvas, lifecycle timeline, CFD stacked area | Prototype's workflow canvas is custom SVG with node positioning; too specialized for Recharts |

**Rationale — Hybrid approach:**

- **Keep Recharts** for standard chart types already implemented (AreaChart, BarChart in reports). Bundle already paid.
- **Custom SVG for workflow canvas** — The prototype's `WorkflowCanvas` renders positioned nodes with bezier-curve edges, swimlane groups, and interactive handles. This is fundamentally a node graph, not a data chart. Recharts cannot express this.
- **Custom SVG for CFD/Lead-Cycle Time** — These are specialized stacked area charts with time-axis that need hover tooltips showing exact status counts. Custom SVG with `<path>` is ~200 lines vs. fighting Recharts' opinionated layout.
- **Do NOT add React Flow / xyflow** — The workflow canvas has ~96 lines of SVG rendering. React Flow adds 150KB+ bundle for features we don't need (drag-to-connect, auto-layout, etc.). The prototype's approach is sufficient.

### Routing (Replacing prototype's custom router)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js App Router | 16.x (already installed) | File-based routing | Already the routing system; prototype's `useRouter().go("page")` maps to `router.push("/page")` |

**Migration:** The prototype's `localStorage`-persisted page state (`useRouterState()`) is a hack for a single-HTML prototype. In Next.js, this becomes standard `next/navigation` with `useRouter()`. The `go("project-detail", { projectId })` pattern maps to `router.push(\`/projects/${projectId}\`)`.

### Component Architecture

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | latest (already installed) | Base component library | Already provides accessible Dialog, Dropdown, Select, Toast, etc. |
| Custom design primitives | N/A | Project-specific components matching prototype | Port prototype's Card, Badge, Button, Tabs, etc. as styled wrappers over shadcn primitives |

**Migration strategy for primitives:**

| Prototype Primitive | Next.js Equivalent | Approach |
|--------------------|-------------------|----------|
| `Card` | Extend existing `@/components/ui/card.tsx` | Add `interactive` prop, match shadow/inset tokens |
| `Badge` | Extend existing `@/components/ui/badge.tsx` | Add `tone` variants (success, warning, danger, info, mono), `dot` prop |
| `Button` | Extend existing `@/components/ui/button.tsx` | Add `icon`, `iconRight` props; match variant styles |
| `Tabs` | Use existing `@radix-ui/react-tabs` wrapper | Restyle with prototype's border-bottom active indicator |
| `Input` | Extend existing `@/components/ui/input.tsx` | Add `icon`, `kbdHint` props |
| `Avatar` / `AvatarStack` | Extend existing `@/components/ui/avatar.tsx` | Add initials-on-colored-bg variant, stack layout |
| `ProgressBar` | Use existing `@/components/ui/progress.tsx` | Restyle to match prototype |
| `SegmentedControl` | New component (no shadcn equivalent) | Build from scratch, ~40 lines |
| `Collapsible` | Use existing `@radix-ui/react-collapsible` | Already installed, just restyle |
| `AlertBanner` | New component (no shadcn equivalent) | Build from scratch, ~30 lines |
| `Toggle` (switch) | Use existing `@/components/ui/switch.tsx` | Restyle |

### Internationalization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom i18n context | N/A | TR/EN language switching | Prototype has `SPMSi18n.t(key, lang)` pattern; keep simple — project scope is TR/EN only |

**Do NOT add:** next-intl, react-i18next, or other i18n libraries. The prototype uses a simple key-value lookup with `{ tr: "...", en: "..." }` objects. A single `useTranslation()` hook with a flat JSON dictionary is sufficient for 2 languages.

### Backend Additions (New Entities)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQLAlchemy | existing | ORM for new Milestone, Artifact, PhaseReport models | Already the ORM; extend with new models |
| Alembic | existing | Database migrations for new tables | Already handles schema changes |
| Pydantic v2 | existing | Request/response schemas for new endpoints | Already used for all DTOs |

No new backend libraries needed. The 3 new entities (Milestone, Artifact, PhaseReport) and extended endpoints follow existing Clean Architecture patterns.

### Fonts

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next/font/google` | built-in | Geist, Geist Mono, Instrument Sans, Manrope, IBM Plex Mono | Prototype supports 4 font presets; Next.js font optimization handles loading/fallbacks |

**Current v1** uses Inter + Geist Mono. The prototype uses Geist as default with 3 alternatives. Switch primary font from Inter to Geist to match prototype. Use `next/font/google` for all variants.

---

## What NOT to Add

| Library | Why NOT |
|---------|---------|
| React Flow / xyflow | Workflow canvas is 96 lines of custom SVG; React Flow adds 150KB+ for unneeded features |
| styled-components / Emotion | CSS-in-JS is incompatible with React Server Components; Tailwind handles styling |
| Framer Motion | Prototype uses CSS transitions only; no complex animations needed. Use CSS `transition` properties |
| Chart.js / D3 directly | Recharts already wraps D3; custom SVG handles specialized charts |
| next-intl / react-i18next | Overkill for 2 languages with simple key lookups |
| zustand / jotai | TanStack Query handles server state; React Context handles theme/app state (matching prototype pattern) |
| Storybook | Nice-to-have but adds build complexity for a 2-person team with design freeze |

---

## Updated globals.css Token Structure

The v1 `globals.css` needs to be updated to include the prototype's extended token set:

```css
@theme inline {
  /* Prototype token names → available as Tailwind utilities */
  --color-bg: var(--bg);
  --color-bg-2: var(--bg-2);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-primary: var(--primary);
  --color-primary-fg: var(--primary-fg);
  --color-primary-hover: var(--primary-hover);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);

  /* Status tokens */
  --color-status-todo: var(--status-todo);
  --color-status-progress: var(--status-progress);
  --color-status-review: var(--status-review);
  --color-status-done: var(--status-done);
  --color-status-blocked: var(--status-blocked);

  /* Priority tokens */
  --color-priority-critical: var(--priority-critical);
  --color-priority-high: var(--priority-high);
  --color-priority-med: var(--priority-med);
  --color-priority-low: var(--priority-low);

  /* Shadows */
  --shadow-sm: var(--shadow-sm);
  --shadow-DEFAULT: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
}
```

This allows writing `bg-surface text-fg-muted border-border-strong shadow-md` in Tailwind classes while the actual values come from CSS custom properties that change at runtime based on theme preset.

---

## Version Summary

| Package | Current Version | Target Version | Action |
|---------|----------------|----------------|--------|
| next | 16.1.1 | ^16.1.1 | Keep (already latest stable line) |
| react | 19.2.0 | 19.2.0 | Keep |
| tailwindcss | ^4.1.9 | ^4.1.9 | Keep |
| @tanstack/react-query | ^5.90.16 | ^5.90.16 | Keep |
| recharts | 2.15.4 | 2.15.4 | Keep |
| next-themes | ^0.4.6 | ^0.4.6 | Keep |
| lucide-react | ^0.454.0 | ^0.454.0 | Keep (replaces prototype's custom Icons) |
| zod | 3.25.76 | 3.25.76 | Keep (form validation) |
| react-hook-form | ^7.60.0 | ^7.60.0 | Keep |

**No new npm dependencies needed.** The v2.0 features are achievable entirely with the existing package set plus custom code.

---

## Installation

```bash
# No new packages needed. Existing install is sufficient.
# If starting fresh:
cd Frontend
pnpm install

# Font change in layout.tsx:
# Replace Inter with Geist as primary sans font
# Add Instrument_Sans, Manrope as alternative options
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Styling | Tailwind v4 + CSS vars | Keep inline styles from prototype | Inline styles break RSC, hover states, caching, and accessibility |
| Styling | Tailwind v4 + CSS vars | CSS Modules | Adds file overhead; prototype's token system maps perfectly to Tailwind arbitrary values |
| Charts (workflow) | Custom SVG | React Flow (xyflow) | 150KB+ bundle for a 96-line custom implementation |
| Charts (standard) | Recharts (keep) | visx | Already installed and working; no reason to switch |
| Charts (CFD) | Custom SVG | Recharts AreaChart | CFD needs custom hover/tooltip behavior per status lane; custom SVG is more maintainable |
| i18n | Simple context + JSON | next-intl | Overkill for 2 languages; adds routing complexity |
| State (theme) | React Context | zustand | Theme state is simple; Context matches prototype pattern exactly |
| Fonts | next/font (Geist) | Self-hosted | next/font handles optimization, fallback metrics, FOIT prevention |
| Node editor | Custom SVG | React Flow | Feature bloat; our nodes don't need drag-to-connect or auto-layout |

---

## Sources

- [Next.js CSS Styling Documentation](https://nextjs.org/docs/app/getting-started/css) — HIGH confidence
- [TailwindCSS v4 Theme Variables](https://tailwindcss.com/docs/theme) — HIGH confidence
- [TailwindCSS v4 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4) — HIGH confidence (oklch default palette)
- [Better Dynamic Themes in Tailwind with OKLCH (Evil Martians)](https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic) — HIGH confidence
- [Can I Use: oklch()](https://caniuse.com/mdn-css_types_color_oklch) — HIGH confidence (93%+ support)
- [Can I Use: color-mix()](https://caniuse.com/?search=color-mix) — HIGH confidence (Baseline Widely Available)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming) — HIGH confidence
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4) — HIGH confidence
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — HIGH confidence
- [React Flow (xyflow)](https://reactflow.dev) — HIGH confidence (evaluated and rejected)
- [TailwindCSS v4 @theme inline Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/17826) — MEDIUM confidence
- [Tailwind v4 Dynamic Theming Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15600) — MEDIUM confidence
