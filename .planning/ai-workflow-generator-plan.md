# AI Workflow Generator — Implementation Master Plan

**Created:** 2026-05-19
**Last Updated:** 2026-05-19 (Locked-In Decisions D-01..D-06 added)
**Status:** ✅ Decisions locked — ready for Wave 1
**Milestone:** v3.0 (deferred from Phase 12 per PROJECT.md "Out of Scope")
**Owner:** Frontend + Backend tracks parallel

---

## 0. TL;DR

Workflow Editor'a iki kontekstli AI üretici eklenecek:

- **Yaşam Döngüsü AI** — proje fazlarını metodolojiye göre üretir (Phase Gate'ler, doğrulama edge'leri, paralel kollar)
- **Görev Durumu AI** — takım görev workflow'unu üretir (Sprint Backlog, WIP limitleri, özel durumlar)

**Yıldız özellik:** Artifacts modeli — kullanıcı form doldurur, AI sağ panelde canlı çizer, "Uygula" onayına kadar ana sisteme dokunulmaz.

**Backend:** FastAPI + Google Gemini 2.5 Flash (free tier, structured output ile guaranteed JSON), SSE stream.
**Frontend:** Mevcut React Flow canvas'ı reuse, yeni modal komponenti, fetch-based SSE client.

**Görsel referans:** [Frontend2/public/ai-mockup.html](../Frontend2/public/ai-mockup.html) — 2 varyant × 6 state interactive mockup.

---

## 1. Scope ve Sınırlar

