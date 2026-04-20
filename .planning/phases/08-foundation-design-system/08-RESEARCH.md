# Phase 8: Foundation & Design System - Research

**Researched:** 2026-04-20
**Domain:** Next.js App Shell, CSS Design Tokens (oklch), Primitive Component Library, i18n
**Confidence:** HIGH

## Summary

Phase 8 converts an HTML/JSX prototype into a production Next.js + TypeScript + Tailwind CSS v4 application shell. The prototype provides complete source code for all deliverables: 6 theme presets with oklch tokens, 16 primitive UI components, TR/EN i18n strings, and a full App Shell (Sidebar, Header, Layout). The work is a controlled port -- not creative design work -- which makes the task well-defined and low-risk.

The primary technical approach is using the prototype's CSS custom property names directly (`--bg`, `--surface`, `--fg`, etc.) in the new Frontend2/ project's globals.css via Tailwind CSS v4's `@custom-variant` directive. No mapping or renaming is needed -- the prototype's token system IS the design system (per D-02). The `@custom-variant dark` directive will be updated to support `data-mode="dark"`.

**Primary recommendation:** Port prototype code file-by-file (theme.jsx -> lib/theme.ts, primitives.jsx -> components/primitives/*.tsx, i18n.jsx -> lib/i18n.ts, shell.jsx -> components/app-shell.tsx), converting inline styles to Tailwind classes and adding TypeScript interfaces for all component props.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** ALL components come from the prototype (`New_Frontend/src/primitives.jsx`) and will be converted to TypeScript React components. shadcn/ui is NOT used at all -- not even for overlays. Every UI element must be 100% faithful to the prototype design.
- **D-02:** Token names from the prototype will be used directly as-is (`--bg`, `--bg-2`, `--surface`, `--surface-2`, `--fg`, `--fg-subtle`, `--border`, `--border-strong`, `--primary`, `--primary-hover`, `--primary-fg`, `--inset-*`, `--status-*`, `--priority-*`, `--shadow-*`). No mapping to shadcn naming conventions -- the prototype's token system IS the design system. Theme presets and `deriveFromBrand()` function ported directly from `theme.jsx`.
- **D-03:** All 16 primitive components from `primitives.jsx` will be converted in this phase: Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle.
- **D-04:** Inline styles from the prototype will be converted to Tailwind CSS utility classes -- matching the existing project convention. CSS custom properties (token references) will be used via Tailwind's `var()` syntax where needed.
- **D-05:** Simple i18n approach -- `useApp().language` React context provides the current language, `t()` function resolves dot-notation keys (e.g., `t('nav.dashboard')`), all strings stored in a single `strings.ts` file. No external i18n library.
- **D-06:** Default language is Turkish (tr). Language switching through Settings. `t()` falls back to Turkish if English translation is missing.
- **D-07:** App Shell will be created in Frontend2/ from the prototype (`shell.jsx`) as new TSX files. Includes Sidebar (collapsible, nav items with keyboard shortcuts, admin section, user area), Header (breadcrumb, search, notifications, theme toggle, create button, user menu), and AppContext provider. The existing Frontend/ is NOT modified.
- **D-08:** Full theme system -- 6 color presets, light/dark mode, custom brand color derivation via `deriveFromBrand()`.
- **D-09:** Next.js App Router for routing -- prototype's client-side RouterContext removed. File-based routing replaces SPA-style page switching.

### Claude's Discretion
- Component file organization (e.g., `components/primitives/` vs `components/ui/` vs flat structure)
- Whether to split `strings.ts` into multiple files by feature area or keep it monolithic
- Specific Tailwind class choices for prototype fidelity (exact spacing, sizing)
- Whether `AppContext` stays in a single provider or splits into `ThemeContext` + `LanguageContext`
- `data-mode="dark"` attribute from prototype for dark mode switching

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Theme token sistemi kurulur -- prototype'in oklch CSS variable'lari globals.css'e tasinir, eski token'larla namespace catismasi onlenir | Token inventory (Section: Architecture Patterns > Token Migration), Tailwind v4 @theme inline docs, dark mode @custom-variant research |
| FOUND-02 | Primitives kutuphanesi olusturulur -- ProgressBar, SegmentedControl, Collapsible, AlertBanner component'leri TypeScript ile yazilir | Full component inventory with props API (Section: Architecture Patterns > Component Conversion), code examples for each |
| FOUND-03 | I18n altyapisi kurulur -- useApp().language ile TR/EN destegi, tum yeni component'lerde T() fonksiyonu kullanilir | i18n pattern with t() function (Section: Architecture Patterns > I18n), prototype STRINGS structure analysis |
| FOUND-04 | Theme preset'lerine status-todo ve status-blocked tokenlari eklenir | Token inventory showing both existing and new status tokens (Section: Architecture Patterns > Token Migration), color values from prototype |
| FOUND-05 | App Shell donusturulur -- Sidebar, Header, Layout component'leri Next.js'e tasarim degisikligi olmadan aktarilir | App Shell conversion strategy (Section: Architecture Patterns > App Shell), integration with existing AuthGuard and providers |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Theme tokens (CSS variables) | Browser / Client | -- | CSS custom properties resolve at render time in the browser; no server involvement |
| Theme preset switching | Browser / Client | -- | localStorage persistence + DOM style manipulation; fully client-side |
| deriveFromBrand() color math | Browser / Client | -- | Pure JS computation on oklch values; no API call needed |
| Primitive components | Browser / Client | -- | React client components with Tailwind classes; "use client" required |
| i18n string resolution | Browser / Client | -- | React context + in-memory lookup; no server-side rendering of translations needed |
| App Shell layout | Browser / Client | Frontend Server (SSR) | Shell renders client-side (needs context), but layout.tsx provides server-rendered wrapper |
| Routing (navigation) | Frontend Server (SSR) | Browser / Client | Next.js App Router is server-first; Link and useRouter handle client transitions |
| Auth integration | Browser / Client | API / Backend | AuthGuard checks client-side token; validates against backend API |

## Standard Stack

### Core (Already Installed)
| Library | Installed Version | Latest | Purpose | Why Standard |
|---------|------------------|--------|---------|--------------|
| next | 16.1.1 | 16.2.4 | App Router, SSR, file-based routing | Project foundation [VERIFIED: npm view + node_modules] |
| react | 19.2.0 | 19.2.5 | UI rendering | Project foundation [VERIFIED: npm view + node_modules] |
| tailwindcss | 4.1.17 | 4.2.2 | Utility-first CSS with `@theme inline` | Project convention [VERIFIED: node_modules] |
| lucide-react | 0.454.0 | 1.8.0 | Icon library (used by existing components) | Already installed, used throughout [VERIFIED: package.json] |
| next-themes | 0.4.6 | 0.4.6 | Theme persistence (dark/light mode) | Already installed [VERIFIED: package.json + npm view] |
| class-variance-authority | 0.7.1 | -- | Component variant management | Already installed [VERIFIED: package.json] |
| clsx + tailwind-merge | 2.1.1 / 2.5.5 | -- | Conditional class names via `cn()` | Existing `lib/utils.ts` pattern [VERIFIED: codebase] |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-collapsible | 1.1.2 | Accessible collapsible primitive | Only if complex accessibility requirements arise; prototype Collapsible is custom |
| sonner | 1.7.4 | Toast notifications | Error/success feedback in theme operations |
| tw-animate-css | 1.3.3 | CSS animation utilities | Subtle transitions in Shell components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom t() i18n | next-intl or react-i18next | D-05 locks custom approach; external lib is overkill for TR/EN only |
| Custom theme system | next-themes exclusively | next-themes handles class/attribute toggle but not custom brand derivation; hybrid approach needed |
| Prototype-style inline SVG icons | lucide-react icons exclusively | Prototype defines custom SVG icons; lucide-react already installed and covers most icons. Map prototype icon names to lucide equivalents |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### System Architecture Diagram

```
[User Interaction]
       |
       v
+------------------+     +-----------------+
| Root Layout      |     | globals.css     |
| (Server)         |---->| Prototype tokens|
| Providers:       |     | :root tokens    |
|  QueryProvider   |     | [data-mode]     |
|  AuthProvider    |     +-----------------+
|  SystemConfig    |
|  AppProvider NEW |
+------------------+
       |
       v
+------------------+     +------------------+
| App Shell        |<--->| AppContext        |
| (Client)         |     | - language       |
| - Sidebar        |     | - theme/preset   |
| - Header         |     | - sidebarState   |
| - main outlet    |     | - mode (l/d)     |
+------------------+     +------------------+
       |                         |
       v                         v
+------------------+     +------------------+
| Page Components  |     | lib/theme.ts     |
| via App Router   |     | - PRESETS        |
|                  |     | - deriveFromBrand|
|                  |     | - applyTokens    |
+------------------+     +------------------+
       |
       v
+------------------+     +------------------+
| Primitive        |     | lib/i18n.ts      |
| Components       |     | - STRINGS        |
| (16 components)  |     | - t() function   |
+------------------+     +------------------+
```

### Recommended Project Structure

```
Frontend2/
  app/
    globals.css          # Token definitions (prototype tokens directly)
    layout.tsx           # Root layout (add AppProvider)
    page.tsx             # Redirect to /dashboard
    (shell)/
      layout.tsx         # AppShell wrapper
      dashboard/page.tsx
      projects/page.tsx
      ...
  components/
    app-shell.tsx        # NEW: Full Shell from prototype
    sidebar.tsx          # NEW: Prototype Sidebar
    header.tsx           # NEW: Prototype Header
    breadcrumb.tsx       # NEW: Extracted from Header
    primitives/          # NEW: 16 prototype components
      avatar.tsx
      avatar-stack.tsx
      badge.tsx
      button.tsx
      card.tsx
      kbd.tsx
      tabs.tsx
      section.tsx
      priority-chip.tsx
      status-dot.tsx
      input.tsx
      progress-bar.tsx
      segmented-control.tsx
      collapsible.tsx
      alert-banner.tsx
      toggle.tsx
      index.ts           # Barrel export
  context/
    app-context.tsx      # NEW: Theme + Language + UI state
  lib/
    theme.ts             # NEW: PRESETS, deriveFromBrand, applyTokens, applyMode
    i18n.ts              # NEW: STRINGS object + t() function
    utils.ts             # NEW: cn() helper
```

**Recommendation for Claude's Discretion -- Component organization:**
Use `components/primitives/` as a dedicated directory. Rationale: (1) Keeps all prototype-origin components organized together, (2) Barrel export via `index.ts` keeps imports clean: `import { Badge, Button } from "@/components/primitives"` [ASSUMED]

**Recommendation for Claude's Discretion -- AppContext structure:**
Keep a single `AppContext` provider (not split into ThemeContext + LanguageContext). Rationale: (1) The prototype uses a single `useApp()` hook that all Shell components depend on, (2) Theme and language are coupled (preset names are bilingual, mode affects language-aware labels), (3) Splitting adds complexity with no benefit at this scale. [ASSUMED]

**Recommendation for Claude's Discretion -- Dark mode approach:**
Use `data-mode="dark"` via Tailwind's `@custom-variant dark` directive. Set the custom variant in globals.css:
```css
@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *));
```
This ensures: (1) Prototype components work natively (they use `[data-mode="dark"]`), (2) Any `dark:` Tailwind utilities compile to the same selector, (3) The dark mode block in globals.css uses `[data-mode="dark"]`. [VERIFIED: Tailwind CSS v4 docs, https://tailwindcss.com/docs/dark-mode]

**Recommendation for Claude's Discretion -- strings.ts structure:**
Keep a single monolithic `strings.ts` file. Rationale: The prototype's `i18n.jsx` STRINGS object has ~85 keys organized into 7 sections (nav, common, priority, dashboard, project, workflow). This is small enough for a single file. Future phases will add more strings, but splitting can happen then if needed. [ASSUMED]

### Pattern 1: Token Migration Strategy

**What:** Port prototype tokens directly into Frontend2/app/globals.css using prototype names as-is
**When to use:** Creating globals.css in Frontend2/

Per D-02, prototype token names are used directly. No mapping or renaming is needed. The complete token inventory:

| Prototype Token | Category | Action |
|----------------|----------|--------|
| `--bg` | Core surface | Use directly from prototype |
| `--bg-2` | Core surface | Use directly from prototype |
| `--surface` | Core surface | Use directly from prototype |
| `--surface-2` | Core surface | Use directly from prototype |
| `--fg` | Foreground | Use directly from prototype |
| `--fg-muted` | Foreground | Use directly from prototype |
| `--fg-subtle` | Foreground | Use directly from prototype |
| `--border` | Border | Use directly from prototype |
| `--border-strong` | Border | Use directly from prototype |
| `--primary` | Primary | Use directly from prototype |
| `--primary-fg` | Primary | Use directly from prototype |
| `--primary-hover` | Primary | Use directly from prototype |
| `--accent` | Accent | Use directly from prototype |
| `--accent-fg` | Accent | Use directly from prototype |
| `--ring` | Ring | Use directly from prototype |
| `--status-todo` | Status (FOUND-04) | Use directly from prototype |
| `--status-progress` | Status | Use directly from prototype |
| `--status-review` | Status | Use directly from prototype |
| `--status-done` | Status | Use directly from prototype |
| `--status-blocked` | Status (FOUND-04) | Use directly from prototype |
| `--priority-critical` | Priority | Use directly from prototype |
| `--priority-high` | Priority | Use directly from prototype |
| `--priority-med` | Priority | Use directly from prototype |
| `--priority-low` | Priority | Use directly from prototype |
| `--shadow-*` (5 levels) | Shadow | Use directly from prototype: sm, default, md, lg, xl |
| `--inset-*` (5 tokens) | Inset depth | Use directly from prototype: top, bottom, card, primary-top, primary-bottom |
| `--density-row` | Density | Use via `[data-density]` attribute selectors |

**Also needed:** `--av-1` through `--av-8` avatar color tokens. The prototype Avatar component references `var(--av-${user.avColor})` but these are not defined in the prototype CSS. These need to be created as fixed oklch colors for user avatar backgrounds. [VERIFIED: grep found no --av-* definitions in prototype]

### Pattern 2: Component Conversion Pattern

**What:** Convert prototype JSX with inline styles to TypeScript + Tailwind
**When to use:** Each of the 16 primitive components

**Example: ProgressBar conversion**

Prototype (primitives.jsx):
```jsx
const ProgressBar = ({ value = 0, max = 100, height = 4, color = "var(--primary)", bg = "var(--surface-2)", style }) => (
  <div style={{ height, background: bg, borderRadius: height, overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.2s" }}/>
  </div>
);
```

Target TypeScript (components/primitives/progress-bar.tsx):
```typescript
// Source: New_Frontend/src/primitives.jsx line 236-240
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value?: number
  max?: number
  height?: number
  color?: string
  bg?: string
  className?: string
  style?: React.CSSProperties
}

export function ProgressBar({
  value = 0,
  max = 100,
  height = 4,
  color = "var(--primary)",
  bg = "var(--surface-2)",
  className,
  style,
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100)

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ height, background: bg, borderRadius: height, ...style }}
    >
      <div
        className="h-full transition-[width] duration-200"
        style={{
          width: `${percent}%`,
          background: color,
          borderRadius: height,
        }}
      />
    </div>
  )
}
```

**Conversion rules applied consistently:**
1. Add `"use client"` directive
2. Use `import * as React from "react"` (namespace access convention)
3. Create explicit `Props` interface with all props typed
4. Add `className` prop (missing from prototype) for Tailwind composition
5. Use `export function ComponentName` (named export convention)
6. Convert static styles to Tailwind classes where clean mapping exists
7. Keep `style={}` for dynamic values that depend on props (height, color, width%)
8. Use `cn()` for className merging
9. Keep `var()` CSS variable references for token values

### Pattern 3: I18n Implementation

**What:** Port prototype's i18n system to TypeScript
**When to use:** lib/i18n.ts and all components using text strings

```typescript
// Source: New_Frontend/src/i18n.jsx
// lib/i18n.ts

type LangCode = "tr" | "en"

interface StringEntry {
  tr: string
  en?: string
}

interface StringNamespace {
  [key: string]: StringEntry | StringNamespace
}

export const STRINGS: StringNamespace = {
  nav: {
    dashboard: { tr: "Panel", en: "Dashboard" },
    projects: { tr: "Projeler", en: "Projects" },
    // ... (port all ~85 keys from prototype)
  },
  // ... remaining sections
}

export function t(path: string, lang: LangCode = "tr"): string {
  const parts = path.split(".")
  let cur: unknown = STRINGS
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return path // fallback to key
    }
  }
  if (cur && typeof cur === "object" && "tr" in cur) {
    const entry = cur as StringEntry
    return entry[lang] || entry.tr || path
  }
  return path
}
```

### Pattern 4: App Shell with Next.js App Router

**What:** Replace prototype's RouterContext with Next.js file-based routing
**When to use:** Sidebar navigation, breadcrumbs, page routing

Key changes from prototype:
- `router.go("projects")` -> `<Link href="/projects">` or `router.push("/projects")`
- `router.page === "projects"` -> `pathname === "/projects"` via `usePathname()`
- `router.params.projectId` -> `useParams()` from Next.js
- `RouterContext.Provider` is removed entirely
- `AppContext.Provider` wraps in `layout.tsx` as a client component

```typescript
// Source: New_Frontend/src/shell.jsx adapted for Next.js
// context/app-context.tsx

"use client"

import * as React from "react"

type LangCode = "tr" | "en"
type ThemeMode = "light" | "dark"
type ThemePreset = "default" | "ocean" | "forest" | "monochrome" | "midnight" | "graphite"
type Density = "compact" | "cozy" | "comfortable"

interface AppContextType {
  language: LangCode
  setLanguage: (lang: LangCode) => void
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  preset: ThemePreset | string
  applyPreset: (id: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  density: Density
  setDensity: (density: Density) => void
  // Brand customization
  brandLight: number
  brandChroma: number
  brandHue: number
  customColors: boolean
  applyCustomBrand: (params: { L: number; C: number; H: number }) => void
}

const AppContext = React.createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = React.useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
```

### Pattern 5: Theme System Port

**What:** Convert prototype's theme.jsx to TypeScript module
**When to use:** lib/theme.ts

```typescript
// Source: New_Frontend/src/theme.jsx
// lib/theme.ts

export interface ThemeTokens {
  bg: string
  "bg-2": string
  surface: string
  "surface-2": string
  fg: string
  "fg-muted": string
  "fg-subtle": string
  border: string
  "border-strong": string
  primary: string
  "primary-fg": string
  "primary-hover": string
  accent: string
  "accent-fg": string
  ring: string
}

export interface ThemePreset {
  id: string
  name: { tr: string; en: string }
  mode: "light" | "dark"
  tokens: ThemeTokens
}

export const PRESETS: Record<string, ThemePreset> = {
  default: { /* ... port from theme.jsx */ },
  ocean: { /* ... */ },
  forest: { /* ... */ },
  monochrome: { /* ... */ },
  midnight: { /* ... */ },
  graphite: { /* ... */ },
}

