# Phase 8: Foundation & Design System - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 24 new files in Frontend2/
**Analogs found:** 24 / 24

## Critical Constraints

- ALL output files target `Frontend2/` -- a fresh Next.js project
- `Frontend/` is COMPLETELY IGNORED -- nothing is copied or referenced from it
- shadcn/ui is NOT used -- not even for overlays
- ALL UI comes 100% from `New_Frontend/` prototype -- pixel-perfect faithful
- Analogs are exclusively from `New_Frontend/src/*.jsx` and `New_Frontend/SPMS Prototype.html`

## File Classification

| New File (in Frontend2/) | Role | Data Flow | Closest Analog | Match Quality |
|--------------------------|------|-----------|----------------|---------------|
| `app/globals.css` | config | -- | `New_Frontend/SPMS Prototype.html` :root block | exact |
| `app/layout.tsx` | provider | request-response | `New_Frontend/src/app.jsx` App component | exact |
| `lib/theme.ts` | utility | transform | `New_Frontend/src/theme.jsx` | exact |
| `lib/i18n.ts` | utility | transform | `New_Frontend/src/i18n.jsx` | exact |
| `context/app-context.tsx` | provider | event-driven | `New_Frontend/src/app.jsx` useAppState + `shell.jsx` AppContext | exact |
| `components/app-shell.tsx` | component | request-response | `New_Frontend/src/app.jsx` App layout div | exact |
| `components/sidebar.tsx` | component | event-driven | `New_Frontend/src/shell.jsx` Sidebar (lines 49-97) | exact |
| `components/header.tsx` | component | event-driven | `New_Frontend/src/shell.jsx` Header (lines 157-197) | exact |
| `components/breadcrumb.tsx` | component | request-response | `New_Frontend/src/shell.jsx` Breadcrumb (lines 199-239) | exact |
| `components/primitives/avatar.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` Avatar (lines 6-20) | exact |
| `components/primitives/avatar-stack.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` AvatarStack (lines 22-43) | exact |
| `components/primitives/badge.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` Badge (lines 46-70) | exact |
| `components/primitives/button.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` Button (lines 73-118) | exact |
| `components/primitives/card.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` Card (lines 121-142) | exact |
| `components/primitives/kbd.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` Kbd (lines 145-154) | exact |
| `components/primitives/tabs.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` Tabs (lines 157-181) | exact |
| `components/primitives/section.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` Section (lines 184-195) | exact |
| `components/primitives/priority-chip.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` PriorityChip (lines 198-207) | exact |
| `components/primitives/status-dot.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` StatusDot (lines 210-213) | exact |
| `components/primitives/input.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` Input (lines 216-233) | exact |
| `components/primitives/progress-bar.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` ProgressBar (lines 236-240) | exact |
| `components/primitives/segmented-control.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` SegmentedControl (lines 243-256) | exact |
| `components/primitives/collapsible.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` Collapsible (lines 259-272) | exact |
| `components/primitives/alert-banner.tsx` | component | request-response | `New_Frontend/src/primitives.jsx` AlertBanner (lines 275-287) | exact |
| `components/primitives/toggle.tsx` | component | event-driven | `New_Frontend/src/primitives.jsx` Toggle (lines 290-304) | exact |
| `components/primitives/index.ts` | config | -- | -- (barrel export, no analog needed) | -- |

## Pattern Assignments

### `Frontend2/app/globals.css` (config)

**Analog:** `New_Frontend/SPMS Prototype.html` lines 10-112

**CSS token definitions** (lines 11-63 of prototype HTML):
```css
:root {
  --font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius: 8px;
  --radius-sm: 6px;
  --radius-lg: 12px;

  --bg: oklch(0.985 0.006 75);
  --bg-2: oklch(0.97 0.008 70);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.975 0.006 70);
  --fg: oklch(0.20 0.025 50);
  --fg-muted: oklch(0.48 0.018 55);
  --fg-subtle: oklch(0.62 0.012 60);
  --border: oklch(0.90 0.01 65);
  --border-strong: oklch(0.82 0.015 60);

  --primary: oklch(0.60 0.17 40);
  --primary-fg: oklch(0.985 0.005 75);
  --primary-hover: oklch(0.55 0.18 40);
  --accent: oklch(0.93 0.03 50);
  --accent-fg: oklch(0.25 0.04 50);
  --ring: oklch(0.60 0.17 40 / 0.4);

  --status-todo: oklch(0.62 0.012 60);
  --status-progress: oklch(0.55 0.15 230);
  --status-review: oklch(0.65 0.15 65);
  --status-done: oklch(0.58 0.14 150);
  --status-blocked: oklch(0.58 0.20 25);

  --priority-critical: oklch(0.58 0.22 25);
  --priority-high: oklch(0.65 0.18 45);
  --priority-med: oklch(0.67 0.13 80);
  --priority-low: oklch(0.60 0.05 240);

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.06);
  --shadow: 0 2px 8px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.06);
  --shadow-lg: 0 12px 28px oklch(0 0 0 / 0.12), 0 4px 8px oklch(0 0 0 / 0.08);
  --shadow-xl: 0 20px 40px oklch(0 0 0 / 0.14), 0 8px 16px oklch(0 0 0 / 0.1);

  --inset-top:    inset 0  1px 0 oklch(1    0    0    / 0.65);
  --inset-bottom: inset 0 -1px 0 oklch(0.2  0    0    / 0.10);
  --inset-card:   inset 0  1px 0 oklch(1    0    0    / 0.80), inset 0 -1px 0 oklch(0.2 0 0 / 0.06);
  --inset-primary-top:    inset 0  1px 0 oklch(1    0    0    / 0.20);
  --inset-primary-bottom: inset 0 -1px 0 oklch(0.1  0.05 40   / 0.30);
}
```

