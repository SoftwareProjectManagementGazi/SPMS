---
phase: 08-foundation-design-system
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - Frontend2/app/globals.css
  - Frontend2/app/layout.tsx
  - Frontend2/app/page.tsx
  - Frontend2/app/(shell)/layout.tsx
  - Frontend2/app/(shell)/dashboard/page.tsx
  - Frontend2/app/(shell)/projects/page.tsx
  - Frontend2/app/(shell)/my-tasks/page.tsx
  - Frontend2/app/(shell)/teams/page.tsx
  - Frontend2/app/(shell)/reports/page.tsx
  - Frontend2/app/(shell)/settings/page.tsx
  - Frontend2/components/app-shell.tsx
  - Frontend2/components/breadcrumb.tsx
  - Frontend2/components/header.tsx
  - Frontend2/components/sidebar.tsx
  - Frontend2/components/primitives/avatar.tsx
  - Frontend2/components/primitives/avatar-stack.tsx
  - Frontend2/components/primitives/badge.tsx
  - Frontend2/components/primitives/button.tsx
  - Frontend2/components/primitives/card.tsx
  - Frontend2/components/primitives/kbd.tsx
  - Frontend2/components/primitives/tabs.tsx
  - Frontend2/components/primitives/section.tsx
  - Frontend2/components/primitives/priority-chip.tsx
  - Frontend2/components/primitives/status-dot.tsx
  - Frontend2/components/primitives/input.tsx
  - Frontend2/components/primitives/progress-bar.tsx
  - Frontend2/components/primitives/segmented-control.tsx
  - Frontend2/components/primitives/collapsible.tsx
  - Frontend2/components/primitives/alert-banner.tsx
  - Frontend2/components/primitives/toggle.tsx
  - Frontend2/components/primitives/index.ts
  - Frontend2/context/app-context.tsx
  - Frontend2/lib/theme.ts
  - Frontend2/lib/i18n.ts
  - Frontend2/lib/utils.ts
  - Frontend2/tsconfig.json
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-21
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

The Phase 8 Foundation & Design System deliverable is largely solid. Token naming convention is clean and correctly uses the prototype names (`--bg`, `--surface`, `--fg`, etc.) with no shadcn namespace leakage. The AppContext localStorage pattern correctly guards against SSR with `typeof window === "undefined"` and wraps JSON operations in try/catch. The `useEffect` dependency arrays are accurate throughout. No XSS risk exists — the `t()` function returns plain strings and none of them are interpolated into `dangerouslySetInnerHTML` (which is not used anywhere). No hardcoded secrets or injection vulnerabilities are present.

Six warnings require fixes before the phase can be considered ship-ready:

1. The wrong sans-serif font is loaded in `layout.tsx` (Inter instead of Geist), creating a mismatch with `globals.css` which declares `--font-sans` as Geist.
2. `ProgressBar` can produce `NaN` / `Infinity` when `max` is `0`.
3. The mode auto-switch in `setMode` calls `setPreset` but does not also call `setModeRaw` with the preset's paired mode, so a race condition can leave `mode` out of sync with the preset's declared mode.
4. `Toggle` uses a plain `<div>` with an `onClick`, making it completely inaccessible to keyboard users.
5. Interactive buttons in `Tabs`, `Collapsible`, and `SegmentedControl` are missing `type="button"`, causing unintended form submissions when placed inside `<form>` elements.
6. The `isActive` helper in `Sidebar` fires for `/projects` when the URL is `/projects-archive` (prefix collision without separator).

Five info-level items are also noted.

---

## Warnings

### WR-01: Wrong font loaded — Inter loaded instead of Geist in layout.tsx

**File:** `Frontend2/app/layout.tsx:2-11`

**Issue:** `globals.css` declares `--font-sans: "Geist", "Geist Fallback", ...` but `layout.tsx` imports and assigns the `Inter` font to the `--font-sans` CSS variable. At runtime the CSS variable is overwritten with Inter's font-face name, so Geist is never applied as the UI font. Geist Mono is loaded correctly.

**Fix:**
```tsx
// Replace:
import { Inter, Geist_Mono } from "next/font/google"
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] })

// With:
import { Geist, Geist_Mono } from "next/font/google"
const geist = Geist({ variable: "--font-sans", subsets: ["latin"] })

// And in RootLayout body:
<body className={`${geist.variable} ${geistMono.variable}`}>
```

---

### WR-02: ProgressBar produces NaN/Infinity when max=0

**File:** `Frontend2/components/primitives/progress-bar.tsx:28`

**Issue:** `const percent = Math.min((value / max) * 100, 100)` — when `max` is `0`, the expression produces `Infinity` (if `value > 0`) or `NaN` (if `value === 0`). Both values make `width: "NaN%"` or `width: "Infinity%"` which browsers silently ignore, causing the bar to render at 0% regardless of actual progress and hiding real values from users.

