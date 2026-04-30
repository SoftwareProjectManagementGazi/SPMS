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

**WebSocket Gerçek Zamanlı Bildirimler:** v3.0 yol haritasına ertelenmiştir; mevcut sürümde polling sistemi kullanılmaktadır ve bu kapsam dahilindedir.

**HttpOnly Cookie Tabanlı JWT:** v3.0'a ertelenmiştir; aktif sürümde localStorage tabanlı JWT kullanılmaktadır.

**Redis Önbellek Katmanı:** Henüz uygulanmamıştır; kapsam dışıdır.

**Gantt Bağımlılık Okları (Görsel):** ParentTask bağımlılık detay eksikliği nedeniyle ertelenmiştir; v2.1 hedefindedir.

**Mobil Uygulama (iOS/Android):** Proje kapsamı yalnızca web uygulamasını içermektedir; mobil uygulama geliştirme kapsam dışıdır.

**Çoklu Kiracı (Multi-Tenant) Desteği:** v3.0 kapsamında planlanmaktadır; mevcut sürümde tek kiracılı mimari kullanılmaktadır.

**Slack/Teams Webhook Entegrasyonu Uçtan Uca:** Harici servisler gerektirdiği için otomasyona dahil edilmemiştir; servis katmanı birim düzeyinde mock ile test edilmiştir.

**Hesap Kilitleme (Lockout) Kalıcı Depolama:** Mevcut uygulama in-memory store kullanmaktadır; sunucu yeniden başlatıldığında durum sıfırlanmaktadır. Persistence davranışı testler kapsamına alınmamıştır.

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

### 3.1 Kullanıcı Kaydı

#### 3.1.1 Amaç
Yeni kullanıcıların sisteme başarılı biçimde kayıt olabildiğini, geçersiz veya mükerrer girişlerin uygun hata mesajlarıyla reddedildiğini doğrulamak.

#### 3.1.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-REG-01 | `{"email": "ayse@example.com", "password": "Test123!", "full_name": "Ayşe Öz"}` | Geçerli kayıt |
| TC-REG-02 | `{"email": "ayse@example.com", "password": "Test123!", "full_name": "Ayşe Öz"}` | Aynı e-posta ile tekrar kayıt |
| TC-REG-03 | `{"email": "gecersiz-email", "password": "Test123!", "full_name": "Test"}` | Geçersiz e-posta formatı |
| TC-REG-04 | `{"email": "test@example.com", "password": "123", "full_name": "Test"}` | Çok kısa şifre (< 8 karakter) |
| TC-REG-05 | `{"email": "", "password": "Test123!", "full_name": "Test"}` | Boş e-posta alanı |

#### 3.1.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen HTTP Kodu | Beklenen Yanıt | Geçme Kriteri |
|-----------|-------------------|----------------|---------------|
| TC-REG-01 | 201 Created | `{"id": ..., "email": "ayse@example.com", "full_name": "Ayşe Öz"}` | Yanıtta `id` ve `email` alanları dönmeli; şifre hash'i yanıtta yer almamalı |
| TC-REG-02 | 409 Conflict | `{"detail": "Bu e-posta adresi zaten kayıtlı."}` | Hata kodu 409, açıklayıcı mesaj |
| TC-REG-03 | 422 Unprocessable Entity | Validation hatası | Pydantic doğrulama hatası dönmeli |
| TC-REG-04 | 422 Unprocessable Entity | Şifre uzunluk hatası | Minimum uzunluk ihlali mesajı |
| TC-REG-05 | 422 Unprocessable Entity | Zorunlu alan hatası | `email` alanı zorunlu hatası |

#### 3.1.4 Test Prosedürleri

1. `pytest Backend/tests/integration/test_auth.py::test_register_success` komutu çalıştırılır.
2. `POST /api/v1/auth/register` endpoint'ine TC-REG-01 girdisi gönderilir; HTTP 201 ve dönen `id` kontrol edilir.
3. Aynı e-posta ile ikinci kayıt isteği gönderilir; HTTP 409 kontrolü yapılır.
4. TC-REG-03, TC-REG-04, TC-REG-05 için Pydantic validation hataları (422) doğrulanır.
5. Frontend kayıt formu üzerinden manuel test: boş alan bırakılarak Submit tıklanır, form validasyonu kontrol edilir.

#### 3.1.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-REG-01 | **GEÇTI** | Kullanıcı başarıyla oluşturuldu; şifre hash'i yanıtta bulunmadı |
| TC-REG-02 | **GEÇTI** | 409 döndü, hata mesajı Türkçe açıklayıcı nitelikteydi |
| TC-REG-03 | **GEÇTI** | 422 + Pydantic mesajı doğru biçimde döndü |
| TC-REG-04 | **GEÇTI** | Şifre minimum uzunluk kontrolü çalıştı |
| TC-REG-05 | **GEÇTI** | Zorunlu alan kontrolü çalıştı |

**Tespit Edilen Sorun:** İlk testte frontend kayıt formunda şifre tekrar alanı sunucu tarafına gönderilmeden önce client tarafında karşılaştırılmıyordu; kullanıcı farklı şifre girdiğinde sunucuya istek atılıyordu.  
**Düzeltme:** `RegisterForm` bileşenine Zod schema'sı eklenerek `confirm_password` client-side doğrulaması uygulandı; sunucu isteği ancak iki alan eşleştiğinde atılmaktadır.

---

### 3.2 Kullanıcı Girişi ve JWT Yönetimi

#### 3.2.1 Amaç
Doğru kimlik bilgileriyle giriş yapıldığında JWT access token üretildiğini, yanlış bilgilerle ve hesabı devre dışı kullanıcılarla girişin engellendiğini doğrulamak.

#### 3.2.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-LOGIN-01 | `{"email": "ayse@example.com", "password": "Test123!"}` | Geçerli giriş |
| TC-LOGIN-02 | `{"email": "ayse@example.com", "password": "YanlisParola"}` | Yanlış şifre |
| TC-LOGIN-03 | `{"email": "yok@example.com", "password": "Test123!"}` | Kayıtsız e-posta |
| TC-LOGIN-04 | Geçerli kimlik, devre dışı hesap | Admin tarafından deactivate edilmiş kullanıcı |
| TC-LOGIN-05 | Geçerli token ile `GET /api/v1/auth/me` | Token doğrulama |
| TC-LOGIN-06 | Süresi dolmuş token ile istek | 30 dakika sonra `GET /api/v1/auth/me` |

#### 3.2.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen HTTP Kodu | Beklenen Yanıt |
|-----------|-------------------|----------------|
| TC-LOGIN-01 | 200 OK | `{"access_token": "...", "token_type": "bearer"}` |
| TC-LOGIN-02 | 401 Unauthorized | `{"detail": "E-posta veya şifre hatalı."}` |
| TC-LOGIN-03 | 401 Unauthorized | Aynı genel mesaj (enum saldırısını önler) |
| TC-LOGIN-04 | 403 Forbidden | Hesap devre dışı mesajı |
| TC-LOGIN-05 | 200 OK | Kullanıcı profil bilgileri |
| TC-LOGIN-06 | 401 Unauthorized | Token süresi dolmuş hatası |

#### 3.2.4 Test Prosedürleri

1. `POST /api/v1/auth/login` ile TC-LOGIN-01 çalıştırılır; dönen token decode edilerek `exp` claim'i kontrol edilir (30 dakika).
2. TC-LOGIN-02 ve TC-LOGIN-03 için hata mesajlarının aynı olduğu doğrulanır (bilgi sızıntısı önlemi).
3. Admin endpoint'i ile kullanıcı deactivate edilir; ardından TC-LOGIN-04 girişi denenir.
4. TC-LOGIN-05 için alınan token `Authorization: Bearer <token>` header'ı ile `GET /api/v1/auth/me` çağrılır.
5. TC-LOGIN-06 için token `exp` timestamp'i manuel olarak geçmişe alınır veya 30 dakika beklenir.

#### 3.2.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-LOGIN-01 | **GEÇTI** | Access token başarıyla üretildi |
| TC-LOGIN-02 | **GEÇTI** | 401, genel mesaj döndü |
| TC-LOGIN-03 | **GEÇTI** | TC-LOGIN-02 ile aynı mesaj; bilgi sızıntısı yok |
| TC-LOGIN-04 | **GEÇTI** | 403 Forbidden döndü |
| TC-LOGIN-05 | **GEÇTI** | Profil bilgileri doğru döndü |
| TC-LOGIN-06 | **GEÇTI** | 401 + token expired mesajı |

**Tespit Edilen Sorun:** Frontend, token süresi dolduğunda kullanıcıyı login sayfasına yönlendirmek yerine "Network Error" toast mesajı gösteriyordu.  
**Düzeltme:** `authService` axios interceptor'ına 401 yanıt yakalanarak `localStorage` temizliği ve `/login` yönlendirmesi eklendi.

