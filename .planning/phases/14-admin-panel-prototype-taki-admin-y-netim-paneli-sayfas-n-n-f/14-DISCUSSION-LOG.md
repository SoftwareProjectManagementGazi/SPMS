# Phase 14: Admin Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
**Areas discussed:** Backend kapsamı + Stats veri kaynağı, CRUD aksiyonları (çalışan vs görsel), Routing yapısı (URL design), Audit Log kapsamı + risk classifier

---

## Gray Area Selection

User selected ALL 4 gray areas to discuss (multiSelect).

| Area | Description | Selected |
|------|-------------|----------|
| Backend kapsamı + Stats veri kaynağı | ProjectJoinRequest entity, Custom Roles, Permission Matrix, Stats endpoints | ✓ |
| CRUD aksiyonları (çalışan vs görsel) | ~15 actions across 8 tabs — functional vs prototype-faithful visual | ✓ |
| Routing yapısı (URL design) | `?tab=` query param vs sub-routes vs state-only | ✓ |
| Audit Log kapsamı + risk classifier | New audit action types + risk severity model | ✓ |

---

## Backend Scope (Area 1)

### Sub-question 1: Backend kapsamı

| Option | Description | Selected |
|--------|-------------|----------|
| Tüm yeni entity'ler (en geniş) | ProjectJoinRequest + Role + Permission + RolePermission entities Clean Architecture vertical slice ile + /admin/stats + cron-friendly trend tablosu. ~15 plan, 4 yeni domain entity, 6+ yeni endpoint, alembic migration 006. | ✓ |
| Pragmatik orta yol (ÖNERİLEN) | ProjectJoinRequest TAM, Roles/Permissions placeholder, /admin/stats yazılır. ~10 plan, 1 yeni entity. | |
| Minimum (frontend-heavy) | Yeni entity yok; tüm tab'ler mevcut endpoint'leri kullanır + mock. ~6 plan. | |
| Discuss daha fazla | Detaylı konuşalım. | |

**User's choice:** "Tüm yeni entity'ler (en geniş)" — initially.
**Notes:** User chose the maximum-scope option, signaling commitment to full functionality.

### Sub-question 2: Role migration strategy (after max scope chosen)

| Option | Description | Selected |
|--------|-------------|----------|
| Hibrit — enum + Role entity (ÖNERİLEN) | 3 sistem rolü Role tablosuna seed + users.role_id FK + users.role str backwards compat. require_admin değişmez. Migration risk: düşük. | ✓ (initial) |
| Tam replace — sadece Role entity | users.role enum kaldırılır; tüm RBAC permission-based'e refactor. Migration risk: yüksek (breaking). | |
| Discuss daha fazla | | |

**User's choice:** "Hibrit — enum + Role entity (ÖNERİLEN)" — initially, then REVISED in next sub-question.

### Sub-question 3: Permission Matrix enforcement (REVISED THE ROLE DECISION)

| Option | Description | Selected |
|--------|-------------|----------|
| Tam enforcement | Tüm `require_admin`/`require_project_member` permission-based'e refactor. 56 satir matrix gerçekten endpoint authorization'ı sürer. Risk: yüksek. | |
| Override-on-default (ÖNERİLEN) | Static defaults + DB-stored overrides. AND check on endpoint dependency. Sistem rolleri default override edilemez. | |
| Read-only matrix | Statik map gösterilir, toggles disabled. "Tamamen işlevsel" sapma. | |
| Discuss daha fazla | | |

**User's choice:** Free-text response — "rbac alt yapısını deffer edelim o zaman, şuan place holder kalsın, önceki role entity kararını da full entegrasyon olucak şekilde deffer edelim"

**Notes:**
- User REVERSED both the role-entity and permission-matrix decisions.
- Both Role entity AND Permission Matrix DEFERRED to v3.0 ("full integration").
- Permission Matrix becomes visual placeholder.
- Existing `users.role` enum preserved unchanged.
- This significantly reduced backend scope vs. the "tüm yeni entity'ler" original choice.

**Final Area 1 lock:**
- ✅ ProjectJoinRequest entity = full Clean Architecture (Onayla/Reddet real API)
- ✅ /admin/stats endpoint = composite payload
- ✅ User admin CRUD endpoints = full implementation on existing role enum
- ❌ Role entity DEFERRED to v3.0
- ❌ Permission entity / RolePermission DEFERRED
- ❌ Permission Matrix toggle enforcement → visual placeholder ("v3.0" badge)
- ❌ "Yeni rol oluştur" → disabled placeholder
- ⚠️ Active users trend data source = on-the-fly audit_log compute (v2.1 candidate: daily snapshot table)

