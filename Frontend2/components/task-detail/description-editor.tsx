"use client"

// DescriptionEditor — read-only display by default; click to enter edit
// mode; "Bitir" commits the draft via onChange.
//
// Behaviour (UAT-driven):
//   - Empty value renders a "Click to add description…" placeholder; clicking
//     it switches to edit mode with an empty draft.
//   - Non-empty value renders the description as plain text (HTML stripped
//     for XSS safety, line breaks preserved). The whole panel is clickable;
//     hover/focus surfaces a subtle "edit" affordance.
//   - Edit mode shows a SegmentedControl (Plain / Rich), the editing surface,
//     and Vazgeç (Cancel) + Bitir (Done) buttons. Bitir fires onChange with
//     the local draft; Vazgeç discards.
//   - Plain textarea minHeight: 240 (~ doubled from the previous 120) so
//     the editing affordance feels generous, addressing the "width too
//     small" UAT note. Width still flows from the parent Card (full main
//     column on >1024px).
//
// Mode preference (Plain vs Rich) is persisted per-user in localStorage
// under `spms.description.mode`. The Rich editor is dynamically imported
// with ssr:false so SSR never pulls TipTap into the bundle.
//
// Local draft contract: while editing, the editor owns a private `draft`
// string. The upstream `value` prop is only consulted at the moment edit
// starts (so an external refetch mid-edit does not stomp the user's typing).
// onChange fires once on Bitir; Vazgeç never calls it.

import * as React from "react"
import dynamic from "next/dynamic"
import { Pencil } from "lucide-react"

import { Button, SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"

// ssr:false keeps TipTap out of the SSR render path entirely.
const RichEditor = dynamic(() => import("./description-editor-rich"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="loading rich editor"
      style={{
        height: 240,
        background: "var(--surface-2)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    />
  ),
})

const MODE_KEY = "spms.description.mode"
type Mode = "plain" | "rich"

function readStoredMode(): Mode {
  if (typeof window === "undefined") return "plain"
  try {
    const v = window.localStorage.getItem(MODE_KEY)
    return v === "rich" || v === "plain" ? v : "plain"
  } catch {
    return "plain"
  }
}

interface Props {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

// Render-friendly conversion: strip tags so HTML coming from the rich
// editor doesn't display as raw markup in read mode. Mentions and link
// markup degrade to plain text. whiteSpace:pre-wrap on the consumer
// preserves any newlines.
function stripHtml(s: string | null | undefined): string {
  if (s == null) return ""
  return String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
}

export function DescriptionEditor({ value, onChange, disabled }: Props) {
  const { language: lang } = useApp()
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const [mode, setMode] = React.useState<Mode>("plain")
  const [hover, setHover] = React.useState(false)

  // Hydrate persisted mode after mount.
  React.useEffect(() => {
    setMode(readStoredMode())
  }, [])

  // When edit starts, sync draft from the upstream value. Mid-edit value
  // changes (e.g. another tab refetches) are intentionally ignored to
  // protect typing in progress.
  function startEdit() {
    if (disabled) return
    setDraft(value)
    setEditing(true)
  }

  function finishEdit() {
    if (draft !== value) onChange(draft)
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(value)
    setEditing(false)
  }

  const setAndPersist = React.useCallback((m: Mode) => {
    setMode(m)
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MODE_KEY, m)
      }
    } catch {
      /* ignore quota / security errors */
    }
  }, [])

  // Read-only display. Click anywhere on the panel to switch to edit mode.
  if (!editing) {
    const text = stripHtml(value)
    const isEmpty = text.length === 0
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={startEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            startEdit()
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          minHeight: 80,
          padding: "10px 12px",
          background: hover ? "var(--surface-2)" : "transparent",
          borderRadius: "var(--radius-sm)",
          cursor: disabled ? "default" : "pointer",
          transition: "background 0.15s ease",
          position: "relative",
        }}
      >
        {isEmpty ? (
          <div
            style={{
              color: "var(--fg-subtle)",
              fontStyle: "italic",
              fontSize: 13,
            }}
          >
            {lang === "tr"
              ? "Açıklama eklemek için tıklayın…"
              : "Click to add a description…"}
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--fg)",
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        )}
        {!disabled && hover && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 11,
              color: "var(--fg-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "var(--surface)",
              padding: "2px 8px",
              borderRadius: 99,
              boxShadow: "inset 0 0 0 1px var(--border)",
            }}
          >
            <Pencil size={11} />
            {lang === "tr" ? "Düzenle" : "Edit"}
          </div>
        )}
      </div>
    )
  }

  // Edit mode.
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <SegmentedControl
          size="xs"
          options={[
            { id: "plain", label: lang === "tr" ? "Düz" : "Plain" },
            { id: "rich", label: lang === "tr" ? "Zengin" : "Rich" },
          ]}
          value={mode}
          onChange={(v) => setAndPersist(v as Mode)}
        />
        <div style={{ flex: 1 }} />
        <Button size="xs" variant="ghost" onClick={cancelEdit}>
          {lang === "tr" ? "Vazgeç" : "Cancel"}
        </Button>
        <Button
          size="xs"
          variant="primary"
          onClick={finishEdit}
          disabled={disabled}
        >
          {lang === "tr" ? "Bitir" : "Done"}
        </Button>
      </div>
      {mode === "plain" ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          autoFocus
          rows={10}
          placeholder={
            lang === "tr" ? "Görev açıklaması…" : "Task description…"
          }
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.6,
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            color: "var(--fg)",
            border: "none",
            // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
            resize: "vertical",
            minHeight: 240,
            font: "inherit",
            display: "block",
          }}
        />
      ) : (
        <RichEditor value={draft} onChange={setDraft} />
      )}
    </div>
  )
}
