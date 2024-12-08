import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playMidiNotesGuitar } from './synthPlayer'
// @ts-ignore
import GuitarElectricMp3 from 'tonejs-instrument-guitar-electric-mp3'
import { ChordPiano } from './chordPianoHandler';

interface SamplerOptions {
  onload: () => void;
}

vi.mock('tone', () => ({
  Sampler: vi.fn(),
  Frequency: vi.fn((midi) => ({
    toNote: () => `Note${midi}`
  })),
  getContext: vi.fn(() => ({
    state: 'running',
    resume: vi.fn()
  })),
  now: vi.fn(() => 0)
}))

describe('playMidiNotesGuitar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should play midi notes with correct timing', async () => {
    const mockDispatch = vi.fn()
    const mockChordPiano = {
      id: 1,
      isPlaying: false
    } as ChordPiano;
    
    const mockSampler = {
      toDestination: vi.fn(),
      releaseAll: vi.fn(),
      triggerAttackRelease: vi.fn()
    }
    
    vi.mocked(GuitarElectricMp3).mockImplementation(({ onload }: SamplerOptions) => {
      setTimeout(() => onload(), 0)
      return mockSampler
    })

    const midiNotes = [60, 64, 67]
    
    const playPromise = playMidiNotesGuitar(mockDispatch, mockChordPiano, midiNotes)
    vi.runAllTimers()
    await playPromise
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: expect.objectContaining({
        id: 1,
        isPlaying: true
      })
    })
    
    expect(mockSampler.toDestination).toHaveBeenCalled()
    expect(mockSampler.releaseAll).toHaveBeenCalled()
    expect(mockSampler.triggerAttackRelease).toHaveBeenCalledTimes(3)
    
    midiNotes.forEach((_, index) => {
      const expectedStartTime = (index * 0.20 / midiNotes.length) + 0.03
      const expectedVelocity = 0.6 - (index * 0.05)
      
      expect(mockSampler.triggerAttackRelease).toHaveBeenCalledWith(
        `Note${midiNotes[index]}`,
        '1.0',
        expectedStartTime,
        expectedVelocity
      )
    })
    
    vi.advanceTimersByTime(1000)
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PIANO',
      id: 1,
      payload: expect.objectContaining({
        id: 1,
        isPlaying: false
      })
    })
  })
})