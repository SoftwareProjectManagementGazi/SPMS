/**
 * useAIWorkflowStream — finite-state hook driving the AI generation flow.
 *
 * Consumes the SSE stream, accumulates partial output (nodes/edges/columns,
 * chat log, rationale) into a single state machine, and exposes `generate()`
 * and `cancel()` actions. UI components subscribe via `state.status` switch.
 *
 * Plan reference: .planning/ai-workflow-generator-plan.md §5.4
 */

"use client"

import { useCallback, useRef, useState } from "react"

import {
  AIServiceUnavailableError,
  type DonePayload,
  type ErrorKind,
  type LifecycleFormDTO,
  type Methodology,
  RateLimitError,
  type SuggestedColumnPayload,
  type SuggestedEdgePayload,
  type SuggestedNodePayload,
  type TaskStatusFormDTO,
  type WorkflowEvent,
} from "@/lib/ai/types"
import { streamAIWorkflow } from "@/lib/ai/sse-client"

// ---------------------------------------------------------------------------
// State machine — discriminated union (status-based narrowing)
// ---------------------------------------------------------------------------

export type AIStreamState =
  | { status: "idle" }
  | {
      status: "generating"
      variant: "lifecycle" | "task_status"
      chatLog: string[]
      currentText: string // accumulating text_token chunks
      nodes: SuggestedNodePayload[]
      edges: SuggestedEdgePayload[]
      columns: SuggestedColumnPayload[]
    }
  | {
      status: "done"
      variant: "lifecycle" | "task_status"
      methodology: Methodology
      chatLog: string[]
      nodes: SuggestedNodePayload[]
      edges: SuggestedEdgePayload[]
      columns: SuggestedColumnPayload[]
      rationale: string
      summary: DonePayload
    }
  | {
      status: "error"
      kind: ErrorKind | "rate_limit"
      resetInSeconds?: number
      message?: string
    }

const INITIAL_STATE: AIStreamState = { status: "idle" }

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAIWorkflowStreamReturn {
  state: AIStreamState
  generateLifecycle: (form: LifecycleFormDTO) => Promise<void>
  generateTaskStatus: (form: TaskStatusFormDTO) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useAIWorkflowStream(): UseAIWorkflowStreamReturn {
  const [state, setState] = useState<AIStreamState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const reset = useCallback(() => {
    cancel()
    setState(INITIAL_STATE)
  }, [cancel])

  /** Shared streaming loop — variant determines column vs node/edge handling. */
  const runStream = useCallback(
    async (
      variant: "lifecycle" | "task_status",
      eventStream: AsyncIterableIterator<WorkflowEvent>,
    ) => {
      // Mutable accumulators — single setState at end of each event keeps re-renders
      // proportional to event count (not array length).
      const chatLog: string[] = []
      let currentText = ""
      const nodes: SuggestedNodePayload[] = []
      const edges: SuggestedEdgePayload[] = []
      const columns: SuggestedColumnPayload[] = []

      setState({
        status: "generating",
        variant,
        chatLog: [],
        currentText: "",
        nodes: [],
        edges: [],
        columns: [],
      })

      try {
        for await (const event of eventStream) {
          switch (event.type) {
            case "text_token": {
              const text = (event.payload as { text: string }).text ?? ""
              currentText += text
              setState({
                status: "generating",
                variant,
                chatLog: [...chatLog],
                currentText,
                nodes: [...nodes],
                edges: [...edges],
                columns: [...columns],
              })
              break
            }

            case "node_added": {
              const nodePayload = event.payload as unknown
              const node = nodePayload as SuggestedNodePayload
              nodes.push(node)
              chatLog.push(`"${node.label}" eklendi`)
              setState({
                status: "generating",
                variant,
                chatLog: [...chatLog],
                currentText,
                nodes: [...nodes],
                edges: [...edges],
                columns: [...columns],
              })
              break
            }

            case "edge_added": {
              const edgePayload = event.payload as unknown
              edges.push(edgePayload as SuggestedEdgePayload)
              setState({
                status: "generating",
                variant,
                chatLog: [...chatLog],
                currentText,
                nodes: [...nodes],
                edges: [...edges],
                columns: [...columns],
              })
              break
            }

            case "column_added": {
              const colPayload = event.payload as unknown
              const col = colPayload as SuggestedColumnPayload
              columns.push(col)
              chatLog.push(`"${col.label}" eklendi`)
              setState({
                status: "generating",
                variant,
                chatLog: [...chatLog],
                currentText,
                nodes: [...nodes],
                edges: [...edges],
                columns: [...columns],
              })
              break
            }

            case "rationale": {
              const rationale =
                (event.payload as { text: string }).text ?? ""
              // Store rationale on the running state for later commit in "done"
              currentText = rationale // reuse field as transient slot
              break
            }

            case "done": {
              const doneRaw = event.payload as unknown
              const donePayload = doneRaw as DonePayload
              setState({
                status: "done",
                variant,
                methodology: donePayload.methodology,
                chatLog,
                nodes,
                edges,
                columns,
                rationale: currentText, // last rationale captured
                summary: donePayload,
              })
              return // exit loop cleanly
            }

            case "error": {
              const ep = event.payload as {
                kind: ErrorKind
                reset_in_seconds?: number
                message?: string
              }
              setState({
                status: "error",
                kind: ep.kind,
                resetInSeconds: ep.reset_in_seconds,
                message: ep.message,
              })
              return
            }

            default:
              // Unknown event type — ignore (forward-compatible)
              break
          }
        }

        // Stream ended without explicit "done" — treat as service issue
        setState({
          status: "error",
          kind: "service_down",
          message: "AI yanıtı yarım kaldı.",
        })
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setState(INITIAL_STATE)
          return
        }
        if (e instanceof RateLimitError) {
          setState({
            status: "error",
            kind: "rate_limit",
            resetInSeconds: e.resetInSeconds,
          })
          return
        }
        if (e instanceof AIServiceUnavailableError) {
          setState({
            status: "error",
            kind: "service_down",
            message: e.message,
          })
          return
        }
        setState({
          status: "error",
          kind: "service_down",
          message: (e as Error).message,
        })
      } finally {
        abortRef.current = null
      }
    },
    [],
  )

  const generateLifecycle = useCallback(
    async (form: LifecycleFormDTO) => {
      cancel()
      const controller = new AbortController()
      abortRef.current = controller
      const stream = streamAIWorkflow("lifecycle", form, controller.signal)
      await runStream("lifecycle", stream)
    },
    [cancel, runStream],
  )

  const generateTaskStatus = useCallback(
    async (form: TaskStatusFormDTO) => {
      cancel()
      const controller = new AbortController()
      abortRef.current = controller
      const stream = streamAIWorkflow("task-status", form, controller.signal)
      await runStream("task_status", stream)
    },
    [cancel, runStream],
  )

  return { state, generateLifecycle, generateTaskStatus, cancel, reset }
}
