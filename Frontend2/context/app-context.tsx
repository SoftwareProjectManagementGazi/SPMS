"use client"

import * as React from "react"

import type { LangCode } from "@/lib/i18n"
import {
  PRESETS,
  applyMode,
  applyRadius,
  applyTokens,
  deriveFromBrand,
  resolvePreset,
  type ThemeMode,
  type ThemePreset,
} from "@/lib/theme"

export type Density = "compact" | "cozy" | "comfortable"

export interface BrandColor {
  L: number
  C: number
  H: number
}

export interface AppContextType {
  // Language
  language: LangCode
  setLanguage: (lang: LangCode) => void

  // Theme mode + preset
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  preset: string
  applyPreset: (id: string) => void

  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  density: Density
  setDensity: (d: Density) => void

  // Custom brand color
  brandLight: number
  brandChroma: number
  brandHue: number
  customColors: boolean
  applyCustomBrand: (params: BrandColor) => void

  // Custom presets
  customPresets: ThemePreset[]

  // Radius
  radius: number
  setRadius: (r: number) => void
}

const AppContext = React.createContext<AppContextType | undefined>(undefined)

export function useApp(): AppContextType {
  const ctx = React.useContext(AppContext)
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider")
  }
  return ctx
}

// localStorage helpers with try/catch fallback (T-08-01 mitigation: corrupted
// values fall back to defaults silently).
function load<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try {
    const v = window.localStorage.getItem("spms." + key)
    return v !== null ? (JSON.parse(v) as T) : def
  } catch {
    return def
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem("spms." + key, JSON.stringify(value))
  } catch {
    /* ignore -- T-08-01 accept disposition */
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Lazy initial state from localStorage
  const [preset, setPreset] = React.useState<string>(() => load("preset", "default"))
  const [mode, setModeRaw] = React.useState<ThemeMode>(() => load("mode", "light"))
  const [language, setLanguageState] = React.useState<LangCode>(() => load("language", "tr"))
  const [density, setDensityState] = React.useState<Density>(() => load("density", "cozy"))
  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState<boolean>(
    () => load("sidebarCollapsed", false),
  )
  const [radius, setRadiusState] = React.useState<number>(() => load("radius", 8))
  const [brandLight, setBrandLight] = React.useState<number>(() => load("brandLight", 0.6))
  const [brandChroma, setBrandChroma] = React.useState<number>(() => load("brandChroma", 0.17))
  const [brandHue, setBrandHue] = React.useState<number>(() => load("brandHue", 40))
  const [customColors, setCustomColors] = React.useState<boolean>(() => load("customColors", false))
  const [customPresets] = React.useState<ThemePreset[]>(() => load("customPresets", []))

  // Persist each value on change
  React.useEffect(() => save("preset", preset), [preset])
  React.useEffect(() => save("mode", mode), [mode])
  React.useEffect(() => save("language", language), [language])
  React.useEffect(() => save("density", density), [density])
  React.useEffect(() => save("sidebarCollapsed", sidebarCollapsed), [sidebarCollapsed])
  React.useEffect(() => save("radius", radius), [radius])
  React.useEffect(() => save("brandLight", brandLight), [brandLight])
  React.useEffect(() => save("brandChroma", brandChroma), [brandChroma])
  React.useEffect(() => save("brandHue", brandHue), [brandHue])
  React.useEffect(() => save("customColors", customColors), [customColors])

  // Apply theme tokens + mode whenever any theme input changes
  React.useEffect(() => {
    const resolved = resolvePreset(preset, customPresets)
    let tokens = resolved.tokens
    let m: ThemeMode = resolved.mode
    if (customColors) {
      tokens = deriveFromBrand({ L: brandLight, C: brandChroma, H: brandHue, mode })
      m = mode
    }
    applyTokens(tokens)
    applyMode(m)
  }, [preset, customColors, brandLight, brandChroma, brandHue, mode, customPresets])

  // Apply radius
  React.useEffect(() => {
    applyRadius(radius)
  }, [radius])

  // Apply density via data attribute
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.density = density
    }
  }, [density])

  // Stable setters
  const setSidebarCollapsed = React.useCallback((v: boolean) => setSidebarCollapsedState(v), [])
  const setDensity = React.useCallback((d: Density) => setDensityState(d), [])
  const setLanguage = React.useCallback((lang: LangCode) => setLanguageState(lang), [])
  const setRadius = React.useCallback((r: number) => setRadiusState(r), [])

  // Mode setter with auto-switch between presets when user is not on a custom color.
  // Light presets (default/ocean/forest/monochrome) pair with light mode;
  // dark presets (midnight/graphite) pair with dark mode.
  const setMode = React.useCallback(
    (m: ThemeMode) => {
      setModeRaw(m)
      if (
        m === "dark" &&
        !customColors &&
        ["default", "ocean", "forest", "monochrome"].includes(preset)
      ) {
        setPreset("midnight")
      }
      if (m === "light" && !customColors && ["midnight", "graphite"].includes(preset)) {
        setPreset("default")
      }
    },
    [customColors, preset],
  )

  const applyPreset = React.useCallback((id: string) => {
    if (PRESETS[id] || id.startsWith("custom-")) {
      setPreset(id)
      setCustomColors(false)
    }
  }, [])

  const applyCustomBrand = React.useCallback((params: BrandColor) => {
    setBrandLight(params.L)
    setBrandChroma(params.C)
    setBrandHue(params.H)
    setCustomColors(true)
  }, [])

  const value = React.useMemo<AppContextType>(
    () => ({
      language,
      setLanguage,
      mode,
      setMode,
      preset,
      applyPreset,
      sidebarCollapsed,
      setSidebarCollapsed,
      density,
      setDensity,
      brandLight,
      brandChroma,
      brandHue,
      customColors,
      applyCustomBrand,
      customPresets,
      radius,
      setRadius,
    }),
    [
      language,
      setLanguage,
      mode,
      setMode,
      preset,
      applyPreset,
      sidebarCollapsed,
      setSidebarCollapsed,
      density,
      setDensity,
      brandLight,
      brandChroma,
      brandHue,
      customColors,
      applyCustomBrand,
      customPresets,
      radius,
      setRadius,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
