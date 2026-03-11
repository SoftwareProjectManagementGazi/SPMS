# Coding Conventions

**Analysis Date:** 2026-03-11

## Project Structure

This is a fullstack project with two independent sub-projects:
- **Backend**: `Backend/` — Python, FastAPI, Clean Architecture
- **Frontend**: `Frontend/` — TypeScript, Next.js 15, React 19

---

## Backend Conventions (Python / FastAPI)

### Naming Patterns

**Files:**
- Modules use `snake_case`: `user_repo.py`, `manage_projects.py`, `register_user.py`
- Test files prefixed with `test_`: `test_register_user.py`, `test_auth_rbac.py`
- Config files are singular: `config.py`, `database.py`, `security.py`

**Classes:**
- Use `PascalCase`: `RegisterUserUseCase`, `SqlAlchemyUserRepository`, `ProjectCreateDTO`
- Use Case classes follow the pattern: `<Verb><Entity>UseCase` — e.g., `CreateProjectUseCase`, `DeleteProjectUseCase`
- Repository implementations prefix with ORM name: `SqlAlchemy<Entity>Repository`
- Interfaces (ABCs) prefix with `I`: `IUserRepository`, `IProjectRepository`, `ISecurityService`
- DTOs suffix with `DTO`: `ProjectCreateDTO`, `ProjectResponseDTO`, `UserRegisterDTO`
- ORM models suffix with `Model`: `UserModel`, `ProjectModel`
- Domain exceptions suffix with `Error`: `UserAlreadyExistsError`, `ProjectNotFoundError`

**Functions/Methods:**
- `snake_case` throughout: `get_by_email`, `get_password_hash`, `execute`
- Use Case entry point is always `execute()` — every use case class exposes a single `async def execute(...)` method
- Repository private helpers prefix with `_`: `_to_entity`, `_to_model`

**Variables:**
- `snake_case`: `user_repo`, `created_project`, `hashed_password`

### Domain Entity Pattern

Entities use Pydantic `BaseModel` with `model_config = ConfigDict(from_attributes=True)`:

```python
# app/domain/entities/user.py
class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    password_hash: str
    full_name: str
    is_active: bool = True
    role_id: Optional[int] = None
    role: Optional[Role] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
```

- All IDs are `Optional[int] = None` to allow creation without a DB-assigned ID
- Timestamps are always `Optional[datetime] = None`
- `from_attributes=True` enables ORM model → entity conversion via `Model.model_validate(orm_obj)`

### DTO Pattern

DTOs are separate Pydantic models in `app/application/dtos/`:
- `CreateDTO` — input for creation, required fields only
- `UpdateDTO` — all fields `Optional` for partial updates
- `ResponseDTO` — output shape with `model_config = ConfigDict(from_attributes=True)`

```python
# app/application/dtos/project_dtos.py
class ProjectUpdateDTO(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    # All fields Optional for PATCH-style updates
```

### Repository Pattern

- Repositories implement interface from `app/domain/repositories/`
- All methods are `async`
- Use `_to_entity` and `_to_model` as private converter methods
- After `create`, always re-fetch via `get_by_id` to get DB-generated fields (id, timestamps)
- Use `result.unique().scalars().all()` when `joinedload` is used to prevent row duplication

```python
# Pattern in app/infrastructure/database/repositories/user_repo.py
async def create(self, user: User) -> User:
    model = self._to_model(user)
    self.session.add(model)
    await self.session.flush()
    return await self.get_by_id(model.id)  # type: ignore
```

### Use Case Pattern

Each use case is a class in `app/application/use_cases/`, instantiated in the API router:

```python
# Pattern in app/api/v1/projects.py
@router.post("/", response_model=ProjectResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_project(
    dto: ProjectCreateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = CreateProjectUseCase(project_repo)
    return await use_case.execute(dto, current_user.id)
```

Use cases are NOT singletons — they are instantiated per request in route handlers.

### Error Handling

**Backend strategy:** Domain exceptions → HTTP exceptions at the API layer

- Domain layer raises typed exceptions from `app/domain/exceptions.py`:
  ```python
  class UserAlreadyExistsError(DomainError):
      def __init__(self, email: str):
          super().__init__(f"User with email {email} already exists")
  ```
- API layer catches domain exceptions and converts to `HTTPException`:
  ```python
  except ProjectNotFoundError as e:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  ```
- Never raise `HTTPException` from domain or application layers — only from `app/api/`

### Dependency Injection

FastAPI DI is configured in `app/api/dependencies.py`. Factories follow the pattern `get_<resource>`:

```python
def get_user_repo(session: AsyncSession = Depends(get_db)) -> IUserRepository:
    return SqlAlchemyUserRepository(session)
```

### Enums

Enums inherit from both `str` and `Enum` for JSON serialization:

```python
class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
```

### Type Annotations

- All function signatures use type annotations
- `# type: ignore` is used where `Optional[int]` IDs are passed after DB creation — this is an acknowledged shortcut

### Comments

- Inline comments explain non-obvious ORM behavior (e.g., `unique()` after `joinedload`)
- Turkish-language inline comments appear frequently (codebase team is Turkish)
- Docstrings on test fixtures explain their scope and purpose