**Dark mode tokens** (lines 65-79 of prototype HTML):
```css
[data-mode="dark"] {
  --inset-top:    inset 0  1px 0 oklch(0.30 0    0    / 0.50);
  --inset-bottom: inset 0 -1px 0 oklch(0.10 0    0    / 0.70);
  --inset-card:   inset 0  1px 0 oklch(0.28 0    0    / 0.55), inset 0 -1px 0 oklch(0.10 0 0 / 0.60);
  --inset-primary-top:    inset 0  1px 0 oklch(0.28 0.06 40   / 0.50);
  --inset-primary-bottom: inset 0 -1px 0 oklch(0.10 0.02 40   / 0.80);

  --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.25);
  --shadow:    0 2px 8px oklch(0 0 0 / 0.35), 0 1px 3px oklch(0 0 0 / 0.20);
  --shadow-md: 0 4px 14px oklch(0 0 0 / 0.40), 0 2px 6px oklch(0 0 0 / 0.25);
  --shadow-lg: 0 12px 30px oklch(0 0 0 / 0.50), 0 4px 10px oklch(0 0 0 / 0.30);
  --shadow-xl: 0 20px 44px oklch(0 0 0 / 0.55), 0 8px 18px oklch(0 0 0 / 0.35);
}
```

**Base reset and utility classes** (lines 82-112 of prototype HTML):
```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.45;
  color: var(--fg);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "cv11", "ss01", "ss03";
}
button { font-family: inherit; font-size: inherit; color: inherit; background: transparent; border: 0; cursor: pointer; padding: 0; }
input, textarea, select { font-family: inherit; color: inherit; outline: none; }
input:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
.mono { font-family: var(--font-mono); font-feature-settings: "ss01"; font-variant-numeric: tabular-nums; }

[data-density="compact"] { --density-row: 28px; }
[data-density="cozy"] { --density-row: 34px; }
[data-density="comfortable"] { --density-row: 40px; }
```

**Tailwind v4 integration note:** Wrap prototype tokens in `@theme inline` directive. Use `@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *));` for dark mode variant support. Add avatar color tokens `--av-1` through `--av-8` (not defined in prototype -- use distinct oklch hues at L~0.62, C~0.15).

---

### `Frontend2/lib/theme.ts` (utility, transform)

**Analog:** `New_Frontend/src/theme.jsx` (entire file, 192 lines)

**PRESETS data structure** (lines 4-137):
```jsx
const PRESETS = {
  default: {
    id: "default",
    name: { tr: "Varsayilan (Terracotta)", en: "Default (Terracotta)" },
    mode: "light",
    tokens: {
      bg: "oklch(0.985 0.006 75)",
      "bg-2": "oklch(0.97 0.008 70)",
      surface: "oklch(1 0 0)",
      "surface-2": "oklch(0.975 0.006 70)",
      fg: "oklch(0.20 0.025 50)",
      "fg-muted": "oklch(0.48 0.018 55)",
      "fg-subtle": "oklch(0.62 0.012 60)",
      border: "oklch(0.90 0.01 65)",
      "border-strong": "oklch(0.82 0.015 60)",
      primary: "oklch(0.60 0.17 40)",
      "primary-fg": "oklch(0.985 0.005 75)",
      "primary-hover": "oklch(0.55 0.18 40)",
      accent: "oklch(0.93 0.03 50)",
      "accent-fg": "oklch(0.25 0.04 50)",
      ring: "oklch(0.60 0.17 40 / 0.4)",
    },
  },
  ocean: {
    id: "ocean",
    name: { tr: "Okyanus", en: "Ocean" },
    mode: "light",
    tokens: {
      bg: "oklch(0.985 0.006 220)",
      "bg-2": "oklch(0.97 0.01 215)",
      surface: "oklch(1 0 0)",
      "surface-2": "oklch(0.975 0.008 220)",
      fg: "oklch(0.20 0.03 230)",
      "fg-muted": "oklch(0.48 0.025 225)",
      "fg-subtle": "oklch(0.62 0.015 225)",
      border: "oklch(0.90 0.012 220)",
      "border-strong": "oklch(0.82 0.018 220)",
      primary: "oklch(0.55 0.15 210)",
      "primary-fg": "oklch(0.985 0.005 220)",
      "primary-hover": "oklch(0.50 0.16 210)",
      accent: "oklch(0.93 0.03 215)",
      "accent-fg": "oklch(0.25 0.05 215)",
      ring: "oklch(0.55 0.15 210 / 0.4)",
    },
  },
  forest: {
    id: "forest",
    name: { tr: "Orman", en: "Forest" },
    mode: "light",
    tokens: {
      bg: "oklch(0.985 0.006 150)",
      "bg-2": "oklch(0.97 0.01 145)",
      surface: "oklch(1 0 0)",
      "surface-2": "oklch(0.975 0.008 150)",
      fg: "oklch(0.20 0.03 160)",
      "fg-muted": "oklch(0.48 0.02 155)",
      "fg-subtle": "oklch(0.62 0.012 155)",
      border: "oklch(0.90 0.012 150)",
      "border-strong": "oklch(0.82 0.018 150)",
      primary: "oklch(0.50 0.14 150)",
      "primary-fg": "oklch(0.985 0.005 150)",
      "primary-hover": "oklch(0.45 0.15 150)",
      accent: "oklch(0.93 0.03 145)",
      "accent-fg": "oklch(0.25 0.05 150)",
      ring: "oklch(0.50 0.14 150 / 0.4)",
    },
  },
  monochrome: {
    id: "monochrome",
    name: { tr: "Monokrom", en: "Monochrome" },
    mode: "light",
    tokens: {
      bg: "oklch(0.985 0 0)",
      "bg-2": "oklch(0.97 0 0)",
      surface: "oklch(1 0 0)",
      "surface-2": "oklch(0.975 0 0)",
      fg: "oklch(0.18 0 0)",
      "fg-muted": "oklch(0.48 0 0)",
      "fg-subtle": "oklch(0.62 0 0)",
      border: "oklch(0.90 0 0)",
      "border-strong": "oklch(0.78 0 0)",
      primary: "oklch(0.22 0 0)",
      "primary-fg": "oklch(0.99 0 0)",
      "primary-hover": "oklch(0.12 0 0)",
      accent: "oklch(0.93 0 0)",
      "accent-fg": "oklch(0.20 0 0)",
      ring: "oklch(0.22 0 0 / 0.4)",
    },
  },
  midnight: {
    id: "midnight",
    name: { tr: "Geceyarisi", en: "Midnight" },
    mode: "dark",
    tokens: {
      bg: "oklch(0.17 0.02 280)",
      "bg-2": "oklch(0.20 0.025 280)",
      surface: "oklch(0.22 0.025 280)",
      "surface-2": "oklch(0.25 0.028 280)",
      fg: "oklch(0.96 0.01 280)",
      "fg-muted": "oklch(0.70 0.02 280)",
      "fg-subtle": "oklch(0.55 0.02 280)",
      border: "oklch(0.32 0.025 280)",
      "border-strong": "oklch(0.42 0.03 280)",
      primary: "oklch(0.72 0.17 290)",
      "primary-fg": "oklch(0.15 0.02 280)",
      "primary-hover": "oklch(0.77 0.18 290)",
      accent: "oklch(0.32 0.04 280)",
      "accent-fg": "oklch(0.95 0.01 280)",
      ring: "oklch(0.72 0.17 290 / 0.5)",
    },
  },
  graphite: {
    id: "graphite",
    name: { tr: "Grafit", en: "Graphite" },
    mode: "dark",
    tokens: {
      bg: "oklch(0.19 0.005 240)",
      "bg-2": "oklch(0.22 0.008 240)",
      surface: "oklch(0.24 0.008 240)",
      "surface-2": "oklch(0.27 0.01 240)",
      fg: "oklch(0.96 0.005 240)",
      "fg-muted": "oklch(0.70 0.01 240)",
      "fg-subtle": "oklch(0.55 0.01 240)",
      border: "oklch(0.33 0.01 240)",
      "border-strong": "oklch(0.44 0.015 240)",
      primary: "oklch(0.75 0.06 240)",
      "primary-fg": "oklch(0.15 0.01 240)",
      "primary-hover": "oklch(0.80 0.07 240)",
      accent: "oklch(0.33 0.015 240)",
      "accent-fg": "oklch(0.95 0.005 240)",
      ring: "oklch(0.75 0.06 240 / 0.5)",
    },
  },
};
```

