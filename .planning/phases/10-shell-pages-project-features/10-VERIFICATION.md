---
phase: 10-shell-pages-project-features
verified: 2026-04-21T23:59:00Z
status: passed
score: 34/34 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "ActivityFeed shows recent activity from GET /api/v1/activity (D-28)"
    reason: "BL-01 security fix restricted /activity to admin-only. Non-admin users see empty state (graceful degradation). useGlobalActivity() catches 403 and returns {items:[],total:0}. The endpoint itself is wired and functional for admin users. Intentional narrowing per code review fix iteration 1."
    accepted_by: "task-instructions"
    accepted_at: "2026-04-21T23:30:00Z"
---

# Phase 10: shell-pages-project-features — Verification Report

**Phase Goal:** Build the entire Frontend2 shell + key pages (Dashboard, Projects list, Settings, Archive banner, Create wizard) + backend global activity endpoint + seeder expansion.
**Verified:** 2026-04-21T23:59:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | axios instance exists and attaches Bearer token to every authenticated request | VERIFIED | `Frontend2/lib/api-client.ts` — `interceptors.request.use` with `Bearer ${cleanToken}` |
| 2  | 401 response clears localStorage token + auth_session cookie + redirects to /session-expired | VERIFIED | `api-client.ts:37-61` — `AUTH_FREE_PATHS` guard, clears `AUTH_TOKEN_KEY`, sets `SESSION_EXPIRED_KEY`, clears cookie, redirects |
| 3  | AuthContext exposes user, token, login(), logout() to all (shell) pages | VERIFIED | `context/auth-context.tsx` — `AuthProvider` + `useAuth` exported; `AuthProvider` in root `layout.tsx` |
| 4  | Login succeeds → localStorage has token AND auth_session=1 cookie is set | VERIFIED | `auth-context.tsx:login()` — `localStorage.setItem(AUTH_TOKEN_KEY, ...)` + `document.cookie = \`auth_session=1; path=/; SameSite=Lax\`` |
| 5  | Wave 0 complete: test_activity.py stub exists, VALIDATION.md wave_0_complete=true | VERIFIED | `VALIDATION.md` frontmatter: `wave_0_complete: true`, `nyquist_compliant: true`; `test_activity.py` has test function stubs |
| 6  | GET /api/v1/activity?limit=20&offset=0 returns audit_log entries across all projects (admin) | VERIFIED | `activity.py:21-36` — GET `/activity` route wired to `GetGlobalActivityUseCase`; gated by `require_admin` (BL-01 fix) |
| 7  | IAuditRepository has get_global_activity() abstract method | VERIFIED | `audit_repository.py:74` — `async def get_global_activity` as `@abstractmethod` |
| 8  | SqlAlchemyAuditRepository implements get_global_activity() without project_id filter | VERIFIED | `audit_repo.py` — implementation has no `entity_id` / `project_id` WHERE conditions |
| 9  | GetGlobalActivityUseCase contains no SQLAlchemy imports | VERIFIED | `get_global_activity.py` — imports only `IAuditRepository` and DTOs; no infrastructure/sqlalchemy |
| 10 | Seeder populates projects with varied statuses, process_template_id, process_config, team.leader_id | VERIFIED | `seeder.py:345-356,513-532` — all D-36 fields: `process_template_id` lookup, `leader_id` assignment |
| 11 | Seeder adds MilestoneModel entries per project (D-36) | VERIFIED | `seeder.py:19,572` — `MilestoneModel` imported and seeded per project |
| 12 | Seeder adds ArtifactModel entries per project (D-36) | VERIFIED | `seeder.py:20,582` — `ArtifactModel` imported and seeded per project |
| 13 | Middleware redirects unauthenticated requests to /login using auth_session cookie check | VERIFIED | `middleware.ts:4` — `request.cookies.get('auth_session')`, matcher includes `/dashboard/:path*`, `/projects/:path*` |
| 14 | Login page renders 2-column layout matching prototype; calls AuthContext.login() + redirects to /dashboard | VERIFIED | `login/page.tsx` — `useAuth()`, `router.push("/dashboard")`; "Yönetici onayı ile hesap açılır." present; no "Kayıt olun" or Google OAuth |
| 15 | Session-expired page clears token+cookie on mount | VERIFIED | `session-expired/page.tsx:11-12` — `localStorage.removeItem(AUTH_TOKEN_KEY)` + `auth_session=; path=/; expires=` |
| 16 | QueryClientProvider wraps AppShell in (shell) layout; ToastProvider also present | VERIFIED | `(shell)/layout.tsx:17-20` — `QueryClientProvider > ToastProvider > AppShell`; `ReactQueryDevtools` present |
| 17 | projectService and useProjects hook wired to real API | VERIFIED | `project-service.ts` — `getAll`, `updateStatus`, `getActivity`, `getProcessTemplates`, `getTaskStats` all call `apiClient`; `hooks/use-projects.ts` exports all 6 hooks |
| 18 | useTaskStats hook calls GET /tasks and derives open/in_progress/done counts (D-26) | VERIFIED | `use-projects.ts:88-95` + `project-service.ts:112` — `getTaskStats()` calls `GET /tasks`, derives counts |
| 19 | Dashboard renders 4 StatCards with live project/task counts from API | VERIFIED | `dashboard/page.tsx:134-178` — 4 `StatCard` instances using `useProjects`, `useTaskStats` |
| 20 | PortfolioTable shows active projects (Manager view) | VERIFIED | `dashboard/page.tsx:199` — `<PortfolioTable projects={activeProjects} />` inside `view === 'manager'` branch |
| 21 | ActivityFeed shows recent activity from GET /api/v1/activity (D-28) | PASSED (override) | Endpoint wired and functional for admin. Non-admin sees empty state (BL-01 security fix). Override accepted — see overrides section. |
| 22 | View toggle switches between Manager and Member based on role | VERIFIED | `dashboard/page.tsx:23-26,132` — `useState<"manager" | "member">` with role-based init; toggle renders both views |
| 23 | StatCard 4 shows open task count from useTaskStats() (D-26) | VERIFIED | `dashboard/page.tsx:157-170` — "Açık Görevler" / "Open Tasks" label; `taskStats.open + taskStats.in_progress` |
| 24 | Projects page renders 3-column responsive card grid with SegmentedControl filter | VERIFIED | `projects/page.tsx` — `STATUS_SEGMENTS` with ACTIVE/COMPLETED/ARCHIVED; `<SegmentedControl>` + `useProjects(statusFilter || undefined)`; `globals.css:.projects-grid` with @media queries |
| 25 | Archived project cards render at opacity 0.6 (PROJ-04) | VERIFIED | `project-card.tsx:147` — `opacity: isArchived ? 0.6 : 1` |
| 26 | 3-dot overflow menu shows Tamamla/Askıya Al/Arşivle with confirmation dialog (PROJ-02) | VERIFIED | `project-card.tsx` — `CONFIRM_TITLE_TR` map, `ConfirmDialog` with `useUpdateProjectStatus` |
| 27 | Toast notifications appear bottom-right for status change success/error (D-07) | VERIFIED | `toast/index.tsx` — `ToastProvider` with `bottom:20, right:20` positioning; `useToast` wired in `ProjectCard` |
| 28 | Wizard page at /projects/new with 4 steps tracked via URL ?step=N | VERIFIED | `projects/new/page.tsx` — `useSearchParams()` inside `Suspense` boundary; `STEP_LABELS_TR` 4 entries; URL step param navigation |
| 29 | sessionStorage draft saves/restores on each step (key: spms_wizard_draft) | VERIFIED | `projects/new/page.tsx:10` — `WIZARD_DRAFT_KEY = 'spms_wizard_draft'`; save/restore effects; `sessionStorage.removeItem` on success; logout also clears it (`auth-context.tsx:64`) |
| 30 | Submit calls POST /projects and redirects to /projects/{id} | VERIFIED | `projects/new/page.tsx` — `useCreateProject()` mutation; `router.push(\`/projects/${project.id}\`)` on success |
| 31 | Settings page renders all 5 tabs with API wiring | VERIFIED | `settings/page.tsx:73-77` — all 5 tabs; `authService.updateProfile`, `setDensity`, `setLanguage`, `applyTokens`, `applyMode`; password change with `current_password`/`new_password` |
| 32 | Archived project detail page shows AlertBanner with warning tone and Aktif Et button (PROJ-03) | VERIFIED | `projects/[id]/page.tsx:43` + `archive-banner.tsx:47-56` — `AlertBanner tone="warning"`, "Aktif Et" button, `ConfirmDialog` |
| 33 | While project is ARCHIVED, edit action buttons render with disabled={isArchived} (D-34) | VERIFIED | `projects/[id]/page.tsx:37,61,90,93` — `const isArchived = project.status === 'ARCHIVED'`; three `Button` components have `disabled={isArchived}` |
| 34 | Header Create button navigates to /projects/new + dynamic project status badge on /projects/{id} | VERIFIED | `app-shell.tsx:12,45,56,84` — `usePathname`, route match regex, `useQuery` with `enabled: projectRouteId !== null`, `headerProject` badge render, `onCreateProject(() => router.push("/projects/new"))` |

