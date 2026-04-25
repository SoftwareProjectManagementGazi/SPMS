"use client"

// AssigneePicker — searchable popover for choosing a task assignee.
//
// Mirrors the old Frontend's `<Popover><Command>` shadcn pattern but
// hand-rolled with the prototype primitives (no shadcn per design memo).
// Reuses the project member roster fetched by useProjectMembers so we
// don't hit the user list at every render.
//
// API:
//   value      — current assignee id (or null when unassigned)
//   onSelect   — called with the picked id (or null to unassign)
//   onCancel   — called when the user dismisses (Escape, click outside)
//   projectId  — drives which member list to fetch
//
// Renders a small search input + scrollable result list. Keyboard:
//   Esc        — fires onCancel
//   Enter      — picks the highlighted row (defaults to the first match)

import * as React from "react"
import { Check, Search, UserMinus } from "lucide-react"

import { Avatar } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjectMembers } from "@/hooks/use-projects"
import type { ProjectMember } from "@/services/project-service"

interface AssigneePickerProps {
  projectId: number
  value: number | null
  onSelect: (id: number | null) => void
  onCancel: () => void
  /** Anchor side. The picker is 240px wide; "end" right-aligns it so it
   *  grows leftward — the default in the Task Detail sidebar where the
   *  300px right column sits flush with the page edge. */
  align?: "start" | "end"
}

function avatarFor(member: ProjectMember) {
  const initials = member.fullName.trim().slice(0, 2).toUpperCase()
  return {
    initials,
    avColor: ((member.id % 8) + 1) as number,
  }
}

export function AssigneePicker({
  projectId,
  value,
  onSelect,
  onCancel,
  align = "end",
}: AssigneePickerProps) {
  const { language: lang } = useApp()
  const [query, setQuery] = React.useState("")
  // Debounce so a fast typer fires one fetch per pause, not per keystroke.
  // 200ms is the sweet spot between perceived responsiveness and request
  // volume (matches the search input in mt-toolbar's pattern).
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(id)
  }, [query])
  const { data: members = [], isLoading, isFetching } = useProjectMembers(
    projectId,
    debounced,
  )
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismissal — same pattern as MTPicker.
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
      const first = members[0]
      if (first) onSelect(first.id)
    }
  }

  return (
    <div
      ref={ref}
      onKeyDown={onKey}
      role="dialog"
      aria-label={lang === "tr" ? "Atanan seç" : "Select assignee"}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        [align === "end" ? "right" : "left"]: 0,
        width: 240,
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Search row */}
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
          placeholder={
            lang === "tr" ? "Üye ara…" : "Search members…"
          }
          aria-label={lang === "tr" ? "Üye ara" : "Search members"}
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

      {/* Unassign row — surfaced only when there's a current assignee. */}
      {value != null && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "6px 10px",
            fontSize: 12.5,
            background: "transparent",
            color: "var(--fg-muted)",
            border: "none",
            cursor: "pointer",
            borderBottom: "1px solid var(--border)",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-2)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "transparent"
          }}
        >
          <UserMinus size={13} aria-hidden />
          <span>{lang === "tr" ? "Atamayı kaldır" : "Unassign"}</span>
        </button>
      )}

      {/* Result list */}
      <div
        role="listbox"
        aria-busy={isFetching}
        style={{
          maxHeight: 240,
          overflowY: "auto",
          padding: 4,
          position: "relative",
        }}
      >
        {/* Subtle search-in-flight bar — animates in only while a server
            fetch is pending (refetch after debounce). Initial isLoading
            still gets its own centered "Yükleniyor…" row below. */}
        {!isLoading && isFetching && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--primary), transparent)",
              opacity: 0.7,
            }}
          />
        )}
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
        {!isLoading && members.length === 0 && (
          <div
            style={{
              padding: 8,
              fontSize: 12,
              color: "var(--fg-subtle)",
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Üye bulunamadı" : "No members"}
          </div>
        )}
        {members.map((m) => {
          const selected = m.id === value
          const av = avatarFor(m)
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(m.id)}
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
              <Avatar user={av} size={20} />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.fullName}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--fg-subtle)",
                }}
              >
                {m.roleName}
              </span>
              {selected && (
                <Check
                  size={12}
                  style={{ color: "var(--primary)" }}
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
