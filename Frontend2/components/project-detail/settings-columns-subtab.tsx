"use client"

// Settings > Kolonlar sub-tab — D-11 + D-12 + Wave 2 W2-C8.
//
// Lists project columns (GET /api/v1/projects/{id}/columns, Phase 9) in
// editable rows. Wave 2 W2-C8 widens the row to expose all BoardColumn
// engine fields persisted to migration 013:
//   - Column name (rename via PATCH /projects/{id}/columns/{col_id} on blur)
//   - WIP limit (number, 0 = no limit) — HIDDEN when methodology === "WATERFALL"
//     per D-12 ("waterfall has phases, not flow")
//   - category (todo / in_progress / done) — engine_field
//   - is_initial / is_terminal — engine_field (boolean toggles)
//   - max_duration_days — engine_field (null = unbounded)
//   - entry_policy / exit_policy — engine_field
//   - Task count (read-only)
//
// Save semantics (W2-C8): every field commits on blur (text/number) or
// change (select/checkbox) via PATCH /projects/{pid}/columns/{cid}. Only
// the diff is sent (W2-C6 pattern). Fire-and-forget — error toast on
// failure. Per-row debounce / batching is deferred to Wave 3.
//
// Multi-initial warning: mirrors the workflow editor SelectionPanel UX
// (W2-C6 senior review #4 — warn, never auto-toggle the other rows).
//
// Responsive: the table renders at min-width ~1080px inside an
// `overflow-x: auto` wrapper, so narrow viewports get horizontal scroll
// rather than column squash. Mobile accordion is deferred to Wave 3.
//
// Commit strategy: native <input onBlur={...}>. The Input primitive wraps
// <input> in a <div> and doesn't forward onBlur, so we use bare <input>
// elements with matching token styling to keep Rule 3 scope boundary
// (no primitive fork in this plan).

import * as React from "react"

import { AlertBanner, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { apiClient } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Project } from "@/services/project-service"

// Wave 2 W2-C8 — BoardColumn now surfaces engine fields. They are
// returned by the API since Wave 1 C4 (verified in W2-C3 integration
// tests) and persisted by migration 013.
type ColumnCategory = "todo" | "in_progress" | "done"
type EntryPolicy = "any" | "edges_only" | "initial_only"
type ExitPolicy = "any" | "edges_only" | "terminal_lock"

interface BoardColumn {
  id: number
  project_id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
  // Wave 2 W2-C8 engine fields — all optional because legacy projects
  // may have NULL values until migration 013 backfills land.
  category?: ColumnCategory | null
  is_initial?: boolean | null
  is_terminal?: boolean | null
  max_duration_days?: number | null
  entry_policy?: EntryPolicy | null
  exit_policy?: ExitPolicy | null
}

interface ColumnDraft {
  name: string
  wip_limit: number
  category: ColumnCategory
  is_initial: boolean
  is_terminal: boolean
  max_duration_days: number | null
  entry_policy: EntryPolicy
  exit_policy: ExitPolicy
}

// Backend round-trip patch shape (snake_case to match REST contract).
interface ColumnPatch {
  name?: string
  wip_limit?: number
  category?: ColumnCategory
  is_initial?: boolean
  is_terminal?: boolean
  max_duration_days?: number | null
  entry_policy?: EntryPolicy
  exit_policy?: ExitPolicy
}

function draftFromColumn(col: BoardColumn): ColumnDraft {
  return {
    name: col.name,
    wip_limit: col.wip_limit,
    category: (col.category ?? "todo") as ColumnCategory,
    is_initial: Boolean(col.is_initial),
    is_terminal: Boolean(col.is_terminal),
    max_duration_days:
      typeof col.max_duration_days === "number" ? col.max_duration_days : null,
    entry_policy: (col.entry_policy ?? "any") as EntryPolicy,
    exit_policy: (col.exit_policy ?? "any") as ExitPolicy,
  }
}

function useProjectColumns(projectId: number) {
  return useQuery({
    queryKey: ["columns", projectId],
    queryFn: async () => {
      const resp = await apiClient.get<BoardColumn[]>(
        `/projects/${projectId}/columns`
      )
      return resp.data
    },
    // Columns rarely churn during a Settings session — 30s stale is plenty.
    staleTime: 30 * 1000,
  })
}

function backendErrorMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  return typeof detail === "string" ? detail : null
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0 8px",
  height: 28,
  fontSize: 13,
  background: "var(--surface)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: "none",
  // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
  fontFamily: "inherit",
}

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  padding: "0 6px",
  appearance: "auto", // keep native chevron — token-styled box still wraps it
}

const CHECKBOX_CELL_STYLE: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}

