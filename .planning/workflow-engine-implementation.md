# Workflow Engine — Implementation Plan

**Referans:** `.planning/workflow-engine-design.md`
**Tasarım kararları (özet):**
- **Q1:** BoardColumn yerinde + JSON edges (kategori/initial/terminal/wip/duration/policy alanları DB'ye eklenecek)
- **Q2:** V2 big-bang şema (capabilities + `workflow` → `phase_workflow` rename + `task_workflow`), commit'lere bölünmüş atomic uygulama
- **Q3:** `groups[]` görsel kümeleme; concurrency edge topology'sinden çıkar; edge type'a `is_any_gate` eklenir (`is_all_gate` zaten var)
- **Q4:** `max_duration_days` read-time hesaplanan `is_stale`; cron yok
- **Q5:** WorkflowEngine `app/domain/services/workflow_engine.py` — pure logic class, DI uyumlu, state-less

**Oluşturulma:** 2026-05-17
**Audience:** Üçüncü bir agent (execute), kullanıcı (gözden geçirme).

---

## Genel Bakış

Bu plan **10 atomic commit** içerir (C1–C10). Toplam ~30 dosya, ~900 satır kod (incl. testler). C1–C5 "iskelet" (schema + engine ama davranışsal etki yok); C6–C9 Strangler use case'leri (her biri tek bir hard-coded davranışı engine'e bağlar); C10 Frontend2'yi V2 shape'e uyumlar.

