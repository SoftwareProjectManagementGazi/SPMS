"use client"

// AllGatePill — Jira-style "Hepsi/All" pill for the source-agnostic gate
// edge (CONTEXT D-17 + D-34, UI-SPEC §13 lines 1289-1302).
//
// Renders a localized Badge wrapped in a Tooltip explaining the semantic.
// Caller positions the pill adjacent to the edge's target endpoint.

import * as React from "react"
import { Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { Tooltip } from "./tooltip"

interface Props {
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export function AllGatePill({ onClick, style, className }: Props) {
  const { language } = useApp()
  const label = language === "tr" ? "Hepsi" : "All"
  const tip =
    language === "tr"
      ? "Bu hedefe herhangi bir aktif düğümden geçilebilir."
      : "Any active node can transition to this target."

  return (
    <span
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{ cursor: onClick ? "pointer" : "default", ...style }}
    >
      <Tooltip text={tip}>
        <Badge tone="mono" size="sm">
          {label}
        </Badge>
      </Tooltip>
    </span>
  )
}
