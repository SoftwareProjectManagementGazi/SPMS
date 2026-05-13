# Group F2: Remaining 16 Frontend Failures

## Common patterns

The vast majority (15/16) of failures are caused by **three intentional refactors by Ayşe** that broke the test contract but represent valid, deliberate product changes:

1. **Artifact status enum migration** (commit `7e161614` — "Refactor artifact statuses and implement seeding"). Status keys renamed from `not-created`/`draft`/`done` to `not_created`/`in_progress`/`completed`/`approved`; SegmentedControl labels became `Yok` / `Devam` / `Tamam` / `Onay` (no more "Taslak"); empty-state copy was rewritten; CTA buttons renamed.
2. **Task completion via `isDone` flag** (commits `d357b033`, `cba405ff`, `5d25bb8f`). Production code switched from `normalizeStatus(t.status) === "done"` to reading the backend-supplied `t.isDone` boolean. Test fixtures still set `status: "done"` but never set `is_done: true`, so the task-service mapper produces `isDone: false` for every fixture task and downstream "done"-derived counts collapse to 0.
3. **Timeline filter relaxation** (commit `1aabb447` — "add start_date field to tasks for timeline support"). Filter changed from `t.start && t.due` to `t.due` only; unscheduled tasks now appear with `effectiveStart = t.start ?? t.createdAt`. Empty-state copy was simplified.

There is 1 genuine UX regression candidate (members tab no longer shows the project manager from the project payload when the API list is empty) and 1 milestone test broken by the new optional `start_date` input column.

---

## Per-file breakdown

### artifacts-subtab.test.tsx (5 tests)
Friend's commits: `7e161614` (Ayşe — status refactor + seeding), `aa2d5dba` / `390564a9` (original Plan 12-06 by user).

- **Test 3 (line 228) — `Tamam + Kaydet → PATCH status: 'done'`**
  Actual error: `expected { name: 'Daily Notes', ... } to match object { status: 'done' }`.
  Production change: `Tamam` button now maps to the `completed` status key (not `done`). The status enum was renamed wholesale; the backend DTO uses `completed`.
  Verdict: **outdated test**.
  Fix: update assertion `expect(body).toMatchObject({ status: "done" })` → `{ status: "completed" }`. Also note: `apiPatch.mockResolvedValueOnce(... status: "completed" ...)` is already set correctly at line 233, so only the assertion needs updating.

