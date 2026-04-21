---
phase: "10"
plan: "07"
subsystem: frontend
tags: [wizard, project-creation, sessionStorage, url-params, tanstack-query]
dependency_graph:
  requires: ["10-03", "10-05"]
  provides: ["PROJ-01"]
  affects: ["Frontend2/app/(shell)/projects/new/page.tsx"]
tech_stack:
  added: []
  patterns:
    - "Suspense boundary wrapping useSearchParams() (Next.js Pitfall 3)"
    - "sessionStorage draft pattern with restore-on-mount and clear-on-success"
    - "URL search-param step tracking via router.push"
    - "useCreateProject mutation with onSuccess/onError toast callbacks"
    - "Dynamic template loading via useProcessTemplates"
key_files:
  created:
    - Frontend2/app/(shell)/projects/new/page.tsx
  modified: []
decisions:
  - "project key capped at 8 chars uppercase alphanumeric (T-10-07-01 client enforcement)"
  - "Step 3 renders read-only lifecycle node chips (no WorkflowCanvas — Phase 12 scope)"
  - "methodology mapped from template name (scrum/kanban/waterfall) to enum value for backend DTO"
  - "WizardContent receives language prop from StepIndicator to avoid double useApp() calls"
metrics:
  duration: "112 seconds"
  completed_date: "2026-04-21"
  tasks_completed: 1
  files_changed: 1
---

# Phase 10 Plan 07: Create Project Wizard Summary

**One-liner:** 4-step project creation wizard at /projects/new with URL step tracking, sessionStorage draft, dynamic process templates, and live POST /projects submission.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create Project wizard — all 4 steps (PROJ-01) | 3f841a3 | Frontend2/app/(shell)/projects/new/page.tsx |

## What Was Built

A fully functional 4-step wizard page at `Frontend2/app/(shell)/projects/new/page.tsx`:

- **Step indicator:** Horizontal stepper with circle + connector line, completed steps show checkmark SVG, current step has primary ring shadow, future steps muted — matches prototype exactly.
- **Step 1 (Temel Bilgiler):** Project name (required), project key with uppercase/alphanumeric enforcement max 8 chars (required), description textarea, start + end date inputs in a 2-column grid.
- **Step 2 (Metodoloji):** Dynamic template cards loaded from `useProcessTemplates` → `GET /process-templates`. 3-column responsive grid. Selected card gets `0 0 0 2px var(--primary)` ring. Shows template `default_workflow.mode` badge.
- **Step 3 (Yaşam Döngüsü):** Read-only preview renders `default_workflow.nodes` as horizontal chips with arrow separators. Empty state if no template selected or template has no nodes.
- **Step 4 (Yapılandırma):** Editable board columns list with drag handle, per-column WIP input, remove button, and "Kolon Ekle" add button. These map directly to the `columns[]` field in `CreateProjectDTO`.
- **Footer navigation:** Ghost "Geri" button (step > 1), spacer, "Devam" / "Projeyi Oluştur" primary button. "Devam" is disabled until `canProceed` (step1Valid or step2Valid).

## Architecture Decisions

- **Suspense boundary:** `useSearchParams()` is called only inside `WizardContent`, which is wrapped by `<Suspense>` in the default-export `CreateProjectPage`. This is mandatory for Next.js App Router (RESEARCH.md Pitfall 3).
- **No WorkflowCanvas:** Step 3 uses a read-only chip/arrow preview instead of the prototype's interactive canvas editor — that is Phase 12 (Lifecycle/Workflow settings). Plan requirement says "read-only preview."
- **methodology mapping:** Backend `POST /projects` still requires `methodology` enum (not dropped until migration 006). The wizard maps template name lowercase → `SCRUM` / `KANBAN` / `WATERFALL`, defaulting to `SCRUM` for unknown templates.
- **sessionStorage draft:** Saved as JSON object `WizardDraft` on every state change via `useEffect`. Restored on component mount with safe `try/catch`. Cleared on successful project creation.

## Deviations from Plan

None — plan executed exactly as specified. The provided code in the plan was complete and correct; no bugs or missing functionality were found during implementation.

The `any` type annotations on template objects are intentional — the backend response type for process templates is not yet typed in the frontend service layer (service returns raw `any[]` from `apiClient.get`). This is acceptable for v2.0 scope.

## Known Stubs

None — the wizard is fully functional. All 4 steps render live data or user-controlled form state. The `WIP` input in Step 4 columns is intentionally UI-only (no backend field in `CreateProjectDTO` for per-column WIP limits) — this matches the Phase 9 DTO constraint documented in the plan.

## Threat Surface Scan

No new threat surface beyond what is documented in the plan's `<threat_model>`:
- T-10-07-01 (Tampering): Project key client enforcement implemented — `toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)`
- T-10-07-02 (sessionStorage): Draft contains only form values; cleared on submit
- T-10-07-03 (EoP): `manager_id` not in `CreateProjectDTO` — backend assigns from auth token
- T-10-07-04 (Spoofing): `templateId` is validated by the wizard selection flow only

## Self-Check: PASSED

- [x] `Frontend2/app/(shell)/projects/new/page.tsx` — FOUND
- [x] commit `3f841a3` — FOUND in git log
- [x] TypeScript (`npx tsc --noEmit`) — exits 0 (no errors)
