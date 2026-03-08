# Backlog Task: SPMS-01.4

**Kategori:** 1.2.1 Kullanıcı ve Yetkilendirme Modülü (SPMS-01)
**İster:** Kullanıcı profili düzenleme, ekip oluşturma / davet işlemleri

## Görev Tanımı
SRS dokümanında belirtilen `SPMS-01.4` kodlu isterin, `sdd.md` dokümanındaki kararlara (örneğin tablo adlandırmaları, algoritmik sınırlar) ve Clean Architecture standartlarına tam uyumlu entegre edilmesi sağlanacaktır.

## Temel Tasarım Kararı (SDD & Clean Architecture Uyumu)

> [!NOTE]
> SDD incelenmiş olup, belirlenen tablo (ör: LOGS, COMMENTS, NOTIFICATIONS, TASKS vb.) ve metodoloji kuralları Clean Architecture DIP prensibi ile Application katmanına uygulanmıştır.

### 🟢 1. Domain Katmanı
- Entity: `User` (profil için), `ProjectMember` (ekip daveti için). SDD Matrisi'ne göre ekip işlemleri Task modülü üzerinden yürütülür.

### 🟡 2. Application Katmanı
- UseCases: `UpdateUserProfileUseCase` (Auth modülünde), `InviteUserToProjectUseCase` (Task modülünde).

### 🔴 3. Infrastructure Katmanı
- Repository: `SqlAlchemyUserRepository`, `SqlAlchemyProjectMemberRepository`.

### 🔵 4. API (Presentation) Katmanı
- Router: `auth_router.py` (profil) ve `project_router.py` (ekip daveti).

## Kabul Kriterleri
- [ ] Domain katmanında Dependency Exception'siz (bağımlılıksız) kod geliştirildi.
- [ ] Application UseCase'leri, Infrastructure arayüzlerine (Port) DI metoduyla enjekte edildi.
- [ ] Router ve API uç noktaları FastAPI üzerinde oluşturuldu.
- [ ] SDD dokümanındaki veritabanı kısıtlarına (ör. project_id izolasyonu, trigger/log kısıtlamaları) uyuldu.
