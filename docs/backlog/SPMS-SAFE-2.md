# Backlog Task: SPMS-SAFE-2

**Kategori:** 1.7 Emniyet Gereksinimleri
**İster:** Oturum zaman aşımı (timeout) ile sistemden çıkarma

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-SAFE-2` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Exception: `SystemSafetyError`.

### 🟡 2. Application Katmanı
- UseCase: `ProcessSessionTimeoutUseCase`.

### 🔴 3. Infrastructure Katmanı
- Adapter: `RedisRateLimiterAdapter` (Timeout vs için).

### 🔵 4. API (Presentation) Katmanı
- FastAPI Timeout middleware.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
