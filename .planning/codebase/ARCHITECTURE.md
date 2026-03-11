# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Full-stack monorepo with Clean Architecture (Hexagonal/Ports & Adapters) on the backend, and a component-based SPA on the frontend.

**Key Characteristics:**
- Backend (`Backend/`) is a Python FastAPI service following strict Clean Architecture layers: Domain, Application, Infrastructure, and API
- Frontend (`Frontend/`) is a Next.js 14 App Router SPA that communicates with the backend REST API over HTTP
- No shared code or types between Backend and Frontend — each maintains its own type definitions
- Backend uses dependency injection via FastAPI `Depends()` to wire interfaces to concrete implementations
- Frontend uses TanStack Query for server state caching and React Context for auth state

## Layers

**Backend — Domain Layer:**
- Purpose: Core business logic and rules, completely independent of frameworks or databases
- Location: `Backend/app/domain/`
- Contains: Pydantic entity models (`entities/`), abstract repository interfaces (`repositories/`), domain exceptions (`exceptions.py`)
- Depends on: Nothing external (pure Python)
- Used by: Application layer (use cases), Infrastructure layer (repository implementations)

**Backend — Application Layer:**
- Purpose: Orchestrates use cases by coordinating domain entities and repository calls; transforms data via DTOs
- Location: `Backend/app/application/`
- Contains: Use case classes (`use_cases/`), Data Transfer Objects (`dtos/`), abstract port interfaces (`ports/`)
- Depends on: Domain layer only (interfaces, entities)
- Used by: API layer (routers inject and call use cases)

**Backend — Infrastructure Layer:**
- Purpose: Concrete implementations of domain interfaces (database access, security)
- Location: `Backend/app/infrastructure/`
- Contains: SQLAlchemy async models (`database/models/`), SQLAlchemy repository implementations (`database/repositories/`), security adapter (`adapters/security_adapter.py`), database session management (`database/database.py`), settings (`config.py`)
- Depends on: Domain layer (implements interfaces), SQLAlchemy, asyncpg, jose
- Used by: API layer via dependency injection

**Backend — API Layer:**
- Purpose: HTTP request/response handling; wires dependencies and delegates to use cases
- Location: `Backend/app/api/`
- Contains: FastAPI routers (`v1/auth.py`, `v1/projects.py`, `v1/tasks.py`), dependency injection container (`dependencies.py`), application entry point (`main.py`)
- Depends on: Application layer (use cases, DTOs), Infrastructure layer (repository implementations wired in `dependencies.py`)
- Used by: External HTTP clients (the Frontend)

**Frontend — Services Layer:**
- Purpose: HTTP communication with the backend API; maps raw API responses to frontend types
- Location: `Frontend/services/`
- Contains: `auth-service.ts`, `project-service.ts`, `task-service.ts`, `user-service.ts`
- Depends on: `lib/api-client.ts` (Axios instance), `lib/types.ts`
- Used by: React hooks and page components

**Frontend — Hooks Layer:**
- Purpose: TanStack Query wrappers that expose server state with caching and invalidation
- Location: `Frontend/hooks/`
- Contains: `use-projects.ts`, `use-toast.ts`, `use-mobile.ts`, `useLocalStorageState.ts`
- Depends on: Services layer
- Used by: Page components

**Frontend — Components Layer:**
- Purpose: Reusable UI components and page-level layout
- Location: `Frontend/components/`
- Contains: `ui/` (shadcn/ui primitives), `dashboard/`, `project/`, `task-detail/`, `providers/`, `app-shell.tsx`, `auth-guard.tsx`, `sidebar.tsx`, `header.tsx`
- Depends on: Hooks, context, lib/types
- Used by: App Router pages

**Frontend — Pages (App Router):**
- Purpose: Route-bound page components; entry points for each URL segment
- Location: `Frontend/app/`
- Contains: `layout.tsx`, `page.tsx` (dashboard), `login/`, `projects/`, `tasks/[id]/`, `my-tasks/`, `reports/`, `settings/`
- Depends on: Components, hooks, services
- Used by: Next.js router

## Data Flow

**API Request Flow (Backend):**

1. HTTP request arrives at FastAPI router in `Backend/app/api/v1/`
2. `Depends()` in the route handler resolves concrete implementations from `Backend/app/api/dependencies.py`
3. Router instantiates the appropriate Use Case class, injecting repositories and services
4. Use Case validates business rules using domain entities and repository interfaces
5. Repository implementation (`Backend/app/infrastructure/database/repositories/`) executes async SQLAlchemy query with eager-loaded relationships
6. Repository's `_to_entity()` method manually maps SQLAlchemy models to domain entity (Pydantic) objects
7. Use Case maps entity to a DTO via `map_task_to_response_dto()` or equivalent mapper function
8. FastAPI serializes the DTO as JSON response

**Frontend Data Flow:**

1. Page component (e.g., `Frontend/app/projects/page.tsx`) calls a TanStack Query hook (e.g., `useProjects()` in `Frontend/hooks/use-projects.ts`)
2. Hook delegates to a service function (e.g., `projectService.getAll` in `Frontend/services/project-service.ts`)
3. Service calls `apiClient.get(...)` from `Frontend/lib/api-client.ts` (Axios instance with JWT Bearer interceptor)
4. Service's mapper function transforms snake_case API response to camelCase frontend type (`Project`, `Task`, etc. from `Frontend/lib/types.ts`)
5. TanStack Query caches the result; component re-renders with data

