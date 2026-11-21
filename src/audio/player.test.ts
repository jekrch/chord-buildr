import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playChord, playChordById } from './player'
import { DEFAULT_SETTINGS, Settings, isGuitar } from '../utils/settings'
import { ChordPiano } from '../utils/chordPianoHandler'
import { usePlaybackStore } from '../store/playbackStore'
import { useAppStore } from '../store/progressionStore'
import type { SynthReturn } from './synthLibrary'
import { loadInstrument } from '../utils/instruments'

// mock modules
vi.mock('tone', () => ({
  Sampler: vi.fn(),
  // regular function so it can be called with `new`
  EQ3: vi.fn(function () {
    return {
      low: { value: 0 },
      mid: { value: 0 },
      high: { value: 0 }
    }
  }),
  Frequency: vi.fn((noteOrMidi) => ({
    toNote: () => typeof noteOrMidi === 'string' ? noteOrMidi : `Note${noteOrMidi}`,
    // add toMidi method to handle note name to number conversion
    toMidi: () => {
      // simple mock implementation for common test cases
      if (typeof noteOrMidi === 'string') {
        const noteMap: { [key: string]: number } = {
          'C2': 48,
          'E2': 52,
          'G2': 55,
          'C3': 60,
          'E3': 64,
          'G4': 67
        }
        return noteMap[noteOrMidi] || 60 // default to middle C if note not found
      }
      return noteOrMidi
    }
  })),
  getContext: vi.fn(() => ({
    state: 'running',
    resume: vi.fn()
  })),
  now: vi.fn(() => 0)
}))


vi.mock('../utils/settings', async (importOriginal) => ({
  ...await importOriginal<typeof import('../utils/settings')>(),
  isGuitar: vi.fn().mockReturnValue(false)
}))

vi.mock('../utils/instruments', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/instruments')>()
  return { ...original, loadInstrument: vi.fn(original.loadInstrument) }
})

vi.mock('./synthLibrary', () => ({
  getSynth: vi.fn()
}))

const pianoSettings: Settings = { ...DEFAULT_SETTINGS, synth: 'piano', volume: 90, format: 'p' }

// the player keeps one synth per instrument, so every test gets this one
const synth = {
  synth: {
    toDestination: vi.fn(),
    releaseAll: vi.fn(),
    triggerAttackRelease: vi.fn(),
    volume: { value: 0 }
  },
  baseDecibel: 0
}

describe('playChord', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(isGuitar).mockReturnValue(false)
    const synthLibrary = vi.mocked(await import('./synthLibrary'))
    synthLibrary.getSynth.mockReturnValue(synth as unknown as SynthReturn)
    usePlaybackStore.setState({ playingChordId: undefined, keys: {} })
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

    expect(synth.synth.releaseAll).toHaveBeenCalled()
    expect(synth.synth.volume.value).toBeDefined()
    expect(synth.synth.triggerAttackRelease).toHaveBeenCalledWith(
      ['C3', 'E3', 'G3'],
      '1.1',
      expect.any(Number),
      0.7
    )

    expect(usePlaybackStore.getState().playingChordId).toBe(1)
    expect(usePlaybackStore.getState().keys[1]).toEqual({ notes: [0, 4, 7], phase: 'playing' })

    vi.advanceTimersByTime(1000)
    expect(usePlaybackStore.getState().playingChordId).toBeUndefined()
    expect(usePlaybackStore.getState().keys[1].phase).toBe('playing')

    vi.advanceTimersByTime(500)
    expect(usePlaybackStore.getState().keys[1].phase).toBe('stopping')
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

    const played = synth.synth.triggerAttackRelease.mock.calls.map((call) => call[0])
    expect(played).toEqual(['G2', 'C#3', 'F#3'])
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
    const played = synth.synth.triggerAttackRelease.mock.calls.map((call) => call[0])
    // chords-db's first C major shape, x32010
    expect(played).toEqual(['C3', 'E3', 'G3', 'C4', 'E4'])
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

    const played = synth.synth.triggerAttackRelease.mock.calls.map((call) => call[0])
    expect(played).toEqual(['C3', 'E3', 'G3'])
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
    expect(synth.synth.triggerAttackRelease).toHaveBeenCalledWith(
      ['C4', 'E4', 'G4'],
      '1.1',
      expect.any(Number),
      0.7
    )

    synth.synth.triggerAttackRelease.mockClear()
    await playChordById(99)
    expect(synth.synth.triggerAttackRelease).not.toHaveBeenCalled()
  })
})
