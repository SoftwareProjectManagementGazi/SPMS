"use client"

/**
 * AI Chat Log — narration column for the left pane during generation.
 *
 * Renders:
 *  - The user's submitted preferences as a "Sen" entry at top
 *  - AI's intro text (accumulated text_token events)
 *  - One "• X eklendi" line per node_added / column_added event
 *  - A blinking cursor at the tail while still generating
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 ai-chat-log.tsx
 */

import * as React from "react"
import { Sparkles } from "lucide-react"

import type { Methodology } from "@/lib/ai/types"

export interface AIChatLogProps {
  /** Methodology + key choices summary chip (e.g. "Iterative · 6 kişi · Web/SaaS") */
  contextSummary: string
  /** User's question/prompt summary line shown under "Sen" */
  userPrompt: string
  /** AI's accumulated intro text (streamed text_token chunks joined) */
  aiIntro: string
  /** Per-event action lines ("Keşif eklendi", etc.) */
  actionLines: string[]
  /** True while stream is in-flight — adds blinking cursor at tail */
  isGenerating: boolean
  /** Whether to show context chip; hidden in idle state */
  showContextChip?: boolean
}

export function AIChatLog({
  contextSummary,
  userPrompt,
  aiIntro,
  actionLines,
  isGenerating,
  showContextChip = true,
}: AIChatLogProps) {
  // Auto-scroll to bottom when new lines arrive
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [aiIntro, actionLines.length])

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {/* Context chip — methodology + key choices */}
      {showContextChip && contextSummary && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--ai-accent-soft)",
            color: "var(--ai-accent)",
            fontSize: 12,
            fontWeight: 500,
            alignSelf: "flex-start",
          }}
        >
          <Sparkles size={12} />
          {contextSummary}
        </div>
      )}

      {/* User prompt */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Sen
        </div>
        <div style={{ color: "var(--fg)", whiteSpace: "pre-wrap" }}>
          {userPrompt}
        </div>
      </div>

      {/* AI response */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ai-accent)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Sparkles size={12} /> AI
        </div>

        {aiIntro && (
          <div style={{ color: "var(--fg)", marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {aiIntro}
          </div>
        )}

        {/* Action bullets — paced reveal happens via parent state updates */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {actionLines.map((line, i) => {
            const isLast = i === actionLines.length - 1
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  color: "var(--fg-muted)",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: "var(--ai-accent)",
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                  aria-hidden
                />
                <span style={{ flex: 1 }}>
                  {line}
                  {isLast && isGenerating && (
                    <span
                      className="ai-cursor"
                      style={{
                        background: "var(--ai-accent)",
                        height: "1em",
                        marginLeft: 4,
                      }}
                    >
                      &nbsp;
                    </span>
                  )}
                </span>
              </li>
            )
          })}
          {/* If no action lines yet but still generating, show cursor under intro */}
          {actionLines.length === 0 && isGenerating && (
            <li style={{ color: "var(--fg-muted)" }}>
              <span
                className="ai-cursor"
                style={{
                  background: "var(--ai-accent)",
                  height: "1em",
                }}
              >
                &nbsp;
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

/**
 * Helper — format user submitted form into "Sen" prompt line.
 * Kept here (not in lib) because it shapes display copy, not business logic.
 */
export function formatUserPrompt(args: {
  variant: "lifecycle" | "task_status"
  methodology: Methodology
  teamSize?: number | null
  duration?: { value: number; unit: "week" | "month" | "year" } | null
  openEnded?: boolean
  qualitySummary?: string // e.g. "Code review + CI"
}): string {
  const parts: string[] = [args.methodology]
  if (args.teamSize) parts.push(`${args.teamSize} kişilik takım`)
  if (args.openEnded) parts.push("süresiz")
  else if (args.duration) {
    const unitLabel = args.duration.unit === "week" ? "hafta" : args.duration.unit === "year" ? "yıl" : "ay"
    parts.push(`${args.duration.value} ${unitLabel}`)
  }
  if (args.qualitySummary) parts.push(args.qualitySummary)

  const variantWord = args.variant === "lifecycle" ? "yaşam döngüsü" : "görev durumu"
  return `${variantWord} oluştur. ${parts.join(" · ")}.`
}