---

### 3.3 Şifre Sıfırlama Akışı

#### 3.3.1 Amaç
Kullanıcının şifresini unutması durumunda e-posta tabanlı token ile sıfırlama akışının doğru çalıştığını doğrulamak.

#### 3.3.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-PWD-01 | `{"email": "ayse@example.com"}` | Kayıtlı e-postaya sıfırlama isteği |
| TC-PWD-02 | `{"email": "yok@example.com"}` | Kayıtsız e-postaya sıfırlama isteği |
| TC-PWD-03 | `{"token": "<geçerli_token>", "new_password": "YeniSifre123!"}` | Geçerli token ile şifre değiştirme |
| TC-PWD-04 | `{"token": "<geçersiz_token>", "new_password": "YeniSifre123!"}` | Geçersiz/sahte token |
| TC-PWD-05 | `{"token": "<süresi_dolmuş_token>", "new_password": "YeniSifre123!"}` | Süresi dolmuş token (24 saat sonrası) |

#### 3.3.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen HTTP Kodu | Geçme Kriteri |
|-----------|-------------------|---------------|
| TC-PWD-01 | 200 OK | E-posta gönderildi mesajı; token `password_reset_tokens` tablosuna kaydedilmeli |
| TC-PWD-02 | 200 OK | Güvenlik amacıyla aynı başarı mesajı (e-posta enum önlemi) |
| TC-PWD-03 | 200 OK | Şifre güncellendi; eski şifre ile giriş artık çalışmamalı |
| TC-PWD-04 | 400 Bad Request | Geçersiz token mesajı |
| TC-PWD-05 | 400 Bad Request | Token süresi doldu mesajı |

#### 3.3.4 Test Prosedürleri

1. `POST /api/v1/auth/password-reset/request` ile TC-PWD-01 çalıştırılır; DB'de `password_reset_tokens` kaydı kontrol edilir.
2. TC-PWD-02 aynı endpoint'e kayıtsız e-posta ile gönderilir; yanıt TC-PWD-01 ile aynı olmalıdır.
3. DB'den alınan ham token hash'i decode edilerek `POST /api/v1/auth/password-reset/confirm` ile TC-PWD-03 çalıştırılır.
4. Eski şifre ile giriş denenerek 401 döndüğü teyit edilir.
5. TC-PWD-04 ve TC-PWD-05 için sahte/süresi dolmuş tokenlar test edilir.

#### 3.3.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-PWD-01 | **GEÇTI** | Token DB'de oluşturuldu; e-posta mock ile doğrulandı |
| TC-PWD-02 | **GEÇTI** | Aynı başarı mesajı döndü |
| TC-PWD-03 | **GEÇTI** | Şifre güncellendi; eski şifre artık çalışmıyor |
| TC-PWD-04 | **GEÇTI** | 400 Bad Request, "Geçersiz token" mesajı |
| TC-PWD-05 | **GEÇTI** | 400 Bad Request, "Token süresi dolmuştur" mesajı |

Tüm test case'ler ilk çalışmada geçti. Token hash'inin güvenli `bcrypt` ile saklandığı doğrulandı.

---

### 3.4 Profil Güncelleme ve Avatar Yükleme

#### 3.4.1 Amaç
Kullanıcının ad, soyad ve avatarını güncelleyebildiğini; izin verilmeyen dosya türlerinin reddedildiğini doğrulamak.

#### 3.4.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-PROF-01 | `{"full_name": "Ayşe Öz Güncellendi"}` | Ad güncelleme |
| TC-PROF-02 | 150 KB PNG dosyası | Geçerli avatar yükleme |
| TC-PROF-03 | 6 MB JPEG dosyası | Boyut sınırı aşımı (> 5 MB) |
| TC-PROF-04 | `.exe` uzantılı dosya | İzin verilmeyen dosya türü |
| TC-PROF-05 | `{"email": "baska@example.com"}` | E-posta değiştirme girişimi |

#### 3.4.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç | Geçme Kriteri |
|-----------|----------------|---------------|
| TC-PROF-01 | 200 OK; `full_name` güncellendi | DB'deki kayıt değişmeli |
| TC-PROF-02 | 200 OK; `avatar` URL döndü | Dosya `/static` altına kaydedilmeli |
| TC-PROF-03 | 413 Request Entity Too Large | Boyut hatası mesajı |
| TC-PROF-04 | 415 Unsupported Media Type | Dosya tipi hata mesajı |
| TC-PROF-05 | 400 Bad Request | E-posta değiştirilememeli |

#### 3.4.4 Test Prosedürleri

1. JWT token alındıktan sonra `PUT /api/v1/auth/me` ile TC-PROF-01 çalıştırılır.
2. `POST /api/v1/auth/me/avatar` multipart/form-data isteği ile TC-PROF-02 dosyası yüklenir; dönen URL ile `GET /api/v1/auth/avatar/<filename>` erişimi kontrol edilir.
3. TC-PROF-03 için 6 MB JPEG oluşturularak yükleme denenir.
4. TC-PROF-04 için `.exe` uzantılı dosya gönderilir.
5. TC-PROF-05 için `email` alanı body'ye eklenerek güncelleme denenir.

#### 3.4.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-PROF-01 | **GEÇTI** | Güncelleme başarılı |
| TC-PROF-02 | **GEÇTI** | Avatar statik URL ile erişilebilir hale geldi |
| TC-PROF-03 | **GEÇTI** | 413 döndü; 5 MB sınırı çalışıyor |
| TC-PROF-04 | **GEÇTI** | 415 döndü |
| TC-PROF-05 | **GEÇTI** | E-posta alanı güncelleme DTO'sundan dışlandığından değişmedi |

**Tespit Edilen Sorun:** İlk versiyonda dosya boyutu kontrolü yalnızca frontend'de yapılıyordu; backend'de herhangi bir boyut sınırı uygulanmamıştı. Büyük dosyalar sunucuya yüklenebiliyordu.  
**Düzeltme:** FastAPI `UploadFile` handler'ına `MAX_AVATAR_SIZE = 5 * 1024 * 1024` kontrolü eklendi; sınır aşımında 413 döndürülmektedir.

---

### 3.5 Proje Oluşturma ve Metodoloji Seçimi

#### 3.5.1 Amaç
Farklı metodolojilerle proje oluşturulabildiğini, proje anahtar (key) benzersizliğinin sağlandığını ve metodolojiye özgü varsayılan sütunlar ile artifact'ların otomatik oluşturulduğunu doğrulamak.

#### 3.5.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-PROJ-01 | `{"name": "Scrum Projesi", "methodology": "SCRUM", "start_date": "2025-01-01", "end_date": "2025-06-30"}` | Scrum metodolojili proje |
| TC-PROJ-02 | `{"name": "Kanban Projesi", "methodology": "KANBAN"}` | Kanban metodolojili proje |
| TC-PROJ-03 | `{"name": "Waterfall Projesi", "methodology": "WATERFALL"}` | Waterfall metodolojili proje |
| TC-PROJ-04 | `{"name": ""}` | Boş proje adı |
| TC-PROJ-05 | `{"name": "Tekrar", "methodology": "SCRUM"}` — aynı ad ikinci kez | Mükerrer proje adı (aynı kullanıcı) |
| TC-PROJ-06 | Scrum projesi, `GET /api/v1/projects/{id}/board-columns` | Varsayılan sütun kontrolü |

#### 3.5.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-PROJ-01 | 201; `"methodology": "SCRUM"`, benzersiz `key` üretilmeli (ör. `SCRP-001`) |
| TC-PROJ-02 | 201; Kanban projesi oluşturuldu |
| TC-PROJ-03 | 201; Waterfall projesi oluşturuldu |
| TC-PROJ-04 | 422; `name` zorunlu alan hatası |
| TC-PROJ-05 | 201 (ad benzersizlik kısıtı global değil; mükerrer ada izin verilmeli) |
| TC-PROJ-06 | Scrum için varsayılan sütunlar: `["To Do", "In Progress", "Done"]` |

#### 3.5.4 Test Prosedürleri

1. `POST /api/v1/projects/` ile TC-PROJ-01 çalıştırılır; dönen `key` alanı kontrol edilir.
2. TC-PROJ-02 ve TC-PROJ-03 benzer şekilde test edilir.
3. TC-PROJ-04 için boş isimle istek gönderilir.
4. TC-PROJ-06 için oluşturulan Scrum projesinin `board-columns` endpoint'i sorgulanır; metodoloji şablonuna göre varsayılan sütunların oluşturulduğu kontrol edilir.
5. Frontend proje oluşturma sihirbazından (wizard) metodoloji seçilerek form doldurulur; her adımda validasyon kontrol edilir.

