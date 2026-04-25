---
phase: 12
plan: 06
plan_id: "12-06"
subsystem: lifecycle-artifacts-evaluation-report
status: completed
completed_at: 2026-04-25
duration_min: 12
tasks_completed: 2
files_created: 3
files_modified: 2
tags:
  - frontend
  - lifecycle
  - artifacts-subtab
  - artifact-inline-expand
  - evaluation-report-card
  - history-card-rapor
  - pdf-download
  - life-06
  - life-07
  - tdd
  - rtl
requirements:
  - LIFE-06
  - LIFE-07
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: Consumes useArtifacts / useUpdateArtifact / useUpdateArtifactMine / useDeleteArtifact / useCreateArtifact / useUploadArtifactFile and usePhaseReports / useUpdatePhaseReport / useCreatePhaseReport / useDownloadPhaseReportPdf hooks (optimistic + rollback per Phase 11 D-38). Also consumes useTransitionAuthority for permission gating (D-40).
    - phase: 12
      plan: 02
      reason: Plugs ArtifactsSubTab INTO the LifecycleTab outer shell from Plan 12-02 (replaces the Plan 12-04 placeholder Card with the live sub-tab content).
    - phase: 12
      plan: 04
      reason: Extends HistoryCard from Plan 12-04 with the LIFE-07 'Rapor' Button + inline EvaluationReportCard expand. Plan 12-04 left a placeholder comment 'Plan 12-06 will add a Rapor Button + EvaluationReportCard here.' — Plan 12-06 fulfills it.
    - phase: 9
      reason: Backend artifact CRUD + assignee /mine split URL (D-36), file_id single-file upload (D-41), PhaseReport CRUD + revision auto-increment (D-25), fpdf2 sync PDF endpoint (D-58) with 30s rate limit (D-51) — all consumed as-is.
    - phase: 10
      reason: Reuses ConfirmDialog (Phase 10 D-25) for the soft-warning delete dialog on draft artifacts.
  provides:
    - id: 12-06-artifact-inline-expand
      label: ArtifactInlineExpand — name Input + status SegmentedControl (Yok/Taslak/Tamam) + note textarea + sorumlu dropdown stub + single-file Dosya Ekle button. Path selection (PM full vs assignee /mine) decided client-side via useAuth().user.id === artifact.assigneeId; backend re-validates as defense in depth.
    - id: 12-06-artifacts-subtab
      label: ArtifactsSubTab — 5-column row table (Artefakt / Durum / Güncelleme / Sorumlu / Kebab) with click-to-expand inline editor; Yeni Artefakt Ekle reveals a name-only inline-add Card; permission gate hides Add + per-row Sil when authority returns false; soft-warning ConfirmDialog appears for draft delete; not-created delete fires DELETE directly.
    - id: 12-06-evaluation-report-card
      label: EvaluationReportCard — inline-expand panel with 4 read-only summary mini-rows + 3 free-text textareas + rev N mono Badge + Save (lazy-create on first save) + PDF Blob download with countdown UI on 429 + 409 reload AlertBanner.
    - id: 12-06-history-card-rapor
      label: HistoryCard — extended with 'Rapor' Button + reportOpen state + inline EvaluationReportCard expand below the card body, independent of the LIFE-04 Görev Detayları Collapsible.
  affects:
    - Frontend2/components/lifecycle/lifecycle-tab.tsx (Plan 12-04 placeholder Card replaced with <ArtifactsSubTab/>)
