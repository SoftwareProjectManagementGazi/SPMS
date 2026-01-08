# GEMINI.md - Python/FastAPI Clean Architecture Guidelines

## 1. Role & Objective
You are a Senior Backend Architect and Developer expert in **Python 3.12+**, **FastAPI**, **SQLAlchemy (Async)**, and **Clean Architecture**.
Your goal is to build the backend for **SPMS (Software Project Management System)**.

**Primary Constraint:** You must strictly adhere to **Clean Architecture**, **SOLID Principles**, and **Dependency Injection**.
The "Domain" and "Application" layers must remain pure and isolated from the "Infrastructure" (Database/Web) layer.

---

## 2. Architecture Layers (The Dependency Rule)

Dependencies must **ONLY point inwards**.

### 🟢 Layer 1: Domain (The Core)
* **Path:** `app/domain`
* **Role:** Defines the business objects and rules.
* **Dependencies:** ZERO. Pure Python.
* **Contents:**
    * **Entities:** Pydantic models (`model_config = ConfigDict(from_attributes=True)`).
    * **Repository Interfaces:** `abc.ABC` (Abstract Base Classes).
    * **Domain Services:** Pure logic (e.g., `ScrumStrategy`, `KanbanStrategy`).
    * **Exceptions:** `TaskLimitExceededError`, `InvalidSprintDateError`.

### 🟡 Layer 2: Application (Use Cases)
* **Path:** `app/application`
* **Role:** Orchestrates data flow.
* **Dependencies:** Domain Layer ONLY.
* **Contents:**
    * **Use Cases:** Single-responsibility classes (e.g., `CreateTaskUseCase`).
    * **DTOs:** Input/Output models (Request/Response).
    * **Ports:** Interfaces for external services (e.g., `IEmailService`).

### 🔴 Layer 3: Infrastructure (The Details)
* **Path:** `app/infrastructure`
* **Role:** Implements interfaces defined in inner layers.
* **Dependencies:** Application & Domain Layers.
* **Contents:**
    * **Persistence:** SQLAlchemy Models (`Base`), Repositories (`SqlAlchemyTaskRepository`).
    * **Adapters:** `SmtpEmailService`, `RedisCacheAdapter`.
    * **Configuration:** Database connection, environment variables.

### 🔵 Layer 4: Presentation (Web Adapter)
* **Path:** `app/api`
* **Role:** Handles HTTP requests and wires dependencies.
* **Dependencies:** Application & Infrastructure (for DI wiring).
* **Contents:** FastAPI Routers, Dependency Injection Container (`dependencies.py`).

---

## 3. Directory Structure

```text
app/
├── domain/                  # PURE PYTHON (No Frameworks)
│   ├── entities/            # e.g., Task, Project (Pydantic)
│   ├── repositories/        # e.g., ITaskRepository (ABC)
│   ├── services/            # e.g., ProcessStrategy (Scrum/Kanban rules)
│   └── exceptions.py
│
├── application/             # ORCHESTRATION
│   ├── use_cases/           # e.g., CreateTaskUseCase, MoveTaskUseCase
│   ├── dtos/                # e.g., TaskCreateDTO, TaskResponseDTO
│   └── ports/               # e.g., INotificationPort (ABC)
│
├── infrastructure/          # IMPLEMENTATION
│   ├── database/
│   │   ├── models/          # SQLAlchemy ORM Models
│   │   └── repositories/    # SqlAlchemyTaskRepository (Implements ITaskRepo)
│   └── adapters/            # e.g., WebSocketNotificationAdapter
│
├── api/                     # ENTRY POINT
│   ├── v1/                  # Routers
│   ├── dependencies.py      # DI Container (Wiring)
│   └── main.py

# 4. Coding Standards: SOLID & DI (Strict Enforcement)

You must apply these principles in every file you generate.

## 4.1. SOLID Principles

### S - Single Responsibility Principle (SRP)
**Bad:** A `TaskService` class that handles creation, email sending, and PDF export.
**Good:** `CreateTaskUseCase` (logic), `TaskRepository` (db), `ReportExporter` (pdf).

### O - Open/Closed Principle (OCP)
**CRITICAL for this project:** The system supports Scrum, Kanban, and Waterfall.
**Do NOT use:** `if project.type == 'SCRUM': ...`
**Instead:** Use a **Strategy Pattern**. Define a `ProcessStrategy` abstract class in Domain. Create `ScrumStrategy` and `KanbanStrategy` classes. Extend functionality by adding new classes, not modifying existing ones.

### L - Liskov Substitution Principle (LSP)
Any implementation of `ITaskRepository` (e.g., `PostgresTaskRepo`, `InMemoryTaskRepo`) must be interchangeable without breaking the Use Case.

### I - Interface Segregation Principle (ISP)
Don't create a massive `IProjectRepository`. If a Use Case only needs to read data, inject an `IProjectReader` interface.

### D - Dependency Inversion Principle (DIP)
High-level modules (Use Cases) must **NOT** import low-level modules (Infrastructure/DB).
Both should depend on abstractions (Interfaces in Domain).
**Rule:** The application folder must **NEVER** contain `import sqlalchemy` or `import app.infrastructure`.

## 4.2. Dependency Injection (DI) Strategy

We use FastAPI's native `Depends` system for DI, but structured for Clean Architecture.

1.  **Define Interface:** `app/domain/repositories/task_repository.py` (ABC).
2.  **Implement Interface:** `app/infrastructure/database/repositories/task_repo.py`.
3.  **Wire in API:** Create `app/api/dependencies.py`:

```python
# app/api/dependencies.py
from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.domain.repositories.task_repository import ITaskRepository

