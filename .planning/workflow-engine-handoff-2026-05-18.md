# Workflow Engine — Session HANDOFF

**Tarih:** 2026-05-17 / 2026-05-18 (iki günlük yoğun session)
**Toplam commit:** 26 atomic commit
**Sonuç durumu:** Wave 1 + Wave 2 tamamlandı, bug fix turları kapandı, kullanıcı manuel UI testi PASS
**Bir sonraki adım:** Wave 3 planlaması

---

## 1. Bağlam — Session Başlamadan Önce

SPMS projesinde **workflow editör** vardı ama backend kodu workflow JSON'unu büyük ölçüde **ignore ediyordu**. Concrete bugs:

- Kanban board görev taşımalarında edge validation **yoktu** (kullanıcı serbest taşıma yapabiliyordu)
- WIP limit UI'da edit edilebiliyor ama **hiçbir use case enforce etmiyordu** (ölü kod)
- "Done" tanımı pozisyoneldi (`max(order_index)`) — dil-spesifik değil ama esnek değil
- Recurring task tetiklemesi hard-coded `("done", "completed", "closed")` string match — Türkçe kolon adlı projeler kırılıyordu
- Default kolon listesi hard-coded 5'liydi (template'in default_columns'ı okunmuyordu)
- `process_config.workflow.capabilities` flag'leri DB'de seed edilmişti **ama hiçbir kod okumuyordu**

CLAUDE.md "Strategy Pattern" öneriyordu (Scrum/Kanban/Waterfall için kod-level polimorfizm) — ama bu workflow editörün varlık sebebine **aykırıydı**: kullanıcı runtime'da kendi V-Model'ini veya custom SDLC'sini tanımlayabilmeliydi.

---

## 2. Session Hedefleri (Sırasıyla)

| Faz | Hedef | Sonuç |
|---|---|---|
| Faz 0 | Dead code temizliği — netlik için | ✅ `141131ca` (3 satır sil + 6 satır docstring) |
| Tasarım | 5 kritik mimari karar (Q1-Q5) | ✅ `.planning/workflow-engine-design.md` |
| Wave 1 | Schema V2 + Motor + Strangler use case'leri | ✅ 10 commit (C1-C10) |
| Wave 2 | UI capability toggles + node field editor + template-driven seed | ✅ 11 commit (W2-C1 to W2-C11) |
| Bug Fix | RightPanel tabs + status canvas + preset gating + undo + Settings>Columns + height bound | ✅ 5 commit |

---

## 3. Beş Tasarım Kararı (Plan'da SABİT — Değiştirme!)

Bunlar `.planning/workflow-engine-design.md` Bölüm 3'te detaylı, ama özet:

| # | Karar | Önemli Nokta |
|---|---|---|
| **Q1** | BoardColumn yerinde + JSON edges (Hybrid) | Status workflow nodes BoardColumn'dan derive edilir; JSON sadece edges/groups/capabilities tutar |
| **Q2** | V2 big bang (`workflow → phase_workflow` + `task_workflow` + capabilities), commit'lere bölünmüş | Şema tek seferde final, ama uygulama atomik |
| **Q3** | groups[] **sadece görsel kümeleme**; concurrency **implicit graph topology**'den | groups concurrency için DEĞİL — fork/join edge yapısından çıkar. BPMN gateway modeli |
| **Q4** | max_duration_days **read-time computed** (`is_stale` flag) | Cron yok, scheduler yok — API response'da hesaplanır |
| **Q5** | WorkflowEngine **domain service, class olarak** | `app/domain/services/workflow_engine.py`, ZERO infra import, state-less, constructor injection |

**Strategy Pattern reddedildi** — pure data-driven engine. Yeni SDLC eklemek = yeni JSON template eklemek, yeni kod değil.

---

## 4. Yapılan İş — Commit-by-Commit Sözlük

### Faz 0
- **`141131ca`** — `chore(workflow): phase-0 cleanup` — manage_tasks.py'daki unreachable name-based `is_done` fallback silindi; process_config flag'lerine motor-pending docstring eklendi.

