// ColumnMappingDialog — paylaşılan Jira-style eşleme diyaloğu testleri.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import {
  ColumnMappingDialog,
  BACKLOG_TARGET,
  defaultMappingTarget,
} from "./column-mapping-dialog"

const REMOVED = [
  { id: 1, name: "Eski Yapılacak", category: "todo" },
  { id: 2, name: "Eski Bitti", category: "done" },
]
const TARGETS = [
  { value: "10", label: "Hazır", isInitial: true },
  { value: "11", label: "Devam" },
  { value: "12", label: "Tamam", isFinal: true },
]

describe("ColumnMappingDialog", () => {
  beforeEach(() => vi.clearAllMocks())

  it("open=false iken render etmez", () => {
    render(
      <ColumnMappingDialog
        open={false}
        removedColumns={REMOVED}
        targets={TARGETS}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("her kaldırılan sütun için satır + Backlog seçeneği render eder; akıllı varsayılanlar doğru", () => {
    render(
      <ColumnMappingDialog
        open
        removedColumns={REMOVED}
        targets={TARGETS}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText("Eski Yapılacak")).toBeTruthy()
    expect(screen.getByText("Eski Bitti")).toBeTruthy()

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    // todo-kategorili → initial hedef (10); done-kategorili → final hedef (12)
    expect(selects[0].value).toBe("10")
    expect(selects[1].value).toBe("12")
    expect(screen.getAllByText("Backlog'a taşı (pano dışı)")).toHaveLength(2)
  })

  it("seçimler (Backlog dahil) onConfirm'e id→hedef olarak akar", () => {
    const onConfirm = vi.fn()
    render(
      <ColumnMappingDialog
        open
        removedColumns={REMOVED}
        targets={TARGETS}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    fireEvent.change(selects[0], { target: { value: "11" } })
    fireEvent.change(selects[1], { target: { value: BACKLOG_TARGET } })

    fireEvent.click(screen.getByText("Taşı ve Kaydet"))
    expect(onConfirm).toHaveBeenCalledWith({ 1: "11", 2: BACKLOG_TARGET })
  })

  it("Vazgeç onCancel'ı çağırır, onConfirm'i çağırmaz", () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ColumnMappingDialog
        open
        removedColumns={REMOVED}
        targets={TARGETS}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByText("Vazgeç"))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("busy iken butonlar ve seçimler kilitlenir", () => {
    render(
      <ColumnMappingDialog
        open
        busy
        removedColumns={REMOVED}
        targets={TARGETS}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText("Taşınıyor…")).toBeTruthy()
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    expect(selects[0].disabled).toBe(true)
  })

  it("hedef yoksa varsayılan Backlog'tur", () => {
    expect(defaultMappingTarget({ id: 1, name: "X" }, [])).toBe(BACKLOG_TARGET)
  })
})
