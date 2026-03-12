# Deferred Items — Phase 01

## Pre-existing TypeScript Errors (out of scope for 01-06)

Discovered during Task 1 TypeScript verification (`npx tsc --noEmit`).
These errors existed before Plan 01-06 and are NOT caused by 01-06 changes.

### 1. `lib/mock-data.ts` — multiple type errors
- `role` field typed as `string` but `User` now expects `{ name: string }`
- `TaskPriority` values use lowercase (`"high"`, `"medium"`) instead of uppercase enum (`"HIGH"`, `"MEDIUM"`)
- `parentTaskId` property doesn't exist on `SubTask` type

### 2. `services/project-service.ts`
- `role` assigned as `string` instead of `{ name: string }` in `placeholderLead`

### 3. `services/auth-service.ts`
- `description` property not present on `User.role` type definition

### 4. `components/task-detail/task-header.tsx`
- Accessing `.project` on a union type that includes `SubTask` (which doesn't have that field)

### 5. `app/page.tsx`
- `userData.role` possibly undefined

**Recommended fix:** Address in a dedicated cleanup plan or at start of Phase 2.
