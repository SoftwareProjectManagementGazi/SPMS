"use client"

// DescriptionEditor — mode-switching wrapper around a Plain <textarea> and the
// dynamically-imported TipTap editor (D-36). Mode preference is persisted
// per-user in localStorage under `spms.description.mode`.
//
// The Rich editor is loaded via next/dynamic with ssr:false (RESEARCH Pitfall 2)
// — belt-and-suspenders with immediatelyRender:false inside the rich editor
// itself. The chunk only downloads when the user switches to Rich mode, so
// users on Plain mode pay zero bundle cost for the ~150-200KB TipTap graph.

import * as React from "react"
import dynamic from "next/dynamic"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"

// ssr:false keeps TipTap out of the SSR render path entirely.
const RichEditor = dynamic(() => import("./description-editor-rich"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="loading rich editor"
      style={{
        height: 160,
        background: "var(--surface-2)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    />
  ),
})

const MODE_KEY = "spms.description.mode"
type Mode = "plain" | "rich"

function readStoredMode(): Mode {
  if (typeof window === "undefined") return "plain"
  try {
    const v = window.localStorage.getItem(MODE_KEY)
    return v === "rich" || v === "plain" ? v : "plain"
  } catch {
    return "plain"
  }
}

interface Props {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

export function DescriptionEditor({ value, onChange, disabled }: Props) {
  const { language: lang } = useApp()
  const [mode, setMode] = React.useState<Mode>("plain")

  // Hydrate from localStorage AFTER mount to avoid hydration mismatches.
  React.useEffect(() => {
    setMode(readStoredMode())
  }, [])

  const setAndPersist = React.useCallback((m: Mode) => {
    setMode(m)
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m)
    } catch {
      /* ignore quota / security errors */
    }
  }, [])

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1 }} />
        <SegmentedControl
          size="xs"
          options={[
            { id: "plain", label: lang === "tr" ? "Düz" : "Plain" },
            { id: "rich", label: lang === "tr" ? "Zengin" : "Rich" },
          ]}
          value={mode}
          onChange={(v) => setAndPersist(v as Mode)}
        />
      </div>
      {mode === "plain" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder={
            lang === "tr" ? "Görev açıklaması…" : "Task description…"
          }
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 13,
            lineHeight: 1.6,
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            color: "var(--fg)",
            border: "none",
            outline: "none",
            resize: "vertical",
            minHeight: 120,
            font: "inherit",
          }}
        />
      ) : (
        <RichEditor value={value} onChange={onChange} />
      )}
    </div>
  )
}
