# SPMS - Gereksinim Gerçekleştirme Durumu (Checklist)

Bu doküman, SRS (Software Requirements Specification) dokümanında belirtilen isterleri kategorilerine göre listelemekte ve Dönem Sonu Raporu'na dayanarak tamamlananları işaretlemektedir.

## 1.2 SPMS Fonksiyonel Gereksinimleri

### 1.2.1 Kullanıcı ve Yetkilendirme Modülü (SPMS-01)
- [x] SPMS-01.1: Kullanıcıların kayıt, giriş ve çıkış işlemleri
- [x] SPMS-01.2: Rol bazlı erişim (Yönetici, proje yöneticisi, ekip üyesi vb.)
- [x] SPMS-01.3: JWT tabanlı kimlik doğrulama, parolaların algoritmalarla şifrelenmesi
- [ ] SPMS-01.4: Kullanıcı profili düzenleme, ekip oluşturma / davet işlemleri
- [x] SPMS-01.5: Projelere erişim izinleri yönetimi
- [x] SPMS-01.6: Yetkilendirme yapısının modüler, ölçeklenebilir tasarımı

### 1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)
- [x] SPMS-02.1: Proje oluşturma, düzenleme, arşivleme (Temel CRUD)
- [ ] SPMS-02.2: Projelere ekip üyelerini atama
- [x] SPMS-02.3: Görev oluşturma, düzenleme ve silme (Temel CRUD)
- [x] SPMS-02.4: Alt görevler, öncelik ve durum güncellemeleri
- [ ] SPMS-02.5: Görevler arası bağımlılıklar ("bitmeden-başlayamaz" vb.)
- [ ] SPMS-02.6: Tekrarlayan görevler
- [ ] SPMS-02.7: Tekrarlayan görevlerde değişiklik kontrolü
- [ ] SPMS-02.8: Tekrarlayan görevlerin bitiş kriteri
- [ ] SPMS-02.9: Mükerrer görev kontrolü ve uyarı sistemi
- [ ] SPMS-02.10: Görev geçmişi ve işlem logları
- [ ] SPMS-02.11: Görev içi yorumlaşma ve dosya paylaşımı
- [ ] SPMS-02.12: Takvim görünümünde veya zaman çizelgesinde (Gantt) izleme

### 1.2.3 Bildirim ve Mesajlaşma (SPMS-03)
- [ ] SPMS-03.1: Gerçek zamanlı bildirim gönderimi
- [ ] SPMS-03.2: Belirli durumlarda bildirim tetiklenmesi
- [ ] SPMS-03.3: Rol bazlı mesajlaşma yetkisi
- [ ] SPMS-03.4: Görev içi mesajlaşma / yorum alanı
- [ ] SPMS-03.5: Uygulama içi ve e-posta/push bildirimleri
- [ ] SPMS-03.6: Bildirim tercihleri (sessiz mod vb.)
- [ ] SPMS-03.7: Mesaj geçmişi güvenli saklanması

### 1.2.4 Raporlama ve Analitik (SPMS-04)
- [ ] SPMS-04.1: İlerleme durumlarının grafiksel sunumu
- [ ] SPMS-04.2: Rapor filtrelemeleri (Kullanıcı, görev, proje bazlı)
- [ ] SPMS-04.3: Rapor çıktılarının PDF/Excel olarak dışa aktarımı
- [ ] SPMS-04.4: Kullanıcı performans metriklerinin hesaplanması
- [ ] SPMS-04.5: Dashboard üzerinden yöneticilere performans verilerinin sunulması

### 1.2.5 Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)
- [ ] SPMS-05.1: Scrum, Waterfall, Kanban, Iterative süreç modelleri desteği
- [ ] SPMS-05.2: Süreç modeli şablonlarının otomatik oluşturulması
- [ ] SPMS-05.3: Süreç şablonlarının özelleştirilmesi
- [ ] SPMS-05.4: Yeni modellerin tanımlanabilir olması
- [ ] SPMS-05.5: Takvim ve etkinliklerin sürece göre otomatik planlanması
- [ ] SPMS-05.6: Modüler projeye pano / görünümler eklenmesi
- [ ] SPMS-05.7: Kanban panosu eklenebilirliği
- [ ] SPMS-05.8: Gantt şeması eklenebilirliği
- [ ] SPMS-05.9: Basit liste veya takvim görünümü

## 1.3 SPMS Dış Arayüz Gereksinimleri

### 1.3.2 Kullanıcı Arayüzü Gereksinimleri
- [x] SPMS-UI-01: Kullanıcı rolüne göre özelleşen Dashboard ekranı
- [ ] SPMS-UI-02: Sürükle-bırak destekli görev panosu (Kanban) ve durum bildirimleri
- [ ] SPMS-UI-03: Takvim modülü (Görev ve toplantılar için)
- [ ] SPMS-UI-04: Raporlama ekranı (Filtreleme özellikli)
- [x] SPMS-UI-05: Modüler ve yeniden kullanılabilir UI bileşenleri
- [x] SPMS-UI-06: Responsive (duyarlı) yapı (Masaüstü/Mobil uyumu)

