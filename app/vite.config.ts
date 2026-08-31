/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Three.js and the 3D stage are reachable only from the `?stage3d=1`
        // harness, never from the game a child plays, and they are already
        // split off as lazy chunks. This only *renames* them into an `assets/3d/`
        // folder — it deliberately does not regroup them, because forcing them
        // into named chunks puts them in the entry's static graph and Vite then
        // emits a `modulepreload` for a megabyte of renderer on first paint.
        // The folder exists so the service worker below has a stable pattern to
        // exclude; hashed chunk names give it nothing to match on.
        chunkFileNames(chunk) {
          const is3d = chunk.moduleIds?.some(
            id =>
              id.includes('node_modules/three') ||
              id.includes('@react-three') ||
              id.includes('/src/three/'),
          )
          return is3d ? 'assets/3d/[name]-[hash].js' : 'assets/[name]-[hash].js'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // precache everything, including narration — after the first online
        // load the whole game (voices included) works fully offline
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webp,mp3}'],
        // …except the 3D harness. It is not on the child's path, and the models
        // it needs are .glb, which was never precached anyway — so caching its
        // code bought nothing and cost the offline bundle nearly a megabyte.
        globIgnores: ['**/assets/3d/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Dental Adventure',
        short_name: 'Dental Adventure',
        description: 'A friendly pre-visit game that helps children meet the dental clinic before their visit.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#7ec8f2',
        background_color: '#fef9f0',
        icons: [
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    // Run test files one at a time. Most of these screens are driven by timers
    // and animation frames, and under parallel execution they lose races to
    // CPU contention — the suite failed 7-10 tests per run with a different
    // set failing each time, while every file passed on its own. Serially it
    // is 72/72. A green suite that is honest is worth more than a fast one.
    fileParallelism: false,
  },
})
