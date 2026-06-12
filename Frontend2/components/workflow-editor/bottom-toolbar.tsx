"use client"

// BottomToolbar (Phase 12 Plan 12-07) — floating pill at canvas bottom-
// center. Renders the 4 action buttons per UI-SPEC §1393-1397:
//
//   [+ Düğüm] [↪ Bağlantı] [▢ Grup] [Hizala ▾]  |  [✦ AI öner]
//
// Plan 12-07 ships the structural buttons with disabled handlers (Plan
// 12-08 wires the real DnD/grouping/align actions).
//
// v3.0 Wave 2: "AI öner" button activated — "Yakında" Badge removed,
// onAISuggest callback wired to open AI Workflow Modal in parent.
// Plan ref: .planning/ai-workflow-generator-plan.md Wave 2.6.

import * as React from "react"
import { Plus, ArrowRight, Square, AlignVerticalJustifyCenter, Sparkles } from "lucide-react"

import { Button } from "@/components/primitives"
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
  /** v3.0 Wave 2: opens AI Workflow Modal. Parent decides variant by current tab. */
  onAISuggest?: () => void
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
        borderRadius: 10,
        boxShadow:
          "var(--shadow-lg), inset 0 0 0 1px var(--border)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus size={14} />}
        onClick={props.onAddNode}
        disabled={!props.onAddNode}
        title={T("Kanvasa yeni düğüm ekle (N)", "Add a new node to the canvas (N)")}
      >
        {T("Düğüm", "Node")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<ArrowRight size={14} />}
        onClick={props.onAddEdge}
        disabled={!props.onAddEdge}
        title={T(
          "İki düğüm arasında bağlantı oluştur (önce kaynak, sonra hedef seçilir)",
          "Connect two nodes (pick source, then target)",
        )}
      >
        {T("Bağlantı", "Edge")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Square size={14} />}
        onClick={props.onGroup}
        disabled={!props.onGroup}
        title={T(
          "Seçili düğümleri grupla; seçili grubu çöz",
          "Group the selected nodes; ungroup a selected group",
        )}
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
          title={T(
            "Seçili düğümleri hizala veya eşit aralıkla dağıt",
            "Align or evenly distribute the selected nodes",
          )}
        >
          {T("Hizala", "Align")}
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
                className="hover-row"
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
          "AI ile workflow oluştur (Yaşam Döngüsü)",
          "Generate workflow with AI (Lifecycle)",
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={
            <span className="ai-sparkle-idle" style={{ display: "inline-flex" }}>
              <Sparkles size={14} style={{ color: "var(--ai-accent)" }} />
            </span>
          }
          onClick={props.onAISuggest}
          disabled={!props.onAISuggest}
          title={T("AI ile oluştur", "Generate with AI")}
          aria-label={T(
            "AI ile workflow oluştur",
            "Generate workflow with AI",
          )}
          style={
            props.onAISuggest
              ? { color: "var(--ai-accent)" }
              : undefined
          }
        >
          {T("AI öner", "AI suggest")}
        </Button>
      </Tooltip>
    </div>
  )
}
