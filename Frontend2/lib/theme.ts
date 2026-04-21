// Theme: 6 presets + custom OKLCH brand color derivation + full token override
// Ported from New_Frontend/src/theme.jsx -- exact token values preserved.
// Per D-02: token names use prototype convention directly (--bg, --surface, --fg...).

export type ThemeMode = "light" | "dark"

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
  mode: ThemeMode
  tokens: ThemeTokens
}

export const PRESETS: Record<string, ThemePreset> = {
  default: {
    id: "default",
    name: { tr: "Varsayılan (Terracotta)", en: "Default (Terracotta)" },
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
    name: { tr: "Geceyarısı", en: "Midnight" },
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
}

// Derive full palette from a single brand color (OKLCH inputs)
export function deriveFromBrand({
  L,
  C,
  H,
  mode = "light",
}: {
  L: number
  C: number
  H: number
  mode?: ThemeMode
}): ThemeTokens {
  const base = PRESETS[mode === "dark" ? "graphite" : "default"]
  const tokens: ThemeTokens = { ...base.tokens }
  tokens.primary = `oklch(${L} ${C} ${H})`
  const pfL = L < 0.55 ? 0.985 : 0.15
  tokens["primary-fg"] = `oklch(${pfL} ${C * 0.05} ${H})`
  tokens["primary-hover"] = `oklch(${Math.max(0.08, L - 0.05)} ${C + 0.01} ${H})`
  tokens.ring = `oklch(${L} ${C} ${H} / 0.4)`
  if (mode === "light") {
    tokens.accent = `oklch(${Math.min(0.96, L + 0.32)} ${C * 0.15} ${H})`
    tokens["accent-fg"] = `oklch(${Math.max(0.20, L - 0.35)} ${C * 0.3} ${H})`
  } else {
    tokens.accent = `oklch(${Math.max(0.25, L - 0.4)} ${C * 0.3} ${H})`
    tokens["accent-fg"] = `oklch(${Math.min(0.97, L + 0.22)} ${C * 0.1} ${H})`
  }
  return tokens
}

// Apply token values to :root as CSS custom properties.
// Per D-02: prototype names used directly -- no mapping to --background/--card/--foreground.
export function applyTokens(tokens: ThemeTokens): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  ;(Object.entries(tokens) as [keyof ThemeTokens, string][]).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}

export function applyMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return
  document.documentElement.dataset.mode = mode
}

export function applyRadius(r: number): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--radius", `${r}px`)
  root.style.setProperty("--radius-sm", `${Math.max(2, r - 4)}px`)
  root.style.setProperty("--radius-lg", `${r + 4}px`)
}

export function resolvePreset(
  presetId: string,
  customPresets: ThemePreset[] = [],
): ThemePreset {
  return (
    PRESETS[presetId] ||
    customPresets.find((p) => p.id === presetId) ||
    PRESETS.default
  )
}

// Contrast (APCA-ish quick estimate via relative luminance diff)
export function oklchLightness(str: string): number {
  const m = /oklch\(([0-9.]+)/.exec(str)
  return m ? parseFloat(m[1]) : 0.5
}

export function estimateContrast(fg: string, bg: string): number {
  const lF = oklchLightness(fg)
  const lB = oklchLightness(bg)
  return Math.abs(lF - lB) // 0..1 rough proxy
}
