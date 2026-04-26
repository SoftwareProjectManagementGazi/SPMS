# Requirements: SPMS v2.0

**Defined:** 2026-04-20
**Core Value:** Ekiplerin farklI proje yonetim metodolojilerine uygun sekilde projelerini ve gorevlerini tek platformda takip edebilmesi.

## v2.0 Requirements

Requirements for v2.0 Frontend Overhaul & Backend Expansion. Each maps to roadmap phases.

### Foundation & Design System

- [x] **FOUND-01**: Theme token sistemi kurulur — prototype'in oklch CSS variable'lari globals.css'e tasinir, eski token'larla namespace catismasi onlenir
- [x] **FOUND-02
**: Primitives kutuphanesi olusturulur — ProgressBar, SegmentedControl, Collapsible, AlertBanner component'leri TypeScript ile yazilir
- [x] **FOUND-03**: I18n altyapisi kurulur — useApp().language ile TR/EN destegi, tum yeni component'lerde T() fonksiyonu kullanilir
- [x] **FOUND-04**: Theme preset'lerine status-todo ve status-blocked tokenlari eklenir [E16]
- [x] **FOUND-05**: App Shell donusturulur — Sidebar, Header, Layout component'leri Next.js'e tasarim degisikligi olmadan aktarilir

### Backend Schema & Entity Expansion

- [x] **BACK-01
**: Project entity'sine status alani eklenir (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED enum, default ACTIVE)
- [x] **BACK-02
**: Task entity'sine phase_id alani eklenir (nullable, lifecycle canvas node ID referansi)
- [x] **BACK-03
**: process_config JSON'a schema_version alani + on-read normalizer eklenir (geriye uyumlu)
- [x] **BACK-04
**: Milestone entity olusturulur — Clean Architecture vertical slice (domain, repository, ORM, use cases, API router)
- [x] **BACK-05
**: Artifact entity olusturulur — Clean Architecture vertical slice, proje olusturuldiginda metodolojiye gore otomatik seed
- [x] **BACK-06
**: PhaseReport entity olusturulur — Clean Architecture vertical slice, PDF export destegi
- [x] **BACK-07
**: dependencies.py alt modullere ayrilir (3 yeni entity oncesi DI restructure)
- [x] **BACK-08
**: Alembic migration yazilir — tum yeni tablolar ve kolon degisiklikleri tek idempotent migration'da

### Backend API Expansion

- [x] **API-01
**: Phase Gate / gecis endpoint'i olusturulur — kriter degerlendirme, advisory lock ile race condition onleme, audit log kaydi
- [x] **API-02
**: Proje aktivite endpoint'i olusturulur — GET /projects/{id}/activity, tip/kullanici/sayfalama filtresi
- [x] **API-03
**: Kullanici profil ozet endpoint'i olusturulur — GET /users/{id}/summary (stats, projeler)
- [x] **API-04
**: Project status filtresi eklenir — GET /projects?status=ACTIVE
- [x] **API-05
**: Task phase_id filtresi eklenir — GET /tasks/project/{id}?phase_id=n3
- [x] **API-06
**: Faz tamamlanma kriterleri CRUD'u eklenir — process_config icinde phase_completion_criteria yonetimi
- [x] **API-07
**: Milestone CRUD endpoint'leri olusturulur — GET/POST/PATCH/DELETE
- [x] **API-08
**: Artifact CRUD endpoint'leri olusturulur — GET/POST/PATCH/DELETE
- [x] **API-09
**: PhaseReport CRUD + PDF export endpoint'leri olusturulur
- [x] **API-10
**: Workflow veri yapisina edge type, groups, sequential-flexible mode destegi eklenir

### Project Features

- [x] **PROJ-01
**: Proje Olustur Wizard sayfasi yapilir — 4 adim (Temel Bilgiler, Metodoloji, Yasam Dongusu, Yapilandirma)
- [x] **PROJ-02
**: Proje durum yonetimi eklenir — header'da dinamik badge, MoreH dropdown'da "Tamamla/Askiya Al/Arsivle" aksiyonlari [E4]
- [x] **PROJ-03
**: Arsivlenmis proje AlertBanner'i gosterilir — uyari mesaji + "Aktif Et" butonu, icerik duzenlemesi engellenir [E4]
- [x] **PROJ-04
**: Proje kartlarina durum badge'i eklenir — active/completed/on_hold/archived renkleri, arsivlenmis opacity 0.6 [E13]
- [x] **PROJ-05
**: Proje listesine durum filtresi eklenir — SegmentedControl (Tumu/Aktif/Bitti/Arsiv)

### Task Features

