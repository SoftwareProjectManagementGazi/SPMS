# Backlog Task: SPMS-03.4

**Kategori:** 1.2.3 Bildirim ve Mesajlaşma (SPMS-03)
**İster:** Görev içi mesajlaşma / yorum alanı

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-03.4` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `Notification`, `Message` (SDD Tablo: NOTIFICATIONS, type ve is_read alanları). Port: `INotificationPort`.

### 🟡 2. Application Katmanı
- UseCases: `SendNotificationUseCase`, `AcknowledgeNotificationUseCase`.

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyNotificationRepository`. Adapter: `WebSocketNotificationAdapter` (Odalar/Room mantığı).

### 🔵 4. API (Presentation) Katmanı
- Router: `WebSocket` endpointleri.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
