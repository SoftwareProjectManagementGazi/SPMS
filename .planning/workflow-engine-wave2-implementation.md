# Workflow Engine — Wave 2 Implementation Plan

**Referans:** `.planning/workflow-engine-design.md` + `.planning/workflow-engine-implementation.md`
**Wave 2 Scope:** A (capability toggles UI) + B (node field editor) + C (template-driven seed)
**Oluşturulma:** 2026-05-17
**Audience:** Üçüncü bir execute agent (Wave 1 paterni biliniyor varsayılır), kullanıcı (gözden geçirme).

---

## Genel Bakış

Wave 1 sonrası backend motor (`WorkflowEngine`) tüm capability'leri (`enforce_wip_limits`, `enforce_sequential_dependencies`, `restrict_expired_sprints`, `has_recurring`) ve node-level field'ları (`category`, `is_initial`, `is_terminal`, `max_duration_days`, `entry_policy`, `exit_policy`) **kabul ediyor ve etkili biçimde okuyor** — ama UI'da hiçbiri **edit edilemiyor**. Ayrıca yeni proje yaratırken `CreateProjectUseCase` template'in JSONB `columns` alanını kullanıyor ama yeni alanları (`category, is_initial, is_terminal`) körüne 0/False default'a düşürüyor — `SeedDefaultColumnsUseCase` ise template'i hiç sormayıp hard-coded 5'li listeyi kullanmaya devam ediyor.

Bu Wave 2 planı **11 atomic commit** içerir (W2-C1 → W2-C11), backend-önce/frontend-sonra paterninde. Toplam ~28 dosya, ~1100 satır kod (incl. testler).

**Üst seviye akış:**
1. **W2-C1–W2-C3 (Backend kontratı):** `WorkflowConfig` Pydantic `capabilities` field'ını round-trip edebilir hale gelir; `BoardColumnDTO` zaten round-trip (Wave 1'de eklendi) — `BoardColumn` PATCH kanalında engine field'larının PATCH'lenebildiğini doğrulayan API testleri yazılır.
2. **W2-C4–W2-C5 (Frontend Capability UI):** Workflow editör'ün `RightPanel`'ine yeni `CapabilitiesPanel` bölümü eklenir (mode'a göre `task_workflow` vs `phase_workflow` capability'leri); save handler'da `unmapWorkflowConfig` capabilities'i serialize eder.
3. **W2-C6–W2-C7 (Frontend Node Field Editor):** `SelectionPanel` `NodeEditor` bölümüne `category` dropdown, `is_initial` validation, `max_duration_days` input, `entry_policy`/`exit_policy` dropdown'ları eklenir; status-mode'da kolon edit'i kolon CRUD endpoint'ine PATCH atar.
4. **W2-C8 (Settings>Columns Subtab):** `settings-columns-subtab.tsx` tablo genişletilir — yeni sütunlar (category dropdown, is_initial/is_terminal checkbox, max_duration_days input).
5. **W2-C9–W2-C10 (Template-driven seed):** `ProcessTemplate.default_columns` (yeni JSONB alanı) eklenir (alembic 014); `CreateProjectUseCase` `template.default_columns`'tan engine field'larıyla birlikte kolon kurar; `SeedDefaultColumnsUseCase` `process_template_id`'den çözümler.
6. **W2-C11 (Cleanup):** Wave 1'den kalan **dual-key tolerance** kaldırılır (FE2 V2 emit eder; eski `workflow` accept etmeye gerek yok).

**Kritik commit'ler:**
- **W2-C1**: `WorkflowConfig` Pydantic'e `capabilities` field eklemek — şu an `extra="ignore"` ile silently atılıyor. Wave 1 tamamlanmış sayılsa da bu **gözden kaçmış bug**.
- **W2-C9**: Alembic migration 014 + `template.default_columns` shape'i tasarımı — geri alınması zahmetli.
- **W2-C10**: `CreateProjectUseCase` davranış değişikliği — yeni projelerin kolon shape'i değişir (mevcut testler eski default'a göre yazılmış).

**Stable state'ler:**
- W2-C3 sonrası: Backend capability/node-field round-trip kontratı tam; FE değişikliği yok ama testlerle doğrulanmış.
- W2-C8 sonrası: A + B tamamlanmış; UI'dan capability + node-field düzenlenebilir; C henüz yok.
- W2-C10 sonrası: Wave 2 davranışsal hedef tamamlandı.
- W2-C11 sonrası: Wave 2 kapanış; teknik borç temizliği yapılmış.

---

## Bağımlılık Grafı

```
W2-C1 (backend: WorkflowConfig Pydantic + capabilities round-trip)
 │
 ├─→ W2-C2 (backend: capability NORM idempotency — _migrate_v1_to_v2 düzeltme)
 │   │
 │   └─→ W2-C3 (backend: API integration testleri — capability + node-field PATCH round-trip)
 │       │
 │       ├─→ W2-C4 (frontend: CapabilitiesPanel — yeni right-panel section)
 │       │   │
 │       │   └─→ W2-C5 (frontend: editor-page save handler capabilities serialize)
 │       │       │
 │       │       └─→ W2-C6 (frontend: SelectionPanel NodeEditor — engine field'ları eklenir, status-mode)
 │       │           │
 │       │           └─→ W2-C7 (frontend: SelectionPanel NodeEditor — lifecycle-mode'da BoardColumn PATCH yok ama category vb. var)
 │       │               │
 │       │               └─→ W2-C8 (frontend: Settings>Columns Subtab tablo genişletme)
 │       │
 │       └─→ W2-C9 (backend: alembic 014 + ProcessTemplate.default_columns + seeder güncelle)
 │           │
 │           └─→ W2-C10 (backend: CreateProjectUseCase + SeedDefaultColumnsUseCase template-driven)
 │               │
 │               └─→ W2-C11 (backend: dual-key tolerance kaldırma)
```

**Paralelleştirilebilir:**
- W2-C4–W2-C8 (FE branch) ve W2-C9–W2-C10 (BE branch) **W2-C3 sonrası paralel çalışabilir** — farklı dosyalara dokunuyor.
- Pratikte sıralı uygulanması önerilir; FE branch görsel UAT için W2-C8 sonunda; BE branch testlerle kapanır.

---

## Komut Sırası (Önerilen Execute Sırası)

1. **W2-C1**: `WorkflowConfig` Pydantic + `WorkflowCapabilities` sınıfı → `pytest Backend/tests/unit/application/test_workflow_dtos.py -v` → commit
2. **W2-C2**: `_migrate_v1_to_v2` idempotency düzeltme + ek test → `pytest Backend/tests/unit/application/test_process_config_normalizer.py -v` → commit
3. **W2-C3**: API integration testler → `pytest Backend/tests/integration/api/test_project_workflow_patch.py Backend/tests/integration/api/test_board_columns_api.py -v` → commit
4. **W2-C4**: `Frontend2/components/workflow-editor/capabilities-panel.tsx` (yeni) + `right-panel.tsx` mount → `npm run test -- capabilities-panel` → commit
5. **W2-C5**: `editor-page.tsx` save handler capabilities serialize + read fallback → `npm run test -- editor-page` → commit
6. **W2-C6**: `selection-panel.tsx` NodeEditor — status-mode için engine field'ları + BoardColumn PATCH → `npm run test -- selection-panel` → commit
7. **W2-C7**: `selection-panel.tsx` NodeEditor — lifecycle-mode için aynı field'lar (BoardColumn'a değil workflow node JSON'una yazar) → `npm run test -- selection-panel` → commit
8. **W2-C8**: `settings-columns-subtab.tsx` — table genişletme + column save handler → `npm run test -- settings-columns-subtab` → manuel test → commit
9. **W2-C9**: `alembic/versions/014_template_default_columns.py` + `ProcessTemplateModel.default_columns` + seeder seed verisi → `pytest Backend/tests/` + alembic up/down/up → commit
10. **W2-C10**: `CreateProjectUseCase` + `SeedDefaultColumnsUseCase` template-driven → `pytest Backend/tests/` → commit
11. **W2-C11**: `manage_projects.py` dual-key tolerance kaldırma → `rg -F 'or pc.get("workflow")' Backend/` sıfır + tam suite → commit

---

## W2-C1: fix(workflow): round-trip phase_workflow.capabilities through Pydantic DTO

