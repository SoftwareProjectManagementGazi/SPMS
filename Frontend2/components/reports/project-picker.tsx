"use client"

// ProjectPicker — secondary-button-styled trigger + searchable popover for
// choosing the report's scoped project (?projectId=X in the URL).
//
// History
// -------
// Phase 13 v1 wrapped a native <select> styled to mimic Button.secondary.
// That carried the same UX taxes the task-detail Status / Sprint / Priority
// pickers had before their UAT refactor:
//   * Two clicks to open (select chrome + dropdown).
//   * Long project names truncated to the OS-picker's narrow line height.
//   * No keyboard-search beyond the OS default (typeahead via first letter).
// This rewrite mirrors the AssigneePicker pattern: a clickable pill trigger
// + a 280-wide popover with a debounced filter input + role="listbox" rows.
// Filtering is client-side because useProjects returns the whole list in
// one round-trip; for typical orgs this is <100 rows so substring search
// is cheap.

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import type { Project } from "@/services/project-service"

export interface ProjectPickerProps {
  value: number | null
  onChange: (id: number) => void
  /** Anchor side. "start" aligns the dropdown's left edge to the trigger's
   *  left edge — the default in the Reports header where the picker is the
   *  leftmost element of its filter group. */
  align?: "start" | "end"
}

// Filter helper — substring match across project key + name (lowercase
// once per project per render; cheap for the <100 rows bound). Exported
// as a pure function so a future test can pin the semantics without
// spinning up the full popover.
export function filterProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase()
  if (!q) return projects
  return projects.filter((p) => {
    return (
      p.key.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.managerName?.toLowerCase().includes(q) ?? false)
    )
  })
}

// =============================================================================
// Popover content
// =============================================================================

interface ProjectPickerPopoverProps {
  projects: Project[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
  onCancel: () => void
  align: "start" | "end"
}

function ProjectPickerPopover({
  projects,
  isLoading,
  selectedId,
  onSelect,
  onCancel,
  align,
}: ProjectPickerPopoverProps) {
  const { language: lang } = useApp()
  const [query, setQuery] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(id)
  }, [query])

  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismissal — same pattern as the task-detail pickers.
  // mousedown (not click) so a row's click handler still fires; the row
  // click happens after mouseup on the same element.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [onCancel])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    } else if (e.key === "Enter") {
      e.preventDefault()
      const first = filtered[0]
      if (first) onSelect(first.id)
    }
  }

  const filtered = React.useMemo(
    () => filterProjects(projects, debounced),
    [projects, debounced],
  )

  return (
    <div
      ref={ref}
      onKeyDown={onKey}
      role="dialog"
      aria-label={lang === "tr" ? "Proje seç" : "Select project"}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        [align === "end" ? "right" : "left"]: 0,
        width: 280,
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Search row — same chrome as AssigneePicker so the two pickers
          feel like siblings. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "tr" ? "Proje ara…" : "Search projects…"}
          aria-label={lang === "tr" ? "Proje ara" : "Search projects"}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: 0,
            fontSize: 12.5,
            color: "var(--fg)",
          }}
        />
      </div>

      {/* Result list */}
      <div
        role="listbox"
        style={{
          maxHeight: 280,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: 8,
              fontSize: 12,
              color: "var(--fg-subtle)",
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Yükleniyor…" : "Loading…"}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div
            style={{
              padding: 8,
              fontSize: 12,
              color: "var(--fg-subtle)",
              textAlign: "center",
            }}
          >
            {debounced
              ? lang === "tr"
                ? "Eşleşen proje yok"
                : "No matching projects"
              : lang === "tr"
                ? "Proje bulunamadı"
                : "No projects"}
          </div>
        )}
        {filtered.map((p) => {
          const selected = p.id === selectedId
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                fontSize: 12.5,
                background: selected ? "var(--surface-2)" : "transparent",
                color: "var(--fg)",
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  "var(--surface-2)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  selected ? "var(--surface-2)" : "transparent"
              }}
            >
              {/* Project key chip — mirrors the mono pill the
                  portfolio table puts in front of every project name
                  so the two surfaces feel consistent. */}
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  background: "var(--surface-2)",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                }}
              >
                {p.key}
              </span>
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={p.name}
              >
                {p.name}
              </span>
              {selected && (
                <Check
                  size={12}
                  style={{ color: "var(--primary)", flexShrink: 0 }}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Trigger button + state machine (the exported entry point)
// =============================================================================

export function ProjectPicker({
  value,
  onChange,
  align = "start",
}: ProjectPickerProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const { data: projects, isLoading } = useProjects("ACTIVE,COMPLETED")
  const projectList = (projects as Project[] | undefined) ?? []
  const [open, setOpen] = React.useState(false)

  const selected = projectList.find((p) => p.id === value) ?? null
  const triggerLabel = (() => {
    if (isLoading) return T("Yükleniyor…", "Loading…")
    if (projectList.length === 0) return T("Proje bulunamadı", "No projects")
    if (selected) return `${selected.key} — ${selected.name}`
    return T("Proje seç", "Select project")
  })()

  const disabled = isLoading || projectList.length === 0
  const ariaLabel = T("Proje seç", "Select project")

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        // Same race-prevention used by the task-detail pickers: keep the
        // trigger click from waking the popover's document-level mousedown
        // dismissal handler when the popover is already open.
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{
          // Match Button variant="secondary" size="sm" — see
          // components/primitives/button.tsx VARIANTS.secondary + SIZES.sm.
          // Kept verbatim from the v1 ProjectPicker so the visual
          // continuity with the Reports header chips (DateRangeFilter,
          // ExportButton) is preserved.
          height: 28,
          padding: "0 28px 0 10px",
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1,
          borderRadius: "var(--radius-sm)",
          background: "var(--surface)",
          color: "var(--fg)",
          border: "none",
          boxShadow:
            "0 1px 2px oklch(0 0 0 / 0.05), var(--inset-top), var(--inset-bottom), inset 0 0 0 1px var(--border-strong)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          minWidth: 160,
          maxWidth: 260,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          outline: "none",
          fontFamily: "inherit",
          textAlign: "left",
          position: "relative",
        }}
      >
        {triggerLabel}
      </button>
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
          opacity: disabled ? 0.55 : 1,
        }}
      />
      {open && (
        <ProjectPickerPopover
          projects={projectList}
          isLoading={isLoading}
          selectedId={value}
          onSelect={(id) => {
            setOpen(false)
            if (id !== value) onChange(id)
          }}
          onCancel={() => setOpen(false)}
          align={align}
        />
      )}
    </div>
  )
}
