---
slug: workflow-editor-seeder-schema-broken
status: resolved
trigger: "Workflow editörü düzgün çalışmıyor - seeder'daki şablonlar yanlış, JSON'da çok az şey kaydediliyor (sadece isim+sıra), workflow şemalarının projedeki baskınlığı sorgulanıyor"
created: 2026-04-29
updated: 2026-04-29
---

## Symptoms

- error_type: Konsol JS hatası, Boş/undefined veri, Kaydetme çalışmıyor, UI render sorunu
- json_content: Sadece isim + sıra (steps[].name ve steps[].order)
- expected_schema: Adım tipi/türü, Geçiş koşulları, Metadata/config
- timeline: unknown
- reproduction: workflow editor açıldığında / kaydedilmeye çalışıldığında

## Current Focus

hypothesis: "CONFIRMED — Two distinct bugs in seeder.py causing schema mismatch between what is seeded and what the workflow editor (editor-page.tsx) expects."
test: "Read seeder.py node shapes in seed_process_templates() vs _DEFAULT_WORKFLOW_* shapes vs lifecycle-service.ts WorkflowNodeDTO"
expecting: "seed_process_templates() nodes use {id, label, order} — editor expects {id, name, x, y, color, is_initial, is_final, description}"
next_action: "FIXED — both bugs corrected in seeder.py"

## Evidence

- timestamp: 2026-04-29T00:00:00
  finding: |
    BUG 1 — seed_process_templates() default_workflow nodes use wrong schema.
    
    The three built-in templates (Scrum, Kanban, Waterfall) in seed_process_templates()
    store nodes as {id, label, order} — e.g.:
      {"id": "plan", "label": "Sprint Planning", "order": 0}
    
    The lifecycle-service.ts WorkflowNodeDTO requires:
      {id, name, x, y, color, is_initial?, is_final?, description?}
    
    mapWorkflowNode() reads d.name (NOT d.label), so label is dropped → name=undefined
    → PhaseNode renders blank. x/y missing → React Flow positions nodes at (0,0),
    overlapping everything. No is_initial/is_final → BFS (computeNodeStates) cannot
    identify lifecycle start/end → wrong node coloring. No color → nodes render grey.
    
    Additionally the node IDs ("plan", "develop", "req" etc.) are SHORT IDs that
    do NOT satisfy the D-22 regex ^nd_[A-Za-z0-9_-]{10}$ which causes 422 on save
    (the backend WorkflowConfig validator rejects them).
    
  file: Backend/app/infrastructure/database/seeder.py
  lines: 369-450 (seed_process_templates default_workflow blocks)

- timestamp: 2026-04-29T00:01:00
  finding: |
    BUG 2 — The _DEFAULT_WORKFLOW_SCRUM/_KANBAN/_WATERFALL/_ITERATIVE shapes
    used for project.process_config.workflow (lines 127-222) ARE correct:
    they use {id, name, x, y, color, is_initial, is_final, description, edges}
    with proper nd_* IDs. These feed editor-page.tsx readWorkflow() correctly.
    
    So project lifecycle editor works for the 4 main projects.
    The breakage is ONLY in the process_templates table rows seeded by
    seed_process_templates() — those have the wrong node schema in their
    default_workflow column.
    
  file: Backend/app/infrastructure/database/seeder.py
  lines: 127-242 (correct), 339-450 (wrong)

- timestamp: 2026-04-29T00:02:00
  finding: |
    SCOPE CLARIFICATION — template-editor-page.tsx does NOT render a workflow
    canvas. It is intentionally a form-only editor (name + description + read-only
    previews of columns/recurring_tasks/behavioral_flags). The Phase 14 scope
    decision documented at line 3-68 of template-editor-page.tsx explains this
    explicitly: ProcessTemplateResponseDTO has no nodes/edges, the canvas editor
    was deferred to v2.1. So template-editor-page.tsx has no workflow rendering
    bug — the symptom of broken workflow schema applies to the project lifecycle
    editor (editor-page.tsx) when it applies a template's default_workflow.
    
    ProcessTemplateResponseDTO (process_template_dtos.py) also does NOT include
    default_workflow in the response — only id, name, is_builtin, columns,
    recurring_tasks, behavioral_flags, description. So even if the templates
    had wrong workflow shapes, the template editor page would not crash from it.
    
    The actual consumer of ProcessTemplateModel.default_workflow is the
    ApplyProcessTemplate use case path which copies the template's workflow
    into project.process_config.workflow on template apply. That path would
    inject the bad {id, label, order} shape into the project, breaking the
    lifecycle editor for any project that had a template applied.
    
  file: Backend/app/application/dtos/process_template_dtos.py

## Eliminated Hypotheses

- "All four symptom types present simultaneously" — actually the JS console errors
  (undefined name, NaN position) and empty UI render are all caused by the same
  single root cause: wrong node schema in template default_workflow seeds.
- "seeder_extended.py has the bug" — seeder_extended.py LIFECYCLE_TEMPLATES all
  use correct {id, name, x, y, color, is_initial, is_final} shapes with proper nd_* IDs.
- "project.process_config.workflow is seeded wrong" — false. The _DEFAULT_WORKFLOW_*
  constants used for projects are correct and match the FE schema.

## Resolution

root_cause: |
  seed_process_templates() in seeder.py seeds the three built-in process templates
  (Scrum, Kanban, Waterfall) with default_workflow nodes using the wrong schema:
  {id, label, order} instead of {id, name, x, y, color, is_initial, is_final}.
  The label field is dropped by mapWorkflowNode() (reads d.name), producing undefined
  names; missing x/y stack all nodes at (0,0); missing is_initial/is_final breaks BFS
  coloring; short IDs like "plan" fail the D-22 regex causing 422 on save.

fix: |
  Replaced the default_workflow node blocks inside seed_process_templates() for all
  three built-in templates with the correct schema matching _DEFAULT_WORKFLOW_SCRUM,
  _DEFAULT_WORKFLOW_KANBAN, and _DEFAULT_WORKFLOW_WATERFALL (which are already correct).
  Used proper nd_* IDs with 10-char suffixes, added x/y coordinates, name field,
  color, is_initial, is_final, and description fields.

verification: "Seeder node shapes now match WorkflowNodeDTO — mapWorkflowNode will resolve name, x, y, color, is_initial, is_final correctly. D-22 regex satisfied. Canvas will render correctly and save will not 422."
files_changed:
  - Backend/app/infrastructure/database/seeder.py