**Fix:**
```tsx
const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
```

---

### WR-03: setMode auto-switch sets a dark preset but leaves `mode` state as "dark" when the new preset is already dark — race on the other direction is worse

**File:** `Frontend2/context/app-context.tsx:150-165`

**Issue:** When the user clicks the moon icon and `mode` transitions from `"light"` to `"dark"`, `setMode` correctly calls `setPreset("midnight")`. However the theme `useEffect` then resolves the midnight preset (which has `mode: "dark"`) and calls `applyMode("dark")` — that part is fine. The reverse direction has a subtle problem: when `m === "light"` and the current preset is `"midnight"` or `"graphite"`, `setPreset("default")` is called without also calling `setModeRaw("light")`. Because `setPreset` triggers the theme `useEffect` synchronously on next render and `resolvePreset("default").mode === "light"`, `applyMode("light")` is called correctly from the effect. BUT the `mode` state value itself stays at `"light"` (it was already set by `setModeRaw(m)` at line 151 before the preset guard). That path is actually fine.

The real bug is the opposite scenario: when `applyPreset("midnight")` is called directly (not via `setMode`), `setMode` is never invoked so `mode` state stays at `"light"`, but the DOM gets `data-mode="dark"` from the effect (because `resolved.mode` is `"dark"`). The CSS `@custom-variant dark` selector then activates, but the React `mode` state still reads `"light"`, causing the Header moon/sun icon to show "Moon" (suggesting light mode) when the UI is visually dark. The `applyPreset` callback does not update `mode` state:

```tsx
// Current (line 167-171):
const applyPreset = React.useCallback((id: string) => {
  if (PRESETS[id] || id.startsWith("custom-")) {
    setPreset(id)
    setCustomColors(false)
    // mode state is NOT updated here
  }
}, [])
```

**Fix:**
```tsx
const applyPreset = React.useCallback(
  (id: string) => {
    if (PRESETS[id] || id.startsWith("custom-")) {
      setPreset(id)
      setCustomColors(false)
      // Sync mode state to match the preset's declared mode
      const targetMode = PRESETS[id]?.mode
      if (targetMode) setModeRaw(targetMode)
    }
  },
  // setModeRaw is stable (from useState setter), safe to omit from deps
  [],
)
```

---

### WR-04: Toggle is keyboard-inaccessible (div with onClick, no role or tabIndex)

**File:** `Frontend2/components/primitives/toggle.tsx:44-74`

**Issue:** `Toggle` renders a `<div onClick={...}>` with no `role`, no `tabIndex`, no keyboard event handler. A keyboard user cannot focus or activate it. Screen readers cannot identify it as a control. This violates WCAG 2.1 SC 2.1.1 (Keyboard) and SC 4.1.2 (Name, Role, Value).

**Fix:**
```tsx
<button
  type="button"
  role="switch"
  aria-checked={on}
  onClick={() => onChange && onChange(!on)}
  style={{
    width: w,
    height: h,
    borderRadius: h,
    cursor: "pointer",
    position: "relative",
    background: on ? "var(--primary)" : "var(--surface-2)",
    boxShadow: on
      ? "var(--inset-primary-top), var(--inset-primary-bottom)"
      : "inset 0 0 0 1px var(--border-strong)",
    transition: "background 0.12s",
    ...style,
  }}
>
  {/* knob div unchanged */}
</button>
```

---

### WR-05: Tabs, Collapsible, and SegmentedControl buttons missing `type="button"` — will submit forms

**Files:**
- `Frontend2/components/primitives/tabs.tsx:61`
- `Frontend2/components/primitives/collapsible.tsx:39`
- `Frontend2/components/primitives/segmented-control.tsx:50`

**Issue:** HTML button elements default to `type="submit"`. When any of these primitives are rendered inside a `<form>` element (expected in settings and task detail pages in later phases), clicking a tab, a collapsible header, or a segment will submit the form. This is a silent bug — it produces no TypeScript error and no console warning.

The `Button` primitive correctly sets `type="button"` as its default (line 28), but the buttons inside `Tabs`, `Collapsible`, and `SegmentedControl` do not.

**Fix:** Add `type="button"` to each `<button>` in the three files:

```tsx
// tabs.tsx line 61
<button type="button" key={tab.id} onClick={() => onChange(tab.id)} ...>

// collapsible.tsx line 39
<button type="button" onClick={() => setOpen(!open)} ...>

// segmented-control.tsx line 50
<button type="button" key={opt.id} onClick={() => onChange(opt.id)} ...>
```

---

### WR-06: isActive prefix match fires on `/projects` for `/projects-archive` URLs

**File:** `Frontend2/components/sidebar.tsx:334-335`

