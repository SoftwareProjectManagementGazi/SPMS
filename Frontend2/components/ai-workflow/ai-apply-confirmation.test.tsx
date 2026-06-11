// AIApplyConfirmation — mod seçimi + onay akışı. Eşleme adımı bu bileşenden
// çıkarıldı (paylaşılan ColumnMappingDialog'a taşındı); burada sadece mod
// kararının doğru aktığı pinlenir.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { AIApplyConfirmation } from "./ai-apply-confirmation"

function renderConfirm(onConfirm = vi.fn()) {
  render(
    <AIApplyConfirmation
      contextLabel="Proje X"
      variant="task_status"
      existingCount={3}
      newCount={4}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  return onConfirm
}

describe("AIApplyConfirmation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("iki mod kartını ve task_status için sonraki-adım kopyasını render eder", () => {
    renderConfirm()
    expect(
      screen.getByText("Mevcut görev durumlarını tamamen değiştir"),
    ).toBeTruthy()
    expect(
      screen.getByText("Mevcut workflow'u koru, yeni proje oluştur"),
    ).toBeTruthy()
    // Eşleme artık bir SONRAKİ adımda — bölüm burada render edilmez.
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()
    expect(screen.getByText(/bir sonraki adımda sorulur/)).toBeTruthy()
  })

  it("varsayılan replace modu onConfirm'e akar", async () => {
    const onConfirm = renderConfirm()
    fireEvent.click(screen.getByText("Onaylıyorum"))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledWith("replace")
  })

  it("new_project seçimi onConfirm'e akar", async () => {
    const onConfirm = renderConfirm()
    fireEvent.click(
      screen.getByText("Mevcut workflow'u koru, yeni proje oluştur"),
    )
    fireEvent.click(screen.getByText("Onaylıyorum"))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledWith("new_project")
  })

  it("Vazgeç onCancel'ı çağırır", () => {
    const onCancel = vi.fn()
    render(
      <AIApplyConfirmation
        contextLabel="P"
        variant="lifecycle"
        existingCount={1}
        newCount={2}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText("Vazgeç"))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
