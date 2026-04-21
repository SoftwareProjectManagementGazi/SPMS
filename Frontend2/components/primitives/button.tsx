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
}

const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "var(--primary-fg)",
    boxShadow:
      "0 2px 4px oklch(0.60 0.17 40 / 0.24), 0 1px 2px oklch(0 0 0 / 0.08), var(--inset-primary-top), var(--inset-primary-bottom)",
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
    color: "#fff",
    boxShadow:
      "0 2px 4px oklch(0.58 0.22 25 / 0.26), var(--inset-top), var(--inset-primary-bottom)",
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
}: ButtonProps) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={className}
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
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "translateY(0.5px)"
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
