---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 06
subsystem: admin-panel-workflows-tab
tags: [admin-panel, workflows-tab, frontend2, more-menu, impact-aware-confirm, client-side-clone, d-b1, d-b6]
requires:
  - phase: 14-01
    provides: Shared MoreMenu primitive + Modal primitive + ConfirmDialog tone="danger" + admin lib utilities
  - phase: 14-02
    provides: AdminLayout wrapper (admin-only route guard + 8-tab NavTabs strip) + per-surface i18n keys file convention
  - phase: 14-05
    provides: Per-row MoreH wiring pattern + per-surface keys file precedent (admin-projects-keys.ts) + Modal-as-escape-hatch when ConfirmDialog can't host custom body widgets
  - phase: 13
    provides: useProcessTemplates hook (existing — Frontend2/hooks/use-projects.ts:131-137) reading GET /api/v1/process-templates
  - phase: 9
    provides: Existing process_templates router (POST/GET/PATCH/DELETE) + projects.process_template_id FK column
provides:
  - Frontend2/app/(shell)/admin/workflows/page.tsx — /admin/workflows (Şablonlar) sub-route page
  - Frontend2/components/admin/workflows/admin-template-card.tsx — single template card composition (Card + name + Custom Badge + description + mode Badge + N proje footer)
  - Frontend2/components/admin/workflows/template-row-actions.tsx — per-card MoreH menu (Düzenle / Klonla / Sil with impact-aware confirm)
  - Frontend2/lib/i18n/admin-workflows-keys.ts — 19 TR/EN parity keys for the Workflows tab
  - Frontend2/services/project-service.ts — added projectService.cloneProcessTemplate(id, suffix) (client-side composed) + projectService.deleteProcessTemplate(id) + projectService.getProcessTemplateById(id)
  - Frontend2/hooks/use-projects.ts — added useCloneTemplate() + useDeleteTemplate() mutations
affects:
  - Plan 14-12 UAT — manual checklist will verify "Sil with usage>0 requires Yine de sil checkbox" + "Sil with usage=0 plain ConfirmDialog" + "Klonla appends (Kopya)/(Copy)" + "Düzenle redirects to /workflow-editor?templateId=…"
  - Backend (no changes needed) — existing GET /process-templates + POST /process-templates (composed for clone) + DELETE /process-templates/{id} all reused
tech-stack:
  added: []
  patterns:
    - "Client-side clone via existing endpoints — no backend /clone route per Plan 14-06 critical_constraints. cloneProcessTemplate calls GET /process-templates then POST /process-templates with the same payload + i18n-aware name suffix '(Kopya)' / '(Copy)'. Reusable for any admin entity that needs a clone affordance without adding a new endpoint."
    - "Impact-aware destructive confirm dual-branch pattern — when usage_count === 0 a plain ConfirmDialog tone='danger' suffices; when usage_count > 0 escalate to a Modal with body warning + secondary checkbox 'Yine de sil' gating the danger CTA. Same dual-branch pattern is reusable wherever an admin destructive action has variable impact (e.g., deleting a Label that's applied to N tasks, deleting a Team that owns N projects)."
    - "Active-project counter computed client-side from useProjects() cache — backend ProcessTemplateResponseDTO doesn't expose active_project_count, but admin-bypass at GET /projects already returns ALL projects for admins. Match projects.processTemplateId === template.id, exclude ARCHIVED, count. O(N) per render, but the projects list is already cached so no extra round-trip per card."
    - "Mode badge tone-mapping inherits Plan 14-05's methodology Badge convention — sequential-locked=warning (amber Locked), continuous=info (status-progress Continuous), flexible=neutral (Flexible). UI-SPEC §G.3 lines 1519-1521 takes precedence over PLAN.md's Step 3 sample (which mistakenly used 'success' for continuous) per CONTEXT D-00 design contract."
    - "Mode derivation from JSONB with name-heuristic fallback — read template.behavioral_flags.process_mode (string) when set; otherwise infer from template.name lower-cased substring match (waterfall/iso/phase-gate → sequential-locked, kanban/lean → continuous, else flexible). Mirrors prototype admin.jsx:354-360 hand-mapping. v2.1 candidate: hoist process_mode to a first-class column on process_templates so the badge isn't buried in JSONB."