### IN SCOPE
- Yaşam Döngüsü AI varyantı (Lifecycle workflow generation)
- Görev Durumu AI varyantı (Task status workflow generation)
- Canlı çizim animasyonu (stream → progressive canvas render)
- Apply confirmation (yeni proje olarak kaydet / mevcut'u değiştir)
- Error state'leri (servis kapalı, rate limit)
- Apply sonrası 10-saniyelik undo toast
- TR + EN bilingual UI (mevcut `useApp().language` ile)
- Mevcut `IAIWorkflowSuggestionPort` arkasında pluggable adapter (Gemini → Ollama fallback hazır)

### OUT OF SCOPE (v3.0)
- "İyileştir" modu (mevcut workflow'a öneri ekleme) → v3.1
- "Sonraki Faz" modu (single-node suggestion) → v3.1
- Chat tabanlı follow-up (Done state'teki "Yeni bir şey iste..." input visual only) → v3.1
- Workflow karşılaştırma / A/B → v3.1
- Multi-language LLM çıktısı (sadece TR ve EN, Almanca vs. yok)
- Voice input

### BOUNDARIES
- Mevcut `WorkflowCanvas` primitive'ini extend ederiz, replace etmeyiz
- Mevcut `methodology-matrix.ts`'deki 7 metodoloji ile uyumlu (Scrum, Kanban, Waterfall, Iterative, Incremental, Evolutionary, RAD)
- V-Model ve Spiral preset'ler — methodology değil; AI öner menüsünde GÖSTERILMEZ (Şablon Yükle'de kalmaya devam eder)

---

## 2. Architecture — Clean Architecture Mapping

CLAUDE.md'nin sıkı kurallarına uyacağız:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: API (FastAPI router + DI)                          │
│  POST /api/v1/ai/generate-lifecycle (SSE)                   │
│  POST /api/v1/ai/generate-task-status (SSE)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ depends on
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 2: Application (Use Cases + Ports + DTOs)             │
│  GenerateLifecycleWorkflowUseCase                            │
│  GenerateTaskStatusWorkflowUseCase                           │
│  IAIWorkflowSuggestionPort (ABC)                             │
│  LifecycleFormDTO, TaskStatusFormDTO, WorkflowEventDTO       │
└──────────────────────────┬──────────────────────────────────┘
                           │ depends on
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 1: Domain (Pure, no frameworks)                       │
│  WorkflowSuggestion, SuggestedNode, SuggestedEdge entities  │
│  TaskStatusSuggestion, SuggestedColumn entities             │
│  AIServiceUnavailableError, RateLimitExceededError          │
│  validate_suggested_workflow() pure function                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Infrastructure (Implements ports)                  │
│  GeminiWorkflowAdapter implements IAIWorkflowSuggestionPort │
│  OllamaWorkflowAdapter   (fallback, same interface)         │
│  MockWorkflowAdapter     (CI/demo, hardcoded stream)        │
│  LifecyclePromptBuilder, TaskStatusPromptBuilder            │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rule (CLAUDE.md §4.1 D):** `application/` klasöründe `import google.genai`, `import anthropic` YOK. Yalnızca port arabirimi.

---

## 3. Mockup Referansı

Tüm UI kararları için ground truth: [`Frontend2/public/ai-mockup.html`](../Frontend2/public/ai-mockup.html)

İçinde 2 varyant × 6 state = 12 ekran var:
- Yaşam Döngüsü: Idle, Generating, Done, Apply, Error-Down, Error-RateLimit
- Görev Durumu: Idle, Generating, Done, Apply, Error-Down, Error-RateLimit

İmplementasyon sırasında her komponentin "hangi state'i hangi şekilde göstermesi gerek" sorusunun cevabı mockup'tadır.

---

## 4. Backend Implementation

CLAUDE.md §6 sırasını takip ediyoruz: **Domain → Infrastructure → Application → API**.

### 4.1 Domain Layer (`Backend/app/domain/`)

#### 4.1.1 `entities/ai_workflow_suggestion.py` (NEW)

```python
from pydantic import BaseModel, ConfigDict
from typing import Literal

class SuggestedNode(BaseModel):
    """Single phase node in a lifecycle suggestion."""
    model_config = ConfigDict(from_attributes=True)
    id: str           # nd_<10char>
    label: str        # "Gereksinim Analizi"
    description: str  # "Paydaş ihtiyaçları toplanır"
    color: str        # status-todo | status-progress | status-review | status-done

class SuggestedEdge(BaseModel):
    """Edge between two nodes."""
    source_id: str
    target_id: str
    edge_type: Literal["flow", "verification", "feedback"]
    bidirectional: bool = False
    is_all_gate: bool = False
    label: str | None = None

class WorkflowSuggestion(BaseModel):
    """Complete lifecycle workflow suggestion (v3.0 schema v1)."""
    methodology: str
    nodes: list[SuggestedNode]
    edges: list[SuggestedEdge]
    rationale: str    # "Neden bu workflow?" — kullanıcıya gösterilir

class SuggestedColumn(BaseModel):
    """Single column in a task status workflow."""
    id: str
    label: str          # "Sprint Backlog", "Devam Ediyor"
    description: str
    color: str          # status-* token
    wip_limit: int | None = None  # None = unlimited
    is_initial: bool = False
    is_final: bool = False
    is_special: bool = False      # Blocked, Cancelled, etc.

class TaskStatusSuggestion(BaseModel):
    """Complete task status workflow suggestion."""
    methodology: str
    columns: list[SuggestedColumn]
    rationale: str
```

#### 4.1.2 `domain/exceptions.py` (EXTEND)

```python
# Append to existing exceptions file
class AIWorkflowGenerationError(Exception):
    """Base for AI generation failures."""

class AIServiceUnavailableError(AIWorkflowGenerationError):
    """Provider unreachable, timeout, or 5xx."""

class RateLimitExceededError(AIWorkflowGenerationError):
    """Free tier daily quota hit. Carries `reset_in_seconds`."""
    def __init__(self, reset_in_seconds: int):
        self.reset_in_seconds = reset_in_seconds
        super().__init__(f"Rate limit. Resets in {reset_in_seconds}s.")

class InvalidWorkflowSuggestionError(AIWorkflowGenerationError):
    """LLM returned schema-valid but domain-invalid workflow."""
```

#### 4.1.3 `domain/services/ai_workflow_validator.py` (NEW)

Saf Python, frontend `lib/lifecycle/workflow-validators.ts`'nin Python aynası. Birim test edilebilir.

```python
def validate_lifecycle_suggestion(suggestion: WorkflowSuggestion) -> list[str]:
    """Returns empty list if valid; list of error strings otherwise."""
    errors = []
    if len(suggestion.nodes) < 3:
        errors.append("En az 3 node olmalı")
    if len(suggestion.nodes) > 12:
        errors.append("12 node sınırı aşıldı")
    if not any(_is_initial(n, suggestion.edges) for n in suggestion.nodes):
        errors.append("Başlangıç node'u yok")
    # ... duplicate IDs, isolated nodes, cycle detection
    return errors

def validate_task_status_suggestion(s: TaskStatusSuggestion) -> list[str]:
    """5-7 rule check for task status workflow."""
    # similar pattern
```

### 4.2 Application Layer (`Backend/app/application/`)

#### 4.2.1 `ports/ai_workflow_suggestion_port.py` (NEW)

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator
from app.application.dtos.ai_workflow_dto import (
    LifecycleFormDTO, TaskStatusFormDTO, WorkflowEventDTO
)

class IAIWorkflowSuggestionPort(ABC):
    """Provider-agnostic AI workflow generator."""

    @abstractmethod
    async def generate_lifecycle_stream(
        self, form: LifecycleFormDTO, language: str
    ) -> AsyncIterator[WorkflowEventDTO]:
        """Stream events for lifecycle generation."""
        ...

    @abstractmethod
    async def generate_task_status_stream(
        self, form: TaskStatusFormDTO, language: str
    ) -> AsyncIterator[WorkflowEventDTO]:
        """Stream events for task status generation."""
        ...
```

#### 4.2.2 `dtos/ai_workflow_dto.py` (NEW)

```python
from pydantic import BaseModel
from typing import Literal

class LifecycleFormDTO(BaseModel):
    """User's form input for lifecycle generation."""
    methodology: Literal["SCRUM","KANBAN","WATERFALL","ITERATIVE",
                        "INCREMENTAL","EVOLUTIONARY","RAD"]
    team_size: int | None = None             # Free input
    multi_team: bool = False
    duration_value: int | None = None        # Free input
    duration_unit: Literal["week","month","year"] | None = None
    open_ended: bool = False                  # Süresiz
    quality_code_review: bool = False
    quality_ci: bool = False
    quality_manual_qa: bool = False
    quality_uat: bool = False
    quality_security_audit: bool = False
    sector: str | None = None                # D-04: 80 char max (chip ID veya free text)
    deployment_model: Literal["saas","versioned","mobile"] | None = None
    additional_context: str = ""             # Free text, optional

    @field_validator("sector")
    @classmethod
    def sector_max_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 80:
            raise ValueError("Sektör adı 80 karakteri aşamaz")
        return v

class TaskStatusFormDTO(BaseModel):
    """User's form input for task status generation."""
    methodology: Literal["SCRUM","KANBAN","WATERFALL","ITERATIVE",
                        "INCREMENTAL","EVOLUTIONARY","RAD"]
    target_column_count: int | None = None   # None = AI decides
    has_code_review: bool = False
    has_qa_column: bool = False
    has_uat: bool = False
    has_security_audit: bool = False
    special_states: list[str] = []           # ["Blocked","Cancelled",...]
    bug_extra_verification: bool = False     # D-03: Bug için ayrı doğrulama adımı (multi-type yerine)
    wip_limits_enabled: bool = True
    additional_context: str = ""

class WorkflowEventDTO(BaseModel):
    """Single SSE event sent to frontend."""
    type: Literal["text_token","node_added","edge_added","column_added",
                  "rationale","done","error"]
    payload: dict
```

#### 4.2.3 `use_cases/generate_lifecycle_workflow_use_case.py` (NEW)

```python
class GenerateLifecycleWorkflowUseCase:
    """Orchestrates lifecycle AI generation. Pure domain logic + port."""

    def __init__(self, ai_port: IAIWorkflowSuggestionPort):
        self._ai = ai_port

    async def execute(
        self, form: LifecycleFormDTO, language: str = "tr"
    ) -> AsyncIterator[WorkflowEventDTO]:
        async for event in self._ai.generate_lifecycle_stream(form, language):
            yield event
```

#### 4.2.4 `use_cases/generate_task_status_workflow_use_case.py` (NEW)

Aynı pattern, `generate_task_status_stream` çağırır.

### 4.3 Infrastructure Layer (`Backend/app/infrastructure/`)

#### 4.3.1 `adapters/ai/gemini_workflow_adapter.py` (NEW) — Primary adapter

```python
from google import genai
from google.genai import types
import os

class GeminiWorkflowAdapter(IAIWorkflowSuggestionPort):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def generate_lifecycle_stream(self, form, language):
        prompt = LifecyclePromptBuilder.build(form, language)
        try:
            response_stream = await self._client.aio.models.generate_content_stream(
                model=self._model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": WorkflowSuggestion,  # Pydantic enforced
                    "temperature": 0.2,                     # Deterministic
                },
            )
            async for chunk in response_stream:
                async for event in self._parse_chunk_to_events(chunk):
                    yield event
            yield WorkflowEventDTO(type="done", payload={})
        except genai.errors.APIError as e:
            if e.status_code == 429:
                yield WorkflowEventDTO(
                    type="error",
                    payload={"kind": "rate_limit", "reset_in_seconds": 3600}
                )
            else:
                yield WorkflowEventDTO(
                    type="error", payload={"kind": "unavailable"}
                )
```

**Kritik detay — Structured Output:**
Gemini'nin Pydantic schema enforcement'ı sayesinde çıktı **garantili** `WorkflowSuggestion` formatında. Bu Anthropic tool use'undan **daha katı** garanti veriyor.

#### 4.3.2 `adapters/ai/prompt_builders/lifecycle_prompt_builder.py` (NEW)

Form DTO'sundan Gemini'ye gidecek zengin prompt'u üretir. Kullanıcı 3 chip seçer + 1 cümle yazar → biz arkada metodoloji-bilgili, sektör-farkında, sıkı kurallı prompt'a çeviririz.

```python
class LifecyclePromptBuilder:
    @staticmethod
    def build(form: LifecycleFormDTO, language: str) -> str:
        meth_explainer = METHODOLOGY_EXPLAINERS[form.methodology]
        quality_section = _build_quality_section(form)
        sector_hint = _build_sector_hint(form)

        return f"""Sen bir kıdemli proje yönetimi danışmanısın. {meth_explainer}

Görev: Aşağıdaki bağlama uygun bir proje yaşam döngüsü workflow'u üret.

Bağlam:
- Metodoloji: {form.methodology}
- Takım: {form.team_size or 'belirsiz'} kişi {' (çoklu takım)' if form.multi_team else ''}
- Süre: {_format_duration(form)}
- Sektör: {form.sector or 'belirsiz'}
- Dağıtım: {form.deployment_model or 'belirsiz'}

Kalite gereksinimleri:
{quality_section}

{sector_hint}

Ek kullanıcı notu: {form.additional_context or '(yok)'}

Kurallar:
- 4-8 node arası üret (takım küçükse az, büyükse fazla)
- Her node Türkçe isim ve 1 cümle açıklama
- Edge tipleri anlamlı: flow (ana akış), verification (doğrulama), feedback (geri besleme)
- {form.methodology}'ye özgü patternlar uygula (örn. Iterative'de feedback edge zorunlu)
- "rationale" alanında neden bu kararları aldığını 2-3 cümlede açıkla, Türkçe

Çıktı: response_schema'ya uygun JSON. Açıklama yapma, sadece JSON dön.
"""
```

#### 4.3.3 `adapters/ai/prompt_builders/task_status_prompt_builder.py` (NEW)

Aynı pattern, ama Görev Durumu özelinde:
- Scrum seçildiyse → "Sprint Backlog başlangıç sütunu zorunlu"
- Kanban seçildiyse → "WIP limitleri öne çıkar"
- vs.

#### 4.3.4 `adapters/ai/mock_workflow_adapter.py` (NEW) — Test/CI fallback

Sabit `WorkflowSuggestion` döner, 200ms aralıklarla stream eder. API key'siz tüm frontend test edilebilir.

```python
class MockWorkflowAdapter(IAIWorkflowSuggestionPort):
    async def generate_lifecycle_stream(self, form, language):
        # Hardcoded V-Model-like flow, streamed at 200ms intervals
        yield WorkflowEventDTO(type="text_token", payload={"text": "Iterative bir akış kuruyorum..."})
        await asyncio.sleep(0.3)
        yield WorkflowEventDTO(type="node_added", payload={
            "id": "nd_aimock0001", "label": "Keşif", ...
        })
        # ...
        yield WorkflowEventDTO(type="done", payload={})
```

#### 4.3.5 `adapters/ai/ollama_workflow_adapter.py` (NEW) — Offline yedek (opsiyonel)

Sunum sigortası olarak. Implementation v3.0'da ZORUNLU değil, v3.1'e bırakılabilir.

### 4.4 API Layer (`Backend/app/api/`)

#### 4.4.1 `api/dependencies.py` (EXTEND)

```python
import os

def get_ai_workflow_port() -> IAIWorkflowSuggestionPort:
    provider = os.getenv("AI_PROVIDER", "gemini")
    if provider == "mock":
        return MockWorkflowAdapter()
    if provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY not set")
        return GeminiWorkflowAdapter(api_key=api_key)
    if provider == "ollama":
        return OllamaWorkflowAdapter(host=os.getenv("OLLAMA_HOST"))
    raise ValueError(f"Unknown AI_PROVIDER: {provider}")
```

#### 4.4.2 `api/v1/ai_workflow.py` (NEW)

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.middleware.rate_limit import rate_limit_per_user

router = APIRouter(prefix="/ai", tags=["AI Workflow"])

@router.post(
    "/generate-lifecycle",
    dependencies=[Depends(rate_limit_per_user(max_calls=10, window_seconds=3600))],
)
async def generate_lifecycle(
    form: LifecycleFormDTO,
    ai_port: IAIWorkflowSuggestionPort = Depends(get_ai_workflow_port),
    current_user = Depends(get_current_user),
):
    use_case = GenerateLifecycleWorkflowUseCase(ai_port)
    async def event_stream():
        async for event in use_case.execute(form, language="tr"):
            yield f"data: {event.model_dump_json()}\n\n"
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@router.post("/generate-task-status", ...)
async def generate_task_status(...):
    # Same pattern
```

#### 4.4.3 `api/main.py` (EXTEND)

```python
from app.api.v1 import ai_workflow
app.include_router(ai_workflow.router, prefix="/api/v1")
```

---

## 5. Frontend Implementation

### 5.1 File Tree (Yeni dosyalar)

```
Frontend2/
├── components/
│   └── ai-workflow/                         ← YENİ KLASÖR
│       ├── ai-workflow-modal.tsx            ← Ana shell
│       ├── ai-lifecycle-form.tsx            ← Yaşam Döngüsü form'u (sol panel)
│       ├── ai-task-status-form.tsx          ← Görev Durumu form'u (sol panel)
│       ├── ai-chat-log.tsx                  ← Generating chat narration
│       ├── ai-live-canvas.tsx               ← Sağ canvas (WorkflowCanvas wrapper)
│       ├── ai-task-status-kanban.tsx        ← Task status için kanban canvas
│       ├── ai-rationale-card.tsx            ← "Neden bu workflow?" kartı
│       ├── ai-apply-confirmation.tsx        ← Apply overlay
│       ├── ai-error-state.tsx               ← AI down / rate limit
│       ├── ai-context-badge.tsx             ← "Yaşam Döngüsü Diyagramı" üst chip
│       └── ai-workflow-modal.test.tsx
├── lib/
│   └── ai/                                  ← YENİ KLASÖR
│       ├── sse-client.ts                    ← Fetch+ReadableStream SSE consumer
│       ├── types.ts                         ← LifecycleForm, TaskStatusForm, WorkflowEvent
│       └── form-to-summary.ts               ← Form → context badge text
├── hooks/
│   ├── use-ai-workflow-stream.ts            ← Stream consume + state machine
│   └── use-ai-modal.ts                      ← Modal open/close + variant + state
└── app/
    └── globals.css                          ← --ai-accent token EKLE
```

### 5.2 Komponent Sözleşmeleri

#### `ai-workflow-modal.tsx`

```typescript
type Variant = "lifecycle" | "task_status"
type ModalState = "idle" | "generating" | "done" | "apply" | "error" | "rate_limit"

interface AIWorkflowModalProps {
  open: boolean
  variant: Variant            // Hangi diyagrama açıldı
  projectId: string
  teamId?: string             // Task status için
  existingWorkflow?: WorkflowConfig  // Apply uyarısı için
  onClose: () => void
  onApply: (suggestion: WorkflowSuggestion, mode: "new" | "replace") => Promise<void>
}
```

Modal:
- Full-screen overlay, 95vw × 90vh
- Grid layout: 380px sol + 1fr sağ
- Üst header: breadcrumb + sparkle + close X
- Body: state'e göre form / chat+canvas / done view
- Footer: state'e göre buton kombinasyonu
- Apply confirmation: inline overlay (40% dim + center card)

#### `ai-lifecycle-form.tsx` (sol panel - idle state)

Mockup'taki **Yaşam Döngüsü Idle** ekranını birebir:
- Context badge (project adı)
- Metodoloji chips (7 öğe, mevcut `methodology-matrix.ts`'den)
- Takım büyüklüğü: `<Input type="number" />`
- Proje süresi: `<Input type="number" />` + `<Select>` (hafta/ay/yıl) + "Süresiz" radio
- Kalite Kontrolü: 5 `<Toggle>` (Code review, CI, Manuel QA, UAT, Güvenlik denetimi)
- Sektör: 5 chip + "Diğer" tıklanınca **inline input açılır** (D-04: `maxLength={80}`, autofocus, placeholder "örn. lojistik, kripto, kamu yönetimi"). Boş kalırsa undefined olarak gönderilir.
- Dağıtım modeli: 3 chip
- Ek bağlam: `<Textarea rows={4} />`
- Submit button: "Yaşam Döngüsünü Oluştur" full-width, --ai-accent

State `useReducer` ile (form karmaşık, useState yetmez).

#### `ai-task-status-form.tsx` (sol panel - idle state)

Mockup'taki **Görev Durumu Idle**:
- Context badge (team adı)
- Metodoloji chips (Lifecycle ile aynı 7 öğe)
- Hedef durum sayısı: number input + "AI karar versin" radio default
- Onay ve İnceleme: **5 toggle** (Code review, QA/Test, UAT, Güvenlik, **Bug için ayrı doğrulama adımı** — D-03)
- Özel durumlar: multi-select chip (7 öğe — Blocked, On Hold, Cancelled, Rejected, Müşteri Onayı Bekliyor, Dış Bağımlılık, Yeniden Açıldı)
- ~~Görev tipleri: multi-select chip~~ → **KALDIRILDI (D-03)**
- WIP limitleri: toggle
- Ek bağlam: textarea
- Submit: "Görev Durumlarını Oluştur"

#### `ai-live-canvas.tsx` (sağ panel - generating/done)

Mevcut `WorkflowCanvas` primitive'ini **readOnly modda** kullanır. Her event geldiğinde:

```typescript
case "node_added":
  setNodes(prev => [...prev, mapPayloadToNode(event.payload)])
  // CSS animation handles scale-in
  break
case "edge_added":
  await sleep(200)  // visual rhythm
  setEdges(prev => [...prev, mapPayloadToEdge(event.payload)])
  break
```

CSS (globals.css'e ekle):

```css
@keyframes ai-node-appear {
  from { opacity: 0; transform: scale(0.7) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.ai-generated-node {
  animation: ai-node-appear 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
@media (prefers-reduced-motion: reduce) {
  .ai-generated-node { animation: none; }
}
```

#### `ai-task-status-kanban.tsx`

Task status için **özel kanban renderer** — React Flow değil, basit flex layout:

```typescript
<div className="kanban-cols">
  {columns.map((col, idx) => (
    <Column
      key={col.id}
      title={col.label}
      taskCount={col.task_count}
      wipLimit={col.wip_limit}
      isSpecial={col.is_special}
      isAppearing={idx === columns.length - 1}  // son eklenene animasyon
    />
  ))}
</div>
```

#### `ai-apply-confirmation.tsx`

Mockup'taki overlay. İki radio + confirm. Apply tıklanınca parent'a hangi mode ile uygulayacağını söyler.

```typescript
interface AIApplyConfirmationProps {
  variant: "lifecycle" | "task_status"
  existingNodeCount: number      // D-02: 0 olsa bile gösterilir
  newNodeCount: number
  defaultMode?: "replace" | "new_project"  // D-01: "replace" default
  onConfirm: (mode: "replace" | "new_project") => void
  onCancel: () => void
}
```

**Davranış (D-01, D-02):**
- `defaultMode="replace"` → "Mevcut'u tamamen değiştir" radio default checked
- `existingNodeCount === 0` → Yine de gösterilir (atlama yok)
- Apply Confirmation **her durumda** kullanıcıya sorulur

#### `ai-error-state.tsx`

Mockup'taki 2 error state'i tek komponent (prop ile differentiate):

```typescript
type ErrorKind = "service_down" | "rate_limit"
interface AIErrorStateProps {
  kind: ErrorKind
  resetInSeconds?: number  // rate_limit için
  onRetry: () => void
  onGoToTemplates: () => void
}
```

### 5.3 SSE Client (`lib/ai/sse-client.ts`)

EventSource POST desteklemediği için fetch + ReadableStream:

```typescript
export async function* streamAIWorkflow<TForm>(
  endpoint: "lifecycle" | "task-status",
  form: TForm,
  signal: AbortSignal,
): AsyncIterableIterator<WorkflowEvent> {
  const res = await fetch(`/api/v1/ai/generate-${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
    signal,
  })

  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError(...)
    throw new AIServiceError(...)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      yield JSON.parse(line.slice(6)) as WorkflowEvent
    }
  }
}
```

### 5.4 State Machine Hook (`hooks/use-ai-workflow-stream.ts`)

```typescript
type State =
  | { status: "idle" }
  | { status: "generating"; progress: number; nodes: Node[]; edges: Edge[]; chatLog: string[] }
  | { status: "done"; suggestion: WorkflowSuggestion }
  | { status: "error"; kind: "service_down" | "rate_limit"; resetIn?: number }