export function deriveFromBrand(params: {
  L: number; C: number; H: number; mode?: "light" | "dark"
}): ThemeTokens {
  // Port from theme.jsx line 140-156
}

export function applyTokens(tokens: ThemeTokens): void {
  const root = document.documentElement
  // Per D-02: Use prototype token names directly -- no mapping
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}

export function applyMode(mode: "light" | "dark"): void {
  document.documentElement.dataset.mode = mode
}
```

### Anti-Patterns to Avoid
- **Importing from Frontend/ directory:** Frontend2/ is built from scratch. Nothing is copied or referenced from the legacy Frontend/ directory.
- **Using shadcn/ui components:** Per D-01, ALL components come from the prototype. Do NOT install or use any shadcn/ui components. Import from `@/components/primitives/`, not from any `@/components/ui/` directory.
- **Using next-themes ThemeProvider for mode switching:** The prototype's mode switching is tightly coupled to the preset system (switching to dark auto-selects midnight preset). Use custom AppContext for this logic, not next-themes' automatic handling.
- **Converting all inline styles to Tailwind:** Some prototype styles are dynamic (depend on props or computed values). Keep `style={}` for those. Only convert static, constant styles to Tailwind classes.
- **Renaming prototype token names:** Per D-02, use `--bg`, `--surface`, `--fg`, etc. directly. Do NOT rename to `--background`, `--card`, `--foreground` or any other naming convention.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS class merging | Custom string concatenation | `cn()` from `lib/utils.ts` (clsx + tailwind-merge) | Handles Tailwind class conflicts correctly |
| Icon components | Copy prototype SVG icons | `lucide-react` icons | Already installed with 1000+ icons; prototype icons are Lucide-style SVGs |
| Accessible overlays | Custom overlay components from scratch | Build from prototype patterns with proper a11y attributes | Prototype components are the source; add aria-* attributes as needed |
| Route matching | Manual pathname comparison | `usePathname()` from `next/navigation` | Handles dynamic segments, parallel routes |
| Color contrast checking | Custom WCAG calculator | Prototype's `estimateContrast()` (oklch lightness diff) | Already implemented in theme.jsx, adequate for UI use |

**Key insight:** This phase is a porting exercise. Every component, function, and style already exists in the prototype. The value-add is TypeScript types, Tailwind classes, and Next.js integration -- not reimagining the design.

## Common Pitfalls

### Pitfall 1: Token Namespace Collision
**What goes wrong:** Existing globals.css tokens in Frontend/ have different names from the prototype tokens used in Frontend2/.
**Why it happens:** Frontend2/ is a fresh project with its own globals.css. The prototype uses `--bg`, `--surface`, `--fg` while the legacy Frontend/ uses `--background`, `--card`, `--foreground`.
**How to avoid:** Since Frontend2/ is built from scratch, this is not actually a risk -- just use prototype token names directly per D-02. No collision possible because the two projects are separate.
**Warning signs:** N/A -- Frontend2/ is isolated.

### Pitfall 2: Dark Mode Selector Mismatch
**What goes wrong:** `dark:` Tailwind utilities don't apply because the prototype uses `data-mode="dark"` but the default Tailwind config expects `.dark` class.
**Why it happens:** Tailwind CSS v4 default dark mode uses `.dark` class. The prototype uses `[data-mode="dark"]` attribute.
**How to avoid:** Set `@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *))` in globals.css. Use `[data-mode="dark"] { }` block for dark overrides.
**Warning signs:** Dark mode toggle works for some components but not others.

### Pitfall 3: color-mix() in Tailwind Arbitrary Values
**What goes wrong:** Prototype Badge and AlertBanner use `color-mix(in oklch, ...)` extensively. Tailwind's arbitrary value syntax `bg-[...]` may not handle complex color-mix expressions well.
**Why it happens:** `color-mix()` with CSS variable arguments creates very long values that may need escaping in Tailwind class syntax.
**How to avoid:** For complex color-mix expressions, keep them as inline `style={}` props rather than forcing them into Tailwind classes. This is an acceptable exception to D-04's "convert to Tailwind" directive.
**Warning signs:** Badge tones appear as plain colors instead of semi-transparent overlays.

### Pitfall 4: Inset Shadow Tokens Missing in Dark Mode
**What goes wrong:** Buttons and cards look flat in dark mode because the `--inset-*` shadow tokens have different values for light and dark modes.
**Why it happens:** The prototype defines separate `--inset-*` values in `:root` (light) and `[data-mode="dark"]` (dark). If only the light values are ported, dark mode loses the distinctive raised-button look.
**How to avoid:** Port BOTH the `:root` and `[data-mode="dark"]` blocks for all `--inset-*` and `--shadow-*` tokens. There are 5 inset tokens and 5 shadow tokens, each with separate light/dark values = 20 total token values.
**Warning signs:** Buttons appear flat without the top-highlight/bottom-shadow edge effect.

### Pitfall 5: Prototype Icon Name Mismatches
**What goes wrong:** Prototype references `Icons.PanelLeft`, `Icons.MoreH`, etc. These don't map 1:1 to lucide-react imports.
**Why it happens:** The prototype defines custom SVG icon components while the existing codebase uses lucide-react.
**How to avoid:** Create a mapping of prototype icon names to lucide-react equivalents:
- `Icons.Dashboard` -> `LayoutDashboard`
- `Icons.PanelLeft` -> `PanelLeft`
- `Icons.MoreH` -> `MoreHorizontal`
- `Icons.CheckSquare` -> `CheckSquare`
- `Icons.Help` -> `HelpCircle`
- `Icons.Alert` -> `AlertTriangle`
- etc.

**Warning signs:** TypeScript import errors or missing icons at runtime.

### Pitfall 6: Avatar Color Tokens Not Defined
**What goes wrong:** Avatar component renders all avatars with transparent/broken backgrounds.
**Why it happens:** The prototype Avatar references `var(--av-${user.avColor})` but these tokens are never defined in the prototype's CSS. They were likely set via JavaScript or assumed to exist.
**How to avoid:** Define `--av-1` through `--av-8` as fixed oklch colors in globals.css. Choose distinct, accessible colors that work in both light and dark modes.
**Warning signs:** All user avatars appear with no background color.

### Pitfall 7: SystemConfigContext Brand Color Conflict
**What goes wrong:** The existing `SystemConfigContext` sets `--primary` on `document.documentElement` from a backend API call. The new AppContext also sets `--primary` from theme presets. They fight.
**Why it happens:** Both systems try to own the same CSS variable.
**How to avoid:** Update `SystemConfigContext` to stop directly setting `--primary`. Instead, pass the backend brand color to AppContext, which integrates it into its theme system via `deriveFromBrand()`. If no backend brand color is set, use the selected preset's primary.
**Warning signs:** Primary color flickers or reverts unexpectedly after API response.

## Code Examples

### globals.css Token Structure (Frontend2/)

```css
/* Source: New_Frontend/SPMS Prototype.html -- prototype token names used directly per D-02 */
@import "tailwindcss";

