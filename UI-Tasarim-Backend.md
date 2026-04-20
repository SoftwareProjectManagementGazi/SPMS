# SPMS — UI Tasarım Planı: Backend Gereksinimleri

Bu dok��man, UI-TASARIM-PLANI.md'den ayrıştırılan backend/veri modeli değişikliklerini içerir. UI dokümanında bu detaylar kaldırılmış, yerine UI agent'ın ihtiyaç duyduğu düzeyde özetler bırakılmıştır.

---

## 1. Proje Durumu (Project Status)

**Kaynak:** Madde 6 — Proje Durumu ve Arşivi

Project entity'sine `status` alanı eklenir.

```python
class ProjectStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    ARCHIVED = "ARCHIVED"

class Project(BaseModel):
    # ... mevcut alanlar
    status: ProjectStatus = ProjectStatus.ACTIVE
```

API endpoint'leri:
- `PATCH /projects/{id}` → status alanı güncellenebilir
- `GET /projects` → `?status=ACTIVE` filtre parametresi eklenir
- Arşivlenmiş projelerde görev oluşturma/düzenleme engellenebilir (opsiyonel, backend policy)

Migrasyon: `ALTER TABLE projects ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'`

---

## 2. Cycle Genelleştirmesi (Sprint Entity)

**Kaynak:** L1 — Cycle Genelleştirmesi

Mevcut Sprint entity (name, start_date, end_date, is_active, goal, project_id) yapısal olarak zaten yeterli. Backend'de değişiklik gerekmez — entity aynen korunur.

Tek ekleme: Sprint API yanıtlarına `cycle_label` alanı eklenebilir (projenin metodolojisine göre "Sprint", "Döngü", "İterasyon" vb.). Veya bu tamamen frontend tarafında i18n ile çözülebilir (önerilen yaklaşım).

---

## 3. Görev-Faz Ataması (Task Phase Assignment)

**Kaynak:** L2 — Görev-Faz Ataması ve Behavioral Toggle

### process_config Flag

`enable_phase_assignment` — process_config JSON'ına eklenen boolean flag:

```json
{
  "methodology": "WATERFALL",
  "enforce_sequential_dependencies": true,
  "enforce_wip_limits": false,
  "restrict_expired_sprints": false,
  "enable_phase_assignment": true
}
```

Varsayılan değerler (metodolojiye göre):
```
scrum        → false
kanban       → false
waterfall    → true
v-model      → true
spiral       → true
iterative    → false
incremental  → true
evolutionary → false
rad          → false
```

### Task Entity Değişikliği

Task entity'sine `phase_id` (veya `lifecycle_node_id`) alanı eklenir:

```python
class Task(BaseModel):
    # ... mevcut alanlar
    phase_id: Optional[str] = None  # lifecycle canvas'taki node ID'si
```

Bu alan nullable'dır. `enable_phase_assignment` kapalıyken frontend bu alanı göndermez.

Migrasyon: `ALTER TABLE tasks ADD COLUMN phase_id VARCHAR(50) NULL`

API değişiklikleri:
- `POST /tasks` ve `PUT /tasks/{id}` → `phase_id` alanı kabul eder
- `GET /tasks/project/{id}` → `?phase_id=n3` filtre parametresi eklenir

### Paralel Aktif Faz Hesaplama

Aktif fazlar `project.phase` tekil string yerine görevlerden türetilir:

```sql
SELECT DISTINCT phase_id FROM tasks
WHERE project_id = :project_id AND status != 'done' AND phase_id IS NOT NULL
```

Bu sorgu birden fazla phase_id döndürebilir = paralel aktif fazlar.

---

## 4. Graph Traversal — Aktif Faz Hesaplama Algoritması

**Kaynak:** L5 — Graph Traversal ile Aktif Faz Hesaplama

Mevcut WorkflowCanvas'taki düz index karşılaştırması (`i < activePhaseIndex`) yerine graph traversal kullanılmalı. Bu fonksiyon frontend'de çalışır (Canvas render logic) ama backend'den de çağrılabilir (raporlama, API yanıtları için):