**deriveFromBrand function** (lines 140-156):
```jsx
function deriveFromBrand({ L, C, H, mode = "light" }) {
  const base = PRESETS[mode === "dark" ? "graphite" : "default"];
  const tokens = { ...base.tokens };
  tokens.primary = `oklch(${L} ${C} ${H})`;
  const pfL = L < 0.55 ? 0.985 : 0.15;
  tokens["primary-fg"] = `oklch(${pfL} ${C * 0.05} ${H})`;
  tokens["primary-hover"] = `oklch(${Math.max(0.08, L - 0.05)} ${C + 0.01} ${H})`;
  tokens.ring = `oklch(${L} ${C} ${H} / 0.4)`;
  if (mode === "light") {
    tokens.accent = `oklch(${Math.min(0.96, L + 0.32)} ${C * 0.15} ${H})`;
    tokens["accent-fg"] = `oklch(${Math.max(0.20, L - 0.35)} ${C * 0.3} ${H})`;
  } else {
    tokens.accent = `oklch(${Math.max(0.25, L - 0.4)} ${C * 0.3} ${H})`;
    tokens["accent-fg"] = `oklch(${Math.min(0.97, L + 0.22)} ${C * 0.1} ${H})`;
  }
  return tokens;
}
```

**applyTokens and applyMode** (lines 158-167):
```jsx
function applyTokens(tokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => {
    root.style.setProperty(`--${k}`, v);
  });
}

function applyMode(mode) {
  document.documentElement.dataset.mode = mode;
}
```

**applyRadius + resolvePreset + contrast utilities** (lines 169-189):
```jsx
function applyRadius(r) {
  const root = document.documentElement;
  root.style.setProperty("--radius", `${r}px`);
  root.style.setProperty("--radius-sm", `${Math.max(2, r - 4)}px`);
  root.style.setProperty("--radius-lg", `${r + 4}px`);
}

function resolvePreset(presetId, customPresets = []) {
  return PRESETS[presetId] || customPresets.find((p) => p.id === presetId) || PRESETS.default;
}

function oklchLightness(str) {
  const m = /oklch\(([0-9.]+)/.exec(str);
  return m ? parseFloat(m[1]) : 0.5;
}
function estimateContrast(fg, bg) {
  const lF = oklchLightness(fg);
  const lB = oklchLightness(bg);
  return Math.abs(lF - lB);
}
```

**TypeScript conversion notes:** Add interfaces `ThemeTokens` (15 string fields), `ThemePreset` (id, name, mode, tokens), typed `PRESETS` record. Export all functions. Port all 6 presets with exact token values.

---

### `Frontend2/lib/i18n.ts` (utility, transform)

**Analog:** `New_Frontend/src/i18n.jsx` (entire file, 96 lines)

