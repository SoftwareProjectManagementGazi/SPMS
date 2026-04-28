# Phase 15: RBAC Yeniden Tasarımı & Phase 14 Deferred Items Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 15-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 15-rbac-redesign-and-phase-14-deferred-cleanup
**Areas discussed:** RBAC enforcement aggressiveness, Custom roles + Guest scope, Permission scoping model, TIDY priority + cleanup approach

---

## RBAC enforcement aggressiveness

### Q1.1 — RBAC kapsam (v3.0→v2.0 reactivation)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: tablo + read-only matrix | Sadece permissions ve role_permissions tabloları, frontend matrix gerçek data, hala disabled. Backend enforcement değişmiyor. | |
| Orta: yeni admin endpointleri permission'la korur | Permission entity + matrix CRUD + require_permission decorator sadece yeni admin endpoints. Mevcut require_admin dokunulmuyor. | |
| **Tam: tüm require_admin migrate** | Mevcut 14+ require_admin migrate; JWT permissions[]; frontend RequirePermission guard. | ✓ |

**User's choice:** Tam migrate
**Notes:** Büyük scope — admin endpoint'ler + app-wide tüm callsite'lar etkilenir.

### Q1.2 — Permission key format

| Option | Description | Selected |
|--------|-------------|----------|
| **resource.action (Spring/Django stili)** | project.create, task.delete, admin.users.invite. Hiyerarşik. permissions-static.ts rename gerekli. | ✓ |
| snake_case flat | create_project, delete_project. Mevcut frontend'le bire bir. admin.* için yapay isim gerekir. | |
| resource:action (Casbin/Oso stili) | project:create, task:change_assignee. URL-unsafe. | |

**User's choice:** resource.action

### Q1.3 — JWT claim strategy

| Option | Description | Selected |
|--------|-------------|----------|
| **JWT'ye permissions[] claim eklensin** | JWT decode → key in user.permissions check; DB hit yok. ~200-400B artar. | ✓ |
| Her istekte DB'den oku (lean JWT) | Real-time perm değişimleri etkili ama her endpoint +1 DB query. | |
| Hybrid: JWT'de perm versiyon hash | Karmaşık ama hem real-time hem performance. | |

**User's choice:** JWT permissions[] claim

### Q1.4 — Migrate mapping rule

| Option | Description | Selected |
|--------|-------------|----------|
| **Endpoint-bazlı spesifik permissions** | admin.users.invite, admin.audit.read, admin.stats.read, etc. ~26-30 toplam perm. | ✓ |
| Tek umbrella permission admin.access | Tüm require_admin → admin.access. Granular yetki yok. | |
| 2-tier admin.read + admin.write | GET = admin.read, mutation = admin.write. Orta granularite. | |

**User's choice:** Endpoint-bazlı spesifik

### Q1.5 — Admin tier

| Option | Description | Selected |
|--------|-------------|----------|
| **Admin = otomatik tüm permissions (super-role)** | _has_permission önce _is_admin check, True ise return. Migration row eklenmez. | ✓ |
| Admin role_permissions tablosunda explicit row | 26 row Admin için INSERT. Yeni perm Admin'e migrate gerekir. | |
| Hybrid: Admin super-role + matrix'te explicit görünüm | Backend super-role, frontend matrix Admin column readonly granted. | |

**User's choice:** Admin super-role

### Q1.6 — Token revoke

| Option | Description | Selected |
|--------|-------------|----------|
| **Hiçbir şey — 30dk TTL doluncaya kadar** | Mevcut Phase 2 JWT TTL 30dk. Real-time revoke yok. Toast user'a bilgi. | ✓ |
| Force re-login (session_version JWT claim) | Admin/perm değişikliği session invalidate. +DB lookup her istek. | |
| Refresh token pattern | access_token 15dk + refresh 7g. Büyük refactor. | |

**User's choice:** Passive 30dk TTL

### Q1.7 — Frontend guard UX

