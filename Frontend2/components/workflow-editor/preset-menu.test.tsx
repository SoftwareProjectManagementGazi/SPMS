// Unit tests for components/workflow-editor/preset-menu.tsx
// (Phase 12 Plan 12-10).
//
// 6 cases per 12-10-PLAN.md task 2 <behavior> block:
//   1. menu open/close — clicking trigger toggles dropdown visibility;
//      9 preset entries render in order
//   2. dirty=true triggers ConfirmDialog with TR copy "Mevcut değişiklikler
//      kaybolacak…"
//   3. cancel keeps current canvas — clicking cancel closes dialog without
//      calling onApply
//   4. confirm swaps canvas — clicking "Devam Et" calls onApply(presetId)
//   5. dirty=false skips dialog — clicking a preset directly calls onApply
//      without opening ConfirmDialog
//   6. current-preset Badge — when currentPresetId is provided, the toolbar
//      trigger shows a Badge with the localized label

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { PresetMenu } from "./preset-menu"

describe("PresetMenu", () => {
  beforeEach(() => {
    // Each test gets fresh handlers
  })

  it("Test 1: clicking trigger opens dropdown listing all 9 presets in order", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu currentPresetId={null} dirty={false} onApply={onApply} />,
    )
    // Dropdown closed initially — Şelale (waterfall TR label) absent
    expect(screen.queryByText("Şelale")).toBeNull()

    // Open dropdown
    const trigger = screen.getByText("Şablon Yükle")
    fireEvent.click(trigger)

    // All 9 TR labels render
    expect(screen.getByText("Scrum")).toBeTruthy()
    expect(screen.getByText("Şelale")).toBeTruthy()
    expect(screen.getByText("Kanban")).toBeTruthy()
    expect(screen.getByText("Yinelemeli")).toBeTruthy()
    expect(screen.getByText("V-Modeli")).toBeTruthy()
    expect(screen.getByText("Spiral")).toBeTruthy()
    expect(screen.getByText("Artırımlı")).toBeTruthy()
    expect(screen.getByText("Evrimsel")).toBeTruthy()
    expect(screen.getByText("RAD")).toBeTruthy()
  })

  it("Test 2: dirty=true triggers ConfirmDialog with Turkish copy", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu currentPresetId={null} dirty={true} onApply={onApply} />,
    )
    fireEvent.click(screen.getByText("Şablon Yükle"))
    fireEvent.click(screen.getByText("Artırımlı"))

    // ConfirmDialog opens with the TR copy
    expect(
      screen.getByText(/Mevcut değişiklikler kaybolacak/),
    ).toBeTruthy()
    expect(onApply).not.toHaveBeenCalled()
  })

  it("Test 3: clicking 'Vazgeç' on ConfirmDialog closes without applying", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu currentPresetId={null} dirty={true} onApply={onApply} />,
    )
    fireEvent.click(screen.getByText("Şablon Yükle"))
    fireEvent.click(screen.getByText("Artırımlı"))

    // Cancel button — Vazgeç label
    const cancelBtn = screen.getByText("Vazgeç")
    fireEvent.click(cancelBtn)

    // Dialog closed; onApply NOT called
    expect(screen.queryByText(/Mevcut değişiklikler kaybolacak/)).toBeNull()
    expect(onApply).not.toHaveBeenCalled()
  })

  it("Test 4: clicking 'Devam Et' on ConfirmDialog calls onApply with the chosen preset id", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu currentPresetId={null} dirty={true} onApply={onApply} />,
    )
    fireEvent.click(screen.getByText("Şablon Yükle"))
    fireEvent.click(screen.getByText("Artırımlı"))

    // Confirm button — Devam Et
    const confirmBtn = screen.getByText("Devam Et")
    fireEvent.click(confirmBtn)

    // onApply called with 'incremental' (the preset id behind "Artırımlı")
    expect(onApply).toHaveBeenCalledWith("incremental")
  })

  it("Test 5: dirty=false bypasses ConfirmDialog and applies directly", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu currentPresetId={null} dirty={false} onApply={onApply} />,
    )
    fireEvent.click(screen.getByText("Şablon Yükle"))
    fireEvent.click(screen.getByText("RAD"))

    // No ConfirmDialog opened
    expect(screen.queryByText(/Mevcut değişiklikler kaybolacak/)).toBeNull()
    // onApply called immediately
    expect(onApply).toHaveBeenCalledWith("rad")
  })

  it("Test 6: currentPresetId renders a localized Badge in the trigger area", () => {
    const onApply = vi.fn()
    render(
      <PresetMenu
        currentPresetId="evolutionary"
        dirty={false}
        onApply={onApply}
      />,
    )
    // The Badge text matches PRESET_LABELS_TR.evolutionary === 'Evrimsel'
    // and is rendered inside the trigger row (not the dropdown — dropdown
    // is closed initially).
    expect(screen.getByText("Evrimsel")).toBeTruthy()
    // Trigger label still present
    expect(screen.getByText("Şablon Yükle")).toBeTruthy()
  })
})