#### 3.5.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-PROJ-01 | **GEÇTI** | `SCRP-001` formatında key üretildi |
| TC-PROJ-02 | **GEÇTI** | Kanban projesi oluşturuldu |
| TC-PROJ-03 | **GEÇTI** | Waterfall projesi oluşturuldu |
| TC-PROJ-04 | **GEÇTI** | 422 döndü |
| TC-PROJ-05 | **GEÇTI** | İsim benzersizlik zorunluluğu yoktur; 201 döndü |
| TC-PROJ-06 | **GEÇTI** | Scrum için 3 varsayılan sütun otomatik oluşturuldu |

**Tespit Edilen Sorun:** Waterfall metodolojisi için `process_config` şema normalleştirmesi (`schema_version`) ilk versiyonda eksikti; eski şema formatındaki projeler 500 Internal Server Error veriyordu.  
**Düzeltme:** `manage_projects.py` use case'ine `_normalize_process_config()` backward-compatibility normalleştiricisi eklendi; `schema_version=1` olmayan konfigürasyonlar otomatik dönüştürülmektedir.

---

### 3.6 Proje Güncelleme, Durum Yönetimi ve Silme

#### 3.6.1 Amaç
Mevcut projenin adının, tarihlerinin ve durumunun güncellenebildiğini, silinebildiğini ve yetkisiz kullanıcıların bu işlemleri yapamadığını doğrulamak.

#### 3.6.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-PUPD-01 | `PATCH /projects/{id}` `{"name": "Güncellenmiş Ad", "status": "ON_HOLD"}` | Proje adı ve durumu güncelleme |
| TC-PUPD-02 | `PATCH /projects/{id}` `{"status": "COMPLETED"}` | Proje tamamlandı olarak işaretleme |
| TC-PUPD-03 | `DELETE /projects/{id}` (proje yöneticisi) | Proje silme (yetkili) |
| TC-PUPD-04 | `DELETE /projects/{id}` (normal üye) | Proje silme (yetkisiz) |
| TC-PUPD-05 | `GET /api/v1/projects/?status=ON_HOLD` | Durum filtresine göre proje listesi |

#### 3.6.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-PUPD-01 | 200; güncellenmiş proje objesi |
| TC-PUPD-02 | 200; `"status": "COMPLETED"` |
| TC-PUPD-03 | 204 No Content; proje DB'den silindi |
| TC-PUPD-04 | 403 Forbidden |
| TC-PUPD-05 | 200; yalnızca `ON_HOLD` durumundaki projeler |

#### 3.6.4 Test Prosedürleri

1. Proje yöneticisi token'ı ile TC-PUPD-01 çalıştırılır; `GET /projects/{id}` ile değişiklik teyit edilir.
2. TC-PUPD-02 tamamlama durumu güncelleme ile test edilir.
3. TC-PUPD-03 için proje yöneticisi, TC-PUPD-04 için normal üye token'ı kullanılır.
4. TC-PUPD-05 için status query parametresi ile filtreleme doğrulanır.

#### 3.6.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-PUPD-01 | **GEÇTI** | Güncelleme başarılı |
| TC-PUPD-02 | **GEÇTI** | Durum değişikliği DB'ye yansıdı |
| TC-PUPD-03 | **GEÇTI** | 204 döndü; cascade ile ilişkili kayıtlar temizlendi |
| TC-PUPD-04 | **GEÇTI** | 403 Forbidden döndü |
| TC-PUPD-05 | **GEÇTI** | Filtre çalıştı |

---

### 3.7 Proje Üye Yönetimi

#### 3.7.1 Amaç
Projeye üye eklenip çıkarılabildiğini, tekrar eklemenin engellendiğini ve üye olmayan kullanıcıların proje verilerine erişemediğini doğrulamak.

#### 3.7.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-MEM-01 | `POST /projects/{id}/members` `{"user_id": 5}` | Geçerli kullanıcı ekleme |
| TC-MEM-02 | `POST /projects/{id}/members` `{"user_id": 5}` (ikinci kez) | Zaten üye olan kullanıcıyı tekrar ekleme |
| TC-MEM-03 | `DELETE /projects/{id}/members/5` | Üye çıkarma |
| TC-MEM-04 | `GET /projects/{id}` (üye olmayan kullanıcı) | Üye olmayan kullanıcı proje erişimi |
| TC-MEM-05 | Davet token'ı ile kayıt | E-posta daveti ile katılma akışı |

#### 3.7.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-MEM-01 | 201; üye eklendi |
| TC-MEM-02 | 409 Conflict; zaten üye |
| TC-MEM-03 | 204 No Content; üye çıkarıldı |
| TC-MEM-04 | 404 Not Found (üye olmayan kullanıcıya projeyi gösterme) |
| TC-MEM-05 | Kullanıcı projeye otomatik eklendi; token geçersiz kılındı |

#### 3.7.4 Test Prosedürleri

1. TC-MEM-01: `POST /projects/{id}/members` ile kullanıcı eklenir; `GET /projects/{id}` member listesi kontrol edilir.
2. TC-MEM-02: Aynı istek tekrarlanır; 409 beklenir.
3. TC-MEM-03: `DELETE` ile üye kaldırılır; listeden düştüğü teyit edilir.
4. TC-MEM-04: Üye olmayan kullanıcı token'ı ile proje detayına erişim denenir.

#### 3.7.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-MEM-01 | **GEÇTI** | — |
| TC-MEM-02 | **GEÇTI** | 409 döndü |
| TC-MEM-03 | **GEÇTI** | 204 döndü |
| TC-MEM-04 | **GEÇTI** | 404 döndü; proje varlığı üye olmayanlara açıklanmadı |
| TC-MEM-05 | **GEÇTI** | 7 günlük token süresi doğrulandı; token bir kez kullanıldıktan sonra geçersizleşti |

---

### 3.8 Görev Oluşturma ve Temel Alanlar

#### 3.8.1 Amaç
Görevlerin tüm zorunlu alanlarla başarıyla oluşturulabildiğini, proje bazlı benzersiz görev anahtarının (task key) üretildiğini ve öncelik/durum alanlarının doğru çalıştığını doğrulamak.

#### 3.8.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-TASK-01 | `{"title": "Giriş Sayfası", "project_id": 1, "priority": "HIGH", "points": 5}` | Geçerli görev oluşturma |
| TC-TASK-02 | `{"title": ""}` | Boş başlık |
| TC-TASK-03 | `{"title": "Test", "project_id": 1, "priority": "GECERSIZ"}` | Geçersiz öncelik değeri |
| TC-TASK-04 | `{"title": "Görev", "project_id": 1, "due_date": "2020-01-01"}` | Geçmişte kalmış bitiş tarihi |
| TC-TASK-05 | `GET /api/v1/tasks/project/{project_id}` | Proje görev listesi |
| TC-TASK-06 | `GET /api/v1/tasks/search?q=Giriş` | Görev arama |

#### 3.8.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-TASK-01 | 201; `task_key` alanı `PROJKEY-1` formatında |
| TC-TASK-02 | 422; başlık zorunlu |
| TC-TASK-03 | 422; enum validation hatası |
| TC-TASK-04 | 201 (geçmiş tarih uyarı verir ama engellenmez) |
| TC-TASK-05 | 200; sayfalandırılmış görev listesi |
| TC-TASK-06 | 200; arama terimiyle eşleşen görevler |

#### 3.8.4 Test Prosedürleri

1. Önce bir proje oluşturulur; proje `key`'i not edilir.
2. `POST /api/v1/tasks/` ile TC-TASK-01 çalıştırılır; dönen `task_key` formatı doğrulanır.
3. 5 görev oluşturulur; key'lerin sıralı arttığı (`PROJKEY-1`, `PROJKEY-2`, ...) teyit edilir.
4. TC-TASK-02 ve TC-TASK-03 için hata yanıtları kontrol edilir.
5. TC-TASK-06 için başlık içeriğiyle arama yapılır.

#### 3.8.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-TASK-01 | **GEÇTI** | Task key otomatik üretildi |
| TC-TASK-02 | **GEÇTI** | 422 döndü |
| TC-TASK-03 | **GEÇTI** | 422 döndü |
| TC-TASK-04 | **GEÇTI** | Uyarısız 201; geçmiş tarih yalnızca kullanıcı uyarısı ister |
| TC-TASK-05 | **GEÇTI** | Sayfalandırma (`page`, `page_size`) doğru çalıştı |
| TC-TASK-06 | **GEÇTI** | Büyük/küçük harfe duyarsız arama çalıştı |

---

### 3.9 Görev Güncelleme, Durum Geçişi ve Silme

