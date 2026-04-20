# New_Frontend — Plan Uyumluluk Kontrolü

UI-TASARIM-PLANI.md'deki 17 maddenin New_Frontend'teki karşılığı kontrol edildi. Aşağıda sadece eksik veya eksik kalan noktalar listelenir.

---

## Kritik Eksikler (hiç implemente edilmemiş)

### E1. Backlog Paneli (Plan §9)

Proje detay sayfasında global backlog yan paneli yok. Sol kenarda dikey "Backlog" toggle butonu, 300px panel, arama, öncelik filtresi, sıralama, görev listesi, drag-drop desteği, toplu işlem modu — hiçbiri yok.

**Etkilenen dosya:** project-detail.jsx

### E2. Faz Tamamlanma Kriterleri (Plan §5)

Settings > Lifecycle alt sekmesinde faz tamamlanma kriterleri formu yok. Her faz için Collapsible, otomatik kriter toggle'ları, manuel kriter dinamik listesi, kaydet butonu — hiçbiri yok.

**Etkilenen dosya:** settings.jsx

### E3. Görev Detay — Faz Alanı ve Mini Stepper (Plan §14)

task-detail.jsx sidebar'ında faz alanı (enable_phase_assignment açıkken) gösterilmiyor. Ana görevlerin alt görev faz dağılımını gösteren mini stepper (`Analiz ✓ → Tasarım ● → Kodlama ○ → Test ○`) yok.

**Etkilenen dosya:** task-detail.jsx

### E4. Arşivlenmiş Proje Banner'ı (Plan §6)

Proje detay sayfasında arşivlenmiş proje AlertBanner'ı yok. "Bu proje arşivlenmiştir." uyarısı + "Aktif Et" butonu eksik. Ayrıca MoreH dropdown'ında "Projeyi Tamamla", "Askıya Al", "Arşivle" aksiyonları yok — durum badge dinamik ama değiştirme mekanizması eksik.

**Etkilenen dosya:** project-detail.jsx

---

## Kısmi Eksikler (yapı var ama detaylar eksik)

### E5. Board Tab — Faz Badge ve Filtresi (Plan §14)

enable_phase_assignment açıkken Board Tab'daki görev kartlarında (KanbanCard) faz badge'i gösterilmiyor. Board toolbar'ında "Faza Göre Filtrele" dropdown'ı yok. List Tab'da "Faz" sütunu yok.

**Etkilenen dosya:** project-detail.jsx (BoardTab, ListTab, KanbanCard bileşenleri)

### E6. Lifecycle Tab — 0 Görevli Faz Empty State (Plan §3)

Lifecycle > Genel Bakış'ta 0 görevli faz seçildiğinde metrikler "—" göstermeli, Phase Gate otomatik kriterleri "Uygulanamaz" olarak gri gösterilmeli, bilgi mesajı gösterilmeli. Bu empty state kuralları implemente edilmemiş.

**Etkilenen dosya:** lifecycle-tab.jsx

### E7. Lifecycle Tab — Genel Bakış'ta "Faza Geçiş Yap" Butonu (Plan §3, §4)

Özet strip'te "Sonraki Faza Geç" kısayol butonu var ama faz detay kartının sağ altında olması gereken "Faza Geçiş Yap" butonu yok. Her iki buton da Phase Gate inline expand'i tetiklemeli.

**Etkilenen dosya:** lifecycle-tab.jsx (Overview bölümü)

### E8. Lifecycle Tab — Geçmiş Collapsible Görev Listesi (Plan §3 Geçmiş)

Faz geçmişi kartlarında Collapsible ile "Görev Detayları" bölümü (MTTaskRow compact ile görev listesi) tam olarak implemente edilmemiş.

**Etkilenen dosya:** lifecycle-tab.jsx (History bölümü)

### E9. Workflow Editor — Graph Traversal (Plan §13)

Aktif faz hesaplama hala hardcoded string dizisi + index karşılaştırması kullanıyor. Graph traversal (BFS) ile hesaplanması gerekiyor. Mevcut yapı V-Model gibi dallanmalı grafiklerde yanlış sonuç verir.

**Etkilenen dosya:** workflow-editor.jsx (WorkflowCanvas satır 62-63)

### E10. Workflow Editor — Paralel Aktif Fazlar (Plan §13)

Birden fazla node'un aynı anda "active" ring alması desteklenmiyor. Tekil `activePhase` prop'u kullanılıyor. Artırımlı modelde birden fazla faz aynı anda aktif olabilmeli.

**Etkilenen dosya:** workflow-editor.jsx (WorkflowCanvas)

### E11. Workflow Editor — Döngü Sayacı Badge (Plan §13)

Node üzerinde `×N` badge'i (aynı faz birden fazla kez kapatılmışsa) gösterilmiyor.

**Etkilenen dosya:** workflow-editor.jsx (node render bölümü)

### E12. Veri — Eksik Preset Template'ler (Plan §13)

data.jsx'te V-Model ve Spiral template'leri var ama Artırımlı (Incremental), Evrimsel (Evolutionary) ve RAD template'leri eksik.

**Etkilenen dosya:** data.jsx (DEFAULT_LIFECYCLES veya EXTRA_LIFECYCLES)

### E13. Proje Kartı — Durum Badge (Plan §6)

projects.jsx'te SegmentedControl filtresi ve archived opacity var ama proje kartlarının üzerinde durum badge'i (active→success, completed→info, on_hold→warning, archived→neutral) eksik.

**Etkilenen dosya:** projects.jsx (ProjectCard bileşeni)

### E14. Görev Detay — Dinamik Cycle Label (Plan §15)

task-detail.jsx sidebar'ında "Sprint 7" hardcoded gösteriliyor. Metodolojiye göre dinamik label olmalı (Sprint/Döngü/İterasyon/Artım).

**Etkilenen dosya:** task-detail.jsx

### E15. Kullanıcı Profili — MTTaskRow Kullanımı (Plan §10)

user-profile.jsx'te görev listesi custom grid-based satırlarla yapılmış. Planda MTTaskRow (my-tasks-parts.jsx'ten) kullanılması belirtilmişti. Fonksiyonel olarak çalışıyor olabilir ama plan tutarlılığı açısından MTTaskRow bileşeni yeniden kullanılmalı.

**Etkilenen dosya:** user-profile.jsx

### E16. theme.jsx — Eksik Status Tokenları (Plan §1)

`status-todo` ve `status-blocked` tokenları theme.jsx preset'lerinde tanımlı değil. StatusDot ve CFD grafiklerinde kullanılıyor.

**Etkilenen dosya:** theme.jsx (tüm preset'ler)

---

## Özet

Kritik (implemente edilmemiş): 4 madde (E1-E4)
Kısmi (yapı var, detay eksik): 12 madde (E5-E16)
Toplam eksik: 16 madde