- **Test 4 (line 275) — assignee path `/mine` via Taslak button**
  Actual error: `Unable to find an accessible element with the role "button" and name "Taslak"`.
  Production change: "Taslak" SegmentedControl option was removed in commit `7e161614`. The new options are `Yok` / `Devam` / `Tamam` / `Onay`.
  Verdict: **outdated test**.
  Fix: change `getByRole("button", { name: "Taslak" })` → `getByRole("button", { name: "Devam" })`, and either accept any non-`Yok` status or assert URL only (URL endpoint doesn't depend on status value).

- **Test 8 (line 438) — soft-warning ConfirmDialog for 'draft' artifact**
  Actual error: `Unable to find an element with the text: /Bu artefakt taslak durumunda/i`.
  Production change: The ConfirmDialog body (artifacts-subtab.tsx lines 614-622) no longer mentions "taslak"; it just says `"X silinsin mi? Bu işlem geri alınamaz."`. The "draft" status no longer exists — Sprint Backlog fixture is now `in_progress`. The component still routes via `confirmDelete` for any non-`not_created` status, so the dialog DOES open; only the body copy changed.
  Verdict: **outdated test**.
  Fix: replace `screen.getByText(/Bu artefakt taslak durumunda/i)` with `screen.getByText(/silinsin mi/i)` or assert the dialog title `"Artefaktı Sil"`. Also update fixture `status: "draft"` → `"in_progress"` to align with the new enum.

- **Test 9 (line 471) — add-button label `Yeni Artefakt|Özel Ekle`**
  Actual error: `Unable to find an accessible element with the role "button" and name `/Yeni Artefakt|Özel Ekle/``.
  Production change: When there are existing artifacts, the toolbar add button reads `"Artefakt Ekle"` (artifacts-subtab.tsx line 397). The empty-state CTA reads `"Özel Artefakt Ekle"` (line 255). Neither matches the test regex when 5 artifacts are present.
  Verdict: **outdated test**.
  Fix: regex `/Yeni Artefakt|Özel Ekle/` → `/Artefakt Ekle/` (covers both rendered variants).

- **Test 10 (line 501) — empty state copy**
  Actual error: `Unable to find an element with the text: /Bu metodoloji için tanımlı artefakt bulunamadı/`.
  Production change: Empty state was rewritten in commit `7e161614`. New copy (line 216) is `"Henüz artefakt yok"` plus a methodology-aware sub-line.
  Verdict: **outdated test**.
  Fix: assert `/Henüz artefakt yok/` instead.

### history-subtab.test.tsx (2 tests)
Friend's commit: `5d25bb8f` (Ayşe — "improve task count display in HistoryCard"). Direct one-line diff: `taskCount = summary.done > 0 ? summary.done : ...` became `taskCount = summary.total > 0 ? summary.total : ...`.

- **Test 3 (line 197) — Collapsible label `Görev Detayları (4)` (= summary.done)**
  Actual error: `Unable to find an element with the text: /Görev Detayları.*\(4\)/`.
  Production change: `history-card.tsx` line 95 now reads `summary.total` (= 5 in the fixture) before falling back to live count. The rendered label is `(5)`, not `(4)`.
  Verdict: **borderline — outdated test, but worth confirming intent**. The original behaviour (show "done count" as a success indicator) and the new behaviour (show "total tasks for this phase" — broader context) are both defensible. Ayşe's commit message names it "improve". Treat as intentional product decision.
  Fix: assert `/Görev Detayları.*\(5\)/` (use summary.total).

- **Test 7 (line 291) — 2 closed phases × 3 done tasks → `(3)` labels**
  Actual error: `Unable to find an element with the text: /Görev Detayları.*\(3\)/`.
  Production change: Test passes only `phaseDoneCounts={{ planning: 3, execution: 3 }}`, leaving `phaseTotalCounts` undefined → `summary.total = 0` → `taskCount` falls through to `open ? closedTasks.length : 0` = 0. Labels render as `(0)`.
  Verdict: **outdated test** (consistent with the Test 3 refactor).
  Fix: also pass `phaseTotalCounts={{ planning: 3, execution: 3 }}` and keep the `(3)` assertion. This matches the new contract (count = total tasks in phase, not done).

### milestones-subtab.test.tsx (2 tests)
Friend's commit: `a6e3b858` (Ayşe — "add start_date field to milestones"). Inline-add row grid changed from `1fr 140px` (name + target_date) to `1fr 140px 140px` (name + start_date + target_date). The first `input[type="date"]` is now `start_date`, not `target_date`.

- **Test 4 (line 221) — POST with empty linked_phase_ids**
  Actual error: `expected "spy" to be called 1 times, but got 0 times`.
  Production change: Test queries `document.querySelector('input[type="date"]')` which now returns the **startDate** input. The `targetDate` input stays empty, `canSave` returns false (line 104 in milestone-inline-add-row.tsx requires `targetDate.length > 0`), so the Save button is disabled and POST never fires.
  Verdict: **outdated test**.
  Fix: select the target date input explicitly. Either `document.querySelectorAll('input[type="date"]')[1]` for targetDate, or better use `screen.getByTitle(/Bitiş tarihi/)` (the input has `title="Bitiş tarihi"`).

- **Test 5 (line 286) — optimistic + rollback on 422**
  Same root cause as Test 4 — Save is disabled, POST never fires, spy at 0.
  Verdict: **outdated test**.
  Fix: same as Test 4 — target the correct date input.

### overview-subtab.test.tsx (1 test)
Friend's commit: `d357b033` (Ayşe — "implement bulk phase updates ... task response mapping with completion status"). The done filter changed from `normalizeStatus(t.status) === "done"` to `t.isDone`.

- **Test 4 (line 69) — default 4-metric variant; expects `%33` progress**
  Actual error: `Unable to find an element with the text: 1.` (the `done` count assertion at line 90).
  Production change: `overview-subtab.tsx` lines 90/132 use `t.isDone` for the done count. The test fixture `makeTask({ status: "done", ... })` does NOT set `isDone: true`, and there is no task-service mapping in play (the test passes plain `Task[]`). So `done = 0`, total = 3, progress = 0 → renders `Toplam=3 / Tamamlanan=0 / Devam Eden=3 / İlerleme=%0` — there is no `1` value rendered anywhere.
  Verdict: **outdated test** — the production contract correctly distinguishes status from completion (some "completed" workflows have multiple done-equivalent statuses). The test fixture must opt in.
  Fix: in `makeTask`, add `isDone: false` to defaults, and override `isDone: true` on the done fixture. Concretely: `makeTask({ id: 1, status: "done", isDone: true, phaseId: "n2" })`.

  Note on Task type: `services/task-service.ts:10` already declares `isDone?: boolean`, so this is a clean fix.

### phase-gate-expand.test.tsx (2 tests)
Friend's chain: `d357b033` + `5d25bb8f` introduced `isDone` everywhere. `phase-gate-expand.tsx` lines 92-94 define `isOpen(t)` as `t.isDone !== true`, which is the **only** signal for "task is open" anywhere in this file.

- **Test 2 (line 207) — 422 CriteriaUnmet shows per-criterion failure list**
  Actual error: `Found multiple elements with the text: /Bazı kriterler karşılanmadı/`.
  Production change: `renderPanel()` default fixture is `totalTasks: 10, doneTasks: 10` with `status: "done"` (but no `is_done`). The task-service mapper at line 146 of `task-service.ts` reads `is_done: d.is_done ?? false`, so every fixture task is `isDone: false`. The auto-row `all_tasks_done` evaluates to `false` (10 open tasks), `unmetCount > 0`, and the flexible mode warning banner renders **"Bazı kriterler karşılanmadı. Yine de geçiş yapabilirsiniz."** (line 678) BEFORE the user even clicks submit. Then the 422 error adds a second banner with the same prefix (line 713) → two matches.
  Verdict: **outdated test** (same root cause as Overview Test 4 — fixtures don't set `is_done: true`).
  Fix: in `setupTasks` (line 127), add `is_done: i < done` to each task object. With `done=10` all tasks become done, the pre-submit unmet banner doesn't render, and only the post-submit 422 banner remains. Then `getByText` resolves uniquely.

- **Test 11 (line 386) — Collapsible label `Farklı davranış gerekli? (3 görev)`**
  Actual error: `Unable to find an element with the text: /Farklı davranış gerekli\?.*3 görev/`.
  Production change: Same `is_done` issue. `setupTasks(5, 2)` creates 5 tasks where index 0-1 have `status: "done"` and 2-4 have `status: "todo"`; the mapper still produces `isDone: false` for all 5. `openTasks.length` = 5, not 3. Label renders `(5 görev)`.
  Verdict: **outdated test**.
  Fix: same `is_done: i < done` patch in `setupTasks`. Then `openTasks.length` = 5 − 2 = 3 and the regex matches.

### project-detail-shell.test.tsx (1 test)
Friend's commit: `19e907f7` (Ayşe — "implement full member list display ... (üyeler)"). MembersTab was rewritten to query `useProjectMembers(project.id)` instead of synthesising a single row from `project.managerName`.

- **`shows the project manager card on the Üyeler tab` (line 106)**
  Actual error: `Unable to find an element with the text: Ayşe`.
  Production change: `members-tab.tsx` now sources every name (including the manager) from the `/projects/{id}/members` API. The shell test mocks `apiClient.get` to return `{data: []}` for all endpoints, so members = [], and the tab renders "Bu projede henüz üye yok." — no Ayşe, no "Yönetici" badge.
  Verdict: **borderline — leaning toward UX regression worth flagging, but most likely acceptable**. Before the refactor, the project manager's name was always visible because it came from the project payload synchronously. After, when the API list is empty or still loading, the manager disappears. In real usage the API will populate, but during loading state the tab shows "Yükleniyor..." and there is no manager fallback. Ayşe has a debug note (`.planning/debug/members-only-shows-manager.md`) suggesting the previous "only-shows-manager" behaviour was deliberately rejected.
  Production-bug check: Visible-to-user regression is possible in two cases: (1) `/projects/{id}/members` API failure → tab shows "Üyeler yüklenemedi." even though the user can see the manager elsewhere; (2) brief loading flicker where the manager disappears then re-appears. These are minor UX concerns, NOT correctness bugs.
  Verdict: **outdated test** (the production change is intentional and the test must mock the members endpoint).
  Fix: extend the `apiClient.get` mock to return a manager record when the URL matches `/projects/.../members`. Example:
  ```ts
  apiClient.get = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/members")) {
      return Promise.resolve({ data: [{ id: 1, fullName: "Ayşe", roleName: "manager" }] })
    }
    return Promise.resolve({ data: [] })
  })
  ```

### timeline-tab.test.tsx (3 tests)
Friend's commit: `1aabb447` (Ayşe — "add start_date field to tasks for timeline support"). Filter changed from `t.start && t.due` to `t.due`; added `effectiveStart = t.start ?? t.createdAt`; empty-state copy simplified.

- **`renders SVG with one <rect> bar per scheduled task` (line 115)**
  Actual error: `expected 'MOBIL-3 · Unscheduled' to be falsy`.
  Production change: MOBIL-3 has `start: null, due: "2026-04-30", created_at: "2026-01-01T00:00:00Z"`. New code keeps it (only requires `due`) and uses `created_at` as `effectiveStart`. So the bar renders.
  Verdict: **borderline — looks like a deliberate product decision, but worth a sanity check**. With this change, EVERY task with a due date appears on the Gantt anchored to its creation date, even if the user never set a start date. This means a 6-month-old task with `due: tomorrow` will paint a 6-month-wide bar — visually misleading but technically "all tasks visible". Friend's commit message frames it positively ("existing tasks appear even before start_date is set"), so accept as intentional.
  Verdict: **outdated test**.
  Fix: remove the `mobil3Bar` check, or update fixture MOBIL-3 to also have `created_at: null` (which would cause `effectiveStart` to be invalid; better to just delete that assertion).

- **`renders empty-state message when there are no scheduled tasks` (line 150)**
  Actual error: `Unable to find an element with the text: /başlangıç ve bitiş tarihi/`.
  Production change: Empty-state copy (line 150) changed from "tasks need both start and due dates" to "bitiş tarihi olan görevler listelenir" — only "bitiş tarihi" remains.
  Verdict: **outdated test**.
  Fix: regex `/başlangıç ve bitiş tarihi/` → `/bitiş tarihi olan görevler listelenir/` (or just `/bitiş tarihi/`).

- **Test M1 — milestone flag x-position (line 213)**
  Actual error: `expected 2496 to be close to 120, received difference is 2376`.
  Production change: With MOBIL-3 now included, `min` shifts from 2026-04-10 (MOBIL-1 start) to 2026-01-01 (MOBIL-3 `effectiveStart` = createdAt). 2026-04-15 is ~104 days from 2026-01-01 → x ≈ 104 * 24 = 2496. Expected was 5 * 24 = 120.
  Verdict: **borderline — date-math IS a concern area, but here the math is correct given the new filter contract**. The test's expected value (120) was computed against the old filter that excluded MOBIL-3. The new filter is intentional, so the test must compute against the new `min`.
  Verdict: **outdated test, NOT a production bug**.
  Fix options:
  (a) Update the test to compute `min` from `Math.min(start_of_MOBIL-1, start_of_MOBIL-2, createdAt_of_MOBIL-3) = 2026-01-01`, then x ≈ 104 * 24 = 2496. Use `toBeCloseTo(2496, 0)`.
  (b) Better: give MOBIL-3 a `created_at` of `2026-04-08T00:00:00Z` (still before MOBIL-1's start) so the math is bounded and the test stays readable. Then `min = 2026-04-08`, milestone at 2026-04-15 → 7 days → x = 168. Update expected.
  (c) Cleanest: change the fixture so MOBIL-3 has `start: "2026-04-10"` too — eliminates the effectiveStart edge case entirely and keeps the test focused on the milestone math.

---

## Summary

- **Production bugs: 0** (with caveat below).
- **Outdated tests: 16**. Every failure traces to a deliberate behavioural change by Ayşe — status enum migration, `isDone` task-completion signal, `start_date` on tasks/milestones, real members API. None of the rendered UIs are broken or visibly wrong; the assertions are written against pre-refactor text/DOM contracts.
- **Soft regressions worth tracking** (not bugs, but UX trade-offs):
  - Members tab no longer falls back to `project.managerName` when the API is empty/loading. If `/projects/{id}/members` fails entirely, the manager becomes invisible even though their identity is known. Consider adding a fallback row.
  - Timeline now includes tasks with only a `due` date, anchored to `createdAt`. Long-lived tasks may render misleadingly wide bars. Worth a follow-up: clamp `effectiveStart` to a reasonable lower bound (e.g. `min(due − 7 days, createdAt)`).

### Recommended fix order

1. **`overview-subtab.test.tsx` Test 4** + **`phase-gate-expand.test.tsx` Tests 2 & 11** — single root cause (`is_done` flag in fixtures). Add `is_done` to the shared task fixture factories. Fixes 3 tests.
2. **`history-subtab.test.tsx` Tests 3 & 7** — change `(4)` → `(5)` in Test 3, add `phaseTotalCounts` in Test 7. Fixes 2 tests.
3. **`milestones-subtab.test.tsx` Tests 4 & 5** — target the second `input[type="date"]` (or use `getByTitle`). Fixes 2 tests.
4. **`artifacts-subtab.test.tsx` Tests 3, 4, 8, 9, 10** — update status keys (`done` → `completed`), labels (`Taslak` → `Devam`), button regex (`Artefakt Ekle`), empty-state copy (`Henüz artefakt yok`), and dialog body regex. Fixes 5 tests.
5. **`timeline-tab.test.tsx` Tests 2, 3, M1** — adjust empty-state regex, drop `mobil3Bar = falsy` assertion (or fix fixture `created_at`), and recompute Test M1's expected x against the new `min`. Fixes 3 tests.
6. **`project-detail-shell.test.tsx` Üyeler test** — extend `apiClient.get` mock to return `[{fullName: "Ayşe", roleName: "manager"}]` for the `/members` endpoint. Fixes 1 test.

Total fixable tests: 16/16. No production code changes required; one tracked-as-improvement follow-up (members API empty fallback) optional.
