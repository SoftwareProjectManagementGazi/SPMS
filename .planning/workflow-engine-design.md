# Workflow Engine — Tasarım Kararları

**Status:** Active Design — Wave 1 implementation pending
**Started:** 2026-05-17
**Audience:** Senior architect + future contributors. Not a formal ADR; a working consensus document.

---

## 1. Bağlam (Why This Exists)

**Mevcut sorun:** SPMS workflow editörü `process_config.workflow` JSON'unu kaydeder ama backend kodu bunu **sadece phase transitions'da okur**. Diğer her yerde davranış hard-coded:

- Kanban board görev taşımalarında edge validation yok ([manage_tasks.py:236-253](../Backend/app/application/use_cases/manage_tasks.py))
- WIP limit alanı UI'da edit edilebilir ama hiçbir use case enforce etmez
- "Done" tanımı pozisyonel (`max(order_index)`)
- Recurring task tetiklemesi hard-coded `("done", "completed", "closed")` string match
- Default kolon listesi hard-coded 5'li liste
- Metodoloji presetleri (Scrum/Kanban/Waterfall) DB'de seed edilmiş ama hiç okunmuyor

**Vizyon:** Workflow editörü gerçek bir **procedural lifecycle motoru** olsun. Kullanıcı runtime'da kendi SDLC'sini (V-Model, Spiral, Hibrit, vb.) JSON üzerinden tanımlayabilsin. Hiçbir hard-coded methodology mantığı kalmasın.

---

## 2. Reddedilen Yaklaşım: Strategy Pattern

CLAUDE.md "Scrum/Kanban/Waterfall için Strategy Pattern kullan" diyor. Bu **reddedildi** çünkü:

