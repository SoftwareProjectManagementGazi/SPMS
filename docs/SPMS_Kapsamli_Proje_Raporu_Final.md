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
| Şekil 4.3 | Görev Durumu Geçiş Diyagramı (TaskStatus State Machine) |
| Şekil 4.4 | JWT Kimlik Doğrulama Akış Diyagramı |
| Şekil 5.1 | Proje Yaşam Döngüsü Yönetim Ekranı (Lifecycle Tab) |
| Şekil 5.2 | Workflow Editor — Görsel Süreç Modeli Tasarımcısı |
| Şekil 5.3 | Phase Gate (Faz Geçiş Kapısı) Kriter Değerlendirme Akışı |
| Şekil 5.4 | Görev Tahta Görünümü (Kanban Board) — WIP Limit İhlali |
| Şekil 5.5 | Gantt ve Takvim Görünümleri |
| Şekil 5.6 | Sprint Yönetimi ve Burndown Grafiği |
| Şekil 5.7 | Kümülatif Akış Diyagramı (CFD) ve Lead/Cycle Time |
| Şekil 5.8 | "AI ile Öner" — Yapay Zekâ Tabanlı Workflow Önerisi |
| Şekil 5.9 | Admin Paneli ve İzin Matrisi (RBAC) |
| Şekil 7.1 | Geliştirme Süreci Zaman Çizelgesi |

---

## TABLOLAR LİSTESİ

| Tablo | Açıklama |
|-------|----------|
| Tablo 2.1 | Yaygın Proje Yönetim Yazılımlarının İşlevsel Karşılaştırması |
| Tablo 3.1 | SPMS Modülleri ve Sorumluluk Alanları |
| Tablo 3.2 | Kullanıcı Rolleri ve Yetki Kapsamı |
| Tablo 3.3 | Gereksinim İzlenebilirlik Matrisi (Özet) |
| Tablo 4.1 | Clean Architecture Katman Bağımlılık Kuralları |
| Tablo 4.2 | Süreç Modeli Davranış Farkları |
| Tablo 5.1 | Backend Teknoloji Yığını |
| Tablo 5.2 | Frontend Teknoloji Yığını |
| Tablo 5.3 | Yaşam Döngüsü Şablonları (9 Preset) |
| Tablo 6.1 | Test Senaryoları Özet Tablosu |
| Tablo 7.1 | Görev Dağılımı ve İşbölümü |
| Tablo 8.1 | Ders – Proje Bilgi Transferi |
| Tablo 8.2 | Kullanılan Araç – Amaç Eşleştirmesi |
| Tablo 8.3 | Uyulan Mühendislik Standartları |

---

## SİMGELER VE KISALTMALAR

| Kısaltma | Açıklama |
|----------|----------|
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
| **JWT** | JSON Web Token |
| **KVKK** | Kişisel Verilerin Korunması Kanunu |
| **LLM** | Large Language Model (Büyük Dil Modeli) |
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

Bu çalışmada, yazılım geliştirme ekiplerinin proje yönetim süreçlerini tek bir platformda yürütebilmelerini sağlayan, web tabanlı, tam işlevli ve metodoloji-bağımsız bir proje yönetim sistemi olan **SPMS (Software Project Management System / Yazılım Projesi Yönetim Yazılımı)** tasarlanmış ve uygulanmıştır. Sistem; Scrum, Kanban, Waterfall ve İteratif/Artırımlı süreç modellerinin tamamını tek bir kod tabanında destekleyecek biçimde tasarlanmıştır. Kullanıcı, projenin başında metodolojiyi seçtikten sonra ilgili sürece özgü kuralların (Sprint zorunluluğu, WIP limitleri, görev bağımlılıkları, faz geçişleri) sistem tarafından uygulanması sağlanmaktadır.

Mevcut ticari çözümlerin yüksek lisans ücretleri, küçük ve orta ölçekli ekiplerin tek bir araçta birleşik metodoloji desteğine erişimini güçleştirmektedir [10][13]. SPMS, bu açığı kapatmayı hedefleyen, açık geliştirilebilir bir alternatif olarak konumlandırılmıştır. Sistem; backend katmanında Python 3.12 ile FastAPI ve PostgreSQL, frontend katmanında ise Next.js, React ve TypeScript teknolojileri ile geliştirilmiştir. Mimari; Clean Architecture (Hexagonal / Ports & Adapters) prensiplerine uygun olarak Domain, Application, Infrastructure ve Presentation katmanlarına ayrılmıştır. Tüm bağımlılıklar SOLID prensiplerine uygun şekilde, FastAPI'nin yerleşik bağımlılık enjeksiyonu mekanizması üzerinden enjekte edilmektedir.

Sistemin teslim ettiği ana modüller; Kullanıcı ve Yetkilendirme (JWT + RBAC), Proje ve Görev Yönetimi (alt görevler, bağımlılıklar, tekrarlayan görevler), Bildirim ve Mesajlaşma (uygulama içi + e-posta), Raporlama ve Analitik (Burndown, Gantt, Kanban, CFD, Lead/Cycle Time, İterasyon Karşılaştırma) ve Süreç Modeli Yönetimi olmak üzere beş ana modülden oluşmaktadır. Bunlara ek olarak, projenin ikinci geliştirme döneminde getirilen **Yaşam Döngüsü (Lifecycle)** modülü, görsel **Workflow Editor**, **Phase Gate (Faz Geçiş Kapısı)**, Milestone / Artifact / Phase Report yönetimi, görev durumu geçiş diyagramı ve **yapay zekâ tabanlı workflow önerisi (AI ile Öner)** sistemin profesyonel düzeyde proje yönetim ihtiyaçlarına yanıt vermesini sağlamıştır.

Geliştirme sürecinde yaklaşık 52.600 satır kod yazılmış, kapsamlı bir test paketi (134 test case, 25 senaryo, %100 başarı oranı) ile kalite doğrulanmış ve mimari kararlar PMBOK [14] bilgi alanlarıyla uyumlu olarak alınmıştır. Çalışmanın çıktısı yalnızca işlevsel bir yazılım değil; aynı zamanda akademik düzeyde belgelenmiş, izlenebilir gereksinimlere sahip ve etik–güvenlik–sürdürülebilirlik boyutlarıyla değerlendirilmiş bir mühendislik artefaktıdır.

**Anahtar kelimeler:** Yazılım Proje Yönetimi, Scrum, Kanban, Waterfall, Clean Architecture, SOLID, FastAPI, Next.js, Phase Gate, RBAC.

---

## ABSTRACT

This work presents the design and implementation of **SPMS (Software Project Management System)**, a web-based, methodology-agnostic project management platform that enables software development teams to plan, track, and report their projects within a single unified environment. Unlike the prevailing tools that specialize in a single paradigm — Jira for agile, Microsoft Project for waterfall, Trello for lightweight Kanban — SPMS supports Scrum, Kanban, Waterfall, and Iterative/Incremental process models within a single code base. The user selects the methodology at project creation, after which process-specific rules (sprint requirement, WIP limits, sequential task dependencies, phase gates) are enforced by the system.

The high licensing costs of commercial alternatives and the absence of an integrated methodology-pluralistic open option create a clear gap, particularly for small and medium-sized teams [10][13]. SPMS positions itself as an open, extensible alternative in this space. The back end is built on Python 3.12 with FastAPI and PostgreSQL, whereas the front end uses Next.js, React and TypeScript. The architecture follows **Clean Architecture (Hexagonal / Ports & Adapters)** with strict separation between Domain, Application, Infrastructure and Presentation layers. All inward dependencies obey the SOLID principles, wired through FastAPI's native dependency-injection mechanism.

Core modules delivered are: Authentication and Authorization (JWT + RBAC), Project and Task Management (sub-tasks, dependencies, recurring tasks), Notification and Messaging (in-app + e-mail), Reporting and Analytics (Burndown, Gantt, Kanban, Cumulative Flow Diagram, Lead/Cycle Time, Iteration Comparison) and Process Model Management. The second development cycle additionally introduced the **Lifecycle module**, the visual **Workflow Editor**, the **Phase Gate transition engine**, the Milestone / Artifact / Phase Report entities, the task status transition diagram and the **AI-assisted workflow suggestion** feature, raising the system to a professional level.

Approximately 52,600 lines of code were produced throughout the project, and quality was validated through a comprehensive test suite (134 test cases across 25 scenarios with a 100% pass rate). All architectural decisions were aligned with the PMBOK [14] knowledge areas. The deliverable is not only a working application but an academically documented engineering artefact whose ethical, security, and sustainability dimensions have been systematically evaluated.

**Keywords:** Software Project Management, Scrum, Kanban, Waterfall, Clean Architecture, SOLID, FastAPI, Next.js, Phase Gate, RBAC.

---

# 1. GİRİŞ

## 1.1. Projenin Amacı ve Kapsamı

Günümüzde yazılım projelerinin başarısı, yalnızca teknik yetkinlikle değil; aynı zamanda planlama, izleme, iletişim ve risk kontrolünün ne ölçüde disiplinli yürütüldüğüne bağlıdır [1][13]. Yazılım projelerinin önemli bir kısmı zaman ya da bütçe aşımı yaşamakta; bazıları tamamen iptal edilebilmektedir. Bu durumun temel sebeplerinden biri, ekiplerin ihtiyaçlarına uygun proje yönetim aracını seçememesi ya da seçtikleri aracın metodolojik açıdan tek bir yaklaşımla sınırlı kalmasıdır [10][13].

Bu bitirme projesi kapsamında geliştirilen **Yazılım Projesi Yönetim Yazılımı (SPMS)**, yazılım geliştirme ekiplerinin proje süreçlerini uçtan uca yönetebilmeleri, görev dağılımlarını organize edebilmeleri ve risklerini minimize edebilmeleri amacıyla tasarlanmış web tabanlı bir platformdur. Sistemin temel özgün yanı; Scrum, Kanban, Waterfall ve İteratif/Artırımlı yaklaşımları **tek bir uygulamada** destekleyebilmesidir. Böylece kullanıcı, projeyi başlatırken metodolojiyi seçmekte; sistem, sürece özgü kuralları (Sprint zorunluluğu, WIP limitleri, görev bağımlılıkları, faz geçişleri) buna göre uygulamaktadır.

## 1.2. Problem Tanımı ve Motivasyon

Literatür taramamız sırasında [10][13][7] açıkça gözlemlediğimiz problem, ekiplerin **"tek bir en iyi araç" bulamamasıdır.** Mevcut araçlar üç kategoride dengesizdir:

- **Profesyonel ama pahalı:** Jira [5], Microsoft Project [11] — geniş özellik seti, ancak kullanıcı başına aylık lisans maliyetleri ile küçük/orta ölçekli ekiplerin erişimini kısıtlar [7].
- **Erişilebilir ama dar kapsamlı:** Trello [17] — düşük öğrenme eğrisi, ancak görev bağımlılıkları, gelişmiş raporlama ve metodoloji çeşitliliği gibi ileri ihtiyaçları karşılayamaz [10].
- **Açık kaynak ama kullanım zorluğu yüksek:** OpenProject [12] — lisans maliyeti yok, ancak hem kurulum hem de arayüz açısından ticari muadillerinin gerisindedir.

Bu üç eksenli kısıtlamanın **kesişiminde** ne ticari ne de açık kaynak alternatifler tatmin edici cevap sunmaktadır. Özellikle bir ekibin Scrum, başka bir ekibin Kanban, üçüncüsünün Waterfall ile çalışmak istemesi durumunda farklı araçların paralel kullanılması ekonomik ve operasyonel sürtünme yaratmaktadır [10]. SPMS'nin temel motivasyonu, bu sürtünmeyi tek bir entegre platform üzerinde ortadan kaldırmaktır.

## 1.3. Projenin Önemi ve Beklenen Katkıları

Bu çalışmanın hem **akademik** hem de **endüstriyel** katkı potansiyeli bulunmaktadır:

- **Akademik düzeyde:** Clean Architecture, SOLID, OCP ve Dependency Inversion gibi yazılım mühendisliği prensiplerinin gerçek ölçekte uygulanmış bir örneğini sunar. Üretilen kod tabanı, lisans öğrencilerinin bu prensipleri somut bir sistem üzerinde gözlemleyebileceği bir referans niteliğindedir.
- **Endüstriyel düzeyde:** KOBİ ölçekli yazılım ekipleri için, lisans maliyeti olmayan, metodoloji çeşitliliğini destekleyen ve genişletilebilir bir alternatif sunulmuştur. Açık kaynak yaklaşımı OpenProject [12] gibi mevcut çözümlerin felsefesiyle uyumludur ancak modern teknoloji yığını ve gelişmiş kullanıcı deneyimi ile farklılaşmaktadır.
- **Metodolojik düzeyde:** Tek bir aracın birden fazla süreç modelini desteklemesinin sistem mimarisine etkisi (görsel Workflow Editor, Phase Gate, metodolojiye duyarlı kurallar), bu projenin literatürdeki "tek araç ile çok metodoloji" tartışmasına [10] uygulamalı bir cevabıdır.

## 1.4. Raporun Organizasyonu

Bu rapor dokuz ana bölümden oluşmaktadır. **Bölüm 2** literatür araştırmasını, **Bölüm 3** gereksinim analizini sunar. **Bölüm 4**, sistem mimarisini Clean Architecture katmanları, ER diyagramı ve görev durumu geçiş diyagramı ile birlikte ele alır. **Bölüm 5**, uygulama detayları ve yeni Yaşam Döngüsü modülünü; **Bölüm 6**, test stratejisi ve sonuçlarını; **Bölüm 7** ise proje yönetim sürecini değerlendirir. **Bölüm 8**, **"Gerçekçi Kısıtlar"** başlığı altında sekiz ana kısıtı (ekonomi, çevre, sürdürülebilirlik, üretilebilirlik, etik, sağlık, güvenlik, sosyal/toplumsal) ele alır. **Bölüm 9** sonuç ve değerlendirmeleri, **Bölüm 10** ise kaynakları içerir.