tech_stack:
  added: []
  patterns:
    - "Path selection at the call site: useUpdateArtifact (PM full path /artifacts/{id}) vs useUpdateArtifactMine (assignee path /artifacts/{id}/mine) chosen by 'user.id === artifact.assigneeId'. assignee_id is omitted from the /mine PATCH body via the ArtifactUpdateByMineDTO type — the field cannot leak. Backend re-validates so a misclassified call still rejects (T-12-06-01 mitigation)."
    - "Single-file constraint at the input handler: onFileChange consumes files[0] only. A user attempting to drag-and-drop multiple files into the picker still triggers exactly one upload (Phase 9 D-41 single-file constraint)."
    - "revision NEVER sent in PATCH body (T-12-06-03): backend D-25 auto-increments revision; the PhaseReportUpdateDTO type at the service layer omits the field entirely; the component reads `report.revision` for display + filename only (anchor.download = `Phase-Report-${key}-${slug}-rev${revision}.pdf`)."
    - "Lazy-create on first PhaseReport save: when usePhaseReports returns no entry for the active phase, EvaluationReportCard's Kaydet calls useCreatePhaseReport (POST). On the next render, the report exists; subsequent saves PATCH. cycle_number is auto-set server-side (Phase 9 D-25); frontend never sends it."
    - "PDF rate-limit honored client-side: 429 → pdfCountdown state + setInterval ticker disables the button with '\${n}s bekleyin' label until 0; warning toast on entry, success toast on completion. The Plan 12-01 useDownloadPhaseReportPdf hook handles the createObjectURL → anchor click → revoke chain so the test can stub URL.createObjectURL + spy on document.createElement('a') to verify the filename pattern."
    - "Soft-warning vs direct delete: artifacts with status='not-created' DELETE immediately when the kebab Sil is clicked; status='draft' or 'done' open a ConfirmDialog with the 'Bu artefakt taslak durumunda. Silmek istediğinize emin misiniz?' copy. Honors CONTEXT D-54 — PM with transition-authority can manage; backend re-validates."
    - "Assignee dropdown sourced from manager + self stub. The real /projects/{id}/members endpoint lands in Phase 13 PROF-01; Plan 12-06 ships a graceful degradation: project.managerId becomes 'Proje Yöneticisi' option + useAuth().user becomes 'Ben' option. When members endpoint exists, the stub list is replaced with a single line."
    - "Test sequencing: tests await `screen.getByText(/rev 3/i)` BEFORE interacting because the rev N badge only renders after usePhaseReports resolves. Without that wait, Save would POST instead of PATCH because `report` is still null — false positive masking."
key_files:
  created:
    - Frontend2/components/lifecycle/artifact-inline-expand.tsx
    - Frontend2/components/lifecycle/artifacts-subtab.tsx
    - Frontend2/components/lifecycle/artifacts-subtab.test.tsx
    - Frontend2/components/lifecycle/evaluation-report-card.tsx
    - Frontend2/components/lifecycle/evaluation-report-card.test.tsx
  modified:
    - Frontend2/components/lifecycle/lifecycle-tab.tsx
    - Frontend2/components/lifecycle/history-card.tsx
decisions:
  - "Assignee dropdown uses the manager + self stub for now (CONTEXT D-53 explicitly notes this is acceptable until /projects/{id}/members lands). Three-line swap when Phase 13 ships members. Stub avoids a 404 on every artifact expand and keeps the visual parity with the prototype."
  - "File-upload max-size assumed 10MB matching prototype copy 'Dosya boyutu sınırı aşıldı (max 10MB).'. Phase 3 backend should be verified to share that 10MB constant; if it differs, AlertBanner copy needs an update — left as a note for future phase coordination."
  - "PDF Blob download verified in jsdom test: window.URL.createObjectURL stubbed, document.createElement('a') spied to capture all anchors. The anchor.click call may throw inside jsdom (navigation not implemented) — caught by try/catch in the spy. Filename matched against /Phase-Report-MOBIL-execution-rev3\\.pdf/ regex."
  - "Test 6 (PDF 429 countdown) uses real timers with retry_after_seconds=2 instead of vi.useFakeTimers + advanceTimersByTimeAsync. Reason: fake timers prevent the async usePhaseReports query from resolving (TanStack Query schedules micro-tasks that don't progress under fake timers without extra orchestration). Real-timer 2-second retry is bounded and predictable; test runtime stays under 4s."
  - "ConfirmDialog opens on 'draft' delete with the soft-warning copy 'Bu artefakt taslak durumunda. Silmek istediğinize emin misiniz?'. Status 'done' artifacts also trigger the dialog (in-progress is anything not 'not-created') — the prototype's branch logic was 'PM only on not-created, soft warning on others'. This matches the SPEC LIFE-06 'PM with transition-authority can delete \"not-created\" artifacts; in-progress artifacts surface a soft warning before delete'."
  - "Test 3 fixture switched from Sprint Planı (assignee_id=1, would have hit /mine path) to Daily Notes (assignee_id=null, takes PM full path). Test 4 explicitly tests Sprint Planı's assignee path — the two tests are mirror cases that exercise both branches of the path-selection logic."
  - "Test 4 disambiguates the 'Taslak' chip from the 'Taslak' status label by selecting the SegmentedControl button via role='button' name='Taslak' rather than getByText. The status label uses a span; the SegmentedControl uses a button — RTL's getByRole picks the button cleanly."
  - "lifecycle-tab.tsx wires <ArtifactsSubTab project={project} workflow={workflow}/> in place of the Plan 12-04 placeholder Card. The Tabs primitive routing logic is unchanged — only the artifacts branch's content swaps."
