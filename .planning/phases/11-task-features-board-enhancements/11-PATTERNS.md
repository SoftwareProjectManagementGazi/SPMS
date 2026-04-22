# Phase 11: Task Features & Board Enhancements — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 54 new / 6 modified (frontend) · 8 new / 2 modified (backend)
**Analogs found:** 42 with close analogs / 60 total. 18 files flagged NEW PATTERN — no existing analog (DnD, TipTap, TanStack Table, custom SVG Gantt, custom calendar, localStorage stores for my-tasks).

---

## Summary

Phase 11 sits on top of a mature Frontend2 scaffold. Every frontend service/hook/shell-layout page has a clean analog already in the codebase (`project-service.ts`, `useProjects`, `AuthProvider`, `ArchiveBanner`, `ProjectCard`). The new frontend work is additive: task/label/comment/attachment services mirror the project-service shape one-for-one; all 16 primitives are ready to consume verbatim. Only the integration libraries (`@dnd-kit`, `@tiptap`, `@tanstack/react-table`) plus the custom SVG Gantt and custom calendar have no existing pattern to mirror — for those, the planner must follow `11-RESEARCH.md` verbatim.

On the backend, the existing **board-columns** slice is the perfect 1:1 analog for the new labels vertical slice: `BoardColumn` entity → `IBoardColumnRepository` → `SqlAlchemyBoardColumnRepository` → `manage_board_columns.py` use cases → `board_column_dtos.py` DTOs → `board_columns.py` router → `deps/board_column.py` DI → `main.py` `include_router`. The planner copies this shape and swaps `BoardColumn` → `Label`.

**Architectural note:** `Frontend2/components/app-shell.tsx` and `Frontend2/components/header.tsx` live at top-level, not in an `app-shell/` subdirectory as `11-CONTEXT.md <code_context>` implies. The planner must target `Frontend2/components/header.tsx` for the D-07 Create-button rewire.

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match |
|---------------------|------|-----------|----------------|-------|
| `Frontend2/context/task-modal-context.tsx` | provider | event-driven | `Frontend2/context/auth-context.tsx` | exact |
| `Frontend2/components/task-modal/task-modal-provider.tsx` | provider | event-driven | `Frontend2/context/auth-context.tsx` | role-match |
| `Frontend2/components/task-modal/task-create-modal.tsx` | component | request-response | `New_Frontend/src/pages/create-task-modal.jsx` + `Frontend2/components/projects/confirm-dialog.tsx` | prototype-port |
| `Frontend2/components/project-detail/project-detail-shell.tsx` | component | request-response | `New_Frontend/src/pages/project-detail.jsx` + `Frontend2/components/primitives/tabs.tsx` | prototype-port |
| `Frontend2/components/project-detail/board-tab.tsx` | component | event-driven (DnD) | `New_Frontend/src/pages/project-detail.jsx` `BoardTab` | prototype-port + NEW DnD |
| `Frontend2/components/project-detail/board-card.tsx` | component | request-response | `Frontend2/components/projects/project-card.tsx` | role-match |
| `Frontend2/components/project-detail/list-tab.tsx` | component | CRUD | prototype `ListTab` only | NEW TanStack Table pattern |
| `Frontend2/components/project-detail/timeline-tab.tsx` | component | transform (SVG) | — | NEW — custom SVG Gantt |
| `Frontend2/components/project-detail/calendar-view.tsx` | component | transform | — | NEW — custom calendar |
| `Frontend2/components/project-detail/members-tab.tsx` | component | CRUD | prototype `MembersTab` + `ProjectCard` styling | prototype-port |
| `Frontend2/components/project-detail/settings-tab.tsx` | component | CRUD | prototype `SettingsTab` + existing `Tabs` primitive | prototype-port |
| `Frontend2/components/project-detail/backlog-panel.tsx` | component | event-driven | — (new design per D-13) | NEW — no prototype |
| `Frontend2/components/project-detail/backlog-toggle.tsx` | component | event-driven | `Frontend2/components/primitives/button.tsx` usage | role-match |
| `Frontend2/components/task-detail/properties-sidebar.tsx` | component | CRUD | `New_Frontend/src/pages/task-detail.jsx` `MetaRow` + new InlineEdit | prototype-port |
| `Frontend2/components/task-detail/inline-edit.tsx` | component | CRUD (optimistic) | — (new pattern) | NEW — see RESEARCH §Optimistic Inline Edit |
| `Frontend2/components/task-detail/description-editor.tsx` | component | transform | — | NEW — TipTap dynamic import |
| `Frontend2/components/task-detail/sub-tasks-list.tsx` | component | request-response | prototype task-detail sub-tasks block | prototype-port |
| `Frontend2/components/task-detail/parent-task-link.tsx` | component | request-response | prototype task-detail header (lines 15-19) | prototype-port |
| `Frontend2/components/task-detail/comments-section.tsx` | component | CRUD | prototype task-detail Activity block | prototype-port |
| `Frontend2/components/task-detail/history-section.tsx` | component | request-response | — | NEW — audit log formatter |
| `Frontend2/components/task-detail/attachments-section.tsx` | component | file-I/O | — | NEW — drag-drop area |
| `Frontend2/components/task-detail/dependencies-section.tsx` | component | CRUD | prototype task-detail Dependencies block | prototype-port |
| `Frontend2/components/my-tasks/my-tasks-experience.tsx` | component | CRUD | `New_Frontend/src/pages/my-tasks.jsx` | prototype-port (656 lines) |
| `Frontend2/components/my-tasks/saved-views-tabs.tsx` | component | event-driven | `Frontend2/components/primitives/tabs.tsx` + prototype views | role-match |
| `Frontend2/components/my-tasks/task-filter-bar.tsx` | component | event-driven | `Frontend2/app/(shell)/projects/page.tsx` filters | role-match |
| `Frontend2/components/my-tasks/task-group-list.tsx` | component | transform | prototype `my-tasks-parts.jsx` | prototype-port |
| `Frontend2/components/my-tasks/task-row.tsx` | component | request-response | prototype `my-tasks-parts.jsx` | prototype-port |
| `Frontend2/components/header/create-button.tsx` | component | event-driven | `Frontend2/components/header.tsx` Create button | exact |
| `Frontend2/components/header/search-autocomplete.tsx` | component | request-response | `Frontend2/components/header.tsx` search Input | role-match — new autocomplete |
| `Frontend2/services/task-service.ts` | service | CRUD | `Frontend2/services/project-service.ts` | **exact** |
| `Frontend2/services/label-service.ts` | service | CRUD | `Frontend2/services/project-service.ts` | exact |
| `Frontend2/services/comment-service.ts` | service | CRUD | `Frontend2/services/project-service.ts` | exact |
| `Frontend2/services/attachment-service.ts` | service | file-I/O | `Frontend2/services/auth-service.ts` `uploadAvatar` | role-match |
| `Frontend2/hooks/use-tasks.ts` | hook | CRUD | `Frontend2/hooks/use-projects.ts` | **exact** |
| `Frontend2/hooks/use-task-detail.ts` | hook | request-response | `Frontend2/hooks/use-projects.ts` `useProject` | role-match |
| `Frontend2/hooks/use-backlog.ts` | hook | request-response | `Frontend2/hooks/use-projects.ts` `useProjects` | role-match |
| `Frontend2/hooks/use-labels.ts` | hook | CRUD | `Frontend2/hooks/use-projects.ts` + `useCreateProject` | exact |
| `Frontend2/hooks/use-watchers.ts` | hook | CRUD | `Frontend2/hooks/use-projects.ts` `useUpdateProjectStatus` | role-match |
| `Frontend2/hooks/use-my-tasks-store.ts` | hook | event-driven (localStorage) | `Frontend2/context/app-context.tsx` `load/save` helpers | role-match |
| `Frontend2/lib/dnd/dnd-provider.tsx` | provider | event-driven | — | NEW — see RESEARCH §Cross-Container DnD |
| `Frontend2/lib/dnd/board-dnd.ts` | utility | event-driven | — | NEW — handler logic |
| `Frontend2/lib/my-tasks/smart-sort.ts` | utility | transform | — | NEW — pure sort per RESEARCH §test map |
| `Frontend2/lib/my-tasks/due-bucket.ts` | utility | transform | — | NEW — pure bucketing |
| `Frontend2/lib/methodology-matrix.ts` | utility | transform | `New_Frontend/src/data.jsx` `CYCLE_LABELS` | role-match |
| `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` | route | request-response | `Frontend2/app/(shell)/projects/[id]/page.tsx` | exact |
| `Frontend2/app/layout.tsx` | MODIFIED | config | (self) | exact — composition only |
| `Frontend2/app/(shell)/layout.tsx` | MODIFIED | config | (self) | exact — composition only |
| `Frontend2/app/(shell)/projects/[id]/page.tsx` | MODIFIED | request-response | (self) | exact — replaces placeholder Card |
| `Frontend2/app/(shell)/my-tasks/page.tsx` | MODIFIED | request-response | (self) | exact — replaces stub |
| `Frontend2/app/(shell)/projects/page.tsx` | MODIFIED | request-response | (self) | exact — role-gated button |
| `Frontend2/components/header.tsx` | MODIFIED | event-driven | (self) | exact — rewire Create button |
| **Backend — New slice** | | | | |
| `Backend/app/domain/entities/label.py` | entity | — | `Backend/app/domain/entities/project.py` (simpler — no validator needed) | role-match — **already exists; needs minor update** |
| `Backend/app/domain/repositories/label_repository.py` | interface | CRUD | `Backend/app/domain/repositories/board_column_repository.py` | **exact** |
| `Backend/app/infrastructure/database/repositories/label_repo.py` | repository | CRUD | `Backend/app/infrastructure/database/repositories/board_column_repo.py` | **exact** |
| `Backend/app/application/use_cases/manage_labels.py` | use-case | CRUD | `Backend/app/application/use_cases/manage_board_columns.py` | **exact** |
| `Backend/app/application/dtos/label_dtos.py` | DTO | — | `Backend/app/application/dtos/board_column_dtos.py` | **exact** |
| `Backend/app/api/v1/labels.py` | router | CRUD | `Backend/app/api/v1/board_columns.py` | **exact** |
| `Backend/app/api/deps/label.py` | DI | — | `Backend/app/api/deps/board_column.py` | **exact** |
| `Backend/app/api/dependencies.py` | MODIFIED | config | (self) | add re-export line |
| `Backend/app/api/main.py` | MODIFIED | config | (self) | add include_router line |
| `Backend/app/domain/exceptions.py` | MODIFIED | — | (self) | add `LabelNameAlreadyExistsError` |

