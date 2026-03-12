# SPMS SDD Revizyon Belgesi

Bu belge, SRS'te belirtilen eksik kalan isterlerin Clean Architecture, SOLID ve Dependency Injection (DI) prensiplerine uygun mimari tasarımlarını içermektedir. Mevcut `sdd.md` belgesindeki kararlar (LOGS tablosu, is_recurring algoritması vb.) referans alınarak uyumsuzluklar giderilmiş ve GEMINI.md prensipleri ile detaylandırılmıştır.

## SPMS-01.4: Kullanıcı profili düzenleme, ekip oluşturma / davet işlemleri
**Modül:** Kullanıcı ve Yetkilendirme Modülü (SPMS-01) & Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `User` (profil için), `ProjectMember` (ekip daveti için). SDD Matrisi'ne göre ekip işlemleri Task modülü üzerinden yürütülür.
- **Application:** UseCases: `UpdateUserProfileUseCase` (Auth modülünde), `InviteUserToProjectUseCase` (Task modülünde).
- **Infrastructure:** Repository: `SqlAlchemyUserRepository`, `SqlAlchemyProjectMemberRepository`.
- **API:** Router: `auth_router.py` (profil) ve `project_router.py` (ekip daveti).

---

## SPMS-02.10: Görev geçmişi ve işlem logları
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `Log`. Repository ABC: `ILogRepository` (SDD Tablo: LOGS).
- **Application:** UseCases: `LogTaskEventUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyLogRepository`. (Değişiklikler JSON olarak 'changes' alanına yazılır).
- **API:** Router: `task_router.py` (GET /tasks/{id}/logs).

---

## SPMS-02.11: Görev içi yorumlaşma ve dosya paylaşımı
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `Comment` (SDD Tablo: COMMENTS). Port: `IFileStoragePort`.
- **Application:** UseCases: `AddCommentUseCase`, `UploadAttachmentUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyCommentRepository`. Adapter: `LocalFileStorageAdapter`.
- **API:** Router: `task_router.py` (POST /tasks/{id}/comments) ve `notification_router` tetiklenmesi.

---

## SPMS-02.12: Takvim görünümünde veya zaman çizelgesinde (Gantt) izleme
**Modül:** Proje ve Görev Yönetim Modülü / Raporlama (Gantt)

**Mimari Karar:**
- **Domain:** Model: `TimelineReadModel`. Process modülünden kuralları alır.
- **Application:** UseCases: `GetProjectTimelineQuery`.
- **Infrastructure:** Repository: `SqlAlchemyTaskRepository` (başlangıç/bitiş tarihleri çekilir).
- **API:** Router: `project_router.py`.

---

## SPMS-02.2: Projelere ekip üyelerini atama
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `ProjectMember`. SDD Matrisine göre proje-kullanıcı ilişkisi bu varlık ile kontrol altındadır.
- **Application:** UseCases: `AssignMemberToProjectUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyProjectMemberRepository`.
- **API:** Router: `project_router.py`.

---

## SPMS-02.5: Görevler arası bağımlılıklar ("bitmeden-başlayamaz" vb.)
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `Task`. SDD 5.2.3'e göre görev tablosunda `parent_task_id` üzerinden veya bağımsız bir bağımlılık tablosu ile takip edilir. Process Modülü kuralları denetler.
- **Application:** UseCases: `AddDependencyUseCase`, `ValidateTaskCompletionUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyTaskRepository`.
- **API:** Router: `task_router.py`.

---

## SPMS-02.6: Tekrarlayan görevler
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `RepeatingEvent` veya `Task` üzerindeki `is_recurring` alanı. (SDD 5.2.3.3: Zamanlayıcı her gün is_recurring=True olanları tarar).
- **Application:** UseCases: `ProcessRecurringTasksUseCase`.
- **Infrastructure:** Adapter: `APSchedulerTaskAdapter` nesnesi arka plan işleyicisi (Scheduler) olarak çalışır.
- **API:** Worker logic entegrasyonu.

---

