# **GAZİ ÜNİVERSİTESİ** **MÜHENDİSLİK FAKÜLTESİ** **BİLGİSAYAR MÜHENDİSLİĞİ**

**BM495 BİLGİSAYAR MÜHENDİSLİĞİ PROJESİ I**


**SOFTWARE REQUIREMENTS SPECIFICATION (SRS)**


**Ayşe ÖZ-21118080055**


**Yusuf Emre BAYRAKCI-22118080006**


**Yazılım Projesi Yönetimi Yazılımı**


**AKADEMİK DANIŞMAN**


**Prof. Dr. HACER KARACAN**


_**9.11.2025**_


_2797 Kelime_


**İÇİNDEKİLER**


İÇİNDEKİLER ...................................................................................................................... 2


ŞEKİLLERİN LİSTESİ ......................................................................................................... 4


SİMGELER VE KISALTMALAR ........................................................................................ 5


1 GEREKSİNİMLER ........................................................................................................ 6


1.1 Gerekli Durum ve Modlar ...................................................................................... 6


1.2 SPMS Fonksiyonel Gereksinimleri ....................................................................... 6


1.2.1 Kullanıcı ve Yetkilendirme Modülü (SPMS-01) ................................................... 6


1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02) ....................................................... 7


1.2.3 Bildirim ve Mesajlaşma (SPMS-03) ...................................................................... 8


1.2.4 Raporlama ve Analitik (SPMS-04) ........................................................................ 9


1.2.5 Süreç Modeli Seçimi ve Özelleştirme (SPMS-05) ................................................ 9


1.3 SPMS Dış Arayüz Gereksinimleri ....................................................................... 10


1.3.1 Arayüz Tanımlaması ve Diyagramı ..................................................................... 10


1.3.2 Kullanıcı Arayüzü Gereksinimleri ....................................................................... 11


1.3.3 Uygulama Programlama Arayüzü (API) Gereksinimleri .................................... 12


1.3.4 Veri Tabanı Arayüzü Gereksinimleri .................................................................. 12


1.3.5 Dış Sistemlerle Entegrasyon Gereksinimleri ....................................................... 13


1.4 SPMS Dahili Arayüz Gereksinimleri ................................................................... 14


1.5 SPMS Dahili Veri Gereksinimleri ....................................................................... 15


1.6 Uyarlama Gereksinimleri ..................................................................................... 16


1.7 Emniyet Gereksinimleri ....................................................................................... 16


1.8 Güvenlik ve Gizlilik Gereksinimleri .................................................................... 17


1.9 SPMS Ortam Gereksinimleri ............................................................................... 18


1.10 Bilgisayar Kaynak Gereksinimleri ....................................................................... 19


1.10.1 Donanım ............................................................................................................ 19


1.10.2 Bilgisayar Donanımı Kaynak Kullanımı Gereksinimleri .................................. 19


1.10.3 Bilgisayar Yazılım Gereksinimleri .................................................................... 19


1.10.4 Bilgisayar İletişim Gereksinimleri ..................................................................... 19


1.11 Yazılım Kalite Faktörleri ..................................................................................... 19


1.12 Tasarım ve Uygulama Kısıtlamaları .................................................................... 20


1.13 Personelle İlgili Gereksinimler ............................................................................ 20


1.14 Eğitimle İlgili Gereksinimler ............................................................................... 21


1.15 Lojistikle İlgili Gereksinimler .............................................................................. 21


1.16 Diğer Gereksinimler ............................................................................................. 21


1.17 Ambalajlama Gereksinimleri ............................................................................... 21


1.18 Gereksinimlerin Önceliği ve Kritikliği ................................................................ 21


**ŞEKİLLERİN LİSTESİ**


**Şekil** **Sayfa**

Şekil 1.1. Sistem Aktörleri ve Kullanım Durumları .............................................................. 7


Şekil 1.2. Sistem Mimarisi ................................................................................................... 11


Şekil 1.3. SPMS Veri Akış Diyagramı ( Seviye 0 ) ............................................................. 14


Şekil 1.4 - Güvenlik Akışı: JWT kimlik doğrulama ............................................................ 18


**SİMGELER VE KISALTMALAR**


Bu çalışmada kullanılmış simgeler ve kısaltmalar, açıklamaları ile birlikte aşağıda


sunulmuştur.


**Kısaltmalar** **Açıklamalar**


**API** Application Programming Interface


**CI/CD** Continuous Integration / Continuous Delivery


**CORS** Cross-Origin Resource Sharing


**CPU** Central Processing Unit


**gRPC** Google Remote Procedure Call


**JSON** JSON Web Token


**KVKK** Kişisel Verilerin Korunması Kanunu


