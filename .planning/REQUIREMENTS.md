# Requirements: SPMS

**Defined:** 2026-03-11
**Core Value:** Ekiplerin farklı proje yönetim metodolojilerine uygun şekilde projelerini ve görevlerini tek platformda takip edebilmesi.

## v1 Requirements

Requirements for this milestone. All map to roadmap phases.

---

### Architecture / Clean (ARCH) — Mimari Temizlik

- [ ] **ARCH-01**: Mevcut taskService.getByProjectId ve getTasksByProject metodları tek metotta birleştirilir; create/createTask duplikasyonu giderilir
- [ ] **ARCH-02**: UserListDTO router'dan application/dtos/auth_dtos.py'ye taşınır (Clean Arch sınır ihlali)
- [ ] **ARCH-03**: project-service.ts'deki placeholder "Project Manager" objesi gerçek backend verisiyle (nested manager DTO) değiştirilir
- [ ] **ARCH-04**: task_repo.create → use case → get_by_id çift round-trip giderilir; repo'nun create methodu tam entity döner
- [ ] **ARCH-05**: task_repo.update → use case → get_by_id çift round-trip giderilir
- [ ] **ARCH-06**: project_repo.update metodu sabit alan listesi yerine DTO'dan dinamik field mapping kullanır
- [ ] **ARCH-07**: SQLAlchemy echo=True settings.DEBUG env var ile kontrol edilir; production'da False
- [ ] **ARCH-08**: JWT_SECRET ve DB_PASSWORD için hardcoded default kaldırılır; .env yoksa startup'ta validation error fırlatılır
- [ ] **ARCH-09**: Dashboard (ManagerView/MemberView), Settings sayfası ve Task Activity gerçek API'ye bağlanır (mock data kaldırılır)
- [ ] **ARCH-10**: Task endpoint'lerinde proje üyelik kontrolü eklenir; kullanıcı yalnızca üyesi olduğu projenin görevlerine erişebilir (RBAC düzeltmesi)

---

### Authentication / User (AUTH)

- [ ] **AUTH-01**: Kullanıcı profil bilgilerini (isim, e-posta, avatar) düzenleyebilir
- [ ] **AUTH-02**: Kullanıcı ekip oluşturabilir ve diğer kullanıcıları ekibe davet edebilir
- [ ] **AUTH-03**: Kullanıcı parola sıfırlama talebinde bulunabilir; e-posta ile tek kullanımlık 30 dakika geçerli link alır
- [ ] **AUTH-04**: Hatalı giriş 5 defa tekrarlandığında hesap geçici olarak kilitlenir

---

### Project & Task (TASK)

- [ ] **TASK-01**: Proje yöneticisi projeye ekip üyesi atayabilir ve atamayı kaldırabilir
- [ ] **TASK-02**: Görevler arası bağımlılık tanımlanabilir (finish-to-start, start-to-start vb.)
- [ ] **TASK-03**: Tekrarlayan görev oluşturulabilir (günlük/haftalık/aylık periyot ile)
- [ ] **TASK-04**: Tekrarlayan görev düzenlenirken "tümünü mü / yalnızca bu örneği mi?" onay kontrolü gösterilir
- [ ] **TASK-05**: Tekrarlayan görev için bitiş kriteri belirlenebilir (tarih veya tekrar sayısı)
- [ ] **TASK-06**: Aynı içerikte benzer görev oluşturulurken "benzer görev mevcut" uyarısı gösterilir
- [ ] **TASK-07**: Görev geçmişi ve işlem logları API üzerinden sorgulanabilir
- [ ] **TASK-08**: Görev detay sayfasında yorum oluşturulabilir, düzenlenebilir ve silinebilir
- [ ] **TASK-09**: Görev detay sayfasına dosya eklenebilir ve ekli dosyalar indirilebilir
- [ ] **TASK-10**: Sprint'ler API üzerinden listelenebilir, oluşturulabilir ve yönetilebilir (Sprint endpoint'leri)
- [ ] **TASK-11**: Liste endpoint'leri (görev, proje) sayfalama (pagination) desteği ile döner

---

### Views & UI (VIEW)

