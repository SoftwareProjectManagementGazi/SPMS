// AIApplyConfirmation — Jira "Associate statuses" eşleme adımı testleri.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { AIApplyConfirmation } from "./ai-apply-confirmation"

const REMOVED = [
  { id: 1, name: "Eski Yapılacak", category: "todo" },
  { id: 2, name: "Eski Bitti", category: "done" },
]
const NEW_COLS = [
  { id: "n1", label: "Hazır", isInitial: true },
  { id: "n2", label: "Devam" },
  { id: "n3", label: "Tamam", isFinal: true },
]

function renderConfirm(onConfirm = vi.fn()) {
  render(
    <AIApplyConfirmation
      contextLabel="Proje X"
      variant="task_status"
      existingCount={3}
      newCount={3}
      removedColumns={REMOVED}
      newColumns={NEW_COLS}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  return onConfirm
}

describe("AIApplyConfirmation column mapping", () => {
  beforeEach(() => vi.clearAllMocks())

  it("replace modunda kaldırılan sütunlar için eşleme satırları + Backlog seçeneği render edilir", () => {
    renderConfirm()

    expect(
      screen.getByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeTruthy()
    expect(screen.getByText("Eski Yapılacak")).toBeTruthy()
    expect(screen.getByText("Eski Bitti")).toBeTruthy()

    // Akıllı varsayılanlar: todo-kategorili → initial yeni sütun; done → final.
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    expect(selects[0].value).toBe("n1")
    expect(selects[1].value).toBe("n3")

    // Backlog her satırda seçenek olarak var.
    const backlogOptions = screen.getAllByText("Backlog'a taşı (pano dışı)")
    expect(backlogOptions).toHaveLength(REMOVED.length)
  })

  it("seçimler onConfirm'e ColumnMapTarget eşlemesi olarak akar (Backlog dahil)", async () => {
    const onConfirm = renderConfirm()

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    // Eski Yapılacak → Devam; Eski Bitti → Backlog
    fireEvent.change(selects[0], { target: { value: "n2" } })
    fireEvent.change(selects[1], { target: { value: "__backlog__" } })

    fireEvent.click(screen.getByText("Onaylıyorum"))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    const [mode, mapping] = onConfirm.mock.calls[0]
    expect(mode).toBe("replace")
    expect(mapping).toEqual({
      1: { kind: "column", aiColumnId: "n2" },
      2: { kind: "backlog" },
    })
  })

  it("new_project modunda eşleme bölümü gizlenir ve mapping gönderilmez", async () => {
    const onConfirm = renderConfirm()

    fireEvent.click(
      screen.getByText("Mevcut workflow'u koru, yeni proje oluştur"),
    )
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()

    fireEvent.click(screen.getByText("Onaylıyorum"))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    const [mode, mapping] = onConfirm.mock.calls[0]
    expect(mode).toBe("new_project")
    expect(mapping).toBeUndefined()
  })

  it("kaldırılan sütun yoksa eşleme bölümü görünmez", () => {
    render(
      <AIApplyConfirmation
        contextLabel="Proje X"
        variant="task_status"
        existingCount={3}
        newCount={3}
        removedColumns={[]}
        newColumns={NEW_COLS}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()
  })
})
