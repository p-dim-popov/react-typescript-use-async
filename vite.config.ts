/// <reference types="vitest" />

import { resolve } from 'path'
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
      name: 'react-typescript-use-async',
      fileName: 'react-typescript-use-async',
      entry: resolve(__dirname, 'src/main.ts'),
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
