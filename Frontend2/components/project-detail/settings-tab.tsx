"use client"

// Settings tab — placeholder shape created in Task 1 so the ProjectDetailShell
// lazy-import target resolves. Task 2 replaces the body with the real 4-sub-tab
// implementation (Genel / Kolonlar / İş Akışı / Yaşam Döngüsü).

import type { Project } from "@/services/project-service"

export interface SettingsTabProps {
  project: Project
  isArchived: boolean
}

export function SettingsTab(_props: SettingsTabProps) {
  return null
}