---

## Frontend — Context Providers

### `Frontend2/context/task-modal-context.tsx` — TaskModalProvider + hook

**Analog:** `Frontend2/context/auth-context.tsx` (lines 1-80, full file — 81 lines)

**Excerpt to mirror (lines 1-20, 14-22):**
```tsx
"use client"
import * as React from "react"
import { authService, type AuthUser } from "@/services/auth-service"
import { AUTH_TOKEN_KEY } from "@/lib/constants"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
```

**Diffs to expect:**
- Rename `AuthContext` → `TaskModalContext`, `useAuth` → `useTaskModal`, `AuthProvider` → `TaskModalProvider`.
- State shape: `{ isOpen: boolean, defaults: { projectId?: number, type?: "task" | "subtask" | "bug", parentTaskId?: number } | null }`.
- Expose `openTaskModal(defaults?)`, `closeTaskModal()`.
- Use `React.useState` + `React.useCallback` (same pattern as `login`/`logout` in the analog).
- **No localStorage** (per D-02: no draft persistence — close discards).
- Use `React.useMemo` for the context value (line 70 of analog).
- Error message follows "must be used within TaskModalProvider" convention (line 19 of analog).

### `Frontend2/components/task-modal/task-modal-provider.tsx` — re-export wrapper

**Analog:** N/A — this file per D-01 is a wrapper component that renders `<TaskCreateModal>` once at tree root and consumes `useTaskModal()` to know when to mount. Treat this as a new pattern.

**Composition pattern (matches the separation in `app-context.tsx` where `AppProvider` wraps state + DOM side effects):**
```tsx
// Inside shell layout:
<TaskModalProvider>         // context + state
  {children}
  <TaskCreateModal />        // reads isOpen/defaults via useTaskModal()
</TaskModalProvider>
```

Per RESEARCH §Provider Tree Ordering, mount `TaskModalProvider` **inside** `QueryClientProvider` + `ToastProvider` (shell layout line 17-19), because the modal body needs `useQueryClient`, `useToast`, `useAuth`. Do NOT mount at root layout.

---

## Frontend — Services

### `Frontend2/services/task-service.ts` → analog `Frontend2/services/project-service.ts`

**Analog:** `Frontend2/services/project-service.ts` (lines 1-133, full file)

**Excerpt to mirror (lines 1-91):**
```typescript
import { apiClient } from '@/lib/api-client';

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string | null;
  // ... snake → camel mapping of all backend fields
  createdAt: string;
}

interface ProjectResponseDTO {
  id: number;
  key: string;
  name: string;
  // ... snake_case raw from backend
  created_at: string;
}

function mapProject(data: ProjectResponseDTO): Project {
  return {
    id: data.id,
    key: data.key,
    name: data.name,
    // ... snake_case → camelCase conversion
    createdAt: data.created_at,
  };
}

export const projectService = {
  getAll: async (status?: string): Promise<Project[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await apiClient.get<ProjectResponseDTO[]>('/projects', { params });
    return response.data.map(mapProject);
  },

  getById: async (id: string | number): Promise<Project> => {
    const response = await apiClient.get<ProjectResponseDTO>(`/projects/${id}`);
    return mapProject(response.data);
  },

  create: async (data: CreateProjectDTO): Promise<Project> => {
    const response = await apiClient.post<ProjectResponseDTO>('/projects', data);
    return mapProject(response.data);
  },

  updateStatus: async (id: number, status: string): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponseDTO>(`/projects/${id}`, { status });
    return mapProject(response.data);
  },
};
```

**Diffs to expect:**
- Rename `projectService` → `taskService`; `Project` → `Task`; `ProjectResponseDTO` → `TaskResponseDTO`.
- Task shape fields (per RESEARCH §TanStack Table §Audit Log): `id, key, title, description, status, priority, assignee_id, reporter_id, parent_task_id, project_id, cycle_id, phase_id, points, start, due, labels[], watcher_count, type ('task'|'subtask'|'bug')`.
- Endpoints (from CONTEXT `<canonical_refs>`):
  - `getByProject(projectId, filters)` → `GET /tasks/project/{id}?status=&priority=&assignee_id=&phase_id=&cycle_id=&in_backlog=`
  - `getMyTasks()` → `GET /tasks/my-tasks`
  - `search(q)` → `GET /tasks/search?q=`
  - `getById(id)` → `GET /tasks/{id}`
  - `getHistory(id)` → `GET /tasks/{id}/history`
  - `create(dto)` → `POST /tasks`
  - `patchField(id, field, value)` → `PATCH /tasks/{id}` (body: `{ [field]: value }`) — used by InlineEdit per RESEARCH §Optimistic
  - `update(id, dto)` → `PATCH /tasks/{id}` (full DTO)
- Dependencies + Watchers: separate exports `taskDepsService`, `watchersService` OR inline on `taskService` — planner's call.
- Same `apiClient` import, same `snake_case → camelCase` mapper pattern.

### `Frontend2/services/label-service.ts` → analog `Frontend2/services/project-service.ts`

Identical shape. Endpoints:
- `getByProject(projectId)` → `GET /projects/{id}/labels` (NEW backend)
- `create(projectId, name, color?)` → `POST /labels` (NEW backend)

**Diffs:** single-word entity name. No status filter. No archive. Add 409-conflict handling per RESEARCH §Pitfall 7 (label auto-create race) — on 409, re-fetch list and return the existing label.

### `Frontend2/services/comment-service.ts` → analog `Frontend2/services/project-service.ts`

Same shape. Endpoints (from CONTEXT canonical_refs line 239):
- `getByTask(taskId)` → `GET /tasks/{id}/comments` (or `/comments?task_id=` — planner confirms at router level)
- `create(taskId, body)` → `POST /comments`
- `update(id, body)` → `PATCH /comments/{id}`
- `delete(id)` → `DELETE /comments/{id}`

### `Frontend2/services/attachment-service.ts` → analog `Frontend2/services/auth-service.ts` `uploadAvatar`

**Analog:** `Frontend2/services/auth-service.ts` (lines 74-81)

**Excerpt:**
```typescript
uploadAvatar: async (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<UserResponseDTO>('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapUserResponseToUser(response.data);
},
```

**Diffs:**
- POST target `/attachments` with `task_id` in FormData (backend uses `Form(...)` — see `Backend/app/api/v1/attachments.py` line 43-50).
- GET `/attachments/task/{task_id}` for listing.
- DELETE `/attachments/{id}`.
- Add `createLink(taskId, url, title?)` for D-48 link references (same endpoint with `type: "link"`).

---

## Frontend — Hooks

### `Frontend2/hooks/use-tasks.ts` → analog `Frontend2/hooks/use-projects.ts`

**Analog:** `Frontend2/hooks/use-projects.ts` (lines 1-95, full file)

**Excerpt to mirror (lines 1-45):**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type CreateProjectDTO } from '@/services/project-service';

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', { status }],
    queryFn: () => projectService.getAll(status),
  });
}

export function useProject(id: string | number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectService.updateStatus(id, status),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDTO) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

