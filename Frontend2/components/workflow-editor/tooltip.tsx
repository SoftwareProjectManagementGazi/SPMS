"use client"

// Tooltip — light hover/focus tooltip wrapper (~30 LOC).
//
// Phase 12 NEW-primitive-extension per UI-SPEC table line 87. v1: no portal,
// no flip-handling — just a simple absolute-positioned bubble above the
// trigger. Plan 12-08 may extend with portal + collision detection.

import * as React from "react"

interface Props {
  text: React.ReactNode
  children: React.ReactElement
  /** Open delay in ms; default 400 per UI-SPEC. */
  delay?: number
}

export function Tooltip({ text, children, delay = 400 }: Props) {
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }, [delay])

  const handleLeave = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }, [])

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <span
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-md, 0 4px 14px rgba(0,0,0,0.15))",
            padding: "6px 10px",
            maxWidth: 240,
            fontSize: 11.5,
            lineHeight: 1.4,
            borderRadius: "var(--radius-sm)",
            color: "var(--fg)",
            pointerEvents: "none",
            whiteSpace: "normal",
            zIndex: 1000,
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  )
}