## SPMS-02.7: Tekrarlayan görevlerde değişiklik kontrolü
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `Task` (recurring serisi yönetimi).
- **Application:** UseCases: `UpdateRecurringSeriesUseCase` (Sadece bu örnek mi yoksa tümü mü kararı UI'dan alınır).
- **Infrastructure:** Repository: `SqlAlchemyTaskRepository`.
- **API:** Router: `task_router.py`.

---

## SPMS-02.8: Tekrarlayan görevlerin bitiş kriteri
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Entity: `Task` (recurrence bitiş kriteri için `due_date` veya limit).
- **Application:** UseCases: `ProcessRecurringTasksUseCase` içerisinde bitiş kriteri kontrolü.
- **Infrastructure:** Adapter: `APSchedulerTaskAdapter`.
- **API:** Worker logic.

---

## SPMS-02.9: Mükerrer görev kontrolü ve uyarı sistemi
**Modül:** Proje ve Görev Yönetim Modülü (SPMS-02)

**Mimari Karar:**
- **Domain:** Domain Service: `DuplicateTaskDetector`. (SDD Matrisi: Görev oluşturulurken başlık, proje ve tarihe göre benzerlik sorgulanır).
- **Application:** UseCases: `CreateTaskUseCase` içerisine benzerlik kontrolünün inject edilmesi.
- **Infrastructure:** Repository: `SqlAlchemyTaskRepository`.
- **API:** Router: `task_router.py`.

---

## SPMS-03.1: Gerçek zamanlı bildirim gönderimi
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.2: Belirli durumlarda bildirim tetiklenmesi
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.3: Rol bazlı mesajlaşma yetkisi
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.4: Görev içi mesajlaşma / yorum alanı
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.5: Uygulama içi ve e-posta/push bildirimleri
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.6: Bildirim tercihleri (sessiz mod vb.)
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-03.7: Mesaj geçmişi güvenli saklanması
**Modül:** Bildirim ve Mesajlaşma (SPMS-03)

**Mimari Karar:**
- **Domain:** Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.
- **Application:** UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).
- **API:** Router: `WebSocket` endpointleri.

---

## SPMS-04.1: İlerleme durumlarının grafiksel sunumu
**Modül:** Raporlama ve Analitik (SPMS-04)

**Mimari Karar:**
- **Domain:** Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.
- **Application:** UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).
- **Infrastructure:** Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.
- **API:** Router: `report_router.py`.

---

## SPMS-04.2: Rapor filtrelemeleri (Kullanıcı, görev, proje bazlı)
**Modül:** Raporlama ve Analitik (SPMS-04)

**Mimari Karar:**
- **Domain:** Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.
- **Application:** UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).
- **Infrastructure:** Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.
- **API:** Router: `report_router.py`.

---

## SPMS-04.3: Rapor çıktılarının PDF/Excel olarak dışa aktarımı
**Modül:** Raporlama ve Analitik (SPMS-04)

**Mimari Karar:**
- **Domain:** Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.
- **Application:** UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).
- **Infrastructure:** Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.
- **API:** Router: `report_router.py`.

---

## SPMS-04.4: Kullanıcı performans metriklerinin hesaplanması
**Modül:** Raporlama ve Analitik (SPMS-04)

**Mimari Karar:**
- **Domain:** Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.
- **Application:** UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).
- **Infrastructure:** Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.
- **API:** Router: `report_router.py`.

---

## SPMS-04.5: Dashboard üzerinden yöneticilere performans verilerinin sunulması
**Modül:** Raporlama ve Analitik (SPMS-04)

**Mimari Karar:**
- **Domain:** Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.
- **Application:** UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).
- **Infrastructure:** Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.
- **API:** Router: `report_router.py`.

---

## SPMS-05.1: Scrum, Waterfall, Kanban, Iterative süreç modelleri desteği
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.2: Süreç modeli şablonlarının otomatik oluşturulması
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.3: Süreç şablonlarının özelleştirilmesi
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.4: Yeni modellerin tanımlanabilir olması
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.5: Takvim ve etkinliklerin sürece göre otomatik planlanması
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.6: Modüler projeye pano / görünümler eklenmesi
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.7: Kanban panosu eklenebilirliği
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.8: Gantt şeması eklenebilirliği
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-05.9: Basit liste veya takvim görünümü
**Modül:** Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)