**OAuth2** Open Authorization


**ORM** Object-Relational Mapping


**REST** Representational State Transfer


**SPMS** Software Project Management Software


**SRS** Software Requirements Specification


**SQL** Structured Query Language


**TLS** Transport Layer Security


**UI** User Interface (Kullanıcı Arayüzü)


**XML** Extensible Markup Language


**1** **GEREKSİNİMLER**


**1.1** **Gerekli Durum ve Modlar**


Bu Yazılım Projesi Yönetim Yazılımı (SPMS), yazılım geliştirme ekiplerinin proje


süreçlerini yönetmek amacıyla tasarlanmış web tabanlı bir sistemdir.


Sistem, kullanıcı rolüne ve proje durumuna bağlı olarak farklı modlarda çalışır:


  - **Yönetici Modu:** Kullanıcı hesaplarını, rollerini ve sistem ayarlarını yönetir.


  - **Proje Yöneticisi Modu:** Proje oluşturma, görev atama, rapor alma ve performans


izleme işlemlerini yürütür.


  - **Ekip Üyesi Modu:** Kendisine atanmış görevleri görüntüler, günceller, yorum yapar


ve bildirimleri alır.


  - **Misafir (Kısıtlı Erişim) Modu:** Sistemde yalnızca belirli bilgilere salt okunur erişim


sağlar (gelecek sürümlerde).


  - **Bakım Modu:** Sistem güncellemeleri ve veri yedekleme süreçlerinde aktif olur.


Durumlar arası geçiş yetki bazlıdır; örneğin bir ekip üyesi proje yöneticisi tarafından


yetkilendirilmeden proje oluşturma moduna erişemez.


Her durumda sistem, oturum güvenliği ve veri bütünlüğünü korumak için kullanıcı


doğrulaması yapar.


**1.2** **SPMS Fonksiyonel Gereksinimleri**


**1.2.1 Kullanıcı ve Yetkilendirme Modülü (SPMS-01)**


Bu modül, kullanıcıların sisteme güvenli erişimini ve yetki düzeylerini yönetir.


  - **SPMS-01.1:** Sistem, kullanıcıların kayıt, giriş ve çıkış işlemlerini güvenli bir


biçimde yapmalarını sağlamalıdır.

  - **SPMS-01.2:** Her kullanıcıya rol bazlı erişim tanımlanabilmelidir (yönetici, proje


yöneticisi, ekip üyesi, gözlemci vb.).

  - **SPMS-01.3:** Kimlik doğrulama JWT (JSON Web Token) ile yapılmalı, parolalar


algoritmalarla şifrelenmelidir.


  - **SPMS-01.4:** Kullanıcı profili düzenlenebilir olmalı; kullanıcılar ekip oluşturma veya


ekip üyelerini davet etme işlemlerini gerçekleştirebilmelidir.

  - **SPMS-01.5:** Projelere erişim izinleri proje yöneticisi tarafından yönetilebilmelidir


(ör. “sadece ekibim”, “yöneticim”, “belirli kişiler”).

  - **SPMS-01.6:** Yetkilendirme yapısı modüler olmalı, ileride yeni rol tipleri


eklenebilecek şekilde ölçeklenebilir tasarlanmalıdır.


Şekil 1.1. Sistem Aktörleri ve Kullanım Durumları


**1.2.2 Proje ve Görev Yönetim Modülü (SPMS-02)**


Bu modül, yazılımın çekirdek işlevselliği olup projelerin ve görevlerin yönetilmesini sağlar.


  - **SPMS-02.1:** Kullanıcılar (yetkileri dahilinde) yeni proje oluşturabilmeli, proje


detaylarını (adı, açıklaması, başlangıç-bitiş tarihleri) düzenleyebilmeli ve


arşivleyebilmelidir.

  - **SPMS-02.2:** Proje yöneticileri, projelere ekip üyelerini atayabilmelidir.

  - **SPMS-02.3:** Kullanıcılar proje içinde görevler oluşturabilmeli, düzenleyebilmeli ve


silebilmelidir.

  - **SPMS-02.4:** Görevler ve alt görevler tanımlanabilmeli, görev önceliği ve durumu


değiştirilebilmelidir.

  - **SPMS-02.5:** Görevler arası bağımlılıklar (örn. "bitmeden-başlayamaz",


"başlamadan-başlayamaz") tanımlanabilmelidir.

  - **SPMS-02.6:** Tekrarlayan görevler desteklenmelidir (örneğin haftalık toplantılar).


  - **SPMS-02.7:** Tekrarlayan görevlerde sistem kullanıcıya değişiklik olduğunda


“tümünü mü yoksa yalnızca bu örneği mi değiştirmek istiyorsunuz?” şeklinde


