"use client"

/**
 * AI Context Badge — top-left chip showing which diagram is being edited.
 *
 * Visual contract from mockup §State 1 Idle:
 *   ┌───────────────────────────────────────┐
 *   │ [icon]  Yaşam Döngüsü Diyagramı      │
 *   │         <Project name> projesinin    │
 *   │         workflow'u                   │
 *   └───────────────────────────────────────┘
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 (ai-context-badge.tsx)
 */

import { Diamond, Columns } from "lucide-react"

import { useApp } from "@/context/app-context"

import type { AIWorkflowVariant } from "./ai-workflow-modal"

export interface AIContextBadgeProps {
  variant: AIWorkflowVariant
  /** Project/team name shown below the variant label */
  contextLabel: string
}

export function AIContextBadge({ variant, contextLabel }: AIContextBadgeProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const title =
    variant === "lifecycle"
      ? T("Yaşam Döngüsü Diyagramı", "Lifecycle Diagram")
      : T("Görev Durumu Diyagramı", "Task Status Diagram")

  const subtitle =
    variant === "lifecycle"
      ? T(`${contextLabel} projesinin workflow'u`, `${contextLabel} project workflow`)
      : T(`${contextLabel} takımının görev akışı`, `${contextLabel} team task flow`)

  const Icon = variant === "lifecycle" ? Diamond : Columns

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: "var(--radius)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "var(--surface)",
          color: "var(--fg-muted)",
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg)",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}