---

## CRUD Actions (Area 2)

### Sub-question 1: CRUD strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Tümü çalışan (max scope) | Her aksiyon real backend. ~14 plan, 4-5 yeni admin endpoint. | ✓ |
| Pragmatik (ÖNERİLEN) | Yüksek değer çalışan, orta değer redirect, düşük değer placeholder. ~10 plan. | |
| Minimum aksiyonlu (görsel-heavy) | Sadece Onayla/Reddet çalışan. ~6 plan. | |
| Discuss — satır satır geçelim | Tek tek inceleyelim. | |

**User's choice:** "Tümü çalışan (max scope)"
**Notes:** Consistent with original "tamamen işlevsel" goal; commitment despite scope size.

### Sub-question 2: Add user flow

| Option | Description | Selected |
|--------|-------------|----------|
| Email invite (ÖNERİLEN) | Admin form → backend creates user + invite token + Phase 5 email. User clicks link → sets password. | ✓ |
| Admin set password | Admin enters password directly; user gets active immediately. Demo basit, security zayıf. | |
| Discuss daha fazla | | |

**User's choice:** "Email invite (ÖNERİLEN)"
**Notes:** Reuses Phase 2 PasswordResetToken + Phase 5 email infrastructure.

### Sub-question 3: Reset password (admin)

| Option | Description | Selected |
|--------|-------------|----------|
| Email reset link (ÖNERİLEN) | Phase 5 password-reset email tetiklenir. Phase 2 PasswordResetToken altyapısı reused. | ✓ |
| Admin set new password | Admin yeni password girer; user'a söylemek zorunda. | |
| Discuss daha fazla | | |

**User's choice:** "Email reset link (ÖNERİLEN)"
**Notes:** Tutarlı, secure, infrastructure already exists.

### Sub-question 4: Bulk invite CSV format

| Option | Description | Selected |
|--------|-------------|----------|
| email,role (ÖNERİLEN) | 2 sütun. | |
| email,name,role | 3 sütun, name ile invite-email personalization. | ✓ |
| JSON upload | Programatik integration için JSON. | |
| Discuss daha fazla | | |

**User's choice:** "email,name,role"
**Notes:** Name column adds invite-email personalization without significantly raising CSV-prep burden.

### Sub-question 5: Project transfer ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Team leader değiştir (ÖNERİLEN) | Mevcut PATCH /teams/{id}/leader_id reused. | |
| Project level lead alanı ekle | Project entity'sine lead_id field eklenir. | |
| Aksiyon tümüyle skip | Settings > Üyeler'de zaten yönetiliyor. | |
| Discuss daha fazla | | |

**User's choice:** Free-text response — "sahiplik değişimine ihtiyaç yok, yönetim işleri o projedeki pmlere ait, roller proje based olucak, bir projede pm olan öbüründe üye olabilir. Sadece adminlik sistem geneli olucak"

