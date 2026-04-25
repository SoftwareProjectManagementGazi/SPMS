"use client"

// EditorPage (Phase 12 Plan 12-07) — outer page shell mounted by the
// `/workflow-editor?projectId=X` route. Hosts:
//
//   - Header row: H1 "İş Akışı Tasarımcısı" (20px, weight 600, letter-spacing
//     -0.4 per UI-SPEC §200), project subtitle, Save / Geri / Çoğalt + dirty
//     Badge.
//   - Top toolbar: mode SegmentedControl (Yaşam Döngüsü / Görev Durumları),
//     template dropdown placeholder, Undo / Redo buttons (disabled — Plan
//     12-08 wires actions), zoom display.
//   - 2-col body grid: canvas (flex:1) + RightPanel (320px).
//   - Mode banner overlays canvas top-left.
//   - Bottom toolbar floats centered above canvas.
//   - Minimap wrapper bottom-right.
//
// Plan 12-07 explicitly does NOT wire DnD / inline-edit / save flow / preset
// content / cycle-counter wiring. Save Button is permission-gated via
// useTransitionAuthority but performs no action yet (Plan 12-09 wires the
// 200/422/409/429/network matrix).
//
// URL persistence: ?mode=lifecycle|status — switching modes calls
// router.replace so the next reload resumes on the same mode. When dirty is
// true, the dirty-save guard (Plan 12-09) intercepts before switching.

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Copy, Save, Undo2, Redo2 } from "lucide-react"

import {
  Badge,
  Button,
  SegmentedControl,
} from "@/components/primitives"
import { Tooltip } from "@/components/workflow-editor/tooltip"
import { useApp } from "@/context/app-context"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import type { Project } from "@/services/project-service"
import {
  mapWorkflowConfig,
  type WorkflowConfig,
  type WorkflowConfigDTO,
  type WorkflowMode,
} from "@/services/lifecycle-service"

import { WorkflowCanvas } from "./workflow-canvas"
import { RightPanel } from "./right-panel"
import { BottomToolbar } from "./bottom-toolbar"
import { ModeBanner } from "./mode-banner"
import { MinimapWrapper } from "./minimap-wrapper"

export type EditorMode = "lifecycle" | "status"

export interface EditorPageProps {
  project: Project
}

interface ProcessConfigShape {
  workflow?: WorkflowConfigDTO
}

function readWorkflow(project: Project): WorkflowConfig {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  if (!cfg || !cfg.workflow) {
    // Empty default — Plan 12-08 wires the "first node" UX. Right-panel
    // validation will flag missing initial/final nodes immediately.
    return { mode: "flexible", nodes: [], edges: [], groups: [] }
  }
  return mapWorkflowConfig(cfg.workflow)
}

export function EditorPage({ project }: EditorPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const canEdit = useTransitionAuthority(project)

  // Working-copy workflow state — Plan 12-08 wires DnD/edge-create mutations
  // through `setWorkflow`. Plan 12-09 sends `workflow` to PATCH on Save.
  const initialWorkflow = React.useMemo(() => readWorkflow(project), [project])
  const [workflow, setWorkflow] = React.useState<WorkflowConfig>(initialWorkflow)

  const [dirty, setDirty] = React.useState(false)
  const [selected, setSelected] = React.useState<{
    type: "node" | "edge" | "group"
    id: string
  } | null>(null)

  const modeRaw = searchParams.get("mode")
  const mode: EditorMode = modeRaw === "status" ? "status" : "lifecycle"

  const handleModeChange = React.useCallback(
    (next: string) => {
      // Plan 12-09 wires the dirty-save guard intercept; for now, accept the
      // switch and update the URL.
      const params = new URLSearchParams(searchParams.toString())
      params.set("mode", next)
      router.replace(`/workflow-editor?${params.toString()}`)
    },
    [router, searchParams],
  )

  const handleWorkflowChange = React.useCallback((next: WorkflowConfig) => {
    setWorkflow(next)
    setDirty(true)
  }, [])

  // Mode SegmentedControl options (TR + EN per UI-SPEC §549-550)
  const MODE_OPTIONS = React.useMemo(
    () => [
      { id: "lifecycle", label: T("Yaşam Döngüsü", "Lifecycle") },
      { id: "status", label: T("Görev Durumları", "Task Statuses") },
    ],
    [T],
  )

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 16,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: -0.4,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {T("İş Akışı Tasarımcısı", "Workflow Designer")}
          </h1>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            <span style={{ fontWeight: 500 }}>{project.name}</span>
            {" · "}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {project.key}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && (
            <Badge size="xs" tone="warning">
              {T("Kaydedilmemiş", "Unsaved")}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={14} />}
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            {T("Geri", "Back")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Copy size={14} />}
            disabled
            title={T("Çoğalt — yakında", "Duplicate — soon")}
          >
            {T("Çoğalt", "Duplicate")}
          </Button>
          <Tooltip
            text={
              !canEdit
                ? T(
                    "Düzenleme yetkiniz yok.",
                    "You don't have edit permission.",
                  )
                : T("Kaydet", "Save")
            }
          >
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              disabled={!canEdit}
            >
              {T("Kaydet", "Save")}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Top toolbar — mode + template + undo/redo + zoom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleModeChange}
          size="sm"
        />
        <span
          style={{ height: 18, width: 1, background: "var(--border)" }}
          aria-hidden
        />
        <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          {T("Şablon:", "Template:")}{" "}
          <span style={{ color: "var(--fg)", fontWeight: 500 }}>
            {project.methodology?.toLowerCase() ?? "-"}
          </span>
        </span>
        <div style={{ flex: 1 }} />
        <Button
          variant="ghost"
          size="sm"
          icon={<Undo2 size={14} />}
          disabled
          title={T("Geri Al — Plan 12-08", "Undo — Plan 12-08")}
        >
          {T("Geri Al", "Undo")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Redo2 size={14} />}
          disabled
          title={T("Yinele — Plan 12-08", "Redo — Plan 12-08")}
        >
          {T("Yinele", "Redo")}
        </Button>
        <span
          style={{ height: 18, width: 1, background: "var(--border)" }}
          aria-hidden
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
            minWidth: 36,
            textAlign: "center",
          }}
        >
          100%
        </span>
      </div>

      {/* Body row: canvas + right panel */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--radius)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          background: "var(--surface)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            display: "flex",
          }}
        >
          <ModeBanner mode={workflow.mode} />
          <WorkflowCanvas
            nodes={[]}
            edges={[]}
            readOnly={!canEdit}
            showMiniMap={false}
            onNodeClick={(_e, node) =>
              setSelected({ type: "node", id: String(node.id) })
            }
            onEdgeClick={(_e, edge) =>
              setSelected({ type: "edge", id: String(edge.id) })
            }
          />
          <BottomToolbar />
          <MinimapWrapper />
        </div>
        <RightPanel
          workflow={workflow}
          selected={selected}
          onWorkflowChange={handleWorkflowChange}
        />
      </div>
    </div>
  )
}
