import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { parseProgressionCode, parseShareCode, serializeProgressionCode } from "../codec"
import type { ChordPiano } from "../utils/chordPianoHandler"
import { DEFAULT_SETTINGS, DEFAULT_SOUND, EQSettings, Settings, SoundSettings } from "../utils/settings"
import {
  ProgressionItem,
  arrangeProgression,
  removeChord,
  toggleBreakAfter
} from "../utils/sectionBreaks"
import {
  findChord,
  getKeyChord,
  setChordRoot,
  setProgKey,
  setShowFlats,
  setSlashChord
} from "./progressionEdits"

/**
 * the progression and its settings. components read what they need
 * through selectors (useChord, useSettings, ...), so a change only
 * re-renders the components whose slice changed. the url is kept in step
 * by a subscriber (see urlSync), and what's playing lives in its own store
 * (see playbackStore)
 */

// how many steps back undo can go
const MAX_UNDO = 100

export interface ProgressionActions {
  addChord: () => void
  removeChord: (id: number) => void
  // lays the chords and breaks out in a new order, e.g. after a drag
  arrangeProgression: (items: ProgressionItem[]) => void
  // adds or removes the section break right after a chord
  toggleSectionBreak: (id: number) => void
  // ends the current section, so the next chord added starts a new one
  addSectionBreak: () => void

  setChordRoot: (id: number, noteLetter: string, octave?: number) => void
  setChordType: (id: number, type: string) => void
  setSlashChord: (id: number, isSlash: boolean) => void
  setSlashNote: (id: number, slashNote: string) => void
  setShowFlats: (id: number, showFlats: boolean) => void
  setProgKey: (id: number, isKey: boolean) => void
  // which guitar/ukulele voicing the chord uses
  setPosition: (id: number, position: number) => void

  // a shared code (the url's query): its settings and its progression.
  // not an undo step. returns false if the code can't be read
  loadShareCode: (code: string) => boolean
  // swaps in a new progression code (the progression editor)
  loadProgression: (progCode: string) => void
  clear: () => void
  undo: () => void

  setSynth: (synth: string) => void
  setVolume: (volume: number) => void
  setEq: (eq: EQSettings) => void
  setSound: (sound: SoundSettings) => void
  // a preset: a voice and a sound, in one step
  setVoiceAndSound: (synth: string, sound: SoundSettings) => void
  setFormat: (format: string) => void
  setFretView: (fretView: string) => void
}

export interface AppStore {
  chords: ChordPiano[]
  settings: Settings
  // progression codes undo steps back through, oldest first. settings
  // aren't part of them, so undo leaves the instrument and view alone
  past: string[]
  // bumped when the whole progression is swapped for another (the
  // progression editor), which remounts the board with its enter transition
  generation: number
  actions: ProgressionActions
}

type PersistedStore = Pick<AppStore, "chords" | "settings" | "past">

function getNextId(chords: ChordPiano[]): number {
  return chords.reduce((max, chord) => Math.max(max, chord.id), -1) + 1
}

