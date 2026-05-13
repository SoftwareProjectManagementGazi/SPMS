# Group F: Frontend QueryClientProvider (2 tests, not 18)

## Scope correction

The brief described "18 failing tests across 8 files due to QueryClientProvider".
Actual run shows **18 failing tests across 8 files**, but only **2 of those 18
tests (1 of the 8 files)** raise `No QueryClient set`. The other 16 failures
are unrelated (text-matcher / DOM / date-math regressions in Lifecycle and
TimelineTab). They are out of scope for "Group F" and belong to other groups.

## Root cause (the 2 QueryClient failures)

Commit `17818cab fix(15-hotfix2): ... role picker dynamic+searchable ...`
(on top of `005a4cdd feat(15-09)` which introduced `hooks/use-roles.ts`)
added a live `useRoles()` TanStack Query call inside
`Frontend2/components/admin/users/user-row-actions.tsx:69`:

```ts
const rolesQ = useRoles()   // useQuery → needs QueryClientProvider
```

`UsersTable` (`users-table.tsx`) renders `<UserRow>` which renders
`<UserRowActions>` (`user-row.tsx:37,158`). The friend-authored
`components/admin/users/users-table.test.tsx` (Plan 14-03 Task 1, pre-Phase 15)
renders `<UsersTable>` with bare `render()` from `@testing-library/react` —
no `QueryClientProvider` wrapper. It mocks every other admin hook
(`use-deactivate-user`, `use-reset-password`, `use-change-role`,
`use-bulk-action`) but does NOT mock `@/hooks/use-roles`, so `useQuery` from
TanStack Query is invoked inside the test renderer and throws on `useQueryClient`.
Cases 1 and 2 pass because the loading/empty branches return early before
any row (and hence any `UserRowActions`) is rendered.

## All failing test files (8 total — only file #1 is QueryClient)

- `components/admin/users/users-table.test.tsx` — **QueryClient (2 tests)**
- `components/lifecycle/artifacts-subtab.test.tsx` — text/DOM mismatches (5)
- `components/lifecycle/history-subtab.test.tsx` — text mismatches (2)
- `components/lifecycle/milestones-subtab.test.tsx` — spy not called (2)
- `components/lifecycle/overview-subtab.test.tsx` — text mismatch (1)
- `components/lifecycle/phase-gate-expand.test.tsx` — duplicate/missing text (2)
- `components/project-detail/project-detail-shell.test.tsx` — text mismatch (1)
- `components/project-detail/timeline-tab.test.tsx` — date-range math (3)

## Existing test infrastructure

Yes — a `renderWithProviders` helper already exists at
`Frontend2/test/helpers/render-with-providers.tsx:19`. It wraps
`QueryClientProvider` + `AppProvider` + `AuthProvider` + `ToastProvider` +
`TaskModalProvider`, and exports `makeTestQueryClient()` with `retry: false`,
`staleTime: 0`. The lifecycle suite has a parallel local helper
(`components/lifecycle/__tests__/setup.tsx:101` `withQueryClient`).

Three test files already mock `@/hooks/use-roles` (Option C precedent):
`components/admin/users/user-row-actions.test.tsx`,
`components/admin/roles/role-card.test.tsx`,
`hooks/use-roles.test.ts`.

`users-table.test.tsx` is the only failing case — and it already mocks every
sibling admin hook in exactly the Option-C style. The omission of `use-roles`
is a clear oversight from the Phase-14 → Phase-15 merge, not a design choice.

## Recommended fix — Option C (mock `useRoles`)

Adding ~3 lines that mirror the existing mocks for `use-deactivate-user` /
`use-change-role` keeps the test self-contained, parallels how the sibling
`user-row-actions.test.tsx` already handles `useRoles`, and avoids touching
the 2 passing tests in the file (loading + empty cases never render
UserRowActions, so a Provider wrap would be net-zero for them too — but
mocking is one local edit, not a structural refactor).

Option A (`renderWithProviders`) is overkill here since the test already
mocks 4 admin hooks identically; converting one (`use-roles`) is consistent.
Option B (inline Provider) would also work but leaves a real `useQuery` call
running with a stub `queryFn`, which can flake on next refactor.

Exact patch — insert after the existing `use-bulk-action` mock at
`components/admin/users/users-table.test.tsx:71`:

```ts
vi.mock("@/hooks/use-roles", () => ({
  useRoles: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    error: null,
  }),
}))
```

This returns the `RoleListResponse` shape that
`user-row-actions.tsx:143` reads as `rolesQ.data?.items ?? []`, so the
4-item MoreMenu still renders without firing TanStack Query.

## Files to modify

- `Frontend2/components/admin/users/users-table.test.tsx:71` — add `vi.mock("@/hooks/use-roles", ...)` block (~7 lines)

No new helper file needed; existing `test/helpers/render-with-providers.tsx`
remains available for future tests that genuinely need provider wiring.
