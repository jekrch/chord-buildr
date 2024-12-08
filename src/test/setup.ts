import { beforeAll, vi } from 'vitest'

beforeAll(() => {
  // mock the guitar instrument package
  vi.mock('tonejs-instrument-guitar-electric-mp3', () => {
    return {
      default: vi.fn().mockImplementation(({ onload }) => {
        // call onload callback immediately to resolve the promise
        setTimeout(onload, 0)
        
        return {
          toDestination: vi.fn(),
          releaseAll: vi.fn(),
          triggerAttackRelease: vi.fn()
        }
      })
    }
  })

  // mock the main tone package
  vi.mock('tone', () => {
    return {
      start: vi.fn(),
      getContext: vi.fn().mockReturnValue({
        state: 'running',
        resume: vi.fn()
      }),
      Frequency: vi.fn().mockImplementation((midi) => ({
        toNote: () => `A${midi}`  // simplified note conversion for testing
      })),
      now: vi.fn().mockReturnValue(0),
      Transport: {
        start: vi.fn(),
        stop: vi.fn(),
      },
      Sampler: vi.fn().mockImplementation(() => ({
        toDestination: vi.fn(),
        releaseAll: vi.fn(),
        triggerAttackRelease: vi.fn()
      }))
    }
  })
})