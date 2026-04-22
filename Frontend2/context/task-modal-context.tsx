"use client"
import * as React from "react"

export interface TaskModalDefaults {
  defaultProjectId?: number
  defaultType?: "task" | "subtask" | "bug"
  defaultParentId?: number
}

interface TaskModalContextType {
  isOpen: boolean
  defaults: TaskModalDefaults | null
  openTaskModal: (defaults?: TaskModalDefaults) => void
  closeTaskModal: () => void
}

const TaskModalContext = React.createContext<TaskModalContextType | undefined>(undefined)

export function useTaskModal(): TaskModalContextType {
  const ctx = React.useContext(TaskModalContext)
  if (!ctx) throw new Error("useTaskModal must be used within TaskModalProvider")
  return ctx
}

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [defaults, setDefaults] = React.useState<TaskModalDefaults | null>(null)

  const openTaskModal = React.useCallback((d?: TaskModalDefaults) => {
    setDefaults(d ?? null)
    setIsOpen(true)
  }, [])

  const closeTaskModal = React.useCallback(() => {
    setIsOpen(false)
    // D-02: no draft persistence — clear defaults on close
    setDefaults(null)
  }, [])

  const value = React.useMemo(
    () => ({ isOpen, defaults, openTaskModal, closeTaskModal }),
    [isOpen, defaults, openTaskModal, closeTaskModal]
  )

  return (
    <TaskModalContext.Provider value={value}>
      {children}
    </TaskModalContext.Provider>
  )
}
