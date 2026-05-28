# Backend operational scripts

## `regen_snapshot.ps1` / `regen_snapshot.sh`

Regenerate `Backend/fixtures/simulated_quarter.sql.gz` — the 90-day discrete-event simulator output that the lifespan hook restores on fresh containers.

**When to run this**

- After any change to the seeder, the simulator (`app/dev/simulator/*`), or the RBAC seed lists in `_seed_rbac.py`.
- After any alembic schema change that touches a table the simulator writes to.
- When the existing snapshot lacks data the live admin UI now expects (e.g. the bug where `role_permissions` was missing — fixed by the `seed_rbac` run inside `bootstrap_baseline`, but the fixture also needs to ship those rows so fresh installs don't rely on the runtime band-aid).

**Usage**

```powershell
# Windows / PowerShell — default 90 days, seed 42
pwsh ./scripts/regen_snapshot.ps1

# Faster iteration on simulator code (skip DB reset + alembic)
pwsh ./scripts/regen_snapshot.ps1 -SkipDbReset
```

```bash
# Linux / macOS / Git-Bash
./scripts/regen_snapshot.sh
DAYS=30 SEED=7 ./scripts/regen_snapshot.sh
SKIP_DB_RESET=1 ./scripts/regen_snapshot.sh
```

**What it does**

1. Reads DB config from `app.infrastructure.config.settings` (so `.env` overrides apply automatically).
2. Drops + recreates the database (`DROP DATABASE … WITH (FORCE)`). All existing data is lost.
3. Runs `alembic upgrade head` to apply every migration in order.
4. Runs the simulator (`python -m app.dev.simulator.run`) which:
   - Calls `bootstrap_baseline` → TRUNCATE + `seed_data(skip_tasks=True)` + `seed_rbac` (the new behavior — this is why the regenerated snapshot includes permissions / role_permissions).
   - Replays the configured number of simulated days, generating realistic task / audit / comment / notification traffic.
5. Runs `pg_dump --inserts --data-only`, excluding `alembic_version` (the migration ledger) and `system_config` (admin-tunable runtime config that should never be overwritten on restore).
6. Streams the dump through gzip into `fixtures/simulated_quarter.sql.gz`.

**Prerequisites**

- `pg_dump` / `psql` on PATH, same major version as the Postgres server.
- Active Python venv with the backend deps installed (`alembic`, project source).
- DB connection in `.env` points at a database you're OK destroying.

**Verifying the new snapshot**

After regeneration, check the snapshot carries the previously missing RBAC rows:

```bash
gunzip -c Backend/fixtures/simulated_quarter.sql.gz | grep -c "INSERT INTO public.role_permissions"
# Should print 28 (23 PM cells + 5 Member cells).

gunzip -c Backend/fixtures/simulated_quarter.sql.gz | grep -c "INSERT INTO public.permissions"
# Should print 38.
```

If those counts are zero, `seed_rbac` didn't run inside `bootstrap_baseline` — open `app/infrastructure/database/seeder.py::seed_data` and confirm the `seed_rbac(session)` call at the end of the legacy seed path.
