"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useProjects } from "@/hooks/use-projects"
import { Loader2, AlertCircle } from "lucide-react"

export default function ProjectsPage() {
  // Mock data ve localStorage yerine artık tek satırda backend'e bağlıyız
  const { data: projects, isLoading, isError, error } = useProjects()

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (isError) {
    return (
      <AppShell>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
              Projeler yüklenemedi. Lütfen daha sonra tekrar deneyin.
              <br />
              <span className="text-xs opacity-70">{(error as Error).message}</span>
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projeler</h1>
            <p className="text-muted-foreground">
              Projelerinizi yönetin, ilerlemeyi takip edin ve ekibinizle iş birliği yapın.
            </p>
          </div>

          <Link href="/projects/new">
            <Button>Yeni Proje Oluştur</Button>
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Projeler bulunamadı</CardTitle>
              <CardDescription>Veritabanında henüz proje yok.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button>Yeni Proje Oluştur</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                <Card className="shadow-sm group-hover:shadow-md transition-shadow h-full cursor-pointer border-l-4 border-l-primary/0 group-hover:border-l-primary/100">
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {p.name}
                        </CardTitle>
                        <CardDescription>
                          {p.key ? `Key: ${p.key}` : "No key"}
                          {p.methodology ? ` • ${String(p.methodology).toUpperCase()}` : ""}
                        </CardDescription>
                      </div>
                      
                      {/* Status badge - logic can be improved based on dates or future backend status field */}
                      <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full">
                         {p.methodology}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {p.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {p.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description provided.</p>
                    )}

                    <div className="text-xs text-muted-foreground flex gap-3 pt-2 border-t mt-2">
                      <span>Başlangıç: {p.startDate ? new Date(p.startDate).toLocaleDateString() : "-"}</span>
                      <span>Bitiş: {p.endDate ? new Date(p.endDate).toLocaleDateString() : "-"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
