# Phase 15: RBAC Yeniden Tasarımı & Phase 14 Deferred Items Cleanup - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 15 iki bağımsız bacaktan oluşur:

**Bacak A — RBAC Yeniden Tasarımı:** Phase 14 D-A2..A5 ile v3.0'a defer edilen Roller / İzin Matrisi sekmelerinin gerçek backend bağlantısı kurulur ve admin paneli tam işlevsel hale getirilir. Build edilecek altyapı:

- **Backend (Clean Architecture vertical slice):**
  - `Permission` ve `RolePermission` domain entity'leri (mevcut `Role` entity'si + `roles` tablosu kullanılmaya devam, `permissions` ve `role_permissions` yeni tablolar)
  - `IPermissionRepository` + `IRolePermissionRepository` ABC'leri + SqlAlchemy impl
  - `roles.is_system_role` boolean column (sistem rolleri korunur)
  - `permissions.scope` ENUM('system', 'project') column (matrix UI badge'i bu kolondan okur)
  - Alembic migration **007** — yeni tablolar + `is_system_role` + `scope` kolonları + 26 perm seed + role_permissions matrix bootstrap (Admin super-role nedeniyle Admin için 0 row gerekebilir; PM/Member matrix değerleri `permissions-static.ts`'den seed edilir; Guest için 0 row = empty)
  - 26 permission seed (14 mevcut CRUD perms `permissions-static.ts`'den + 12 yeni `admin.*` perms)
  - `Depends(require_permission(key))` decorator (`Backend/app/api/deps/auth.py`)
  - `_has_permission(user, key)` helper (Admin super-role check + JWT claim lookup, no DB hit, no cache)
  - `permitted_client(perms=[...])` test fixture extending Phase 14's `authenticated_client`
  - `change_user_role.py` use case migrate: `AdminRole` literal → `role_id: int`
  - Bulk-action endpoint dynamic perm check pattern (use case içinde)

- **API:**
  - `GET/POST/PATCH/DELETE /api/v1/admin/roles` — CRUD on roles (system roles 422 on PATCH/DELETE)
  - `GET /api/v1/admin/permissions` — list all 26 perms with scope
  - `GET /api/v1/admin/permissions/matrix` — full role_permissions matrix
  - `PATCH /api/v1/admin/permissions/matrix` — auto-save per-cell mutation (D-1.12)
  - `POST /api/v1/admin/users/bulk-action` extended with dynamic perm check inside use case
  - All existing 14+ `Depends(require_admin)` callsites migrate to endpoint-specific `Depends(require_permission('admin.*'))` (admin_users / admin_audit / admin_stats / admin_summary / admin_join_requests / admin_settings / activity / process_templates / teams)
  - All app-wide mutation endpoints (POST/PATCH/DELETE on tasks, projects, comments, milestones, artifacts, phase_reports, workflow, etc.) get additional `Depends(require_permission('<resource>.<action>'))` alongside existing membership/leader checks (HİBRİT scope per D-3.4 / D-2.14)
  - `require_project_transition_authority` (Phase 9 D-15) yan yana kalır; ek perm decorator endpoint'te eklenir (D-3.6)
  - JWT claim'ine `permissions: [...]` eklenir (login + register response)
  - `PERMISSION_DENIED` error_code + `missing_permission` field (Phase 9 error taxonomy uzantısı)
  - `rbac.*` audit events: `permission_granted`, `permission_revoked`, `role_created`, `role_updated`, `role_deleted` (Phase 14 D-D3 SemanticEventType union'ı genişler)

- **Frontend:**
  - 7-layer placeholder defense (Phase 14 14-04) **tek atomic commit'te** kaldırılır:
    1. `disabled` attr + `aria-disabled="true"` 56 toggle'da
    2. `v3.0` tooltip text
    3. `v3.0` Badge in PermissionMatrixCard header
    4. AlertBanner placeholder text → "aktif" mesajı
    5. "Kopyala" button enable
    6. NewRolePlaceholderCard → NewRoleModalTrigger (real CRUD)
    7. Guest disabled card → active read-only system role card
  - `useRoles()`, `usePermissions()`, `usePermissionMatrix()` hooks (TanStack Query v5)
  - `useUpdatePermissionCell()` optimistic mutation (D-1.12 auto-save)
  - `<RequirePermission perm='...'>` guard component (D-1.7 hide UI when missing)
  - `<NavTabs/>` + AvatarDropdown'ın "Admin Paneli" link gate'i `role.name === 'Admin'` → `_has_permission(user, 'admin.access')` migrate (Phase 13 D-D2 contract guncellenir; Plan 14-11 regression test güncellenir)
  - "Yeni rol oluştur" modal (icon picker 8 lucide-react ikon + 6 oklch token renk swatch + name 1-50 char + description)
  - "Rolü düzenle" modal (system rolleri için disabled / gizli)
  - "Rolü sil" ConfirmDialog: kullanıcı sayısı warning + Member rolüne migration mesajı (D-2.2)
  - Per-row scope badge ('(system)' / '(project)') in matrix grid (D-3.4)
  - Self-edit prevention (D-2.9): `change_user_role` button disabled if `target.id === currentUser.id`; backend `PermissionError` defense
  - Avatar dropdown role display unchanged (`user.role.name` dinamik gelir)

**Bacak B — Phase 14 Deferred Items Cleanup (TIDY-01..05):** Phase 14 boyunca biriken pre-existing test/build hatalarının temizlenmesi (`phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/deferred-items.md`).

- **TIDY-01 — Frontend StatCard `tone="warning"` build error:** Phase 15 ilk planında verify edilir; Plan 14-18 Cluster F tarafından zaten düzeltilmişse VALIDATION'da "closed by 14-18" işaretlenir; hala kırmızıysa StatCard tone enum'una "warning" eklenir VEYA `reports/page.tsx:158` tone="neutral"/"danger"'a rename (D-4.5).
- **TIDY-02 — Backend pytest unit 11 fail root-cause fix:** 5 dosya (test_register_user, test_phase_gate_use_case, test_manage_phase_reports, test_task_repo_soft_delete, test_deps_package_structure) mevcut signature/contract'a hizalanır.
- **TIDY-03 — Backend integration 3 fail (`test_project_workflow_patch.py` 422 path):** `app/api/v1/projects.py` PATCH handler'a `try/except ValidationError → HTTPException(422, detail=str(e))` eklenir VEYA app-level exception handler.
- **TIDY-04 — Frontend workflow-editor 19 test fail root-cause fix:** vitest.setup.ts'a ReactFlowProvider test wrapper eklenir; `editor-page.test.tsx` 16 test wrap'lanır; `selection-panel.test.tsx` Test 5 + `workflow-canvas.test.tsx` 2 readOnly test fix; phase-edge Position type drift / use-transition-authority UseQueryResult cast / milestones-subtab spread-arg fixture / lib/api-client TS errors düzeltilir.
- **TIDY-05 — DB-required integration tests skip-error infra:** `Backend/tests/conftest.py`'a `requires_db` marker + `pytest_collection_modifyitems` hook (DB connection probe → fail ise marker'lı testler skip). ~40 dosyaya marker sed ile eklenir. Developer iter: `pytest -m 'not requires_db'`; CI: full suite Postgres up.

**Build Order (D-4.6):** TIDY önce (Wave 0), sonra RBAC (Wave 1+). RBAC plans'ları temiz baseline üzerinde yazılır; yeni eklenen testler izole çalışır; regression detect edilebilir.

**NOT in scope (deferred to v3.0 / future phase / out of scope):**

- **Per-project role overrides** — `user_project_permissions` veya `team_members.role_id` tablo. Mevcut Team.leader_id + project_members modeli korunur (D-3.1).
- **Tam project-scoped permission model** — global rol modeli korunur; project-scoped behavior endpoint check'lerinden gelir (Hibrit, D-3.1).
- **Refresh token pattern** — JWT TTL 30dk passive revoke kabul edildi (D-1.6); v3.0 ADV-01 refresh token migration ayrı phase.
- **Permission cache (Redis veya in-memory)** — JWT claim yeterli, DB hit zaten yok (D-1.10).
- **GET endpoint'lerin perm-gate'lenmesi** — sadece admin endpoint'leri + tüm mutation endpoint'leri perm-gated (Hibrit). GET'ler membership-only kalır (D-1.14).
- **Matrix scope ayrı sekme/grid'e bölme** — tek grid + per-row badge (D-3.4).
- **D-15 decorator deprecation veya rewrite** — yan yana yaşar, ek perm decorator endpoint'te eklenir (D-3.6).
- **Yeni custom rol için preset (Member kopyası)** — boş default perms, admin manuel açar (D-2.5).
- **Login event audit_log write** — Phase 14 D-X8 v2.1 candidate.
- **Audit row click → entity deep-link** — Phase 14 deferred (v2.1).

**Cross-phase contracts:**

- REUSES Phase 2 PasswordResetToken — yok, Phase 15'te password reset değişmiyor.
- REUSES Phase 9 `IAuditRepository.create_with_metadata` — `rbac.*` event yazımı bu helper üzerinden (D-1.9).
- REUSES Phase 9 `permissions-static.ts` (`Frontend2/lib/admin/permissions-static.ts`) — 14 CRUD perm'in seed kaynağı (D-1.8). Migration 007 bu dosyadaki PERMISSIONS array'i okuyarak (script-based) veya hardcoded SQL ile seed eder.
- REUSES Phase 9 D-15 `require_project_transition_authority` — yan yana, dokunulmuyor (D-3.6).
- REUSES Phase 9 D-09 `extra_metadata` JSONB — `rbac.*` audit metadata burada saklanır.
- REUSES Phase 9 error_code taxonomy — `PERMISSION_DENIED` error_code + `missing_permission` field (D-1.11).
- REUSES Phase 13 audit-event-mapper + activity-row + event-meta — yeni `rbac.*` SemanticEventType'lar bu modüllere eklenir (D-1.9).
- REUSES Phase 14 D-D3 SemanticEventType union — genişler.
- REUSES Phase 14 14-01 fat-infra Wave 0 pattern — `permitted_client` fixture genişletmesi de bu Wave 0'a benzer (D-1.15).
- REUSES Phase 14 14-04 7-layer defense — Phase 15'te koordineli kaldırılır (D-2.7).
- EXTENDS Phase 14 14-01 `change_user_role.py` — DTO `target_role: AdminRole` literal → `role_id: int`; testler güncellenir (D-1.16).
- EXTENDS Phase 13 D-D2 avatar-dropdown — Admin Paneli link gate `role.name === 'Admin'` → `_has_permission(user, 'admin.access')` (D-2.11). Plan 14-11 regression test güncellenir.

</domain>

<decisions>
## Implementation Decisions

### Quality Bar (META — applies to every plan)

- **D-00:** [informational] **Prototype-first execution; deliberate-improvement-only deviations.** Phase 13 D-00 + Phase 14 D-00 quality bar carries forward. Permission Matrix grid + Roles cards prototype'tan birebir port + i18n + token-driven styles. Allowed deviations: per-row scope badge (D-3.4 — prototype'ta yok ama 2-tier model transparency için gerekli), 7-layer defense kaldırma (Phase 15 zorunlu), atomic commit kuralı (deviation içermiyor — disabled state kaldırma + tooltip kaldırma + badge kaldırma + alertbanner içeriği değişimi koordineli). User-stated quality bar: "I don't want any sloppy plan or execution, need this done CAREFULLY."

### Plan Decomposition & Build Order

- **D-01:** [informational] **TIDY önce (Wave 0), sonra RBAC (Wave 1+) — sıra D-4.6.** Strawman ordering (planner refines):
  1. **Plan 15-01 — Wave 0a TIDY frontend harness:** vitest.setup.ts ReactFlowProvider wrap + editor-page/selection-panel/workflow-canvas test wrap'lanması + 4 dosya TS error fix (phase-edge Position drift / use-transition-authority cast / milestones-subtab spread / lib/api-client). 19 test green. ~5-8 saat. (TIDY-04)
  2. **Plan 15-02 — Wave 0b TIDY backend testler + 422 fix + requires_db marker:** 5 dosya unit fix (TIDY-02) + projects.py PATCH ValidationError→422 (TIDY-03) + conftest requires_db marker hook (TIDY-05). ~5-8 saat.
  3. **Plan 15-03 — Wave 0c TIDY-01 verify + Phase 15 baseline gate:** `npm run build` smoke + verify Plan 14-18 Cluster F'in StatCard tone fix'ini; closed işaretle veya rename. Phase 15 başlangıç durumunu locked baseline. (TIDY-01)
  4. **Plan 15-04 — Wave 1 RBAC backend domain + ORM + migration 007:** `Permission` entity + `IPermissionRepository` ABC + `IRolePermissionRepository` ABC + ORM models + `roles.is_system_role` + `permissions.scope` ENUM + migration 007 (idempotent: yeni tablolar + 26 perm seed + role_permissions matrix bootstrap). Phase 14 14-01 fat infra benzeri. ~10-15 dosya.
  5. **Plan 15-05 — Wave 1 RBAC use cases + dependency injection:** `CreateRoleUseCase`, `UpdateRoleUseCase`, `DeleteRoleUseCase` (Member fallback transaction), `ListPermissionsUseCase`, `GetPermissionMatrixUseCase`, `UpdatePermissionMatrixUseCase`, `ListRolesUseCase`. DTO'lar. `permitted_client(perms=[...])` test fixture. `change_user_role.py` migrate (AdminRole → role_id). ~12-15 dosya.
  6. **Plan 15-06 — Wave 1 RBAC API endpoints + JWT claim:** `/api/v1/admin/roles` CRUD router + `/api/v1/admin/permissions` + `/api/v1/admin/permissions/matrix` PATCH (auto-save). Login/register handler'a `permissions: [...]` JWT claim. `_has_permission(user, key)` helper + `require_permission(key)` decorator. `PERMISSION_DENIED` error format. ~10-12 dosya.
  7. **Plan 15-07 — Wave 1 RBAC backend require_admin migration:** Tüm `Depends(require_admin)` callsite'ları endpoint-specific `Depends(require_permission('admin.*'))`'a migrate. Audit events `rbac.*` (permission_granted/revoked, role_created/updated/deleted). Bulk-action use case dynamic perm check (D-1.16). ~15-20 dosya.
  8. **Plan 15-08 — Wave 1 RBAC backend mutation endpoint perm DSL (Hibrit):** App-wide mutation endpoint'lerine `Depends(require_permission('<resource>.<action>'))` eklenmesi. `/tasks/`, `/projects/`, `/comments/`, `/milestones/`, `/artifacts/`, `/phase_reports/`, `/workflow/`, `/lifecycle/` POST/PATCH/DELETE handler'ları. Mevcut `get_project_member` / `require_project_transition_authority` yan yana kalır. Test'ler genişler. ~15-20 dosya.
  9. **Plan 15-09 — Wave 2 RBAC frontend services + hooks + RequirePermission guard:** `Frontend2/services/admin-rbac-service.ts` (roles + permissions + matrix CRUD). `useRoles`, `usePermissions`, `usePermissionMatrix`, `useCreateRole`, `useUpdateRole`, `useDeleteRole`, `useUpdatePermissionCell`. `<RequirePermission perm='...'>` guard component. ~8-12 dosya.
  10. **Plan 15-10 — Wave 2 RBAC frontend Permission Matrix uplift (7-layer atomic):** `permission-matrix-card.tsx` toggle aktive (auto-save per cell), `permission-row.tsx` data-driven, `tooltip` v3.0 mesajları kaldırılır, `v3.0` Badge kalkar, AlertBanner içeriği "aktif" mesajına değişir, "Kopyala" enable, NewRolePlaceholderCard → NewRoleModalTrigger, Guest disabled → active read-only. Per-row scope badge (system/project). Test'ler tek atomic commit'te güncellenir (RTL Case 1-7 hepsinin yeni davranışı). ~6-9 dosya.
  11. **Plan 15-11 — Wave 2 RBAC frontend Roles tab full CRUD:** "Yeni rol oluştur" modal (icon picker + 6 renk swatch + name validation), "Rolü düzenle" modal, "Rolü sil" ConfirmDialog (kullanıcı sayısı + Member fallback message). Self-edit prevention UI. Avatar dropdown admin link gate migrate (`admin.access` perm-based). System rolleri korunur (PATCH/DELETE disabled UI). ~6-9 dosya.
  12. **Plan 15-12 — Wave 3 RBAC E2E + UAT artifact:** Playwright smoke specs (skip-guarded per Phase 11 D-50): Admin role flip, Custom role create/delete + Member fallback, Permission matrix toggle persists, Guest read-only login, Self-edit prevented, Admin Paneli link perm-based. `15-UAT-CHECKLIST.md` ~20-25 rows. VALIDATION.md per-task. ~3-5 dosya.

  Plans 15-01..15-03 = Wave 0 TIDY = ~10-15 dosya. Plans 15-04..15-12 = RBAC = ~80-100 dosya. Toplam ~12 plan, ~95-115 dosya. Plan numbering integer (15-01..15-12); urgent insertions için 15-XX.Y rezerve.

### RBAC Enforcement (Area 1)

- **D-1.1:** **RBAC kapsam = Tam migrate (v3.0→v2.0 reactivation full).** Tüm mevcut 14+ `require_admin` callsite'ları fine-grained `require_permission('admin.*')`'a migrate edilir. Ek olarak app-wide mutation endpoint'leri perm DSL alır (D-1.14 Hibrit). JWT'ye `permissions[]` claim eklenir. Frontend `<RequirePermission/>` guard yazılır.
- **D-1.2:** **Permission key format = `resource.action` (Spring/Django stili).** Örnek: `project.create`, `task.delete`, `task.change_assignee`, `admin.users.invite`, `admin.audit.export`. Hiyerarşik, gruplanabilir. Mevcut `permissions-static.ts` flat snake_case'den migrate edilecek (14 satır rename: `create_project` → `project.create`, vb.). Backend dec: `Depends(require_permission('project.create'))`. Mapping: `permissions-static.ts` D-1.8 migration script'inde tek tek expand edilir.
- **D-1.3:** **JWT claim strategy = JWT'ye `permissions: [...]` array eklensin.** Login/register response'unda JWT encode edilirken kullanıcının role'ünün tüm perm key'leri claim'e konulur. `require_permission(key)` decorator JWT decode edilince `key in user.permissions` check eder, DB hit yok. Token boyutu ~200-400B artar (14-30 perm). Trade-off accepted: rol/perm değişimi user'ın 30dk JWT TTL'i dolana kadar etkili olmaz (D-1.6 passive revoke).
- **D-1.4:** **Migrate mapping rule = Endpoint-bazlı spesifik permissions.** Her admin endpoint kendi spesifik perm key'ini alır (umbrella değil): `admin_users.py POST /invite` → `admin.users.invite`, `admin_audit.py GET /audit` → `admin.audit.read`, `admin_audit.py GET /audit.json` → `admin.audit.export`, `admin_stats.py` → `admin.stats.read`, `admin_summary.py PDF` → `admin.summary.export`, `admin_join_requests.py approve` → `admin.join_requests.approve`, `admin_settings.py` → `admin.settings.update`, `admin_users.py POST /bulk-action` → `admin.users.bulk` (umbrella; içeride dynamic check D-1.16). ~12-15 yeni `admin.*` perm + 14 existing CRUD perm = ~26-30 toplam. Tümü Admin super-role'de implicitly granted (D-1.5).
- **D-1.5:** **Admin tier = Otomatik tüm permissions (super-role).** `_has_permission(user, key)` ilk olarak `_is_admin(user)` check eder; True ise lookup yapmadan `True` döner. Migration 007 Admin için `role_permissions` row'u INSERT etmez (gereksiz row'lar eklenmez). Yeni perm eklendiğinde Admin otomatik kazanır. Trade-off accepted: Admin'i kısıtlamak imkansız (UI'da matrix Admin column'u readonly).
- **D-1.6:** **Token revoke = Hiçbir şey, 30dk passive TTL.** Mevcut Phase 2 JWT TTL 30dk. Real-time revoke yok. Admin matrix değiştirir, kullanıcının mevcut JWT'si max 30dk eski perms'le çalışır. Frontend matrix değişiminde Toast: "Yetki güncellendi. Etkili olması için kullanıcı tekrar giriş yapmalı veya 30 dakika beklemeli." Implementation: zero. Phase 14 zaten 30dk TTL kabul etmiş. Refresh token pattern v3.0 ADV-01.
- **D-1.7:** **Frontend `<RequirePermission>` guard = UI'ı hide.** Kullanıcı perm'e sahip değilse component hiç render edilmez (children null döner). Server-side `Depends(require_permission)` defansif backstop (UI tampering / API direct call). Phase 14 admin route guard ile tutarlı (admin değil → /admin'e giremiyor zaten). Disabled-with-tooltip ve 403-modal alternatifleri reddedildi (UX bloat / discoverability noise).
- **D-1.8:** **Migration 007 bootstrap = auto-seeds 14 CRUD perms + 12 admin.* perms + role_permissions matrix.** Migration script:
  - `permissions` tablo CREATE: 26 perm INSERT (`permissions-static.ts` 14 perm rename + 12 yeni `admin.*`).
  - `permissions.scope` column DEFAULT computed per perm key (admin.* = 'system', diğerleri = 'project').
  - `roles.is_system_role` column ALTER ADD with default false; sistem rolleri (Admin/Project Manager/Member/Guest) UPDATE is_system_role=true. Guest row INSERT (yoksa).
  - `role_permissions` tablo CREATE.
  - `role_permissions` seed: Admin için 0 row (super-role D-1.5). PM için `permissions-static.ts` "Project Manager" column'u 'granted' olan perm'ler (~13 row). Member için ~3 row (task.create, change_assignee, change_status). Guest için 0 row (read-only D-2.4).
  - Idempotent: 007 tekrar çalıştırılırsa skip.
- **D-1.9:** **Audit RBAC events = yeni `rbac.*` SemanticEventType'lar.** Phase 14 D-D3 union'ı genişler: `permission_granted`, `permission_revoked`, `role_created`, `role_updated`, `role_deleted`. Backend `audit_repo.create_with_metadata` ile yazılır. extra_metadata: `{role_id, role_name, perm_key?, granted/revoked, admin_id, target_user_id?}`. Phase 13 audit-event-mapper + activity-row + event-meta extension Plan 15-10/15-11'de yapılır (cross-cutting Plan 14-10 pattern).
- **D-1.10:** **Permission cache = Hiç cache yok.** JWT claim'inde permissions[] in-memory list olarak gelir; her istek decode olunca hazır. Backend `_has_permission(user, key)` saf in-memory `key in user.permissions`. DB hit zaten yok. Cache eklemek gereksiz karmaşıklık.
- **D-1.11:** **403 error format = Phase 9 error_code taxonomy + `PERMISSION_DENIED`.** Backend: `HTTPException(403, detail={error_code: 'PERMISSION_DENIED', missing_permission: 'admin.users.invite', message: 'Bu işlem için admin.users.invite yetkisi gerekir'})`. Frontend axios interceptor 403 yakalar, `detail.error_code === 'PERMISSION_DENIED'` ise Toast `detail.message` gösterir. Mevcut `detail: 'Admin access required'` string formattan migrate. Phase 9 D-09 error taxonomy ile tutarlı.
- **D-1.12:** **Matrix UX = Auto-save per cell + Toast.** Toggle anlık `PATCH /api/v1/admin/permissions/matrix` mutation gönderir (TanStack Query optimistic update). Body: `{role_id, perm_key, granted}`. Başarılıysa Toast "Yetki güncellendi"; hata ise revert + AlertBanner. Phase 14 D-W2 optimistic pattern ile tutarlı. Bulk edit + 'Kaydet' butonu reddedildi (UX gereksiz).
- **D-1.13:** **Permission scope semantics (own vs all) = Membership + perm 2-tier check.** Perm key'leri sade kalır (`task.delete`, scope ekleyici suffix yok). Endpoint: `Depends(require_permission('task.delete'))` AND mevcut membership/leader check (`get_project_member` veya `require_project_transition_authority`). PM rolündeki kullanıcı `task.delete` perm'ine sahip ama X projesinde Team.leader_id değilse 403. Phase 9 D-15 pattern'ı korunur. Matrix vitrin + backend 2-tier check = doğru davranış.
- **D-1.14:** **Membership-only endpoint gate = Hibrit (admin + tüm mutation endpoint'leri perm DSL).** Phase 15 scope: `require_admin` migrate + 14 CRUD perm'in app-wide mutation endpoint'lerine eklenmesi. `POST /tasks/` → `Depends(require_permission('task.create'))` + `Depends(get_project_member)`. Matrix vitrin değil GERÇEK enforce edilir (admin PM'in `task.delete` perm'ini kapatırsa gerçekten engellenir). GET endpoint'leri membership-only kalır (`get_project_member`'a dokunulmuyor; perm gate eklenmiyor).
- **D-1.15:** **Test stratejisi = `permitted_client(perms=[...])` fixture (authenticated_client extend).** Phase 14 14-01 fixture'ı fork: `permitted_client(perms=['admin.users.invite'])` arbitrary perm'lerle JWT yaratır. Default `authenticated_client` Admin perms verir; `permitted_client` özelleşmiş test'ler için. DB seed-based ve hybrid alternatifleri reddedildi (test hızı, conftest karmaşıklığı).
- **D-1.16:** **Bulk-action multi-perm = Use case içinde dynamic perm check.** Endpoint dec'i `Depends(require_permission('admin.users.bulk'))` (umbrella). Use case execute'e girince action='deactivate' ise `_has_permission(user, 'admin.users.deactivate')`, action='role_change' ise `_has_permission(user, 'admin.users.role_change')` ek check. Eksikse `PermissionError` raise. FastAPI Depends body'ye erişemediği için dynamic decorator alternatifi teknik olarak imkansız. Endpoint split alternatifi Phase 14 frontend bulk-action dispatcher'ını kıracak.
- **D-1.17:** **`change_user_role.py` use case migrate = AdminRole literal → dinamik `role_id: int`.** DTO `target_role: int` olur. Use case role_id'yi user'a atar; audit'e role_name yazılır (lookup `IRoleRepository.get_by_id(role_id).name`). Phase 14 14-01 testleri update gerekir (mevcut 3 fixed string testi role_id ile güncellensin). API contract değişir: frontend `useAdminUsers()` role.id gönderir, role.name göstermek için lookup yapar. Backwards compat / yeni use case alternatifleri reddedildi (gereksiz kod yığını).

### Custom Roles + Guest Scope (Area 2)

- **D-2.1:** **Custom rol CRUD = full (oluştur / düzenle / sil + matrix'e column).** Admin Panel /admin/roles "Yeni rol oluştur" modal açar (D-2.8 form). Role create edildiğinde matrix'e yeni column eklenir, tüm 14 perm için default 'denied' (D-2.5). Edit modal name/description/icon/color günceller. Delete ConfirmDialog kullanıcı sayısı + Member fallback warning (D-2.2). 7-layer placeholder defense kaldırılır (D-2.7).
- **D-2.2:** **Custom rol silindiğinde = Default fallback Member rolüne ata.** Backend `DeleteRoleUseCase`: önce o role'a sahip user'ları Member rolüne migrate eder (UPDATE users SET role_id=member_role.id WHERE role_id=deleted_role.id), sonra rol silinir. Tek transaction. Audit: `role_deleted` + her etkilenen user için `user_role_changed` row. ConfirmDialog body: "Bu rolü silmek 5 kullanıcıyı Member rolüne taşıyacak. Devam?". Block alternatifi reddedildi (UX engelli, defansif aşırı). Soft-delete reddedildi (veri tutarlılığı şüpheli).
- **D-2.3:** **Sistem rolleri korunması = Backend `roles.is_system_role` boolean column + check.** Migration 007: `is_system_role` ALTER ADD with default false; sistem rolleri (Admin/Project Manager/Member/Guest) UPDATE is_system_role=true. PATCH/DELETE endpoint'leri 422 `SYSTEM_ROLE_PROTECTED` raise. Frontend RoleCard: system rolleri "Düzenle" / "Sil" butonları disabled, `Sistem` Badge gösterilir. Hardcoded name guard ve frontend-only alternatifleri reddedildi (kırılgan / güvenlik açığı).
- **D-2.4:** **Guest rolü = Read-only sistem rolü (login + GET'ler + işlem yapamaz).** Migration 007 Guest row INSERT (`is_system_role=true`). `role_permissions` Guest için 0 row (boş matrix column). JWT permissions[]= []. Login mevcut (require_admin'e takılmaz, GET endpoint'lerine membership ile erişebilir). Mutation endpoint'leri 403 (perm yok). Use case: müşteri / paydaş review user. "Aktif edilmiş ama boş" ve "hala defer" alternatifleri reddedildi (custom CRUD açıyoruz, Guest'i defer tutmak tutarsız).
- **D-2.5:** **Yeni custom rol default perms = Boş (denied everything).** Yeni rol matrix'te tüm cell'ler 'denied'. Admin tek tek toggle ederek yetki verir. Member preset kopyala ve Modal'da preset seçim alternatifleri reddedildi ("kopyalanmış rol" confusion / extra UI complexity).
- **D-2.6:** **Role name validation = Unique + 1-50 karakter + Latin alfabe.** `roles.name` UNIQUE constraint. Pydantic validator: `len(1, 50)` + regex `/^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$/` (Türkçe karakterler izinli). Reserved names (case-insensitive): `Admin`, `Project Manager`, `Member`, `Guest` — yeni custom rol bu isimlerle yaratılamaz (system roles ile çakışma). 422 `ROLE_NAME_INVALID` error. Sadece UNIQUE check ve hiç reserved alternatifleri reddedildi (UX kötü / sistem rol çakışması).
- **D-2.7:** **7-layer placeholder defense = Tek atomic commit'te tümünü kaldır.** Plan 15-10 single commit:
  1. `permission-row.tsx` toggle disabled attr + aria-disabled kaldırılır (56 toggle aktif)
  2. `permission-matrix-card.tsx` v3.0 tooltip text kaldırılır
  3. `permission-matrix-card.tsx` v3.0 Badge in card header kaldırılır
  4. `app/(shell)/admin/permissions/page.tsx` AlertBanner içeriği "aktif" mesajına değişir
  5. `permission-matrix-card.tsx` "Kopyala" button enable
  6. `app/(shell)/admin/roles/page.tsx` NewRolePlaceholderCard → NewRoleModalTrigger (real CRUD)
  7. `role-card.tsx` Guest disabled state → active read-only system role
  - RTL test files (`permission-matrix-card.test.tsx`, `permission-row.test.tsx`, `role-card.test.tsx`, `new-role-placeholder-card.test.tsx`) bu davranışı eş zamanlı update. Per-layer incremental ve replace alternatifleri reddedildi (ara durumlarda UI tutarsız / route confusion).
- **D-2.8:** **Role icon + color = Form'da admin seçer (icon picker + 6 renk preset).** Role create/edit modal:
  - Icon picker: 8 lucide-react ikon (User, Briefcase, ShieldCheck, Star, Eye, Settings, Globe, Award)
  - Color swatch: 6 oklch token preset (`--priority-critical`, `--status-progress`, `--fg-muted`, `--info`, `--warning`, `--status-todo`)
  - DB columns: `roles.icon_key VARCHAR(32)`, `roles.color_token VARCHAR(64)` (NULLABLE; sistem rolleri için fixed values seed). Migration 007.
  - Default: User ikonu + `--fg-muted` renk for new custom roles.
- **D-2.9:** **Self-edit prevention = Defansif backend + UI guard.** Backend `change_user_role` use case: `if target_user_id == admin_id: raise PermissionError('Kendi rolünü değiştiremezsin')`. Frontend admin user satırında "Rolü değiştir" butonu disabled if `user.id === currentUser.id`. Matrix'te Admin column'u readonly (super-role D-1.5; UI'da görsel `Sistem` Badge + "Düzenlenemez" tooltip). Anti-lockout pattern. Kısıtlı (kendi rolünü diğer Admin yapamaz) ve hiç engel yok alternatifleri reddedildi (son Admin lockout riski).
- **D-2.10:** **Avatar dropdown role display = Mevcut korunur (dynamic `user.role.name`).** Frontend `useAuth()` API'ya sadece `user.role.name` (dinamik gelir; custom rol "Tasarımcı" gibi gösterilir). Phase 13 D-D2 dropdown text dokunulmuyor. Permissions count badge ve Admin link role-name gate alternatifleri reddedildi (UI bloat / custom Admin perm'lere yetenek vermez).
- **D-2.11:** **Admin Paneli link gate = Perm-based `_has_permission(user, 'admin.access')`.** AvatarDropdown link gate `user.role.name === 'Admin'` → `user.permissions.includes('admin.access')` (veya `_is_admin(user)` super-role check). Custom 'SuperUser' rolü `admin.access` perm'ine sahipse link görür. Phase 13 D-D2 contract test'i (avatar-dropdown.test.tsx Test 14) ve Plan 14-11 D-D2 regression guard güncellenir. Backwards compat (sadece sistem Admin görsün) reddedildi (custom Admin yaratılamaz).

### Permission Scoping Model (Area 3)

- **D-3.1:** **Permission scoping = Global rol + Team.leader_id ile project-PM (mevcut model korunur).** `users.role_id` global rolü belirler (matrix permissions[] JWT claim'inde). Phase 9 D-13 `Team.leader_id` JOIN bir kullanıcıyı spesifik bir projede transitif PM yapar (`team_projects` ile o takım o projeye atanmışsa). Phase 15 bu modele dokunmuyor; sadece `role_id` → perm matrix'e dayanıyor. Hybrid model zaten mevcut: 'system role' (global) + 'project membership/leader' (Team.leader_id veya project_members). Project-scoped tam migration ve user_project_permissions overrides v3.0 candidate (büyük migration).
- **D-3.2:** **PM rolü endpoint check = Perm + project-leadership 2-tier check.** PM rolündeki kullanıcı (matrix `task.delete=granted`) X projesinde Team.leader_id değilse silemez. Endpoint: `Depends(require_permission('task.delete'))` AND `require_project_transition_authority(project_id)` (Phase 9 D-15). Sadece perm yeterli ve project membership yeterli alternatifleri reddedildi (Phase 9 D-15 mantığı kırar / güvenlik açığı).
- **D-3.3:** **Member rolü endpoint check = Perm + `ensure_project_membership` 2-tier.** Member rolündeki kullanıcı (matrix `task.create=granted`) X projesine üye değilse oluşturamaz. Endpoint: `Depends(require_permission('task.create'))` AND `Depends(get_project_member)`. Phase 9 mevcut `get_project_member` flow korunur. Sadece perm yeterli ve implicit 404 alternatifleri reddedildi (güvenlik açığı / confusing UX).
- **D-3.4:** **Matrix UI scope = Per-row scope badge ('(system)' / '(project)').** Her perm row'unda küçük badge: `task.delete (project)`, `admin.users.invite (system)`. Backend `permissions.scope` ENUM column'undan okur (D-3.5). Admin matrix'i okurken hangi perm'in proje-bazlı yetki gerektirdiğini görür. Prototype tasarımdan küçük deviation; D-00 quality bar'da "deliberate improvement" — backend 2-tier check transparency için gerekli (PM `task.delete=granted` görünüyor ama X projesinde silmeyebiliyor cmd1ngeneşseirgr nedenini admin matrix banner'ında değil chip badge ile direkt görmeli). RTL test'te badge varlığı tested. Sade kal + AlertBanner ve 2 ayrı grid alternatifleri reddedildi (transparency düşer / scope büyür).
- **D-3.5:** **Permission scope metadata = `permissions.scope` ENUM('system', 'project') backend kolon.** Migration 007: `permissions` tablo CREATE'inde `scope NVARCHAR(16) NOT NULL` (PostgreSQL ENUM tip alternatif: `permission_scope` ENUM). Her perm seed satırına scope atanır:
  - **`system`:** `admin.users.*`, `admin.audit.*`, `admin.summary.*`, `admin.stats.*`, `admin.settings.*`, `admin.join_requests.*`, `admin.access`, `role.*`, `permission.matrix.update`
  - **`project`:** `project.create/edit/delete/archive`, `task.create/delete/change_assignee/change_status`, `comment.*`, `milestone.*`, `artifact.*`, `phase_report.*`, `workflow.edit`, `lifecycle.edit`, `member.invite/remove`
  - Frontend matrix badge `permission.scope` field'ından okur (`GET /api/v1/admin/permissions` response'unda yer alır). Hardcoded mapping ve prefix konvansiyonu alternatifleri reddedildi (frontend-backend desync riski / konvansiyon kırılganlığı).
- **D-3.6:** **Phase 9 D-15 `require_project_transition_authority` = Yan yana kalır, ek perm decorator endpoint'te.** Mevcut endpoint'ler (faz geçişi, milestone POST/PATCH/DELETE, artifact POST/DELETE, phase_report POST/PATCH/DELETE) zaten `Depends(require_project_transition_authority)` kullanıyor. Phase 15: ek olarak `Depends(require_permission('milestone.create'))` (veya ilgili perm) eklenir. İki decorator sırayla çalışır. D-15 use case'i dokunulmuyor (Phase 9 testleri korunur). D-15 içine perm check ekleme ve D-15 deprecation alternatifleri reddedildi (Phase 9 contract drift / büyük refactor).

### TIDY Priority + Cleanup Approach (Area 4)

- **D-4.1:** **TIDY-04 (Frontend workflow-editor 19 fail) = Root-cause fix (Plan 15-01).** vitest.setup.ts'a `<ReactFlowProvider>` test wrapper helper eklenir. `editor-page.test.tsx` 16 test render call'larında wrap'lanır. `selection-panel.test.tsx` Test 5 fix. `workflow-canvas.test.tsx` 2 readOnly test fix. Pre-existing TS errors düzeltilir: `phase-edge.test.tsx` Position type drift, `use-transition-authority.test.tsx` UseQueryResult cast, `milestones-subtab.test.tsx` spread-arg fixture, `lib/api-client.test.ts` TS error. Hedef: 19 test green; tüm Frontend2 testleri yeşil baseline. ~5-8 saat. Skip-mark ve kısmi fix alternatifleri reddedildi (regression detect edemiyoruz / yarım iş).
- **D-4.2:** **TIDY-02 (Backend pytest unit 11 fail) = Root-cause fix (Plan 15-02).** 5 dosya mevcut signature/contract'a hizalanır:
  1. `test_register_user.py` (2 test) — `IUserRepository.create` signature update.
  2. `test_phase_gate_use_case.py` (4 test) — ProjectPhase / phase-gate-criteria contract drift fix (Phase 12).
  3. `test_manage_phase_reports.py` (2 test) — cycle-number computation update (Phase 12 audit-driven).
  4. `test_task_repo_soft_delete.py` (2 test) — audit-row enrichment expectation update (Plan 14-09 D-D2 semantics).
  5. `test_deps_package_structure.py` (1 test) — `get_milestone_repo` expectation in `app.api.deps.milestone.__all__` (Phase 9 09-02 BACK-07).
  ~3-5 saat. Skip-mark ve sil alternatifleri reddedildi (baseline temiz olmaz / coverage küçülür).
- **D-4.3:** **TIDY-03 (Backend integration 3 fail `test_project_workflow_patch.py`) = `app/api/v1/projects.py` PATCH handler ValueError → 422 fix.** Plan 15-02 içinde tek edit: PATCH endpoint try/except ValidationError pattern (Pydantic v2 idiomatic):
  ```python
  try:
      validated_config = WorkflowConfig(**dto.workflow_config)
  except (ValidationError, ValueError) as e:
      raise HTTPException(
          status_code=422,
          detail={"error_code": "INVALID_WORKFLOW_CONFIG", "message": str(e)}
      )
  ```
  3 test (legacy_n1_id / zero_initial / zero_final) green. ~10 satır kod. Skip alternatifi reddedildi (workflow validation davranışı doğrulanmaz).
- **D-4.4:** **TIDY-05 (DB-required integration tests) = `@pytest.mark.requires_db` marker + auto-skip (Plan 15-02).** `Backend/tests/conftest.py`:
  ```python
  def pytest_configure(config):
      config.addinivalue_line("markers", "requires_db: marks tests that require live Postgres")

  def pytest_collection_modifyitems(config, items):
      try:
          # probe DB connection
          ...
      except (OperationalError, ConnectionRefusedError):
          skip_marker = pytest.mark.skip(reason="DB not available")
          for item in items:
              if "requires_db" in item.keywords:
                  item.add_marker(skip_marker)
  ```
  Mevcut `tests/integration/` ~40 dosyaya marker sed ile eklenir. Developer iter: `pytest -m 'not requires_db'`. CI: `pytest` (Postgres up). aiosqlite fallback ve testcontainer alternatifleri reddedildi (feature parity sorunu / docker dep).
- **D-4.5:** **TIDY-01 (StatCard `tone="warning"`) = Verify-and-close (Plan 15-03).** `npm run build` smoke test. Plan 14-18 Cluster F'in muhtemel düzeltmesi varsa VALIDATION'da TIDY-01 'closed by Plan 14-18 Cluster F' işaretlenir. Hala kırmızıysa StatCard tone enum'una `'warning'` eklenir VEYA `reports/page.tsx` rename. ~5-15 dakika. Defansif (proactive ekleme) alternatifi reddedildi (zaten 11 dosya warning kullanıyor — enum'da varsa proactive gereksiz).
- **D-4.6:** **TIDY ve RBAC sıralama = TIDY önce (Wave 0), sonra RBAC (Wave 1+).** Plan 15-01..15-03 = Wave 0 TIDY (workflow-editor harness + backend tests/422/requires_db + StatCard verify). Plan 15-04..15-12 = Wave 1+ RBAC. Trade-off accepted: temiz baseline'la RBAC'a başlanır (yeni testler izole çalışır, regression detect edilir). RBAC önce ve paralel alternatifleri reddedildi (kırık test baseline ile yaşamak / vertical-slice kırılır).

### Claude's Discretion

- **Migration 007 PostgreSQL ENUM vs CHECK constraint** — `permissions.scope` için PostgreSQL native ENUM (`permission_scope`) yoksa VARCHAR + CHECK constraint. Idempotency için ENUM yaratma `IF NOT EXISTS` pattern. Planner picks based on Phase 1/9 migration patterns.
- **`permissions-static.ts`'nin migration 007 ile senkronizasyonu** — TypeScript dosyası → Python dict translation script vs hardcoded SQL listesi vs JSON intermediate. Recommend: hardcoded SQL listesi migration 007 içinde + frontend dosyası dokunulmuyor (single source of truth artık backend `permissions` tablosu, frontend matrix bu tablodan okur). Frontend `permissions-static.ts` Phase 15 sonrası deprecated → kaldırılır veya legacy import path'i shim olarak korunur.
- **Role color picker exact 6 token seçimi** — `--priority-critical`, `--status-progress`, `--fg-muted`, `--info`, `--warning`, `--status-todo` önerildi; planner alternatif token seti seçebilir (örn: theme preset'ine göre).
- **Migration 007 backfill of existing audit_log rows for rbac.\* events** — yok (yeni event'ler sadece Phase 15 sonrası yazılır). D-D6 backward compat: pre-migration rows render edilmez.
- **`<RequirePermission/>` guard component implementation: HOC vs render-prop vs hook + early return** — recommend hook + early return (`useHasPermission(perm)` returns boolean; component conditionally renders). Planner picks.
- **Test fixture `permitted_client` location** — `Backend/tests/conftest.py` (top-level) vs `Backend/tests/integration/conftest.py`. Recommend top-level (unit testleri de kullanabilir).
- **Matrix UI per-row scope badge exact styling** — Badge tone='neutral' + sub-text gri vs küçük chip vs prefix etiketi. Recommend Badge tone='neutral' inline (consistent with Phase 14 D-D2 metadata badges).
- **JWT permissions[] claim sorting** — alphabetical sort (deterministic, debug-friendly) vs insertion order. Recommend alphabetical.
- **Idempotency-Key for matrix toggle PATCH** — Phase 9 D-08 pattern (5dk TTL). Recommend yok (mutation idempotency UI auto-save tarafından zaten korunmuş — double-click optimistic update revert ile dengelenir).
- **`role_permissions` row delete vs soft-flag on revoke** — recommend hard-delete (DB row sayısı bounded, audit log zaten kayıt tutuyor). Soft-flag gereksiz karmaşıklık.

### Folded Todos

None — `gsd-sdk todo.match-phase` Phase 15 oluşturulduğunda invoke edilmedi (just-created phase). Discussion sırasında todo surface etmedi. Planning aşamasında çıkarsa `/gsd-add-todo` veya PLAN.md notuyla.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 (DEFERRED RBAC + DEFERRED-ITEMS source of truth)

- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-CONTEXT.md` — Phase 14 D-A2..A5 RBAC defer kararları, D-B5 project transfer skipped, D-D1..D6 audit detail enrichment cross-cutting (Phase 15 `rbac.*` extension yapacak), D-W2 optimistic update pattern.
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/deferred-items.md` — **Phase 15 TIDY-01..05 source of truth.** 5 ayrı entry: StatCard tone build error, project_workflow_patch.py 422, workflow-editor 19 fail (3 ayrı plan log), Backend pytest 11 fail, DB-required skip-error.
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-04-PLAN.md` — 7-layer placeholder defense kuruldu burada (Phase 15 atomic kaldırma D-2.7 bunun her layer'ını terk eder). Test cases burada referans (`permission-matrix-card.test.tsx` Case 1-5, `permission-row.test.tsx`, `role-card.test.tsx`).
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-01-PLAN.md` — `change_user_role.py` use case (Phase 15 migrate D-1.17), `permitted_client` fixture extension için authenticated_client baseline (D-1.15), `permissions-static.ts` 14 perm tanımı (D-1.8 migration seed kaynağı).
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-11-PLAN.md` — Phase 13 D-D2 cross-phase contract regression guard (Phase 15'te `admin.access` perm-based gate'e migrate edilirken bu test güncellenir; D-2.11).

### Phase 9 (Backend foundation Phase 15'in dayandığı)

- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — D-09 audit_log + extra_metadata JSONB (Phase 15 `rbac.*` events bunu kullanır), D-13 Team/TeamMember/TeamProject model (D-3.1 korunur), D-15 `require_project_transition_authority` (D-3.2/D-3.6 yan yana çalışır), D-08 Idempotency-Key pattern, D-09 error_code taxonomy (D-1.11 `PERMISSION_DENIED` extend), 09-02 BACK-07 deps/ split (test_deps_package_structure D-4.2 fix bunu referans alır).
- `Backend/app/api/deps/auth.py` — `require_admin`, `_is_admin`, `require_project_transition_authority` (Phase 15 `require_permission` bu dosyaya eklenir).
- `Backend/app/api/deps/project.py` — `get_project_member` (D-3.3 mutation endpoint'lerde yan yana çalışır).
- `Backend/app/domain/repositories/audit_repository.py` `create_with_metadata` — Phase 15 `rbac.*` events buradan yazılır.

### Phase 13 (Audit/Activity infrastructure Phase 15 extends)

- `.planning/phases/13-reporting-activity-user-profile/13-CONTEXT.md` — D-D2 avatar-dropdown admin link gate (Phase 15 D-2.11 perm-based migrate edilir), audit-event-mapper structure, activity-row variant pattern.
- `Frontend2/lib/audit-event-mapper.ts` — Phase 14 14-10'da SemanticEventType union genişledi; Phase 15 `rbac.*` 5 üye daha ekler (D-1.9).
- `Frontend2/components/activity/activity-row.tsx` — Phase 14 14-10 admin-table variant. Phase 15 `rbac.*` event'ler için yeni render branch ekler.
- `Frontend2/lib/activity/event-meta.ts` — verb formatter; `permission_granted` / `role_created` vb. için label entries eklenir.

### Phase 12 (TIDY-02 / TIDY-03 origin)

- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md` — D-09 in-memory fakes pattern (test fixture'lar), D-58 PDF rate-limit pattern. Phase 12 P10 manual UAT deferred (Phase 15 scope dışı).
- `Backend/app/api/v1/projects.py` PATCH handler — D-4.3 ValidationError → 422 fix burada (TIDY-03).
- `Backend/tests/integration/api/test_project_workflow_patch.py` — D-4.3 fix sonrası green olacak 3 test.

### Existing Frontend2 Code (extend, not rewrite)

- `Frontend2/lib/admin/permissions-static.ts` — D-1.8 migration seed kaynağı; Phase 15 sonrası deprecated (matrix backend `permissions` tablosundan okur).
- `Frontend2/components/admin/permissions/permission-matrix-card.tsx` — D-2.7 atomic uplift hedefi (7-layer kaldırma).
- `Frontend2/components/admin/permissions/permission-row.tsx` — D-2.7 toggle aktive.
- `Frontend2/app/(shell)/admin/permissions/page.tsx` — D-2.7 AlertBanner içerik değişimi.
- `Frontend2/app/(shell)/admin/roles/page.tsx` — D-2.7 NewRolePlaceholderCard → NewRoleModalTrigger; Plan 14-17 truncation banner mantığı korunur (kullanıcı sayısı 1000+'da uyarı).
- `Frontend2/components/admin/roles/role-card.tsx` — D-2.3 Sistem Badge + disabled CRUD; D-2.4 Guest active read-only.
- `Frontend2/components/admin/roles/new-role-placeholder-card.tsx` → `new-role-modal-trigger.tsx` rename + real CRUD.
- `Frontend2/components/header/avatar-dropdown.tsx` — D-2.11 admin link gate `_has_permission(user, 'admin.access')` migrate.
- `Frontend2/hooks/use-admin-users.ts` — D-1.17 role.id consume.
- `Frontend2/services/admin-user-service.ts` — D-1.17 role_id parameter.

### Existing Backend Code (extend, not rewrite)

- `Backend/app/domain/entities/role.py` — `Role` entity exists (id/name/description). Phase 15: `is_system_role` + `icon_key` + `color_token` field eklenir.
- `Backend/app/infrastructure/database/models/role.py` — `RoleModel` exists. Phase 15: `is_system_role`, `icon_key`, `color_token` columns; `Permission` ve `RolePermission` ORM models eklenir.
- `Backend/app/domain/entities/user.py` — `User` entity (Optional `Role`). Phase 15: dokunulmuyor (permissions[] JWT claim'inden gelir, entity'de değil).
- `Backend/app/application/use_cases/change_user_role.py` — D-1.17 migrate (`AdminRole` literal → `role_id: int`).
- `Backend/app/application/dtos/admin_user_dtos.py` — D-1.17 DTO update.
- `Backend/app/api/v1/admin_users.py` — bulk-action endpoint D-1.16 dynamic perm check.
- `Backend/app/infrastructure/database/seeder.py` — Phase 1 seeder; 4 sistem rol seed'i mevcut. Migration 007 `is_system_role=true` flip eder.
- `Backend/alembic/versions/006_phase14_admin_panel.py` — Phase 14 admin migration (Phase 15 007 üzerine ekler).

### Backend NEW Files (Phase 15 scope)

- `Backend/app/domain/entities/permission.py` — `Permission` entity.
- `Backend/app/domain/entities/role_permission.py` — `RolePermission` junction entity (opsiyonel; many-to-many; entity yerine sadece repo method'larıyla yönetilebilir).
- `Backend/app/domain/repositories/permission_repository.py` — `IPermissionRepository` ABC.
- `Backend/app/domain/repositories/role_permission_repository.py` — `IRolePermissionRepository` ABC.
- `Backend/app/domain/repositories/role_repository.py` — `IRoleRepository` ABC (yeni; mevcut `Role` entity zaten var ama repo abstraction yokmuş).
- `Backend/app/infrastructure/database/models/permission.py` — `PermissionModel` ORM.
- `Backend/app/infrastructure/database/models/role_permission.py` — `RolePermissionModel` junction.
- `Backend/app/infrastructure/database/repositories/permission_repo.py` — impl + mapper.
- `Backend/app/infrastructure/database/repositories/role_permission_repo.py` — impl + mapper.
- `Backend/app/infrastructure/database/repositories/role_repo.py` — `SqlAlchemyRoleRepository` impl.
- `Backend/app/application/use_cases/{create,update,delete}_role.py` (Member fallback transaction Delete'de D-2.2).
- `Backend/app/application/use_cases/{list_permissions,get_permission_matrix,update_permission_matrix}.py`.
- `Backend/app/application/dtos/role_dtos.py`, `permission_dtos.py`.
- `Backend/app/api/deps/role.py` (DI factory + perm check helpers `_has_permission`, `require_permission`).
- `Backend/app/api/v1/admin_roles.py` (CRUD router).
- `Backend/app/api/v1/admin_permissions.py` (list + matrix CRUD router).
- `Backend/alembic/versions/007_phase15_rbac.py` — migration: `permissions` + `role_permissions` tablolar + `roles.is_system_role/icon_key/color_token` + `permissions.scope` ENUM + 26 perm seed + role_permissions matrix seed.
- `Backend/tests/integration/admin/test_admin_roles.py`, `test_admin_permissions.py`, `test_admin_role_permission_matrix.py`.
- `Backend/tests/integration/test_rbac_audit_emission.py` (rbac.* events).

### Frontend2 NEW Files (Phase 15 scope)

- `Frontend2/services/admin-rbac-service.ts` (roles + permissions + matrix CRUD service layer).
- `Frontend2/hooks/use-roles.ts`, `use-permissions.ts`, `use-permission-matrix.ts`, `use-create-role.ts`, `use-update-role.ts`, `use-delete-role.ts`, `use-update-permission-cell.ts` (TanStack Query hooks).
- `Frontend2/components/auth/require-permission.tsx` (`<RequirePermission perm='...' children={...}/>` guard).
- `Frontend2/components/admin/roles/role-create-modal.tsx`, `role-edit-modal.tsx`, `role-delete-confirm.tsx`, `new-role-modal-trigger.tsx`.
- `Frontend2/components/admin/roles/role-icon-picker.tsx`, `role-color-swatch.tsx`.
- `Frontend2/lib/admin/role-validation.ts` (D-2.6 validation helpers).
- `Frontend2/components/admin/permissions/permission-scope-badge.tsx` (D-3.4).
- E2E specs: `Frontend2/e2e/admin-rbac-roles-crud.spec.ts`, `admin-rbac-matrix.spec.ts`, `admin-rbac-self-edit.spec.ts`, `admin-rbac-guest-readonly.spec.ts`.

### Project Context

- `.planning/PROJECT.md` — v2.0 milestone goal, design freeze, prototype-fidelity rule, Out of Scope.
- `.planning/REQUIREMENTS.md` — RBAC-01..RBAC-08 yeni gereksinimler (planner tarafından atanacak), TIDY-01..TIDY-05 deferred-items.md mapping.
- `.planning/STATE.md` — Phase 14 complete; Phase 15 gathering 2026-04-29.
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules (Domain → Application → Infrastructure → API).
- `.planning/codebase/CONVENTIONS.md` — Naming (snake_case files / PascalCase classes / I-prefix interfaces / DTO suffix).
- `.planning/codebase/STACK.md` — FastAPI / SQLAlchemy async / Next.js / React 19 / TanStack Query v5 / Tailwind / Pydantic v2.
- `.planning/codebase/TESTING.md` — Pytest + integration test conventions (D-4.4 `requires_db` marker bunun standardına eklenir).
- `Frontend2/CLAUDE.md` + `Frontend2/AGENTS.md` — "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code." Phase 15 yeni `<RequirePermission/>` component + hook'lar — researcher Next.js current API doğrular (Server vs Client component placement, Server Action eligibility).
- `CLAUDE.md` (root) — Clean Architecture + SOLID + DI rules. Her yeni entity strict workflow takip eder.

### Research Items (for gsd-phase-researcher)

- **JWT permissions[] claim size impact** — token boyutu 14-30 perm ile ne kadar büyür? localStorage limit (5MB) çok geniş ama HTTP header ~8KB cap. Worst-case 100 perm + 200B avg = 20KB > limit. v3.0 candidate: claim'i compress (zlib) veya hash + DB lookup hybrid (D-1.10 hybrid alternatifi).
- **PostgreSQL ENUM vs CHECK constraint trade-offs** — `permissions.scope` için ENUM (idempotent migration karmaşık) vs VARCHAR + CHECK (schema introspection daha kolay). Phase 9 migration patterns review.
- **Role hierarchy patterns** — Casbin / Oso / OpenFGA / Keycloak modellerinde "super-admin auto-grants all" pattern'ı nasıl ele alır (D-1.5 super-role)? Defansif alternatifler.
- **Test fixture extension for permission claims** — pytest-asyncio fixture composition; `authenticated_client` üstüne `permitted_client(perms=[...])` nasıl temiz katmanlanır? Phase 14 14-01 baseline review.
- **`<RequirePermission/>` guard hook vs HOC vs render-prop performance** — React 19 Server Component limitations; Server Action permission check pattern.
- **Migration 007 idempotency strategy for ENUM creation** — `CREATE TYPE IF NOT EXISTS` PostgreSQL'de yok; safe pattern (DO $$ DECLARE ... $$).
- **`require_project_transition_authority` + `require_permission` decorator order** — FastAPI Depends ordering; iki decorator sırası garbage collection / call order? D-3.6 doğru çalışacağını test etmek.
- **Postgres advisory_lock + dynamic perm check on bulk endpoint** — D-1.16 use case içinde `_has_permission` çağrısı transaction içinde mi, dışında mı? Lock semantics.
- **`permissions-static.ts` deprecation strategy** — Phase 15 sonrası bu dosya silinir mi, legacy import shim olarak korunur mu? Frontend2 audit (kim import ediyor?).
- **vitest.setup.ts ReactFlowProvider wrapper** — `@xyflow/react@12.10.2` API'sinde Provider mount'u SSR / hydration ile uyumlu mu? Test transcript validate edilmeli.
- **`pytest_collection_modifyitems` + DB connection probe** — pytest hook signature; conftest hierarchy (Backend/tests/conftest.py vs Backend/tests/integration/conftest.py).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **All 16+ Frontend2 primitives** — Phase 14 inventory korunur. Phase 15 yeni: icon picker (8 lucide-react icons), color swatch (6 oklch token preset chips). Bu primitive olarak değil, role-create-modal içinde inline.
- **`<DataState/>` (Phase 13 D-F2)** — REUSED on RBAC tabs.
- **`<ConfirmDialog/>` (Phase 10 D-25)** — REUSED for delete role.
- **`<ToastProvider/>` (Phase 10 D-07)** — REUSED for matrix auto-save / role CRUD feedback.
- **`useAuth()` (Phase 10)** — `currentUser` + `role` + `permissions[]` (yeni alan, D-1.3 JWT claim'inden gelir; AuthContext genişler).
- **`useApp()` (Phase 8)** — Language for i18n (RBAC string'leri TR/EN).
- **TanStack Query v5** — All RBAC fetches/mutations; `staleTime: 60s` matrix; `optimistic update` per cell auto-save (D-1.12).
- **`require_admin` Depends (Phase 9)** — DEPRECATING — yeni `require_permission` decorator yerine geçer. Migration cross-cutting (Plan 15-07).
- **`require_project_transition_authority` (Phase 9 D-15)** — REUSED (yan yana D-3.6).
- **`get_project_member` (Phase 9)** — REUSED (mutation endpoint'lerde 2-tier check D-3.3).
- **`audit_repo.create_with_metadata` (Phase 9)** — REUSED for `rbac.*` events (D-1.9).
- **`authenticated_client` test fixture (Phase 14 14-01)** — EXTENDED to `permitted_client(perms=[...])` (D-1.15).
- **Phase 14 14-10 audit-event-mapper extension pattern** — REUSED (Plan 15-09 cross-cut audit-event-mapper for `rbac.*`).
- **`change_user_role.py` use case (Phase 14 14-01)** — MIGRATED (D-1.17 AdminRole → role_id).
- **`PasswordResetToken` (Phase 2)** — N/A (Phase 15 password flow değişmiyor).

### Established Patterns

- **`"use client"` directive** on every interactive component (yeni: `<RequirePermission/>` guard hook + role modals).
- **Named exports** (`export function X`).
- **`@/` path alias**.
- **Inline styles with CSS tokens** (oklch + var(--*) preserved everywhere; rol icon/color picker token-based).
- **Service layer + hooks layer** (Phase 10/11/12/13/14 pattern; Plan 15-09).
- **Optimistic updates** — Phase 15 matrix auto-save (D-1.12) + role create/delete (Plan 15-11).
- **Error code taxonomy** — Phase 9 + Phase 15 `PERMISSION_DENIED` + `SYSTEM_ROLE_PROTECTED` + `ROLE_NAME_INVALID` + `INVALID_WORKFLOW_CONFIG` (D-4.3).
- **Phase 11 D-21 localStorage** — N/A Phase 15 (matrix server state, not local).
- **Phase 12 D-02 / Phase 14 D-01 fat infra plan pattern** — APPLIED to Plan 15-04 (Wave 1 RBAC backend domain + ORM + migration).
- **Phase 14 14-01 vertical slice structure** — APPLIED to Plan 15-04..15-08 (Permission/RolePermission slice).
- **Phase 13 D-00 / Phase 14 D-00 quality bar** — CARRIED FORWARD verbatim (D-00 in this CONTEXT.md).
- **JWT claim addition** — Phase 2 JWT encode/decode helper genişletilir; backwards compat (eski JWT permissions claim'i yoksa `[]` default).

### Integration Points

- **`Frontend2/context/auth-context.tsx`** — `useAuth().permissions: string[]` yeni alan. `useAuth().hasPermission(key)` helper (D-1.7 guard component bunu kullanır).
- **`Frontend2/components/header/avatar-dropdown.tsx`** — D-2.11 Admin Paneli link gate migrate. Plan 14-11 D-D2 regression test güncellenir.
- **`Frontend2/lib/audit-event-mapper.ts`** — `SemanticEventType` union genişler (D-1.9 5 yeni member).
- **`Frontend2/components/activity/activity-row.tsx`** — yeni render branch'ler `rbac.*` event'ler için.
- **`Frontend2/lib/activity/event-meta.ts`** — verb formatter ve label entries genişler.
- **Backend `app/api/deps/auth.py`** — `_has_permission`, `require_permission` eklenir; `require_admin` legacy korunur (Plan 14-04 placeholder still uses it on `/admin/*` route guard middleware) ama callsite migrate edilir.
- **Backend `app/api/v1/__init__.py`** — yeni `admin_roles.py`, `admin_permissions.py` router'ları wire edilir.
- **Backend `alembic/versions/007_phase15_rbac.py`** — migration adds `permissions`, `role_permissions` + alters `roles` + alters `permissions.scope` ENUM.
- **Backend `app/infrastructure/database/seeder.py`** — Migration 007 yeniden seed yapacaksa idempotent (mevcut roles tablosu seed'i Migration 001'de yapılmış, Phase 15 sadece Guest INSERT + is_system_role flip + perm seed + role_perm matrix seed).

### Cross-File Dependency Rules

- All new admin endpoints MUST honor `Depends(require_permission('admin.*'))` — no leftover `require_admin` in admin endpoints after Plan 15-07.
- All app-wide mutation endpoints MUST honor `Depends(require_permission('<resource>.<action>'))` alongside membership/leader check (Hibrit D-1.14) after Plan 15-08.
- Admin route guard MUST be both client-side (D-2.11 perm-based) AND server-side (Plan 15-07 perm DSL) — neither alone is sufficient.
- New `rbac.*` audit events MUST use Phase 9 `audit_repo.create_with_metadata` helper — direct DB insert prohibited.
- Permission Matrix toggle PATCH MUST be optimistic (D-1.12) and revert on 4xx — UI/server desync prevented.
- 7-layer placeholder defense kaldırma MUST be tek atomic commit (D-2.7) — partial removal yields inconsistent UI state during deploy.
- System role protection MUST be backend-enforced (`is_system_role` boolean check; D-2.3) — frontend-only disabled buton tampering ile bypassable.
- Self-edit prevention MUST be backend-enforced (D-2.9) — frontend disabled UI tampering ile bypassable; lockout riski.
- `permissions-static.ts` deprecation post-Phase 15 — frontend matrix server-driven (`GET /api/v1/admin/permissions`); legacy import shim opsiyonel.
- `change_user_role.py` migration MUST update Phase 14 14-01 testlerini eş zamanlı (D-1.17).
- Avatar dropdown D-D2 link gate migration MUST update Plan 14-11 contract regression test (`avatar-dropdown.test.tsx` Test 14).
- Migration 007 MUST be idempotent — Phase 9 09-01 pattern (drop-and-create vs add-only ALTER, mevcut seed kontrol).
- `permitted_client` fixture MUST not introduce DB seed dependency (D-1.15 in-memory JWT claim override yeterli).

</code_context>

<specifics>
## Specific Ideas

- **"RBAC altyapısını v3.0'dan v2.0'a alalım, full integration"** (Phase 14 D-A2 reverse, Phase 15 D-1.1): Tam migrate kararı; placeholder'lar kaldırılır, gerçek perm DSL backend ve frontend'e yazılır. Phase 15'in iki bacağından büyük olan.
- **"resource.action format"** (D-1.2): Spring/Django convention'ı. `permissions-static.ts` 14 perm rename gerekir (`create_project` → `project.create`).
- **"JWT'ye permissions[] claim"** (D-1.3): Login/register response zenginleşir. 30dk passive TTL ile real-time revoke yok (D-1.6).
- **"Admin = super-role, otomatik tüm permissions"** (D-1.5): Migration 007 Admin için role_permissions row'u INSERT etmez. Yeni perm eklendiğinde Admin auto-grant. Bu defensiveness (Admin'i kısıtlama yeteneğini fedakarlık) kabul edildi.
- **"Hide UI for missing permissions"** (D-1.7): Discoverability bonus (disabled+tooltip) ve aggressive UX (403 modal) reddedildi. Server-side defansif backstop.
- **"Migration 007 auto-seeds 26 perm + role_permissions matrix"** (D-1.8): Frontend `permissions-static.ts` data'sı backend'e migrate; tek source of truth artık backend tablosu.
- **"`rbac.*` audit events"** (D-1.9): Phase 14 D-D3 audit semantic union'ı genişler. Cross-cutting Plan 15-09 (audit-event-mapper) + Plan 15-10/11 (UI render branch).
- **"Auto-save per cell + Toast"** (D-1.12): Phase 14 D-W2 optimistic pattern. Bulk edit ve confirm modal alternatifleri reddedildi.
- **"2-tier check: perm + membership/leader"** (D-1.13, D-3.2, D-3.3): Mevcut Phase 9 D-15 ve `get_project_member` mantığı korunur. Perm DSL bunun **üstüne** ekleniyor; perm key'leri sade (no `.own`/`.any` suffix), backend 2-tier check enforce eder. Aynı satıra "Project Manager column'u task.delete=granted" demek "PM rolü + o projedeki bir takımın lideri" demek.
- **"Hibrit: admin + tüm mutation endpoint'leri perm DSL"** (D-1.14): Matrix vitrin değil GERÇEK enforce. Admin matrix'te PM'in `task.delete` perm'ini kapatırsa gerçekten engellenir.
- **"`change_user_role.py` migrate to role_id"** (D-1.17): Phase 14 14-01 testleri update gerekir. Backwards compat kabul edilmedi (gereksiz kod yığını).
- **"Custom rol full CRUD + Member fallback"** (D-2.1, D-2.2): Yeni rol modalı, edit modalı, delete ConfirmDialog. Silinen rolün kullanıcıları Member rolüne migrate edilir (transaction). "Block if users assigned" alternatifi reddedildi (UX engelli).
- **"is_system_role boolean column"** (D-2.3): Sistem rollerini (Admin/PM/Member/Guest) backend-enforced olarak korur. Hardcoded name guard ve frontend-only alternatifleri reddedildi (kırılgan / güvenlik açığı).
- **"Guest read-only sistem rolü"** (D-2.4): Login + GET'ler + permissions[]= []. Müşteri/paydaş use case.
- **"Bos default perms for new role"** (D-2.5): Defansif. Member preset kopyala reddedildi (kopyalanmış rol confusion).
- **"Latin alfabe + Türkçe karakterler + reserved sistem isimleri"** (D-2.6): Pydantic regex. `roles.name UNIQUE` constraint. Sistem isimleri ile çakışma 422.
- **"7-layer kaldırma tek atomic commit"** (D-2.7): UI tutarlılığı için. Per-layer incremental reddedildi.
- **"Icon picker + color swatch"** (D-2.8): 8 lucide-react ikon + 6 oklch token preset. Token-based renkler tasar freeze ile uyumlu.
- **"Self-edit prevention"** (D-2.9): Backend `if target_user_id == admin_id: raise PermissionError` + frontend disabled UI. Anti-lockout pattern. Last admin lockout riski engellenir.
- **"Avatar dropdown perm-based admin link"** (D-2.11): Phase 13 D-D2 contract migrate. Plan 14-11 regression test güncellenir.
- **"Per-row scope badge"** (D-3.4): `(system)` / `(project)` chip per row. Prototype'tan deviation; D-00'da "deliberate improvement" olarak gerekçelendirilir.
- **"`permissions.scope` ENUM column"** (D-3.5): Backend metadata; frontend matrix bu kolonu okur.
- **"D-15 yan yana kalır"** (D-3.6): Phase 9 mantığı dokunulmuyor. Ek perm decorator endpoint'te eklenir. İki decorator sırayla çalışır.
- **"TIDY önce, sonra RBAC"** (D-4.6): Wave 0 = TIDY-04 (workflow-editor harness 19 fail) + TIDY-02/03/05 (backend tests + 422 fix + requires_db marker) + TIDY-01 verify. Wave 1+ = RBAC.
- **"Root-cause fix all TIDY items"** (D-4.1, D-4.2, D-4.3, D-4.4): Skip-mark ve sil alternatifleri reddedildi. Baseline temizliği RBAC için zorunlu.
- **"`@pytest.mark.requires_db` marker auto-skip"** (D-4.4): Developer iter `pytest -m 'not requires_db'`; CI `pytest`. aiosqlite ve testcontainer alternatifleri reddedildi (feature parity / docker dep).

</specifics>

<deferred>
## Deferred Ideas

### Pushed to v3.0 (broader RBAC reform / auth migration)

- **Per-project role overrides** (`user_project_permissions` veya `team_members.role_id` tablo) — kullanıcı X projesinde PM perm'leri, Y projesinde Member perm'leri ayrı. Phase 15 global model + transitive Team.leader_id ile yetiniyor.
- **Tam project-scoped permission model** — global rol kavramının terk edilmesi; her perm bir project_id ile pair. Büyük migration.
- **Refresh token pattern** (access_token 15dk + refresh_token 7g) — Phase 15 30dk passive TTL ile yetiniyor (D-1.6). v3.0 ADV-01 candidate.
- **HttpOnly cookie JWT migration** — v3.0 ADV-02. Phase 15 JWT claim genişlemesi mevcut localStorage flow'unu kullanır.
- **Permission cache (Redis)** — JWT claim yeterli (D-1.10). v3.0 ADV-04 (Persistent lockout store) ile birlikte ele alınmalı.
- **Active users daily snapshot table + cron** (Phase 14 D-X8) — v2.1 candidate, scaling cliff.
- **SSO / SAML / OIDC integration** — `auth.sso.update` audit type. PROJECT.md Out of Scope.
- **MFA / TOTP enrollment** — `auth.mfa.reset` audit type. Out of v2.0 scope.
- **Row-level security (RLS) policies in Postgres** — application-layer perm DSL yerine DB enforcement. v3.0+ candidate; büyük migration.
- **Permission usage analytics** — "hangi perm hiç kullanılmıyor / hangisi en sık 403 atıyor" metrik. v3.0+ candidate.

### Pushed to v2.1

- **Login event audit_log write** — current "active user" definition uses any audit row (Phase 14 D-X2); v2.1 explicit `auth.login_success` rows daha temiz semantic.
- **Audit row click → entity deep-link** (Phase 14 deferred).
- **Per-card filter override on /admin/stats** (Phase 14 deferred).
- **Materialized view for methodology distribution** (Phase 14 deferred).
- **Mobile <640px specific layouts for admin** (Phase 14 deferred).
- **Permission matrix bulk import/export** — admin matrix'i CSV/JSON export edip başka deployment'a aktar. Phase 15'te yok; v2.1 candidate.
- **Permission groups / hierarchical perms** — örn: `admin.users.*` wildcard. Phase 15 flat perm key list. v2.1+ candidate.
- **Role badge in PR/comment activity** — kullanıcının rolü her audit/activity satırında görünür. Phase 13/14 dokunulmadı; v2.1 candidate.

### Pushed to /gsd-verify-work pass

- Manual UAT click-through against `15-UAT-CHECKLIST.md` (Plan 15-12 artifact).
- Email delivery testing for password reset / invite flows (Phase 14 deferred; Phase 15 dokunulmuyor).
- Multi-browser RBAC E2E (Chrome + Firefox + Safari) — Plan 15-12 Playwright skip-guarded, full matrix UAT.

### Out of Scope (per PROJECT.md / REQUIREMENTS.md)

- Real-time RBAC update broadcasting (WebSocket).
- Mobile native push notifications.
- HttpOnly cookie JWT migration (v3.0 ADV-02).
- GraphQL API for admin (v3.0 ADV-03).
- AI-powered admin insights / anomaly detection (v3.0 candidate).

### Reviewed Todos (not folded)

None — gsd-sdk todo system not invoked for Phase 15 (just-created phase). If todos surface during planning, fold via `/gsd-add-todo` or note in PLAN.md.

### Cross-phase scope flags (Phase 15+ may surface)

- **Test DB seeder** — Phase 11/12/13/14 deferred. Phase 15 Plan 15-12 E2E ships with skip-guards (Phase 13 13-10 + Phase 14 14-12 pattern).
- **Audit retention** — `rbac.*` events audit_log büyümesini hızlandırır. v2.1 archival cron Phase 14 deferred zaten kapsıyor.
- **`permissions-static.ts` deprecation** — Phase 15 sonrası bu dosya silinir mi, legacy import shim olarak korunur mu? Frontend2 audit (kim import ediyor?) Plan 15-09'da netleşir.
- **`change_user_role.py` migration ripple** — Plan 15-05 `change_user_role.py` DTO migrate sırasında 1 use case + 1 endpoint + 1 router + 4 test güncellenir. Frontend `useChangeUserRole` hook + admin user-row-actions.tsx role dropdown da migrate. Cross-cutting görünür.
- **Avatar dropdown D-D2 contract migration** — Phase 13 D-D2 + Plan 14-11 regression guard güncellenmesi cross-phase contract risk; Plan 15-11 RTL test güncellenmesinde dikkat.

</deferred>

---

*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Context gathered: 2026-04-29*