export function useAIWorkflowStream(variant: Variant) {
  const [state, setState] = useState<State>({ status: "idle" })
  const abortRef = useRef<AbortController>()

  const generate = useCallback(async (form) => {
    abortRef.current = new AbortController()
    setState({ status: "generating", progress: 0, nodes: [], edges: [], chatLog: [] })

    try {
      for await (const event of streamAIWorkflow(variant === "lifecycle" ? "lifecycle" : "task-status", form, abortRef.current.signal)) {
        switch (event.type) {
          case "text_token": appendChatLog(event.payload.text); break
          case "node_added": addNode(event.payload); break
          case "edge_added": addEdge(event.payload); break
          case "rationale": setRationale(event.payload.text); break
          case "error":
            setState({ status: "error", kind: event.payload.kind, resetIn: event.payload.reset_in_seconds })
            return
          case "done":
            // Build final suggestion from accumulated state
            setState({ status: "done", suggestion: { ... } })
            return
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setState({ status: "error", kind: e instanceof RateLimitError ? "rate_limit" : "service_down" })
      }
    }
  }, [variant])

  const cancel = useCallback(() => abortRef.current?.abort(), [])

  return { state, generate, cancel }
}
```

### 5.5 Bottom Toolbar Aktivasyonu

`Frontend2/components/workflow-editor/bottom-toolbar.tsx` (mevcut):
- `disabled` prop kaldır
- "Yakında" badge kaldır
- `onClick={() => setAIModalOpen(true)}`
- Tooltip güncelle: "AI ile workflow oluştur"

### 5.6 Apply Sonrası Undo Toast

Mevcut toast sistemine entegre (varsa). Yoksa basit fixed-bottom widget:

```typescript
showToast({
  message: "AI önerisi uygulandı.",
  action: { label: "Geri Al", onClick: revertWorkflow },
  duration: 10_000,
  accent: "ai",  // violet renkli countdown bar
})
```

Backend tarafı: Apply çağrısı YAPILMADAN önce 10 saniyelik "pending commit" state'i tutulur (frontend state'inde), 10 saniye sonra gerçek PUT atılır. Kullanıcı 10 saniye içinde "Geri Al" derse PUT hiç atılmaz.

---

## 6. Gemini API Integration

### 6.1 Setup — Multi-Project Strategy (D-06)

Aynı Google hesabı altında **3 ayrı proje** oluşturulacak. Her birinin **bağımsız 500 RPD** quota'sı var (Google docs: "Rate limits are applied per project, not per API key").

**Adım 1 — Üç projeyi oluştur:**

[aistudio.google.com](https://aistudio.google.com) → "Get API key" → "Create API key in new project" 3 kez tekrar:

| Proje adı | Kullanım | API Key env var |
|---|---|---|
| `spms-dev` | Günlük geliştirme, prompt iterasyonu | `GOOGLE_API_KEY_DEV` |
| `spms-staging` | Demo öncesi prova (1-2 gün önce) | `GOOGLE_API_KEY_STAGING` |
| `spms-demo` | DEMO GÜNÜ — taze 500 RPD | `GOOGLE_API_KEY_DEMO` |

**Maliyet:** 0 TL (üçü de free tier, kredi kartı yok).

**Adım 2 — Backend `.env`:**

```bash
# .env (production-ready, demo-ready)
GOOGLE_API_KEY_DEV=AIza_dev_...
GOOGLE_API_KEY_STAGING=AIza_stg_...
GOOGLE_API_KEY_DEMO=AIza_demo_...

# Hangisi aktif olacaksa buraya kopyalanır
GOOGLE_API_KEY=${GOOGLE_API_KEY_DEV}

AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
```

**Adım 3 — Backend dependency:**

```bash
cd Backend && pip install google-genai
# requirements.txt'e ekle: google-genai>=0.3.0
```

**Demo prosedürü:**

1. Demo'dan 1 saat önce: `.env`'de `GOOGLE_API_KEY=${GOOGLE_API_KEY_DEMO}` değiştir
2. Backend restart (`uvicorn app.main:app --reload`)
3. Demo süresince **fresh 500 RPD** elinde
4. Hata olursa staging'e fallback
5. Tam felaket: `AI_PROVIDER=ollama` (offline, sınırsız — Wave 4+ opsiyonel)

**Repo'da:** `.env.example` 4 placeholder satır:
```
GOOGLE_API_KEY=
GOOGLE_API_KEY_DEV=
GOOGLE_API_KEY_STAGING=
GOOGLE_API_KEY_DEMO=
```

### 6.2 Free Tier Limitleri ve Caching

- **Limit:** 500 RPD, 10 RPM, 250K TPM (Aralık 2025 düşüşü sonrası)
- **Akademik demo için yeterli:** günlük ~150 gerçek kullanım buffer var

**Prompt caching (Gemini özelliği):**
Sistem promptu ve few-shot örnekleri cache'le:

```python
config={
    "response_mime_type": "application/json",
    "response_schema": WorkflowSuggestion,
    "cached_content": cached_system_prompt,  # ~90% token tasarrufu
}
```

### 6.3 Few-Shot Examples

`prompt_builders/examples/`:
- `lifecycle_scrum_example.json`
- `lifecycle_vmodel_example.json`
- `task_status_kanban_example.json`
- ...

İlk LLM çağrısında bunlar prompt'a iliştirilir, ardından cache'lenir.

### 6.4 Fallback Strategy

```
Birincil:    AI_PROVIDER=gemini       (production demo)
CI/test:     AI_PROVIDER=mock          (no API key needed)
Sunum yedeği: AI_PROVIDER=ollama       (offline)
```

Geçiş tek env değişikliği. Use case kodu **değişmiyor**.

---

## 7. Data Flow Diagram

```
┌──────────┐     1. POST /generate-lifecycle    ┌──────────────┐
│ Frontend │ ──────────────────────────────────▶│  FastAPI     │
│  Modal   │     {form data}                     │  /v1/ai/...  │
└────┬─────┘                                     └──────┬───────┘
     │                                                  │
     │ 2. SSE stream                                    │ A. Use Case
     │ event: {type, payload}                           │
     │                                                  ▼
     │                                            ┌──────────────┐
     │                                            │ Use Case     │
     │                                            │ (Application)│
     │                                            └──────┬───────┘
     │                                                  │
     │                                                  │ B. Port call
     │                                                  ▼
     │                                            ┌──────────────┐
     │                                            │ Gemini       │
     │                                            │ Adapter      │
     │                                            └──────┬───────┘
     │                                                  │
     │                                                  │ C. Build prompt
     │                                                  │    + send to API
     │                                                  ▼
     │                                            ┌──────────────┐
     │                                            │ Gemini API   │
     │                                            │ (free tier)  │
     │                                            └──────────────┘
     ▼
┌──────────┐
│ Live     │ 3. Render each event:
│ Canvas   │    node_added → scale-in node
│          │    edge_added → animate stroke
│          │    rationale → show card
└────┬─────┘
     │
     │ 4. User clicks Apply
     │ 5. PUT /projects/{id}/workflow
     ▼
┌──────────────┐
│ Persisted    │
│ (atomic)     │
└──────────────┘
```

---

## 8. Implementation Order (Wave-Based)

Frontend ve backend paralel yürür. Her wave kendi içinde atomik commit'lerle ilerler.

### Wave 1 — Foundation (1 gün)

| # | Task | Owner | Depends |
|---|---|---|---|
| 1.1 | `domain/entities/ai_workflow_suggestion.py` | Backend | — |
| 1.2 | `domain/exceptions.py` extend | Backend | — |
| 1.3 | `domain/services/ai_workflow_validator.py` + unit tests | Backend | 1.1 |
| 1.4 | `application/ports/ai_workflow_suggestion_port.py` | Backend | 1.1 |
| 1.5 | `application/dtos/ai_workflow_dto.py` | Backend | 1.1 |
| 1.6 | `application/use_cases/generate_lifecycle_workflow_use_case.py` | Backend | 1.4, 1.5 |
| 1.7 | `application/use_cases/generate_task_status_workflow_use_case.py` | Backend | 1.4, 1.5 |
| 1.8 | `infrastructure/adapters/ai/mock_workflow_adapter.py` | Backend | 1.4 |
| 1.9 | `api/dependencies.py` extend `get_ai_workflow_port()` | Backend | 1.8 |
| 1.10 | `api/v1/ai_workflow.py` routes | Backend | 1.6, 1.7, 1.9 |
| 1.11 | `lib/ai/types.ts` + `sse-client.ts` | Frontend | — |
| 1.12 | `hooks/use-ai-workflow-stream.ts` | Frontend | 1.11 |

**Wave 1 done = MockAdapter ile backend SSE çalışıyor, frontend stream consume edebiliyor (UI yok).**

### Wave 2 — UI Shell (1 gün)

| # | Task | Owner | Depends |
|---|---|---|---|
| 2.1 | `globals.css` → `--ai-accent` ve animasyon keyframe'leri | Frontend | — |
| 2.2 | `components/ai-workflow/ai-workflow-modal.tsx` shell | Frontend | 1.12 |
| 2.3 | `ai-context-badge.tsx` | Frontend | — |
| 2.4 | `ai-lifecycle-form.tsx` (idle state) | Frontend | 2.2 |
| 2.5 | `ai-task-status-form.tsx` (idle state) | Frontend | 2.2 |
| 2.6 | `bottom-toolbar.tsx` aktivasyonu | Frontend | 2.2 |
| 2.7 | Test: Mock adapter ile modal aç, idle state çalışıyor | Both | 2.6 |

**Wave 2 done = Demo edilebilir UI var (mock data ile).**

### Wave 3 — Live Generation (1.5 gün)

| # | Task | Owner | Depends |
|---|---|---|---|
| 3.1 | `ai-chat-log.tsx` | Frontend | 2.2 |
| 3.2 | `ai-live-canvas.tsx` (Lifecycle için) | Frontend | 2.2 |
| 3.3 | `ai-task-status-kanban.tsx` | Frontend | 2.2 |
| 3.4 | Generating state animasyonları (CSS) | Frontend | 3.2, 3.3 |
| 3.5 | `ai-rationale-card.tsx` | Frontend | 2.2 |
| 3.6 | Done state full render | Frontend | 3.1-3.5 |

**Wave 3 done = Mock adapter ile uçtan uca canlı çizim deneyimi çalışıyor.**

### Wave 4 — Gemini Integration (1 gün)

| # | Task | Owner | Depends |
|---|---|---|---|
| 4.1 | `pip install google-genai` + .env setup | Backend | — |
| 4.2 | `adapters/ai/gemini_workflow_adapter.py` | Backend | 1.4, 1.5 |
| 4.3 | `prompt_builders/lifecycle_prompt_builder.py` | Backend | 4.2 |
| 4.4 | `prompt_builders/task_status_prompt_builder.py` | Backend | 4.2 |
| 4.5 | Few-shot örnekler (4 örnek JSON) | Backend | 4.3, 4.4 |
| 4.6 | Switch `AI_PROVIDER=gemini` + uçtan uca test | Both | 4.2-4.5 |

**Wave 4 done = Gerçek Gemini ile workflow üretiliyor.**

### Wave 5 — Apply & Error Handling (0.5 gün)

| # | Task | Owner | Depends |
|---|---|---|---|
| 5.1 | `ai-apply-confirmation.tsx` overlay | Frontend | 3.6 |
| 5.2 | `ai-error-state.tsx` (down + rate_limit) | Frontend | — |
| 5.3 | Apply mantığı: yeni proje / replace + 10sn undo toast | Frontend | 5.1 |
| 5.4 | Rate limiter middleware (FastAPI) | Backend | — |
| 5.5 | Hata loglama (token usage, latency) | Backend | 4.2 |

**Wave 5 done = Production-ready.**

### Wave 6 — Polish & Test (0.5 gün)

| # | Task | Owner |
|---|---|---|
| 6.1 | `prefers-reduced-motion` audit | Frontend |
| 6.2 | Accessibility audit (focus rings, aria-labels) | Frontend |
| 6.3 | Bilingual TR/EN check | Frontend |
| 6.4 | Unit tests: domain validator, prompt builders | Backend |
| 6.5 | RTL tests: form interactions, stream consume | Frontend |
| 6.6 | Manual smoke: 5 methodology × 2 variant = 10 üretim | Both |

**Toplam: ~5 gün (1 kişi tam zamanlı, 2 kişi paralel ~3 gün).**

---

## 9. Testing Strategy

### Backend

| Layer | Test türü | Örnek |
|---|---|---|
| Domain | Unit (pytest) | `test_validate_lifecycle_suggestion()` — 5 kuralın her biri |
| Application | Unit + mock port | Use case mock port ile test edilir, gerçek LLM çağrılmadan |
| Infrastructure | Integration (recorded responses) | Gemini adapter sahte API response ile parse test |
| API | E2E (httpx async) | SSE stream `text/event-stream` döker, event parse edilebilir |

**Kritik:** `MockWorkflowAdapter` sayesinde **API key olmadan CI'da tüm testler** geçer.

### Frontend

| Test türü | Örnek |
|---|---|
| Unit (vitest) | `sse-client.ts` parse logic |
| RTL | Form submission, state transitions |
| Storybook (varsa) | Her state için snapshot |

### Manual Smoke

Demo provası: 10 senaryo (5 metodoloji × 2 varyant). Her birinde:
1. Form doldur (gerçekçi veriler)
2. Üret tıkla
3. Canvas çizilirken izle (3-5sn ideal)
4. Done state'i kontrol et (rationale anlamlı mı?)
5. Apply → yeni proje olarak kaydet
6. Mevcut proje'de değişiklik yok mu kontrol et

---

## 10. Security & Privacy

| Risk | Mitigation |
|---|---|
| API key sızıntısı | `.env` git'e GIRMEZ. `.env.example` placeholder ile commit edilir. Frontend'e ASLA gönderilmez. |
| Prompt injection | Kullanıcı text'i (`additional_context`) prompt'ta `<user_input>...</user_input>` tag içinde gönderilir. System prompt'tan ayrılır. |
| Cost abuse | Rate limit (D-05): 3 katmanlı — user-hour=8, user-day=25, project-day=400. FastAPI middleware, in-memory. |
| Veri gizliliği | Kullanıcı bilgisi (proje adı, team adı) Gemini'ye gider. Onay ekranı düşünülebilir (akademik demo'da gerek yok ama production'da gerekli). |
| Token usage logging | Her çağrı: user_id + token count + latency loglanır. **Prompt content loglanmaz.** |

### 10.1 Rate Limiter Implementation (D-05)

`Backend/app/api/middleware/rate_limit.py` (NEW):

```python
from fastapi import HTTPException, Request, status
from collections import defaultdict
from time import time
from datetime import datetime, timezone

USER_HOURLY_LIMIT = 8
USER_DAILY_LIMIT = 25
PROJECT_DAILY_LIMIT = 400

class AIRateLimiter:
    """In-memory 3-tier rate limiter. Single-instance backend için yeterli."""

    def __init__(self):
        self.user_hour: dict[str, list[float]] = defaultdict(list)
        self.user_day: dict[str, list[float]] = defaultdict(list)
        self.project_day: list[float] = []

    def _seconds_until_utc_midnight(self) -> int:
        now = datetime.now(timezone.utc)
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        midnight = midnight.replace(day=midnight.day + 1)
        return int((midnight - now).total_seconds())

    async def check_and_increment(self, user_id: str) -> None:
        """Raises HTTPException if any tier exceeded."""
        now = time()

        # Sliding window for hourly
        self.user_hour[user_id] = [t for t in self.user_hour[user_id] if now - t < 3600]
        # Daily windows (sliding, not UTC-anchored for simplicity)
        self.user_day[user_id] = [t for t in self.user_day[user_id] if now - t < 86400]
        self.project_day = [t for t in self.project_day if now - t < 86400]

        # Tier 1: user hourly
        if len(self.user_hour[user_id]) >= USER_HOURLY_LIMIT:
            oldest = self.user_hour[user_id][0]
            reset_in = int(3600 - (now - oldest))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"kind": "user_hourly", "reset_in_seconds": reset_in},
                headers={"Retry-After": str(reset_in)},
            )

        # Tier 2: user daily
        if len(self.user_day[user_id]) >= USER_DAILY_LIMIT:
            reset_in = self._seconds_until_utc_midnight()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"kind": "user_daily", "reset_in_seconds": reset_in},
                headers={"Retry-After": str(reset_in)},
            )

        # Tier 3: project ceiling
        if len(self.project_day) >= PROJECT_DAILY_LIMIT:
            reset_in = self._seconds_until_utc_midnight()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"kind": "project_quota", "reset_in_seconds": reset_in},
            )

        # All passed — record
        self.user_hour[user_id].append(now)
        self.user_day[user_id].append(now)
        self.project_day.append(now)