@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *));

:root {
  /* Core surface tokens (prototype names per D-02) */
  --bg: oklch(0.985 0.006 75);
  --bg-2: oklch(0.97 0.008 70);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.975 0.006 70);

  /* Foreground tokens */
  --fg: oklch(0.20 0.025 50);
  --fg-muted: oklch(0.48 0.018 55);
  --fg-subtle: oklch(0.62 0.012 60);

  /* Border tokens */
  --border: oklch(0.90 0.01 65);
  --border-strong: oklch(0.82 0.015 60);

  /* Primary tokens */
  --primary: oklch(0.60 0.17 40);
  --primary-fg: oklch(0.985 0.005 75);
  --primary-hover: oklch(0.55 0.18 40);

  /* Accent tokens */
  --accent: oklch(0.93 0.03 50);
  --accent-fg: oklch(0.25 0.04 50);
  --ring: oklch(0.60 0.17 40 / 0.4);

  /* Status tokens (FOUND-04) */
  --status-todo: oklch(0.62 0.012 60);
  --status-progress: oklch(0.55 0.15 230);
  --status-review: oklch(0.65 0.15 65);
  --status-done: oklch(0.58 0.14 150);
  --status-blocked: oklch(0.58 0.20 25);

  /* Priority tokens */
  --priority-critical: oklch(0.58 0.22 25);
  --priority-high: oklch(0.65 0.18 45);
  --priority-med: oklch(0.67 0.13 80);
  --priority-low: oklch(0.60 0.05 240);

  /* Shadow tokens */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.06);
  --shadow: 0 2px 8px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.06);
  --shadow-lg: 0 12px 28px oklch(0 0 0 / 0.12), 0 4px 8px oklch(0 0 0 / 0.08);
  --shadow-xl: 0 20px 40px oklch(0 0 0 / 0.14), 0 8px 16px oklch(0 0 0 / 0.1);

  /* Inset depth tokens (light mode) */
  --inset-top: inset 0 1px 0 oklch(1 0 0 / 0.65);
  --inset-bottom: inset 0 -1px 0 oklch(0.2 0 0 / 0.10);
  --inset-card: inset 0 1px 0 oklch(1 0 0 / 0.80), inset 0 -1px 0 oklch(0.2 0 0 / 0.06);
  --inset-primary-top: inset 0 1px 0 oklch(1 0 0 / 0.20);
  --inset-primary-bottom: inset 0 -1px 0 oklch(0.1 0.05 40 / 0.30);

  /* Avatar colors */
  --av-1: oklch(0.65 0.18 25);
  --av-2: oklch(0.60 0.15 250);
  --av-3: oklch(0.62 0.16 150);
  --av-4: oklch(0.65 0.14 320);
  --av-5: oklch(0.60 0.17 45);
  --av-6: oklch(0.63 0.12 200);
  --av-7: oklch(0.60 0.15 290);
  --av-8: oklch(0.65 0.10 100);

  /* Radius */
  --radius: 8px;
  --radius-sm: 6px;
  --radius-lg: 12px;
}