- [x] **TASK-01
**: Gorev Olustur Modali yapilir — overlay modal, proje/tur/baslik/aciklama/oncelik/atanan/puan/tarih/cycle/faz/etiket/tekrar alanlari
- [x] **TASK-02
**: Backlog Paneli yapilir — proje detayda sol kenarda dikey toggle, 300px panel, arama/filtre/siralama, gorev listesi, drag-drop, toplu islem [E1]
- [x] **TASK-03**: Gorev-Faz atamasi eklenir — enable_phase_assignment toggle acikken gorev formuna faz dropdown'i, board kart faz badge'i [E3][E5]
- [x] **TASK-04
**: Ana gorev sidebar'inda alt gorev faz dagilimi mini stepper gosterilir [E3]
- [x] **TASK-05
**: Board toolbar'a "Faza Gore Filtrele" dropdown'i, List Tab'a "Faz" sutunu eklenir [E5]
- [x] **TASK-06**: Cycle label'i metodolojiye gore dinamik gosterilir (Sprint/Dongu/Iterasyon/Artim) [E14]

### Lifecycle & Phase Gate

- [x] **LIFE-01**: Faz tamamlanma kriterleri formu yapilir — Settings > Lifecycle'da her faz icin otomatik kriter toggle + manuel kriter listesi [E2]
- [x] **LIFE-02**: Phase Gate inline expand yapilir — "Faza Gecis Yap" butonu, tamamlanma durumu, kriter kontrolleri, acik gorev aksiyonlari, not alani [E7]
- [x] **LIFE-03**: 0 gorevli faz secildiginde metriklerde "---", Phase Gate kriterlerinde "Uygulanamaz" ve bilgi mesaji gosterilir [E6] (Phase Gate side complete in 12-02; MiniMetric --- mono-zero summary completed 2026-04-25 in 12-04)
- [x] **LIFE-04**: Lifecycle > Gecmis kartlarinda Collapsible "Gorev Detaylari" bolumu MTTaskRow compact ile implemente edilir [E8] (completed 2026-04-25 in 12-04 — lazy-fetch + cache reuse)
- [x] **LIFE-05**: Milestone alt sekmesi yapilir — milestone listesi, ekleme formu, durum badge'leri, ProgressBar, timeline entegrasyonu (completed 2026-04-25 in 12-05 — MilestonesSubTab CRUD + chip picker + ConfirmDialog + Timeline Gantt vertical flag-line layer + popover)
- [x] **LIFE-06**: Artefakt alt sekmesi yapilir — metodolojiye gore varsayilan artefaktlar, durum takibi, sorumlu atama, dosya baglama (completed 2026-04-25 in 12-06 — ArtifactsSubTab + ArtifactInlineExpand + assignee /mine path + single-file constraint + soft-warning ConfirmDialog on draft delete)
- [x] **LIFE-07**: Degerlendirme Raporu inline expand yapilir — gecmis kartlarinda "Rapor" butonu, metrikler, sorunlar, dersler, oneriler, PDF indirme (completed 2026-04-25 in 12-06 — EvaluationReportCard + auto-prefill + lazy-create on first save + PDF Blob download with 30s rate-limit countdown + 409 reload AlertBanner + HistoryCard Rapor button wiring)

### Workflow Editor

