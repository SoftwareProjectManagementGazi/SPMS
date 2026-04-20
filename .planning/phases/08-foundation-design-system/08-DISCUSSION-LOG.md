# Phase 8: Foundation & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 08-foundation-design-system
**Areas discussed:** Theme token migration, Primitive component design, I18n architecture, App Shell conversion scope

---

## Theme Token Migration

### Source of Truth
| Option | Description | Selected |
|--------|-------------|----------|
| app/globals.css | Prototype tokens with blue/purple hue (264) | |
| styles/globals.css | Default shadcn neutral grey tokens | |
| Merge both | Combine: prototype palette primary, cherry-pick from styles | |

**User's choice:** Neither — user clarified that `New_Frontend/` is the actual prototype, not the old Frontend CSS files. Old Frontend globals.css is irrelevant.
**Notes:** User corrected the assumption: "bu eski frontendden kalan global.cssleri niye kullanmaya calisiyoruz? yeni New_Frontend in tasarimina mudahale edilmeyecek"

### Component Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Prototype → TSX | Convert primitives.jsx components to TypeScript React | ✓ |
| Shadcn'i uyarla | Restyle shadcn components to match prototype | |
| Hibrit | Simple ones from prototype, complex from shadcn | |

**User's choice:** Prototype → TSX
**Notes:** Shadcn components kept only for complex overlays (Dialog, Popover, Sheet)

### Token Naming
| Option | Description | Selected |
|--------|-------------|----------|
| Prototype isimlerini koru | Keep --bg, --surface, --fg names | |
| Shadcn isimlerine esle | Map --bg → --background, --surface → --card, etc. | ✓ |

**User's choice:** Shadcn isimlerine esle
**Notes:** User asked whether shadcn mapping would break the art style. Clarified it's purely a name change — oklch values are preserved identically. Prototype-specific extras (--bg-2, --surface-2, --inset-*, --status-*, --priority-*) kept as-is.

---

## Primitive Component Design

### Scope
| Option | Description | Selected |
|--------|-------------|----------|
| Tum primitives | All 16 components from primitives.jsx | ✓ |
| Sadece FOUND-02 (4 component) | ProgressBar, SegmentedControl, Collapsible, AlertBanner only | |
| FOUND-02 + temel olanlar | 4 required + Button, Card, Badge, Input | |

**User's choice:** Tum primitives
**Notes:** All 16 converted now so subsequent phases have a complete library

### Styling Approach
| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind'e donustur | Convert inline styles to Tailwind utility classes | ✓ |
| Inline style'lari koru | Keep prototype's inline styles as-is | |
| CSS Modules | Per-component .module.css files | |

**User's choice:** Tailwind'e donustur
**Notes:** Matches existing project convention — all Next.js components use Tailwind

---

## I18n Architecture

### Approach
| Option | Description | Selected |
|--------|-------------|----------|
| React Context + JSON | useApp() context + t() function + strings.ts | |
| next-intl | Full i18n library with routing and middleware | |
| Tek dosya inline | Prototype STRINGS object ported directly | |

**User's choice:** Initially asked about next-intl ("daha clean bir cozum varsayiyorum?"). After trade-off analysis (URL routing unnecessary, 2 languages only, prototype already has working t()), chose simple approach.
**Notes:** Explained next-intl requires middleware and layout changes for minimal benefit with only 2 languages.

### Default Language
| Option | Description | Selected |
|--------|-------------|----------|
| Turkce (tr) default | Matches prototype | ✓ |
| Ingilizce (en) default | International standard | |

**User's choice:** Turkce (tr) default

---

## App Shell Conversion Scope

### Shell Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Prototype'den yeniden yaz | Rewrite from shell.jsx to TSX | ✓ |
| Mevcut shell'i genislet | Extend existing app-shell.tsx | |

**User's choice:** Prototype'den yeniden yaz
**Notes:** Current app-shell.tsx is too simple compared to prototype's rich shell

### Theme UI Scope
| Option | Description | Selected |
|--------|-------------|----------|
| Evet, bu fazda | Full theme system: 6 presets + brand derivation + toggle | ✓ |
| Hayir, Settings fazinda | Only tokens and default theme now | |
| Temel toggle + presets | Light/dark + presets now, brand derivation later | |

**User's choice:** Evet, bu fazda

### Routing
| Option | Description | Selected |
|--------|-------------|----------|
| Next.js App Router | File-based routing, useRouter from next/navigation | ✓ |
| Prototype RouterContext | Client-side SPA routing preserved | |

**User's choice:** Next.js App Router

---

## Claude's Discretion

- Component file organization
- strings.ts structure (single vs split)
- Tailwind class choices for prototype fidelity
- AppContext provider split strategy
- Dark mode attribute approach (data-mode vs .dark class)

## Deferred Ideas

None — discussion stayed within phase scope
