# SPMS — Eksik Sayfa ve Akış Analizi

Bu doküman, projenin mevcut durumunun metodoloji-agnostik (Scrum, Kanban, Waterfall, Iterative) incelenmesi sonucunda tespit edilen eksik sayfa, akış ve mekanizmaları listeler.

---

## Temel Mimari Sorun

Sistem her metodoloji için aynı `Sprint` entity'sini kullanıyor. Ancak Waterfall ve Iterative projelerinde Sprint hiç oluşturulmuyor (`sprint_id = NULL`). Board kolonları hem "durum" hem "faz" anlamında kullanılıyor. Örneğin Waterfall'da "Gereksinimler → Tasarım → Geliştirme → Test → Dağıtım" kolonları mevcut ama bunlar gerçek bir faz entity'si değil, sadece kolon isimleri. Bu durum, aşağıdaki eksikliklerin tümünün kökenindeki yapısal sorun.

---

## A. Tüm Metodolojiler İçin Geçerli Eksikler

### 1. Faz Geçmişi / Arşiv Görünümü

Kapatılmış fazları ayrı bir bölümde gösteren bir görünüm yok. Şu anda `sprints-list.tsx` içinde Planned, Active ve Closed fazlar aynı düz listede sıralanıyor. Kapatılan bir fazın kaç görevi tamamlanmış, kaç görevi taşınmış, ne kadar sürmüş, sprint goal'ü başarılmış mı gibi bilgileri gösteren bir retrospektif veya geçmiş görünümü mevcut değil.

### 2. Proje Durumu ve Arşivi

`Project` entity'sinde (`project.py`) `status`, `is_archived` veya `completed_at` gibi bir alan bulunmuyor. Bu yüzden biten projeleri arşivleme, askıya alma veya aktif projelerden ayırma mekanizması yok. Dashboard'da tüm projeler gösteriliyor, bitmiş olanları filtreleme veya gizleme imkanı yok. Bir projenin "aktif", "tamamlanmış", "askıda" veya "iptal" gibi durumlarını takip etmek mümkün değil.

### 3. Proje Bazlı Aktivite Akışı (Activity Feed)

Backend'de `AuditLogModel` tablosu mevcut ve görev bazlı değişiklik geçmişi (`GET /tasks/{task_id}/history`) endpoint'i çalışıyor. Ancak proje genelinde "kim ne yaptı, ne zaman yaptı" akışını gösteren bir sayfa yok. Sadece member dashboard'da kişisel aktivite (`GET /tasks/activity/me`) mevcut. Proje seviyesinde bir activity feed sayfası implemente edilmemiş.

### 4. Kullanıcı Profil Sayfası

`/users/[id]` gibi bir kullanıcı profil sayfası mevcut değil. Bir ekip üyesinin hangi projelerde çalıştığını, hangi görevlerin atandığını, genel performansını ve katkı geçmişini tek bir sayfada görmek mümkün değil. Sadece `/settings` sayfasında kullanıcı kendi profilini düzenleyebiliyor.

### 5. Admin Audit Log Sayfası

Sistem genelinde yapılan değişikliklerin logunu görüntüleme ekranı yok. `AuditLogModel` veritabanında var, kayıtlar tutuluyor ama bu loglara erişecek bir API endpoint'i ve frontend sayfası implemente edilmemiş. Admin panelinde sistem geneli audit trail görüntülemek mümkün değil.

### 6. Backlog Yönetimi Sayfası

Herhangi bir faza veya sprint'e atanmamış görevleri toplu yönetme sayfası yok. Sprint/faz kapatırken görevler "backlog"a taşınabiliyor ama backlog'u ayrı bir ekranda önceliklendirme, sıralama, toplu faza atama, drag-drop ile düzenleme gibi işlemleri yapacak bir arayüz mevcut değil.

---

## B. Waterfall-Spesifik Eksikler

### 7. Faz Geçişi (Phase Gate) Mekanizması