- [x] **EDIT-01**: Edge tipleri eklenir — flow/verification/feedback, farkli stroke dash/renk, edge secim panelinde SegmentedControl (completed 2026-04-25 in 12-08 — phase-edge.tsx ships stroke patterns per type from Plan 12-01; 12-08 wires inline label edit on double-click + selection-panel SegmentedControl forwarding via onWorkflowChange)
- [x] **EDIT-02**: Node gruplama (Swimlane) eklenir — grup cercevesi, toolbar'da "Grup" butonu, sag panelde grup duzenleme (completed 2026-04-25 in 12-08 — group-cloud-node with live morph + 5 entry points wired in editor-page: drag-rect placeholder, multi-select + Grup button, drag-into-existing via parentId, mixed-select + Grup, right-click context menu Grupla; drop-association on drag-out via 240px centroid heuristic)
- [x] **EDIT-03**: sequential-flexible akis modu eklenir — sirali ilerleme + tanimli geri donuslere izin veren 4. mod (completed 2026-04-25 in 12-09 — backend WorkflowEdge.bidirectional + is_all_gate Pydantic additive defaults, ExecutePhaseTransitionUseCase honors D-16 pair-wise NOT transitive + D-17 source-agnostic gate, InvalidTransitionError → HTTP 422 INVALID_TRANSITION, seeder canonical edge shape, frontend save flow with full 5-error matrix + dirty-save guard via beforeunload + safePush DirtySaveDialog, workflow-validators sequential-flexible cycle/feedback parity — 18 backend tests + 11 editor-page tests + 20 validator tests pass)
- [x] **EDIT-04**: Aktif faz hesaplama graph traversal (BFS) ile yapilir — hardcoded index yerine node.state (active/past/future/unreachable) [E9] (completed 2026-04-25 in 12-08 — computeNodeStates from Plan 12-01 wired into editor-page rfNodes useMemo so PhaseNode.data.state drives every render; LifecycleTab side already wired in Plan 12-04)
- [x] **EDIT-05**: Paralel aktif fazlar desteklenir — birden fazla node ayni anda "active" ring alabilir [E10] (completed 2026-04-25 in 12-08 — verified via workflow-canvas.test.tsx parallel-actives BFS test using V-Model fixture in flexible mode; computeNodeStates correctly assigns 'active' state to multiple nodes per CONTEXT D-10)
- [x] **EDIT-06**: Node uzerinde dongu sayaci badge'i (xN) gosterilir — ayni faz birden fazla kez kapatilmissa [E11] (completed 2026-04-25 in 12-08 — useCycleCounters(projectId).data wired into editor-page rfNodes; PhaseNode renders CycleCounterBadge with count from Map; visibility >= 2 enforced by CycleCounterBadge primitive from Plan 12-01)
- [x] **EDIT-07**: Eksik preset template'ler eklenir — Artirimli (Incremental), Evrimsel (Evolutionary), RAD [E12] (completed 2026-04-25 in 12-10 — 9 presets in `lib/lifecycle/presets.ts` (Scrum / Waterfall / Kanban / Iterative / V-Model / Spiral + 3 NEW Incremental / Evolutionary / RAD), each passing validateWorkflow with zero errors; PresetMenu Şablon Yükle dropdown with dirty-aware ConfirmDialog flow + EditorPage applyPreset wiring with history.push for non-destructive Cmd+Z)

### Reporting & Charts

- [x] **REPT-01**: CFD (Kumulatif Akis Diyagrami) eklenir — Kanban projelerde burndown yerine, SVG stacked area, 7/30/90 gun filtresi
- [x] **REPT-02**: Lead/Cycle Time grafikleri eklenir — SVG histogram, P50/P85/P95 metrikleri
- [x] **REPT-03**: Iterasyon Karsilastirma grafigi eklenir — Scrum/Iterative icin grouped bar chart, planlanan/tamamlanan/tasinan
- [x] **REPT-04**: Reports sayfasina "Faz Raporlari" Section eklenir — proje + faz secimi ile kayitli raporlara erisim

### Activity & User Profile

- [x] **PROF-01**: Activity Tab yapilir — proje detayda yeni sekme, dikey timeline, olay ikonlari, tarih gruplari, filtre, sayfalama
- [x] **PROF-02**: Kullanici Profil sayfasi yapilir — profil header, 3 StatCard, Gorevler/Projeler/Aktivite sekmeleri
- [ ] **PROF-03**: Header avatar dropdown'i yapilir — Profilim/Ayarlar/Cikis Yap menusu
- [ ] **PROF-04**: Profil gorev listesinde MTTaskRow bileseninden yeniden kullanilir [E15]

### Page Conversions

- [x] **PAGE-01
**: Dashboard sayfasi donusturulur — mevcut tasarima sadik kalarak Next.js component'lerine ayrilir
- [x] **PAGE-02
**: Projects sayfasi donusturulur — kart grid, durum filtresi, yeni proje butonu
- [x] **PAGE-03
**: ProjectDetail sayfasi donusturulur — 8 sekmeli yapi (Board/List/Timeline/Calendar/Activity/Lifecycle/Members/Settings)
- [x] **PAGE-04
**: MyTasks sayfasi donusturulur — gorev listesi, filtreler
- [x] **PAGE-05
**: Settings sayfasi donusturulur — tum alt sekmeler (Lifecycle dahil)
- [x] **PAGE-06
**: Login/Register sayfalari donusturulur
- [x] **PAGE-07
**: WIP ihlali detaylari Board Tab'a eklenir — kolon background renk degisimi, AlertBanner, drop engelleme [EKSIK S8]

