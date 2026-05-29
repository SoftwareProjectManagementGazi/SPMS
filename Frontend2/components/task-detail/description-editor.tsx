"use client"

// DescriptionEditor — read-only display by default; click to enter edit
// mode; "Bitir" commits the draft via onChange.
//
// Behaviour (UAT-driven):
//   - Empty value renders a "Click to add description…" placeholder; clicking
//     it switches to edit mode with an empty draft.
//   - Non-empty value renders the description. If the stored value is HTML
//     (saved from Rich mode) it is sanitized with DOMPurify and rendered as
//     formatted rich text (`.rich-content`). If it is plain text it is rendered
//     verbatim with whiteSpace:pre-wrap (line breaks preserved). The whole panel
//     is clickable; hover/focus surfaces a subtle "edit" affordance. Clicking a
//     link inside rich content follows the link instead of entering edit mode.
//   - Edit mode shows a SegmentedControl (Plain / Rich), the editing surface,
//     and Vazgeç (Cancel) + Bitir (Done) buttons.
//
// Lossless Plain/Rich toggle (bugfix): the editor keeps TWO draft buffers so
// switching tabs never destroys formatting:
//   - `richDraft`  — canonical HTML, the source of truth for bold/headings/etc.
//   - `plainDraft` — the plain-text buffer shown in the Plain textarea.
//   - `plainDirty` — whether the user actually typed in Plain mode.
// Rich→Plain re-derives plainDraft from richDraft but KEEPS richDraft intact, so
// Rich→Plain→Rich (without a plain edit) restores the original formatting. Plain→
// Rich only overwrites richDraft when plainDirty (the user chose to rewrite as
// plain). "Bitir" commits whichever representation matches the active tab: Rich
// commits HTML; Plain commits stripped text (formatting intentionally dropped).
//
// Mode preference (Plain vs Rich) is persisted per-user in localStorage
// under `spms.description.mode`. The Rich editor is dynamically imported
// with ssr:false so SSR never pulls TipTap into the bundle.
//
// Local draft contract: while editing, the editor owns its draft buffers. The
// upstream `value` prop is only consulted when edit starts (so an external
// refetch mid-edit does not stomp the user's typing). onChange fires once on
// Bitir; Vazgeç never calls it.

import * as React from "react"
import dynamic from "next/dynamic"
import DOMPurify from "isomorphic-dompurify"
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

// Heuristic: does this string carry HTML markup? Matches `<tag …>` / `</tag>` /
// `<br/>` but NOT incidental angle brackets in prose ("a < b", "I love <3").
// A tag must open with a letter, `/`, or `!` immediately after `<`.
function looksLikeHtml(s: string): boolean {
  return /<[a-z!/][^>]*>/i.test(s)
}

// Tags/attrs the Rich editor (StarterKit + Image) can emit. Everything else —
// scripts, event handlers, style, iframes, data-* — is dropped by DOMPurify.
const RICH_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "h1", "h2", "h3", "ul", "ol", "li", "blockquote",
  "code", "pre", "a", "img", "hr", "span",
]
// `target` is intentionally omitted so links open same-tab (no reverse-tabnabbing).
const RICH_ATTR = ["href", "src", "alt", "title"]

