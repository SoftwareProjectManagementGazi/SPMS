"use client"
import * as React from "react"
import { Card } from "@/components/primitives"

const TONE_BG: Record<string, string> = {
  primary: "color-mix(in oklch, var(--primary) 14%, transparent)",
  info: "color-mix(in oklch, var(--status-progress) 15%, transparent)",
  success: "color-mix(in oklch, var(--status-done) 15%, transparent)",
  danger: "color-mix(in oklch, var(--priority-critical) 13%, transparent)",
  neutral: "var(--surface-2)",
}

const TONE_COLOR: Record<string, string> = {
  primary: "var(--primary)",
  info: "var(--status-progress)",
  success: "var(--status-done)",
  danger: "var(--priority-critical)",
  neutral: "var(--fg-muted)",
}

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  tone: "primary" | "info" | "success" | "danger" | "neutral"
  icon: React.ReactNode
}

export function StatCard({ label, value, delta, tone, icon }: StatCardProps) {
  return (
    <Card padding={14}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 11.5,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "var(--fg-muted)",
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: -0.8,
            marginTop: 6,
            fontFamily: "var(--font-sans)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius)",
          flexShrink: 0,
          background: TONE_BG[tone] ?? TONE_BG.neutral,
          color: TONE_COLOR[tone] ?? TONE_COLOR.neutral,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {icon}
        </div>
      </div>
      {delta && (
        <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 10 }}>
          {delta}
        </div>
      )}
    </Card>
  )
}
