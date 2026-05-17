# GAZİ ÜNİVERSİTESİ MÜHENDİSLİK FAKÜLTESİ BİLGİSAYAR MÜHENDİSLİĞİ

**BM495-BM496 BİLGİSAYAR MÜHENDİSLİĞİ PROJESİ I-II**

---

# YAZILIM PROJESİ YÖNETİM YAZILIMI (SPMS)
## Kapsamlı Proje Raporu

---

**Öğrenciler:**
Ayşe ÖZ — 21118080055
Yusuf Emre BAYRAKCI — 22118080006

**Akademik Danışman:**
Prof. Dr. HACER KARACAN

**Akademik Yıl:** 2025–2026
**Dönem:** Bahar

---

## SİMGELER VE KISALTMALAR

| Kısaltma | Açıklama |
|----------|----------|
| **API** | Application Programming Interface (Uygulama Programlama Arayüzü) |
| **ABC** | Abstract Base Class (Soyut Temel Sınıf) |
| **CI/CD** | Continuous Integration / Continuous Delivery |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DI** | Dependency Injection (Bağımlılık Enjeksiyonu) |
| **DIP** | Dependency Inversion Principle (Bağımlılık Tersine Çevirme İlkesi) |
| **DTO** | Data Transfer Object (Veri Transfer Nesnesi) |
| **ER** | Entity-Relationship (Varlık-İlişki) |
| **GDPR** | General Data Protection Regulation |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **JWT** | JSON Web Token |
| **KVKK** | Kişisel Verilerin Korunması Kanunu |
| **MVP** | Minimum Viable Product |
| **OCP** | Open/Closed Principle |
| **ORM** | Object-Relational Mapping |
| **PMBOK** | Project Management Body of Knowledge |
| **RBAC** | Role-Based Access Control (Rol Tabanlı Erişim Kontrolü) |
| **REST** | Representational State Transfer |
| **SaaS** | Software as a Service |
| **SDD** | Software Design Description (Yazılım Tasarım Açıklaması) |
| **SOLID** | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion |
| **SPMS** | Software Project Management System (Yazılım Projesi Yönetim Yazılımı) |
| **SRS** | Software Requirements Specification (Yazılım Gereksinim Belirtimi) |
| **SRP** | Single Responsibility Principle |
| **STD** | Software Test Description (Yazılım Test Tanımı) |
| **TLS** | Transport Layer Security |
| **UI/UX** | User Interface / User Experience |
| **WIP** | Work In Progress (Devam Eden İş) |

---

## İÇİNDEKİLER

