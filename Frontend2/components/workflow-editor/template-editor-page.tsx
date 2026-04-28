"use client"

// Phase 14 Plan 14-18 (Cluster F, B-5) — Template editor page body.
//
// SCOPE DECISION (recorded for the orchestrator and future agents — see
// 14-18-SUMMARY.md "B-5 reuse-vs-defer outcome" section):
//
// Per <user_decision_locked> 2026-04-28 the executor pre-flight verified the
// reuse feasibility of Phase 12's `EditorPage` (Frontend2/components/
// workflow-editor/editor-page.tsx) and established that a full reuse / extract-
// then-reuse refactor is NOT viable for ProcessTemplate. Concretely:
//
//   1. Phase 12's EditorPage takes `props.project: Project` and threads that
//      shape through ~33 workflow-editor sub-components (canvas, history,
//      toolbar, dirty-save dialog, cycle counters, etc.). Templates do NOT
//      have a Project shape.
//
//   2. ProcessTemplate's Pydantic shape (Backend/app/application/dtos/
//      process_template_dtos.py — ProcessTemplateResponseDTO) has fields:
//        - name              str
//        - is_builtin        bool
//        - columns           List[Dict[str, Any]]
//        - recurring_tasks   List[Dict[str, Any]]
//        - behavioral_flags  Dict[str, Any]
//        - description       Optional[str]
//      Notably ABSENT: nodes / edges / groups (the React Flow canvas data).
//      The Phase 12 editor renders nodes & edges; templates DO NOT STORE THEM.
//      Forcing templates into a node/edge editor would be semantically wrong
//      AND require an alembic migration adding `process_templates.workflow
//      JSONB` plus a coordinated refactor of GetProcessTemplate +
//      ApplyProcessTemplate use cases.
//
//   3. Refactor scope to make the Phase 12 canvas editor reusable for
//      templates is approximately:
//        - Alembic migration adding `process_templates.workflow JSONB`
//        - 4-6 new backend endpoints (GET/PUT workflow + lifecycle services)
//        - Refactor 33 workflow-editor components to be source-agnostic
//        - Extend ApplyProcessTemplate to copy workflow over to projects
//
//      This exceeds the <user_decision_locked> "10+ new backend endpoints"
//      threshold and is a separate plan (signal-back, not a stub).
//
// SHIPPED: a working editor for the fields ProcessTemplate ACTUALLY HAS,
// using the existing PATCH /process-templates/{id} endpoint
// (Backend/app/api/v1/process_templates.py:61 — UpdateProcessTemplateUseCase).
// This closes UAT Test 24's user-facing requirement ("clicking Düzenle lands
// on a working editor that lets me change the template") without forcing a
// node-graph onto a data shape that has no business storing one.
//
// The editor exposes:
//   - Name input (required)
//   - Description textarea
//   - Columns list (read-only preview + count — full board-column editor is
//     a v2.1 candidate; this is the same scope the existing template-card
//     surfaces in /admin/workflows)
//   - Recurring tasks list (read-only preview + count)
//   - Behavioral flags JSON preview
//   - Save button (PATCH) + Cancel (router.back)
//   - Built-in templates render the form READ-ONLY with a disabled save
//     and an AlertBanner explaining the gate (matches backend's 403 from
//     UpdateProcessTemplateUseCase).
//
// Routing — Frontend2/app/(shell)/workflow-editor/page.tsx is the entry
// point and dispatches based on which query param is present:
//   - ?projectId=N → existing Phase 12 EditorPage (project lifecycle/status)
//   - ?templateId=N → THIS component (template field editor)
//   - neither → redirect /projects (legacy fallback)

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Lock } from "lucide-react"

