import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { MTEmpty } from "./mt-empty"

describe("MTEmpty", () => {
  it("renders the today TR copy when lang=tr and view=today", () => {
    const { getByText } = render(<MTEmpty lang="tr" view="today" />)
    expect(getByText(/sakin bir gün/i)).toBeInTheDocument()
  })

  it("renders the overdue EN copy when lang=en and view=overdue", () => {
    const { getByText } = render(<MTEmpty lang="en" view="overdue" />)
    expect(getByText(/no overdue tasks/i)).toBeInTheDocument()
  })

  it("falls back to 'all' message for an unknown view", () => {
    // Cast through unknown so TS allows the deliberate invalid input.
    const { getByText } = render(
      <MTEmpty
        lang="tr"
        view={"made-up" as unknown as "all"}
      />
    )
    expect(getByText(/aktif görev yok/i)).toBeInTheDocument()
  })

  it("always renders the 'add a task' nudge subline", () => {
    const { getByText } = render(<MTEmpty lang="en" view="all" />)
    expect(getByText(/how about adding a new task/i)).toBeInTheDocument()
  })
})