**Diffs:**
- `useTasks(projectId, filters?)` — queryKey: `['tasks', 'project', projectId, filters]` (per RESEARCH line 315).
- `useMyTasks()` — queryKey: `['tasks', 'my-tasks']`.
- `useTaskSearch(q)` — queryKey: `['tasks', 'search', q]`, `enabled: q.trim().length >= 2` with **250ms debounce** at the call site (D-50) and `staleTime: 30 * 1000` like `useTaskStats`.
- `useCreateTask()` — onSuccess: invalidate `['tasks']` + `['projects', projectId]` (task count changes column badges).
- `useUpdateTask()` — used by InlineEdit per RESEARCH §Optimistic; this one implements the **optimistic pattern** (onMutate + onError rollback + onSettled invalidate) NOT the simple onSuccess pattern.
- Use the 403-swallow pattern from `useGlobalActivity` (lines 56-72) for any endpoint that might 403 on non-members.

### `Frontend2/hooks/use-task-detail.ts` → analog `useProject`

**Analog:** `Frontend2/hooks/use-projects.ts` (lines 12-18)

Mirrors `useProject` exactly, with queryKey `['tasks', taskId]` and `enabled: !!taskId`. Add `useTaskHistory(taskId)` as a parallel query.

### `Frontend2/hooks/use-backlog.ts` → analog `useProjects`

Mirrors `useProjects` but queryFn calls `taskService.getByProject(projectId, { in_backlog: true })`. QueryKey `['tasks', 'backlog', projectId]`. Backlog definition resolution (D-16 matrix) happens in `lib/methodology-matrix.ts` before the hook calls the service.

### `Frontend2/hooks/use-labels.ts` → analog `useProjects` + `useCreateProject`

Two hooks: `useProjectLabels(projectId)` mirrors `useProjects`; `useCreateLabel()` mirrors `useCreateProject` but with 409-conflict swallow (RESEARCH Pitfall 7) — on 409, re-fetch and return the existing id so the caller can still link to the task.

### `Frontend2/hooks/use-watchers.ts` → analog `useUpdateProjectStatus`

Mirrors `useUpdateProjectStatus` (line 21-34 of analog). Two mutations (`useAddWatcher`, `useRemoveWatcher`) both onSettled-invalidate `['tasks', taskId]` to refresh `watcher_count`.

### `Frontend2/hooks/use-my-tasks-store.ts` → analog `Frontend2/context/app-context.tsx` `load/save` helpers (lines 69-86)

**Analog excerpt (lines 69-86):**
```tsx
function load<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try {
    const v = window.localStorage.getItem("spms." + key)
    return v !== null ? (JSON.parse(v) as T) : def
  } catch {
    return def
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem("spms." + key, JSON.stringify(value))
  } catch {
    /* ignore -- T-08-01 accept disposition */
  }
}
```

**Diffs:**
- Key namespace: `spms.myTasksStore` (per prototype `my-tasks.jsx` line 9).
- Store shape: `{ overrides: Record<string, Partial<Task>>, extras: Task[], starred: number[], completedAt: Record<number, string> }` — matches prototype line 16.
- Port `mtLoadStore`/`mtSaveStore` from prototype but wrap with the try/catch pattern from `app-context.tsx` so corrupted localStorage falls back to defaults silently (T-08-01).
- Return `[store, setStore]` (same tuple shape as prototype line 24).

---

## Frontend — Project-Detail Components

### `Frontend2/components/project-detail/project-detail-shell.tsx` (8-tab wrapper)

**Analog 1 (behaviour):** `New_Frontend/src/pages/project-detail.jsx` (lines 1-64) — the prototype's `ProjectDetailPage` shell.

**Analog 2 (Tabs API):** `Frontend2/components/primitives/tabs.tsx` (full file, 93 lines).

**Prototype excerpt (lines 39-61):**
```jsx
<Tabs active={tab} onChange={setTab} size="md" tabs={[
  { id: "board", label: lang === "tr" ? "Pano" : "Board", icon: <Icons.Grid size={13}/> },
  { id: "list", label: ..., icon: <Icons.List size={13}/>, badge: tasks.length },
  { id: "timeline", label: ..., icon: <Icons.Chart size={13}/> },
  { id: "calendar", label: ..., icon: <Icons.Calendar size={13}/> },
  { id: "activity", label: ..., icon: <Icons.Activity size={13}/> },
  { id: "lifecycle", label: ..., icon: <Icons.Flow size={13}/> },
  { id: "members", label: ..., icon: <Icons.Users size={13}/>, badge: members.length },
  { id: "settings", label: ..., icon: <Icons.Settings size={13}/> },
]}/>

<div style={{ marginTop: 20, flex: 1, minHeight: 0 }}>
  {tab === "board" && <BoardTab project={project} tasks={tasks} lang={lang}/>}
  {tab === "list" && <ListTab project={project} tasks={tasks} lang={lang}/>}
  {tab === "timeline" && <TimelineTab project={project} tasks={tasks} lang={lang}/>}
  {tab === "calendar" && <CalendarTab project={project} tasks={tasks} lang={lang}/>}
  {tab === "activity" && <ActivityTab projectId={project.id} variant="full"/>}
  {tab === "lifecycle" && <LifecycleTabV2 project={project} lang={lang}/>}
  {tab === "members" && <MembersTab project={project} lang={lang}/>}
  {tab === "settings" && <SettingsTab project={project} lang={lang}/>}
</div>
```

**Diffs:**
- Replace `Icons.Grid` etc. with `lucide-react` imports (see `Frontend2/components/header.tsx` line 11 for the pattern).
- Replace `window.SPMSData.*` with TanStack Query hooks (`useProject(projectId)`, `useTasks(projectId)`).
- Activity + Lifecycle tabs render `<AlertBanner tone="info">` stubs per D-10 (see §Primitives Reuse — AlertBanner). Do NOT mount `<ActivityTab>` / `<LifecycleTabV2>` yet.
- Wrap the whole tab content in `<ProjectDnDProvider projectId={project.id}>` (per RESEARCH §Mount Point Recommendation — DnDContext at project detail page level).
- Tab state: `React.useState<"board" | "list" | ...>("board")` per D-09.
- Board + Backlog share the same DndContext (one wrapper, both tabs mount inside).

### `Frontend2/components/project-detail/board-tab.tsx`

**Analog 1 (layout):** `New_Frontend/src/pages/project-detail.jsx` `BoardTab` (lines 66-180 approx).

**Analog 2 (DnD wiring):** **NEW** — no existing codebase analog. Follow `11-RESEARCH.md` §@dnd-kit Drag-Drop Patterns (lines 241-341) verbatim.

**Prototype excerpt (lines 78-90 of project-detail.jsx) — Toolbar pattern:**
```jsx
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
  <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Filtrele" : "Filter"} size="sm" style={{ width: 200 }}/>
  <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
    <button onClick={() => setCompact(true)} style={{ ... }}>{lang === "tr" ? "Sıkı" : "Compact"}</button>
    <button onClick={() => setCompact(false)} style={{ ... }}>{lang === "tr" ? "Detaylı" : "Rich"}</button>
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--fg-muted)", fontSize: 12 }}>
    <span>Sprint:</span><Badge size="xs" tone="info">Sprint 7</Badge>
  </div>
  <div style={{ flex: 1 }}/>
  <AvatarStack users={...} max={5} size={22}/>
  <Button size="sm" variant="ghost" icon={<Icons.Filter size={13}/>}>{lang === "tr" ? "Filtreler" : "Filters"}</Button>
</div>
```

**Diffs from prototype:**
- Replace the raw `<button>` Compact/Rich toggle with `<SegmentedControl>` primitive (2 options, `options=[{id:"compact",label:...},{id:"rich",label:...}]`).
- Replace HTML5 `onDragOver`/`onDrop` with `@dnd-kit/core` `<DndContext>` + `<SortableContext>` + `useSortable` — per RESEARCH §Cross-Container Drag Pattern.
- Replace `setTaskMap` local state with TanStack Query cache + `queryClient.setQueryData` for optimistic update (RESEARCH lines 305-330).
- Wire WIP check per D-20 Warn + Allow (RESEARCH lines 282-335) — toast + red column tint + AlertBanner, drop still proceeds.
- Persist `compact` to `localStorage.spms.board.density.{projectId}` (D-21) — use the same load/save helper copied from `app-context.tsx`.
- Phase filter button is conditional on `project.process_config?.enable_phase_assignment === true` (D-22).

### `Frontend2/components/project-detail/board-card.tsx`

**Analog:** `Frontend2/components/projects/project-card.tsx` (lines 141-267 body)

**Relevant excerpt (lines 141-160, 199-225, 250-265):**
```tsx
<Card
  interactive
  padding={0}
  style={{ opacity: isArchived ? 0.6 : 1, position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
  onClick={() => router.push(`/projects/${project.id}`)}
>
  <div style={{ height: 4, background: STATUS_STRIP[project.status] ?? "var(--primary)", borderRadius: "var(--radius) var(--radius) 0 0" }} />
  <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, paddingRight: 28 }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>
          {project.key}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{project.name}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
        <Badge size="xs" tone="neutral">{project.methodology}</Badge>
      </div>
    </div>
  </div>
</Card>
```