**Authentication Flow:**

1. User submits login form → `POST /api/v1/auth/login` via `authService`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in `localStorage` under key from `AUTH_TOKEN_KEY` constant
4. `AuthProvider` in `Frontend/context/auth-context.tsx` manages user state globally
5. `AuthGuard` component (`Frontend/components/auth-guard.tsx`) in `AppShell` redirects unauthenticated users to `/login`
6. `apiClient` request interceptor reads token from `localStorage` and attaches `Authorization: Bearer <token>` header
7. Response interceptor removes token and redirects to `/login` on 401 responses

**State Management:**

- Server state: TanStack Query (via React Query) with query keys per resource
- Auth state: React Context (`AuthContext`) backed by `localStorage`
- UI state: Local React `useState` within components (modals, tab selection, sidebar collapsed)
- No global client state store (Redux/Zustand) — TanStack Query handles all async state

## Key Abstractions

**Repository Interface (Backend):**
- Purpose: Decouple use cases from database implementation; allows swapping storage without changing business logic
- Examples: `Backend/app/domain/repositories/task_repository.py` (`ITaskRepository`), `Backend/app/domain/repositories/project_repository.py`, `Backend/app/domain/repositories/user_repository.py`
- Pattern: Abstract Base Class with `@abstractmethod` async methods; concrete implementation in `Backend/app/infrastructure/database/repositories/`

**Port Interface (Backend):**
- Purpose: Decouple use cases from security implementation
- Examples: `Backend/app/application/ports/security_port.py` (`ISecurityService`)
- Pattern: ABC; concrete adapter in `Backend/app/infrastructure/adapters/security_adapter.py`

**Domain Entity (Backend):**
- Purpose: Represents core business objects with validation; framework-independent
- Examples: `Backend/app/domain/entities/task.py` (`Task`), `Backend/app/domain/entities/project.py` (`Project`), `Backend/app/domain/entities/user.py` (`User`)
- Pattern: Pydantic `BaseModel` with `ConfigDict(from_attributes=True)` to allow ORM mapping

**Use Case Class (Backend):**
- Purpose: Encapsulates a single business operation; one class per action
- Examples: `CreateTaskUseCase`, `UpdateTaskUseCase`, `LoginUserUseCase` in `Backend/app/application/use_cases/`
- Pattern: Each class has `__init__(self, repo, ...)` and async `execute(dto) -> ResponseDTO` method

**Service Module (Frontend):**
- Purpose: Thin HTTP client wrapper that maps API responses to frontend types
- Examples: `Frontend/services/project-service.ts`, `Frontend/services/task-service.ts`
- Pattern: Exported object literal with async methods; private mapper function handles snake_case → camelCase conversion

**AppShell Component (Frontend):**
- Purpose: Shared layout wrapper for all authenticated pages (sidebar + header + auth guard)
- Location: `Frontend/components/app-shell.tsx`
- Pattern: Wraps `AuthGuard` → renders `Sidebar`, `Header`, and `{children}` in a flex layout

## Entry Points

**Backend Application:**
- Location: `Backend/app/api/main.py`
- Triggers: `uvicorn app.api.main:app` (run from `Backend/` directory)
- Responsibilities: Creates FastAPI app, registers CORS middleware, mounts routers at `/api/v1/auth`, `/api/v1/projects`, `/api/v1/tasks`, seeds database on startup via lifespan handler

**Frontend Application:**
- Location: `Frontend/app/layout.tsx`
- Triggers: `next dev` or `next start`
- Responsibilities: Wraps all pages in `QueryProvider` (TanStack Query) and `AuthProvider` (auth context); loads Google Fonts; includes Vercel Analytics

**Frontend Dashboard:**
- Location: `Frontend/app/page.tsx`
- Triggers: Route `/`
- Responsibilities: Fetches current user; renders `ManagerView` or `MemberView` based on role

## Error Handling

**Strategy (Backend):** Domain exceptions bubble up from use cases; routers catch specific domain exceptions and convert to HTTP exceptions

**Patterns:**
- Domain exceptions defined in `Backend/app/domain/exceptions.py` (e.g., `TaskNotFoundError`, `ProjectNotFoundError`, `UserAlreadyExistsError`, `InvalidCredentialsError`)
- Router `try/except` blocks catch domain exceptions and raise `HTTPException` with appropriate status codes (404, 400, 401)
- Unhandled exceptions propagate to FastAPI's default error handler

**Strategy (Frontend):** TanStack Query surfaces errors via `isError` / `error` state; API client interceptors handle 401 globally

**Patterns:**
- `apiClient` response interceptor redirects to `/login` on 401
- Page components check `isError` from `useQuery` and render error UI
- `console.error` used for debug logging; no structured error reporting service detected

## Cross-Cutting Concerns

**Logging:** `console.error` on the frontend; SQLAlchemy query logging via `echo=True` in `Backend/app/infrastructure/database/database.py` (note: should be disabled in production)

**Validation:** Pydantic validates all incoming DTOs automatically in FastAPI; frontend types are TypeScript interfaces (no runtime validation library detected)

**Authentication:** JWT Bearer tokens; backend validates via `get_current_user` dependency in `Backend/app/api/dependencies.py`; frontend enforces via `AuthGuard` component and axios interceptor

---

*Architecture analysis: 2026-03-11*