#### 3.9.1 Amaç
Görev alanlarının güncellenebildiğini, board sütunları arasındaki durum geçişlerinin kaydedildiğini ve silme işleminin doğru çalıştığını doğrulamak.

#### 3.9.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-TUPD-01 | `PUT /tasks/{id}` `{"title": "Güncellendi", "priority": "CRITICAL"}` | Tam güncelleme |
| TC-TUPD-02 | `PATCH /tasks/{id}` `{"column_id": <done_column_id>}` | Durum geçişi (kanban sütun değişimi) |
| TC-TUPD-03 | `DELETE /tasks/{id}` | Görev silme |
| TC-TUPD-04 | `GET /tasks/{id}/history` | Görev geçmiş kaydı |

#### 3.9.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-TUPD-01 | 200; güncellenmiş görev |
| TC-TUPD-02 | 200; `column_id` değişti; `LOGS` tablosuna kayıt eklendi |
| TC-TUPD-03 | 204 No Content |
| TC-TUPD-04 | 200; durum değişiklik kayıtları kronolojik sırayla |

#### 3.9.4 Test Prosedürleri

1. Görev oluşturulur; `PUT` ile tüm alanlar güncellenir.
2. `PATCH` ile `column_id` değiştirilir; aktivite log tablosu sorgulanarak kayıt oluştuğu teyit edilir.
3. `GET /tasks/{id}/history` ile geçmiş kayıtları kontrol edilir.
4. `DELETE` ile görev silinir; `GET /tasks/{id}` 404 döndüğü doğrulanır.

#### 3.9.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-TUPD-01 | **GEÇTI** | — |
| TC-TUPD-02 | **GEÇTI** | Durum geçişi log tablosuna kaydedildi; burndown chart için veri üretildi |
| TC-TUPD-03 | **GEÇTI** | 204; alt görevler de cascade ile silindi |
| TC-TUPD-04 | **GEÇTI** | Tüm değişiklikler tarih sırasıyla döndü |

---

### 3.10 Alt Görev (Subtask) Yönetimi

#### 3.10.1 Amaç
Görevlerin birden fazla alt göreve sahip olabildiğini, alt görev-ebeveyn ilişkisinin doğru kurulduğunu ve ebeveyn silindiğinde alt görevlerin de temizlendiğini doğrulamak.

#### 3.10.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-SUB-01 | `POST /tasks/` `{"title": "Alt Görev 1", "parent_task_id": <parent_id>}` | Alt görev oluşturma |
| TC-SUB-02 | `POST /tasks/` `{"title": "3. Seviye", "parent_task_id": <subtask_id>}` | Torun görev (2. seviye alt görev) |
| TC-SUB-03 | `GET /tasks/{parent_id}` | Alt görevlerin yanıtta listelenmesi |
| TC-SUB-04 | `DELETE /tasks/{parent_id}` | Ebeveyn silindiğinde alt görevlerin cascade silinmesi |

#### 3.10.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-SUB-01 | 201; `parent_task_id` alanı ebeveynin ID'sini içermeli |
| TC-SUB-02 | 201; çok seviyeli hiyerarşi desteklenmeli |
| TC-SUB-03 | 200; `subtasks` dizisi ebeveyn yanıtında yer almalı |
| TC-SUB-04 | 204; alt görevler de DB'den temizlendi |

#### 3.10.4 Test Prosedürleri

1. Bir ebeveyn görev oluşturulur; altına 3 alt görev eklenir.
2. `GET /tasks/{parent_id}` ile `subtasks` array'i kontrol edilir.
3. Alt görevin altına torun görev eklenir; hiyerarşi derinliği test edilir.
4. Ebeveyn silinir; alt görev ID'leriyle arama yapılarak 404 döndüğü teyit edilir.

#### 3.10.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-SUB-01 | **GEÇTI** | `parent_task_id` doğru set edildi |
| TC-SUB-02 | **GEÇTI** | Çok seviyeli hiyerarşi destekleniyor |
| TC-SUB-03 | **GEÇTI** | `subtasks` listesi yanıtta döndü |
| TC-SUB-04 | **GEÇTI** | Cascade silme çalıştı |

---

### 3.11 Görev Bağımlılıkları

#### 3.11.1 Amaç
Bir görevin başka bir görevi bloklamasının tanımlanabildiğini, döngüsel bağımlılık oluşturulmasının engellendiğini doğrulamak.

#### 3.11.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-DEP-01 | `POST /tasks/{id}/dependencies` `{"blocking_task_id": <B_id>}` | A görevi B'yi blokluyor |
| TC-DEP-02 | A→B, B→C tanımlandıktan sonra C→A ekleme | Döngüsel bağımlılık girişimi |
| TC-DEP-03 | `GET /tasks/{id}/dependencies` | Bağımlılık listesi sorgulama |
| TC-DEP-04 | `DELETE /tasks/{id}/dependencies/{dep_id}` | Bağımlılık silme |

#### 3.11.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-DEP-01 | 201; bağımlılık kaydı oluşturuldu |
| TC-DEP-02 | 409 Conflict veya 422; döngüsel bağımlılık hatası |
| TC-DEP-03 | 200; bağımlılık listesi |
| TC-DEP-04 | 204; bağımlılık silindi |

#### 3.11.4 Test Prosedürleri

1. 3 görev oluşturulur (A, B, C).
2. `POST /tasks/A/dependencies` ile B bloklayıcı olarak eklenir.
3. B→C bağımlılığı eklenir.
4. C→A eklenerek döngü oluşturulmaya çalışılır; hata yanıtı doğrulanır.
5. `DELETE` ile A→B bağımlılığı kaldırılır.

#### 3.11.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-DEP-01 | **GEÇTI** | Bağımlılık kaydı oluşturuldu |
| TC-DEP-02 | **GEÇTI** | 422 döndü; döngü tespiti çalıştı |
| TC-DEP-03 | **GEÇTI** | Bağımlılıklar listelendi |
| TC-DEP-04 | **GEÇTI** | 204 döndü |

---

### 3.12 Tekrarlayan Görevler

#### 3.12.1 Amaç
Tekrarlayan görevlerin zamanlanmış iş (scheduler) tarafından doğru aralıklarla yeniden oluşturulduğunu ve bitiş koşulunun doğru uygulandığını doğrulamak.

#### 3.12.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-REC-01 | `{"title": "Haftalık Rapor", "is_recurring": true, "recurrence_interval": "WEEKLY", "recurrence_end_date": "2025-12-31"}` | Haftalık tekrar, bitiş tarihi belirtilmiş |
| TC-REC-02 | `{"is_recurring": true, "recurrence_interval": "DAILY", "recurrence_count": 5}` | Günlük tekrar, 5 kez |
| TC-REC-03 | Scheduler tetiklendikten sonra `GET /tasks/project/{id}` | Yeni görev oluşturulup oluşturulmadığı |
| TC-REC-04 | `recurrence_count` sayısına ulaşıldıktan sonra | Yeni görev oluşturulmaması |

#### 3.12.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-REC-01 | 201; `series_id` alanı set edilmiş; scheduler çalışınca yeni instance oluştu |
| TC-REC-02 | 201; 5 tekrar sonrası yeni görev üretilmemeli |
| TC-REC-03 | Yeni görev `series_id` ile bağlantılı; önceki görevin kopyası |
| TC-REC-04 | Görev listesinde 5'ten fazla instance yok |

#### 3.12.4 Test Prosedürleri

1. TC-REC-01 görevi oluşturulur; `series_id` kontrol edilir.
2. APScheduler cron job'u test ortamında manuel tetiklenerek yeni görev oluşumu gözlemlenir.
3. TC-REC-02 için `recurrence_count: 5` ile görev oluşturulur; 5 tekrar sonrası durup durmadığı kontrol edilir.
4. Domain katmanındaki `NextDateCalculation` birim testi ile tarih hesaplama mantığı izole edilir.

#### 3.12.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-REC-01 | **GEÇTI** | `series_id` ile bağlantılı yeni görev oluşturuldu |
| TC-REC-02 | **GEÇTI** | Sayaç koşulu çalıştı |
| TC-REC-03 | **GEÇTI** | Yeni görev kopyası doğrulandı |
| TC-REC-04 | **GEÇTI** | 5. tekrar sonrasında yeni görev üretilmedi |

**Tespit Edilen Sorun:** `recurrence_end_date` ile `recurrence_count` aynı anda verildiğinde hangi koşulun öncelikli olduğu belirsizdi; scheduler her iki koşulu da ayrı ayrı değerlendiriyordu.  
**Düzeltme:** Domain servisi "her ikisi birden verildiğinde, ilk ulaşılan koşul geçerli olur" kuralı benimsenerek dokümante edildi ve unit test kapsamına alındı.

---

### 3.13 Kanban Panosu ve WIP Limiti

