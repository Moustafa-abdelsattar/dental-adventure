import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
