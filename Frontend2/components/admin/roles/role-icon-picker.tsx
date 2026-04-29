"use client"

// Phase 15 Plan 15-11 — RoleIconPicker (D-2.8).
//
// 4×2 grid of 8 lucide-react icons. The Admin picks ONE icon per role; the
// chosen `key` is persisted to backend `roles.icon_key` (Migration 007 column).
//
// 8 icons (verbatim per CONTEXT D-2.8 / 15-PATTERNS §16):
//   User / Briefcase / ShieldCheck / Star / Eye / Settings / Globe / Award.
//
// A11y:
//   - role="radiogroup" + aria-label on the container.
//   - role="radio" + aria-checked + aria-label on each button (the icon
//     itself is aria-hidden so screen readers announce only the label).
//
// Why a radiogroup over a select: the visual real estate (8 small chips) is
// part of the form's UX — admins want to SEE the icons rather than read
// them in a dropdown. Keyboard accessibility is preserved via Tab+Space.

import * as React from "react"
import {
  Award,
  Briefcase,
  Eye,
  Globe,
  Settings,
  ShieldCheck,
  Star,
  User as UserIcon,
} from "lucide-react"

const ICONS = [
  { key: "user", Icon: UserIcon, label: "User" },
  { key: "briefcase", Icon: Briefcase, label: "Briefcase" },
  { key: "shield-check", Icon: ShieldCheck, label: "Shield" },
  { key: "star", Icon: Star, label: "Star" },
  { key: "eye", Icon: Eye, label: "Eye" },
  { key: "settings", Icon: Settings, label: "Settings" },
  { key: "globe", Icon: Globe, label: "Globe" },
  { key: "award", Icon: Award, label: "Award" },
] as const

export type RoleIconKey = (typeof ICONS)[number]["key"]

interface RoleIconPickerProps {
  value: string | null
  onChange: (key: string) => void
}

export function RoleIconPicker({ value, onChange }: RoleIconPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="İkon seç"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 36px)",
        gap: 8,
        marginTop: 4,
      }}
    >
      {ICONS.map(({ key, Icon, label }) => {
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(key)}
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface)",
              boxShadow: selected
                ? "inset 0 0 0 2px var(--primary)"
                : undefined,
              color: "var(--fg)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.12s, box-shadow 0.12s",
            }}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
