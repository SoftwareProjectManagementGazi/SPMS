"use client"

// useLocalStoragePref — useState + localStorage persistence with SSR/CSR
// hydration safety baked in.
//
// Renders the supplied default on the first paint AND on the server. After
// the component mounts on the client, a useEffect swaps in the stored value;
// a `hydrated` ref then gates the persist effect so the post-mount load
// doesn't immediately clobber the value it just read.
//
// Keys are namespaced by callers (e.g. "mt.view"); the helper prepends the
// project-wide "spms." prefix so all SPMS keys share a flat namespace.

import * as React from "react"

const PREFIX = "spms."

function load<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try {
    const v = window.localStorage.getItem(PREFIX + key)
    return v !== null ? (JSON.parse(v) as T) : def
  } catch {
    return def
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* Safari Private / quota — UX state, not data */
  }
}

export function useLocalStoragePref<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(defaultValue)
  const hydrated = React.useRef(false)

  // Mount-only load. Intentionally does NOT depend on `key` / `defaultValue` —
  // they are stable for the component's lifetime; treating them as deps would
  // re-load on every render and stomp user changes.
  React.useEffect(() => {
    setValue(load(key, defaultValue))
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (hydrated.current) save(key, value)
  }, [key, value])

  return [value, setValue]
}
