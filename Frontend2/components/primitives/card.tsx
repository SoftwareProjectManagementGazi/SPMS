"use client"

// Card: surface with shadow + inset-card depth; optional interactive hover lift
// Ported from New_Frontend/src/primitives.jsx (lines 121-142) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  children: React.ReactNode
  interactive?: boolean
  padding?: number
  className?: string
  style?: React.CSSProperties
}

export function Card({
  children,
  interactive,
  padding = 16,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={className}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow), var(--inset-card)",
        padding,
        transition: "box-shadow 0.12s ease, transform 0.12s ease",
        ...(interactive ? { cursor: "pointer" } : {}),
        ...style,
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow-md), var(--inset-card)"
              e.currentTarget.style.transform = "translateY(-1px)"
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow), var(--inset-card)"
              e.currentTarget.style.transform = "translateY(0)"
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
