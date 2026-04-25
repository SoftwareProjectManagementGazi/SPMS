"use client"

// LifecycleTab (Phase 12 Plan 12-02) — outer shell that mounts the Lifecycle
// summary strip, the Phase Gate inline-expand panel, and the read-only
// Workflow Canvas. Replaces the Phase 11 D-10 LifecycleStubTab.
//
// This plan's deliverable is the *initial* version of the tab — sub-tab
// content (Overview / Milestones / History / Artifacts) lands in Plans
// 12-04..06; this file currently renders a placeholder beneath the canvas
// noting the deferred slot.
//
// Wiring summary:
//   project.processConfig.workflow → WorkflowConfig (via lifecycle-service mapper)
//   activity feed (cycle counters)  → useCycleCounters
//   cycle counters + workflow       → React Flow node/edge inputs
//   computeNodeStates               → Map<id, 'active'|'past'|'future'|'unreachable'>
//   activePhase                     → first node with state==='active'
//   nextPhase                       → first edge target out of activePhase
//   gateOpen state                  → toggles PhaseGateExpand below SummaryStrip

import * as React from "react"
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react"

import { Card, Tabs, type TabItem } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useCycleCounters } from "@/hooks/use-cycle-counters"
import { useTasks } from "@/hooks/use-tasks"
import { lifecycleService } from "@/services/lifecycle-service"
import {
  mapWorkflowConfig,
  type PhaseTransitionEntry,
  type WorkflowConfig,
  type WorkflowConfigDTO,
  type WorkflowEdge as DomainEdge,
  type WorkflowNode as DomainNode,
} from "@/services/lifecycle-service"
import { computeNodeStates } from "@/lib/lifecycle/graph-traversal"
import type { Project } from "@/services/project-service"
import { WorkflowCanvas } from "@/components/workflow-editor/workflow-canvas"
import { useQuery } from "@tanstack/react-query"

import { SummaryStrip } from "./summary-strip"
import { PhaseGateExpand, type PhaseGateCriteria } from "./phase-gate-expand"
import { OverviewSubTab } from "./overview-subtab"
import { HistorySubTab } from "./history-subtab"
import { MilestonesSubTab } from "./milestones-subtab"
import { ArtifactsSubTab } from "./artifacts-subtab"

interface PhaseTransitionEntryShape {
  user_id: number
  created_at: string
  extra_metadata: {
    source_phase_id: string
    target_phase_id: string
    cycle_number?: number
    override_used?: boolean
  }
}

interface ProcessConfigShape {
  workflow?: WorkflowConfigDTO
  phase_completion_criteria?: Record<
    string,
    { auto?: { all_tasks_done?: boolean; no_critical_tasks?: boolean; no_blockers?: boolean }; manual?: string[] }
  >
}

const DEFAULT_AUTO_CRITERIA = {
  all_tasks_done: true,
  no_critical_tasks: true,
  no_blockers: true,
}

function readWorkflow(project: Project): WorkflowConfig | null {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  if (!cfg || !cfg.workflow) return null
  return mapWorkflowConfig(cfg.workflow)
}

function readCriteria(project: Project, phaseId: string | null): PhaseGateCriteria {
  if (!phaseId) {
    return { auto: DEFAULT_AUTO_CRITERIA, manual: [] }
  }
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  const entry = cfg?.phase_completion_criteria?.[phaseId]
  if (!entry) {
    return { auto: DEFAULT_AUTO_CRITERIA, manual: [] }
  }
  return {
    auto: {
      all_tasks_done: entry.auto?.all_tasks_done ?? true,
      no_critical_tasks: entry.auto?.no_critical_tasks ?? true,
      no_blockers: entry.auto?.no_blockers ?? true,
    },
    manual: entry.manual ?? [],
  }
}

interface TaskShape {
  id: number
  status?: string
  phase_id?: string | null
}

