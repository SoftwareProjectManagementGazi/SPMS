# Backlog Task: SPMS-02.6

**Kategori:** 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
**İster:** Tekrarlayan görevler

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-02.6` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `RepeatingEvent` veya `Task` üzerindeki `is_recurring` alanı. (SDD 5.2.3.3: Zamanlayıcı her gün is_recurring=True olanları tarar).

### 🟡 2. Application Katmanı
- UseCases: `ProcessRecurringTasksUseCase`.

### 🔴 3. Infrastructure Katmanı
- Adapter: `APSchedulerTaskAdapter` nesnesi arka plan işleyicisi (Scheduler) olarak çalışır.

### 🔵 4. API (Presentation) Katmanı
- Worker logic entegrasyonu.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