kontrol sormalıdır.

  - **SPMS-02.8:** Tekrarlayan görevlerin bitiş kriteri belirlenebilir olmalıdır (tarih veya


tekrar sayısı).

  - **SPMS-02.9:** Aynı içeriğe sahip benzer görevler oluşturulduğunda sistem “benzer bir


görev zaten mevcut, emin misiniz?” uyarısı vermelidir.


Kullanıcılar, görevleri basit bir liste veya takvim üzerinde görebilmelidir.


  - **SPMS-02.10:** Görev geçmişi ve işlem logları sistemde tutulmalıdır.

  - **SPMS-02.11:** Görev detay sayfasında görev içi yorumlaşma ve dosya paylaşımı


mümkün olmalıdır.

  - **SPMS-02.12:** Görevler takvim görünümünde (timeline / Gantt benzeri)


izlenebilmelidir.


**1.2.3 Bildirim ve Mesajlaşma (SPMS-03)**


Bu modül, kullanıcıya uygulama içi bildirimlerin toplandığı ve kullanıcıya gösterildiği


modüldür.


  - **SPMS-03.1:** Sistem, görev ve proje değişiklikleri hakkında gerçek zamanlı bildirim


göndermelidir.

  - **SPMS-03.2:** Aşağıdaki durumlarda ilgili kullanıcılara bildirim gönderilmelidir.

  - **SPMS-03.3:** Her kullanıcı kendi rolüne göre mesajlaşma yetkisine sahip olmalıdır


(örneğin sadece ekip üyeleriyle, ya da yöneticisiyle).

  - **SPMS-03.4:** Görev içi mesajlaşma alanı olmalı, kullanıcılar yorum bırakabilmelidir.

  - **SPMS-03.5:** Bildirimler hem uygulama içi hem e-posta/push bildirimleriyle


iletilmelidir.

  - **SPMS-03.6:** Kullanıcılar bildirim tercihlerini özelleştirebilmelidir (ör. sessiz mod,


sadece önemli olaylar).

  - **SPMS-03.7:** Mesaj geçmişi güvenli şekilde saklanmalı, proje silinse bile erişim logu


tutulmalıdır.


**1.2.4 Raporlama ve Analitik (SPMS-04)**


  - **SPMS-04.1:** Sistem proje ilerleme durumlarını grafiksel biçimde sunmalıdır (ör.


görev tamamlanma oranı, sprint ilerleme grafiği).

  - **SPMS-04.2:** Raporlar kullanıcı, görev ve proje bazlı filtrelenebilmelidir.

  - **SPMS-04.3:** Rapor çıktıları PDF veya Excel formatında dışa aktarılabilmelidir.

  - **SPMS-04.4:** Kullanıcı performans metrikleri (tamamlanan görev sayısı, zamanında


teslim oranı) hesaplanmalıdır.

  - **SPMS-04.5:** Sistem performans verilerini yöneticilere dashboard üzerinden


göstermelidir.


**1.2.5 Süreç Modeli Seçimi ve Özelleştirme (SPMS-05)**


  - **SPMS-05.1:** Sistem yalnızca Scrum değil, Waterfall, Kanban, Iterative gibi farklı


süreç modellerini desteklemelidir.

  - **SPMS-05.2:** Kullanıcı, proje oluştururken süreç modelini seçebilmeli ve şablonlar


(layout template) otomatik oluşturulmalıdır.

  - **SPMS-05.3:** Kullanıcı süreç şablonlarını özelleştirebilmelidir (aktivite sıralaması,


sprint uzunluğu, toplantı periyotları).

  - **SPMS-05.4:** İleriye dönük olarak yeni modeller tanımlanabilir olmalıdır.

  - **SPMS-05.5:** Seçilen süreç modeline göre takvim ve tekrarlayan etkinlikler (ör.sprint


toplantıları) otomatik olarak planlanmalıdır.

  - **SPMS-05.6:** Sistem, kullanıcıların proje verilerini farklı şekillerde görselleştirmek


için projeye modüler görünümler eklemesine izin vermelidir. Kullanıcılar


istedikleri panoları projelerine ekleyebilmelidir.

  - **SPMS-05.7:** Kullanıcılar, görevleri özel durumlara göre görselleştirmek için projeye


bir Kanban panosu ekleyebilmelidir.

  - **SPMS-05.8:** Kullanıcılar, zaman çizelgesi ve görev bağımlılıklarını izlemek için


projeye bir Gantt şeması ekleyebilmelidir.

  - **SPMS-05.9:** Kullanıcılar, görevleri basit bir liste veya takvim üzerinde


görebilmelidir.


**1.3** **SPMS Dış Arayüz Gereksinimleri**


