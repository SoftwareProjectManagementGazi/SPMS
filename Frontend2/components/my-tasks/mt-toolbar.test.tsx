import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render } from "@testing-library/react"

import {
  MTToolbar,
  type GroupBy,
  type Priority,
  type SortKey,
} from "./mt-toolbar"
import type { ViewId } from "./saved-views-tabs"
import type { MTDensityKind } from "./mt-density-icon"

const ZERO_COUNTS: Record<ViewId, number> = {
  today: 2,
  overdue: 1,
  upcoming: 4,
  starred: 0,
  all: 7,
  done: 3,
}

interface RigState {
  view: ViewId
  groupBy: GroupBy
  search: string
  priFilter: Priority[]
  density: MTDensityKind
  sort: SortKey
}

function Rig({
  initial,
  onChange,
}: {
  initial: RigState
  onChange?: (s: RigState) => void
}) {
  const [s, setS] = React.useState<RigState>(initial)
  const update = (patch: Partial<RigState>) => {
    setS((prev) => {
      const next = { ...prev, ...patch }
      onChange?.(next)
      return next
    })
  }
  return (
    <MTToolbar
      lang="tr"
      view={s.view}
      setView={(v) => update({ view: v })}
      groupBy={s.groupBy}
      setGroupBy={(g) => update({ groupBy: g })}
      search={s.search}
      setSearch={(x) => update({ search: x })}
      priFilter={s.priFilter}
      setPriFilter={(p) => update({ priFilter: p })}
      density={s.density}
      setDensity={(d) => update({ density: d })}
      sort={s.sort}
      setSort={(x) => update({ sort: x })}
      viewCounts={ZERO_COUNTS}
    />
  )
}

const INITIAL: RigState = {
  view: "today",
  groupBy: "due",
  search: "",
  priFilter: [],
  density: "cozy",
  sort: "smart",
}

describe("MTToolbar", () => {
  it("renders all 6 saved-view pills", () => {
    const { getByText } = render(<Rig initial={INITIAL} />)
    expect(getByText("Bugün")).toBeInTheDocument()
    expect(getByText("Gecikmiş")).toBeInTheDocument()
    expect(getByText("Yaklaşan")).toBeInTheDocument()
    expect(getByText("Yıldızlı")).toBeInTheDocument()
    expect(getByText("Tümü")).toBeInTheDocument()
    expect(getByText("Tamamlanan")).toBeInTheDocument()
  })

  it("HIDES the saved-view row when compact=true", () => {
    const { queryByTestId } = render(
      <MTToolbar
        compact
        lang="tr"
        view="all"
        setView={() => {}}
        groupBy="due"
        setGroupBy={() => {}}
        search=""
        setSearch={() => {}}
        priFilter={[]}
        setPriFilter={() => {}}
        density="cozy"
        setDensity={() => {}}
        sort="smart"
        setSort={() => {}}
        viewCounts={ZERO_COUNTS}
      />
    )
    expect(queryByTestId("mt-views-row")).toBeNull()
  })

  it("clicking a view pill calls setView with that id", () => {
    const onChange = vi.fn()
    const { getByText } = render(
      <Rig initial={INITIAL} onChange={onChange} />
    )
    fireEvent.click(getByText("Tümü"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ view: "all" })
    )
  })

  it("clicking a priority chip toggles priFilter", () => {
    const onChange = vi.fn()
    const { getByText } = render(
      <Rig initial={INITIAL} onChange={onChange} />
    )
    fireEvent.click(getByText("Kritik"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priFilter: ["critical"] })
    )
  })

  it("clicking a density button switches density", () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <Rig initial={INITIAL} onChange={onChange} />
    )
    // density is the 2nd radiogroup (after group-by). Pick the 'compact'
    // density button by its title text.
    const compactBtn = getAllByRole("radio", { name: "Sıkı" })[0]
    fireEvent.click(compactBtn)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ density: "compact" })
    )
  })

  it("typing in the search input updates state", () => {
    const onChange = vi.fn()
    const { getByPlaceholderText } = render(
      <Rig initial={INITIAL} onChange={onChange} />
    )
    const input = getByPlaceholderText("Görevlerde ara…") as HTMLInputElement
    fireEvent.change(input, { target: { value: "auth" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "auth" })
    )
  })

  it("clicking a group-by button changes groupBy", () => {
    const onChange = vi.fn()
    const { getByTitle } = render(
      <Rig initial={INITIAL} onChange={onChange} />
    )
    fireEvent.click(getByTitle("Önceliğe göre"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: "priority" })
    )
  })
})
