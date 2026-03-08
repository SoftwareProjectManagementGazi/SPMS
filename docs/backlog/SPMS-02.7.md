# Backlog Task: SPMS-02.7

**Kategori:** 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
**İster:** Tekrarlayan görevlerde değişiklik kontrolü

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-02.7` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `Task` (recurring serisi yönetimi).

### 🟡 2. Application Katmanı
- UseCases: `UpdateRecurringSeriesUseCase` (Sadece bu örnek mi yoksa tümü mü kararı UI'dan alınır).

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyTaskRepository`.

### 🔵 4. API (Presentation) Katmanı
- Router: `task_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