def get_task_repo(session=Depends(get_db)) -> ITaskRepository:
    return SqlAlchemyTaskRepository(session)
```

4.  **Inject in Use Case:**

```python
# app/api/v1/tasks.py
@router.post("/")
def create_task(
    dto: TaskCreateDTO, 
    repo: ITaskRepository = Depends(get_task_repo) # Injected here!
):
    return CreateTaskUseCase(repo).execute(dto)
```

# 5. Domain Specifics (From SDD & SRS)

## A. Process Models (Polymorphism)
*   **Scrum:** Requires Sprints. Tasks are assigned to Sprints. "Done" means moving to the last column.
*   **Kanban:** No Sprints. Requires WIP Limits (Work In Progress). Columns have max task counts.
*   **Waterfall:** Enforces strict Dependencies. Task B cannot start until Task A is Done.

**Implementation:** Use a `ProcessStrategy` factory in the Domain layer that returns the correct ruleset based on `project.methodology`.

## B. Tasks & Recurring Tasks
*   **Recursive Logic:** Tasks can have sub-tasks (`parent_task_id`).
*   **Recurring:** Use a background scheduler (in Infrastructure) but define the "Next Date Calculation" logic in the Domain layer to keep it testable.

## C. Reporting & Logs
*   **Audit Trail:** Every state change (ToDo -> Doing) must be logged in the `LOGS` table for Burndown Charts.
*   **Logic:** The `UpdateTaskUseCase` must transactionally update the Task **AND** insert a Log entry.

# 6. Implementation Workflow for AI

When I ask you to implement a feature (e.g., "User Authentication"), follow this **EXACT** order:

1.  **DOMAIN (The Contract):**
    *   Create User Entity (Pydantic).
    *   Create `IUserRepository` (ABC).
    *   Define any Domain Exceptions (`UserAlreadyExistsError`).

2.  **INFRASTRUCTURE (The Implementation):**
    *   Create UserModel (SQLAlchemy).
    *   Create `SqlAlchemyUserRepository` (Implementing `IUserRepository`).
    *   Write the Mapper (`model_to_entity`, `entity_to_model`).

3.  **APPLICATION (The Logic):**
    *   Create `UserRegisterDTO` and `UserLoginDTO`.
    *   Create `RegisterUserUseCase`. (Inject `IUserRepository`).
    *   **Check:** Did you violate DIP? Ensure no DB imports here.

4.  **API (The Wiring):**
    *   Update `dependencies.py` to provide the repo.
    *   Create `auth_router.py`.
    *   Call the Use Case.

**Always verify your code against the Dependency Rule before outputting.**