# Singleton instance
_limiter = AIRateLimiter()

async def rate_limit_dependency(request: Request):
    user_id = request.state.user.id  # from auth middleware
    await _limiter.check_and_increment(user_id)
```

**Frontend tarafında 429 handling:** SSE client'ta `res.status === 429` ise `RateLimitError` throw et, hook bunu yakalayıp State 6'ya geç (rate_limit ekranı + countdown).

---

## 11. Risk Register

| # | Risk | Olasılık | Etki | Mitigation |
|---|---|---|---|---|
| R1 | Gemini API demo günü down | Düşük | Yüksek | `AI_PROVIDER=mock` env switch, MockAdapter önceden hazır demo workflow'u döker |
| R2 | Free tier kotası demo günü tükenir | Düşük (D-06 sonrası) | Yüksek | `spms-demo` projesinden taze 500 RPD demo günü kullanılır. `spms-staging` ve `spms-dev` projeleri ayrıca emergency fallback. Multi-project sayesinde günlük geliştirme demo quotasını tüketmez. |
| R3 | LLM Türkçe çıktısı kötü | Düşük | Orta | Few-shot örnekleri sıkı kontrol et. Gemini Turkish benchmark'larda strong. |
| R4 | Structured output validation fail | Düşük | Düşük | Pydantic `response_schema` Gemini tarafında enforced. Yine de retry once. |
| R5 | Stream yarıda kesilir | Düşük | Orta | UI'da "Tekrar Dene" butonu. Kullanıcı abort eder, yeni stream başlatılır. |
| R6 | Canvas çizim animasyonu yavaş hisset | Orta | Düşük | Her node arası 200ms artificial delay (kasıtlı ritm) |
| R7 | Mevcut workflow Apply'da silinir, kullanıcı pişman olur | Orta | Yüksek | D-01: "Mevcut'u değiştir" default ama 2 radio + destructive warning + 10sn undo toast. Kullanıcı bilinçli tıklamış olur. |
| R8 | Demo'da heyecanlı kullanıcı rate limit'e takılır | Orta | Orta | D-05 limitleri demo için yeterli (25 req/gün/user). Eğer hit olursa nice rate_limit ekranı + Şablonlara Git fallback. Demo öncesi her test kullanıcısı için ayrı hesap önerilir. |

---

## 12. Out of Scope (v3.1+)

- **"İyileştir" modu** — Mevcut workflow'a AI'dan iyileştirme önerisi al
- **"Sonraki Faz" modu** — Tek node suggestion
- **Chat continuation** — Done state'te follow-up sorular ("Bir faz daha ekle")
- **Workflow karşılaştırma** — 2 AI üretimi yan yana görsel diff
- **Templating** — Başarılı AI üretimini şablon olarak kaydet
- **Multi-provider UI** — Kullanıcı Gemini/OpenAI/Ollama seçer
- **Voice input** — Konuşarak bağlam aktar
- **Image input** — Whiteboard fotoğrafından workflow çıkar

---

## 13. Definition of Done

Bu phase tamamlanmış sayılır eğer:

- [ ] `[✦ AI öner]` butonu workflow editor'da aktif (disabled değil)
- [ ] Yaşam Döngüsü varyantı 7 metodoloji için çalışıyor (Scrum/Kanban/Waterfall/Iterative/Incremental/Evolutionary/RAD)
- [ ] Görev Durumu varyantı 7 metodoloji için çalışıyor (Scrum'da Sprint Backlog beliriyor)
- [ ] Canvas canlı çiziyor (node'lar sırayla beliriyor, edge'ler animasyonla bağlanıyor)
- [ ] Rationale card Done state'te görünüyor, Türkçe ve anlamlı
- [ ] Apply confirmation 2 seçenek sunuyor — **"Mevcut'u değiştir" default seçili (D-01)**
- [ ] Boş workflow'da bile Apply confirmation gösteriliyor (D-02)
- [ ] Görev Durumu form'unda "Görev Tipleri" section YOK, "Bug için ayrı doğrulama" toggle VAR (D-03)
- [ ] "Diğer" sektör seçilince inline text input açılıyor, maxLength=80 (D-04)
- [ ] Apply sonrası undo toast 10 sn aktif (geri sayım visible)
- [ ] Error state'leri görsel olarak hazır (servis down + rate limit + reset countdown)
- [ ] Rate limit middleware aktif — 3 katman: user-hour=8, user-day=25, project-day=400 (D-05)
- [ ] 429 ve 503 hata kodları frontend'de doğru ekrana yönlendiriyor
- [ ] 3 ayrı Google Cloud projesi oluşturulmuş, env vars set edilmiş (D-06)
- [ ] Mock adapter ile API key'siz CI testleri geçiyor
- [ ] Gerçek Gemini ile en az 1 manuel smoke test geçti (her 7 metodoloji × 2 varyant)
- [ ] `prefers-reduced-motion` desteği audited
- [ ] TR + EN switching çalışıyor
- [ ] CLAUDE.md DIP kuralı ihlal edilmedi (`application/` içinde provider import yok)
- [ ] Mockup ile final UI %95+ paritede

---

## 14. Cross-References

### Mevcut artefaktlar

- **Mockup:** [`Frontend2/public/ai-mockup.html`](../Frontend2/public/ai-mockup.html) — 12 ekran interactive HTML
- **CLAUDE.md:** [`CLAUDE.md`](../CLAUDE.md) — Clean Architecture kuralları
- **Methodology Type:** [`Frontend2/lib/methodology-matrix.ts`](../Frontend2/lib/methodology-matrix.ts) — 7 metodoloji listesi
- **Lifecycle Presets:** [`Frontend2/lib/lifecycle/presets.ts`](../Frontend2/lib/lifecycle/presets.ts) — Şablonlar (AI öner'in alternatifi)
- **Workflow Validators:** [`Frontend2/lib/lifecycle/workflow-validators.ts`](../Frontend2/lib/lifecycle/workflow-validators.ts) — Frontend kuralları (Python aynası gerekli)
- **Bottom Toolbar:** [`Frontend2/components/workflow-editor/bottom-toolbar.tsx`](../Frontend2/components/workflow-editor/bottom-toolbar.tsx) — `[✦ AI öner]` butonunun yeri (şu an disabled)
- **Workflow Canvas:** [`Frontend2/components/workflow-editor/workflow-canvas.tsx`](../Frontend2/components/workflow-editor/workflow-canvas.tsx) — Reuse hedefi

### Phase 12 referansları

- **Phase 12 Context:** [`phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md`](phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md) — AI v3.0'a deferred edilmiş D-33

### Eksternal kaynaklar

- [Gemini API Free Tier Guide](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Structured Output Docs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Google GenAI Python SDK](https://github.com/googleapis/python-genai)
- [AI Studio (API Key)](https://aistudio.google.com)

---

## 15. Open Questions — ✅ TÜMÜ CEVAPLANDI (2026-05-19)

Kararlar §17 Locked-In Decisions'da detaylı işlendi. Özet:

1. ✅ **Apply mode default** → "Mevcut'u değiştir" default (D-01)
2. ✅ **Existing workflow boşsa** → Yine de Apply Confirmation göster (D-02)
3. ✅ **Görev tipleri** → Section KALDIRILDI, yerine tek toggle "Bug için ayrı doğrulama" (D-03)
4. ✅ **Sektör "Diğer" max length** → 80 karakter (D-04)
5. ✅ **Rate limit** → 3 katmanlı (user-hour=8, user-day=25, project-day=400) (D-05)
6. ✅ **Demo API key** → 3 ayrı Google Cloud projesi (dev/staging/demo) (D-06)

İmplementasyon başlayabilir.

---

## 17. Locked-In Decisions (Implementation Öncesi Onaylı)

§15'teki Open Questions cevaplandı (2026-05-19). İmplementasyon bu kararları **birebir** uygular.

### D-01: Apply Mode Default = "Mevcut'u Değiştir"

Apply Confirmation overlay'inde:
- **◉ Mevcut yaşam döngüsünü tamamen değiştir** (default seçili)
- ○ Mevcut workflow'u koru, yeni proje oluştur

İkisi de yapılabilir; sadece default seçim değişti. Destructive option olduğu için kullanıcı **bilinçli** tıklamış olur (mockup'taki "Bu işlem geri alınamaz" uyarısı zaten var).

**Frontend impact:** [`ai-apply-confirmation.tsx`](#) — `defaultMode="replace"` prop.

### D-02: Boş Workflow İçin Apply Confirmation Atlama YOK

Mevcut workflow 0 node içerse bile Apply Confirmation gösterilecek. Kullanıcı her zaman "bu workflow uygulanacak, onaylıyor musun?" sorusu görür. Tutarlılık > kolaylık.

**Frontend impact:** `if (existingWorkflow.nodes.length === 0) skipConfirmation = true` mantığı YOK.

### D-03: "Görev Tipleri" Section KALDIRILDI

Multi-select chip (Story/Bug/Task/Spike/Epic) **kaldırıldı**. Yerine **tek toggle**:

```
☐ Bug için ayrı doğrulama adımı ekle
   → Bug çözüldükten sonra "Verification" sütunu eklenir, 
     direkt Done'a gitmez. Diğer görevler bu kolu kullanmaz.