key-files:
  created:
    - Frontend2/app/(shell)/admin/workflows/page.tsx
    - Frontend2/components/admin/workflows/admin-template-card.tsx
    - Frontend2/components/admin/workflows/template-row-actions.tsx
    - Frontend2/components/admin/workflows/admin-template-card.test.tsx
    - Frontend2/lib/i18n/admin-workflows-keys.ts
  modified:
    - Frontend2/services/project-service.ts (added cloneProcessTemplate + deleteProcessTemplate + getProcessTemplateById)
    - Frontend2/hooks/use-projects.ts (added useCloneTemplate + useDeleteTemplate mutations)
key-decisions:
  - "Klonla = client-side composed, NOT a new backend endpoint — Plan 14-06 critical_constraints explicitly say 'do NOT add backend routes'. cloneProcessTemplate is GET /process-templates + POST /process-templates (existing endpoints) with a localized name suffix '(Kopya)' / '(Copy)'. Net result: zero backend changes; user-friendly clone UX shipped today."
  - "active_project_count computed client-side from useProjects() cache — saves a backend extension and avoids N+1 round-trips. The map<templateId, count> is rebuilt once per render via useMemo so per-card lookup is O(1). ARCHIVED projects are excluded — only non-archived projects count toward the impact-aware delete gate, matching D-B6's intent ('Silmek bu projelerin akışını bozabilir' — archived projects have no live workflow to break)."
  - "Sil dual-branch via ConfirmDialog vs Modal — usage_count === 0 takes the simple ConfirmDialog tone='danger' path; usage_count > 0 escalates to Modal with the 'Yine de sil' secondary checkbox gate. Mirrors Plan 14-05's reasoning: ConfirmDialog has no slot for custom body widgets (Input or Checkbox), so we escape to the Modal primitive (Plan 14-01) when the destructive flow needs more than a yes/no. The two branches share the same handleDeleteFire callback so the mutation site is single-source-of-truth."
  - "Mode badge tone for 'continuous' = 'info' (UI-SPEC §G.3 line 1520) — NOT 'success' as the PLAN.md Step 3 sample suggested. UI-SPEC takes precedence over PLAN.md per CONTEXT D-00 design contract; the prototype admin.jsx line 377 also used `tone='info'` for continuous, confirming UI-SPEC is faithful to the prototype."
  - "Custom badge derives from !is_builtin (inverted) — backend ProcessTemplateResponseDTO exposes is_builtin: bool but not is_custom directly. Admin-created templates are not built-in, so !is_builtin is the correct semantic. Documented inline in admin-template-card.tsx so the next maintainer doesn't add a backend is_custom field thinking it's missing."
  - "Mode derivation strategy: behavioral_flags.process_mode + name fallback — the v2.0 process_templates table doesn't encode mode as a first-class column; it lives in the JSONB behavioral_flags. When absent (e.g., empty JSONB on a freshly seeded template) we fall back to a name-substring heuristic that mirrors the prototype's admin.jsx:354-360 hand-mapping (waterfall/iso/phase-gate → sequential-locked, kanban/lean → continuous, else flexible). v2.1 candidate to hoist mode to a column."
  - "MoreMenu trigger aria-label kept at the primitive default 'İşlemler' (NOT overridden) — matches Plan 14-03 + Plan 14-05 convention so the test's getByLabelText('İşlemler') stays locale-stable across all admin tabs (Turkish dotless-i / dotted-İ casefolding makes /i regex flag unreliable, per Plan 14-05's locale-stability decision)."
  - "Toast variant 'success' / 'error' — NOT 'tone'. Plan 14-01 Pitfall 2 reminded the toast primitive accepts variant: but not tone:. Both Klonla and Sil onSuccess fire showToast({variant:'success', message: '...'}); onError fires showToast({variant:'error', message: '...'}) with the API detail extracted from err?.response?.data?.detail."
