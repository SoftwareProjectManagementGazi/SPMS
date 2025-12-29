# Proje Yapılacaklar Listesi

## 1. Geliştirme Ortamı ve Veritabanı Altyapısı (Phase 1)
Altyapının sağlam kurulması, veri bütünlüğü ve ekip çalışması için kritiktir.

### Sürüm Kontrol Sistemi Yapılandırması
- [COMPLETED] Proje için bir Git deposu (repository) oluştur.
- [COMPLETED] Backend (FastAPI) ve Frontend (React) için ayrı modüler dizin yapılarını kur.
- [COMPLETED] `main` (veya `master`) ve `develop` dallarını oluştur; özellik geliştirmeleri için feature-branch iş akışı stratejisini belirle.
*İlgili Gereksinimler: [SPMS-ENV-3], [SPMS-QLT-5]*

### Konteynerize Veritabanı Kurulumu
- [COMPLETED] PostgreSQL veritabanı için `docker-compose.yml` dosyasını hazırla.
- [COMPLETED] Veritabanı servisini Docker üzerinde izole bir ortamda ayağa kaldır ve bağlantı testlerini yap.
- [COMPLETED] Veri kalıcılığı (persistence) için Docker volume tanımlamalarını yap.
*İlgili Gereksinimler: [SPMS-ENV-2], [SPMS-DATA-1]*

### İlişkisel Veritabanı Şeması Tasarımı
- [COMPLETED] SDD ER diyagramına uygun olarak SQLAlchemy modellerini oluştur:
    - [COMPLETED] USERS tablosu (Kullanıcılar).
    - [COMPLETED] PROJECTS tablosu (Projeler).
    - [COMPLETED] TASKS tablosu (Görevler).
- [COMPLETED] Tablolar arası ilişkileri tanımla (One-to-Many, Many-to-Many).
- [COMPLETED] Veri bütünlüğü için Foreign Key kısıtlamalarını ekle.
- [DELAYED] Sorgu performansı için kritik alanlara Index ekle.
*İlgili Gereksinimler: [SPMS-DATA-1], [SPMS-DATA-8], [SPMS-DB-02]*

## 2. Sunucu Tarafı (Backend) Geliştirmeleri (Phase 2)
İş mantığının kurulması ve API servislerinin geliştirilmesi.

### API Mimarisi ve Dokümantasyon
- [COMPLETED] FastAPI projesini başlat ve Router yapısını kur (`/auth`, `/tasks`, `/projects`).
- [ ] Swagger UI (OpenAPI) entegrasyonunu kontrol et ve tüm uç noktaların otomatik dokümante edildiğinden emin ol.
*İlgili Gereksinimler: [SPMS-API-03], [SPMS-API-05]*

### Kimlik Doğrulama (Auth) Servisi
- [COMPLETED] Kullanıcı güvenliği için `bcrypt` kütüphanesini projeye dahil et.
- [COMPLETED] `POST /register`: Kullanıcı kayıt servisini yaz (Parolayı hashleyerek kaydet).
- [COMPLETED] `POST /login`: Kullanıcı giriş servisini yaz (Email/Parola doğrulama).
- [COMPLETED] Başarılı girişte JWT (JSON Web Token) üreten mekanizmayı kur.
*İlgili Gereksinimler: [SPMS-01.1], [SPMS-01.3], [SPMS-SEC-01], [SPMS-SEC-02]*

### Temel CRUD Servisleri
- [COMPLETED] SQLAlchemy ORM oturum yönetimini yapılandır.
- [COMPLETED] Proje Yönetimi: Proje oluşturma, okuma, güncelleme ve silme endpoint'lerini yaz.
- [COMPLETED] Görev Yönetimi: Görev oluşturma, listeleme, güncelleme ve silme endpoint'lerini yaz.
*İlgili Gereksinimler: [SPMS-02.1], [SPMS-02.3], [SPMS-DB-01]*

## 3. Güvenlik Testleri ve Kalite Kontrol (Phase 3)
Geliştirilen servislerin güvenliğinin doğrulanması.

### Rol Bazlı Erişim Kontrolü (RBAC) Testleri
- [COMPLETED] Pytest altyapısını kur.
- [ ] Yetkisiz erişim senaryolarını test et (Örn: Yetkisiz kullanıcının proje silmeye çalışması -> HTTP 403 Forbidden dönmeli).
- [ ] Kullanıcının sadece kendi görevlerine müdahale edebildiğini doğrulayan birim testleri yaz.
*İlgili Gereksinimler: [SPMS-01.2], [SPMS-SEC-04], [SPMS-QLT-7]*

## 4. Kullanıcı Arayüzü (Frontend) Geliştirmeleri (Phase 4)
Kullanıcı deneyimini sağlayacak arayüzlerin kodlanması.

### Arayüz İskeleti ve Dashboard
- [ ] React ve TypeScript projesini oluştur.
- [ ] Proje Yöneticisi Dashboard'u: Yönetici giriş yaptığında istatistikleri gösteren dinamik paneli kodla.
- [ ] Çalışan Dashboard'u: Çalışan giriş yaptığında sadece görevleri gösteren kısıtlı görünümü kodla.
*İlgili Gereksinimler: [SPMS-UI-01]*

### Görev Yönetim Ekranları
- [ ] "Görevlerim" Ekranı: Kullanıcının üzerine atanmış görevleri listeleyen sayfayı yap (Erişim izni olmayan projeleri filtrele).
- [ ] Durum Güncelleme: Görev kartlarına "Yapılacaklar -> Tamamlandı" geçişini sağlayan butonları ekle.
- [ ] UI bileşenlerini (Butonlar, Kartlar) modüler (Component-based) olarak tasarla.
*İlgili Gereksinimler: [SPMS-01.5], [SPMS-02.4], [SPMS-UI-05]*

## 5. Entegrasyon (Phase 5)
Frontend ve Backend'in güvenli haberleşmesi.

### Axios ile Güvenli API Bağlantısı
- [ ] Frontend projesine Axios kütüphanesini ekle.
- [ ] Axios Interceptors yapılandırmasını kur:
    - [ ] Her giden isteği yakala.
    - [ ] LocalStorage'dan JWT token'ı al.
    - [ ] İsteğin header kısmına `Authorization: Bearer <token>` bilgisini ekle.
- [ ] Uçtan uca (Login -> Token Al -> Veri Çek) akışını test et.
*İlgili Gereksinimler: [SPMS-API-01], [SPMS-SEC-03]*