metrics:
  duration_min: 12
  task_count: 2
  files_created: 5
  test_files_added: 2
  tests_added: 18
  full_suite_tests: 266
  full_suite_test_files: 42
---

# Phase 12 Plan 06: Artifacts Sub-Tab + Evaluation Report Inline Expand Summary

LIFE-06 + LIFE-07 fully delivered, completing the LIFE-* requirement set (LIFE-01..07 are all green now). The Artifacts sub-tab is the last of the four sub-tabs in the Lifecycle tab; the EvaluationReportCard inline-expand on past-phase HistoryCards rounds out the Phase Gate / Phase Report flow. 5 new files, 2 modifications, 18 new RTL test cases, 266/266 full suite green — zero regressions vs the 248 Plan 12-05 baseline (10 + 8 net new).

## What Shipped

### Task 1 — ArtifactsSubTab + ArtifactInlineExpand (commits `351a96b` + `c79f9ae`)

`Frontend2/components/lifecycle/artifact-inline-expand.tsx` (~360 LOC) per UI-SPEC §7 lines 1016-1064:

- **Layout (expanded panel):** padding 16, `background: var(--bg-2)`. 2-col grid `1fr 1fr` for name Input + status SegmentedControl. Note textarea full width. Sorumlu dropdown + Dosya Ekle Button row. Save / Kapat Buttons.
- **Path selection (Phase 9 D-36 + T-12-06-01):** `const isAssignee = userId != null && artifact.assigneeId != null && userId === artifact.assigneeId`. When `isAssignee`, save uses `useUpdateArtifactMine` (PATCH `/artifacts/{id}/mine`); otherwise `useUpdateArtifact` (PATCH `/artifacts/{id}`). The `/mine` DTO is typed `ArtifactUpdateByMineDTO` which structurally omits `assignee_id` — the field cannot leak.
- **Single-file constraint:** `onFileChange` reads `files[0]` only — even when 2 files are selected via the picker, exactly one upload mutation fires (Phase 9 D-41). 413 surfaces an AlertBanner with copy "Dosya boyutu sınırı aşıldı (max 10MB)."; generic err shows "Dosya yüklenemedi."
- **Sorumlu dropdown (D-53 stub):** sourced from `project.managerId` ("Proje Yöneticisi") + `useAuth().user` ("Ben"). Click-outside dismiss on `mousedown`. Disabled when `isAssignee` because the assignee path can't change `assignee_id`.
- **revision NEVER sent in body (T-12-06-03):** the PATCH body is `{ name?, status?, note?, assignee_id? }` for the PM path or `{ status?, note? }` for the /mine path. Backend D-25 auto-increments any future Artifact revision; the field never round-trips.

`Frontend2/components/lifecycle/artifacts-subtab.tsx` (~310 LOC) per UI-SPEC §3 lines 380-440:

