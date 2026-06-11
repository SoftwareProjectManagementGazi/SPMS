"use client"

// /workflow-editor route — serves two surfaces:
//   - ?projectId=X  → EditorPage (project lifecycle/status canvas)
//   - ?templateId=X → TemplateEditorPage (ProcessTemplate lifecycle canvas)
//   - neither       → redirect /projects
// Both sit behind the <1024px ViewportFallback gate. Client Component:
// useSearchParams/useRouter/window are browser-only, and the canvas is
// dynamic-imported with ssr:false.

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProject } from "@/hooks/use-projects"
import { ViewportFallback } from "@/components/lifecycle/viewport-fallback"
import { EditorPage } from "@/components/workflow-editor/editor-page"
import { TemplateEditorPage } from "@/components/workflow-editor/template-editor-page"

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

  // Plan 14-18 — dispatch dimension. Templates first (admin path) so the
  // legacy projectId branch falls through unchanged when only templateId
  // is present.
  const templateIdRaw = searchParams.get("templateId")
  const templateId = templateIdRaw ? Number(templateIdRaw) : Number.NaN
  const isTemplateRoute =
    templateIdRaw !== null && !Number.isNaN(templateId)

  const projectIdRaw = searchParams.get("projectId")
  const projectId = projectIdRaw ? Number(projectIdRaw) : Number.NaN

  // viewportOK starts as null so we render nothing on first paint and avoid
  // hydration mismatch (server has no `window`).
  const [viewportOK, setViewportOK] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    // Plan 14-18 — dispatch redirect on neither-param. When templateId is
    // present we skip the redirect entirely; when projectId is missing AND
    // templateId is missing we land back at /projects.
    if (!isTemplateRoute && (!projectIdRaw || Number.isNaN(projectId))) {
      router.replace("/projects")
      return
    }
    const check = () => setViewportOK(window.innerWidth >= VIEWPORT_MIN)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [projectIdRaw, projectId, isTemplateRoute, router])

  // useProject hook is enabled only when projectId is a valid number — the
  // hook's internal `enabled: !!id` short-circuits the API call when id is
  // NaN (Number(NaN) is falsy).
  // Plan 14-18 — when we are in the template branch we pass 0 so the hook
  // is disabled (no spurious project fetch).
  const { data: project, isLoading } = useProject(
    isTemplateRoute || Number.isNaN(projectId) ? 0 : projectId,
  )

  // Plan 14-18 template branch — dispatch BEFORE the project-machinery so
  // a missing/invalid projectId doesn't trigger the legacy "Proje bulunamadı"
  // fallback when the user actually came in with ?templateId=.
  if (isTemplateRoute) {
    // Initial paint guard — viewport check has not yet run.
    if (viewportOK === null) return null
    if (!viewportOK) {
      // Reuse ViewportFallback with templateId-flavoured copy is a v2.1 nit;
      // for now we send the desktop-only message generically (the fallback
      // page just instructs the user to visit on a wider viewport).
      return <ViewportFallback projectId={templateId} />
    }
    // key: a templateId switch remounts so editor state can't bleed across.
    return <TemplateEditorPage key={templateId} templateId={templateId} />
  }

  // Legacy project branch — Redirect in flight: render nothing.
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
