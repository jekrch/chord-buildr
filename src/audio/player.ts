import { fromMidiSharps } from "@tonaljs/note"
import { ChordPiano, getChordKeys } from "../utils/chordPianoHandler"
import { getKeyNoteName } from "../utils/pianoHelper"
import { DEFAULT_SOUND, Settings, isGuitar, resolvePlayStyle } from "../utils/settings"
import { SynthKey } from "../utils/synthTypes"
import { ChordPosition, findChordPositions } from "../utils/guitarUtil"
import { loadInstrument } from "../utils/instruments"
import { StrumDirection, readPlayPrefs } from "../utils/playPrefs"
import { arpeggioNotes, fitArpeggioNotes, playSpanSeconds } from "./mix"
import { useAppStore } from "../store/progressionStore"
import {
  endChordPlayback,
  playChordKeys,
  releaseChordKeys,
  setLoopingChord,
  startChordPlayback,
  usePlaybackStore,
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

// whether the next strum goes up, when strums alternate. each strum flips it
let alternateUp = false

/**
 * whether a strum goes high to low. alternating strums take turns,
 * starting down, the way a strumming hand moves
 */
function strumsUp(direction: StrumDirection): boolean {
  if (direction !== "alternate") return direction === "up"
  const up = alternateUp
  alternateUp = !alternateUp
  return up
}

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
 * what a chord's play button does: stops the chord if it's looping, and
 * plays it otherwise (taking over from any other chord's loop)
 */
export function playOrStopChordById(pianoId: number, tabPositions?: ChordPosition[]): void {
  if (usePlaybackStore.getState().loopingChordId === pianoId) {
    stopPlayback()
    return
  }
  void playChordById(pianoId, tabPositions)
}

// the looping chord, and the piano keys it lit
let loopState: { id: number; keys?: PlayingKeys } | undefined
// counts plays and stops, so a play that's overtaken while it loads
// doesn't take over the loop state
let playCount = 0

/**
 * notes that a chord's loop has ended. stopped, its card and keys go
 * dark; replaced by another play, that play has already marked itself
 */
function endLoopState(stopped: boolean): void {
  const state = loopState
  loopState = undefined
  setLoopingChord(undefined)
  if (!state) return
  if (stopped) endChordPlayback(state.id)
  if (state.keys) releaseChordKeys(state.id, state.keys)
}

/**
 * stops what's playing, ending a loop. the notes fade out quickly
 */
export function stopPlayback(): void {
  playCount++
  endLoopState(true)
  engine
    ?.then((loaded) => loaded.stopNotes())
    .catch((error: unknown) => console.error('failed to stop playback:', error))
}

/**
 * plays the looping chord again with the current settings and play
 * preferences, taking over at the start of its next cycle so the rhythm
 * carries on. call it after a play preference changes; changes to the
 * chord or the settings are followed on their own
 */
export function refreshLoop(): void {
  const id = usePlaybackStore.getState().loopingChordId
  if (id === undefined) return
  const { chords, settings } = useAppStore.getState()
  const chordPiano = chords.find((chord) => chord.id === id)
  if (!chordPiano) {
    stopPlayback()
    return
  }
  void playChord(chordPiano, settings, undefined, true)
}

let followingStore = false

/**
 * keeps a loop in step with the progression: a settings change is
 * picked up at the loop's next cycle, an edit to the looping chord on
 * its next beat, and a looping chord that's removed stops
 */
function followLoopingChord(): void {
  if (followingStore) return
  followingStore = true
  useAppStore.subscribe((state, previous) => {
    const id = usePlaybackStore.getState().loopingChordId
    if (id === undefined) return
    if (state.chords === previous.chords && state.settings === previous.settings) return

    const chord = state.chords.find((chordPiano) => chordPiano.id === id)
    const before = previous.chords.find((chordPiano) => chordPiano.id === id)
    if (!chord) stopPlayback()
    // a new sound comes in at the next cycle; an edited chord on the next
    // beat, the way changing to another chord does
    else if (state.settings !== previous.settings) refreshLoop()
    else if (chord.selectedChord !== before?.selectedChord) void playChord(chord, state.settings)
  })
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
 * plays a chord: its guitar/ukulele voicing when the format is fretted
 * and it has one, otherwise the keys its piano has down. it's played
 * together, strummed or as an arpeggio, as the sound settings say (auto
 * strums fretted formats), and strummed down or up, arpeggiated in a
 * pattern and humanized as this browser's play preferences say. while it
 * plays it's marked in the playback store, which its card and the header
 * strip read, for longer when its notes are spread out
 */
export async function playChord(
  chordPiano: ChordPiano,
  settings: Settings,
  tabPositions?: ChordPosition[],
  // a looping chord played again by refreshLoop
  handover = false
): Promise<void> {
  const { id, selectedChord } = chordPiano
  const count = ++playCount
  let loops = false

  startChordPlayback(id)
  let playingKeys: PlayingKeys | undefined
  // how long after the first note the last one starts, in ms
  let spreadMs = 0

  try {
    const sound = settings.sound ?? DEFAULT_SOUND
    const style = resolvePlayStyle(sound.play, settings.format)

    let notes: string[]
    let position: ChordPosition | undefined

    if (isGuitar(settings.format)) {
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

    const prefs = readPlayPrefs()
    // an upstroke sweeps the same strings from the top
    if (style === "s" && strumsUp(prefs.strum)) notes = [...notes].reverse()
    // an arpeggio runs low to high, over one octave or two, and a custom
    // one over as many notes as its pattern has rows
    if (style === "r") notes = fitArpeggioNotes(arpeggioNotes(notes, prefs.arpeggio.octaves), prefs.arpeggio)

    spreadMs = playSpanSeconds(notes.length, style, prefs.arpeggio) * 1000
    loops = style === "r" && prefs.arpeggio.loop

    const { playNotes, isLooping } = await loadEngine()

    await playNotes({
      instrument: settings.synth as SynthKey,
      eq: settings.eq,
      sound,
      style,
      notes,
      arpeggio: prefs.arpeggio,
      handover,
      humanize: prefs.humanize,
      volume: settings.volume,
      // ahead of any note humanize starts early
      delay: isTouchDevice() ? 0.15 : 0.03
    })

    // a play or stop since has the last word
    if (count === playCount) {
      if (loops && isLooping()) {
        // the chord stays marked, and its keys lit, until it's stopped
        endLoopState(false)
        loopState = { id, keys: playingKeys }
        setLoopingChord(id)
        followLoopingChord()
        return
      }
      endLoopState(false)
    }
  } catch (error) {
    console.error('failed to play chord:', error)
  }

  setTimeout(() => endChordPlayback(id), PLAYING_MS + spreadMs)

  const released = playingKeys
  if (released) setTimeout(() => releaseChordKeys(id, released), KEYS_RELEASE_MS + spreadMs)
}
