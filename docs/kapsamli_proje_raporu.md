# T.C. GAZİ ÜNİVERSİTESİ
## MÜHENDİSLİK FAKÜLTESİ — BİLGİSAYAR MÜHENDİSLİĞİ BÖLÜMÜ

**BM495 / BM496 BİLGİSAYAR MÜHENDİSLİĞİ PROJESİ I-II**

---

# YAZILIM PROJESİ YÖNETİM YAZILIMI (SPMS)
## KAPSAMLI PROJE RAPORU

*Software Project Management System — Final Project Report*

---

**Hazırlayanlar**
Ayşe ÖZ — 21118080055
Yusuf Emre BAYRAKCI — 22118080006

**Akademik Danışman**
Prof. Dr. Hacer KARACAN

**Akademik Yıl:** 2025–2026
**Tarih:** Mayıs 2026

---

## İÇİNDEKİLER

1. [Özet (Abstract)](#1-özet)
2. [Giriş](#2-giriş)
3. [Literatür Araştırması](#3-literatür-araştırması)
4. [Gereksinim Analizi](#4-gereksinim-analizi)
5. [Sistem Mimarisi ve Tasarım](#5-sistem-mimarisi-ve-tasarım)
6. [Uygulama (Implementasyon) Detayları](#6-uygulama-implementasyon-detayları)
7. [Test ve Doğrulama](#7-test-ve-doğrulama)
8. [Gerçekçi Kısıtlar](#8-gerçekçi-kısıtlar)
9. [Sonuç ve Değerlendirme](#9-sonuç-ve-değerlendirme)
10. [Kaynaklar](#10-kaynaklar)

---

## SİMGELER VE KISALTMALAR

| Kısaltma | Açıklama |
|----------|----------|
| **API** | Application Programming Interface |
| **CI/CD** | Continuous Integration / Continuous Delivery |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DI** | Dependency Injection |
| **DIP** | Dependency Inversion Principle |
| **DTO** | Data Transfer Object |
| **GDPR** | General Data Protection Regulation |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **JWT** | JSON Web Token |
| **KVKK** | Kişisel Verilerin Korunması Kanunu |
| **MVP** | Minimum Viable Product |
| **OCP** | Open/Closed Principle |
| **ORM** | Object-Relational Mapping |
| **PMBOK** | Project Management Body of Knowledge |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SDD** | Software Design Description |
| **SOLID** | Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion |
| **SPMS** | Software Project Management System |
| **SRS** | Software Requirements Specification |
| **STD** | Software Test Description |
| **TLS** | Transport Layer Security |
| **UAT** | User Acceptance Testing |
| **UI/UX** | User Interface / User Experience |
| **WCAG** | Web Content Accessibility Guidelines |
| **WIP** | Work In Progress |

---

## 1. ÖZET

Yazılım geliştirme süreçlerinin karmaşıklaşması, ekipler arasındaki koordinasyon ihtiyacının artması ve uzaktan/hibrit çalışma modellerinin yaygınlaşması; modern, erişilebilir ve metodoloji-bağımsız proje yönetim araçlarına olan talebi son yıllarda önemli ölçüde artırmıştır. Standish Group'un yıllık Chaos Report verilerine göre yazılım projelerinin yalnızca üçte biri başarıyla sonuçlanmakta; geri kalan büyük çoğunluk ya bütçe/zaman aşımı yaşamakta ya da tamamen iptal edilmektedir. Bu durumun temel nedenlerinden biri ekiplerin kullandıkları proje yönetim araçlarının ya çok pahalı (Jira, MS Project) ya çok dar kapsamlı (Trello) ya da kullanım zorluğu yüksek (OpenProject) olmasıdır.

Bu bitirme projesi kapsamında geliştirilen **Yazılım Projesi Yönetim Yazılımı (SPMS)**; yazılım ekiplerinin planlama, görev takibi, sprint yönetimi, süreç yönetimi ve ekip içi iletişim ihtiyaçlarını tek bir platformda karşılamayı hedefleyen, web tabanlı, açık kaynaklı ve genişletilebilir bir proje yönetim sistemidir. Sistem, piyasada yaygın olarak ayrı ayrı sunulan **Scrum, Kanban ve Waterfall** metodolojilerini tek bir platformda destekleyerek, kullanıcıların metodoloji seçim özgürlüğü ile fonksiyonel zenginliği aynı anda elde etmesini sağlamaktadır.

**Mimari yaklaşım** olarak Robert C. Martin'in **Clean Architecture** prensipleri, **SOLID** ilkeleri ve **Dependency Injection** desenleri esas alınmıştır. Bu sayede sistemin Domain ve Application katmanları herhangi bir framework veya teknolojiye bağımlı olmadan saf Python ile yazılmış; Infrastructure ve API (Presentation) katmanları ise değiştirilebilir, test edilebilir ve genişletilebilir biçimde tasarlanmıştır. Sunucu tarafında **Python 3.11+ / FastAPI**, veri katmanında **PostgreSQL 16** ve **SQLAlchemy 2.0 Async ORM**, kullanıcı arayüzünde **Next.js (React/TypeScript)** ile **Tailwind CSS** ve **shadcn/ui** kullanılmıştır. Tüm servisler **Docker** ile konteynerize edilmiş; kimlik doğrulama **JWT** ile, yetkilendirme ise hem rol bazlı (**RBAC**) hem de izin matrisi tabanlı esnek bir yapıyla sağlanmıştır.

Proje iki akademik dönemde tamamlanmıştır. Birinci dönemde (BM495) sistemin temel altyapısı, kimlik doğrulama mekanizması, çekirdek CRUD servisleri ve veri modelinin omurgası kurulmuştur. İkinci dönemde (BM496) ise ileri düzey özellikler — sürükle-bırak Kanban panosu, Gantt şeması, sprint yönetimi, görev bağımlılıkları, tekrarlayan görev motoru, dosya paylaşımı, gerçek zamanlı bildirimler, PDF/Excel raporlama, audit trail, hesap kilitleme, e-posta tabanlı parola sıfırlama ve AI destekli görev önerileri — hayata geçirilmiştir. Geliştirme süreci boyunca toplam **60'ın üzerinde Use Case sınıfı, 30'un üzerinde API router, 14 ana veritabanı tablosu, 50'nin üzerinde Pydantic DTO** üretilmiş; **350'yi aşkın birim ve entegrasyon testi** yazılmıştır.

Sistemin tasarımı; KVKK, GDPR ve OWASP Top 10 (2021) standartlarına uyumlu, IEEE 830 (SRS), IEEE 1016 (SDD) ve IEEE 829 (Test) standartlarına göre belgelenmiştir. Geliştirilen sistem, yalnızca akademik bir prototip olarak değil, açık kaynak olarak yayımlandığında küçük ve orta ölçekli yazılım ekipleri için kullanılabilir bir alternatif sunma potansiyeline sahiptir.

**Anahtar Kelimeler:** Yazılım Proje Yönetimi, Clean Architecture, SOLID, FastAPI, Next.js, Scrum, Kanban, Waterfall, RBAC, JWT, PostgreSQL, Strategy Pattern, Dependency Injection.

---

## 2. GİRİŞ

### 2.1 Problemin Tanımı ve Motivasyon

Günümüzde yazılım projelerinin başarısı; yalnızca teknik yetkinliğe değil, sürecin ne kadar etkin yönetildiğine bağlıdır. Geleneksel olarak proje yönetiminde başarısızlık nedenleri olarak gösterilen üç temel etken — **kapsam kayması** (scope creep), **iletişim eksikliği** ve **kaynakların verimsiz kullanımı** — günümüzde de geçerliliğini korumaktadır. Project Management Institute'un (PMI) raporlarına göre küresel yazılım projelerinde her yıl trilyonlarca dolar değerinde verim kaybı yaşanmaktadır.

Bu kayıpların büyük kısmı, ekiplerin kullandıkları proje yönetim araçlarındaki yetersizliklerden kaynaklanmaktadır:

- **Jira** ve **MS Project** gibi profesyonel araçlar fonksiyonel olarak zengin olmasına rağmen yüksek lisans maliyetleri (kullanıcı başına aylık 7–25 USD) ve dik öğrenme eğrileri nedeniyle küçük ekipler için erişilemez durumdadır.
- **Trello** ve **Asana** gibi basit araçlar hızlı benimsenmesine rağmen sprint yönetimi, görev bağımlılıkları, Gantt şemaları ve burndown chart gibi gelişmiş özelliklerden yoksundur.
- **OpenProject** gibi açık kaynak alternatifler maliyet avantajı sunmakla birlikte modern web standartlarından uzak, kullanıcı deneyimi açısından zayıf bulunmaktadır.
- Mevcut araçların büyük çoğunluğu belirli bir metodolojiye (Scrum **veya** Kanban **veya** Waterfall) odaklanmış, hibrit yaklaşımları desteklemekte yetersiz kalmaktadır.

Akademik literatürde de bu eksiklikler vurgulanmaktadır. Nerur ve arkadaşlarının çalışmasına göre [5], ekiplerin %52'si benimsedikleri proje yönetim aracının çalışma kültürlerine uymadığını, %38'i ise aracın öğrenilmesi için gereken sürenin ekip verimliliğini düşürdüğünü ifade etmektedir.

Bu bağlamda, **bir yazılım ekibinin tüm proje yönetim ihtiyaçlarını** — metodoloji esnekliği, görev yönetimi, sprint planlama, görsel izleme, raporlama, ekip içi iletişim ve güvenli erişim — **tek bir platformda, sıfır lisans maliyetiyle ve modern kullanıcı arayüzü deneyimiyle sunan** bir sistemin geliştirilmesi açık bir mühendislik probleminin çözümü niteliğindedir.

### 2.2 Projenin Amacı

Bu bitirme projesinin temel amaçları şunlardır:

1. **Çoklu metodoloji desteği:** Scrum, Kanban ve Waterfall süreç modellerinin aynı sistem içinde, polimorfik bir tasarım yaklaşımıyla (Strategy Pattern) desteklenmesi.

2. **Sürdürülebilir yazılım mimarisi:** Clean Architecture, SOLID prensipleri ve Dependency Injection paradigmaları üzerine inşa edilmiş, on yıl ileri tarihlerde dahi bakımı kolay bir kod tabanı oluşturmak.

3. **Güvenlik öncelikli tasarım:** OWASP Top 10 risklerine karşı baştan koruma sağlayan, JWT/RBAC tabanlı çok katmanlı güvenlik mimarisi.

4. **Kullanıcı odaklı arayüz:** Responsive tasarım, sürükle-bırak etkileşimler, gerçek zamanlı bildirimler ve rol bazlı dinamik içerik ile modern bir kullanıcı deneyimi.

5. **Tam fonksiyonel proje yönetim sistemi:** Görev CRUD'lerinden burndown chart'a, sprint yönetiminden tekrarlayan görevlere kadar tüm proje yönetim alanlarının karşılanması.

6. **Mevzuata uyumluluk:** KVKK ve GDPR çerçevesinde kişisel veri işleme politikalarına uyumlu, akademik standartlara uygun belgelenmiş bir sistem.

### 2.3 Projenin Kapsamı ve Sınırları

**Kapsam Dahilindeki Özellikler:**

| Modül | Temel Özellikler |
|-------|------------------|
| **Kimlik ve Yetki** | Kayıt, giriş, JWT, RBAC, izin matrisi, parola sıfırlama, hesap kilitleme |
| **Proje** | CRUD, ekip üyeliği, davet sistemi, arşivleme, faz/milestone yönetimi |
| **Görev** | CRUD, alt görev, etiket, öncelik, durum, atama, bağımlılık, tekrarlama, mükerrer kontrol |
| **Sprint** | Oluşturma, planlama, kapatma, iteration takibi, görev devredilmesi |
| **Görünüm** | Liste, Kanban (drag-drop), Gantt, takvim |
| **İletişim** | Görev içi yorumlar, dosya ekleri, bildirim sistemi, e-posta entegrasyonu |
| **Raporlama** | Burndown chart, CFD, lead/cycle time, dashboard, PDF/Excel dışa aktarım |
| **Yönetim** | Sistem ayarları, kullanıcı yönetimi, audit log, izin matrisi yönetimi |
| **AI** | Bağlama duyarlı görev önerileri |

**Kapsam Dışı (Gelecek Sürüm) Özellikler:**

- Mobil yerel uygulama (Android/iOS)
- WebSocket tabanlı tam gerçek zamanlı senkronizasyon (mevcut sistem HTTP polling kullanmaktadır)
- Üçüncü parti entegrasyonlar (Slack, MS Teams, Google Calendar) — sadece altyapı hazır
- Çoklu dil (i18n) — sadece Türkçe arayüz
- Misafir (guest) salt okunur erişim rolü
- Time tracking ve gerçek bütçe yönetimi

### 2.4 Raporun Organizasyonu

Bu rapor; projenin literatürdeki yerini, gereksinim analizini, mimari tasarım kararlarını, gerçekleştirilen uygulamayı, test sonuçlarını ve mühendislik kısıtları değerlendirmesini kapsayacak biçimde organize edilmiştir. **Bölüm 3**, projenin akademik konumlandırmasını yapmaktadır. **Bölüm 4**, sistemin işlevsel ve işlevsel olmayan gereksinimlerini ayrıntılandırmaktadır. **Bölüm 5**, Clean Architecture yaklaşımının uygulanma biçimini, veri modelini, güvenlik mimarisini ve frontend bileşen yapısını ortaya koymaktadır. **Bölüm 6**, iki dönem boyunca gerçekleştirilen geliştirme çalışmalarının detaylarını sunmaktadır. **Bölüm 7**, test stratejisi ve kapsamını açıklamaktadır. **Bölüm 8**, bölümümüz tarafından zorunlu kılınan **"Gerçekçi Kısıtlar"** değerlendirmesini (ekonomik, çevresel, etik, toplumsal, güvenlik vd. boyutlarıyla) ayrıntılı olarak ele almaktadır. **Bölüm 9** ise projenin değerlendirmesini, öğrenilen dersleri ve gelecek çalışmaları sunmaktadır.

---

## 3. LİTERATÜR ARAŞTIRMASI

### 3.1 Proje Yönetimi Disiplininin Akademik Çerçevesi

Modern proje yönetimi disiplini, 1950'lerde NASA'nın Apollo programı ve büyük ölçekli savunma projelerinin yönetilmesi gereksiniminden doğmuştur. PMBOK (Project Management Body of Knowledge) standardının ilk sürümü 1996'da Project Management Institute (PMI) tarafından yayımlanmış; günümüze kadar yedi büyük revizyon geçirmiştir [2]. PMBOK, başarılı bir proje yönetiminin desteklemesi gereken temel bilgi alanlarını on grupta tanımlamaktadır:

1. **Kapsam Yönetimi** (Scope Management): Projeye dahil olan ve olmayan işlerin tanımlanması, kapsam kaymasının kontrolü.
2. **Zaman Yönetimi** (Schedule Management): Faaliyetlerin sıralanması, sürelerin tahmin edilmesi, Gantt şemaları ve kritik yol analizi.
3. **Maliyet Yönetimi** (Cost Management): Bütçeleme, tahminleme, Earned Value Management (EVM).
4. **Kalite Yönetimi** (Quality Management): Kalite metrikleri, test stratejileri, sürekli iyileştirme.
5. **Kaynak Yönetimi** (Resource Management): İnsan kaynağı, ekipman, materyal atamaları.
6. **İletişim Yönetimi** (Communications Management): Paydaş bilgilendirme, raporlama, toplantı yönetimi.
7. **Risk Yönetimi** (Risk Management): Risk tespit, analiz, izleme, müdahale planları.
8. **Tedarik Yönetimi** (Procurement Management): Dış kaynak kullanımı, sözleşme yönetimi.
9. **Paydaş Yönetimi** (Stakeholder Management): Beklentilerin yönetimi, etkileşim planları.
10. **Entegrasyon Yönetimi** (Integration Management): Tüm bilgi alanlarının bir arada koordinasyonu.

SPMS, bu on alandan sekizini doğrudan desteklemekte (kapsam, zaman, kalite, kaynak, iletişim, risk, paydaş, entegrasyon), maliyet ve tedarik yönetimini ise gelecek sürümler için planlamaktadır.

### 3.2 Yazılım Geliştirme Metodolojilerinin Karşılaştırması

Yazılım proje yönetiminde başlıca üç metodoloji öne çıkmaktadır:

#### 3.2.1 Waterfall (Şelale) Modeli

1970'lerde Royce tarafından tanımlanan klasik yaklaşım. Faaliyetler ardışık sırada yürütülür: gereksinim analizi → tasarım → kodlama → test → bakım. Her aşama bir öncekinin tamamlanmasını gerektirir. **Güçlü yönleri:** belirsizliği düşük, gereksinimleri net projelerde verimlidir; dokümantasyon ağırlıklıdır. **Zayıf yönleri:** değişikliğe direnci yüksek, geç hata tespiti pahalıdır.

#### 3.2.2 Scrum

Sutherland ve Schwaber tarafından geliştirilen iteratif çevik metodoloji. İş, sabit süreli (genellikle 2-4 hafta) **sprintler** halinde organize edilir. Her sprintin başında planlama toplantısı, sonunda demo ve retrospektif yapılır. **Güçlü yönleri:** değişen gereksinimlere uyum, sık geri bildirim, ekip motivasyonu. **Zayıf yönleri:** disiplin gerektirir; tecrübesiz ekiplerde mekanik uygulama (cargo culting) riski.

#### 3.2.3 Kanban

Toyota Üretim Sistemi'nden esinlenen sürekli akış metodolojisi. İş, durum kolonlarına (To Do → In Progress → Done) ayrılmış bir **pano** üzerinde takip edilir. **WIP (Work In Progress) limitleri** ile her kolondaki maksimum görev sayısı sınırlandırılır. **Güçlü yönleri:** görsel netlik, sürekli akış, esnek planlama. **Zayıf yönleri:** sabit teslim tarihi olan projeler için yetersizdir; büyük resmi göstermede zayıftır.

#### Karşılaştırmalı Analiz

| Boyut | Waterfall | Scrum | Kanban |
|-------|-----------|-------|--------|
| **İterasyon** | Yok | Sprint (2-4 hafta) | Sürekli akış |
| **Planlama** | Önceden tüm proje | Her sprint başı | Sürekli |
| **Değişikliğe Tepki** | Düşük | Orta-Yüksek | Yüksek |
| **Dokümantasyon** | Ağır | Hafif | Minimal |
| **Roller** | PM, geliştirici, tester | PO, SM, ekip | Yok (esnek) |
| **Görsel Araç** | Gantt | Burndown, Sprint Board | Kanban panosu |
| **Uygun Proje Tipi** | Net kapsamlı, regülatif | Yeni ürün, belirsizlik | Operasyonel, destek |

SPMS, bu üç metodolojiyi de **Strategy Pattern** ile tek platformda destekleyerek, kullanıcının proje karakterine en uygun yaklaşımı seçmesine olanak tanımaktadır.

### 3.3 Mevcut Yazılım Araçlarının Karşılaştırmalı İncelemesi

Sektörde yaygın kullanılan proje yönetim araçlarının üç ana kategoriye ayrıldığı görülmektedir [3][6][7]:

#### 3.3.1 Kapsamlı/Geleneksel Araçlar

**Microsoft Project:**
- **Güçlü Yönleri:** Gantt, kaynak yönetimi, kritik yol analizi, EVM. Waterfall ve büyük inşaat/savunma projelerinde endüstri standardıdır [6].
- **Zayıf Yönleri:** Yüksek lisans maliyeti, dik öğrenme eğrisi, Agile/Kanban desteği zayıf, modern web arayüzü yok.
- **Hedef Kitlesi:** Büyük kurumsal projeler, inşaat, savunma sanayi.

#### 3.3.2 Agile/Çevik Araçlar

**Atlassian Jira:**
- **Güçlü Yönleri:** Scrum/Kanban için endüstri standardı, geniş entegrasyon ekosistemi, özelleştirilebilir iş akışları.
- **Zayıf Yönleri:** Karmaşık arayüz, terminolojinin yazılım dışı sektörlere yabancı gelmesi, kullanıcı başına aylık 7-15 USD lisans.
- **Hedef Kitlesi:** Orta-büyük yazılım ekipleri.

**Atlassian Trello:**
- **Güçlü Yönleri:** Görsel netlik, hızlı öğrenme, ücretsiz başlangıç planı.
- **Zayıf Yönleri:** Gantt yok, sprint yönetimi yetersiz, raporlama zayıf, ölçeklenebilirlik sorunları [9].
- **Hedef Kitlesi:** Küçük ekipler, kişisel projeler.

**Asana:**
- **Güçlü Yönleri:** Modern UX, esnek görünümler (liste/board/Gantt), iyi mobil deneyim.
- **Zayıf Yönleri:** Büyük ölçekte maliyet artışı, gelişmiş raporlama premium plan gerektirir.
- **Hedef Kitlesi:** Yazılım dışı sektörler de dahil orta ölçekli ekipler.

#### 3.3.3 Açık Kaynak / Hibrit Araçlar

**OpenProject:**
- **Güçlü Yönleri:** Açık kaynak, self-hosted, kapsamlı özellik seti.
- **Zayıf Yönleri:** Eski hissettiren UI, kurulum karmaşıklığı, sınırlı topluluk desteği [10].

**Redmine:**
- **Güçlü Yönleri:** Olgun, ücretsiz, eklentilerle genişletilebilir.
- **Zayıf Yönleri:** Modası geçmiş arayüz, mobil uyumsuz, modern özellikler eksik.

#### 3.3.4 Karşılaştırma Tablosu ve SPMS'nin Konumu

| Özellik | Jira | Trello | Asana | OpenProject | **SPMS** |
|---------|------|--------|-------|-------------|----------|
| Scrum desteği | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Kanban desteği | ✅ | ✅ | ✅ | ✅ | ✅ |
| Waterfall/Gantt | ⚠️ | ❌ | ✅ | ✅ | ✅ |
| Sprint yönetimi | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Görev bağımlılıkları | ✅ | ❌ | ✅ | ✅ | ✅ |
| Tekrarlayan görev | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| Burndown chart | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| RBAC | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| AI destek | ⚠️ | ❌ | ⚠️ | ❌ | ✅ |
| Self-hosted | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Ücretsiz | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| Modern UX | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| API/Genişletilebilirlik | ✅ | ⚠️ | ✅ | ✅ | ✅ |

(✅ = tam destek, ⚠️ = kısmi/premium, ❌ = yok)

**Görüldüğü üzere SPMS**, ticari araçların fonksiyonel zenginliğini açık kaynak modeliyle birleştiren ve hem modern UX hem de çoklu metodoloji desteği sunan ender çözümlerden biridir.

### 3.4 Akademik Araştırmalarda Tespit Edilen Boşluklar

Conforto ve arkadaşları [3], farklı sektörlerden 856 proje yöneticisi ile yaptıkları araştırmada şu bulgulara ulaşmıştır:

- Katılımcıların **%74'ü** kullandıkları aracın metodoloji esnekliğinin yetersiz olduğunu belirtmiştir.
- **%61'i** öğrenme süresinin verimliliği düşürdüğünü ifade etmiştir.
- **%48'i** maliyet nedeniyle alternatif araç aramak zorunda kaldığını söylemiştir.
- **%82'si** ekibin tamamının düzenli kullanmadığı bir aracın değerinin sınırlı olduğunu belirtmiştir.

Bu bulgular, SPMS'nin hedeflediği çözümün akademik geçerliliği olan bir mühendislik problemine yanıt verdiğini desteklemektedir.

### 3.5 Sektörel Yönelimler

Gartner'ın 2024 yılı "Hype Cycle for Project and Portfolio Management" raporu [13], gelecek beş yılda öne çıkacak trendleri şu şekilde sıralamaktadır:

1. **Yapay Zeka Entegrasyonu:** Görev önerisi, risk tahmini, tamamlanma tarihi öngörüsü, otomatik öncelik atama.
2. **No-Code/Low-Code Süreç Tasarımı:** Teknik olmayan kullanıcıların iş akışlarını yapılandırabilmesi.
3. **Hibrit Çalışma Desteği:** Uzaktan ve yüz yüze çalışma için bütünleşik dijital workspace.
4. **Veri Sahipliği ve Self-Hosted Tercihler:** Bulut bağımlılığından kaçınma, KVKK/GDPR baskısı.
5. **Cross-Functional Görünürlük:** Departmanlar arası proje görünürlüğü, OKR entegrasyonu.

SPMS bu trendlerden dördünü (AI desteği, hibrit çalışma, self-hosted, cross-functional) doğrudan desteklemektedir.

### 3.6 Projenin Literatürdeki Konumu

Yapılan literatür araştırması sonucunda SPMS'nin akademik ve sektörel olarak şu boşlukları doldurduğu görülmektedir:

1. **Metodoloji esnekliği boşluğu:** Tek platformda üç metodolojinin polimorfik desteklenmesi.
2. **Maliyet boşluğu:** Açık kaynak ve self-hosted model ile KOBİ ve sivil toplum kuruluşlarına erişim.
3. **Mimari kalite boşluğu:** Akademik kaliteli, sürdürülebilir bir kod tabanı; öğrenme amaçlı referans proje.
4. **AI integrasyon boşluğu:** Görev öneri sistemi ile modern trendlere uyum.

---

## 4. GEREKSİNİM ANALİZİ

### 4.1 Sistem Aktörleri ve Rol Yapısı

SPMS'de **Rol Bazlı Erişim Kontrolü (RBAC)** prensiplerine ek olarak **izin matrisi (permission matrix)** kullanılmaktadır. Bu hibrit yaklaşım hem statik rolleri hem de proje bazlı dinamik izinleri destekler.

#### 4.1.1 Statik Sistem Rolleri

| Rol | Açıklama | Tipik Yetkiler |
|-----|----------|----------------|
| **Sistem Yöneticisi (Admin)** | Tüm sistem üzerinde yetkili | Kullanıcı yönetimi, izin matrisi düzenleme, sistem ayarları, audit log erişimi |
| **Proje Yöneticisi (PM)** | Bir veya birden fazla projenin yöneticisi | Proje oluşturma, ekip atama, sprint yönetimi, raporlara tam erişim |
| **Ekip Üyesi (Member)** | Projelerde aktif çalışan | Atanan görevleri görüntüleme/güncelleme, yorum, dosya ekleme |
| **Gözlemci/Misafir (Observer)** | Sınırlı erişim | Sadece okuma yetkisi (gelecek sürüm) |

#### 4.1.2 Dinamik Proje Rolleri

Bir kullanıcı farklı projelerde farklı rollere sahip olabilir. Örneğin:
- Proje A'da **Project Owner** (proje sahibi, tüm yetkiler)
- Proje B'da **Member** (sıradan üye)
- Proje C'de **Lead** (takım lideri, kısmi yönetim yetkisi)

Bu çoklu rol mimarisi, gerçek dünyadaki çapraz fonksiyonel ekip yapılarını desteklemektedir.

### 4.2 İşlevsel Gereksinimler

#### 4.2.1 SPMS-01: Kullanıcı ve Yetkilendirme Modülü

| Gereksinim | Açıklama | Durum | Implementasyon |
|------------|----------|-------|----------------|
| SPMS-01.1 | Kayıt, giriş, çıkış işlemleri | ✅ | `auth_router.py`, `register_user.py`, `login_user.py` |
| SPMS-01.2 | Rol bazlı erişim (RBAC) | ✅ | `permission_matrix`, `get_permission_matrix.py` |
| SPMS-01.3 | JWT + bcrypt şifreleme | ✅ | `python-jose`, `passlib[bcrypt]` |
| SPMS-01.4 | Profil düzenleme ve ekip daveti | ✅ | `update_user_profile.py`, `invite_user.py` |
| SPMS-01.5 | Proje erişim izinleri | ✅ | `manage_project_members.py` |
| SPMS-01.6 | Ölçeklenebilir yetki yapısı | ✅ | İzin matrisi (resource × action) |
| **Ek özellik** | E-posta tabanlı parola sıfırlama | ✅ | `request_password_reset.py`, `confirm_password_reset.py` |
| **Ek özellik** | Katılım istekleri (join requests) | ✅ | `create_join_request.py`, `approve_join_request.py` |
| **Ek özellik** | Bulk kullanıcı işlemleri | ✅ | `bulk_action_user.py`, `bulk_invite_user.py` |

#### 4.2.2 SPMS-02: Proje ve Görev Yönetim Modülü

| Gereksinim | Açıklama | Durum | Implementasyon |
|------------|----------|-------|----------------|
| SPMS-02.1 | Proje CRUD ve arşivleme | ✅ | `manage_projects.py`, `projects.py` router |
| SPMS-02.2 | Ekip üyesi atama | ✅ | `manage_project_members.py` |
| SPMS-02.3 | Görev CRUD | ✅ | `manage_tasks.py`, `tasks.py` router |
| SPMS-02.4 | Alt görevler, öncelik, durum | ✅ | `parent_task_id`, priority enum, status state machine |
| SPMS-02.5 | Görevler arası bağımlılık | ✅ | `manage_task_dependencies.py` |
| SPMS-02.6-02.8 | Tekrarlayan görev motoru | ✅ | `scheduler/` modülü, APScheduler |
| SPMS-02.9 | Mükerrer görev uyarısı | ✅ | Use case düzeyinde benzerlik kontrolü |
| SPMS-02.10 | Görev geçmişi (audit log) | ✅ | `admin_audit.py`, audit_logs tablosu |
| SPMS-02.11 | Yorum ve dosya paylaşımı | ✅ | `manage_comments.py`, `manage_attachments.py` |
| SPMS-02.12 | Gantt/takvim görünümü | ✅ | frappe-gantt, FullCalendar entegrasyonu |
| SPMS-02.13 | Sprint yönetimi | ✅ | `manage_sprints.py`, sprints router |
| SPMS-02.14 | Sayfalama (pagination) | ✅ | DTO'larda `total_count`, `page`, `size` |
| SPMS-02.15 | Dosya güvenliği | ✅ | Uzantı filtreleme, max boyut kontrolü |
| **Ek özellik** | Milestone yönetimi | ✅ | `manage_milestones.py` |
| **Ek özellik** | Faz geçişleri (phase transitions) | ✅ | `execute_phase_transition.py` |
| **Ek özellik** | Etiket sistemi | ✅ | `manage_labels.py` |
| **Ek özellik** | Süreç şablonları | ✅ | `apply_process_template.py`, `manage_process_templates.py` |
| **Ek özellik** | Board kolonları | ✅ | `manage_board_columns.py` |

#### 4.2.3 SPMS-03: Bildirim ve Mesajlaşma Modülü

| Gereksinim | Açıklama | Durum | Implementasyon |
|------------|----------|-------|----------------|
| SPMS-03.1 | Gerçek zamanlı bildirimler | ✅ | HTTP polling, `notifications.py` router |
| SPMS-03.2 | Olay bazlı tetikleme | ✅ | `manage_notifications.py` |
| SPMS-03.3 | Rol bazlı mesajlaşma | ✅ | Permission matrix kontrolü |
| SPMS-03.4 | Görev içi yorum | ✅ | `manage_comments.py` |
| SPMS-03.5 | E-posta bildirimleri | ✅ | `fastapi-mail` adaptörü |
| SPMS-03.6 | Bildirim tercihleri | ✅ | `notification_preferences.py` |
| SPMS-03.7 | Mesaj geçmişi koruma | ✅ | Soft delete, audit trail |

#### 4.2.4 SPMS-04: Raporlama ve Analitik Modülü

| Gereksinim | Açıklama | Durum | Implementasyon |
|------------|----------|-------|----------------|
| SPMS-04.1 | İlerleme grafikleri | ✅ | Chart.js, `charts.py` router |
| SPMS-04.2 | Filtre destekli raporlar | ✅ | `generate_reports.py` |
| SPMS-04.3 | PDF/Excel dışa aktarım | ✅ | `fpdf2`, `openpyxl` |
| SPMS-04.4 | Performans metrikleri | ✅ | `get_user_summary.py`, `get_user_activity.py` |
| SPMS-04.5 | Yönetici dashboard | ✅ | `get_admin_stats.py`, `admin_summary.py` |
| **Ek özellik** | CFD (Cumulative Flow Diagram) | ✅ | `get_project_cfd.py` |
| **Ek özellik** | Lead/Cycle Time analizi | ✅ | `get_project_lead_cycle.py` |
| **Ek özellik** | Iteration metrikleri | ✅ | `get_project_iteration.py` |
| **Ek özellik** | Admin PDF özeti | ✅ | `generate_admin_summary_pdf.py` |

#### 4.2.5 SPMS-05: Süreç Modeli Seçimi ve Özelleştirme Modülü

| Gereksinim | Açıklama | Durum | Implementasyon |
|------------|----------|-------|----------------|
| SPMS-05.1 | Scrum/Kanban/Waterfall desteği | ✅ | `services/process_strategy.py` |
| SPMS-05.2 | Süreç şablonları | ✅ | `apply_process_template.py` |
| SPMS-05.3 | Şablon özelleştirme | ✅ | `manage_process_templates.py` |
| SPMS-05.4 | Yeni model tanımlama | ✅ | Strategy interface extension |
| SPMS-05.5 | Otomatik takvim planlama | ✅ | Process template + scheduler |
| SPMS-05.6-05.9 | Modüler görünümler (Kanban/Gantt/liste/takvim) | ✅ | Frontend bileşen kütüphanesi |
| SPMS-05.10 | AI destekli görev önerileri | ✅ | Context-aware öneri motoru |

### 4.3 İşlevsel Olmayan Gereksinimler

#### 4.3.1 Performans Gereksinimleri

| Metrik | Hedef | Ölçüm Yöntemi |
|--------|-------|---------------|
| API yanıt süresi (P50) | < 200 ms | Async middleware loglama |
| API yanıt süresi (P95) | < 1000 ms | Locust ile yük testi |
| API yanıt süresi (P99) | < 5000 ms | Production monitoring |
| Eş zamanlı kullanıcı | 100+ | FastAPI async + connection pooling |
| Sayfa yükleme süresi | < 2 sn | Next.js SSR + lazy loading |
| Maksimum CPU kullanımı | < 75% | Docker resource limits |

#### 4.3.2 Güvenlik Gereksinimleri

| Alan | Standart | Uygulama |
|------|----------|----------|
| Kimlik Doğrulama | JWT (RFC 7519) | python-jose, 30 dk access token |
| Parola Saklama | bcrypt (BSI önerileri) | passlib, cost factor 12 |
| İletişim Şifreleme | TLS 1.3 (RFC 8446) | HTTPS zorunluluğu |
| Yetkilendirme | RBAC + Permission Matrix | Resource × Action matrix |
| SQL Injection | OWASP A03 | SQLAlchemy ORM, parametreli sorgular |
| XSS | OWASP A03 | React JSX otomatik kaçış |
| CSRF | OWASP | SameSite cookie + JWT header |
| Brute Force | OWASP A07 | slowapi rate limiting, hesap kilitleme |
| Dosya Güvenliği | OWASP | Uzantı whitelist, boyut limiti |
| Veri Mahremiyeti | KVKK, GDPR | Veri minimizasyonu, soft delete |

#### 4.3.3 Kullanılabilirlik Gereksinimleri

| Kriter | Hedef | Doğrulama |
|--------|-------|-----------|
| Erişilebilirlik | WCAG 2.1 AA | axe-core otomatik tarama |
| Responsive tasarım | 320px - 4K | Manuel test (mobil, tablet, desktop) |
| Klavye navigasyonu | Tüm aksiyonlar | Manuel test |
| Renk kontrastı | 4.5:1 (normal), 3:1 (büyük) | Tailwind tema sistemi |
| Yükleme animasyonu | < 200 ms gecikme | Suspense, Skeleton |

#### 4.3.4 Sürdürülebilirlik Gereksinimleri

- **Modülerlik:** Her yeni özellik mevcut kodu değiştirmeden eklenebilmeli (OCP)
- **Test Coverage:** Use Case katmanı için en az %85, domain katmanı için %95
- **Dokümantasyon:** Tüm public API'lar Swagger ile otomatik dokümante
- **CI/CD:** Her commit için otomatik test ve build
- **Migration Yönetimi:** Tüm şema değişiklikleri Alembic ile versiyonlanmış

### 4.4 Gereksinim İzlenebilirlik Matrisi

Sistemdeki her gereksinim, hem SDD'deki tasarım kararına hem de gerçekleştirilen koda izlenebilir kılınmıştır. Örnek matris:

| SRS Req | SDD Tasarım | Domain Entity | Use Case | API Endpoint | Test |
|---------|-------------|---------------|----------|--------------|------|
| SPMS-01.1 | AUTH-MOD-§5.1 | User | RegisterUserUseCase | POST /auth/register | test_register_user.py |
| SPMS-02.13 | TASK-MOD-§5.2 | Sprint | CreateSprintUseCase | POST /sprints | test_sprint_lifecycle.py |
| SPMS-04.1 | REPORT-MOD-§5.4 | (read model) | GetProjectCFDQuery | GET /reports/cfd | test_cfd_calculation.py |
| SPMS-05.1 | PROCESS-MOD-§5.5 | ProcessStrategy | ApplyProcessTemplateUseCase | POST /process-templates | test_strategy_factory.py |

---

## 5. SİSTEM MİMARİSİ VE TASARIM

### 5.1 Mimari Felsefe: Clean Architecture

SPMS, Robert C. Martin'in "Clean Architecture" kitabında ortaya koyduğu prensipler üzerine inşa edilmiştir [15]. Bu yaklaşımın temel kuralı **Bağımlılık Kuralı (The Dependency Rule)** olarak bilinir:

> *Kaynak kod bağımlılıkları yalnızca dışarıdan içe doğru akabilir. İçteki hiçbir katman, dıştaki bir katman hakkında hiçbir şey bilmemelidir.*

Bu kural, sistemin tüm dış kaygılardan (veritabanı, web framework, UI) bağımsız bir **iş mantığı çekirdeği** oluşturmasını sağlar. Sonuç olarak:

- Veritabanı değiştirilebilir (PostgreSQL → MongoDB)
- Web framework değiştirilebilir (FastAPI → Flask → Django)
- UI değiştirilebilir (Next.js → SvelteKit → mobil uygulama)
- Bu değişikliklerin hiçbiri iş kurallarını içeren Domain ve Application katmanlarını etkilemez

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                  🔵 PRESENTATION (API) KATMANI                   │
│                                                                  │
│    FastAPI Routers · Dependency Injection · OpenAPI Şemaları   │
│    ┌──────────────────────────────────────────────────────┐     │
│    │                                                       │     │
│    │       🔴 INFRASTRUCTURE KATMANI                       │     │
│    │                                                       │     │
│    │  SQLAlchemy · Repositories · Adapters · SMTP · OAuth  │     │
│    │   ┌────────────────────────────────────────────┐    │     │
│    │   │                                             │    │     │
│    │   │       🟡 APPLICATION KATMANI                │    │     │
│    │   │                                             │    │     │
│    │   │  Use Cases · DTOs · Ports (Interfaces)     │    │     │
│    │   │   ┌──────────────────────────────────┐    │    │     │
│    │   │   │                                   │    │    │     │
│    │   │   │     🟢 DOMAIN KATMANI             │    │    │     │
│    │   │   │                                   │    │    │     │
│    │   │   │  Entities · Repository ABCs       │    │    │     │
│    │   │   │  Domain Services · Exceptions     │    │    │     │
│    │   │   │  İş Kuralları (Saf Python)        │    │    │     │
│    │   │   │                                   │    │    │     │
│    │   │   └──────────────────────────────────┘    │    │     │
│    │   │                                             │    │     │
│    │   └────────────────────────────────────────────┘    │     │
│    │                                                       │     │
│    └──────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

         ← Bağımlılıklar yalnızca DIŞARIDAN İÇERİ akar →
```

### 5.2 Katman Detayları

#### 5.2.1 🟢 Domain Katmanı (`app/domain/`)

Sistemin **işlemsel çekirdeği**. Hiçbir framework'e bağımlı değildir; yalnızca Python standart kütüphanesi ve Pydantic kullanır. Buradaki kurallar sistemin değişmez iş gerçeklerini temsil eder.

**Alt klasörler:**
- `entities/` — Domain varlıkları (Pydantic modelleri)
- `repositories/` — Abstract Base Class olarak repository arayüzleri
- `services/` — Saf domain mantığı (process strategy, validators)
- `interfaces/` — Diğer domain arayüzleri
- `exceptions.py` — Domain özel istisnaları

**Örnek Entity:**
```python
# app/domain/entities/task.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Task(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    project_id: UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    assigned_to: UUID | None
    parent_task_id: UUID | None
    sprint_id: UUID | None
    due_date: datetime | None
    is_recurring: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
    
    def can_transition_to(self, new_status: TaskStatus, strategy: 'ProcessStrategy') -> bool:
        """Domain logic — process strategy ile doğrulama"""
        return strategy.validate_transition(self.status, new_status)
```

**Örnek Repository Interface:**
```python
# app/domain/repositories/task_repository.py
from abc import ABC, abstractmethod
from uuid import UUID
from app.domain.entities.task import Task

class ITaskRepository(ABC):
    @abstractmethod
    async def get_by_id(self, task_id: UUID) -> Task | None: ...
    
    @abstractmethod
    async def list_by_project(self, project_id: UUID, page: int, size: int) -> tuple[list[Task], int]: ...
    
    @abstractmethod
    async def save(self, task: Task) -> Task: ...
    
    @abstractmethod
    async def soft_delete(self, task_id: UUID) -> None: ...
```

#### 5.2.2 🟡 Application Katmanı (`app/application/`)

İş akışlarını **orkestre eden** katman. Yalnızca Domain'e bağımlıdır; herhangi bir veritabanı, HTTP veya UI bilgisi içermez.

**Alt klasörler:**
- `use_cases/` — Tek sorumluluklu iş akış sınıfları (60+ adet)
- `dtos/` — Data Transfer Object'ler (girdi/çıktı modelleri)
- `ports/` — Harici servisler için soyut arayüzler
- `services/` — Application-level yardımcı servisler

**Örnek Use Case:**
```python
# app/application/use_cases/manage_tasks.py
class CreateTaskUseCase:
    def __init__(
        self,
        task_repo: ITaskRepository,
        project_repo: IProjectRepository,
        notification_port: INotificationPort,
        audit_logger: IAuditLogger,
    ):
        self._task_repo = task_repo
        self._project_repo = project_repo
        self._notification_port = notification_port
        self._audit_logger = audit_logger
    
    async def execute(self, dto: TaskCreateDTO, user_id: UUID) -> TaskResponseDTO:
        # 1. Yetki kontrolü
        project = await self._project_repo.get_by_id(dto.project_id)
        if not project.has_member(user_id):
            raise UnauthorizedAccessError()
        
        # 2. Domain kurallarını uygula
        strategy = ProcessStrategyFactory.create(project.methodology)
        if not strategy.can_add_task(project, dto):
            raise TaskLimitExceededError()
        
        # 3. Mükerrer kontrol
        similar = await self._task_repo.find_similar(dto.title, dto.project_id)
        if similar:
            raise SimilarTaskWarning(similar)
        
        # 4. Entity oluştur ve kaydet
        task = Task(...)
        saved_task = await self._task_repo.save(task)
        
        # 5. Audit log ve bildirim
        await self._audit_logger.log_creation(saved_task, user_id)
        if dto.assigned_to:
            await self._notification_port.notify_assignment(saved_task)
        
        return TaskResponseDTO.from_entity(saved_task)
```

**Örnek Port:**
```python
# app/application/ports/notification_port.py
from abc import ABC, abstractmethod

class INotificationPort(ABC):
    @abstractmethod
    async def notify_assignment(self, task: Task) -> None: ...
    
    @abstractmethod
    async def notify_status_change(self, task: Task, old_status: TaskStatus) -> None: ...
    
    @abstractmethod
    async def notify_comment(self, comment: Comment) -> None: ...
```

#### 5.2.3 🔴 Infrastructure Katmanı (`app/infrastructure/`)

Soyutlamaları **gerçek dünya teknolojileriyle** uygulayan katman.

**Alt klasörler:**
- `database/models/` — SQLAlchemy ORM modelleri
- `database/repositories/` — Repository arayüzlerinin SQLAlchemy implementasyonları
- `adapters/` — Harici servis adaptörleri (SMTP, dosya, scheduler)

**Örnek Repository Implementation:**
```python
# app/infrastructure/database/repositories/sqlalchemy_task_repository.py
class SqlAlchemyTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def get_by_id(self, task_id: UUID) -> Task | None:
        result = await self._session.execute(
            select(TaskModel)
            .where(TaskModel.id == task_id)
            .where(TaskModel.is_deleted == False)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list_by_project(self, project_id: UUID, page: int, size: int):
        total = await self._session.scalar(
            select(func.count()).select_from(TaskModel)
            .where(TaskModel.project_id == project_id)
        )
        result = await self._session.execute(
            select(TaskModel)
            .where(TaskModel.project_id == project_id)
            .offset((page - 1) * size)
            .limit(size)
        )
        models = result.scalars().all()
        return [self._to_entity(m) for m in models], total
    
    @staticmethod
    def _to_entity(model: TaskModel) -> Task:
        return Task.model_validate(model)
```

#### 5.2.4 🔵 Presentation (API) Katmanı (`app/api/`)

HTTP dünyası ile iç sistemin **birleşim noktası**. FastAPI router'ları, dependency injection container ve OpenAPI şemalarını içerir.

**Alt klasörler:**
- `v1/` — Versiyonlu API router'ları (30+ router)
- `deps/` — Dependency injection için yardımcılar
- `dependencies.py` — Ana DI container

**Örnek Router:**
```python
# app/api/v1/tasks.py
@router.post("/", response_model=TaskResponseDTO, status_code=201)
async def create_task(
    dto: TaskCreateDTO,
    current_user: User = Depends(get_current_user),
    use_case: CreateTaskUseCase = Depends(get_create_task_use_case),
):
    """Yeni görev oluşturur. Permission matrix ile yetki kontrolü yapılır."""
    try:
        return await use_case.execute(dto, current_user.id)
    except SimilarTaskWarning as e:
        raise HTTPException(409, detail={"warning": "similar_task", "tasks": e.similar})
    except TaskLimitExceededError:
        raise HTTPException(400, detail="WIP limit exceeded")
```

**Örnek DI Container:**
```python
# app/api/dependencies.py
async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

def get_task_repo(session: AsyncSession = Depends(get_db_session)) -> ITaskRepository:
    return SqlAlchemyTaskRepository(session)

def get_create_task_use_case(
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    notification_port: INotificationPort = Depends(get_notification_port),
    audit_logger: IAuditLogger = Depends(get_audit_logger),
) -> CreateTaskUseCase:
    return CreateTaskUseCase(task_repo, project_repo, notification_port, audit_logger)
```

### 5.3 Dizin Yapısı (Gerçek Proje)

```
project-management-system/
├── Backend/                              # Python/FastAPI uygulaması
│   ├── app/
│   │   ├── domain/                       # 🟢 PURE PYTHON
│   │   │   ├── entities/                 # User, Project, Task, Sprint, Comment...
│   │   │   ├── repositories/             # ITaskRepository, IUserRepository... (ABC)
│   │   │   ├── services/                 # ProcessStrategy, Validators
│   │   │   ├── interfaces/               # Diğer port'lar
│   │   │   └── exceptions.py
│   │   ├── application/                  # 🟡 ORCHESTRATION
│   │   │   ├── use_cases/                # 60+ Use Case sınıfı
│   │   │   ├── dtos/                     # Request/Response modelleri
│   │   │   ├── ports/                    # INotificationPort, IEmailPort...
│   │   │   └── services/                 # Application servisleri
│   │   ├── infrastructure/               # 🔴 IMPLEMENTATIONS
│   │   │   └── database/                 # SQLAlchemy modeller + repository impl.
│   │   ├── api/                          # 🔵 PRESENTATION
│   │   │   ├── v1/                       # 30+ router (auth, tasks, projects...)
│   │   │   ├── deps/                     # DI yardımcıları
│   │   │   └── dependencies.py
│   │   └── scheduler/                    # APScheduler tabanlı arka plan işler
│   ├── alembic/                          # Veritabanı migration'ları
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/                         # Birim testleri
│   │   ├── integration/                  # Entegrasyon testleri
│   │   └── factories/                    # Test data factory'leri
│   ├── static/uploads/                   # Yüklenen dosyalar
│   ├── docker-compose.yaml
│   ├── requirements.txt
│   └── pytest.ini
│
├── New_Frontend/                         # Next.js uygulaması
│   └── src/
│       └── pages/                        # React sayfaları, bileşenler
│
└── docs/                                 # Proje dokümantasyonu
    ├── srs.md                            # Software Requirements Specification
    ├── sdd.md                            # Software Design Description
    ├── report.md                         # Dönem sonu raporu
    ├── kapsamli_proje_raporu.md          # Bu doküman
    └── sdd_revizyon.md                   # SDD revizyon notları
```

### 5.4 Veri Modeli

#### 5.4.1 Veritabanı Şeması (ERD Özeti)

SPMS, 14 ana tablodan oluşan ilişkisel bir şema kullanmaktadır:

```
USERS ─────< PROJECT_MEMBERS >──── PROJECTS
  │                                    │
  │                                    ├──< TASKS ──< COMMENTS
  │                                    │     │       └──< ATTACHMENTS
  │                                    │     ├──< TASK_DEPENDENCIES
  │                                    │     ├──< RECURRING_TASKS
  │                                    │     └──< AUDIT_LOGS
  │                                    │
  │                                    ├──< SPRINTS
  │                                    ├──< BOARD_COLUMNS
  │                                    ├──< MILESTONES
  │                                    ├──< LABELS
  │                                    └──< PROCESS_TEMPLATES
  │
  ├──< NOTIFICATIONS
  ├──< NOTIFICATION_PREFERENCES
  ├──< PASSWORD_RESET_TOKENS
  ├──< JOIN_REQUESTS
  │
  └─< (M:M)─ TEAMS ──< TEAM_MEMBERS
                └─ROLES ──< PERMISSION_MATRIX
```

#### 5.4.2 Tablo Tanımları

| Tablo | Birincil Sütunlar | İlişki |
|-------|-------------------|--------|
| **users** | id (UUID), email, password_hash, full_name, role, is_active, created_at | 1:N tasks, projects |
| **projects** | id, name, description, methodology, owner_id, start_date, end_date, status | N:M users (via project_members) |
| **project_members** | project_id, user_id, role, joined_at | Bridge table |
| **tasks** | id, project_id, title, description, status, priority, assigned_to, parent_task_id, sprint_id, due_date, is_recurring, story_points | 1:N comments, attachments |
| **sprints** | id, project_id, name, start_date, end_date, status, goal | 1:N tasks |
| **task_dependencies** | task_id, depends_on_task_id, dependency_type | Bridge table |
| **comments** | id, task_id, user_id, content, created_at | N:1 task, user |
| **attachments** | id, task_id, comment_id, file_path, file_name, file_size, mime_type | N:1 task/comment |
| **notifications** | id, user_id, type, payload, is_read, created_at | N:1 user |
| **notification_preferences** | user_id, channel, event_type, enabled | N:1 user |
| **audit_logs** | id, entity_type, entity_id, action, user_id, old_value, new_value, timestamp | Generic log |
| **board_columns** | id, project_id, name, order, wip_limit | N:1 project |
| **milestones** | id, project_id, name, target_date, status | N:1 project |
| **labels** | id, project_id, name, color | N:1 project |
| **process_templates** | id, methodology, name, configuration (JSON) | Standalone |
| **password_reset_tokens** | id, user_id, token, expires_at, used_at | N:1 user |
| **join_requests** | id, project_id, user_id, status, requested_at, processed_at | N:1 project, user |

#### 5.4.3 Önemli Tasarım Kararları

**Hiyerarşik Görev Yapısı:**
`tasks` tablosu kendi kendine referans verir (`parent_task_id` → `tasks.id`). Bu sayede alt görevler ve hiyerarşik proje yapıları sınırsız derinlikte desteklenir. Performans için bir görev en fazla 5 seviye derinliğe kadar girintilenir; daha derin yapılar UI'da grup başlığı olarak gösterilir.

**Dinamik Kanban Kolonları:**
Görev durumları kod içinde sabitlenmemiştir. Her proje, `board_columns` tablosunda kendi kolon setini tanımlayabilir (örn. "Analiz → Geliştirme → Code Review → Test → Canlı"). Bu, farklı ekiplerin kendi iş akışlarına özelleşmesini sağlar.

**Audit Trail (Tarihsel İzleme):**
`audit_logs` tablosu tüm kritik değişiklikleri JSON formatında saklar:
```json
{
  "entity_type": "task",
  "entity_id": "uuid",
  "action": "status_change",
  "user_id": "uuid",
  "old_value": {"status": "in_progress"},
  "new_value": {"status": "done"},
  "timestamp": "2026-05-17T14:23:11Z"
}
```
Bu yapı, burndown chart hesaplama, regülatif denetim ve kullanıcı aktivite raporları için temel veriyi sağlar.

**Soft Delete:**
Hiçbir kritik veri kalıcı olarak silinmez. `is_deleted` (veya `deleted_at`) bayrakları kullanılır. Bu sayede:
- Yanlışlıkla silinen veriler kurtarılabilir.
- Audit log bütünlüğü korunur.
- Foreign key kısıtlamaları kırılmaz.

**Sayfalama (Pagination):**
Tüm liste endpoint'leri `page` ve `size` parametrelerini kabul eder. Yanıt formatı:
```json
{
  "items": [...],
  "total": 142,
  "page": 2,
  "size": 20,
  "total_pages": 8
}
```

### 5.5 Süreç Modeli Stratejileri (Strategy Pattern)

SPMS'nin en kritik mimari kararlarından biri, üç farklı proje metodolojisini polimorfik biçimde desteklemektir. CLAUDE.md'de açıkça belirtilen "**Do NOT use: `if project.type == 'SCRUM'`**" kuralı doğrultusunda Strategy Pattern uygulanmıştır.

```python
# app/domain/services/process_strategy.py
from abc import ABC, abstractmethod

class ProcessStrategy(ABC):
    @abstractmethod
    def validate_task_transition(self, task: Task, new_status: TaskStatus) -> bool: ...
    
    @abstractmethod
    def get_default_columns(self) -> list[BoardColumn]: ...
    
    @abstractmethod
    def can_add_task(self, project: Project, task_dto: TaskCreateDTO) -> bool: ...
    
    @abstractmethod
    def calculate_progress(self, project: Project) -> ProgressMetric: ...


class ScrumStrategy(ProcessStrategy):
    """Sprint tabanlı, story point hesaplı, burndown chart üretir."""
    
    def validate_task_transition(self, task, new_status):
        # Sprint dışı görevler done yapılamaz
        if new_status == TaskStatus.DONE and not task.sprint_id:
            raise InvalidTransitionError("Task must be in a sprint to be marked done")
        return True
    
    def get_default_columns(self):
        return [
            BoardColumn(name="Backlog", order=0),
            BoardColumn(name="To Do", order=1),
            BoardColumn(name="In Progress", order=2),
            BoardColumn(name="Review", order=3),
            BoardColumn(name="Done", order=4),
        ]
    
    def calculate_progress(self, project):
        return BurndownCalculator.compute(project.active_sprint)


class KanbanStrategy(ProcessStrategy):
    """WIP limit kontrolü, Cumulative Flow Diagram üretir."""
    
    def can_add_task(self, project, task_dto):
        target_column = project.get_column(task_dto.status)
        if target_column.wip_limit:
            current_count = project.count_tasks_in_column(target_column.id)
            if current_count >= target_column.wip_limit:
                raise WIPLimitExceededError(target_column)
        return True
    
    def get_default_columns(self):
        return [
            BoardColumn(name="To Do", order=0, wip_limit=None),
            BoardColumn(name="In Progress", order=1, wip_limit=3),
            BoardColumn(name="Review", order=2, wip_limit=2),
            BoardColumn(name="Done", order=3, wip_limit=None),
        ]
    
    def calculate_progress(self, project):
        return CFDCalculator.compute(project)


class WaterfallStrategy(ProcessStrategy):
    """Bağımlılık zorunluluğu, faz tabanlı ilerleme."""
    
    def validate_task_transition(self, task, new_status):
        if new_status == TaskStatus.IN_PROGRESS:
            unmet = [d for d in task.dependencies if d.status != TaskStatus.DONE]
            if unmet:
                raise DependencyNotMetError(unmet)
        return True
    
    def get_default_columns(self):
        # Aşama tabanlı
        return [
            BoardColumn(name="Requirements", order=0),
            BoardColumn(name="Design", order=1),
            BoardColumn(name="Implementation", order=2),
            BoardColumn(name="Testing", order=3),
            BoardColumn(name="Deployment", order=4),
        ]
    
    def calculate_progress(self, project):
        return PhaseProgressCalculator.compute(project)


# Factory
class ProcessStrategyFactory:
    _strategies = {
        ProjectMethodology.SCRUM: ScrumStrategy,
        ProjectMethodology.KANBAN: KanbanStrategy,
        ProjectMethodology.WATERFALL: WaterfallStrategy,
    }
    
    @classmethod
    def create(cls, methodology: ProjectMethodology) -> ProcessStrategy:
        strategy_class = cls._strategies.get(methodology)
        if not strategy_class:
            raise UnsupportedMethodologyError(methodology)
        return strategy_class()
    
    @classmethod
    def register(cls, methodology: ProjectMethodology, strategy_class: type[ProcessStrategy]):
        """Open/Closed Principle: Yeni metodoloji eklemek için bu metodu çağırın."""
        cls._strategies[methodology] = strategy_class
```

Bu tasarım sayesinde **yeni bir metodoloji eklemek için mevcut kodu değiştirmek gerekmez** — yalnızca yeni bir `ProcessStrategy` sınıfı yazıp factory'ye kayıt etmek yeterlidir. Bu, **Open/Closed Principle**'ın canlı bir uygulamasıdır.

### 5.6 Güvenlik Mimarisi

#### 5.6.1 Çok Katmanlı Güvenlik (Defense in Depth)

```
İstemci (Browser/Mobile)
    │ HTTPS / TLS 1.3 şifreli iletişim
    ▼
┌─────────────────────────────────────┐
│  1. CORS Doğrulama                  │  ← Yalnızca güvenilir origin'ler
│     (FastAPI middleware)            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  2. Rate Limiting                   │  ← Brute force ve DoS koruması
│     (slowapi: 60 req/min/endpoint)  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  3. JWT Doğrulama                   │  ← Imza ve geçerlilik kontrolü
│     (python-jose, HS256, 30 dk)     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  4. RBAC + Permission Matrix        │  ← Kaynak × Aksiyon kontrolü
│     (resource_action permission)    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  5. Input Validation                │  ← Pydantic v2 ile
│     (DTO field validators)          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  6. Use Case İş Mantığı             │  ← Domain kuralları
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  7. ORM (SQLAlchemy)                │  ← SQL Injection koruması
│     Parametreli sorgular            │
└─────────────────────────────────────┘
    │
    ▼
PostgreSQL (TLS bağlantı, prepared statements)
```

#### 5.6.2 Parola Yönetimi

- **Hash Algoritması:** bcrypt (cost factor 12)
- **Saklama:** Yalnızca hash; düz metin asla saklanmaz
- **Parola Politikası:** Min 8 karakter, en az 1 büyük harf, 1 rakam, 1 özel karakter (frontend doğrulama + backend ek kontrol)
- **Sıfırlama:** Kriptografik olarak güvenli rastgele token (`secrets.token_urlsafe(32)`), 30 dakika geçerlilik, tek kullanım

#### 5.6.3 Hesap Güvenliği

- **Hesap Kilitleme:** 5 başarısız giriş denemesinde 15 dakika geçici kilit
- **Oturum Yönetimi:** JWT access token (30 dk) + refresh token (7 gün)
- **Otomatik Çıkış:** Inaktif kullanıcı 30 dakika sonra çıkarılır
- **İki Faktörlü Doğrulama:** Gelecek sürüm için planlandı (TOTP altyapısı hazır)

### 5.7 Frontend Mimarisi

#### 5.7.1 Teknoloji Yığını

| Katman | Teknoloji | Amaç |
|--------|-----------|------|
| **Framework** | Next.js 15 (App Router) | SSR/SSG, route handlers, server components |
| **Dil** | TypeScript 5.x | Tip güvenli geliştirme |
| **Stil** | Tailwind CSS 3.x | Utility-first CSS |
| **UI Kit** | shadcn/ui | Erişilebilir, özelleştirilebilir bileşenler |
| **Drag-Drop** | @dnd-kit | Kanban panosu |
| **Gantt** | frappe-gantt | Zaman çizelgesi |
| **Takvim** | FullCalendar | Olay/görev takvimi |
| **Grafik** | Chart.js | Burndown, CFD, dashboard grafikleri |
| **HTTP** | Axios | Interceptor ile JWT yönetimi |
| **Validasyon** | Zod | Form ve API yanıt şemaları |
| **State** | React Context + SWR | Server state caching |
| **Form** | React Hook Form | Form yönetimi |

#### 5.7.2 Bileşen Mimarisi

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, register, password reset
│   ├── (dashboard)/            # Authenticated dashboard
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── sprints/
│   │   ├── reports/
│   │   └── admin/
│   └── api/                    # Route handlers (proxy)
├── components/
│   ├── ui/                     # shadcn/ui bileşenleri
│   ├── kanban/                 # Kanban board, KanbanColumn, TaskCard
│   ├── gantt/                  # Gantt chart wrapper
│   ├── calendar/               # FullCalendar wrapper
│   ├── charts/                 # Burndown, CFD, dashboard chart'ları
│   ├── forms/                  # Reusable form bileşenleri
│   └── shared/                 # Header, Sidebar, etc.
├── lib/
│   ├── api/                    # Axios client + endpoint'ler
│   ├── auth/                   # JWT yönetimi, auth context
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Yardımcı fonksiyonlar
└── types/                      # TypeScript tip tanımları
```

#### 5.7.3 Önemli Frontend Kalıpları

**JWT Interceptor:**
```typescript
// lib/api/client.ts
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return axios.request(error.config);
      else redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

**Rol Bazlı Görünürlük:**
```typescript
<PermissionGate permission="project.delete" project={project}>
  <DeleteProjectButton />
</PermissionGate>
```

**SWR Veri Yönetimi:**
```typescript
const { data, error, mutate } = useSWR(
  `/api/projects/${projectId}/tasks?page=${page}`,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 5000 }
);
```

---

## 6. UYGULAMA (IMPLEMENTASYON) DETAYLARI

### 6.1 Geliştirme Süreci ve Metodoloji

Projenin geliştirme süreci, **Scrum metodolojisi** ile yürütülmüş; her iki haftada bir sprint planlaması yapılmıştır. Sprint çıktıları haftalık danışman görüşmelerinde değerlendirilmiş ve gerektiğinde gereksinimler revize edilmiştir.

**Sürüm kontrolü:** Git (GitHub uzak depo) ile feature-branch iş akışı uygulanmıştır. Her özellik için ayrı bir branch açılmış, kod inceleme (peer review) sonrası ana dala (main) merge edilmiştir.

**İş Bölümü:**
İki kişilik ekip içinde modüler bir iş bölümü benimsenmiş, ancak tüm modüller her iki ekip üyesi tarafından gözden geçirilmiştir:

| Ekip Üyesi | Birincil Sorumluluk | İkincil Sorumluluk |
|-----------|---------------------|--------------------| 
| **Ayşe ÖZ** | Backend mimari (Clean Arch., DI), domain modeli, raporlama, AI öneri motoru | Test altyapısı, DevOps |
| **Yusuf Emre BAYRAKCI** | Frontend mimari (Next.js, bileşen kütüphanesi), Kanban/Gantt, kullanıcı arayüzü | API entegrasyonu, kullanılabilirlik testleri |

**Ortak sorumluluklar:** Gereksinim analizi, dokümantasyon (SRS/SDD/STD), güvenlik tasarımı, KVKK/GDPR uyumluluğu.

### 6.2 Birinci Dönem Çalışmaları (BM495 — Güz 2025)

Birinci dönemde sistemin omurgası inşa edilmiştir.

#### 6.2.1 Sprint 1: Proje Kurulumu (Hafta 1-2)

- Git deposu oluşturma, `.gitignore`, README, lisans
- Python sanal ortam (`venv`) ve `requirements.txt` yapılandırması
- Docker Compose ile çok servisli ortam: `postgres`, `backend`, `pgadmin`
- Next.js projesi initialize, TypeScript yapılandırması
- Alembic ile veritabanı migration sistemi
- VS Code, pre-commit hook'ları (ruff, black) kurulumu

#### 6.2.2 Sprint 2: Veri Modeli ve Domain (Hafta 3-4)

- SDD'de tasarlanan ER diyagramının SQLAlchemy modellerine dönüştürülmesi
- `users`, `projects`, `tasks` tabloları ve ilişkilerinin oluşturulması
- Foreign key constraint'leri, index'ler, soft delete altyapısı
- Domain entity'lerinin (Pydantic) yazılması
- Repository abstract base class'larının tanımlanması

#### 6.2.3 Sprint 3: Kimlik Doğrulama (Hafta 5-6)

- `RegisterUserUseCase`, `LoginUserUseCase` implementasyonu
- `passlib` ile bcrypt parola hashleme
- `python-jose` ile JWT oluşturma ve doğrulama
- `auth_router.py` endpoint'leri: `/register`, `/login`, `/me`
- Frontend tarafında login/register sayfaları
- Axios interceptor ile JWT yönetimi

#### 6.2.4 Sprint 4: RBAC ve Yetkilendirme (Hafta 7-8)

- Permission matrix yapısı: kaynak × aksiyon (örn. `project.delete`, `task.update`)
- `get_permission_matrix.py`, `update_permission_matrix.py` use case'leri
- Project member tablosu ve proje bazlı rol mantığı
- FastAPI dependency `require_permission(perm: str)` factory'si
- RBAC entegrasyon testleri (`test_rbac.py`)

#### 6.2.5 Sprint 5: Çekirdek CRUD (Hafta 9-10)

- `CreateProjectUseCase`, `UpdateProjectUseCase`, `ArchiveProjectUseCase`
- `CreateTaskUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase` (soft delete)
- Sayfalama altyapısı (page/size parametreleri)
- Frontend proje ve görev listeleme/oluşturma sayfaları
- Görev kartı bileşeni (TaskCard)

#### 6.2.6 Sprint 6: Dashboard ve Dokümantasyon (Hafta 11-12)

- Yönetici dashboard'u (proje sayısı, görev sayısı, performans özetleri)
- Çalışan dashboard'u ("Görevlerim" listesi)
- Swagger UI ile otomatik API dokümantasyonu
- SRS v1.0 ve SDD v1.0 dokümanlarının tamamlanması
- Dönem sonu raporu hazırlanması

### 6.3 İkinci Dönem Çalışmaları (BM496 — Bahar 2026)

İkinci dönemde sistem tam fonksiyonel hale getirilmiştir.

#### 6.3.1 Sprint 7-8: Süreç Modeli Altyapısı

**Hedef:** Scrum, Kanban, Waterfall metodolojilerinin Strategy Pattern ile soyutlanması.

**Çıktılar:**
- `ProcessStrategy` abstract sınıfı
- `ScrumStrategy`, `KanbanStrategy`, `WaterfallStrategy` implementasyonları
- `ProcessStrategyFactory` ile dinamik metodoloji seçimi
- `process_templates` tablosu ve `apply_process_template.py` use case'i
- Frontend tarafında metodoloji seçimi modal'ı
- Metodolojiye göre dinamik kolon/sprint/Gantt görünümleri

#### 6.3.2 Sprint 9: Sprint Yönetimi (SPMS-02.13)

- `sprints` tablosu ve `Sprint` entity'si
- `CreateSprintUseCase`, `CloseSprintUseCase`, `MoveTasksToNextSprintUseCase`
- Aktif/geçmiş sprint takibi
- Frontend sprint planlama ekranı
- Sprint backlog ve sprint board görünümleri
- Burndown chart hesaplama algoritması:

```python
class BurndownCalculator:
    @staticmethod
    def compute(sprint: Sprint) -> BurndownData:
        total_points = sum(t.story_points for t in sprint.tasks)
        duration_days = (sprint.end_date - sprint.start_date).days
        
        # İdeal çizgi (linear)
        ideal_line = [
            BurndownPoint(
                day=i,
                remaining=total_points * (1 - i/duration_days)
            )
            for i in range(duration_days + 1)
        ]
        
        # Gerçek çizgi (audit log'tan)
        actual_line = []
        remaining = total_points
        for day in range(duration_days + 1):
            day_date = sprint.start_date + timedelta(days=day)
            completed_today = sum(
                t.story_points
                for t in sprint.tasks
                if t.completed_at and t.completed_at.date() == day_date.date()
            )
            remaining -= completed_today
            actual_line.append(BurndownPoint(day=day, remaining=remaining))
        
        return BurndownData(ideal=ideal_line, actual=actual_line)
```

#### 6.3.3 Sprint 10: Kanban ve Sürükle-Bırak (SPMS-UI-02, SPMS-05.7)

- `@dnd-kit` entegrasyonu
- Dinamik board kolonları (`board_columns` tablosundan)
- Sürükle-bırak ile görev taşıma
- WIP limit kontrolü (Kanban metodolojisinde)
- Görev kartı tasarımı: öncelik renkleri, etiketler, atanan kullanıcı avatarı, vade tarihi
- Optimistic UI updates (animasyon ile)

#### 6.3.4 Sprint 11: Gantt ve Takvim Görünümleri (SPMS-02.12, SPMS-05.8)

- `frappe-gantt` entegrasyonu
- Görev bağımlılıklarının çizgilerle gösterimi
- Vade tarihlerinin Gantt üzerinde sürüklenerek değiştirilmesi
- `FullCalendar` ile takvim görünümü
- Tekrarlayan görevlerin takvimde vurgulanması

#### 6.3.5 Sprint 12: Bağımlılıklar ve Tekrarlayan Görevler (SPMS-02.5, SPMS-02.6-8)

- `task_dependencies` tablosu (depends_on, blocks ilişkileri)
- `AddDependencyUseCase`, döngüsel bağımlılık tespiti (DFS algoritması)
- `ValidateTaskCompletionUseCase`: tamamlanmamış bağımlılık varsa hata
- `RecurringTask` entity'si ve `is_recurring` bayrağı
- APScheduler ile arka plan job'ı:

```python
class ProcessRecurringTasksJob:
    @inject
    def __init__(self, task_repo: ITaskRepository):
        self._task_repo = task_repo
    
    async def run(self):
        """Her gece 02:00'de çalışır. Tekrarlayan görevleri tarayıp yeni kopyalar oluşturur."""
        recurring_tasks = await self._task_repo.list_recurring_active()
        for task in recurring_tasks:
            next_date = self._compute_next_occurrence(task)
            if next_date and next_date <= now() + timedelta(days=7):
                # Bitiş kriteri kontrolü
                if task.recurrence_end_date and next_date > task.recurrence_end_date:
                    continue
                if task.recurrence_count_limit and task.occurrence_count >= task.recurrence_count_limit:
                    continue
                
                new_task = task.create_next_occurrence(next_date)
                await self._task_repo.save(new_task)
```

- Frontend "tümünü mü, yalnızca bu örneği mi?" seçim modal'ı

#### 6.3.6 Sprint 13: Yorum, Dosya ve Bildirim Sistemi (SPMS-02.11, SPMS-03)

- `comments` tablosu ve `manage_comments.py`
- `attachments` tablosu ve `manage_attachments.py`
- Dosya güvenliği:
  - Maksimum boyut: 10 MB
  - Yasaklı uzantılar: `.exe`, `.sh`, `.bat`, `.vbs`, `.cmd`, `.com`, `.jar`
  - Mime type doğrulama (`python-magic`)
  - Yüklenen dosyalar `static/uploads/` altında UUID isimleriyle saklanır
- Bildirim sistemi:
  - `notifications` tablosu (user_id, type, payload, is_read)
  - HTTP polling (5 saniye aralıkla `GET /notifications/unread`)
  - Olay tabanlı tetikleme: görev atama, durum değişikliği, yorum, mention
  - E-posta bildirimi: `fastapi-mail` ile SMTP üzerinden
  - Kullanıcı tercihleri: `notification_preferences` tablosu

#### 6.3.7 Sprint 14: Raporlama ve Analitik (SPMS-04)

- Dashboard widget'ları:
  - Proje ilerleme oranı
  - Açık/kapanan görev sayısı
  - Sprint burndown
  - Kullanıcı performans grafiği (zamanında teslim oranı)
- `get_project_cfd.py`: Cumulative Flow Diagram
- `get_project_lead_cycle.py`: Lead time ve cycle time analizi
- PDF dışa aktarım (`fpdf2`):

```python
class GenerateProjectReportPDFUseCase:
    async def execute(self, project_id: UUID) -> bytes:
        project = await self._project_repo.get_by_id(project_id)
        metrics = await self._compute_metrics(project)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, f"Proje Raporu: {project.name}", ln=True)
        
        pdf.set_font("Arial", size=11)
        pdf.cell(0, 8, f"Metodoloji: {project.methodology}", ln=True)
        pdf.cell(0, 8, f"Toplam Görev: {metrics.total_tasks}", ln=True)
        pdf.cell(0, 8, f"Tamamlanan: {metrics.completed_tasks}", ln=True)
        pdf.cell(0, 8, f"İlerleme: {metrics.progress_percentage}%", ln=True)
        
        # Burndown grafiği (matplotlib → PNG → embed)
        chart_image = self._render_burndown_chart(metrics.burndown)
        pdf.image(chart_image, w=180)
        
        return bytes(pdf.output())
```

- Excel dışa aktarım (`openpyxl`): görev listesi, sprint metrikleri, kullanıcı raporları

#### 6.3.8 Sprint 15: Güvenlik Sertleştirme (SPMS-SEC-05, SEC-06, SEC-07)

- Rate limiting (`slowapi`):
  - `/auth/login`: 5 istek/dakika
  - `/auth/register`: 3 istek/dakika
  - Genel endpoint'ler: 60 istek/dakika
- CORS politikası katılaştırma: yalnızca production frontend domain'ine izin
- Parola sıfırlama akışı:
  - `POST /auth/password-reset/request` → token oluştur, e-posta gönder
  - `POST /auth/password-reset/confirm` → token doğrula, parolayı güncelle
- Hesap kilitleme: 5 başarısız girişte 15 dakika kilit
- Audit log: tüm kritik işlemler için (`admin_audit.py`)
- KVKK/GDPR uyumluluğu: veri silme talepleri için soft delete + 30 gün sonra hard delete cron job

#### 6.3.9 Sprint 16: AI Destekli Görev Önerileri (SPMS-05.10)

- Bağlam analizi: aktif görevler, proje açıklaması, metodoloji, ekip üyeleri
- Öneri motoru:
  - Proje açıklamasından anahtar kelimeler çıkarma (TF-IDF)
  - Benzer projelerden tipik görev şablonları
  - Eksik aşama tespiti (örn. tüm görevler "development" kategorisinde ise "testing" görevleri öner)
- Frontend: görev oluşturma modal'ında "Öneriler" sekmesi
- Kullanıcı önerileri reddedebilir veya öneriyi düzenleyerek kabul edebilir

#### 6.3.10 Sprint 17: Admin Paneli ve Sistem Yönetimi

- Kullanıcı yönetimi: listeleme, rol değiştirme, aktif/pasif yapma
- `admin_users.py`, `admin_roles.py`, `admin_audit.py`, `admin_stats.py`
- Sistem ayarları: e-posta SMTP yapılandırması, varsayılan değerler
- Sistem geneli istatistikleri: toplam kullanıcı, aktif proje, tamamlanma oranları
- Admin PDF özet raporu (`generate_admin_summary_pdf.py`)

#### 6.3.11 Sprint 18: Final ve Polish

- Performans optimizasyonu (N+1 query'lerin tespiti ve düzeltilmesi)
- Erişilebilirlik denetimi (axe-core)
- Production Docker imajı optimizasyonu (multi-stage build)
- Tüm dokümantasyonun güncellenmesi (SRS v1.1, SDD v1.1, STD)
- Bu kapsamlı raporun hazırlanması

### 6.4 Kritik Algoritmaların Detaylı Açıklaması

#### 6.4.1 Döngüsel Bağımlılık Tespiti (DFS)

Görevler arası bağımlılık eklenirken döngü oluşmasını engellemek kritiktir. Yoksa "A, B'yi bekliyor; B, A'yı bekliyor" gibi sonsuz bekleme durumları oluşur.

```python
class DependencyValidator:
    @staticmethod
    def has_cycle(task_id: UUID, depends_on_id: UUID, repo: ITaskRepository) -> bool:
        """DFS ile döngü tespiti. Yeni bağımlılık eklenmeden önce kontrol edilmelidir."""
        visited = set()
        stack = [depends_on_id]
        
        while stack:
            current = stack.pop()
            if current == task_id:
                return True  # Döngü tespit edildi!
            if current in visited:
                continue
            visited.add(current)
            
            current_task = repo.get_by_id_sync(current)
            stack.extend([d.depends_on_id for d in current_task.dependencies])
        
        return False
```

#### 6.4.2 Cumulative Flow Diagram (CFD) Hesaplama

Kanban projelerinde CFD, her gün her kolondaki görev sayısını gösteren bir grafiktir.

```python
class CFDCalculator:
    @staticmethod
    async def compute(project_id: UUID, days: int = 30) -> CFDData:
        """Son N günde, her gün her kolondaki görev sayısı."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Audit log'tan tüm status_change olaylarını çek
        events = await audit_repo.list_status_changes(project_id, start_date, end_date)
        
        # Günlük snapshot oluştur
        result = {}
        for day_offset in range(days + 1):
            day = start_date + timedelta(days=day_offset)
            snapshot = await CFDCalculator._reconstruct_snapshot(project_id, day, events)
            result[day] = snapshot
        
        return CFDData(daily_snapshots=result)
```

#### 6.4.3 Lead Time ve Cycle Time Analizi

- **Lead Time:** Görevin oluşturulduğu andan tamamlandığı ana kadar geçen süre
- **Cycle Time:** Görevin "in_progress" olduğu andan tamamlandığı ana kadar geçen süre

```python
class LeadCycleAnalyzer:
    @staticmethod
    def compute_for_task(task: Task, audit_logs: list[AuditLog]) -> TaskTimingMetrics:
        created_at = task.created_at
        in_progress_at = next(
            (log.timestamp for log in audit_logs
             if log.new_value.get("status") == "in_progress"),
            None
        )
        completed_at = next(
            (log.timestamp for log in audit_logs
             if log.new_value.get("status") == "done"),
            None
        )
        
        lead_time = (completed_at - created_at).total_seconds() / 3600 if completed_at else None
        cycle_time = (completed_at - in_progress_at).total_seconds() / 3600 if completed_at and in_progress_at else None
        
        return TaskTimingMetrics(lead_time_hours=lead_time, cycle_time_hours=cycle_time)
```

#### 6.4.4 AI Destekli Görev Önerisi

```python
class TaskSuggestionEngine:
    def __init__(self, task_repo: ITaskRepository, template_repo: ITemplateRepository):
        self._task_repo = task_repo
        self._template_repo = template_repo
    
    async def suggest_tasks(self, project: Project) -> list[TaskSuggestion]:
        suggestions = []
        
        # 1. Mevcut görev başlıklarından kategorileri çıkar
        existing_tasks = await self._task_repo.list_by_project(project.id)
        categories = self._extract_categories(existing_tasks)
        
        # 2. Metodolojiye özgü eksik kategorileri tespit et
        expected = self._expected_categories(project.methodology)
        missing = expected - categories
        
        # 3. Her eksik kategori için şablon görev öner
        for cat in missing:
            templates = await self._template_repo.get_by_category(cat)
            for tmpl in templates[:3]:  # Her kategoriden en fazla 3 öneri
                suggestions.append(TaskSuggestion(
                    title=tmpl.title.format(project_name=project.name),
                    description=tmpl.description,
                    category=cat,
                    confidence=tmpl.confidence_score,
                ))
        
        # 4. Sırala (confidence'a göre)
        return sorted(suggestions, key=lambda s: s.confidence, reverse=True)
```

### 6.5 Kullanılan Tasarım Desenleri (Design Patterns)

| Desen | Kullanım Yeri | Amaç |
|-------|---------------|------|
| **Repository** | Domain ↔ Infrastructure | Veritabanı detaylarını domain'den izole eder |
| **Strategy** | ProcessStrategy hiyerarşisi | Metodoloji polimorfizmi (OCP) |
| **Factory** | ProcessStrategyFactory | Metodolojiye göre strateji yaratma |
| **Dependency Injection** | FastAPI Depends | Sınıflar arası gevşek bağlılık |
| **Use Case (Command)** | application/use_cases/ | Tek sorumluluk per işlem |
| **DTO** | application/dtos/ | API ↔ Domain çevirisi |
| **Adapter** | infrastructure/adapters/ | Harici servis soyutlaması |
| **Observer (event-driven)** | Notification sistemi | Modüller arası gevşek iletişim |
| **Specification** | Filter sorgular | Kompleks koşulların kapsüllenmesi |
| **Builder** | DTO yapımı | Aşamalı nesne kurulumu |

---

## 7. TEST VE DOĞRULAMA

### 7.1 Test Stratejisi

SPMS'nin test altyapısı **test piramidi** prensibine göre tasarlanmıştır:

```
              ┌──────────┐
              │ E2E (5%) │       Playwright — kritik akışlar
            ┌─┴──────────┴─┐
            │Integration   │     Pytest + TestClient — API
            │   (25%)      │
        ┌───┴──────────────┴───┐
        │   Unit Tests (70%)   │  Pytest — domain & use cases
        └──────────────────────┘
```

### 7.2 Test Kapsamı

| Test Türü | Sayı | Kapsam | Çalışma Süresi |
|-----------|------|--------|----------------|
| **Birim Testleri** | ~250 | Domain entity'leri, use case'ler, validators, calculators | ~12 sn |
| **Entegrasyon Testleri** | ~80 | API endpoint'leri, RBAC, DB işlemleri | ~45 sn |
| **E2E Testleri** | ~20 | Login → proje oluştur → sprint → görev akışı | ~3 dk |
| **Performans Testleri** | ~10 | Locust ile yük testi | Manuel |
| **Güvenlik Testleri** | ~30 | OWASP senaryoları, JWT manipülasyon, SQL injection | ~30 sn |
| **TOPLAM** | **~390** | | **~5 dk** |

### 7.3 Test Örnekleri

#### 7.3.1 Birim Test: ProcessStrategy

```python
# tests/unit/test_process_strategy.py
import pytest
from app.domain.services.process_strategy import (
    ProcessStrategyFactory, ScrumStrategy, KanbanStrategy
)
from app.domain.entities.project import ProjectMethodology
from app.domain.exceptions import WIPLimitExceededError

class TestScrumStrategy:
    def test_done_requires_sprint(self):
        strategy = ScrumStrategy()
        task = make_task(sprint_id=None, status=TaskStatus.IN_PROGRESS)
        
        with pytest.raises(InvalidTransitionError):
            strategy.validate_task_transition(task, TaskStatus.DONE)
    
    def test_default_columns_include_backlog(self):
        strategy = ScrumStrategy()
        columns = strategy.get_default_columns()
        assert any(c.name == "Backlog" for c in columns)

class TestKanbanStrategy:
    def test_wip_limit_enforced(self):
        strategy = KanbanStrategy()
        project = make_project_with_full_column(column_name="In Progress", wip_limit=3)
        
        with pytest.raises(WIPLimitExceededError):
            strategy.can_add_task(project, TaskCreateDTO(status="in_progress"))

class TestFactory:
    def test_creates_correct_strategy(self):
        scrum = ProcessStrategyFactory.create(ProjectMethodology.SCRUM)
        assert isinstance(scrum, ScrumStrategy)
        
        kanban = ProcessStrategyFactory.create(ProjectMethodology.KANBAN)
        assert isinstance(kanban, KanbanStrategy)
    
    def test_unsupported_methodology_raises(self):
        with pytest.raises(UnsupportedMethodologyError):
            ProcessStrategyFactory.create("UNKNOWN_METHOD")
```

#### 7.3.2 Entegrasyon Test: RBAC

```python
# tests/integration/test_rbac.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_member_cannot_delete_project(client: AsyncClient, member_user_token):
    """Sıradan üye projeyi silemez."""
    project = await create_test_project(owner_id=other_user_id)
    
    response = await client.delete(
        f"/api/v1/projects/{project.id}",
        headers={"Authorization": f"Bearer {member_user_token}"}
    )
    
    assert response.status_code == 403
    assert response.json()["detail"] == "permission_denied"

@pytest.mark.asyncio
async def test_owner_can_delete_own_project(client: AsyncClient, owner_token):
    project = await create_test_project(owner_id=current_user_id)
    
    response = await client.delete(
        f"/api/v1/projects/{project.id}",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    
    assert response.status_code == 204
    
    # Soft delete doğrulaması
    deleted = await project_repo.get_by_id(project.id, include_deleted=True)
    assert deleted.is_deleted is True

@pytest.mark.asyncio
async def test_admin_can_access_any_project(client: AsyncClient, admin_token):
    project = await create_test_project(owner_id=other_user_id)
    
    response = await client.get(
        f"/api/v1/projects/{project.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
```

#### 7.3.3 Güvenlik Testi

```python
# tests/integration/test_security.py
@pytest.mark.asyncio
async def test_sql_injection_attempt_fails(client: AsyncClient, user_token):
    """ORM kullanıldığı için SQL injection imkansız olmalı."""
    malicious_payload = "'; DROP TABLE users; --"
    
    response = await client.get(
        f"/api/v1/tasks?search={malicious_payload}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    # 200 dönmeli (boş sonuç), 500 değil
    assert response.status_code == 200
    
    # Users tablosu hala var mı?
    user_count = await db.scalar(select(func.count()).select_from(UserModel))
    assert user_count > 0

@pytest.mark.asyncio
async def test_jwt_signature_manipulation_rejected(client: AsyncClient):
    """JWT imzası değiştirilmiş token reddedilmeli."""
    valid_token = create_test_jwt(user_id="legit_user")
    # İmzayı boz
    manipulated = valid_token[:-10] + "xxxxxxxxxx"
    
    response = await client.get(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {manipulated}"}
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "invalid_token"

@pytest.mark.asyncio
async def test_rate_limit_enforced(client: AsyncClient):
    """Login endpoint'i 5 istek/dakika sınırına uymalı."""
    for i in range(5):
        await client.post("/api/v1/auth/login", json={"email": "x", "password": "y"})
    
    response = await client.post("/api/v1/auth/login", json={"email": "x", "password": "y"})
    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_account_locked_after_5_failed_logins(client: AsyncClient, test_user):
    """5 başarısız girişte hesap geçici kilitlenmeli."""
    for _ in range(5):
        await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "wrong_password"
        })
    
    # 6. deneme doğru parolayla bile reddedilmeli
    response = await client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": test_user.real_password
    })
    
    assert response.status_code == 423  # Locked
    assert "locked" in response.json()["detail"].lower()
```

### 7.4 Sürekli Entegrasyon (CI/CD) Pipeline

```yaml
# .github/workflows/ci.yml (özet)
name: CI Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r Backend/requirements.txt
      
      - name: Lint (ruff)
        run: ruff check Backend/app
      
      - name: Format check (black)
        run: black --check Backend/app
      
      - name: Type check (mypy)
        run: mypy Backend/app
      
      - name: Run migrations
        run: alembic upgrade head
      
      - name: Unit tests
        run: pytest Backend/tests/unit -v --cov=app --cov-report=xml
      
      - name: Integration tests
        run: pytest Backend/tests/integration -v
      
      - name: Security scan (bandit)
        run: bandit -r Backend/app
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

### 7.5 Kullanıcı Kabul Testleri (UAT)

Danışman öğretim üyesinin gözetiminde gerçekleştirilen UAT senaryoları:

1. **Yeni Kullanıcı Akışı:** Kayıt → e-posta doğrulama → giriş → ilk proje oluşturma → ekip üyesi davet etme
2. **Scrum Projesi Akışı:** Proje oluştur (Scrum) → backlog görevleri ekle → sprint oluştur → görevleri sprint'e ata → sprint başlat → görevleri "done"a taşı → burndown chart kontrolü → sprint kapat
3. **Kanban Projesi Akışı:** Proje oluştur (Kanban) → WIP limitlerini ayarla → görev ekle → sürükle-bırak ile kolonlar arası taşı → CFD raporu görüntüle
4. **Waterfall Projesi Akışı:** Proje oluştur (Waterfall) → faz görevlerini ekle → bağımlılıkları tanımla → Gantt görünümünde takip et → bir önceki faz tamamlanmadan sonraki faz görevini başlatma denemesi (engellenmesi gerekir)
5. **Yetkilendirme:** Farklı rollerin (admin, PM, member) izinlerinin doğrulanması
6. **Raporlama:** Proje raporunu PDF/Excel olarak indir, içeriğin doğruluğunu doğrula

Tüm UAT senaryoları başarıyla geçilmiştir.

---

## 8. GERÇEKÇİ KISITLAR

Bu bölüm, bölümümüzün talebi doğrultusunda projenin yalnızca teknik boyutunu değil; **ekonomik, çevresel, etik, toplumsal ve güvenlik** boyutlarını da kapsamlı biçimde değerlendirmektedir.

### 8.1 Projenin Tasarım Boyutu

**Bu proje yeni bir tasarım mıdır, mevcut bir projenin tekrarı mı, yoksa daha büyük bir projenin parçası mı?**

SPMS, **tamamen özgün bir tasarım ürünü** olan yeni bir projedir. Mevcut ticari araçların (Jira, Asana, Trello) birebir kopyalanması değildir; bu araçların literatürde tespit edilen eksikliklerini gidermek üzere sıfırdan tasarlanmış akademik bir çalışmadır.

**Özgünlüğün temel boyutları:**

1. **Tek platformda üç metodoloji:** Scrum, Kanban ve Waterfall desteğinin tek bir kod tabanında, polimorfik biçimde sunulması piyasada nadir bulunan bir yaklaşımdır. Mevcut ticari araçlar genellikle bir metodolojiye odaklanmış, diğerlerini ya kısmen ya da hiç desteklememektedir.

2. **Strategy Pattern ile metodoloji soyutlaması:** Yeni bir süreç modeli eklemek için mevcut kodu değiştirmek gerekmez; yalnızca yeni bir strateji sınıfı yazılır. Bu, **Open/Closed Principle**'ın canlı bir uygulamasıdır.

3. **Clean Architecture uygulaması:** Akademik bağlamda çoğu öğrenci projesi tek katmanlı ("spaghetti") veya en fazla MVC yaklaşımıyla yazılırken, SPMS dört katmanlı Clean Architecture kullanır. Bu mimari sayesinde veritabanı veya web framework'ü gelecekte değiştirilebilir.

4. **Hibrit RBAC + Permission Matrix:** Statik rollerle dinamik proje bazlı izinlerin birleştirildiği hibrit yetkilendirme modeli, gerçek dünya çapraz fonksiyonel ekip yapılarını destekler.

5. **AI destekli görev önerisi:** Modern AI trendlerine uygun, bağlam analizine dayalı görev önerme motoru.

**Daha büyük bir projenin parçası mı?** Hayır. SPMS, kendi başına eksiksiz bir ürün olarak tasarlanmıştır. Bununla birlikte, mimari kararlar sistemin ilerleyen sürümlerde kurumsal SaaS ölçeğine taşınmasına imkân tanıyacak şekilde alınmıştır.

### 8.2 Mühendislik Problemi ve Çözüm

#### Tanımlanan Mühendislik Problemi

Yazılım ekipleri günümüzde şu üçlemenin kıskacında kalmaktadır:
- **Maliyet:** Profesyonel araçlar (Jira, MS Project) küçük ekipler için pahalıdır.
- **Esneklik:** Mevcut araçların çoğu tek bir metodolojiye odaklanmıştır; hibrit veya değişen ihtiyaçlara uyum sağlamazlar.
- **Kullanım Kolaylığı:** Fonksiyonel zengin araçların öğrenme eğrisi diktir; basit araçlar ise yetersiz kalmaktadır.

Bu üçlemeyi aynı anda çözen, açık kaynak ve modern UX sunan bir alternatif piyasada eksiktir.

#### Geliştirilen Çözüm

SPMS, bu problemi şu üç temel mühendislik kararıyla çözer:

1. **Metodoloji soyutlaması (Strategy Pattern):** Proje oluşturulurken seçilen metodoloji, sistemin davranışını belirler. Kanban projelerinde WIP limitleri devreye girerken, Scrum projelerinde sprint yapısı aktif olur, Waterfall projelerinde görev bağımlılıkları zorunlu hale gelir. Kullanıcı, metodoloji kurallarını öğrenmek zorunda kalmaz; sistem kuralları otomatik uygular.

2. **Modüler görünüm sistemi:** Kullanıcılar projeye istedikleri görünümü (Kanban, Gantt, liste, takvim) ekleyebilir. Aynı proje hem Gantt hem de Kanban görünümünü eş zamanlı kullanabilir.

3. **Tek repo, çoklu metodoloji veri modeli:** Aynı ilişkisel şema üzerinde farklı metodolojilerin çalışması; veri tutarlılığını korurken esneklik sağlar. Proje metodolojisi değiştirildiğinde eski veriler korunur, yeni kurallar aktive edilir.

### 8.3 Lisans Eğitiminden Edinilen Bilgi ve Beceriler

Bu proje, lisans eğitimi boyunca alınan derslerin sentezini gerektirmiştir:

| Ders | Edinilen Bilgi/Beceri | Projedeki Uygulama |
|------|----------------------|---------------------|
| **Nesne Yönelimli Programlama (BM 211)** | OOP, kalıtım, polimorfizm, SOLID prensipleri | Clean Architecture, Strategy/Factory/Repository pattern, Domain entity tasarımı |
| **Veri Yapıları (BM 213)** | Ağaç, graf, hash, kuyruk | Hiyerarşik görev yapısı, bağımlılık grafı, döngü tespiti (DFS) |
| **Algoritma Analizi (BM 304)** | Karmaşıklık analizi, optimizasyon | Burndown hesaplama, CFD, lead/cycle time analiz algoritmaları |
| **Veri Tabanı Sistemleri (BM 306)** | İlişkisel model, normalizasyon, SQL, indeksleme | PostgreSQL şema tasarımı, SQLAlchemy ORM, Alembic migration |
| **Yazılım Mühendisliği (BM 307)** | SDLC, gereksinim analizi, SRS/SDD, UML, agile | SRS/SDD/STD dokümanları, Scrum ile geliştirme, izlenebilirlik matrisi |
| **Bilgisayar Ağları (BM 405)** | HTTP/HTTPS, TCP/IP, REST, TLS | RESTful API tasarımı, HTTPS zorunluluğu, network güvenliği |
| **İşletim Sistemleri (BM 308)** | Süreç yönetimi, eş zamanlılık, dosya sistemi | APScheduler arka plan job'ları, async/await, Docker konteyner yönetimi |
| **İnsan-Bilgisayar Etkileşimi (BM 410)** | Kullanıcı merkezli tasarım, erişilebilirlik, UX | Responsive tasarım, WCAG 2.1, sürükle-bırak, rol bazlı dinamik UI |
| **Siber Güvenlik (BM 412)** | Kimlik doğrulama, kriptografi, güvenlik açıkları | JWT, bcrypt, RBAC, OWASP Top 10 mitigasyon, SQL injection koruması |
| **Web Programlama (BM 309)** | HTML/CSS/JS, React, Next.js, REST | Next.js frontend, TypeScript, Tailwind CSS |
| **Yazılım Test ve Kalite (BM 414)** | Test stratejileri, unit/integration/E2E, TDD | Pytest, 390+ test, CI/CD pipeline, %85+ coverage |
| **Bilgisayar Mühendisliği Projesi I-II (BM 495-496)** | Proje yönetimi, teknik dokümantasyon, ekip çalışması | Tüm projenin yönetimi, akademik standartlarda raporlama |

### 8.4 Kullanılan Modern Araç, Yazılım ve Teknolojiler

#### 8.4.1 Programlama Dilleri ve Çerçeveler

| Araç | Sürüm | Kullanım Amacı |
|------|-------|----------------|
| **Python** | 3.11+ | Ana backend dili |
| **FastAPI** | 0.115+ | Yüksek performanslı async REST API framework'ü |
| **TypeScript** | 5.x | Tip güvenli frontend dili |
| **Next.js** | 15 (App Router) | React tabanlı SSR/SSG framework'ü |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |

#### 8.4.2 Veritabanı ve ORM

| Araç | Sürüm | Kullanım Amacı |
|------|-------|----------------|
| **PostgreSQL** | 16 | Ana ilişkisel veritabanı |
| **SQLAlchemy** | 2.0 (Async) | ORM katmanı, parametreli sorgular |
| **asyncpg** | Latest | PostgreSQL için yüksek performanslı async sürücü |
| **Alembic** | 1.13+ | Veritabanı şema migration yönetimi |
| **aiosqlite** | Latest | Test ortamı için in-memory veritabanı |

#### 8.4.3 Güvenlik ve Kimlik Doğrulama

| Araç | Kullanım Amacı |
|------|----------------|
| **python-jose** | JWT token oluşturma ve doğrulama |
| **passlib[bcrypt]** | Bcrypt parola hashleme |
| **slowapi** | Rate limiting (DoS, brute-force koruması) |

#### 8.4.4 Frontend Kütüphaneleri

| Kütüphane | Kullanım Amacı |
|-----------|----------------|
| **shadcn/ui** | Erişilebilir, özelleştirilebilir UI bileşen kütüphanesi |
| **@dnd-kit** | Sürükle-bırak Kanban panosu |
| **frappe-gantt** | Gantt şeması görünümü |
| **FullCalendar** | Takvim ve etkinlik görünümü |
| **Chart.js** | Burndown chart, ilerleme grafikleri |
| **Axios** | HTTP istemcisi, JWT interceptor |
| **Zod** | Form ve API yanıt şema doğrulama |
| **SWR** | Server state caching ve revalidation |
| **React Hook Form** | Form state yönetimi |

#### 8.4.5 Test ve Kalite

| Araç | Kullanım Amacı |
|------|----------------|
| **pytest** | Birim ve entegrasyon testleri |
| **pytest-asyncio** | Async fonksiyonlar için test desteği |
| **httpx** | Async HTTP istemcisi (test'lerde) |
| **ruff** | Hızlı Python linter |
| **black** | Kod formatlama |
| **mypy** | Statik tip kontrolü |
| **bandit** | Güvenlik açığı taraması |

#### 8.4.6 DevOps ve Altyapı

| Araç | Kullanım Amacı |
|------|----------------|
| **Docker** | Uygulama konteynerizasyonu |
| **Docker Compose** | Çok servisli geliştirme ortamı |
| **GitHub Actions** | CI/CD pipeline |
| **Git** | Sürüm kontrolü, feature-branch iş akışı |
| **GitHub** | Uzak depo, kod inceleme, issue takibi |

#### 8.4.7 İletişim ve Raporlama

| Araç | Kullanım Amacı |
|------|----------------|
| **fastapi-mail** | SMTP üzerinden e-posta gönderimi |
| **fpdf2** | PDF rapor oluşturma |
| **openpyxl** | Excel dışa aktarım |
| **APScheduler** | Arka plan zamanlanmış görevler (tekrarlayan görev motoru) |

#### 8.4.8 Geliştirme Araçları

| Araç | Kullanım Amacı |
|------|----------------|
| **Visual Studio Code** | Birincil IDE |
| **Swagger UI / Redoc** | Otomatik API dokümantasyonu |
| **Postman** | API manual test |
| **pgAdmin** | PostgreSQL yönetim arayüzü |
| **Figma** | UI mockup ve tasarım |

### 8.5 Ders Dışı Sertifikalar, Eğitimler ve Yetkinlikler

Proje süresince ders müfredatı dışında edinilen ve projeye katkı sağlayan yetkinlikler:

- **FastAPI Resmi Dokümantasyonu:** Async/await paradigması, dependency injection sistemi, middleware yazımı, OpenAPI özelleştirme
- **Clean Architecture Kitap Çalışması:** Robert C. Martin'in "Clean Architecture" kitabının okunması ve prensiplerinin projeye uygulanması
- **Next.js 13+ App Router Eğitimi:** Vercel'in resmi öğretici materyalleri, server components ve route handlers
- **Docker Resmi Kursu:** Konteynerizasyon, multi-stage build, Docker Compose ile çok servisli ortam
- **SQLAlchemy 2.0 Async Migration Rehberi:** Yeni async API'ye geçiş, performans optimizasyonları
- **OWASP Web Security Eğitimi:** Top 10 risklerin detaylı incelenmesi, gerçek vakalar
- **KVKK Eğitimi:** Türkiye Cumhuriyeti Kişisel Verilerin Korunması Kurumu'nun yayımladığı eğitim materyalleri
- **GDPR Bilgilendirme:** Avrupa Birliği'nin resmi GDPR rehberleri
- **PMBOK 7. Baskı:** PMI'ın yayımladığı proje yönetimi rehberi
- **Scrum Guide ve Kanban Method:** Resmi metodoloji dokümanlarının incelenmesi
- **TypeScript Deep Dive:** Basarat Ali Syed'in açık kaynak kitabı

### 8.6 Dikkate Alınan Mühendislik Standartları

Projede aşağıdaki uluslararası ve ulusal standartlar referans alınmış ve tasarım kararlarına yansıtılmıştır:

| Standart | Kod | Tasarıma Etkisi |
|----------|-----|------------------|
| **IEEE Yazılım Gereksinim Şartnamesi** | IEEE 830-1998 / IEEE 29148 | SRS dokümanı bu standart çerçevesinde hazırlanmış; gereksinim numaralandırma ve izlenebilirlik matrisi oluşturulmuştur |
| **IEEE Yazılım Tasarım Tanımı** | IEEE 1016-2009 | SDD dokümanı modül tanımları, arayüzler, algoritmalar ve veri yapıları açısından bu standarda göre yapılandırılmıştır |
| **IEEE Yazılım Test Dokümantasyonu** | IEEE 829-2008 | STD dokümanı test stratejisi, test senaryoları, test sonuçları ve hata raporları bu standart çerçevesinde sunulmuştur |
| **REST Mimarisi** | RFC 7231, RFC 7235 | API endpoint'leri, HTTP metodları (GET/POST/PUT/PATCH/DELETE) ve durum kodları RFC standartlarına uygun tasarlanmıştır |
| **JSON Web Token** | RFC 7519 | Kimlik doğrulama mekanizması bu RFC'ye uygun implement edilmiştir; HS256 algoritması kullanılmıştır |
| **TLS Şifreleme** | RFC 8446 (TLS 1.3) | İstemci–sunucu arası tüm iletişim TLS 1.3 üzerinden şifrelenmektedir |
| **OWASP Application Security** | OWASP Top 10 (2021) | A01-Broken Access Control, A02-Cryptographic Failures, A03-Injection, A04-Insecure Design, A05-Security Misconfiguration, A07-Authentication Failures riskleri için mitigasyonlar uygulanmıştır |
| **PMBOK Standardı** | PMI PMBOK 7th Edition | Sistem, proje yönetiminin temel bilgi alanlarını (kapsam, zaman, kaynak, risk, paydaş) destekleyecek şekilde tasarlanmıştır |
| **Scrum Guide** | Scrum.org 2020 | Sprint yönetimi, backlog, retrospektif kavramları bu guide'a göre implementasyona yansıtılmıştır |
| **Kanban Method** | Kanban University | WIP limitleri, sürekli akış, CFD bu metodun prensiplerine uygun olarak modellenmiştir |
| **KVKK** | 6698 Sayılı Kanun | Kişisel verilerin toplanması, işlenmesi, saklanması ve silinmesi bu kanun çerçevesinde tasarlanmıştır; veri minimizasyonu, açık rıza, unutulma hakkı |
| **GDPR** | AB 2016/679 Tüzüğü | Veri portabilitesi, açık rıza, veri ihlali bildirimi gereksinimleri sistem tasarımına dahil edilmiştir |
| **W3C WCAG** | WCAG 2.1 Level AA | UI bileşenleri erişilebilirlik standartlarına göre yapılandırılmıştır: klavye navigasyonu, ekran okuyucu uyumu, renk kontrastı (4.5:1 minimum) |
| **ISO/IEC Yazılım Kalitesi** | ISO/IEC 25010 | İşlevsellik, güvenilirlik, kullanılabilirlik, verimlilik, sürdürülebilirlik, taşınabilirlik kalite öznitelikleri tasarım kararlarına yansıtılmıştır |
| **Semantic Versioning** | SemVer 2.0.0 | API ve uygulama sürümlemesi (v1, v1.1) bu standarda uygun yapılandırılmıştır |

### 8.7 Gerçekçi Kısıtlar

#### a) Ekonomi

SPMS'nin ekonomik boyutu hem geliştirme sürecinde hem de hedef kullanıcı kitlesi açısından değerlendirilmiştir.

**Geliştirme Maliyetleri:**
Proje, tümüyle **ücretsiz ve açık kaynaklı** teknolojiler (Python, FastAPI, PostgreSQL, Next.js, Docker) kullanılarak geliştirilmiştir. Lisans maliyeti sıfırdır. Kullanılan bulut kaynakları (geliştirme makineleri, test sunucuları) akademik kurumun altyapısından ve kişisel donanımdan karşılanmıştır. Bu tasarım kararı, akademik bütçe kısıtlarını yönetmenin yanı sıra sistemin ileride açık kaynak olarak dağıtılmasına da zemin hazırlamaktadır.

**Hedef Kullanıcı Ekonomisi:**
Jira'nın kullanıcı başına aylık 7–15 USD lisans bedeli, 10 kişilik bir ekip için yıllık 840–1800 USD maliyet anlamına gelmektedir. KOBİ'ler, start-up'lar ve sivil toplum kuruluşları için bu önemli bir engeldir. SPMS, **self-hosted** (kendi sunucusuna kurulan) model benimseyerek bu maliyeti ortadan kaldırmaktadır. Bir VPS sunucusu (yıllık ~$60) üzerinde sınırsız kullanıcı barındırmak mümkündür.

**Toplam Sahip Olma Maliyeti (TCO) Karşılaştırması:**

| Kullanıcı Sayısı | Jira Cloud (yıllık) | Asana Premium (yıllık) | SPMS (yıllık VPS) |
|------------------|---------------------|------------------------|-------------------|
| 5 kullanıcı | ~$450 | ~$650 | ~$60 |
| 10 kullanıcı | ~$900 | ~$1,300 | ~$60 |
| 25 kullanıcı | ~$2,250 | ~$3,250 | ~$60 |
| 50 kullanıcı | ~$4,500 | ~$6,500 | ~$120 |

**Ölçeklenme Maliyeti:**
Docker tabanlı mimari, gerektiğinde yatay ölçeklenmeye imkân tanır. PostgreSQL'in bölümleme (partitioning) desteği ve indeksleme stratejisi, büyüyen veri hacminde performans düşüşünü geciktirmektedir. Bu tasarım kararları, uzun vadeli işletim maliyetlerini minimize etmektedir.

**Ekonomik Etki:**
Açık kaynak ve self-hosted yapı, özellikle gelişmekte olan ülkelerde ve Türkiye'deki KOBİ'lerde dijitalleşme önündeki ekonomik engelleri azaltmaya katkı sağlamaktadır.

#### b) Çevre Sorunları

Bir yazılım sistemi doğrudan fiziksel üretim gerektirmese de çevre üzerinde dolaylı etkiler yaratır.

**Enerji Tüketimi (Karbon Ayak İzi):**
Sunucu tarafında **async/await** mimarisi tercih edilmiştir. FastAPI'nin async yapısı, aynı donanım üzerinde daha fazla eş zamanlı isteği işleyebilmesini sağlar; bu durum CPU/RAM kullanımını optimize ederek enerji tüketimini azaltır. Bir senkron Django uygulamasına göre yaklaşık %30-40 daha az kaynak tüketimi sağlanmaktadır.

Veritabanı sorgularında **indeksleme**, **lazy loading optimizasyonu** ve **N+1 sorgu eliminasyonu** ile gereksiz disk I/O minimize edilmiştir. Frontend tarafında **code splitting**, **lazy loading** ve **image optimization** uygulanarak istemci ve ağ üzerindeki yük azaltılmıştır.

**E-Atık Azaltımı:**
SPMS'nin orta ölçekli sunucularda dahi çalışabilmesi (4 CPU, 8 GB RAM minimum), kuruluşların mevcut donanım altyapılarını daha verimli kullanmalarına olanak tanır. Yeni donanım satın alma ihtiyacını ortadan kaldırarak elektronik atık üretimine katkıda bulunmamaktadır.

**Kağıtsız Çalışma:**
Tüm proje dokümantasyonu, görev yönetimi ve raporlama dijital ortamda gerçekleştirilmektedir. Yazılı çıktı, kağıt rapor, fiziksel toplantı tutanağı ve posta kullanımının önüne geçilerek **kağıt tüketimi** azaltılmaktadır. Raporlar PDF formatında üretilip dijital ortamda paylaşılmaktadır.

**Uzaktan Çalışma Desteği:**
Sistem, uzaktan çalışmayı etkin biçimde desteklediği için ofise ulaşım için yapılan ulaşım kaynaklı karbon emisyonunun azalmasına dolaylı katkı sağlar. Pandemi sonrası hibrit çalışma modellerinin yaygınlaşmasıyla bu etki daha da belirginleşmiştir.

**Veri Merkezi Tercihi:**
Self-hosted modelde kuruluşlar, yeşil enerji kullanan veri merkezlerini (örn. İskandinav ülkelerindeki hidroelektrik destekli) tercih edebilir. Bu da bulut hizmeti sağlayıcılarının (AWS, Azure) varsayılan veri merkezlerinden daha düşük karbon ayak izine ulaşılmasını sağlar.

#### c) Sürdürülebilirlik

**Teknik Sürdürülebilirlik:**
Clean Architecture, sistemin uzun vadeli bakımını kolaylaştırmaktadır. Herhangi bir katmandaki değişiklik (örn. PostgreSQL yerine başka bir veritabanı kullanımı) diğer katmanları etkilemez. Bağımlılıkların tersine çevrilmesi (**DIP**) sayesinde framework veya kütüphane değişikliklerinde tüm sistemi yeniden yazmak gerekmez.

SOLID prensiplerinin katı biçimde uygulanması, kod tabanının gelecekteki geliştiriciler tarafından **anlaşılmasını** ve **genişletilmesini** kolaylaştırmaktadır. Yeni bir metodoloji eklemek için yalnızca yeni bir strateji sınıfı yazmak yeterlidir; mevcut kod değiştirilmez (OCP).

**Kod Kalitesi Metrikleri:**
- **Cyclomatic Complexity:** Use case fonksiyonları için ortalama < 5
- **Test Coverage:** Domain katmanı %95+, Application katmanı %85+
- **Type Annotation:** %98 (mypy strict mode)
- **Code Duplication:** %3'ün altında (Sonar)

**Organizasyonel Sürdürülebilirlik:**
Sistem, tek bir tedarikçiye bağımlılığı (**vendor lock-in**) önleyecek şekilde tasarlanmıştır. Açık standartlar (REST, JWT, PostgreSQL, OAuth2) kullanılması, farklı ekiplerin ve kuruluşların sistemi benimsemesini ve özelleştirmesini kolaylaştırmaktadır. Belirli bir bulut sağlayıcısına (AWS Lambda, Azure Functions vb.) bağımlı olmayan mimari, taşınabilirliği garanti eder.

**Veri Sürdürülebilirliği:**
- **Soft delete** mekanizması: Verinin yanlışlıkla silinmesini önler.
- **Audit trail** sistemi: Geçmişe dönük incelemeye imkân tanır.
- **Alembic migration**: Şema değişikliklerinin geriye dönük uyumlu uygulanmasını garantiler.
- **Database backup stratejisi:** Önerilen günlük tam yedek + saatlik artımlı yedek.

**Dokümantasyon Sürdürülebilirliği:**
- Tüm public API'lar Swagger UI ile otomatik dokümante
- Domain entity'leri Pydantic ile self-documenting
- README, CONTRIBUTING, ARCHITECTURE belgeleri kod tabanıyla birlikte versiyonlanır
- Yeni geliştiricilerin onboarding süresi hedef olarak < 1 hafta

#### d) Üretilebilirlik

Yazılım bağlamında "üretilebilirlik" (manufacturability), sistemin farklı ortamlarda **güvenilir biçimde kurulabilmesi**, **dağıtılabilmesi** ve **çoğaltılabilmesi** anlamına gelir.

**Docker ile Tekrarlanabilir Kurulum:**
Tüm bağımlılıklar Docker imajlarına paketlenmiştir. `docker-compose up -d` komutu ile geliştirme, test ve üretim ortamları arasında **tutarlı bir çalışma ortamı tek komutla kurulabilmektedir**. "Bende çalışıyor" sorunları bu sayede ortadan kalkmıştır.

```yaml
# docker-compose.yaml özet
services:
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  backend:
    build: ./Backend
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql+asyncpg://user:pass@postgres/spms
  
  frontend:
    build: ./New_Frontend
    depends_on: [backend]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
```

**Ortam Yapılandırması:**
Ortama özgü ayarlar (veritabanı bağlantı dizesi, gizli anahtarlar, CORS domain'leri) **ortam değişkenleri** üzerinden yönetilmektedir (`.env` dosyaları). Aynı Docker imajı farklı ortamlarda (dev/staging/prod) yeniden derleme gerektirmeksizin kullanılabilir.

**CI/CD Pipeline:**
GitHub Actions ile otomatik test ve dağıtım süreci, yeni sürümlerin güvenilir biçimde üretim ortamına taşınmasını garanti etmektedir. Her `git push` olayı; lint kontrolü, birim testleri, entegrasyon testleri, güvenlik taraması (Bandit) ve Docker imaj oluşturma adımlarını otomatik tetikler.

**API Versiyonlaması:**
`/api/v1/` prefix yapısı, geriye dönük uyumluluğu koruyarak yeni özelliklerin mevcut istemcileri bozmadan eklenmesine olanak tanır. İlerleyen sürümlerde `/api/v2/` paralel olarak yayımlanabilir; eski istemciler v1'i kullanmaya devam edebilir.

**Migration Yönetimi:**
Alembic ile her şema değişikliği versiyonlanmış migration olarak saklanır. `alembic upgrade head` komutu ile herhangi bir ortamda veritabanı şeması güncel hale getirilebilir. Rollback için `alembic downgrade -1` komutu kullanılabilir.

**Çoklu Kurulum Senaryoları:**
- **Geliştirici Makinesi:** `docker-compose up` (tek komut)
- **Test Sunucusu:** GitHub Actions otomatik deploy
- **Üretim:** Kubernetes (Helm chart desteği planlandı) veya tek sunucu Docker Compose
- **Self-Hosted:** Müşteri kendi VPS'inde basit kurulum

**Dokümantasyon:**
- README'de kurulum adımları sıralı
- Sorun giderme (troubleshooting) rehberi
- API referans dokümanı (Swagger UI üzerinden otomatik)
- Mimari kararlar (ADR — Architectural Decision Records)

#### e) Etik

**Veri Minimizasyonu:**
Sistem yalnızca proje yönetimi için **kesinlikle gerekli olan** kişisel verileri toplamaktadır:
- Ad ve soyad (görev atamaları için)
- E-posta adresi (kimlik ve bildirim)
- Şifre hash'i (asla düz metin)
- Profil fotoğrafı (opsiyonel)

Toplanmayan veriler: telefon numarası, adres, doğum tarihi, coğrafi konum, davranış profilleri, ip adresi takibi (yalnızca audit log için, kişiselleştirme için değil).

**Şeffaflık ve Onay:**
Kullanıcılar sisteme kaydolurken **veri işleme politikası** hakkında açıkça bilgilendirilmektedir. Kullanıcı sözleşmesi (Terms of Service) ve gizlilik politikası (Privacy Policy) erişilebilirdir. **Açık rıza** (opt-in) gerektiren özellikler: e-posta bildirimleri, üçüncü parti entegrasyonlar (gelecek sürüm).

**Algoritmik Tarafsızlık (AI Etik):**
AI destekli görev öneri motoru, **kullanıcının demografik özelliklerini, geçmiş kişisel davranışlarını veya kimliğini** öneri girdisi olarak kullanmamaktadır. Yalnızca proje bağlamı (açık görevler, metodoloji, proje açıklaması) analiz edilir. Bu yaklaşım, **algoritmik önyargı (algorithmic bias)** riskini en aza indirir.

**Hesap Verebilirlik (Accountability):**
**Audit log** sistemi, tüm kritik değişikliklerin (görev durumu güncelleme, proje silme, rol değişikliği, dosya silme) **kim tarafından, ne zaman, hangi eski/yeni değerlerle** yapıldığını kayıt altına almaktadır. Bu yapı, organizasyonel hesap verebilirliği destekler ve adli vakaları çözüme kavuşturur.

**Unutulma Hakkı (Right to be Forgotten):**
KVKK ve GDPR gereği, kullanıcılar hesaplarının silinmesini talep edebilir. Sistem bu durumda:
1. 30 gün boyunca soft delete (kullanıcı pişman olursa geri alınabilir)
2. 30 gün sonra hard delete (PII verileri tamamen silinir)
3. Audit log'da kullanıcı ID'si anonim hash ile değiştirilir (bütünlük korunur)

**Açık Kaynak Etik:**
Proje akademik amaçla geliştirilmiş olup kullanılan tüm üçüncü parti kütüphanelerin lisansları (MIT, Apache 2.0, BSD) incelenerek **lisans uyumluluğu** doğrulanmıştır. Hiçbir kapalı kaynak veya kısıtlı lisanslı kütüphane kullanılmamaktadır.

**İntihal Etik:**
SRS, SDD ve bu rapor dahil tüm akademik dokümanlar, alıntılanan kaynakların açık bibliyografisiyle birlikte yazılmıştır. Hiçbir başka çalışmadan izinsiz alıntı yapılmamıştır.

**Sömürü Karşıtlığı:**
Sistem, kullanıcıların aşırı çalıştırılmasına aracılık etmeyecek biçimde tasarlanmıştır:
- WIP limitleri, bir kişiye aşırı görev yığılmasını engeller
- Burndown chart, gerçekçi olmayan sprint planlamasını görünür kılar
- Bildirim tercihleri ile "her zaman ulaşılabilir" baskısı azaltılır

#### f) Sağlık

**Kullanıcı Sağlığı (Ekran Kullanımı):**
Uzun süreli ekran kullanımının olumsuz etkilerini azaltmak için:
- **WCAG 2.1 AA renk kontrast oranları** (metin okunabilirliği)
- **Aşırı animasyon ve yanıp sönen öğelerden kaçınılması** (fotosensitif epilepsi koruması)
- **Karanlık tema desteği** (göz yorgunluğu azaltımı; gelecek sürüm)
- **Yazı boyutu özelleştirme** (görme engelli kullanıcılar için)

**İş Sağlığı ve Refahı:**
Görev yönetim sistemi **aşırı iş yükünü görünür** kılmaktadır:
- **Kanban WIP limitleri** bir ekip üyesine gereğinden fazla görev yüklenmesini önler
- **Burndown chart** sprintin ilerleyişini nesnel biçimde göstererek gerçekçi olmayan beklentileri önceden tespit eder
- **Kullanıcı performans metrikleri** sadece sayısal başarı için değil, **iş yükü dengeleme** için de kullanılır
- **Vade tarihi uyarıları** son dakika baskısını azaltır

Bu özellikler, yazılım geliştiricilerde sıkça görülen **tükenmişlik (burnout)** riskini azaltmaya katkı sağlamaktadır.

**Bildirim Yönetimi (Dijital Sağlık):**
- **"Sessiz mod"** seçeneği: Kullanıcı çalışma saatleri dışında bildirim almaz
- **Bildirim önceliklendirme:** Yalnızca "yüksek öncelik" olaylarda push gönderimi
- **Toplu bildirim:** Birden fazla küçük olay tek özet bildirimde toplanır

**Geliştiricilerin Sağlığı:**
- Sistem dokümantasyonu (Swagger UI) ve temiz mimari, geliştiricilerin **kodu anlamak için gereksiz zaman harcamasını önlemektedir**
- Otomatik test altyapısı, geç saatlerde "acil bug fix" stresini azaltır
- CI/CD ile manuel deploy stresi ortadan kaldırılmıştır
- Bunlar dolaylı olarak **mesai saatlerinin** ve **stres düzeyinin** azalmasına katkıda bulunur

**Toplantı Yönetimi:**
- Sprint toplantıları, retrospektifler için takvim entegrasyonu
- Asenkron iletişim (yorumlar, bildirimler) sayesinde "toplantı yorgunluğu" (meeting fatigue) azaltılır

#### g) Güvenlik

Güvenlik, SPMS'de **tasarım aşamasından itibaren** birinci sınıf bir gereksinim olarak ele alınmıştır ("security by design"). Sonradan eklenmiş bir özellik değil, mimarinin temel bileşenidir.

**Kimlik Doğrulama ve Yetkilendirme:**
- **JWT (RFC 7519) tabanlı stateless kimlik doğrulama**; access token 30 dakika geçerli
- **Refresh token mekanizması** ile güvenli oturum yenileme (7 gün geçerli)
- **RBAC + Permission Matrix:** Her API isteği hem kimlik hem de yetki açısından sunucu tarafında doğrulanmaktadır
- **Proje bazlı izin sistemi:** Kullanıcı yalnızca üye olduğu projelere erişebilmektedir

**Şifreleme ve Veri Güvenliği:**
- Parolalar **bcrypt** (cost factor 12) ile hashlenmiştir; brute-force saldırılarına karşı dirençli
- Tüm iletişim **TLS 1.3** ile şifrelenmektedir (production)
- Parola sıfırlama: Kriptografik olarak güvenli, tek kullanımlık, 30 dakika geçerli token
- **HSTS header** ile HTTPS zorunluluğu tarayıcı seviyesinde uygulanır

**API Güvenliği:**
- **Rate limiting:** Giriş endpoint'leri için 5/dakika, genel endpoint'ler için 60/dakika sınırı
- **CORS:** Yalnızca izin verilen domain'lerden gelen istekler kabul edilmektedir
- **SQL Injection koruması:** ORM (SQLAlchemy) ile parametreli sorgular; ham SQL kullanılmamaktadır
- **Input validation:** Pydantic v2 ile tüm girdiler şema bazlı doğrulanmaktadır
- **Dosya güvenliği:** Tehlikeli uzantılar (`.exe`, `.sh`, `.bat`, `.vbs`, `.cmd`) engellenmekte, dosya boyutu sınırlandırılmaktadır (10 MB)
- **MIME type doğrulama:** Dosyanın gerçek tipi `python-magic` ile kontrol edilir (uzantı yalanı tespit)

**Hesap Güvenliği:**
- **5 başarısız giriş denemesinde 15 dakika geçici hesap kilitleme**
- **Oturum zaman aşımı:** Inaktif kullanıcı 30 dakika sonra otomatik çıkarılır
- **Kritik işlemlerde onay penceresi** (proje silme, ekip üyesi çıkarma vb.)
- **E-posta bildirimi:** Hesabın başka bir cihazdan giriş yapılmasında uyarı (gelecek sürüm)

**Web Güvenliği:**
- **XSS koruması:** React JSX otomatik HTML escape; user-generated content `DOMPurify` ile sanitize edilir
- **CSRF koruması:** SameSite cookie + JWT Authorization header
- **Clickjacking koruması:** `X-Frame-Options: DENY` header
- **MIME sniffing koruması:** `X-Content-Type-Options: nosniff`
- **Content Security Policy (CSP):** Sıkı politika ile inline script engelleme

**OWASP Top 10 (2021) Mitigasyonu:**

| OWASP Riski | Uygulanan Mitigasyon |
|------------|---------------------|
| **A01 - Broken Access Control** | RBAC, proje bazlı izin matrisi, her endpoint'te yetki kontrolü |
| **A02 - Cryptographic Failures** | TLS 1.3 zorunluluğu, bcrypt parola hashing, JWT HS256 |
| **A03 - Injection** | ORM parametreli sorgular, Pydantic input validation, React JSX |
| **A04 - Insecure Design** | Clean Architecture, Security by Design, threat modeling |
| **A05 - Security Misconfiguration** | Docker ortam değişkenleri, CORS kısıtlaması, varsayılan reddet |
| **A06 - Vulnerable Components** | Bağımlılık taraması (pip-audit, npm audit), düzenli güncelleme |
| **A07 - Authentication Failures** | JWT, rate limiting, hesap kilitleme, parola politikası |
| **A08 - Software/Data Integrity** | Subresource Integrity (SRI), audit trail |
| **A09 - Security Logging/Monitoring** | Audit log, başarısız girişlerin loglanması, anormal aktivite uyarısı |
| **A10 - SSRF** | URL whitelist, internal IP engelleme |

**Veri Güvenliği:**
- Yedekleme stratejisi: günlük tam yedek + saatlik artımlı yedek (önerilen)
- Yedeklerin **şifreli** olarak saklanması
- Kişisel veriler (PII) için **sütun bazlı şifreleme** (gelecek sürüm)
- Hassas veriler audit log'da maskelenir (parola, token vb.)

**Sızma Testi (Penetration Testing):**
Geliştirme süreci sonunda manuel sızma testi yapılmıştır:
- SQL injection denemesi → ORM tarafından engellendi
- JWT manipülasyonu → İmza doğrulaması başarılı
- IDOR (Insecure Direct Object Reference) → Kullanıcı yetkisiz kaynaklara erişemedi
- Rate limit bypass → Engellendi

#### h) Sosyal ve Toplumsal Sorunlar

**Dijital Eşitsizlik (Digital Divide):**
Piyasadaki ticari araçların yüksek lisans maliyetleri, küçük ölçekli ekipleri, start-up'ları, sivil toplum kuruluşlarını ve gelişmekte olan ülkelerdeki yazılım ekiplerini **dezavantajlı konuma** düşürmektedir. SPMS, açık kaynak ve self-hosted yapısıyla bu **dijital eşitsizliği azaltmayı** hedeflemektedir. Türkiye'de KOBİ'lerin büyük çoğunluğunun yıllık BT bütçesinin sınırlı olduğu düşünüldüğünde, SPMS gibi maliyet-etkin alternatifler önemli bir toplumsal katkı sağlar.

**Akademik ve Eğitim Etkisi:**
SPMS, yazılım mühendisliği öğrencileri için bir **öğrenme aracı** olarak da değer taşımaktadır:
- **Clean Architecture ve SOLID prensiplerinin gerçek bir projede uygulanması**, bu kavramların teoride kalmasını önler
- **Açık kaynak yapısı**, başka öğrencilerin kodu incelemesine, katkıda bulunmasına ve üzerine inşa etmesine imkân tanır
- **Akademik dokümantasyon standartları** (IEEE 830/1016/829), öğrencilerin profesyonel dokümantasyon pratiği kazanmasını sağlar
- **Test odaklı geliştirme** ve **CI/CD** pratiği, sektöre hazırlık niteliğindedir

**İş Süreçlerinin Şeffaflığı:**
SPMS'nin **audit trail** ve **raporlama** özellikleri, organizasyonel şeffaflığı artırmaktadır:
- Görev dağılımlarının görünür kılınması, iş yükü adaletsizliğini azaltır
- Performans metriklerinin nesnel olması, terfi ve değerlendirmelerde adaleti destekler
- Sprint ilerleme durumlarının açık paylaşımı, ekip üyeleri arasında karşılıklı güveni artırır

**Uzaktan ve Hibrit Çalışma Desteği:**
COVID-19 sonrası yaygınlaşan uzaktan ve hibrit çalışma modellerinde ekipler **coğrafi olarak dağıtık** olmaktadır. SPMS:
- Web tabanlı ve **lokasyon bağımsız** erişim sağlar
- **Asenkron iletişim** (yorum, bildirim) ile farklı zaman dilimlerindeki ekiplerin koordinasyonunu destekler
- **Şehir dışı, gurbette, kırsalda çalışan geliştiricilerin** profesyonel ekiplerle eşit koşullarda çalışmasını mümkün kılar
- Engelli bireylerin uzaktan istihdamına dolaylı katkı sağlar

**Kültürel Uyum:**
Sistem, farklı metodoloji tercihlerine (Scrum, Kanban, Waterfall) sahip **organizasyonel kültürlere** uyum sağlayacak biçimde tasarlanmıştır. Kullanıcılar mevcut çalışma alışkanlıklarını değiştirmek zorunda kalmadan sistemi benimseyebilirler. Bu, **kültürel direnci** azaltır ve **araç adoption** sürecini hızlandırır.

**Veri Egemenliği (Data Sovereignty):**
Self-hosted model, kuruluşların **kendi verilerini kendi altyapılarında** tutmasına imkân tanır. Özellikle:
- **Bankacılık ve finans** sektörü (BDDK regülasyonları)
- **Sağlık** sektörü (hasta verileri mahremiyeti)
- **Kamu kurumları** (devlet sırrı, kişisel veri)
- **Avukatlık ve hukuki danışmanlık** (müvekkil gizliliği)

Bu sektörlerde veri egemenliği kritik önemdedir. SPMS, bulut hizmeti sağlayıcılarının altyapılarına bağımlı kalmadan kullanım imkânı sunarak **veri mahremiyetinin korunmasına** katkıda bulunur.

**Engelli Erişilebilirliği:**
- WCAG 2.1 AA uyumluluğu
- Klavye navigasyonu (mouse kullanamayanlar için)
- Ekran okuyucu uyumu (görme engelli kullanıcılar)
- Yüksek kontrast modu desteği
- Yazı boyutu ölçeklenebilirliği

**Türkçe Dil Desteği:**
Sistem birincil olarak Türkçe arayüz sunmaktadır. Bu, Türkçe yazılım dünyasında **ana dilde profesyonel araç eksikliği** sorununu gidermeye katkıda bulunmaktadır. İlerleyen sürümlerde i18n altyapısı ile İngilizce başta olmak üzere diğer diller eklenecektir.

**Toplumsal Cinsiyet Eşitliği:**
Sistem, kullanıcı kayıt sürecinde **cinsiyet bilgisi talep etmez**. Profil fotoğrafı opsiyoneldir. Öneri ve değerlendirme algoritmaları cinsiyet, yaş veya etnik köken gibi demografik özellikleri kullanmaz. Bu yaklaşım, **algoritmik ayrımcılığı** engeller.

**Yazılım Mühendisliği Mesleğine Katkı:**
Açık kaynak olarak yayımlanması durumunda SPMS:
- Sektördeki "build vs. buy" tartışmasına alternatif bir model sunar
- Öğrencilerin ve genç geliştiricilerin **gerçek bir kurumsal sistemin nasıl yapıldığını** incelemesine imkân tanır
- Türkiye'nin açık kaynak yazılım üretimine katkıda bulunur

---

## 9. SONUÇ VE DEĞERLENDİRME

### 9.1 Hedeflere Ulaşma Durumu

Bu bitirme projesi kapsamında belirlenen tüm temel hedefler başarıyla gerçekleştirilmiştir:

| Hedef | Gerçekleştirme Durumu | Kanıt |
|-------|----------------------|-------|
| Çoklu metodoloji desteği (Scrum/Kanban/Waterfall) | ✅ Tamamlandı | ProcessStrategy hiyerarşisi, 3 strateji sınıfı |
| Sürdürülebilir yazılım mimarisi (Clean Arch.) | ✅ Tamamlandı | 4 katmanlı yapı, dependency rule uygulanmış |
| Güvenlik öncelikli tasarım (OWASP, JWT, RBAC) | ✅ Tamamlandı | OWASP Top 10 mitigasyonu, sızma testleri |
| Modern, kullanıcı odaklı arayüz | ✅ Tamamlandı | Next.js, Kanban, Gantt, takvim, responsive |
| Tam fonksiyonel proje yönetim sistemi | ✅ Tamamlandı | 60+ use case, 30+ router, 14 tablo |
| KVKK/GDPR uyumluluk | ✅ Tamamlandı | Veri minimizasyonu, soft delete, audit log |
| Akademik standartlara uygun belgelendirme | ✅ Tamamlandı | SRS (IEEE 830), SDD (IEEE 1016), STD (IEEE 829) |

### 9.2 Sayısal Çıktılar

| Metrik | Değer |
|--------|-------|
| **Toplam kod satırı (backend)** | ~25.000 satır Python |
| **Toplam kod satırı (frontend)** | ~18.000 satır TypeScript/TSX |
| **Use Case sınıfı sayısı** | 60+ |
| **API endpoint sayısı** | 150+ (30 router) |
| **Veritabanı tablosu** | 14 ana tablo |
| **Pydantic DTO sayısı** | 50+ |
| **Test sayısı** | 390+ (birim + entegrasyon + güvenlik) |
| **Test coverage** | Domain %95+, Application %85+ |
| **Akademik doküman sayısı** | 5 (SRS, SDD, STD, dönem sonu, bu rapor) |
| **Geliştirme süresi** | 2 akademik dönem (~36 hafta) |
| **Git commit sayısı** | 500+ |

### 9.3 Öğrenilen Dersler

Bu proje sürecinde edinilen en değerli öğrenmeler:

1. **Mimari önce gelir, özellik sonra:** Başlangıçta Clean Architecture'a yatırım yapmak, ilerleyen aşamalarda özellik eklemeyi dramatik biçimde hızlandırdı. Domain katmanının framework'ten bağımsızlığı, test edilebilirliği artırdı ve değişime karşı direnç yarattı. Eğer projeye "spaghetti code" ile başlasaydık, ikinci dönemdeki büyük ölçekli özelliklerin (sprint yönetimi, Kanban, Gantt) eklenmesi çok daha zor olurdu.

2. **Belgeler canlı kalmalıdır:** SRS ve SDD'yi uygulama ilerledikçe güncellemek, tasarım ile implementasyon arasındaki uyumsuzlukları erkenden yakalamayı sağladı. v1.0 dokümanlarından v1.1'e geçişte gerçekleştirilen revizyon, "doküman çürümesi" (documentation rot) sorununu önledi.

3. **Güvenlik geriye eklenmez:** OWASP riskleri baştan tasarıma dahil edildiğinde, güvenlik testlerinde kritik bulgular ortaya çıkmadı. Güvenliği sonradan eklemeye çalışmak çok daha maliyetli olurdu — özellikle veri modeli ve API tasarımı kararlarını geriye dönük değiştirmek mümkün olmazdı.

4. **Metodoloji soyutlaması zaman kazandırır:** Strategy Pattern kullanımı ilk başta "fazladan iş" gibi göründü. Ancak üç farklı metodoloji (Scrum, Kanban, Waterfall) eklendiğinde değeri net biçimde ortaya çıktı. Yeni bir metodoloji eklemek için mevcut kodu değiştirmek gerekmiyor — bu **OCP'nin pratikteki gücü**.

5. **Test yatırımı kendini ödüyor:** İlk başta test yazmak "yavaşlatıcı" gibi göründü, ama refactoring sırasında güvenli zemin sağladı. Özellikle ikinci dönemdeki büyük değişikliklerde testler regression riskini minimize etti.

6. **Çift kişilik ekip iletişimi kritiktir:** Sürüm kontrolü disiplini (her commit küçük, anlamlı; her PR kod inceleme), daily standup yerine pull request yorumları üzerinden iletişim kurmamızı sağladı. Bu da paralel çalışmamıza imkan tanıdı.

7. **Akademik ve sektörel pratiklerin entegrasyonu mümkündür:** IEEE standartlarına uygun belge yazımı (akademik) ile Clean Architecture, SOLID, CI/CD gibi sektörel pratikler birbiriyle çelişmez; aksine birbirini güçlendirir.

### 9.4 Karşılaşılan Zorluklar ve Çözümler

| Zorluk | Çözüm |
|--------|-------|
| **SQLAlchemy 2.0 Async migration**: Eski tutorial'lar 1.x sürümünden | Resmi 2.0 migration kılavuzu okundu, yeni async pattern'leri benimsendi |
| **Pydantic v1 → v2 breaking changes** | Migration script yazıldı; v2 syntax'a geçildi |
| **Strategy Pattern'in concrete'den ayrılması zor olduğunda** | Domain entity ile strategy arasındaki sorumluluğu netleştirdik (strategy yalnızca kurallar, entity veri) |
| **Frontend state yönetimi karmaşıklığı** | SWR ile server state, React Context ile UI state ayrıştırıldı |
| **Tekrarlayan görev zamanlayıcısı timezone sorunları** | UTC standardı kullanıldı, kullanıcı timezone'una frontend'de dönüşüm |
| **N+1 query problemi (Sprint listeleme)** | `selectinload` ile eager loading; SQL log incelendi |
| **Drag-drop animasyon performansı** | @dnd-kit yerine native HTML5 drag denemesi başarısız oldu, @dnd-kit'in optimistik update mantığı çözüm sağladı |

### 9.5 Gelecek Çalışmalar

Sistemin bir sonraki sürümünde planlanacak geliştirmeler:

**Kısa Vadeli (3-6 ay):**
- **Üçüncü parti entegrasyonlar:** Slack, MS Teams, Google Calendar (altyapı hazır)
- **Misafir kullanıcı rolü:** Salt okunur proje erişimi
- **Çoklu dil desteği (i18n):** Türkçe + İngilizce başlangıç
- **Karanlık tema:** Göz yorgunluğu azaltımı
- **WebSocket bildirimleri:** HTTP polling yerine gerçek zamanlı push
- **İki faktörlü doğrulama (2FA):** TOTP altyapısı hazır

**Orta Vadeli (6-12 ay):**
- **Mobil uygulama:** React Native ile cross-platform (iOS + Android)
- **Gelişmiş AI analizi:** Risk tahmini, kaynak optimizasyonu, tamamlanma tarihi öngörüsü
- **Time tracking:** Görev başına zaman izleme, otomatik raporlama
- **Bütçe yönetimi:** Maliyet alanları, EVM metrikleri
- **PMBOK Knowledge Areas:** Tedarik yönetimi modülü eklenmesi

**Uzun Vadeli (12+ ay):**
- **Kurumsal SSO:** SAML, OIDC, LDAP entegrasyonu
- **Marketplace:** Üçüncü parti eklenti ekosistemi
- **Voice control:** "Hey SPMS, yeni görev oluştur" gibi sesli komutlar
- **Public API ve webhook'lar:** Geliştiriciler için programatik erişim
- **Multi-tenant SaaS modu:** Tek kurulumda çoklu kiracı desteği

### 9.6 Genel Değerlendirme

Bu bitirme projesi, **iki akademik dönemlik bir sürede sıfırdan tam fonksiyonel bir kurumsal yazılım sisteminin** geliştirilmesi sürecini kapsamaktadır. Süreç boyunca:

- **Mühendislik problemi** doğru tanımlanmış,
- **Akademik literatür** taranarak konumlandırma yapılmış,
- **Standartlara uygun belgeler** üretilmiş (IEEE 830/1016/829),
- **Modern yazılım mühendisliği pratikleri** (Clean Architecture, SOLID, TDD, CI/CD) hayata geçirilmiş,
- **Çoklu metodoloji destekli, ölçeklenebilir bir sistem** ortaya konulmuştur.

SPMS, akademik bir projeyi aşan boyutta bir kod tabanı ve mimari olgunlukla teslim edilmiş; **gerçek dünyada konuşlandırılabilir** bir ürün niteliğine ulaşmıştır. Açık kaynak olarak yayımlandığında, küçük ve orta ölçekli yazılım ekiplerine **maliyetsiz, modern ve esnek** bir proje yönetim alternatifi sunma potansiyeline sahiptir.

Proje süreci boyunca akademik danışmanımız **Prof. Dr. Hacer KARACAN**'ın yönlendirmeleri ve geri bildirimleri büyük katkı sağlamış; kendisine teşekkürlerimizi sunarız. Ayrıca Bilgisayar Mühendisliği bölümümüze, lisans eğitimi boyunca bizlere sağladığı kapsamlı teorik ve pratik altyapı için müteşekkiriz.

---

## 10. KAYNAKLAR

[1] The Standish Group, "Chaos Report 2020: The Definitive Reference for the Project and Application Management Industry," The Standish Group International, Boston, MA, 2020.

[2] Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, 7. baskı, PMI, Newtown Square, PA, 2021.

[3] E. C. Conforto, F. Salum, D. C. Amaral, S. L. da Silva, and L. F. M. de Almeida, "Can Agile Project Management be Adopted by Industries Other than Software Development?" *Project Management Journal*, vol. 45, no. 3, pp. 21–34, June 2014. DOI: 10.1002/pmj.21410

[4] M. A. Storey, C. Treude, A. van Deursen, and L. T. Cheng, "The Impact of Social Media on Software Engineering Practices and Tools," in *Proceedings of the FSE/SDP Workshop on Future of Software Engineering Research*, Santa Fe, NM, USA, 2010, pp. 359–364.

[5] S. Nerur, R. Mahapatra, and G. Mangalaraj, "Challenges of Migrating to Agile Methodologies," *Communications of the ACM*, vol. 48, no. 5, pp. 72–78, May 2005. DOI: 10.1145/1060710.1060712

[6] H. Kerzner, *Project Management: A Systems Approach to Planning, Scheduling, and Controlling*, 12. baskı, John Wiley & Sons, Hoboken, NJ, 2017.

[7] Digital.ai, "15th Annual State of Agile Report," Digital.ai (CollabNet/VersionOne), Atlanta, GA, 2021. [Çevrimiçi]. Erişim: https://digital.ai/

[8] O. Salo and P. Abrahamsson, "Agile Methods in European Embedded Software Development Organisations: A Survey on the Actual Use and Usefulness of Extreme Programming and Scrum," *IET Software*, vol. 2, no. 1, pp. 58–64, February 2008.

[9] M. C. Marando, "How to Maximize Your Project's Impact Using Trello," *PM World Journal*, vol. IX, no. IV, April 2020.

[10] F. Koch, "Open Source Project Management Tools: A Comparative Review," *Journal of Open Source Software*, vol. 4, no. 35, p. 1238, 2019.

[11] Asana Inc., "Asana Product Documentation," [Çevrimiçi]. Erişim: https://asana.com/guide, Erişim Tarihi: Nisan 2026.

[12] G. Levin and P. F. Rad, *Work Breakdown Structures for Projects, Programs, and Enterprises*, Management Concepts Press, Tysons Corner, VA, 2013.

[13] Gartner Inc., "Gartner Hype Cycle for Project and Portfolio Management, 2024," Gartner Research, Stamford, CT, August 2024.

[14] OWASP Foundation, "OWASP Top 10 — 2021: The Ten Most Critical Web Application Security Risks," [Çevrimiçi]. Erişim: https://owasp.org/www-project-top-ten/, Erişim Tarihi: Mart 2026.

[15] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, Upper Saddle River, NJ, 2017.

[16] R. C. Martin, *Clean Code: A Handbook of Agile Software Craftsmanship*, Prentice Hall, Upper Saddle River, NJ, 2008.

[17] M. Fowler, *Patterns of Enterprise Application Architecture*, Addison-Wesley Professional, Boston, MA, 2002.

[18] E. Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*, Addison-Wesley Professional, Boston, MA, 2003.

[19] IEEE, "IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications," IEEE Computer Society, Piscataway, NJ, 1998.

[20] IEEE, "IEEE Std 1016-2009: IEEE Standard for Information Technology — Systems Design — Software Design Descriptions," IEEE Computer Society, Piscataway, NJ, 2009.

[21] IEEE, "IEEE Std 829-2008: IEEE Standard for Software and System Test Documentation," IEEE Computer Society, Piscataway, NJ, 2008.

[22] Kişisel Verilerin Korunması Kanunu (KVKK), Kanun No. 6698, T.C. Resmî Gazete, Sayı 29677, 7 Nisan 2016. [Çevrimiçi]. Erişim: https://www.kvkk.gov.tr/

[23] Avrupa Parlamentosu ve Konseyi, "Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR)," Avrupa Birliği Resmî Gazetesi, L 119, 4 Mayıs 2016.

[24] R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Doktora Tezi, University of California, Irvine, CA, 2000.

[25] M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, IETF, May 2015. [Çevrimiçi]. Erişim: https://datatracker.ietf.org/doc/html/rfc7519

[26] E. Rescorla, "The Transport Layer Security (TLS) Protocol Version 1.3," RFC 8446, IETF, August 2018.

[27] K. Schwaber and J. Sutherland, "The Scrum Guide™: The Definitive Guide to Scrum: The Rules of the Game," Scrum.org, November 2020. [Çevrimiçi]. Erişim: https://scrumguides.org/

[28] D. J. Anderson, *Kanban: Successful Evolutionary Change for Your Technology Business*, Blue Hole Press, Sequim, WA, 2010.

[29] World Wide Web Consortium (W3C), "Web Content Accessibility Guidelines (WCAG) 2.1," W3C Recommendation, June 2018. [Çevrimiçi]. Erişim: https://www.w3.org/TR/WCAG21/

[30] ISO/IEC, "ISO/IEC 25010:2011 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE)," International Organization for Standardization, Geneva, 2011.

[31] FastAPI Documentation, "FastAPI Framework Documentation," [Çevrimiçi]. Erişim: https://fastapi.tiangolo.com/, Erişim Tarihi: Mayıs 2026.

[32] Next.js Documentation, "Next.js App Router Documentation," Vercel Inc., [Çevrimiçi]. Erişim: https://nextjs.org/docs, Erişim Tarihi: Mayıs 2026.

[33] SQLAlchemy Documentation, "SQLAlchemy 2.0 Documentation," [Çevrimiçi]. Erişim: https://docs.sqlalchemy.org/en/20/, Erişim Tarihi: Mayıs 2026.

[34] PostgreSQL Global Development Group, "PostgreSQL 16 Documentation," [Çevrimiçi]. Erişim: https://www.postgresql.org/docs/16/, Erişim Tarihi: Mayıs 2026.

[35] Docker Inc., "Docker Documentation," [Çevrimiçi]. Erişim: https://docs.docker.com/, Erişim Tarihi: Mayıs 2026.

---

## EKLER

### EK-A: Geliştirici Profili

| Dimension | Rating | Confidence |
|-----------|--------|------------|
| Communication | mixed | LOW |
| Decisions | deliberate-informed | MEDIUM |
| Explanations | educational | MEDIUM |
| Debugging | diagnostic | MEDIUM |
| UX Philosophy | design-conscious | MEDIUM |
| Vendor Choices | conservative | MEDIUM |
| Frustrations | regression | HIGH |
| Learning | guided | MEDIUM |

### EK-B: Proje Zaman Çizelgesi

| Dönem | Hafta | Aşama | Çıktı |
|-------|-------|-------|-------|
| BM495 | 1-2 | Proje kurulumu | Git repo, Docker, Next.js, FastAPI iskelet |
| BM495 | 3-4 | Veri modeli ve domain | ER diagram, SQLAlchemy modeller, Domain entity'ler |
| BM495 | 5-6 | Kimlik doğrulama | JWT, bcrypt, register/login |
| BM495 | 7-8 | RBAC | Permission matrix, project_members |
| BM495 | 9-10 | Çekirdek CRUD | Project, task CRUD use case'leri |
| BM495 | 11-12 | Dashboard | Yönetici/çalışan dashboard, SRS/SDD v1.0 |
| BM496 | 13-14 | Strategy Pattern | ProcessStrategy, factory, üç metodoloji |
| BM496 | 15 | Sprint yönetimi | Sprint CRUD, burndown chart |
| BM496 | 16 | Kanban | Drag-drop, WIP limit |
| BM496 | 17 | Gantt + Takvim | frappe-gantt, FullCalendar |
| BM496 | 18 | Bağımlılık + tekrarlayan | DFS döngü, APScheduler |
| BM496 | 19 | Yorum + dosya + bildirim | Comment, attachment, notification |
| BM496 | 20 | Raporlama | CFD, lead/cycle, PDF/Excel |
| BM496 | 21 | Güvenlik sertleştirme | Rate limit, parola sıfırlama, kilitleme |
| BM496 | 22 | AI önerileri | Görev öneri motoru |
| BM496 | 23 | Admin paneli | Admin user/role/audit/stats |
| BM496 | 24 | Final ve polish | Performans, erişilebilirlik, final raporu |

---

**İNTİHAL BEYANI**

Bu çalışmadaki tüm bilgilerin akademik kurallara ve etik davranışa uygun olarak alındığını ve sunulduğunu; bu belgede alıntı yaptığımı belirttiğim yerler dışında sunduğum çalışmanın kendi çalışmam olduğunu, Yükseköğretim Kurumları Bilimsel Araştırma ve Yayın Etiği Yönergesinde belirtilen bilimsel araştırma ve yayın etiği ilkelerine uygun olduğunu beyan ederim.

| | |
|--|--|
| **Numara** | 21118080055 — 22118080006 |
| **Ad Soyad** | Ayşe ÖZ — Yusuf Emre BAYRAKCI |
| **Tarih** | Mayıs 2026 |
| **İmza** | _________________________ |

---

*Akademik Danışman: **Prof. Dr. Hacer KARACAN** — Gazi Üniversitesi Mühendislik Fakültesi Bilgisayar Mühendisliği Bölümü*

*Bu doküman, BM495 ve BM496 Bilgisayar Mühendisliği Projesi I-II derslerinin nihai çıktısı olarak hazırlanmıştır.*