**1.3.1 Arayüz Tanımlaması ve Diyagramı**


Sistem üç temel dış arayüz katmanına sahiptir:


1. **Kullanıcı Arayüzü (Frontend UI)**


     - SPMS Web tabanlı, React teknolojisiyle geliştirilecektir.


     - Arayüz, responsive (duyarlı) yapıda olmalı; masaüstü, tablet ve mobil


cihazlarda tutarlı görüntü sağlamalıdır.


     - Arayüz, farklı tema veya renk paletleriyle özelleştirilebilir olmalıdır.


2. **Uygulama Programlama Arayüzü (Backend API)**


     - Sistem, dış istemcilere REST tabanlı JSON API’ler üzerinden hizmet


verecektir.


     - API servisleri FastAPI çerçevesinde geliştirilecek, kimlik doğrulama JWT


veya OAuth2 üzerinden sağlanacaktır.


     - Swagger veya Redoc tabanlı dokümantasyon otomatik olarak üretilmelidir.


     - Gelecekte GraphQL veya WebSocket tabanlı veri alışverişine geçiş


yapılabilecek şekilde yapılandırılmalıdır.


3. **Veri Tabanı Arayüzü (Database Layer)**


     - PostgreSQL ana veritabanı olarak kullanılacaktır.


     - Tablolar arası ilişkiler ORM (SQLAlchemy) aracılığıyla yönetilmelidir.


     - Veritabanı erişimi servis katmanlarıyla soyutlanmalı, doğrudan sorgular


yerine repository pattern kullanılmalıdır.


     - Veritabanı API’si ileride farklı bir motor (MySQL, MongoDB) ile


değiştirilebilir olacak şekilde modüler tutulmalıdır.


Şekil 1.2. Sistem Mimarisi


**1.3.2 Kullanıcı Arayüzü Gereksinimleri**


Kullanıcı arayüzü, sistemin tüm modüllerini tek noktadan erişilebilir hale getiren


etkileşim katmanıdır.


UI tasarımı, modüler, erişilebilir ve kullanıcı rollerine göre dinamik olarak değişebilen


bir yapıda olacaktır.


  - **SPMS-UI-01:** Dashboard ekranı kullanıcı rolüne göre özelleştirilmeli (ör.


yöneticilerde istatistik, ekip üyelerinde görev durumu).


  - **SPMS-UI-02:** Görev panosu sürükle-bırak yöntemiyle düzenlenebilmeli, her görev


kartı renk veya etiketle durum bildirmelidir.


  - **SPMS-UI-03:** Takvim modülü, görevlerin ve toplantıların zaman çizelgesini


gösterebilmeli; tekrarlayan görevleri vurgulamalıdır.


  - **SPMS-UI-04:** Raporlama ekranı, proje ve kullanıcı bazlı filtreleme özelliklerine


sahip olmalıdır.


  - **SPMS-UI-05:** UI bileşenleri (formlar, butonlar, kartlar) yeniden kullanılabilir


yapıdadır; yeni modüller eklendiğinde arayüz bütünlüğü bozulmamalıdır.


  - **SPMS-UI-06:** Mobil tarayıcılar için dokunmatik uyum ve sadeleştirilmiş görünüm


(responsive grid yapısı) sağlanmalıdır.


**1.3.3** **Uygulama Programlama Arayüzü (API) Gereksinimleri**


Sistem, harici uygulamalar veya kurum içi entegrasyonlar için güvenli bir API katmanı


sunacaktır.


  - **SPMS-API-01:** Tüm API uç noktaları (endpointler) kimlik doğrulama


gerektirmelidir.


  - **SPMS-API-02:** Veri formatı JSON olmalı; gerekirse XML eklenebilir.


  - **SPMS-API-03:** HTTP metodları REST standartlarına uygun şekilde kullanılmalıdır


(GET, POST, PUT, PATCH, DELETE).


  - **SPMS-API-04:** Hatalar standart HTTP kodları (200, 400, 401, 403, 404, 500) ile


dönmelidir.


  - **SPMS-API-05:** API dokümantasyonu Swagger UI veya Redoc ile otomatik


oluşturulmalıdır.


  - **SPMS-API-06:** Erişim sınırlandırması (rate limiting) uygulanmalıdır, böylece


kötüye kullanım önlenir.


  - **SPMS-API-07:** CORS politikaları tanımlanmalı; sadece güvenilir alan adlarından


gelen istekler kabul edilmelidir.


**1.3.4 Veri Tabanı Arayüzü Gereksinimleri**


Bu başlık, veritabanı erişim katmanının uygulama içi diğer bileşenlerle nasıl etkileştiğini


açıklar.


  - **SPMS-DB-01:** Uygulama ORM (SQLAlchemy) aracılığıyla veritabanı işlemlerini