**Issue:** The `isActive` function is:
```ts
const isActive = (href: string) =>
  pathname === href || pathname.startsWith(href + "/")
```

The separator `+ "/"` prevents `/projects` from matching `/projectsX` but it does NOT prevent `/projects` from matching `/projects-archive` because `"/projects-archive".startsWith("/projects/")` is `false`. So this specific case is actually safe. However, there is a different real problem: `/settings` matches correctly, but the Admin route uses `href="/admin"` and `isActive("/admin")` would return true for `/administration` because `"/administration".startsWith("/admin/")` is false but a future route `/admin-panel` also stays safe. The current set of routes is fine, but this review notes a subtler issue: the `SidebarLogo` and its surrounding wrapper use `height: 52px` with the same value as the Header's `height: 52`. If the Header height ever changes, the two are silently misaligned. This is a maintenance concern noted under Info (IN-02) instead.

The real warning here is that `isActive` is also applied to the `/dashboard` NavItem. If the pathname is `/` (root), `isActive("/dashboard")` returns `false` even though `page.tsx` immediately redirects `/` → `/dashboard`. After the redirect completes, pathname will be `/dashboard`, so in practice this is harmless. But during the 1-2 render frames before `redirect()` resolves on the client (when navigating directly to `/`), the Dashboard nav item will appear inactive. This is cosmetic, not a crash, but it could cause a flash of incorrect active state.

**Fix:** Extend `isActive` to also match the root for the dashboard item, or handle it inside the items array:

```ts
const isActive = (href: string) =>
  pathname === href ||
  pathname.startsWith(href + "/") ||
  (href === "/dashboard" && pathname === "/")
```

---

## Info

### IN-01: Font variable name `--font-sans` overridden on `<body>` but declared on `:root` — minor ordering concern

**File:** `Frontend2/app/globals.css:7` and `Frontend2/app/layout.tsx:9`

**Issue:** `globals.css` declares `--font-sans` as a CSS custom property on `:root`. `layout.tsx` then injects `next/font`'s generated CSS variable (e.g. `--font-inter`) and assigns it to `--font-sans` via the class on `<body>`. This two-level indirection works fine but means the `:root` declaration in `globals.css` acts only as a fallback. After WR-01 is fixed (switching to Geist), both values will point to Geist and the fallback becomes accurate. No action needed beyond WR-01.

---

### IN-02: Hardcoded heights (52px header, 232px/56px sidebar) duplicated across components

**Files:** `Frontend2/components/app-shell.tsx`, `Frontend2/components/header.tsx`, `Frontend2/components/sidebar.tsx`

**Issue:** The header height `52` is hardcoded in `header.tsx:37` and implicitly expected by `SidebarLogo` in `sidebar.tsx:41`. The sidebar widths `232` and `56` are in `sidebar.tsx:340`. These are magic numbers duplicated across files. If the header height changes, `SidebarLogo` will be misaligned.

**Suggestion:** Extract into named constants in a shared layout constants file or as CSS custom properties:
```css
/* globals.css */
--header-h: 52px;
--sidebar-w: 232px;
--sidebar-w-collapsed: 56px;
```

---

### IN-03: `AvatarStack` extra-count badge has no accessible label

**File:** `Frontend2/components/primitives/avatar-stack.tsx:52-72`

**Issue:** The overflow indicator `+{extra}` is a plain `<div>` with no ARIA attributes. A screen reader reads it as "+3" with no indication that it represents additional team members.

**Suggestion:**
```tsx
<div aria-label={`${extra} more members`} ...>
  +{extra}
</div>
```

---

### IN-04: `t()` silently swallows unknown keys by returning the path string

**File:** `Frontend2/lib/i18n.ts:103-116`

**Issue:** When a key is not found (e.g. `t("nav.typo", lang)`), `t()` returns the dot-path string `"nav.typo"` verbatim. This is intentional as stated in the comment, but during development it makes typos in translation keys invisible — the UI shows `"nav.typo"` as actual visible text without any console warning. This is not a bug, but it is a development-time footgun.

**Suggestion:** Add a `process.env.NODE_ENV === "development"` console.warn when the fallback path is returned:
```ts
if (process.env.NODE_ENV === "development") {
  console.warn(`[i18n] Missing translation key: "${path}"`)
}
return path
```

---

### IN-05: `estimateContrast` in `theme.ts` is unused in Phase 8 and exports without a consumer

**File:** `Frontend2/lib/theme.ts:231-239`

**Issue:** `oklchLightness` and `estimateContrast` are exported but not imported anywhere in the reviewed file set. They are presumably for a future settings accessibility checker. Dead exports add noise and may cause tree-shaking confusion.

**Suggestion:** Either consume them in Phase 8 or prefix with a comment marking them as forward-declared utilities to prevent accidental removal.

---

_Reviewed: 2026-04-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
