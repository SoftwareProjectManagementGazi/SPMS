# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Analytics:**
- Vercel Analytics - Page view and event tracking
  - SDK/Client: `@vercel/analytics` (latest), integrated in Frontend
  - Auth: Handled automatically by Vercel platform; no explicit env var in code

**No other third-party external APIs detected.** The system is self-contained: all business logic is served by the custom FastAPI backend.

## Data Storage

**Databases:**
- PostgreSQL 15 (Alpine)
  - Purpose: Primary persistent data store for all entities (users, projects, tasks, roles, sprints, comments, files, labels, logs, notifications, board columns)
  - Container definition: `Backend/docker-compose.yaml`
  - Connection string format: `postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}`
  - Connection env vars: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
  - ORM/Client: SQLAlchemy (async) with `asyncpg` driver; engine configured at `Backend/app/infrastructure/database/database.py`
  - Schema initialization: `Backend/database/init.sql` (auto-executed on container start)
  - Models located at: `Backend/app/infrastructure/database/models/` (user.py, project.py, task.py, role.py, sprint.py, comment.py, file.py, label.py, log.py, notification.py, board_column.py)

**Test Database:**
- PostgreSQL (same instance) — a separate `spms_db_test` database is created/dropped per test session
  - Logic in `Backend/tests/conftest.py`

**File Storage:**
- Local filesystem only — no cloud object storage (S3, GCS, etc.) detected. A `file.py` model exists at `Backend/app/infrastructure/database/models/file.py` but the storage backend is not wired to any external service.

**Caching:**
- None — no Redis, Memcached, or similar detected.

## Authentication & Identity

**Auth Provider:**
- Custom (self-hosted, no third-party identity provider)
  - Implementation: JWT Bearer tokens using HS256 algorithm
  - Token creation: `Backend/app/infrastructure/adapters/security_adapter.py` via `python-jose`
  - Password hashing: bcrypt via `passlib` at `Backend/app/infrastructure/security.py`
  - Token endpoint: `POST /api/v1/auth/login` returns `{ access_token, token_type }`
  - Token validation: FastAPI `OAuth2PasswordBearer` + `python-jose` JWT decode in `Backend/app/api/dependencies.py`
  - Token expiry: 30 minutes (configured via `ACCESS_TOKEN_EXPIRE_MINUTES`)
  - Frontend token storage: `localStorage` under key `auth_token` (defined in `Frontend/lib/constants.ts`)
  - Frontend token injection: Axios request interceptor at `Frontend/lib/api-client.ts` adds `Authorization: Bearer <token>` header
  - Frontend session management: React Context at `Frontend/context/auth-context.tsx`
  - Auto-logout on 401: Response interceptor in `Frontend/lib/api-client.ts` clears token and redirects to `/login`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar error tracking service detected.

**Logs:**
- Backend: SQLAlchemy `echo=True` in `Backend/app/infrastructure/database/database.py` (logs all SQL queries to stdout; should be disabled in production)
- Frontend: `console.error` used in `Frontend/lib/api-client.ts` for API errors and in `Frontend/context/auth-context.tsx` for auth failures

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (implied by `@vercel/analytics` dependency)
- Backend: Not specified — no Dockerfile for the application, no cloud provider config detected

**CI Pipeline:**
- None detected — no GitHub Actions, CircleCI, or similar config files found

## Environment Configuration

**Backend required env vars** (from `Backend/app/infrastructure/config.py` defaults):
- `DB_USER` - PostgreSQL username (default: `admin`)
- `DB_PASSWORD` - PostgreSQL password (default: `secretpassword`)
- `DB_HOST` - PostgreSQL host (default: `localhost`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_NAME` - PostgreSQL database name (default: `spms_db`)
- `JWT_SECRET` - Secret key for JWT signing (default: `supersecretkey` — must be changed for production)
- `JWT_ALGORITHM` - JWT algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token lifetime in minutes (default: `30`)

**Frontend required env vars** (from `Frontend/lib/api-client.ts`):
- `NEXT_PUBLIC_API_URL` - Base URL for the FastAPI backend (default: `http://localhost:8000/api/v1`)

**Secrets location:**
- Backend: `Backend/.env` file (gitignored; not committed)
- Frontend: `Frontend/.env.local` file (gitignored; not committed)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Internal API Communication

**Frontend-to-Backend:**
- Protocol: HTTP REST (JSON)
- Base URL: `http://localhost:8000/api/v1` (dev) / `NEXT_PUBLIC_API_URL` (configurable)
- Client: Axios instance at `Frontend/lib/api-client.ts`
- Service layer: `Frontend/services/auth-service.ts`, `Frontend/services/project-service.ts`, `Frontend/services/task-service.ts`, `Frontend/services/user-service.ts`
- Backend API routes:
  - `POST /api/v1/auth/login` - Authenticate and receive JWT
  - `POST /api/v1/auth/register` - Register new user
  - `GET  /api/v1/auth/me` - Get current authenticated user
  - `GET  /api/v1/auth/users` - List all users (authenticated)
  - `GET/POST /api/v1/projects` - Project CRUD
  - `GET/POST /api/v1/tasks` - Task CRUD

---

*Integration audit: 2026-03-11*
