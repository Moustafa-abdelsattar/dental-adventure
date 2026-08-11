// Full page-by-page visual sweep: every screen, both paths, key states.
import { chromium } from '@playwright/test'

const base = 'http://127.0.0.1:4517'
const out = 'shots/sweep'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await page.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () {
    setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
    return Promise.resolve()
  }
  HTMLMediaElement.prototype.pause = function () {}
})

const state = (s) => page.evaluate((st) => {
  localStorage.setItem('dental-adventure-v1', JSON.stringify({ state: st, version: 0 }))
}, s)
const shot = async (name, ms = 900) => {
  await page.waitForTimeout(ms)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log('*', name)
}

await page.goto(base)
await shot('01-language')
await page.getByRole('button', { name: 'English' }).click()
await shot('02-parent-visit', 600)
await page.getByRole('button', { name: 'First Checkup' }).click()
await shot('03-parent-name', 500)
await page.getByRole('button', { name: 'Skip' }).click()
await shot('04-welcome', 1200)
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('05-clinic', 1400)
await page.getByTestId('hotspot-chair').click({ force: true })
await shot('06-clinic-card', 700)
await page.getByTestId('zoom-card').getByRole('button').click()
await shot('07-clinic-explored', 600)

// tools (checkup)
await state({ lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('08-tools', 1200)
await page.getByTestId('tool-mirror').click()
await shot('09-tools-met', 900)

// practice brush
await state({ lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, 'tools-2': true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('10-brush', 1100)
await page.getByTestId('pick-brush').click({ force: true })
await page.getByTestId('plaque-0').click({ force: true })
await shot('11-brush-foam', 250)

// prepare (treatment)
await state({ lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('12-prepare', 1100)
await page.getByTestId('prep-ring').click({ force: true })
await shot('13-prepare-ring', 800)

// spray (treatment)
await state({ lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, prepare: true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('14-spray', 2600)

// visit
await state({ lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, prepare: true, spray: true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('15-visit-masked', 1100)
await page.getByTestId('drnour-mask').click({ force: true })
await shot('16-visit-stop', 900)

// reward + freeplay
await state({ lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: true, stars: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true } })
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('17-reward', 1400)
await page.getByRole('button', { name: 'Play Again' }).click()
await shot('18-freeplay', 900)

// Arabic RTL check
await state({ lang: 'ar', path: 'treatment', childName: 'عمر', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true } })
await page.reload()
await page.getByRole('button', { name: 'ابدأ المغامرة' }).click()
await shot('19-prepare-ar', 1100)

await browser.close()
console.log('sweep done')
