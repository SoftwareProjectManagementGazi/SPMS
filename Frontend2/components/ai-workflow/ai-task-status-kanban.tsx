"use client"

/**
 * AI Task Status Kanban — column-based live canvas for the task-status variant.
 *
 * Unlike the lifecycle variant (React Flow with positioned nodes), task status
 * is conceptually a left-to-right kanban. We render it directly with flexbox
 * because:
 *  - It's a simpler layout than the lifecycle graph
 *  - We don't need drag/zoom semantics
 *  - The animation pattern (column drops in from right) is cleaner without RF
 *
 * Special-state columns (Blocked, Cancelled, etc.) render in a separate strip
 * below the main flow so they don't fight for horizontal space.
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 ai-task-status-kanban.tsx
 */

import * as React from "react"
import { ArrowRight } from "lucide-react"

import type { SuggestedColumnPayload } from "@/lib/ai/types"

const COLOR_DOT: Record<SuggestedColumnPayload["color"], string> = {
  "status-todo": "var(--status-todo)",
  "status-progress": "var(--status-progress)",
  "status-review": "var(--status-review)",
  "status-done": "var(--status-done)",
  "status-blocked": "var(--status-blocked)",
}

export interface AITaskStatusKanbanProps {
  columns: SuggestedColumnPayload[]
  isGenerating: boolean
}

export function AITaskStatusKanban({
  columns,
  isGenerating,
}: AITaskStatusKanbanProps) {
  const mainCols = columns.filter((c) => !c.is_special)
  const specialCols = columns.filter((c) => c.is_special)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        gap: 24,
        overflow: "auto",
      }}
    >
      {/* Main flow — horizontal kanban */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {mainCols.map((c, idx) => (
          <React.Fragment key={c.id}>
            <KanbanColumn column={c} />
            {idx < mainCols.length - 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "var(--ai-accent)",
                  flexShrink: 0,
                }}
                aria-hidden
              >
                <ArrowRight size={18} />
              </div>
            )}
          </React.Fragment>
        ))}
        {mainCols.length === 0 && (
          <div
            style={{
              color: "var(--fg-muted)",
              fontSize: 13,
              fontStyle: "italic",
              padding: 16,
            }}
          >
            AI sütunları çizmeye başlıyor…
          </div>
        )}
      </div>

      {/* Special states — bottom strip */}
      {specialCols.length > 0 && (
        <div
          style={{
            borderTop: "1px dashed var(--border)",
            paddingTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            ÖZEL
          </span>
          {specialCols.map((c) => (
            <span
              key={c.id}
              className="ai-generated-node"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "var(--surface)",
                color: "var(--fg)",
                fontSize: 12,
                fontWeight: 500,
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: COLOR_DOT[c.color],
                }}
                aria-hidden
              />
              {c.label}
            </span>
          ))}
        </div>
      )}

      {isGenerating && (
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--ai-accent-soft)",
            color: "var(--ai-accent)",
            fontSize: 12,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "var(--shadow-sm)",
            pointerEvents: "none",
          }}
        >
          <span
            className="ai-sparkle-idle"
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--ai-accent)",
            }}
            aria-hidden
          />
          AI çiziyor…
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal: single kanban column card
// ---------------------------------------------------------------------------

function KanbanColumn({ column }: { column: SuggestedColumnPayload }) {
  const dotColor = COLOR_DOT[column.color]

  return (
    <div
      className="ai-generated-node"
      style={{
        flex: "0 0 200px",
        minHeight: 200,
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm), inset 0 0 0 1px var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: dotColor,
              flexShrink: 0,
            }}
            aria-hidden
          />
          {column.label}
        </span>
      </div>

      {/* Description (1-2 lines) */}
      {column.description && (
        <div
          style={{
            padding: "8px 12px",
            fontSize: 11,
            color: "var(--fg-muted)",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {column.description}
        </div>
      )}

      {/* Footer — WIP limit */}
      <div
        style={{
          padding: "6px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--fg-subtle)",
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>WIP</span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            background: column.wip_limit
              ? "color-mix(in oklch, var(--ai-accent) 12%, var(--surface))"
              : "var(--surface-2)",
            color: column.wip_limit ? "var(--ai-accent)" : "var(--fg-muted)",
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {column.wip_limit ?? "∞"}
        </span>
      </div>
    </div>
  )
}
