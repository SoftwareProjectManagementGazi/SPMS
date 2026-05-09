"use client"

import * as React from "react"
import { Search, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/primitives/input"

// Türkçe departmanlar (prototipdeki gibi)
export const DEPARTMENTS = ["Mühendislik", "Tasarım", "Kalite", "Altyapı", "Veri"] as const

export type ViewMode = "grid" | "list"

interface Props {
  search: string
  onSearchChange: (v: string) => void
  department: string | null
  onDepartmentChange: (v: string | null) => void
  viewMode?: ViewMode
  onViewModeChange?: (v: ViewMode) => void
  lang: string
}

export function TeamToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  viewMode = "grid",
  onViewModeChange,
  lang,
}: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      {/* Search */}
      <div style={{ position: "relative", flex: "0 1 280px", minWidth: 220 }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--fg-muted)",
            pointerEvents: "none",
          }}
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={T("Takım ara…", "Search teams…")}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {/* Department segmented control */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          padding: 4,
          borderRadius: 10,
          background: "var(--bg-subtle, #f1f1ee)",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => onDepartmentChange(null)} style={pillStyle(department === null)}>
          {T("Tümü", "All")}
        </button>
        {DEPARTMENTS.map((d) => (
          <button key={d} onClick={() => onDepartmentChange(d)} style={pillStyle(department === d)}>
            {d}
          </button>
        ))}
      </div>

      {/* Grid/List toggle */}
      {onViewModeChange && (
        <div
          style={{
            display: "inline-flex",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--surface)",
            padding: 2,
          }}
        >
          <button
            onClick={() => onViewModeChange("grid")}
            title={T("Izgara", "Grid")}
            style={toggleBtn(viewMode === "grid")}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            title={T("Liste", "List")}
            style={toggleBtn(viewMode === "list")}
          >
            <List size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    padding: "6px 14px",
    borderRadius: 7,
    border: "none",
    background: active ? "var(--surface)" : "transparent",
    color: active ? "var(--fg)" : "var(--fg-muted)",
    cursor: "pointer",
    transition: "background 0.1s, color 0.1s, box-shadow 0.1s",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
  }
}

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 26,
    border: "none",
    borderRadius: 6,
    background: active ? "var(--bg-subtle, #f1f1ee)" : "transparent",
    color: active ? "var(--fg)" : "var(--fg-muted)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.1s, color 0.1s",
  }
}