# Phase 10: Shell Pages & Project Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 10-shell-pages-project-features
**Areas discussed:** API Integration, Create Wizard Routing, Settings Page Scope, Auth Routing & State, Dashboard Content, Status Change UX, Projects Card Layout, Admin Pages Scope

---

## API Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Real backend from day 1 | Pages call actual Phase 9 APIs, live data | ✓ |
| Mock data first, wire later | Hardcoded data, swap to real API later | |
| Hybrid — mock for some pages | Mix of real and mock per page | |

**User's choice:** Real backend from day 1

---

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage + Authorization header | Reimplement legacy pattern (axios interceptors) | ✓ |
| httpOnly cookie | More secure, requires CORS cookie config | |
| You decide | Claude chooses based on existing backend | |

**User's choice:** Check legacy Frontend — confirmed localStorage + Bearer token (same as legacy pattern)

---

| Option | Description | Selected |
|--------|-------------|----------|
| (shell)/layout.tsx | QueryClientProvider only wraps authenticated pages | ✓ |
| Root layout.tsx | Wraps everything including Login | |

**User's choice:** (shell)/layout.tsx (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| axios — same as legacy | Re-implement apiClient + interceptors | ✓ |
| Native fetch + custom wrapper | Lighter, no dependency | |

**User's choice:** axios — same as legacy

---

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror legacy structure (services/ + hooks/) | Same file layout, re-implement logic | ✓ |
| Flat lib/ structure | All in lib/, fewer folders | |

**User's choice:** Mirror legacy structure — "best practice is the key, legacy code is not junky, we can use most of the logic if it is robust"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notifications | Global dismissable toasts on error | ✓ |
| Inline error states | Per-component error messages | |

**User's choice:** Toast notifications

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated AuthContext | Separate from AppContext | ✓ |
| Fold into existing AppContext | Single provider | |

**User's choice:** Dedicated AuthContext

---

**Additional API decisions (user-initiated):**
- React Query DevTools: **include in dev mode**
- Session-expired page: **required** (same as legacy Frontend behavior)

---

## Create Wizard Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Separate full page /projects/new | Standard Next.js pattern, URL-based | ✓ |
| Full-screen modal overlay | Prototype-style overlay, URL stays at /projects | |

**User's choice:** Separate full page /projects/new

---

| Option | Description | Selected |
|--------|-------------|----------|
| URL search params (?step=1) | Browser back/forward works, shareable | ✓ |
| React state only | Simpler, but back button leaves page | |

**User's choice:** URL search params (?step=1)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Project detail page /projects/{id} | Redirect after creation | ✓ |
| Projects list /projects | Return to grid | |

**User's choice:** Project detail page (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Validate before advancing | Required fields must be filled | ✓ |
| Free navigation | Jump between steps, validate at end | |

**User's choice:** Validate before advancing

---

| Option | Description | Selected |
|--------|-------------|----------|
| Load from GET /process-templates | Dynamic, backend-driven | ✓ |
| Hardcoded in frontend | Static template list | |

**User's choice:** Load from GET /process-templates

---

| Option | Description | Selected |
|--------|-------------|----------|
| Template preview only | Read-only workflow node preview | ✓ |
| Skip step 3 for now | Placeholder until Phase 12 | |

**User's choice:** Template preview only (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| sessionStorage draft | Restore form data on step back | ✓ |
| React state only (volatile) | Data lost on browser Back | |
| No draft — start fresh | Always blank wizard | |

**User's choice:** sessionStorage draft

---

## Settings Page Scope

**User's choice:** All 5 prototype tabs (Profil, Tercihler, Görünüm, Bildirimler, Güvenlik)

**Notes:** Prototype settings.jsx has exactly these 5 tabs — no Lifecycle/Workflow/Artefakt tabs exist in prototype (those are Phase 12 additions from UI-TASARIM-PLANI.md).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Language + UI density only | Other prefs visual-only | ✓ |
| All wired | All preferences have real behavior | |

**User's choice:** Language + UI density only wired; others visual-only for now.

---

**Security tab:** Password change form only (current + new + confirm). User confirmed this matches prototype SecuritySection.

---

## Auth Routing & State

**User's note:** "We don't want a register page, its a closed system, admin must add user or send invite"

**Decision:** No register page. Auth pages: Login, Session-expired, Forgot password only.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Separate (auth) route group | Frontend2/app/(auth)/ | ✓ |
| Root-level pages | app/login/page.tsx | |

**User's choice:** Separate (auth) route group

---

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js middleware | Server-side route guard | ✓ |
| Client-side guard in (shell) layout | useEffect redirect | |

**User's choice:** Next.js middleware

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dual storage: localStorage + cookie flag | Token in localStorage, auth_session cookie for middleware | ✓ |
| Client-side guard only | Drop middleware | |

**User's choice:** Dual storage (localStorage for API + `auth_session` cookie for middleware)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard /dashboard | Always redirect after login | ✓ |
| Last visited page | Restore URL, more complex | |

**User's choice:** Dashboard /dashboard

---

## Dashboard Content

| Widget | Live API? | Source |
|--------|-----------|--------|
| 4 StatCards | ✓ | GET /projects + GET /tasks |
| Portfolio Table | ✓ | GET /projects?status=ACTIVE |
| Activity Feed | ✓ | New GET /activity?global=true endpoint |

**User's choice:** All three live from API

---

| Option | Description | Selected |
|--------|-------------|----------|
| New GET /activity?global=true endpoint | Backend addition in Phase 10 | ✓ |
| Fetch top 3-5 projects and merge | N+1 frontend calls | |
| Defer — static placeholder | Wire in Phase 13 | |

**User's choice:** New global activity endpoint (Phase 10 backend addition)

---

## Status Change Confirmation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmation for Archive only | Destructive action only | |
| Confirmation for all status changes | Every action gets a dialog | ✓ |
| No confirmation — undo toast | Immediate with 5s undo | |

**User's choice:** Confirmation dialog for ALL status changes (Complete/Hold/Archive)

---

## Projects Card Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 3-column responsive grid, prototype info | Name, key, badge, status, progress, lead, team, date | ✓ |
| 2-column wider cards | Larger cards with more detail | |

**User's choice:** 3-column responsive grid matching prototype (Recommended)

---

## Admin Pages Scope

| Option | Description | Selected |
|--------|-------------|----------|
| No — defer to future phase | Focus on 5 core pages | ✓ |
| Include Teams page /teams | Convert placeholder | |
| Full admin section | User/team/template management | |

**User's choice:** No — defer to future phase

---

## Claude's Discretion

- Toast component implementation (custom from prototype styles)
- Progress % calculation for project cards
- Middleware matcher pattern exact paths
- Confirmation dialog component styling
- sessionStorage key naming

## Deferred Ideas

- Admin panel (user/team management) — future phase
- Self-registration page — not needed (closed system)
- Teams page conversion — not in Phase 10 scope
- Reports page — Phase 13
- Lifecycle/Artefakt settings tabs — Phase 12
- ProjectDetail page — Phase 11
- Command palette, default page, week start wiring — deferred from Tercihler tab