**Mimari Karar:**
- **Domain:** Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.
- **Application:** UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.
- **Infrastructure:** Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).
- **API:** Router: `process_router.py`.

---

## SPMS-ADAPT-1: Süreç modeli (Scrum, Kanban) değişimi
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-ADAPT-2: Yeni şablon tanımlama
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-ADAPT-3: UI/Tema ayarlaması
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-ADAPT-4: Modül açma-kapatma
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-ADAPT-5: Sistem parametreleri konfigürasyon dosyaları/panelleri
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-ADAPT-6: Yeniden başlatma gerektirmeyen uyarlamalar
**Modül:** Uyarlama ve Konfigürasyon

**Mimari Karar:**
- **Domain:** Entity: `SystemConfig`.
- **Application:** UseCases: `UpdateSystemSettingUseCase`.
- **Infrastructure:** Adapter: Konfigürasyon adaptörü.
- **API:** Router: `config_router.py`.

---

## SPMS-API-04: Standart hata kodları
**Modül:** API Güvenlik ve Standartları

**Mimari Karar:**
- **Domain:** Exception tanımları.
- **Application:** FastAPI ValidationPipelines.
- **Infrastructure:** RateLimit Adapter.
- **API:** FastAPI Global Exception Handler.

---

## SPMS-API-06: Endpoint hız sınırlandırması (Rate limiting)
**Modül:** API Güvenlik ve Standartları

**Mimari Karar:**
- **Domain:** Exception tanımları.
- **Application:** FastAPI ValidationPipelines.
- **Infrastructure:** RateLimit Adapter.
- **API:** FastAPI Global Exception Handler.

---

## SPMS-API-07: Sıkı CORS politikaları
**Modül:** API Güvenlik ve Standartları

**Mimari Karar:**
- **Domain:** Exception tanımları.
- **Application:** FastAPI ValidationPipelines.
- **Infrastructure:** RateLimit Adapter.
- **API:** FastAPI Global Exception Handler.

---

## SPMS-DATA-2: Sürüm bilgisi (Versioning)
**Modül:** Dahili Veri Gereksinimleri

**Mimari Karar:**
- **Domain:** Tüm Domain entitylerinde id, created_at, updated_at özellikleri.
- **Application:** Listelemelerde filtreler.
- **Infrastructure:** SQLAlchemy Model listener'ları.
- **API:** API DTO dönüşümleri.

---

## SPMS-DATA-3: Tarihsel izleme (Audit trail / Loglama)
**Modül:** Dahili Veri Gereksinimleri

**Mimari Karar:**
- **Domain:** Tüm Domain entitylerinde id, created_at, updated_at özellikleri.
- **Application:** Listelemelerde filtreler.
- **Infrastructure:** SQLAlchemy Model listener'ları.
- **API:** API DTO dönüşümleri.

---

## SPMS-DATA-4: Tekrarlayan görev veri altyapısı
**Modül:** Dahili Veri Gereksinimleri

**Mimari Karar:**
- **Domain:** Tüm Domain entitylerinde id, created_at, updated_at özellikleri.
- **Application:** Listelemelerde filtreler.
- **Infrastructure:** SQLAlchemy Model listener'ları.
- **API:** API DTO dönüşümleri.

---

## SPMS-DATA-7: Yumuşak silme (Soft delete)
**Modül:** Dahili Veri Gereksinimleri

**Mimari Karar:**
- **Domain:** Tüm Domain entitylerinde id, created_at, updated_at özellikleri.
- **Application:** Listelemelerde filtreler.
- **Infrastructure:** SQLAlchemy Model listener'ları.
- **API:** API DTO dönüşümleri.

---

