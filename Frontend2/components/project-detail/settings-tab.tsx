"use client"

// Settings tab — 3 sub-tabs (D-11 reduced from 4 on 2026-05-18):
//   - Genel       → SettingsGeneralSubtab (name/desc/dates/backlog_def/cycle_label;
//                   methodology field read-only per CONTEXT D-60 from Phase 12)
//   - İş Akışı    → Link-out button to /workflow-editor. Status mode now manages
//                   ALL column CRUD (rename, WIP limit, category, is_initial,
//                   is_terminal, max_duration_days, entry/exit policy) — the
//                   former "Kolonlar" sub-tab was removed because it duplicated
//                   the workflow editor's status mode and split the source of
//                   truth across two surfaces.
//   - Yaşam Döngüsü → CriteriaEditorPanel (LIFE-01 — Phase 12 Plan 12-03 replaces
//                     the Phase 11 D-11 AlertBanner stub)
//
// The sub-tab state is local React.useState. Default is "general".

import * as React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { Button, Card, Tabs } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

import { SettingsGeneralSubtab } from "./settings-general-subtab"
import { CriteriaEditorPanel } from "@/components/lifecycle/criteria-editor-panel"

type SubTab = "general" | "workflow" | "lifecycle"

export interface SettingsTabProps {
  project: Project
  isArchived: boolean
}

export function SettingsTab({ project, isArchived }: SettingsTabProps) {
  const { language: lang } = useApp()
  const [sub, setSub] = React.useState<SubTab>("general")

  const subTabs = [
    { id: "general", label: lang === "tr" ? "Genel" : "General" },
    { id: "workflow", label: lang === "tr" ? "İş Akışı" : "Workflow" },
    { id: "lifecycle", label: lang === "tr" ? "Yaşam Döngüsü" : "Lifecycle" },
  ]

  return (
    <div
      style={{
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Tabs
        tabs={subTabs}
        active={sub}
        onChange={(id: string) => setSub(id as SubTab)}
        size="sm"
      />

      {sub === "general" && (
        <SettingsGeneralSubtab project={project} isArchived={isArchived} />
      )}
      {sub === "workflow" && (
        <Card padding={20}>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginBottom: 12,
              lineHeight: 1.55,
            }}
          >
            {lang === "tr"
              ? "Workflow node'ları, kenarlar, gruplama, metodoloji akış modu ve kolon yönetimi (yeniden adlandırma, WIP limit, kategori, başlangıç/terminal, maks. süre, giriş/çıkış politikası) tek bir editörde yapılır."
              : "Workflow nodes, edges, grouping, flow mode, and column management (rename, WIP limit, category, initial/terminal flags, max duration, entry/exit policy) are all handled in a single editor."}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={`/workflow-editor?projectId=${project.id}`}
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="primary"
                size="sm"
                icon={<ExternalLink size={14} />}
              >
                {lang === "tr"
                  ? "Yaşam Döngüsü Editörü"
                  : "Lifecycle Editor"}
              </Button>
            </Link>
            <Link
              href={`/workflow-editor?projectId=${project.id}&mode=status`}
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={14} />}
              >
                {lang === "tr"
                  ? "Görev Durumları (Kolonlar)"
                  : "Task Statuses (Columns)"}
              </Button>
            </Link>
          </div>
        </Card>
      )}
      {sub === "lifecycle" && (
        <CriteriaEditorPanel project={project} isArchived={isArchived} />
      )}
    </div>
  )
}
