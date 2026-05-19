# SPMS Bitirme Posteri — İçerik Rehberi

> **Sergi sunumunda elinizin altında bulundurmanız için hazırlanmış kullanım kılavuzu.**
> Her bölümün **ne gösterdiği**, **ne anlatması gerektiği** ve **jüri/ziyaretçiye nasıl açıklanacağı** bu dökümanda.

**Proje:** Yazılım Projesi Yönetim Yazılımı (SPMS) — Grup **BMB-57**
**Hazırlayanlar:** Ayşe ÖZ (21118080055), Yusuf Emre BAYRAKCI (22118080006)
**Danışman:** Prof. Dr. Hacer KARACAN
**Boyut:** A1 Portrait (594×841 mm)
**Dosyalar:** [`poster-v1-ai.html`](../poster-v1-ai.html) (AI'lı) / [`poster-v2-no-ai.html`](../poster-v2-no-ai.html) (AI'sız)

---

## 📐 Genel Yapı

```
┌──────────────────── BAŞLIK BANDI ─────────────────────┐
│  Gazi Logo │ Bölüm + Proje Adı + Yazarlar │ 100.Yıl  │
└────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────┬──────────────────┐
│   SOL        │      ORTA        │      SAĞ          │
│  (Bağlam)    │ (Özgün Katkı)    │ (Modül + Sonuç)   │
│              │                  │                   │
│ 1. Özet      │ 5. Çoklu Metod.  │ 9. Modüller       │
│ 2. Problem   │ 6. Workflow Ed.  │ 10. Kanban Board  │
│ 3. Mimari    │ 7. Phase Gate    │ 11. Karşılaştırma │
│ 4. Tekno.    │ 8. AI / Güvenlik │ 12. Sonuç + QR    │
└──────────────┴──────────────────┴──────────────────┘
```

**3 Sütunlu Düzenin Mantığı:**
- **Sol sütun → "Neden ve Nasıl"** (Bağlam): Problem, mimari, teknoloji
- **Orta sütun → "Bizim Özgün Katkımız"**: Çoklu metodoloji + Yaşam Döngüsü + AI/Güvenlik
- **Sağ sütun → "Çıktı ve Konum"**: Modüller, demo görselleri, rakip karşılaştırması, sonuç

---

## 🎯 Posterin Ana Tezi (Tek Cümlede)

> **"Tek bir kod tabanında Scrum/Kanban/Waterfall/İteratif metodolojilerinin tamamını destekleyen, Clean Architecture ile Phase Gate ve görsel Workflow Editor sunan açık kaynak proje yönetim sistemi."**

Bu cümleyi jüriye ilk yaklaştığında 10 saniyede aktarabilmelisiniz.

---

# 📑 BÖLÜM BÖLÜM İÇERİK REHBERİ

## SOL SÜTUN

### 1️⃣ Özet (Abstract)

**Ne gösterir:**
SPMS'nin tek paragraflık tanımı + anahtar kelime şeridi.

**Ne anlatmalı:**
- SPMS web tabanlı, **metodoloji-bağımsız** bir proje yönetim sistemidir.
- Scrum/Kanban/Waterfall/İteratif tamamı **aynı kod tabanında** desteklenir.
- Kullanıcı metodolojiyi seçer; sistem ilgili kuralları (Sprint zorunluluğu, WIP limit, görev bağımlılığı, faz geçişi) **otomatik uygular**.
- Mimari **Clean Architecture + SOLID** prensiplerine göre tasarlanmıştır.

**Jüriye 1 cümlelik tanıtım:**
> *"Bu sistem, ticari araçların metodoloji bağımlılığını mimari düzeyde aşan birleşik bir proje yönetim platformudur."*

**Anahtar kelimeler şeridi neyi gösteriyor:** Posterdeki bütün kavramların önizlemesi — jüri buraya bakarak hangi konuların ele alındığını saniyeler içinde görüyor.

---

### 2️⃣ Problem & Motivasyon

**Ne gösterir:**
4 numaralı problem kategorisi (Yüksek Lisans Maliyetleri / Metodoloji Esnekliği Yokluğu / Açık Kaynak UX Yetersizliği / Paralel Araç Zorunluluğu) + lacivert kutu içinde SPMS Çözümü.

**Ne anlatmalı:**

