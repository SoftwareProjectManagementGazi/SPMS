// board-dnd.ts — pure drag-end resolution for the Board tab.
//
// This module is intentionally framework-free so that the WIP Warn+Allow
// decision is testable without a DOM. The BoardTab component wires this into
// @dnd-kit/core's onDragEnd callback via ProjectDnDProvider (Plan 11-01).
//
// D-20 authoritative: WIP violation = Warn + Allow (soft). The roadmap
// criterion 5 wording ("prevents dropping") is superseded by D-20 — the team
// self-polices. handleBoardDragEnd returns `wipExceeded: true` when the drop
// would push the target column past its WIP limit, but `moved: true` so the
// caller still fires the PATCH.

export interface BoardColumnInfo {
  /** Column identifier (status string or named column key). */
  id: string
  /** Max allowed task count; 0 disables the check (unlimited). */
  wipLimit: number
  /** Current task count BEFORE the drop. */
  taskCount: number
}

export interface DragResult {
  /** True when the drop should be committed (status PATCH). */
  moved: boolean
  /** True when the move pushes the target past its WIP limit. */
  wipExceeded: boolean
}

export interface HandleBoardDragEndParams {
  taskId: number
  sourceColumnId: string
  targetColumnId: string
  /** Info about the target column; null means WIP check is skipped. */
  targetColumn: BoardColumnInfo | null
}

/**
 * Pure drag-end decision used by BoardTab. Separated from the @dnd-kit
 * provider so the Warn+Allow logic is unit-testable without rendering.
 */
export function handleBoardDragEnd(
  params: HandleBoardDragEndParams
): DragResult {
  const { sourceColumnId, targetColumnId, targetColumn } = params

  // No move if nothing dropped or dropping into the same column.
  if (!targetColumnId || sourceColumnId === targetColumnId) {
    return { moved: false, wipExceeded: false }
  }

  const projectedCount = (targetColumn?.taskCount ?? 0) + 1
  const wipExceeded = !!(
    targetColumn?.wipLimit &&
    targetColumn.wipLimit > 0 &&
    projectedCount > targetColumn.wipLimit
  )

  // D-20 authoritative: Warn + Allow. Never block the move for WIP.
  return { moved: true, wipExceeded }
}
