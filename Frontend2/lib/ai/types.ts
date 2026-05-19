/**
 * AI Workflow Generator — TypeScript types (mirrors Backend DTOs).
 *
 * Plan reference: .planning/ai-workflow-generator-plan.md §5.1 (lib/ai/types.ts)
 *
 * Keep in lockstep with Backend/app/application/dtos/ai_workflow_dto.py.
 * If you change one, change the other.
 */

// ---------------------------------------------------------------------------
// Methodology — single source of truth (matches methodology-matrix.ts)
// ---------------------------------------------------------------------------

export type Methodology =
  | "SCRUM"
  | "KANBAN"
  | "WATERFALL"
  | "ITERATIVE"
  | "INCREMENTAL"
  | "EVOLUTIONARY"
  | "RAD"

// ---------------------------------------------------------------------------
// Form inputs (user → backend)
// ---------------------------------------------------------------------------

export interface LifecycleFormDTO {
  methodology: Methodology
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
  methodology: Methodology
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
  /** Adapter-decided layout — frontend renders nodes at these exact coords
   *  so React Flow's auto-fit doesn't shuffle them during streaming. */
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
  methodology: Methodology
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
