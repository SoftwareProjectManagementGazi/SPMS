// Phase 14 Plan 14-01 — Admin permission matrix (DISPLAY-ONLY placeholder).
//
// 14 permissions × 4 roles tri-state map per UI-SPEC § Surface E.
// D-A2 — RBAC infrastructure DEFERRED to v3.0. This module is a static
// placeholder that drives the read-only Permission Matrix grid in
// /admin/permissions. Toggles in the UI are `disabled` + `aria-disabled`
// (Plan 14-04). NO backend permission DSL is wired.
//
// Helper: getPermission(permKey, role) returns the tri-state for a single cell.

export type TriState = "granted" | "denied" | "n/a"
export type AdminRole = "Admin" | "Project Manager" | "Member" | "Guest"

export type PermissionKey =
  | "create_project"
  | "edit_project"
  | "delete_project"
  | "archive_project"
  | "create_task"
  | "change_assignee"
  | "change_status"
  | "delete_task"
  | "invite_user"
  | "assign_role"
  | "remove_member"
  | "edit_workflow"
  | "edit_lifecycle"
  | "publish_template"

export interface PermissionRow {
  key: PermissionKey
  label_tr: string
  label_en: string
  cells: Record<AdminRole, TriState>
}

// Tri-state matrix: 14 permission rows × 4 role columns.
// Source: UI-SPEC § Surface E permission rows + CONTEXT D-A5 role semantics.
//
// Admin = global system role → granted on every cell (sole authority for
// system-wide actions: invite, role flip, project delete).
// Project Manager = project-scoped → granted on most project + task perms;
// denied on system-wide delete project (admin-only per D-A5).
// Member = project-scoped → granted only on task creation, assignee change
// on own tasks, status change. NO admin operations (invite/role/workflow).
// Guest = placeholder for v3.0 → "denied" everywhere (read-only future role).
export const PERMISSIONS: PermissionRow[] = [
  // --- Project lifecycle ---
  {
    key: "create_project",
    label_tr: "Proje oluştur",
    label_en: "Create project",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "edit_project",
    label_tr: "Proje düzenle",
    label_en: "Edit project",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "delete_project",
    label_tr: "Proje sil",
    label_en: "Delete project",
    cells: { Admin: "granted", "Project Manager": "denied", Member: "denied", Guest: "denied" },
  },
  {
    key: "archive_project",
    label_tr: "Proje arşivle",
    label_en: "Archive project",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  // --- Task lifecycle ---
  {
    key: "create_task",
    label_tr: "Görev oluştur",
    label_en: "Create task",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "granted", Guest: "denied" },
  },
  {
    key: "change_assignee",
    label_tr: "Atanan değiştir",
    label_en: "Change assignee",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "granted", Guest: "denied" },
  },
  {
    key: "change_status",
    label_tr: "Durum değiştir",
    label_en: "Change status",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "granted", Guest: "denied" },
  },
  {
    key: "delete_task",
    label_tr: "Görev sil",
    label_en: "Delete task",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  // --- User & membership ---
  {
    key: "invite_user",
    label_tr: "Kullanıcı davet et",
    label_en: "Invite user",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "assign_role",
    label_tr: "Rol ata",
    label_en: "Assign role",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "remove_member",
    label_tr: "Üye çıkar",
    label_en: "Remove member",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  // --- Workflow / lifecycle / template ---
  {
    key: "edit_workflow",
    label_tr: "Workflow düzenle",
    label_en: "Edit workflow",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "edit_lifecycle",
    label_tr: "Lifecycle düzenle",
    label_en: "Edit lifecycle",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
  {
    key: "publish_template",
    label_tr: "Şablon yayınla",
    label_en: "Publish template",
    cells: { Admin: "granted", "Project Manager": "granted", Member: "denied", Guest: "denied" },
  },
]

/**
 * Lookup helper for the Permission Matrix grid renderer.
 *
 * Returns "n/a" when the permission key is unknown so callers never crash on
 * a typo or upcoming v3.0 permission addition that frontend hasn't shipped yet.
 */
export function getPermission(perm: PermissionKey, role: AdminRole): TriState {
  const row = PERMISSIONS.find((p) => p.key === perm)
  if (!row) return "n/a"
  return row.cells[role] ?? "n/a"
}