```python
def compute_phase_states(workflow_nodes, workflow_edges, active_node_ids):
    """
    Graph traversal ile her node'un durumunu hesaplar.
    
    Args:
        workflow_nodes: [{ id, name, ... }]
        workflow_edges: [{ source, target, type }]  
        active_node_ids: set of currently active node IDs (derived from tasks)
    
    Returns:
        { node_id: "active" | "past" | "future" | "unreachable" }
    """
    # Sadece flow ve feedback edge'lerini kullan (verification hariç)
    flow_edges = [e for e in workflow_edges if e.get("type") != "verification"]
    
    # Geriye doğru BFS: aktif node'lardan source'lara giderek "geçmiş" kümesini bul
    reverse_adj = defaultdict(list)
    for e in flow_edges:
        reverse_adj[e["target"]].append(e["source"])
    
    past = set()
    queue = list(active_node_ids)
    while queue:
        curr = queue.pop(0)
        for src in reverse_adj.get(curr, []):
            if src not in past and src not in active_node_ids:
                past.add(src)
                queue.append(src)
    
    # İleriye doğru BFS: aktif node'lardan target'lara giderek "gelecek" kümesini bul
    forward_adj = defaultdict(list)
    for e in flow_edges:
        forward_adj[e["source"]].append(e["target"])
    
    future = set()
    queue = list(active_node_ids)
    while queue:
        curr = queue.pop(0)
        for tgt in forward_adj.get(curr, []):
            if tgt not in future and tgt not in active_node_ids:
                future.add(tgt)
                queue.append(tgt)
    
    states = {}
    for node in workflow_nodes:
        nid = node["id"]
        if nid in active_node_ids:
            states[nid] = "active"
        elif nid in past:
            states[nid] = "past"
        elif nid in future:
            states[nid] = "future"
        else:
            states[nid] = "unreachable"
    
    return states
```

Bu fonksiyonun JavaScript versiyonu frontend'de WorkflowCanvas render'ında kullanılır (UI dokümanında görsel çıktı tanımları mevcut).

---

## 5. Workflow Veri Yapısı Genişletmeleri

**Kaynak:** L3 (Edge Tipleri), L4 (Swimlane), L6 (sequential-flexible mod)

### Edge type alanı

Mevcut edge yapısına `type` alanı eklenir:

```json
{
  "id": "e1",
  "source": "n1",
  "target": "n2",
  "type": "flow",        // yeni: "flow" | "verification" | "feedback"
  "label": "Doğrular",
  "bidirectional": false
}
```

Varsayılan: `"flow"`. Mevcut edge'ler type alanı olmadan da çalışmaya devam eder (backward compatible).

### Groups dizisi

Workflow objesine `groups` dizisi eklenir:

```json
{
  "mode": "flexible",
  "nodes": [...],
  "edges": [...],
  "groups": [
    {
      "id": "g1",
      "name": "Geliştirme Kolu",
      "x": 40, "y": 60,
      "width": 520, "height": 200,
      "color": "status-progress"
    }
  ]
}
```

Gruplar sadece görsel organizasyon sağlar, akış kurallarını etkilemez. Backend validation gerekmez.

### Yeni akış modu

`mode` alanına dördüncü değer eklenir:

```
"flexible" | "sequential-locked" | "continuous" | "sequential-flexible"
```

`sequential-flexible`: Flow edge'leri sıralı ilerlemeyi zorunlu kılar, feedback edge'leri tanımlı geri dönüşlere izin verir. Backend'de faz geçişi validation'ı bu moda göre yapılır.

---

## 6. Faz Geçişi (Phase Gate) Backend Desteği

**Kaynak:** Madde 3 — Phase Gate, Madde 4 — Tamamlanma Kriterleri

### Kriter Saklama

Faz tamamlanma kriterleri `process_config` JSON'ında saklanır:

```json
{
  "phase_completion_criteria": {
    "n1": {
      "auto": {
        "all_tasks_done": true,
        "no_critical_tasks": true,
        "no_blockers": false
      },
      "manual": [
        "Gereksinim dokümanı onaylandı",
        "Paydaş sunumu yapıldı"
      ]
    },
    "n2": {
      "auto": { "all_tasks_done": true, "no_critical_tasks": false, "no_blockers": false },
      "manual": ["Mimari review tamamlandı"]
    }
  }
}
```

