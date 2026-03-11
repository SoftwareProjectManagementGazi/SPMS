# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary (Backend):**
- Python 3.x - FastAPI application, domain logic, database models, tests

**Primary (Frontend):**
- TypeScript 5.x - All React components, services, hooks, utilities

**Secondary:**
- SQL - Database initialization script at `Backend/database/init.sql`

## Runtime

**Backend Environment:**
- Python (version not pinned; no `.python-version` file detected)
- ASGI server: Uvicorn (from `Backend/requirements.txt`)

**Frontend Environment:**
- Node.js (version not pinned; no `.nvmrc` file detected)

**Package Managers:**
- Frontend: npm (lockfile: `Frontend/package-lock.json`) and pnpm (lockfile: `Frontend/pnpm-lock.yaml`) — both present; primary is npm
- Backend: pip (no lockfile; only `Backend/requirements.txt`)

## Frameworks

**Backend Core:**
- FastAPI (latest) - REST API framework at `Backend/app/api/`
- SQLAlchemy (latest, async) - ORM; async engine via `asyncpg` driver
- Pydantic v2 + pydantic-settings - Data validation and settings management
- python-jose - JWT token encoding/decoding
- passlib[bcrypt] - Password hashing

**Frontend Core:**
- Next.js ^16.1.1 - App router, SSR/CSR hybrid at `Frontend/app/`
- React 19.2.0 - UI rendering
- TailwindCSS ^4.1.9 - Utility-first styling
- shadcn/ui (via `components.json`) - Component library built on Radix UI primitives

**Frontend State & Data Fetching:**
- TanStack Query (React Query) ^5.90.16 - Server state management
- React Hook Form ^7.60.0 - Form state
- Zod 3.25.76 - Schema validation / form resolvers

**Testing (Backend):**
- pytest + pytest-asyncio - Test runner with async support
- httpx - Async HTTP client for integration tests (via ASGI transport)
- aiosqlite - In-memory SQLite alternative for isolated testing

**Build/Dev (Frontend):**
- PostCSS ^8.5 - CSS processing
- TypeScript ^5 - Type checking (build errors intentionally ignored via `next.config.mjs`)

## Key Dependencies

**Critical (Backend):**
- `asyncpg` (latest) - Async PostgreSQL driver; required for SQLAlchemy async engine
- `python-jose` (latest) - JWT creation and verification at `Backend/app/infrastructure/adapters/security_adapter.py`
- `passlib[bcrypt]` (latest) - bcrypt password hashing at `Backend/app/infrastructure/security.py`

**Critical (Frontend):**
- `axios` ^1.13.2 - HTTP client; central API client at `Frontend/lib/api-client.ts`
- `@tanstack/react-query` ^5.90.16 - Data fetching and caching
- `lucide-react` ^0.454.0 - Icon set used throughout components
- `recharts` 2.15.4 - Charts used in reports views
- `date-fns` (latest) - Date formatting utilities
- `sonner` ^1.7.4 - Toast notifications
- `next-themes` ^0.4.6 - Dark/light mode theming

**Infrastructure:**
- All `@radix-ui/react-*` packages (many versions ~1.x–2.x) - Accessible primitive components backing shadcn/ui
- `@vercel/analytics` (latest) - Analytics integration

## Configuration

**Backend Environment:**
- Settings loaded from `.env` file at `Backend/.env` (not committed) via `pydantic-settings`
- Fallback defaults defined in `Backend/app/infrastructure/config.py`
- Key config vars: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- JWT algorithm: HS256; token expiry: 30 minutes (default)

**Frontend Environment:**
- `.env.local` file present at `Frontend/.env.local` (not committed)
- Key env var: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api/v1` in `Frontend/lib/api-client.ts`)

**Build (Frontend):**
- `Frontend/next.config.mjs` - TypeScript build errors ignored (`ignoreBuildErrors: true`), images unoptimized
- `Frontend/tsconfig.json` - Strict mode enabled; path alias `@/*` maps to `Frontend/*`
- `Frontend/postcss.config.mjs` - PostCSS config for Tailwind

**Build (Backend):**
- `Backend/pytest.ini` - pytest config; asyncio_mode=auto; testpaths=tests
- `Backend/docker-compose.yaml` - PostgreSQL 15 Alpine container on port 5433 (maps to internal 5432)

## Platform Requirements

**Development:**
- Docker required to run PostgreSQL: `Backend/docker-compose.yaml`
- PostgreSQL 15 exposed on `localhost:5433`
- Backend served by Uvicorn (default port 8000)
- Frontend served by Next.js dev server on port 3000
- CORS configured for `http://localhost:3000` and `http://127.0.0.1:3000`

**Production:**
- Deployment target not explicitly configured (no Dockerfile for app, no CI/CD config detected)
- `@vercel/analytics` dependency suggests Vercel as intended frontend host
- Backend deployment platform not specified

---

*Stack analysis: 2026-03-11*
