import { vi } from 'vitest'

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

// jsdom does no layout, so stub what the components measure and scroll
// with. every size reads as zero, which the board and header take in stride
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= function () {}
// jsdom's own logs "not implemented" on every call
window.scrollTo = (() => {}) as typeof window.scrollTo
