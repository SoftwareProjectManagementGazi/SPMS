"use client"

// BottomToolbar (Phase 12 Plan 12-07) — floating pill at canvas bottom-
// center. Renders the 4 action buttons per UI-SPEC §1393-1397:
//
//   [+ Düğüm] [↪ Bağlantı] [▢ Grup] [Sınıflandır ▾]  |  [✦ AI öner]
//
// Plan 12-07 ships the structural buttons with disabled handlers (Plan
// 12-08 wires the real DnD/grouping/align actions). The "AI öner" button
// is permanently disabled with a "Yakında" Badge per CONTEXT D-33.

import * as React from "react"
import { Plus, ArrowRight, Square, AlignVerticalJustifyCenter, Sparkles } from "lucide-react"

import { Badge, Button } from "@/components/primitives"
import { Tooltip } from "./tooltip"
import { useApp } from "@/context/app-context"

export interface BottomToolbarProps {
  onAddNode?: () => void
  onAddEdge?: () => void
  onGroup?: () => void
  onAlign?: (
    action:
      | "distribute-h"
      | "align-top"
      | "align-bottom"
      | "center-v"
      | "center-h",
  ) => void
}

export function BottomToolbar(props: BottomToolbarProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [alignOpen, setAlignOpen] = React.useState(false)
  const alignRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!alignOpen) return
    const onDoc = (e: MouseEvent) => {
      if (alignRef.current && !alignRef.current.contains(e.target as Node)) {
        setAlignOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [alignOpen])

  const ALIGN_ITEMS: Array<{
    id: Parameters<NonNullable<BottomToolbarProps["onAlign"]>>[0]
    label: string
  }> = [
    { id: "distribute-h", label: T("Yatay dağıt", "Distribute horizontally") },
    { id: "align-top", label: T("Üste hizala", "Align top") },
    { id: "align-bottom", label: T("Alta hizala", "Align bottom") },
    { id: "center-v", label: T("Dikey ortala", "Center vertically") },
    { id: "center-h", label: T("Yatay ortala", "Center horizontally") },
  ]

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 5,
        background: "var(--surface)",
        borderRadius: 999,
        boxShadow:
          "0 4px 14px oklch(0 0 0 / 0.10), inset 0 0 0 1px var(--border)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus size={14} />}
        onClick={props.onAddNode}
        disabled={!props.onAddNode}
        title={T("Düğüm — Plan 12-08", "Node — Plan 12-08")}
      >
        {T("Düğüm", "Node")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<ArrowRight size={14} />}
        onClick={props.onAddEdge}
        disabled={!props.onAddEdge}
        title={T("Bağlantı — Plan 12-08", "Edge — Plan 12-08")}
      >
        {T("Bağlantı", "Edge")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Square size={14} />}
        onClick={props.onGroup}
        disabled={!props.onGroup}
        title={T("Grup — Plan 12-08", "Group — Plan 12-08")}
      >
        {T("Grup", "Group")}
      </Button>
      <div ref={alignRef} style={{ position: "relative" }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<AlignVerticalJustifyCenter size={14} />}
          onClick={() => setAlignOpen((v) => !v)}
          disabled={!props.onAlign}
          title={T("Sınıflandır — Plan 12-08", "Align — Plan 12-08")}
        >
          {T("Sınıflandır", "Align")}
        </Button>
        {alignOpen && props.onAlign && (
          <div
            role="menu"
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: 0,
              minWidth: 180,
              background: "var(--surface)",
              borderRadius: "var(--radius-sm)",
              boxShadow:
                "0 8px 24px oklch(0 0 0 / 0.12), inset 0 0 0 1px var(--border)",
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              zIndex: 6,
            }}
          >
            {ALIGN_ITEMS.map((item) => (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  props.onAlign?.(item.id)
                  setAlignOpen(false)
                }}
                style={{
                  textAlign: "left",
                  fontSize: 12,
                  color: "var(--fg)",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <span
        style={{ height: 18, width: 1, background: "var(--border)" }}
        aria-hidden
      />
      <Tooltip
        text={T(
          "AI önerileri gelecek sürümde aktif olacak.",
          "AI suggestions will be active in a future version.",
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={<Sparkles size={14} />}
          disabled
          title={T("AI öner — yakında", "AI suggest — soon")}
          aria-label={T(
            "Yakında — bu özellik gelecek sürümde aktif olacak",
            "Soon — this feature will be active in a future version",
          )}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {T("AI öner", "AI suggest")}
            <Badge size="xs" tone="neutral">
              {T("Yakında", "Soon")}
            </Badge>
          </span>
        </Button>
      </Tooltip>
    </div>
  )
}