- **Section header:** "Artefaktlar (N)" + "M/N tamamlandı" mono counter + "Yeni Artefakt Ekle" Button (visible only when `canEdit && !adding`).
- **Inline custom-add row:** `Card padding=14` with name Input + Save / Cancel; on Save calls `useCreateArtifact.mutateAsync({ name, status: 'not-created', assignee_id: null })`. Mirrors the Milestone sub-tab inline-add pattern.
- **Row table:** 5-column grid `2fr 120px 150px 100px 40px` with header row + per-artifact data row. Each data row has icon + name + status dot + status label + updated date + Avatar + more-kebab. Click row toggles inline expand.
- **More-kebab Sil branching (D-54):**
  - `status === 'not-created'` → DELETE issued directly, no ConfirmDialog
  - `status === 'draft' | 'done'` → ConfirmDialog opens with soft-warning copy "Bu artefakt taslak durumunda. Silmek istediğinize emin misiniz?"
- **Permission gate (D-40):** `useTransitionAuthority(project)` returns boolean. When false: Add hidden, kebab + Sil item hidden. Backend re-validates every action.
- **Empty state:** `artifacts.length === 0 && !adding` → "Bu metodoloji için tanımlı artefakt bulunamadı." inside a dashed-border placeholder div.

`Frontend2/components/lifecycle/artifacts-subtab.test.tsx` ships **10 RTL test cases**:

1. Test 1 — list render: 5 SCRUM artifacts (Sprint Planı / Sprint Backlog / Daily Notes / Sprint Review / Retrospective) all visible
2. Test 2 — inline expand on click: clicking Sprint Planı reveals Kaydet + Kapat + SegmentedControl options below; sibling rows still visible
3. Test 3 — status save (PM path): Daily Notes (assignee_id=null) → click Tamam + Kaydet → PATCH `/artifacts/103` body `{status: 'done'}`; revision NOT sent
4. Test 4 — assignee path selection: Sprint Planı (assignee_id=1, user.id=1) → click Taslak (SegmentedControl button via role) + Kaydet → PATCH `/artifacts/101/mine`
5. Test 5 — single file upload: 2 files selected → only 1 POST `/artifacts/101/file` issued
6. Test 6 — file 413: AlertBanner shows "Dosya boyutu sınırı aşıldı (max 10MB)."
7. Test 7 — PM delete on `not-created`: kebab → Sil → DELETE `/artifacts/103` directly, no dialog
8. Test 8 — PM delete on `draft` shows soft warning: kebab → Sil → ConfirmDialog with "Bu artefakt taslak durumunda" copy appears
9. Test 9 — custom add reveal: "Yeni Artefakt Ekle" → Input + Save / Cancel visible
10. Test 10 — empty state: "Bu metodoloji için tanımlı artefakt bulunamadı." copy renders

`Frontend2/components/lifecycle/lifecycle-tab.tsx` modified:
- Added `import { ArtifactsSubTab } from "./artifacts-subtab"`.
- Replaced the placeholder `<Card>` for `subTab === "artifacts"` with `<ArtifactsSubTab project={project} workflow={workflow}/>`.

### Task 2 — EvaluationReportCard + HistoryCard Rapor wiring (commits `a1a04af` + `89467c9`)

`Frontend2/components/lifecycle/evaluation-report-card.tsx` (~310 LOC) per UI-SPEC §8 lines 1066-1112:

