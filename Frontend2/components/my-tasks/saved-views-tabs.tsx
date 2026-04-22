"use client"

// SavedViewsTabs — the 6-view tabbar at the top of MyTasksExperience.
//
// Mirrors the prototype MT_VIEWS list (id → label/icon) from
// `New_Frontend/src/pages/my-tasks.jsx` lines 40-47. The Tabs primitive
// already renders a badge count when `tab.badge` is provided, so the counts
// map flows straight into the tab definitions.

import * as React from "react"
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  CircleCheck,
  Flame,
  Star,
} from "lucide-react"

import { Tabs } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export type ViewId = "today" | "overdue" | "upcoming" | "starred" | "all" | "done"

interface SavedViewsTabsProps {
  value: ViewId
  onChange: (v: ViewId) => void
  counts: Record<ViewId, number>
}

export function SavedViewsTabs({
  value,
  onChange,
  counts,
}: SavedViewsTabsProps) {
  const { language: lang } = useApp()
  const tabs = [
    {
      id: "today",
      label: lang === "tr" ? "Bugün" : "Today",
      icon: <Flame size={13} />,
      badge: counts.today,
    },
    {
      id: "overdue",
      label: lang === "tr" ? "Gecikmiş" : "Overdue",
      icon: <AlertTriangle size={13} />,
      badge: counts.overdue,
    },
    {
      id: "upcoming",
      label: lang === "tr" ? "Yaklaşan" : "Upcoming",
      icon: <Calendar size={13} />,
      badge: counts.upcoming,
    },
    {
      id: "starred",
      label: lang === "tr" ? "Yıldızlı" : "Starred",
      icon: <Star size={13} />,
      badge: counts.starred,
    },
    {
      id: "all",
      label: lang === "tr" ? "Tümü" : "All",
      icon: <CheckSquare size={13} />,
      badge: counts.all,
    },
    {
      id: "done",
      label: lang === "tr" ? "Tamamlanan" : "Completed",
      icon: <CircleCheck size={13} />,
      badge: counts.done,
    },
  ]
  return (
    <Tabs
      size="sm"
      tabs={tabs}
      active={value}
      onChange={(id: string) => onChange(id as ViewId)}
    />
  )
}
