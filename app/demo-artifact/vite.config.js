import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Bundles the viewer into one IIFE so it can be inlined into a single
// self-contained page — the artifact host blocks every external request.
export default defineConfig({
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2020',
    lib: {
      entry: resolve(import.meta.dirname, 'main.js'),
      name: 'ChairViewer',
      formats: ['iife'],
      fileName: () => 'viewer.js',
    },
  },
})