1. **Yüksek Lisans Maliyetleri** — Jira, MS Project gibi profesyonel araçların kullanıcı başına aylık ücreti, KOBİ ölçekli ekipler için ciddi maliyet engeli yaratıyor. Bir ekip için yıllık binlerce dolar gerekiyor.
2. **Metodoloji Esnekliğinin Yokluğu** — Her araç tek bir paradigmaya odaklı: Jira çevik takımlar için optimize, MS Project klasik Waterfall için, Trello basit Kanban için. Hibrit kullanım için **birden çok araç** gerekiyor.
3. **Açık Kaynak UX Yetersizliği** — OpenProject gibi ücretsiz alternatifler lisans maliyetini çözüyor ama **kurulum karmaşık** ve **kullanıcı arayüzü** modern ticari alternatiflerin gerisinde kalıyor.
4. **Paralel Araç Zorunluluğu** — Aynı şirkette farklı ekipler farklı metodolojiler kullandığında birden çok aracı **paralel işletmek** gerekiyor → veri silosu, eğitim yükü, lisans çoğalması, operasyonel sürtünme.

**Capterra anketi** (literatürden, [6]): Kullanıcılar %65 raporlama, %64 doküman, %60 iş birliği ihtiyacını tek araçtan karşılayamıyor.

**Jüri sorabilir:** *"Niye başka bir araç gerekiyordu?"*
**Yanıtınız:** *"4 ayrı problem var: maliyet, metodoloji esnekliği, açık kaynak UX'i, paralel araç zorunluluğu. SPMS bunların hepsini tek üründe çözüyor — ücretsiz, 4 metodoloji destekli, modern arayüzlü, açık kaynak."*

**Jüri sorabilir:** *"Sizin çözümünüz spesifik olarak ne?"*
**Yanıtınız:** *"Lacivert kutudaki cümle: Metodoloji çeşitliliği bir **mimari sorun** olarak ele alınıp tek açık kaynak platformda + modern UX + Phase Gate ile disiplinli süreç yönetimi sunulur."*

---

### 3️⃣ Sistem Mimarisi — Clean Architecture (BÜYÜK GÖRSEL)

**Ne gösterir:**
4 katmanlı renkli diyagram (Domain → Application → Infrastructure → Presentation) + içe doğru bağımlılık okları + altın "Bağımlılık Kuralı" uyarı kutusu + SOLID şeridi (S-O-L-I-D harfleri).

**Ne anlatmalı:**
- Robert C. Martin'in **Clean Architecture (Hexagonal / Ports & Adapters)** modeli uygulanmıştır.
- **Bağımlılıklar yalnızca içe doğru gösterir**: Presentation → Infrastructure → Application → Domain.
- **Domain katmanı saf Python** — hiçbir framework veya kütüphaneye bağımlı değil. Pydantic entity'leri, ABC ile repository arayüzleri, domain hataları.
- **Application katmanı yalnızca Domain'i bilir** — DB, web framework gibi şeyleri tanımaz. Use case'ler, DTO'lar, port arayüzleri burada.
- **Infrastructure katmanı**, Domain'deki arayüzlerin somut implementasyonlarıdır (SQLAlchemy, JWT, bcrypt, SMTP).
- **Presentation (API) katmanı** FastAPI router'larını ve dependency injection wiring'i içerir.

**SOLID harflerinin ne demek olduğu:**
- **S** — Single Responsibility: Her use case tek bir iş eylemini temsil eder.
- **O** — Open/Closed: Yeni metodoloji eklemek için mevcut kod değişmez (yeni sınıf eklenir).
- **L** — Liskov Substitution: Bellek-içi mock veya gerçek DB repo birbiri yerine geçebilir.
- **I** — Interface Segregation: Sadece okuyacaksa "Reader" arayüzü, yazacaksa "Writer".
- **D** — Dependency Inversion: Yüksek seviye kod soyutlamaya bağımlı, somuta değil.

**Jüri sorabilir:** *"Clean Architecture'ı niye seçtiniz?"*
**Yanıtınız:** *"Çünkü 4 farklı metodoloji destekleyen bir sistemde yeni metodoloji eklemek ya da rapor türü eklemek mevcut kodu kırmamalı. SOLID + Clean Architecture, OCP'ye uygun **genişleme** sağlıyor."*

**Bu bölüm posterin akademik kalbidir** — mühendislik derecesi posteri olduğu için en uzun açıklamayı buraya yapın.

---

### 4️⃣ Teknoloji Yığını

