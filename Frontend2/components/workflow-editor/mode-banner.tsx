"use client"

// ModeBanner — top-left overlay above the canvas.
//
// Prototype parity: only the `sequential-locked` mode renders a critical-tone
// callout (Lock icon + long warning copy). All other modes stay quiet so the
// canvas isn't visually polluted by a benign Badge for every mode.

import * as React from "react"
import { Lock } from "lucide-react"

import { useApp } from "@/context/app-context"
import type { WorkflowMode } from "@/services/lifecycle-service"

export interface ModeBannerProps {
  mode: WorkflowMode
}

export function ModeBanner({ mode }: ModeBannerProps) {
  const { language } = useApp()
  if (mode !== "sequential-locked") return null
  const label =
    language === "tr"
      ? "Sıralı kilitli: Fazlar tek yönde, geri dönüş yok."
      : "Sequential locked: phases one-way, no reversal."
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 5,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        fontSize: 11.5,
        fontWeight: 500,
        color: "var(--priority-critical)",
        background:
          "color-mix(in oklch, var(--priority-critical) 8%, var(--surface))",
        boxShadow:
          "inset 0 0 0 1px color-mix(in oklch, var(--priority-critical) 25%, transparent)",
        borderRadius: 999,
      }}
      role="status"
      aria-live="polite"
    >
      <Lock size={12} aria-hidden />
      {label}
    </div>
  )
}
