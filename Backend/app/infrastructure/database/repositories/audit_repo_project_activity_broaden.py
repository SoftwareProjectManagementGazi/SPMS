"""Phase 13 D-13-01 marker — project_activity SQL broadening.

This file documents the broadening change applied to
``audit_repo.py::get_project_activity`` so future readers can grep the
"D-13-01: BROADENED" marker and find both the canonical implementation
and this design note.

Before Phase 13 (RESEARCH.md §Pitfall 2):
    WHERE entity_type='project' AND entity_id=:project_id
    → Activity tab only shows phase_transition events (project entity rows).

After Phase 13:
    WHERE (entity_type='project' AND entity_id=:project_id)
       OR (entity_type='task'    AND entity_id IN (
              SELECT id FROM tasks WHERE project_id=:project_id
          ))
    → Activity tab also shows task created / updated / deleted events,
      which is essential for an actually useful project Activity tab UAT.

The implementation lives in ``audit_repo.py`` (single file, single source
of truth). This file is a marker so both ``Frontend2/components/activity``
plan executors and any future code search land on the right grep hit.
"""
