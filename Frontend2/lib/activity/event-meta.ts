// Phase 13 Plan 13-04 Task 1 — eventMeta map for the 10 SemanticEventType values.
//
// Single source of truth for icon + color + locale-aware verb per event type.
// Consumed by ActivityRow (and any future activity surface) via:
//
//     const meta = eventMeta[mapAuditToSemantic(item)!]
//     <meta.Icon size={9}/>  / meta.color  / meta.verb(language)
//
// Why a verb function (not a string): activity surfaces are i18n-bilingual
// (TR / EN). The verb varies per language; passing `language` at render time
// keeps the table small and the lookup synchronous.
//
// Why icons live here (not at the row): the row stays declarative; adding a
// new event type means one entry in this file. Matches CLAUDE.md OCP — extend
// by adding a row, never modify the consumer.

import {
  Plus,
  ArrowRight,
  UserPlus,
  MessageSquare,
  Trash2,
  GitBranch,
  Flag,
  Pencil,
  FileBarChart,
  FileText,
  type LucideIcon,
} from "lucide-react"

import type { SemanticEventType } from "@/lib/audit-event-mapper"

export interface EventMeta {
  /** lucide-react icon component rendered inside the event-badge bubble. */
  Icon: LucideIcon
  /** CSS var(--*) string for the badge background. */
  color: string
  /** Locale-aware verb. Caller passes language, function returns the right string. */
  verb: (lang: "tr" | "en") => string
}

export const eventMeta: Record<SemanticEventType, EventMeta> = {
  task_created: {
    Icon: Plus,
    color: "var(--status-done)",
    verb: (l) => (l === "tr" ? "oluşturdu" : "created"),
  },
  task_status_changed: {
    Icon: ArrowRight,
    color: "var(--status-progress)",
    verb: (l) => (l === "tr" ? "durumunu değiştirdi" : "changed status"),
  },
  task_assigned: {
    Icon: UserPlus,
    color: "var(--primary)",
    verb: (l) => (l === "tr" ? "atadı" : "assigned"),
  },
  comment_created: {
    Icon: MessageSquare,
    color: "var(--status-review)",
    verb: (l) => (l === "tr" ? "yorum yaptı" : "commented"),
  },
  task_deleted: {
    Icon: Trash2,
    color: "var(--priority-critical)",
    verb: (l) => (l === "tr" ? "sildi" : "deleted"),
  },
  phase_transition: {
    Icon: GitBranch,
    color: "var(--status-done)",
    verb: (l) => (l === "tr" ? "faz geçişi yaptı" : "changed phase"),
  },
  milestone_created: {
    Icon: Flag,
    color: "var(--primary)",
    verb: (l) => (l === "tr" ? "kilometre taşı oluşturdu" : "created milestone"),
  },
  milestone_updated: {
    Icon: Pencil,
    color: "var(--status-progress)",
    verb: (l) => (l === "tr" ? "kilometre taşı güncelledi" : "updated milestone"),
  },
  artifact_status_changed: {
    Icon: FileText,
    color: "var(--status-review)",
    verb: (l) =>
      l === "tr" ? "artefakt durumu değiştirdi" : "changed artifact status",
  },
  phase_report_created: {
    Icon: FileBarChart,
    color: "var(--status-done)",
    verb: (l) =>
      l === "tr"
        ? "değerlendirme raporu oluşturdu"
        : "created evaluation report",
  },
}
