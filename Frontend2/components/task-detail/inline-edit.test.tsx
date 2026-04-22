import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"
import { renderWithProviders } from "@/test/helpers/render-with-providers"

// Mock taskService.patchField — has to be hoisted because the module is imported
// transitively through InlineEdit below.
const patchFieldMock = vi.fn()
vi.mock("@/services/task-service", () => ({
  taskService: {
    patchField: (...args: unknown[]) => patchFieldMock(...args),
  },
}))

// Import AFTER vi.mock so the mock is in place.
import { InlineEdit } from "./inline-edit"

beforeEach(() => {
  patchFieldMock.mockReset()
  patchFieldMock.mockResolvedValue({ id: 1 })
})

describe("InlineEdit", () => {
  it("renders the display value in view mode and enters edit mode on click", () => {
    const { getByText, getByRole } = renderWithProviders(
      <InlineEdit
        taskId={1}
        field="title"
        value="hello"
        renderDisplay={(v) => <span>{v}</span>}
        renderEditor={(draft, setDraft) => (
          <input
            aria-label="title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
      />,
    )

    // Display button renders the value text.
    expect(getByText("hello")).toBeDefined()

    // Clicking the display button enters edit mode.
    fireEvent.click(getByText("hello"))
    const input = getByRole("textbox") as HTMLInputElement
    expect(input.value).toBe("hello")
  })

  it("disabled mode shows display and does NOT enter edit mode on click", () => {
    const { getByText, queryByRole } = renderWithProviders(
      <InlineEdit
        taskId={1}
        field="title"
        value="hello"
        disabled
        renderDisplay={(v) => <span>{v}</span>}
        renderEditor={(draft, setDraft) => (
          <input
            aria-label="title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
      />,
    )
    fireEvent.click(getByText("hello"))
    // No input should appear — still in display mode.
    expect(queryByRole("textbox")).toBeNull()
  })

  it("commits on Enter and calls taskService.patchField with the draft value", async () => {
    const { getByText, getByRole } = renderWithProviders(
      <InlineEdit
        taskId={42}
        field="title"
        value="old"
        renderDisplay={(v) => <span>{v}</span>}
        renderEditor={(draft, setDraft) => (
          <input
            aria-label="title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
      />,
    )
    fireEvent.click(getByText("old"))
    const input = getByRole("textbox") as HTMLInputElement
    fireEvent.change(input, { target: { value: "new" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => expect(patchFieldMock).toHaveBeenCalledTimes(1))
    expect(patchFieldMock).toHaveBeenCalledWith(42, "title", "new")
  })

  it("cancels on Escape without calling the mutation", async () => {
    const { getByText, getByRole, queryByRole } = renderWithProviders(
      <InlineEdit
        taskId={1}
        field="title"
        value="hello"
        renderDisplay={(v) => <span>{v}</span>}
        renderEditor={(draft, setDraft) => (
          <input
            aria-label="title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
      />,
    )
    fireEvent.click(getByText("hello"))
    const input = getByRole("textbox") as HTMLInputElement
    fireEvent.change(input, { target: { value: "changed" } })
    fireEvent.keyDown(input, { key: "Escape" })

    // Back in view mode — no input visible.
    await waitFor(() => expect(queryByRole("textbox")).toBeNull())
    expect(patchFieldMock).not.toHaveBeenCalled()
  })

  it("does NOT call the mutation when Enter is pressed but the draft equals the original value", async () => {
    const { getByText, getByRole } = renderWithProviders(
      <InlineEdit
        taskId={1}
        field="title"
        value="same"
        renderDisplay={(v) => <span>{v}</span>}
        renderEditor={(draft, setDraft) => (
          <input
            aria-label="title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
      />,
    )
    fireEvent.click(getByText("same"))
    const input = getByRole("textbox") as HTMLInputElement
    fireEvent.keyDown(input, { key: "Enter" })

    // Give React Query a microtask window to settle, then assert no call.
    await new Promise((r) => setTimeout(r, 10))
    expect(patchFieldMock).not.toHaveBeenCalled()
  })
})