**STRINGS object** (lines 2-85 -- port ALL keys verbatim):
```jsx
const STRINGS = {
  nav: {
    dashboard: { tr: "Panel", en: "Dashboard" },
    projects: { tr: "Projeler", en: "Projects" },
    myTasks: { tr: "Gorevlerim", en: "My Tasks" },
    teams: { tr: "Takimlar", en: "Teams" },
    reports: { tr: "Raporlar", en: "Reports" },
    settings: { tr: "Ayarlar", en: "Settings" },
    admin: { tr: "Yonetim", en: "Admin" },
    notifications: { tr: "Bildirimler", en: "Notifications" },
  },
  common: {
    create: { tr: "Olustur", en: "Create" },
    createTask: { tr: "Gorev olustur", en: "Create task" },
    createProject: { tr: "Yeni proje", en: "New project" },
    save: { tr: "Kaydet", en: "Save" },
    cancel: { tr: "Vazgec", en: "Cancel" },
    edit: { tr: "Duzenle", en: "Edit" },
    delete: { tr: "Sil", en: "Delete" },
    back: { tr: "Geri", en: "Back" },
    search: { tr: "Ara...", en: "Search..." },
    filter: { tr: "Filtrele", en: "Filter" },
    all: { tr: "Tumu", en: "All" },
    today: { tr: "Bugun", en: "Today" },
    overdue: { tr: "Gecikmis", en: "Overdue" },
    dueDate: { tr: "Bitis", en: "Due" },
    assignee: { tr: "Atanan", en: "Assignee" },
    priority: { tr: "Oncelik", en: "Priority" },
    status: { tr: "Durum", en: "Status" },
    description: { tr: "Aciklama", en: "Description" },
    addComment: { tr: "Yorum ekle...", en: "Add a comment..." },
    viewAll: { tr: "Tumunu gor", en: "View all" },
    openProject: { tr: "Projeyi ac", en: "Open project" },
    loading: { tr: "Yukleniyor...", en: "Loading..." },
    empty: { tr: "Henuz bir sey yok.", en: "Nothing here yet." },
  },
  priority: {
    critical: { tr: "Kritik", en: "Critical" },
    high: { tr: "Yuksek", en: "High" },
    medium: { tr: "Orta", en: "Medium" },
    low: { tr: "Dusuk", en: "Low" },
  },
  dashboard: { /* 10 keys -- lines 48-59 */ },
  project: { /* 9 keys -- lines 61-70 */ },
  workflow: { /* 12 keys -- lines 72-84 */ },
};
```

**t() function** (lines 87-93):
```jsx
function t(path, lang = "tr") {
  const parts = path.split(".");
  let cur = STRINGS;
  for (const p of parts) cur = cur?.[p];
  if (!cur) return path;
  return cur[lang] || cur.tr || path;
}
```

**TypeScript conversion notes:** Add `LangCode = "tr" | "en"` type, `StringEntry` interface `{ tr: string; en?: string }`, typed `t()` signature. Default lang parameter is `"tr"` per D-06.

---

### `Frontend2/context/app-context.tsx` (provider, event-driven)

**Analog:** `New_Frontend/src/app.jsx` lines 39-131 (useAppState) + `New_Frontend/src/shell.jsx` lines 4-6 (AppContext)

**State initialization with localStorage persistence** (app.jsx lines 39-58):
```jsx
const useAppState = () => {
  const load = (k, def) => {
    try { const v = localStorage.getItem("spms." + k); return v !== null ? JSON.parse(v) : def; } catch (e) { return def; }
  };
  const save = (k, v) => { try { localStorage.setItem("spms." + k, JSON.stringify(v)); } catch (e) {} };

  const [preset, setPreset] = useState(() => load("preset", "default"));
  const [mode, setMode] = useState(() => load("mode", "light"));
  const [language, setLanguage] = useState(() => load("language", "tr"));
  const [density, setDensity] = useState(() => load("density", "cozy"));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => load("sidebarCollapsed", false));
  const [radius, setRadius] = useState(() => load("radius", 8));
  const [brandLight, setBrandLight] = useState(() => load("brandLight", 0.60));
  const [brandChroma, setBrandChroma] = useState(() => load("brandChroma", 0.17));
  const [brandHue, setBrandHue] = useState(() => load("brandHue", 40));
  const [customColors, setCustomColors] = useState(() => load("customColors", false));
};
```

**Theme application effect** (app.jsx lines 77-87):
```jsx
useEffect(() => {
  const p = window.SPMSTheme.resolvePreset(preset, customPresets);
  let tokens = p.tokens;
  let m = p.mode;
  if (customColors) {
    tokens = window.SPMSTheme.deriveFromBrand({ L: brandLight, C: brandChroma, H: brandHue, mode });
    m = mode;
  }
  window.SPMSTheme.applyTokens(tokens);
  window.SPMSTheme.applyMode(m);
}, [preset, customColors, brandLight, brandChroma, brandHue, mode, customPresets]);
```

**Dark/light mode auto-switch with preset coupling** (app.jsx line 112):
```jsx
const setModeFn = useCallback((m) => {
  setMode(m);
  if (m === "dark" && !customColors && ["default","ocean","forest","monochrome"].includes(preset)) setPreset("midnight");
  if (m === "light" && !customColors && ["midnight","graphite"].includes(preset)) setPreset("default");
}, [customColors, preset]);
```

**Context creation** (shell.jsx lines 4-6):
```jsx
const AppContext = React.createContext(null);
const useApp = () => React.useContext(AppContext);
```

**TypeScript conversion notes:** Create `AppContextType` interface with all state + setters. Use `React.createContext<AppContextType | undefined>(undefined)`. Export `useApp()` hook with error boundary check. Replace `window.SPMSTheme.*` calls with direct imports from `@/lib/theme`. Remove `RouterContext` entirely (replaced by Next.js App Router).

---

### `Frontend2/components/app-shell.tsx` (component, layout)

**Analog:** `New_Frontend/src/app.jsx` App component layout (lines 159-176)

**Layout structure** (app.jsx lines 162-169):
```jsx
<div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
  <Sidebar/>
  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
    <Header/>
    <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
      {children}
    </main>
  </div>
</div>
```

**TypeScript conversion notes:** Convert to Tailwind classes: `flex min-h-screen bg-[var(--bg)]`. Accept `{children}` prop from Next.js layout instead of rendering `<PageRouter/>`.

---

### `Frontend2/components/sidebar.tsx` (component, event-driven)

**Analog:** `New_Frontend/src/shell.jsx` lines 8-155