patterns-established:
  - "Pattern: Impact-aware destructive confirm dual-branch — usage_count === 0 → plain ConfirmDialog tone='danger'; usage_count > 0 → Modal with secondary checkbox gate. Reusable for any admin destructive action where the impact varies (delete-Team-with-N-projects, delete-Label-with-N-tasks, delete-Cycle-with-N-tasks, etc.)."
  - "Pattern: Client-side composed clone — when no /clone backend exists, GET source + POST new with i18n-aware name suffix delivers the same UX without a backend change. Reusable for any entity with idempotent POST + per-row Klonla affordance."
  - "Pattern: Cache-derived computed counters — when an admin needs an aggregate that the backend doesn't expose (active_project_count, comment_count, child_task_count), iterate over an already-cached collection (useProjects, useTasks) via useMemo. Saves a backend extension; cost is O(N) per render which is negligible for admin-tier list sizes."
  - "Pattern: Per-surface i18n keys file — admin-workflows-keys.ts (19 entries) follows Plan 14-02/03/04/05 precedent. Each Wave 2 surface plan owns its own keys file to avoid same-wave files_modified overlap. Helper signature `adminWorkflowsT(key, lang)` is identical to siblings for predictable consumer ergonomics."
  - "Pattern: behavioral_flags as soft-typed config — read with `typeof X === 'string'` guards before casting. The JSONB column is a Dict<str, Any> on the backend; on the frontend we treat each key as `unknown` and narrow at the call site. Matches Phase 9's process_config handling."
requirements-completed:
  - D-00
  - D-B1
duration: ~8min
completed: 2026-04-27
---

# Phase 14 Plan 14-06: /admin/workflows (Şablonlar) Tab Summary

**Wave 2 surface plan delivers the admin-wide process-template grid with a 3-card-per-row layout, per-card MoreH menu (Düzenle redirect / Klonla via client-side clone / Sil with impact-aware confirm), and an impact-aware destructive flow that escalates from a plain ConfirmDialog to a Modal-with-secondary-checkbox when the template is in use by N active projects (D-B6). Reuses existing process_templates GET/POST/DELETE endpoints; zero new backend work.**

## Performance

- **Duration:** ~8 min (1 atomic commit)
- **Started:** 2026-04-27T10:30Z
- **Completed:** 2026-04-27T10:38Z
- **Tasks:** 1 / 1 complete
- **Files modified:** 7 (5 created + 2 modified)
- **Tests added:** 6 RTL cases (admin-template-card.test.tsx — 4 mandated + 2 supplementary)
- **All tests pass:** ✅ (6/6 + Plan 14-01..14-05 regression set 25/25; full admin suite 39/39)

## Accomplishments

1. **The Şablonlar tab is functional end-to-end.** Admins can browse all process templates (built-in + custom) in a 3-column card grid, see at-a-glance the methodology mode (Locked / Continuous / Flexible) + the active-project count, and trigger Düzenle / Klonla / Sil via the per-card MoreH menu.
2. **Impact-aware destructive flow shipped.** Sil on a template with 0 active projects opens a one-click ConfirmDialog tone="danger". Sil on a template with N > 0 active projects opens a Modal with a warning body ("{name} {N} projede kullanılıyor…") + a secondary checkbox "Yine de sil" that gates the danger CTA. Two-affirmation requirement per CONTEXT D-B6 + threat T-14-06-01.
3. **Zero new backend surface.** Klonla composed client-side via GET source + POST new (existing endpoints, no `/clone` route added per Plan 14-06 critical_constraints). Sil hits existing DELETE /process-templates/{id} (Phase 9). active_project_count computed client-side from the existing useProjects() cache.
4. **Düzenle hooks into Phase 12 D-09 redirect.** Click → router.push("/workflow-editor?templateId={id}"). The workflow editor (Phase 12) handles its own auth + load; the admin tab is just the entry point.
5. **Klonla success / error Toasts shipped.** Success: "{name} şablonu kopyalandı." Error: "Kopyalama başarısız: {detail}" with the API detail extracted from the axios error response.

## Task Commits

