"use client"

// StatusDot — colored circle using --status-* tokens (todo / progress / review
// / done / blocked).
//
// Two modes:
//   * Read-only (default, no `onChange` prop): renders a 8px filled dot. Mirrors
//     the prototype StatusDot (primitives.jsx lines 210-213) — used inline
//     anywhere a static status indicator is needed.
//   * Interactive (`onChange` prop set): renders the prototype MTStatusDot
//     (my-tasks-parts.jsx lines 73-128) — a clickable circle that opens a
//     popover with the 5 canonical statuses. Done shows a filled disc with a
//     white check; progress shows an inner filled dot; blocked shows a
//     horizontal bar; todo / review show only the ring outline.
//
// Click on the popover items calls `onChange(newStatus)`; click outside or on
// the same option closes it. Click events stop propagation so a wrapping row
// `onClick` handler (e.g. TaskRow → navigate) does not fire when the user
// only meant to change the status.

import * as React from "react"

import { useApp } from "@/context/app-context"

export type StatusValue = "todo" | "progress" | "review" | "done" | "blocked"

export interface StatusDotProps {
  status: StatusValue
  size?: number
  className?: string
  style?: React.CSSProperties
  /** Enables interactive (button + popover) mode when set. */
  onChange?: (next: StatusValue) => void
  title?: string
}

interface StatusMeta {
  tr: string
  en: string
  /** Only used so we can map status → CSS var without inlining the string. */
  token: string
}

const STATUS_META: Record<StatusValue, StatusMeta> = {
  todo: { tr: "Yapılacak", en: "To do", token: "todo" },
  progress: { tr: "Devam ediyor", en: "In progress", token: "progress" },
  review: { tr: "İncelemede", en: "Review", token: "review" },
  done: { tr: "Tamamlandı", en: "Done", token: "done" },
  blocked: { tr: "Engellendi", en: "Blocked", token: "blocked" },
}

const STATUS_ORDER: StatusValue[] = [
  "todo",
  "progress",
  "review",
  "done",
  "blocked",
]

// Coerce arbitrary input into one of the 5 canonical tokens. Mirrors the
// resolveStatus logic in TaskRow so callers can pass raw backend strings
// (UPPERCASE, "in_progress", "completed", ...) without a metadata lookup
// crash on an unknown value.
function coerce(raw: StatusValue | string | null | undefined): StatusValue {
  const s = String(raw ?? "").toLowerCase()
  if (s === "progress" || s === "in_progress" || s === "doing") return "progress"
  if (s === "review" || s === "in_review") return "review"
  if (s === "done" || s === "completed" || s === "closed") return "done"
  if (s === "blocked") return "blocked"
  return "todo"
}

export function StatusDot({
  status,
  size = 8,
  className,
  style,
  onChange,
  title,
}: StatusDotProps) {
  const safe = coerce(status)
  const color = `var(--status-${STATUS_META[safe].token})`

  // Read-only mode: pure dot, no interactive shell. Avoids context lookups
  // when the caller just wants a static indicator.
  if (!onChange) {
    return (
      <span
        className={className}
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          display: "inline-block",
          ...style,
        }}
      />
    )
  }

  return <InteractiveStatusDot
    status={safe}
    size={size}
    className={className}
    style={style}
    onChange={onChange}
    title={title}
  />
}

interface InteractiveProps {
  status: StatusValue
  size: number
  className?: string
  style?: React.CSSProperties
  onChange: (next: StatusValue) => void
  title?: string
}

function InteractiveStatusDot({
  status,
  size,
  className,
  style,
  onChange,
  title,
}: InteractiveProps) {
  const { language } = useApp()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    function off(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", off)
    return () => document.removeEventListener("mousedown", off)
  }, [open])

  const meta = STATUS_META[status]
  const color = `var(--status-${meta.token})`
  const isDone = status === "done"
  const localizedLabel = language === "tr" ? meta.tr : meta.en
  const buttonTitle = title ?? localizedLabel

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <button
        type="button"
        title={buttonTitle}
        aria-label={buttonTitle}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isDone
            ? `inset 0 0 0 ${size / 2}px ${color}`
            : `inset 0 0 0 1.75px ${color}`,
          background: isDone ? color : "transparent",
          flexShrink: 0,
          cursor: "pointer",
          padding: 0,
          border: "none",
          transition: "box-shadow 0.15s ease, background 0.15s ease",
        }}
      >
        {isDone && (
          <svg
            width={size * 0.6}
            height={size * 0.6}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {status === "progress" && (
          <span
            aria-hidden
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: "50%",
              background: color,
            }}
          />
        )}
        {status === "blocked" && (
          <span
            aria-hidden
            style={{
              width: size * 0.5,
              height: 2,
              background: color,
            }}
          />
        )}
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: size + 6,
            left: 0,
            background: "var(--surface)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border)",
            padding: 4,
            zIndex: 60,
            minWidth: 150,
          }}
        >
          {STATUS_ORDER.map((s) => {
            const m = STATUS_META[s]
            const lbl = language === "tr" ? m.tr : m.en
            const active = s === status
            return (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(s)
                  setOpen(false)
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  width: "100%",
                  borderRadius: 4,
                  fontSize: 12.5,
                  textAlign: "left",
                  background: active ? "var(--surface-2)" : "transparent",
                  color: "var(--fg)",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    "var(--surface-2)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    active ? "var(--surface-2)" : "transparent"
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: `var(--status-${m.token})`,
                    flexShrink: 0,
                  }}
                />
                {lbl}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