## SPMS-EXT-01: 3. parti API (Slack, Teams vb.) entegrasyonu
**Modül:** Dış Sistemlerle Entegrasyon (SPMS-EXT)

**Mimari Karar:**
- **Domain:** Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.
- **Application:** UseCases: `ConfigureIntegrationUseCase`.
- **Infrastructure:** Adapter: `WebhookAdapter`.
- **API:** Router: `integration_router.py`.

---

## SPMS-EXT-02: Çekirdek harici bağımsız servis katmanı entegrasyonu
**Modül:** Dış Sistemlerle Entegrasyon (SPMS-EXT)

**Mimari Karar:**
- **Domain:** Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.
- **Application:** UseCases: `ConfigureIntegrationUseCase`.
- **Infrastructure:** Adapter: `WebhookAdapter`.
- **API:** Router: `integration_router.py`.

---

## SPMS-EXT-03: Kullanıcı izni kontrolü
**Modül:** Dış Sistemlerle Entegrasyon (SPMS-EXT)

**Mimari Karar:**
- **Domain:** Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.
- **Application:** UseCases: `ConfigureIntegrationUseCase`.
- **Infrastructure:** Adapter: `WebhookAdapter`.
- **API:** Router: `integration_router.py`.

---

## SPMS-EXT-04: API anahtarı güvenliği
**Modül:** Dış Sistemlerle Entegrasyon (SPMS-EXT)

**Mimari Karar:**
- **Domain:** Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.
- **Application:** UseCases: `ConfigureIntegrationUseCase`.
- **Infrastructure:** Adapter: `WebhookAdapter`.
- **API:** Router: `integration_router.py`.

---

## SPMS-EXT-05: Bağımsız yeni entegrasyon ekleme
**Modül:** Dış Sistemlerle Entegrasyon (SPMS-EXT)

**Mimari Karar:**
- **Domain:** Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.
- **Application:** UseCases: `ConfigureIntegrationUseCase`.
- **Infrastructure:** Adapter: `WebhookAdapter`.
- **API:** Router: `integration_router.py`.

---

## SPMS-QLT-4: Performans - İşlemlerin max 5 saniye içinde tamamlanması (Optimizasyonlar devam etmekte)
**Modül:** Yazılım Kalitesi

**Mimari Karar:**
- **Domain:** N/A
- **Application:** CQRS ile okuma hızlandırılması.
- **Infrastructure:** PostgreSQL indexing.
- **API:** APM.

---

## SPMS-QLT-6: Esneklik (Yeni süreç/model ekleme desteğinin gelmesi)
**Modül:** Yazılım Kalitesi

**Mimari Karar:**
- **Domain:** N/A
- **Application:** CQRS ile okuma hızlandırılması.
- **Infrastructure:** PostgreSQL indexing.
- **API:** APM.

---

## SPMS-SAFE-1: Kritik işlemlerde onay penceresi
**Modül:** Emniyet ve Süreklilik

**Mimari Karar:**
- **Domain:** Exception: `SystemSafetyError`.
- **Application:** UseCase: `ProcessSessionTimeoutUseCase`.
- **Infrastructure:** Adapter: `RedisRateLimiterAdapter` (Timeout vs için).
- **API:** FastAPI Timeout middleware.

---

## SPMS-SAFE-2: Oturum zaman aşımı (timeout) ile sistemden çıkarma
**Modül:** Emniyet ve Süreklilik

**Mimari Karar:**
- **Domain:** Exception: `SystemSafetyError`.
- **Application:** UseCase: `ProcessSessionTimeoutUseCase`.
- **Infrastructure:** Adapter: `RedisRateLimiterAdapter` (Timeout vs için).
- **API:** FastAPI Timeout middleware.

---

## SPMS-SAFE-3: Hatalı giriş durumunda geçici kilitleme
**Modül:** Emniyet ve Süreklilik

**Mimari Karar:**
- **Domain:** Exception: `SystemSafetyError`.
- **Application:** UseCase: `ProcessSessionTimeoutUseCase`.
- **Infrastructure:** Adapter: `RedisRateLimiterAdapter` (Timeout vs için).
- **API:** FastAPI Timeout middleware.