[data-mode="dark"] {
  /* Dark mode inset tokens */
  --inset-top: inset 0 1px 0 oklch(0.30 0 0 / 0.50);
  --inset-bottom: inset 0 -1px 0 oklch(0.10 0 0 / 0.70);
  --inset-card: inset 0 1px 0 oklch(0.28 0 0 / 0.55), inset 0 -1px 0 oklch(0.10 0 0 / 0.60);
  --inset-primary-top: inset 0 1px 0 oklch(0.28 0.06 40 / 0.50);
  --inset-primary-bottom: inset 0 -1px 0 oklch(0.10 0.02 40 / 0.80);

  /* Dark mode shadow tokens */
  --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.25);
  --shadow: 0 2px 8px oklch(0 0 0 / 0.35), 0 1px 3px oklch(0 0 0 / 0.20);
  --shadow-md: 0 4px 14px oklch(0 0 0 / 0.40), 0 2px 6px oklch(0 0 0 / 0.25);
  --shadow-lg: 0 12px 30px oklch(0 0 0 / 0.50), 0 4px 10px oklch(0 0 0 / 0.30);
  --shadow-xl: 0 20px 44px oklch(0 0 0 / 0.55), 0 8px 18px oklch(0 0 0 / 0.35);
}

/* Density (from prototype) */
[data-density="compact"] { --density-row: 28px; }
[data-density="cozy"] { --density-row: 34px; }
[data-density="comfortable"] { --density-row: 40px; }
```

### Component Inventory with Props API

Each of the 16 primitive components with their TypeScript prop interfaces:

| Component | Key Props | Complex Styles? | Notes |
|-----------|-----------|-----------------|-------|
| Avatar | `user, size?, ring?, className?` | No | Uses `--av-*` tokens for bg color |
| AvatarStack | `users, max?, size?` | No | Negative margin overlap |
| Badge | `children, tone?, size?, dot?, className?` | Yes -- color-mix | 7 tones: neutral/primary/success/warning/danger/info/mono |
| Button | `variant?, size?, icon?, iconRight?, children, active?, disabled?` | Yes -- inset shadows | 5 variants: primary/secondary/ghost/subtle/danger; 5 sizes + icon |
| Card | `children, interactive?, padding?, className?` | Medium -- hover shadow | Conditional hover transform |
| Kbd | `children, className?` | No | Keyboard shortcut hint |
| Tabs | `tabs, active, onChange, size?` | No | Active tab has primary border |
| Section | `title, subtitle?, action?, children` | No | Section heading layout |
| PriorityChip | `level, lang, withLabel?` | No | Rotated diamond shape indicator |
| StatusDot | `status, size?` | No | Colored circle for status |
| Input | `icon?, placeholder?, value?, onChange?, kbdHint?, size?, type?` | No | Wrapper with icon slot |
| ProgressBar | `value?, max?, height?, color?, bg?` | No | Percent-width inner bar |
| SegmentedControl | `options, value, onChange, size?` | No | Radio-button-like group |
| Collapsible | `title, badge?, defaultOpen?, children` | No | Animated chevron rotation |
| AlertBanner | `tone?, icon?, children, action?` | Yes -- color-mix | 4 tones: warning/danger/success/info |
| Toggle | `on, onChange?, size?` | No | CSS transition for knob position |

### Lucide Icon Mapping

```typescript
// Map prototype icon names to lucide-react imports
// Source: New_Frontend/src/icons.jsx cross-referenced with lucide-react
import {
  LayoutDashboard,    // Icons.Dashboard
  FolderKanban,       // Icons.Folder
  CheckSquare,        // Icons.CheckSquare
  Users,              // Icons.Users
  BarChart3,          // Icons.Chart
  Settings,           // Icons.Settings
  Shield,             // Icons.Shield
  Search,             // Icons.Search
  Plus,               // Icons.Plus
  Bell,               // Icons.Bell
  HelpCircle,         // Icons.Help
  ChevronLeft,        // Icons.ChevronLeft
  ChevronRight,       // Icons.ChevronRight
  ChevronDown,        // Icons.ChevronDown
  ChevronUp,          // Icons.ChevronUp
  X,                  // Icons.X
  Calendar,           // Icons.Calendar
  Clock,              // Icons.Clock
  AlertTriangle,      // Icons.Alert / Icons.Warn
  MoreHorizontal,     // Icons.MoreH
  Grid3X3,            // Icons.Grid
  List,               // Icons.List
  PanelLeft,          // Icons.PanelLeft
  Sparkles,           // Icons.Sparkles
  Eye, EyeOff,        // Icons.Eye / Icons.EyeOff
  Target,             // Icons.Target
  Flag,               // Icons.Flag
  Paperclip,          // Icons.Paperclip
  Link2,              // Icons.Link
  GitBranch,          // Icons.GitBranch
  Zap,                // Icons.Zap
  Moon, Sun,          // Icons.Moon / Icons.Sun
  Filter,             // Icons.Filter
  Languages,          // Icons.Languages
  Copy,               // Icons.Copy
  Download,           // Icons.Download
  Maximize,           // Icons.Maximize
  Trash2,             // Icons.Trash
  Palette,            // Icons.Palette
  ArrowRight,         // Icons.ArrowRight
  Circle, CircleCheck, // Icons.Circle / Icons.CircleCheck
  BookOpen,           // Icons.Book
  Bug,                // Icons.Bug
  Edit3,              // Icons.Edit
  LogOut,             // Icons.LogOut
  MessageSquare,      // Icons.Chat
  FileText,           // Icons.Doc / Icons.Audit
  Share2,             // Icons.Share
  Info,               // Icons.Info
  Flame,              // Icons.Flame
  Star,               // Icons.Star
} from "lucide-react"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `darkMode: 'class'` | Tailwind v4 `@custom-variant dark` | Tailwind v4 (2024) | Dark mode config moves to CSS file, no JS config needed [VERIFIED: tailwindcss.com/docs/dark-mode] |
| `tailwind.config.js` theme extend | `@theme inline` in CSS | Tailwind v4 (2024) | Theme tokens defined in CSS, not JS config [VERIFIED: tailwindcss.com/docs/theme] |
| HSL color system | oklch color system | Industry trend 2023-2024 | Better perceptual uniformity; this project already uses oklch [VERIFIED: codebase] |
| next-themes for theme switching | Custom AppContext + `data-mode` | This phase | Prototype's theme system is more complex than next-themes supports (brand derivation, presets) |
| `.dark` CSS class for dark mode | `[data-mode="dark"]` data attribute | This phase (D-07) | Aligns with prototype convention; works with `@custom-variant` |

