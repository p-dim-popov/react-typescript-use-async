/// <reference types="vitest" />
import {
  defineConfig,
  type UserConfigExport as DefaultUserConfigExport,
} from 'vite'
import type { UserConfigExport as VitestUserConfigExport } from 'vitest/config'
import react from '@vitejs/plugin-react'

type UserConfigExport = DefaultUserConfigExport & VitestUserConfigExport

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./__test__/test-setup.ts'],
    includeSource: ['src/**/*.{ts,tsx}'],
    coverage: {
      reporter: ['text-summary', 'text'],
    },
    mockReset: true,
    restoreMocks: true,
  },
} as UserConfigExport)