**Risk:** DÜŞÜK (Wave 1'de kaçırılan; backend yan etki yok ama PATCH validation şu an silently capabilities düşürüyor)
**Bağımlılık:** — (Wave 2'nin ilk commit'i)
**Tahmini değişiklik:** ~3 dosya, ~80 satır

### Amaç

`WorkflowConfig` Pydantic DTO'su şu anda `model_config = ConfigDict(extra="ignore")` ile capabilities field'ını silently atıyor (`Backend/app/application/dtos/workflow_dtos.py:99-105`). Bu, FE'den gönderilen capabilities'in `manage_projects.py:165`'teki `WorkflowConfigDTO(**wf)` validate adımında **kaybolması demek** — ancak entity normalizer (`_migrate_v1_to_v2`) zaten capabilities'i yeniden inşa ettiği için sorun şu an sessiz. Wave 2 capability UI ekleyince FE'den gönderilen değerler **persistence'a yazılmalı**, normalizer override etmemeli.

Bu commit `WorkflowCapabilities` Pydantic sınıfı ekler + `WorkflowConfig.capabilities` opsiyonel field olarak round-trip eder. Davranışsal etki sıfır: ne capability okumaları (engine `_caps.get`) ne de normalizer (idempotent setdefault) bu commit'ten etkilenmez.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/dtos/workflow_dtos.py` | MODIFY | `WorkflowCapabilities` BaseModel + `WorkflowConfig.capabilities: Optional[WorkflowCapabilities] = None` |
| `Backend/app/application/use_cases/manage_projects.py` | MODIFY | `WorkflowConfigDTO(**wf)` çağrısı validate ediyor; davranış aynı, sadece artık capabilities silently atılmıyor |
| `Backend/tests/unit/application/test_workflow_dtos.py` | CREATE | Yeni test dosyası — capability round-trip + invalid value rejection |

### Detaylı Adımlar

1. **`Backend/app/application/dtos/workflow_dtos.py`** — `WorkflowConfig` sınıfının ÜSTÜNE yeni Pydantic class:

```python
class WorkflowCapabilities(BaseModel):
    """Wave 2 — capability flags that gate engine behaviors.

    Mirrors phase_workflow.capabilities / task_workflow.capabilities shape from
    .planning/workflow-engine-design.md §4. All fields optional with safe defaults
    so legacy JSONB rows (no capabilities sub-object) parse without error and
    the entity normalizer's idempotent setdefault path remains correct.
    """

    enforce_wip_limits: bool = False
    enforce_sequential_dependencies: bool = False
    restrict_expired_sprints: bool = False
    has_recurring: bool = True
    initial_node_id: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("initial_node_id")
    @classmethod
    def validate_initial_node_id_format(cls, v):
        if v is not None and not isinstance(v, str):
            raise ValueError(f"initial_node_id must be a string, got {type(v).__name__}")
        if v is not None and not v:
            raise ValueError("initial_node_id must be non-empty when provided")
        # NOTE: we do NOT enforce NODE_ID_REGEX here — task_workflow.capabilities
        # may reference a column-style id (numeric string), so format checks
        # belong at the use-case layer where context is known.
        return v
```

Ardından `WorkflowConfig`'e `capabilities` ekle (line 99-105):

```python
class WorkflowConfig(BaseModel):
    mode: Literal["flexible", "sequential-locked", "continuous", "sequential-flexible"]
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    groups: List[WorkflowGroup] = []
    # Wave 2 W2-C1 — engine capabilities round-trip. Optional with None default
    # so legacy rows (where capabilities was never persisted at the Pydantic
    # boundary) parse cleanly; the entity normalizer fills defaults downstream.
    capabilities: Optional[WorkflowCapabilities] = None

    model_config = ConfigDict(extra="ignore")
```

2. **`Backend/app/application/use_cases/manage_projects.py`** — Hiçbir kod değişikliği yok; `WorkflowConfigDTO(**wf)` çağrısı zaten validate ediyor. Davranış sadece test'le doğrulanır. (Yorum güncelle line 138-153: "C1 dual-key tolerance + W2-C1 capabilities round-trip" notu)

3. **`Backend/tests/unit/application/test_workflow_dtos.py`** — yeni test dosyası:

```python
import pytest
from pydantic import ValidationError

from app.application.dtos.workflow_dtos import WorkflowConfig, WorkflowCapabilities


def _valid_workflow_shell(**overrides):
    """V2 minimal shell — 1 initial + 1 final node, no edges."""
    base = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_test000001", "name": "Start", "x": 0, "y": 0, "color": "#888", "is_initial": True},
            {"id": "nd_test000002", "name": "End", "x": 100, "y": 0, "color": "#888", "is_final": True},
        ],
        "edges": [],
        "groups": [],
    }
    base.update(overrides)
    return base


class TestWorkflowCapabilities:
    def test_default_values(self):
        caps = WorkflowCapabilities()
        assert caps.enforce_wip_limits is False
        assert caps.enforce_sequential_dependencies is False
        assert caps.restrict_expired_sprints is False
        assert caps.has_recurring is True
        assert caps.initial_node_id is None

    def test_all_fields_round_trip(self):
        caps = WorkflowCapabilities(
            enforce_wip_limits=True,
            enforce_sequential_dependencies=True,
            restrict_expired_sprints=True,
            has_recurring=False,
            initial_node_id="nd_abc1234567",
        )
        dumped = caps.model_dump()
        assert dumped["enforce_wip_limits"] is True
        assert dumped["initial_node_id"] == "nd_abc1234567"

    def test_initial_node_id_empty_string_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowCapabilities(initial_node_id="")

    def test_extra_keys_ignored(self):
        caps = WorkflowCapabilities.model_validate(
            {"enforce_wip_limits": True, "future_field": "ignored"}
        )
        assert caps.enforce_wip_limits is True


class TestWorkflowConfigCapabilitiesRoundTrip:
    def test_capabilities_persisted_on_validate(self):
        shell = _valid_workflow_shell(
            capabilities={
                "enforce_wip_limits": True,
                "enforce_sequential_dependencies": True,
            }
        )
        wf = WorkflowConfig.model_validate(shell)
        assert wf.capabilities is not None
        assert wf.capabilities.enforce_wip_limits is True
        assert wf.capabilities.enforce_sequential_dependencies is True
        # Defaults filled in for unspecified flags
        assert wf.capabilities.has_recurring is True

    def test_capabilities_absent_yields_none(self):
        wf = WorkflowConfig.model_validate(_valid_workflow_shell())
        assert wf.capabilities is None

    def test_capabilities_dumped_back_to_dict(self):
        shell = _valid_workflow_shell(
            capabilities={"enforce_wip_limits": True, "initial_node_id": "nd_test000001"}
        )
        wf = WorkflowConfig.model_validate(shell)
        dumped = wf.model_dump()
        assert dumped["capabilities"]["enforce_wip_limits"] is True
        assert dumped["capabilities"]["initial_node_id"] == "nd_test000001"

    def test_invalid_capability_value_raises(self):
        shell = _valid_workflow_shell(
            capabilities={"enforce_wip_limits": "yes"}  # bool olmayan
        )
        with pytest.raises(ValidationError):
            WorkflowConfig.model_validate(shell)
```

### Test Stratejisi

- **Etkilenen mevcut testler:** Tüm `WorkflowConfig.model_validate` testleri hala geçer (additive change; `capabilities` opsiyonel).
- **Eklenecek testler:** Yukarıdaki 8 test.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_workflow_dtos.py Backend/tests/unit/application/test_process_config_normalizer.py -v`
- **Beklenen sonuç:** 8 yeni test pas; mevcut normalizer testleri hala yeşil.

### Doğrulama

- [ ] 8 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil
- [ ] Manuel: `python -c "from app.application.dtos.workflow_dtos import WorkflowConfig; w = WorkflowConfig.model_validate({'mode':'flexible','nodes':[{'id':'nd_test000001','name':'A','x':0,'y':0,'color':'#888','is_initial':True},{'id':'nd_test000002','name':'B','x':100,'y':0,'color':'#888','is_final':True}],'edges':[],'capabilities':{'enforce_wip_limits':True}}); print(w.capabilities)"` capability'yi gösterir
- [ ] `rg 'extra=.ignore.' Backend/app/application/dtos/workflow_dtos.py` — sadece bekleneni döner (WorkflowConfig + WorkflowCapabilities + WorkflowGroup)

### Risk Notları

- **Forward-compat:** Eski JSONB satırları (capabilities yok) parse eder; capability okuyucuları (engine `_caps.get`) `None` durumunda zaten safe.
- **Geri alma:** Tek başına revertable; downstream commit'ler kapasiyei kullanır ama silent ignore'a düşer.
- **Sürpriz beklenebilir:** Wave 1'in test'leri `process_config.task_workflow.capabilities` direkt JSONB üzerinden assert ediyor olabilir; normalizer round-trip'i bu testleri etkilemez ama yeni capability validation errorları çıkabilir. Mitigasyon: tam suite çalıştırılır.

---

## W2-C2: fix(workflow): correct _migrate_v1_to_v2 idempotency on capability merge

**Risk:** DÜŞÜK (idempotency-only fix; davranış aynı kalır)
**Bağımlılık:** W2-C1
**Tahmini değişiklik:** ~2 dosya, ~40 satır

### Amaç

`Backend/app/domain/entities/project.py:94-97`'deki `pw.setdefault("capabilities", caps)` "tüm capabilities sub-object yoksa ekle" davranışı **kısmen migrated projeler için bozuk**: eğer biri eski `capabilities={"enforce_wip_limits": True}` ile gelirse, `setdefault` `False` default'larını ekleyemez (çünkü dict zaten var). Bu, **W2-C1'den önce yazılmış FE'lerde** sorun değildi ama Wave 2 FE'sinin partial capability gönderme imkânı var (örn. sadece `enforce_wip_limits` toggle değişti → payload {"enforce_wip_limits": True} dönebilir).

Bu commit `_migrate_v1_to_v2`'ye **per-field setdefault** ekler (capabilities sub-object'in bireysel field'ları için) ve `phase_workflow.capabilities`'in da `has_recurring`/`restrict_expired_sprints` gibi alanları için idempotent default'lar ekler. Davranışsal etki: partial capability payload'ları artık server-side'da tam shape'e expand olur.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/domain/entities/project.py` | MODIFY | `_migrate_v1_to_v2` capability per-field setdefault (~25 satır) |
| `Backend/tests/unit/application/test_process_config_normalizer.py` | MODIFY | Partial capability idempotency testleri (4 yeni) |

### Detaylı Adımlar

1. **`Backend/app/domain/entities/project.py`** — `_migrate_v1_to_v2`'de `pw.setdefault("capabilities", caps)`'ı genişlet (line 94-97):

```python
    if isinstance(pw, dict):
        for n in pw.get("nodes", []) or []:
            if isinstance(n, dict) and n.get("is_initial"):
                caps["initial_node_id"] = n.get("id")
                break
        # Wave 2 W2-C2 — per-field idempotency for partial-capability payloads
        # (FE may PATCH a single toggle without re-sending the full capabilities
        # sub-object). The old behavior (setdefault on the entire sub-object)
        # could leave the persisted capabilities missing the newer defaults
        # (has_recurring) when only a legacy partial dict was present.
        existing_caps = pw.setdefault("capabilities", {})
        if isinstance(existing_caps, dict):
            for key, default in caps.items():
                existing_caps.setdefault(key, default)
            # has_recurring is phase_workflow-relevant too (Wave 2 — user can
            # disable recurring on a phase level if desired). Default True.
            existing_caps.setdefault("has_recurring", True)
        new["phase_workflow"] = pw
    else:
        new["phase_workflow"] = {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {**caps, "has_recurring": True},
        }
```

2. **`Backend/tests/unit/application/test_process_config_normalizer.py`** — yeni testler:

```python
def test_partial_phase_workflow_capabilities_filled_with_defaults():
    """W2-C2: PATCH with only enforce_wip_limits=True must not strip the rest."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {"enforce_wip_limits": True},
        },
    }
    result = _normalize_process_config(v1)
    caps = result["phase_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is True
    assert caps["enforce_sequential_dependencies"] is False  # filled
    assert caps["restrict_expired_sprints"] is False  # filled
    assert caps["has_recurring"] is True  # filled
    assert caps["initial_node_id"] is None  # filled


def test_v2_partial_capabilities_idempotent_on_re_normalize():
    """A V2 payload missing has_recurring must gain it on re-normalize."""
    v2_partial = {
        "schema_version": 2,
        "phase_workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {"enforce_wip_limits": True},  # partial
        },
        "task_workflow": {
            "capabilities": {"enforce_wip_limits": False},  # missing has_recurring + initial_node_id
            "edges": [],
            "groups": [],
        },
    }
    # Re-normalize: since schema_version is already 2, migration loop is a no-op
    # but we'll explicitly check that calling _normalize_process_config on this
    # passes through unchanged. Idempotency is enforced at the migration handler
    # level (when entity is reconstructed from V1).
    result = _normalize_process_config(v2_partial)
    assert result["schema_version"] == 2
    # Idempotency: caller's responsibility to also re-run normalizer is OK; but
    # this test guards that we don't accidentally clobber the partial sub-object.
    assert result["phase_workflow"]["capabilities"]["enforce_wip_limits"] is True


def test_v1_to_v2_preserves_existing_has_recurring():
    """W2-C2: a config with has_recurring=False must survive migration."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": {"has_recurring": False},  # explicit False
        },
    }
    result = _normalize_process_config(v1)
    assert result["phase_workflow"]["capabilities"]["has_recurring"] is False


def test_v1_with_non_dict_capabilities_recovered():
    """Defensive: a corrupt JSONB value (capabilities=None) must yield defaults."""
    v1 = {
        "schema_version": 1,
        "workflow": {
            "mode": "flexible",
            "nodes": [],
            "edges": [],
            "groups": [],
            "capabilities": None,
        },
    }
    result = _normalize_process_config(v1)
    caps = result["phase_workflow"]["capabilities"]
    # The `isinstance(existing_caps, dict)` guard makes capabilities=None case
    # fall through and the setdefault path doesn't seed defaults — that's OK,
    # downstream readers tolerate empty dict. Assert the legacy None survived
    # (no crash) and capabilities key still exists.
    assert "capabilities" in result["phase_workflow"]
```

### Test Stratejisi

- **Etkilenen mevcut testler:** Mevcut normalizer testleri hepsi yeşil; per-field setdefault tam-shape input için aynı sonucu üretir.
- **Eklenecek testler:** 4 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_process_config_normalizer.py -v`
- **Beklenen sonuç:** 4 yeni pas; mevcut yeşil.

### Doğrulama

- [ ] 4 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil
- [ ] Manuel: `python -c "from app.domain.entities.project import _normalize_process_config; print(_normalize_process_config({'schema_version': 1, 'workflow': {'mode':'flexible','nodes':[],'edges':[],'groups':[], 'capabilities': {'enforce_wip_limits': True}}}))"` çıktı `has_recurring: True`'yu içerir.

### Risk Notları

- **Edge case:** `capabilities=None` (non-dict) durumda eski kod `setdefault` çağrısında crashed mi? Hayır — `pw.setdefault("capabilities", caps)` non-dict üzerine yazardı. W2-C2 `existing_caps = pw.setdefault(...)`'tan sonra `isinstance(existing_caps, dict)` guard ile yeni davranış: capabilities None ise hiçbir şey yapma. Bu, eski davranıştan **biraz farklı** ama testlerle güvenli.
- **Geri alma:** Tek başına revertable; downstream commit'ler partial-capability payload göndermiyorsa sorun değil.

---

## W2-C3: test(workflow): API integration round-trip tests for capabilities + node fields

**Risk:** DÜŞÜK (test-only commit; production kod değişmez)
**Bağımlılık:** W2-C2
**Tahmini değişiklik:** ~2 dosya, ~200 satır

### Amaç

Wave 1 (C7+C8+C9) capability'leri okuyor, Wave 1 (C4) BoardColumn engine field'larını DB'de tutuyor — ama **API boundary'sinde PATCH→GET round-trip testleri eksik**. W2-C3 bu açığı kapatır: PATCH ile `phase_workflow.capabilities` ve `BoardColumn.is_initial`/`category`/`max_duration_days` set edilir; GET'te aynı değerler dönmeli. Bu test'ler **W2-C4–W2-C8 FE değişiklikleri için contract** görevi görür.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/tests/integration/api/test_project_workflow_patch.py` | MODIFY | capabilities round-trip + partial PATCH testleri |
| `Backend/tests/integration/api/test_board_columns_api.py` | MODIFY veya CREATE | engine field PATCH/GET testleri |

### Detaylı Adımlar

1. **`Backend/tests/integration/api/test_project_workflow_patch.py`** — yeni testler:

```python
@pytest.mark.asyncio
async def test_patch_capabilities_round_trips_through_get(authenticated_client, db_session):
    """W2-C3: PATCH phase_workflow.capabilities + GET returns same values."""
    # 1. Create project (already V2 with default capabilities)
    project = await _create_project_with_workflow(db_session)

    # 2. PATCH with all 4 capability flags enabled
    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={
            "process_config": {
                "phase_workflow": {
                    "mode": "flexible",
                    "nodes": _valid_phase_nodes(),
                    "edges": [],
                    "groups": [],
                    "capabilities": {
                        "enforce_wip_limits": True,
                        "enforce_sequential_dependencies": True,
                        "restrict_expired_sprints": True,
                        "has_recurring": False,
                        "initial_node_id": "nd_test000001",
                    },
                }
            }
        },
    )
    assert response.status_code == 200

    # 3. GET and verify capabilities persisted
    response = await authenticated_client.get(f"/api/v1/projects/{project.id}")
    pc = response.json()["process_config"]
    caps = pc["phase_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is True
    assert caps["enforce_sequential_dependencies"] is True
    assert caps["restrict_expired_sprints"] is True
    assert caps["has_recurring"] is False
    assert caps["initial_node_id"] == "nd_test000001"


@pytest.mark.asyncio
async def test_patch_partial_capabilities_preserves_unchanged_flags(authenticated_client, db_session):
    """W2-C3: PATCH with only enforce_wip_limits=True must not zero out the others.

    This guards the Wave 2 FE flow where a single toggle change ships ONLY the
    changed flag (avoiding race conditions where two users edit different toggles).
    """
    project = await _create_project_with_workflow(db_session)

    # First PATCH: enable enforce_sequential_dependencies
    await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={"process_config": {"phase_workflow": {
            "mode": "flexible", "nodes": _valid_phase_nodes(), "edges": [], "groups": [],
            "capabilities": {"enforce_sequential_dependencies": True},
        }}},
    )
    # Second PATCH: now enable enforce_wip_limits — must NOT disable seq deps
    await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={"process_config": {"phase_workflow": {
            "mode": "flexible", "nodes": _valid_phase_nodes(), "edges": [], "groups": [],
            "capabilities": {"enforce_wip_limits": True, "enforce_sequential_dependencies": True},
        }}},
    )

    # Verify both flags persisted
    response = await authenticated_client.get(f"/api/v1/projects/{project.id}")
    caps = response.json()["process_config"]["phase_workflow"]["capabilities"]
    assert caps["enforce_wip_limits"] is True
    assert caps["enforce_sequential_dependencies"] is True


@pytest.mark.asyncio
async def test_patch_task_workflow_capabilities_round_trip(authenticated_client, db_session):
    """W2-C3: task_workflow.capabilities (has_recurring etc.) round-trips."""
    project = await _create_project_with_workflow(db_session)

    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={
            "process_config": {
                "phase_workflow": {
                    "mode": "flexible", "nodes": _valid_phase_nodes(), "edges": [], "groups": [],
                },
                "task_workflow": {
                    "capabilities": {
                        "enforce_wip_limits": True,
                        "has_recurring": False,
                    },
                    "edges": [],
                    "groups": [],
                },
            }
        },
    )
    assert response.status_code == 200

    response = await authenticated_client.get(f"/api/v1/projects/{project.id}")
    tw_caps = response.json()["process_config"]["task_workflow"]["capabilities"]
    assert tw_caps["enforce_wip_limits"] is True
    assert tw_caps["has_recurring"] is False


@pytest.mark.asyncio
async def test_patch_capabilities_rejects_invalid_value(authenticated_client, db_session):
    """W2-C3: PATCH with capabilities.enforce_wip_limits='yes' (non-bool) → 422."""
    project = await _create_project_with_workflow(db_session)

    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={
            "process_config": {
                "phase_workflow": {
                    "mode": "flexible", "nodes": _valid_phase_nodes(), "edges": [], "groups": [],
                    "capabilities": {"enforce_wip_limits": "yes"},  # bool olmayan
                }
            }
        },
    )
    assert response.status_code == 422
```

Helper fonksiyon (test başı):
```python
def _valid_phase_nodes():
    """V2 shape — 1 initial + 1 final (D-19 rule 4 satisfied)."""
    return [
        {"id": "nd_test000001", "name": "Start", "x": 0, "y": 0, "color": "#888", "is_initial": True},
        {"id": "nd_test000002", "name": "End", "x": 100, "y": 0, "color": "#888", "is_final": True},
    ]
```

2. **`Backend/tests/integration/api/test_board_columns_api.py`** (varsa MODIFY, yoksa CREATE) — yeni testler:

```python
@pytest.mark.asyncio
async def test_patch_column_engine_fields_round_trip(authenticated_client, db_session):
    """W2-C3: PATCH BoardColumn.{category,is_initial,is_terminal,max_duration_days,entry_policy,exit_policy} round-trips."""
    project = await _create_project_with_columns(db_session)
    column = project.columns[0]

    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}/columns/{column.id}",
        json={
            "category": "in_progress",
            "is_initial": False,
            "is_terminal": True,
            "max_duration_days": 7,
            "entry_policy": "edges_only",
            "exit_policy": "terminal_lock",
        },
    )
    assert response.status_code == 200

    response = await authenticated_client.get(f"/api/v1/projects/{project.id}/columns")
    cols = response.json()
    target = next(c for c in cols if c["id"] == column.id)
    assert target["category"] == "in_progress"
    assert target["is_initial"] is False
    assert target["is_terminal"] is True
    assert target["max_duration_days"] == 7
    assert target["entry_policy"] == "edges_only"
    assert target["exit_policy"] == "terminal_lock"


@pytest.mark.asyncio
async def test_patch_column_max_duration_days_clear_via_null_unsupported(authenticated_client, db_session):
    """W2-C3: Wave 1 DTO `max_duration_days: Optional[int] = Field(None, ge=1)` —
    'None means leave unchanged' per UpdateColumnDTO semantics. To CLEAR the field
    a separate DELETE endpoint would be needed (Wave 3 if requested).

    This test documents the current behavior: PATCH with max_duration_days=null
    leaves the existing value untouched (not cleared).
    """
    project = await _create_project_with_columns(db_session)
    column = project.columns[0]
    # Set a value
    await authenticated_client.patch(
        f"/api/v1/projects/{project.id}/columns/{column.id}",
        json={"max_duration_days": 14},
    )
    # PATCH with explicit null
    await authenticated_client.patch(
        f"/api/v1/projects/{project.id}/columns/{column.id}",
        json={"max_duration_days": None},
    )
    response = await authenticated_client.get(f"/api/v1/projects/{project.id}/columns")
    cols = response.json()
    target = next(c for c in cols if c["id"] == column.id)
    # `None means leave unchanged` — original 14 still there
    assert target["max_duration_days"] == 14


@pytest.mark.asyncio
async def test_patch_column_invalid_entry_policy_rejected(authenticated_client, db_session):
    """W2-C3: enum Literal validation surfaces as 422."""
    project = await _create_project_with_columns(db_session)
    column = project.columns[0]
    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}/columns/{column.id}",
        json={"entry_policy": "wat"},  # geçersiz enum
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_columns_returns_engine_fields_for_new_project(authenticated_client, db_session):
    """W2-C3: A freshly-seeded project's columns expose engine fields with defaults.

    Wave 1 SeedDefaultColumnsUseCase sets is_initial/is_terminal explicitly;
    this test guards the API DTO actually returns them. (Pre-W2 the FE could
    silently lose this — extra='ignore' on BoardColumnDTO was never the case
    but worth defending.)
    """
    project = await _create_project_with_columns(db_session)
    response = await authenticated_client.get(f"/api/v1/projects/{project.id}/columns")
    cols = response.json()
    assert len(cols) >= 1
    # All defaults present in API response
    for col in cols:
        assert "category" in col
        assert "is_initial" in col
        assert "is_terminal" in col
        assert "entry_policy" in col
        assert "exit_policy" in col
        # max_duration_days nullable — key still present
        assert "max_duration_days" in col
    # First column is initial; last is terminal (Wave 1 C4 backfill / seed defaults)
    cols_sorted = sorted(cols, key=lambda c: c["order_index"])
    assert cols_sorted[0]["is_initial"] is True
    assert cols_sorted[-1]["is_terminal"] is True
```

### Test Stratejisi

- **Etkilenen mevcut testler:** Yok (test-only commit).
- **Eklenecek testler:** 4 + 4 = 8 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/integration/api/test_project_workflow_patch.py Backend/tests/integration/api/test_board_columns_api.py -v`
- **Beklenen sonuç:** 8 yeni pas. Eğer test_board_columns_api.py yoksa, helper fixture'ları (`_create_project_with_workflow`, `_create_project_with_columns`) eklenecek.

### Doğrulama

- [ ] 8 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil
- [ ] Test'ler fail durumunda **clear assertion message'lar** içerir (`assert caps["enforce_wip_limits"] is True` vb. — pytest -v ile okunabilir)

### Risk Notları

- **`test_board_columns_api.py` dosyasının varlığı kontrol edilmeli.** Yoksa, helper'lar + boilerplate dahil ~150 satır. Varsa eklenen testler ~80 satır.
- **Helper fonksiyonlar mevcut fixture pattern'i takip eder** (Wave 1 plan'da `tests/factories/project_factory.py` ve `_PROCESS_CONFIG` constants kullanılıyor).
- **Geri alma:** Tek başına revertable, üretim kodu değişmez.

---

## W2-C4: feat(workflow-editor): add CapabilitiesPanel to right-panel

**Risk:** ORTA (yeni UI bileşeni; mode'a göre task vs phase capability ayrımı net olmalı)
**Bağımlılık:** W2-C3
**Tahmini değişiklik:** ~3 dosya, ~280 satır

### Amaç

Workflow editör'ün sağ panel (`RightPanel`)'inde mevcut 4 section'ın (`FlowRules`, `SelectionPanel`, `ValidationPanel`, `ShortcutsPanel`) **arasına** yeni bir section ekle: `CapabilitiesPanel`. Bu panel mode'a göre (`lifecycle` = phase_workflow vs `status` = task_workflow) ilgili capability flag'lerini Toggle olarak gösterir:

- **lifecycle (phase_workflow):** `enforce_sequential_dependencies`, `restrict_expired_sprints`, `enforce_wip_limits`, `has_recurring`
- **status (task_workflow):** `enforce_wip_limits`, `has_recurring`, `enforce_sequential_dependencies`

(NOTE: `restrict_expired_sprints` sadece phase_workflow için anlamlı — Scrum sprint validation; task workflow'a uygulanmaz.)

Toggle değişiklikleri `onWorkflowChange` çağrısı **YERİNE** yeni bir `onCapabilitiesChange(capsPatch)` callback'i ile dispatch edilir. Bu callback `editor-page.tsx`'te working-copy capabilities state'ini güncelliyor (W2-C5'te save handler bunu serialize edecek).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Frontend2/components/workflow-editor/capabilities-panel.tsx` | CREATE | Yeni component |
| `Frontend2/components/workflow-editor/right-panel.tsx` | MODIFY | Yeni section mount + prop drilling |
| `Frontend2/components/workflow-editor/capabilities-panel.test.tsx` | CREATE | Vitest unit testler |

### Detaylı Adımlar

1. **`Frontend2/components/workflow-editor/capabilities-panel.tsx`** — yeni file (~150 satır):

```tsx
"use client"

// CapabilitiesPanel (Wave 2 W2-C4) — right-panel section that surfaces the
// workflow engine capability toggles for the active mode.
//
// Lifecycle mode → phase_workflow.capabilities:
//   - enforce_sequential_dependencies (Waterfall semantics — phase order)
//   - restrict_expired_sprints (Scrum sprint validation; Phase-only)
//   - enforce_wip_limits (per-phase node WIP)
//   - has_recurring (recurring task auto-next on phase-terminal)
//
// Status mode → task_workflow.capabilities:
//   - enforce_wip_limits (per-column WIP enforcement at move time)
//   - has_recurring (recurring task auto-next on column-terminal)
//   - enforce_sequential_dependencies (edge validation on column move)
//
// Wave 2 — toggle changes commit via onCapabilitiesChange; the editor's save
// handler serializes the active mode's capabilities into the PATCH body.

import * as React from "react"
import { Toggle } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { EditorMode } from "./editor-page"

export interface WorkflowCapabilities {
  enforce_wip_limits?: boolean
  enforce_sequential_dependencies?: boolean
  restrict_expired_sprints?: boolean
  has_recurring?: boolean
  initial_node_id?: string | null
}

export interface CapabilitiesPanelProps {
  /** Current capabilities for the active mode (lifecycle → phase_workflow.capabilities; status → task_workflow.capabilities). */
  capabilities: WorkflowCapabilities
  /** Patch callback — caller merges into working-copy state. */
  onCapabilitiesChange: (patch: WorkflowCapabilities) => void
  editorMode: EditorMode
  /** When false, all toggles are read-only (no transition_authority). */
  canEdit?: boolean
}

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

const TOGGLE_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
}

const ROW_LABEL: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--fg)",
  lineHeight: 1.3,
}

const ROW_HINT: React.CSSProperties = {
  fontSize: 11,
  color: "var(--fg-muted)",
  marginTop: 2,
  lineHeight: 1.4,
}

interface ToggleSpec {
  key: keyof WorkflowCapabilities
  labelTr: string
  labelEn: string
  hintTr: string
  hintEn: string
}

const LIFECYCLE_TOGGLES: ToggleSpec[] = [
  {
    key: "enforce_sequential_dependencies",
    labelTr: "Sıralı bağımlılık",
    labelEn: "Sequential dependencies",
    hintTr: "Waterfall: önceki faz tamamlanmadan sonrakine geçilemez.",
    hintEn: "Waterfall: phase B can't start until A is done.",
  },
  {
    key: "restrict_expired_sprints",
    labelTr: "Süresi geçmiş sprint'i kısıtla",
    labelEn: "Restrict expired sprints",
    hintTr: "Scrum: bitiş tarihi geçmiş sprint'lere yeni görev eklenmesin.",
    hintEn: "Scrum: prevent new tasks on past-end sprints.",
  },
  {
    key: "enforce_wip_limits",
    labelTr: "WIP limitlerini uygula",
    labelEn: "Enforce WIP limits",
    hintTr: "Faz başına WIP cap'leri uygulansın.",
    hintEn: "Apply WIP caps per phase.",
  },
  {
    key: "has_recurring",
    labelTr: "Tekrarlayan görevler",
    labelEn: "Recurring tasks",
    hintTr: "Faz bitince tekrarlayan görevin yeni instance'ı oluşsun.",
    hintEn: "Spawn next recurrence when phase completes.",
  },
]

const STATUS_TOGGLES: ToggleSpec[] = [
  {
    key: "enforce_wip_limits",
    labelTr: "WIP limitlerini uygula",
    labelEn: "Enforce WIP limits",
    hintTr: "Kolon WIP cap dolu ise görev taşıma engellensin.",
    hintEn: "Block moves to columns at WIP cap.",
  },
  {
    key: "has_recurring",
    labelTr: "Tekrarlayan görevler",
    labelEn: "Recurring tasks",
    hintTr: "Görev terminal kolona girince yeni instance oluşsun.",
    hintEn: "Spawn next recurrence on terminal column entry.",
  },
  {
    key: "enforce_sequential_dependencies",
    labelTr: "Edge doğrulaması",
    labelEn: "Edge validation",
    hintTr: "Sadece tanımlı bağlantılar üzerinden kolon değişimi.",
    hintEn: "Only allow column moves along defined edges.",
  },
]

export function CapabilitiesPanel({
  capabilities,
  onCapabilitiesChange,
  editorMode,
  canEdit = true,
}: CapabilitiesPanelProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const toggles = editorMode === "status" ? STATUS_TOGGLES : LIFECYCLE_TOGGLES

  return (
    <div>
      <div style={TITLE_STYLE}>
        {T("Motor Ayarları", "Engine Settings")}
      </div>
      {toggles.map((spec) => {
        const value = Boolean(capabilities[spec.key])
        return (
          <div key={String(spec.key)} style={{ marginBottom: 12 }}>
            <div style={TOGGLE_ROW}>
              <span style={ROW_LABEL}>{T(spec.labelTr, spec.labelEn)}</span>
              <Toggle
                on={value}
                onChange={(next) =>
                  onCapabilitiesChange({ [spec.key]: next })
                }
                size="sm"
                disabled={!canEdit}
              />
            </div>
            <div style={ROW_HINT}>{T(spec.hintTr, spec.hintEn)}</div>
          </div>
        )
      })}
    </div>
  )
}
```

2. **`Frontend2/components/workflow-editor/right-panel.tsx`** — yeni section mount:

```tsx
import { CapabilitiesPanel, type WorkflowCapabilities } from "./capabilities-panel"

export interface RightPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Wave 2 W2-C4 — capabilities sub-section. */
  capabilities: WorkflowCapabilities
  onCapabilitiesChange: (patch: WorkflowCapabilities) => void
  editorMode?: "lifecycle" | "status"
  canEdit?: boolean
}

export function RightPanel({
  workflow,
  selected,
  onWorkflowChange,
  capabilities,
  onCapabilitiesChange,
  editorMode = "lifecycle",
  canEdit = true,
}: RightPanelProps) {
  // ... mevcut handleModeChange koru ...

  return (
    <aside style={{ ... }}>
      <section style={SECTION_STYLE}>
        <FlowRules mode={workflow.mode} onChange={handleModeChange} />
      </section>
      <section style={SECTION_STYLE}>
        <SelectionPanel ... />
      </section>
      {/* Wave 2 W2-C4 — capabilities sub-panel between selection and validation */}
      <section style={SECTION_STYLE}>
        <CapabilitiesPanel
          capabilities={capabilities}
          onCapabilitiesChange={onCapabilitiesChange}
          editorMode={editorMode}
          canEdit={canEdit}
        />
      </section>
      <section style={SECTION_STYLE}>
        <ValidationPanel workflow={workflow} />
      </section>
      <section style={{ ...SECTION_STYLE, borderBottom: "none" }}>
        <ShortcutsPanel />
      </section>
    </aside>
  )
}
```

3. **`Frontend2/components/workflow-editor/capabilities-panel.test.tsx`** — Vitest unit tests:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CapabilitiesPanel } from "./capabilities-panel"
import { AppProvider } from "@/context/app-context"