**SidebarLogo** (lines 8-24):
```jsx
const SidebarLogo = ({ collapsed }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 14px 16px", height: 52, borderBottom: "1px solid var(--border)" }}>
    <div style={{
      width: 26, height: 26, borderRadius: 7, background: "var(--primary)",
      color: "var(--primary-fg)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 11, letterSpacing: -0.3,
      boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--primary) 60%, black), 0 1px 2px color-mix(in oklch, var(--primary) 40%, black)",
    }}>SP</div>
    {!collapsed && (
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>SPMS</div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-subtle)", marginTop: 2 }}>v2.4</div>
      </div>
    )}
  </div>
);
```

**NavItem** (lines 26-47):
```jsx
const NavItem = ({ icon, label, active, onClick, collapsed, badge, shortcut }) => (
  <button onClick={onClick} title={collapsed ? label : undefined}
    style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "0 0" : "0 10px", height: 30, width: "100%",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: "var(--radius-sm)",
      color: active ? "var(--fg)" : "var(--fg-muted)",
      background: active ? "var(--accent)" : "transparent",
      fontWeight: active ? 600 : 500, fontSize: 13,
      transition: "background 0.1s, color 0.1s",
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ color: active ? "var(--primary)" : "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>
    {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
    {!collapsed && badge != null && <Badge size="xs" tone={active ? "primary" : "neutral"}>{badge}</Badge>}
    {!collapsed && shortcut && <Kbd>{shortcut}</Kbd>}
  </button>
);
```

**Sidebar nav items** (lines 57-64):
```jsx
const items = [
  { id: "dashboard", icon: <Icons.Dashboard/>, label: t("nav.dashboard"), shortcut: "G D" },
  { id: "projects", icon: <Icons.Folder/>, label: t("nav.projects"), shortcut: "G P", badge: /* count */ },
  { id: "my-tasks", icon: <Icons.CheckSquare/>, label: t("nav.myTasks"), shortcut: "G T" },
  { id: "teams", icon: <Icons.Users/>, label: t("nav.teams") },
  { id: "reports", icon: <Icons.Chart/>, label: t("nav.reports") },
  { id: "settings", icon: <Icons.Settings/>, label: t("nav.settings") },
];
```

**Sidebar container** (lines 66-74):
```jsx
<aside style={{
  width: collapsed ? 56 : 232, flexShrink: 0,
  borderRight: "1px solid var(--border)",
  background: "var(--bg-2)",
  display: "flex", flexDirection: "column",
  transition: "width 0.18s ease",
  height: "100vh", position: "sticky", top: 0,
}}>
```

**SidebarUserMenu with click-outside dismiss** (lines 99-155):
```jsx
const SidebarUserMenu = ({ collapsed }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  // button: Avatar + user name + chevron (lines 112-121)
  // popup: profile, settings, admin, divider, sign out (lines 122-154)
};
```

**TypeScript conversion notes:** Replace `router.go("projects")` with `<Link href="/projects">`. Replace `router.page` checks with `usePathname()`. Replace `window.SPMSi18n.t(k, lang)` with imported `t()`. Replace `Icons.*` with lucide-react imports. Replace `window.SPMSData.CURRENT_USER` with auth context.

---

### `Frontend2/components/header.tsx` (component, event-driven)

**Analog:** `New_Frontend/src/shell.jsx` lines 157-197

**Header layout** (lines 157-196):
```jsx
const Header = () => {
  const app = useApp();
  const lang = app.language;
  return (
    <header style={{
      height: 52, borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
      display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <button onClick={() => app.setSidebarCollapsed(!app.sidebarCollapsed)}>
        <Icons.PanelLeft/>
      </button>
      <Breadcrumb/>
      <div style={{ flex: 1 }}/>
      <Input icon={<Icons.Search size={14}/>} placeholder="..." kbdHint="Cmd+K" size="sm" style={{ width: 260 }}/>
      <Button variant="primary" size="sm" icon={<Icons.Plus size={14}/>}>Create task</Button>
      <button style={{ position: "relative", color: "var(--fg-muted)", padding: 6, borderRadius: 6 }}>
        <Icons.Bell/>
        {unread > 0 && <span style={{
          position: "absolute", top: 3, right: 3,
          background: "var(--priority-critical)", color: "#fff",
          fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, padding: "0 3px",
          borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 2px var(--bg)",
        }}>{unread}</span>}
      </button>
      <button title="Help"><Icons.Help/></button>
      <button onClick={() => app.setLanguage(lang === "tr" ? "en" : "tr")}>{lang.toUpperCase()}</button>
    </header>
  );
};
```

---

### `Frontend2/components/breadcrumb.tsx` (component, request-response)

**Analog:** `New_Frontend/src/shell.jsx` lines 199-239

**Breadcrumb with pathname-based parts** (lines 199-238):
```jsx
const Breadcrumb = () => {
  const lang = useApp().language;
  const parts = useMemo(() => {
    const p = router.page;
    if (p === "dashboard") return [{ label: lang === "tr" ? "Panel" : "Dashboard" }];
    if (p === "projects") return [{ label: lang === "tr" ? "Projeler" : "Projects" }];
    if (p === "project-detail") {
      return [
        { label: lang === "tr" ? "Projeler" : "Projects", onClick: () => router.go("projects") },
        { label: proj?.name }
      ];
    }
    // ... more routes (admin, settings, my-tasks, teams, reports, notifications)
  }, [router.page, router.params, lang]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} style={{ color: "var(--fg-subtle)" }}/>}
          <span style={{
            fontSize: 13,
            fontWeight: i === parts.length - 1 ? 600 : 500,
            color: i === parts.length - 1 ? "var(--fg)" : "var(--fg-muted)",
            cursor: p.onClick ? "pointer" : "default"
          }}>{p.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
};
```

**TypeScript conversion notes:** Replace `router.page` checks with `usePathname()` from `next/navigation`. Replace `router.go("projects")` links with `<Link href="/projects">`. Use `useParams()` for dynamic route params.

---

### Primitive Components (16 files)

All 16 primitives in `Frontend2/components/primitives/` follow the same source-to-target conversion. Full prototype source for each is provided below as the definitive analog.

