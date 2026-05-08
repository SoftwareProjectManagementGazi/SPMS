---
slug: sprint-gorev-olusturma
status: resolved
trigger: "Scrum kullanan bir projeye yeni görev oluştururken sprint seçilemiyor"
created: 2026-05-08
updated: 2026-05-08
---

## Symptoms

- **Expected:** Scrum projesinde görev oluştururken sprint dropdown'ında mevcut sprintler listelenmeli ve seçilebilmeli
- **Actual:** Sprint dropdown alanı görünüyor ancak boş veya disabled durumda
- **Errors:** Sessiz hata — konsol veya network'te hata yok
- **Reproduction:** Scrum metodolojisindeki bir projeye git, yeni görev oluştur formunu aç, sprint alanı boş/disabled
- **Timeline:** Bilinmiyor

## Current Focus

hypothesis: Sprint dropdown'ı create-task-modal.tsx'te hiç implement edilmemiş
test: create-task-modal.tsx dosyası incelendi
expecting: Sprint fetch ve UI tamamen eksik
next_action: fixed

## Evidence

- timestamp: 2026-05-08
  file: Frontend/components/create-task-modal.tsx
  finding: Sprint dropdown UI, sprint state, sprint fetch, ve sprint_id payload alanı tamamen yoktu. Form'da sprint'e dair hiçbir kod bulunmadı.

- timestamp: 2026-05-08
  file: Frontend/services/task-service.ts
  finding: CreateTaskDTO interface'inde sprint_id alanı eksikti. Backend'e sprint_id gönderilemiyor.

- timestamp: 2026-05-08
  file: Frontend/services/sprint-service.ts
  finding: sprintService.list(projectId) metodu var ve çalışır durumda. Sadece create-task-modal tarafından import edilmiyordu.

- timestamp: 2026-05-08
  file: Backend/app/application/dtos/task_dtos.py
  finding: Backend TaskCreateDTO'da sprint_id: Optional[int] = None mevcut. Backend tarafında sorun yok.

## Eliminated

- Backend sprint endpoint — çalışıyor, sprint_id alanı TaskCreateDTO'da mevcut
- Network/API hataları — sprint service doğru endpoint'e istek atıyor
- Sprint service — list() metodu doğru çalışıyor, sadece form tarafından kullanılmıyordu

## Resolution

root_cause: create-task-modal.tsx'te sprint dropdown UI'ı, sprint state'i (sprintId), sprintService import'u, sprint fetch query'si ve payload'da sprint_id alanı tamamen eksikti. Kullanıcının gördüğü "dropdown visible but empty/disabled" belirtisi muhtemelen başka bir formdaki (task-detail ya da board) sprint alanına aitti; create-task-modal'da sprint alanı hiç yoktu.
fix: |
  1. Frontend/services/task-service.ts — CreateTaskDTO interface'ine sprint_id?: number eklendi
  2. Frontend/components/create-task-modal.tsx:
     - sprintService import'u eklendi
     - sprintId state'i eklendi
     - selectedProject ve isScrum derivasyonu eklendi (methodology === "scrum" kontrolü)
     - sprints useQuery sorgusu eklendi (enabled: isScrum && !!selectedProjectId)
     - Sprint Select dropdown UI'ı eklendi — sadece Scrum projesinde görünür, sprintler listelenir, aktif sprint Badge ile işaretlenir, "No sprint (Backlog)" seçeneği mevcut
     - handleSubmit payload'una sprint_id eklendi (isScrum && sprintId && sprintId !== "0" koşuluyla)
     - resetForm'a setSprintId("") eklendi
     - selectedProjectId değiştiğinde sprintId sıfırlayan useEffect eklendi
verification: Scrum projesinde "Create Task" formunu açınca Sprint alanı görünmeli, sprintler listeli ve seçilebilir olmalı. Non-Scrum projelerinde sprint alanı hiç gösterilmemeli.
files_changed:
  - Frontend/services/task-service.ts
  - Frontend/components/create-task-modal.tsx
