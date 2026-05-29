import * as React from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { fireEvent } from "@testing-library/react"
import { renderWithProviders } from "@/test/helpers/render-with-providers"

// Mock the TipTap rich editor (dynamically imported by DescriptionEditor) with
// a controlled <textarea> stub so the Plain/Rich toggle logic can be exercised
// without pulling ProseMirror into jsdom. The stub mirrors the real contract:
// value (HTML in) + onChange (HTML out).
vi.mock("./description-editor-rich", async () => {
  const ReactMod = await import("react")
  return {
    default: ({
      value,
      onChange,
    }: {
      value: string
      onChange: (v: string) => void
    }) =>
      ReactMod.createElement("textarea", {
        "aria-label": "rich-editor",
        value: value ?? "",
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(e.target.value),
      }),
  }
})

import { DescriptionEditor } from "./description-editor"

// Default editing mode is "plain" unless localStorage says otherwise; clear it
// so each test starts from a known state. Default language from AppProvider is "tr".
beforeEach(() => {
  window.localStorage.clear()
})

describe("DescriptionEditor — read mode (Bug 1: rich text must render as rich text)", () => {
  it("renders stored HTML as formatted elements, not stripped/literal text", () => {
    const { container } = renderWithProviders(
      <DescriptionEditor
        value="<p><strong>Bold</strong> and <em>italic</em></p><ul><li>one</li></ul>"
        onChange={() => {}}
      />,
    )
    const rich = container.querySelector(".rich-content")
    expect(rich).not.toBeNull()
    expect(rich!.querySelector("strong")?.textContent).toBe("Bold")
    expect(rich!.querySelector("em")?.textContent).toBe("italic")
    expect(rich!.querySelector("ul li")?.textContent).toBe("one")
    expect(rich!.textContent).not.toContain("<strong>")
  })

  it("sanitizes dangerous markup (script tags + event handlers) when rendering", () => {
    const { container } = renderWithProviders(
      <DescriptionEditor
        value={`<p>safe</p><script>alert(1)</script><img src="x" onerror="alert(2)">`}
        onChange={() => {}}
      />,
    )
    const rich = container.querySelector(".rich-content")!
    expect(rich.querySelector("script")).toBeNull()
    expect(rich.querySelector("img")?.getAttribute("onerror")).toBeNull()
    expect(rich.textContent).toContain("safe")
  })

  it("renders plain-text values verbatim with newlines preserved (no HTML path)", () => {
    const { container, getByText } = renderWithProviders(
      <DescriptionEditor value={"line one\nline two"} onChange={() => {}} />,
    )
    expect(container.querySelector(".rich-content")).toBeNull()
    expect(getByText(/line one/).textContent).toBe("line one\nline two")
  })

  it("shows the placeholder for an effectively-empty rich value (<p></p>)", () => {
    const { getByText } = renderWithProviders(
      <DescriptionEditor value="<p></p>" onChange={() => {}} />,
    )
    expect(getByText("Açıklama eklemek için tıklayın…")).toBeDefined()
  })
})

describe("DescriptionEditor — Plain mode never leaks raw HTML tags (Bug 2)", () => {
  it("opening an HTML value in Plain mode strips tags into the textarea", () => {
    const { container, getByRole } = renderWithProviders(
      <DescriptionEditor
        value="<p>hello <strong>world</strong></p>"
        onChange={() => {}}
      />,
    )
    fireEvent.click(container.querySelector('[role="button"]') as HTMLElement)
    const textarea = getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.value).toBe("hello world")
    expect(textarea.value).not.toContain("<strong>")
    expect(textarea.value).not.toContain("<p>")
  })
})

describe("DescriptionEditor — lossless Plain/Rich toggle + correct commit", () => {
  it("Rich → Plain → Bitir commits the stripped plain text (not the old rich HTML)", async () => {
    window.localStorage.setItem("spms.description.mode", "rich")
    const onChange = vi.fn()
    const { container, getByText, findByLabelText } = renderWithProviders(
      <DescriptionEditor
        value="<p><strong>bold</strong> text</p>"
        onChange={onChange}
      />,
    )
    fireEvent.click(container.querySelector('[role="button"]') as HTMLElement)
    const rich = (await findByLabelText("rich-editor")) as HTMLTextAreaElement
    expect(rich.value).toContain("<strong>")

    fireEvent.click(getByText("Düz")) // → Plain
    fireEvent.click(getByText("Bitir"))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("bold text")
  })

  it("Rich → Plain → Rich preserves formatting (round-trip does not destroy bold)", async () => {
    window.localStorage.setItem("spms.description.mode", "rich")
    const onChange = vi.fn()
    const { container, getByText, findByLabelText } = renderWithProviders(
      <DescriptionEditor value="<p><strong>bold</strong></p>" onChange={onChange} />,
    )
    fireEvent.click(container.querySelector('[role="button"]') as HTMLElement)
    await findByLabelText("rich-editor")

    fireEvent.click(getByText("Düz")) // → Plain
    fireEvent.click(getByText("Zengin")) // → Rich (no plain edit)

    const rich = (await findByLabelText("rich-editor")) as HTMLTextAreaElement
    expect(rich.value).toBe("<p><strong>bold</strong></p>")

    // Nothing changed → committing performs no write.
    fireEvent.click(getByText("Bitir"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("editing in Plain then switching to Rich adopts the plain text as HTML", async () => {
    const onChange = vi.fn()
    const { container, getByText, getByPlaceholderText, findByLabelText } =
      renderWithProviders(
        <DescriptionEditor value="hello" onChange={onChange} />,
      )
    fireEvent.click(container.querySelector('[role="button"]') as HTMLElement)
    const textarea = getByPlaceholderText(/Görev açıklaması/) as HTMLTextAreaElement
    expect(textarea.value).toBe("hello")
    fireEvent.change(textarea, { target: { value: "hello world" } })

    fireEvent.click(getByText("Zengin")) // → Rich, adopt plain edit
    const rich = (await findByLabelText("rich-editor")) as HTMLTextAreaElement
    expect(rich.value).toBe("<p>hello world</p>")

    fireEvent.click(getByText("Bitir"))
    expect(onChange).toHaveBeenCalledWith("<p>hello world</p>")
  })
})
