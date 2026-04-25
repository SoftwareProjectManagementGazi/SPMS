"use client"

// Button: 5 variants (primary/secondary/ghost/subtle/danger) + 5 sizes (xs/sm/md/lg/icon)
// Ported from New_Frontend/src/primitives.jsx (lines 73-118) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// Per CONVERSION RULE 7-8: inset shadow tokens and multi-value box-shadows stay as
// inline style={} -- not Tailwind arbitrary values.

import * as React from "react"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "subtle"
  | "danger"

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon"

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  title?: string
  active?: boolean
  className?: string
  style?: React.CSSProperties
  // Icon-only buttons MUST set aria-label for screen-reader users (WCAG 2.1 4.1.2).
  // title is a tooltip, NOT a label substitute. Forwarded to the underlying <button>.
  "aria-label"?: string
}

const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "var(--primary-fg)",
    boxShadow:
      "0 2px 4px color-mix(in oklch, var(--primary) 24%, transparent), 0 1px 2px oklch(0 0 0 / 0.08), var(--inset-primary-top), var(--inset-primary-bottom)",
  },
  secondary: {
    background: "var(--surface)",
    color: "var(--fg)",
    boxShadow:
      "0 1px 2px oklch(0 0 0 / 0.05), var(--inset-top), var(--inset-bottom), inset 0 0 0 1px var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--fg)",
    boxShadow: "none",
  },
  subtle: {
    background: "var(--surface-2)",
    color: "var(--fg)",
    boxShadow: "none",
  },
  danger: {
    background: "var(--priority-critical)",
    color: "var(--primary-fg)",
    boxShadow:
      "0 2px 4px color-mix(in oklch, var(--priority-critical) 26%, transparent), var(--inset-top), var(--inset-primary-bottom)",
  },
}

const SIZES: Record<ButtonSize, React.CSSProperties> = {
  xs: { height: 24, padding: "0 8px", fontSize: 12, gap: 4 },
  sm: { height: 28, padding: "0 10px", fontSize: 12.5, gap: 6 },
  md: { height: 32, padding: "0 12px", fontSize: 13, gap: 6 },
  lg: { height: 40, padding: "0 16px", fontSize: 14, gap: 8 },
  icon: { height: 28, width: 28, padding: 0, fontSize: 13, gap: 0 },
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  disabled,
  type = "button",
  title,
  active,
  className,
  style,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  // UI-sweep: press feedback moved from imperative onMouseDown/Up/Leave handlers
  // to a CSS .btn-press class so keyboard space/enter activation also fires the
  // press, and prefers-reduced-motion is honored (globals.css).
  const pressClass = disabled ? "" : "btn-press"
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={[pressClass, className].filter(Boolean).join(" ") || undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        fontWeight: 500,
        transition:
          "transform 0.08s ease, background 0.1s ease, box-shadow 0.1s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...v,
        ...s,
        ...(active
          ? { background: "var(--accent)", color: "var(--accent-fg)" }
          : {}),
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
