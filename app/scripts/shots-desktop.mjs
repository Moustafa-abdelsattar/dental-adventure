// Desktop/tablet presentation check: the game should read as one phone-shaped
// panel on a calm desk at every window size, never sprawled across the screen.
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4517'
const sizes = [
  ['desktop-1440x900', 1440, 900],
  ['laptop-1280x720', 1280, 720],
  ['window-851x773', 851, 773],
  ['tablet-820x1180', 820, 1180],
]
const browser = await chromium.launch()
for (const [name, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
  await page.goto(base)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `shots/desk/01-language-${name}.png` })
  const m = await page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    innerH: innerHeight,
    scrollW: document.documentElement.scrollWidth,
  }))
  console.log(name, JSON.stringify(m))
  await page.getByRole('button', { name: 'English' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `shots/desk/02-parent-${name}.png` })
  await page.getByRole('button', { name: 'First Checkup' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `shots/desk/03-welcome-${name}.png` })
  await page.getByTestId('start-adventure').getByRole('button').click()
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `shots/desk/04-clinic-${name}.png` })
  await page.close()
}
await browser.close()
