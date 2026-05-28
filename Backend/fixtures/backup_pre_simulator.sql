--
-- PostgreSQL database dump
--

\restrict FAySulgtbzOtyMaXJK8JgVgw6s0kxE4rX79KP55gRc1mRTov803ux4jlU8eInWP

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
014_template_default_columns
\.


--
-- Data for Name: process_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.process_templates (id, name, is_builtin, columns, recurring_tasks, behavioral_flags, description, created_at, updated_at, default_artifacts, default_phase_criteria, default_workflow, cycle_label_tr, cycle_label_en, default_columns) FROM stdin;
4	V-Modeli	t	[{"name": "Gereksinim Analizi", "order": 0}, {"name": "Sistem Tasarımı", "order": 1}, {"name": "Mimari Tasarım", "order": 2}, {"name": "Modül Tasarımı", "order": 3}, {"name": "Kodlama", "order": 4}, {"name": "Birim Testi", "order": 5}, {"name": "Entegrasyon Testi", "order": 6}, {"name": "Sistem Testi", "order": 7}, {"name": "Kabul Testi", "order": 8}]	[]	{"wip_limits": false, "sprint_required": false, "strict_dependencies": true}	Waterfall'ın doğrulama/geçerleme odaklı versiyonu. Sol kol geliştirme fazlarını (gereksinimden kodlamaya), sağ kol test fazlarını (birim testinden kabul testine) temsil eder. Her geliştirme fazı karşı test fazıyla dikey olarak eşleşir: Gereksinim ↔ Kabul Testi, Sistem Tasarımı ↔ Sistem Testi, Mimari Tasarım ↔ Entegrasyon Testi, Modül Tasarımı ↔ Birim Testi.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	[{"name": "Sistem Gereksinimleri Dokümanı (SRS)", "description": "Tüm fonksiyonel ve fonksiyonel olmayan gereksinimleri içerir."}, {"name": "Mimari Tasarım Dokümanı (ADD)", "description": "Sistem mimarisi, bileşenler ve arayüzler."}, {"name": "Test Planı", "description": "Test stratejisi, kapsam ve takvim."}, {"name": "Birim Test Raporu", "description": "Modül bazlı test sonuçları ve kapsam metrikleri."}, {"name": "Entegrasyon Test Raporu", "description": "Bileşen entegrasyon senaryoları ve sonuçlar."}, {"name": "Kabul Test Raporu", "description": "Müşteri kabul kriterleri ve onay kaydı."}]	{"nd_vmacpt0009": "Müşteri onayı alınmış, GAP listesi sıfırlanmış", "nd_vmarch0003": "Mimari tasarım gözden geçirme toplantısı yapılmış", "nd_vmcode0005": "Kod incelmesi tamamlanmış, statik analiz sorunsuz", "nd_vmintg0007": "Tüm arayüz testleri geçiyor, performans kriterleri karşılanıyor", "nd_vmmodd0004": "Tüm modül arayüzleri tanımlanmış", "nd_vmreqs0001": "SRS belgesi onaylanmış ve izlenebilirlik matrisi tamamlanmış", "nd_vmsdes0002": "Sistem tasarım dokümanı imzalanmış", "nd_vmsyst0008": "Sistem testi senaryolarının %100'ü tamamlanmış", "nd_vmunit0006": "Birim test kapsamı ≥ %80, tüm kritik yollar geçiyor"}	{"mode": "sequential-locked", "edges": [{"id": "e_vm01", "type": "flow", "label": null, "source": "nd_vmreqs0001", "target": "nd_vmsdes0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm02", "type": "flow", "label": null, "source": "nd_vmsdes0002", "target": "nd_vmarch0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm03", "type": "flow", "label": null, "source": "nd_vmarch0003", "target": "nd_vmmodd0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm04", "type": "flow", "label": null, "source": "nd_vmmodd0004", "target": "nd_vmcode0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm05", "type": "flow", "label": null, "source": "nd_vmcode0005", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm06", "type": "flow", "label": null, "source": "nd_vmunit0006", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm07", "type": "flow", "label": null, "source": "nd_vmintg0007", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm08", "type": "flow", "label": null, "source": "nd_vmsyst0008", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm09", "type": "verification", "label": "Gereksinim ↔ Kabul", "source": "nd_vmreqs0001", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm10", "type": "verification", "label": "Sistem ↔ Sistem Testi", "source": "nd_vmsdes0002", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm11", "type": "verification", "label": "Mimari ↔ Entegrasyon", "source": "nd_vmarch0003", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm12", "type": "verification", "label": "Modül ↔ Birim Testi", "source": "nd_vmmodd0004", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": true}], "nodes": [{"x": 60, "y": 60, "id": "nd_vmreqs0001", "name": "Gereksinim Analizi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Paydaş gereksinimleri toplanır, SRS belgesi hazırlanır, izlenebilirlik matrisi oluşturulur."}, {"x": 220, "y": 190, "id": "nd_vmsdes0002", "name": "Sistem Tasarımı", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Yüksek düzey sistem mimarisi, donanım/yazılım bölümlemesi ve arayüz gereksinimleri tanımlanır."}, {"x": 380, "y": 320, "id": "nd_vmarch0003", "name": "Mimari Tasarım", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Alt sistem mimarisi, modüller arası arayüzler ve veri akışı diyagramları oluşturulur."}, {"x": 540, "y": 450, "id": "nd_vmmodd0004", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Her modülün iç mantığı, algoritmaları ve veri yapıları ayrıntılı olarak tasarlanır."}, {"x": 700, "y": 530, "id": "nd_vmcode0005", "name": "Kodlama / Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Tasarıma uygun kaynak kodu yazılır; kod incelemesi ve statik analiz uygulanır."}, {"x": 860, "y": 450, "id": "nd_vmunit0006", "name": "Birim Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Her modül bağımsız olarak test edilir. Modül Tasarımı dokümanı test kriterleri kaynağıdır."}, {"x": 1020, "y": 320, "id": "nd_vmintg0007", "name": "Entegrasyon Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Modüller birleştirilerek arayüz ve iletişim testleri yapılır. Mimari Tasarım baz alınır."}, {"x": 1180, "y": 190, "id": "nd_vmsyst0008", "name": "Sistem Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Tüm sistem bütünlüğü, performans, güvenlik ve yük testleri gerçekleştirilir."}, {"x": 1340, "y": 60, "id": "nd_vmacpt0009", "name": "Kabul Testi", "color": "status-done", "is_final": true, "is_initial": false, "description": "Müşteri gereksinimlerine göre son doğrulama yapılır ve proje teslim onayı alınır."}], "groups": [{"id": "gr_vmleft", "name": "Doğrulama Kolu (Geliştirme)", "color": "#3B82F6", "children": ["nd_vmreqs0001", "nd_vmsdes0002", "nd_vmarch0003", "nd_vmmodd0004", "nd_vmcode0005"]}, {"id": "gr_vmright", "name": "Geçerleme Kolu (Test)", "color": "#10B981", "children": ["nd_vmunit0006", "nd_vmintg0007", "nd_vmsyst0008", "nd_vmacpt0009"]}]}	Faz	Phase	\N
5	V-Modeli + Scrum İç Döngüleri	t	[{"name": "Gereksinim", "order": 0}, {"name": "Tasarım", "order": 1}, {"name": "Kodlama", "order": 2}, {"name": "Test Sprint Backlog", "order": 3}, {"name": "Test In Progress", "order": 4}, {"name": "Test Done", "order": 5}, {"name": "Kabul", "order": 6}]	[]	{"wip_limits": false, "sprint_required": true, "strict_dependencies": true}	Hibrit V-Model: Sol kol klasik V-Model spesifikasyon fazlarıdır. Sağ koldaki test fazları ise birer Scrum Sprint döngüsü olarak yürütülür — birim, entegrasyon ve sistem testi her biri 1-2 haftalık sprint kutularında iteratif olarak tekrarlanabilir. Büyük gömülü sistemler ve güvenlik kritik projelerde kullanılır.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "sequential-flexible", "edges": [{"id": "e_vs01", "type": "flow", "label": null, "source": "nd_vsreqs0001", "target": "nd_vssdes0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs02", "type": "flow", "label": null, "source": "nd_vssdes0002", "target": "nd_vsmodd0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs03", "type": "flow", "label": null, "source": "nd_vsmodd0003", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs04", "type": "flow", "label": null, "source": "nd_vscode0004", "target": "nd_vsunit0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs05", "type": "flow", "label": null, "source": "nd_vsunit0005", "target": "nd_vsintg0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs06", "type": "flow", "label": null, "source": "nd_vsintg0006", "target": "nd_vssyst0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs07", "type": "flow", "label": null, "source": "nd_vssyst0007", "target": "nd_vsacpt0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs08", "type": "feedback", "label": "Hata düzeltme sprinti", "source": "nd_vsunit0005", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs09", "type": "feedback", "label": "Entegrasyon hatası", "source": "nd_vsintg0006", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs10", "type": "feedback", "label": "Sistem regresyonu", "source": "nd_vssyst0007", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs11", "type": "verification", "label": "Gereksinim ↔ Kabul", "source": "nd_vsreqs0001", "target": "nd_vsacpt0008", "is_all_gate": false, "bidirectional": true}, {"id": "e_vs12", "type": "verification", "label": "Tasarım ↔ Sistem Testi", "source": "nd_vssdes0002", "target": "nd_vssyst0007", "is_all_gate": false, "bidirectional": true}, {"id": "e_vs13", "type": "verification", "label": "Modül ↔ Birim Testi", "source": "nd_vsmodd0003", "target": "nd_vsunit0005", "is_all_gate": false, "bidirectional": true}], "nodes": [{"x": 60, "y": 60, "id": "nd_vsreqs0001", "name": "Gereksinim Analizi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "SRS ve izlenebilirlik matrisi. Kabul kriterleri tanımlanır."}, {"x": 220, "y": 190, "id": "nd_vssdes0002", "name": "Sistem & Mimari Tasarım", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Yüksek düzey ve alçak düzey tasarım birleştirilir."}, {"x": 380, "y": 320, "id": "nd_vsmodd0003", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Bileşen bazlı ayrıntılı tasarım ve arayüz sözleşmeleri."}, {"x": 540, "y": 450, "id": "nd_vscode0004", "name": "Kodlama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "TDD ile kod geliştirme; her commit CI pipeline'ını tetikler."}, {"x": 700, "y": 450, "id": "nd_vsunit0005", "name": "Birim Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "1 haftalık sprint: her modül için otomatik birim testleri yazılır ve geçirilir."}, {"x": 860, "y": 320, "id": "nd_vsintg0006", "name": "Entegrasyon Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "2 haftalık sprint: servisler arası uçtan uca senaryolar otomatize edilir."}, {"x": 1020, "y": 190, "id": "nd_vssyst0007", "name": "Sistem Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "2 haftalık sprint: performans, güvenlik ve yük testleri gerçekleştirilir."}, {"x": 1180, "y": 60, "id": "nd_vsacpt0008", "name": "Kabul Testi", "color": "status-done", "is_final": true, "is_initial": false, "description": "Müşteri ile birlikte UAT. Tüm gereksinim izleme öğelerinin karşılandığı doğrulanır."}], "groups": [{"id": "gr_vsleft", "name": "Spesifikasyon Kolu", "color": "#3B82F6", "children": ["nd_vsreqs0001", "nd_vssdes0002", "nd_vsmodd0003", "nd_vscode0004"]}, {"id": "gr_vsright", "name": "Scrum Test Sprintleri", "color": "#F59E0B", "children": ["nd_vsunit0005", "nd_vsintg0006", "nd_vssyst0007", "nd_vsacpt0008"]}]}	Test Sprinti	Test Sprint	\N
6	Spiral Model	t	[{"name": "Planlama", "order": 0}, {"name": "Risk Analizi", "order": 1}, {"name": "Geliştirme", "order": 2}, {"name": "Değerlendirme", "order": 3}]	[]	{"wip_limits": false, "sprint_required": false}	Boehm'in spiral modeli: risk odaklı iteratif geliştirme. Her döngü (spiral) dört kadranı geçer: (1) Hedefleri/alternatifleri belirleme ve kısıtları tanımlama, (2) Alternatifleri değerlendirme ve risk analizi, (3) Geliştirme ve doğrulama, (4) Sonraki aşamayı planlama. Yüksek riskli, büyük ölçekli sistem projelerinde kullanılır.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_sp01", "type": "flow", "label": null, "source": "nd_sp1pln0001", "target": "nd_sp1rsk0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp02", "type": "flow", "label": null, "source": "nd_sp1rsk0002", "target": "nd_sp1eng0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp03", "type": "flow", "label": null, "source": "nd_sp1eng0003", "target": "nd_sp1eva0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp04", "type": "flow", "label": "Sonraki spiral", "source": "nd_sp1eva0004", "target": "nd_sp2pln0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp05", "type": "flow", "label": null, "source": "nd_sp2pln0005", "target": "nd_sp2rsk0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp06", "type": "flow", "label": null, "source": "nd_sp2rsk0006", "target": "nd_sp2eng0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp07", "type": "flow", "label": null, "source": "nd_sp2eng0007", "target": "nd_sp2eva0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp08", "type": "flow", "label": "Sonraki spiral", "source": "nd_sp2eva0008", "target": "nd_sp3pln0009", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp09", "type": "flow", "label": null, "source": "nd_sp3pln0009", "target": "nd_sp3eng0010", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp10", "type": "flow", "label": null, "source": "nd_sp3eng0010", "target": "nd_sp3eva0011", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp11", "type": "flow", "label": "Teslim", "source": "nd_sp3eva0011", "target": "nd_spfinal001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp12", "type": "feedback", "label": "Risk → Yeniden Planla", "source": "nd_sp1rsk0002", "target": "nd_sp1pln0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sp13", "type": "feedback", "label": "Risk → Yeniden Planla", "source": "nd_sp2rsk0006", "target": "nd_sp2pln0005", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 200, "y": 150, "id": "nd_sp1pln0001", "name": "S1: Hedef & Planlama", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Proje hedefleri, kısıtlar ve alternatifler belirlenir. İlk risk listesi oluşturulur."}, {"x": 400, "y": 100, "id": "nd_sp1rsk0002", "name": "S1: Risk Analizi", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Teknik ve iş riskleri önceliklendirilir. Kritik riskler için prototip kararı alınır."}, {"x": 500, "y": 300, "id": "nd_sp1eng0003", "name": "S1: Kavram Prototipi", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Yüksek riskli alanlar için throwaway prototip geliştirilir."}, {"x": 280, "y": 370, "id": "nd_sp1eva0004", "name": "S1: Müşteri Değerlendirmesi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Prototip müşteriyle gözden geçirilir; sonraki spiral için giriş alınır."}, {"x": 120, "y": 80, "id": "nd_sp2pln0005", "name": "S2: Gereksinim Planı", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Tam gereksinim kümesi tanımlanır; mimari alternatifleri listelenir."}, {"x": 600, "y": 60, "id": "nd_sp2rsk0006", "name": "S2: Risk Azaltma", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Kalan riskler için simülasyon veya benchmark yapılır."}, {"x": 700, "y": 420, "id": "nd_sp2eng0007", "name": "S2: Yazılım Geliştirme", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Doğrulanmış mimariye göre temel modüller geliştirilir."}, {"x": 120, "y": 500, "id": "nd_sp2eva0008", "name": "S2: Entegrasyon Değerlendirmesi", "color": "status-review", "is_final": false, "is_initial": false, "description": "İnşa edilen sistem test edilir; müşteri ile inceleme toplantısı yapılır."}, {"x": 60, "y": 30, "id": "nd_sp3pln0009", "name": "S3: Son Planlama", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Tam özellik kümesi kilitlenir; release planı oluşturulur."}, {"x": 800, "y": 530, "id": "nd_sp3eng0010", "name": "S3: Tam Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Tüm özellikler tamamlanır, kapsamlı test suite çalıştırılır."}, {"x": 80, "y": 620, "id": "nd_sp3eva0011", "name": "S3: Geçerleme", "color": "status-review", "is_final": false, "is_initial": false, "description": "Sistem geçerleme testleri ve müşteri kabul testleri gerçekleştirilir."}, {"x": 950, "y": 300, "id": "nd_spfinal001", "name": "Ürün Teslimatı", "color": "status-done", "is_final": true, "is_initial": false, "description": "Onaylı ürün canlıya alınır; bakım planı devreye girer."}], "groups": [{"id": "gr_sp1", "name": "Spiral 1 — Konsept", "color": "#6366F1", "children": ["nd_sp1pln0001", "nd_sp1rsk0002", "nd_sp1eng0003", "nd_sp1eva0004"]}, {"id": "gr_sp2", "name": "Spiral 2 — Geliştirme", "color": "#8B5CF6", "children": ["nd_sp2pln0005", "nd_sp2rsk0006", "nd_sp2eng0007", "nd_sp2eva0008"]}, {"id": "gr_sp3", "name": "Spiral 3 — Teslimat", "color": "#A78BFA", "children": ["nd_sp3pln0009", "nd_sp3eng0010", "nd_sp3eva0011", "nd_spfinal001"]}]}	Spiral	Spiral	\N
7	RUP (Rasyonel Birleşik Süreç)	t	[{"name": "Başlangıç", "order": 0}, {"name": "Hazırlık", "order": 1}, {"name": "İnşaat", "order": 2}, {"name": "Geçiş", "order": 3}]	[]	{"wip_limits": false, "sprint_required": false}	Rational Unified Process: Use-case odaklı, mimari merkezli, iteratif artımlı süreç. 4 faz × N iterasyon: Başlangıç (vizyon, fizibilite), Hazırlık (mimari temel, risk azaltma), İnşaat (artımlı özellik geliştirme), Geçiş (beta, eğitim, dağıtım). Her faz birden fazla UML çalışma akışını paralel yürütür.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "sequential-flexible", "edges": [{"id": "e_rup01", "type": "flow", "label": "LC Hedefi Milestone", "source": "nd_rupinit001", "target": "nd_rupelab001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup02", "type": "flow", "label": "LC Mimari Milestone", "source": "nd_rupelab001", "target": "nd_rupcons001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup03", "type": "flow", "label": "İlk Operasyonel Yetenek", "source": "nd_rupcons001", "target": "nd_ruptran001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup04", "type": "flow", "label": null, "source": "nd_rupelab001", "target": "nd_rupucwf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup05", "type": "flow", "label": null, "source": "nd_rupucwf001", "target": "nd_rupanlz001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup06", "type": "flow", "label": null, "source": "nd_rupanlz001", "target": "nd_rupimpl001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup07", "type": "flow", "label": null, "source": "nd_rupimpl001", "target": "nd_ruptst0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup08", "type": "flow", "label": null, "source": "nd_ruptst0001", "target": "nd_ruptran001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup09", "type": "feedback", "label": "Mimari revizyonu", "source": "nd_rupcons001", "target": "nd_rupelab001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_rupinit001", "name": "Başlangıç (Inception)", "color": "status-todo", "is_final": false, "is_initial": true, "description": "İş vakası ve kapsam belirlenir. Paydaş mutabakatı ve fizibilite tamamlanır. Yaşam döngüsü hedefi milestone'u geçilir."}, {"x": 340, "y": 120, "id": "nd_rupelab001", "name": "Hazırlık (Elaboration)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Mimari temel inşa edilir. Yüksek riskli use-case'ler implement edilir. Yaşam döngüsü mimarisi milestone'u."}, {"x": 620, "y": 120, "id": "nd_rupcons001", "name": "İnşaat (Construction)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "İlk operasyonel yetenek milestone'una doğru tüm özellikler iteratif geliştirilir. Test edilebilir beta ürünü ortaya çıkar."}, {"x": 900, "y": 120, "id": "nd_ruptran001", "name": "Geçiş (Transition)", "color": "status-done", "is_final": true, "is_initial": false, "description": "Beta dağıtımı, kullanıcı geri bildirimleri, hata giderme ve son eğitimler. Ürün teslimi milestone'u."}, {"x": 340, "y": 280, "id": "nd_rupucwf001", "name": "Use-Case Modelleme", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Aktörler, use-case'ler ve sistem sınırı tanımlanır; tüm fazlar boyunca rafine edilir."}, {"x": 620, "y": 280, "id": "nd_rupanlz001", "name": "Analiz & Tasarım", "color": "status-progress", "is_final": false, "is_initial": false, "description": "UML sınıf, sıralama ve işbirliği diyagramları; mimari stillerin seçimi."}, {"x": 620, "y": 380, "id": "nd_rupimpl001", "name": "Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Kaynak kodu, bileşen katmanı, birim test ve kod entegrasyonu."}, {"x": 900, "y": 280, "id": "nd_ruptst0001", "name": "Test", "color": "status-review", "is_final": false, "is_initial": false, "description": "Güvenilirlik, işlevsellik ve performans testleri. Hata izleme ve regresyon."}], "groups": [{"id": "gr_rupphase", "name": "Faz Akışı", "color": "#0EA5E9", "children": ["nd_rupinit001", "nd_rupelab001", "nd_rupcons001", "nd_ruptran001"]}, {"id": "gr_rupwf", "name": "Çalışma Akışları", "color": "#6366F1", "children": ["nd_rupucwf001", "nd_rupanlz001", "nd_rupimpl001", "nd_ruptst0001"]}]}	Faz	Phase	\N
8	XP (Aşırı Programlama)	t	[{"name": "Hikaye Backlog", "order": 0}, {"name": "Bu İterasyon", "order": 1}, {"name": "Geliştirme", "order": 2}, {"name": "Test", "order": 3}, {"name": "Tamamlandı", "order": 4}]	[]	{"wip_limits": true, "sprint_required": true}	Extreme Programming: Çok sık entegrasyon, çift programlama, test-önce geliştirme (TDD) ve küçük sürümler üzerine kurulu çevik metodoloji. Keşif → Planlama → İterasyonlar (her 1-2 hafta) → Ürünleştirme → Bakım. Özellik değişikliğine maksimum esneklik sağlar.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_xp01", "type": "flow", "label": null, "source": "nd_xpexplr001", "target": "nd_xpplan0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp02", "type": "flow", "label": null, "source": "nd_xpplan0001", "target": "nd_xpiter0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp03", "type": "flow", "label": null, "source": "nd_xpiter0001", "target": "nd_xpaccp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp04", "type": "flow", "label": null, "source": "nd_xpaccp0001", "target": "nd_xpprod0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp05", "type": "flow", "label": null, "source": "nd_xpprod0001", "target": "nd_xpmant0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp06", "type": "feedback", "label": "Yeni hikayeler → Plan", "source": "nd_xpaccp0001", "target": "nd_xpplan0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp07", "type": "feedback", "label": "Tasarım değişikliği", "source": "nd_xpiter0001", "target": "nd_xpplan0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_xp08", "type": "feedback", "label": "Bakım hikayeleri", "source": "nd_xpmant0001", "target": "nd_xpplan0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_xpexplr001", "name": "Keşif", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Kullanıcı hikayeleri yazılır, teknik tahminler yapılır, sistem metaforu oluşturulur."}, {"x": 280, "y": 120, "id": "nd_xpplan0001", "name": "Planlama Oyunu", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Müşteri önceliklendirir, geliştiriciler tahmin verir; iterasyon içeriği kararlaştırılır."}, {"x": 500, "y": 120, "id": "nd_xpiter0001", "name": "İterasyon (TDD + Çift Programlama)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Test-önce yazılır → Kodu geç → Refactor. Çift programlama zorunludur. Sürekli entegrasyon saatlik."}, {"x": 720, "y": 120, "id": "nd_xpaccp0001", "name": "Kabul Testleri", "color": "status-review", "is_final": false, "is_initial": false, "description": "Müşteri hikayelere karşılık kabul testlerini çalıştırır; geçen hikayeler tamamlanmış sayılır."}, {"x": 940, "y": 120, "id": "nd_xpprod0001", "name": "Küçük Sürüm", "color": "status-done", "is_final": false, "is_initial": false, "description": "Çalışan yazılım müşteriye teslim edilir. Geri bildirim bir sonraki planlama oyununa girer."}, {"x": 1160, "y": 120, "id": "nd_xpmant0001", "name": "Bakım & Evrim", "color": "status-done", "is_final": true, "is_initial": false, "description": "Üretim desteği, refactoring ve yeni hikayelerin sisteme entegrasyonu."}], "groups": []}	İterasyon	Iteration	\N
9	DSDM (Dinamik Sistem Geliştirme)	t	[{"name": "Ön Proje", "order": 0}, {"name": "Fizibilite", "order": 1}, {"name": "İş Araştırması", "order": 2}, {"name": "FM İterasyonu", "order": 3}, {"name": "T&İ İterasyonu", "order": 4}, {"name": "Uygulama", "order": 5}]	[]	{"wip_limits": true, "sprint_required": false}	Dynamic Systems Development Method: zaman kutulu, kullanıcı odaklı, iteratif metodoloji. RAD'ın disiplinli hali. Temel ilke: zamanı ve maliyeti sabitle, kapsamı değiştir (MoSCoW). Ön Proje → Fizibilite → İş Araştırması → Fonksiyonel Model İterasyonu → Tasarım & İnşaat İterasyonu → Uygulama → Proje Sonrası.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_ds01", "type": "flow", "label": null, "source": "nd_dsdmpre001", "target": "nd_dsdmfsb001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds02", "type": "flow", "label": null, "source": "nd_dsdmfsb001", "target": "nd_dsdmbst001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds03", "type": "flow", "label": null, "source": "nd_dsdmbst001", "target": "nd_dsdmfmi001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds04", "type": "flow", "label": null, "source": "nd_dsdmbst001", "target": "nd_dsdmdbi001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds05", "type": "flow", "label": null, "source": "nd_dsdmfmi001", "target": "nd_dsdmimp001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds06", "type": "flow", "label": null, "source": "nd_dsdmdbi001", "target": "nd_dsdmimp001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds07", "type": "flow", "label": null, "source": "nd_dsdmimp001", "target": "nd_dsdmpst001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds08", "type": "feedback", "label": "Sonraki FM zaman kutusu", "source": "nd_dsdmfmi001", "target": "nd_dsdmfmi001", "is_all_gate": false, "bidirectional": false}, {"id": "e_ds09", "type": "feedback", "label": "Sonraki T&İ zaman kutusu", "source": "nd_dsdmdbi001", "target": "nd_dsdmdbi001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_dsdmpre001", "name": "Ön Proje", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Proje tetiklenebilirliği değerlendirilir. Sponsor ve iş şampiyonu belirlenir."}, {"x": 280, "y": 120, "id": "nd_dsdmfsb001", "name": "Fizibilite Araştırması", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Teknik ve iş fizibilitesi, proje kabul kriterleri ve risk özeti hazırlanır (2-3 hafta)."}, {"x": 500, "y": 120, "id": "nd_dsdmbst001", "name": "İş Araştırması", "color": "status-progress", "is_final": false, "is_initial": false, "description": "JAD oturumları ile süreç modelleri, varlık modeli ve önceliklendirilmiş gereksinim listesi üretilir."}, {"x": 700, "y": 80, "id": "nd_dsdmfmi001", "name": "Fonksiyonel Model İterasyonu", "color": "status-progress", "is_final": false, "is_initial": false, "description": "MoSCoW önceliklerine göre işlevsel prototip geliştirilir ve kullanıcı ile gözden geçirilir."}, {"x": 700, "y": 180, "id": "nd_dsdmdbi001", "name": "Tasarım & İnşaat İterasyonu", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Tasarım protiplerine dayanarak sistem inşa edilir; her zaman kutusunda test edilir."}, {"x": 900, "y": 130, "id": "nd_dsdmimp001", "name": "Uygulama", "color": "status-review", "is_final": false, "is_initial": false, "description": "Sistem canlıya alınır; kullanıcı eğitimi, dokümantasyon ve destek devreye girer."}, {"x": 1100, "y": 130, "id": "nd_dsdmpst001", "name": "Proje Sonrası", "color": "status-done", "is_final": true, "is_initial": false, "description": "Ders çıkarılan noktalar kaydedilir; artıkların sonraki projeye devri planlanır."}], "groups": [{"id": "gr_dsdmpre", "name": "Proje Öncesi", "color": "#64748B", "children": ["nd_dsdmpre001", "nd_dsdmfsb001", "nd_dsdmbst001"]}, {"id": "gr_dsdmdev", "name": "Geliştirme", "color": "#6366F1", "children": ["nd_dsdmfmi001", "nd_dsdmdbi001", "nd_dsdmimp001"]}, {"id": "gr_dsdmpst", "name": "Proje Sonrası", "color": "#94A3B8", "children": ["nd_dsdmpst001"]}]}	Zaman Kutusu	Timebox	\N
10	FDD (Özellik Odaklı Geliştirme)	t	[{"name": "Özellik Listesi", "order": 0}, {"name": "Tasarım", "order": 1}, {"name": "Geliştirme", "order": 2}, {"name": "İnceleme", "order": 3}, {"name": "Tamamlandı", "order": 4}]	[]	{"wip_limits": true, "sprint_required": false}	Feature-Driven Development: Büyük ekipler için tasarlanmış iteratif süreç. 5 süreç: (1) Genel model geliştir, (2) Özellik listesi oluştur, (3) Özelliğe göre planla, (4) Özelliğe göre tasarla, (5) Özelliğe göre inşa et. 'Her iki haftada bir çalışan özellik' temel ölçüm birimidir.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "sequential-flexible", "edges": [{"id": "e_fd01", "type": "flow", "label": null, "source": "nd_fdddoml001", "target": "nd_fddbfls001", "is_all_gate": false, "bidirectional": false}, {"id": "e_fd02", "type": "flow", "label": null, "source": "nd_fddbfls001", "target": "nd_fddpbyf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_fd03", "type": "flow", "label": "Her özellik paketi için", "source": "nd_fddpbyf001", "target": "nd_fdddbyf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_fd04", "type": "flow", "label": null, "source": "nd_fdddbyf001", "target": "nd_fddbbyf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_fd05", "type": "feedback", "label": "Sonraki özellik paketi", "source": "nd_fddbbyf001", "target": "nd_fdddbyf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_fd06", "type": "feedback", "label": "Kapsam değişikliği", "source": "nd_fdddbyf001", "target": "nd_fddpbyf001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_fdddoml001", "name": "Genel Model Geliştir", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Alan uzmanları ile nesne modeli, sınıf diyagramı ve etki alanı sözlüğü oluşturulur."}, {"x": 300, "y": 120, "id": "nd_fddbfls001", "name": "Özellik Listesi Oluştur", "color": "status-todo", "is_final": false, "is_initial": false, "description": "İşlevsel gereksinimler '<aksiyon> <sonuç> <nesne>' formatında özellik maddelerine ayrılır."}, {"x": 540, "y": 120, "id": "nd_fddpbyf001", "name": "Özelliğe Göre Planla", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Özellikler önceliklendirilir ve geliştirici/sınıf sahiplerine atanır; takvim oluşturulur."}, {"x": 780, "y": 80, "id": "nd_fdddbyf001", "name": "Özelliğe Göre Tasarla", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Özellik mühendisi sıralı diyagram üretir; sınıf sahipleri tasarımı inceler."}, {"x": 780, "y": 180, "id": "nd_fddbbyf001", "name": "Özelliğe Göre İnşa Et", "color": "status-progress", "is_final": true, "is_initial": false, "description": "Kod yazılır, birim test edilir, incelenir ve yapıya entegre edilir. %100 özellik = sürüm."}], "groups": [{"id": "gr_fddprj", "name": "Proje Kurulum Fazları", "color": "#0EA5E9", "children": ["nd_fdddoml001", "nd_fddbfls001", "nd_fddpbyf001"]}, {"id": "gr_fddftrs", "name": "Özellik İterasyonları", "color": "#10B981", "children": ["nd_fdddbyf001", "nd_fddbbyf001"]}]}	Özellik Paketi	Feature Set	\N
11	SAFe (Ölçekli Çevik)	t	[{"name": "Portföy Backlog", "order": 0}, {"name": "PI Backlog", "order": 1}, {"name": "Sprint", "order": 2}, {"name": "System Demo", "order": 3}, {"name": "Released", "order": 4}]	[]	{"wip_limits": true, "sprint_required": true}	Scaled Agile Framework: Büyük kuruluşlarda çevik uygulamak için 3 katman: Portföy (stratejik epikler, AR/ART seçimi), Program (PI Planlama, Program Artışları, RTE koordinasyonu), Takım (Scrum/Kanban sprintleri). PI = Program Artışı (8-12 hafta, 4-6 sprint + IP Sprint).	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_sf01", "type": "flow", "label": null, "source": "nd_safeprt001", "target": "nd_safepip001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf02", "type": "flow", "label": null, "source": "nd_safepip001", "target": "nd_safespr001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf03", "type": "flow", "label": "Sprint sonu demo", "source": "nd_safespr001", "target": "nd_safesdm001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf04", "type": "flow", "label": "IP Sprinti", "source": "nd_safespr001", "target": "nd_safeips001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf05", "type": "flow", "label": "PI kapanışı", "source": "nd_safesdm001", "target": "nd_safeipa001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf06", "type": "flow", "label": null, "source": "nd_safeipa001", "target": "nd_saferel001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf07", "type": "feedback", "label": "Sonraki PI planlaması", "source": "nd_safeipa001", "target": "nd_safepip001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf08", "type": "flow", "label": null, "source": "nd_safeips001", "target": "nd_safesdm001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 60, "id": "nd_safeprt001", "name": "Portföy Yönetimi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Stratejik temalar ve epikler önceliklendirilir; ART (Agile Release Train) için bütçe tahsisi yapılır."}, {"x": 300, "y": 60, "id": "nd_safepip001", "name": "PI Planlama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "2 günlük yüz yüze PI planlama etkinliği: tüm takımlar hedefleri, riskleri ve bağımlılıkları planlar."}, {"x": 540, "y": 60, "id": "nd_safespr001", "name": "Sprint Yürütme", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Takımlar 2 haftalık sprintlerde çalışır; Scrum of Scrums ile program koordinasyonu."}, {"x": 780, "y": 60, "id": "nd_safesdm001", "name": "Sistem Demo", "color": "status-review", "is_final": false, "is_initial": false, "description": "Her sprint sonunda tüm ART'ın entegre çalışan yazılımı müşteri / iş sahibine gösterilir."}, {"x": 1020, "y": 60, "id": "nd_safeipa001", "name": "Denetle & Uyarla (I&A)", "color": "status-review", "is_final": false, "is_initial": false, "description": "PI kapanışında PI retrospektifi, çözüm demo ve problem çözme çalıştayı yapılır."}, {"x": 1260, "y": 60, "id": "nd_saferel001", "name": "Sürüm Yayını", "color": "status-done", "is_final": true, "is_initial": false, "description": "Demand management onayı ile sürüm canlıya alınır; metrikler portföy katmanına raporlanır."}, {"x": 780, "y": 160, "id": "nd_safeips001", "name": "İnovasyon & Planlama Sprinti", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Son sprint: teknik borç, inovasyon hackathon ve sonraki PI planlaması hazırlığı."}], "groups": [{"id": "gr_sfprt", "name": "Portföy Katmanı", "color": "#7C3AED", "children": ["nd_safeprt001"]}, {"id": "gr_sfprg", "name": "Program Katmanı", "color": "#2563EB", "children": ["nd_safepip001", "nd_safesdm001", "nd_safeipa001", "nd_saferel001", "nd_safeips001"]}, {"id": "gr_sftm", "name": "Takım Katmanı", "color": "#059669", "children": ["nd_safespr001"]}]}	Program Artışı (PI)	Program Increment (PI)	\N
12	Crystal Clear	t	[{"name": "Şartalandırma", "order": 0}, {"name": "İş Gereksinimi", "order": 1}, {"name": "Tasarım", "order": 2}, {"name": "Kod & Test", "order": 3}, {"name": "Entegrasyon", "order": 4}, {"name": "Kullanıcı Testi", "order": 5}]	[]	{"wip_limits": false, "sprint_required": false}	Crystal Clear: Alistair Cockburn'ün hafif metodolojisi, 2-8 kişilik ortak mekânda çalışan ekipler için. İnsan merkezli: iletişim kanalları, yapı ve yetenekler birincil önceliklerdir. Teslimat döngüleri 2-3 aylık; periyodik yetersizlik testleri ilerinin güvencesi. Şartalandırma → Teslimat Döngüsü (yinelenebilir) → Kapanış.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_cc01", "type": "flow", "label": null, "source": "nd_crychar001", "target": "nd_cryed00001", "is_all_gate": false, "bidirectional": false}, {"id": "e_cc02", "type": "flow", "label": null, "source": "nd_cryed00001", "target": "nd_crydlv0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_cc03", "type": "flow", "label": null, "source": "nd_crydlv0001", "target": "nd_cryust0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_cc04", "type": "flow", "label": "Tüm döngüler tamamlandı", "source": "nd_cryust0001", "target": "nd_crywrp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_cc05", "type": "feedback", "label": "Sonraki döngü", "source": "nd_cryust0001", "target": "nd_crydlv0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_crychar001", "name": "Şartalandırma", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Ekip oluşturulur, iş öncelikleri, teslimat döngüsü planı ve çalışma standartları kararlaştırılır."}, {"x": 280, "y": 120, "id": "nd_cryed00001", "name": "Kullanıcı Görüşmeleri", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Kullanıcı görüşmeleri ile gerçek ihtiyaçlar ve öncelikli özellikler belirlenir."}, {"x": 500, "y": 120, "id": "nd_crydlv0001", "name": "Teslimat Döngüsü", "color": "status-progress", "is_final": false, "is_initial": false, "description": "2 haftalık adımlarla: günlük stand-up, birlikte kod geliştirme, kullanıcı yansıma toplantıları."}, {"x": 720, "y": 120, "id": "nd_cryust0001", "name": "Kullanıcı Kabul Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Gerçek kullanıcılar sistemi test eder; %100 kabul oranı bir sonraki döngünün koşuludur."}, {"x": 940, "y": 120, "id": "nd_crywrp0001", "name": "Kapanış", "color": "status-done", "is_final": true, "is_initial": false, "description": "Ders çıkarılanlar, kapsam dışındaki öğeler ve ekip retrospektifi belgelenir."}], "groups": []}	Teslimat Döngüsü	Delivery Cycle	\N
13	RAD (Hızlı Uygulama Geliştirme)	t	[{"name": "Gereksinim", "order": 0}, {"name": "Kullanıcı Tst", "order": 1}, {"name": "İnşaat", "order": 2}, {"name": "Geçiş", "order": 3}]	[]	{"wip_limits": false, "sprint_required": false}	Rapid Application Development: James Martin, 1991. Yoğun kullanıcı katılımı ve zaman kutulu iteratif prototipleme ile hızlı teslimat. 4 faz: Gereksinim Planlaması → Kullanıcı Tasarımı (JAD oturumları + prototip) → İnşaat (paralel geliştirme araçları) → Sisteme Geçiş (test, eğitim, canlıya alım). Zaman hedefi: 60-90 gün.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "flexible", "edges": [{"id": "e_rd01", "type": "flow", "label": null, "source": "nd_radrpln001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd02", "type": "flow", "label": null, "source": "nd_raduds0001", "target": "nd_radcon0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd03", "type": "flow", "label": null, "source": "nd_radcon0001", "target": "nd_radcut0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd04", "type": "feedback", "label": "Prototip yineleme", "source": "nd_raduds0001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd05", "type": "feedback", "label": "Kullanıcı revizyonu", "source": "nd_radcon0001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_radrpln001", "name": "Gereksinim Planlaması", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Yönetim ve kullanıcılar sistem hedefleri, gereksinimleri ve kısıtları üzerinde uzlaşır."}, {"x": 300, "y": 120, "id": "nd_raduds0001", "name": "Kullanıcı Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "JAD oturumlarında kullanıcılar veri akışlarını ve süreçleri modeleyerek prototiplere dönüştürür."}, {"x": 540, "y": 120, "id": "nd_radcon0001", "name": "İnşaat", "color": "status-progress", "is_final": false, "is_initial": false, "description": "CASE araçları ve yeniden kullanılabilir bileşenlerle paralel geliştirme yapılır."}, {"x": 780, "y": 120, "id": "nd_radcut0001", "name": "Sisteme Geçiş", "color": "status-done", "is_final": true, "is_initial": false, "description": "Kapsamlı test, kullanıcı eğitimi, veri dönüşümü ve canlıya geçiş yönetimi."}], "groups": []}	Prototip Turu	Prototype Round	\N
14	Lean / Sürekli Teslimat	t	[{"name": "Keşfet", "order": 0}, {"name": "Geliştir", "order": 1}, {"name": "Test Et", "order": 2, "wip_limit": 3}, {"name": "Yayınla", "order": 3, "wip_limit": 2}, {"name": "İzle", "order": 4}]	[]	{"wip_limits": true, "sprint_required": false}	Lean Software Development + Continuous Delivery: israfı ortadan kaldır, akışı iyileştir, geri bildirim döngüsünü kısalt. Değer akışı: Keşfet → Geliştir (TDD, çift programlama) → Test (otomatize) → Yayınla (tek komutla CD) → İzle (metrikler, uyarılar) → Geri Bildirim. Teslim süresi birincil ölçüm. DORA metrikleri hedef.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	\N	\N	{"mode": "continuous", "edges": [{"id": "e_lc01", "type": "flow", "label": null, "source": "nd_lcddsc0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc02", "type": "flow", "label": null, "source": "nd_lcddvl0001", "target": "nd_lcdtst0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc03", "type": "flow", "label": null, "source": "nd_lcdtst0001", "target": "nd_lcdrls0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc04", "type": "flow", "label": null, "source": "nd_lcdrls0001", "target": "nd_lcdmon0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc05", "type": "flow", "label": null, "source": "nd_lcdmon0001", "target": "nd_lcdfdb0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc06", "type": "feedback", "label": "Öğrenmeden geri keşif", "source": "nd_lcdfdb0001", "target": "nd_lcddsc0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc07", "type": "feedback", "label": "Test başarısız", "source": "nd_lcdtst0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc08", "type": "feedback", "label": "Üretim hatası", "source": "nd_lcdmon0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_lcddsc0001", "name": "Keşfet", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Kullanıcı geri bildirimleri, metrikler ve hipotezlerden özellik fikirleri üretilir."}, {"x": 280, "y": 120, "id": "nd_lcddvl0001", "name": "Geliştir", "color": "status-progress", "is_final": false, "is_initial": false, "description": "TDD döngüsü: test yaz → kodu geç → refactor. Küçük, sık commitler. Feature flag arkasında."}, {"x": 500, "y": 120, "id": "nd_lcdtst0001", "name": "Test Et", "color": "status-review", "is_final": false, "is_initial": false, "description": "Otomatize birim + entegrasyon + E2E test paketi. Derleme hattı her commit'te çalışır."}, {"x": 720, "y": 120, "id": "nd_lcdrls0001", "name": "Yayınla", "color": "status-done", "is_final": false, "is_initial": false, "description": "Blue/green veya canary dağıtım. İnsan müdahalesi sıfır — tek komutla CD."}, {"x": 940, "y": 120, "id": "nd_lcdmon0001", "name": "İzle", "color": "status-done", "is_final": false, "is_initial": false, "description": "Hata oranı, gecikme, iş metrikleri (dönüşüm, etkinleşme) gerçek zamanlı izlenir."}, {"x": 700, "y": 240, "id": "nd_lcdfdb0001", "name": "Geri Bildirim & Öğren", "color": "status-progress", "is_final": true, "is_initial": false, "description": "Metrikler ve kullanıcı geri bildirimleri Keşfet fazına aktarılır; deney döngüsü yeniden başlar."}], "groups": []}	Akış Döngüsü	Flow Cycle	\N
15	PRINCE2 (Proje Yönetimi)	t	[{"name": "Başlatma", "order": 0}, {"name": "Yönetim", "order": 1}, {"name": "Kontrol", "order": 2}, {"name": "Ürün Teslimat", "order": 3}, {"name": "Kapanış", "order": 4}]	[]	{"wip_limits": false, "sprint_required": false, "strict_dependencies": true}	PRINCE2 (PRojects IN Controlled Environments): İngiltere kökenli süreç tabanlı proje yönetimi çerçevesi. 7 prensip, 7 tema, 7 süreç. Her aşama bir Aşama Yetki Belgesi ile başlar; aşama sınırında Proje Yöneticisi Proje Kuruluna ilerleme hakkı için müracaat eder. İş vakası (business case) boyunca canlı tutulur.	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	[{"name": "Proje Belgesi (PID)", "description": "Proje kapsamı, yaklaşımı, iş vakası ve kontrol yapısını tanımlar."}, {"name": "İş Vakası", "description": "Projenin yatırım getirisini ve stratejik uyumunu gösterir."}, {"name": "Risk Kaydı", "description": "Tanımlanmış riskler, olasılık/etki matrisi ve yanıtlar."}, {"name": "Sorun Kaydı", "description": "Açık sorunlar, sahipler ve çözüm durumu."}, {"name": "Kalite Kaydı", "description": "Kalite inceleme ve test sonuçlarının özeti."}, {"name": "Aşama Sonu Raporu", "description": "Her aşama kapanışında hazırlanan ilerleme özeti."}, {"name": "Proje Kapanış Raporu", "description": "Ders çıkarılanlar, faydaların gerçekleşmesi ve kapanış onayı."}]	\N	{"mode": "sequential-locked", "edges": [{"id": "e_p2_01", "type": "flow", "label": null, "source": "nd_p2stup0001", "target": "nd_p2init0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_02", "type": "flow", "label": "PID onayı", "source": "nd_p2init0001", "target": "nd_p2dirp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_03", "type": "flow", "label": "Aşama yetki belgesi", "source": "nd_p2dirp0001", "target": "nd_p2ctrl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_04", "type": "flow", "label": "İş paketi atama", "source": "nd_p2ctrl0001", "target": "nd_p2mprd0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_05", "type": "flow", "label": "Ürün teslimi", "source": "nd_p2mprd0001", "target": "nd_p2ctrl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_06", "type": "flow", "label": "Aşama sonu", "source": "nd_p2ctrl0001", "target": "nd_p2msbd0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_07", "type": "flow", "label": "Sonraki aşama onayı", "source": "nd_p2msbd0001", "target": "nd_p2dirp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_08", "type": "flow", "label": "Son aşama kapanışı", "source": "nd_p2msbd0001", "target": "nd_p2clos0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_09", "type": "flow", "label": "Erken kapanış kararı", "source": "nd_p2dirp0001", "target": "nd_p2clos0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_p2stup0001", "name": "Projeyi Başlat (SU)", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Proje yetkilendirilmesi için zemin hazırlanır: proje özeti, IS/PB atama ve yönetim yaklaşımı."}, {"x": 280, "y": 120, "id": "nd_p2init0001", "name": "Projeyi Başlangıçlandır (IP)", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Proje Belgesi (PID) oluşturulur: iş vakası, risk kaydı, iletişim planı, kalite yönetim yaklaşımı."}, {"x": 500, "y": 60, "id": "nd_p2dirp0001", "name": "Projeyi Yönet (DP)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Proje Kurulu yetkiler, denetler ve kılavuzlar. Her aşama geçişinde Proje Kurulu devrede."}, {"x": 500, "y": 180, "id": "nd_p2ctrl0001", "name": "Aşamayı Kontrol Et (CS)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Proje Yöneticisi iş paketleri atar, ilerlemeyi izler, değişiklikleri değerlendirir."}, {"x": 720, "y": 180, "id": "nd_p2mprd0001", "name": "Ürün Teslimatını Yönet (MP)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Ekip Yöneticisi iş paketini kabul eder, yürütür ve teslim eder. Kalite onayı yapılır."}, {"x": 720, "y": 60, "id": "nd_p2msbd0001", "name": "Aşama Sınırını Yönet (SB)", "color": "status-review", "is_final": false, "is_initial": false, "description": "Mevcut aşama raporu ve sonraki aşama planı hazırlanır; Proje Kurulu onayı istenir."}, {"x": 940, "y": 120, "id": "nd_p2clos0001", "name": "Projeyi Kapat (CP)", "color": "status-done", "is_final": true, "is_initial": false, "description": "Ürünler teslim edilir, iş faydaları doğrulanır, deneyimler kaydedilir, proje onaylanarak kapatılır."}], "groups": [{"id": "gr_p2mgmt", "name": "Yönetim Süreçleri", "color": "#0F172A", "children": ["nd_p2stup0001", "nd_p2init0001", "nd_p2dirp0001", "nd_p2clos0001"]}, {"id": "gr_p2del", "name": "Teslimat Süreçleri", "color": "#1E40AF", "children": ["nd_p2ctrl0001", "nd_p2mprd0001", "nd_p2msbd0001"]}]}	Aşama	Stage	\N
1	Scrum	t	[{"name": "Backlog", "order": 0}, {"name": "To Do", "order": 1}, {"name": "In Progress", "order": 2}, {"name": "Code Review", "order": 3}, {"name": "Done", "order": 4}]	[]	{"wip_limits": false, "sprint_required": true}	Zaman-kutulu sprintler, ürün backlog'u, günlük stand-up ve retrospektif ile iteratif geliştirme.	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	\N	\N	{"mode": "flexible", "edges": [], "nodes": [{"id": "plan", "label": "Sprint Planning", "order": 0}, {"id": "develop", "label": "Development", "order": 1}, {"id": "review", "label": "Sprint Review", "order": 2}, {"id": "retro", "label": "Retrospective", "order": 3}], "groups": []}	Sprint	Sprint	[{"name": "Backlog", "category": "todo", "wip_limit": 0, "is_initial": true, "exit_policy": "any", "is_terminal": false, "order_index": 0, "entry_policy": "any", "max_duration_days": null}, {"name": "To Do", "category": "todo", "wip_limit": 0, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 1, "entry_policy": "any", "max_duration_days": null}, {"name": "In Progress", "category": "in_progress", "wip_limit": 0, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 2, "entry_policy": "any", "max_duration_days": null}, {"name": "Code Review", "category": "in_progress", "wip_limit": 0, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 3, "entry_policy": "any", "max_duration_days": null}, {"name": "Done", "category": "done", "wip_limit": 0, "is_initial": false, "exit_policy": "terminal_lock", "is_terminal": true, "order_index": 4, "entry_policy": "any", "max_duration_days": null}]
2	Kanban	t	[{"name": "To Do", "order": 0, "wip_limit": 0}, {"name": "Analiz", "order": 1, "wip_limit": 3}, {"name": "Geliştirme", "order": 2, "wip_limit": 4}, {"name": "Test", "order": 3, "wip_limit": 2}, {"name": "Done", "order": 4, "wip_limit": 0}]	[]	{"wip_limits": true, "sprint_required": false}	Sürekli akış, WIP limitleri ve çekme tabanlı iş akışı ile akışkan teslimat.	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	\N	\N	{"mode": "continuous", "edges": [], "nodes": [{"id": "todo", "label": "Yapılacak", "order": 0}, {"id": "doing", "label": "Devam Ediyor", "order": 1}, {"id": "done", "label": "Bitti", "order": 2}], "groups": []}	Döngü	Cycle	[{"name": "To Do", "category": "todo", "wip_limit": 0, "is_initial": true, "exit_policy": "any", "is_terminal": false, "order_index": 0, "entry_policy": "any", "max_duration_days": null}, {"name": "Analiz", "category": "in_progress", "wip_limit": 3, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 1, "entry_policy": "any", "max_duration_days": null}, {"name": "Geliştirme", "category": "in_progress", "wip_limit": 4, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 2, "entry_policy": "any", "max_duration_days": null}, {"name": "Test", "category": "in_progress", "wip_limit": 2, "is_initial": false, "exit_policy": "any", "is_terminal": false, "order_index": 3, "entry_policy": "any", "max_duration_days": null}, {"name": "Done", "category": "done", "wip_limit": 0, "is_initial": false, "exit_policy": "terminal_lock", "is_terminal": true, "order_index": 4, "entry_policy": "any", "max_duration_days": null}]
3	Waterfall	t	[{"name": "Gereksinim", "order": 0}, {"name": "Analiz", "order": 1}, {"name": "Tasarım", "order": 2}, {"name": "Uygulama", "order": 3}, {"name": "Test", "order": 4}, {"name": "Bakım", "order": 5}]	[]	{"sprint_required": false, "strict_dependencies": true}	Gereksinim, tasarım, uygulama, test, bakım fazlarıyla sıralı ve belgeleme ağırlıklı model.	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	\N	\N	{"mode": "sequential", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "req", "target": "design", "is_all_gate": false, "bidirectional": false}, {"id": "e2", "type": "flow", "label": null, "source": "design", "target": "impl", "is_all_gate": false, "bidirectional": false}, {"id": "e3", "type": "flow", "label": null, "source": "impl", "target": "test", "is_all_gate": false, "bidirectional": false}, {"id": "e4", "type": "flow", "label": null, "source": "test", "target": "maint", "is_all_gate": false, "bidirectional": false}], "nodes": [{"id": "req", "label": "Gereksinim", "order": 0}, {"id": "design", "label": "Tasarım", "order": 1}, {"id": "impl", "label": "Uygulama", "order": 2}, {"id": "test", "label": "Test", "order": 3}, {"id": "maint", "label": "Bakım", "order": 4}], "groups": []}	Faz	Phase	[{"name": "Gereksinim", "category": "todo", "wip_limit": 0, "is_initial": true, "exit_policy": "edges_only", "is_terminal": false, "order_index": 0, "entry_policy": "any", "max_duration_days": null}, {"name": "Analiz", "category": "todo", "wip_limit": 0, "is_initial": false, "exit_policy": "edges_only", "is_terminal": false, "order_index": 1, "entry_policy": "edges_only", "max_duration_days": null}, {"name": "Tasarım", "category": "in_progress", "wip_limit": 0, "is_initial": false, "exit_policy": "edges_only", "is_terminal": false, "order_index": 2, "entry_policy": "edges_only", "max_duration_days": null}, {"name": "Uygulama", "category": "in_progress", "wip_limit": 0, "is_initial": false, "exit_policy": "edges_only", "is_terminal": false, "order_index": 3, "entry_policy": "edges_only", "max_duration_days": null}, {"name": "Test", "category": "in_progress", "wip_limit": 0, "is_initial": false, "exit_policy": "edges_only", "is_terminal": false, "order_index": 4, "entry_policy": "edges_only", "max_duration_days": null}, {"name": "Bakım", "category": "done", "wip_limit": 0, "is_initial": false, "exit_policy": "terminal_lock", "is_terminal": true, "order_index": 5, "entry_policy": "edges_only", "max_duration_days": null}]
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, is_system_role, icon_key, color_token) FROM stdin;
1	Guest	Salt okunur misafir hesabı (D-2.4)	t	\N	\N
2	Admin	Sistem yöneticisi, tam yetkili.	t	\N	\N
3	Project Manager	Proje yöneticisi, ekip ve süreç yönetimi.	t	\N	\N
4	Member	Ekip üyesi, görev üzerinde çalışır.	t	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, email, password_hash, avatar, is_active, role_id, created_at, version, updated_at, is_deleted, deleted_at) FROM stdin;
1	Sistem Yöneticisi	admin@spms.com	$2b$12$e5jtCpD8hSyTLw50PIbqausOlzpzZfC01hCv96HdeY34RI5V24mtO	https://i.pravatar.cc/150?u=ayse	t	2	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
2	Ayşe Öz	ayse.oz@gazi.edu.tr	$2b$12$bsT9NFCQAupQlvMRJS9gku8b7yKEuZwNGwW1SBrwKURgYVUhD9Iry	https://i.pravatar.cc/150?u=admin	t	3	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
3	Yusuf Emre Bayrakcı	yusuf.bayrakci@gazi.edu.tr	$2b$12$t/R2ZJ3PovR/GlZ8H9sqs.gNxNyxXsv6ESuFPVT/RjqNi0JTYTWUe	https://i.pravatar.cc/150?u=yusuf	t	3	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
5	Zeynep Kaya	zeynep.kaya@firma.com	$2b$12$6XtzjIPav9aP5rfLJt6aq.dAkf/zWp7vFQ2iuDT3xHn7I1bf7wO7i	https://i.pravatar.cc/150?u=zeynep	t	4	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
6	Ali Demir	ali.demir@firma.com	$2b$12$f7LEjFqM9cQM88qTPZeJQe9KcxsG2sYQzl3NklRqGI9qFl.uOo0Zi	https://i.pravatar.cc/150?u=ali	t	4	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
7	Elif Çelik	elif.celik@firma.com	$2b$12$OBQdEsh1NNpq706XwIjS8.dsr283MWGWr9VM6U0IUBH4ZHYEyqQm6	https://i.pravatar.cc/150?u=elif	t	4	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
8	Can Yıldız	can.yildiz@firma.com	$2b$12$gJ92XvxX7WE9zmE/hFfyiO/9vxXfLYj1r0x3rm2L0GOaJuchFAnMW	https://i.pravatar.cc/150?u=can	t	4	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N
9	Ahmet Kaya	ahmet.kaya@firma.com	$2b$12$vYU48wnwnAZw/EBlp6cuZOvA880IlsU3mPl7YvGcDPWD3kfY.ECEG	https://i.pravatar.cc/150?u=ahmetkaya	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
10	Fatma Şahin	fatma.sahin@firma.com	$2b$12$mgLMpTXIZzCcU36lGoeJruV93asD8usmUKYwh8ydjNCTCJaV.yW8a	https://i.pravatar.cc/150?u=fatmasahin	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
11	Mustafa Demir	mustafa.demir@firma.com	$2b$12$sSFOL3Pq67MhXmNYQuBW.OiXOnaqXfX3YqQNXc11ZKG4LmSUdDu8W	https://i.pravatar.cc/150?u=mustafademir	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
12	Emine Yıldız	emine.yildiz@firma.com	$2b$12$zOmsCGYCXxdjnBLVIIp82usJVjPA43y9lxjBNUZbo7Fn47ckMIexG	https://i.pravatar.cc/150?u=emineyildiz	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
13	Ömer Çelik	omer.celik@firma.com	$2b$12$xncGUbtStMPSumXxV29fUeazv.FxGC3m9s/dVusliEhGAndNMnF7G	https://i.pravatar.cc/150?u=omercelik	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
14	Hatice Arslan	hatice.arslan@firma.com	$2b$12$Is1EUCsnFFjCR6ncc6vxxOjlQTDjNjCNWa1XF1upK6Km.gqAcfWTu	https://i.pravatar.cc/150?u=haticearslan	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
15	İbrahim Aydın	ibrahim.aydin@firma.com	$2b$12$nErMfJox69kSRL3HqAQ.QOQSb9Y7hGZ5Jvx/qtunq2FbDU.R.Dt8i	https://i.pravatar.cc/150?u=ibrahimaydin	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
16	Merve Öztürk	merve.ozturk@firma.com	$2b$12$lqmCNOxuqaMn1M2xo4i0Xeibu/gHNgVWKXUw7B9HarpW/qrQegOgq	https://i.pravatar.cc/150?u=merveozturk	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
18	Selin Yılmaz	selin.yilmaz@firma.com	$2b$12$8AsL9MueJw0Kdid5n43hWui5emzDNT0PT6KuTZfVPjiO5ET9nxHAS	https://i.pravatar.cc/150?u=selinyilmaz	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
19	Serkan Doğan	serkan.dogan@firma.com	$2b$12$Z1/JBFYYjh33RSWkmcFAu.QQM.rmjpSB/oXhbGxNrzThY8BiVsKQm	https://i.pravatar.cc/150?u=serkandogan	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
20	Büşra Koç	busra.koc@firma.com	$2b$12$8LCcSfRblhcBA98QemWcmuQygvE7/wkd2S/AkIhzbuim91/g3J4Qq	https://i.pravatar.cc/150?u=busrakoc	t	3	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
21	Berk Aktaş	berk.aktas@firma.com	$2b$12$7h48cYfedvyjDEwZnWTwbeWjxCuPKaSur3Jw54YR7UFF250GVB3zK	https://i.pravatar.cc/150?u=berkaktas	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
22	Gamze Çetin	gamze.cetin@firma.com	$2b$12$PUgFWH/.e/0wH5lBS/1LouE.EVhZBnNA8UTzQFVyq4xyGlUIrGmRK	https://i.pravatar.cc/150?u=gamzecetin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
23	Arda Polat	arda.polat@firma.com	$2b$12$7ngvOdHQHatdtFN2iFFlwu7J0Zlfl9CMe7BeHRkGV6zTtLKVMJ0Ia	https://i.pravatar.cc/150?u=ardapolat	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
24	Sibel Türk	sibel.turk@firma.com	$2b$12$MFOuxoXC267MET5c4Jh2ue27KS.WQnDjg/LD9CUZx6ScLU6RNyDQ.	https://i.pravatar.cc/150?u=sibelturk	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
25	Furkan Işık	furkan.isik@firma.com	$2b$12$pYqAHuLubP6c2j4dKEYr1.q/exzw8Anp2RaD4D3VggbrgYX2xVNF.	https://i.pravatar.cc/150?u=furkanisik	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
26	Tuğba Ceylan	tuğba.ceylan@firma.com	$2b$12$029AJec.LhyNcbskKPm6hu6s/xpj/2H8BN7KiYq697UqI.0sV/1Y2	https://i.pravatar.cc/150?u=tugbaceylan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
27	Koray Bayrak	koray.bayrak@firma.com	$2b$12$W0thVhx1ZxR1oLqP46Q4gewf2VQeSe.nHp5yhMZ2Bd1AWkoJVSd5.	https://i.pravatar.cc/150?u=koraybayrak	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
28	Özlem Güven	ozlem.guven@firma.com	$2b$12$tck5j/sHgAG8au8j/UgPiuyoLBFzBRpJsOBmxvbyGQuabnkazvtuW	https://i.pravatar.cc/150?u=ozlemguven	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
29	Volkan Kılıç	volkan.kilic@firma.com	$2b$12$bRM.VSE.MfUs9oYzO0uEtOrEPRqdJHjUjT4w22NEKE2nkCZRW1QD6	https://i.pravatar.cc/150?u=volkankilic	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
30	Esra Sarı	esra.sari@firma.com	$2b$12$raWumGgvirA1nt/S8eDhLuqBG83QS6g.K1ScUexSrSLDttnVrWBOe	https://i.pravatar.cc/150?u=esrasari	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
31	Mert Yıldırım	mert.yildirim@firma.com	$2b$12$k721GkZWncLoq0ZLeu8B4O6A1YDSoui9y5..oS4DlXH/jQ5VTms.K	https://i.pravatar.cc/150?u=mertyildirim	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
32	Aslı Çakır	asli.cakir@firma.com	$2b$12$gIUuUOzWK3imb7hJZadR9OJpWdiQVmjEqF2mnpd6wuQtAHzu710IC	https://i.pravatar.cc/150?u=aslicakir	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
33	Tolga Uçar	tolga.ucar@firma.com	$2b$12$Lf7rUPJQHux8Fk7zIqHSD.c8o7ePv07CNCgF./nnrBt080fzUDLSm	https://i.pravatar.cc/150?u=tolgaucar	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
34	Şeyma Güler	seyma.guler@firma.com	$2b$12$CQGYCTmH0gkIAb3Ifg64ZeOBhlKNJbPbKT1qiIomzmou0kgO7Mj3m	https://i.pravatar.cc/150?u=seymaguler	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
35	Onur Erdoğan	onur.erdogan@firma.com	$2b$12$0W76l32fa7fDGe9p4Jfu7.GM6d9aOU3Leu6Ees0lgL2gYWic2mbbW	https://i.pravatar.cc/150?u=onurdogan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
36	Çiğdem Özel	cigdem.ozel@firma.com	$2b$12$W8zO0gf7uYy6QLGV6xzZKOpWmFX3odGHsOjUa3NsTUmBB18DM0BJS	https://i.pravatar.cc/150?u=cigdemozel	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
37	Eray Koç	eray.koç@firma.com	$2b$12$RC0UXqL52QERVFdGT5YuIeiHNWsstj1ahLeA2.FquyyNkf7pwYrn6	https://i.pravatar.cc/150?u=eraykoc	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
38	Derya Akar	derya.akar@firma.com	$2b$12$KcJgcgWIExwrEcNSSjaZP.qq2Sgh.pT.3Vnv6tVEX8aCQPU16TNES	https://i.pravatar.cc/150?u=deryaakar	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
39	Sinan Güneş	sinan.gunes@firma.com	$2b$12$npSTOMbQErNOhM0yJQ6yret5JrZSV7SVtTp6SmRflYlbKu9IbKQB2	https://i.pravatar.cc/150?u=sinangunes	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
40	İlknur Karaca	ilknur.karaca@firma.com	$2b$12$nE1HAqqdyfzNlJ3WTccQT.gMVsBqQha5SRfQMdADWJm.zlOm99OAy	https://i.pravatar.cc/150?u=ilknurkaraca	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
41	Caner Özdemir	caner.ozdemir@firma.com	$2b$12$pjOSY/vq4tg3DrcF4gDx/OW3h.hwcAgt336g4YA/KTOsoquBCVVZe	https://i.pravatar.cc/150?u=canerozdemir	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
42	Pınar Tekin	pinar.tekin@firma.com	$2b$12$Tj5rV4IAzCLOSUDa1KHNsOwIJ.Etzo3GsZcLlb/8gb8fvR6RT.iVa	https://i.pravatar.cc/150?u=pinartekin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
43	Alper Şen	alper.sen@firma.com	$2b$12$Zm402n3wARuzQf/2NsfYP.br1vGQqxSvs2yKRv4.1TCJbrIHqUyIe	https://i.pravatar.cc/150?u=alpersen	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
44	Melike Taş	melike.tas@firma.com	$2b$12$Qj.biji0humPsdIqGFDcqOkpmLaCgM2YC66k62IYRr6AwnRYP23IW	https://i.pravatar.cc/150?u=meliketas	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
45	Gökhan Çınar	gokhan.cinar@firma.com	$2b$12$3zaAknLtI0XzVuRTUtKNJediS2hP0WA6q9UpHGrjCZYFSG.T2pcKy	https://i.pravatar.cc/150?u=gokhancinar	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
46	Reyhan Bulut	reyhan.bulut@firma.com	$2b$12$lp3FW5fKxDJxhfs0J5ccVueeU8zm1Amy7l7rwY7ar.qVXMosCtejm	https://i.pravatar.cc/150?u=reyhanbulut	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
47	Kerem Savaş	kerem.savas@firma.com	$2b$12$GihvFflXYCC9SUHDiw60A.W5lM5Vk7QxoYxk0zpXExxLqa/sn2j6S	https://i.pravatar.cc/150?u=keremsavas	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
48	Vildan Erdem	vildan.erdem@firma.com	$2b$12$8qxipGw7iQLxCv1d0i6hyuSeoSnGL2JIEuvXKfsYbUUhpZ4VEaZNq	https://i.pravatar.cc/150?u=vildanerdem	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
49	Taner Özkan	taner.ozkan@firma.com	$2b$12$evO8UlcrciA6SEWGlPy1WOB91XPmECg/fwXkU3Yu453Mt7.wLLA.W	https://i.pravatar.cc/150?u=tanerozkan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
50	Nurcan Yüce	nurcan.yuce@firma.com	$2b$12$o3q7oBonNis1IRJAty7USONyp3uw3KWp1vGpyrFAwv5ZVJwIXgsve	https://i.pravatar.cc/150?u=nurcanyuce	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
51	Barış Demirci	barıs.demirci@firma.com	$2b$12$ES8XR03JaZE8vpjZ2IUgB.sTg8owzhabHTCkrdK0XKWLnoT1ELV.K	https://i.pravatar.cc/150?u=barisdemirci	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
52	Ülkü Kaplan	ulku.kaplan@firma.com	$2b$12$Ozt.TFNfIvJKD8STfMUuLux1Fk1dqnoN1Ou3P0p810n42dm7VZBKG	https://i.pravatar.cc/150?u=ulkukaplan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
53	Serhat Tunç	serhat.tunç@firma.com	$2b$12$vsimXUpGe085MFrucn0wp.tvT.ekk58uVCdHLyFg8oPWsAK1m/vnu	https://i.pravatar.cc/150?u=serhattunc	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
54	Gülşen Ateş	gulsen.ates@firma.com	$2b$12$PZaU0BivXGJK4049/6mTb.45KsqIdUhiecUKozIymmBAvkW0j6ube	https://i.pravatar.cc/150?u=gulsena	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
55	Ozan Kara	ozan.kara@firma.com	$2b$12$470bmSebkPtE4ZtP3j9BpuGZyf/TXcT2f7GKSOE/rNhn9PtFxoWe.	https://i.pravatar.cc/150?u=ozankara	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
56	Yeliz Özgür	yeliz.ozgur@firma.com	$2b$12$Pw4Ds5Ry.7LE42GM96lGbOZHHuvROWNQu.l7t.Fl3Dg/wNQCow7Bq	https://i.pravatar.cc/150?u=yelizozgur	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
57	Erdem Topal	erdem.topal@firma.com	$2b$12$ENe25wyNw/9afL/hAUBT5OxWK7uPznkE3618gvfvodfu3xrLZnbzO	https://i.pravatar.cc/150?u=erdemtopal	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
58	Tuğce Akın	tuğce.akın@firma.com	$2b$12$jX5Qe4I.ijxivPCt5NWRIuX/mXSlLcAibF0QCr8RMUhnelf6UYR2q	https://i.pravatar.cc/150?u=tugceakin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
59	Murat Karadağ	murat.karadag@firma.com	$2b$12$sHS3awPP4.HueiQk226Dl.kNoQyidagVdGkyhwLWLv1GNLMzWZwHO	https://i.pravatar.cc/150?u=muratkaradag	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
60	Leyla Arslan	leyla.arslan@firma.com	$2b$12$9hAzMsQWlW2F76WIjr8.nev3s/ADGKuxv3.wjaCDjjaeTc.nH2Mdm	https://i.pravatar.cc/150?u=leylaarslan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
61	Deniz Toprak	deniz.toprak@firma.com	$2b$12$B5eASM7Xib.bP1NjDvmFJuPjYfp.y.SvmKudl.J2P8pGG6tWx1p5K	https://i.pravatar.cc/150?u=deniztoprak	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
62	Cem Doğan	cem.dogan@firma.com	$2b$12$0IFjpgVutjzNrurXuUv0vOgFVpWM3j0jkDGyxT9FNJLuxEMIRpA1e	https://i.pravatar.cc/150?u=cemdogan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
63	Yasemin Tan	yasemin.tan@firma.com	$2b$12$mAA.rCMHxGe0iK6yiZ85se7.P1WohOdb/Z10oMOCYJfp/i4j3uxHS	https://i.pravatar.cc/150?u=yasemintan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
64	Emre Ergin	emre.ergin@firma.com	$2b$12$B/KxQX2uq7YQuV3h83MWFeDZK3DtQjNXP19IibZEILSfEy21sydRy	https://i.pravatar.cc/150?u=emreergin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
65	Sevgi Demir	sevgi.demir@firma.com	$2b$12$Ff7nDg/OT1K/YzBeOCwEfe7P0CVbKqflJx8nUsDyAzZX2W4F8hzaS	https://i.pravatar.cc/150?u=sevgidemir	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
66	Fatih Kurt	fatih.kurt@firma.com	$2b$12$gByB5JVDPbjpGbw2Dr/53uIVv3/zmWLRv1uu86ruFMYetNEbIvRky	https://i.pravatar.cc/150?u=fatihkurt	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
67	Nisa Yıldırım	nisa.yıldırım@firma.com	$2b$12$9af2YPxCNK/0kQnD/tAOSee7z8bNMoiWhnqhtjeETjaK/.gd3SqT6	https://i.pravatar.cc/150?u=nisayildirim	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
68	Barış Özkan	baris.ozkan@firma.com	$2b$12$kQ55nBzznWZFNOMw7qiKZug.nDuAuW1SSHg9uSY3NNn0OF0bptBH.	https://i.pravatar.cc/150?u=barisozkan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
69	İpek Çelik	ipek.celik@firma.com	$2b$12$Y2SkK3tByJN7mUdhn9FIU.LPyJG9jHmR7ifijwQSJ9SG5bmSRDNiq	https://i.pravatar.cc/150?u=ipekcelik	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
70	Yasin Acar	yasin.acar@firma.com	$2b$12$LuIGLm30gn4rnaDgg6DrVu1Jr2K5fntgiNStiXRJpZvNaKB5djlCa	https://i.pravatar.cc/150?u=yasinacar	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
71	Betül Kaya	betul.kaya@firma.com	$2b$12$5oU3jB3St6Qvdacpg4srweC8grtg2VUVf1d5eNPHycJhqxvLjKSX6	https://i.pravatar.cc/150?u=betulkaya	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
72	Hasan Şimşek	hasan.şimşek@firma.com	$2b$12$7Xw34iewwkj3Yn52y9c2u.Kdb741fezJfEPhXHXpBqWee.9EtGoLG	https://i.pravatar.cc/150?u=hasansimsek	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
73	Duygu Polat	duygu.polat@firma.com	$2b$12$YIHTHJOaDOaFtCVVknwpwuMpj60bev/amWlYEr0d4A/v0xSiuqQau	https://i.pravatar.cc/150?u=duygupolat	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
74	İlker Kahraman	ilker.kahraman@firma.com	$2b$12$j1gGLZXPbLZuQfOqzFSJJuFRrww3mNmxjPWAzUIE6lxl6kkLl2fBe	https://i.pravatar.cc/150?u=ilkerkahraman	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
75	Nilay Gül	nilay.gul@firma.com	$2b$12$J6qNTK/DQ3rlH5l4q/6fB.Mia/WWu3qNQOlP9Pcao29wrxrxVaCsO	https://i.pravatar.cc/150?u=nilaygul	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
76	Ercan Yıldız	ercan.yıldız@firma.com	$2b$12$2EZFa0bNgXrYcJsqdWGh1.M6VdItcw0MraPA3mn5E8kDMBbiKTuF.	https://i.pravatar.cc/150?u=ercanyildiz	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
77	Ceren Şahin	ceren.sahin@firma.com	$2b$12$O913MnOI7VvEbt8DwzBX6.mjR9Kr5c0ECpYFYZZB2EFPL6sloF/eq	https://i.pravatar.cc/150?u=cerensahin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
78	Uğur Aydın	ugur.aydin@firma.com	$2b$12$rZH0CJLWzHUbb3LPC75PCe/K9r1mbk1IAYyH2Jd3dC7HLL0.YS5KS	https://i.pravatar.cc/150?u=uguraydin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
79	Meltem Yücel	meltem.yücel@firma.com	$2b$12$azgnF74AW6/p.QuQpBWVfuy67XHJJ/qVgHKYfMqdnXShoFZxI6VR6	https://i.pravatar.cc/150?u=meltemyucel	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
80	Tarık Bozkurt	tarik.bozkurt@firma.com	$2b$12$.aCGaJ/k2rZr0ZalpYex9uxvmVM1VDft0LRJkbeGjYQmgxhAN7RVa	https://i.pravatar.cc/150?u=tarikbozkurt	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
81	Hacer Çelik	hacer.çelik@firma.com	$2b$12$gHJcn7fousFxAspkWtVC6.xCYnnEHuZOTZK7sG4ai9KCyvia7PRla	https://i.pravatar.cc/150?u=hacercelik	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
82	Kaan Erdoğan	kaan.erdoğan@firma.com	$2b$12$0tvjlOrc0kJz1nJI9rVQauhDKZVwcUIYfWUR15AgzD5A4Rz7stFiq	https://i.pravatar.cc/150?u=kaanerdogan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
83	Sedef Karaman	sedef.karaman@firma.com	$2b$12$X.yt6uw72Npi44lihytHwO/agHFE7mc9Ej7Q4ow6iZMdRlmE3YG96	https://i.pravatar.cc/150?u=sedefkaraman	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
84	Enes Yıldız	enes.yıldız@firma.com	$2b$12$Wz.Ip.SIMEJ9GxMx0IpEAurecaGafmjk8Tkjbj2.nuJ3kxPJIEndq	https://i.pravatar.cc/150?u=enesyildiz	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
85	Suat Turhan	suat.turhan@firma.com	$2b$12$ceV6bt29Dgx/uvsJQOt.OuPbxY9xz8Qe.XecMdKrOYscpqhTcaqJy	https://i.pravatar.cc/150?u=suatturhan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
86	Mine Özcan	mine.ozcan@firma.com	$2b$12$WVlN5c5hIZ6I6kEOD0.SPeIafDm6SrWl8.2pNGHGLxvEv6qImcwMm	https://i.pravatar.cc/150?u=mineozcan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
87	Hakan Bulut	hakan.bulut@firma.com	$2b$12$IYMFTt1lWbZctuU/YfW07.rQe/q.8PHxHdLFvIL5do0OUCxlGD.nW	https://i.pravatar.cc/150?u=hakanbulut	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
88	Lale Demir	lale.demir@firma.com	$2b$12$pWoXy/eWgOcp0VqVcoZhSelCHndEnXnyJumLeRS2TySbUZHW0d5hq	https://i.pravatar.cc/150?u=laledemir	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
89	Çağrı Yılmaz	cagri.yılmaz@firma.com	$2b$12$IX0SpBp88MuAfpF19ErrMu8cwc94micNCQV7D8z0vMEZvlySsWaai	https://i.pravatar.cc/150?u=cagriyilmaz	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
90	Sıla Kara	sıla.kara@firma.com	$2b$12$HnHv.6icpzdfk320NaKLPehofLXrMjbIWoOjYk5MuoyNQCnRRclbu	https://i.pravatar.cc/150?u=silakara	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
91	Nuri Öztürk	nuri.öztürk@firma.com	$2b$12$QhvQzrqAjhA4pM.VH5VyYeLT5eHK51PcOtfbuN82X1pevNfhQ7u7G	https://i.pravatar.cc/150?u=nuriozturk	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
92	Ezgi Çetin	ezgi.çetin@firma.com	$2b$12$YHtZPHLsGW1sbhJQU71xp.0F96obNIpixQDP6oUXJtFKGo.sqB21y	https://i.pravatar.cc/150?u=ezgicetin	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
93	Ahmet Aslan	ahmet.aslan@firma.com	$2b$12$zC2/JeNynpZ46UfcHht5/.TraRm6Oc8WsqXIjrKnfr/nAdq3zWmfG	https://i.pravatar.cc/150?u=ahmetaslan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
94	Burcu Yılmaz	burcu.yılmaz@firma.com	$2b$12$14z7FbX.TEa1K033cAofVuzhpgefIobKHKixenhdx2YusjgmiuMda	https://i.pravatar.cc/150?u=burcuyilmaz	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
95	Murat Koçak	murat.koçak@firma.com	$2b$12$xBNysCpT8RBwBkKJ4h4.IOl6wKWT6i.U8xLn2hseWcsOa1SUtQ8Nu	https://i.pravatar.cc/150?u=muratkocak	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
96	Selma Arslan	selma.arslan@firma.com	$2b$12$TmyF9A8MQW6vAywksDHg4uMgmxG1adrrVYaZf2ACeWRaTL2BMIezO	https://i.pravatar.cc/150?u=selmaarslan	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
97	Zafer Güneş	zafer.güneş@firma.com	$2b$12$NC4weWPFvLNm0GoZTNsO.OwDXI6YJfBUeepVS2B2ChbOFe.yAdlGy	https://i.pravatar.cc/150?u=zafergunes	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N
4	Mehmet Yılmaz	mehmet.yilmaz@firma.com	$2b$12$DEtef6ADd2kaOvW.YuLcbOKOIsvCEVBhgNQ7b8cYAXG6.XBikXasm	https://i.pravatar.cc/150?u=mehmet	t	3	2026-04-29 11:02:01.374639+00	1	2026-04-29 13:17:39.457628+00	f	\N
17	Hüseyin Kurt	huseyin.kurt@firma.com	$2b$12$nRhBPTgoWSMm3tgT8P7rAeKx0PeZrfywy3lbRW/OT3DGOv3pigccq	https://i.pravatar.cc/150?u=huseyinkurt	t	4	2026-04-29 11:02:04.785991+00	1	2026-04-29 13:17:57.991451+00	f	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, key, name, description, methodology, start_date, end_date, manager_id, created_at, custom_fields, task_seq, version, updated_at, is_deleted, deleted_at, process_config, status, process_template_id) FROM stdin;
2	MOB	E-Ticaret Mobil App	Müşteriler için iOS ve Android tabanlı mobil alışveriş uygulaması.	KANBAN	2026-03-30	2026-07-28	3	2026-04-29 11:02:01.374639+00	\N	0	1	2026-04-29 11:02:01.374639+00	f	\N	{"workflow": {"mode": "continuous", "edges": [], "nodes": [{"x": 400, "y": 120, "id": "nd_kbflow0001", "name": "Sürekli Akış", "color": "status-progress", "is_final": true, "is_initial": true, "description": "Tek aktif faz"}], "groups": []}, "schema_version": 1}	ACTIVE	2
3	DATA	Veri Ambarı Göçü	Eski Oracle veritabanından PostgreSQL sistemine veri taşıma ve temizleme projesi.	WATERFALL	2026-03-30	2026-07-28	2	2026-04-29 11:02:01.374639+00	\N	0	1	2026-04-29 11:02:01.374639+00	f	\N	{"workflow": {"mode": "sequential-locked", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "nd_wfreq00001", "target": "nd_wfdes00002", "is_all_gate": false, "bidirectional": false}, {"id": "e2", "type": "flow", "label": null, "source": "nd_wfdes00002", "target": "nd_wfimp00003", "is_all_gate": false, "bidirectional": false}, {"id": "e3", "type": "flow", "label": null, "source": "nd_wfimp00003", "target": "nd_wftst00004", "is_all_gate": false, "bidirectional": false}, {"id": "e4", "type": "flow", "label": null, "source": "nd_wftst00004", "target": "nd_wfdep00005", "is_all_gate": false, "bidirectional": false}, {"id": "e5", "type": "flow", "label": null, "source": "nd_wfdep00005", "target": "nd_wfmnt00006", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_wfreq00001", "name": "Gereksinimler", "color": "status-todo", "is_initial": true, "description": "Kapsam ve dokümantasyon"}, {"x": 280, "y": 120, "id": "nd_wfdes00002", "name": "Tasarım", "color": "status-progress", "description": "Mimari ve UI"}, {"x": 500, "y": 120, "id": "nd_wfimp00003", "name": "Uygulama", "color": "status-progress", "description": "Geliştirme"}, {"x": 720, "y": 120, "id": "nd_wftst00004", "name": "Test", "color": "status-review", "description": "QA ve UAT"}, {"x": 940, "y": 120, "id": "nd_wfdep00005", "name": "Yayın", "color": "status-done", "description": "Dağıtım"}, {"x": 1160, "y": 120, "id": "nd_wfmnt00006", "name": "Bakım", "color": "status-done", "is_final": true, "description": "Destek"}], "groups": []}, "schema_version": 1}	COMPLETED	3
4	AI	Yapay Zeka Modülü	Proje tahminlemeleri için makine öğrenmesi modülünün entegrasyonu.	SCRUM	2026-03-30	2026-07-28	3	2026-04-29 11:02:01.374639+00	\N	0	1	2026-04-29 11:02:01.374639+00	f	\N	{"workflow": {"mode": "flexible", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "nd_scinit0001", "target": "nd_scplan0002", "is_all_gate": false, "bidirectional": false}, {"id": "e2", "type": "flow", "label": null, "source": "nd_scplan0002", "target": "nd_scexec0003", "is_all_gate": false, "bidirectional": false}, {"id": "e3", "type": "flow", "label": null, "source": "nd_scexec0003", "target": "nd_scmoni0004", "is_all_gate": false, "bidirectional": false}, {"id": "e4", "type": "feedback", "label": "Retro", "source": "nd_scmoni0004", "target": "nd_scexec0003", "is_all_gate": false, "bidirectional": false}, {"id": "e5", "type": "flow", "label": null, "source": "nd_scmoni0004", "target": "nd_sccls00005", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_scinit0001", "name": "Başlatma", "color": "status-todo", "is_initial": true, "description": "Vizyon ve hedefler"}, {"x": 280, "y": 120, "id": "nd_scplan0002", "name": "Planlama", "color": "status-todo", "description": "Backlog ve sprint planning"}, {"x": 500, "y": 120, "id": "nd_scexec0003", "name": "Yürütme", "color": "status-progress", "description": "Sprint'ler"}, {"x": 720, "y": 120, "id": "nd_scmoni0004", "name": "İzleme", "color": "status-review", "description": "Metrikler ve retro"}, {"x": 940, "y": 120, "id": "nd_sccls00005", "name": "Kapanış", "color": "status-done", "is_final": true, "description": "Teslim ve ders"}], "groups": []}, "schema_version": 1}	ON_HOLD	1
5	FIN	Fintech Ödeme Altyapısı	Bankacılık API entegrasyonu, 3D Secure ödeme akışları ve anlık para transferi modüllerinin geliştirilmesi. PCI-DSS uyumluluğu zorunludur.	SCRUM	2026-04-07	2026-06-29	9	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "flexible", "edges": [], "nodes": [{"id": "plan", "label": "Sprint Planning", "order": 0}, {"id": "develop", "label": "Development", "order": 1}, {"id": "review", "label": "Sprint Review", "order": 2}, {"id": "retro", "label": "Retrospective", "order": 3}], "groups": []}, "schema_version": 1}	ACTIVE	1
6	EGOV	E-Devlet Entegrasyon Portalı	Devlet kurumları ile veri alışverişi için REST ve SOAP servis entegrasyonları. Resmi dokümantasyon ve onay süreçleri zorunludur.	WATERFALL	2026-03-23	2026-10-04	10	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "req", "target": "design", "is_all_gate": false, "bidirectional": false}, {"id": "e2", "type": "flow", "label": null, "source": "design", "target": "impl", "is_all_gate": false, "bidirectional": false}, {"id": "e3", "type": "flow", "label": null, "source": "impl", "target": "test", "is_all_gate": false, "bidirectional": false}, {"id": "e4", "type": "flow", "label": null, "source": "test", "target": "maint", "is_all_gate": false, "bidirectional": false}], "nodes": [{"id": "req", "label": "Gereksinim", "order": 0}, {"id": "design", "label": "Tasarım", "order": 1}, {"id": "impl", "label": "Uygulama", "order": 2}, {"id": "test", "label": "Test", "order": 3}, {"id": "maint", "label": "Bakım", "order": 4}], "groups": []}, "schema_version": 1}	ACTIVE	3
7	LOG	Lojistik Takip Sistemi	Araç takibi, rota optimizasyonu ve teslimat bildirimleri için gerçek zamanlı lojistik platformu. Harita API ve WebSocket entegrasyonu içerir.	KANBAN	2026-04-07	2026-07-21	11	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "continuous", "edges": [], "nodes": [{"id": "todo", "label": "Yapılacak", "order": 0}, {"id": "doing", "label": "Devam Ediyor", "order": 1}, {"id": "done", "label": "Bitti", "order": 2}], "groups": []}, "schema_version": 1}	ACTIVE	2
1	SPMS	SPMS Geliştirme	Yazılım Proje Yönetim Sistemi'nin backend ve frontend geliştirmeleri.	SCRUM	2026-03-30	2026-07-28	2	2026-04-29 11:02:01.374639+00	\N	0	9	2026-05-17 21:41:33.18742+00	f	\N	{"task_workflow": {"edges": [{"id": "ed_aaagonsw96", "type": "flow", "label": null, "source": "col_1", "target": "col_2", "is_all_gate": false, "bidirectional": false, "source_handle": "right-source", "target_handle": "left-target"}, {"id": "ed_aaaiaieh33", "type": "flow", "label": null, "source": "col_2", "target": "col_3", "is_all_gate": false, "bidirectional": false, "source_handle": "right-source", "target_handle": "left-target"}, {"id": "ed_aaanqpvcao", "type": "flow", "label": null, "source": "col_3", "target": "col_4", "is_all_gate": false, "bidirectional": false, "source_handle": "right-source", "target_handle": "left-target"}, {"id": "ed_aaaq2p211z", "type": "flow", "label": null, "source": "col_4", "target": "col_5", "is_all_gate": false, "bidirectional": false, "source_handle": "right-source", "target_handle": "left-target"}], "nodes": [{"x": 60, "y": 120, "id": "col_1", "name": "Backlog", "color": "status-todo", "is_final": false, "wip_limit": null, "is_initial": true, "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 260, "y": 120, "id": "col_2", "name": "To Do", "color": "status-progress", "is_final": false, "parent_id": "gr_aablj7j0n0", "wip_limit": null, "is_initial": false, "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 460, "y": 120, "id": "col_3", "name": "In Progress", "color": "status-progress", "is_final": false, "wip_limit": null, "is_initial": false, "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 660, "y": 120, "id": "col_4", "name": "Code Review", "color": "status-progress", "is_final": false, "wip_limit": null, "is_initial": false, "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 860, "y": 120, "id": "col_5", "name": "Done", "color": "status-done", "is_final": true, "wip_limit": null, "is_initial": false, "is_archived": false, "is_terminal": false, "max_duration_days": null}], "groups": [{"id": "gr_aablj7j0n0", "name": "Yeni Grup", "color": "primary", "children": ["col_2"]}], "capabilities": {"has_recurring": true, "initial_node_id": null, "enforce_wip_limits": false}}, "phase_workflow": {"mode": "flexible", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "nd_vmreq00001", "target": "nd_vmsys00002", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "e2", "type": "flow", "label": null, "source": "nd_vmsys00002", "target": "nd_vmmod00003", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "e3", "type": "flow", "label": null, "source": "nd_vmmod00003", "target": "nd_vmcod00004", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "e4", "type": "flow", "label": null, "source": "nd_vmcod00004", "target": "nd_vmunt00005", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "e5", "type": "flow", "label": null, "source": "nd_vmunt00005", "target": "nd_vmint00006", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "e6", "type": "flow", "label": null, "source": "nd_vmint00006", "target": "nd_vmsts00007", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "ev1", "type": "verification", "label": "Doğrula", "source": "nd_vmmod00003", "target": "nd_vmunt00005", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "ev2", "type": "verification", "label": "Doğrula", "source": "nd_vmsys00002", "target": "nd_vmint00006", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}, {"id": "ev3", "type": "verification", "label": "Doğrula", "source": "nd_vmreq00001", "target": "nd_vmsts00007", "is_all_gate": false, "bidirectional": false, "source_handle": null, "target_handle": null}], "nodes": [{"x": -10.623231797570774, "y": 20.764871223571788, "id": "nd_vmreq00001", "name": "Gereksinimler", "color": "status-todo", "is_final": false, "wip_limit": null, "is_initial": true, "description": "Sistem gereksinimleri", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 164.5278533106913, "y": 179.01322395516559, "id": "nd_vmsys00002", "name": "Sistem Tasarımı", "color": "status-todo", "is_final": false, "wip_limit": null, "is_initial": false, "description": "Yüksek seviye tasarım", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 318.7535364048585, "y": 313.72049942090246, "id": "nd_vmmod00003", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "wip_limit": null, "is_initial": false, "description": "Detaylı tasarım", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 514.9291802869997, "y": 427.94618251506955, "id": "nd_vmcod00004", "name": "Kodlama", "color": "status-progress", "is_final": false, "wip_limit": null, "is_initial": false, "description": "Geliştirme", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 711.1048241691407, "y": 314.60811870595296, "id": "nd_vmunt00005", "name": "Birim Testi", "color": "status-review", "is_final": false, "wip_limit": null, "is_initial": false, "description": "Unit test", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 920.458001069875, "y": 179.90084324021612, "id": "nd_vmint00006", "name": "Entegrasyon Testi", "color": "status-review", "is_final": false, "wip_limit": null, "is_initial": false, "description": "Integration test", "is_archived": false, "is_terminal": false, "max_duration_days": null}, {"x": 1097.115237323586, "y": 25.576003386265093, "id": "nd_vmsts00007", "name": "Sistem Testi", "color": "status-done", "is_final": true, "wip_limit": null, "is_initial": false, "description": "System test", "is_archived": false, "is_terminal": false, "max_duration_days": null}], "groups": [], "capabilities": {}}, "schema_version": 2}	ACTIVE	1
8	HIS	Sağlık Bilgi Sistemi	Hasta kayıtları, randevu yönetimi ve klinik karar destek sistemi. HL7 FHIR standardına uygunluk ve KVKK gereksinimi kritik öneme sahiptir.	WATERFALL	2026-03-27	2026-10-25	12	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential-locked", "edges": [{"id": "e_vm01", "type": "flow", "label": null, "source": "nd_vmreqs0001", "target": "nd_vmsdes0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm02", "type": "flow", "label": null, "source": "nd_vmsdes0002", "target": "nd_vmarch0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm03", "type": "flow", "label": null, "source": "nd_vmarch0003", "target": "nd_vmmodd0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm04", "type": "flow", "label": null, "source": "nd_vmmodd0004", "target": "nd_vmcode0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm05", "type": "flow", "label": null, "source": "nd_vmcode0005", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm06", "type": "flow", "label": null, "source": "nd_vmunit0006", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm07", "type": "flow", "label": null, "source": "nd_vmintg0007", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm08", "type": "flow", "label": null, "source": "nd_vmsyst0008", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm09", "type": "verification", "label": "Gereksinim ↔ Kabul", "source": "nd_vmreqs0001", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm10", "type": "verification", "label": "Sistem ↔ Sistem Testi", "source": "nd_vmsdes0002", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm11", "type": "verification", "label": "Mimari ↔ Entegrasyon", "source": "nd_vmarch0003", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm12", "type": "verification", "label": "Modül ↔ Birim Testi", "source": "nd_vmmodd0004", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": true}], "nodes": [{"x": 60, "y": 60, "id": "nd_vmreqs0001", "name": "Gereksinim Analizi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Paydaş gereksinimleri toplanır, SRS belgesi hazırlanır, izlenebilirlik matrisi oluşturulur."}, {"x": 220, "y": 190, "id": "nd_vmsdes0002", "name": "Sistem Tasarımı", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Yüksek düzey sistem mimarisi, donanım/yazılım bölümlemesi ve arayüz gereksinimleri tanımlanır."}, {"x": 380, "y": 320, "id": "nd_vmarch0003", "name": "Mimari Tasarım", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Alt sistem mimarisi, modüller arası arayüzler ve veri akışı diyagramları oluşturulur."}, {"x": 540, "y": 450, "id": "nd_vmmodd0004", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Her modülün iç mantığı, algoritmaları ve veri yapıları ayrıntılı olarak tasarlanır."}, {"x": 700, "y": 530, "id": "nd_vmcode0005", "name": "Kodlama / Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Tasarıma uygun kaynak kodu yazılır; kod incelemesi ve statik analiz uygulanır."}, {"x": 860, "y": 450, "id": "nd_vmunit0006", "name": "Birim Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Her modül bağımsız olarak test edilir. Modül Tasarımı dokümanı test kriterleri kaynağıdır."}, {"x": 1020, "y": 320, "id": "nd_vmintg0007", "name": "Entegrasyon Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Modüller birleştirilerek arayüz ve iletişim testleri yapılır. Mimari Tasarım baz alınır."}, {"x": 1180, "y": 190, "id": "nd_vmsyst0008", "name": "Sistem Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Tüm sistem bütünlüğü, performans, güvenlik ve yük testleri gerçekleştirilir."}, {"x": 1340, "y": 60, "id": "nd_vmacpt0009", "name": "Kabul Testi", "color": "status-done", "is_final": true, "is_initial": false, "description": "Müşteri gereksinimlerine göre son doğrulama yapılır ve proje teslim onayı alınır."}], "groups": [{"id": "gr_vmleft", "name": "Doğrulama Kolu (Geliştirme)", "color": "#3B82F6", "children": ["nd_vmreqs0001", "nd_vmsdes0002", "nd_vmarch0003", "nd_vmmodd0004", "nd_vmcode0005"]}, {"id": "gr_vmright", "name": "Geçerleme Kolu (Test)", "color": "#10B981", "children": ["nd_vmunit0006", "nd_vmintg0007", "nd_vmsyst0008", "nd_vmacpt0009"]}]}, "schema_version": 1}	ACTIVE	4
9	EDU	Online Eğitim Platformu	Video dersler, quiz motoru, ilerleme takibi ve canlı oturum yönetimini kapsayan eğitim platformu. 50.000+ öğrenci hedeflenmektedir.	SCRUM	2026-03-11	2026-08-19	13	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "flexible", "edges": [], "nodes": [{"id": "plan", "label": "Sprint Planning", "order": 0}, {"id": "develop", "label": "Development", "order": 1}, {"id": "review", "label": "Sprint Review", "order": 2}, {"id": "retro", "label": "Retrospective", "order": 3}], "groups": []}, "schema_version": 1}	ACTIVE	1
10	CRM	CRM Müşteri İlişkileri	Satış hunisi yönetimi, otomatik e-posta kampanyaları ve müşteri segmentasyon araçlarını içeren kurumsal CRM sistemi.	KANBAN	2026-03-16	2026-10-07	14	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "continuous", "edges": [], "nodes": [{"id": "todo", "label": "Yapılacak", "order": 0}, {"id": "doing", "label": "Devam Ediyor", "order": 1}, {"id": "done", "label": "Bitti", "order": 2}], "groups": []}, "schema_version": 1}	ACTIVE	2
11	AUTO	Otomotiv Test Otomasyon	Araç yazılımı için HIL (Hardware-in-the-Loop) test senaryoları ve otomatik regresyon test koşum altyapısı. ISO 26262 uyum gereksinimi.	WATERFALL	2026-03-09	2026-07-01	15	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential-flexible", "edges": [{"id": "e_vs01", "type": "flow", "label": null, "source": "nd_vsreqs0001", "target": "nd_vssdes0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs02", "type": "flow", "label": null, "source": "nd_vssdes0002", "target": "nd_vsmodd0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs03", "type": "flow", "label": null, "source": "nd_vsmodd0003", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs04", "type": "flow", "label": null, "source": "nd_vscode0004", "target": "nd_vsunit0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs05", "type": "flow", "label": null, "source": "nd_vsunit0005", "target": "nd_vsintg0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs06", "type": "flow", "label": null, "source": "nd_vsintg0006", "target": "nd_vssyst0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs07", "type": "flow", "label": null, "source": "nd_vssyst0007", "target": "nd_vsacpt0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs08", "type": "feedback", "label": "Hata düzeltme sprinti", "source": "nd_vsunit0005", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs09", "type": "feedback", "label": "Entegrasyon hatası", "source": "nd_vsintg0006", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs10", "type": "feedback", "label": "Sistem regresyonu", "source": "nd_vssyst0007", "target": "nd_vscode0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vs11", "type": "verification", "label": "Gereksinim ↔ Kabul", "source": "nd_vsreqs0001", "target": "nd_vsacpt0008", "is_all_gate": false, "bidirectional": true}, {"id": "e_vs12", "type": "verification", "label": "Tasarım ↔ Sistem Testi", "source": "nd_vssdes0002", "target": "nd_vssyst0007", "is_all_gate": false, "bidirectional": true}, {"id": "e_vs13", "type": "verification", "label": "Modül ↔ Birim Testi", "source": "nd_vsmodd0003", "target": "nd_vsunit0005", "is_all_gate": false, "bidirectional": true}], "nodes": [{"x": 60, "y": 60, "id": "nd_vsreqs0001", "name": "Gereksinim Analizi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "SRS ve izlenebilirlik matrisi. Kabul kriterleri tanımlanır."}, {"x": 220, "y": 190, "id": "nd_vssdes0002", "name": "Sistem & Mimari Tasarım", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Yüksek düzey ve alçak düzey tasarım birleştirilir."}, {"x": 380, "y": 320, "id": "nd_vsmodd0003", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Bileşen bazlı ayrıntılı tasarım ve arayüz sözleşmeleri."}, {"x": 540, "y": 450, "id": "nd_vscode0004", "name": "Kodlama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "TDD ile kod geliştirme; her commit CI pipeline'ını tetikler."}, {"x": 700, "y": 450, "id": "nd_vsunit0005", "name": "Birim Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "1 haftalık sprint: her modül için otomatik birim testleri yazılır ve geçirilir."}, {"x": 860, "y": 320, "id": "nd_vsintg0006", "name": "Entegrasyon Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "2 haftalık sprint: servisler arası uçtan uca senaryolar otomatize edilir."}, {"x": 1020, "y": 190, "id": "nd_vssyst0007", "name": "Sistem Test Sprinti", "color": "status-review", "is_final": false, "is_initial": false, "description": "2 haftalık sprint: performans, güvenlik ve yük testleri gerçekleştirilir."}, {"x": 1180, "y": 60, "id": "nd_vsacpt0008", "name": "Kabul Testi", "color": "status-done", "is_final": true, "is_initial": false, "description": "Müşteri ile birlikte UAT. Tüm gereksinim izleme öğelerinin karşılandığı doğrulanır."}], "groups": [{"id": "gr_vsleft", "name": "Spesifikasyon Kolu", "color": "#3B82F6", "children": ["nd_vsreqs0001", "nd_vssdes0002", "nd_vsmodd0003", "nd_vscode0004"]}, {"id": "gr_vsright", "name": "Scrum Test Sprintleri", "color": "#F59E0B", "children": ["nd_vsunit0005", "nd_vsintg0006", "nd_vssyst0007", "nd_vsacpt0008"]}]}, "schema_version": 1}	ACTIVE	5
1178	DENEN	Deneme	asdasd	SCRUM	2026-05-17	\N	1	2026-05-17 18:19:36.242873+00	null	0	1	2026-05-17 18:19:36.242873+00	f	\N	{"methodology": "SCRUM", "integrations": {}, "task_workflow": {"edges": [], "groups": [], "capabilities": {"has_recurring": true, "initial_node_id": null, "enforce_wip_limits": false}}, "phase_workflow": {"mode": "flexible", "edges": [], "nodes": [], "groups": []}, "schema_version": 2, "sprint_duration_days": 14}	ACTIVE	1
12	TEL	Telekom Fatura Yönetimi	Abonelik bazlı faturalama, toplu fatura işleme ve ödeme uzlaştırma modüllerini kapsayan OSS/BSS sistemi.	WATERFALL	2026-02-28	2026-08-04	16	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential-locked", "edges": [{"id": "e_p2_01", "type": "flow", "label": null, "source": "nd_p2stup0001", "target": "nd_p2init0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_02", "type": "flow", "label": "PID onayı", "source": "nd_p2init0001", "target": "nd_p2dirp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_03", "type": "flow", "label": "Aşama yetki belgesi", "source": "nd_p2dirp0001", "target": "nd_p2ctrl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_04", "type": "flow", "label": "İş paketi atama", "source": "nd_p2ctrl0001", "target": "nd_p2mprd0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_05", "type": "flow", "label": "Ürün teslimi", "source": "nd_p2mprd0001", "target": "nd_p2ctrl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_06", "type": "flow", "label": "Aşama sonu", "source": "nd_p2ctrl0001", "target": "nd_p2msbd0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_07", "type": "flow", "label": "Sonraki aşama onayı", "source": "nd_p2msbd0001", "target": "nd_p2dirp0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_08", "type": "flow", "label": "Son aşama kapanışı", "source": "nd_p2msbd0001", "target": "nd_p2clos0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_p2_09", "type": "flow", "label": "Erken kapanış kararı", "source": "nd_p2dirp0001", "target": "nd_p2clos0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_p2stup0001", "name": "Projeyi Başlat (SU)", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Proje yetkilendirilmesi için zemin hazırlanır: proje özeti, IS/PB atama ve yönetim yaklaşımı."}, {"x": 280, "y": 120, "id": "nd_p2init0001", "name": "Projeyi Başlangıçlandır (IP)", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Proje Belgesi (PID) oluşturulur: iş vakası, risk kaydı, iletişim planı, kalite yönetim yaklaşımı."}, {"x": 500, "y": 60, "id": "nd_p2dirp0001", "name": "Projeyi Yönet (DP)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Proje Kurulu yetkiler, denetler ve kılavuzlar. Her aşama geçişinde Proje Kurulu devrede."}, {"x": 500, "y": 180, "id": "nd_p2ctrl0001", "name": "Aşamayı Kontrol Et (CS)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Proje Yöneticisi iş paketleri atar, ilerlemeyi izler, değişiklikleri değerlendirir."}, {"x": 720, "y": 180, "id": "nd_p2mprd0001", "name": "Ürün Teslimatını Yönet (MP)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Ekip Yöneticisi iş paketini kabul eder, yürütür ve teslim eder. Kalite onayı yapılır."}, {"x": 720, "y": 60, "id": "nd_p2msbd0001", "name": "Aşama Sınırını Yönet (SB)", "color": "status-review", "is_final": false, "is_initial": false, "description": "Mevcut aşama raporu ve sonraki aşama planı hazırlanır; Proje Kurulu onayı istenir."}, {"x": 940, "y": 120, "id": "nd_p2clos0001", "name": "Projeyi Kapat (CP)", "color": "status-done", "is_final": true, "is_initial": false, "description": "Ürünler teslim edilir, iş faydaları doğrulanır, deneyimler kaydedilir, proje onaylanarak kapatılır."}], "groups": [{"id": "gr_p2mgmt", "name": "Yönetim Süreçleri", "color": "#0F172A", "children": ["nd_p2stup0001", "nd_p2init0001", "nd_p2dirp0001", "nd_p2clos0001"]}, {"id": "gr_p2del", "name": "Teslimat Süreçleri", "color": "#1E40AF", "children": ["nd_p2ctrl0001", "nd_p2mprd0001", "nd_p2msbd0001"]}]}, "schema_version": 1}	ON_HOLD	15
13	GAME	Oyun Backend Servisleri	Liderlik tablosu, başarı sistemi, anlık matchmaking ve in-game ekonomi servisleri. 1M+ eşzamanlı kullanıcı hedefli yatay ölçeklenebilir mimari.	SCRUM	2026-03-01	2026-10-13	17	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "flexible", "edges": [{"id": "e_sf01", "type": "flow", "label": null, "source": "nd_safeprt001", "target": "nd_safepip001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf02", "type": "flow", "label": null, "source": "nd_safepip001", "target": "nd_safespr001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf03", "type": "flow", "label": "Sprint sonu demo", "source": "nd_safespr001", "target": "nd_safesdm001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf04", "type": "flow", "label": "IP Sprinti", "source": "nd_safespr001", "target": "nd_safeips001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf05", "type": "flow", "label": "PI kapanışı", "source": "nd_safesdm001", "target": "nd_safeipa001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf06", "type": "flow", "label": null, "source": "nd_safeipa001", "target": "nd_saferel001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf07", "type": "feedback", "label": "Sonraki PI planlaması", "source": "nd_safeipa001", "target": "nd_safepip001", "is_all_gate": false, "bidirectional": false}, {"id": "e_sf08", "type": "flow", "label": null, "source": "nd_safeips001", "target": "nd_safesdm001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 60, "id": "nd_safeprt001", "name": "Portföy Yönetimi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Stratejik temalar ve epikler önceliklendirilir; ART (Agile Release Train) için bütçe tahsisi yapılır."}, {"x": 300, "y": 60, "id": "nd_safepip001", "name": "PI Planlama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "2 günlük yüz yüze PI planlama etkinliği: tüm takımlar hedefleri, riskleri ve bağımlılıkları planlar."}, {"x": 540, "y": 60, "id": "nd_safespr001", "name": "Sprint Yürütme", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Takımlar 2 haftalık sprintlerde çalışır; Scrum of Scrums ile program koordinasyonu."}, {"x": 780, "y": 60, "id": "nd_safesdm001", "name": "Sistem Demo", "color": "status-review", "is_final": false, "is_initial": false, "description": "Her sprint sonunda tüm ART'ın entegre çalışan yazılımı müşteri / iş sahibine gösterilir."}, {"x": 1020, "y": 60, "id": "nd_safeipa001", "name": "Denetle & Uyarla (I&A)", "color": "status-review", "is_final": false, "is_initial": false, "description": "PI kapanışında PI retrospektifi, çözüm demo ve problem çözme çalıştayı yapılır."}, {"x": 1260, "y": 60, "id": "nd_saferel001", "name": "Sürüm Yayını", "color": "status-done", "is_final": true, "is_initial": false, "description": "Demand management onayı ile sürüm canlıya alınır; metrikler portföy katmanına raporlanır."}, {"x": 780, "y": 160, "id": "nd_safeips001", "name": "İnovasyon & Planlama Sprinti", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Son sprint: teknik borç, inovasyon hackathon ve sonraki PI planlaması hazırlığı."}], "groups": [{"id": "gr_sfprt", "name": "Portföy Katmanı", "color": "#7C3AED", "children": ["nd_safeprt001"]}, {"id": "gr_sfprg", "name": "Program Katmanı", "color": "#2563EB", "children": ["nd_safepip001", "nd_safesdm001", "nd_safeipa001", "nd_saferel001", "nd_safeips001"]}, {"id": "gr_sftm", "name": "Takım Katmanı", "color": "#059669", "children": ["nd_safespr001"]}]}, "schema_version": 1}	ACTIVE	11
14	IOT	IoT Sensör İzleme Platformu	Endüstriyel IoT sensörlerinden gelen telemetri verilerinin toplanması, eşik alarm yönetimi ve makine öğrenmesi tabanlı anomali tespiti.	KANBAN	2026-03-10	2026-06-30	18	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "continuous", "edges": [{"id": "e_lc01", "type": "flow", "label": null, "source": "nd_lcddsc0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc02", "type": "flow", "label": null, "source": "nd_lcddvl0001", "target": "nd_lcdtst0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc03", "type": "flow", "label": null, "source": "nd_lcdtst0001", "target": "nd_lcdrls0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc04", "type": "flow", "label": null, "source": "nd_lcdrls0001", "target": "nd_lcdmon0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc05", "type": "flow", "label": null, "source": "nd_lcdmon0001", "target": "nd_lcdfdb0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc06", "type": "feedback", "label": "Öğrenmeden geri keşif", "source": "nd_lcdfdb0001", "target": "nd_lcddsc0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc07", "type": "feedback", "label": "Test başarısız", "source": "nd_lcdtst0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_lc08", "type": "feedback", "label": "Üretim hatası", "source": "nd_lcdmon0001", "target": "nd_lcddvl0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_lcddsc0001", "name": "Keşfet", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Kullanıcı geri bildirimleri, metrikler ve hipotezlerden özellik fikirleri üretilir."}, {"x": 280, "y": 120, "id": "nd_lcddvl0001", "name": "Geliştir", "color": "status-progress", "is_final": false, "is_initial": false, "description": "TDD döngüsü: test yaz → kodu geç → refactor. Küçük, sık commitler. Feature flag arkasında."}, {"x": 500, "y": 120, "id": "nd_lcdtst0001", "name": "Test Et", "color": "status-review", "is_final": false, "is_initial": false, "description": "Otomatize birim + entegrasyon + E2E test paketi. Derleme hattı her commit'te çalışır."}, {"x": 720, "y": 120, "id": "nd_lcdrls0001", "name": "Yayınla", "color": "status-done", "is_final": false, "is_initial": false, "description": "Blue/green veya canary dağıtım. İnsan müdahalesi sıfır — tek komutla CD."}, {"x": 940, "y": 120, "id": "nd_lcdmon0001", "name": "İzle", "color": "status-done", "is_final": false, "is_initial": false, "description": "Hata oranı, gecikme, iş metrikleri (dönüşüm, etkinleşme) gerçek zamanlı izlenir."}, {"x": 700, "y": 240, "id": "nd_lcdfdb0001", "name": "Geri Bildirim & Öğren", "color": "status-progress", "is_final": true, "is_initial": false, "description": "Metrikler ve kullanıcı geri bildirimleri Keşfet fazına aktarılır; deney döngüsü yeniden başlar."}], "groups": []}, "schema_version": 1}	ACTIVE	14
15	BLC	Blockchain Tedarik Zinciri	Ürün provenance takibi, akıllı kontrat tabanlı ödeme tetikleyicileri ve değiştirilemez denetim kayıtları için özel blockchain ağı.	SCRUM	2026-03-23	2026-09-22	19	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "flexible", "edges": [], "nodes": [{"id": "plan", "label": "Sprint Planning", "order": 0}, {"id": "develop", "label": "Development", "order": 1}, {"id": "review", "label": "Sprint Review", "order": 2}, {"id": "retro", "label": "Retrospective", "order": 3}], "groups": []}, "schema_version": 1}	ACTIVE	1
16	ERP	ERP Modül Entegrasyonu	SAP ve Oracle ERP sistemleri arası veri senkronizasyonu, master data yönetimi ve iş akışı otomasyonu entegrasyon projesi.	WATERFALL	2026-03-24	2026-09-21	20	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential", "edges": [{"id": "e1", "type": "flow", "label": null, "source": "req", "target": "design", "is_all_gate": false, "bidirectional": false}, {"id": "e2", "type": "flow", "label": null, "source": "design", "target": "impl", "is_all_gate": false, "bidirectional": false}, {"id": "e3", "type": "flow", "label": null, "source": "impl", "target": "test", "is_all_gate": false, "bidirectional": false}, {"id": "e4", "type": "flow", "label": null, "source": "test", "target": "maint", "is_all_gate": false, "bidirectional": false}], "nodes": [{"id": "req", "label": "Gereksinim", "order": 0}, {"id": "design", "label": "Tasarım", "order": 1}, {"id": "impl", "label": "Uygulama", "order": 2}, {"id": "test", "label": "Test", "order": 3}, {"id": "maint", "label": "Bakım", "order": 4}], "groups": []}, "schema_version": 1}	COMPLETED	3
17	BOT	Chatbot & Konuşma AI	Çok kanallı (web, WhatsApp, Telegram) yapay zeka destekli müşteri hizmetleri chatbotu. NLP motoru ve dialog yönetim sistemi entegrasyonu.	SCRUM	2026-03-17	2026-09-04	9	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential-flexible", "edges": [{"id": "e_rup01", "type": "flow", "label": "LC Hedefi Milestone", "source": "nd_rupinit001", "target": "nd_rupelab001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup02", "type": "flow", "label": "LC Mimari Milestone", "source": "nd_rupelab001", "target": "nd_rupcons001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup03", "type": "flow", "label": "İlk Operasyonel Yetenek", "source": "nd_rupcons001", "target": "nd_ruptran001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup04", "type": "flow", "label": null, "source": "nd_rupelab001", "target": "nd_rupucwf001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup05", "type": "flow", "label": null, "source": "nd_rupucwf001", "target": "nd_rupanlz001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup06", "type": "flow", "label": null, "source": "nd_rupanlz001", "target": "nd_rupimpl001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup07", "type": "flow", "label": null, "source": "nd_rupimpl001", "target": "nd_ruptst0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup08", "type": "flow", "label": null, "source": "nd_ruptst0001", "target": "nd_ruptran001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rup09", "type": "feedback", "label": "Mimari revizyonu", "source": "nd_rupcons001", "target": "nd_rupelab001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_rupinit001", "name": "Başlangıç (Inception)", "color": "status-todo", "is_final": false, "is_initial": true, "description": "İş vakası ve kapsam belirlenir. Paydaş mutabakatı ve fizibilite tamamlanır. Yaşam döngüsü hedefi milestone'u geçilir."}, {"x": 340, "y": 120, "id": "nd_rupelab001", "name": "Hazırlık (Elaboration)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Mimari temel inşa edilir. Yüksek riskli use-case'ler implement edilir. Yaşam döngüsü mimarisi milestone'u."}, {"x": 620, "y": 120, "id": "nd_rupcons001", "name": "İnşaat (Construction)", "color": "status-progress", "is_final": false, "is_initial": false, "description": "İlk operasyonel yetenek milestone'una doğru tüm özellikler iteratif geliştirilir. Test edilebilir beta ürünü ortaya çıkar."}, {"x": 900, "y": 120, "id": "nd_ruptran001", "name": "Geçiş (Transition)", "color": "status-done", "is_final": true, "is_initial": false, "description": "Beta dağıtımı, kullanıcı geri bildirimleri, hata giderme ve son eğitimler. Ürün teslimi milestone'u."}, {"x": 340, "y": 280, "id": "nd_rupucwf001", "name": "Use-Case Modelleme", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Aktörler, use-case'ler ve sistem sınırı tanımlanır; tüm fazlar boyunca rafine edilir."}, {"x": 620, "y": 280, "id": "nd_rupanlz001", "name": "Analiz & Tasarım", "color": "status-progress", "is_final": false, "is_initial": false, "description": "UML sınıf, sıralama ve işbirliği diyagramları; mimari stillerin seçimi."}, {"x": 620, "y": 380, "id": "nd_rupimpl001", "name": "Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Kaynak kodu, bileşen katmanı, birim test ve kod entegrasyonu."}, {"x": 900, "y": 280, "id": "nd_ruptst0001", "name": "Test", "color": "status-review", "is_final": false, "is_initial": false, "description": "Güvenilirlik, işlevsellik ve performans testleri. Hata izleme ve regresyon."}], "groups": [{"id": "gr_rupphase", "name": "Faz Akışı", "color": "#0EA5E9", "children": ["nd_rupinit001", "nd_rupelab001", "nd_rupcons001", "nd_ruptran001"]}, {"id": "gr_rupwf", "name": "Çalışma Akışları", "color": "#6366F1", "children": ["nd_rupucwf001", "nd_rupanlz001", "nd_rupimpl001", "nd_ruptst0001"]}]}, "schema_version": 1}	ACTIVE	7
18	INS	Sigorta Poliçe Platformu	Kasko, konut ve sağlık sigortası poliçe yönetimi, hasar tazminat süreçleri ve aktüeryal hesaplama motoru içeren çekirdek sigorta platformu.	WATERFALL	2026-03-02	2026-08-04	10	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "sequential-locked", "edges": [{"id": "e_vm01", "type": "flow", "label": null, "source": "nd_vmreqs0001", "target": "nd_vmsdes0002", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm02", "type": "flow", "label": null, "source": "nd_vmsdes0002", "target": "nd_vmarch0003", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm03", "type": "flow", "label": null, "source": "nd_vmarch0003", "target": "nd_vmmodd0004", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm04", "type": "flow", "label": null, "source": "nd_vmmodd0004", "target": "nd_vmcode0005", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm05", "type": "flow", "label": null, "source": "nd_vmcode0005", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm06", "type": "flow", "label": null, "source": "nd_vmunit0006", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm07", "type": "flow", "label": null, "source": "nd_vmintg0007", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm08", "type": "flow", "label": null, "source": "nd_vmsyst0008", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": false}, {"id": "e_vm09", "type": "verification", "label": "Gereksinim ↔ Kabul", "source": "nd_vmreqs0001", "target": "nd_vmacpt0009", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm10", "type": "verification", "label": "Sistem ↔ Sistem Testi", "source": "nd_vmsdes0002", "target": "nd_vmsyst0008", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm11", "type": "verification", "label": "Mimari ↔ Entegrasyon", "source": "nd_vmarch0003", "target": "nd_vmintg0007", "is_all_gate": false, "bidirectional": true}, {"id": "e_vm12", "type": "verification", "label": "Modül ↔ Birim Testi", "source": "nd_vmmodd0004", "target": "nd_vmunit0006", "is_all_gate": false, "bidirectional": true}], "nodes": [{"x": 60, "y": 60, "id": "nd_vmreqs0001", "name": "Gereksinim Analizi", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Paydaş gereksinimleri toplanır, SRS belgesi hazırlanır, izlenebilirlik matrisi oluşturulur."}, {"x": 220, "y": 190, "id": "nd_vmsdes0002", "name": "Sistem Tasarımı", "color": "status-todo", "is_final": false, "is_initial": false, "description": "Yüksek düzey sistem mimarisi, donanım/yazılım bölümlemesi ve arayüz gereksinimleri tanımlanır."}, {"x": 380, "y": 320, "id": "nd_vmarch0003", "name": "Mimari Tasarım", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Alt sistem mimarisi, modüller arası arayüzler ve veri akışı diyagramları oluşturulur."}, {"x": 540, "y": 450, "id": "nd_vmmodd0004", "name": "Modül Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Her modülün iç mantığı, algoritmaları ve veri yapıları ayrıntılı olarak tasarlanır."}, {"x": 700, "y": 530, "id": "nd_vmcode0005", "name": "Kodlama / Uygulama", "color": "status-progress", "is_final": false, "is_initial": false, "description": "Tasarıma uygun kaynak kodu yazılır; kod incelemesi ve statik analiz uygulanır."}, {"x": 860, "y": 450, "id": "nd_vmunit0006", "name": "Birim Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Her modül bağımsız olarak test edilir. Modül Tasarımı dokümanı test kriterleri kaynağıdır."}, {"x": 1020, "y": 320, "id": "nd_vmintg0007", "name": "Entegrasyon Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Modüller birleştirilerek arayüz ve iletişim testleri yapılır. Mimari Tasarım baz alınır."}, {"x": 1180, "y": 190, "id": "nd_vmsyst0008", "name": "Sistem Testi", "color": "status-review", "is_final": false, "is_initial": false, "description": "Tüm sistem bütünlüğü, performans, güvenlik ve yük testleri gerçekleştirilir."}, {"x": 1340, "y": 60, "id": "nd_vmacpt0009", "name": "Kabul Testi", "color": "status-done", "is_final": true, "is_initial": false, "description": "Müşteri gereksinimlerine göre son doğrulama yapılır ve proje teslim onayı alınır."}], "groups": [{"id": "gr_vmleft", "name": "Doğrulama Kolu (Geliştirme)", "color": "#3B82F6", "children": ["nd_vmreqs0001", "nd_vmsdes0002", "nd_vmarch0003", "nd_vmmodd0004", "nd_vmcode0005"]}, {"id": "gr_vmright", "name": "Geçerleme Kolu (Test)", "color": "#10B981", "children": ["nd_vmunit0006", "nd_vmintg0007", "nd_vmsyst0008", "nd_vmacpt0009"]}]}, "schema_version": 1}	ACTIVE	4
19	RAD1	Hızlı Prototip Geliştirme	Müşteri odaklı hızlı prototipleme: kullanıcı geri bildirimleri ile iteratif MVP üretimi. Zaman kutusu 4 hafta, değişken kapsam.	SCRUM	2026-04-05	2026-07-17	11	2026-04-29 11:02:04.785991+00	\N	0	1	2026-04-29 11:02:04.785991+00	f	\N	{"workflow": {"mode": "flexible", "edges": [{"id": "e_rd01", "type": "flow", "label": null, "source": "nd_radrpln001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd02", "type": "flow", "label": null, "source": "nd_raduds0001", "target": "nd_radcon0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd03", "type": "flow", "label": null, "source": "nd_radcon0001", "target": "nd_radcut0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd04", "type": "feedback", "label": "Prototip yineleme", "source": "nd_raduds0001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}, {"id": "e_rd05", "type": "feedback", "label": "Kullanıcı revizyonu", "source": "nd_radcon0001", "target": "nd_raduds0001", "is_all_gate": false, "bidirectional": false}], "nodes": [{"x": 60, "y": 120, "id": "nd_radrpln001", "name": "Gereksinim Planlaması", "color": "status-todo", "is_final": false, "is_initial": true, "description": "Yönetim ve kullanıcılar sistem hedefleri, gereksinimleri ve kısıtları üzerinde uzlaşır."}, {"x": 300, "y": 120, "id": "nd_raduds0001", "name": "Kullanıcı Tasarımı", "color": "status-progress", "is_final": false, "is_initial": false, "description": "JAD oturumlarında kullanıcılar veri akışlarını ve süreçleri modeleyerek prototiplere dönüştürür."}, {"x": 540, "y": 120, "id": "nd_radcon0001", "name": "İnşaat", "color": "status-progress", "is_final": false, "is_initial": false, "description": "CASE araçları ve yeniden kullanılabilir bileşenlerle paralel geliştirme yapılır."}, {"x": 780, "y": 120, "id": "nd_radcut0001", "name": "Sisteme Geçiş", "color": "status-done", "is_final": true, "is_initial": false, "description": "Kapsamlı test, kullanıcı eğitimi, veri dönüşümü ve canlıya geçiş yönetimi."}], "groups": []}, "schema_version": 1}	ACTIVE	13
\.


--
-- Data for Name: board_columns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.board_columns (id, project_id, name, order_index, wip_limit, category, is_initial, is_terminal, max_duration_days, entry_policy, exit_policy) FROM stdin;
1	1	Backlog	0	0	todo	t	f	\N	any	any
2	1	To Do	1	0	in_progress	f	f	\N	any	any
3	1	In Progress	2	0	in_progress	f	f	\N	any	any
4	1	Code Review	3	0	in_progress	f	f	\N	any	any
5	1	Done	4	0	done	f	t	\N	any	any
6	2	To Do	0	0	todo	t	f	\N	any	any
7	2	Analiz	1	3	in_progress	f	f	\N	any	any
8	2	Geliştirme	2	4	in_progress	f	f	\N	any	any
9	2	Test	3	2	in_progress	f	f	\N	any	any
10	2	Done	4	0	done	f	t	\N	any	any
11	3	Gereksinim	0	0	todo	t	f	\N	any	any
12	3	Analiz	1	0	in_progress	f	f	\N	any	any
13	3	Tasarım	2	0	in_progress	f	f	\N	any	any
14	3	Uygulama	3	0	in_progress	f	f	\N	any	any
15	3	Test	4	0	in_progress	f	f	\N	any	any
16	3	Bakım	5	0	done	f	t	\N	any	any
17	4	Backlog	0	0	todo	t	f	\N	any	any
18	4	To Do	1	0	in_progress	f	f	\N	any	any
19	4	In Progress	2	0	in_progress	f	f	\N	any	any
20	4	Code Review	3	0	in_progress	f	f	\N	any	any
21	4	Done	4	0	done	f	t	\N	any	any
22	5	Backlog	0	0	todo	t	f	\N	any	any
23	5	To Do	1	0	in_progress	f	f	\N	any	any
24	5	In Progress	2	0	in_progress	f	f	\N	any	any
25	5	Code Review	3	0	in_progress	f	f	\N	any	any
26	5	Done	4	0	done	f	t	\N	any	any
27	6	Gereksinim	0	0	todo	t	f	\N	any	any
28	6	Analiz	1	0	in_progress	f	f	\N	any	any
29	6	Tasarım	2	0	in_progress	f	f	\N	any	any
30	6	Uygulama	3	0	in_progress	f	f	\N	any	any
56	11	Tasarım	2	0	in_progress	f	f	\N	any	any
57	11	Uygulama	3	0	in_progress	f	f	\N	any	any
58	11	Test	4	0	in_progress	f	f	\N	any	any
59	11	Bakım	5	0	done	f	t	\N	any	any
60	12	Gereksinim	0	0	todo	t	f	\N	any	any
61	12	Analiz	1	0	in_progress	f	f	\N	any	any
62	12	Tasarım	2	0	in_progress	f	f	\N	any	any
63	12	Uygulama	3	0	in_progress	f	f	\N	any	any
64	12	Test	4	0	in_progress	f	f	\N	any	any
65	12	Bakım	5	0	done	f	t	\N	any	any
66	13	Backlog	0	0	todo	t	f	\N	any	any
67	13	To Do	1	0	in_progress	f	f	\N	any	any
68	13	In Progress	2	0	in_progress	f	f	\N	any	any
69	13	Code Review	3	0	in_progress	f	f	\N	any	any
70	13	Done	4	0	done	f	t	\N	any	any
71	14	Backlog	0	0	todo	t	f	\N	any	any
72	14	Analiz	1	3	in_progress	f	f	\N	any	any
73	14	Geliştirme	2	4	in_progress	f	f	\N	any	any
74	14	Test	3	2	in_progress	f	f	\N	any	any
75	14	Done	4	0	done	f	t	\N	any	any
76	15	Backlog	0	0	todo	t	f	\N	any	any
77	15	To Do	1	0	in_progress	f	f	\N	any	any
78	15	In Progress	2	0	in_progress	f	f	\N	any	any
79	15	Code Review	3	0	in_progress	f	f	\N	any	any
80	15	Done	4	0	done	f	t	\N	any	any
81	16	Gereksinim	0	0	todo	t	f	\N	any	any
82	16	Analiz	1	0	in_progress	f	f	\N	any	any
83	16	Tasarım	2	0	in_progress	f	f	\N	any	any
84	16	Uygulama	3	0	in_progress	f	f	\N	any	any
85	16	Test	4	0	in_progress	f	f	\N	any	any
86	16	Bakım	5	0	done	f	t	\N	any	any
87	17	Backlog	0	0	todo	t	f	\N	any	any
88	17	To Do	1	0	in_progress	f	f	\N	any	any
89	17	In Progress	2	0	in_progress	f	f	\N	any	any
31	6	Test	4	0	in_progress	f	f	\N	any	any
32	6	Bakım	5	0	done	f	t	\N	any	any
33	7	Backlog	0	0	todo	t	f	\N	any	any
34	7	Analiz	1	3	in_progress	f	f	\N	any	any
35	7	Geliştirme	2	4	in_progress	f	f	\N	any	any
36	7	Test	3	2	in_progress	f	f	\N	any	any
37	7	Done	4	0	done	f	t	\N	any	any
38	8	Gereksinim	0	0	todo	t	f	\N	any	any
39	8	Analiz	1	0	in_progress	f	f	\N	any	any
40	8	Tasarım	2	0	in_progress	f	f	\N	any	any
41	8	Uygulama	3	0	in_progress	f	f	\N	any	any
42	8	Test	4	0	in_progress	f	f	\N	any	any
43	8	Bakım	5	0	done	f	t	\N	any	any
44	9	Backlog	0	0	todo	t	f	\N	any	any
45	9	To Do	1	0	in_progress	f	f	\N	any	any
46	9	In Progress	2	0	in_progress	f	f	\N	any	any
47	9	Code Review	3	0	in_progress	f	f	\N	any	any
48	9	Done	4	0	done	f	t	\N	any	any
49	10	Backlog	0	0	todo	t	f	\N	any	any
50	10	Analiz	1	3	in_progress	f	f	\N	any	any
51	10	Geliştirme	2	4	in_progress	f	f	\N	any	any
52	10	Test	3	2	in_progress	f	f	\N	any	any
53	10	Done	4	0	done	f	t	\N	any	any
54	11	Gereksinim	0	0	todo	t	f	\N	any	any
55	11	Analiz	1	0	in_progress	f	f	\N	any	any
90	17	Code Review	3	0	in_progress	f	f	\N	any	any
91	17	Done	4	0	done	f	t	\N	any	any
92	18	Gereksinim	0	0	todo	t	f	\N	any	any
93	18	Analiz	1	0	in_progress	f	f	\N	any	any
94	18	Tasarım	2	0	in_progress	f	f	\N	any	any
95	18	Uygulama	3	0	in_progress	f	f	\N	any	any
96	18	Test	4	0	in_progress	f	f	\N	any	any
97	18	Bakım	5	0	done	f	t	\N	any	any
98	19	Backlog	0	0	todo	t	f	\N	any	any
99	19	To Do	1	0	in_progress	f	f	\N	any	any
100	19	In Progress	2	0	in_progress	f	f	\N	any	any
101	19	Code Review	3	0	in_progress	f	f	\N	any	any
102	19	Done	4	0	done	f	t	\N	any	any
130	1178	Yapılacak	0	0	todo	f	f	\N	any	any
131	1178	Devam Ediyor	1	0	todo	f	f	\N	any	any
132	1178	Bitti	2	0	todo	f	f	\N	any	any
\.


--
-- Data for Name: sprints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sprints (id, project_id, name, goal, start_date, end_date, is_active, created_at, version, updated_at, is_deleted, deleted_at, status) FROM stdin;
1	1	Sprint 1	Altyapı	2026-04-15	2026-04-29	f	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	PLANNED
3	4	Sprint 1	Altyapı	2026-04-15	2026-04-29	f	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	PLANNED
5	5	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
6	5	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
8	9	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
9	9	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
11	13	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
12	13	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
14	15	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
15	15	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
17	17	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
18	17	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
20	19	Sprint 1	Altyapı ve temel akışlar	2026-04-01	2026-04-15	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
21	19	Sprint 2	Çekirdek özellikler	2026-04-15	2026-04-29	f	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	PLANNED
2	1	Sprint 2	MVP	2026-04-29	2026-05-13	t	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	ACTIVE
4	4	Sprint 2	MVP	2026-04-29	2026-05-13	t	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	ACTIVE
7	5	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
10	9	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
13	13	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
16	15	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
19	17	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
22	19	Sprint 3	Entegrasyon & test	2026-04-29	2026-05-13	t	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	ACTIVE
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, project_id, sprint_id, column_id, assignee_id, reporter_id, title, description, priority, points, is_recurring, parent_task_id, due_date, created_at, updated_at, version, is_deleted, deleted_at, recurrence_interval, recurrence_end_date, recurrence_count, task_key, series_id, phase_id, start_date) FROM stdin;
1	1	1	3	5	2	Kullanıcı Oturum Yönetimi (SPMS)	## Genel Bakış\nSisteme güvenli giriş, kayıt olma, şifre sıfırlama ve JWT token altyapısının kurulmasını kapsar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	13	f	\N	2026-05-29 11:02:03.315016+00	2026-03-20 11:02:03.315027+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
2	1	1	5	2	5	Analiz: Kullanıcı Oturum Yönetimi - Parça 1	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	1	f	1	2026-05-13 11:02:03.335202+00	2026-04-23 11:02:03.335213+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
3	1	1	2	2	5	Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	1	2026-05-14 11:02:03.339457+00	2026-04-06 11:02:03.339461+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
4	1	1	3	7	5	Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	1	2026-04-30 11:02:03.368019+00	2026-04-17 11:02:03.36803+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
5	1	1	2	7	5	Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	1	2026-05-05 11:02:03.383865+00	2026-04-12 11:02:03.383872+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
6	1	1	4	5	5	Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	1	2026-05-12 11:02:03.396039+00	2026-04-07 11:02:03.39605+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
7	1	1	5	3	5	Code Review: Kullanıcı Oturum Yönetimi - Parça 6	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	1	2026-04-28 11:02:03.402646+00	2026-04-24 11:02:03.402654+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
8	1	1	2	5	2	Ödeme Sistemi Entegrasyonu (SPMS)	## Genel Bakış\nStripe ve Iyzico sanal pos entegrasyonlarının yapılması ve güvenli ödeme sayfasının hazırlanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	21	f	\N	2026-05-29 11:02:03.41486+00	2026-03-17 11:02:03.414869+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
9	1	1	1	7	5	Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	8	2026-05-13 11:02:03.426327+00	2026-04-08 11:02:03.426335+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
10	1	1	1	2	5	Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	8	2026-05-13 11:02:03.429264+00	2026-04-07 11:02:03.429273+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
11	1	2	3	3	2	Raporlama Dashboard'u (SPMS)	## Genel Bakış\nYöneticiler için grafiksel raporların sunulduğu, chart.js kullanılan panelin geliştirilmesi.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	34	f	\N	2026-05-29 11:02:03.436013+00	2026-03-17 11:02:03.436022+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
12	1	2	5	7	3	Analiz: Raporlama Dashboard'u - Parça 1	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	11	2026-05-14 11:02:03.44449+00	2026-04-22 11:02:03.444498+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
13	1	2	5	7	3	Tasarım: Raporlama Dashboard'u - Parça 2	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	11	2026-04-29 11:02:03.447357+00	2026-04-24 11:02:03.447361+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
14	1	2	4	2	3	Geliştirme: Raporlama Dashboard'u - Parça 3	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	11	2026-04-28 11:02:03.45547+00	2026-04-17 11:02:03.455475+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
15	1	2	4	2	3	Unit Test: Raporlama Dashboard'u - Parça 4	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	11	2026-05-14 11:02:03.462037+00	2026-04-14 11:02:03.462042+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
16	1	2	5	7	3	Entegrasyon: Raporlama Dashboard'u - Parça 5	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	11	2026-05-14 11:02:03.470495+00	2026-04-17 11:02:03.4705+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
17	1	2	3	5	2	Bildirim Altyapısı (SPMS)	## Genel Bakış\nWebSocket üzerinden gerçek zamanlı bildirimlerin ve e-posta servisinin kurgulanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:03.476551+00	2026-03-24 11:02:03.476555+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
18	1	2	1	3	5	Analiz: Bildirim Altyapısı - Parça 1	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	8	f	17	2026-05-02 11:02:03.483565+00	2026-04-09 11:02:03.483572+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
19	1	2	3	2	5	Tasarım: Bildirim Altyapısı - Parça 2	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	17	2026-05-12 11:02:03.486911+00	2026-04-22 11:02:03.486922+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
20	1	2	5	7	5	Geliştirme: Bildirim Altyapısı - Parça 3	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	17	2026-04-27 11:02:03.493751+00	2026-04-08 11:02:03.493756+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
21	1	2	4	3	5	Unit Test: Bildirim Altyapısı - Parça 4	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	17	2026-05-04 11:02:03.503058+00	2026-04-17 11:02:03.503063+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
22	1	2	2	2	5	Entegrasyon: Bildirim Altyapısı - Parça 5	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	1	f	17	2026-05-02 11:02:03.511331+00	2026-04-08 11:02:03.511337+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
23	1	2	1	2	5	Code Review: Bildirim Altyapısı - Parça 6	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	17	2026-05-05 11:02:03.526003+00	2026-04-16 11:02:03.526015+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
24	1	1	1	2	2	Profil Sayfaları (SPMS)	## Genel Bakış\nKullanıcıların kendi bilgilerini güncelleyebileceği ve avatar yükleyebileceği ekranlar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	13	f	\N	2026-05-29 11:02:03.534605+00	2026-03-24 11:02:03.534615+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
25	1	1	5	3	2	Analiz: Profil Sayfaları - Parça 1	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	3	f	24	2026-05-14 11:02:03.54162+00	2026-04-05 11:02:03.541632+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
26	1	1	2	7	2	Tasarım: Profil Sayfaları - Parça 2	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	8	f	24	2026-05-14 11:02:03.545622+00	2026-04-06 11:02:03.545629+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
27	1	1	1	3	2	Geliştirme: Profil Sayfaları - Parça 3	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	24	2026-05-11 11:02:03.556228+00	2026-04-13 11:02:03.55625+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
28	1	1	5	3	2	Unit Test: Profil Sayfaları - Parça 4	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	8	f	24	2026-05-11 11:02:03.564314+00	2026-04-07 11:02:03.564325+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
29	1	1	3	5	2	Entegrasyon: Profil Sayfaları - Parça 5	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	24	2026-05-11 11:02:03.571173+00	2026-04-04 11:02:03.57118+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
30	1	1	4	5	2	Code Review: Profil Sayfaları - Parça 6	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	24	2026-05-11 11:02:03.582679+00	2026-04-12 11:02:03.582686+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
31	1	2	1	3	2	Arama ve Filtreleme (SPMS)	## Genel Bakış\nProje genelinde detaylı arama (Elasticsearch) ve filtreleme özelliklerinin backend desteği.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	21	f	\N	2026-05-29 11:02:03.59126+00	2026-03-16 11:02:03.591265+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
32	1	2	2	7	3	Analiz: Arama ve Filtreleme - Parça 1	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	1	f	31	2026-05-14 11:02:03.603069+00	2026-04-04 11:02:03.603078+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
33	1	2	2	5	3	Tasarım: Arama ve Filtreleme - Parça 2	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	2	f	31	2026-04-26 11:02:03.606445+00	2026-04-20 11:02:03.60646+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
34	1	2	3	2	3	Geliştirme: Arama ve Filtreleme - Parça 3	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	31	2026-04-24 11:02:03.615462+00	2026-04-24 11:02:03.615479+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
35	1	2	3	2	3	Unit Test: Arama ve Filtreleme - Parça 4	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	1	f	31	2026-04-28 11:02:03.624019+00	2026-04-12 11:02:03.624025+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
36	1	2	4	5	3	Entegrasyon: Arama ve Filtreleme - Parça 5	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	31	2026-04-24 11:02:03.632539+00	2026-04-20 11:02:03.632544+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
37	1	2	5	3	3	Code Review: Arama ve Filtreleme - Parça 6	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	31	2026-05-06 11:02:03.644231+00	2026-04-21 11:02:03.644236+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
38	2	\N	8	7	3	Kullanıcı Oturum Yönetimi (MOB)	## Genel Bakış\nSisteme güvenli giriş, kayıt olma, şifre sıfırlama ve JWT token altyapısının kurulmasını kapsar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	21	f	\N	2026-05-29 11:02:03.672961+00	2026-03-30 11:02:03.672968+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
39	2	\N	7	4	7	Analiz: Kullanıcı Oturum Yönetimi - Parça 1	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	38	2026-04-29 11:02:03.676495+00	2026-04-21 11:02:03.676506+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
40	2	\N	9	4	7	Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	38	2026-05-02 11:02:03.681378+00	2026-04-17 11:02:03.681385+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
41	2	\N	10	3	7	Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	38	2026-05-11 11:02:03.693398+00	2026-04-17 11:02:03.693405+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
42	2	\N	6	3	7	Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	38	2026-05-12 11:02:03.703824+00	2026-04-08 11:02:03.703834+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
43	2	\N	7	7	7	Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	1	f	38	2026-05-01 11:02:03.71464+00	2026-04-11 11:02:03.714651+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
44	2	\N	6	5	7	Code Review: Kullanıcı Oturum Yönetimi - Parça 6	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	38	2026-04-26 11:02:03.727756+00	2026-04-13 11:02:03.727763+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
45	2	\N	6	4	7	Bug Fix: Kullanıcı Oturum Yönetimi - Parça 7	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	38	2026-04-30 11:02:03.73901+00	2026-04-14 11:02:03.739036+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
46	2	\N	7	5	3	Ödeme Sistemi Entegrasyonu (MOB)	## Genel Bakış\nStripe ve Iyzico sanal pos entegrasyonlarının yapılması ve güvenli ödeme sayfasının hazırlanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	13	f	\N	2026-05-29 11:02:03.756626+00	2026-03-28 11:02:03.75664+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
47	2	\N	10	5	5	Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	46	2026-04-29 11:02:03.775569+00	2026-04-04 11:02:03.775588+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
48	2	\N	8	4	5	Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	46	2026-05-09 11:02:03.779803+00	2026-04-13 11:02:03.779807+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
49	2	\N	8	8	5	Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	46	2026-05-13 11:02:03.790312+00	2026-04-16 11:02:03.790316+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
50	2	\N	7	4	5	Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	46	2026-05-11 11:02:03.79966+00	2026-04-20 11:02:03.799667+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
51	2	\N	10	8	5	Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	46	2026-04-25 11:02:03.809182+00	2026-04-23 11:02:03.809187+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
52	2	\N	7	4	5	Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	46	2026-05-07 11:02:03.820028+00	2026-04-06 11:02:03.820033+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
53	2	\N	6	8	5	Bug Fix: Ödeme Sistemi Entegrasyonu - Parça 7	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	46	2026-05-10 11:02:03.828413+00	2026-04-20 11:02:03.828418+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
54	2	\N	8	4	3	Raporlama Dashboard'u (MOB)	## Genel Bakış\nYöneticiler için grafiksel raporların sunulduğu, chart.js kullanılan panelin geliştirilmesi.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	34	f	\N	2026-05-29 11:02:03.835432+00	2026-03-26 11:02:03.835441+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
55	2	\N	7	4	4	Analiz: Raporlama Dashboard'u - Parça 1	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	8	f	54	2026-04-25 11:02:03.844185+00	2026-04-15 11:02:03.844192+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
56	2	\N	6	3	4	Tasarım: Raporlama Dashboard'u - Parça 2	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	54	2026-05-14 11:02:03.847652+00	2026-04-13 11:02:03.847657+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
57	2	\N	7	7	4	Geliştirme: Raporlama Dashboard'u - Parça 3	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	54	2026-05-02 11:02:03.857226+00	2026-04-04 11:02:03.857237+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
58	2	\N	6	3	3	Bildirim Altyapısı (MOB)	## Genel Bakış\nWebSocket üzerinden gerçek zamanlı bildirimlerin ve e-posta servisinin kurgulanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	34	f	\N	2026-05-29 11:02:03.867703+00	2026-03-21 11:02:03.867707+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
59	2	\N	9	8	3	Analiz: Bildirim Altyapısı - Parça 1	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	58	2026-04-29 11:02:03.877279+00	2026-04-09 11:02:03.877286+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
60	2	\N	7	7	3	Tasarım: Bildirim Altyapısı - Parça 2	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	58	2026-04-29 11:02:03.880818+00	2026-04-14 11:02:03.880823+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
61	2	\N	10	8	3	Geliştirme: Bildirim Altyapısı - Parça 3	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	58	2026-05-03 11:02:03.890566+00	2026-04-15 11:02:03.890571+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
62	2	\N	8	5	3	Unit Test: Bildirim Altyapısı - Parça 4	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	58	2026-05-03 11:02:03.897755+00	2026-04-15 11:02:03.89776+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
63	2	\N	9	8	3	Entegrasyon: Bildirim Altyapısı - Parça 5	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	58	2026-05-02 11:02:03.904257+00	2026-04-19 11:02:03.904262+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
64	2	\N	6	7	3	Code Review: Bildirim Altyapısı - Parça 6	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	58	2026-05-07 11:02:03.91461+00	2026-04-14 11:02:03.914616+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
65	2	\N	7	8	3	Bug Fix: Bildirim Altyapısı - Parça 7	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	58	2026-04-27 11:02:03.924305+00	2026-04-11 11:02:03.924318+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
66	2	\N	8	8	3	Profil Sayfaları (MOB)	## Genel Bakış\nKullanıcıların kendi bilgilerini güncelleyebileceği ve avatar yükleyebileceği ekranlar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:03.933186+00	2026-03-17 11:02:03.933191+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
67	2	\N	7	3	8	Analiz: Profil Sayfaları - Parça 1	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	66	2026-05-07 11:02:03.941641+00	2026-04-11 11:02:03.94165+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
68	2	\N	7	4	8	Tasarım: Profil Sayfaları - Parça 2	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	66	2026-04-26 11:02:03.945337+00	2026-04-18 11:02:03.945344+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
69	2	\N	7	3	8	Geliştirme: Profil Sayfaları - Parça 3	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	66	2026-05-02 11:02:03.954789+00	2026-04-21 11:02:03.954794+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
70	2	\N	6	4	8	Unit Test: Profil Sayfaları - Parça 4	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	66	2026-05-06 11:02:03.96119+00	2026-04-09 11:02:03.961194+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
71	2	\N	7	3	8	Entegrasyon: Profil Sayfaları - Parça 5	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	66	2026-04-26 11:02:03.96819+00	2026-04-13 11:02:03.968201+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
72	2	\N	8	4	8	Code Review: Profil Sayfaları - Parça 6	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	66	2026-05-07 11:02:03.974172+00	2026-04-18 11:02:03.974176+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
73	2	\N	8	5	3	Arama ve Filtreleme (MOB)	## Genel Bakış\nProje genelinde detaylı arama (Elasticsearch) ve filtreleme özelliklerinin backend desteği.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:03.982222+00	2026-03-17 11:02:03.982227+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
74	2	\N	10	7	5	Analiz: Arama ve Filtreleme - Parça 1	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	73	2026-04-29 11:02:03.989461+00	2026-04-17 11:02:03.989469+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
75	2	\N	9	7	5	Tasarım: Arama ve Filtreleme - Parça 2	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	73	2026-05-02 11:02:03.992947+00	2026-04-18 11:02:03.992952+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
76	2	\N	10	7	5	Geliştirme: Arama ve Filtreleme - Parça 3	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	73	2026-05-06 11:02:04.000611+00	2026-04-10 11:02:04.000616+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
77	2	\N	8	5	3	Performans Optimizasyonu (MOB)	## Genel Bakış\nVeritabanı sorgularının optimize edilmesi ve Redis önbellekleme mekanizmasının kurulması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	13	f	\N	2026-05-29 11:02:04.008836+00	2026-03-24 11:02:04.008841+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
78	2	\N	8	3	5	Analiz: Performans Optimizasyonu - Parça 1	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	77	2026-05-12 11:02:04.016409+00	2026-04-05 11:02:04.016417+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
79	2	\N	9	7	5	Tasarım: Performans Optimizasyonu - Parça 2	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	1	f	77	2026-05-07 11:02:04.019835+00	2026-04-14 11:02:04.019839+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
80	3	\N	12	4	2	Kullanıcı Oturum Yönetimi (DATA)	## Genel Bakış\nSisteme güvenli giriş, kayıt olma, şifre sıfırlama ve JWT token altyapısının kurulmasını kapsar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:04.067717+00	2026-03-30 11:02:04.067726+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
81	3	\N	16	4	4	Analiz: Kullanıcı Oturum Yönetimi - Parça 1	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	2	f	80	2026-04-30 11:02:04.071065+00	2026-04-20 11:02:04.071077+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
82	3	\N	12	8	4	Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	80	2026-04-28 11:02:04.07591+00	2026-04-22 11:02:04.075917+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
83	3	\N	16	7	4	Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	80	2026-05-02 11:02:04.088111+00	2026-04-06 11:02:04.088122+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
84	3	\N	12	4	4	Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	80	2026-05-07 11:02:04.09646+00	2026-04-14 11:02:04.096465+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
85	3	\N	14	8	4	Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	80	2026-05-12 11:02:04.108235+00	2026-04-04 11:02:04.108241+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
86	3	\N	12	4	4	Code Review: Kullanıcı Oturum Yönetimi - Parça 6	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	80	2026-05-03 11:02:04.11698+00	2026-04-15 11:02:04.116985+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
87	3	\N	13	7	2	Ödeme Sistemi Entegrasyonu (DATA)	## Genel Bakış\nStripe ve Iyzico sanal pos entegrasyonlarının yapılması ve güvenli ödeme sayfasının hazırlanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	13	f	\N	2026-05-29 11:02:04.124563+00	2026-03-23 11:02:04.12457+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
88	3	\N	16	4	7	Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	1	f	87	2026-04-28 11:02:04.132133+00	2026-04-19 11:02:04.13214+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
89	3	\N	13	1	7	Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	8	f	87	2026-05-03 11:02:04.135211+00	2026-04-07 11:02:04.135216+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
90	3	\N	15	1	7	Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	87	2026-05-06 11:02:04.142836+00	2026-04-08 11:02:04.142841+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
91	3	\N	16	3	7	Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	87	2026-05-04 11:02:04.150375+00	2026-04-17 11:02:04.15038+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
92	3	\N	16	8	7	Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	87	2026-05-04 11:02:04.158991+00	2026-04-18 11:02:04.15902+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
93	3	\N	11	8	7	Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	3	f	87	2026-05-14 11:02:04.166698+00	2026-04-24 11:02:04.166702+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
94	3	\N	13	4	2	Raporlama Dashboard'u (DATA)	## Genel Bakış\nYöneticiler için grafiksel raporların sunulduğu, chart.js kullanılan panelin geliştirilmesi.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	21	f	\N	2026-05-29 11:02:04.174655+00	2026-03-20 11:02:04.174665+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
95	3	\N	16	2	4	Analiz: Raporlama Dashboard'u - Parça 1	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	94	2026-04-26 11:02:04.184526+00	2026-04-24 11:02:04.184534+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
96	3	\N	12	7	4	Tasarım: Raporlama Dashboard'u - Parça 2	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	94	2026-04-29 11:02:04.187759+00	2026-04-15 11:02:04.187762+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
97	3	\N	11	4	4	Geliştirme: Raporlama Dashboard'u - Parça 3	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	94	2026-05-03 11:02:04.198678+00	2026-04-04 11:02:04.198683+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
98	3	\N	14	8	4	Unit Test: Raporlama Dashboard'u - Parça 4	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	94	2026-05-08 11:02:04.206139+00	2026-04-20 11:02:04.206149+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
100	3	\N	11	2	1	Analiz: Bildirim Altyapısı - Parça 1	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	1	f	99	2026-05-02 11:02:04.22266+00	2026-04-10 11:02:04.222673+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
101	3	\N	13	1	1	Tasarım: Bildirim Altyapısı - Parça 2	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	99	2026-04-29 11:02:04.226031+00	2026-04-09 11:02:04.22604+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
102	3	\N	13	2	1	Geliştirme: Bildirim Altyapısı - Parça 3	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	5	f	99	2026-05-09 11:02:04.233877+00	2026-04-24 11:02:04.233882+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
103	3	\N	16	1	1	Unit Test: Bildirim Altyapısı - Parça 4	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	5	f	99	2026-05-03 11:02:04.243682+00	2026-04-11 11:02:04.243687+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
104	3	\N	12	3	1	Entegrasyon: Bildirim Altyapısı - Parça 5	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	99	2026-05-13 11:02:04.251333+00	2026-04-19 11:02:04.25134+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
105	3	\N	11	3	1	Code Review: Bildirim Altyapısı - Parça 6	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	99	2026-04-28 11:02:04.261995+00	2026-04-20 11:02:04.261999+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
106	3	\N	14	4	1	Bug Fix: Bildirim Altyapısı - Parça 7	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	99	2026-05-14 11:02:04.270798+00	2026-04-16 11:02:04.270807+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
107	3	\N	11	4	2	Profil Sayfaları (DATA)	## Genel Bakış\nKullanıcıların kendi bilgilerini güncelleyebileceği ve avatar yükleyebileceği ekranlar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	21	f	\N	2026-05-29 11:02:04.282863+00	2026-03-18 11:02:04.282868+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
108	3	\N	15	1	4	Analiz: Profil Sayfaları - Parça 1	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	107	2026-05-12 11:02:04.290357+00	2026-04-17 11:02:04.290367+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
109	3	\N	11	2	4	Tasarım: Profil Sayfaları - Parça 2	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	107	2026-04-29 11:02:04.293884+00	2026-04-19 11:02:04.293888+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
110	3	\N	14	3	4	Geliştirme: Profil Sayfaları - Parça 3	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	107	2026-05-02 11:02:04.303706+00	2026-04-09 11:02:04.303718+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
111	3	\N	12	3	4	Unit Test: Profil Sayfaları - Parça 4	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	8	f	107	2026-04-24 11:02:04.310751+00	2026-04-07 11:02:04.310758+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
112	3	\N	16	4	4	Entegrasyon: Profil Sayfaları - Parça 5	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	107	2026-05-14 11:02:04.321264+00	2026-04-16 11:02:04.321269+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
113	3	\N	13	1	4	Code Review: Profil Sayfaları - Parça 6	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	107	2026-05-02 11:02:04.328559+00	2026-04-15 11:02:04.328564+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
114	3	\N	11	1	4	Bug Fix: Profil Sayfaları - Parça 7	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	107	2026-04-27 11:02:04.338296+00	2026-04-11 11:02:04.338301+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
115	3	\N	13	1	2	Arama ve Filtreleme (DATA)	## Genel Bakış\nProje genelinde detaylı arama (Elasticsearch) ve filtreleme özelliklerinin backend desteği.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	13	f	\N	2026-05-29 11:02:04.346179+00	2026-03-15 11:02:04.346191+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
116	3	\N	15	2	1	Analiz: Arama ve Filtreleme - Parça 1	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	115	2026-05-08 11:02:04.352503+00	2026-04-10 11:02:04.35251+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
117	3	\N	14	7	1	Tasarım: Arama ve Filtreleme - Parça 2	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	115	2026-05-04 11:02:04.355354+00	2026-04-22 11:02:04.355358+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
118	3	\N	15	4	1	Geliştirme: Arama ve Filtreleme - Parça 3	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	3	f	115	2026-05-07 11:02:04.362998+00	2026-04-20 11:02:04.363006+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
119	3	\N	14	3	1	Unit Test: Arama ve Filtreleme - Parça 4	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	8	f	115	2026-05-01 11:02:04.372553+00	2026-04-17 11:02:04.372558+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
120	4	4	18	3	3	Kullanıcı Oturum Yönetimi (AI)	## Genel Bakış\nSisteme güvenli giriş, kayıt olma, şifre sıfırlama ve JWT token altyapısının kurulmasını kapsar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	21	f	\N	2026-05-29 11:02:04.395571+00	2026-03-15 11:02:04.395579+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
121	4	4	19	1	3	Analiz: Kullanıcı Oturum Yönetimi - Parça 1	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	120	2026-04-29 11:02:04.399106+00	2026-04-11 11:02:04.399114+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
122	4	4	20	7	3	Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	120	2026-04-24 11:02:04.402489+00	2026-04-12 11:02:04.402501+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
123	4	4	20	1	3	Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	3	f	120	2026-05-05 11:02:04.410421+00	2026-04-08 11:02:04.410426+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
124	4	4	20	7	3	Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	120	2026-05-04 11:02:04.420842+00	2026-04-06 11:02:04.420847+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
125	4	4	17	6	3	Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	120	2026-05-13 11:02:04.427471+00	2026-04-06 11:02:04.427476+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
126	4	4	18	1	3	Code Review: Kullanıcı Oturum Yönetimi - Parça 6	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	120	2026-04-28 11:02:04.436324+00	2026-04-10 11:02:04.436336+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
127	4	4	19	5	3	Bug Fix: Kullanıcı Oturum Yönetimi - Parça 7	### İş Tanımı\nKullanıcı Oturum Yönetimi kapsamında yapılacak Bug Fix çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	120	2026-05-04 11:02:04.444349+00	2026-04-17 11:02:04.444359+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
128	4	4	19	6	3	Ödeme Sistemi Entegrasyonu (AI)	## Genel Bakış\nStripe ve Iyzico sanal pos entegrasyonlarının yapılması ve güvenli ödeme sayfasının hazırlanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:04.450676+00	2026-03-30 11:02:04.45068+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
129	4	4	17	5	6	Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	128	2026-05-01 11:02:04.457577+00	2026-04-06 11:02:04.457584+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
130	4	4	20	7	6	Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	128	2026-05-07 11:02:04.46024+00	2026-04-08 11:02:04.460251+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
131	4	4	17	1	6	Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	128	2026-05-12 11:02:04.467584+00	2026-04-11 11:02:04.467589+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
132	4	4	21	6	6	Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	2	f	128	2026-05-05 11:02:04.473361+00	2026-04-17 11:02:04.473371+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
133	4	4	21	1	6	Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	2	f	128	2026-05-05 11:02:04.47974+00	2026-04-06 11:02:04.479747+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
134	4	4	20	6	6	Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	### İş Tanımı\nÖdeme Sistemi Entegrasyonu kapsamında yapılacak Code Review çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	1	f	128	2026-05-11 11:02:04.48647+00	2026-04-17 11:02:04.486475+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
135	4	3	17	3	3	Raporlama Dashboard'u (AI)	## Genel Bakış\nYöneticiler için grafiksel raporların sunulduğu, chart.js kullanılan panelin geliştirilmesi.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	34	f	\N	2026-05-29 11:02:04.493858+00	2026-03-28 11:02:04.493863+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
136	4	3	20	3	3	Analiz: Raporlama Dashboard'u - Parça 1	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	2	f	135	2026-05-02 11:02:04.501875+00	2026-04-11 11:02:04.501885+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
137	4	3	18	5	3	Tasarım: Raporlama Dashboard'u - Parça 2	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	135	2026-05-02 11:02:04.505422+00	2026-04-14 11:02:04.505429+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
138	4	3	20	6	3	Geliştirme: Raporlama Dashboard'u - Parça 3	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	135	2026-04-25 11:02:04.514375+00	2026-04-14 11:02:04.51439+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
139	4	3	19	1	3	Unit Test: Raporlama Dashboard'u - Parça 4	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	8	f	135	2026-05-07 11:02:04.520321+00	2026-04-07 11:02:04.520326+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
140	4	3	17	7	3	Entegrasyon: Raporlama Dashboard'u - Parça 5	### İş Tanımı\nRaporlama Dashboard'u kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	135	2026-05-14 11:02:04.527815+00	2026-04-23 11:02:04.52782+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
141	4	4	19	6	3	Bildirim Altyapısı (AI)	## Genel Bakış\nWebSocket üzerinden gerçek zamanlı bildirimlerin ve e-posta servisinin kurgulanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	13	f	\N	2026-05-29 11:02:04.534146+00	2026-03-24 11:02:04.534161+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
142	4	4	19	5	6	Analiz: Bildirim Altyapısı - Parça 1	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	8	f	141	2026-05-10 11:02:04.542037+00	2026-04-09 11:02:04.542044+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
143	4	4	21	7	6	Tasarım: Bildirim Altyapısı - Parça 2	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	141	2026-04-25 11:02:04.545518+00	2026-04-12 11:02:04.545523+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
144	4	4	17	3	6	Geliştirme: Bildirim Altyapısı - Parça 3	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	8	f	141	2026-05-06 11:02:04.552563+00	2026-04-09 11:02:04.552568+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
145	4	4	20	7	6	Unit Test: Bildirim Altyapısı - Parça 4	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	141	2026-04-24 11:02:04.562491+00	2026-04-20 11:02:04.562502+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
146	4	4	19	6	6	Entegrasyon: Bildirim Altyapısı - Parça 5	### İş Tanımı\nBildirim Altyapısı kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	141	2026-05-10 11:02:04.56949+00	2026-04-18 11:02:04.569495+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
147	4	3	19	7	3	Profil Sayfaları (AI)	## Genel Bakış\nKullanıcıların kendi bilgilerini güncelleyebileceği ve avatar yükleyebileceği ekranlar.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	13	f	\N	2026-05-29 11:02:04.577923+00	2026-03-20 11:02:04.577928+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
148	4	3	18	1	7	Analiz: Profil Sayfaları - Parça 1	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	147	2026-04-28 11:02:04.586986+00	2026-04-12 11:02:04.586994+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
149	4	3	17	6	7	Tasarım: Profil Sayfaları - Parça 2	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	8	f	147	2026-05-05 11:02:04.58973+00	2026-04-07 11:02:04.589738+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
150	4	3	19	5	7	Geliştirme: Profil Sayfaları - Parça 3	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	5	f	147	2026-04-29 11:02:04.596844+00	2026-04-11 11:02:04.596853+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
151	4	3	20	7	7	Unit Test: Profil Sayfaları - Parça 4	### İş Tanımı\nProfil Sayfaları kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	8	f	147	2026-05-02 11:02:04.604809+00	2026-04-17 11:02:04.604814+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
152	4	3	18	7	3	Arama ve Filtreleme (AI)	## Genel Bakış\nProje genelinde detaylı arama (Elasticsearch) ve filtreleme özelliklerinin backend desteği.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	13	f	\N	2026-05-29 11:02:04.613246+00	2026-03-23 11:02:04.613254+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
153	4	3	19	3	7	Analiz: Arama ve Filtreleme - Parça 1	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	2	f	152	2026-05-09 11:02:04.619992+00	2026-04-06 11:02:04.620002+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
154	4	3	20	3	7	Tasarım: Arama ve Filtreleme - Parça 2	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	1	f	152	2026-05-01 11:02:04.62342+00	2026-04-24 11:02:04.623425+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
155	4	3	18	3	7	Geliştirme: Arama ve Filtreleme - Parça 3	### İş Tanımı\nArama ve Filtreleme kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	1	f	152	2026-05-02 11:02:04.630685+00	2026-04-19 11:02:04.63069+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
156	4	3	18	1	3	Performans Optimizasyonu (AI)	## Genel Bakış\nVeritabanı sorgularının optimize edilmesi ve Redis önbellekleme mekanizmasının kurulması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	CRITICAL	13	f	\N	2026-05-29 11:02:04.639573+00	2026-03-17 11:02:04.639583+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
157	4	3	17	3	1	Analiz: Performans Optimizasyonu - Parça 1	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Analiz çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	LOW	3	f	156	2026-05-13 11:02:04.647509+00	2026-04-24 11:02:04.647521+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
158	4	3	18	5	1	Tasarım: Performans Optimizasyonu - Parça 2	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Tasarım çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	5	f	156	2026-05-13 11:02:04.651245+00	2026-04-05 11:02:04.651255+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
159	4	3	19	7	1	Geliştirme: Performans Optimizasyonu - Parça 3	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Geliştirme çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	CRITICAL	3	f	156	2026-05-06 11:02:04.658691+00	2026-04-09 11:02:04.658699+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
160	4	3	19	1	1	Unit Test: Performans Optimizasyonu - Parça 4	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Unit Test çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	HIGH	2	f	156	2026-05-13 11:02:04.666978+00	2026-04-09 11:02:04.666983+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
161	4	3	17	1	1	Entegrasyon: Performans Optimizasyonu - Parça 5	### İş Tanımı\nPerformans Optimizasyonu kapsamında yapılacak Entegrasyon çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et	MEDIUM	5	f	156	2026-04-25 11:02:04.673769+00	2026-04-22 11:02:04.673774+00	2026-04-29 11:02:01.374639+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
162	5	6	22	97	9	3D Secure Entegrasyonu [FIN-1]	## Genel Bakış\nVisa ve Mastercard 3D Secure 2.0 protokolü entegrasyonu. OTP doğrulama, challenge akışı ve frictionless akış senaryoları uygulanmalıdır. PCI-DSS A1.2 uyumluluğu zorunludur.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-25 11:02:28.548947+00	2026-03-14 11:02:28.548901+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
163	5	6	24	23	97	Entegrasyon: 3D Secure Entegrasyonu — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** 3D Secure Entegrasyonu [FIN-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	162	2026-05-07 11:02:28.554328+00	2026-04-20 11:02:28.554283+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
164	5	6	26	97	97	Bug Fix: 3D Secure Entegrasyonu — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** 3D Secure Entegrasyonu [FIN-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	162	2026-04-26 11:02:28.562613+00	2026-04-20 11:02:28.562588+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
165	5	6	22	4	97	Tasarım: 3D Secure Entegrasyonu — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** 3D Secure Entegrasyonu [FIN-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	162	2026-04-27 11:02:28.585981+00	2026-04-25 11:02:28.585942+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
166	5	6	26	9	97	Unit Test: 3D Secure Entegrasyonu — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** 3D Secure Entegrasyonu [FIN-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	162	2026-05-06 11:02:28.600691+00	2026-04-13 11:02:28.600662+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
167	5	6	22	23	97	Code Review: 3D Secure Entegrasyonu — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** 3D Secure Entegrasyonu [FIN-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	162	2026-05-09 11:02:28.608473+00	2026-04-17 11:02:28.608449+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
168	5	7	23	97	9	Ödeme Uzlaştırma Modülü [FIN-2]	## Genel Bakış\nGünlük toplu uzlaştırma işlemleri: banka extracto dosyalarının işlenmesi, fark raporlaması ve otomatik çözümleme algoritması.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-25 11:02:28.626954+00	2026-04-03 11:02:28.626932+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
169	5	7	24	4	97	Entegrasyon: Ödeme Uzlaştırma Modülü — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	168	2026-05-05 11:02:28.63854+00	2026-04-15 11:02:28.638511+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
170	5	7	26	23	97	Geliştirme: Ödeme Uzlaştırma Modülü — Adım 2	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	168	2026-05-16 11:02:28.644682+00	2026-04-24 11:02:28.644658+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
171	5	7	26	22	97	QA & Test: Ödeme Uzlaştırma Modülü — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	168	2026-05-02 11:02:28.656823+00	2026-04-20 11:02:28.656756+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
172	5	7	24	9	97	Dağıtım: Ödeme Uzlaştırma Modülü — Adım 4	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	168	2026-05-08 11:02:28.673419+00	2026-04-25 11:02:28.67339+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
173	5	7	24	42	97	Dokümantasyon: Ödeme Uzlaştırma Modülü — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	168	2026-05-04 11:02:28.687892+00	2026-04-15 11:02:28.687871+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
174	5	7	23	4	97	Analiz: Ödeme Uzlaştırma Modülü — Adım 6	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Ödeme Uzlaştırma Modülü [FIN-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	168	2026-05-09 11:02:28.702479+00	2026-04-16 11:02:28.702459+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
175	5	5	24	42	9	Fraud Tespit Motoru [FIN-3]	## Genel Bakış\nKural bazlı ve ML tabanlı hibrit fraud tespiti. Coğrafi anomali, velocity check ve device fingerprint kuralları tanımlanmalı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-27 11:02:28.714859+00	2026-03-24 11:02:28.714836+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
176	5	5	26	21	42	Dokümantasyon: Fraud Tespit Motoru — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	175	2026-04-30 11:02:28.725908+00	2026-04-11 11:02:28.725874+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
177	5	5	26	4	42	Tasarım: Fraud Tespit Motoru — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	175	2026-05-13 11:02:28.731659+00	2026-04-20 11:02:28.731621+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
178	5	5	23	50	42	Dağıtım: Fraud Tespit Motoru — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	175	2026-05-19 11:02:28.746698+00	2026-04-17 11:02:28.746674+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
179	5	5	25	9	42	Bug Fix: Fraud Tespit Motoru — Adım 4	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	175	2026-05-19 11:02:28.758128+00	2026-04-24 11:02:28.758108+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
180	5	5	24	9	42	Entegrasyon: Fraud Tespit Motoru — Adım 5	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	175	2026-04-30 11:02:28.768418+00	2026-04-23 11:02:28.768392+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
181	5	5	25	4	42	Code Review: Fraud Tespit Motoru — Adım 6	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Fraud Tespit Motoru [FIN-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	175	2026-05-12 11:02:28.779017+00	2026-04-13 11:02:28.778993+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
182	5	7	22	97	9	Kart Tokenizasyon Servisi [FIN-4]	## Genel Bakış\nBirincil hesap numaralarının (PAN) kriptografik tokenlarla değiştirilmesi. HSM entegrasyonu ve token yaşam döngüsü yönetimi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-06-08 11:02:28.79431+00	2026-03-12 11:02:28.79429+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
183	5	7	23	97	97	QA & Test: Kart Tokenizasyon Servisi — Adım 1	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Kart Tokenizasyon Servisi [FIN-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	182	2026-05-02 11:02:28.805777+00	2026-04-21 11:02:28.80575+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
184	5	7	25	23	97	Bug Fix: Kart Tokenizasyon Servisi — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Kart Tokenizasyon Servisi [FIN-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	182	2026-05-01 11:02:28.811904+00	2026-04-18 11:02:28.811876+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
185	5	7	24	97	97	Unit Test: Kart Tokenizasyon Servisi — Adım 3	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Kart Tokenizasyon Servisi [FIN-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	182	2026-05-16 11:02:28.81964+00	2026-04-10 11:02:28.819616+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
186	5	7	22	23	97	Geliştirme: Kart Tokenizasyon Servisi — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Kart Tokenizasyon Servisi [FIN-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	182	2026-05-10 11:02:28.834036+00	2026-04-24 11:02:28.834014+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
187	5	6	23	21	9	Ödeme Bildirimleri [FIN-5]	## Genel Bakış\nSMS, e-posta ve push notification kanalları üzerinden gerçek zamanlı işlem bildirimleri. Şablon motoru ve tercih yönetimi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-09 11:02:28.849891+00	2026-04-02 11:02:28.849864+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
188	5	6	25	23	21	QA & Test: Ödeme Bildirimleri — Adım 1	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	187	2026-05-18 11:02:28.858792+00	2026-04-24 11:02:28.85876+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
189	5	6	22	23	21	Unit Test: Ödeme Bildirimleri — Adım 2	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	187	2026-05-05 11:02:28.864048+00	2026-04-16 11:02:28.864025+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
190	5	6	22	22	21	Geliştirme: Ödeme Bildirimleri — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	187	2026-04-30 11:02:28.877502+00	2026-04-10 11:02:28.87746+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
191	5	6	24	97	21	Entegrasyon: Ödeme Bildirimleri — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	187	2026-05-02 11:02:28.888625+00	2026-04-21 11:02:28.888595+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
192	5	6	25	42	21	Dokümantasyon: Ödeme Bildirimleri — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	187	2026-05-12 11:02:28.896535+00	2026-04-12 11:02:28.896514+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
193	5	6	24	23	21	Dağıtım: Ödeme Bildirimleri — Adım 6	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Ödeme Bildirimleri [FIN-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	187	2026-04-29 11:02:28.909875+00	2026-04-13 11:02:28.90985+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
194	5	6	24	4	9	Muhasebe Entegrasyonu [FIN-6]	## Genel Bakış\nÖdeme işlemlerinin ERP muhasebe modülüne otomatik çift taraflı kayıt olarak gönderilmesi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-06 11:02:28.921332+00	2026-04-04 11:02:28.921317+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
195	5	6	25	23	4	Analiz: Muhasebe Entegrasyonu — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Muhasebe Entegrasyonu [FIN-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	194	2026-05-18 11:02:28.932913+00	2026-04-24 11:02:28.932884+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
196	5	6	26	23	4	QA & Test: Muhasebe Entegrasyonu — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Muhasebe Entegrasyonu [FIN-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	194	2026-05-07 11:02:28.949083+00	2026-04-16 11:02:28.94905+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
197	5	6	22	21	4	Geliştirme: Muhasebe Entegrasyonu — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Muhasebe Entegrasyonu [FIN-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	194	2026-05-19 11:02:28.97206+00	2026-04-22 11:02:28.972032+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
198	5	6	23	22	4	Unit Test: Muhasebe Entegrasyonu — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Muhasebe Entegrasyonu [FIN-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	194	2026-05-15 11:02:28.988982+00	2026-04-12 11:02:28.988945+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
199	5	6	24	9	4	Dokümantasyon: Muhasebe Entegrasyonu — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Muhasebe Entegrasyonu [FIN-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	194	2026-04-26 11:02:29.001225+00	2026-04-14 11:02:29.0012+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
200	6	\N	27	22	10	Kimlik Doğrulama Entegrasyonu [EGOV-1]	## Genel Bakış\ne-Devlet Kapısı ile OAuth2/SAML entegrasyonu; T.C. kimlik numarası bazlı tekil kullanıcı tanıma.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-05 11:02:29.039954+00	2026-03-29 11:02:29.039933+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
201	6	\N	30	87	22	Bug Fix: Kimlik Doğrulama Entegrasyonu — Adım 1	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Kimlik Doğrulama Entegrasyonu [EGOV-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	200	2026-05-18 11:02:29.0435+00	2026-04-15 11:02:29.043472+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
202	6	\N	32	46	22	Dağıtım: Kimlik Doğrulama Entegrasyonu — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Kimlik Doğrulama Entegrasyonu [EGOV-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	200	2026-05-09 11:02:29.050246+00	2026-04-20 11:02:29.050221+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
203	6	\N	32	46	22	Tasarım: Kimlik Doğrulama Entegrasyonu — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Kimlik Doğrulama Entegrasyonu [EGOV-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	200	2026-04-28 11:02:29.065334+00	2026-04-13 11:02:29.06531+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
204	6	\N	30	43	22	Analiz: Kimlik Doğrulama Entegrasyonu — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Kimlik Doğrulama Entegrasyonu [EGOV-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	200	2026-05-10 11:02:29.079272+00	2026-04-21 11:02:29.079251+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
205	6	\N	29	73	22	Code Review: Kimlik Doğrulama Entegrasyonu — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Kimlik Doğrulama Entegrasyonu [EGOV-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	200	2026-05-04 11:02:29.093059+00	2026-04-21 11:02:29.093035+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
206	6	\N	28	22	10	Kurum Veri Alışverişi API [EGOV-2]	## Genel Bakış\nSOAP/REST tabanlı veri alışverişi; XML şema validasyonu, mesaj imzalama ve güvenli kanal kurulum dokümantasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-19 11:02:29.107666+00	2026-03-26 11:02:29.107653+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
207	6	\N	27	45	22	Geliştirme: Kurum Veri Alışverişi API — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Kurum Veri Alışverişi API [EGOV-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	206	2026-05-10 11:02:29.121794+00	2026-04-15 11:02:29.121764+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
208	6	\N	32	51	22	Dokümantasyon: Kurum Veri Alışverişi API — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Kurum Veri Alışverişi API [EGOV-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	206	2026-05-19 11:02:29.127387+00	2026-04-19 11:02:29.12736+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
209	6	\N	27	73	22	Code Review: Kurum Veri Alışverişi API — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Kurum Veri Alışverişi API [EGOV-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	206	2026-04-27 11:02:29.137036+00	2026-04-15 11:02:29.137013+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
210	6	\N	30	73	22	Tasarım: Kurum Veri Alışverişi API — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Kurum Veri Alışverişi API [EGOV-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	206	2026-05-17 11:02:29.151664+00	2026-04-16 11:02:29.151642+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
211	6	\N	32	23	22	Bug Fix: Kurum Veri Alışverişi API — Adım 5	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Kurum Veri Alışverişi API [EGOV-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	206	2026-05-06 11:02:29.162871+00	2026-04-10 11:02:29.162844+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
212	6	\N	29	45	10	Dijital İmza Altyapısı [EGOV-3]	## Genel Bakış\ne-İmza ve mobil imza entegrasyonu; zaman damgalama ve arşivleme süreçleri.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-15 11:02:29.178118+00	2026-03-15 11:02:29.178102+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
213	6	\N	28	23	45	Code Review: Dijital İmza Altyapısı — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Dijital İmza Altyapısı [EGOV-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	212	2026-04-28 11:02:29.193992+00	2026-04-24 11:02:29.193964+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
214	6	\N	29	45	45	Analiz: Dijital İmza Altyapısı — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Dijital İmza Altyapısı [EGOV-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	212	2026-05-07 11:02:29.200294+00	2026-04-10 11:02:29.200272+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
215	6	\N	28	43	45	Dağıtım: Dijital İmza Altyapısı — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Dijital İmza Altyapısı [EGOV-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	212	2026-05-18 11:02:29.214694+00	2026-04-14 11:02:29.214673+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
216	6	\N	27	73	10	Resmi Yazışma Modülü [EGOV-4]	## Genel Bakış\nKEP (Kayıtlı Elektronik Posta) entegrasyonu, resmi yazı şablon yönetimi ve EBYS bağlantısı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-19 11:02:29.230028+00	2026-04-01 11:02:29.230014+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
217	6	\N	27	45	73	Bug Fix: Resmi Yazışma Modülü — Adım 1	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Resmi Yazışma Modülü [EGOV-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	216	2026-05-14 11:02:29.243245+00	2026-04-17 11:02:29.243213+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
218	6	\N	30	30	73	Dokümantasyon: Resmi Yazışma Modülü — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Resmi Yazışma Modülü [EGOV-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	216	2026-05-12 11:02:29.249338+00	2026-04-24 11:02:29.249315+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
219	6	\N	32	45	73	Entegrasyon: Resmi Yazışma Modülü — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Resmi Yazışma Modülü [EGOV-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	216	2026-05-13 11:02:29.259623+00	2026-04-10 11:02:29.259594+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
220	6	\N	31	87	73	Geliştirme: Resmi Yazışma Modülü — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Resmi Yazışma Modülü [EGOV-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	216	2026-05-17 11:02:29.275306+00	2026-04-26 11:02:29.275283+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
221	6	\N	28	43	73	Dağıtım: Resmi Yazışma Modülü — Adım 5	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Resmi Yazışma Modülü [EGOV-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	216	2026-05-14 11:02:29.290192+00	2026-04-14 11:02:29.290171+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
222	6	\N	28	45	10	Belge Doğrulama Servisi [EGOV-5]	## Genel Bakış\nQR kodlu resmi belgeler için doğrulama endpoint'i; sahtecilik kontrolü ve log kaydı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-09 11:02:29.303256+00	2026-03-27 11:02:29.303242+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
223	6	\N	27	43	45	Tasarım: Belge Doğrulama Servisi — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	222	2026-05-05 11:02:29.314968+00	2026-04-16 11:02:29.314942+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
224	6	\N	31	43	45	Geliştirme: Belge Doğrulama Servisi — Adım 2	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	222	2026-05-13 11:02:29.319917+00	2026-04-14 11:02:29.319888+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
225	6	\N	31	10	45	Dokümantasyon: Belge Doğrulama Servisi — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	222	2026-05-17 11:02:29.326495+00	2026-04-25 11:02:29.326483+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
226	6	\N	29	22	45	Dağıtım: Belge Doğrulama Servisi — Adım 4	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	222	2026-05-01 11:02:29.335758+00	2026-04-12 11:02:29.335742+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
227	6	\N	30	22	45	Code Review: Belge Doğrulama Servisi — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	222	2026-05-08 11:02:29.342709+00	2026-04-23 11:02:29.342693+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
228	6	\N	32	10	45	Entegrasyon: Belge Doğrulama Servisi — Adım 6	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Belge Doğrulama Servisi [EGOV-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	222	2026-05-12 11:02:29.352116+00	2026-04-19 11:02:29.352103+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
229	7	\N	33	20	11	Kullanıcı Oturum Yönetimi [LOG-1]	## Genel Bakış\nJWT tabanlı kimlik doğrulama, oturum süre uzatma ve rol bazlı yetkilendirme.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-06-10 11:02:29.380733+00	2026-04-09 11:02:29.380714+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
230	7	\N	33	11	20	QA & Test: Kullanıcı Oturum Yönetimi — Adım 1	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Kullanıcı Oturum Yönetimi [LOG-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	229	2026-05-08 11:02:29.383197+00	2026-04-21 11:02:29.383179+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
231	7	\N	35	83	20	Dağıtım: Kullanıcı Oturum Yönetimi — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Kullanıcı Oturum Yönetimi [LOG-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	229	2026-05-07 11:02:29.386911+00	2026-04-23 11:02:29.386894+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
232	7	\N	35	20	20	Code Review: Kullanıcı Oturum Yönetimi — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Kullanıcı Oturum Yönetimi [LOG-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	229	2026-04-28 11:02:29.392361+00	2026-04-13 11:02:29.392347+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
233	7	\N	34	48	11	API Geçidi & Rate Limiting [LOG-2]	## Genel Bakış\nMerkezi API yönetimi, istek sınırlama politikaları ve API key yaşam döngüsü.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-15 11:02:29.402238+00	2026-03-17 11:02:29.40223+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
234	7	\N	36	11	48	Unit Test: API Geçidi & Rate Limiting — Adım 1	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** API Geçidi & Rate Limiting [LOG-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	233	2026-05-11 11:02:29.411904+00	2026-04-12 11:02:29.411882+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
235	7	\N	36	11	48	QA & Test: API Geçidi & Rate Limiting — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** API Geçidi & Rate Limiting [LOG-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	233	2026-05-11 11:02:29.415388+00	2026-04-22 11:02:29.415375+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
236	7	\N	33	5	48	Analiz: API Geçidi & Rate Limiting — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** API Geçidi & Rate Limiting [LOG-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	233	2026-04-29 11:02:29.423677+00	2026-04-26 11:02:29.423664+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
237	7	\N	35	46	11	Bildirim Servisi [LOG-3]	## Genel Bakış\nE-posta, SMS ve in-app bildirim kanalları; tercih yönetimi ve teslimat izleme.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-09 11:02:29.433256+00	2026-04-05 11:02:29.433242+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
238	7	\N	36	11	46	Dağıtım: Bildirim Servisi — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Bildirim Servisi [LOG-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	237	2026-05-02 11:02:29.43812+00	2026-04-21 11:02:29.438094+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
239	7	\N	36	20	46	Geliştirme: Bildirim Servisi — Adım 2	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Bildirim Servisi [LOG-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	237	2026-05-14 11:02:29.442157+00	2026-04-18 11:02:29.442144+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
240	7	\N	35	83	46	QA & Test: Bildirim Servisi — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Bildirim Servisi [LOG-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	237	2026-05-01 11:02:29.451715+00	2026-04-11 11:02:29.4517+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
241	7	\N	35	30	46	Dokümantasyon: Bildirim Servisi — Adım 4	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Bildirim Servisi [LOG-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	237	2026-05-16 11:02:29.459791+00	2026-04-14 11:02:29.45977+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
242	7	\N	33	55	11	Arama & Filtreleme [LOG-4]	## Genel Bakış\nElasticsearch tabanlı tam metin arama, faceted filtreleme ve otomatik tamamlama.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-18 11:02:29.470231+00	2026-04-07 11:02:29.470222+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
243	7	\N	37	5	55	Analiz: Arama & Filtreleme — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Arama & Filtreleme [LOG-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	242	2026-05-18 11:02:29.480071+00	2026-04-26 11:02:29.480053+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
244	7	\N	35	11	55	Dokümantasyon: Arama & Filtreleme — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Arama & Filtreleme [LOG-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	242	2026-05-13 11:02:29.484097+00	2026-04-15 11:02:29.484077+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
245	7	\N	34	63	55	Code Review: Arama & Filtreleme — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Arama & Filtreleme [LOG-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	242	2026-05-15 11:02:29.493667+00	2026-04-20 11:02:29.493653+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
246	7	\N	35	30	55	Tasarım: Arama & Filtreleme — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Arama & Filtreleme [LOG-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	242	2026-05-14 11:02:29.504612+00	2026-04-11 11:02:29.504598+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
247	7	\N	37	20	55	Unit Test: Arama & Filtreleme — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Arama & Filtreleme [LOG-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	242	2026-04-28 11:02:29.514626+00	2026-04-19 11:02:29.51461+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
248	7	\N	34	57	11	Raporlama Dashboard'u [LOG-5]	## Genel Bakış\nGrafiksel KPI göstergeleri, excel dışa aktarma ve zamanlanmış rapor gönderimi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-22 11:02:29.523637+00	2026-03-16 11:02:29.523628+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
249	7	\N	36	48	57	Tasarım: Raporlama Dashboard'u — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Raporlama Dashboard'u [LOG-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	248	2026-05-01 11:02:29.532029+00	2026-04-14 11:02:29.532012+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
250	7	\N	36	57	57	QA & Test: Raporlama Dashboard'u — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Raporlama Dashboard'u [LOG-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	248	2026-05-09 11:02:29.535272+00	2026-04-16 11:02:29.535261+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
251	7	\N	37	48	57	Geliştirme: Raporlama Dashboard'u — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Raporlama Dashboard'u [LOG-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	248	2026-05-04 11:02:29.544845+00	2026-04-13 11:02:29.544831+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
252	7	\N	37	59	57	Unit Test: Raporlama Dashboard'u — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Raporlama Dashboard'u [LOG-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	248	2026-05-10 11:02:29.554336+00	2026-04-24 11:02:29.554323+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
253	7	\N	33	30	57	Dokümantasyon: Raporlama Dashboard'u — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Raporlama Dashboard'u [LOG-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	248	2026-05-16 11:02:29.564268+00	2026-04-19 11:02:29.564251+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
254	7	\N	35	48	11	Performans Optimizasyonu [LOG-6]	## Genel Bakış\nVeritabanı sorgu optimizasyonu, Redis önbellekleme stratejisi ve CDN yapılandırması.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-06 11:02:29.574016+00	2026-04-03 11:02:29.573997+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
255	7	\N	36	59	48	Geliştirme: Performans Optimizasyonu — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	254	2026-04-28 11:02:29.582168+00	2026-04-18 11:02:29.582148+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
256	7	\N	34	20	48	Bug Fix: Performans Optimizasyonu — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	254	2026-04-26 11:02:29.587222+00	2026-04-10 11:02:29.587207+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
257	7	\N	34	63	48	Analiz: Performans Optimizasyonu — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	254	2026-05-06 11:02:29.597014+00	2026-04-15 11:02:29.597+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
258	7	\N	34	11	48	Code Review: Performans Optimizasyonu — Adım 4	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	254	2026-05-02 11:02:29.606648+00	2026-04-22 11:02:29.606632+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
259	7	\N	36	48	48	Tasarım: Performans Optimizasyonu — Adım 5	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	254	2026-05-05 11:02:29.615282+00	2026-04-11 11:02:29.615267+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
260	7	\N	36	57	48	Dokümantasyon: Performans Optimizasyonu — Adım 6	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Performans Optimizasyonu [LOG-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	254	2026-04-26 11:02:29.623239+00	2026-04-19 11:02:29.623225+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
261	8	\N	38	13	12	Hasta Kayıt Yönetimi [HIS-1]	## Genel Bakış\nHL7 FHIR R4 uyumlu hasta demografik veri modeli. Patient, Encounter ve Observation kaynakları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-06-05 11:02:29.644247+00	2026-03-21 11:02:29.644235+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
262	8	\N	38	50	13	Geliştirme: Hasta Kayıt Yönetimi — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Hasta Kayıt Yönetimi [HIS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	261	2026-05-10 11:02:29.646506+00	2026-04-21 11:02:29.646483+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
263	8	\N	42	45	13	QA & Test: Hasta Kayıt Yönetimi — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Hasta Kayıt Yönetimi [HIS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	261	2026-05-01 11:02:29.650454+00	2026-04-16 11:02:29.650421+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
264	8	\N	39	50	13	Dağıtım: Hasta Kayıt Yönetimi — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Hasta Kayıt Yönetimi [HIS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	261	2026-05-14 11:02:29.656108+00	2026-04-22 11:02:29.656094+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
265	8	\N	40	52	13	Analiz: Hasta Kayıt Yönetimi — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Hasta Kayıt Yönetimi [HIS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	261	2026-05-06 11:02:29.665861+00	2026-04-24 11:02:29.665846+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
266	8	\N	41	82	13	Dokümantasyon: Hasta Kayıt Yönetimi — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Hasta Kayıt Yönetimi [HIS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	261	2026-05-04 11:02:29.673459+00	2026-04-18 11:02:29.673446+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
267	8	\N	39	33	12	Klinik Karar Destek Sistemi [HIS-2]	## Genel Bakış\nIlaç etkileşimi kontrolleri, alerji uyarıları ve kılavuz bazlı tedavi önerileri motoru.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-16 11:02:29.682693+00	2026-04-06 11:02:29.682683+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
268	8	\N	39	38	33	Code Review: Klinik Karar Destek Sistemi — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Klinik Karar Destek Sistemi [HIS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	267	2026-05-10 11:02:29.691372+00	2026-04-19 11:02:29.691355+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
269	8	\N	42	37	33	Entegrasyon: Klinik Karar Destek Sistemi — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Klinik Karar Destek Sistemi [HIS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	267	2026-05-15 11:02:29.694716+00	2026-04-10 11:02:29.694706+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
270	8	\N	39	52	33	Dağıtım: Klinik Karar Destek Sistemi — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Klinik Karar Destek Sistemi [HIS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	267	2026-05-13 11:02:29.703345+00	2026-04-23 11:02:29.703321+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
271	8	\N	39	57	33	Unit Test: Klinik Karar Destek Sistemi — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Klinik Karar Destek Sistemi [HIS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	267	2026-05-17 11:02:29.712361+00	2026-04-20 11:02:29.712346+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
272	8	\N	40	57	12	Randevu Takvim Sistemi [HIS-3]	## Genel Bakış\nHekim müsaitlik takibi, kaynak (muayene odası, cihaz) çakışma kontrolü ve otomatik hatırlatmalar.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-18 11:02:29.721708+00	2026-03-20 11:02:29.721699+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
273	8	\N	40	33	57	Dokümantasyon: Randevu Takvim Sistemi — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Randevu Takvim Sistemi [HIS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	272	2026-04-29 11:02:29.731203+00	2026-04-20 11:02:29.731184+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
274	8	\N	43	12	57	Analiz: Randevu Takvim Sistemi — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Randevu Takvim Sistemi [HIS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	272	2026-05-09 11:02:29.734781+00	2026-04-19 11:02:29.734769+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
275	8	\N	43	33	57	Entegrasyon: Randevu Takvim Sistemi — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Randevu Takvim Sistemi [HIS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	272	2026-05-12 11:02:29.744465+00	2026-04-21 11:02:29.744449+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
276	8	\N	38	39	12	Laboratuvar Sonuç Entegrasyonu [HIS-4]	## Genel Bakış\nLIS sisteminden HL7 mesajları ile otomatik sonuç aktarımı ve kritik değer uyarıları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-16 11:02:29.753515+00	2026-04-06 11:02:29.753506+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
277	8	\N	39	50	39	Code Review: Laboratuvar Sonuç Entegrasyonu — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Laboratuvar Sonuç Entegrasyonu [HIS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	276	2026-05-14 11:02:29.762993+00	2026-04-23 11:02:29.762976+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
278	8	\N	42	82	39	Dağıtım: Laboratuvar Sonuç Entegrasyonu — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Laboratuvar Sonuç Entegrasyonu [HIS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	276	2026-04-29 11:02:29.766553+00	2026-04-26 11:02:29.766539+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
279	8	\N	41	38	39	Geliştirme: Laboratuvar Sonuç Entegrasyonu — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Laboratuvar Sonuç Entegrasyonu [HIS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	276	2026-05-08 11:02:29.775295+00	2026-04-20 11:02:29.775282+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
280	8	\N	43	38	39	Entegrasyon: Laboratuvar Sonuç Entegrasyonu — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Laboratuvar Sonuç Entegrasyonu [HIS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	276	2026-05-14 11:02:29.784137+00	2026-04-15 11:02:29.784123+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
281	8	\N	39	39	12	KVKK Uyumluluk Modülü [HIS-5]	## Genel Bakış\nKişisel sağlık verisi erişim logu, rıza yönetimi formu ve veri silme talep akışı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-30 11:02:29.794142+00	2026-03-15 11:02:29.794133+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
282	8	\N	38	38	39	Code Review: KVKK Uyumluluk Modülü — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	281	2026-05-16 11:02:29.80288+00	2026-04-13 11:02:29.802863+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
283	8	\N	38	33	39	Entegrasyon: KVKK Uyumluluk Modülü — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	281	2026-05-18 11:02:29.806129+00	2026-04-14 11:02:29.806111+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
284	8	\N	39	45	39	Dokümantasyon: KVKK Uyumluluk Modülü — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	281	2026-05-05 11:02:29.811256+00	2026-04-15 11:02:29.81124+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
285	8	\N	38	52	39	QA & Test: KVKK Uyumluluk Modülü — Adım 4	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	281	2026-04-27 11:02:29.816798+00	2026-04-19 11:02:29.816778+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
286	8	\N	38	12	39	Analiz: KVKK Uyumluluk Modülü — Adım 5	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	281	2026-05-14 11:02:29.824617+00	2026-04-17 11:02:29.824602+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
287	8	\N	40	82	39	Unit Test: KVKK Uyumluluk Modülü — Adım 6	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** KVKK Uyumluluk Modülü [HIS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	281	2026-04-26 11:02:29.831675+00	2026-04-14 11:02:29.83166+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
288	8	\N	40	13	12	E-Reçete Entegrasyonu [HIS-6]	## Genel Bakış\nSGK ve Türkiye Eczacılar Birliği sistemleriyle e-reçete yaratma ve doğrulama API'si.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-06-01 11:02:29.838791+00	2026-03-17 11:02:29.838782+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
289	8	\N	40	96	13	Dokümantasyon: E-Reçete Entegrasyonu — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	288	2026-05-15 11:02:29.847465+00	2026-04-21 11:02:29.847448+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
290	8	\N	43	82	13	Entegrasyon: E-Reçete Entegrasyonu — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	288	2026-05-15 11:02:29.851088+00	2026-04-14 11:02:29.851074+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
291	8	\N	41	52	13	Bug Fix: E-Reçete Entegrasyonu — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	288	2026-04-28 11:02:29.860386+00	2026-04-18 11:02:29.860373+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
292	8	\N	38	52	13	Tasarım: E-Reçete Entegrasyonu — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	288	2026-05-04 11:02:29.870572+00	2026-04-25 11:02:29.870555+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
293	8	\N	41	39	13	Analiz: E-Reçete Entegrasyonu — Adım 5	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	288	2026-05-08 11:02:29.877578+00	2026-04-15 11:02:29.877558+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
294	8	\N	39	13	13	Geliştirme: E-Reçete Entegrasyonu — Adım 6	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** E-Reçete Entegrasyonu [HIS-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	288	2026-05-16 11:02:29.882035+00	2026-04-19 11:02:29.882024+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
295	9	9	44	61	13	Video Ders Altyapısı [EDU-1]	## Genel Bakış\nHLS akışı, uyarlanabilir kalite (ABR) ve DRM koruması ile video CDN entegrasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-14 11:02:29.909287+00	2026-03-17 11:02:29.909269+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
296	9	9	48	60	61	Unit Test: Video Ders Altyapısı — Adım 1	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Video Ders Altyapısı [EDU-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	295	2026-05-12 11:02:29.911713+00	2026-04-16 11:02:29.911693+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
297	9	9	44	46	61	Code Review: Video Ders Altyapısı — Adım 2	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Video Ders Altyapısı [EDU-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	295	2026-05-14 11:02:29.915922+00	2026-04-12 11:02:29.91591+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
298	9	9	45	6	61	Tasarım: Video Ders Altyapısı — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Video Ders Altyapısı [EDU-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	295	2026-05-06 11:02:29.924673+00	2026-04-10 11:02:29.924651+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
299	9	9	48	46	61	QA & Test: Video Ders Altyapısı — Adım 4	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Video Ders Altyapısı [EDU-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	295	2026-05-02 11:02:29.930939+00	2026-04-15 11:02:29.930925+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
317	9	9	45	60	6	Dağıtım: Canlı Oturum Modülü — Adım 4	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	313	2026-05-03 11:02:30.067273+00	2026-04-16 11:02:30.067259+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
300	9	9	45	13	13	Quiz Motoru [EDU-2]	## Genel Bakış\nÇoktan seçmeli, doğru-yanlış ve serbest yazı soru tipleri; anında geri bildirim ve açıklama sistemi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-17 11:02:29.937649+00	2026-03-12 11:02:29.93764+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
301	9	9	48	46	13	Entegrasyon: Quiz Motoru — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	300	2026-05-07 11:02:29.946426+00	2026-04-12 11:02:29.946405+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
302	9	9	45	35	13	Tasarım: Quiz Motoru — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	300	2026-04-26 11:02:29.949899+00	2026-04-13 11:02:29.949887+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
303	9	9	47	35	13	Analiz: Quiz Motoru — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	300	2026-05-02 11:02:29.95873+00	2026-04-14 11:02:29.958711+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
304	9	9	44	29	13	Code Review: Quiz Motoru — Adım 4	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	300	2026-05-04 11:02:29.965208+00	2026-04-19 11:02:29.965194+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
305	9	9	48	61	13	Unit Test: Quiz Motoru — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	300	2026-04-30 11:02:29.974517+00	2026-04-19 11:02:29.974492+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
306	9	9	46	60	13	Dokümantasyon: Quiz Motoru — Adım 6	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Quiz Motoru [EDU-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	300	2026-05-17 11:02:29.980966+00	2026-04-25 11:02:29.980947+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
307	9	10	46	61	13	İlerleme Takip Sistemi [EDU-3]	## Genel Bakış\nÖğrenci ilerleme analitiği, tamamlama yüzdesi ve öğrenme yolu kişiselleştirme motoru.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-09 11:02:29.990147+00	2026-03-20 11:02:29.990138+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
308	9	10	44	46	61	Geliştirme: İlerleme Takip Sistemi — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** İlerleme Takip Sistemi [EDU-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	307	2026-05-11 11:02:29.99866+00	2026-04-25 11:02:29.998641+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
309	9	10	47	6	61	Entegrasyon: İlerleme Takip Sistemi — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** İlerleme Takip Sistemi [EDU-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	307	2026-05-17 11:02:30.002364+00	2026-04-23 11:02:30.002347+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
310	9	10	48	46	61	QA & Test: İlerleme Takip Sistemi — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** İlerleme Takip Sistemi [EDU-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	307	2026-05-08 11:02:30.008295+00	2026-04-13 11:02:30.008274+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
311	9	10	47	61	61	Analiz: İlerleme Takip Sistemi — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** İlerleme Takip Sistemi [EDU-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	307	2026-05-19 11:02:30.017503+00	2026-04-25 11:02:30.01749+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
312	9	10	48	29	61	Dokümantasyon: İlerleme Takip Sistemi — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** İlerleme Takip Sistemi [EDU-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	307	2026-04-28 11:02:30.027296+00	2026-04-13 11:02:30.027282+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
313	9	9	44	6	13	Canlı Oturum Modülü [EDU-4]	## Genel Bakış\nWebRTC tabanlı canlı sınıf; ekran paylaşımı, el kaldırma ve kayıt fonksiyonları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-30 11:02:30.035955+00	2026-03-15 11:02:30.035941+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
314	9	9	47	29	6	Analiz: Canlı Oturum Modülü — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	313	2026-05-06 11:02:30.045541+00	2026-04-26 11:02:30.045523+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
315	9	9	48	35	6	Unit Test: Canlı Oturum Modülü — Adım 2	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	313	2026-05-19 11:02:30.04884+00	2026-04-16 11:02:30.04883+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
316	9	9	48	6	6	Tasarım: Canlı Oturum Modülü — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	313	2026-04-27 11:02:30.058195+00	2026-04-11 11:02:30.05818+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
318	9	9	46	46	6	Entegrasyon: Canlı Oturum Modülü — Adım 5	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	313	2026-05-18 11:02:30.076467+00	2026-04-25 11:02:30.07645+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
319	9	9	45	60	6	Dokümantasyon: Canlı Oturum Modülü — Adım 6	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Canlı Oturum Modülü [EDU-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	313	2026-05-06 11:02:30.081654+00	2026-04-14 11:02:30.081639+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
320	9	8	45	35	13	Sertifika Üretimi [EDU-5]	## Genel Bakış\nKurs tamamlama üzerine otomatik PDF sertifika oluşturma; QR doğrulama ve blockchain kaydı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-10 11:02:30.088915+00	2026-04-05 11:02:30.088904+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
321	9	8	48	35	35	Code Review: Sertifika Üretimi — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Sertifika Üretimi [EDU-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	320	2026-05-02 11:02:30.09519+00	2026-04-15 11:02:30.095166+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
322	9	8	45	60	35	Tasarım: Sertifika Üretimi — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Sertifika Üretimi [EDU-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	320	2026-04-30 11:02:30.099261+00	2026-04-23 11:02:30.099246+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
323	9	8	44	35	35	Dokümantasyon: Sertifika Üretimi — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Sertifika Üretimi [EDU-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	320	2026-05-04 11:02:30.108096+00	2026-04-11 11:02:30.108081+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
324	9	8	46	6	13	Forumlar & Topluluk [EDU-6]	## Genel Bakış\nKurs bazlı tartışma forumu; moderasyon araçları ve içerik derecelendirme sistemi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-29 11:02:30.115265+00	2026-03-22 11:02:30.115236+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
325	9	8	48	46	6	Dağıtım: Forumlar & Topluluk — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Forumlar & Topluluk [EDU-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	324	2026-05-07 11:02:30.143246+00	2026-04-22 11:02:30.143219+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
326	9	8	44	13	6	Bug Fix: Forumlar & Topluluk — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Forumlar & Topluluk [EDU-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	324	2026-04-29 11:02:30.15061+00	2026-04-23 11:02:30.150589+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
327	9	8	44	6	6	QA & Test: Forumlar & Topluluk — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Forumlar & Topluluk [EDU-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	324	2026-05-06 11:02:30.161406+00	2026-04-10 11:02:30.161389+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
328	9	8	48	60	6	Unit Test: Forumlar & Topluluk — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Forumlar & Topluluk [EDU-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	324	2026-05-03 11:02:30.171887+00	2026-04-12 11:02:30.171868+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
329	10	\N	49	77	14	Satış Hunisi Yönetimi [CRM-1]	## Genel Bakış\nOlası müşteri yakalama formları, fırsat aşaması takibi ve tahmini kapanış tarihi hesaplaması.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-18 11:02:30.196448+00	2026-03-14 11:02:30.196428+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
330	10	\N	52	11	77	Geliştirme: Satış Hunisi Yönetimi — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Satış Hunisi Yönetimi [CRM-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	329	2026-05-04 11:02:30.198749+00	2026-04-13 11:02:30.198732+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
331	10	\N	52	60	77	Bug Fix: Satış Hunisi Yönetimi — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Satış Hunisi Yönetimi [CRM-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	329	2026-04-29 11:02:30.202482+00	2026-04-26 11:02:30.202462+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
332	10	\N	50	11	77	Analiz: Satış Hunisi Yönetimi — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Satış Hunisi Yönetimi [CRM-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	329	2026-05-07 11:02:30.212138+00	2026-04-22 11:02:30.212116+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
333	10	\N	49	30	77	QA & Test: Satış Hunisi Yönetimi — Adım 4	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Satış Hunisi Yönetimi [CRM-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	329	2026-05-04 11:02:30.219998+00	2026-04-21 11:02:30.219983+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
334	10	\N	51	77	77	Unit Test: Satış Hunisi Yönetimi — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Satış Hunisi Yönetimi [CRM-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	329	2026-05-15 11:02:30.228476+00	2026-04-16 11:02:30.22846+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
335	10	\N	50	57	14	E-posta Kampanya Motoru [CRM-2]	## Genel Bakış\nSegmentasyon bazlı kampanya planlama, gönderim sıralama ve açılma/tıklama istatistikleri.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-15 11:02:30.233644+00	2026-04-08 11:02:30.233628+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
336	10	\N	50	30	57	Entegrasyon: E-posta Kampanya Motoru — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** E-posta Kampanya Motoru [CRM-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	335	2026-04-30 11:02:30.241341+00	2026-04-12 11:02:30.241323+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
337	10	\N	50	57	57	Dağıtım: E-posta Kampanya Motoru — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** E-posta Kampanya Motoru [CRM-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	335	2026-05-18 11:02:30.245082+00	2026-04-18 11:02:30.245063+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
338	10	\N	51	62	57	Geliştirme: E-posta Kampanya Motoru — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** E-posta Kampanya Motoru [CRM-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	335	2026-05-04 11:02:30.252516+00	2026-04-11 11:02:30.252502+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
339	10	\N	51	57	14	Müşteri 360° Görünümü [CRM-3]	## Genel Bakış\nTüm etkileşimlerin tek profil sayfasında toplanması; satın alma geçmişi ve NPS skoru.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-26 11:02:30.261177+00	2026-03-22 11:02:30.261168+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
340	10	\N	49	77	57	Entegrasyon: Müşteri 360° Görünümü — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	339	2026-05-18 11:02:30.270136+00	2026-04-20 11:02:30.27012+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
341	10	\N	51	62	57	QA & Test: Müşteri 360° Görünümü — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	339	2026-05-05 11:02:30.273914+00	2026-04-19 11:02:30.273888+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
342	10	\N	50	60	57	Dağıtım: Müşteri 360° Görünümü — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	339	2026-05-15 11:02:30.278395+00	2026-04-23 11:02:30.278382+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
343	10	\N	53	42	57	Geliştirme: Müşteri 360° Görünümü — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	339	2026-04-26 11:02:30.287558+00	2026-04-10 11:02:30.287543+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
344	10	\N	49	30	57	Tasarım: Müşteri 360° Görünümü — Adım 5	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	339	2026-05-14 11:02:30.297126+00	2026-04-11 11:02:30.297112+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
345	10	\N	49	11	57	Analiz: Müşteri 360° Görünümü — Adım 6	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Müşteri 360° Görünümü [CRM-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	339	2026-05-10 11:02:30.307499+00	2026-04-22 11:02:30.307479+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
346	10	\N	49	30	14	Otomatik Görev Atama [CRM-4]	## Genel Bakış\nKural motoru ile yeni taleplerin ilgili satış temsilcisine otomatik yönlendirilmesi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-06-13 11:02:30.312299+00	2026-04-04 11:02:30.312288+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
347	10	\N	49	60	30	Dağıtım: Otomatik Görev Atama — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Otomatik Görev Atama [CRM-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	346	2026-05-16 11:02:30.318986+00	2026-04-19 11:02:30.318968+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
348	10	\N	53	62	30	Tasarım: Otomatik Görev Atama — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Otomatik Görev Atama [CRM-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	346	2026-05-04 11:02:30.32288+00	2026-04-11 11:02:30.322862+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
349	10	\N	49	57	30	Geliştirme: Otomatik Görev Atama — Adım 3	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Otomatik Görev Atama [CRM-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	346	2026-05-09 11:02:30.327495+00	2026-04-12 11:02:30.327482+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
350	10	\N	53	30	30	Unit Test: Otomatik Görev Atama — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Otomatik Görev Atama [CRM-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	346	2026-04-28 11:02:30.337138+00	2026-04-24 11:02:30.337121+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
351	10	\N	49	14	30	Analiz: Otomatik Görev Atama — Adım 5	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Otomatik Görev Atama [CRM-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	346	2026-05-03 11:02:30.341705+00	2026-04-17 11:02:30.341692+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
352	10	\N	50	30	14	Raporlama & BI [CRM-5]	## Genel Bakış\nAylık pipeline değeri, dönüşüm oranı ve ortalama satış döngüsü raporları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-16 11:02:30.351365+00	2026-04-08 11:02:30.351347+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
353	10	\N	52	60	30	Geliştirme: Raporlama & BI — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	352	2026-05-05 11:02:30.356512+00	2026-04-13 11:02:30.356493+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
354	10	\N	53	77	30	Tasarım: Raporlama & BI — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	352	2026-05-01 11:02:30.35977+00	2026-04-19 11:02:30.359757+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
355	10	\N	53	42	30	Unit Test: Raporlama & BI — Adım 3	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	352	2026-05-14 11:02:30.367283+00	2026-04-20 11:02:30.367269+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
356	10	\N	50	60	30	Analiz: Raporlama & BI — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	352	2026-05-19 11:02:30.37582+00	2026-04-22 11:02:30.375804+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
357	10	\N	53	77	30	Code Review: Raporlama & BI — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	352	2026-05-06 11:02:30.385532+00	2026-04-26 11:02:30.385518+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
358	10	\N	51	30	30	Bug Fix: Raporlama & BI — Adım 6	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Raporlama & BI [CRM-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	352	2026-04-29 11:02:30.39451+00	2026-04-24 11:02:30.394497+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
359	11	\N	54	68	15	HIL Test Senaryoları [AUTO-1]	## Genel Bakış\nISO 26262 ASIL-B gereksinimlerine göre yan çarpma, frenleme ve sensör arıza enjeksiyonu test senaryoları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-31 11:02:30.41878+00	2026-03-14 11:02:30.418765+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
360	11	\N	54	1	68	Entegrasyon: HIL Test Senaryoları — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** HIL Test Senaryoları [AUTO-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	359	2026-05-01 11:02:30.420974+00	2026-04-11 11:02:30.420959+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
361	11	\N	59	16	68	Dokümantasyon: HIL Test Senaryoları — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** HIL Test Senaryoları [AUTO-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	359	2026-05-19 11:02:30.424657+00	2026-04-17 11:02:30.42464+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
362	11	\N	57	15	68	Analiz: HIL Test Senaryoları — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** HIL Test Senaryoları [AUTO-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	359	2026-04-30 11:02:30.429385+00	2026-04-18 11:02:30.429372+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
363	11	\N	54	85	68	Dağıtım: HIL Test Senaryoları — Adım 4	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** HIL Test Senaryoları [AUTO-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	359	2026-05-10 11:02:30.439037+00	2026-04-13 11:02:30.439021+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
364	11	\N	55	21	15	Otomatik Regresyon Paketi [AUTO-2]	## Genel Bakış\nHer build'de 500+ otomatik test koşumu; CI/CD pipeline entegrasyonu ve coverage raporu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-30 11:02:30.448792+00	2026-04-03 11:02:30.448772+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
365	11	\N	58	1	21	Tasarım: Otomatik Regresyon Paketi — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Otomatik Regresyon Paketi [AUTO-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	364	2026-04-27 11:02:30.456149+00	2026-04-14 11:02:30.456132+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
366	11	\N	57	1	21	Bug Fix: Otomatik Regresyon Paketi — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Otomatik Regresyon Paketi [AUTO-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	364	2026-04-26 11:02:30.459274+00	2026-04-13 11:02:30.459254+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
367	11	\N	59	1	21	Entegrasyon: Otomatik Regresyon Paketi — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Otomatik Regresyon Paketi [AUTO-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	364	2026-05-09 11:02:30.466288+00	2026-04-25 11:02:30.46627+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
368	11	\N	59	85	21	Unit Test: Otomatik Regresyon Paketi — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Otomatik Regresyon Paketi [AUTO-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	364	2026-05-03 11:02:30.47506+00	2026-04-14 11:02:30.475046+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
369	11	\N	56	67	15	ECU Yazılım Güncelleme Altyapısı [AUTO-3]	## Genel Bakış\nOTA (Over-the-Air) güncelleme mekanizması; dijital imza doğrulama ve geri alma (rollback) prosedürü.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-17 11:02:30.484179+00	2026-03-16 11:02:30.484171+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
370	11	\N	58	67	67	Code Review: ECU Yazılım Güncelleme Altyapısı — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	369	2026-05-03 11:02:30.494595+00	2026-04-18 11:02:30.494578+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
371	11	\N	56	16	67	QA & Test: ECU Yazılım Güncelleme Altyapısı — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	369	2026-05-17 11:02:30.498225+00	2026-04-18 11:02:30.498211+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
372	11	\N	58	16	67	Tasarım: ECU Yazılım Güncelleme Altyapısı — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	369	2026-04-28 11:02:30.505408+00	2026-04-21 11:02:30.505393+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
373	11	\N	55	21	67	Unit Test: ECU Yazılım Güncelleme Altyapısı — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	369	2026-05-14 11:02:30.512575+00	2026-04-16 11:02:30.512562+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
374	11	\N	58	9	67	Dokümantasyon: ECU Yazılım Güncelleme Altyapısı — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	369	2026-05-07 11:02:30.521251+00	2026-04-26 11:02:30.521232+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
375	11	\N	57	21	67	Geliştirme: ECU Yazılım Güncelleme Altyapısı — Adım 6	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** ECU Yazılım Güncelleme Altyapısı [AUTO-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	369	2026-05-12 11:02:30.530317+00	2026-04-15 11:02:30.530302+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
376	11	\N	54	68	15	CAN Bus Protokol Testi [AUTO-4]	## Genel Bakış\nAraç içi CAN mesajlarının parse edilmesi, zamanlama analizi ve hata çerçevesi (error frame) simülasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-21 11:02:30.539037+00	2026-04-01 11:02:30.539028+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
377	11	\N	59	1	68	Dokümantasyon: CAN Bus Protokol Testi — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** CAN Bus Protokol Testi [AUTO-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	376	2026-04-28 11:02:30.547624+00	2026-04-10 11:02:30.547607+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
378	11	\N	59	68	68	Dağıtım: CAN Bus Protokol Testi — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** CAN Bus Protokol Testi [AUTO-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	376	2026-04-29 11:02:30.551292+00	2026-04-21 11:02:30.551273+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
379	11	\N	54	10	68	Code Review: CAN Bus Protokol Testi — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** CAN Bus Protokol Testi [AUTO-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	376	2026-04-29 11:02:30.561926+00	2026-04-20 11:02:30.561909+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
380	11	\N	58	10	68	Bug Fix: CAN Bus Protokol Testi — Adım 4	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** CAN Bus Protokol Testi [AUTO-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	376	2026-04-27 11:02:30.571826+00	2026-04-26 11:02:30.571804+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
381	11	\N	55	21	68	Unit Test: CAN Bus Protokol Testi — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** CAN Bus Protokol Testi [AUTO-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	376	2026-05-18 11:02:30.580907+00	2026-04-24 11:02:30.580876+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
382	11	\N	55	68	15	Fonksiyonel Güvenlik Analizi [AUTO-5]	## Genel Bakış\nFMEA hazırlığı, güvenlik hedefleri tablosu ve HARA (Hazard Analysis and Risk Assessment) dokümanları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-15 11:02:30.595383+00	2026-03-27 11:02:30.595372+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
383	11	\N	54	16	68	Geliştirme: Fonksiyonel Güvenlik Analizi — Adım 1	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	382	2026-05-03 11:02:30.604275+00	2026-04-21 11:02:30.604256+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
384	11	\N	55	9	68	Dağıtım: Fonksiyonel Güvenlik Analizi — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	382	2026-05-14 11:02:30.609485+00	2026-04-25 11:02:30.609462+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
385	11	\N	55	9	68	Entegrasyon: Fonksiyonel Güvenlik Analizi — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	382	2026-05-01 11:02:30.61876+00	2026-04-26 11:02:30.618738+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
386	11	\N	54	67	68	Tasarım: Fonksiyonel Güvenlik Analizi — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	382	2026-05-12 11:02:30.628758+00	2026-04-17 11:02:30.628742+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
387	11	\N	55	85	68	QA & Test: Fonksiyonel Güvenlik Analizi — Adım 5	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	382	2026-05-03 11:02:30.636656+00	2026-04-22 11:02:30.63664+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
388	11	\N	59	15	68	Dokümantasyon: Fonksiyonel Güvenlik Analizi — Adım 6	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Fonksiyonel Güvenlik Analizi [AUTO-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	382	2026-05-11 11:02:30.643627+00	2026-04-23 11:02:30.643612+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
389	12	\N	60	82	16	Abonelik Faturalama Motoru [TEL-1]	## Genel Bakış\nKullanım bazlı (kullanım başına), sabit ve hibrit faturalama planları; promosyon ve iskonto kuralları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-06-01 11:02:30.668581+00	2026-04-05 11:02:30.668565+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
390	12	\N	65	82	82	Analiz: Abonelik Faturalama Motoru — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Abonelik Faturalama Motoru [TEL-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	389	2026-05-08 11:02:30.670953+00	2026-04-18 11:02:30.670936+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
391	12	\N	61	76	82	Geliştirme: Abonelik Faturalama Motoru — Adım 2	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Abonelik Faturalama Motoru [TEL-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	389	2026-05-01 11:02:30.674578+00	2026-04-11 11:02:30.674562+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
392	12	\N	60	32	82	QA & Test: Abonelik Faturalama Motoru — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Abonelik Faturalama Motoru [TEL-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	389	2026-05-01 11:02:30.684999+00	2026-04-23 11:02:30.684985+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
393	12	\N	63	16	82	Dağıtım: Abonelik Faturalama Motoru — Adım 4	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Abonelik Faturalama Motoru [TEL-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	389	2026-05-09 11:02:30.695553+00	2026-04-12 11:02:30.695533+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
394	12	\N	62	47	82	Bug Fix: Abonelik Faturalama Motoru — Adım 5	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Abonelik Faturalama Motoru [TEL-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	389	2026-04-26 11:02:30.70066+00	2026-04-26 11:02:30.700646+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
395	12	\N	61	3	16	Toplu Fatura Üretimi [TEL-2]	## Genel Bakış\nAy sonu toplu işlem: 10M+ abonenin fatura hesabı, PDF üretimi ve dağıtım kuyruğu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-06-12 11:02:30.709286+00	2026-03-18 11:02:30.709276+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
396	12	\N	64	42	3	Bug Fix: Toplu Fatura Üretimi — Adım 1	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Toplu Fatura Üretimi [TEL-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	395	2026-04-29 11:02:30.718405+00	2026-04-15 11:02:30.718387+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
397	12	\N	62	76	3	Tasarım: Toplu Fatura Üretimi — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Toplu Fatura Üretimi [TEL-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	395	2026-05-12 11:02:30.722156+00	2026-04-14 11:02:30.722142+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
398	12	\N	61	25	3	Dağıtım: Toplu Fatura Üretimi — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Toplu Fatura Üretimi [TEL-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	395	2026-05-19 11:02:30.732344+00	2026-04-25 11:02:30.732327+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
399	12	\N	62	47	3	Unit Test: Toplu Fatura Üretimi — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Toplu Fatura Üretimi [TEL-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	395	2026-05-01 11:02:30.739957+00	2026-04-22 11:02:30.739942+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
400	12	\N	63	16	3	Geliştirme: Toplu Fatura Üretimi — Adım 5	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Toplu Fatura Üretimi [TEL-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	395	2026-04-26 11:02:30.752286+00	2026-04-21 11:02:30.752269+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
401	12	\N	62	47	16	Ödeme Uzlaştırma [TEL-3]	## Genel Bakış\nBanka hesap ekstreleri ile gerçekleşen tahsilatların eşleştirilmesi; fark raporlama ve itiraz akışı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-19 11:02:30.760028+00	2026-03-14 11:02:30.760018+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
402	12	\N	65	47	47	Tasarım: Ödeme Uzlaştırma — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Ödeme Uzlaştırma [TEL-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	401	2026-05-07 11:02:30.76768+00	2026-04-18 11:02:30.767663+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
403	12	\N	64	37	47	QA & Test: Ödeme Uzlaştırma — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Ödeme Uzlaştırma [TEL-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	401	2026-04-28 11:02:30.771386+00	2026-04-10 11:02:30.771374+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
404	12	\N	64	37	47	Unit Test: Ödeme Uzlaştırma — Adım 3	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Ödeme Uzlaştırma [TEL-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	401	2026-05-17 11:02:30.781081+00	2026-04-18 11:02:30.781067+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
405	12	\N	60	37	16	OSS/BSS Entegrasyon Katmanı [TEL-4]	## Genel Bakış\nAğ yönetim sistemi (OSS) ile müşteri sistemi (BSS) arası servis katalog senkronizasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-21 11:02:30.790398+00	2026-04-09 11:02:30.790389+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
406	12	\N	64	76	37	Dağıtım: OSS/BSS Entegrasyon Katmanı — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	405	2026-04-30 11:02:30.798437+00	2026-04-16 11:02:30.798421+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
407	12	\N	64	47	37	QA & Test: OSS/BSS Entegrasyon Katmanı — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	405	2026-05-14 11:02:30.802458+00	2026-04-19 11:02:30.802445+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
408	12	\N	61	76	37	Analiz: OSS/BSS Entegrasyon Katmanı — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	405	2026-05-01 11:02:30.811297+00	2026-04-22 11:02:30.811283+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
409	12	\N	60	37	37	Geliştirme: OSS/BSS Entegrasyon Katmanı — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	405	2026-05-04 11:02:30.819721+00	2026-04-11 11:02:30.819703+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
410	12	\N	62	3	37	Unit Test: OSS/BSS Entegrasyon Katmanı — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	405	2026-05-07 11:02:30.828357+00	2026-04-25 11:02:30.82834+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
411	12	\N	64	37	37	Dokümantasyon: OSS/BSS Entegrasyon Katmanı — Adım 6	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** OSS/BSS Entegrasyon Katmanı [TEL-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	405	2026-05-02 11:02:30.835741+00	2026-04-13 11:02:30.835726+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
412	12	\N	61	82	16	Müşteri Self-Servis Portalı [TEL-5]	## Genel Bakış\nFatura görüntüleme, kullanım analizi, tarife değişikliği ve ödeme yapma ekranları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-18 11:02:30.845835+00	2026-03-29 11:02:30.845825+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
413	12	\N	64	47	82	Dağıtım: Müşteri Self-Servis Portalı — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Müşteri Self-Servis Portalı [TEL-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	412	2026-04-26 11:02:30.85324+00	2026-04-23 11:02:30.85322+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
414	12	\N	63	25	82	Code Review: Müşteri Self-Servis Portalı — Adım 2	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Müşteri Self-Servis Portalı [TEL-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	412	2026-05-10 11:02:30.857004+00	2026-04-13 11:02:30.856989+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
415	12	\N	64	47	82	Bug Fix: Müşteri Self-Servis Portalı — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Müşteri Self-Servis Portalı [TEL-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	412	2026-04-28 11:02:30.865694+00	2026-04-24 11:02:30.865681+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
416	13	12	66	53	17	Matchmaking Motoru [GAME-1]	## Genel Bakış\nELO tabanlı beceri eşleştirme algoritması; bölgesel gecikme optimizasyonu ve parti oluşturma mantığı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-19 11:02:30.893644+00	2026-04-01 11:02:30.893631+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
417	13	12	69	89	53	Tasarım: Matchmaking Motoru — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Matchmaking Motoru [GAME-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	416	2026-04-26 11:02:30.895976+00	2026-04-26 11:02:30.895963+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
418	13	12	68	89	53	QA & Test: Matchmaking Motoru — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Matchmaking Motoru [GAME-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	416	2026-05-06 11:02:30.900059+00	2026-04-23 11:02:30.900045+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
419	13	12	66	25	53	Entegrasyon: Matchmaking Motoru — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Matchmaking Motoru [GAME-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	416	2026-05-09 11:02:30.908523+00	2026-04-22 11:02:30.908509+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
420	13	12	68	57	53	Code Review: Matchmaking Motoru — Adım 4	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Matchmaking Motoru [GAME-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	416	2026-05-04 11:02:30.915693+00	2026-04-14 11:02:30.915678+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
421	13	11	67	89	17	Liderlik Tablosu Servisi [GAME-2]	## Genel Bakış\nGerçek zamanlı sıralama hesaplama; haftalık/aylık sezon sıfırlama ve ödül dağıtım akışı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-15 11:02:30.922138+00	2026-04-09 11:02:30.922129+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
422	13	11	70	71	89	Entegrasyon: Liderlik Tablosu Servisi — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	421	2026-05-12 11:02:30.929004+00	2026-04-26 11:02:30.928987+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
423	13	11	69	62	89	Analiz: Liderlik Tablosu Servisi — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	421	2026-05-19 11:02:30.932744+00	2026-04-25 11:02:30.93273+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
424	13	11	69	57	89	Code Review: Liderlik Tablosu Servisi — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	421	2026-05-18 11:02:30.941959+00	2026-04-10 11:02:30.941944+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
425	13	11	69	53	89	Unit Test: Liderlik Tablosu Servisi — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	421	2026-05-02 11:02:30.948974+00	2026-04-24 11:02:30.948961+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
426	13	11	66	56	89	Tasarım: Liderlik Tablosu Servisi — Adım 5	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	421	2026-05-19 11:02:30.957741+00	2026-04-25 11:02:30.957727+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
427	13	11	67	15	89	Bug Fix: Liderlik Tablosu Servisi — Adım 6	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Liderlik Tablosu Servisi [GAME-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	421	2026-04-29 11:02:30.966344+00	2026-04-18 11:02:30.966324+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
428	13	11	68	71	17	Başarı & Ödül Sistemi [GAME-3]	## Genel Bakış\nKoşul tabanlı başarı tetikleyicileri, XP hesaplama motoru ve ödül envanter entegrasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-10 11:02:30.973275+00	2026-03-18 11:02:30.97326+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
429	13	11	67	86	71	Analiz: Başarı & Ödül Sistemi — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Başarı & Ödül Sistemi [GAME-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	428	2026-04-28 11:02:30.979652+00	2026-04-14 11:02:30.97963+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
430	13	11	67	56	71	Code Review: Başarı & Ödül Sistemi — Adım 2	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Başarı & Ödül Sistemi [GAME-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	428	2026-04-27 11:02:30.983478+00	2026-04-10 11:02:30.983461+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
431	13	11	67	53	71	Dokümantasyon: Başarı & Ödül Sistemi — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Başarı & Ödül Sistemi [GAME-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	428	2026-05-19 11:02:30.987938+00	2026-04-17 11:02:30.987854+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
432	13	13	66	53	17	In-Game Ekonomi Yönetimi [GAME-4]	## Genel Bakış\nSanal para birimi akışı, fiyatlandırma dengesi ve kötüye kullanım tespit kuralları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-13 11:02:30.994238+00	2026-03-26 11:02:30.994223+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
433	13	13	69	86	53	Analiz: In-Game Ekonomi Yönetimi — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** In-Game Ekonomi Yönetimi [GAME-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	432	2026-05-03 11:02:31.000924+00	2026-04-13 11:02:31.000906+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
434	13	13	67	56	53	Entegrasyon: In-Game Ekonomi Yönetimi — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** In-Game Ekonomi Yönetimi [GAME-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	432	2026-05-05 11:02:31.004497+00	2026-04-19 11:02:31.004484+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
435	13	13	67	20	53	Tasarım: In-Game Ekonomi Yönetimi — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** In-Game Ekonomi Yönetimi [GAME-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	432	2026-05-07 11:02:31.013046+00	2026-04-25 11:02:31.01303+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
436	13	13	70	25	53	Unit Test: In-Game Ekonomi Yönetimi — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** In-Game Ekonomi Yönetimi [GAME-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	432	2026-04-29 11:02:31.019856+00	2026-04-14 11:02:31.019841+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
437	13	12	67	89	17	Oturum Yönetimi & Anti-Cheat [GAME-5]	## Genel Bakış\nOyun oturumu koordinasyonu, sunucu tarafı doğrulama ve hile tespit imzaları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-25 11:02:31.026524+00	2026-03-28 11:02:31.026514+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
438	13	12	66	89	89	Tasarım: Oturum Yönetimi & Anti-Cheat — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Oturum Yönetimi & Anti-Cheat [GAME-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	437	2026-05-03 11:02:31.034021+00	2026-04-22 11:02:31.034004+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
439	13	12	68	20	89	Dokümantasyon: Oturum Yönetimi & Anti-Cheat — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Oturum Yönetimi & Anti-Cheat [GAME-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	437	2026-05-07 11:02:31.037742+00	2026-04-11 11:02:31.037723+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
440	13	12	66	89	89	Unit Test: Oturum Yönetimi & Anti-Cheat — Adım 3	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Oturum Yönetimi & Anti-Cheat [GAME-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	437	2026-04-29 11:02:31.042388+00	2026-04-18 11:02:31.042371+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
441	13	12	68	57	89	Entegrasyon: Oturum Yönetimi & Anti-Cheat — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Oturum Yönetimi & Anti-Cheat [GAME-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	437	2026-04-27 11:02:31.050202+00	2026-04-26 11:02:31.050183+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
442	13	12	69	53	89	Geliştirme: Oturum Yönetimi & Anti-Cheat — Adım 5	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Oturum Yönetimi & Anti-Cheat [GAME-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	437	2026-04-27 11:02:31.055485+00	2026-04-23 11:02:31.05547+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
443	13	12	68	53	17	Analitik Veri Hattı [GAME-6]	## Genel Bakış\nOyuncu davranış olaylarının Kafka'ya basılması, Spark işlemesi ve BI dashboard'a aktarımı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-06-08 11:02:31.064572+00	2026-03-13 11:02:31.064562+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
444	13	12	69	25	53	Analiz: Analitik Veri Hattı — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	443	2026-05-09 11:02:31.073352+00	2026-04-15 11:02:31.073335+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
445	13	12	70	71	53	Bug Fix: Analitik Veri Hattı — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	443	2026-04-28 11:02:31.076431+00	2026-04-23 11:02:31.076421+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
446	13	12	66	86	53	Code Review: Analitik Veri Hattı — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	443	2026-04-29 11:02:31.083611+00	2026-04-21 11:02:31.083593+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
447	13	12	68	62	53	Dokümantasyon: Analitik Veri Hattı — Adım 4	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	443	2026-05-12 11:02:31.091227+00	2026-04-24 11:02:31.091209+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
448	13	12	67	17	53	Geliştirme: Analitik Veri Hattı — Adım 5	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	443	2026-05-11 11:02:31.096439+00	2026-04-13 11:02:31.096426+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
449	13	12	67	41	53	QA & Test: Analitik Veri Hattı — Adım 6	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Analitik Veri Hattı [GAME-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	443	2026-05-18 11:02:31.104974+00	2026-04-23 11:02:31.104955+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
450	14	\N	71	22	18	MQTT Broker Altyapısı [IOT-1]	## Genel Bakış\nEclipse Mosquitto cluster kurulumu; TLS mutual auth, QoS seviyeleri ve topic filtreleme politikaları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-22 11:02:31.125359+00	2026-03-24 11:02:31.125343+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
451	14	\N	71	26	22	Dağıtım: MQTT Broker Altyapısı — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** MQTT Broker Altyapısı [IOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	450	2026-05-19 11:02:31.12764+00	2026-04-10 11:02:31.127622+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
452	14	\N	71	8	22	Code Review: MQTT Broker Altyapısı — Adım 2	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** MQTT Broker Altyapısı [IOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	450	2026-05-10 11:02:31.130949+00	2026-04-12 11:02:31.130936+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
453	14	\N	73	39	22	Analiz: MQTT Broker Altyapısı — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** MQTT Broker Altyapısı [IOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	450	2026-05-08 11:02:31.138205+00	2026-04-22 11:02:31.138192+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
454	14	\N	72	22	22	Dokümantasyon: MQTT Broker Altyapısı — Adım 4	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** MQTT Broker Altyapısı [IOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	450	2026-05-10 11:02:31.144218+00	2026-04-16 11:02:31.144205+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
455	14	\N	72	76	18	Zaman Serisi Veritabanı [IOT-2]	## Genel Bakış\nInfluxDB veya TimescaleDB tasarımı; retention politikaları, sürekli sorgular ve downsampling stratejisi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-05 11:02:31.152748+00	2026-03-10 11:02:31.152734+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
456	14	\N	75	88	76	Dağıtım: Zaman Serisi Veritabanı — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Zaman Serisi Veritabanı [IOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	455	2026-04-27 11:02:31.159219+00	2026-04-24 11:02:31.159202+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
457	14	\N	71	76	76	Dokümantasyon: Zaman Serisi Veritabanı — Adım 2	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Zaman Serisi Veritabanı [IOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	455	2026-05-13 11:02:31.163172+00	2026-04-15 11:02:31.163159+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
458	14	\N	72	39	76	Entegrasyon: Zaman Serisi Veritabanı — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Zaman Serisi Veritabanı [IOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	455	2026-05-12 11:02:31.172164+00	2026-04-11 11:02:31.17215+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
459	14	\N	71	88	76	Geliştirme: Zaman Serisi Veritabanı — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Zaman Serisi Veritabanı [IOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	455	2026-04-26 11:02:31.178499+00	2026-04-23 11:02:31.178485+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
460	14	\N	72	76	76	Bug Fix: Zaman Serisi Veritabanı — Adım 5	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Zaman Serisi Veritabanı [IOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	455	2026-04-30 11:02:31.185454+00	2026-04-16 11:02:31.185434+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
461	14	\N	73	26	18	Eşik Alarm Yönetimi [IOT-3]	## Genel Bakış\nDinamik eşik yapılandırması, eskalasyon zinciri ve alarm susturma (silence) mekanizması.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-28 11:02:31.192052+00	2026-04-06 11:02:31.192035+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
462	14	\N	74	22	26	Tasarım: Eşik Alarm Yönetimi — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Eşik Alarm Yönetimi [IOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	461	2026-05-11 11:02:31.198873+00	2026-04-16 11:02:31.198854+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
463	14	\N	72	22	26	Analiz: Eşik Alarm Yönetimi — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Eşik Alarm Yönetimi [IOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	461	2026-05-12 11:02:31.201863+00	2026-04-24 11:02:31.201852+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
464	14	\N	73	8	26	Dokümantasyon: Eşik Alarm Yönetimi — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Eşik Alarm Yönetimi [IOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	461	2026-05-13 11:02:31.209991+00	2026-04-23 11:02:31.209971+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
465	14	\N	75	26	26	Entegrasyon: Eşik Alarm Yönetimi — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Eşik Alarm Yönetimi [IOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	461	2026-05-15 11:02:31.219736+00	2026-04-25 11:02:31.219719+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
466	14	\N	72	8	26	Dağıtım: Eşik Alarm Yönetimi — Adım 5	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Eşik Alarm Yönetimi [IOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	461	2026-04-27 11:02:31.22825+00	2026-04-15 11:02:31.22823+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
467	14	\N	71	26	18	Anomali Tespit Modeli [IOT-4]	## Genel Bakış\nIsolation Forest ve LSTM tabanlı çok değişkenli anomali modeli; online öğrenme stratejisi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-26 11:02:31.240561+00	2026-03-19 11:02:31.240552+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
468	14	\N	74	8	26	QA & Test: Anomali Tespit Modeli — Adım 1	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Anomali Tespit Modeli [IOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	467	2026-05-07 11:02:31.252451+00	2026-04-16 11:02:31.25243+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
469	14	\N	71	26	26	Tasarım: Anomali Tespit Modeli — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Anomali Tespit Modeli [IOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	467	2026-05-01 11:02:31.256323+00	2026-04-23 11:02:31.25631+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
470	14	\N	73	18	26	Analiz: Anomali Tespit Modeli — Adım 3	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Anomali Tespit Modeli [IOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	467	2026-04-30 11:02:31.265497+00	2026-04-10 11:02:31.265476+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
471	14	\N	71	18	26	Dokümantasyon: Anomali Tespit Modeli — Adım 4	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Anomali Tespit Modeli [IOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	467	2026-05-19 11:02:31.272197+00	2026-04-19 11:02:31.272179+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
472	14	\N	72	8	18	Cihaz Sağlık Panosu [IOT-5]	## Genel Bakış\nTelemetri metrikleri, cihaz çevrimiçi/çevrimdışı durumu ve bakım takvimi görselleştirmesi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-16 11:02:31.282997+00	2026-03-13 11:02:31.282979+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
473	14	\N	72	39	8	Entegrasyon: Cihaz Sağlık Panosu — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Cihaz Sağlık Panosu [IOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	472	2026-04-30 11:02:31.289322+00	2026-04-13 11:02:31.289304+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
474	14	\N	73	18	8	Dağıtım: Cihaz Sağlık Panosu — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Cihaz Sağlık Panosu [IOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	472	2026-05-06 11:02:31.292259+00	2026-04-11 11:02:31.292247+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
475	14	\N	71	76	8	Tasarım: Cihaz Sağlık Panosu — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Cihaz Sağlık Panosu [IOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	472	2026-05-05 11:02:31.299884+00	2026-04-18 11:02:31.299869+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
476	14	\N	72	39	8	Geliştirme: Cihaz Sağlık Panosu — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Cihaz Sağlık Panosu [IOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	472	2026-05-04 11:02:31.308248+00	2026-04-25 11:02:31.308233+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
477	14	\N	73	26	18	OTA Güncelleme Kanalı [IOT-6]	## Genel Bakış\nIoT cihazları için güvenli firmware güncelleme; sürüm yönetimi ve güncelleme başarı izleme.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-26 11:02:31.313785+00	2026-03-24 11:02:31.313776+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
478	14	\N	72	26	26	Analiz: OTA Güncelleme Kanalı — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** OTA Güncelleme Kanalı [IOT-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	477	2026-05-17 11:02:31.322411+00	2026-04-13 11:02:31.322393+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
479	14	\N	72	8	26	Tasarım: OTA Güncelleme Kanalı — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** OTA Güncelleme Kanalı [IOT-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	477	2026-05-04 11:02:31.32562+00	2026-04-11 11:02:31.325607+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
480	14	\N	73	88	26	Bug Fix: OTA Güncelleme Kanalı — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** OTA Güncelleme Kanalı [IOT-6]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	477	2026-05-19 11:02:31.332282+00	2026-04-13 11:02:31.332268+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
481	15	16	76	80	19	Akıllı Kontrat Geliştirme [BLC-1]	## Genel Bakış\nSolidity ile tedarik zinciri izleme kontratı; olay bazlı değişmez kayıt ve erişim kontrol katmanı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-06-12 11:02:31.359336+00	2026-03-19 11:02:31.359322+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
482	15	16	79	80	80	Dağıtım: Akıllı Kontrat Geliştirme — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Akıllı Kontrat Geliştirme [BLC-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	481	2026-05-17 11:02:31.361464+00	2026-04-25 11:02:31.361443+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
483	15	16	76	54	80	Code Review: Akıllı Kontrat Geliştirme — Adım 2	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Akıllı Kontrat Geliştirme [BLC-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	481	2026-05-19 11:02:31.365266+00	2026-04-26 11:02:31.365251+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
484	15	16	78	58	80	QA & Test: Akıllı Kontrat Geliştirme — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Akıllı Kontrat Geliştirme [BLC-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	481	2026-05-01 11:02:31.373672+00	2026-04-14 11:02:31.373654+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
485	15	16	78	89	80	Entegrasyon: Akıllı Kontrat Geliştirme — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Akıllı Kontrat Geliştirme [BLC-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	481	2026-05-05 11:02:31.378797+00	2026-04-22 11:02:31.378771+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
486	15	16	79	66	80	Unit Test: Akıllı Kontrat Geliştirme — Adım 5	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Akıllı Kontrat Geliştirme [BLC-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	481	2026-05-19 11:02:31.387648+00	2026-04-10 11:02:31.387635+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
487	15	16	77	54	19	Özel Blockchain Ağ Kurulumu [BLC-2]	## Genel Bakış\nHyperledger Fabric veya Polygon Edge ağ mimarisi; validator node yönetimi ve konsensüs konfigürasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-13 11:02:31.395848+00	2026-03-15 11:02:31.395839+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
488	15	16	78	80	54	Tasarım: Özel Blockchain Ağ Kurulumu — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Özel Blockchain Ağ Kurulumu [BLC-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	487	2026-05-07 11:02:31.405172+00	2026-04-26 11:02:31.405153+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
489	15	16	76	14	54	QA & Test: Özel Blockchain Ağ Kurulumu — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Özel Blockchain Ağ Kurulumu [BLC-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	487	2026-05-05 11:02:31.408833+00	2026-04-20 11:02:31.40882+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
490	15	16	80	14	54	Bug Fix: Özel Blockchain Ağ Kurulumu — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Özel Blockchain Ağ Kurulumu [BLC-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	487	2026-05-01 11:02:31.417377+00	2026-04-23 11:02:31.417357+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
491	15	16	78	14	54	Geliştirme: Özel Blockchain Ağ Kurulumu — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Özel Blockchain Ağ Kurulumu [BLC-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	487	2026-05-02 11:02:31.423165+00	2026-04-12 11:02:31.423151+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
492	15	15	78	89	19	QR Ürün Provenance Takibi [BLC-3]	## Genel Bakış\nÜrün yaşam döngüsü QR bazlı izlenebilirlik; üretim → depo → dağıtım → tüketici kanıt zinciri.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-19 11:02:31.430404+00	2026-03-27 11:02:31.430395+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
493	15	15	79	58	89	Tasarım: QR Ürün Provenance Takibi — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** QR Ürün Provenance Takibi [BLC-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	492	2026-04-27 11:02:31.438907+00	2026-04-14 11:02:31.438888+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
494	15	15	79	19	89	Analiz: QR Ürün Provenance Takibi — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** QR Ürün Provenance Takibi [BLC-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	492	2026-04-26 11:02:31.442532+00	2026-04-11 11:02:31.44252+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
495	15	15	78	69	89	Bug Fix: QR Ürün Provenance Takibi — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** QR Ürün Provenance Takibi [BLC-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	492	2026-05-01 11:02:31.450879+00	2026-04-23 11:02:31.450865+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
496	15	14	76	69	19	Token ve NFT Yönetimi [BLC-4]	## Genel Bakış\nERC-721/ERC-1155 token sözleşmeleri; cüzdan entegrasyonu ve gas optimizasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-23 11:02:31.45926+00	2026-03-15 11:02:31.459251+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
497	15	14	80	54	69	Entegrasyon: Token ve NFT Yönetimi — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	496	2026-05-12 11:02:31.468095+00	2026-04-25 11:02:31.468067+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
498	15	14	78	45	69	Bug Fix: Token ve NFT Yönetimi — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	496	2026-04-29 11:02:31.471283+00	2026-04-24 11:02:31.471273+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
499	15	14	78	80	69	Unit Test: Token ve NFT Yönetimi — Adım 3	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	496	2026-05-12 11:02:31.479629+00	2026-04-14 11:02:31.479616+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
500	15	14	77	25	69	Tasarım: Token ve NFT Yönetimi — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	496	2026-05-06 11:02:31.488014+00	2026-04-14 11:02:31.487993+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
501	15	14	76	66	69	Dokümantasyon: Token ve NFT Yönetimi — Adım 5	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	496	2026-05-18 11:02:31.496099+00	2026-04-10 11:02:31.496082+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
502	15	14	78	69	69	Dağıtım: Token ve NFT Yönetimi — Adım 6	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Token ve NFT Yönetimi [BLC-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	496	2026-05-10 11:02:31.502092+00	2026-04-19 11:02:31.502076+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
503	15	16	77	69	19	Uyum ve Denetim Kaydı [BLC-5]	## Genel Bakış\nTüm tedarik zinciri hareketlerinin değiştirilemez blockchain kaydı; düzenleyici kurum raporu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-06-10 11:02:31.508353+00	2026-03-16 11:02:31.508344+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
504	15	16	76	89	69	Tasarım: Uyum ve Denetim Kaydı — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	503	2026-04-29 11:02:31.516915+00	2026-04-22 11:02:31.516898+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
505	15	16	79	55	69	Unit Test: Uyum ve Denetim Kaydı — Adım 2	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	503	2026-04-27 11:02:31.520129+00	2026-04-19 11:02:31.520114+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
506	15	16	77	58	69	Dokümantasyon: Uyum ve Denetim Kaydı — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	503	2026-05-09 11:02:31.525081+00	2026-04-14 11:02:31.525067+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
507	15	16	79	69	69	Entegrasyon: Uyum ve Denetim Kaydı — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	503	2026-05-15 11:02:31.533646+00	2026-04-13 11:02:31.533631+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
508	15	16	76	54	69	Code Review: Uyum ve Denetim Kaydı — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	503	2026-05-03 11:02:31.539798+00	2026-04-10 11:02:31.539765+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
509	15	16	79	25	69	Analiz: Uyum ve Denetim Kaydı — Adım 6	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Uyum ve Denetim Kaydı [BLC-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	503	2026-04-30 11:02:31.548317+00	2026-04-13 11:02:31.548303+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
510	16	\N	81	35	20	SAP RFC Entegrasyon Adaptörü [ERP-1]	## Genel Bakış\nSAP BAPI/RFC arayüzleri üzerinden malzeme, sipariş ve stok verisi senkronizasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-16 11:02:31.568122+00	2026-03-23 11:02:31.568109+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
511	16	\N	81	20	35	Analiz: SAP RFC Entegrasyon Adaptörü — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** SAP RFC Entegrasyon Adaptörü [ERP-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	510	2026-05-09 11:02:31.57015+00	2026-04-14 11:02:31.570135+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
512	16	\N	86	54	35	QA & Test: SAP RFC Entegrasyon Adaptörü — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** SAP RFC Entegrasyon Adaptörü [ERP-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	510	2026-05-04 11:02:31.573962+00	2026-04-20 11:02:31.573948+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
513	16	\N	86	27	35	Code Review: SAP RFC Entegrasyon Adaptörü — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** SAP RFC Entegrasyon Adaptörü [ERP-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	510	2026-05-02 11:02:31.582074+00	2026-04-15 11:02:31.58206+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
514	16	\N	83	35	35	Entegrasyon: SAP RFC Entegrasyon Adaptörü — Adım 4	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** SAP RFC Entegrasyon Adaptörü [ERP-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	510	2026-05-17 11:02:31.591446+00	2026-04-16 11:02:31.591426+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
515	16	\N	82	66	20	Master Data Yönetim Katmanı [ERP-2]	## Genel Bakış\nBirden fazla sistemdeki müşteri, tedarikçi ve ürün ana verilerinin altın kayıt (golden record) yönetimi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-05-20 11:02:31.599823+00	2026-03-16 11:02:31.599813+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
516	16	\N	86	35	66	Analiz: Master Data Yönetim Katmanı — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Master Data Yönetim Katmanı [ERP-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	515	2026-04-30 11:02:31.606372+00	2026-04-17 11:02:31.606353+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
517	16	\N	81	20	66	QA & Test: Master Data Yönetim Katmanı — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Master Data Yönetim Katmanı [ERP-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	515	2026-05-01 11:02:31.609996+00	2026-04-14 11:02:31.609977+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
518	16	\N	82	54	66	Entegrasyon: Master Data Yönetim Katmanı — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Master Data Yönetim Katmanı [ERP-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	515	2026-04-27 11:02:31.618969+00	2026-04-24 11:02:31.618953+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
519	16	\N	85	97	66	Unit Test: Master Data Yönetim Katmanı — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Master Data Yönetim Katmanı [ERP-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	515	2026-05-17 11:02:31.624957+00	2026-04-20 11:02:31.624943+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
520	16	\N	83	54	20	İş Akışı Otomasyon Motoru [ERP-3]	## Genel Bakış\nOnay zinciri, eskalasyon kuralları ve entegrasyon hatası yeniden deneme (retry) mekanizması.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-30 11:02:31.632408+00	2026-03-21 11:02:31.632398+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
521	16	\N	85	54	54	Bug Fix: İş Akışı Otomasyon Motoru — Adım 1	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** İş Akışı Otomasyon Motoru [ERP-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	520	2026-04-28 11:02:31.640695+00	2026-04-16 11:02:31.640629+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
522	16	\N	83	42	54	Entegrasyon: İş Akışı Otomasyon Motoru — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** İş Akışı Otomasyon Motoru [ERP-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	520	2026-05-15 11:02:31.64421+00	2026-04-26 11:02:31.644198+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
523	16	\N	86	66	54	QA & Test: İş Akışı Otomasyon Motoru — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** İş Akışı Otomasyon Motoru [ERP-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	520	2026-05-13 11:02:31.652212+00	2026-04-15 11:02:31.6522+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
524	16	\N	81	27	54	Geliştirme: İş Akışı Otomasyon Motoru — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** İş Akışı Otomasyon Motoru [ERP-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	520	2026-05-18 11:02:31.660701+00	2026-04-22 11:02:31.660689+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
525	16	\N	85	27	54	Dağıtım: İş Akışı Otomasyon Motoru — Adım 5	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** İş Akışı Otomasyon Motoru [ERP-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	520	2026-05-15 11:02:31.669814+00	2026-04-22 11:02:31.669799+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
526	16	\N	81	66	20	Veri Kalitesi & Doğrulama [ERP-4]	## Genel Bakış\nETL hattında veri kalitesi kontrolü; duplicate tespiti, eksik alan kuralları ve düzeltme akışı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-27 11:02:31.675642+00	2026-03-15 11:02:31.675628+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
527	16	\N	81	27	66	Tasarım: Veri Kalitesi & Doğrulama — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	526	2026-05-18 11:02:31.683988+00	2026-04-17 11:02:31.68397+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
528	16	\N	86	27	66	Analiz: Veri Kalitesi & Doğrulama — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	526	2026-04-28 11:02:31.68694+00	2026-04-26 11:02:31.686929+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
529	16	\N	84	27	66	Dokümantasyon: Veri Kalitesi & Doğrulama — Adım 3	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	526	2026-05-17 11:02:31.693348+00	2026-04-20 11:02:31.693334+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
530	16	\N	84	54	66	Code Review: Veri Kalitesi & Doğrulama — Adım 4	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	526	2026-04-28 11:02:31.702061+00	2026-04-24 11:02:31.702047+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
531	16	\N	83	66	66	Bug Fix: Veri Kalitesi & Doğrulama — Adım 5	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	526	2026-05-02 11:02:31.71099+00	2026-04-12 11:02:31.710975+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
532	16	\N	83	35	66	Geliştirme: Veri Kalitesi & Doğrulama — Adım 6	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Veri Kalitesi & Doğrulama [ERP-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	526	2026-05-13 11:02:31.719394+00	2026-04-19 11:02:31.71938+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
533	17	18	87	52	9	Dialog Yönetim Sistemi [BOT-1]	## Genel Bakış\nÇok turlu konuşma akışı, bağlam takibi ve dinamik yanıt üretimi için state machine tasarımı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-18 11:02:31.747284+00	2026-03-17 11:02:31.747263+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
534	17	18	87	75	52	Dokümantasyon: Dialog Yönetim Sistemi — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Dialog Yönetim Sistemi [BOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	533	2026-05-06 11:02:31.749222+00	2026-04-10 11:02:31.749208+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
535	17	18	88	64	52	Bug Fix: Dialog Yönetim Sistemi — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Dialog Yönetim Sistemi [BOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	533	2026-05-03 11:02:31.752615+00	2026-04-14 11:02:31.752601+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
536	17	18	91	64	52	Code Review: Dialog Yönetim Sistemi — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Dialog Yönetim Sistemi [BOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	533	2026-05-09 11:02:31.759243+00	2026-04-26 11:02:31.759221+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
537	17	18	91	52	52	QA & Test: Dialog Yönetim Sistemi — Adım 4	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Dialog Yönetim Sistemi [BOT-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	533	2026-05-07 11:02:31.76543+00	2026-04-18 11:02:31.765412+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
538	17	17	88	67	9	NLP Motoru Entegrasyonu [BOT-2]	## Genel Bakış\nRasa veya Dialogflow CX ile intent sınıflandırma ve varlık çıkarma pipeline'ı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-28 11:02:31.774591+00	2026-03-23 11:02:31.774581+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
539	17	17	91	64	67	Dağıtım: NLP Motoru Entegrasyonu — Adım 1	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** NLP Motoru Entegrasyonu [BOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	538	2026-05-19 11:02:31.782378+00	2026-04-25 11:02:31.782361+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
540	17	17	89	22	67	Analiz: NLP Motoru Entegrasyonu — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** NLP Motoru Entegrasyonu [BOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	538	2026-05-09 11:02:31.78549+00	2026-04-16 11:02:31.785477+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
541	17	17	87	67	67	Entegrasyon: NLP Motoru Entegrasyonu — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** NLP Motoru Entegrasyonu [BOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	538	2026-05-15 11:02:31.792636+00	2026-04-10 11:02:31.792622+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
542	17	17	91	3	67	Unit Test: NLP Motoru Entegrasyonu — Adım 4	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** NLP Motoru Entegrasyonu [BOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	538	2026-05-08 11:02:31.800459+00	2026-04-26 11:02:31.800438+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
543	17	17	89	64	67	QA & Test: NLP Motoru Entegrasyonu — Adım 5	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** NLP Motoru Entegrasyonu [BOT-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	538	2026-05-11 11:02:31.806909+00	2026-04-10 11:02:31.806895+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
544	17	17	89	38	9	WhatsApp Business API [BOT-3]	## Genel Bakış\nMeta Cloud API entegrasyonu; şablon mesaj gönderimi, oturum yönetimi ve medya desteği.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-26 11:02:31.816283+00	2026-03-25 11:02:31.816271+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
545	17	17	91	51	38	Dokümantasyon: WhatsApp Business API — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** WhatsApp Business API [BOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	544	2026-05-05 11:02:31.824718+00	2026-04-24 11:02:31.824701+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
546	17	17	90	22	38	Tasarım: WhatsApp Business API — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** WhatsApp Business API [BOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	544	2026-05-04 11:02:31.828317+00	2026-04-24 11:02:31.828297+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
547	17	17	91	75	38	Bug Fix: WhatsApp Business API — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** WhatsApp Business API [BOT-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	544	2026-05-07 11:02:31.837887+00	2026-04-15 11:02:31.837873+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
548	17	18	87	9	9	Canlı Temsilci Devir Akışı [BOT-4]	## Genel Bakış\nBot düşük güven durumunda insan aracıya canlı diyalog geçişi; tam konuşma geçmişi aktarımı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-05-16 11:02:31.846412+00	2026-04-05 11:02:31.846403+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
549	17	18	89	9	9	Unit Test: Canlı Temsilci Devir Akışı — Adım 1	### İş Tanımı\nJest/pytest ile birim test suite'i oluşturulur; %85 branch coverage hedeflenir.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	548	2026-05-05 11:02:31.858144+00	2026-04-15 11:02:31.858121+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
550	17	18	90	22	9	Geliştirme: Canlı Temsilci Devir Akışı — Adım 2	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	548	2026-04-26 11:02:31.861901+00	2026-04-21 11:02:31.861885+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
551	17	18	91	3	9	Dağıtım: Canlı Temsilci Devir Akışı — Adım 3	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	3	f	548	2026-05-08 11:02:31.871247+00	2026-04-11 11:02:31.871231+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
552	17	18	90	67	9	Tasarım: Canlı Temsilci Devir Akışı — Adım 4	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	548	2026-05-01 11:02:31.880838+00	2026-04-18 11:02:31.880823+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
553	17	18	87	95	9	Analiz: Canlı Temsilci Devir Akışı — Adım 5	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	548	2026-05-01 11:02:31.89124+00	2026-04-12 11:02:31.89122+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
554	17	18	88	22	9	Bug Fix: Canlı Temsilci Devir Akışı — Adım 6	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Canlı Temsilci Devir Akışı [BOT-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	548	2026-05-12 11:02:31.900401+00	2026-04-22 11:02:31.900386+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
555	17	18	88	67	9	Analitik & Intent İyileştirme [BOT-5]	## Genel Bakış\nDüşük güven konuşmaların etiketlenmesi, annotation arayüzü ve model yeniden eğitim döngüsü.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	34	f	\N	2026-06-01 11:02:31.907612+00	2026-04-09 11:02:31.907601+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
556	17	18	87	22	67	Entegrasyon: Analitik & Intent İyileştirme — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Analitik & Intent İyileştirme [BOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	555	2026-05-07 11:02:31.9149+00	2026-04-20 11:02:31.914884+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
557	17	18	88	95	67	Dağıtım: Analitik & Intent İyileştirme — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Analitik & Intent İyileştirme [BOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	2	f	555	2026-05-13 11:02:31.91876+00	2026-04-22 11:02:31.918742+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
558	17	18	87	67	67	Tasarım: Analitik & Intent İyileştirme — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Analitik & Intent İyileştirme [BOT-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	555	2026-04-28 11:02:31.923454+00	2026-04-11 11:02:31.92344+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
559	18	\N	92	53	10	Poliçe Oluşturma Motoru [INS-1]	## Genel Bakış\nRisk skorlama algoritmaları, ürün katalog yönetimi ve otomatik prim hesaplama motoru.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	21	f	\N	2026-05-25 11:02:31.941719+00	2026-03-17 11:02:31.941707+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
560	18	\N	96	94	53	Analiz: Poliçe Oluşturma Motoru — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Poliçe Oluşturma Motoru [INS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	559	2026-05-05 11:02:31.943886+00	2026-04-10 11:02:31.943871+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
561	18	\N	92	70	53	QA & Test: Poliçe Oluşturma Motoru — Adım 2	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Poliçe Oluşturma Motoru [INS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	8	f	559	2026-05-05 11:02:31.947849+00	2026-04-11 11:02:31.947834+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
562	18	\N	97	10	53	Entegrasyon: Poliçe Oluşturma Motoru — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Poliçe Oluşturma Motoru [INS-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	559	2026-04-27 11:02:31.95712+00	2026-04-19 11:02:31.957106+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
563	18	\N	93	68	10	Hasar Tazminat Süreci [INS-2]	## Genel Bakış\nHasar beyanı alımı, eksper atama, ödeme onay zinciri ve müşteri bildirim akışları.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-16 11:02:31.963959+00	2026-04-07 11:02:31.96395+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
564	18	\N	97	53	68	Analiz: Hasar Tazminat Süreci — Adım 1	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Hasar Tazminat Süreci [INS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	563	2026-05-17 11:02:31.972618+00	2026-04-19 11:02:31.972599+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
565	18	\N	95	94	68	Tasarım: Hasar Tazminat Süreci — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Hasar Tazminat Süreci [INS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	563	2026-05-05 11:02:31.976226+00	2026-04-10 11:02:31.976211+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
566	18	\N	92	20	68	Entegrasyon: Hasar Tazminat Süreci — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Hasar Tazminat Süreci [INS-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	563	2026-05-11 11:02:31.985188+00	2026-04-14 11:02:31.985157+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
567	18	\N	94	27	10	Aktüeryal Hesaplama Servisi [INS-3]	## Genel Bakış\nMortalite tabloları, hayatta kalma analizi ve portföy risk modelleme kütüphanesi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	13	f	\N	2026-06-11 11:02:31.992625+00	2026-03-18 11:02:31.992612+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
568	18	\N	94	94	27	Dokümantasyon: Aktüeryal Hesaplama Servisi — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	567	2026-05-15 11:02:31.997517+00	2026-04-23 11:02:31.997499+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
569	18	\N	93	93	27	Tasarım: Aktüeryal Hesaplama Servisi — Adım 2	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	1	f	567	2026-05-08 11:02:32.000505+00	2026-04-16 11:02:32.000491+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
570	18	\N	95	94	27	Entegrasyon: Aktüeryal Hesaplama Servisi — Adım 3	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	567	2026-05-17 11:02:32.007471+00	2026-04-10 11:02:32.007457+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
571	18	\N	94	20	27	Analiz: Aktüeryal Hesaplama Servisi — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	567	2026-05-16 11:02:32.018038+00	2026-04-17 11:02:32.018019+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
572	18	\N	95	59	27	Code Review: Aktüeryal Hesaplama Servisi — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	567	2026-05-16 11:02:32.032803+00	2026-04-20 11:02:32.032772+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
573	18	\N	94	59	27	Geliştirme: Aktüeryal Hesaplama Servisi — Adım 6	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Aktüeryal Hesaplama Servisi [INS-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	567	2026-05-18 11:02:32.045271+00	2026-04-19 11:02:32.045245+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
574	18	\N	92	59	10	Doküman Yönetim Sistemi [INS-4]	## Genel Bakış\nPoliçe belgesi, hasar formu ve ekspertiz raporu şablon motoru ve arşivleme altyapısı.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-12 11:02:32.056554+00	2026-03-31 11:02:32.056544+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
575	18	\N	93	30	59	Code Review: Doküman Yönetim Sistemi — Adım 1	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	574	2026-05-15 11:02:32.065527+00	2026-04-12 11:02:32.065506+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
576	18	\N	97	30	59	Entegrasyon: Doküman Yönetim Sistemi — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	574	2026-05-11 11:02:32.069949+00	2026-04-17 11:02:32.069935+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
577	18	\N	93	70	59	Tasarım: Doküman Yönetim Sistemi — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	574	2026-05-06 11:02:32.078212+00	2026-04-14 11:02:32.078192+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
578	18	\N	96	93	59	Analiz: Doküman Yönetim Sistemi — Adım 4	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	574	2026-04-29 11:02:32.091928+00	2026-04-23 11:02:32.091912+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
579	18	\N	97	10	59	Dağıtım: Doküman Yönetim Sistemi — Adım 5	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	5	f	574	2026-05-08 11:02:32.104323+00	2026-04-25 11:02:32.104302+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
580	18	\N	96	93	59	Geliştirme: Doküman Yönetim Sistemi — Adım 6	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Doküman Yönetim Sistemi [INS-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	8	f	574	2026-05-07 11:02:32.117382+00	2026-04-22 11:02:32.117367+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
581	18	\N	93	28	10	Uyum & Raporlama [INS-5]	## Genel Bakış\nSigortacılık Genel Müdürlüğü düzenleyici raporları ve IFRS 17 muhasebe entegrasyonu.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-18 11:02:32.128035+00	2026-03-10 11:02:32.128022+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
582	18	\N	92	27	28	Entegrasyon: Uyum & Raporlama — Adım 1	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	581	2026-05-10 11:02:32.139024+00	2026-04-15 11:02:32.139001+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
583	18	\N	92	53	28	Analiz: Uyum & Raporlama — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	581	2026-04-30 11:02:32.143119+00	2026-04-16 11:02:32.143104+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
584	18	\N	96	61	28	Tasarım: Uyum & Raporlama — Adım 3	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	581	2026-05-10 11:02:32.150847+00	2026-04-24 11:02:32.150829+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
585	18	\N	93	70	28	Code Review: Uyum & Raporlama — Adım 4	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	8	f	581	2026-05-09 11:02:32.159307+00	2026-04-10 11:02:32.159286+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
586	18	\N	94	53	28	Bug Fix: Uyum & Raporlama — Adım 5	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	581	2026-05-17 11:02:32.16975+00	2026-04-25 11:02:32.169736+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
587	18	\N	92	59	28	QA & Test: Uyum & Raporlama — Adım 6	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Uyum & Raporlama [INS-5]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	581	2026-05-10 11:02:32.178482+00	2026-04-26 11:02:32.178466+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
588	19	22	98	33	11	Prototip v1 — Temel Akışlar [RAD1-1]	## Genel Bakış\nKullanıcı kayıt, giriş ve ana sayfa ekranlarının clickable prototipi. Figma çıktısından koda.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-06-10 11:02:32.203132+00	2026-03-21 11:02:32.203114+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
589	19	22	100	3	33	Dokümantasyon: Prototip v1 — Temel Akışlar — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Prototip v1 — Temel Akışlar [RAD1-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	8	f	588	2026-05-01 11:02:32.205755+00	2026-04-12 11:02:32.205737+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
590	19	22	101	11	33	Bug Fix: Prototip v1 — Temel Akışlar — Adım 2	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Prototip v1 — Temel Akışlar [RAD1-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	3	f	588	2026-05-14 11:02:32.209052+00	2026-04-16 11:02:32.209042+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
591	19	22	99	3	33	Code Review: Prototip v1 — Temel Akışlar — Adım 3	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Prototip v1 — Temel Akışlar [RAD1-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	1	f	588	2026-05-07 11:02:32.218138+00	2026-04-23 11:02:32.218116+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
592	19	22	98	95	33	Geliştirme: Prototip v1 — Temel Akışlar — Adım 4	### İş Tanımı\nTDD döngüsünde özellik kodu yazılır; linting ve statik analiz sıfır hata koşulu.\n\n**Üst görev:** Prototip v1 — Temel Akışlar [RAD1-1]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	588	2026-05-09 11:02:32.22488+00	2026-04-12 11:02:32.224864+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
593	19	22	99	5	11	Prototip v2 — Çekirdek Özellikler [RAD1-2]	## Genel Bakış\nİlk JAD oturumundan gelen geri bildirimlerle revize edilmiş temel özellikler.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	CRITICAL	21	f	\N	2026-05-30 11:02:32.232507+00	2026-03-11 11:02:32.232495+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
594	19	22	98	23	5	Tasarım: Prototip v2 — Çekirdek Özellikler — Adım 1	### İş Tanımı\nBileşen sınıf diyagramı, API sözleşmesi ve DB şeması kaleme alınır; tasarım gözden geçirme yapılır.\n\n**Üst görev:** Prototip v2 — Çekirdek Özellikler [RAD1-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	593	2026-04-29 11:02:32.239015+00	2026-04-14 11:02:32.238996+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
595	19	22	99	33	5	Analiz: Prototip v2 — Çekirdek Özellikler — Adım 2	### İş Tanımı\nGereksinimlerin mevcut sistemle uyumluluğu incelenir; boşluk analizi raporu hazırlanır.\n\n**Üst görev:** Prototip v2 — Çekirdek Özellikler [RAD1-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	1	f	593	2026-05-13 11:02:32.242616+00	2026-04-13 11:02:32.242601+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
596	19	22	99	45	5	QA & Test: Prototip v2 — Çekirdek Özellikler — Adım 3	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Prototip v2 — Çekirdek Özellikler [RAD1-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	2	f	593	2026-05-03 11:02:32.25002+00	2026-04-15 11:02:32.250002+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
597	19	22	100	45	5	Bug Fix: Prototip v2 — Çekirdek Özellikler — Adım 4	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Prototip v2 — Çekirdek Özellikler [RAD1-2]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	2	f	593	2026-05-11 11:02:32.25502+00	2026-04-25 11:02:32.255005+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
598	19	20	100	45	11	MVP Teslimatı [RAD1-3]	## Genel Bakış\nPrototip turlarından çıkan öncelikli özelliklerle işlevsel MVP; canlı kullanıcı testi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	34	f	\N	2026-05-20 11:02:32.263075+00	2026-03-14 11:02:32.263063+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
599	19	20	99	23	45	QA & Test: MVP Teslimatı — Adım 1	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** MVP Teslimatı [RAD1-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	2	f	598	2026-04-27 11:02:32.272632+00	2026-04-24 11:02:32.272613+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
600	19	20	101	29	45	Entegrasyon: MVP Teslimatı — Adım 2	### İş Tanımı\nServiser arası uçtan uca entegrasyon senaryoları CI pipeline'ına eklenir.\n\n**Üst görev:** MVP Teslimatı [RAD1-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	3	f	598	2026-05-08 11:02:32.275918+00	2026-04-21 11:02:32.275901+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
601	19	20	101	11	45	Bug Fix: MVP Teslimatı — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** MVP Teslimatı [RAD1-3]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	HIGH	1	f	598	2026-05-09 11:02:32.280962+00	2026-04-21 11:02:32.280947+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
602	19	22	98	45	11	Geri Bildirim İşleme [RAD1-4]	## Genel Bakış\nGerçek kullanıcı testinden gelen bulgular; kritik sorunların bir sonraki turda çözülmesi.\n\n## Kabul Kriterleri\n- [ ] Tüm birim testleri geçiyor\n- [ ] Entegrasyon testleri onaylandı\n- [ ] Kod incelemesi tamamlandı\n- [ ] Performans kriterleri karşılanıyor\n\n## Bağımlılıklar\nBu görev tamamlanmadan ilgili servisler entegre edilemez.	HIGH	13	f	\N	2026-05-25 11:02:32.289607+00	2026-03-18 11:02:32.289597+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
603	19	22	101	45	45	Dokümantasyon: Geri Bildirim İşleme — Adım 1	### İş Tanımı\nOpenAPI spesifikasyonu ve Confluence sayfası güncellenir; changelog tutulur.\n\n**Üst görev:** Geri Bildirim İşleme [RAD1-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	3	f	602	2026-05-07 11:02:32.298141+00	2026-04-18 11:02:32.298116+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
604	19	22	101	95	45	Dağıtım: Geri Bildirim İşleme — Adım 2	### İş Tanımı\nStaging ortamına mavi/yeşil dağıtım yapılır; smoke test ve canary release izlenir.\n\n**Üst görev:** Geri Bildirim İşleme [RAD1-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	602	2026-04-30 11:02:32.301842+00	2026-04-11 11:02:32.301827+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
605	19	22	98	16	45	Bug Fix: Geri Bildirim İşleme — Adım 3	### İş Tanımı\nAçık hata biletleri giderilir; regresyon testi eklenerek tekrarın önüne geçilir.\n\n**Üst görev:** Geri Bildirim İşleme [RAD1-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	LOW	5	f	602	2026-05-15 11:02:32.311389+00	2026-04-25 11:02:32.311376+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
606	19	22	99	23	45	QA & Test: Geri Bildirim İşleme — Adım 4	### İş Tanımı\nManuel test senaryoları koşulur; test kartı doldurulur ve UAT ortamı hazırlanır.\n\n**Üst görev:** Geri Bildirim İşleme [RAD1-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	CRITICAL	5	f	602	2026-05-05 11:02:32.327269+00	2026-04-20 11:02:32.327246+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
607	19	22	101	16	45	Code Review: Geri Bildirim İşleme — Adım 5	### İş Tanımı\nEn az 2 geliştirici incelemesi, güvenlik checklist kontrolü ve performans kriterleri doğrulanır.\n\n**Üst görev:** Geri Bildirim İşleme [RAD1-4]\n\n### Notlar\n- Önce tasarımı gözden geçirin\n- PR açmadan önce testlerin geçtiğini doğrulayın\n- Kapanışta Jira/Linear bağlantısını güncelleyin	MEDIUM	5	f	602	2026-05-05 11:02:32.337704+00	2026-04-20 11:02:32.337685+00	2026-04-29 11:02:04.785991+00	1	f	\N	\N	\N	\N	\N	\N	\N	\N
99	3	\N	12	2	2	Bildirim Altyapısı (DATA)	## Genel Bakış\nWebSocket üzerinden gerçek zamanlı bildirimlerin ve e-posta servisinin kurgulanması.\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.	HIGH	21	f	\N	2026-05-29 11:02:04.213379+00	2026-03-18 11:02:04.213383+00	2026-04-29 13:13:42.426061+00	2	f	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, task_id, uploader_id, file_name, file_path, uploaded_at, file_size, version, updated_at, is_deleted, deleted_at) FROM stdin;
\.


--
-- Data for Name: artifacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.artifacts (id, project_id, name, status, assignee_id, linked_phase_id, note, file_id, version, created_at, updated_at, is_deleted, deleted_at) FROM stdin;
1	1	Gereksinim Dokümanı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
2	1	Tasarım Spesifikasyonu	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
3	1	Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
4	2	Gereksinim Dokümanı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
5	2	Tasarım Spesifikasyonu	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
6	2	Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
7	3	Gereksinim Dokümanı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
8	3	Tasarım Spesifikasyonu	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
9	3	Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
10	4	Gereksinim Dokümanı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
11	4	Tasarım Spesifikasyonu	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
12	4	Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N
13	5	Gereksinim Dokümanı (SRS)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
14	5	Mimari Tasarım Dokümanı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
15	5	Test Planı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
16	5	Kullanıcı Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
17	6	API Spesifikasyonu (OpenAPI)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
18	6	Veri Akışı Diyagramı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
19	6	Güvenlik Değerlendirmesi	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
20	6	Dağıtım Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
21	7	İş Vakası Belgesi	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
22	7	Risk Kaydı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
23	7	Kabul Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
24	8	Gereksinim Dokümanı (SRS)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
25	8	Mimari Tasarım Dokümanı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
26	8	Test Planı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
27	8	Kullanıcı Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
28	9	API Spesifikasyonu (OpenAPI)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
29	9	Veri Akışı Diyagramı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
30	9	Güvenlik Değerlendirmesi	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
31	9	Dağıtım Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
32	10	İş Vakası Belgesi	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
33	10	Risk Kaydı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
34	10	Kabul Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
35	11	Gereksinim Dokümanı (SRS)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
36	11	Mimari Tasarım Dokümanı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
37	11	Test Planı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
38	11	Kullanıcı Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
39	12	API Spesifikasyonu (OpenAPI)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
40	12	Veri Akışı Diyagramı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
41	12	Güvenlik Değerlendirmesi	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
42	12	Dağıtım Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
43	13	İş Vakası Belgesi	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
44	13	Risk Kaydı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
45	13	Kabul Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
46	14	Gereksinim Dokümanı (SRS)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
47	14	Mimari Tasarım Dokümanı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
48	14	Test Planı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
49	14	Kullanıcı Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
50	15	API Spesifikasyonu (OpenAPI)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
51	15	Veri Akışı Diyagramı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
52	15	Güvenlik Değerlendirmesi	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
53	15	Dağıtım Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
54	16	İş Vakası Belgesi	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
55	16	Risk Kaydı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
56	16	Kabul Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
57	17	Gereksinim Dokümanı (SRS)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
58	17	Mimari Tasarım Dokümanı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
59	17	Test Planı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
60	17	Kullanıcı Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
61	18	API Spesifikasyonu (OpenAPI)	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
62	18	Veri Akışı Diyagramı	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
63	18	Güvenlik Değerlendirmesi	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
64	18	Dağıtım Kılavuzu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
65	19	İş Vakası Belgesi	completed	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
66	19	Risk Kaydı	in_progress	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
67	19	Kabul Test Raporu	not_created	\N	\N	\N	\N	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N
311	1	Product Backlog	not_created	\N	\N	\N	\N	1	2026-05-17 21:27:29.117377+00	2026-05-17 21:27:29.117377+00	f	\N
312	1	Sprint Backlog	not_created	\N	\N	\N	\N	1	2026-05-17 21:27:29.117377+00	2026-05-17 21:27:29.117377+00	f	\N
313	1	Increment	not_created	\N	\N	\N	\N	1	2026-05-17 21:27:29.117377+00	2026-05-17 21:27:29.117377+00	f	\N
314	1	Definition of Done	not_created	\N	\N	\N	\N	1	2026-05-17 21:27:29.117377+00	2026-05-17 21:27:29.117377+00	f	\N
315	1	Sprint Goal	not_created	\N	\N	\N	\N	1	2026-05-17 21:27:29.117377+00	2026-05-17 21:27:29.117377+00	f	\N
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, entity_type, entity_id, field_name, old_value, new_value, user_id, action, "timestamp", metadata) FROM stdin;
1	task	2	status	\N	Open	5	created	2026-04-23 11:02:03.335213+00	\N
2	task	2	status	Open	Done	2	updated	2026-04-24 11:02:03.339338+00	\N
3	task	3	status	\N	Open	5	created	2026-04-06 11:02:03.339461+00	\N
4	task	4	status	\N	Open	5	created	2026-04-17 11:02:03.36803+00	\N
5	task	4	status	Open	In Progress	7	updated	2026-04-26 11:02:03.383678+00	\N
6	task	5	status	\N	Open	5	created	2026-04-12 11:02:03.383872+00	\N
7	task	6	status	\N	Open	5	created	2026-04-07 11:02:03.39605+00	\N
8	task	6	status	Open	Code Review	5	updated	2026-04-27 11:02:03.402487+00	\N
9	task	7	status	\N	Open	5	created	2026-04-24 11:02:03.402654+00	\N
10	task	7	status	Open	Done	3	updated	2026-04-28 11:02:03.414661+00	\N
11	task	9	status	\N	Open	5	created	2026-04-08 11:02:03.426335+00	\N
12	task	10	status	\N	Open	5	created	2026-04-07 11:02:03.429273+00	\N
13	task	12	status	\N	Open	3	created	2026-04-22 11:02:03.444498+00	\N
14	task	12	status	Open	Done	7	updated	2026-04-24 11:02:03.447253+00	\N
15	task	13	status	\N	Open	3	created	2026-04-24 11:02:03.447361+00	\N
16	task	13	status	Open	Done	7	updated	2026-04-25 11:02:03.455371+00	\N
17	task	14	status	\N	Open	3	created	2026-04-17 11:02:03.455475+00	\N
18	task	14	status	Open	Code Review	2	updated	2026-04-24 11:02:03.461902+00	\N
19	task	15	status	\N	Open	3	created	2026-04-14 11:02:03.462042+00	\N
20	task	15	status	Open	Code Review	2	updated	2026-04-29 11:02:03.470393+00	\N
21	task	16	status	\N	Open	3	created	2026-04-17 11:02:03.4705+00	\N
22	task	16	status	Open	Done	7	updated	2026-04-24 11:02:03.476457+00	\N
23	task	18	status	\N	Open	5	created	2026-04-09 11:02:03.483572+00	\N
24	task	19	status	\N	Open	5	created	2026-04-22 11:02:03.486922+00	\N
25	task	19	status	Open	In Progress	2	updated	2026-04-24 11:02:03.493603+00	\N
26	task	20	status	\N	Open	5	created	2026-04-08 11:02:03.493756+00	\N
27	task	20	status	Open	Done	7	updated	2026-04-29 11:02:03.502959+00	\N
28	task	21	status	\N	Open	5	created	2026-04-17 11:02:03.503063+00	\N
29	task	21	status	Open	Code Review	3	updated	2026-04-24 11:02:03.511152+00	\N
30	task	22	status	\N	Open	5	created	2026-04-08 11:02:03.511337+00	\N
31	task	23	status	\N	Open	5	created	2026-04-16 11:02:03.526015+00	\N
32	task	25	status	\N	Open	2	created	2026-04-05 11:02:03.541632+00	\N
33	task	25	status	Open	Done	3	updated	2026-04-24 11:02:03.545426+00	\N
34	task	26	status	\N	Open	2	created	2026-04-06 11:02:03.545629+00	\N
35	task	27	status	\N	Open	2	created	2026-04-13 11:02:03.55625+00	\N
36	task	28	status	\N	Open	2	created	2026-04-07 11:02:03.564325+00	\N
37	task	28	status	Open	Done	3	updated	2026-04-26 11:02:03.570985+00	\N
38	task	29	status	\N	Open	2	created	2026-04-04 11:02:03.57118+00	\N
39	task	29	status	Open	In Progress	5	updated	2026-04-25 11:02:03.582553+00	\N
40	task	30	status	\N	Open	2	created	2026-04-12 11:02:03.582686+00	\N
41	task	30	status	Open	Code Review	5	updated	2026-04-26 11:02:03.591124+00	\N
42	task	32	status	\N	Open	3	created	2026-04-04 11:02:03.603078+00	\N
43	task	33	status	\N	Open	3	created	2026-04-20 11:02:03.60646+00	\N
44	task	34	status	\N	Open	3	created	2026-04-24 11:02:03.615479+00	\N
45	task	34	status	Open	In Progress	2	updated	2026-04-29 11:02:03.623882+00	\N
46	task	35	status	\N	Open	3	created	2026-04-12 11:02:03.624025+00	\N
47	task	35	status	Open	In Progress	2	updated	2026-04-24 11:02:03.63239+00	\N
48	task	36	status	\N	Open	3	created	2026-04-20 11:02:03.632544+00	\N
49	task	36	status	Open	Code Review	5	updated	2026-04-27 11:02:03.64413+00	\N
50	task	37	status	\N	Open	3	created	2026-04-21 11:02:03.644236+00	\N
51	task	37	status	Open	Done	3	updated	2026-04-29 11:02:03.652471+00	\N
52	task	39	status	\N	Open	7	created	2026-04-21 11:02:03.676506+00	\N
53	task	39	status	Open	Analiz	4	updated	2026-04-25 11:02:03.681199+00	\N
54	task	40	status	\N	Open	7	created	2026-04-17 11:02:03.681385+00	\N
55	task	40	status	Open	Test	4	updated	2026-04-27 11:02:03.693254+00	\N
56	task	41	status	\N	Open	7	created	2026-04-17 11:02:03.693405+00	\N
57	task	41	status	Open	Done	3	updated	2026-04-29 11:02:03.703606+00	\N
58	task	42	status	\N	Open	7	created	2026-04-08 11:02:03.703834+00	\N
59	task	43	status	\N	Open	7	created	2026-04-11 11:02:03.714651+00	\N
60	task	43	status	Open	Analiz	7	updated	2026-04-26 11:02:03.727604+00	\N
61	task	44	status	\N	Open	7	created	2026-04-13 11:02:03.727763+00	\N
62	task	45	status	\N	Open	7	created	2026-04-14 11:02:03.739036+00	\N
63	task	47	status	\N	Open	5	created	2026-04-04 11:02:03.775588+00	\N
64	task	47	status	Open	Done	5	updated	2026-04-27 11:02:03.779661+00	\N
65	task	48	status	\N	Open	5	created	2026-04-13 11:02:03.779807+00	\N
66	task	48	status	Open	Geliştirme	4	updated	2026-04-27 11:02:03.790175+00	\N
67	task	49	status	\N	Open	5	created	2026-04-16 11:02:03.790316+00	\N
68	task	49	status	Open	Geliştirme	8	updated	2026-04-27 11:02:03.799458+00	\N
69	task	50	status	\N	Open	5	created	2026-04-20 11:02:03.799667+00	\N
70	task	50	status	Open	Analiz	4	updated	2026-04-27 11:02:03.809023+00	\N
71	task	51	status	\N	Open	5	created	2026-04-23 11:02:03.809187+00	\N
72	task	51	status	Open	Done	8	updated	2026-04-26 11:02:03.819906+00	\N
73	task	52	status	\N	Open	5	created	2026-04-06 11:02:03.820033+00	\N
74	task	52	status	Open	Analiz	4	updated	2026-04-26 11:02:03.82832+00	\N
75	task	53	status	\N	Open	5	created	2026-04-20 11:02:03.828418+00	\N
76	task	55	status	\N	Open	4	created	2026-04-15 11:02:03.844192+00	\N
77	task	55	status	Open	Analiz	4	updated	2026-04-27 11:02:03.847513+00	\N
78	task	56	status	\N	Open	4	created	2026-04-13 11:02:03.847657+00	\N
79	task	57	status	\N	Open	4	created	2026-04-04 11:02:03.857237+00	\N
80	task	57	status	Open	Analiz	7	updated	2026-04-29 11:02:03.867568+00	\N
81	task	59	status	\N	Open	3	created	2026-04-09 11:02:03.877286+00	\N
82	task	59	status	Open	Test	8	updated	2026-04-24 11:02:03.880673+00	\N
83	task	60	status	\N	Open	3	created	2026-04-14 11:02:03.880823+00	\N
84	task	60	status	Open	Analiz	7	updated	2026-04-27 11:02:03.890471+00	\N
85	task	61	status	\N	Open	3	created	2026-04-15 11:02:03.890571+00	\N
86	task	61	status	Open	Done	8	updated	2026-04-28 11:02:03.897663+00	\N
87	task	62	status	\N	Open	3	created	2026-04-15 11:02:03.89776+00	\N
88	task	62	status	Open	Geliştirme	5	updated	2026-04-26 11:02:03.904108+00	\N
89	task	63	status	\N	Open	3	created	2026-04-19 11:02:03.904262+00	\N
90	task	63	status	Open	Test	8	updated	2026-04-26 11:02:03.914475+00	\N
91	task	64	status	\N	Open	3	created	2026-04-14 11:02:03.914616+00	\N
92	task	65	status	\N	Open	3	created	2026-04-11 11:02:03.924318+00	\N
93	task	65	status	Open	Analiz	8	updated	2026-04-26 11:02:03.933088+00	\N
94	task	67	status	\N	Open	8	created	2026-04-11 11:02:03.94165+00	\N
95	task	67	status	Open	Analiz	3	updated	2026-04-27 11:02:03.94516+00	\N
96	task	68	status	\N	Open	8	created	2026-04-18 11:02:03.945344+00	\N
97	task	68	status	Open	Analiz	4	updated	2026-04-26 11:02:03.954645+00	\N
98	task	69	status	\N	Open	8	created	2026-04-21 11:02:03.954794+00	\N
99	task	69	status	Open	Analiz	3	updated	2026-04-28 11:02:03.961053+00	\N
100	task	70	status	\N	Open	8	created	2026-04-09 11:02:03.961194+00	\N
101	task	71	status	\N	Open	8	created	2026-04-13 11:02:03.968201+00	\N
102	task	71	status	Open	Analiz	3	updated	2026-04-26 11:02:03.974075+00	\N
103	task	72	status	\N	Open	8	created	2026-04-18 11:02:03.974176+00	\N
104	task	72	status	Open	Geliştirme	4	updated	2026-04-27 11:02:03.982061+00	\N
105	task	74	status	\N	Open	5	created	2026-04-17 11:02:03.989469+00	\N
106	task	74	status	Open	Done	7	updated	2026-04-28 11:02:03.992843+00	\N
107	task	75	status	\N	Open	5	created	2026-04-18 11:02:03.992952+00	\N
108	task	75	status	Open	Test	7	updated	2026-04-26 11:02:04.000514+00	\N
109	task	76	status	\N	Open	5	created	2026-04-10 11:02:04.000616+00	\N
110	task	76	status	Open	Done	7	updated	2026-04-28 11:02:04.008739+00	\N
111	task	78	status	\N	Open	5	created	2026-04-05 11:02:04.016417+00	\N
112	task	78	status	Open	Geliştirme	3	updated	2026-04-28 11:02:04.019689+00	\N
113	task	79	status	\N	Open	5	created	2026-04-14 11:02:04.019839+00	\N
114	task	79	status	Open	Test	7	updated	2026-04-24 11:02:04.039774+00	\N
115	task	81	status	\N	Open	4	created	2026-04-20 11:02:04.071077+00	\N
116	task	81	status	Open	Bakım	4	updated	2026-04-27 11:02:04.075719+00	\N
117	task	82	status	\N	Open	4	created	2026-04-22 11:02:04.075917+00	\N
118	task	82	status	Open	Analiz	8	updated	2026-04-25 11:02:04.087971+00	\N
119	task	83	status	\N	Open	4	created	2026-04-06 11:02:04.088122+00	\N
120	task	83	status	Open	Bakım	7	updated	2026-04-24 11:02:04.096366+00	\N
121	task	84	status	\N	Open	4	created	2026-04-14 11:02:04.096465+00	\N
122	task	84	status	Open	Analiz	4	updated	2026-04-24 11:02:04.108111+00	\N
123	task	85	status	\N	Open	4	created	2026-04-04 11:02:04.108241+00	\N
124	task	85	status	Open	Uygulama	8	updated	2026-04-24 11:02:04.116877+00	\N
125	task	86	status	\N	Open	4	created	2026-04-15 11:02:04.116985+00	\N
126	task	86	status	Open	Analiz	4	updated	2026-04-29 11:02:04.124425+00	\N
127	task	88	status	\N	Open	7	created	2026-04-19 11:02:04.13214+00	\N
128	task	88	status	Open	Bakım	4	updated	2026-04-25 11:02:04.135095+00	\N
129	task	89	status	\N	Open	7	created	2026-04-07 11:02:04.135216+00	\N
130	task	89	status	Open	Tasarım	1	updated	2026-04-27 11:02:04.142716+00	\N
131	task	90	status	\N	Open	7	created	2026-04-08 11:02:04.142841+00	\N
132	task	90	status	Open	Test	1	updated	2026-04-28 11:02:04.15027+00	\N
133	task	91	status	\N	Open	7	created	2026-04-17 11:02:04.15038+00	\N
134	task	91	status	Open	Bakım	3	updated	2026-04-28 11:02:04.158853+00	\N
135	task	92	status	\N	Open	7	created	2026-04-18 11:02:04.15902+00	\N
136	task	92	status	Open	Bakım	8	updated	2026-04-28 11:02:04.166595+00	\N
137	task	93	status	\N	Open	7	created	2026-04-24 11:02:04.166702+00	\N
138	task	95	status	\N	Open	4	created	2026-04-24 11:02:04.184534+00	\N
139	task	95	status	Open	Bakım	2	updated	2026-04-25 11:02:04.187635+00	\N
140	task	96	status	\N	Open	4	created	2026-04-15 11:02:04.187762+00	\N
141	task	96	status	Open	Analiz	7	updated	2026-04-25 11:02:04.198573+00	\N
142	task	97	status	\N	Open	4	created	2026-04-04 11:02:04.198683+00	\N
143	task	98	status	\N	Open	4	created	2026-04-20 11:02:04.206149+00	\N
144	task	98	status	Open	Uygulama	8	updated	2026-04-24 11:02:04.213254+00	\N
145	task	100	status	\N	Open	1	created	2026-04-10 11:02:04.222673+00	\N
146	task	101	status	\N	Open	1	created	2026-04-09 11:02:04.22604+00	\N
147	task	101	status	Open	Tasarım	1	updated	2026-04-24 11:02:04.233733+00	\N
148	task	102	status	\N	Open	1	created	2026-04-24 11:02:04.233882+00	\N
149	task	102	status	Open	Tasarım	2	updated	2026-04-29 11:02:04.243572+00	\N
150	task	103	status	\N	Open	1	created	2026-04-11 11:02:04.243687+00	\N
151	task	103	status	Open	Bakım	1	updated	2026-04-27 11:02:04.251155+00	\N
152	task	104	status	\N	Open	1	created	2026-04-19 11:02:04.25134+00	\N
153	task	104	status	Open	Analiz	3	updated	2026-04-27 11:02:04.261871+00	\N
154	task	105	status	\N	Open	1	created	2026-04-20 11:02:04.261999+00	\N
155	task	106	status	\N	Open	1	created	2026-04-16 11:02:04.270807+00	\N
156	task	106	status	Open	Uygulama	4	updated	2026-04-29 11:02:04.282763+00	\N
157	task	108	status	\N	Open	4	created	2026-04-17 11:02:04.290367+00	\N
158	task	108	status	Open	Test	1	updated	2026-04-28 11:02:04.293751+00	\N
159	task	109	status	\N	Open	4	created	2026-04-19 11:02:04.293888+00	\N
160	task	110	status	\N	Open	4	created	2026-04-09 11:02:04.303718+00	\N
161	task	110	status	Open	Uygulama	3	updated	2026-04-24 11:02:04.310549+00	\N
162	task	111	status	\N	Open	4	created	2026-04-07 11:02:04.310758+00	\N
163	task	111	status	Open	Analiz	3	updated	2026-04-28 11:02:04.321144+00	\N
164	task	112	status	\N	Open	4	created	2026-04-16 11:02:04.321269+00	\N
165	task	112	status	Open	Bakım	4	updated	2026-04-29 11:02:04.328429+00	\N
166	task	113	status	\N	Open	4	created	2026-04-15 11:02:04.328564+00	\N
167	task	113	status	Open	Tasarım	1	updated	2026-04-29 11:02:04.338193+00	\N
168	task	114	status	\N	Open	4	created	2026-04-11 11:02:04.338301+00	\N
169	task	116	status	\N	Open	1	created	2026-04-10 11:02:04.35251+00	\N
170	task	116	status	Open	Test	2	updated	2026-04-24 11:02:04.355234+00	\N
171	task	117	status	\N	Open	1	created	2026-04-22 11:02:04.355358+00	\N
172	task	117	status	Open	Uygulama	7	updated	2026-04-29 11:02:04.362795+00	\N
173	task	118	status	\N	Open	1	created	2026-04-20 11:02:04.363006+00	\N
174	task	118	status	Open	Test	4	updated	2026-04-25 11:02:04.372452+00	\N
175	task	119	status	\N	Open	1	created	2026-04-17 11:02:04.372558+00	\N
176	task	119	status	Open	Uygulama	3	updated	2026-04-25 11:02:04.37912+00	\N
177	task	121	status	\N	Open	3	created	2026-04-11 11:02:04.399114+00	\N
178	task	121	status	Open	In Progress	1	updated	2026-04-29 11:02:04.402347+00	\N
179	task	122	status	\N	Open	3	created	2026-04-12 11:02:04.402501+00	\N
180	task	122	status	Open	Code Review	7	updated	2026-04-28 11:02:04.410279+00	\N
181	task	123	status	\N	Open	3	created	2026-04-08 11:02:04.410426+00	\N
182	task	123	status	Open	Code Review	1	updated	2026-04-27 11:02:04.420733+00	\N
183	task	124	status	\N	Open	3	created	2026-04-06 11:02:04.420847+00	\N
184	task	124	status	Open	Code Review	7	updated	2026-04-25 11:02:04.427334+00	\N
185	task	125	status	\N	Open	3	created	2026-04-06 11:02:04.427476+00	\N
186	task	126	status	\N	Open	3	created	2026-04-10 11:02:04.436336+00	\N
187	task	127	status	\N	Open	3	created	2026-04-17 11:02:04.444359+00	\N
188	task	127	status	Open	In Progress	5	updated	2026-04-27 11:02:04.450585+00	\N
189	task	129	status	\N	Open	6	created	2026-04-06 11:02:04.457584+00	\N
190	task	130	status	\N	Open	6	created	2026-04-08 11:02:04.460251+00	\N
191	task	130	status	Open	Code Review	7	updated	2026-04-29 11:02:04.467471+00	\N
192	task	131	status	\N	Open	6	created	2026-04-11 11:02:04.467589+00	\N
193	task	132	status	\N	Open	6	created	2026-04-17 11:02:04.473371+00	\N
194	task	132	status	Open	Done	6	updated	2026-04-29 11:02:04.479603+00	\N
195	task	133	status	\N	Open	6	created	2026-04-06 11:02:04.479747+00	\N
196	task	133	status	Open	Done	1	updated	2026-04-29 11:02:04.486373+00	\N
197	task	134	status	\N	Open	6	created	2026-04-17 11:02:04.486475+00	\N
198	task	134	status	Open	Code Review	6	updated	2026-04-27 11:02:04.493689+00	\N
199	task	136	status	\N	Open	3	created	2026-04-11 11:02:04.501885+00	\N
200	task	136	status	Open	Code Review	3	updated	2026-04-25 11:02:04.505214+00	\N
201	task	137	status	\N	Open	3	created	2026-04-14 11:02:04.505429+00	\N
202	task	138	status	\N	Open	3	created	2026-04-14 11:02:04.51439+00	\N
203	task	138	status	Open	Code Review	6	updated	2026-04-29 11:02:04.520219+00	\N
204	task	139	status	\N	Open	3	created	2026-04-07 11:02:04.520326+00	\N
205	task	139	status	Open	In Progress	1	updated	2026-04-27 11:02:04.527712+00	\N
206	task	140	status	\N	Open	3	created	2026-04-23 11:02:04.52782+00	\N
207	task	142	status	\N	Open	6	created	2026-04-09 11:02:04.542044+00	\N
208	task	142	status	Open	In Progress	5	updated	2026-04-27 11:02:04.545411+00	\N
209	task	143	status	\N	Open	6	created	2026-04-12 11:02:04.545523+00	\N
210	task	143	status	Open	Done	7	updated	2026-04-28 11:02:04.552418+00	\N
211	task	144	status	\N	Open	6	created	2026-04-09 11:02:04.552568+00	\N
212	task	145	status	\N	Open	6	created	2026-04-20 11:02:04.562502+00	\N
213	task	145	status	Open	Code Review	7	updated	2026-04-28 11:02:04.569348+00	\N
214	task	146	status	\N	Open	6	created	2026-04-18 11:02:04.569495+00	\N
215	task	146	status	Open	In Progress	6	updated	2026-04-24 11:02:04.577765+00	\N
216	task	148	status	\N	Open	7	created	2026-04-12 11:02:04.586994+00	\N
217	task	149	status	\N	Open	7	created	2026-04-07 11:02:04.589738+00	\N
218	task	150	status	\N	Open	7	created	2026-04-11 11:02:04.596853+00	\N
219	task	150	status	Open	In Progress	5	updated	2026-04-25 11:02:04.604678+00	\N
220	task	151	status	\N	Open	7	created	2026-04-17 11:02:04.604814+00	\N
221	task	151	status	Open	Code Review	7	updated	2026-04-25 11:02:04.613068+00	\N
222	task	153	status	\N	Open	7	created	2026-04-06 11:02:04.620002+00	\N
223	task	153	status	Open	In Progress	3	updated	2026-04-28 11:02:04.623321+00	\N
224	task	154	status	\N	Open	7	created	2026-04-24 11:02:04.623425+00	\N
225	task	154	status	Open	Code Review	3	updated	2026-04-27 11:02:04.630547+00	\N
226	task	155	status	\N	Open	7	created	2026-04-19 11:02:04.63069+00	\N
227	task	157	status	\N	Open	1	created	2026-04-24 11:02:04.647521+00	\N
228	task	158	status	\N	Open	1	created	2026-04-05 11:02:04.651255+00	\N
229	task	159	status	\N	Open	1	created	2026-04-09 11:02:04.658699+00	\N
230	task	159	status	Open	In Progress	7	updated	2026-04-25 11:02:04.666859+00	\N
231	task	160	status	\N	Open	1	created	2026-04-09 11:02:04.666983+00	\N
232	task	160	status	Open	In Progress	1	updated	2026-04-27 11:02:04.673673+00	\N
233	task	161	status	\N	Open	1	created	2026-04-22 11:02:04.673774+00	\N
234	task	162	status	\N	Open	9	created	2026-03-14 11:02:28.548901+00	\N
235	task	163	status	\N	Open	97	created	2026-04-20 11:02:28.554283+00	\N
236	task	163	column_id	To Do	In Progress	23	updated	2026-04-22 11:02:28.554283+00	{"sprint": "Sprint 2", "phase_transition": true}
237	task	163	assignee_id	\N	23	9	updated	2026-04-20 12:00:28.554283+00	\N
238	task	164	status	\N	Open	97	created	2026-04-20 11:02:28.562588+00	\N
239	task	164	column_id	To Do	Done	97	updated	2026-04-23 11:02:28.562588+00	{"sprint": "Sprint 2", "phase_transition": true}
240	task	164	assignee_id	\N	97	9	updated	2026-04-20 11:17:28.562588+00	\N
241	task	164	status	Done	Done	97	completed	2026-04-27 11:02:28.562588+00	\N
242	task	165	status	\N	Open	97	created	2026-04-25 11:02:28.585942+00	\N
243	task	166	status	\N	Open	97	created	2026-04-13 11:02:28.600662+00	\N
244	task	166	column_id	To Do	Done	9	updated	2026-04-18 11:02:28.600662+00	{"sprint": "Sprint 2", "phase_transition": true}
245	task	166	assignee_id	\N	9	9	updated	2026-04-13 11:53:28.600662+00	\N
246	task	166	status	Done	Done	9	completed	2026-04-25 11:02:28.600662+00	\N
247	task	167	status	\N	Open	97	created	2026-04-17 11:02:28.608449+00	\N
248	task	168	status	\N	Open	9	created	2026-04-03 11:02:28.626932+00	\N
249	task	169	status	\N	Open	97	created	2026-04-15 11:02:28.638511+00	\N
250	task	169	column_id	To Do	In Progress	4	updated	2026-04-18 11:02:28.638511+00	{"sprint": "Sprint 3", "phase_transition": true}
251	task	169	assignee_id	\N	4	9	updated	2026-04-15 11:36:28.638511+00	\N
252	task	170	status	\N	Open	97	created	2026-04-24 11:02:28.644658+00	\N
253	task	170	column_id	To Do	Done	23	updated	2026-04-27 11:02:28.644658+00	{"sprint": "Sprint 3", "phase_transition": true}
254	task	170	assignee_id	\N	23	9	updated	2026-04-24 11:27:28.644658+00	\N
255	task	170	status	Done	Done	23	completed	2026-05-03 11:02:28.644658+00	\N
256	task	171	status	\N	Open	97	created	2026-04-20 11:02:28.656756+00	\N
257	task	171	column_id	To Do	Done	22	updated	2026-04-23 11:02:28.656756+00	{"sprint": "Sprint 3", "phase_transition": true}
258	task	171	assignee_id	\N	22	9	updated	2026-04-20 11:52:28.656756+00	\N
259	task	171	status	Done	Done	22	completed	2026-04-27 11:02:28.656756+00	\N
260	task	172	status	\N	Open	97	created	2026-04-25 11:02:28.67339+00	\N
261	task	172	column_id	To Do	In Progress	9	updated	2026-04-26 11:02:28.67339+00	{"sprint": "Sprint 3", "phase_transition": true}
262	task	172	assignee_id	\N	9	9	updated	2026-04-25 11:29:28.67339+00	\N
263	task	173	status	\N	Open	97	created	2026-04-15 11:02:28.687871+00	\N
264	task	173	column_id	To Do	In Progress	42	updated	2026-04-18 11:02:28.687871+00	{"sprint": "Sprint 3", "phase_transition": true}
265	task	173	assignee_id	\N	42	9	updated	2026-04-15 11:56:28.687871+00	\N
266	task	174	status	\N	Open	97	created	2026-04-16 11:02:28.702459+00	\N
267	task	175	status	\N	Open	9	created	2026-03-24 11:02:28.714836+00	\N
268	task	176	status	\N	Open	42	created	2026-04-11 11:02:28.725874+00	\N
348	task	210	status	\N	Open	22	created	2026-04-16 11:02:29.151642+00	\N
269	task	176	column_id	To Do	Done	21	updated	2026-04-12 11:02:28.725874+00	{"sprint": "Sprint 1", "phase_transition": true}
270	task	176	assignee_id	\N	21	9	updated	2026-04-11 11:23:28.725874+00	\N
271	task	176	status	Done	Done	21	completed	2026-04-23 11:02:28.725874+00	\N
272	task	177	status	\N	Open	42	created	2026-04-20 11:02:28.731621+00	\N
273	task	177	column_id	To Do	Done	4	updated	2026-04-24 11:02:28.731621+00	{"sprint": "Sprint 1", "phase_transition": true}
274	task	177	assignee_id	\N	4	9	updated	2026-04-20 11:39:28.731621+00	\N
275	task	177	status	Done	Done	4	completed	2026-04-29 11:02:28.731621+00	\N
276	task	178	status	\N	Open	42	created	2026-04-17 11:02:28.746674+00	\N
277	task	179	status	\N	Open	42	created	2026-04-24 11:02:28.758108+00	\N
278	task	179	column_id	To Do	Code Review	9	updated	2026-04-27 11:02:28.758108+00	{"sprint": "Sprint 1", "phase_transition": true}
279	task	179	assignee_id	\N	9	9	updated	2026-04-24 11:18:28.758108+00	\N
280	task	180	status	\N	Open	42	created	2026-04-23 11:02:28.768392+00	\N
281	task	180	column_id	To Do	In Progress	9	updated	2026-04-26 11:02:28.768392+00	{"sprint": "Sprint 1", "phase_transition": true}
282	task	180	assignee_id	\N	9	9	updated	2026-04-23 11:25:28.768392+00	\N
283	task	181	status	\N	Open	42	created	2026-04-13 11:02:28.778993+00	\N
284	task	181	column_id	To Do	Code Review	4	updated	2026-04-18 11:02:28.778993+00	{"sprint": "Sprint 1", "phase_transition": true}
285	task	181	assignee_id	\N	4	9	updated	2026-04-13 11:31:28.778993+00	\N
286	task	182	status	\N	Open	9	created	2026-03-12 11:02:28.79429+00	\N
287	task	183	status	\N	Open	97	created	2026-04-21 11:02:28.80575+00	\N
288	task	184	status	\N	Open	97	created	2026-04-18 11:02:28.811876+00	\N
289	task	184	column_id	To Do	Code Review	23	updated	2026-04-19 11:02:28.811876+00	{"sprint": "Sprint 3", "phase_transition": true}
290	task	184	assignee_id	\N	23	9	updated	2026-04-18 11:43:28.811876+00	\N
291	task	185	status	\N	Open	97	created	2026-04-10 11:02:28.819616+00	\N
292	task	185	column_id	To Do	In Progress	97	updated	2026-04-15 11:02:28.819616+00	{"sprint": "Sprint 3", "phase_transition": true}
293	task	185	assignee_id	\N	97	9	updated	2026-04-10 11:42:28.819616+00	\N
294	task	186	status	\N	Open	97	created	2026-04-24 11:02:28.834014+00	\N
295	task	187	status	\N	Open	9	created	2026-04-02 11:02:28.849864+00	\N
296	task	188	status	\N	Open	21	created	2026-04-24 11:02:28.85876+00	\N
297	task	188	column_id	To Do	Code Review	23	updated	2026-04-29 11:02:28.85876+00	{"sprint": "Sprint 2", "phase_transition": true}
298	task	188	assignee_id	\N	23	9	updated	2026-04-24 11:55:28.85876+00	\N
299	task	189	status	\N	Open	21	created	2026-04-16 11:02:28.864025+00	\N
300	task	190	status	\N	Open	21	created	2026-04-10 11:02:28.87746+00	\N
301	task	191	status	\N	Open	21	created	2026-04-21 11:02:28.888595+00	\N
302	task	191	column_id	To Do	In Progress	97	updated	2026-04-23 11:02:28.888595+00	{"sprint": "Sprint 2", "phase_transition": true}
303	task	191	assignee_id	\N	97	9	updated	2026-04-21 11:29:28.888595+00	\N
304	task	192	status	\N	Open	21	created	2026-04-12 11:02:28.896514+00	\N
305	task	192	column_id	To Do	Code Review	42	updated	2026-04-15 11:02:28.896514+00	{"sprint": "Sprint 2", "phase_transition": true}
306	task	192	assignee_id	\N	42	9	updated	2026-04-12 11:50:28.896514+00	\N
307	task	193	status	\N	Open	21	created	2026-04-13 11:02:28.90985+00	\N
308	task	193	column_id	To Do	In Progress	23	updated	2026-04-16 11:02:28.90985+00	{"sprint": "Sprint 2", "phase_transition": true}
309	task	193	assignee_id	\N	23	9	updated	2026-04-13 11:33:28.90985+00	\N
310	task	194	status	\N	Open	9	created	2026-04-04 11:02:28.921317+00	\N
311	task	195	status	\N	Open	4	created	2026-04-24 11:02:28.932884+00	\N
312	task	195	column_id	To Do	Code Review	23	updated	2026-04-26 11:02:28.932884+00	{"sprint": "Sprint 2", "phase_transition": true}
313	task	195	assignee_id	\N	23	9	updated	2026-04-24 11:24:28.932884+00	\N
314	task	196	status	\N	Open	4	created	2026-04-16 11:02:28.94905+00	\N
315	task	196	column_id	To Do	Done	23	updated	2026-04-18 11:02:28.94905+00	{"sprint": "Sprint 2", "phase_transition": true}
316	task	196	assignee_id	\N	23	9	updated	2026-04-16 11:12:28.94905+00	\N
317	task	196	status	Done	Done	23	completed	2026-04-27 11:02:28.94905+00	\N
318	task	197	status	\N	Open	4	created	2026-04-22 11:02:28.972032+00	\N
319	task	198	status	\N	Open	4	created	2026-04-12 11:02:28.988945+00	\N
320	task	199	status	\N	Open	4	created	2026-04-14 11:02:29.0012+00	\N
321	task	199	column_id	To Do	In Progress	9	updated	2026-04-18 11:02:29.0012+00	{"sprint": "Sprint 2", "phase_transition": true}
322	task	199	assignee_id	\N	9	9	updated	2026-04-14 11:40:29.0012+00	\N
323	task	200	status	\N	Open	10	created	2026-03-29 11:02:29.039933+00	\N
324	task	201	status	\N	Open	22	created	2026-04-15 11:02:29.043472+00	\N
325	task	201	column_id	To Do	Uygulama	87	updated	2026-04-17 11:02:29.043472+00	{"sprint": null, "phase_transition": true}
326	task	201	assignee_id	\N	87	10	updated	2026-04-15 11:59:29.043472+00	\N
327	task	202	status	\N	Open	22	created	2026-04-20 11:02:29.050221+00	\N
328	task	202	column_id	To Do	Bakım	46	updated	2026-04-24 11:02:29.050221+00	{"sprint": null, "phase_transition": true}
329	task	202	assignee_id	\N	46	10	updated	2026-04-20 11:14:29.050221+00	\N
330	task	202	status	Bakım	Done	46	completed	2026-04-26 11:02:29.050221+00	\N
331	task	203	status	\N	Open	22	created	2026-04-13 11:02:29.06531+00	\N
332	task	203	column_id	To Do	Bakım	46	updated	2026-04-16 11:02:29.06531+00	{"sprint": null, "phase_transition": true}
333	task	203	assignee_id	\N	46	10	updated	2026-04-13 11:34:29.06531+00	\N
334	task	203	status	Bakım	Done	46	completed	2026-04-20 11:02:29.06531+00	\N
335	task	204	status	\N	Open	22	created	2026-04-21 11:02:29.079251+00	\N
336	task	204	column_id	To Do	Uygulama	43	updated	2026-04-24 11:02:29.079251+00	{"sprint": null, "phase_transition": true}
337	task	204	assignee_id	\N	43	10	updated	2026-04-21 11:14:29.079251+00	\N
338	task	205	status	\N	Open	22	created	2026-04-21 11:02:29.093035+00	\N
339	task	205	column_id	To Do	Tasarım	73	updated	2026-04-25 11:02:29.093035+00	{"sprint": null, "phase_transition": true}
340	task	205	assignee_id	\N	73	10	updated	2026-04-21 12:01:29.093035+00	\N
341	task	206	status	\N	Open	10	created	2026-03-26 11:02:29.107653+00	\N
342	task	207	status	\N	Open	22	created	2026-04-15 11:02:29.121764+00	\N
343	task	208	status	\N	Open	22	created	2026-04-19 11:02:29.12736+00	\N
344	task	208	column_id	To Do	Bakım	51	updated	2026-04-23 11:02:29.12736+00	{"sprint": null, "phase_transition": true}
345	task	208	assignee_id	\N	51	10	updated	2026-04-19 11:14:29.12736+00	\N
346	task	208	status	Bakım	Done	51	completed	2026-05-01 11:02:29.12736+00	\N
347	task	209	status	\N	Open	22	created	2026-04-15 11:02:29.137013+00	\N
349	task	210	column_id	To Do	Uygulama	73	updated	2026-04-21 11:02:29.151642+00	{"sprint": null, "phase_transition": true}
350	task	210	assignee_id	\N	73	10	updated	2026-04-16 11:13:29.151642+00	\N
351	task	211	status	\N	Open	22	created	2026-04-10 11:02:29.162844+00	\N
352	task	211	column_id	To Do	Bakım	23	updated	2026-04-13 11:02:29.162844+00	{"sprint": null, "phase_transition": true}
353	task	211	assignee_id	\N	23	10	updated	2026-04-10 11:27:29.162844+00	\N
354	task	211	status	Bakım	Done	23	completed	2026-04-25 11:02:29.162844+00	\N
355	task	212	status	\N	Open	10	created	2026-03-15 11:02:29.178102+00	\N
356	task	213	status	\N	Open	45	created	2026-04-24 11:02:29.193964+00	\N
357	task	213	column_id	To Do	Analiz	23	updated	2026-04-26 11:02:29.193964+00	{"sprint": null, "phase_transition": true}
358	task	213	assignee_id	\N	23	10	updated	2026-04-24 11:35:29.193964+00	\N
359	task	214	status	\N	Open	45	created	2026-04-10 11:02:29.200272+00	\N
360	task	214	column_id	To Do	Tasarım	45	updated	2026-04-14 11:02:29.200272+00	{"sprint": null, "phase_transition": true}
361	task	214	assignee_id	\N	45	10	updated	2026-04-10 11:28:29.200272+00	\N
362	task	215	status	\N	Open	45	created	2026-04-14 11:02:29.214673+00	\N
363	task	215	column_id	To Do	Analiz	43	updated	2026-04-19 11:02:29.214673+00	{"sprint": null, "phase_transition": true}
364	task	215	assignee_id	\N	43	10	updated	2026-04-14 11:45:29.214673+00	\N
365	task	216	status	\N	Open	10	created	2026-04-01 11:02:29.230014+00	\N
366	task	217	status	\N	Open	73	created	2026-04-17 11:02:29.243213+00	\N
367	task	218	status	\N	Open	73	created	2026-04-24 11:02:29.249315+00	\N
368	task	218	column_id	To Do	Uygulama	30	updated	2026-04-28 11:02:29.249315+00	{"sprint": null, "phase_transition": true}
369	task	218	assignee_id	\N	30	10	updated	2026-04-24 11:22:29.249315+00	\N
370	task	219	status	\N	Open	73	created	2026-04-10 11:02:29.259594+00	\N
371	task	219	column_id	To Do	Bakım	45	updated	2026-04-15 11:02:29.259594+00	{"sprint": null, "phase_transition": true}
372	task	219	assignee_id	\N	45	10	updated	2026-04-10 11:15:29.259594+00	\N
373	task	219	status	Bakım	Done	45	completed	2026-04-24 11:02:29.259594+00	\N
374	task	220	status	\N	Open	73	created	2026-04-26 11:02:29.275283+00	\N
375	task	220	column_id	To Do	Test	87	updated	2026-04-27 11:02:29.275283+00	{"sprint": null, "phase_transition": true}
376	task	220	assignee_id	\N	87	10	updated	2026-04-26 12:00:29.275283+00	\N
377	task	221	status	\N	Open	73	created	2026-04-14 11:02:29.290171+00	\N
378	task	221	column_id	To Do	Analiz	43	updated	2026-04-17 11:02:29.290171+00	{"sprint": null, "phase_transition": true}
379	task	221	assignee_id	\N	43	10	updated	2026-04-14 11:31:29.290171+00	\N
380	task	222	status	\N	Open	10	created	2026-03-27 11:02:29.303242+00	\N
381	task	223	status	\N	Open	45	created	2026-04-16 11:02:29.314942+00	\N
382	task	224	status	\N	Open	45	created	2026-04-14 11:02:29.319888+00	\N
383	task	224	column_id	To Do	Test	43	updated	2026-04-15 11:02:29.319888+00	{"sprint": null, "phase_transition": true}
384	task	224	assignee_id	\N	43	10	updated	2026-04-14 11:08:29.319888+00	\N
385	task	225	status	\N	Open	45	created	2026-04-25 11:02:29.326483+00	\N
386	task	225	column_id	To Do	Test	10	updated	2026-04-30 11:02:29.326483+00	{"sprint": null, "phase_transition": true}
387	task	225	assignee_id	\N	10	10	updated	2026-04-25 11:25:29.326483+00	\N
388	task	226	status	\N	Open	45	created	2026-04-12 11:02:29.335742+00	\N
389	task	226	column_id	To Do	Tasarım	22	updated	2026-04-15 11:02:29.335742+00	{"sprint": null, "phase_transition": true}
390	task	226	assignee_id	\N	22	10	updated	2026-04-12 11:26:29.335742+00	\N
391	task	227	status	\N	Open	45	created	2026-04-23 11:02:29.342693+00	\N
392	task	227	column_id	To Do	Uygulama	22	updated	2026-04-24 11:02:29.342693+00	{"sprint": null, "phase_transition": true}
393	task	227	assignee_id	\N	22	10	updated	2026-04-23 11:15:29.342693+00	\N
394	task	228	status	\N	Open	45	created	2026-04-19 11:02:29.352103+00	\N
395	task	228	column_id	To Do	Bakım	10	updated	2026-04-20 11:02:29.352103+00	{"sprint": null, "phase_transition": true}
396	task	228	assignee_id	\N	10	10	updated	2026-04-19 11:52:29.352103+00	\N
397	task	228	status	Bakım	Done	10	completed	2026-04-30 11:02:29.352103+00	\N
398	task	229	status	\N	Open	11	created	2026-04-09 11:02:29.380714+00	\N
399	task	230	status	\N	Open	20	created	2026-04-21 11:02:29.383179+00	\N
400	task	231	status	\N	Open	20	created	2026-04-23 11:02:29.386894+00	\N
401	task	231	column_id	To Do	Geliştirme	83	updated	2026-04-27 11:02:29.386894+00	{"sprint": null, "phase_transition": true}
402	task	231	assignee_id	\N	83	11	updated	2026-04-23 11:18:29.386894+00	\N
403	task	232	status	\N	Open	20	created	2026-04-13 11:02:29.392347+00	\N
404	task	232	column_id	To Do	Geliştirme	20	updated	2026-04-16 11:02:29.392347+00	{"sprint": null, "phase_transition": true}
405	task	232	assignee_id	\N	20	11	updated	2026-04-13 11:15:29.392347+00	\N
406	task	233	status	\N	Open	11	created	2026-03-17 11:02:29.40223+00	\N
407	task	234	status	\N	Open	48	created	2026-04-12 11:02:29.411882+00	\N
408	task	234	column_id	To Do	Test	11	updated	2026-04-14 11:02:29.411882+00	{"sprint": null, "phase_transition": true}
409	task	234	assignee_id	\N	11	11	updated	2026-04-12 11:56:29.411882+00	\N
410	task	235	status	\N	Open	48	created	2026-04-22 11:02:29.415375+00	\N
411	task	235	column_id	To Do	Test	11	updated	2026-04-27 11:02:29.415375+00	{"sprint": null, "phase_transition": true}
412	task	235	assignee_id	\N	11	11	updated	2026-04-22 11:57:29.415375+00	\N
413	task	236	status	\N	Open	48	created	2026-04-26 11:02:29.423664+00	\N
414	task	237	status	\N	Open	11	created	2026-04-05 11:02:29.433242+00	\N
415	task	238	status	\N	Open	46	created	2026-04-21 11:02:29.438094+00	\N
416	task	238	column_id	To Do	Test	11	updated	2026-04-22 11:02:29.438094+00	{"sprint": null, "phase_transition": true}
417	task	238	assignee_id	\N	11	11	updated	2026-04-21 12:02:29.438094+00	\N
418	task	239	status	\N	Open	46	created	2026-04-18 11:02:29.442144+00	\N
419	task	239	column_id	To Do	Test	20	updated	2026-04-21 11:02:29.442144+00	{"sprint": null, "phase_transition": true}
420	task	239	assignee_id	\N	20	11	updated	2026-04-18 11:48:29.442144+00	\N
421	task	240	status	\N	Open	46	created	2026-04-11 11:02:29.4517+00	\N
422	task	240	column_id	To Do	Geliştirme	83	updated	2026-04-16 11:02:29.4517+00	{"sprint": null, "phase_transition": true}
423	task	240	assignee_id	\N	83	11	updated	2026-04-11 11:37:29.4517+00	\N
424	task	241	status	\N	Open	46	created	2026-04-14 11:02:29.45977+00	\N
425	task	241	column_id	To Do	Geliştirme	30	updated	2026-04-19 11:02:29.45977+00	{"sprint": null, "phase_transition": true}
426	task	241	assignee_id	\N	30	11	updated	2026-04-14 11:54:29.45977+00	\N
427	task	242	status	\N	Open	11	created	2026-04-07 11:02:29.470222+00	\N
428	task	243	status	\N	Open	55	created	2026-04-26 11:02:29.480053+00	\N
429	task	243	column_id	To Do	Done	5	updated	2026-04-30 11:02:29.480053+00	{"sprint": null, "phase_transition": true}
430	task	243	assignee_id	\N	5	11	updated	2026-04-26 11:59:29.480053+00	\N
431	task	243	status	Done	Done	5	completed	2026-05-06 11:02:29.480053+00	\N
432	task	244	status	\N	Open	55	created	2026-04-15 11:02:29.484077+00	\N
433	task	244	column_id	To Do	Geliştirme	11	updated	2026-04-20 11:02:29.484077+00	{"sprint": null, "phase_transition": true}
434	task	244	assignee_id	\N	11	11	updated	2026-04-15 11:41:29.484077+00	\N
435	task	245	status	\N	Open	55	created	2026-04-20 11:02:29.493653+00	\N
436	task	245	column_id	To Do	Analiz	63	updated	2026-04-25 11:02:29.493653+00	{"sprint": null, "phase_transition": true}
437	task	245	assignee_id	\N	63	11	updated	2026-04-20 11:53:29.493653+00	\N
438	task	246	status	\N	Open	55	created	2026-04-11 11:02:29.504598+00	\N
439	task	246	column_id	To Do	Geliştirme	30	updated	2026-04-16 11:02:29.504598+00	{"sprint": null, "phase_transition": true}
440	task	246	assignee_id	\N	30	11	updated	2026-04-11 11:20:29.504598+00	\N
441	task	247	status	\N	Open	55	created	2026-04-19 11:02:29.51461+00	\N
442	task	247	column_id	To Do	Done	20	updated	2026-04-21 11:02:29.51461+00	{"sprint": null, "phase_transition": true}
443	task	247	assignee_id	\N	20	11	updated	2026-04-19 11:08:29.51461+00	\N
444	task	247	status	Done	Done	20	completed	2026-04-25 11:02:29.51461+00	\N
445	task	248	status	\N	Open	11	created	2026-03-16 11:02:29.523628+00	\N
446	task	249	status	\N	Open	57	created	2026-04-14 11:02:29.532012+00	\N
447	task	249	column_id	To Do	Test	48	updated	2026-04-16 11:02:29.532012+00	{"sprint": null, "phase_transition": true}
448	task	249	assignee_id	\N	48	11	updated	2026-04-14 11:19:29.532012+00	\N
449	task	250	status	\N	Open	57	created	2026-04-16 11:02:29.535261+00	\N
450	task	250	column_id	To Do	Test	57	updated	2026-04-20 11:02:29.535261+00	{"sprint": null, "phase_transition": true}
451	task	250	assignee_id	\N	57	11	updated	2026-04-16 11:40:29.535261+00	\N
452	task	251	status	\N	Open	57	created	2026-04-13 11:02:29.544831+00	\N
453	task	251	column_id	To Do	Done	48	updated	2026-04-16 11:02:29.544831+00	{"sprint": null, "phase_transition": true}
454	task	251	assignee_id	\N	48	11	updated	2026-04-13 11:50:29.544831+00	\N
455	task	251	status	Done	Done	48	completed	2026-04-20 11:02:29.544831+00	\N
456	task	252	status	\N	Open	57	created	2026-04-24 11:02:29.554323+00	\N
457	task	252	column_id	To Do	Done	59	updated	2026-04-25 11:02:29.554323+00	{"sprint": null, "phase_transition": true}
458	task	252	assignee_id	\N	59	11	updated	2026-04-24 11:29:29.554323+00	\N
459	task	252	status	Done	Done	59	completed	2026-05-01 11:02:29.554323+00	\N
460	task	253	status	\N	Open	57	created	2026-04-19 11:02:29.564251+00	\N
461	task	254	status	\N	Open	11	created	2026-04-03 11:02:29.573997+00	\N
462	task	255	status	\N	Open	48	created	2026-04-18 11:02:29.582148+00	\N
463	task	255	column_id	To Do	Test	59	updated	2026-04-19 11:02:29.582148+00	{"sprint": null, "phase_transition": true}
464	task	255	assignee_id	\N	59	11	updated	2026-04-18 12:01:29.582148+00	\N
465	task	256	status	\N	Open	48	created	2026-04-10 11:02:29.587207+00	\N
466	task	256	column_id	To Do	Analiz	20	updated	2026-04-14 11:02:29.587207+00	{"sprint": null, "phase_transition": true}
467	task	256	assignee_id	\N	20	11	updated	2026-04-10 11:12:29.587207+00	\N
468	task	257	status	\N	Open	48	created	2026-04-15 11:02:29.597+00	\N
469	task	257	column_id	To Do	Analiz	63	updated	2026-04-17 11:02:29.597+00	{"sprint": null, "phase_transition": true}
470	task	257	assignee_id	\N	63	11	updated	2026-04-15 11:46:29.597+00	\N
471	task	258	status	\N	Open	48	created	2026-04-22 11:02:29.606632+00	\N
472	task	258	column_id	To Do	Analiz	11	updated	2026-04-27 11:02:29.606632+00	{"sprint": null, "phase_transition": true}
473	task	258	assignee_id	\N	11	11	updated	2026-04-22 12:01:29.606632+00	\N
474	task	259	status	\N	Open	48	created	2026-04-11 11:02:29.615267+00	\N
475	task	259	column_id	To Do	Test	48	updated	2026-04-13 11:02:29.615267+00	{"sprint": null, "phase_transition": true}
476	task	259	assignee_id	\N	48	11	updated	2026-04-11 11:35:29.615267+00	\N
477	task	260	status	\N	Open	48	created	2026-04-19 11:02:29.623225+00	\N
478	task	260	column_id	To Do	Test	57	updated	2026-04-22 11:02:29.623225+00	{"sprint": null, "phase_transition": true}
479	task	260	assignee_id	\N	57	11	updated	2026-04-19 11:51:29.623225+00	\N
480	task	261	status	\N	Open	12	created	2026-03-21 11:02:29.644235+00	\N
481	task	262	status	\N	Open	13	created	2026-04-21 11:02:29.646483+00	\N
482	task	263	status	\N	Open	13	created	2026-04-16 11:02:29.650421+00	\N
483	task	263	column_id	To Do	Test	45	updated	2026-04-20 11:02:29.650421+00	{"sprint": null, "phase_transition": true}
484	task	263	assignee_id	\N	45	12	updated	2026-04-16 11:41:29.650421+00	\N
485	task	264	status	\N	Open	13	created	2026-04-22 11:02:29.656094+00	\N
486	task	264	column_id	To Do	Analiz	50	updated	2026-04-23 11:02:29.656094+00	{"sprint": null, "phase_transition": true}
487	task	264	assignee_id	\N	50	12	updated	2026-04-22 11:29:29.656094+00	\N
488	task	265	status	\N	Open	13	created	2026-04-24 11:02:29.665846+00	\N
489	task	265	column_id	To Do	Tasarım	52	updated	2026-04-29 11:02:29.665846+00	{"sprint": null, "phase_transition": true}
490	task	265	assignee_id	\N	52	12	updated	2026-04-24 11:10:29.665846+00	\N
491	task	266	status	\N	Open	13	created	2026-04-18 11:02:29.673446+00	\N
492	task	266	column_id	To Do	Uygulama	82	updated	2026-04-22 11:02:29.673446+00	{"sprint": null, "phase_transition": true}
493	task	266	assignee_id	\N	82	12	updated	2026-04-18 11:12:29.673446+00	\N
494	task	267	status	\N	Open	12	created	2026-04-06 11:02:29.682683+00	\N
495	task	268	status	\N	Open	33	created	2026-04-19 11:02:29.691355+00	\N
496	task	268	column_id	To Do	Analiz	38	updated	2026-04-24 11:02:29.691355+00	{"sprint": null, "phase_transition": true}
497	task	268	assignee_id	\N	38	12	updated	2026-04-19 11:49:29.691355+00	\N
498	task	269	status	\N	Open	33	created	2026-04-10 11:02:29.694706+00	\N
499	task	269	column_id	To Do	Test	37	updated	2026-04-14 11:02:29.694706+00	{"sprint": null, "phase_transition": true}
500	task	269	assignee_id	\N	37	12	updated	2026-04-10 12:01:29.694706+00	\N
501	task	270	status	\N	Open	33	created	2026-04-23 11:02:29.703321+00	\N
502	task	270	column_id	To Do	Analiz	52	updated	2026-04-28 11:02:29.703321+00	{"sprint": null, "phase_transition": true}
503	task	270	assignee_id	\N	52	12	updated	2026-04-23 11:31:29.703321+00	\N
504	task	271	status	\N	Open	33	created	2026-04-20 11:02:29.712346+00	\N
505	task	271	column_id	To Do	Analiz	57	updated	2026-04-21 11:02:29.712346+00	{"sprint": null, "phase_transition": true}
506	task	271	assignee_id	\N	57	12	updated	2026-04-20 11:07:29.712346+00	\N
507	task	272	status	\N	Open	12	created	2026-03-20 11:02:29.721699+00	\N
508	task	273	status	\N	Open	57	created	2026-04-20 11:02:29.731184+00	\N
509	task	273	column_id	To Do	Tasarım	33	updated	2026-04-24 11:02:29.731184+00	{"sprint": null, "phase_transition": true}
510	task	273	assignee_id	\N	33	12	updated	2026-04-20 11:50:29.731184+00	\N
511	task	274	status	\N	Open	57	created	2026-04-19 11:02:29.734769+00	\N
512	task	274	column_id	To Do	Bakım	12	updated	2026-04-21 11:02:29.734769+00	{"sprint": null, "phase_transition": true}
513	task	274	assignee_id	\N	12	12	updated	2026-04-19 11:34:29.734769+00	\N
514	task	274	status	Bakım	Done	12	completed	2026-05-02 11:02:29.734769+00	\N
515	task	275	status	\N	Open	57	created	2026-04-21 11:02:29.744449+00	\N
516	task	275	column_id	To Do	Bakım	33	updated	2026-04-23 11:02:29.744449+00	{"sprint": null, "phase_transition": true}
517	task	275	assignee_id	\N	33	12	updated	2026-04-21 11:11:29.744449+00	\N
518	task	275	status	Bakım	Done	33	completed	2026-04-27 11:02:29.744449+00	\N
519	task	276	status	\N	Open	12	created	2026-04-06 11:02:29.753506+00	\N
520	task	277	status	\N	Open	39	created	2026-04-23 11:02:29.762976+00	\N
521	task	277	column_id	To Do	Analiz	50	updated	2026-04-24 11:02:29.762976+00	{"sprint": null, "phase_transition": true}
522	task	277	assignee_id	\N	50	12	updated	2026-04-23 11:20:29.762976+00	\N
523	task	278	status	\N	Open	39	created	2026-04-26 11:02:29.766539+00	\N
524	task	278	column_id	To Do	Test	82	updated	2026-05-01 11:02:29.766539+00	{"sprint": null, "phase_transition": true}
525	task	278	assignee_id	\N	82	12	updated	2026-04-26 11:35:29.766539+00	\N
526	task	279	status	\N	Open	39	created	2026-04-20 11:02:29.775282+00	\N
527	task	279	column_id	To Do	Uygulama	38	updated	2026-04-23 11:02:29.775282+00	{"sprint": null, "phase_transition": true}
528	task	279	assignee_id	\N	38	12	updated	2026-04-20 11:31:29.775282+00	\N
529	task	280	status	\N	Open	39	created	2026-04-15 11:02:29.784123+00	\N
530	task	280	column_id	To Do	Bakım	38	updated	2026-04-16 11:02:29.784123+00	{"sprint": null, "phase_transition": true}
531	task	280	assignee_id	\N	38	12	updated	2026-04-15 12:02:29.784123+00	\N
532	task	280	status	Bakım	Done	38	completed	2026-04-24 11:02:29.784123+00	\N
533	task	281	status	\N	Open	12	created	2026-03-15 11:02:29.794133+00	\N
534	task	282	status	\N	Open	39	created	2026-04-13 11:02:29.802863+00	\N
535	task	283	status	\N	Open	39	created	2026-04-14 11:02:29.806111+00	\N
536	task	284	status	\N	Open	39	created	2026-04-15 11:02:29.81124+00	\N
537	task	284	column_id	To Do	Analiz	45	updated	2026-04-20 11:02:29.81124+00	{"sprint": null, "phase_transition": true}
538	task	284	assignee_id	\N	45	12	updated	2026-04-15 11:44:29.81124+00	\N
539	task	285	status	\N	Open	39	created	2026-04-19 11:02:29.816778+00	\N
540	task	286	status	\N	Open	39	created	2026-04-17 11:02:29.824602+00	\N
541	task	287	status	\N	Open	39	created	2026-04-14 11:02:29.83166+00	\N
542	task	287	column_id	To Do	Tasarım	82	updated	2026-04-19 11:02:29.83166+00	{"sprint": null, "phase_transition": true}
543	task	287	assignee_id	\N	82	12	updated	2026-04-14 12:00:29.83166+00	\N
544	task	288	status	\N	Open	12	created	2026-03-17 11:02:29.838782+00	\N
545	task	289	status	\N	Open	13	created	2026-04-21 11:02:29.847448+00	\N
546	task	289	column_id	To Do	Tasarım	96	updated	2026-04-26 11:02:29.847448+00	{"sprint": null, "phase_transition": true}
547	task	289	assignee_id	\N	96	12	updated	2026-04-21 11:45:29.847448+00	\N
548	task	290	status	\N	Open	13	created	2026-04-14 11:02:29.851074+00	\N
549	task	290	column_id	To Do	Bakım	82	updated	2026-04-19 11:02:29.851074+00	{"sprint": null, "phase_transition": true}
550	task	290	assignee_id	\N	82	12	updated	2026-04-14 11:38:29.851074+00	\N
551	task	290	status	Bakım	Done	82	completed	2026-04-21 11:02:29.851074+00	\N
552	task	291	status	\N	Open	13	created	2026-04-18 11:02:29.860373+00	\N
553	task	291	column_id	To Do	Uygulama	52	updated	2026-04-20 11:02:29.860373+00	{"sprint": null, "phase_transition": true}
554	task	291	assignee_id	\N	52	12	updated	2026-04-18 11:57:29.860373+00	\N
555	task	292	status	\N	Open	13	created	2026-04-25 11:02:29.870555+00	\N
556	task	293	status	\N	Open	13	created	2026-04-15 11:02:29.877558+00	\N
557	task	293	column_id	To Do	Uygulama	39	updated	2026-04-17 11:02:29.877558+00	{"sprint": null, "phase_transition": true}
558	task	293	assignee_id	\N	39	12	updated	2026-04-15 11:36:29.877558+00	\N
559	task	294	status	\N	Open	13	created	2026-04-19 11:02:29.882024+00	\N
560	task	294	column_id	To Do	Analiz	13	updated	2026-04-20 11:02:29.882024+00	{"sprint": null, "phase_transition": true}
561	task	294	assignee_id	\N	13	12	updated	2026-04-19 11:07:29.882024+00	\N
562	task	295	status	\N	Open	13	created	2026-03-17 11:02:29.909269+00	\N
563	task	296	status	\N	Open	61	created	2026-04-16 11:02:29.911693+00	\N
564	task	296	column_id	To Do	Done	60	updated	2026-04-19 11:02:29.911693+00	{"sprint": "Sprint 2", "phase_transition": true}
565	task	296	assignee_id	\N	60	13	updated	2026-04-16 11:47:29.911693+00	\N
566	task	296	status	Done	Done	60	completed	2026-04-30 11:02:29.911693+00	\N
567	task	297	status	\N	Open	61	created	2026-04-12 11:02:29.91591+00	\N
568	task	298	status	\N	Open	61	created	2026-04-10 11:02:29.924651+00	\N
569	task	299	status	\N	Open	61	created	2026-04-15 11:02:29.930925+00	\N
570	task	299	column_id	To Do	Done	46	updated	2026-04-19 11:02:29.930925+00	{"sprint": "Sprint 2", "phase_transition": true}
571	task	299	assignee_id	\N	46	13	updated	2026-04-15 11:59:29.930925+00	\N
572	task	299	status	Done	Done	46	completed	2026-04-26 11:02:29.930925+00	\N
573	task	300	status	\N	Open	13	created	2026-03-12 11:02:29.93764+00	\N
574	task	301	status	\N	Open	13	created	2026-04-12 11:02:29.946405+00	\N
575	task	301	column_id	To Do	Done	46	updated	2026-04-17 11:02:29.946405+00	{"sprint": "Sprint 2", "phase_transition": true}
576	task	301	assignee_id	\N	46	13	updated	2026-04-12 11:34:29.946405+00	\N
577	task	301	status	Done	Done	46	completed	2026-04-19 11:02:29.946405+00	\N
578	task	302	status	\N	Open	13	created	2026-04-13 11:02:29.949887+00	\N
579	task	303	status	\N	Open	13	created	2026-04-14 11:02:29.958711+00	\N
580	task	303	column_id	To Do	Code Review	35	updated	2026-04-15 11:02:29.958711+00	{"sprint": "Sprint 2", "phase_transition": true}
581	task	303	assignee_id	\N	35	13	updated	2026-04-14 11:14:29.958711+00	\N
582	task	304	status	\N	Open	13	created	2026-04-19 11:02:29.965194+00	\N
583	task	305	status	\N	Open	13	created	2026-04-19 11:02:29.974492+00	\N
584	task	305	column_id	To Do	Done	61	updated	2026-04-21 11:02:29.974492+00	{"sprint": "Sprint 2", "phase_transition": true}
585	task	305	assignee_id	\N	61	13	updated	2026-04-19 11:52:29.974492+00	\N
586	task	305	status	Done	Done	61	completed	2026-04-25 11:02:29.974492+00	\N
587	task	306	status	\N	Open	13	created	2026-04-25 11:02:29.980947+00	\N
588	task	306	column_id	To Do	In Progress	60	updated	2026-04-29 11:02:29.980947+00	{"sprint": "Sprint 2", "phase_transition": true}
589	task	306	assignee_id	\N	60	13	updated	2026-04-25 11:53:29.980947+00	\N
590	task	307	status	\N	Open	13	created	2026-03-20 11:02:29.990138+00	\N
591	task	308	status	\N	Open	61	created	2026-04-25 11:02:29.998641+00	\N
592	task	309	status	\N	Open	61	created	2026-04-23 11:02:30.002347+00	\N
593	task	309	column_id	To Do	Code Review	6	updated	2026-04-26 11:02:30.002347+00	{"sprint": "Sprint 3", "phase_transition": true}
594	task	309	assignee_id	\N	6	13	updated	2026-04-23 11:19:30.002347+00	\N
595	task	310	status	\N	Open	61	created	2026-04-13 11:02:30.008274+00	\N
596	task	310	column_id	To Do	Done	46	updated	2026-04-16 11:02:30.008274+00	{"sprint": "Sprint 3", "phase_transition": true}
597	task	310	assignee_id	\N	46	13	updated	2026-04-13 11:45:30.008274+00	\N
598	task	310	status	Done	Done	46	completed	2026-04-22 11:02:30.008274+00	\N
599	task	311	status	\N	Open	61	created	2026-04-25 11:02:30.01749+00	\N
600	task	311	column_id	To Do	Code Review	61	updated	2026-04-30 11:02:30.01749+00	{"sprint": "Sprint 3", "phase_transition": true}
601	task	311	assignee_id	\N	61	13	updated	2026-04-25 11:36:30.01749+00	\N
602	task	312	status	\N	Open	61	created	2026-04-13 11:02:30.027282+00	\N
603	task	312	column_id	To Do	Done	29	updated	2026-04-14 11:02:30.027282+00	{"sprint": "Sprint 3", "phase_transition": true}
604	task	312	assignee_id	\N	29	13	updated	2026-04-13 11:55:30.027282+00	\N
605	task	312	status	Done	Done	29	completed	2026-04-18 11:02:30.027282+00	\N
606	task	313	status	\N	Open	13	created	2026-03-15 11:02:30.035941+00	\N
607	task	314	status	\N	Open	6	created	2026-04-26 11:02:30.045523+00	\N
608	task	314	column_id	To Do	Code Review	29	updated	2026-04-30 11:02:30.045523+00	{"sprint": "Sprint 2", "phase_transition": true}
609	task	314	assignee_id	\N	29	13	updated	2026-04-26 11:40:30.045523+00	\N
610	task	315	status	\N	Open	6	created	2026-04-16 11:02:30.04883+00	\N
611	task	315	column_id	To Do	Done	35	updated	2026-04-17 11:02:30.04883+00	{"sprint": "Sprint 2", "phase_transition": true}
612	task	315	assignee_id	\N	35	13	updated	2026-04-16 11:35:30.04883+00	\N
613	task	315	status	Done	Done	35	completed	2026-04-30 11:02:30.04883+00	\N
614	task	316	status	\N	Open	6	created	2026-04-11 11:02:30.05818+00	\N
615	task	316	column_id	To Do	Done	6	updated	2026-04-12 11:02:30.05818+00	{"sprint": "Sprint 2", "phase_transition": true}
616	task	316	assignee_id	\N	6	13	updated	2026-04-11 11:49:30.05818+00	\N
617	task	316	status	Done	Done	6	completed	2026-04-19 11:02:30.05818+00	\N
618	task	317	status	\N	Open	6	created	2026-04-16 11:02:30.067259+00	\N
619	task	318	status	\N	Open	6	created	2026-04-25 11:02:30.07645+00	\N
620	task	318	column_id	To Do	In Progress	46	updated	2026-04-26 11:02:30.07645+00	{"sprint": "Sprint 2", "phase_transition": true}
621	task	318	assignee_id	\N	46	13	updated	2026-04-25 11:40:30.07645+00	\N
622	task	319	status	\N	Open	6	created	2026-04-14 11:02:30.081639+00	\N
623	task	320	status	\N	Open	13	created	2026-04-05 11:02:30.088904+00	\N
624	task	321	status	\N	Open	35	created	2026-04-15 11:02:30.095166+00	\N
625	task	321	column_id	To Do	Done	35	updated	2026-04-19 11:02:30.095166+00	{"sprint": "Sprint 1", "phase_transition": true}
626	task	321	assignee_id	\N	35	13	updated	2026-04-15 11:40:30.095166+00	\N
627	task	321	status	Done	Done	35	completed	2026-04-22 11:02:30.095166+00	\N
628	task	322	status	\N	Open	35	created	2026-04-23 11:02:30.099246+00	\N
629	task	323	status	\N	Open	35	created	2026-04-11 11:02:30.108081+00	\N
630	task	324	status	\N	Open	13	created	2026-03-22 11:02:30.115236+00	\N
631	task	325	status	\N	Open	6	created	2026-04-22 11:02:30.143219+00	\N
632	task	325	column_id	To Do	Done	46	updated	2026-04-27 11:02:30.143219+00	{"sprint": "Sprint 1", "phase_transition": true}
633	task	325	assignee_id	\N	46	13	updated	2026-04-22 11:17:30.143219+00	\N
634	task	325	status	Done	Done	46	completed	2026-04-29 11:02:30.143219+00	\N
635	task	326	status	\N	Open	6	created	2026-04-23 11:02:30.150589+00	\N
636	task	327	status	\N	Open	6	created	2026-04-10 11:02:30.161389+00	\N
637	task	328	status	\N	Open	6	created	2026-04-12 11:02:30.171868+00	\N
638	task	328	column_id	To Do	Done	60	updated	2026-04-17 11:02:30.171868+00	{"sprint": "Sprint 1", "phase_transition": true}
639	task	328	assignee_id	\N	60	13	updated	2026-04-12 12:00:30.171868+00	\N
640	task	328	status	Done	Done	60	completed	2026-04-19 11:02:30.171868+00	\N
641	task	329	status	\N	Open	14	created	2026-03-14 11:02:30.196428+00	\N
642	task	330	status	\N	Open	77	created	2026-04-13 11:02:30.198732+00	\N
643	task	330	column_id	To Do	Test	11	updated	2026-04-18 11:02:30.198732+00	{"sprint": null, "phase_transition": true}
644	task	330	assignee_id	\N	11	14	updated	2026-04-13 11:12:30.198732+00	\N
645	task	331	status	\N	Open	77	created	2026-04-26 11:02:30.202462+00	\N
646	task	331	column_id	To Do	Test	60	updated	2026-04-28 11:02:30.202462+00	{"sprint": null, "phase_transition": true}
647	task	331	assignee_id	\N	60	14	updated	2026-04-26 11:14:30.202462+00	\N
648	task	332	status	\N	Open	77	created	2026-04-22 11:02:30.212116+00	\N
649	task	332	column_id	To Do	Analiz	11	updated	2026-04-27 11:02:30.212116+00	{"sprint": null, "phase_transition": true}
650	task	332	assignee_id	\N	11	14	updated	2026-04-22 11:23:30.212116+00	\N
651	task	333	status	\N	Open	77	created	2026-04-21 11:02:30.219983+00	\N
652	task	334	status	\N	Open	77	created	2026-04-16 11:02:30.22846+00	\N
653	task	334	column_id	To Do	Geliştirme	77	updated	2026-04-18 11:02:30.22846+00	{"sprint": null, "phase_transition": true}
654	task	334	assignee_id	\N	77	14	updated	2026-04-16 11:41:30.22846+00	\N
655	task	335	status	\N	Open	14	created	2026-04-08 11:02:30.233628+00	\N
656	task	336	status	\N	Open	57	created	2026-04-12 11:02:30.241323+00	\N
657	task	336	column_id	To Do	Analiz	30	updated	2026-04-13 11:02:30.241323+00	{"sprint": null, "phase_transition": true}
658	task	336	assignee_id	\N	30	14	updated	2026-04-12 11:13:30.241323+00	\N
659	task	337	status	\N	Open	57	created	2026-04-18 11:02:30.245063+00	\N
660	task	337	column_id	To Do	Analiz	57	updated	2026-04-20 11:02:30.245063+00	{"sprint": null, "phase_transition": true}
661	task	337	assignee_id	\N	57	14	updated	2026-04-18 11:23:30.245063+00	\N
662	task	338	status	\N	Open	57	created	2026-04-11 11:02:30.252502+00	\N
663	task	338	column_id	To Do	Geliştirme	62	updated	2026-04-14 11:02:30.252502+00	{"sprint": null, "phase_transition": true}
664	task	338	assignee_id	\N	62	14	updated	2026-04-11 11:54:30.252502+00	\N
665	task	339	status	\N	Open	14	created	2026-03-22 11:02:30.261168+00	\N
666	task	340	status	\N	Open	57	created	2026-04-20 11:02:30.27012+00	\N
667	task	341	status	\N	Open	57	created	2026-04-19 11:02:30.273888+00	\N
668	task	341	column_id	To Do	Geliştirme	62	updated	2026-04-23 11:02:30.273888+00	{"sprint": null, "phase_transition": true}
669	task	341	assignee_id	\N	62	14	updated	2026-04-19 11:36:30.273888+00	\N
670	task	342	status	\N	Open	57	created	2026-04-23 11:02:30.278382+00	\N
671	task	342	column_id	To Do	Analiz	60	updated	2026-04-24 11:02:30.278382+00	{"sprint": null, "phase_transition": true}
672	task	342	assignee_id	\N	60	14	updated	2026-04-23 11:26:30.278382+00	\N
673	task	343	status	\N	Open	57	created	2026-04-10 11:02:30.287543+00	\N
674	task	343	column_id	To Do	Done	42	updated	2026-04-13 11:02:30.287543+00	{"sprint": null, "phase_transition": true}
675	task	343	assignee_id	\N	42	14	updated	2026-04-10 11:11:30.287543+00	\N
676	task	343	status	Done	Done	42	completed	2026-04-22 11:02:30.287543+00	\N
677	task	344	status	\N	Open	57	created	2026-04-11 11:02:30.297112+00	\N
678	task	345	status	\N	Open	57	created	2026-04-22 11:02:30.307479+00	\N
679	task	346	status	\N	Open	14	created	2026-04-04 11:02:30.312288+00	\N
680	task	347	status	\N	Open	30	created	2026-04-19 11:02:30.318968+00	\N
681	task	348	status	\N	Open	30	created	2026-04-11 11:02:30.322862+00	\N
682	task	348	column_id	To Do	Done	62	updated	2026-04-15 11:02:30.322862+00	{"sprint": null, "phase_transition": true}
683	task	348	assignee_id	\N	62	14	updated	2026-04-11 11:40:30.322862+00	\N
684	task	348	status	Done	Done	62	completed	2026-04-19 11:02:30.322862+00	\N
685	task	349	status	\N	Open	30	created	2026-04-12 11:02:30.327482+00	\N
686	task	350	status	\N	Open	30	created	2026-04-24 11:02:30.337121+00	\N
687	task	350	column_id	To Do	Done	30	updated	2026-04-28 11:02:30.337121+00	{"sprint": null, "phase_transition": true}
688	task	350	assignee_id	\N	30	14	updated	2026-04-24 11:54:30.337121+00	\N
689	task	350	status	Done	Done	30	completed	2026-05-09 11:02:30.337121+00	\N
690	task	351	status	\N	Open	30	created	2026-04-17 11:02:30.341692+00	\N
691	task	352	status	\N	Open	14	created	2026-04-08 11:02:30.351347+00	\N
692	task	353	status	\N	Open	30	created	2026-04-13 11:02:30.356493+00	\N
693	task	353	column_id	To Do	Test	60	updated	2026-04-16 11:02:30.356493+00	{"sprint": null, "phase_transition": true}
694	task	353	assignee_id	\N	60	14	updated	2026-04-13 11:51:30.356493+00	\N
695	task	354	status	\N	Open	30	created	2026-04-19 11:02:30.359757+00	\N
696	task	354	column_id	To Do	Done	77	updated	2026-04-21 11:02:30.359757+00	{"sprint": null, "phase_transition": true}
697	task	354	assignee_id	\N	77	14	updated	2026-04-19 11:29:30.359757+00	\N
698	task	354	status	Done	Done	77	completed	2026-04-30 11:02:30.359757+00	\N
699	task	355	status	\N	Open	30	created	2026-04-20 11:02:30.367269+00	\N
700	task	355	column_id	To Do	Done	42	updated	2026-04-25 11:02:30.367269+00	{"sprint": null, "phase_transition": true}
701	task	355	assignee_id	\N	42	14	updated	2026-04-20 11:25:30.367269+00	\N
702	task	355	status	Done	Done	42	completed	2026-04-26 11:02:30.367269+00	\N
703	task	356	status	\N	Open	30	created	2026-04-22 11:02:30.375804+00	\N
704	task	356	column_id	To Do	Analiz	60	updated	2026-04-24 11:02:30.375804+00	{"sprint": null, "phase_transition": true}
705	task	356	assignee_id	\N	60	14	updated	2026-04-22 11:55:30.375804+00	\N
706	task	357	status	\N	Open	30	created	2026-04-26 11:02:30.385518+00	\N
707	task	357	column_id	To Do	Done	77	updated	2026-04-28 11:02:30.385518+00	{"sprint": null, "phase_transition": true}
708	task	357	assignee_id	\N	77	14	updated	2026-04-26 11:17:30.385518+00	\N
709	task	357	status	Done	Done	77	completed	2026-05-07 11:02:30.385518+00	\N
710	task	358	status	\N	Open	30	created	2026-04-24 11:02:30.394497+00	\N
711	task	358	column_id	To Do	Geliştirme	30	updated	2026-04-27 11:02:30.394497+00	{"sprint": null, "phase_transition": true}
712	task	358	assignee_id	\N	30	14	updated	2026-04-24 11:57:30.394497+00	\N
713	task	359	status	\N	Open	15	created	2026-03-14 11:02:30.418765+00	\N
714	task	360	status	\N	Open	68	created	2026-04-11 11:02:30.420959+00	\N
715	task	361	status	\N	Open	68	created	2026-04-17 11:02:30.42464+00	\N
716	task	361	column_id	To Do	Bakım	16	updated	2026-04-19 11:02:30.42464+00	{"sprint": null, "phase_transition": true}
717	task	361	assignee_id	\N	16	15	updated	2026-04-17 11:35:30.42464+00	\N
718	task	361	status	Bakım	Done	16	completed	2026-04-26 11:02:30.42464+00	\N
719	task	362	status	\N	Open	68	created	2026-04-18 11:02:30.429372+00	\N
720	task	362	column_id	To Do	Uygulama	15	updated	2026-04-22 11:02:30.429372+00	{"sprint": null, "phase_transition": true}
721	task	362	assignee_id	\N	15	15	updated	2026-04-18 11:08:30.429372+00	\N
722	task	363	status	\N	Open	68	created	2026-04-13 11:02:30.439021+00	\N
723	task	364	status	\N	Open	15	created	2026-04-03 11:02:30.448772+00	\N
724	task	365	status	\N	Open	21	created	2026-04-14 11:02:30.456132+00	\N
725	task	365	column_id	To Do	Test	1	updated	2026-04-16 11:02:30.456132+00	{"sprint": null, "phase_transition": true}
726	task	365	assignee_id	\N	1	15	updated	2026-04-14 11:46:30.456132+00	\N
727	task	366	status	\N	Open	21	created	2026-04-13 11:02:30.459254+00	\N
728	task	366	column_id	To Do	Uygulama	1	updated	2026-04-15 11:02:30.459254+00	{"sprint": null, "phase_transition": true}
729	task	366	assignee_id	\N	1	15	updated	2026-04-13 11:21:30.459254+00	\N
730	task	367	status	\N	Open	21	created	2026-04-25 11:02:30.46627+00	\N
731	task	367	column_id	To Do	Bakım	1	updated	2026-04-27 11:02:30.46627+00	{"sprint": null, "phase_transition": true}
732	task	367	assignee_id	\N	1	15	updated	2026-04-25 11:36:30.46627+00	\N
733	task	367	status	Bakım	Done	1	completed	2026-05-06 11:02:30.46627+00	\N
734	task	368	status	\N	Open	21	created	2026-04-14 11:02:30.475046+00	\N
735	task	368	column_id	To Do	Bakım	85	updated	2026-04-19 11:02:30.475046+00	{"sprint": null, "phase_transition": true}
736	task	368	assignee_id	\N	85	15	updated	2026-04-14 11:28:30.475046+00	\N
737	task	368	status	Bakım	Done	85	completed	2026-04-29 11:02:30.475046+00	\N
738	task	369	status	\N	Open	15	created	2026-03-16 11:02:30.484171+00	\N
739	task	370	status	\N	Open	67	created	2026-04-18 11:02:30.494578+00	\N
740	task	370	column_id	To Do	Test	67	updated	2026-04-20 11:02:30.494578+00	{"sprint": null, "phase_transition": true}
741	task	370	assignee_id	\N	67	15	updated	2026-04-18 11:34:30.494578+00	\N
742	task	371	status	\N	Open	67	created	2026-04-18 11:02:30.498211+00	\N
743	task	371	column_id	To Do	Tasarım	16	updated	2026-04-19 11:02:30.498211+00	{"sprint": null, "phase_transition": true}
744	task	371	assignee_id	\N	16	15	updated	2026-04-18 11:39:30.498211+00	\N
745	task	372	status	\N	Open	67	created	2026-04-21 11:02:30.505393+00	\N
746	task	372	column_id	To Do	Test	16	updated	2026-04-26 11:02:30.505393+00	{"sprint": null, "phase_transition": true}
747	task	372	assignee_id	\N	16	15	updated	2026-04-21 11:46:30.505393+00	\N
748	task	373	status	\N	Open	67	created	2026-04-16 11:02:30.512562+00	\N
749	task	373	column_id	To Do	Analiz	21	updated	2026-04-17 11:02:30.512562+00	{"sprint": null, "phase_transition": true}
750	task	373	assignee_id	\N	21	15	updated	2026-04-16 11:31:30.512562+00	\N
751	task	374	status	\N	Open	67	created	2026-04-26 11:02:30.521232+00	\N
752	task	374	column_id	To Do	Test	9	updated	2026-05-01 11:02:30.521232+00	{"sprint": null, "phase_transition": true}
753	task	374	assignee_id	\N	9	15	updated	2026-04-26 11:24:30.521232+00	\N
754	task	375	status	\N	Open	67	created	2026-04-15 11:02:30.530302+00	\N
755	task	375	column_id	To Do	Uygulama	21	updated	2026-04-17 11:02:30.530302+00	{"sprint": null, "phase_transition": true}
756	task	375	assignee_id	\N	21	15	updated	2026-04-15 11:51:30.530302+00	\N
757	task	376	status	\N	Open	15	created	2026-04-01 11:02:30.539028+00	\N
758	task	377	status	\N	Open	68	created	2026-04-10 11:02:30.547607+00	\N
759	task	377	column_id	To Do	Bakım	1	updated	2026-04-15 11:02:30.547607+00	{"sprint": null, "phase_transition": true}
760	task	377	assignee_id	\N	1	15	updated	2026-04-10 11:46:30.547607+00	\N
761	task	377	status	Bakım	Done	1	completed	2026-04-24 11:02:30.547607+00	\N
762	task	378	status	\N	Open	68	created	2026-04-21 11:02:30.551273+00	\N
763	task	378	column_id	To Do	Bakım	68	updated	2026-04-25 11:02:30.551273+00	{"sprint": null, "phase_transition": true}
764	task	378	assignee_id	\N	68	15	updated	2026-04-21 11:20:30.551273+00	\N
765	task	378	status	Bakım	Done	68	completed	2026-04-27 11:02:30.551273+00	\N
766	task	379	status	\N	Open	68	created	2026-04-20 11:02:30.561909+00	\N
767	task	380	status	\N	Open	68	created	2026-04-26 11:02:30.571804+00	\N
768	task	380	column_id	To Do	Test	10	updated	2026-04-27 11:02:30.571804+00	{"sprint": null, "phase_transition": true}
769	task	380	assignee_id	\N	10	15	updated	2026-04-26 11:19:30.571804+00	\N
770	task	381	status	\N	Open	68	created	2026-04-24 11:02:30.580876+00	\N
771	task	381	column_id	To Do	Analiz	21	updated	2026-04-25 11:02:30.580876+00	{"sprint": null, "phase_transition": true}
772	task	381	assignee_id	\N	21	15	updated	2026-04-24 11:40:30.580876+00	\N
773	task	382	status	\N	Open	15	created	2026-03-27 11:02:30.595372+00	\N
774	task	383	status	\N	Open	68	created	2026-04-21 11:02:30.604256+00	\N
775	task	384	status	\N	Open	68	created	2026-04-25 11:02:30.609462+00	\N
776	task	384	column_id	To Do	Analiz	9	updated	2026-04-26 11:02:30.609462+00	{"sprint": null, "phase_transition": true}
777	task	384	assignee_id	\N	9	15	updated	2026-04-25 11:14:30.609462+00	\N
778	task	385	status	\N	Open	68	created	2026-04-26 11:02:30.618738+00	\N
779	task	385	column_id	To Do	Analiz	9	updated	2026-04-29 11:02:30.618738+00	{"sprint": null, "phase_transition": true}
780	task	385	assignee_id	\N	9	15	updated	2026-04-26 11:25:30.618738+00	\N
781	task	386	status	\N	Open	68	created	2026-04-17 11:02:30.628742+00	\N
782	task	387	status	\N	Open	68	created	2026-04-22 11:02:30.63664+00	\N
783	task	387	column_id	To Do	Analiz	85	updated	2026-04-23 11:02:30.63664+00	{"sprint": null, "phase_transition": true}
784	task	387	assignee_id	\N	85	15	updated	2026-04-22 11:50:30.63664+00	\N
785	task	388	status	\N	Open	68	created	2026-04-23 11:02:30.643612+00	\N
786	task	388	column_id	To Do	Bakım	15	updated	2026-04-24 11:02:30.643612+00	{"sprint": null, "phase_transition": true}
787	task	388	assignee_id	\N	15	15	updated	2026-04-23 11:43:30.643612+00	\N
788	task	388	status	Bakım	Done	15	completed	2026-05-01 11:02:30.643612+00	\N
789	task	389	status	\N	Open	16	created	2026-04-05 11:02:30.668565+00	\N
790	task	390	status	\N	Open	82	created	2026-04-18 11:02:30.670936+00	\N
791	task	390	column_id	To Do	Bakım	82	updated	2026-04-21 11:02:30.670936+00	{"sprint": null, "phase_transition": true}
792	task	390	assignee_id	\N	82	16	updated	2026-04-18 11:45:30.670936+00	\N
793	task	390	status	Bakım	Done	82	completed	2026-05-02 11:02:30.670936+00	\N
794	task	391	status	\N	Open	82	created	2026-04-11 11:02:30.674562+00	\N
795	task	391	column_id	To Do	Analiz	76	updated	2026-04-15 11:02:30.674562+00	{"sprint": null, "phase_transition": true}
796	task	391	assignee_id	\N	76	16	updated	2026-04-11 11:56:30.674562+00	\N
797	task	392	status	\N	Open	82	created	2026-04-23 11:02:30.684985+00	\N
798	task	393	status	\N	Open	82	created	2026-04-12 11:02:30.695533+00	\N
799	task	393	column_id	To Do	Uygulama	16	updated	2026-04-17 11:02:30.695533+00	{"sprint": null, "phase_transition": true}
800	task	393	assignee_id	\N	16	16	updated	2026-04-12 11:08:30.695533+00	\N
801	task	394	status	\N	Open	82	created	2026-04-26 11:02:30.700646+00	\N
802	task	394	column_id	To Do	Tasarım	47	updated	2026-04-29 11:02:30.700646+00	{"sprint": null, "phase_transition": true}
803	task	394	assignee_id	\N	47	16	updated	2026-04-26 11:24:30.700646+00	\N
804	task	395	status	\N	Open	16	created	2026-03-18 11:02:30.709276+00	\N
805	task	396	status	\N	Open	3	created	2026-04-15 11:02:30.718387+00	\N
806	task	396	column_id	To Do	Test	42	updated	2026-04-18 11:02:30.718387+00	{"sprint": null, "phase_transition": true}
807	task	396	assignee_id	\N	42	16	updated	2026-04-15 11:59:30.718387+00	\N
808	task	397	status	\N	Open	3	created	2026-04-14 11:02:30.722142+00	\N
809	task	397	column_id	To Do	Tasarım	76	updated	2026-04-18 11:02:30.722142+00	{"sprint": null, "phase_transition": true}
810	task	397	assignee_id	\N	76	16	updated	2026-04-14 11:26:30.722142+00	\N
811	task	398	status	\N	Open	3	created	2026-04-25 11:02:30.732327+00	\N
812	task	398	column_id	To Do	Analiz	25	updated	2026-04-26 11:02:30.732327+00	{"sprint": null, "phase_transition": true}
813	task	398	assignee_id	\N	25	16	updated	2026-04-25 11:58:30.732327+00	\N
814	task	399	status	\N	Open	3	created	2026-04-22 11:02:30.739942+00	\N
815	task	399	column_id	To Do	Tasarım	47	updated	2026-04-25 11:02:30.739942+00	{"sprint": null, "phase_transition": true}
816	task	399	assignee_id	\N	47	16	updated	2026-04-22 11:07:30.739942+00	\N
817	task	400	status	\N	Open	3	created	2026-04-21 11:02:30.752269+00	\N
818	task	400	column_id	To Do	Uygulama	16	updated	2026-04-26 11:02:30.752269+00	{"sprint": null, "phase_transition": true}
819	task	400	assignee_id	\N	16	16	updated	2026-04-21 11:34:30.752269+00	\N
820	task	401	status	\N	Open	16	created	2026-03-14 11:02:30.760018+00	\N
821	task	402	status	\N	Open	47	created	2026-04-18 11:02:30.767663+00	\N
822	task	402	column_id	To Do	Bakım	47	updated	2026-04-20 11:02:30.767663+00	{"sprint": null, "phase_transition": true}
823	task	402	assignee_id	\N	47	16	updated	2026-04-18 11:16:30.767663+00	\N
824	task	402	status	Bakım	Done	47	completed	2026-04-26 11:02:30.767663+00	\N
825	task	403	status	\N	Open	47	created	2026-04-10 11:02:30.771374+00	\N
826	task	403	column_id	To Do	Test	37	updated	2026-04-15 11:02:30.771374+00	{"sprint": null, "phase_transition": true}
827	task	403	assignee_id	\N	37	16	updated	2026-04-10 11:44:30.771374+00	\N
828	task	404	status	\N	Open	47	created	2026-04-18 11:02:30.781067+00	\N
829	task	404	column_id	To Do	Test	37	updated	2026-04-23 11:02:30.781067+00	{"sprint": null, "phase_transition": true}
830	task	404	assignee_id	\N	37	16	updated	2026-04-18 11:35:30.781067+00	\N
831	task	405	status	\N	Open	16	created	2026-04-09 11:02:30.790389+00	\N
832	task	406	status	\N	Open	37	created	2026-04-16 11:02:30.798421+00	\N
833	task	406	column_id	To Do	Test	76	updated	2026-04-21 11:02:30.798421+00	{"sprint": null, "phase_transition": true}
834	task	406	assignee_id	\N	76	16	updated	2026-04-16 11:24:30.798421+00	\N
835	task	407	status	\N	Open	37	created	2026-04-19 11:02:30.802445+00	\N
836	task	407	column_id	To Do	Test	47	updated	2026-04-20 11:02:30.802445+00	{"sprint": null, "phase_transition": true}
837	task	407	assignee_id	\N	47	16	updated	2026-04-19 11:42:30.802445+00	\N
838	task	408	status	\N	Open	37	created	2026-04-22 11:02:30.811283+00	\N
839	task	408	column_id	To Do	Analiz	76	updated	2026-04-26 11:02:30.811283+00	{"sprint": null, "phase_transition": true}
840	task	408	assignee_id	\N	76	16	updated	2026-04-22 11:10:30.811283+00	\N
841	task	409	status	\N	Open	37	created	2026-04-11 11:02:30.819703+00	\N
842	task	410	status	\N	Open	37	created	2026-04-25 11:02:30.82834+00	\N
843	task	410	column_id	To Do	Tasarım	3	updated	2026-04-30 11:02:30.82834+00	{"sprint": null, "phase_transition": true}
844	task	410	assignee_id	\N	3	16	updated	2026-04-25 11:14:30.82834+00	\N
845	task	411	status	\N	Open	37	created	2026-04-13 11:02:30.835726+00	\N
846	task	411	column_id	To Do	Test	37	updated	2026-04-18 11:02:30.835726+00	{"sprint": null, "phase_transition": true}
847	task	411	assignee_id	\N	37	16	updated	2026-04-13 11:34:30.835726+00	\N
848	task	412	status	\N	Open	16	created	2026-03-29 11:02:30.845825+00	\N
849	task	413	status	\N	Open	82	created	2026-04-23 11:02:30.85322+00	\N
850	task	413	column_id	To Do	Test	47	updated	2026-04-24 11:02:30.85322+00	{"sprint": null, "phase_transition": true}
851	task	413	assignee_id	\N	47	16	updated	2026-04-23 11:09:30.85322+00	\N
852	task	414	status	\N	Open	82	created	2026-04-13 11:02:30.856989+00	\N
853	task	414	column_id	To Do	Uygulama	25	updated	2026-04-14 11:02:30.856989+00	{"sprint": null, "phase_transition": true}
854	task	414	assignee_id	\N	25	16	updated	2026-04-13 11:48:30.856989+00	\N
855	task	415	status	\N	Open	82	created	2026-04-24 11:02:30.865681+00	\N
856	task	415	column_id	To Do	Test	47	updated	2026-04-27 11:02:30.865681+00	{"sprint": null, "phase_transition": true}
857	task	415	assignee_id	\N	47	16	updated	2026-04-24 11:28:30.865681+00	\N
858	task	416	status	\N	Open	17	created	2026-04-01 11:02:30.893631+00	\N
859	task	417	status	\N	Open	53	created	2026-04-26 11:02:30.895963+00	\N
860	task	417	column_id	To Do	Code Review	89	updated	2026-04-27 11:02:30.895963+00	{"sprint": "Sprint 2", "phase_transition": true}
861	task	417	assignee_id	\N	89	17	updated	2026-04-26 11:11:30.895963+00	\N
862	task	418	status	\N	Open	53	created	2026-04-23 11:02:30.900045+00	\N
863	task	418	column_id	To Do	In Progress	89	updated	2026-04-25 11:02:30.900045+00	{"sprint": "Sprint 2", "phase_transition": true}
864	task	418	assignee_id	\N	89	17	updated	2026-04-23 12:00:30.900045+00	\N
865	task	419	status	\N	Open	53	created	2026-04-22 11:02:30.908509+00	\N
866	task	420	status	\N	Open	53	created	2026-04-14 11:02:30.915678+00	\N
867	task	420	column_id	To Do	In Progress	57	updated	2026-04-17 11:02:30.915678+00	{"sprint": "Sprint 2", "phase_transition": true}
868	task	420	assignee_id	\N	57	17	updated	2026-04-14 11:54:30.915678+00	\N
869	task	421	status	\N	Open	17	created	2026-04-09 11:02:30.922129+00	\N
870	task	422	status	\N	Open	89	created	2026-04-26 11:02:30.928987+00	\N
871	task	422	column_id	To Do	Done	71	updated	2026-04-28 11:02:30.928987+00	{"sprint": "Sprint 1", "phase_transition": true}
872	task	422	assignee_id	\N	71	17	updated	2026-04-26 11:52:30.928987+00	\N
873	task	422	status	Done	Done	71	completed	2026-05-09 11:02:30.928987+00	\N
874	task	423	status	\N	Open	89	created	2026-04-25 11:02:30.93273+00	\N
875	task	423	column_id	To Do	Code Review	62	updated	2026-04-28 11:02:30.93273+00	{"sprint": "Sprint 1", "phase_transition": true}
876	task	423	assignee_id	\N	62	17	updated	2026-04-25 11:23:30.93273+00	\N
877	task	424	status	\N	Open	89	created	2026-04-10 11:02:30.941944+00	\N
878	task	424	column_id	To Do	Code Review	57	updated	2026-04-12 11:02:30.941944+00	{"sprint": "Sprint 1", "phase_transition": true}
879	task	424	assignee_id	\N	57	17	updated	2026-04-10 11:20:30.941944+00	\N
880	task	425	status	\N	Open	89	created	2026-04-24 11:02:30.948961+00	\N
881	task	425	column_id	To Do	Code Review	53	updated	2026-04-28 11:02:30.948961+00	{"sprint": "Sprint 1", "phase_transition": true}
882	task	425	assignee_id	\N	53	17	updated	2026-04-24 11:52:30.948961+00	\N
883	task	426	status	\N	Open	89	created	2026-04-25 11:02:30.957727+00	\N
884	task	427	status	\N	Open	89	created	2026-04-18 11:02:30.966324+00	\N
885	task	428	status	\N	Open	17	created	2026-03-18 11:02:30.97326+00	\N
886	task	429	status	\N	Open	71	created	2026-04-14 11:02:30.97963+00	\N
887	task	430	status	\N	Open	71	created	2026-04-10 11:02:30.983461+00	\N
888	task	431	status	\N	Open	71	created	2026-04-17 11:02:30.987854+00	\N
889	task	432	status	\N	Open	17	created	2026-03-26 11:02:30.994223+00	\N
890	task	433	status	\N	Open	53	created	2026-04-13 11:02:31.000906+00	\N
891	task	433	column_id	To Do	Code Review	86	updated	2026-04-18 11:02:31.000906+00	{"sprint": "Sprint 3", "phase_transition": true}
892	task	433	assignee_id	\N	86	17	updated	2026-04-13 11:54:31.000906+00	\N
893	task	434	status	\N	Open	53	created	2026-04-19 11:02:31.004484+00	\N
894	task	435	status	\N	Open	53	created	2026-04-25 11:02:31.01303+00	\N
895	task	436	status	\N	Open	53	created	2026-04-14 11:02:31.019841+00	\N
896	task	436	column_id	To Do	Done	25	updated	2026-04-18 11:02:31.019841+00	{"sprint": "Sprint 3", "phase_transition": true}
897	task	436	assignee_id	\N	25	17	updated	2026-04-14 11:43:31.019841+00	\N
898	task	436	status	Done	Done	25	completed	2026-04-26 11:02:31.019841+00	\N
899	task	437	status	\N	Open	17	created	2026-03-28 11:02:31.026514+00	\N
900	task	438	status	\N	Open	89	created	2026-04-22 11:02:31.034004+00	\N
901	task	439	status	\N	Open	89	created	2026-04-11 11:02:31.037723+00	\N
902	task	439	column_id	To Do	In Progress	20	updated	2026-04-15 11:02:31.037723+00	{"sprint": "Sprint 2", "phase_transition": true}
903	task	439	assignee_id	\N	20	17	updated	2026-04-11 11:24:31.037723+00	\N
904	task	440	status	\N	Open	89	created	2026-04-18 11:02:31.042371+00	\N
905	task	441	status	\N	Open	89	created	2026-04-26 11:02:31.050183+00	\N
906	task	441	column_id	To Do	In Progress	57	updated	2026-04-28 11:02:31.050183+00	{"sprint": "Sprint 2", "phase_transition": true}
907	task	441	assignee_id	\N	57	17	updated	2026-04-26 11:54:31.050183+00	\N
908	task	442	status	\N	Open	89	created	2026-04-23 11:02:31.05547+00	\N
909	task	442	column_id	To Do	Code Review	53	updated	2026-04-28 11:02:31.05547+00	{"sprint": "Sprint 2", "phase_transition": true}
910	task	442	assignee_id	\N	53	17	updated	2026-04-23 11:33:31.05547+00	\N
911	task	443	status	\N	Open	17	created	2026-03-13 11:02:31.064562+00	\N
912	task	444	status	\N	Open	53	created	2026-04-15 11:02:31.073335+00	\N
913	task	444	column_id	To Do	Code Review	25	updated	2026-04-19 11:02:31.073335+00	{"sprint": "Sprint 2", "phase_transition": true}
914	task	444	assignee_id	\N	25	17	updated	2026-04-15 11:57:31.073335+00	\N
915	task	445	status	\N	Open	53	created	2026-04-23 11:02:31.076421+00	\N
916	task	445	column_id	To Do	Done	71	updated	2026-04-25 11:02:31.076421+00	{"sprint": "Sprint 2", "phase_transition": true}
917	task	445	assignee_id	\N	71	17	updated	2026-04-23 11:27:31.076421+00	\N
918	task	445	status	Done	Done	71	completed	2026-05-06 11:02:31.076421+00	\N
919	task	446	status	\N	Open	53	created	2026-04-21 11:02:31.083593+00	\N
920	task	447	status	\N	Open	53	created	2026-04-24 11:02:31.091209+00	\N
921	task	447	column_id	To Do	In Progress	62	updated	2026-04-28 11:02:31.091209+00	{"sprint": "Sprint 2", "phase_transition": true}
922	task	447	assignee_id	\N	62	17	updated	2026-04-24 11:16:31.091209+00	\N
923	task	448	status	\N	Open	53	created	2026-04-13 11:02:31.096426+00	\N
924	task	449	status	\N	Open	53	created	2026-04-23 11:02:31.104955+00	\N
925	task	450	status	\N	Open	18	created	2026-03-24 11:02:31.125343+00	\N
926	task	451	status	\N	Open	22	created	2026-04-10 11:02:31.127622+00	\N
927	task	452	status	\N	Open	22	created	2026-04-12 11:02:31.130936+00	\N
928	task	453	status	\N	Open	22	created	2026-04-22 11:02:31.138192+00	\N
929	task	453	column_id	To Do	Geliştirme	39	updated	2026-04-25 11:02:31.138192+00	{"sprint": null, "phase_transition": true}
930	task	453	assignee_id	\N	39	18	updated	2026-04-22 11:11:31.138192+00	\N
931	task	454	status	\N	Open	22	created	2026-04-16 11:02:31.144205+00	\N
932	task	454	column_id	To Do	Analiz	22	updated	2026-04-21 11:02:31.144205+00	{"sprint": null, "phase_transition": true}
933	task	454	assignee_id	\N	22	18	updated	2026-04-16 11:48:31.144205+00	\N
934	task	455	status	\N	Open	18	created	2026-03-10 11:02:31.152734+00	\N
935	task	456	status	\N	Open	76	created	2026-04-24 11:02:31.159202+00	\N
936	task	456	column_id	To Do	Done	88	updated	2026-04-27 11:02:31.159202+00	{"sprint": null, "phase_transition": true}
937	task	456	assignee_id	\N	88	18	updated	2026-04-24 11:23:31.159202+00	\N
938	task	456	status	Done	Done	88	completed	2026-05-06 11:02:31.159202+00	\N
939	task	457	status	\N	Open	76	created	2026-04-15 11:02:31.163159+00	\N
940	task	458	status	\N	Open	76	created	2026-04-11 11:02:31.17215+00	\N
941	task	458	column_id	To Do	Analiz	39	updated	2026-04-15 11:02:31.17215+00	{"sprint": null, "phase_transition": true}
942	task	458	assignee_id	\N	39	18	updated	2026-04-11 12:01:31.17215+00	\N
943	task	459	status	\N	Open	76	created	2026-04-23 11:02:31.178485+00	\N
944	task	460	status	\N	Open	76	created	2026-04-16 11:02:31.185434+00	\N
945	task	460	column_id	To Do	Analiz	76	updated	2026-04-20 11:02:31.185434+00	{"sprint": null, "phase_transition": true}
946	task	460	assignee_id	\N	76	18	updated	2026-04-16 11:21:31.185434+00	\N
947	task	461	status	\N	Open	18	created	2026-04-06 11:02:31.192035+00	\N
948	task	462	status	\N	Open	26	created	2026-04-16 11:02:31.198854+00	\N
949	task	462	column_id	To Do	Test	22	updated	2026-04-20 11:02:31.198854+00	{"sprint": null, "phase_transition": true}
950	task	462	assignee_id	\N	22	18	updated	2026-04-16 11:16:31.198854+00	\N
951	task	463	status	\N	Open	26	created	2026-04-24 11:02:31.201852+00	\N
952	task	463	column_id	To Do	Analiz	22	updated	2026-04-25 11:02:31.201852+00	{"sprint": null, "phase_transition": true}
953	task	463	assignee_id	\N	22	18	updated	2026-04-24 11:48:31.201852+00	\N
954	task	464	status	\N	Open	26	created	2026-04-23 11:02:31.209971+00	\N
955	task	464	column_id	To Do	Geliştirme	8	updated	2026-04-26 11:02:31.209971+00	{"sprint": null, "phase_transition": true}
956	task	464	assignee_id	\N	8	18	updated	2026-04-23 11:56:31.209971+00	\N
957	task	465	status	\N	Open	26	created	2026-04-25 11:02:31.219719+00	\N
958	task	465	column_id	To Do	Done	26	updated	2026-04-30 11:02:31.219719+00	{"sprint": null, "phase_transition": true}
959	task	465	assignee_id	\N	26	18	updated	2026-04-25 11:23:31.219719+00	\N
960	task	465	status	Done	Done	26	completed	2026-05-03 11:02:31.219719+00	\N
961	task	466	status	\N	Open	26	created	2026-04-15 11:02:31.22823+00	\N
962	task	466	column_id	To Do	Analiz	8	updated	2026-04-17 11:02:31.22823+00	{"sprint": null, "phase_transition": true}
963	task	466	assignee_id	\N	8	18	updated	2026-04-15 11:30:31.22823+00	\N
964	task	467	status	\N	Open	18	created	2026-03-19 11:02:31.240552+00	\N
965	task	468	status	\N	Open	26	created	2026-04-16 11:02:31.25243+00	\N
966	task	468	column_id	To Do	Test	8	updated	2026-04-17 11:02:31.25243+00	{"sprint": null, "phase_transition": true}
967	task	468	assignee_id	\N	8	18	updated	2026-04-16 11:08:31.25243+00	\N
968	task	469	status	\N	Open	26	created	2026-04-23 11:02:31.25631+00	\N
969	task	470	status	\N	Open	26	created	2026-04-10 11:02:31.265476+00	\N
970	task	470	column_id	To Do	Geliştirme	18	updated	2026-04-13 11:02:31.265476+00	{"sprint": null, "phase_transition": true}
971	task	470	assignee_id	\N	18	18	updated	2026-04-10 11:11:31.265476+00	\N
972	task	471	status	\N	Open	26	created	2026-04-19 11:02:31.272179+00	\N
973	task	472	status	\N	Open	18	created	2026-03-13 11:02:31.282979+00	\N
974	task	473	status	\N	Open	8	created	2026-04-13 11:02:31.289304+00	\N
975	task	473	column_id	To Do	Analiz	39	updated	2026-04-18 11:02:31.289304+00	{"sprint": null, "phase_transition": true}
976	task	473	assignee_id	\N	39	18	updated	2026-04-13 11:12:31.289304+00	\N
977	task	474	status	\N	Open	8	created	2026-04-11 11:02:31.292247+00	\N
978	task	474	column_id	To Do	Geliştirme	18	updated	2026-04-16 11:02:31.292247+00	{"sprint": null, "phase_transition": true}
979	task	474	assignee_id	\N	18	18	updated	2026-04-11 11:29:31.292247+00	\N
980	task	475	status	\N	Open	8	created	2026-04-18 11:02:31.299869+00	\N
981	task	476	status	\N	Open	8	created	2026-04-25 11:02:31.308233+00	\N
982	task	476	column_id	To Do	Analiz	39	updated	2026-04-29 11:02:31.308233+00	{"sprint": null, "phase_transition": true}
983	task	476	assignee_id	\N	39	18	updated	2026-04-25 11:25:31.308233+00	\N
984	task	477	status	\N	Open	18	created	2026-03-24 11:02:31.313776+00	\N
985	task	478	status	\N	Open	26	created	2026-04-13 11:02:31.322393+00	\N
986	task	478	column_id	To Do	Analiz	26	updated	2026-04-18 11:02:31.322393+00	{"sprint": null, "phase_transition": true}
987	task	478	assignee_id	\N	26	18	updated	2026-04-13 11:15:31.322393+00	\N
988	task	479	status	\N	Open	26	created	2026-04-11 11:02:31.325607+00	\N
989	task	479	column_id	To Do	Analiz	8	updated	2026-04-16 11:02:31.325607+00	{"sprint": null, "phase_transition": true}
990	task	479	assignee_id	\N	8	18	updated	2026-04-11 11:08:31.325607+00	\N
991	task	480	status	\N	Open	26	created	2026-04-13 11:02:31.332268+00	\N
992	task	480	column_id	To Do	Geliştirme	88	updated	2026-04-15 11:02:31.332268+00	{"sprint": null, "phase_transition": true}
993	task	480	assignee_id	\N	88	18	updated	2026-04-13 11:46:31.332268+00	\N
994	task	481	status	\N	Open	19	created	2026-03-19 11:02:31.359322+00	\N
995	task	482	status	\N	Open	80	created	2026-04-25 11:02:31.361443+00	\N
996	task	482	column_id	To Do	Code Review	80	updated	2026-04-28 11:02:31.361443+00	{"sprint": "Sprint 3", "phase_transition": true}
997	task	482	assignee_id	\N	80	19	updated	2026-04-25 12:01:31.361443+00	\N
998	task	483	status	\N	Open	80	created	2026-04-26 11:02:31.365251+00	\N
999	task	484	status	\N	Open	80	created	2026-04-14 11:02:31.373654+00	\N
1000	task	484	column_id	To Do	In Progress	58	updated	2026-04-16 11:02:31.373654+00	{"sprint": "Sprint 3", "phase_transition": true}
1001	task	484	assignee_id	\N	58	19	updated	2026-04-14 12:02:31.373654+00	\N
1002	task	485	status	\N	Open	80	created	2026-04-22 11:02:31.378771+00	\N
1003	task	485	column_id	To Do	In Progress	89	updated	2026-04-27 11:02:31.378771+00	{"sprint": "Sprint 3", "phase_transition": true}
1004	task	485	assignee_id	\N	89	19	updated	2026-04-22 11:59:31.378771+00	\N
1005	task	486	status	\N	Open	80	created	2026-04-10 11:02:31.387635+00	\N
1006	task	486	column_id	To Do	Code Review	66	updated	2026-04-14 11:02:31.387635+00	{"sprint": "Sprint 3", "phase_transition": true}
1007	task	486	assignee_id	\N	66	19	updated	2026-04-10 11:47:31.387635+00	\N
1008	task	487	status	\N	Open	19	created	2026-03-15 11:02:31.395839+00	\N
1009	task	488	status	\N	Open	54	created	2026-04-26 11:02:31.405153+00	\N
1010	task	488	column_id	To Do	In Progress	80	updated	2026-04-27 11:02:31.405153+00	{"sprint": "Sprint 3", "phase_transition": true}
1011	task	488	assignee_id	\N	80	19	updated	2026-04-26 11:31:31.405153+00	\N
1012	task	489	status	\N	Open	54	created	2026-04-20 11:02:31.40882+00	\N
1013	task	490	status	\N	Open	54	created	2026-04-23 11:02:31.417357+00	\N
1014	task	490	column_id	To Do	Done	14	updated	2026-04-25 11:02:31.417357+00	{"sprint": "Sprint 3", "phase_transition": true}
1015	task	490	assignee_id	\N	14	19	updated	2026-04-23 11:50:31.417357+00	\N
1016	task	490	status	Done	Done	14	completed	2026-04-29 11:02:31.417357+00	\N
1017	task	491	status	\N	Open	54	created	2026-04-12 11:02:31.423151+00	\N
1018	task	491	column_id	To Do	In Progress	14	updated	2026-04-17 11:02:31.423151+00	{"sprint": "Sprint 3", "phase_transition": true}
1019	task	491	assignee_id	\N	14	19	updated	2026-04-12 12:00:31.423151+00	\N
1020	task	492	status	\N	Open	19	created	2026-03-27 11:02:31.430395+00	\N
1021	task	493	status	\N	Open	89	created	2026-04-14 11:02:31.438888+00	\N
1022	task	493	column_id	To Do	Code Review	58	updated	2026-04-17 11:02:31.438888+00	{"sprint": "Sprint 2", "phase_transition": true}
1023	task	493	assignee_id	\N	58	19	updated	2026-04-14 11:20:31.438888+00	\N
1024	task	494	status	\N	Open	89	created	2026-04-11 11:02:31.44252+00	\N
1025	task	494	column_id	To Do	Code Review	19	updated	2026-04-16 11:02:31.44252+00	{"sprint": "Sprint 2", "phase_transition": true}
1026	task	494	assignee_id	\N	19	19	updated	2026-04-11 11:25:31.44252+00	\N
1027	task	495	status	\N	Open	89	created	2026-04-23 11:02:31.450865+00	\N
1028	task	495	column_id	To Do	In Progress	69	updated	2026-04-25 11:02:31.450865+00	{"sprint": "Sprint 2", "phase_transition": true}
1029	task	495	assignee_id	\N	69	19	updated	2026-04-23 11:40:31.450865+00	\N
1030	task	496	status	\N	Open	19	created	2026-03-15 11:02:31.459251+00	\N
1031	task	497	status	\N	Open	69	created	2026-04-25 11:02:31.468067+00	\N
1032	task	497	column_id	To Do	Done	54	updated	2026-04-27 11:02:31.468067+00	{"sprint": "Sprint 1", "phase_transition": true}
1033	task	497	assignee_id	\N	54	19	updated	2026-04-25 11:47:31.468067+00	\N
1034	task	497	status	Done	Done	54	completed	2026-05-10 11:02:31.468067+00	\N
1035	task	498	status	\N	Open	69	created	2026-04-24 11:02:31.471273+00	\N
1036	task	498	column_id	To Do	In Progress	45	updated	2026-04-26 11:02:31.471273+00	{"sprint": "Sprint 1", "phase_transition": true}
1037	task	498	assignee_id	\N	45	19	updated	2026-04-24 11:44:31.471273+00	\N
1038	task	499	status	\N	Open	69	created	2026-04-14 11:02:31.479616+00	\N
1039	task	499	column_id	To Do	In Progress	80	updated	2026-04-17 11:02:31.479616+00	{"sprint": "Sprint 1", "phase_transition": true}
1040	task	499	assignee_id	\N	80	19	updated	2026-04-14 11:35:31.479616+00	\N
1041	task	500	status	\N	Open	69	created	2026-04-14 11:02:31.487993+00	\N
1042	task	501	status	\N	Open	69	created	2026-04-10 11:02:31.496082+00	\N
1043	task	502	status	\N	Open	69	created	2026-04-19 11:02:31.502076+00	\N
1044	task	502	column_id	To Do	In Progress	69	updated	2026-04-20 11:02:31.502076+00	{"sprint": "Sprint 1", "phase_transition": true}
1045	task	502	assignee_id	\N	69	19	updated	2026-04-19 11:44:31.502076+00	\N
1046	task	503	status	\N	Open	19	created	2026-03-16 11:02:31.508344+00	\N
1047	task	504	status	\N	Open	69	created	2026-04-22 11:02:31.516898+00	\N
1048	task	505	status	\N	Open	69	created	2026-04-19 11:02:31.520114+00	\N
1049	task	505	column_id	To Do	Code Review	55	updated	2026-04-20 11:02:31.520114+00	{"sprint": "Sprint 3", "phase_transition": true}
1050	task	505	assignee_id	\N	55	19	updated	2026-04-19 11:37:31.520114+00	\N
1051	task	506	status	\N	Open	69	created	2026-04-14 11:02:31.525067+00	\N
1052	task	507	status	\N	Open	69	created	2026-04-13 11:02:31.533631+00	\N
1053	task	507	column_id	To Do	Code Review	69	updated	2026-04-14 11:02:31.533631+00	{"sprint": "Sprint 3", "phase_transition": true}
1054	task	507	assignee_id	\N	69	19	updated	2026-04-13 11:14:31.533631+00	\N
1055	task	508	status	\N	Open	69	created	2026-04-10 11:02:31.539765+00	\N
1056	task	509	status	\N	Open	69	created	2026-04-13 11:02:31.548303+00	\N
1057	task	509	column_id	To Do	Code Review	25	updated	2026-04-16 11:02:31.548303+00	{"sprint": "Sprint 3", "phase_transition": true}
1058	task	509	assignee_id	\N	25	19	updated	2026-04-13 11:28:31.548303+00	\N
1059	task	510	status	\N	Open	20	created	2026-03-23 11:02:31.568109+00	\N
1060	task	511	status	\N	Open	35	created	2026-04-14 11:02:31.570135+00	\N
1061	task	512	status	\N	Open	35	created	2026-04-20 11:02:31.573948+00	\N
1062	task	512	column_id	To Do	Bakım	54	updated	2026-04-21 11:02:31.573948+00	{"sprint": null, "phase_transition": true}
1063	task	512	assignee_id	\N	54	20	updated	2026-04-20 11:26:31.573948+00	\N
1064	task	512	status	Bakım	Done	54	completed	2026-04-30 11:02:31.573948+00	\N
1065	task	513	status	\N	Open	35	created	2026-04-15 11:02:31.58206+00	\N
1066	task	513	column_id	To Do	Bakım	27	updated	2026-04-18 11:02:31.58206+00	{"sprint": null, "phase_transition": true}
1067	task	513	assignee_id	\N	27	20	updated	2026-04-15 11:49:31.58206+00	\N
1068	task	513	status	Bakım	Done	27	completed	2026-04-24 11:02:31.58206+00	\N
1069	task	514	status	\N	Open	35	created	2026-04-16 11:02:31.591426+00	\N
1070	task	514	column_id	To Do	Tasarım	35	updated	2026-04-17 11:02:31.591426+00	{"sprint": null, "phase_transition": true}
1071	task	514	assignee_id	\N	35	20	updated	2026-04-16 11:16:31.591426+00	\N
1072	task	515	status	\N	Open	20	created	2026-03-16 11:02:31.599813+00	\N
1073	task	516	status	\N	Open	66	created	2026-04-17 11:02:31.606353+00	\N
1074	task	516	column_id	To Do	Bakım	35	updated	2026-04-21 11:02:31.606353+00	{"sprint": null, "phase_transition": true}
1075	task	516	assignee_id	\N	35	20	updated	2026-04-17 11:09:31.606353+00	\N
1076	task	516	status	Bakım	Done	35	completed	2026-04-29 11:02:31.606353+00	\N
1077	task	517	status	\N	Open	66	created	2026-04-14 11:02:31.609977+00	\N
1078	task	518	status	\N	Open	66	created	2026-04-24 11:02:31.618953+00	\N
1079	task	518	column_id	To Do	Analiz	54	updated	2026-04-27 11:02:31.618953+00	{"sprint": null, "phase_transition": true}
1080	task	518	assignee_id	\N	54	20	updated	2026-04-24 11:42:31.618953+00	\N
1081	task	519	status	\N	Open	66	created	2026-04-20 11:02:31.624943+00	\N
1082	task	519	column_id	To Do	Test	97	updated	2026-04-22 11:02:31.624943+00	{"sprint": null, "phase_transition": true}
1083	task	519	assignee_id	\N	97	20	updated	2026-04-20 11:40:31.624943+00	\N
1084	task	520	status	\N	Open	20	created	2026-03-21 11:02:31.632398+00	\N
1085	task	521	status	\N	Open	54	created	2026-04-16 11:02:31.640629+00	\N
1086	task	521	column_id	To Do	Test	54	updated	2026-04-19 11:02:31.640629+00	{"sprint": null, "phase_transition": true}
1087	task	521	assignee_id	\N	54	20	updated	2026-04-16 11:54:31.640629+00	\N
1088	task	522	status	\N	Open	54	created	2026-04-26 11:02:31.644198+00	\N
1089	task	522	column_id	To Do	Tasarım	42	updated	2026-04-28 11:02:31.644198+00	{"sprint": null, "phase_transition": true}
1090	task	522	assignee_id	\N	42	20	updated	2026-04-26 11:31:31.644198+00	\N
1091	task	523	status	\N	Open	54	created	2026-04-15 11:02:31.6522+00	\N
1092	task	523	column_id	To Do	Bakım	66	updated	2026-04-17 11:02:31.6522+00	{"sprint": null, "phase_transition": true}
1093	task	523	assignee_id	\N	66	20	updated	2026-04-15 12:00:31.6522+00	\N
1094	task	523	status	Bakım	Done	66	completed	2026-04-28 11:02:31.6522+00	\N
1095	task	524	status	\N	Open	54	created	2026-04-22 11:02:31.660689+00	\N
1096	task	525	status	\N	Open	54	created	2026-04-22 11:02:31.669799+00	\N
1097	task	525	column_id	To Do	Test	27	updated	2026-04-26 11:02:31.669799+00	{"sprint": null, "phase_transition": true}
1098	task	525	assignee_id	\N	27	20	updated	2026-04-22 11:50:31.669799+00	\N
1099	task	526	status	\N	Open	20	created	2026-03-15 11:02:31.675628+00	\N
1100	task	527	status	\N	Open	66	created	2026-04-17 11:02:31.68397+00	\N
1101	task	528	status	\N	Open	66	created	2026-04-26 11:02:31.686929+00	\N
1102	task	528	column_id	To Do	Bakım	27	updated	2026-04-29 11:02:31.686929+00	{"sprint": null, "phase_transition": true}
1103	task	528	assignee_id	\N	27	20	updated	2026-04-26 11:14:31.686929+00	\N
1104	task	528	status	Bakım	Done	27	completed	2026-05-03 11:02:31.686929+00	\N
1105	task	529	status	\N	Open	66	created	2026-04-20 11:02:31.693334+00	\N
1106	task	529	column_id	To Do	Uygulama	27	updated	2026-04-25 11:02:31.693334+00	{"sprint": null, "phase_transition": true}
1107	task	529	assignee_id	\N	27	20	updated	2026-04-20 11:53:31.693334+00	\N
1108	task	530	status	\N	Open	66	created	2026-04-24 11:02:31.702047+00	\N
1109	task	530	column_id	To Do	Uygulama	54	updated	2026-04-29 11:02:31.702047+00	{"sprint": null, "phase_transition": true}
1110	task	530	assignee_id	\N	54	20	updated	2026-04-24 11:12:31.702047+00	\N
1111	task	531	status	\N	Open	66	created	2026-04-12 11:02:31.710975+00	\N
1112	task	531	column_id	To Do	Tasarım	66	updated	2026-04-16 11:02:31.710975+00	{"sprint": null, "phase_transition": true}
1113	task	531	assignee_id	\N	66	20	updated	2026-04-12 11:31:31.710975+00	\N
1114	task	532	status	\N	Open	66	created	2026-04-19 11:02:31.71938+00	\N
1115	task	532	column_id	To Do	Tasarım	35	updated	2026-04-22 11:02:31.71938+00	{"sprint": null, "phase_transition": true}
1116	task	532	assignee_id	\N	35	20	updated	2026-04-19 11:54:31.71938+00	\N
1117	task	533	status	\N	Open	9	created	2026-03-17 11:02:31.747263+00	\N
1118	task	534	status	\N	Open	52	created	2026-04-10 11:02:31.749208+00	\N
1119	task	535	status	\N	Open	52	created	2026-04-14 11:02:31.752601+00	\N
1120	task	536	status	\N	Open	52	created	2026-04-26 11:02:31.759221+00	\N
1121	task	536	column_id	To Do	Done	64	updated	2026-04-29 11:02:31.759221+00	{"sprint": "Sprint 2", "phase_transition": true}
1122	task	536	assignee_id	\N	64	9	updated	2026-04-26 11:39:31.759221+00	\N
1123	task	536	status	Done	Done	64	completed	2026-05-10 11:02:31.759221+00	\N
1124	task	537	status	\N	Open	52	created	2026-04-18 11:02:31.765412+00	\N
1125	task	537	column_id	To Do	Done	52	updated	2026-04-21 11:02:31.765412+00	{"sprint": "Sprint 2", "phase_transition": true}
1126	task	537	assignee_id	\N	52	9	updated	2026-04-18 12:01:31.765412+00	\N
1127	task	537	status	Done	Done	52	completed	2026-04-26 11:02:31.765412+00	\N
1128	task	538	status	\N	Open	9	created	2026-03-23 11:02:31.774581+00	\N
1129	task	539	status	\N	Open	67	created	2026-04-25 11:02:31.782361+00	\N
1130	task	539	column_id	To Do	Done	64	updated	2026-04-27 11:02:31.782361+00	{"sprint": "Sprint 1", "phase_transition": true}
1131	task	539	assignee_id	\N	64	9	updated	2026-04-25 11:23:31.782361+00	\N
1132	task	539	status	Done	Done	64	completed	2026-05-06 11:02:31.782361+00	\N
1133	task	540	status	\N	Open	67	created	2026-04-16 11:02:31.785477+00	\N
1134	task	540	column_id	To Do	In Progress	22	updated	2026-04-21 11:02:31.785477+00	{"sprint": "Sprint 1", "phase_transition": true}
1135	task	540	assignee_id	\N	22	9	updated	2026-04-16 12:02:31.785477+00	\N
1136	task	541	status	\N	Open	67	created	2026-04-10 11:02:31.792622+00	\N
1137	task	542	status	\N	Open	67	created	2026-04-26 11:02:31.800438+00	\N
1138	task	542	column_id	To Do	Done	3	updated	2026-05-01 11:02:31.800438+00	{"sprint": "Sprint 1", "phase_transition": true}
1139	task	542	assignee_id	\N	3	9	updated	2026-04-26 11:59:31.800438+00	\N
1140	task	542	status	Done	Done	3	completed	2026-05-03 11:02:31.800438+00	\N
1141	task	543	status	\N	Open	67	created	2026-04-10 11:02:31.806895+00	\N
1142	task	543	column_id	To Do	In Progress	64	updated	2026-04-14 11:02:31.806895+00	{"sprint": "Sprint 1", "phase_transition": true}
1143	task	543	assignee_id	\N	64	9	updated	2026-04-10 11:46:31.806895+00	\N
1144	task	544	status	\N	Open	9	created	2026-03-25 11:02:31.816271+00	\N
1145	task	545	status	\N	Open	38	created	2026-04-24 11:02:31.824701+00	\N
1146	task	545	column_id	To Do	Done	51	updated	2026-04-29 11:02:31.824701+00	{"sprint": "Sprint 1", "phase_transition": true}
1147	task	545	assignee_id	\N	51	9	updated	2026-04-24 11:10:31.824701+00	\N
1148	task	545	status	Done	Done	51	completed	2026-05-07 11:02:31.824701+00	\N
1149	task	546	status	\N	Open	38	created	2026-04-24 11:02:31.828297+00	\N
1150	task	546	column_id	To Do	Code Review	22	updated	2026-04-27 11:02:31.828297+00	{"sprint": "Sprint 1", "phase_transition": true}
1151	task	546	assignee_id	\N	22	9	updated	2026-04-24 11:57:31.828297+00	\N
1152	task	547	status	\N	Open	38	created	2026-04-15 11:02:31.837873+00	\N
1153	task	547	column_id	To Do	Done	75	updated	2026-04-16 11:02:31.837873+00	{"sprint": "Sprint 1", "phase_transition": true}
1154	task	547	assignee_id	\N	75	9	updated	2026-04-15 12:00:31.837873+00	\N
1155	task	547	status	Done	Done	75	completed	2026-04-24 11:02:31.837873+00	\N
1156	task	548	status	\N	Open	9	created	2026-04-05 11:02:31.846403+00	\N
1157	task	549	status	\N	Open	9	created	2026-04-15 11:02:31.858121+00	\N
1158	task	549	column_id	To Do	In Progress	9	updated	2026-04-16 11:02:31.858121+00	{"sprint": "Sprint 2", "phase_transition": true}
1159	task	549	assignee_id	\N	9	9	updated	2026-04-15 11:39:31.858121+00	\N
1160	task	550	status	\N	Open	9	created	2026-04-21 11:02:31.861885+00	\N
1161	task	550	column_id	To Do	Code Review	22	updated	2026-04-26 11:02:31.861885+00	{"sprint": "Sprint 2", "phase_transition": true}
1162	task	550	assignee_id	\N	22	9	updated	2026-04-21 11:59:31.861885+00	\N
1163	task	551	status	\N	Open	9	created	2026-04-11 11:02:31.871231+00	\N
1164	task	551	column_id	To Do	Done	3	updated	2026-04-16 11:02:31.871231+00	{"sprint": "Sprint 2", "phase_transition": true}
1165	task	551	assignee_id	\N	3	9	updated	2026-04-11 11:55:31.871231+00	\N
1166	task	551	status	Done	Done	3	completed	2026-04-18 11:02:31.871231+00	\N
1167	task	552	status	\N	Open	9	created	2026-04-18 11:02:31.880823+00	\N
1168	task	552	column_id	To Do	Code Review	67	updated	2026-04-22 11:02:31.880823+00	{"sprint": "Sprint 2", "phase_transition": true}
1169	task	552	assignee_id	\N	67	9	updated	2026-04-18 11:57:31.880823+00	\N
1170	task	553	status	\N	Open	9	created	2026-04-12 11:02:31.89122+00	\N
1171	task	554	status	\N	Open	9	created	2026-04-22 11:02:31.900386+00	\N
1172	task	555	status	\N	Open	9	created	2026-04-09 11:02:31.907601+00	\N
1173	task	556	status	\N	Open	67	created	2026-04-20 11:02:31.914884+00	\N
1174	task	557	status	\N	Open	67	created	2026-04-22 11:02:31.918742+00	\N
1175	task	558	status	\N	Open	67	created	2026-04-11 11:02:31.92344+00	\N
1176	task	559	status	\N	Open	10	created	2026-03-17 11:02:31.941707+00	\N
1177	task	560	status	\N	Open	53	created	2026-04-10 11:02:31.943871+00	\N
1178	task	560	column_id	To Do	Test	94	updated	2026-04-13 11:02:31.943871+00	{"sprint": null, "phase_transition": true}
1179	task	560	assignee_id	\N	94	10	updated	2026-04-10 11:31:31.943871+00	\N
1180	task	561	status	\N	Open	53	created	2026-04-11 11:02:31.947834+00	\N
1181	task	562	status	\N	Open	53	created	2026-04-19 11:02:31.957106+00	\N
1182	task	562	column_id	To Do	Bakım	10	updated	2026-04-22 11:02:31.957106+00	{"sprint": null, "phase_transition": true}
1183	task	562	assignee_id	\N	10	10	updated	2026-04-19 11:34:31.957106+00	\N
1184	task	562	status	Bakım	Done	10	completed	2026-04-25 11:02:31.957106+00	\N
1185	task	563	status	\N	Open	10	created	2026-04-07 11:02:31.96395+00	\N
1186	task	564	status	\N	Open	68	created	2026-04-19 11:02:31.972599+00	\N
1187	task	564	column_id	To Do	Bakım	53	updated	2026-04-23 11:02:31.972599+00	{"sprint": null, "phase_transition": true}
1188	task	564	assignee_id	\N	53	10	updated	2026-04-19 11:49:31.972599+00	\N
1189	task	564	status	Bakım	Done	53	completed	2026-04-29 11:02:31.972599+00	\N
1190	task	565	status	\N	Open	68	created	2026-04-10 11:02:31.976211+00	\N
1191	task	565	column_id	To Do	Uygulama	94	updated	2026-04-12 11:02:31.976211+00	{"sprint": null, "phase_transition": true}
1192	task	565	assignee_id	\N	94	10	updated	2026-04-10 11:50:31.976211+00	\N
1193	task	566	status	\N	Open	68	created	2026-04-14 11:02:31.985157+00	\N
1194	task	567	status	\N	Open	10	created	2026-03-18 11:02:31.992612+00	\N
1195	task	568	status	\N	Open	27	created	2026-04-23 11:02:31.997499+00	\N
1196	task	568	column_id	To Do	Tasarım	94	updated	2026-04-25 11:02:31.997499+00	{"sprint": null, "phase_transition": true}
1197	task	568	assignee_id	\N	94	10	updated	2026-04-23 11:32:31.997499+00	\N
1198	task	569	status	\N	Open	27	created	2026-04-16 11:02:32.000491+00	\N
1199	task	569	column_id	To Do	Analiz	93	updated	2026-04-19 11:02:32.000491+00	{"sprint": null, "phase_transition": true}
1200	task	569	assignee_id	\N	93	10	updated	2026-04-16 11:49:32.000491+00	\N
1201	task	570	status	\N	Open	27	created	2026-04-10 11:02:32.007457+00	\N
1202	task	570	column_id	To Do	Uygulama	94	updated	2026-04-15 11:02:32.007457+00	{"sprint": null, "phase_transition": true}
1203	task	570	assignee_id	\N	94	10	updated	2026-04-10 11:09:32.007457+00	\N
1204	task	571	status	\N	Open	27	created	2026-04-17 11:02:32.018019+00	\N
1205	task	571	column_id	To Do	Tasarım	20	updated	2026-04-20 11:02:32.018019+00	{"sprint": null, "phase_transition": true}
1206	task	571	assignee_id	\N	20	10	updated	2026-04-17 11:30:32.018019+00	\N
1207	task	572	status	\N	Open	27	created	2026-04-20 11:02:32.032772+00	\N
1208	task	572	column_id	To Do	Uygulama	59	updated	2026-04-24 11:02:32.032772+00	{"sprint": null, "phase_transition": true}
1209	task	572	assignee_id	\N	59	10	updated	2026-04-20 11:37:32.032772+00	\N
1210	task	573	status	\N	Open	27	created	2026-04-19 11:02:32.045245+00	\N
1211	task	573	column_id	To Do	Tasarım	59	updated	2026-04-22 11:02:32.045245+00	{"sprint": null, "phase_transition": true}
1212	task	573	assignee_id	\N	59	10	updated	2026-04-19 11:32:32.045245+00	\N
1213	task	574	status	\N	Open	10	created	2026-03-31 11:02:32.056544+00	\N
1214	task	575	status	\N	Open	59	created	2026-04-12 11:02:32.065506+00	\N
1215	task	575	column_id	To Do	Analiz	30	updated	2026-04-14 11:02:32.065506+00	{"sprint": null, "phase_transition": true}
1216	task	575	assignee_id	\N	30	10	updated	2026-04-12 11:32:32.065506+00	\N
1217	task	576	status	\N	Open	59	created	2026-04-17 11:02:32.069935+00	\N
1218	task	576	column_id	To Do	Bakım	30	updated	2026-04-20 11:02:32.069935+00	{"sprint": null, "phase_transition": true}
1219	task	576	assignee_id	\N	30	10	updated	2026-04-17 11:49:32.069935+00	\N
1220	task	576	status	Bakım	Done	30	completed	2026-04-25 11:02:32.069935+00	\N
1221	task	577	status	\N	Open	59	created	2026-04-14 11:02:32.078192+00	\N
1222	task	577	column_id	To Do	Analiz	70	updated	2026-04-16 11:02:32.078192+00	{"sprint": null, "phase_transition": true}
1223	task	577	assignee_id	\N	70	10	updated	2026-04-14 11:48:32.078192+00	\N
1224	task	578	status	\N	Open	59	created	2026-04-23 11:02:32.091912+00	\N
1225	task	578	column_id	To Do	Test	93	updated	2026-04-28 11:02:32.091912+00	{"sprint": null, "phase_transition": true}
1226	task	578	assignee_id	\N	93	10	updated	2026-04-23 11:57:32.091912+00	\N
1227	task	579	status	\N	Open	59	created	2026-04-25 11:02:32.104302+00	\N
1228	task	579	column_id	To Do	Bakım	10	updated	2026-04-26 11:02:32.104302+00	{"sprint": null, "phase_transition": true}
1229	task	579	assignee_id	\N	10	10	updated	2026-04-25 11:18:32.104302+00	\N
1230	task	579	status	Bakım	Done	10	completed	2026-05-01 11:02:32.104302+00	\N
1231	task	580	status	\N	Open	59	created	2026-04-22 11:02:32.117367+00	\N
1232	task	580	column_id	To Do	Test	93	updated	2026-04-26 11:02:32.117367+00	{"sprint": null, "phase_transition": true}
1233	task	580	assignee_id	\N	93	10	updated	2026-04-22 11:10:32.117367+00	\N
1234	task	581	status	\N	Open	10	created	2026-03-10 11:02:32.128022+00	\N
1235	task	582	status	\N	Open	28	created	2026-04-15 11:02:32.139001+00	\N
1236	task	583	status	\N	Open	28	created	2026-04-16 11:02:32.143104+00	\N
1237	task	584	status	\N	Open	28	created	2026-04-24 11:02:32.150829+00	\N
1238	task	584	column_id	To Do	Test	61	updated	2026-04-27 11:02:32.150829+00	{"sprint": null, "phase_transition": true}
1239	task	584	assignee_id	\N	61	10	updated	2026-04-24 11:48:32.150829+00	\N
1240	task	585	status	\N	Open	28	created	2026-04-10 11:02:32.159286+00	\N
1241	task	585	column_id	To Do	Analiz	70	updated	2026-04-12 11:02:32.159286+00	{"sprint": null, "phase_transition": true}
1242	task	585	assignee_id	\N	70	10	updated	2026-04-10 11:37:32.159286+00	\N
1243	task	586	status	\N	Open	28	created	2026-04-25 11:02:32.169736+00	\N
1244	task	586	column_id	To Do	Tasarım	53	updated	2026-04-28 11:02:32.169736+00	{"sprint": null, "phase_transition": true}
1245	task	586	assignee_id	\N	53	10	updated	2026-04-25 11:51:32.169736+00	\N
1246	task	587	status	\N	Open	28	created	2026-04-26 11:02:32.178466+00	\N
1247	task	588	status	\N	Open	11	created	2026-03-21 11:02:32.203114+00	\N
1248	task	589	status	\N	Open	33	created	2026-04-12 11:02:32.205737+00	\N
1249	task	589	column_id	To Do	In Progress	3	updated	2026-04-17 11:02:32.205737+00	{"sprint": "Sprint 3", "phase_transition": true}
1250	task	589	assignee_id	\N	3	11	updated	2026-04-12 11:41:32.205737+00	\N
1251	task	590	status	\N	Open	33	created	2026-04-16 11:02:32.209042+00	\N
1252	task	590	column_id	To Do	Code Review	11	updated	2026-04-21 11:02:32.209042+00	{"sprint": "Sprint 3", "phase_transition": true}
1253	task	590	assignee_id	\N	11	11	updated	2026-04-16 11:58:32.209042+00	\N
1254	task	591	status	\N	Open	33	created	2026-04-23 11:02:32.218116+00	\N
1255	task	592	status	\N	Open	33	created	2026-04-12 11:02:32.224864+00	\N
1256	task	593	status	\N	Open	11	created	2026-03-11 11:02:32.232495+00	\N
1257	task	594	status	\N	Open	5	created	2026-04-14 11:02:32.238996+00	\N
1258	task	595	status	\N	Open	5	created	2026-04-13 11:02:32.242601+00	\N
1259	task	596	status	\N	Open	5	created	2026-04-15 11:02:32.250002+00	\N
1260	task	597	status	\N	Open	5	created	2026-04-25 11:02:32.255005+00	\N
1261	task	597	column_id	To Do	In Progress	45	updated	2026-04-27 11:02:32.255005+00	{"sprint": "Sprint 3", "phase_transition": true}
1262	task	597	assignee_id	\N	45	11	updated	2026-04-25 11:23:32.255005+00	\N
1263	task	598	status	\N	Open	11	created	2026-03-14 11:02:32.263063+00	\N
1264	task	599	status	\N	Open	45	created	2026-04-24 11:02:32.272613+00	\N
1265	task	600	status	\N	Open	45	created	2026-04-21 11:02:32.275901+00	\N
1266	task	600	column_id	To Do	Code Review	29	updated	2026-04-26 11:02:32.275901+00	{"sprint": "Sprint 1", "phase_transition": true}
1267	task	600	assignee_id	\N	29	11	updated	2026-04-21 11:25:32.275901+00	\N
1268	task	601	status	\N	Open	45	created	2026-04-21 11:02:32.280947+00	\N
1269	task	601	column_id	To Do	Code Review	11	updated	2026-04-26 11:02:32.280947+00	{"sprint": "Sprint 1", "phase_transition": true}
1270	task	601	assignee_id	\N	11	11	updated	2026-04-21 11:14:32.280947+00	\N
1271	task	602	status	\N	Open	11	created	2026-03-18 11:02:32.289597+00	\N
1272	task	603	status	\N	Open	45	created	2026-04-18 11:02:32.298116+00	\N
1273	task	603	column_id	To Do	Code Review	45	updated	2026-04-21 11:02:32.298116+00	{"sprint": "Sprint 3", "phase_transition": true}
1274	task	603	assignee_id	\N	45	11	updated	2026-04-18 11:27:32.298116+00	\N
1275	task	604	status	\N	Open	45	created	2026-04-11 11:02:32.301827+00	\N
1276	task	604	column_id	To Do	Code Review	95	updated	2026-04-14 11:02:32.301827+00	{"sprint": "Sprint 3", "phase_transition": true}
1277	task	604	assignee_id	\N	95	11	updated	2026-04-11 11:09:32.301827+00	\N
1278	task	605	status	\N	Open	45	created	2026-04-25 11:02:32.311376+00	\N
1279	task	606	status	\N	Open	45	created	2026-04-20 11:02:32.327246+00	\N
1280	task	607	status	\N	Open	45	created	2026-04-20 11:02:32.337685+00	\N
1281	task	607	column_id	To Do	Code Review	16	updated	2026-04-23 11:02:32.337685+00	{"sprint": "Sprint 3", "phase_transition": true}
1282	task	607	assignee_id	\N	16	11	updated	2026-04-20 11:58:32.337685+00	\N
1283	task	99	assignee_id	1	2	1	updated	2026-04-29 13:13:42.426061+00	{"task_id": 99, "task_key": null, "field_name": "assignee_id", "project_id": 3, "task_title": "Bildirim Altyapısı (DATA)", "project_key": "DATA", "project_name": "Veri Ambarı Göçü", "new_value_label": "2", "old_value_label": "1"}
1284	user	4	transition	\N	\N	1	role_changed	2026-04-29 13:17:39.457628+00	{"user_id": 4, "user_email": "mehmet.yilmaz@firma.com", "source_role": "Member", "target_role_id": 3, "target_role_name": "Project Manager", "requested_by_admin_id": 1}
1285	user	17	transition	\N	\N	1	role_changed	2026-04-29 13:17:57.991451+00	{"user_id": 17, "user_email": "huseyin.kurt@firma.com", "source_role": "Project Manager", "target_role_id": 4, "target_role_name": "Member", "requested_by_admin_id": 1}
3131	project	1	process_config	{'task_workflow': {'edges': [{'id': 'ed_aaagonsw96', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}	{'task_workflow': {'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'parent_id': 'gr_aablj7j0n0', 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'ed_aaagonsw96', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [{'id': 'gr_aablj7j0n0', 'name': 'Yeni Grup', 'color': 'primary', 'children': ['col_2']}], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}	1	updated	2026-05-17 21:26:26.162947+00	{"field_name": "process_config", "project_id": 1, "methodology": "SCRUM", "project_key": "SPMS", "project_name": "SPMS Geliştirme", "new_value_label": "{'task_workflow': {'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'parent_id': 'gr_aablj7j0n0', 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'ed_aaagonsw96', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [{'id': 'gr_aablj7j0n0', 'name': 'Yeni Grup', 'color': 'primary', 'children': ['col_2']}], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}", "old_value_label": "{'task_workflow': {'edges': [{'id': 'ed_aaagonsw96', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False, 'is_terminal': False, 'max_duration_days': None}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}"}
3130	project	1	process_config	{'task_workflow': {'edges': [], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}, 'schema_version': 2, 'status_workflow': {'mode': 'continuous', 'edges': [{'id': 'es_0', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}}	{'task_workflow': {'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'ed_aaagonsw96', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}	1	updated	2026-05-17 21:25:30.33858+00	{"field_name": "process_config", "project_id": 1, "methodology": "SCRUM", "project_key": "SPMS", "project_name": "SPMS Geliştirme", "new_value_label": "{'task_workflow': {'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'ed_aaagonsw96', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaiaieh33', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaanqpvcao', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}, {'id': 'ed_aaaq2p211z', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None, 'is_terminal': False, 'max_duration_days': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': [], 'capabilities': {}}, 'schema_version': 2}", "old_value_label": "{'task_workflow': {'edges': [], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'is_all_gate': False, 'bidirectional': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}, 'schema_version': 2, 'status_workflow': {'mode': 'continuous', 'edges': [{'id': 'es_0', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}}"}
2489	project	1	process_config	{'workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_scinit0001', 'target': 'nd_scplan0002', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_scplan0002', 'target': 'nd_scexec0003', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_scexec0003', 'target': 'nd_scmoni0004', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e4', 'type': 'feedback', 'label': 'Retro', 'source': 'nd_scmoni0004', 'target': 'nd_scexec0003', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_scmoni0004', 'target': 'nd_sccls00005', 'is_all_gate': False, 'bidirectional': False}], 'nodes': [{'x': 60, 'y': 120, 'id': 'nd_scinit0001', 'name': 'Başlatma', 'color': 'status-todo', 'is_initial': True, 'description': 'Vizyon ve hedefler'}, {'x': 280, 'y': 120, 'id': 'nd_scplan0002', 'name': 'Planlama', 'color': 'status-todo', 'description': 'Backlog ve sprint planning'}, {'x': 500, 'y': 120, 'id': 'nd_scexec0003', 'name': 'Yürütme', 'color': 'status-progress', 'description': "Sprint'ler"}, {'x': 720, 'y': 120, 'id': 'nd_scmoni0004', 'name': 'İzleme', 'color': 'status-review', 'description': 'Metrikler ve retro'}, {'x': 940, 'y': 120, 'id': 'nd_sccls00005', 'name': 'Kapanış', 'color': 'status-done', 'is_final': True, 'description': 'Teslim ve ders'}], 'groups': []}, 'schema_version': 1}	{'schema_version': 2, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}, 'task_workflow': {'capabilities': {'enforce_wip_limits': False, 'has_recurring': True, 'initial_node_id': None}, 'edges': [], 'groups': []}, 'status_workflow': {'mode': 'continuous', 'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'es_0', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}}	1	updated	2026-05-17 18:17:01.599354+00	{"field_name": "process_config", "project_id": 1, "methodology": "SCRUM", "project_key": "SPMS", "project_name": "SPMS Geliştirme", "new_value_label": "{'schema_version': 2, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}, 'task_workflow': {'capabilities': {'enforce_wip_limits': False, 'has_recurring': True, 'initial_node_id': None}, 'edges': [], 'groups': []}, 'status_workflow': {'mode': 'continuous', 'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'es_0', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}}", "old_value_label": "{'workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_scinit0001', 'target': 'nd_scplan0002', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_scplan0002', 'target': 'nd_scexec0003', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_scexec0003', 'target': 'nd_scmoni0004', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e4', 'type': 'feedback', 'label': 'Retro', 'source': 'nd_scmoni0004', 'target': 'nd_scexec0003', 'is_all_gate': False, 'bidirectional': False}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_scmoni0004', 'target': 'nd_sccls00005', 'is_all_gate': False, 'bidirectional': False}], 'nodes': [{'x': 60, 'y': 120, 'id': 'nd_scinit0001', 'name': 'Başlatma', 'color': 'status-todo', 'is_initial': True, 'description': 'Vizyon ve hedefler'}, {'x': 280, 'y': 120, 'id': 'nd_scplan0002', 'name': 'Planlama', 'color': 'status-todo', 'description': 'Backlog ve sprint planning'}, {'x': 500, 'y': 120, 'id': 'nd_scexec0003', 'name': 'Yürütme', 'color': 'status-progress', 'description': \\"Sprint'ler\\"}, {'x': 720, 'y': 120, 'id': 'nd_scmoni0004', 'name': 'İzleme', 'color': 'status-review', 'description': 'Metrikler ve retro'}, {'x': 940, 'y': 120, 'id': 'nd_sccls00005', 'name': 'Kapanış', 'color': 'status-done', 'is_final': True, 'description': 'Teslim ve ders'}], 'groups': []}, 'schema_version': 1}"}
2490	project	1	process_config	{'task_workflow': {'edges': [], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}, 'schema_version': 2, 'status_workflow': {'mode': 'continuous', 'edges': [{'id': 'es_0', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}}	{'schema_version': 2, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': []}, 'task_workflow': {'capabilities': {'enforce_wip_limits': False, 'has_recurring': True, 'initial_node_id': None}, 'edges': [], 'groups': []}, 'status_workflow': {'mode': 'continuous', 'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'es_0', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}}	1	updated	2026-05-17 18:17:52.148137+00	{"field_name": "process_config", "project_id": 1, "methodology": "SCRUM", "project_key": "SPMS", "project_name": "SPMS Geliştirme", "new_value_label": "{'schema_version': 2, 'phase_workflow': {'mode': 'flexible', 'nodes': [{'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'description': 'Sistem gereksinimleri', 'x': -10.623231797570774, 'y': 20.764871223571788, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'description': 'Yüksek seviye tasarım', 'x': 164.5278533106913, 'y': 179.01322395516559, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'description': 'Detaylı tasarım', 'x': 318.7535364048585, 'y': 313.72049942090246, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmcod00004', 'name': 'Kodlama', 'description': 'Geliştirme', 'x': 514.9291802869997, 'y': 427.94618251506955, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'description': 'Unit test', 'x': 711.1048241691407, 'y': 314.60811870595296, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'description': 'Integration test', 'x': 920.458001069875, 'y': 179.90084324021612, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'description': 'System test', 'x': 1097.115237323586, 'y': 25.576003386265093, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}, {'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'x': 248.44964114827584, 'y': 87.14546395166478, 'color': 'status-todo', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'e1', 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'type': 'verification', 'label': 'Doğrula', 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'ed_a3lda3lb2h', 'source': 'nd_vmreq00001', 'target': 'nd_dwx1v6d7i1', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': 'right-source', 'target_handle': 'left-target'}], 'groups': []}, 'task_workflow': {'capabilities': {'enforce_wip_limits': False, 'has_recurring': True, 'initial_node_id': None}, 'edges': [], 'groups': []}, 'status_workflow': {'mode': 'continuous', 'nodes': [{'id': 'col_1', 'name': 'Backlog', 'x': 60, 'y': 120, 'color': 'status-todo', 'is_initial': True, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_2', 'name': 'To Do', 'x': 260, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_3', 'name': 'In Progress', 'x': 460, 'y': 120, 'color': 'status-progress', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_4', 'name': 'Code Review', 'x': 660, 'y': 120, 'color': 'status-review', 'is_initial': False, 'is_final': False, 'is_archived': False, 'wip_limit': None}, {'id': 'col_5', 'name': 'Done', 'x': 860, 'y': 120, 'color': 'status-done', 'is_initial': False, 'is_final': True, 'is_archived': False, 'wip_limit': None}], 'edges': [{'id': 'es_0', 'source': 'col_1', 'target': 'col_2', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'source': 'col_2', 'target': 'col_3', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'source': 'col_3', 'target': 'col_4', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'source': 'col_4', 'target': 'col_5', 'type': 'flow', 'label': None, 'bidirectional': False, 'is_all_gate': False, 'source_handle': None, 'target_handle': None}], 'groups': []}}", "old_value_label": "{'task_workflow': {'edges': [], 'groups': [], 'capabilities': {'has_recurring': True, 'initial_node_id': None, 'enforce_wip_limits': False}}, 'phase_workflow': {'mode': 'flexible', 'edges': [{'id': 'e1', 'type': 'flow', 'label': None, 'source': 'nd_vmreq00001', 'target': 'nd_vmsys00002', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e2', 'type': 'flow', 'label': None, 'source': 'nd_vmsys00002', 'target': 'nd_vmmod00003', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e3', 'type': 'flow', 'label': None, 'source': 'nd_vmmod00003', 'target': 'nd_vmcod00004', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e4', 'type': 'flow', 'label': None, 'source': 'nd_vmcod00004', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e5', 'type': 'flow', 'label': None, 'source': 'nd_vmunt00005', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'e6', 'type': 'flow', 'label': None, 'source': 'nd_vmint00006', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev1', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmmod00003', 'target': 'nd_vmunt00005', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev2', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmsys00002', 'target': 'nd_vmint00006', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'ev3', 'type': 'verification', 'label': 'Doğrula', 'source': 'nd_vmreq00001', 'target': 'nd_vmsts00007', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': -10.623231797570774, 'y': 20.764871223571788, 'id': 'nd_vmreq00001', 'name': 'Gereksinimler', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'description': 'Sistem gereksinimleri', 'is_archived': False}, {'x': 164.5278533106913, 'y': 179.01322395516559, 'id': 'nd_vmsys00002', 'name': 'Sistem Tasarımı', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Yüksek seviye tasarım', 'is_archived': False}, {'x': 318.7535364048585, 'y': 313.72049942090246, 'id': 'nd_vmmod00003', 'name': 'Modül Tasarımı', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Detaylı tasarım', 'is_archived': False}, {'x': 514.9291802869997, 'y': 427.94618251506955, 'id': 'nd_vmcod00004', 'name': 'Kodlama', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Geliştirme', 'is_archived': False}, {'x': 711.1048241691407, 'y': 314.60811870595296, 'id': 'nd_vmunt00005', 'name': 'Birim Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Unit test', 'is_archived': False}, {'x': 920.458001069875, 'y': 179.90084324021612, 'id': 'nd_vmint00006', 'name': 'Entegrasyon Testi', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'description': 'Integration test', 'is_archived': False}, {'x': 1097.115237323586, 'y': 25.576003386265093, 'id': 'nd_vmsts00007', 'name': 'Sistem Testi', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'description': 'System test', 'is_archived': False}, {'x': 248.44964114827584, 'y': 87.14546395166478, 'id': 'nd_dwx1v6d7i1', 'name': 'Yeni Düğüm', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}, 'schema_version': 2, 'status_workflow': {'mode': 'continuous', 'edges': [{'id': 'es_0', 'type': 'flow', 'label': None, 'source': 'col_1', 'target': 'col_2', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_1', 'type': 'flow', 'label': None, 'source': 'col_2', 'target': 'col_3', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_2', 'type': 'flow', 'label': None, 'source': 'col_3', 'target': 'col_4', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}, {'id': 'es_3', 'type': 'flow', 'label': None, 'source': 'col_4', 'target': 'col_5', 'is_all_gate': False, 'bidirectional': False, 'source_handle': None, 'target_handle': None}], 'nodes': [{'x': 60, 'y': 120, 'id': 'col_1', 'name': 'Backlog', 'color': 'status-todo', 'is_final': False, 'wip_limit': None, 'is_initial': True, 'is_archived': False}, {'x': 260, 'y': 120, 'id': 'col_2', 'name': 'To Do', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 460, 'y': 120, 'id': 'col_3', 'name': 'In Progress', 'color': 'status-progress', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 660, 'y': 120, 'id': 'col_4', 'name': 'Code Review', 'color': 'status-review', 'is_final': False, 'wip_limit': None, 'is_initial': False, 'is_archived': False}, {'x': 860, 'y': 120, 'id': 'col_5', 'name': 'Done', 'color': 'status-done', 'is_final': True, 'wip_limit': None, 'is_initial': False, 'is_archived': False}], 'groups': []}}"}
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, task_id, user_id, content, created_at, version, updated_at, is_deleted, deleted_at) FROM stdin;
1	3	5	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.367895+00	1	2026-04-29 11:02:01.374639+00	f	\N
2	4	5	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.383748+00	1	2026-04-29 11:02:01.374639+00	f	\N
3	6	5	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.402538+00	1	2026-04-29 11:02:01.374639+00	f	\N
4	7	7	Harika iş, ellerine sağlık!	2026-04-29 11:02:03.414732+00	1	2026-04-29 11:02:01.374639+00	f	\N
5	10	3	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.435909+00	1	2026-04-29 11:02:01.374639+00	f	\N
6	14	2	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:03.461948+00	1	2026-04-29 11:02:01.374639+00	f	\N
7	19	5	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:03.49366+00	1	2026-04-29 11:02:01.374639+00	f	\N
8	21	5	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:03.511232+00	1	2026-04-29 11:02:01.374639+00	f	\N
9	25	5	Harika iş, ellerine sağlık!	2026-04-29 11:02:03.545484+00	1	2026-04-29 11:02:01.374639+00	f	\N
10	28	3	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.571051+00	1	2026-04-29 11:02:01.374639+00	f	\N
11	30	5	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.591171+00	1	2026-04-29 11:02:01.374639+00	f	\N
12	35	7	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.63244+00	1	2026-04-29 11:02:01.374639+00	f	\N
13	37	5	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.652516+00	1	2026-04-29 11:02:01.374639+00	f	\N
14	39	8	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.681246+00	1	2026-04-29 11:02:01.374639+00	f	\N
15	40	4	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.693301+00	1	2026-04-29 11:02:01.374639+00	f	\N
16	41	8	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:03.703684+00	1	2026-04-29 11:02:01.374639+00	f	\N
17	42	7	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.714537+00	1	2026-04-29 11:02:01.374639+00	f	\N
18	45	7	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:03.756527+00	1	2026-04-29 11:02:01.374639+00	f	\N
19	47	5	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.779713+00	1	2026-04-29 11:02:01.374639+00	f	\N
20	48	7	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:03.790223+00	1	2026-04-29 11:02:01.374639+00	f	\N
21	49	5	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:03.799541+00	1	2026-04-29 11:02:01.374639+00	f	\N
22	50	7	Harika iş, ellerine sağlık!	2026-04-29 11:02:03.809071+00	1	2026-04-29 11:02:01.374639+00	f	\N
23	51	4	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.819951+00	1	2026-04-29 11:02:01.374639+00	f	\N
24	53	4	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.835342+00	1	2026-04-29 11:02:01.374639+00	f	\N
25	55	4	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:03.84756+00	1	2026-04-29 11:02:01.374639+00	f	\N
26	56	7	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:03.857133+00	1	2026-04-29 11:02:01.374639+00	f	\N
27	57	3	Harika iş, ellerine sağlık!	2026-04-29 11:02:03.867616+00	1	2026-04-29 11:02:01.374639+00	f	\N
28	59	3	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:03.880719+00	1	2026-04-29 11:02:01.374639+00	f	\N
29	62	7	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:03.904166+00	1	2026-04-29 11:02:01.374639+00	f	\N
30	63	3	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:03.914522+00	1	2026-04-29 11:02:01.374639+00	f	\N
31	64	5	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:03.924173+00	1	2026-04-29 11:02:01.374639+00	f	\N
32	67	8	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:03.945225+00	1	2026-04-29 11:02:01.374639+00	f	\N
33	78	7	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.019734+00	1	2026-04-29 11:02:01.374639+00	f	\N
34	79	8	Harika iş, ellerine sağlık!	2026-04-29 11:02:04.039836+00	1	2026-04-29 11:02:01.374639+00	f	\N
35	81	4	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.075785+00	1	2026-04-29 11:02:01.374639+00	f	\N
36	93	8	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:04.17456+00	1	2026-04-29 11:02:01.374639+00	f	\N
37	95	2	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:04.187675+00	1	2026-04-29 11:02:01.374639+00	f	\N
38	98	2	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.213303+00	1	2026-04-29 11:02:01.374639+00	f	\N
39	101	3	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:04.233781+00	1	2026-04-29 11:02:01.374639+00	f	\N
40	103	2	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.251223+00	1	2026-04-29 11:02:01.374639+00	f	\N
41	104	1	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:04.261917+00	1	2026-04-29 11:02:01.374639+00	f	\N
42	105	7	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.270701+00	1	2026-04-29 11:02:01.374639+00	f	\N
43	108	8	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.293798+00	1	2026-04-29 11:02:01.374639+00	f	\N
44	110	1	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.310621+00	1	2026-04-29 11:02:01.374639+00	f	\N
45	112	7	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.328474+00	1	2026-04-29 11:02:01.374639+00	f	\N
46	116	8	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.355278+00	1	2026-04-29 11:02:01.374639+00	f	\N
47	117	2	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.362854+00	1	2026-04-29 11:02:01.374639+00	f	\N
48	122	6	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.410327+00	1	2026-04-29 11:02:01.374639+00	f	\N
49	124	6	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.42738+00	1	2026-04-29 11:02:01.374639+00	f	\N
50	125	3	Harika iş, ellerine sağlık!	2026-04-29 11:02:04.436226+00	1	2026-04-29 11:02:01.374639+00	f	\N
51	134	5	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:04.493748+00	1	2026-04-29 11:02:01.374639+00	f	\N
52	136	7	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.505296+00	1	2026-04-29 11:02:01.374639+00	f	\N
53	140	5	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.53405+00	1	2026-04-29 11:02:01.374639+00	f	\N
54	143	7	Pull Request açıldı, inceleme bekliyor.	2026-04-29 11:02:04.552464+00	1	2026-04-29 11:02:01.374639+00	f	\N
55	145	5	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.569395+00	1	2026-04-29 11:02:01.374639+00	f	\N
56	146	3	Gecikme için üzgünüm, yarına tamamlanacak.	2026-04-29 11:02:04.577823+00	1	2026-04-29 11:02:01.374639+00	f	\N
57	148	3	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.589646+00	1	2026-04-29 11:02:01.374639+00	f	\N
58	149	6	API endpoint'i hazır, test edebilirsiniz.	2026-04-29 11:02:04.59675+00	1	2026-04-29 11:02:01.374639+00	f	\N
59	150	7	Bu konuda biraz daha detaya ihtiyacım var.	2026-04-29 11:02:04.604724+00	1	2026-04-29 11:02:01.374639+00	f	\N
60	154	3	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:04.630596+00	1	2026-04-29 11:02:01.374639+00	f	\N
61	155	5	Tasarım ekibiyle görüştüm, revize bekliyoruz.	2026-04-29 11:02:04.639486+00	1	2026-04-29 11:02:01.374639+00	f	\N
62	158	5	Harika iş, ellerine sağlık!	2026-04-29 11:02:04.658599+00	1	2026-04-29 11:02:01.374639+00	f	\N
63	163	97	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-23 05:02:28.554283+00	1	2026-04-29 11:02:04.785991+00	f	\N
64	166	21	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-14 02:02:28.600662+00	1	2026-04-29 11:02:04.785991+00	f	\N
65	166	42	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-16 03:02:28.600662+00	1	2026-04-29 11:02:04.785991+00	f	\N
66	167	97	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-18 08:02:28.608449+00	1	2026-04-29 11:02:04.785991+00	f	\N
67	170	22	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-26 06:02:28.644658+00	1	2026-04-29 11:02:04.785991+00	f	\N
68	171	42	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-21 01:02:28.656756+00	1	2026-04-29 11:02:04.785991+00	f	\N
69	172	23	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-26 08:02:28.67339+00	1	2026-04-29 11:02:04.785991+00	f	\N
70	174	9	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-17 14:02:28.702459+00	1	2026-04-29 11:02:04.785991+00	f	\N
71	176	50	Feature flag açıldı, A/B test başladı.	2026-04-11 14:02:28.725874+00	1	2026-04-29 11:02:04.785991+00	f	\N
72	178	9	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-17 18:02:28.746674+00	1	2026-04-29 11:02:04.785991+00	f	\N
73	180	22	PR #314 hazır, review için atadım.	2026-04-25 02:02:28.768392+00	1	2026-04-29 11:02:04.785991+00	f	\N
74	180	22	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-26 00:02:28.768392+00	1	2026-04-29 11:02:04.785991+00	f	\N
75	184	4	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-19 08:02:28.811876+00	1	2026-04-29 11:02:04.785991+00	f	\N
76	185	22	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-12 02:02:28.819616+00	1	2026-04-29 11:02:04.785991+00	f	\N
77	188	9	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-28 14:02:28.85876+00	1	2026-04-29 11:02:04.785991+00	f	\N
78	189	23	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-18 22:02:28.864025+00	1	2026-04-29 11:02:04.785991+00	f	\N
79	191	97	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-25 03:02:28.888595+00	1	2026-04-29 11:02:04.785991+00	f	\N
80	193	22	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-15 00:02:28.90985+00	1	2026-04-29 11:02:04.785991+00	f	\N
81	195	42	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-25 08:02:28.932884+00	1	2026-04-29 11:02:04.785991+00	f	\N
82	197	22	Feature flag açıldı, A/B test başladı.	2026-04-25 02:02:28.972032+00	1	2026-04-29 11:02:04.785991+00	f	\N
83	198	9	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-16 12:02:28.988945+00	1	2026-04-29 11:02:04.785991+00	f	\N
84	199	50	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-14 22:02:29.0012+00	1	2026-04-29 11:02:04.785991+00	f	\N
85	201	46	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-16 12:02:29.043472+00	1	2026-04-29 11:02:04.785991+00	f	\N
86	202	22	PR #314 hazır, review için atadım.	2026-04-21 01:02:29.050221+00	1	2026-04-29 11:02:04.785991+00	f	\N
87	203	87	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-13 19:02:29.06531+00	1	2026-04-29 11:02:04.785991+00	f	\N
88	204	10	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-21 13:02:29.079251+00	1	2026-04-29 11:02:04.785991+00	f	\N
89	205	22	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-21 22:02:29.093035+00	1	2026-04-29 11:02:04.785991+00	f	\N
90	207	46	PR #314 hazır, review için atadım.	2026-04-17 17:02:29.121764+00	1	2026-04-29 11:02:04.785991+00	f	\N
91	208	46	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-19 18:02:29.12736+00	1	2026-04-29 11:02:04.785991+00	f	\N
92	209	43	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-17 05:02:29.137013+00	1	2026-04-29 11:02:04.785991+00	f	\N
93	210	73	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-17 16:02:29.151642+00	1	2026-04-29 11:02:04.785991+00	f	\N
94	210	87	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-19 00:02:29.151642+00	1	2026-04-29 11:02:04.785991+00	f	\N
95	211	10	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-10 15:02:29.162844+00	1	2026-04-29 11:02:04.785991+00	f	\N
96	213	87	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-24 15:02:29.193964+00	1	2026-04-29 11:02:04.785991+00	f	\N
97	214	73	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-12 03:02:29.200272+00	1	2026-04-29 11:02:04.785991+00	f	\N
98	214	22	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-12 16:02:29.200272+00	1	2026-04-29 11:02:04.785991+00	f	\N
99	215	43	PR #314 hazır, review için atadım.	2026-04-15 12:02:29.214673+00	1	2026-04-29 11:02:04.785991+00	f	\N
100	217	22	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-17 22:02:29.243213+00	1	2026-04-29 11:02:04.785991+00	f	\N
101	218	10	Feature flag açıldı, A/B test başladı.	2026-04-26 05:02:29.249315+00	1	2026-04-29 11:02:04.785991+00	f	\N
102	218	10	Feature flag açıldı, A/B test başladı.	2026-04-28 15:02:29.249315+00	1	2026-04-29 11:02:04.785991+00	f	\N
103	219	10	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-11 08:02:29.259594+00	1	2026-04-29 11:02:04.785991+00	f	\N
104	219	87	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-14 06:02:29.259594+00	1	2026-04-29 11:02:04.785991+00	f	\N
105	220	23	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-27 15:02:29.275283+00	1	2026-04-29 11:02:04.785991+00	f	\N
106	220	22	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-30 08:02:29.275283+00	1	2026-04-29 11:02:04.785991+00	f	\N
107	221	22	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-14 18:02:29.290171+00	1	2026-04-29 11:02:04.785991+00	f	\N
108	224	22	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-17 10:02:29.319888+00	1	2026-04-29 11:02:04.785991+00	f	\N
109	226	46	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-13 15:02:29.335742+00	1	2026-04-29 11:02:04.785991+00	f	\N
110	226	23	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-16 05:02:29.335742+00	1	2026-04-29 11:02:04.785991+00	f	\N
111	227	51	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-23 13:02:29.342693+00	1	2026-04-29 11:02:04.785991+00	f	\N
112	228	45	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-20 20:02:29.352103+00	1	2026-04-29 11:02:04.785991+00	f	\N
113	228	51	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-23 04:02:29.352103+00	1	2026-04-29 11:02:04.785991+00	f	\N
114	231	57	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-25 06:02:29.386894+00	1	2026-04-29 11:02:04.785991+00	f	\N
115	232	20	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-14 08:02:29.392347+00	1	2026-04-29 11:02:04.785991+00	f	\N
116	232	30	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-15 16:02:29.392347+00	1	2026-04-29 11:02:04.785991+00	f	\N
117	235	11	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-22 16:02:29.415375+00	1	2026-04-29 11:02:04.785991+00	f	\N
118	238	64	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-22 18:02:29.438094+00	1	2026-04-29 11:02:04.785991+00	f	\N
119	238	30	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-24 01:02:29.438094+00	1	2026-04-29 11:02:04.785991+00	f	\N
120	240	57	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-12 22:02:29.4517+00	1	2026-04-29 11:02:04.785991+00	f	\N
121	240	57	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-14 15:02:29.4517+00	1	2026-04-29 11:02:04.785991+00	f	\N
122	241	30	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-15 17:02:29.45977+00	1	2026-04-29 11:02:04.785991+00	f	\N
123	243	57	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-28 08:02:29.480053+00	1	2026-04-29 11:02:04.785991+00	f	\N
124	244	30	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-16 20:02:29.484077+00	1	2026-04-29 11:02:04.785991+00	f	\N
125	244	83	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-19 04:02:29.484077+00	1	2026-04-29 11:02:04.785991+00	f	\N
126	245	83	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-22 06:02:29.493653+00	1	2026-04-29 11:02:04.785991+00	f	\N
127	245	59	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-24 01:02:29.493653+00	1	2026-04-29 11:02:04.785991+00	f	\N
128	246	59	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-12 15:02:29.504598+00	1	2026-04-29 11:02:04.785991+00	f	\N
129	247	46	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-19 19:02:29.51461+00	1	2026-04-29 11:02:04.785991+00	f	\N
130	249	48	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-15 13:02:29.532012+00	1	2026-04-29 11:02:04.785991+00	f	\N
131	249	48	PR #314 hazır, review için atadım.	2026-04-17 16:02:29.532012+00	1	2026-04-29 11:02:04.785991+00	f	\N
132	250	63	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-16 14:02:29.535261+00	1	2026-04-29 11:02:04.785991+00	f	\N
133	251	30	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-17 05:02:29.544831+00	1	2026-04-29 11:02:04.785991+00	f	\N
134	252	59	PR #314 hazır, review için atadım.	2026-04-25 06:02:29.554323+00	1	2026-04-29 11:02:04.785991+00	f	\N
135	253	55	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-20 08:02:29.564251+00	1	2026-04-29 11:02:04.785991+00	f	\N
136	255	5	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-22 14:02:29.582148+00	1	2026-04-29 11:02:04.785991+00	f	\N
137	256	46	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-11 02:02:29.587207+00	1	2026-04-29 11:02:04.785991+00	f	\N
138	257	5	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-16 15:02:29.597+00	1	2026-04-29 11:02:04.785991+00	f	\N
139	257	30	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-18 09:02:29.597+00	1	2026-04-29 11:02:04.785991+00	f	\N
140	259	30	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-11 13:02:29.615267+00	1	2026-04-29 11:02:04.785991+00	f	\N
141	263	50	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-18 09:02:29.650421+00	1	2026-04-29 11:02:04.785991+00	f	\N
142	265	33	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-25 23:02:29.665846+00	1	2026-04-29 11:02:04.785991+00	f	\N
143	266	13	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-18 16:02:29.673446+00	1	2026-04-29 11:02:04.785991+00	f	\N
144	268	50	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-23 00:02:29.691355+00	1	2026-04-29 11:02:04.785991+00	f	\N
145	269	39	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-12 00:02:29.694706+00	1	2026-04-29 11:02:04.785991+00	f	\N
146	270	52	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-24 07:02:29.703321+00	1	2026-04-29 11:02:04.785991+00	f	\N
147	270	82	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-27 12:02:29.703321+00	1	2026-04-29 11:02:04.785991+00	f	\N
148	271	37	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-22 07:02:29.712346+00	1	2026-04-29 11:02:04.785991+00	f	\N
149	271	50	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-23 06:02:29.712346+00	1	2026-04-29 11:02:04.785991+00	f	\N
150	273	37	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-20 14:02:29.731184+00	1	2026-04-29 11:02:04.785991+00	f	\N
151	274	38	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-20 11:02:29.734769+00	1	2026-04-29 11:02:04.785991+00	f	\N
152	275	52	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-23 07:02:29.744449+00	1	2026-04-29 11:02:04.785991+00	f	\N
153	277	33	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-26 05:02:29.762976+00	1	2026-04-29 11:02:04.785991+00	f	\N
154	278	82	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-27 01:02:29.766539+00	1	2026-04-29 11:02:04.785991+00	f	\N
155	279	57	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-21 21:02:29.775282+00	1	2026-04-29 11:02:04.785991+00	f	\N
156	279	57	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-24 06:02:29.775282+00	1	2026-04-29 11:02:04.785991+00	f	\N
157	280	37	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-15 21:02:29.784123+00	1	2026-04-29 11:02:04.785991+00	f	\N
158	285	33	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-20 22:02:29.816778+00	1	2026-04-29 11:02:04.785991+00	f	\N
159	286	39	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-19 06:02:29.824602+00	1	2026-04-29 11:02:04.785991+00	f	\N
160	287	38	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-15 19:02:29.83166+00	1	2026-04-29 11:02:04.785991+00	f	\N
161	289	37	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-23 16:02:29.847448+00	1	2026-04-29 11:02:04.785991+00	f	\N
162	290	82	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-14 22:02:29.851074+00	1	2026-04-29 11:02:04.785991+00	f	\N
163	290	45	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-18 14:02:29.851074+00	1	2026-04-29 11:02:04.785991+00	f	\N
164	293	38	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-18 17:02:29.877558+00	1	2026-04-29 11:02:04.785991+00	f	\N
165	296	46	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-19 04:02:29.911693+00	1	2026-04-29 11:02:04.785991+00	f	\N
166	297	13	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-13 14:02:29.91591+00	1	2026-04-29 11:02:04.785991+00	f	\N
167	298	61	PR #314 hazır, review için atadım.	2026-04-12 00:02:29.924651+00	1	2026-04-29 11:02:04.785991+00	f	\N
168	298	13	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-13 04:02:29.924651+00	1	2026-04-29 11:02:04.785991+00	f	\N
169	299	35	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-17 10:02:29.930925+00	1	2026-04-29 11:02:04.785991+00	f	\N
170	301	46	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-12 17:02:29.946405+00	1	2026-04-29 11:02:04.785991+00	f	\N
171	302	29	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-14 16:02:29.949887+00	1	2026-04-29 11:02:04.785991+00	f	\N
172	303	35	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-15 14:02:29.958711+00	1	2026-04-29 11:02:04.785991+00	f	\N
173	304	29	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-21 18:02:29.965194+00	1	2026-04-29 11:02:04.785991+00	f	\N
174	305	60	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-20 22:02:29.974492+00	1	2026-04-29 11:02:04.785991+00	f	\N
175	306	60	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-25 13:02:29.980947+00	1	2026-04-29 11:02:04.785991+00	f	\N
289	474	76	PR #314 hazır, review için atadım.	2026-04-11 21:02:31.292247+00	1	2026-04-29 11:02:04.785991+00	f	\N
176	308	46	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-28 19:02:29.998641+00	1	2026-04-29 11:02:04.785991+00	f	\N
177	309	61	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-24 13:02:30.002347+00	1	2026-04-29 11:02:04.785991+00	f	\N
178	309	61	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-26 07:02:30.002347+00	1	2026-04-29 11:02:04.785991+00	f	\N
179	310	6	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-14 15:02:30.008274+00	1	2026-04-29 11:02:04.785991+00	f	\N
180	311	35	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-27 02:02:30.01749+00	1	2026-04-29 11:02:04.785991+00	f	\N
181	312	29	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-13 23:02:30.027282+00	1	2026-04-29 11:02:04.785991+00	f	\N
182	314	29	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-27 17:02:30.045523+00	1	2026-04-29 11:02:04.785991+00	f	\N
183	315	60	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-18 04:02:30.04883+00	1	2026-04-29 11:02:04.785991+00	f	\N
184	316	13	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-12 13:02:30.05818+00	1	2026-04-29 11:02:04.785991+00	f	\N
185	316	29	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-14 21:02:30.05818+00	1	2026-04-29 11:02:04.785991+00	f	\N
186	319	29	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-16 21:02:30.081639+00	1	2026-04-29 11:02:04.785991+00	f	\N
187	321	35	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-17 09:02:30.095166+00	1	2026-04-29 11:02:04.785991+00	f	\N
188	322	29	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-23 20:02:30.099246+00	1	2026-04-29 11:02:04.785991+00	f	\N
189	322	29	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-27 03:02:30.099246+00	1	2026-04-29 11:02:04.785991+00	f	\N
190	325	29	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-24 06:02:30.143219+00	1	2026-04-29 11:02:04.785991+00	f	\N
191	325	29	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-25 03:02:30.143219+00	1	2026-04-29 11:02:04.785991+00	f	\N
192	326	35	PR #314 hazır, review için atadım.	2026-04-24 07:02:30.150589+00	1	2026-04-29 11:02:04.785991+00	f	\N
193	327	46	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-11 19:02:30.161389+00	1	2026-04-29 11:02:04.785991+00	f	\N
194	328	46	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-14 10:02:30.171868+00	1	2026-04-29 11:02:04.785991+00	f	\N
195	330	60	PR #314 hazır, review için atadım.	2026-04-14 17:02:30.198732+00	1	2026-04-29 11:02:04.785991+00	f	\N
196	337	62	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-22 10:02:30.245063+00	1	2026-04-29 11:02:04.785991+00	f	\N
197	338	14	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-12 04:02:30.252502+00	1	2026-04-29 11:02:04.785991+00	f	\N
198	341	77	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-22 18:02:30.273888+00	1	2026-04-29 11:02:04.785991+00	f	\N
199	342	11	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-23 18:02:30.278382+00	1	2026-04-29 11:02:04.785991+00	f	\N
200	343	77	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-11 12:02:30.287543+00	1	2026-04-29 11:02:04.785991+00	f	\N
201	345	14	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-23 20:02:30.307479+00	1	2026-04-29 11:02:04.785991+00	f	\N
202	348	14	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-12 15:02:30.322862+00	1	2026-04-29 11:02:04.785991+00	f	\N
203	350	30	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-25 12:02:30.337121+00	1	2026-04-29 11:02:04.785991+00	f	\N
204	355	14	Feature flag açıldı, A/B test başladı.	2026-04-20 20:02:30.367269+00	1	2026-04-29 11:02:04.785991+00	f	\N
205	356	77	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-24 05:02:30.375804+00	1	2026-04-29 11:02:04.785991+00	f	\N
206	356	11	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-24 21:02:30.375804+00	1	2026-04-29 11:02:04.785991+00	f	\N
207	357	14	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-27 08:02:30.385518+00	1	2026-04-29 11:02:04.785991+00	f	\N
208	357	57	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-30 15:02:30.385518+00	1	2026-04-29 11:02:04.785991+00	f	\N
209	358	14	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-26 18:02:30.394497+00	1	2026-04-29 11:02:04.785991+00	f	\N
210	361	85	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-18 08:02:30.42464+00	1	2026-04-29 11:02:04.785991+00	f	\N
211	363	85	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-14 06:02:30.439021+00	1	2026-04-29 11:02:04.785991+00	f	\N
212	363	9	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-16 18:02:30.439021+00	1	2026-04-29 11:02:04.785991+00	f	\N
213	366	15	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-13 23:02:30.459254+00	1	2026-04-29 11:02:04.785991+00	f	\N
214	367	1	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-27 10:02:30.46627+00	1	2026-04-29 11:02:04.785991+00	f	\N
215	368	16	Feature flag açıldı, A/B test başladı.	2026-04-14 21:02:30.475046+00	1	2026-04-29 11:02:04.785991+00	f	\N
216	368	68	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-18 11:02:30.475046+00	1	2026-04-29 11:02:04.785991+00	f	\N
217	372	16	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-22 13:02:30.505393+00	1	2026-04-29 11:02:04.785991+00	f	\N
218	373	85	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-16 22:02:30.512562+00	1	2026-04-29 11:02:04.785991+00	f	\N
219	374	16	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-26 23:02:30.521232+00	1	2026-04-29 11:02:04.785991+00	f	\N
220	374	9	PR #314 hazır, review için atadım.	2026-04-30 11:02:30.521232+00	1	2026-04-29 11:02:04.785991+00	f	\N
221	375	21	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-16 16:02:30.530302+00	1	2026-04-29 11:02:04.785991+00	f	\N
222	377	21	Feature flag açıldı, A/B test başladı.	2026-04-11 06:02:30.547607+00	1	2026-04-29 11:02:04.785991+00	f	\N
223	379	15	Feature flag açıldı, A/B test başladı.	2026-04-21 10:02:30.561909+00	1	2026-04-29 11:02:04.785991+00	f	\N
224	380	10	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-26 18:02:30.571804+00	1	2026-04-29 11:02:04.785991+00	f	\N
225	383	16	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-21 15:02:30.604256+00	1	2026-04-29 11:02:04.785991+00	f	\N
226	384	67	PR #314 hazır, review için atadım.	2026-04-27 00:02:30.609462+00	1	2026-04-29 11:02:04.785991+00	f	\N
227	386	85	Feature flag açıldı, A/B test başladı.	2026-04-20 23:02:30.628742+00	1	2026-04-29 11:02:04.785991+00	f	\N
228	388	68	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-25 05:02:30.643612+00	1	2026-04-29 11:02:04.785991+00	f	\N
229	390	3	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-19 03:02:30.670936+00	1	2026-04-29 11:02:04.785991+00	f	\N
230	390	82	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-21 22:02:30.670936+00	1	2026-04-29 11:02:04.785991+00	f	\N
231	391	25	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-13 08:02:30.674562+00	1	2026-04-29 11:02:04.785991+00	f	\N
232	391	16	PR #314 hazır, review için atadım.	2026-04-14 20:02:30.674562+00	1	2026-04-29 11:02:04.785991+00	f	\N
233	393	25	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-14 06:02:30.695533+00	1	2026-04-29 11:02:04.785991+00	f	\N
234	394	16	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-27 18:02:30.700646+00	1	2026-04-29 11:02:04.785991+00	f	\N
235	394	37	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-29 09:02:30.700646+00	1	2026-04-29 11:02:04.785991+00	f	\N
236	396	76	Feature flag açıldı, A/B test başladı.	2026-04-15 23:02:30.718387+00	1	2026-04-29 11:02:04.785991+00	f	\N
237	396	25	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-17 20:02:30.718387+00	1	2026-04-29 11:02:04.785991+00	f	\N
238	398	82	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-25 17:02:30.732327+00	1	2026-04-29 11:02:04.785991+00	f	\N
239	402	32	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-20 02:02:30.767663+00	1	2026-04-29 11:02:04.785991+00	f	\N
240	403	76	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-12 04:02:30.771374+00	1	2026-04-29 11:02:04.785991+00	f	\N
241	403	25	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-14 01:02:30.771374+00	1	2026-04-29 11:02:04.785991+00	f	\N
242	406	82	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-18 07:02:30.798421+00	1	2026-04-29 11:02:04.785991+00	f	\N
243	407	32	Feature flag açıldı, A/B test başladı.	2026-04-19 13:02:30.802445+00	1	2026-04-29 11:02:04.785991+00	f	\N
244	408	32	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-23 03:02:30.811283+00	1	2026-04-29 11:02:04.785991+00	f	\N
245	409	47	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-12 06:02:30.819703+00	1	2026-04-29 11:02:04.785991+00	f	\N
246	409	3	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-15 00:02:30.819703+00	1	2026-04-29 11:02:04.785991+00	f	\N
247	410	3	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-29 14:02:30.82834+00	1	2026-04-29 11:02:04.785991+00	f	\N
248	413	32	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-24 04:02:30.85322+00	1	2026-04-29 11:02:04.785991+00	f	\N
249	413	42	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-25 14:02:30.85322+00	1	2026-04-29 11:02:04.785991+00	f	\N
250	414	37	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-14 23:02:30.856989+00	1	2026-04-29 11:02:04.785991+00	f	\N
251	417	15	Feature flag açıldı, A/B test başladı.	2026-04-30 15:02:30.895963+00	1	2026-04-29 11:02:04.785991+00	f	\N
252	419	57	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-23 10:02:30.908509+00	1	2026-04-29 11:02:04.785991+00	f	\N
253	419	89	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-25 07:02:30.908509+00	1	2026-04-29 11:02:04.785991+00	f	\N
254	422	20	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-26 21:02:30.928987+00	1	2026-04-29 11:02:04.785991+00	f	\N
255	424	53	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-10 12:02:30.941944+00	1	2026-04-29 11:02:04.785991+00	f	\N
256	425	53	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-27 22:02:30.948961+00	1	2026-04-29 11:02:04.785991+00	f	\N
257	426	89	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-27 02:02:30.957727+00	1	2026-04-29 11:02:04.785991+00	f	\N
258	427	15	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-20 04:02:30.966324+00	1	2026-04-29 11:02:04.785991+00	f	\N
259	430	62	PR #314 hazır, review için atadım.	2026-04-10 15:02:30.983461+00	1	2026-04-29 11:02:04.785991+00	f	\N
260	431	53	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-18 09:02:30.987854+00	1	2026-04-29 11:02:04.785991+00	f	\N
261	433	25	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-17 03:02:31.000906+00	1	2026-04-29 11:02:04.785991+00	f	\N
262	434	25	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-19 15:02:31.004484+00	1	2026-04-29 11:02:04.785991+00	f	\N
263	434	25	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-22 06:02:31.004484+00	1	2026-04-29 11:02:04.785991+00	f	\N
264	435	41	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-27 16:02:31.01303+00	1	2026-04-29 11:02:04.785991+00	f	\N
265	441	17	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-28 06:02:31.050183+00	1	2026-04-29 11:02:04.785991+00	f	\N
266	441	41	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-28 17:02:31.050183+00	1	2026-04-29 11:02:04.785991+00	f	\N
267	442	86	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-24 17:02:31.05547+00	1	2026-04-29 11:02:04.785991+00	f	\N
268	447	53	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-28 12:02:31.091209+00	1	2026-04-29 11:02:04.785991+00	f	\N
269	448	53	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-16 12:02:31.096426+00	1	2026-04-29 11:02:04.785991+00	f	\N
270	449	89	Feature flag açıldı, A/B test başladı.	2026-04-23 20:02:31.104955+00	1	2026-04-29 11:02:04.785991+00	f	\N
271	451	8	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-12 01:02:31.127622+00	1	2026-04-29 11:02:04.785991+00	f	\N
272	451	88	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-13 19:02:31.127622+00	1	2026-04-29 11:02:04.785991+00	f	\N
273	452	88	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-14 09:02:31.130936+00	1	2026-04-29 11:02:04.785991+00	f	\N
274	453	26	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-23 03:02:31.138192+00	1	2026-04-29 11:02:04.785991+00	f	\N
275	456	76	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-26 04:02:31.159202+00	1	2026-04-29 11:02:04.785991+00	f	\N
276	456	8	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-28 11:02:31.159202+00	1	2026-04-29 11:02:04.785991+00	f	\N
277	457	26	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-16 04:02:31.163159+00	1	2026-04-29 11:02:04.785991+00	f	\N
278	459	39	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-27 14:02:31.178485+00	1	2026-04-29 11:02:04.785991+00	f	\N
279	462	22	Feature flag açıldı, A/B test başladı.	2026-04-18 06:02:31.198854+00	1	2026-04-29 11:02:04.785991+00	f	\N
280	463	8	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-24 12:02:31.201852+00	1	2026-04-29 11:02:04.785991+00	f	\N
281	465	76	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-26 08:02:31.219719+00	1	2026-04-29 11:02:04.785991+00	f	\N
282	466	39	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-16 08:02:31.22823+00	1	2026-04-29 11:02:04.785991+00	f	\N
283	466	88	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-17 14:02:31.22823+00	1	2026-04-29 11:02:04.785991+00	f	\N
284	468	8	Feature flag açıldı, A/B test başladı.	2026-04-19 22:02:31.25243+00	1	2026-04-29 11:02:04.785991+00	f	\N
285	469	8	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-23 19:02:31.25631+00	1	2026-04-29 11:02:04.785991+00	f	\N
286	470	76	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-11 07:02:31.265476+00	1	2026-04-29 11:02:04.785991+00	f	\N
287	470	26	PR #314 hazır, review için atadım.	2026-04-13 18:02:31.265476+00	1	2026-04-29 11:02:04.785991+00	f	\N
288	471	88	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-20 09:02:31.272179+00	1	2026-04-29 11:02:04.785991+00	f	\N
290	475	22	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-20 05:02:31.299869+00	1	2026-04-29 11:02:04.785991+00	f	\N
291	476	39	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-26 05:02:31.308233+00	1	2026-04-29 11:02:04.785991+00	f	\N
292	479	76	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-13 00:02:31.325607+00	1	2026-04-29 11:02:04.785991+00	f	\N
293	480	88	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-14 11:02:31.332268+00	1	2026-04-29 11:02:04.785991+00	f	\N
294	482	69	PR #314 hazır, review için atadım.	2026-04-25 22:02:31.361443+00	1	2026-04-29 11:02:04.785991+00	f	\N
295	484	55	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-17 06:02:31.373654+00	1	2026-04-29 11:02:04.785991+00	f	\N
296	485	14	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-22 20:02:31.378771+00	1	2026-04-29 11:02:04.785991+00	f	\N
297	485	55	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-26 00:02:31.378771+00	1	2026-04-29 11:02:04.785991+00	f	\N
298	486	80	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-10 15:02:31.387635+00	1	2026-04-29 11:02:04.785991+00	f	\N
299	488	80	Feature flag açıldı, A/B test başladı.	2026-04-27 21:02:31.405153+00	1	2026-04-29 11:02:04.785991+00	f	\N
300	489	14	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-20 16:02:31.40882+00	1	2026-04-29 11:02:04.785991+00	f	\N
301	491	66	PR #314 hazır, review için atadım.	2026-04-14 05:02:31.423151+00	1	2026-04-29 11:02:04.785991+00	f	\N
302	491	54	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-16 04:02:31.423151+00	1	2026-04-29 11:02:04.785991+00	f	\N
303	493	55	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-17 02:02:31.438888+00	1	2026-04-29 11:02:04.785991+00	f	\N
304	494	19	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-13 23:02:31.44252+00	1	2026-04-29 11:02:04.785991+00	f	\N
305	495	19	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-23 23:02:31.450865+00	1	2026-04-29 11:02:04.785991+00	f	\N
306	497	55	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-27 08:02:31.468067+00	1	2026-04-29 11:02:04.785991+00	f	\N
307	498	89	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-25 13:02:31.471273+00	1	2026-04-29 11:02:04.785991+00	f	\N
308	499	14	PR #314 hazır, review için atadım.	2026-04-14 23:02:31.479616+00	1	2026-04-29 11:02:04.785991+00	f	\N
309	500	19	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-16 00:02:31.487993+00	1	2026-04-29 11:02:04.785991+00	f	\N
310	501	45	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-14 02:02:31.496082+00	1	2026-04-29 11:02:04.785991+00	f	\N
311	502	45	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-20 11:02:31.502076+00	1	2026-04-29 11:02:04.785991+00	f	\N
312	505	25	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-20 21:02:31.520114+00	1	2026-04-29 11:02:04.785991+00	f	\N
313	505	62	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-22 14:02:31.520114+00	1	2026-04-29 11:02:04.785991+00	f	\N
314	506	55	Feature flag açıldı, A/B test başladı.	2026-04-15 07:02:31.525067+00	1	2026-04-29 11:02:04.785991+00	f	\N
315	506	80	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-16 13:02:31.525067+00	1	2026-04-29 11:02:04.785991+00	f	\N
316	507	14	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-13 17:02:31.533631+00	1	2026-04-29 11:02:04.785991+00	f	\N
317	507	55	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-16 07:02:31.533631+00	1	2026-04-29 11:02:04.785991+00	f	\N
318	508	62	PR #314 hazır, review için atadım.	2026-04-11 11:02:31.539765+00	1	2026-04-29 11:02:04.785991+00	f	\N
319	509	14	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-13 15:02:31.548303+00	1	2026-04-29 11:02:04.785991+00	f	\N
320	511	27	Feature flag açıldı, A/B test başladı.	2026-04-14 12:02:31.570135+00	1	2026-04-29 11:02:04.785991+00	f	\N
321	512	42	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-20 22:02:31.573948+00	1	2026-04-29 11:02:04.785991+00	f	\N
322	512	27	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-22 21:02:31.573948+00	1	2026-04-29 11:02:04.785991+00	f	\N
323	516	97	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-20 12:02:31.606353+00	1	2026-04-29 11:02:04.785991+00	f	\N
324	517	97	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-16 11:02:31.609977+00	1	2026-04-29 11:02:04.785991+00	f	\N
325	519	35	Feature flag açıldı, A/B test başladı.	2026-04-21 11:02:31.624943+00	1	2026-04-29 11:02:04.785991+00	f	\N
326	521	42	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-20 12:02:31.640629+00	1	2026-04-29 11:02:04.785991+00	f	\N
327	522	54	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-30 02:02:31.644198+00	1	2026-04-29 11:02:04.785991+00	f	\N
328	523	20	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-16 01:02:31.6522+00	1	2026-04-29 11:02:04.785991+00	f	\N
329	524	97	PR #314 hazır, review için atadım.	2026-04-24 04:02:31.660689+00	1	2026-04-29 11:02:04.785991+00	f	\N
330	525	20	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-26 05:02:31.669799+00	1	2026-04-29 11:02:04.785991+00	f	\N
331	527	42	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-18 04:02:31.68397+00	1	2026-04-29 11:02:04.785991+00	f	\N
332	528	97	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-28 07:02:31.686929+00	1	2026-04-29 11:02:04.785991+00	f	\N
333	528	20	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-29 09:02:31.686929+00	1	2026-04-29 11:02:04.785991+00	f	\N
334	529	97	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-21 13:02:31.693334+00	1	2026-04-29 11:02:04.785991+00	f	\N
335	530	97	PR #314 hazır, review için atadım.	2026-04-26 00:02:31.702047+00	1	2026-04-29 11:02:04.785991+00	f	\N
336	530	20	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-26 22:02:31.702047+00	1	2026-04-29 11:02:04.785991+00	f	\N
337	531	35	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-13 01:02:31.710975+00	1	2026-04-29 11:02:04.785991+00	f	\N
338	532	54	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-21 05:02:31.71938+00	1	2026-04-29 11:02:04.785991+00	f	\N
339	534	95	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-10 15:02:31.749208+00	1	2026-04-29 11:02:04.785991+00	f	\N
340	534	22	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-13 11:02:31.749208+00	1	2026-04-29 11:02:04.785991+00	f	\N
341	535	22	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-15 10:02:31.752601+00	1	2026-04-29 11:02:04.785991+00	f	\N
342	535	51	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-17 01:02:31.752601+00	1	2026-04-29 11:02:04.785991+00	f	\N
343	536	95	Feature flag açıldı, A/B test başladı.	2026-04-28 10:02:31.759221+00	1	2026-04-29 11:02:04.785991+00	f	\N
344	541	22	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-14 05:02:31.792622+00	1	2026-04-29 11:02:04.785991+00	f	\N
345	542	95	Feature flag açıldı, A/B test başladı.	2026-04-27 22:02:31.800438+00	1	2026-04-29 11:02:04.785991+00	f	\N
346	543	9	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-10 23:02:31.806895+00	1	2026-04-29 11:02:04.785991+00	f	\N
347	545	51	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-26 02:02:31.824701+00	1	2026-04-29 11:02:04.785991+00	f	\N
348	546	75	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-24 20:02:31.828297+00	1	2026-04-29 11:02:04.785991+00	f	\N
349	547	67	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-16 06:02:31.837873+00	1	2026-04-29 11:02:04.785991+00	f	\N
350	549	51	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-17 07:02:31.858121+00	1	2026-04-29 11:02:04.785991+00	f	\N
351	550	52	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-22 07:02:31.861885+00	1	2026-04-29 11:02:04.785991+00	f	\N
352	552	38	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-21 09:02:31.880823+00	1	2026-04-29 11:02:04.785991+00	f	\N
353	553	75	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-14 08:02:31.89122+00	1	2026-04-29 11:02:04.785991+00	f	\N
354	553	67	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-14 19:02:31.89122+00	1	2026-04-29 11:02:04.785991+00	f	\N
355	554	3	Bu kısımda performans sorunu tespit ettim — N+1 sorgu var, düzelteceğim.	2026-04-22 18:02:31.900386+00	1	2026-04-29 11:02:04.785991+00	f	\N
356	554	64	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-24 14:02:31.900386+00	1	2026-04-29 11:02:04.785991+00	f	\N
357	557	9	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-26 08:02:31.918742+00	1	2026-04-29 11:02:04.785991+00	f	\N
358	558	9	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-12 01:02:31.92344+00	1	2026-04-29 11:02:04.785991+00	f	\N
359	560	59	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-11 23:02:31.943871+00	1	2026-04-29 11:02:04.785991+00	f	\N
360	561	70	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-12 02:02:31.947834+00	1	2026-04-29 11:02:04.785991+00	f	\N
361	561	27	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-14 07:02:31.947834+00	1	2026-04-29 11:02:04.785991+00	f	\N
362	562	23	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-20 07:02:31.957106+00	1	2026-04-29 11:02:04.785991+00	f	\N
363	564	53	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-21 07:02:31.972599+00	1	2026-04-29 11:02:04.785991+00	f	\N
364	569	10	Feature flag açıldı, A/B test başladı.	2026-04-17 15:02:32.000491+00	1	2026-04-29 11:02:04.785991+00	f	\N
365	569	59	Feature flag açıldı, A/B test başladı.	2026-04-19 11:02:32.000491+00	1	2026-04-29 11:02:04.785991+00	f	\N
366	570	23	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-11 23:02:32.007457+00	1	2026-04-29 11:02:04.785991+00	f	\N
367	570	20	Feature flag açıldı, A/B test başladı.	2026-04-13 03:02:32.007457+00	1	2026-04-29 11:02:04.785991+00	f	\N
368	571	61	Feature flag açıldı, A/B test başladı.	2026-04-18 11:02:32.018019+00	1	2026-04-29 11:02:04.785991+00	f	\N
369	571	23	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-21 04:02:32.018019+00	1	2026-04-29 11:02:04.785991+00	f	\N
370	572	93	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-21 15:02:32.032772+00	1	2026-04-29 11:02:04.785991+00	f	\N
371	576	68	Tasarım gözden geçirme toplantısı tamamlandı, tüm yorumlar uygulandı.	2026-04-17 17:02:32.069935+00	1	2026-04-29 11:02:04.785991+00	f	\N
372	576	27	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-21 13:02:32.069935+00	1	2026-04-29 11:02:04.785991+00	f	\N
373	577	61	Entegrasyon ortamında takıldık, DBA yardımı bekliyoruz.	2026-04-14 12:02:32.078192+00	1	2026-04-29 11:02:04.785991+00	f	\N
374	577	23	Feature flag açıldı, A/B test başladı.	2026-04-17 23:02:32.078192+00	1	2026-04-29 11:02:04.785991+00	f	\N
375	578	23	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-25 04:02:32.091912+00	1	2026-04-29 11:02:04.785991+00	f	\N
376	578	27	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-27 04:02:32.091912+00	1	2026-04-29 11:02:04.785991+00	f	\N
377	579	10	Security audit geçti, sadece 2 low-severity bulgu var.	2026-04-25 17:02:32.104302+00	1	2026-04-29 11:02:04.785991+00	f	\N
378	580	94	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-23 09:02:32.117367+00	1	2026-04-29 11:02:04.785991+00	f	\N
379	582	70	Redis cache stratejisi güncellendi, hit rate %94'e çıktı.	2026-04-16 08:02:32.139001+00	1	2026-04-29 11:02:04.785991+00	f	\N
380	582	70	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-18 21:02:32.139001+00	1	2026-04-29 11:02:04.785991+00	f	\N
381	583	59	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-18 00:02:32.143104+00	1	2026-04-29 11:02:04.785991+00	f	\N
382	583	59	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-19 20:02:32.143104+00	1	2026-04-29 11:02:04.785991+00	f	\N
383	584	94	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-25 02:02:32.150829+00	1	2026-04-29 11:02:04.785991+00	f	\N
384	584	59	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-27 10:02:32.150829+00	1	2026-04-29 11:02:04.785991+00	f	\N
385	585	68	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-10 18:02:32.159286+00	1	2026-04-29 11:02:04.785991+00	f	\N
386	587	70	Test coverage'ı %72'ye çektik, hedef %85; devam ediyorum.	2026-04-29 19:02:32.178466+00	1	2026-04-29 11:02:04.785991+00	f	\N
387	589	33	Feature flag açıldı, A/B test başladı.	2026-04-13 11:02:32.205737+00	1	2026-04-29 11:02:04.785991+00	f	\N
388	591	29	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-24 02:02:32.218116+00	1	2026-04-29 11:02:04.785991+00	f	\N
389	592	45	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-13 05:02:32.224864+00	1	2026-04-29 11:02:04.785991+00	f	\N
390	592	11	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-14 17:02:32.224864+00	1	2026-04-29 11:02:04.785991+00	f	\N
391	594	33	PR #314 hazır, review için atadım.	2026-04-14 19:02:32.238996+00	1	2026-04-29 11:02:04.785991+00	f	\N
392	594	3	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-18 11:02:32.238996+00	1	2026-04-29 11:02:04.785991+00	f	\N
393	596	95	Staging'de çalışıyor, prod dağıtım için onay bekliyorum.	2026-04-18 14:02:32.250002+00	1	2026-04-29 11:02:04.785991+00	f	\N
394	597	95	Mimari karar kaydı (ADR) Confluence'a eklendi.	2026-04-27 03:02:32.255005+00	1	2026-04-29 11:02:04.785991+00	f	\N
395	600	29	API sözleşmesi güncellendi, lütfen Swagger'ı kontrol edin.	2026-04-22 15:02:32.275901+00	1	2026-04-29 11:02:04.785991+00	f	\N
396	601	29	Bağımlılık kütüphanesi güncellendi; breaking change yok.	2026-04-22 01:02:32.280947+00	1	2026-04-29 11:02:04.785991+00	f	\N
397	604	45	Hata raporunu ekledim, root cause bulundu ve düzeltildi.	2026-04-11 21:02:32.301827+00	1	2026-04-29 11:02:04.785991+00	f	\N
398	605	29	Load test tamamlandı: 2000 rps'de p99 gecikme 180ms.	2026-04-28 09:02:32.311376+00	1	2026-04-29 11:02:04.785991+00	f	\N
399	606	23	Müşteri ile UAT toplantısı yapıldı; küçük UI düzeltmeleri istendi.	2026-04-20 19:02:32.327246+00	1	2026-04-29 11:02:04.785991+00	f	\N
400	606	5	Sprint review'da demo yapıldı, ürün sahibi onayladı.	2026-04-23 03:02:32.327246+00	1	2026-04-29 11:02:04.785991+00	f	\N
\.


--
-- Data for Name: labels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.labels (id, project_id, name, color, version, updated_at, is_deleted, deleted_at) FROM stdin;
1	1	Backend	#cc8d9c	1	2026-04-29 11:02:01.374639+00	f	\N
2	1	Frontend	#9dde49	1	2026-04-29 11:02:01.374639+00	f	\N
3	1	Database	#fee8ab	1	2026-04-29 11:02:01.374639+00	f	\N
4	1	Bug	#8a58fa	1	2026-04-29 11:02:01.374639+00	f	\N
5	1	Refactor	#8b23d5	1	2026-04-29 11:02:01.374639+00	f	\N
6	2	UI/UX	#5bfc9c	1	2026-04-29 11:02:01.374639+00	f	\N
7	2	API	#10b3ce	1	2026-04-29 11:02:01.374639+00	f	\N
8	2	iOS	#f7aba7	1	2026-04-29 11:02:01.374639+00	f	\N
9	2	Android	#3c7b36	1	2026-04-29 11:02:01.374639+00	f	\N
10	2	Critical	#f2a9a1	1	2026-04-29 11:02:01.374639+00	f	\N
11	3	ETL	#2ed457	1	2026-04-29 11:02:01.374639+00	f	\N
12	3	Validation	#68b6ca	1	2026-04-29 11:02:01.374639+00	f	\N
13	3	Script	#e38c0e	1	2026-04-29 11:02:01.374639+00	f	\N
14	3	Schema	#9d115e	1	2026-04-29 11:02:01.374639+00	f	\N
15	4	ML	#9beaa1	1	2026-04-29 11:02:01.374639+00	f	\N
16	4	Python	#dbf2d1	1	2026-04-29 11:02:01.374639+00	f	\N
17	4	Training	#e96c99	1	2026-04-29 11:02:01.374639+00	f	\N
18	4	Integration	#a4ed94	1	2026-04-29 11:02:01.374639+00	f	\N
19	5	Payment	#da35c1	1	2026-04-29 11:02:04.785991+00	f	\N
20	5	Security	#3ec3f4	1	2026-04-29 11:02:04.785991+00	f	\N
21	5	API	#c483e2	1	2026-04-29 11:02:04.785991+00	f	\N
22	5	PCI-DSS	#f95457	1	2026-04-29 11:02:04.785991+00	f	\N
23	5	Backend	#fd14d0	1	2026-04-29 11:02:04.785991+00	f	\N
24	6	Integration	#e17e2d	1	2026-04-29 11:02:04.785991+00	f	\N
25	6	SOAP	#df121e	1	2026-04-29 11:02:04.785991+00	f	\N
26	6	REST	#570673	1	2026-04-29 11:02:04.785991+00	f	\N
27	6	Government	#37028a	1	2026-04-29 11:02:04.785991+00	f	\N
28	6	Compliance	#26f34f	1	2026-04-29 11:02:04.785991+00	f	\N
29	7	Maps	#d49e01	1	2026-04-29 11:02:04.785991+00	f	\N
30	7	WebSocket	#53e50e	1	2026-04-29 11:02:04.785991+00	f	\N
31	7	Realtime	#c27b71	1	2026-04-29 11:02:04.785991+00	f	\N
32	7	Mobile	#ae94ad	1	2026-04-29 11:02:04.785991+00	f	\N
33	7	Tracking	#a29150	1	2026-04-29 11:02:04.785991+00	f	\N
34	8	HL7	#179ddb	1	2026-04-29 11:02:04.785991+00	f	\N
35	8	FHIR	#615478	1	2026-04-29 11:02:04.785991+00	f	\N
36	8	KVKK	#5d711f	1	2026-04-29 11:02:04.785991+00	f	\N
37	8	Healthcare	#49936d	1	2026-04-29 11:02:04.785991+00	f	\N
38	8	Integration	#3e2cf2	1	2026-04-29 11:02:04.785991+00	f	\N
39	9	Video	#b57085	1	2026-04-29 11:02:04.785991+00	f	\N
40	9	Quiz	#e4065b	1	2026-04-29 11:02:04.785991+00	f	\N
41	9	LiveSession	#1d967a	1	2026-04-29 11:02:04.785991+00	f	\N
42	9	Frontend	#1e2877	1	2026-04-29 11:02:04.785991+00	f	\N
43	9	Backend	#6437f1	1	2026-04-29 11:02:04.785991+00	f	\N
44	10	Sales	#29a753	1	2026-04-29 11:02:04.785991+00	f	\N
45	10	Email	#e14178	1	2026-04-29 11:02:04.785991+00	f	\N
46	10	Segmentation	#370ccf	1	2026-04-29 11:02:04.785991+00	f	\N
47	10	Analytics	#365eca	1	2026-04-29 11:02:04.785991+00	f	\N
48	10	Automation	#fea069	1	2026-04-29 11:02:04.785991+00	f	\N
49	11	HIL	#838c68	1	2026-04-29 11:02:04.785991+00	f	\N
50	11	ISO26262	#75146a	1	2026-04-29 11:02:04.785991+00	f	\N
51	11	Testing	#ea73f4	1	2026-04-29 11:02:04.785991+00	f	\N
52	11	Automotive	#37bbaa	1	2026-04-29 11:02:04.785991+00	f	\N
53	11	Embedded	#c298ac	1	2026-04-29 11:02:04.785991+00	f	\N
54	12	Billing	#8e1f7c	1	2026-04-29 11:02:04.785991+00	f	\N
55	12	OSS	#e5a977	1	2026-04-29 11:02:04.785991+00	f	\N
56	12	BSS	#f0a6ce	1	2026-04-29 11:02:04.785991+00	f	\N
57	12	Batch	#53659e	1	2026-04-29 11:02:04.785991+00	f	\N
58	12	Reconciliation	#ff81ca	1	2026-04-29 11:02:04.785991+00	f	\N
59	13	Realtime	#96f79e	1	2026-04-29 11:02:04.785991+00	f	\N
60	13	Matchmaking	#b3bf2f	1	2026-04-29 11:02:04.785991+00	f	\N
61	13	Leaderboard	#95329e	1	2026-04-29 11:02:04.785991+00	f	\N
62	13	Redis	#5a4ccd	1	2026-04-29 11:02:04.785991+00	f	\N
63	13	Scalability	#5cc894	1	2026-04-29 11:02:04.785991+00	f	\N
64	14	MQTT	#7a82d3	1	2026-04-29 11:02:04.785991+00	f	\N
65	14	TimeSeries	#1fe6e0	1	2026-04-29 11:02:04.785991+00	f	\N
66	14	Anomaly	#678ab0	1	2026-04-29 11:02:04.785991+00	f	\N
67	14	Dashboard	#d948b1	1	2026-04-29 11:02:04.785991+00	f	\N
68	14	ML	#8985cb	1	2026-04-29 11:02:04.785991+00	f	\N
69	15	Blockchain	#2c6091	1	2026-04-29 11:02:04.785991+00	f	\N
70	15	SmartContract	#39a724	1	2026-04-29 11:02:04.785991+00	f	\N
71	15	Solidity	#632e59	1	2026-04-29 11:02:04.785991+00	f	\N
72	15	Provenance	#44b762	1	2026-04-29 11:02:04.785991+00	f	\N
73	15	Audit	#04f911	1	2026-04-29 11:02:04.785991+00	f	\N
74	16	SAP	#5570e0	1	2026-04-29 11:02:04.785991+00	f	\N
75	16	Oracle	#3b3676	1	2026-04-29 11:02:04.785991+00	f	\N
76	16	ETL	#7e0855	1	2026-04-29 11:02:04.785991+00	f	\N
77	16	MasterData	#ba8f81	1	2026-04-29 11:02:04.785991+00	f	\N
78	16	Workflow	#ee8151	1	2026-04-29 11:02:04.785991+00	f	\N
79	17	NLP	#542f83	1	2026-04-29 11:02:04.785991+00	f	\N
80	17	DialogFlow	#dc784c	1	2026-04-29 11:02:04.785991+00	f	\N
81	17	WhatsApp	#a73f7f	1	2026-04-29 11:02:04.785991+00	f	\N
82	17	AI	#3ff26f	1	2026-04-29 11:02:04.785991+00	f	\N
83	17	Chatbot	#b97c77	1	2026-04-29 11:02:04.785991+00	f	\N
84	18	Policy	#a91ae0	1	2026-04-29 11:02:04.785991+00	f	\N
85	18	Claims	#d07b86	1	2026-04-29 11:02:04.785991+00	f	\N
86	18	Actuarial	#d93d12	1	2026-04-29 11:02:04.785991+00	f	\N
87	18	Compliance	#a3d3fa	1	2026-04-29 11:02:04.785991+00	f	\N
88	18	Core	#71f832	1	2026-04-29 11:02:04.785991+00	f	\N
89	19	Prototype	#43ca7b	1	2026-04-29 11:02:04.785991+00	f	\N
90	19	MVP	#8b8f8b	1	2026-04-29 11:02:04.785991+00	f	\N
91	19	UserFeedback	#1efe1a	1	2026-04-29 11:02:04.785991+00	f	\N
92	19	Rapid	#68f639	1	2026-04-29 11:02:04.785991+00	f	\N
93	19	Iteration	#69318e	1	2026-04-29 11:02:04.785991+00	f	\N
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.milestones (id, project_id, name, description, target_date, status, linked_phase_ids, version, created_at, updated_at, is_deleted, deleted_at, start_date) FROM stdin;
1	1	Faz 1 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
2	1	MVP Yayını	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
3	1	Final Teslimat	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
4	2	Faz 1 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
5	2	MVP Yayını	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
6	2	Final Teslimat	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
7	3	Faz 1 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
8	3	MVP Yayını	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
9	3	Final Teslimat	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
10	4	Faz 1 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
11	4	MVP Yayını	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
12	4	Final Teslimat	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:01.374639+00	2026-04-29 11:02:01.374639+00	f	\N	\N
13	5	Faz 1 — Altyapı Hazır	\N	2026-03-14 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
14	5	Faz 2 — MVP Teslimatı	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
15	5	Faz 3 — Üretim Lansmanı	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
16	6	Sprint 1-3 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
17	6	Beta Sürüm	\N	2026-05-18 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
18	6	Genel Erişim (GA)	\N	2026-07-12 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
19	7	Gereksinim Onayı	\N	2026-02-27 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
20	7	Tasarım Tamamlandı	\N	2026-04-08 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
21	7	Entegrasyon Testi Başlangıcı	\N	2026-05-13 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
22	7	Kabul Testi & Teslimat	\N	2026-06-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
23	8	Faz 1 — Altyapı Hazır	\N	2026-03-14 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
24	8	Faz 2 — MVP Teslimatı	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
25	8	Faz 3 — Üretim Lansmanı	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
26	9	Sprint 1-3 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
27	9	Beta Sürüm	\N	2026-05-18 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
28	9	Genel Erişim (GA)	\N	2026-07-12 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
29	10	Gereksinim Onayı	\N	2026-02-27 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
30	10	Tasarım Tamamlandı	\N	2026-04-08 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
31	10	Entegrasyon Testi Başlangıcı	\N	2026-05-13 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
32	10	Kabul Testi & Teslimat	\N	2026-06-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
33	11	Faz 1 — Altyapı Hazır	\N	2026-03-14 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
34	11	Faz 2 — MVP Teslimatı	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
35	11	Faz 3 — Üretim Lansmanı	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
36	12	Sprint 1-3 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
37	12	Beta Sürüm	\N	2026-05-18 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
38	12	Genel Erişim (GA)	\N	2026-07-12 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
39	13	Gereksinim Onayı	\N	2026-02-27 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
40	13	Tasarım Tamamlandı	\N	2026-04-08 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
41	13	Entegrasyon Testi Başlangıcı	\N	2026-05-13 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
42	13	Kabul Testi & Teslimat	\N	2026-06-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
43	14	Faz 1 — Altyapı Hazır	\N	2026-03-14 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
44	14	Faz 2 — MVP Teslimatı	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
45	14	Faz 3 — Üretim Lansmanı	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
46	15	Sprint 1-3 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
47	15	Beta Sürüm	\N	2026-05-18 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
48	15	Genel Erişim (GA)	\N	2026-07-12 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
49	16	Gereksinim Onayı	\N	2026-02-27 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
50	16	Tasarım Tamamlandı	\N	2026-04-08 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
51	16	Entegrasyon Testi Başlangıcı	\N	2026-05-13 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
52	16	Kabul Testi & Teslimat	\N	2026-06-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
53	17	Faz 1 — Altyapı Hazır	\N	2026-03-14 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
54	17	Faz 2 — MVP Teslimatı	\N	2026-05-28 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
55	17	Faz 3 — Üretim Lansmanı	\N	2026-07-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
56	18	Sprint 1-3 Tamamlandı	\N	2026-03-29 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
57	18	Beta Sürüm	\N	2026-05-18 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
58	18	Genel Erişim (GA)	\N	2026-07-12 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
59	19	Gereksinim Onayı	\N	2026-02-27 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
60	19	Tasarım Tamamlandı	\N	2026-04-08 21:00:00+00	completed	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
61	19	Entegrasyon Testi Başlangıcı	\N	2026-05-13 21:00:00+00	in_progress	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
62	19	Kabul Testi & Teslimat	\N	2026-06-27 21:00:00+00	pending	[]	1	2026-04-29 11:02:04.785991+00	2026-04-29 11:02:04.785991+00	f	\N	\N
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, preferences, email_enabled, deadline_days, version, updated_at, is_deleted, deleted_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, type, is_read, related_entity_id, related_entity_type, created_at) FROM stdin;
1	2	Yeni görev atandı: Analiz: Kullanıcı Oturum Yönetimi - Parça 1	TASK_ASSIGNED	f	2	\N	2026-04-29 11:02:01.374639+00
2	2	Yeni görev atandı: Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	TASK_ASSIGNED	f	3	\N	2026-04-29 11:02:01.374639+00
3	7	Yeni görev atandı: Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	TASK_ASSIGNED	f	4	\N	2026-04-29 11:02:01.374639+00
4	7	Yeni görev atandı: Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	TASK_ASSIGNED	f	5	\N	2026-04-29 11:02:01.374639+00
5	5	Yeni görev atandı: Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	TASK_ASSIGNED	f	6	\N	2026-04-29 11:02:01.374639+00
6	3	Yeni görev atandı: Code Review: Kullanıcı Oturum Yönetimi - Parça 6	TASK_ASSIGNED	f	7	\N	2026-04-29 11:02:01.374639+00
7	7	Yeni görev atandı: Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	TASK_ASSIGNED	f	9	\N	2026-04-29 11:02:01.374639+00
8	2	Yeni görev atandı: Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	TASK_ASSIGNED	f	10	\N	2026-04-29 11:02:01.374639+00
9	7	Yeni görev atandı: Analiz: Raporlama Dashboard'u - Parça 1	TASK_ASSIGNED	f	12	\N	2026-04-29 11:02:01.374639+00
10	7	Yeni görev atandı: Tasarım: Raporlama Dashboard'u - Parça 2	TASK_ASSIGNED	f	13	\N	2026-04-29 11:02:01.374639+00
11	2	Yeni görev atandı: Geliştirme: Raporlama Dashboard'u - Parça 3	TASK_ASSIGNED	f	14	\N	2026-04-29 11:02:01.374639+00
12	2	Yeni görev atandı: Unit Test: Raporlama Dashboard'u - Parça 4	TASK_ASSIGNED	f	15	\N	2026-04-29 11:02:01.374639+00
13	7	Yeni görev atandı: Entegrasyon: Raporlama Dashboard'u - Parça 5	TASK_ASSIGNED	f	16	\N	2026-04-29 11:02:01.374639+00
14	3	Yeni görev atandı: Analiz: Bildirim Altyapısı - Parça 1	TASK_ASSIGNED	f	18	\N	2026-04-29 11:02:01.374639+00
15	2	Yeni görev atandı: Tasarım: Bildirim Altyapısı - Parça 2	TASK_ASSIGNED	f	19	\N	2026-04-29 11:02:01.374639+00
16	7	Yeni görev atandı: Geliştirme: Bildirim Altyapısı - Parça 3	TASK_ASSIGNED	f	20	\N	2026-04-29 11:02:01.374639+00
17	3	Yeni görev atandı: Unit Test: Bildirim Altyapısı - Parça 4	TASK_ASSIGNED	f	21	\N	2026-04-29 11:02:01.374639+00
18	2	Yeni görev atandı: Entegrasyon: Bildirim Altyapısı - Parça 5	TASK_ASSIGNED	f	22	\N	2026-04-29 11:02:01.374639+00
19	2	Yeni görev atandı: Code Review: Bildirim Altyapısı - Parça 6	TASK_ASSIGNED	f	23	\N	2026-04-29 11:02:01.374639+00
20	3	Yeni görev atandı: Analiz: Profil Sayfaları - Parça 1	TASK_ASSIGNED	f	25	\N	2026-04-29 11:02:01.374639+00
21	7	Yeni görev atandı: Tasarım: Profil Sayfaları - Parça 2	TASK_ASSIGNED	f	26	\N	2026-04-29 11:02:01.374639+00
22	3	Yeni görev atandı: Geliştirme: Profil Sayfaları - Parça 3	TASK_ASSIGNED	f	27	\N	2026-04-29 11:02:01.374639+00
23	3	Yeni görev atandı: Unit Test: Profil Sayfaları - Parça 4	TASK_ASSIGNED	f	28	\N	2026-04-29 11:02:01.374639+00
24	5	Yeni görev atandı: Entegrasyon: Profil Sayfaları - Parça 5	TASK_ASSIGNED	f	29	\N	2026-04-29 11:02:01.374639+00
25	5	Yeni görev atandı: Code Review: Profil Sayfaları - Parça 6	TASK_ASSIGNED	f	30	\N	2026-04-29 11:02:01.374639+00
26	7	Yeni görev atandı: Analiz: Arama ve Filtreleme - Parça 1	TASK_ASSIGNED	f	32	\N	2026-04-29 11:02:01.374639+00
27	5	Yeni görev atandı: Tasarım: Arama ve Filtreleme - Parça 2	TASK_ASSIGNED	f	33	\N	2026-04-29 11:02:01.374639+00
28	2	Yeni görev atandı: Geliştirme: Arama ve Filtreleme - Parça 3	TASK_ASSIGNED	f	34	\N	2026-04-29 11:02:01.374639+00
29	2	Yeni görev atandı: Unit Test: Arama ve Filtreleme - Parça 4	TASK_ASSIGNED	f	35	\N	2026-04-29 11:02:01.374639+00
30	5	Yeni görev atandı: Entegrasyon: Arama ve Filtreleme - Parça 5	TASK_ASSIGNED	f	36	\N	2026-04-29 11:02:01.374639+00
31	3	Yeni görev atandı: Code Review: Arama ve Filtreleme - Parça 6	TASK_ASSIGNED	f	37	\N	2026-04-29 11:02:01.374639+00
32	4	Yeni görev atandı: Analiz: Kullanıcı Oturum Yönetimi - Parça 1	TASK_ASSIGNED	f	39	\N	2026-04-29 11:02:01.374639+00
33	4	Yeni görev atandı: Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	TASK_ASSIGNED	f	40	\N	2026-04-29 11:02:01.374639+00
34	3	Yeni görev atandı: Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	TASK_ASSIGNED	f	41	\N	2026-04-29 11:02:01.374639+00
35	3	Yeni görev atandı: Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	TASK_ASSIGNED	f	42	\N	2026-04-29 11:02:01.374639+00
36	7	Yeni görev atandı: Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	TASK_ASSIGNED	f	43	\N	2026-04-29 11:02:01.374639+00
37	5	Yeni görev atandı: Code Review: Kullanıcı Oturum Yönetimi - Parça 6	TASK_ASSIGNED	f	44	\N	2026-04-29 11:02:01.374639+00
38	4	Yeni görev atandı: Bug Fix: Kullanıcı Oturum Yönetimi - Parça 7	TASK_ASSIGNED	f	45	\N	2026-04-29 11:02:01.374639+00
39	5	Yeni görev atandı: Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	TASK_ASSIGNED	f	47	\N	2026-04-29 11:02:01.374639+00
40	4	Yeni görev atandı: Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	TASK_ASSIGNED	f	48	\N	2026-04-29 11:02:01.374639+00
41	8	Yeni görev atandı: Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	TASK_ASSIGNED	f	49	\N	2026-04-29 11:02:01.374639+00
42	4	Yeni görev atandı: Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	TASK_ASSIGNED	f	50	\N	2026-04-29 11:02:01.374639+00
43	8	Yeni görev atandı: Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	TASK_ASSIGNED	f	51	\N	2026-04-29 11:02:01.374639+00
44	4	Yeni görev atandı: Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	TASK_ASSIGNED	f	52	\N	2026-04-29 11:02:01.374639+00
45	8	Yeni görev atandı: Bug Fix: Ödeme Sistemi Entegrasyonu - Parça 7	TASK_ASSIGNED	f	53	\N	2026-04-29 11:02:01.374639+00
46	4	Yeni görev atandı: Analiz: Raporlama Dashboard'u - Parça 1	TASK_ASSIGNED	f	55	\N	2026-04-29 11:02:01.374639+00
47	3	Yeni görev atandı: Tasarım: Raporlama Dashboard'u - Parça 2	TASK_ASSIGNED	f	56	\N	2026-04-29 11:02:01.374639+00
48	7	Yeni görev atandı: Geliştirme: Raporlama Dashboard'u - Parça 3	TASK_ASSIGNED	f	57	\N	2026-04-29 11:02:01.374639+00
49	8	Yeni görev atandı: Analiz: Bildirim Altyapısı - Parça 1	TASK_ASSIGNED	f	59	\N	2026-04-29 11:02:01.374639+00
50	7	Yeni görev atandı: Tasarım: Bildirim Altyapısı - Parça 2	TASK_ASSIGNED	f	60	\N	2026-04-29 11:02:01.374639+00
51	8	Yeni görev atandı: Geliştirme: Bildirim Altyapısı - Parça 3	TASK_ASSIGNED	f	61	\N	2026-04-29 11:02:01.374639+00
52	5	Yeni görev atandı: Unit Test: Bildirim Altyapısı - Parça 4	TASK_ASSIGNED	f	62	\N	2026-04-29 11:02:01.374639+00
53	8	Yeni görev atandı: Entegrasyon: Bildirim Altyapısı - Parça 5	TASK_ASSIGNED	f	63	\N	2026-04-29 11:02:01.374639+00
54	7	Yeni görev atandı: Code Review: Bildirim Altyapısı - Parça 6	TASK_ASSIGNED	f	64	\N	2026-04-29 11:02:01.374639+00
55	8	Yeni görev atandı: Bug Fix: Bildirim Altyapısı - Parça 7	TASK_ASSIGNED	f	65	\N	2026-04-29 11:02:01.374639+00
56	3	Yeni görev atandı: Analiz: Profil Sayfaları - Parça 1	TASK_ASSIGNED	f	67	\N	2026-04-29 11:02:01.374639+00
57	4	Yeni görev atandı: Tasarım: Profil Sayfaları - Parça 2	TASK_ASSIGNED	f	68	\N	2026-04-29 11:02:01.374639+00
58	3	Yeni görev atandı: Geliştirme: Profil Sayfaları - Parça 3	TASK_ASSIGNED	f	69	\N	2026-04-29 11:02:01.374639+00
59	4	Yeni görev atandı: Unit Test: Profil Sayfaları - Parça 4	TASK_ASSIGNED	f	70	\N	2026-04-29 11:02:01.374639+00
60	3	Yeni görev atandı: Entegrasyon: Profil Sayfaları - Parça 5	TASK_ASSIGNED	f	71	\N	2026-04-29 11:02:01.374639+00
61	4	Yeni görev atandı: Code Review: Profil Sayfaları - Parça 6	TASK_ASSIGNED	f	72	\N	2026-04-29 11:02:01.374639+00
62	7	Yeni görev atandı: Analiz: Arama ve Filtreleme - Parça 1	TASK_ASSIGNED	f	74	\N	2026-04-29 11:02:01.374639+00
63	7	Yeni görev atandı: Tasarım: Arama ve Filtreleme - Parça 2	TASK_ASSIGNED	f	75	\N	2026-04-29 11:02:01.374639+00
64	7	Yeni görev atandı: Geliştirme: Arama ve Filtreleme - Parça 3	TASK_ASSIGNED	f	76	\N	2026-04-29 11:02:01.374639+00
65	3	Yeni görev atandı: Analiz: Performans Optimizasyonu - Parça 1	TASK_ASSIGNED	f	78	\N	2026-04-29 11:02:01.374639+00
66	7	Yeni görev atandı: Tasarım: Performans Optimizasyonu - Parça 2	TASK_ASSIGNED	f	79	\N	2026-04-29 11:02:01.374639+00
67	4	Yeni görev atandı: Analiz: Kullanıcı Oturum Yönetimi - Parça 1	TASK_ASSIGNED	f	81	\N	2026-04-29 11:02:01.374639+00
68	8	Yeni görev atandı: Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	TASK_ASSIGNED	f	82	\N	2026-04-29 11:02:01.374639+00
69	7	Yeni görev atandı: Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	TASK_ASSIGNED	f	83	\N	2026-04-29 11:02:01.374639+00
70	4	Yeni görev atandı: Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	TASK_ASSIGNED	f	84	\N	2026-04-29 11:02:01.374639+00
71	8	Yeni görev atandı: Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	TASK_ASSIGNED	f	85	\N	2026-04-29 11:02:01.374639+00
72	4	Yeni görev atandı: Code Review: Kullanıcı Oturum Yönetimi - Parça 6	TASK_ASSIGNED	f	86	\N	2026-04-29 11:02:01.374639+00
73	4	Yeni görev atandı: Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	TASK_ASSIGNED	f	88	\N	2026-04-29 11:02:01.374639+00
74	1	Yeni görev atandı: Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	TASK_ASSIGNED	f	89	\N	2026-04-29 11:02:01.374639+00
75	1	Yeni görev atandı: Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	TASK_ASSIGNED	f	90	\N	2026-04-29 11:02:01.374639+00
76	3	Yeni görev atandı: Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	TASK_ASSIGNED	f	91	\N	2026-04-29 11:02:01.374639+00
77	8	Yeni görev atandı: Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	TASK_ASSIGNED	f	92	\N	2026-04-29 11:02:01.374639+00
78	8	Yeni görev atandı: Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	TASK_ASSIGNED	f	93	\N	2026-04-29 11:02:01.374639+00
79	2	Yeni görev atandı: Analiz: Raporlama Dashboard'u - Parça 1	TASK_ASSIGNED	f	95	\N	2026-04-29 11:02:01.374639+00
80	7	Yeni görev atandı: Tasarım: Raporlama Dashboard'u - Parça 2	TASK_ASSIGNED	f	96	\N	2026-04-29 11:02:01.374639+00
81	4	Yeni görev atandı: Geliştirme: Raporlama Dashboard'u - Parça 3	TASK_ASSIGNED	f	97	\N	2026-04-29 11:02:01.374639+00
82	8	Yeni görev atandı: Unit Test: Raporlama Dashboard'u - Parça 4	TASK_ASSIGNED	f	98	\N	2026-04-29 11:02:01.374639+00
83	2	Yeni görev atandı: Analiz: Bildirim Altyapısı - Parça 1	TASK_ASSIGNED	f	100	\N	2026-04-29 11:02:01.374639+00
84	1	Yeni görev atandı: Tasarım: Bildirim Altyapısı - Parça 2	TASK_ASSIGNED	f	101	\N	2026-04-29 11:02:01.374639+00
85	2	Yeni görev atandı: Geliştirme: Bildirim Altyapısı - Parça 3	TASK_ASSIGNED	f	102	\N	2026-04-29 11:02:01.374639+00
86	1	Yeni görev atandı: Unit Test: Bildirim Altyapısı - Parça 4	TASK_ASSIGNED	f	103	\N	2026-04-29 11:02:01.374639+00
87	3	Yeni görev atandı: Entegrasyon: Bildirim Altyapısı - Parça 5	TASK_ASSIGNED	f	104	\N	2026-04-29 11:02:01.374639+00
88	3	Yeni görev atandı: Code Review: Bildirim Altyapısı - Parça 6	TASK_ASSIGNED	f	105	\N	2026-04-29 11:02:01.374639+00
89	4	Yeni görev atandı: Bug Fix: Bildirim Altyapısı - Parça 7	TASK_ASSIGNED	f	106	\N	2026-04-29 11:02:01.374639+00
90	1	Yeni görev atandı: Analiz: Profil Sayfaları - Parça 1	TASK_ASSIGNED	f	108	\N	2026-04-29 11:02:01.374639+00
91	2	Yeni görev atandı: Tasarım: Profil Sayfaları - Parça 2	TASK_ASSIGNED	f	109	\N	2026-04-29 11:02:01.374639+00
92	3	Yeni görev atandı: Geliştirme: Profil Sayfaları - Parça 3	TASK_ASSIGNED	f	110	\N	2026-04-29 11:02:01.374639+00
93	3	Yeni görev atandı: Unit Test: Profil Sayfaları - Parça 4	TASK_ASSIGNED	f	111	\N	2026-04-29 11:02:01.374639+00
94	4	Yeni görev atandı: Entegrasyon: Profil Sayfaları - Parça 5	TASK_ASSIGNED	f	112	\N	2026-04-29 11:02:01.374639+00
95	1	Yeni görev atandı: Code Review: Profil Sayfaları - Parça 6	TASK_ASSIGNED	f	113	\N	2026-04-29 11:02:01.374639+00
96	1	Yeni görev atandı: Bug Fix: Profil Sayfaları - Parça 7	TASK_ASSIGNED	f	114	\N	2026-04-29 11:02:01.374639+00
97	2	Yeni görev atandı: Analiz: Arama ve Filtreleme - Parça 1	TASK_ASSIGNED	f	116	\N	2026-04-29 11:02:01.374639+00
98	7	Yeni görev atandı: Tasarım: Arama ve Filtreleme - Parça 2	TASK_ASSIGNED	f	117	\N	2026-04-29 11:02:01.374639+00
99	4	Yeni görev atandı: Geliştirme: Arama ve Filtreleme - Parça 3	TASK_ASSIGNED	f	118	\N	2026-04-29 11:02:01.374639+00
100	3	Yeni görev atandı: Unit Test: Arama ve Filtreleme - Parça 4	TASK_ASSIGNED	f	119	\N	2026-04-29 11:02:01.374639+00
101	1	Yeni görev atandı: Analiz: Kullanıcı Oturum Yönetimi - Parça 1	TASK_ASSIGNED	f	121	\N	2026-04-29 11:02:01.374639+00
102	7	Yeni görev atandı: Tasarım: Kullanıcı Oturum Yönetimi - Parça 2	TASK_ASSIGNED	f	122	\N	2026-04-29 11:02:01.374639+00
103	1	Yeni görev atandı: Geliştirme: Kullanıcı Oturum Yönetimi - Parça 3	TASK_ASSIGNED	f	123	\N	2026-04-29 11:02:01.374639+00
104	7	Yeni görev atandı: Unit Test: Kullanıcı Oturum Yönetimi - Parça 4	TASK_ASSIGNED	f	124	\N	2026-04-29 11:02:01.374639+00
105	6	Yeni görev atandı: Entegrasyon: Kullanıcı Oturum Yönetimi - Parça 5	TASK_ASSIGNED	f	125	\N	2026-04-29 11:02:01.374639+00
106	1	Yeni görev atandı: Code Review: Kullanıcı Oturum Yönetimi - Parça 6	TASK_ASSIGNED	f	126	\N	2026-04-29 11:02:01.374639+00
107	5	Yeni görev atandı: Bug Fix: Kullanıcı Oturum Yönetimi - Parça 7	TASK_ASSIGNED	f	127	\N	2026-04-29 11:02:01.374639+00
108	5	Yeni görev atandı: Analiz: Ödeme Sistemi Entegrasyonu - Parça 1	TASK_ASSIGNED	f	129	\N	2026-04-29 11:02:01.374639+00
109	7	Yeni görev atandı: Tasarım: Ödeme Sistemi Entegrasyonu - Parça 2	TASK_ASSIGNED	f	130	\N	2026-04-29 11:02:01.374639+00
110	1	Yeni görev atandı: Geliştirme: Ödeme Sistemi Entegrasyonu - Parça 3	TASK_ASSIGNED	f	131	\N	2026-04-29 11:02:01.374639+00
111	6	Yeni görev atandı: Unit Test: Ödeme Sistemi Entegrasyonu - Parça 4	TASK_ASSIGNED	f	132	\N	2026-04-29 11:02:01.374639+00
112	1	Yeni görev atandı: Entegrasyon: Ödeme Sistemi Entegrasyonu - Parça 5	TASK_ASSIGNED	f	133	\N	2026-04-29 11:02:01.374639+00
113	6	Yeni görev atandı: Code Review: Ödeme Sistemi Entegrasyonu - Parça 6	TASK_ASSIGNED	f	134	\N	2026-04-29 11:02:01.374639+00
114	3	Yeni görev atandı: Analiz: Raporlama Dashboard'u - Parça 1	TASK_ASSIGNED	f	136	\N	2026-04-29 11:02:01.374639+00
115	5	Yeni görev atandı: Tasarım: Raporlama Dashboard'u - Parça 2	TASK_ASSIGNED	f	137	\N	2026-04-29 11:02:01.374639+00
116	6	Yeni görev atandı: Geliştirme: Raporlama Dashboard'u - Parça 3	TASK_ASSIGNED	f	138	\N	2026-04-29 11:02:01.374639+00
117	1	Yeni görev atandı: Unit Test: Raporlama Dashboard'u - Parça 4	TASK_ASSIGNED	f	139	\N	2026-04-29 11:02:01.374639+00
118	7	Yeni görev atandı: Entegrasyon: Raporlama Dashboard'u - Parça 5	TASK_ASSIGNED	f	140	\N	2026-04-29 11:02:01.374639+00
119	5	Yeni görev atandı: Analiz: Bildirim Altyapısı - Parça 1	TASK_ASSIGNED	f	142	\N	2026-04-29 11:02:01.374639+00
120	7	Yeni görev atandı: Tasarım: Bildirim Altyapısı - Parça 2	TASK_ASSIGNED	f	143	\N	2026-04-29 11:02:01.374639+00
121	3	Yeni görev atandı: Geliştirme: Bildirim Altyapısı - Parça 3	TASK_ASSIGNED	f	144	\N	2026-04-29 11:02:01.374639+00
122	7	Yeni görev atandı: Unit Test: Bildirim Altyapısı - Parça 4	TASK_ASSIGNED	f	145	\N	2026-04-29 11:02:01.374639+00
123	6	Yeni görev atandı: Entegrasyon: Bildirim Altyapısı - Parça 5	TASK_ASSIGNED	f	146	\N	2026-04-29 11:02:01.374639+00
124	1	Yeni görev atandı: Analiz: Profil Sayfaları - Parça 1	TASK_ASSIGNED	f	148	\N	2026-04-29 11:02:01.374639+00
125	6	Yeni görev atandı: Tasarım: Profil Sayfaları - Parça 2	TASK_ASSIGNED	f	149	\N	2026-04-29 11:02:01.374639+00
126	5	Yeni görev atandı: Geliştirme: Profil Sayfaları - Parça 3	TASK_ASSIGNED	f	150	\N	2026-04-29 11:02:01.374639+00
127	7	Yeni görev atandı: Unit Test: Profil Sayfaları - Parça 4	TASK_ASSIGNED	f	151	\N	2026-04-29 11:02:01.374639+00
128	3	Yeni görev atandı: Analiz: Arama ve Filtreleme - Parça 1	TASK_ASSIGNED	f	153	\N	2026-04-29 11:02:01.374639+00
129	3	Yeni görev atandı: Tasarım: Arama ve Filtreleme - Parça 2	TASK_ASSIGNED	f	154	\N	2026-04-29 11:02:01.374639+00
130	3	Yeni görev atandı: Geliştirme: Arama ve Filtreleme - Parça 3	TASK_ASSIGNED	f	155	\N	2026-04-29 11:02:01.374639+00
131	3	Yeni görev atandı: Analiz: Performans Optimizasyonu - Parça 1	TASK_ASSIGNED	f	157	\N	2026-04-29 11:02:01.374639+00
132	5	Yeni görev atandı: Tasarım: Performans Optimizasyonu - Parça 2	TASK_ASSIGNED	f	158	\N	2026-04-29 11:02:01.374639+00
133	7	Yeni görev atandı: Geliştirme: Performans Optimizasyonu - Parça 3	TASK_ASSIGNED	f	159	\N	2026-04-29 11:02:01.374639+00
134	1	Yeni görev atandı: Unit Test: Performans Optimizasyonu - Parça 4	TASK_ASSIGNED	f	160	\N	2026-04-29 11:02:01.374639+00
135	1	Yeni görev atandı: Entegrasyon: Performans Optimizasyonu - Parça 5	TASK_ASSIGNED	f	161	\N	2026-04-29 11:02:01.374639+00
136	23	Yeni görev atandı: Entegrasyon: 3D Secure Entegrasyonu — Adım 1	TASK_ASSIGNED	f	163	\N	2026-04-29 11:02:04.785991+00
137	97	Yeni görev atandı: Bug Fix: 3D Secure Entegrasyonu — Adım 2	TASK_ASSIGNED	t	164	\N	2026-04-29 11:02:04.785991+00
138	4	Yeni görev atandı: Tasarım: 3D Secure Entegrasyonu — Adım 3	TASK_ASSIGNED	t	165	\N	2026-04-29 11:02:04.785991+00
139	9	Yeni görev atandı: Unit Test: 3D Secure Entegrasyonu — Adım 4	TASK_ASSIGNED	t	166	\N	2026-04-29 11:02:04.785991+00
140	23	Yeni görev atandı: Code Review: 3D Secure Entegrasyonu — Adım 5	TASK_ASSIGNED	f	167	\N	2026-04-29 11:02:04.785991+00
141	4	Yeni görev atandı: Entegrasyon: Ödeme Uzlaştırma Modülü — Adım 1	TASK_ASSIGNED	t	169	\N	2026-04-29 11:02:04.785991+00
142	23	Yeni görev atandı: Geliştirme: Ödeme Uzlaştırma Modülü — Adım 2	TASK_ASSIGNED	t	170	\N	2026-04-29 11:02:04.785991+00
143	22	Yeni görev atandı: QA & Test: Ödeme Uzlaştırma Modülü — Adım 3	TASK_ASSIGNED	t	171	\N	2026-04-29 11:02:04.785991+00
144	9	Yeni görev atandı: Dağıtım: Ödeme Uzlaştırma Modülü — Adım 4	TASK_ASSIGNED	t	172	\N	2026-04-29 11:02:04.785991+00
145	42	Yeni görev atandı: Dokümantasyon: Ödeme Uzlaştırma Modülü — Adım 5	TASK_ASSIGNED	f	173	\N	2026-04-29 11:02:04.785991+00
146	4	Yeni görev atandı: Analiz: Ödeme Uzlaştırma Modülü — Adım 6	TASK_ASSIGNED	f	174	\N	2026-04-29 11:02:04.785991+00
147	21	Yeni görev atandı: Dokümantasyon: Fraud Tespit Motoru — Adım 1	TASK_ASSIGNED	t	176	\N	2026-04-29 11:02:04.785991+00
148	4	Yeni görev atandı: Tasarım: Fraud Tespit Motoru — Adım 2	TASK_ASSIGNED	t	177	\N	2026-04-29 11:02:04.785991+00
149	50	Yeni görev atandı: Dağıtım: Fraud Tespit Motoru — Adım 3	TASK_ASSIGNED	f	178	\N	2026-04-29 11:02:04.785991+00
150	9	Yeni görev atandı: Bug Fix: Fraud Tespit Motoru — Adım 4	TASK_ASSIGNED	f	179	\N	2026-04-29 11:02:04.785991+00
151	9	Yeni görev atandı: Entegrasyon: Fraud Tespit Motoru — Adım 5	TASK_ASSIGNED	t	180	\N	2026-04-29 11:02:04.785991+00
152	4	Yeni görev atandı: Code Review: Fraud Tespit Motoru — Adım 6	TASK_ASSIGNED	f	181	\N	2026-04-29 11:02:04.785991+00
153	97	Yeni görev atandı: QA & Test: Kart Tokenizasyon Servisi — Adım 1	TASK_ASSIGNED	f	183	\N	2026-04-29 11:02:04.785991+00
154	23	Yeni görev atandı: Bug Fix: Kart Tokenizasyon Servisi — Adım 2	TASK_ASSIGNED	f	184	\N	2026-04-29 11:02:04.785991+00
155	97	Yeni görev atandı: Unit Test: Kart Tokenizasyon Servisi — Adım 3	TASK_ASSIGNED	f	185	\N	2026-04-29 11:02:04.785991+00
156	23	Yeni görev atandı: Geliştirme: Kart Tokenizasyon Servisi — Adım 4	TASK_ASSIGNED	t	186	\N	2026-04-29 11:02:04.785991+00
157	23	Yeni görev atandı: QA & Test: Ödeme Bildirimleri — Adım 1	TASK_ASSIGNED	t	188	\N	2026-04-29 11:02:04.785991+00
158	23	Yeni görev atandı: Unit Test: Ödeme Bildirimleri — Adım 2	TASK_ASSIGNED	f	189	\N	2026-04-29 11:02:04.785991+00
159	22	Yeni görev atandı: Geliştirme: Ödeme Bildirimleri — Adım 3	TASK_ASSIGNED	f	190	\N	2026-04-29 11:02:04.785991+00
160	97	Yeni görev atandı: Entegrasyon: Ödeme Bildirimleri — Adım 4	TASK_ASSIGNED	f	191	\N	2026-04-29 11:02:04.785991+00
161	42	Yeni görev atandı: Dokümantasyon: Ödeme Bildirimleri — Adım 5	TASK_ASSIGNED	f	192	\N	2026-04-29 11:02:04.785991+00
162	23	Yeni görev atandı: Dağıtım: Ödeme Bildirimleri — Adım 6	TASK_ASSIGNED	t	193	\N	2026-04-29 11:02:04.785991+00
163	23	Yeni görev atandı: Analiz: Muhasebe Entegrasyonu — Adım 1	TASK_ASSIGNED	t	195	\N	2026-04-29 11:02:04.785991+00
164	23	Yeni görev atandı: QA & Test: Muhasebe Entegrasyonu — Adım 2	TASK_ASSIGNED	f	196	\N	2026-04-29 11:02:04.785991+00
165	21	Yeni görev atandı: Geliştirme: Muhasebe Entegrasyonu — Adım 3	TASK_ASSIGNED	f	197	\N	2026-04-29 11:02:04.785991+00
166	22	Yeni görev atandı: Unit Test: Muhasebe Entegrasyonu — Adım 4	TASK_ASSIGNED	t	198	\N	2026-04-29 11:02:04.785991+00
167	9	Yeni görev atandı: Dokümantasyon: Muhasebe Entegrasyonu — Adım 5	TASK_ASSIGNED	f	199	\N	2026-04-29 11:02:04.785991+00
168	87	Yeni görev atandı: Bug Fix: Kimlik Doğrulama Entegrasyonu — Adım 1	TASK_ASSIGNED	t	201	\N	2026-04-29 11:02:04.785991+00
169	46	Yeni görev atandı: Dağıtım: Kimlik Doğrulama Entegrasyonu — Adım 2	TASK_ASSIGNED	t	202	\N	2026-04-29 11:02:04.785991+00
170	46	Yeni görev atandı: Tasarım: Kimlik Doğrulama Entegrasyonu — Adım 3	TASK_ASSIGNED	t	203	\N	2026-04-29 11:02:04.785991+00
171	43	Yeni görev atandı: Analiz: Kimlik Doğrulama Entegrasyonu — Adım 4	TASK_ASSIGNED	t	204	\N	2026-04-29 11:02:04.785991+00
172	73	Yeni görev atandı: Code Review: Kimlik Doğrulama Entegrasyonu — Adım 5	TASK_ASSIGNED	t	205	\N	2026-04-29 11:02:04.785991+00
173	45	Yeni görev atandı: Geliştirme: Kurum Veri Alışverişi API — Adım 1	TASK_ASSIGNED	f	207	\N	2026-04-29 11:02:04.785991+00
174	51	Yeni görev atandı: Dokümantasyon: Kurum Veri Alışverişi API — Adım 2	TASK_ASSIGNED	t	208	\N	2026-04-29 11:02:04.785991+00
175	73	Yeni görev atandı: Code Review: Kurum Veri Alışverişi API — Adım 3	TASK_ASSIGNED	f	209	\N	2026-04-29 11:02:04.785991+00
176	73	Yeni görev atandı: Tasarım: Kurum Veri Alışverişi API — Adım 4	TASK_ASSIGNED	f	210	\N	2026-04-29 11:02:04.785991+00
177	23	Yeni görev atandı: Bug Fix: Kurum Veri Alışverişi API — Adım 5	TASK_ASSIGNED	t	211	\N	2026-04-29 11:02:04.785991+00
178	23	Yeni görev atandı: Code Review: Dijital İmza Altyapısı — Adım 1	TASK_ASSIGNED	t	213	\N	2026-04-29 11:02:04.785991+00
179	45	Yeni görev atandı: Analiz: Dijital İmza Altyapısı — Adım 2	TASK_ASSIGNED	t	214	\N	2026-04-29 11:02:04.785991+00
180	43	Yeni görev atandı: Dağıtım: Dijital İmza Altyapısı — Adım 3	TASK_ASSIGNED	t	215	\N	2026-04-29 11:02:04.785991+00
181	45	Yeni görev atandı: Bug Fix: Resmi Yazışma Modülü — Adım 1	TASK_ASSIGNED	t	217	\N	2026-04-29 11:02:04.785991+00
182	30	Yeni görev atandı: Dokümantasyon: Resmi Yazışma Modülü — Adım 2	TASK_ASSIGNED	t	218	\N	2026-04-29 11:02:04.785991+00
183	45	Yeni görev atandı: Entegrasyon: Resmi Yazışma Modülü — Adım 3	TASK_ASSIGNED	t	219	\N	2026-04-29 11:02:04.785991+00
184	87	Yeni görev atandı: Geliştirme: Resmi Yazışma Modülü — Adım 4	TASK_ASSIGNED	f	220	\N	2026-04-29 11:02:04.785991+00
185	43	Yeni görev atandı: Dağıtım: Resmi Yazışma Modülü — Adım 5	TASK_ASSIGNED	t	221	\N	2026-04-29 11:02:04.785991+00
186	43	Yeni görev atandı: Tasarım: Belge Doğrulama Servisi — Adım 1	TASK_ASSIGNED	f	223	\N	2026-04-29 11:02:04.785991+00
187	43	Yeni görev atandı: Geliştirme: Belge Doğrulama Servisi — Adım 2	TASK_ASSIGNED	t	224	\N	2026-04-29 11:02:04.785991+00
188	10	Yeni görev atandı: Dokümantasyon: Belge Doğrulama Servisi — Adım 3	TASK_ASSIGNED	t	225	\N	2026-04-29 11:02:04.785991+00
189	22	Yeni görev atandı: Dağıtım: Belge Doğrulama Servisi — Adım 4	TASK_ASSIGNED	t	226	\N	2026-04-29 11:02:04.785991+00
190	22	Yeni görev atandı: Code Review: Belge Doğrulama Servisi — Adım 5	TASK_ASSIGNED	f	227	\N	2026-04-29 11:02:04.785991+00
191	10	Yeni görev atandı: Entegrasyon: Belge Doğrulama Servisi — Adım 6	TASK_ASSIGNED	f	228	\N	2026-04-29 11:02:04.785991+00
192	11	Yeni görev atandı: QA & Test: Kullanıcı Oturum Yönetimi — Adım 1	TASK_ASSIGNED	f	230	\N	2026-04-29 11:02:04.785991+00
193	83	Yeni görev atandı: Dağıtım: Kullanıcı Oturum Yönetimi — Adım 2	TASK_ASSIGNED	f	231	\N	2026-04-29 11:02:04.785991+00
194	20	Yeni görev atandı: Code Review: Kullanıcı Oturum Yönetimi — Adım 3	TASK_ASSIGNED	t	232	\N	2026-04-29 11:02:04.785991+00
195	11	Yeni görev atandı: Unit Test: API Geçidi & Rate Limiting — Adım 1	TASK_ASSIGNED	f	234	\N	2026-04-29 11:02:04.785991+00
196	11	Yeni görev atandı: QA & Test: API Geçidi & Rate Limiting — Adım 2	TASK_ASSIGNED	f	235	\N	2026-04-29 11:02:04.785991+00
197	5	Yeni görev atandı: Analiz: API Geçidi & Rate Limiting — Adım 3	TASK_ASSIGNED	f	236	\N	2026-04-29 11:02:04.785991+00
198	11	Yeni görev atandı: Dağıtım: Bildirim Servisi — Adım 1	TASK_ASSIGNED	t	238	\N	2026-04-29 11:02:04.785991+00
199	20	Yeni görev atandı: Geliştirme: Bildirim Servisi — Adım 2	TASK_ASSIGNED	f	239	\N	2026-04-29 11:02:04.785991+00
200	83	Yeni görev atandı: QA & Test: Bildirim Servisi — Adım 3	TASK_ASSIGNED	t	240	\N	2026-04-29 11:02:04.785991+00
201	30	Yeni görev atandı: Dokümantasyon: Bildirim Servisi — Adım 4	TASK_ASSIGNED	t	241	\N	2026-04-29 11:02:04.785991+00
202	5	Yeni görev atandı: Analiz: Arama & Filtreleme — Adım 1	TASK_ASSIGNED	f	243	\N	2026-04-29 11:02:04.785991+00
203	11	Yeni görev atandı: Dokümantasyon: Arama & Filtreleme — Adım 2	TASK_ASSIGNED	f	244	\N	2026-04-29 11:02:04.785991+00
204	63	Yeni görev atandı: Code Review: Arama & Filtreleme — Adım 3	TASK_ASSIGNED	t	245	\N	2026-04-29 11:02:04.785991+00
205	30	Yeni görev atandı: Tasarım: Arama & Filtreleme — Adım 4	TASK_ASSIGNED	t	246	\N	2026-04-29 11:02:04.785991+00
206	20	Yeni görev atandı: Unit Test: Arama & Filtreleme — Adım 5	TASK_ASSIGNED	f	247	\N	2026-04-29 11:02:04.785991+00
207	48	Yeni görev atandı: Tasarım: Raporlama Dashboard'u — Adım 1	TASK_ASSIGNED	f	249	\N	2026-04-29 11:02:04.785991+00
208	57	Yeni görev atandı: QA & Test: Raporlama Dashboard'u — Adım 2	TASK_ASSIGNED	t	250	\N	2026-04-29 11:02:04.785991+00
209	48	Yeni görev atandı: Geliştirme: Raporlama Dashboard'u — Adım 3	TASK_ASSIGNED	t	251	\N	2026-04-29 11:02:04.785991+00
210	59	Yeni görev atandı: Unit Test: Raporlama Dashboard'u — Adım 4	TASK_ASSIGNED	f	252	\N	2026-04-29 11:02:04.785991+00
211	30	Yeni görev atandı: Dokümantasyon: Raporlama Dashboard'u — Adım 5	TASK_ASSIGNED	t	253	\N	2026-04-29 11:02:04.785991+00
212	59	Yeni görev atandı: Geliştirme: Performans Optimizasyonu — Adım 1	TASK_ASSIGNED	f	255	\N	2026-04-29 11:02:04.785991+00
213	20	Yeni görev atandı: Bug Fix: Performans Optimizasyonu — Adım 2	TASK_ASSIGNED	t	256	\N	2026-04-29 11:02:04.785991+00
214	63	Yeni görev atandı: Analiz: Performans Optimizasyonu — Adım 3	TASK_ASSIGNED	f	257	\N	2026-04-29 11:02:04.785991+00
215	11	Yeni görev atandı: Code Review: Performans Optimizasyonu — Adım 4	TASK_ASSIGNED	f	258	\N	2026-04-29 11:02:04.785991+00
216	48	Yeni görev atandı: Tasarım: Performans Optimizasyonu — Adım 5	TASK_ASSIGNED	f	259	\N	2026-04-29 11:02:04.785991+00
217	57	Yeni görev atandı: Dokümantasyon: Performans Optimizasyonu — Adım 6	TASK_ASSIGNED	t	260	\N	2026-04-29 11:02:04.785991+00
218	50	Yeni görev atandı: Geliştirme: Hasta Kayıt Yönetimi — Adım 1	TASK_ASSIGNED	f	262	\N	2026-04-29 11:02:04.785991+00
219	45	Yeni görev atandı: QA & Test: Hasta Kayıt Yönetimi — Adım 2	TASK_ASSIGNED	t	263	\N	2026-04-29 11:02:04.785991+00
220	50	Yeni görev atandı: Dağıtım: Hasta Kayıt Yönetimi — Adım 3	TASK_ASSIGNED	t	264	\N	2026-04-29 11:02:04.785991+00
221	52	Yeni görev atandı: Analiz: Hasta Kayıt Yönetimi — Adım 4	TASK_ASSIGNED	t	265	\N	2026-04-29 11:02:04.785991+00
222	82	Yeni görev atandı: Dokümantasyon: Hasta Kayıt Yönetimi — Adım 5	TASK_ASSIGNED	t	266	\N	2026-04-29 11:02:04.785991+00
223	38	Yeni görev atandı: Code Review: Klinik Karar Destek Sistemi — Adım 1	TASK_ASSIGNED	f	268	\N	2026-04-29 11:02:04.785991+00
224	37	Yeni görev atandı: Entegrasyon: Klinik Karar Destek Sistemi — Adım 2	TASK_ASSIGNED	f	269	\N	2026-04-29 11:02:04.785991+00
225	52	Yeni görev atandı: Dağıtım: Klinik Karar Destek Sistemi — Adım 3	TASK_ASSIGNED	f	270	\N	2026-04-29 11:02:04.785991+00
226	57	Yeni görev atandı: Unit Test: Klinik Karar Destek Sistemi — Adım 4	TASK_ASSIGNED	t	271	\N	2026-04-29 11:02:04.785991+00
227	33	Yeni görev atandı: Dokümantasyon: Randevu Takvim Sistemi — Adım 1	TASK_ASSIGNED	t	273	\N	2026-04-29 11:02:04.785991+00
228	12	Yeni görev atandı: Analiz: Randevu Takvim Sistemi — Adım 2	TASK_ASSIGNED	t	274	\N	2026-04-29 11:02:04.785991+00
229	33	Yeni görev atandı: Entegrasyon: Randevu Takvim Sistemi — Adım 3	TASK_ASSIGNED	t	275	\N	2026-04-29 11:02:04.785991+00
230	50	Yeni görev atandı: Code Review: Laboratuvar Sonuç Entegrasyonu — Adım 1	TASK_ASSIGNED	f	277	\N	2026-04-29 11:02:04.785991+00
231	82	Yeni görev atandı: Dağıtım: Laboratuvar Sonuç Entegrasyonu — Adım 2	TASK_ASSIGNED	t	278	\N	2026-04-29 11:02:04.785991+00
232	38	Yeni görev atandı: Geliştirme: Laboratuvar Sonuç Entegrasyonu — Adım 3	TASK_ASSIGNED	f	279	\N	2026-04-29 11:02:04.785991+00
233	38	Yeni görev atandı: Entegrasyon: Laboratuvar Sonuç Entegrasyonu — Adım 4	TASK_ASSIGNED	t	280	\N	2026-04-29 11:02:04.785991+00
234	38	Yeni görev atandı: Code Review: KVKK Uyumluluk Modülü — Adım 1	TASK_ASSIGNED	f	282	\N	2026-04-29 11:02:04.785991+00
235	33	Yeni görev atandı: Entegrasyon: KVKK Uyumluluk Modülü — Adım 2	TASK_ASSIGNED	t	283	\N	2026-04-29 11:02:04.785991+00
236	45	Yeni görev atandı: Dokümantasyon: KVKK Uyumluluk Modülü — Adım 3	TASK_ASSIGNED	t	284	\N	2026-04-29 11:02:04.785991+00
237	52	Yeni görev atandı: QA & Test: KVKK Uyumluluk Modülü — Adım 4	TASK_ASSIGNED	f	285	\N	2026-04-29 11:02:04.785991+00
238	12	Yeni görev atandı: Analiz: KVKK Uyumluluk Modülü — Adım 5	TASK_ASSIGNED	t	286	\N	2026-04-29 11:02:04.785991+00
239	82	Yeni görev atandı: Unit Test: KVKK Uyumluluk Modülü — Adım 6	TASK_ASSIGNED	f	287	\N	2026-04-29 11:02:04.785991+00
240	96	Yeni görev atandı: Dokümantasyon: E-Reçete Entegrasyonu — Adım 1	TASK_ASSIGNED	t	289	\N	2026-04-29 11:02:04.785991+00
241	82	Yeni görev atandı: Entegrasyon: E-Reçete Entegrasyonu — Adım 2	TASK_ASSIGNED	f	290	\N	2026-04-29 11:02:04.785991+00
242	52	Yeni görev atandı: Bug Fix: E-Reçete Entegrasyonu — Adım 3	TASK_ASSIGNED	f	291	\N	2026-04-29 11:02:04.785991+00
243	52	Yeni görev atandı: Tasarım: E-Reçete Entegrasyonu — Adım 4	TASK_ASSIGNED	t	292	\N	2026-04-29 11:02:04.785991+00
244	39	Yeni görev atandı: Analiz: E-Reçete Entegrasyonu — Adım 5	TASK_ASSIGNED	t	293	\N	2026-04-29 11:02:04.785991+00
245	13	Yeni görev atandı: Geliştirme: E-Reçete Entegrasyonu — Adım 6	TASK_ASSIGNED	f	294	\N	2026-04-29 11:02:04.785991+00
246	60	Yeni görev atandı: Unit Test: Video Ders Altyapısı — Adım 1	TASK_ASSIGNED	f	296	\N	2026-04-29 11:02:04.785991+00
247	46	Yeni görev atandı: Code Review: Video Ders Altyapısı — Adım 2	TASK_ASSIGNED	f	297	\N	2026-04-29 11:02:04.785991+00
248	6	Yeni görev atandı: Tasarım: Video Ders Altyapısı — Adım 3	TASK_ASSIGNED	f	298	\N	2026-04-29 11:02:04.785991+00
249	46	Yeni görev atandı: QA & Test: Video Ders Altyapısı — Adım 4	TASK_ASSIGNED	t	299	\N	2026-04-29 11:02:04.785991+00
250	46	Yeni görev atandı: Entegrasyon: Quiz Motoru — Adım 1	TASK_ASSIGNED	t	301	\N	2026-04-29 11:02:04.785991+00
251	35	Yeni görev atandı: Tasarım: Quiz Motoru — Adım 2	TASK_ASSIGNED	t	302	\N	2026-04-29 11:02:04.785991+00
252	35	Yeni görev atandı: Analiz: Quiz Motoru — Adım 3	TASK_ASSIGNED	f	303	\N	2026-04-29 11:02:04.785991+00
253	29	Yeni görev atandı: Code Review: Quiz Motoru — Adım 4	TASK_ASSIGNED	t	304	\N	2026-04-29 11:02:04.785991+00
254	61	Yeni görev atandı: Unit Test: Quiz Motoru — Adım 5	TASK_ASSIGNED	t	305	\N	2026-04-29 11:02:04.785991+00
255	60	Yeni görev atandı: Dokümantasyon: Quiz Motoru — Adım 6	TASK_ASSIGNED	f	306	\N	2026-04-29 11:02:04.785991+00
256	46	Yeni görev atandı: Geliştirme: İlerleme Takip Sistemi — Adım 1	TASK_ASSIGNED	f	308	\N	2026-04-29 11:02:04.785991+00
257	6	Yeni görev atandı: Entegrasyon: İlerleme Takip Sistemi — Adım 2	TASK_ASSIGNED	f	309	\N	2026-04-29 11:02:04.785991+00
258	46	Yeni görev atandı: QA & Test: İlerleme Takip Sistemi — Adım 3	TASK_ASSIGNED	f	310	\N	2026-04-29 11:02:04.785991+00
259	61	Yeni görev atandı: Analiz: İlerleme Takip Sistemi — Adım 4	TASK_ASSIGNED	f	311	\N	2026-04-29 11:02:04.785991+00
260	29	Yeni görev atandı: Dokümantasyon: İlerleme Takip Sistemi — Adım 5	TASK_ASSIGNED	t	312	\N	2026-04-29 11:02:04.785991+00
261	29	Yeni görev atandı: Analiz: Canlı Oturum Modülü — Adım 1	TASK_ASSIGNED	t	314	\N	2026-04-29 11:02:04.785991+00
262	35	Yeni görev atandı: Unit Test: Canlı Oturum Modülü — Adım 2	TASK_ASSIGNED	t	315	\N	2026-04-29 11:02:04.785991+00
263	6	Yeni görev atandı: Tasarım: Canlı Oturum Modülü — Adım 3	TASK_ASSIGNED	t	316	\N	2026-04-29 11:02:04.785991+00
264	60	Yeni görev atandı: Dağıtım: Canlı Oturum Modülü — Adım 4	TASK_ASSIGNED	t	317	\N	2026-04-29 11:02:04.785991+00
265	46	Yeni görev atandı: Entegrasyon: Canlı Oturum Modülü — Adım 5	TASK_ASSIGNED	t	318	\N	2026-04-29 11:02:04.785991+00
266	60	Yeni görev atandı: Dokümantasyon: Canlı Oturum Modülü — Adım 6	TASK_ASSIGNED	t	319	\N	2026-04-29 11:02:04.785991+00
267	35	Yeni görev atandı: Code Review: Sertifika Üretimi — Adım 1	TASK_ASSIGNED	f	321	\N	2026-04-29 11:02:04.785991+00
268	60	Yeni görev atandı: Tasarım: Sertifika Üretimi — Adım 2	TASK_ASSIGNED	f	322	\N	2026-04-29 11:02:04.785991+00
269	35	Yeni görev atandı: Dokümantasyon: Sertifika Üretimi — Adım 3	TASK_ASSIGNED	f	323	\N	2026-04-29 11:02:04.785991+00
270	46	Yeni görev atandı: Dağıtım: Forumlar & Topluluk — Adım 1	TASK_ASSIGNED	t	325	\N	2026-04-29 11:02:04.785991+00
271	13	Yeni görev atandı: Bug Fix: Forumlar & Topluluk — Adım 2	TASK_ASSIGNED	t	326	\N	2026-04-29 11:02:04.785991+00
272	6	Yeni görev atandı: QA & Test: Forumlar & Topluluk — Adım 3	TASK_ASSIGNED	t	327	\N	2026-04-29 11:02:04.785991+00
273	60	Yeni görev atandı: Unit Test: Forumlar & Topluluk — Adım 4	TASK_ASSIGNED	f	328	\N	2026-04-29 11:02:04.785991+00
274	11	Yeni görev atandı: Geliştirme: Satış Hunisi Yönetimi — Adım 1	TASK_ASSIGNED	f	330	\N	2026-04-29 11:02:04.785991+00
275	60	Yeni görev atandı: Bug Fix: Satış Hunisi Yönetimi — Adım 2	TASK_ASSIGNED	f	331	\N	2026-04-29 11:02:04.785991+00
276	11	Yeni görev atandı: Analiz: Satış Hunisi Yönetimi — Adım 3	TASK_ASSIGNED	f	332	\N	2026-04-29 11:02:04.785991+00
277	30	Yeni görev atandı: QA & Test: Satış Hunisi Yönetimi — Adım 4	TASK_ASSIGNED	t	333	\N	2026-04-29 11:02:04.785991+00
278	77	Yeni görev atandı: Unit Test: Satış Hunisi Yönetimi — Adım 5	TASK_ASSIGNED	f	334	\N	2026-04-29 11:02:04.785991+00
279	30	Yeni görev atandı: Entegrasyon: E-posta Kampanya Motoru — Adım 1	TASK_ASSIGNED	t	336	\N	2026-04-29 11:02:04.785991+00
280	57	Yeni görev atandı: Dağıtım: E-posta Kampanya Motoru — Adım 2	TASK_ASSIGNED	t	337	\N	2026-04-29 11:02:04.785991+00
281	62	Yeni görev atandı: Geliştirme: E-posta Kampanya Motoru — Adım 3	TASK_ASSIGNED	t	338	\N	2026-04-29 11:02:04.785991+00
282	77	Yeni görev atandı: Entegrasyon: Müşteri 360° Görünümü — Adım 1	TASK_ASSIGNED	t	340	\N	2026-04-29 11:02:04.785991+00
283	62	Yeni görev atandı: QA & Test: Müşteri 360° Görünümü — Adım 2	TASK_ASSIGNED	f	341	\N	2026-04-29 11:02:04.785991+00
284	60	Yeni görev atandı: Dağıtım: Müşteri 360° Görünümü — Adım 3	TASK_ASSIGNED	t	342	\N	2026-04-29 11:02:04.785991+00
285	42	Yeni görev atandı: Geliştirme: Müşteri 360° Görünümü — Adım 4	TASK_ASSIGNED	t	343	\N	2026-04-29 11:02:04.785991+00
286	30	Yeni görev atandı: Tasarım: Müşteri 360° Görünümü — Adım 5	TASK_ASSIGNED	t	344	\N	2026-04-29 11:02:04.785991+00
287	11	Yeni görev atandı: Analiz: Müşteri 360° Görünümü — Adım 6	TASK_ASSIGNED	t	345	\N	2026-04-29 11:02:04.785991+00
288	60	Yeni görev atandı: Dağıtım: Otomatik Görev Atama — Adım 1	TASK_ASSIGNED	t	347	\N	2026-04-29 11:02:04.785991+00
289	62	Yeni görev atandı: Tasarım: Otomatik Görev Atama — Adım 2	TASK_ASSIGNED	f	348	\N	2026-04-29 11:02:04.785991+00
290	57	Yeni görev atandı: Geliştirme: Otomatik Görev Atama — Adım 3	TASK_ASSIGNED	t	349	\N	2026-04-29 11:02:04.785991+00
291	30	Yeni görev atandı: Unit Test: Otomatik Görev Atama — Adım 4	TASK_ASSIGNED	f	350	\N	2026-04-29 11:02:04.785991+00
292	14	Yeni görev atandı: Analiz: Otomatik Görev Atama — Adım 5	TASK_ASSIGNED	f	351	\N	2026-04-29 11:02:04.785991+00
293	60	Yeni görev atandı: Geliştirme: Raporlama & BI — Adım 1	TASK_ASSIGNED	f	353	\N	2026-04-29 11:02:04.785991+00
294	77	Yeni görev atandı: Tasarım: Raporlama & BI — Adım 2	TASK_ASSIGNED	f	354	\N	2026-04-29 11:02:04.785991+00
295	42	Yeni görev atandı: Unit Test: Raporlama & BI — Adım 3	TASK_ASSIGNED	f	355	\N	2026-04-29 11:02:04.785991+00
296	60	Yeni görev atandı: Analiz: Raporlama & BI — Adım 4	TASK_ASSIGNED	f	356	\N	2026-04-29 11:02:04.785991+00
297	77	Yeni görev atandı: Code Review: Raporlama & BI — Adım 5	TASK_ASSIGNED	f	357	\N	2026-04-29 11:02:04.785991+00
298	30	Yeni görev atandı: Bug Fix: Raporlama & BI — Adım 6	TASK_ASSIGNED	f	358	\N	2026-04-29 11:02:04.785991+00
299	1	Yeni görev atandı: Entegrasyon: HIL Test Senaryoları — Adım 1	TASK_ASSIGNED	t	360	\N	2026-04-29 11:02:04.785991+00
300	16	Yeni görev atandı: Dokümantasyon: HIL Test Senaryoları — Adım 2	TASK_ASSIGNED	f	361	\N	2026-04-29 11:02:04.785991+00
301	15	Yeni görev atandı: Analiz: HIL Test Senaryoları — Adım 3	TASK_ASSIGNED	f	362	\N	2026-04-29 11:02:04.785991+00
302	85	Yeni görev atandı: Dağıtım: HIL Test Senaryoları — Adım 4	TASK_ASSIGNED	t	363	\N	2026-04-29 11:02:04.785991+00
303	1	Yeni görev atandı: Tasarım: Otomatik Regresyon Paketi — Adım 1	TASK_ASSIGNED	f	365	\N	2026-04-29 11:02:04.785991+00
304	1	Yeni görev atandı: Bug Fix: Otomatik Regresyon Paketi — Adım 2	TASK_ASSIGNED	t	366	\N	2026-04-29 11:02:04.785991+00
305	1	Yeni görev atandı: Entegrasyon: Otomatik Regresyon Paketi — Adım 3	TASK_ASSIGNED	t	367	\N	2026-04-29 11:02:04.785991+00
306	85	Yeni görev atandı: Unit Test: Otomatik Regresyon Paketi — Adım 4	TASK_ASSIGNED	t	368	\N	2026-04-29 11:02:04.785991+00
307	67	Yeni görev atandı: Code Review: ECU Yazılım Güncelleme Altyapısı — Adım 1	TASK_ASSIGNED	f	370	\N	2026-04-29 11:02:04.785991+00
308	16	Yeni görev atandı: QA & Test: ECU Yazılım Güncelleme Altyapısı — Adım 2	TASK_ASSIGNED	t	371	\N	2026-04-29 11:02:04.785991+00
309	16	Yeni görev atandı: Tasarım: ECU Yazılım Güncelleme Altyapısı — Adım 3	TASK_ASSIGNED	t	372	\N	2026-04-29 11:02:04.785991+00
310	21	Yeni görev atandı: Unit Test: ECU Yazılım Güncelleme Altyapısı — Adım 4	TASK_ASSIGNED	t	373	\N	2026-04-29 11:02:04.785991+00
311	9	Yeni görev atandı: Dokümantasyon: ECU Yazılım Güncelleme Altyapısı — Adım 5	TASK_ASSIGNED	t	374	\N	2026-04-29 11:02:04.785991+00
312	21	Yeni görev atandı: Geliştirme: ECU Yazılım Güncelleme Altyapısı — Adım 6	TASK_ASSIGNED	f	375	\N	2026-04-29 11:02:04.785991+00
313	1	Yeni görev atandı: Dokümantasyon: CAN Bus Protokol Testi — Adım 1	TASK_ASSIGNED	f	377	\N	2026-04-29 11:02:04.785991+00
314	68	Yeni görev atandı: Dağıtım: CAN Bus Protokol Testi — Adım 2	TASK_ASSIGNED	t	378	\N	2026-04-29 11:02:04.785991+00
315	10	Yeni görev atandı: Code Review: CAN Bus Protokol Testi — Adım 3	TASK_ASSIGNED	t	379	\N	2026-04-29 11:02:04.785991+00
316	10	Yeni görev atandı: Bug Fix: CAN Bus Protokol Testi — Adım 4	TASK_ASSIGNED	f	380	\N	2026-04-29 11:02:04.785991+00
317	21	Yeni görev atandı: Unit Test: CAN Bus Protokol Testi — Adım 5	TASK_ASSIGNED	t	381	\N	2026-04-29 11:02:04.785991+00
318	16	Yeni görev atandı: Geliştirme: Fonksiyonel Güvenlik Analizi — Adım 1	TASK_ASSIGNED	f	383	\N	2026-04-29 11:02:04.785991+00
319	9	Yeni görev atandı: Dağıtım: Fonksiyonel Güvenlik Analizi — Adım 2	TASK_ASSIGNED	t	384	\N	2026-04-29 11:02:04.785991+00
320	9	Yeni görev atandı: Entegrasyon: Fonksiyonel Güvenlik Analizi — Adım 3	TASK_ASSIGNED	f	385	\N	2026-04-29 11:02:04.785991+00
321	67	Yeni görev atandı: Tasarım: Fonksiyonel Güvenlik Analizi — Adım 4	TASK_ASSIGNED	t	386	\N	2026-04-29 11:02:04.785991+00
322	85	Yeni görev atandı: QA & Test: Fonksiyonel Güvenlik Analizi — Adım 5	TASK_ASSIGNED	t	387	\N	2026-04-29 11:02:04.785991+00
323	15	Yeni görev atandı: Dokümantasyon: Fonksiyonel Güvenlik Analizi — Adım 6	TASK_ASSIGNED	t	388	\N	2026-04-29 11:02:04.785991+00
324	82	Yeni görev atandı: Analiz: Abonelik Faturalama Motoru — Adım 1	TASK_ASSIGNED	t	390	\N	2026-04-29 11:02:04.785991+00
325	76	Yeni görev atandı: Geliştirme: Abonelik Faturalama Motoru — Adım 2	TASK_ASSIGNED	f	391	\N	2026-04-29 11:02:04.785991+00
326	32	Yeni görev atandı: QA & Test: Abonelik Faturalama Motoru — Adım 3	TASK_ASSIGNED	t	392	\N	2026-04-29 11:02:04.785991+00
327	16	Yeni görev atandı: Dağıtım: Abonelik Faturalama Motoru — Adım 4	TASK_ASSIGNED	f	393	\N	2026-04-29 11:02:04.785991+00
328	47	Yeni görev atandı: Bug Fix: Abonelik Faturalama Motoru — Adım 5	TASK_ASSIGNED	t	394	\N	2026-04-29 11:02:04.785991+00
329	42	Yeni görev atandı: Bug Fix: Toplu Fatura Üretimi — Adım 1	TASK_ASSIGNED	f	396	\N	2026-04-29 11:02:04.785991+00
330	76	Yeni görev atandı: Tasarım: Toplu Fatura Üretimi — Adım 2	TASK_ASSIGNED	t	397	\N	2026-04-29 11:02:04.785991+00
331	25	Yeni görev atandı: Dağıtım: Toplu Fatura Üretimi — Adım 3	TASK_ASSIGNED	t	398	\N	2026-04-29 11:02:04.785991+00
332	47	Yeni görev atandı: Unit Test: Toplu Fatura Üretimi — Adım 4	TASK_ASSIGNED	f	399	\N	2026-04-29 11:02:04.785991+00
333	16	Yeni görev atandı: Geliştirme: Toplu Fatura Üretimi — Adım 5	TASK_ASSIGNED	f	400	\N	2026-04-29 11:02:04.785991+00
334	47	Yeni görev atandı: Tasarım: Ödeme Uzlaştırma — Adım 1	TASK_ASSIGNED	f	402	\N	2026-04-29 11:02:04.785991+00
335	37	Yeni görev atandı: QA & Test: Ödeme Uzlaştırma — Adım 2	TASK_ASSIGNED	t	403	\N	2026-04-29 11:02:04.785991+00
336	37	Yeni görev atandı: Unit Test: Ödeme Uzlaştırma — Adım 3	TASK_ASSIGNED	t	404	\N	2026-04-29 11:02:04.785991+00
337	76	Yeni görev atandı: Dağıtım: OSS/BSS Entegrasyon Katmanı — Adım 1	TASK_ASSIGNED	f	406	\N	2026-04-29 11:02:04.785991+00
338	47	Yeni görev atandı: QA & Test: OSS/BSS Entegrasyon Katmanı — Adım 2	TASK_ASSIGNED	t	407	\N	2026-04-29 11:02:04.785991+00
339	76	Yeni görev atandı: Analiz: OSS/BSS Entegrasyon Katmanı — Adım 3	TASK_ASSIGNED	f	408	\N	2026-04-29 11:02:04.785991+00
340	37	Yeni görev atandı: Geliştirme: OSS/BSS Entegrasyon Katmanı — Adım 4	TASK_ASSIGNED	f	409	\N	2026-04-29 11:02:04.785991+00
341	3	Yeni görev atandı: Unit Test: OSS/BSS Entegrasyon Katmanı — Adım 5	TASK_ASSIGNED	f	410	\N	2026-04-29 11:02:04.785991+00
342	37	Yeni görev atandı: Dokümantasyon: OSS/BSS Entegrasyon Katmanı — Adım 6	TASK_ASSIGNED	f	411	\N	2026-04-29 11:02:04.785991+00
343	47	Yeni görev atandı: Dağıtım: Müşteri Self-Servis Portalı — Adım 1	TASK_ASSIGNED	f	413	\N	2026-04-29 11:02:04.785991+00
344	25	Yeni görev atandı: Code Review: Müşteri Self-Servis Portalı — Adım 2	TASK_ASSIGNED	t	414	\N	2026-04-29 11:02:04.785991+00
345	47	Yeni görev atandı: Bug Fix: Müşteri Self-Servis Portalı — Adım 3	TASK_ASSIGNED	t	415	\N	2026-04-29 11:02:04.785991+00
346	89	Yeni görev atandı: Tasarım: Matchmaking Motoru — Adım 1	TASK_ASSIGNED	f	417	\N	2026-04-29 11:02:04.785991+00
347	89	Yeni görev atandı: QA & Test: Matchmaking Motoru — Adım 2	TASK_ASSIGNED	t	418	\N	2026-04-29 11:02:04.785991+00
348	25	Yeni görev atandı: Entegrasyon: Matchmaking Motoru — Adım 3	TASK_ASSIGNED	t	419	\N	2026-04-29 11:02:04.785991+00
349	57	Yeni görev atandı: Code Review: Matchmaking Motoru — Adım 4	TASK_ASSIGNED	f	420	\N	2026-04-29 11:02:04.785991+00
350	71	Yeni görev atandı: Entegrasyon: Liderlik Tablosu Servisi — Adım 1	TASK_ASSIGNED	f	422	\N	2026-04-29 11:02:04.785991+00
351	62	Yeni görev atandı: Analiz: Liderlik Tablosu Servisi — Adım 2	TASK_ASSIGNED	t	423	\N	2026-04-29 11:02:04.785991+00
352	57	Yeni görev atandı: Code Review: Liderlik Tablosu Servisi — Adım 3	TASK_ASSIGNED	f	424	\N	2026-04-29 11:02:04.785991+00
353	53	Yeni görev atandı: Unit Test: Liderlik Tablosu Servisi — Adım 4	TASK_ASSIGNED	f	425	\N	2026-04-29 11:02:04.785991+00
354	56	Yeni görev atandı: Tasarım: Liderlik Tablosu Servisi — Adım 5	TASK_ASSIGNED	f	426	\N	2026-04-29 11:02:04.785991+00
355	15	Yeni görev atandı: Bug Fix: Liderlik Tablosu Servisi — Adım 6	TASK_ASSIGNED	f	427	\N	2026-04-29 11:02:04.785991+00
356	86	Yeni görev atandı: Analiz: Başarı & Ödül Sistemi — Adım 1	TASK_ASSIGNED	f	429	\N	2026-04-29 11:02:04.785991+00
357	56	Yeni görev atandı: Code Review: Başarı & Ödül Sistemi — Adım 2	TASK_ASSIGNED	f	430	\N	2026-04-29 11:02:04.785991+00
358	53	Yeni görev atandı: Dokümantasyon: Başarı & Ödül Sistemi — Adım 3	TASK_ASSIGNED	t	431	\N	2026-04-29 11:02:04.785991+00
359	86	Yeni görev atandı: Analiz: In-Game Ekonomi Yönetimi — Adım 1	TASK_ASSIGNED	f	433	\N	2026-04-29 11:02:04.785991+00
360	56	Yeni görev atandı: Entegrasyon: In-Game Ekonomi Yönetimi — Adım 2	TASK_ASSIGNED	t	434	\N	2026-04-29 11:02:04.785991+00
361	20	Yeni görev atandı: Tasarım: In-Game Ekonomi Yönetimi — Adım 3	TASK_ASSIGNED	f	435	\N	2026-04-29 11:02:04.785991+00
362	25	Yeni görev atandı: Unit Test: In-Game Ekonomi Yönetimi — Adım 4	TASK_ASSIGNED	f	436	\N	2026-04-29 11:02:04.785991+00
363	89	Yeni görev atandı: Tasarım: Oturum Yönetimi & Anti-Cheat — Adım 1	TASK_ASSIGNED	t	438	\N	2026-04-29 11:02:04.785991+00
364	20	Yeni görev atandı: Dokümantasyon: Oturum Yönetimi & Anti-Cheat — Adım 2	TASK_ASSIGNED	f	439	\N	2026-04-29 11:02:04.785991+00
365	89	Yeni görev atandı: Unit Test: Oturum Yönetimi & Anti-Cheat — Adım 3	TASK_ASSIGNED	f	440	\N	2026-04-29 11:02:04.785991+00
366	57	Yeni görev atandı: Entegrasyon: Oturum Yönetimi & Anti-Cheat — Adım 4	TASK_ASSIGNED	t	441	\N	2026-04-29 11:02:04.785991+00
367	53	Yeni görev atandı: Geliştirme: Oturum Yönetimi & Anti-Cheat — Adım 5	TASK_ASSIGNED	f	442	\N	2026-04-29 11:02:04.785991+00
368	25	Yeni görev atandı: Analiz: Analitik Veri Hattı — Adım 1	TASK_ASSIGNED	f	444	\N	2026-04-29 11:02:04.785991+00
369	71	Yeni görev atandı: Bug Fix: Analitik Veri Hattı — Adım 2	TASK_ASSIGNED	t	445	\N	2026-04-29 11:02:04.785991+00
370	86	Yeni görev atandı: Code Review: Analitik Veri Hattı — Adım 3	TASK_ASSIGNED	t	446	\N	2026-04-29 11:02:04.785991+00
371	62	Yeni görev atandı: Dokümantasyon: Analitik Veri Hattı — Adım 4	TASK_ASSIGNED	t	447	\N	2026-04-29 11:02:04.785991+00
372	17	Yeni görev atandı: Geliştirme: Analitik Veri Hattı — Adım 5	TASK_ASSIGNED	t	448	\N	2026-04-29 11:02:04.785991+00
373	41	Yeni görev atandı: QA & Test: Analitik Veri Hattı — Adım 6	TASK_ASSIGNED	t	449	\N	2026-04-29 11:02:04.785991+00
374	26	Yeni görev atandı: Dağıtım: MQTT Broker Altyapısı — Adım 1	TASK_ASSIGNED	t	451	\N	2026-04-29 11:02:04.785991+00
375	8	Yeni görev atandı: Code Review: MQTT Broker Altyapısı — Adım 2	TASK_ASSIGNED	t	452	\N	2026-04-29 11:02:04.785991+00
376	39	Yeni görev atandı: Analiz: MQTT Broker Altyapısı — Adım 3	TASK_ASSIGNED	f	453	\N	2026-04-29 11:02:04.785991+00
377	22	Yeni görev atandı: Dokümantasyon: MQTT Broker Altyapısı — Adım 4	TASK_ASSIGNED	t	454	\N	2026-04-29 11:02:04.785991+00
378	88	Yeni görev atandı: Dağıtım: Zaman Serisi Veritabanı — Adım 1	TASK_ASSIGNED	f	456	\N	2026-04-29 11:02:04.785991+00
379	76	Yeni görev atandı: Dokümantasyon: Zaman Serisi Veritabanı — Adım 2	TASK_ASSIGNED	t	457	\N	2026-04-29 11:02:04.785991+00
380	39	Yeni görev atandı: Entegrasyon: Zaman Serisi Veritabanı — Adım 3	TASK_ASSIGNED	f	458	\N	2026-04-29 11:02:04.785991+00
381	88	Yeni görev atandı: Geliştirme: Zaman Serisi Veritabanı — Adım 4	TASK_ASSIGNED	f	459	\N	2026-04-29 11:02:04.785991+00
382	76	Yeni görev atandı: Bug Fix: Zaman Serisi Veritabanı — Adım 5	TASK_ASSIGNED	t	460	\N	2026-04-29 11:02:04.785991+00
383	22	Yeni görev atandı: Tasarım: Eşik Alarm Yönetimi — Adım 1	TASK_ASSIGNED	f	462	\N	2026-04-29 11:02:04.785991+00
384	22	Yeni görev atandı: Analiz: Eşik Alarm Yönetimi — Adım 2	TASK_ASSIGNED	t	463	\N	2026-04-29 11:02:04.785991+00
385	8	Yeni görev atandı: Dokümantasyon: Eşik Alarm Yönetimi — Adım 3	TASK_ASSIGNED	t	464	\N	2026-04-29 11:02:04.785991+00
386	26	Yeni görev atandı: Entegrasyon: Eşik Alarm Yönetimi — Adım 4	TASK_ASSIGNED	t	465	\N	2026-04-29 11:02:04.785991+00
387	8	Yeni görev atandı: Dağıtım: Eşik Alarm Yönetimi — Adım 5	TASK_ASSIGNED	f	466	\N	2026-04-29 11:02:04.785991+00
388	8	Yeni görev atandı: QA & Test: Anomali Tespit Modeli — Adım 1	TASK_ASSIGNED	f	468	\N	2026-04-29 11:02:04.785991+00
389	26	Yeni görev atandı: Tasarım: Anomali Tespit Modeli — Adım 2	TASK_ASSIGNED	f	469	\N	2026-04-29 11:02:04.785991+00
390	18	Yeni görev atandı: Analiz: Anomali Tespit Modeli — Adım 3	TASK_ASSIGNED	t	470	\N	2026-04-29 11:02:04.785991+00
391	18	Yeni görev atandı: Dokümantasyon: Anomali Tespit Modeli — Adım 4	TASK_ASSIGNED	f	471	\N	2026-04-29 11:02:04.785991+00
392	39	Yeni görev atandı: Entegrasyon: Cihaz Sağlık Panosu — Adım 1	TASK_ASSIGNED	f	473	\N	2026-04-29 11:02:04.785991+00
393	18	Yeni görev atandı: Dağıtım: Cihaz Sağlık Panosu — Adım 2	TASK_ASSIGNED	f	474	\N	2026-04-29 11:02:04.785991+00
394	76	Yeni görev atandı: Tasarım: Cihaz Sağlık Panosu — Adım 3	TASK_ASSIGNED	f	475	\N	2026-04-29 11:02:04.785991+00
395	39	Yeni görev atandı: Geliştirme: Cihaz Sağlık Panosu — Adım 4	TASK_ASSIGNED	t	476	\N	2026-04-29 11:02:04.785991+00
396	26	Yeni görev atandı: Analiz: OTA Güncelleme Kanalı — Adım 1	TASK_ASSIGNED	t	478	\N	2026-04-29 11:02:04.785991+00
397	8	Yeni görev atandı: Tasarım: OTA Güncelleme Kanalı — Adım 2	TASK_ASSIGNED	t	479	\N	2026-04-29 11:02:04.785991+00
398	88	Yeni görev atandı: Bug Fix: OTA Güncelleme Kanalı — Adım 3	TASK_ASSIGNED	f	480	\N	2026-04-29 11:02:04.785991+00
399	80	Yeni görev atandı: Dağıtım: Akıllı Kontrat Geliştirme — Adım 1	TASK_ASSIGNED	t	482	\N	2026-04-29 11:02:04.785991+00
400	54	Yeni görev atandı: Code Review: Akıllı Kontrat Geliştirme — Adım 2	TASK_ASSIGNED	f	483	\N	2026-04-29 11:02:04.785991+00
401	58	Yeni görev atandı: QA & Test: Akıllı Kontrat Geliştirme — Adım 3	TASK_ASSIGNED	t	484	\N	2026-04-29 11:02:04.785991+00
402	89	Yeni görev atandı: Entegrasyon: Akıllı Kontrat Geliştirme — Adım 4	TASK_ASSIGNED	t	485	\N	2026-04-29 11:02:04.785991+00
403	66	Yeni görev atandı: Unit Test: Akıllı Kontrat Geliştirme — Adım 5	TASK_ASSIGNED	t	486	\N	2026-04-29 11:02:04.785991+00
404	80	Yeni görev atandı: Tasarım: Özel Blockchain Ağ Kurulumu — Adım 1	TASK_ASSIGNED	f	488	\N	2026-04-29 11:02:04.785991+00
405	14	Yeni görev atandı: QA & Test: Özel Blockchain Ağ Kurulumu — Adım 2	TASK_ASSIGNED	t	489	\N	2026-04-29 11:02:04.785991+00
406	14	Yeni görev atandı: Bug Fix: Özel Blockchain Ağ Kurulumu — Adım 3	TASK_ASSIGNED	t	490	\N	2026-04-29 11:02:04.785991+00
407	14	Yeni görev atandı: Geliştirme: Özel Blockchain Ağ Kurulumu — Adım 4	TASK_ASSIGNED	t	491	\N	2026-04-29 11:02:04.785991+00
408	58	Yeni görev atandı: Tasarım: QR Ürün Provenance Takibi — Adım 1	TASK_ASSIGNED	f	493	\N	2026-04-29 11:02:04.785991+00
409	19	Yeni görev atandı: Analiz: QR Ürün Provenance Takibi — Adım 2	TASK_ASSIGNED	t	494	\N	2026-04-29 11:02:04.785991+00
410	69	Yeni görev atandı: Bug Fix: QR Ürün Provenance Takibi — Adım 3	TASK_ASSIGNED	f	495	\N	2026-04-29 11:02:04.785991+00
411	54	Yeni görev atandı: Entegrasyon: Token ve NFT Yönetimi — Adım 1	TASK_ASSIGNED	f	497	\N	2026-04-29 11:02:04.785991+00
412	45	Yeni görev atandı: Bug Fix: Token ve NFT Yönetimi — Adım 2	TASK_ASSIGNED	t	498	\N	2026-04-29 11:02:04.785991+00
413	80	Yeni görev atandı: Unit Test: Token ve NFT Yönetimi — Adım 3	TASK_ASSIGNED	t	499	\N	2026-04-29 11:02:04.785991+00
414	25	Yeni görev atandı: Tasarım: Token ve NFT Yönetimi — Adım 4	TASK_ASSIGNED	f	500	\N	2026-04-29 11:02:04.785991+00
415	66	Yeni görev atandı: Dokümantasyon: Token ve NFT Yönetimi — Adım 5	TASK_ASSIGNED	t	501	\N	2026-04-29 11:02:04.785991+00
416	69	Yeni görev atandı: Dağıtım: Token ve NFT Yönetimi — Adım 6	TASK_ASSIGNED	f	502	\N	2026-04-29 11:02:04.785991+00
417	89	Yeni görev atandı: Tasarım: Uyum ve Denetim Kaydı — Adım 1	TASK_ASSIGNED	t	504	\N	2026-04-29 11:02:04.785991+00
418	55	Yeni görev atandı: Unit Test: Uyum ve Denetim Kaydı — Adım 2	TASK_ASSIGNED	f	505	\N	2026-04-29 11:02:04.785991+00
419	58	Yeni görev atandı: Dokümantasyon: Uyum ve Denetim Kaydı — Adım 3	TASK_ASSIGNED	t	506	\N	2026-04-29 11:02:04.785991+00
420	69	Yeni görev atandı: Entegrasyon: Uyum ve Denetim Kaydı — Adım 4	TASK_ASSIGNED	f	507	\N	2026-04-29 11:02:04.785991+00
421	54	Yeni görev atandı: Code Review: Uyum ve Denetim Kaydı — Adım 5	TASK_ASSIGNED	f	508	\N	2026-04-29 11:02:04.785991+00
422	25	Yeni görev atandı: Analiz: Uyum ve Denetim Kaydı — Adım 6	TASK_ASSIGNED	t	509	\N	2026-04-29 11:02:04.785991+00
423	20	Yeni görev atandı: Analiz: SAP RFC Entegrasyon Adaptörü — Adım 1	TASK_ASSIGNED	t	511	\N	2026-04-29 11:02:04.785991+00
424	54	Yeni görev atandı: QA & Test: SAP RFC Entegrasyon Adaptörü — Adım 2	TASK_ASSIGNED	t	512	\N	2026-04-29 11:02:04.785991+00
425	27	Yeni görev atandı: Code Review: SAP RFC Entegrasyon Adaptörü — Adım 3	TASK_ASSIGNED	t	513	\N	2026-04-29 11:02:04.785991+00
426	35	Yeni görev atandı: Entegrasyon: SAP RFC Entegrasyon Adaptörü — Adım 4	TASK_ASSIGNED	t	514	\N	2026-04-29 11:02:04.785991+00
427	35	Yeni görev atandı: Analiz: Master Data Yönetim Katmanı — Adım 1	TASK_ASSIGNED	f	516	\N	2026-04-29 11:02:04.785991+00
428	20	Yeni görev atandı: QA & Test: Master Data Yönetim Katmanı — Adım 2	TASK_ASSIGNED	f	517	\N	2026-04-29 11:02:04.785991+00
429	54	Yeni görev atandı: Entegrasyon: Master Data Yönetim Katmanı — Adım 3	TASK_ASSIGNED	t	518	\N	2026-04-29 11:02:04.785991+00
430	97	Yeni görev atandı: Unit Test: Master Data Yönetim Katmanı — Adım 4	TASK_ASSIGNED	f	519	\N	2026-04-29 11:02:04.785991+00
431	54	Yeni görev atandı: Bug Fix: İş Akışı Otomasyon Motoru — Adım 1	TASK_ASSIGNED	f	521	\N	2026-04-29 11:02:04.785991+00
432	42	Yeni görev atandı: Entegrasyon: İş Akışı Otomasyon Motoru — Adım 2	TASK_ASSIGNED	f	522	\N	2026-04-29 11:02:04.785991+00
433	66	Yeni görev atandı: QA & Test: İş Akışı Otomasyon Motoru — Adım 3	TASK_ASSIGNED	f	523	\N	2026-04-29 11:02:04.785991+00
434	27	Yeni görev atandı: Geliştirme: İş Akışı Otomasyon Motoru — Adım 4	TASK_ASSIGNED	t	524	\N	2026-04-29 11:02:04.785991+00
435	27	Yeni görev atandı: Dağıtım: İş Akışı Otomasyon Motoru — Adım 5	TASK_ASSIGNED	t	525	\N	2026-04-29 11:02:04.785991+00
436	27	Yeni görev atandı: Tasarım: Veri Kalitesi & Doğrulama — Adım 1	TASK_ASSIGNED	t	527	\N	2026-04-29 11:02:04.785991+00
437	27	Yeni görev atandı: Analiz: Veri Kalitesi & Doğrulama — Adım 2	TASK_ASSIGNED	t	528	\N	2026-04-29 11:02:04.785991+00
438	27	Yeni görev atandı: Dokümantasyon: Veri Kalitesi & Doğrulama — Adım 3	TASK_ASSIGNED	t	529	\N	2026-04-29 11:02:04.785991+00
439	54	Yeni görev atandı: Code Review: Veri Kalitesi & Doğrulama — Adım 4	TASK_ASSIGNED	f	530	\N	2026-04-29 11:02:04.785991+00
440	66	Yeni görev atandı: Bug Fix: Veri Kalitesi & Doğrulama — Adım 5	TASK_ASSIGNED	f	531	\N	2026-04-29 11:02:04.785991+00
441	35	Yeni görev atandı: Geliştirme: Veri Kalitesi & Doğrulama — Adım 6	TASK_ASSIGNED	f	532	\N	2026-04-29 11:02:04.785991+00
442	75	Yeni görev atandı: Dokümantasyon: Dialog Yönetim Sistemi — Adım 1	TASK_ASSIGNED	f	534	\N	2026-04-29 11:02:04.785991+00
443	64	Yeni görev atandı: Bug Fix: Dialog Yönetim Sistemi — Adım 2	TASK_ASSIGNED	t	535	\N	2026-04-29 11:02:04.785991+00
444	64	Yeni görev atandı: Code Review: Dialog Yönetim Sistemi — Adım 3	TASK_ASSIGNED	t	536	\N	2026-04-29 11:02:04.785991+00
445	52	Yeni görev atandı: QA & Test: Dialog Yönetim Sistemi — Adım 4	TASK_ASSIGNED	t	537	\N	2026-04-29 11:02:04.785991+00
446	64	Yeni görev atandı: Dağıtım: NLP Motoru Entegrasyonu — Adım 1	TASK_ASSIGNED	t	539	\N	2026-04-29 11:02:04.785991+00
447	22	Yeni görev atandı: Analiz: NLP Motoru Entegrasyonu — Adım 2	TASK_ASSIGNED	f	540	\N	2026-04-29 11:02:04.785991+00
448	67	Yeni görev atandı: Entegrasyon: NLP Motoru Entegrasyonu — Adım 3	TASK_ASSIGNED	t	541	\N	2026-04-29 11:02:04.785991+00
449	3	Yeni görev atandı: Unit Test: NLP Motoru Entegrasyonu — Adım 4	TASK_ASSIGNED	f	542	\N	2026-04-29 11:02:04.785991+00
450	64	Yeni görev atandı: QA & Test: NLP Motoru Entegrasyonu — Adım 5	TASK_ASSIGNED	f	543	\N	2026-04-29 11:02:04.785991+00
451	51	Yeni görev atandı: Dokümantasyon: WhatsApp Business API — Adım 1	TASK_ASSIGNED	f	545	\N	2026-04-29 11:02:04.785991+00
452	22	Yeni görev atandı: Tasarım: WhatsApp Business API — Adım 2	TASK_ASSIGNED	f	546	\N	2026-04-29 11:02:04.785991+00
453	75	Yeni görev atandı: Bug Fix: WhatsApp Business API — Adım 3	TASK_ASSIGNED	t	547	\N	2026-04-29 11:02:04.785991+00
454	9	Yeni görev atandı: Unit Test: Canlı Temsilci Devir Akışı — Adım 1	TASK_ASSIGNED	t	549	\N	2026-04-29 11:02:04.785991+00
455	22	Yeni görev atandı: Geliştirme: Canlı Temsilci Devir Akışı — Adım 2	TASK_ASSIGNED	f	550	\N	2026-04-29 11:02:04.785991+00
456	3	Yeni görev atandı: Dağıtım: Canlı Temsilci Devir Akışı — Adım 3	TASK_ASSIGNED	t	551	\N	2026-04-29 11:02:04.785991+00
457	67	Yeni görev atandı: Tasarım: Canlı Temsilci Devir Akışı — Adım 4	TASK_ASSIGNED	t	552	\N	2026-04-29 11:02:04.785991+00
458	95	Yeni görev atandı: Analiz: Canlı Temsilci Devir Akışı — Adım 5	TASK_ASSIGNED	f	553	\N	2026-04-29 11:02:04.785991+00
459	22	Yeni görev atandı: Bug Fix: Canlı Temsilci Devir Akışı — Adım 6	TASK_ASSIGNED	t	554	\N	2026-04-29 11:02:04.785991+00
460	22	Yeni görev atandı: Entegrasyon: Analitik & Intent İyileştirme — Adım 1	TASK_ASSIGNED	f	556	\N	2026-04-29 11:02:04.785991+00
461	95	Yeni görev atandı: Dağıtım: Analitik & Intent İyileştirme — Adım 2	TASK_ASSIGNED	f	557	\N	2026-04-29 11:02:04.785991+00
462	67	Yeni görev atandı: Tasarım: Analitik & Intent İyileştirme — Adım 3	TASK_ASSIGNED	f	558	\N	2026-04-29 11:02:04.785991+00
463	94	Yeni görev atandı: Analiz: Poliçe Oluşturma Motoru — Adım 1	TASK_ASSIGNED	t	560	\N	2026-04-29 11:02:04.785991+00
464	70	Yeni görev atandı: QA & Test: Poliçe Oluşturma Motoru — Adım 2	TASK_ASSIGNED	t	561	\N	2026-04-29 11:02:04.785991+00
465	10	Yeni görev atandı: Entegrasyon: Poliçe Oluşturma Motoru — Adım 3	TASK_ASSIGNED	t	562	\N	2026-04-29 11:02:04.785991+00
466	53	Yeni görev atandı: Analiz: Hasar Tazminat Süreci — Adım 1	TASK_ASSIGNED	f	564	\N	2026-04-29 11:02:04.785991+00
467	94	Yeni görev atandı: Tasarım: Hasar Tazminat Süreci — Adım 2	TASK_ASSIGNED	t	565	\N	2026-04-29 11:02:04.785991+00
468	20	Yeni görev atandı: Entegrasyon: Hasar Tazminat Süreci — Adım 3	TASK_ASSIGNED	t	566	\N	2026-04-29 11:02:04.785991+00
469	94	Yeni görev atandı: Dokümantasyon: Aktüeryal Hesaplama Servisi — Adım 1	TASK_ASSIGNED	t	568	\N	2026-04-29 11:02:04.785991+00
470	93	Yeni görev atandı: Tasarım: Aktüeryal Hesaplama Servisi — Adım 2	TASK_ASSIGNED	f	569	\N	2026-04-29 11:02:04.785991+00
471	94	Yeni görev atandı: Entegrasyon: Aktüeryal Hesaplama Servisi — Adım 3	TASK_ASSIGNED	f	570	\N	2026-04-29 11:02:04.785991+00
472	20	Yeni görev atandı: Analiz: Aktüeryal Hesaplama Servisi — Adım 4	TASK_ASSIGNED	t	571	\N	2026-04-29 11:02:04.785991+00
473	59	Yeni görev atandı: Code Review: Aktüeryal Hesaplama Servisi — Adım 5	TASK_ASSIGNED	t	572	\N	2026-04-29 11:02:04.785991+00
474	59	Yeni görev atandı: Geliştirme: Aktüeryal Hesaplama Servisi — Adım 6	TASK_ASSIGNED	f	573	\N	2026-04-29 11:02:04.785991+00
475	30	Yeni görev atandı: Code Review: Doküman Yönetim Sistemi — Adım 1	TASK_ASSIGNED	f	575	\N	2026-04-29 11:02:04.785991+00
476	30	Yeni görev atandı: Entegrasyon: Doküman Yönetim Sistemi — Adım 2	TASK_ASSIGNED	f	576	\N	2026-04-29 11:02:04.785991+00
477	70	Yeni görev atandı: Tasarım: Doküman Yönetim Sistemi — Adım 3	TASK_ASSIGNED	t	577	\N	2026-04-29 11:02:04.785991+00
478	93	Yeni görev atandı: Analiz: Doküman Yönetim Sistemi — Adım 4	TASK_ASSIGNED	f	578	\N	2026-04-29 11:02:04.785991+00
479	10	Yeni görev atandı: Dağıtım: Doküman Yönetim Sistemi — Adım 5	TASK_ASSIGNED	t	579	\N	2026-04-29 11:02:04.785991+00
480	93	Yeni görev atandı: Geliştirme: Doküman Yönetim Sistemi — Adım 6	TASK_ASSIGNED	t	580	\N	2026-04-29 11:02:04.785991+00
481	27	Yeni görev atandı: Entegrasyon: Uyum & Raporlama — Adım 1	TASK_ASSIGNED	f	582	\N	2026-04-29 11:02:04.785991+00
482	53	Yeni görev atandı: Analiz: Uyum & Raporlama — Adım 2	TASK_ASSIGNED	f	583	\N	2026-04-29 11:02:04.785991+00
483	61	Yeni görev atandı: Tasarım: Uyum & Raporlama — Adım 3	TASK_ASSIGNED	t	584	\N	2026-04-29 11:02:04.785991+00
484	70	Yeni görev atandı: Code Review: Uyum & Raporlama — Adım 4	TASK_ASSIGNED	f	585	\N	2026-04-29 11:02:04.785991+00
485	53	Yeni görev atandı: Bug Fix: Uyum & Raporlama — Adım 5	TASK_ASSIGNED	t	586	\N	2026-04-29 11:02:04.785991+00
486	59	Yeni görev atandı: QA & Test: Uyum & Raporlama — Adım 6	TASK_ASSIGNED	t	587	\N	2026-04-29 11:02:04.785991+00
487	3	Yeni görev atandı: Dokümantasyon: Prototip v1 — Temel Akışlar — Adım 1	TASK_ASSIGNED	f	589	\N	2026-04-29 11:02:04.785991+00
488	11	Yeni görev atandı: Bug Fix: Prototip v1 — Temel Akışlar — Adım 2	TASK_ASSIGNED	f	590	\N	2026-04-29 11:02:04.785991+00
489	3	Yeni görev atandı: Code Review: Prototip v1 — Temel Akışlar — Adım 3	TASK_ASSIGNED	f	591	\N	2026-04-29 11:02:04.785991+00
490	95	Yeni görev atandı: Geliştirme: Prototip v1 — Temel Akışlar — Adım 4	TASK_ASSIGNED	t	592	\N	2026-04-29 11:02:04.785991+00
491	23	Yeni görev atandı: Tasarım: Prototip v2 — Çekirdek Özellikler — Adım 1	TASK_ASSIGNED	t	594	\N	2026-04-29 11:02:04.785991+00
492	33	Yeni görev atandı: Analiz: Prototip v2 — Çekirdek Özellikler — Adım 2	TASK_ASSIGNED	f	595	\N	2026-04-29 11:02:04.785991+00
493	45	Yeni görev atandı: QA & Test: Prototip v2 — Çekirdek Özellikler — Adım 3	TASK_ASSIGNED	f	596	\N	2026-04-29 11:02:04.785991+00
494	45	Yeni görev atandı: Bug Fix: Prototip v2 — Çekirdek Özellikler — Adım 4	TASK_ASSIGNED	f	597	\N	2026-04-29 11:02:04.785991+00
495	23	Yeni görev atandı: QA & Test: MVP Teslimatı — Adım 1	TASK_ASSIGNED	t	599	\N	2026-04-29 11:02:04.785991+00
496	29	Yeni görev atandı: Entegrasyon: MVP Teslimatı — Adım 2	TASK_ASSIGNED	t	600	\N	2026-04-29 11:02:04.785991+00
497	11	Yeni görev atandı: Bug Fix: MVP Teslimatı — Adım 3	TASK_ASSIGNED	t	601	\N	2026-04-29 11:02:04.785991+00
498	45	Yeni görev atandı: Dokümantasyon: Geri Bildirim İşleme — Adım 1	TASK_ASSIGNED	t	603	\N	2026-04-29 11:02:04.785991+00
499	95	Yeni görev atandı: Dağıtım: Geri Bildirim İşleme — Adım 2	TASK_ASSIGNED	f	604	\N	2026-04-29 11:02:04.785991+00
500	16	Yeni görev atandı: Bug Fix: Geri Bildirim İşleme — Adım 3	TASK_ASSIGNED	f	605	\N	2026-04-29 11:02:04.785991+00
501	23	Yeni görev atandı: QA & Test: Geri Bildirim İşleme — Adım 4	TASK_ASSIGNED	f	606	\N	2026-04-29 11:02:04.785991+00
502	16	Yeni görev atandı: Code Review: Geri Bildirim İşleme — Adım 5	TASK_ASSIGNED	t	607	\N	2026-04-29 11:02:04.785991+00
503	2	Sistem Yöneticisi sizi 'Bildirim Altyapısı (DATA)' görevine atadı	TASK_ASSIGNED	f	99	task	2026-04-29 13:13:42.554345+00
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, token_hash, user_id, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, key, label_tr, label_en, scope, description) FROM stdin;
1	project.create	Proje oluştur	Create project	project	\N
2	project.edit	Proje düzenle	Edit project	project	\N
3	project.delete	Proje sil	Delete project	project	\N
4	project.archive	Proje arşivle	Archive project	project	\N
5	task.create	Görev oluştur	Create task	project	\N
6	task.change_assignee	Atanan değiştir	Change assignee	project	\N
7	task.change_status	Durum değiştir	Change status	project	\N
8	task.delete	Görev sil	Delete task	project	\N
9	member.invite	Üye davet et	Invite member	project	\N
10	member.remove	Üye çıkar	Remove member	project	\N
11	workflow.edit	Workflow düzenle	Edit workflow	project	\N
12	lifecycle.edit	Yaşam döngüsü düzenle	Edit lifecycle	project	\N
13	template.publish	Şablon yayınla	Publish template	project	\N
14	role.assign	Rol ata	Assign role	project	\N
15	admin.access	Admin paneli	Admin panel access	system	\N
16	admin.users.invite	Kullanıcı davet et	Invite user	system	\N
17	admin.users.deactivate	Kullanıcı deaktive et	Deactivate user	system	\N
18	admin.users.role_change	Kullanıcı rolü değiştir	Change user role	system	\N
19	admin.users.bulk	Toplu kullanıcı işlemi	Bulk user action	system	\N
20	admin.audit.read	Denetim kaydı oku	Read audit log	system	\N
21	admin.audit.export	Denetim kaydı dışa aktar	Export audit log	system	\N
22	admin.stats.read	İstatistikleri oku	Read admin stats	system	\N
23	admin.summary.export	PDF rapor dışa aktar	Export PDF summary	system	\N
24	admin.join_requests.approve	Katılım isteğini onayla	Approve join request	system	\N
25	admin.settings.update	Ayarları güncelle	Update settings	system	\N
26	permission.matrix.update	İzin matrisi düzenle	Update permission matrix	system	\N
27	comment.create	Yorum ekle	Create comment	project	\N
28	comment.edit	Yorum düzenle	Edit comment	project	\N
29	comment.delete	Yorum sil	Delete comment	project	\N
30	milestone.create	Kilometre tasi olustur	Create milestone	project	\N
31	milestone.edit	Kilometre tasi duzenle	Edit milestone	project	\N
32	milestone.delete	Kilometre tasi sil	Delete milestone	project	\N
33	artifact.create	Cikti olustur	Create artifact	project	\N
34	artifact.edit	Cikti duzenle	Edit artifact	project	\N
35	artifact.delete	Cikti sil	Delete artifact	project	\N
36	phase_report.create	Faz raporu olustur	Create phase report	project	\N
37	phase_report.edit	Faz raporu duzenle	Edit phase report	project	\N
38	phase_report.delete	Faz raporu sil	Delete phase report	project	\N
\.


--
-- Data for Name: phase_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phase_reports (id, project_id, phase_id, cycle_number, revision, summary_task_count, summary_done_count, summary_moved_count, summary_duration_days, completed_tasks_notes, issues, lessons, recommendations, created_by, version, created_at, updated_at, is_deleted, deleted_at) FROM stdin;
\.


--
-- Data for Name: project_join_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_join_requests (id, project_id, requested_by_user_id, target_user_id, status, note, reviewed_by_admin_id, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_members (project_id, user_id, joined_at) FROM stdin;
1	5	2026-04-29 11:02:01.374639+00
1	2	2026-04-29 11:02:01.374639+00
1	3	2026-04-29 11:02:01.374639+00
1	7	2026-04-29 11:02:01.374639+00
2	8	2026-04-29 11:02:01.374639+00
2	7	2026-04-29 11:02:01.374639+00
2	5	2026-04-29 11:02:01.374639+00
2	4	2026-04-29 11:02:01.374639+00
2	3	2026-04-29 11:02:01.374639+00
3	1	2026-04-29 11:02:01.374639+00
3	8	2026-04-29 11:02:01.374639+00
3	3	2026-04-29 11:02:01.374639+00
3	4	2026-04-29 11:02:01.374639+00
3	7	2026-04-29 11:02:01.374639+00
3	2	2026-04-29 11:02:01.374639+00
4	1	2026-04-29 11:02:01.374639+00
4	5	2026-04-29 11:02:01.374639+00
4	6	2026-04-29 11:02:01.374639+00
4	7	2026-04-29 11:02:01.374639+00
4	3	2026-04-29 11:02:01.374639+00
5	97	2026-04-29 11:02:04.785991+00
5	21	2026-04-29 11:02:04.785991+00
5	22	2026-04-29 11:02:04.785991+00
5	23	2026-04-29 11:02:04.785991+00
5	50	2026-04-29 11:02:04.785991+00
5	42	2026-04-29 11:02:04.785991+00
5	4	2026-04-29 11:02:04.785991+00
5	9	2026-04-29 11:02:04.785991+00
6	43	2026-04-29 11:02:04.785991+00
6	45	2026-04-29 11:02:04.785991+00
6	23	2026-04-29 11:02:04.785991+00
6	46	2026-04-29 11:02:04.785991+00
6	73	2026-04-29 11:02:04.785991+00
6	51	2026-04-29 11:02:04.785991+00
6	87	2026-04-29 11:02:04.785991+00
6	30	2026-04-29 11:02:04.785991+00
6	22	2026-04-29 11:02:04.785991+00
6	10	2026-04-29 11:02:04.785991+00
7	5	2026-04-29 11:02:04.785991+00
7	59	2026-04-29 11:02:04.785991+00
7	57	2026-04-29 11:02:04.785991+00
7	64	2026-04-29 11:02:04.785991+00
7	48	2026-04-29 11:02:04.785991+00
7	83	2026-04-29 11:02:04.785991+00
7	63	2026-04-29 11:02:04.785991+00
7	30	2026-04-29 11:02:04.785991+00
7	11	2026-04-29 11:02:04.785991+00
7	55	2026-04-29 11:02:04.785991+00
7	46	2026-04-29 11:02:04.785991+00
7	20	2026-04-29 11:02:04.785991+00
8	50	2026-04-29 11:02:04.785991+00
8	13	2026-04-29 11:02:04.785991+00
8	39	2026-04-29 11:02:04.785991+00
8	96	2026-04-29 11:02:04.785991+00
8	82	2026-04-29 11:02:04.785991+00
8	45	2026-04-29 11:02:04.785991+00
8	33	2026-04-29 11:02:04.785991+00
8	52	2026-04-29 11:02:04.785991+00
8	57	2026-04-29 11:02:04.785991+00
8	37	2026-04-29 11:02:04.785991+00
8	38	2026-04-29 11:02:04.785991+00
8	12	2026-04-29 11:02:04.785991+00
9	61	2026-04-29 11:02:04.785991+00
9	29	2026-04-29 11:02:04.785991+00
9	35	2026-04-29 11:02:04.785991+00
9	60	2026-04-29 11:02:04.785991+00
9	6	2026-04-29 11:02:04.785991+00
9	46	2026-04-29 11:02:04.785991+00
9	13	2026-04-29 11:02:04.785991+00
10	42	2026-04-29 11:02:04.785991+00
10	30	2026-04-29 11:02:04.785991+00
10	11	2026-04-29 11:02:04.785991+00
10	57	2026-04-29 11:02:04.785991+00
10	62	2026-04-29 11:02:04.785991+00
10	77	2026-04-29 11:02:04.785991+00
10	60	2026-04-29 11:02:04.785991+00
10	14	2026-04-29 11:02:04.785991+00
11	16	2026-04-29 11:02:04.785991+00
11	85	2026-04-29 11:02:04.785991+00
11	21	2026-04-29 11:02:04.785991+00
11	1	2026-04-29 11:02:04.785991+00
11	9	2026-04-29 11:02:04.785991+00
11	10	2026-04-29 11:02:04.785991+00
11	68	2026-04-29 11:02:04.785991+00
11	67	2026-04-29 11:02:04.785991+00
11	15	2026-04-29 11:02:04.785991+00
12	3	2026-04-29 11:02:04.785991+00
12	76	2026-04-29 11:02:04.785991+00
12	47	2026-04-29 11:02:04.785991+00
12	25	2026-04-29 11:02:04.785991+00
12	42	2026-04-29 11:02:04.785991+00
12	37	2026-04-29 11:02:04.785991+00
12	32	2026-04-29 11:02:04.785991+00
12	82	2026-04-29 11:02:04.785991+00
12	16	2026-04-29 11:02:04.785991+00
13	15	2026-04-29 11:02:04.785991+00
13	25	2026-04-29 11:02:04.785991+00
13	41	2026-04-29 11:02:04.785991+00
13	89	2026-04-29 11:02:04.785991+00
13	57	2026-04-29 11:02:04.785991+00
13	86	2026-04-29 11:02:04.785991+00
13	20	2026-04-29 11:02:04.785991+00
13	53	2026-04-29 11:02:04.785991+00
13	62	2026-04-29 11:02:04.785991+00
13	71	2026-04-29 11:02:04.785991+00
13	56	2026-04-29 11:02:04.785991+00
13	17	2026-04-29 11:02:04.785991+00
14	22	2026-04-29 11:02:04.785991+00
14	88	2026-04-29 11:02:04.785991+00
14	8	2026-04-29 11:02:04.785991+00
14	26	2026-04-29 11:02:04.785991+00
14	39	2026-04-29 11:02:04.785991+00
14	76	2026-04-29 11:02:04.785991+00
14	18	2026-04-29 11:02:04.785991+00
15	62	2026-04-29 11:02:04.785991+00
15	69	2026-04-29 11:02:04.785991+00
15	54	2026-04-29 11:02:04.785991+00
15	89	2026-04-29 11:02:04.785991+00
15	25	2026-04-29 11:02:04.785991+00
15	58	2026-04-29 11:02:04.785991+00
15	55	2026-04-29 11:02:04.785991+00
15	45	2026-04-29 11:02:04.785991+00
15	66	2026-04-29 11:02:04.785991+00
15	14	2026-04-29 11:02:04.785991+00
15	80	2026-04-29 11:02:04.785991+00
15	19	2026-04-29 11:02:04.785991+00
16	35	2026-04-29 11:02:04.785991+00
16	97	2026-04-29 11:02:04.785991+00
16	54	2026-04-29 11:02:04.785991+00
16	20	2026-04-29 11:02:04.785991+00
16	42	2026-04-29 11:02:04.785991+00
16	27	2026-04-29 11:02:04.785991+00
16	66	2026-04-29 11:02:04.785991+00
17	22	2026-04-29 11:02:04.785991+00
17	75	2026-04-29 11:02:04.785991+00
17	51	2026-04-29 11:02:04.785991+00
17	3	2026-04-29 11:02:04.785991+00
17	52	2026-04-29 11:02:04.785991+00
17	38	2026-04-29 11:02:04.785991+00
17	95	2026-04-29 11:02:04.785991+00
17	67	2026-04-29 11:02:04.785991+00
17	64	2026-04-29 11:02:04.785991+00
17	9	2026-04-29 11:02:04.785991+00
18	70	2026-04-29 11:02:04.785991+00
18	59	2026-04-29 11:02:04.785991+00
18	93	2026-04-29 11:02:04.785991+00
18	20	2026-04-29 11:02:04.785991+00
18	53	2026-04-29 11:02:04.785991+00
18	28	2026-04-29 11:02:04.785991+00
18	30	2026-04-29 11:02:04.785991+00
18	61	2026-04-29 11:02:04.785991+00
18	23	2026-04-29 11:02:04.785991+00
18	27	2026-04-29 11:02:04.785991+00
18	68	2026-04-29 11:02:04.785991+00
18	94	2026-04-29 11:02:04.785991+00
18	10	2026-04-29 11:02:04.785991+00
19	5	2026-04-29 11:02:04.785991+00
19	29	2026-04-29 11:02:04.785991+00
19	45	2026-04-29 11:02:04.785991+00
19	33	2026-04-29 11:02:04.785991+00
19	23	2026-04-29 11:02:04.785991+00
19	3	2026-04-29 11:02:04.785991+00
19	95	2026-04-29 11:02:04.785991+00
19	16	2026-04-29 11:02:04.785991+00
19	11	2026-04-29 11:02:04.785991+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
3	1	2026-05-13 12:27:42.355259+00
3	2	2026-05-13 12:27:42.355259+00
3	4	2026-05-13 12:27:42.355259+00
3	5	2026-05-13 12:27:42.355259+00
3	6	2026-05-13 12:27:42.355259+00
3	7	2026-05-13 12:27:42.355259+00
3	8	2026-05-13 12:27:42.355259+00
3	9	2026-05-13 12:27:42.355259+00
3	10	2026-05-13 12:27:42.355259+00
3	14	2026-05-13 12:27:42.355259+00
3	11	2026-05-13 12:27:42.355259+00
3	12	2026-05-13 12:27:42.355259+00
3	13	2026-05-13 12:27:42.355259+00
3	30	2026-05-13 12:27:42.355259+00
3	31	2026-05-13 12:27:42.355259+00
3	32	2026-05-13 12:27:42.355259+00
3	33	2026-05-13 12:27:42.355259+00
3	34	2026-05-13 12:27:42.355259+00
3	36	2026-05-13 12:27:42.355259+00
3	37	2026-05-13 12:27:42.355259+00
3	38	2026-05-13 12:27:42.355259+00
3	28	2026-05-13 12:27:42.355259+00
3	29	2026-05-13 12:27:42.355259+00
4	5	2026-05-13 12:27:42.355259+00
4	6	2026-05-13 12:27:42.355259+00
4	7	2026-05-13 12:27:42.355259+00
4	27	2026-05-13 12:27:42.355259+00
4	33	2026-05-13 12:27:42.355259+00
\.


--
-- Data for Name: sprint_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sprint_snapshots (id, sprint_id, project_id, task_count, completed_count, total_points, closed_at) FROM stdin;
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_config (key, value, updated_at) FROM stdin;
default_sprint_duration_days	14	2026-04-29 11:02:32.610016+00
max_task_limit	100	2026-04-29 11:02:32.610016+00
default_notification_frequency	instant	2026-04-29 11:02:32.610016+00
reporting_module_enabled	true	2026-04-29 11:02:32.610016+00
integrations_enabled	true	2026-04-29 11:02:32.610016+00
primary_brand_color		2026-04-29 11:02:32.610016+00
chart_theme	default	2026-04-29 11:02:32.610016+00
\.


--
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_dependencies (id, task_id, depends_on_id, dependency_type, created_at) FROM stdin;
\.


--
-- Data for Name: task_labels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_labels (task_id, label_id) FROM stdin;
\.


--
-- Data for Name: task_watchers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_watchers (task_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, description, owner_id, created_at, version, updated_at, is_deleted, deleted_at, leader_id, color, department) FROM stdin;
1	SPMS Geliştirme Ekibi	SPMS Geliştirme projesi için ekip.	2	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	2	#3b82f6	\N
2	E-Ticaret Mobil App Ekibi	E-Ticaret Mobil App projesi için ekip.	3	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	3	#3b82f6	\N
3	Veri Ambarı Göçü Ekibi	Veri Ambarı Göçü projesi için ekip.	2	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	2	#3b82f6	\N
4	Yapay Zeka Modülü Ekibi	Yapay Zeka Modülü projesi için ekip.	3	2026-04-29 11:02:01.374639+00	1	2026-04-29 11:02:01.374639+00	f	\N	3	#3b82f6	\N
5	Fintech Ödeme Altyapısı Ekibi	Fintech Ödeme Altyapısı projesi için oluşturulan çalışma ekibi.	9	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	9	#3b82f6	\N
6	E-Devlet Entegrasyon Portalı Ekibi	E-Devlet Entegrasyon Portalı projesi için oluşturulan çalışma ekibi.	10	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	10	#3b82f6	\N
7	Lojistik Takip Sistemi Ekibi	Lojistik Takip Sistemi projesi için oluşturulan çalışma ekibi.	11	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	11	#3b82f6	\N
8	Sağlık Bilgi Sistemi Ekibi	Sağlık Bilgi Sistemi projesi için oluşturulan çalışma ekibi.	12	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	12	#3b82f6	\N
9	Online Eğitim Platformu Ekibi	Online Eğitim Platformu projesi için oluşturulan çalışma ekibi.	13	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	13	#3b82f6	\N
10	CRM Müşteri İlişkileri Ekibi	CRM Müşteri İlişkileri projesi için oluşturulan çalışma ekibi.	14	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	14	#3b82f6	\N
11	Otomotiv Test Otomasyon Ekibi	Otomotiv Test Otomasyon projesi için oluşturulan çalışma ekibi.	15	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	15	#3b82f6	\N
12	Telekom Fatura Yönetimi Ekibi	Telekom Fatura Yönetimi projesi için oluşturulan çalışma ekibi.	16	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	16	#3b82f6	\N
13	Oyun Backend Servisleri Ekibi	Oyun Backend Servisleri projesi için oluşturulan çalışma ekibi.	17	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	17	#3b82f6	\N
14	IoT Sensör İzleme Platformu Ekibi	IoT Sensör İzleme Platformu projesi için oluşturulan çalışma ekibi.	18	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	18	#3b82f6	\N
15	Blockchain Tedarik Zinciri Ekibi	Blockchain Tedarik Zinciri projesi için oluşturulan çalışma ekibi.	19	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	19	#3b82f6	\N
16	ERP Modül Entegrasyonu Ekibi	ERP Modül Entegrasyonu projesi için oluşturulan çalışma ekibi.	20	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	20	#3b82f6	\N
17	Chatbot & Konuşma AI Ekibi	Chatbot & Konuşma AI projesi için oluşturulan çalışma ekibi.	9	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	9	#3b82f6	\N
18	Sigorta Poliçe Platformu Ekibi	Sigorta Poliçe Platformu projesi için oluşturulan çalışma ekibi.	10	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	10	#3b82f6	\N
19	Hızlı Prototip Geliştirme Ekibi	Hızlı Prototip Geliştirme projesi için oluşturulan çalışma ekibi.	11	2026-04-29 11:02:04.785991+00	1	2026-04-29 11:02:04.785991+00	f	\N	11	#3b82f6	\N
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (team_id, user_id, joined_at) FROM stdin;
1	2	2026-04-29 11:02:01.374639+00
1	3	2026-04-29 11:02:01.374639+00
1	5	2026-04-29 11:02:01.374639+00
1	7	2026-04-29 11:02:01.374639+00
2	3	2026-04-29 11:02:01.374639+00
2	4	2026-04-29 11:02:01.374639+00
2	5	2026-04-29 11:02:01.374639+00
2	7	2026-04-29 11:02:01.374639+00
2	8	2026-04-29 11:02:01.374639+00
3	1	2026-04-29 11:02:01.374639+00
3	2	2026-04-29 11:02:01.374639+00
3	3	2026-04-29 11:02:01.374639+00
3	4	2026-04-29 11:02:01.374639+00
3	7	2026-04-29 11:02:01.374639+00
4	1	2026-04-29 11:02:01.374639+00
4	3	2026-04-29 11:02:01.374639+00
4	5	2026-04-29 11:02:01.374639+00
4	6	2026-04-29 11:02:01.374639+00
4	7	2026-04-29 11:02:01.374639+00
5	4	2026-04-29 11:02:04.785991+00
5	9	2026-04-29 11:02:04.785991+00
5	21	2026-04-29 11:02:04.785991+00
5	22	2026-04-29 11:02:04.785991+00
5	23	2026-04-29 11:02:04.785991+00
5	42	2026-04-29 11:02:04.785991+00
5	50	2026-04-29 11:02:04.785991+00
5	97	2026-04-29 11:02:04.785991+00
6	10	2026-04-29 11:02:04.785991+00
6	22	2026-04-29 11:02:04.785991+00
6	23	2026-04-29 11:02:04.785991+00
6	30	2026-04-29 11:02:04.785991+00
6	43	2026-04-29 11:02:04.785991+00
6	45	2026-04-29 11:02:04.785991+00
6	46	2026-04-29 11:02:04.785991+00
6	51	2026-04-29 11:02:04.785991+00
7	5	2026-04-29 11:02:04.785991+00
7	11	2026-04-29 11:02:04.785991+00
7	20	2026-04-29 11:02:04.785991+00
7	30	2026-04-29 11:02:04.785991+00
7	46	2026-04-29 11:02:04.785991+00
7	48	2026-04-29 11:02:04.785991+00
7	55	2026-04-29 11:02:04.785991+00
7	57	2026-04-29 11:02:04.785991+00
8	12	2026-04-29 11:02:04.785991+00
8	13	2026-04-29 11:02:04.785991+00
8	33	2026-04-29 11:02:04.785991+00
8	37	2026-04-29 11:02:04.785991+00
8	38	2026-04-29 11:02:04.785991+00
8	39	2026-04-29 11:02:04.785991+00
8	45	2026-04-29 11:02:04.785991+00
8	50	2026-04-29 11:02:04.785991+00
9	6	2026-04-29 11:02:04.785991+00
9	13	2026-04-29 11:02:04.785991+00
9	29	2026-04-29 11:02:04.785991+00
9	35	2026-04-29 11:02:04.785991+00
9	46	2026-04-29 11:02:04.785991+00
9	60	2026-04-29 11:02:04.785991+00
9	61	2026-04-29 11:02:04.785991+00
10	11	2026-04-29 11:02:04.785991+00
10	14	2026-04-29 11:02:04.785991+00
10	30	2026-04-29 11:02:04.785991+00
10	42	2026-04-29 11:02:04.785991+00
10	57	2026-04-29 11:02:04.785991+00
10	60	2026-04-29 11:02:04.785991+00
10	62	2026-04-29 11:02:04.785991+00
10	77	2026-04-29 11:02:04.785991+00
11	1	2026-04-29 11:02:04.785991+00
11	9	2026-04-29 11:02:04.785991+00
11	10	2026-04-29 11:02:04.785991+00
11	15	2026-04-29 11:02:04.785991+00
11	16	2026-04-29 11:02:04.785991+00
11	21	2026-04-29 11:02:04.785991+00
11	67	2026-04-29 11:02:04.785991+00
11	68	2026-04-29 11:02:04.785991+00
12	3	2026-04-29 11:02:04.785991+00
12	16	2026-04-29 11:02:04.785991+00
12	25	2026-04-29 11:02:04.785991+00
12	32	2026-04-29 11:02:04.785991+00
12	37	2026-04-29 11:02:04.785991+00
12	42	2026-04-29 11:02:04.785991+00
12	47	2026-04-29 11:02:04.785991+00
12	76	2026-04-29 11:02:04.785991+00
13	15	2026-04-29 11:02:04.785991+00
13	17	2026-04-29 11:02:04.785991+00
13	20	2026-04-29 11:02:04.785991+00
13	25	2026-04-29 11:02:04.785991+00
13	41	2026-04-29 11:02:04.785991+00
13	53	2026-04-29 11:02:04.785991+00
13	56	2026-04-29 11:02:04.785991+00
13	57	2026-04-29 11:02:04.785991+00
14	8	2026-04-29 11:02:04.785991+00
14	18	2026-04-29 11:02:04.785991+00
14	22	2026-04-29 11:02:04.785991+00
14	26	2026-04-29 11:02:04.785991+00
14	39	2026-04-29 11:02:04.785991+00
14	76	2026-04-29 11:02:04.785991+00
14	88	2026-04-29 11:02:04.785991+00
15	14	2026-04-29 11:02:04.785991+00
15	19	2026-04-29 11:02:04.785991+00
15	25	2026-04-29 11:02:04.785991+00
15	45	2026-04-29 11:02:04.785991+00
15	54	2026-04-29 11:02:04.785991+00
15	55	2026-04-29 11:02:04.785991+00
15	58	2026-04-29 11:02:04.785991+00
15	62	2026-04-29 11:02:04.785991+00
16	20	2026-04-29 11:02:04.785991+00
16	27	2026-04-29 11:02:04.785991+00
16	35	2026-04-29 11:02:04.785991+00
16	42	2026-04-29 11:02:04.785991+00
16	54	2026-04-29 11:02:04.785991+00
16	66	2026-04-29 11:02:04.785991+00
16	97	2026-04-29 11:02:04.785991+00
17	3	2026-04-29 11:02:04.785991+00
17	9	2026-04-29 11:02:04.785991+00
17	22	2026-04-29 11:02:04.785991+00
17	38	2026-04-29 11:02:04.785991+00
17	51	2026-04-29 11:02:04.785991+00
17	52	2026-04-29 11:02:04.785991+00
17	64	2026-04-29 11:02:04.785991+00
17	67	2026-04-29 11:02:04.785991+00
18	10	2026-04-29 11:02:04.785991+00
18	20	2026-04-29 11:02:04.785991+00
18	23	2026-04-29 11:02:04.785991+00
18	27	2026-04-29 11:02:04.785991+00
18	28	2026-04-29 11:02:04.785991+00
18	30	2026-04-29 11:02:04.785991+00
18	53	2026-04-29 11:02:04.785991+00
18	59	2026-04-29 11:02:04.785991+00
19	3	2026-04-29 11:02:04.785991+00
19	5	2026-04-29 11:02:04.785991+00
19	11	2026-04-29 11:02:04.785991+00
19	16	2026-04-29 11:02:04.785991+00
19	23	2026-04-29 11:02:04.785991+00
19	29	2026-04-29 11:02:04.785991+00
19	33	2026-04-29 11:02:04.785991+00
19	45	2026-04-29 11:02:04.785991+00
\.


--
-- Data for Name: team_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_projects (team_id, project_id, assigned_at) FROM stdin;
1	1	2026-04-29 11:02:01.374639+00
2	2	2026-04-29 11:02:01.374639+00
3	3	2026-04-29 11:02:01.374639+00
4	4	2026-04-29 11:02:01.374639+00
5	5	2026-04-29 11:02:04.785991+00
6	6	2026-04-29 11:02:04.785991+00
7	7	2026-04-29 11:02:04.785991+00
8	8	2026-04-29 11:02:04.785991+00
9	9	2026-04-29 11:02:04.785991+00
10	10	2026-04-29 11:02:04.785991+00
11	11	2026-04-29 11:02:04.785991+00
12	12	2026-04-29 11:02:04.785991+00
13	13	2026-04-29 11:02:04.785991+00
14	14	2026-04-29 11:02:04.785991+00
15	15	2026-04-29 11:02:04.785991+00
16	16	2026-04-29 11:02:04.785991+00
17	17	2026-04-29 11:02:04.785991+00
18	18	2026-04-29 11:02:04.785991+00
19	19	2026-04-29 11:02:04.785991+00
\.


--
-- Name: artifacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.artifacts_id_seq', 317, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 3145, true);


--
-- Name: board_columns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.board_columns_id_seq', 346, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 400, true);


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.files_id_seq', 1, false);


--
-- Name: labels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.labels_id_seq', 174, true);


--
-- Name: milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.milestones_id_seq', 114, true);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 754, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 135, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 38, true);


--
-- Name: phase_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.phase_reports_id_seq', 273, true);


--
-- Name: process_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.process_templates_id_seq', 44, true);


--
-- Name: project_join_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_join_requests_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 1932, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 385, true);


--
-- Name: sprint_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sprint_snapshots_id_seq', 1, false);


--
-- Name: sprints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sprints_id_seq', 22, true);


--
-- Name: task_dependencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_dependencies_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 848, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teams_id_seq', 101, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4665, true);


--
-- PostgreSQL database dump complete
--

\unrestrict FAySulgtbzOtyMaXJK8JgVgw6s0kxE4rX79KP55gRc1mRTov803ux4jlU8eInWP