| Option | Description | Selected |
|--------|-------------|----------|
| **UI'ı gizle (hide)** | Component render edilmez. Server-side defansif backstop. | ✓ |
| Disabled + tooltip | Discoverability bonus ama 'yetkin yok' tepkisi. | |
| 403 modal/page | Buton tıklayınca modal. Önce render sonra check. | |

**User's choice:** Hide UI

### Q1.8 — Migration bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| **Migration auto-seeds 14 CRUD + 12 admin.* + role_permissions matrix** | 26 perm INSERT + matrix bootstrap (Admin super-role 0 row, PM ~13, Member ~3, Guest 0). Idempotent. | ✓ |
| Migration tablolar, seed runtime'da | Backend startup'ta seed_permissions(). Dev environment seed dependency. | |
| Migration tablolar + Admin row, diğerleri admin panelde elle | Deployment riski (PM/Member yetki yok başlangıçta). | |

**User's choice:** Auto-seed in migration

### Q1.9 — Audit RBAC events

| Option | Description | Selected |
|--------|-------------|----------|
| **Yeni rbac.* audit events** | permission_granted, permission_revoked, role_created, role_updated, role_deleted. Phase 14 D-D3 union genişler. | ✓ |
| Sadece role assignment | Phase 14 user.role_changed mevcut. Yeni RBAC olayları audit edilmez. | |
| Hiçbiri | Mevcut user.role_changed bile optional. | |

**User's choice:** rbac.* events

### Q1.10 — Permission cache

| Option | Description | Selected |
|--------|-------------|----------|
| **Hiç cache yok — JWT zaten in-memory** | JWT claim'inde perms[] in-memory list. DB hit yok. | ✓ |
| Backend in-memory module-level dict (TTL 5dk) | role_perms_cache marginal. | |
| Redis | Yeni dependency. v3.0 ADV-04. | |

**User's choice:** No cache

### Q1.11 — 403 error format

| Option | Description | Selected |
|--------|-------------|----------|
| **Phase 9 error_code: PERMISSION_DENIED + perm key** | detail={error_code, missing_permission, message}. Phase 9 D-09 taxonomy uzantısı. | ✓ |
| Generic 403 'Forbidden' | Mevcut require_admin pattern. Phase 14 audit Detay column'a yansımaz. | |
| 401 redirect login | Mantıksız (kullanıcı zaten login). | |

**User's choice:** PERMISSION_DENIED taxonomy

### Q1.12 — Matrix UX

| Option | Description | Selected |
|--------|-------------|----------|
| **Auto-save per cell + Toast** | Toggle anlık PATCH. Optimistic. Phase 14 D-W2 pattern. | ✓ |
| Bulk edit + 'Kaydet' butonu | Workflow editor pattern (Phase 12 D-09 dirty-save). | |
| Confirm modal her toggle'da | 56 cell × 1 dialog = irritant. | |

**User's choice:** Auto-save per cell

### Q1.13 — Permission scope (own vs all)

| Option | Description | Selected |
|--------|-------------|----------|
| **Membership + perm 2-tier check** | Perm sade. Endpoint perm + ensure_membership. Phase 9 D-15 pattern. | ✓ |
| Perm key içinde scope: task.delete.own vs task.delete.any | 14 perm → ~25 perm. | |
| Project context-aware perm | Per-request DB lookup. JWT claim faydası kaybolur. | |

**User's choice:** 2-tier check

### Q1.14 — Membership-only endpoint gate

| Option | Description | Selected |
|--------|-------------|----------|
| Membership-only: sadece admin endpoint perm DSL'e migrate | Mutation endpoint'ler dokunulmuyor. Matrix vitrin. | |
| **Hibrit: admin + tüm mutation endpoint perm DSL** | Matrix gerçek enforce. Admin matrix'i kapatırsa engellenir. | ✓ |
| Full perm: GET'ler dahil | Ekstra perm row'ları (project.read, task.read). | |

**User's choice:** Hibrit (initial response had clarification request "hibrit ile member ship only arasındaki fark nedir?" — clarification provided in plain text, then user re-confirmed Hibrit)

### Q1.15 — Test strategy