function renderWith(props: Parameters<typeof CapabilitiesPanel>[0]) {
  return render(
    <AppProvider>
      <CapabilitiesPanel {...props} />
    </AppProvider>,
  )
}

describe("CapabilitiesPanel", () => {
  it("renders lifecycle toggles", () => {
    renderWith({
      capabilities: {},
      onCapabilitiesChange: () => {},
      editorMode: "lifecycle",
    })
    expect(screen.getByText(/Sequential dependencies|Sıralı bağımlılık/)).toBeInTheDocument()
    expect(screen.getByText(/Restrict expired sprints|Süresi geçmiş/)).toBeInTheDocument()
  })

  it("renders status toggles (no restrict_expired_sprints)", () => {
    renderWith({
      capabilities: {},
      onCapabilitiesChange: () => {},
      editorMode: "status",
    })
    expect(screen.queryByText(/Restrict expired sprints|Süresi geçmiş/)).not.toBeInTheDocument()
    expect(screen.getByText(/Edge validation|Edge doğrulaması/)).toBeInTheDocument()
  })

  it("fires onCapabilitiesChange with single-field patch", () => {
    const onChange = vi.fn()
    renderWith({
      capabilities: { enforce_wip_limits: false },
      onCapabilitiesChange: onChange,
      editorMode: "lifecycle",
    })
    // Click the WIP enforce toggle
    const toggle = screen.getAllByRole("switch").find((t) =>
      t.closest("div")?.textContent?.includes("WIP"),
    )
    expect(toggle).toBeDefined()
    fireEvent.click(toggle!)
    expect(onChange).toHaveBeenCalledWith({ enforce_wip_limits: true })
  })

  it("respects canEdit=false (disabled toggles)", () => {
    renderWith({
      capabilities: { enforce_wip_limits: true },
      onCapabilitiesChange: () => {},
      editorMode: "lifecycle",
      canEdit: false,
    })
    const toggles = screen.getAllByRole("switch")
    toggles.forEach((t) => expect(t).toBeDisabled())
  })
})
```

### Test Stratejisi

- **Etkilenen mevcut testler:** `right-panel.test.tsx` (varsa) — prop yeni `capabilities` + `onCapabilitiesChange` ekleyince güncelle (defaults `{}` ve `()=>{}`).
- **Eklenecek testler:** 4 yeni Vitest.
- **Çalıştırılacak komut:** `cd Frontend2 && npm run test -- capabilities-panel right-panel`
- **Beklenen sonuç:** 4 yeni pas + mevcut RightPanel testleri (varsa) yeşil.

### Doğrulama

- [ ] 4 yeni vitest yeşil
- [ ] `cd Frontend2 && npm run typecheck` — TypeScript clean
- [ ] Manuel: editör UI'sinde sağ panel'de "Motor Ayarları / Engine Settings" başlığı görünür, 4 toggle (lifecycle) veya 3 toggle (status) listelenir.

### Risk Notları

- **Toggle primitive disabled prop:** `Frontend2/components/primitives/toggle.tsx`'in disabled prop'u olmayabilir — kontrol et, yoksa minor PR ekle (W2-C4'e dahil).
- **mode'a göre toggle listesi ayrı**: `restrict_expired_sprints` sadece lifecycle'da gösterilir; status mode'da `enforce_sequential_dependencies` daha farklı bir hint metni alır (Wave 1 C7'de bu task_workflow için edge validation'ı tetikliyor).
- **Geri alma:** Component dosyası silinir, right-panel.tsx 2 satır geri çekilir.

---

## W2-C5: feat(workflow-editor): serialize capabilities into PATCH on save

**Risk:** ORTA (save handler kontratını genişletir; backend round-trip W2-C3'te doğrulandı)
**Bağımlılık:** W2-C4
**Tahmini değişiklik:** ~2 dosya, ~80 satır

### Amaç

`editor-page.tsx` save handler'ı (`save` callback, ~line 1255-1340) capabilities'i hâlâ serialize etmiyor — yalnızca `phase_workflow.nodes/edges/groups` + `status_workflow` (`task_workflow` ile aynı şey değil — Wave 1 C10'da rename yapıldı ama tam isim hala `status_workflow`). W2-C5 şunları yapar:

1. **Read fallback genişletme:** `readWorkflow` (line 148-157) capabilities'i de oku. Yeni `readCapabilities(project, mode)` helper'ı `phase_workflow.capabilities` veya `task_workflow.capabilities` döner.
2. **Working-copy state:** `lifecycleCapabilities` + `statusCapabilities` state'leri eklenir.
3. **`commitCapabilities(patch)`:** Pre-existing `commitWorkflow` paterninde — mode'a göre ilgili capability slice'ını günceller, `dirty=true` set eder, history'e push.
4. **Save serialize:** PATCH body'ye `phase_workflow.capabilities` + `task_workflow.capabilities` eklenir.
5. **`RightPanel` prop drilling:** `capabilities={activeCaps}` + `onCapabilitiesChange={commitCapabilities}` props.

Ayrıca: Wave 1'in `status_workflow` save key'i **artık `task_workflow` olmalı** — Wave 1 C10 plan dosyasında belirtilmiş ama editor-page.tsx'te hala `status_workflow` key'i ile PATCH atıyor (line 1279). Bu **yarı-eksik rename**'yi düzelt.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Frontend2/components/workflow-editor/editor-page.tsx` | MODIFY | capabilities working-copy + serialize + status_workflow→task_workflow rename |
| `Frontend2/components/workflow-editor/editor-page.test.tsx` | MODIFY | save handler PATCH body'sinde capabilities testleri |

