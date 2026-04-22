"use client"
import * as React from "react"
import { TaskModalProvider as ContextProvider } from "@/context/task-modal-context"

/**
 * Wrapper that composes the TaskModalContext with the modal DOM.
 * In Plan 11-01 this simply re-exports the context provider.
 * Plan 11-02 will extend this to render <TaskCreateModal /> as a sibling of
 * {children} once the modal component exists.
 */
export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  return <ContextProvider>{children}</ContextProvider>
}
