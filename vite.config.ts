import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

const dropUnusedOnnxWasm = (): Plugin => ({
  name: 'drop-unused-onnx-wasm',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const fileName of Object.keys(bundle))
      if (fileName.endsWith('.wasm')) delete bundle[fileName]
  },
})

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    dropUnusedOnnxWasm(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tally — gastos por voz',
        short_name: 'Tally',
        description: 'Registrá tus gastos hablando.',
        lang: 'es-AR',
        theme_color: '#1f6f4a',
        background_color: '#f3f5f2',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        globIgnores: ['plan.html'],
        navigateFallbackDenylist: [/\/plan\.html$/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/onnxruntime-web/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-runtime',
              expiration: { maxEntries: 10 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
