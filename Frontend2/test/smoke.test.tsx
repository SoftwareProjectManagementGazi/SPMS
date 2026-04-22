import { describe, it, expect } from "vitest"
import { renderWithProviders } from "./helpers/render-with-providers"

describe("test rig smoke", () => {
  it("renders a trivial element with all providers mounted", () => {
    const { getByText } = renderWithProviders(<div>ok</div>)
    expect(getByText("ok")).toBeInTheDocument()
  })
})