| Option | Description | Selected |
|--------|-------------|----------|
| **permitted_client(perms=[...]) fixture extend** | Phase 14 fixture fork. Arbitrary perm'lerle JWT. Hızlı, izole. | ✓ |
| DB seed-based testing | seed_test_role + per-test seed. Yavaş. | |
| Hybrid (in-memory + DB-seed integration) | Birim claim-override + 5-10 smoke DB-seed. | |

**User's choice:** permitted_client fixture

### Q1.16 — Bulk-action multi-perm

| Option | Description | Selected |
|--------|-------------|----------|
| **Use case içinde dynamic perm check** | Endpoint umbrella admin.users.bulk; use case action'a göre dynamic check. | ✓ |
| FastAPI Depends f-string ile dynamic | Body'ye erişim teknik olarak imkansız. | |
| Endpoint split: 2 ayrı endpoint | Frontend bulk-action dispatcher refactor. | |

**User's choice:** Dynamic in use case

### Q1.17 — change_user_role.py migrate

| Option | Description | Selected |
|--------|-------------|----------|
| **AdminRole literal → dinamik role_id** | DTO target_role: int. Audit role_name. API contract değişir. | ✓ |
| Backwards compat: literal kalır + role_id de kabul | DTO union. Karmaşık. | |
| Yeni use case yaz: assign_user_role.py | Dead code. | |

**User's choice:** Migrate to role_id

---

## Custom roles + Guest scope

### Q2.1 — Custom rol CRUD

| Option | Description | Selected |
|--------|-------------|----------|
| **Evet, full CRUD: oluştur / düzenle / sil + matrix'e column** | Modal + matrix column auto-add + ConfirmDialog. 7-layer kalkar. | ✓ |
| Kısıtlı: 4 sabit rol + Guest aktive, custom CRUD yok | 'Yeni rol' card hala disabled. Sadece matrix editlenebilir. | |
| Sabit 3 rol kalır, Guest da defer | Sadece Admin/PM/Member. | |

**User's choice:** Full CRUD

### Q2.2 — Custom rol silindiğinde

| Option | Description | Selected |
|--------|-------------|----------|
| **Default fallback Member rolüne ata** | Transaction ile users migrate edilir, sonra rol silinir. ConfirmDialog warning. | ✓ |
| Block: kullanıcı atanmışsa sil engelle | 422 'önce taşıyın'. Defansif ama UX engelli. | |
| Soft-delete | Role inactive yapılır. Veri tutarlılığı şüpheli. | |

**User's choice:** Member fallback

### Q2.3 — Sistem rolleri korunması

| Option | Description | Selected |
|--------|-------------|----------|
| **Backend is_system_role boolean column + check** | PATCH/DELETE 422 SYSTEM_ROLE_PROTECTED. Frontend Sistem Badge + disabled. | ✓ |
| Hardcoded role name guard backend'de | İsim string check. Localize edilirse kırılır. | |
| Sadece frontend disable, backend açık | API tampering ile bypassable. | |

**User's choice:** is_system_role column

### Q2.4 — Guest rolü

| Option | Description | Selected |
|--------|-------------|----------|
| **Read-only sistem rolü: login + GET'ler + işlem yapamaz** | permissions[] = []. Müşteri/paydaş use case. | ✓ |
| Aktif edilmiş ama boş rol — admin matrix'ten yetki ekleyebilir | Custom role'le aynı, sistem rolü anlamı aşınır. | |
| Hala defer: v3.0 placeholder | Custom CRUD açıyoruz, defer tutarsız. | |

**User's choice:** Read-only

### Q2.5 — Yeni custom rol default perms

| Option | Description | Selected |
|--------|-------------|----------|
| **Boş (denied everything)** | Admin tek tek toggle. Defansif. | ✓ |
| Member preset'i kopyala | 'Kopyalanmış rol' confusion. | |
| Modal'da preset seçim: Boş / Member / PM kopyası | Esnek ama UI complexity. | |

**User's choice:** Empty default

### Q2.6 — Role name validation