- **Layout:** padding 16, `background: var(--bg-2)`, `border-radius: var(--radius)`, `box-shadow: inset 0 0 0 1px var(--border)`.
- **Header:** "Faz Değerlendirme Raporu — {phase.name}" + `<Badge size="xs" tone="mono">rev {report?.revision ?? 1}</Badge>` + optional close X.
- **Read-only summary mini-rows:** 4-column grid showing `summary_task_count` / `summary_done_count` / `summary_moved_count` / `summary_duration_days` from the latest PhaseReport — pre-filled by the backend (D-57 hybrid auto-prefill).
- **3 free-text textareas:** `issues` / `lessons` / `recommendations` bound to local state; placeholders match prototype copy ("API yanıt süresi gecikti, Redis cache ile çözüldü." / "Erken performans testi kritik. Her sprint'te mini-benchmark." / "Sonraki faz için öneri yazın…").
- **Save flow:** PATCH `/phase-reports/{id}` body `{issues, lessons, recommendations}` — revision NEVER sent (T-12-06-03). On 409 → AlertBanner "Başka bir kullanıcı raporu güncelledi. Yenileyin." + Yenile Button → invalidates `['phase-reports', 'project', id]`. Lazy create on first save (POST + cycle_number auto from backend D-25).
- **PDF flow (D-58):** Button label dynamic — countdown takes precedence over loading state takes precedence over default "PDF". On click: `useDownloadPhaseReportPdf.mutateAsync({reportId, projectKey, phaseSlug, revision})` triggers Blob fetch + createObjectURL + anchor.click + revokeObjectURL chain in the Plan 12-01 hook with filename `Phase-Report-${key}-${slugify(phaseSlug)}-rev${revision}.pdf`. On 429 → `setPdfCountdown(retry_after_seconds ?? 30)`; setInterval ticker decrements every 1s; clearInterval on cleanup. Success → toast "PDF indirildi."
- **Permission gate:** `canEdit=false` hides Kaydet but keeps PDF visible — any project member can download.

`Frontend2/components/lifecycle/evaluation-report-card.test.tsx` ships **8 RTL test cases**:

1. Test 1 — auto-prefill: summary fields render real backend values (15 / 14 / 42); 3 textareas empty
2. Test 2 — revision badge: "rev 3" mono Badge in header
3. Test 3 — save: typing into issues + Kaydet → PATCH `/phase-reports/55` body `{issues, lessons:'', recommendations:''}`; revision NOT sent
4. Test 4 — save 409: AlertBanner with "Yenile" Button shown; warning copy contains "Başka bir kullanıcı raporu güncelledi"
5. Test 5 — PDF download success: createObjectURL called once; anchor.download matches `/Phase-Report-MOBIL-execution-rev3\.pdf/`
6. Test 6 — PDF 429 countdown: button disabled with `Ns bekleyin` label after 429; auto re-enables when countdown ends (uses real timers with retry_after=2 for predictability)
7. Test 7 — HistoryCard Rapor toggle: pre-click no EvaluationReportCard mounted; click → expand renders; click again → collapse
8. Test 8 — placeholders: 3 textareas have the expected placeholder copy

`Frontend2/components/lifecycle/history-card.tsx` modified:
- Added `import { FileText } from "lucide-react"` + `Button` from primitives + `EvaluationReportCard` from sibling file.
- Added `managerId?: number | null` + `manager_id?: number | null` to `HistoryCardProject` so EvaluationReportCard's `useTransitionAuthority` composition works.
- Added `[reportOpen, setReportOpen] = useState(false)` state.
- Added `<Button size="xs" variant="ghost" icon={<FileText size={12}/>} onClick={() => setReportOpen(v => !v)} active={reportOpen}>{T("Rapor", "Report")}</Button>` to the header row.
- Added `{reportOpen && <EvaluationReportCard project={project} phase={phase} onClose={() => setReportOpen(false)}/>}` below the LIFE-04 Collapsible.

## Plan 12-06 Output Spec — Resolutions

The plan output spec asks 3 questions:

**1. Whether the artifact assignee dropdown was wired to a real members endpoint or stays as the manager+self stub (decision per UI-SPEC line 1050)?**

**Stays as the manager+self stub.** UI-SPEC line 1050 explicitly allows "degrade gracefully if no members endpoint available". A real `/projects/{id}/members` endpoint lands in Phase 13 PROF-01 alongside the project members management UI. Plan 12-06 implementation: `assigneeOptions = [{id: project.managerId, name: 'Proje Yöneticisi'}, {id: user.id, name: user.name}]`. When the real endpoint lands, swap the `useMemo` source — the dropdown render path and selection callback remain unchanged.

