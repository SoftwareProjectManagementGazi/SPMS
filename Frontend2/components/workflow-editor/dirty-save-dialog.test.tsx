// Unit tests for components/workflow-editor/dirty-save-dialog.tsx
// (Phase 12 Plan 12-07).
//
// 4 cases:
//   1. open=false renders nothing
//   2. open=true renders all 3 buttons (Vazgeç / Atıp Çık / Kaydet ve Çık)
//      + Turkish title + Turkish body
//   3. clicking each button fires the matching callback
//   4. saving=true disables all 3 buttons

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { DirtySaveDialog } from "./dirty-save-dialog"

describe("DirtySaveDialog", () => {
  let onCancel: ReturnType<typeof vi.fn>
  let onDiscard: ReturnType<typeof vi.fn>
  let onSaveAndLeave: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCancel = vi.fn()
    onDiscard = vi.fn()
    onSaveAndLeave = vi.fn()
  })

  it("Test 1: open=false renders nothing", () => {
    const { container } = render(
      <DirtySaveDialog
        open={false}
        onCancel={onCancel}
        onDiscard={onDiscard}
        onSaveAndLeave={onSaveAndLeave}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("Test 2: open=true renders 3 buttons + Turkish title + body", () => {
    render(
      <DirtySaveDialog
        open={true}
        onCancel={onCancel}
        onDiscard={onDiscard}
        onSaveAndLeave={onSaveAndLeave}
      />,
    )
    expect(screen.getByText("Kaydedilmemiş Değişiklikler")).toBeTruthy()
    expect(
      screen.getByText("Kaydedilmemiş değişiklikler var. Çıkılsın mı?"),
    ).toBeTruthy()
    expect(screen.getByText("Vazgeç")).toBeTruthy()
    expect(screen.getByText("Atıp Çık")).toBeTruthy()
    expect(screen.getByText("Kaydet ve Çık")).toBeTruthy()
  })

  it("Test 3: clicking each button fires the matching callback", () => {
    render(
      <DirtySaveDialog
        open={true}
        onCancel={onCancel}
        onDiscard={onDiscard}
        onSaveAndLeave={onSaveAndLeave}
      />,
    )
    fireEvent.click(screen.getByText("Vazgeç"))
    fireEvent.click(screen.getByText("Atıp Çık"))
    fireEvent.click(screen.getByText("Kaydet ve Çık"))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onSaveAndLeave).toHaveBeenCalledTimes(1)
  })

  it("Test 4: saving=true disables all 3 buttons", () => {
    render(
      <DirtySaveDialog
        open={true}
        onCancel={onCancel}
        onDiscard={onDiscard}
        onSaveAndLeave={onSaveAndLeave}
        saving={true}
      />,
    )
    const cancelBtn = screen.getByText("Vazgeç").closest("button")
    const discardBtn = screen.getByText("Atıp Çık").closest("button")
    const saveBtn = screen.getByText("Kaydet ve Çık").closest("button")
    expect(cancelBtn?.disabled).toBe(true)
    expect(discardBtn?.disabled).toBe(true)
    expect(saveBtn?.disabled).toBe(true)
  })
})