function findActivePhase(
  workflow: WorkflowConfig,
  states: Map<string, "active" | "past" | "future" | "unreachable">,
): DomainNode | null {
  for (const node of workflow.nodes) {
    if (states.get(node.id) === "active") return node
  }
  // Fallback — first non-archived node
  return workflow.nodes.find((n) => !n.isArchived) ?? null
}

function findNextPhase(
  workflow: WorkflowConfig,
  active: DomainNode | null,
): DomainNode | null {
  if (!active) return null
  const outgoing = workflow.edges.find(
    (e: DomainEdge) => e.source === active.id && e.type === "flow",
  )
  if (!outgoing) {
    // Try any edge
    const any = workflow.edges.find((e) => e.source === active.id)
    if (!any) return null
    return workflow.nodes.find((n) => n.id === any.target) ?? null
  }
  return workflow.nodes.find((n) => n.id === outgoing.target) ?? null
}

function buildRFNodes(
  workflow: WorkflowConfig,
  states: Map<string, "active" | "past" | "future" | "unreachable">,
  cycleCounters: Map<string, number> | undefined,
): RFNode[] {
  return workflow.nodes.map((n) => ({
    id: n.id,
    type: "phase",
    position: { x: n.x, y: n.y },
    parentId: n.parentId,
    data: {
      name: n.name,
      description: n.description,
      color: n.color ?? "status-todo",
      state: states.get(n.id) ?? "future",
      isInitial: n.isInitial,
      isFinal: n.isFinal,
      isArchived: n.isArchived,
      cycleCount: cycleCounters?.get(n.id) ?? 0,
      wipLimit: n.wipLimit ?? null,
      editMode: false,
    },
  }))
}

function buildRFEdges(workflow: WorkflowConfig): RFEdge[] {
  return workflow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "phase",
    data: {
      type: e.type,
      label: e.label,
      bidirectional: e.bidirectional,
      isAllGate: e.isAllGate,
    },
  }))
}

export interface LifecycleTabProps {
  project: Project
}