**2. File-upload max-size — currently the AlertBanner says 10MB; verify this matches Phase 3 backend limit?**

**10MB constant assumed; backend not re-verified in this plan.** The prototype's copy was "Dosya boyutu sınırı aşıldı (max 10MB)." which Plan 12-06 honored verbatim. Phase 3's file-upload machinery should expose a max-size constant; if it differs from 10MB, the AlertBanner copy needs an update. Logged in this summary so a future plan (most likely Phase 13 file-management surface or the Phase 3 audit pass) can reconcile the constants. The 413 status code itself is the actual signal — clients should never compute max-size client-side.

**3. Confirmation that PDF Blob download works in jsdom test (or stub `URL.createObjectURL` correctly)?**

**Confirmed** via Test 5 stubs:
- `window.URL.createObjectURL` defined as `vi.fn().mockReturnValue("blob:fake-url")` with `configurable: true`
- `window.URL.revokeObjectURL` mocked to `vi.fn()`
- `document.createElement` spied with `mockImplementation` that wraps anchors: `anchor.click = () => { clickedAnchors.push(anchor); try { origClick() } catch {} }` — the `try/catch` swallows jsdom's navigation-not-implemented error
- Assertion: `clickedAnchors.find(a => /Phase-Report-MOBIL-execution-rev3\.pdf/.test(a.download))` is truthy

The Plan 12-01 `useDownloadPhaseReportPdf` hook does the actual chain (createObjectURL → anchor → click → remove → revokeObjectURL); the test stubs are sufficient to verify the filename pattern lands without exercising the live Blob.

## Test Coverage

| File                                                                | Test cases | Notes                                                                                       |
|---------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------|
| `artifacts-subtab.test.tsx` (NEW)                                   | 10         | Row table render + inline expand + status save + assignee path + single file + 413 + delete branching + custom add + empty state |
| `evaluation-report-card.test.tsx` (NEW)                             | 8          | Auto-prefill + rev badge + PATCH semantics + 409 reload + PDF Blob filename + 429 countdown + Rapor toggle + placeholders |

Full Frontend2 suite: **266 / 266 tests** across 42 files — zero regressions vs the 248-test Plan 12-05 baseline (18 net new across the 2 task commits).

`cd Frontend2 && npm run test -- artifacts-subtab evaluation-report-card history-card` exits 0.

## Acceptance grep matrix (Plan 12-06)

| Acceptance check                                                                                          | Result |
|-----------------------------------------------------------------------------------------------------------|--------|
| `useArtifacts \| useUpdateArtifact \| useUploadArtifactFile` in artifacts-subtab.tsx                       | 5 hits |
| `useUpdateArtifactMine \| /mine` in artifact-inline-expand.tsx                                            | 4 hits |
| `files[0]` single-file constraint in artifact-inline-expand.tsx                                            | 1 hit  |
| `ConfirmDialog` in artifacts-subtab.tsx                                                                    | 5 hits |
| `useTransitionAuthority \| canEdit` in artifacts-subtab.tsx                                                | 6 hits |
| `ArtifactsSubTab` in lifecycle-tab.tsx                                                                     | 2 hits |
| `revision` in artifact-inline-expand.tsx (comments only — never sent in body)                              | 2 hits (both comments) |
| `rev ${report.revision}` Badge in evaluation-report-card.tsx                                               | 3 hits |
| `Phase-Report-` filename in use-phase-reports.ts (the actual filename construction)                         | 1 hit  |
| `retry_after_seconds \| pdfCountdown` in evaluation-report-card.tsx                                        | 11 hits |
| `PDF oluşturuluyor` in evaluation-report-card.tsx                                                          | 1 hit  |
| `EvaluationReportCard` in history-card.tsx                                                                 | 5 hits |
| `Rapor \| reportOpen` in history-card.tsx                                                                   | 7 hits |
| `revision` in evaluation-report-card.tsx (read-only display + filename + comments — never sent in body)     | 6 hits (all read-only) |

