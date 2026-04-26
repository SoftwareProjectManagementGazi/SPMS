"use client"

// Phase 13 Plan 13-05 Task 1 — ProfileProjectsTab STUB.
//
// Plan 13-06 owns the full implementation (3-col ProjectCard grid sourced
// from /users/{id}/summary projects[]). Plan 13-05 ships this stub so the
// route page can mount the Projects tab without an undefined import; the
// stub body is intentionally minimal — Plan 13-06 will REPLACE it.
//
// Marker: the literal `// STUB` token below tells Plan 13-06's executor
// (and the plan checker) that this body is intentional placeholder. The
// stub renders the DataState empty fallback so users hitting ?tab=projects
// before 13-06 lands see a benign "Yükleniyor…" instead of a blank screen.

import * as React from "react"
import { DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export interface ProfileProjectsTabProps {
  userId: number
}

// STUB — full implementation in Plan 13-06.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileProjectsTab({ userId: _userId }: ProfileProjectsTabProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  return (
    <DataState
      empty={true}
      emptyFallback={
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          {T("Yükleniyor…", "Loading…")}
        </div>
      }
    >
      {null}
    </DataState>
  )
}