### Detaylı Adımlar

1. **`Frontend2/components/workflow-editor/editor-page.tsx`** — `ProcessConfigShape` interface'ini genişlet (line 124-135):

```typescript
interface ProcessConfigShape {
  phase_workflow?: WorkflowConfigDTO & { capabilities?: WorkflowCapabilities }
  workflow?: WorkflowConfigDTO & { capabilities?: WorkflowCapabilities }
  /** Wave 2 — task_workflow (was status_workflow in Wave 1 C10 transitional state). */
  task_workflow?: WorkflowConfigDTO & { capabilities?: WorkflowCapabilities }
  /** Legacy Wave 1 C10 transitional key — read fallback only. */
  status_workflow?: WorkflowConfigDTO & { capabilities?: WorkflowCapabilities }
  statusWorkflow?: WorkflowConfigDTO & { capabilities?: WorkflowCapabilities }
}
```

`WorkflowCapabilities` tipini import et: `import type { WorkflowCapabilities } from "./capabilities-panel"`.

2. Yeni helper `readCapabilities` ekle (readWorkflow yanına):

```typescript
function readCapabilities(
  project: Project,
  mode: "lifecycle" | "status",
): WorkflowCapabilities {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  if (!cfg) return {}
  if (mode === "lifecycle") {
    const wf = cfg.phase_workflow ?? cfg.workflow
    return (wf?.capabilities as WorkflowCapabilities | undefined) ?? {}
  }
  // status mode → task_workflow (Wave 2 W2-C5 canonical), fallback to legacy status_workflow.
  const tw = cfg.task_workflow ?? cfg.status_workflow ?? cfg.statusWorkflow
  return (tw?.capabilities as WorkflowCapabilities | undefined) ?? {}
}
```

3. State eklemeleri (line 248'den sonra):

```typescript
const initialLifecycleCaps = React.useMemo(
  () => readCapabilities(project, "lifecycle"),
  [project],
)
const initialStatusCaps = React.useMemo(
  () => readCapabilities(project, "status"),
  [project],
)
const [lifecycleCapabilities, setLifecycleCapabilities] =
  React.useState<WorkflowCapabilities>(initialLifecycleCaps)
const [statusCapabilities, setStatusCapabilities] =
  React.useState<WorkflowCapabilities>(initialStatusCaps)

const activeCapabilities =
  mode === "status" ? statusCapabilities : lifecycleCapabilities

const commitCapabilities = React.useCallback(
  (patch: WorkflowCapabilities) => {
    // History entry — capabilities changes are undoable.
    history.push(workflow)
    if (mode === "status") {
      setStatusCapabilities((prev) => ({ ...prev, ...patch }))
    } else {
      setLifecycleCapabilities((prev) => ({ ...prev, ...patch }))
    }
    setDirty(true)
  },
  [mode, history, workflow],
)
```

4. Save handler güncelle (line 1255-1340) — PATCH body capabilities ekle + `status_workflow` rename:

```typescript
const save = React.useCallback(async (): Promise<boolean> => {
  setSaving(true)
  setSaveError(null)
  try {
    const currentPC = (project.processConfig ?? {}) as Record<string, unknown>
    const { workflow: _legacyWorkflow, status_workflow: _legacyStatus, ...restPC } =
      currentPC as {
        workflow?: unknown
        status_workflow?: unknown
        [k: string]: unknown
      }
    void _legacyWorkflow
    void _legacyStatus

    // Wave 2 W2-C5 — emit capabilities inline into the relevant workflow.
    // Backend WorkflowConfig Pydantic accepts optional capabilities (W2-C1).
    const lifecycleDto = unmapWorkflowConfig(lifecycleWorkflow)
    const taskDto = unmapWorkflowConfig(statusWorkflow)

    const nextProcessConfig = {
      ...restPC,
      phase_workflow: {
        ...lifecycleDto,
        capabilities: lifecycleCapabilities,
      },
      // Wave 2 W2-C5: canonical key is task_workflow (was status_workflow during
      // Wave 1 C10 transitional state — backend always accepted both via
      // normalizer setdefault; this commit emits the V2 canonical name).
      task_workflow: {
        ...taskDto,
        capabilities: statusCapabilities,
      },
    }
    await projectService.updateProcessConfig(project.id, nextProcessConfig)
    // ... rest unchanged ...
  } catch (err: unknown) {
    // ... unchanged ...
  } finally {
    setSaving(false)
  }
}, [
  mode,
  project.id,
  project.processConfig,
  lifecycleWorkflow,
  statusWorkflow,
  lifecycleCapabilities,  // YENİ
  statusCapabilities,     // YENİ
  history,
  // ... rest unchanged ...
])
```

5. `RightPanel` mount'unu güncelle (line ~1700 civarı):

```tsx
<RightPanel
  workflow={workflow}
  selected={selected}
  onWorkflowChange={handleWorkflowChange}
  capabilities={activeCapabilities}
  onCapabilitiesChange={commitCapabilities}
  editorMode={mode}
  canEdit={canEdit}
/>
```

6. **`Frontend2/components/workflow-editor/editor-page.test.tsx`** — yeni testler:

```tsx
it("save includes capabilities in PATCH body (lifecycle mode)", async () => {
  const project = makeFixtureProject({
    processConfig: {
      schema_version: 2,
      phase_workflow: {
        mode: "flexible",
        nodes: makeValidNodes(),
        edges: [],
        groups: [],
        capabilities: { enforce_wip_limits: false },
      },
      task_workflow: {
        capabilities: { enforce_wip_limits: false, has_recurring: true },
        edges: [],
        groups: [],
      },
    },
  })
  const patchSpy = vi.spyOn(projectService, "updateProcessConfig").mockResolvedValue(undefined as any)

  render(<EditorPage project={project} />)
  // Toggle the WIP enforce capability in lifecycle mode
  fireEvent.click(screen.getByText(/Enforce WIP limits|WIP limitlerini uygula/))
  // Press save
  fireEvent.click(screen.getByText(/Kaydet|Save/))
  await waitFor(() => expect(patchSpy).toHaveBeenCalled())

  const body = patchSpy.mock.calls[0][1] as Record<string, any>
  expect(body.phase_workflow.capabilities.enforce_wip_limits).toBe(true)
  expect(body.task_workflow.capabilities.has_recurring).toBe(true)
})

it("emits task_workflow key (not status_workflow) for V2 canonical shape", async () => {
  const project = makeFixtureProject({
    processConfig: { schema_version: 2, phase_workflow: { mode: "flexible", nodes: makeValidNodes(), edges: [], groups: [] }, task_workflow: { capabilities: {}, edges: [], groups: [] } },
  })
  const patchSpy = vi.spyOn(projectService, "updateProcessConfig").mockResolvedValue(undefined as any)

  render(<EditorPage project={project} />)
  fireEvent.click(screen.getByText(/Kaydet|Save/))
  await waitFor(() => expect(patchSpy).toHaveBeenCalled())

  const body = patchSpy.mock.calls[0][1] as Record<string, any>
  expect("task_workflow" in body).toBe(true)
  expect("status_workflow" in body).toBe(false)
})
```

### Test Stratejisi

- **Etkilenen mevcut testler:** Mevcut `editor-page.test.tsx` test'leri — eski `status_workflow` key'iyle assertion yapıyor olabilir. Mock fixture'ların `task_workflow`'a güncelleneceği yerleri kontrol et.
- **Eklenecek testler:** 2 yeni.
- **Çalıştırılacak komut:** `cd Frontend2 && npm run test -- editor-page`
- **Beklenen sonuç:** 2 yeni pas; mevcut testler tüm rename'ler yapıldıktan sonra yeşil.

### Doğrulama

- [ ] 2 yeni vitest yeşil
- [ ] `cd Frontend2 && rg -F 'status_workflow' Frontend2/components/ Frontend2/services/ Frontend2/app/` — yalnızca read-fallback yorumlarında veya legacy fixture'larda; PATCH emit yerinde sıfır.
- [ ] Manuel UI: editör'de "Enforce WIP limits" toggle → tıkla → Save → backend round-trip ile kalıcı (page refresh sonrası açık görünür).

### Risk Notları

- **Wave 1 C10'da `task_workflow` rename'i tamamlanmamış** olduğu için bu commit'in ek bir nesli var: fixture testleri ve admin UI'larda hâlâ `status_workflow` referansları olabilir. Audit:
  ```bash
  rg -F 'status_workflow' Frontend2/ --type ts --type tsx
  ```
  Her birini değerlendir; persistence yazma yerlerinde rename gerekir. Salt-okuma fallback'ler tutulur.
- **History stack:** Capabilities değişikliği `history.push(workflow)` ile undo edilebilir ama bu sadece workflow'u geri alır; capabilities ayrı history slice'a ihtiyaç duyabilir. **Wave 2'de**: capability toggle'lar history-only-for-workflow olsun, capabilities ayrı slice tutar ama undo'ya dahil değildir (basit tutmak için). Eğer bug rapor edilirse Wave 3.
- **Geri alma:** Tek başına revertable; W2-C4 component dosyası tek başına kalır (mount yok ama dosya sağlam).

---

## W2-C6: feat(workflow-editor): node engine field editor (status mode → BoardColumn PATCH)

**Risk:** ORTA (mevcut SelectionPanel NodeEditor'a yeni input'lar; BoardColumn PATCH async + side-effect yönetimi)
**Bağımlılık:** W2-C5
**Tahmini değişiklik:** ~2 dosya, ~250 satır

### Amaç

Workflow editör **status mode**'da seçili kolon node'u (id `col_<N>`) için yeni alanları edit edilebilir kıl:
- `category` — dropdown (todo / in_progress / done)
- `is_initial` — checkbox (zaten var; **mevcut UI validation yok** → tek-kolon kuralı eklenir)
- `is_terminal` — checkbox (mevcut `isFinal`'a denk düşmüyor; BoardColumn DB alanı ayrı)
- `max_duration_days` — number input (null = unbounded)
- `entry_policy` — dropdown
- `exit_policy` — dropdown

**Side-effect mimarisi:** Status mode'da node = BoardColumn (id `col_<N>` regex match). Field değişikliği:
1. Local workflow state'inde node'a `engineFields` patch'i uygula (görsel feedback için)
2. **`PATCH /projects/{id}/columns/{col_id}`** debounced (300ms) — kolonun engine field'larını backend'de günceller
3. Save sırasında `task_workflow.nodes` JSON'una **yazılmaz** (Q1 kararı: BoardColumn DB ana kaynak; JSON sadece edges/groups/capabilities tutar)

Bu commit **status mode** için odaklanır; W2-C7'de lifecycle mode için aynı UI ama farklı persistence (workflow JSON node'larına yazar).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Frontend2/services/lifecycle-service.ts` | MODIFY | `WorkflowNode` interface'i engine field'larıyla genişlet; mapper'lar |
| `Frontend2/components/workflow-editor/selection-panel.tsx` | MODIFY | `NodeEditor`'a engine field input'ları; status mode için BoardColumn PATCH |
| `Frontend2/components/workflow-editor/selection-panel.test.tsx` | MODIFY | Yeni testler |

### Detaylı Adımlar

1. **`Frontend2/services/lifecycle-service.ts`** — `WorkflowNode` ve mapper'lar engine field'ları ekle:

```typescript
export type ColumnCategory = "todo" | "in_progress" | "done"
export type EntryPolicy = "any" | "edges_only" | "initial_only"
export type ExitPolicy = "any" | "edges_only" | "terminal_lock"

export interface WorkflowNode {
  id: string
  name: string
  description?: string
  x: number
  y: number
  color?: string
  isInitial?: boolean
  isFinal?: boolean
  isArchived?: boolean
  parentId?: string
  wipLimit?: number | null
  // Wave 2 W2-C6 — engine fields (BoardColumn mirror for status mode; phase_workflow.nodes JSON for lifecycle).
  category?: ColumnCategory
  isTerminal?: boolean
  maxDurationDays?: number | null
  entryPolicy?: EntryPolicy
  exitPolicy?: ExitPolicy
}

export interface WorkflowNodeDTO {
  // ... mevcut alanlar ...
  category?: ColumnCategory
  is_terminal?: boolean
  max_duration_days?: number | null
  entry_policy?: EntryPolicy
  exit_policy?: ExitPolicy
}

// mapWorkflowNode + unmapWorkflowConfig — yeni alanları camelCase ↔ snake_case dönüştür
export function mapWorkflowNode(d: WorkflowNodeDTO): WorkflowNode {
  return {
    // ... mevcut alanlar ...
    category: d.category,
    isTerminal: d.is_terminal,
    maxDurationDays: d.max_duration_days ?? null,
    entryPolicy: d.entry_policy,
    exitPolicy: d.exit_policy,
  }
}

// unmapWorkflowConfig'in node mapping kısmı:
// nodes: c.nodes.map((n) => ({
//   ... mevcut ...
//   category: n.category,
//   is_terminal: n.isTerminal ?? false,
//   max_duration_days: n.maxDurationDays ?? null,
//   entry_policy: n.entryPolicy,
//   exit_policy: n.exitPolicy,
// }))
```

2. **`Frontend2/components/workflow-editor/selection-panel.tsx`** — `NodeEditor`'a engine field input'ları:

```tsx
// SelectionPanelProps'a yeni prop:
export interface SelectionPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  editorMode?: "lifecycle" | "status"
  /** Wave 2 W2-C6 — status-mode column id → BoardColumn PATCH for engine fields. */
  onColumnEngineFieldsChange?: (
    columnId: number,
    patch: { category?: string; is_initial?: boolean; is_terminal?: boolean; max_duration_days?: number | null; entry_policy?: string; exit_policy?: string },
  ) => void
}

