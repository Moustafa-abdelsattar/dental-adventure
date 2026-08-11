import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4517',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }],
  webServer: {
    command: 'npm run preview -- --port 4517 --strictPort',
    port: 4517,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