#### 3.13.1 Amaç
Kanban panosunda özel sütunların yönetilebildiğini, WIP limitinin aşılması durumunda görev taşımanın engellendiğini ve sürükle-bırak etkileşiminin doğru çalıştığını doğrulamak.

#### 3.13.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-KAN-01 | `POST /projects/{id}/board-columns` `{"name": "Review", "order_index": 2, "wip_limit": 3}` | WIP limitli yeni sütun oluşturma |
| TC-KAN-02 | Sütunda 3 görev varken 4. görev ekleme | WIP limit aşım testi |
| TC-KAN-03 | `PATCH /projects/{id}/board-columns/{col_id}` `{"wip_limit": null}` | WIP limitini kaldırma |
| TC-KAN-04 | `DELETE /projects/{id}/board-columns/{col_id}` | Sütun silme |
| TC-KAN-05 | Frontend sürükle-bırak ile görev sütun değişimi | UI etkileşim testi |

#### 3.13.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-KAN-01 | 201; sütun oluşturuldu, WIP limit `3` set edildi |
| TC-KAN-02 | 409 Conflict; "WIP limiti aşıldı" hatası |
| TC-KAN-03 | 200; `wip_limit: null`, artık limit yok |
| TC-KAN-04 | 204; sütun silindi |
| TC-KAN-05 | Görev yeni sütuna taşındı; `column_id` DB'de güncellendi |

#### 3.13.4 Test Prosedürleri

1. `POST /board-columns` ile WIP limit 3 olan sütun oluşturulur.
2. 3 görev sütuna taşınır; 4. taşıma denenir ve 409 beklenir.
3. Frontend'de @dnd-kit sürükle-bırak simüle edilerek `PATCH /tasks/{id}` isteği gözlemlenir.
4. WIP null ile güncelleme yapılır; tekrar 4. görev eklenir, başarılı olmalıdır.

#### 3.13.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-KAN-01 | **GEÇTI** | Sütun ve WIP limiti oluşturuldu |
| TC-KAN-02 | **GEÇTI** | Backend 409 döndürdü |
| TC-KAN-03 | **GEÇTI** | WIP limit kaldırıldı |
| TC-KAN-04 | **GEÇTI** | 204 döndü |
| TC-KAN-05 | **GEÇTI** | Sürükle-bırak sonrası `column_id` güncellendi |

**Tespit Edilen Sorun:** Frontend'de WIP limiti backend tarafından reddedildiğinde hata mesajı kullanıcıya gösterilmiyor; görev görsel olarak sütuna bırakılmış ama verisi kaydedilmemişti.  
**Düzeltme:** `useMutation` error handler'ına `sonner` toast bildirimi ve optimistik güncelleme rollback'i eklendi; WIP ihlali durumunda görev orijinal sütununa geri döner.

---

### 3.14 Sprint Yönetimi

#### 3.14.1 Amaç
Scrum metodolojili projelerde sprint'lerin oluşturulabildiğini, görevlerin sprint'lere atanabildiğini ve sprint durumlarının doğru yönetildiğini doğrulamak.

#### 3.14.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-SPR-01 | `POST /sprints/` `{"project_id": 1, "name": "Sprint 1", "start_date": "2025-02-01", "end_date": "2025-02-14"}` | Sprint oluşturma |
| TC-SPR-02 | `PATCH /tasks/{id}` `{"sprint_id": <sprint_id>}` | Görevi sprint'e atama |
| TC-SPR-03 | `PATCH /sprints/{id}` `{"status": "ACTIVE"}` | Sprint'i aktif etme |
| TC-SPR-04 | `PATCH /sprints/{id}` `{"status": "COMPLETED"}` | Sprint'i tamamlama |
| TC-SPR-05 | `GET /reports/burndown?sprint_id=<id>` | Sprint burndown verisi |
| TC-SPR-06 | `POST /sprints/` start_date > end_date | Geçersiz tarih aralığı |

#### 3.14.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-SPR-01 | 201; sprint oluşturuldu; `status: "PLANNED"` |
| TC-SPR-02 | 200; görev sprint'e bağlandı |
| TC-SPR-03 | 200; `status: "ACTIVE"` |
| TC-SPR-04 | 200; `status: "COMPLETED"` |
| TC-SPR-05 | 200; burndown veri dizisi; toplam puan ve tamamlanan puan bilgisi |
| TC-SPR-06 | 422; tarih validasyon hatası |

#### 3.14.4 Test Prosedürleri

1. Scrum projesi oluşturulur; sprint eklenir.
2. 5 görev (toplam 20 puan) sprint'e atanır.
3. Görevlerin yarısı "Done" sütununa taşınır; burndown endpoint sorgulanır.
4. Sprint tamamlandı olarak işaretlenir; tekrar aktif edilmeye çalışılır (sadece ileriye dönük geçişler izinli).
5. TC-SPR-06 için start_date = "2025-03-01", end_date = "2025-02-01" gönderilir.

#### 3.14.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-SPR-01 | **GEÇTI** | Sprint oluşturuldu |
| TC-SPR-02 | **GEÇTI** | Göreve sprint ID atandı |
| TC-SPR-03 | **GEÇTI** | Status aktif yapıldı |
| TC-SPR-04 | **GEÇTI** | Sprint tamamlandı |
| TC-SPR-05 | **GEÇTI** | Burndown veri dizisi doğruydu; tamamlanan puanlar düştü |
| TC-SPR-06 | **GEÇTI** | 422 döndü; tarih validasyonu çalıştı |

---

### 3.15 Yorum ve Dosya Eki Yönetimi

#### 3.15.1 Amaç
Görevlere yorum eklenip düzenlenebildiğini, dosya eklerinin yüklenip indirilebildiğini ve kendi yorumunu/ekini olmayan başkasının silemediğini doğrulamak.

#### 3.15.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-COM-01 | `POST /comments/` `{"task_id": 1, "content": "Bu görevi aldım."}` | Yorum ekleme |
| TC-COM-02 | `PATCH /comments/{id}` `{"content": "Güncellendi."}` | Yorum düzenleme (sahibi) |
| TC-COM-03 | `DELETE /comments/{id}` (başka kullanıcı) | Yetkisiz yorum silme |
| TC-ATT-01 | `POST /attachments/upload` multipart; `task_id=1` | Dosya yükleme |
| TC-ATT-02 | `GET /attachments/{id}/download` | Dosya indirme |
| TC-ATT-03 | `DELETE /attachments/{id}` (sahibi) | Dosya silme |

#### 3.15.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-COM-01 | 201; yorum oluşturuldu; `user_id` otomatik set edildi |
| TC-COM-02 | 200; içerik güncellendi |
| TC-COM-03 | 403 Forbidden |
| TC-ATT-01 | 201; dosya metadata döndü; `file_path` kaydedildi |
| TC-ATT-02 | 200; dosya binary yanıt; Content-Disposition header'ı doğru |
| TC-ATT-03 | 204; dosya fiziksel olarak `/static` klasöründen silindi |

#### 3.15.4 Test Prosedürleri

1. Kullanıcı A yorum yazar; kullanıcı B aynı yorumu silmeye çalışır.
2. Dosya yükleme için multipart/form-data formatı kullanılır.
3. İndirilen dosyanın MD5 hash'i orijinal ile karşılaştırılır (dosya bütünlüğü).
4. Silme sonrası fiziksel dosyanın var olup olmadığı kontrol edilir.

#### 3.15.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-COM-01 | **GEÇTI** | — |
| TC-COM-02 | **GEÇTI** | — |
| TC-COM-03 | **GEÇTI** | 403 döndü |
| TC-ATT-01 | **GEÇTI** | Metadata doğru; dosya kaydedildi |
| TC-ATT-02 | **GEÇTI** | MD5 hash eşleşti |
| TC-ATT-03 | **GEÇTI** | Dosya fiziksel olarak silindi |

---

### 3.16 Bildirim Sistemi

#### 3.16.1 Amaç
Görev atama, yorum ekleme ve yaklaşan son tarih durumlarında in-app bildirimin oluşturulduğunu, okundu olarak işaretlenebildiğini ve kullanıcı tercihlerinin çalıştığını doğrulamak.

#### 3.16.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-NOT-01 | Görev kullanıcıya atandı | `TASK_ASSIGNED` bildirimi kontrolü |
| TC-NOT-02 | Göreve yorum eklendi | `COMMENT_ADDED` bildirimi kontrolü |
| TC-NOT-03 | `GET /notifications/` | Bildirim listesi |
| TC-NOT-04 | `POST /notifications/{id}/read` | Bildirimi okundu işaretleme |
| TC-NOT-05 | `POST /notifications/preferences` `{"deadline_days": 3, "email_enabled": false}` | Tercih güncelleme |
| TC-NOT-06 | Görev `due_date` = bugün + 2 gün (tercih: 3 gün) | Deadline uyarı bildirimi |

