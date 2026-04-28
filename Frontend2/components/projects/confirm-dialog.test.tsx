// Phase 14 Plan 14-01 Task 1 — ConfirmDialog tone extension tests.
//
// Verifies:
// - Default (no tone prop): no AlertTriangle/AlertCircle, confirm Button stays
//   primary — backward compat with every Phase 10/11/12 caller.
// - tone="danger": AlertTriangle title icon + danger Button.
// - tone="warning": AlertCircle title icon + primary Button (warning amber
//   reserved for AlertBanner).
// - tone="primary" (explicit): identical to default.

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConfirmDialog } from "./confirm-dialog"

// Stub Button so we can read variant via data attribute. We render the actual
// component but the variant is captured via the surrounding behavior — the
// real Button forwards variant via inline style, so we assert by checking the
// destructive button class / inline style.
//
// For a clean assertion of which variant was selected, mock the primitives
// barrel to expose a Button that records its variant prop into a data attribute.
vi.mock("@/components/primitives", () => ({
  Button: ({ variant, children, onClick }: any) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}))

const noop = () => undefined

describe("ConfirmDialog tone prop (Plan 14-01 Task 1)", () => {
  it("default tone — no title icon, confirm Button primary (backward compat)", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Sıfırla"
        body="Bu işlem geri alınamaz."
        onConfirm={noop}
        onCancel={noop}
      />,
    )
    // Title text rendered
    expect(screen.getByText("Sıfırla")).toBeInTheDocument()
    // Confirm button is variant="primary"
    const confirmBtn = screen.getByText("Onayla")
    expect(confirmBtn.getAttribute("data-variant")).toBe("primary")
    // No AlertTriangle / AlertCircle icon rendered (default tone)
    // lucide-react v1.8.0 emits class `lucide-triangle-alert` / `lucide-circle-alert`
    // (aliased icons land on the kebab-cased pascal-cased name).
    expect(document.querySelector("svg.lucide-triangle-alert")).toBeNull()
    expect(document.querySelector("svg.lucide-circle-alert")).toBeNull()
  })

  it("tone=danger renders AlertTriangle icon + danger confirm Button", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Sil"
        body="Geri alınamaz."
        tone="danger"
        onConfirm={noop}
        onCancel={noop}
      />,
    )
    // Confirm Button switched to danger
    const confirmBtn = screen.getByText("Onayla")
    expect(confirmBtn.getAttribute("data-variant")).toBe("danger")
    // AlertTriangle = TriangleAlert in lucide-react v1.8.0; class is lucide-triangle-alert
    expect(document.querySelector("svg.lucide-triangle-alert")).not.toBeNull()
    // AlertCircle should not be present
    expect(document.querySelector("svg.lucide-circle-alert")).toBeNull()
  })

  it("tone=warning renders AlertCircle icon + primary Button (warning is for banner only)", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Dikkat"
        body="Bu değişiklik etki alanını genişletir."
        tone="warning"
        onConfirm={noop}
        onCancel={noop}
      />,
    )
    const confirmBtn = screen.getByText("Onayla")
    // Warning amber NOT applied to button — Button stays primary per UI-SPEC
    expect(confirmBtn.getAttribute("data-variant")).toBe("primary")
    expect(document.querySelector("svg.lucide-circle-alert")).not.toBeNull()
    expect(document.querySelector("svg.lucide-triangle-alert")).toBeNull()
  })

  it("tone='primary' explicit matches default behavior byte-for-byte", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Bir şey onayla"
        body="..."
        tone="primary"
        onConfirm={noop}
        onCancel={noop}
      />,
    )
    // Title rendered + confirm button variant primary + no decorative icon
    expect(screen.getByText("Bir şey onayla")).toBeInTheDocument()
    const confirmBtn = screen.getByText("Onayla")
    expect(confirmBtn.getAttribute("data-variant")).toBe("primary")
    expect(document.querySelector("svg.lucide-triangle-alert")).toBeNull()
    expect(document.querySelector("svg.lucide-circle-alert")).toBeNull()
  })

  it("Plan 14-18 UAT Test 22 side-finding — dialog renders via React portal so ancestor opacity does not cascade", () => {
    // Simulate the bug scenario: an archived row wrapper applies opacity 0.6,
    // and ConfirmDialog used to render INSIDE the row tree (a regular React
    // child) so the row's opacity cascaded into the dialog. The fix is to
    // mount the dialog into document.body via a portal — escaping the row's
    // style ancestry entirely.
    render(
      <div data-testid="dim-parent" style={{ opacity: 0.3 }}>
        <ConfirmDialog
          open={true}
          title="Sil"
          body="Bu işlem geri alınamaz."
          tone="danger"
          onConfirm={noop}
          onCancel={noop}
        />
      </div>,
    )

    // The dialog's outer scrim/container element MUST NOT be a descendant of
    // the dim-parent — i.e., it must be portal'd to document.body. Walk up
    // from the dialog title's text node and assert NO ancestor is the
    // dim-parent.
    const titleNode = screen.getByText("Sil")
    let cur: HTMLElement | null = titleNode
    let foundDimAncestor = false
    while (cur && cur.parentElement) {
      if (cur.getAttribute && cur.getAttribute("data-testid") === "dim-parent") {
        foundDimAncestor = true
        break
      }
      cur = cur.parentElement
    }
    expect(foundDimAncestor).toBe(false)
  })

  it("does not render anything when open=false", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="..."
        body="..."
        onConfirm={noop}
        onCancel={noop}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
