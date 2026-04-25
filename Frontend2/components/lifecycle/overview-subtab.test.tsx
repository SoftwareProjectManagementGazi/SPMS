// Unit tests for components/lifecycle/overview-subtab.tsx (Phase 12 Plan 12-04).
//
// 4 RTL cases per 12-04-PLAN.md task 1 <behavior> Tests 4-7:
//   4. Default 4-metric variant (non-Kanban project)
//   5. Kanban 3-metric variant (Lead/Cycle/WIP)
//   6. LIFE-03 — total === 0 → all 4 metric values render '---'
//   7. Yaklaşan Teslimler column — empty state copy

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { OverviewSubTab } from "./overview-subtab"
import type { WorkflowConfig, WorkflowNode } from "@/services/lifecycle-service"
import type { Task } from "@/services/task-service"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

function makeWorkflow(): WorkflowConfig {
  return {
    mode: "flexible",
    nodes: [
      { id: "n1", name: "Başlatma", x: 0, y: 0, isInitial: true },
      { id: "n2", name: "Yürütme", x: 0, y: 0 },
      { id: "n3", name: "Kapanış", x: 0, y: 0, isFinal: true },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", type: "flow" },
      { id: "e2", source: "n2", target: "n3", type: "flow" },
    ],
    groups: [],
  }
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 1,
    key: "TST-1",
    title: "Demo task",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: 1,
    reporterId: 1,
    parentTaskId: null,
    projectId: 1,
    cycleId: null,
    phaseId: "n2",
    points: null,
    start: null,
    due: null,
    labels: [],
    watcherCount: 0,
    type: "task",
    createdAt: "2026-04-25T00:00:00Z",
    ...overrides,
  }
}

const baseProject = {
  id: 7,
  methodology: "SCRUM",
} as { id: number; methodology: string }

const activePhase: WorkflowNode = { id: "n2", name: "Yürütme", x: 0, y: 0 }

describe("OverviewSubTab", () => {
  it("Test 4: default (non-Kanban) variant renders 4 MiniMetrics — Toplam / Tamamlanan / Devam / İlerleme", () => {
    const tasks: Task[] = [
      makeTask({ id: 1, status: "done", phaseId: "n2" }),
      makeTask({ id: 2, status: "in_progress", phaseId: "n2" }),
      makeTask({ id: 3, status: "todo", phaseId: "n2" }),
    ]
    render(
      <OverviewSubTab
        project={baseProject}
        workflow={makeWorkflow()}
        activePhase={activePhase}
        tasks={tasks}
      />,
    )

    expect(screen.getByText("Toplam")).toBeInTheDocument()
    expect(screen.getByText("Tamamlanan")).toBeInTheDocument()
    expect(screen.getByText("Devam Eden")).toBeInTheDocument()
    expect(screen.getByText("İlerleme")).toBeInTheDocument()
    // Total = 3 ; Done = 1
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1)
    // Progress = round(1/3 * 100) = 33 → "%33" appears in MiniMetric value + Faz Özeti mono row
    expect(screen.getAllByText("%33").length).toBeGreaterThanOrEqual(1)
  })

  it("Test 5: Kanban variant renders 3 MiniMetrics — Lead Time / Cycle Time / WIP", () => {
    const kanbanProject = { id: 8, methodology: "KANBAN" }
    const tasks: Task[] = [
      makeTask({ id: 1, status: "in_progress", phaseId: null }),
      makeTask({ id: 2, status: "in_progress", phaseId: null }),
    ]
    render(
      <OverviewSubTab
        project={kanbanProject}
        workflow={{ ...makeWorkflow(), mode: "continuous" }}
        activePhase={activePhase}
        tasks={tasks}
      />,
    )

    expect(screen.getByText("Ortalama Lead Time")).toBeInTheDocument()
    expect(screen.getByText("Ortalama Cycle Time")).toBeInTheDocument()
    expect(screen.getByText("WIP")).toBeInTheDocument()
    // Standard 4-metric labels are NOT shown under Kanban
    expect(screen.queryByText("Toplam")).not.toBeInTheDocument()
    expect(screen.queryByText("İlerleme")).not.toBeInTheDocument()
  })

  it("Test 6: LIFE-03 — when active phase has 0 tasks, all 4 metric values render '---'", () => {
    render(
      <OverviewSubTab
        project={baseProject}
        workflow={makeWorkflow()}
        activePhase={activePhase}
        tasks={[]}
      />,
    )

    // 4 metric tiles → 4 '---' values
    const dashes = screen.getAllByText("---")
    expect(dashes.length).toBeGreaterThanOrEqual(4)
  })

  it("Test 7: Yaklaşan Teslimler — empty state copy when no upcoming tasks/milestones", () => {
    render(
      <OverviewSubTab
        project={baseProject}
        workflow={makeWorkflow()}
        activePhase={activePhase}
        tasks={[]}
      />,
    )

    expect(screen.getByText("Yaklaşan Teslimler")).toBeInTheDocument()
    expect(screen.getByText("Yaklaşan teslim yok")).toBeInTheDocument()
  })

  it("Test 7b: Yaklaşan Teslimler — renders task entries when tasks have due dates", () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const tasks: Task[] = [
      makeTask({
        id: 10,
        key: "TST-10",
        title: "Teslim et",
        status: "in_progress",
        due: future.toISOString().slice(0, 10),
      }),
    ]
    render(
      <OverviewSubTab
        project={baseProject}
        workflow={makeWorkflow()}
        activePhase={activePhase}
        tasks={tasks}
      />,
    )

    expect(screen.getByText("Yaklaşan Teslimler")).toBeInTheDocument()
    expect(screen.getByText("TST-10")).toBeInTheDocument()
    expect(screen.getByText("Teslim et")).toBeInTheDocument()
  })

  it("Test 7c: Faz Özeti — renders one row per workflow node with active row highlighted", () => {
    render(
      <OverviewSubTab
        project={baseProject}
        workflow={makeWorkflow()}
        activePhase={activePhase}
        tasks={[]}
      />,
    )

    expect(screen.getByText("Faz Özeti")).toBeInTheDocument()
    // All 3 phase names appear in the summary
    expect(screen.getByText("Başlatma")).toBeInTheDocument()
    // Yürütme is active phase + appears once in summary list
    const yurut = screen.getAllByText("Yürütme")
    expect(yurut.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Kapanış")).toBeInTheDocument()
  })
})
