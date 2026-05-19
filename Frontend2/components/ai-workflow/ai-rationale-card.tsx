"use client"

/**
 * AI Rationale Card — shown in Done state to explain WHY the AI chose
 * this particular structure. Builds trust + helps the user decide whether
 * to Apply, Regenerate, or tweak.
 *
 * Styling: soft violet background, soft border, sparkle icon. Body text
 * uses --fg-muted to keep visual weight subordinate to the canvas above.
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 ai-rationale-card.tsx
 */

import { Sparkles } from "lucide-react"

export interface AIRationaleCardProps {
  /** AI's explanation text (Turkish, 2-3 sentences typical) */
  text: string
}

export function AIRationaleCard({ text }: AIRationaleCardProps) {
  if (!text) return null
  return (
    <div
      role="note"
      style={{
        background: "var(--ai-accent-soft)",
        border: "1px solid color-mix(in oklch, var(--ai-accent) 30%, transparent)",
        borderRadius: "var(--radius)",
        padding: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "var(--surface)",
          color: "var(--ai-accent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Sparkles size={14} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ai-accent)",
            marginBottom: 4,
          }}
        >
          Neden bu workflow?
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
