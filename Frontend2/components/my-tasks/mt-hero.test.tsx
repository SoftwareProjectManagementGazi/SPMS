import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { MTHero } from "./mt-hero"

const STATS = { overdue: 0, today: 3, week: 5, done: 2 }

describe("MTHero", () => {
  it("renders the 4 stat tiles with their values", () => {
    const { getByText } = render(
      <MTHero stats={STATS} lang="tr" nowRef={new Date("2026-04-25T10:00:00Z")} />
    )
    // Two non-zero values + a zero (overdue) and the done value.
    expect(getByText("0")).toBeInTheDocument()
    expect(getByText("3")).toBeInTheDocument()
    expect(getByText("5")).toBeInTheDocument()
    expect(getByText("2")).toBeInTheDocument()
  })

  it("uses the overdue copy when overdue > 0", () => {
    const { getByText } = render(
      <MTHero
        stats={{ ...STATS, overdue: 4 }}
        lang="tr"
        nowRef={new Date("2026-04-25T10:00:00Z")}
      />
    )
    expect(getByText(/4 gecikmiş görev/i)).toBeInTheDocument()
  })

  it("uses the today copy when no tasks are overdue", () => {
    const { getByText } = render(
      <MTHero stats={STATS} lang="tr" nowRef={new Date("2026-04-25T10:00:00Z")} />
    )
    expect(getByText(/3 görev bugün için planlandı/i)).toBeInTheDocument()
  })

  it("greets in TR morning before noon", () => {
    const { getByText } = render(
      <MTHero
        stats={STATS}
        lang="tr"
        firstName="Yusuf"
        nowRef={new Date("2026-04-25T08:00:00")}
      />
    )
    expect(getByText(/Günaydın, Yusuf/)).toBeInTheDocument()
  })

  it("greets in EN evening after 18:00", () => {
    const { getByText } = render(
      <MTHero
        stats={STATS}
        lang="en"
        nowRef={new Date("2026-04-25T20:00:00")}
      />
    )
    expect(getByText(/Good evening/)).toBeInTheDocument()
  })

  it("respects an explicit subtitle prop over computed copy", () => {
    const { getByText } = render(
      <MTHero
        stats={STATS}
        lang="en"
        subtitle="Custom subtitle line"
        nowRef={new Date("2026-04-25T10:00:00")}
      />
    )
    expect(getByText("Custom subtitle line")).toBeInTheDocument()
  })
})