- [ ] **VIEW-01**: Proje board'u sürükle-bırak destekli Kanban panosu olarak çalışır; görev kartları renk/etiketle durum bildirir
- [ ] **VIEW-02**: Takvim modülü görevlerin ve tekrarlayan etkinliklerin zaman çizelgesini gösterir
- [ ] **VIEW-03**: Zaman çizelgesi / Gantt görünümü görev bağımlılıklarını ve süre çakışmalarını gösterir
- [ ] **VIEW-04**: Kullanıcı projelerine isteğe göre Kanban, Gantt veya Liste/Takvim görünümü ekleyebilir (modüler panolar)

---

### Notifications & Messaging (NOTIF)

- [ ] **NOTIF-01**: Görev/proje değişiklikleri ilgili kullanıcılara gerçek zamanlı uygulama içi bildirim olarak iletilir
- [ ] **NOTIF-02**: Görev atama, durum değişimi, yorum ve deadline yaklaşımı gibi olaylarda bildirim tetiklenir
- [ ] **NOTIF-03**: Her kullanıcı kendi rolüne göre mesajlaşma yetkisine sahiptir
- [ ] **NOTIF-04**: E-posta bildirimleri (görev atama, yorum vb.) desteklenir
- [ ] **NOTIF-05**: Kullanıcı bildirim tercihlerini özelleştirebilir (sessiz mod, yalnızca önemli olaylar)
- [ ] **NOTIF-06**: Mesaj/yorum geçmişi güvenli şekilde saklanır; proje silinse bile erişim logu tutulur

---

### Reporting & Analytics (REPT)

- [ ] **REPT-01**: Proje ilerleme durumu grafiksel olarak sunulur (görev tamamlanma oranı, sprint ilerleme grafiği)
- [ ] **REPT-02**: Raporlar kullanıcı, görev ve proje bazlı filtrelenebilir
- [ ] **REPT-03**: Rapor çıktısı PDF veya Excel formatında dışa aktarılabilir
- [ ] **REPT-04**: Kullanıcı performans metrikleri hesaplanır (tamamlanan görev sayısı, zamanında teslim oranı)
- [ ] **REPT-05**: Yönetici dashboard'unda performans verileri özet olarak gösterilir

---

### Process Model (PROC)

- [ ] **PROC-01**: Proje oluştururken Scrum, Waterfall, Kanban, Iterative süreç modeli seçilebilir
- [ ] **PROC-02**: Seçilen süreç modeline göre proje şablonu (board yapısı, sütunlar) otomatik oluşturulur
- [ ] **PROC-03**: Kullanıcı süreç şablonunu özelleştirebilir (aktivite sıralaması, sprint uzunluğu, toplantı periyotları)
- [ ] **PROC-04**: Yeni süreç modeli tanımlanabilir (admin seviyesinde)
- [ ] **PROC-05**: Seçilen süreç modeline göre takvim ve tekrarlayan etkinlikler otomatik planlanır (örn. Scrum daily/sprint review)

---

### Security & API Hardening (SEC)

- [ ] **SEC-01**: Auth endpoint'lerine (login, register) rate limiting uygulanır
- [ ] **SEC-02**: API endpoint'leri standart HTTP hata kodları döner (400, 401, 403, 404, 500)
- [ ] **SEC-03**: CORS politikası katı şekilde tanımlanır; yalnızca güvenilir domain'lerden gelen istekler kabul edilir
- [ ] **SEC-04**: Kullanıcı verileri işlenmesi KVKK/GDPR gerekliliklerine uygun şekilde belgelenir ve uygulanır

---

### Safety (SAFE)

- [ ] **SAFE-01**: Proje silme, model değiştirme, veri dışa aktarma gibi kritik işlemler öncesi onay penceresi gösterilir
- [ ] **SAFE-02**: Oturum süresi (JWT expiry) dolduğunda kullanıcı uyarı mesajıyla sistemden otomatik çıkarılır
- [ ] **SAFE-03**: Log izleme servisi entegrasyon altyapısı oluşturulur (gelecek monitoring entegrasyonu için)

---

### Data Infrastructure (DATA)

