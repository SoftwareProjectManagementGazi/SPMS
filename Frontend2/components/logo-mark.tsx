import * as React from "react"

interface LogoMarkProps {
  size?: number
}

export function LogoMark({ size = 22 }: LogoMarkProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-sm)",
        background: "var(--primary)",
        color: "var(--primary-fg)",
        fontWeight: 700,
        fontSize: size * 0.55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "var(--font-sans)",
      }}
    >
      P
    </div>
  )
}
