// Unit tests for components/workflow-editor/selection-panel.tsx
// (Phase 12 Plan 12-07 + Wave 2 W2-C6 — engine field editor + multi-initial
// warning + status-mode BoardColumn PATCH side-effect).
//
// Original 3 cases per 12-07-PLAN.md task 2 <behavior> Tests 3-5:
//   3. selected = null renders 'Bir düğüm veya bağlantı seçin.' empty state
//   4. selected.type='node' renders Field rows for name + description +
//      color (ColorSwatch) + WIP + isInitial + isFinal toggles
//   5. selected.type='edge' renders SegmentedControl for type
//      (Akış / Doğrulama / Geri Bildirim) + Etiket Input + Bidirectional
//      toggle + All-gate toggle
//
// W2-C6 additions (status-mode engine fields):
//   6.  Engine field section renders Kategori dropdown
//   7.  Engine field section renders is_terminal Toggle
//   8.  Engine field section renders max_duration_days Input with
//       "unbounded" placeholder when value is null
//   9.  Engine field section renders entry_policy + exit_policy dropdowns
//   10. category change dispatches onColumnEngineFieldsChange in status mode
//   11. lifecycle-mode node (no col_ prefix) does NOT dispatch the side-effect
//   12. max_duration_days empty input emits null (not 0)
//   13. multi-initial warning AlertBanner renders when another column is also
//       isInitial; absent when only the current node is initial
//   14. status-mode is_initial toggle dispatches with is_initial in PATCH

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { SelectionPanel } from "./selection-panel"
import type { WorkflowConfig, WorkflowNode } from "@/services/lifecycle-service"

const baseWorkflow: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    {
      id: "n1",
      name: "Başlatma",
      x: 60,
      y: 120,
      isInitial: true,
      description: "Proje başlatılır.",
      color: "status-progress",
      wipLimit: 4,
    },
    { id: "n2", name: "Yürütme", x: 280, y: 120 },
  ],
  edges: [
    {
      id: "e1",
      source: "n1",
      target: "n2",
      type: "flow",
      label: "İlerle",
      bidirectional: false,
      isAllGate: false,
    },
  ],
  groups: [],
}

describe("SelectionPanel", () => {
  it("Test 3: empty state — selected=null renders 'Bir düğüm veya bağlantı seçin.'", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={null}
        onWorkflowChange={() => {}}
      />,
    )
    expect(screen.getByText(/Bir düğüm veya bağlantı seçin\./)).toBeTruthy()
    expect(screen.getByText("Seçim")).toBeTruthy()
  })

  it("Test 4: node selection renders Ad / Açıklama / Renk / WIP + isInitial + isFinal + arşivli toggles", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={{ type: "node", id: "n1" }}
        onWorkflowChange={() => {}}
      />,
    )
    expect(screen.getByText("Ad")).toBeTruthy()
    expect(screen.getByText("Açıklama")).toBeTruthy()
    expect(screen.getByText("Renk")).toBeTruthy()
    expect(screen.getByText("WIP")).toBeTruthy()
    expect(screen.getByText("Başlangıç düğümü")).toBeTruthy()
    expect(screen.getByText("Bitiş düğümü")).toBeTruthy()
    expect(screen.getByText(/Arşivli/)).toBeTruthy()
    // ColorSwatch renders 8 swatches as buttons with aria-label === token name
    expect(screen.getByLabelText("status-todo")).toBeTruthy()
    expect(screen.getByLabelText("primary")).toBeTruthy()
  })

  it("Test 5: edge selection renders type SegmentedControl + Etiket Input + Çift yönlü + Hepsi toggles", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={{ type: "edge", id: "e1" }}
        onWorkflowChange={() => {}}
      />,
    )
    // Phase 15 Plan 15-01 (TIDY-04 harness fix) — production EdgeEditor
    // (selection-panel.tsx:413-437) renders the source name + arrow icon +
    // target name across separate divs (not as a single "Başlatma →
    // Yürütme" string), so a regex spanning both names cannot match a
    // single text node. Verify each name is present independently.
    expect(screen.getByText("Başlatma")).toBeTruthy()
    expect(screen.getByText("Yürütme")).toBeTruthy()
    // Edge type label
    expect(screen.getByText("Bağlantı Tipi")).toBeTruthy()
    // SegmentedControl 3 options
    expect(screen.getByText("Akış")).toBeTruthy()
    expect(screen.getByText("Doğrulama")).toBeTruthy()
    expect(screen.getByText("Geri Bildirim")).toBeTruthy()
    // Etiket field
    expect(screen.getByText("Etiket")).toBeTruthy()
    // Toggle labels
    expect(screen.getByText("Çift yönlü")).toBeTruthy()
    expect(screen.getByText(/Hepsi/)).toBeTruthy()
  })
})