1. **Task 1 — /admin/workflows tab + 3-col template grid + per-card MoreH (Düzenle/Klonla/Sil with impact-aware confirm) + 6 RTL cases + admin-workflows-keys + project-service.cloneProcessTemplate / deleteProcessTemplate / getProcessTemplateById + useCloneTemplate / useDeleteTemplate** — `e341828b` (feat)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/workflows renders the Şablonlar tab | `cd Frontend2 && npm run build` (admin/workflows in static prerender list) | ✅ |
| 3-column verbatim grid `repeat(3, 1fr) gap:14` | `grep -c '"repeat(3, 1fr)"' page.tsx` → 1 | ✅ |
| Card padding={16} (verbatim prototype line 365) | `grep -c "padding={16}" admin-template-card.tsx` → 2 (prop + JSDoc) | ✅ |
| Per-card MoreH has 3 items (Düzenle / Klonla / Sil) | RTL Case 3 — `expect(items).toHaveLength(3)` + 3 presence asserts | ✅ |
| Sil with usage > 0 → Modal + secondary checkbox + danger CTA gated on checkbox | RTL Case 4 — modal opens, "5" + "Yine de sil" visible, CTA disabled→enabled→disabled on toggle | ✅ |
| Sil with usage === 0 → plain ConfirmDialog WITHOUT "Yine de sil" | RTL Case 5 — "Şablonu sil" title visible, "Yine de sil" returns null | ✅ |
| Mode badge tone for "sequential-locked" → "warning" + label "Locked" | RTL Case 2 — `screen.getByText("Locked")` | ✅ |
| Custom badge present when !is_builtin | RTL Case 1 — `screen.getByText("Özel")` (TR — useApp().language="tr") | ✅ |
| Custom badge ABSENT when is_builtin | RTL Case 1b — `screen.queryByText("Özel")` returns null | ✅ |
| Düzenle uses router.push("/workflow-editor?templateId={id}") | `grep -c "/workflow-editor?templateId=" template-row-actions.tsx` → 2 (1 push + 1 inline ref) | ✅ |
| MoreMenu CONSUMED from Plan 14-01 (NOT rebuilt) | `grep -c "@/components/admin/shared/more-menu" template-row-actions.tsx` → 1 | ✅ |
| TR + EN parity for all admin-workflows-keys | `grep -c "    tr:" admin-workflows-keys.ts` = 19; `grep -c "    en:"` = 19 (≥ 8 required) | ✅ |
| 6 RTL test cases pass | `cd Frontend2 && npm run test -- --run admin-template-card.test.tsx` → 6/6 | ✅ |
| Plan 14-01..14-05 regression intact | `npm run test -- --run more-menu users-table layout admin-projects-table admin-template-card` → 25/25 | ✅ |
| Full admin test suite green | `npx vitest run --run admin` → 39/39 (9 files) | ✅ |
| Frontend2 build green | `cd Frontend2 && npm run build` exits 0 | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-06-T1 (template card grid + impact-aware Sil with "Yine de sil" checkbox) | ✅ green (`e341828b`) |

## Files Created / Modified

**Created (5 frontend):**
- `Frontend2/app/(shell)/admin/workflows/page.tsx` — /admin/workflows page composition (DataState fallback + 3-col grid). Computes active_project_count map<templateId, count> from useProjects() once per render via useMemo so per-card lookup is O(1).
- `Frontend2/components/admin/workflows/admin-template-card.tsx` — Single card composition (Card padding={16}, name + Custom Badge if !is_builtin, description, mode Badge tone-mapped, "{N} proje" footer). Mode derivation reads behavioral_flags.process_mode with name-heuristic fallback.
- `Frontend2/components/admin/workflows/template-row-actions.tsx` — 3-item MoreMenu via shared MoreMenu primitive (Plan 14-01). Düzenle = router.push redirect; Klonla = useCloneTemplate.mutate + Toast; Sil = impact-aware ConfirmDialog (usage===0) OR Modal+checkbox (usage>0) → useDeleteTemplate.mutate + Toast.
- `Frontend2/components/admin/workflows/admin-template-card.test.tsx` — 6 RTL cases (1: name+Custom badge, 1b: built-in absence, 2: Locked label, 3: 3-item MoreH, 4: in-use Modal+checkbox+CTA gate, 5: not-in-use ConfirmDialog without checkbox).
- `Frontend2/lib/i18n/admin-workflows-keys.ts` — 19 TR/EN parity key pairs covering Custom badge, mode labels (Locked/Continuous/Flexible), MoreH menu items, ConfirmDialog/Modal bodies (in-use + not-in-use), "Yine de sil" checkbox label, success/error Toast messages, empty state, clone name suffix, shared admin.cancel.

