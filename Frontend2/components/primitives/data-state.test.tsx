// Phase 13 Plan 13-01 Task 2 — DataState 3-state primitive tests.
//
// Mocks @/context/app-context so jsdom can render without a Provider tree.
// Verifies render priority error > loading > empty > children (UI-SPEC §F.1).

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { DataState } from "./data-state"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

describe("DataState", () => {
  it("Test 17: renders the explicit loadingFallback when loading=true", () => {
    render(
      <DataState loading={true} loadingFallback={<div>Custom loader</div>}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText("Custom loader")).toBeInTheDocument()
    expect(screen.queryByText("Children")).not.toBeInTheDocument()
  })

  it("Test 18: renders default loading copy when no loadingFallback supplied", () => {
    render(
      <DataState loading={true}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText(/Yükleniyor/i)).toBeInTheDocument()
    expect(screen.queryByText("Children")).not.toBeInTheDocument()
  })

  it("Test 19: renders the default error AlertBanner with retry button when error truthy + onRetry set", () => {
    const handleRetry = vi.fn()
    render(
      <DataState error={new Error("boom")} onRetry={handleRetry}>
        <div>Children</div>
      </DataState>,
    )
    // Default banner copy
    expect(screen.getByText(/Veri alınamadı/i)).toBeInTheDocument()
    // Retry button rendered with the TR label
    const retryButton = screen.getByRole("button", { name: /Tekrar dene/i })
    expect(retryButton).toBeInTheDocument()
    retryButton.click()
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it("Test 19b: renders an explicit errorFallback when supplied", () => {
    render(
      <DataState
        error={new Error("boom")}
        errorFallback={<div>Custom error</div>}
      >
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText("Custom error")).toBeInTheDocument()
  })

  it("Test 20: renders emptyFallback when empty=true and no children dominate", () => {
    render(
      <DataState empty={true} emptyFallback={<div>Nothing here</div>}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
    expect(screen.queryByText("Children")).not.toBeInTheDocument()
  })

  it("Test 20b: renders default empty copy when no emptyFallback supplied", () => {
    render(
      <DataState empty={true}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText(/Veri yok/i)).toBeInTheDocument()
  })

  it("Test 21: renders children when all flags are false", () => {
    render(
      <DataState>
        <div>Children content</div>
      </DataState>,
    )
    expect(screen.getByText("Children content")).toBeInTheDocument()
  })

  it("Test 22: priority — error > loading > empty > children", () => {
    // error + loading both true → renders error first
    const { rerender } = render(
      <DataState
        error={new Error("e")}
        loading={true}
        empty={true}
      >
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText(/Veri alınamadı/i)).toBeInTheDocument()
    expect(screen.queryByText(/Yükleniyor/i)).not.toBeInTheDocument()

    // loading + empty (no error) → renders loading next
    rerender(
      <DataState loading={true} empty={true}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText(/Yükleniyor/i)).toBeInTheDocument()
    expect(screen.queryByText(/Veri yok/i)).not.toBeInTheDocument()

    // empty only → empty wins over children
    rerender(
      <DataState empty={true}>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText(/Veri yok/i)).toBeInTheDocument()
    expect(screen.queryByText("Children")).not.toBeInTheDocument()

    // none → children
    rerender(
      <DataState>
        <div>Children</div>
      </DataState>,
    )
    expect(screen.getByText("Children")).toBeInTheDocument()
  })
})