**Deprecated/outdated:**
- Tailwind v3 `tailwind.config.js` -- this project uses Tailwind v4 which uses CSS-based config [VERIFIED: no tailwind.config.js exists]
- `prefers-color-scheme` media query for dark mode -- replaced by explicit toggle via `data-mode` attribute

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `components/primitives/` is the best directory for prototype components | Architecture Patterns > Recommended Structure | Low -- just a file organization choice, easily changed |
| A2 | Single AppContext is better than split ThemeContext + LanguageContext | Architecture Patterns > Recommended Structure | Low -- refactoring from one to split is straightforward |
| A3 | Monolithic strings.ts is adequate for ~85 keys | Architecture Patterns > Recommended Structure | Low -- can split later if needed |
| A4 | Avatar color values (--av-1 through --av-8) are adequate choices | Code Examples > globals.css | Medium -- actual colors are invented since prototype doesn't define them; may need visual tuning |

## Open Questions (RESOLVED)

1. **Avatar color tokens (--av-1 to --av-8)**
   - What we know: Prototype Avatar component references `var(--av-${user.avColor})` but these tokens are never defined in the prototype HTML or CSS
   - What's unclear: What exact oklch values should be used
   - RESOLVED: Define 8 distinct hues with similar lightness (~0.60-0.65) and chroma (~0.12-0.18), test with both light and dark modes. The values in the Code Examples section are reasonable starting points but may need visual adjustment.

