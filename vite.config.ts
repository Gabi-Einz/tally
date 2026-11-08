/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const dropUnusedOnnxWasm = (): Plugin => ({
  name: 'drop-unused-onnx-wasm',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const fileName of Object.keys(bundle))
      if (fileName.endsWith('.wasm')) delete bundle[fileName]
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), dropUnusedOnnxWasm()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