---

# 2. LİTERATÜR ARAŞTIRMASI

## 2.1. Proje Yönetimi Disiplini ve Temel Kavramlar (PMBOK)

Proje yönetimi, geçici ve özgün bir hedefi başarmak amacıyla gerekli faaliyetlerin planlanması, organize edilmesi ve kontrol edilmesi sürecidir [14]. Klasik literatürde "üçlü kısıt" olarak bilinen **zaman, maliyet ve kapsam** unsurları, proje başarısını belirleyen temel değişkenlerdir [15]. Bu üçgenin elemanlarından birinde yapılan değişiklik diğerlerini etkilemekte; örneğin kapsam genişlediğinde zaman ve maliyet de artmaktadır [15].

Proje Yönetim Enstitüsü'nün (PMI) yayımladığı **PMBOK Kılavuzu** [14], proje yönetimini birbiriyle ilişkili bilgi alanlarına ayırır. Bu alanlardan bazıları şunlardır:

- **Kapsam Yönetimi:** Projede yapılacak ve yapılmayacak işlerin net olarak tanımlanması. Başarılı bir proje için hangi işlerin yapılacağı ve yapılmayacağı net olmalıdır.
- **Zaman Yönetimi:** Görev sürelerinin tahmini, takvim oluşturma ve izleme faaliyetleri. Gantt şemaları ve ağ diyagramları bu alanda sıkça kullanılır.
- **Maliyet Yönetimi:** Bütçe planlaması, maliyet tahminleri ve harcamaların kontrolü.
- **Kalite Yönetimi:** Proje çıktılarının istenen kalite standartlarını karşılaması.
- **Kaynak Yönetimi:** Ekip üyelerinin görevlere atanması ve iş yükü dengesi.
- **Risk Yönetimi:** Belirsizliklerin sistematik olarak ele alınması.

SPMS'nin işlev kümesi bu bilgi alanlarının önemli bir kısmıyla doğrudan örtüşmektedir. PMBOK çerçevesi, sistemin yalnızca yazılım mühendisliği prensiplerine değil, **proje yönetimi disiplininin yerleşik kavramsal çerçevesine** de uyumlu kalmasını mümkün kılmıştır.

## 2.2. Yazılım Geliştirme Metodolojileri (Scrum, Kanban, Waterfall, İteratif)

Yazılım geliştirme metodolojileri, ekibin işi planlama, paylaşma ve teslim etme biçimini şekillendiren çerçevelerdir. Literatürde [10][13] sıklıkla üç ana paradigmadan söz edilir:

- **Geleneksel (Şelale / Waterfall):** Faz tabanlı, doğrusal ilerleyen yaklaşım. Bir faz tamamen bitmeden bir sonrakine geçilmez. Microsoft Project [11] gibi araçlar bu paradigmaya özellikle uygundur. Kapsamı baştan iyi tanımlanmış, gereksinimleri değişme olasılığı düşük projelerde tercih edilir.
- **Çevik (Agile) — Scrum:** Zaman sınırlı **Sprint'ler** üzerine kurulu, iteratif ve artırımlı. Backlog, Sprint Planning, Daily Stand-up, Sprint Review ve Retrospective ritüellerini barındırır. Jira [5] gibi araçlar Scrum'ı doğal biçimde destekler.
- **Çevik — Kanban:** Sprint kavramı olmayan, sürekli akış (continuous flow) yaklaşımı. Tahta üzerinde sütunlar arası taşıma ve **WIP limitleri** ile çalışır. Trello [17] bu paradigmanın en bilinen temsilcisidir.

Bu üç paradigmaya ek olarak **İteratif/Artırımlı** yaklaşımlar (Spiral, V-Model, RAD, Evolutionary, Incremental) farklı melez stratejiler sunar. Asana [4] ve OpenProject [12] gibi araçlar hibrit/esnek kullanım modelleri ile birden fazla paradigmayı destekleme iddiasındadır. Ancak literatür [10] açıkça vurgular: **tek bir aracın tüm ihtiyaçları karşılaması zordur** ve ekipler genellikle birden çok aracı paralel kullanmak zorunda kalmaktadır.

SPMS, bu noktada farklı bir yaklaşım benimsemiştir: Metodoloji çeşitliliği bir **mimari sorun** olarak ele alınmış; sürece özgü kurallar (Sprint zorunluluğu, WIP limitleri, görev bağımlılıkları) metodoloji özelliğine bağlı denetimlerle ve görsel bir yaşam döngüsü editörüyle desteklenmiştir. Bu yaklaşım, ileride yeni metodolojilerin eklenmesi durumunda kuralların merkezi ve modüler biçimde tutulmasına imkân tanımaktadır.

## 2.3. Mevcut Proje Yönetim Yazılımları

### 2.3.1. Jira / Trello / Asana / OpenProject / Microsoft Project

Literatür ve resmî dokümantasyonlardan derlenen veriler ışığında, en yaygın olarak kullanılan proje yönetim yazılımlarının güçlü ve zayıf yanları aşağıda özetlenmiştir.

**Microsoft Project [11]** — Klasik şelale projelerinin endüstri standartlarından biridir. Gantt şemaları, kritik yol (CPM) analizi ve kaynak kapasite planlama konularında güçlüdür. Ancak öğrenme eğrisi diktir; küçük ekipler için maliyetli ve karmaşıktır [10].

**Atlassian Jira [5]** — Çevik yazılım ekipleri için en güçlü desteği sunar. Sprint planlaması, backlog yönetimi, kullanıcı hikâyeleri ve görev panoları bu aracı özellikle Scrum/Kanban projelerinde popüler kılmıştır. Buna karşılık terminolojisi ve arayüzü yazılım odaklı olduğundan, yazılım dışındaki ekipler için kullanıma alıştırma süreci uzun olabilmektedir [10].

**Trello [17]** — Kanban prensibiyle çalışan, son derece basit ve görsel bir arayüz sunar. Küçük ekipler ve kişisel görev takipleri için ideal olsa da görev bağımlılıkları, gelişmiş raporlama ve kaynak yönetimi açısından sınırlıdır [10].

**Asana [4]** — Modern arayüzü ve esnek kullanım seçenekleri ile öne çıkar. Liste, tablo, pano ve zaman çizelgesi görünümlerini birlikte sunması güçlü yanıdır. Ücretsiz sürümünde gelişmiş özellikler kısıtlıdır ve büyük organizasyonlar için maliyetli olabilir [10].

**OpenProject [12]** — Açık kaynak bir alternatiftir. Gantt, iş paketleri, sürüm/yol haritası yönetimi ve doküman deposu sunar. Lisans maliyeti yoktur; ancak kullanıcı arayüzü ticari muadilleri kadar modern olmayabilir ve kendi sunucuya kurulması teknik bakım gerektirir.

### 2.3.2. Karşılaştırmalı Analiz

**Tablo 2.1.** Yaygın proje yönetim yazılımlarının işlevsel karşılaştırması (kaynak: [10][7], literatür taramamızdan).

| Özellik | Microsoft Project | Jira | Asana | Trello | OpenProject | **SPMS** |
|---------|-------------------|------|-------|--------|-------------|----------|
| Temel Metodoloji | Geleneksel (Şelale) | Çevik (Scrum/Kanban) | Hibrit/Çevik | Çevik (Kanban) | Hibrit/Geleneksel | **Çoklu (Scrum/Kanban/Waterfall/İteratif)** |
| Gantt Şeması | Çok Güçlü | Eklentilerle | Güçlü | Eklentilerle | Güçlü | **Güçlü** |
| Kanban Panosu | Zayıf | Çok Güçlü | Çok Güçlü | Çok Güçlü | Var | **Çok Güçlü** |
| Kritik Yol (CPM) | Güçlü | Var | Zayıf/Yok | Yok | Güçlü | **Görev Bağımlılığı** |
| Sprint Yönetimi | Yok | Çok Güçlü | Orta | Yok | Eklenti | **Çok Güçlü** |
| WIP Limit | Yok | Var | Zayıf | Eklenti | Var | **Var (zorunlu)** |
| Phase Gate (Faz Geçiş Kapısı) | Manuel | Manuel | Manuel | Yok | Manuel | **Var (otomatik kriter)** |
| Görsel Workflow Editor | Var | Sınırlı | Yok | Yok | Var | **Tam görsel + 9 hazır şablon** |
| Açık Kaynak | Hayır | Hayır | Hayır | Hayır | Evet | **Evet** |
| Lisans Maliyeti | Yüksek | Yüksek | Orta-Yüksek | Düşük | Yok | **Yok** |
| KVKK/GDPR Uyumu | Sertifikalı | Sertifikalı | Sertifikalı | Sertifikalı | Self-host bağlı | **Tasarım gereği** |

Capterra'nın geniş katılımlı kullanıcı anketine göre, kullanıcıların en çok ihtiyaç duyduğu işlevler raporlama/gösterge panoları (%65), doküman yönetimi (%64), iş birliği (%60), gereksinim yönetimi (%57), bütçeleme (%55), kaynak planlama (%54) ve zaman takibi (%53) olarak sıralanmıştır [6]. Bu dağılım, SPMS'nin işlevsel önceliklerini belirlerken yol gösterici olmuştur.

**[ŞEKİL 2.1: Yazılım Yönetim Araçlarında En Çok Kullanılan İşlevler — Capterra anket verisi (%) (Kaynak: [6])]**

## 2.4. Literatürdeki Boşluklar ve Projenin Konumu

Literatürün ortak bulgusu açıktır: **"Tüm projeler için geçerli tek bir 'en iyi araç' yoktur"** [10][13]. Doğru araç seçimi; proje türüne, ekibin çalışma kültürüne, organizasyonun olgunluk düzeyine ve ölçeklenebilirlik gereksinimine bağlıdır. Pasarič ve Pušnik'in çalışmasında iletişimin en önemli proje başarı faktörü olduğu sonucuna varılmıştır [13]; Miah ve arkadaşları ise tek aracın yetmediği, ekiplerin sıklıkla birden çok aracı birlikte kullanmak zorunda kaldığı sonucuna varmıştır [10].

Bu çıkarımlar ışığında SPMS, **araç seçimini gereksiz kılan bir birleşik platform** olarak konumlandırılmıştır:

1. **Çoklu metodoloji desteği:** Aynı uygulamada Scrum/Kanban/Waterfall/İteratif çalışma.
2. **Görsel yaşam döngüsü düzenleyici:** Kullanıcı, projesine özgü süreç akışını sürükle-bırak yöntemiyle tasarlayabilir.
3. **Faz geçiş kapısı (Phase Gate):** Otomatik kriter değerlendirmesi ile kalite kapısı.
4. **Açık kaynak felsefe:** Lisans maliyeti olmadan KOBİ ölçekli ekiplere ulaşım.