yürütmelidir.


  - **SPMS-DB-02:** Tablolar arası ilişkiler (one-to-many, many-to-many) açık biçimde


tanımlanmalıdır.


  - **SPMS-DB-03:** Veritabanı sorguları optimize edilmeli, indeksleme stratejileri


belirlenmelidir.


  - **SPMS-DB-04:** Veritabanı erişim katmanı modüler olmalı; ORM değiştiğinde


sistemin diğer bölümleri etkilenmemelidir.


**1.3.5** **Dış Sistemlerle Entegrasyon Gereksinimleri**


İlerleyen sürümlerde sistemin diğer proje yönetimi veya iletişim araçlarıyla entegre


çalışabilmesi için altyapı desteği sağlanacaktır.


  - **SPMS-EXT-01:** Sistem üçüncü taraf API’lerle (ör. Slack, Microsoft Teams, Google


Calendar) entegrasyon desteklemelidir.


  - **SPMS-EXT-02:** Entegrasyonlar ayrı bir servis katmanında tutulmalı, çekirdek


uygulamayı etkilememelidir.


  - **SPMS-EXT-03:** Harici sistemlerle veri paylaşımı kullanıcı izni olmadan


yapılmamalıdır.


  - **SPMS-EXT-04:** Entegrasyon API anahtarları (API key, OAuth token) güvenli


biçimde saklanmalıdır.


  - **SPMS-EXT-05:** Yeni entegrasyonlar eklendiğinde, sistemin geri kalan


modüllerinde değişiklik gerektirmeyecek şekilde yapılandırılmalıdır.


Şekil 1.3. SPMS Veri Akış Diyagramı ( Seviye 0 )


**1.4** **SPMS Dahili Arayüz Gereksinimleri**


Sistem, modüler bir yapıya sahiptir ve her modül (ör. Kullanıcı Yönetimi, Görev Yönetimi,


Bildirim, Raporlama) kendi içinde bağımsız çalışırken diğer modüllerle tanımlı arayüzler


üzerinden etkileşim kurar.


  - **SPMS-INT-1:** Dahili arayüzler, açık ve belgeye dayalı bir API sözleşmesi (interface


contract) kullanılarak tanımlanmalıdır.


  - **SPMS-INT-2:** Modüller arasında veri paylaşımı, olay tabanlı (event-driven) veya


servis tabanlı (service-oriented) iletişim yöntemleriyle yapılmalıdır.


  - **SPMS-INT-3:** Modüller birbirine doğrudan bağımlı olmamalı; arayüzler


değiştiğinde sistemin genel bütünlüğü bozulmadan revizyon yapılabilmelidir.


  - **SPMS-INT-4:** Bildirim Modülü, Görev Yönetimi Modülü’nde gerçekleşen


değişiklikleri dinleyebilmeli; bu tür olaylar bir mesaj kuyruğu (ör. Redis Queue,


Kafka) üzerinden yönetilebilmelidir.


  - **SPMS-INT-5:** Raporlama Modülü, diğer modüllerden veri çekerken yalnızca sorgu


bazlı okuma (read-only) yetkisine sahip olmalıdır.


  - **SPMS-INT-6:** Dahili arayüzlerdeki tüm veri alışverişi JSON formatında


yapılmalıdır, ancak sistemin genişlemesi halinde XML, gRPC veya GraphQL gibi


formatlara uyarlanabilir olmalıdır.


**1.5** **SPMS Dahili Veri Gereksinimleri**


Sistem veri yapısı, genişletilebilir ve kolay güncellenebilir şekilde tasarlanacaktır. Veri


modeli ilişkisel (PostgreSQL) temellidir ancak ilerleyen sürümlerde NoSQL veya hibrit


yapılarla da uyumlu hale getirilebilir.


  - **SPMS-DATA-1:** Temel tablolar: Users, Roles, Projects, Tasks, Comments,


Notifications, Reports, Models, RepeatingEvents.


  - **SPMS-DATA-2:** Her tablo birincil anahtar (Primary Key) ve sürüm bilgisi


(versioning) alanı içermelidir.


  - **SPMS-DATA-3:** Verilerde tarihsel izleme (audit trail) tutulmalı; geçmiş


değişiklikler gerektiğinde geriye alınabilmelidir.


  - **SPMS-DATA-4:** Tekrarlayan görevlerde “başlangıç tarihi”, “tekrarlama aralığı” ve


“bitiş koşulu” zorunludur.


  - **SPMS-DATA-5:** Veriler, çoklu proje desteği için “project_id” üzerinden


ayrıştırılmalıdır.


  - **SPMS-DATA-6:** Veritabanı şeması revizyonlara açık olmalı; yeni alanlar eklenmesi


