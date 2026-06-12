"""One-off audit: endpoint inventory per module + duplicates + frontend usage cross-ref."""
import os, re, json, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V1 = os.path.join(ROOT, "Backend", "app", "api", "v1")

# mount prefixes from Backend/app/api/main.py include_router calls
MOUNT = {
    "auth": "/api/v1/auth", "projects": "/api/v1/projects", "board_columns": "/api/v1/projects",
    "labels": "/api/v1", "tasks": "/api/v1/tasks", "teams": "/api/v1", "sprints": "/api/v1/sprints",
    "comments": "/api/v1/comments", "attachments": "/api/v1/attachments",
    "notifications": "/api/v1/notifications", "notification_preferences": "/api/v1/notifications/preferences",
    "reports": "/api/v1/reports", "process_templates": "/api/v1/process-templates",
    "admin_settings": "/api/v1/admin/settings", "integrations": "/api/v1/integrations",
    "phase_transitions": "/api/v1", "activity": "/api/v1", "users": "/api/v1", "charts": "/api/v1",
    "milestones": "/api/v1", "artifacts": "/api/v1", "phase_reports": "/api/v1",
    "ai_workflow": "/api/v1/ai", "admin_join_requests": "/api/v1", "admin_users": "/api/v1",
    "admin_audit": "/api/v1", "admin_stats": "/api/v1", "admin_summary": "/api/v1",
    "admin_roles": "/api/v1", "admin_permissions": "/api/v1",
}
# routers that declare their own APIRouter(prefix=...)
SELF_PREFIX = {"teams": "/teams", "admin_roles": "/admin/roles", "admin_permissions": "/admin/permissions"}

DEC = re.compile(r'@router\.(get|post|put|patch|delete)\(\s*["\']([^"\']*)["\']', re.S)

endpoints = []  # (module, METHOD, full_path)
for fn in sorted(os.listdir(V1)):
    if not fn.endswith(".py") or fn == "__init__.py":
        continue
    mod = fn[:-3]
    src = open(os.path.join(V1, fn), encoding="utf-8").read()
    for m in DEC.finditer(src):
        method, path = m.group(1).upper(), m.group(2)
        full = MOUNT.get(mod, "/api/v1") + SELF_PREFIX.get(mod, "") + path
        full = full.rstrip("/") or "/"
        endpoints.append((mod, method, full))

print("TOTAL:", len(endpoints))
per_mod = collections.Counter(e[0] for e in endpoints)
print("\n== PER MODULE ==")
for mod, c in per_mod.most_common():
    print(f"{c:4d}  {mod}")

# exact duplicates (same METHOD + path)
dups = collections.Counter((m, p) for _, m, p in endpoints)
print("\n== EXACT DUPLICATES (method+path registered 2x) ==")
found = False
for (m, p), c in dups.items():
    if c > 1:
        mods = [e[0] for e in endpoints if e[1] == m and e[2] == p]
        print(f"{m} {p}  x{c}  in {mods}")
        found = True
if not found:
    print("(none)")

# near-duplicates: same path, different method is fine; same normalized path ignoring param names
def norm(p):
    return re.sub(r"\{[^}]+\}", "{}", p)
norm_dups = collections.defaultdict(list)
for mod, m, p in endpoints:
    norm_dups[(m, norm(p))].append((mod, p))
print("\n== PARAM-NAME-ONLY DUPLICATES ==")
found = False
for (m, np), lst in norm_dups.items():
    if len(lst) > 1 and len(set(x[1] for x in lst)) > 1:
        print(f"{m} {np}: {lst}")
        found = True
if not found:
    print("(none)")

# ---- frontend usage ----
FE = os.path.join(ROOT, "Frontend2")
fe_patterns = set()
STR = re.compile(r'["\'`](/[A-Za-z0-9_\-{}$./]*)[\"\'`]')
for dirpath, dirnames, filenames in os.walk(FE):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".next", "e2e")]
    for fn in filenames:
        if not fn.endswith((".ts", ".tsx")) or fn.endswith((".test.ts", ".test.tsx")):
            continue
        try:
            src = open(os.path.join(dirpath, fn), encoding="utf-8").read()
        except Exception:
            continue
        for m in STR.finditer(src):
            s = m.group(1)
            if s.startswith("//"):
                continue
            s = re.sub(r"\$\{[^}]*\}", "{}", s)  # template params -> wildcard
            fe_patterns.add(s.rstrip("/"))

def fe_match(be_path):
    """backend /api/v1/x/{id}/y matched against any FE string (FE omits /api/v1)."""
    rel = be_path[len("/api/v1"):] or "/"
    rel_n = norm(rel)
    for p in fe_patterns:
        if norm(p) == rel_n:
            return True
        # FE sometimes includes full /api/v1 (sse-client) or builds path without leading segment
        if norm(p) == norm(be_path):
            return True
    return False

print("\n== BACKEND ENDPOINTS WITH NO FRONTEND STRING MATCH ==")
unused = [(mod, m, p) for mod, m, p in endpoints if not fe_match(p)]
for mod, m, p in sorted(unused):
    print(f"{mod:28s} {m:6s} {p}")
print(f"\nno-match count: {len(unused)} / {len(endpoints)}")
