"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { projects as mockProjects } from "@/lib/mock-data"
import { useLocalStorageState } from "@/hooks/useLocalStorageState"
import type { Project } from "@/lib/types"

export default function ProjectsPage() {
  const [storedProjects] = useLocalStorageState<Project[]>("pms:projects", [])

  // localStorage projeleri üstte dursun
  const allProjects = React.useMemo(() => {
    return [...storedProjects, ...mockProjects]
  }, [storedProjects])

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Your projects (saved + mock data)
            </p>
          </div>

          <Link href="/projects/new">
            <Button>Create New Project</Button>
          </Link>
        </div>

        {allProjects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>Create a new project to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button>Create New Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allProjects.map((p: any) => (
              <Card key={p.id} className="shadow-sm">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {p.name ?? "Untitled Project"}
                      </CardTitle>
                      <CardDescription>
                        {p.key ? `Key: ${p.key}` : "No key"}
                        {p.methodology ? ` • ${String(p.methodology).toUpperCase()}` : ""}
                      </CardDescription>
                    </div>

                    {/* İstersen ileride /projects/[id] sayfasına linklersin */}
                    <span className="text-xs text-muted-foreground">
                      {p.progress != null ? `${p.progress}%` : ""}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {p.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description.</p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {p.startDate ? `Start: ${p.startDate}` : "Start: -"}
                    {" • "}
                    {p.endDate ? `End: ${p.endDate}` : "End: -"}
                  </div>

                  {/* Frontend-only config gösterimi (istersen kaldır) */}
                  {Array.isArray(p.workflowColumns) && p.workflowColumns.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.workflowColumns.slice(0, 8).map((c: string, idx: number) => (
                        <span
                          key={`${c}-${idx}`}
                          className="text-[11px] rounded-full border px-2 py-0.5 bg-secondary"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