mevcut işleyişi bozmamalıdır (ör. NULL destekli alanlar).


  - **SPMS-DATA-7:** Silme işlemleri yumuşak silme (soft delete) mantığıyla yapılmalı,


kalıcı silme yalnızca yönetici izniyle gerçekleşmelidir.


  - **SPMS-DATA-8:** Veri ilişkileri, sistemin bütünlüğünü koruyacak şekilde


kısıtlamalarla (constraint) korunmalıdır; ancak modül genişletmelerinde bu kısıtlar


konfigüre edilebilir olmalıdır.


**1.6** **Uyarlama Gereksinimleri**


Sistem, organizasyonların farklı proje yönetim yöntemlerine veya ekip yapısına göre


kolayca uyarlanabilir olmalıdır.


  - **SPMS-ADAPT-1:** Kullanıcı, sistemdeki aktif süreç modelini (ör. Scrum, Kanban,


Waterfall) değiştirebilir; bu değişiklik yalnızca o projeyi etkiler.


  - **SPMS-ADAPT-2:** Sistem yöneticisi, yeni süreç modeli şablonları tanımlayabilir


veya mevcutları düzenleyebilir.


  - **SPMS-ADAPT-3:** UI öğeleri (renk paleti, durum etiketleri, grafik temaları)


organizasyon düzeyinde ayarlanabilir.


  - **SPMS-ADAPT-4:** Modüller, kurulum esnasında aktif/pasif olarak seçilebilmeli (ör.


raporlama kapatılabilir).


  - **SPMS-ADAPT-5:** Sistem parametreleri (ör. sprint süresi, görev sınırı, varsayılan


bildirim frekansı) konfigürasyon dosyaları veya yönetim paneli üzerinden


değiştirilebilir.


  - **SPMS-ADAPT-6:** Uyarlama işlemleri sistem yeniden başlatması gerektirmemelidir.


**1.7** **Emniyet Gereksinimleri**


Sistem, kullanıcı ve verilerin güvenliğini riske atmadan hatalara veya beklenmedik


durumlara karşı dayanıklı olmalıdır.


  - **SPMS-SAFE-1:** Kritik işlemler (proje silme, model değiştirme, veri dışa aktarma)


öncesinde kullanıcıdan onay alınmalıdır.


  - **SPMS-SAFE-2:** Oturum süresi dolduğunda kullanıcı sistemden otomatik olarak


çıkarılmalı; uyarı mesajı gösterilmelidir.


  - **SPMS-SAFE-3:** Hatalı kullanıcı giriş denemeleri beş defa tekrarlandığında geçici


kilitleme yapılmalıdır.


  - **SPMS-SAFE-4:** Emniyet protokolleri, ileride eklenebilecek izleme veya uyarı


servislerine entegre edilebilir olmalıdır (ör. log izleme servisi entegrasyonu).


**1.8** **Güvenlik ve Gizlilik Gereksinimleri**


Bu bölüm, 'Yazılım Projesi Yönetimi Yazılımı'nın uyması gereken güvenlik, kimlik


doğrulama ve veri gizliliği standartlarını tanımlar.


  - **SPMS-SEC-01:** Sistemin kimlik doğrulama mekanizması JSON Web Token (JWT)


tabanlı olmalıdır. Oturum yönetimi bu tokenlar üzerinden güvenli bir şekilde


sağlanmalıdır.

  - **SPMS-SEC-02:** Kullanıcı parolaları, veritabanında asla düz metin olarak


saklanamaz. Parolalar, bcrypt veya argon2 gibi güçlü ve geri döndürülemez


kriptografik karma (hash) algoritmaları kullanılarak saklanmalıdır.

  - **SPMS-SEC-03:** İstemci (React) ve sunucu (FastAPI API) arasındaki tüm veri


iletişimi, güvenli aktarım sağlamak için zorunlu olarak HTTPS (SSL/TLS) protokolü


üzerinden şifrelenmelidir.

  - **SPMS-SEC-04:** Sistem, rol bazlı erişim kontrollerini (RBAC) sunucu tarafında


(backend) katı bir şekilde uygulamalıdır. Bir kullanıcı, API aracılığıyla dahi olsa,


yetkisi olmayan bir projeye veya göreve (okuma, yazma, silme) erişememelidir.

  - **SPMS-SEC-05:** API uç noktaları (özellikle giriş ve kayıt işlemleri), kaba kuvvet


(brute-force) saldırılarını ve hizmet dışı bırakma (DoS) risklerini azaltmak için hız


sınırlandırmasına (rate limiting) tabi tutulmalıdır.

  - **SPMS-SEC-06:** Parola sıfırlama mekanizması, e-posta yoluyla gönderilen, tek


