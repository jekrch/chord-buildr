import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playChord, playChordById } from './player'
import { DEFAULT_SETTINGS, DEFAULT_SOUND, Settings, isGuitar } from '../utils/settings'
import { ChordPiano } from '../utils/chordPianoHandler'
import { usePlaybackStore } from '../store/playbackStore'
import { useAppStore } from '../store/progressionStore'
import { loadInstrument } from '../utils/instruments'
import { writePlayPrefs } from '../utils/playPrefs'
import type { VoiceDef } from './voices'

// the engine keeps one voice per instrument, so every test gets this one
const { voice, bus } = vi.hoisted(() => ({
  voice: {
    output: { connect: vi.fn() },
    volume: { rampTo: vi.fn() },
    setEnvelope: vi.fn(),
    play: vi.fn(),
    releaseAll: vi.fn(),
    dispose: vi.fn()
  },
  bus: {
    input: {},
    apply: vi.fn(),
    watchLevels: vi.fn()
  }
}))

vi.mock('tone', () => ({
  getContext: vi.fn(() => ({ state: 'running' })),
  start: vi.fn(() => Promise.resolve()),
  now: vi.fn(() => 0)
}))

vi.mock('./bus', () => ({ getBus: () => bus }))

vi.mock('./voices', () => {
  const def: VoiceDef = {
    create: () => voice as never,
    trimDb: 0,
    tiltScale: 1,
    attack: [0.001, 0.01, 0.1],
    decay: [0.1, 0.1, 0.1],
    release: [0.5, 1, 2],
    hold: [0.5, 1.1, 2],
    tone: [1000, 6000, 20000]
  }
  return { getVoiceDef: () => def }
})

vi.mock('../utils/settings', async (importOriginal) => ({
  ...await importOriginal<typeof import('../utils/settings')>(),
  isGuitar: vi.fn().mockReturnValue(false)
}))

vi.mock('../utils/instruments', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/instruments')>()
  return { ...original, loadInstrument: vi.fn(original.loadInstrument) }
})

const pianoSettings: Settings = { ...DEFAULT_SETTINGS, synth: 'p', volume: 90, format: 'p' }

// the notes played, and when, in the order they were played
const played = () => voice.play.mock.calls.map(([note]) => note as string)
const startTimes = () => voice.play.mock.calls.map(([, , time]) => time as number)
const velocities = () => voice.play.mock.calls.map(([, , , velocity]) => velocity as number)
const sides = () => voice.play.mock.calls.map(([, , , , side]) => side as number)

const guitarPositions = [{ baseFret: 1, frets: [], fingers: [], barres: [], midi: [40, 45, 50] }]
const strumGuitarChord = () => playChord(
  { id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } },
  { ...pianoSettings, format: 'g' },
  guitarPositions
)