**Modified (2 frontend):**
- `Frontend2/services/project-service.ts` — added 3 methods: `getProcessTemplateById(id)` (filter list response), `cloneProcessTemplate(id, nameSuffix)` (GET source + POST new with name suffix), `deleteProcessTemplate(id)` (DELETE existing endpoint).
- `Frontend2/hooks/use-projects.ts` — added `useCloneTemplate()` mutation (calls cloneProcessTemplate, invalidates ['process-templates'] cache onSettled) + `useDeleteTemplate()` mutation (calls deleteProcessTemplate, invalidates same cache).

## Backend Endpoint Reuse

**No backend changes — every action wired to an existing endpoint:**

| MoreH action | Frontend service call | Backend endpoint | Notes |
|--------------|----------------------|------------------|-------|
| Düzenle | n/a (router.push only) | n/a — Phase 12 D-09 owns the workflow-editor route | Pure navigation |
| Klonla | `cloneProcessTemplate(id, suffix)` | GET /api/v1/process-templates/ (filter to id) + POST /api/v1/process-templates/ | Composed client-side per Plan 14-06 critical_constraints |
| Sil | `deleteProcessTemplate(id)` | DELETE /api/v1/process-templates/{id} | Existing endpoint (Phase 9 manage_process_templates) — built-in templates 403 server-side |

**Why not a backend /clone endpoint?**
- Plan 14-06 critical_constraints: "Out of scope: No new backend endpoints needed (process_templates router already exists). If service module doesn't expose clone/delete, add narrow client wrappers; do NOT add backend routes."
- Composed clone (GET + POST) is idempotent in the same way a backend /clone would be — the server-side POST already enforces `is_builtin=False` on creation (manage_process_templates.py:30) so cloned templates can't accidentally be marked built-in.
- v2.1 candidate: if multi-tenant ownership becomes a concern, hoist clone to a backend endpoint that records `cloned_from_id` in audit metadata. v2.0 doesn't need that level of provenance.

## Impact-Aware Sil Implementation

**Two branches, same destination:**

```tsx
// In TemplateRowActions:
const inUse = activeProjectCount > 0
const canDelete = !inUse || yineDeSil

// Sil click branches at the click handler:
{
  id: "delete",
  destructive: true,
  onClick: () => {
    setYineDeSil(false)
    if (inUse) setConfirmOpenInUse(true)  // Modal branch
    else setConfirmOpenSimple(true)       // ConfirmDialog branch
  },
}

// Both branches converge in handleDeleteFire which guards on canDelete:
const handleDeleteFire = () => {
  if (!canDelete) return  // belt-and-braces; CTA is disabled in the Modal branch when inUse && !yineDeSil
  // close modals, fire mutation, toast on result
  deleteM.mutate(template.id, { onSuccess: ..., onError: ... })
}
```

**Defense in depth:**
1. **Frontend Modal CTA gate** — danger Button `disabled={!canDelete}` when in-use branch + checkbox unchecked.
2. **Mutation guard** — handleDeleteFire checks `if (!canDelete) return` before calling deleteM.mutate (covers any external trigger that bypassed the disabled state).
3. **Backend gate** — DELETE /process-templates/{id} requires admin auth via existing Depends; built-in templates raise PermissionError → 403 (manage_process_templates.py:65-66).
4. **Cache invalidation** — useDeleteTemplate.onSettled invalidates ['process-templates'] so the card disappears post-confirm regardless of mutation success/failure.

**Why not extend ConfirmDialog with a `slot` prop?**
- Modifying a primitive used by 4+ Phase 10/11/12 sites for a single new use case violates the OCP principle (CLAUDE.md §4.1). Modal already provides the slot pattern (Header/Body/Footer); reaching for it here is the cheaper, isolated solution.
- Same reasoning Plan 14-05 used for the typing-confirm flow.

## Active Project Counter Derivation

**Client-side from useProjects() cache — zero backend changes.**

```tsx
const projectsQ = useProjects()
const usageMap = React.useMemo(() => {
  const map: Record<number, number> = {}
  const data = projectsQ.data as unknown
  if (Array.isArray(data)) {
    for (const p of data as Array<{ processTemplateId: number | null; status: string }>) {
      if (p.processTemplateId == null) continue
      if (p.status === "ARCHIVED") continue
      map[p.processTemplateId] = (map[p.processTemplateId] ?? 0) + 1
    }
  }
  return map
}, [projectsQ.data])
```