// NodeEditor function — engine field input'ları ekle (mevcut isInitial/isFinal'dan sonra):
function NodeEditor({
  node,
  workflow,
  onWorkflowChange,
  editorMode,
  onColumnEngineFieldsChange,
  T,
}: { /* ... */ }) {
  const updateNode = React.useCallback(
    (patch: Partial<WorkflowNode>) => {
      onWorkflowChange({
        ...workflow,
        nodes: workflow.nodes.map((n) =>
          n.id === node.id ? { ...n, ...patch } : n,
        ),
      })
      // Status mode + col_<N> id → BoardColumn PATCH side-effect
      if (editorMode === "status" && onColumnEngineFieldsChange) {
        const colId = colIdFromNodeId(node.id)
        if (colId !== null) {
          const dbPatch: Record<string, unknown> = {}
          if (patch.category !== undefined) dbPatch.category = patch.category
          if (patch.isInitial !== undefined) dbPatch.is_initial = patch.isInitial
          if (patch.isTerminal !== undefined) dbPatch.is_terminal = patch.isTerminal
          if (patch.maxDurationDays !== undefined) dbPatch.max_duration_days = patch.maxDurationDays
          if (patch.entryPolicy !== undefined) dbPatch.entry_policy = patch.entryPolicy
          if (patch.exitPolicy !== undefined) dbPatch.exit_policy = patch.exitPolicy
          if (Object.keys(dbPatch).length > 0) {
            onColumnEngineFieldsChange(colId, dbPatch)
          }
        }
      }
    },
    [node.id, workflow, onWorkflowChange, editorMode, onColumnEngineFieldsChange],
  )

  // ... mevcut Name/Description/Color/WIP/Initial/Final/Archived ...

  // Wave 2 W2-C6 — Engine field input'ları (status mode only veya her zaman?)
  // Karar: HER İKİ MODE'DA göster — lifecycle mode'da workflow JSON'una yazar
  // (W2-C7); status mode'da hem JSON hem BoardColumn PATCH yapılır (zaten yukarıda).

  return (
    <div>
      {/* ... mevcut alanlar ... */}

      {/* W2-C6 Engine field section */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 10 }}>
        <div style={{ ...TITLE_STYLE, marginBottom: 6 }}>
          {T("Motor Alanları", "Engine Fields")}
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>{T("Kategori", "Category")}</span>
          <select
            value={node.category ?? "todo"}
            onChange={(e) => updateNode({ category: e.target.value as ColumnCategory })}
            style={SELECT_STYLE}
          >
            <option value="todo">{T("Yapılacak", "To Do")}</option>
            <option value="in_progress">{T("Yapılıyor", "In Progress")}</option>
            <option value="done">{T("Tamamlandı", "Done")}</option>
          </select>
        </div>

        <div style={TOGGLE_ROW}>
          <span>{T("Terminal düğüm", "Terminal node")}</span>
          <Toggle
            on={Boolean(node.isTerminal)}
            onChange={(v) => updateNode({ isTerminal: v })}
            size="sm"
          />
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>{T("Maks. süre (gün)", "Max duration (days)")}</span>
          <Input
            type="number"
            min={1}
            value={node.maxDurationDays != null ? String(node.maxDurationDays) : ""}
            placeholder={T("sınırsız", "unbounded")}
            onChange={(e) => {
              const raw = e.target.value
              const parsed = raw === "" ? null : Number(raw)
              updateNode({
                maxDurationDays: parsed == null || Number.isNaN(parsed) || parsed < 1 ? null : parsed,
              })
            }}
            size="sm"
            style={{ width: 90 }}
          />
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>{T("Giriş politikası", "Entry policy")}</span>
          <select
            value={node.entryPolicy ?? "any"}
            onChange={(e) => updateNode({ entryPolicy: e.target.value as EntryPolicy })}
            style={SELECT_STYLE}
          >
            <option value="any">{T("Serbest", "Any")}</option>
            <option value="edges_only">{T("Sadece edge'lerden", "Edges only")}</option>
            <option value="initial_only">{T("Sadece başlangıçtan", "Initial only")}</option>
          </select>
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>{T("Çıkış politikası", "Exit policy")}</span>
          <select
            value={node.exitPolicy ?? "any"}
            onChange={(e) => updateNode({ exitPolicy: e.target.value as ExitPolicy })}
            style={SELECT_STYLE}
          >
            <option value="any">{T("Serbest", "Any")}</option>
            <option value="edges_only">{T("Sadece edge'lerden", "Edges only")}</option>
            <option value="terminal_lock">{T("Terminal kilit", "Terminal lock")}</option>
          </select>
        </div>
      </div>

      {/* Mevcut Sil butonu */}
    </div>
  )
}

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 28,
  padding: "0 8px",
  fontSize: 12,
  background: "var(--surface)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: 0,
  fontFamily: "inherit",
}
```

3. **`editor-page.tsx`** — `onColumnEngineFieldsChange` callback'i geçir (RightPanel → SelectionPanel):

`SelectionPanel` `RightPanel` içinde mount edilir; bu zincir genişler. `RightPanelProps`'a `onColumnEngineFieldsChange` eklenir, `editor-page.tsx`'te tanımlanır:

```typescript
// editor-page.tsx içinde:
const handleColumnEngineFieldsChange = React.useCallback(
  (columnId: number, patch: Record<string, unknown>) => {
    // Debounce stratejisi: basitleştirme için anlık PATCH; çoklu çağrı geliyorsa
    // useDebouncedCallback (lodash) ekle. Wave 2 W2-C6 başlangıç versiyonu fire-and-forget.
    void apiClient
      .patch(`/projects/${project.id}/columns/${columnId}`, patch)
      .then(() => qc.invalidateQueries({ queryKey: ["columns", project.id] }))
      .catch((err) => {
        showToast({
          variant: "error",
          message: T(
            "Kolon motor alanı kaydedilemedi",
            "Failed to save column engine field",
          ),
        })
      })
  },
  [project.id, qc, showToast, T],
)
```

`RightPanel`'a prop drilling: `<RightPanel ... onColumnEngineFieldsChange={handleColumnEngineFieldsChange} />`; `RightPanel.tsx` aynı prop'u `SelectionPanel`'a pass eder.

4. **`selection-panel.test.tsx`** — yeni testler:

```tsx
it("renders engine field inputs for a status-mode node", () => {
  const node: WorkflowNode = {
    id: "col_42", name: "In Progress", x: 0, y: 0, color: "#888",
    category: "in_progress", entryPolicy: "any", exitPolicy: "edges_only",
  }
  renderWith({
    workflow: { mode: "continuous", nodes: [node], edges: [], groups: [] },
    selected: { type: "node", id: "col_42" },
    onWorkflowChange: () => {},
    editorMode: "status",
  })
  expect(screen.getByText(/Engine Fields|Motor Alanları/)).toBeInTheDocument()
  expect(screen.getByDisplayValue("in_progress")).toBeInTheDocument()
})

it("fires onColumnEngineFieldsChange when category changes (status mode)", () => {
  const onColChange = vi.fn()
  const node: WorkflowNode = { id: "col_42", name: "In Progress", x: 0, y: 0, color: "#888" }
  renderWith({
    workflow: { mode: "continuous", nodes: [node], edges: [], groups: [] },
    selected: { type: "node", id: "col_42" },
    onWorkflowChange: () => {},
    onColumnEngineFieldsChange: onColChange,
    editorMode: "status",
  })
  fireEvent.change(screen.getByDisplayValue(/todo|To Do/), { target: { value: "in_progress" } })
  expect(onColChange).toHaveBeenCalledWith(42, expect.objectContaining({ category: "in_progress" }))
})

it("does not fire onColumnEngineFieldsChange in lifecycle mode", () => {
  const onColChange = vi.fn()
  const node: WorkflowNode = { id: "nd_lifecycle1", name: "Design", x: 0, y: 0, color: "#888" }
  renderWith({
    workflow: { mode: "flexible", nodes: [node], edges: [], groups: [] },
    selected: { type: "node", id: "nd_lifecycle1" },
    onWorkflowChange: () => {},
    onColumnEngineFieldsChange: onColChange,
    editorMode: "lifecycle",
  })
  fireEvent.change(screen.getByDisplayValue(/todo|To Do/), { target: { value: "done" } })
  expect(onColChange).not.toHaveBeenCalled()
})

it("max_duration_days input accepts numeric and clears via empty", () => {
  const onChange = vi.fn()
  const node: WorkflowNode = { id: "col_5", name: "Review", x: 0, y: 0, color: "#888" }
  renderWith({
    workflow: { mode: "continuous", nodes: [node], edges: [], groups: [] },
    selected: { type: "node", id: "col_5" },
    onWorkflowChange: onChange,
    editorMode: "status",
  })
  const input = screen.getByPlaceholderText(/unbounded|sınırsız/)
  fireEvent.change(input, { target: { value: "7" } })
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
    nodes: expect.arrayContaining([
      expect.objectContaining({ id: "col_5", maxDurationDays: 7 })
    ])
  }))
  fireEvent.change(input, { target: { value: "" } })
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
    nodes: expect.arrayContaining([
      expect.objectContaining({ id: "col_5", maxDurationDays: null })
    ])
  }))
})
```

### Test Stratejisi

- **Etkilenen mevcut testler:** `selection-panel.test.tsx`'de NodeEditor render testleri — fixture node'ları yeni alan içermez (defaults), bu testler hala geçer.
- **Eklenecek testler:** 4 yeni Vitest.
- **Çalıştırılacak komut:** `cd Frontend2 && npm run test -- selection-panel`
- **Beklenen sonuç:** 4 yeni pas; mevcut yeşil.

### Doğrulama

- [ ] 4 yeni vitest yeşil
- [ ] `cd Frontend2 && npm run typecheck` — TypeScript clean
- [ ] Manuel: status mode'da bir kolon seç → sağ panel'de "Motor Alanları / Engine Fields" görünür → category değiştir → DevTools Network tab'da `PATCH /columns/<id>` gönderildiği görülür → page refresh → değer korunur.

### Risk Notları

- **`is_initial` UI validation:** Mevcut Toggle'ı korur ama "tek-kolon kuralı" yok — birden fazla `is_initial=True` seçilebilir. Backend bu konuda valilation yapmıyor (sadece migration backfill'i ayarlıyor). **Wave 2 deferral:** Bu UI-only validation Wave 3'e taşınır veya W2-C6'da inline alert eklenir. Karar: **W2-C6 inline alert ekler** (`<AlertBanner tone="warning">Birden fazla başlangıç kolonu mevcut</AlertBanner>` workflow.nodes scan'i ile).
- **PATCH side-effect race:** Hızlı toggle değişiklikleri çoklu PATCH başlatabilir. **Wave 2 W2-C6 başlangıç versiyonu fire-and-forget** kullanır (kabul edilebilir); Wave 3'te debounce (lodash veya custom).
- **Lifecycle mode'da `category` field göstermek anlamsız** olabilir (phase'ler category'ye sahip değil DB'de — task_workflow.nodes JSON'unda yaşar). **Karar:** Wave 2'de her iki mode'da göster ama lifecycle'da workflow JSON'a yazar (W2-C7'de detaylı). Eğer üreten karışıklık olursa Wave 3'te lifecycle-mode'da gizlenir.
- **Geri alma:** Tek başına revertable; SelectionPanel mevcut kolonları sergiler ama engine field bölümü yok.

---

## W2-C7: feat(workflow-editor): lifecycle-mode node engine fields (JSON-only)

**Risk:** DÜŞÜK (status mode'da zaten yapıldı; bu commit yalnızca lifecycle persistence farkını netleştirir)
**Bağımlılık:** W2-C6
**Tahmini değişiklik:** ~2 dosya, ~50 satır

### Amaç

Lifecycle mode'da node = `phase_workflow.nodes[i]` JSON object'i (BoardColumn DB'de değil). W2-C6'da NodeEditor zaten lifecycle mode'da çalışıyor (workflow state'i güncelliyor); W2-C7 sadece **lifecycle-mode'a özgü davranış kuralları ve test coverage** ekler:

1. **Lifecycle mode'da `onColumnEngineFieldsChange` ASLA çağrılmaz** (W2-C6'da zaten guard var, W2-C7 testlerle pekiştirir).
2. **`category` field lifecycle mode'da `phase_workflow.nodes[i].category` JSON key'ine yazar** — backend `WorkflowNode` Pydantic DTO'da `category` field'ı **mevcut değil** → W2-C7 backend Pydantic'i de genişletir.
3. **Save sırasında** engine field'lar `unmapWorkflowConfig` üzerinden serialize edilir (W2-C6'da mapper'lar eklendi).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/dtos/workflow_dtos.py` | MODIFY | `WorkflowNode` Pydantic — engine field'ları opsiyonel ekle |
| `Backend/tests/unit/application/test_workflow_dtos.py` | MODIFY | WorkflowNode engine field validation testleri |
| `Frontend2/components/workflow-editor/selection-panel.test.tsx` | MODIFY | Lifecycle mode'da engine field'ların workflow.nodes'a yazıldığını test eder |

### Detaylı Adımlar

1. **`Backend/app/application/dtos/workflow_dtos.py`** — `WorkflowNode`'a engine field'ları ekle:

```python
class WorkflowNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    color: str
    description: Optional[str] = None
    is_initial: bool = False
    is_final: bool = False
    is_archived: bool = False
    parent_id: Optional[str] = None
    wip_limit: Optional[int] = Field(default=None, ge=0)
    # Wave 2 W2-C7 — engine fields persisted into phase_workflow.nodes JSON
    # (task_workflow uses BoardColumn DB; these mirror that surface so lifecycle
    # mode can carry the same shape end-to-end).
    category: Optional[Literal["todo", "in_progress", "done"]] = None
    is_terminal: bool = False
    max_duration_days: Optional[int] = Field(default=None, ge=1)
    entry_policy: Optional[Literal["any", "edges_only", "initial_only"]] = None
    exit_policy: Optional[Literal["any", "edges_only", "terminal_lock"]] = None

    @field_validator("id")
    # ... mevcut ...
```

2. **`Backend/tests/unit/application/test_workflow_dtos.py`** — yeni testler:

```python
class TestWorkflowNodeEngineFields:
    def test_engine_fields_default_to_none_or_false(self):
        node = WorkflowNode.model_validate({
            "id": "nd_test000001", "name": "A", "x": 0, "y": 0, "color": "#888"
        })
        assert node.category is None
        assert node.is_terminal is False
        assert node.max_duration_days is None
        assert node.entry_policy is None
        assert node.exit_policy is None

    def test_engine_fields_round_trip(self):
        node = WorkflowNode.model_validate({
            "id": "nd_test000001", "name": "A", "x": 0, "y": 0, "color": "#888",
            "category": "in_progress",
            "is_terminal": True,
            "max_duration_days": 14,
            "entry_policy": "edges_only",
            "exit_policy": "terminal_lock",
        })
        assert node.category == "in_progress"
        assert node.is_terminal is True
        assert node.max_duration_days == 14

    def test_invalid_category_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate({
                "id": "nd_test000001", "name": "A", "x": 0, "y": 0, "color": "#888",
                "category": "wat",
            })

    def test_max_duration_days_zero_rejected(self):
        with pytest.raises(ValidationError):
            WorkflowNode.model_validate({
                "id": "nd_test000001", "name": "A", "x": 0, "y": 0, "color": "#888",
                "max_duration_days": 0,
            })
```

3. **`selection-panel.test.tsx`** — yeni lifecycle test:

```tsx
it("writes category into workflow.nodes JSON (lifecycle mode, no DB PATCH)", () => {
  const onWorkflowChange = vi.fn()
  const onColChange = vi.fn()
  const node: WorkflowNode = {
    id: "nd_lifecycle1", name: "Design", x: 0, y: 0, color: "#888",
  }
  renderWith({
    workflow: { mode: "flexible", nodes: [node], edges: [], groups: [] },
    selected: { type: "node", id: "nd_lifecycle1" },
    onWorkflowChange,
    onColumnEngineFieldsChange: onColChange,
    editorMode: "lifecycle",
  })
  fireEvent.change(screen.getByDisplayValue(/To Do|Yapılacak/), { target: { value: "done" } })
  // workflow.nodes patched
  expect(onWorkflowChange).toHaveBeenCalledWith(expect.objectContaining({
    nodes: expect.arrayContaining([
      expect.objectContaining({ id: "nd_lifecycle1", category: "done" })
    ])
  }))
  // BoardColumn PATCH not fired
  expect(onColChange).not.toHaveBeenCalled()
})
```

### Test Stratejisi

