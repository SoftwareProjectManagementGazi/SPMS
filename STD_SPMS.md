# Software Test Description (STD)

## SPMS — Yazılım Proje Yönetim Sistemi

**Öğrenci:** Ayşe Öz  
**Ders:** BM314 Yazılım Mühendisliği Projesi  
**Tarih:** Haziran 2025  
**Versiyon:** 1.0

---

## İçindekiler

1. [Giriş](#1-giriş)
   - 1.1 [Genel Bakış](#11-genel-bakış)
   - 1.2 [Test Yaklaşımı](#12-test-yaklaşımı)
2. [Test Planı](#2-test-planı)
   - 2.1 [Test Edilecek Özellikler](#21-test-edilecek-özellikler)
   - 2.2 [Test Edilmeyecek Özellikler](#22-test-edilmeyecek-özellikler)
   - 2.3 [Test Ortamı ve Araçları](#23-test-ortamı-ve-araçları)
3. [Test Senaryoları](#3-test-senaryoları)
   - 3.1 [Kullanıcı Kaydı (User Registration)](#31-kullanıcı-kaydı)
   - 3.2 [Kullanıcı Girişi ve JWT Yönetimi](#32-kullanıcı-girişi-ve-jwt-yönetimi)
   - 3.3 [Şifre Sıfırlama Akışı](#33-şifre-sıfırlama-akışı)
   - 3.4 [Profil Güncelleme ve Avatar Yükleme](#34-profil-güncelleme-ve-avatar-yükleme)
   - 3.5 [Proje Oluşturma ve Metodoloji Seçimi](#35-proje-oluşturma-ve-metodoloji-seçimi)
   - 3.6 [Proje Güncelleme, Durum Yönetimi ve Silme](#36-proje-güncelleme-durum-yönetimi-ve-silme)
   - 3.7 [Proje Üye Yönetimi](#37-proje-üye-yönetimi)
   - 3.8 [Görev Oluşturma ve Temel Alanlar](#38-görev-oluşturma-ve-temel-alanlar)
   - 3.9 [Görev Güncelleme, Durum Geçişi ve Silme](#39-görev-güncelleme-durum-geçişi-ve-silme)
   - 3.10 [Alt Görev (Subtask) Yönetimi](#310-alt-görev-subtask-yönetimi)
   - 3.11 [Görev Bağımlılıkları (Task Dependencies)](#311-görev-bağımlılıkları)
   - 3.12 [Tekrarlayan Görevler (Recurring Tasks)](#312-tekrarlayan-görevler)
   - 3.13 [Kanban Panosu ve WIP Limiti](#313-kanban-panosu-ve-wip-limiti)
   - 3.14 [Sprint Yönetimi (Scrum)](#314-sprint-yönetimi)
   - 3.15 [Yorum ve Dosya Eki Yönetimi](#315-yorum-ve-dosya-eki-yönetimi)
   - 3.16 [Bildirim Sistemi](#316-bildirim-sistemi)
   - 3.17 [Burndown Chart Raporu](#317-burndown-chart-raporu)
   - 3.18 [CFD ve Lead/Cycle Time Raporları](#318-cfd-ve-leadcycle-time-raporları)
   - 3.19 [PDF ve Excel Rapor Dışa Aktarımı](#319-pdf-ve-excel-rapor-dışa-aktarımı)
   - 3.20 [Faz Geçişi ve İş Akışı (Phase Gate)](#320-faz-geçişi-ve-i̇ş-akışı)
   - 3.21 [Milestone ve Artifact Yönetimi](#321-milestone-ve-artifact-yönetimi)
   - 3.22 [Admin Panel — Kullanıcı Yönetimi](#322-admin-panel--kullanıcı-yönetimi)
   - 3.23 [Admin Panel — Toplu Kullanıcı Daveti](#323-admin-panel--toplu-kullanıcı-daveti)
   - 3.24 [Admin Panel — Denetim Günlüğü (Audit Log)](#324-admin-panel--denetim-günlüğü)
   - 3.25 [Rol Tabanlı Erişim Kontrolü (RBAC)](#325-rol-tabanlı-erişim-kontrolü)
4. [Test Sonuç Raporu](#4-test-sonuç-raporu)

---

## 1. Giriş

### 1.1 Genel Bakış

**SPMS (Software Project Management System / Yazılım Proje Yönetim Sistemi)**, yazılım geliştirme ekiplerine Scrum, Kanban, Waterfall, Iterative, V-Model, Spiral, Incremental, Evolutionary ve RAD gibi farklı proje yönetim metodolojilerini tek bir platform üzerinden uygulama imkânı sunan web tabanlı bir proje yönetim uygulamasıdır.

Bu STD belgesi, SPMS v1.0 sürümüne yönelik gerçekleştirilen yazılım testlerinin kapsamını, yöntemlerini, test senaryolarını ve elde edilen sonuçları kapsamlı biçimde açıklamaktadır. Belge; birim testleri, entegrasyon testleri ve uçtan uca (E2E) senaryolarını içermekte olup testler hem backend (FastAPI/Python) hem de frontend (Next.js/TypeScript) katmanlarında icra edilmiştir.

**Sistem Bileşenleri:**

| Bileşen | Teknoloji | Açıklama |
|---------|-----------|----------|
| Backend API | FastAPI 0.111, Python 3.12 | REST API, 80+ endpoint, JWT auth |
| Veritabanı | PostgreSQL 15, SQLAlchemy (Async) | ORM, Alembic migrations |
| Frontend | Next.js 16.1.1, TypeScript | App Router, shadcn/ui |
| Zamanlayıcı | APScheduler | Deadline uyarıları, bildirim temizleme |
| PDF Üretici | fpdf2 | Rapor ve özet PDF'leri |
| Excel Üretici | openpyxl | Veri dışa aktarımı |

**Test kapsamı:** 25 senaryo, 80+ test case, backend birim/entegrasyon testleri dahil olmak üzere tüm kritik modüller.

---

### 1.2 Test Yaklaşımı

Testler üç ayrı seviyede gerçekleştirilmiştir:

**1. Birim Testleri (Unit Tests)**  
- Araç: `pytest`, `pytest-asyncio`  
- Hedef: Domain katmanı entity doğrulamaları, use case mantığı, servis fonksiyonları  
- Bağımlılıklar Mock ile izole edilmiştir  
- Konum: `Backend/tests/unit/`

**2. Entegrasyon Testleri (Integration Tests)**  
- Araç: `httpx`, `pytest`, gerçek PostgreSQL veritabanı  
- Hedef: API endpoint davranışları, veritabanı işlemleri, yetki kontrolleri  
- Konum: `Backend/tests/integration/`

**3. Manuel / Uçtan Uca Testler (E2E)**  
- Tarayıcı: Google Chrome 124, Safari 17  
- Hedef: Kullanıcı arayüzü akışları, form doğrulamaları, görsel gösterimler  
- Test verileri: `Backend/tests/factories/` altındaki fabrika sınıfları ile üretilmiştir

**Test Veri Yönetimi:**  
Her test oturumu başında `seeder.py` çalıştırılarak roller ve şablon process template'leri oluşturulmuştur. Testler arası bağımlılığı engellemek amacıyla her integration test, işlem sonrası veritabanı geri alımı (rollback) uygulamıştır.

**Hata Raporlama:**  
Bulunan hatalar GitHub issue formatında dokümante edilmiş, düzeltme commit'leri ilgili test case numarasıyla etiketlenmiştir.

---

## 2. Test Planı

### 2.1 Test Edilecek Özellikler

**Kimlik Doğrulama:** Kayıt olma (Register), Giriş yapma (Login) ve yetkilendirme (JWT doğrulama), Şifre sıfırlama, Profil güncelleme, Avatar yükleme.

**Proje Yönetimi:** Farklı metodolojilerde (Scrum, Kanban, Waterfall, Iterative) proje oluşturma, güncelleme, durum yönetimi ve silme işlemleri; üye yönetimi ve metodoloji seçimi.

**Görev Yönetimi:** Görev oluşturma, alt görev (sub-task) ilişkileri, görev durum güncellemesi, bağımlılık tanımlama, tekrarlayan görev kurgusu ve görev izleme.

**Scrum / Sprint:** Sprint CRUD işlemleri, görevlerin sprint'e atanması, velocity hesaplama ve burndown chart verilerinin doğru üretilmesi.

**Kanban Panosu:** Sütun yönetimi, Work In Progress (WIP) limiti uygulaması, sürükle-bırak ile durum geçişi ve limit aşımında görev taşımanın engellenmesi.

**Ekip Yönetimi:** Ekip CRUD işlemleri, ekibe üye ekleme/çıkarma ve lider atama.

**Yorumlar ve Ekler:** Görev yorumu oluşturma, düzenleme ve silme; dosya yükleme, indirme ve silme işlemleri.

**Bildirimler:** In-app polling bildirimleri, e-posta bildirimi, okundu işaretleme ve kullanıcı tercih yönetimi.

**Raporlama:** Burndown chart, CFD (Cumulative Flow Diagram), Lead/Cycle Time histogram ve percentile (P50/P85/P95) metriklerinin doğruluğu; PDF ve Excel export.

**Faz Yönetimi:** Faz geçişi (phase gate), iş akışı editörü, milestone oluşturma/güncelleme ve artifact yönetimi.

**Admin Paneli:** Kullanıcı listeleme, rol değiştirme, devre dışı bırakma, tekli ve toplu davet; denetim günlüğü görüntüleme ve sistem istatistikleri.

**Yetki Kontrolü:** Rol tabanlı erişim kontrolü (RBAC); Admin, Project Manager ve Member rollerinin izin sınırlarının doğrulanması; yetkisiz erişim girişimlerinin engellenmesi.

### 2.2 Test Edilmeyecek Özellikler

**WebSocket Gerçek Zamanlı Bildirimler:** Mevcut sürümde bildirimler polling tabanlı çalışmaktadır (30 saniyelik aralık). WebSocket altyapısı v3.0 yol haritasına ertelenmiştir; polling sistemi bu STD kapsamında test edilmektedir.

**HttpOnly Cookie Tabanlı JWT:** Aktif sürümde JWT token'ı localStorage'da tutulmaktadır. Oturum varlığı Next.js middleware tarafından bir sentinel cookie ile doğrulanmakla birlikte bu cookie client tarafından oluşturulmakta, sunucu tarafında HttpOnly olarak set edilmemektedir. Güvenli cookie geçişi v3.0'a ertelenmiştir.

**Redis Önbellek Katmanı:** Projede hiçbir Redis bağımlılığı bulunmamaktadır. Idempotency cache ve hesap kilitleme servisleri in-memory olarak çalışmaktadır; Redis entegrasyonu v3.0 kapsamına alınmıştır.

**Gantt Görünümünde Bağımlılık Okları:** Gantt (Timeline) görünümü Frontend2'de custom SVG ile tam olarak uygulanmış ve bu STD kapsamında test edilmektedir. Ancak görevler arası bağımlılık ilişkilerinin Gantt üzerinde ok ile görselleştirilmesi özelliği mevcut sürümde bulunmamaktadır; v2.1 hedefindedir.

**Mobil Uygulama (iOS/Android):** Proje kapsamı yalnızca web uygulamasını içermektedir; mobil uygulama geliştirme kapsam dışıdır.

**Çoklu Kiracı (Multi-Tenant) Desteği:** Mevcut sistem tek kiracılı mimaride çalışmaktadır; organizasyon veya tenant izolasyonu bulunmamaktadır. Multi-tenant desteği v3.0 kapsamında planlanmaktadır.

**Slack/Teams Webhook Entegrasyonu (Kapsamlı Olay Desteği):** Webhook altyapısı uygulanmış olup proje oluşturma olayları Slack ve Teams'e iletilmektedir. Görev, yorum ve faz geçişi gibi diğer olay türlerinin webhook üzerinden iletilmesi henüz tamamlanmamıştır. Harici servis bağlantısı gerektirdiğinden uçtan uca otomasyon dışında tutulmuş; servis katmanı birim düzeyinde mock ile test edilmiştir.

**Hesap Kilitleme (Lockout) Kalıcı Depolama:** Hesap kilitleme servisi in-memory store kullanmaktadır; 5 başarısız giriş denemesinde hesap 15 dakika kilitlenmektedir. Sunucu yeniden başlatıldığında kilit durumu sıfırlanmaktadır. Persistence davranışı bu STD kapsamına alınmamıştır.

### 2.3 Test Ortamı ve Araçları

**Donanım / İşletim Sistemi:** Geliştirme ve test işlemleri macOS 14.6, Apple Silicon (M serisi) donanımı üzerinde gerçekleştirilmiştir. Tarayıcı testleri Google Chrome 124.0 ve Safari 17.4 ile yürütülmüştür.

**Yazılım Ortamı:** Backend Python 3.12, FastAPI 0.111.x, SQLAlchemy 2.0.x (async); veritabanı olarak Docker üzerinde PostgreSQL 15 kullanılmıştır. Frontend Node.js 20.x ve Next.js 16.1.1 ile çalıştırılmıştır.

**Test Araçları:** pytest 8.x ve pytest-asyncio 0.23.x backend birim ve entegrasyon testleri için kullanılmıştır. FastAPI endpoint'lerine async HTTP istekleri httpx 0.27.x (AsyncClient) aracılığıyla atılmıştır. Test verisi üretiminde Pydantic Factories kullanılmış; PostgreSQL veritabanı izolasyonu Docker Compose ile sağlanmıştır. Frontend ağ isteklerinin izlenmesi ve hata ayıklama için Chrome DevTools'tan yararlanılmış; PDF içerik doğrulaması fpdf2 kütüphanesi ile gerçekleştirilmiştir.

**Test Veritabanı Bağlantısı:**
```
postgresql+asyncpg://postgres:password@localhost:5432/spms_test
```

---

## 3. Test Senaryoları

---

### 3.1 Kullanıcı Kaydı (Admin Davet Akışı)

#### 3.1.1 Amaç
SPMS'te kullanıcı kaydı serbest kayıt (self-registration) ile değil, admin tarafından başlatılan davet akışıyla gerçekleşmektedir. Bu senaryonun amacı; admin tarafından gönderilen davet ile kullanıcı hesabının oluşturulduğunu, kullanıcının e-posta linkiyle şifresini belirleyerek hesabını aktive edebildiğini ve hatalı ya da mükerrer davet durumlarının doğru yönetildiğini doğrulamaktır.

**Akış özeti:**
1. Admin `POST /api/v1/admin/users` ile e-posta ve rol bilgisi gönderir.
2. Sistem `is_active=False` kullanıcı ve 7 günlük `PasswordResetToken` oluşturur.
3. Kullanıcıya `/auth/set-password?token=<token>` bağlantısı e-posta ile iletilir.
4. Kullanıcı linke tıklayarak şifresini belirler; hesap `is_active=True` olur.
5. Kullanıcı sisteme giriş yapabilir hale gelir.

#### 3.1.2 Girişler

- **TC-REG-01 —** Geçerli tekli davet: Admin, yeni bir kullanıcıyı e-posta adresi ve rolünü belirterek sisteme davet eder.
- **TC-REG-02 —** Mükerrer davet: Sistemde zaten kayıtlı olan bir e-posta adresi için ikinci kez davet gönderilmeye çalışılır.
- **TC-REG-03 —** Geçersiz e-posta formatı: Admin, geçerli formatta olmayan (@ işareti içermeyen) bir e-posta adresiyle davet oluşturmaya çalışır.
- **TC-REG-04 —** Şifre belirleme ve hesap aktivasyonu: Davet e-postasındaki bağlantıya tıklanarak yeni şifre belirlenir.
- **TC-REG-05 —** Kullanılmış davet tokeni tekrar denenir: Şifre belirlemek için daha önce kullanılmış olan davet bağlantısı tekrar kullanılmaya çalışılır.
- **TC-REG-06 —** Süresi dolmuş davet linki: Geçerliliği sona ermiş (7 günden eski) bir davet bağlantısı ile şifre belirleme denenir.

#### 3.1.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-REG-01:** Davet başarıyla oluşturulmalı; kullanıcı pasif hesapla sisteme eklenmiş olmalı, 7 günlük aktivasyon bağlantısı üretilmiş olmalı ve şifre bilgisi yanıtta yer almamalı.
- **TC-REG-02:** Hata mesajı dönmeli; aynı e-posta adresiyle ikinci kayıt oluşturulmamalı.
- **TC-REG-03:** Geçersiz e-posta formatı reddedilmeli ve hata mesajı dönmeli.
- **TC-REG-04:** Şifre başarıyla belirlenmeli; hesap aktif hale getirilmeli ve yeni şifre ile sisteme giriş yapılabilmeli.
- **TC-REG-05:** Hata mesajı dönmeli; daha önce kullanılmış bağlantı tekrar işleme alınmamalı.
- **TC-REG-06:** Hata mesajı dönmeli; süresi dolmuş bağlantı hiçbir koşulda kabul edilmemelidir.

#### 3.1.4 Test Prosedürleri

1. Admin olarak yeni kullanıcı davet edilir; kullanıcının pasif hesapla sisteme eklendiği ve 7 günlük aktivasyon bağlantısının oluşturulduğu doğrulanır.
2. Oluşturulan kullanıcının hesabının pasif durumda olduğu ve davet bağlantısının sistemde kayıtlı olduğu teyit edilir.
3. TC-REG-02 için aynı e-posta ile ikinci davet gönderilir; hata mesajı beklenir.
4. TC-REG-03 için geçersiz e-posta formatıyla davet oluşturulmaya çalışılır; hata mesajı beklenir.
5. TC-REG-04 için davet bağlantısı kullanılarak şifre belirlenir; ardından hesabın aktif hale geldiği ve yeni şifre ile giriş yapılabildiği doğrulanır.
6. TC-REG-05 için aynı bağlantı tekrar kullanılmaya çalışılır; hata mesajı beklenir.
7. TC-REG-06 için bağlantının geçerlilik süresi geçmiş bir tarihe alınarak şifre belirleme denenir; hata mesajı beklenir.

#### 3.1.5 Sonuç

- **TC-REG-01 — GEÇTI:** Kullanıcı pasif hesapla sisteme eklendi; 7 günlük aktivasyon bağlantısı oluşturuldu.
- **TC-REG-02 — GEÇTI:** Hata mesajı döndü; mükerrer kullanıcı oluşturulmadı.
- **TC-REG-03 — GEÇTI:** Geçersiz e-posta formatı reddedildi; hata mesajı döndü.
- **TC-REG-04 — GEÇTI:** Şifre belirlendi; hesap aktif hale geldi; kullanıcı sisteme giriş yapabildi.
- **TC-REG-05 — GEÇTI:** Kullanılmış bağlantı reddedildi; hata mesajı döndü.
- **TC-REG-06 — GEÇTI:** Süresi dolmuş bağlantı reddedildi; hata mesajı döndü.

**Tespit Edilen Sorun:** Şifre belirleme formu (`/auth/set-password`) ilk versiyonda token geçersiz olduğunda kullanıcıya genel bir hata sayfası gösteriyordu; hatanın nedeni (süresi dolmuş mu, kullanılmış mı) belirtilmiyordu.  
**Düzeltme:** Backend'den dönen hata mesajı (`detail` alanı) frontend'de ayrıştırılarak kullanıcıya "Davet linkinizin süresi dolmuş" veya "Bu link daha önce kullanılmış" şeklinde bağlama özgü mesaj gösterilmesi sağlandı.

---

### 3.2 Kullanıcı Girişi ve JWT Yönetimi

#### 3.2.1 Amaç
Doğru kimlik bilgileriyle giriş yapıldığında JWT access token üretildiğini, yanlış bilgilerle ve hesabı devre dışı kullanıcılarla girişin engellendiğini doğrulamak.

#### 3.2.2 Girişler

- **TC-LOGIN-01 —** Geçerli giriş: Kayıtlı kullanıcı, doğru e-posta ve şifresiyle sisteme giriş yapar.
- **TC-LOGIN-02 —** Yanlış şifre: Geçerli e-posta adresiyle yanlış şifre kullanılarak giriş denenir.
- **TC-LOGIN-03 —** Kayıtsız e-posta: Sistemde kayıtlı olmayan bir e-posta adresiyle giriş denenir.
- **TC-LOGIN-04 —** Devre dışı hesap: Admin tarafından devre dışı bırakılmış bir hesapla giriş denenir.
- **TC-LOGIN-05 —** Token doğrulama: Başarılı girişten elde edilen token ile kullanıcı profil bilgilerine erişilir.
- **TC-LOGIN-06 —** Süresi dolmuş token: Oturum süresi dolduktan sonra profil sayfasına erişilmeye çalışılır.

#### 3.2.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-LOGIN-01:** Giriş başarılı olmalı; erişim token'ı üretilmeli ve 30 dakika geçerli olmalı.
- **TC-LOGIN-02:** Hata mesajı dönmeli; şifrenin yanlış olduğu açıkça belirtilmemeli (bilgi sızıntısı önlemi).
- **TC-LOGIN-03:** TC-LOGIN-02 ile birebir aynı hata mesajı dönmeli; e-postanın kayıtsız olduğu açıklanmamalı.
- **TC-LOGIN-04:** Hata mesajı dönmeli; devre dışı hesap için erişim token'ı üretilmemeli.
- **TC-LOGIN-05:** Kullanıcının profil bilgileri (ad, e-posta, rol) başarıyla dönmeli.
- **TC-LOGIN-06:** Hata mesajı dönmeli; kullanıcı otomatik olarak giriş sayfasına yönlendirilmeli.

#### 3.2.4 Test Prosedürleri

1. TC-LOGIN-01 için kayıtlı kullanıcı bilgileriyle giriş yapılır; erişim token'ının üretildiği ve 30 dakika geçerli olduğu doğrulanır.
2. TC-LOGIN-02 ve TC-LOGIN-03 için hata mesajlarının birebir aynı olduğu doğrulanır (bilgi sızıntısı önlemi).
3. TC-LOGIN-04 için admin panelinden kullanıcı hesabı devre dışı bırakılır; ardından bu hesapla giriş denenir.
4. TC-LOGIN-05 için alınan token ile profil bilgileri sayfasına erişilir; kullanıcı bilgilerinin doğru döndüğü kontrol edilir.
5. TC-LOGIN-06 için token süresi dolana kadar beklenir veya token geçerliliği geçmişe alınır; korumalı sayfaya erişim denenir.

#### 3.2.5 Sonuç

- **TC-LOGIN-01 — GEÇTI:** Erişim token'ı başarıyla üretildi; geçerlilik süresi doğrulandı.
- **TC-LOGIN-02 — GEÇTI:** Genel hata mesajı döndü; şifrenin yanlış olduğu açıklanmadı.
- **TC-LOGIN-03 — GEÇTI:** TC-LOGIN-02 ile birebir aynı mesaj döndü; kullanıcı adı ya da e-posta farkı mesajla belli edilmedi.
- **TC-LOGIN-04 — GEÇTI:** Pasif hesap girişi reddedildi; token üretilmedi.
- **TC-LOGIN-05 — GEÇTI:** Profil bilgileri doğru döndü.
- **TC-LOGIN-06 — GEÇTI:** Oturum süresi doldu; kullanıcı giriş sayfasına yönlendirildi.

**Tespit Edilen Sorun:** Frontend, token süresi dolduğunda kullanıcıyı login sayfasına yönlendirmek yerine "Network Error" toast mesajı gösteriyordu.  
**Düzeltme:** `authService` axios interceptor'ına 401 yanıt yakalanarak `localStorage` temizliği ve `/login` yönlendirmesi eklendi.

---

### 3.3 Şifre Sıfırlama Akışı

#### 3.3.1 Amaç
Kullanıcının şifresini unutması durumunda e-posta tabanlı token ile sıfırlama akışının doğru çalıştığını doğrulamak.

#### 3.3.2 Girişler

- **TC-PWD-01 —** Kayıtlı e-postaya sıfırlama isteği: Sistemde kayıtlı bir e-posta adresi için şifre sıfırlama bağlantısı talep edilir.
- **TC-PWD-02 —** Kayıtsız e-postaya sıfırlama isteği: Sistemde bulunmayan bir e-posta adresi için şifre sıfırlama bağlantısı talep edilir.
- **TC-PWD-03 —** Geçerli token ile şifre değiştirme: E-posta ile gelen sıfırlama bağlantısı kullanılarak yeni şifre belirlenir.
- **TC-PWD-04 —** Geçersiz/sahte token: Rastgele üretilmiş geçersiz bir token ile şifre sıfırlama denenir.
- **TC-PWD-05 —** Süresi dolmuş token: Geçerliliği sona ermiş bir şifre sıfırlama bağlantısıyla şifre değiştirme denenir.

#### 3.3.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-PWD-01:** Sıfırlama bağlantısı başarıyla oluşturulmalı; e-posta ile kullanıcıya iletilmeli.
- **TC-PWD-02:** TC-PWD-01 ile birebir aynı yanıt dönmeli; kayıtsız e-postaya sıfırlama bağlantısı gönderilip gönderilmediği kullanıcıya açıklanmamalı.
- **TC-PWD-03:** Şifre başarıyla güncellenmeli; eski şifre ile giriş artık reddedilmeli.
- **TC-PWD-04:** Hata mesajı dönmeli; geçersiz bağlantıyla işlem gerçekleşmemeli.
- **TC-PWD-05:** Hata mesajı dönmeli; süresi dolmuş bağlantı kabul edilmemeli.

#### 3.3.4 Test Prosedürleri

1. TC-PWD-01 için kayıtlı bir e-postaya şifre sıfırlama bağlantısı talep edilir; bağlantının sistemde oluşturulduğu doğrulanır.
2. TC-PWD-02 için kayıtsız bir e-postaya aynı istek gönderilir; yanıtın TC-PWD-01 ile aynı olduğu doğrulanır.
3. TC-PWD-03 için gelen sıfırlama bağlantısıyla yeni şifre belirlenir; ardından eski şifre ile giriş denenerek reddedildiği teyit edilir.
4. TC-PWD-04 için rastgele üretilmiş geçersiz bir bağlantı ile şifre sıfırlama denenir; hata mesajı beklenir.
5. TC-PWD-05 için süresi dolmuş bir bağlantı ile şifre sıfırlama denenir; hata mesajı beklenir.

#### 3.3.5 Sonuç

- **TC-PWD-01 — GEÇTI:** Sıfırlama bağlantısı oluşturuldu; e-posta gönderimi doğrulandı.
- **TC-PWD-02 — GEÇTI:** Kayıtsız e-posta için de aynı yanıt döndü; e-posta adresi ifşa edilmedi.
- **TC-PWD-03 — GEÇTI:** Şifre güncellendi; eski şifre ile giriş engellendi.
- **TC-PWD-04 — GEÇTI:** Geçersiz bağlantı reddedildi; hata mesajı döndü.
- **TC-PWD-05 — GEÇTI:** Süresi dolmuş bağlantı reddedildi; hata mesajı döndü.

Tüm test case'ler ilk çalışmada geçti. Token hash'inin güvenli `bcrypt` ile saklandığı doğrulandı.

---

### 3.4 Profil Güncelleme ve Avatar Yükleme

#### 3.4.1 Amaç
Kullanıcının ad, soyad ve avatarını güncelleyebildiğini; izin verilmeyen dosya türlerinin reddedildiğini doğrulamak.

#### 3.4.2 Girişler

- **TC-PROF-01 —** Ad güncelleme: Kullanıcı profil sayfasından adını değiştirir ve kaydeder.
- **TC-PROF-02 —** Geçerli avatar yükleme: Kullanıcı 150 KB boyutunda PNG formatında bir fotoğrafı profil resmi olarak yükler.
- **TC-PROF-03 —** Boyut sınırı aşımı: Kullanıcı 3 MB boyutunda bir JPEG dosyasını profil resmi olarak yüklemeye çalışır (izin verilen üst sınır 2 MB'tır).
- **TC-PROF-04 —** İzin verilmeyen dosya türü: Kullanıcı .exe uzantılı bir dosyayı profil resmi olarak yüklemeye çalışır.
- **TC-PROF-05 —** E-posta değiştirme girişimi: Kullanıcı profil güncelleme formuna e-posta adresi de ekleyerek kaydetmeye çalışır.

#### 3.4.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-PROF-01:** Ad güncelleme başarılı olmalı; güncellenmiş bilgiler yanıtta dönmeli.
- **TC-PROF-02:** Avatar başarıyla yüklenmeli; profil resmi güncellenmeli ve erişilebilir olmalı.
- **TC-PROF-03:** Hata mesajı dönmeli; 2 MB sınırını aşan dosya sunucuya kaydedilmemeli.
- **TC-PROF-04:** Hata mesajı dönmeli; izin verilmeyen dosya türü reddedilmeli (jpg, jpeg, png, gif, webp dışındakiler kabul edilmemeli).
- **TC-PROF-05:** İstek başarılı olmalı ancak e-posta adresi değişmemeli; e-posta güncelleme kapsamı dışında olduğundan yoksayılmalı.

#### 3.4.4 Test Prosedürleri

1. TC-PROF-01 için giriş yapılmış kullanıcı olarak profil sayfasından ad güncelleme formu doldurulup kaydedilir; değişikliğin yansıdığı doğrulanır.
2. TC-PROF-02 için 150 KB boyutunda PNG dosyası profil resmi olarak yüklenir; yükleme sonrası resmin güncellendiği ve erişilebildiği kontrol edilir.
3. TC-PROF-03 için 3 MB boyutunda JPEG dosyası yüklenmeye çalışılır; 2 MB sınırı aşıldığından hata mesajı beklenir.
4. TC-PROF-04 için .exe uzantılı dosya yüklenmeye çalışılır; izin verilmeyen format olarak reddedilmesi beklenir.
5. TC-PROF-05 için profil güncelleme formuna e-posta adresi de eklenerek kaydedilir; e-postanın değişmediği doğrulanır.

#### 3.4.5 Sonuç

- **TC-PROF-01 — GEÇTI:** Ad güncellendi; değişiklik sisteme yansıdı.
- **TC-PROF-02 — GEÇTI:** Avatar kaydedildi; erişilebilir hale geldi.
- **TC-PROF-03 — GEÇTI:** Dosya boyutu sınırı aşıldığında hata mesajı döndü.
- **TC-PROF-04 — GEÇTI:** Desteklenmeyen dosya türü reddedildi; hata mesajı döndü.
- **TC-PROF-05 — GEÇTI:** E-posta adresi değiştirilemedi; eski adres yanıtta döndü.

**Tespit Edilen Sorun:** İlk versiyonda dosya boyutu kontrolü yalnızca frontend'de yapılıyordu; backend'de herhangi bir boyut sınırı uygulanmamıştı. Büyük dosyalar sunucuya yüklenebiliyordu.  
**Düzeltme:** FastAPI `UploadFile` handler'ına `MAX_AVATAR_SIZE = 2 * 1024 * 1024` (2 MB) kontrolü eklendi; sınır aşımında 413 döndürülmektedir.

---

### 3.5 Proje Oluşturma ve Metodoloji Seçimi

#### 3.5.1 Amaç
Farklı metodolojilerle proje oluşturulabildiğini, proje anahtar (key) benzersizliğinin sağlandığını ve metodolojiye özgü varsayılan sütunlar ile artifact'ların otomatik oluşturulduğunu doğrulamak.

#### 3.5.2 Girişler

- **TC-PROJ-01 —** Scrum projesi oluşturma: Proje yöneticisi Scrum metodolojisini seçerek başlangıç ve bitiş tarihleriyle yeni bir proje oluşturur.
- **TC-PROJ-02 —** Kanban projesi oluşturma: Kanban metodolojisi seçilerek yeni bir proje oluşturulur.
- **TC-PROJ-03 —** Waterfall projesi oluşturma: Waterfall metodolojisi seçilerek yeni bir proje oluşturulur.
- **TC-PROJ-04 —** Boş proje adı: Proje adı boş bırakılarak oluşturma formu gönderilir.
- **TC-PROJ-05 —** Aynı isimle ikinci proje: Aynı kullanıcı tarafından aynı isimle ikinci bir proje oluşturulmaya çalışılır.
- **TC-PROJ-06 —** Varsayılan sütun kontrolü: Scrum projesi oluşturulduktan sonra projenin pano sütunları incelenir.

#### 3.5.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-PROJ-01:** Scrum projesi başarıyla oluşturulmalı; metodoloji ve benzersiz proje anahtarı yanıtta dönmeli.
- **TC-PROJ-02:** Kanban projesi başarıyla oluşturulmalı; Kanban'a özgü yapılandırma otomatik uygulanmalı.
- **TC-PROJ-03:** Waterfall projesi başarıyla oluşturulmalı; metodolojiye özgü yapılandırma normalleştirilmeli.
- **TC-PROJ-04:** Hata mesajı dönmeli; proje adı boş bırakılmamalı.
- **TC-PROJ-05:** İkinci proje de başarıyla oluşturulmalı; sistem proje adına benzersizlik kısıtı uygulamamalı.
- **TC-PROJ-06:** Scrum projesine ait varsayılan pano sütunları ("To Do", "In Progress", "Done") otomatik oluşturulmuş olmalı.

#### 3.5.4 Test Prosedürleri

1. TC-PROJ-01 için Scrum metodolojisi seçilerek proje oluşturulur; benzersiz proje anahtarının üretildiği doğrulanır.
2. TC-PROJ-02 ve TC-PROJ-03 için Kanban ve Waterfall metodolojileriyle birer proje oluşturulur; metodolojiye özgü yapılandırmanın uygulandığı kontrol edilir.
3. TC-PROJ-04 için proje adı boş bırakılarak form gönderilir; hata mesajı beklenir.
4. TC-PROJ-06 için Scrum projesi oluşturulduktan sonra pano görünümüne geçilir; varsayılan sütunların otomatik oluşturulduğu kontrol edilir.
5. Frontend proje oluşturma sihirbazından metodoloji seçilerek form doldurulur; her adımda doğrulama kontrol edilir.

#### 3.5.5 Sonuç

- **TC-PROJ-01 — GEÇTI:** Proje anahtarı otomatik üretildi; metodoloji doğru atandı.
- **TC-PROJ-02 — GEÇTI:** Kanban projesi oluşturuldu; Kanban şablonu uygulandı.
- **TC-PROJ-03 — GEÇTI:** Waterfall projesi oluşturuldu; yapılandırma dönüşümü başarıyla tamamlandı.
- **TC-PROJ-04 — GEÇTI:** Zorunlu alan eksik olduğunda hata mesajı döndü.
- **TC-PROJ-05 — GEÇTI:** Aynı isimle ikinci proje başarıyla oluşturuldu; ad benzersizlik kısıtı yoktur.
- **TC-PROJ-06 — GEÇTI:** Scrum için 3 varsayılan sütun otomatik oluşturuldu.

**Tespit Edilen Sorun:** Waterfall metodolojisi için `process_config` şema normalleştirmesi (`schema_version`) ilk versiyonda eksikti; eski şema formatındaki projeler 500 Internal Server Error veriyordu.  
**Düzeltme:** `manage_projects.py` use case'ine `_normalize_process_config()` backward-compatibility normalleştiricisi eklendi; `schema_version=1` olmayan konfigürasyonlar otomatik dönüştürülmektedir.

---

### 3.6 Proje Güncelleme, Durum Yönetimi ve Silme

#### 3.6.1 Amaç
Mevcut projenin adının, tarihlerinin ve durumunun güncellenebildiğini, silinebildiğini ve yetkisiz kullanıcıların bu işlemleri yapamadığını doğrulamak.

#### 3.6.2 Girişler

- **TC-PUPD-01 —** Proje adı ve durumu güncelleme: Proje yöneticisi projenin adını ve durumunu "Askıda" olarak günceller.
- **TC-PUPD-02 —** Projeyi tamamlandı işaretleme: Proje yöneticisi projeyi "Tamamlandı" durumuna geçirir.
- **TC-PUPD-03 —** Yetkili proje silme: Proje yöneticisi yetkisiyle bir proje silinir.
- **TC-PUPD-04 —** Yetkisiz proje silme: Normal bir üye, projeyi silmeye çalışır.
- **TC-PUPD-05 —** Duruma göre proje filtreleme: Proje listesi yalnızca "Askıda" durumundaki projeleri gösterecek şekilde filtrelenir.

#### 3.6.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-PUPD-01:** Proje adı ve durumu başarıyla güncellenmeli; değişiklikler anında yansımalı.
- **TC-PUPD-02:** Proje tamamlandı olarak işaretlenmeli; durum bilgisi yanıtta doğru görünmeli.
- **TC-PUPD-03:** Proje silinmeli; projeye ait görevler ve üyeler de otomatik olarak temizlenmeli.
- **TC-PUPD-04:** Yetkisiz silme girişimi reddedilmeli; hata mesajı dönmeli.
- **TC-PUPD-05:** Yalnızca "Askıda" durumundaki projeler listelenmeli; diğer durumdaki projeler yanıtta yer almamalı.

#### 3.6.4 Test Prosedürleri

1. Proje yöneticisi olarak TC-PUPD-01 için proje adı ve durumu güncellenir; değişikliğin yansıdığı doğrulanır.
2. TC-PUPD-02 için proje tamamlandı olarak işaretlenir; durum güncellemesinin kaydedildiği kontrol edilir.
3. TC-PUPD-03 için proje yöneticisi projeyi siler; TC-PUPD-04 için üye rolündeki kullanıcı silme işlemi dener ve reddedildiği doğrulanır.
4. TC-PUPD-05 için proje listesi "Askıda" durumuna göre filtrelenir; yalnızca ilgili projelerin listelendiği doğrulanır.

#### 3.6.5 Sonuç

- **TC-PUPD-01 — GEÇTI:** Ad ve durum güncellendi; değişiklik sorgulama ile teyit edildi.
- **TC-PUPD-02 — GEÇTI:** Proje tamamlandı olarak işaretlendi; durum değişikliği sisteme yansıdı.
- **TC-PUPD-03 — GEÇTI:** Proje silindi; ilişkili tüm veriler de kaldırıldı.
- **TC-PUPD-04 — GEÇTI:** Yetkisiz silme girişimi reddedildi; proje silinmedi.
- **TC-PUPD-05 — GEÇTI:** Filtre uygulandı; yalnızca beklemede olan projeler listelendi.

---

### 3.7 Proje Üye Yönetimi

#### 3.7.1 Amaç
Projeye üye eklenip çıkarılabildiğini, tekrar eklemenin engellendiğini ve üye olmayan kullanıcıların proje verilerine erişemediğini doğrulamak.

#### 3.7.2 Girişler

- **TC-MEM-01 —** Üye ekleme: Proje yöneticisi kullanıcıyı seçerek projeye ekler.
- **TC-MEM-02 —** Zaten üye olan kullanıcıyı tekrar ekleme: Mevcut bir proje üyesi tekrar eklenmeye çalışılır.
- **TC-MEM-03 —** Üye çıkarma: Proje yöneticisi bir üyeyi projeden çıkarır.
- **TC-MEM-04 —** Üye olmayan kullanıcı erişimi: Projeye üye olmayan bir kullanıcı proje detay sayfasına erişmeye çalışır.
- **TC-MEM-05 —** Davet bağlantısıyla ilk giriş: Admin daveti sonrası üretilen bağlantıyla şifre belirlenir; kullanıcı projeye otomatik olarak eklenir.

#### 3.7.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-MEM-01:** Üye başarıyla eklenmeli; proje üye listesinde görünmeli.
- **TC-MEM-02:** Hata mesajı dönmeli; zaten üye olan kullanıcı tekrar eklenememeli.
- **TC-MEM-03:** Üye projeden çıkarılmalı; üye listesinde artık görünmemeli.
- **TC-MEM-04:** Proje varlığı üye olmayan kullanıcılara açıklanmamalı; erişim reddedilmeli.
- **TC-MEM-05:** Şifre belirleme başarılı olmalı; kullanıcı projeye eklenmiş olmalı ve davet bağlantısı bir daha kullanılamamalı.

#### 3.7.4 Test Prosedürleri

1. TC-MEM-01: Proje yöneticisi kullanıcıyı projeye ekler; üye listesinde göründüğü kontrol edilir.
2. TC-MEM-02: Aynı kullanıcı tekrar eklenmaya çalışılır; hata mesajı beklenir.
3. TC-MEM-03: Proje yöneticisi üyeyi projeden çıkarır; listeden kalktığı teyit edilir.
4. TC-MEM-04: Projeye üye olmayan bir kullanıcı proje detayına erişmeye çalışır; erişimin reddedildiği doğrulanır.

#### 3.7.5 Sonuç

- **TC-MEM-01 — GEÇTI:** Üye başarıyla eklendi; proje üye listesinde göründü.
- **TC-MEM-02 — GEÇTI:** Hata mesajı döndü; mükerrer kayıt oluşturulmadı.
- **TC-MEM-03 — GEÇTI:** Üye projeden başarıyla çıkarıldı.
- **TC-MEM-04 — GEÇTI:** Proje bulunamadı mesajı döndü; proje varlığı ifşa edilmedi.
- **TC-MEM-05 — GEÇTI:** 7 günlük bağlantı süresi doğrulandı; şifre belirleme sonrası bağlantı geçersizleşti ve tekrar kullanılamadı.

---

### 3.8 Görev Oluşturma ve Temel Alanlar

#### 3.8.1 Amaç
Görevlerin tüm zorunlu alanlarla başarıyla oluşturulabildiğini, proje bazlı benzersiz görev anahtarının (task key) üretildiğini ve öncelik/durum alanlarının doğru çalıştığını doğrulamak.

#### 3.8.2 Girişler

- **TC-TASK-01 —** Görev oluşturma: Proje üyesi başlık, öncelik (Yüksek) ve puan belirterek yeni bir görev oluşturur.
- **TC-TASK-02 —** Boş başlık: Görev başlığı boş bırakılarak oluşturma formu gönderilir.
- **TC-TASK-03 —** Geçersiz öncelik değeri: Öncelik alanına tanımlı olmayan bir değer girilerek görev oluşturulmaya çalışılır.
- **TC-TASK-04 —** Geçmiş bitiş tarihi: Bitiş tarihi olarak geçmişte kalmış bir tarih seçilerek görev oluşturulur.
- **TC-TASK-05 —** Proje görev listesi: Bir projenin tüm görevleri sayfalandırılmış şekilde listelenir.
- **TC-TASK-06 —** Görev arama: Görev başlığında bir anahtar kelime ile arama yapılır.

#### 3.8.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-TASK-01:** Görev başarıyla oluşturulmalı; benzersiz görev anahtarı otomatik üretilmeli ve her yeni görevde sıra numarası artmalı.
- **TC-TASK-02:** Hata mesajı dönmeli; görev başlığı boş bırakılmamalı.
- **TC-TASK-03:** Hata mesajı dönmeli; tanımsız öncelik değeri reddedilmeli.
- **TC-TASK-04:** Görev başarıyla oluşturulmalı; geçmiş bitiş tarihi engel teşkil etmemeli.
- **TC-TASK-05:** Görevler sayfalandırılmış şekilde listelenmeli; toplam kayıt sayısı yanıtta dönmeli.
- **TC-TASK-06:** Büyük/küçük harfe duyarsız arama çalışmalı; başlıkta eşleşen görevler listelenmeli.

#### 3.8.4 Test Prosedürleri

1. Bir proje oluşturulur; proje anahtarı not edilir.
2. TC-TASK-01 için başlık, öncelik ve puan belirtilerek görev oluşturulur; benzersiz görev anahtarının üretildiği doğrulanır.
3. 5 görev oluşturulur; her görevde anahtarın sıralı arttığı teyit edilir.
4. TC-TASK-02 için boş başlıkla, TC-TASK-03 için tanımsız öncelik değeriyle görev oluşturulmaya çalışılır; hata mesajları kontrol edilir.
5. TC-TASK-06 için görev başlığında anahtar kelimeyle arama yapılır; eşleşen görevlerin listelendiği doğrulanır.

#### 3.8.5 Sonuç

- **TC-TASK-01 — GEÇTI:** Görev anahtarı otomatik üretildi; sonraki görevlerde sayaç doğru artı.
- **TC-TASK-02 — GEÇTI:** Hata mesajı döndü; başlık alanı zorunlu olduğu için işlem reddedildi.
- **TC-TASK-03 — GEÇTI:** Geçersiz durum değeri reddedildi; hata mesajı döndü.
- **TC-TASK-04 — GEÇTI:** Geçmiş tarihli görev başarıyla oluşturuldu.
- **TC-TASK-05 — GEÇTI:** Sayfalandırma doğru çalıştı; toplam kayıt sayısı yanıtta döndü.
- **TC-TASK-06 — GEÇTI:** Büyük/küçük harf farkı gözetmeksizin arama çalıştı; eşleşen görevler listelendi.

---

### 3.9 Görev Güncelleme, Durum Geçişi ve Silme

#### 3.9.1 Amaç
Görev alanlarının güncellenebildiğini, board sütunları arasındaki durum geçişlerinin kaydedildiğini ve silme işleminin doğru çalıştığını doğrulamak.

#### 3.9.2 Girişler

- **TC-TUPD-01 —** Görev güncelleme: Görevin başlığı ve önceliği "Kritik" olarak değiştirilir.
- **TC-TUPD-02 —** Durum geçişi: Görev, Kanban panosunda farklı bir sütuna taşınır.
- **TC-TUPD-03 —** Görev silme: Proje üyesi bir görevi siler.
- **TC-TUPD-04 —** Görev değişiklik geçmişi: Bir görevin tüm değişiklik kayıtları sırayla görüntülenir.

#### 3.9.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-TUPD-01:** Görev başlığı ve önceliği başarıyla güncellenmeli; değişiklikler kayıt altına alınmalı.
- **TC-TUPD-02:** Görev yeni sütuna taşınmalı; durum değişikliği aktivite geçmişine kaydedilmeli.
- **TC-TUPD-03:** Görev silinmeli; silinmiş göreve erişim reddedilmeli ve alt görevler de otomatik olarak temizlenmeli.
- **TC-TUPD-04:** Tüm değişiklikler (oluşturma, alan güncellemeleri, sütun geçişleri) kronolojik sırayla listelenmeli.

#### 3.9.4 Test Prosedürleri

1. Görev oluşturulur; başlık ve öncelik güncellenerek değişikliklerin kaydedildiği doğrulanır.
2. Görev farklı bir sütuna taşınır; durum değişikliğinin aktivite geçmişine eklendiği teyit edilir.
3. Görevin tüm değişiklik geçmişi incelenir; oluşturma, güncelleme ve taşıma kayıtlarının listelendiği kontrol edilir.
4. Görev silinir; silinen göreve erişilmeye çalışılır ve erişimin reddedildiği doğrulanır.

#### 3.9.5 Sonuç

- **TC-TUPD-01 — GEÇTI:** Başlık ve öncelik güncellendi; değişiklik sisteme yansıdı.
- **TC-TUPD-02 — GEÇTI:** Görev sütunu değiştirildi; aktivite kaydı oluşturuldu; burndown verisi üretildi.
- **TC-TUPD-03 — GEÇTI:** Görev silindi; alt görevler de kaldırıldı; silinen görevin sorgulanması hata döndürdü.
- **TC-TUPD-04 — GEÇTI:** Tüm değişiklik kayıtları tarih sırasıyla listelendi.

---

### 3.10 Alt Görev (Subtask) Yönetimi

#### 3.10.1 Amaç
Görevlerin birden fazla alt göreve sahip olabildiğini, alt görev-ebeveyn ilişkisinin doğru kurulduğunu ve ebeveyn silindiğinde alt görevlerin de temizlendiğini doğrulamak.

#### 3.10.2 Girişler

- **TC-SUB-01 —** Alt görev oluşturma: Var olan bir görevin altına bağlı yeni bir alt görev oluşturulur.
- **TC-SUB-02 —** İkinci seviye alt görev: Oluşturulan alt görevin altına bir kez daha alt görev eklenerek iki seviyeli hiyerarşi kurulur.
- **TC-SUB-03 —** Alt görev listesi: Ebeveyn görevin detay sayfası açılarak alt görev listesi incelenir.
- **TC-SUB-04 —** Ebeveyn silindiğinde alt görevler: Ebeveyn görev silinir; alt görevlerin de otomatik olarak kaldırılıp kaldırılmadığı kontrol edilir.

#### 3.10.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-SUB-01:** Alt görev başarıyla oluşturulmalı; üst göreve bağlı olduğu ve bağımsız bir görev anahtarı aldığı doğrulanmalı.
- **TC-SUB-02:** İkinci seviye hiyerarşi desteklenmeli; torun görev de oluşturulabilmeli.
- **TC-SUB-03:** Ebeveyn görev detayında tüm doğrudan alt görevler listelenmeli.
- **TC-SUB-04:** Ebeveyn silindiğinde tüm alt görevler de otomatik olarak temizlenmeli; silinmiş alt görevlere erişim reddedilmeli.

#### 3.10.4 Test Prosedürleri

1. Bir ebeveyn görev oluşturulur; altına 3 alt görev eklenir.
2. Ebeveyn görev detayı incelenerek alt görevlerin listelendiği doğrulanır.
3. Bir alt görevin altına torun görev eklenir; iki seviyeli hiyerarşinin desteklendiği test edilir.
4. Ebeveyn görev silinir; tüm alt görevlere erişilmeye çalışılarak otomatik temizlendiği teyit edilir.

#### 3.10.5 Sonuç

- **TC-SUB-01 — GEÇTI:** Alt görev üst göreve bağlandı; bağımsız görev anahtarı atandı.
- **TC-SUB-02 — GEÇTI:** İkinci seviye hiyerarşi desteklendi; torun görev oluşturuldu.
- **TC-SUB-03 — GEÇTI:** Alt görevler üst görev yanıtında listelendi.
- **TC-SUB-04 — GEÇTI:** Üst görev silindiğinde alt görevler de kaldırıldı.

---

### 3.11 Görev Bağımlılıkları

#### 3.11.1 Amaç
Bir görevin başka bir görevi bloklamasının tanımlanabildiğini, döngüsel bağımlılık oluşturulmasının engellendiğini doğrulamak.

#### 3.11.2 Girişler

- **TC-DEP-01 —** Bağımlılık tanımlama: A görevi, B görevi tamamlanmadan başlayamaz şeklinde bir bağımlılık ilişkisi tanımlanır.
- **TC-DEP-02 —** Döngüsel bağımlılık girişimi: A→B ve B→C bağımlılıkları tanımlandıktan sonra C'nin A'yı bloklaması eklenerek döngüsel bağımlılık oluşturulmaya çalışılır.
- **TC-DEP-03 —** Bağımlılık listesi: Bir görevin tüm bağımlılıkları listelenir.
- **TC-DEP-04 —** Bağımlılık silme: Tanımlı bir bağımlılık ilişkisi kaldırılır.

#### 3.11.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-DEP-01:** Bağımlılık başarıyla tanımlanmalı; görev bağımlılık listesinde görünmeli.
- **TC-DEP-02:** Hata mesajı dönmeli; döngüsel bağımlılık oluşturulmamalı.
- **TC-DEP-03:** Tanımlı tüm bağımlılıklar bloklayan/bloklunan görev detaylarıyla listelenmeli.
- **TC-DEP-04:** Bağımlılık başarıyla silinmeli; listede bir daha görünmemeli.

#### 3.11.4 Test Prosedürleri

1. A, B, C olmak üzere 3 görev oluşturulur.
2. A görevi B tamamlanmadan başlayamaz şeklinde bağımlılık tanımlanır; bağımlılık listesinde göründüğü kontrol edilir.
3. B→C bağımlılığı eklenir.
4. C→A eklenerek döngüsel bağımlılık oluşturulmaya çalışılır; hata mesajı beklenir ve kayıt oluşturulmadığı doğrulanır.
5. A→B bağımlılığı kaldırılır; listeden düştüğü teyit edilir.

#### 3.11.5 Sonuç

- **TC-DEP-01 — GEÇTI:** Bağımlılık kaydı oluşturuldu; liste sorgusunda göründü.
- **TC-DEP-02 — GEÇTI:** Döngüsel bağımlılık tespit edildi; kayıt oluşturulmadı; hata mesajı döndü.
- **TC-DEP-03 — GEÇTI:** Bağımlılıklar bloklayan/bloklunan detaylarıyla listelendi.
- **TC-DEP-04 — GEÇTI:** Bağımlılık başarıyla kaldırıldı; listeden silindi.

---

### 3.12 Tekrarlayan Görevler

#### 3.12.1 Amaç
Tekrarlayan görevlerin zamanlanmış iş (scheduler) tarafından doğru aralıklarla yeniden oluşturulduğunu ve bitiş koşulunun doğru uygulandığını doğrulamak.

#### 3.12.2 Girişler

- **TC-REC-01 —** Haftalık tekrarlayan görev: Haftalık tekrarlama ve yıl sonu bitiş tarihi ayarlanarak yeni bir tekrarlayan görev oluşturulur.
- **TC-REC-02 —** Sayaç tabanlı tekrarlayan görev: Günlük tekrarlama ve toplam 5 kez oluşturulma sınırıyla bir görev oluşturulur.
- **TC-REC-03 —** Zamanlayıcı tetiklemesi: Arka planda çalışan görev zamanlayıcısı test ortamında manuel olarak tetiklenir; yeni görev kopyasının oluşup oluşmadığı kontrol edilir.
- **TC-REC-04 —** Tekrar sınırına ulaşıldığında davranış: 5 tekrar sınırına ulaşıldıktan sonra zamanlayıcı tekrar tetiklenerek yeni görev üretilip üretilmediği kontrol edilir.

#### 3.12.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-REC-01:** Tekrarlayan görev başarıyla oluşturulmalı; zamanlayıcı tetiklendiğinde aynı seriden yeni bir kopya üretilmeli.
- **TC-REC-02:** 5 tekrar sınırına ulaşıldığında zamanlayıcı yeni görev üretmeyi durdurmalı.
- **TC-REC-03:** Yeni görev kopyası aynı seriye ait olduğu belirtilmeli; başlık ve proje bilgileri aktarılmış olmalı.
- **TC-REC-04:** Görev listesinde bu seriden 5'ten fazla kopya bulunmamalı.

#### 3.12.4 Test Prosedürleri

1. TC-REC-01 için haftalık tekrarlayan görev oluşturulur; görevin bir seriye bağlandığı doğrulanır.
2. Arka plan zamanlayıcısı test ortamında manuel tetiklenir; yeni bir görev kopyasının aynı seriden oluşturulduğu gözlemlenir.
3. TC-REC-02 için günlük tekrarlayan ve 5 tekrar sınırlı görev oluşturulur; 5. tekrardan sonra zamanlayıcının durduğu doğrulanır.
4. Tarih hesaplama mantığı birim testi ile izole edilerek doğrulanır.

#### 3.12.5 Sonuç

- **TC-REC-01 — GEÇTI:** Tekrarlayan görev serisine atandı; zamanlayıcı tetiklenince aynı seriden yeni görev oluşturuldu.
- **TC-REC-02 — GEÇTI:** Tekrar sayısı sınırına ulaşıldığında görev üretimi durdu.
- **TC-REC-03 — GEÇTI:** Yeni oluşturulan görev aynı seriye bağlıydı; başlık ve proje bilgileri aktarıldı.
- **TC-REC-04 — GEÇTI:** 5. tekrar sonrasında yeni görev üretilmedi; liste 5 kayıt içeriyordu.

**Tespit Edilen Sorun:** `recurrence_end_date` ile `recurrence_count` aynı anda verildiğinde hangi koşulun öncelikli olduğu belirsizdi; scheduler her iki koşulu da ayrı ayrı değerlendiriyordu.  
**Düzeltme:** Domain servisi "her ikisi birden verildiğinde, ilk ulaşılan koşul geçerli olur" kuralı benimsenerek dokümante edildi ve unit test kapsamına alındı.

---

### 3.13 Kanban Panosu ve WIP Limiti

#### 3.13.1 Amaç
Kanban panosunda özel sütunların yönetilebildiğini, WIP limitinin aşılması durumunda görev taşımanın engellendiğini ve sürükle-bırak etkileşiminin doğru çalıştığını doğrulamak.

#### 3.13.2 Girişler

- **TC-KAN-01 —** WIP limitli sütun oluşturma: Kanban panosuna maksimum 3 görev alabilecek yeni bir "Review" sütunu eklenir.
- **TC-KAN-02 —** WIP limit aşım testi: Sütun 3 görevle doluyken 4. görev aynı sütuna taşınmaya çalışılır.
- **TC-KAN-03 —** WIP limitini kaldırma: Sütunun WIP limiti kaldırılarak sınırsız kapasiteye alınır.
- **TC-KAN-04 —** Sütun silme: Kanban panosundan bir sütun silinir.
- **TC-KAN-05 —** Sürükle-bırak ile görev taşıma: Frontend'de görev, fare ile tutularak farklı bir sütuna bırakılır.

#### 3.13.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-KAN-01:** Sütun ve WIP limiti başarıyla oluşturulmalı; belirlenen kapasite uygulanmalı.
- **TC-KAN-02:** Hata mesajı dönmeli; WIP limiti dolu olan sütuna görev taşınmamalı.
- **TC-KAN-03:** WIP limiti kaldırılmalı; artık sütuna sınırsız görev eklenebilmeli.
- **TC-KAN-04:** Sütun silinmeli; o sütundaki görevlerin sütun ataması otomatik olarak boşalmalı.
- **TC-KAN-05:** Görev yeni sütuna başarıyla taşınmalı; WIP ihlali durumunda görev orijinal sütununa geri dönmeli ve kullanıcıya bildirim gösterilmeli.

#### 3.13.4 Test Prosedürleri

1. Kanban panosuna maksimum 3 görev kapasiteli "Review" sütunu oluşturulur.
2. Sütuna 3 görev taşınır; 4. görev taşınmaya çalışılır ve hata mesajı beklenir.
3. Frontend'de sürükle-bırak ile görev farklı bir sütuna taşınır; işlemin kaydedildiği gözlemlenir.
4. Sütunun WIP limiti kaldırılır; 4. görevin başarıyla eklenip eklenmediği kontrol edilir.

#### 3.13.5 Sonuç

- **TC-KAN-01 — GEÇTI:** Sütun ve iş yükü limiti oluşturuldu; limit değeri sisteme kaydedildi.
- **TC-KAN-02 — GEÇTI:** İş yükü sınırı aşıldığında hata döndü; görev taşınmadı.
- **TC-KAN-03 — GEÇTI:** İş yükü limiti kaldırıldı; sütuna ek görev eklenebildi.
- **TC-KAN-04 — GEÇTI:** Sütun başarıyla kaldırıldı.
- **TC-KAN-05 — GEÇTI:** Sürükle-bırak ile görev taşındı; iş yükü ihlalinde uyarı gösterildi ve geri alındı.

**Tespit Edilen Sorun:** Frontend'de WIP limiti backend tarafından reddedildiğinde hata mesajı kullanıcıya gösterilmiyor; görev görsel olarak sütuna bırakılmış ama verisi kaydedilmemişti.  
**Düzeltme:** `useMutation` error handler'ına `sonner` toast bildirimi ve optimistik güncelleme rollback'i eklendi; WIP ihlali durumunda görev orijinal sütununa geri döner.

---

### 3.14 Sprint Yönetimi

#### 3.14.1 Amaç
Scrum metodolojili projelerde sprint'lerin oluşturulabildiğini, görevlerin sprint'lere atanabildiğini ve sprint durumlarının doğru yönetildiğini doğrulamak.

#### 3.14.2 Girişler

- **TC-SPR-01 —** Sprint oluşturma: Scrum projesine başlangıç ve bitiş tarihleri belirlenerek yeni bir sprint eklenir.
- **TC-SPR-02 —** Görevi sprint'e atama: Mevcut bir görev oluşturulan sprint'e bağlanır.
- **TC-SPR-03 —** Sprint'i aktif etme: Sprint "Aktif" durumuna geçirilir.
- **TC-SPR-04 —** Sprint'i tamamlama: Sprint "Tamamlandı" olarak işaretlenir.
- **TC-SPR-05 —** Burndown chart verisi: 5 görev (toplam 20 puan) atanmış bir sprint için burndown grafiği verisi sorgulanır.
- **TC-SPR-06 —** Geçersiz tarih aralığı: Bitiş tarihi başlangıç tarihinden önce olan bir sprint oluşturulmaya çalışılır.

#### 3.14.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-SPR-01:** Sprint başarıyla oluşturulmalı; planlandı durumunda olmalı.
- **TC-SPR-02:** Görev sprint'e başarıyla bağlanmalı; görev detayında sprint bilgisi görünmeli.
- **TC-SPR-03:** Sprint aktif duruma geçmeli; pano görünümüne yansımalı.
- **TC-SPR-04:** Sprint tamamlandı olarak işaretlenmeli; tamamlanmış sprint tekrar aktif edilememeli.
- **TC-SPR-05:** Toplam puan, ideal çizgi ve günlük kalan puan verileri doğru hesaplanmalı.
- **TC-SPR-06:** Hata mesajı dönmeli; bitiş tarihi başlangıç tarihinden önce olan sprint oluşturulamamalı.

#### 3.14.4 Test Prosedürleri

1. Scrum projesi oluşturulur; başlangıç ve bitiş tarihleriyle sprint eklenir.
2. 5 görev sprint'e atanır; toplam puanın 20 olduğu doğrulanır.
3. Görevlerin yarısı "Done" sütununa taşınır; burndown grafiği sorgulanarak kalan puanın düştüğü teyit edilir.
4. Sprint tamamlandı olarak işaretlenir; tekrar aktif etmeye çalışılır ve geri dönüşün engellendiği doğrulanır.
5. TC-SPR-06 için bitiş tarihi başlangıç tarihinden önce olan sprint oluşturulmaya çalışılır; hata mesajı beklenir.

#### 3.14.5 Sonuç

- **TC-SPR-01 — GEÇTI:** Sprint planlandı statüsüyle oluşturuldu.
- **TC-SPR-02 — GEÇTI:** Görev sprint'e atandı; atama sisteme yansıdı.
- **TC-SPR-03 — GEÇTI:** Sprint aktif hale geldi; tahta görünümüne yansıdı.
- **TC-SPR-04 — GEÇTI:** Sprint tamamlandı olarak işaretlendi; geri dönüş engellendi.
- **TC-SPR-05 — GEÇTI:** Burndown verileri doğruydu; görev tamamlandıkça kalan puan düştü.
- **TC-SPR-06 — GEÇTI:** Geçersiz tarih aralığı reddedildi; hata mesajı döndü.

---

### 3.15 Yorum ve Dosya Eki Yönetimi

#### 3.15.1 Amaç
Görevlere yorum eklenip düzenlenebildiğini, dosya eklerinin yüklenip indirilebildiğini ve kendi yorumunu/ekini olmayan başkasının silemediğini doğrulamak.

#### 3.15.2 Girişler

- **TC-COM-01 —** Yorum ekleme: Bir göreve metin yorum eklenir.
- **TC-COM-02 —** Yorum düzenleme: Yorumu yazan kişi kendi yorumunu düzenler.
- **TC-COM-03 —** Yetkisiz yorum silme: Başka bir kullanıcı, kendi yazmadığı bir yorumu silmeye çalışır.
- **TC-ATT-01 —** Dosya ekleme: Göreve bir dosya ek olarak yüklenir.
- **TC-ATT-02 —** Dosya indirme: Daha önce yüklenen ek dosya indirilir.
- **TC-ATT-03 —** Dosya silme: Dosyayı yükleyen kişi, eki siler.

#### 3.15.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-COM-01:** Yorum başarıyla eklenmeli; yorum sahibi oturumdaki kullanıcı olarak otomatik belirlenmeli.
- **TC-COM-02:** Yorum içeriği başarıyla güncellenmeli; son güncelleme zamanı değişmeli.
- **TC-COM-03:** Başkasının yorumunu silme girişimi reddedilmeli.
- **TC-ATT-01:** Dosya başarıyla yüklenmeli; dosya adı, boyutu ve türü yanıtta dönmeli.
- **TC-ATT-02:** Dosya başarıyla indirilmeli; indirilen dosyanın içeriği orijinalle birebir eşleşmeli.
- **TC-ATT-03:** Dosya hem kayıt sisteminden hem de depolama alanından fiziksel olarak silinmeli.

#### 3.15.4 Test Prosedürleri

1. Kullanıcı A bir göreve yorum yazar; kullanıcı B bu yorumu silmeye çalışır ve reddedildiği doğrulanır.
2. Göreve bir dosya ek olarak yüklenir; dosya adı, boyutu ve türünün kaydedildiği kontrol edilir.
3. Yüklenen dosya indirilir; indirilen dosyanın orijinalle aynı içeriğe sahip olduğu doğrulanır.
4. Dosya silinir; depolama alanından fiziksel olarak kaldırıldığı teyit edilir.

#### 3.15.5 Sonuç

- **TC-COM-01 — GEÇTI:** Yorum oluşturuldu; yazar bilgisi otomatik atandı.
- **TC-COM-02 — GEÇTI:** İçerik güncellendi; değişiklik zamanı sisteme yansıdı.
- **TC-COM-03 — GEÇTI:** Yetkisiz silme girişimi reddedildi; yorum silinmedi.
- **TC-ATT-01 — GEÇTI:** Dosya başarıyla yüklendi; meta bilgileri doğruydu.
- **TC-ATT-02 — GEÇTI:** Dosya bütünlüğü doğrulandı; içerik değişmemişti.
- **TC-ATT-03 — GEÇTI:** Dosya hem kayıt sisteminden hem depolama alanından silindi.

---

### 3.16 Bildirim Sistemi

#### 3.16.1 Amaç
Görev atama, yorum ekleme ve yaklaşan son tarih durumlarında in-app bildirimin oluşturulduğunu, okundu olarak işaretlenebildiğini ve kullanıcı tercihlerinin çalıştığını doğrulamak.

#### 3.16.2 Girişler

- **TC-NOT-01 —** Görev atama bildirimi: Bir görev belirli bir kullanıcıya atanır; atanan kullanıcının bildirimleri kontrol edilir.
- **TC-NOT-02 —** Yorum bildirimi: Takip edilen bir göreve yorum eklenir; görev sahibinin bildirim listesi kontrol edilir.
- **TC-NOT-03 —** Bildirim listesi: Kullanıcının gelen tüm bildirimleri listelenir.
- **TC-NOT-04 —** Okundu işaretleme: Belirli bir bildirim okundu olarak işaretlenir.
- **TC-NOT-05 —** Bildirim tercihlerini güncelleme: Deadline uyarı süresi 3 gün öncesi ve e-posta bildirimleri kapalı olarak güncellenir.
- **TC-NOT-06 —** Deadline yaklaşma uyarısı: Bitiş tarihi 2 gün sonrasına ayarlanmış bir görev oluşturulur; arka plan zamanlayıcısı manuel olarak tetiklenir.

#### 3.16.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-NOT-01:** Görev atama bildirimi oluşturulmalı; atanan kullanıcının bildirim listesine yansımalı.
- **TC-NOT-02:** Yorum bildirimi oluşturulmalı; yorumu yazan kullanıcı dışındaki ilgililere gönderilmeli.
- **TC-NOT-03:** Bildirimler okunmamışlar önce gelecek şekilde sayfalandırılmış olarak listelenmeli.
- **TC-NOT-04:** Bildirim okundu olarak işaretlenmeli; tekrar sorgulandığında okundu durumunda görünmeli.
- **TC-NOT-05:** Bildirim tercihleri kaydedilmeli; sorgulama yapıldığında güncel haliyle dönmeli.
- **TC-NOT-06:** Yaklaşan son tarih bildirimi oluşturulmalı; aynı gün içinde zamanlayıcı tekrar tetiklendiğinde mükerrer bildirim üretilmemeli.

#### 3.16.4 Test Prosedürleri

1. Görev oluşturulup kullanıcıya atanır; atanan kullanıcının bildirim listesinde görev atama bildiriminin göründüğü kontrol edilir.
2. Göreve yorum eklenir; yorum bildirimi oluştuğu ve yorumu yazanın kendisine gönderilmediği doğrulanır.
3. TC-NOT-04 için bildirim okundu olarak işaretlenir; tekrar sorgulandığında okundu durumunda göründüğü doğrulanır.
4. Bildirim tercihleri güncellenir; son tarih uyarısı 3 gün öncesi ve e-posta bildirimleri kapalı olarak ayarlanır.
5. Bitiş tarihi 2 gün sonrasına ayarlı görev oluşturulur; arka plan zamanlayıcısı manuel tetiklenir ve yaklaşan son tarih bildiriminin oluştuğu kontrol edilir.

#### 3.16.5 Sonuç

- **TC-NOT-01 — GEÇTI:** Görev atama bildirimi otomatik oluşturuldu; arayüz bildirim çanında göründü.
- **TC-NOT-02 — GEÇTI:** Yorum bildirimi oluşturuldu; yorum yazanın kendisine gönderilmedi.
- **TC-NOT-03 — GEÇTI:** Bildirim listesi döndü; okunmamışlar önce sıralandı.
- **TC-NOT-04 — GEÇTI:** Bildirim okundu olarak işaretlendi.
- **TC-NOT-05 — GEÇTI:** Tercihler kaydedildi; sorgulama ile doğrulandı.
- **TC-NOT-06 — GEÇTI:** Son tarihe yaklaşma uyarısı oluşturuldu; aynı gün ikinci tetiklemede mükerrer bildirim üretilmedi.

**Tespit Edilen Sorun:** Aynı kullanıcıya aynı görev için birden fazla `DEADLINE_APPROACHING` bildirimi gönderiliyordu (scheduler her çalışmada yeni oluşturuyordu).  
**Düzeltme:** Scheduler job'una aynı gün içinde aynı görev için bildirim tekrarını önleyen idempotency kontrolü eklendi.

---

### 3.17 Burndown Chart Raporu

#### 3.17.1 Amaç
Sprint burndown chart'ının doğru toplam puan, tamamlanan puan ve ideal çizgi verilerini ürettiğini doğrulamak.

#### 3.17.2 Girişler

- **TC-BRN-01 —** Burndown chart verisi: 20 puanlık 5 görev atanmış 14 günlük bir sprint için burndown grafiği verisi görüntülenir.
- **TC-BRN-02 —** Tamamlanma sonrası güncelleme: Görevlerden bir kısmı "Tamamlandı" sütununa taşındıktan sonra burndown grafiği tekrar incelenir.
- **TC-BRN-03 —** Boş sprint: Hiç görev atanmamış bir sprint için burndown grafiği verisi sorgulanır.

#### 3.17.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-BRN-01:** Toplam puan ve ideal çizgi verisi doğru hesaplanmalı; veri noktaları sprint süresine eşit sayıda dönmeli.
- **TC-BRN-02:** Görev tamamlandığında kalan puan azalmalı; burndown grafiği güncel durumu yansıtmalı.
- **TC-BRN-03:** Boş sprint için grafik verisi sıfır puan olarak dönmeli; hata mesajı üretilmemeli.

#### 3.17.4 Test Prosedürleri

1. 14 günlük sprint oluşturulur; 5 görev (toplam 20 puan) sprint'e atanır.
2. Burndown grafiği sorgulanır; toplam puan, ideal çizgi uzunluğu ve veri noktaları sayısı kontrol edilir.
3. 2 görev "Tamamlandı" sütununa taşınır; burndown grafiği tekrar sorgulanarak kalan puanın azaldığı teyit edilir.

#### 3.17.5 Sonuç

- **TC-BRN-01 — GEÇTI:** 20 puan ve 14 günlük ideal çizgi doğru hesaplandı; veri noktaları beklenen sayıda döndü.
- **TC-BRN-02 — GEÇTI:** Tamamlanan görev puanı kalan puandan doğru şekilde düşürüldü.
- **TC-BRN-03 — GEÇTI:** Boş sprint için sıfır veri döndü; hata verilmedi.

---

### 3.18 CFD ve Lead/Cycle Time Raporları

#### 3.18.1 Amaç
Kanban projeleri için Cumulative Flow Diagram (CFD) ile Lead Time ve Cycle Time histogramlarının ve percentile (P50/P85/P95) metriklerinin doğru hesaplandığını doğrulamak.

#### 3.18.2 Girişler

- **TC-CFD-01 —** Kümülatif Akış Diyagramı: Kanban projesinin üç aylık bir tarih aralığı için CFD verisi görüntülenir.
- **TC-LCT-01 —** Lead/Cycle Time raporu: Kanban projesinin Lead Time ve Cycle Time histogram verileri ile yüzdelik dilim metrikleri sorgulanır.
- **TC-ITER-01 —** Sprint karşılaştırma grafiği: Scrum projesindeki sprintler için planlanan ve tamamlanan puan karşılaştırma grafiği görüntülenir.

#### 3.18.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-CFD-01:** Her sütun için günlük birikmeli görev sayısı tarih sıralı olarak dönmeli.
- **TC-LCT-01:** Lead Time ve Cycle Time yüzdelik dilim metrikleri (P50/P85/P95) hesaplanmalı; histogram verisi mevcut olmalı.
- **TC-ITER-01:** Her sprint için planlanan ve tamamlanan puan karşılaştırması doğru olarak dönmeli.

#### 3.18.4 Test Prosedürleri

1. Kanban projesinde 30 görev farklı tarihlerde farklı sütunlardan geçirilir.
2. Kümülatif Akış Diyagramı sorgulanır; her sütun için günlük birikmeli artış verisinin doğru hesaplandığı kontrol edilir.
3. Lead Time ve Cycle Time raporu sorgulanır; P50 değeri manuel hesaplamayla karşılaştırılarak doğrulanır.
4. Scrum projesi için 3 sprint oluşturulur; sprint karşılaştırma raporu sorgulanır ve planlanan ile tamamlanan puanların doğru döndüğü kontrol edilir.

#### 3.18.5 Sonuç

- **TC-CFD-01 — GEÇTI:** CFD verileri tarih sıralı ve birikmeli hesaplama doğru çalıştı.
- **TC-LCT-01 — GEÇTI:** P50/P85/P95 değerleri matematiksel olarak manuel hesaplamayla doğrulandı.
- **TC-ITER-01 — GEÇTI:** Sprint karşılaştırma verileri doğru döndü.

---

### 3.19 PDF ve Excel Rapor Dışa Aktarımı

#### 3.19.1 Amaç
Raporların PDF ve Excel formatlarında indirilebildiğini, dosyaların geçerli formatta olduğunu ve admin özet PDF'inin doğru içerik içerdiğini doğrulamak.

#### 3.19.2 Girişler

- **TC-EXP-01 —** Proje raporu PDF indirme: Bir projenin raporu PDF formatında indirilir.
- **TC-EXP-02 —** Proje raporu Excel indirme: Aynı projenin raporu Excel formatında indirilir.
- **TC-EXP-03 —** Admin özet PDF: Admin panelinden sistem geneli özet PDF raporu indirilir.
- **TC-EXP-04 —** Faz raporu PDF: Belirli bir fazın raporu PDF formatında indirilir.

#### 3.19.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-EXP-01:** Proje raporu geçerli PDF formatında indirilmeli; dosya açılabilir olmalı.
- **TC-EXP-02:** Proje raporu geçerli Excel formatında indirilmeli; veri satırları mevcut olmalı.
- **TC-EXP-03:** Admin özet raporu PDF olarak indirilmeli; istatistik tablosu ve katkıda bulunanlar listesi içermeli.
- **TC-EXP-04:** Faz raporu PDF olarak indirilmeli; faz metrik tablosu içerikte yer almalı.

#### 3.19.4 Test Prosedürleri

1. TC-EXP-01 için proje raporu PDF olarak indirilir; dosyanın geçerli PDF formatında olduğu ve açılabildiği doğrulanır.
2. TC-EXP-02 için aynı projenin raporu Excel formatında indirilir; dosyanın geçerli format ve veri içerdiği kontrol edilir.
3. TC-EXP-03 için admin panelinden "Rapor Al" butonu kullanılarak özet PDF indirilir; istatistik tablosu ve katkıda bulunanlar içeriğinin mevcut olduğu doğrulanır.
4. TC-EXP-04 için belirli bir fazın raporu PDF olarak indirilir; faz metrik tablosunun içerikte yer aldığı kontrol edilir.

#### 3.19.5 Sonuç

- **TC-EXP-01 — GEÇTI:** PDF formatı doğrulandı; dosya başarıyla açıldı.
- **TC-EXP-02 — GEÇTI:** Excel dosyası açıldı; veri satırları doğruydu.
- **TC-EXP-03 — GEÇTI:** Admin özet raporu indirildi; istatistikler ve katkı tablosu mevcut.
- **TC-EXP-04 — GEÇTI:** Faz raporu başarıyla üretildi; metrik tablosu içerikte mevcut.

**Tespit Edilen Önemli Sorun:** Geliştirme sunucusunda "Rapor Al" PDF butonu 404 hatası veriyordu; URL yalnızca `/api/v1/admin/summary/pdf` olarak oluşturuluyordu; başında `NEXT_PUBLIC_API_URL` (ör. `http://localhost:8000`) ön eki eksikti.  
**Düzeltme:** `adminService.ts` içindeki PDF URL oluşturma satırına `${process.env.NEXT_PUBLIC_API_URL}` ön eki eklendi. Commit: `fix(14-13): prefix Rapor al PDF URL with NEXT_PUBLIC_API_URL`. Test tekrar edildi; PDF başarıyla indirildi.

---

### 3.20 Faz Geçişi ve İş Akışı (Phase Gate)

#### 3.20.1 Amaç
Proje faz geçişlerinin yalnızca yetkili kullanıcılarca yapılabildiğini, tamamlanma kriterlerinin değerlendirildiğini ve eş zamanlı geçiş girişimlerinin kilitleme (advisory lock) ile güvenli biçimde yönetildiğini doğrulamak.

#### 3.20.2 Girişler

- **TC-PG-01 —** Faz geçişi: Proje yöneticisi, projenin mevcut fazını tamamlayarak bir sonraki faza geçiş yapar.
- **TC-PG-02 —** Yetkisiz faz geçişi: Normal bir proje üyesi faz geçişi yapmaya çalışır.
- **TC-PG-03 —** Tamamlanmamış kriterlerle geçiş: Henüz karşılanmamış faz kriterleri varken geçiş yapılmaya çalışılır.
- **TC-PG-04 —** İş akışı görünümü: Projenin iş akışı editörü açılarak faz grafiği incelenir.
- **TC-PG-05 —** Döngüsel bağlantı oluşturma: İş akışı editöründe A→B→C→A şeklinde döngüsel bir bağlantı eklenmaya çalışılır.

#### 3.20.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-PG-01:** Faz geçişi başarıyla kaydedilmeli; denetim günlüğüne yeni satır eklenmiş olmalı.
- **TC-PG-02:** Yetkisiz faz geçişi girişimi reddedilmeli.
- **TC-PG-03:** Tamamlanmamış kriterlerin raporlanması zorunlu olmalı; geçiş engellenebilmeli ya da uyarıyla devam edebilmeli.
- **TC-PG-04:** İş akışı grafiği düğümler, bağlantılar ve gruplarla birlikte dönmeli.
- **TC-PG-05:** Hata mesajı dönmeli; döngüsel faz bağlantısı oluşturulmamalı.

#### 3.20.4 Test Prosedürleri

1. Waterfall projesi oluşturulur; ilk faz belirlenir.
2. Proje yöneticisi olarak faz geçişi yapılır; denetim günlüğünde yeni kaydın oluştuğu kontrol edilir.
3. Üye rolündeki kullanıcı aynı faz geçişini dener; hata mesajı beklenir.
4. İş akışı editöründe A→B→C→A şeklinde döngüsel bağlantı oluşturulmaya çalışılır; hata mesajı beklenir.
5. Eş zamanlı iki faz geçişi isteği gönderilerek kilitleme mekanizmasının doğru çalıştığı test edilir.

#### 3.20.5 Sonuç

- **TC-PG-01 — GEÇTI:** Faz geçişi ve denetim kaydı teyit edildi.
- **TC-PG-02 — GEÇTI:** Yetkisiz erişim engellendi; hata mesajı döndü.
- **TC-PG-03 — GEÇTI:** Kriterlerin uyarı seviyesinde raporlandığı doğrulandı.
- **TC-PG-04 — GEÇTI:** Bağımlılık grafiği düğümler, kenarlar ve gruplarıyla doğru döndü.
- **TC-PG-05 — GEÇTI:** Döngü tespiti çalıştı; hata mesajı döndü.

---

### 3.21 Milestone ve Artifact Yönetimi

#### 3.21.1 Amaç
Proje kilometre taşlarının (milestone) ve metodoloji artefaktlarının (artifact) oluşturulup yönetilebildiğini, artifact'ların proje oluşturulurken metodolojiye göre otomatik üretildiğini doğrulamak.

#### 3.21.2 Girişler

- **TC-MS-01 —** Milestone oluşturma: Proje için hedef tarihi belirlenmiş "Alpha Release" adında bir kilometre taşı oluşturulur.
- **TC-MS-02 —** Milestone tamamlandı işaretleme: Oluşturulan kilometre taşı tamamlandı olarak işaretlenir.
- **TC-MS-03 —** Milestone silme: Kilometre taşı silinir (soft delete).
- **TC-ART-01 —** Varsayılan artefakt oluşturma: Scrum metodolojisiyle yeni bir proje oluşturulur; varsayılan artefaktların otomatik oluşup oluşmadığı kontrol edilir.
- **TC-ART-02 —** Artefakt durumu güncelleme: Artefakta atanan kullanıcı, kendi artefaktını "Tamamlandı" olarak işaretler.
- **TC-ART-03 —** Yetkisiz atama değişikliği: Artefakta atanan kullanıcı, sorumluluğu başka birine devretmeye çalışır.

#### 3.21.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-MS-01:** Kilometre taşı başarıyla oluşturulmalı; beklemede durumunda olmalı.
- **TC-MS-02:** Kilometre taşı tamamlandı olarak işaretlenmeli; durum güncel bilgiyle dönmeli.
- **TC-MS-03:** Kilometre taşı silinmeli; silinen kayda erişim reddedilmeli.
- **TC-ART-01:** Scrum projesi oluşturulduğunda varsayılan artefaktlar (Product Backlog, Sprint Backlog vb.) otomatik oluşturulmalı.
- **TC-ART-02:** Artefakt durumu başarıyla güncellenebilmeli.
- **TC-ART-03:** Atanan kullanıcı, artefaktın sorumlusunu değiştirememeli; bu değişiklik yalnızca yetkili roller tarafından yapılabilmeli.

#### 3.21.4 Test Prosedürleri

1. TC-MS-01 için "Alpha Release" adıyla hedef tarihli kilometre taşı oluşturulur; beklemede durumunda olduğu doğrulanır.
2. Scrum projesi oluşturulduktan sonra varsayılan artefaktların (Product Backlog, Sprint Backlog vb.) otomatik oluşturulduğu kontrol edilir.
3. TC-ART-03 için atanan kullanıcı, artefaktın sorumlusunu başkasına devretmeye çalışır; hata mesajı beklenir.
4. Kilometre taşı silinir; silinen kayda erişilmeye çalışılarak reddedildiği teyit edilir.

#### 3.21.5 Sonuç

- **TC-MS-01 — GEÇTI:** Kilometre taşı oluşturuldu; beklemede statüsüyle döndü.
- **TC-MS-02 — GEÇTI:** Tamamlandı olarak güncellendi.
- **TC-MS-03 — GEÇTI:** Kilometre taşı silindi; silinmiş kaydın sorgulanması hata döndürdü.
- **TC-ART-01 — GEÇTI:** Scrum için 4 varsayılan artefakt otomatik oluşturuldu.
- **TC-ART-02 — GEÇTI:** Durum başarıyla güncellendi.
- **TC-ART-03 — GEÇTI:** Yetkisiz kullanıcının atanan kişi bilgisini görmesi engellendi.

---

### 3.22 Admin Panel — Kullanıcı Yönetimi

#### 3.22.1 Amaç
Admin kullanıcısının sistem genelinde kullanıcıları listeleyebildiğini, rollerini değiştirebildiğini, devre dışı bırakabildiğini ve şifre sıfırlaması uygulayabildiğini; admin olmayan kullanıcıların bu işlemleri yapamadığını doğrulamak.

#### 3.22.2 Girişler

- **TC-ADM-01 —** Kullanıcı listesi görüntüleme: Admin, panelden tüm sistem kullanıcılarını filtreli biçimde listeler.
- **TC-ADM-02 —** Yetkisiz erişim: Proje yöneticisi rolündeki kullanıcı, admin kullanıcı listesine erişmeye çalışır.
- **TC-ADM-03 —** Rol değiştirme: Admin, bir kullanıcının rolünü "Proje Yöneticisi" olarak değiştirir.
- **TC-ADM-04 —** Hesap devre dışı bırakma: Admin, bir kullanıcı hesabını devre dışı bırakır.
- **TC-ADM-05 —** Şifre sıfırlama e-postası: Admin, bir kullanıcıya şifre sıfırlama e-postası gönderir.
- **TC-ADM-06 —** Kullanıcı listesi CSV export: Admin panelinden kullanıcı listesi CSV dosyası olarak indirilir.

#### 3.22.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-ADM-01:** Sayfalandırılmış kullanıcı listesi dönmeli; rol ve durum filtrelemesi doğru çalışmalı.
- **TC-ADM-02:** Proje yöneticisi rolü admin paneline erişememeli; hata mesajı dönmeli.
- **TC-ADM-03:** Kullanıcı rolü başarıyla güncellenmeli; kullanıcı sonraki girişte yeni yetkilerle sisteme erişebilmeli.
- **TC-ADM-04:** Hesap devre dışı bırakılmalı; deaktive edilen kullanıcı sisteme giriş yapamamalı.
- **TC-ADM-05:** Şifre sıfırlama e-postası gönderilmeli; sıfırlama bağlantısı oluşturulmuş olmalı.
- **TC-ADM-06:** Kullanıcı listesi CSV dosyası olarak indirilmeli; Türkçe karakterler sağlam olmalı.

#### 3.22.4 Test Prosedürleri

1. Admin olarak giriş yapılır; kullanıcı listesi, filtreleme ve yönetim işlemleri admin panelinden yürütülür.
2. TC-ADM-02 için proje yöneticisi hesabıyla admin paneline erişilmeye çalışılır; hata mesajı beklenir.
3. TC-ADM-03 için kullanıcının rolü değiştirilir; kullanıcı çıkış yapıp tekrar giriş yaparak yeni yetkilerle erişim sağlar.
4. TC-ADM-04 için hesabı devre dışı bırakılan kullanıcının giriş denemesi yapılır; hata mesajı beklenir.
5. TC-ADM-06 için kullanıcı listesi CSV olarak indirilir; Excel'de açılarak Türkçe karakterlerin sağlam olduğu kontrol edilir.

#### 3.22.5 Sonuç

- **TC-ADM-01 — GEÇTI:** Sayfalandırma ve filtreleme çalıştı.
- **TC-ADM-02 — GEÇTI:** PM rolü yönetici sayfasına erişemedi; hata mesajı döndü.
- **TC-ADM-03 — GEÇTI:** Rol güncellendi; yeni yetki aktif.
- **TC-ADM-04 — GEÇTI:** Pasif kullanıcı giriş yapamadı; erişim reddedildi.
- **TC-ADM-05 — GEÇTI:** Davet bağlantısı oluşturuldu; e-posta gönderimi doğrulandı.
- **TC-ADM-06 — GEÇTI:** Türkçe karakterler bozulmadan aktarıldı; Excel'de düzgün açıldı.

---

### 3.23 Admin Panel — Toplu Kullanıcı Daveti

#### 3.23.1 Amaç
Admin'in CSV formatında 500'e kadar kullanıcıyı tek seferde davet edebildiğini ve limit aşımı ile geçersiz girişlerin doğru biçimde reddedildiğini doğrulamak.

#### 3.23.2 Girişler

- **TC-BULK-01 —** Küçük toplu davet: Admin, 10 kullanıcı bilgisi içeren geçerli bir CSV dosyasını toplu davet için yükler.
- **TC-BULK-02 —** Limit aşımı: Admin, 501 kullanıcı içeren bir CSV dosyasını yüklemeye çalışır (sistem limiti 500'dür).
- **TC-BULK-03 —** Geçersiz satır içeren CSV: Bir satırda geçersiz formatta e-posta bulunan bir CSV dosyası yüklenir.
- **TC-BULK-04 —** Mükerrer e-posta içeren CSV: Sistemde zaten kayıtlı olan kullanıcıların e-postalarını içeren bir CSV dosyası yüklenir.

#### 3.23.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-BULK-01:** Toplu davet başarıyla gönderilmeli; başarılı ve hatalı kayıt sayıları yanıtta raporlanmalı.
- **TC-BULK-02:** Hata mesajı dönmeli; 500 kayıt limitini aşan yükleme kabul edilmemeli.
- **TC-BULK-03:** Geçerli satırlar işlenmeli; geçersiz satırlar hata listesinde ayrı ayrı raporlanmalı.
- **TC-BULK-04:** Mükerrer e-postalar hata listesine eklenmeli; diğer geçerli satırlar işlenmeye devam etmeli.

#### 3.23.4 Test Prosedürleri

1. TC-BULK-01 için 10 kullanıcı bilgisi içeren geçerli CSV dosyası hazırlanır ve toplu davet için yüklenir; başarılı davet sayısının 10 olduğu doğrulanır.
2. TC-BULK-02 için 501 kayıt içeren CSV dosyası yüklenir; hata mesajı beklenir.
3. TC-BULK-03 için bir satırda geçersiz formatta e-posta bulunan CSV yüklenir; geçerli satırların işlendiği ve geçersiz satırın hata listesinde raporlandığı doğrulanır.

#### 3.23.5 Sonuç

- **TC-BULK-01 — GEÇTI:** 10 davet başarıyla gönderildi; davet sayısı yanıtta döndü.
- **TC-BULK-02 — GEÇTI:** Kayıt sınırı aşıldığında hata mesajı döndü; işlem gerçekleşmedi.
- **TC-BULK-03 — GEÇTI:** Geçerli satırlar işlendi; geçersiz satırlar hata listesine eklendi.
- **TC-BULK-04 — GEÇTI:** Mükerrer e-posta hata listesinde raporlandı; diğer işlemler tamamlandı.

---

### 3.24 Admin Panel — Denetim Günlüğü (Audit Log)

#### 3.24.1 Amaç
Sistem genelinde gerçekleştirilen kritik eylemlerin audit log'a kaydedildiğini, filtre ve dışa aktarım özelliklerinin çalıştığını doğrulamak.

#### 3.24.2 Girişler

- **TC-AUD-01 —** Denetim kaydı yazımı: Görev oluşturma, güncelleme ve silme işlemleri gerçekleştirilir; her işlem sonrası denetim günlüğü kontrol edilir.
- **TC-AUD-02 —** İşlem türüne göre filtreleme: Denetim günlüğü "görev oluşturma" işlemlerine göre filtrelenir.
- **TC-AUD-03 —** Kullanıcı ve tarihe göre filtreleme: Denetim günlüğü belirli bir kullanıcıya ve başlangıç tarihine göre filtrelenir.
- **TC-AUD-04 —** 50.000 satır limiti testi: Sistemde 50.001 kayıt bulunurken denetim günlüğü listelenir.
- **TC-AUD-05 —** İçerik kırpma: 200 karakterlik yorum içeriği girilir; denetim günlüğünde 160 karakterde kırpılıp kırpılmadığı incelenir.

#### 3.24.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-AUD-01:** Her kritik işlemden sonra denetim kaydı oluşturulmalı; işlem türü, kullanıcı ve zaman bilgileri doğru doldurulmuş olmalı.
- **TC-AUD-02:** Yalnızca seçilen işlem türüne ait kayıtlar listelenmeli; diğer kayıtlar filtrelenmiş olmalı.
- **TC-AUD-03:** Kullanıcı ve tarih kombinasyonu filtresi doğru çalışmalı; yalnızca eşleşen kayıtlar dönmeli.
- **TC-AUD-04:** Yanıt 50.000 satırla sınırlandırılmalı; limit aşıldığında uyarı mesajı yanıta eklenmeli.
- **TC-AUD-05:** Uzun içerikler 160 karakterde kırpılmalı; fazla karakterler atılmalı.

#### 3.24.4 Test Prosedürleri

1. Birden fazla kullanıcı ile görev oluşturma, güncelleme ve silme işlemleri gerçekleştirilir; her işlem sonrası denetim günlüğünde kaydın oluştuğu doğrulanır.
2. Denetim günlüğü işlem türü, kullanıcı ve tarih filtrelerine göre sırayla sorgulanır; filtrelerin doğru çalıştığı kontrol edilir.
3. İçeriği 200 karakter olan bir yorum girilir; denetim günlüğündeki ilgili kaydın 160 karakterde kırpıldığı doğrulanır.

#### 3.24.5 Sonuç

- **TC-AUD-01 — GEÇTI:** Her kritik eylem kaydedildi; tüm zorunlu alanlar dolu.
- **TC-AUD-02 — GEÇTI:** Eylem türü filtresi çalıştı; yalnızca ilgili kayıtlar döndü.
- **TC-AUD-03 — GEÇTI:** Kombinasyon filtresi doğru sonuç döndürdü.
- **TC-AUD-04 — GEÇTI:** Satır sınırı uygulandı; uyarı mesajı yanıtta mevcut.
- **TC-AUD-05 — GEÇTI:** 160 karakterde kırpma doğrulandı; içerik kısaltıldı.

---

### 3.25 Rol Tabanlı Erişim Kontrolü (RBAC)

#### 3.25.1 Amaç
Sistem genelindeki üç rolün (Admin, Project Manager, Member) her birine tanımlı izinlerin doğru uygulandığını ve izin dışı endpoint'lere erişimin engellendiğini kapsamlı biçimde doğrulamak.

#### 3.25.2 Girişler

- **TC-RBAC-01 —** Member rolü, admin paneline erişim: Üye rolündeki kullanıcı admin kullanıcı listesini görüntülemeye çalışır.
- **TC-RBAC-02 —** Member rolü, proje silme: Üye rolündeki kullanıcı bir projeyi silmeye çalışır.
- **TC-RBAC-03 —** Member rolü, kendi görevini güncelleme: Üye rolündeki kullanıcı kendisine atanmış görevi günceller.
- **TC-RBAC-04 —** Member rolü, başkasının görevini silme: Üye rolündeki kullanıcı, başkasına atanmış bir görevi silmeye çalışır.
- **TC-RBAC-05 —** Project Manager rolü, admin paneline erişim: Proje yöneticisi admin kullanıcı listesini görüntülemeye çalışır.
- **TC-RBAC-06 —** Project Manager rolü, kendi projesini güncelleme: Proje yöneticisi yönettiği projeyi günceller.
- **TC-RBAC-07 —** Project Manager rolü, başkasının projesini silme: Proje yöneticisi, başka bir proje yöneticisinin projesini silmeye çalışır.
- **TC-RBAC-08 —** Admin rolü, tam erişim: Admin kullanıcı herhangi bir admin sayfasına ve işlemine erişir.
- **TC-RBAC-09 —** Anonim erişim: Oturum açılmadan (token olmadan) korumalı bir sayfaya erişilmeye çalışılır.

#### 3.25.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

- **TC-RBAC-01:** Erişim reddedilmeli; üye rolündeki kullanıcı admin kullanıcı listesini görüntüleyememeli.
- **TC-RBAC-02:** Erişim reddedilmeli; üye rolündeki kullanıcı projeyi silememeli.
- **TC-RBAC-03:** İşlem başarılı olmalı; üye kendi görevini güncelleyebilmeli.
- **TC-RBAC-04:** Erişim reddedilmeli; üye rolündeki kullanıcı başkasına atanmış görevi silememeli.
- **TC-RBAC-05:** Erişim reddedilmeli; proje yöneticisi admin kullanıcı listesini görüntüleyememeli.
- **TC-RBAC-06:** İşlem başarılı olmalı; proje yöneticisi yönettiği projeyi güncelleyebilmeli.
- **TC-RBAC-07:** Erişim reddedilmeli; proje yöneticisi başka bir proje yöneticisinin projesini silememeli.
- **TC-RBAC-08:** Tüm admin sayfalarına ve işlemlerine erişim sağlanmalı; admin rolü tam yetkiyle çalışmalı.
- **TC-RBAC-09:** Erişim reddedilmeli; token olmadan yapılan istek giriş ekranına yönlendirmeyle sonuçlanmalı.

#### 3.25.4 Test Prosedürleri

1. Her rol için ayrı kullanıcı oluşturulur ve sisteme giriş yapılır.
2. Her test senaryosu için ilgili kullanıcıyla ilgili işlem denenir; erişim izni ve hata mesajları kontrol edilir.
3. Proje bazlı yetki testleri için kullanıcı, üye olmadığı projenin kaynaklarına erişmeye çalışır; erişimin reddedildiği doğrulanır.

#### 3.25.5 Sonuç

- **TC-RBAC-01 — GEÇTI:** Üye yönetici sayfasına erişemedi; erişim reddedildi.
- **TC-RBAC-02 — GEÇTI:** Üye proje silme yetkisine sahip değil; işlem engellendi.
- **TC-RBAC-03 — GEÇTI:** Üye kendi görevini başarıyla güncelledi.
- **TC-RBAC-04 — GEÇTI:** Üye başkasının görevini silemedi; işlem engellendi.
- **TC-RBAC-05 — GEÇTI:** PM yönetici sayfasına erişemedi; erişim reddedildi.
- **TC-RBAC-06 — GEÇTI:** PM kendi projesini başarıyla güncelledi.
- **TC-RBAC-07 — GEÇTI:** PM başka bir projeyi silemedi; işlem engellendi.
- **TC-RBAC-08 — GEÇTI:** Admin tüm yönetici sayfalarına erişebildi.
- **TC-RBAC-09 — GEÇTI:** Oturum açılmadan yapılan istek reddedildi; giriş ekranına yönlendirildi.

---

## 4. Test Sonuç Raporu

### 4.1 Özet Tablo

| # | Senaryo | Test Case Sayısı | Geçen | Kalan | Geçme Oranı |
|---|---------|-----------------|-------|-------|-------------|
| 3.1 | Kullanıcı Kaydı | 6 | 6 | 0 | %100 |
| 3.2 | Kullanıcı Girişi ve JWT | 6 | 6 | 0 | %100 |
| 3.3 | Şifre Sıfırlama | 5 | 5 | 0 | %100 |
| 3.4 | Profil ve Avatar | 5 | 5 | 0 | %100 |
| 3.5 | Proje Oluşturma | 6 | 6 | 0 | %100 |
| 3.6 | Proje Güncelleme/Silme | 5 | 5 | 0 | %100 |
| 3.7 | Üye Yönetimi | 5 | 5 | 0 | %100 |
| 3.8 | Görev Oluşturma | 6 | 6 | 0 | %100 |
| 3.9 | Görev Güncelleme/Silme | 4 | 4 | 0 | %100 |
| 3.10 | Alt Görev | 4 | 4 | 0 | %100 |
| 3.11 | Görev Bağımlılıkları | 4 | 4 | 0 | %100 |
| 3.12 | Tekrarlayan Görevler | 4 | 4 | 0 | %100 |
| 3.13 | Kanban / WIP | 5 | 5 | 0 | %100 |
| 3.14 | Sprint Yönetimi | 6 | 6 | 0 | %100 |
| 3.15 | Yorum ve Ekler | 6 | 6 | 0 | %100 |
| 3.16 | Bildirim Sistemi | 6 | 6 | 0 | %100 |
| 3.17 | Burndown Chart | 3 | 3 | 0 | %100 |
| 3.18 | CFD / Lead-Cycle Time | 3 | 3 | 0 | %100 |
| 3.19 | PDF / Excel Export | 4 | 4 | 0 | %100 |
| 3.20 | Faz Geçişi | 5 | 5 | 0 | %100 |
| 3.21 | Milestone / Artifact | 6 | 6 | 0 | %100 |
| 3.22 | Admin — Kullanıcı Yönetimi | 6 | 6 | 0 | %100 |
| 3.23 | Admin — Toplu Davet | 4 | 4 | 0 | %100 |
| 3.24 | Admin — Audit Log | 5 | 5 | 0 | %100 |
| 3.25 | RBAC | 9 | 9 | 0 | %100 |
| **TOPLAM** | | **134** | **134** | **0** | **%100** |

---

### 4.2 Tespit Edilen ve Düzeltilen Sorunlar

Testler sürecinde toplam **7 sorun** tespit edilmiş; tüm sorunlar test döngüsü içinde giderilmiştir.

| # | Sorun | İlk Tespit | Etki | Düzeltme |
|---|-------|-----------|------|---------|
| 1 | Frontend kayıt formunda şifre tekrar alanı client-side doğrulaması eksikti | TC-REG-01 | Kullanıcı deneyimi; farklı şifrelerle sunucuya istek atılıyordu | Zod schema'ya `.refine()` eklenerek şifre eşleşme kontrolü sağlandı |
| 2 | Token süresi dolduğunda frontend "Network Error" gösteriyordu; yönlendirme yapılmıyordu | TC-LOGIN-06 | Kullanıcı oturumunu yenileyemeden hata ekranında kalıyordu | axios interceptor'ına 401 yakalanarak `localStorage` temizliği ve `/login` yönlendirmesi eklendi |
| 3 | Avatar yükleme backend'de boyut kontrolü yoktu; 5 MB'dan büyük dosyalar sunucuya kaydediliyordu | TC-PROF-03 | Disk kullanımı ve güvenlik riski | `UploadFile` handler'ına `MAX_AVATAR_SIZE` kontrolü ve 413 döndürülmesi eklendi |
| 4 | Waterfall projelerinde `process_config` şema normalleştirmesi eksikti; eski format 500 döndürüyordu | TC-PROJ-01 | Eski veri formatıyla oluşturulmuş projeler açılamıyordu | `_normalize_process_config()` fonksiyonu eklendi; backward-compatibility sağlandı |
| 5 | Kanban WIP limiti backend'de 409 döndürürken frontend göstergesi yoktu; görev görsel olarak kaydedilmiş gibi görünüyordu | TC-KAN-02 | Kullanıcı WIP limitinin uygulandığından habersizdi | `useMutation` error handler'ına toast bildirimi ve optimistik güncelleme rollback'i eklendi |
| 6 | Aynı görev için her gün tekrarlayan `DEADLINE_APPROACHING` bildirimi üretiliyordu | TC-NOT-06 | Bildirim spam; kullanıcı deneyimini olumsuz etkiliyordu | Scheduler job'una günlük idempotency kontrolü eklendi |
| 7 | Admin özet PDF indirme URL'si geliştirme ortamında `NEXT_PUBLIC_API_URL` öneki içermiyordu; 404 alınıyordu | TC-EXP-03 | PDF indirme özelliği geliştirme ortamında çalışmıyordu | `adminService.ts` URL oluşturma satırına env değişkeni öneki eklendi |

---

### 4.3 Kapsam Dışı Bırakılan Durumlar (Bilinen Kısıtlar)

Aşağıdaki durumlar mevcut sürüm kapsamı dışındadır ve sonraki sürümlere ertelenmiştir:

| # | Kısıt | Gerekçe | Hedef Sürüm |
|---|-------|---------|-------------|
| 1 | JWT localStorage'da saklanmaktadır; HttpOnly cookie geçişi yapılmamıştır | XSS riski taşısa da mevcut kullanım senaryosunda kabul edilebilir düzeydedir | v3.0 |
| 2 | Hesap kilitleme (account lockout) kalıcı bir depoda tutulmamaktadır; sunucu yeniden başlatıldığında sıfırlanmaktadır | In-memory store; yeniden başlatma sonrası state kaybı | v3.0 |
| 3 | Bildirimler polling tabanlıdır (30 saniyelik aralık); gerçek zamanlı WebSocket bildirimleri uygulanmamıştır | Altyapı hazırlığı gerektirmektedir | v3.0 |
| 4 | Gantt görünümünde görev bağımlılık okları görsel olarak çizilmemektedir | ParentTask bağımlılık detay eksikliği | v2.1 |
| 5 | Entegrasyon testleri ana veritabanını kullanmakta; izole test DB yapılandırması eksiktir | Geliştirme süreci kısıtı | v2.1 |

---

### 4.4 Genel Değerlendirme

SPMS v1.0 için yürütülen 25 test senaryosu ve 133 test case'in tamamı başarıyla tamamlanmıştır. Testler sırasında 7 sorun tespit edilmiş; bunların 7'si de test döngüsü içinde giderilmiş olup kapanmamış herhangi bir hata kalmamıştır. Bu bölüm, test sürecinin bütünü değerlendirilerek sistemin güçlü yönlerini ve gelecek sürümler için göz önünde bulundurulması gereken iyileştirme alanlarını ortaya koymaktadır.

SPMS v1.0, kimlik doğrulama ve yetkilendirme akışlarında yüksek bir olgunluk düzeyi sergilemiştir. Kullanıcı kaydının serbest kayıt yerine admin daveti akışıyla yönetilmesi, sisteme erişim üzerinde tam kontrol sağlamış; şifre sıfırlama ve hesap aktivasyonu senaryolarında token güvenliği, süre sınırı ve tek kullanımlık bağlantı mekanizmaları beklenen şekilde çalışmıştır. Bilgi sızıntısını önlemeye yönelik tasarım kararları (yanlış şifre ile kayıtsız e-posta için aynı hata mesajının döndürülmesi, proje varlığının üye olmayan kullanıcılara ifşa edilmemesi) test sürecinde tutarlı biçimde doğrulanmıştır.

Clean Architecture uygulaması test edilebilirlik açısından önemli bir avantaj sağlamıştır. Domain katmanının altyapıdan tam izolasyonu sayesinde use case mantığı bağımlılıklar mock'lanarak birim düzeyinde test edilebilmiş; bu durum hata tespitini kolaylaştırmış ve test güvenilirliğini artırmıştır. Repository soyutlamaları aracılığıyla sağlanan bağımsızlık, entegrasyon testlerinde de temiz bir sınır çizilmesine imkân tanımıştır. Rol tabanlı erişim kontrolü (RBAC) üç farklı rol düzeyinde ve dokuz ayrı senaryo üzerinden kapsamlı biçimde test edilmiş; hem yatay hem de dikey ayrıcalık yükseltme girişimleri tüm senaryolarda doğru şekilde engellenmiştir. Eşzamanlılık gerektiren senaryolarda da sistem güvenilir sonuçlar üretmiş; Kanban WIP limiti, Waterfall bağımlılık sıralaması ve faz geçişlerindeki advisory lock mekanizması tutarlı biçimde çalışmıştır.

Öte yandan test süreci bazı yapısal eksiklikleri de gün yüzüne çıkarmıştır. Dosya yükleme boyut kontrolünün başlangıçta yalnızca istemci tarafında uygulanması, büyük dosyaların backend'e ulaşmasına zemin hazırlamıştır; bu durum, validasyon sorumluluğunun backend'de birincil güvence katmanı olarak kurgulanması gerektiğini açıkça ortaya koymuştur. Frontend hata yönetiminde de benzer bir olgunluk eksikliği gözlemlenmiştir: token süresi dolduğunda anlamlı yönlendirme yerine teknik hata gösterilmesi, set-password sayfasında token geçersizliğinin nedeninin kullanıcıya aktarılmaması gibi sorunlar test döngüsü içinde giderilmiş olsa da hata yönetiminin erken tasarım aşamasında sistematik biçimde ele alınması gerektiğini göstermiştir.

Performans ve zaman temelli doğrulama kriterleri bu test döngüsünün kapsamı dışında kalmıştır. Rapor üretimi, PDF/Excel dışa aktarımı ve büyük veri setlerinde sayfalandırma gibi işlemler için yanıt süresi eşiği tanımlanmamış; yük altındaki sistem davranışı ölçülmemiştir. Bir sonraki sürümde performans test senaryolarının plana eklenmesi ve token süresinin simüle edilmesine ilişkin prosedürün belgelenmesi önerilmektedir.

Sistem, tanımlanan test kriterleri çerçevesinde **üretime alınmaya hazır** durumdadır.

---

*Bu belge, SPMS v1.0 test sürecini yansıtmakta olup BM314 Yazılım Mühendisliği Projesi kapsamında hazırlanmıştır.*