/**
 * Stable string summary of the columns list — feeding this string (not the
 * array reference) into useEffect's dep array prevents an OOM feedback loop
 * when useQuery emits fresh array references without data changes. Engine
 * fields are folded in so a server-side category/is_initial mutation does
 * trigger draft re-sync.
 */
function serializeColumnsShape(cols: BoardColumn[]): string {
  return cols
    .map(
      (c) =>
        `${c.id}:${c.name}:${c.wip_limit}:${c.category ?? "-"}:${
          c.is_initial ? 1 : 0
        }:${c.is_terminal ? 1 : 0}:${c.max_duration_days ?? "-"}:${
          c.entry_policy ?? "-"
        }:${c.exit_policy ?? "-"}`
    )
    .join("|")
}

export function SettingsColumnsSubtab({
  project,
  isArchived,
}: {
  project: Project
  isArchived: boolean
}) {
  const { language: lang } = useApp()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const { data: columns = [], isLoading } = useProjectColumns(project.id)
  const isWaterfall = project.methodology === "WATERFALL"

  // Mirror server state in a per-column draft keyed by col.id so the user
  // can type freely without racing against query refetches.
  const [drafts, setDrafts] = React.useState<Record<number, ColumnDraft>>({})

  // Sync drafts when the server list's DATA shape changes — the stable
  // string dep prevents re-running on fresh-array-reference renders (which
  // is what triggers an OOM loop when the dep is the columns array itself).
  const columnsShape = serializeColumnsShape(columns)
  React.useEffect(() => {
    const d: Record<number, ColumnDraft> = {}
    columns.forEach((c) => {
      d[c.id] = draftFromColumn(c)
    })
    setDrafts(d)
    // columns is read inside the effect but dep-tracked via its serialized
    // shape — this is intentional. See columnsShape comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsShape])

  // Wave 2 W2-C8 — multi-initial detection. Mirrors workflow editor
  // SelectionPanel (W2-C6 senior review #4): warn, never auto-toggle.
  // Backend Wave 3 will enforce the single-initial invariant.
  const initialColumns = React.useMemo(
    () => columns.filter((c) => Boolean(c.is_initial)),
    [columns]
  )

  // saveColumn — accepts an optional `override` so dropdowns / checkboxes
  // can commit the NEW value synchronously without waiting for the
  // setDrafts batch to flush. Text/number inputs that commit on blur
  // pass no override (the state has already updated by then).
  async function saveColumn(col: BoardColumn, override?: Partial<ColumnDraft>) {
    const stored = drafts[col.id]
    if (!stored) return
    const draft: ColumnDraft = override ? { ...stored, ...override } : stored
    // Build a patch with only the changed fields (W2-C6 pattern).
    const patch: ColumnPatch = {}
    if (draft.name !== col.name) patch.name = draft.name.trim()
    if (draft.wip_limit !== col.wip_limit) patch.wip_limit = draft.wip_limit
    if (draft.category !== (col.category ?? "todo")) {
      patch.category = draft.category
    }
    if (draft.is_initial !== Boolean(col.is_initial)) {
      patch.is_initial = draft.is_initial
    }
    if (draft.is_terminal !== Boolean(col.is_terminal)) {
      patch.is_terminal = draft.is_terminal
    }
    const colMaxDur =
      typeof col.max_duration_days === "number" ? col.max_duration_days : null
    if (draft.max_duration_days !== colMaxDur) {
      patch.max_duration_days = draft.max_duration_days
    }
    if (draft.entry_policy !== (col.entry_policy ?? "any")) {
      patch.entry_policy = draft.entry_policy
    }
    if (draft.exit_policy !== (col.exit_policy ?? "any")) {
      patch.exit_policy = draft.exit_policy
    }
    if (Object.keys(patch).length === 0) return
    // Don't send an empty name — Pydantic min_length=1 would 422.
    if (patch.name !== undefined && !patch.name.trim()) {
      showToast({
        variant: "error",
        message: lang === "tr" ? "Kolon adı boş olamaz" : "Column name cannot be empty",
      })
      return
    }
    try {
      await apiClient.patch(`/projects/${project.id}/columns/${col.id}`, patch)
      qc.invalidateQueries({ queryKey: ["columns", project.id] })
      showToast({
        variant: "success",
        message: lang === "tr" ? "Kolon güncellendi" : "Column updated",
      })
    } catch (err: unknown) {
      showToast({
        variant: "error",
        message:
          backendErrorMessage(err) ??
          (lang === "tr" ? "Güncellenemedi" : "Update failed"),
      })
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 12,
          color: "var(--fg-muted)",
        }}
      >
        {lang === "tr" ? "Yükleniyor..." : "Loading..."}
      </div>
    )
  }

  // Wave 2 W2-C8 — grid template covers up to 9 cells (Waterfall drops
  // the WIP column). Each track is sized for its content; the wrapping
  // <div style={{ overflowX: "auto" }}> provides horizontal scroll on
  // viewports narrower than the min-width.
  const GRID_TEMPLATE = isWaterfall
    ? "minmax(180px,2fr) 110px 80px 80px 110px 120px 130px 110px"
    : "minmax(180px,2fr) 100px 110px 80px 80px 110px 120px 130px 110px"
  const MIN_WIDTH = isWaterfall ? 940 : 1040

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 1080,
      }}
    >
      {isArchived && (
        <AlertBanner tone="warning">
          {lang === "tr"
            ? "Arşiv modunda düzenleme devre dışı."
            : "Editing disabled in archive mode."}
        </AlertBanner>
      )}
      {isWaterfall && (
        <AlertBanner tone="info">
          {lang === "tr"
            ? "Waterfall metodolojisinde WIP limitleri gizlidir."
            : "WIP limits are hidden for Waterfall methodology."}
        </AlertBanner>
      )}
      {/* Wave 2 W2-C8 — multi-initial warning. Senior review #4 (W2-C6):
          surface a banner instead of auto-unchecking. Wave 3 backend
          validation will enforce the single-initial invariant. */}
      {initialColumns.length > 1 && (
        <div data-testid="multi-initial-warning">
          <AlertBanner tone="warning">
            {lang === "tr"
              ? `Birden fazla kolon başlangıç olarak işaretli: ${initialColumns
                  .map((c) => c.name)
                  .join(", ")}. Tutarsızlığa neden olabilir.`
              : `Multiple columns marked as initial: ${initialColumns
                  .map((c) => c.name)
                  .join(", ")}. This may cause inconsistencies.`}
          </AlertBanner>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <Card padding={0}>
          <div style={{ minWidth: MIN_WIDTH }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--fg-subtle)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "grid",
                gridTemplateColumns: GRID_TEMPLATE,
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>{lang === "tr" ? "KOLON ADI" : "COLUMN NAME"}</div>
              {!isWaterfall && (
                <div style={{ textAlign: "left" }}>
                  {lang === "tr" ? "WIP LİMİTİ" : "WIP LIMIT"}
                </div>
              )}
              <div>{lang === "tr" ? "KATEGORİ" : "CATEGORY"}</div>
              <div style={{ textAlign: "center" }}>
                {lang === "tr" ? "BAŞL." : "INITIAL"}
              </div>
              <div style={{ textAlign: "center" }}>
                {lang === "tr" ? "TERM." : "TERMINAL"}
              </div>
              <div>{lang === "tr" ? "MAKS. GÜN" : "MAX DAYS"}</div>
              <div>{lang === "tr" ? "GİRİŞ" : "ENTRY"}</div>
              <div>{lang === "tr" ? "ÇIKIŞ" : "EXIT"}</div>
              <div style={{ textAlign: "right" }}>
                {lang === "tr" ? "GÖREVLER" : "TASKS"}
              </div>
            </div>

            {columns.length === 0 && (
              <div
                style={{
                  padding: 20,
                  color: "var(--fg-subtle)",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {lang === "tr" ? "Kolon tanımlanmamış." : "No columns defined."}
              </div>
            )}

            {columns.map((col) => {
              const draft = drafts[col.id] ?? draftFromColumn(col)
              return (
                <div
                  key={col.id}
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "grid",
                    gridTemplateColumns: GRID_TEMPLATE,
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  {/* Column name */}
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [col.id]: { ...draft, name: e.target.value },
                      }))
                    }
                    onBlur={() => saveColumn(col)}
                    disabled={isArchived}
                    style={INPUT_STYLE}
                    aria-label={lang === "tr" ? "Kolon adı" : "Column name"}
                  />

                  {/* WIP limit (hidden on Waterfall) */}
                  {!isWaterfall && (
                    <input
                      type="number"
                      min={0}
                      value={String(draft.wip_limit)}
                      onChange={(e) => {
                        const parsed = Number(e.target.value)
                        const next =
                          Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
                        setDrafts((prev) => ({
                          ...prev,
                          [col.id]: { ...draft, wip_limit: next },
                        }))
                      }}
                      onBlur={() => saveColumn(col)}
                      disabled={isArchived}
                      placeholder="WIP"
                      style={INPUT_STYLE}
                      aria-label={lang === "tr" ? "WIP limiti" : "WIP limit"}
                    />
                  )}

                  {/* Category */}
                  <select
                    value={draft.category}
                    onChange={(e) => {
                      const next = e.target.value as ColumnCategory
                      setDrafts((prev) => ({
                        ...prev,
                        [col.id]: { ...draft, category: next },
                      }))
                      // Selects commit immediately; pass the new value as an
                      // override so saveColumn doesn't read stale state.
                      void saveColumn(col, { category: next })
                    }}
                    disabled={isArchived}
                    style={SELECT_STYLE}
                    aria-label={lang === "tr" ? "Kategori" : "Category"}
                  >
                    <option value="todo">
                      {lang === "tr" ? "Yapılacak" : "To Do"}
                    </option>
                    <option value="in_progress">
                      {lang === "tr" ? "Sürmekte" : "In Progress"}
                    </option>
                    <option value="done">
                      {lang === "tr" ? "Bitti" : "Done"}
                    </option>
                  </select>

                  {/* is_initial — W2-C6 senior review #4: we do NOT
                      auto-uncheck other rows; the multi-initial AlertBanner
                      above surfaces the duplicate. */}
                  <div style={CHECKBOX_CELL_STYLE}>
                    <input
                      type="checkbox"
                      checked={draft.is_initial}
                      onChange={(e) => {
                        const next = e.target.checked
                        setDrafts((prev) => ({
                          ...prev,
                          [col.id]: { ...draft, is_initial: next },
                        }))
                        void saveColumn(col, { is_initial: next })
                      }}
                      disabled={isArchived}
                      aria-label={
                        lang === "tr" ? "Başlangıç kolonu" : "Initial column"
                      }
                    />
                  </div>

                  {/* is_terminal */}
                  <div style={CHECKBOX_CELL_STYLE}>
                    <input
                      type="checkbox"
                      checked={draft.is_terminal}
                      onChange={(e) => {
                        const next = e.target.checked
                        setDrafts((prev) => ({
                          ...prev,
                          [col.id]: { ...draft, is_terminal: next },
                        }))
                        void saveColumn(col, { is_terminal: next })
                      }}
                      disabled={isArchived}
                      aria-label={
                        lang === "tr" ? "Terminal kolon" : "Terminal column"
                      }
                    />
                  </div>

                  {/* max_duration_days (empty = unbounded → null) */}
                  <input
                    type="number"
                    min={1}
                    value={
                      draft.max_duration_days != null
                        ? String(draft.max_duration_days)
                        : ""
                    }
                    placeholder={lang === "tr" ? "Sınırsız" : "Unbounded"}
                    onChange={(e) => {
                      const raw = e.target.value
                      let next: number | null
                      if (raw === "") {
                        next = null
                      } else {
                        const parsed = Number(raw)
                        // Backend Pydantic ge=1 → coerce sub-1 to null.
                        next =
                          Number.isFinite(parsed) && parsed >= 1
                            ? Math.floor(parsed)
                            : null
                      }
                      setDrafts((prev) => ({
                        ...prev,
                        [col.id]: { ...draft, max_duration_days: next },
                      }))
                    }}
                    onBlur={() => saveColumn(col)}
                    disabled={isArchived}
                    style={INPUT_STYLE}
                    aria-label={lang === "tr" ? "Maksimum gün" : "Maximum days"}
                  />

                  {/* entry_policy */}
                  <select
                    value={draft.entry_policy}
                    onChange={(e) => {
                      const next = e.target.value as EntryPolicy
                      setDrafts((prev) => ({
                        ...prev,
                        [col.id]: { ...draft, entry_policy: next },
                      }))
                      void saveColumn(col, { entry_policy: next })
                    }}
                    disabled={isArchived}
                    style={SELECT_STYLE}
                    aria-label={
                      lang === "tr" ? "Giriş politikası" : "Entry policy"
                    }
                  >
                    <option value="any">{lang === "tr" ? "Serbest" : "Any"}</option>
                    <option value="edges_only">
                      {lang === "tr" ? "Komşu" : "Edges only"}
                    </option>
                    <option value="initial_only">
                      {lang === "tr" ? "Başlangıç" : "Initial only"}
                    </option>
                  </select>

                  {/* exit_policy */}
                  <select
                    value={draft.exit_policy}
                    onChange={(e) => {
                      const next = e.target.value as ExitPolicy
                      setDrafts((prev) => ({
                        ...prev,
                        [col.id]: { ...draft, exit_policy: next },
                      }))
                      void saveColumn(col, { exit_policy: next })
                    }}
                    disabled={isArchived}
                    style={SELECT_STYLE}
                    aria-label={
                      lang === "tr" ? "Çıkış politikası" : "Exit policy"
                    }
                  >
                    <option value="any">{lang === "tr" ? "Serbest" : "Any"}</option>
                    <option value="edges_only">
                      {lang === "tr" ? "Komşu" : "Edges only"}
                    </option>
                    <option value="terminal_lock">
                      {lang === "tr" ? "Terminal kilit" : "Terminal lock"}
                    </option>
                  </select>

                  {/* Task count */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--fg-subtle)",
                      fontFamily: "var(--font-mono)",
                      textAlign: "right",
                    }}
                  >
                    {col.task_count} {lang === "tr" ? "görev" : "tasks"}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