### Wave 1 — Backend Motor (9 commit) + Frontend Uyum (1 commit)
- **`af5a8c44`** — C1: V2 migration + `workflow → phase_workflow` rename (15 dosya, 14 backend okuma yeri güncellendi + manage_projects.py dual-key tolerance)
- **`6b2f6522`** — C2: `task_workflow` placeholder eklendi (idempotent setdefault)
- **`badffb62`** — C3: 12 test fixture V2'ye taşındı + C1 defensive fallback'lar 7 yerden temizlendi (manage_projects.py request-boundary istisnası)
- **`70b86154`** — C4: BoardColumn 6 yeni alan (alembic 013, backfill: ilk=initial, son=terminal)
- **`2542e1f1`** — C5: WorkflowEngine domain service (212 satır, 22 unit test, DIP korunmuş) + WorkflowEdge.is_any_gate
- **`62c3c0f7`** — C6: `map_task_to_response_dto.is_done` → `engine.is_terminal()` (ilk Strangler)
- **`19500d29`** — C7: `UpdateTaskUseCase` edge validation (capability-only, default kapalı)
- **`dc83de48`** — C8: WIP enforcement + `count_tasks_in_column` repo method
- **`2219db4d`** — C9: Recurring trigger → `engine.is_terminal()` + `has_recurring` capability
- **`06ad765c`** — C10: Frontend2 `process_config.workflow → phase_workflow` rename (21 dosya)

