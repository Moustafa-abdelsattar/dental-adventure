// Screenshots every screen of the game in both languages, for the narration
// review sheet at docs/narration-review/.
//
// Narration is stubbed out (each clip "ends" 50ms after it starts) so the walk
// does not take the twenty minutes the real voice would. Every screen that
// gates on a line finishing therefore still opens.
//
// Usage: preview the built app on 4517, then `node scripts/capture-narration-review.mjs`
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const base = 'http://localhost:4517'
const out = '../docs/narration-review/shots'
mkdirSync(out, { recursive: true })

const S = {
  en: JSON.parse(readFileSync('src/content/strings/en.json', 'utf8')),
  ar: JSON.parse(readFileSync('src/content/strings/ar.json', 'utf8')),
}

/** Scrub a scratch cell clear: parallel passes across its box until it gives. */
async function scratch(page, testid) {
  const box = await page.getByTestId(testid).boundingBox()
  if (!box) throw new Error(`no box for ${testid}`)
  const card = page.getByTestId('zoom-card')
  for (let pass = 0; pass < 14 && !(await card.isVisible()); pass++) {
    const y = box.y + box.height * ((pass % 7) + 0.5) / 7
    await page.mouse.move(box.x + 4, y)
    await page.mouse.down()
    for (let s = 1; s <= 12; s++) {
      await page.mouse.move(box.x + 4 + ((box.width - 8) * s) / 12, y)
    }
    await page.mouse.up()
    await page.waitForTimeout(60)
  }
}

const browser = await chromium.launch()

/** Star sets that drop the child straight into one module. */
const AT = {
  clinic: {},
  tools: { clinic: true },
  prepare: { clinic: true, tools: true, 'tools-2': true },
  visit: { clinic: true, tools: true, 'tools-2': true, practice: true },
  reward: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true },
}

for (const lang of ['en', 'ar']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })

  const shot = async (name, ms = 800) => {
    await page.waitForTimeout(ms)
    await page.screenshot({ path: `${out}/${lang}-${name}.png` })
    console.log('  *', lang, name)
  }
  const start = () => page.getByTestId('start-adventure').getByRole('button').click()
  const seed = async (stars, path = 'checkup') => {
    await page.evaluate(
      st => localStorage.setItem('dental-adventure-v1', JSON.stringify({ state: st, version: 0 })),
      { lang, path, childName: lang === 'ar' ? 'ليلى' : 'Lina', freePlay: false, heroEarned: false, stars },
    )
    await page.reload()
    await page.waitForTimeout(400)
  }

  console.log('==', lang)
  await page.goto(base)
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  // 1 — language, always shown in both scripts at once
  await shot('01-language', 900)
  await page.getByRole('button', { name: lang === 'ar' ? 'العربية' : 'English', exact: true }).click()
  await shot('02-parent-visit', 700)
  await page.getByRole('button', { name: S[lang]['parent.checkup'], exact: true }).click()
  await shot('03-parent-name', 600)
  await page.getByRole('button', { name: S[lang]['parent.skip'], exact: true }).click()
  await shot('04-welcome', 1200)

  // 2 — the clinic
  await start()
  await shot('05-clinic', 1600)
  await page.getByTestId('hotspot-chair').click({ force: true })
  await shot('06-clinic-card', 1000)

  // 3 — the tools board. Four presses opens a cell without a drag.
  await seed(AT.tools)
  await start()
  await shot('07-tools', 1500)
  // Scratch, don't click. A press only takes a bite out of the cover and is
  // capped below the 70% the cell needs, on purpose — the child is meant to
  // scrub it away, so the capture has to do the same.
  await scratch(page, 'tool-mirror')
  await shot('08-tools-card', 1100)

  // 4 — the tooth: sleepy juice, then the polishing brush
  await seed(AT.prepare)
  await start()
  await shot('09-prepare', 1500)
  await page.getByTestId('prep-spray').click({ force: true })
  await shot('10-prepare-spray', 1800)
  await page.waitForTimeout(2200)
  await page.getByTestId('prep-brush').click({ force: true })
  await shot('11-prepare-brush', 1400)

  // 5 — the visit walk-through
  await seed(AT.visit)
  await start()
  await shot('12-visit-meet', 1500)
  await page.getByTestId('drnour-mask').click({ force: true })
  await shot('13-visit-stop', 1400)
  await page.getByTestId('raise-hand').click({ force: true })
  await shot('14-visit-paused', 900)
  await page.waitForTimeout(2200)
  await shot('15-visit-steps', 1500)

  // 6 — the certificate
  await seed(AT.reward)
  await start()
  await shot('16-reward', 1800)

  await page.close()
}

await browser.close()
console.log('done ->', out)
