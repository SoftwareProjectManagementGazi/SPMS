# SPMS — Software Project Management Software

## What This Is

SPMS, yazılım geliştirme ekiplerinin proje süreçlerini yönetmek için tasarlanmış web tabanlı bir sistemdir. Kullanıcılar proje ve görev oluşturup yönetebilir; yöneticiler ekip atama, performans izleme ve raporlama yapabilir. Sistem Scrum, Kanban, Waterfall ve Iterative gibi farklı süreç modellerini destekleyecek şekilde inşa edilmektedir.

**Hedef kitle:** Yazılım geliştirme ekipleri (yönetici, proje yöneticisi, ekip üyesi rolleriyle).

## Core Value

Ekiplerin farklı proje yönetim metodolojilerine uygun şekilde projelerini ve görevlerini tek platformda takip edebilmesi.

## Requirements

### Validated

<!-- Mevcut kodda çalışır durumda olan gereksinimler. -->

- ✓ SPMS-01.1: Kullanıcı kayıt, giriş ve çıkış işlemleri (JWT tabanlı) — v0
- ✓ SPMS-01.2: Rol bazlı erişim yapısı (Admin, Proje Yöneticisi, Ekip Üyesi) — v0
- ✓ SPMS-01.3: JWT kimlik doğrulama, bcrypt parola şifreleme — v0
- ✓ SPMS-01.5: Projelere erişim izinleri yönetimi — v0
- ✓ SPMS-01.6: Modüler, ölçeklenebilir yetkilendirme yapısı — v0
- ✓ SPMS-02.1: Proje oluşturma, düzenleme, arşivleme (temel CRUD) — v0
- ✓ SPMS-02.3: Görev oluşturma, düzenleme ve silme (temel CRUD) — v0
- ✓ SPMS-02.4: Alt görevler, öncelik ve durum güncellemeleri — v0
- ✓ SPMS-UI-01: Kullanıcı rolüne göre özelleşen Dashboard ekranı (yapı mevcut, mock data sorunları var) — v0
- ✓ SPMS-UI-05: Modüler ve yeniden kullanılabilir UI bileşenleri (shadcn/ui) — v0
- ✓ SPMS-UI-06: Responsive yapı (masaüstü/mobil) — v0
- ✓ SPMS-API-01: Endpoint kimlik doğrulama gerektirme — v0
- ✓ SPMS-API-02: JSON veri formatı — v0
- ✓ SPMS-API-03: REST HTTP metodları — v0
- ✓ SPMS-API-05: Swagger/Redoc API dokümantasyonu — v0
- ✓ SPMS-DB-01: SQLAlchemy ORM kullanımı — v0
- ✓ SPMS-DB-02: Tablolar arası ilişkiler — v0
- ✓ SPMS-DB-03: Sorgu optimizasyonu ve indeksleme (kısmen) — v0
- ✓ SPMS-DB-04: Modüler veritabanı katmanı — v0
- ✓ SPMS-DATA-1: Temel tablo yapıları (Users, Projects, Tasks, Comments, Notifications vb.) — v0
- ✓ SPMS-DATA-5: Çoklu proje desteği (project_id ayrıştırması) — v0
- ✓ SPMS-DATA-6: Şema modüler genişletilebilirliği — v0
- ✓ SPMS-DATA-8: Veritabanı kısıtlamaları (Foreign Key constraints) — v0
- ✓ SPMS-ENV-01: Modern web tarayıcı desteği — v0
- ✓ SPMS-ENV-02: Docker tabanlı konteynerizasyon — v0
- ✓ SPMS-ENV-03: Geliştirme/test/üretim ortam bağımsızlığı — v0
- ✓ SPMS-ENV-04: Düşük ağ bandı performansı — v0
- ✓ SPMS-SEC-01: JWT tabanlı oturum yönetimi — v0
- ✓ SPMS-SEC-02: bcrypt parola hash — v0
- ✓ SPMS-SEC-03: HTTPS zorunluluğu — v0
- ✓ SPMS-SEC-04: RBAC backend uygulaması (yapı mevcut, task endpointlerinde eksik) — v0
- ✓ SPMS-SEC-09: SQLAlchemy ile SQL injection koruması — v0
- ✓ SPMS-QLT-1: Tanımlı işlevlerin doğru yerine getirilmesi — v0
- ✓ SPMS-QLT-2: Veri kaybı olmadan toparlanma — v0
- ✓ SPMS-QLT-3: Kullanılabilir arayüz — v0
- ✓ SPMS-QLT-5: Modüler kod yapısı — v0
- ✓ SPMS-QLT-7: Test edilebilirlik / CI/CD entegrasyonu — v0

### Active

<!-- Tamamlanması gereken gereksinimler. Önce görev/proje eksikleri, ardından diğer modüller. -->