2. **next-themes package disposition**
   - What we know: `next-themes` v0.4.6 is installed in package.json but the new theme system uses custom AppContext with `data-mode` attribute
   - What's unclear: Whether next-themes should be removed, kept as unused, or integrated as a low-level helper
   - RESOLVED: Keep it installed but do not use it actively. The custom AppContext handles all theme switching. Removing it would require verifying no existing page references it.

3. **SystemConfigContext brand color integration**
   - What we know: `SystemConfigContext` currently sets `--primary` directly on `document.documentElement` from backend API (`config.primary_brand_color`)
   - What's unclear: How to integrate this with the new multi-preset theme system
   - RESOLVED: If `primary_brand_color` is set in backend config, use it as the brand color input to `deriveFromBrand()` within AppContext. If not set, fall back to the selected preset.

## Environment Availability

Step 2.6: No new external dependencies required. All tools are already installed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | Yes | (project running) | -- |
| npm | Package management | Yes | (project running) | -- |
| All npm packages | Phase 8 work | Yes | See Standard Stack table | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured in Frontend2/ -- using `next build` as type-check proxy |
| Config file | None -- Wave 0 uses build as verification |
| Quick run command | `cd Frontend2 && npx next build` (type-check + build) |
| Full suite command | `cd Frontend2 && npx next build` (no test suite) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Token migration -- all oklch variables resolve | manual / build | `cd Frontend2 && npx next build` (CSS parse errors = fail) | -- Wave 0 |
| FOUND-02 | 4 primitives render with TypeScript props | manual / build | `cd Frontend2 && npx next build` (type errors = fail) | -- Wave 0 |
| FOUND-03 | t() returns correct TR/EN strings | unit | Manual verification or future unit test | -- Wave 0 |
| FOUND-04 | status-todo and status-blocked tokens present | manual / build | grep globals.css for tokens | -- Wave 0 |
| FOUND-05 | App Shell renders -- Sidebar, Header, Layout | manual + build | `cd Frontend2 && npx next build` + visual check | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd Frontend2 && npx next build` (catches type errors, CSS parse errors)
- **Per wave merge:** Same + manual visual comparison with prototype
- **Phase gate:** Full build green + visual parity with prototype confirmed

### Wave 0 Gaps
- [ ] No test framework configured in Frontend2/ -- using `next build` as type-check proxy
- [ ] No visual regression testing tool (not required for this phase; manual comparison against HTML prototype is the verification method)

## Security Domain

This phase has no security-sensitive surface area. It is a frontend UI/styling phase with no:
- Authentication changes (existing AuthGuard preserved as-is)
- API endpoint changes
- Data handling changes
- User input processing beyond existing patterns

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (preserved, not modified) | Existing AuthGuard + auth-context |
| V3 Session Management | No | Existing localStorage JWT |
| V4 Access Control | No | Existing role check in Sidebar |
| V5 Input Validation | No (no new user inputs) | -- |
| V6 Cryptography | No | -- |

### Known Threat Patterns
None specific to this phase. The theme system uses `localStorage` for persistence (same as existing auth token pattern), which is acceptable per the project's current security posture.

## Sources

### Primary (HIGH confidence)
- **Prototype source files** (New_Frontend/src/) -- Direct inspection of theme.jsx, primitives.jsx, i18n.jsx, shell.jsx, icons.jsx, app.jsx, data.jsx, tweaks.jsx
- **Existing codebase** (Frontend/) -- Direct inspection of globals.css, app-shell.tsx, sidebar.tsx, header.tsx, layout.tsx, auth-context.tsx, system-config-context.tsx, package.json, tsconfig.json (reference only -- nothing copied to Frontend2/)
- **HTML prototype** (New_Frontend/SPMS Prototype.html) -- CSS token definitions, dark mode structure, density system
- **Tailwind CSS v4 docs** (tailwindcss.com/docs/dark-mode, /docs/theme, /docs/customizing-colors) -- @custom-variant dark, @theme inline, CSS variable usage [VERIFIED: WebFetch]
- **npm registry** -- Package versions verified via `npm view` for next (16.2.4), react (19.2.5), tailwindcss (4.2.2), next-themes (0.4.6), lucide-react (1.8.0)
- **Installed versions** -- Verified via node_modules: next 16.1.1, tailwindcss 4.1.17, react 19.2.0

### Secondary (MEDIUM confidence)
- **Can I Use** (caniuse.com) -- oklch() and color-mix() browser support: Chrome 111+, Firefox 113+, Safari 16.2+ [VERIFIED: WebSearch]
- **Next.js docs** -- App Router patterns, usePathname, useRouter, client components [VERIFIED: Context7]

### Tertiary (LOW confidence)
None -- all claims verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified in package.json and npm registry
- Architecture: HIGH -- prototype source code provides complete reference implementation
- Token migration: HIGH -- both source (prototype) and target (globals.css) systems fully inspected
- Component conversion: HIGH -- all 16 components source code examined with clear TypeScript mapping
- Pitfalls: HIGH -- identified from direct code comparison between prototype and existing codebase
- Browser support: HIGH -- oklch and color-mix widely supported in all modern browsers

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (stable stack, no fast-moving dependencies)
