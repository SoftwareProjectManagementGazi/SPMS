// Phase 14 Plan 14-18 (Cluster F UAT Test 31 side-finding) — methodology
// chart subtitle tests.
//
// The original Plan 14-08 implementation rendered just the "Metodoloji
// Kullanımı" title. UAT Test 31 caught that the unit was ambiguous —
// admins didn't know if the bars represented project counts or task
// counts or seat licenses. Plan 14-18 adds a localized subtitle clarifying
// the unit (project count, archived projects excluded).

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { MethodologyBars } from "./methodology-bars"

describe("MethodologyBars subtitle (Plan 14-18 UAT Test 31)", () => {
  it("Test 1 — renders a localized subtitle disambiguating the unit (TR: 'Aktif proje sayısı')", () => {
    render(
      <MethodologyBars distribution={{ scrum: 5, kanban: 3, waterfall: 1 }} />,
    )
    // Subtitle should appear below the title; localized TR copy.
    // Match the leading phrase to be tolerant of trailing parenthetical text.
    expect(screen.getByText(/Aktif proje sayısı/i)).toBeInTheDocument()
  })
})
