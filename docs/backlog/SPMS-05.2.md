# Backlog Task: SPMS-05.2

**Kategori:** 1.2.5 Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)
**İster:** Süreç modeli şablonlarının otomatik oluşturulması

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-05.2` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Domain Service: Strategy Pattern uygulanacak. `ProcessStrategy` (ABC). ProjectFactory şablonları yükler.

### 🟡 2. Application Katmanı
- UseCases: `InitializeProjectWorkspaceUseCase`, `ChangeProjectProcessUseCase`.

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyBoardColumnRepository` vb. (Dinamik Pano/Sütun işlemleri).

### 🔵 4. API (Presentation) Katmanı
- Router: `process_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
