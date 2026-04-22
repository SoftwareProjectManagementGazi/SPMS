import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Auto-cleanup after each test
afterEach(() => {
  cleanup()
})

// localStorage mock hardened — tests that mutate localStorage do not bleed across
if (typeof window !== "undefined" && !window.localStorage) {
  const store: Record<string, string> = {}
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v) },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { for (const k of Object.keys(store)) delete store[k] },
    },
    writable: true,
  })
}
