// Editor undo/redo history hook (Phase 12 Plan 12-01) — local in-memory
// stack that the Workflow Editor uses to support Cmd/Ctrl+Z and Cmd/Ctrl+
// Shift+Z (CONTEXT D-27).
//
// Stack is cleared on Save. State lives in the component that mounts the
// hook; nothing is persisted across page reloads.

import * as React from "react"
import type { WorkflowConfig } from "@/services/lifecycle-service"

export interface EditorHistory {
  past: WorkflowConfig[]
  future: WorkflowConfig[]
  canUndo: boolean
  canRedo: boolean
  push: (snapshot: WorkflowConfig) => void
  undo: (current: WorkflowConfig) => WorkflowConfig | null
  redo: (current: WorkflowConfig) => WorkflowConfig | null
  clear: () => void
}

interface HistoryState {
  past: WorkflowConfig[]
  future: WorkflowConfig[]
}

export function useEditorHistory(): EditorHistory {
  // Single state object so push/undo/redo each map to ONE setter call. Keeps
  // the per-call lambdas pure (no closure side-effects) so they tolerate
  // React StrictMode double-invoke without producing inconsistent reads.
  // The mirroring ref is the source of truth for the synchronous return
  // values of undo()/redo() — React state updates are not synchronous.
  const stateRef = React.useRef<HistoryState>({ past: [], future: [] })
  const [, setVersion] = React.useState(0)

  const commit = React.useCallback((next: HistoryState) => {
    stateRef.current = next
    setVersion((v) => v + 1)
  }, [])

  const push = React.useCallback(
    (snapshot: WorkflowConfig) => {
      commit({
        past: [...stateRef.current.past, snapshot],
        future: [],
      })
    },
    [commit],
  )

  const undo = React.useCallback(
    (current: WorkflowConfig): WorkflowConfig | null => {
      const { past, future } = stateRef.current
      if (past.length === 0) return null
      const popped = past[past.length - 1]
      commit({
        past: past.slice(0, -1),
        future: [current, ...future],
      })
      return popped
    },
    [commit],
  )

  const redo = React.useCallback(
    (current: WorkflowConfig): WorkflowConfig | null => {
      const { past, future } = stateRef.current
      if (future.length === 0) return null
      const next = future[0]
      commit({
        past: [...past, current],
        future: future.slice(1),
      })
      return next
    },
    [commit],
  )

  const clear = React.useCallback(() => {
    commit({ past: [], future: [] })
  }, [commit])

  const { past, future } = stateRef.current
  return {
    past,
    future,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    push,
    undo,
    redo,
    clear,
  }
}