**Kritik commit'ler:**
- **C1** — `workflow` → `phase_workflow` rename; **etkilediği 25 dosya** içinde silent breakage riski en yüksek olan.
- **C4** — Alembic DB migration; geri alınması en zahmetli olan (downgrade var ama production data'ya değer).
- **C7** — Kanban board move regression riski; davranış değişikliği görünür olan ilk commit.

**Stable state'ler:**
- C3 sonrası: V2 şema tamamen uygulanmış, tüm test'ler V2 fixture'larıyla yeşil. Tek başına merge edilebilir.
- C5 sonrası: Engine sınıfı mevcut + unit testleri pas. Davranışsal etki YOK.
- C8 sonrası: Phase 1 Strangler tamamlandı (is_terminal + edge validation + WIP).
- C9 sonrası: Wave 1 tamamen kapanır. Tüm hard-coded davranışlar engine'de.

---

## Bağımlılık Grafı

```
C1 (rename + capabilities + schema_version=2 migration)
 │
 ├─→ C2 (task_workflow placeholder)
 │   │
 │   └─→ C3 (test fixtures → V2)
 │       │
 │       ├─→ C4 (BoardColumn DB ALTER + entity fields + seed defaults)
 │       │   │
 │       │   └─→ C5 (WorkflowEngine sınıfı + WorkflowEdge.is_any_gate field + unit testler)
 │       │       │
 │       │       ├─→ C6 (Strangler: map_task_to_response_dto.is_done)
 │       │       │
 │       │       ├─→ C7 (Strangler: UpdateTaskUseCase edge validation — capability flag only)
 │       │       │
 │       │       ├─→ C8 (Strangler: UpdateTaskUseCase WIP enforcement)
 │       │       │
 │       │       └─→ C9 (Strangler: recurring task trigger)
 │       │           │
 │       │           └─→ C10 (Frontend2 phase_workflow uyumu)
```

Tüm C1 → C9 sıralı; paralelleştirilebilir hiçbir commit yok (C6–C9 teknik olarak paralelize edilebilir ama aynı dosyaya birden fazla değişiklik geleceği için sıralı tutuyorum).

---

## Komut Sırası (Önerilen Execute Sırası)

1. **C1**: rename + capabilities migration → `pytest tests/unit/application/test_process_config_normalizer.py` → commit
2. **C2**: task_workflow placeholder → `pytest tests/unit/application/test_process_config_normalizer.py` → commit
3. **C3**: tüm test fixture'larını V2'ye taşı → `pytest tests/` (tam suite) → commit
4. **C4**: alembic migration 013 + BoardColumn entity/model + seed defaults güncelle → `pytest tests/` → manuel `alembic upgrade head` ve `downgrade -1` test'i → commit
5. **C5**: workflow_engine.py + test_workflow_engine.py → `pytest tests/unit/domain/test_workflow_engine.py` → commit
6. **C6**: `map_task_to_response_dto` engine kullanır → `pytest tests/unit/application/test_manage_tasks.py tests/integration/` → commit
7. **C7**: `UpdateTaskUseCase` edge validation → `pytest tests/unit/application/test_manage_tasks.py` (yeni testler) → commit
8. **C8**: `UpdateTaskUseCase` WIP enforce → `pytest tests/unit/application/test_manage_tasks.py` → commit
9. **C9**: recurring trigger engine.is_terminal() → `pytest tests/unit/application/test_manage_tasks.py` (recurring testleri) → commit
10. **C10**: Frontend2 `phase_workflow` rename → manuel UI testleri + `rg -F 'process_config.workflow' Frontend2/` sıfır doğrulaması → commit

---

## C1: feat(workflow): schema V2 — rename workflow → phase_workflow + capabilities sub-shape

**Risk:** ORTA (rename breaking; 25 dosya etkileniyor — kaçırılan herhangi biri silent breakage)
**Bağımlılık:** — (ilk commit)
**Tahmini değişiklik:** ~14 dosya, ~280 satır

### Amaç
`process_config.workflow` JSONB key'ini `phase_workflow`'a yeniden adlandır; `capabilities` alt nesnesini ekle (mevcut top-level flag'leri içine taşıyarak); `CURRENT_SCHEMA_VERSION = 2`; `_migrate_v1_to_v2` ekle. **Davranışsal etki YOK** — sadece şema; tüm okuma yerleri yeni isimle güncellenir. `task_workflow` bu commit'te EKLENMEZ (C2'ye bırakılmıştır).

### Etkilenen Dosyalar (tam liste)

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/entities/project.py` | MODIFY | `CURRENT_SCHEMA_VERSION=2`, `_migrate_v1_to_v2` ekle, `_MIGRATIONS[1]` map'e bağla |
| `Backend/app/application/use_cases/execute_phase_transition.py` | MODIFY | `pc.get("workflow")` → `pc.get("phase_workflow")` (line 87) |
| `Backend/app/application/use_cases/manage_milestones.py` | MODIFY | `.get("workflow", {})` → `.get("phase_workflow", {})` (line 61) |
| `Backend/app/application/use_cases/manage_phase_reports.py` | MODIFY | iki yer: line 25, 44 |
| `Backend/app/application/use_cases/manage_artifacts.py` | MODIFY | line 53 |
| `Backend/app/application/use_cases/manage_projects.py` | MODIFY | line 149 (`dto.process_config.get("workflow")` ve uygun zaman migrate eden bir helper çağrısı) |
| `Backend/app/application/use_cases/apply_process_template.py` | MODIFY | line 81 (`pc["workflow"] = ...` → `pc["phase_workflow"] = ...`) + `pc["schema_version"] = 2` |
| `Backend/app/api/v1/projects.py` | MODIFY | line 539 (`pc.get("workflow", {})`); docstring line 529, 553 |
| `Backend/app/api/v1/phase_reports.py` | MODIFY | line 176 |
| `Backend/app/domain/entities/milestone.py` | MODIFY | docstring line 5 (`process_config.workflow.nodes` → `process_config.phase_workflow.nodes`) |
| `Backend/app/infrastructure/database/seeder.py` | MODIFY | line 522 (`"workflow": ...` → `"phase_workflow": ...`) + `"schema_version": 2` |
| `Backend/app/infrastructure/database/seeder_extended.py` | MODIFY | line 1405 (aynı pattern) + line 1293 docstring |
| `Backend/app/infrastructure/database/seeder.py` | MODIFY | line 103 comment |
| `Backend/tests/integration/test_seeder.py` | MODIFY | line 121, 219 docstring (sadece açıklama, koda değil) |

**NOT (kritik):** Frontend2 da `process_config.workflow` okur (`Frontend2/services/lifecycle-service.ts:261-265`). C1 sonrası backend yeni isimle gönderir ama eski FE eski isimle bekler. **Çözüm:** Bu commit'te FE değişikliği YOK — backend `_migrate_v1_to_v2` migration'ı, GET endpoint dönmeden önce entity'yi `phase_workflow` ile servis eder. FE'nin uyumlanması (Frontend2 dosyalarındaki 30+ referans) **ayrı bir commit** olarak yapılacaktır — bu plan **backend-only**.

### Detaylı Adımlar

1. **`Backend/app/domain/entities/project.py`** — V2 migration ekle:
   - `CURRENT_SCHEMA_VERSION = 1` → `CURRENT_SCHEMA_VERSION = 2`
   - `_migrate_v0_to_v1` fonksiyonunun ALTINA yeni fonksiyon:
     ```python
     def _migrate_v1_to_v2(config: dict) -> dict:
         """V1 -> V2: rename `workflow` -> `phase_workflow`; nest engine flags under `capabilities`."""
         new = dict(config)
         # 1. Rename workflow -> phase_workflow (idempotent: only if old key exists)
         if "workflow" in new and "phase_workflow" not in new:
             new["phase_workflow"] = new.pop("workflow")
         # 2. Build capabilities sub-object — pull from top-level flags
         caps = {
             "enforce_wip_limits": new.pop("enforce_wip_limits", False),
             "enforce_sequential_dependencies": new.pop(
                 "enforce_sequential_dependencies", False
             ),
             "restrict_expired_sprints": new.pop("restrict_expired_sprints", False),
             # initial_node_id: derived from nodes if any node has is_initial=True
             "initial_node_id": None,
         }
         pw = new.get("phase_workflow") or {}
         for n in pw.get("nodes", []) or []:
             if isinstance(n, dict) and n.get("is_initial"):
                 caps["initial_node_id"] = n.get("id")
                 break
         # Ensure phase_workflow.capabilities exists (do NOT overwrite if already set;
         # idempotency for partial pre-V2 configs in the wild)
         if isinstance(pw, dict):
             pw.setdefault("capabilities", caps)
             new["phase_workflow"] = pw
         new["schema_version"] = 2
         return new
     ```
   - `_MIGRATIONS = {0: _migrate_v0_to_v1}` → `_MIGRATIONS = {0: _migrate_v0_to_v1, 1: _migrate_v1_to_v2}`

2. **`Backend/app/application/use_cases/execute_phase_transition.py`** (line 87):
   - `workflow = pc.get("workflow", {})` → `workflow = pc.get("phase_workflow", {})`
   - (geri kalan `workflow` değişkeni adı aynen kalır — sadece source'u değişiyor)

3. **`Backend/app/application/use_cases/manage_milestones.py`** (line 61):
   - `nodes = (project.process_config or {}).get("workflow", {}).get("nodes", [])` → `.get("phase_workflow", {})`

4. **`Backend/app/application/use_cases/manage_phase_reports.py`** (line 25 + line 44):
   - İki yerde de `.get("workflow", {})` → `.get("phase_workflow", {})`

5. **`Backend/app/application/use_cases/manage_artifacts.py`** (line 53):
   - Aynı pattern.

6. **`Backend/app/application/use_cases/manage_projects.py`** (line 149):
   - `wf = dto.process_config.get("workflow") if isinstance(dto.process_config, dict) else None`
   - Yeni: önce key migration uygula. Mevcut çağrı şu hale gelir:
     ```python
     if dto.process_config is not None:
         # Phase 17 D-X — accept either legacy 'workflow' or new 'phase_workflow' key
         # at the API boundary; the normalizer will rename it on entity load anyway.
         wf = None
         if isinstance(dto.process_config, dict):
             wf = dto.process_config.get("phase_workflow") or dto.process_config.get("workflow")
         if isinstance(wf, dict):
             WorkflowConfigDTO(**wf)
     ```
   - (Bu çift-key tolerance, FE migration'ı senkron olmadığı için gerekli. C1 commit mesajında belirt.)

7. **`Backend/app/application/use_cases/apply_process_template.py`** (line 81):
   - `pc["workflow"] = template.default_workflow` → `pc["phase_workflow"] = template.default_workflow`
   - line 84 `pc["schema_version"] = 1` → `pc["schema_version"] = 2`

8. **`Backend/app/api/v1/projects.py`** (line 539):
   - `workflow = pc.get("workflow", {}) or {}` → `workflow = pc.get("phase_workflow", {}) or {}`
   - line 553 detail string: `"phase_id not present in project.process_config.workflow.nodes"` → `phase_workflow.nodes`
   - line 529 docstring güncelle.

9. **`Backend/app/api/v1/phase_reports.py`** (line 176):
   - `nodes = (project.process_config or {}).get("workflow", {}).get("nodes", []) if project else []` → `.get("phase_workflow", {})`

10. **`Backend/app/domain/entities/milestone.py`** (line 5):
    - Docstring: `project.process_config.workflow.nodes` → `project.process_config.phase_workflow.nodes`

11. **`Backend/app/infrastructure/database/seeder.py`** (line 522):
    ```python
    project.process_config = {
        "schema_version": 2,
        "phase_workflow": _default_workflow_for_methodology(p_data["methodology"]),
    }
    ```
    Ayrıca `phase_workflow`'a `capabilities` ekle:
    - `_default_workflow_for_methodology` çağrıldığı yerde dönen dict'in içine `capabilities`'ı zerkle. Veya helper'ı güncelle: dönüş değerine `"capabilities": {...}` ekle (default `False` değerleri).
    - **Karar:** Helper'ı güncelle — tek yerden okunur. Helper'da metodolojiye göre capability default'ları ata (Scrum → `restrict_expired_sprints=True`, vb. — `migration_005.py:115-139`'daki seed mantığını mirror et).

12. **`Backend/app/infrastructure/database/seeder_extended.py`** (line 1405):
    - Aynı şekilde `"workflow"` → `"phase_workflow"` + `"schema_version": 2`.
    - Line 1293 docstring güncelle.

13. **`Backend/tests/integration/test_seeder.py`** (line 121, 219):
    - Sadece docstring; kod aynı kalır (C3'te düzelteceğiz).

### Test Stratejisi

- **Etkilenen mevcut testler (V1 schema'ya bağımlı):**
  - `tests/unit/application/test_process_config_normalizer.py` — `test_v1_config_is_idempotent` artık FAIL eder (V1 → V2 normalize edecek). Bu beklenen. C3'te güncellenecek; C1'de **deliberate failure** olarak bırakıyoruz **VE** yeni V2 idempotency test'i ekliyoruz.
  - Diğer tüm testler `process_config: {"schema_version": 1, "workflow": ...}` ile project oluşturuyor; **bu testler hala pas eder** çünkü `_normalize_process_config` artık otomatik V1 → V2 migrate eder ve `workflow` key'i okuma yerlerinde de `phase_workflow` olarak görünür.

- **Eklenecek testler** (`tests/unit/application/test_process_config_normalizer.py`'a):
  1. `test_v1_config_migrates_to_v2` — V1 input, V2 output: `phase_workflow` var, `workflow` yok, `capabilities` sub-obj var, `enforce_wip_limits` top-level'de yok.
  2. `test_v2_config_is_idempotent` — V2 input, ikinci kez normalize edilince aynı kalır.
  3. `test_v0_to_v2_chain` — Legacy V0 input (`{"methodology": "SCRUM"}`) iki migrate adımıyla V2'ye gider; sonuçta `phase_workflow.capabilities.initial_node_id is None` (boş nodes).
  4. `test_v1_to_v2_preserves_initial_node_id` — `phase_workflow.nodes` içinde `is_initial=True` olan node varsa, `capabilities.initial_node_id` o ID'yi taşır.
  5. `test_v1_to_v2_partial_already_v2_idempotent` — Aralarda bir migration kalmış config (`schema_version=2` ama capabilities yok) için defensive idempotency.
  6. **`test_v1_legacy_workflow_key_renamed_to_phase_workflow`** (senior review eklendi 2026-05-17) — Explicit rename doğrulaması:
     ```python
     def test_v1_legacy_workflow_key_renamed_to_phase_workflow():
         v1 = {"schema_version": 1, "workflow": {"mode": "flexible", "nodes": [{"id": "n1"}], "edges": [], "groups": []}}
         result = _normalize_process_config(v1)
         assert "workflow" not in result, "Legacy workflow key must be removed"
         assert "phase_workflow" in result, "New phase_workflow key must exist"
         assert result["phase_workflow"]["nodes"][0]["id"] == "n1", "Nodes preserved"
         assert result["phase_workflow"]["mode"] == "flexible", "Mode preserved"
     ```

- **Çalıştırılacak test komutu:**
  ```
  pytest Backend/tests/unit/application/test_process_config_normalizer.py -v
  ```

- **Beklenen sonuç:** 5 yeni test pas; `test_v1_config_is_idempotent` C1'de güncellenmemiş halde **xfail** olarak işaretlenmeli (`@pytest.mark.xfail(reason="V1→V2 migration introduced in C1; test rewritten in C3")`). C3'te xfail kaldırılır.

### Doğrulama

- [ ] `pytest Backend/tests/unit/application/test_process_config_normalizer.py` — 5 yeni test yeşil, 1 xfail
- [ ] `pytest Backend/tests/` — geri kalan tüm test'ler yeşil (otomatik migration sayesinde)
- [ ] Manuel: `python -c "from app.domain.entities.project import Project, _normalize_process_config; print(_normalize_process_config({'methodology': 'SCRUM'}))"` çıktı V2 shape gösterir
- [ ] Repo grep: `rg -F '"workflow"' Backend/app/` sıfır eşleşme (yorum/docstring hariç).

### Risk Notları

- **Silent breakage riski**: Bir okuma yerini kaçırırsam, `pc.get("workflow", {})` boş dict döner, davranış sessizce değişir (e.g., `nodes=[]`, validation pas eder). Mitigasyon: **bu commit'in son adımı olarak** repo-genelinde `rg "process_config.*workflow|\.get\(['\"]workflow"`  çalıştırıp sıfır eşleşme doğrulanmalı.
- **Eski production verisi**: V0/V1 schema'lı projeler upgrade sonrasında entity load anında otomatik V2'ye normalize edilir, ama DB satırı V1 olarak kalır. **Bu kabul edilebilir** (lazy migration design intent, BACK-03/D-32). DB'de toplu güncellemeye gerek yok.
- **`apply_process_template`'da `schema_version=2` override**: Mevcut kod template uyguladığında schema_version'ı override ediyor. Eğer template'ı V1 zamanında atanmış bir projeye uygularsam, V1 normalize'dan geçer ve burada V2'ye yazılır. **Bu da OK** (re-normalize zaten idempotent).
- **Geri alma**: `git revert` ile mümkün, ama C2/C3 üzerine birikmiş olursa zincirli revert gerekir. C1 standalone revertable.

---

## C2: feat(workflow): add task_workflow placeholder to V2 schema

**Risk:** DÜŞÜK (sadece additive default field)
**Bağımlılık:** C1
**Tahmini değişiklik:** ~2 dosya, ~30 satır

### Amaç
V2 şemasına `task_workflow` boş placeholder ekle (default capabilities + boş edges/groups). Davranışsal etki YOK. Engine sınıfı C5'te task_workflow'u okumaya başlayacak.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/entities/project.py` | MODIFY | `_migrate_v1_to_v2`'ye `task_workflow` default eklenir |
| `Backend/tests/unit/application/test_process_config_normalizer.py` | MODIFY | `task_workflow` default'unu doğrulayan test eklenir |

### Detaylı Adımlar

1. **`Backend/app/domain/entities/project.py`** — `_migrate_v1_to_v2` sonuna ekle (return önce):
   ```python
   # task_workflow placeholder — engine reads it in C5+; safe default is empty.
   new.setdefault("task_workflow", {
       "capabilities": {
           "enforce_wip_limits": False,
           "initial_node_id": None,
       },
       "edges": [],
       "groups": [],
   })
   ```
   **Pitfall:** `setdefault` kullan, OVERWRITE etme — eğer bir şekilde mevcutsa korunur (idempotency).

2. **`Backend/tests/unit/application/test_process_config_normalizer.py`** — yeni test:
   ```python
   def test_v2_includes_task_workflow_placeholder():
       result = _normalize_process_config({"methodology": "SCRUM"})
       assert result["schema_version"] == 2
       assert "task_workflow" in result
       assert result["task_workflow"]["edges"] == []
       assert result["task_workflow"]["capabilities"]["enforce_wip_limits"] is False
       assert result["task_workflow"]["capabilities"]["initial_node_id"] is None

   def test_v1_to_v2_preserves_existing_task_workflow():
       """If a future caller has pre-populated task_workflow, migration doesn't clobber it."""
       v1 = {
           "schema_version": 1,
           "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []},
           "task_workflow": {"capabilities": {"enforce_wip_limits": True, "initial_node_id": "tw1"}, "edges": [{"id": "te1"}], "groups": []},
       }
       result = _normalize_process_config(v1)
       assert result["task_workflow"]["capabilities"]["enforce_wip_limits"] is True
       assert result["task_workflow"]["edges"] == [{"id": "te1"}]
   ```

### Test Stratejisi

- **Eklenecek testler:** Yukarıdaki 2 test.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_process_config_normalizer.py -v`
- **Beklenen sonuç:** 2 yeni test pas; C1'deki tüm testler hala yeşil.

### Doğrulama

- [ ] 2 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil (additive change, regression olmamalı)

### Risk Notları

- Çok düşük risk; additive shape. Geri alma: `git revert` kayıpsız.

---

## C3: test(workflow): migrate all V1 fixtures to V2 schema

**Risk:** DÜŞÜK (sadece test fixture güncellemesi, prod kodu değişmiyor)
**Bağımlılık:** C2
**Tahmini değişiklik:** ~9 dosya, ~120 satır

### Amaç
Tüm test fixture'larındaki `{"schema_version": 1, "workflow": {...}, ...}` shape'lerini `{"schema_version": 2, "phase_workflow": {... + capabilities}, "task_workflow": {...}}` şekline güncelle. C1'de eklenmiş `xfail` marker'ı kaldır. Hiçbir production kodu değişmez.

**Niye C3?** Migration sayesinde tüm V1 fixture'ları otomatik V2'ye normalize ediliyor; ama testlerdeki **assert'ler** hala `workflow` veya `enforce_wip_limits` top-level key'i okuyor. Bu assertion'ları manuel olarak V2 shape'e taşımak gerekiyor.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/tests/factories/project_factory.py` | MODIFY | `default_pc` V2 shape |
| `Backend/tests/unit/application/test_process_config_normalizer.py` | MODIFY | C1'de eklenmiş xfail kaldır, `test_v1_config_is_idempotent` artık V2 versiyonuna dönüşür (rename: `test_v2_config_is_idempotent_canonical`); `test_empty_config_fills_defaults` V2 shape kontrol eder |
| `Backend/tests/unit/application/test_phase_gate_use_case.py` | MODIFY | `_mk_project` V2 shape |
| `Backend/tests/unit/application/test_manage_phase_reports.py` | MODIFY | `_mk_project` V2 shape |
| `Backend/tests/unit/application/test_manage_milestones.py` | MODIFY | `_mk_project` V2 shape |
| `Backend/tests/integration/api/test_2tier_perm_check.py` | MODIFY | `_PROCESS_CONFIG` V2 shape |
| `Backend/tests/integration/api/test_phase_reports_api.py` | MODIFY | `_PROCESS_CONFIG` V2 shape |
| `Backend/tests/integration/api/test_milestones_api.py` | MODIFY | `_PROCESS_CONFIG` V2 shape |
| `Backend/tests/integration/api/test_projects_api_phase9.py` | MODIFY | `_PROCESS_CONFIG_WITH_NODE` V2 shape |
| `Backend/tests/integration/api/test_phase_transitions_api.py` | MODIFY | `_make_process_config` V2 shape |
| `Backend/tests/integration/test_execute_phase_transition.py` | MODIFY | `_build_use_case` V2 shape (line 167) |
| `Backend/tests/integration/api/test_project_workflow_patch.py` | MODIFY | PATCH body'leri çift-key tolerance test'i ekler |

### Detaylı Adımlar

1. **`Backend/tests/factories/project_factory.py`** — `default_pc` shape:
   ```python
   default_pc = {
       "schema_version": 2,
       "phase_workflow": {
           "mode": "flexible",
           "capabilities": {
               "enforce_wip_limits": False,
               "enforce_sequential_dependencies": False,
               "restrict_expired_sprints": False,
               "initial_node_id": "nd_SrcPhase001",
           },
           "nodes": [
               {"id": "nd_SrcPhase001", "name": "Source", "x": 0, "y": 0, "color": "#888", "is_archived": False, "is_initial": True, "is_final": False},
               {"id": "nd_TgtPhase001", "name": "Target", "x": 100, "y": 0, "color": "#888", "is_archived": False, "is_initial": False, "is_final": True},
           ],
           "edges": [{"id": "ed_1", "source": "nd_SrcPhase001", "target": "nd_TgtPhase001", "type": "flow"}],
           "groups": [],
       },
       "task_workflow": {
           "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
           "edges": [],
           "groups": [],
       },
       "phase_completion_criteria": {},
       "enable_phase_assignment": False,
       "backlog_definition": "cycle_null",
       "cycle_label": None,
   }
   ```
   (Top-level `enforce_*` flag'leri **kaldırıldı**; capabilities'in içine taşındı.)

2. **`Backend/tests/unit/application/test_process_config_normalizer.py`** —
   - C1'de eklenmiş `@pytest.mark.xfail` kaldır.
   - Mevcut `test_v1_config_is_idempotent` testini sil, yerine `test_v2_canonical_config_is_idempotent` ekle:
     ```python
     def test_v2_canonical_config_is_idempotent():
         v2 = {
             "schema_version": 2,
             "phase_workflow": {"mode": "flexible", "capabilities": {...all 4 defaults...}, "nodes": [], "edges": [], "groups": []},
             "task_workflow": {"capabilities": {"enforce_wip_limits": False, "initial_node_id": None}, "edges": [], "groups": []},
             "phase_completion_criteria": {},
             "enable_phase_assignment": True,
         }
         assert _normalize_process_config(v2) == v2
     ```
   - `test_empty_config_fills_defaults` güncelle: `assert result["schema_version"] == 2`, `assert result["phase_workflow"]["mode"] == "flexible"`, `assert "task_workflow" in result`.
   - `test_legacy_config_migrates_to_v1` adını koru ama artık V2'ye gider; asserrtion'lar V2 shape kontrol eder; veya yeni isim: `test_legacy_v0_config_migrates_to_v2`.

3. **`Backend/tests/unit/application/test_phase_gate_use_case.py`** (line 15-40 `_mk_project`):
   ```python
   process_config={
       "schema_version": 2,
       "phase_workflow": {
           "mode": mode,
           "capabilities": {"enforce_wip_limits": False, "enforce_sequential_dependencies": False, "restrict_expired_sprints": False, "initial_node_id": "nd_Src123DXYZ"},
           "nodes": nodes,
           "edges": edges,
           "groups": [],
       },
       "task_workflow": {"capabilities": {"enforce_wip_limits": False, "initial_node_id": None}, "edges": [], "groups": []},
       "phase_completion_criteria": criteria or {},
       "enable_phase_assignment": True,
   },
   ```

4. **`Backend/tests/unit/application/test_manage_phase_reports.py`** (line 13-30): Aynı pattern.

5. **`Backend/tests/unit/application/test_manage_milestones.py`** (line 15-28): Aynı pattern.

6. **`Backend/tests/integration/api/test_2tier_perm_check.py`** (line 36-60 `_PROCESS_CONFIG`): Aynı pattern.

7. **`Backend/tests/integration/api/test_phase_reports_api.py`** (line 21-36): Aynı pattern.

8. **`Backend/tests/integration/api/test_milestones_api.py`** (line 30-45): Aynı pattern.

9. **`Backend/tests/integration/api/test_projects_api_phase9.py`** (line 21-36): Aynı pattern.

10. **`Backend/tests/integration/api/test_phase_transitions_api.py`** (`_make_process_config` line 41-57): Aynı pattern.

11. **`Backend/tests/integration/test_execute_phase_transition.py`** (line 164-180 `_build_use_case`): Aynı pattern.

12. **`Backend/tests/integration/api/test_project_workflow_patch.py`** — Bu özel: PATCH body'leri client'tan geliyor, çift-key tolerance'i test etmeli. Yeni test ekle:
    ```python
    @pytest.mark.asyncio
    async def test_patch_accepts_legacy_workflow_key(authenticated_client, db_session):
        """C1 D-X: API kabul eder hem 'workflow' hem 'phase_workflow'; entity normalize eder."""
        # ... PATCH with body={"process_config": {"workflow": good_workflow}}
        # assert 200 (migration handles rename)
        # GET-after-PATCH must return phase_workflow (V2 shape)
    ```

### Test Stratejisi

- **Etkilenen mevcut testler:** Yukarıdaki 12 dosya — tümü güncellendiğinde mevcut test'ler pas etmeye devam eder.
- **Eklenecek testler:**
  1. `test_v2_canonical_config_is_idempotent` (C1'de eklenenin V2 versiyonu)
  2. `test_patch_accepts_legacy_workflow_key` (FE migration bekleyene kadar dual-key tolerance)
- **Çalıştırılacak komut:** `pytest Backend/tests/` (tam suite)
- **Beklenen sonuç:** Tüm testler yeşil; xfail kaldırıldıktan sonra 0 xfail.

### Doğrulama

- [ ] `pytest Backend/tests/` 0 fail 0 xfail
- [ ] `rg -F 'enforce_wip_limits' Backend/tests/` sıfır top-level kullanım (capabilities altında olmalı)
- [ ] `rg -F '"workflow":' Backend/tests/` sıfır (hepsi `phase_workflow` olmalı, hariç dual-key tolerance test'i)
- [ ] **C1'de eklenmiş defensive read fallback'ları kaldır** (senior review eklendi 2026-05-17):
  C1 execute sırasında 8 use case'de geçici olarak `pc.get("phase_workflow") or pc.get("workflow") or {}` eklendi (integration test'leri yeşil tutmak için). Fixture'lar V2'ye taşındıktan sonra bu fallback'lar gereksiz — sadece dual-key tolerance noise yaratır.
  Aksiyon:
  ```bash
  rg -F 'pc.get("phase_workflow") or pc.get("workflow")' Backend/app/ --type py
  ```
  Her birinde `or pc.get("workflow")` kısmını sil — yalnızca `pc.get("phase_workflow", {})` kalsın. Tek istisna: `manage_projects.py` PATCH endpoint'indeki request-boundary dual-key tolerance (bu C10'a kadar korunur).
- [ ] `pytest Backend/tests/` cleanup sonrası hala yeşil (V2 fixture'lar yeterli olmalı)

### Risk Notları

- Bir fixture'ı kaçırırsam **otomatik migration sayesinde test pas eder ama assertion FE expectation'larıyla uyumsuz kalır**. Mitigasyon: tam suite çalışması zorunlu.
- C3 standalone revertable; C1+C2'den sonra üretim kodu yeniden değişmediği için.

---

## C4: feat(board): extend BoardColumn with category/initial/terminal/duration/policy fields

**Risk:** ORTA (DB schema değişikliği — Alembic migration + entity + model)
**Bağımlılık:** C3
**Tahmini değişiklik:** ~5 dosya, ~150 satır

### Amaç
`BoardColumn` entity/DB model'ine yeni alanlar ekle: `category`, `is_initial`, `is_terminal`, `max_duration_days`, `entry_policy`, `exit_policy`. Mevcut tüm satırlar `server_default` ile null-default'lu olarak doldurulur. `wip_limit` zaten var; sadece semantic kullanımı C8'de aktifleşecek. `SeedDefaultColumnsUseCase` template-driven olmaya hazırlanır ama bu commit'te hala 5 hard-coded kolonu kullanır (C7+ veya gelecek bir commit'te değiştirilir).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/alembic/versions/013_board_column_extended.py` | CREATE | Yeni alanlar + server_default + backfill |
| `Backend/app/infrastructure/database/models/board_column.py` | MODIFY | SQLAlchemy Column'lar eklenir |
| `Backend/app/domain/entities/board_column.py` | MODIFY | Pydantic alanlar eklenir |
| `Backend/app/application/use_cases/manage_board_columns.py` | MODIFY | `_to_dto`, `CreateColumnUseCase`, `UpdateColumnUseCase`, `SeedDefaultColumnsUseCase` yeni alanları handle eder |
| `Backend/app/application/dtos/board_column_dtos.py` | MODIFY | `BoardColumnDTO`, `CreateColumnDTO`, `UpdateColumnDTO` yeni opsiyonel alanlar |

### Detaylı Adımlar

1. **`Backend/alembic/versions/013_board_column_extended.py`** — yeni migration:
   ```python
   """Phase 17 D-X: extend board_columns with workflow-engine fields.

   Revision ID: 013_board_column_extended
   Revises: 012_phase15_rbac
   Create Date: 2026-05-17
   """
   from alembic import op
   import sqlalchemy as sa

   revision = "013_board_column_extended"
   down_revision = "012_phase15_rbac"
   branch_labels = None
   depends_on = None

   def _column_exists(table_name: str, column_name: str) -> bool:
       conn = op.get_bind()
       result = conn.execute(
           sa.text(
               "SELECT COUNT(*) FROM information_schema.columns "
               "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
           ),
           {"t": table_name, "c": column_name},
       )
       return result.scalar() > 0

   _NEW_COLS = [
       ("category", sa.String(20), "todo", "Jira-style coarse bucket: todo/in_progress/done"),
       ("is_initial", sa.Boolean(), False, "True if board can start here"),
       ("is_terminal", sa.Boolean(), False, "True if column is a 'done' state"),
       ("max_duration_days", sa.Integer(), None, "Stale threshold; null = unbounded"),
       ("entry_policy", sa.String(20), "any", "Enum: any / edges_only / initial_only"),
       ("exit_policy", sa.String(20), "any", "Enum: any / edges_only / terminal_lock"),
   ]

   def upgrade() -> None:
       for name, type_, default, _comment in _NEW_COLS:
           if not _column_exists("board_columns", name):
               kwargs = {"nullable": True}  # nullable so existing rows are valid
               if default is not None:
                   kwargs["server_default"] = sa.text(repr(default).lower() if isinstance(default, bool) else f"'{default}'")
               op.add_column("board_columns", sa.Column(name, type_, **kwargs))

       # Backfill: highest order_index per project gets is_terminal=True,
       # lowest gets is_initial=True. category derived: order=0 → todo, max → done, else in_progress.
       op.execute("""
           UPDATE board_columns bc SET
               is_initial = CASE WHEN bc.order_index = (SELECT MIN(order_index) FROM board_columns WHERE project_id = bc.project_id) THEN TRUE ELSE FALSE END,
               is_terminal = CASE WHEN bc.order_index = (SELECT MAX(order_index) FROM board_columns WHERE project_id = bc.project_id) THEN TRUE ELSE FALSE END,
               category = CASE
                   WHEN bc.order_index = (SELECT MIN(order_index) FROM board_columns WHERE project_id = bc.project_id) THEN 'todo'
                   WHEN bc.order_index = (SELECT MAX(order_index) FROM board_columns WHERE project_id = bc.project_id) THEN 'done'
                   ELSE 'in_progress'
               END
           WHERE bc.is_initial IS NULL OR bc.is_terminal IS NULL OR bc.category IS NULL OR bc.category = 'todo'
       """)

   def downgrade() -> None:
       for name, *_ in reversed(_NEW_COLS):
           if _column_exists("board_columns", name):
               op.drop_column("board_columns", name)
   ```
   **Pitfall handle:**
   - `nullable=True` + `server_default` ile mevcut satırlar otomatik dolar.
   - Backfill UPDATE idempotent (WHERE clause ile sadece null'ları doldurur).
   - Downgrade kayıp veri ile gerçekleşir ama bu kabul edilebilir (yeni alanlar geri alınırsa yokmuş gibi olur).

2. **`Backend/app/infrastructure/database/models/board_column.py`**:
   ```python
   from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
   from sqlalchemy.orm import relationship
   from app.infrastructure.database.models.base import Base

   class BoardColumnModel(Base):
       __tablename__ = "board_columns"

       id = Column(Integer, primary_key=True, index=True)
       project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
       name = Column(String(50), nullable=False)
       order_index = Column(Integer, nullable=False)
       wip_limit = Column(Integer, default=0)
       # Phase 17 — workflow engine fields (migration 013)
       category = Column(String(20), nullable=True, default="todo")
       is_initial = Column(Boolean, nullable=True, default=False)
       is_terminal = Column(Boolean, nullable=True, default=False)
       max_duration_days = Column(Integer, nullable=True, default=None)
       entry_policy = Column(String(20), nullable=True, default="any")
       exit_policy = Column(String(20), nullable=True, default="any")

       project = relationship("ProjectModel", back_populates="columns")
   ```

3. **`Backend/app/domain/entities/board_column.py`**:
   ```python
   from pydantic import BaseModel, ConfigDict
   from typing import Optional, Literal

   ColumnCategory = Literal["todo", "in_progress", "done"]
   EntryPolicy = Literal["any", "edges_only", "initial_only"]
   ExitPolicy = Literal["any", "edges_only", "terminal_lock"]

   class BoardColumn(BaseModel):
       id: Optional[int] = None
       project_id: Optional[int] = None
       name: str
       order_index: int
       wip_limit: int = 0
       # Phase 17 — workflow engine fields
       category: ColumnCategory = "todo"
       is_initial: bool = False
       is_terminal: bool = False
       max_duration_days: Optional[int] = None
       entry_policy: EntryPolicy = "any"
       exit_policy: ExitPolicy = "any"

       model_config = ConfigDict(from_attributes=True)
   ```

4. **`Backend/app/application/dtos/board_column_dtos.py`** — yeni opsiyonel alanlar PATCH/CREATE'e:
   - `CreateColumnDTO` ve `UpdateColumnDTO`'ya `category`, `is_initial`, `is_terminal`, `max_duration_days`, `entry_policy`, `exit_policy` ekle (hepsi Optional[...] = None).
   - `BoardColumnDTO`'ya aynısını ekle (default değerlerle).

5. **`Backend/app/application/use_cases/manage_board_columns.py`**:
   - `_to_dto` (line 13-21): yeni alanları DTO'ya geçir.
   - `CreateColumnUseCase.execute` (line 41-58): `dto.category or "todo"`, vb. atayarak `BoardColumn` oluştur.
   - `UpdateColumnUseCase.execute` (line 65-83): patch'te yeni alanlar `dto.x if dto.x is not None else existing.x`.
   - `SeedDefaultColumnsUseCase.execute` (line 129-141): default kolon listesini güncelle ki son kolon `is_terminal=True`, ilk kolon `is_initial=True`:
     ```python
     DEFAULT_COLUMNS = [
         {"name": "Backlog", "category": "todo", "is_initial": True, "is_terminal": False},
         {"name": "Todo", "category": "todo", "is_initial": False, "is_terminal": False},
         {"name": "In Progress", "category": "in_progress", "is_initial": False, "is_terminal": False},
         {"name": "In Review", "category": "in_progress", "is_initial": False, "is_terminal": False},
         {"name": "Done", "category": "done", "is_initial": False, "is_terminal": True},
     ]
     ```
     Loop güncellenir: kolon oluştururken `category=spec["category"]`, `is_initial=spec["is_initial"]`, `is_terminal=spec["is_terminal"]`.

### Test Stratejisi

- **Etkilenen mevcut testler:**
  - `Backend/tests/integration/api/test_board_columns_api.py` (varsa) — DTO yeni alanları kabul eder mi?
  - `Backend/tests/unit/application/test_manage_board_columns.py` (varsa) — `_to_dto` ve `SeedDefaultColumnsUseCase` testleri.
  - `Backend/tests/integration/test_seeder.py` — seed sonrası DB'de yeni kolon alanları doğru dolmuş mu?

- **Eklenecek testler:**
  1. `test_seed_default_columns_sets_is_initial_on_first` — `SeedDefaultColumnsUseCase` sonucunda `Backlog.is_initial=True` ve `Done.is_terminal=True`.
  2. `test_create_column_with_category_field` — POST `/columns` body'sinde `category="in_progress"` gönderilince DB satırı `category='in_progress'`.
  3. `test_patch_column_max_duration_days` — PATCH'le `max_duration_days=14` set edilince GET'te döner.
  4. `test_migration_013_backfills_first_column_is_initial` (integration) — migration sonrası mevcut bir projenin ilk kolonu `is_initial=True` olur.

- **Çalıştırılacak komut:**
  ```
  cd Backend && alembic upgrade head  # 013 uygulanır
  pytest Backend/tests/ -v
  cd Backend && alembic downgrade -1   # 013 geri alınır
  cd Backend && alembic upgrade head   # idempotency
  ```

- **Beklenen sonuç:** 4 yeni test pas; alembic upgrade/downgrade/upgrade idempotent.

### Doğrulama

- [ ] `alembic upgrade head` başarılı (013 uygulanır)
- [ ] `psql -c "\d board_columns"` — 6 yeni kolon listede
- [ ] Mevcut satırlar için `SELECT category, is_initial, is_terminal FROM board_columns LIMIT 5` — tüm satırlar dolmuş
- [ ] `alembic downgrade -1` başarılı (013 geri alınır, hata vermez)
- [ ] `alembic upgrade head` tekrar başarılı (idempotency)
- [ ] `pytest Backend/tests/` tam suite yeşil

### Risk Notları

- **`_column_exists` guard** ile migration tekrar uygulanabilir (idempotent). Ama yeni Boolean alanlar için PostgreSQL `BOOLEAN DEFAULT FALSE` sözdizimine dikkat — `server_default=sa.text("false")` doğru kullanım (lowercase, single-quoted).
- **Production'da uzun süre sonra apply olursa**: `UPDATE board_columns ...` backfill query'si tüm satırları taradığı için lock alır. Küçük data set'ler için problem yok (proje başına 5-10 kolon, toplam <10K satır beklenir).
- **Downgrade veri kaybı**: Kabul edilebilir; downgrade sadece geliştirme/test ortamında kullanılır.

---

## C5: feat(workflow): introduce WorkflowEngine domain service

**Risk:** DÜŞÜK (yeni dosya, henüz hiçbir use case kullanmıyor)
**Bağımlılık:** C4
**Tahmini değişiklik:** ~3 dosya, ~250 satır

### Amaç
`app/domain/services/workflow_engine.py` içine `WorkflowEngine` sınıfını oluştur. Pure logic, hiçbir DB/HTTP import'u yok. Constructor injection ile `phase_workflow` veya `task_workflow` config + project_columns geçirilir. State-less; her use case kendi engine instance'ını oluşturur. Bu commit **sadece engine'i yaratır ve unit testlerle doğrular** — hiçbir use case henüz kullanmaz (C6+).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/services/workflow_engine.py` | CREATE | `WorkflowEngine` sınıfı |
| `Backend/app/domain/services/__init__.py` | MODIFY | (varsa) export ekle |
| `Backend/app/application/dtos/workflow_dtos.py` | MODIFY | `WorkflowEdge`'e `is_any_gate: bool = False` field eklenir (senior review #2 RESOLVED — engine okumadan önce DTO genişler) |
| `Backend/tests/unit/domain/test_workflow_engine.py` | CREATE | Engine unit testleri |

### Detaylı Adımlar

1. **`Backend/app/domain/services/workflow_engine.py`** — yeni dosya:
   ```python
   """Workflow Engine — JSON-driven procedural lifecycle (Q1-Q5 in workflow-engine-design.md).

   Pure domain service: ZERO infrastructure imports. Consumers (use cases) instantiate
   per-call with the relevant workflow + columns, then call methods.

   The engine handles two workflows in one project:
       - `phase_workflow` — coarse SDLC phases (Requirements → Design → ...)
       - `task_workflow` — fine-grained kanban columns
   Both share the same JSON shape and engine method surface.
   """
   from typing import List, Optional, Tuple
   from app.domain.entities.board_column import BoardColumn


   class WorkflowEngine:
       """State-less engine — instantiate per call with workflow config + columns.

       Args:
           workflow: process_config['phase_workflow'] or process_config['task_workflow'] dict.
               Must contain {capabilities, nodes?, edges, groups?}. May be None / empty.
           columns: ordered list of BoardColumn entities for the project (task_workflow).
               For phase_workflow, pass [] — phase nodes live inside workflow['nodes'].
       """

       def __init__(
           self,
           workflow: Optional[dict],
           columns: Optional[List[BoardColumn]] = None,
       ):
           self._wf = workflow or {}
           self._cols = columns or []
           self._caps = (self._wf.get("capabilities") or {})
           self._edges = self._wf.get("edges") or []
           # Build lookups
           self._cols_by_id = {c.id: c for c in self._cols}
           self._cols_by_name = {c.name.lower(): c for c in self._cols}

       # ---------- Capability queries ----------

       def cap(self, name: str, default=False):
           """Read a capability flag (enforce_wip_limits, enforce_sequential_dependencies, ...)."""
           return self._caps.get(name, default)

       # ---------- Node / Column queries ----------

       def is_terminal(self, column_or_node) -> bool:
           """True if the given column/node is in a 'done' state.

           Resolution order:
             1. If passed a BoardColumn entity with .is_terminal True → True.
             2. If passed a BoardColumn entity, look up max(order_index) → True if matches.
             3. If passed a dict (phase node) with .is_terminal or .is_final → True.
           """
           if column_or_node is None:
               return False
           # BoardColumn entity path
           if hasattr(column_or_node, "is_terminal"):
               if column_or_node.is_terminal:
                   return True
               # Backfill fallback: highest order_index is terminal
               if self._cols:
                   max_order = max(c.order_index for c in self._cols)
                   return column_or_node.order_index == max_order
               return False
           # Dict path (phase node)
           if isinstance(column_or_node, dict):
               return bool(
                   column_or_node.get("is_terminal")
                   or column_or_node.get("is_final")
               )
           return False

       def is_initial(self, column_or_node) -> bool:
           """True if the given column/node is the start state."""
           if column_or_node is None:
               return False
           if hasattr(column_or_node, "is_initial"):
               if column_or_node.is_initial:
                   return True
               if self._cols:
                   min_order = min(c.order_index for c in self._cols)
                   return column_or_node.order_index == min_order
               return False
           if isinstance(column_or_node, dict):
               return bool(column_or_node.get("is_initial"))
           return False

       def get_terminal_columns(self) -> List[BoardColumn]:
           """All terminal columns in the project (1 or more, depending on workflow)."""
           return [c for c in self._cols if self.is_terminal(c)]

       def get_initial_columns(self) -> List[BoardColumn]:
           return [c for c in self._cols if self.is_initial(c)]

       # ---------- Transition queries ----------

       def can_move(self, from_id, to_id) -> Tuple[bool, Optional[str]]:
           """Check if a transition from from_id → to_id is allowed.

           Returns (allowed, reason_if_not).

           Allowance rules:
             - Direct edge exists: source=from_id, target=to_id  → allowed
             - bidirectional edge: target=from_id, source=to_id, bidirectional=True → allowed
             - is_all_gate edge: target=to_id, is_all_gate=True → allowed from any source
             - is_any_gate edge: source=from_id, is_any_gate=True → allowed to any target
             - If exit_policy of from_node is 'any' → allowed (bypass edge check)
             - Otherwise denied
           """
           if from_id == to_id:
               return True, None  # no-op move always allowed

           # Resolve from_node exit_policy
           from_node = self._lookup(from_id)
           if from_node is not None:
               exit_pol = self._policy(from_node, "exit_policy", default="any")
               if exit_pol == "any":
                   return True, None
               if exit_pol == "terminal_lock" and self.is_terminal(from_node):
                   return False, f"Source node {from_id} is terminal and exit_policy=terminal_lock"

           # Direct edge
           if any(self._edge_match(e, from_id, to_id) for e in self._edges):
               return True, None
           # Bidirectional reverse
           if any(
               self._edge_match(e, to_id, from_id) and e.get("bidirectional")
               for e in self._edges
           ):
               return True, None
           # is_all_gate
           if any(
               e.get("is_all_gate") and self._edge_target(e) == to_id
               for e in self._edges
           ):
               return True, None
           # is_any_gate
           if any(
               e.get("is_any_gate") and self._edge_source(e) == from_id
               for e in self._edges
           ):
               return True, None

           return False, f"No edge connects {from_id} → {to_id}"

       # ---------- WIP enforcement ----------

       def check_wip(self, column: BoardColumn, current_count: int) -> Tuple[bool, Optional[str]]:
           """Returns (allowed, reason).

           Allowed if:
             - capability `enforce_wip_limits` is False (engine disabled), OR
             - column.wip_limit is 0 / None (no limit), OR
             - current_count < column.wip_limit
           """
           if not self.cap("enforce_wip_limits"):
               return True, None
           limit = column.wip_limit or 0
           if limit <= 0:
               return True, None
           if current_count >= limit:
               return False, f"WIP limit {limit} reached for column '{column.name}' ({current_count} tasks)"
           return True, None

       # ---------- Staleness (Q4 — read-time) ----------

       def is_stale(self, column: BoardColumn, last_transition_at, now) -> bool:
           """True if (now - last_transition_at) > column.max_duration_days."""
           if column.max_duration_days is None or column.max_duration_days <= 0:
               return False
           if last_transition_at is None:
               return False
           delta_days = (now - last_transition_at).days
           return delta_days > column.max_duration_days

       # ---------- Private helpers ----------

       def _lookup(self, id_):
           # Try BoardColumn (id is int)
           if isinstance(id_, int):
               return self._cols_by_id.get(id_)
           # Try phase_workflow nodes (id is str)
           if isinstance(id_, str):
               for n in (self._wf.get("nodes") or []):
                   if n.get("id") == id_:
                       return n
           return None

       @staticmethod
       def _policy(node_or_col, key, default):
           if hasattr(node_or_col, key):
               return getattr(node_or_col, key)
           if isinstance(node_or_col, dict):
               return node_or_col.get(key, default)
           return default

       @staticmethod
       def _edge_match(edge: dict, from_id, to_id) -> bool:
           return WorkflowEngine._edge_source(edge) == from_id and WorkflowEngine._edge_target(edge) == to_id

       @staticmethod
       def _edge_source(edge: dict):
           # Phase 12 edges use 'source', some use 'from' (V2 design)
           return edge.get("source") or edge.get("from")

       @staticmethod
       def _edge_target(edge: dict):
           return edge.get("target") or edge.get("to")
   ```

2. **`Backend/app/domain/services/__init__.py`** — eğer file varsa, export ekle. Yoksa boş bırak (Python implicit package).

3. **`Backend/tests/unit/domain/test_workflow_engine.py`** — yeni test dosyası:
   - `test_is_terminal_via_column_flag` — BoardColumn(is_terminal=True) → True.
   - `test_is_terminal_via_order_index_fallback` — backfill-style: max(order_index) → True, diğer kolonlar False.
   - `test_is_terminal_via_phase_node_dict` — `{"id": "n1", "is_final": True}` → True.
   - `test_can_move_direct_edge_allowed` — edge `n1→n2` varsa `can_move("n1","n2")==(True, None)`.
   - `test_can_move_no_edge_denied` — edge yoksa `(False, "No edge...")`.
   - `test_can_move_bidirectional_reverse` — edge `n1→n2 bidirectional=True`, `can_move("n2","n1")==(True, None)`.
   - `test_can_move_is_all_gate` — edge `(_, "n5", is_all_gate=True)`; herhangi source'tan `can_move("nX","n5")==(True, None)`.
   - `test_can_move_is_any_gate` — yeni; edge `("n1", _, is_any_gate=True)` → `can_move("n1","nX")==(True, None)`.
   - `test_can_move_exit_policy_any_bypasses_edge_check` — `from_node.exit_policy="any"` → herhangi target için allowed.
   - `test_can_move_exit_policy_terminal_lock_blocks_terminal_source` — terminal kolon + `exit_policy=terminal_lock` → denied.
   - `test_check_wip_disabled_when_capability_off` — `enforce_wip_limits=False` → her zaman allowed.
   - `test_check_wip_blocks_at_limit` — wip_limit=3, current=3 → (False, reason).
   - `test_check_wip_allows_under_limit` — wip_limit=3, current=2 → (True, None).
   - `test_check_wip_unlimited_when_zero` — wip_limit=0 → (True, None) regardless of count.
   - `test_is_stale_returns_false_when_no_max_duration` — None → False.
   - `test_is_stale_returns_true_when_overdue` — max_duration=7, last_transition=10 days ago → True.

### Test Stratejisi

- **Eklenecek testler:** Yukarıdaki 14 test.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/domain/test_workflow_engine.py -v`
- **Beklenen sonuç:** 14 yeni test pas; tam suite hala yeşil (engine henüz hiç kullanılmıyor, regression yok).

### Doğrulama

- [ ] 14 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite hala yeşil
- [ ] `rg "import sqlalchemy|from app.infrastructure" Backend/app/domain/services/workflow_engine.py` — sıfır eşleşme (CLAUDE.md DIP)

### Risk Notları

- **Yeni domain dosyası**, hiç use case bağlamadan önce eklendiği için risk minimum.
- **Future-proofing:** `_edge_source` `'from'` ve `'source'`'i ikisi de okur. Şu anki edge'ler `'source'/'target'` kullanıyor (Phase 12), ama design.md (Bölüm 4) `'from'/'to'` kullanıyor. Forward compatibility için ikisi de desteklenir.

---

## C6: refactor(tasks): map_task_to_response_dto uses WorkflowEngine.is_terminal()

**Risk:** DÜŞÜK (read-time computation; behavior identical to existing order_index logic)
**Bağımlılık:** C5
**Tahmini değişiklik:** ~2 dosya, ~30 satır

### Amaç
İlk Strangler adımı: `map_task_to_response_dto` içindeki hard-coded `max(order_index)` mantığını `WorkflowEngine.is_terminal(column)` ile değiştir. **Davranış aynen kalır** (engine fallback'i de order_index kullanır, ama artık `is_terminal=True` flag'ini de tanır). En küçük, en güvenli Strangler.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/use_cases/manage_tasks.py` | MODIFY | `map_task_to_response_dto` (line 24-125) engine'i kullanır |
| `Backend/tests/unit/application/test_manage_tasks.py` | MODIFY (varsa) / CREATE | is_done = engine.is_terminal() assertion eklenir |

### Detaylı Adımlar

1. **`Backend/app/application/use_cases/manage_tasks.py`** — `map_task_to_response_dto` (line 24-46):
   - Mevcut:
     ```python
     is_done = False
     if task.column:
         status_slug = task.column.name.lower()
         if task.project and task.project.columns:
             max_order = max(
                 (getattr(c, "order_index", 0) for c in task.project.columns),
                 default=0,
             )
             is_done = task.column.order_index == max_order
     ```
   - Yeni:
     ```python
     from app.domain.services.workflow_engine import WorkflowEngine  # top of file

     # ...
     is_done = False
     if task.column:
         status_slug = task.column.name.lower()
         # Engine handles both is_terminal flag (post-migration 013) and
         # order_index fallback (legacy backfilled rows).
         engine = WorkflowEngine(
             workflow=(task.project.process_config or {}).get("task_workflow") if task.project else None,
             columns=(task.project.columns if task.project else []) or [],
         )
         is_done = engine.is_terminal(task.column)
     ```
   - **Pitfall:** `task.project` None olabilir (orphan task). Bu durumda `is_done=False` kalır (mevcut davranış).

2. **`Backend/tests/unit/application/test_manage_tasks.py`** (varsa) veya yeni:
   - Test 1: `test_map_task_to_response_dto_uses_is_terminal_flag` — task.column.is_terminal=True → is_done=True.
   - Test 2: `test_map_task_to_response_dto_falls_back_to_order_index` — backfilled DB satırı (is_terminal=None ama max order_index) → is_done=True.
   - Test 3: `test_map_task_to_response_dto_done_false_when_not_terminal` — orta kolon → False.

### Test Stratejisi

- **Etkilenen mevcut testler:**
  - `test_manage_tasks.py` (varsa) — `is_done` ile ilgili tüm assertion'lar engine üzerinden geçer.
  - Frontend2 task DTO consumer testleri (FE) bu commit'ten etkilenmez (sadece backend).
- **Eklenecek testler:** Yukarıdaki 3.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_manage_tasks.py Backend/tests/integration/`
- **Beklenen sonuç:** Yeni testler pas; mevcut testler regression yok.

### Doğrulama

- [ ] 3 yeni test yeşil
- [ ] `grep -n "max_order\|order_index == max" Backend/app/application/use_cases/manage_tasks.py` — sıfır eşleşme (hard-coded mantık kaldı mı diye)
- [ ] `pytest Backend/tests/` tam suite yeşil

### Risk Notları

- **Backfill koşulu (C4 migration)**: Eğer C4 migration uygulanmadıysa, `task.column.is_terminal` mevcut değildir → engine `hasattr` check'i ile guard'lar, fallback order_index kullanılır. Yani **migration sırası kritik değil** (C4 sonra çalışsa bile engine güvenli).
- **`process_config` None tolerance**: engine None workflow ile başlayabilir; tüm metod'lar guard'lı.

---

## C7: feat(tasks): edge validation on column move via WorkflowEngine.can_move()

**Risk:** ORTA (Kanban board move davranışı değişir — ilk görünür davranış değişikliği)
**Bağımlılık:** C6
**Tahmini değişiklik:** ~3 dosya, ~80 satır

### Amaç
`UpdateTaskUseCase.execute` içinde, eğer `dto.column_id` değişiyorsa, engine ile `can_move(from_id, to_id)` çağrısı yap. Edge yoksa 400 dön (`InvalidColumnMoveError`). **Sadece `task_workflow.capabilities.enforce_sequential_dependencies=True` veya `from_node.exit_policy != "any"` ise enforce et** (mevcut projeler için graceful degradation). Default kapalı.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/exceptions.py` | MODIFY | `InvalidColumnMoveError` eklenir |
| `Backend/app/application/use_cases/manage_tasks.py` | MODIFY | `UpdateTaskUseCase.execute` (line 227-268) engine.can_move() çağırır |
| `Backend/app/api/v1/tasks.py` (veya equivalent) | MODIFY | `InvalidColumnMoveError` → HTTP 400 mapping |
| `Backend/tests/unit/application/test_manage_tasks.py` | MODIFY/CREATE | can_move enforcement testleri |

### Detaylı Adımlar

1. **`Backend/app/domain/exceptions.py`** — yeni exception:
   ```python
   class InvalidColumnMoveError(Exception):
       """Raised when WorkflowEngine.can_move() returns False for a board move."""
       def __init__(self, from_id, to_id, reason: str):
           self.from_id = from_id
           self.to_id = to_id
           self.reason = reason
           super().__init__(f"Invalid column move {from_id} → {to_id}: {reason}")
   ```

2. **`Backend/app/application/use_cases/manage_tasks.py`** — `UpdateTaskUseCase.execute` (line 227-268), `dto.column_id is not None` bloğunun sonuna ekle:
   ```python
   # Phase 17 D-X — engine-driven edge validation
   from app.domain.services.workflow_engine import WorkflowEngine
   from app.domain.exceptions import InvalidColumnMoveError

   if dto.column_id is not None and existing_task.column_id != dto.column_id:
       engine = WorkflowEngine(
           workflow=(project.process_config or {}).get("task_workflow"),
           columns=project.columns or [],
       )
       # Senior review (2026-05-17): only enforce when the capability is explicitly
       # enabled. Column-level exit_policy fallback was rejected — it produced
       # non-deterministic behavior (one column changing exit_policy aktif eder all
       # validation). Capability flag is the single source of truth.
       if engine.cap("enforce_sequential_dependencies"):
           ok, reason = engine.can_move(existing_task.column_id, dto.column_id)
           if not ok:
               raise InvalidColumnMoveError(
                   from_id=existing_task.column_id,
                   to_id=dto.column_id,
                   reason=reason or "edge missing",
               )
   ```

3. **`Backend/app/api/v1/tasks.py`** — `update_task` endpoint'inde try/except:
   ```python
   except InvalidColumnMoveError as e:
       raise HTTPException(status_code=400, detail={
           "error_code": "INVALID_COLUMN_MOVE",
           "from_column_id": e.from_id,
           "to_column_id": e.to_id,
           "reason": e.reason,
       })
   ```
   (Routes'un tam path'i `Backend/app/api/v1/tasks.py` veya benzer; PATCH endpoint'i için bağlama göre)

4. **`Backend/tests/unit/application/test_manage_tasks.py`** — yeni testler:
   - `test_update_task_move_allowed_when_engine_disabled` — default: enforce_sequential_dependencies=False ve tüm exit_policy="any" → herhangi column'a move OK.
   - `test_update_task_move_denied_when_no_edge_and_engine_enabled` — capability True + edges arasında source→target yok → InvalidColumnMoveError raise.
   - `test_update_task_move_allowed_with_direct_edge` — edge varsa OK.
   - `test_update_task_move_allowed_with_bidirectional_edge` — reverse edge bidirectional=True → OK.
   - `test_update_task_move_same_column_noop_allowed` — column_id değişmiyor → engine çağrılmıyor (no exception).

### Test Stratejisi

- **Etkilenen mevcut testler:**
  - Mevcut `UpdateTaskUseCase` testleri — hepsi `enforce_sequential_dependencies=False` ve `exit_policy="any"` default'lu fixture kullandığı için **regression yok**.
- **Eklenecek testler:** 5 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_manage_tasks.py -v`
- **Beklenen sonuç:** 5 yeni pas; mevcut hep yeşil.

### Doğrulama

- [ ] 5 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite — Kanban board move regression yok (her yerde default capabilities)
- [ ] Manuel: Bir projeye `task_workflow.capabilities.enforce_sequential_dependencies=True` koy ve UI'dan illegal move dene → 400 alınmalı

### Risk Notları

- **Davranış değişiminin görünür olduğu ilk commit**. Default kapalı olduğu için production'da hiçbir kullanıcıyı etkilemez; ama bir kullanıcı capability'i UI'da açarsa hemen aktive olur. **Bu kabul edilebilir** — workflow editörünün varlık sebebi bu.
- **Pitfall:** `engine.can_move` `from_id=None` durumunu handle etmeli. Mevcut implementation `_lookup(None)` → None döner → exit_policy="any" default → True döner. Test edilmesi gerekir.
- **Geri alma**: Commit revert + downstream commit'leri silmek gerekir (C8 bu commit'in altyapısını kullanır). Tek başına revertable.

---

## C8: feat(tasks): WIP limit enforcement via WorkflowEngine.check_wip()

**Risk:** ORTA (Kanban WIP limit etkisi — daha önce hiç enforce edilmiyordu)
**Bağımlılık:** C7
**Tahmini değişiklik:** ~3 dosya, ~70 satır

### Amaç
`UpdateTaskUseCase` task'ı yeni bir kolona taşırken, hedef kolonun WIP limit'i dolu mu kontrol et. `task_workflow.capabilities.enforce_wip_limits=True` ise enforce et, yoksa pass. `WipLimitExceededError` yeni domain exception → HTTP 409.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/exceptions.py` | MODIFY | `WipLimitExceededError` eklenir |
| `Backend/app/application/use_cases/manage_tasks.py` | MODIFY | `UpdateTaskUseCase.execute` engine.check_wip() çağırır |
| `Backend/app/domain/repositories/board_column_repository.py` | MODIFY (varsa) | `count_tasks` zaten var (line 32 manage_board_columns.py); kullan |
| `Backend/app/api/v1/tasks.py` | MODIFY | `WipLimitExceededError` → HTTP 409 mapping |
| `Backend/tests/unit/application/test_manage_tasks.py` | MODIFY | WIP enforcement testleri |

### Detaylı Adımlar

1. **`Backend/app/domain/exceptions.py`**:
   ```python
   class WipLimitExceededError(Exception):
       """Raised when moving a task into a column would exceed wip_limit."""
       def __init__(self, column_id, column_name, limit, current):
           self.column_id = column_id
           self.column_name = column_name
           self.limit = limit
           self.current = current
           super().__init__(f"WIP limit {limit} reached for '{column_name}' ({current} tasks)")
   ```

2. **`Backend/app/application/use_cases/manage_tasks.py`** — `UpdateTaskUseCase.execute`, C7 bloğundan SONRA:
   ```python
   from app.domain.exceptions import WipLimitExceededError

   # Phase 17 D-X — WIP enforcement
   if dto.column_id is not None and existing_task.column_id != dto.column_id:
       engine = WorkflowEngine(
           workflow=(project.process_config or {}).get("task_workflow"),
           columns=project.columns or [],
       )
       if engine.cap("enforce_wip_limits"):
           target_col = next((c for c in project.columns or [] if c.id == dto.column_id), None)
           if target_col is not None:
               # Count current tasks in target column (excluding this task — it's moving in)
               current_count = await self.task_repo.count_tasks_in_column(dto.column_id, exclude_task_id=task_id)
               ok, reason = engine.check_wip(target_col, current_count)
               if not ok:
                   raise WipLimitExceededError(
                       column_id=target_col.id,
                       column_name=target_col.name,
                       limit=target_col.wip_limit,
                       current=current_count,
                   )
   ```
   - **Repository ek metod gerekli:** `ITaskRepository.count_tasks_in_column(column_id, exclude_task_id=None) -> int`. Mevcut `count_tasks` (`IBoardColumnRepository`) var ama exclude desteklemiyor; task_repo'ya yeni method ekle:
     - `Backend/app/domain/repositories/task_repository.py`: abstract `count_tasks_in_column(self, column_id: int, exclude_task_id: int | None = None) -> int`
     - `Backend/app/infrastructure/database/repositories/task_repo.py`: implement: `SELECT COUNT(*) FROM tasks WHERE column_id=:c AND is_deleted=False AND (id != :exclude OR :exclude IS NULL)`

3. **`Backend/app/api/v1/tasks.py`**:
   ```python
   except WipLimitExceededError as e:
       raise HTTPException(status_code=409, detail={
           "error_code": "WIP_LIMIT_EXCEEDED",
           "column_id": e.column_id,
           "column_name": e.column_name,
           "limit": e.limit,
           "current": e.current,
       })
   ```

4. **`Backend/tests/unit/application/test_manage_tasks.py`** — yeni testler:
   - `test_wip_enforced_blocks_when_full` — wip_limit=2, current=2 → WipLimitExceededError.
   - `test_wip_disabled_when_capability_off` — enforce_wip_limits=False → unlimited.
   - `test_wip_zero_means_unlimited` — limit=0 + capability=True → OK.
   - `test_wip_excludes_self_when_moving_within` — task X kolon A'da, kolon A'ya tekrar move (no-op) → engine çağrılmaz.

### Test Stratejisi

- **Etkilenen mevcut testler:** Mevcut update task testleri default capability=False ile çalıştığı için regression yok.
- **Eklenecek testler:** 4 yeni + `count_tasks_in_column` repository testi (1).
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_manage_tasks.py Backend/tests/unit/infrastructure/ -v`
- **Beklenen sonuç:** 5 yeni pas; mevcut yeşil.

### Doğrulama

- [ ] 5 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil
- [ ] Manuel: capability açık + dolu kolon → 409 dönmeli; capability kapalı → her zaman 200.

### Risk Notları

- **N+1 query riski**: Her task move'da bir `COUNT(*)` ek query. Düşük etkisi (board move sık değil); ama unutmamak gerek.
- **Yeni `count_tasks_in_column` repository metodu** ekleniyor; mevcut `count_tasks` (board_column_repo) ile çakışma yok (farklı repo).
- **Geri alma**: Tek başına revertable.

---

## C9: feat(tasks): recurring task trigger uses WorkflowEngine.is_terminal()

**Risk:** DÜŞÜK (recurring task'lar görece az; hard-coded string-match zaten ham)
**Bağımlılık:** C8
**Tahmini değişiklik:** ~2 dosya, ~30 satır

### Amaç
`UpdateTaskUseCase` line 263-266'daki recurring trigger mantığını (`new_column_name.lower().strip() in ("done", "completed", "closed")`) `WorkflowEngine.is_terminal(target_column)` ile değiştir. Bunu yaparken `task_workflow.capabilities.has_recurring` (yeni capability, default True) flag'i ekle — projeler recurring task'ı tamamen disable edebilsin.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/use_cases/manage_tasks.py` | MODIFY | Line 262-266 engine.is_terminal() çağırır |
| `Backend/app/domain/entities/project.py` | MODIFY | `_migrate_v1_to_v2` task_workflow.capabilities.has_recurring=True default ekler (idempotent) |
| `Backend/tests/unit/application/test_manage_tasks.py` | MODIFY | Recurring trigger testleri (terminal flag bazlı) |

### Detaylı Adımlar

1. **`Backend/app/domain/entities/project.py`** — `_migrate_v1_to_v2`, task_workflow capabilities default'una `has_recurring: True` ekle (idempotent setdefault):
   ```python
   new.setdefault("task_workflow", {
       "capabilities": {
           "enforce_wip_limits": False,
           "has_recurring": True,  # <- yeni
           "initial_node_id": None,
       },
       "edges": [],
       "groups": [],
   })
   ```
   **Pitfall:** Eğer projeler C1'den sonra `task_workflow` ile yaratıldıysa (`has_recurring` olmadan), normalize tekrar çalıştığında `setdefault` çalışmaz — çünkü `task_workflow` zaten var. **Çözüm:** Helper ekle:
   ```python
   tw = new.setdefault("task_workflow", {...full default...})
   if isinstance(tw, dict):
       tw.setdefault("capabilities", {})
       tw["capabilities"].setdefault("has_recurring", True)
   ```

2. **`Backend/app/application/use_cases/manage_tasks.py`** — `UpdateTaskUseCase.execute` line 262-266:
   - Mevcut:
     ```python
     if new_column_name is not None and existing_task.is_recurring:
         status_changed_to_done = new_column_name.lower().strip() in ("done", "completed", "closed")
         if status_changed_to_done and _check_recurrence_should_continue(existing_task):
             await _create_next_recurrence_instance(existing_task, self.task_repo)
     ```
   - Yeni:
     ```python
     if existing_task.is_recurring and dto.column_id is not None:
         engine = WorkflowEngine(
             workflow=(project.process_config or {}).get("task_workflow"),
             columns=project.columns or [],
         )
         if engine.cap("has_recurring", default=True):
             # Find the target column entity
             target_col = next((c for c in project.columns or [] if c.id == dto.column_id), None)
             if target_col is not None and engine.is_terminal(target_col):
                 if _check_recurrence_should_continue(existing_task):
                     await _create_next_recurrence_instance(existing_task, self.task_repo)
     ```

3. **`Backend/tests/unit/application/test_manage_tasks.py`** — yeni testler:
   - `test_recurring_triggers_on_is_terminal_column` — terminal kolon (custom name "Tamamlandı") → next instance oluşur.
   - `test_recurring_does_not_trigger_on_non_terminal` — orta kolon → next instance oluşmaz.
   - `test_recurring_disabled_when_has_recurring_off` — capability=False → asla tetiklenmez.
   - `test_recurring_legacy_done_column_still_works` — backfilled (is_terminal=None, order=max) → engine fallback triger.

### Test Stratejisi

- **Etkilenen mevcut testler:** Mevcut recurring testleri "Done" string'li kolonla yazılmış olabilir → hala pas eder (default kolon "Done" is_terminal=True, C4 backfill).
- **Eklenecek testler:** 4 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_manage_tasks.py -k recurring -v`
- **Beklenen sonuç:** 4 yeni pas; mevcut yeşil.

### Doğrulama

- [ ] 4 yeni test yeşil
- [ ] `grep -n 'in ("done", "completed", "closed")' Backend/app/application/use_cases/manage_tasks.py` — sıfır eşleşme (hard-coded string-match kaldırıldı)
- [ ] `pytest Backend/tests/` tam suite yeşil

### Risk Notları

- **`has_recurring` yeni capability**: Mevcut projeler için default True, davranış değişmez. UI'da kapatma seçeneği gelmesi gerekir (Wave 2 task).
- **Geri alma**: Tek başına revertable.

---

## Genel Risk Değerlendirmesi

- **En riskli commit:** **C1**. Sebep:
  1. 14 backend dosyasında manuel rename — kaçırılan herhangi biri silent breakage (`pc.get("workflow", {})` boş dict döner).
  2. Frontend2'de 30+ referans yeniden adlandırılması C1 kapsamı dışında bırakıldı (`workflow → phase_workflow`); FE update edilmedikçe FE eski isimle gönderir ama backend yeni isimle bekler → FE-side validation hatası.
  3. Mitigasyon: `manage_projects.py`'de dual-key tolerance (FE eski isim göndermeye devam edebilir, backend her ikisini de kabul eder).

- **En kolay rollback:** **C5** — sadece yeni dosyalar ekliyor, hiçbir use case değişmiyor. `git revert` ile kayıpsız.

- **Eğer yarıda durulursa stable state'ler:**
  - **C3 sonrası:** V2 schema tamamen yerleşmiş; tüm test'ler yeşil. Engine yok ama merge edilebilir.
  - **C5 sonrası:** Engine var ama kullanılmıyor; hiçbir davranış değişmiş değil. Merge edilebilir.
  - **C7 sonrası:** Phase 1 Strangler (is_terminal + edge validation) — default kapalı, görünür değişiklik yok. Merge edilebilir.

- **Migration sırası kritik mi?** **Hayır** — C4 (DB alembic) C6'dan önce gelmeli ama `WorkflowEngine.is_terminal` `hasattr(col, "is_terminal")` ile guard'lı olduğu için C4'siz de çalışır (fallback order_index). Yine de önerilen sıra: C4 → C5 → C6.

---

## Açık Sorular — Senior Review Cevapları (2026-05-17)

Plan yazıldıktan sonra senior architect şu cevapları sabitledi:

1. **`has_recurring` capability default**: **RESOLVED — `True`**. Mevcut davranış korunur, regression yok. UI'da kapatma seçeneği Wave 2 task.

2. **`WorkflowEdge.is_any_gate` Pydantic field timing**: **RESOLVED — C5'te eklenecek**. Engine kullanmadan önce DTO genişler; C1 sadece schema migration kapsamı, edge field genişlemesi engine ile aynı commit'te mantıklı.

3. **FE migration timing**: **RESOLVED — Yeni C10 commit olarak eklendi** (Frontend2 phase_workflow uyumu). Backend C9 ile birlikte Wave 1 kapanır; FE2 senkron olduktan sonra dual-key tolerance ileride bir cleanup commit'inde kaldırılabilir.

4. **GET response V2 breaking**: **RESOLVED — C10 çözüyor**. Backend C1'den itibaren `phase_workflow` döner; FE2 C10'da bu isimle okuma yapacak şekilde güncellenir.

5. **Template-driven seed**: **RESOLVED — Wave 2'ye ertelendi**. Plan'daki gibi. Wave 1 sadece engine'in kendisine odaklanır.

6. **`tasks.py` endpoint path**: **Execute agent doğrulayacak** — `Backend/app/api/v1/tasks.py` varsayımı, execute öncesi `ls` ile doğrulanır.

7. **Alembic revision 013**: **Execute agent doğrulayacak** — `Backend/alembic/versions/` mevcut migration sayısı kontrol edilir; çakışma varsa next number'a kayar.

---

## C10: chore(frontend): align Frontend2 with phase_workflow / task_workflow V2 shape

**Risk:** ORTA (FE2 GET/PATCH contract'ında 30+ referans değişir; ekran kırılma riski)
**Bağımlılık:** C9
**Tahmini değişiklik:** ~8-12 FE2 dosyası, ~150 satır

### Amaç
Backend artık `phase_workflow` döner ve hem `workflow` hem `phase_workflow` PATCH key'ini kabul eder (dual-key tolerance). Bu commit FE2'yi V2 shape'e taşır:
- GET response'undan `process_config.phase_workflow.*` okur
- PATCH body'sine `phase_workflow` ile yazar
- `task_workflow` placeholder okuma (Wave 2'de zenginleştirilecek)

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Frontend2/services/lifecycle-service.ts` | MODIFY | `process_config.workflow` → `phase_workflow` (line ~261-265) |
| `Frontend2/services/project-service.ts` | MODIFY | PATCH body'sinde `phase_workflow` key kullan |
| `Frontend2/components/workflow-editor/*.tsx` | MODIFY | Workflow read/write tüm yerlerde rename |
| `Frontend2/components/project-detail/settings-columns-subtab.tsx` | MODIFY (varsa) | Column edit zaten BoardColumn üzerinden, etki düşük |
| `Frontend2/components/admin/workflows/admin-template-card.tsx` | MODIFY | Template'in `default_workflow` referansı kontrol — backend'de `default_workflow` ProcessTemplate alanı; değişmiş olmayabilir, doğrula |
| `Frontend2/types/project.ts` veya equivalent | MODIFY | TypeScript type `process_config.phase_workflow` ekle |

### Detaylı Adımlar

1. **Tüm FE2 referansları bul:**
   ```bash
   rg -F 'process_config.workflow' Frontend2/
   rg -F '"workflow":' Frontend2/
   rg -F '.workflow.nodes' Frontend2/
   rg -F '.workflow.edges' Frontend2/
   ```
   Her birini `phase_workflow` ile değiştir.

2. **TypeScript types güncelle:**
   ```typescript
   interface ProcessConfig {
     schema_version: number;
     phase_workflow: WorkflowConfig;
     task_workflow: TaskWorkflowConfig;  // YENİ
     // ... rest
   }
   ```

3. **Workflow editor save handler:**
   - Mevcut: `{ process_config: { workflow: editorState } }`
   - Yeni: `{ process_config: { phase_workflow: editorState } }`

4. **Backend dual-key tolerance KORUNUR**: Bu commit FE2'yi yeni isme taşır ama backend hala eski `workflow` key'ini kabul eder. Bu sayede eski cached tarayıcıları kırmaz.

### Test Stratejisi

- **Manuel testler:**
  - Workflow editör aç → mevcut node'lar görünür mü
  - Node ekle, kaydet → backend yeni isimle alır mı
  - Page refresh → yeni state korunur mu
  - Eski projeler (V1 zamanından kalmış DB satırları) → backend migrate eder → FE'de problemsiz görünür

- **E2E test (varsa):**
  - `Frontend2/tests/e2e/workflow-editor.spec.ts` veya benzer — workflow save/load round-trip

### Doğrulama

- [ ] `rg -F 'process_config.workflow' Frontend2/` sıfır eşleşme (yorum/comment hariç)
- [ ] Workflow editör UI'da node CRUD çalışır
- [ ] Browser DevTools network tab'da PATCH body'sinde `phase_workflow` görünür
- [ ] Eski projeler V1 shape'i FE'de hata vermez (backend migrate eder)

### Risk Notları

- **30+ referans** — bir tane kaçırılırsa silent breakage. `rg` final doğrulaması zorunlu.
- **Dual-key tolerance backend'de korunur** — FE2 release sırası farklı olabilir (örn. user old build kullanıyor); tolerance bir süre daha tutar.
- **Geri alma:** FE2 commit revert kolay; backend etkilenmez.
- **Wave 2'de cleanup**: FE2 production'da kararlı çalıştıktan sonra backend'den dual-key tolerance kaldırılabilir (gelecek C11).
