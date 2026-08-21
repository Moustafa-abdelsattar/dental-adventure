import { chromium } from '@playwright/test'
const browser = await chromium.launch({ headless: false, args: ['--window-size=470,1000'] })
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, hasTouch: true })
const page = await ctx.newPage()
await page.goto('https://dental-adventure-production.up.railway.app/')
console.log('open — pick a language and play. Close the window when done.')
await new Promise(r => browser.on('disconnected', r))