Waterfall metodolojisinde bir fazdan diğerine geçiş için onay mekanizması yok. `process_config` içinde `enforce_sequential_dependencies` flag'i mevcut ama bu görev seviyesinde bağımlılık kontrolü, faz seviyesinde bir geçiş kapısı değil. "Gereksinimler fazı tamamlandı, Tasarım fazına geçilebilir mi?" şeklinde bir onay akışı, manager onayı veya checklist mekanizması implemente edilmemiş. Waterfall'un temel prensiplerinden biri olan faz kapıları (phase gates) yazılımda karşılığını bulmamış.

### 8. Faz Tamamlanma Kriterleri

Bir fazın ne zaman "tamamlandı" sayılacağının tanımı yok. Tüm görevler bitmeli mi? Belirli bir yüzde yeterli mi? Manager onayı mı gerekli? Bir checklist mi var? Bu kriterlerin hiçbiri tanımlanabilir veya kontrol edilebilir değil. Faz sadece manuel olarak "Close Phase" butonuyla kapatılıyor, herhangi bir doğrulama yapılmıyor.

### 9. Milestone / Kilometre Taşı Sayfası

`process-templates.ts` içinde Waterfall şablonunun `dashboardWidgets` listesinde `milestones` tanımlı ama implemente edilmemiş. Waterfall projeleri için kritik olan ara teslimat noktalarını (milestone) tanımlama, tarih atama, ilerleme takibi yapma ve timeline üzerinde görselleştirme mekanizması yok. Gantt chart'ta görevler gösteriliyor ama milestone'lar özel bir entity olarak işaretlenemiyor.

### 10. Döküman / Artefakt Takibi

Process template'lerde her metodoloji için `artifacts` listesi tanımlı — Waterfall için SRS, SDD, STD, Release Notes; Scrum için Product Backlog, Sprint Backlog, Increment. Ancak bu artefaktları yönetecek bir sayfa yok. Hangi dökümanın hangi fazda üretildiği, mevcut versiyonu, kim tarafından oluşturulduğu, onay durumu gibi bilgileri takip eden bir arayüz implemente edilmemiş. Artefaktlar sadece template tanımında isim olarak duruyor, işlevsel bir karşılıkları yok.

---

## C. Kanban-Spesifik Eksikler

### 11. Cumulative Flow Diagram (CFD)

`process-templates.ts` içinde Kanban şablonunun `dashboardWidgets` listesinde `cfd` (Cumulative Flow) tanımlı ama implemente edilmemiş. Kanban'ın temel metriklerinden biri olan kümülatif akış diyagramı — hangi kolonda ne kadar iş birikmiş, darboğaz nerede oluşmuş — görselleştirmesi mevcut değil. Reports sayfasında Kanban projeleri için burndown yerine WIP distribution gösteriliyor ama bu CFD'nin yerini tutmuyor.

### 12. Lead Time / Cycle Time Takibi

`process-templates.ts` içinde Kanban şablonunun `dashboardWidgets` listesinde `leadtime` tanımlı ama implemente edilmemiş. Bir görevin oluşturulmasından tamamlanmasına kadar geçen süreyi (lead time) veya bir görevin çalışılmaya başlanmasından bitişine kadar geçen süreyi (cycle time) ölçen ve gösteren bir mekanizma yok. Bu metrikler Kanban'ın akış verimliliğini ölçmek için temel gereksinimler.

### 13. WIP İhlali Görsel Uyarısı

`enforce_wip_limits` flag'i ve kolonlarda `wip_limit` alanı mevcut. Ancak board görünümünde WIP limitini aşan kolonlar için görsel uyarı (kırmızı vurgulama, uyarı ikonu, tooltip) implemente edilmemiş. Kullanıcı WIP limitini aştığında bunu fark edemeyebilir. Backend'de WIP kontrolü yapılıp yapılmadığı da net değil — sadece bilgilendirme mi yoksa engelleme mi olması gerektiği tanımlı değil.

---

## D. Iterative-Spesifik Eksikler

### 14. İterasyon Karşılaştırma Görünümü

