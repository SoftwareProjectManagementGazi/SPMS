# STRUCTURE

## Repository Layout

```
SPMS/
├── Backend/                    # FastAPI backend (Python)
│   ├── app/                    # Application code
│   │   ├── api/                # HTTP layer (FastAPI routers)
│   │   │   ├── dependencies.py # Shared DI dependencies
│   │   │   ├── main.py         # FastAPI app factory
│   │   │   └── v1/             # Versioned API endpoints
│   │   │       ├── auth.py
│   │   │       ├── projects.py
│   │   │       └── tasks.py
│   │   ├── application/        # Use case / application layer
│   │   │   ├── dtos/           # Data Transfer Objects (Pydantic)
│   │   │   │   ├── auth_dtos.py
│   │   │   │   ├── project_dtos.py
│   │   │   │   └── task_dtos.py
│   │   │   ├── ports/          # Interfaces (dependency inversion)
│   │   │   │   └── security_port.py
│   │   │   └── use_cases/      # Business use case handlers
│   │   │       ├── get_project_details.py
│   │   │       ├── login_user.py
│   │   │       ├── manage_projects.py
│   │   │       ├── manage_tasks.py
│   │   │       └── register_user.py
│   │   ├── domain/             # Domain layer (pure business logic)
│   │   │   ├── entities/       # Domain entities
│   │   │   │   ├── board_column.py
│   │   │   │   ├── comment.py
│   │   │   │   ├── file.py
│   │   │   │   ├── label.py
│   │   │   │   ├── log.py
│   │   │   │   ├── notification.py
│   │   │   │   ├── project.py
│   │   │   │   ├── role.py
│   │   │   │   ├── sprint.py
│   │   │   │   ├── task.py
│   │   │   │   └── user.py
│   │   │   ├── repositories/   # Repository interfaces (abstract)
│   │   │   │   ├── project_repository.py
│   │   │   │   ├── task_repository.py
│   │   │   │   └── user_repository.py
│   │   │   ├── services/       # Domain services
│   │   │   └── exceptions.py   # Domain-level exceptions
│   │   └── infrastructure/     # Infrastructure / adapters
│   │       ├── adapters/       # Port implementations
│   │       │   └── security_adapter.py
│   │       ├── config.py       # Settings (env-based)
│   │       └── database/
│   │           ├── database.py         # SQLAlchemy engine + session
│   │           ├── models/             # ORM models (SQLAlchemy)
│   │           │   ├── base.py
│   │           │   ├── board_column.py
│   │           │   ├── comment.py
│   │           │   ├── file.py
│   │           │   ├── label.py
│   │           │   ├── log.py
│   │           │   ├── notification.py
│   │           │   ├── project.py
│   │           │   ├── role.py
│   │           │   ├── sprint.py
│   │           │   ├── task.py
│   │           │   └── user.py
│   │           └── repositories/       # Repository implementations
│   │               ├── project_repo.py
│   │               └── task_repo.py
│   ├── tests/                  # Test suite
│   │   ├── conftest.py
│   │   ├── integration/
│   │   │   ├── api/
│   │   │   │   └── test_auth_rbac.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── test_db_integration.py
│   │   │   │   └── test_user_repo_integration.py
│   │   │   └── conftest.py
│   │   └── unit/
│   │       └── application/
│   │           └── test_register_user.py
│   ├── database/
│   │   └── init.sql            # DB initialization SQL
│   ├── static/uploads/         # Uploaded file storage
│   ├── docker-compose.yaml
│   ├── pytest.ini
│   └── requirements.txt
│
├── Frontend/                   # Next.js frontend (TypeScript)
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root/dashboard page
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── my-tasks/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   └── tasks/[id]/page.tsx
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn/ui primitives (generated)
│   │   ├── dashboard/
│   │   │   ├── manager-view.tsx
│   │   │   └── member-view.tsx
│   │   ├── project/
│   │   │   ├── ai-recommendation-modal.tsx
│   │   │   ├── customize-columns.tsx
│   │   │   └── field-toggles.tsx
│   │   ├── task-detail/
│   │   │   ├── task-content.tsx
│   │   │   ├── task-header.tsx
│   │   │   └── task-sidebar.tsx
│   │   ├── providers/
│   │   │   └── query-provider.tsx
│   │   ├── app-shell.tsx
│   │   ├── auth-guard.tsx
│   │   ├── create-task-modal.tsx
│   │   ├── header.tsx
│   │   ├── project-creation.tsx
│   │   ├── sidebar.tsx
│   │   └── theme-provider.tsx
│   └── .env.local              # Frontend environment config
│
├── docs/                       # Project documentation
│   ├── backlog/                # SPMS backlog items (*.md)
│   ├── archive/
│   ├── Gereksinimler_Checklist.md
│   └── report.md
│
└── .planning/                  # GSD planning directory
    └── codebase/               # Codebase map (this directory)
```

---

## Key File Locations

| What | Where |
|------|-------|
| FastAPI app entry | `Backend/app/api/main.py` |
| API routes | `Backend/app/api/v1/` |
| DI dependencies | `Backend/app/api/dependencies.py` |
| Use cases | `Backend/app/application/use_cases/` |
| DTOs / schemas | `Backend/app/application/dtos/` |
| Domain entities | `Backend/app/domain/entities/` |
| Repository interfaces | `Backend/app/domain/repositories/` |
| ORM models | `Backend/app/infrastructure/database/models/` |
| Repository implementations | `Backend/app/infrastructure/database/repositories/` |
| DB session setup | `Backend/app/infrastructure/database/database.py` |
| App config | `Backend/app/infrastructure/config.py` |
| Next.js pages | `Frontend/app/` |
| Reusable components | `Frontend/components/` |
| UI primitives | `Frontend/components/ui/` |
| Test fixtures | `Backend/tests/conftest.py` |

---

## Naming Conventions

### Backend (Python)
- Files: `snake_case.py`
- Classes: `PascalCase`
- Use case files named after action: `manage_projects.py`, `login_user.py`
- ORM models mirror domain entity names
- Repository interface in `domain/repositories/`, implementation in `infrastructure/database/repositories/`

### Frontend (TypeScript)
- Files: `kebab-case.tsx`
- Components: `PascalCase` (matching filename)
- Pages follow Next.js App Router conventions: `app/<route>/page.tsx`
- UI components in `components/ui/` (Shadcn-generated, do not manually edit)
- Feature components organized by domain: `components/project/`, `components/task-detail/`, `components/dashboard/`

---

## Where to Add New Code

| Adding | Location |
|--------|----------|
| New API endpoint | `Backend/app/api/v1/<domain>.py` |
| New use case | `Backend/app/application/use_cases/<action>.py` |
| New DTO | `Backend/app/application/dtos/<domain>_dtos.py` |
| New domain entity | `Backend/app/domain/entities/<entity>.py` |
| New repository interface | `Backend/app/domain/repositories/<entity>_repository.py` |
| New ORM model | `Backend/app/infrastructure/database/models/<entity>.py` |
| New repository implementation | `Backend/app/infrastructure/database/repositories/<entity>_repo.py` |
| New Next.js page | `Frontend/app/<route>/page.tsx` |
| New feature component | `Frontend/components/<domain>/<component>.tsx` |
| New UI primitive | Use shadcn CLI, outputs to `Frontend/components/ui/` |
| New integration test | `Backend/tests/integration/api/` or `Backend/tests/integration/infrastructure/` |
| New unit test | `Backend/tests/unit/<layer>/` |