**Mimari Temizlik (Clean Architecture Uyumu):**
- [ ] Dashboard, Settings ve Task Activity sayfalarındaki mock data gerçek API'ye bağlanacak
- [ ] UserListDTO router'dan application/dtos katmanına taşınacak
- [ ] Task endpoint'lerinde RBAC yetkilendirme kontrolü eklenecek (kritik güvenlik açığı)
- [ ] Tekrarlayan task_repo.create → get_by_id çift DB round-trip giderilecek
- [ ] Hardcoded JWT_SECRET default'u kaldırılacak (güvenlik)
- [ ] SQLAlchemy echo=True production'da kapatılacak
- [ ] taskService.getByProjectId/getTasksByProject ve create/createTask tekrar eden methodlar birleştirilecek
- [ ] project-service.ts'deki placeholder manager objesi gerçek backend verisiyle değiştirilecek

**Proje & Görev Modülü Tamamlama:**
- [ ] SPMS-01.4: Kullanıcı profili düzenleme ve ekip oluşturma/davet
- [ ] SPMS-02.2: Projelere ekip üyesi atama
- [ ] SPMS-02.5: Görevler arası bağımlılıklar (finish-to-start vb.)
- [ ] SPMS-02.6: Tekrarlayan görevler (haftalık toplantı vb.)
- [ ] SPMS-02.7: Tekrarlayan görevlerde değişiklik kontrolü (tümü/sadece bu)
- [ ] SPMS-02.8: Tekrarlayan görevlerin bitiş kriteri (tarih/tekrar sayısı)
- [ ] SPMS-02.9: Benzer görev uyarı sistemi (mükerrer kontrol)
- [ ] SPMS-02.10: Görev geçmişi ve işlem logları (Log API endpoint'leri)
- [ ] SPMS-02.11: Görev içi yorumlaşma ve dosya paylaşımı (Comment + File API)
- [ ] SPMS-02.12: Takvim ve zaman çizelgesi / Gantt izleme

**Görünüm & UI:**
- [ ] SPMS-UI-02: Sürükle-bırak Kanban panosu ve durum bildirimleri
- [ ] SPMS-UI-03: Takvim modülü (görev + toplantılar)
- [ ] SPMS-UI-04: Raporlama ekranı (filtreleme özellikli)

**Bildirim & Mesajlaşma:**
- [ ] SPMS-03.1: Gerçek zamanlı bildirim gönderimi
- [ ] SPMS-03.2: Belirli durumlarda bildirim tetiklenmesi
- [ ] SPMS-03.3: Rol bazlı mesajlaşma yetkisi
- [ ] SPMS-03.4: Görev içi mesajlaşma / yorum alanı
- [ ] SPMS-03.5: Uygulama içi ve e-posta/push bildirimleri
- [ ] SPMS-03.6: Bildirim tercihleri (sessiz mod vb.)
- [ ] SPMS-03.7: Mesaj geçmişi güvenli saklanması

**Raporlama & Analitik:**
- [ ] SPMS-04.1: İlerleme durumlarının grafiksel sunumu
- [ ] SPMS-04.2: Rapor filtrelemesi (kullanıcı/görev/proje bazlı)
- [ ] SPMS-04.3: PDF/Excel export
- [ ] SPMS-04.4: Kullanıcı performans metrikleri
- [ ] SPMS-04.5: Yönetici dashboard'unda performans verileri

**Süreç Modeli & Özelleştirme:**
- [ ] SPMS-05.1: Scrum, Waterfall, Kanban, Iterative model desteği
- [ ] SPMS-05.2: Süreç modeli şablonları (proje oluşturmada seçim)
- [ ] SPMS-05.3: Süreç şablonu özelleştirme
- [ ] SPMS-05.4: Yeni model tanımlanabilirlik
- [ ] SPMS-05.5: Sürece göre otomatik takvim planlaması
- [ ] SPMS-05.6: Modüler proje panoları (eklenebilir görünümler)
- [ ] SPMS-05.7: Kanban panosu eklenebilirliği
- [ ] SPMS-05.8: Gantt şeması eklenebilirliği
- [ ] SPMS-05.9: Basit liste/takvim görünümü

**API & Güvenlik Tamamlama:**
- [ ] SPMS-API-04: Standart HTTP hata kodları
- [ ] SPMS-API-06: Rate limiting
- [ ] SPMS-API-07: Katı CORS politikaları
- [ ] SPMS-SEC-05: Rate limiting ve DoS koruması
- [ ] SPMS-SEC-06: Parola sıfırlama mekanizması (e-posta token)
- [ ] SPMS-SEC-07: Katı CORS politikası
- [ ] SPMS-SEC-08: KVKK / GDPR uyumu

**Veri & Altyapı:**
- [ ] SPMS-DATA-2: Versioning (her tabloda)
- [ ] SPMS-DATA-3: Audit trail / tarihsel izleme
- [ ] SPMS-DATA-4: Tekrarlayan görev veri altyapısı
- [ ] SPMS-DATA-7: Soft delete mekanizması
- [ ] SPMS-QLT-4: İşlem yanıt süresi < 5 saniye (pagination, N+1 fix)

**Emniyet & Uyum:**
- [ ] SPMS-SAFE-1: Kritik işlemlerde onay penceresi
- [ ] SPMS-SAFE-2: Oturum zaman aşımı ve uyarı
- [ ] SPMS-SAFE-3: Hatalı giriş kilitleme (5 deneme)
- [ ] SPMS-SAFE-4: Log izleme servisi entegrasyonu altyapısı

**Uyarlama:**
- [ ] SPMS-ADAPT-1: Proje bazında süreç modeli değişimi
- [ ] SPMS-ADAPT-2: Yeni şablon tanımlama (admin)
- [ ] SPMS-ADAPT-3: UI tema ayarlaması
- [ ] SPMS-ADAPT-4: Modül aktif/pasif seçimi
- [ ] SPMS-ADAPT-5: Sistem parametreleri konfigürasyon paneli
- [ ] SPMS-ADAPT-6: Yeniden başlatma gerektirmeyen uyarlama

**Kalite:**
- [ ] SPMS-QLT-6: Yeni süreç modeli/rapor/rol yapısı eklenebilirliği
- [ ] SPMS-QLT-4: Performans — tüm işlemler max 5 saniyede

**Dış Entegrasyon (düşük öncelik):**
- [ ] SPMS-EXT-01: Slack/Teams/Google Calendar entegrasyon altyapısı
- [ ] SPMS-EXT-02: Bağımsız servis katmanı entegrasyonu
- [ ] SPMS-EXT-03: Harici veri paylaşımında kullanıcı izni
- [ ] SPMS-EXT-04: API anahtarı güvenliği
- [ ] SPMS-EXT-05: Yeni entegrasyon eklenebilirliği

### Out of Scope

- Mobil native uygulama (iOS/Android) — web-first, responsive yeterli
- Real-time chat (WebSocket messaging) — bildirim sistemi yeterli, karmaşıklık yüksek
- GraphQL API — REST v1 tamamlanmadan gerek yok; gelecek sürüm
- Çoklu dil (i18n) — Türkçe/İngilizce yeterli
- Video/ses konferans entegrasyonu — kapsam dışı
- Misafir (guest) modu — SRS'te "gelecek sürüm" olarak işaretlenmiş

## Context

**Mimari:** Backend'de Clean Architecture (Domain → Application → Infrastructure → API) tam olarak kurulmuş. FastAPI `Depends()` ile DI mevcut. Frontend Next.js 14 App Router + TanStack Query + shadcn/ui.

**Mevcut Sorunlar (önce bunlar çözülmeli):**
1. Dashboard, Settings, Task Activity mock data kullanıyor (gerçek API'ye bağlanmamış)
2. Task endpoint'lerinde RBAC kontrolü eksik (herhangi bir kullanıcı başkasının task'ını silebiliyor)
3. UserListDTO router'da tanımlanmış (architecture violation)
4. taskService'de tekrarlayan methodlar var
5. Sprint endpoint'leri yok (model mevcut ama router yok)
6. Comment/Notification/File endpoint'leri yok (modeller mevcut)
7. SQLAlchemy echo=True production'da açık
8. Hardcoded JWT secret default

**Veritabanı:** PostgreSQL 15, Docker üzerinden. Tablolar mevcut: Users, Roles, Projects, Tasks, Comments, Notifications, Reports, Sprints, Files, Labels, Logs.

**Test durumu:** Backend'de unit test sadece RegisterUser için var. Integration testler var ama status_id bug'ı var. Frontend'de hiç test yok.

**Ekip:** 2 kişi (Ayşe Öz + Yusuf Emre Bayrakcı), danışman: Prof. Dr. Hacer Karacan.

## Constraints

- **Stack**: Python/FastAPI (backend), TypeScript/Next.js (frontend), PostgreSQL, Docker — değiştirilmez
- **Mimari**: Clean Architecture + SOLID + Dependency Injection — tüm yeni kod ve mevcut ihlaller bu yapıya uyacak
- **Timeline**: 3-4 ay, tüm backlog tamamlanmalı
- **Ekip**: 2 geliştirici, dış kaynak yok
- **Gereksinimlerde değişiklik**: Revizyona gidilmesi gerekiyorsa kullanıcıya danışılmalı

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean Architecture (Hexagonal/Ports & Adapters) backend | Framework bağımsızlığı, test edilebilirlik, SRS modülerlik gereksinimleri | ✓ Good — v0'da uygulandı |
| FastAPI Depends() ile DI | Python'da DI için idiomatic yol; use case'lere repo inject edilmesi | ✓ Good — v0'da uygulandı |
| Next.js 14 App Router + TanStack Query | SSR/CSR hibrit, server state caching | ✓ Good — v0'da uygulandı |
| shadcn/ui + TailwindCSS | Modüler, erişilebilir, özelleştirilebilir UI | ✓ Good — v0'da uygulandı |
| JWT localStorage (frontend) | Basitlik; XSS riski mevcut | ⚠️ Revisit — HttpOnly cookie daha güvenli ama kapsam dışı bırakıldı |
| Kanban board'da column_id ile durum | Esnek board yapısı | — Pending — column name → status slug kırılgan, test gerekli |
| Mevcut ihlalleri düzelt + yeni modüller clean arch yaz | Tam refactor yerine pragmatik yaklaşım | — Pending |

---
*Last updated: 2026-03-11 after initialization*