İterasyonlar arası ilerlemeyi karşılaştıran bir sayfa yok. "İterasyon 1'de 10 görev tamamlandı, İterasyon 2'de 15 görev tamamlandı, İterasyon 3'te scope büyüdü" gibi trend analizini gösteren bir görünüm mevcut değil. Velocity chart kısmen bu işlevi görüyor ama iterasyon bazlı detaylı karşılaştırma (scope değişimi, taşınan görevler, yeni eklenenler) eksik.

### 15. Değerlendirme Raporu Sayfası

`process-templates.ts` içinde Iterative şablonunun `artifacts` listesinde `review-report` (Değerlendirme Raporu) tanımlı ama implemente edilmemiş. İterasyon sonunda otomatik veya yarı-otomatik değerlendirme raporu üretecek bir akış yok. Tamamlanan görevler, karşılaşılan sorunlar, bir sonraki iterasyon için öğrenilen dersler gibi bilgileri derleyen bir sayfa mevcut değil.

---

## E. Lifecycle / Yaşam Döngüsü Eksikleri

### 16. Lifecycle Tab (İmplemente Edilmemiş)

Proje detay sayfasında bir "Lifecycle" sekmesi referans olarak geçiyor ancak bileşen kodu mevcut değil. Projenin başından sonuna hangi fazlardan geçtiğini, şu anda hangi fazda olduğunu ve kalan fazları gösteren görsel bir akış (stepper, flow diagram) implemente edilmemiş. Bu sekme tüm metodolojiler için projenin büyük resmine bakma imkanı sunacak kritik bir bileşen.

### 17. Hybrid / Flex Lifecycle Desteği

Kullanıcı kendi özel yaşam döngüsünü tanımlayamıyor. Sistem 4 sabit şablon sunuyor (Scrum, Kanban, Waterfall, Iterative) ve proje oluşturulurken bunlardan biri seçiliyor. Ancak "Waterfall + Kanban hibrit" veya "özel fazlardan oluşan esnek bir lifecycle" gibi bir model oluşturmak mümkün değil. Admin panelinde process template düzenleme var ama bu sadece kolon isimlerini ve behavioral flag'leri değiştirmeye izin veriyor, gerçek bir lifecycle tasarımcısı değil.

### 18. Faz Bazlı İlerleme Dashboard'u

Tüm metodolojiler için geçerli, faz bazlı ilerleme gösteren bir özet sayfa yok. "Şu anda hangi fazdayız, bu fazda ne kadar iş kaldı, kritik yol üzerindeki görevler hangileri, tahmini bitiş tarihi ne" gibi sorulara cevap veren bir görünüm mevcut değil. Dashboard'da genel metrikler (toplam proje, aktif görev, tamamlanan görev) var ama bunlar faz bazlı değil, proje geneli.

---

## F. Öncelik Sıralaması

### Kritik

- 7 — Faz Geçişi (Phase Gate) Mekanizması
- 8 — Faz Tamamlanma Kriterleri
- 16 — Lifecycle Tab
- 18 — Faz Bazlı İlerleme Dashboard'u

Bu dört eksik olmadan Waterfall ve Iterative projeleri gerçek anlamda faz takibi yapamıyor. Sistem sadece Scrum/Kanban board olarak çalışıyor.

### Yüksek

- 1 — Faz Geçmişi / Arşiv Görünümü
- 2 — Proje Durumu ve Arşivi
- 9 — Milestone / Kilometre Taşı Sayfası
- 10 — Döküman / Artefakt Takibi

Projenin geçmişini görme, biten projeleri ayıklama ve teslimatları takip etme ihtiyacı.

### Orta

- 3 — Proje Bazlı Aktivite Akışı
- 4 — Kullanıcı Profil Sayfası
- 5 — Admin Audit Log Sayfası
- 6 — Backlog Yönetimi Sayfası
- 11 — Cumulative Flow Diagram
- 12 — Lead Time / Cycle Time Takibi

Operasyonel verimlilik ve izlenebilirlik açısından önemli.

### Düşük

- 13 — WIP İhlali Görsel Uyarısı
- 14 — İterasyon Karşılaştırma Görünümü
- 15 — Değerlendirme Raporu Sayfası
- 17 — Hybrid / Flex Lifecycle Desteği

Güzel olur ama öncelik diğerlerinden sonra.
