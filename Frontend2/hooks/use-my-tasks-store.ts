"use client"

// useMyTasksStore — localStorage-backed state for MyTasksExperience overrides.
//
// Mirrors the prototype's MT_STORE_KEY shape from `my-tasks.jsx`:
//   { overrides, extras, starred, completedAt }
//
// Hydration pattern: the store renders with DEFAULT on SSR and first client
// render, then useEffect loads the persisted value after mount. This matches
// the AppContext approach (context/app-context.tsx) and avoids the
// hydration-mismatch warning that would fire if localStorage values leaked
// into the first SSR/CSR paint.

import * as React from "react"
import type { Task } from "@/services/task-service"

const STORE_KEY = "spms.myTasksStore"

export interface MyTasksStore {
  /** Map of task id → partial-Task field overrides (e.g. user-edited title). */
  overrides: Record<string, Partial<Task>>
  /** Locally-created tasks not yet synced to the backend. */
  extras: Task[]
  /** IDs of tasks the current user has starred. */
  starred: number[]
  /** Map of task id → ISO timestamp of local completion (for animation). */
  completedAt: Record<number, string>
}

const DEFAULT: MyTasksStore = {
  overrides: {},
  extras: [],
  starred: [],
  completedAt: {},
}

function load(): MyTasksStore {
  if (typeof window === "undefined") return DEFAULT
  try {
    const v = window.localStorage.getItem(STORE_KEY)
    if (!v) return DEFAULT
    const parsed = JSON.parse(v) as Partial<MyTasksStore>
    return {
      overrides: parsed.overrides ?? {},
      extras: parsed.extras ?? [],
      starred: parsed.starred ?? [],
      completedAt: parsed.completedAt ?? {},
    }
  } catch {
    return DEFAULT
  }
}

function save(s: MyTasksStore): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(s))
  } catch {
    // swallow quota / security errors — the store is purely user-experience
    // state (no data loss beyond local decorations) so surfacing an error
    // would degrade UX more than silently skipping the write.
  }
}

type StoreUpdater = (prev: MyTasksStore) => MyTasksStore

export function useMyTasksStore(): [MyTasksStore, (u: StoreUpdater) => void] {
  const [store, setStore] = React.useState<MyTasksStore>(DEFAULT)
  const hydrated = React.useRef(false)

  // Hydrate after mount — never during SSR. `hydrated` gates the persist
  // side-effect so we don't overwrite the stored value with DEFAULT on the
  // initial paint when load() would otherwise return real data.
  React.useEffect(() => {
    setStore(load())
    hydrated.current = true
  }, [])

  const update = React.useCallback((u: StoreUpdater) => {
    setStore((prev) => {
      const next = u(prev)
      if (hydrated.current) save(next)
      return next
    })
  }, [])

  return [store, update]
}
