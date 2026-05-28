/**
 * SSE Client — fetch+ReadableStream consumer for AI workflow streaming.
 *
 * Native `EventSource` doesn't support POST (only GET) and our endpoints
 * accept a form body, so we hand-roll the SSE parser. Generator pattern
 * lets the consumer `for await (...)` and process events as they arrive.
 *
 * Plan reference: .planning/ai-workflow-generator-plan.md §5.3
 */

import { AUTH_TOKEN_KEY } from "@/lib/constants"
import {
  AIServiceUnavailableError,
  type LifecycleFormDTO,
  RateLimitError,
  type TaskStatusFormDTO,
  type WorkflowEvent,
} from "./types"

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api/v1"

type Endpoint = "lifecycle" | "task-status"
type FormFor<E extends Endpoint> = E extends "lifecycle"
  ? LifecycleFormDTO
  : TaskStatusFormDTO

/**
 * Stream AI workflow events from backend SSE endpoint.
 *
 * @throws RateLimitError on 429 (with reset_in_seconds from response body)
 * @throws AIServiceUnavailableError on 5xx, network, or invalid responses
 * @throws DOMException(AbortError) when signal aborts (call .abort() to cancel)
 */
export async function* streamAIWorkflow<E extends Endpoint>(
  endpoint: E,
  form: FormFor<E>,
  signal: AbortSignal,
): AsyncIterableIterator<WorkflowEvent> {
  const url = `${API_BASE}/ai/generate-${endpoint}`
  const rawToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null
  // Same quoted-token guard as api-client.ts (defensive)
  const token = rawToken?.replace(/^"|"$/g, "") ?? ""

  // Cold-start guard (Wave 5.5) — Gemini's first call can take 8-10s on
  // a freshly-issued key. The default browser fetch has no explicit timeout
  // for the request itself (only inactive-socket timeouts that vary), so we
  // wire an internal AbortSignal that fires after 60s. Caller-supplied signal
  // (from the React hook's AbortController) still wins if user clicks cancel.
  const COLD_START_TIMEOUT_MS = 60_000
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(),
    COLD_START_TIMEOUT_MS,
  )
  // Combine signals: abort the fetch if the caller aborts. Named so it can be
  // removed when the stream finishes or the request fails, instead of lingering
  // on the caller's signal.
  const onCallerAbort = () => timeoutController.abort()
  signal.addEventListener("abort", onCallerAbort)

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      signal: timeoutController.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    })
  } catch (e) {
    window.clearTimeout(timeoutId)
    signal.removeEventListener("abort", onCallerAbort)
    // If our internal timeout fired (caller didn't abort), surface as
    // service-unavailable with a clear message; AbortError from the caller
    // signal stays as AbortError so the hook can return cleanly.
    if ((e as Error).name === "AbortError") {
      if (signal.aborted) throw e
      throw new AIServiceUnavailableError(
        "AI servisi zaman aşımına uğradı (60sn). Tekrar dener misin?",
      )
    }
    throw new AIServiceUnavailableError(
      "AI servisine bağlanılamadı (ağ hatası).",
    )
  }
  // Once headers arrive, clear the timeout — stream may legitimately take
  // longer than 60s for large workflows.
  window.clearTimeout(timeoutId)

  // -------------------------------------------------------------------------
  // Error responses (429, 503, etc.) — parse body for context, throw typed
  // -------------------------------------------------------------------------

  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "0", 10)
      let kind: "user_hourly" | "user_daily" | "project_quota" = "user_daily"
      let resetIn = retryAfter || 3600
      try {
        const body = await res.json()
        if (body?.detail?.reset_in_seconds) {
          resetIn = body.detail.reset_in_seconds
        }
        if (body?.detail?.kind) {
          kind = body.detail.kind
        }
      } catch {
        /* response had no JSON body; fall back to defaults */
      }
      throw new RateLimitError(resetIn, kind)
    }
    throw new AIServiceUnavailableError(
      `AI servisi yanıt vermiyor (HTTP ${res.status}).`,
    )
  }

  if (!res.body) {
    throw new AIServiceUnavailableError("Stream boş döndü.")
  }

  // -------------------------------------------------------------------------
  // SSE parsing loop — collect bytes, split on \n\n, yield JSON payloads
  // -------------------------------------------------------------------------

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const frames = buffer.split("\n\n")
      buffer = frames.pop() ?? "" // keep last (possibly incomplete) frame

      for (const frame of frames) {
        const trimmed = frame.trim()
        if (!trimmed.startsWith("data:")) continue
        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr) continue
        try {
          yield JSON.parse(jsonStr) as WorkflowEvent
        } catch {
          // Malformed frame — skip silently rather than break the stream
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* already released */
    }
    signal.removeEventListener("abort", onCallerAbort)
  }
}
