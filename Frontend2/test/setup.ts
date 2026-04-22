import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Auto-cleanup after each test
afterEach(() => {
  cleanup()
})

// localStorage mock hardened — vitest 1.6 + jsdom can present an empty
// `window.localStorage` object without .getItem/.setItem methods on some
// platforms (seen on Windows/Node 25). Always install a working in-memory
// shim so providers that read localStorage at mount never crash.
if (typeof window !== "undefined") {
  const hasWorkingLocalStorage =
    window.localStorage != null &&
    typeof window.localStorage.getItem === "function" &&
    typeof window.localStorage.setItem === "function"

  if (!hasWorkingLocalStorage) {
    const store: Record<string, string> = {}
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = String(v) },
        removeItem: (k: string) => { delete store[k] },
        clear: () => { for (const k of Object.keys(store)) delete store[k] },
        key: (i: number) => Object.keys(store)[i] ?? null,
        get length() { return Object.keys(store).length },
      },
      writable: true,
      configurable: true,
    })
  }

  // sessionStorage shim — AuthContext.logout writes to it; same defensive check.
  const hasWorkingSessionStorage =
    window.sessionStorage != null &&
    typeof window.sessionStorage.getItem === "function" &&
    typeof window.sessionStorage.setItem === "function"

  if (!hasWorkingSessionStorage) {
    const store: Record<string, string> = {}
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = String(v) },
        removeItem: (k: string) => { delete store[k] },
        clear: () => { for (const k of Object.keys(store)) delete store[k] },
        key: (i: number) => Object.keys(store)[i] ?? null,
        get length() { return Object.keys(store).length },
      },
      writable: true,
      configurable: true,
    })
  }
}