// ===========================================================================
// Wave 2 W2-C6 — NodeEditor engine field section + status-mode side-effect
// ===========================================================================

/** Builds a status-mode workflow whose node id matches the `col_<N>` regex
 *  so `NodeEditor.colIdFromNodeId` resolves to a numeric column id and the
 *  `onColumnEngineFieldsChange` side-effect fires. */
function statusModeWorkflow(node: Partial<WorkflowNode> = {}): WorkflowConfig {
  return {
    mode: "continuous",
    nodes: [
      {
        id: "col_42",
        name: "In Progress",
        x: 0,
        y: 0,
        color: "status-progress",
        ...node,
      },
    ],
    edges: [],
    groups: [],
  }
}

describe("SelectionPanel — W2-C6 NodeEditor engine fields", () => {
  it("Test 6: renders the Engine Fields section with the Kategori dropdown for a status-mode node", () => {
    render(
      <SelectionPanel
        workflow={statusModeWorkflow({ category: "in_progress" })}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    expect(screen.getByText("Motor Alanları")).toBeTruthy()
    // Dropdown identified by aria-label so we don't depend on visible <label>
    // text living in the same DOM subtree.
    const select = screen.getByLabelText("Kategori") as HTMLSelectElement
    expect(select.value).toBe("in_progress")
    // 3 options present (todo / in_progress / done).
    expect(select.querySelectorAll("option").length).toBe(3)
  })

  it("Test 7: renders the Terminal düğüm toggle for a status-mode node", () => {
    render(
      <SelectionPanel
        workflow={statusModeWorkflow({ isTerminal: true })}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    expect(screen.getByText("Terminal düğüm")).toBeTruthy()
    // Toggle role is "switch"; "Terminal düğüm" is the only switch in the
    // engine section but the node also has Initial/Final + Archived above,
    // so we match by name.
    const term = screen.getByRole("switch", { name: "Terminal düğüm" })
    expect((term as HTMLButtonElement).getAttribute("aria-checked")).toBe("true")
  })

  it("Test 8: renders the max_duration_days input with 'sınırsız' placeholder when value is null/undefined", () => {
    render(
      <SelectionPanel
        workflow={statusModeWorkflow({ maxDurationDays: null })}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    const input = screen.getByPlaceholderText("sınırsız") as HTMLInputElement
    expect(input.value).toBe("")
    expect(input.type).toBe("number")
  })

  it("Test 9: renders entry_policy and exit_policy dropdowns with default 'any' selected when unset", () => {
    render(
      <SelectionPanel
        workflow={statusModeWorkflow()}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    const entry = screen.getByLabelText("Giriş politikası") as HTMLSelectElement
    const exit = screen.getByLabelText("Çıkış politikası") as HTMLSelectElement
    expect(entry.value).toBe("any")
    expect(exit.value).toBe("any")
    // Distinct 3rd options confirm the two dropdowns are not swapped.
    expect(entry.querySelector('option[value="initial_only"]')).toBeTruthy()
    expect(exit.querySelector('option[value="terminal_lock"]')).toBeTruthy()
  })

  it("Test 10: changing category in status mode dispatches onColumnEngineFieldsChange(42, { category })", () => {
    const onCol = vi.fn()
    const onWf = vi.fn()
    render(
      <SelectionPanel
        workflow={statusModeWorkflow({ category: "todo" })}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={onWf}
        onColumnEngineFieldsChange={onCol}
        editorMode="status"
      />,
    )
    const select = screen.getByLabelText("Kategori") as HTMLSelectElement
    fireEvent.change(select, { target: { value: "in_progress" } })
    // Local workflow state still updates …
    expect(onWf).toHaveBeenCalledTimes(1)
    // … AND the BoardColumn PATCH side-effect fires with the snake_case key
    // and the parsed numeric column id.
    expect(onCol).toHaveBeenCalledTimes(1)
    expect(onCol).toHaveBeenCalledWith(42, { category: "in_progress" })
  })

  it("Test 11: lifecycle-mode node (no col_ prefix) does NOT trigger onColumnEngineFieldsChange", () => {
    const onCol = vi.fn()
    const lifecycleWorkflow: WorkflowConfig = {
      mode: "flexible",
      nodes: [
        { id: "nd_design", name: "Design", x: 0, y: 0, color: "status-progress" },
      ],
      edges: [],
      groups: [],
    }
    render(
      <SelectionPanel
        workflow={lifecycleWorkflow}
        selected={{ type: "node", id: "nd_design" }}
        onWorkflowChange={() => {}}
        onColumnEngineFieldsChange={onCol}
        editorMode="lifecycle"
      />,
    )
    const select = screen.getByLabelText("Kategori") as HTMLSelectElement
    fireEvent.change(select, { target: { value: "done" } })
    expect(onCol).not.toHaveBeenCalled()
  })

  it("Test 12: max_duration_days empty input emits null (not 0)", () => {
    const onWf = vi.fn()
    const onCol = vi.fn()
    render(
      <SelectionPanel
        workflow={statusModeWorkflow({ maxDurationDays: 7 })}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={onWf}
        onColumnEngineFieldsChange={onCol}
        editorMode="status"
      />,
    )
    const input = screen.getByPlaceholderText("sınırsız") as HTMLInputElement
    fireEvent.change(input, { target: { value: "" } })
    // Last workflow patch must carry maxDurationDays: null …
    const lastWf = onWf.mock.calls.at(-1)?.[0] as WorkflowConfig
    expect(lastWf.nodes[0].maxDurationDays).toBeNull()
    // … and the PATCH side-effect must use snake_case + null (semantic
    // "unbounded"; 0 would be invalid per the backend Pydantic model).
    expect(onCol).toHaveBeenCalledWith(42, { max_duration_days: null })
  })

  it("Test 13a: multi-initial AlertBanner renders when another column is also is_initial", () => {
    const workflow: WorkflowConfig = {
      mode: "continuous",
      nodes: [
        {
          id: "col_42",
          name: "In Progress",
          x: 0,
          y: 0,
          isInitial: true,
        },
        {
          id: "col_99",
          name: "Backlog",
          x: 200,
          y: 0,
          isInitial: true,
        },
      ],
      edges: [],
      groups: [],
    }
    render(
      <SelectionPanel
        workflow={workflow}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    const banner = screen.getByTestId("multi-initial-warning")
    expect(banner).toBeTruthy()
    expect(banner.textContent).toContain("Backlog")
  })

  it("Test 13b: multi-initial AlertBanner is absent when only the current node is initial", () => {
    const workflow: WorkflowConfig = {
      mode: "continuous",
      nodes: [
        {
          id: "col_42",
          name: "In Progress",
          x: 0,
          y: 0,
          isInitial: true,
        },
        { id: "col_99", name: "Backlog", x: 200, y: 0 },
      ],
      edges: [],
      groups: [],
    }
    render(
      <SelectionPanel
        workflow={workflow}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        editorMode="status"
      />,
    )
    expect(screen.queryByTestId("multi-initial-warning")).toBeNull()
  })

  it("Test 14: status-mode is_initial checkbox flip dispatches onColumnEngineFieldsChange with is_initial:true", () => {
    const onCol = vi.fn()
    render(
      <SelectionPanel
        workflow={statusModeWorkflow()}
        selected={{ type: "node", id: "col_42" }}
        onWorkflowChange={() => {}}
        onColumnEngineFieldsChange={onCol}
        editorMode="status"
      />,
    )
    // Status mode renders Initial as an inline <input type="checkbox"> with
    // the "Başlangıç" label — find it via the label text.
    const initialLabel = screen.getByText("Başlangıç")
      .parentElement as HTMLLabelElement
    const checkbox = initialLabel.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement
    fireEvent.click(checkbox)
    expect(onCol).toHaveBeenCalledTimes(1)
    expect(onCol).toHaveBeenCalledWith(42, { is_initial: true })
  })
})
