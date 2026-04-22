"use client"

// ProjectDetailShell — the 8-tab container that mounts inside
// /projects/[id]/page.tsx per PAGE-03 + D-09. Tab state lives in local
// React.useState (not URL param) matching the prototype + D-09 decision.
//
// Phase 11 scope (D-10, D-11):
//   - board/list/timeline/calendar  — placeholder tabs (real content in plans 05/06/07)
//   - activity                      — Faz 13 stub (ActivityStubTab)
//   - lifecycle                     — Faz 12 stub (LifecycleStubTab)
//   - members                       — Manager card + helper text (this plan)
//   - settings                      — 4 sub-tabs (this plan, Task 2)
//
// The shell also mounts <ProjectDetailProvider> so descendants (Board toolbar
// in 11-05, List filter in 11-07) can read searchQuery / density / phaseFilter
// from a single source (RESEARCH §640-670).

import * as React from "react"
import {
  Activity,
  Calendar,
  GitBranch,
  Grid3x3,
  LineChart,
  List,
  Settings,
  Users,
} from "lucide-react"

import { Tabs } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

import { ActivityStubTab } from "./activity-stub-tab"
import { BoardTab } from "./board-tab"
import { LifecycleStubTab } from "./lifecycle-stub-tab"
import { MembersTab } from "./members-tab"
import { ProjectDetailProvider } from "./project-detail-context"

// Settings tab is lazy-loaded to keep the shell bundle lean — the 4 sub-tabs
// import TanStack Query + methodology-matrix + confirm-dialog etc. which users
// who never open Settings should not pay for.
const SettingsTabLazy = React.lazy(async () => ({
  default: (await import("./settings-tab")).SettingsTab,
}))

type TabId =
  | "board"
  | "list"
  | "timeline"
  | "calendar"
  | "activity"
  | "lifecycle"
  | "members"
  | "settings"

interface ProjectDetailShellProps {
  project: Project
  isArchived: boolean
}

export function ProjectDetailShell({ project, isArchived }: ProjectDetailShellProps) {
  const { language: lang } = useApp()
  const [tab, setTab] = React.useState<TabId>("board")

  const tabs = [
    { id: "board", label: lang === "tr" ? "Pano" : "Board", icon: <Grid3x3 size={13} /> },
    { id: "list", label: lang === "tr" ? "Liste" : "List", icon: <List size={13} /> },
    { id: "timeline", label: lang === "tr" ? "Zaman Çizelgesi" : "Timeline", icon: <LineChart size={13} /> },
    { id: "calendar", label: lang === "tr" ? "Takvim" : "Calendar", icon: <Calendar size={13} /> },
    { id: "activity", label: lang === "tr" ? "Aktivite" : "Activity", icon: <Activity size={13} /> },
    { id: "lifecycle", label: lang === "tr" ? "Yaşam Döngüsü" : "Lifecycle", icon: <GitBranch size={13} /> },
    { id: "members", label: lang === "tr" ? "Üyeler" : "Members", icon: <Users size={13} /> },
    { id: "settings", label: lang === "tr" ? "Ayarlar" : "Settings", icon: <Settings size={13} /> },
  ]

  return (
    <ProjectDetailProvider projectId={project.id}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: 0,
          flex: 1,
        }}
      >
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={(id: string) => setTab(id as TabId)}
          size="md"
        />

        <div style={{ flex: 1, minHeight: 0 }}>
          {tab === "board" && <BoardTab project={project} />}
          {tab === "list" && (
            <TabPlaceholder
              label={
                lang === "tr" ? "Liste sekmesi — Plan 11-07" : "List — Plan 11-07"
              }
            />
          )}
          {tab === "timeline" && (
            <TabPlaceholder
              label={
                lang === "tr"
                  ? "Zaman Çizelgesi — Plan 11-07"
                  : "Timeline — Plan 11-07"
              }
            />
          )}
          {tab === "calendar" && (
            <TabPlaceholder
              label={lang === "tr" ? "Takvim — Plan 11-07" : "Calendar — Plan 11-07"}
            />
          )}
          {tab === "activity" && <ActivityStubTab />}
          {tab === "lifecycle" && <LifecycleStubTab />}
          {tab === "members" && <MembersTab project={project} />}
          {tab === "settings" && (
            <React.Suspense
              fallback={
                <div
                  style={{
                    padding: 20,
                    color: "var(--fg-muted)",
                    fontSize: 12,
                  }}
                >
                  {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                </div>
              }
            >
              <SettingsTabLazy project={project} isArchived={isArchived} />
            </React.Suspense>
          )}
        </div>
      </div>
    </ProjectDetailProvider>
  )
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "var(--fg-subtle)",
        fontSize: 12.5,
        border: "1px dashed var(--border)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {label}
    </div>
  )
}