### Wave 2 — UI + Template-Driven Seed (11 commit)
- **`6decbd90`** — W2-C1: `WorkflowConfig.capabilities` Pydantic round-trip (Wave 1'de gözden kaçan bug — `extra="ignore"` silently dropping)
- **`1c78fb64`** — W2-C2: `_migrate_v1_to_v2` per-field setdefault idempotency (partial capabilities healing)
- **`65fd308b`** — W2-C3: 10 API integration test (capability + node-field PATCH round-trip)
- **`70b50b8c`** — W2-C4: CapabilitiesPanel React component (7 vitest, mod-spesifik field listesi)
- **`e460564b`** — W2-C5: Mapper round-trip + save handler capability merge + `status_workflow → task_workflow` rename completion
- **`5082d29d`** — W2-C6: Status-mode NodeEditor engine fields (PATCH `/columns`)
- **`28287ae8`** — W2-C7: Lifecycle-mode NodeEditor (workflow JSON write — Pydantic `WorkflowNode` explicit declarations gerekti)
- **`68d52708`** — W2-C8: Settings>Columns subtab 9 sütun (sonra **silindi** kullanıcı feedback'iyle)
- **`12c45a86`** — W2-C9: alembic 014 + `ProcessTemplate.default_columns` JSONB + `_default_columns.py` DRY helper
- **`e7979409`** — W2-C10: CreateProjectUseCase 4-yollu fallback chain (dto > default_columns > legacy columns > DEFAULT_COLUMNS)
- **`2f853924`** — W2-C11: PATCH dual-key tolerance kaldırıldı, FE2 V2-only

### Bug Fix Turları (5 commit — kullanıcı feedback'iyle)
- **`65f7122e`** — RightPanel tabs (5 section → 5 tab) + status-mode boş canvas fix (BoardColumn derivation) + PresetMenu lifecycle-only
- **`265012cb`** — Capability undo kaldırıldı (anlamsız) + Settings>Columns subtab silindi (-927 satır)
- **`6771032c`** — RightPanel height bound (gridTemplateRows pin + minHeight:0)
- **`5970aa44`** — Tab body minHeight:0 (flex item shrink garantisi)
- **`a6b61220`** — Plan B: sticky + maxHeight viewport (AppShell main overflow-auto için)

---

## 5. Kullanılan Taktikler ve Keypoint'ler

### A) Plan Agent → Review → Execute Agent Paterni

Wave 1 ve Wave 2 için **planlayıcı agent** ayrı ayrı çağrıldı, plan dosyası yazıldı, ben review ettim, **her commit için ayrı executor agent** başlattım.

**Avantajları:**
- Plan agent büyük resmi görür, executor agent tek commit'e odaklanır
- Review katmanı plan eksikliklerini yakalar (örn: W2-C1'de WorkflowConfig.capabilities bug'ı planı yazılırken keşfedildi)
- Her execute agent kendi context'ini kullanır → main context şişmez

**Brief yazma prensibi:**
- Plan dosyasındaki ilgili bölümün satır aralığını ver
- Etkilenen dosya listesini açıkça yaz
- Test stratejisini ve doğrulama komutlarını ver
- "Eğer şu olursa commit atma" gibi guard'ları belirt
- Senior review cevaplarını referans göster

### B) Strangler Pattern — Default Kapalı Capability'ler

Wave 1'de hard-coded davranışları tek tek motor'a bağladık (C6-C9). **Her capability default `false`** olduğu için mevcut projeler regression görmedi. Kullanıcı UI'dan açtığında aktive olur.

**Sonuç:** 0 regression boyunca 9 commit + final UI commit.

### C) Atomic Commit + Test'leri Yeşil Tutma Prensibi

Her commit:
- Kendi başına anlamlı (revertable)
- Test'leri geçer
- Plan'da belirtilen scope dışına çıkmaz

Bu disiplin **agent execution**'ında çok değerli — eğer bir commit fail ederse, önceki tüm commit'ler hala stable state.

### D) Senior Review — Açık Sorular RESOLVED İşareti

Plan agent her zaman 5-8 açık soru bırakıyor. **Plan'a `RESOLVED` cevaplarını sabitlemek** kritik — yoksa executor agent kendi yorumunu yapar, plan'dan sapar.

**Plan dokümanlarında "Açık Sorular — Senior Review Cevapları" bölümü** her plan dosyasının sonunda. Execute brief'inde bu bölüme atıfta bulun.

### E) Defensive Fallback Pattern (Migration Geçişlerinde)

Wave 1'de schema rename sırasında geçici **dual-key tolerance** (`pc.get("phase_workflow") or pc.get("workflow")`) eklendi — eski cache'li client'ları kırmamak için.

Sonra C3'te **internal okuma yerleri temizlendi** (request-boundary istisnası kaldı), W2-C11'de request-boundary de kaldırıldı.

**Lesson:** Defensive fallback'lar **birikmemeli** — her tur sonunda cleanup commit'i şart, yoksa "dead branch" haline gelir.

### F) Idempotent Migrations

```python
def _column_exists(table_name, column_name):
    # information_schema check
    ...

def upgrade():
    for name, type_, default, ... in _NEW_COLS:
        if not _column_exists("board_columns", name):
            op.add_column(...)
```

Bu pattern alembic migration'larını **tekrar uygulanabilir** yapar — geliştirme ortamında upgrade/downgrade/re-upgrade temiz.

**Migration JSONB seed** içinse: `setdefault` ile per-field idempotency (W2-C2 öğrenmesi — outer setdefault yetmez).

### G) Profil Bazlı İletişim

Kullanıcının profili:
- **deliberate-informed** → karşılaştırma tabloları sun
- **educational** → kavramları açıkla (Strategy vs data-driven gibi)
- **design-conscious** → UX kalitesi önemli (sticky panel, sağ tarafta uzayan içerik)
- **regression-frustrated** → her commit sonrası test sayısını rapor et

Bu profil session boyunca verimli iletişim için kritikti.

---

## 6. Sürprizler ve Öğrenmeler

### Sürpriz 1: Audit Eksikliği — "Yetim Canlı Veri"
Faz 0'da `process_config.enforce_*` flag'leri "ölü" sandık, ama **migration_005 bunları template'lere canlı veri olarak yazıyordu**. Audit raporu bu detayı atlamıştı. Ek kontrol gerekti.

**Ders:** Silmeden önce data flow trace et. JSONB seed'leri, migration history'i, fixture'ları kontrol et.

### Sürpriz 2: Pydantic V2 Lax Bool
```python
WorkflowCapabilities(enforce_wip_limits="yes")  # → True, coerce!
WorkflowCapabilities(enforce_wip_limits="maybe")  # → ValidationError
```

Pydantic V2 `"yes"/"no"/"true"/"false"/"1"/"0"/"on"/"off"/"y"/"n"` string'leri otomatik bool'a coerce eder. Test yazarken bilinmeli — `"yes"` ile invalid type rejection denenmez, `"maybe"` veya `[]` (list) ile dene.

### Sürpriz 3: Pydantic `extra="ignore"` Silently Dropping
Wave 1'de WorkflowConfig'e capabilities Pydantic field'ı eklemedik → API boundary'da silently atılıyordu. Normalizer yeniden inşa ettiği için **görünür hata yoktu** ama UI'dan gelen capability değişiklikleri persist olmuyordu. W2-C1'de yakalandı.

**Ders:** `extra="ignore"` ile çalışan DTO'larda her field açıkça declare edilmeli, yoksa silent data loss.

### Sürpriz 4: Flex Item `min-height: auto`
Flex item'lar default `min-height: auto` ile gelir — içerik flex item'ı taşırabilir. `overflowY: auto` ancak `min-height: 0` ile birlikte çalışır.

**Pattern:**
```css
.flex-parent { display: flex; flex-direction: column; }
.scrollable-child {
  flex: 1;
  min-height: 0;  /* OLMASA içerik parent'ı taşırır */
  overflow-y: auto;
}
```

### Sürpriz 5: AppShell Main Overflow-Auto Sticky Pattern
Frontend2'de `<main className="flex-1 overflow-auto">` page-level scroll container. Workflow editör gibi viewport-bounded UI'larda **grid içi yükseklik kısıtları yetmez** — main scroll'lanırken canvas + aside birlikte kayar.

**Çözüm:**
```css
aside {
  position: sticky;
  top: 0;
  alignSelf: start;  /* grid item için */
  maxHeight: calc(100vh - 7rem);
}
```

7rem reserve: AppShell header (~4rem) + main padding (~1.5rem) + editor header (~1.5rem).

### Sürpriz 6: Recurring Trigger Hala Dil-Bağımlı
C8 agent uyarısı olmasaydı C9'da bunu atlardık. Audit raporu sadece bir yerden bahsediyordu, agent raporlarında ikinci yer (line 267) ortaya çıktı.

**Ders:** Her commit sonrası "kalan hard-coded ne var?" kontrolü yap. Grep + dual review.

### Sürpriz 7: Plan'dan Akıllı Sapmalar
Birkaç commit'te agent plan'dan ufak saptı:
- W2-C2: Plan 4 test öneriyordu, agent 3 test yaptı (user prompt tercihiyle)
- W2-C7: Plan ayrı callback öneriyordu, agent zaten mevcut `updateNode` zinciri yeterli olduğunu gördü
- W2-C8: Plan `onChange + onBlur` pattern'iyle, agent React stale state'ten kaçınmak için `saveColumn(col, override)` imzası ekledi

**Ders:** Plan rehber, kanun değil. Agent context'inde daha iyi karar verirse, plan'a "deviation" notu raporda olsun.

---

## 7. Wave 3 — Potansiyel İşler

Bu maddeler Wave 1+2 boyunca **kasıtlı olarak ertelendi**. Wave 3 planlamasında bu listeden öncelik seçilebilir:

### Yüksek Değer (Wave 3 ilk adaylar)
1. **`apply_process_template` re-apply kolon sync** — Plan Q1 ertelemesi. Şu an template re-uygulandığında kolonlar sync edilmez (potansiyel görev kaybı). Explicit "Reset Columns" endpoint + UI buton ekle.
2. **Concurrent phase support (groups + UI)** — Q3'te tasarlandı (graph topology'den implicit) ama UI'da fork/join görselleştirmesi yok. V-Model gibi karmaşık SDLC'ler için.
3. **JSONB sanitization gap** — W2-C3 keşfi: PATCH `"yes"` string → response'da `"yes"` ham string olarak dönüyor (Pydantic coerce sadece validate aşamasında, persist sonrası ham). Sanitize katmanı ekle.
4. **PATCH race debounce** — Hızlı tıklama race'i. `lodash useDebouncedCallback` veya `Promise.all` batching. Plan'da W2-C6/C8 risk notu var.

### Orta Değer (UX iyileştirmeleri)
5. **V1 read-fallback cleanup** — FE2'de `task_workflow ?? statusWorkflow ?? status_workflow` zinciri kaldırılabilir (`editor-page.tsx:188, 208`, `lifecycle-service.ts:342`). Production'da V2 cache stable olduktan sonra.
6. **Explicit "Clear" button for max_duration_days** — Wave 2 senior review #3. Şu an boş input = leave unchanged; explicit clear butonu + `clear_max_duration_days: bool` DTO alanı.
7. **Backend validation: is_initial single-column rule** — Senior review #4. Şu an UI uyarısı (AlertBanner), backend kabul ediyor. Validation Wave 3.
8. **Multi-initial AlertBanner copy refinement** — Mevcut metin teknik; product-oriented dile çevrilebilir.

### Düşük Değer (YAGNI candidate)
9. **is_stale notification (cron job)** — Q4'te ertelendi. APScheduler + email/push gerekir. Kullanıcı ihtiyacı belirsiz.
10. **node_id regex compliance (status mode)** — Status mode'da node id formatı `col_42`, D-22 regex `^nd_[A-Za-z0-9_-]{10}$`'a uymuyor. Şu an "iki ayrı dünya" gibi çalışıyor; eğer phase ile task workflow tek graf yapılırsa sorun olur.
11. **`category` lifecycle node engine reading** — Senior review #7. Şu an cosmetic (UI gösterir ama engine okumaz). Wave 3'te `phase_workflow.categories` mantığı eklenirse aktive.
12. **lifecycle preset count'ları status mode için ayrı set** — Eğer task workflow için preset gerekli olursa (örn. "Kanban template", "GitFlow template"). Şu an PresetMenu sadece lifecycle modda gösteriliyor.

### Teknik Borç Temizliği
13. **`WorkflowCapabilities` tipinin merkezi tanımı** — Şu an `lifecycle-service.ts` ve `capabilities-panel.tsx`'te ayrı (structurally identical). Tek yerden export et.
14. **`debug.md` git'te tutulmamalı** — Working copy değişiklikleri tutuluyor. `.gitignore` ekle.
15. **Frontend2 baseline TS errors (20)** — Pre-existing hatalar var (Input.onKeyDown prop signature, axios mock typing, Section.title). Cleanup turu yararlı.

---

## 8. Bir Sonraki Session İçin Tavsiyeler

### A) Hızlı Onboarding
Yeni session başladığında **3 dosyayı oku**:
1. `.planning/workflow-engine-design.md` (kararlar)
2. `.planning/workflow-engine-implementation.md` (Wave 1 plan + execute log)
3. `.planning/workflow-engine-wave2-implementation.md` (Wave 2 plan + execute log)
4. `.planning/workflow-engine-handoff-2026-05-18.md` (bu doküman)

### B) Test Disciplin
Her commit'ten önce **mevcut baseline'ı kaydet:**
- Backend: `cd Backend && python -m pytest tests/ --tb=short 2>&1 | tail -10`
- Frontend: `cd Frontend2 && npx vitest run 2>&1 | Select-String "Test Files|Tests "`
- TypeScript: `cd Frontend2 && npx tsc --noEmit 2>&1 | Where-Object { $_ -match "error TS" } | Measure`

Sonra commit at, baseline ile karşılaştır. Regression varsa **commit atma** — düzelt.

Mevcut baseline'lar (2026-05-18 sonu):
- Backend: 559 pas, 16 skipped, 50 xfailed, 3 xpassed, 0 fail
- Frontend: 836 pas, 7 baseline fail (preexisting), 113+ test file
- TypeScript: 20 hata (preexisting)

### C) Wave 3 Planlama Yaklaşımı
Wave 1+2'deki paterni tekrar uygulayın:
1. **Tasarım soruları** — yeni scope için 3-5 Q&A
2. **Plan agent çağırma** — referans dokümanları + senior review cevapları sabit
3. **Review** — açık soruları cevapla, eksiklikleri ekle
4. **Execute agent commit-by-commit** — atomic + 0 regression

**Plan agent'a brief'te muhakkak:**
- "Wave 1+2 paterni biliniyor varsayılır"
- Önceki tasarım dokümanlarını referans göster
- Default kapalı capability prensibi (Strangler)

### D) Plan'dan Sapmaya İzin Ver
Execute agent context'inde daha iyi gördüğü bir yol varsa, plan'a "deviation" notu raporunda olsun. Plan kanun değil, **sürdürülebilir rehber**.

### E) Frontend Sticky Pattern Reminder
Workflow editör veya benzeri viewport-bounded UI'larda AppShell main `overflow-auto` olduğunu hatırla. Sağ panel/sidebar'lar için:
```css
position: sticky;
top: 0;
alignSelf: start;
maxHeight: calc(100vh - {reserved});
```

### F) Pydantic V2 Pitfalls
- `extra="ignore"` = silent data loss → her field declare et
- LaxBool coerce: `"yes"`/`"no"`/`"true"`/`"false"`/etc. → invalid type test'inde `"maybe"` veya `[]` kullan
- `model_config = ConfigDict(...)` syntax (V1'in `class Config:` değil)

---

## 9. Bu Session'ın Felsefi Sonucu

**Önceden:** Workflow editör vardı ama backend kodu okumuyordu. CLAUDE.md "Strategy Pattern" diyordu ama bu pure data-driven editörün ruhuna aykırıydı.

**Şimdi:** Saf data-driven engine. Hiçbir hard-coded SDLC bilgisi yok. Yeni metodoloji eklemek = yeni JSON template + UI capability toggle, **yeni kod yok**.

**Felsefe:** Kod sabit, veri esnek. Engine veri-yorumlayıcısı, polimorfik strateji değil. Kullanıcı runtime'da kendi V-Model'ini, Spiral'ini, custom hibrit SDLC'sini yazabilir.

Bu, projenin başlangıçtaki vizyonuyla **birebir uyumlu**.

---

## 10. Kapanış

| Metrik | Değer |
|---|---|
| Backend test artışı | 458 → 559 (+101) |
| Frontend test artışı | ~795 → 836 (W2-C8 silindi sonradan) |
| Toplam commit | 26 atomic |
| 0-fail boyunca regression | 0 |
| Senior review iterasyonu | 13+ AskUserQuestion |
| Plan dosyası | 3 (design + 2 implementation) |

Wave 1+2 backend motor + UI çalışıyor. Kullanıcı manuel test'leri geçti.

**Bir sonraki session sahibine:** İyi çalışmalar. Plan dokümanları kutsal — onları takip et, plan'dan sapma gerekirse rapor et. Atomic commit + test disipliniyle bu kadar yol aldık.