**Score:** 34/34 truths verified (1 via accepted override)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Frontend2/lib/constants.ts` | AUTH_TOKEN_KEY + SESSION_EXPIRED_KEY constants | VERIFIED | Both constants exported |
| `Frontend2/lib/api-client.ts` | axios instance with dual interceptors | VERIFIED | Request + response interceptors; FL-02/FL-05 fixes applied |
| `Frontend2/services/auth-service.ts` | login, logout, getCurrentUser, updateProfile, uploadAvatar | VERIFIED | All 5 methods present; `resolveAvatarUrl` exported |
| `Frontend2/context/auth-context.tsx` | AuthProvider + useAuth hook | VERIFIED | Both exported; SSR-safe; D-03 cookie pattern; FL-01 (wizard draft cleared on logout) |
| `Frontend2/app/layout.tsx` | AuthProvider wrapping children inside AppProvider | VERIFIED | `<AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>` |
| `Frontend2/middleware.ts` | Next.js middleware cookie guard | VERIFIED | `auth_session` cookie check; correct URL matchers (real paths, not route group names) |
| `Frontend2/app/(auth)/login/page.tsx` | 2-column login page | VERIFIED | `useAuth`, D-11 compliance (no OAuth, no "Kayıt olun"), redirects to /dashboard |
| `Frontend2/app/(shell)/layout.tsx` | QueryClientProvider + ReactQueryDevtools + ToastProvider | VERIFIED | All three present; QueryClient at module scope |
| `Frontend2/services/project-service.ts` | project CRUD + status update + activity + process-templates + task stats | VERIFIED | All methods present and call real API |
| `Frontend2/hooks/use-projects.ts` | useProjects, useUpdateProjectStatus, useCreateProject, useTaskStats, useGlobalActivity, useProcessTemplates | VERIFIED | All 6 hooks exported |
| `Frontend2/app/(shell)/dashboard/page.tsx` | Dashboard page with all widgets wired to live API | VERIFIED | useProjects, useGlobalActivity, useTaskStats all called; all 4 widget components imported |
| `Frontend2/components/dashboard/stat-card.tsx` | StatCard component | VERIFIED | Exported; TONE_BG oklch color-mix values |
| `Frontend2/components/dashboard/portfolio-table.tsx` | PortfolioTable component | VERIFIED | Exported; grid-template-columns with 2fr 90px |
| `Frontend2/components/dashboard/activity-feed.tsx` | ActivityFeed component | VERIFIED | Exported; "Henüz aktivite yok." empty state |
| `Frontend2/components/dashboard/methodology-card.tsx` | MethodologyCard component | VERIFIED | Exported |
| `Frontend2/app/(shell)/projects/page.tsx` | Projects list page with filter and card grid | VERIFIED | useProjects(statusFilter), SegmentedControl, ProjectCard, .projects-grid CSS |
| `Frontend2/components/projects/project-card.tsx` | ProjectCard with status badge, overflow menu, confirm dialog | VERIFIED | STATUS_STRIP, opacity 0.6, CONFIRM_TITLE_TR, useUpdateProjectStatus |
| `Frontend2/components/projects/confirm-dialog.tsx` | ConfirmDialog for status change (D-25) | VERIFIED | Exported with `open` prop |
| `Frontend2/components/toast/index.tsx` | ToastProvider + useToast hook (D-07) | VERIFIED | Both exported; bottom:20 right:20 positioning |
| `Frontend2/app/(shell)/settings/page.tsx` | 5-tab settings page | VERIFIED | All 5 tabs; authService.updateProfile, setDensity, setLanguage, applyTokens, applyMode, password change |
| `Frontend2/app/(shell)/projects/new/page.tsx` | 4-step create project wizard | VERIFIED | WizardContent inside Suspense; useSearchParams; spms_wizard_draft; useCreateProject |
| `Frontend2/components/projects/archive-banner.tsx` | ArchiveBanner for archived project pages | VERIFIED | AlertBanner tone="warning", "Aktif Et" button, ConfirmDialog |
| `Frontend2/app/(shell)/projects/[id]/page.tsx` | Project detail stub with archive banner and disabled edit buttons | VERIFIED | ArchiveBanner, isArchived, disabled={isArchived} on 3 Buttons |
| `Frontend2/components/app-shell.tsx` | AppShell with wired header Create button and dynamic project status badge | VERIFIED | usePathname, route match regex, enabled guard, STATUS_BADGE_TONE, onCreateProject |
| `Backend/app/application/use_cases/get_global_activity.py` | GetGlobalActivityUseCase | VERIFIED | No sqlalchemy/infrastructure imports |
| `Backend/app/domain/repositories/audit_repository.py` | get_global_activity abstract method | VERIFIED | `async def get_global_activity` as @abstractmethod |
| `Backend/app/api/v1/activity.py` | GET /activity route | VERIFIED | Route present; gated by `require_admin` (BL-01 fix) |
| `Backend/app/infrastructure/database/seeder.py` | D-36 fields: varied statuses, process_template_id, process_config, leader_id, MilestoneModel, ArtifactModel | VERIFIED | All 6 D-36 requirements seeded |
| `Backend/tests/integration/test_activity.py` | Integration tests for global activity endpoint | VERIFIED | test_get_global_activity_returns_200 (admin 200), test_get_global_activity_non_admin_forbidden (403), test_get_global_activity_requires_auth (401) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Frontend2/lib/api-client.ts` | `localStorage.getItem(AUTH_TOKEN_KEY)` | request interceptor | VERIFIED | `interceptors.request.use` reads token |
| `Frontend2/context/auth-context.tsx` | `authService.login` | login() function | VERIFIED | `authService.login({ email, password })` called |
| `Frontend2/app/layout.tsx` | `AuthProvider` | import + JSX wrap | VERIFIED | `<AuthProvider>` in both import and JSX |
| `Frontend2/middleware.ts` | `request.cookies.get('auth_session')` | NextRequest.cookies API | VERIFIED | Line 4 |
| `Frontend2/app/(auth)/login/page.tsx` | `AuthContext.login()` | useAuth() hook | VERIFIED | `const { login } = useAuth()` called on submit |
| `Frontend2/app/(shell)/dashboard/page.tsx` | `useProjects({ status: 'ACTIVE' })` | useQuery for portfolio table | VERIFIED | `useProjects("ACTIVE")` on line 28 |
| `Frontend2/app/(shell)/dashboard/page.tsx` | `useGlobalActivity(20)` | useQuery for activity feed | VERIFIED | Called on line 30 |
| `Frontend2/app/(shell)/dashboard/page.tsx` | `useTaskStats()` | useQuery for StatCard 4 | VERIFIED | Called on line 32 |
| `Frontend2/app/(shell)/projects/page.tsx` | `useProjects(statusFilter)` | SegmentedControl onChange | VERIFIED | `useProjects(statusFilter || undefined)` on line 30 |
| `Frontend2/components/projects/project-card.tsx` | `useUpdateProjectStatus` | confirm dialog onConfirm | VERIFIED | Mutation called in `handleConfirm` |
| `Frontend2/app/(shell)/projects/new/page.tsx` | `useSearchParams()` | WizardContent inside Suspense boundary | VERIFIED | `useSearchParams()` inside `WizardContent`, wrapped in `<Suspense>` |
| `Frontend2/app/(shell)/projects/new/page.tsx` | `sessionStorage` | spms_wizard_draft key | VERIFIED | `WIZARD_DRAFT_KEY = 'spms_wizard_draft'` |
| `Frontend2/app/(shell)/projects/new/page.tsx` | `useCreateProject` | Step 4 submit | VERIFIED | `useCreateProject()` mutation handles submit |
| `Frontend2/app/(shell)/settings/page.tsx` | `authService.updateProfile` | Profil and Güvenlik tabs | VERIFIED | Called in profile save mutation and password change mutation |
| `Frontend2/app/(shell)/settings/page.tsx` | `useApp().setDensity` | Tercihler density select | VERIFIED | `setDensity(v)` called on row 3 |
| `Frontend2/components/projects/archive-banner.tsx` | `useUpdateProjectStatus` | Aktif Et button onConfirm | VERIFIED | `mutate: updateStatus` called with `status: 'ACTIVE'` |
| `Frontend2/app/(shell)/projects/[id]/page.tsx` | `ArchiveBanner` | conditional render when ARCHIVED | VERIFIED | `{isArchived && <ArchiveBanner .../>}` |
| `Frontend2/app/(shell)/projects/[id]/page.tsx` | `disabled={isArchived}` | isArchived boolean prop on Buttons (D-34) | VERIFIED | 3 Button instances have `disabled={isArchived}` |
| `Frontend2/components/app-shell.tsx` | `router.push('/projects/new')` | Header Create button onClick | VERIFIED | `onCreateProject={() => router.push("/projects/new")}` |
| `Frontend2/components/app-shell.tsx` | `useProjects()` | useParams() id lookup for header badge | VERIFIED | `useQuery` with `enabled: projectRouteId !== null`; `headerProject` badge rendered |
| `Backend/app/api/v1/activity.py` | `GetGlobalActivityUseCase` | Depends(get_audit_repo) injection | VERIFIED | `GetGlobalActivityUseCase(audit_repo)` on line 35 |
| `Backend/app/infrastructure/database/repositories/audit_repo.py` | `IAuditRepository` | implements get_global_activity | VERIFIED | `async def get_global_activity` without project_id filter |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `dashboard/page.tsx` | `activeProjects` | `useProjects("ACTIVE")` → `GET /projects?status=ACTIVE` → `projectService.getAll` → `apiClient.get` | Yes — real DB query via backend | FLOWING |
| `dashboard/page.tsx` | `activityData` | `useGlobalActivity(20)` → `GET /activity` → `GetGlobalActivityUseCase` → `get_global_activity()` → SELECT from audit_log | Yes — admin sees real rows; non-admin graceful empty | FLOWING |
| `dashboard/page.tsx` | `taskStats` | `useTaskStats()` → `GET /tasks` → `projectService.getTaskStats` → `apiClient.get` → derives counts | Yes — real DB query | FLOWING |
| `projects/page.tsx` | `projects` | `useProjects(statusFilter || undefined)` → `GET /projects[?status=X]` | Yes — real DB query | FLOWING |
| `projects/[id]/page.tsx` | `project` | `useProject(projectId)` → `GET /projects/{id}` | Yes — real DB query | FLOWING |
| `settings/page.tsx` | `user` (profile) | `useAuth().user` populated by `authService.getCurrentUser()` on AuthProvider mount | Yes — real `/auth/me` call | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — no running server available in this verification environment. Plan 09 underwent a 14-iteration human verification cycle that was explicitly approved by the developer. Spot-checks were performed manually during that cycle.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PAGE-01 | 10-02, 10-04, 10-09, 10-10 | Dashboard sayfasi donusturulur | SATISFIED | `dashboard/page.tsx` with all widgets wired; activity endpoint implemented; header badge for /projects/{id} |
| PAGE-02 | 10-03, 10-05, 10-10 | Projects sayfasi donusturulur — kart grid, durum filtresi, yeni proje butonu | SATISFIED | `projects/page.tsx` with SegmentedControl, 3-col grid, card grid, "Yeni proje" button |
| PAGE-05 | 10-06, 10-10 | Settings sayfasi donusturulur — tum alt sekmeler | SATISFIED | `settings/page.tsx` — 5 tabs: Profil, Tercihler, Görünüm, Bildirimler, Güvenlik, all wired |
| PAGE-06 | 10-01, 10-03, 10-10 | Login/Register sayfalari donusturulur | SATISFIED | `login/page.tsx`, `session-expired/page.tsx`, `forgot-password/page.tsx` all present; auth flow complete |
| PROJ-01 | 10-07, 10-10 | Proje Olustur Wizard sayfasi yapilir — 4 adim | SATISFIED | `projects/new/page.tsx` — 4 steps, Suspense, sessionStorage draft, submit to POST /projects |
| PROJ-02 | 10-05, 10-09, 10-10 | Proje durum yonetimi — header badge, MoreH dropdown aksiyonlari | SATISFIED | `app-shell.tsx` dynamic badge; `project-card.tsx` 3-dot menu with Tamamla/Askıya Al/Arşivle |
| PROJ-03 | 10-08, 10-10 | Arsivlenmis proje AlertBanner — uyari mesaji + Aktif Et, icerik duzenlemesi engellenir | SATISFIED | `archive-banner.tsx` AlertBanner warning tone + Aktif Et; `projects/[id]/page.tsx` disabled={isArchived} |
| PROJ-04 | 10-05, 10-08, 10-10 | Proje kartlarina durum badge + arsivlenmis opacity 0.6 | SATISFIED | `project-card.tsx` — STATUS_STRIP, STATUS_BADGE_TONE, opacity 0.6 for ARCHIVED |
| PROJ-05 | 10-05, 10-10 | Proje listesine durum filtresi — SegmentedControl | SATISFIED | `projects/page.tsx` — SegmentedControl with Tümü/Aktif/Bitti/Arşiv; `useProjects(statusFilter || undefined)` |