## v3.0 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Real-time WebSocket bildirimleri (polling yerine)
- **ADV-02**: HttpOnly cookie JWT (localStorage yerine)
- **ADV-03**: GraphQL API katmani
- **ADV-04**: Persistent lockout store (Redis/DB)
- **ADV-05**: Gantt dependency arrows (tam gorev bagimliligi gorsellestirmesi)
- **ADV-06**: Isolated test database (integration test'ler icin)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobil native uygulama (iOS/Android) | Web-first; responsive yeterli |
| Real-time WebSocket chat | Bildirim sistemi yeterli |
| Coklu dil (i18n --- 3+ dil) | Turkce/Ingilizce yeterli |
| Video/ses konferans | Kapsam disi |
| Misafir (guest) modu | Gelecek surum |
| Mobil push notification (FCM/APNs) | Web bildirim yeterli |
| AI-powered ozellikler | v3.0 adayi |
| Third-party OAuth login | Email/password yeterli |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 8 | Complete (08-01) |
| FOUND-02 | Phase 8 | Complete (08-02) |
| FOUND-03 | Phase 8 | Complete (08-01) |
| FOUND-04 | Phase 8 | Complete (08-01) |
| FOUND-05 | Phase 8 | Complete (08-04) |
| BACK-01 | Phase 9 | Pending |
| BACK-02 | Phase 9 | Pending |
| BACK-03 | Phase 9 | Pending |
| BACK-04 | Phase 9 | Pending |
| BACK-05 | Phase 9 | Pending |
| BACK-06 | Phase 9 | Pending |
| BACK-07 | Phase 9 | Pending |
| BACK-08 | Phase 9 | Pending |
| API-01 | Phase 9 | Pending |
| API-02 | Phase 9 | Pending |
| API-03 | Phase 9 | Pending |
| API-04 | Phase 9 | Pending |
| API-05 | Phase 9 | Pending |
| API-06 | Phase 9 | Pending |
| API-07 | Phase 9 | Pending |
| API-08 | Phase 9 | Pending |
| API-09 | Phase 9 | Pending |
| API-10 | Phase 9 | Pending |
| PAGE-01 | Phase 10 | Complete |
| PAGE-02 | Phase 10 | Complete |
| PAGE-05 | Phase 10 | Complete |
| PAGE-06 | Phase 10 | Complete |
| PROJ-01 | Phase 10 | Complete |
| PROJ-02 | Phase 10 | Complete |
| PROJ-03 | Phase 10 | Complete |
| PROJ-04 | Phase 10 | Complete |
| PROJ-05 | Phase 10 | Complete |
| PAGE-03 | Phase 11 | Complete |
| PAGE-04 | Phase 11 | Complete |
| PAGE-07 | Phase 11 | Complete |
| TASK-01 | Phase 11 | Complete |
| TASK-02 | Phase 11 | Complete |
| TASK-03 | Phase 11 | Complete |
| TASK-04 | Phase 11 | Complete |
| TASK-05 | Phase 11 | Complete |
| TASK-06 | Phase 11 | Complete |
| LIFE-01 | Phase 12 | Complete (12-03) |
| LIFE-02 | Phase 12 | Complete (12-02) |
| LIFE-03 | Phase 12 | Complete (Gate side: 12-02 + MiniMetric --- summary: 12-04) |
| LIFE-04 | Phase 12 | Complete (12-04) |
| LIFE-05 | Phase 12 | Complete (12-05) |
| LIFE-06 | Phase 12 | Complete (12-06) |
| LIFE-07 | Phase 12 | Complete (12-06) |
| EDIT-01 | Phase 12 | Completed (12-01 visuals + 12-08 inline label edit + selection-panel SegmentedControl) |
| EDIT-02 | Phase 12 | Completed (12-01 group-cloud baseline + 12-08 5 entry points + drop-association + live morph) |
| EDIT-03 | Phase 12 | Completed (12-09 — WorkflowEdge bidirectional+is_all_gate Pydantic additive + use-case D-16/D-17 honor + frontend save flow 5-error matrix + dirty-save guard + sequential-flexible validator parity) |
| EDIT-04 | Phase 12 | Completed (12-01 BFS pure lib + 12-04 LifecycleTab + 12-08 editor-page wiring) |
| EDIT-05 | Phase 12 | Completed (12-08 verified via parallel-actives test in workflow-canvas.test.tsx) |
| EDIT-06 | Phase 12 | Completed (12-01 useCycleCounters hook + 12-08 PhaseNode rfNodes data.cycleCount wiring) |
| EDIT-07 | Phase 12 | Completed (12-10 — 9 presets in lib/lifecycle/presets.ts including 3 NEW Incremental/Evolutionary/RAD; PresetMenu dropdown + ConfirmDialog flow; EditorPage applyPreset with history.push for non-destructive Cmd+Z) |
| REPT-01 | Phase 13 | Complete |
| REPT-02 | Phase 13 | Complete |
| REPT-03 | Phase 13 | Complete |
| REPT-04 | Phase 13 | Complete |
| PROF-01 | Phase 13 | Complete |
| PROF-02 | Phase 13 | Complete |
| PROF-03 | Phase 13 | Pending |
| PROF-04 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after roadmap creation*