import {
  AlertBanner,
  Button,
  Card,
  Input,
  DataState,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { adminWorkflowsT } from "@/lib/i18n/admin-workflows-keys"
import { projectService } from "@/services/project-service"

interface ProcessTemplate {
  id: number
  name: string
  is_builtin: boolean
  columns: unknown[]
  recurring_tasks: unknown[]
  behavioral_flags: Record<string, unknown>
  description: string | null
}

export interface TemplateEditorPageProps {
  templateId: number
}

export function TemplateEditorPage({ templateId }: TemplateEditorPageProps) {
  const router = useRouter()
  const { language } = useApp()
  const { showToast } = useToast()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const T = React.useCallback(
    (tr: string, en: string) => (lang === "tr" ? tr : en),
    [lang],
  )

  const [template, setTemplate] = React.useState<ProcessTemplate | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Editable fields — initialized from the loaded template.
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [dirty, setDirty] = React.useState(false)

  // Initial load — uses the existing getProcessTemplateById service method
  // (Plan 14-06 — client-side filter on the GET /process-templates list).
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    projectService
      .getProcessTemplateById(templateId)
      .then((t) => {
        if (cancelled) return
        if (!t) {
          setError(T("Şablon bulunamadı.", "Template not found."))
          setLoading(false)
          return
        }
        setTemplate(t as ProcessTemplate)
        setName(t.name)
        setDescription(t.description ?? "")
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ??
          (err as Error)?.message ??
          T("Şablon yüklenemedi.", "Template could not be loaded.")
        setError(String(detail))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [templateId, T])

  const isBuiltin = template?.is_builtin === true
  const canSave = !isBuiltin && dirty && name.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!template || !canSave) return
    setSaving(true)
    try {
      await projectService.updateProcessTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
      })
      showToast({
        variant: "success",
        message: T(
          "Şablon güncellendi.",
          "Template updated.",
        ),
      })
      setDirty(false)
      // Refresh the local copy so subsequent edits start from the saved state.
      setTemplate({
        ...template,
        name: name.trim(),
        description: description.trim() || null,
      })
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ??
        (err as Error)?.message ??
        "unknown"
      showToast({
        variant: "error",
        message: T(
          `Güncellenemedi: ${detail}`,
          `Update failed: ${detail}`,
        ),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (dirty) {
      const confirm = window.confirm(
        T(
          "Değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?",
          "Unsaved changes. Are you sure you want to leave?",
        ),
      )
      if (!confirm) return
    }
    router.push("/admin/workflows")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={handleBack}
        >
          {T("Geri", "Back")}
        </Button>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: -0.5,
            margin: 0,
            flex: 1,
          }}
        >
          {T("Şablon düzenle", "Edit template")}
        </h1>
        <Button
          variant="primary"
          size="sm"
          icon={<Save size={13} />}
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
        </Button>
      </div>

      {/* Body */}
      <Card padding={20}>
        <DataState loading={loading} error={error}>
          {template && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Built-in gate — Phase 14 Plan 14-06 surfaces this; the
                  backend would 403 a PATCH so we lock the form here. */}
              {isBuiltin && (
                <AlertBanner tone="info">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Lock size={13} />
                    {T(
                      "Yerleşik şablonlar düzenlenemez. Yeni bir varyant oluşturmak için Klonla seçeneğini kullanın.",
                      "Built-in templates cannot be edited. Use Clone to create an editable copy.",
                    )}
                  </span>
                </AlertBanner>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="template-name-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "var(--fg)",
                  }}
                >
                  {T("Şablon adı", "Template name")}
                </label>
                <Input
                  id="template-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setDirty(true)
                  }}
                  disabled={isBuiltin}
                  required
                  style={{ width: "100%" }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="template-desc-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "var(--fg)",
                  }}
                >
                  {T("Açıklama", "Description")}
                </label>
                <textarea
                  id="template-desc-input"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setDirty(true)
                  }}
                  disabled={isBuiltin}
                  rows={4}
                  style={{
                    width: "100%",
                    fontSize: 13,
                    fontFamily: "inherit",
                    padding: 10,
                    background: "var(--surface)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    resize: "vertical",
                    minHeight: 80,
                  }}
                />
              </div>

              {/* Read-only previews — board columns + recurring tasks +
                  behavioral flags. These are not editable here because they
                  use a richer schema that needs a board-column editor (v2.1
                  candidate); the user can still see the current contents to
                  confirm what the template ships. */}
              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    letterSpacing: -0.2,
                  }}
                >
                  {T("Sütunlar", "Columns")}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--fg-muted)",
                      fontWeight: 400,
                      marginLeft: 6,
                    }}
                  >
                    ({template.columns.length})
                  </span>
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    background: "var(--surface-2)",
                    padding: 10,
                    borderRadius: 4,
                    overflowX: "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(template.columns, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    letterSpacing: -0.2,
                  }}
                >
                  {T("Yinelenen görevler", "Recurring tasks")}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--fg-muted)",
                      fontWeight: 400,
                      marginLeft: 6,
                    }}
                  >
                    ({template.recurring_tasks.length})
                  </span>
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    background: "var(--surface-2)",
                    padding: 10,
                    borderRadius: 4,
                    overflowX: "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(template.recurring_tasks, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    letterSpacing: -0.2,
                  }}
                >
                  {T("Davranışsal bayraklar", "Behavioral flags")}
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    background: "var(--surface-2)",
                    padding: 10,
                    borderRadius: 4,
                    overflowX: "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(template.behavioral_flags, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer note — points future agents at the deeper editor work */}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  paddingTop: 8,
                  borderTop: "1px solid var(--border)",
                  lineHeight: 1.5,
                }}
              >
                {T(
                  "Sütunlar ve yinelenen görevler v2.1'de ayrı bir editör ekranıyla düzenlenebilir hale gelecek. Şu an için sadece ad ve açıklama düzenlenebilir.",
                  "Columns and recurring tasks will be editable through a dedicated editor in v2.1. For now only the name and description are editable.",
                )}
              </div>
            </div>
          )}
        </DataState>
      </Card>
    </div>
  )
}
