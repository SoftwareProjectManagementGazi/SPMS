// Reports migration v2 (Strategy D) — useChartCapabilities hook tests.
//
// Real TanStack QueryClient + mocked apiClient. Tests assert observable
// behaviour (URL hit, gating, error propagation, cache key shape) instead
// of just "the hook returned an object". Each test exercises the actual
// fetch wiring rather than re-implementing it.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useChartCapabilities, type ChartCapabilities } from "./use-chart-capabilities"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}))
import { apiClient } from "@/lib/api-client"

const SCRUM_WITH_SPRINTS: ChartCapabilities = {
  burndown: true,
  iteration: true,
  cfd: false,
  lead_cycle: true,
  phase_progress: false,
  team_load: true,
  summary: true,
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return { qc, Wrapper }
}

interface ProbeResult {
  data: ChartCapabilities | undefined
  isLoading: boolean
  isError: boolean
}

function probe(projectId: number | null | undefined) {
  const captured: { current: ProbeResult | null } = { current: null }
  function Probe() {
    const q = useChartCapabilities(projectId)
    captured.current = {
      data: q.data,
      isLoading: q.isLoading,
      isError: q.isError,
    }
    return null
  }
  return { Probe, captured }
}

describe("useChartCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("hits /projects/{id}/chart-capabilities and surfaces the response", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: SCRUM_WITH_SPRINTS })
    const { Wrapper } = makeWrapper()
    const { Probe, captured } = probe(42)

    render(<Probe />, { wrapper: Wrapper })

    await waitFor(() => expect(captured.current?.data).toEqual(SCRUM_WITH_SPRINTS))
    expect(apiClient.get).toHaveBeenCalledWith("/projects/42/chart-capabilities")
  })

  it("does NOT fire the request while projectId is null (enabled gate)", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: SCRUM_WITH_SPRINTS })
    const { Wrapper } = makeWrapper()
    const { Probe, captured } = probe(null)

    render(<Probe />, { wrapper: Wrapper })

    // Give TanStack a tick to settle; the disabled query should never call apiClient.
    await new Promise((r) => setTimeout(r, 20))

    expect(apiClient.get).not.toHaveBeenCalled()
    expect(captured.current?.data).toBeUndefined()
    // A disabled query is NOT in a loading state (fetchStatus === "idle"); the
    // hook surfaces `isLoading: false` because nothing is in-flight.
    expect(captured.current?.isLoading).toBe(false)
  })

  it("propagates server errors as isError=true (after retry)", async () => {
    ;(apiClient.get as any).mockRejectedValue(
      Object.assign(new Error("boom"), {
        response: { status: 404, data: { error_code: "PROJECT_NOT_FOUND" } },
      }),
    )
    const { Wrapper } = makeWrapper()
    const { Probe, captured } = probe(999)

    render(<Probe />, { wrapper: Wrapper })

    // The hook ships `retry: 1` (Wave 4 perf-default) so a 404 path needs
    // ~1s for the single retry to elapse before the query marks itself
    // errored. Bump the waitFor timeout to comfortably accommodate.
    await waitFor(() => expect(captured.current?.isError).toBe(true), {
      timeout: 4000,
    })
    expect(captured.current?.data).toBeUndefined()
    // Hook fired twice: initial attempt + the 1-retry.
    expect((apiClient.get as any).mock.calls.length).toBe(2)
  })

  it("uses a stable cache key per projectId so two consumers share the fetch", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: SCRUM_WITH_SPRINTS })
    const { qc, Wrapper } = makeWrapper()
    const a = probe(42)
    const b = probe(42)

    function TwoProbes() {
      return (
        <>
          <a.Probe />
          <b.Probe />
        </>
      )
    }
    render(<TwoProbes />, { wrapper: Wrapper })

    await waitFor(() => expect(a.captured.current?.data).toEqual(SCRUM_WITH_SPRINTS))
    // TanStack dedupes by queryKey — only ONE network call across both consumers.
    expect(apiClient.get).toHaveBeenCalledTimes(1)
    // Cache key shape is exactly what we documented in the hook.
    expect(qc.getQueryData(["chart", "capabilities", 42])).toEqual(SCRUM_WITH_SPRINTS)
  })

  it("re-keys on projectId change so caches do not collide", async () => {
    const PROJECT_A_CAPS: ChartCapabilities = {
      ...SCRUM_WITH_SPRINTS,
      burndown: true,
    }
    const PROJECT_B_CAPS: ChartCapabilities = {
      burndown: false,
      iteration: false,
      cfd: true,
      lead_cycle: true,
      phase_progress: true,
      team_load: true,
      summary: true,
    }
    ;(apiClient.get as any).mockImplementation((url: string) => {
      if (url.endsWith("/1/chart-capabilities")) return Promise.resolve({ data: PROJECT_A_CAPS })
      if (url.endsWith("/2/chart-capabilities")) return Promise.resolve({ data: PROJECT_B_CAPS })
      return Promise.reject(new Error("unexpected URL " + url))
    })
    const { qc, Wrapper } = makeWrapper()
    const a = probe(1)
    const b = probe(2)
    function Both() {
      return (
        <>
          <a.Probe />
          <b.Probe />
        </>
      )
    }
    render(<Both />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(a.captured.current?.data?.burndown).toBe(true)
      expect(b.captured.current?.data?.burndown).toBe(false)
    })
    expect(qc.getQueryData(["chart", "capabilities", 1])).toEqual(PROJECT_A_CAPS)
    expect(qc.getQueryData(["chart", "capabilities", 2])).toEqual(PROJECT_B_CAPS)
  })
})
