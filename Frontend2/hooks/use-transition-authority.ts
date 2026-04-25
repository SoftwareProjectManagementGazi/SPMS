// Transition-authority hook (Phase 12 Plan 12-01) — single source of truth
// for the 3-role permission gate (CONTEXT D-03 + D-40).
//
// Returns true iff:
//   - user.role === 'Admin', OR
//   - project.managerId === user.id, OR
//   - useLedTeams() returns a team mapped to project.id
//
// Returns false while the led-teams query is loading (data === undefined) —
// Pitfall 17 mitigation. The backend re-checks every action (defense in
// depth) so a transient false here is safe.
//
// Consumed by Phase Gate, Milestone POST/PATCH/DELETE, Artifact POST/DELETE,
// PhaseReport CRUD, and Workflow Editor "Kaydet". No component re-implements
// the 3-role check anywhere else (T-12-01-02 Elevation of Privilege).

import { useAuth } from "@/context/auth-context"
import { useLedTeams } from "./use-led-teams"

export interface TransitionAuthorityProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
}

export function useTransitionAuthority(
  project: TransitionAuthorityProject | null | undefined,
): boolean {
  const { user } = useAuth()
  const { data: ledTeams } = useLedTeams()

  if (!user || !project) return false

  const role = user.role?.name
  if (role === "Admin") return true

  // userId — auth-context exposes it as a string; project IDs are numeric.
  const userId = Number(user.id)
  const managerId = project.managerId ?? project.manager_id
  if (managerId != null && managerId === userId) return true

  // Pitfall 17 — undefined while loading; surface false until resolved.
  if (!ledTeams) return false
  return ledTeams.some((t) => Array.isArray(t.project_ids) && t.project_ids.includes(project.id))
}
