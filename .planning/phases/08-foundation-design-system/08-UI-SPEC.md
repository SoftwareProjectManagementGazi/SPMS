---
phase: 8
slug: foundation-design-system
status: draft
shadcn_initialized: true
preset: new-york (neutral base)
created: 2026-04-20
---

# Phase 8 — UI Design Contract

> Visual and interaction contract for the foundation and design system phase. This phase is a controlled port of the HTML prototype (`New_Frontend/`) to Next.js + TypeScript + Tailwind CSS v4. The contract codifies the prototype's existing visual system -- not new creative design work.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (existing, style: new-york) |
| Preset | new-york / neutral base -- token values replaced by prototype oklch palette (D-02) |
| Component library | Radix UI (via shadcn/ui for complex overlays only); 16 custom primitives from prototype |
| Icon library | lucide-react 0.454.0 (already installed; prototype icons mapped to lucide equivalents) |
| Font | Inter (sans, via `next/font/google`), Geist Mono (mono, via `next/font/google`) |

**Source:** components.json detected at `Frontend/components.json`. shadcn new-york style with neutral base color and lucide icons. 59 existing shadcn/ui components retained for complex overlays (Dialog, Popover, Sheet, Select, DropdownMenu, Command, etc.). Prototype primitives live in `components/primitives/` alongside but separate from `components/ui/`.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge dot spacing, inline padding |
| sm | 8px | Nav item gaps, compact element spacing, sidebar internal padding |
| md | 16px | Default element spacing, section padding, alert banner padding |
| lg | 24px | Card padding, section heading spacing |
| xl | 32px | Layout gaps between major regions |
| 2xl | 48px | Page-level vertical breaks |
| 3xl | 64px | Not used in this phase |

Exceptions (all are intentional prototype fidelity values per locked decision D-04):
- Sidebar width: 232px expanded, 56px collapsed (prototype-defined, not on 8-point grid)
- Header height: 52px (prototype-defined, matches sidebar logo area)
- Nav item height: 30px (prototype-defined)
- Density row heights: 28px (compact), 34px (cozy), 40px (comfortable) -- via `--density-row` CSS variable. The 34px cozy value is an intentional prototype fidelity exception (D-04).
- AvatarStack negative margin overlap: -6px between stacked avatars. This negative spacing is an intentional prototype fidelity exception (D-04) for the overlapping avatar visual effect.
- Badge heights: 18px (xs), 20px (sm) -- content-driven sizing. The 18px value is an intentional prototype fidelity exception (D-04).

**Source:** Spacing values extracted from `New_Frontend/src/shell.jsx` (sidebar: width 232/56, header: height 52, nav: height 30, padding 8/10/14/16) and `New_Frontend/src/primitives.jsx` (button sizes, badge padding, section padding). All spacings match prototype exactly per D-04.

---

## Typography

### Canonical Type Scale (4 sizes, 2 weights)

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 14px | 400 (regular) | 1.45 | Default text, input text, non-active nav items, breadcrumb segments |
| Label | 13px | 600 (semibold) | 1.4 | Active nav items, sidebar menu items, section titles, sidebar logo name, button text |
| Caption | 11px | 400 (regular) | 1.3 | Badge text, sidebar section labels, Kbd hints, subtitle/meta text |
| Small | 9px | 600 (semibold) | 1.0 | Notification count badge (component-internal only, see note below) |

### Font Weights (2 only)

| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, captions, non-active nav items, breadcrumb segments, input text, subtitle/meta text |
| 600 | Semibold | Active nav items, section titles, button text, sidebar labels, user name, badge emphasis, label text |

**Weight 500 (medium) is eliminated.** All elements previously specified as weight 500 are reassigned to 400 (regular). Rationale: at sizes 13-14px, the visual difference between 400 and 500 is minimal; consolidating to 400 reduces the type contract without perceptible visual regression. The two chosen weights (400 and 600) provide clear visual hierarchy between normal content and emphasized/interactive elements.

### Component-Level Size Deviations

The prototype uses sub-pixel and intermediate sizes at the component level. These are NOT canonical type scale entries but are documented as implementation details for prototype fidelity per D-04:

| Component | Prototype Size | Maps To | Implementation Note |
|-----------|---------------|---------|---------------------|
| Sidebar menu items | 12.5px | Label (13px) | Use 13px; 0.5px difference is imperceptible |
| Section subtitles | 12px | Label (13px) | Use 13px for consistency; or 11px Caption if de-emphasis is needed |
| Priority chips | 12px | Label (13px) | Use 13px; chip size provides sufficient visual containment |
| Sidebar section labels | 10.5px | Caption (11px) | Use 11px; 0.5px rounding is imperceptible |
| Badge text (small variant) | 10.5px | Caption (11px) | Use 11px; badge padding provides visual sizing |
| Badge text (large variant) | 11.5px | Caption (11px) | Use 11px; 0.5px rounding is imperceptible |
| Notification count | 9px | Small (9px) | Retained at 9px -- this is a component-internal anomaly for the notification bell counter only. The extremely small size is necessary to fit a 2-digit count within the 16px notification badge circle. |

**Note:** This prototype uses a compact typographic scale. There is no display/hero size because Phase 8 is the shell and primitives layer -- no page content headings are rendered in this phase. Larger heading sizes (16px, 20px, 24px) will be declared in subsequent phase UI-SPECs when page content is converted.

**Source:** Base font-size 14px and line-height 1.45 from `New_Frontend/SPMS Prototype.html` line 86-87. Component-specific sizes from `primitives.jsx` (Button sizes: 12-14px, Badge: 10.5-11.5px, Tabs: 12-14px, Section: 12-13px) and `shell.jsx` (Nav: 13px, Sidebar labels: 10.5px, User area: 11-12.5px).

---

## Color

This phase establishes a **multi-preset theme system** with 6 color presets. The default preset (Terracotta) defines the 60/30/10 split. All presets follow the same token structure.

### Default Preset (Terracotta) -- Light Mode

| Role | Token | Value (oklch) | Usage |
|------|-------|---------------|-------|
| Dominant (60%) | `--background` | `oklch(0.985 0.006 75)` | Page background |
| Dominant (60%) | `--bg-2` | `oklch(0.97 0.008 70)` | Sidebar background, secondary surfaces |
| Secondary (30%) | `--card` | `oklch(1 0 0)` | Cards, content panels, popovers |
| Secondary (30%) | `--surface-2` | `oklch(0.975 0.006 70)` | Badge neutral bg, muted surfaces, avatar overflow bg |
| Accent (10%) | `--primary` | `oklch(0.60 0.17 40)` | See reserved list below |
| Destructive | `--destructive` | `oklch(0.58 0.22 25)` | Destructive button variant, danger alerts |

### Accent Reserved For (all presets)

The `--primary` accent color is reserved exclusively for:
1. **Active nav item icon color** -- sidebar active state icon tint
2. **Active tab bottom border** -- 2px solid underline on active tab
3. **Primary button background** -- Button variant="primary" fill
4. **Primary button hover** -- via `--primary-hover` (darker shade)
5. **Focus ring** -- via `--ring` (primary at 40% opacity)
6. **Badge primary tone** -- color-mix at 12% opacity for bg
7. **Sidebar logo icon background** -- 26x26px brand mark
8. **Theme preset accent dot** -- in preset selector

Accent is NEVER used for: body text, borders, card backgrounds, secondary button fills, or general surface coloring.

### Semantic Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--status-todo` | `oklch(0.62 0.012 60)` | StatusDot for todo state |
| `--status-progress` | `oklch(0.55 0.15 230)` | StatusDot for in-progress state, info badge tone |
| `--status-review` | `oklch(0.65 0.15 65)` | StatusDot for review state, warning badge tone |
| `--status-done` | `oklch(0.58 0.14 150)` | StatusDot for done state, success badge tone |
| `--status-blocked` | `oklch(0.58 0.20 25)` | StatusDot for blocked state (FOUND-04 requirement) |

