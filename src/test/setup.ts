import { beforeAll, vi } from 'vitest'

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