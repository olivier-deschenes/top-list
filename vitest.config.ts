import { defineConfig } from 'vitest/config'

// Unit tests cover pure logic only, so skip the app's Vite plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
