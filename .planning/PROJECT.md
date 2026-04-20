# SPMS — Software Project Management Software

## What This Is

SPMS, yazilim gelistirme ekiplerinin proje sureclerini yonetmek icin tasarlanmis web tabanli bir proje yonetim platformudur. Kullanicilar proje ve gorev olusturup yonetebilir; yoneticiler ekip atama, performans izleme ve raporlama yapabilir. Sistem Scrum, Kanban, Waterfall ve Iterative gibi farkli surec modellerini destekler. v1.0 ile tam ozellikli bir MVP teslim edilmistir.

**Hedef kitle:** Yazilim gelistirme ekipleri (yonetici, proje yoneticisi, ekip uyesi rolleriyle).

## Core Value

Ekiplerin farkli proje yonetim metodolojilerine uygun sekilde projelerini ve gorevlerini tek platformda takip edebilmesi.

## Current State

**Shipped:** v1.0 MVP (2026-04-20)
**LOC:** ~52,600 (12,200 Python + 40,400 TypeScript)
**Tech Stack:** FastAPI (Python) + Next.js 14 (TypeScript) + PostgreSQL + Docker
**Architecture:** Clean Architecture (Domain > Application > Infrastructure > API)

v1.0 delivers: authentication & team management, full task/project module with dependencies and recurrence, Kanban/Calendar/Gantt/List views, in-app + email notifications, reporting with PDF/Excel export, and Scrum/Kanban/Waterfall/Iterative process model support with external integrations.

## Requirements

### Validated

- SPMS-01.1: Kullanici kayit, giris ve cikis islemleri (JWT tabanli) — v0
- SPMS-01.2: Rol bazli erisim yapisi (Admin, Proje Yoneticisi, Ekip Uyesi) — v0
- SPMS-01.3: JWT kimlik dogrulama, bcrypt parola sifreleme — v0
- SPMS-01.5: Projelere erisim izinleri yonetimi — v0
- SPMS-01.6: Moduler, olceklenebilir yetkilendirme yapisi — v0
- SPMS-02.1: Proje olusturma, duzenleme, arsivleme (temel CRUD) — v0
- SPMS-02.3: Gorev olusturma, duzenleme ve silme (temel CRUD) — v0
- SPMS-02.4: Alt gorevler, oncelik ve durum guncellemeleri — v0
- SPMS-UI-01: Dashboard ekrani — v0
- SPMS-UI-05: Moduler UI bilesenleri (shadcn/ui) — v0
- SPMS-UI-06: Responsive yapi — v0
- SPMS-API-01..03, API-05: REST API, JSON, auth, Swagger — v0
- SPMS-DB-01..04: SQLAlchemy ORM, iliskiler, indeksleme, moduler DB — v0
- SPMS-DATA-1,5,6,8: Tablo yapilari, coklu proje, sema genisletilebilirlik — v0
- SPMS-ENV-01..04: Tarayici, Docker, ortam bagimsizligi, performans — v0
- SPMS-SEC-01..04, SEC-09: JWT, bcrypt, HTTPS, RBAC, SQL injection — v0
- SPMS-QLT-1..3, QLT-5, QLT-7: Kalite, toparlanma, kullanilabilirlik, modulerlik, test — v0
- ARCH-01..10: Mimari temizlik (DTO migration, RBAC fix, mock data removal, round-trip elimination) — v1.0
- DATA-01..05: Versioning, audit trail, recurring task schema, soft delete, indexes — v1.0
- AUTH-01..04: Profil duzenleme, ekip yonetimi, parola sifirlama, hesap kilitleme — v1.0
- SEC-01..04: Rate limiting, HTTP hata kodlari, CORS, KVKK/GDPR — v1.0
- SAFE-01..03: Onay diyaloglari, JWT session expiry, log altyapisi — v1.0
- TASK-01..11: Proje uye atama, bagimliliklar, tekrarlayan gorevler, yorumlar, dosyalar, sprintler, sayfalama — v1.0
- VIEW-01..04: Kanban DnD, takvim, Gantt, moduler gorunumler — v1.0
- NOTIF-01..06: Bildirimler, e-posta, tercihler, izleme — v1.0
- REPT-01..05: Grafiksel raporlar, filtreleme, PDF/Excel export, performans metrikleri — v1.0
- PROC-01..05: Surec modelleri, sablonlar, ozellestirme — v1.0
- ADAPT-01..06: Uyarlama, modul toggle, konfigurasyon paneli — v1.0
- EXT-01..05: Slack/Teams entegrasyonu, bagimsiz servis katmani — v1.0

### Active

(Fresh for next milestone — define via `/gsd-new-milestone`)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Mobil native uygulama (iOS/Android) | Web-first; responsive yeterli |
| Real-time WebSocket chat | Bildirim sistemi yeterli |
| GraphQL API | REST v1 tamamlandi; v2 adayi |
| Coklu dil (i18n) | Turkce/Ingilizce yeterli |
| Video/ses konferans | Kapsam disi |
| Misafir (guest) modu | Gelecek surum |
| Mobil push notification (FCM/APNs) | Web bildirim yeterli |
| HttpOnly cookie JWT | XSS riski kabul edildi; v2 adayi |

## Context

**Architecture:** Backend Clean Architecture (Domain > Application > Infrastructure > API) with FastAPI Depends() DI. Frontend Next.js 14 App Router + TanStack Query + shadcn/ui.

**Database:** PostgreSQL 15, Docker. Tables: Users, Roles, Projects, Tasks, Comments, Notifications, Reports, Sprints, Files, Labels, AuditLog, Teams, TeamMembers, TeamProjects, PasswordResetTokens, TaskDependencies, BoardColumns, NotificationPreferences, TaskWatchers, ProcessTemplates, SystemConfig.

**Known Tech Debt:**
- In-memory lockout store (not persistent across restarts)
- Gantt dependency arrows deferred (ParentTask lacks dependency IDs)
- Integration tests use main DB (no isolated test DB)
- JWT stored in localStorage (HttpOnly cookie safer)

**Team:** 2 developers (Ayse Oz + Yusuf Emre Bayrakci), advisor: Prof. Dr. Hacer Karacan.

## Constraints

- **Stack**: Python/FastAPI + TypeScript/Next.js + PostgreSQL + Docker — fixed
- **Architecture**: Clean Architecture + SOLID + DI — all code conforms
- **Team**: 2 developers, no external resources

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean Architecture backend | Framework independence, testability | Good |
| FastAPI Depends() DI | Idiomatic Python DI for use case injection | Good |
| Next.js 14 App Router + TanStack Query | SSR/CSR hybrid, server state caching | Good |
| shadcn/ui + TailwindCSS | Modular, accessible, customizable UI | Good |
| JWT localStorage | Simplicity; XSS risk accepted | Revisit in v2 |
| Phase 1 bundles all ARCH+DATA+SEC fixes | Eliminate blockers before feature work | Good |
| Soft-delete at repository layer | Use cases stay clean | Good |
| INotificationService abstraction | Enables WebSocket swap without touching callers | Good |
| asyncio.create_task for integrations | Fire-and-forget webhooks, non-blocking | Good |
| SystemConfigProvider wraps AuthProvider | Global config available to all pages | Good |
| fpdf2 replaces WeasyPrint | Pure Python, no system lib dependencies | Good |

---
*Last updated: 2026-04-20 after v1.0 milestone*