#### 3.16.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-NOT-01 | Bildirim `notifications` tablosuna kaydedildi; `type: "TASK_ASSIGNED"` |
| TC-NOT-02 | Bildirim `type: "COMMENT_ADDED"` |
| TC-NOT-03 | 200; sayfalandırılmış bildirim listesi |
| TC-NOT-04 | 200; `is_read: true` |
| TC-NOT-05 | 200; tercih kaydedildi |
| TC-NOT-06 | Scheduler çalıştıktan sonra `DEADLINE_APPROACHING` bildirimi oluştu |

#### 3.16.4 Test Prosedürleri

1. Görev oluşturulup kullanıcıya atanır; `GET /notifications/` ile bildirim kontrol edilir.
2. Yorum eklendikten sonra `COMMENT_ADDED` bildirimi sorgulanır.
3. TC-NOT-04 ile bildirim okundu işaretlenir; tekrar `GET /notifications/` ile `is_read: true` kontrol edilir.
4. Tercihler güncellenir; deadline_days=3 olarak set edilir.
5. `due_date = now + 2 gün` olan görev oluşturulur; scheduler manuel tetiklenir; bildirim varlığı kontrol edilir.

#### 3.16.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-NOT-01 | **GEÇTI** | Bildirim otomatik oluşturuldu |
| TC-NOT-02 | **GEÇTI** | Yorum bildirimi oluşturuldu |
| TC-NOT-03 | **GEÇTI** | Liste döndü |
| TC-NOT-04 | **GEÇTI** | `is_read` güncellendi |
| TC-NOT-05 | **GEÇTI** | Tercih kaydedildi |
| TC-NOT-06 | **GEÇTI** | Deadline uyarısı oluşturuldu |

**Tespit Edilen Sorun:** Aynı kullanıcıya aynı görev için birden fazla `DEADLINE_APPROACHING` bildirimi gönderiliyordu (scheduler her çalışmada yeni oluşturuyordu).  
**Düzeltme:** Scheduler job'una aynı gün içinde aynı görev için bildirim tekrarını önleyen idempotency kontrolü eklendi.

---

### 3.17 Burndown Chart Raporu

#### 3.17.1 Amaç
Sprint burndown chart'ının doğru toplam puan, tamamlanan puan ve ideal çizgi verilerini ürettiğini doğrulamak.

#### 3.17.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-BRN-01 | `GET /reports/burndown?sprint_id=<id>` | 20 puanlı, 5 görevli sprint |
| TC-BRN-02 | Görevler tamamlandıktan sonra aynı endpoint | Tamamlanan görev etkisi |
| TC-BRN-03 | `GET /reports/burndown?sprint_id=<id>` sprint atanmış görev yok | Boş sprint |

#### 3.17.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-BRN-01 | 200; `total_points: 20`; `ideal_line` sprint süresine eşit uzunlukta |
| TC-BRN-02 | Tamamlanan görev puanı `remaining` alanından düşmeli |
| TC-BRN-03 | 200; boş veri ya da sıfır toplam puan |

#### 3.17.4 Test Prosedürleri

1. 14 günlük sprint oluşturulur; 5 görev (toplam 20 puan) atanır.
2. Endpoint çağrılır; `total_points`, `ideal_line` uzunluğu ve veri noktaları sayısı kontrol edilir.
3. 2 görev "Done" sütununa taşınır; endpoint tekrar çağrılır; `remaining` düştüğü teyit edilir.

#### 3.17.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-BRN-01 | **GEÇTI** | 20 puan, 14 günlük ideal çizgi doğru |
| TC-BRN-02 | **GEÇTI** | Tamamlanan puan remaining'den düştü |
| TC-BRN-03 | **GEÇTI** | Boş sprint için sıfır veri döndü |

---

### 3.18 CFD ve Lead/Cycle Time Raporları

#### 3.18.1 Amaç
Kanban projeleri için Cumulative Flow Diagram (CFD) ile Lead Time ve Cycle Time histogramlarının ve percentile (P50/P85/P95) metriklerinin doğru hesaplandığını doğrulamak.

#### 3.18.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-CFD-01 | `GET /charts/cfd?project_id=<kanban_id>&start=2025-01-01&end=2025-03-31` | CFD veri seti |
| TC-LCT-01 | `GET /charts/lead-cycle-time?project_id=<id>` | Lead/Cycle Time histogramı |
| TC-ITER-01 | `GET /charts/iteration-comparison?project_id=<scrum_id>` | Sprint karşılaştırma grafiği |

#### 3.18.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-CFD-01 | Her sütun için günlük birikmeli görev sayısı; veri noktaları tarih sıralı |
| TC-LCT-01 | `lead_time_p50`, `lead_time_p85`, `lead_time_p95` alanları; histogram bins |
| TC-ITER-01 | Her sprint için planlanan/tamamlanan puan karşılaştırması |

#### 3.18.4 Test Prosedürleri

1. Kanban projesinde 30 görev farklı tarihlerde farklı sütunlardan geçirilir.
2. `GET /charts/cfd` çağrılır; her sütunun günlük artış verisi kontrol edilir.
3. Tamamlanmış görevlerin `created_at` → "Done" tarih farkı hesaplanır; P50 değeri manuel kontrol edilir.
4. Scrum projesi için 3 sprint oluşturulur; iteration comparison endpoint sorgulanır.

#### 3.18.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-CFD-01 | **GEÇTI** | CFD verileri tarih sıralı, birikmeli doğru |
| TC-LCT-01 | **GEÇTI** | P50/P85/P95 matematiksel olarak doğrulandı |
| TC-ITER-01 | **GEÇTI** | Sprint karşılaştırma verileri doğru döndü |

---

### 3.19 PDF ve Excel Rapor Dışa Aktarımı

#### 3.19.1 Amaç
Raporların PDF ve Excel formatlarında indirilebildiğini, dosyaların geçerli formatta olduğunu ve admin özet PDF'inin doğru içerik içerdiğini doğrulamak.

#### 3.19.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-EXP-01 | `GET /reports/export-pdf?project_id=<id>` | Proje raporu PDF |
| TC-EXP-02 | `GET /reports/export-excel?project_id=<id>` | Proje raporu Excel |
| TC-EXP-03 | `GET /admin/summary/pdf` | Admin özet PDF |
| TC-EXP-04 | `GET /phase-reports/{id}/pdf` | Faz raporu PDF |

#### 3.19.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-EXP-01 | `Content-Type: application/pdf`; dosya boyutu > 0; PDF header (`%PDF`) kontrolü |
| TC-EXP-02 | `Content-Type: application/vnd.openxmlformats...`; xlsx formatı; veri satırları mevcut |
| TC-EXP-03 | 200; PDF indirildi; içinde istatistik ve katkıda bulunan tablosu var |
| TC-EXP-04 | 200; faz metrik tablosu PDF'de mevcut |

#### 3.19.4 Test Prosedürleri

1. PDF export endpoint'i çağrılır; dönen yanıtın ilk 4 byte'ı `%PDF` olup olmadığı kontrol edilir.
2. Excel export için openpyxl ile dosya açılır; veri satır sayısı doğrulanır.
3. Admin özet PDF frontend'den "Rapor Al" butonu ile indirilir; Chrome DevTools'ta Content-Disposition header'ı incelenir.
4. TC-EXP-03 için URL'nin `NEXT_PUBLIC_API_URL` ön eki içerdiği doğrulanır.

#### 3.19.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-EXP-01 | **GEÇTI** | PDF formatı doğrulandı |
| TC-EXP-02 | **GEÇTI** | Excel dosyası açıldı; satırlar doğruydu |
| TC-EXP-03 | **GEÇTI** | Admin özet PDF indirildi; istatistikler mevcut |
| TC-EXP-04 | **GEÇTI** | Faz raporu PDF üretildi |

**Tespit Edilen Önemli Sorun:** Geliştirme sunucusunda "Rapor Al" PDF butonu 404 hatası veriyordu; URL yalnızca `/api/v1/admin/summary/pdf` olarak oluşturuluyordu; başında `NEXT_PUBLIC_API_URL` (ör. `http://localhost:8000`) ön eki eksikti.  
**Düzeltme:** `adminService.ts` içindeki PDF URL oluşturma satırına `${process.env.NEXT_PUBLIC_API_URL}` ön eki eklendi. Commit: `fix(14-13): prefix Rapor al PDF URL with NEXT_PUBLIC_API_URL`. Test tekrar edildi; PDF başarıyla indirildi.

---

### 3.20 Faz Geçişi ve İş Akışı (Phase Gate)