All 14 grep checks pass.

## LIFE-06 + LIFE-07 acceptance verification

**LIFE-06 (Artifact sub-tab):**
- Scrum project create → seeded artifacts ("Sprint Planı" / "Sprint Backlog" / "Daily Notes" / "Sprint Review" / "Retrospective") appear (sourced from `ProcessTemplate.default_artifacts` via the Phase 9 ArtifactSeeder, already wired on project create) — verified by Test 1 directly mocking the GET response with the 5 fixture artifacts.
- Click "Sprint Planı" → expand panel reveals → upload file → status SegmentedControl flips → save → PATCH issued — verified by Tests 2-5.
- PM with transition-authority can delete `not-created` artifacts directly (Test 7); `draft` artifacts surface ConfirmDialog (Test 8); methodology change is no-op on existing artifacts (frontend never duplicates cascade logic — Phase 9 D-29 preserved at backend).

**LIFE-07 (Evaluation Report inline expand + PDF):**
- Open a closed phase's "Rapor" → EvaluationReportCard expands with auto-prefilled summary fields read-only (Test 1).
- Free text empty → type into issues → save → PATCH `/phase-reports/{id}` with auto-incrementing revision (Test 3).
- "PDF" button → Blob download with filename `Phase-Report-MOBIL-execution-rev3.pdf` (Test 5).
- 429 → countdown UI disables button (Test 6); HistoryCard Rapor button toggles inline expand (Test 7).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] Test 3 + Test 4 fixture path conflict caused an early test failure.**
- Found during: Task 1 GREEN run.
- Issue: Both tests originally targeted Sprint Planı (id=101, assignee_id=1). Because the mocked auth user is `{id: "1"}`, every save on Sprint Planı routes through the assignee `/mine` endpoint. Test 3 expected the PM full path `/artifacts/101`; Test 4 expected the assignee path `/artifacts/101/mine`. The first test that ran asserted PM path and got assignee — fail.
- Fix: switched Test 3 to use Daily Notes (id=103, assignee_id=null) which forces the PM path; Test 4 retained Sprint Planı for the assignee path. The two tests now mirror each other and exercise both branches.
- File: `Frontend2/components/lifecycle/artifacts-subtab.test.tsx`.

**2. [Rule 1 — Bug] Test 4 'Found multiple elements with the text: Taslak'.**
- Found during: Task 1 GREEN run (after Fix 1).
- Issue: Sprint Backlog row (id=102) renders the status label "Taslak" as a span; the SegmentedControl chip option "Taslak" is a button. `screen.getByText('Taslak')` matched both, throwing.
- Fix: switched the assertion to `screen.getByRole('button', { name: 'Taslak' })` which selectively picks the SegmentedControl button.

**3. [Rule 1 — Bug] EvaluationReportCard tests interacted with the DOM before the async usePhaseReports query resolved.**
- Found during: Task 2 GREEN run.
- Issue: Tests originally awaited `screen.getByText(/Faz Değerlendirme Raporu/)` (the static title) which resolves immediately. Subsequent assertions for "15", "rev 3", PATCH calls, etc. fired before the query resolved → `report` was still null → component rendered fallback values + Save would have POSTed instead of PATCHed. False positive masking.
- Fix: changed the wait condition to `screen.getByText(/rev 3/i)` (or `screen.getByText("15")` for Test 1) which only appears once the query resolves and the report data binds.
- Files: `evaluation-report-card.test.tsx` Tests 1, 3, 4, 5, 6.

**4. [Rule 1 — Bug] Test 6 fake-timers vs TanStack Query micro-task scheduling.**
- Found during: Task 2 GREEN run.
- Issue: `vi.useFakeTimers() + advanceTimersByTimeAsync` doesn't advance the React Query micro-task scheduler that resolves `usePhaseReports`. The component never saw the report data; the PDF button stayed disabled because `report` was null.
- Fix: rewrote Test 6 to use real timers with `retry_after_seconds: 2` so the test elapses in ~3 seconds total. The countdown semantics are still verified end-to-end (button disabled on 429 + auto re-enables after countdown). Test timeout extended to 10s as a safety margin.

