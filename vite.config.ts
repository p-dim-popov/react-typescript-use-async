/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  build: {
    rollupOptions: {
      external: ['react'],
    },
    lib: {
      entry: {
        'react-typescript-use-async': './src/main.ts',
        demo: './index.html',
      },
    },
  },
  plugins: [react(), dts()],
  test: {
    environment: 'jsdom',
    includeSource: ['src/**/*.{ts,tsx}'],
    exclude: ['src/demo/**/*', 'node_modules/**/*'],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
    },
    mockReset: true,
    restoreMocks: true,
  },
})
