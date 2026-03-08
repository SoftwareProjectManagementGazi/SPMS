# Backlog Task: SPMS-02.8

**Kategori:** 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
**İster:** Tekrarlayan görevlerin bitiş kriteri

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-02.8` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `Task` (recurrence bitiş kriteri için `due_date` veya limit).

### 🟡 2. Application Katmanı
- UseCases: `ProcessRecurringTasksUseCase` içerisinde bitiş kriteri kontrolü.

### 🔴 3. Infrastructure Katmanı
- Adapter: `APSchedulerTaskAdapter`.

### 🔵 4. API (Presentation) Katmanı
- Worker logic.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