### 1.3.3 API Gereksinimleri
- [x] SPMS-API-01: Endpoint doğrulaması
- [x] SPMS-API-02: Veri formatı JSON
- [x] SPMS-API-03: HTTP CRUD / REST metotları
- [ ] SPMS-API-04: Standart hata kodları
- [x] SPMS-API-05: Swagger / Redoc API dokümantasyonu
- [ ] SPMS-API-06: Endpoint hız sınırlandırması (Rate limiting)
- [ ] SPMS-API-07: Sıkı CORS politikaları

### 1.3.4 Veri Tabanı Arayüzü Gereksinimleri
- [x] SPMS-DB-01: ORM (SQLAlchemy) kullanımı
- [x] SPMS-DB-02: Tablolar arası ilişkilerin tanımlanması
- [x] SPMS-DB-03: Veritabanı sorgu optimizasyonu ve indeksleme
- [x] SPMS-DB-04: Veritabanı katmanının modülerliği

### 1.3.5 Dış Sistemlerle Entegrasyon Gereksinimleri
- [ ] SPMS-EXT-01: 3. parti API (Slack, Teams vb.) entegrasyonu
- [ ] SPMS-EXT-02: Çekirdek harici bağımsız servis katmanı entegrasyonu
- [ ] SPMS-EXT-03: Kullanıcı izni kontrolü
- [ ] SPMS-EXT-04: API anahtarı güvenliği
- [ ] SPMS-EXT-05: Bağımsız yeni entegrasyon ekleme

## 1.5 SPMS Dahili Veri Gereksinimleri
- [x] SPMS-DATA-1: Temel tablo yapıları (USERS, PROJECTS, TASKS vb.)
- [ ] SPMS-DATA-2: Sürüm bilgisi (Versioning)
- [ ] SPMS-DATA-3: Tarihsel izleme (Audit trail / Loglama)
- [ ] SPMS-DATA-4: Tekrarlayan görev veri altyapısı
- [x] SPMS-DATA-5: Çoklu proje desteği (project_id ayrıştırmaları)
- [x] SPMS-DATA-6: Şema yapısının modüler genişletilebilirliği
- [ ] SPMS-DATA-7: Yumuşak silme (Soft delete)
- [x] SPMS-DATA-8: Veritabanı kısıtlamaları (Foreign Key constraints vb.)

## 1.6 Uyarlama Gereksinimleri
- [ ] SPMS-ADAPT-1: Süreç modeli (Scrum, Kanban) değişimi
- [ ] SPMS-ADAPT-2: Yeni şablon tanımlama
- [ ] SPMS-ADAPT-3: UI/Tema ayarlaması
- [ ] SPMS-ADAPT-4: Modül açma-kapatma
- [ ] SPMS-ADAPT-5: Sistem parametreleri konfigürasyon dosyaları/panelleri
- [ ] SPMS-ADAPT-6: Yeniden başlatma gerektirmeyen uyarlamalar

## 1.7 Emniyet Gereksinimleri
- [ ] SPMS-SAFE-1: Kritik işlemlerde onay penceresi
- [ ] SPMS-SAFE-2: Oturum zaman aşımı (timeout) ile sistemden çıkarma
- [ ] SPMS-SAFE-3: Hatalı giriş durumunda geçici kilitleme
- [ ] SPMS-SAFE-4: Hata/emniyet takip servisi sağlama

## 1.8 Güvenlik ve Gizlilik Gereksinimleri
- [x] SPMS-SEC-01: JWT tabanlı oturum yönetimi
- [x] SPMS-SEC-02: Parolaların kriptografik hash (bcrypt vb.) ile saklanması
- [x] SPMS-SEC-03: İstemci-Sunucu iletişiminde zorunlu HTTPS
- [x] SPMS-SEC-04: RBAC (Rol Bazlı Erişim Kontrolü) katı uygulamaları (Birim listeleri ve backend testleri tamamlanmış)
- [ ] SPMS-SEC-05: Rate limiting ve DoS koruması
- [ ] SPMS-SEC-06: Parola sıfırlama mekanizması (Token doğrulama)
- [ ] SPMS-SEC-07: Katı CORS politikası
- [ ] SPMS-SEC-08: KVKK / GDPR protokollerine uyum
- [x] SPMS-SEC-09: ORM (SQLAlchemy) kullanımı ile SQL injection koruması

## 1.9 Çevre (Ortam) Gereksinimleri
- [x] SPMS-ENV-01: Modern web tarayıcı desteği
- [x] SPMS-ENV-02: Docker tabanlı çalışabilme (Konteynerizasyon)
- [x] SPMS-ENV-03: Geliştirme/test/üretim ortamlarının bağımsızlığı
- [x] SPMS-ENV-04: Düşük ağ bandı performansı

## 1.11 Yazılım Kalite Faktörleri
- [x] SPMS-QLT-1: Sistemin tanımlı işlevleri doğru yerine getirmesi
- [x] SPMS-QLT-2: Sistemin veri kaybı yaşamadan toparlanması
- [x] SPMS-QLT-3: Kullanılabilirlik (Arayüz erişilebilirliği)
- [ ] SPMS-QLT-4: Performans - İşlemlerin max 5 saniye içinde tamamlanması (Optimizasyonlar devam etmekte)
- [x] SPMS-QLT-5: Kod modülerliği ve sürdürebilirlik
- [ ] SPMS-QLT-6: Esneklik (Yeni süreç/model ekleme desteğinin gelmesi)
- [x] SPMS-QLT-7: Test edilebilirliğin CI/CD'ye entegrasyonu (RBAC UI testleri tamamlandı)
