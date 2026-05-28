#!/usr/bin/env bash
# Regenerate Backend/fixtures/simulated_quarter.sql.gz from a clean DB.
# See scripts/regen_snapshot.ps1 for the PowerShell sibling — both do the
# same dance: drop+create DB, alembic head, run simulator, pg_dump, gzip.
#
# Usage:
#   scripts/regen_snapshot.sh                 # 90 days, seed 42
#   DAYS=30 SEED=7 scripts/regen_snapshot.sh
#   SKIP_DB_RESET=1 scripts/regen_snapshot.sh  # iterate on simulator only

set -euo pipefail

DAYS="${DAYS:-90}"
SEED="${SEED:-42}"
SKIP_DB_RESET="${SKIP_DB_RESET:-0}"

# --- Paths ---------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FIXTURE_PATH="${BACKEND_ROOT}/fixtures/simulated_quarter.sql.gz"
TMP_SQL="${BACKEND_ROOT}/fixtures/_snapshot.tmp.sql"

# --- Prereq checks -------------------------------------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "Required command '$1' not on PATH. $2" >&2; exit 1; }; }
need pg_dump "Install Postgres client (matching server major version)."
need psql    "Install Postgres client."
need python  "Activate the backend venv."
need alembic "Activate the backend venv."
need gzip    "Install gzip."

# --- Read DB config from app settings ------------------------------------
cd "$BACKEND_ROOT"
CONN_JSON=$(python -c "import json; from app.infrastructure.config import settings; print(json.dumps({'host': settings.DB_HOST, 'port': settings.DB_PORT, 'user': settings.DB_USER, 'password': settings.DB_PASSWORD, 'name': settings.DB_NAME}))")
DB_HOST=$(echo "$CONN_JSON" | python -c "import json,sys; print(json.load(sys.stdin)['host'])")
DB_PORT=$(echo "$CONN_JSON" | python -c "import json,sys; print(json.load(sys.stdin)['port'])")
DB_USER=$(echo "$CONN_JSON" | python -c "import json,sys; print(json.load(sys.stdin)['user'])")
DB_PASS=$(echo "$CONN_JSON" | python -c "import json,sys; print(json.load(sys.stdin)['password'])")
DB_NAME=$(echo "$CONN_JSON" | python -c "import json,sys; print(json.load(sys.stdin)['name'])")

export PGPASSWORD="$DB_PASS"
PSQL_BASE=(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --no-password -v ON_ERROR_STOP=1)

# --- Step 1: drop + recreate DB + alembic upgrade head -------------------
if [ "$SKIP_DB_RESET" != "1" ]; then
    echo "==> Dropping + recreating database '$DB_NAME' on $DB_HOST:$DB_PORT..."
    "${PSQL_BASE[@]}" --dbname=postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);"
    "${PSQL_BASE[@]}" --dbname=postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

    echo "==> Running alembic upgrade head..."
    alembic upgrade head
fi

# --- Step 2: run simulator ----------------------------------------------
echo "==> Running simulator for ${DAYS} days (seed=${SEED})..."
python -m app.dev.simulator.run --days "$DAYS" --seed "$SEED"

# --- Step 3: dump + gzip -------------------------------------------------
echo "==> Dumping snapshot..."
pg_dump \
    --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
    --no-password \
    --dbname="$DB_NAME" \
    --inserts \
    --data-only \
    --exclude-table=alembic_version \
    --exclude-table=system_config \
    --file="$TMP_SQL"

echo "==> Compressing -> $FIXTURE_PATH ..."
gzip -9 -c "$TMP_SQL" > "$FIXTURE_PATH"
rm -f "$TMP_SQL"

SIZE_KB=$(du -k "$FIXTURE_PATH" | cut -f1)
echo "==> Done. Snapshot is ${SIZE_KB} KB at ${FIXTURE_PATH}"
echo '   Verify with: gunzip -c fixtures/simulated_quarter.sql.gz | grep -c "INSERT INTO public.role_permissions"'
