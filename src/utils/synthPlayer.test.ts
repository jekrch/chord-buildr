import { describe, it, expect, vi } from 'vitest'
import { playMidiNotesGuitar } from './synthPlayer'
// @ts-ignore
import GuitarElectricMp3 from 'tonejs-instrument-guitar-electric-mp3';

describe('playMidiNotesGuitar', () => {
  it('should play midi notes with correct timing', async () => {
    const midiNotes = [60, 64, 67] // C major triad
    
    await playMidiNotesGuitar(midiNotes)
    
    // verify guitar sampler was created
    expect(GuitarElectricMp3).toHaveBeenCalled()
    
    const samplerInstance = vi.mocked(GuitarElectricMp3).mock.results[0].value
    
    expect(samplerInstance.toDestination).toHaveBeenCalled()
    expect(samplerInstance.releaseAll).toHaveBeenCalled()
    expect(samplerInstance.triggerAttackRelease).toHaveBeenCalledTimes(3)
  })
})