---

## SPMS-SAFE-4: Hata/emniyet takip servisi sağlama
**Modül:** Emniyet ve Süreklilik

**Mimari Karar:**
- **Domain:** Exception: `SystemSafetyError`.
- **Application:** UseCase: `ProcessSessionTimeoutUseCase`.
- **Infrastructure:** Adapter: `RedisRateLimiterAdapter` (Timeout vs için).
- **API:** FastAPI Timeout middleware.

---

## SPMS-SEC-05: Rate limiting ve DoS koruması
**Modül:** Güvenlik, Kimlik Doğrulama

**Mimari Karar:**
- **Domain:** Domain Service: `TokenGenerationService`.
- **Application:** UseCases: `VerifyTokenUseCase`.
- **Infrastructure:** Adapter: `BcryptPasswordAdapter`, `JwtTokenAdapter`.
- **API:** FastAPI CORS, Helmet.

---

## SPMS-SEC-06: Parola sıfırlama mekanizması (Token doğrulama)
**Modül:** Güvenlik, Kimlik Doğrulama

**Mimari Karar:**
- **Domain:** Domain Service: `TokenGenerationService`.
- **Application:** UseCases: `VerifyTokenUseCase`.
- **Infrastructure:** Adapter: `BcryptPasswordAdapter`, `JwtTokenAdapter`.
- **API:** FastAPI CORS, Helmet.

---

## SPMS-SEC-07: Katı CORS politikası
**Modül:** Güvenlik, Kimlik Doğrulama

**Mimari Karar:**
- **Domain:** Domain Service: `TokenGenerationService`.
- **Application:** UseCases: `VerifyTokenUseCase`.
- **Infrastructure:** Adapter: `BcryptPasswordAdapter`, `JwtTokenAdapter`.
- **API:** FastAPI CORS, Helmet.

---

## SPMS-SEC-08: KVKK / GDPR protokollerine uyum
**Modül:** Güvenlik, Kimlik Doğrulama

**Mimari Karar:**
- **Domain:** Domain Service: `TokenGenerationService`.
- **Application:** UseCases: `VerifyTokenUseCase`.
- **Infrastructure:** Adapter: `BcryptPasswordAdapter`, `JwtTokenAdapter`.
- **API:** FastAPI CORS, Helmet.

---

## SPMS-UI-02: Sürükle-bırak destekli görev panosu (Kanban) ve durum bildirimleri
**Modül:** Dış Arayüz / UI Gereksinimleri

**Mimari Karar:**
- **Domain:** N/A
- **Application:** N/A
- **Infrastructure:** N/A
- **API:** React, Zustand store.

---

## SPMS-UI-03: Takvim modülü (Görev ve toplantılar için)
**Modül:** Dış Arayüz / UI Gereksinimleri

**Mimari Karar:**
- **Domain:** N/A
- **Application:** N/A
- **Infrastructure:** N/A
- **API:** React, Zustand store.

---

## SPMS-UI-04: Raporlama ekranı (Filtreleme özellikli)
**Modül:** Dış Arayüz / UI Gereksinimleri

**Mimari Karar:**
- **Domain:** N/A
- **Application:** N/A
- **Infrastructure:** N/A
- **API:** React, Zustand store.

---

---

## BÖLÜM 7 — MİMARİ UYGULAMA REVİZYONLARI (Faz 1 — Foundation & Security Hardening)

Bu bölüm, geliştirme sürecinde (Faz 1) SDD'deki tasarım kararlarından sapılan veya güncellenen alanları belgelemektedir. Her madde için eskinin ne olduğu, yeninin ne olduğu ve neden değiştirildiği açıklanmaktadır.

---

### REV-01: LOGS Tablosu → AUDIT_LOG Tablosu (Faz 1, Plan 01-02 ve 01-04)

**İlgili SDD bölümü:** 5.2.1 (Tablo: LOGS), 5.2.3.4 (Loglama Mekanizması)

