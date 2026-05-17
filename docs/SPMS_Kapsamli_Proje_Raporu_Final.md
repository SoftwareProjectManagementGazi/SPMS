# T.C. GAZİ ÜNİVERSİTESİ
## MÜHENDİSLİK FAKÜLTESİ — BİLGİSAYAR MÜHENDİSLİĞİ BÖLÜMÜ

**BM495 / BM496 BİLGİSAYAR MÜHENDİSLİĞİ PROJESİ I–II**

---

# YAZILIM PROJESİ YÖNETİM YAZILIMI (SPMS)
## KAPSAMLI PROJE RAPORU

*Software Project Management System — Final Project Report*

---

**Hazırlayanlar**
- Ayşe ÖZ — 21118080055
- Yusuf Emre BAYRAKCI — 22118080006

**Akademik Danışman**
- Prof. Dr. Hacer KARACAN

**Akademik Yıl:** 2025–2026
**Tarih:** Mayıs 2026

---

## İÇİNDEKİLER

1. [Giriş](#1-giriş)
2. [Literatür Araştırması](#2-literatür-araştırması)
3. [Gereksinim Analizi](#3-gereksinim-analizi)
4. [Sistem Mimarisi ve Tasarım](#4-sistem-mimarisi-ve-tasarım)
5. [Uygulama (İmplementasyon)](#5-uygulama-i̇mplementasyon)
6. [Test ve Doğrulama](#6-test-ve-doğrulama)
7. [Proje Yönetimi ve Süreç Değerlendirmesi](#7-proje-yönetimi-ve-süreç-değerlendirmesi)
8. [Gerçekçi Kısıtlar](#8-gerçekçi-kısıtlar)
9. [Sonuç ve Değerlendirme](#9-sonuç-ve-değerlendirme)
10. [Kaynaklar](#10-kaynaklar)

---

## ŞEKİLLER LİSTESİ

| Şekil | Açıklama |
|-------|----------|
| Şekil 2.1 | Yazılım Yönetim Araçlarında En Çok Kullanılan İşlevler |
| Şekil 4.1 | SPMS Clean Architecture Katman Diyagramı |
| Şekil 4.2 | SPMS Veritabanı Varlık-İlişki (ER) Diyagramı |
| Şekil 4.3 | Strategy Pattern ile Süreç Modeli Tasarımı |
| Şekil 4.4 | Görev Durumu Geçiş Diyagramı (TaskStatus State Machine) |
| Şekil 4.5 | JWT Kimlik Doğrulama Akış Diyagramı |
| Şekil 5.1 | Proje Yaşam Döngüsü Yönetim Ekranı (Lifecycle Tab) |
| Şekil 5.2 | Workflow Editor — Görsel Süreç Modeli Tasarımcısı |
| Şekil 5.3 | Phase Gate (Faz Geçiş Kapısı) Kriter Değerlendirme Akışı |
| Şekil 5.4 | Görev Tahta Görünümü (Kanban Board) — WIP Limit İhlali |
| Şekil 5.5 | Gantt ve Takvim Görünümleri |
| Şekil 5.6 | Sprint Yönetimi ve Burndown Grafiği |
| Şekil 5.7 | Kümülatif Akış Diyagramı (CFD) ve Lead/Cycle Time |
| Şekil 5.8 | "AI öner" — Yapay Zekâ Tabanlı Workflow Önerisi (Yakında) |
| Şekil 5.9 | Admin Paneli ve İzin Matrisi (RBAC) |
| Şekil 7.1 | Geliştirme Süreci Faz Zaman Çizelgesi |

---

## TABLOLAR LİSTESİ

| Tablo | Açıklama |
|-------|----------|
| Tablo 2.1 | Yaygın Proje Yönetim Yazılımlarının İşlevsel Karşılaştırması |
| Tablo 3.1 | SPMS Modülleri ve Sorumluluk Alanları |
| Tablo 3.2 | Kullanıcı Rolleri ve Yetki Kapsamı |
| Tablo 3.3 | Gereksinim İzlenebilirlik Matrisi (Özet) |
| Tablo 4.1 | Clean Architecture Katman Bağımlılık Kuralları |
| Tablo 4.2 | Süreç Modeli Stratejileri ve Davranış Farkları |
| Tablo 5.1 | Backend Teknoloji Yığını ve Sürümleri |
| Tablo 5.2 | Frontend Teknoloji Yığını ve Sürümleri |
| Tablo 5.3 | Yaşam Döngüsü Şablonları (9 Preset) |
| Tablo 5.4 | Phase Gate Hata Kodları ve HTTP Yanıtları |
| Tablo 6.1 | Test Türleri ve Kapsam Özeti |
| Tablo 7.1 | Görev Dağılımı ve İşbölümü |
| Tablo 8.1 | Ders–Proje Bilgi Transferi |
| Tablo 8.2 | Kullanılan Araç–Amaç Eşleştirmesi |
| Tablo 8.3 | Uyulan Mühendislik Standartları |

---

## SİMGELER VE KISALTMALAR

| Kısaltma | Açıklama |
|----------|----------|
| **ABC** | Abstract Base Class (Soyut Temel Sınıf) |
| **API** | Application Programming Interface (Uygulama Programlama Arayüzü) |
| **BFS** | Breadth-First Search (Genişlik Öncelikli Arama) |
| **CFD** | Cumulative Flow Diagram (Kümülatif Akış Diyagramı) |
| **CI/CD** | Continuous Integration / Continuous Delivery |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DI** | Dependency Injection (Bağımlılık Enjeksiyonu) |
| **DIP** | Dependency Inversion Principle |
| **DTO** | Data Transfer Object (Veri Transfer Nesnesi) |
| **E2E** | End-to-End (Uçtan Uca) |
| **ER** | Entity-Relationship (Varlık-İlişki) |
| **GDPR** | General Data Protection Regulation |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **ISP** | Interface Segregation Principle |
| **JWT** | JSON Web Token |
| **KVKK** | Kişisel Verilerin Korunması Kanunu |
| **LSP** | Liskov Substitution Principle |
| **MVP** | Minimum Viable Product |
| **OCP** | Open/Closed Principle |
| **ORM** | Object-Relational Mapping |
| **OWASP** | Open Web Application Security Project |
| **PDF** | Portable Document Format |
| **PMBOK** | Project Management Body of Knowledge |
| **RBAC** | Role-Based Access Control (Rol Tabanlı Erişim Kontrolü) |
| **REST** | Representational State Transfer |
| **SDD** | Software Design Description |
| **SOLID** | Single Responsibility / Open-Closed / Liskov / Interface Segregation / Dependency Inversion |
| **SPMS** | Software Project Management System (Yazılım Projesi Yönetim Yazılımı) |
| **SRP** | Single Responsibility Principle |
| **SRS** | Software Requirements Specification |
| **STD** | Software Test Description |
| **TLS** | Transport Layer Security |
| **UAT** | User Acceptance Testing |
| **UI/UX** | User Interface / User Experience |
| **WCAG** | Web Content Accessibility Guidelines |
| **WIP** | Work In Progress (Devam Eden İş) |
| **YZ** | Yapay Zekâ |

---

## ÖZET

Bu çalışmada, yazılım geliştirme ekiplerinin proje yönetim süreçlerini tek bir platformda yürütebilmelerini sağlayan, web tabanlı, tam işlevli ve metodoloji-bağımsız bir proje yönetim sistemi olan **SPMS (Software Project Management System / Yazılım Projesi Yönetim Yazılımı)** tasarlanmış ve uygulanmıştır. Sistem; Scrum, Kanban, Waterfall ve İteratif/Artırımlı süreç modellerinin tamamını tek bir kod tabanında destekleyecek biçimde, **Strategy Pattern** üzerine kurgulanmıştır. Bu sayede kullanıcı, projenin başında metodolojiyi seçtikten sonra ilgili sürece özgü kuralların (Sprint zorunluluğu, WIP limitleri, görev bağımlılıkları, faz geçişleri) otomatik olarak işlemesini sağlamaktadır.

Mevcut ticari çözümlerin (Jira, Asana, Microsoft Project) yüksek lisans ücretleri, küçük ve orta ölçekli ekiplerin tek bir araçta birleşik metodoloji desteğine erişimini güçleştirmektedir [10][13]. SPMS, bu açığı kapatmayı hedefleyen, açık geliştirilebilir bir alternatif olarak konumlandırılmıştır. Sistem; backend katmanında **Python 3.12+ / FastAPI / SQLAlchemy (Async) / PostgreSQL**, frontend katmanında ise **Next.js 14 (App Router) / React 19 / TypeScript / TailwindCSS** teknolojileri ile geliştirilmiştir. Mimari **Clean Architecture (Hexagonal / Ports & Adapters)** prensiplerine uygun olarak Domain, Application, Infrastructure ve Presentation katmanlarına ayrılmıştır. Tüm bağımlılıklar SOLID prensiplerine — özellikle **Dependency Inversion** — uygun şekilde, FastAPI'nin yerleşik `Depends()` mekanizması üzerinden enjekte edilmektedir.

Sistemin teslim ettiği ana modüller; Kullanıcı ve Yetkilendirme (JWT + RBAC), Proje ve Görev Yönetimi (alt görevler, bağımlılıklar, tekrarlayan görevler), Bildirim ve Mesajlaşma (uygulama içi + e-posta), Raporlama ve Analitik (Burndown, Gantt, Kanban, CFD, Lead/Cycle Time, İterasyon Karşılaştırma) ve Süreç Modeli Seçimi olmak üzere beş ana modülden oluşmaktadır. Bunlara ek olarak, projenin ikinci geliştirme döneminde getirilen **Yaşam Döngüsü (Lifecycle)** modülü, **Workflow Editor**, **Phase Gate (Faz Geçiş Kapısı)**, **Milestone / Artifact / Phase Report** yönetimi ve görsel **görev durumu geçiş diyagramları** sistemin profesyonel düzeyde proje yönetim ihtiyaçlarına yanıt vermesini sağlamıştır. Ayrıca yapay zekâ tabanlı **"AI öner"** özelliğinin altyapısı tasarlanmış, ilgili kullanıcı arayüzü pasif konumda yerleştirilmiş ve gelecek sürümlerde aktive edilmek üzere yol haritasına alınmıştır.

Geliştirme sürecinde toplam ~52.600 satır kod yazılmış (yaklaşık 12.200 satır Python ve 40.400 satır TypeScript), 353 frontend birim/entegrasyon testi ile 108 backend test dosyası üretilmiş ve mimari kararlar PMBOK [14] kapsamlı bilgi alanlarıyla uyumlu olarak alınmıştır. Çalışmanın çıktısı yalnızca işlevsel bir yazılım değil; aynı zamanda akademik düzeyde belgelenmiş, izlenebilir gereksinimlere sahip, etik–güvenlik–sürdürülebilirlik boyutlarıyla değerlendirilmiş bir mühendislik artefaktıdır.

**Anahtar kelimeler:** Yazılım Proje Yönetimi, Scrum, Kanban, Waterfall, Clean Architecture, SOLID, FastAPI, Next.js, Phase Gate, RBAC, Strategy Pattern.

---

## ABSTRACT

This work presents the design and implementation of **SPMS (Software Project Management System)**, a web-based, methodology-agnostic project management platform that enables software development teams to plan, track, and report their projects within a single unified environment. Unlike the prevailing tools that specialize in a single paradigm — Jira for agile, Microsoft Project for waterfall, Trello for lightweight Kanban — SPMS supports Scrum, Kanban, Waterfall, and Iterative/Incremental process models on a single code base by means of the **Strategy Pattern**. The user selects the methodology at project creation, after which process-specific rules (sprint requirement, WIP limits, sequential task dependencies, phase gates) are automatically enforced.

The high licensing costs of commercial alternatives and the absence of an integrated methodology-pluralistic open option create a clear gap, particularly for small and medium-sized teams [10][13]. SPMS positions itself as an open, extensible alternative in this space. The back end is built on **Python 3.12+ / FastAPI / SQLAlchemy (Async) / PostgreSQL**, whereas the front end uses **Next.js 14 (App Router) / React 19 / TypeScript / TailwindCSS**. The architecture follows **Clean Architecture (Hexagonal / Ports & Adapters)** with strict separation between Domain, Application, Infrastructure and Presentation layers. All inward dependencies obey the SOLID principles — particularly **Dependency Inversion** — wired through FastAPI's native `Depends()` mechanism.

Core modules delivered are: Authentication and Authorization (JWT + RBAC), Project and Task Management (sub-tasks, dependencies, recurring tasks), Notification and Messaging (in-app + e-mail), Reporting and Analytics (Burndown, Gantt, Kanban, Cumulative Flow Diagram, Lead/Cycle Time, Iteration Comparison) and Process Model Selection. The second development cycle additionally introduced the **Lifecycle module**, the **visual Workflow Editor**, the **Phase Gate transition engine**, the **Milestone / Artifact / Phase Report** entities and the **task status transition diagrams**, raising the system to a professional level. An **"AI suggest"** feature for AI-assisted workflow proposal has been wired into the user interface as a forthcoming capability and is documented in the future roadmap.

Throughout the project ~52,600 lines of code were produced (≈12,200 Python, ≈40,400 TypeScript), 353 frontend unit/integration tests and 108 backend test files were authored, and all architectural decisions were aligned with the PMBOK [14] knowledge areas. The deliverable is not only a working application but an academically documented engineering artefact whose ethical, security, and sustainability dimensions have been systematically evaluated.

**Keywords:** Software Project Management, Scrum, Kanban, Waterfall, Clean Architecture, SOLID, FastAPI, Next.js, Phase Gate, RBAC, Strategy Pattern.

---

# 1. GİRİŞ

## 1.1. Projenin Amacı ve Kapsamı

Günümüzde yazılım projelerinin başarısı, yalnızca teknik yetkinlikle değil; aynı zamanda planlama, izleme, iletişim ve risk kontrolünün ne ölçüde disiplinli yürütüldüğüne bağlıdır [1][13]. Standish Group ve benzeri kuruluşların yıllar içindeki raporlarında, yazılım projelerinin önemli bir kısmının zaman/bütçe aşımı yaşadığı ya da tamamen iptal edildiği görülmektedir. Bu durumun temel sebeplerinden biri, ekiplerin ihtiyaçlarına uygun proje yönetim aracını seçememesi ya da seçtikleri aracın metodolojik açıdan tek bir yaklaşımla sınırlı kalmasıdır [10][13].

Bu bitirme projesi kapsamında geliştirilen **Yazılım Projesi Yönetim Yazılımı (SPMS)**, yazılım geliştirme ekiplerinin proje süreçlerini uçtan uca yönetebilmeleri, görev dağılımlarını organize edebilmeleri ve risklerini minimize edebilmeleri amacıyla tasarlanmış web tabanlı bir platformdur. Sistemin temel özgün yanı; Scrum, Kanban, Waterfall ve İteratif/Artırımlı yaklaşımları **tek bir kod tabanında**, **Strategy Pattern** ile destekleyebilmesidir. Böylece kullanıcı; projeyi başlatırken metodolojiyi seçmekte, sistem ise sürece özgü kuralları (Sprint zorunluluğu, WIP limitleri, görev bağımlılıkları, faz geçişleri) otomatik biçimde uygulamaktadır.

## 1.2. Problem Tanımı ve Motivasyon

Literatür taramamız sırasında [10][13][7] açıkça gözlemlediğimiz problem, ekiplerin **"tek bir en iyi araç" bulamamasıdır.** Mevcut araçlar üç kategoride dengesizdir:

- **Profesyonel ama pahalı:** Jira [5], Microsoft Project [11] — geniş özellik seti, ancak kullanıcı başına aylık lisans maliyetleri ile küçük/orta ölçekli ekiplerin erişimini kısıtlar [7].
- **Erişilebilir ama dar kapsamlı:** Trello [17], Basecamp — düşük öğrenme eğrisi, ancak görev bağımlılıkları, gelişmiş raporlama ve metodoloji çeşitliliği gibi ileri ihtiyaçları karşılayamaz [10].
- **Açık kaynak ama kullanım zorluğu yüksek:** OpenProject [12] — lisans maliyeti yok, ancak hem kurulum hem de arayüz açısından ticari muadillerinin gerisindedir.

Bu üç eksenli kısıtlamanın **kesişiminde** ne ticari ne de açık kaynak alternatifler tatmin edici cevap sunmaktadır. Özellikle bir ekibin Scrum, başka bir ekibin Kanban, üçüncüsünün Waterfall ile çalışmak istemesi durumunda farklı araçların paralel kullanılması ekonomik ve operasyonel sürtünme yaratmaktadır [10]. SPMS'nin temel motivasyonu, bu sürtünmeyi tek bir entegre platform üzerinde ortadan kaldırmaktır.

## 1.3. Projenin Önemi ve Beklenen Katkıları

Bu çalışmanın hem **akademik** hem de **endüstriyel** katkı potansiyeli bulunmaktadır:

- **Akademik düzeyde:** Clean Architecture, SOLID, Strategy Pattern ve Dependency Inversion gibi yazılım mühendisliği prensiplerinin gerçek ölçekte uygulanmış bir örneğini sunar. ~52.600 satırlık üretilen kod tabanı, lisans öğrencilerinin bu prensipleri somut bir sistem üzerinde gözlemleyebileceği bir referans niteliğindedir.
- **Endüstriyel düzeyde:** KOBİ ölçekli yazılım ekipleri için, lisans maliyeti olmayan, metodoloji çeşitliliğini destekleyen ve genişletilebilir bir alternatif sunulmuştur. Açık kaynak yaklaşımı OpenProject [12] gibi mevcut çözümlerin felsefesiyle uyumludur ancak modern teknoloji yığını ve gelişmiş kullanıcı deneyimi ile farklılaşmaktadır.
- **Metodolojik düzeyde:** Tek bir aracın birden fazla süreç modelini desteklemesi durumunun sistem mimarisine etkisi (Strategy Pattern + Workflow Editor), bu projenin literatürdeki "tek araç ile çok metodoloji" tartışmasına [10] uygulamalı bir cevabıdır.

## 1.4. Raporun Organizasyonu

Bu rapor dokuz ana bölümden oluşmaktadır. **Bölüm 2**, proje yönetim disiplini, mevcut yazılımlar ve gelecek yönelimleri kapsayan literatür araştırmasını içerir. **Bölüm 3**, paydaş analizinden gereksinim izlenebilirlik matrisine kadar uzanan gereksinim mühendisliği çalışmalarını sunar. **Bölüm 4**, sistemin mimari ve tasarım kararlarını; özellikle Clean Architecture katmanları, ER diyagramı, süreç modeli Strategy Pattern uygulaması ve görev durumu state machine'i ile birlikte sunmaktadır. **Bölüm 5**, geliştirme süreci, modül implementasyonları ve yeni eklenen Yaşam Döngüsü modülünü detaylandırır. **Bölüm 6**, test stratejisini ve sonuçlarını sunarken **Bölüm 7**, proje yönetim sürecini değerlendirir. **Bölüm 8**, bölümün zorunlu kıldığı **"Gerçekçi Kısıtlar"** başlığı altında projenin tasarım boyutunu, kullanılan dersleri, modern araçları, sertifikaları, standartları ve sekiz ana kısıtı (ekonomi, çevre, sürdürülebilirlik, üretilebilirlik, etik, sağlık, güvenlik, sosyal/toplumsal sorunlar) ele alır. **Bölüm 9**, sonuç ve değerlendirmeleri, **Bölüm 10** ise kaynakları içerir.

---

# 2. LİTERATÜR ARAŞTIRMASI

## 2.1. Proje Yönetimi Disiplini ve Temel Kavramlar (PMBOK)

Proje yönetimi, geçici ve özgün bir hedefi başarmak amacıyla gerekli faaliyetlerin planlanması, organize edilmesi ve kontrol edilmesi sürecidir [14]. Klasik literatürde "üçlü kısıt" olarak bilinen **zaman, maliyet ve kapsam** unsurları, proje başarısını belirleyen temel değişkenlerdir [15]. Bu üçgenin elemanlarından birinde yapılan değişiklik diğerlerini etkilemekte; örneğin kapsam genişlediğinde zaman ve maliyet de artmaktadır [15].

Proje Yönetim Enstitüsü'nün (PMI) yayımladığı **PMBOK Kılavuzu** [14], proje yönetimini birbiriyle ilişkili bilgi alanlarına ayırır. Bu çalışmanın ışığı altında SPMS'nin mimari kararları aşağıdaki PMBOK bilgi alanlarıyla doğrudan eşleşmektedir:

- **Kapsam Yönetimi:** Projede yapılacak ve yapılmayacak işlerin net olarak tanımlanması. SPMS'de bu, gereksinim izlenebilirlik matrisi ve "Out of Scope" listesi ile yansıtılmıştır.
- **Zaman Yönetimi:** Görev sürelerinin tahmini, takvim oluşturma ve izleme faaliyetleri. SPMS'de Gantt görünümü, Sprint takvimi ve takvim modülü bu alana karşılık gelir.
- **Maliyet Yönetimi:** Bütçe takibi. SPMS v1/v2 kapsamında doğrudan bütçe takibi modülü yer almamakta; bu özellik gelecek sürüm yol haritasında bulunmaktadır.
- **Kalite Yönetimi:** Proje çıktılarının istenen standartları karşılaması. SPMS'de bu, faz tamamlanma kriterleri, Phase Gate kontrolü ve test stratejisi ile yansıtılır.
- **Kaynak Yönetimi:** Ekip üyelerinin görevlere atanması ve iş yükü dengesi. SPMS'de görev atama, ekip yönetimi ve "Görevlerim" sayfası ile karşılanır.
- **Risk Yönetimi:** Belirsizliklerin sistematik olarak ele alınması. SPMS'de bu, doğrudan bir "risk kaydı" modülü yerine bildirim ve aktivite izleme yoluyla dolaylı olarak desteklenmiştir.

PMBOK çerçevesi, SPMS'nin işlev kümesini akademik bir referans iskeletine bağlamamızı sağlamış; sistemin yalnızca yazılım mühendisliği prensiplerine değil, **proje yönetimi disiplininin yerleşik kavramsal çerçevesine** de uyumlu kalmasını mümkün kılmıştır.

## 2.2. Yazılım Geliştirme Metodolojileri (Scrum, Kanban, Waterfall, İteratif)

Yazılım geliştirme metodolojileri, ekibin işi planlama, paylaşma ve teslim etme biçimini şekillendiren çerçevelerdir. Literatürde [10][13] sıklıkla üç ana paradigmadan söz edilir:

- **Geleneksel (Şelale / Waterfall):** Faz tabanlı, doğrusal ilerleyen yaklaşım. Bir faz tamamen bitmeden bir sonrakine geçilmez. Microsoft Project [11] gibi araçlar bu paradigmaya özellikle uygundur. Kapsamı baştan iyi tanımlanmış, gereksinimleri değişme olasılığı düşük projelerde tercih edilir.
- **Çevik (Agile) — Scrum:** Zaman sınırlı **Sprint'ler** üzerine kurulu, iteratif ve artırımlı. Backlog, Sprint Planning, Daily Stand-up, Sprint Review ve Retrospective ritüellerini barındırır. Jira [5] gibi araçlar Scrum'ı doğal biçimde destekler.
- **Çevik — Kanban:** Sprint kavramı olmayan, sürekli akış (continuous flow) yaklaşımı. Tahta üzerinde sütunlar arası taşıma ve **WIP limitleri** ile çalışır. Trello [17] bu paradigmanın en bilinen temsilcisidir.

Bu üç paradigmaya ek olarak **İteratif/Artırımlı** yaklaşımlar (Spiral, V-Model, RAD, Evolutionary, Incremental) farklı melez stratejiler sunar. Asana [4] ve OpenProject [12] gibi araçlar hibrit/esnek kullanım modelleri ile birden fazla paradigmayı destekleme iddiasındadır. Ancak literatür [10] açıkça vurgular: **tek bir aracın tüm ihtiyaçları karşılaması zordur** ve ekipler genellikle birden çok aracı paralel kullanmak zorunda kalmaktadır.

SPMS'nin tasarım kararı, tam bu noktada kendini gösterir: Bu çalışmada metodoloji çeşitliliği bir **mimari sorun** olarak ele alınmış; if/else bloklarıyla değil, **OCP** (Open/Closed Principle) ilkesine uygun **Strategy Pattern** ile çözülmüştür. Yeni bir metodoloji eklenmesi mevcut kodu değiştirmeyi değil, yeni bir Strategy sınıfı eklemeyi gerektirir.

## 2.3. Mevcut Proje Yönetim Yazılımları

### 2.3.1. Jira / Trello / Asana / OpenProject / Microsoft Project

Literatür ve resmî dokümantasyonlardan derlenen veriler ışığında, en yaygın olarak kullanılan proje yönetim yazılımlarının güçlü ve zayıf yanları aşağıda özetlenmiştir.

**Microsoft Project [11]** — Klasik şelale projelerinin endüstri standardıdır. Gantt şemaları, kritik yol (CPM) analizi ve kaynak kapasite planlama konularında güçlüdür. Ancak öğrenme eğrisi diktir; küçük ekipler için maliyetli ve karmaşıktır [10].

**Atlassian Jira [5]** — Çevik yazılım ekipleri için en güçlü desteği sunar. Sprint planlaması, backlog yönetimi, kullanıcı hikâyeleri ve görev panoları bu aracı özellikle Scrum/Kanban projelerinde popüler kılmıştır. Buna karşılık terminolojisi ve arayüzü yazılım odaklı olduğundan, yazılım dışındaki ekipler için kullanıma alıştırma süreci uzun olabilmektedir [10].

**Trello [17]** — Kanban prensibiyle çalışan, son derece basit ve görsel bir arayüz sunar. Küçük ekipler ve kişisel görev takipleri için ideal olsa da görev bağımlılıkları, gelişmiş raporlama ve kaynak yönetimi açısından sınırlıdır [10].

**Asana [4]** — Modern arayüzü ve esnek kullanım seçenekleri ile öne çıkar. Liste, tablo, pano ve zaman çizelgesi görünümlerini birlikte sunması güçlü yanıdır. Ücretsiz sürümünde gelişmiş özellikler kısıtlıdır ve büyük organizasyonlar için maliyetli olabilir [10].

**OpenProject [12]** — Açık kaynak bir alternatiftir. Gantt, iş paketleri, sürüm/yol haritası yönetimi ve doküman deposu sunar. Lisans maliyeti yoktur; ancak kullanıcı arayüzü ticari muadilleri kadar modern olmayabilir ve kendi sunucuya kurulması teknik bakım gerektirir.

### 2.3.2. Karşılaştırmalı Analiz

**Tablo 2.1.** Yaygın proje yönetim yazılımlarının işlevsel karşılaştırması (kaynak: [10][7], literatür taramamızdan).

| Özellik | Microsoft Project | Jira | Asana | Trello | OpenProject | **SPMS** |
|---------|-------------------|------|-------|--------|-------------|----------|
| Temel Metodoloji | Geleneksel (Şelale) | Çevik (Scrum/Kanban) | Hibrit/Çevik | Çevik (Kanban) | Hibrit/Geleneksel | **Çoklu (S/K/W/I)** |
| Gantt Şeması | Çok Güçlü | Eklentilerle | Güçlü | Eklentilerle | Güçlü | **Güçlü** |
| Kanban Panosu | Zayıf | Çok Güçlü | Çok Güçlü | Çok Güçlü | Var | **Çok Güçlü** |
| Kritik Yol (CPM) | Güçlü | Var | Zayıf/Yok | Yok | Güçlü | **Görev Bağımlılığı** |
| Sprint Yönetimi | Yok | Çok Güçlü | Orta | Yok | Eklenti | **Çok Güçlü** |
| WIP Limit | Yok | Var | Zayıf | Eklenti | Var | **Var (zorunlu)** |
| Phase Gate (Faz Geçiş Kapısı) | Manuel | Manuel | Manuel | Yok | Manuel | **Var (otomatik kriter)** |
| Workflow Editor (görsel) | Var | Var (sınırlı) | Yok | Yok | Var | **Tam görsel + 9 preset** |
| Açık Kaynak | Hayır | Hayır | Hayır | Hayır | Evet | **Evet** |
| Lisans Maliyeti | Yüksek | Yüksek | Orta-Yüksek | Düşük | Yok | **Yok** |
| KVKK/GDPR Uyumu | Sertifikalı | Sertifikalı | Sertifikalı | Sertifikalı | Self-host bağlı | **Tasarım gereği** |

Capterra'nın geniş katılımlı kullanıcı anketine göre, kullanıcıların en çok ihtiyaç duyduğu işlevler raporlama/gösterge panoları (%65), doküman yönetimi (%64), iş birliği (%60), gereksinim yönetimi (%57), bütçeleme (%55), kaynak planlama (%54) ve zaman takibi (%53) olarak sıralanmıştır [6]. Bu dağılım, SPMS'nin işlevsel önceliklerini belirlerken yol gösterici olmuştur.

**[ŞEKİL 2.1: Yazılım Yönetim Araçlarında En Çok Kullanılan İşlevler — Capterra anket verisi (%) (Kaynak: [6])]**

## 2.4. Literatürdeki Boşluklar ve Projenin Konumu

Literatürün ortak bulgusu açıktır: **"Tüm projeler için geçerli tek bir 'en iyi araç' yoktur"** [10][13]. Doğru araç seçimi; proje türüne, ekibin çalışma kültürüne, organizasyonun olgunluk düzeyine ve ölçeklenebilirlik gereksinimine bağlıdır. Pasarič ve Pušnik'in çalışmasında iletişimin en önemli proje başarı faktörü olduğu sonucuna varılmıştır [13]; Miah ve arkadaşları ise tek aracın yetmediği, ekiplerin sıklıkla birden çok aracı birlikte kullanmak zorunda kaldığı sonucuna varmıştır [10].

Bu çıkarımlar ışığında SPMS, **araç seçimini gereksiz kılan bir birleşik platform** olarak konumlandırılmıştır:

1. **Çoklu metodoloji desteği:** Aynı kod tabanında Scrum/Kanban/Waterfall/İteratif çalışma — Strategy Pattern ile.
2. **Görsel yaşam döngüsü düzenleyici:** Kullanıcı, projesine özgü süreç akışını sürükle-bırak yöntemiyle tasarlayabilir.
3. **Faz geçiş kapısı (Phase Gate):** Otomatik kriter değerlendirmesi ile kalite kapısı.
4. **Açık kaynak felsefe:** Lisans maliyeti olmadan KOBİ ölçekli ekiplere ulaşım.

Gelecek yönelimler açısından literatür [3][16][8][9] dört ana eğilime işaret etmektedir: **yapay zekâ tabanlı otomasyon, hibrit/uzaktan çalışma için iş birliği özellikleri, veri analitiği ve güvenlik.** Gartner'a göre 2030 yılına kadar proje yönetimi görevlerinin %80'i yapay zekâ tarafından yürütülecektir [3]. SPMS bu eğilimi öngörerek, workflow editör arayüzüne **"AI öner"** butonunu yerleştirmiş ve gelecek sürümlerde aktif edilmek üzere ileri yol haritasına almıştır (Bölüm 5.8'de detaylandırılmıştır).

---

# 3. GEREKSİNİM ANALİZİ

## 3.1. Paydaş Analizi ve Kullanıcı Profilleri

SPMS, üç temel kullanıcı rolüne hizmet veren bir platformdur. Roller, **Role-Based Access Control (RBAC)** mimarisi ile sistemde tanımlanmış; her rolün izin matrisi `permissions` ve `role_permissions` ilişkisel tablolarında saklanmaktadır.

**Tablo 3.2.** Kullanıcı rolleri ve yetki kapsamı.

| Rol | Yetki Kapsamı | Sistem Rolü mü? |
|-----|---------------|------------------|
| **Admin** | Tüm sistem ayarları, kullanıcı yönetimi, RBAC matris yönetimi, audit log erişimi, sistem yapılandırması | Evet |
| **Proje Yöneticisi (PM)** | Proje oluşturma, faz geçişleri, milestone/artifact yönetimi, ekip atama, raporlar | Evet |
| **Ekip Üyesi (Member)** | Atanan görevlerini güncelleme, yorum yazma, kendi profilini düzenleme | Evet |
| **Misafir (Guest)** | Salt okunur erişim (yapılandırılabilir) | Evet (Phase 15 ile aktive) |

Bu rol kümesi, lisans dönemi başında uygulanan paydaş anketleri ve literatürdeki KOBİ ölçekli yazılım ekipleri profiliyle [10][13] uyumlu olarak şekillendirilmiştir.

## 3.2. Kullanım Senaryoları

Sistem aşağıdaki ana kullanım senaryolarını desteklemektedir:

1. **Proje yöneticisi yeni bir proje açar.** Sihirbaz dört adımda ilerler: Temel Bilgiler → Metodoloji Seçimi → Yaşam Döngüsü → Yapılandırma. Metodoloji seçimi sırasında sistem ilgili **9 preset şablonundan birini** otomatik olarak önerir.
2. **Ekip üyesi atanan görevleri günceller.** Tahta görünümünde (Kanban) görevini "Yapılacak" sütunundan "Yapılıyor" sütununa sürükler; WIP limiti aşılırsa AlertBanner ile uyarı alır ve taşıma engellenir.
3. **Proje yöneticisi faz geçişi yapar.** Lifecycle sekmesinde "Sonraki Faza Geç" butonuna tıklar; sistem mevcut fazın **otomatik kriterlerini** (tüm görevler tamamlandı mı, açık blocker var mı, kritik görev kaldı mı) ve **manuel kriterleri** değerlendirir. Kriterler karşılandıysa geçiş gerçekleşir; aksi takdirde gerekçe ile birlikte engellenir.
4. **Yönetici dönemsel raporları indirir.** Reports sayfasından Burndown, CFD, Lead/Cycle Time veya İterasyon Karşılaştırma raporlarını PDF/Excel formatında dışa aktarır.

## 3.3. Fonksiyonel Gereksinimler

Sistem fonksiyonel gereksinimleri beş ana modül altında gruplandırılmıştır. Detaylı liste SRS dokümanında verilmiştir; burada özet sunulmaktadır.

**Tablo 3.1.** SPMS modülleri ve sorumluluk alanları.

| Modül Kodu | Modül Adı | Temel Sorumluluk |
|------------|-----------|-------------------|
| **SPMS-MOD-AUTH** | Kullanıcı ve Yetkilendirme | Kayıt, giriş, JWT, RBAC izin matrisi, parola sıfırlama, hesap kilitleme |
| **SPMS-MOD-TASK** | Proje ve Görev Yönetimi | Proje CRUD, görev CRUD, alt görevler, bağımlılıklar, tekrarlayan görevler, etiketler, sprintler |
| **SPMS-MOD-NOTIF** | Bildirim ve Mesajlaşma | Uygulama içi bildirim, e-posta gönderimi, kullanıcı tercihleri, izleyiciler (watchers) |
| **SPMS-MOD-REPORT** | Raporlama ve Analitik | Burndown, CFD, Lead/Cycle, İterasyon Karşılaştırma, Gantt, PDF/Excel export |
| **SPMS-MOD-PROCESS** | Süreç Modeli Yönetimi | Metodoloji seçimi, Strategy Pattern, Workflow Editor, Phase Gate, Milestone/Artifact/PhaseReport |

## 3.4. Fonksiyonel Olmayan Gereksinimler

- **Performans:** API yanıt süresi p95 ≤ 500 ms (yerel ortam, normal yük altında).
- **Güvenlik:** OWASP Top 10 başta olmak üzere tüm girdiler doğrulanır; SQL injection ORM ile, XSS ise `isomorphic-dompurify` ile engellenir.
- **Erişilebilirlik:** WCAG 2.1 AA düzeyini hedefler; klavye navigasyonu, ARIA etiketleri, oklch tabanlı kontrast oranları.
- **Kullanılabilirlik:** Sistem öğrenilebilirliği 30 dakika; primitive komponent kütüphanesi (`Frontend2/components/primitives/`) tutarlı bir UX altyapısı sağlar.
- **Sürdürülebilirlik:** Clean Architecture + SOLID; yeni modül eklemek mevcut modüllerden bağımsızdır.
- **Çok dillilik:** Türkçe ve İngilizce destek; `useApp().language` üzerinden `T()` çevirici fonksiyonu.
- **Veri koruması:** KVKK/GDPR uyumlu yaklaşım — kullanıcı verisi yalnızca işlevsel ihtiyaç kadar tutulur; soft-delete ile veri kurtarma; audit log ile izlenebilirlik.

## 3.5. Sistem Kısıtları ve Varsayımlar

- **Stack kısıtı:** Python/FastAPI + TypeScript/Next.js + PostgreSQL + Docker — sabit.
- **Mimari kısıt:** Tüm backend kodu Clean Architecture katmanlarına uygundur. Domain ve Application katmanları SQLAlchemy gibi altyapı kütüphanelerini içe aktaramaz.
- **Ekip kısıtı:** 2 geliştirici (Ayşe Öz, Yusuf Emre Bayrakcı), 1 akademik danışman.
- **Süre kısıtı:** İki dönem (BM495 Güz, BM496 Bahar).

## 3.6. Gereksinim İzlenebilirlik Matrisi (Özet)

**Tablo 3.3.** Gereksinim izlenebilirlik matrisi (özet — tam matris SRS Ek-A'da).

| Gereksinim ID | Açıklama | Modül | Test Referansı |
|---------------|----------|-------|----------------|
| SPMS-01.1 | Kullanıcı kayıt, giriş, çıkış (JWT) | AUTH | `test_login_user.py`, `test_register_user.py` |
| SPMS-01.2 | Rol bazlı erişim (Admin/PM/Member) | AUTH | `test_2tier_perm_check.py` |
| SPMS-02.1 | Proje CRUD + arşivleme | TASK | `test_projects.py` |
| SPMS-02.3 | Görev CRUD | TASK | `test_seeder.py`, `test_workflow_edge_defaults.py` |
| SPMS-02.4 | Alt görevler, öncelik | TASK | `test_project_entity.py` |
| LIFE-01 | Faz tamamlanma kriterleri | PROCESS | `test_phase_gate_use_case.py` |
| LIFE-02 | Phase Gate inline expand | PROCESS | `test_execute_phase_transition.py` |
| REPT-01 | CFD diyagramı | REPORT | `test_charts.py` |
| EDIT-03 | Sequential-flexible akış modu | PROCESS | `test_workflow_validation.py` |
| RBAC-01..08 | Permission domain layer + UI | AUTH | `test_admin_join_requests.py` |

---

# 4. SİSTEM MİMARİSİ VE TASARIM

## 4.1. Mimari Yaklaşım: Clean Architecture

SPMS backend katmanı, Robert C. Martin'in tanımladığı **Clean Architecture** (Hexagonal / Ports & Adapters) ilkelerine göre tasarlanmıştır. Mimarinin temel kuralı, **bağımlılıkların yalnızca içe doğru gösterimi**dir. Bu sayede iş kuralları (Domain) ve uygulama mantığı (Application) altyapı seçimlerinden (veritabanı, web çatısı, e-posta servisi) tamamen yalıtılmış olur.

**[ŞEKİL 4.1: SPMS Clean Architecture Katman Diyagramı — Domain → Application → Infrastructure / Presentation sıralı çember]**

```
        ┌────────────────────────────────────────────┐
        │  PRESENTATION (API)                        │
        │  FastAPI routers, dependencies.py          │
        │  ┌──────────────────────────────────────┐  │
        │  │  INFRASTRUCTURE                       │  │
        │  │  SQLAlchemy repos, JWT, SMTP, Redis   │  │
        │  │  ┌────────────────────────────────┐   │  │
        │  │  │  APPLICATION                    │   │  │
        │  │  │  Use Cases, DTOs, Ports         │   │  │
        │  │  │  ┌──────────────────────────┐   │   │  │
        │  │  │  │  DOMAIN                   │   │   │  │
        │  │  │  │  Entities, ABC repos,     │   │   │  │
        │  │  │  │  ProcessStrategy, Excs.   │   │   │  │
        │  │  │  └──────────────────────────┘   │   │  │
        │  │  └────────────────────────────────┘   │  │
        │  └──────────────────────────────────────┘  │
        └────────────────────────────────────────────┘
                  ↑ bağımlılık yönü (içe)
```

## 4.2. Katmanlı Yapı

**Tablo 4.1.** Clean Architecture katman bağımlılık kuralları.

| Katman | Konum | Bağımlılık | İçerik |
|--------|-------|------------|--------|
| **Domain** | `Backend/app/domain/` | Hiçbiri (pure Python) | Pydantic Entity'leri, ABC repository arayüzleri, domain exception'lar, ProcessStrategy |
| **Application** | `Backend/app/application/` | Yalnızca Domain | Use Case sınıfları, DTO'lar, Port arayüzleri |
| **Infrastructure** | `Backend/app/infrastructure/` | Application + Domain | SQLAlchemy modelleri, async repo implementasyonları, JWT/bcrypt adapter, SMTP, config |
| **Presentation (API)** | `Backend/app/api/` | Application + Infrastructure (yalnızca DI için) | FastAPI router'ları, `dependencies.py` (DI container), `main.py` |

Bu kuralı doğrulayan kritik bir gözlem: `Backend/app/application/` ve `Backend/app/domain/` dizinlerinin tamamında **`import sqlalchemy`** ya da `import app.infrastructure` ifadesi bulunmamaktadır. Bu, **Dependency Inversion Principle**'ın disiplinli uygulanmasının somut göstergesidir.

## 4.3. SOLID Prensipleri ve Tasarım Desenleri

### 4.3.1. Strategy Pattern — Süreç Modeli

SPMS'nin teknik kalbi, süreç modeli farklılıklarının **Strategy Pattern** ile çözülmesidir. `if project.methodology == 'SCRUM' ...` türü dallanmalar yerine, her metodoloji için bir Strategy sınıfı tanımlanır.

**[ŞEKİL 4.3: Strategy Pattern ile Süreç Modeli Tasarımı]**

```
         ProcessStrategy (ABC)
                  ▲
                  │
    ┌─────────────┼─────────────┬─────────────┐
    │             │             │             │
ScrumStrategy KanbanStrategy WaterfallStrategy IterativeStrategy
- requires    - enforces      - enforces        - cyclic phases
  sprints       wip_limits      dependencies     + feedback edges
- backlog     - continuous    - sequential
  management    flow            -locked mode
```

Domain katmanındaki `Methodology` enum tanımı (`Backend/app/domain/entities/project.py`):

- `SCRUM` — Sprint zorunlu, backlog yönetimi
- `KANBAN` — Sprint yok, sürekli akış, WIP limit zorunlu
- `WATERFALL` — Sequential-locked workflow, görev bağımlılıkları zorunlu
- `ITERATIVE` — Cyclic faz akışı, feedback edge desteği

Yeni bir metodoloji eklemek mevcut sınıfları değiştirmeyi değil, yeni bir Strategy sınıfı eklemeyi gerektirir — bu **Open/Closed Principle**'ın açık bir uygulamasıdır.

**Tablo 4.2.** Süreç modeli stratejileri ve davranış farkları.

| Davranış | Scrum | Kanban | Waterfall | İteratif |
|----------|-------|--------|-----------|----------|
| Sprint gerekli mi? | Evet | Hayır | Hayır | Opsiyonel |
| WIP limit zorunlu mu? | Hayır | Evet | Hayır | Opsiyonel |
| Görev bağımlılığı zorunlu mu? | Hayır | Hayır | Evet | Hayır |
| Geri dönüş (feedback edge) | Retro üzerinden | Yok | Engellenir | Açık |
| Workflow modu | `flexible` | `continuous` | `sequential-locked` | `flexible` |

### 4.3.2. Repository Pattern

Veritabanı erişimi, domain katmanındaki **Abstract Base Class** arayüzler (ITaskRepository, IUserRepository, IProjectRepository vb.) üzerinden yapılır. Use case'ler bu arayüzleri enjekte alır; **hangi** veritabanına bağlandıklarını bilmezler. Concrete implementasyonlar `Backend/app/infrastructure/database/repositories/` altında SQLAlchemy ile yazılmıştır.

Bu yaklaşım sayesinde test sırasında **InMemoryRepository** kullanılarak veritabanı bağımlılığı olmadan use case'ler birim testlerle doğrulanabilmektedir.

### 4.3.3. Dependency Injection

DI, FastAPI'nin yerleşik `Depends()` mekanizması üzerinden uygulanır. `Backend/app/api/dependencies.py` ve `Backend/app/api/deps/` modülleri DI container görevi üstlenir. Örneğin bir route şu şekilde yazılır:

- API katmanı `Depends(get_task_repo)` ile concrete repository'yi enjekte eder.
- Repository, AsyncSession üzerinden veritabanına bağlanır.
- Use Case, ITaskRepository arayüzünü alır (gerçek tipini bilmez).

Bu zincir, **Dependency Inversion Principle**'ı protokol haline getirir.

## 4.4. Veri Modeli ve ER Diyagramı

SPMS veri modeli, 25'in üzerinde entity'den oluşan ilişkisel bir şemaya sahiptir. Kritik tablolar:

- **users, roles, permissions, role_permissions** — RBAC altyapısı
- **projects, project_members, teams, team_members** — proje organizasyonu
- **tasks, task_dependencies, board_columns, sprints, labels** — görev/sprint yönetimi
- **milestones, artifacts, phase_reports** — yaşam döngüsü artefaktları (Phase 12 ile eklendi)
- **logs (audit_log), notifications, notification_preferences** — gözlemlenebilirlik
- **process_templates, system_config** — özelleştirme

**[ŞEKİL 4.2: SPMS Veritabanı Varlık-İlişki (ER) Diyagramı — kritik tablolar arası ilişkiler]**

```
   users ────< project_members >──── projects
     │                                  │
     ▼                                  ▼
  audit_log                          tasks
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                    task_dependencies sprints    comments
                                                    │
                                                    ▼
                                                 attachments

  projects ──< milestones    projects ──< artifacts
  projects ──< phase_reports projects ──< logs (audit)
```

Tüm tablolar Alembic migration'ları (`Backend/alembic/versions/001..012`) ile sürümlenmektedir. v2.0 ile gelen **migration 005** Milestone/Artifact/PhaseReport entity'lerini, **migration 012** ise yeni RBAC tablolarını (`permissions`, `role_permissions`) eklemiştir.

## 4.5. Görev Durumu Geçiş Diyagramı (State Machine)

Görev (Task) varlığı, dört durumlu bir state machine'e sahiptir. `TaskStatus` enum'u Domain katmanında tanımlıdır.

**[ŞEKİL 4.4: Görev Durumu Geçiş Diyagramı (TaskStatus State Machine)]**

```
           ┌──────────┐
   ╔══════>│  TODO    │<────────────────┐
   ║       └────┬─────┘                  │
   ║            │ start                   │ reopen
   ║            ▼                         │
   ║       ┌──────────┐                   │
   ║       │ IN_PROGRESS │                │
   ║       └────┬─────┘                   │
   ║            │ submit                  │
   ║            ▼                         │
   ║       ┌──────────┐    reject         │
   ║       │  REVIEW  │──────────────────>┘
   ║       └────┬─────┘
   ║            │ approve
   ║            ▼
   ║       ┌──────────┐
   ╚═══════│   DONE   │
           └──────────┘
            (final)
```

Bu state machine'e ek olarak, **BoardColumn** entity'si projeye özgü özelleştirilmiş sütunlar tanımlanmasını sağlar (örn. "Test Aşamasında", "Müşteri Onayı Bekleniyor"). Kullanıcı görev başlığını sürükle-bırak ile sütunlar arasında taşıdığında, hem `column_id` değişir hem de `TaskStatus` ilgili sütuna göre güncellenir. Bu olay aynı zamanda `audit_log` tablosuna işlenir; böylece **Burndown** ve **CFD** grafiklerinin tarihsel verisi otomatik olarak birikir.

## 4.6. Yaşam Döngüsü (Lifecycle) ve Workflow Mimarisi

SPMS'nin yeni katkı sunduğu en kritik mimari yenilik, projenin **görsel yaşam döngüsü tanımıdır**. Her proje bir `process_config` JSON nesnesi tutar; bu nesne kanonik olarak şu yapıdadır:

- `schema_version`: 1 (geriye uyumlu migration zinciri ile)
- `workflow`: { `mode`, `nodes[]`, `edges[]`, `groups[]` } — görsel workflow tanımı
- `phase_completion_criteria`: faz başına otomatik (`all_tasks_done`, `no_critical_tasks`, `no_blockers`) ve manuel kriterler
- `enable_phase_assignment`, `enforce_sequential_dependencies`, `enforce_wip_limits` — davranış toggle'ları
- `backlog_definition`, `cycle_label` — metodoloji-dinamik UI etiketleri

Workflow dört moddan birinde çalışır:
- **flexible** — fazlar arası serbest geçiş
- **sequential-locked** — yalnızca bir sonraki faza (Waterfall)
- **sequential-flexible** — sıralı + tanımlı geri dönüşlere izin verir
- **continuous** — sürekli akış (Kanban) — faz geçişi kavramı yoktur

## 4.7. Phase Gate (Faz Geçiş Kapısı) Mimarisi

Phase Gate, bir projenin mevcut fazından bir sonraki faza geçişini kontrol eden mekanizmadır. Geçiş `POST /projects/{id}/phase-transitions` endpoint'i üzerinden tetiklenir. Süreç şu adımları içerir:

1. **Yetki kontrolü:** `lifecycle.edit` izni olan kullanıcı + proje üzerinde transition yetkisi.
2. **Rate limit:** Aynı (user, project) çifti için 10 saniyede bir geçiş denemesi.
3. **Idempotency:** `Idempotency-Key` header'ı ile 10 dakikalık önbellek.
4. **Otomatik kriter değerlendirmesi:** `all_tasks_done`, `no_critical_tasks`, `no_blockers`.
5. **Manuel kriter doğrulaması:** PM'in işaretlemesi gereken çek listesi.
6. **Concurrent transition koruması:** PostgreSQL advisory lock ile.
7. **Audit log:** Geçişin tüm meta verileri (source_phase_id, target_phase_id, cycle_number, override_used) loglanır.

**Tablo 5.4.** Phase Gate hata kodları ve HTTP yanıtları.

| Hata Kodu | HTTP | Açıklama |
|-----------|------|----------|
| `PHASE_GATE_LOCKED` | 409 | Eşzamanlı bir geçiş denemesi devam ediyor |
| `CRITERIA_UNMET` | 422 | Otomatik veya manuel kriterler karşılanmadı |
| `PHASE_GATE_NOT_APPLICABLE` | 400 | `continuous` modda Phase Gate kavramı yok |
| `INVALID_TRANSITION` | 422 | Sequential-flexible modda tanımsız geçiş |
| `ARCHIVED_NODE_REFERENCE` | 422 | Hedef faz arşivlenmiş |
| Rate limit | 429 | Çok sık deneme; `Retry-After` header'ı döner |

## 4.8. Güvenlik Mimarisi

**[ŞEKİL 4.5: JWT Kimlik Doğrulama Akış Diyagramı]**

```
   Client                  FastAPI                 PostgreSQL
     │                        │                        │
     │── POST /auth/login ───>│                        │
     │   {email, password}    │                        │
     │                        │── SELECT user ────────>│
     │                        │<── user row ───────────│
     │                        │── bcrypt verify ──┐    │
     │                        │<─────────────────┘     │
     │                        │── JWT sign (HS256)     │
     │<── access_token ───────│                        │
     │                        │                        │
     │── GET /tasks ────────>│                         │
     │   Authorization:       │                        │
     │   Bearer <token>       │                        │
     │                        │── verify JWT ──┐       │
     │                        │<──────────────┘        │
     │                        │── extract user, role   │
     │                        │── RBAC check ──┐       │
     │                        │<──────────────┘        │
     │                        │── SELECT tasks ───────>│
     │                        │<── rows ───────────────│
     │<── 200 OK + tasks ─────│                        │
```

Güvenlik katmanı şu bileşenlerden oluşur:

- **Şifre saklama:** `passlib[bcrypt]` ile bcrypt hashing (cost 12).
- **JWT:** `python-jose` ile HS256 imzalama, 30 dk default expiry.
- **CORS:** Yalnızca tanımlı origin'lerden istek kabul edilir.
- **Rate limiting:** `slowapi` ile uç noktalara bazlı hız sınırlaması.
- **SQL injection koruması:** SQLAlchemy ORM parametrik sorgu.
- **XSS koruması:** Frontend tarafında `isomorphic-dompurify`.
- **Account lockout:** Tekrarlanan başarısız girişlerde geçici kilitleme.
- **Audit log:** Her kritik işlem `logs` tablosuna yapısal JSON formatında yazılır.

---

# 5. UYGULAMA (İMPLEMENTASYON)

## 5.1. Geliştirme Ortamı ve Araç Zinciri

Geliştirme süreci boyunca aşağıdaki araçlar kullanılmıştır:

- **IDE:** Visual Studio Code (TypeScript/Python eklentileri), Cursor.
- **Sürüm kontrol:** Git, GitHub.
- **Konteyner:** Docker (PostgreSQL 15 Alpine).
- **API test:** FastAPI Swagger UI (`/docs`), Postman.
- **AI destekli geliştirme:** Claude Code, GitHub Copilot — özellikle boilerplate üretim, test yazımı ve refactoring.
- **Tasarım araçları:** Figma (prototip), Mermaid (diyagram).
- **Görev yönetimi:** SPMS'nin kendi alpha sürümü (dogfooding).

## 5.2. Backend Geliştirme

**Tablo 5.1.** Backend teknoloji yığını ve sürümleri.

| Kategori | Teknoloji | Açıklama |
|----------|-----------|----------|
| Dil | Python 3.12+ | Type hints, async/await, structural pattern matching |
| Web framework | FastAPI | Async REST API, OpenAPI/Swagger üretimi, Pydantic v2 entegrasyonu |
| ORM | SQLAlchemy 2.0 (Async) | `AsyncSession`, async engine via `asyncpg` |
| Veritabanı | PostgreSQL 15 | Docker container, port 5433 |
| Migration | Alembic | 12 migration dosyası |
| Doğrulama | Pydantic v2 + pydantic-settings | DTO ve config |
| Güvenlik | python-jose (JWT), passlib[bcrypt] | HS256 + bcrypt cost 12 |
| Rate limiting | slowapi | Endpoint başına limit |
| E-posta | fastapi-mail | SMTP entegrasyonu |
| Scheduler | apscheduler | Tekrarlayan görev tetikleyici |
| PDF | fpdf2 | Pure Python — sistem lib bağımlılığı yok |
| Excel | openpyxl | Rapor dışa aktarımı |
| Test | pytest, pytest-asyncio, httpx, aiosqlite | Async test desteği |

Backend katman ayrımı sıkı tutulmuştur. Örnek olarak: `Backend/app/application/use_cases/` dizininde 60+ use case dosyası yer almakta; her biri tek bir iş eylemini (CreateTask, ApproveJoinRequest, ExecutePhaseTransition vb.) temsil eder. Bu **Single Responsibility Principle**'ın somut uygulamasıdır.

## 5.3. Frontend Geliştirme

**Tablo 5.2.** Frontend teknoloji yığını ve sürümleri.

| Kategori | Teknoloji | Açıklama |
|----------|-----------|----------|
| Dil | TypeScript 5 | Strict mode |
| Framework | Next.js 14 (App Router) | SSR/CSR hibrit, file-based routing |
| UI kütüphanesi | React 19 | Concurrent rendering, hooks |
| Stiller | TailwindCSS 4 | Utility-first, oklch tabanlı tema |
| Server state | TanStack Query 5 | Cache, invalidation, optimistic updates |
| HTTP istemcisi | axios | Interceptor + JWT enjekte |
| İkonlar | lucide-react | Modern ikon seti |
| Grafikler | recharts | Burndown, CFD, Lead/Cycle, vb. |
| Sürükle-bırak | @dnd-kit | Tahta görünümünde görev taşıma |
| Workflow editor | @xyflow/react (React Flow) | Görsel node/edge editor |
| Tablo | @tanstack/react-table | Liste görünümleri |
| Zengin metin | @tiptap | Yorum/açıklama editörü |
| XSS koruması | isomorphic-dompurify | HTML sanitize |
| CSV dışa | papaparse | Veri dışa aktarımı |
| Test | Vitest, Testing Library, Playwright | Unit + E2E |

Frontend tarafı, projeyi v2.0'a taşımak için sıfırdan inşa edilmiştir (`Frontend2/` dizini). Eski v1.0 frontend'i (`Frontend/`) dokunulmaz olarak korunmuş; v2.0 fazları tamamlandığında değiştirilmesi planlanmıştır. Bu kararın sebebi, prototip-tasarımına %100 sadakat ile yeniden yazımın daha güvenli olmasıdır.

Frontend'de **primitive komponent kütüphanesi** (`Frontend2/components/primitives/`) tutarlı UX altyapısı sağlar: Avatar, Badge, Button, Card, ProgressBar, SegmentedControl, AlertBanner, Toggle, Input, Kbd, Tabs, StatusDot vb. komponentler tek bir token sistemi (`globals.css`'deki oklch değişkenleri) üzerinde çalışır.

## 5.4. Veritabanı Yönetimi ve Migrasyonlar

Tüm şema değişiklikleri Alembic migration dosyalarıyla sürümlenmiştir:

- `001_phase1_schema.py` — temel users, projects, tasks tabloları
- `002_phase2_schema.py` — teams, team_members
- `003_phase3_schema.py` — comments, attachments, labels
- `004_phase5_schema.py` — notifications, notification_preferences
- `005_phase9_schema.py` — **milestones, artifacts, phase_reports** (v2.0 ile eklendi)
- `006_phase14_admin_panel.py` — admin yardımcı tabloları
- `007_task_start_date.py`, `008_team_color_department.py`, `009_milestone_start_date.py`, `010_files_task_id_nullable.py`, `011_sprint_improvements.py` — küçük şema düzeltmeleri
- `012_phase15_rbac.py` — **permissions ve role_permissions tabloları** + 38 izin seed (project.*, task.*, comment.*, milestone.*, artifact.*, phase_report.*, workflow.edit, lifecycle.edit, member.*, admin.*)

Migration'lar **idempotent** olarak yazılmıştır; aynı migration'ın iki kez çalıştırılması hata vermez.

## 5.5. Modül İmplementasyonları

### 5.5.1. Kullanıcı ve Yetkilendirme (SPMS-MOD-AUTH)

Kayıt, giriş ve çıkış işlemleri JWT tabanlıdır. Parolalar bcrypt ile hash'lenir (cost factor 12). RBAC altyapısı, kullanıcı rolüne ve `role_permissions` matrisine göre çalışır. JWT payload'ında `permissions: [...]` array taşınmakta; frontend bu listeyi `useAuth().hasPermission(key)` helper'ı ile sorgulamaktadır.

Hesap kilitleme (account lockout), tekrarlanan başarısız girişlerde devreye girer. Şifre sıfırlama, e-posta tabanlı tek kullanımlık token ile yapılmaktadır.

### 5.5.2. Proje ve Görev Yönetimi (SPMS-MOD-TASK)

Proje varlığı `methodology`, `status` (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED) ve `process_config` JSON alanları taşır. Görev varlığı; alt görev (parent_task_id), bağımlılık (TaskDependency tablosu), tekrarlayan görev (recurrence_interval), faz referansı (phase_id) gibi özellikler içerir.

**Backlog Paneli:** Proje detay sayfasının sol kenarında, sürükle-bırak ile görev taşımayı destekleyen 300px'lik dikey panel. Cross-container DnD desteği sayesinde Backlog'dan Sprint'e, Sprint'ten Backlog'a taşıma mümkündür.

**Tahta (Board) Görünümü:** Kanban tarzı sürükle-bırak. WIP limiti ihlal edildiğinde sütun arka planı renk değiştirir, AlertBanner görünür ve drop engellenir.

**[ŞEKİL 5.4: Görev Tahta Görünümü (Kanban Board) — WIP Limit İhlali — placeholder]**

### 5.5.3. Bildirim ve Mesajlaşma (SPMS-MOD-NOTIF)

Üç katmanlı bildirim:
- **Uygulama içi:** Header'da bildirim çanı, kategorize edilmiş liste.
- **E-posta:** `fastapi-mail` ile SMTP üzerinden, `INotificationService` arayüzü ile soyutlanmıştır.
- **Watcher mekanizması:** Kullanıcı, izlediği görev/proje/yorum güncellemelerinde bildirim alır.

Kullanıcı bildirim tercihlerini (`notification_preferences`) e-posta türü bazında yönetebilir.

### 5.5.4. Raporlama ve Analitik (SPMS-MOD-REPORT)

Raporlar üç ana kategoride sunulmaktadır:

- **Klasik raporlar:** Burndown, Gantt, Velocity, Görev Dağılımı.
- **Phase 13 raporları:**
  - **CFD (Cumulative Flow Diagram):** Kanban projelerde Burndown yerine, SVG stacked area. 7/30/90 gün filtresi.
  - **Lead/Cycle Time:** SVG histogram; P50, P85, P95 yüzdelikleri.
  - **İterasyon Karşılaştırma:** Scrum/İteratif için grouped bar chart; planlanan/tamamlanan/taşınan.

**[ŞEKİL 5.7: Kümülatif Akış Diyagramı (CFD) ve Lead/Cycle Time görselleri — placeholder]**

PDF ve Excel dışa aktarım her rapor için aktiftir. PDF dosyaları `fpdf2` (pure Python — sistem kütüphanesi gerekmez) ile, Excel dosyaları `openpyxl` ile üretilir.

### 5.5.5. Süreç Modeli Yönetimi (SPMS-MOD-PROCESS)

Bu modül, projenin metodoloji-bağımsız çalışmasının kalbidir. Üç ana alt yetenek sunar:

1. **Metodoloji seçimi:** Proje oluşturma sihirbazının 2. adımında kullanıcı dört metodolojiden birini seçer.
2. **Strategy Pattern enjeksiyonu:** Use case'ler, projenin metodolojisine göre ilgili Strategy sınıfını alır ve davranışı buna göre ayarlar.
3. **Süreç şablonları (Process Templates):** Sık kullanılan yapılandırmaların kaydedilmesi ve başka projelere uygulanması.

## 5.6. Yaşam Döngüsü (Lifecycle) Modülü — Yeni Özellik

v2.0 ile gelen en kapsamlı yenilik **Lifecycle Tab**'tır. Proje detay sayfasının sekiz sekmesinden biri olan bu sekme aşağıdaki bölümleri barındırır:

- **SummaryStrip:** Aktif faz badge'i (1-tabanlı index), ProgressBar, açık görev sayacı, sonraki milestone chip'i, workflow mode chip'i ve "Sonraki Faza Geç" / "Düzenle" butonları.
- **PhaseGateExpand:** "Faza Geçiş Yap" butonu, mevcut fazın tamamlanma durumu, otomatik+manuel kriter kontrolleri, açık görev aksiyonları ve not alanı.
- **WorkflowCanvas (read-only):** Aktif fazın görsel olarak ışıklandırıldığı React Flow tabanlı tuval. Aynı projede bir faz birden fazla kapatılmışsa node üzerinde **döngü sayacı (xN)** badge'i görünür.
- **OverviewSubTab / MilestonesSubTab / HistorySubTab / ArtifactsSubTab / SprintsSubTab** — sekmelerin alt görünümleri.

**[ŞEKİL 5.1: Proje Yaşam Döngüsü Yönetim Ekranı (Lifecycle Tab) — placeholder]**

### 5.6.1. Milestone (Kilometre Taşı) Yönetimi

Milestone CRUD endpoint'leri (`GET/POST/PATCH/DELETE /projects/{id}/milestones`) ile proje takvimine bağlanmıştır. Milestone'lar; isim, hedef tarih, durum (planlı/devam/gecikmeli/tamamlandı), ilerleme yüzdesi ve isteğe bağlı açıklama alanlarına sahiptir. Timeline (Gantt) görünümünde dikey bayrak çizgisi olarak render edilirler.

### 5.6.2. Artifact (Çıktı) Yönetimi

Artifact'lar, metodolojiye özgü standart çıktıların izlenmesini sağlar. Proje oluşturulduğunda metodoloji-bazlı varsayılan artifact'lar otomatik olarak seed edilir (örn. Scrum için "Sprint Backlog", "Sprint Review Notes"; Waterfall için "SRS", "SDD", "Test Plan"). Her artifact'a sorumlu atanabilir, dosya eklenebilir ve durumu (Taslak/Hazır/Onaylı) takip edilebilir.

### 5.6.3. Phase Report (Faz Raporu)

Her tamamlanmış faz için yapılandırılmış bir rapor hazırlanabilir: metrikler, sorunlar, dersler ve öneriler. Rapor PDF olarak indirilebilir (`fpdf2` üzerinden). Lifecycle History sekmesinde her kapatılmış faz kartında "Rapor" butonu mevcuttur.

## 5.7. Workflow Editor (Görsel Süreç Modeli Tasarımcısı) — Yeni Özellik

**[ŞEKİL 5.2: Workflow Editor — Görsel Süreç Modeli Tasarımcısı — placeholder]**

Workflow Editor, React Flow (`@xyflow/react`) tabanlı, sürükle-bırak ile faz (node) ve geçiş (edge) tanımlamayı sağlayan görsel bir editördür. Editör aşağıdaki yetenekleri sunar:

- **Node tipleri:** Faz, Başlangıç (`isInitial`), Final (`isFinal`), Arşivlenmiş (`isArchived`).
- **Edge tipleri:** `flow` (normal akış), `verification` (doğrulama akışı), `feedback` (geri besleme). Her tip için stroke dash patterni ve renk farklıdır.
- **Edge varyantları:** `bidirectional` (sequential-flexible için tanımlı çift yönlü), `is_all_gate` (Jira tarzı kaynak-agnostik "All" gate).
- **Gruplama (Swimlane):** Birden fazla node'u kapsayan görsel grup çerçevesi. Beş giriş noktası: rectangle drag, multi-select + "Grup" butonu, sürükle-bırak ile mevcut gruba ekleme, mixed-select + "Grup", sağ-tık context menü.
- **Şablon Yükleme (Şablon Yükle):** Aşağıda Tablo 5.3'te listelenen 9 hazır preset.
- **Doğrulama:** `validateWorkflow()` fonksiyonu beş kategorik hatayı (initial/final node sayısı, izole node, döngü ihlali, geçersiz id) kontrol eder. Dirty (kaydedilmemiş) değişiklik varken kullanıcı sayfa değiştirmek isterse `DirtySaveDialog` çıkar.

**Tablo 5.3.** Yaşam Döngüsü Şablonları (9 Preset).

| # | Preset | Mode | Faz Sayısı | Özellik |
|---|--------|------|-----------|---------|
| 1 | Scrum | flexible | 5 | Başlatma → Planlama → Yürütme ⇄ İzleme → Kapanış (Retro feedback) |
| 2 | Waterfall | sequential-locked | 6 | Gereksinim → Tasarım → Uygulama → Test → Yayın → Bakım |
| 3 | Kanban | continuous | 1 | Tek sürekli akış — Phase Gate kavramı yoktur |
| 4 | Iterative | flexible | 4 | Cyclic iterasyon |
| 5 | V-Model | flexible | 7 | Verification edge'lerle iki kollu yapı |
| 6 | Spiral | flexible | 4 | Risk-temelli, feedback edge |
| 7 | Incremental | flexible | 5 | Inkremental teslim + feedback döngüsü |
| 8 | Evolutionary | flexible | 5 | Prototip evrimi |
| 9 | RAD | flexible | 5 | Rapid Application Development — paralel iş paketleri |

### 5.7.1. Aktif Faz Hesaplama (BFS Graph Traversal)

Aktif faz, hardcoded indeks yerine **BFS (Breadth-First Search)** ile hesaplanır. `computeNodeStates()` fonksiyonu her node için bir durum atar: `active`, `past`, `future`, `unreachable`. Bu sayede birden fazla faz aynı anda "aktif" olabilir (paralel akışlar). Görsel olarak aktif fazlar bir "ring" ile vurgulanır.

### 5.7.2. Döngü Sayacı (Cycle Counter)

Aynı fazın birden çok kez kapanması durumunda (örn. Sprint Review'dan sonra tekrar Yürütme'ye dönüş), node üzerinde `xN` badge'i belirir. Bu sayı ≥ 2 olduğunda görünür kalır; gerçek değerin kaynağı `useCycleCounters(projectId)` hook'unun döndürdüğü `Map<phase_id, count>` yapısıdır.

## 5.8. "AI öner" — Yapay Zekâ Tabanlı Workflow Önerisi (Gelecek Sürüm)

**[ŞEKİL 5.8: "AI öner" Butonu — Yakında Etiketli Workflow Editor — placeholder]**

Workflow Editor'ün alt araç çubuğunda, dört yapısal eylem butonunun (Düğüm / Bağlantı / Grup / Sınıflandır) yanında **"✦ AI öner"** butonu yer almaktadır. Şu anda buton `disabled` durumdadır ve yanında **"Yakında"** rozeti taşır. Tooltip metni şu şekildedir: "AI önerileri gelecek sürümde aktif olacak."

Bu özelliğin tasarım çerçevesinde planlanan davranışı şudur:

1. Kullanıcı proje türünü ve temel gereksinimlerini (ekip büyüklüğü, teslim süresi, risk profili) doğal dilde yazar.
2. Sistem, bir LLM'e (Large Language Model — büyük dil modeli) talep gönderir.
3. LLM, projeye uygun bir workflow şeması (node + edge + mode önerisi) JSON formatında döner.
4. Editör, dönen şemayı görsel olarak önizler ve kullanıcı onay verirse uygular.

Bu yaklaşım, literatürdeki yapay zekâ tabanlı proje yönetim eğilimine [3][16] doğrudan yanıt verir. Gartner'ın 2030 yılına kadar proje yönetim görevlerinin %80'inin yapay zekâ tarafından yürütüleceği öngörüsü [3], bu özelliğin stratejik konumunu güçlendirmektedir. Bununla birlikte, akademik dürüstlük gereği özelliğin **şu an itibarıyla aktif olmadığını** ve **gelecek sürüm yol haritasında** yer aldığını açıkça beyan etmekteyiz. Bu, etik kısıtlar bölümünde (Bölüm 8.5) ele alınan **yapay zekâ kullanımının şeffaflığı** ilkesi ile de uyumludur.

## 5.9. Admin Paneli ve RBAC v2

**[ŞEKİL 5.9: Admin Paneli ve İzin Matrisi (RBAC) — placeholder]**

Phase 14 ile getirilen Admin Paneli üç sekmeden oluşur: **Kullanıcılar, Roller, İzin Matrisi**. Phase 15 RBAC çalışmaları sırasında izin matrisinin gerçek backend bağlantısı tamamlanmaktadır:

- **38 izin tohumu:** project.*, task.*, comment.*, milestone.*, artifact.*, phase_report.*, workflow.edit, lifecycle.edit, member.*, admin.*
- **Sistem rolleri koruması:** PM/Member/Admin/Guest gibi sistem rolleri silinemez ve isim değişikliği engellenir.
- **Custom rol oluşturma:** Yönetici, ikon ve renk seçerek yeni rol tanımlayabilir.
- **Per-cell auto-save:** İzin matris hücresinden bir izin işaretlendiğinde 4xx hatasında otomatik geri alma.
- **Self-edit prevention:** Yönetici kendi rolünü değiştiremez.

## 5.10. Gerçek Zamanlı İletişim ve Aktivite Akışı

Sistem, gerçek zamanlı WebSocket kanalı yerine **polling tabanlı bir aktivite akışı** ile çalışmaktadır. `GET /projects/{id}/activity` endpoint'i tip, kullanıcı ve sayfalama filtresi ile çağrılabilir. Tüm kritik işlemler (görev oluşturma, durum değişikliği, yorum, faz geçişi, milestone tamamlanması vb.) ‘`audit_log` tablosuna `SemanticEventType` enum ile yazılmaktadır.

WebSocket tabanlı gerçek zamanlı bildirim, mimari olarak `INotificationService` arayüzü üzerinden soyutlanmış olup gelecek sürümlerde tetiklenebilir bir adaptör olarak eklenmek üzere yol haritasındadır.

## 5.11. Kullanıcı Arayüzü Ekranları

Bu bölümdeki şekiller, sistemin ana kullanım akışlarını görselleştirmektedir. Görsel öğeler raporun sonraki sürümlerinde son ekran görüntüleriyle değiştirilecektir.

**[ŞEKİL 5.5: Gantt ve Takvim Görünümleri — placeholder]**

**[ŞEKİL 5.6: Sprint Yönetimi ve Burndown Grafiği — placeholder]**

---

# 6. TEST VE DOĞRULAMA

## 6.1. Test Stratejisi

SPMS'nin test stratejisi üç katmanlıdır: **birim testleri**, **entegrasyon testleri** ve **uçtan uca (E2E) testleri**.

**Tablo 6.1.** Test türleri ve kapsam özeti.

| Katman | Araç | Konum | Sayı (yaklaşık) | Amaç |
|--------|------|-------|----------------|------|
| Backend birim | pytest, pytest-asyncio | `Backend/tests/unit/` | 60+ test | Domain ve use case mantığı |
| Backend entegrasyon | pytest, httpx (ASGITransport), aiosqlite | `Backend/tests/integration/` | 100+ test | Tam API uç noktası |
| Frontend birim | Vitest, Testing Library | `Frontend2/**/*.test.{ts,tsx}` | 353 dosya | Komponent davranışı, lib fonksiyonları |
| Frontend E2E | Playwright | `Frontend2/tests/e2e/` (kısmen skip-guarded) | 20+ senaryo | Kullanıcı akışları |

## 6.2. Backend Test Mimarisi

Backend testleri **rollback-per-test** stratejisi kullanır: Her test bir transaction içinde çalışır ve test sonunda geri alınır. Bu sayede tablo truncate etmeye gerek kalmadan test izolasyonu sağlanır.

Mock'lar mocking kütüphanesi yerine **domain arayüzlerini implement eden manuel mock sınıfları** ile yapılır. Bu, Liskov Substitution Principle'ın test seviyesinde doğrulanmasıdır.

Entegrasyon testlerinde ASGI transport kullanılarak FastAPI uygulaması in-memory test edilmektedir:

```
async with AsyncClient(transport=ASGITransport(app=app),
                       base_url="http://test") as client:
    response = await client.get("/api/v1/projects")
```

(Yukarıdaki örnek, raporun amacı gereği teknik detay göstergesidir; gerçek kod tabanı için lütfen `Backend/tests/integration/` dizinine bakınız.)

## 6.3. Test Sonuçları

Phase 11 tamamlandığında raporlanan değerler (kaynak: `.planning/PROJECT.md`):

- **119 Frontend2 birim test** yeşil
- **10 Backend `labels` non-DB test** yeşil
- **65 Phase 9 entegrasyon test** yeşil (Milestone, Artifact, Phase Report, Phase Gate, Workflow validation, Activity feed)

Phase 15 ile gelen 19 frontend workflow-editor testi, bilinen pre-existing teknik borç olarak işaretlenmiş ve `TIDY-04` görevi altında temizleme planlanmıştır.

## 6.4. Performans Testleri

API uç noktaları yerel ortamda manuel olarak `/docs` (Swagger UI) ve Postman ile yük altında ölçülmüştür. p95 yanıt süresi normal yük altında 500 ms'nin altında kalmaktadır. Gerçek yük testleri (locust, k6) gelecek sürüm yol haritasındadır.

## 6.5. Güvenlik Testleri

Güvenlik testleri manuel olarak yapılmıştır:

- **OWASP Top 10 checklist:** SQL injection (ORM ile mitige), XSS (DOMPurify), CSRF (REST API + JWT — cookie tabanlı oturum yok), broken authentication (account lockout, JWT expiry, bcrypt), security misconfiguration (insecure default secret tespit ediliyor — `_validate_startup_secrets` ile).
- **Auth bypass:** Token'sız erişim 401, yetersiz izinli erişim 403 döndürmektedir.
- **Rate limiting:** `slowapi` ile login uç noktasında dakika başına denemeler sınırlandırılmıştır.

## 6.6. Kullanıcı Kabul Testleri (UAT)

Her phase için ayrı bir UAT-CHECKLIST dosyası (`.planning/phases/.../UAT-CHECKLIST.md`) hazırlanmıştır. Bu listeler, fonksiyonel akışların manuel olarak doğrulanmasını sağlar. Phase 12 (Lifecycle) UAT'ı manuel sign-off için gelecek bir doğrulama oturumuna ertelenmiştir (`STATE.md` "Deferred Items" notu).

---

# 7. PROJE YÖNETİMİ VE SÜREÇ DEĞERLENDİRMESİ

## 7.1. Geliştirme Sürecinin Faz Yapısı

Proje, iki ana sürüm üzerinden 15 faz halinde yürütülmüştür:

**v1.0 MVP (Phases 1–7) — Teslim: 2026-04-20**
- Phase 1: Temel ve Güvenlik Sıkılaştırması
- Phase 2: Kimlik Doğrulama ve Ekip Yönetimi
- Phase 3: Proje ve Görev Tamamlama
- Phase 4: Görünümler ve UI
- Phase 5: Bildirimler
- Phase 6: Raporlama ve Analitik
- Phase 7: Süreç Modelleri, Uyarlama ve Entegrasyonlar

**v2.0 Frontend Yenileme ve Backend Genişletme (Phases 8–15) — Devam ediyor**
- Phase 8: Foundation & Design System
- Phase 9: Backend Schema, Entities & APIs
- Phase 10: Shell Pages & Project Features
- Phase 11: Task Features & Board Enhancements
- Phase 12: Lifecycle, Phase Gate & Workflow Editor
- Phase 13: Reporting, Activity & User Profile
- Phase 14: Admin Panel
- Phase 15: RBAC Yeniden Tasarımı (devam ediyor)

**[ŞEKİL 7.1: Geliştirme Süreci Faz Zaman Çizelgesi — placeholder]**

## 7.2. Görev Dağılımı ve İşbölümü

**Tablo 7.1.** Görev dağılımı ve işbölümü.

| Sorumluluk Alanı | Ayşe ÖZ | Yusuf Emre BAYRAKCI |
|------------------|---------|---------------------|
| Backend mimari ve domain modelleme | Birincil | Destek |
| Use case ve API geliştirme | Birincil | Destek |
| Veritabanı şeması ve migration | Birincil | İnceleme |
| Frontend prototip → komponent | Destek | Birincil |
| Workflow Editor ve Lifecycle Tab | Ortak | Ortak |
| Raporlama ve grafikler | Destek | Birincil |
| Test yazımı | Ortak | Ortak |
| Dokümantasyon (SRS, SDD, STD) | Birincil | Destek |
| Sunum ve poster | Ortak | Ortak |

İş bölümü esnek tutulmuş; karmaşık fazlarda pair-programming yöntemi tercih edilmiştir.

## 7.3. Karşılaşılan Zorluklar ve Çözümler

**Zorluk 1 — Clean Architecture disiplini.** Geliştirme akışı sırasında bazı use case'lere yanlışlıkla SQLAlchemy importu girmesi gözlemlendi. **Çözüm:** Statik bir lint kuralı yerine kod inceleme prosedürü ile her PR'da domain/application katmanlarının altyapı kütüphaneleri import etmediği manuel olarak doğrulandı.

**Zorluk 2 — Workflow Editor doğrulama.** Kullanıcı sürükle-bırak ile geçersiz workflow oluşturabiliyor (örn. final node'a giden edge yok). **Çözüm:** `validateWorkflow()` fonksiyonu beş hata kategorisi (yok-initial / yok-final / izole / döngü / id format) için ayrı ayrı kontrol uygular; backend tarafında da `WorkflowConfig` Pydantic validator'ı son katman olarak çalışır.

**Zorluk 3 — Phase Gate concurrent race condition.** İki PM aynı anda faz geçişi tetiklerse veri bütünlüğü riski. **Çözüm:** PostgreSQL advisory lock ile use case'de transaction sırasında kilit alınmaktadır.

**Zorluk 4 — UI kalite/hız dengesi.** Yeni komponentlerin design system'a uyumu zaman almaktadır. **Çözüm:** Primitive component kütüphanesi öne çekildi; sonraki tüm sayfalar bu primitive'ler üzerine inşa edildi.

## 7.4. Risk Yönetimi

Aşağıdaki riskler proje süresince izlenmiş ve uygun mitigasyon önlemleri alınmıştır:

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Frontend yenileme süresi aşımı | Orta | Yüksek | Phase 8–14 olarak parçalandı; her phase bağımsız teslim edilebilir |
| Veritabanı şema migration başarısız | Düşük | Yüksek | Migration'lar idempotent yazıldı; staging ortamda test edildi |
| JWT localStorage XSS riski | Orta | Orta | DOMPurify ile XSS engellendi; HttpOnly cookie v3.0'a ertelendi |
| Phase 15 RBAC kapsam genişlemesi | Orta | Orta | Ayrı bir Phase olarak ayrıldı; v2.0 teslimini bloke etmeyecek şekilde organize edildi |
| AI öner gecikmesi | Düşük | Düşük | Şu an pasif buton ile UI'da var; backend bağlantısı v3.0 |

---

# 8. GERÇEKÇİ KISITLAR

Bu bölüm, bölümümüzün talebi gereği projenin yalnızca teknik değil; ekonomik, çevresel, etik, toplumsal ve güvenlik boyutlarıyla da değerlendirildiği zorunlu bir başlıktır. Aşağıdaki alt başlıkların tamamı sırasıyla cevaplanmıştır.

## 8.1. Projenin Tasarım Boyutu

### 8.1.1. Projenin Niteliği

SPMS, **yeni bir bitirme projesi** olarak başlatılmıştır. Var olan bir projenin tekrarı ya da daha büyük bir projenin bir parçası değildir. Bununla birlikte:

- **Literatürdeki mevcut çözümlere bir alternatif** olarak konumlandırılmıştır (Jira [5], Trello [17], Asana [4], OpenProject [12], Microsoft Project [11]).
- **Açık kaynak felsefe** ile inşa edilmiş; gelecekte topluluk katkısına açık biçimde sürdürülebilir.
- **Modüler mimari** sayesinde yeni metodoloji eklenmesi, yeni rapor türü eklenmesi veya yeni entegrasyon bağlanması, mevcut kodu değiştirmeden yapılabilir. Bu açıdan SPMS, **kendisinden büyük bir ekosistemin başlangıç noktası** olarak da görülebilir.

### 8.1.2. Mühendislik Problemi ve Geliştirilen Çözüm

**Mühendislik problemi:** Yazılım ekipleri, projelerini Scrum, Kanban veya Waterfall paradigmalarından biriyle yönetmek istediklerinde, ya **pahalı ve ekosistem-bağımlı bir ticari aracı** (Jira, MS Project) seçmek, ya **dar kapsamlı ve büyümeyen bir aracı** (Trello) kullanmak ya da **maliyetsiz ama kullanım zorluğu yüksek bir açık kaynak çözümü** (OpenProject) tercih etmek zorunda kalmaktadır. Bu üç-yönlü kısıtlama, özellikle KOBİ ölçekli ekipler için ekonomik ve operasyonel sürtünme yaratmaktadır [10][13].

**Geliştirilen çözüm:** SPMS, dört metodolojiyi (Scrum, Kanban, Waterfall, İteratif/Artırımlı) **tek bir kod tabanında**, **Strategy Pattern** ile destekleyen, açık kaynak ve modern web teknolojileriyle inşa edilmiş bir platformdur. Kullanıcı projeyi oluştururken metodolojiyi seçer; sistem ilgili sürece özgü kurallarını otomatik uygular. Görsel **Workflow Editor**, kullanıcıların kendi süreç akışlarını sürükle-bırak ile tanımlamasına olanak tanır; **Phase Gate** mekanizması faz geçişlerinde otomatik kriter kontrolü ile kalite kapısı görevi görür. Açık kaynak yaklaşımı sayesinde lisans maliyeti olmadan, yazılım ekiplerinin metodolojiye değil işlerine odaklanmasını sağlar.

## 8.2. Lisans Eğitiminden Edinilen Bilgi ve Beceriler

Bu projede edindiğimiz lisans bilgilerinin neredeyse tamamı doğrudan veya dolaylı olarak kullanılmıştır. Bilgi transferi aşağıdaki tabloda özetlenmiştir.

**Tablo 8.1.** Ders – Proje Bilgi Transferi.

| Ders | Edinilen Bilgi/Beceri | Projede Kullanım |
|------|------------------------|---------------------|
| **Yazılım Mühendisliği** | Yazılım yaşam döngüsü, gereksinim mühendisliği, SRS/SDD hazırlama | SRS ve SDD dokümanlarımız bu dersin formatıyla yazıldı; IEEE 830/ISO 29148'e uyumlu hale getirildi |
| **Yazılım Tasarımı ve Mimarisi** | SOLID, GoF tasarım desenleri (Strategy, Repository, DI, Factory), Clean Architecture | Tüm backend mimarisi bu temele oturtuldu; Strategy Pattern süreç modeli, Repository veri erişimi, DI altyapısı |
| **Veri Yapıları ve Algoritmalar** | Graph traversal (BFS), state machine, hash tablo | Workflow'daki aktif faz hesaplama için BFS; TaskStatus state machine; Idempotency cache |
| **Veritabanı Yönetim Sistemleri** | İlişkisel modelleme, normalleştirme, ER diyagram, indeksleme, transaction yönetimi | PostgreSQL şemamız; advisory lock; foreign key kısıtları; her phase'de migration |
| **Nesneye Yönelik Programlama** | OOP, kalıtım, polimorfizm, abstract sınıflar | Domain katmanı entity'leri; ABC repository arayüzleri; Strategy hiyerarşisi |
| **Web Programlama** | HTTP, REST, JSON, MVC, frontend-backend ayrımı | FastAPI REST API; Next.js App Router; TanStack Query ile server state |
| **İnsan-Bilgisayar Etkileşimi (HCI)** | Kullanıcı merkezli tasarım, Nielsen heuristikleri, erişilebilirlik | Primitive komponent kütüphanesi; WCAG AA hedefi; klavye navigasyonu |
| **Yazılım Test Mühendisliği** | Birim, entegrasyon, sistem testleri; black-box/white-box | pytest birim testleri; httpx entegrasyon; Vitest + Playwright |
| **İşletim Sistemleri** | Concurrency, race condition, lock mekanizmaları | PostgreSQL advisory lock; rate limiting; async/await |
| **Bilgisayar Ağları** | TCP/IP, HTTP/HTTPS, TLS, OSI | REST API üzerinden istemci-sunucu mimarisi; CORS; HTTPS deployment hedefi |
| **Algoritma Analizi** | Karmaşıklık analizi, optimizasyon | API yanıt süresi optimizasyonu; eager loading; indeks tasarımı |
| **Proje Yönetimi (zorunlu/seçmeli)** | PMBOK, Agile/Scrum, risk yönetimi | Sistemin işlevsel kapsamı doğrudan bu dersten beslendi [14] |
| **Yazılım Mühendisliği Etiği** | Etik karar, sosyal sorumluluk, KVKK/GDPR | Veri minimizasyonu; audit log şeffaflığı; AI kullanımının açıklanması |

## 8.3. Kullanılan Modern Araçlar, Yazılımlar ve Teknolojiler

Projede kullanılan modern araç ve teknolojiler, amaçlarıyla birlikte aşağıda tablo halinde verilmiştir.

**Tablo 8.2.** Kullanılan araç – amaç eşleştirmesi.

| Kategori | Araç / Teknoloji | Kullanım Amacı |
|----------|------------------|----------------|
| **Programlama Dili (Backend)** | Python 3.12+ | Domain, application ve infrastructure kodu — async/await, type hints |
| **Programlama Dili (Frontend)** | TypeScript 5 (strict mode) | Tüm React komponentleri, hooks, servisler — derleme zamanı tür kontrolü |
| **Backend Çatı** | FastAPI | Async REST API, OpenAPI üretimi, DI |
| **ORM** | SQLAlchemy 2.0 (Async) | Async veritabanı erişimi; entity-relationship mapping |
| **Frontend Çatı** | Next.js 14 (App Router) | SSR/CSR hibrit; file-based routing |
| **UI Kütüphanesi** | React 19 + TailwindCSS 4 | Komponent bazlı UI; utility-first stil |
| **Server State** | TanStack Query 5 | Cache, invalidation, optimistic updates |
| **Veritabanı** | PostgreSQL 15 (Docker) | İlişkisel veri saklama, advisory lock, audit log |
| **Workflow Editor** | @xyflow/react (React Flow) | Sürükle-bırak node/edge editörü |
| **Sürükle-Bırak** | @dnd-kit | Kanban board, backlog panel |
| **Grafikler** | recharts | Burndown, CFD, Lead/Cycle Time vb. |
| **JWT** | python-jose | HS256 ile imzalama/doğrulama |
| **Parola Hash** | passlib[bcrypt] (cost 12) | Güvenli parola saklama |
| **Migration** | Alembic | Şema sürümleme |
| **PDF Üretim** | fpdf2 | Faz raporları, dışa aktarımlar |
| **Excel Üretim** | openpyxl | Veri dışa aktarımı |
| **E-posta** | fastapi-mail | SMTP entegrasyonu |
| **Scheduler** | apscheduler | Tekrarlayan görev tetikleyici |
| **Rate Limiting** | slowapi | Endpoint hız sınırı |
| **XSS Koruma** | isomorphic-dompurify | HTML sanitize |
| **Konteyner** | Docker (PostgreSQL 15 Alpine) | Veritabanı izole konteyner |
| **Test (Backend)** | pytest, pytest-asyncio, httpx, aiosqlite | Birim + entegrasyon |
| **Test (Frontend)** | Vitest, Testing Library, Playwright | Komponent + E2E |
| **IDE** | VS Code, Cursor | Geliştirme |
| **Sürüm Kontrol** | Git, GitHub | Versiyonlama, kod inceleme |
| **AI Destekli Kod** | Claude Code, GitHub Copilot | Boilerplate, test üretimi, refactor önerileri |
| **Tasarım** | Figma, Mermaid | Prototip ve diyagram |

## 8.4. Ek Yetkinlikler, Sertifikalar ve Disiplinler Arası Eğitimler

Proje süresince ekibimiz, dersin gerektirdiğinin ötesinde gelişim alanlarını araştırmış ve aşağıdaki kaynaklardan yararlanmıştır:

- **Coursera — "Software Architecture":** SOLID, Clean Architecture ve mimari karar kayıtları konusunda kavramsal pekiştirme sağlamıştır.
- **Coursera — "Project Management Principles and Practices Specialization":** PMBOK kapsamlı bilgi alanlarının somut uygulamalarını içerir; gereksinim ve risk yönetimi modüllerinin proje yönetim sürecimize aktarımı yapılmıştır.
- **Udemy — "FastAPI: The Complete Course":** Async FastAPI mimarisi, dependency injection paterni ve test stratejisi.
- **Udemy — "Next.js & React — The Complete Guide":** App Router, server components ve client components ayrımı.
- **Atlassian / Scrum.org dokümantasyonları:** Scrum çerçevesi resmî kılavuzlarının özümsenmesi.
- **OWASP Top 10 Guide:** Güvenlik gereksinimlerimizin temellendirilmesi.
- **PostgreSQL resmî dokümantasyonu:** Advisory lock, GIN/B-tree index seçimi, EXPLAIN ANALYZE okuma alıştırmaları.

Bunların yanı sıra, ekibimizin lisans öğreniminin son yılında aldığı seçmeli "İleri Yazılım Mühendisliği" ve "Web Tabanlı Sistem Tasarımı" dersleri projeye doğrudan katkı sağlamıştır.

## 8.5. Dikkate Alınan Mühendislik Standartları

Projede aşağıdaki standartlar dikkate alınmış ve tasarım kararlarına yansıtılmıştır. Listelerin amaca uygunluğu bilinçli tercihlerin sonucudur.

**Tablo 8.3.** Uyulan mühendislik standartları.

| Kategori | Standart | Kod | Projedeki Yansıması |
|----------|----------|-----|----------------------|
| Yazılım gereksinim | IEEE 830 | IEEE 830-1998 | SRS şablonumuz bu standardın bölüm yapısını izler |
| Yazılım gereksinim | ISO/IEC/IEEE 29148 | 29148:2018 | Gereksinim cümlelerinin yapısı (ROL → İhtiyaç → Kriter) |
| Yazılım yaşam döngüsü | ISO/IEC/IEEE 12207 | 12207:2017 | Phase yapımız bu standardın yaşam döngüsü süreçleriyle paraleldir |
| Bilgi güvenliği yönetimi | ISO/IEC 27001 | 27001:2022 | Audit log, erişim kontrolü, parola politikası |
| Uygulama güvenlik doğrulama | OWASP ASVS | v4.0 | Auth, session, input validation gereksinimleri |
| Yazılım kalite modeli | ISO/IEC 25010 | 25010:2011 | NFR'lerimiz (performans, güvenlik, kullanılabilirlik, sürdürülebilirlik) bu modelden türetildi |
| Web erişilebilirlik | WCAG 2.1 | AA | Kontrast oranları, klavye navigasyonu, ARIA |
| Kişisel veri koruma | GDPR / KVKK | EU 2016/679 / 6698 | Veri minimizasyonu, kullanıcı hakları (erişim, silme), audit log |
| JWT | IETF RFC 7519 | RFC 7519 | Token yapısı ve doğrulama |
| OAuth 2.0 | IETF RFC 6749 | RFC 6749 | Bearer token taşıması (gelecek IdP entegrasyonu için temel) |
| WebSocket (gelecek) | IETF RFC 6455 | RFC 6455 | Realtime bildirim adaptörü için protokol referansı |
| Hash | bcrypt | — | Parola hash; cost factor 12 |
| TLS | IETF RFC 8446 | TLS 1.3 | Production HTTPS hedefi |
| HTTP | IETF RFC 9110 | HTTP/1.1 + HTTP/2 | REST API |
| JSON | IETF RFC 8259 | RFC 8259 | API veri formatı |

Bu standartlar yalnızca "uyumluyuz" demek için değil; **tasarım kararlarımızı yönlendirmek için** kullanılmıştır. Örneğin gereksinim cümlelerimizin yapısı ISO/IEC/IEEE 29148'in önerdiği biçimde yazılmış; güvenlik testleri OWASP ASVS başlıkları üzerinden yapılmış; KVKK gereği kullanıcı verilerimiz yalnızca işlevsel ihtiyaç kadar tutulmuştur.

## 8.6. Gerçekçi Kısıtların Değerlendirilmesi (a–h)

Bu bölüm, bölümümüzün talebi gereği projenin **sekiz başlıkta** değerlendirilmesidir. Her başlıkta tasarım kararlarımızın bu kısıtlardan nasıl etkilendiği ve aldığımız önlemler açıklanmıştır.

### 8.6.1. a) Ekonomi

**Etki:** Proje yönetim yazılımları pazarındaki en kritik ekonomik kısıt, kullanıcı başına aylık lisans maliyetidir. Jira veya Microsoft Project gibi araçlar küçük ölçekli ekipler için yüksek maliyet oluşturmaktadır [7][10]. Capterra raporuna göre kullanıcıların büyük çoğunluğu sınırlı bir bütçe ile araç seçimi yapmakta, yalnızca %3'lük bir kesim bütçesini aşmaktadır [7]. Bu durum, KOBİ ölçekli ekiplerin profesyonel araçlardan yararlanmasını engellemektedir.

**Tasarım kararımız:** SPMS, **açık kaynak** ve **lisans ücreti gerektirmeyen** bir yaklaşımla geliştirilmiştir. Kullanılan tüm üçüncü parti kütüphaneler (FastAPI, SQLAlchemy, React, TailwindCSS vb.) MIT veya Apache 2.0 gibi izin verici lisanslara sahiptir. Bu sayede sistem; lisans maliyeti yaratmadan KOBİ'ler tarafından kullanılabilir. Aynı zamanda Docker tabanlı dağıtım sayesinde kurulum işçilik maliyeti minimize edilmiştir.

Geliştirme aşamasında ise AI destekli geliştirme araçları (Claude Code, GitHub Copilot) ile ekibimizin geliştirme verimliliği artırılmış; bu da iki kişilik öğrenci ekibinin endüstri ölçekli bir uygulama teslim etmesini mümkün kılmıştır.

### 8.6.2. b) Çevre Sorunları

**Etki:** Yazılım sistemleri görünür biçimde fiziksel kaynaklarla çalışmasa da, veri merkezleri küresel elektrik tüketiminin önemli bir kısmından sorumludur. Bulut tabanlı bir SaaS platformunun CO₂ ayak izi, sunucu sayısı ve çalışma süresiyle doğru orantılıdır.

**Tasarım kararımız:**
- **Veritabanı ve API'nin verimliliği:** Async I/O (asyncpg + asyncio) sayesinde tek sunucu daha çok eşzamanlı istek karşılayabilmektedir. Bu, aynı kullanıcı tabanına daha az donanım ile hizmet vermek demektir.
- **Önbellekleme:** TanStack Query istemci tarafında, idempotency cache sunucu tarafında — gereksiz tekrar isteklerinin önüne geçer.
- **PDF dışa aktarımı:** `fpdf2` saf Python ile çalışır; daha ağır olan WeasyPrint gibi sistem kütüphanesi gerektiren alternatifler yerine tercih edilmiştir. Bu, daha küçük konteyner imajı ve daha düşük CPU kullanımı anlamına gelir.
- **Eager loading + indeks tasarımı:** Veritabanı sorguları N+1 sorun çıkarmayacak şekilde eager load yapılır; sık erişilen kolonlar üzerinde indeksler oluşturulmuştur.

Yeşil yazılım (Green Software) ilkeleri kapsamında, gelecek sürümlerde gereksiz polling'in WebSocket'e dönüştürülmesi, dosya saklamanın object storage'a kaydırılması gibi optimizasyonlar yol haritasındadır.

### 8.6.3. c) Sürdürülebilirlik

**Etki:** Bir yazılımın "sürdürülebilirliği" iki anlam taşır: (1) **operasyonel sürdürülebilirlik** — yazılımın uzun vadede çalışmaya devam edebilmesi, (2) **bakımsal sürdürülebilirlik** — yeni geliştiricilerin koda kolayca dahil olabilmesi.

**Tasarım kararımız:**
- **Mimari sürdürülebilirlik:** Clean Architecture katman ayrımı ve SOLID prensipleri, kodun uzun vadede değişikliklere kapalı / genişlemelere açık olmasını sağlar.
- **Belgeleme:** SRS, SDD, STD, dönem sonu raporu ve bu kapsamlı rapor — toplam ~30.000+ kelime dokümantasyon. Ayrıca `.planning/` dizininde phase başına PLAN.md, UAT-CHECKLIST.md ve deferred-items.md dosyaları.
- **Migration yönetimi:** Tüm şema değişiklikleri Alembic ile sürümlenmiş; idempotent. Yeni bir geliştirici tek komut ile son şemaya ulaşır (`alembic upgrade head`).
- **Test piramidi:** 460+ test (Backend + Frontend); değişikliklerin regresyon yaratmadığının otomatik teyidi.
- **Container-first dağıtım:** Docker compose ile herhangi bir geliştirici makinesinde aynı çevre kurulabilir.
- **Konvansiyonel kararlar:** `CLAUDE.md` proje kuralları, `.planning/codebase/CONVENTIONS.md` kodlama tarzı kuralları içerir.

### 8.6.4. d) Üretilebilirlik

**Etki:** Bir yazılımın "üretilebilirliği", farklı ortamlarda hızlıca konuşlandırılabilmesi ve ölçeklenebilmesi anlamına gelir. Bu özellikle CI/CD süreçleri ve infrastructure-as-code yaklaşımlarıyla ilgilidir.

**Tasarım kararımız:**
- **Docker konteynerizasyon:** PostgreSQL hazır docker-compose dosyası ile ayağa kalkar. Backend ve frontend, container'lara paketlenmek üzere konfigüre edilmiştir.
- **Bağımsız .env yapılandırması:** `Backend/.env` ve `Frontend2/.env.local` dosyaları, üretim ortamına özgü ayarları kod tabanından izole tutar.
- **Stateless backend:** API tarafında oturum saklanmaz (JWT stateless); bu sayede yatay ölçekleme için engel yoktur.
- **Migration otomasyonu:** `alembic upgrade head` komutu ile yeni ortama tek adımda şema kurulumu yapılır.
- **Health endpoint'ler:** `/docs` (Swagger UI) erişimi sistem ayakta olduğu sürece otomatik mevcuttur.

CI/CD pipeline'ı (GitHub Actions) v3.0 yol haritasındadır; bu, üretim ortamına otomatik dağıtım için temel oluşturacaktır.

### 8.6.5. e) Etik

**Etki:** Etik kısıtlar üç ana eksen üzerinden değerlendirilmiştir:

1. **Kullanıcı verilerinin etik kullanımı.**
2. **Yapay zekâ destekli geliştirmenin şeffaf beyanı.**
3. **Açık kaynak kütüphanelerin lisans uyumu.**

**Tasarım kararımız:**

1. **Veri etiği:**
   - Kullanıcıdan **işlevsel ihtiyaç kadar veri** alınır. Telefon, kimlik vb. zorunlu olmayan alanlar talep edilmez. KVKK ve GDPR'ın **veri minimizasyonu** ilkesine uyulmuştur.
   - Kullanıcılar kendi verilerini görme, düzenleme ve hesaplarını silme haklarına sahiptir (Profil sayfası + admin tarafında soft-delete + hard-delete iş akışı).
   - `audit_log` tablosu yalnızca operasyonel olayları (kim ne yaptı) kaydeder; içerik (yorum metni, dosya içeriği) loglanmaz.

2. **Yapay zekâ etiği:**
   - **Geliştirme sürecinde** AI araçları (Claude Code, GitHub Copilot) kullanılmıştır. Bu, raporumuzda açıkça beyan edilmiştir.
   - **Ürün içinde** AI tabanlı bir özellik (workflow editor'deki "AI öner") tasarlanmış ancak şu an itibarıyla aktif değildir. Kullanıcı arayüzünde "Yakında" etiketi ile gösterilmektedir. Bu, **hayalî bir özelliği ürünmüş gibi sunmama** etik ilkesinin bir uygulamasıdır.
   - AI özellikleri canlıya alındığında, kullanıcıya **AI tarafından üretilmiş** olduğu açıkça bildirilecek; kullanıcı, AI'nin önerisini her zaman manuel olarak değiştirebilecektir.

3. **Lisans etiği:**
   - Kullanılan üçüncü parti kütüphanelerin tamamı uyumlu açık kaynak lisanslara sahiptir. Lisans bilgileri her bir bağımlılığın resmî sayfasında belgelenmiştir.

### 8.6.6. f) Sağlık

**Etki:** Bilgi işlem ekipmanları ile uzun süre çalışmak, kullanıcılarda ergonomik ve göz sağlığı sorunlarına yol açabilir. Bir proje yönetim yazılımı, kullanıcının günde 6-8 saat baktığı bir araç olabilir.

**Tasarım kararımız:**
- **Karanlık tema desteği:** TailwindCSS oklch tabanlı tema değişkenleri sayesinde **dark mode** entegrasyonu için altyapı hazırdır. Kullanıcı göz yorgunluğunu azaltmak için sistem tercihinden bağımsız olarak tema değiştirebilir.
- **Yumuşak renk paleti:** Saf siyah/beyaz yerine yumuşak nötr tonlar (`bg-neutral-50`, `text-neutral-700`) kullanılmıştır. Bu, retinal kontrast yorgunluğunu azaltır.
- **Tipografi:** Sistem fontu (system-ui) + uyarlanabilir font boyutları (rem tabanlı).
- **Klavye navigasyon desteği:** WCAG 2.1 ile uyumlu olarak tüm temel akışlar (görev oluşturma, faz geçişi, yorum yazma) yalnızca klavye ile tamamlanabilir. Bu, fare kullanımının kısıtlı olduğu kullanıcılar (örn. el bileği rahatsızlığı olanlar) için kritiktir.
- **Bildirim toggle'ları:** Kullanıcı, bildirim alma sıklığını ve türünü ayarlayabilir. Bu, "bildirim yorgunluğu" (notification fatigue) sorununu hafifletir.

### 8.6.7. g) Güvenlik

Güvenlik, SPMS'nin tasarım kararlarında belki de en çok ağırlık tanıdığı kısıttır.

**Etki:** Proje yönetim yazılımları; iş süreçleri, ekip içi yazışmalar, sözleşme dosyaları gibi hassas verileri barındırır. Bir veri sızıntısı, hem ekip hem de müşteri açısından telafisi güç sonuçlar doğurabilir.

**Tasarım kararımız:**
- **JWT tabanlı kimlik doğrulama:** Stateless oturum; 30 dakikalık expiry. HS256 imzalama.
- **bcrypt parola hash:** Cost factor 12. Parolalar asla cleartext olarak veritabanına yazılmaz veya log'lanmaz.
- **RBAC izin matrisi:** 38 izin tohumu, `permissions` ve `role_permissions` tabloları, JWT payload'ında `permissions: [...]` array. `require_permission('admin.access')` decorator endpoint düzeyinde yetki kontrolü yapar.
- **OWASP Top 10 mitigasyonları:**
  - SQL injection: ORM parametrik sorgu.
  - XSS: `isomorphic-dompurify` ile sanitize.
  - CSRF: REST + JWT (cookie tabanlı oturum yok), `Idempotency-Key` mekanizması.
  - Broken authentication: Account lockout, rate limiting, JWT expiry, bcrypt.
  - Security misconfiguration: Insecure default secret'lar startup'ta tespit edilir ve uygulama çalışmaz (`_validate_startup_secrets`).
  - Sensitive data exposure: HTTPS deployment hedefi; veritabanı `.env` ile izole.
- **CORS:** Yalnızca tanımlı origin'ler kabul edilir.
- **Rate limiting:** `slowapi` ile uç noktalara özel limit; Phase Gate için 10 sn pencere.
- **Audit log:** Tüm kritik işlemler (login, izin değişikliği, faz geçişi, veri silme) yapısal JSON formatında loglanır.
- **Concurrent transition koruması:** PostgreSQL advisory lock.
- **Idempotency:** Tekrar gönderim ataklarına karşı `Idempotency-Key` header'ı.

### 8.6.8. h) Sosyal ve Toplumsal Sorunlar

**Etki:** Bir proje yönetim yazılımı, ekipler arası iletişimi şekillendirir; bu da işyeri kültürü, kapsayıcılık ve dijital eşitlik gibi sosyal boyutlara dokunur.

**Tasarım kararımız:**

- **Çok dillilik:** Sistem Türkçe ve İngilizce olarak iki dil desteğiyle gelir (`useApp().language` üzerinden `T()` fonksiyonu). Bu, küresel ve yerel kullanıcı tabanına aynı anda hizmet vermenin temelidir. Yeni dillerin eklenmesi mevcut altyapıda yalnızca bir kaynak dosyası ekleme gerektirir.
- **Erişilebilirlik:** WCAG 2.1 AA hedefi sayesinde görme engelli kullanıcılar ekran okuyucu desteğiyle, motor becerisi kısıtlı kullanıcılar klavye navigasyonuyla sistemi kullanabilir.
- **Dijital eşitlik:** Sistem responsive tasarım sayesinde mobil cihazlarda da çalışır. Bu, yalnızca masaüstü iş istasyonuna erişimi olan kullanıcılar yerine, akıllı telefonla bağlanan kullanıcıları da kapsamına alır. Mobil native uygulama kapsam dışında olsa da responsive yapı temel mobil ihtiyaçları karşılamaktadır.
- **Açık kaynak felsefe:** Geliştirme sürecinin şeffaflığı, kullanıcıların yazılıma güven duymasını sağlar. Çekiniliyorsa kod incelenebilir.
- **Etik veri kullanımı:** "Sosyal sürveyans" tarzı pratiklerden kaçınılmıştır. Audit log yalnızca "kim ne yaptı" bilgisini tutar; klavye loglama ya da kullanıcı davranış analizi yapılmaz.
- **Kapsayıcı dil:** UI metinleri cinsiyet-nötr ifadelerle yazılmıştır (örn. "kullanıcı", "ekip üyesi"). Sistem mesajları yargılayıcı değil, açıklayıcı ve yardımcı tondadır.

Sosyal sorumluluk açısından, açık kaynak olmasının ötesinde, SPMS'nin **eğitim amaçlı kullanılabilir** olması bir başka katkıdır. Lisans öğrencileri Clean Architecture'ın gerçek bir örneğini bu kod tabanı üzerinden inceleyebilir.

---

# 9. SONUÇ VE DEĞERLENDİRME

## 9.1. Elde Edilen Sonuçlar

Bu çalışmada, yazılım geliştirme ekiplerinin proje yönetim süreçlerini tek bir platformda yürütebilmelerine olanak tanıyan, metodoloji-bağımsız ve açık kaynak bir sistem olan **SPMS** başarıyla tasarlanmış ve önemli ölçüde tamamlanmıştır. Sistem:

- **Beş ana modülde** (AUTH, TASK, NOTIF, REPORT, PROCESS) işlevsellik sağlamakta,
- **Dört yazılım geliştirme metodolojisini** (Scrum, Kanban, Waterfall, İteratif) tek kod tabanında Strategy Pattern ile desteklemekte,
- **Yaşam Döngüsü Tab'ı**, **Workflow Editor**, **Phase Gate**, **Milestone / Artifact / PhaseReport** ve **9 hazır şablonla** profesyonel düzey proje yönetimini olanaklı kılmakta,
- **Burndown / CFD / Lead-Cycle Time / İterasyon Karşılaştırma** raporları ile veri-temelli karar desteği sunmakta,
- **RBAC v2 ile esnek izin matrisi** sağlamakta,
- ~52.600 satır kod, 460+ test ve 30.000+ kelime dokümantasyon ile **akademik düzeyde belgelenmiştir.**

## 9.2. Hedeflere Ulaşma Durumu

Projenin başlangıçta tanımlanan hedeflerine ulaşma oranı yüksek düzeydedir:

| Hedef | Durum | Açıklama |
|-------|-------|----------|
| Tek kod tabanında çoklu metodoloji desteği | ✅ Ulaşıldı | Scrum/Kanban/Waterfall/İteratif Strategy Pattern ile |
| Clean Architecture + SOLID disiplin | ✅ Ulaşıldı | Domain ve Application katmanlarında SQLAlchemy import'u yok |
| Açık kaynak ve lisans-ücretsiz | ✅ Ulaşıldı | Tüm bağımlılıklar uyumlu açık kaynak |
| Görsel yaşam döngüsü düzenleyici | ✅ Ulaşıldı | React Flow tabanlı, 9 preset şablon |
| Faz geçiş kapısı (Phase Gate) | ✅ Ulaşıldı | Otomatik + manuel kriter, audit log |
| RBAC v2 izin matrisi | 🟡 Devam ediyor | Phase 15 — backend tamam, UI uplift devam |
| AI tabanlı workflow öneri | 🟡 Tasarımı tamam | UI yer aldı, backend bağlantısı v3.0 |
| WebSocket gerçek zamanlı bildirim | 🔴 Ertelendi | Polling ile çözüldü, v3.0 yol haritasında |
| Mobil native uygulama | 🔴 Kapsam dışı | Responsive web yeterli |

## 9.3. Projenin Güçlü ve Geliştirilebilir Yönleri

**Güçlü yönler:**

- **Mimari disiplin:** Clean Architecture katman ayrımı tutarlı uygulanmış; teknik borç düzeyi düşük.
- **Çoklu metodoloji desteği:** Mevcut araçların çoğunda bulunmayan, gerçek bir farklılaştırıcı özellik.
- **Test kapsamı:** Backend integration testleri ve frontend birim testlerinin sayısı, akademik bir bitirme projesinin oldukça üzerindedir.
- **Dokümantasyon olgunluğu:** SRS, SDD, STD, dönem sonu raporu ve bu kapsamlı raporun ve `.planning/` dizinindeki yapay zekâ destekli geliştirme planlarının birlikte oluşturduğu doküman seti, sistemin uzun vadeli sürdürülebilirliğini destekler.
- **Etik şeffaflık:** AI'nin hem geliştirme sürecindeki rolü hem de ürünün içindeki gelecek özellik olarak yeri açıkça beyan edilmiştir.

**Geliştirilebilir yönler:**

- **Gerçek zamanlı işbirliği:** Polling yerine WebSocket entegrasyonu.
- **AI özellikleri:** "AI öner" arayüzdeki yerini almıştır; backend LLM bağlantısı bir sonraki sürümde aktif edilebilir.
- **Bütçe takibi:** PMBOK Maliyet Yönetimi bilgi alanı şu anda doğrudan modül olarak yer almamaktadır.
- **Yük testleri:** Performans testlerinin otomasyonu (k6 / locust ile).
- **HttpOnly cookie JWT:** Şu an localStorage'da; XSS riskine karşı v3.0'da cookie tabanlı oturuma geçilmesi.

## 9.4. Gelecek Çalışmalar

Aşağıdaki başlıklar, projenin v3.0 yol haritasında yer almaktadır:

1. **AI öner backend bağlantısı:** Workflow editör arayüzündeki "Yakında" rozetinin aktive edilmesi. LLM API'sine sorgu, JSON şema üretimi, kullanıcı onayı ile uygulama.
2. **WebSocket gerçek zamanlı bildirim:** `INotificationService` arayüzüne `WebSocketNotificationAdapter` implementasyonu eklenecek.
3. **HttpOnly cookie JWT:** localStorage tabanlı JWT yerine HttpOnly+Secure cookie + CSRF token.
4. **GraphQL API katmanı:** Mevcut REST'in yanına opsiyonel GraphQL katmanı.
5. **Persistent lockout store:** Account lockout için Redis tabanlı kalıcı depolama.
6. **CI/CD pipeline:** GitHub Actions ile otomatik test ve dağıtım.
7. **Çok kiracılı (multi-tenant) destek:** Tek bir kurulumun birden çok organizasyona hizmet vermesi.
8. **Bütçe ve maliyet takibi modülü:** PMBOK Maliyet Yönetimi alanını kapsayacak şekilde.
9. **Mobil push bildirim:** FCM/APNs entegrasyonu.

## 9.5. Kapanış

SPMS, modern bir yazılım proje yönetim sisteminin **mimari, metodolojik ve etik** boyutlarını birlikte ele alan bir bitirme projesi olarak tasarlanmıştır. Çalışma yalnızca bir ürün ortaya çıkarmamış; aynı zamanda Clean Architecture, SOLID, Strategy Pattern ve PMBOK bilgi alanlarının lisans seviyesinde **somut bir uygulamasını** ortaya koymuştur. Literatür [10][13]'in vurguladığı "tek araç tüm metodolojileri kapsayamıyor" sorununa, Strategy Pattern + görsel Workflow Editor + Phase Gate üçlüsü ile bütünleşik bir cevap geliştirilmiştir.

Sistemimiz, yapay zekâ tabanlı proje yönetimi eğiliminin [3][16] bir adım önünde kalabilmek adına **"AI öner"** özelliğine tasarım düzeyinde hazırlanmıştır. Açık kaynak felsefesi, etik şeffaflık ve sürdürülebilir mimari ile SPMS, hem akademik hem de endüstriyel bağlamda değer sunmaya hazır bir platform olarak değerlendirilebilir.

---

# 10. KAYNAKLAR

[1] Aprika, "Project management tools," Aprika, [Çevrimiçi]. Erişim: https://aprika.com/fundamental_library/project-management-tools/ Erişim tarihi: 26 Ekim 2025.

[2] Aprika, "Best practices for effective issue tracking in project management," Aprika, [Çevrimiçi]. Erişim: https://aprika.com/fundamental_library/best-practices-for-effective-issue-tracking-in-project-management/ Erişim tarihi: 26 Ekim 2025.

[3] Artsmart.ai, "AI in Project Management: 2025 Trends, Stats, and Future Outlook," Artsmart Blog, 2023. [Çevrimiçi]. Erişim: https://artsmart.ai/blog/ai-in-project-management-statistics/ Erişim tarihi: 26 Ekim 2025.

[4] Asana, "Asana," [Çevrimiçi]. Erişim: https://asana.com/ Erişim tarihi: 26 Ekim 2025.

[5] Atlassian, "Jira," [Çevrimiçi]. Erişim: https://www.atlassian.com/software/jira Erişim tarihi: 26 Ekim 2025.

[6] Capterra, "Project Management Software User Research," Mar. 2021. [Çevrimiçi]. Erişim: https://www.capterra.com/resources/project-management-software-user-research/ Erişim tarihi: 26 Ekim 2025.

[7] Y. Chouhan, A. Sangle, A. Patil, S. Ramteke ve K. V. Metre, "Project Management Tool: A Review," *International Journal of Scientific Development and Research*, cilt 7, sayı 1, ss. 44–49, 2022. [Çevrimiçi]. Erişim: https://www.ijsdr.org/papers/IJSDR2201044.pdf

[8] The Digital Project Manager, "5 Emerging Project Management Trends of 2025," [Çevrimiçi]. Erişim: https://thedigitalprojectmanager.com/project-management/project-management-trends/ Erişim tarihi: 26 Ekim 2025.

[9] Elmhurst University, "The Future of Project Management: Trends and Technologies," [Çevrimiçi]. Erişim: https://www.elmhurst.edu/blog/the-future-of-project-management-trends-and-technologies/ Erişim tarihi: 26 Ekim 2025.

[10] M. A. Miah, C. R. Barikdar, H. Rahman, F. Mahmud ve J. Alam, "Comparative Analysis of Project Management Software: Functionality, Usability, and Integration for Modern Workflows," *Membrane Technology*, cilt 2025, sayı 1, 2025. [Çevrimiçi]. Erişim: https://membranetechnology.org/index.php/journal/article/download/309/215/607

[11] Microsoft, "Microsoft Planner," [Çevrimiçi]. Erişim: https://www.microsoft.com/tr-tr/microsoft-365/planner/microsoft-planner Erişim tarihi: 26 Ekim 2025.

[12] OpenProject, "OpenProject," [Çevrimiçi]. Erişim: https://www.openproject.org/ Erişim tarihi: 26 Ekim 2025.

[13] F. Pasarič ve M. Pušnik, "Comparison of Project Management Tools," *CEUR Workshop Proceedings*, cilt 3237, ss. 12–21, 2022. [Çevrimiçi]. Erişim: https://ceur-ws.org/Vol-3237/paper-pas.pdf

[14] Project Management Institute (PMI), *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, 6. bs., 2017.

[15] Project Management Institute (PMI), "The Triple Constraint: Erroneous, Useless, or Value?," PMI, [Çevrimiçi]. Erişim: https://www.pmi.org/learning/library/triple-constraint-erroneous-useless-value-8024 Erişim tarihi: 26 Ekim 2025.

[16] "Rise of Artificial Intelligence in Project Management: A Systematic Literature Review of Current Opportunities, Enablers, and Barriers," *Information*, 15(7), 1130. [Çevrimiçi]. Erişim: https://www.mdpi.com/2075-5309/15/7/1130 Erişim tarihi: 26 Ekim 2025.

[17] Trello, "Trello," [Çevrimiçi]. Erişim: https://trello.com/tr Erişim tarihi: 26 Ekim 2025.

---

## İNTİHAL BEYANI

Bu çalışmadaki tüm bilgilerin akademik kurallara ve etik davranışa uygun olarak alındığını ve sunulduğunu, bu belgede alıntı yaptığımı belirttiğim yerler dışında sunduğum çalışmanın kendi çalışmamız olduğunu, Yükseköğretim Kurumları Bilimsel Araştırma ve Yayın Etiği Yönergesi'nde belirtilen bilimsel araştırma ve yayın etiği ilkelerine uygun olduğunu beyan ederiz.

Çalışma sırasında, geliştirme verimliliğini artırmak amacıyla **Claude Code** ve **GitHub Copilot** gibi yapay zekâ destekli kod yazım araçları kullanılmıştır. Bu araçların kullanımı, kod boilerplate üretimi, test taslakları oluşturma ve refactor önerileri ile sınırlı tutulmuş; tüm mimari kararlar, gereksinim analizi, tasarım kararları ve raporlama çalışmaları öğrencilerin kendi entelektüel katkısıdır. Yapay zekâ kullanımının kapsamı ve sınırları bu raporun **Bölüm 8.6.5 (Etik)** kısmında ayrıntılı biçimde açıklanmıştır.

| Numara | Ad-Soyad | Tarih | İmza |
|--------|----------|-------|------|
| 21118080055 | Ayşe ÖZ | Mayıs 2026 | ……………… |
| 22118080006 | Yusuf Emre BAYRAKCI | Mayıs 2026 | ……………… |

---

*Bu rapor, BM495–BM496 Bilgisayar Mühendisliği Projesi I-II dersi kapsamında, Gazi Üniversitesi Mühendislik Fakültesi Bilgisayar Mühendisliği Bölümü için hazırlanmıştır.*