| Option | Description | Selected |
|--------|-------------|----------|
| **Unique + 1-50 karakter + Latin alfabe + reserved sistem isimleri** | regex /^[A-Za-zÇĞ...0-9 _-]+$/. Sistem isimleri çakışma 422. | ✓ |
| Sadece Unique check | Whitespace, çok uzun, emoji geçer. | |
| Reserved name list yok | Hiç kontrol yok. | |

**User's choice:** Full validation

### Q2.7 — 7-layer placeholder defense kaldırma

| Option | Description | Selected |
|--------|-------------|----------|
| **Tek atomic commit'te tüm 7 layer kaldır** | Test'ler eş zamanlı update. Defansif planda. | ✓ |
| Per-layer incremental: önce backend ready, sonra layer 1, 2.. | 7 ayrı commit, ara durumlarda UI tutarsız. | |
| Replace approach: yeni page yaz, eski deprecate | Redundant fileler. | |

**User's choice:** Atomic commit

### Q2.8 — Role icon/color

| Option | Description | Selected |
|--------|-------------|----------|
| **Form'da admin seçer (icon picker 8 ikon + 6 renk preset)** | Modal'da picker + swatch. Token-based. | ✓ |
| Otomatik: User ikonu + --fg-muted | Visual differentiation yok. | |
| Hiç ikon yok — sadece initial badge | Prototype tasarımdan sapma. | |

**User's choice:** Icon picker + color swatch

### Q2.9 — Self-edit prevention

| Option | Description | Selected |
|--------|-------------|----------|
| **Defansif: kendi user_id'sini değiştirme engellenir** | Backend PermissionError + frontend disabled. Anti-lockout. | ✓ |
| Kısıtlı: kendi rolünü Admin yapamaz, başkasını yapabilir | 'Son Admin' problemi. | |
| Hiçbir engel yok | Lockout riski. | |

**User's choice:** Defensive prevention

### Q2.10 — Avatar dropdown role display

| Option | Description | Selected |
|--------|-------------|----------|
| **Mevcut gösterim korunur — dynamic role.name** | Phase 13 D-D2 dropdown text dokunulmuyor. | ✓ |
| Permissions count badge ekle | UI bloat. | |
| (3rd option about Admin link gate became Q2.11) | | |

**User's choice:** Dynamic role.name preserved

### Q2.11 — Admin Paneli link gate

| Option | Description | Selected |
|--------|-------------|----------|
| **Perm-based: _has_permission(user, 'admin.access')** | Phase 13 D-D2 + Plan 14-11 regression test güncellenir. Custom 'SuperUser' admin link görür. | ✓ |
| Hayır, sadece sistem 'Admin' rolü görsün | Custom rol Admin perm'leri olsa bile link görmez. | |
| is_system_role + admin = sistem Admin görsün | Custom Admin yaratılamaz. | |

**User's choice:** Perm-based admin.access

---

## Permission scoping model

### Q3.1 — Permissions global vs project-bazlı

| Option | Description | Selected |
|--------|-------------|----------|
| **Global rol + Team.leader_id ile project-PM (mevcut model korunur)** | role_id global; Team.leader_id transitive PM. Phase 15 dokunulmuyor. | ✓ |
| Tam project-scoped: TeamMember.role_id eklenir | Phase 9 D-13/D-15/D-17 geri al. Büyük refactor. | |
| Hybrid v2: system_role + per-project permission overrides table | user_project_permissions tablo. UI 14×4 + N proje. | |

**User's choice:** Mevcut model korunur

### Q3.2 — PM 2-tier check

| Option | Description | Selected |
|--------|-------------|----------|
| **Hayır: perm + project-leadership 2-tier check** | require_permission + require_project_transition_authority. Phase 9 D-15 tutarlı. | ✓ |
| Evet: Sadece perm yeterli | Phase 9 D-15 mantığını kırar. | |
| Project membership check yeterli (lider olmak şart değil) | Phase 9 D-15 sapma. | |

**User's choice:** 2-tier check

### Q3.3 — Member 2-tier check

