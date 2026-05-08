---
slug: timeline-no-tasks-with-dates
status: resolved
trigger: "Zaman çizelgesine tıklandığında 'Zaman çizelgesinde görüntülenecek görev yok' mesajı gösteriyor. Görevlerin başlangıç ve bitiş tarihleri var."
created: 2026-05-08
updated: 2026-05-08
---

## Symptoms

- expected: Zaman çizelgesi, başlangıç ve bitiş tarihi olan görevleri listeler
- actual: "Zaman çizelgesinde görüntülenecek görev yok (başlangıç ve bitiş tarihi olan görevler listelenir)" mesajı gösteriliyor
- error_messages: Görsel mesaj, konsol hatası bilinmiyor
- timeline: Frontend2 klasörüne geçişten sonra başlamış olabilir (eski frontend klasörü → Frontend2)
- reproduction: Herhangi bir projeye gir → Zaman çizelgesi sekmesine tıkla

## Current Focus

hypothesis: "TaskModel veritabanı tablosunda start_date kolonu hiç yok — backend her zaman null döndürüyor"
test: ""
expecting: ""
next_action: "RESOLVED — migration 007 + frontend fix applied"

## Evidence

- timestamp: 2026-05-08T00:00:00Z
  finding: "TimelineTab filter: tasks.filter((t) => t.start && t.due) — both must be truthy"
  file: Frontend2/components/project-detail/timeline-tab.tsx:111

- timestamp: 2026-05-08T00:00:00Z
  finding: "TaskModel (SQLAlchemy) has NO start_date column — only due_date exists"
  file: Backend/app/infrastructure/database/models/task.py

- timestamp: 2026-05-08T00:00:00Z
  finding: "TaskResponseDTO has NO start field — so d.start_date is always undefined in mapTask()"
  file: Backend/app/application/dtos/task_dtos.py

- timestamp: 2026-05-08T00:00:00Z
  finding: "mapTask() reads d.start (old field that never existed on server response) → always undefined → Task.start = undefined → filter fails"
  file: Frontend2/services/task-service.ts:150

- timestamp: 2026-05-08T00:00:00Z
  finding: "TaskCreateDTO also had no start_date field — no way for user to set it even if backend supported it"
  file: Backend/app/application/dtos/task_dtos.py

## Eliminated Hypotheses

- "Field name mismatch only in frontend" — root cause is deeper: the column does not exist in the database at all

## Resolution

root_cause: "The TaskModel database table had no start_date column. The backend never serialized a start value, so mapTask() always produced task.start = null/undefined. The timeline filter (t.start && t.due) then excluded every task, showing the empty state."
fix: "Added start_date column across the full stack: (1) Alembic migration 007 adds tasks.start_date TIMESTAMPTZ NULL, (2) TaskModel, domain Task entity, TaskCreateDTO, TaskUpdateDTO, TaskResponseDTO all updated with start_date, (3) task_repo._to_entity() and map_task_to_response_dto() now pass start_date through, (4) frontend mapTask() reads d.start_date ?? null instead of the non-existent d.start, (5) CreateTaskDTO and task-create-modal now include a Start Date field."
verification: "After running the migration and restarting the backend, creating a task with a start date and navigating to Timeline should show the task bar."
files_changed:
  - Backend/alembic/versions/007_task_start_date.py
  - Backend/app/domain/entities/task.py
  - Backend/app/infrastructure/database/models/task.py
  - Backend/app/infrastructure/database/repositories/task_repo.py
  - Backend/app/application/dtos/task_dtos.py
  - Backend/app/application/use_cases/manage_tasks.py
  - Frontend2/services/task-service.ts
  - Frontend2/components/task-modal/task-create-modal.tsx