- [ ] **DATA-01**: Tablolara versioning (version/updated_at) alanı eklenir
- [ ] **DATA-02**: Kritik tablolarda audit trail tutulur; geçmiş değişiklikler sorgulanabilir
- [ ] **DATA-03**: Tekrarlayan görev için veri altyapısı oluşturulur (başlangıç tarihi, tekrarlama aralığı, bitiş koşulu)
- [ ] **DATA-04**: Silme işlemleri soft delete ile yapılır; kalıcı silme yalnızca admin izninde
- [ ] **DATA-05**: tasks.project_id, tasks.assignee_id, tasks.parent_task_id, projects.manager_id sütunlarına index eklenir

---

### Adaptation & Configuration (ADAPT)

- [ ] **ADAPT-01**: Proje bazında aktif süreç modeli değiştirilebilir (yalnızca o projeyi etkiler)
- [ ] **ADAPT-02**: Admin yeni süreç modeli şablonu tanımlayabilir veya mevcutları düzenleyebilir
- [ ] **ADAPT-03**: UI öğeleri (renk paleti, durum etiketleri) organizasyon düzeyinde ayarlanabilir
- [ ] **ADAPT-04**: Modüller kurulum esnasında aktif/pasif olarak seçilebilir (raporlama vb. kapatılabilir)
- [ ] **ADAPT-05**: Sistem parametreleri (sprint süresi, görev sınırı, bildirim frekansı) yönetim panelinden değiştirilebilir
- [ ] **ADAPT-06**: Uyarlama işlemleri sistem yeniden başlatması gerektirmez

---

### External Integrations (EXT)

- [ ] **EXT-01**: Slack, Microsoft Teams veya Google Calendar gibi üçüncü taraf API'lerle entegrasyon altyapısı ve en az bir örnek entegrasyon
- [ ] **EXT-02**: Entegrasyonlar bağımsız servis katmanında tutulur; core uygulamayı etkilemez
- [ ] **EXT-03**: Harici sistemlerle veri paylaşımı kullanıcı izni olmadan yapılmaz
- [ ] **EXT-04**: Entegrasyon API anahtarları güvenli şekilde saklanır (env var / secret manager)
- [ ] **EXT-05**: Yeni entegrasyon eklenmesi mevcut modüllerde değişiklik gerektirmez

---

## v2 Requirements

Deferred to future release.

- **SAFE**: SPMS-SAFE-4 (detaylı log monitoring servisi — altyapı v1'de hazırlanır)
- **KVKK**: GDPR silme hakkı tam uygulama (veri dışa aktarım + tam silme akışı)
- **PERF**: GraphQL veya WebSocket tabanlı veri alışverişi
- **SEC**: HttpOnly cookie tabanlı JWT storage (XSS riski azaltma)
- **EXT**: Gerçek zamanlı senkronizasyon (Google Calendar two-way sync)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobil native uygulama (iOS/Android) | Web-first; responsive yeterli |
| Real-time WebSocket chat | Karmaşıklık yüksek; bildirim sistemi yeterli |
| GraphQL API | REST v1 tamamlanmadan gerek yok; v2 |
| Çoklu dil (i18n) | Türkçe/İngilizce yeterli |
| Video/ses konferans | Kapsam dışı |
| Misafir (guest) modu | SRS'te "gelecek sürüm" |
| Mobil push notification (FCM/APNs) | Web notif yeterli |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 – ARCH-10 | Phase 1 | Pending |
| AUTH-01 – AUTH-04 | Phase 2 | Pending |
| TASK-01 – TASK-11 | Phase 3 | Pending |
| VIEW-01 – VIEW-04 | Phase 4 | Pending |
| NOTIF-01 – NOTIF-06 | Phase 5 | Pending |
| REPT-01 – REPT-05 | Phase 6 | Pending |
| PROC-01 – PROC-05 | Phase 7 | Pending |
| SEC-01 – SEC-04 | Phase 8 | Pending |
| SAFE-01 – SAFE-03 | Phase 8 | Pending |
| DATA-01 – DATA-05 | Phase 1 | Pending |
| ADAPT-01 – ADAPT-06 | Phase 7 | Pending |
| EXT-01 – EXT-05 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 65 total
- Mapped to phases: 65
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
