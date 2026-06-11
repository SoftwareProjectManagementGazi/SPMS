"""Canonical SDLC process templates — single source of truth.

Dokuz şablon: okulda öğretilen ve sektörde yaygın kullanılan klasik SDLC
modelleri. Seeder (taze kurulum) ve alembic 017 (mevcut DB temizliği) aynı
listeden beslenir, bu yüzden içerik burada değişir, iki tarafta birden değil.

Her default_workflow, modelin DERS KİTABI İLLÜSTRASYONUNU kanvasta yansıtacak
şekilde yerleştirildi:
  - Şelale       → sağa-aşağı inen merdiven
  - V-Modeli     → gerçek V (sol kol iner, sağ kol çıkar, doğrulama köprüleri)
  - Spiral       → içten dışa büyüyen dikdörtgen sarmal (4 kadran × 3 tur)
  - Yinelemeli   → altıgen döngü + değerlendirmeden planlamaya geri besleme
  - Artırımlı    → kayan artırım satırları (her artırım kendi mini-şelalesi)
  - Prototipleme → tasarla-yap-değerlendir dörtgen döngüsü, onayla ürüne çıkış
  - Scrum        → sprint çemberi (retro → planlamaya geri besleme, günlük döngü)
  - RAD          → kullanıcı tasarımı ⇄ hızlı inşa prototip döngüsü
  - Kanban       → tek sürekli akış fazı (continuous mod tek node ister)

Node id'leri ^nd_[A-Za-z0-9_-]{10}$ sözleşmesine uyar; her graf WorkflowConfig
Pydantic doğrulamasından geçer (test_canonical_templates.py bunu pinler).
"""
from app.infrastructure.database._default_columns import (
    KANBAN_DEFAULT_COLUMNS,
    SCRUM_DEFAULT_COLUMNS,
    WATERFALL_DEFAULT_COLUMNS,
)

# Kaldırılan şablonlar → projeleri devralacak kanonik şablon.
OBSOLETE_TEMPLATE_REMAP: dict[str, str] = {
    "V-Modeli + Scrum İç Döngüleri": "V-Modeli",
    "RUP (Rasyonel Birleşik Süreç)": "Yinelemeli Model",
    "XP (Aşırı Programlama)": "Scrum",
    "DSDM (Dinamik Sistem Geliştirme)": "Artırımlı Model",
    "FDD (Özellik Odaklı Geliştirme)": "Scrum",
    "SAFe (Ölçekli Çevik)": "Scrum",
    "Crystal Clear": "Scrum",
    "Lean / Sürekli Teslimat": "Kanban",
    "PRINCE2 (Proje Yönetimi)": "Waterfall",
}

OBSOLETE_TEMPLATE_NAMES: list[str] = list(OBSOLETE_TEMPLATE_REMAP.keys())