kullanımlık ve kısa süre geçerli (örn. 30 dakika) güvenli bağlantılarla (token)


sağlanmalıdır.

  - **SPMS-SEC-07:** Sunucu, yalnızca izin verilen istemci alan adlarından (React


uygulamasının çalıştığı adres) gelen isteklere izin veren katı bir Kaynaklar Arası


Çapraz Paylaşım (CORS) politikası uygulamalıdır.

  - **SPMS-SEC-08:** Sistem, kullanıcıların kişisel verilerinin (e-posta, isim vb.) ve proje


içeriklerinin (görevler, dosyalar) işlenmesi ve saklanması konusunda KVKK (Kişisel


Verilerin Korunması Kanunu) ve GDPR (Genel Veri Koruma Tüzüğü) politikalarına


uygun olarak tasarlanmalıdır.

  - **SPMS-SEC-09:** Veritabanı erişimi, SQL Injection (SQL Enjeksiyonu) saldırılarını


önlemek için Nesne-İlişkisel Eşleme (ORM) kütüphaneleri (örn. SQLAlchemy)


üzerinden parametreli sorgularla yapılmalı, doğrudan metin tabanlı sorgulardan


kaçınılmalıdır.


Şekil 1.4 - Güvenlik Akışı: JWT kimlik doğrulama


**1.9** **SPMS Ortam Gereksinimleri**


Sistem, web tabanlı mimari üzerine inşa edilecek ve hem bulut ortamında hem de yerel


sunucularda çalışabilecek şekilde tasarlanacaktır.


Çalışma ortamı, geliştirici ekiplerin ve kullanıcıların sistemle etkileşiminde esneklik


sağlayacak şekilde yapılandırılmalıdır.


  - **SPMS-ENV-1:** Uygulama modern web tarayıcıları (Chrome, Firefox, Edge, Safari)


üzerinden çalışmalıdır.


  - **SPMS-ENV-2:** Uygulama Docker tabanlı olarak konteynerize edilecek, böylece


farklı ortamlarda kolay kurulum ve ölçeklenme sağlanacaktır.


  - **SPMS-ENV-3:** Geliştirme, test, üretim (production) ortamları birbirinden bağımsız


olarak yapılandırılmalıdır.


  - **SPMS-ENV-4:** Sistem, düşük ağ bant genişliklerinde de kullanılabilirliği koruyacak


şekilde optimize edilmelidir.


**1.10** **Bilgisayar Kaynak Gereksinimleri**


**1.10.1 Donanım**


Minimum 4 çekirdek CPU, 8 GB RAM, 5 GB depolama.


**1.10.2 Bilgisayar Donanımı Kaynak Kullanımı Gereksinimleri**

Maksimum işlemci kullanımı %75’i aşmamalıdır.


**1.10.3 Bilgisayar Yazılım Gereksinimleri**


PostgreSQL, FastAPI, Node.js, React, Pandas, Chart.js, Docker.


**1.10.4 Bilgisayar İletişim Gereksinimleri**

HTTPS tabanlı istekler, REST API üzerinden veri alışverişi.


**1.11** **Yazılım Kalite Faktörleri**


Sistem, sürdürülebilir, ölçeklenebilir ve kullanıcı dostu bir mimariyi hedeflemektedir. Kalite


faktörleri aşağıdaki kriterlerle ölçülecektir:


  - **SPMS-QLT-1 (Fonksiyonellik):** Sistem, tanımlanan tüm işlevleri doğru biçimde


yerine getirmelidir.


  - **SPMS-QLT-2 (Güvenilirlik):** Herhangi bir hata durumunda veri kaybı


yaşanmamalı; sistem otomatik olarak toparlanmalıdır.


  - **SPMS-QLT-3 (Kullanılabilirlik):** Arayüzler kolay öğrenilebilir, erişilebilir ve


kullanıcı odaklı olmalıdır.


  - **SPMS-QLT-4 (Verimlilik):** Her işlem için ortalama yanıt süresi 5 saniyeyi


aşmamalıdır.


  - **SPMS-QLT-5 (Sürdürebilirlik):** Kod yapısı modüler olmalı, değişiklikler diğer


bileşenleri minimum düzeyde etkilemelidir.


  - **SPMS-QLT-6 (Esneklik):** Yeni süreç modelleri, rapor tipleri veya rol yapıları


eklenebilir olmalıdır.


  - **SPMS-QLT-7 (Test Edilebilirlik):** Birim, entegrasyon ve uçtan uca testler CI/CD


sürecine entegre edilmelidir.


**1.12** **Tasarım ve Uygulama Kısıtlamaları**


