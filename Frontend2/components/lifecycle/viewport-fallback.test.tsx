// Unit tests for components/lifecycle/viewport-fallback.tsx
// (Phase 12 Plan 12-07).
//
// 3 cases:
//   1. renders Turkish fallback heading copy at viewport <1024
//   2. renders English fallback heading copy when language === 'en'
//   3. clicking 'Projeye Dön' calls router.push('/projects/' + projectId)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}))

let currentLanguage: "tr" | "en" = "tr"
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: currentLanguage }),
}))

import { ViewportFallback } from "./viewport-fallback"

describe("ViewportFallback", () => {
  beforeEach(() => {
    mockPush.mockClear()
    currentLanguage = "tr"
  })

  it("Test 1: renders Turkish fallback heading 'Workflow editörü 1024px+ ekran gerektirir.'", () => {
    render(<ViewportFallback projectId={42} />)
    expect(
      screen.getByText("Workflow editörü 1024px+ ekran gerektirir."),
    ).toBeTruthy()
    expect(screen.getByText("Projeye Dön")).toBeTruthy()
  })

  it("Test 2: renders English fallback heading when language === 'en'", () => {
    currentLanguage = "en"
    render(<ViewportFallback projectId={42} />)
    expect(
      screen.getByText("Workflow editor requires a 1024px+ screen."),
    ).toBeTruthy()
    expect(screen.getByText("Back to Project")).toBeTruthy()
  })

  it("Test 3: clicking 'Projeye Dön' calls router.push('/projects/' + projectId)", () => {
    render(<ViewportFallback projectId={42} />)
    fireEvent.click(screen.getByText("Projeye Dön"))
    expect(mockPush).toHaveBeenCalledWith("/projects/42")
  })
})
