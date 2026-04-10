---
phase: 07-process-models-adaptation-integrations
plan: "04"
subsystem: frontend-admin-panel
tags: [admin-panel, process-templates, system-settings, SystemConfigContext, module-toggle, theming, ADAPT]
dependency_graph:
  requires: [07-02-SUMMARY, 07-03-SUMMARY]
  provides: [admin-page, ProcessTemplatesTab, SystemSettingsTab, SystemConfigProvider, adminSettingsService, processTemplateService]
  affects: [07-05-PLAN, sidebar-nav]
tech_stack:
  added: []
  patterns: [React-context-for-global-config, TanStack-Query-mutation, dynamic-CSS-custom-property-injection, role-guard-redirect]
key_files:
  created:
    - Frontend/services/process-template-service.ts
    - Frontend/services/admin-settings-service.ts
    - Frontend/context/system-config-context.tsx
    - Frontend/app/admin/page.tsx
    - Frontend/components/admin/process-templates-tab.tsx
    - Frontend/components/admin/system-settings-tab.tsx
  modified:
    - Frontend/lib/types.ts
    - Frontend/components/sidebar.tsx
    - Frontend/app/layout.tsx
decisions:
  - "SystemConfigProvider wraps app inside AuthProvider so config is globally available to sidebar and all pages"
  - "Sidebar reads useSystemConfig().config.reporting_module_enabled !== 'false' to handle missing key as enabled-by-default"
  - "Module and integration toggles use a separate toggleMutation that saves immediately and calls refetch() on success"
  - "Brand color dirty tracking compares form state to config values; params and theme each have their own dirty bit and save button"
  - "Methodology type updated to include 'iterative' as fourth union member — no migration needed (frontend-only enum change)"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 6
  files_modified: 3
  completed_date: "2026-04-10"
---

# Phase 07 Plan 04: Admin Panel Frontend Summary

**One-liner:** Admin panel at /admin with process template CRUD table and system settings (sprint params, module toggles, CSS theming) powered by a global SystemConfigContext.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Service files + SystemConfigContext + sidebar updates + types update | 9a497c88 | process-template-service.ts, admin-settings-service.ts, system-config-context.tsx, sidebar.tsx, types.ts, layout.tsx |
| 2 | Admin page with Process Templates tab and System Settings tab | c180c3ee | app/admin/page.tsx, process-templates-tab.tsx, system-settings-tab.tsx |

## What Was Built

### Services
- **process-template-service.ts**: CRUD service wrapping `/api/v1/process-templates` — `getAll`, `create`, `update` (PATCH), `delete`
- **admin-settings-service.ts**: GET/PUT service wrapping `/api/v1/admin/settings` — `get` and `update`

### SystemConfigContext
- React context providing `{ config, isLoading, refetch }` globally
- `config` is `Record<string, string>` from admin settings API
- Dynamic CSS custom property injection: sets `--primary` to `primary_brand_color` value on `document.documentElement`
- 5-minute stale time with retry: 1

### Sidebar Updates
- Imports `useSystemConfig` and reads `reporting_module_enabled` to conditionally hide Reports nav
- Admin users (role.name === "admin") get a "Yonetim" nav item with Shield icon pointing to /admin
- Nav item filtering preserves all existing items except the conditional ones

### Admin Page (/admin)
- Role guard: if user is not admin, shows `toast.error("Bu sayfaya erisim yetkiniz yok.")` and redirects to `/`
- Two tabs: "Surec Sablonlari" (process templates) and "Sistem Ayarlari" (system settings)

### ProcessTemplatesTab
- Table with columns: Sablon Adi, Tur, Kolon Sayisi, Eylemler
- Built-in templates: "Yerlesik" badge (secondary), Eye icon with tooltip, no edit/delete
- Custom templates: "Ozel" badge (outline), Pencil button (edit), Trash2 button with AlertDialog confirmation
- Delete confirmation: "Bu sablonu silmek istediginize emin misiniz? Bu islem geri alinamaz."
- Create/Edit dialog (max-w-lg): name input, description textarea, dynamic columns list with Add/Remove
- Loading state: 3 Skeleton rows
- Saving state: Loader2 spinner + disabled buttons
- Toast feedback: "Sablon olusturuldu." / "Sablon guncellendi." / "Sablon silindi."

### SystemSettingsTab
- Reads from `useSystemConfig()` — all values live from API
- **Card 1 - Sistem Parametreleri**: Sprint duration (number + "gun" suffix), max task limit, notification frequency (Select: Aninda/Saatlik Ozet/Gunluk Ozet), "Degisiklikleri Kaydet" button (dirty-tracked)
- **Card 2 - Modul Yonetimi**: Reporting module Switch — saves immediately on toggle + refetch
- **Card 3 - Tema ve Gorunum**: Primary brand color text input + 16px circle swatch preview, chart theme Select (Varsayilan), dirty-tracked save button
- **Card 4 - Dis Entegrasyonlar**: Integrations master switch — saves immediately + refetch
- Loading state: 4 Skeleton rows

### Types Update
- `Methodology` type updated from 3 to 4 values: `"scrum" | "kanban" | "waterfall" | "iterative"`
- `Project` interface gains optional `process_config?: Record<string, any>` field

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The admin panel makes real API calls to:
- `GET /api/v1/process-templates` (populated by Plan 07-02 backend)
- `POST /api/v1/process-templates` (Plan 07-02 backend)
- `PATCH /api/v1/process-templates/{id}` (Plan 07-02 backend)
- `DELETE /api/v1/process-templates/{id}` (Plan 07-02 backend)
- `GET /api/v1/admin/settings` (Plan 07-03 backend)
- `PUT /api/v1/admin/settings` (Plan 07-03 backend)

All API endpoints were implemented in Plans 07-02 and 07-03.

## Self-Check: PASSED

Files verified:
- Frontend/services/process-template-service.ts — FOUND
- Frontend/services/admin-settings-service.ts — FOUND
- Frontend/context/system-config-context.tsx — FOUND
- Frontend/app/admin/page.tsx — FOUND
- Frontend/components/admin/process-templates-tab.tsx — FOUND
- Frontend/components/admin/system-settings-tab.tsx — FOUND

Commits verified:
- 9a497c88 — feat(07-04): service files, SystemConfigContext, sidebar updates, types
- c180c3ee — feat(07-04): admin panel page with process templates and system settings tabs
