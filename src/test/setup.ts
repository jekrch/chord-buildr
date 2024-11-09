import { beforeAll, vi } from 'vitest'
import * as Tone from 'tone'

beforeAll(() => {
  vi.mock('tone', () => ({
    default: {
      start: vi.fn(),
      Transport: {
        start: vi.fn(),
        stop: vi.fn(),
      },
    },
  }))
})