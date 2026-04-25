"use client"

// CycleCounterBadge — top-right `×N` badge on a PhaseNode (CONTEXT D-47,
// EDIT-06, UI-SPEC §14 lines 1304-1320).
//
// Visibility rule: returns null when count < 2 (Pitfall 16 — DOM-absent so
// queryByText returns null in tests rather than rendering an invisible
// element). When count >= 2, renders a primary-tone `xs` Badge wrapped in a
// Tooltip exposing the localized "kapatıldı" copy.

import * as React from "react"
import { Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { Tooltip } from "./tooltip"

interface Props {
  count: number
  /** Visual offset override (defaults follow UI-SPEC §14). */
  style?: React.CSSProperties
}

export function CycleCounterBadge({ count, style }: Props) {
  const { language } = useApp()
  // Visibility gate — count < 2 means no badge in the DOM.
  if (count < 2) return null

  const tip =
    language === "tr"
      ? `Bu faz ${count} kere kapatıldı (Spiral/iterative döngüleri)`
      : `This phase was closed ${count} times (Spiral/iterative cycles)`

  return (
    <span
      style={{
        position: "absolute",
        top: -6,
        right: -6,
        zIndex: 5,
        ...style,
      }}
    >
      <Tooltip text={tip}>
        <Badge
          tone="primary"
          size="xs"
          style={{ padding: "0 4px", fontSize: 10, height: 16 }}
        >
          ×{count}
        </Badge>
      </Tooltip>
    </span>
  )
}
