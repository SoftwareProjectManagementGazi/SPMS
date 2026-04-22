"use client"

// BacklogToggle — persistent vertical pill button at the far-left edge of the
// ProjectDetail content area (UI-SPEC §12, D-13). Clicking flips open/closed
// state; the parent (<ProjectDetailShell>) owns the state and persists it via
// `useBacklogOpenState` to spms.backlog.open.{projectId} (D-14).

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useApp } from "@/context/app-context"

interface BacklogToggleProps {
  open: boolean
  onToggle: () => void
}

export function BacklogToggle({ open, onToggle }: BacklogToggleProps) {
  const { language } = useApp()
  const label = language === "tr" ? "Backlog'u aç/kapat" : "Toggle backlog"
  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-expanded={open}
      style={{
        width: 20,
        height: 56,
        background: "var(--surface-2)",
        boxShadow: "inset 0 0 0 1px var(--border)",
        borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--fg-muted)",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
    </button>
  )
}