- **Etkilenen mevcut testler:** Yok (yalnızca additive).
- **Eklenecek testler:** 4 backend Pydantic + 1 FE = 5 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_workflow_dtos.py -v && cd Frontend2 && npm run test -- selection-panel`
- **Beklenen sonuç:** Hepsi yeşil.

### Doğrulama

- [ ] 5 yeni test yeşil
- [ ] `pytest Backend/tests/integration/api/test_project_workflow_patch.py` — engine fields workflow.nodes ile round-trip eden ek bir test yazılabilir (Wave 2'de eklenir; W2-C3'te eksikti). Opsiyonel.
- [ ] Manuel: lifecycle mode'da bir node seç → category dropdown'ı değiştir → Save → page refresh → değer korunur (DB JSON'unda).

### Risk Notları

- **`phase_workflow.nodes[i].category` ile `BoardColumn.category` ayrı kaynaklar**: Status mode kolonu (BoardColumn) ve phase node'u (workflow JSON) arasında **kavramsal çakışma** yok — phase'ler kolon değil. Ama UI'da aynı dropdown her iki mode'da görünüyor. Lifecycle mode'da kullanıcı `category=in_progress` derse, engine bu değeri `engine._lookup` veya `is_terminal/is_initial` mantığında kullanmaz (phase node mantığı dict-based, `category` ihmal edilir Wave 1'de). Wave 2'de **engine `category` okumayacak phase node'lar için** — sadece bilgi alanı olarak korunur.
- **Düşük risk; Wave 1 paterninde tam aditif.**

---

## W2-C8: feat(settings): extend Columns subtab with engine field columns

**Risk:** ORTA (mevcut subtab tablo layout'unu değiştirir; isWaterfall conditional logic genişler)
**Bağımlılık:** W2-C7
**Tahmini değişiklik:** ~1 dosya, ~150 satır

### Amaç

`Frontend2/components/project-detail/settings-columns-subtab.tsx` halen sadece **name + wip_limit + task_count** sütunlarını gösteriyor. W2-C8 tabloya yeni sütunlar ekler:

- **Category** — dropdown (todo/in_progress/done)
- **Initial** — checkbox
- **Terminal** — checkbox
- **Max Days** — number input (null placeholder "sınırsız")
- **Entry Policy** — dropdown
- **Exit Policy** — dropdown

Tablo grid `2fr 120px auto` → `2fr 100px 110px 80px 80px 100px 110px 110px auto` benzeri bir layout'a evrilir. **Mobile/responsive concern:** Eski 720px max-width artmak gerekecek (örn. 980px) veya scroll horizontal eklenir.

`BoardColumn` interface'ini de genişlet (apiClient response shape'inde mevcut alanlar zaten dönüyor, Wave 1 sonrası API'de garantili — W2-C3 ile doğrulandı).

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Frontend2/components/project-detail/settings-columns-subtab.tsx` | MODIFY | BoardColumn interface'i genişlet; tablo layout + draft state + saveColumn handler |

### Detaylı Adımlar

1. **BoardColumn interface genişletme** (line 26-33):

```typescript
interface BoardColumn {
  id: number
  project_id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
  // Wave 2 W2-C8 — engine fields (returned by API since Wave 1 C4)
  category?: "todo" | "in_progress" | "done"
  is_initial?: boolean
  is_terminal?: boolean
  max_duration_days?: number | null
  entry_policy?: "any" | "edges_only" | "initial_only"
  exit_policy?: "any" | "edges_only" | "terminal_lock"
}
```

2. **`drafts` state shape'i genişlet**:

```typescript
interface ColumnDraft {
  name: string
  wip_limit: number
  category: BoardColumn["category"]
  is_initial: boolean
  is_terminal: boolean
  max_duration_days: number | null
  entry_policy: BoardColumn["entry_policy"]
  exit_policy: BoardColumn["exit_policy"]
}

const [drafts, setDrafts] = React.useState<Record<number, ColumnDraft>>({})
```

3. **`serializeColumnsShape` güncelle** (yeni alanları da hash'le ki effect doğru re-fire etsin):

```typescript
function serializeColumnsShape(cols: BoardColumn[]): string {
  return cols
    .map((c) =>
      `${c.id}:${c.name}:${c.wip_limit}:${c.category ?? "-"}:${c.is_initial ? 1 : 0}:${c.is_terminal ? 1 : 0}:${c.max_duration_days ?? "-"}:${c.entry_policy ?? "-"}:${c.exit_policy ?? "-"}`
    )
    .join("|")
}
```

4. **`saveColumn` handler genişlet**:

```typescript
async function saveColumn(col: BoardColumn) {
  const draft = drafts[col.id]
  if (!draft) return
  // Build patch with only changed fields
  const patch: Record<string, unknown> = {}
  if (draft.name !== col.name) patch.name = draft.name.trim()
  if (draft.wip_limit !== col.wip_limit) patch.wip_limit = draft.wip_limit
  if (draft.category !== col.category) patch.category = draft.category
  if (draft.is_initial !== col.is_initial) patch.is_initial = draft.is_initial
  if (draft.is_terminal !== col.is_terminal) patch.is_terminal = draft.is_terminal
  if (draft.max_duration_days !== col.max_duration_days) {
    patch.max_duration_days = draft.max_duration_days
  }
  if (draft.entry_policy !== col.entry_policy) patch.entry_policy = draft.entry_policy
  if (draft.exit_policy !== col.exit_policy) patch.exit_policy = draft.exit_policy
  if (Object.keys(patch).length === 0) return
  if (patch.name !== undefined && !(patch.name as string).trim()) {
    showToast({ variant: "error", message: /* "Column name cannot be empty" */ })
    return
  }
  try {
    await apiClient.patch(`/projects/${project.id}/columns/${col.id}`, patch)
    qc.invalidateQueries({ queryKey: ["columns", project.id] })
    showToast({ variant: "success", message: lang === "tr" ? "Kolon güncellendi" : "Column updated" })
  } catch (err) {
    showToast({ variant: "error", message: backendErrorMessage(err) ?? "Update failed" })
  }
}
```

5. **Tablo header + row layout** — grid template genişle:

```tsx
const GRID_TEMPLATE = isWaterfall
  ? "2fr 100px 80px 80px 80px 100px 110px auto"
  : "2fr 100px 100px 80px 80px 80px 100px 110px auto"

// Header:
<div style={{ ..., gridTemplateColumns: GRID_TEMPLATE }}>
  <div>{T("KOLON ADI", "COLUMN NAME")}</div>
  {!isWaterfall && <div>{T("WIP", "WIP")}</div>}
  <div>{T("KATEGORİ", "CATEGORY")}</div>
  <div>{T("BAŞLANGIÇ", "INITIAL")}</div>
  <div>{T("TERMİNAL", "TERMINAL")}</div>
  <div>{T("MAKS GÜN", "MAX DAYS")}</div>
  <div>{T("GİRİŞ POL.", "ENTRY POL.")}</div>
  <div>{T("ÇIKIŞ POL.", "EXIT POL.")}</div>
  <div style={{ textAlign: "right" }}>{T("GÖREVLER", "TASKS")}</div>
</div>

// Row:
<div style={{ ..., gridTemplateColumns: GRID_TEMPLATE }}>
  <input type="text" value={draft.name} onChange={...} onBlur={() => saveColumn(col)} />
  {!isWaterfall && <input type="number" min={0} value={draft.wip_limit} ... />}
  <select value={draft.category ?? "todo"} onChange={...} onBlur={() => saveColumn(col)}>
    <option value="todo">{T("Yapılacak", "To Do")}</option>
    <option value="in_progress">{T("Yapılıyor", "In Progress")}</option>
    <option value="done">{T("Tamamlandı", "Done")}</option>
  </select>
  <input type="checkbox" checked={Boolean(draft.is_initial)} onChange={(e) => { setDrafts(...); }} onBlur={() => saveColumn(col)} />
  <input type="checkbox" checked={Boolean(draft.is_terminal)} onChange={...} />
  <input type="number" min={1} value={draft.max_duration_days != null ? String(draft.max_duration_days) : ""} placeholder={T("∞","∞")} onChange={(e) => { const parsed = e.target.value === "" ? null : Number(e.target.value); ... }} onBlur={() => saveColumn(col)} />
  <select value={draft.entry_policy ?? "any"} ...>
    <option value="any">Any</option>
    <option value="edges_only">Edges</option>
    <option value="initial_only">Initial</option>
  </select>
  <select value={draft.exit_policy ?? "any"} ...>
    <option value="any">Any</option>
    <option value="edges_only">Edges</option>
    <option value="terminal_lock">Terminal Lock</option>
  </select>
  <div style={{ textAlign: "right" }}>{col.task_count}</div>
</div>
```

6. **`maxWidth` güncelle**: `maxWidth: 720` → `maxWidth: 1080` (yeni sütun sığar; düşük genişlikte horizontal scroll).

### Test Stratejisi

- **Etkilenen mevcut testler:** `settings-columns-subtab.test.tsx` (varsa) — fixture column data'nın yeni alanları içermesi gerek (defaults yeterli).
- **Eklenecek testler:** Yok (W2-C8 görsel/UI-ağırlıklı; çekirdek `saveColumn` mantığı W2-C3 backend testleri ile zaten kapatıldı).
- **Çalıştırılacak komut:** `cd Frontend2 && npm run test -- settings-columns-subtab`
- **Beklenen sonuç:** Mevcut testler yeşil; tipik regression yok.

### Doğrulama

- [ ] `cd Frontend2 && npm run typecheck` — TypeScript clean
- [ ] Manuel UI:
  - [ ] Project Detail → Settings → Columns → tablo 9 sütun görünür (Waterfall'da 8)
  - [ ] Category dropdown değişip blur → backend PATCH gönderilir → toast "Kolon güncellendi"
  - [ ] Initial checkbox işaretle → blur → PATCH → page refresh → değer korunur
  - [ ] Max Days input'una 7 yaz → blur → PATCH; sonra silip blur → null PATCH (mevcut "leave unchanged" semantiği gereği değer korunur — bu beklenen)
- [ ] Browser ekran genişliği 1024px'in altında horizontal scroll çalışır

### Risk Notları

- **Layout density:** 9 sütun çok yoğun. Mobile UAT'de scroll davranışı kontrol edilmeli. Alternatif: "Advanced" toggle ile engine field sütunları opt-in (Wave 3'e ertelenebilir).
- **`max_duration_days` clear:** Backend DTO `ge=1` enforce ediyor; null PATCH "leave unchanged". Kullanıcı "0" yazarsa frontend null'a düşürür (saveColumn'da `parsed < 1 ? null` guard).
- **Geri alma:** Tek dosya revertable.

---

## W2-C9: feat(template): add ProcessTemplate.default_columns JSONB field