**Diffs:**
- Replace `project` with `task`; `project.key` → `task.key`, `project.name` → `task.title`, `project.methodology` → `task.priority` + `<PriorityChip>` + `<StatusDot>`.
- Remove status strip (board cards don't have status strip — column already colors via methodology).
- `onClick` → `router.push(\`/projects/${projectId}/tasks/${task.id}\`)` (D-23).
- Attach `useSortable` (from `@dnd-kit/sortable`) for drag:
  ```tsx
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, data: { columnId, task } })
  ```
- Compact vs Rich mode: compact = key + title + avatar only; Rich = + priority chip + points + due (D-21).
- When `project.process_config.enable_phase_assignment === true`: render a small phase badge above title with the phase name from `process_config.workflow.nodes[].find(n => n.id === task.phase_id).name` (D-24).
- Provide `<BoardCardGhost>` sub-export for `<DragOverlay>` rendering (per RESEARCH line 1367).

---

## Frontend — Task-Detail Components

### `Frontend2/components/task-detail/properties-sidebar.tsx`

**Analog:** `New_Frontend/src/pages/task-detail.jsx` sidebar block (lines 112-135) + `MetaRow` helper (lines 140-144).

**Prototype excerpt (lines 112-125):**
```jsx
<Card padding={0}>
  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase" }}>
    {lang === "tr" ? "Özellikler" : "Properties"}
  </div>
  <div style={{ padding: "8px 0" }}>
    <MetaRow label={lang === "tr" ? "Durum" : "Status"}><Badge tone={...} dot>{status.name[lang]}</Badge></MetaRow>
    <MetaRow label={lang === "tr" ? "Atanan" : "Assignee"}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={assignee} size={20}/><span>{assignee?.name}</span></div></MetaRow>
    <MetaRow label={lang === "tr" ? "Bildiren" : "Reporter"}>...</MetaRow>
    <MetaRow label={lang === "tr" ? "Öncelik" : "Priority"}><PriorityChip level={task.priority} lang={lang}/></MetaRow>
    <MetaRow label={lang === "tr" ? "Puan" : "Points"}><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{task.points}</span></MetaRow>
    <MetaRow label={lang === "tr" ? "Bitiş" : "Due date"}>...</MetaRow>
    <MetaRow label="Sprint">...</MetaRow>
    <MetaRow label={lang === "tr" ? "Etiketler" : "Labels"}>...</MetaRow>
  </div>
</Card>
```

**MetaRow helper (lines 140-144):**
```jsx
const MetaRow = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", padding: "6px 16px", alignItems: "center", gap: 8, fontSize: 12 }}>
    <div style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>{label}</div>
    <div>{children}</div>
  </div>
);
```

**Diffs:**
- Wrap EVERY value (the `children` prop of MetaRow) in `<InlineEdit value={...} onCommit={...} />` per D-38. Read-only for `created_at`/`reporter` if the user lacks permission.
- Cycle row: hide when methodology === "KANBAN" (D-45); disable with helper "Faz 12'de aktive edilecek" for all non-Scrum except Waterfall (D-44).
- Phase row: conditional on `project.process_config?.enable_phase_assignment` (D-38); source from `process_config.workflow.nodes` (D-41).
- Labels row: multi-chip picker (see `dependencies-section` for similar + pattern); triggers `useCreateLabel` on new tag (D-51).
- Add Watcher toggle at the top of the main content (D-53, NOT in sidebar — this is the prototype-line 25 `<Button>Watch</Button>` already).
- TASK-04 phase stepper (D-39): renders below Labels row when `enable_phase_assignment` AND `task.subtasks.length > 0`. Count sub-tasks per phase, highlight max, chips in PriorityChip style.

### `Frontend2/components/task-detail/inline-edit.tsx`

**Analog:** **NEW** — no existing codebase analog. Follow `11-RESEARCH.md` §Optimistic Inline Edit Pattern (lines 1378-1456) verbatim.

The full pattern is in RESEARCH lines 1378-1456; the planner should copy it directly.

### `Frontend2/components/task-detail/description-editor.tsx` + `description-editor-rich.tsx`

**Analog:** **NEW** — no existing codebase analog. Follow `11-RESEARCH.md` §TipTap Rich Editor (lines 342-511) verbatim.

Key rules (non-negotiable):
- `dynamic(() => import("./description-editor-rich"), { ssr: false })` for lazy load (RESEARCH line 367).
- `immediatelyRender: false` inside `useEditor` config (RESEARCH line 427) — BOTH flags required per RESEARCH Pitfall 2.
- Toolbar uses `Button` primitive with ghost variant (RESEARCH lines 470-501).
- 2s debounced save via `setTimeout` in `onUpdate` (RESEARCH lines 430-435) per D-36.
- Storage: `task.description` (existing TEXT column); use `editor.getHTML()` (RESEARCH line 504).

### `Frontend2/components/task-detail/sub-tasks-list.tsx`

**Analog:** `New_Frontend/src/pages/task-detail.jsx` sub-tasks block (lines 47-67).

**Prototype excerpt (lines 56-65):**
```jsx
<div style={{
  display: "grid",
  gridTemplateColumns: "80px 20px 1fr 90px 22px",
  padding: "10px 14px", alignItems: "center", gap: 10,
  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "0",
  fontSize: 12.5,
}}>
  <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{st.key}</div>
  <input type="checkbox" checked={st.status === "done"} readOnly/>
  <div style={{ textDecoration: st.status === "done" ? "line-through" : "none", color: st.status === "done" ? "var(--fg-muted)" : "var(--fg)" }}>{st.title}</div>
  <Badge size="xs" tone={st.status === "done" ? "success" : st.status === "progress" ? "info" : "neutral"} dot>{...}</Badge>
  <Avatar user={u} size={20}/>
</div>
```

**Diffs (per D-37):**
- **Remove checkbox** — D-37 says "rich-row list (NOT checkboxes)".
- Add `onClick` on the row → `router.push(\`/projects/${projectId}/tasks/${st.id}\`)`.
- Add "Ekle" Section action → calls `openTaskModal({ type: "subtask", parentTaskId: task.id })` (D-37 + RESEARCH §task-modal-context).
- Grid: key 80px mono, status dot, title flex, due `"May 3"` short format, avatar 20px, labels chips (per CONTEXT §specifics).
- Replace `window.SPMSData.STATUSES.find(...)` with status value from task entity; use `<StatusDot status={st.status} />` + text label.

### `Frontend2/components/task-detail/parent-task-link.tsx`

**Analog:** `New_Frontend/src/pages/task-detail.jsx` breadcrumb (lines 15-19)

**Prototype excerpt (lines 15-19):**
```jsx
<div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-muted)" }}>
  <Icons.Folder size={13}/>
  <span onClick={() => router.go("project-detail", { projectId: project.id })} style={{ cursor: "pointer" }}>{project.name}</span>
  <Icons.ChevronRight size={11}/>
  <span className="mono">{task.key}</span>
</div>
```

**Diffs (per D-35):**
- Render only when `task.parent_task_id` is set.
- Add parent task key + title after the project name → `Folder > projectName > ChevronRight > parentKey > parentTitle` (clickable → `/projects/{id}/tasks/{parentId}`).
- Position ABOVE the task title (per D-35 "Above the task title").
- Use `lucide-react` `Folder`, `ChevronRight` (same icon library pattern as `Frontend2/components/header.tsx`).
- Mono font for key: `fontFamily: "var(--font-mono)"` (CONTEXT established pattern).

### `Frontend2/components/task-detail/comments-section.tsx`

**Analog:** `New_Frontend/src/pages/task-detail.jsx` Activity block (lines 69-109).

**Diffs (per D-46):**
- Replace hard-coded demo comments with `useComments(taskId)` query.
- Add @mention dropdown (RESEARCH §Comments / @mention — client renders HTML, server stores HTML).
- Edit/delete own comments — no time constraint (D-46).
- Flat thread (no nesting) — loop over `comments.map(c => <CommentRow />)`, one level deep.
- Deleted comments show "Silindi" placeholder — preserves thread order.
- Sub-tabs (Yorumlar / Geçmiş) via `<Tabs size="sm">` primitive per D-47 (Worklog explicitly deferred).

### `Frontend2/components/task-detail/history-section.tsx`

**Analog:** **NEW** — audit log rendering has no existing analog in Frontend2. Follow RESEARCH §Audit Log Shape (lines 762-806) verbatim.

Key contracts:
- Endpoint: `GET /api/v1/tasks/{id}/history` — already exists, returns the flat shape (RESEARCH lines 771-784).
- Missing field: `user_name` (NOT returned by endpoint per RESEARCH line 791) — frontend resolves via cached `/users/{id}`.
- Localization helper: `Frontend2/lib/audit-formatter.ts` (NEW) — pure function `(entry, lang, users, columnMap, phaseMap) => string`; unit-testable per RESEARCH test map (line 1067).
- Rendering template: `{user_name} {field_localized} {old_localized} → {new_localized} {time}` (RESEARCH lines 798-803).

### `Frontend2/components/task-detail/attachments-section.tsx`

**Analog:** **NEW** — no existing drag-drop file area in Frontend2. Follow CONTEXT D-48 + reuse `attachment-service.ts` + standard HTML5 drop zone.

Key contracts:
- Uses existing `/api/v1/attachments` endpoints (see `Backend/app/api/v1/attachments.py` lines 33-50 for the shape).
- Drag-drop area + click-to-browse input.
- Link-reference subtype: POST with `type: "link"` + `url` + `title` fields (D-48).
- List row: filename, size, uploader avatar (via `<Avatar>` primitive), upload time, download icon (lucide `Download`), delete icon (only for uploader or PM per `useAuth().user.role`).

### `Frontend2/components/task-detail/dependencies-section.tsx`

**Analog:** `New_Frontend/src/pages/task-detail.jsx` dependencies block (lines 125-135).

**Prototype excerpt (lines 128-134):**
```jsx
<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--surface-2)", borderRadius: 4, fontSize: 12 }}>
    <Icons.Lock size={12} style={{ color: "var(--fg-subtle)" }}/>
    <span className="mono" style={{ color: "var(--fg-muted)" }}>MOBIL-8</span>
    <span style={{ color: "var(--fg-muted)" }}>engelliyor</span>
  </div>
</div>
```

**Diffs (per D-49):**
- Add "Bağımlılık ekle" button → popover with type select + task picker (reuse search input pattern from header-autocomplete).
- Types (Turkish labels): `"blocks"`/"Engelliyor"`, `"blocked_by"`/"Engellemekte", `"relates_to"`/"İlişkili"`.
- Each row includes X icon for delete (reuse `ConfirmDialog` from `Frontend2/components/projects/confirm-dialog.tsx` for removal confirmation).
- Click on task key → router.push to that task's detail page.
- Icon map: `Lock` for blocks, `LockOpen` for blocked_by, `Link` for relates_to (lucide).

---

## Frontend — MyTasks Components

### `Frontend2/components/my-tasks/my-tasks-experience.tsx`

**Analog:** `New_Frontend/src/pages/my-tasks.jsx` (full file, 656 lines) + `New_Frontend/src/pages/my-tasks-parts.jsx` (458 lines).

**Port verbatim per D-32.** Decompose per the D-32 list:
- Saved-views tabs → `saved-views-tabs.tsx` (prototype lines 40-47 define `MT_VIEWS`).
- Filter bar (search + priority/project/assignee) → `task-filter-bar.tsx`.
- Group-by renderer (project/status/priority/due/none) → `task-group-list.tsx`.
- Row (compact + rich shared) → `task-row.tsx`.
- Sort logic → `lib/my-tasks/smart-sort.ts` (pure, unit-testable).
- Due-bucket logic → `lib/my-tasks/due-bucket.ts` (pure).
- Store hook → `use-my-tasks-store.ts` (see above).

**Props API per D-33:** `<MyTasksExperience compact={false} defaultView="all" hideRightRail={false} hideHeader={false} hideQuickAdd={false} />` — all optional.

**Diffs from prototype:**
- Replace `window.SPMSData.TASKS.filter(...)` with `useMyTasks()` from `use-tasks.ts`.
- Replace `window.SPMSData.CURRENT_USER` with `useAuth().user`.
- Replace raw `localStorage` with the `use-my-tasks-store` hook.
- Replace raw `Icons.*` with `lucide-react` imports.
- Row click → `router.push(\`/projects/${task.projectId}/tasks/${task.id}\`)`.

### `Frontend2/components/my-tasks/saved-views-tabs.tsx`

**Analog:** `Frontend2/components/primitives/tabs.tsx` — use `<Tabs size="sm">` directly with the 6 views from prototype `MT_VIEWS` (line 40-47).

**Diffs:** add icons column per view (lucide icons for Flame, Alert, Calendar, Star, CheckSquare, CircleCheck); badges show counts from filtered task counts.

### `Frontend2/components/my-tasks/task-filter-bar.tsx`

**Analog:** `Frontend2/app/(shell)/projects/page.tsx` (lines 54-66) — the filter + search row.

**Excerpt:**
```tsx
<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <SegmentedControl options={segments} value={statusFilter} onChange={setStatusFilter} />
  <Input placeholder={...} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: 220 }} />
</div>
```

**Diffs:**
- Swap status segment for priority multi-select chips (CONTEXT §specifics, D-15 analogous pattern).
- Add project multi-select chips (fed from `useProjects()`).
- Add assignee avatar multi-select — defaults to current user.

---

## Frontend — Header Components

### `Frontend2/components/header/create-button.tsx`

**Analog:** `Frontend2/components/header.tsx` (lines 102-109) Create button block.

**Current excerpt:**
```tsx
<Button
  variant="primary"
  size="sm"
  icon={<Plus size={14} />}
  onClick={onCreateProject}
>
  {lang === "tr" ? "Yeni proje" : "New project"}
</Button>
```

**Diffs per D-07 (header rewire inversion):**
- Change label: `{lang === "tr" ? "Oluştur" : "Create"}` (task-first, not "Yeni proje").
- Change onClick: remove `onCreateProject` prop; instead call `useTaskModal().openTaskModal()`.
- Project creation moves to `/projects` list page (per D-08 — see `projects/page.tsx` MODIFIED block below).

### `Frontend2/components/header/search-autocomplete.tsx`

**Analog:** `Frontend2/components/header.tsx` Input line (lines 93-99) — just the visual shell.

**Current excerpt:**
```tsx
<Input
  icon={<Search size={14} />}
  placeholder={t("common.search", lang)}
  kbdHint="⌘K"
  size="sm"
  style={{ width: 260 }}
/>
```

**Diffs per D-50:**
- Add `useState` for query string; 250ms debounce.
- On focus or Cmd/Ctrl+K: open dropdown (absolute-positioned div below Input).
- Parallel calls: `useTaskSearch(q)` + `useProjects(undefined)` filtered by `p.name.includes(q) || p.key.includes(q)`.
- Results: Projects (top 3), Tasks (top 7), "Tümünü gör" link at bottom.
- Keyboard: arrow keys navigate results, Enter selects, Esc closes.
- Shortcut: `useEffect` with `document.addEventListener("keydown", ...)` for Cmd/Ctrl+K (matches pattern in prototype `create-task-modal.jsx` lines 29-39).

---

## Frontend — NEW patterns (no analog)

### Custom SVG Gantt — `timeline-tab.tsx` — NEW, no analog

**Follow RESEARCH §Gantt Library Selection > POC Snippet (lines 88-237) verbatim.** The ~100-line POC is the starting point. Extensions allowed per plan judgment (zoom, drag-to-reschedule) but documented as stretch.

No library install. All styling uses CSS custom properties inline (`fill: "var(--priority-high)"`). Day/Week/Month view toggle is `React.useState`.

### @dnd-kit DnDProvider — `lib/dnd/dnd-provider.tsx` — NEW

**Follow RESEARCH §@dnd-kit Drag-Drop Patterns > Cross-Container Drag Pattern (lines 241-341) + Code Examples > Cross-Container DnD Provider (lines 1326-1373) verbatim.** 

Install: `npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/modifiers@9.0.0 @dnd-kit/utilities@3.2.2`.

Mount point: `ProjectDetailShell` (NOT shell layout — per RESEARCH line 271 rationale).

### TipTap DescriptionEditor — NEW

**Follow RESEARCH §TipTap Rich Editor (lines 342-511) verbatim.** See also §Common Pitfalls 2 (SSR hydration) and Pitfall 9 (Image extension separate install).

Install: `npm install @tiptap/react@3.22.4 @tiptap/starter-kit@3.22.4 @tiptap/extension-image@3.22.4`.

### TanStack Table ListTab — NEW

**Follow RESEARCH §TanStack Table v8 (lines 512-670) verbatim.** Headless — all styling via inline tokens; no theme system to fight.

Install: `npm install @tanstack/react-table@8.21.3`.

Shared search query between Board toolbar + List tab: use a project-detail-level context (RESEARCH lines 640-670 pattern).

### Custom Calendar — `calendar-view.tsx` — NEW

**No existing codebase analog.** Follow CONTEXT D-29 through D-31: 7-col × 6-row grid, today highlight, task chips with priority color, scroll-zoom via `wheel`+`ctrlKey` (RESEARCH Pitfall 5 for debounce), localStorage key `spms.calendar.zoom.{projectId}`. Up to 3 visible chips per day; "+N more" opens day popover. 150-200 lines target per D-29.

---

## Backend — Clean Architecture Slice (labels)

**Core insight:** Copy the **board-columns** slice shape 1:1. That slice is the most recent and most complete Phase 9 analog, and its shape matches the labels slice exactly (entity + repo + SqlAlchemy impl + use case + DTO + router + DI file + main.py include). The planner MUST NOT invent structure — copy from board_columns.

### Domain: Label entity

**Target:** `Backend/app/domain/entities/label.py` — **ALREADY EXISTS** (10 lines). Needs extension per RESEARCH lines 824-834.

**Current (Backend/app/domain/entities/label.py lines 1-11):**
```python
from pydantic import BaseModel, ConfigDict
from typing import Optional

class Label(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)
```

**Analog for any extensions:** `Backend/app/domain/entities/project.py` (line 85-132 for the entity) — but simpler: the label entity doesn't need `model_validator(mode="before")`. Just add optional `usage_count: int = 0` denormalized field per RESEARCH line 832.

**Diff required:**
```python
usage_count: Optional[int] = 0  # Denormalized for list endpoint; populated by repository
```

### Domain: ILabelRepository interface

**Analog:** `Backend/app/domain/repositories/board_column_repository.py` (full file, 32 lines).

**Full excerpt:**
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.board_column import BoardColumn


class IBoardColumnRepository(ABC):
    @abstractmethod
    async def get_by_project(self, project_id: int) -> List[BoardColumn]:
        """Return columns for the project ordered by order_index ASC."""
        ...

    @abstractmethod
    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        ...

    @abstractmethod
    async def create(self, column: BoardColumn) -> BoardColumn:
        ...

    @abstractmethod
    async def update(self, column: BoardColumn) -> BoardColumn:
        ...

    @abstractmethod
    async def delete(self, column_id: int) -> None:
        ...

    @abstractmethod
    async def count_tasks(self, column_id: int) -> int:
        ...
```

**Diffs for labels:**
- Rename `IBoardColumnRepository` → `ILabelRepository`; `BoardColumn` → `Label`.
- Methods per RESEARCH lines 841-849:
  - `list_by_project(project_id) -> List[Label]`
  - `get_by_name_in_project(project_id, name) -> Optional[Label]` (new semantic, uniqueness check)
  - `create(project_id, name, color) -> Label`
- No `update` / `delete` / `count_tasks` needed for Phase 11 (not in scope per CONTEXT deferred list).

### Infrastructure: SqlAlchemyLabelRepository

**Analog:** `Backend/app/infrastructure/database/repositories/board_column_repo.py` (full file, 96 lines).

**Excerpt (lines 1-51):**
```python
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.task import TaskModel


class SqlAlchemyBoardColumnRepository(IBoardColumnRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: BoardColumnModel) -> BoardColumn:
        return BoardColumn.model_validate(model)

    async def get_by_project(self, project_id: int) -> List[BoardColumn]:
        stmt = (
            select(BoardColumnModel)
            .where(BoardColumnModel.project_id == project_id)
            .order_by(BoardColumnModel.order_index.asc())
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == column_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def create(self, column: BoardColumn) -> BoardColumn:
        model = BoardColumnModel(
            project_id=column.project_id,
            name=column.name,
            order_index=column.order_index,
            wip_limit=column.wip_limit,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch to get all columns populated
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)
```

**Diffs for labels:**
- Swap `BoardColumnModel` → `LabelModel` (already at `Backend/app/infrastructure/database/models/label.py` line 14).
- Rename methods per the interface.
- `list_by_project` JOINs `task_labels` association (import from `app.infrastructure.database.models.label`) to compute `usage_count` via subquery — see RESEARCH lines 869-890 for the full SQL.
- `get_by_name_in_project`: `where(LabelModel.project_id == project_id, LabelModel.name == name)` — RESEARCH lines 892-896.
- `create`: same pattern as board-column `create` (add → flush → commit → re-fetch). Follow RESEARCH lines 898-903.

### Application: Use cases (List + Create)

**Analog:** `Backend/app/application/use_cases/manage_board_columns.py` (140 lines).

**Excerpt (lines 1-34):**
```python
"""Board column management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import List

from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.application.dtos.board_column_dtos import (
    BoardColumnDTO,
    CreateColumnDTO,
    UpdateColumnDTO,
)


def _to_dto(column: BoardColumn, task_count: int = 0) -> BoardColumnDTO:
    return BoardColumnDTO(
        id=column.id,
        project_id=column.project_id,
        name=column.name,
        order_index=column.order_index,
        wip_limit=column.wip_limit,
        task_count=task_count,
    )


class ListColumnsUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int) -> List[BoardColumnDTO]:
        columns = await self.column_repo.get_by_project(project_id)
        result = []
        for col in columns:
            count = await self.column_repo.count_tasks(col.id)
            result.append(_to_dto(col, count))
        return result
```

**Diffs for labels (new file `manage_labels.py`):**
- Rename module comment to "Label management use cases".
- Import `ILabelRepository`, `Label`, `LabelResponseDTO`, `LabelCreateDTO` from the label equivalents.
- Import `LabelNameAlreadyExistsError` from `app.domain.exceptions` (new — see exceptions diff below).
- `ListProjectLabelsUseCase.execute(project_id)` → returns `list[LabelResponseDTO]` from `repo.list_by_project(...)`.
- `CreateLabelUseCase.execute(dto)` → uniqueness check first, then create — see RESEARCH lines 935-945 for full logic:
  ```python
  existing = await self.repo.get_by_name_in_project(dto.project_id, dto.name)
  if existing is not None:
      raise LabelNameAlreadyExistsError(...)
  color = dto.color or "#94a3b8"
  return await self.repo.create(dto.project_id, dto.name, color)
  ```
- **DIP rule (CLAUDE.md §4.2):** do NOT import `from app.infrastructure.*` inside the use case. Already compliant in the analog (verify no `DeleteColumnUseCase`-style SQLAlchemy escape hatches for labels — the labels use case is pure domain).

### Application: DTOs

**Analog:** `Backend/app/application/dtos/board_column_dtos.py` (full file, 27 lines).

**Full excerpt:**
```python
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class BoardColumnDTO(BaseModel):
    id: int
    project_id: int
    name: str
    order_index: int
    wip_limit: int = 0
    task_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class CreateColumnDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order_index: int = Field(ge=0)


class UpdateColumnDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    order_index: Optional[int] = Field(None, ge=0)
```

**Diffs for labels (new file `label_dtos.py`, per RESEARCH lines 908-922):**
```python
class LabelCreateDTO(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=50)
    color: Optional[str] = None  # null → auto-derive from name hash (fallback "#94a3b8")


class LabelResponseDTO(BaseModel):
    id: int
    project_id: int
    name: str
    color: str
    usage_count: int
    model_config = ConfigDict(from_attributes=True)
```

No Update DTO needed in Phase 11 (no PATCH /labels endpoint per CONTEXT).

### API: labels router

**Analog:** `Backend/app/api/v1/board_columns.py` (full file, 130 lines).

**Excerpt (lines 1-39 — imports + first endpoint):**
```python
"""Board column CRUD router — /api/v1/projects/{project_id}/columns"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_project_member,
    get_current_user,
    get_project_repo,
    get_board_column_repo,
    _is_admin,
)
from app.application.dtos.board_column_dtos import (
    BoardColumnDTO,
    CreateColumnDTO,
    UpdateColumnDTO,
)
from app.application.use_cases.manage_board_columns import (
    ListColumnsUseCase,
    CreateColumnUseCase,
    UpdateColumnUseCase,
    DeleteColumnUseCase,
)
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.entities.user import User

router = APIRouter()


@router.get("/{project_id}/columns", response_model=List[BoardColumnDTO])
async def list_columns(
    project_id: int,
    current_user: User = Depends(get_project_member),
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
):
    """Return all board columns for a project ordered by order_index."""
    use_case = ListColumnsUseCase(column_repo)
    return await use_case.execute(project_id)
```

**Diffs for `Backend/app/api/v1/labels.py` (new file):**
- Swap all `BoardColumn*` → `Label*`, `column_repo` → `label_repo`, `ListColumnsUseCase` → `ListProjectLabelsUseCase`, etc.
- Import `get_label_repo` from `app.api.dependencies` (after you add the re-export line).
- **Route paths per CONTEXT D-51 / RESEARCH lines 961-981:**
  - `GET /projects/{project_id}/labels` — under the projects resource. Use `Depends(get_project_member)` for membership check (same pattern as list_columns).
  - `POST /labels` — under the labels resource with `dto.project_id` in body. Use `Depends(get_current_user)` + membership check on `dto.project_id` inside handler.
- **Exception mapping:** catch `LabelNameAlreadyExistsError` → HTTP 409 (RESEARCH lines 979-981). Follow the same pattern as `update_column` catching `ValueError` → 404 (analog lines 96-97).
- Router registration prefix: `/api/v1` (per RESEARCH line 1001). DO NOT double-prefix with `/labels` because the router itself mounts both `/projects/{project_id}/labels` and `/labels` routes under one APIRouter.

### API: dependencies wiring

**Analog:** `Backend/app/api/deps/board_column.py` (full file, 18 lines).

**Full excerpt:**
```python
"""Board column repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.infrastructure.database.repositories.board_column_repo import SqlAlchemyBoardColumnRepository


def get_board_column_repo(session: AsyncSession = Depends(get_db_session)) -> IBoardColumnRepository:
    return SqlAlchemyBoardColumnRepository(session)


__all__ = ["get_board_column_repo"]
```

**Diffs for `Backend/app/api/deps/label.py` (new file):**
- Swap all `BoardColumn`/`board_column` → `Label`/`label`.
- Keep the docstring format, keep `__all__` export.
- `get_label_repo(session: AsyncSession = Depends(get_db_session)) -> ILabelRepository`.

### Domain: exceptions

**Analog:** `Backend/app/domain/exceptions.py` (lines 44-50 — existing simple DomainError subclasses).

**Excerpt:**
```python
class CommentNotFoundError(DomainError):
    def __init__(self, comment_id: int):
        super().__init__(f"Comment with id {comment_id} not found")

class AttachmentNotFoundError(DomainError):
    def __init__(self, file_id: int):
        super().__init__(f"Attachment with id {file_id} not found")
```

**Diff — add after the existing exceptions:**
```python
class LabelNameAlreadyExistsError(DomainError):
    def __init__(self, project_id: int, name: str):
        self.project_id = project_id
        self.name = name
        super().__init__(f"Label '{name}' already exists in project {project_id}")
```

Use from `manage_labels.py` use case per RESEARCH line 942.

---

## Modified Files (call-out blocks)

### `Frontend2/app/layout.tsx` — add TaskModalProvider? NO

Current relevant block (lines 94-98):
```tsx
<body className={`${geist.variable} ${geistMono.variable}`}>
  <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>
</body>
```

**Per RESEARCH §Provider Tree Ordering (lines 701-741): DO NOT add TaskModalProvider at root layout.** It must be at the shell layout because it needs `useQueryClient`, `useToast`, and `useAuth`, and it MUST NOT exist in auth-free routes like `/login`.

**NO CHANGES to `Frontend2/app/layout.tsx` required for Phase 11** (unless the planner chooses to extend `AppProvider` with a new piece — unlikely).

### `Frontend2/app/(shell)/layout.tsx` — add TaskModalProvider + (maybe) DnDProvider

Current relevant block (lines 15-26):
```tsx
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

**Insert TaskModalProvider between `ToastProvider` and `AppShell`** (per RESEARCH lines 728-741):
```tsx
<QueryClientProvider client={queryClient}>
  <ToastProvider>
    <TaskModalProvider>   {/* NEW — sibling of ToastProvider inside AppShell */}
      <AppShell>{children}</AppShell>
    </TaskModalProvider>
  </ToastProvider>
  ...
```

**DnDProvider: NOT here.** Mount at `ProjectDetailShell` instead (per RESEARCH lines 269-278 rationale — drag state is scoped to a project).

### `Frontend2/app/(shell)/projects/[id]/page.tsx` — replace placeholder Card

Current relevant block (lines 65-99):
```tsx
{/* Phase 11 placeholder — full Board/List/Timeline tabs will replace this */}
<Card padding={40}>
  <div style={{ textAlign: "center", ... }}>
    <div>Proje Detay Görünümü</div>
    <div>Board, Liste, Zaman Çizelgesi ve diğer sekmeler Phase 11'de eklenecek.</div>
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <Button variant="ghost" size="sm" disabled={isArchived}>Görev Ekle</Button>
      <Button variant="ghost" size="sm" disabled={isArchived}>Üye Ekle</Button>
    </div>
  </div>
</Card>
```

**Replacement:**
```tsx
<ProjectDetailShell project={project} isArchived={isArchived} />
```

Keep:
- `ArchiveBanner` block (lines 41-44).
- Page header block (lines 47-64) — but consider moving parts of it into `ProjectDetailShell` to match prototype layout.
- Loading + not-found guards (lines 16-32).

Page is already `"use client"` with `useParams()` — per RESEARCH §Pitfall 1 this is the correct pattern; no async params refactor needed.

### `Frontend2/app/(shell)/my-tasks/page.tsx` — mount MyTasksExperience

Current full file (12 lines — all stub):
```tsx
export default function MyTasksPage() {
  return (
    <div>
      <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>
        My Tasks
      </h1>
      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 8 }}>
        My Tasks page will be implemented in Phase 11.
      </p>
    </div>
  )
}
```

**Replacement (per D-33):**
```tsx
"use client"
import { MyTasksExperience } from "@/components/my-tasks/my-tasks-experience"

export default function MyTasksPage() {
  return <MyTasksExperience />
}
```

All defaults (full-featured, no compact). Component picks them up from its default props.

### `Frontend2/app/(shell)/projects/page.tsx` — add role-gated "Yeni Proje" button

Current relevant block (lines 66-70):
```tsx
<Link href="/projects/new">
  <Button variant="primary">
    {language === 'tr' ? 'Yeni proje' : 'New project'}
  </Button>
</Link>
```

**Diff per D-08:** Wrap with role check from `useAuth()`:
```tsx
import { useAuth } from "@/context/auth-context"

const { user } = useAuth()
const canCreateProject = user?.role.name === "Admin" || user?.role.name === "Project Manager"

{canCreateProject && (
  <Link href="/projects/new">
    <Button variant="primary">
      {language === 'tr' ? 'Yeni proje' : 'New project'}
    </Button>
  </Link>
)}
```

Use `user.role.name` — the AuthUser type has `role: { name: string }` per `Frontend2/services/auth-service.ts` lines 14-18.

**Note:** The exact role strings ("Admin", "Project Manager") must match the backend's role values. Cross-reference with how `ProjectCard.tsx` (line 100-117) reads `user` role in the error-toast permission message; it implies the backend returns `{ name: 'admin' | 'project_manager' | ... }` — the planner should verify case and adjust accordingly.

### `Frontend2/components/header.tsx` — rewire Create button + add search autocomplete

Current relevant block (lines 93-109):
```tsx
<Input
  icon={<Search size={14} />}
  placeholder={t("common.search", lang)}
  kbdHint="⌘K"
  size="sm"
  style={{ width: 260 }}
/>

{/* Create project button — wired to /projects/new (deferred from Phase 8, D-08-04) */}
<Button
  variant="primary"
  size="sm"
  icon={<Plus size={14} />}
  onClick={onCreateProject}
>
  {lang === "tr" ? "Yeni proje" : "New project"}
</Button>
```

**Diffs per D-07, D-50:**
- Replace `<Input>` block with `<SearchAutocomplete />` from the new `components/header/search-autocomplete.tsx`. The autocomplete wraps the Input internally and owns the dropdown + Cmd/Ctrl+K shortcut.
- Replace `<Button>` Create block with `<CreateButton />` from the new `components/header/create-button.tsx`. The new button calls `useTaskModal().openTaskModal()` with no args (user picks project in modal).
- **Remove `onCreateProject` prop** from `HeaderProps` interface — the prop is dead after the rewire. Also remove from `AppShell`'s `<Header onCreateProject={...}>` prop at `Frontend2/components/app-shell.tsx` line 84.
- Label changes: `"Yeni proje" → "Oluştur"` / `"New project" → "Create"`.

### `Backend/app/api/dependencies.py` — add re-export

Current relevant block (lines 27):
```python
from app.api.deps.board_column import get_board_column_repo  # noqa: F401
```

**Diff — add a similar line after it:**
```python
from app.api.deps.label import get_label_repo  # noqa: F401
```

### `Backend/app/api/main.py` — include labels router

Current relevant block (lines 145):
```python
app.include_router(board_columns_router, prefix="/api/v1/projects", tags=["Board Columns"])
```

**Diff — add labels router import + registration. The labels router has BOTH `/projects/{project_id}/labels` and `/labels` endpoints, so the prefix must be just `/api/v1` (NOT `/api/v1/labels` — that would double-prefix).**

After line 20 (imports):
```python
from app.api.v1 import labels
```

After line 145 (or at the end of the router block):
```python
app.include_router(labels.router, prefix="/api/v1", tags=["Labels"])
```

### BACK-03 Process Config Normalizer update

CONTEXT D-40 says the default `process_config` blob extends to `{ schema_version: 1, workflow: {...}, enable_phase_assignment: false, backlog_definition: "cycle_null", cycle_label: null }` on read.

**Analog:** `Backend/app/domain/entities/project.py` lines 29-43 (`_migrate_v0_to_v1`) — the existing Phase 9 normalizer.

**Excerpt (lines 29-43):**
```python
def _migrate_v0_to_v1(config: dict) -> dict:
    """Legacy V0 (no schema_version, may have methodology at top level) -> V1 canonical (D-33)."""
    new = dict(config)
    if "methodology" in new and "methodology_legacy" not in new:
        new["methodology_legacy"] = new.pop("methodology")
    new.setdefault("workflow", {"mode": "flexible", "nodes": [], "edges": [], "groups": []})
    new.setdefault("phase_completion_criteria", {})
    new.setdefault("enable_phase_assignment", False)
    new.setdefault("enforce_sequential_dependencies", False)
    new.setdefault("enforce_wip_limits", False)
    new.setdefault("restrict_expired_sprints", False)
    new["schema_version"] = 1
    return new
```

**Diff per D-40:** Add two more `setdefault` calls in `_migrate_v0_to_v1`:
```python
new.setdefault("backlog_definition", "cycle_null")  # Phase 11 D-17
new.setdefault("cycle_label", None)                  # Phase 11 D-43
```

**Rationale:** `enable_phase_assignment: false` is already present (line 38 of project.py). The Phase 11 BACK-03 additions are only `backlog_definition` and `cycle_label`. Because the normalizer is pure and idempotent (RESEARCH line A8), adding these fields is a no-op for already-migrated projects.

No schema-version bump needed — these are additive, and `setdefault` semantics ensure existing projects with explicit values are unchanged.

---

## Primitives Reuse Map

| Primitive | File | Phase 11 Usage |
|-----------|------|----------------|
| **AlertBanner** | `Frontend2/components/primitives/alert-banner.tsx` | "Coming soon" stubs for Activity + Lifecycle tabs (D-10), WIP violation banner in board column (D-20), archive banner reuse (already wired in project detail page) |
| **SegmentedControl** | `Frontend2/components/primitives/segmented-control.tsx` | Compact/Rich board toggle (D-21), Plain/Rich description editor toggle (D-36), Backlog Tanımı picker in Settings > General (D-17), Task Type in Create Modal (task/subtask/bug per prototype lines 97-101) |
| **Collapsible** | `Frontend2/components/primitives/collapsible.tsx` | Recurring section in Task Create Modal (D-05), potential use for collapsible sub-sections in Task Detail (Dependencies, Attachments — per CONTEXT specifics) |
| **PriorityChip** | `Frontend2/components/primitives/priority-chip.tsx` | Board cards (Rich mode) (D-21), Task Create Modal priority field (D-05), Properties sidebar Priority row (D-38), MyTasks rows, List tab Priority column (D-25) |
| **StatusDot** | `Frontend2/components/primitives/status-dot.tsx` | Board cards status indicator, List tab Status column (D-25), MyTasks rows, Sub-tasks list (replaces prototype checkbox per D-37), Task Detail Properties status value |
| **Tabs** | `Frontend2/components/primitives/tabs.tsx` | 8-tab bar on Project Detail (D-09 + PAGE-03), Settings sub-tabs (General / Columns / Workflow / Lifecycle stub) (D-11), Activity sub-tabs (Yorumlar / Geçmiş) on Task Detail (D-47), MyTasks saved-views bar (D-32 — 6 views) |
| **Card** | `Frontend2/components/primitives/card.tsx` | BoardCard body, PropertiesSidebar container (prototype lines 113-135), Task Create Modal container (prototype line 69), Sub-tasks list container, each Task Detail section wrapper |
| **Badge** | `Frontend2/components/primitives/badge.tsx` | Methodology badge on project header (D-09 prototype line 20), sprint/cycle badge on board toolbar (D-22), priority/status badges inline, label chips on task detail + modal + cards, "usage_count" display on label picker |
| **Input** | `Frontend2/components/primitives/input.tsx` | Search input inside SearchAutocomplete (header), board toolbar filter input, MyTasks task-filter-bar search input, dependencies task picker, label picker search |
| **Avatar** | `Frontend2/components/primitives/avatar.tsx` | Sub-task row assignee (20px per D-37), board card assignee, MyTasks row assignee, comments author avatar, attachments uploader avatar, PropertiesSidebar Assignee + Reporter rows |
| **AvatarStack** | `Frontend2/components/primitives/avatar-stack.tsx` | Board toolbar member stack (prototype line 88), Members tab, Project header — already used in `ProjectCard.tsx` line 253 |
| **Toggle** | `Frontend2/components/primitives/toggle.tsx` | Potentially Recurring enable/disable inside Collapsible (D-05), watcher toggle button could use Toggle OR Button — planner's call per CONTEXT's discretion list |
| **Button** | `Frontend2/components/primitives/button.tsx` | Every action surface: Create button, modal submit/cancel, dependency add, label add, toolbar actions, rich-text toolbar buttons (ghost variant per RESEARCH §TipTap), Task Detail header actions |
| **Kbd** | `Frontend2/components/primitives/kbd.tsx` | Header search `⌘K` hint (already used in current `header.tsx` line 97), Task Create Modal Ctrl+Enter hint (D-06), TipTap toolbar button tooltips for keyboard shortcuts |
| **ProgressBar** | `Frontend2/components/primitives/progress-bar.tsx` | Not directly used in Phase 11 task features per CONTEXT scope; might appear in Members tab workload viz (discretion) |
| **Section** | `Frontend2/components/primitives/section.tsx` | Each Task Detail section (Description, Sub-tasks, Activity, Attachments, Dependencies) wraps in `<Section title="...">`; also each Settings sub-tab body |

**Non-primitive reuse:**
- `Frontend2/components/toast/index.tsx` `useToast` / `showToast` — all mutations surface toasts (D-03 Task create success, D-20 WIP warn, D-38 optimistic rollback, D-53 watcher toggle)
- `Frontend2/components/projects/confirm-dialog.tsx` `ConfirmDialog` — reused for dependency/label/comment delete confirmations (CONTEXT §Claude's Discretion line 193-194)
- `Frontend2/components/projects/archive-banner.tsx` `ArchiveBanner` — already wired on project detail page line 42-44; task detail page should render it too when its project is archived (D-34 continues to block edits)

---

## No Analog Found

Files with NO existing close match in the codebase. Planner **MUST** follow `11-RESEARCH.md` for these.

| File | Role | Data Flow | Reference |
|------|------|-----------|-----------|
| `Frontend2/lib/dnd/dnd-provider.tsx` | provider | event-driven | RESEARCH §@dnd-kit Drag-Drop Patterns (lines 241-341) + Code Example (lines 1326-1373) |
| `Frontend2/lib/dnd/board-dnd.ts` | utility | event-driven | RESEARCH §onDragEnd Handler (lines 282-331) |
| `Frontend2/components/task-detail/description-editor.tsx` | component | transform | RESEARCH §TipTap Rich Editor (lines 342-511) |
| `Frontend2/components/task-detail/description-editor-rich.tsx` | component | transform | RESEARCH §TipTap Rich Editor (lines 400-449, 464-501) |
| `Frontend2/components/project-detail/timeline-tab.tsx` | component | transform (SVG) | RESEARCH §Gantt > POC (lines 88-237) |
| `Frontend2/components/project-detail/calendar-view.tsx` | component | transform | CONTEXT D-29/D-30/D-31 (no analog — spec-only) |
| `Frontend2/components/project-detail/list-tab.tsx` | component | transform | RESEARCH §TanStack Table v8 (lines 512-670) |
| `Frontend2/components/task-detail/inline-edit.tsx` | component | CRUD (optimistic) | RESEARCH §Optimistic Inline Edit Pattern (lines 1378-1456) |
| `Frontend2/components/task-detail/history-section.tsx` | component | request-response | RESEARCH §Audit Log Shape (lines 762-806) |
| `Frontend2/components/task-detail/attachments-section.tsx` | component | file-I/O | CONTEXT D-48 (no analog — reuse existing backend `/attachments` router) |
| `Frontend2/components/project-detail/backlog-panel.tsx` | component | event-driven | CONTEXT D-13/D-15 (no analog — fixed column + DnD) |
| `Frontend2/components/header/search-autocomplete.tsx` | component | request-response | CONTEXT D-50 + RESEARCH Open Question #6 |
| `Frontend2/lib/audit-formatter.ts` | utility | transform | RESEARCH §Audit Log > Field Name Resolution (lines 793-806) |
| `Frontend2/lib/label-color.ts` | utility | transform | CONTEXT §specifics — hash → oklch hue algorithm |
| `Frontend2/lib/my-tasks/smart-sort.ts` | utility | transform | Port from prototype `my-tasks.jsx` sort logic |
| `Frontend2/lib/my-tasks/due-bucket.ts` | utility | transform | Port from prototype `my-tasks.jsx` bucketing (prototype line 41-46 references `mtDueBucket`) |
| `Frontend2/lib/methodology-matrix.ts` | utility | transform | CONTEXT D-16 Matrix + D-42 Cycle Label Matrix (single source of truth) |
| `Frontend2/hooks/use-my-tasks-store.ts` | hook | event-driven (localStorage) | Prototype `my-tasks.jsx` lines 7-26 + `app-context.tsx` load/save pattern (lines 69-86) |

---

## Metadata

**Analog search scope:** `Frontend2/` (services, hooks, context, components, app, lib) + `Backend/app/` (domain, application, infrastructure/database/repositories, api/v1, api/deps) + `New_Frontend/src/pages/` (for prototype ports).

**Files scanned:** ~180 (all Frontend2 TypeScript, all Backend Python Clean Arch layers, targeted prototype JSX).

**Pattern extraction date:** 2026-04-22.

**Confidence:** HIGH on all backend analogs (board-columns → labels is an exact 1:1 structural mirror). HIGH on all frontend service/hook/context analogs (project-service → task-service is a direct name-swap). HIGH on prototype-port files (prototype JSX is the design authority; ports are mechanical under the "no SPMSData / use hooks" and "no window.Icons / use lucide" rules). MEDIUM on Phase 11 **new-pattern** files (DnD, TipTap, Gantt, Calendar, InlineEdit, BacklogPanel, SearchAutocomplete) — these rely on RESEARCH.md as the authority; the planner must quote those sections in plan action text.

## PATTERN MAPPING COMPLETE
