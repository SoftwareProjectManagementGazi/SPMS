"use client"

// Task Create Modal — Phase 11 Plan 02 (TASK-01)
// Ships all 15 prototype fields from New_Frontend/src/pages/create-task-modal.jsx
// (project, task type, parent, title, description, priority, due, assignee, cycle,
// points, phase, labels, recurring freq/end). Conditional field visibility per
// methodology matrix (D-44 / D-45) and per-project enable_phase_assignment (D-40).
//
// Behavior contract:
//   - D-01: Opens via useTaskModal().openTaskModal() — no local open/close state
//   - D-02: No draft persistence; close discards
//   - D-03: On success → toast + invalidate ["tasks"] + close
//   - D-04: Required = title + projectId (others optional)
//   - D-05: All prototype fields ship
//   - D-06: Esc closes; Ctrl/Cmd+Enter submits when valid; autofocus on Title
//
// Style:
//   - Per D-01: no shadcn/ui; prototype style tokens only (inline style={})
//   - Per D-02: token names copied directly from prototype
//   - Inputs use inset 1px border + surface-2 bg, radius-sm, 34px height, 13px

import * as React from "react"
import { X, Bug, Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Kbd, SegmentedControl, Collapsible, Toggle, Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useTaskModal } from "@/context/task-modal-context"
import { useProjects } from "@/hooks/use-projects"
import { useCreateTask, useTasks } from "@/hooks/use-tasks"
import { useProjectLabels, useCreateLabel } from "@/hooks/use-labels"
import { useToast } from "@/components/toast"
import { resolveCycleLabel, isCycleFieldEnabled } from "@/lib/methodology-matrix"

type TaskType = "task" | "subtask" | "bug"
type Priority = "low" | "medium" | "high" | "critical"

// ---- Styles ----------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "oklch(0 0 0 / 0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  animation: "fadeIn 0.15s ease",
}

const cardStyle: React.CSSProperties = {
  width: 540,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "85vh",
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow-xl)",
  display: "flex",
  flexDirection: "column",
  animation: "fadeIn 0.12s ease",
  overflow: "hidden",
}

const inputStyle: React.CSSProperties = {
  height: 32,
  padding: "0 8px",
  fontSize: 13,
  background: "var(--surface-2)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  width: "100%",
  // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
  border: "none",
  fontFamily: "var(--font-sans)",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 28,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 6,
}

// ---- ModalField wrapper ----------------------------------------------------

interface ModalFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  helper?: string
}
function ModalField({ label, required, children, helper }: ModalFieldProps) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--priority-critical)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>{helper}</div>
      )}
    </div>
  )
}

// ---- Modal ------------------------------------------------------------------

