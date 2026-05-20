"use client"

// Phase 13 Plan 13-07 Task 1 — ProjectPicker (D-A1).
// Reports v2 hotfix — visually aligned with the prototype's secondary-Button
// header chips (`[Q2 2026] [PDF]` in misc.jsx:367-370). The native <select>
// is kept under the hood for free OS-picker on mobile + free keyboard a11y;
// only the visual chrome is restyled to match the Button.secondary aesthetic
// (border-strong + inset shadows + radius-sm + chevron icon overlay).
//
// Sources its options from useProjects("ACTIVE,COMPLETED") — same query
// that the Faz Raporları section uses, so TanStack Query dedupes via the
// shared queryKey (no extra network call). The BE `?status=` parser was
// fixed in the same patch to split comma-separated values; previously the
// dropdown was always empty because the BE treated the whole string as a
// single literal status.

import * as React from "react"
import { ChevronDown } from "lucide-react"
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
  const { data: projects, isLoading } = useProjects("ACTIVE,COMPLETED")
  const projectList = (projects as Project[] | undefined) ?? []

  const placeholder = isLoading
    ? T("Yükleniyor…", "Loading…")
    : projectList.length === 0
      ? T("Proje bulunamadı", "No projects")
      : T("Proje seç", "Select project")

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={T("Proje seç", "Select project")}
        disabled={isLoading || projectList.length === 0}
        style={{
          // Strip native chrome so we can render the Button.secondary look.
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          // Match Button variant="secondary" size="sm" — see
          // components/primitives/button.tsx VARIANTS.secondary + SIZES.sm.
          height: 28,
          padding: "0 28px 0 10px",
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1,
          borderRadius: "var(--radius-sm)",
          background: "var(--surface)",
          color: "var(--fg)",
          border: "none",
          // Same inset + drop shadows the Button primitive applies for the
          // secondary variant. Without these the dropdown reads as a flat
          // input next to the SegmentedControl chips.
          boxShadow:
            "0 1px 2px oklch(0 0 0 / 0.05), var(--inset-top), var(--inset-bottom), inset 0 0 0 1px var(--border-strong)",
          cursor: isLoading || projectList.length === 0 ? "not-allowed" : "pointer",
          opacity: isLoading || projectList.length === 0 ? 0.55 : 1,
          // Leave room for the chevron rendered as an absolutely-positioned overlay.
          minWidth: 160,
          maxWidth: 240,
          textOverflow: "ellipsis",
          // Suppress default focus outline; CSS .btn-press / focus-visible cover this globally.
          outline: "none",
          fontFamily: "inherit",
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {projectList.map((p) => (
          <option key={p.id} value={p.id}>
            {p.key} — {p.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--fg-muted)",
        }}
      />
    </div>
  )
}
