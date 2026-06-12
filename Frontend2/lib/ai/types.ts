/**
 * AI Workflow Generator — TypeScript types (mirrors Backend DTOs).
 *
 * Keep in lockstep with Backend/app/application/dtos/ai_workflow_dto.py.
 * If you change one, change the other.
 */

// ---------------------------------------------------------------------------
// Criteria answer spaces — kullanıcı metodoloji seçmez, AI tasarlar
// ---------------------------------------------------------------------------

export type ReqClarity = "clear_stable" | "mostly_clear" | "vague" | "volatile"
export type DeliveryStyle = "big_bang" | "increments" | "continuous_flow" | "prototype_first"
export type CustomerInvolvement = "continuous" | "milestones" | "start_end"
export type RiskProfile = "low" | "medium" | "high_innovative"
export type VerificationRigor = "standard" | "high" | "critical"
export type SchedulePressure = "relaxed" | "strict_deadline" | "asap_mvp"
export type InterruptLevel = "rare" | "moderate" | "constant"
export type ComplianceLevel = "none" | "some" | "heavy"
export type TeamCadence = "sprints" | "flow" | "phases"

/** Çizim şekli — backend layout motorunun anahtarı (methodology değil) */
export type LayoutArchetype =
  | "WATERFALL"
  | "V_MODEL"
  | "SPIRAL"
  | "CYCLE"
  | "INCREMENTAL_ROWS"
  | "PROTOTYPE_LOOP"
  | "PARALLEL_BRANCH"
  | "PIPELINE"
  | "FREEFORM"

// ---------------------------------------------------------------------------
// Form inputs (user → backend)
// ---------------------------------------------------------------------------

export interface LifecycleFormDTO {
  req_clarity?: ReqClarity | null
  delivery_style?: DeliveryStyle | null
  customer_involvement?: CustomerInvolvement | null
  risk_profile?: RiskProfile | null
  verification_rigor?: VerificationRigor | null
  schedule_pressure?: SchedulePressure | null
  interrupt_level?: InterruptLevel | null
  compliance_level?: ComplianceLevel | null
  team_cadence?: TeamCadence | null
  team_size?: number | null
  multi_team?: boolean
  duration_value?: number | null
  duration_unit?: "week" | "month" | "year" | null
  open_ended?: boolean
  quality_code_review?: boolean
  quality_ci?: boolean
  quality_manual_qa?: boolean
  quality_uat?: boolean
  quality_security_audit?: boolean
  sector?: string | null // D-04: 80 char max
  deployment_model?: "saas" | "versioned" | "mobile" | null
  additional_context?: string
}

export interface TaskStatusFormDTO {
  work_style?: TeamCadence | null
  target_column_count?: number | null
  has_code_review?: boolean
  has_qa_column?: boolean
  has_uat?: boolean
  has_security_audit?: boolean
  bug_extra_verification?: boolean // D-03
  special_states?: string[]
  wip_limits_enabled?: boolean
  additional_context?: string
}

// ---------------------------------------------------------------------------
// Stream event envelope (backend → frontend)
// ---------------------------------------------------------------------------

export type WorkflowEventType =
  | "text_token"
  | "node_added"
  | "edge_added"
  | "column_added"
  | "rationale"
  | "done"
  | "error"

export interface WorkflowEvent {
  type: WorkflowEventType
  payload: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Payload shapes per event type (narrowed unions for type safety)
// ---------------------------------------------------------------------------

export interface SuggestedNodePayload {
  id: string
  label: string
  description: string
  color: "status-todo" | "status-progress" | "status-review" | "status-done" | "status-blocked"
  /** Backend layout motorunun bastığı koordinatlar — frontend asla hesaplamaz */
  x: number
  y: number
}

export interface SuggestedEdgePayload {
  source_id: string
  target_id: string
  edge_type: "flow" | "verification" | "feedback"
  bidirectional: boolean
  is_all_gate: boolean
  label: string | null
}

export interface SuggestedColumnPayload {
  id: string
  label: string
  description: string
  color: "status-todo" | "status-progress" | "status-review" | "status-done" | "status-blocked"
  wip_limit: number | null
  is_initial: boolean
  is_final: boolean
  is_special: boolean
}

export interface TextTokenPayload {
  text: string
}

export interface RationalePayload {
  text: string
}

export interface DonePayload {
  node_count?: number
  edge_count?: number
  column_count?: number
  /** AI'ın seçtiği sürecin serbest Türkçe adı (hibrit olabilir) */
  methodology: string
  layout_archetype?: LayoutArchetype
}

export type ErrorKind = "service_down" | "rate_limit" | "invalid"

export interface ErrorPayload {
  kind: ErrorKind
  reset_in_seconds?: number // present when kind === "rate_limit"
  message?: string
}

// ---------------------------------------------------------------------------
// Error subclasses for SSE client throws
// ---------------------------------------------------------------------------

export class AIServiceUnavailableError extends Error {
  constructor(message = "AI servisine şu an ulaşılamıyor") {
    super(message)
    this.name = "AIServiceUnavailableError"
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly resetInSeconds: number,
    public readonly kind: "user_hourly" | "user_daily" | "project_quota" = "user_daily",
  ) {
    super(`Rate limit (${kind}). Resets in ${resetInSeconds}s.`)
    this.name = "RateLimitError"
  }
}
