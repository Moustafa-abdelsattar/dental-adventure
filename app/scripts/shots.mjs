// Visual-gate screenshots of the key screens.
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://localhost:4517'
const out = 'shots'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await page.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () {
    setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
    return Promise.resolve()
  }
  HTMLMediaElement.prototype.pause = function () {}
})

await page.goto(base)
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/01-language.png` })

await page.getByRole('button', { name: 'English' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/02-parent-visit.png` })

await page.getByRole('button', { name: 'First Checkup' }).click()
await page.getByPlaceholder('Name (optional)').fill('Omar')
await page.waitForTimeout(300)
await page.screenshot({ path: `${out}/03-parent-name.png` })

await page.getByRole('button', { name: 'Next' }).click()
await page.waitForTimeout(2500) // let the 3D hero load
await page.screenshot({ path: `${out}/04-welcome-3d.png` })

await page.getByRole('button', { name: 'Start the Adventure' }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/05-clinic.png` })

await page.getByTestId('hotspot-chair').click({ force: true })
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/06-clinic-card.png` })
await page.getByTestId('zoom-card').getByRole('button').click()
for (const id of ['light', 'sink', 'table']) {
  await page.getByTestId(`hotspot-${id}`).click({ force: true })
  await page.getByTestId('zoom-card').getByRole('button').click()
}
await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/07-tools.png` })

await page.getByTestId('tool-mirror').click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/08-tool-met.png` })

// jump to reward via store for the last shot
await page.evaluate(() => {
  localStorage.setItem(
    'dental-adventure-v1',
    JSON.stringify({
      state: {
        lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: true,
        stars: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true },
      },
      version: 0,
    }),
  )
})
await page.reload()
await page.getByRole('button', { name: 'Start the Adventure' }).click()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/09-reward.png` })

// Arabic welcome for RTL check
await page.evaluate(() => localStorage.clear())
await page.goto(base)
await page.getByRole('button', { name: 'العربية' }).click()
await page.getByRole('button', { name: /زيارة علاج/ }).click()
await page.getByRole('button', { name: /تخطّي/ }).click()
await page.waitForTimeout(2000)
await page.screenshot({ path: `${out}/10-welcome-ar.png` })

await browser.close()
console.log('done')
