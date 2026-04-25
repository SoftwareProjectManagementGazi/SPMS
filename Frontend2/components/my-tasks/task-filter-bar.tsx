"use client"

// TaskFilterBar — search input + group-by segmented control for MyTasks.
//
// Uses a raw <input> tag styled to match the Input primitive (the primitive
// does not forward `onChange` correctness well enough for the controlled
// search text; its single `onChange` handler forwards fine but the primitive
// lacks width/placeholder/size interplay we want here). Pure-presentation
// control — state lives in the parent MyTasksExperience.

import * as React from "react"
import { Search } from "lucide-react"

import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export type GroupBy = "none" | "project" | "status" | "priority" | "due"

interface TaskFilterBarProps {
  search: string
  onSearch: (v: string) => void
  groupBy: GroupBy
  onGroupByChange: (v: GroupBy) => void
}

export function TaskFilterBar({
  search,
  onSearch,
  groupBy,
  onGroupByChange,
}: TaskFilterBarProps) {
  const { language: lang } = useApp()
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        flexWrap: "wrap",
      }}
    >
      {/* Styled search input — inline to match Input primitive look without
          the primitive's controlled-value-only contract (we want to pass
          placeholder + width + onChange together). */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          height: 28,
          padding: "0 8px",
          gap: 6,
          width: 240,
        }}
      >
        <Search size={13} style={{ color: "var(--fg-subtle)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={
            lang === "tr" ? "Görevlerde ara…" : "Search tasks…"
          }
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            background: "transparent",
            border: 0,
            // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
            fontSize: 13,
            color: "var(--fg)",
          }}
        />
      </div>

      <SegmentedControl
        options={[
          { id: "none", label: lang === "tr" ? "Grupsuz" : "None" },
          { id: "project", label: lang === "tr" ? "Proje" : "Project" },
          { id: "status", label: lang === "tr" ? "Durum" : "Status" },
          { id: "priority", label: lang === "tr" ? "Öncelik" : "Priority" },
          { id: "due", label: lang === "tr" ? "Bitiş" : "Due" },
        ]}
        value={groupBy}
        onChange={(v) => onGroupByChange(v as GroupBy)}
      />
    </div>
  )
}