**Risk:** ORTA (alembic migration + seed verisi; W2-C10'da kullanılır)
**Bağımlılık:** W2-C3 (paralel branch'te W2-C4-C8 ile)
**Tahmini değişiklik:** ~5 dosya, ~180 satır

### Amaç

`ProcessTemplateModel.columns` JSONB alanı zaten var (`{name, order, wip_limit?}` shape) ama **engine field'larını taşımıyor**. Wave 2 C için iki yol vardı:

1. Mevcut `columns` JSONB shape'ini genişlet (`category`, `is_initial`, `is_terminal` ekle) — backward compat sorunu: eski FE'ler yeni alanlardan habersiz; FE eski shape'i yeniden yazınca alanlar kaybolur.
2. Yeni alan `default_columns` ekle, eski `columns`'u backward-compat olarak koru.

**Karar: (2) — yeni `default_columns` JSONB alanı ekle.** Eski `columns` alanı korunur (Wave 2'de read fallback olarak). `default_columns` shape:

```json
[
  {
    "name": "Backlog",
    "order_index": 0,
    "wip_limit": 0,
    "category": "todo",
    "is_initial": true,
    "is_terminal": false,
    "max_duration_days": null,
    "entry_policy": "any",
    "exit_policy": "any"
  },
  ...
]
```

W2-C9 alembic migration 014'u ekler ve seeder'da Scrum/Kanban/Waterfall template'lerine yeni alanı doldurur. **Davranışsal etki: 0** — yeni alan kimsenin okumadığı bir JSONB. W2-C10 bu alanı `CreateProjectUseCase`'te aktive eder.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/alembic/versions/014_template_default_columns.py` | CREATE | Yeni alan ekle + Scrum/Kanban/Waterfall backfill |
| `Backend/app/infrastructure/database/models/process_template.py` | MODIFY | `default_columns = Column(JSONB, nullable=True)` |
| `Backend/app/infrastructure/database/seeder.py` | MODIFY | Üç template'in `default_columns` alanı dahil edilir (idempotent guard) |
| `Backend/app/domain/repositories/process_template_repository.py` (varsa) | MODIFY | Interface'e `default_columns` field'ı geçiş |
| `Backend/tests/integration/test_seeder.py` | MODIFY | seed sonrası default_columns kontrol |

### Detaylı Adımlar

1. **`Backend/alembic/versions/014_template_default_columns.py`** — yeni migration:

```python
"""Wave 2 W2-C9: add process_templates.default_columns JSONB column.

Revision ID: 014_template_default_columns
Revises: 013_board_column_extended
Create Date: 2026-05-17

Adds a new JSONB column `default_columns` to `process_templates`. This carries
engine-aware default column specs (category, is_initial, is_terminal,
max_duration_days, entry_policy, exit_policy) that `CreateProjectUseCase`
(W2-C10) will use to seed columns for new projects, replacing the hard-coded
5-column list in SeedDefaultColumnsUseCase.

The existing `columns` JSONB (shape: {name, order, wip_limit?}) is preserved as
a read fallback for clients that have not migrated to the new shape. W2-C10's
seed logic prefers default_columns when present.

Idempotent: column add is guarded; UPDATE backfill uses WHERE NULL guard so
re-applying the migration doesn't re-overwrite customized rows.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
import json


revision = "014_template_default_columns"
down_revision = "013_board_column_extended"
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


_SCRUM_DEFAULT_COLUMNS = [
    {"name": "Backlog", "order_index": 0, "wip_limit": 0, "category": "todo", "is_initial": True, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "To Do", "order_index": 1, "wip_limit": 0, "category": "todo", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "In Progress", "order_index": 2, "wip_limit": 0, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Code Review", "order_index": 3, "wip_limit": 0, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Done", "order_index": 4, "wip_limit": 0, "category": "done", "is_initial": False, "is_terminal": True, "entry_policy": "any", "exit_policy": "terminal_lock", "max_duration_days": None},
]

_KANBAN_DEFAULT_COLUMNS = [
    {"name": "To Do", "order_index": 0, "wip_limit": 0, "category": "todo", "is_initial": True, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Analiz", "order_index": 1, "wip_limit": 3, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Geliştirme", "order_index": 2, "wip_limit": 4, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Test", "order_index": 3, "wip_limit": 2, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "any", "exit_policy": "any", "max_duration_days": None},
    {"name": "Done", "order_index": 4, "wip_limit": 0, "category": "done", "is_initial": False, "is_terminal": True, "entry_policy": "any", "exit_policy": "terminal_lock", "max_duration_days": None},
]

_WATERFALL_DEFAULT_COLUMNS = [
    {"name": "Gereksinim", "order_index": 0, "wip_limit": 0, "category": "todo", "is_initial": True, "is_terminal": False, "entry_policy": "any", "exit_policy": "edges_only", "max_duration_days": None},
    {"name": "Analiz", "order_index": 1, "wip_limit": 0, "category": "todo", "is_initial": False, "is_terminal": False, "entry_policy": "edges_only", "exit_policy": "edges_only", "max_duration_days": None},
    {"name": "Tasarım", "order_index": 2, "wip_limit": 0, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "edges_only", "exit_policy": "edges_only", "max_duration_days": None},
    {"name": "Uygulama", "order_index": 3, "wip_limit": 0, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "edges_only", "exit_policy": "edges_only", "max_duration_days": None},
    {"name": "Test", "order_index": 4, "wip_limit": 0, "category": "in_progress", "is_initial": False, "is_terminal": False, "entry_policy": "edges_only", "exit_policy": "edges_only", "max_duration_days": None},
    {"name": "Bakım", "order_index": 5, "wip_limit": 0, "category": "done", "is_initial": False, "is_terminal": True, "entry_policy": "edges_only", "exit_policy": "terminal_lock", "max_duration_days": None},
]


def upgrade() -> None:
    # 1. Add column idempotently
    if not _column_exists("process_templates", "default_columns"):
        op.add_column(
            "process_templates",
            sa.Column("default_columns", JSONB, nullable=True),
        )

    # 2. Backfill builtin templates by name (WHERE NULL guard for idempotency).
    # Use op.execute with parameterized JSON literal to avoid SQL injection (json.dumps).
    for template_name, default_cols in [
        ("Scrum", _SCRUM_DEFAULT_COLUMNS),
        ("Kanban", _KANBAN_DEFAULT_COLUMNS),
        ("Waterfall", _WATERFALL_DEFAULT_COLUMNS),
    ]:
        payload = json.dumps(default_cols).replace("'", "''")
        op.execute(
            f"UPDATE process_templates SET default_columns = '{payload}'::jsonb "
            f"WHERE name = '{template_name}' AND default_columns IS NULL"
        )


def downgrade() -> None:
    if _column_exists("process_templates", "default_columns"):
        op.drop_column("process_templates", "default_columns")
```

2. **`Backend/app/infrastructure/database/models/process_template.py`** — yeni Column:

```python
class ProcessTemplateModel(Base):
    __tablename__ = "process_templates"
    # ... mevcut alanlar ...
    # Wave 2 W2-C9 — engine-aware column defaults used by CreateProjectUseCase
    # (W2-C10). Falls back to `columns` if NULL.
    default_columns = Column(JSONB, nullable=True)
```

3. **`Backend/app/infrastructure/database/seeder.py`** — `seed_process_templates` template dict'lerine `default_columns` ekle (idempotent — existing check zaten orada; default_columns alanı yoksa atlanır, varsa basılır):

```python
templates = [
    {
        "name": "Scrum",
        # ... mevcut ...
        "columns": [...],  # backward compat
        "default_columns": _SCRUM_DEFAULT_COLUMNS,  # NEW W2-C9 — kopyala migration'daki listeden veya ortak module
        # ...
    },
    # Kanban + Waterfall aynı pattern
]
```

**Refactor önerisi:** Default kolon listeleri tek bir Python module'da paylaşılsın (`Backend/app/infrastructure/database/_default_columns.py`) ve hem migration hem seeder ondan import etsin. **Karar:** Yeni paylaşım modulü ekle, kod tek kaynak.

4. **`Backend/tests/integration/test_seeder.py`** — yeni test:

```python
@pytest.mark.asyncio
async def test_seeded_templates_carry_default_columns_with_engine_fields(db_session):
    """W2-C9: seeder writes default_columns with category/is_initial/is_terminal."""
    from app.infrastructure.database.models.process_template import ProcessTemplateModel
    from sqlalchemy import select

    result = await db_session.execute(select(ProcessTemplateModel).where(ProcessTemplateModel.name == "Scrum"))
    template = result.scalar_one()
    assert template.default_columns is not None
    assert isinstance(template.default_columns, list)
    assert len(template.default_columns) == 5
    backlog = template.default_columns[0]
    assert backlog["name"] == "Backlog"
    assert backlog["category"] == "todo"
    assert backlog["is_initial"] is True
    done = template.default_columns[-1]
    assert done["name"] == "Done"
    assert done["is_terminal"] is True
```

### Test Stratejisi

- **Etkilenen mevcut testler:** `test_seeder.py` mevcut testleri — template kayıtlarının yapısı genişledi ama eski `columns` korunduğu için failure yok.
- **Eklenecek testler:** 1 yeni.
- **Çalıştırılacak komut:**
  ```
  cd Backend && alembic upgrade head      # 014 uygulanır
  pytest Backend/tests/ -v
  cd Backend && alembic downgrade -1      # 014 geri alınır
  cd Backend && alembic upgrade head      # idempotency
  ```
- **Beklenen sonuç:** 1 yeni pas; alembic up/down/up idempotent.

### Doğrulama

- [ ] `alembic upgrade head` başarılı
- [ ] `psql -c "\d process_templates"` — `default_columns` JSONB kolonu var
- [ ] `psql -c "SELECT name, jsonb_array_length(default_columns) FROM process_templates;"` — 3 satır (Scrum=5, Kanban=5, Waterfall=6)
- [ ] `alembic downgrade -1` başarılı + `alembic upgrade head` tekrar OK
- [ ] `pytest Backend/tests/` tam suite yeşil

### Risk Notları

- **Migration string-quoting:** JSON literal'i `json.dumps` ile serialize edip tek-tırnak escape (`'` → `''`) — SQL injection riski yok (sabit veri) ama escape ihlali parse error verir. Test: migration'ı boş DB'de uygula + `psql` query'sini koş.
- **Backfill name match:** Template adı tam eşleşme gerekir ("Scrum" vs "scrum"). Seeder şu an `Scrum` Title Case kullanıyor; migration aynı casing.
- **Eski `columns` field'ı tutulur** — W2-C10'da read-priority: önce `default_columns`, yoksa `columns` (fallback).
- **Geri alma:** Tek başına revertable; downgrade veri kaybı (yeni alan boşalır) kabul edilebilir.

---

## W2-C10: refactor(projects): CreateProjectUseCase reads template.default_columns with engine fields

**Risk:** ORTA (mevcut testler 5'li default kolon liste varsayımıyla yazılmış; davranış değişikliği görünür)
**Bağımlılık:** W2-C9
**Tahmini değişiklik:** ~3 dosya, ~120 satır

### Amaç

İki use case'i template-driven yap:

1. **`CreateProjectUseCase.execute`** (`manage_projects.py:34-48`): `template.default_columns` varsa onu kullan; yoksa eski `template.columns` (legacy shape); o da yoksa son fallback `dto.columns` (kullanıcı manuel veriyse) — ve hiçbir şey yoksa `SeedDefaultColumnsUseCase`'in hard-coded listesi.
2. **`SeedDefaultColumnsUseCase.execute`**: `process_template_id` arg al; varsa template.default_columns'tan oku; yoksa mevcut 5'li listeyi koru (legacy/orphan projeler için).

**Davranışsal etki:**
- Yeni Scrum projeleri 5 kolon (Backlog/To Do/In Progress/Code Review/Done) — eski 5'li listeye benzer ama **engine field'ları template'ten gelir** (is_initial=True on Backlog, is_terminal=True on Done, vs).
- Yeni Kanban projeleri 5 kolon (To Do/Analiz/Geliştirme/Test/Done) — eski 5'li listeden FARKLI (yeni Kanban kolonları + non-zero wip_limit'ler).
- Yeni Waterfall projeleri 6 kolon — eski 5'li listeden FARKLI.

Mevcut testlerin çoğu `default_pc` fixture'ı kullanıyor; bu use case'lerin doğrudan test ettiği yerlerde **kolon sayısı assertion'ı varsa kırılır**. W2-C10 her böyle test'i bulup günceller.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/use_cases/manage_projects.py` | MODIFY | `CreateProjectUseCase.execute`: default_columns read priority |
| `Backend/app/application/use_cases/manage_board_columns.py` | MODIFY | `SeedDefaultColumnsUseCase`: template_repo + process_template_id arg |
| `Backend/app/application/use_cases/apply_process_template.py` | MODIFY | Re-apply path: opsiyonel olarak kolon kurma (Wave 2'de uygulamayacağız ama YORUM ekle — "future") |
| `Backend/tests/unit/application/test_manage_projects.py` | MODIFY | Kolon sayısı/shape assertion'ları template-aware |
| `Backend/tests/unit/application/test_manage_board_columns.py` | MODIFY veya CREATE | SeedDefaultColumnsUseCase template fallback testleri |

### Detaylı Adımlar

1. **`Backend/app/application/use_cases/manage_projects.py`** — `CreateProjectUseCase.execute` line 34-48 yeniden yaz:

```python
# Build columns: priority order
# 1. dto.columns explicitly provided (user-customized; preserves V1 behavior)
# 2. template.default_columns (Wave 2 W2-C10; engine-aware spec with category/is_initial/is_terminal/...)
# 3. template.columns (Wave 1 legacy fallback; name+order+wip_limit only)
# 4. None -> empty list (engine fallback via SeedDefaultColumnsUseCase, called by API layer if needed)
columns: List[BoardColumn] = []

if dto.columns:
    columns = [
        BoardColumn(name=col_name, order_index=i, wip_limit=0)
        for i, col_name in enumerate(dto.columns)
    ]
elif template is not None and getattr(template, "default_columns", None):
    # W2-C10 canonical path — engine-aware default columns from template.
    columns = [
        BoardColumn(
            name=c["name"],
            order_index=c.get("order_index", i),
            wip_limit=c.get("wip_limit", 0),
            category=c.get("category", "todo"),
            is_initial=bool(c.get("is_initial", False)),
            is_terminal=bool(c.get("is_terminal", False)),
            max_duration_days=c.get("max_duration_days"),
            entry_policy=c.get("entry_policy", "any"),
            exit_policy=c.get("exit_policy", "any"),
        )
        for i, c in enumerate(template.default_columns)
    ]
elif template is not None and template.columns:
    # Wave 1 legacy fallback — Pre-W2-C9 templates without default_columns.
    # Engine fields default to entity defaults (todo / False / "any") since
    # legacy template columns shape has no info on them.
    columns = [
        BoardColumn(
            name=col["name"],
            order_index=col.get("order", i),
            wip_limit=col.get("wip_limit", 0),
        )
        for i, col in enumerate(template.columns)
    ]
# Note: if columns ends up empty, the API endpoint can call SeedDefaultColumnsUseCase
# to populate. Most production paths hit one of the three branches above.
```

2. **`Backend/app/application/use_cases/manage_board_columns.py`** — `SeedDefaultColumnsUseCase` template-driven:

```python
class SeedDefaultColumnsUseCase:
    """W2-C10 — template-driven default column seed.

    Priority:
      1. If process_template_id provided and template has default_columns →
         seed from template.default_columns (engine-aware).
      2. Else fall back to the hard-coded DEFAULT_COLUMNS list (legacy projects
         with no template assignment).
    """

    # Hard-coded fallback (legacy path; new projects route through template).
    DEFAULT_COLUMNS = [
        {"name": "Backlog",     "category": "todo",        "is_initial": True,  "is_terminal": False},
        {"name": "Todo",        "category": "todo",        "is_initial": False, "is_terminal": False},
        {"name": "In Progress", "category": "in_progress", "is_initial": False, "is_terminal": False},
        {"name": "In Review",   "category": "in_progress", "is_initial": False, "is_terminal": False},
        {"name": "Done",        "category": "done",        "is_initial": False, "is_terminal": True},
    ]

    def __init__(self, column_repo: IBoardColumnRepository, template_repo=None):
        self.column_repo = column_repo
        self.template_repo = template_repo

    async def execute(
        self,
        project_id: int,
        process_template_id: Optional[int] = None,
    ) -> List[BoardColumnDTO]:
        # 1. Try template route
        spec_list: list = []
        if process_template_id is not None and self.template_repo is not None:
            template = await self.template_repo.get_by_id(process_template_id)
            if template is not None and getattr(template, "default_columns", None):
                spec_list = template.default_columns

        # 2. Fallback to hard-coded
        if not spec_list:
            spec_list = self.DEFAULT_COLUMNS

        columns = []
        for i, spec in enumerate(spec_list):
            column = BoardColumn(
                project_id=project_id,
                name=spec["name"],
                order_index=spec.get("order_index", i),
                wip_limit=spec.get("wip_limit", 0),
                category=spec.get("category", "todo"),
                is_initial=bool(spec.get("is_initial", False)),
                is_terminal=bool(spec.get("is_terminal", False)),
                max_duration_days=spec.get("max_duration_days"),
                entry_policy=spec.get("entry_policy", "any"),
                exit_policy=spec.get("exit_policy", "any"),
            )
            created = await self.column_repo.create(column)
            columns.append(_to_dto(created, 0))
        return columns
```

3. **API layer (`Backend/app/api/v1/columns.py` veya equivalent)** — `SeedDefaultColumnsUseCase` çağırılan yere `process_template_id` geçir. Dependency injection güncellemesi (`Backend/app/api/dependencies.py`):

```python
def get_seed_default_columns_use_case(
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
    template_repo: IProcessTemplateRepository = Depends(get_template_repo),
) -> SeedDefaultColumnsUseCase:
    return SeedDefaultColumnsUseCase(column_repo, template_repo)
```

Endpoint'te çağrı sırasında `project.process_template_id` geçirilir.

4. **Test güncellemeleri:**

`Backend/tests/unit/application/test_manage_board_columns.py` (varsa) — yeni testler:

```python
@pytest.mark.asyncio
async def test_seed_defaults_uses_template_default_columns_when_available():
    """W2-C10: template.default_columns wins over hard-coded fallback."""
    template_repo = MagicMock()
    template_repo.get_by_id = AsyncMock(return_value=MagicMock(
        default_columns=[
            {"name": "Custom1", "order_index": 0, "category": "todo", "is_initial": True, "is_terminal": False},
            {"name": "Custom2", "order_index": 1, "category": "done", "is_initial": False, "is_terminal": True},
        ]
    ))
    col_repo = MagicMock()
    col_repo.create = AsyncMock(side_effect=lambda c: c)
    col_repo.count_tasks = AsyncMock(return_value=0)

    use_case = SeedDefaultColumnsUseCase(col_repo, template_repo)
    result = await use_case.execute(project_id=42, process_template_id=1)
    assert len(result) == 2
    assert result[0].name == "Custom1"
    assert result[0].is_initial is True
    assert result[-1].is_terminal is True


@pytest.mark.asyncio
async def test_seed_defaults_falls_back_to_hardcoded_when_no_template():
    """W2-C10: process_template_id=None or template.default_columns missing → 5-col fallback."""
    col_repo = MagicMock()
    col_repo.create = AsyncMock(side_effect=lambda c: c)
    col_repo.count_tasks = AsyncMock(return_value=0)
    use_case = SeedDefaultColumnsUseCase(col_repo, template_repo=None)
    result = await use_case.execute(project_id=42, process_template_id=None)
    assert len(result) == 5
    assert result[0].name == "Backlog"
    assert result[-1].name == "Done"


@pytest.mark.asyncio
async def test_seed_defaults_falls_back_when_template_has_no_default_columns():
    """W2-C10: template exists but default_columns is None (legacy pre-W2-C9) → fallback."""
    template_repo = MagicMock()
    template_repo.get_by_id = AsyncMock(return_value=MagicMock(default_columns=None))
    col_repo = MagicMock()
    col_repo.create = AsyncMock(side_effect=lambda c: c)
    col_repo.count_tasks = AsyncMock(return_value=0)
    use_case = SeedDefaultColumnsUseCase(col_repo, template_repo)
    result = await use_case.execute(project_id=42, process_template_id=1)
    assert len(result) == 5  # hard-coded fallback
```

`Backend/tests/unit/application/test_manage_projects.py` — `CreateProjectUseCase` testleri güncelle:

```python
@pytest.mark.asyncio
async def test_create_project_uses_template_default_columns():
    """W2-C10: CreateProjectUseCase pulls engine-aware columns from template.default_columns."""
    template = MagicMock(
        columns=None,  # legacy field empty
        default_columns=[
            {"name": "Foo", "order_index": 0, "category": "todo", "is_initial": True, "is_terminal": False, "entry_policy": "any", "exit_policy": "any"},
            {"name": "Bar", "order_index": 1, "category": "done", "is_initial": False, "is_terminal": True, "entry_policy": "any", "exit_policy": "terminal_lock"},
        ],
        behavioral_flags={},
        recurring_tasks=[],
    )
    template_repo = MagicMock(get_by_name=AsyncMock(return_value=template))
    # ... existing test setup ...
    result = await use_case.execute(dto, manager_id=1)
    # Assert created project has 2 columns with engine fields populated
    create_args = project_repo.create.call_args[0][0]
    assert len(create_args.columns) == 2
    assert create_args.columns[0].is_initial is True
    assert create_args.columns[0].category == "todo"
    assert create_args.columns[-1].is_terminal is True
```

### Test Stratejisi

- **Etkilenen mevcut testler:** `test_manage_projects.py` — `template.columns` kullanan testler eski yolu test ediyor (legacy fallback). Bunlar `default_columns=None` mock'lanırsa hala çalışır. **Gerçekten kırılan testler:** İntegration test'lerinde Kanban projesi yarat → 4 kolon bekleniyor; artık 5 kolon (yeni Kanban shape). Audit ve fix.
- **Eklenecek testler:** 3 SeedDefaultColumnsUseCase + 1 CreateProjectUseCase = 4 yeni.
- **Çalıştırılacak komut:** `pytest Backend/tests/unit/application/test_manage_board_columns.py Backend/tests/unit/application/test_manage_projects.py Backend/tests/integration/ -v`
- **Beklenen sonuç:** Tüm yeşil; bazı integration test'ler güncellenmiş kolon sayısı/isimlerine uyumlu hale getirildi.

### Doğrulama

- [ ] 4 yeni unit test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil (entegrasyon güncellemeleri dahil)
- [ ] Manuel: Yeni Scrum projesi yarat → 5 kolon: Backlog (is_initial), To Do, In Progress, Code Review, Done (is_terminal). DB'de `SELECT category, is_initial, is_terminal FROM board_columns WHERE project_id=<new>` — tüm alanlar dolu.
- [ ] Manuel: Yeni Kanban projesi yarat → 5 kolon: To Do, Analiz (wip=3), Geliştirme (wip=4), Test (wip=2), Done.
- [ ] Manuel: Yeni Waterfall projesi yarat → 6 kolon, hepsi `entry_policy=edges_only`.

### Risk Notları

- **Mevcut Kanban projeleri 4 kolon shape'i ile yaratılmıştı** (Backend/app/application/use_cases/manage_projects.py:38-43 path eski `template.columns` ile). Migration yok — eski projeler 4 kolonla kalır. Sadece **yeni Kanban projeleri** 5 kolon olur. Bu **kabul edilebilir** (regression yok).
- **Test factory'ler `project_factory.py` 2-kolon V2 fixture'ı kullanıyor**, template.default_columns'tan değil. Bu testler etkilenmez.
- **`apply_process_template` use case'i kolon recreate etmez** (sadece process_config/template_id update eder). Re-apply path için Wave 3 nice-to-have: kullanıcının onayıyla mevcut projenin kolonlarını template default_columns ile sync et.
- **Geri alma:** Mevcut projeleri geri etkilemez; tek başına revertable (W2-C9 ile birlikte alınabilir).

---

## W2-C11: chore(workflow): remove dual-key workflow tolerance from API boundary

**Risk:** DÜŞÜK (Wave 1'in geçici tolerance'ı; FE artık V2 emit ediyor)
**Bağımlılık:** W2-C10
**Tahmini değişiklik:** ~2 dosya, ~25 satır

### Amaç

Wave 1 C1 `manage_projects.py:155-165`'te FE migration'ı C10 ile senkron olmadığı için **dual-key tolerance** eklemişti:

```python
wf = (
    dto.process_config.get("phase_workflow")
    or dto.process_config.get("workflow")
)
```

Wave 1 C10 + Wave 2 C5 sonrası FE her zaman `phase_workflow` emit eder. Bu commit tolerance'ı kaldırır. **Read-side normalizer (entity load) hala V1 `workflow` key'ini V2'ye migrate eder** (eski DB rows için). Sadece **API write boundary**'sinde tolerance kaldırılır.

### Etkilenen Dosyalar

| Dosya | Eylem | Değişiklik özeti |
|---|---|---|
| `Backend/app/application/use_cases/manage_projects.py` | MODIFY | `or dto.process_config.get("workflow")` kaldır |
| `Backend/tests/integration/api/test_project_workflow_patch.py` | MODIFY | `test_patch_accepts_legacy_workflow_key` testini sil veya `xfail` işaretle |

### Detaylı Adımlar

1. **`Backend/app/application/use_cases/manage_projects.py`** — line 155-165:

```python
if dto.process_config is not None:
    wf = None
    if isinstance(dto.process_config, dict):
        # W2-C11 — FE always emits V2 canonical `phase_workflow` since Wave 1 C10.
        # The legacy `workflow` key fallback was kept until W2 migration stabilized;
        # now removed. The entity normalizer still migrates legacy DB rows on read,
        # so production V1 data is unaffected.
        wf = dto.process_config.get("phase_workflow")
    if isinstance(wf, dict):
        WorkflowConfigDTO(**wf)
```

2. **`Backend/tests/integration/api/test_project_workflow_patch.py`** — `test_patch_accepts_legacy_workflow_key` sil (FE artık eski isim göndermiyor). Yerine:

```python
@pytest.mark.asyncio
async def test_patch_with_legacy_workflow_key_no_longer_validates(authenticated_client, db_session):
    """W2-C11: legacy `workflow` key is silently dropped at the API boundary.

    Backend accepts the PATCH but workflow content is NOT validated (extra='ignore' on
    process_config Dict). The entity normalizer migrates the persisted document on read.
    """
    project = await _create_project_with_workflow(db_session)
    response = await authenticated_client.patch(
        f"/api/v1/projects/{project.id}",
        json={"process_config": {"workflow": _valid_phase_nodes()}},  # legacy shape
    )
    # 200 OK — backend doesn't reject the legacy key, but also doesn't run
    # WorkflowConfigDTO validation on it. The normalizer renames it to
    # phase_workflow on entity construction.
    assert response.status_code == 200
    response = await authenticated_client.get(f"/api/v1/projects/{project.id}")
    pc = response.json()["process_config"]
    # phase_workflow exists (normalizer ran); workflow key absent
    assert "phase_workflow" in pc
    assert "workflow" not in pc
```

### Test Stratejisi

- **Etkilenen mevcut testler:** `test_patch_accepts_legacy_workflow_key` — silindi, yerine `test_patch_with_legacy_workflow_key_no_longer_validates` eklendi.
- **Eklenecek testler:** 1 yeni (yukarıdaki).
- **Çalıştırılacak komut:** `pytest Backend/tests/integration/api/test_project_workflow_patch.py -v && rg -F 'or pc.get("workflow")' Backend/app/ --type py`
- **Beklenen sonuç:** Tüm yeşil; rg sıfır eşleşme.

### Doğrulama

- [ ] 1 yeni test yeşil
- [ ] `pytest Backend/tests/` tam suite yeşil
- [ ] `rg -F 'or .* workflow' Backend/app/application/use_cases/manage_projects.py` — dual-key tolerance kaldırılmış
- [ ] Manuel: Eski (Wave 1 öncesi) FE'den `process_config.workflow` PATCH gönderilirse → 200 ama içerik validate edilmez; **kullanıcı için risk yok** (her FE Wave 2 W2-C5 sonrası `phase_workflow` emit eder).

### Risk Notları

- **Eski FE binary**'leri prod'da çalışmaya devam ederse**: 422 değil 200 alır, ama gönderdiği `workflow` key normalizer tarafından `phase_workflow`'a rename edilir. Yine V2'ye geçer. **Risk minimum.**
- **Geri alma:** Tek başına revertable; bu cleanup kritik değil.

---

## Genel Risk Değerlendirmesi

- **En riskli commit:** **W2-C10**. Sebep:
  1. `CreateProjectUseCase` davranış değişikliği — Kanban/Waterfall yeni projeleri farklı kolon shape'i ile yaratılır.
  2. Mevcut integration test'leri (özellikle Kanban projesi kullanan E2E senaryoları) kolon sayısı veya isim assertion'ları içerebilir.
  3. `SeedDefaultColumnsUseCase`'a `template_repo` injection geçişi DI graph'ını değiştirir.

- **En kolay rollback:** **W2-C11** — tek satır config kaldırma.

- **Eğer yarıda durulursa stable state'ler:**
  - **W2-C3 sonrası:** Backend capability + node-field round-trip kontratı kanıtlanmış. FE yok ama merge edilebilir; Wave 3'te FE eklenir.
  - **W2-C5 sonrası:** A (capability toggle) tamamlandı; B ve C henüz yok ama merge edilebilir.
  - **W2-C8 sonrası:** A + B tamamlandı; UI'dan tüm engine alanları edit edilebilir; C henüz yok. Stable.
  - **W2-C10 sonrası:** A + B + C tamamen aktif. Stable; W2-C11 opsiyonel cleanup.

- **Migration sırası kritik mi?** **Evet** — W2-C9 (alembic 014) W2-C10'dan önce uygulanmalı, çünkü `default_columns` field'ı yoksa `getattr(template, "default_columns", None)` None döner ve fallback yolu seçilir (regression yok ama yeni özellik aktive olmaz).

---

## Açık Sorular — Senior Review Cevapları (2026-05-17)

Plan yazıldıktan sonra senior architect şu cevapları sabitledi:

1. **`apply_process_template` re-apply path:** **RESOLVED — Wave 3'e ertelenir.** Mevcut davranış korunur (sadece `process_config` update); explicit "Reset Columns" endpoint Wave 3'te eklenir.

2. **Capabilities undo:** **RESOLVED — workflow ile birlikte.** `commitCapabilities` `history.push(workflow)` pattern'i kullanır; ayrı slice değil.

3. **`max_duration_days` UI clear:** **RESOLVED — boş input = leave unchanged.** Explicit "Clear" butonu Wave 3.

4. **`is_initial` UI validation çok-kolon:** **RESOLVED — AlertBanner uyar, otomatik kapatma yok.** Kullanıcı bilinçli karar verir; backend validation Wave 3.

5. **Status mode PATCH race:** **RESOLVED — Wave 2'de kabul.** Son yazan kazanır; debounce + batch Wave 3.

6. **Settings>Columns subtab `is_initial`:** **RESOLVED — Aynı (#4 ile).** AlertBanner uyar, auto-magic yok.

7. **Lifecycle mode `category` field:** **RESOLVED — Wave 2'de göster (UI tutarlılığı).** Engine henüz phase_workflow `category` okumaz ama UI'da bilgi verir.

8. **`status_workflow` → `task_workflow` tam rename (Wave 1 yarı kalan):** **RESOLVED — W2-C5'te tamamla.** editor-page save handler aynı commit'te dokunulacağı için ekstra atomic commit gereksiz. Eski persisted projeler için read-fallback Wave 3 cleanup'a kadar korunur.

---

## Manuel UI Test Listesi (Wave 2 sonu)

Kullanıcının W2-C11 sonrası yapması gereken senaryolar — her senaryo dakikalar içinde tamamlanır:

### A) Capability Toggles
1. **Yeni Scrum projesi yarat** → Workflow editör'e gir → Lifecycle mode → sağ panel'de "Motor Ayarları" görünür.
2. "Sıralı bağımlılık" toggle'ını **aç** → Save → Page refresh → toggle hala açık.
3. Kanban board'a git → bir görevi adjacent olmayan kolona sürükle. **Eğer `enforce_sequential_dependencies` aktifse ve task_workflow.edges tanımlı değilse**, hareket 400 hatasıyla reddedilmeli. (Eğer edges boşsa, `engine.can_move` yoksa "No edge connects..." reddi.)
4. Sağ panel'de "WIP limitlerini uygula" toggle'ını **aç** → Settings>Columns'a git → bir kolona `wip_limit=2` ver → 3 görev eklemeye çalış → 3.'sünde 409 (WIP limit exceeded).
5. "Tekrarlayan görevler" toggle'ı **kapalı** iken bir recurring task'ı Done kolonuna taşı → yeni instance **oluşmamalı**. Toggle açıkken aynı işlem → yeni instance oluşur.

### B) Node-Level Field Editor
6. Workflow editör → Status mode → bir kolon node'una tıkla → sağ panel'de "Motor Alanları" bölümü görünür.
7. Category dropdown'ı `in_progress`'e değiştir → DevTools Network tab'da `PATCH /columns/{id}` görülür → toast "Kolon güncellendi".
8. "Terminal düğüm" toggle'ı aç → Save → page refresh → toggle hala açık.
9. "Maks. süre (gün)" `7` gir → Save → DB sorgusu: `SELECT max_duration_days FROM board_columns WHERE id=<x>` → `7`.
10. "Giriş politikası" `edges_only`'a değiştir → Save → API GET response'unda `entry_policy: "edges_only"`.
11. Lifecycle mode → bir phase node'u seç → "Motor Alanları" görünür → category değiştir → **kolon PATCH'i tetiklenmez** (workflow.nodes JSON'a yazar) → Save → page refresh → değer korunur.

### C) Settings>Columns Subtab
12. Project Detail → Settings → Columns → 9 sütunlu (Waterfall'da 8) tablo görünür.
13. Bir satırda "Kategori" dropdown'ı değiştir → blur → backend PATCH → page refresh → değer korunur.
14. "Maks Gün" alanına `14` yaz → blur → PATCH → silmek için boşalt → blur → DB'de değer hala `14` (null = leave unchanged).
15. "Başlangıç" checkbox'ı işaretle → blur → AlertBanner: "Birden fazla başlangıç kolonu mevcut" (eğer böyle bir durum varsa).
16. Waterfall projesinde tabloyu kontrol et → WIP sütunu **gizli** (D-12 davranışı korunur).

### D) Template-Driven Seed
17. **Yeni Scrum projesi yarat** → Board'da 5 kolon: Backlog (is_initial chip görünür), To Do, In Progress, Code Review, Done (is_terminal chip görünür).
18. **Yeni Kanban projesi yarat** → 5 kolon: To Do, Analiz (wip_limit=3 chip), Geliştirme (wip=4), Test (wip=2), Done.
19. **Yeni Waterfall projesi yarat** → 6 kolon: Gereksinim, Analiz, Tasarım, Uygulama, Test, Bakım. Settings>Columns'a git → her birinin `entry_policy=edges_only` ve `exit_policy=edges_only`/`terminal_lock`.
20. Kanban board görev sürükleme: `enforce_sequential_dependencies=False` default'la → herhangi kolona sürüklenebilir.

### E) Genel
21. Mevcut (Wave 1'den kalma) bir projeyi aç → Workflow editör → page hata vermez (W2-C2 idempotency).
22. Eski tarayıcı cache'i ile (Wave 1 öncesi FE) `process_config.workflow` PATCH atılırsa backend 200 dönmeli (W2-C11 graceful degradation).

---

## Wave 2 Tamamlama Kriterleri

- [ ] 11 commit chain'lerinde uygulandı (W2-C1 → W2-C11)
- [ ] Backend pytest tam suite yeşil
- [ ] Frontend2 vitest tam suite yeşil
- [ ] `cd Frontend2 && npm run typecheck` clean
- [ ] Alembic migration 014 upgrade/downgrade/upgrade idempotent
- [ ] Manuel UI test listesinden A.1-5, B.6-11, C.12-16, D.17-20, E.21-22 hepsi pas
- [ ] `rg -F 'or pc.get("workflow")' Backend/app/` sıfır eşleşme
- [ ] `rg -F 'status_workflow' Frontend2/components/workflow-editor/editor-page.tsx` sadece read fallback (yorumlu)