### Semantic Priority Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--priority-critical` | `oklch(0.58 0.22 25)` | PriorityChip critical, destructive actions |
| `--priority-high` | `oklch(0.65 0.18 45)` | PriorityChip high |
| `--priority-med` | `oklch(0.67 0.13 80)` | PriorityChip medium (renamed from `--priority-medium`) |
| `--priority-low` | `oklch(0.60 0.05 240)` | PriorityChip low |

### Text Colors (foreground hierarchy)

| Token | Value | Usage |
|-------|-------|-------|
| `--foreground` | `oklch(0.20 0.025 50)` | Primary text, active nav labels, section titles |
| `--muted-foreground` / `--fg-muted` | `oklch(0.48 0.018 55)` | Inactive nav labels, subtitles, secondary text |
| `--fg-subtle` | `oklch(0.62 0.012 60)` | Sidebar section labels, version text, icon default color |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `oklch(0.90 0.01 65)` | Default borders, sidebar divider, tab underline base |
| `--border-strong` | `oklch(0.82 0.015 60)` | Emphasized borders, input focus adjacent |

### Shadow and Depth Tokens

5 shadow levels (`--shadow-sm` through `--shadow-xl`) and 5 inset tokens (`--inset-top`, `--inset-bottom`, `--inset-card`, `--inset-primary-top`, `--inset-primary-bottom`) with separate light/dark mode values. The inset tokens create the distinctive "raised button" look with top-highlight and bottom-shadow edge effects.

### Avatar Background Colors