**Ne gösterir:**
3 alt başlık altında ızgara şeklinde teknoloji kartları (Backend, Frontend, DevOps & Test).

**Ne anlatmalı:**

| Katman | Seçim | Neden? |
|--------|-------|--------|
| **Backend** | Python 3.12 + FastAPI | Async desteği, type hints, OpenAPI üretimi |
| | SQLAlchemy 2 (Async) | Modern async ORM |
| | PostgreSQL 15 | Endüstri standardı RDBMS |
| | Pydantic v2 | Type-safe DTO ve validation |
| | JWT + bcrypt | Standartlaşmış, güvenli auth |
| **Frontend** | TypeScript + Next.js | Strict mode + SSR/CSR hibrit |
| | React 18 + Tailwind | Modern komponent + utility CSS |
| | TanStack Query | Sunucu durumu yönetimi |
| | **React Flow** | Görsel workflow editor'ün motoru |
| **DevOps** | Docker | Tutarlı geliştirme ortamı |
| | pytest + Playwright | Birim + E2E testler |

**Jüri sorabilir:** *"Bu kadar teknoloji bir bitirme için fazla değil mi?"*
**Yanıtınız:** *"Her teknoloji belirli bir sorumluluğu üstleniyor — örneğin React Flow olmadan görsel Workflow Editor mümkün değil. Yığın seçimi 'modern, açık kaynak, KOBİ erişimi' kriterimize uygun."*

---

## ORTA SÜTUN — POSTERİN KALBİ

### 5️⃣ Çoklu Metodoloji Desteği ⭐

**Ne gösterir:**
4 büyük renkli kart (Scrum mavi, Kanban yeşil, Waterfall mor, İteratif turuncu) + altında 9 hazır şablonun listesi (Scrum, Waterfall, Kanban, Iterative, V-Model, Spiral, Incremental, Evolutionary, RAD).

**Ne anlatmalı:**
- Proje oluşturma sihirbazında kullanıcı 4 ana metodolojiden birini seçer.
- Sistem, metodolojiye özgü kuralları otomatik uygular:
  - **Scrum** → Sprint zorunluluğu, Burndown grafiği
  - **Kanban** → WIP limiti zorunluluğu, CFD (Cumulative Flow Diagram)
  - **Waterfall** → Faz kilidi (önceki faz bitmeden geçilmez), görev bağımlılığı
  - **İteratif** → V-Model, Spiral, RAD, Evolutionary, Incremental alt türleri
- **9 hazır şablon** ile kullanıcı sıfırdan kurmak zorunda kalmıyor — tek tıkla projeye uygulanıyor.

**Bu posterin ana farkıdır** — rakip yazılımların hiçbiri 4 metodolojiyi tek üründe sunmuyor.

**Jüri sorabilir:** *"Bu kurallar nasıl uygulanıyor, her metodoloji için ayrı if-else yığını mı var?"*
**Yanıtınız:** *"Hayır — **Strategy Pattern** uyguladık. Domain katmanında `ProcessStrategy` soyut sınıfı var; her metodoloji onun bir implementasyonu. OCP gereği yeni metodoloji eklemek için sadece yeni bir sınıf ekleniyor, mevcut kod kırılmıyor."*

---

### 6️⃣ Yaşam Döngüsü & Workflow Editor (BÜYÜK GÖRSEL #2)

**Ne gösterir:**
Workflow Editor'ın CSS mockup'ı:
- Üstte araç çubuğu (Faz ekle, Bağlantı, Grupla, Şablon + AI/Doğrula butonu)
- Dot grid arka plan üzerinde 5 faz node'u (Başlat → Planlama → Yürütme[aktif, döngü:2] → İnceleme → Kapanış)
- Aşağıda 4 özellik kutusu (4 akış modu, BFS, döngü sayacı, şema doğrulama).

**Ne anlatmalı:**
- **React Flow** tabanlı görsel süreç tasarımcısı.
- Kullanıcı sürükle-bırak ile **faz (node)** ve **geçiş (edge)** tanımlar.
- **4 akış modu:**
  - **Esnek** — fazlar arası serbest geçiş
  - **Sıralı-kilitli** — sıralı geçiş (klasik Waterfall)
  - **Sıralı-esnek** — sıralı + tanımlı geri dönüşler
  - **Sürekli** — tek akış (Kanban)
