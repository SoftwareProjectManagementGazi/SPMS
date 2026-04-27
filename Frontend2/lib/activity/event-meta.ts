// Phase 13 Plan 13-04 Task 1 — eventMeta map for the original 10 types.
// Phase 14 Plan 14-10 Task 1 — extended with 13 NEW entries per D-D3 + D-D4.
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
  Edit3,
  Archive,
  RefreshCw,
  UserX,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Check,
  X,
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
  // -------------------------------------------------------------------------
  // Original 10 (Phase 13 D-B1).
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Phase 14 (D-D3 + D-D4) — 13 new entries.
  //
  // Each entry follows the same Icon + color + verb shape. Icon choice
  // mirrors UI-SPEC §Color line 195 conventions:
  //  - status-progress for non-destructive updates
  //  - status-done for additive lifecycle events
  //  - priority-critical for destructive events (delete / deactivate / reject)
  //  - fg-muted for archive (neutral terminal state)
  // -------------------------------------------------------------------------

  task_field_updated: {
    Icon: Edit3,
    color: "var(--status-progress)",
    verb: (l) => (l === "tr" ? "değiştirdi" : "updated"),
  },
  project_archived: {
    Icon: Archive,
    color: "var(--fg-muted)",
    verb: (l) => (l === "tr" ? "arşivledi" : "archived"),
  },
  project_status_changed: {
    Icon: RefreshCw,
    color: "var(--status-progress)",
    verb: (l) =>
      l === "tr" ? "proje durumunu değiştirdi" : "changed project status",
  },
  comment_edited: {
    Icon: MessageSquare,
    color: "var(--status-progress)",
    verb: (l) => (l === "tr" ? "düzenledi yorumunu" : "edited comment on"),
  },
  comment_deleted: {
    Icon: Trash2,
    color: "var(--priority-critical)",
    verb: (l) => (l === "tr" ? "sildi yorumunu" : "deleted comment on"),
  },
  user_invited: {
    Icon: UserPlus,
    color: "var(--status-done)",
    verb: (l) => (l === "tr" ? "davet etti" : "invited"),
  },
  user_deactivated: {
    Icon: UserX,
    color: "var(--priority-critical)",
    verb: (l) => (l === "tr" ? "devre dışı bıraktı" : "deactivated"),
  },
  user_activated: {
    Icon: UserCheck,
    color: "var(--status-done)",
    verb: (l) => (l === "tr" ? "etkinleştirdi" : "activated"),
  },
  user_role_changed: {
    Icon: ShieldCheck,
    color: "var(--status-progress)",
    verb: (l) =>
      l === "tr" ? "rolünü değiştirdi" : "changed role of",
  },
  user_password_reset_requested: {
    Icon: KeyRound,
    color: "var(--status-progress)",
    verb: (l) =>
      l === "tr"
        ? "şifre sıfırlama gönderdi"
        : "sent password reset to",
  },
  project_join_request_created: {
    Icon: UserPlus,
    color: "var(--status-progress)",
    verb: (l) => (l === "tr" ? "talep etti" : "requested"),
  },
  project_join_request_approved: {
    Icon: Check,
    color: "var(--status-done)",
    verb: (l) =>
      l === "tr"
        ? "katılım talebini onayladı"
        : "approved join request for",
  },
  project_join_request_rejected: {
    Icon: X,
    color: "var(--priority-critical)",
    verb: (l) =>
      l === "tr"
        ? "katılım talebini reddetti"
        : "rejected join request for",
  },
}
