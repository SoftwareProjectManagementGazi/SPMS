# Backlog Task: SPMS-02.11

**Kategori:** 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
**İster:** Görev içi yorumlaşma ve dosya paylaşımı

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-02.11` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `Comment` (SDD Tablo: COMMENTS). Port: `IFileStoragePort`.

### 🟡 2. Application Katmanı
- UseCases: `AddCommentUseCase`, `UploadAttachmentUseCase`.

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyCommentRepository`. Adapter: `LocalFileStorageAdapter`.

### 🔵 4. API (Presentation) Katmanı
- Router: `task_router.py` (POST /tasks/{id}/comments) ve `notification_router` tetiklenmesi.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