Gelecek yönelimler açısından literatür [3][16][8][9] dört ana eğilime işaret etmektedir: **yapay zekâ tabanlı otomasyon, hibrit/uzaktan çalışma için iş birliği özellikleri, veri analitiği ve güvenlik.** Gartner'a göre 2030 yılına kadar proje yönetimi görevlerinin %80'i yapay zekâ tarafından yürütülecektir [3]. SPMS bu eğilimi öngörerek, yaşam döngüsü düzenleyicisine yapay zekâ tabanlı **"AI ile Öner"** özelliğini entegre etmiştir; bu özellik kullanıcının proje türüne göre uygun bir süreç akışını öneren tasarımcıya yardımcı bir asistan görevi görür (Bölüm 5.8'de detaylandırılmıştır).

---

# 3. GEREKSİNİM ANALİZİ

## 3.1. Paydaş Analizi ve Kullanıcı Profilleri

SPMS, üç temel kullanıcı rolüne hizmet veren bir platformdur. Roller, **Role-Based Access Control (RBAC)** mimarisi ile sistemde tanımlanmıştır.

**Tablo 3.2.** Kullanıcı rolleri ve yetki kapsamı.

| Rol | Yetki Kapsamı |
|-----|---------------|
| **Admin** | Tüm sistem ayarları, kullanıcı yönetimi, izin matris yönetimi, denetim günlüğü erişimi, sistem yapılandırması |
| **Proje Yöneticisi (PM)** | Proje oluşturma, faz geçişleri, milestone/artifact yönetimi, ekip atama, raporlar |
| **Ekip Üyesi (Member)** | Atanan görevlerini güncelleme, yorum yazma, kendi profilini düzenleme |
| **Misafir (Guest)** | Salt okunur erişim (yapılandırılabilir) |

Bu rol kümesi, lisans dönemi başında uygulanan paydaş anketleri ve literatürdeki KOBİ ölçekli yazılım ekipleri profiliyle [10][13] uyumlu olarak şekillendirilmiştir.

## 3.2. Kullanım Senaryoları

Sistem aşağıdaki ana kullanım senaryolarını desteklemektedir:

1. **Proje yöneticisi yeni bir proje açar.** Sihirbaz dört adımda ilerler: Temel Bilgiler → Metodoloji Seçimi → Yaşam Döngüsü → Yapılandırma. Metodoloji seçimi sırasında sistem ilgili **9 hazır şablondan birini** otomatik olarak önerir.
2. **Ekip üyesi atanan görevleri günceller.** Tahta görünümünde (Kanban) görevini "Yapılacak" sütunundan "Yapılıyor" sütununa sürükler; WIP limiti aşılırsa kullanıcıya uyarı gösterilir ve taşıma engellenir.
3. **Proje yöneticisi faz geçişi yapar.** Lifecycle sekmesinde "Sonraki Faza Geç" butonuna tıklar; sistem mevcut fazın **otomatik kriterlerini** (tüm görevler tamamlandı mı, açık blocker var mı, kritik görev kaldı mı) ve **manuel kriterleri** değerlendirir. Kriterler karşılandıysa geçiş gerçekleşir; aksi takdirde gerekçe ile birlikte engellenir.
4. **Yönetici dönemsel raporları indirir.** Reports sayfasından Burndown, CFD, Lead/Cycle Time veya İterasyon Karşılaştırma raporlarını PDF/Excel formatında dışa aktarır.

## 3.3. Fonksiyonel Gereksinimler

Sistem fonksiyonel gereksinimleri beş ana modül altında gruplandırılmıştır. Detaylı liste SRS dokümanında verilmiştir; burada özet sunulmaktadır.

**Tablo 3.1.** SPMS modülleri ve sorumluluk alanları.

| Modül Kodu | Modül Adı | Temel Sorumluluk |
|------------|-----------|-------------------|
| **SPMS-MOD-AUTH** | Kullanıcı ve Yetkilendirme | Kayıt, giriş, JWT, RBAC izin yönetimi, parola sıfırlama, hesap kilitleme |
| **SPMS-MOD-TASK** | Proje ve Görev Yönetimi | Proje, görev ve alt görev yönetimi, bağımlılıklar, tekrarlayan görevler, etiketler, sprintler |
| **SPMS-MOD-NOTIF** | Bildirim ve Mesajlaşma | Uygulama içi bildirim, e-posta gönderimi, kullanıcı tercihleri, izleyici (watcher) mekanizması |
| **SPMS-MOD-REPORT** | Raporlama ve Analitik | Burndown, CFD, Lead/Cycle, İterasyon Karşılaştırma, Gantt, PDF/Excel export |
| **SPMS-MOD-PROCESS** | Süreç Modeli Yönetimi | Metodoloji seçimi, görsel yaşam döngüsü editörü, Phase Gate, milestone/artifact/faz raporu yönetimi |

## 3.4. Fonksiyonel Olmayan Gereksinimler

- **Performans:** API yanıt süresi normal yük altında p95 ≤ 500 ms.
- **Güvenlik:** OWASP Top 10 başta olmak üzere tüm girdiler doğrulanır; SQL injection ORM ile, XSS ise sanitize kütüphanesi ile engellenir.
- **Erişilebilirlik:** WCAG 2.1 AA düzeyini hedefler; klavye navigasyonu, ARIA etiketleri, yüksek kontrastlı renk paleti.
- **Kullanılabilirlik:** Sistem öğrenilebilirliği yaklaşık 30 dakika; tutarlı bir bileşen kütüphanesi tüm sayfalarda kullanılmaktadır.
- **Sürdürülebilirlik:** Clean Architecture + SOLID; yeni modül eklemek mevcut modüllerden bağımsızdır.
- **Çok dillilik:** Türkçe ve İngilizce destek.
- **Veri koruması:** KVKK/GDPR uyumlu yaklaşım — kullanıcı verisi yalnızca işlevsel ihtiyaç kadar tutulur; soft-delete ile veri kurtarma; denetim günlüğü ile izlenebilirlik.

## 3.5. Sistem Kısıtları ve Varsayımlar

- **Stack kısıtı:** Python/FastAPI + TypeScript/Next.js + PostgreSQL + Docker — sabit.
- **Mimari kısıt:** Tüm backend kodu Clean Architecture katmanlarına uygundur. Domain ve Application katmanları altyapı kütüphanelerini içe aktarmaz.
- **Ekip kısıtı:** İki geliştirici (Ayşe Öz, Yusuf Emre Bayrakcı), bir akademik danışman.
- **Süre kısıtı:** İki dönem (BM495 Güz, BM496 Bahar).

## 3.6. Gereksinim İzlenebilirlik Matrisi (Özet)

**Tablo 3.3.** Gereksinim izlenebilirlik matrisi (özet — tam matris SRS dokümanında).

| Gereksinim ID | Açıklama | Modül | STD Senaryo Referansı |
|---------------|----------|-------|----------------|
| SPMS-01.1 | Kullanıcı kayıt, giriş, çıkış (JWT) | AUTH | STD 3.1, 3.2 |
| SPMS-01.2 | Rol bazlı erişim (Admin/PM/Member) | AUTH | STD 3.25 |
| SPMS-02.1 | Proje CRUD + arşivleme | TASK | STD 3.5, 3.6 |
| SPMS-02.3 | Görev CRUD | TASK | STD 3.8, 3.9 |
| SPMS-02.4 | Alt görevler, öncelik | TASK | STD 3.10 |
| SPMS-03 | Bildirim sistemi | NOTIF | STD 3.16 |
| SPMS-04 | Raporlama ve dışa aktarım | REPORT | STD 3.17, 3.18, 3.19 |
| SPMS-05 | Süreç modelleri ve metodoloji | PROCESS | STD 3.5 |
| Lifecycle | Faz geçişi ve workflow | PROCESS | STD 3.20, 3.21 |

---

# 4. SİSTEM MİMARİSİ VE TASARIM

## 4.1. Mimari Yaklaşım: Clean Architecture

SPMS backend katmanı, Robert C. Martin'in tanımladığı **Clean Architecture** (Hexagonal / Ports & Adapters) ilkelerine göre tasarlanmıştır. Mimarinin temel kuralı, **bağımlılıkların yalnızca içe doğru gösterimi**dir. Bu sayede iş kuralları (Domain) ve uygulama mantığı (Application), altyapı seçimlerinden (veritabanı, web çatısı, e-posta servisi) tamamen yalıtılmış olur.

**[ŞEKİL 4.1: SPMS Clean Architecture Katman Diyagramı]**

```
        ┌────────────────────────────────────────────┐
        │  PRESENTATION (API)                        │
        │  ┌──────────────────────────────────────┐  │
        │  │  INFRASTRUCTURE                       │  │
        │  │  ┌────────────────────────────────┐   │  │
        │  │  │  APPLICATION (Use Cases)        │   │  │
        │  │  │  ┌──────────────────────────┐   │   │  │
        │  │  │  │  DOMAIN                   │   │   │  │
        │  │  │  │  (Entity, Interface,      │   │   │  │
        │  │  │  │   Exception)              │   │   │  │
        │  │  │  └──────────────────────────┘   │   │  │
        │  │  └────────────────────────────────┘   │  │
        │  └──────────────────────────────────────┘  │
        └────────────────────────────────────────────┘
                  ↑ bağımlılık yönü (içe)
```

## 4.2. Katmanlı Yapı

**Tablo 4.1.** Clean Architecture katman bağımlılık kuralları.

| Katman | Bağımlılık | İçerik |
|--------|------------|--------|
| **Domain** | Hiçbiri (saf Python) | Pydantic entity'leri, soyut depo (repository) arayüzleri, domain hataları |
| **Application** | Yalnızca Domain | Use case sınıfları, DTO'lar, port arayüzleri |
| **Infrastructure** | Application + Domain | Veritabanı modelleri ve repo implementasyonları, JWT/bcrypt adaptörü, SMTP, yapılandırma |
| **Presentation (API)** | Application + Infrastructure (yalnızca DI için) | HTTP yönlendiricileri, bağımlılık enjeksiyonu yapılandırması, uygulama başlangıcı |

Bu kural, Application ve Domain katmanlarının veritabanı ya da web çatısı gibi altyapı bağımlılıklarını içe aktarmamasıyla doğrulanmaktadır. Bu, **Dependency Inversion Principle**'ın disiplinli uygulanmasının somut göstergesidir.

## 4.3. SOLID Prensipleri ve Tasarım Yaklaşımı

Proje genelinde SOLID prensipleri tasarım kararlarını yönlendirmiştir:

- **SRP (Single Responsibility):** Her use case yalnızca tek bir iş eylemini (görev oluşturma, faz geçişi tetikleme, kullanıcı davet etme gibi) temsil eder. Bir use case sınıfı, veritabanı yazımı ve e-posta gönderimi gibi farklı işleri yapmaz; bu sorumlulukları ayrı bileşenlere delege eder.
- **OCP (Open/Closed):** Sistem yeni metodoloji veya yeni rapor türü gibi genişlemelere kapalı değildir. Örneğin grafik uygunluk kuralları tek bir merkezi tabloda (ör. CFD Kanban'a, Burndown Scrum'a uygulanır gibi) toplanmıştır; yeni bir metodoloji eklendiğinde bu tablo güncellenir, grafik uç noktaları değiştirilmez.
- **LSP (Liskov Substitution):** Soyut depo arayüzlerinin (örn. görev deposu) tüm implementasyonları (üretim veritabanı, test için bellek-içi mock) birbirinin yerine kullanılabilir. Use case'ler hangi implementasyonun enjekte edildiğini bilmez.
- **ISP (Interface Segregation):** Arayüzler ihtiyaç bazında bölünmüştür; örneğin yalnızca okuma yapan bir use case, tam CRUD arayüzü yerine daha dar bir okuyucu arayüzü ile çalışabilir.
- **DIP (Dependency Inversion):** Yüksek seviyeli use case'ler, somut altyapı sınıflarına değil; Domain katmanındaki soyutlamalara bağımlıdır.

Geliştirme sürecinde belirli noktalarda metodoloji-bağımlı davranışların (örneğin Sprint zorunluluğu yalnızca Scrum'da, WIP limiti yalnızca Kanban'da gibi) projenin metodoloji bilgisine bağlı olarak uygulandığı yerler de bulunmaktadır. Bu kontroller mümkün olduğunca merkezi yerlerde tutulmuş; arayüzdeki "uygulanabilirlik" mantığı tek bir kural kümesinden okunarak hem backend hem de frontend tarafından paylaşılmıştır. Bu yaklaşım, tek bir if-bloğu yığını yerine merkezileştirilmiş davranış kararları sayesinde OCP ilkesine yaklaşmamızı sağlamıştır.

## 4.4. Bağımlılık Enjeksiyonu (Dependency Injection)

Bağımlılık enjeksiyonu, FastAPI'nin yerleşik mekanizması üzerinden uygulanmıştır. Bir HTTP isteği geldiğinde web çatısı, ilgili use case'in ihtiyaç duyduğu depo (repository) ve servis arayüzlerinin somut implementasyonlarını dinamik olarak oluşturup enjekte eder. Use case, hangi gerçek implementasyonun verildiğinden habersizdir; yalnızca soyutlamayı görür.

Bu yaklaşımın iki büyük faydası vardır: (i) testlerde gerçek veritabanı yerine bellek-içi mock'lar kolayca enjekte edilebilir; (ii) ileride veritabanı veya e-posta servisi gibi altyapı tercihleri değişirse use case kodu etkilenmez.

## 4.5. Veri Modeli ve ER Diyagramı

SPMS veri modeli, ilişkisel bir şemaya sahiptir. Sistemdeki kritik varlıklar şunlardır:

- **Kullanıcı ve yetkilendirme:** kullanıcı, rol, izin
- **Proje organizasyonu:** proje, proje üyesi, ekip, ekip üyesi
- **Görev / sprint yönetimi:** görev, görev bağımlılığı, pano sütunu, sprint, etiket
- **Yaşam döngüsü artefaktları:** milestone, artifact, faz raporu (v2.0 ile eklenmiştir)
- **Gözlemlenebilirlik:** denetim günlüğü, bildirim, bildirim tercihi
- **Özelleştirme:** süreç şablonu, sistem yapılandırması

**[ŞEKİL 4.2: SPMS Veritabanı Varlık-İlişki (ER) Diyagramı — kritik varlıklar arası ilişkiler]**

```
   Kullanıcı ────< Proje Üyesi >──── Proje
       │                                │
       ▼                                ▼
   Denetim Günlüğü                   Görev
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                   Görev Bağımlılığı  Sprint     Yorum
                                                    │
                                                    ▼
                                                  Ek (dosya)

   Proje ──< Milestone     Proje ──< Artifact
   Proje ──< Faz Raporu    Proje ──< Denetim Günlüğü
```

Şema değişiklikleri sürüm-kontrollü migration'lar ile yönetilmektedir. Yeni bir geliştirici, tek komutla en güncel şemaya erişebilmektedir.

## 4.6. Görev Durumu Geçiş Diyagramı (State Machine)

Görev varlığı, dört temel durumu olan bir state machine ile temsil edilir: **TODO (Yapılacak), IN_PROGRESS (Yapılıyor), REVIEW (İnceleme), DONE (Tamamlandı)**. Görev oluşturulduğunda varsayılan olarak TODO durumundadır; geliştirme başladığında IN_PROGRESS'e geçer; tamamlandığında inceleme için REVIEW'a, onaylandığında ise DONE'a iletilir.

**[ŞEKİL 4.3: Görev Durumu Geçiş Diyagramı (TaskStatus State Machine)]**

```
           ┌──────────┐
   ╔══════>│  TODO    │<────────────────┐
   ║       └────┬─────┘                  │
   ║            │ başla                  │ tekrar aç
   ║            ▼                         │
   ║       ┌────────────┐                 │
   ║       │IN_PROGRESS │                 │
   ║       └────┬───────┘                 │
   ║            │ gönder                  │
   ║            ▼                         │
   ║       ┌──────────┐    reddet         │
   ║       │  REVIEW  │──────────────────>┘
   ║       └────┬─────┘
   ║            │ onayla
   ║            ▼
   ║       ┌──────────┐
   ╚═══════│   DONE   │
           └──────────┘
            (final)
```

Bu temel state'lere ek olarak, her proje kendi pano sütunlarını özelleştirebilir (örneğin "Test Aşamasında", "Müşteri Onayı Bekleniyor"). Kullanıcı görev kartını sürükle-bırak ile sütunlar arasında taşıdığında hem görevin sütun bilgisi hem de durum bilgisi güncellenir. Her durum geçişi denetim günlüğüne kaydedildiği için Burndown ve CFD gibi grafiklerin tarihsel verisi otomatik olarak birikir.

## 4.7. Yaşam Döngüsü (Lifecycle) Mimarisi

SPMS'nin yeni katkı sunduğu en kritik mimari yenilik, projenin **görsel yaşam döngüsü tanımıdır**. Her proje, yaşam döngüsünü tanımlayan bir yapılandırma nesnesi taşır. Bu nesne; süreç akış modunu (esnek, sıralı-kilitli, sıralı-esnek, sürekli), faz (node) ve geçiş (edge) tanımlarını, faz tamamlanma kriterlerini ve metodolojiye duyarlı UI etiketlerini içerir.

Akış modu dört seçenekten birinde olabilir:

- **Esnek** — Fazlar arası serbest geçiş.
- **Sıralı-kilitli** — Yalnızca bir sonraki faza geçiş (klasik Waterfall davranışı).
- **Sıralı-esnek** — Sıralı ilerleyiş + tanımlı geri dönüşlere izin verir (kritik düzeltmeler için).
- **Sürekli** — Tek akış; Phase Gate kavramı bu modda yoktur (Kanban davranışı).

## 4.8. Phase Gate (Faz Geçiş Kapısı) Mimarisi

Phase Gate, bir projenin mevcut fazından bir sonraki faza geçişini denetleyen mekanizmadır. Bir faz geçişi tetiklendiğinde sistem aşağıdaki kontrolleri yapar:

1. **Yetki kontrolü:** Faz geçişi yapma iznine sahip kullanıcı kontrolü.
2. **Hız sınırı (rate limit):** Aynı kullanıcı-proje çifti için kısa pencere içinde tekrar denemelerin engellenmesi.
3. **Tekrar gönderim koruması:** Aynı isteğin yanlışlıkla iki kez işlenmemesi için idempotency anahtarı.
4. **Otomatik kriter değerlendirmesi:** Tüm görevler tamamlanmış mı? Açık blocker var mı? Kritik görev kalmış mı?
5. **Manuel kriter doğrulaması:** Proje yöneticisinin işaretlemesi gereken çek listesi.
6. **Eşzamanlı geçiş koruması:** Veritabanı tabanlı kilit ile iki PM'in aynı anda farklı fazlara geçirme girişiminin engellenmesi.
7. **Denetim günlüğü:** Geçişin tüm meta verisi loglanır (kaynak faz, hedef faz, döngü numarası, override kullanıldı mı).

Kriterler karşılanmadığında geçiş engellenir ve kullanıcıya hangi kriterlerin karşılanmadığı bildirilir; proje yöneticisinin gerekli düzeltmeleri yapması beklenir.

## 4.9. Güvenlik Mimarisi

**[ŞEKİL 4.4: JWT Kimlik Doğrulama Akış Diyagramı]**

```
   İstemci                 Sunucu                 Veritabanı
     │                        │                        │
     │── Giriş isteği ───────>│                        │
     │   (e-posta, şifre)     │                        │
     │                        │── Kullanıcı sorgula ──>│
     │                        │<── Kullanıcı satırı ───│
     │                        │── bcrypt doğrula ──┐   │
     │                        │<──────────────────┘    │
     │                        │── JWT imzala (HS256)   │
     │<── Erişim token'ı ─────│                        │
     │                        │                        │
     │── Yetkili istek ──────>│                        │
     │   (Bearer token)       │                        │
     │                        │── Token doğrula ──┐    │
     │                        │<─────────────────┘     │
     │                        │── RBAC izin kontrolü ─┐│
     │                        │<──────────────────────┘│
     │                        │── Veri sorgula ───────>│
     │                        │<── Sonuç ──────────────│
     │<── 200 OK + veri ──────│                        │
```

Güvenlik katmanı şu bileşenlerden oluşur:

- **Parola saklama:** bcrypt ile hashleme (uygun maliyet faktörü ile).
- **JWT:** HS256 ile imzalama, varsayılan 30 dk geçerlilik süresi.
- **CORS:** Yalnızca tanımlı kaynaklardan istek kabul edilir.
- **Hız sınırlama:** Giriş uç noktası başta olmak üzere kritik uç noktalarda saldırı korumalı sınırlama.
- **SQL injection koruması:** ORM tabanlı parametrik sorgular.
- **XSS koruması:** Frontend tarafında HTML sanitize işlemi.
- **Hesap kilitleme:** Tekrarlanan başarısız girişlerde geçici hesap kilidi.
- **Denetim günlüğü:** Her kritik işlem yapısal JSON formatında loglanır.

---

# 5. UYGULAMA (İMPLEMENTASYON)

## 5.1. Geliştirme Ortamı ve Araç Zinciri

Geliştirme süreci boyunca; **Visual Studio Code** ve **Cursor** IDE'leri, **Git** ve **GitHub** sürüm kontrolü, **Docker** konteyner platformu, **Postman** ve FastAPI'nin entegre Swagger UI arayüzü API testleri için kullanılmıştır. Tasarım ve prototipleme için **Figma**, akış/mimari diyagramlar için **Mermaid** ve **draw.io** araçlarından yararlanılmıştır. Geliştirme verimliliğini artırmak için yapay zekâ destekli kod yardımı veren **Claude Code** ve **GitHub Copilot** araçları, boilerplate üretimi, test taslağı ve refactor önerileri amacıyla kullanılmıştır.

## 5.2. Backend Geliştirme

**Tablo 5.1.** Backend teknoloji yığını.

| Kategori | Teknoloji | Kullanım |
|----------|-----------|----------|
| Programlama dili | Python 3.12 | Async/await, type hints |
| Web çatısı | FastAPI | Async REST API, OpenAPI üretimi |
| ORM | SQLAlchemy 2.0 (Async) | Asenkron veritabanı erişimi |
| Veritabanı | PostgreSQL 15 | Konteyner içinde çalışmaktadır |
| Doğrulama | Pydantic v2 | DTO ve yapılandırma |
| Güvenlik | python-jose, passlib (bcrypt) | JWT imzalama, parola hashleme |
| Hız sınırlama | slowapi | Uç nokta başına hız sınırı |
| E-posta | fastapi-mail | SMTP entegrasyonu |
| Zamanlayıcı | APScheduler | Tekrarlayan görev tetikleyici, bildirim temizleme |
| PDF üretimi | fpdf2 | Saf Python — sistem kütüphanesi gerekmez |
| Excel üretimi | openpyxl | Rapor dışa aktarımı |

Backend tarafında katman ayrımı sıkı tutulmuştur. Her use case yalnızca tek bir iş eylemini temsil eder (örneğin görev oluşturma, faz geçişi tetikleme, kullanıcı davet etme); bu, **Tek Sorumluluk Prensibi**'nin somut uygulamasıdır.

## 5.3. Frontend Geliştirme

**Tablo 5.2.** Frontend teknoloji yığını.

| Kategori | Teknoloji | Kullanım |
|----------|-----------|----------|
| Programlama dili | TypeScript | Strict mode ile tür güvenliği |
| Çatı | Next.js (App Router) | SSR/CSR hibrit, dosya-tabanlı yönlendirme |
| UI kütüphanesi | React | Modern komponent modeli |
| Stiller | TailwindCSS | Utility-first stil sistemi |
| Sunucu durumu | TanStack Query | Önbellek, geçersizleştirme, optimistik güncelleme |
| HTTP istemcisi | axios | Interceptor ile JWT enjekte etme |
| İkonlar | lucide-react | Modern ikon kütüphanesi |
| Grafikler | recharts | Burndown, CFD, Lead/Cycle, vb. |
| Sürükle-bırak | dnd-kit | Kanban tahtası, backlog paneli |
| Yaşam döngüsü editörü | React Flow | Görsel node/edge editörü |
| Tablo bileşeni | TanStack Table | Liste görünümleri |
| Zengin metin | TipTap | Yorum ve açıklama editörü |
| XSS koruması | DOMPurify | HTML sanitize işlemi |

Frontend, projeyi yeni mimariye taşımak için sıfırdan inşa edilmiştir. Tüm sayfalar, ortak bir bileşen kütüphanesinin üzerine kurulmuş; bu kütüphane Avatar, Badge, Button, Card, ProgressBar, AlertBanner, Tabs ve benzeri temel bileşenleri tek bir token sistemi ile sunmaktadır. Bu sayede UI'da görsel tutarlılık sağlanmış ve yeni sayfa eklemek hızlı bir hâle gelmiştir.

## 5.4. Modül İmplementasyonları

### 5.4.1. Kullanıcı ve Yetkilendirme

Kayıt akışı, açık kayıt (self-registration) yerine **admin tarafından başlatılan davet akışı** ile çalışmaktadır. Admin yeni bir kullanıcıyı e-posta adresi ve rolüyle birlikte davet eder; sistem pasif durumda bir hesap oluşturur ve kullanıcıya geçerlilik süresi olan bir aktivasyon bağlantısı e-postayla iletilir. Kullanıcı bu bağlantı ile şifresini belirleyerek hesabını aktif eder.

Giriş işlemi JWT tabanlıdır. Parolalar bcrypt ile hashlenir; veritabanına asla cleartext olarak yazılmaz. RBAC altyapısı, izin matrisinin yönetimini admin paneline taşıyarak Admin'in özel rol oluşturmasına ve mevcut rollerin izinlerini matris hücreleri üzerinden düzenlemesine olanak tanır. Tekrarlanan başarısız giriş denemelerinde hesap geçici olarak kilitlenir.

### 5.4.2. Proje ve Görev Yönetimi

Bir proje; metodoloji bilgisi, durum (Aktif / Tamamlandı / Beklemede / Arşivlenmiş) ve yaşam döngüsü tanımı taşır. Görev varlığı; alt görev, görev bağımlılığı, tekrarlayan görev (haftalık, aylık vb.) ve faz referansı gibi özellikleri destekler.

**Backlog Paneli:** Proje detay sayfasının yan kenarında, sürükle-bırak ile görev taşımayı destekleyen bir paneldir. Backlog'dan bir Sprint'e veya Sprint'ten Backlog'a taşıma mümkündür.

**Tahta (Board) Görünümü:** Kanban tarzı sürükle-bırak. WIP limiti ihlal edildiğinde sütun arka planı renk değiştirir, uyarı banner'ı görünür ve taşıma engellenir. Görev/sorun takibi disiplini için her görev kartı; sorumluyu, önceliği ve mevcut durumu görsel olarak gösterir — bu yaklaşım, etkili sorun takibi konusundaki literatür önerileriyle [2] uyumludur.

**[ŞEKİL 5.4: Görev Tahta Görünümü (Kanban Board) — WIP Limit İhlali]**

### 5.4.3. Bildirim ve Mesajlaşma

Bildirim sistemi üç katmanlıdır:

- **Uygulama içi:** Üst menüde bildirim çanı, kategorize edilmiş liste, polling tabanlı güncelleme.
- **E-posta:** SMTP üzerinden gönderim; soyut bir bildirim servisi arayüzü ile soyutlanmıştır.
- **İzleyici (watcher) mekanizması:** Kullanıcı, izlemek istediği görevleri/projeleri seçebilir ve güncellemelerinde bildirim alır.

Kullanıcı, bildirim tercihlerini bildirim türüne göre yönetebilir.

### 5.4.4. Raporlama ve Analitik

Sistem iki ana rapor kategorisi sunmaktadır:

- **Klasik raporlar:** Burndown, Gantt, Velocity, görev dağılımı.
- **Gelişmiş raporlar:**
  - **Kümülatif Akış Diyagramı (CFD):** Kanban projelerde Burndown yerine; 7, 30 veya 90 gün filtresiyle SVG yığılmış alan grafiği.
  - **Lead / Cycle Time:** Histogram + P50, P85 ve P95 yüzdelikleri.
  - **İterasyon Karşılaştırma:** Scrum/İteratif projeler için sprint'leri yan yana koyan grupli sütun grafiği; planlanan, tamamlanan ve sonraki sprint'e taşınan görev metrikleri.

Tüm raporlar PDF ve Excel formatında dışa aktarılabilir.

**[ŞEKİL 5.7: Kümülatif Akış Diyagramı (CFD) ve Lead/Cycle Time görselleri]**

### 5.4.5. Süreç Modeli Yönetimi

Bu modül, projenin metodoloji-bağımsız çalışmasının kalbidir. Üç ana alt yetenek sunar:

1. **Metodoloji seçimi:** Proje oluşturma sihirbazının ikinci adımında kullanıcı dört temel metodolojiden birini seçer.
2. **Metodolojiye duyarlı kurallar:** Sprint zorunluluğu, WIP limit denetimi, görev bağımlılığı gibi davranışlar projenin metodoloji bilgisine göre uygulanır. Bu denetimler tek bir merkezi kural kümesinden okunur; hem backend hem frontend aynı kuralları paylaşır.
3. **Süreç şablonları:** Sık kullanılan yapılandırmalar şablon olarak kaydedilip yeni projelerde uygulanabilir.

## 5.5. Yaşam Döngüsü (Lifecycle) Modülü — Yeni Özellik

v2.0 ile gelen en kapsamlı yenilik **Yaşam Döngüsü (Lifecycle) sekmesidir**. Proje detay sayfasının sekiz sekmesinden biri olan bu sekme aşağıdaki bölümleri barındırır:

- **Özet şeridi (Summary Strip):** Aktif faz, ilerleme yüzdesi, açık görev sayısı, sıradaki kilometre taşı ve workflow modu görsel olarak özetlenir. "Sonraki Faza Geç" ve "Düzenle" eylem butonları bu şeride yerleştirilmiştir.
- **Phase Gate paneli:** Faza geçiş yapma butonu, mevcut fazın tamamlanma durumu, otomatik ve manuel kriter kontrolleri, açık görev aksiyonları ve not alanı bu panelde sunulur.
- **Salt-okunur tuval:** Aktif fazın görsel olarak ışıklandırıldığı görsel akış. Aynı faz birden çok kez kapatılmışsa node üzerinde döngü sayısı rozet olarak gösterilir.
- **Alt sekmeler:** Genel Bakış, Kilometre Taşları, Geçmiş, Çıktılar ve Sprintler alt sekmeleri detay görünümlerini barındırır.

**[ŞEKİL 5.1: Proje Yaşam Döngüsü Yönetim Ekranı (Lifecycle Tab)]**

### 5.5.1. Kilometre Taşı (Milestone) Yönetimi

Kilometre taşları; isim, hedef tarih, durum (planlı / devam ediyor / gecikmeli / tamamlandı), ilerleme yüzdesi ve açıklama alanları taşır. Bir proje birden çok kilometre taşına sahip olabilir. Zaman çizelgesi (Timeline) görünümünde her kilometre taşı bir dikey bayrak çizgisi olarak render edilir.

### 5.5.2. Çıktı (Artifact) Yönetimi

Çıktılar (artifact'lar), metodolojiye özgü standart belgelerin izlenmesini sağlar. Bir proje oluşturulduğunda, seçilen metodolojiye göre varsayılan çıktılar otomatik olarak hazırlanır. Örneğin Waterfall projelerinde SRS, SDD ve Test Planı; Scrum projelerinde Sprint Backlog ve Sprint Review Notları gibi belgeler kullanıcıya hazır olarak gelir. Her bir çıktıya sorumlu kişi atanabilir, dosya eklenebilir ve durumu (Taslak / Hazır / Onaylı) takip edilebilir.

### 5.5.3. Faz Raporu (Phase Report)

Her tamamlanmış faz için yapılandırılmış bir rapor hazırlanabilir; rapor metrikler, sorunlar, dersler ve önerileri içerir. PDF olarak indirilebilir. Yaşam Döngüsü sekmesindeki Geçmiş alt sekmesinde, her kapatılmış faz kartında "Rapor" butonu mevcuttur.

## 5.6. Workflow Editor (Görsel Süreç Modeli Tasarımcısı) — Yeni Özellik

**[ŞEKİL 5.2: Workflow Editor — Görsel Süreç Modeli Tasarımcısı]**

Workflow Editor, React Flow tabanlı, sürükle-bırak ile faz (node) ve geçiş (edge) tanımlamayı sağlayan görsel bir editördür. Editör aşağıdaki yetenekleri sunar:

- **Faz tipleri:** Normal faz, başlangıç fazı, son faz, arşivlenmiş faz.
- **Geçiş tipleri:** Normal akış, doğrulama akışı ve geri besleme akışı. Her tipin görsel olarak farklı çizgi deseni ve rengi vardır.
- **Geçiş varyantları:** Sıralı-esnek modda tanımlı çift yönlü geçişler; tüm fazlardan tek bir hedefe taşıyan "All" tipi kapı.
- **Faz gruplama (Swimlane):** Birden fazla fazı kapsayan görsel grup çerçevesi; çoklu seçim ve gruplama eylemleri ile.
- **9 hazır şablon:** Aşağıda Tablo 5.3'te listelenen şablonlar tek tıkla projeye uygulanabilir.
- **Doğrulama:** Editör, kullanıcı kaydetmeden önce şemayı (başlangıç fazı var mı, son faz var mı, izole faz var mı, geçersiz döngü var mı, geçerli id formatı var mı) kontrol eder. Kaydedilmemiş değişiklikler varken sayfa değiştirilmeye çalışılırsa uyarı diyaloğu çıkar.

**Tablo 5.3.** Yaşam Döngüsü Şablonları (9 Preset).

| # | Şablon | Akış Modu | Faz Sayısı | Özellik |
|---|--------|-----------|-----------|---------|
| 1 | Scrum | Esnek | 5 | Başlatma → Planlama → Yürütme ⇄ İzleme → Kapanış (Retrospektif feedback) |
| 2 | Waterfall | Sıralı-kilitli | 6 | Gereksinim → Tasarım → Uygulama → Test → Yayın → Bakım |
| 3 | Kanban | Sürekli | 1 | Tek sürekli akış; Phase Gate uygulanmaz |
| 4 | Iterative | Esnek | 4 | Döngüsel iterasyon |
| 5 | V-Model | Esnek | 7 | Doğrulama akışlarıyla iki kollu yapı |
| 6 | Spiral | Esnek | 4 | Risk-temelli, geri besleme akışı |
| 7 | Incremental | Esnek | 5 | Artırımlı teslim + geri besleme döngüsü |
| 8 | Evolutionary | Esnek | 5 | Prototip evrimi |
| 9 | RAD | Esnek | 5 | Rapid Application Development — paralel iş paketleri |

### 5.6.1. Aktif Faz Hesaplama (BFS Graph Traversal)

Aktif faz, sabit indeks yerine **BFS (Breadth-First Search / Genişlik Öncelikli Arama)** algoritması ile hesaplanır. Her fazın durumu (aktif / geçmiş / gelecek / erişilemez) çalışma zamanında hesaplanır. Bu sayede paralel akışlar mümkündür; aynı anda birden çok faz "aktif" durumda olabilir. Görsel olarak aktif fazlar bir vurgu çerçevesi ile gösterilir.

### 5.6.2. Döngü Sayacı

Aynı fazın birden çok kez kapanması durumunda (örneğin Sprint Review'dan sonra tekrar Yürütme'ye dönüş), faz üzerinde bir döngü sayısı rozeti belirir. Bu rozet, kullanıcıya o fazın kaç kez kapatıldığını ve tekrar açıldığını görsel olarak iletmektedir.

## 5.7. "AI ile Öner" — Yapay Zekâ Tabanlı Workflow Önerisi

**[ŞEKİL 5.8: "AI ile Öner" Butonu ve Öneri Önizlemesi]**

Workflow Editor'ün alt araç çubuğunda; faz ekleme, bağlantı kurma, gruplama ve sınıflandırma butonlarının yanında **"✦ AI ile Öner"** seçeneği yer almaktadır. Bu özellik, kullanıcının proje türünü ve temel gereksinimlerini (ekip büyüklüğü, teslim süresi, risk profili, hedef metodoloji) doğal dilde tanımlamasının ardından, sisteme uygun bir süreç akışı önermek üzere tasarlanmıştır.

Özelliğin çalışma biçimi şu şekildedir: Kullanıcı kısa bir form üzerinden projesini tanımlar; sistem bu girdiyi büyük dil modeline (LLM) iletir; modelden dönen şema editörde önizleme olarak gösterilir. Kullanıcı önizlemeyi inceleyip uygulamayı tercih edebilir ya da reddedip kendi şemasını oluşturmaya devam edebilir.

Bu özellik, literatürdeki yapay zekâ tabanlı proje yönetim eğilimine [3][16] doğrudan yanıt vermektedir. Gartner'ın 2030 yılına kadar proje yönetim görevlerinin %80'inin yapay zekâ tarafından yürütüleceği öngörüsü [3], bu yöndeki stratejik konumu güçlendirmektedir. Özelliğin uçtan uca son entegrasyonu raporun hazırlandığı dönemde tamamlanma aşamasındadır; arayüz tarafı kullanıcıya görünür durumdadır ve sistemin yapay zekâ destekli mimari yaklaşımının somut bir göstergesidir. Kullanıcı, önerilen şemayı her zaman manuel olarak değiştirebileceği için sistem yapay zekâ önerisini bir tavsiye olarak sunar, asla otomatik uygulamaz.

## 5.8. Admin Paneli ve RBAC

**[ŞEKİL 5.9: Admin Paneli ve İzin Matrisi (RBAC)]**

Admin paneli üç sekmeden oluşur: **Kullanıcılar, Roller ve İzin Matrisi**. Yönetici bu panelden kullanıcıları davet edebilir, rollerini değiştirebilir, hesaplarını devre dışı bırakabilir veya toplu davet gönderebilir. Roller sekmesinde özel roller oluşturulabilir; ikon ve renk seçimi ile özelleştirilebilir. İzin Matrisi sekmesi, her rol için her iznin ayrı ayrı yetkilendirilebildiği bir hücre tablosudur; her hücre değişikliği otomatik kaydedilir ve denetim günlüğüne işlenir. Sistem rolleri (PM, Member, Admin, Guest) korunmuştur; bu roller silinemez ve isim değişikliği yapılamaz. Yönetici kendi rolünü değiştiremez (self-edit prevention).

## 5.9. Aktivite Akışı ve Denetim Günlüğü

Sistem, gerçek zamanlı WebSocket kanalı yerine **polling tabanlı bir aktivite akışı** ile çalışmaktadır. Her proje detay sayfasında bir aktivite sekmesi bulunur; bu sekme; görev oluşturma, durum değişikliği, yorum, faz geçişi, kilometre taşı tamamlanması gibi olayları kronolojik olarak listeler. Filtreleme ve sayfalama desteklenir.

WebSocket tabanlı gerçek zamanlı bildirim, mimari olarak soyut bir bildirim servisi arayüzü üzerinden gerçeklenebilir biçimde tasarlanmıştır; bu sayede gelecek sürümlerde altyapıyı değiştirmeden yalnızca yeni bir adaptör yazılarak gerçek zamanlı bildirim eklenebilir.

## 5.10. Kullanıcı Arayüzü Ekranları

Bu bölümdeki şekiller, sistemin ana kullanım akışlarını görselleştirmektedir.

**[ŞEKİL 5.5: Gantt ve Takvim Görünümleri]**

**[ŞEKİL 5.6: Sprint Yönetimi ve Burndown Grafiği]**

**[ŞEKİL 5.3: Phase Gate Kriter Değerlendirme Ekranı]**

---

# 6. TEST VE DOĞRULAMA

## 6.1. Test Stratejisi

SPMS'nin test stratejisi üç katmanlıdır: **birim testleri (unit tests)**, **entegrasyon testleri (integration tests)** ve **manuel / uçtan uca (E2E) senaryolar**. Birim testleri domain katmanı entity doğrulamalarını, use case mantığını ve servis fonksiyonlarını kapsar; bağımlılıklar mock ile izole edilmiştir. Entegrasyon testleri API uç noktası davranışlarını, veritabanı işlemlerini ve yetki kontrollerini gerçek bir PostgreSQL veritabanı üzerinde doğrular. Uçtan uca testler ise tarayıcı bazlı kullanıcı arayüzü akışlarını doğrulamak amacıyla gerçekleştirilmiştir.

Her test oturumu başında bir tohum (seeder) çalıştırılarak roller ve örnek süreç şablonları oluşturulur. Testler arası bağımlılığı engellemek amacıyla her entegrasyon testi işlem sonrası veritabanı geri alımı (rollback) uygular. Bu sayede tablo truncate işlemine ihtiyaç duyulmadan tam test izolasyonu sağlanmaktadır.

## 6.2. Test Ortamı

Geliştirme ve test işlemleri macOS işletim sistemi ve Apple Silicon donanımı üzerinde gerçekleştirilmiştir. Tarayıcı testleri Google Chrome ve Safari ile yürütülmüştür. Backend tarafında Python 3.12, FastAPI ve SQLAlchemy 2.x (async) kullanılmış; veritabanı olarak Docker üzerinde PostgreSQL 15 çalıştırılmıştır. Frontend tarafında Node.js ve Next.js çalıştırma ortamı kurulmuştur. Backend birim ve entegrasyon testleri için pytest ve pytest-asyncio; FastAPI uç noktalarına async HTTP istekleri için httpx kütüphanesi; test verisi üretimi için ise fabrika sınıfları kullanılmıştır. PDF içerik doğrulaması fpdf2 kütüphanesi ile gerçekleştirilmiştir.

## 6.3. Test Senaryoları ve Kapsam

Test sürecinde **25 ana test senaryosu** tasarlanmış ve toplam **134 test case** yürütülmüştür. Senaryolar; kimlik doğrulama, proje yönetimi, görev yönetimi, Scrum/Sprint, Kanban/WIP, ekip yönetimi, yorumlar ve ekler, bildirimler, raporlama, faz yönetimi, admin paneli ve RBAC alanlarını kapsamaktadır. Test senaryolarının özet sonuçları aşağıda sunulmuştur.

**Tablo 6.1.** Test senaryoları özet tablosu (Kaynak: STD dokümanı).

| # | Senaryo | Test Case | Geçen | Kalan | Geçme Oranı |
|---|---------|-----------|-------|-------|-------------|
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

## 6.4. Tespit Edilen ve Düzeltilen Sorunlar

Test sürecinde toplam **7 sorun** tespit edilmiş ve tamamı aynı test döngüsü içinde giderilmiştir. Düzeltmelerin örnek başlıkları:

- Kayıt formunda şifre tekrarı doğrulamasının istemci tarafında eksik kalması (form doğrulamasına şifre eşleşme kontrolü eklendi).
- JWT süresi dolduğunda kullanıcının ağ hatası ekranında kalması (interceptor ile yerel depolama temizliği ve giriş sayfasına yönlendirme eklendi).
- Avatar yüklemede dosya boyutu kontrolünün eksik olması (boyut sınırı ve uygun HTTP hata kodu eklendi).
- Eski format yaşam döngüsü yapılandırması taşıyan projelerin açılmaması (geriye dönük uyumlu normalleştirme fonksiyonu eklendi).
- Kanban WIP limit ihlalinde frontend göstergesinin görünmemesi (toast bildirimi ve optimistik güncelleme geri alımı eklendi).
- Tekrarlayan deadline bildirimlerinde idempotency eksikliği (günlük idempotency kontrolü eklendi).
- Admin özet PDF indirme URL'sinde ortam değişkeni öneki eksikliği (yapılandırma düzeltildi).

## 6.5. Güvenlik Doğrulaması

Güvenlik doğrulamaları, OWASP Top 10 başlıkları çerçevesinde manuel olarak gerçekleştirilmiştir: SQL injection (ORM ile parametrik sorgular ile mitige edilmiştir), XSS (DOMPurify ile sanitize), CSRF (REST + JWT mimarisi ile cookie tabanlı oturum bulunmaması), bozuk kimlik doğrulama (hesap kilitleme, hız sınırlama, JWT süresi, bcrypt), güvensiz varsayılan yapılandırma (başlangıçta tespit edilir ve uygulama çalışmaz), ve hassas veri ifşası (HTTPS hedefi). Yetki bypass testleri RBAC senaryosu altında gerçekleştirilmiş ve token'sız erişimin engellendiği, yetersiz izinli erişimin reddedildiği doğrulanmıştır.

## 6.6. Genel Değerlendirme

134 test case'in tamamı başarıyla geçmiş; toplam 7 sorun tespit edilip aynı süreçte düzeltilmiştir. Sistemin temel kullanım akışları (kayıt → giriş → proje oluşturma → görev yönetimi → raporlama → faz geçişi), beklenen davranışları üretmiş ve gereksinim spesifikasyonu ile uyumlu çalışmıştır. Test sonuçları, sistemin gereksinim spesifikasyonu (SRS) ile uyumlu, güvenilir ve genişletilebilir bir mimariye sahip olduğunu doğrulamaktadır.

---

# 7. PROJE YÖNETİMİ VE SÜREÇ DEĞERLENDİRMESİ

## 7.1. Geliştirme Yaklaşımı

Proje süresince Scrum benzeri çevik bir yaklaşım benimsenmiş; iki dönemden oluşan toplam süre, küçük teslim halkalarına bölünmüştür. Her teslim halkasında belirli bir özellik veya modül üzerine yoğunlaşılmış; sonunda çalışan ve test edilmiş bir artırım üretilmiştir. Bu yaklaşım, hem akademik danışman geri bildirimini düzenli olarak alabilmemize hem de teknik kararlarda esnek kalmamıza olanak tanımıştır.

Geliştirme süreci iki ana sürüm altında planlanmıştır:

- **v1.0 (MVP — Minimum Viable Product):** Temel kullanıcı/yetkilendirme, proje ve görev yönetimi, bildirim, raporlama ve süreç modeli seçimi modüllerinin teslim edildiği aşama. Bu aşama, sistemin kullanılabilir ve gösterilebilir bir hâle gelmesini sağlamıştır.
- **v2.0 (İleri Sürüm):** Frontend mimarisinin sıfırdan yeniden inşa edilmesi, backend'in milestone/artifact/faz raporu gibi yeni varlıklarla genişletilmesi, Yaşam Döngüsü modülü ve görsel Workflow Editor'ün eklenmesi, gelişmiş raporların (CFD, Lead/Cycle, İterasyon Karşılaştırma) entegre edilmesi, admin panelinin tamamlanması ve RBAC altyapısının matris düzeyinde yeniden tasarlanması.

## 7.2. Yapılan Çalışmalar

Proje boyunca yapılan başlıca çalışmalar şu şekilde özetlenebilir:

- **Temel ve güvenlik:** Mimari kararların alınması, klasör yapısının kurulması, kimlik doğrulama, parola hash mekanizması, JWT, hız sınırlama, denetim günlüğü altyapısı.
- **Kimlik ve ekip yönetimi:** Davet tabanlı kayıt akışı, profil yönetimi, ekip yönetimi, şifre sıfırlama.
- **Proje ve görev modülü:** Proje CRUD, durum yönetimi, görev CRUD, alt görevler, görev bağımlılıkları, tekrarlayan görevler, etiketler, sprint yönetimi.
- **Görünüm katmanı:** Tahta (Board), Liste, Takvim, Zaman Çizelgesi (Gantt), Backlog Paneli, Görev Detay sayfası.
- **Bildirim sistemi:** Uygulama içi bildirim, e-posta gönderimi, izleyici mekanizması, kullanıcı tercih ayarları.
- **Raporlama:** Burndown, Velocity, ardından CFD, Lead/Cycle Time histogram ve İterasyon Karşılaştırma grafiklerinin eklenmesi; PDF/Excel dışa aktarımı.
- **Süreç modeli ve entegrasyonlar:** Metodoloji seçimi, süreç şablonları, harici sistem entegrasyonu için adaptör katmanı.
- **Yaşam Döngüsü modülü:** Görsel workflow editörü, Phase Gate kapısı, kilometre taşı (milestone), çıktı (artifact) ve faz raporu varlıklarının teslim edilmesi.
- **Görsel ve aktivite katmanları:** Aktivite akışı, kullanıcı profili sayfası, gelişmiş arama otomatik tamamlama, kullanıcı özet sayfaları.
- **Admin paneli:** Kullanıcı yönetimi, toplu davet, denetim günlüğü görüntüleme, sistem istatistikleri.
- **RBAC yeniden tasarımı:** Özel rol oluşturma, izin matrisi yönetimi, sistem rollerinin korunması, self-edit önleme.
- **Yapay zekâ destekli özellik:** Workflow editörüne entegre edilen "AI ile Öner" yardımcı özelliği.

**[ŞEKİL 7.1: Geliştirme Süreci Zaman Çizelgesi]**

## 7.3. Görev Dağılımı ve İşbölümü

**Tablo 7.1.** Görev dağılımı ve işbölümü.

| Sorumluluk Alanı | Ayşe ÖZ | Yusuf Emre BAYRAKCI |
|------------------|---------|---------------------|
| Backend mimari ve domain modelleme | Birincil | Destek |
| Use case ve API geliştirme | Birincil | Destek |
| Veritabanı şeması ve migration | Birincil | İnceleme |
| Frontend prototip → komponent dönüşümü | Destek | Birincil |
| Yaşam döngüsü ve workflow editör | Ortak | Ortak |
| Raporlama ve grafikler | Destek | Birincil |
| Test yazımı ve manuel UAT | Ortak | Ortak |
| Dokümantasyon (SRS, SDD, STD) | Birincil | Destek |
| Sunum ve poster | Ortak | Ortak |

İşbölümü esnek tutulmuş; karmaşık bölümlerde eşli programlama (pair programming) yöntemi tercih edilmiştir.

## 7.4. Karşılaşılan Zorluklar ve Çözümler

**Zorluk 1 — Clean Architecture disiplini.** Geliştirme akışı sırasında bazı use case'lere yanlışlıkla altyapı bağımlılıkları sızabiliyordu. **Çözüm:** Her PR'da Application ve Domain katmanlarının altyapı kütüphaneleri içe aktarmadığı manuel olarak doğrulandı; kod inceleme prosedürünün bir maddesi haline getirildi.

**Zorluk 2 — Workflow doğrulama.** Kullanıcı sürükle-bırak ile geçersiz workflow oluşturabilirdi (örneğin son faza giden bir geçişin bulunmaması). **Çözüm:** Editör tarafında kullanıcıya görsel uyarılar ve sunucu tarafında son katman olarak yapısal doğrulama uygulanmaktadır.

**Zorluk 3 — Eşzamanlı faz geçişi.** İki proje yöneticisi aynı anda farklı fazlara geçiş yapmaya çalıştığında veri bütünlüğü riski oluşur. **Çözüm:** Veritabanı düzeyinde danışsal kilit (advisory lock) ile geçiş işlemleri sıralı olarak yürütülmektedir.

**Zorluk 4 — UI kalite/hız dengesi.** Yeni komponentlerin tasarım sistemine uyumu zaman almaktaydı. **Çözüm:** Ortak primitif bileşen kütüphanesi öne çekildi; sonraki tüm sayfalar bu primitiflerin üzerine inşa edilerek tasarım tutarlılığı sağlandı.

**Zorluk 5 — Geriye dönük şema uyumu.** Eski projelerin yeni şemaya uyarlanması gerekiyordu. **Çözüm:** Eski format yapılandırmalar için bir normalleştirme katmanı eklendi; sürüm numarası ile şema göçleri tanımlandı.

## 7.5. Risk Yönetimi

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Frontend yenileme süre aşımı | Orta | Yüksek | Küçük teslim halkalarına bölündü; her birinin bağımsız teslim edilebilir olması sağlandı |
| Veritabanı şema göçü başarısız | Düşük | Yüksek | Migration'lar idempotent yazıldı; ayrı bir staging ortamında ön doğrulama yapıldı |
| JWT yerel depolama XSS riski | Orta | Orta | HTML sanitize ile XSS engellendi; HttpOnly cookie geçişi gelecek sürüme alındı |
| Gerçek zamanlı bildirim eksikliği | Düşük | Düşük | Polling tabanlı çözüm sunuldu; WebSocket altyapısı arayüz seviyesinde hazır tutuldu |
| AI öner entegrasyonunun gecikmesi | Düşük | Düşük | Arayüz tarafı hazır; LLM bağlantısı tamamlanma aşamasında — kullanıcı için görünür ve test edilebilir durumda |

---

# 8. GERÇEKÇİ KISITLAR

Bu bölüm, bölümümüzün talebi gereği projenin yalnızca teknik değil; ekonomik, çevresel, etik, toplumsal ve güvenlik boyutlarıyla da değerlendirildiği zorunlu bir başlıktır. Aşağıdaki alt başlıkların tamamı sırasıyla cevaplanmıştır.

## 8.1. Projenin Tasarım Boyutu

### 8.1.1. Projenin Niteliği

SPMS, **yeni bir bitirme projesi** olarak başlatılmıştır. Var olan bir projenin tekrarı ya da daha büyük bir projenin bir parçası değildir. Bununla birlikte:

- **Literatürdeki mevcut çözümlere bir alternatif** olarak konumlandırılmıştır (Jira [5], Trello [17], Asana [4], OpenProject [12], Microsoft Project [11]).
- **Açık kaynak felsefe** ile inşa edilmiş; gelecekte topluluk katkısına açık biçimde sürdürülebilir.
- **Modüler mimari** sayesinde yeni metodoloji eklenmesi, yeni rapor türü eklenmesi veya yeni entegrasyon bağlanması, mevcut çekirdeği değiştirmeden mümkün kılınmıştır. Bu açıdan SPMS, **kendisinden büyük bir ekosistemin başlangıç noktası** olarak da görülebilir.

### 8.1.2. Mühendislik Problemi ve Geliştirilen Çözüm

**Mühendislik problemi:** Yazılım ekipleri, projelerini Scrum, Kanban veya Waterfall paradigmalarından biriyle yönetmek istediklerinde, ya pahalı ve ekosistem-bağımlı bir ticari aracı (Jira, Microsoft Project) seçmek, ya dar kapsamlı ve büyümeyen bir aracı (Trello) kullanmak ya da maliyetsiz ama kullanım zorluğu yüksek bir açık kaynak çözümü (OpenProject) tercih etmek zorunda kalmaktadır. Bu üç-yönlü kısıtlama, özellikle KOBİ ölçekli ekipler için ekonomik ve operasyonel sürtünme yaratmaktadır [10][13].

**Geliştirilen çözüm:** SPMS, dört metodolojiyi (Scrum, Kanban, Waterfall, İteratif/Artırımlı) **tek bir uygulamada** destekleyen, açık kaynak ve modern web teknolojileriyle inşa edilmiş bir platformdur. Kullanıcı projeyi oluştururken metodolojiyi seçer; sistem ilgili sürece özgü kurallarını otomatik uygular. Görsel **Workflow Editor**, kullanıcıların kendi süreç akışlarını sürükle-bırak ile tanımlamasına olanak tanır; **Phase Gate** mekanizması faz geçişlerinde otomatik kriter kontrolü ile kalite kapısı görevi görür. Açık kaynak yaklaşımı sayesinde lisans maliyeti olmadan, yazılım ekiplerinin metodolojiye değil işlerine odaklanmasını sağlar.

## 8.2. Lisans Eğitiminden Edinilen Bilgi ve Beceriler

Bu projede edindiğimiz lisans bilgilerinin neredeyse tamamı doğrudan veya dolaylı olarak kullanılmıştır. Bilgi transferi aşağıdaki tabloda özetlenmiştir.

**Tablo 8.1.** Ders – Proje Bilgi Transferi.

| Ders | Edinilen Bilgi/Beceri | Projede Kullanım |
|------|------------------------|---------------------|
| **Yazılım Mühendisliği** | Yazılım yaşam döngüsü, gereksinim mühendisliği, SRS/SDD hazırlama | SRS ve SDD dokümanlarımız bu dersin formatıyla yazıldı; ilgili standartlara uyumlu hale getirildi |
| **Yazılım Tasarımı ve Mimarisi** | SOLID, tasarım desenleri, Clean Architecture | Tüm backend mimarisi bu temele oturtuldu; katmanlar arası bağımlılık disiplini |
| **Veri Yapıları ve Algoritmalar** | Graph traversal (BFS), state machine, karma tablo | Workflow'daki aktif faz hesaplama için BFS; görev durumu state machine |
| **Veritabanı Yönetim Sistemleri** | İlişkisel modelleme, normalleştirme, ER diyagram, indeksleme, transaction yönetimi | Veri şemamız; danışsal kilit; foreign key kısıtları; her teslim halkasında göç |
| **Nesneye Yönelik Programlama** | OOP, kalıtım, polimorfizm, soyut sınıflar | Domain katmanı entity'leri; soyut depo arayüzleri |
| **Web Programlama** | HTTP, REST, JSON, MVC, frontend-backend ayrımı | REST API; SPA mimarisi; sunucu durumu önbellekleme |
| **İnsan-Bilgisayar Etkileşimi (HCI)** | Kullanıcı merkezli tasarım, Nielsen sezgileri, erişilebilirlik | Bileşen kütüphanesi; WCAG hedefi; klavye navigasyonu |
| **Yazılım Test Mühendisliği** | Birim, entegrasyon, sistem testleri; black-box/white-box | Birim ve entegrasyon testleri; uçtan uca senaryolar |
| **İşletim Sistemleri** | Eşzamanlılık, race condition, kilit mekanizmaları | Veritabanı kilitleri; hız sınırlama; asenkron işleme |
| **Bilgisayar Ağları** | TCP/IP, HTTP/HTTPS, TLS, OSI | İstemci-sunucu mimarisi; CORS; HTTPS hedefi |
| **Algoritma Analizi** | Karmaşıklık analizi, optimizasyon | API yanıt süresi optimizasyonu; eager loading; indeks tasarımı |
| **Proje Yönetimi (zorunlu/seçmeli)** | PMBOK, Çevik/Scrum, risk yönetimi | Sistemin işlevsel kapsamı doğrudan bu dersten beslendi [14] |
| **Yazılım Mühendisliği Etiği** | Etik karar, sosyal sorumluluk, KVKK/GDPR | Veri minimizasyonu; denetim günlüğü şeffaflığı; AI kullanımının açıklanması |

## 8.3. Kullanılan Modern Araçlar, Yazılımlar ve Teknolojiler

Projede kullanılan modern araç ve teknolojiler, amaçlarıyla birlikte aşağıda tablo halinde verilmiştir.

**Tablo 8.2.** Kullanılan araç – amaç eşleştirmesi.

| Kategori | Araç / Teknoloji | Kullanım Amacı |
|----------|------------------|----------------|
| Programlama dili (Backend) | Python 3.12 | Domain, application ve infrastructure kodu |
| Programlama dili (Frontend) | TypeScript | Tüm React komponentleri, hooks, servisler |
| Backend çatı | FastAPI | Async REST API, OpenAPI üretimi, DI |
| ORM | SQLAlchemy 2.0 (Async) | Asenkron veritabanı erişimi |
| Frontend çatı | Next.js (App Router) | SSR/CSR hibrit; dosya-tabanlı yönlendirme |
| UI kütüphanesi | React + TailwindCSS | Komponent bazlı UI; utility-first stil |
| Sunucu durumu | TanStack Query | Önbellek, geçersizleştirme, optimistik güncelleme |
| Veritabanı | PostgreSQL 15 (Docker) | İlişkisel veri saklama, danışsal kilit, denetim günlüğü |
| Yaşam döngüsü editörü | React Flow | Sürükle-bırak node/edge editörü |
| Sürükle-bırak | dnd-kit | Kanban tahtası, backlog panel |
| Grafikler | recharts | Burndown, CFD, Lead/Cycle Time vb. |
| JWT | python-jose | HS256 ile imzalama/doğrulama |
| Parola hash | passlib (bcrypt) | Güvenli parola saklama |
| Şema göçü | Alembic | Sürümleme |
| PDF üretimi | fpdf2 | Faz raporları, dışa aktarımlar |
| Excel üretimi | openpyxl | Veri dışa aktarımı |
| E-posta | fastapi-mail | SMTP entegrasyonu |
| Zamanlayıcı | APScheduler | Tekrarlayan görev tetikleyici |
| Hız sınırlama | slowapi | Uç nokta hız sınırı |
| XSS koruma | DOMPurify | HTML sanitize |
| Konteyner | Docker | Veritabanını izole konteyner |
| Test (Backend) | pytest, pytest-asyncio, httpx | Birim + entegrasyon |
| Test (Frontend) | Vitest, Testing Library, Playwright | Komponent + uçtan uca |
| IDE | VS Code, Cursor | Geliştirme |
| Sürüm kontrol | Git, GitHub | Versiyonlama, kod inceleme |
| AI destekli kod | Claude Code, GitHub Copilot | Boilerplate üretimi, test taslakları, refactor önerileri |
| Tasarım | Figma, Mermaid, draw.io | Prototip ve diyagram |

## 8.4. Ek Yetkinlikler, Sertifikalar ve Disiplinler Arası Eğitimler

Proje süresince ekibimiz, dersin gerektirdiğinin ötesinde gelişim alanlarını araştırmış ve aşağıdaki kaynaklardan yararlanmıştır:

- **Coursera — Yazılım Mimarisi konulu kurslar:** SOLID, Clean Architecture ve mimari karar kayıtları konusunda kavramsal pekiştirme sağlamıştır.
- **Coursera — Project Management Principles and Practices:** PMBOK bilgi alanlarının somut uygulamalarını içerir; gereksinim ve risk yönetimi modüllerinin proje yönetim sürecimize aktarımı yapılmıştır.
- **Udemy — FastAPI üzerine eğitimler:** Async FastAPI mimarisi, bağımlılık enjeksiyonu paterni ve test stratejisi.
- **Udemy — Next.js & React üzerine eğitimler:** App Router, server components ve client components ayrımı.
- **Scrum.org dokümantasyonları:** Scrum çerçevesi resmî kılavuzlarının özümsenmesi.
- **OWASP Top 10 Guide:** Güvenlik gereksinimlerimizin temellendirilmesi.
- **PostgreSQL resmî dokümantasyonu:** Danışsal kilit, indeks seçimi, EXPLAIN ANALYZE okuma alıştırmaları.

Bunların yanı sıra, ekibimizin lisans öğreniminin son yılında aldığı seçmeli "İleri Yazılım Mühendisliği" ve "Web Tabanlı Sistem Tasarımı" benzeri dersler projeye doğrudan katkı sağlamıştır.

## 8.5. Dikkate Alınan Mühendislik Standartları

Projede aşağıdaki standartlar dikkate alınmış ve tasarım kararlarına yansıtılmıştır. Listelerin amaca uygunluğu bilinçli tercihlerin sonucudur.

**Tablo 8.3.** Uyulan mühendislik standartları.

| Kategori | Standart | Kod | Projedeki Yansıması |
|----------|----------|-----|----------------------|
| Yazılım gereksinim spesifikasyonu | IEEE 830 | IEEE 830-1998 | SRS şablonumuz bu standardın bölüm yapısını izler |
| Yazılım gereksinim mühendisliği | ISO/IEC/IEEE 29148 | 29148:2018 | Gereksinim cümlelerinin yapısı (rol → ihtiyaç → kriter) |
| Yazılım yaşam döngüsü süreçleri | ISO/IEC/IEEE 12207 | 12207:2017 | Geliştirme yaşam döngüsü süreçlerimiz bu standartla paraleldir |
| Bilgi güvenliği yönetim sistemleri | ISO/IEC 27001 | 27001:2022 | Denetim günlüğü, erişim kontrolü, parola politikası |
| Uygulama güvenlik doğrulaması | OWASP ASVS | v4.0 | Auth, oturum, girdi doğrulama gereksinimleri |
| Yazılım kalite modeli | ISO/IEC 25010 | 25010:2011 | Fonksiyonel olmayan gereksinimlerimiz (performans, güvenlik, kullanılabilirlik, sürdürülebilirlik) bu modelden türetildi |
| Web erişilebilirlik | WCAG 2.1 | AA | Kontrast oranları, klavye navigasyonu, ARIA |
| Kişisel veri koruma | GDPR / KVKK | EU 2016/679 / 6698 | Veri minimizasyonu, kullanıcı hakları (erişim, silme), denetim günlüğü |
| JWT | IETF RFC 7519 | RFC 7519 | Token yapısı ve doğrulama |
| OAuth 2.0 | IETF RFC 6749 | RFC 6749 | Bearer token taşıma (gelecek kimlik sağlayıcı entegrasyonu için temel) |
| TLS | IETF RFC 8446 | TLS 1.3 | Üretim HTTPS hedefi |
| HTTP | IETF RFC 9110 | HTTP/1.1 + HTTP/2 | REST API |
| JSON | IETF RFC 8259 | RFC 8259 | API veri formatı |

Bu standartlar yalnızca "uyumluyuz" demek için değil; **tasarım kararlarımızı yönlendirmek için** kullanılmıştır. Örneğin gereksinim cümlelerimizin yapısı ISO/IEC/IEEE 29148'in önerdiği biçimde yazılmış; güvenlik testleri OWASP ASVS başlıkları üzerinden yapılmış; KVKK gereği kullanıcı verilerimiz yalnızca işlevsel ihtiyaç kadar tutulmuştur.

## 8.6. Gerçekçi Kısıtların Değerlendirilmesi (a–h)

Bu bölüm, bölümümüzün talebi gereği projenin **sekiz başlıkta** değerlendirilmesidir. Her başlıkta tasarım kararlarımızın bu kısıtlardan nasıl etkilendiği ve aldığımız önlemler açıklanmıştır.

### 8.6.1. a) Ekonomi

**Etki:** Proje yönetim yazılımları pazarındaki en kritik ekonomik kısıt, kullanıcı başına aylık lisans maliyetidir. Jira veya Microsoft Project gibi araçlar küçük ölçekli ekipler için yüksek maliyet oluşturmaktadır [7][10]. Capterra raporuna göre kullanıcıların büyük çoğunluğu sınırlı bir bütçe ile araç seçimi yapmakta, yalnızca küçük bir kesim bütçesini aşmaktadır [7]. Bu durum, KOBİ ölçekli ekiplerin profesyonel araçlardan yararlanmasını engellemektedir.

**Tasarım kararımız:** SPMS, **açık kaynak** ve **lisans ücreti gerektirmeyen** bir yaklaşımla geliştirilmiştir. Kullanılan tüm üçüncü parti kütüphaneler izin verici lisanslara sahiptir. Bu sayede sistem; lisans maliyeti yaratmadan KOBİ'ler tarafından kullanılabilir. Aynı zamanda konteyner tabanlı dağıtım sayesinde kurulum işçilik maliyeti minimize edilmiştir.

Geliştirme aşamasında ise AI destekli geliştirme araçları (Claude Code, GitHub Copilot) ile ekibimizin verimliliği artırılmış; bu da iki kişilik öğrenci ekibinin endüstri ölçekli bir uygulama teslim etmesini mümkün kılmıştır.

### 8.6.2. b) Çevre Sorunları

**Etki:** Yazılım sistemleri görünür biçimde fiziksel kaynaklarla çalışmasa da, veri merkezleri küresel elektrik tüketiminin önemli bir kısmından sorumludur. Bulut tabanlı bir SaaS platformunun karbon ayak izi, sunucu sayısı ve çalışma süresiyle doğru orantılıdır.

**Tasarım kararımız:**

- **Veritabanı ve API'nin verimliliği:** Asenkron I/O kullanımı sayesinde tek bir sunucu daha fazla eşzamanlı istek karşılayabilmektedir. Bu, aynı kullanıcı tabanına daha az donanımla hizmet vermek anlamına gelir.
- **Önbellekleme:** İstemci tarafında sunucu durumu önbellekleme; gereksiz tekrar isteklerinin önüne geçer.
- **PDF dışa aktarımı:** Daha hafif, saf Python ile çalışan bir kütüphane tercih edilmiştir; sistem kütüphanesi gerektiren alternatiflerin daha yüksek CPU ve disk kullanımı yerine, daha küçük konteyner imajı ve daha düşük kaynak tüketimi sağlanmıştır.
- **Veritabanı sorguları:** N+1 sorununa yol açmayacak şekilde tasarlanmış; sık erişilen kolonlar üzerinde indeksler kurulmuştur.

Yeşil yazılım (Green Software) ilkeleri kapsamında, gelecek sürümlerde gereksiz polling'in WebSocket'e dönüştürülmesi, dosya saklamanın bulut nesne depolamasına kaydırılması gibi optimizasyonlar yol haritasında yer almaktadır.

### 8.6.3. c) Sürdürülebilirlik

**Etki:** Bir yazılımın "sürdürülebilirliği" iki anlam taşır: (i) **operasyonel sürdürülebilirlik** — yazılımın uzun vadede çalışmaya devam edebilmesi, (ii) **bakımsal sürdürülebilirlik** — yeni geliştiricilerin koda kolayca dahil olabilmesi.

**Tasarım kararımız:**

- **Mimari sürdürülebilirlik:** Clean Architecture katman ayrımı ve SOLID prensipleri, kodun uzun vadede değişikliklere kapalı / genişlemelere açık olmasını sağlar.
- **Belgeleme:** SRS, SDD, STD, dönem sonu raporu ve bu kapsamlı raporun toplamı geniş bir doküman seti oluşturmaktadır.
- **Şema göçü:** Tüm şema değişiklikleri sürümlenmiş göçlerle yönetilir; yeni bir geliştirici tek komut ile en güncel şemaya ulaşır.
- **Test piramidi:** Birim, entegrasyon ve uçtan uca testler bir arada bulunur; değişikliklerin regresyon yaratmadığının otomatik teyidini destekler.
- **Konteyner-öncelikli dağıtım:** Konteyner orkestrasyonu ile herhangi bir geliştirici makinesinde aynı çevre kurulabilir.

### 8.6.4. d) Üretilebilirlik

**Etki:** Bir yazılımın "üretilebilirliği", farklı ortamlarda hızlıca konuşlandırılabilmesi ve ölçeklenebilmesi anlamına gelir.

**Tasarım kararımız:**

- **Konteyner tabanlı dağıtım:** Veritabanı, konteyner orkestrasyon dosyası ile ayağa kalkar; backend ve frontend, konteynerlere paketlenmek üzere yapılandırılmıştır.
- **Ortam bağımsız yapılandırma:** Hassas ayarlar ortam değişkeni dosyalarıyla yönetilir; üretim ortamına özgü değerler kod tabanından izole tutulur.
- **Stateless backend:** API tarafında oturum tutulmaz (JWT stateless); bu sayede yatay ölçekleme için engel yoktur.
- **Şema göçü otomasyonu:** Yeni ortama tek adımda şema kurulumu yapılır.
- **Sağlık uç noktaları:** Sistem ayakta olduğu sürece geliştirici dokümantasyon ekranı otomatik mevcuttur ve smoke-test için kullanılabilir.

CI/CD pipeline'ı gelecek sürüm yol haritasındadır.

### 8.6.5. e) Etik

**Etki:** Etik kısıtlar üç ana eksen üzerinden değerlendirilmiştir:

1. Kullanıcı verilerinin etik kullanımı.
2. Yapay zekâ destekli geliştirmenin şeffaf beyanı.
3. Açık kaynak kütüphanelerin lisans uyumu.

**Tasarım kararımız:**

1. **Veri etiği:**
   - Kullanıcıdan **işlevsel ihtiyaç kadar veri** alınır. Zorunlu olmayan alanlar talep edilmez. KVKK ve GDPR'ın veri minimizasyonu ilkesine uyulmuştur.
   - Kullanıcılar kendi verilerini görme, düzenleme ve hesaplarını silme haklarına sahiptir.
   - Denetim günlüğü yalnızca operasyonel olayları (kim ne yaptı) kaydeder; içerik (yorum metni, dosya içeriği) loglanmaz.

2. **Yapay zekâ etiği:**
   - **Geliştirme sürecinde** AI araçları (Claude Code, GitHub Copilot) kullanılmıştır. Bu, raporumuzda açıkça beyan edilmiştir. Tüm mimari kararlar, gereksinim analizi ve tasarım kararları öğrencilerin kendi entelektüel katkısıdır.
   - **Ürün içinde** "AI ile Öner" özelliği, kullanıcıya yardımcı bir asistan olarak konumlandırılmıştır. Sistem hiçbir koşulda kullanıcının onayı olmadan workflow değişikliği uygulamaz; AI önerisi her zaman bir öneridir ve kullanıcı her zaman manuel olarak değiştirebilir.
   - Sistem, yapay zekâ destekli bir kararla üretilen şemayı kullanıcıya açıkça bu şekilde gösterir; "AI tarafından önerildi" bilgisini saklamaz.

3. **Lisans etiği:**
   - Kullanılan üçüncü parti kütüphanelerin tamamı uyumlu açık kaynak lisanslara sahiptir.

### 8.6.6. f) Sağlık

**Etki:** Bilgi işlem ekipmanlarıyla uzun süre çalışmak, kullanıcılarda ergonomik ve göz sağlığı sorunlarına yol açabilir. Bir proje yönetim yazılımı, kullanıcının günde 6–8 saat baktığı bir araç olabilir.

**Tasarım kararımız:**

- **Karanlık tema desteği:** Tema değişkenleri sayesinde karanlık mod entegrasyonu için altyapı hazırdır. Kullanıcı, sistem tercihinden bağımsız olarak tema değiştirebilir.
- **Yumuşak renk paleti:** Saf siyah/beyaz yerine yumuşak nötr tonlar kullanılmıştır. Bu, retinal kontrast yorgunluğunu azaltır.
- **Tipografi:** Sistem fontu ve uyarlanabilir font boyutları kullanılmıştır.
- **Klavye navigasyon desteği:** WCAG 2.1 ile uyumlu olarak tüm temel akışlar yalnızca klavye ile tamamlanabilir. Bu, fare kullanımının kısıtlı olduğu kullanıcılar için kritiktir.
- **Bildirim tercihleri:** Kullanıcı, bildirim alma sıklığını ve türünü ayarlayabilir. Bu, "bildirim yorgunluğu" sorununu hafifletir.

### 8.6.7. g) Güvenlik

Güvenlik, SPMS'nin tasarım kararlarında belki de en çok ağırlık tanıdığı kısıttır.

**Etki:** Proje yönetim yazılımları; iş süreçleri, ekip içi yazışmalar, sözleşme dosyaları gibi hassas verileri barındırır. Bir veri sızıntısı, hem ekip hem de müşteri açısından telafisi güç sonuçlar doğurabilir.

**Tasarım kararımız:**

- **JWT tabanlı kimlik doğrulama:** Stateless oturum; HS256 imzalama; varsayılan 30 dk geçerlilik.
- **bcrypt parola hashleme:** Parolalar asla cleartext olarak veritabanına yazılmaz veya log'lanmaz.
- **RBAC izin matrisi:** Her uç nokta, gerekli izin kontrolü yapılarak korunur. Yönetici tarafından özelleştirilebilir izin matrisi sayesinde rol bazlı kısıtlamalar uçtan uca uygulanır.
- **OWASP Top 10 mitigasyonları:** SQL injection, XSS, CSRF, bozuk kimlik doğrulama, güvensiz varsayılan yapılandırma, hassas veri ifşası gibi maddeler için tedbirler alınmıştır.
- **CORS:** Yalnızca tanımlı kaynaklar kabul edilir.
- **Hız sınırlama:** Kritik uç noktalarda hız sınırı.
- **Denetim günlüğü:** Tüm kritik işlemler (giriş, izin değişikliği, faz geçişi, veri silme) yapısal formatta loglanır.
- **Eşzamanlı geçiş koruması:** Veritabanı düzeyinde kilit.
- **Tekrar gönderim koruması:** İdempotency anahtarı ile.

### 8.6.8. h) Sosyal ve Toplumsal Sorunlar

**Etki:** Bir proje yönetim yazılımı, ekipler arası iletişimi şekillendirir; bu da işyeri kültürü, kapsayıcılık ve dijital eşitlik gibi sosyal boyutlara dokunur.

**Tasarım kararımız:**

- **Çok dillilik:** Sistem Türkçe ve İngilizce olarak iki dil desteğiyle gelir. Yeni dillerin eklenmesi mevcut altyapıda yalnızca bir kaynak dosyası ekleme gerektirir.
- **Erişilebilirlik:** WCAG 2.1 AA hedefi sayesinde görme engelli kullanıcılar ekran okuyucu desteğiyle, motor becerisi kısıtlı kullanıcılar klavye navigasyonuyla sistemi kullanabilir.
- **Dijital eşitlik:** Sistem responsive tasarım sayesinde mobil cihazlarda da çalışır. Mobil yerel uygulama kapsam dışı olsa da responsive yapı, akıllı telefonla bağlanan kullanıcıları da kapsar.
- **Açık kaynak felsefe:** Geliştirme sürecinin şeffaflığı, kullanıcıların yazılıma güven duymasını sağlar; kod incelenebilirdir.
- **Etik veri kullanımı:** Sosyal sürveyans tarzı pratiklerden kaçınılmıştır. Denetim günlüğü yalnızca "kim ne yaptı" bilgisini tutar; kullanıcı davranış analizi yapılmaz.
- **Kapsayıcı dil:** Arayüz metinleri cinsiyet-nötr ifadelerle yazılmıştır. Sistem mesajları yargılayıcı değil, açıklayıcı ve yardımcı tondadır.

Sosyal sorumluluk açısından, açık kaynak olmasının ötesinde, SPMS'nin **eğitim amaçlı kullanılabilir** olması bir başka katkıdır. Lisans öğrencileri Clean Architecture'ın gerçek bir örneğini bu kod tabanı üzerinden inceleyebilir.

---

# 9. SONUÇ VE DEĞERLENDİRME

## 9.1. Elde Edilen Sonuçlar

Bu çalışmada, yazılım geliştirme ekiplerinin proje yönetim süreçlerini tek bir platformda yürütebilmelerine olanak tanıyan, metodoloji-bağımsız ve açık kaynak bir sistem olan **SPMS** başarıyla tasarlanmış ve önemli ölçüde tamamlanmıştır. Sistem:

- **Beş ana modülde** (AUTH, TASK, NOTIF, REPORT, PROCESS) işlevsellik sağlamakta,
- **Dört yazılım geliştirme metodolojisini** (Scrum, Kanban, Waterfall, İteratif) tek uygulamada desteklemekte,
- **Yaşam Döngüsü Sekmesi**, **Workflow Editor**, **Phase Gate**, kilometre taşı / çıktı / faz raporu varlıkları ve **9 hazır yaşam döngüsü şablonu** ile profesyonel düzey proje yönetimini olanaklı kılmakta,
- **Burndown / CFD / Lead-Cycle Time / İterasyon Karşılaştırma** raporları ile veri-temelli karar desteği sunmakta,
- **Yönetilebilir RBAC izin matrisi** ile esnek yetkilendirme sağlamakta,
- **134 test case'in tamamının başarılı geçtiği** kapsamlı bir test paketi ile doğrulanmış durumdadır.

## 9.2. Hedeflere Ulaşma Durumu

Projenin başlangıçta tanımlanan hedeflerine ulaşma oranı yüksek düzeydedir:

| Hedef | Durum | Açıklama |
|-------|-------|----------|
| Tek kod tabanında çoklu metodoloji desteği | ✅ Ulaşıldı | Scrum/Kanban/Waterfall/İteratif tek uygulamada |
| Clean Architecture + SOLID disiplin | ✅ Ulaşıldı | Domain ve Application katmanlarında altyapı bağımlılığı yok |
| Açık kaynak ve lisans-ücretsiz | ✅ Ulaşıldı | Tüm bağımlılıklar uyumlu açık kaynak lisanslara sahip |
| Görsel yaşam döngüsü düzenleyici | ✅ Ulaşıldı | Tam görsel editör, 9 hazır şablon |
| Faz geçiş kapısı (Phase Gate) | ✅ Ulaşıldı | Otomatik + manuel kriter, denetim günlüğü |
| Yönetilebilir izin matrisi | ✅ Ulaşıldı | Admin paneli üzerinden hücre bazlı yönetim |
| AI tabanlı workflow öneri | 🟡 Son entegrasyon aşamasında | Arayüz hazır, model bağlantısı tamamlanma aşamasında |
| WebSocket gerçek zamanlı bildirim | 🔴 Ertelendi | Polling ile çözüldü; sonraki sürüm yol haritasında |
| Mobil yerel uygulama | 🔴 Kapsam dışı | Responsive web yeterli |

## 9.3. Projenin Güçlü ve Geliştirilebilir Yönleri

**Güçlü yönler:**

- **Mimari disiplin:** Clean Architecture katman ayrımı tutarlı uygulanmış; teknik borç düzeyi düşük.
- **Çoklu metodoloji desteği:** Mevcut araçların çoğunda bulunmayan, gerçek bir farklılaştırıcı özellik.
- **Test kapsamı:** 134 test case'in tamamı başarıyla geçmiş; sistemin kararlı olduğunu göstermektedir.
- **Dokümantasyon olgunluğu:** SRS, SDD, STD ve bu kapsamlı raporun birlikte oluşturduğu doküman seti, sistemin uzun vadeli sürdürülebilirliğini destekler.
- **Etik şeffaflık:** AI'nin hem geliştirme sürecindeki rolü hem de ürün içindeki yeri açıkça beyan edilmiştir.

**Geliştirilebilir yönler:**

- **Gerçek zamanlı işbirliği:** Polling yerine WebSocket entegrasyonu.
- **AI özelliklerinin genişletilmesi:** Workflow önerisinin yanı sıra görev öncelik önerisi, sprint sığa tahmini gibi yardımcı AI özellikleri.
- **Bütçe takibi:** PMBOK Maliyet Yönetimi bilgi alanı şu anda doğrudan modül olarak yer almamaktadır.
- **Yük testlerinin otomasyonu.**
- **Güvenli oturum saklama:** JWT'nin HttpOnly cookie ile saklanması.

## 9.4. Gelecek Çalışmalar

Aşağıdaki başlıklar, projenin sonraki sürüm yol haritasında yer almaktadır:

1. **AI önerme yeteneklerinin genişletilmesi:** Yaşam döngüsü önerisinin yanı sıra görev önceliklendirme ve sprint kapasite tahmini gibi alanlara taşınması.
2. **WebSocket gerçek zamanlı bildirim:** Bildirim servis arayüzüne yeni bir adaptör eklenerek polling yerine push tabanlı bildirim.
3. **HttpOnly cookie JWT:** Tarayıcı tarafında JWT'nin daha güvenli biçimde saklanması.
4. **Çok kiracılı (multi-tenant) destek:** Tek kurulumun birden çok organizasyona hizmet vermesi.
5. **Bütçe ve maliyet takibi modülü:** PMBOK Maliyet Yönetimi alanını karşılayacak modül.
6. **Mobil push bildirim:** Mobil cihazlara işletim sistemi seviyesinde bildirim.
7. **CI/CD pipeline:** Otomatik test ve dağıtım.
8. **Kalıcı hesap kilitleme deposu:** Sunucu yeniden başlasa bile koruma sürekliliği.

## 9.5. Kapanış

SPMS, modern bir yazılım proje yönetim sisteminin **mimari, metodolojik ve etik** boyutlarını birlikte ele alan bir bitirme projesi olarak tasarlanmıştır. Çalışma yalnızca bir ürün ortaya çıkarmamış; aynı zamanda Clean Architecture, SOLID ve PMBOK bilgi alanlarının lisans seviyesinde **somut bir uygulamasını** ortaya koymuştur. Literatür [10][13]'ün vurguladığı "tek araç tüm metodolojileri kapsayamıyor" sorununa, görsel Workflow Editor ve Phase Gate üçlüsü ile bütünleşik bir cevap geliştirilmiştir.

Sistemimiz, yapay zekâ tabanlı proje yönetim eğiliminin [3][16] bir adım önünde kalabilmek adına **"AI ile Öner"** özelliğini yaşam döngüsü editörüne entegre etmiştir. Açık kaynak felsefesi, etik şeffaflık ve sürdürülebilir mimari ile SPMS, hem akademik hem de endüstriyel bağlamda değer sunmaya hazır bir platform olarak değerlendirilebilir.

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
