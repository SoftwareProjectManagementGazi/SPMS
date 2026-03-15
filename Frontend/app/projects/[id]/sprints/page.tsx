"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"

import { AppShell } from "@/components/app-shell"
import { SprintsList } from "@/components/project/sprints-list"
import { authService } from "@/services/auth-service"

export default function SprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
  })

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Phase Management</h1>
          <p className="text-muted-foreground">Manage project phases and track progress.</p>
        </div>
        <SprintsList projectId={id} currentUser={currentUser ?? null} />
      </div>
    </AppShell>
  )
}