CANONICAL_TEMPLATES: list[dict] = [

    # ──────────────────────────── 1. SCRUM ────────────────────────────
    {
        "name": "Scrum",
        "is_builtin": True,
        "description": (
            "Zaman-kutulu sprintler, ürün backlog'u, günlük stand-up ve "
            "retrospektif ile iteratif-artımlı çevik geliştirme."
        ),
        "columns": [
            {"name": "Backlog", "order": 0},
            {"name": "To Do", "order": 1},
            {"name": "In Progress", "order": 2},
            {"name": "Code Review", "order": 3},
            {"name": "Done", "order": 4},
        ],
        "default_columns": SCRUM_DEFAULT_COLUMNS,
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": True, "wip_limits": False},
        "cycle_label_tr": "Sprint",
        "cycle_label_en": "Sprint",
        # Sprint çemberi: Backlog soldan girer, döngü saat yönünde döner,
        # İnceleme'den sağa Artırım/Yayın çıkar. Retro → Planlama ve Günlük
        # Scrum → Geliştirme geri beslemeleri döngüyü görselleştirir.
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_scbklg0001", "name": "Ürün Backlog'u",
                 "description": "Önceliklendirilmiş iş listesi; Product Owner sahipliğinde sürekli rafine edilir.",
                 "x": 60, "y": 300, "color": "status-todo", "is_initial": True},
                {"id": "nd_scplan0002", "name": "Sprint Planlama",
                 "description": "Takım sprint hedefini belirler ve backlog'dan sprint kapsamını çeker.",
                 "x": 340, "y": 140, "color": "status-todo"},
                {"id": "nd_scdev00003", "name": "Sprint Geliştirme",
                 "description": "Zaman kutusu içinde artırım geliştirilir; tanımı gereği 'bitti' kalitesinde.",
                 "x": 620, "y": 80, "color": "status-progress"},
                {"id": "nd_scdaly0004", "name": "Günlük Scrum",
                 "description": "15 dakikalık senkron: dün/bugün/engeller. Sprint boyunca her gün döner.",
                 "x": 900, "y": 140, "color": "status-progress"},
                {"id": "nd_screvw0005", "name": "Sprint İncelemesi",
                 "description": "Artırım paydaşlara gösterilir; geri bildirim backlog'a işlenir.",
                 "x": 900, "y": 460, "color": "status-review"},
                {"id": "nd_scretr0006", "name": "Sprint Retrospektifi",
                 "description": "Takım süreci değerlendirir; iyileştirme aksiyonları sonraki sprinte taşınır.",
                 "x": 620, "y": 520, "color": "status-review"},
                {"id": "nd_scincr0007", "name": "Artırım / Yayın",
                 "description": "Potansiyel olarak yayınlanabilir ürün artırımı teslim edilir.",
                 "x": 1180, "y": 300, "color": "status-done", "is_final": True},
            ],
            "edges": [
                {"id": "e_sc01", "source": "nd_scbklg0001", "target": "nd_scplan0002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc02", "source": "nd_scplan0002", "target": "nd_scdev00003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc03", "source": "nd_scdev00003", "target": "nd_scdaly0004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc04", "source": "nd_scdaly0004", "target": "nd_screvw0005", "type": "flow", "label": "Sprint sonu", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc05", "source": "nd_screvw0005", "target": "nd_scretr0006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc06", "source": "nd_scretr0006", "target": "nd_scplan0002", "type": "feedback", "label": "Yeni sprint", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc07", "source": "nd_scdaly0004", "target": "nd_scdev00003", "type": "feedback", "label": "Günlük döngü", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sc08", "source": "nd_screvw0005", "target": "nd_scincr0007", "type": "flow", "label": "Teslim", "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_scsprnt", "name": "Sprint Döngüsü", "color": "#6366F1",
                 "children": ["nd_scplan0002", "nd_scdev00003", "nd_scdaly0004", "nd_screvw0005", "nd_scretr0006"]},
            ],
        },
    },

    # ──────────────────────────── 2. KANBAN ────────────────────────────
    {
        "name": "Kanban",
        "is_builtin": True,
        "description": (
            "Sürekli akış, WIP limitleri ve çekme tabanlı iş akışı ile "
            "akışkan teslimat. Yaşam döngüsü tek sürekli fazdır; süreç "
            "görselleştirmesi görev panosunda yaşar."
        ),
        "columns": [
            {"name": "To Do", "order": 0, "wip_limit": 0},
            {"name": "Analiz", "order": 1, "wip_limit": 3},
            {"name": "Geliştirme", "order": 2, "wip_limit": 4},
            {"name": "Test", "order": 3, "wip_limit": 2},
            {"name": "Done", "order": 4, "wip_limit": 0},
        ],
        "default_columns": KANBAN_DEFAULT_COLUMNS,
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": True},
        "cycle_label_tr": "Döngü",
        "cycle_label_en": "Cycle",
        # continuous mod tek başlangıç+bitiş node'u ister.
        "default_workflow": {
            "mode": "continuous",
            "nodes": [
                {"id": "nd_kbflow0001", "name": "Sürekli Akış",
                 "description": "Tek aktif faz — iş, panodaki kolonlar üzerinden çekilerek akar.",
                 "x": 400, "y": 120, "color": "status-progress",
                 "is_initial": True, "is_final": True},
            ],
            "edges": [],
            "groups": [],
        },
    },

    # ──────────────────────────── 3. WATERFALL ────────────────────────────
    {
        "name": "Waterfall",
        "is_builtin": True,
        "description": (
            "Royce'un şelale modeli: gereksinimden bakıma tek yönlü, "
            "belgeleme ağırlıklı sıralı fazlar. Her faz tamamlanmadan "
            "sonraki başlamaz."
        ),
        "columns": [
            {"name": "Gereksinim", "order": 0},
            {"name": "Analiz", "order": 1},
            {"name": "Tasarım", "order": 2},
            {"name": "Uygulama", "order": 3},
            {"name": "Test", "order": 4},
            {"name": "Bakım", "order": 5},
        ],
        "default_columns": WATERFALL_DEFAULT_COLUMNS,
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "strict_dependencies": True},
        "cycle_label_tr": "Faz",
        "cycle_label_en": "Phase",
        # Klasik şelale illüstrasyonu: sağa-aşağı inen merdiven.
        "default_workflow": {
            "mode": "sequential-locked",
            "nodes": [
                {"id": "nd_wfreq00001", "name": "Gereksinimler",
                 "description": "Kapsam, SRS dokümantasyonu ve onaylar.",
                 "x": 60, "y": 40, "color": "status-todo", "is_initial": True},
                {"id": "nd_wfdes00002", "name": "Tasarım",
                 "description": "Mimari, veri modeli ve arayüz tasarımı.",
                 "x": 290, "y": 150, "color": "status-progress"},
                {"id": "nd_wfimp00003", "name": "Uygulama",
                 "description": "Tasarıma birebir uyan geliştirme.",
                 "x": 520, "y": 260, "color": "status-progress"},
                {"id": "nd_wftst00004", "name": "Test",
                 "description": "QA, sistem testi ve kullanıcı kabulü.",
                 "x": 750, "y": 370, "color": "status-review"},
                {"id": "nd_wfdep00005", "name": "Yayın",
                 "description": "Dağıtım ve canlıya geçiş.",
                 "x": 980, "y": 480, "color": "status-done"},
                {"id": "nd_wfmnt00006", "name": "Bakım",
                 "description": "Düzeltme, uyarlama ve destek.",
                 "x": 1210, "y": 590, "color": "status-done", "is_final": True},
            ],
            "edges": [
                {"id": "e_wf01", "source": "nd_wfreq00001", "target": "nd_wfdes00002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_wf02", "source": "nd_wfdes00002", "target": "nd_wfimp00003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_wf03", "source": "nd_wfimp00003", "target": "nd_wftst00004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_wf04", "source": "nd_wftst00004", "target": "nd_wfdep00005", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_wf05", "source": "nd_wfdep00005", "target": "nd_wfmnt00006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [],
        },
    },

    # ──────────────────────────── 4. V-MODELİ ────────────────────────────
    {
        "name": "V-Modeli",
        "is_builtin": True,
        "description": (
            "Waterfall'ın doğrulama/geçerleme odaklı versiyonu. Sol kol geliştirme fazlarını "
            "(gereksinimden kodlamaya), sağ kol test fazlarını (birim testinden kabul testine) temsil eder. "
            "Her geliştirme fazı karşı test fazıyla dikey olarak eşleşir: Gereksinim ↔ Kabul Testi, "
            "Sistem Tasarımı ↔ Sistem Testi, Mimari Tasarım ↔ Entegrasyon Testi, Modül Tasarımı ↔ Birim Testi."
        ),
        "columns": [
            {"name": "Gereksinim Analizi", "order": 0},
            {"name": "Sistem Tasarımı", "order": 1},
            {"name": "Mimari Tasarım", "order": 2},
            {"name": "Modül Tasarımı", "order": 3},
            {"name": "Kodlama", "order": 4},
            {"name": "Birim Testi", "order": 5},
            {"name": "Entegrasyon Testi", "order": 6},
            {"name": "Sistem Testi", "order": 7},
            {"name": "Kabul Testi", "order": 8},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "strict_dependencies": True, "wip_limits": False},
        "cycle_label_tr": "Faz",
        "cycle_label_en": "Phase",
        "default_artifacts": [
            {"name": "Sistem Gereksinimleri Dokümanı (SRS)", "description": "Tüm fonksiyonel ve fonksiyonel olmayan gereksinimleri içerir."},
            {"name": "Mimari Tasarım Dokümanı (ADD)", "description": "Sistem mimarisi, bileşenler ve arayüzler."},
            {"name": "Test Planı", "description": "Test stratejisi, kapsam ve takvim."},
            {"name": "Birim Test Raporu", "description": "Modül bazlı test sonuçları ve kapsam metrikleri."},
            {"name": "Entegrasyon Test Raporu", "description": "Bileşen entegrasyon senaryoları ve sonuçlar."},
            {"name": "Kabul Test Raporu", "description": "Müşteri kabul kriterleri ve onay kaydı."},
        ],
        "default_phase_criteria": {
            "nd_vmreqs0001": "SRS belgesi onaylanmış ve izlenebilirlik matrisi tamamlanmış",
            "nd_vmsdes0002": "Sistem tasarım dokümanı imzalanmış",
            "nd_vmarch0003": "Mimari tasarım gözden geçirme toplantısı yapılmış",
            "nd_vmmodd0004": "Tüm modül arayüzleri tanımlanmış",
            "nd_vmcode0005": "Kod incelmesi tamamlanmış, statik analiz sorunsuz",
            "nd_vmunit0006": "Birim test kapsamı ≥ %80, tüm kritik yollar geçiyor",
            "nd_vmintg0007": "Tüm arayüz testleri geçiyor, performans kriterleri karşılanıyor",
            "nd_vmsyst0008": "Sistem testi senaryolarının %100'ü tamamlanmış",
            "nd_vmacpt0009": "Müşteri onayı alınmış, GAP listesi sıfırlanmış",
        },
        # Gerçek V: sol kol iner, dipte kodlama, sağ kol çıkar; yatay
        # doğrulama köprüleri karşılıklı fazları eşler.
        "default_workflow": {
            "mode": "sequential-locked",
            "nodes": [
                {"id": "nd_vmreqs0001", "name": "Gereksinim Analizi",
                 "description": "Paydaş gereksinimleri toplanır, SRS belgesi hazırlanır, izlenebilirlik matrisi oluşturulur.",
                 "x": 60, "y": 60, "color": "status-todo", "is_initial": True, "is_final": False},
                {"id": "nd_vmsdes0002", "name": "Sistem Tasarımı",
                 "description": "Yüksek düzey sistem mimarisi, donanım/yazılım bölümlemesi ve arayüz gereksinimleri tanımlanır.",
                 "x": 220, "y": 190, "color": "status-todo", "is_initial": False, "is_final": False},
                {"id": "nd_vmarch0003", "name": "Mimari Tasarım",
                 "description": "Alt sistem mimarisi, modüller arası arayüzler ve veri akışı diyagramları oluşturulur.",
                 "x": 380, "y": 320, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_vmmodd0004", "name": "Modül Tasarımı",
                 "description": "Her modülün iç mantığı, algoritmaları ve veri yapıları ayrıntılı olarak tasarlanır.",
                 "x": 540, "y": 450, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_vmcode0005", "name": "Kodlama / Uygulama",
                 "description": "Tasarıma uygun kaynak kodu yazılır; kod incelemesi ve statik analiz uygulanır.",
                 "x": 700, "y": 530, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_vmunit0006", "name": "Birim Testi",
                 "description": "Her modül bağımsız olarak test edilir. Modül Tasarımı dokümanı test kriterleri kaynağıdır.",
                 "x": 860, "y": 450, "color": "status-review", "is_initial": False, "is_final": False},
                {"id": "nd_vmintg0007", "name": "Entegrasyon Testi",
                 "description": "Modüller birleştirilerek arayüz ve iletişim testleri yapılır. Mimari Tasarım baz alınır.",
                 "x": 1020, "y": 320, "color": "status-review", "is_initial": False, "is_final": False},
                {"id": "nd_vmsyst0008", "name": "Sistem Testi",
                 "description": "Tüm sistem bütünlüğü, performans, güvenlik ve yük testleri gerçekleştirilir.",
                 "x": 1180, "y": 190, "color": "status-review", "is_initial": False, "is_final": False},
                {"id": "nd_vmacpt0009", "name": "Kabul Testi",
                 "description": "Müşteri gereksinimlerine göre son doğrulama yapılır ve proje teslim onayı alınır.",
                 "x": 1340, "y": 60, "color": "status-done", "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_vm01", "source": "nd_vmreqs0001", "target": "nd_vmsdes0002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm02", "source": "nd_vmsdes0002", "target": "nd_vmarch0003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm03", "source": "nd_vmarch0003", "target": "nd_vmmodd0004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm04", "source": "nd_vmmodd0004", "target": "nd_vmcode0005", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm05", "source": "nd_vmcode0005", "target": "nd_vmunit0006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm06", "source": "nd_vmunit0006", "target": "nd_vmintg0007", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm07", "source": "nd_vmintg0007", "target": "nd_vmsyst0008", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm08", "source": "nd_vmsyst0008", "target": "nd_vmacpt0009", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_vm09", "source": "nd_vmreqs0001", "target": "nd_vmacpt0009", "type": "verification", "label": "Gereksinim ↔ Kabul", "bidirectional": True, "is_all_gate": False},
                {"id": "e_vm10", "source": "nd_vmsdes0002", "target": "nd_vmsyst0008", "type": "verification", "label": "Sistem ↔ Sistem Testi", "bidirectional": True, "is_all_gate": False},
                {"id": "e_vm11", "source": "nd_vmarch0003", "target": "nd_vmintg0007", "type": "verification", "label": "Mimari ↔ Entegrasyon", "bidirectional": True, "is_all_gate": False},
                {"id": "e_vm12", "source": "nd_vmmodd0004", "target": "nd_vmunit0006", "type": "verification", "label": "Modül ↔ Birim Testi", "bidirectional": True, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_vmleft", "name": "Doğrulama Kolu (Geliştirme)", "color": "#3B82F6",
                 "children": ["nd_vmreqs0001", "nd_vmsdes0002", "nd_vmarch0003", "nd_vmmodd0004", "nd_vmcode0005"]},
                {"id": "gr_vmright", "name": "Geçerleme Kolu (Test)", "color": "#10B981",
                 "children": ["nd_vmunit0006", "nd_vmintg0007", "nd_vmsyst0008", "nd_vmacpt0009"]},
            ],
        },
    },

    # ──────────────────────────── 5. SPİRAL ────────────────────────────
    {
        "name": "Spiral Model",
        "is_builtin": True,
        "description": (
            "Boehm'in spiral modeli: risk odaklı iteratif geliştirme. "
            "Her döngü (spiral) dört kadranı geçer: (1) Hedefleri/alternatifleri belirleme, "
            "(2) Risk analizi, (3) Geliştirme ve doğrulama, (4) Değerlendirme ve sonraki turu planlama. "
            "Yüksek riskli, büyük ölçekli sistem projelerinde kullanılır."
        ),
        "columns": [
            {"name": "Planlama", "order": 0},
            {"name": "Risk Analizi", "order": 1},
            {"name": "Geliştirme", "order": 2},
            {"name": "Değerlendirme", "order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Spiral",
        "cycle_label_en": "Spiral",
        # İçten dışa büyüyen dikdörtgen sarmal: her tur saat yönünde
        # 4 kadran köşesini ziyaret eder (Planlama ↖, Risk ↗, Geliştirme ↘,
        # Değerlendirme ↙); tur büyüdükçe kutu dışarı açılır.
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                # Spiral 1 — iç tur (Konsept)
                {"id": "nd_sp1pln0001", "name": "S1: Hedef & Planlama",
                 "description": "Proje hedefleri, kısıtlar ve alternatifler belirlenir. İlk risk listesi oluşturulur.",
                 "x": 490, "y": 250, "color": "status-todo", "is_initial": True, "is_final": False},
                {"id": "nd_sp1rsk0002", "name": "S1: Risk Analizi",
                 "description": "Teknik ve iş riskleri önceliklendirilir. Kritik riskler için prototip kararı alınır.",
                 "x": 750, "y": 250, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp1eng0003", "name": "S1: Kavram Prototipi",
                 "description": "Yüksek riskli alanlar için throwaway prototip geliştirilir.",
                 "x": 750, "y": 410, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp1eva0004", "name": "S1: Müşteri Değerlendirmesi",
                 "description": "Prototip müşteriyle gözden geçirilir; sonraki spiral için giriş alınır.",
                 "x": 490, "y": 410, "color": "status-review", "is_initial": False, "is_final": False},
                # Spiral 2 — orta tur (Gereksinim & Mimari)
                {"id": "nd_sp2pln0005", "name": "S2: Gereksinim Planı",
                 "description": "Tam gereksinim kümesi tanımlanır; mimari alternatifleri listelenir.",
                 "x": 340, "y": 140, "color": "status-todo", "is_initial": False, "is_final": False},
                {"id": "nd_sp2rsk0006", "name": "S2: Risk Azaltma",
                 "description": "Kalan riskler için simülasyon veya benchmark yapılır.",
                 "x": 900, "y": 140, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp2eng0007", "name": "S2: Yazılım Geliştirme",
                 "description": "Doğrulanmış mimariye göre temel modüller geliştirilir.",
                 "x": 900, "y": 520, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp2eva0008", "name": "S2: Entegrasyon Değerlendirmesi",
                 "description": "İnşa edilen sistem test edilir; müşteri ile inceleme toplantısı yapılır.",
                 "x": 340, "y": 520, "color": "status-review", "is_initial": False, "is_final": False},
                # Spiral 3 — dış tur (Tam Geliştirme & Doğrulama)
                {"id": "nd_sp3pln0009", "name": "S3: Son Planlama",
                 "description": "Tam özellik kümesi kilitlenir; release planı oluşturulur.",
                 "x": 190, "y": 30, "color": "status-todo", "is_initial": False, "is_final": False},
                {"id": "nd_sp3rsk0012", "name": "S3: Kabul Risk Değerlendirmesi",
                 "description": "Yayın öncesi son risk gözden geçirmesi; geçiş ve geri dönüş planı doğrulanır.",
                 "x": 1050, "y": 30, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp3eng0010", "name": "S3: Tam Uygulama",
                 "description": "Tüm özellikler tamamlanır, kapsamlı test suite çalıştırılır.",
                 "x": 1050, "y": 630, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_sp3eva0011", "name": "S3: Geçerleme",
                 "description": "Sistem geçerleme testleri ve müşteri kabul testleri gerçekleştirilir.",
                 "x": 190, "y": 630, "color": "status-review", "is_initial": False, "is_final": False},
                # Final — sarmaldan çıkış
                {"id": "nd_spfinal001", "name": "Ürün Teslimatı",
                 "description": "Onaylı ürün canlıya alınır; bakım planı devreye girer.",
                 "x": 1250, "y": 330, "color": "status-done", "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_sp01", "source": "nd_sp1pln0001", "target": "nd_sp1rsk0002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp02", "source": "nd_sp1rsk0002", "target": "nd_sp1eng0003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp03", "source": "nd_sp1eng0003", "target": "nd_sp1eva0004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp04", "source": "nd_sp1eva0004", "target": "nd_sp2pln0005", "type": "flow", "label": "Sonraki spiral", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp05", "source": "nd_sp2pln0005", "target": "nd_sp2rsk0006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp06", "source": "nd_sp2rsk0006", "target": "nd_sp2eng0007", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp07", "source": "nd_sp2eng0007", "target": "nd_sp2eva0008", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp08", "source": "nd_sp2eva0008", "target": "nd_sp3pln0009", "type": "flow", "label": "Sonraki spiral", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp09", "source": "nd_sp3pln0009", "target": "nd_sp3rsk0012", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp14", "source": "nd_sp3rsk0012", "target": "nd_sp3eng0010", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp10", "source": "nd_sp3eng0010", "target": "nd_sp3eva0011", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp11", "source": "nd_sp3eva0011", "target": "nd_spfinal001", "type": "flow", "label": "Teslim", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp12", "source": "nd_sp1rsk0002", "target": "nd_sp1pln0001", "type": "feedback", "label": "Risk → Yeniden Planla", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp13", "source": "nd_sp2rsk0006", "target": "nd_sp2pln0005", "type": "feedback", "label": "Risk → Yeniden Planla", "bidirectional": False, "is_all_gate": False},
                {"id": "e_sp15", "source": "nd_sp3rsk0012", "target": "nd_sp3pln0009", "type": "feedback", "label": "Risk → Yeniden Planla", "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_sp1", "name": "Spiral 1 — Konsept", "color": "#6366F1",
                 "children": ["nd_sp1pln0001", "nd_sp1rsk0002", "nd_sp1eng0003", "nd_sp1eva0004"]},
                {"id": "gr_sp2", "name": "Spiral 2 — Geliştirme", "color": "#8B5CF6",
                 "children": ["nd_sp2pln0005", "nd_sp2rsk0006", "nd_sp2eng0007", "nd_sp2eva0008"]},
                {"id": "gr_sp3", "name": "Spiral 3 — Teslimat", "color": "#A78BFA",
                 "children": ["nd_sp3pln0009", "nd_sp3rsk0012", "nd_sp3eng0010", "nd_sp3eva0011"]},
            ],
        },
    },

    # ──────────────────────────── 6. YİNELEMELİ ────────────────────────────
    {
        "name": "Yinelemeli Model",
        "is_builtin": True,
        "description": (
            "Iterative model: sistem, tekrarlanan planla-tasarla-uygula-test et-değerlendir "
            "döngüleriyle her yinelemede olgunlaşır. Gereksinimler baştan tam bilinmediğinde "
            "ve erken geri bildirim kritik olduğunda tercih edilir."
        ),
        "columns": [
            {"name": "Planlama", "order": 0},
            {"name": "Tasarım", "order": 1},
            {"name": "Uygulama", "order": 2},
            {"name": "Test", "order": 3},
            {"name": "Değerlendirme", "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Yineleme",
        "cycle_label_en": "Iteration",
        "default_artifacts": [
            {"name": "Yineleme Planı", "description": "Bu yinelemenin kapsamı, hedefleri ve kabul ölçütleri."},
            {"name": "Yineleme Değerlendirme Raporu", "description": "Demo bulguları ve sonraki yinelemeye taşınan kararlar."},
        ],
        # Ders kitabı döngü çemberi: değerlendirmeden planlamaya geri besleme,
        # kabulde sağa Dağıtım çıkışı.
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_itreq00001", "name": "Başlangıç Gereksinimleri",
                 "description": "Çekirdek gereksinimler toplanır; tam kapsam yinelemelerle netleşir.",
                 "x": 60, "y": 300, "color": "status-todo", "is_initial": True},
                {"id": "nd_itpln00002", "name": "Yineleme Planlama",
                 "description": "Bu turda geliştirilecek dilim seçilir ve hedefler belirlenir.",
                 "x": 340, "y": 140, "color": "status-todo"},
                {"id": "nd_itdsg00003", "name": "Tasarım",
                 "description": "Seçilen dilim için analiz ve tasarım yapılır.",
                 "x": 620, "y": 80, "color": "status-progress"},
                {"id": "nd_itimp00004", "name": "Uygulama",
                 "description": "Dilim geliştirilir ve mevcut sisteme entegre edilir.",
                 "x": 900, "y": 140, "color": "status-progress"},
                {"id": "nd_ittst00005", "name": "Test",
                 "description": "Yeni dilim + regresyon testleri çalıştırılır.",
                 "x": 900, "y": 460, "color": "status-review"},
                {"id": "nd_itevl00006", "name": "Değerlendirme",
                 "description": "Demo yapılır; geri bildirim sonraki yinelemenin girdisi olur.",
                 "x": 620, "y": 520, "color": "status-review"},
                {"id": "nd_itdep00007", "name": "Dağıtım",
                 "description": "Yeterli olgunluğa ulaşan sistem canlıya alınır.",
                 "x": 1180, "y": 300, "color": "status-done", "is_final": True},
            ],
            "edges": [
                {"id": "e_it01", "source": "nd_itreq00001", "target": "nd_itpln00002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_it02", "source": "nd_itpln00002", "target": "nd_itdsg00003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_it03", "source": "nd_itdsg00003", "target": "nd_itimp00004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_it04", "source": "nd_itimp00004", "target": "nd_ittst00005", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_it05", "source": "nd_ittst00005", "target": "nd_itevl00006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_it06", "source": "nd_itevl00006", "target": "nd_itpln00002", "type": "feedback", "label": "Sonraki yineleme", "bidirectional": False, "is_all_gate": False},
                {"id": "e_it07", "source": "nd_itevl00006", "target": "nd_itdep00007", "type": "flow", "label": "Kabul", "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_itloop1", "name": "Yineleme Döngüsü", "color": "#0EA5E9",
                 "children": ["nd_itpln00002", "nd_itdsg00003", "nd_itimp00004", "nd_ittst00005", "nd_itevl00006"]},
            ],
        },
    },

    # ──────────────────────────── 7. ARTIRIMLI ────────────────────────────
    {
        "name": "Artırımlı Model",
        "is_builtin": True,
        "description": (
            "Incremental model: ürün, her biri çalışan bir parça teslim eden artırımlara "
            "bölünür. Her artırım kendi mini tasarla-geliştir-test et-teslim et şelalesini "
            "yürütür; kullanıcı ilk artırımdan itibaren çalışan yazılım alır."
        ),
        "columns": [
            {"name": "Tasarım", "order": 0},
            {"name": "Geliştirme", "order": 1},
            {"name": "Test", "order": 2},
            {"name": "Teslim", "order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Artırım",
        "cycle_label_en": "Increment",
        "default_artifacts": [
            {"name": "Artırım Planı", "description": "Artırımların kapsam ve sıralaması."},
            {"name": "Sürüm Notları", "description": "Her artırım tesliminde kullanıcıya giden değişiklik özeti."},
        ],
        # Ders kitabı illüstrasyonu: her artırım kendi mini-şelale satırı;
        # satırlar aşağı-sağa kayarak ürünün büyüdüğünü gösterir.
        "default_workflow": {
            "mode": "sequential-locked",
            "nodes": [
                {"id": "nd_in0req0001", "name": "Çekirdek Gereksinimler",
                 "description": "Genel mimari ve artırım sınırları tanımlanır.",
                 "x": 60, "y": 80, "color": "status-todo", "is_initial": True},
                # Artırım 1
                {"id": "nd_in1des0002", "name": "A1: Tasarım", "description": "İlk artırımın tasarımı.",
                 "x": 300, "y": 80, "color": "status-todo"},
                {"id": "nd_in1dev0003", "name": "A1: Geliştirme", "description": "Çekirdek özellik kümesi geliştirilir.",
                 "x": 520, "y": 80, "color": "status-progress"},
                {"id": "nd_in1tst0004", "name": "A1: Test", "description": "Artırım testleri çalıştırılır.",
                 "x": 740, "y": 80, "color": "status-review"},
                {"id": "nd_in1del0005", "name": "Artırım 1 Teslimi", "description": "İlk çalışan sürüm kullanıcıya teslim edilir.",
                 "x": 960, "y": 80, "color": "status-done"},
                # Artırım 2
                {"id": "nd_in2des0006", "name": "A2: Tasarım", "description": "Geri bildirimle ikinci artırım tasarlanır.",
                 "x": 360, "y": 240, "color": "status-todo"},
                {"id": "nd_in2dev0007", "name": "A2: Geliştirme", "description": "Yeni özellikler mevcut çekirdeğe eklenir.",
                 "x": 580, "y": 240, "color": "status-progress"},
                {"id": "nd_in2tst0008", "name": "A2: Test", "description": "Artırım + regresyon testleri.",
                 "x": 800, "y": 240, "color": "status-review"},
                {"id": "nd_in2del0009", "name": "Artırım 2 Teslimi", "description": "Genişletilmiş sürüm teslim edilir.",
                 "x": 1020, "y": 240, "color": "status-done"},
                # Artırım 3
                {"id": "nd_in3des0010", "name": "A3: Tasarım", "description": "Kalan özellik kümesi tasarlanır.",
                 "x": 420, "y": 400, "color": "status-todo"},
                {"id": "nd_in3dev0011", "name": "A3: Geliştirme", "description": "Son özellikler tamamlanır.",
                 "x": 640, "y": 400, "color": "status-progress"},
                {"id": "nd_in3tst0012", "name": "A3: Test", "description": "Tam sistem doğrulaması.",
                 "x": 860, "y": 400, "color": "status-review"},
                {"id": "nd_in3del0013", "name": "Tam Ürün Teslimi", "description": "Bütün artırımlar birleşmiş nihai ürün.",
                 "x": 1080, "y": 400, "color": "status-done", "is_final": True},
            ],
            "edges": [
                {"id": "e_in01", "source": "nd_in0req0001", "target": "nd_in1des0002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in02", "source": "nd_in1des0002", "target": "nd_in1dev0003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in03", "source": "nd_in1dev0003", "target": "nd_in1tst0004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in04", "source": "nd_in1tst0004", "target": "nd_in1del0005", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in05", "source": "nd_in1del0005", "target": "nd_in2des0006", "type": "flow", "label": "Artırım 2", "bidirectional": False, "is_all_gate": False},
                {"id": "e_in06", "source": "nd_in2des0006", "target": "nd_in2dev0007", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in07", "source": "nd_in2dev0007", "target": "nd_in2tst0008", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in08", "source": "nd_in2tst0008", "target": "nd_in2del0009", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in09", "source": "nd_in2del0009", "target": "nd_in3des0010", "type": "flow", "label": "Artırım 3", "bidirectional": False, "is_all_gate": False},
                {"id": "e_in10", "source": "nd_in3des0010", "target": "nd_in3dev0011", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in11", "source": "nd_in3dev0011", "target": "nd_in3tst0012", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_in12", "source": "nd_in3tst0012", "target": "nd_in3del0013", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_inc1", "name": "Artırım 1 — Çekirdek", "color": "#6366F1",
                 "children": ["nd_in1des0002", "nd_in1dev0003", "nd_in1tst0004", "nd_in1del0005"]},
                {"id": "gr_inc2", "name": "Artırım 2 — Genişletme", "color": "#8B5CF6",
                 "children": ["nd_in2des0006", "nd_in2dev0007", "nd_in2tst0008", "nd_in2del0009"]},
                {"id": "gr_inc3", "name": "Artırım 3 — Tamamlama", "color": "#A78BFA",
                 "children": ["nd_in3des0010", "nd_in3dev0011", "nd_in3tst0012", "nd_in3del0013"]},
            ],
        },
    },

    # ──────────────────────────── 8. PROTOTİPLEME ────────────────────────────
    {
        "name": "Prototipleme Modeli",
        "is_builtin": True,
        "description": (
            "Prototyping model: gereksinimler belirsizken hızlı bir prototip yapılır, "
            "müşteri değerlendirmesiyle tasarla-yap-değerlendir döngüsü gereksinimler "
            "netleşene kadar tekrarlanır; onaylanan prototip gerçek ürün geliştirmesine girdi olur."
        ),
        "columns": [
            {"name": "Gereksinim", "order": 0},
            {"name": "Tasarım", "order": 1},
            {"name": "Prototip", "order": 2},
            {"name": "Değerlendirme", "order": 3},
            {"name": "Geliştirme", "order": 4},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Prototip Turu",
        "cycle_label_en": "Prototype Round",
        "default_artifacts": [
            {"name": "Prototip Değerlendirme Notları", "description": "Müşteri geri bildirimleri ve karar kaydı."},
            {"name": "Netleşmiş Gereksinim Listesi", "description": "Prototip turlarıyla doğrulanan nihai gereksinimler."},
        ],
        # Dörtgen döngü: Tasarım → Prototip → Değerlendirme → (geri bildirim)
        # Tasarım; onayda sağa ürün geliştirme hattına çıkılır.
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_ptreq00001", "name": "Hızlı Gereksinim Toplama",
                 "description": "Bilinen gereksinimler hızla derlenir; belirsiz alanlar prototip hedefi olur.",
                 "x": 60, "y": 190, "color": "status-todo", "is_initial": True},
                {"id": "nd_ptdsg00002", "name": "Hızlı Tasarım",
                 "description": "Kullanıcıya görünen yüzeylere odaklanan taslak tasarım.",
                 "x": 330, "y": 90, "color": "status-todo"},
                {"id": "nd_ptbld00003", "name": "Prototip Geliştirme",
                 "description": "Çalışan prototip hızla inşa edilir (throwaway ya da evrimsel).",
                 "x": 610, "y": 90, "color": "status-progress"},
                {"id": "nd_pteva00004", "name": "Müşteri Değerlendirmesi",
                 "description": "Müşteri prototipi kullanır; eksikler ve yanlış anlamalar kayda geçer.",
                 "x": 610, "y": 310, "color": "status-review"},
                {"id": "nd_ptimp00005", "name": "Ürün Geliştirme",
                 "description": "Onaylanan gereksinimlerle gerçek sistem mühendislik kalitesinde geliştirilir.",
                 "x": 890, "y": 190, "color": "status-progress"},
                {"id": "nd_pttst00006", "name": "Test & Teslim",
                 "description": "Sistem testi, kabul ve canlıya alma.",
                 "x": 1150, "y": 190, "color": "status-done", "is_final": True},
            ],
            "edges": [
                {"id": "e_pt01", "source": "nd_ptreq00001", "target": "nd_ptdsg00002", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_pt02", "source": "nd_ptdsg00002", "target": "nd_ptbld00003", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_pt03", "source": "nd_ptbld00003", "target": "nd_pteva00004", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_pt04", "source": "nd_pteva00004", "target": "nd_ptdsg00002", "type": "feedback", "label": "Geri bildirimle iyileştir", "bidirectional": False, "is_all_gate": False},
                {"id": "e_pt05", "source": "nd_pteva00004", "target": "nd_ptimp00005", "type": "flow", "label": "Prototip onayı", "bidirectional": False, "is_all_gate": False},
                {"id": "e_pt06", "source": "nd_ptimp00005", "target": "nd_pttst00006", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_ptloop1", "name": "Prototip Döngüsü", "color": "#F59E0B",
                 "children": ["nd_ptdsg00002", "nd_ptbld00003", "nd_pteva00004"]},
            ],
        },
    },

    # ──────────────────────────── 9. RAD ────────────────────────────
    {
        "name": "RAD (Hızlı Uygulama Geliştirme)",
        "is_builtin": True,
        "description": (
            "Rapid Application Development (James Martin, 1991): yoğun kullanıcı katılımı ve "
            "zaman kutulu prototipleme ile hızlı teslimat. "
            "Fazlar: Gereksinim Planlaması → Kullanıcı Tasarımı ⇄ Hızlı İnşa döngüsü → Sisteme Geçiş. "
            "Zaman hedefi: 60-90 gün."
        ),
        "columns": [
            {"name": "Gereksinim", "order": 0},
            {"name": "Kullanıcı Tasarımı", "order": 1},
            {"name": "Hızlı İnşa", "order": 2},
            {"name": "Geçiş", "order": 3},
        ],
        "recurring_tasks": [],
        "behavioral_flags": {"sprint_required": False, "wip_limits": False},
        "cycle_label_tr": "Tur",
        "cycle_label_en": "Round",
        # Ortadaki tasarım ⇄ inşa ikilisi RAD'ın kalbi olan prototip
        # döngüsünü çapraz yerleşimle gösterir.
        "default_workflow": {
            "mode": "flexible",
            "nodes": [
                {"id": "nd_radrpln001", "name": "Gereksinim Planlaması",
                 "description": "Yönetim ve kullanıcılar sistem hedefleri, gereksinimleri ve kısıtları üzerinde uzlaşır.",
                 "x": 60, "y": 260, "color": "status-todo", "is_initial": True, "is_final": False},
                {"id": "nd_raduds0001", "name": "Kullanıcı Tasarımı (JAD)",
                 "description": "JAD oturumlarında kullanıcılar veri akışlarını ve süreçleri modelleyerek prototiplere dönüştürür.",
                 "x": 400, "y": 120, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_radcon0001", "name": "Hızlı İnşa",
                 "description": "CASE araçları ve yeniden kullanılabilir bileşenlerle paralel geliştirme yapılır.",
                 "x": 680, "y": 400, "color": "status-progress", "is_initial": False, "is_final": False},
                {"id": "nd_radcut0001", "name": "Sisteme Geçiş",
                 "description": "Kapsamlı test, kullanıcı eğitimi, veri dönüşümü ve canlıya geçiş yönetimi.",
                 "x": 1000, "y": 260, "color": "status-done", "is_initial": False, "is_final": True},
            ],
            "edges": [
                {"id": "e_rd01", "source": "nd_radrpln001", "target": "nd_raduds0001", "type": "flow", "label": None, "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd02", "source": "nd_raduds0001", "target": "nd_radcon0001", "type": "flow", "label": "Prototip", "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd03", "source": "nd_radcon0001", "target": "nd_radcut0001", "type": "flow", "label": "Kabul", "bidirectional": False, "is_all_gate": False},
                {"id": "e_rd05", "source": "nd_radcon0001", "target": "nd_raduds0001", "type": "feedback", "label": "Kullanıcı geri bildirimi", "bidirectional": False, "is_all_gate": False},
            ],
            "groups": [
                {"id": "gr_radloop", "name": "Prototip Döngüsü", "color": "#F59E0B",
                 "children": ["nd_raduds0001", "nd_radcon0001"]},
            ],
        },
    },
]

CANONICAL_TEMPLATE_NAMES: list[str] = [t["name"] for t in CANONICAL_TEMPLATES]