#### `avatar.tsx` -- Analog: `primitives.jsx` lines 6-20
```jsx
const Avatar = ({ user, size = 28, ring = false, style }) => {
  if (!user) return null;
  const color = `var(--av-${user.avColor || 1})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, letterSpacing: -0.3,
      flexShrink: 0,
      boxShadow: ring ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)" : "inset 0 0 0 1px oklch(0 0 0 / 0.08)",
      ...style,
    }}>{user.initials}</div>
  );
};
```

#### `avatar-stack.tsx` -- Analog: `primitives.jsx` lines 22-43
```jsx
const AvatarStack = ({ users, max = 4, size = 22 }) => {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div style={{ display: "inline-flex" }}>
      {shown.map((u, i) => (
        <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -6, position: "relative", zIndex: 10 - i }}>
          <Avatar user={u} size={size} style={{ boxShadow: "0 0 0 2px var(--surface)" }}/>
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6, width: size, height: size, borderRadius: "50%",
          background: "var(--surface-2)", color: "var(--fg-muted)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.38, fontWeight: 600,
          boxShadow: "0 0 0 2px var(--surface), inset 0 0 0 1px var(--border)",
        }}>+{extra}</div>
      )}
    </div>
  );
};
```

#### `badge.tsx` -- Analog: `primitives.jsx` lines 46-70 (COMPLEX: color-mix stays as style)
```jsx
const Badge = ({ children, tone = "neutral", style, size = "sm", dot }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--fg-muted)", bd: "var(--border)" },
    primary: { bg: "color-mix(in oklch, var(--primary) 12%, transparent)", fg: "var(--primary)", bd: "color-mix(in oklch, var(--primary) 25%, transparent)" },
    success: { bg: "color-mix(in oklch, var(--status-done) 15%, transparent)", fg: "var(--status-done)", bd: "color-mix(in oklch, var(--status-done) 30%, transparent)" },
    warning: { bg: "color-mix(in oklch, var(--status-review) 18%, transparent)", fg: "color-mix(in oklch, var(--status-review) 85%, var(--fg))", bd: "color-mix(in oklch, var(--status-review) 35%, transparent)" },
    danger: { bg: "color-mix(in oklch, var(--priority-critical) 14%, transparent)", fg: "var(--priority-critical)", bd: "color-mix(in oklch, var(--priority-critical) 30%, transparent)" },
    info: { bg: "color-mix(in oklch, var(--status-progress) 13%, transparent)", fg: "var(--status-progress)", bd: "color-mix(in oklch, var(--status-progress) 25%, transparent)" },
    mono: { bg: "var(--accent)", fg: "var(--accent-fg)", bd: "transparent" },
  };
  const s = tones[tone] || tones.neutral;
  const sz = size === "xs" ? { padding: "1px 6px", fontSize: 10.5, height: 18 } : { padding: "2px 8px", fontSize: 11.5, height: 20 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      ...sz, borderRadius: 999, background: s.bg, color: s.fg,
      boxShadow: `inset 0 0 0 1px ${s.bd}`,
      fontWeight: 500, whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.fg }}/>}
      {children}
    </span>
  );
};
```

#### `button.tsx` -- Analog: `primitives.jsx` lines 73-118 (COMPLEX: inset shadows stay as style)
```jsx
const Button = ({ variant = "secondary", size = "md", icon, iconRight, children, style, onClick, disabled, type = "button", title, active }) => {
  const variants = {
    primary: { background: "var(--primary)", color: "var(--primary-fg)", boxShadow: "0 2px 4px oklch(0.60 0.17 40 / 0.24), 0 1px 2px oklch(0 0 0 / 0.08), var(--inset-primary-top), var(--inset-primary-bottom)" },
    secondary: { background: "var(--surface)", color: "var(--fg)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.05), var(--inset-top), var(--inset-bottom), inset 0 0 0 1px var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--fg)", boxShadow: "none" },
    subtle: { background: "var(--surface-2)", color: "var(--fg)", boxShadow: "none" },
    danger: { background: "var(--priority-critical)", color: "#fff", boxShadow: "0 2px 4px oklch(0.58 0.22 25 / 0.26), var(--inset-top), var(--inset-primary-bottom)" },
  };
  const sizes = {
    xs: { height: 24, padding: "0 8px", fontSize: 12, gap: 4 },
    sm: { height: 28, padding: "0 10px", fontSize: 12.5, gap: 6 },
    md: { height: 32, padding: "0 12px", fontSize: 13, gap: 6 },
    lg: { height: 40, padding: "0 16px", fontSize: 14, gap: 8 },
    icon: { height: 28, width: 28, padding: 0, fontSize: 13, gap: 0 },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-sm)", fontWeight: 500,
        transition: "transform 0.08s ease, background 0.1s ease, box-shadow 0.1s ease",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        ...variants[variant], ...sizes[size],
        ...(active ? { background: "var(--accent)", color: "var(--accent-fg)" } : {}),
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(0.5px)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >{icon}{children}{iconRight}</button>
  );
};
```

#### `card.tsx` -- Analog: `primitives.jsx` lines 121-142
```jsx
const Card = ({ children, style, interactive, padding = 16, ...rest }) => (
  <div {...rest} style={{
    background: "var(--surface)", borderRadius: "var(--radius)",
    boxShadow: "var(--shadow), var(--inset-card)", padding,
    transition: "box-shadow 0.12s ease, transform 0.12s ease",
    ...(interactive ? { cursor: "pointer" } : {}), ...style,
  }}
  onMouseEnter={interactive ? (e) => {
    e.currentTarget.style.boxShadow = "var(--shadow-md), var(--inset-card)";
    e.currentTarget.style.transform = "translateY(-1px)";
  } : undefined}
  onMouseLeave={interactive ? (e) => {
    e.currentTarget.style.boxShadow = "var(--shadow), var(--inset-card)";
    e.currentTarget.style.transform = "translateY(0)";
  } : undefined}>{children}</div>
);
```

#### `kbd.tsx` -- Analog: `primitives.jsx` lines 145-154
```jsx
const Kbd = ({ children, style }) => (
  <span className="mono" style={{
    display: "inline-flex", alignItems: "center",
    height: 18, padding: "0 5px", minWidth: 18, justifyContent: "center",
    borderRadius: 4, fontSize: 10.5,
    background: "var(--surface-2)", color: "var(--fg-muted)",
    boxShadow: "inset 0 0 0 1px var(--border), 0 1px 0 var(--border)",
    ...style,
  }}>{children}</span>
);
```

#### `tabs.tsx` -- Analog: `primitives.jsx` lines 157-181
```jsx
const Tabs = ({ tabs, active, onChange, style, size = "md" }) => {
  const padMap = { sm: "6px 10px", md: "8px 14px", lg: "10px 16px" };
  const fontMap = { sm: 12, md: 13, lg: 14 };
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", ...style }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            padding: padMap[size], fontSize: fontMap[size], fontWeight: isActive ? 600 : 500,
            color: isActive ? "var(--fg)" : "var(--fg-muted)",
            borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 6,
          }}>{tab.icon}{tab.label}
            {tab.badge != null && <Badge size="xs" tone={isActive ? "primary" : "neutral"}>{tab.badge}</Badge>}
          </button>
        );
      })}
    </div>
  );
};
```

#### `section.tsx` -- Analog: `primitives.jsx` lines 184-195
```jsx
const Section = ({ title, subtitle, action, children, style }) => (
  <div style={{ ...style }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);
```

#### `priority-chip.tsx` -- Analog: `primitives.jsx` lines 198-207
```jsx
const PriorityChip = ({ level, lang, withLabel = true }) => {
  const label = window.SPMSi18n.t(`priority.${level}`, lang);
  const color = `var(--priority-${level})`;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--fg-muted)", fontWeight: 500 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, transform: "rotate(45deg)" }}/>
      {withLabel && label}
    </span>
  );
};
```
**Note:** Replace `window.SPMSi18n.t()` with imported `t()` from `@/lib/i18n`.

#### `status-dot.tsx` -- Analog: `primitives.jsx` lines 210-213
```jsx
const StatusDot = ({ status, size = 8 }) => {
  const color = `var(--status-${status === "progress" ? "progress" : status === "review" ? "review" : status === "done" ? "done" : status === "blocked" ? "blocked" : "todo"})`;
  return <span style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }}/>;
};
```

#### `input.tsx` -- Analog: `primitives.jsx` lines 216-233
```jsx
const Input = ({ icon, placeholder, value, onChange, style, kbdHint, size = "md", type = "text" }) => {
  const heights = { sm: 28, md: 32, lg: 38 };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: "var(--surface)", borderRadius: "var(--radius-sm)",
      boxShadow: "inset 0 0 0 1px var(--border)",
      height: heights[size], padding: "0 8px", gap: 6,
      transition: "box-shadow 0.12s", ...style,
    }}>
      {icon && <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ flex: 1, minWidth: 0, height: "100%", background: "transparent", border: 0, outline: 0, fontSize: 13, color: "var(--fg)" }}/>
      {kbdHint && <Kbd>{kbdHint}</Kbd>}
    </div>
  );
};
```

#### `progress-bar.tsx` -- Analog: `primitives.jsx` lines 236-240
```jsx
const ProgressBar = ({ value = 0, max = 100, height = 4, color = "var(--primary)", bg = "var(--surface-2)", style }) => (
  <div style={{ height, background: bg, borderRadius: height, overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.2s" }}/>
  </div>
);
```

#### `segmented-control.tsx` -- Analog: `primitives.jsx` lines 243-256
```jsx
const SegmentedControl = ({ options, value, onChange, size = "sm" }) => (
  <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
    {options.map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)}
        style={{ padding: size === "xs" ? "3px 8px" : "4px 10px", fontSize: size === "xs" ? 11 : 11.5, fontWeight: 600, borderRadius: 4,
          background: value === opt.id ? "var(--surface)" : "transparent",
          color: value === opt.id ? "var(--fg)" : "var(--fg-muted)",
          boxShadow: value === opt.id ? "var(--shadow-sm), var(--inset-top)" : "none",
          display: "inline-flex", alignItems: "center", gap: 5 }}>
        {opt.icon}{opt.label}
      </button>
    ))}
  </div>
);
```

#### `collapsible.tsx` -- Analog: `primitives.jsx` lines 259-272
```jsx
const Collapsible = ({ title, badge, defaultOpen = false, children, style }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", ...style }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, background: "transparent" }}>
        <Icons.ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", color: "var(--fg-subtle)" }}/>
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        {badge && <Badge size="xs" tone="neutral">{badge}</Badge>}
      </button>
      {open && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
};
```
**Note:** Replace `Icons.ChevronRight` with `import { ChevronRight } from "lucide-react"`.

#### `alert-banner.tsx` -- Analog: `primitives.jsx` lines 275-287 (COMPLEX: color-mix stays as style)
```jsx
const AlertBanner = ({ tone = "warning", icon, children, action, style }) => {
  const colorVar = tone === "danger" ? "--priority-critical" : tone === "success" ? "--status-done" : tone === "info" ? "--status-progress" : "--status-review";
  return (
    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, borderRadius: "var(--radius-sm)",
      background: `color-mix(in oklch, var(${colorVar}) 10%, var(--surface))`,
      boxShadow: `inset 0 0 0 1px color-mix(in oklch, var(${colorVar}) 25%, transparent)`,
      color: `var(${colorVar})`, ...style }}>
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
};
```

#### `toggle.tsx` -- Analog: `primitives.jsx` lines 290-304
```jsx
const Toggle = ({ on, onChange, size = "md" }) => {
  const w = size === "sm" ? 30 : 36;
  const h = size === "sm" ? 16 : 20;
  const d = size === "sm" ? 12 : 16;
  return (
    <div onClick={() => onChange && onChange(!on)} style={{
      width: w, height: h, borderRadius: h, cursor: "pointer",
      background: on ? "var(--primary)" : "var(--surface-2)",
      boxShadow: on ? "var(--inset-primary-top), var(--inset-primary-bottom)" : "inset 0 0 0 1px var(--border-strong)",
      position: "relative", transition: "background 0.12s",
    }}>
      <div style={{ width: d, height: d, borderRadius: "50%", background: "#fff", position: "absolute", top: (h - d) / 2, left: on ? w - d - (h - d) / 2 : (h - d) / 2, transition: "left 0.12s", boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)" }}/>
    </div>
  );
};
```

---

### `Frontend2/app/layout.tsx` (provider, root layout)

**Analog:** `New_Frontend/src/app.jsx` App component (lines 134-176)

**Provider wrapping** (app.jsx lines 159-176):
```jsx
<AppContext.Provider value={app}>
  <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
    <Sidebar/>
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Header/>
      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {children}
      </main>
    </div>
  </div>
</AppContext.Provider>
```

**TypeScript conversion notes:** `layout.tsx` is a Server Component. Create a separate `AppProvider` Client Component that wraps `{children}`. Remove `RouterContext.Provider` entirely. Structure: `layout.tsx (server) -> AppProvider (client) -> AppShell (client) -> {children}`.

---

### `Frontend2/components/primitives/index.ts` (barrel export)

No prototype analog. Standard barrel export:
```typescript
export { Avatar } from "./avatar"
export { AvatarStack } from "./avatar-stack"
export { Badge } from "./badge"
export { Button } from "./button"
export { Card } from "./card"
export { Kbd } from "./kbd"
export { Tabs } from "./tabs"
export { Section } from "./section"
export { PriorityChip } from "./priority-chip"
export { StatusDot } from "./status-dot"
export { Input } from "./input"
export { ProgressBar } from "./progress-bar"
export { SegmentedControl } from "./segmented-control"
export { Collapsible } from "./collapsible"
export { AlertBanner } from "./alert-banner"
export { Toggle } from "./toggle"
```

---

## Shared Patterns

### Component Conversion Rules
**Source:** All prototype components + CONVENTIONS.md
**Apply to:** All 16 primitive component files, all shell components

Every component file follows these conversion rules:

1. **`"use client"` directive** at top of every file
2. **Imports:** `import * as React from "react"` (namespace access) + `import { cn } from "@/lib/utils"`
3. **Props interface:** Explicit TypeScript interface; add `className?: string` prop (missing from prototype)
4. **Named export:** `export function ComponentName` (not default export)
5. **Static styles to Tailwind:** Convert constant CSS to Tailwind utility classes
6. **Dynamic styles stay as `style={}`:** Keep for prop-dependent values (height, width%, computed colors)
7. **`color-mix()` stays as `style={}`:** Complex expressions stay as inline styles (Badge, AlertBanner)
8. **`cn()` for className merging:** Use when combining base classes with user `className`
9. **`var()` references preserved:** Keep CSS variable references as-is

### Icon Replacement
**Source:** `New_Frontend/src/icons.jsx` -> lucide-react
**Apply to:** Sidebar, Header, Breadcrumb, Collapsible

```typescript
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
  PanelLeft,          // Icons.PanelLeft
  ChevronRight,       // Icons.ChevronRight
  ChevronUp,          // Icons.ChevronUp
  X,                  // Icons.X
  Moon, Sun,          // Icons.Moon / Icons.Sun
  LogOut,             // Icons.LogOut
  Edit3,              // Icons.Edit
} from "lucide-react"
```

Default prototype icon size is `16`. Lucide default is `24`, so always pass `size={16}` or the specific size used in the prototype.

### Next.js Routing Replacement
**Source:** `New_Frontend/src/app.jsx` RouterContext + `shell.jsx` router usage
**Apply to:** Sidebar, Header, Breadcrumb

```typescript
// BEFORE (prototype)
router.go("projects")           // -> <Link href="/projects"> or router.push("/projects")
router.page === "projects"      // -> pathname === "/projects" via usePathname()
router.page.startsWith("admin") // -> pathname.startsWith("/admin")
router.params.projectId         // -> useParams() from next/navigation
```

### i18n Integration
**Source:** `New_Frontend/src/i18n.jsx` + shell.jsx usage
**Apply to:** Sidebar, Header, Breadcrumb, PriorityChip

```typescript
// BEFORE (prototype)
const t = (k) => window.SPMSi18n.t(k, lang);