1. [Özet / Abstract](#1-özet--abstract)
2. [Giriş](#2-giriş)
3. [Literatür Araştırması](#3-literatür-araştırması)
4. [Gereksinim Analizi](#4-gereksinim-analizi)
5. [Sistem Mimarisi ve Tasarım](#5-sistem-mimarisi-ve-tasarım)
6. [Uygulama Detayları](#6-uygulama-detayları)
7. [Test ve Doğrulama](#7-test-ve-doğrulama)
8. [Gerçekçi Kısıtlar](#8-gerçekçi-kısıtlar)
9. [Sonuç ve Değerlendirme](#9-sonuç-ve-değerlendirme)
10. [Kaynaklar](#10-kaynaklar)
11. [Ekler](#11-ekler)

---

## 1. ÖZET / ABSTRACT

### 1.1 Özet

Bu çalışmada, yazılım geliştirme süreçlerini dijital ortamda bütünleşik biçimde yönetmeye yönelik bir web tabanlı yazılım projesi yönetim sistemi (SPMS — Software Project Management System) tasarlanmış ve hayata geçirilmiştir. Mevcut ticari çözümlerin (Jira, Trello, Asana) yüksek lisans ücreti ve özelleştirme kısıtları nedeniyle küçük ve orta ölçekli yazılım ekiplerine yönelik açık kaynak alternatif ihtiyacı sistemin tasarım motivasyonunu oluşturmaktadır.

SPMS; Scrum, Kanban ve Waterfall (Şelale) olmak üzere üç farklı yazılım geliştirme metodolojisini tek bir platformda desteklemektedir. Sistem; görev yönetimi, sprint planlaması, Kanban panosu, Gantt şeması, raporlama, bildirimler, takım yönetimi ve çoklu kullanıcı rol yönetimi (RBAC) gibi kapsamlı işlevleri barındırmaktadır.

Mimari açıdan sistem, Temiz Mimari (Clean Architecture) prensiplerine ve SOLID tasarım ilkelerine tam uyum sağlayacak biçimde dört katmanlı olarak gerçekleştirilmiştir: Domain, Application, Infrastructure ve Presentation katmanları. Arka uç Python 3.12 ve FastAPI çerçevesiyle, ön uç ise Next.js 16.1.1 ve TypeScript ile geliştirilmiştir. Kalıcı depolama için PostgreSQL 15, kimlik doğrulama için JWT (HS256) ve rol tabanlı yetkilendirme için özel bir RBAC çerçevesi kullanılmaktadır.

Sistem işlevselliği, 25 test senaryosu ve 80'i aşkın test vakasından oluşan kapsamlı bir yazılım test belgesiyle (STD) doğrulanmış; tüm test vakaları başarıyla geçilmiştir. Çalışma, IEEE 29148 standartlarına uygun Yazılım Gereksinim Belirtimi (SRS), Yazılım Tasarım Açıklaması (SDD) ve Yazılım Test Tanımı (STD) belgeleriyle desteklenmektedir.

**Anahtar Sözcükler:** Yazılım Proje Yönetimi, Temiz Mimari, SOLID Prensipleri, Scrum, Kanban, Waterfall, FastAPI, Next.js, JWT, RBAC, Görev Yönetimi.

---

### 1.2 Abstract

This study presents the design and implementation of a web-based Software Project Management System (SPMS) for the integrated digital management of software development processes. The design motivation arises from the need for an open-source alternative targeting small and medium-sized software teams, given the high licensing costs and customization restrictions of existing commercial solutions (Jira, Trello, Asana).

SPMS supports three distinct software development methodologies—Scrum, Kanban, and Waterfall—on a single platform. The system incorporates comprehensive features including task management, sprint planning, Kanban board, Gantt chart, reporting, notifications, team management, and multi-user role management (RBAC).

Architecturally, the system is implemented as a four-layer structure in full compliance with Clean Architecture principles and SOLID design principles: Domain, Application, Infrastructure, and Presentation layers. The back-end is developed with Python 3.12 and the FastAPI framework, while the front-end uses Next.js 16.1.1 and TypeScript. PostgreSQL 15 is used for persistent storage, JWT (HS256) for authentication, and a custom RBAC framework for role-based authorization.

System functionality is validated through a comprehensive Software Test Description (STD) comprising 25 test scenarios and over 80 test cases; all test cases passed successfully. The work is supported by Software Requirements Specification (SRS), Software Design Description (SDD), and Software Test Description (STD) documents conforming to IEEE 29148 standards.

**Keywords:** Software Project Management, Clean Architecture, SOLID Principles, Scrum, Kanban, Waterfall, FastAPI, Next.js, JWT, RBAC, Task Management.

---

## 2. GİRİŞ

### 2.1 Problem Tanımı ve Motivasyon

Modern yazılım geliştirme süreçleri, giderek artan karmaşıklığı ve çok paydaşlı yapısı nedeniyle etkin bir proje yönetim aracına olan ihtiyacı zorunlu kılmaktadır. Endüstride Jira, Trello, Asana ve Monday.com gibi popüler ürünler mevcut olmakla birlikte bu çözümler küçük ve orta ölçekli yazılım ekipleri açısından çeşitli dezavantajlar barındırmaktadır: yüksek abonelik maliyetleri, metodoloji esnekliğinin yokluğu, veri egemenliği sorunları ve özelleştirme kısıtları bunların başında gelmektedir. Söz konusu boşluk, metodoloji bağımsız, tam özelleştirilebilir ve açık kaynak kodlu bir proje yönetim platformu geliştirmeye olan ihtiyacı doğurmaktadır.

SPMS (Software Project Management System — Yazılım Projesi Yönetim Yazılımı) bu boşluğu doldurmak amacıyla Gazi Üniversitesi Bilgisayar Mühendisliği mezuniyet projesi kapsamında geliştirilmiştir. Proje, sektörel ihtiyaçları karşılayan üretime hazır bir çözüm sunmanın ötesinde, yazılım mühendisliğinin temel akademik ilkelerini (Temiz Mimari, SOLID, TDD anlayışı) gerçek bir mühendislik problemi üzerinde uygulamayı hedeflemektedir.

### 2.2 Projenin Kapsam ve Hedefleri

SPMS'in birincil hedefleri aşağıdaki şekilde özetlenebilir:

1. **Metodoloji Esnekliği:** Scrum, Kanban ve Waterfall metodolojilerini tek çatı altında, her birinin kendine özgü iş kurallarına uygun biçimde desteklemek.
2. **Bütünleşik Yönetim:** Görev takibi, sprint planlaması, Gantt şeması, raporlama ve bildirim sistemlerini tek bir platformda entegre etmek.
3. **Mimari Mükemmellik:** Temiz Mimari ve SOLID prensiplerine uygun, katmanlı, test edilebilir ve sürdürülebilir bir kod tabanı oluşturmak.
4. **Güvenlik:** JWT tabanlı kimlik doğrulama, bcrypt şifreleme, hız sınırlama ve rol tabanlı erişim kontrolü (RBAC) ile endüstri standardı güvenlik önlemlerini uygulamak.
5. **Kullanılabilirlik:** Modern bir kullanıcı arayüzü (Next.js + shadcn/ui) aracılığıyla yüksek kullanıcı deneyimi sağlamak.

### 2.3 Projenin Özgün Katkıları

Bu çalışma aşağıdaki özgün katkıları sunmaktadır:

- Scrum, Kanban ve Waterfall metodolojilerini tek platformda destekleyen açık kaynak proje yönetim sistemi tasarımı.
- Dört katmanlı Temiz Mimari prensibinin Python/FastAPI ekosisteminde kapsamlı ve somut uygulaması.
- Fabrika Deseni (Factory Pattern) ile metodolojiye özgü başlangıç yapılandırması (varsayılan board sütunları, faz şablonları).
- Tekrarlayan görev yönetimi için domain odaklı zaman hesaplama algoritması (günlük/haftalık/aylık aralıklar, aybaşı kenar senaryoları).
- Faz kapısı mekanizması (Phase Gate) ile kriterlere dayalı proje faz geçişlerinin yönetimi.
- Rol tabanlı erişim kontrolünün (RBAC) kullanım senaryosu katmanında DIP uyumlu gerçekleştirilmesi.
- Dil-bağımsız görev tamamlanma tespiti (sütun adına değil `order_index` sırasına dayalı).

### 2.4 Raporun Yapısı

Raporun geri kalan bölümleri şu şekilde organize edilmiştir: Bölüm 3 ilgili literatürü incelemekte; Bölüm 4 fonksiyonel ve fonksiyonel olmayan gereksinimleri SRS kodlarıyla sunmaktadır; Bölüm 5 sistem mimarisini ve tasarım kararlarını açıklamaktadır; Bölüm 6 kritik uygulama bileşenlerinin kodlanmış kanıtlarını içermektedir; Bölüm 7 kapsamlı test ve doğrulama sonuçlarını aktarmaktadır; Bölüm 8 gerçekçi mühendislik kısıtlarını irdelemektedir; Bölüm 9 sonuç ve gelecek çalışma yöntemlerini değerlendirmektedir.

---

## 3. LİTERATÜR ARAŞTIRMASI

### 3.1 Proje Yönetim Yazılımları

Yazılım proje yönetimi araçları akademik ve endüstriyel literatürde kapsamlı biçimde incelenmiştir. Serrador ve Pinto [1], proaktif proje yönetiminin başarıyı belirleyen en kritik faktör olduğunu ortaya koymuş; proje yönetim araçlarının bu süreçteki rolüne dikkat çekmiştir. Dijkstra [2] ise kurumsal yazılım geliştirme süreçlerinde Agile metodolojilerin benimsenmesinin önündeki engellerden birinin metodoloji bağımlı araç yapısı olduğunu vurgulamış ve metodoloji bağımsız platformların önemine işaret etmiştir.

Mevcut ticari çözümler (Jira, Trello, Asana) belirli metodolojilere optimizasyon sağlamakla birlikte tümünü eşit ölçüde desteklememektedir. Atlassian [3], Jira'nın Scrum ve Kanban için optimize edildiğini ancak Waterfall projelerinde sınırlı destek sunduğunu kabul etmektedir. Bu bulgu, SPMS'in çok metodoloji desteği sağlama kararını doğrular niteliktedir.

### 3.2 Yazılım Mimarisi: Temiz Mimari ve SOLID

Martin [4], "Temiz Mimari" adlı çalışmasında sistemin iş kurallarının altyapı detaylarından ayrıştırılması gerektiğini savunmakta ve bunun için Varlık, Kullanım Senaryosu, Arayüz Adaptörü ve Çerçeve katmanlarından oluşan dört katmanlı bir yapı önermektedir. SPMS bu mimariyi Domain, Application, Infrastructure ve Presentation katmanları olarak Python ekosisteminde hayata geçirmektedir.

SOLID prensipleri Martin [4] tarafından formüle edilen ve nesne yönelimli tasarımın temelini oluşturan beş ilkeden meydana gelmektedir. Dönmez ve Erdoğan [5] bu prensiplerin Python projelerinde benimsenmesinin bakım maliyetini ortalama %34 oranında azalttığını rapor etmektedir. SPMS'in tasarımında her bir SOLID prensibinin bilinçli ve sistematik biçimde uygulandığı görülmektedir.

### 3.3 Agile Proje Yönetimi

Scrum çerçevesi, Beck ve diğerleri [6] tarafından kaleme alınan Agile Manifesto ile biçimlenmiş; zaman sınırlı sprint döngüleri, sprint planlama ve retrospektif toplantıları üzerine inşa edilmiştir. SPMS, Scrum metodolojisi için sprint başlatma/bitirme, sprint planlama board'u ve hız (velocity) grafiği özelliklerini eksiksiz sunmaktadır.

Kanban ise Anderson [7] tarafından süreç akışını optimize eden sürekli akış metodolojisi olarak tanımlanmakta ve WIP (Work In Progress) limiti kavramını merkeze almaktadır. SPMS, her board sütununda WIP sınırı tanımlanmasını ve anlık ihlal bildirimi yapılmasını desteklemektedir.

### 3.4 Web Teknolojileri ve Güvenlik

FastAPI çerçevesi [8] Python ekosisteminde yüksek performanslı, tip güvenli ve OpenAPI uyumlu REST API geliştirme için tercih edilmektedir. Django REST Framework veya Flask'a kıyasla otomatik belgeleme, async/await desteği ve Pydantic entegrasyonu açısından belirgin avantajlar sunmaktadır.

JWT (JSON Web Token, RFC 7519) [9], durum bilgisiz kimlik doğrulama için endüstri standardı haline gelmiştir. SPMS, HS256 algoritmasıyla imzalanmış JWT token'ları kullanmakta ve token içine RBAC izin listesini yerleştirerek veritabanı sorgusunu en aza indirmektedir.

bcrypt parola karma algoritması [10], yavaş hesaplama kabiliyeti sayesinde kaba kuvvet (brute force) saldırılarına karşı üstün direnç göstermektedir. SPMS, maliyet faktörü 12 ile yapılandırılmış bcrypt kullanmaktadır.

---

## 4. GEREKSİNİM ANALİZİ

### 4.1 Fonksiyonel Gereksinimler

Sistem gereksinimleri IEEE 29148 standardına uygun biçimde belgelenmiş ve her gereksinime SPMS-XX.X formatında benzersiz bir kimlik kodu atanmıştır.

#### 4.1.1 Kullanıcı Yönetimi (SPMS-01)

| Kod | Gereksinim |
|-----|-----------|
| SPMS-01.1 | Sistem yöneticisi, POST `/api/v1/admin/users` uç noktası aracılığıyla yeni kullanıcı daveti oluşturabilir. Davet e-posta içerir, geçerlilik süresi 7 gündür. |
| SPMS-01.2 | Davet bağlantısını alan kullanıcı, tek kullanımlık token ile şifresini belirleyerek hesabını aktive eder. |
| SPMS-01.3 | Kullanıcılar e-posta ve şifre ile oturum açabilir; başarılı girişte JWT erişim token'ı döner. |
| SPMS-01.4 | Sistem, art arda başarısız giriş denemelerinde hesap kilitleme uygular. Kilitleme süresi yapılandırılabilirdir. |
| SPMS-01.5 | Kullanıcılar profil bilgileri (ad, soyad, avatar) ve şifrelerini güncelleyebilir. |
| SPMS-01.6 | Sistem yöneticisi kullanıcıları pasif hale getirebilir ve rol atayabilir. |

#### 4.1.2 Proje Yönetimi (SPMS-02)

| Kod | Gereksinim |
|-----|-----------|
| SPMS-02.1 | Yetkili kullanıcılar yeni proje oluşturabilir; metodoloji (Scrum/Kanban/Waterfall) seçimi zorunludur. |
| SPMS-02.2 | Proje oluşturulduğunda Fabrika Deseni ile metodolojiye özgü varsayılan board sütunları otomatik oluşturulur. |
| SPMS-02.3 | Proje yöneticisi takım üyesi ekleyebilir, üyeleri çıkarabilir ve proje ayarlarını güncelleyebilir. |
| SPMS-02.4 | Sistem birden fazla eşzamanlı projeyi destekler; proje başına benzersiz anahtar (KEY) oluşturulur. |
| SPMS-02.5 | Projeler ACTIVE, ARCHIVED ve COMPLETED durumlarında bulunabilir; durum geçişleri yetki kontrolüne tabidir. |

#### 4.1.3 Görev Yönetimi (SPMS-03)

| Kod | Gereksinim |
|-----|-----------|
| SPMS-03.1 | Proje üyeleri görev oluşturabilir; başlık, açıklama, öncelik, başlangıç/bitiş tarihi ve görevli atanabilir. |
| SPMS-03.2 | Görevler alt görev (subtask) hiyerarşisine sahip olabilir; üst görev-alt görev ilişkisi desteklenir. |
| SPMS-03.3 | Görevler board sütunları arasında sürükle-bırak veya API aracılığıyla taşınabilir. |
| SPMS-03.4 | Tekrarlayan görevler tanımlanabilir; tekrarlama aralığı günlük, haftalık veya aylık olabilir. |
| SPMS-03.5 | Görev bağımlılıkları (finish_to_start, start_to_start) tanımlanabilir; bağımlılık kuralları ihlalinde uyarı verilir. |
| SPMS-03.6 | Görevlere etiket (label) atanabilir; etiketler renk ve isme göre proje bazında yönetilebilir. |
| SPMS-03.7 | Görevlere dosya eki eklenebilir; desteklenen maksimum dosya boyutu yapılandırılabilirdir. |
| SPMS-03.8 | Görev arama işlevi başlık üzerinden kelime tabanlı filtreleme ile çalışır; durma sözcükleri (stop words) elenir. |
| SPMS-03.9 | Backlog görünümü, sprint atanmamış ve tamamlanmamış görevleri listeler; filtreler uygulanabilir. |

#### 4.1.4 Sprint Yönetimi (SPMS-04)

| Kod | Gereksinim |
|-----|-----------|
| SPMS-04.1 | Scrum projelerinde sprint oluşturma, başlatma ve tamamlama işlemleri gerçekleştirilebilir. |
| SPMS-04.2 | Bir proje, aynı anda yalnızca bir aktif sprinte sahip olabilir. |
| SPMS-04.3 | Sprint tamamlandığında tamamlanmamış görevler bir sonraki sprinte veya backlog'a taşınabilir. |
| SPMS-04.4 | Sprint hız (velocity) raporları her sprint için görev puanı istatistiklerini gösterir. |

#### 4.1.5 Raporlama ve Analiz (SPMS-05)

| Kod | Gereksinim |
|-----|-----------|
| SPMS-05.1 | Burndown chart, aktif sprint içindeki kalan iş yükünü zaman ekseni üzerinde görselleştirir. |
| SPMS-05.2 | Velocity chart, geçmiş sprintlerin tamamlama puanlarını karşılaştırmalı olarak sunar. |
| SPMS-05.3 | Görev dağılım raporu öncelik ve durum bazında pasta/çubuk grafik ile gösterilir. |
| SPMS-05.4 | Performans raporu, kullanıcı bazında tamamlanan görev istatistiklerini içerir. |
| SPMS-05.5 | Raporlar PDF (fpdf2) ve Excel (openpyxl) formatlarında dışa aktarılabilir. |
| SPMS-05.6 | Gantt şeması görev başlangıç-bitiş tarihlerini ve bağımlılıkları görsel olarak sunar. |
| SPMS-05.10 | Sistem, görev başlığı ve proje bağlamına göre benzer görev önerisi (AI task suggestion) sunabilir. |

### 4.2 Fonksiyonel Olmayan Gereksinimler

#### 4.2.1 Güvenlik Gereksinimleri

| Kod | Gereksinim |
|-----|-----------|
| SPMS-SEC-01 | Tüm API uç noktaları (herkese açık uç noktalar hariç) JWT token ile kimlik doğrulama gerektirir. |
| SPMS-SEC-02 | Kullanıcı parolaları bcrypt algoritması (maliyet faktörü ≥ 12) ile depolanır; düz metin depolanmaz. |
| SPMS-SEC-03 | API uç noktaları IP tabanlı hız sınırlamasına tabidir (slowapi, RFC 6585). |
| SPMS-SEC-04 | CORS politikası yalnızca yapılandırılmış kök URL'leri izin verecek şekilde kısıtlıdır. |
| SPMS-SEC-05 | SQL enjeksiyonuna karşı ORM parametreli sorgular kullanılır; ham SQL ifadesine izin verilmez. |
| SPMS-SEC-06 | RBAC mekanizması; Admin, Proje Yöneticisi, Geliştirici ve Misafir rollerini destekler. |
| SPMS-SEC-07 | Tüm hassas veri transferi TLS 1.2 veya üzeri ile şifrelenir. |
| SPMS-SEC-08 | JWT yükü (payload) içinde şifreli veri bulunmaz; kullanıcı e-postası ve izin listesi yer alır. |

#### 4.2.2 Performans ve Ölçeklenebilirlik

| Kod | Gereksinim |
|-----|-----------|
| SPMS-PERF-01 | API yanıt süresi, normal yük altında (< 100 eşzamanlı kullanıcı) 500 ms'yi geçmemelidir. |
| SPMS-PERF-02 | Veritabanı sorguları ORM seviyesinde lazy/eager loading ile optimize edilir. |
| SPMS-PERF-03 | Bildirim sistemi HTTP polling (30 sn aralık) kullanır; sekme pasif durumdayken polling durur. |

#### 4.2.3 Sürdürülebilirlik ve Bakım

| Kod | Gereksinim |
|-----|-----------|
| SPMS-MAINT-01 | Kod, Temiz Mimari prensiplerine uygun katmanlara ayrılarak bağımlılıkların iç katmanlara doğru akması sağlanır. |
| SPMS-MAINT-02 | Veritabanı şema değişiklikleri Alembic ile yönetilen migration dosyaları ile uygulanır. |
| SPMS-MAINT-03 | Yapılandırma değerleri ortam değişkenleri (`.env`) aracılığıyla yönetilir; kod içine sabit değer yazılmaz. |

### 4.3 Kullanıcı Rolleri ve Yetki Matrisi

SPMS dört temel kullanıcı rolü tanımlamaktadır:

| Rol | Kullanıcı Yönetimi | Proje Oluşturma | Görev CRUD | Sprint Yönetimi | Raporlama |
|-----|-------------------|-----------------|------------|-----------------|-----------|
| **Admin** | Tam | Tam | Tam | Tam | Tam |
| **Proje Yöneticisi** | Proje kapsamında | Sınırlı | Tam | Tam | Tam |
| **Geliştirici** | — | — | Kendisi/ekip | — | Görüntüle |
| **Misafir** | — | — | Görüntüle | — | Görüntüle |

---

## 5. SİSTEM MİMARİSİ VE TASARIM

### 5.1 Genel Mimari

SPMS, Robert C. Martin'in [4] önerdiği Temiz Mimari (Clean Architecture) prensiplerini dört katmanlı bir yapıyla gerçekleştirmektedir. Temel tasarım ilkesi "Bağımlılık Kuralı" (Dependency Rule) olarak adlandırılmakta; kaynak kod bağımlılıklarının yalnızca dış katmanlardan iç katmanlara doğru akması zorunlu tutulmaktadır.

```
[Presentation / API Katmanı]      ← HTTP isteklerini karşılar, DI kablolar
         ↓ depends on
[Application / Use Case Katmanı]  ← İş akışlarını düzenler
         ↓ depends on
[Domain / Entity Katmanı]         ← Saf iş nesneleri ve kurallar
         ↑ implemented by
[Infrastructure / DB Katmanı]     ← Soyut arayüzleri somutlaştırır
```

**[ŞEKİL 5.1: SPMS Temiz Mimari Katman Diyagramı]**

Bu mimarinin temel avantajı, her katmanın bağımsız olarak test edilebilmesi ve altyapı detaylarının (veritabanı motoru, ORM, HTTP çerçevesi) iş kurallarından izole edilmesidir. Domain katmanı hiçbir dış kütüphaneye bağımlı değildir; pure Python modülleri olarak yer alır.

### 5.2 Katman Detayları

#### 5.2.1 Domain Katmanı (app/domain/)

Domain katmanı sistemin kalbidir ve sıfır dış bağımlılık ilkesini benimser. Bu katmanda yer alan hiçbir dosya `import sqlalchemy`, `import fastapi` veya benzeri altyapı kütüphanesi içermez.

**Varlıklar (Entities):** Pydantic `BaseModel` tabanlı iş nesneleridir. `model_config = ConfigDict(from_attributes=True)` yapılandırması ile ORM model-to-entity dönüşümü doğrudan sağlanmaktadır.

**Depo Arayüzleri (Repository Interfaces):** Python'un `abc.ABC` modülü ile tanımlanmış soyut sınıflardır. Her kullanım senaryosu yalnızca bu arayüze bağımlıdır; somut uygulama bağımlılık enjeksiyonu ile dışarıdan verilir.

**Domain İstisnaları:** `TaskNotFoundError`, `ProjectNotFoundError`, `SprintNotFoundError` gibi özelleştirilmiş exception sınıfları bu katmanda tanımlanmaktadır. HTTP durum koduna dönüşüm Presentation katmanında gerçekleşir.

#### 5.2.2 Application Katmanı (app/application/)

Application katmanı, iş akışlarını düzenleyen kullanım senaryolarını (use cases) barındırır. Her kullanım senaryosu tek bir operasyondan sorumludur (SRP — Single Responsibility Principle). 50'yi aşkın kullanım senaryosu bu katmanda yer almaktadır:

| Modül | Kullanım Senaryoları |
|-------|---------------------|
| Görev Yönetimi | CreateTaskUseCase, UpdateTaskUseCase, DeleteTaskUseCase, GetTaskUseCase, ListProjectTasksUseCase, ListMyTasksUseCase, ListBacklogTasksUseCase, SearchSimilarTasksUseCase |
| Sprint Yönetimi | CreateSprintUseCase, StartSprintUseCase, CompleteSprintUseCase |
| Proje Yönetimi | CreateProjectUseCase, UpdateProjectUseCase, ArchiveProjectUseCase |
| Raporlama | GetBurndownUseCase, GetVelocityUseCase, GetDistributionUseCase, GetPerformanceUseCase |
| Kimlik Doğrulama | LoginUserUseCase, RegisterUserUseCase, ChangePasswordUseCase |
| Admin Paneli | InviteUserUseCase, ApproveJoinRequestUseCase, GetSystemStatsUseCase |
| RBAC | CreateRoleUseCase, AssignPermissionUseCase |

**Veri Transfer Nesneleri (DTOs):** Pydantic `BaseModel` tabanlı giriş ve çıkış modelleri. `TaskCreateDTO`, `TaskUpdateDTO`, `TaskResponseDTO` bu katmanda tanımlanır.

#### 5.2.3 Infrastructure Katmanı (app/infrastructure/)

Infrastructure katmanı, domain arayüzlerinin somut uygulamalarını barındırır.

**SQLAlchemy ORM Modelleri:** Domain entity'lerinden bağımsız `TimestampedMixin` tabanlı SQLAlchemy sınıfları. ORM modeli ile domain entity arasındaki haritalama (mapping), repository içinde gerçekleştirilir.

**Repository Uygulamaları:** `SqlAlchemyTaskRepository(ITaskRepository)` örüntüsü tüm depo uygulamalarında tekrarlanır. Asenkron SQLAlchemy 2.0 session yönetimi `AsyncSession` ile sağlanır.

**Veritabanı Migrasyonları:** Alembic altyapısının yanı sıra çalışma zamanı migration'ları (migration_004, migration_005, migration_006) FastAPI `lifespan` fonksiyonu içinde uygulama başlangıcında çalıştırılır.

#### 5.2.4 Presentation Katmanı (app/api/)

Presentation katmanı, HTTP isteklerini karşılayan FastAPI router'larını ve bağımlılık enjeksiyon kablolarını içerir.

**Bağımlılık Enjeksiyonu Akışı:**

```
HTTP Request → Router → Depends(get_task_repo)
                               ↓
                    SqlAlchemyTaskRepository(session)
                               ↓
                    CreateTaskUseCase(task_repo, project_repo)
                               ↓
                    use_case.execute(dto) → TaskResponseDTO → HTTP 201
```

### 5.3 Veri Tabanı Tasarımı

#### 5.3.1 Temel Tablolar

Sistem 20'yi aşkın ilişkisel tablo kullanmaktadır:

| Tablo | Birincil Amaç |
|-------|--------------|
| `users` | Kullanıcı hesapları, şifre özeti, rol FK |
| `projects` | Proje metadata, metodoloji, process_config (JSONB) |
| `project_members` | Proje-kullanıcı çoka-çok ilişkisi |
| `tasks` | Görev kayıtları, parent_task_id (öz-referans), series_id |
| `board_columns` | Kanban board sütunları, order_index, wip_limit |
| `sprints` | Sprint tanımları, başlangıç/bitiş tarihleri |
| `task_dependencies` | Görev bağımlılıkları, bağımlılık türü |
| `comments` | Görev yorumları |
| `files` | Dosya ekleri, task_id (nullable) |
| `notifications` | Kullanıcı bildirimleri, okundu durumu |
| `audit_logs` | Her durum değişikliği için JSONB kayıt |
| `labels` | Proje bazında görev etiketleri |
| `task_labels` | Görev-etiket çoka-çok ilişkisi |
| `roles` | RBAC rol tanımları |
| `permissions` | İzin listesi |
| `role_permissions` | Rol-izin matrisi |
| `process_templates` | Metodoloji şablonları |
| `milestones` | Proje kilometre taşları |
| `artifacts` | Faz çıktı dosyaları |

**[ŞEKİL 5.2: SPMS Varlık-İlişki (ER) Diyagramı — Temel Tablolar]**

#### 5.3.2 TimestampedMixin

Her tablo `TimestampedMixin` mixin'ini devralır:

```python
# Backend/app/infrastructure/database/models/base.py
class TimestampedMixin:
    version   = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
```

`version` alanı optimistik kilitleme (optimistic locking) için kullanılmaktadır. `is_deleted` ve `deleted_at` ise yumuşak silme (soft delete) mekanizmasını desteklemektedir; silinen kayıtlar fiziksel olarak kaldırılmaz, sorgularda `is_deleted=False` filtresi uygulanır.

### 5.4 Fabrika Deseni ile Metodoloji Yönetimi

Proje oluşturulurken metodolojiye özgü varsayılan board yapılandırması Fabrika Deseni ile otomatik olarak oluşturulur:

| Metodoloji | Varsayılan Sütunlar |
|-----------|---------------------|
| **Scrum** | Backlog → In Progress → Done (3 sütun) |
| **Kanban** | Backlog → To Do → In Progress → Done (4 sütun) |
| **Waterfall** | Requirements → Design → Development → Testing → Deployment (5 sütun) |

Bu yaklaşım OCP (Open/Closed Principle) ile uyumludur: yeni bir metodoloji eklenmesi mevcut kodu değiştirmeksizin yeni bir fabrika stratejisi eklenerek gerçekleştirilir.

### 5.5 Güvenlik Mimarisi

**[ŞEKİL 5.3: SPMS Güvenlik Akış Diyagramı]**

Sistem çok katmanlı bir güvenlik mimarisi benimsemektedir:

1. **Hız Sınırlama:** slowapi kütüphanesi, IP adresini anahtar olarak kullanarak her uç noktaya özel istek sınırı uygular.
2. **JWT Kimlik Doğrulama:** HS256 ile imzalanmış, 480 dakika (8 saat) geçerlilik süreli token. Token yükü `sub` (e-posta) ve `permissions` (izin listesi) alanlarını içerir.
3. **RBAC:** Her API işlemi için gerekli izin, `require_permission(perm)` bağımlılık fonksiyonu ile kontrol edilir.
4. **Hesap Kilitleme:** Art arda hatalı giriş denemelerinde hesap geçici olarak kilitlenir (HTTP 423).
5. **bcrypt Şifreleme:** Maliyet faktörü 12 ile hesap güvenliği sağlanır.
6. **Başlangıç Güvenlik Denetimi:** Varsayılan güvensiz JWT_SECRET veya DB_PASSWORD değerleri tespit edildiğinde uygulama başlamayı reddeder.

### 5.6 Bildirim Mimarisi

HTTP polling mimarisinin tercih edilmesinin nedeni WebSocket altyapısı gerektirmemesi ve mevcut FastAPI uygulamasıyla tam uyumlu çalışmasıdır. İstemci, 30 saniyelik aralıklarla `/api/v1/notifications` uç noktasını sorgular; sekme pasif duruma geçtiğinde (`visibilitychange` API) polling otomatik olarak duraklatılır.

### 5.7 Faz Kapısı Mekanizması (Phase Gate)

Waterfall ve ITERATIVE proje metodolojilerinde proje fazlar arasında geçiş için faz kapısı mekanizması uygulanmaktadır. Geçiş üç kritere göre değerlendirilir:

1. **Kilit Denetimi:** `pg_advisory_xact_lock` ile eşzamanlı geçiş çatışması önlenir.
2. **Kriter Denetimi:** Önceki fazın tüm görevleri tamamlandı mı? (`CriteriaUnmetError`)
3. **Geçiş Geçerliliği:** Kaynak fazdan hedef faza doğrudan kenar var mı? (`InvalidTransitionError`)

---

## 6. UYGULAMA DETAYLARI

### 6.1 Arka Uç Uygulaması

#### 6.1.1 Teknoloji Yığını

| Kütüphane | Sürüm | Amaç |
|-----------|-------|-------|
| `fastapi` | 0.111 | Web çerçevesi, OpenAPI belgeleme |
| `sqlalchemy` | 2.0 | Async ORM |
| `asyncpg` | 0.29 | PostgreSQL async sürücüsü |
| `pydantic` | 2.x | Veri doğrulama ve serileştirme |
| `pydantic-settings` | 2.x | Ortam değişkeni yönetimi |
| `python-jose` | 3.3 | JWT oluşturma ve doğrulama |
| `passlib[bcrypt]` | 1.7 | bcrypt şifre karma |
| `slowapi` | 0.1 | Hız sınırlama |
| `apscheduler` | 3.x | Arka plan zamanlayıcısı |
| `fpdf2` | 2.7 | PDF rapor üretimi |
| `openpyxl` | 3.1 | Excel rapor üretimi |

#### 6.1.2 Domain Entity Tasarımı

`Task` domain varlığı sistemin merkezindedir ve tüm iş kurallarını taşır:

```python
# Backend/app/domain/entities/task.py
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator
import re

class TaskPriority(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"

class Task(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:               Optional[int] = None
    title:            str
    description:      Optional[str] = None
    priority:         TaskPriority = TaskPriority.MEDIUM
    project_id:       int
    assignee_id:      Optional[int] = None
    reporter_id:      Optional[int] = None
    column_id:        Optional[int] = None
    sprint_id:        Optional[int] = None
    parent_task_id:   Optional[int] = None
    phase_id:         Optional[str] = None   # Waterfall faz node ID
    is_recurring:     bool = False
    recurrence_interval: Optional[str] = None  # daily/weekly/monthly
    series_id:        Optional[str] = None

    subtasks: List["Task"] = []
    parent:   Optional["Task"] = None

    @field_validator("phase_id")
    @classmethod
    def validate_phase_id(cls, v):
        if v is not None and not re.match(r"^nd_[a-zA-Z0-9]{10}$", v):
            raise ValueError(
                "phase_id must match pattern: nd_ + 10 alphanumeric chars"
            )
        return v
```

`phase_id` alanı Waterfall metodolojisinde görevin bağlı olduğu süreç fazını tanımlamakta olup regex doğrulaması domain katmanında yürütülür. Bu yaklaşım, veri tutarsızlığını ORM veya API katmanına sızmadan erken aşamada yakalamaktadır.

#### 6.1.3 Depo Arayüzü Tasarımı

Domain katmanında tanımlanan soyut depo arayüzü (ISP — Interface Segregation Principle uyumlu):

```python
# Backend/app/domain/repositories/task_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from app.domain.entities.task import Task

class ITaskRepository(ABC):
    @abstractmethod
    async def create(self, task: Task) -> Task: ...

    @abstractmethod
    async def get_by_id(self, task_id: int) -> Optional[Task]: ...

    @abstractmethod
    async def update(self, task_id: int, data: dict,
                     user_id: int) -> Task: ...

    @abstractmethod
    async def delete(self, task_id: int) -> None: ...

    @abstractmethod
    async def get_all_by_project(
            self, project_id: int) -> List[Task]: ...

    @abstractmethod
    async def search_by_title(
            self, project_id: int, words: List[str]) -> List[Task]: ...

    @abstractmethod
    async def list_backlog_tasks(
            self, project_id: int,
            no_sprint: bool = False,
            exclude_done: bool = False) -> List[Task]: ...
```

Infrastructure katmanında bu arayüzü uygulayan `SqlAlchemyTaskRepository`, SQLAlchemy 2.0 async session yönetimini kullanmaktadır. Kritik ARCH-04/ARCH-05 notları gereği `create()` ve `update()` metodları, gereksiz ikinci bir `get_by_id` sorgusu yapmadan tam entity'yi eager loading ile döndürmektedir.

#### 6.1.4 Kimlik Doğrulama ve JWT Akışı

`LoginUserUseCase`, Phase 15 RBAC yeniden tasarımıyla birlikte JWT token yüküne izin listesi eklemektedir:

```python
# Backend/app/application/use_cases/login_user.py
async def execute(self, dto: UserLoginDTO) -> TokenDTO:
    # 1. Kullanıcı arama — bulunamazsa numaralandırma önleme için
    #    InvalidCredentialsError (404 değil, 401)
    user = await self.user_repo.get_by_email(dto.email)
    if not user:
        raise InvalidCredentialsError()

    # 2. Hesap kilitleme kontrolü
    locked_until = check_lockout(user.id)
    if locked_until:
        raise HTTPException(
            status_code=423,
            detail=f"ACCOUNT_LOCKED:{locked_until.isoformat()}"
        )

    # 3. Şifre doğrulama
    if not self.security_service.verify_password(
            dto.password, user.password_hash):
        record_failed_attempt(user.id)
        raise InvalidCredentialsError()

    # 4. Başarılı giriş — kilitleme durumunu temizle
    clear_lockout(user.id)

    # 5. RBAC-02: İzin listesini JWT yüküne ekle
    #    Alfabetik sıralama (Pitfall 14): deterministik token yapısı
    perms: list[str] = []
    if self.role_permission_repo and user.role:
        role_perms = await self.role_permission_repo.list_by_role(
            user.role.id)
        perms = sorted(p.key for p in role_perms)

    access_token = self.security_service.create_access_token(
        data={"sub": user.email, "permissions": perms}
    )
    return TokenDTO(access_token=access_token, token_type="bearer")
```

İzin listesinin alfabetik sıralanması, test iddialarının ve token karşılaştırmalarının deterministik olmasını sağlamaktadır.

#### 6.1.5 Görev Mapper — Dil-Bağımsız Tamamlanma Tespiti

`map_task_to_response_dto()` fonksiyonu, bir görevin tamamlanıp tamamlanmadığını sütun adına değil sütunun `order_index` değerine bakarak belirler. Bu yaklaşım, sistemin her dilde tanımlanan "son sütun" ile çalışmasını sağlar:

```python
# Backend/app/application/use_cases/manage_tasks.py
def map_task_to_response_dto(task: Task) -> TaskResponseDTO:
    status_slug = "todo"
    is_done = False
    if task.column:
        status_slug = task.column.name.lower()
        if task.project and task.project.columns:
            max_order = max(
                (getattr(c, "order_index", 0)
                 for c in task.project.columns),
                default=0,
            )
            # Dil-bağımsız tamamlanma: en yüksek order_index == done
            is_done = task.column.order_index == max_order
        else:
            # Geri dönüş: İngilizce varsayılan adlar
            is_done = status_slug in ("done", "completed", "closed")
    # ... DTO oluşturma devam eder
```

#### 6.1.6 Tekrarlayan Görev Mekanizması

SPMS, görevlerin günlük, haftalık ve aylık tekrarlanmasını desteklemektedir. Bir tekrarlayan görev "tamamlandı" sütununa taşındığında sistem otomatik olarak bir sonraki örneği oluşturur:

```python
# Backend/app/application/use_cases/manage_tasks.py
async def _create_next_recurrence_instance(
        task: Task, task_repo: ITaskRepository) -> None:
    from datetime import datetime, timedelta
    import calendar

    def _add_months(dt: datetime, months: int) -> datetime:
        """Aybaşı kenar senaryolarını güvenle ele alır.
        Örnek: 31 Ocak + 1 ay → 28/29 Şubat (taşma yok)."""
        month = dt.month - 1 + months
        year  = dt.year + month // 12
        month = month % 12 + 1
        day   = min(dt.day, calendar.monthrange(year, month)[1])
        return dt.replace(year=year, month=month, day=day)

    base_dt  = task.due_date or datetime.utcnow()
    interval = task.recurrence_interval or "weekly"

    if interval == "daily":
        next_due = base_dt + timedelta(days=1)
    elif interval == "monthly":
        next_due = _add_months(base_dt, 1)
    else:  # haftalık varsayılan
        next_due = base_dt + timedelta(weeks=1)

    next_count = (task.recurrence_count - 1) \
        if task.recurrence_count else None

    new_task = Task(
        title=task.title,
        description=task.description,
        project_id=task.project_id,
        is_recurring=True,
        recurrence_interval=task.recurrence_interval,
        recurrence_end_date=task.recurrence_end_date,
        recurrence_count=next_count,
        due_date=next_due,
        sprint_id=None,           # Yeni örnek sprintsiz başlar
        assignee_id=task.assignee_id,
        series_id=task.series_id, # Aynı seri kimliği korunur
        reporter_id=task.reporter_id,
    )
    await task_repo.create(new_task)
```

Tüm bu hesaplama mantığı domain/application katmanında konumlandırılarak altyapıdan bağımsız biçimde test edilebilmektedir.

#### 6.1.7 Arka Plan Görevleri (APScheduler)

```python
# Backend/app/scheduler/jobs.py
async def deadline_alert_job():
    """Her sabah 08:00'de çalışır.
    Kullanıcı bildirim tercihlerine göre 1/2/3/7 gün
    sonra vadesi dolacak görevler için bildirim oluşturur."""
    async with AsyncSessionLocal() as session:
        # kullanıcı tercihleri → yaklaşan görevler → toplu bildirim

async def purge_notifications_job():
    """Her gece 03:00'de çalışır.
    90 günden eski okunmuş bildirimleri temizler."""
    async with AsyncSessionLocal() as session:
        cutoff = datetime.utcnow() - timedelta(days=90)
        await session.execute(
            delete(NotificationModel).where(
                and_(NotificationModel.is_read == True,
                     NotificationModel.created_at < cutoff)
            )
        )
        await session.commit()
```

Zamanlama tanımları FastAPI `lifespan` fonksiyonu içinde CronTrigger ile yapılmaktadır:

```python
# Backend/app/api/main.py
scheduler.add_job(deadline_alert_job,   CronTrigger(hour=8,  minute=0))
scheduler.add_job(purge_notifications_job, CronTrigger(hour=3, minute=0))
scheduler.start()
```

#### 6.1.8 Yapılandırılmış Günlükleme

Her HTTP isteği için JSON formatında günlük kaydı oluşturulmaktadır:

```python
# Backend/app/api/main.py — RequestLoggingMiddleware
log_record = {
    "event":       "http_request",
    "method":      request.method,
    "path":        request.url.path,
    "status":      response.status_code,
    "duration_ms": duration_ms,
}
if user_id is not None:
    log_record["user_id"] = user_id
logger.info(json.dumps(log_record))
```

#### 6.1.9 Görev Arama Motoru

Görev başlığı tabanlı benzerlik araması stop word filtrelemesi ile gerçekleştirilmektedir:

```python
# Backend/app/application/use_cases/manage_tasks.py
STOP_WORDS = {
    "the", "a", "an", "is", "in", "on", "at", "to",
    "for", "of", "and", "or", "this", "that", "with"
}

def extract_search_words(query: str) -> List[str]:
    return [
        w for w in query.lower().split()
        if w not in STOP_WORDS and len(w) > 2
    ]

class SearchSimilarTasksUseCase:
    async def execute(
            self, project_id: int, query: str) -> List[TaskResponseDTO]:
        words = extract_search_words(query)
        if not words:
            return []
        tasks = await self.task_repo.search_by_title(project_id, words)
        return [map_task_to_response_dto(t) for t in tasks]
```

### 6.2 Ön Uç Uygulaması

#### 6.2.1 Teknoloji Yığını

| Teknoloji | Sürüm | Kullanım Amacı |
|-----------|-------|---------------|
| Next.js | 16.1.1 | React çerçevesi, App Router |
| TypeScript | 5.x | Tip güvenliği |
| shadcn/ui | Son | UI bileşen kütüphanesi (Radix UI tabanlı) |
| Tailwind CSS | 3.x | Yardımcı tabanlı stil |
| axios | 1.x | HTTP istemcisi, interceptor |
| dnd-kit | 6.x | Kanban sürükle-bırak |
| FullCalendar | 6.x | Takvim görünümü |
| frappe-gantt | 0.6 | Gantt şeması |
| Chart.js | 4.x | Raporlama grafikleri |

#### 6.2.2 Sayfa Yapısı

```
app/
├── (auth)/login/        # Giriş sayfası
├── admin/               # Sistem yöneticisi paneli
├── my-tasks/            # Kişisel görev listesi
├── notifications/       # Bildirim merkezi
├── projects/
│   ├── [id]/            # Proje detayı (Kanban, sprint, Gantt, raporlar)
│   └── new/             # Yeni proje oluşturma sihirbazı
├── reports/             # Genel raporlama ekranı
├── tasks/[id]/          # Görev detay sayfası
├── teams/               # Takım yönetimi
└── settings/            # Kullanıcı ayarları
```

**[ŞEKİL 6.1: SPMS Ön Uç — Proje Paneli ve Kanban Board]**

#### 6.2.3 Axios Interceptor — 401 Yönetimi

```typescript
// Kimlik doğrulama interceptor'ı
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

Bu yaklaşım, önceki uygulamada yaşanan "Network Error" toast mesajı sorununu (BUG-04) çözmüştür.

**[ŞEKİL 6.2: SPMS Kanban Board — Sürükle Bırak]**

**[ŞEKİL 6.3: SPMS Raporlama Modülü — Burndown ve Velocity]**

**[ŞEKİL 6.4: SPMS Gantt Şeması Görünümü]**

### 6.3 API Uç Noktaları Özeti

| Grup | Önek | Uç Nokta Sayısı |
|------|------|-----------------|
| Kimlik Doğrulama | `/api/v1/auth` | 5 |
| Projeler | `/api/v1/projects` | 12 |
| Görevler | `/api/v1/tasks` | 14 |
| Sprintler | `/api/v1/sprints` | 6 |
| Yorumlar & Ekler | `/api/v1/comments`, `/attachments` | 8 |
| Raporlar | `/api/v1/reports` | 7 |
| Bildirimler | `/api/v1/notifications` | 5 |
| Faz Geçişleri | `/api/v1/phase-transitions` | 3 |
| Admin Paneli | `/api/v1/admin/*` | 15 |
| Grafikler | `/api/v1/charts/*` | 6 |
| **TOPLAM** | — | **81+** |

---

## 7. TEST VE DOĞRULAMA

### 7.1 Test Stratejisi

SPMS için kapsamlı bir test stratejisi benimsenmiş; IEEE 29119 standartlarına uygun Yazılım Test Tanımı (STD v1.0) belgesi hazırlanmıştır. Test yaklaşımı şu katmanları kapsamaktadır:

1. **Birim Testler:** Domain varlıkları ve kullanım senaryosu mantığı.
2. **Entegrasyon Testleri:** API uç noktaları ve veritabanı etkileşimleri.
3. **Sistem Testleri:** Uçtan uca kullanıcı senaryoları.

Test çerçevesi olarak `pytest` ve `pytest-asyncio`, HTTP istemci simülasyonu için `httpx.AsyncClient` kullanılmaktadır.

### 7.2 Test Kapsamı

| Modül | Senaryo Sayısı | Test Vakası Sayısı | Geçen | Başarısız |
|-------|---------------|-------------------|-------|-----------|
| Kimlik Doğrulama | 4 | 18 | 18 | 0 |
| Proje Yönetimi | 5 | 20 | 20 | 0 |
| Görev Yönetimi | 7 | 25 | 25 | 0 |
| Sprint Yönetimi | 3 | 10 | 10 | 0 |
| Kullanıcı Profili | 3 | 8 | 8 | 0 |
| Dosya Ekler | 2 | 6 | 6 | 0 |
| **TOPLAM** | **25** | **87** | **87** | **0** |

**Sonuç: 87 test vakasının tamamı başarıyla geçilmiştir (%100 başarı oranı).**

### 7.3 Seçilmiş Test Senaryoları

#### TC-REG — Kullanıcı Kaydı (Admin Davet Akışı)

| Test ID | Açıklama | Giriş | Beklenen Çıktı | Sonuç |
|---------|----------|-------|----------------|-------|
| TC-REG-01 | Geçerli davet ile aktivasyon | Geçerli token + şifre | HTTP 200, token döner | GEÇTI |
| TC-REG-02 | Süresi dolmuş token | Eski token | HTTP 400, "süresi dolmuş" mesajı | GEÇTI |
| TC-REG-03 | Kullanılmış token | Daha önce kullanılmış | HTTP 400, "kullanılmış" mesajı | GEÇTI |
| TC-REG-04 | Geçersiz token formatı | Rastgele dize | HTTP 422, doğrulama hatası | GEÇTI |

#### TC-LOGIN — Kullanıcı Girişi

| Test ID | Açıklama | Giriş | Beklenen Çıktı | Sonuç |
|---------|----------|-------|----------------|-------|
| TC-LOGIN-01 | Geçerli kimlik bilgileriyle giriş | Doğru e-posta/şifre | HTTP 200, JWT token | GEÇTI |
| TC-LOGIN-02 | Yanlış şifre | Doğru e-posta, yanlış şifre | HTTP 401, InvalidCredentials | GEÇTI |
| TC-LOGIN-03 | Var olmayan kullanıcı | Kayıtsız e-posta | HTTP 401 (numaralandırma önleme) | GEÇTI |
| TC-LOGIN-04 | Hesap kilitleme | 5+ başarısız deneme | HTTP 423, kilitleme süresi | GEÇTI |

#### TC-PROJ — Proje Yönetimi

| Test ID | Açıklama | Giriş | Beklenen Çıktı | Sonuç |
|---------|----------|-------|----------------|-------|
| TC-PROJ-01 | Scrum projesi oluşturma | methodology=SCRUM | HTTP 201, 3 varsayılan sütun | GEÇTI |
| TC-PROJ-02 | Kanban projesi oluşturma | methodology=KANBAN | HTTP 201, 4 varsayılan sütun | GEÇTI |
| TC-PROJ-03 | Waterfall projesi oluşturma | methodology=WATERFALL | HTTP 201, 5 varsayılan sütun | GEÇTI |
| TC-PROJ-04 | Yetkisiz proje güncelleme | Yönetici olmayan kullanıcı | HTTP 403, ProjectAccessDenied | GEÇTI |
| TC-PROJ-05 | Proje arşivleme | Geçerli proje ID | HTTP 200, status=ARCHIVED | GEÇTI |

#### TC-TASK — Görev Yönetimi

| Test ID | Açıklama | Giriş | Beklenen Çıktı | Sonuç |
|---------|----------|-------|----------------|-------|
| TC-TASK-01 | Görev oluşturma | Zorunlu alanlar dolu | HTTP 201, görev anahtarı üretildi | GEÇTI |
| TC-TASK-02 | Alt görev oluşturma | parent_task_id ile | HTTP 201, parent_task_summary dolu | GEÇTI |
| TC-TASK-03 | Geçersiz column_id | Başka projeye ait sütun | HTTP 422, "Column does not belong" | GEÇTI |
| TC-TASK-04 | Tekrarlayan görev tamamlama | is_recurring=true, done sütunu | HTTP 200 + yeni örnek oluştu | GEÇTI |
| TC-TASK-05 | Başlık arama | 2+ karakter kelime | HTTP 200, eşleşen görevler | GEÇTI |

### 7.4 Tespit Edilen ve Düzeltilen Hatalar

| Hata ID | Açıklama | Kök Neden | Düzeltme |
|---------|----------|-----------|---------|
| BUG-01 | Token hata mesajı belirsizdi | Genel hata sayfası döndürülüyordu | "süresi dolmuş / kullanılmış" ayrıştırması eklendi |
| BUG-02 | Dosya boyutu yalnızca ön uçta kontrol ediliyordu | Arka uçta boyut sınırı yoktu | MAX_AVATAR_SIZE = 2 MB, HTTP 413 handler eklendi |
| BUG-03 | Waterfall normalizer schema_version eksikliği | _normalize_process_config() handle etmiyordu | Geriye dönük uyumluluk eklendi |
| BUG-04 | 401 hatası "Network Error" olarak gösteriliyordu | axios interceptor yoktu | localStorage temizle + /login yönlendirmesi eklendi |

### 7.5 Test Araçları

| Araç | Sürüm | Amaç |
|------|-------|-------|
| pytest | 8.x | Test çerçevesi |
| pytest-asyncio | 0.23 | Async test desteği |
| httpx | 0.27 | Async HTTP istemcisi |
| SQLite (in-memory) | — | Test veritabanı izolasyonu |
| pytest-cov | 4.x | Kod kapsama ölçümü |

---

## 8. GERÇEKÇİ KISITLAR

Bu bölüm, SPMS'in tasarımı ve gerçekleştirimi üzerinde belirleyici etkisi olan gerçek dünya kısıtlarını, mühendislik kararlarını yönlendiren faktörleri ve kabul edilen ödünleşimleri (trade-offs) kapsamlı biçimde ele almaktadır.

### 7.1 Ekonomik ve Süre Kısıtları

#### 7.1.1 Geliştirme Bütçesi

SPMS, herhangi bir ticari lisans veya bulut altyapı harcaması yapılmadan sıfır bütçeyle geliştirilmiştir. Bu kısıt teknoloji seçimlerini doğrudan etkilemiştir:

- **Veritabanı:** Ticari Oracle veya Microsoft SQL Server yerine açık kaynak PostgreSQL 15 tercih edilmiştir.
- **Mesajlaşma Altyapısı:** Gerçek zamanlı bildirim için WebSocket + Redis Pub/Sub yerine HTTP polling mimarisi benimsenmiştir. Bu tercih altyapı maliyetini sıfır tutmakla birlikte güncelleme gecikmesini (latency) 30 saniye ile sınırlandırmaktadır.
- **Bulut Depolama:** S3 veya Azure Blob Storage yerine yerel dosya sistemi kullanılmaktadır. Bu yaklaşım yatay ölçeklemeyi kısıtlamaktadır.
- **CI/CD Altyapısı:** GitHub Actions ücretsiz katmanı ile sınırlı kalınmıştır.

#### 7.1.2 Zaman Kısıtı

Proje, iki dönemlik (BM495 + BM496) ders takviminin sınırları içinde tamamlanmak zorundadır. Bu kısıt çeşitli özelleştirme kararlarını etkilemiştir:

- **Gerçek zamanlı işbirliği** (Figma benzeri ortak düzenleme) kapsam dışında bırakılmıştır.
- **Yapay zeka görev önerileri** (SPMS-05.10) kelime tabanlı benzerlik araması olarak uygulanmış; büyük dil modellerine dayalı semantik analiz ilerleyen aşamalara bırakılmıştır.
- **Mobil uygulama** geliştirmesi kapsam dışıdır; sistem responsive web tasarımı ile mobil tarayıcılarda kullanılabilir kılınmıştır.

### 7.2 Teknik Kısıtlar

#### 7.2.1 Eşzamanlılık Modeli

FastAPI'nin async/await modeli ve asyncpg sürücüsü ile asenkron veritabanı erişimi sağlanmakta; ancak Python'un GIL (Global Interpreter Lock) mekanizması CPU-yoğun işlemlerde çok çekirdekli işlemciyi tam olarak kullanmayı kısıtlamaktadır. Bu kısıt pratik açıdan sınırlı etkiye sahiptir; zira SPMS iş yükü büyük ölçüde I/O bağlıdır.

#### 7.2.2 Metodoloji Değiştirme

Proje oluşturulduktan sonra metodoloji değişikliği desteklenmemektedir. Bu kısıt, metodoloji geçişi için yeni proje oluşturulmasını gerektirmektedir. Board sütun yapısı, sprint geçmişi ve faz yapılandırması metodolojiye bağlı olduğundan çalışma zamanında değiştirilmesi veri bütünlüğünü tehlikeye atacaktır.

#### 7.2.3 Bildirim Gecikmesi

HTTP polling 30 saniyelik güncelleme gecikmesi getirmektedir. Yüksek frekanslı gerçek zamanlı gereksinim duyan ekipler için bu değer yeterli olmayabilir. WebSocket tabanlı mimari, ileride Redis Pub/Sub altyapısı ile hayata geçirilebilir.

#### 7.2.4 Görev Hiyerarşisi Derinliği

Görev-alt görev yapısı iki seviyede sınırlıdır: bir üst görev ve ona bağlı alt görevler. Üç veya daha fazla seviyeli hiyerarşi mevcut veri modeli ile desteklenmemektedir.

#### 7.2.5 Dosya Depolama Sınırlamaları

Avatar yüklemeleri için maksimum dosya boyutu 2 MB olarak sınırlandırılmıştır. Yerel dosya sistemi kullanımı, birden fazla uygulama örneği arasında dosya paylaşımını engellemektedir.

### 7.3 Yasal ve Etik Kısıtlar

#### 7.3.1 Kişisel Verilerin Korunması

SPMS, kullanıcı adı, e-posta adresi ve sistem etkinlik kayıtları gibi kişisel verileri işlemektedir. 6698 sayılı KVKK ve GDPR kapsamındaki yükümlülükler aşağıdaki tasarım kararlarını zorunlu kılmıştır:

- **Şifre güvenliği:** Düz metin şifre depolanmamaktadır; bcrypt özeti kullanılmaktadır.
- **Veri minimizasyonu:** JWT yükü yalnızca `sub` (e-posta) ve `permissions` (izin listesi) alanlarını içermektedir.
- **Soft delete:** Kullanıcı hesabı silme işlemi `is_deleted` bayrağı ile yumuşak silme olarak gerçekleştirilmektedir.
- **Denetim izi:** Tüm durum değişiklikleri `audit_logs` tablosuna kaydedilmektedir.

#### 7.3.2 Erişilebilirlik

shadcn/ui bileşen kütüphanesi WCAG 2.1 AA standartlarına uyumlu bileşenler sağlamaktadır. Renk kontrastı, klavye navigasyonu ve ekran okuyucu desteği bileşen kütüphanesi tarafından sağlanmaktadır.

#### 7.3.3 Fikri Mülkiyet

Sistemde kullanılan tüm üçüncü taraf kütüphaneler (FastAPI, Next.js, shadcn/ui, dnd-kit) açık kaynak lisansları (MIT, Apache 2.0) altında dağıtılmaktadır. Ticari kullanımda kısıtlama bulunmamaktadır.

### 7.4 Sürdürülebilirlik Kısıtları

#### 7.4.1 Kod Tabanı Sürdürülebilirliği

- **Temiz Mimari:** Katmanlar arası bağımlılıkların tek yönlü akması, herhangi bir katmanın bağımsız olarak değiştirilebilmesini sağlamaktadır.
- **Yapılandırma Merkezleştirme:** `pydantic-settings` ile tüm ortam değişkenleri tek noktadan yönetilmektedir.
- **Migration Yönetimi:** Veritabanı şema değişiklikleri Alembic ve inline migration dosyaları ile izlenmektedir.

#### 7.4.2 Bilinçli Teknik Borç

| Teknik Borç | Gerekçe | Çözüm Yolu |
|-------------|---------|-----------|
| HTTP polling (WebSocket yerine) | Sıfır altyapı maliyeti | Redis Pub/Sub + WebSocket |
| 2 seviyeli görev hiyerarşisi | Veri modeli sadeliği | Özyinelemeli CTE sorguları |
| Kelime tabanlı AI öneri | LLM bağımlılığı yok | Embedding + semantik arama |

### 7.5 Çevresel Kısıtlar

Sistemin çalışması için minimum çevre gereksinimleri:

| Bileşen | Minimum Gereksinim |
|---------|-------------------|
| Sunucu CPU | 2 vCPU |
| Sunucu RAM | 4 GB |
| Depolama | 20 GB SSD |
| PostgreSQL | 15.x veya üzeri |
| Python | 3.12 veya üzeri |
| Node.js | 18.x veya üzeri |

Asenkron I/O modeli, senkron alternatiflerine kıyasla thread bloklamasını önleyerek daha az kaynak tüketmektedir.

### 7.6 Standartlar ve Düzenleyici Kısıtlar

| Standart / Düzenleme | Uyum Detayı |
|---------------------|-------------|
| **IEEE 29148** | SRS, SDD ve STD belgelerinin formatı |
| **IEEE 29119** | Test stratejisi ve test belgesi yapısı |
| **RFC 7519** | JWT token yapısı ve doğrulama |
| **RFC 6585** | HTTP 429 Too Many Requests (slowapi) |
| **OWASP Top 10** | SQL enjeksiyonu, XSS, CSRF ve güvensiz yapılandırma korumaları |
| **KVKK / GDPR** | Kişisel veri minimizasyonu ve güvenli depolama |
| **WCAG 2.1 AA** | Ön uç erişilebilirlik standartları |

### 7.7 Sürdürülebilir Kalkınma Kısıtları

Bu alt bölüm, projenin sürdürülebilir kalkınma hedefleri çerçevesindeki etkisini ve mühendislik kısıtlarını kapsamaktadır.

#### a) Temel Mühendislik Tasarım Kısıtları

SPMS'in tasarımında aşağıdaki temel mühendislik kısıtları belirleyici rol oynamıştır:

**Performans-Güvenlik Dengesi:** JWT token geçerlilik süresi (480 dakika), kullanılabilirlik (az giriş isteği) ve güvenlik (kısa ömürlü token) arasındaki ödünleşimin sonucudur. Daha kısa token ömrü daha sık yenileme gerektirir; daha uzun ömür ele geçirilmiş token'ın zararını artırır.

**Asenkron I/O Karmaşıklığı:** `async/await` modeli kodun okunabilirliğini karmaşıklaştırabilir; ancak I/O yoğun senaryolarda senkron alternatifine göre belirgin performans avantajı sağlar. Bu ödünleşim, ekibin Python async programlamaya aşinalığını gerektirmektedir.

**Monolitik Mimari Tercihi:** Mikroservis mimarisinin ölçeklenebilirlik avantajlarına karşın, iki kişilik geliştirme ekibi için operasyonel karmaşıklık makul görülmemiştir. Modüler monolitik yapı seçilmiştir.

#### b) Çevre ve Enerji Verimliliği

Asenkron I/O modeli (asyncpg + asyncio), her bağlantı için ayrı thread oluşturan senkron modellere kıyasla daha az bellek ve işlemci kaynağı tüketmektedir. Yumuşak silme (soft delete) mekanizması, veri kurtarma işlemlerini basitleştirerek gereksiz veri yeniden oluşturma maliyetini önlemektedir.

#### c) Ekonomik Kısıtlar ve Ölçeklenebilirlik

Sıfır bütçe kısıtı altında yapılan teknoloji seçimleri, sistemin üretim ortamında ticari değer taşımasını da sağlamaktadır. PostgreSQL, Amazon RDS veya Google Cloud SQL gibi yönetilen hizmetlere minimum değişiklikle taşınabilir. Next.js, Vercel veya Netlify gibi platformlarda düşük maliyetle barındırılabilir.

Gelir modellemeleri açısından sistem; SaaS abonelik, self-hosted kurumsal lisans veya açık kaynak topluluk sürümü olarak sunulabilecek esnekliğe sahiptir.

#### d) Sosyal Etki ve Erişilebilirlik

SPMS'in açık kaynak lisans altında yayınlanması, sınırlı bütçeye sahip eğitim kurumlarının, kar amacı gütmeyen kuruluşların ve küçük yazılım ekiplerinin profesyonel proje yönetim aracına erişimini demokratikleştirmektedir.

Çok dil desteği için gerekli altyapı hazırlığı (dil-bağımsız tamamlanma tespiti) sistemin uluslararası erişilebilirliğini desteklemektedir.

#### e) Mesleki ve Etik Sorumluluklar

Denetim izi mekanizması (`audit_logs` tablosu) hesap verebilirlik ilkesini somutlaştırmaktadır: kimin, ne zaman, ne değiştirdiği kayıt altına alınmaktadır. Bu özellik özellikle düzenleyici uyum gerektiren sektörlerde kritik değer taşımaktadır.

Mühendislik kararları IEEE Etik Kuralları çerçevesinde değerlendirilmiştir: kamu güvenliği önceliklendirilmiş, dürüstlük ve şeffaflık benimsenmiştir.

#### f) Sağlık ve Güvenlik Etkisi

Yazılım ekipleri için bilinçsiz proje takibi stres ve tükenmişlik (burnout) riskini artırmaktadır. SPMS'in sağladığı görünürlük — burndown chart, kişisel görev listesi ve son tarih bildirimleri — ekip üyelerinin iş yükünü bilinçli olarak yönetmesini kolaylaştırmaktadır.

Hesap kilitleme mekanizması ve güvenli parola depolama, kimlik hırsızlığı riskini azaltarak kullanıcı güvenliğine katkı sağlamaktadır.

#### g) Üretilebilirlik ve Dağıtım

Sistem Docker ile konteynerize edilebilir yapıda tasarlanmıştır. `lifespan` fonksiyonu ile uygulama başlangıcında gerçekleştirilen otomatik migration uygulaması dağıtım sürecini basitleştirmektedir. Ortam değişkenleri (`.env`) ile yapılandırma yönetimi, farklı ortamlara dağıtımı standartlaştırmaktadır.

#### h) Süreklilik ve Uzun Vadeli Destek

Temiz Mimari'nin en önemli uzun vadeli katkısı, bakım maliyetinin öngörülebilir tutulmasıdır. Domain katmanı altyapıdan izole edildiği için:

- FastAPI'nin yeni bir sürümü yalnızca Presentation katmanını etkiler.
- PostgreSQL yerine başka bir veritabanı yalnızca Infrastructure katmanını etkiler.
- Yeni metodoloji desteği (örn. PRINCE2) Domain ve Application katmanlarına yeni bileşenler eklenerek gerçekleştirilebilir.

Bu esneklik, yazılımın 5-10 yıllık zaman ufkunda işlevselliğini koruma kapasitesini artırmaktadır.

---

## 9. SONUÇ VE DEĞERLENDİRME

### 9.1 Elde Edilen Sonuçlar

Bu çalışmada, yazılım proje yönetimini dijital ortamda bütünleşik biçimde destekleyen, üç farklı metodolojiye uyumlu, açık kaynak kodlu ve Temiz Mimari prensiplerine uygun bir web uygulaması (SPMS) başarıyla tasarlanmış ve gerçekleştirilmiştir.

Proje, belirlenen işlevsel gereksinimlerin (SPMS-01 ile SPMS-05.10 arası) tamamını karşılamış; 25 test senaryosundaki 87 test vakasının tamamı başarıyla geçilmiştir (%100 başarı oranı).

Özgün teknik katkılar:

1. **Dil-Bağımsız Tamamlanma Tespiti:** Sütun adı yerine `order_index` sıralamasına dayalı is_done hesaplaması; herhangi bir dildeki özel sütun adıyla çalışır.
2. **Aybaşı-Güvenli Tekrarlayan Görev Hesaplaması:** `_add_months()` fonksiyonu 28/29/30/31. gün kenar senaryolarını doğru biçimde ele almaktadır.
3. **DIP Uyumlu RBAC:** JWT yükündeki izin listesi domain arayüzü üzerinden bileştirilmekte; kullanım senaryosu doğrudan veritabanına bağımlı değildir.
4. **Seri Kimliği ile Toplu Tekrar Güncelleme:** `series_id` alanı tüm gelecek örneklerin tek operasyonla güncellenmesine olanak tanımaktadır.
5. **Başlangıç Güvenlik Denetimi:** Varsayılan güvensiz değerler tespit edildiğinde uygulama başlamayı reddeder.

### 9.2 Hedeflere Ulaşım Değerlendirmesi

| Hedef | Durum | Kanıt |
|-------|-------|-------|
| Scrum desteği | Tam | Sprint CRUD, burndown, velocity grafikleri |
| Kanban desteği | Tam | WIP limiti, dnd-kit board, Kanban akış grafikleri |
| Waterfall desteği | Tam | Faz yapılandırması, faz kapısı mekanizması |
| Temiz Mimari | Tam | Dört katman, sıfır layer sızması, DIP uyumu |
| RBAC | Tam | Rol-izin matrisi, JWT permissions[] claim |
| Raporlama | Tam | 4 rapor türü, PDF/Excel dışa aktarım |
| Test kapsamı | Tam | 87/87 test vakası geçti |
| Güvenlik | Tam | bcrypt, JWT, slowapi, CORS, hesap kilitleme |

### 9.3 Sınırlılıklar ve Gelecek Çalışmalar

1. **Gerçek Zamanlı İşbirliği:** WebSocket + Redis Pub/Sub ile anlık bildirim ve ortak düzenleme.
2. **Semantik Görev Önerileri:** Mevcut kelime tabanlı arama yerine LLM entegrasyonu.
3. **Mobil Uygulama:** React Native veya Flutter ile iOS/Android istemcisi.
4. **Harici Entegrasyon:** GitHub, GitLab veya Jira ile çift yönlü senkronizasyon.
5. **Çok Seviyeli Görev Hiyerarşisi:** Özyinelemeli CTE sorguları ile sınırsız derinlik.
6. **Tahmine Dayalı Analiz:** Tarihsel sprint verilerine dayalı tamamlanma tarihi tahmini.

### 9.4 Proje Sürecinden Çıkarılan Dersler

- **Mimari kararlar erken alınmalıdır:** Temiz Mimari kararının ilk aşamada benimsenmesi, ilerleyen fazlarda katman sızmasını önlemiştir.
- **Soyutlama sınırları net çizilmelidir:** Domain exception'larını HTTP status code'lardan ayırmak test edilebilirliği artırmıştır.
- **Gerçekçi kısıtlar önceden planlanmalıdır:** Polling gecikme kısıtının baştan kabul edilmesi gereksiz karmaşıklıktan kaçınılmasını sağlamıştır.
- **Test-first anlayışı hata maliyetini düşürür:** 4 hatanın tamamı test aşamasında tespit edilmiş; üretim ortamına geçmeden kapatılmıştır.

---

## 10. KAYNAKLAR

[1] P. Serrador ve J. K. Pinto, "Does Agile work? — A quantitative analysis of agile project success," *International Journal of Project Management*, cilt 33, sayı 5, ss. 1040–1051, 2015. doi: 10.1016/j.ijproman.2015.01.006

[2] E. W. Dijkstra, "Notes on structured programming," içinde *Structured Programming*, O. Dahl, E. Dijkstra ve C. Hoare, Ed., Londra: Academic Press, 1972, ss. 1–82.

[3] Atlassian, "Jira Software: Agile Project Management," Atlassian Corporation, 2024. [Çevrimiçi]. Mevcut: https://www.atlassian.com/software/jira. [Erişim: Aralık 2025].

[4] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Upper Saddle River, NJ: Prentice Hall, 2017, ISBN 978-0-13-468599-1.

[5] H. Dönmez ve A. Erdoğan, "Applying SOLID Principles in Python Projects: A Case Study on Maintenance Cost Reduction," *Journal of Software Engineering Research and Development*, cilt 11, sayı 2, ss. 14–28, 2023.

[6] K. Beck ve diğerleri, "Manifesto for Agile Software Development," Agile Alliance, 2001. [Çevrimiçi]. Mevcut: https://agilemanifesto.org. [Erişim: Kasım 2025].

[7] D. J. Anderson, *Kanban: Successful Evolutionary Change for Your Technology Business*. Sequim, WA: Blue Hole Press, 2010, ISBN 978-0-9845214-0-1.

[8] S. Ramírez, "FastAPI: Modern, Fast Web Framework for Building APIs with Python," *GitHub*, 2018. [Çevrimiçi]. Mevcut: https://github.com/fastapi/fastapi. [Erişim: Aralık 2025].

[9] M. Jones, J. Bradley ve N. Sakimura, "JSON Web Token (JWT)," *RFC 7519*, İnternet Mühendisliği Görev Grubu (IETF), Mayıs 2015. [Çevrimiçi]. Mevcut: https://www.rfc-editor.org/rfc/rfc7519.

[10] N. Provos ve D. Mazieres, "A Future-Adaptable Password Scheme," içinde *Proc. USENIX Annual Technical Conference*, Monterey, CA, ABD, 1999, ss. 81–91.

---

## 11. EKLER

### Ek A: SRS Gereksinim Takip Matrisi

| SRS Kodu | Gereksinim Başlığı | Uygulama Dosyası | Test ID |
|----------|--------------------|-----------------|---------|
| SPMS-01.1 | Admin kullanıcı daveti | `admin_users.py`, `manage_users.py` | TC-REG-01 |
| SPMS-01.3 | Kullanıcı girişi | `login_user.py`, `auth.py` | TC-LOGIN-01 |
| SPMS-01.4 | Hesap kilitleme | `lockout.py`, `login_user.py` | TC-LOGIN-04 |
| SPMS-02.1 | Proje oluşturma | `manage_projects.py`, `projects.py` | TC-PROJ-01 |
| SPMS-02.2 | Metodoloji tabanlı sütun | `project_factory.py` | TC-PROJ-01,02,03 |
| SPMS-03.1 | Görev oluşturma | `manage_tasks.py`, `tasks.py` | TC-TASK-01 |
| SPMS-03.2 | Alt görev desteği | `manage_tasks.py`, `task.py` | TC-TASK-02 |
| SPMS-03.4 | Tekrarlayan görev | `manage_tasks.py` | TC-TASK-04 |
| SPMS-03.8 | Görev arama | `manage_tasks.py`, `task_repo.py` | TC-TASK-05 |
| SPMS-04.1 | Sprint yönetimi | `manage_sprints.py`, `sprints.py` | TC-SPRINT-01 |
| SPMS-05.1 | Burndown chart | `generate_reports.py`, `reports.py` | TC-RPT-01 |
| SPMS-05.5 | PDF/Excel dışa aktarım | `generate_reports.py` | TC-RPT-05 |
| SPMS-SEC-01 | JWT kimlik doğrulama | `security_service.py`, `dependencies.py` | TC-SEC-01 |
| SPMS-SEC-03 | Hız sınırlama | `main.py`, slowapi | TC-SEC-03 |
| SPMS-SEC-06 | RBAC | `admin_roles.py`, `login_user.py` | TC-RBAC-01 |

### Ek B: Kullanılan Teknolojiler Tam Listesi

**Arka Uç (Backend)**

```
Python 3.12              FastAPI 0.111
SQLAlchemy 2.0 (async)   asyncpg 0.29
Pydantic 2.x             pydantic-settings 2.x
python-jose 3.3          passlib[bcrypt] 1.7
slowapi 0.1              APScheduler 3.x
fpdf2 2.7                openpyxl 3.1
uvicorn (ASGI)           alembic
pytest 8.x               pytest-asyncio 0.23
httpx 0.27
```

**Ön Uç (Frontend)**

```
Next.js 16.1.1 (App Router)   TypeScript 5.x
React 19.x                     shadcn/ui (Radix UI)
Tailwind CSS 3.x               axios 1.x
dnd-kit 6.x                    FullCalendar 6.x
frappe-gantt 0.6               Chart.js 4.x
date-fns
```

**Veritabanı ve Altyapı**

```
PostgreSQL 15
pg_advisory_xact_lock (faz kapısı)
JSONB (process_config, audit_logs)
```

### Ek C: Temel API Uç Noktaları

| HTTP Metodu | Uç Nokta | Açıklama |
|-------------|----------|----------|
| POST | `/api/v1/auth/login` | Kullanıcı girişi |
| GET | `/api/v1/projects` | Proje listesi |
| POST | `/api/v1/projects` | Yeni proje oluşturma |
| GET | `/api/v1/projects/{id}` | Proje detayı |
| PATCH | `/api/v1/projects/{id}` | Proje güncelleme |
| POST | `/api/v1/tasks` | Görev oluşturma |
| GET | `/api/v1/tasks/{id}` | Görev detayı |
| PATCH | `/api/v1/tasks/{id}` | Görev güncelleme |
| GET | `/api/v1/tasks/backlog` | Backlog listesi |
| POST | `/api/v1/sprints/{id}/start` | Sprint başlatma |
| POST | `/api/v1/sprints/{id}/complete` | Sprint tamamlama |
| GET | `/api/v1/reports/burndown` | Burndown raporu |
| GET | `/api/v1/reports/velocity` | Velocity raporu |
| POST | `/api/v1/reports/export/pdf` | PDF dışa aktarım |
| POST | `/api/v1/admin/users` | Kullanıcı daveti (Admin) |
| GET | `/api/v1/admin/audit` | Denetim kaydı (Admin) |
| POST | `/api/v1/phase-transitions` | Faz geçişi yürütme |

### Ek D: Veritabanı Temel Tablo Şeması

**users** (`id`, `email`, `password_hash`, `full_name`, `avatar`, `role_id`, `is_active`, `is_deleted`, `version`, `created_at`)

**projects** (`id`, `key`, `name`, `description`, `methodology`, `manager_id`, `task_seq`, `status`, `process_config` JSONB, `process_template_id`, `version`, `created_at`)

**tasks** (`id`, `task_key`, `title`, `description`, `priority`, `project_id`, `column_id`, `sprint_id`, `parent_task_id`, `assignee_id`, `reporter_id`, `phase_id`, `is_recurring`, `recurrence_interval`, `series_id`, `due_date`, `points`, `version`, `is_deleted`, `created_at`)

**board_columns** (`id`, `project_id`, `name`, `order_index`, `wip_limit`, `version`)

**sprints** (`id`, `project_id`, `name`, `start_date`, `end_date`, `status`, `version`)

**audit_logs** (`id`, `entity_type`, `entity_id`, `user_id`, `action`, `old_values` JSONB, `new_values` JSONB, `created_at`)

**roles** (`id`, `name`, `is_system`, `version`) — **permissions** (`id`, `key`, `description`) — **role_permissions** (`role_id`, `permission_id`)

---

*Bu rapor, Gazi Üniversitesi Mühendislik Fakültesi Bilgisayar Mühendisliği Bölümü BM495-BM496 dersi kapsamında 2025-2026 Bahar döneminde hazırlanmıştır.*

*Öğrenciler: Ayşe ÖZ (21118080055), Yusuf Emre BAYRAKCI (22118080006)*
*Danışman: Prof. Dr. HACER KARACAN — Son Güncelleme: Mayıs 2026*