**Eski tasarım (SDD v1.0):**

`logs` tablosu proje ve görev değişikliklerini kaydetmek için tasarlanmıştı:

```
LOGS: id, project_id (FK→projects), task_id (FK→tasks), user_id (FK→users),
      action VARCHAR(100), changes JSONB, timestamp
```

- `changes` alanına tüm değişiklikler tek bir JSON blob olarak yazılıyordu.
- Tablo proje-bağımlıydı (`project_id` zorunluydu); proje-seviye ve görev-seviye olaylar aynı tabloda karışık tutuluyordu.
- SDD 5.2.3.4'te "veritabanı tetikleyicisi veya Interceptor" ile doldurmak tarif edilmişti.

**Yeni tasarım (Faz 1 sonrası):**

`logs` tablosu tamamen kaldırıldı. Yerine `audit_log` tablosu eklendi:

```
AUDIT_LOG: id, entity_type VARCHAR(50), entity_id INTEGER,
           field_name VARCHAR(100), old_value TEXT, new_value TEXT,
           user_id (FK→users, ON DELETE SET NULL), action VARCHAR(50), timestamp
```

Temel farklar:

| Özellik | Eski (logs) | Yeni (audit_log) |
|---|---|---|
| Kapsam | Proje-bağımlı (`project_id` FK) | Entity-agnostic (`entity_type` + `entity_id`) |
| Granülarite | Tüm değişiklikler tek JSON blob | Alan başına ayrı satır (`field_name`, `old_value`, `new_value`) |
| Yazma yöntemi | Seeder + DB trigger önerisi | Repository katmanında Python kodu (audit diff) |
| Kullanımı | Seeder'da elle yazılıyor, API'de okunmuyordu | `audit_repo.get_by_entity()` ile API'den okunuyor |
| Immutability | Güvence yoktu | `TimestampedMixin` yok — intentionally immutable, append-only |
| Silme davranışı | CASCADE (proje silinince log da gider) | `user_id` ON DELETE SET NULL — log korunur |

**Neden değiştirildi:**

- SPMS-02.10 (görev geçmişi ve işlem logları) için activity feed API endpoint'i (`GET /api/v1/tasks/activity/me`) eklendi. Bu endpoint alan bazlı sorgulama gerektiriyor (`field_name = 'status'` gibi), JSON blob'da sorgu yapılamıyor.
- SPMS-DATA-03 (audit trail) gereksinimi, her güncelleme işleminde repository katmanında `update()` çağrısı sırasında otomatik diff hesaplayıp yazmayı mümkün kılıyor.
- `project_id` FK'si loglama amacını proje kapsamıyla gereksiz yere bağlıyordu; kullanıcı silme veya başka entity değişikliklerini loglamak mümkün değildi.

**Uygulama noktaları:**
- `Backend/app/infrastructure/database/models/log.py` — **silindi**
- `Backend/app/infrastructure/database/models/audit_log.py` — **yeni eklendi**
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — `SqlAlchemyAuditRepository` (yeni)
- `Backend/app/infrastructure/database/repositories/task_repo.py` — `update()` artık her değişen alan için `AuditLogModel` satırı yazıyor
- `Backend/app/infrastructure/database/repositories/project_repo.py` — aynı şekilde `update()` audit diff yazıyor
- `Backend/app/infrastructure/database/seeder.py` — `LogModel` kaldırıldı, `AuditLogModel` ile seed eklendi
- `Backend/database/init.sql` — `logs` tablosu kaldırıldı, `audit_log` tablosu eklendi

---

### REV-02: TimestampedMixin — Tüm Ana Modellere Soft-Delete ve Versioning Eklendi (Faz 1, Plan 01-02)

**İlgili SDD bölümü:** 3.3 (Veri Tabanı Görünürlüğüne İlişkin Tasarım Kararları), 5.x.1 (her modülün tablo yapıları)

**Eski tasarım (SDD v1.0):**