Sistem tasarımında belirli standartlara uyulacaktır, ancak teknolojik gelişmelere göre


değişiklik yapılabilir.


  - **SPMS-CON-1:** Geliştirme dili Python (FastAPI) ve TypeScript (React) olacaktır.


  - **SPMS-CON-3:** UI kütüphaneleri (Tailwind, shadcn/ui) kullanılacaktır; gerekirse


farklı frontend çerçevelerine geçiş yapılabilir.


  - **SPMS-CON-4:** API sürümlemesi (v1, v2, vb.) uygulanarak geriye dönük uyumluluk


korunmalıdır.


**1.13** **Personelle İlgili Gereksinimler**


Bu proje, iki kişilik bir ekip tarafından geliştirilmektedir: Ayşe Öz ve Yusuf Emre Bayrakcı


yazılım geliştirme sürecinin tüm aşamalarında aktif rol alacak; analiz, tasarım, kodlama, test


ve dokümantasyon süreçlerini birlikte yürüteceklerdir.


Ekipte hiyerarşik bir yapı bulunmamakta olup, sorumluluklar eşit olarak paylaşılacaktır.


Gerektiğinde görev dağılımları dinamik biçimde revize edilecektir. Her üye, kendi uzmanlık


alanına göre belirli modüllerin (örneğin; kullanıcı yetkilendirme, görev yönetimi, raporlama


vb.) geliştirilmesinden sorumludur.


Projede dış kaynak veya ek personel bulunmamaktadır. Gerekli olduğunda danışman


öğretim üyesinden teknik ve yönetsel geri bildirim alınacaktır. Kod sürüm yönetimi, hata


takibi ve iş bölümü Git tabanlı bir ortam üzerinden yürütülecektir.


Ekip üyelerinin görevleri yalnızca geliştirme aşamasıyla sınırlı değildir; test planlarının


hazırlanması, sistemin son kullanıcı dokümantasyonlarının oluşturulması ve projenin


sürdürülebilirliğini sağlamak da bu kapsamda olacaktır.


Uzun vadede sistemin bakım veya genişletme gereksinimleri oluşması durumunda, proje


belgelendirmesi üçüncü taraf geliştiricilerin devralabileceği şekilde düzenlenecektir.


**1.14** **Eğitimle İlgili Gereksinimler**


Uygulamanın hedef kitlesi için teknik eğitim gerekmemektedir.


Bu projenin temel hedeflerinden biri "kullanım kolaylığı" olduğundan, sistem kapsamlı bir


eğitim ihtiyacını en aza indirecek şekilde sezgisel olarak tasarlanmalıdır.


**1.15** **Lojistikle İlgili Gereksinimler**


Lojistik ile ilgili gereknsinimler mevcut değildir


Sistem web tabanlı olduğundan, fiziksel bir dağıtım veya lojistik gereksinimi yoktur.


**1.16** **Diğer Gereksinimler**


Önceki paragraflarda kapsanmayan ek bir gereksinim mevcut değildir.


**1.17** **Ambalajlama Gereksinimleri**


Ambalajlama ile ilgili gereksinimler mevcut değildir


**1.18** **Gereksinimlerin Önceliği ve Kritikliği**








|Seviye|Öncelik Tanımı|Kapsam|
|---|---|---|
|**1 (Kritik)**|Sistemin çalışmasını doğrudan etkiler;<br>değiştirilemez.|Kimlik doğrulama, veri güvenliği,<br>erişim kontrolü|
|**2 **<br>**(Yüksek)**|Temel işlevselliği sağlar; alternatif<br>uygulanabilir.|Görev yönetimi, süreç modeli seçimi,<br>raporlama|
|**3 (Orta)**|Kullanıcı deneyimini güçlendirir;<br>ertelenebilir.|Bildirim, mesajlaşma, özelleştirme<br>seçenekleri|
|**4 (Düşük)**|Görsel veya ikincil işlevlerdir; isteğe<br>bağlıdır.|Tema değişimi, dil seçimi, küçük<br>arayüz özellikleri|


**İNTİHAL BEYANI**


Bu çalışmadaki tüm bilgilerin akademik kurallara ve etik davranışa uygun


olarak alındığını ve sunulduğunu ve bu belgede alıntı yaptığımı belirttiğim yerler


dışında sunduğum çalışmanın kendi çalışmam olduğunu, Yükseköğretim Kurumları


Bilimsel Araştırma Ve Yayın Etiği Yönergesinde belirtilen bilimsel araştırma ve yayın


etiği ilkelerine uygun olduğunu beyan ederim.


Numara : 21118080055  22118080006


Ad Soyad :  Ayşe Öz Yusuf Emre Bayrakcı


Tarih :  09/11/2025


İmza :


