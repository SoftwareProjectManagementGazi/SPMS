"use client"
import * as React from "react"
import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

interface MethodologyCardProps {
  projects: Project[]
}

const METHODOLOGY_CONFIG = [
  { key: "scrum", color: "var(--status-progress)" },
  { key: "kanban", color: "var(--primary)" },
  { key: "waterfall", color: "var(--status-review)" },
] as const

function classifyMethodology(methodology: string): "scrum" | "kanban" | "waterfall" | "other" {
  const m = methodology.toLowerCase()
  if (m.includes("scrum")) return "scrum"
  if (m.includes("kanban")) return "kanban"
  if (m.includes("waterfall")) return "waterfall"
  return "other"
}

export function MethodologyCard({ projects }: MethodologyCardProps) {
  const { language } = useApp()

  const counts = { scrum: 0, kanban: 0, waterfall: 0, other: 0 }
  for (const p of projects) {
    counts[classifyMethodology(p.methodology)]++
  }
  const total = projects.length || 1 // avoid division by zero

  return (
    <Card padding={16}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
        {language === "tr" ? "Metodoloji dağılımı" : "Methodology mix"}
      </div>

      {/* Stacked bar */}
      <div style={{
        display: "flex",
        height: 8,
        borderRadius: 999,
        overflow: "hidden",
        background: "var(--surface-2)",
      }}>
        <div style={{ width: `${(counts.scrum / total) * 100}%`, background: "var(--status-progress)" }} />
        <div style={{ width: `${(counts.kanban / total) * 100}%`, background: "var(--primary)" }} />
        <div style={{ width: `${(counts.waterfall / total) * 100}%`, background: "var(--status-review)" }} />
        {counts.other > 0 && (
          <div style={{ flex: 1, background: "var(--fg-subtle)" }} />
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {METHODOLOGY_CONFIG.map(({ key, color }) => (
          <div key={key} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
              <span style={{ textTransform: "capitalize" }}>{key}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--fg-muted)" }}>
                {counts[key]} {language === "tr" ? "proje" : "projects"}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--fg-subtle)",
                fontSize: 11,
              }}>
                {total > 0 ? Math.round((counts[key] / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
