# Phase 12 Patterns Map

> Maps Phase 12 new/modified files to closest analogs in the existing codebase.
> Planner reads this to ensure new files follow established conventions.
>
> Mapped: 2026-04-25
> Files analyzed: 50 (35 new + 15 modified) across Frontend2 + Backend
> Analogs found (strong): 38 / 50 — 12 new files (React Flow renderers, hull algorithm, undo/redo stack, dirty-save dialog, viewport gate) have NO Frontend2 analog and cite the prototype `New_Frontend/src/pages/workflow-editor.jsx` instead.

---

## File Mappings

### `Frontend2/components/lifecycle/` (10 new files + 1 viewport fallback)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `lifecycle-tab.tsx` | frontend-component (tab shell w/ summary strip + canvas + sub-Tabs) | `Frontend2/components/project-detail/board-tab.tsx` (full file is the model: `"use client"` + `useTasks()` + memo'd derived state + grid layout) | Lines 50-58: `export function BoardTab({ project }: { project: Project }) { const pd = useProjectDetail(); const { data: tasksData } = useTasks(project.id); const tasks: Task[] = Array.isArray(tasksData) ? tasksData : []; const { data: columnsMeta = [] } = useColumns(project.id); const cfg = (project.processConfig ?? {}) as { enable_phase_assignment?: boolean; workflow?: { nodes?: Array<{ id: string; name: string }> } };` — copy this `processConfig` cast pattern verbatim for `workflow.nodes` access in lifecycle-tab.tsx |
| `summary-strip.tsx` | frontend-component (Badge + ProgressBar + buttons row, methodology-aware) | `Frontend2/components/project-detail/settings-columns-subtab.tsx` lines 163-186 (Card + AlertBanner inline-styled headers) | The grid template `gridTemplateColumns: isWaterfall ? "2fr auto" : "2fr 120px auto"` shows the methodology-conditional layout shape; summary-strip uses the same `isKanban` split for "Sonraki Faza Geç" button visibility |
| `mini-metric.tsx` | frontend-component (4-cell metric tile) | `Frontend2/components/project-detail/timeline-tab.tsx:151-159` (raw SVG/inline-style metric cell pattern) | The header cell pattern at `padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase"` from settings-columns-subtab.tsx:188-201 is the closest "compact label + mono value" cell pattern |
| `overview-subtab.tsx` | frontend-component (4 MiniMetric cards + 2-col Faz Özeti / Yaklaşan Teslimler) | Prototype `New_Frontend/src/pages/lifecycle-tab.jsx` lines 1-200 (port verbatim into TS — D-48 says "~200 lines port") + style off `Frontend2/components/project-detail/list-tab.tsx` for grid sizing | The Frontend2 closest is `board-tab.tsx`'s memoized derive pattern (line 69-80): `const filteredTasks = React.useMemo<Task[]>(() => { ... }, [tasks, pd.searchQuery, pd.phaseFilter])` — overview-subtab does the same with `phaseStats` derived from `useTasks` + `computeNodeStates` |
| `milestones-subtab.tsx` | frontend-component (inline-add row + edit + delete confirm) | `Frontend2/components/project-detail/settings-columns-subtab.tsx` (full file — the **canonical inline-add/edit row pattern**, lines 80-294) | Lines 95-112: `const [drafts, setDrafts] = React.useState<Record<number, { name: string; wip_limit: number }>>({}); React.useEffect(() => { const d: Record<number, { name: string; wip_limit: number }> = {}; columns.forEach((c) => { d[c.id] = { name: c.name, wip_limit: c.wip_limit } }); setDrafts(d); }, [columnsShape])` — milestones-subtab uses the same per-row draft pattern; the `serializeColumnsShape` trick at line 74-78 is needed when query returns fresh array refs |
| `history-subtab.tsx` | frontend-component (per-card Collapsible + lazy-fetch task details) | `Frontend2/components/project-detail/backlog-panel.tsx` lines 122-194 (Collapsible-shaped panel with `if (!open) return null` short-circuit) + Collapsible primitive at `Frontend2/components/primitives/collapsible.tsx` | The lazy-fetch pattern doesn't have a one-shot analog in Frontend2 — closest reference: `useTasks(projectId, { phase_id: X, status: 'done' })` from `Frontend2/hooks/use-tasks.ts` lines 4-10 (pass filters → cache key includes them → re-open hits cache automatically). Wrap in `enabled: collapsibleOpen` for first-expand-only fetch (D-56). |
| `artifacts-subtab.tsx` | frontend-component (row table + inline expand) | `Frontend2/components/project-detail/settings-columns-subtab.tsx` lines 187-291 (Card padding=0 + grid rows + per-row inline editor) | Same `INPUT_STYLE` constant lines 55-67 + onBlur-commit pattern lines 245-257 reused for status SegmentedControl + name input. Add a `<Card padding={0}>` wrapping the row list (line 187). |
| `phase-gate-expand.tsx` | frontend-component (inline expand panel between summary strip and canvas) | NEW PATTERN — first time Frontend2 has a "between two siblings" inline expand. Closest cousin: `Frontend2/components/task-detail/properties-sidebar.tsx` lines 1-50 (Card + MetaRow inline edit pattern) | Lines 33-46 shared editor style: `const editorStyle: React.CSSProperties = { padding: "4px 8px", fontSize: 12, width: "100%", background: "var(--surface-2)", borderRadius: 3, boxShadow: "inset 0 0 0 1px var(--border)", color: "var(--fg)", border: "none", outline: "none", font: "inherit" }` — phase-gate-expand reuses this for the note textarea + manual criterion checkboxes |
| `evaluation-report-card.tsx` | frontend-component (history-card inline expand: 3 textareas + PDF + Save) | `Frontend2/components/task-detail/properties-sidebar.tsx` (MetaRow + InlineEdit pattern) + `Frontend2/components/project-detail/settings-columns-subtab.tsx` save button pattern | Lines 114-147 of settings-columns-subtab.tsx for the optimistic PATCH + toast: `try { await apiClient.patch(...); qc.invalidateQueries(...); showToast({ variant: "success", message: lang === "tr" ? "..." : "..." }); } catch (err: unknown) { showToast({ variant: "error", message: backendErrorMessage(err) ?? ... }); }` — copy this verbatim for PhaseReport save |
| `criteria-editor-panel.tsx` | frontend-component (Settings > Lifecycle: phase picker left + editor right) | `Frontend2/components/project-detail/settings-columns-subtab.tsx` (the per-row draft + onBlur-save pattern is the closest match) + `Frontend2/components/primitives/toggle.tsx` for the auto-criteria toggles | Same draft state + `serializeColumnsShape` keyed effect from settings-columns-subtab.tsx lines 95-112 — keyed by phase_id instead of col.id. Sibling block above uses Toggle primitive directly; phase picker uses `<Tabs orientation="vertical">` if it exists, else a simple button list. |
| `viewport-fallback.tsx` | frontend-component (fallback under 1024px viewport) | `Frontend2/components/project-detail/lifecycle-stub-tab.tsx` (the 8-line AlertBanner stub itself) | Full file (lines 1-19): `"use client"; import { AlertBanner } from "@/components/primitives"; import { useApp } from "@/context/app-context"; export function LifecycleStubTab() { const { language: lang } = useApp(); return (<div style={{ padding: 20 }}><AlertBanner tone="info">{lang === "tr" ? "..." : "..."}</AlertBanner></div>); }` — viewport-fallback.tsx is a 1:1 same-shape file with a different message ("Workflow editörü 1024px+ ekran gerektirir.") |