---

## Frontend Conventions (TypeScript / Next.js)

### Naming Patterns

**Files:**
- Page files follow Next.js App Router convention: `page.tsx`, `layout.tsx`
- Component files use `kebab-case`: `create-task-modal.tsx`, `app-shell.tsx`, `auth-guard.tsx`
- Service files use `kebab-case` with `-service` suffix: `project-service.ts`, `task-service.ts`
- Hook files use `kebab-case` with `use-` prefix: `use-projects.ts`, `use-toast.ts`
- Context files use `kebab-case` with `-context` suffix: `auth-context.tsx`
- Lib utilities use `kebab-case`: `api-client.ts`, `types.ts`, `utils.ts`

**Components:**
- Named exports using `PascalCase` functions: `export function CreateTaskModal(...)`, `export function AuthProvider(...)`
- Default exports for pages: `export default function ProjectsPage()`

**Types/Interfaces:**
- `PascalCase` for all interfaces and types: `CreateProjectDTO`, `AuthContextType`, `TaskResponseDTO`
- Interfaces for props use `<ComponentName>Props` pattern: `CreateTaskModalProps`
- Types for primitive unions use `type`: `type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`

**Variables and Functions:**
- `camelCase` throughout: `handleSubmit`, `resetForm`, `mapProjectResponseToProject`
- Constants use `SCREAMING_SNAKE_CASE` in `lib/constants.ts`: `AUTH_TOKEN_KEY`

### Import Organization

**Order convention:**
1. React and framework imports: `import * as React from "react"`, `import { useRouter } from "next/navigation"`
2. Third-party libraries: `import { useQuery } from '@tanstack/react-query'`
3. Internal UI components: `import { Button } from "@/components/ui/button"`
4. Internal services/hooks/lib: `import { projectService } from "@/services/project-service"`
5. Type imports: `import { TaskPriority } from "@/lib/types"`

**Path Aliases:**
- `@/` maps to the root `Frontend/` directory (configured in `tsconfig.json`)
- All internal imports use `@/` prefix — never relative paths like `../../`

### Component Pattern

All client components start with `"use client"` directive:

```tsx
"use client"

import * as React from "react"

export function MyComponent({ prop }: MyComponentProps) {
  const [state, setState] = React.useState(...)
  return (...)
}
```

- `React.useState`, `React.useEffect` etc. are accessed via namespace (not destructured imports)
- Props interface defined inline above the component function

### Data Fetching Pattern

Services encapsulate API calls; hooks wrap services with React Query:

**Service layer** (`services/*.ts`):
- Raw HTTP via `apiClient` (Axios instance from `lib/api-client.ts`)
- Mapper function converts backend snake_case response to frontend camelCase shape
- Typed with `interface <Resource>Response` (backend shape) and `interface Create<Resource>DTO` (request shape)

```ts
// services/project-service.ts
const mapProjectResponseToProject = (data: ProjectResponse): Project => { ... }

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<ProjectResponse[]>('/projects');
    return response.data.map(mapProjectResponseToProject);
  },
}
```

**Hook layer** (`hooks/use-*.ts`):
- Wraps service calls with `useQuery` / `useMutation`
- Query keys use array format: `['projects']`, `['projects', id]`, `['project-tasks', projectId]`

```ts
// hooks/use-projects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });
};
```

### State Management

- Server data: TanStack React Query (caching, invalidation, loading/error states)
- Auth state: React Context in `context/auth-context.tsx` via `useAuth()` hook
- Local UI state: `React.useState` inside components
- No global client-side state library (no Redux, Zustand, etc.)

### Error Handling (Frontend)

- API errors are caught globally in Axios interceptors in `lib/api-client.ts`
- 401 responses trigger `localStorage.removeItem(AUTH_TOKEN_KEY)` and redirect to `/login`
- Component-level errors display `<Alert variant="destructive">` from shadcn/ui
- Mutation errors use `toast.error(...)` from `sonner`
- `console.error` is used for debugging — not a production logging strategy

### Logging

- `console.error('API Error:', ...)` in Axios interceptors
- `console.error(error)` in `useMutation` `onError` callbacks
- No structured logging or monitoring library

### Form Handling

- Manual `React.useState` per field in forms (not react-hook-form, even though it is a dependency)
- Submit handler validates required fields and calls mutation directly:
  ```tsx
  const handleSubmit = () => {
    if (!selectedProjectId) { toast.error("Please select a project"); return; }
    createTaskMutation.mutate(payload)
  }
  ```

### TypeScript Configuration

- `strict: true` enabled in `tsconfig.json`
- `target: "ES6"`, `module: "esnext"`, `moduleResolution: "bundler"`
- No linting config (no `.eslintrc` or `eslint.config.*` found) — `npm run lint` runs Next.js built-in ESLint

### UI Component Library

All base UI components live in `components/ui/` and are shadcn/ui components built on Radix UI primitives. Never modify these directly — they are treated as a design system layer. Custom application components go in `components/` or `components/<feature>/`.

---

*Convention analysis: 2026-03-11*
