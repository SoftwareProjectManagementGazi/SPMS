# Backlog Task: SPMS-04.4

**Kategori:** 1.2.4 Raporlama ve Analitik (SPMS-04)
**İster:** Kullanıcı performans metriklerinin hesaplanması

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-04.4` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Model: `ReportParams`. Port: `IPdfExportPort`, `IExcelExportPort`.

### 🟡 2. Application Katmanı
- UseCases: `GenerateProjectReportUseCase` (SDD'ye göre Burndown vb. hesaplamalar).

### 🔴 3. Infrastructure Katmanı
- Adapter: `PdfkitExportAdapter`, `PandasExcelExportAdapter`. Repository: Okuma ağırlıklı View'lar.

### 🔵 4. API (Presentation) Katmanı
- Router: `report_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
