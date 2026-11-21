import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HeaderComponent } from "./Layout/HeaderComponent"
import { PianoBoardComponent } from "./PianoBoardComponent"
import { useAppStore } from "../store/progressionStore"
import { DEFAULT_SETTINGS } from "../utils/settings"

// the flow under test is the progression's, not the sound's
vi.mock("../audio/player", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../audio/player")>()),
  playChordById: vi.fn(),
  prepareAudio: vi.fn()
}))

beforeEach(() => {
  useAppStore.setState({ chords: [], settings: DEFAULT_SETTINGS, past: [], generation: 0 })
})

const renderApp = () => render(
  <>
    <HeaderComponent />
    <PianoBoardComponent />
  </>
)

// the chord names in the header's strip, in order
const strip = () =>
  Array.from(document.querySelectorAll("nav [data-piano-id]")).map((link) => link.textContent)

const cards = () => Array.from(document.querySelectorAll<HTMLElement>('[id^="piano-"]'))

// a key on a card's piano, e.g. ("E", 1)
const pianoKey = (card: HTMLElement, note: string, octave: number) => {
  const key = card.querySelector<HTMLElement>(`li.${CSS.escape(`${note}-${octave}`)}`)
  if (!key) throw new Error(`no ${note}${octave} key on the card`)
  return key
}

describe("building a progression", () => {
  it("adds chords from the header, transposes from the key chord, and undoes the transpose", () => {
    renderApp()
    expect(screen.getByText("Welcome to Chord Buildr")).toBeTruthy()

    // two chords, the second moved up to E on its own piano
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    expect(strip()).toEqual(["C", "C"])
    expect(cards()).toHaveLength(2)

    const [first, second] = cards() as [HTMLElement, HTMLElement]
    fireEvent.click(pianoKey(second, "E", 1))
    expect(strip()).toEqual(["C", "E"])

    // the first chord becomes the key, and moving it to D carries the
    // progression along a whole step
    fireEvent.click(within(first).getByRole("checkbox", { name: "Key" }))
    fireEvent.click(pianoKey(first, "D", 1))
    expect(strip()).toEqual(["D", "F#"])

    // the transpose is one undo step
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(strip()).toEqual(["C", "E"])
  })

  it("clears the board back to the welcome screen", () => {
    renderApp()
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    expect(cards()).toHaveLength(1)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(strip()).toEqual([])
    expect(screen.getByText("Welcome to Chord Buildr")).toBeTruthy()
    expect(screen.getByText("No chords yet")).toBeTruthy()

    // and clearing can be undone too
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(strip()).toEqual(["C"])
  })
})
