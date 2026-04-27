"use client"

// /workflow-editor route (Phase 12 Plan 12-07).
//
// Reads ?projectId=X from useSearchParams. Missing or invalid (NaN) projectId
// triggers router.replace('/projects'). Viewport gate: <1024 px renders the
// ViewportFallback page; >=1024 px mounts the EditorPage which dynamic-
// imports the React Flow canvas with ssr:false (CONTEXT D-07).
//
// The route is a Client Component because:
//   1. useSearchParams + useRouter are client-only hooks
//   2. window.innerWidth viewport check requires the browser
//   3. EditorPage dynamic-imports a Client Component with ssr:false and
//      that option is forbidden inside Server Components per Next.js 16
//      lazy-loading docs (read at node_modules/next/dist/docs/01-app/02-
//      guides/lazy-loading.md before this commit per Frontend2/AGENTS.md
//      mandate).

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProject } from "@/hooks/use-projects"
import { ViewportFallback } from "@/components/lifecycle/viewport-fallback"
import { EditorPage } from "@/components/workflow-editor/editor-page"

const VIEWPORT_MIN = 1024

export default function WorkflowEditorRoute() {
  return (
    <React.Suspense fallback={null}>
      <WorkflowEditorRouteInner />
    </React.Suspense>
  )
}

function WorkflowEditorRouteInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const projectIdRaw = searchParams.get("projectId")
  const projectId = projectIdRaw ? Number(projectIdRaw) : Number.NaN

  // viewportOK starts as null so we render nothing on first paint and avoid
  // hydration mismatch (server has no `window`).
  const [viewportOK, setViewportOK] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (!projectIdRaw || Number.isNaN(projectId)) {
      router.replace("/projects")
      return
    }
    const check = () => setViewportOK(window.innerWidth >= VIEWPORT_MIN)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [projectIdRaw, projectId, router])

  // useProject hook is enabled only when projectId is a valid number — the
  // hook's internal `enabled: !!id` short-circuits the API call when id is
  // NaN (Number(NaN) is falsy).
  const { data: project, isLoading } = useProject(
    Number.isNaN(projectId) ? 0 : projectId,
  )

  // Redirect in flight — render nothing.
  if (Number.isNaN(projectId)) return null

  // Initial paint guard — viewport check has not yet run.
  if (viewportOK === null) return null

  // Viewport too small — render the desktop-only fallback (UI-SPEC §736).
  if (!viewportOK) return <ViewportFallback projectId={projectId} />

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--fg-muted)" }}>
        {T("Yükleniyor…", "Loading…")}
      </div>
    )
  }

  if (!project) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {T("Proje bulunamadı.", "Project not found.")}
        </div>
      </Card>
    )
  }

  return <EditorPage project={project} />
}
