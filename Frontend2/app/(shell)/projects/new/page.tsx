"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Card, Button } from "@/components/primitives"
import { useCreateProject, useProcessTemplates } from "@/hooks/use-projects"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"

const WIZARD_DRAFT_KEY = 'spms_wizard_draft'

interface WizardDraft {
  name: string
  key: string
  description: string
  startDate: string
  endDate: string
  templateId: number | null
  methodology: string
  columns: string[]
}

const wizInputStyle: React.CSSProperties = {
  height: 36,
  padding: "0 10px",
  fontSize: 13.5,
  background: "var(--surface-2)",
  border: 0,
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  fontFamily: "var(--font-sans)",
  width: "100%",
}

const STEP_LABELS_TR = ['Temel Bilgiler', 'Metodoloji', 'Yaşam Döngüsü', 'Yapılandırma']
const STEP_LABELS_EN = ['Basics', 'Methodology', 'Lifecycle', 'Configuration']

function StepIndicator({ currentStep, language }: { currentStep: number; language: string }) {
  const labels = language === 'tr' ? STEP_LABELS_TR : STEP_LABELS_EN

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {labels.map((label, i) => {
        const stepN = i + 1
        const isPast = currentStep > stepN
        const isCurrent = currentStep === stepN

        return (
          <React.Fragment key={stepN}>
            {i > 0 && (
              <div style={{
                flex: 1,
                height: 2,
                borderRadius: 1,
                margin: "0 8px",
                background: isPast
                  ? "var(--status-done)"
                  : isCurrent
                    ? "var(--primary)"
                    : "var(--border)",
                transition: "background 0.2s",
              }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: isPast
                  ? "var(--status-done)"
                  : isCurrent
                    ? "var(--primary)"
                    : "var(--surface-2)",
                color: (isPast || isCurrent) ? "var(--primary-fg)" : "var(--fg-muted)",
                boxShadow: isCurrent
                  ? "0 0 0 3px color-mix(in oklch, var(--primary) 20%, transparent)"
                  : isPast
                    ? "none"
                    : "inset 0 0 0 1px var(--border)",
                transition: "all 0.2s",
              }}>
                {isPast ? (
                  // Checkmark SVG instead of ✓ character for better rendering
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : stepN}
              </div>
              <span style={{
                fontSize: 12.5,
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? "var(--fg)" : "var(--fg-muted)",
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function WizardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useApp()
  const { showToast } = useToast()
  const { mutate: createProject, isPending } = useCreateProject()
  const { data: templates = [] } = useProcessTemplates()

  const step = Math.min(4, Math.max(1, Number(searchParams.get('step') ?? '1')))

  // Form state — Step 1
  const [name, setName] = React.useState('')
  const [key, setKey] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')

  // Form state — Step 2
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | null>(null)
  const [selectedMethodology, setSelectedMethodology] = React.useState('')

  // Form state — Step 4
  const [columns, setColumns] = React.useState<string[]>(['Yapılacak', 'Devam Ediyor', 'Bitti'])

  // D-21: Restore sessionStorage draft on mount
  React.useEffect(() => {
    const raw = typeof window !== 'undefined'
      ? sessionStorage.getItem(WIZARD_DRAFT_KEY)
      : null
    if (raw) {
      try {
        const draft: WizardDraft = JSON.parse(raw)
        if (draft.name) setName(draft.name)
        if (draft.key) setKey(draft.key)
        if (draft.description) setDescription(draft.description)
        if (draft.startDate) setStartDate(draft.startDate)
        if (draft.endDate) setEndDate(draft.endDate)
        if (draft.templateId) setSelectedTemplateId(draft.templateId)
        if (draft.methodology) setSelectedMethodology(draft.methodology)
        if (draft.columns?.length) setColumns(draft.columns)
      } catch {
        // Corrupt draft — ignore silently (T-10-07-02: no sensitive data at risk)
      }
    }
  }, [])

  // D-21: Save draft on any field change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft: WizardDraft = {
        name,
        key,
        description,
        startDate,
        endDate,
        templateId: selectedTemplateId,
        methodology: selectedMethodology,
        columns,
      }
      sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft))
    }
  }, [name, key, description, startDate, endDate, selectedTemplateId, selectedMethodology, columns])

  // D-17: Validation gates
  const step1Valid = name.trim().length > 0 && key.trim().length > 0
  const step2Valid = selectedTemplateId !== null || selectedMethodology !== ''
  const canProceed = step === 1 ? step1Valid : step === 2 ? step2Valid : true

  const advanceStep = () => {
    if (!canProceed) return
    router.push(`/projects/new?step=${step + 1}`)
  }

  const goBack = () => {
    if (step > 1) router.push(`/projects/new?step=${step - 1}`)
    else router.push('/projects')
  }

  // Find selected template object for Step 3 lifecycle preview (D-20)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedTemplate = (templates as any[]).find((t: any) => t.id === selectedTemplateId)

  const handleSubmit = () => {
    // Map template name to methodology enum value required by backend
    // (backend still uses methodology field — not dropped until migration 006)
    const templateNameLower = (selectedTemplate?.name ?? selectedMethodology ?? '').toLowerCase()
    const methodologyMap: Record<string, string> = {
      scrum: 'SCRUM',
      kanban: 'KANBAN',
      waterfall: 'WATERFALL',
    }
    const methodology = methodologyMap[templateNameLower] ?? 'SCRUM'

    createProject({
      key: key.toUpperCase(),
      name,
      description: description || undefined,
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || undefined,
      methodology,
      columns,
      process_config: {
        schema_version: 1,
        workflow: { mode: "flexible", nodes: [], edges: [], groups: [] },
      },
    }, {
      onSuccess: (project) => {
        // D-21: Clear draft on successful submit
        sessionStorage.removeItem(WIZARD_DRAFT_KEY)
        showToast({
          message: language === 'tr'
            ? `"${name}" projesi oluşturuldu.`
            : `Project "${name}" created.`,
          variant: 'success',
        })
        // D-18: Redirect to project detail
        router.push(`/projects/${project.id}`)
      },
      onError: () => {
        showToast({
          message: language === 'tr'
            ? 'Proje oluşturulamadı. Lütfen tekrar deneyin.'
            : 'Failed to create project. Please try again.',
          variant: 'error',
        })
      },
    })
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <StepIndicator currentStep={step} language={language} />

      {/* ─── Step 1: Temel Bilgiler ──────────────────────────────────────────── */}
      {step === 1 && (
        <Card padding={24}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {language === 'tr' ? 'Temel Bilgiler' : 'Basic Information'}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>
            {language === 'tr'
              ? 'Projenizin adı, anahtarı ve tarihlerini belirleyin.'
              : 'Set your project name, key and dates.'}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Project Name */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                {language === 'tr' ? 'Proje Adı' : 'Project Name'}{' '}
                <span style={{ color: "var(--priority-critical)" }}>*</span>
              </label>
              <input
                style={wizInputStyle}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={language === 'tr' ? 'Proje adı...' : 'Project name...'}
                autoFocus
              />
            </div>

            {/* Project Key — T-10-07-01: client enforces uppercase alphanumeric, max 8 chars */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                {language === 'tr' ? 'Proje Anahtarı' : 'Project Key'}{' '}
                <span style={{ color: "var(--priority-critical)" }}>*</span>
              </label>
              <input
                style={{ ...wizInputStyle, letterSpacing: 1 }}
                value={key}
                onChange={e =>
                  setKey(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 8)
                  )
                }
                placeholder="SPMS"
                maxLength={8}
              />
              <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 4 }}>
                {language === 'tr'
                  ? 'Görev anahtarları için kullanılır (ör. KEY-1, KEY-2)'
                  : 'Used for task keys (e.g. KEY-1, KEY-2)'}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                {language === 'tr' ? 'Açıklama' : 'Description'}
              </label>
              <textarea
                style={{
                  ...wizInputStyle,
                  height: 80,
                  resize: "vertical",
                  paddingTop: 8,
                  paddingBottom: 8,
                } as React.CSSProperties}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={language === 'tr' ? 'Proje açıklaması...' : 'Project description...'}
              />
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {language === 'tr' ? 'Başlangıç Tarihi' : 'Start Date'}
                </label>
                <input
                  type="date"
                  style={wizInputStyle}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {language === 'tr' ? 'Bitiş Tarihi' : 'End Date'}
                </label>
                <input
                  type="date"
                  style={wizInputStyle}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Step 2: Metodoloji ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {language === 'tr' ? 'Metodoloji Seçimi' : 'Choose Methodology'}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>
            {language === 'tr'
              ? 'Projeniz için bir yaşam döngüsü şablonu seçin. Daha sonra değiştirebilirsiniz.'
              : 'Choose a lifecycle template for your project. You can change it later.'}
          </div>

          {/* D-19: Dynamic templates from GET /process-templates, 3-per-row grid */}
          {(templates as any[]).length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--fg-muted)", fontSize: 13 }}>
              {language === 'tr' ? 'Şablonlar yükleniyor...' : 'Loading templates...'}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {(templates as any[]).map((template: any) => {
                const isSelected = selectedTemplateId === template.id
                return (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id)
                      setSelectedMethodology(template.name ?? '')
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <Card
                      interactive
                      padding={14}
                      style={{
                        boxShadow: isSelected
                          ? "0 0 0 2px var(--primary), var(--shadow)"
                          : "var(--shadow)",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{template.name}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--surface-2)",
                          color: "var(--fg-muted)",
                        }}>
                          {template.default_workflow?.mode ?? 'flexible'}
                        </span>
                      </div>
                      {template.description && (
                        <div style={{
                          fontSize: 12,
                          color: "var(--fg-muted)",
                          marginTop: 8,
                          lineHeight: 1.5,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}>
                          {template.description}
                        </div>
                      )}
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Step 3: Yaşam Döngüsü ───────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {language === 'tr' ? 'Yaşam Döngüsü' : 'Lifecycle'}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>
            {language === 'tr'
              ? 'Seçilen şablonun varsayılan yaşam döngüsü (salt okunur önizleme).'
              : 'Default lifecycle of the selected template (read-only preview).'}
          </div>

          {/* D-20: Read-only lifecycle preview */}
          <Card padding={24}>
            {!selectedTemplate ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--fg-muted)", fontSize: 13 }}>
                {language === 'tr' ? 'Önce metodoloji seçin.' : 'Select a methodology first.'}
              </div>
            ) : !(selectedTemplate.default_workflow?.nodes?.length) ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--fg-muted)", fontSize: 13 }}>
                {language === 'tr'
                  ? "Yaşam döngüsü daha sonra Settings'den yapılandırılabilir."
                  : "Lifecycle can be configured later from project Settings."}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(selectedTemplate.default_workflow.nodes as any[]).map((node: any, i: number) => (
                  <React.Fragment key={node.id ?? i}>
                    {i > 0 && (
                      <span style={{ color: "var(--fg-muted)", fontSize: 16 }}>→</span>
                    )}
                    <div style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--surface-2)",
                      fontSize: 13,
                      fontWeight: 500,
                      boxShadow: "inset 0 0 0 1px var(--border)",
                    }}>
                      {node.label ?? node.name ?? `Phase ${i + 1}`}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── Step 4: Yapılandırma ────────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {language === 'tr' ? 'Yapılandırma' : 'Configuration'}
          </div>

          {/* Board columns — maps to POST /projects columns[] field */}
          <Card padding={16}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              {language === 'tr' ? 'Board Kolonları' : 'Board Columns'}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {columns.map((col, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--fg-muted)", cursor: "grab", fontSize: 14, userSelect: "none" }}>
                    ⠿
                  </span>
                  <input
                    style={{ ...wizInputStyle, flex: 1 }}
                    value={col}
                    onChange={e =>
                      setColumns(prev => prev.map((c, idx) => idx === i ? e.target.value : c))
                    }
                  />
                  <input
                    type="number"
                    style={{ ...wizInputStyle, width: 60 }}
                    placeholder="WIP"
                    min={0}
                  />
                  <button
                    onClick={() => setColumns(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                      padding: 4,
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setColumns(prev => [...prev, language === 'tr' ? 'Yeni Kolon' : 'New Column'])
              }
              style={{
                fontSize: 12.5,
                color: "var(--primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              + {language === 'tr' ? 'Kolon Ekle' : 'Add Column'}
            </button>
          </Card>

          {/* Additional config note */}
          <Card padding={16}>
            <div style={{ fontSize: 13, color: "var(--fg-muted)", textAlign: "center", padding: 16 }}>
              {language === 'tr'
                ? "Ek yapılandırma seçenekleri proje oluşturulduktan sonra Settings'den yapılandırılabilir."
                : "Additional configuration options can be set from project Settings after creation."}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Footer navigation ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
        {step > 1 && (
          <Button variant="ghost" onClick={goBack}>
            {language === 'tr' ? 'Geri' : 'Back'}
          </Button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <Button variant="primary" disabled={!canProceed} onClick={advanceStep}>
            {language === 'tr' ? 'Devam' : 'Continue'}
          </Button>
        ) : (
          <Button variant="primary" disabled={isPending} onClick={handleSubmit}>
            {isPending
              ? (language === 'tr' ? 'Oluşturuluyor...' : 'Creating...')
              : (language === 'tr' ? 'Projeyi Oluştur' : 'Create Project')}
          </Button>
        )}
      </div>
    </div>
  )
}

// REQUIRED: useSearchParams() MUST be inside a Suspense boundary.
// Without this, Next.js throws a prerendering error (RESEARCH.md Pitfall 3).
export default function CreateProjectPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
          Yükleniyor...
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  )
}
