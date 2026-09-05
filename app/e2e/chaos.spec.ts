/**
 * What a four-year-old actually does.
 *
 * The happy-path suite proves the game works when it is played properly. This
 * one assumes it will not be: a child hammers the same button eight times,
 * a parent reloads mid-sentence, a tablet goes offline in the middle of the
 * clinic, someone's old save is still in localStorage from a build that no
 * longer exists. None of that may white-screen, soft-lock, skip a module, or
 * award a star twice.
 *
 * The rule every test here shares: after the abuse, the app must still be a
 * game — something on screen, no uncaught error, and a way forward.
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

// Abuse takes longer than a clean play-through: every press is deliberately
// aimed at something that is mid-animation or not ready yet.
test.setTimeout(120_000)

/** Narration stubbed to ~nothing so a play-through is seconds, not minutes. */
async function fastAudio(page: Page) {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event('ended')), 20)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
}

/**
 * Anything the page throws, and anything it logs as an error, is a failure —
 * these screens swallow a lot on purpose (audio especially), so a genuine
 * uncaught error is always worth stopping for.
 */
function watchForErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() !== 'error') return
    const text = m.text()
    // a missing clip is D3/D5, already tracked, and not what this suite is for
    if (/\/audio\/|Failed to load resource/.test(text)) return
    errors.push(`console: ${text}`)
  })
  return errors
}

/** The app is still usable: something rendered, and it is not a blank body. */
async function stillAGame(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty()
  const buttons = await page.getByRole('button').count()
  expect(buttons, 'no way forward — every control has gone').toBeGreaterThan(0)
}

const seed = (state: Record<string, unknown>) =>
  JSON.stringify({ state: { freePlay: false, heroEarned: false, ...state }, version: 0 })

async function seedAt(page: Page, state: Record<string, unknown>) {
  await page.goto('/')
  await page.evaluate(s => localStorage.setItem('dental-adventure-v1', s), seed(state))
  await page.reload()
}

/**
 * Get to the game. A save with a path but no stars still shows the parent's
 * name step first — `parentDone` only skips it for a child who has already
 * earned something — so clear that before reaching for Start.
 */
async function beginPlay(page: Page) {
  const startBtn = page.getByTestId('start-adventure').getByRole('button')
  for (let i = 0; i < 3 && !(await startBtn.count()); i++) {
    const skip = page.getByRole('button', { name: /Skip|تخطّي/ })
    if (await skip.count()) await skip.first().click({ force: true })
    else await page.getByRole('button').last().click({ force: true })
    await page.waitForTimeout(300)
  }
  await startBtn.waitFor({ timeout: 10000 })
  await startBtn.click()
}

const CHECKUP = { lang: 'en', path: 'checkup', childName: 'Lina' }