- Yeni metodoloji (V-Model, Spiral) eklemek **kod değişikliği** gerektirirdi
- Workflow editörün varlık sebebine aykırı (hard-coded SDLC'yi başka kapıdan getirir)
- Strategy = polimorfik davranış; ama davranış aslında **JSON-driven** olmalı

**Yerine:** Saf data-driven engine. Strategy yok, polimorfizm yok. Tüm davranış workflow JSON'undan okunur. "Scrum/Kanban/Waterfall" sadece **preset JSON template'leri** olarak yaşar (kullanıcıya başlangıç noktası).

---

## 3. Beş Tasarım Kararı

### Q1: BoardColumn'un Akıbeti — **A: BoardColumn yerinde + JSON edges**

`task_workflow.nodes` JSON'a taşınmaz. BoardColumn DB tablosu kalır, üzerine yeni alanlar eklenir (`category`, `is_initial`, `is_terminal`, `max_duration_days`, `entry_policy`, `exit_policy`). JSON sadece edges/groups/capabilities tutar.

**Sebep:** Sıfır regression riski, Strangler-friendly, 26 referans korunur.

### Q2: V2 Kapsam — **Big bang, commit'lere bölünmüş**

Schema V2 final hedef: capabilities migration + `workflow` → `phase_workflow` rename + `task_workflow` ekleme. Hepsi V2'de. Uygulama commit'lere bölünmüş, atomic.

**Sebep:** Şema bir defa final, ama implementation kontrollü.

### Q3: groups[] ve Concurrency — **Görsel + Implicit topology**

`groups[]` sadece görsel kümeleme (`{id, name, node_ids[]}`). Concurrency için ayrı flag yok — edge graph topology'sinden çıkar: bir node'dan çoklu forward edge = fork; bir node'a çoklu edge = join. Edge type'lara `is_any_gate` eklenecek (`is_all_gate` Phase 12'de var).

**Sebep:** BPMN standardı, sıfır yeni alan, V-Model doğal çalışır.

### Q4: max_duration_days Enforcement — **Read-time computed**

`task_response.is_stale = (now - last_transition) > node.max_duration_days`. Hesaplama API çağrısında. Cron/scheduler yok.

**Sebep:** Sıfır yeni infra. Notification gerekirse Wave 2'de hybrid'e geçilir.

### Q5: Engine Sınıfının Yeri — **Domain service, class olarak**

`app/domain/services/workflow_engine.py` — pure logic, DB/HTTP bilmez. Constructor injection ile workflow config bir kez geçirilir. State-less olsa bile class olarak.

**Sebep:** CLAUDE.md'de tanımlı yer; DI uyumlu; evolution-friendly.

---

## 4. Schema V2 Final Hedef

```json
{
  "schema_version": 2,
  "phase_workflow": {
    "mode": "flexible",
    "capabilities": {
      "enforce_wip_limits": false,
      "enforce_sequential_dependencies": false,
      "restrict_expired_sprints": false,
      "initial_node_id": "n1"
    },
    "nodes": [
      {
        "id": "n1",
        "name": "Requirements",
        "category": "todo",
        "is_initial": true,
        "is_terminal": false,
        "wip_limit": null,
        "max_duration_days": 14,
        "entry_policy": "any",
        "exit_policy": "edges_only"
      }
    ],
    "edges": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Start Design",
        "type": "forward"
      }
    ],
    "groups": [
      { "id": "g1", "name": "Analysis Phase", "node_ids": ["n1"] }
    ]
  },
  "task_workflow": {
    "capabilities": {
      "enforce_wip_limits": false,
      "initial_node_id": null
    },
    "edges": [],
    "groups": []
  },
  "phase_completion_criteria": {},
  "enable_phase_assignment": false,
  "backlog_definition": "cycle_null",
  "cycle_label": null
}
```

**Node alanları (tam liste, Wave 2'de implement edilecek):**
- `id`, `name` — kimlik
- `category` — enum: `todo` | `in_progress` | `done` (Jira'dan)
- `is_initial`, `is_terminal` — pozisyon flag'leri
- `wip_limit` — int | null
- `max_duration_days` — int | null (staleness)
- `entry_policy` — enum: `any` | `edges_only` | `initial_only`
- `exit_policy` — enum: `any` | `edges_only` | `terminal_lock`

**Edge alanları (tam liste):**
- `from`, `to` — node ID'leri (BoardColumn ID veya UUID)
- `label` — UI buton metni
- `type` — enum: `forward` | `backward` | `global` | `is_all_gate` | `is_any_gate`

---

## 5. Implementation — Commit Stratejisi

| # | Commit | Kapsam | Risk |
|---|---|---|---|
| C1 | V1→V2 migration kodu + capabilities + phase_workflow rename | `_migrate_v1_to_v2`, `CURRENT_SCHEMA_VERSION=2`, normalizer test | Orta (rename breaking) |
| C2 | task_workflow boş şema (placeholder) | Migration genişletme, schema validation | Düşük |
| C3 | Test fixture'larını V2'ye taşı | 7+ test dosyası: project_factory + 6 fixture | Düşük |
| C4 | BoardColumn yeni alanları | DB migration (Alembic), entity, seed defaults | Orta (schema) |
| C5 | WorkflowEngine iskelet sınıfı | Yeni dosya: `workflow_engine.py` + unit testler | Düşük |
| C6 | Strangler — `is_done` engine'e bağla | `map_task_to_response_dto` engine.is_terminal() çağırır | Düşük |
| C7+ | Strangler — diğer use case'ler | Edge validation, WIP enforcement, vb. (her biri ayrı commit) | Use case başına |

---

## 6. Açık Sorular (Yanıt Bekleyen)

Bunlar Wave 1'i tamamlamak için **şart değil**, ama Wave 2+ için gerekli:

- **Concurrent phase davranışında "ne izlenir?"** — Bir görev tek phase'de olur, ama proje birden fazla aktif phase'e sahip olabilir. UI'da nasıl gösterilir? (Dashboard, filter)
- **Task workflow vs Phase workflow UI**: Workflow editörde iki sekme mi olacak? Aynı editörde mi?
- **edge requires_comment / requires_approval**: Wave 3'e ertelendi, ne zaman ihtiyaç doğacağı belirsiz
- **node.auto_advance_when**: "Subtask'lerin hepsi bittiyse bu node otomatik ilerler" davranışı — Wave 2 mi Wave 3 mü?

---

## 7. Bu Belgenin Yaşam Döngüsü

- Implementation sırasında karar değişirse buraya yansıt
- Wave 2 başlamadan önce "Açık Sorular" bölümü tartışılır
- Wave'ler tamamlandıkça "Implementation" bölümüne ✅ işareti konur
- Engine production'da olgunlaştığında bu belge ADR olarak `.planning/adrs/` altına taşınabilir