- **Aktif faz hesaplama BFS algoritması ile yapılır** → sabit indeks değil; paralel fazlar mümkün (aynı anda birden çok aktif faz).
- **Döngü sayacı** — bir faz birden fazla kez kapatılırsa rozet olarak gösterir (Sprint retrospektif sonrası tekrar Yürütme'ye dönüş gibi).
- **Şema doğrulama** — kaydetmeden önce başlangıç fazı/son faz/izole node/geçersiz cycle kontrol edilir.

**Jüri sorabilir:** *"Aktif fazı niye BFS ile hesaplıyorsunuz, neden sabit indeks değil?"*
**Yanıtınız:** *"Çünkü yaşam döngüsünde paralel akışlar olabilir — örneğin Spiral modelde aynı anda 'Analiz' ve 'Risk' fazları aktif olabilir. BFS, başlangıç düğümünden ulaşılabilen tüm fazları durum kontrolü ile gezerek aktif olanları çıkarır."*

---

### 7️⃣ Phase Gate Mekanizması

**Ne gösterir:**
7 adımlı numaralı dikey pipeline — her adım için kısa açıklama.

**Ne anlatmalı:**
Bir faz geçişi tetiklendiğinde **7 kontrol sırayla yürütülür:**

1. **Yetki kontrolü** — Faz geçişi yapma iznine sahip kullanıcı mı? (RBAC)
2. **Hız sınırı** — Aynı kullanıcı-proje çifti için kısa pencere içinde tekrar denemeyi engelliyoruz (DoS koruması).
3. **Idempotency** — İstemci aynı isteği yanlışlıkla iki kez gönderirse, ikinci işlem işlenmiyor.
4. **Otomatik kriter** — Tüm görevler tamamlandı mı? Açık blocker var mı? Kritik görev kaldı mı?
5. **Manuel kriter** — PM'in işaretlemesi gereken çek listesi (örn: "Müşteriyle review yapıldı").
6. **Eşzamanlılık kilidi** — Veritabanı tabanlı kilit: iki PM aynı anda farklı fazlara geçirmeye çalışırsa biri reddediliyor.
7. **Audit log** — Kaynak faz, hedef faz, döngü no, override kullanıldı mı — hepsi loglanıyor.

**Bu mekanizma niye önemli?**
- Çünkü **hiçbir rakip ürün** (Jira, MS Project, Asana, Trello) bu kadar disiplinli bir faz geçiş mekanizması sunmuyor — hepsi manuel.
- Phase Gate **endüstride önemli bir kalite kapısı kavramıdır** (özellikle havacılık, savunma sanayisinde yaygın).

**Jüri sorabilir:** *"Bu kontrolleri niye ayrı ayrı yaptınız, hepsini bir blokta yapsanız olmaz mıydı?"*
**Yanıtınız:** *"Hayır — her kontrol farklı bir hata senaryosunu ele alıyor. Örneğin yetki kontrolü 403 dönerken, idempotency 409 döner. Ayrıca her kontrol bağımsız test edilebilir (SRP). Pipeline yapısı sayesinde yeni kontrol eklemek mevcut kontrolleri etkilemiyor."*

---

### 8️⃣A "AI ile Öner" — LLM Tabanlı Workflow Önerisi *(SADECE v1-AI VERSİYONUNDA)*

**Ne gösterir:**
Mor-kırmızı gradient kart + ✦ ikonu + akış şeması (Doğal dil → LLM → Önizleme → Kullanıcı Onayı) + Gartner alıntısı.

**Ne anlatmalı:**
- Workflow Editor'ün alt araç çubuğunda **"✦ AI ile Öner"** butonu var.
- Kullanıcı projesini doğal dilde tanımlar: *"15 kişilik ekip, 6 aylık banka uygulaması, regülasyon ağırlıklı"*.
- Sistem girdiyi **büyük dil modeline (LLM)** iletir.
- Modelden dönen workflow şeması editör üzerinde **önizleme** olarak gösterilir.
- Kullanıcı **kabul ederse uygulanır, reddederse atılır** — sistem hiçbir zaman otomatik uygulamaz.

**Niye önemli?**
- **Gartner**: 2030'a kadar proje yönetim görevlerinin **%80'inin AI tarafından yürütüleceği** öngörülüyor.
- SPMS bu eğilime **mimari düzeyde yanıt veriyor** — LLM entegrasyonu, soyutlanmış bir port (`IWorkflowSuggester`) üzerinden çalışıyor. Yarın GPT'den başka modele geçmek istersek sadece adaptörü değiştiriyoruz.

**Jüri sorabilir:** *"LLM hallüsinasyon yaparsa ne olur?"*
**Yanıtınız:** *"Sistem hiçbir zaman otomatik uygulamıyor — kullanıcı önizlemeyi görüp manuel onaylıyor. Ayrıca dönen şema **şema doğrulama** adımından geçiyor (başlangıç/son faz, cycle kontrolü). Geçersiz çıktıyı sistem reddediyor."*

---

### 8️⃣B Güvenlik Mimarisi & RBAC İzin Matrisi *(SADECE v2-NO-AI VERSİYONUNDA)*

**Ne gösterir:**
8 hücreli güvenlik özellikleri ızgarası + altında 5 satırlı RBAC izin matrisi (Admin/PM/Member/Guest).

**Ne anlatmalı:**

**Güvenlik bileşenleri:**
- **JWT (HS256)** — 30 dk geçerli token, Bearer header'da iletilir.
- **bcrypt** — Parolalar asla cleartext değil, hash'lenmiş.
- **Hesap kilitleme** — Brute-force koruması.
- **Rate limiting** — Login + kritik endpoint'lerde slowapi ile.
- **SQL Injection koruması** — ORM parametrik sorgular.
- **XSS koruması** — DOMPurify ile frontend sanitize.
- **CORS** — Allow-list tabanlı.
- **Audit Log** — Her kritik işlem JSON formatında loglanır.

**RBAC matrisi:**
- 4 sistem rolü (Admin/PM/Member/Guest) korunmuştur (silinemez/isim değiştirilemez).
- Admin paneli üzerinden **özel roller** oluşturulabilir.
- Her izin × her rol için **matris hücreleri** ile yetki tanımlanabilir.
- Her hücre değişikliği otomatik kaydedilir ve audit log'a düşer.

**Jüri sorabilir:** *"OWASP Top 10 kapsamını ne ölçüde karşılıyorsunuz?"*
**Yanıtınız:** *"SQL Injection, XSS, Broken Auth, CSRF, Sensitive Data Exposure kategorilerinde mitigasyon uyguladık. Manuel güvenlik doğrulaması yaptık ve token'sız erişimin engellendiği, yetersiz izinli erişimin reddedildiği test ettik."*

---

## SAĞ SÜTUN

### 9️⃣ Ana Modüller

**Ne gösterir:**
5 satırlı modül listesi — sol tarafta lacivert kod rozeti (AUTH/TASK/NOTIF/REPORT/PROCESS), sağ tarafta modül adı ve kısa açıklama.

**Ne anlatmalı:**

| Kod | Modül | Detay |
|-----|-------|-------|
| **AUTH** | Kullanıcı & Yetkilendirme | JWT, RBAC, **davet bazlı kayıt** (self-registration yok, admin davet eder), izin matrisi |
| **TASK** | Görev Yönetimi | Alt görev (recursive), görev bağımlılığı, tekrarlayan görev (haftalık/aylık), sprint, etiket |
| **NOTIF** | Bildirim | In-app çan + e-posta (SMTP) + **watcher** mekanizması (kullanıcı izlemek istediğini seçer) |
| **REPORT** | Raporlama | Burndown, **CFD** (Kanban için), **Lead/Cycle Time** (P50/P85/P95 histogram), Gantt, PDF/Excel export |
| **PROCESS** | Süreç Modeli | Metodoloji seçimi, **Lifecycle**, **Workflow Editor**, **Phase Gate** |

**Jüri sorabilir:** *"Niye davet bazlı kayıt, neden self-registration yok?"*
**Yanıtınız:** *"Kurumsal kullanıma yönelik tasarladık — herkes açıp hesap açamasın. Admin yeni kullanıcıyı e-posta + rol ile davet ediyor, kullanıcı aktivasyon linki ile şifresini belirliyor."*

---

### 🔟 Kanban Tahtası — WIP Limit Korumalı (BÜYÜK GÖRSEL #3)

**Ne gösterir:**
3 sütunlu Kanban mockup:
- Üstte **kırmızı uyarı banner'ı** ("WIP limit aşıldı: 4/3 — taşıma engellendi")
- **Yapılacak** sütun (normal, ∞ WIP)
- **Yapılıyor** sütun (turuncu vurgu, **4/3 ihlal rozeti**, 4 kart)
- **Tamam** sütun (normal, ∞ WIP)
- Kartlarda öncelik rozeti (High/Med/Low) + avatar dot.

**Ne anlatmalı:**
- **WIP (Work In Progress) limit** Kanban metodolojisinin temel kurallarından biridir.
- Bir sütunda çok fazla görev açık olursa ekip dağılır ve hiçbir şey bitmez.
- SPMS, sütun başına maksimum görev sayısını tanımlamanıza ve **sınır aşıldığında sürüklemeyi engellemenize** olanak tanır.
- İhlal durumunda:
  1. Sütun **arka planı renk değiştirir** (turuncu/sarı vurgu)
  2. **Uyarı banner'ı** görünür
  3. **Toast bildirimi** çıkar
  4. **Sürükleme engellenir** (taşıma backend'de reddedilir)

**Niye önemli?**
- Trello'da WIP limit **eklenti gerektirir**. SPMS'de **yerleşik ve zorunlu**.
- Jira'da WIP limit **yumuşak uyarı** olarak çalışır; SPMS'de **kesin engeleme** yapıyor.

**Jüri sorabilir:** *"Backend tarafında nasıl engelliyorsunuz?"*
**Yanıtınız:** *"MoveTaskUseCase, taşımayı yapmadan önce hedef sütunun WIP limitini ve mevcut kart sayısını kontrol ediyor. İhlal varsa `WipLimitExceededError` domain hatası fırlatıyor; API 409 döner ve frontend optimistik güncellemeyi geri alır."*

---

### 1️⃣1️⃣ Rakiplerle Karşılaştırma

**Ne gösterir:**
Tablo — 7 özellik × 5 rakip (Jira, Trello, MS Project, OpenProject, **SPMS**). SPMS sütunu altın arka planlı.

**Ne anlatmalı:**
Bu tabloya jüri **mutlaka bakacak** — orada SPMS'nin diğer araçlara göre **somut farkı** görünür olmalı.

| Özellik | SPMS'nin Avantajı |
|---------|-------------------|
| Çoklu metodoloji | **Yalnız SPMS** 4 metodolojinin tamamını tek üründe sunar |
| Phase Gate (otomatik) | **Yalnız SPMS** otomatik kriter değerlendirmesi yapar — diğerlerinde manuel |
| Görsel Workflow Editor | MS Project hariç hiçbiri tam görsel editor sunmuyor |
| CFD + Lead/Cycle | Trello, MS Project'te yok |
| RBAC izin matrisi (v2'de) | Hücre-bazlı yetki düzenleme |
| Açık kaynak | Sadece OpenProject + SPMS |
| Lisans maliyeti | Sadece OpenProject + SPMS ücretsiz |

**Jüri sorabilir:** *"Jira çok zengin bir ürün, onun yerine niye SPMS?"*
**Yanıtınız:** *"Jira birkaç metodolojide güçlü ama hibrit kullanım için ek araç gerektiriyor. SPMS'in özgün yanı, metodoloji çeşitliliğini tek üründe + Phase Gate gibi disiplinli kalite kapılarıyla sunması. KOBİ ölçeği için maliyet avantajı da var."*

---

### 1️⃣2️⃣ Sonuç & Gelecek Çalışmalar + QR

**Ne gösterir:**
Sonuç paragrafı + 4 maddelik gelecek liste + sağ alt köşede sabit QR kodu kartı.

**Ne anlatmalı:**

**Akademik kazanım:**
- Clean Architecture + SOLID prensiplerinin **gerçek ölçekte** uygulanmış bir örneği.
- Lisans öğrencileri için **referans kod tabanı**.

**Endüstriyel kazanım:**
- KOBİ'ler için lisans maliyeti olmayan, metodoloji esnek, açık kaynak alternatif.

**Gelecek çalışmalar:**
1. **WebSocket gerçek zamanlı bildirim** — Mimari hazır (bildirim port'u soyutlandı), sadece adaptör eklenecek.
2. **Multi-tenant** — Çoklu organizasyon desteği.
3. **Mobil uygulama** — React Native.
4. **(v2 için)** AI destekli workflow önerisi — bir sonraki sürümde.

**QR kodu ne içerir:** GitHub repo linki + (varsa) canlı demo URL'si. Jüri telefonla tarar, ek bilgiye ulaşır.

> ⚠️ **Önemli:** Şu anki QR kod dekoratif placeholder. Sergi öncesi gerçek bir QR kod jeneratörü ile (örn. qr-code-generator.com) gerçek URL'nizi içeren QR oluşturup SVG'yi değiştirmeniz gerekiyor.

---

# 🎤 Sergi Sunum Senaryoları

## Senaryo 1: Jüri Üyesi (Akademik) Yaklaşıyor

**30 saniyelik akış:**
1. Başlık + Özet'i göster → *"Bu sistem, 4 farklı yazılım metodolojisini tek platformda destekleyen bir proje yönetim aracı."*
2. **Sistem Mimarisi diyagramına** parmak götür → *"Clean Architecture ile katmanlı, SOLID prensiplerine uygun. Domain saf Python — hiçbir frameworke bağımlı değil."*
3. **Çoklu Metodoloji kartlarını** işaret et → *"Strategy Pattern kullanarak yeni metodoloji eklemek OCP'ye uygun şekilde mümkün."*
4. **Phase Gate**'i göster → *"7 adımlı kontrol pipeline'ı ile faz geçişlerinde disiplinli kalite kapısı sağlıyoruz."*

## Senaryo 2: Sektör Profesyoneli Yaklaşıyor

**30 saniyelik akış:**
1. Rakip Karşılaştırma tablosunu göster → *"Jira pahalı, Trello dar, MS Project öğrenme eğrisi dik. Biz hepsini tek üründe + ücretsiz birleştirdik."*
2. **Workflow Editor mockup**'ını işaret et → *"Bu ekran, projenize özgü yaşam döngüsünü sürükle-bırak ile tasarlamanızı sağlıyor. 9 hazır şablonumuz var."*
3. **Kanban + WIP** ekranını göster → *"WIP limit ihlali sürüklemeyi engelliyor, sütun rengi değişiyor. Trello'da bu eklenti gerektirir."*
4. (v1) **AI ile Öner**'i tanıt → *"LLM ile proje türünüzü doğal dilde tanımlayıp uygun workflow şemasını öneri olarak alabiliyorsunuz."*

## Senaryo 3: Öğrenci Yaklaşıyor

**Daha samimi:**
- *"Bu projeyi 2 dönemde ~52.600 satır kod yazarak yaptık. Backend'de Python/FastAPI, frontend'de Next.js. Clean Architecture'ı **uygulamak** öğretici oldu — özellikle DI'ı disiplinli yapmak."*
- QR kodu göster → *"GitHub'da kod açık, inceleyebilirsin."*

---

# ❓ Tahmini Jüri Soruları ve Yanıtları

## Mimari/Tasarım

**S: Niye Clean Architecture? Daha basit bir MVC olmaz mıydı?**
**C:** Çünkü 4 farklı metodoloji destekleyen bir sistemde test edilebilirlik ve genişletilebilirlik kritik. MVC, business logic'i controller'a karıştırma riski taşır. Clean Architecture, Domain'i framework'lerden yalıttığı için, yarın FastAPI'den başka bir framework'e geçsek bile iş kuralları değişmez.

**S: SOLID'in en somut uygulaması nerede?**
**C:** Strategy Pattern'de — `ProcessStrategy` soyut sınıfı OCP'nin örneği. Yeni metodoloji eklemek için mevcut kod kırılmıyor. Ayrıca repository arayüzleri (LSP) — test için bellek-içi mock'ları gerçek SQLAlchemy repo ile değiştirebiliyoruz.

## Metodoloji

**S: Metodolojiler arasındaki kuralları nasıl ayırıyorsunuz?**
**C:** Domain katmanında merkezi bir kural kümesi var — örneğin "Sprint zorunlu mu?" kuralı tek bir yerden okunuyor. Hem backend hem frontend aynı tabloyu paylaşıyor. Bir kuralı değiştirmek tek bir yerden yapılıyor.

**S: Sprint zorunluluğunu nasıl uyguluyorsunuz?**
**C:** Scrum projesinde görev oluştururken sprint atanması zorunlu — Domain validation hatası fırlıyor. Kanban'da sprint kavramı yok, görev doğrudan sütuna yerleşiyor.

## Phase Gate

**S: İki PM aynı anda faz geçirmeye çalışırsa ne olur?**
**C:** Veritabanı tabanlı bir kilit kullanıyoruz (advisory lock). İlk gelen geçişi yapar, ikinci istek "concurrent modification" hatası alır ve kullanıcıya bilgi gösterir.

**S: Override mekanizması var mı?**
**C:** Evet — Admin rolünde otomatik kriterleri override edebilen "force transition" var, ama her override audit log'a düşüyor (kim, ne zaman, hangi kriteri atladı).

## AI (v1)

**S: LLM neyse o, hallüsinasyon yaparsa?**
**C:** İki katmanlı koruma: (1) AI çıktısı önizleme olarak gösteriliyor, kullanıcı onayı zorunlu. (2) Dönen şema, kayıt öncesi şema doğrulama adımından geçiyor — geçersiz cycle/izole node varsa reddediliyor.

**S: Hangi modeli kullanıyorsunuz?**
**C:** Soyutlanmış bir port (`IWorkflowSuggester`) üzerinden çalışıyor. Şu an Claude/GPT modellerinden birini adaptör olarak takabiliriz. Mimari düzeyde model değiştirmek tek satırlık yapılandırma.

## Test

**S: Testlerde Clean Architecture nasıl yardımcı oldu?**
**C:** Domain ve Application katmanlarını test ederken DB ve HTTP'ye ihtiyacımız olmadı — bellek-içi mock repository'lerle use case'leri saf birim test ettik. Integration test gerçek PostgreSQL'e karşı çalıştı. Bu izolasyon test sürecini hızlandırdı.

## Genel

**S: 2 kişi nasıl 52.600 satır kod yazdı, AI yardımı mı?**
**C:** Boilerplate üretimi ve refactor önerileri için AI araçları (Claude Code, Copilot) kullandık. Ancak **mimari kararlar, test stratejisi, business logic, güvenlik kontrolleri tamamen bizim**. AI bizim için yazmıyor, biz onunla yazıyoruz.

---

# 📋 Sergi Hazırlık Listesi

## Poster
- [ ] PDF'e dönüştür (Cmd+P → A1, kenar boşluğu yok, arka plan grafikleri etkin)
- [ ] **Gerçek Gazi logoları** ekle (şu an placeholder — `Frontend/public/` altına Gazi PNG'leri koy ve `<img>` ile değiştir)
- [ ] **Gerçek QR kod oluştur** (qr-code-generator.com veya benzeri ile GitHub URL'sini içeren)
- [ ] Profesyonel matbaada A1 baskı (200gr+ mat kuşe)
- [ ] **Yedek kopya** (B1 boyutunda küçültülmüş 1 adet hazır bulunsun)

## Sunum
- [ ] Bu rehber dökümanını yazdır, posterin yanında dur
- [ ] **3 senaryo metni**ni ezberle (30 saniyelik akışlar)
- [ ] Laptop hazır bulundur → canlı demo gösterimi için
- [ ] Demo hesabı: `demo-pm@spms.local` / `demo-member@spms.local` gibi hazır

## Görsel Destek
- [ ] **GitHub repo linki** kartvizit boyutunda mini el ilanı (jüri/sektör isteyene dağıt)
- [ ] Workflow Editor + Kanban canlı demo ekranı sürekli açık tablette
- [ ] (v1 için) **AI ile Öner** canlı demosu — örnek proje açıklaması elinde hazır

---

# 📊 İki Versiyon Karşılaştırması

| Bölüm | v1 (AI'lı) | v2 (AI'sız) |
|-------|------------|-------------|
| Orta sütun #8 | ✦ **AI ile Öner** (mor gradient) | 🔐 **Güvenlik & RBAC** (matris tablosu) |
| Workflow Editor butonu | ✦ AI ile Öner | ✓ Doğrula |
| Anahtar kelimeler | + "AI" tagı | "AI" tagı yok |
| Karşılaştırma tablosu | "AI öneri desteği" satırı var | "RBAC izin matrisi" satırı var |
| Sonuç gelecek listesi | Genişletilmiş AI vurgusu | "AI destekli workflow (sonraki sürüm)" |

**Hangi versiyonu seçmeli?**
- **AI'lı (v1):** AI ile Öner özelliği gerçekten çalışıyorsa ve demo edebiliyorsanız.
- **AI'sız (v2):** AI özelliği henüz son entegrasyon aşamasındaysa veya jüri demo görmek isteyebilir endişeniz varsa. Güvenlik vurgusu da akademik posterler için güçlü.

---

**Hazırlayan:** Claude Code (poster içerik rehberi)
**Versiyon:** v1.0 — 2026-05-18
**Geri bildirim:** İçeriğe ekleme/çıkarma için Claude'a yazabilirsiniz.
