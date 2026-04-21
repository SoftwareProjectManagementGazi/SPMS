"use client"

// Input: container with optional icon slot, native input, and optional Kbd hint
// Ported from New_Frontend/src/primitives.jsx (lines 216-233) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// The container uses inset 0 0 0 1px var(--border) as the border shadow per prototype.

import * as React from "react"
import { Kbd } from "./kbd"

export type InputSize = "sm" | "md" | "lg"

export interface InputProps {
  icon?: React.ReactNode
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  kbdHint?: string
  size?: InputSize
  type?: string
  className?: string
  style?: React.CSSProperties
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
  autoComplete?: string
}

const HEIGHTS: Record<InputSize, number> = {
  sm: 28,
  md: 32,
  lg: 38,
}

export function Input({
  icon,
  placeholder,
  value,
  onChange,
  kbdHint,
  size = "md",
  type = "text",
  className,
  style,
  required,
  disabled,
  name,
  id,
  autoComplete,
}: InputProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--surface)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "inset 0 0 0 1px var(--border)",
        height: HEIGHTS[size],
        padding: "0 8px",
        gap: 6,
        transition: "box-shadow 0.12s",
        ...style,
      }}
    >
      {icon && (
        <span
          style={{
            color: "var(--fg-subtle)",
            display: "inline-flex",
          }}
        >
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        name={name}
        id={id}
        autoComplete={autoComplete}
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
      {kbdHint && <Kbd>{kbdHint}</Kbd>}
    </div>
  )
}