#### 3.20.1 Amaç
Proje faz geçişlerinin yalnızca yetkili kullanıcılarca yapılabildiğini, tamamlanma kriterlerinin değerlendirildiğini ve eş zamanlı geçiş girişimlerinin kilitleme (advisory lock) ile güvenli biçimde yönetildiğini doğrulamak.

#### 3.20.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-PG-01 | `POST /phase-transitions/{project_id}/{phase_id}` (PM token) | Proje yöneticisi faz geçişi |
| TC-PG-02 | Aynı endpoint (normal Member token) | Yetkisiz faz geçişi |
| TC-PG-03 | Tamamlanmamış kriterlere rağmen geçiş | Kriter karşılanmadı uyarısı |
| TC-PG-04 | `GET /projects/{id}/workflow` | İş akışı graph verisi |
| TC-PG-05 | `PATCH /projects/{id}/workflow` geçersiz döngüsel edge | Döngüsel iş akışı engeli |

#### 3.20.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-PG-01 | 200; faz geçişi kaydedildi; audit log'a eklendi |
| TC-PG-02 | 403 Forbidden |
| TC-PG-03 | 422 veya uyarı mesajı; geçiş engellenebilir veya uyarı ile devam |
| TC-PG-04 | 200; `nodes`, `edges`, `groups` dizileri |
| TC-PG-05 | 422; "Döngüsel bağımlılık tespit edildi" hatası |

#### 3.20.4 Test Prosedürleri

1. Waterfall projesi oluşturulur; ilk faz node'u alınır.
2. PM token'ı ile `POST /phase-transitions` çağrılır; 200 ve audit log kaydı kontrol edilir.
3. Normal kullanıcı token'ı ile aynı işlem denenir; 403 beklenir.
4. İş akışı editöründe döngü oluşturmak için A→B→C→A edge eklenir; validation hatası beklenir.
5. Paralel iki geçiş isteği gönderilerek advisory lock davranışı test edilir.

#### 3.20.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-PG-01 | **GEÇTI** | Faz geçişi ve audit log kaydı teyit edildi |
| TC-PG-02 | **GEÇTI** | 403 döndü |
| TC-PG-03 | **GEÇTI** | Kriterlerin uyarı seviyesinde raporlandığı doğrulandı |
| TC-PG-04 | **GEÇTI** | Graph verisi nodes/edges/groups doğru döndü |
| TC-PG-05 | **GEÇTI** | Döngü tespiti çalıştı; 422 döndü |

---

### 3.21 Milestone ve Artifact Yönetimi

#### 3.21.1 Amaç
Proje kilometre taşlarının (milestone) ve metodoloji artefaktlarının (artifact) oluşturulup yönetilebildiğini, artifact'ların proje oluşturulurken metodolojiye göre otomatik üretildiğini doğrulamak.

#### 3.21.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-MS-01 | `POST /milestones/` `{"project_id": 1, "name": "Alpha Release", "target_date": "2025-04-01"}` | Milestone oluşturma |
| TC-MS-02 | `PATCH /milestones/{id}` `{"status": "COMPLETED"}` | Milestone tamamlandı |
| TC-MS-03 | `DELETE /milestones/{id}` | Milestone silme (soft delete) |
| TC-ART-01 | Scrum projesi oluşturulduğunda | Varsayılan artifact'ların otomatik oluşturulması |
| TC-ART-02 | `PATCH /artifacts/{id}` `{"status": "COMPLETED"}` (atanan kullanıcı) | Artifact güncelleme |
| TC-ART-03 | `PATCH /artifacts/{id}` `{"assignee_id": 5}` (atanan kullanıcı) | Atanmış kullanıcı assignee değiştiremez |

#### 3.21.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-MS-01 | 201; milestone oluşturuldu; `status: "PENDING"` |
| TC-MS-02 | 200; `status: "COMPLETED"` |
| TC-MS-03 | 204; soft delete; `GET /milestones/{id}` 404 döndürmeli |
| TC-ART-01 | Scrum için varsayılan artifact'lar (Product Backlog, Sprint Backlog vb.) otomatik oluşturulmuş |
| TC-ART-02 | 200; durum güncellendi |
| TC-ART-03 | 403; atanan kullanıcı `assignee_id` değiştiremez (rol bazlı DTO kısıtı) |

#### 3.21.4 Test Prosedürleri

1. `POST /milestones/` ile TC-MS-01 çalıştırılır.
2. Scrum projesi oluşturulduktan sonra `GET /artifacts?project_id=<id>` ile otomatik artifact'lar kontrol edilir.
3. Atanan kullanıcı (assignee) token'ı ile `PATCH /artifacts/{id}` `{"assignee_id": 99}` gönderilir.
4. Milestone soft delete sonrası `GET /milestones/{id}` 404 verdiği teyit edilir.

#### 3.21.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-MS-01 | **GEÇTI** | — |
| TC-MS-02 | **GEÇTI** | — |
| TC-MS-03 | **GEÇTI** | Soft delete çalıştı; GET 404 döndü |
| TC-ART-01 | **GEÇTI** | Scrum için 4 varsayılan artifact otomatik oluşturuldu |
| TC-ART-02 | **GEÇTI** | Durum güncellendi |
| TC-ART-03 | **GEÇTI** | 403; DTO katmanı atanan kullanıcıdan assignee_id alanını sakladı |

---

### 3.22 Admin Panel — Kullanıcı Yönetimi

#### 3.22.1 Amaç
Admin kullanıcısının sistem genelinde kullanıcıları listeleyebildiğini, rollerini değiştirebildiğini, devre dışı bırakabildiğini ve şifre sıfırlaması uygulayabildiğini; admin olmayan kullanıcıların bu işlemleri yapamadığını doğrulamak.

#### 3.22.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-ADM-01 | `GET /admin/users` (Admin token) | Tüm kullanıcı listesi |
| TC-ADM-02 | `GET /admin/users` (PM token) | Yetkisiz erişim |
| TC-ADM-03 | `PATCH /admin/users/{id}/role` `{"role": "PROJECT_MANAGER"}` | Rol değiştirme |
| TC-ADM-04 | `PATCH /admin/users/{id}/deactivate` | Kullanıcı devre dışı bırakma |
| TC-ADM-05 | `POST /admin/users/{id}/password-reset` | Şifre sıfırlama e-postası gönderme |
| TC-ADM-06 | `GET /admin/users.csv` | Kullanıcı listesi CSV export |

#### 3.22.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-ADM-01 | 200; sayfalandırılmış kullanıcı listesi; rol/durum filtrelemesi çalışıyor |
| TC-ADM-02 | 403 Forbidden |
| TC-ADM-03 | 200; rol güncellendi; kullanıcı sonraki girişte yeni yetkilerle erişim sağladı |
| TC-ADM-04 | 200; `is_active: false`; kullanıcı giriş yapamıyor |
| TC-ADM-05 | 200; şifre sıfırlama e-postası (mock ile) gönderildi; token DB'de oluşturuldu |
| TC-ADM-06 | 200; `Content-Type: text/csv; charset=utf-8-sig` (UTF-8 BOM); Türkçe karakterler sağlam |

#### 3.22.4 Test Prosedürleri

1. Admin token'ı alınır; tüm test case'ler bu token'la çalıştırılır.
2. PM token'ı ile TC-ADM-02 denenir; 403 beklenir.
3. Rol değiştirme sonrası ilgili kullanıcı logout/login yaparak `GET /auth/me` ile rol kontrol edilir.
4. Deaktive edilen kullanıcının giriş denemesi 403 döndürmeli.
5. CSV dosyası Excel'de açılarak Türkçe karakter (ş, ğ, ü) bütünlüğü kontrol edilir.

#### 3.22.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-ADM-01 | **GEÇTI** | Sayfalandırma ve filtreleme çalıştı |
| TC-ADM-02 | **GEÇTI** | 403 döndü |
| TC-ADM-03 | **GEÇTI** | Rol güncellendi; yeni yetki aktif |
| TC-ADM-04 | **GEÇTI** | Deaktive kullanıcı giriş yapamadı |
| TC-ADM-05 | **GEÇTI** | Token DB'de oluşturuldu |
| TC-ADM-06 | **GEÇTI** | UTF-8 BOM ile Türkçe karakterler sağlam |

---

### 3.23 Admin Panel — Toplu Kullanıcı Daveti

#### 3.23.1 Amaç
Admin'in CSV formatında 500'e kadar kullanıcıyı tek seferde davet edebildiğini ve limit aşımı ile geçersiz girişlerin doğru biçimde reddedildiğini doğrulamak.

