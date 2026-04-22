"use client"

// DependenciesSection — CRUD for task dependencies per D-49.
//
// Backend shape note: GET /tasks/{id}/dependencies returns a GROUPED response
//   { blocks: [...], blocked_by: [...] }
// where the grouping key is the EDGE DIRECTION (not the stored dependency_type).
// - "blocks" = outgoing edges (this task blocks another)
// - "blocked_by" = incoming edges (another task blocks this one)
// The backend does not materialize a third group for "relates_to" in its
// list endpoint; a relates_to row would not show up in either group. For
// that reason this UI ships only the two directions that actually round-
// trip through the API end-to-end. A future backend change could add a
// third direction group, after which the picker can grow an option.
//
// Add uses the backend DTO field name `dependency_type`. taskService
// (Plan 01) forwards the `type` argument as dependency_type.
//
// T-11-09-03 IDOR: picker list is scoped to the current project's tasks
// (useTasks(projectId)), so a user cannot target an arbitrary task id.
// Backend re-validates project membership too (double defense, accepted).

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Lock, AlertCircle, X, Plus } from "lucide-react"
import {
  Button,
  Card,
  Input,
  SegmentedControl,
  Section,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { taskService, type Task } from "@/services/task-service"
import { useTasks } from "@/hooks/use-tasks"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"

type DepDirection = "blocks" | "blocked_by"

const TYPE_LABELS_TR: Record<DepDirection, string> = {
  blocks: "Engelliyor",
  blocked_by: "Engellemekte",
}
const TYPE_LABELS_EN: Record<DepDirection, string> = {
  blocks: "Blocks",
  blocked_by: "Blocked by",
}

interface DepSummary {
  id: number
  task_id: number
  depends_on_id: number
  dependency_type: string
  depends_on_key?: string | null
  depends_on_title?: string | null
}

interface DepRow extends DepSummary {
  direction: DepDirection
  // Display-side convenience: for "blocked_by" rows, the relevant other task
  // is the source (task_id); for "blocks" rows, it's the target.
  otherTaskId: number
  otherKey?: string | null
  otherTitle?: string | null
}

interface DependenciesSectionProps {
  taskId: number
  projectId: number
}

export function DependenciesSection({
  taskId,
  projectId,
}: DependenciesSectionProps) {
  const { language: lang } = useApp()
  const router = useRouter()
  const { showToast } = useToast()
  const qc = useQueryClient()

  // Raw grouped response — flatten for rendering
  const { data: grouped } = useQuery<{
    blocks?: DepSummary[]
    blocked_by?: DepSummary[]
  }>({
    queryKey: ["dependencies", taskId],
    queryFn: () =>
      taskService.listDependencies(taskId) as Promise<{
        blocks?: DepSummary[]
        blocked_by?: DepSummary[]
      }>,
  })

  const deps: DepRow[] = React.useMemo(() => {
    const blocks = (grouped?.blocks ?? []).map<DepRow>((d) => ({
      ...d,
      direction: "blocks",
      otherTaskId: d.depends_on_id,
      otherKey: d.depends_on_key,
      otherTitle: d.depends_on_title,
    }))
    const blockedBy = (grouped?.blocked_by ?? []).map<DepRow>((d) => ({
      ...d,
      direction: "blocked_by",
      otherTaskId: d.task_id,
      otherKey: d.depends_on_key,
      otherTitle: d.depends_on_title,
    }))
    return [...blocks, ...blockedBy]
  }, [grouped])

  const { data: projectTasks = [] } = useTasks(projectId)

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickType, setPickType] = React.useState<DepDirection>("blocks")
  const [pickQuery, setPickQuery] = React.useState("")
  const [pickId, setPickId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const add = useMutation({
    mutationFn: ({
      depId,
      type,
    }: {
      depId: number
      type: DepDirection
    }) =>
      // blocks direction: taskId blocks depId (source: taskId, target: depId)
      // blocked_by direction: depId blocks taskId (source: depId, target: taskId)
      type === "blocks"
        ? taskService.addDependency(taskId, depId, "blocks")
        : taskService.addDependency(depId, taskId, "blocks"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dependencies", taskId] })
      setPickerOpen(false)
      setPickQuery("")
      setPickId(null)
    },
    onError: (err: unknown) =>
      showToast({
        variant: "error",
        message:
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ??
          (lang === "tr"
            ? "Bağımlılık eklenemedi"
            : "Failed to add dependency"),
      }),
  })

  const removeDep = useMutation({
    mutationFn: (row: DepRow) =>
      taskService.removeDependency(row.task_id, row.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dependencies", taskId] })
      setDeleteId(null)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr" ? "Silme başarısız" : "Failed to remove dependency",
      }),
  })

  const pickCandidates = React.useMemo(() => {
    const linkedIds = new Set(deps.map((d) => d.otherTaskId))
    return (projectTasks as Task[])
      .filter(
        (t) =>
          t.id !== taskId &&
          !linkedIds.has(t.id) &&
          (pickQuery.trim()
            ? t.title.toLowerCase().includes(pickQuery.toLowerCase()) ||
              t.key.toLowerCase().includes(pickQuery.toLowerCase())
            : true),
      )
      .slice(0, 8)
  }, [projectTasks, pickQuery, taskId, deps])

  const iconFor = (dir: DepDirection) =>
    dir === "blocks" ? (
      <Lock size={12} color="var(--priority-critical)" />
    ) : (
      <AlertCircle size={12} color="var(--priority-high)" />
    )

  const labels = lang === "tr" ? TYPE_LABELS_TR : TYPE_LABELS_EN

  const rowToDelete = deps.find((d) => d.id === deleteId) ?? null

  return (
    <Section
      title={lang === "tr" ? "Bağımlılıklar" : "Dependencies"}
      style={{ marginTop: 20 }}
    >
      <Card padding={0}>
        {deps.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 12,
            }}
          >
            {lang === "tr" ? "Bağımlılık yok" : "No dependencies"}
          </div>
        ) : (
          deps.map((d, i) => (
            <div
              key={`${d.direction}-${d.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "var(--surface-2)",
                borderBottom:
                  i < deps.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                fontSize: 12,
              }}
            >
              {iconFor(d.direction)}
              <span
                style={{ fontSize: 11.5, color: "var(--fg-muted)" }}
              >
                {labels[d.direction]}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                }}
              >
                {d.otherKey ?? `#${d.otherTaskId}`}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(
                    `/projects/${projectId}/tasks/${d.otherTaskId}`,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(
                      `/projects/${projectId}/tasks/${d.otherTaskId}`,
                    )
                  }
                }}
                style={{
                  flex: 1,
                  cursor: "pointer",
                  color: "var(--fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.otherTitle ?? `Task ${d.otherTaskId}`}
              </span>
              <button
                type="button"
                onClick={() => setDeleteId(d.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                }}
                aria-label="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}

        <div
          style={{
            padding: 8,
            borderTop: deps.length > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <Button
            size="xs"
            variant="ghost"
            icon={<Plus size={12} />}
            onClick={() => setPickerOpen((v) => !v)}
          >
            {lang === "tr" ? "Bağımlılık ekle" : "Add dependency"}
          </Button>
        </div>

        {pickerOpen && (
          <div
            style={{
              padding: 12,
              background: "var(--surface)",
              boxShadow: "var(--shadow-lg)",
              borderTop: "1px solid var(--border)",
              zIndex: 50,
            }}
          >
            <SegmentedControl
              options={[
                { id: "blocks", label: labels.blocks },
                { id: "blocked_by", label: labels.blocked_by },
              ]}
              value={pickType}
              onChange={(v) => setPickType(v as DepDirection)}
            />
            <Input
              value={pickQuery}
              onChange={(e) => setPickQuery(e.target.value)}
              placeholder={lang === "tr" ? "Görev ara…" : "Search task…"}
              style={{ marginTop: 8, display: "flex" }}
            />
            <div
              style={{
                maxHeight: 180,
                overflowY: "auto",
                marginTop: 6,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {pickCandidates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPickId(t.id)}
                  style={{
                    display: "flex",
                    gap: 6,
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: 12,
                    background:
                      pickId === t.id
                        ? "var(--surface-2)"
                        : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--fg)",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {t.key}
                  </span>
                  <span>{t.title}</span>
                </button>
              ))}
              {pickCandidates.length === 0 && (
                <div
                  style={{
                    padding: 8,
                    fontSize: 11.5,
                    color: "var(--fg-subtle)",
                    textAlign: "center",
                  }}
                >
                  {lang === "tr" ? "Sonuç yok" : "No results"}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
                marginTop: 8,
              }}
            >
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setPickerOpen(false)
                  setPickId(null)
                }}
              >
                {lang === "tr" ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                size="xs"
                variant="primary"
                onClick={() =>
                  pickId != null &&
                  add.mutate({ depId: pickId, type: pickType })
                }
                disabled={pickId == null || add.isPending}
              >
                {lang === "tr" ? "Ekle" : "Add"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title={
          lang === "tr" ? "Bağımlılığı kaldır?" : "Remove dependency?"
        }
        body={
          lang === "tr"
            ? "Bu işlem geri alınamaz."
            : "This action cannot be undone."
        }
        confirmLabel={lang === "tr" ? "Kaldır" : "Remove"}
        cancelLabel={lang === "tr" ? "Vazgeç" : "Cancel"}
        onConfirm={() =>
          rowToDelete != null && removeDep.mutate(rowToDelete)
        }
        onCancel={() => setDeleteId(null)}
      />
    </Section>
  )
}
