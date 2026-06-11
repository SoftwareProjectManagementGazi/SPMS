// AIWorkflowModal — task_status replace akışının iki adımlı onayı:
// Uygula → AIApplyConfirmation → (kaldırılan kolon varsa) ColumnMappingDialog
// → applyTaskStatusSuggestion(columnMapping). Demo-kritik glue testi.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

// jsdom'da scrollIntoView yok — AIChatLog her render'da çağırıyor.
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Sağ panodaki canvas/kanban görselleri akış için gereksiz — stub.
vi.mock("./ai-live-canvas", () => ({
  AILiveCanvas: () => <div data-testid="live-canvas" />,
}))
vi.mock("./ai-task-status-kanban", () => ({
  AITaskStatusKanban: () => <div data-testid="kanban-preview" />,
}))

const mockGet = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
  },
}))

const mockApplyTaskStatus = vi.fn()
const mockApplyLifecycle = vi.fn()
vi.mock("@/lib/ai/apply-ai-workflow", () => ({
  applyTaskStatusSuggestion: (...a: unknown[]) => mockApplyTaskStatus(...a),
  applyLifecycleSuggestion: (...a: unknown[]) => mockApplyLifecycle(...a),
}))

// Stream hook — doğrudan "done" task_status durumu.
const DONE_STATE = {
  status: "done" as const,
  variant: "task_status" as const,
  methodology: "KANBAN",
  chatLog: ["Sütunlar üretildi"],
  nodes: [],
  edges: [],
  columns: [
    {
      id: "c1",
      label: "Hazır",
      description: "",
      color: "status-todo",
      wip_limit: null,
      is_initial: true,
      is_final: false,
      is_special: false,
    },
    {
      id: "c2",
      label: "Tamam",
      description: "",
      color: "status-done",
      wip_limit: null,
      is_initial: false,
      is_final: true,
      is_special: false,
    },
  ],
  rationale: "",
  summary: { column_count: 2, methodology: "KANBAN" },
}
vi.mock("@/hooks/use-ai-workflow-stream", () => ({
  useAIWorkflowStream: () => ({
    state: DONE_STATE,
    generateLifecycle: vi.fn(),
    generateTaskStatus: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
  }),
}))

import { AIWorkflowModal } from "./ai-workflow-modal"

function renderModal(onApplied = vi.fn()) {
  render(
    <AIWorkflowModal
      open
      variant="task_status"
      contextLabel="Proje X"
      existingNodeCount={3}
      projectId={42}
      existingProcessConfig={{ schema_version: 2 }}
      onClose={vi.fn()}
      onApplied={onApplied}
    />,
  )
  return onApplied
}

describe("AIWorkflowModal — task_status iki adımlı apply", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mevcut kolonlar: "Hazır" AI ile eşleşir; "Eski Kolon" kaldırılacak.
    mockGet.mockResolvedValue({
      data: [
        { id: 7, name: "Eski Kolon", category: "in_progress" },
        { id: 8, name: "Hazır", category: "todo" },
      ],
    })
    mockApplyTaskStatus.mockResolvedValue({ projectId: 42, isNewProject: false })
  })

  it("replace + kaldırılan kolon varken Onaylıyorum eşleme diyaloğunu açar; onay mapping ile apply eder", async () => {
    const onApplied = renderModal()

    // Kolon ön-yüklemesi (done durumunda) tetiklenir.
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith("/projects/42/columns"),
    )

    fireEvent.click(screen.getByRole("button", { name: /Uygula/ }))
    expect(
      await screen.findByText("Görev durumlarınız değiştirilecek"),
    ).toBeTruthy()

    fireEvent.click(screen.getByText("Onaylıyorum"))

    // Apply HENÜZ çağrılmadı — önce eşleme adımı.
    expect(
      await screen.findByText(
        "Kaldırılan sütunlardaki görevler nereye taşınsın?",
      ),
    ).toBeTruthy()
    expect(mockApplyTaskStatus).not.toHaveBeenCalled()
    expect(screen.getByText("Eski Kolon")).toBeTruthy()

    // Hedefi Backlog'a çevir ve onayla.
    const select = screen.getByRole("combobox") as HTMLSelectElement
    fireEvent.change(select, { target: { value: "__backlog__" } })
    fireEvent.click(screen.getByText("Taşı ve Kaydet"))

    await waitFor(() => expect(mockApplyTaskStatus).toHaveBeenCalledTimes(1))
    const args = mockApplyTaskStatus.mock.calls[0][0] as {
      mode: string
      columnMapping: Record<number, { kind: string }>
    }
    expect(args.mode).toBe("replace")
    expect(args.columnMapping).toEqual({ 7: { kind: "backlog" } })

    await waitFor(() => expect(onApplied).toHaveBeenCalledTimes(1))
  })

  it("kaldırılan kolon yokken Onaylıyorum doğrudan apply eder (eşleme adımı atlanır)", async () => {
    // Tüm mevcut kolonlar AI önerisiyle eşleşiyor.
    mockGet.mockResolvedValue({
      data: [
        { id: 8, name: "Hazır" },
        { id: 9, name: "Tamam" },
      ],
    })
    const onApplied = renderModal()
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /Uygula/ }))
    fireEvent.click(await screen.findByText("Onaylıyorum"))

    await waitFor(() => expect(mockApplyTaskStatus).toHaveBeenCalledTimes(1))
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()
    const args = mockApplyTaskStatus.mock.calls[0][0] as {
      columnMapping?: unknown
    }
    expect(args.columnMapping).toBeUndefined()
    await waitFor(() => expect(onApplied).toHaveBeenCalledTimes(1))
  })

  it("new_project modu eşleme adımına girmez", async () => {
    mockApplyTaskStatus.mockResolvedValue({ projectId: 99, isNewProject: true })
    renderModal()
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /Uygula/ }))
    fireEvent.click(
      await screen.findByText("Mevcut workflow'u koru, yeni proje oluştur"),
    )
    fireEvent.click(screen.getByText("Onaylıyorum"))

    await waitFor(() => expect(mockApplyTaskStatus).toHaveBeenCalledTimes(1))
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()
  })

  it("eşleme diyaloğunda Vazgeç onay ekranına döner, apply çağrılmaz", async () => {
    renderModal()
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /Uygula/ }))
    fireEvent.click(await screen.findByText("Onaylıyorum"))
    await screen.findByText("Kaldırılan sütunlardaki görevler nereye taşınsın?")

    const mapDialog = screen.getByRole("dialog", {
      name: "Kaldırılan sütunlardaki görevler nereye taşınsın?",
    })
    fireEvent.click(within(mapDialog).getByText("Vazgeç"))
    expect(
      screen.queryByText("Kaldırılan sütunlardaki görevler nereye taşınsın?"),
    ).toBeNull()
    // Onay ekranı hâlâ açık (arka planda duruyordu).
    expect(screen.getByText("Görev durumlarınız değiştirilecek")).toBeTruthy()
    expect(mockApplyTaskStatus).not.toHaveBeenCalled()
  })
})