function newChord(id: number): ChordPiano {
  return {
    id,
    selectedChord: { noteLetter: "C", type: "", octave: 1 }
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => {
      /**
       * applies an edit to the progression, saving what it was as an undo
       * step if the edit changed it
       */
      const edit = (recipe: (chords: ChordPiano[], state: AppStore) => void) => {
        const before = serializeProgressionCode(get().chords)

        set((state) => {
          recipe(state.chords, state)

          if (serializeProgressionCode(state.chords) !== before) {
            state.past.push(before)
            if (state.past.length > MAX_UNDO) state.past.shift()
          }
        })
      }

      const editChord = (id: number, recipe: (chord: ChordPiano) => void) =>
        edit((chords) => {
          const chord = findChord(chords, id)
          if (chord) recipe(chord)
        })

      return {
        chords: [],
        settings: DEFAULT_SETTINGS,
        past: [],
        generation: 0,

        actions: {
          addChord: () => edit((chords) => {
            chords.push(newChord(getNextId(chords)))
          }),

          removeChord: (id) => edit((_, state) => {
            state.chords = removeChord(state.chords, id)
          }),

          arrangeProgression: (items) => edit((_, state) => {
            state.chords = arrangeProgression(state.chords, items)
          }),

          toggleSectionBreak: (id) => edit((_, state) => {
            state.chords = toggleBreakAfter(state.chords, id)
          }),

          addSectionBreak: () => edit((chords, state) => {
            const last = chords[chords.length - 1]
            if (!last || last.breakAfter !== undefined) return
            state.chords = toggleBreakAfter(chords, last.id)
          }),

          setChordRoot: (id, noteLetter, octave) => edit((chords) => {
            const chord = findChord(chords, id)
            if (!chord) return
            setChordRoot(chords, id, { noteLetter, octave: octave ?? chord.selectedChord.octave ?? 0 })
          }),

          setChordType: (id, type) => editChord(id, (chord) => {
            chord.selectedChord.type = type
          }),

          setSlashChord: (id, isSlash) => edit((chords) => setSlashChord(chords, id, isSlash)),

          setSlashNote: (id, slashNote) => editChord(id, (chord) => {
            chord.selectedChord.slashNote = slashNote
          }),

          setShowFlats: (id, showFlats) => edit((chords) => setShowFlats(chords, id, showFlats)),

          setProgKey: (id, isKey) => edit((chords) => setProgKey(chords, id, isKey)),

          setPosition: (id, position) => editChord(id, (chord) => {
            chord.selectedChord.position = position
          }),

          loadShareCode: (code) => {
            let shared
            try {
              shared = parseShareCode(code)
            } catch (error) {
              console.error("error parsing progression code:", error)
              return false
            }

            const { settings, chords } = shared
            set((state) => {
              state.settings = {
                ...settings,
                fretView: settings.fretView ?? state.settings.fretView
              }
              state.chords = chords
            })
            return true
          },

          loadProgression: (progCode) => edit((_, state) => {
            state.chords = parseProgressionCode(progCode)
            state.generation++
          }),

          clear: () => edit((_, state) => {
            state.chords = []
          }),

          undo: () => set((state) => {
            const previous = state.past.pop()
            if (previous !== undefined) state.chords = parseProgressionCode(previous)
          }),

          setSynth: (synth) => set((state) => { state.settings.synth = synth }),
          setVolume: (volume) => set((state) => { state.settings.volume = volume }),
          setEq: (eq) => set((state) => { state.settings.eq = { ...eq } }),
          setSound: (sound) => set((state) => { state.settings.sound = { ...sound } }),
          setVoiceAndSound: (synth, sound) => set((state) => {
            state.settings.synth = synth
            state.settings.sound = { ...sound }
          }),
          setFormat: (format) => set((state) => { state.settings.format = format }),
          setFretView: (fretView) => set((state) => { state.settings.fretView = fretView })
        }
      }
    }),
    {
      // kept for the tab, so a reload without a code in the url (or a
      // trip away and back) picks up where it left off, undo steps too
      name: "chord-buildr",
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
      // version 1 had no sound settings
      migrate: (persisted, version) => {
        const state = persisted as PersistedStore
        if (version < 2 && state?.settings) {
          state.settings = { ...state.settings, sound: { ...DEFAULT_SOUND } }
        }
        return state
      },
      partialize: (state): PersistedStore => ({
        chords: state.chords,
        settings: state.settings,
        past: state.past
      })
    }
  )
)

// the actions never change, so this never re-renders a component
export const useActions = (): ProgressionActions => useAppStore((state) => state.actions)

export const useChords = (): ChordPiano[] => useAppStore((state) => state.chords)

export const useChord = (id: number): ChordPiano | undefined =>
  useAppStore((state) => findChord(state.chords, id))

export const useSettings = (): Settings => useAppStore((state) => state.settings)

export const useFormat = (): string => useAppStore((state) => state.settings.format)

// the key chord's selected chord, if a chord is marked as the key
export const useKeyChord = () => useAppStore((state) => getKeyChord(state.chords))

export const useCanUndo = (): boolean => useAppStore((state) => state.past.length > 0)