8 fixed oklch colors (`--av-1` through `--av-8`) for user avatar backgrounds. Distinct hues at similar lightness (0.60-0.65) and chroma (0.10-0.18). Must be readable with white (#fff) text overlay in both light and dark modes.

### Dark Mode

Dark mode is activated via `data-mode="dark"` attribute on `<html>`, NOT the `.dark` CSS class. The Tailwind `@custom-variant dark` directive is updated to:
```css
@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *));
```

This ensures both prototype components and existing shadcn/ui components respond to the same dark mode trigger.

**All 6 presets:** Default (Terracotta, light), Ocean (light), Forest (light), Monochrome (light), Midnight (dark), Graphite (dark). Each preset provides the full set of tokens listed above. The `deriveFromBrand()` function generates a complete token set from any arbitrary oklch hue.

**Source:** Token values from `New_Frontend/src/theme.jsx` PRESETS object. Status tokens from FOUND-04 requirement + prototype CSS. Dark mode approach from RESEARCH.md Pattern 1. Shadow/inset values from RESEARCH.md Code Examples section.

---

## Copywriting Contract

Phase 8 is a foundation/infrastructure phase. It establishes the App Shell, theme system, primitives library, and i18n -- but does NOT render page-level content. Copywriting applies to the shell UI elements and component default states.

| Element | Copy (TR) | Copy (EN) |
|---------|-----------|-----------|
| Sidebar section label (workspace) | CALISMA | WORKSPACE |
| Sidebar section label (admin) | YONETIM | ADMIN |
| Nav: Dashboard | Panel | Dashboard |
| Nav: Projects | Projeler | Projects |
| Nav: My Tasks | Gorevlerim | My Tasks |
| Nav: Teams | Takimlar | Teams |
| Nav: Reports | Raporlar | Reports |
| Nav: Settings | Ayarlar | Settings |
| Nav: Admin Panel | Admin Paneli | Admin Panel |
| Theme toggle (to dark) | Karanlik mod | Dark mode |
| Theme toggle (to light) | Aydinlik mod | Light mode |
| Sidebar collapse tooltip | Daralt | Collapse |
| Sidebar expand tooltip | Genislet | Expand |
| Search placeholder | Ara... | Search... |
| Create button | Olustur | Create |
| User menu: Profile | Profilim | My Profile |
| User menu: Settings | Ayarlar | Settings |
| User menu: Help | Yardim | Help |
| User menu: Logout | Cikis Yap | Log Out |

**Note on "Create / Olustur" button:** This is an intentional global action picker pattern. The button opens a dropdown menu (via shadcn DropdownMenu) that lists contextual creation options (e.g., "New Project", "New Task", "New Team"). The single-word label without a noun is deliberate -- the button serves as a universal creation entry point and the noun is supplied by the dropdown menu items. This follows the same pattern as tools like Linear ("Create") and Jira ("+"). The icon is `Plus` (lucide-react) displayed to the left of the label.

### Accessibility Labels for Icon-Only Header Buttons

Icon-only buttons in the Header region must include `aria-label` attributes for screen reader accessibility:

| Button | Icon | aria-label (TR) | aria-label (EN) |
|--------|------|-----------------|-----------------|
| Theme toggle (dark) | Moon | Karanlik moda gec | Switch to dark mode |
| Theme toggle (light) | Sun | Aydinlik moda gec | Switch to light mode |
| Notifications | Bell | Bildirimler | Notifications |
| Search (collapsed) | Search | Ara | Search |

### Empty State (for primitive components)

| Component | Empty State |
|-----------|-------------|
| ProgressBar | Renders at 0% width (no text needed) |
| SegmentedControl | First option selected by default (no empty state) |
| Collapsible | Renders collapsed with chevron-right icon |
| AlertBanner | Not displayed when no alert condition exists (conditional render) |

### Error State

No error states are introduced in Phase 8 primitives. Error handling for theme loading failure: fall back to the default preset without showing an error to the user. If `localStorage` theme data is corrupted, silently reset to defaults.

### Destructive Actions

No destructive actions exist in Phase 8 scope. The Shell's user menu "Cikis Yap / Log Out" action uses the existing auth-context logout flow (no confirmation dialog -- consistent with existing behavior).

**Source:** Navigation labels from `New_Frontend/src/i18n.jsx` STRINGS object. User menu items from `New_Frontend/src/shell.jsx` sidebar user area. Default language is Turkish per D-06.

---

## Component Inventory

16 primitive components are delivered in this phase. Each has a TypeScript props interface, uses `"use client"` directive, exports as named function, and supports a `className` prop for Tailwind composition.

| Component | Key Props | Variants/Tones | Complex Styles |
|-----------|-----------|-----------------|----------------|
| Avatar | `user, size?, ring?, className?` | -- | No (uses `--av-*` tokens) |
| AvatarStack | `users, max?, size?` | -- | No (negative margin overlap) |
| Badge | `children, tone?, size?, dot?, className?` | 7 tones: neutral/primary/success/warning/danger/info/mono; 2 sizes: xs/sm | Yes -- `color-mix(in oklch, ...)` for bg/border (keep as inline style) |
| Button | `variant?, size?, icon?, iconRight?, children, active?, disabled?, className?` | 5 variants: primary/secondary/ghost/subtle/danger; 5 sizes: xs/sm/md/lg/icon | Yes -- inset shadow tokens for raised look |
| Card | `children, interactive?, padding?, className?` | -- | Medium -- conditional hover shadow+transform |
| Kbd | `children, className?` | -- | No |
| Tabs | `tabs, active, onChange, size?` | 3 sizes: sm/md/lg | No (active border is simple) |
| Section | `title, subtitle?, action?, children` | -- | No |
| PriorityChip | `level, lang, withLabel?` | 4 levels: critical/high/medium/low | No (rotated diamond via 45deg transform) |
| StatusDot | `status, size?` | 5 statuses: todo/progress/review/done/blocked | No (colored circle) |
| Input | `icon?, placeholder?, value?, onChange?, kbdHint?, size?, type?, className?` | -- | No (icon slot layout) |
| ProgressBar | `value?, max?, height?, color?, bg?, className?` | -- | No (percent-width inner bar) |
| SegmentedControl | `options, value, onChange, size?` | 2 sizes: xs/default | No |
| Collapsible | `title, badge?, defaultOpen?, children` | -- | No (chevron rotation animation) |
| AlertBanner | `tone?, icon?, children, action?` | 4 tones: warning/danger/success/info | Yes -- `color-mix(in oklch, ...)` (keep as inline style) |
| Toggle | `on, onChange?, size?` | -- | No (CSS transition for knob) |

**Conversion rule for complex styles:** Badge, Button (inset shadows), AlertBanner use `color-mix()` with CSS variable arguments. These MUST remain as inline `style={}` props -- do NOT force into Tailwind arbitrary value syntax. All static styles convert to Tailwind classes per D-04.

**Source:** Complete component API from `New_Frontend/src/primitives.jsx`. Conversion pattern from RESEARCH.md Pattern 2.

---

## App Shell Layout Contract

| Region | Spec |
|--------|------|
| Sidebar (expanded) | 232px wide, sticky, full viewport height, `--bg-2` background, 1px right border |
| Sidebar (collapsed) | 56px wide, icons only, tooltip on hover for labels |
| Sidebar transition | `width 0.18s ease` CSS transition |
| Header | Full width of content area, 52px height (matches sidebar logo row), sticky top: 0 |
| Main content | Fills remaining width, scrollable, receives page content via App Router outlet |
| Overall layout | Horizontal flex: `[Sidebar] [Header + Main vertical stack]` |

### Visual Focal Point

The App Shell main screen focal point is the **main content area** (the region to the right of the sidebar and below the header). On initial load with no page content, this region displays the Dashboard page (first nav item, selected by default). The sidebar provides persistent navigation context (left rail), and the header provides contextual tools (breadcrumb, search, actions). The visual weight flows: sidebar active item (accent-colored icon) draws the eye to the navigation context, then the main content area provides the workspace. The sidebar logo mark (top-left, 26x26px accent background) serves as the brand anchor.

### Keyboard Shortcuts (Shell)

| Shortcut | Action |
|----------|--------|
| G D | Navigate to Dashboard |
| G P | Navigate to Projects |
| G T | Navigate to My Tasks |

Shortcuts are displayed as `<Kbd>` hints in sidebar nav items (expanded state only).

### Theme Integration Points

| Integration | Mechanism |
|-------------|-----------|
| Preset switching | `applyPreset(id)` in AppContext sets CSS variables via `applyTokens()` on `document.documentElement` |
| Dark/light toggle | `applyMode(mode)` sets `data-mode` attribute on `<html>` |
| Custom brand color | `deriveFromBrand({ L, C, H })` computes full token set from any oklch color |
| Persistence | `localStorage` for preset, mode, language, sidebar state, density |
| SystemConfigContext conflict resolution | Backend `primary_brand_color` feeds into AppContext `deriveFromBrand()` instead of directly setting `--primary` |

**Source:** Shell layout from `New_Frontend/src/shell.jsx`. Theme integration from RESEARCH.md Patterns 4 and 5, and Pitfall 7.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | 59 existing components (retained for overlays: Dialog, Popover, Sheet, Select, DropdownMenu, Command, etc.) | not required |
| Third-party | none | not applicable |

No new shadcn components are added in this phase. No third-party registries are used. The 16 primitive components are hand-ported from the prototype source code, not installed from any registry.

---

## Interaction Contracts

### Sidebar Collapse/Expand
- **Trigger:** Toggle button in sidebar bottom area or keyboard shortcut
- **Animation:** Width transitions from 232px to 56px over 0.18s ease
- **State persistence:** `sidebarCollapsed` saved to localStorage
- **Collapsed behavior:** Nav items show icon only; tooltip with label on hover

### Nav Item Hover/Active States
- **Hover (inactive):** Background changes to `var(--surface-2)` on mouseenter, transparent on mouseleave
- **Active:** Background `var(--accent)`, text weight 600, icon tinted `var(--primary)`
- **Transition:** `background 0.1s, color 0.1s`

### Theme Mode Toggle
- **Trigger:** Moon/Sun icon button in header
- **Effect:** Sets `data-mode="light"` or `data-mode="dark"` on `<html>` element
- **Transition:** Immediate (no cross-fade animation)
- **Side effect:** Switches to appropriate preset if needed (e.g., dark mode auto-selects midnight preset if configured)

### Collapsible Component
- **Trigger:** Click on title row
- **Animation:** Chevron rotates from 0deg (collapsed) to 90deg (expanded); content height transitions
- **Default state:** Controlled by `defaultOpen` prop

### Toggle Component
- **Trigger:** Click
- **Animation:** Knob slides left/right with CSS transition
- **State:** Controlled via `on` prop + `onChange` callback

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
