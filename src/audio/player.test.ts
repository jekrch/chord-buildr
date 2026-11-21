import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playChord, playChordById, playOrStopChordById, refreshLoop, stopPlayback } from './player'
import { DEFAULT_SETTINGS, DEFAULT_SOUND, Settings, isGuitar } from '../utils/settings'
import { ChordPiano } from '../utils/chordPianoHandler'
import { usePlaybackStore } from '../store/playbackStore'
import { useAppStore } from '../store/progressionStore'
import { loadInstrument } from '../utils/instruments'
import { writePlayPrefs } from '../utils/playPrefs'
import type { VoiceDef } from './voices'

// the engine keeps one voice per instrument, so every test gets this one
const { voice, bus, clock } = vi.hoisted(() => ({
  // the audio clock, in seconds, which the loop tests move forward
  clock: { now: 0 },
  voice: {
    output: { connect: vi.fn() },
    volume: { rampTo: vi.fn() },
    setEnvelope: vi.fn(),
    play: vi.fn(),
    attack: vi.fn(),
    release: vi.fn(),
    releaseAll: vi.fn(),
    dispose: vi.fn()
  },
  bus: {
    input: {},
    apply: vi.fn(),
    open: vi.fn(),
    silence: vi.fn(),
    watchLevels: vi.fn()
  }
}))

