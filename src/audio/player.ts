import { fromMidiSharps } from "@tonaljs/note"
import { ChordPiano, getChordKeys } from "../utils/chordPianoHandler"
import { getKeyNoteName } from "../utils/pianoHelper"
import { Settings, isGuitar } from "../utils/settings"
import { SynthKey } from "../utils/synthTypes"
import { ChordPosition, findChordPositions } from "../utils/guitarUtil"
import { loadInstrument } from "../utils/instruments"
import { useAppStore } from "../store/progressionStore"
import {
  endChordPlayback,
  playChordKeys,
  releaseChordKeys,
  startChordPlayback,
  type PlayingKeys
} from "../store/playbackStore"

/**
 * what components call to play a chord. works out the notes and marks the
 * chord in the playback store, then hands the notes to the audio engine,
 * which holds all of the Tone code and is only loaded when it's needed
 */

// how long after a chord is played its card and header link stay marked,
// and its piano keys stay lit
const PLAYING_MS = 1000

// phones and tablets start the notes a little later than desktops (see
// delay below). a coarse pointer stands in for a user agent check
const isTouchDevice = (): boolean =>
  typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
const KEYS_RELEASE_MS = 1500

type Engine = typeof import("./engine")

let engine: Promise<Engine> | undefined

/**
 * loads the audio engine (and Tone with it) once. a failed load is
 * retried on the next call
 */
function loadEngine(): Promise<Engine> {
  engine ??= import("./engine").catch((error: unknown) => {
    engine = undefined
    throw error
  })
  return engine
}

/**
 * loads the engine and starts the audio context ahead of the first play.
 * call it from a user gesture, since browsers only let audio start after one
 */
export function prepareAudio(): void {
  loadEngine()
    .then((loaded) => loaded.resumeAudio())
    .catch((error: unknown) => console.error('failed to prepare audio:', error))
}

/**
 * plays the chord with the given id, with the current settings
 */
export async function playChordById(pianoId: number, tabPositions?: ChordPosition[]): Promise<void> {
  const { chords, settings } = useAppStore.getState()
  const chordPiano = chords.find((chord) => chord.id === pianoId)

  if (!chordPiano) return

  return playChord(chordPiano, settings, tabPositions)
}

/**
 * the chord's guitar or ukulele voicings, loading the instrument's chord
 * shapes if they haven't loaded. none if they can't be loaded, so the
 * chord plays its piano voicing instead
 */
async function findTabPositions(chordPiano: ChordPiano, format: string): Promise<ChordPosition[]> {
  try {
    const instrument = await loadInstrument(format)
    return findChordPositions(chordPiano.selectedChord, instrument.chords, format)
  } catch (error) {
    console.error('failed to load chord shapes:', error)
    return []
  }
}

/**
 * plays a chord: strummed from its guitar/ukulele voicing when the format
 * is fretted and it has one, otherwise the keys its piano has down. while
 * it plays it's marked in the playback store, which its card and the
 * header strip read
 */
export async function playChord(
  chordPiano: ChordPiano,
  settings: Settings,
  tabPositions?: ChordPosition[]
): Promise<void> {
  const { id, selectedChord } = chordPiano

  startChordPlayback(id)
  let playingKeys: PlayingKeys | undefined

  try {
    const strum = isGuitar(settings.format)

    let notes: string[]
    let position: ChordPosition | undefined

    if (strum) {
      // if the tabPositions weren't provided, find them now
      tabPositions ??= await findTabPositions(chordPiano, settings.format)

      // the selected position, falling back to the first if the stored
      // one doesn't exist for this chord
      position = tabPositions[selectedChord.position ?? 0] ?? tabPositions[0]
    }

    // chords without a guitar diagram play the piano voicing instead
    if (position) {
      notes = position.midi.map(fromMidiSharps)
    } else {
      const keys = getChordKeys(selectedChord)
      notes = keys.map(getKeyNoteName)
      playingKeys = playChordKeys(id, keys)
    }

    const { playNotes } = await loadEngine()

    await playNotes({
      instrument: settings.synth as SynthKey,
      eq: settings.eq,
      notes,
      volume: settings.volume,
      delay: isTouchDevice() ? 0.15 : 0.03,
      duration: strum ? "1.0" : "1.1",
      velocity: 0.7,
      strum
    })
  } catch (error) {
    console.error('failed to play chord:', error)
  }

  setTimeout(() => endChordPlayback(id), PLAYING_MS)

  const released = playingKeys
  if (released) setTimeout(() => releaseChordKeys(id, released), KEYS_RELEASE_MS)
}