```

**Gerekçe:** Jira'da type-per-workflow var ama pratikte takımların çoğu kullanmıyor. Linear/Asana zaten desteklemiyor. Multi-workflow karmaşıklığı akademik proje için ROI negatif. Tek toggle ile spesifik faydayı (bug verification) korurken karmaşayı atıyoruz.

**Backend impact:** `TaskStatusFormDTO.task_types: list[str]` kaldırıldı, yerine `bug_extra_verification: bool = False` eklendi.

**Frontend impact:** `ai-task-status-form.tsx` — "Görev Tipleri" section yerine "Onay ve İnceleme" altında ek toggle.

### D-04: "Diğer" Sektör Input = 80 Karakter

`<input type="text" maxLength={80}>`. Helper text: "Sektörü yaz (örn. lojistik, kripto, kamu yönetimi)".

**Gerekçe:** Türkçe sektör isimleri 5-13 karakter arasında, 80 char bol buffer ile "Yapay zeka destekli sağlık teknolojileri" (40 char) gibi spesifik tanımları da kapsar. Uzun açıklamalar `additional_context` textarea'ya gider.

**Frontend impact:** Sektör chip group'ta "Diğer" tıklanınca chip yerine inline input açılır, focus otomatik input'a gider.

### D-05: Rate Limiting — 3 Katmanlı Strateji

```python
USER_HOURLY_LIMIT = 8       # request/saat (sliding window)
USER_DAILY_LIMIT = 25       # request/gün (UTC midnight reset)
PROJECT_DAILY_LIMIT = 400   # request/gün (Gemini 500 RPD'nin %80'i)
```

**Reset stratejisi:**
- User-hour: sliding window (timestamp listesi, 3600s'den eski olanlar elenir)
- User-day: UTC 00:00'da temizlenir
- Project-day: UTC 00:00'da temizlenir (Gemini reset'i ile senkronize)

**Hata davranışı:**

| Limit | HTTP | UI'da gösterilen |
|---|---|---|
| User hourly | 429 | Toast: "Saatlik AI sınırına ulaştın. X dakika sonra tekrar dene." |
| User daily | 429 | State 6 (rate_limit ekranı): "Günlük AI kullanım sınırına ulaştın" + reset countdown |
| Project daily | 503 | State 5 (service_down): "AI servisi şu an meşgul, yarın tekrar dene" + Şablonlara Git fallback |

**Backend impact:** [`api/middleware/rate_limit.py`](#) — `RateLimiter` class, in-memory (single-instance backend için yeterli). Multi-instance'a geçilirse Redis'e taşınır.

**Implementation örneği:** Plan §10 Security & Privacy bölümünde tam kod.

### D-06: Demo İçin Ayrı Google Cloud Projesi

Aynı Google hesabı altında **3 ayrı proje** oluşturulacak. Her birinin **bağımsız 500 RPD** quota'sı var.

```
spms-dev      (development quota)  AIza_dev_...    → günlük geliştirme
spms-staging  (pre-demo provası)   AIza_stg_...    → demo öncesi prova
spms-demo     (DEMO GÜNÜ)          AIza_demo_...   → SADECE demo sunumunda
```

**Maliyet:** 0 TL (üçü de free tier).

**Demo prosedürü:**
1. Demo'dan 1 saat önce: `.env`'de `GOOGLE_API_KEY=AIza_demo_...` olarak değiştir
2. Backend restart
3. Demo süresince **fresh 500 RPD** elinde
4. Hata olursa `spms-staging`'e fallback (emergency)
5. Tam felaket senaryosunda `AI_PROVIDER=ollama` (offline, sınırsız)

**Repo'da:** `.env.example` dosyasında 3 placeholder satır:
```
GOOGLE_API_KEY_DEV=
GOOGLE_API_KEY_STAGING=
GOOGLE_API_KEY_DEMO=
```
Hangisi aktif olacaksa `GOOGLE_API_KEY=` satırına kopyalanır.

---

## 16. Implementation Sırası — Önerilen Komut Dizisi

Wave 1'i başlatmak için ilk adımlar:

```bash
# Backend hazırlık
cd /Users/ayseoz/Desktop/project-management-system/Backend
pip install google-genai
echo "GOOGLE_API_KEY=<key>" >> .env
echo "AI_PROVIDER=mock" >> .env  # Wave 4'e kadar mock

