import { afterEach, beforeEach, expect, it } from "vitest"
import { DEFAULT_SETTINGS } from "../utils/settings"
import { useAppStore } from "./progressionStore"
import { startUrlSync } from "./urlSync"

let stop: (() => void) | undefined

const actions = () => useAppStore.getState().actions
const urlCode = () => decodeURIComponent(window.location.search + window.location.hash)

beforeEach(() => {
  useAppStore.setState({ chords: [], settings: DEFAULT_SETTINGS, past: [], generation: 0 })
  window.history.replaceState(null, "", "/")
})

afterEach(() => {
  stop?.()
  stop = undefined
})

it("loads the code in the url on start, # in chord names included", () => {
  window.history.replaceState(null, "", "/?s=h:60:p&p=(1C#)(1G)")

  stop = startUrlSync()

  const { chords, settings } = useAppStore.getState()
  expect(chords.map((chord) => chord.selectedChord.noteLetter)).toEqual(["C#", "G"])
  expect(settings.synth).toBe("h")
})

it("leaves a bare url alone while there's nothing to share", () => {
  stop = startUrlSync()

  expect(window.location.search).toBe("")
})

it("adds a history entry for a progression change, and replaces it for a settings change", () => {
  stop = startUrlSync()
  const start = window.history.length

  actions().addChord()
  expect(urlCode()).toBe("?s=p:80:p&p=(1C)")
  expect(window.history.length).toBe(start + 1)

  actions().setVolume(50)
  expect(urlCode()).toBe("?s=p:50:p&p=(1C)")
  expect(window.history.length).toBe(start + 1)
})

it("keeps the base path", () => {
  window.history.replaceState(null, "", "/chord-buildr/")
  stop = startUrlSync()

  actions().addChord()

  expect(window.location.pathname).toBe("/chord-buildr/")
})

it("back and forward load the code they land on", () => {
  stop = startUrlSync()
  actions().addChord()
  const length = window.history.length

  window.history.replaceState(null, "", "/?s=p:80:g&p=(1Am)(1F)")
  window.dispatchEvent(new PopStateEvent("popstate"))

  const { chords, settings } = useAppStore.getState()
  expect(chords.map((chord) => chord.selectedChord.noteLetter)).toEqual(["A", "F"])
  expect(settings.format).toBe("g")
  // loading it doesn't write it back as a new entry
  expect(window.history.length).toBe(length)
})