**All 9 Phase-10 requirements: SATISFIED**

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `Frontend2/components/toast/index.tsx` | `setTimeout` not cleared on unmount (NT-03) | Info | React logs warning only; graceful in practice; NT-level in review, not blocking |
| `Backend/app/infrastructure/database/seeder.py` | `seed_data` keys hard-coded to specific project keys (NT-08) | Info | Noted in review; pre-existing pattern; not a Phase 10 regression |
| `Frontend2/context/auth-context.tsx` | No cross-tab login detection (NT-01) | Info | Single-tab flows dominate; deferred to future phase per review |

No BLOCKER or WARNING anti-patterns found. All BL/FL-level findings from 10-REVIEW.md were resolved in 10-REVIEW-FIX.md (iteration 1, all_fixed).

---

### Human Verification Required

**None.**

Plan 10-09 included a 14-iteration blocking human verification checkpoint (Task 2, `type: checkpoint:human-verify`, `gate: blocking`). That checkpoint was explicitly approved by the developer. All visual fidelity, auth flow, API integration, and behavioral checks were performed during that cycle. No new gaps have been identified in this automated verification that would require re-opening human verification.

---

### Gaps Summary

**No gaps.**

All 34 must-haves across all 10 plans are verified against the actual codebase. All 9 requirement IDs (PAGE-01, PAGE-02, PAGE-05, PAGE-06, PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05) are satisfied with concrete artifact evidence.

The one apparent deviation — ActivityFeed being admin-only after the BL-01 security fix — is an accepted, intentional narrowing applied by the code review fix process. The frontend degrades gracefully for non-admin users. This is not a gap in goal achievement; the Dashboard still renders correctly for all user roles.

Code review findings (1 BLOCK + 7 FLAGS) were all fixed in review-fix iteration 1:
- BL-01: GET /activity restricted to admin + frontend graceful 403 handling
- FL-01: wizard sessionStorage cleared on logout
- FL-02: SESSION_EXPIRED_KEY constant used in api-client.ts
- FL-03: useProjects() in app-shell gated by `enabled: projectRouteId !== null`
- FL-04: dashboard activity mapper uses runtime type guards
- FL-05: api-client 401 interceptor adds /forgot-password to exemption list; uses `endsWith()` instead of `includes()`
- FL-06: UpdateProjectUseCase passes `updated_keys` to allow explicit null-clears
- FL-07: `datetime.utcnow()` replaced with `datetime.now(timezone.utc)`

---

_Verified: 2026-04-21T23:59:00Z_
_Verifier: Claude (gsd-verifier)_
