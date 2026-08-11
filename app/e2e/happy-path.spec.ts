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

// Tappable game elements breathe on purpose (infinite pulse animations), so
// Playwright's stability check would wait forever — force-click those.
async function completeClinic(page: Page) {
  for (const id of ['light', 'chair', 'sink', 'table']) {
    await page.getByTestId(`hotspot-${id}`).click({ force: true })
    await page.getByTestId('zoom-card').getByRole('button').click()
  }
}

async function completeTools(page: Page, ids: string[]) {
  // the last tool of a group advances the page immediately, unmounting its
  // met-badge — only assert the badge for non-final tools of the trio
  for (let i = 0; i < ids.length; i++) {
    await page.getByTestId(`tool-${ids[i]}`).click()
    if (i < ids.length - 1) await expect(page.getByTestId(`met-${ids[i]}`)).toBeVisible({ timeout: 15_000 })
  }
}

async function completeBrush(page: Page) {
  await page.getByTestId('pick-brush').click({ force: true })
  for (const i of [0, 1, 2, 3]) await page.getByTestId(`plaque-${i}`).click({ force: true })
}

async function completeVisit(page: Page) {
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
    await page.getByRole('button', { name: 'ابدأ المغامرة' }).click()

    await completeClinic(page)
    await expect(page.getByTestId('tool-mirror')).toBeVisible({ timeout: 20_000 })
    await completeTools(page, ['mirror', 'explorer', 'suction'])
    await completeTools(page, ['syringe', 'brush', 'xray'])
    await completeTools(page, ['ring', 'umbrella', 'spray'])
    // prepare: ring → umbrella → spray
    await expect(page.getByTestId('prep-ring')).toBeVisible({ timeout: 20_000 })
    for (const id of ['ring', 'umbrella', 'spray']) await page.getByTestId(`prep-${id}`).click({ force: true })
    // sleepy spray mission runs by itself
    await expect(page.getByTestId('drnour-mask')).toBeVisible({ timeout: 60_000 })
    await completeVisit(page)

    await expect(page.getByTestId('reward-screen')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('أصبحت الآن بطل الأسنان!')).toBeVisible()
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