# Domain dosyaları oluştur
mkdir -p app/domain/services
touch app/domain/entities/ai_workflow_suggestion.py
touch app/domain/services/ai_workflow_validator.py

# Application dosyaları
mkdir -p app/application/ports
touch app/application/ports/ai_workflow_suggestion_port.py
touch app/application/dtos/ai_workflow_dto.py
touch app/application/use_cases/generate_lifecycle_workflow_use_case.py
touch app/application/use_cases/generate_task_status_workflow_use_case.py

# Infrastructure
mkdir -p app/infrastructure/adapters/ai/prompt_builders
touch app/infrastructure/adapters/ai/mock_workflow_adapter.py
touch app/infrastructure/adapters/ai/gemini_workflow_adapter.py
touch app/infrastructure/adapters/ai/prompt_builders/lifecycle_prompt_builder.py
touch app/infrastructure/adapters/ai/prompt_builders/task_status_prompt_builder.py

# API
mkdir -p app/api/v1
touch app/api/v1/ai_workflow.py

# Frontend hazırlık
cd ../Frontend2
mkdir -p components/ai-workflow
mkdir -p lib/ai
mkdir -p hooks
```

İskelet hazır, Wave 1'in 1.1 task'inden başla.

---

**Plan oluşturuldu: 2026-05-19. Implementation başlamadan önce §15 Open Questions netleştirilmeli.**