### Plan-explicit choices

- **Stub assignee dropdown over real /projects/{id}/members endpoint.** UI-SPEC line 1050 explicitly allows degradation; Phase 13 PROF-01 will land the real endpoint. Three-line swap when ready.
- **10MB max-size constant honored in copy without backend re-verification.** Logged in this summary for future audit.
- **Status 'done' artifacts trigger ConfirmDialog (not just 'draft').** SPEC says "in-progress artifacts surface a soft warning" — anything not 'not-created' is "in-progress" by virtue of having work in it; keeping 'done' under the dialog prevents accidental loss of completed evidence.
- **Lazy create on first PhaseReport save.** Plan action step 3's `onClick` includes both POST (when `!report`) and PATCH (when `report` exists). Test 3 covers the PATCH path; the POST path is exercised at the callsite when the activity feed indicates a closed phase but no PhaseReport row yet.
- **Real timers for Test 6 instead of vi.useFakeTimers** — see Rule-1 Fix 4 above.

### Threat surface scan

No new network endpoints or trust-boundary changes beyond those enumerated in `<threat_model>`:

- T-12-06-01 (E — Artifact PATCH route selection) → mitigate. Frontend chooses `/mine` vs base path based on `useAuth().user.id === artifact.assigneeId`; backend re-validates so mismatches are rejected. The PM path also gates Add + delete behind `useTransitionAuthority`. Defense-in-depth honored.
- T-12-06-02 (D — PDF rate limit) → mitigate. 429 → countdown UI + button disabled; success and warning toasts surface the user-facing state.
- T-12-06-03 (T — revision tampering) → mitigate. Frontend NEVER sends `revision` in PATCH body — verified by acceptance grep matrix and PhaseReportUpdateDTO type shape.

## Self-Check: PASSED

- All 5 created files exist:
  - `Frontend2/components/lifecycle/artifact-inline-expand.tsx` (FOUND)
  - `Frontend2/components/lifecycle/artifacts-subtab.tsx` (FOUND)
  - `Frontend2/components/lifecycle/artifacts-subtab.test.tsx` (FOUND)
  - `Frontend2/components/lifecycle/evaluation-report-card.tsx` (FOUND)
  - `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` (FOUND)
- All 2 modified files updated:
  - `Frontend2/components/lifecycle/lifecycle-tab.tsx` (ArtifactsSubTab wire-up replaces Plan 12-04 placeholder)
  - `Frontend2/components/lifecycle/history-card.tsx` (Rapor button + reportOpen state + EvaluationReportCard expand)
- Four task commits exist:
  - `351a96b` test(12-06): add failing tests for ArtifactsSubTab
  - `c79f9ae` feat(12-06): ship ArtifactsSubTab + ArtifactInlineExpand for LIFE-06
  - `a1a04af` test(12-06): add failing tests for EvaluationReportCard
  - `89467c9` feat(12-06): ship EvaluationReportCard + HistoryCard Rapor wiring for LIFE-07
- 266 / 266 tests pass; 0 regressions vs the 248 Plan 12-05 baseline.
- `cd Frontend2 && npm run test -- artifacts-subtab evaluation-report-card history-card` exits 0 (10 + 8 = 18 cases green).
- No imports from `Frontend/` (old frontend) — verified via grep on the 5 new files + 2 modified files.
- No imports from `shadcn/ui` — verified via grep on all 7 surfaces.
- Acceptance grep matrix all green (14/14 checks).
- Post-commit deletion check: only the placeholder Card content in lifecycle-tab.tsx was removed — intentional (Plan 12-06's purpose).
- TypeScript: no new errors introduced. The IDE hint about ArtifactsSubTab being unused was resolved the moment the placeholder Card was replaced with the live render.