export function LifecycleTab({ project }: LifecycleTabProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const workflow = React.useMemo(() => readWorkflow(project), [project])

  // Activity feed → cycle counters (per-node ×N).
  const { data: cycleCounters } = useCycleCounters(project.id)

  // Phase transitions feed for BFS + History sub-tab. Plan 12-04 wires the
  // raw activity feed via lifecycleService.getPhaseTransitions; the BFS
  // function gracefully returns the initial-active branch when the list is
  // empty.
  const { data: phaseTransitionsRaw } = useQuery<PhaseTransitionEntry[]>({
    queryKey: ["activity", project.id, "phase-transition"],
    queryFn: () => lifecycleService.getPhaseTransitions(project.id),
    enabled: !!project.id,
  })
  const phaseTransitions: PhaseTransitionEntryShape[] = React.useMemo(() => {
    return (phaseTransitionsRaw ?? []) as PhaseTransitionEntryShape[]
  }, [phaseTransitionsRaw])

  const nodeStates = React.useMemo(() => {
    if (!workflow) return new Map<string, "active" | "past" | "future" | "unreachable">()
    return computeNodeStates({ workflow, phaseTransitions })
  }, [workflow, phaseTransitions])

  const activePhase = React.useMemo(
    () => (workflow ? findActivePhase(workflow, nodeStates) : null),
    [workflow, nodeStates],
  )
  const nextPhase = React.useMemo(
    () => (workflow ? findNextPhase(workflow, activePhase) : null),
    [workflow, activePhase],
  )

  // Tasks for the active phase — drives ProgressBar + open-tasks counter.
  const { data: rawTasks } = useTasks(project.id)
  const phaseStats = React.useMemo(() => {
    if (!Array.isArray(rawTasks) || !activePhase) {
      return { total: 0, done: 0, open: 0, progress: 0 }
    }
    const inPhase = (rawTasks as TaskShape[]).filter(
      (t) => t.phase_id == null || t.phase_id === activePhase.id,
    )
    const total = inPhase.length
    const done = inPhase.filter((t) => (t.status ?? "").toLowerCase() === "done").length
    const open = total - done
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, open, progress }
  }, [rawTasks, activePhase])

  const [gateOpen, setGateOpen] = React.useState(false)

  // Sub-tab state. Default = Overview. The Kanban methodology hides
  // History + Artifacts per CONTEXT D-59. Milestones + Artifacts ship as
  // placeholders in Plan 12-04; Plan 12-05 + 12-06 land them.
  type SubTabId = "overview" | "milestones" | "history" | "artifacts"
  const [subTab, setSubTab] = React.useState<SubTabId>("overview")
  const isKanban =
    project.methodology === "KANBAN" || workflow?.mode === "continuous"

  const rfNodes = React.useMemo(
    () => (workflow ? buildRFNodes(workflow, nodeStates, cycleCounters) : []),
    [workflow, nodeStates, cycleCounters],
  )
  const rfEdges = React.useMemo(
    () => (workflow ? buildRFEdges(workflow) : []),
    [workflow],
  )

  const criteria = React.useMemo(
    () => readCriteria(project, activePhase?.id ?? null),
    [project, activePhase],
  )

  if (!workflow) {
    return (
      <div style={{ padding: 20 }}>
        <Card padding={16}>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {T(
              "Bu projede aktif iş akışı tanımlanmamış. Ayarlar > İş Akışı sekmesinden bir akış oluşturun.",
              "No active workflow defined. Configure one from Settings > Workflow.",
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <SummaryStrip
          project={project}
          workflow={workflow}
          activePhase={activePhase}
          phaseProgress={phaseStats.progress}
          openTasksRemaining={phaseStats.open}
          onOpenGate={() => setGateOpen((v) => !v)}
        />

        {gateOpen && activePhase && (
          <PhaseGateExpand
            project={project}
            workflowMode={workflow.mode}
            currentPhase={activePhase}
            nextPhase={nextPhase}
            criteria={criteria}
            onClose={() => setGateOpen(false)}
          />
        )}

        <div style={{ height: 480 }}>
          <WorkflowCanvas
            nodes={rfNodes}
            edges={rfEdges}
            readOnly={true}
            showMiniMap={true}
          />
        </div>
      </Card>

      {/* Sub-tabs — Overview + History live in Plan 12-04. Milestones lands
          in Plan 12-05; Artifacts in Plan 12-06. Kanban hides History +
          Artifacts per CONTEXT D-59. */}
      <div style={{ marginTop: 12 }}>
        <Tabs
          tabs={
            isKanban
              ? ([
                  { id: "overview", label: T("Genel Bakış", "Overview") },
                  {
                    id: "milestones",
                    label: T("Kilometre Taşları", "Milestones"),
                  },
                ] as TabItem[])
              : ([
                  { id: "overview", label: T("Genel Bakış", "Overview") },
                  {
                    id: "milestones",
                    label: T("Kilometre Taşları", "Milestones"),
                  },
                  { id: "history", label: T("Geçmiş", "History") },
                  { id: "artifacts", label: T("Artefaktlar", "Artifacts") },
                ] as TabItem[])
          }
          active={subTab}
          onChange={(id) => setSubTab(id as SubTabId)}
        />

        <div style={{ paddingTop: 16 }}>
          {subTab === "overview" && (
            <OverviewSubTab
              project={project}
              workflow={workflow}
              activePhase={activePhase}
              tasks={(rawTasks ?? []) as never}
            />
          )}
          {subTab === "milestones" && (
            <MilestonesSubTab project={project} workflow={workflow} />
          )}
          {subTab === "history" && !isKanban && (
            <HistorySubTab
              project={project}
              workflow={workflow}
              activity={
                (phaseTransitionsRaw ?? []) as PhaseTransitionEntry[]
              }
            />
          )}
          {subTab === "artifacts" && !isKanban && (
            <ArtifactsSubTab project={project} workflow={workflow} />
          )}
        </div>
      </div>
    </div>
  )
}
