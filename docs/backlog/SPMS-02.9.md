# Backlog Task: SPMS-02.9

**Kategori:** 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
**İster:** Mükerrer görev kontrolü ve uyarı sistemi

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-02.9` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Domain Service: `DuplicateTaskDetector`. (SDD Matrisi: Görev oluşturulurken başlık, proje ve tarihe göre benzerlik sorgulanır).

### 🟡 2. Application Katmanı
- UseCases: `CreateTaskUseCase` içerisine benzerlik kontrolünün inject edilmesi.

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyTaskRepository`.

### 🔵 4. API (Presentation) Katmanı
- Router: `task_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
