// Visual-gate screenshots: every screen a child can reach, in both languages.
//
// The point is to be able to look at the whole game side by side in one folder.
// Screens drift apart one commit at a time — a card here, a button there — and
// the only reliable way to catch it is to see them next to each other rather
// than one at a time as each is built.
//
// Runs against a preview of the production build by default, because that is
// what ships; point BASE_URL at the dev server to shoot work in progress.
//
// Usage: BASE_URL=http://localhost:4518 node scripts/shots.mjs
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

// Playwright is a dependency of the app, not of this folder, so it is reached
// by path rather than by name — these scripts sit outside app/ and node would
// otherwise look for a node_modules that the repo root does not have.
const require = createRequire(import.meta.url)
const { chromium } = require('../app/node_modules/@playwright/test/index.js')

const base = process.env.BASE_URL ?? 'http://localhost:4518'
const out = process.env.SHOTS_DIR ?? 'shots'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })

// Narration would otherwise gate every screen on a real clip playing out.
await page.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () {
    setTimeout(() => this.dispatchEvent(new Event('ended')), 30)
    return Promise.resolve()
  }
  HTMLMediaElement.prototype.pause = function () {}
})

let n = 0
const shot = async name => {
  await page.waitForTimeout(700)
  const file = `${out}/${String(++n).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: file })
  console.log(file)
}

const tap = async testid => {
  await page.getByTestId(testid).click({ force: true })
  await page.waitForTimeout(250)
}

const dismissCard = async () => {
  const card = page.getByTestId('zoom-card')
  await card.waitFor({ state: 'visible', timeout: 15000 })
  await card.getByRole('button').click()
  await page.waitForTimeout(250)
}

/** Rub a cover away the way a child does — a tap only nibbles at it. */
const scratch = async id => {
  const cell = page.getByTestId(`tool-${id}`)
  await cell.waitFor({ state: 'visible', timeout: 15000 })
  const box = (await cell.boundingBox())
  await page.mouse.move(box.x + box.width * 0.06, box.y + box.height * 0.15)
  await page.mouse.down()
  for (const row of [0.15, 0.38, 0.62, 0.85]) {
    for (const col of [0.06, 0.3, 0.55, 0.78, 0.94]) {
      await page.mouse.move(box.x + box.width * col, box.y + box.height * row, { steps: 2 })
    }
  }
  await page.mouse.up()
}

/** Drop the player straight into a later module, so a shot is not ten minutes of play away. */
const seed = async state => {
  await page.evaluate(s => {
    localStorage.setItem('dental-adventure-v1', JSON.stringify({ state: s, version: 0 }))
  }, state)
  await page.reload()
  await page.waitForTimeout(400)
}

// ---- English check-up, from the top ------------------------------------------
await page.goto(base)
await shot('language')

await page.getByRole('button', { name: 'English' }).click()
await shot('parent-visit')

await page.getByRole('button', { name: 'First Checkup' }).click()
await page.getByPlaceholder('Name (optional)').fill('Omar')
await shot('parent-name')

await page.getByRole('button', { name: 'Next' }).click()
await page.waitForTimeout(2000) // the 3D hero takes a moment
await shot('welcome')

await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('clinic')

await tap('hotspot-chair')
await shot('clinic-card')
await dismissCard()
for (const id of ['light', 'sink', 'table']) {
  await tap(`hotspot-${id}`)
  await dismissCard()
}
await page.waitForTimeout(1200)
await shot('tools-board')

await scratch('mirror')
await shot('tool-card')
await dismissCard()
await scratch('explorer')
await dismissCard()
await shot('tools-partly-found')

// ---- the rest of the check-up, seeded ----------------------------------------
await seed({
  lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false,
  stars: { clinic: true, tools: true, 'tools-2': true },
})
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('practice-brush')

await seed({
  lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false,
  stars: { clinic: true, tools: true, 'tools-2': true, practice: true },
})
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('visit')

await seed({
  lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: true,
  stars: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true },
})
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('reward')

const cert = page.getByRole('button', { name: 'My Certificate' })
if (await cert.count()) {
  await cert.first().click()
  await shot('certificate')
}

// ---- the treatment path's own two screens ------------------------------------
await seed({
  lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false,
  stars: { clinic: true, tools: true },
})
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('prepare')

await seed({
  lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false,
  stars: { clinic: true, tools: true, prepare: true },
})
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await shot('spray')

// ---- Arabic, right to left ----------------------------------------------------
await page.evaluate(() => localStorage.clear())
await page.goto(base)
await page.getByRole('button', { name: 'العربية' }).click()
await shot('ar-parent-visit')
await page.getByRole('button', { name: /زيارة علاج/ }).click()
await page.getByRole('button', { name: /تخطّي/ }).click()
await page.waitForTimeout(2000)
await shot('ar-welcome')
await page.getByTestId('start-adventure').getByRole('button').click()
await shot('ar-clinic')
await tap('hotspot-chair')
await shot('ar-clinic-card')
await dismissCard()
for (const id of ['light', 'sink', 'table']) {
  await tap(`hotspot-${id}`)
  await dismissCard()
}
await page.waitForTimeout(1200)
await shot('ar-tools-board')
await scratch('mirror')
await shot('ar-tool-card')

await browser.close()
console.log(`\n${n} shots in ${out}/`)