| Option | Description | Selected |
|--------|-------------|----------|
| **perm + ensure_project_membership 2-tier** | get_project_member yan yana. Phase 9 mantığı korunur. | ✓ |
| Sadece perm yeterli | Güvenlik açığı. | |
| Membership implicit (404 dönüş) | Confusing UX. | |

**User's choice:** 2-tier check

### Q3.4 — Matrix scope UI

| Option | Description | Selected |
|--------|-------------|----------|
| Sade kalır, AlertBanner ile açıklama | Backend 2-tier check zaten doğru davranış. | |
| **Per-row scope badge: '(system)' / '(project)'** | Her perm'de chip badge. Transparency. D-00 deviation justified. | ✓ |
| Matrix'i 2 ayrı grid: 'Sistem' + 'Proje' yetkileri | Prototype'tan büyük sapma. | |

**User's choice:** Per-row scope badge (after extensive clarification on Team.leader_id model and team-project assignment semantics — user provided correction; codebase verified; question asked 3 times)
**Notes:** User raised significant design questions about Team/TeamProjects/TeamMember model coherence (PM has two meanings: system role + Team.leader_id-derived). Discussion captured in clarifying explanation; recommendation: don't change model in Phase 15 (v3.0 candidate for full refactor). 2-tier check architecture preserves existing Phase 9 D-15 logic.

### Q3.5 — Permission scope metadata

| Option | Description | Selected |
|--------|-------------|----------|
| **permissions.scope ENUM('system', 'project') backend kolon** | Migration 007 her perm'e scope seed. Frontend matrix bu kolondan okur. | ✓ |
| Hardcoded mapping in permissions-static.ts | Frontend-only. Backend bilmiyor. | |
| Perm key prefix konvansiyonu: admin.* system, diğerleri project | Convention drift riski. | |

**User's choice:** Backend ENUM column

### Q3.6 — Phase 9 D-15 yan yana mı?

| Option | Description | Selected |
|--------|-------------|----------|
| **Yan yana kalır, ek perm decorator endpoint'te** | İki decorator sırayla. D-15 dokunulmuyor. | ✓ |
| D-15 içine perm check eklenir | Phase 9 use case genişler. | |
| D-15 deprecate, yeni require_project_authority(perm) yaz | Büyük refactor. | |

**User's choice:** Yan yana

---

## TIDY priority + cleanup approach

### Q4.1 — TIDY-04 Frontend workflow-editor 19 fail

| Option | Description | Selected |
|--------|-------------|----------|
| **Root-cause fix: ReactFlowProvider wrap + TS hataları düzelt** | vitest.setup.ts wrapper. 4 dosya TS error fix. ~5-8 saat. | ✓ |
| Skip-mark: it.skip + TODO | Workflow-editor zayıflık devam, regression detect edemeyiz. | |
| Kısmi fix: 4-5 kritik test fix, rest skip | Yarım iş. | |

**User's choice:** Root-cause fix

### Q4.2 — TIDY-02 Backend pytest unit 11 fail

| Option | Description | Selected |
|--------|-------------|----------|
| **Root-cause fix: 5 dosyayı mevcut signature'a hizala** | register_user / phase_gate / manage_phase_reports / task_repo_soft_delete / deps_package_structure. ~3-5 saat. | ✓ |
| pytest.mark.skip + TODO | Baseline temiz olmaz. | |
| Sil: drift'li testler outdated, kaldır | Coverage küçülür, regress detect edemiyoruz. | |

**User's choice:** Root-cause fix

### Q4.3 — TIDY-03 Backend integration 3 fail

| Option | Description | Selected |
|--------|-------------|----------|
| **Fix: PATCH handler'a try/except ValidationError → 422** | 1 dosya, ~10 satır. | ✓ |
| Skip 3 test'i | Workflow validation davranışı doğrulanmaz. | |

**User's choice:** Fix

### Q4.4 — TIDY-05 DB-required integration tests skip-error