describe('playChord', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(isGuitar).mockReturnValue(false)
    usePlaybackStore.setState({ playingChordId: undefined, keys: {} })
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays the keys the piano has down and marks them while they play', async () => {
    const chordPiano: ChordPiano = {
      id: 1,
      selectedChord: { noteLetter: 'C', type: '', octave: 0 }
    }

    await playChord(chordPiano, pianoSettings)

    expect(voice.releaseAll).toHaveBeenCalled()
    expect(played()).toEqual(['C3', 'E3', 'G3'])
    // played together
    expect(new Set(startTimes()).size).toBe(1)
    expect(bus.apply).toHaveBeenCalled()

    expect(usePlaybackStore.getState().playingChordId).toBe(1)
    expect(usePlaybackStore.getState().keys[1]).toEqual({ notes: [0, 4, 7], phase: 'playing' })

    vi.advanceTimersByTime(1000)
    expect(usePlaybackStore.getState().playingChordId).toBeUndefined()
    expect(usePlaybackStore.getState().keys[1]!.phase).toBe('playing')

    vi.advanceTimersByTime(500)
    expect(usePlaybackStore.getState().keys[1]!.phase).toBe('stopping')
  })

  it('leaves a chord played since marked when an earlier one ends', async () => {
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, pianoSettings)
    vi.advanceTimersByTime(500)
    await playChord({ id: 2, selectedChord: { noteLetter: 'G', type: '', octave: 0 } }, pianoSettings)

    vi.advanceTimersByTime(500)
    expect(usePlaybackStore.getState().playingChordId).toBe(2)

    vi.advanceTimersByTime(500)
    expect(usePlaybackStore.getState().playingChordId).toBeUndefined()
  })

  it('strums the selected guitar voicing, with its keys left unlit', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    const positions = [
      { baseFret: 1, frets: [], fingers: [], barres: [], midi: [40, 45, 50] },
      { baseFret: 3, frets: [], fingers: [], barres: [], midi: [43, 49, 54] }
    ]
    const chordPiano: ChordPiano = {
      id: 1,
      selectedChord: { noteLetter: 'C', type: '', octave: 0, position: 1 }
    }

    await playChord(chordPiano, { ...pianoSettings, format: 'g' }, positions)

    expect(played()).toEqual(['G2', 'C#3', 'F#3'])
    // strummed, low string first
    const times = startTimes()
    expect(times[0]).toBeLessThan(times[1]!)
    expect(times[1]).toBeLessThan(times[2]!)
    expect(usePlaybackStore.getState().playingChordId).toBe(1)
    expect(usePlaybackStore.getState().keys[1]).toBeUndefined()
  })

  it('loads the guitar shapes to strum a chord played without its voicings', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    const chordPiano: ChordPiano = {
      id: 1,
      selectedChord: { noteLetter: 'C', type: '', octave: 0 }
    }

    await playChord(chordPiano, { ...pianoSettings, format: 'g' })

    expect(loadInstrument).toHaveBeenCalledWith('g')
    // chords-db's first C major shape, x32010
    expect(played()).toEqual(['C3', 'E3', 'G3', 'C4', 'E4'])
    expect(usePlaybackStore.getState().keys[1]).toBeUndefined()
  })

  it('plays the piano voicing when the guitar shapes fail to load', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    vi.mocked(loadInstrument).mockRejectedValueOnce(new Error('offline'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const chordPiano: ChordPiano = {
      id: 1,
      selectedChord: { noteLetter: 'C', type: '', octave: 0 }
    }

    await playChord(chordPiano, { ...pianoSettings, format: 'g' })

    expect(played()).toEqual(['C3', 'E3', 'G3'])
    expect(usePlaybackStore.getState().keys[1]).toEqual({ notes: [0, 4, 7], phase: 'playing' })
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('playChordById plays the chord with that id from the store', async () => {
    useAppStore.setState({
      chords: [{ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 1 } }],
      settings: pianoSettings
    })

    await playChordById(1)
    expect(played()).toEqual(['C4', 'E4', 'G4'])

    voice.play.mockClear()
    await playChordById(99)
    expect(voice.play).not.toHaveBeenCalled()
  })

  it('plays the bass note of a chord louder than its top note', async () => {
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, pianoSettings)

    const [bass, , top] = velocities()
    expect(bass).toBeGreaterThan(top!)
  })

  it('plays a piano chord as an arpeggio, and keeps it marked until its last note', async () => {
    const settings: Settings = { ...pianoSettings, sound: { ...DEFAULT_SOUND, play: 'r' } }
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, settings)

    const times = startTimes()
    expect(times[0]).toBeLessThan(times[1]!)
    expect(times[1]).toBeLessThan(times[2]!)

    vi.advanceTimersByTime(1000)
    expect(usePlaybackStore.getState().playingChordId).toBe(1)
    vi.advanceTimersByTime(500)
    expect(usePlaybackStore.getState().playingChordId).toBeUndefined()
  })

  it('plays an arpeggio in the pattern this browser picked', async () => {
    writePlayPrefs({ arpeggio: { pattern: 'updown' } })
    const settings: Settings = { ...pianoSettings, sound: { ...DEFAULT_SOUND, play: 'r' } }
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, settings)

    expect(played()).toEqual(['C3', 'E3', 'G3', 'E3', 'C3'])
    const times = startTimes()
    for (let index = 1; index < times.length; index++) expect(times[index - 1]).toBeLessThan(times[index]!)
    // a repeated note keeps the level it had the first time
    const levels = velocities()
    expect(levels[3]).toBeCloseTo(levels[1]!)
  })

  it('runs an arpeggio over two octaves when this browser asks', async () => {
    writePlayPrefs({ arpeggio: { octaves: 2 } })
    const settings: Settings = { ...pianoSettings, sound: { ...DEFAULT_SOUND, play: 'r' } }
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, settings)

    expect(played()).toEqual(['C3', 'E3', 'G3', 'C4', 'E4', 'G4'])
  })

  it('plays a custom arpeggio, carrying the chord up for rows past its top note', async () => {
    writePlayPrefs({ arpeggio: { pattern: 'custom', custom: [[0], [3], [], [1, 2]] } })
    const settings: Settings = { ...pianoSettings, sound: { ...DEFAULT_SOUND, play: 'r' } }
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, settings)

    expect(played()).toEqual(['C3', 'C4', 'E3', 'G3'])
    const times = startTimes()
    expect(times[2]).toBeCloseTo(times[3]!)
    expect(times[2]! - times[1]!).toBeGreaterThan(times[1]! - times[0]!)
  })

  it('plays a guitar voicing together when the play style says so', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    const positions = [{ baseFret: 1, frets: [], fingers: [], barres: [], midi: [40, 45, 50] }]
    const settings: Settings = { ...pianoSettings, format: 'g', sound: { ...DEFAULT_SOUND, play: 'c' } }

    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, settings, positions)

    expect(played()).toEqual(['E2', 'A2', 'D3'])
    expect(new Set(startTimes()).size).toBe(1)
  })

  it('strums from the top string when the strum direction is up', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    writePlayPrefs({ strum: 'up' })

    await strumGuitarChord()

    expect(played()).toEqual(['D3', 'A2', 'E2'])
    const times = startTimes()
    expect(times[0]).toBeLessThan(times[1]!)
    expect(times[1]).toBeLessThan(times[2]!)
  })

  it('takes turns strumming down and up when the strums alternate', async () => {
    vi.mocked(isGuitar).mockReturnValue(true)
    writePlayPrefs({ strum: 'alternate' })

    await strumGuitarChord()
    expect(played()).toEqual(['E2', 'A2', 'D3'])

    voice.play.mockClear()
    await strumGuitarChord()
    expect(played()).toEqual(['D3', 'A2', 'E2'])
  })

  it('leaves a chord played together alone whatever the strum direction', async () => {
    writePlayPrefs({ strum: 'up' })
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, pianoSettings)
    expect(played()).toEqual(['C3', 'E3', 'G3'])
  })

  it('loosens the notes of a chord apart when humanized', async () => {
    writePlayPrefs({ humanize: true })
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValueOnce(1)

    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 0 } }, pianoSettings)

    expect(new Set(startTimes()).size).toBe(3)
    // nothing starts before now
    for (const time of startTimes()) expect(time).toBeGreaterThan(0)
    random.mockRestore()
  })

  it('pans the notes above middle c off center, and keeps the bass centered', async () => {
    await playChord({ id: 1, selectedChord: { noteLetter: 'C', type: '', octave: 1 } }, pianoSettings)

    expect(played()).toEqual(['C4', 'E4', 'G4'])
    expect(sides()).toEqual([0, -1, 1])
  })
})
