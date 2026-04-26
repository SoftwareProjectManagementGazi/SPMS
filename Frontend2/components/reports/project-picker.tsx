"use client"

// Phase 13 Plan 13-07 Task 1 — ProjectPicker (D-A1).
//
// Native <select> styled to match the Input primitive. Sources its options
// from useProjects("ACTIVE,COMPLETED") — same query that the Faz Raporları
// section uses in Plan 13-08, so TanStack Query dedupes via the shared
// queryKey (no extra network call).
//
// We use a native <select> instead of a custom dropdown to keep mobile
// behavior native (iOS/Android open the OS picker), to satisfy keyboard
// accessibility without a custom roving-tabindex implementation, and to
// keep the surface small — the picker is the project axis for every chart
// on the page; over-engineering it would slow the whole report load.

import * as React from "react"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import type { Project } from "@/services/project-service"

export interface ProjectPickerProps {
  value: number | null
  onChange: (id: number) => void
}

export function ProjectPicker({ value, onChange }: ProjectPickerProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const { data: projects } = useProjects("ACTIVE,COMPLETED")

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={T("Proje seç", "Select project")}
      style={{
        padding: "6px 10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12.5,
        color: "var(--fg)",
        cursor: "pointer",
      }}
    >
      <option value="" disabled>
        {T("Proje seç", "Select project")}
      </option>
      {(projects as Project[] | undefined)?.map((p) => (
        <option key={p.id} value={p.id}>
          {p.key} — {p.name}
        </option>
      ))}
    </select>
  )
}
