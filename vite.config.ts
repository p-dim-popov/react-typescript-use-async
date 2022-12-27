/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [react()],
  test: {
    includeSource: ['src/**/*.{ts,tsx}'],
    coverage: {
      reporter: ['text-summary', 'text', 'json-summary', 'html'],
    },
    mockReset: true,
    restoreMocks: true,
  },
})