**Why this works:**
- Backend admin-bypass at GET /projects returns ALL projects (4 statuses) for admins (projects.py:146-149).
- The projects list is already TanStack-cached via useProjects() — pages like /admin/projects + /projects + /dashboard all share the same cache key, so this map is essentially free.
- ARCHIVED projects are excluded — they don't have a live workflow that Sil could break (D-B6 "Silmek bu projelerin akışını bozabilir" implies live impact).
- O(N) per render, but N is admin-tier (typically <50 projects); negligible cost.

**v2.1 candidate:** if N > 1000 projects becomes realistic, hoist active_project_count to ProcessTemplateResponseDTO via a backend join. v2.0 doesn't need it.

## Decisions Made

See `key-decisions` in frontmatter — 7 entries covering the no-backend-clone disposition, client-side counter computation, ConfirmDialog/Modal dual-branch choice, "info" tone for continuous (vs PLAN.md's "success"), is_custom = !is_builtin derivation, mode-from-JSONB-with-name-fallback strategy, MoreMenu aria-label default, and the Toast variant vs tone reminder.

## Deviations from Plan

### Path / Scope Adjustments

- **Mode badge tone for 'continuous' → 'info'** (NOT 'success' as PLAN.md Step 3 sample suggested). UI-SPEC §G.3 line 1520 explicitly says `tone="info"` for continuous; the prototype admin.jsx line 377 also uses `tone="info"`. Per CONTEXT D-00 design contract precedence, UI-SPEC + prototype outweigh the PLAN.md sample. Documented in admin-template-card.tsx + key-decisions.
- **active_project_count computed client-side** instead of via the backend `ProcessTemplateResponseDTO` extension that PLAN.md Step 1 mentioned. Plan 14-06 critical_constraints forbid backend changes; the cache-derived approach delivers the same impact-aware behavior with zero backend work and zero N+1 risk because the projects list is already cached.
- **Mode derived from `behavioral_flags.process_mode` + name fallback** — PLAN.md Step 3 implied a `template.mode` field directly on the response. The actual ProcessTemplateResponseDTO doesn't expose `mode`; behavioral_flags.process_mode is where v2.0 templates encode it, and freshly seeded built-in templates have empty behavioral_flags. The name-heuristic fallback (waterfall/iso/phase-gate → sequential-locked, kanban/lean → continuous, else flexible) mirrors the prototype admin.jsx:354-360 mock data. Documented for v2.1 as a hoist-to-column candidate.
- **Klonla = client-side composed clone** — PLAN.md Step 2 mentioned "useCloneTemplate hook exists OR add it". No /clone endpoint exists, so the hook calls a service method that GETs the source + POSTs a new template with the i18n-aware name suffix. Plan 14-06 critical_constraints explicitly forbid adding a backend route, so this is the only path forward.

### Auto-fixed Issues

None — implementation was clean on the first build + test pass; no Rule 1/2/3 fixes triggered.

### CLAUDE.md Driven Adjustments

- All new pages are `"use client"` (per Frontend2/AGENTS.md "this is NOT the Next.js you know" — interactive client components must declare).
- All new files use named exports + `@/` path alias (Frontend2 convention).
- All inline styles use CSS tokens (per CLAUDE.md / memory: no shadcn/ui; prototype-token-driven styles).
- Backend untouched — DIP-clean (no `import sqlalchemy` or `from app.infrastructure` in any Plan 14-06 file because no backend files were modified).
- Per CLAUDE.md §4.1 OCP: chose Modal escape-hatch over extending ConfirmDialog with a custom-slot prop, isolating the change instead of mutating a primitive consumed by 4+ Phase 10/11/12 sites.

### Out-of-Scope Discoveries

- **process_templates table doesn't encode `mode` as a first-class column.** Mode lives in `behavioral_flags` JSONB, which is awkward for badge derivation. v2.1 candidate: add a `process_mode VARCHAR(20)` column on `process_templates` with values `sequential-locked | continuous | flexible` + backfill from behavioral_flags.process_mode at migration time. Logged here for v2.1 backlog; NOT fixed in Plan 14-06 because the name-heuristic fallback delivers correct behavior for the seed templates.

## Known Stubs

| Location | Stub | Reason | Resolution |
|----------|------|--------|------------|
| `admin-template-card.tsx` mode derivation | name-substring heuristic fallback when `behavioral_flags.process_mode` is absent | The seed process_templates table doesn't always populate behavioral_flags.process_mode for built-in templates. Out of scope for Plan 14-06's ~8-min budget. | v2.1 candidate: hoist `process_mode` to a first-class column on `process_templates` + backfill migration. Then derive `template.process_mode` directly without the JSONB lookup. |
| `admin-template-card.tsx` activeProjectCount | client-side O(N) computation from useProjects() cache | Backend ProcessTemplateResponseDTO doesn't expose this aggregate; CONTEXT D-B1 + Plan 14-06 critical_constraints forbid backend changes. | v2.1 candidate (only if project count > 1000): add `active_project_count: int` to ProcessTemplateResponseDTO via a backend `LEFT JOIN projects ON process_template_id` aggregate query. Negligible cost in v2.0 (N < 50). |

Both stubs are honest — the badge tone + counter are correct for the actual data; we just compute them client-side instead of reading them off the DTO. Neither blocks the plan's goal: admins can browse, clone, edit, and impact-aware-delete templates today.

## i18n Keys Inventory

**File:** `Frontend2/lib/i18n/admin-workflows-keys.ts`
**Total keys:** 19 (TR + EN parity = 38 string values; acceptance ≥ 8 — exceeds by 11)

| Category | Count | Keys |
|----------|-------|------|
| Card chrome | 2 | custom_badge / proje_suffix |
| Mode badges | 3 | mode_locked / mode_continuous / mode_flexible |
| MoreH menu | 3 | edit / clone / delete |
| Sil — not-in-use ConfirmDialog | 2 | delete_modal_title / delete_modal_body |
| Sil — in-use Modal (D-B6) | 2 | delete_modal_body_in_use / delete_in_use_checkbox_label |
| Toasts (Klonla / Sil success + error) | 4 | clone_success_toast / delete_success_toast / clone_error_toast / delete_error_toast |
| Empty state | 1 | empty |
| Clone name suffix | 1 | clone_name_suffix |
| Shared / generic | 1 | admin.cancel |

## Threat Mitigation Summary

**T-14-06-01 — Tampering: Template deletion of in-use template** — MITIGATED.
- Frontend: Modal escalation when usage > 0 + secondary "Yine de sil" checkbox + disabled danger CTA until checked.
- Mutation guard: `handleDeleteFire` re-checks `canDelete` before firing.
- Backend: existing 403 for built-in templates (manage_process_templates.DeleteProcessTemplateUseCase:65-66).
- Cache invalidation: useDeleteTemplate.onSettled refetches ['process-templates'] so the UI reflects post-mutation reality.

**T-14-06-02 — Elevation of Privilege: Workflow editor redirect** — ACCEPTED per threat model.
- Düzenle calls `router.push("/workflow-editor?templateId={id}")` — pure navigation; no privilege escalation. The /workflow-editor route (Phase 12) has its own auth + per-template authorization.

**T-14-06-03 — Information Disclosure: active_project_count exposed to admin** — ACCEPTED per threat model.
- /admin/workflows is admin-only (route guard via /admin layout — Plan 14-02 + middleware matcher). Usage counts are admin-tier capability; no risk of leaking project counts to non-admins.

## Hand-off Notes

**Plan 14-12 UAT checklist additions:**
- /admin/workflows renders all process templates in a 3-column grid; built-in templates do NOT show the "Özel" Badge; user-created templates DO.
- Each card's footer shows the active-project count "{N} proje" / "{N} projects" (excluding ARCHIVED projects).
- Click MoreH → 3 items: Düzenle / Klonla / Sil.
- Click Düzenle → redirects to `/workflow-editor?templateId={id}`.
- Click Klonla → success Toast "{name} şablonu kopyalandı." + grid refetch shows new "{name} (Kopya)" / "{name} (Copy)" template at the top of the user-created section.
- Click Sil on a template with 0 active projects → ConfirmDialog "Şablonu sil" + danger Sil button (no checkbox required).
- Click Sil on a template with N > 0 active projects → Modal "Şablonu sil" + body "{name} şablonu {N} projede kullanılıyor. Silmek bu projelerin akışını bozabilir." + secondary checkbox "Yine de sil" + danger Sil button DISABLED until checkbox checked.
- Click Sil on a built-in template → Backend returns 403 → error Toast "Silme başarısız: Built-in templates cannot be deleted".

**Plan 14-07 (Audit) inheritance:**
- Same MoreMenu primitive consumption pattern (no rebuild). Same per-surface i18n keys file pattern.
- The audit row click on `process_template.deleted` events should deep-link to /admin/workflows but the source template will be gone — handle gracefully via Phase 13 audit-event-mapper backward compat (D-D6).

**v2.1 backlog:**
- Hoist `process_mode` to a first-class column on `process_templates` + backfill migration (eliminates the JSONB+name-fallback derivation).
- Add `active_project_count` aggregate to ProcessTemplateResponseDTO via a backend LEFT JOIN (only if project count > 1000).
- Add a backend `POST /process-templates/{id}/clone` endpoint that records `cloned_from_id` in audit metadata for provenance tracking.

## Threat Flags

None — Plan 14-06 introduces no new network surface beyond what GET /process-templates + POST /process-templates + DELETE /process-templates/{id} already expose. The new `useCloneTemplate` + `useDeleteTemplate` hooks + service methods are pure frontend wrappers around already-protected backend routes.

## Self-Check: PASSED

- [x] Task 1 commit exists in git log (`e341828b`)
- [x] Frontend2/app/(shell)/admin/workflows/page.tsx exists AND is `"use client"` AND imports useProcessTemplates + useProjects
- [x] page.tsx grid uses `gridTemplateColumns: "repeat(3, 1fr)"` with gap 14 (1 grep hit)
- [x] Frontend2/components/admin/workflows/admin-template-card.tsx Card uses `padding={16}` (1 prop + 1 JSDoc = 2 grep hits)
- [x] admin-template-card.tsx renders Custom Badge conditionally on `!template.is_builtin` (2 grep hits — derivation + render branch)
- [x] admin-template-card.tsx mode Badge tone mapping: "sequential-locked"→"warning", "continuous"→"info", default→"neutral" (UI-SPEC §G.3 line 1520; PLAN.md's "success" was incorrect per design contract)
- [x] Frontend2/components/admin/workflows/template-row-actions.tsx imports MoreMenu from `@/components/admin/shared/more-menu` (1 grep hit) — does NOT rebuild
- [x] template-row-actions.tsx defines EXACTLY 3 MoreMenuItem entries (id "edit", "clone", "delete" — 3 grep hits)
- [x] template-row-actions.tsx Düzenle uses `router.push(`/workflow-editor?templateId=${template.id}`)` (2 grep hits — push call + JSDoc reference)
- [x] template-row-actions.tsx delete flow uses ConfirmDialog (usage===0) AND Modal (usage>0) with tone="danger"
- [x] template-row-actions.tsx renders secondary "Yine de sil" checkbox when activeProjectCount > 0 — wired via `delete_in_use_checkbox_label` i18n key + `<input type="checkbox" checked={yineDeSil}/>`
- [x] admin-template-card.test.tsx asserts 3 MoreH items (Case 3) AND in-use case has secondary checkbox gating delete CTA (Case 4) AND not-in-use case has plain ConfirmDialog without the checkbox (Case 5)
- [x] Frontend2/lib/i18n/admin-workflows-keys.ts has both `tr:` and `en:` for every key — 19 keys (`grep -c "    tr:"` = 19; `grep -c "    en:"` = 19); ≥ 8 acceptance gate exceeded
- [x] No new backend surface created (Plan 14-06 is fully frontend; backend untouched — clone composed via existing GET + POST, delete via existing DELETE)
- [x] `cd Frontend2 && npm run build` exits 0 with /admin/workflows in static prerender list
- [x] `cd Frontend2 && npm run test -- --run admin-template-card.test.tsx` exits 0 (6/6)
- [x] Plan 14-01..14-05 regression tests still pass (`npm run test -- --run more-menu users-table layout admin-projects-table admin-template-card` → 25/25)
- [x] Full admin test suite green (`npx vitest run --run admin` → 39/39 across 9 files)
- [x] No new TS errors introduced (build passes TypeScript strict mode in 8.9s)
- [x] VALIDATION.md row 14-06-T1 marked ✅
- [x] STATE.md / ROADMAP.md plan-progress will advance from 5/12 to 6/12 in the metadata commit

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-27*
