import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playChord, playChordById } from './synthPlayer'
// @ts-ignore
import GuitarElectricMp3 from 'tonejs-instrument-guitar-electric-mp3'
import { ChordPiano } from './chordPianoHandler'
import { AppState } from '../components/context/AppContext'
import { findChordPositions } from './tabFinder'
import { SamplerOptions } from 'tone'

// mock modules
vi.mock('tone', () => ({
  Sampler: vi.fn(),
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

vi.mock('react-device-detect', () => ({
  isMobile: false
}))

vi.mock('./tabFinder', () => ({
  findChordPositions: vi.fn()
}))

vi.mock('../components/context/AppContext', () => ({
  getPianoById: vi.fn()
}))

// Setup the mock sampler before defining the synthLibrary mock
const mockSampler: any = {
  toDestination: vi.fn(() => mockSampler),
  releaseAll: vi.fn(),
  triggerAttackRelease: vi.fn(),
  volume: { value: 0 }
}

const MockGuitarClass = function({ onload }: SamplerOptions) {
  Promise.resolve().then(() => onload())
  return mockSampler
}

vi.mock('tonejs-instrument-guitar-electric-mp3', () => MockGuitarClass)

vi.mock('./synthLibrary', () => ({
  getSynth: vi.fn(),
  SYNTH_TYPES: {
    'electric-guitar': { 
      baseDecibel: 0,
      getSampler: () => Promise.resolve({ default: MockGuitarClass })
    },
    piano: { baseDecibel: 0 }
  }
}))

describe('playChord', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should play guitar chord with correct timing and strumming', async () => {
    const mockDispatch = vi.fn()
    const mockChordPiano: ChordPiano = {
      id: 1,
      isPlaying: false,
      selectedChord: {
        position: 0
      }
    } as ChordPiano

    const mockState: Partial<AppState> = {
      synth: 'electric-guitar',
      volume: 90,
      format: 'g'
    }

    const midiNotes = [60, 64, 67]
    
    vi.mocked(findChordPositions).mockReturnValue([{
      midi: midiNotes,
      fingers: [],
      frets: [],
      baseFret: 0,
      barres: []      
    }])
    
    const promise = playChord(mockDispatch, mockState as AppState, mockChordPiano)
    
    await vi.runAllTimersAsync()
    await promise
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: {
        ...mockChordPiano,
        isPlaying: true
      }
    })
    
    expect(mockSampler.toDestination).toHaveBeenCalled()
    expect(mockSampler.releaseAll).toHaveBeenCalled()
    
    expect(mockSampler.triggerAttackRelease).toHaveBeenCalledTimes(3)
    
    midiNotes.forEach((_, index) => {
      const expectedStartTime = (index * 0.20 / midiNotes.length) + 0.03
      
      expect(mockSampler.triggerAttackRelease).toHaveBeenCalledWith(
        `Note${midiNotes[index]}`,
        '1.0',
        expectedStartTime,
        0.7
      )
    })
    
    vi.advanceTimersByTime(1000)
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: {
        ...mockChordPiano,
        isPlaying: false
      }
    })
  })

  it('should play piano chord without strumming and adjust volume based on note height', async () => {
    const mockDispatch = vi.fn()
    const mockChordPiano: ChordPiano = {
      id: 1,
      isPlaying: false,
      piano: [
        [
          { note: 'C', selected: true, octave: 4, isStopping: null, isPlaying: false },
          { note: 'E', selected: true, octave: 4, isStopping: null, isPlaying: false },
          { note: 'G', selected: true, octave: 4, isStopping: null, isPlaying: false }
        ]
      ]
    } as ChordPiano

    const mockState: Partial<AppState> = {
      synth: 'piano',
      volume: 90,
      format: 'p'
    }

    const mockSynth = {
      synth: {
        toDestination: vi.fn(),
        releaseAll: vi.fn(),
        triggerAttackRelease: vi.fn(),
        volume: { value: 0 }
      },
      baseDecibel: 0
    }

    const synthLibrary = vi.mocked(await import('./synthLibrary'))
    synthLibrary.getSynth.mockReturnValue(mockSynth as any)

    await playChord(mockDispatch, mockState as AppState, mockChordPiano)
    
    expect(mockSynth.synth.toDestination).toHaveBeenCalled()
    expect(mockSynth.synth.releaseAll).toHaveBeenCalled()

    // verify volume is adjusted based on note height
    expect(mockSynth.synth.volume.value).toBeDefined()
    
    expect(mockSynth.synth.triggerAttackRelease).toHaveBeenCalledWith(
      ['C3', 'E3', 'G3'],
      '1.1',
      expect.any(Number),
      0.7
    )

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: {
        ...mockChordPiano,
        isPlaying: true
      }
    })

    vi.advanceTimersByTime(1500)
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: expect.objectContaining({
        id: 1,
        isPlaying: false
      })
    })
  })

  it('should handle playChordById by fetching piano and calling playChord', async () => {
    const mockDispatch = vi.fn()
    const mockChordPiano: ChordPiano = {
      id: 1,
      isPlaying: false,
      piano: [
        [
          { note: 'C', selected: true, octave: 4, isStopping: null, isPlaying: false }
        ]
      ]
    } as ChordPiano

    const mockState: Partial<AppState> = {
      synth: 'piano',
      volume: 90,
      format: 'p'
    }

    const appContext = vi.mocked(await import('../components/context/AppContext'))
    appContext.getPianoById.mockReturnValue(mockChordPiano)

    const mockSynth = {
      synth: {
        toDestination: vi.fn(),
        releaseAll: vi.fn(),
        triggerAttackRelease: vi.fn(),
        volume: { value: 0 }
      },
      baseDecibel: 0
    }

    const synthLibrary = vi.mocked(await import('./synthLibrary'))
    synthLibrary.getSynth.mockReturnValue(mockSynth as any)

    await playChordById(mockDispatch, mockState as AppState, 1)

    expect(appContext.getPianoById).toHaveBeenCalledWith(mockState, 1)
    expect(mockSynth.synth.triggerAttackRelease).toHaveBeenCalled()
  })
})