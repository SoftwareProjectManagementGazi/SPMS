import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { MTDensityIcon } from "./mt-density-icon"

describe("MTDensityIcon", () => {
  it("renders 3 stacked bars regardless of density", () => {
    for (const kind of ["compact", "cozy", "comfortable"] as const) {
      const { container, unmount } = render(<MTDensityIcon kind={kind} />)
      // outer span + 3 inner bars
      expect(container.querySelectorAll("span").length).toBe(4)
      unmount()
    }
  })

  it("uses smaller gap+height for compact than for comfortable", () => {
    // We check the inline style on the wrapper span directly. The compact
    // variant has gap=2 and bar-height=1.5; comfortable has gap=4 and 2.
    const compact = render(<MTDensityIcon kind="compact" />).container
      .firstElementChild as HTMLElement
    const comfortable = render(<MTDensityIcon kind="comfortable" />).container
      .firstElementChild as HTMLElement
    // gap is set via style.gap (numbers become "2px")
    expect(compact.style.gap).toBe("2px")
    expect(comfortable.style.gap).toBe("4px")
  })
})