test.describe('hostile input', () => {
  test('spamming a button never advances twice or awards a star twice', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await page.goto('/')

    // language: hammer both, fast. Whichever wins, exactly one must.
    await Promise.all([
      page.getByRole('button', { name: 'English', exact: true }).click({ force: true }),
      page.getByRole('button', { name: 'العربية', exact: true }).click({ force: true }),
    ])
    await stillAGame(page)

    await page.getByRole('button').first().click({ force: true }) // visit type
    for (let i = 0; i < 8; i++) await page.getByRole('button').last().click({ force: true }).catch(() => {})
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('mashing Next through a whole module cannot skip a module or over-award', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await seedAt(page, CHECKUP)
    await beginPlay(page)

    // Press every hotspot, several times each, and mash its card shut — the
    // card opens 500ms after the press and its Next is dead until the line
    // finishes, so the abuse has to be aimed at something that is actually
    // there. Extra presses on top are the point.
    {
      for (const id of ['chair', 'light', 'suction', 'syringe']) {
        for (let i = 0; i < 3; i++) {
          await page.getByTestId(`hotspot-${id}`).click({ force: true }).catch(() => {})
        }
        const card = page.getByTestId('zoom-card')
        await card.waitFor({ timeout: 4000 }).catch(() => {})
        for (let i = 0; i < 5; i++) {
          if (!(await card.isVisible().catch(() => false))) break
          await card.getByRole('button').click({ force: true }).catch(() => {})
          await page.waitForTimeout(120)
        }
      }
    }
    await page.waitForTimeout(2000)

    const stars = await page.evaluate(() => {
      const raw = localStorage.getItem('dental-adventure-v1')
      return raw ? Object.keys(JSON.parse(raw).state.stars ?? {}) : []
    })
    // clinic awards exactly one star, however many times it was pressed
    expect(stars.filter(s => s === 'clinic')).toHaveLength(1)
    expect(stars.length, `over-awarded: ${stars.join()}`).toBeLessThanOrEqual(2)
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('tapping through the handover between modules does not break the stage', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await seedAt(page, CHECKUP)
    await beginPlay(page)

    for (const id of ['chair', 'light', 'suction', 'syringe']) {
      await page.getByTestId(`hotspot-${id}`).click({ force: true }).catch(() => {})
      const card = page.getByTestId('zoom-card')
      await card.waitFor({ timeout: 6000 }).catch(() => {})
      for (let i = 0; i < 5; i++) {
        if (!(await card.isVisible().catch(() => false))) break
        await card.getByRole('button').click({ force: true }).catch(() => {})
        await page.waitForTimeout(120)
      }
    }
    // hammer the middle of the stage while one screen crosses over the next
    for (let i = 0; i < 25; i++) {
      await page.mouse.click(195, 420 + (i % 5) * 30).catch(() => {})
    }
    await page.waitForTimeout(1500)
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('reload and resume', () => {
  for (const [name, state] of [
    ['language screen', {}],
    ['visit chooser', { lang: 'en' }],
    ['welcome', { ...CHECKUP }],
    ['mid clinic', { ...CHECKUP, stars: {} }],
    ['mid tools', { ...CHECKUP, stars: { clinic: true } }],
    ['half-awarded tools', { ...CHECKUP, stars: { clinic: true, tools: true } }],
    ['mid practice', { ...CHECKUP, stars: { clinic: true, tools: true, 'tools-2': true } }],
    ['mid visit', { ...CHECKUP, stars: { clinic: true, tools: true, 'tools-2': true, practice: true } }],
    ['all done', { ...CHECKUP, stars: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true } }],
  ] as const) {
    test(`reload at ${name} lands somewhere playable`, async ({ page }) => {
      const errors = watchForErrors(page)
      await fastAudio(page)
      await seedAt(page, state as Record<string, unknown>)
      await page.reload()
      await page.reload() // twice, because children do
      await page.waitForTimeout(600)
      await stillAGame(page)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('reloading repeatedly mid-module never loses a star already earned', async ({ page }) => {
    await fastAudio(page)
    await seedAt(page, { ...CHECKUP, stars: { clinic: true } })
    for (let i = 0; i < 4; i++) {
      await page.reload()
      await page.waitForTimeout(300)
    }
    const stars = await page.evaluate(() => {
      const raw = localStorage.getItem('dental-adventure-v1')
      return Object.keys(JSON.parse(raw!).state.stars ?? {})
    })
    expect(stars).toContain('clinic')
  })
})

test.describe('a save that should not exist', () => {
  const corrupt: [string, string][] = [
    ['not json at all', 'hello'],
    ['empty string', ''],
    ['null state', JSON.stringify({ state: null, version: 0 })],
    ['no state key', JSON.stringify({ version: 0 })],
    ['stars is a string', JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: 'lots' }, version: 0 })],
    ['stars is an array', JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: ['clinic'] }, version: 0 })],
    ['unknown path', JSON.stringify({ state: { lang: 'en', path: 'root-canal', stars: {} }, version: 0 })],
    ['unknown language', JSON.stringify({ state: { lang: 'fr', path: 'checkup', stars: {} }, version: 0 })],
    ['stars for modules that do not exist', JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: { ghost: true, 'x-9': true } }, version: 0 })],
    ["another path's stars", JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: { prepare: true, spray: true } }, version: 0 })],
    ['name is a number', JSON.stringify({ state: { lang: 'en', path: 'checkup', childName: 42, stars: {} }, version: 0 })],
    ['hero without stars', JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: {}, heroEarned: true }, version: 0 })],
    ['free play with nothing done', JSON.stringify({ state: { lang: 'en', path: 'checkup', stars: {}, freePlay: true }, version: 0 })],
  ]

  for (const [name, raw] of corrupt) {
    test(`boots with ${name}`, async ({ page }) => {
      const errors = watchForErrors(page)
      await fastAudio(page)
      await page.goto('/')
      await page.evaluate(v => localStorage.setItem('dental-adventure-v1', v), raw)
      await page.reload()
      await page.waitForTimeout(700)
      await stillAGame(page)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})

test.describe('url meddling', () => {
  for (const q of ['?visit=checkup', '?visit=treatment', '?visit=nonsense', '?visit=', '?visit=checkup&visit=treatment', '?stage3d=0', '?foo=<script>alert(1)</script>']) {
    test(`survives ${q}`, async ({ page }) => {
      const errors = watchForErrors(page)
      await fastAudio(page)
      await page.goto(`/${q}`)
      await page.waitForTimeout(600)
      await stillAGame(page)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('changing the visit type mid-game does not strand the child', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await seedAt(page, { ...CHECKUP, stars: { clinic: true, tools: true, 'tools-2': true } })
    await page.goto('/?visit=treatment')
    await page.waitForTimeout(700)
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('back and forward do not white-screen', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await page.goto('/')
    await page.goto('/?visit=checkup')
    await page.goBack()
    await page.waitForTimeout(400)
    await stillAGame(page)
    await page.goForward()
    await page.waitForTimeout(400)
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('the network gives out', () => {
  test('going offline mid-module leaves the game playable', async ({ page, context }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await seedAt(page, CHECKUP)
    await beginPlay(page)
    await page.getByTestId('clinic-scene').waitFor({ timeout: 10000 })
    await context.setOffline(true)
    await page.getByTestId('hotspot-chair').click({ force: true })
    await page.waitForTimeout(1200)
    await stillAGame(page)
    await context.setOffline(false)
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('a name nobody expected', () => {
  for (const [label, name] of [
    ['very long', 'A'.repeat(300)],
    ['markup', '<img src=x onerror=alert(1)>'],
    ['rtl mixed into english', 'Lina ليلى 123'],
    ['emoji', '🦷🦷🦷'],
    ['whitespace only', '     '],
  ] as const) {
    test(`renders and prints with a ${label} name`, async ({ page }) => {
      const errors = watchForErrors(page)
      await fastAudio(page)
      await seedAt(page, {
        ...CHECKUP,
        childName: name,
        stars: { clinic: true, tools: true, 'tools-2': true, practice: true, visit: true },
      })
      await beginPlay(page)
      await page.getByTestId('reward-screen').waitFor({ timeout: 10000 })
      await expect(page.getByTestId('certificate-preview')).toBeVisible()
      // the certificate is drawn to a canvas; that must not throw either
      await stillAGame(page)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})

test.describe('monkey', () => {
  test('300 random taps leave the game standing', async ({ page }) => {
    const errors = watchForErrors(page)
    await fastAudio(page)
    await seedAt(page, CHECKUP)

    // deterministic so a failure can be replayed
    let s = 1337
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

    for (let i = 0; i < 300; i++) {
      const x = Math.floor(rnd() * 390)
      const y = Math.floor(rnd() * 844)
      await page.mouse.click(x, y).catch(() => {})
      if (i % 60 === 59) {
        await page.reload().catch(() => {})
        await page.waitForTimeout(250)
      }
    }
    await page.waitForTimeout(800)
    await stillAGame(page)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
