import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 300)))
page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 500)))
page.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText))
await page.goto('http://localhost:4173/')
await page.waitForTimeout(4000)
console.log('[html]', (await page.content()).slice(0, 1200))
await browser.close()