### Faz Geçiş Kaydı

Faz geçişi yapıldığında audit_log'a kayıt:

```python
AuditLog(
    entity_type="phase_transition",
    entity_id=project_id,
    field_name=f"{source_phase_id}_to_{target_phase_id}",
    old_value=source_phase_name,
    new_value=target_phase_name,
    user_id=current_user.id,
    action="phase_transition",
    # ek metadata: note, moved_tasks_count, criteria_status
)
```

### Faz Geçmişi API

Yeni endpoint veya mevcut audit_log filtreleme:

```
GET /projects/{id}/phase-transitions
→ [{ from_phase, to_phase, timestamp, user, note, task_stats }]
```

---

## 7. Milestone Entity

**Kaynak:** Madde 7 �� Kilometre Taşı

Yeni entity:

```python
class Milestone(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    target_date: datetime
    description: Optional[str] = None
    status: str = "pending"  # pending, in_progress, completed, overdue
    linked_phase_ids: List[str] = []  # lifecycle node ID'leri
    created_at: Optional[datetime] = None
```

API endpoint'leri:
```
GET    /projects/{id}/milestones
POST   /projects/{id}/milestones
PATCH  /milestones/{id}
DELETE /milestones/{id}
```

---

## 8. Artefakt Entity

**Kaynak:** Madde 8 — Döküman/Artefakt Takibi

Yeni entity:

```python
class Artifact(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    status: str = "not_created"  # not_created, draft, completed
    assignee_id: Optional[int] = None
    linked_phase_id: Optional[str] = None  # lifecycle node ID
    note: Optional[str] = None
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
```

API endpoint'leri:
```
GET    /projects/{id}/artifacts
POST   /projects/{id}/artifacts
PATCH  /artifacts/{id}
DELETE /artifacts/{id}
```

Proje oluşturulduğunda metodolojinin varsayılan artefaktları otomatik seed edilir.

---

## 9. Değerlendirme Raporu Entity

**Kaynak:** Madde 17 — Değerlendirme Raporu

Yeni entity veya faz geçiş kaydına ek metadata:

```python
class PhaseReport(BaseModel):
    id: Optional[int] = None
    project_id: int
    phase_id: str  # lifecycle node ID
    cycle_number: int = 1  # kaçıncı geçi�� (Spiral için)
    summary: dict  # otomatik üretilen: task_count, done_count, moved_count, duration_days
    completed_tasks_notes: dict = {}  # { task_id: "not metni" }
    issues: Optional[str] = None
    lessons: Optional[str] = None
    recommendations: Optional[str] = None
    created_by: int
    created_at: Optional[datetime] = None
```

API endpoint'leri:
```
GET    /projects/{id}/phase-reports
POST   /projects/{id}/phase-reports
GET    /phase-reports/{id}
PATCH  /phase-reports/{id}
GET    /phase-reports/{id}/pdf  # PDF export
```

---

## 10. Proje Bazlı Aktivite API

**Kaynak:** Madde 9 — Proje Aktivite Akışı

Mevcut audit_log tablosu kullanılır. Yeni endpoint:

```
GET /projects/{id}/activity
  ?type=task_created,status_changed,assigned,comment,phase_transition
  &user_id=5
  &limit=30
  &offset=0
→ { items: [{ entity_type, entity_id, field_name, old_value, new_value, user_id, action, timestamp }], total }
```

Bu endpoint mevcut `GET /tasks/activity/me`'nin proje bazlı versiyonu.

---

## 11. Kullanıcı Profili API

**Kaynak:** Madde 10 — Kullanıcı Profil Sayfası

Mevcut endpoint'ler yeterli olabilir ama ideal olarak:

```
GET /users/{id}/summary
→ {
    user: { id, name, email, role, avatar },
    stats: {
      active_tasks: 12,
      completed_30d: 8,
      project_count: 4
    },
    projects: [{ id, key, name, methodology, task_count }]
  }
```

Görevler: `GET /tasks/my-tasks` endpoint'inin user_id parametreli versiyonu veya mevcut filtreleme.
Aktivite: `GET /projects/{id}/activity?user_id={id}` ile çapraz proje aktivitesi.
