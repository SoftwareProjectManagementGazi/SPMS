"use client"
import * as React from "react"
import { TaskModalProvider as ContextProvider } from "@/context/task-modal-context"
import { TaskCreateModal } from "./task-create-modal"

/**
 * Composes the TaskModalContext with the TaskCreateModal DOM.
 *
 * Plan 11-01 shipped the context-only shell; Plan 11-02 extends it to render
 * `<TaskCreateModal />` as a sibling of {children}. The modal renders as a
 * single overlay tree — consumers anywhere under this provider can call
 * `useTaskModal().openTaskModal()` to mount it.
 *
 * The modal itself is gated on `isOpen` internally, so mounting here is cheap.
 */
export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ContextProvider>
      {children}
      <TaskCreateModal />
    </ContextProvider>
  )
}
