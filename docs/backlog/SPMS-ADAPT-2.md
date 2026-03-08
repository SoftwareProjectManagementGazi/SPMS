# Backlog Task: SPMS-ADAPT-2

**Kategori:** 1.6 Uyarlama Gereksinimleri
**İster:** Yeni şablon tanımlama

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-ADAPT-2` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `SystemConfig`.

### 🟡 2. Application Katmanı
- UseCases: `UpdateSystemSettingUseCase`.

### 🔴 3. Infrastructure Katmanı
- Adapter: Konfigürasyon adaptörü.

### 🔵 4. API (Presentation) Katmanı
- Router: `config_router.py`.

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
