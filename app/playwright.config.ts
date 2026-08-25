import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4517'
const sitesBypassToken = process.env.SITES_BYPASS_BEARER_TOKEN

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL,
    extraHTTPHeaders: sitesBypassToken ? { Authorization: `Bearer ${sitesBypassToken}` } : undefined,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4517 --strictPort',
        port: 4517,
        reuseExistingServer: false,
        timeout: 60_000,
      },
})