// Tone's clock runs off the fake timers, as the audio clock
vi.mock('tone', () => {
  const context = {
    state: 'running',
    get currentTime() {
      return clock.now
    },
    setInterval: (callback: () => void, seconds: number) => setInterval(callback, seconds * 1000),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id)
  }
  return {
    getContext: vi.fn(() => context),
    start: vi.fn(() => Promise.resolve()),
    now: vi.fn(() => clock.now)
  }
})

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
    usePlaybackStore.setState({ playingChordId: undefined, loopingChordId: undefined, keys: {} })
    localStorage.clear()
    clock.now = 0
  })

  afterEach(() => {
    stopPlayback()
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

describe('looping arpeggios', () => {
  const loopSettings: Settings = { ...pianoSettings, sound: { ...DEFAULT_SOUND, play: 'r' } }
  const cMajor = { noteLetter: 'C', type: '', octave: 0 }
  const step = 0.14

  // a loop strikes and releases its notes itself
  const struck = () => voice.attack.mock.calls.map(([note]) => note as string)
  const strikeTimes = () => voice.attack.mock.calls.map(([, time]) => time as number)
  const releases = () => voice.release.mock.calls.map(([note, time]) => ({ note: note as string, time: time as number }))

  // moves the audio clock and the timers on together
  const advance = async (seconds: number) => {
    for (let tick = 0; tick < Math.round(seconds / 0.025); tick++) {
      clock.now += 0.025
      await vi.advanceTimersByTimeAsync(25)
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(isGuitar).mockReturnValue(false)
    usePlaybackStore.setState({ playingChordId: undefined, loopingChordId: undefined, keys: {} })
    localStorage.clear()
    clock.now = 0
    writePlayPrefs({ arpeggio: { loop: true } })
    useAppStore.setState({
      chords: [{ id: 1, selectedChord: cMajor }, { id: 2, selectedChord: { ...cMajor, noteLetter: 'F' } }],
      settings: loopSettings
    })
  })

  afterEach(() => {
    stopPlayback()
    vi.useRealTimers()
  })

  it('keeps playing the pattern, and stays marked, until stopped', async () => {
    await playChordById(1)
    expect(usePlaybackStore.getState().loopingChordId).toBe(1)

    await advance(2)
    // C E G, round and round
    const notes = struck()
    expect(notes.length).toBeGreaterThan(9)
    expect(notes.slice(0, 6)).toEqual(['C3', 'E3', 'G3', 'C3', 'E3', 'G3'])
    expect(usePlaybackStore.getState().playingChordId).toBe(1)

    stopPlayback()
    await vi.advanceTimersByTimeAsync(0)
    expect(bus.silence).toHaveBeenCalled()
    expect(usePlaybackStore.getState().loopingChordId).toBeUndefined()
    expect(usePlaybackStore.getState().playingChordId).toBeUndefined()

    // every note struck is released
    expect(releases().length).toBe(struck().length)

    voice.attack.mockClear()
    await advance(1)
    expect(voice.attack).not.toHaveBeenCalled()
  })

  it('releases a ringing note before striking it again', async () => {
    await playChordById(1)
    await advance(1)
    const strikes = voice.attack.mock.invocationCallOrder
    const secondC = voice.attack.mock.calls.findIndex(([note], index) => note === 'C3' && index > 0)
    const releaseOfFirstC = voice.release.mock.calls.findIndex(([note]) => note === 'C3')
    expect(voice.release.mock.invocationCallOrder[releaseOfFirstC]).toBeLessThan(strikes[secondC]!)
    expect(voice.release.mock.calls[releaseOfFirstC]![1]).toBeCloseTo(strikeTimes()[secondC]!)
  })

  it("stops when the looping chord's play button is pressed again, and moves to another chord's", async () => {
    await playChordById(1)
    playOrStopChordById(2)
    await vi.advanceTimersByTimeAsync(0)
    expect(usePlaybackStore.getState().loopingChordId).toBe(2)

    playOrStopChordById(2)
    await vi.advanceTimersByTimeAsync(0)
    expect(usePlaybackStore.getState().loopingChordId).toBeUndefined()
  })

  it('ends the loop when a chord is played once', async () => {
    await playChordById(1)
    writePlayPrefs({ arpeggio: { loop: false } })
    await playChordById(2)
    expect(usePlaybackStore.getState().loopingChordId).toBeUndefined()
    expect(releases().length).toBe(struck().length)

    voice.attack.mockClear()
    await advance(2)
    expect(voice.attack).not.toHaveBeenCalled()
  })

  it('takes up a change at the start of the next cycle', async () => {
    await playChordById(1)
    await advance(0.2)
    writePlayPrefs({ arpeggio: { pattern: 'down' } })
    refreshLoop()
    await vi.advanceTimersByTimeAsync(0)

    voice.attack.mockClear()
    await advance(1)
    // the rest of the cycle that was playing, then the new pattern
    const notes = struck()
    expect(notes[0]).toBe('G3')
    expect(notes.slice(1, 4)).toEqual(['G3', 'E3', 'C3'])
  })

  describe('changing chords', () => {
    // plays C, then switches to F partway into the second bar
    const switchMidBar = async () => {
      await playChordById(1)
      await advance(0.55)
      const barStart = strikeTimes()[0]!
      await playChordById(2)
      await advance(1)
      const firstF = voice.attack.mock.calls.findIndex(([note]) => ['F3', 'A3', 'C4'].includes(note as string))
      return { barStart, firstF }
    }

    it('comes in on the beat, at the same place in the bar', async () => {
      const { barStart, firstF } = await switchMidBar()
      const times = strikeTimes()
      const notes = struck()

      // every strike, before and after the change, is on the same grid
      for (const time of times) {
        const beats = (time - barStart) / step
        expect(beats).toBeCloseTo(Math.round(beats), 5)
      }

      // the F chord picks up the bar where it had got to: on its second
      // beat, its second note, and its next bar starts on its bass
      const beatInBar = Math.round((times[firstF]! - barStart) / step) % 3
      expect(beatInBar).not.toBe(0)
      expect(notes[firstF]).toBe(['F3', 'A3', 'C4'][beatInBar])
      const nextBar = notes.findIndex((note, index) => index > firstF && note === 'F3')
      expect(Math.round((times[nextBar]! - barStart) / step) % 3).toBe(0)
    })

    it("lets go of the last chord's notes as the new one comes in", async () => {
      const { firstF } = await switchMidBar()
      const changeAt = strikeTimes()[firstF]!

      const cNotes = ['C3', 'E3', 'G3']
      const cStrikes = struck().filter((note) => cNotes.includes(note)).length
      const cReleases = releases().filter(({ note }) => cNotes.includes(note))
      expect(cReleases.length).toBe(cStrikes)
      for (const { time } of cReleases) expect(time).toBeLessThanOrEqual(changeAt + 1e-9)
    })
  })

  it('follows an edit to the looping chord, and stops when it is removed', async () => {
    await playChordById(1)
    useAppStore.setState({ chords: [{ id: 1, selectedChord: { ...cMajor, type: 'm' } }] })
    await vi.advanceTimersByTimeAsync(0)
    voice.attack.mockClear()
    await advance(1)
    expect(struck()).toContain('D#3')

    useAppStore.setState({ chords: [] })
    await vi.advanceTimersByTimeAsync(0)
    expect(usePlaybackStore.getState().loopingChordId).toBeUndefined()
  })
})