function sanitizeRich(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TAGS,
    ALLOWED_ATTR: RICH_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

// HTML → plain text. Block boundaries become newlines so the textarea keeps a
// readable structure; all tags are then stripped via DOMPurify (ALLOWED_TAGS:[]
// also decodes entities, so the textarea shows "&" not "&amp;"). Plain input is
// returned verbatim — no trimming — so user indentation/spacing survives a
// round-trip through edit mode.
function toPlain(s: string | null | undefined): string {
  if (s == null) return ""
  const str = String(s)
  if (!looksLikeHtml(str)) return str
  const withBreaks = str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)>/gi, "\n")
  return DOMPurify.sanitize(withBreaks, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

// Plain text → minimal HTML for the Rich editor. Escapes entities first (so a
// literal "<div>" typed in Plain mode shows as text, not a parsed node), splits
// blank-line-separated blocks into <p>, and single newlines into <br>. HTML
// input is passed through untouched.
function toHtml(s: string | null | undefined): string {
  if (s == null) return ""
  const str = String(s)
  if (str.trim() === "") return ""
  if (looksLikeHtml(str)) return str
  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return str
    .split(/\n{2,}/)
    .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

interface Props {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

export function DescriptionEditor({ value, onChange, disabled }: Props) {
  const { language: lang } = useApp()
  const [editing, setEditing] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>("plain")
  const [hover, setHover] = React.useState(false)

  // Dual draft buffers (see header comment) — keep the toggle lossless.
  const [richDraft, setRichDraft] = React.useState("")
  const [plainDraft, setPlainDraft] = React.useState("")
  const plainDirty = React.useRef(false)

  // Hydrate persisted mode after mount.
  React.useEffect(() => {
    setMode(readStoredMode())
  }, [])

  // Read-mode derived values, memoized so DOMPurify doesn't re-run on every
  // hover toggle.
  const isHtml = React.useMemo(() => looksLikeHtml(value ?? ""), [value])
  const displayHtml = React.useMemo(
    () => (isHtml ? sanitizeRich(value ?? "") : ""),
    [value, isHtml],
  )
  const displayText = React.useMemo(() => toPlain(value ?? ""), [value])

  function startEdit() {
    if (disabled) return
    // Seed BOTH representations from the stored value so either tab is ready
    // immediately and a switch never re-derives from a stale buffer.
    setRichDraft(looksLikeHtml(value) ? value : toHtml(value))
    setPlainDraft(toPlain(value))
    plainDirty.current = false
    setEditing(true)
  }

  function finishEdit() {
    // Commit the representation of the tab the user is currently on:
    //   Rich  → HTML (formatting preserved)
    //   Plain → plain text (formatting intentionally dropped)
    let next = mode === "rich" ? richDraft : plainDraft
    // Normalize an "empty" editor ("<p></p>" / whitespace) to "" so a cleared
    // description persists as empty rather than as stray markup.
    if (toPlain(next).trim() === "") next = ""
    if (next !== value) onChange(next)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  // Lossless mode switch. Not memoized — it closes over the current draft
  // buffers each render, which is exactly what we want to read here.
  function switchMode(m: Mode) {
    if (m !== mode) {
      if (m === "plain") {
        // Going to plain: project the (retained) rich HTML to text.
        setPlainDraft(toPlain(richDraft))
        plainDirty.current = false
      } else if (plainDirty.current) {
        // Going to rich AND the user edited in plain → adopt the plain edits.
        setRichDraft(toHtml(plainDraft))
        plainDirty.current = false
      }
      // Going to rich WITHOUT a plain edit: keep richDraft as-is → the original
      // bold/headings/etc. are restored.
      setMode(m)
    }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MODE_KEY, m)
      }
    } catch {
      /* ignore quota / security errors */
    }
  }

  // Read-only display. Click anywhere on the panel to switch to edit mode —
  // except on a link inside rich content, which should follow the link.
  if (!editing) {
    const isEmpty = displayText.trim().length === 0
    const handleDisplayClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.("a")) return // let the link navigate; don't edit
      startEdit()
    }
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleDisplayClick}
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
        ) : isHtml ? (
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        ) : (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--fg)",
              whiteSpace: "pre-wrap",
            }}
          >
            {displayText}
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
          onChange={(v) => switchMode(v as Mode)}
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
          value={plainDraft}
          onChange={(e) => {
            setPlainDraft(e.target.value)
            plainDirty.current = true
          }}
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
        <RichEditor value={richDraft} onChange={setRichDraft} />
      )}
    </div>
  )
}
