// Opens the built app in a headed Playwright Chromium window (phone-sized)
// so it can be played by hand. Keeps the window open until it is closed.
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: false, args: ['--window-size=470,980'] })
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, hasTouch: true })
await page.goto('http://127.0.0.1:4517/')
console.log('app window open — close the browser window when done')
await new Promise(resolve => browser.on('disconnected', resolve))
