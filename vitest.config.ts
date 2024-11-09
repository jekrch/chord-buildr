import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'], // We'll create this next
  },
  resolve: {
    alias: {
      'tone': 'tone/build/Tone.js', // Use the bundled version instead of ESM
    },
  },
})