| Option | Description | Selected |
|--------|-------------|----------|
| **@pytest.mark.requires_db marker + auto-skip** | conftest hook DB connect deneyip ba'sızsa skip. ~30dk. | ✓ |
| Test DB fixture: aiosqlite in-memory | Feature parity sorunu (JSONB, advisory locks SQLite'da yok). | |
| Testcontainer: docker-py + ephemeral Postgres | docker dep, slow startup. | |
| Status quo: skip-error olarak kalır | Phase 11/12/13/14 boyunca devam eden gürültü. | |

**User's choice:** requires_db marker

### Q4.5 — TIDY-01 StatCard tone="warning"

| Option | Description | Selected |
|--------|-------------|----------|
| **Verify edip kapat** | npm run build smoke; Plan 14-18 Cluster F'te düzelmişse 'closed' işaretle. | ✓ |
| Defansif: StatCard tone enum'una 'warning' ekle (proactive) | Muhtemelen zaten enum'da var (admin kartları kullanıyor). | |

**User's choice:** Verify-and-close

### Q4.6 — TIDY ve RBAC sıralama

| Option | Description | Selected |
|--------|-------------|----------|
| **TIDY önce (Wave 0), sonra RBAC (Wave 1+)** | Plan 15-01..15-03 TIDY, Plan 15-04..15-12 RBAC. Temiz baseline. | ✓ |
| RBAC önce, TIDY sonda | Kırık test baseline ile yaşamak. | |
| Paralel: aynı wave'de iki bacak yan yana | Vertical-slice kırılır. | |

**User's choice:** TIDY önce

---

## Claude's Discretion

Capacity decisions left to planner during /gsd-plan-phase 15:

- Migration 007 PostgreSQL ENUM vs CHECK constraint exact pattern
- `permissions-static.ts` migration script (TypeScript → Python translation vs hardcoded SQL)
- 6 token color picker exact selection (priority/status/fg-muted/info/warning/status-todo önerildi)
- `<RequirePermission/>` guard implementation: HOC vs render-prop vs hook + early return (recommend hook)
- `permitted_client` fixture location: top-level conftest vs integration conftest
- Matrix per-row scope badge exact styling (Badge tone='neutral' inline önerildi)
- JWT permissions[] claim sorting (alphabetical önerildi)
- Idempotency-Key for matrix toggle PATCH (no önerildi)
- `role_permissions` row delete vs soft-flag on revoke (hard-delete önerildi)

## Deferred Ideas

### Pushed to v3.0 (broader RBAC reform)

- Per-project role overrides (`user_project_permissions` veya `team_members.role_id` tablo)
- Tam project-scoped permission model
- Refresh token pattern (access + refresh)
- HttpOnly cookie JWT migration (v3.0 ADV-02)
- Permission cache (Redis)
- SSO / SAML / OIDC integration
- MFA / TOTP enrollment
- Row-level security (RLS) policies in Postgres
- Permission usage analytics

### Pushed to v2.1

- Login event audit_log write
- Audit row click → entity deep-link
- Per-card filter override on /admin/stats
- Materialized view for methodology distribution
- Mobile <640px specific layouts for admin
- Permission matrix bulk import/export
- Permission groups / hierarchical perms (admin.users.*)
- Role badge in PR/comment activity

### Pushed to /gsd-verify-work pass

- Manual UAT against 15-UAT-CHECKLIST.md (Plan 15-12 artifact)
- Email delivery testing for password reset / invite flows
- Multi-browser RBAC E2E (Chrome + Firefox + Safari)

### Discussion-time clarifications captured

- **Team / TeamProjects / TeamMember model coherence question** (during Q3.4) — User raised legitimate design question about whether the existing Team-as-org-with-multi-project-assignment model (TeamProjects junction) makes sense, or if it should be replaced by per-user project assignment (`project_members` direct + Team as org-only). Codebase verified: BOTH models coexist (`project_members` for direct membership + `team_projects + team.leader_id` for transitive PM-ship). Phase 15 preserves both. v3.0 candidate: full refactor to single membership model.
- **PM has two meanings** (during Q3.4 clarification) — (a) System role 'Project Manager' (matrix permissions globally) + (b) Team.leader_id of a team assigned to a project (transitive PM-ship). These can mismatch. Phase 15 doesn't resolve; backend 2-tier check enforces correct behavior despite the dual semantic.