**Notes:**
- Major architectural insight: Admin = system-wide global; PM/Member = project-scoped via Team.leader_id.
- Roles tab card descriptions must reflect this reality (replaces prototype's misleading implication).
- "Transfer ownership" action removed from MoreH menu entirely.

---

## Routing (Area 3)

### Sub-question 1: URL design

| Option | Description | Selected |
|--------|-------------|----------|
| ?tab= query param (ÖNERİLEN) | Tek page + query. Phase 11/13 tutarlı. | |
| Sub-route'lar | /admin/users, /admin/roles, vs. Native browser back, lazy-load doğal. | |
| State-only | URL bookmarklanmaz. | |
| Discuss daha fazla | | |

**User's choice:** Free-text response — "sub route konusunda ne düşünüyorsun? query ile pros cons? hangisi daha profesyonel ve best practice? jira nasıl yapıyor?"
**Notes:** User asked for technical analysis, not direct selection.

### Sub-question 2: After analysis (sub-route'lar pros/cons + Jira/GitHub/Linear standardı)

**Discussion content:** Detailed pros/cons analysis presented. Industry consensus: distinct functional areas → sub-routes; filter/modal/ephemeral state → query params. Jira, GitHub, Linear, Atlassian Admin Console all use sub-routes. Recommendation: sub-routes for admin (tab'lar bağımsız + admin tool bookmark/share UX kritik + Server Component upgrade path Audit/Stats için değerli).

**User's choice:** Free-text — "sub-route yapalım, zaten componentlere ayırıcağız, 8 9 sayfa yapmak çok yormaz"
**Notes:**
- Sub-routes locked.
- 8 page.tsx + 1 layout.tsx accepted.
- CONTEXT.md gerekçesi cross-phase tutarsızlık için ayrıca not düşülür.

---

## Audit Log + Risk (Area 4)

### Sub-question 1: Audit instrumentation scope

| Option | Description | Selected |
|--------|-------------|----------|
| User lifecycle + admin actions (ÖNERİLEN) | Phase 14 yeni endpoint'leri audit yazar. ~7 yeni action type. | |
| Mevcut + minimal yeni | Sadece Phase 14'ün yeni endpoint'leri yazar. ~3 yeni action. | |
| Tüm prototype actions (mock dahil) | SSO/MFA seed'lenmiş demo verisi. Önerilmez. | |
| Discuss daha fazla | | |

**User's choice:** Free-text response — "audit logun şuanki durumundan memnun değilim, son aktiviteler tabından da memnun değilim (sanırım aynı altyapı), yusuf oluşturdu yazıyor, yusuf neyi oluşturdu ne yaptı? açıklama olarak ne yazdı bunların hiçbiri yok, jira gibi detaylı bir loglama istiyorum"

**Notes:**
- User raised a CRITICAL gap: existing audit/activity rendering lacks detail (entity titles, comment bodies, field-change context).
- This forced a re-scoping to include cross-cutting backend `extra_metadata` enrichment + frontend audit-event-mapper extension.
- Affects /admin/audit + ProjectDetail Activity tab + Profile Activity tab + Dashboard ActivityFeed (single shared improvement).

### Sub-question 2: Risk classifier

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend hardcoded map (ÖNERİLEN) | lib/admin/audit-risk.ts action prefix → risk. | |
| Backend-computed | AuditLog domain entity'ye risk field eklenir. | |
| DB-stored config table | AuditRiskRule tablosu. | |
| Discuss daha fazla | | |

**User's choice:** Free-text response — "risk seviyesinden kasıt nedir? ne için buna ihtiyacımız var?"
**Notes:** User questioned the value before selecting. Honest answer given: enterprise security convention without functional value in this thesis-project scope.

### Sub-question 3: After value-question dialogue (risk explained + audit detail proposed)

| Option | Description | Selected |
|--------|-------------|----------|
| (Audit) Evet, tüm cross-cutting iyileştirme (ÖNERİLEN) | Backend enrichment + frontend extension + activity-row update. ~3-4 plan ek. | ✓ |
| (Audit) Sadece /admin/audit için scope'la | Phase 13 surfaces dokunulmaz. | |
| (Audit) Sadece frontend formatter | Backend dokunulmaz; placeholder text only. | |
| (Audit) Discuss daha fazla | | |
| (Risk) SKIP (ÖNERİLEN) | Risk sütunu çıkarılır; "Detay" sütunu (extra_metadata) yerine. | ✓ |
| (Risk) Frontend hardcoded map (prototype-faithful) | Decoratif. | |
| (Risk) Discuss daha fazla | | |

**User's choices:**
- Audit detail: "Evet, tüm cross-cutting iyileştirme (ÖNERİLEN)"
- Risk classifier: "SKIP (ÖNERİLEN)"

**Notes:**
- Cross-cutting Jira-style audit detail unlocked.
- Risk column removed; replaced with `Detay` column (richer payload).
- Affects multiple Phase 13 surfaces — single shared backend + frontend improvement.

---

## Claude's Discretion

User accepted Claude's recommendations on the following without specific direction:

- "Tümünü gör" pending requests → modal with full pagination (recommended).
- Stats chart libraries → recharts (Phase 13 reused).
- "Rapor al" PDF content → 1-page admin summary (recommended).
- Tabs primitive Link wrapper → planner picks.
- Audit Filtre modal exact UX → anchored popover (default).
- Bulk invite progress feedback → spinner + summary modal.
- Active users trend tooltip → daily count + date.
- Email invite link expiry → 7 days.
- /admin/users table density → comfortable, no toggle.
- Audit row click behavior → no-op (refLabel handles deep-links).
- Stats refresh policy → refetchOnWindowFocus + 60s staleTime.

## Deferred Ideas

(Captured in CONTEXT.md `<deferred>` section — see file for full list.)

Highlights:
- v3.0: Role/Permission/RolePermission entity overhaul, RBAC enforcement, custom roles, SSO/MFA, audit retention.
- v2.1: Active users daily snapshot cron, materialized methodology view, mobile <640px admin layouts, audit row click → entity deep-link.
- /gsd-verify-work: Manual UAT click-through artifact, email delivery testing.
- Out of scope per PROJECT.md: WebSocket admin streaming, mobile push, AI insights.