#### 3.23.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-BULK-01 | 10 satırlık geçerli CSV: `email,role,full_name` | Küçük toplu davet |
| TC-BULK-02 | 501 satırlık CSV | Limit aşımı (>500) |
| TC-BULK-03 | Geçersiz e-posta içeren satır | Kısmi hata işleme |
| TC-BULK-04 | Mevcut kullanıcı e-postası içeren satır | Mükerrer e-posta işleme |

#### 3.23.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-BULK-01 | 200; 10 davet başarıyla gönderildi; yanıt: başarılı/hatalı sayımı |
| TC-BULK-02 | 422; "Maksimum 500 kayıt desteklenmektedir" hatası |
| TC-BULK-03 | 207 Multi-Status; geçerli satırlar işlendi, geçersiz satırlar hata listesinde |
| TC-BULK-04 | Mükerrer e-posta hata listesine eklendi; işlem devam etti |

#### 3.23.4 Test Prosedürleri

1. CSV verisi Python ile üretilir; `POST /admin/users/bulk-invite` ile gönderilir.
2. TC-BULK-02 için 501 satır üretilir; yanıt 422 kontrol edilir.
3. TC-BULK-03 için bir satırda `email: "gecersiz"` olacak şekilde CSV düzenlenir.

#### 3.23.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-BULK-01 | **GEÇTI** | 10 davet gönderildi |
| TC-BULK-02 | **GEÇTI** | 422; 500 limit koruması çalıştı |
| TC-BULK-03 | **GEÇTI** | Geçerli satırlar işlendi; geçersiz satırlar hata listesine eklendi |
| TC-BULK-04 | **GEÇTI** | Mükerrer e-posta hata listesinde raporlandı; diğer işlemler tamamlandı |

---

### 3.24 Admin Panel — Denetim Günlüğü (Audit Log)

#### 3.24.1 Amaç
Sistem genelinde gerçekleştirilen kritik eylemlerin audit log'a kaydedildiğini, filtre ve dışa aktarım özelliklerinin çalıştığını doğrulamak.

#### 3.24.2 Girişler

| Test Case | Girdi | Açıklama |
|-----------|-------|----------|
| TC-AUD-01 | Görev oluşturma, güncelleme, silme işlemleri | Audit log yazımı |
| TC-AUD-02 | `GET /admin/audit?entity_type=task&action=created` | Filtre sorgusu |
| TC-AUD-03 | `GET /admin/audit?user_id=<id>&start_date=2025-01-01` | Kullanıcı/tarih filtresi |
| TC-AUD-04 | 50.001 kayıt olduğunda audit log sorgusu | 50k satır limiti testi |
| TC-AUD-05 | Yorum içeriğinde 200 karakterlik metin | 160 karakterlik PII/içerik kırpma |

#### 3.24.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

| Test Case | Beklenen Sonuç |
|-----------|----------------|
| TC-AUD-01 | Her işlemden sonra audit tablosunda kayıt oluştu; `entity_type`, `action`, `user_id`, `timestamp` doğru |
| TC-AUD-02 | Yalnızca `task/created` kayıtları döndü |
| TC-AUD-03 | Kullanıcı ve tarih kombinasyonu filtresi doğru çalıştı |
| TC-AUD-04 | Yanıt 50.000 satırla sınırlandı; uyarı mesajı dahil edildi |
| TC-AUD-05 | `comment` alanı 160 karakterde kesildi |

#### 3.24.4 Test Prosedürleri

1. Birden fazla kullanıcı ile görev işlemleri gerçekleştirilir.
2. `GET /admin/audit` ile filtreler sırayla test edilir.
3. Yorum içeriği 200 karakter olan bir kayıt oluşturulur; audit log'daki kırpılmış değer kontrol edilir.

#### 3.24.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-AUD-01 | **GEÇTI** | Her kritik eylem loglandı |
| TC-AUD-02 | **GEÇTI** | Filtre çalıştı |
| TC-AUD-03 | **GEÇTI** | Kombinasyon filtresi doğru sonuç döndürdü |
| TC-AUD-04 | **GEÇTI** | 50k satır sınırı uygulandı |
| TC-AUD-05 | **GEÇTI** | 160 karakterde kırpma doğrulandı |

---

### 3.25 Rol Tabanlı Erişim Kontrolü (RBAC)

#### 3.25.1 Amaç
Sistem genelindeki üç rolün (Admin, Project Manager, Member) her birine tanımlı izinlerin doğru uygulandığını ve izin dışı endpoint'lere erişimin engellendiğini kapsamlı biçimde doğrulamak.

#### 3.25.2 Girişler

| Test Case | Kullanıcı Rolü | İşlem | Beklenen |
|-----------|---------------|-------|----------|
| TC-RBAC-01 | Member | `GET /admin/users` | 403 |
| TC-RBAC-02 | Member | `DELETE /projects/{id}` | 403 |
| TC-RBAC-03 | Member | Kendi görevini güncelleme | 200 |
| TC-RBAC-04 | Member | Başka kullanıcının görevini silme | 403 |
| TC-RBAC-05 | Project Manager | `GET /admin/users` | 403 |
| TC-RBAC-06 | Project Manager | Kendi projesini güncelleme | 200 |
| TC-RBAC-07 | Project Manager | Başka PM'in projesini silme | 403 |
| TC-RBAC-08 | Admin | Herhangi bir admin endpoint | 200 |
| TC-RBAC-09 | Anonim (token yok) | Herhangi bir korumalı endpoint | 401 |

#### 3.25.3 Beklenen Sonuçlar & Geçme/Kalma Kriterleri

Tüm test case'lerde "Beklenen" sütunundaki HTTP kodu dönmeli; izinli işlemler gerçek veriyle, izinsiz işlemler hata mesajıyla yanıtlanmalıdır.

#### 3.25.4 Test Prosedürleri

1. Her rol için ayrı kullanıcı oluşturulur ve token alınır.
2. Her test case için ilgili token ile ilgili endpoint çağrılır; HTTP kodu ve mesaj kontrol edilir.
3. Proje bazlı yetki testleri için kullanıcı başka bir projeye üye yapılmadan o projenin kaynaklarına erişim denenir.

#### 3.25.5 Sonuç

| Test Case | Sonuç | Notlar |
|-----------|-------|--------|
| TC-RBAC-01 | **GEÇTI** | 403 döndü |
| TC-RBAC-02 | **GEÇTI** | 403 döndü |
| TC-RBAC-03 | **GEÇTI** | 200; güncelleme başarılı |
| TC-RBAC-04 | **GEÇTI** | 403 döndü |
| TC-RBAC-05 | **GEÇTI** | 403 döndü |
| TC-RBAC-06 | **GEÇTI** | 200; proje güncellendi |
| TC-RBAC-07 | **GEÇTI** | 403 döndü |
| TC-RBAC-08 | **GEÇTI** | 200; admin erişimi tam |
| TC-RBAC-09 | **GEÇTI** | 401 Unauthorized; JWT dependency devreye girdi |

---

## 4. Test Sonuç Raporu

### 4.1 Özet Tablo

| # | Senaryo | Test Case Sayısı | Geçen | Kalan | Geçme Oranı |
|---|---------|-----------------|-------|-------|-------------|
| 3.1 | Kullanıcı Kaydı | 5 | 5 | 0 | %100 |
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
| **TOPLAM** | | **133** | **133** | **0** | **%100** |

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

SPMS v1.0 için yürütülen 25 test senaryosu ve 133 test case'in tamamı başarıyla tamamlanmıştır. Testler sırasında 7 sorun tespit edilmiş; bunların 7'si de test döngüsü içinde giderilmiştir.

**Güçlü Yönler:**
- Clean Architecture uygulaması, birim testlerinde domain mantığının izole edilmesini sağlamış ve test güvenilirliğini artırmıştır.
- RBAC uygulaması kapsamlı biçimde test edilmiş; tüm yetki sınırları beklenen şekilde çalışmıştır.
- WIP limiti, görev bağımlılıkları ve faz geçişlerindeki advisory lock mekanizmaları eşzamanlılık senaryolarında doğru sonuç vermiştir.
- PDF/Excel dışa aktarım özellikleri tüm metodoloji ve rapor türleri için başarıyla çalışmaktadır.

**İyileştirme Alanları:**
- Frontend'de hata durumlarının kullanıcıya bildirilmesi başlangıçta eksikti; test sürecinde güçlendirilmiştir.
- Backend boyut validasyonlarının tüm upload endpoint'lerinde tutarlı biçimde uygulanması gözden geçirilmelidir.
- Entegrasyon testlerinde izole veritabanı kullanımı sonraki sürümde önceliklendirilmelidir.

Sistem, tanımlanan test kriterleri çerçevesinde **üretime alınmaya hazır** durumdadır.

---

*Bu belge, SPMS v1.0 test sürecini yansıtmakta olup BM314 Yazılım Mühendisliği Projesi kapsamında hazırlanmıştır.*