// AFTER (TypeScript)
import { t } from "@/lib/i18n"
import { useApp } from "@/context/app-context"
const { language } = useApp()
// Usage: t("nav.dashboard", language)
```

### Token Naming (D-02)
**Source:** CONTEXT.md D-02
**Apply to:** `globals.css`, `lib/theme.ts`

Prototype token names used directly as-is. No mapping to shadcn naming conventions. The prototype's token system IS the design system.

### Dark Mode (D-08)
**Source:** `New_Frontend/SPMS Prototype.html` line 2 + CSS lines 65-80
**Apply to:** `globals.css`, `app-context.tsx`

```css
@custom-variant dark (&:is([data-mode="dark"], [data-mode="dark"] *));
```

```typescript
// In app-context.tsx
document.documentElement.dataset.mode = mode
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| -- | -- | -- | All files have exact prototype analogs |

Every file to be created in this phase has a direct, exact prototype source in `New_Frontend/src/`. This is a controlled porting exercise.

## Metadata

**Analog search scope:** `New_Frontend/src/` (theme.jsx, primitives.jsx, i18n.jsx, shell.jsx, app.jsx, icons.jsx) and `New_Frontend/SPMS Prototype.html`
**Files scanned:** 8 prototype source files
**Pattern extraction date:** 2026-04-20
**Constraint:** `Frontend/` directory excluded from all analog searches per phase instructions
