import { test, expect, type Page } from '@playwright/test'

// Narration clips resolve instantly in E2E so flows run fast and deterministically.
async function fakeAudio(page: Page) {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
}

// A story beat covers the next module for a couple of seconds and swallows the
// first tap (by design — a child taps it away). Tests must let it leave first.
async function settle(page: Page) {
  await expect(page.getByTestId('story-beat')).toHaveCount(0, { timeout: 30_000 })
}

// Tappable game elements breathe on purpose (infinite pulse animations), so
// Playwright's stability check would wait forever — force-click those.
async function completeClinic(page: Page) {
  for (const id of ['light', 'chair', 'sink', 'table']) {
    await page.getByTestId(`hotspot-${id}`).click({ force: true })
    await page.getByTestId('zoom-card').getByRole('button').click()
  }
}

// Each tool hides under a cover the child scratches away. Dragging is the real
// gesture, so this drags — a tap works too, but exercising the cheap path in
// the only browser test would leave the scratching itself unproven.
async function completeTools(page: Page, ids: string[]) {
  await settle(page)
  for (const id of ids) {
    const cell = page.getByTestId(`tool-${id}`)
    await expect(cell).toBeVisible({ timeout: 15_000 })
    const box = (await cell.boundingBox())!

    // A cell only gives up once seven tenths of it has come away, so this has
    // to sweep the whole thing the way a child would, not nick one corner.
    await page.mouse.move(box.x + box.width * 0.06, box.y + box.height * 0.15)
    await page.mouse.down()
    for (const row of [0.15, 0.38, 0.62, 0.85]) {
      for (const col of [0.06, 0.3, 0.55, 0.78, 0.94]) {
        await page.mouse.move(box.x + box.width * col, box.y + box.height * row, { steps: 2 })
      }
      await page.mouse.move(box.x + box.width * 0.06, box.y + box.height * row, { steps: 2 })
    }
    await page.mouse.up()

    // revealing raises a card with the tool's name, description and fun fact
    const card = page.getByTestId('zoom-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.getByRole('button').click()
    await expect(page.getByTestId(`met-${id}`)).toBeVisible({ timeout: 15_000 })
  }
}

async function completeBrush(page: Page) {
  await settle(page)
  await page.getByTestId('pick-brush').click({ force: true })
  // wait for each spot instead of blind-clicking: a story beat can still be
  // fading out when the brush screen arrives, and a lost click strands the run
  for (const i of [0, 1, 2, 3]) {
    const spot = page.getByTestId(`plaque-${i}`)
    await expect(spot).toBeAttached({ timeout: 15_000 })
    await spot.click({ force: true })
    await expect(spot).toHaveCount(0, { timeout: 15_000 })
  }
}

async function completeVisit(page: Page) {
  await settle(page)
  await page.getByTestId('drnour-mask').click({ force: true })
  await page.getByTestId('raise-hand').click({ force: true })
  // steps auto-advance; the reward screen is the exit criterion
}

test.describe('Dental Adventure happy paths', () => {
  test('English checkup path start to Dental Hero', async ({ page }) => {
    test.setTimeout(180_000)
    await fakeAudio(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByRole('button', { name: 'First Checkup' }).click()
    await page.getByPlaceholder('Name (optional)').fill('Omar')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Start the Adventure' }).click()
    await expect(page.getByText("Omar's Adventure")).toBeVisible()

    await completeClinic(page)
    await expect(page.getByTestId('tool-mirror')).toBeVisible({ timeout: 20_000 })
    await completeTools(page, ['mirror', 'explorer', 'suction'])
    await completeTools(page, ['syringe', 'brush', 'xray'])
    await completeTools(page, ['ring', 'umbrella', 'spray'])
    await expect(page.getByTestId('pick-brush')).toBeVisible({ timeout: 20_000 })
    await completeBrush(page)
    await expect(page.getByTestId('drnour-mask')).toBeVisible({ timeout: 20_000 })
    await completeVisit(page)

    await expect(page.getByTestId('reward-screen')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Congratulations, Omar!')).toBeVisible()
  })

  test('Arabic treatment path is RTL and reaches the hero screen', async ({ page }) => {
    test.setTimeout(180_000)
    await fakeAudio(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.getByRole('button', { name: 'زيارة علاج' }).click()
    await page.getByRole('button', { name: 'تخطّي' }).click()
    await page.getByTestId('start-adventure').getByRole('button').click()

    await completeClinic(page)
    await expect(page.getByTestId('tool-mirror')).toBeVisible({ timeout: 20_000 })
    await completeTools(page, ['mirror', 'explorer', 'suction'])
    await completeTools(page, ['syringe', 'brush', 'xray'])
    await completeTools(page, ['ring', 'umbrella', 'spray'])
    // prepare: ring → umbrella → spray
    await expect(page.getByTestId('prep-ring')).toBeVisible({ timeout: 20_000 })
    await settle(page)
    for (const id of ['ring', 'umbrella', 'spray']) {
      await page.getByTestId(`prep-${id}`).click({ force: true })
      await expect(page.getByTestId(`prep-done-${id}`)).toBeVisible({ timeout: 15_000 })
    }
    // sleepy spray mission runs by itself
    await expect(page.getByTestId('drnour-mask')).toBeVisible({ timeout: 60_000 })
    await completeVisit(page)

    await expect(page.getByTestId('reward-screen')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('بقيت مستكشف السنان!')).toBeVisible()
  })

  test('?visit=treatment preset skips the visit chooser', async ({ page }) => {
    await fakeAudio(page)
    await page.goto('/?visit=treatment')
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByText('Which visit is your child having?')).toHaveCount(0)
    await expect(page.getByPlaceholder('Name (optional)')).toBeVisible()
  })

  test('works fully offline after the first load', async ({ page, context }) => {
    test.setTimeout(120_000)
    await fakeAudio(page)
    await page.goto('/')
    // wait until the service worker controls the page and precaching settled
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForTimeout(3000)
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible({ timeout: 20_000 })
    await context.setOffline(false)
  })

  test('progress survives a reload and resumes at the next module', async ({ page }) => {
    test.setTimeout(120_000)
    await fakeAudio(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByRole('button', { name: 'First Checkup' }).click()
    await page.getByRole('button', { name: 'Skip' }).click()
    await page.getByRole('button', { name: 'Start the Adventure' }).click()
    await completeClinic(page)
    await expect(page.getByTestId('tool-mirror')).toBeVisible({ timeout: 20_000 })

    await page.reload()
    // returning child: parent moment skipped, welcome-back → straight to tools
    await page.getByRole('button', { name: 'Start the Adventure' }).click()
    await expect(page.getByTestId('tool-mirror')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('star-filled')).toHaveCount(1)
  })
})
