"use client"

// Settings tab — 4 sub-tabs per D-11:
//   - Genel       → SettingsGeneralSubtab (name/desc/dates/backlog_def/cycle_label)
//   - Kolonlar    → SettingsColumnsSubtab (column rename + WIP limit; hidden WIP for Waterfall)
//   - İş Akışı   → Link-out button to /workflow-editor (editor itself lands in Phase 12)
//   - Yaşam Döngüsü → "Faz 12'de aktive edilecek" stub
//
// The sub-tab state is local React.useState — matches the shell's outer tab
// pattern (D-09). Default is "general" (most-used field in day-to-day editing).

import * as React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { AlertBanner, Button, Card, Tabs } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

import { SettingsGeneralSubtab } from "./settings-general-subtab"
import { SettingsColumnsSubtab } from "./settings-columns-subtab"

type SubTab = "general" | "columns" | "workflow" | "lifecycle"

export interface SettingsTabProps {
  project: Project
  isArchived: boolean
}

export function SettingsTab({ project, isArchived }: SettingsTabProps) {
  const { language: lang } = useApp()
  const [sub, setSub] = React.useState<SubTab>("general")

  const subTabs = [
    { id: "general", label: lang === "tr" ? "Genel" : "General" },
    { id: "columns", label: lang === "tr" ? "Kolonlar" : "Columns" },
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
      {sub === "columns" && (
        <SettingsColumnsSubtab project={project} isArchived={isArchived} />
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
              ? "Workflow node'ları, kenar tipleri, gruplama ve metodoloji akış modu ayarları ayrı bir editörde yapılır."
              : "Workflow nodes, edge types, grouping, and methodology flow mode are managed in a dedicated editor."}
          </div>
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
              {lang === "tr" ? "Workflow Editörünü Aç" : "Open Workflow Editor"}
            </Button>
          </Link>
          <div
            style={{
              marginTop: 12,
              fontSize: 11.5,
              color: "var(--fg-subtle)",
            }}
          >
            {lang === "tr"
              ? "Workflow editörü Faz 12'de teslim edilecek."
              : "The workflow editor will be delivered in Phase 12."}
          </div>
        </Card>
      )}
      {sub === "lifecycle" && (
        <AlertBanner tone="info">
          {lang === "tr"
            ? "Bu sekme Faz 12'de aktive edilecek."
            : "This tab will be activated in Phase 12."}
        </AlertBanner>
      )}
    </div>
  )
}