SDD 3.3'te "Soft-delete yapısı kullanılır; veriler doğrudan silinmez, işaretlenir" yazıyordu; ancak hiçbir tabloda `is_deleted`, `deleted_at`, `version`, `updated_at` sütunları tanımlanmamıştı.

**Yeni tasarım (Faz 1 sonrası):**

`TimestampedMixin` adlı bir SQLAlchemy mixin sınıfı oluşturuldu ve 7 ana modele uygulandı:

```python
class TimestampedMixin:
    version    = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
```

Mixin'in uygulandığı tablolar: `tasks`, `projects`, `users`, `comments`, `files`, `labels`, `sprints`

Kapsam dışı: `NotificationModel` (hard delete), `AuditLogModel` (immutable append-only).

| Sütun | Amaç | SPMS gereksinimi |
|---|---|---|
| `is_deleted` | Soft-delete işareti | SPMS-DATA-07 |
| `deleted_at` | Silinme zamanı (audit için) | SPMS-DATA-07 |
| `version` | Optimistic locking | SPMS-DATA-02 |
| `updated_at` | Son güncelleme zamanı | SPMS-DATA-02 |

---

### REV-03: JWT_SECRET ve DB_PASSWORD Startup Doğrulaması (Faz 1, Plan 01-03)

**İlgili SDD bölümü:** 3.4 (Emniyet, Güvenlik ve Gizlilik Yaklaşımı)

**Eski durum:** JWT_SECRET ve DB_PASSWORD `config.py`'de hardcoded default değerlerle tanımlıydı. Ortam değişkeni tanımlanmadan sistem çalışıyordu.

**Yeni durum:** `main.py` lifespan başlangıcında `_validate_startup_secrets()` çağrılıyor. Default değerler tespit edilirse `RuntimeError` fırlatılarak uygulama ayağa kalkmıyor. Tüm gizli değerler `.env` dosyasında tutulmalı. **Gereksinim:** ARCH-08.

---

### REV-04: RBAC Task Endpoint'lerinde Uygulandı (Faz 1, Plan 01-03)

**İlgili SDD bölümü:** 3.4, 4.1.1 (SPMS-MOD-AUTH)

**Eski durum:** Task endpoint'leri yalnızca `get_current_user` kontrolü yapıyordu. Herhangi bir oturum açık kullanıcı başkasının görevini silebiliyordu (ARCH-10).

**Yeni durum:** Her task endpoint'i `get_project_member()` ile proje üyeliği ve rol kontrolü yapıyor. Admin rolü tüm projelere erişebilir, görev silme yalnızca Proje Yöneticisi veya Admin. **Gereksinim:** SPMS-SEC-04.

---

### REV-05: Structured Logging Middleware (Faz 1, Plan 01-06)

**İlgili SDD bölümü:** 3.5 (İdame Ettirilebilirlik), SPMS-SAFE-04

**Eski durum:** "Hata ve olay loglamaları merkezi bir yapıdan izlenir" (SDD 3.5) yazıyordu; altyapı yoktu.

**Yeni durum:** `RequestLoggingMiddleware` (`BaseHTTPMiddleware`) `main.py`'e eklendi. Her HTTP isteğinde stdout'a JSON log satırı yazılıyor. Harici izleme araçları (Sentry, Datadog) bu logları parse edebilir. Yeni bağımlılık eklenmedi — yalnızca stdlib `logging` + `json`.

---

### REV-06: Frontend Mock Data → Canlı API Bağlantısı (Faz 1, Plan 01-06)

**İlgili SDD bölümü:** 4.3 (Arayüz Tasarımı)

**Eski durum:** Dashboard ve Settings sayfaları `@/lib/mock-data` dosyasından statik veri okuyordu.

**Yeni durum:**
- `settings/page.tsx` → `GET /auth/me`
- `manager-view.tsx` → `GET /api/v1/projects` (React Query)
- `member-view.tsx` → `GET /api/v1/tasks/activity/me` (yeni endpoint)
- `api-client.ts` → 401 yanıtında `session_expired` flag'i set edip `/login`'e yönlendirme (SAFE-02)