export function TaskCreateModal() {
  const { isOpen, defaults, closeTaskModal } = useTaskModal()
  const { language: lang } = useApp()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const titleRef = React.useRef<HTMLInputElement>(null)

  // Form state — all reset on open
  const [projectId, setProjectId] = React.useState<number | null>(null)
  const [taskType, setTaskType] = React.useState<TaskType>("task")
  const [parentTaskId, setParentTaskId] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [priority, setPriority] = React.useState<Priority>("medium")
  const [assigneeId, setAssigneeId] = React.useState<number | null>(null)
  const [dueDate, setDueDate] = React.useState("")
  const [cycleId, setCycleId] = React.useState<number | null>(null)
  const [phaseId, setPhaseId] = React.useState<string | null>(null)
  const [points, setPoints] = React.useState<string>("")
  const [tagInput, setTagInput] = React.useState("")
  const [selectedLabels, setSelectedLabels] = React.useState<number[]>([])
  const [recurringOn, setRecurringOn] = React.useState(false)
  const [recurringFreq, setRecurringFreq] = React.useState("weekly")
  const [recurringEnd, setRecurringEnd] = React.useState("never")

  // Queries — gated so they only run when modal is open (stale-while-revalidate)
  const { data: projects = [] } = useProjects()
  const { data: parentCandidates = [] } = useTasks(
    taskType === "subtask" ? projectId : null,
  )
  const { data: projectLabels = [] } = useProjectLabels(projectId)
  const createTask = useCreateTask()
  const createLabel = useCreateLabel(projectId ?? 0)

  const selectedProject = projects.find((p) => p.id === projectId) ?? null

  // Methodology-driven visibility for cycle + phase rows
  const cycleLabel = selectedProject ? resolveCycleLabel(selectedProject, lang) : null
  const cycleEnabled = selectedProject ? isCycleFieldEnabled(selectedProject.methodology) : false
  // cycleLabel === null means field is hidden entirely (Kanban per D-45)
  const showCycleField = cycleLabel !== null
  const phaseEnabled = !!(
    (selectedProject?.processConfig as Record<string, unknown> | null)?.enable_phase_assignment
  )
  const phaseNodes =
    ((selectedProject?.processConfig as
      | { workflow?: { nodes?: Array<{ id: string; name: string }> } }
      | null)?.workflow?.nodes) ?? []

  // Seed defaults + reset on each open (D-01, D-07 inversion, subtask Ekle flow)
  React.useEffect(() => {
    if (!isOpen) return
    setProjectId(defaults?.defaultProjectId ?? null)
    setTaskType(defaults?.defaultType ?? "task")
    setParentTaskId(defaults?.defaultParentId ?? null)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setAssigneeId(null)
    setDueDate("")
    setCycleId(null)
    setPhaseId(null)
    setPoints("")
    setTagInput("")
    setSelectedLabels([])
    setRecurringOn(false)
    setRecurringFreq("weekly")
    setRecurringEnd("never")
    // Autofocus the Title field (D-06)
    const t = setTimeout(() => titleRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen, defaults])

  const canSubmit =
    title.trim().length > 0 && projectId !== null && !createTask.isPending

  const handleClose = React.useCallback(() => {
    closeTaskModal() // D-02: no draft persistence
  }, [closeTaskModal])

  const handleSubmit = React.useCallback(() => {
    if (!canSubmit || projectId === null) return
    createTask.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        description: description || undefined,
        priority,
        assignee_id: assigneeId,
        parent_task_id: taskType === "subtask" ? parentTaskId : null,
        cycle_id: showCycleField && cycleEnabled ? cycleId : null,
        phase_id: phaseEnabled ? phaseId : null,
        points: points ? Number(points) : null,
        due: dueDate || null,
        type: taskType,
        label_ids: selectedLabels,
        recurring: recurringOn
          ? { frequency: recurringFreq, end: recurringEnd }
          : null,
      },
      {
        onSuccess: () => {
          // D-03 post-submit: close → toast → invalidate
          showToast({
            variant: "success",
            message: lang === "tr" ? "Görev oluşturuldu" : "Task created",
          })
          qc.invalidateQueries({ queryKey: ["tasks"] })
          qc.invalidateQueries({ queryKey: ["projects", projectId] })
          closeTaskModal()
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail
          showToast({
            variant: "error",
            message:
              msg ??
              (lang === "tr" ? "Görev oluşturulamadı" : "Failed to create task"),
          })
        },
      },
    )
  }, [
    canSubmit,
    projectId,
    title,
    description,
    priority,
    assigneeId,
    taskType,
    parentTaskId,
    showCycleField,
    cycleEnabled,
    cycleId,
    phaseEnabled,
    phaseId,
    points,
    dueDate,
    selectedLabels,
    recurringOn,
    recurringFreq,
    recurringEnd,
    createTask,
    showToast,
    lang,
    qc,
    closeTaskModal,
  ])

  // Esc closes; Ctrl/Cmd+Enter submits (D-06)
  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, handleClose, handleSubmit])

  function addLabelFromInput() {
    const name = tagInput.trim()
    if (!name || !projectId) return
    const existing = projectLabels.find(
      (l) => l.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      if (!selectedLabels.includes(existing.id)) {
        setSelectedLabels((prev) => [...prev, existing.id])
      }
      setTagInput("")
    } else {
      createLabel.mutate(
        { name },
        {
          onSuccess: (label) => {
            setSelectedLabels((prev) => [...prev, label.id])
            setTagInput("")
          },
        },
      )
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>
            {lang === "tr" ? "Görev Oluştur" : "Create Task"}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              color: "var(--fg-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div
          style={{
            padding: 20,
            gap: 12,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Project (required) */}
          <ModalField label={lang === "tr" ? "Proje" : "Project"} required>
            <select
              aria-label={lang === "tr" ? "Proje" : "Project"}
              value={projectId ?? ""}
              onChange={(e) =>
                setProjectId(e.target.value ? Number(e.target.value) : null)
              }
              style={{
                ...selectStyle,
                opacity: defaults?.defaultProjectId ? 0.7 : 1,
              }}
              disabled={!!defaults?.defaultProjectId}
            >
              <option value="">
                {lang === "tr" ? "Proje seçin…" : "Select project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} · {p.name}
                </option>
              ))}
            </select>
          </ModalField>

          {/* Task type */}
          <ModalField label={lang === "tr" ? "Görev Türü" : "Task Type"}>
            <SegmentedControl
              options={[
                { id: "task", label: lang === "tr" ? "Görev" : "Task" },
                { id: "subtask", label: lang === "tr" ? "Alt Görev" : "Subtask" },
                { id: "bug", label: lang === "tr" ? "Hata" : "Bug" },
              ]}
              value={taskType}
              onChange={(v) => setTaskType(v as TaskType)}
            />
          </ModalField>

          {/* Parent task (subtask only) */}
          {taskType === "subtask" && (
            <ModalField label={lang === "tr" ? "Ana Görev" : "Parent Task"}>
              <select
                aria-label={lang === "tr" ? "Ana Görev" : "Parent Task"}
                value={parentTaskId ?? ""}
                onChange={(e) =>
                  setParentTaskId(e.target.value ? Number(e.target.value) : null)
                }
                style={selectStyle}
              >
                <option value="">
                  {lang === "tr" ? "Ana görev seçin…" : "Select parent…"}
                </option>
                {parentCandidates
                  .filter((t) => t.type !== "subtask")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.key} · {t.title}
                    </option>
                  ))}
              </select>
            </ModalField>
          )}

          {/* Title (required, autofocus) */}
          <ModalField label={lang === "tr" ? "Başlık" : "Title"} required>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              {taskType === "bug" && (
                <Bug
                  size={14}
                  color="var(--priority-critical)"
                  style={{
                    position: "absolute",
                    left: 10,
                    pointerEvents: "none",
                  }}
                />
              )}
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === "tr" ? "Kısa, net başlık" : "Short, clear title"
                }
                style={{
                  ...inputStyle,
                  paddingLeft: taskType === "bug" ? 30 : 12,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              />
            </div>
          </ModalField>

          {/* Description */}
          <ModalField label={lang === "tr" ? "Açıklama" : "Description"}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                lang === "tr" ? "Detayları ekleyin…" : "Add details…"
              }
              style={{
                ...inputStyle,
                height: "auto",
                padding: "8px 12px",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </ModalField>

          {/* 2-column grid: Priority / Due / Assignee / Cycle / Points / Phase */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <ModalField label={lang === "tr" ? "Öncelik" : "Priority"}>
              <select
                aria-label={lang === "tr" ? "Öncelik" : "Priority"}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={selectStyle}
              >
                <option value="low">
                  {lang === "tr" ? "Düşük" : "Low"}
                </option>
                <option value="medium">
                  {lang === "tr" ? "Orta" : "Medium"}
                </option>
                <option value="high">
                  {lang === "tr" ? "Yüksek" : "High"}
                </option>
                <option value="critical">
                  {lang === "tr" ? "Kritik" : "Critical"}
                </option>
              </select>
            </ModalField>

            <ModalField label={lang === "tr" ? "Bitiş Tarihi" : "Due Date"}>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </ModalField>

            <ModalField label={lang === "tr" ? "Atanan Kişi" : "Assignee"}>
              <select
                aria-label={lang === "tr" ? "Atanan Kişi" : "Assignee"}
                value={assigneeId ?? ""}
                onChange={(e) =>
                  setAssigneeId(e.target.value ? Number(e.target.value) : null)
                }
                style={selectStyle}
              >
                <option value="">
                  {lang === "tr" ? "Atanmamış" : "Unassigned"}
                </option>
                {/* Phase 11: placeholder member list using the project manager + current
                    user. Real per-project member picker lands in Plan 11-04 Members tab.
                    Filters out duplicate entries when user is also the manager. */}
                {selectedProject?.managerId != null && (
                  <option value={selectedProject.managerId}>
                    {selectedProject.managerName ??
                      `User ${selectedProject.managerId}`}
                  </option>
                )}
                {user &&
                  Number(user.id) !== selectedProject?.managerId && (
                    <option value={user.id}>{user.name}</option>
                  )}
              </select>
            </ModalField>

            {/* Cycle — hidden entirely for Kanban (D-45);
                disabled w/ helper for non-Scrum (D-44) */}
            {showCycleField && (
              <ModalField
                label={cycleLabel ?? ""}
                helper={
                  !cycleEnabled &&
                  selectedProject?.methodology !== "WATERFALL"
                    ? lang === "tr"
                      ? "Faz 12'de aktive edilecek"
                      : "Activated in Phase 12"
                    : undefined
                }
              >
                <select
                  aria-label={cycleLabel ?? "Cycle"}
                  value={cycleId ?? ""}
                  onChange={(e) =>
                    setCycleId(e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={!cycleEnabled}
                  style={{
                    ...selectStyle,
                    opacity: cycleEnabled ? 1 : 0.5,
                  }}
                >
                  <option value="">
                    {lang === "tr" ? "Seçin…" : "Select…"}
                  </option>
                  {/* Scrum sprint list wires in Plan 11-05 — ships empty here */}
                </select>
              </ModalField>
            )}

            <ModalField label={lang === "tr" ? "Puan" : "Points"}>
              <input
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="SP"
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </ModalField>

            {/* Phase — only when project has enable_phase_assignment=true (D-40) */}
            {phaseEnabled && (
              <ModalField label={lang === "tr" ? "Faz" : "Phase"}>
                <select
                  aria-label={lang === "tr" ? "Faz" : "Phase"}
                  value={phaseId ?? ""}
                  onChange={(e) => setPhaseId(e.target.value || null)}
                  style={selectStyle}
                >
                  <option value="">
                    {lang === "tr" ? "Faz seçin…" : "Select phase…"}
                  </option>
                  {phaseNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </ModalField>
            )}
          </div>

          {/* Labels — project-scoped with auto-create on Enter (D-51) */}
          <ModalField label={lang === "tr" ? "Etiketler" : "Labels"}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 6,
              }}
            >
              {selectedLabels.map((id) => {
                const l = projectLabels.find((pl) => pl.id === id)
                if (!l) return null
                return (
                  <Badge
                    key={id}
                    size="xs"
                    tone="primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {l.name}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLabels((prev) => prev.filter((x) => x !== id))
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "inherit",
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${l.name}`}
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addLabelFromInput()
                  }
                }}
                placeholder={
                  lang === "tr"
                    ? "Etiket yazın ve Enter'a basın"
                    : "Type label and press Enter"
                }
                style={inputStyle}
                disabled={!projectId}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={addLabelFromInput}
                disabled={!projectId || !tagInput.trim()}
                icon={<Plus size={14} />}
              >
                {lang === "tr" ? "Ekle" : "Add"}
              </Button>
            </div>
          </ModalField>

          {/* Recurring — Collapsible (closed by default) */}
          <Collapsible
            title={lang === "tr" ? "Tekrarlayan Görev" : "Recurring Task"}
            defaultOpen={false}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "10px 0 4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 12.5 }}>
                  {lang === "tr" ? "Tekrarlayan görev" : "Recurring task"}
                </span>
                <Toggle on={recurringOn} onChange={setRecurringOn} />
              </div>
              {recurringOn && (
                <>
                  <ModalField label={lang === "tr" ? "Sıklık" : "Frequency"}>
                    <SegmentedControl
                      size="xs"
                      options={[
                        {
                          id: "daily",
                          label: lang === "tr" ? "Günlük" : "Daily",
                        },
                        {
                          id: "weekly",
                          label: lang === "tr" ? "Haftalık" : "Weekly",
                        },
                        {
                          id: "monthly",
                          label: lang === "tr" ? "Aylık" : "Monthly",
                        },
                      ]}
                      value={recurringFreq}
                      onChange={setRecurringFreq}
                    />
                  </ModalField>
                  <ModalField label={lang === "tr" ? "Bitiş" : "End"}>
                    <SegmentedControl
                      size="xs"
                      options={[
                        {
                          id: "never",
                          label: lang === "tr" ? "Asla" : "Never",
                        },
                        {
                          id: "count",
                          label: lang === "tr" ? "Sayım" : "Count",
                        },
                        {
                          id: "date",
                          label: lang === "tr" ? "Tarih" : "Date",
                        },
                      ]}
                      value={recurringEnd}
                      onChange={setRecurringEnd}
                    />
                  </ModalField>
                </>
              )}
            </div>
          </Collapsible>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {lang === "tr" ? "Vazgeç" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {lang === "tr" ? "Oluştur" : "Create"}
          </Button>
          <Kbd>⌘↵</Kbd>
        </div>
      </div>
    </div>
  )
}
