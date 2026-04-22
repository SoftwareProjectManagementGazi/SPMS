"use client"

// Header "Oluştur" / "Create" button.
//
// Phase 11 D-07 REVISES Phase 10 D-09: clicking the header primary-action
// button now OPENS the Task Create Modal via useTaskModal(), rather than
// navigating to /projects/new. Project creation moved to the /projects list
// page with a permission gate (D-08).
//
// Why: task creation happens far more frequently than project creation in
// day-to-day flow; the header Oluştur button should surface that.

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTaskModal } from "@/context/task-modal-context"

export function CreateButton() {
  const { language: lang } = useApp()
  const { openTaskModal } = useTaskModal()
  return (
    <Button
      variant="primary"
      size="sm"
      icon={<Plus size={14} />}
      onClick={() => openTaskModal()}
    >
      {lang === "tr" ? "Oluştur" : "Create"}
    </Button>
  )
}
