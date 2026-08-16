import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist-clinic'),
    emptyOutDir: true,
    target: 'es2020',
    lib: {
      entry: resolve(import.meta.dirname, 'clinic.js'),
      name: 'ClinicViewer',
      formats: ['iife'],
      fileName: () => 'viewer.js',
    },
  },
})
