# Backlog Task: SPMS-EXT-04

**Kategori:** 1.3.5 Dış Sistemlerle Entegrasyon Gereksinimleri
**İster:** API anahtarı güvenliği

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-EXT-04` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `IntegrationConfig`. Port: `IExternalMessagingPort`.

### 🟡 2. Application Katmanı
- UseCases: `ConfigureIntegrationUseCase`.

### 🔴 3. Infrastructure Katmanı
- Adapter: `WebhookAdapter`.

### 🔵 4. API (Presentation) Katmanı
- Router: `integration_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
