"use client"

// CanvasSkeleton — prototype-faithful loading placeholder for the
// dynamically-imported WorkflowCanvas (CONTEXT D-07, UI-SPEC table line 92).
//
// Rendered while @xyflow/react chunk is loading. Mirrors the canvas's
// dot-grid background and shows ~5 placeholder node rectangles so users see
// "shape and movement" rather than a blank box.

import * as React from "react"
import { useApp } from "@/context/app-context"

interface Props {
  height?: number | string
}

export function CanvasSkeleton({ height = "100%" }: Props) {
  const { language } = useApp()
  const placeholders = [
    { x: 60, y: 80 },
    { x: 240, y: 80 },
    { x: 420, y: 80 },
    { x: 240, y: 200 },
    { x: 420, y: 200 },
  ]
  return (
    <div
      aria-label="loading workflow canvas"
      role="status"
      style={{
        position: "relative",
        width: "100%",
        height,
        minHeight: 600,
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        boxShadow: "inset 0 0 0 1px var(--border)",
        overflow: "hidden",
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--border-strong) 30%, transparent) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {placeholders.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: 140,
            height: 60,
            // 10px radius matches the workflow-editor.jsx node geometry per
            // UI-SPEC line 178 permitted exception (canvas skeleton mirrors
            // the actual phase-node radius for a faithful loading shimmer).
            borderRadius: 10,
            background: "var(--surface)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            opacity: 0.6,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-subtle)",
          fontSize: 13,
          letterSpacing: 0.2,
        }}
      >
        {language === "tr" ? "Yükleniyor…" : "Loading…"}
      </div>
    </div>
  )
}
