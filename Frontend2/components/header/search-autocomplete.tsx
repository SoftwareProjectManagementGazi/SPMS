"use client"

// SearchAutocomplete — header search input with Cmd/Ctrl+K shortcut and a
// dropdown that shows parallel project + task results.
//
// Spec (UI-SPEC §11, CONTEXT D-50):
//   - Shortcut: Cmd/Ctrl+K focuses the input + opens dropdown
//   - Debounce: 250ms (we rely on useTaskSearch's enabled>=2 guard for the query;
//     the projects list is client-filtered, no network per keystroke)
//   - Results: up to 3 projects + up to 7 tasks, grouped, with uppercase section
//     headers; "Tümünü gör" footer routes to /search?q=X (Phase 13 placeholder)
//   - Keyboard: ArrowUp / ArrowDown cycle, Enter selects, Esc closes
//   - Close on outside-click (via onBlur with 150ms delay to let mousedown fire)
//
// Note on <input ref>: the Input primitive does not forward refs and lacks
// onFocus/onBlur/onKeyDown wiring, so we render a styled raw <input> inline
// with tokens that exactly mirror the primitive's look. This keeps the
// primitive untouched while giving us the event API the component needs.

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Badge, Card, Kbd } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import { useTaskSearch } from "@/hooks/use-tasks"

type FlatItem =
  | { kind: "project"; id: number; label: string; sub: string; href: string }
  | { kind: "task"; id: number; label: string; sub: string; href: string }

export function SearchAutocomplete() {
  const { language: lang } = useApp()
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [query, setQuery] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)

  // 250ms debounce — defers the search query until typing pauses.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(t)
  }, [query])

  // useTaskSearch is enabled only for debounced ≥ 2 chars (see hooks/use-tasks.ts)
  const { data: tasks = [] } = useTaskSearch(query, debounced)
  const { data: allProjects = [] } = useProjects()

  const projectResults = React.useMemo(() => {
    if (debounced.trim().length < 2) return []
    const q = debounced.toLowerCase()
    return allProjects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
      )
      .slice(0, 3)
  }, [allProjects, debounced])

  const taskResults = React.useMemo(() => (tasks ?? []).slice(0, 7), [tasks])

  // Flat list used for keyboard navigation — matches visual order.
  const flat = React.useMemo<FlatItem[]>(
    () => [
      ...projectResults.map((p) => ({
        kind: "project" as const,
        id: p.id,
        label: p.name,
        sub: p.key,
        href: `/projects/${p.id}`,
      })),
      ...taskResults.map((t) => ({
        kind: "task" as const,
        id: t.id,
        label: t.title,
        sub: t.key,
        href: `/projects/${t.projectId}/tasks/${t.id}`,
      })),
    ],
    [projectResults, taskResults]
  )

  // Cmd/Ctrl+K — focus + open. `window` listener so any page component can
  // trigger the shortcut (matches Linear / Notion / Vercel convention).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k"
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Reset highlight when the result shape changes so stale indices never
  // point at a row that no longer exists.
  React.useEffect(() => {
    if (highlight >= flat.length) setHighlight(0)
  }, [flat.length, highlight])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
    setQuery("")
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(flat.length - 1, h + 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const item = flat[highlight]
      if (item) navigate(item.href)
      else if (query.trim()) {
        // No selected row but the user has typed something — send them to
        // the full search page. Phase 13 owns the /search route.
        router.push(`/search?q=${encodeURIComponent(query)}`)
        setOpen(false)
      }
    }
  }

  const hasQuery = debounced.trim().length >= 2
  const hasResults = projectResults.length > 0 || taskResults.length > 0

  return (
    <div style={{ position: "relative" }}>
      {/* Styled raw <input> mirroring the Input primitive — tokens copied
          verbatim so the visual matches. */}
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
          width: 260,
          transition: "box-shadow 0.12s",
        }}
      >
        <Search size={14} style={{ color: "var(--fg-subtle)" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          // 150ms delay so an onMouseDown on a result row still fires first.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onInputKey}
          placeholder={lang === "tr" ? "Ara…" : "Search…"}
          aria-label={lang === "tr" ? "Ara" : "Search"}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            background: "transparent",
            border: 0,
            outline: 0,
            fontSize: 13,
            color: "var(--fg)",
          }}
        />
        <Kbd>⌘K</Kbd>
      </div>

      {open && hasQuery && (
        <Card
          padding={4}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 360,
            maxHeight: 400,
            overflowY: "auto",
            boxShadow: "var(--shadow-xl)",
            zIndex: 200,
          }}
        >
          {projectResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--fg-subtle)",
                  letterSpacing: 0.4,
                }}
              >
                {lang === "tr" ? "PROJELER" : "PROJECTS"}
              </div>
              {projectResults.map((p, i) => (
                <button
                  key={`proj-${p.id}`}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  // onMouseDown (not onClick) so the row commit fires BEFORE
                  // the input's onBlur handler closes the dropdown.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    navigate(`/projects/${p.id}`)
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: 13,
                    background:
                      highlight === i ? "var(--surface-2)" : "transparent",
                    boxShadow:
                      highlight === i
                        ? "inset 0 0 0 1px var(--border)"
                        : "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--fg)",
                    textAlign: "left",
                    borderRadius: 3,
                  }}
                >
                  <Badge
                    size="xs"
                    tone="neutral"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {p.key}
                  </Badge>
                  <span style={{ flex: 1 }}>{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {taskResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--fg-subtle)",
                  letterSpacing: 0.4,
                  borderTop:
                    projectResults.length > 0
                      ? "1px solid var(--border)"
                      : "none",
                  marginTop: projectResults.length > 0 ? 2 : 0,
                }}
              >
                {lang === "tr" ? "GÖREVLER" : "TASKS"}
              </div>
              {taskResults.map((task, i) => {
                const flatIdx = projectResults.length + i
                return (
                  <button
                    key={`task-${task.id}`}
                    type="button"
                    onMouseEnter={() => setHighlight(flatIdx)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      navigate(
                        `/projects/${task.projectId}/tasks/${task.id}`
                      )
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: 13,
                      background:
                        highlight === flatIdx
                          ? "var(--surface-2)"
                          : "transparent",
                      boxShadow:
                        highlight === flatIdx
                          ? "inset 0 0 0 1px var(--border)"
                          : "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg)",
                      textAlign: "left",
                      borderRadius: 3,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--fg-muted)",
                        minWidth: 60,
                      }}
                    >
                      {task.key}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.title}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {!hasResults && (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 12,
              }}
            >
              {lang === "tr" ? "Sonuç bulunamadı" : "No results found"}
            </div>
          )}

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              router.push(`/search?q=${encodeURIComponent(query)}`)
              setOpen(false)
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              borderTop: "1px solid var(--border)",
              marginTop: 4,
            }}
          >
            {lang === "tr" ? "Tümünü gör →" : "See all →"}
          </button>
        </Card>
      )}
    </div>
  )
}