### `Frontend2/components/workflow-editor/` (~20 new files — React Flow custom renderers)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `workflow-canvas.tsx` | frontend-component (React Flow wrapper, dynamic-imported with ssr:false) | `Frontend2/components/task-detail/description-editor.tsx` lines 1-31 (the **TipTap dynamic-import pattern** — Phase 11 D-36) | Lines 17-31: `// ssr:false keeps TipTap out of the SSR render path entirely.` + `const RichEditor = dynamic(() => import("./description-editor-rich"), { ssr: false, loading: () => (<div aria-label="loading rich editor" style={{ height: 160, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", boxShadow: "inset 0 0 0 1px var(--border)" }} />), })` — workflow-canvas.tsx mirrors this exact shape with React Flow + `<CanvasSkeleton/>` as the loading fallback |
| `phase-node.tsx` | frontend-component (custom React Flow node renderer) | NEW PATTERN — no React Flow analog in Frontend2. Cite prototype `New_Frontend/src/pages/workflow-editor.jsx` lines 64-92 (node visual: 140×60 div, oklch boxShadow rings, status dot) | Prototype lines 64-80: `<div key={n.id} onClick={() => onNodeClick && onNodeClick(n)} style={{ position: "absolute", left: n.x, top: n.y, width: 140, height: 60, background: "var(--surface)", borderRadius: 10, boxShadow: isSel ? "0 0 0 2px var(--primary), 0 4px 16px oklch(0 0 0 / 0.08)" : isActiveIdx ? "0 0 0 2px var(--primary), 0 4px 16px color-mix(in oklch, var(--primary) 20%, transparent)" : "inset 0 0 0 1px var(--border-strong), 0 1px 3px oklch(0 0 0 / 0.05)", padding: "8px 10px", cursor: readOnly ? "default" : "pointer", transition: "box-shadow 0.15s, transform 0.08s", display: "flex", flexDirection: "column", gap: 4, opacity: isPastLocked ? 0.55 : 1, }}>` — port verbatim into a React Flow `<NodeProps>`-shaped component. Wrap in React.memo at module top (so React Flow sees a stable nodeTypes ref). |
| `phase-edge.tsx` | frontend-component (custom React Flow edge renderer with 3 dasharrays) | NEW PATTERN — cite `New_Frontend/src/pages/workflow-editor.jsx` lines 25-46 (SVG path + strokeDasharray per type + label pill) | Prototype lines 30-38: `const sx = s.x + 140, sy = s.y + 30; const tx = t.x, ty = t.y + 30; const midX = (sx + tx) / 2; const d = "M " + sx + " " + sy + " C " + midX + " " + sy + ", " + midX + " " + ty + ", " + tx + " " + ty; const isPrimary = selected?.type === "edge" && selected.id === e.id; const strokeDash = e.type === "verification" ? "6 3" : e.type === "feedback" ? "8 4 2 4" : "none"; const strokeColor = isPrimary ? "var(--primary)" : e.type === "verification" ? "var(--status-progress)" : e.type === "feedback" ? "var(--status-review)" : "var(--fg-subtle)";` — port to React Flow's `EdgeProps` API (`@xyflow/react` exposes `BaseEdge` + `EdgeLabelRenderer`). Frontend2 analog for inline-styled SVG path: `Frontend2/components/project-detail/timeline-tab.tsx` lines 167-205 (`<line stroke="var(--primary)" strokeDasharray="4 4" />` etc.) |
| `all-gate-edge.tsx` | frontend-component (sub-renderer for `is_all_gate=true`) | NEW PATTERN — extends phase-edge.tsx; no source-handle, target-side "Hepsi" pill | See phase-edge.tsx excerpt above; differs only in source rendering (omit source handle path) |
| `all-gate-pill.tsx` | frontend-component (T('Hepsi','All') Badge) | `Frontend2/components/primitives/badge.tsx` (existing primitive) | Reuse `<Badge size="xs" tone="neutral">{T('Hepsi','All')}</Badge>` directly — no new file logic, just a thin localized wrapper |
| `cycle-counter-badge.tsx` | frontend-component (×N corner badge) | `Frontend2/components/project-detail/backlog-panel.tsx:223-225` for the `<Badge>` size + tone usage | Lines 223-225: `<Badge size="xs" tone="neutral">{language === "tr" ? defLabel.tr : defLabel.en}</Badge>` — cycle-counter-badge.tsx reuses the same Badge primitive with `tone="primary"` and `position: absolute; top: -6; right: -6` for corner placement; visibility gate `count >= 2` per D-47 |
| `group-cloud-node.tsx` | frontend-component (custom group renderer with concave-hull SVG path) | NEW PATTERN — no group cloud in Frontend2. Closest hull-on-children pattern: `Frontend2/components/project-detail/timeline-tab.tsx` lines 151-205 (full SVG layer with grouped `<g>` elements + dynamic d-strings) | Prototype `New_Frontend/src/pages/workflow-editor.jsx` lines 49-59 shows the **rejected** rectangular group; Phase 12 replaces it. Frontend2's only "compute SVG d-string" example is the timeline header tick rendering at line 162-192. The hull math itself lives in `lib/lifecycle/cloud-hull.ts` (NEW); this component just consumes the d-string. |
| `bottom-toolbar.tsx` | frontend-component (floating bottom pill toolbar) | `Frontend2/components/project-detail/board-toolbar.tsx` (Phase 11 toolbar pattern — 5-button horizontal row) | Reuse Button primitives + flex row pattern; bottom-toolbar.tsx adds `position: fixed; bottom: 24; left: 50%; transform: translateX(-50%);` for floating |
| `right-panel.tsx` | frontend-component (right-side container, 360px wide) | `Frontend2/components/project-detail/backlog-panel.tsx` lines 196-243 (the `<aside>` with width:300 and section dividers) | Lines 196-209: `<aside aria-label={...} style={{ width: 300, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, transition: "width 180ms ease" }}>` — right-panel.tsx mirrors with `borderLeft` instead of `borderRight` and width:360 |
| `flow-rules.tsx` | frontend-component (mode SegmentedControl, 4 options) | `Frontend2/components/project-detail/settings-general-subtab.tsx` lines 47-59 (BACKLOG_DEFINITION_OPTIONS_TR/EN array shape) | Lines 47-58: `const BACKLOG_DEFINITION_OPTIONS_TR: BacklogOption[] = [{ id: "cycle_null", label: "Döngüye atanmamış" }, ...]; const BACKLOG_DEFINITION_OPTIONS_EN: BacklogOption[] = [...]` — flow-rules.tsx defines `WORKFLOW_MODE_OPTIONS_TR` (4 entries: Esnek/Sıralı·kilitli/Sürekli/Sıralı·esnek) the same way + mounts `<SegmentedControl options={...} active={...} onChange={(id) => { setMode(id); setDirty(true); }}>` |
| `selection-panel.tsx` | frontend-component (right-panel: node OR edge OR group OR empty) | `Frontend2/components/task-detail/properties-sidebar.tsx` lines 1-100 (PropertiesSidebar + MetaRow + InlineEdit pattern) | The MetaRow + Field excerpt at lines 33-46 + 48-50 is the canonical right-panel field row shape: label + value row with editor on hover/click. selection-panel.tsx switches on `selected.type === "node" / "edge" / "group"` to render different field sets. |
| `validation-panel.tsx` | frontend-component (5-rule validation list with `errors`/`warnings`) | `Frontend2/components/primitives/alert-banner.tsx` (AlertBanner primitive) | Each rule renders as `<AlertBanner tone="danger">{rule.message}</AlertBanner>` for errors, `tone="warning"` for warnings. Ref: settings-columns-subtab.tsx lines 172-185 (two-banner stack pattern: archive + waterfall) |
| `shortcuts-panel.tsx` | frontend-component (keyboard shortcuts list with `<Kbd>`) | `Frontend2/components/primitives/kbd.tsx` (existing primitive) | Reuse `<Kbd>Ctrl</Kbd>+<Kbd>S</Kbd>` directly; the panel is a static list of 8 entries from D-35 |
| `context-menu.tsx` | frontend-component (right-click menu for node/edge/group/canvas) | NEW PATTERN — no context menu in Frontend2. Cite `Frontend2/components/projects/confirm-dialog.tsx` shape for the floating Card with click-outside dismiss | Frontend2 already has `<ConfirmDialog>` (Phase 10 D-25) as the closest "floating dialog" pattern — context-menu.tsx mirrors with: position from mouse event, click-outside listener with `useEffect`, Esc key listener. Implementation is a ~80-line custom component (D-claudes-discretion items don't include a context menu library). |
| `canvas-skeleton.tsx` | frontend-component (loading placeholder for `dynamic({ssr:false, loading: ...})`) | `Frontend2/components/task-detail/description-editor.tsx` lines 20-30 (TipTap loading fallback) | Lines 20-30: `loading: () => (<div aria-label="loading rich editor" style={{ height: 160, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", boxShadow: "inset 0 0 0 1px var(--border)" }} />)` — canvas-skeleton.tsx is the same shape with height matching the canvas viewport (e.g. `100%` or fixed 600px), plus a centered "Yükleniyor..." text |
| `mode-banner.tsx` | frontend-component (top-left mode display overlay) | `Frontend2/components/primitives/badge.tsx` (Badge primitive) | Just a `<Badge tone="primary" size="md">Sıralı kilitli</Badge>` overlaid via `position: absolute; top: 12; left: 12;` |
| `minimap-wrapper.tsx` | frontend-component (custom-styled MiniMap container) | NEW PATTERN — no MiniMap in Frontend2. Cite React Flow `<MiniMap/>` docs + theme via CSS vars per RESEARCH §React Flow Theming | Pattern: `<MiniMap nodeColor={(n) => n.data.color || 'var(--fg-subtle)'} maskColor="color-mix(in oklch, var(--surface) 60%, transparent)" style={{ background: 'var(--surface-2)' }} />` — the prototype's bottom-right minimap is the visual reference |
| `color-swatch.tsx` | frontend-component (8-swatch grid color picker for node "Renk") | `Frontend2/components/primitives/priority-chip.tsx` (color-token-driven chip) + `Frontend2/components/primitives/status-dot.tsx` (status token-driven dot) | The status tokens used are `status-todo`, `status-progress`, `status-review`, `status-done`, `status-blocked`, `priority-critical`, `priority-high`, `primary` per D-30. Render as 4×2 grid of `<button style={{ background: "var(--" + token + ")", width: 24, height: 24, borderRadius: "50%", border: selected === token ? "2px solid var(--fg)" : "none" }}>` |
| `tooltip.tsx` (NEW primitive) | frontend-component (lightweight tooltip wrapper) | NEW PATTERN — no Tooltip primitive in Frontend2. Closest CSS hover ref: native `title` attribute is used elsewhere. Build a minimal absolute-positioned div on hover. | Implementation is ~40 lines: trigger element + portal-based positioned tooltip on `onMouseEnter`/`onMouseLeave`. No library. |
| `editor-page.tsx` | frontend-component (outer page layout: header + toolbar + 2-col body grid) | `Frontend2/components/project-detail/project-detail-shell.tsx` lines 1-50 (Tabs + content area shell, 8-tab routing) | `<ProjectDetailShell>` is the closest shell; editor-page.tsx has top header (project name + Save button + dirty indicator), then a row with canvas (flex:1) + right-panel (360px). Pattern: `<div style={{ display: "flex", flexDirection: "column", height: "100%" }}><EditorHeader/><div style={{ display: "flex", flex: 1, minHeight: 0 }}><WorkflowCanvas/><RightPanel/></div></div>` |

### `Frontend2/lib/lifecycle/` (5 pure-logic files)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `graph-traversal.ts` | frontend-lib-pure (BFS — `computeNodeStates(workflow, transitions) → Map<id, state>`) | `Frontend2/lib/audit-formatter.ts` (full file — **canonical pure-logic module pattern** — zero React, vitest-compatible) | Lines 9-11 file header: `// This module has ZERO React imports so it stays unit-testable in vitest // without jsdom. The React consumers live in // Frontend2/components/task-detail/history-section.tsx.` — graph-traversal.ts copies this comment header verbatim. The function shape at line 84-116 (`formatAuditEntry(entry, lang, ctx): string`) is the closest "pure transform" signature pattern: typed input, typed output, no I/O. |
| `workflow-validators.ts` | frontend-lib-pure (5-rule validator — `validateWorkflow(wf) → { errors[], warnings[] }`) | `Frontend2/lib/methodology-matrix.ts` (lookup-table + pure-fn pattern) + `Backend/app/application/dtos/workflow_dtos.py` lines 58-104 (the 3 backend rules — frontend mirrors + adds rules 4 + 5) | Backend lines 58-86: `@model_validator(mode="after") def validate_business_rules(self): # D-55 rule 1: node IDs unique ids = [n.id for n in self.nodes]; if len(ids) != len(set(ids)): raise ValueError(...); # D-55 rule 2: edge source/target must reference non-archived nodes active = {n.id for n in self.nodes if not n.is_archived}; for e in self.edges: if e.source not in active: raise ValueError(...); ...` — workflow-validators.ts mirrors with TS: rule 1 = unique IDs, rule 2 = edges reference non-archived nodes, rule 3 = exempt `is_all_gate=true` from source check, rule 4 = ≥1 isInitial + ≥1 isFinal, rule 5 = no flow cycles in sequential-locked/sequential-flexible. The `_has_cycle` Kahn's-topological-sort at lines 88-104 of workflow_dtos.py is the algorithm to port to TS. |
| `cloud-hull.ts` | frontend-lib-pure (concave-hull or convex-hull-plus-padding — `computeHull(nodes[], padding) → SVG path d-string`) | NEW PATTERN — no hull algo in Frontend2. Cite RESEARCH §Concave-hull algorithm decision. Closest "pure transform → SVG d-string" reference: `Frontend2/components/project-detail/timeline-tab.tsx` lines 162-192 (dynamic SVG d-string generation in inline computation) | Per CONTEXT D-22: smooth cloud-shaped path; per RESEARCH, `concaveman` library is the candidate (or hand-rolled convex-hull-plus-padding as baseline). cloud-hull.ts has the same audit-formatter.ts header comment + `import { padBoundingBox } from './geometry'` shape (no React) |
| `align-helpers.ts` | frontend-lib-pure (5 align functions: distribute/alignTop/alignBottom/centerVertical/centerHorizontal) | `Frontend2/lib/methodology-matrix.ts` lines 65-86 (`resolveBacklogFilter` — pure fn over project + simple switch) | Same 5-function module shape as methodology-matrix.ts; each function takes `nodes: WorkflowNode[]` and returns `WorkflowNode[]` with x/y mutated. Stateless, deterministic, vitest-friendly. |
| `shortcuts.ts` | frontend-lib-pure (keyboard map + Cmd/Ctrl detection helper) | `Frontend2/lib/constants.ts` (lookup table file) + `Frontend2/lib/methodology-matrix.ts` lines 17-25 (`BACKLOG_DEFINITION_BY_METHODOLOGY` lookup record) | Lines 17-25: `export const BACKLOG_DEFINITION_BY_METHODOLOGY: Record<Methodology, BacklogDefinition> = { SCRUM: "cycle_null", KANBAN: "leftmost_column", ... }` — shortcuts.ts defines `KEYBOARD_SHORTCUTS: Record<Action, KeyCombo>` the same way. Cmd/Ctrl detection: `const isMac = typeof navigator !== "undefined" && /Mac|iP/.test(navigator.platform)` |
| `presets.ts` (Plan 12-10, mentioned in research §Plan-by-Plan) | frontend-lib-pure (preset workflows: Scrum/Waterfall/Kanban/Iterative/V-Model/Spiral/Incremental/Evolutionary/RAD) | `Frontend2/lib/methodology-matrix.ts` lines 17-52 (lookup tables) + prototype `New_Frontend/src/data.jsx` `DEFAULT_LIFECYCLES` + `EXTRA_LIFECYCLES` exports | Same shape as methodology-matrix.ts: `export const PRESETS: Record<PresetId, WorkflowConfig> = { scrum: {...}, waterfall: {...}, ... }`. Each entry validated against `validateWorkflow()` in unit tests (`presets.test.ts`). |

### `Frontend2/services/` (6 new files)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `lifecycle-service.ts` | frontend-service (composite read: workflow + criteria + activity) | `Frontend2/services/project-service.ts` lines 1-70 (full service pattern with snake_case DTO + camelCase domain + mapper) | Lines 33-50: `interface ProjectResponseDTO { id: number; key: string; ... process_config?: Record<string, unknown>; }` + `function mapProject(data: ProjectResponseDTO): Project { return { ... processConfig: data.process_config ?? null, ... } }` — lifecycle-service.ts follows the same DTO-then-mapper shape; composite read uses `Promise.all([apiClient.get('/projects/' + id), apiClient.get('/projects/' + id + '/activity')])`. |
| `phase-gate-service.ts` | frontend-service (POST `/projects/{id}/phase-transitions` with Idempotency-Key) | `Frontend2/services/task-service.ts` lines 137-148 (axios POST + map response) | Lines 137-143: `create: async (dto: CreateTaskDTO): Promise<Task> => { const resp = await apiClient.post<TaskResponseDTO>('/tasks', dto); return mapTask(resp.data); },` — phase-gate-service.ts adds the Idempotency-Key header: `apiClient.post('/projects/' + id + '/phase-transitions', dto, { headers: { 'Idempotency-Key': idempotencyKey } })`. The header is generated once per Gate-expand session (D-42); service signature accepts `idempotencyKey: string` as a parameter. |
| `milestone-service.ts` | frontend-service (CRUD `/projects/{id}/milestones`) | `Frontend2/services/comment-service.ts` lines 38-56 (full CRUD shape: getByTask + create + update + remove) | Lines 38-56: `export const commentService = { getByTask: async (taskId: number): Promise<Comment[]> => { const resp = await apiClient.get<CommentResponseDTO[]>('/comments', { params: { task_id: taskId } }); return resp.data.map(mapComment); }, create: async (...) => { ... }, update: async (...) => { ... }, remove: async (id: number): Promise<void> => { await apiClient.delete('/comments/' + id); } }` — milestone-service.ts uses the same shape with `getByProject(projectId, ...)` instead of `getByTask`. |
| `artifact-service.ts` | frontend-service (CRUD + dual URL: `/projects/{id}/artifacts` + `/artifacts/{id}/mine`) | `Frontend2/services/task-service.ts` (full CRUD pattern + special-route methods like `addWatcher`/`removeWatcher` lines 149-153) | Lines 149-153: `addWatcher: async (taskId: number): Promise<void> => { await apiClient.post('/tasks/' + taskId + '/watch') }, removeWatcher: async (taskId: number): Promise<void> => { await apiClient.delete('/tasks/' + taskId + '/watch') }` — artifact-service.ts mirrors with `updateMine: async (id: number, dto): Promise<Artifact> => { const resp = await apiClient.patch('/artifacts/' + id + '/mine', dto); return mapArtifact(resp.data); }` for the assignee-only patch route (Phase 9 D-36) |
| `phase-report-service.ts` | frontend-service (CRUD + GET PDF Blob) | `Frontend2/services/task-service.ts` (CRUD pattern) + `Frontend2/services/attachment-service.ts` (Blob download pattern, if applicable) | CRUD shape from task-service.ts lines 103-148. PDF download adds: `getPdf: async (id: number): Promise<Blob> => { const resp = await apiClient.get('/phase-reports/' + id + '/pdf', { responseType: 'blob' }); return resp.data }` — caller wraps in `URL.createObjectURL` + anchor click for download with filename `Phase-Report-{project-key}-{phase-slug}-rev{N}.pdf` (D-58). |
| `led-teams-service.ts` | frontend-service (GET `/users/me/led-teams`) | `Frontend2/services/auth-service.ts` lines 1-30 (the GET-only single-endpoint service shape) | Single-method pattern: `export const ledTeamsService = { getMine: async (): Promise<LedTeam[]> => { const resp = await apiClient.get<LedTeamResponseDTO[]>('/users/me/led-teams'); return resp.data.map(mapLedTeam); } }` — see `Frontend2/services/auth-service.ts` for the same single-endpoint shape (auth-service has `getCurrentUser` as the sole reader). |

### `Frontend2/hooks/` (9 new files)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `use-milestones.ts` | frontend-hook (TanStack Query: list + create + update + delete with optimistic + rollback) | `Frontend2/hooks/use-tasks.ts` lines 41-87 (`useUpdateTask` + `useMoveTask` — **canonical optimistic + rollback pattern**) | Lines 42-61 (`useUpdateTask`): `return useMutation({ mutationFn: ({ field, value }) => taskService.patchField(taskId, field, value), onMutate: async ({ field, value }) => { await qc.cancelQueries({ queryKey: ["tasks", taskId] }); const prev = qc.getQueryData<Task>(["tasks", taskId]); if (prev) qc.setQueryData<Task>(["tasks", taskId], { ...prev, [field]: value } as Task); return { prev }; }, onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks", taskId], ctx.prev) }, onSettled: () => { qc.invalidateQueries({ queryKey: ["tasks", taskId] }) } })` — use-milestones.ts copies this 3-callback pattern verbatim for create + delete. Cache key shape: `["milestones", "project", projectId]`. |
| `use-artifacts.ts` | frontend-hook (list + update + delete + file upload) | `Frontend2/hooks/use-tasks.ts` (full file) + `Frontend2/hooks/use-watchers.ts` lines 1-19 (the simple-mutation pattern) | use-watchers.ts lines 1-10: `export function useAddWatcher(taskId: number) { const qc = useQueryClient(); return useMutation({ mutationFn: () => taskService.addWatcher(taskId), onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", taskId] }) }) }` — use-artifacts.ts uses the same simple shape for the file-upload mutation; `useUpdateArtifact` follows the optimistic pattern from use-tasks.ts |
| `use-phase-reports.ts` | frontend-hook (list + create + update + PDF Blob download) | `Frontend2/hooks/use-tasks.ts` (CRUD pattern) | Same shape as use-tasks.ts. PDF download wraps in mutation: `useMutation({ mutationFn: (reportId: number) => phaseReportService.getPdf(reportId).then(blob => downloadBlob(blob, filename)) })` |
| `use-phase-transitions.ts` | frontend-hook (mutation + Idempotency-Key state + retry + 409/422/429 handling) | `Frontend2/hooks/use-tasks.ts` lines 26-35 (`useCreateTask` simple pattern) + `Frontend2/hooks/use-projects.ts` lines 51-72 (`useGlobalActivity` retry-policy pattern with status-aware retry decisions) | use-projects.ts lines 67-71: `retry: (failureCount, err: unknown) => { const status = (err as { response?: { status?: number } })?.response?.status; if (status === 403) return false; return failureCount < 3 }` — use-phase-transitions.ts uses the same status-aware retry: don't retry on 409 (concurrent edit) or 422 (criteria unmet), do retry on 429 after countdown. The Idempotency-Key state is held by the *caller* (Gate expand component owns the UUID via React.useRef per D-42) and passed in as a parameter to the mutation. |
| `use-transition-authority.ts` | frontend-hook (composed permission: Admin OR PM OR LedTeams) | `Frontend2/context/auth-context.tsx` lines 16-20 (`useAuth`) + `Frontend2/hooks/use-projects.ts` lines 75-85 (`useProcessTemplates` with 5-min staleTime — D-03 says staleTime: 5*60*1000) | Composition pattern: `export function useTransitionAuthority(project: Project | null): boolean { const { user } = useAuth(); const { data: ledTeams = [] } = useLedTeams(); if (!user || !project) return false; if (user.role === 'Admin') return true; if (project.managerId === user.id) return true; return ledTeams.some(t => t.projectIds.includes(project.id)) }` — single source of truth for the 3-role check (D-03). Returns boolean; consumers spread to button `disabled` / `hidden`. |
| `use-led-teams.ts` | frontend-hook (GET `/users/me/led-teams` with 5-min staleTime) | `Frontend2/hooks/use-projects.ts` lines 75-85 (`useProcessTemplates` — staleTime: 5 * 60 * 1000) | Lines 79-85: `export function useProcessTemplates() { return useQuery({ queryKey: ['process-templates'], queryFn: projectService.getProcessTemplates, staleTime: 5 * 60 * 1000, // Templates rarely change — 5 min stale }) }` — use-led-teams.ts mirrors with `queryKey: ['led-teams', 'me']`. |
| `use-cycle-counters.ts` | frontend-hook (GET `/projects/{id}/activity` → `Map<nodeId, count>`) | `Frontend2/hooks/use-tasks.ts` lines 4-10 (`useTasks` parametrized query) + `Frontend2/lib/audit-formatter.ts` (pure aggregation) | Lines 4-10: `export function useTasks(projectId: number | null, filters: Record<string, unknown> = {}) { return useQuery({ queryKey: ["tasks", "project", projectId, filters], queryFn: () => taskService.getByProject(projectId!, filters), enabled: !!projectId }) }` — use-cycle-counters.ts wraps the activity GET (`apiClient.get('/projects/' + id + '/activity', { params: { type: ['phase_transition'] } })`) and uses `select: (data) => buildCycleMap(data)` to compute `Map<nodeId, count>` client-side via groupBy on `metadata.source_phase_id`. |
| `use-editor-history.ts` | frontend-hook (in-memory undo/redo stack — local React state, NOT TanStack) | NEW PATTERN — no undo/redo hook in Frontend2. Closest stateful hook: `Frontend2/components/project-detail/backlog-panel.tsx` lines 72-120 (`useBacklogOpenState` — custom hook with local + persisted state) | The `useBacklogOpenState` shape at lines 72-120 (useState + useEffect for persistence) is the canonical "custom hook with internal state" pattern. use-editor-history.ts is similar but stack-based: `const [past, setPast] = useState<WorkflowConfig[]>([]); const [future, setFuture] = useState<WorkflowConfig[]>([]); function push(wf) { setPast([...past, wf]); setFuture([]); }; function undo() { ... }; function redo() { ... }; function clear() { ... }`. ~100 lines per D-27. |
| `use-criteria-editor.ts` | frontend-hook (local state for criteria editor + dirty flag + PATCH mutation) | `Frontend2/components/project-detail/settings-columns-subtab.tsx` lines 95-148 (drafts state + commit-on-blur PATCH) | Lines 114-147 (the `saveColumn` function): `try { const patch: { name?: string; wip_limit?: number } = {}; if (draft.name !== col.name) patch.name = draft.name.trim(); if (draft.wip_limit !== col.wip_limit) patch.wip_limit = draft.wip_limit; await apiClient.patch('/projects/' + project.id + '/columns/' + col.id, patch); qc.invalidateQueries({ queryKey: ["columns", project.id] }); showToast({ variant: "success", ... }) } catch (err: unknown) { showToast({ variant: "error", message: backendErrorMessage(err) ?? ... }) }` — use-criteria-editor.ts uses the same draft + commit pattern but for `process_config.phase_completion_criteria[phase_id]`. |

### `Frontend2/app/(shell)/workflow-editor/` (NEW route)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `page.tsx` (NEW) | frontend-route (reads `?projectId=X`, redirects to `/projects` if missing, mounts editor) | `Frontend2/app/(shell)/projects/[id]/page.tsx` (full file — the **canonical route page pattern**) | Lines 1-68: `"use client" import * as React from "react"; import { useParams } from "next/navigation"; import { useProject } from "@/hooks/use-projects"; ... export default function ProjectDetailPage() { const params = useParams(); const projectId = Number(params.id); const { language } = useApp(); const { data: project, isLoading } = useProject(projectId); if (isLoading) return (<div ...>{...}</div>); if (!project) return (<Card padding={40}>...</Card>); ... return (<div ...><ProjectDetailShell project={project} isArchived={isArchived}/></div>) }` — workflow-editor/page.tsx differs in: (a) reads from `useSearchParams()` instead of `useParams()` for `projectId`, (b) on missing query → `router.replace('/projects')`, (c) wraps `<EditorPage/>` in viewport-gate div (≥1024px). The route mounts `<EditorPage>` which wraps the dynamically-imported `<WorkflowCanvas/>` per D-07. |
| `loading.tsx` (optional) | frontend-route | NEW PATTERN — no Frontend2 examples of `loading.tsx` Next.js segment file. Cite Next.js docs. | Mounts `<CanvasSkeleton/>` plus page-shell skeleton (header + side panel placeholders) |

### Modified Frontend2 files

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `project-detail/lifecycle-stub-tab.tsx` (DELETE) | frontend-component | self (lines 1-19) | Replaced by `<LifecycleTab project={project}/>` from `Frontend2/components/lifecycle/lifecycle-tab.tsx`. |
| `project-detail/settings-tab.tsx` (MODIFY) | frontend-component | self (lines 103-109 — the stub `sub === "lifecycle"` branch) | Lines 103-109: `{sub === "lifecycle" && (<AlertBanner tone="info">{lang === "tr" ? "Bu sekme Faz 12'de aktive edilecek." : "This tab will be activated in Phase 12."}</AlertBanner>)}` → replace with `{sub === "lifecycle" && (<CriteriaEditorPanel project={project} isArchived={isArchived}/>)}`. The wiring is a 1:1 substitution — no other changes to settings-tab.tsx. |
| `project-detail/timeline-tab.tsx` (MODIFY) | frontend-component | self (lines 51-54 — current entry point) | Add `milestones?: Milestone[]` prop to the function signature; in the SVG render block (lines 151-268), add a new `<g>` group rendering vertical flag lines at each milestone's x-position (computed using same `((target - min)/MS_PER_DAY)*DAY_WIDTH[view]` formula as `todayX` line 106). Click → `onMilestoneClick(milestone)` opens popover (parent owns popover state). |
| `project-detail/settings-general-subtab.tsx` (MODIFY) | frontend-component | self | Methodology field switches from editable input to read-only display + `<Tooltip>{T('Metodoloji proje oluşturulduğu an sabittir...', '...')}</Tooltip>`. Per D-60, no PATCH — frontend hard-blocks via removing the input element. |
| `project-detail/project-detail-shell.tsx` (MODIFY) | frontend-component | self (lines 47-50 — imports for stub tabs) | Lines 47-48: `import { ActivityStubTab } from "./activity-stub-tab"; import { BoardTab } from "./board-tab";` — add `import { LifecycleTab } from "@/components/lifecycle/lifecycle-tab"`; in the lifecycle branch of the switch, render `<LifecycleTab project={project}/>` instead of `<LifecycleStubTab/>`. |
| `app/(shell)/projects/[id]/page.tsx` (MODIFY) | frontend-route | self | Pass milestones data into `<ProjectDetailShell/>` (or fetched within the shell). LifecycleTab mount happens in project-detail-shell.tsx, not here. |

### Backend (3 modified files)

| Phase 12 File | Role | Closest Analog | Key Pattern Excerpt |
|---|---|---|---|
| `Backend/app/application/dtos/workflow_dtos.py` (MODIFY) | backend-dto (Pydantic model add fields) | self (lines 24-29 — current `WorkflowEdge`) | Lines 24-29 (current): `class WorkflowEdge(BaseModel): id: str; source: str; target: str; type: Literal["flow", "verification", "feedback"] = "flow"; label: Optional[str] = None` → ADD: `bidirectional: bool = False; is_all_gate: bool = False`. Defaults applied automatically by Pydantic when reading old workflows whose JSONB lacks these keys (no normalizer needed per SPEC line 22). Cross-file reference: `Backend/app/domain/services/process_config_normalizer.py` is **NOT** modified per SPEC line 1684. |
| `Backend/app/application/use_cases/execute_phase_transition.py` (MODIFY) | backend-use-case (Clean Architecture orchestration — honor new edge fields) | self (lines 43-120 — current `ExecutePhaseTransitionUseCase.execute`) + `Backend/app/application/use_cases/manage_milestones.py` lines 20-41 (`_validate_phase_ids_against_workflow` — cross-edge check pattern) | Lines 67-75 (current source/target validation): `nodes = workflow.get("nodes", []); node_map = {n["id"]: n for n in nodes}; for pid, label in ((dto.source_phase_id, "source"), (dto.target_phase_id, "target")): node = node_map.get(pid); if node is None: raise ArchivedNodeReferenceError(...); if node.get("is_archived"): raise ArchivedNodeReferenceError(...)`. ADD a new edge-existence-and-direction check after step 4: iterate `workflow.get("edges", [])`, find any edge where `(e["source"] == dto.source_phase_id AND e["target"] == dto.target_phase_id)` OR `(e.get("bidirectional") AND e["source"] == dto.target_phase_id AND e["target"] == dto.source_phase_id)` OR `(e.get("is_all_gate") AND e["target"] == dto.target_phase_id)` — if no such edge exists in `sequential-locked` mode, raise `InvalidTransitionError`. The pair-wise (NOT transitive) D-16 rule means this check only inspects direct edges. The manage_milestones.py `_validate_phase_ids_against_workflow` at lines 20-41 is the cross-call pattern to mirror for cleanly raising domain errors. |
| `Backend/app/infrastructure/database/seeder.py` (MODIFY) | backend-seeder (test data emitter) | self (lines 280-299 — current edge emission for waterfall workflow + lines 322-328 process_config base) | Lines 283-289 (current waterfall seed): `"edges": [{"from": "req", "to": "design"}, {"from": "design", "to": "impl"}, {"from": "impl", "to": "test"}, {"from": "test", "to": "maint"}]`. NOTE: this uses `from`/`to` not `source`/`target` — the seeder shape currently does NOT match the WorkflowEdge Pydantic shape. Phase 12 fix: change `from` → `source`, `to` → `target`, ADD `id`, ADD `type: "flow"`, ADD `bidirectional: False`, ADD `is_all_gate: False`. Lines 323-327 (current process_config base): `project.process_config = { "schema_version": 1, "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []} }` — no change needed at this base level (empty edges list). |

---

## Cross-Cutting Patterns

### TanStack Query optimistic update with rollback (Phase 11 D-38)
**Source:** `Frontend2/hooks/use-tasks.ts` lines 41-61 (`useUpdateTask`)
**Apply to:** `use-milestones.ts` (update + delete), `use-artifacts.ts` (update + delete), `use-phase-reports.ts` (update), `use-criteria-editor.ts` (PATCH process_config)

```ts
return useMutation({
  mutationFn: ({ field, value }: { field: string; value: unknown }) =>
    taskService.patchField(taskId, field, value),
  onMutate: async ({ field, value }) => {
    await qc.cancelQueries({ queryKey: ["tasks", taskId] })
    const prev = qc.getQueryData<Task>(["tasks", taskId])
    if (prev) {
      qc.setQueryData<Task>(["tasks", taskId], { ...prev, [field]: value } as Task)
    }
    return { prev }
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.prev) qc.setQueryData(["tasks", taskId], ctx.prev)
  },
  onSettled: () => {
    qc.invalidateQueries({ queryKey: ["tasks", taskId] })
  },
})
```

### Service-layer axios + DTO mapper shape (Phase 10/11)
**Source:** `Frontend2/services/comment-service.ts` lines 25-56 (full file — minimal CRUD shape)
**Apply to:** All 6 new services (`lifecycle-service.ts`, `phase-gate-service.ts`, `milestone-service.ts`, `artifact-service.ts`, `phase-report-service.ts`, `led-teams-service.ts`)

```ts
function mapComment(d: CommentResponseDTO): Comment {
  return {
    id: d.id,
    taskId: d.task_id,
    body: d.body,
    authorId: d.author_id,
    authorName: d.author_name ?? "",
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deleted: d.deleted ?? false,
  }
}

export const commentService = {
  getByTask: async (taskId: number): Promise<Comment[]> => {
    const resp = await apiClient.get<CommentResponseDTO[]>(`/comments`, {
      params: { task_id: taskId },
    })
    return resp.data.map(mapComment)
  },
  create: async (taskId: number, body: string): Promise<Comment> => {
    const resp = await apiClient.post<CommentResponseDTO>(`/comments`, { task_id: taskId, body })
    return mapComment(resp.data)
  },
  // ...
}
```

### Pure-logic module header (lib/lifecycle/*)
**Source:** `Frontend2/lib/audit-formatter.ts` lines 1-20 (header comment + zero React import)
**Apply to:** `lib/lifecycle/graph-traversal.ts`, `workflow-validators.ts`, `cloud-hull.ts`, `align-helpers.ts`, `shortcuts.ts`, `presets.ts`

```ts
// Pure <feature> helper (Phase 12 Plan XX).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumers live in
// Frontend2/components/<feature>/<file>.tsx.

export interface <ResultType> { ... }

export function <pureFn>(<typedInput>): <typedOutput> {
  ...
}
```

### Inline-add row + draft state + commit-on-blur (settings-columns-subtab pattern)
**Source:** `Frontend2/components/project-detail/settings-columns-subtab.tsx` lines 95-291
**Apply to:** `milestones-subtab.tsx`, `artifacts-subtab.tsx`, `criteria-editor-panel.tsx` (manual criteria list)

```tsx
// Per-row drafts keyed by id so user can type freely without racing query refetches.
const [drafts, setDrafts] = React.useState<Record<number, DraftShape>>({})

// Stable string dep to avoid OOM feedback loop on fresh-array-reference renders.
const shape = serializeShape(items)
React.useEffect(() => {
  const d: Record<number, DraftShape> = {}
  items.forEach((it) => { d[it.id] = { ...defaults } })
  setDrafts(d)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [shape])

async function save(item: Item) {
  const draft = drafts[item.id]
  if (!draft) return
  if (sameAs(draft, item)) return
  try {
    await apiClient.patch(`/.../${item.id}`, buildPatch(draft, item))
    qc.invalidateQueries({ queryKey: [...] })
    showToast({ variant: "success", message: ... })
  } catch (err: unknown) {
    showToast({ variant: "error", message: backendErrorMessage(err) ?? ... })
  }
}

// In JSX:
<input
  value={draft.name}
  onChange={(e) => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, name: e.target.value } }))}
  onBlur={() => save(item)}
  style={INPUT_STYLE}
/>
```

### Dynamic import with `ssr: false` (Phase 11 D-36, applies to React Flow per D-07)
**Source:** `Frontend2/components/task-detail/description-editor.tsx` lines 17-31 (TipTap pattern)
**Apply to:** `Frontend2/components/workflow-editor/workflow-canvas.tsx`

```tsx
import dynamic from "next/dynamic"
import { CanvasSkeleton } from "./canvas-skeleton"

// ssr:false keeps React Flow out of the SSR render path entirely.
// React Flow depends on window, ResizeObserver, getBoundingClientRect — none exist in Node SSR.
const WorkflowCanvasInner = dynamic(() => import("./workflow-canvas-inner"), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
})
```

### Methodology-aware lookup tables (Phase 11 D-16/D-42)
**Source:** `Frontend2/lib/methodology-matrix.ts` lines 17-52 (lookup record + resolver function)
**Apply to:** `Frontend2/lib/lifecycle/presets.ts` (Plan 12-10), and any new methodology-conditional behavior

```ts
export const PRESETS_BY_ID: Record<PresetId, WorkflowConfig> = {
  scrum: { mode: "flexible", nodes: [...], edges: [...], groups: [] },
  waterfall: { mode: "sequential-locked", nodes: [...], edges: [...], groups: [] },
  // ... 7 more
}

export function resolvePreset(id: PresetId): WorkflowConfig {
  return PRESETS_BY_ID[id]
}
```

### Pydantic field defaults additive (no normalizer migration per SPEC line 22)
**Source:** `Backend/app/application/dtos/workflow_dtos.py` lines 24-29 (current `WorkflowEdge`)
**Apply to:** `WorkflowEdge` add `bidirectional: bool = False`, `is_all_gate: bool = False`

```python
class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["flow", "verification", "feedback"] = "flow"
    label: Optional[str] = None
    bidirectional: bool = False    # Phase 12 D-16 — pair-wise reverse, NOT transitive
    is_all_gate: bool = False      # Phase 12 D-17 — Jira-style source-agnostic
```

Pydantic applies defaults on read for any edge JSON missing the new fields — no `_migrate_v1_to_v2` normalizer is written, no `CURRENT_SCHEMA_VERSION` bump (SPEC line 22 + D-18 SPEC override at UI-SPEC line 1684).

### Status-aware retry policy (Phase 11)
**Source:** `Frontend2/hooks/use-projects.ts` lines 67-71 (`useGlobalActivity` retry config)
**Apply to:** `use-phase-transitions.ts` (don't retry on 409/422, do retry on 429 after countdown)

```ts
retry: (failureCount, err: unknown) => {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 409) return false  // concurrent edit — refetch + show banner
  if (status === 422) return false  // criteria unmet — show per-criterion list
  if (status === 429) return false  // rate-limit — countdown timer; user retries manually
  return failureCount < 3
}
```

### Backend error message extraction (settings-columns-subtab pattern)
**Source:** `Frontend2/components/project-detail/settings-columns-subtab.tsx` lines 49-53
**Apply to:** All 6 services + 9 hooks for error toast messages

```ts
function backendErrorMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  return typeof detail === "string" ? detail : null
}
```

### Permission-gated buttons via composed hook (D-03 + D-40)
**Source:** NEW PATTERN — Phase 12 introduces the 3-role hook. Closest existing pattern: `Frontend2/components/project-detail/settings-columns-subtab.tsx` line 91 (`isWaterfall = project.methodology === "WATERFALL"`) for conditional rendering — but Phase 12's hook is composed across 3 sources.
**Apply to:** Phase Gate "Sonraki Faza Geç", Milestone POST/PATCH/DELETE, Artifact POST/DELETE, PhaseReport CRUD, Workflow Editor "Kaydet"

```tsx
const canTransition = useTransitionAuthority(project)
// ...
{canTransition && (
  <Button onClick={openGate}>{T("Sonraki Faza Geç","Move to Next Phase")}</Button>
)}
```

`useTransitionAuthority` itself is composed from `useAuth().user.role === 'Admin'` OR `project.managerId === user.id` OR `useLedTeams().some(t => t.projectIds.includes(project.id))` per D-03.

---

## No Analog Found (NEW PATTERN — first use in Frontend2)

These files have no close match in the codebase. Planner should use prototype source + RESEARCH patterns instead.

| File | Role | Why no analog | Reference |
|------|------|---------------|-----------|
| `phase-node.tsx` | React Flow custom node renderer | Frontend2 has no graph library | `New_Frontend/src/pages/workflow-editor.jsx` lines 64-92 (visual port) + `@xyflow/react` `<NodeProps>` API (RESEARCH) |
| `phase-edge.tsx` | React Flow custom edge renderer | Frontend2 has no SVG-edge component beyond timeline-tab | `New_Frontend/src/pages/workflow-editor.jsx` lines 25-46 + `@xyflow/react` `BaseEdge` + `EdgeLabelRenderer` API |
| `all-gate-edge.tsx` | Sub-renderer for `is_all_gate=true` | Extends phase-edge.tsx; no parent analog | Same as phase-edge.tsx |
| `group-cloud-node.tsx` | Concave-hull group renderer | Frontend2 has no hull algorithm; the prototype uses sharp-edged rectangles which D-22 explicitly rejects | RESEARCH §Concave-hull algorithm + `concaveman` library |
| `cloud-hull.ts` | Pure hull math | No hull math in Frontend2 | RESEARCH §Concave-hull algorithm (concaveman or convex-hull-plus-padding baseline) |
| `context-menu.tsx` | Right-click menu | Frontend2 has only ConfirmDialog (Phase 10 D-25); no positioned floating menu | Build minimal ~80-line component with `useEffect` click-outside + Esc listener |
| `tooltip.tsx` (NEW primitive) | Lightweight tooltip wrapper | No Tooltip primitive in Frontend2 | ~40 lines: portal-based positioned div on `onMouseEnter` |
| `minimap-wrapper.tsx` | Custom-styled MiniMap | Frontend2 has no minimap | `@xyflow/react` `<MiniMap/>` docs + theme via CSS vars (RESEARCH §React Flow Theming) |
| `use-editor-history.ts` | Undo/redo stack hook | No undo/redo elsewhere in Frontend2 | Custom hook ~100 lines per D-27 — past[]/future[] stack arrays in React state |
| `dirty-save-dialog.tsx` (mentioned in pattern_mapping_context but not in UI-SPEC File Map — likely composed inside `editor-page.tsx`) | Router intercept + ConfirmDialog | No router intercept in Frontend2 | Build with `useEffect` + `window.addEventListener('beforeunload')` + Next.js `router.events` per D-29 |
| `viewport-fallback.tsx` | <1024px fallback | Frontend2 has no viewport gate. Closest: lifecycle-stub-tab.tsx 8-line AlertBanner | Same shape as lifecycle-stub-tab.tsx — mounts conditionally based on `useEffect`-tracked window.innerWidth |
| `canvas-skeleton.tsx` | Dynamic-import loading placeholder | Frontend2 has the TipTap loading at description-editor.tsx lines 20-30 (small fallback) — extend to canvas-sized + center "Yükleniyor..." | `description-editor.tsx` line 20-30 |

---

## Plan-by-Plan Pattern Summary (per RESEARCH §Plan-by-Plan Sketch)

| Plan | Files | Dominant Pattern | Key Excerpts |
|------|-------|------------------|--------------|
| 12-01 (Shared Infra) | 22 files | use-tasks.ts mutation shape + audit-formatter.ts pure-fn header + description-editor.tsx dynamic-import | Lines listed under each file row above |
| 12-02 (Phase Gate Expand) | phase-gate-expand.tsx, summary-strip.tsx, mini-metric.tsx | settings-columns-subtab.tsx draft+commit + use-projects.ts status-aware retry | Optimistic + retry pattern excerpts |
| 12-03 (Settings > Lifecycle) | criteria-editor-panel.tsx + 2 modify | settings-columns-subtab.tsx draft pattern (per phase_id key instead of col.id) | Lines 95-148 of settings-columns-subtab.tsx |
| 12-04 (Overview + History) | lifecycle-tab.tsx, overview-subtab.tsx, history-subtab.tsx + 1 modify | board-tab.tsx memoized derive + use-tasks.ts parametrized cache key for lazy fetch | Lines 50-80 of board-tab.tsx + lines 4-10 of use-tasks.ts |
| 12-05 (Milestones + Timeline) | milestones-subtab.tsx + 2 modify | settings-columns-subtab.tsx inline-add row + timeline-tab.tsx SVG line rendering | Lines 95-291 of settings-columns-subtab.tsx + lines 162-205 of timeline-tab.tsx |
| 12-06 (Artifacts + Eval Report) | artifacts-subtab.tsx, evaluation-report-card.tsx | settings-columns-subtab.tsx Card padding=0 + properties-sidebar.tsx MetaRow | Lines 187-291 of settings-columns-subtab.tsx + lines 33-50 of properties-sidebar.tsx |
| 12-07 (Editor Shell + Viewport Gate) | 11 files | project-detail-shell.tsx 2-col layout + projects/[id]/page.tsx route shape + lifecycle-stub-tab.tsx for viewport-fallback | Lines 1-50 of project-detail-shell.tsx + lines 1-71 of projects/[id]/page.tsx |
| 12-08 (Editor Interactivity) | 4 modify + context-menu.tsx | NEW PATTERN — React Flow callbacks; closest: backlog-panel.tsx custom hook for `useBacklogOpenState` (state machine pattern) | Lines 72-120 of backlog-panel.tsx |
| 12-09 (Backend + Save Flow) | 3 backend modify + editor-page.tsx wire | workflow_dtos.py self-extend + execute_phase_transition.py self-extend + manage_milestones.py cross-validation pattern + use-projects.ts retry | Lines 24-29 + 67-104 of workflow_dtos.py + lines 20-41 of manage_milestones.py + lines 67-71 of use-projects.ts |
| 12-10 (Presets + Polish) | presets.ts + 1 modify | methodology-matrix.ts lookup-table + per-preset validateWorkflow check | Lines 17-52 of methodology-matrix.ts |

---

## Metadata

**Analog search scope:**
- `Frontend2/components/project-detail/` (all 27 files scanned)
- `Frontend2/components/my-tasks/` (5 files scanned)
- `Frontend2/components/task-detail/` (15 files scanned — for properties-sidebar pattern)
- `Frontend2/components/primitives/` (16 primitives — referenced as reusable assets only, none replaced)
- `Frontend2/hooks/` (all 7 files scanned)
- `Frontend2/services/` (all 7 files scanned)
- `Frontend2/lib/` (audit-formatter.ts, methodology-matrix.ts identified as canonical pure-logic patterns)
- `Frontend2/context/` (auth-context.tsx + app-context.tsx for hook composition)
- `Frontend2/app/(shell)/` (route patterns)
- `Backend/app/application/dtos/workflow_dtos.py` (read in full)
- `Backend/app/application/use_cases/execute_phase_transition.py` (read in full)
- `Backend/app/application/use_cases/manage_milestones.py` (cross-file validation pattern)
- `Backend/app/infrastructure/database/seeder.py` (workflow seeding sections)

**Files scanned:** ~85
**Pattern extraction date:** 2026-04-25
**Phase 11 carry-forward patterns confirmed:** D-32 MTTaskRow, D-36 TipTap dynamic-import, D-38 optimistic update, D-42/D-43 cycle_label override, D-51 chip picker (referenced in D-50)
**SPEC overrides honored:** SPEC line 22 (NO normalizer migration), SPEC line 1684 (NO process_config_normalizer.py change)
