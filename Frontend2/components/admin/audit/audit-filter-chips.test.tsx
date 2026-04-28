// Phase 14 Plan 14-18 (Cluster F, UAT Test 27 side-finding) — Aktör chip
// name resolution tests.
//
// The original Plan 14-07 implementation took an `actorLabel?: string`
// prop; if absent, it rendered `String(filter.actor_id)` — i.e. the raw
// numeric id, "Aktör: 2". The audit page (/admin/audit/page.tsx) didn't
// pass any actorLabel, so the chip ALWAYS showed the raw id when the user
// filtered by actor. Test 27 caught this — admins want the actor's
// full_name (or email fallback).
//
// Plan 14-18 fix: chip accepts a `usersById?: Record<number, User>` map
// and resolves actor_id → user.full_name (or user.email when full_name
// missing) → "Bilinmeyen kullanıcı (id N)" fallback when the id isn't in
// the map. The audit page wires this map via the new useUsersLookup()
// hook (Plan 14-18) which fetches /admin/users (limited list) and reduces
// to a {[id]: user} map.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { AuditFilterChips } from "./audit-filter-chips"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

const noop = () => undefined

describe("AuditFilterChips actor name resolution (Plan 14-18 UAT Test 27)", () => {
  it("Test 1 — usersById has actor → chip shows full_name", () => {
    const filter: AdminAuditFilter = { actor_id: 2 }
    const usersById = {
      2: {
        id: 2,
        full_name: "Yusuf Bayrakcı",
        email: "[email protected]",
      },
    }
    render(
      <AuditFilterChips
        filter={filter}
        usersById={usersById}
        onClear={noop}
      />,
    )
    expect(screen.getByText(/Aktör:\s*Yusuf Bayrakcı/)).toBeInTheDocument()
  })

  it("Test 2 — usersById missing full_name → falls back to email", () => {
    const filter: AdminAuditFilter = { actor_id: 5 }
    const usersById = {
      5: {
        id: 5,
        full_name: "",
        email: "[email protected]",
      },
    }
    render(
      <AuditFilterChips
        filter={filter}
        usersById={usersById}
        onClear={noop}
      />,
    )
    expect(screen.getByText(/Aktör:\s*[email protected]/)).toBeInTheDocument()
  })

  it("Test 3 — actor_id not in map → falls back to localized 'unknown user' label", () => {
    const filter: AdminAuditFilter = { actor_id: 999 }
    render(
      <AuditFilterChips filter={filter} usersById={{}} onClear={noop} />,
    )
    // Localized fallback contains the id so admins can still trace.
    expect(screen.getByText(/Aktör:.*999/)).toBeInTheDocument()
    // Critical: the rendered text must NOT be "Aktör: 999" alone — it must
    // include the localized "Bilinmeyen kullanıcı" prefix or English
    // equivalent so it is visibly DIFFERENT from a raw-id render.
    expect(
      screen.queryByText(/^Aktör:\s*999$/),
    ).toBeNull()
  })

  it("Test 4 — usersById omitted → falls back to localized 'unknown user' label (no raw id)", () => {
    const filter: AdminAuditFilter = { actor_id: 7 }
    render(<AuditFilterChips filter={filter} onClear={noop} />)
    expect(screen.getByText(/Aktör:.*7/)).toBeInTheDocument()
    expect(screen.queryByText(/^Aktör:\s*7$/)).toBeNull()
  })
})
