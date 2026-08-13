// Measures the geometry that "alignment" actually means: where each screen's
// title, stage and action row land, and whether anything overflows.
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4517'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(process.env.VW ?? 390), height: Number(process.env.VH ?? 844) }, hasTouch: true })
await page.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () {
    setTimeout(() => this.dispatchEvent(new Event('ended')), 50)
    return Promise.resolve()
  }
  HTMLMediaElement.prototype.pause = function () {}
})

const state = s =>
  page.evaluate(st => localStorage.setItem('dental-adventure-v1', JSON.stringify({ state: st, version: 0 })), s)

const measure = async name => {
  await page.waitForTimeout(900)
  const m = await page.evaluate(() => {
    const box = el => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { t: Math.round(r.top), l: Math.round(r.left), r: Math.round(r.right), b: Math.round(r.bottom) }
    }
    const hud = document.querySelector('.fixed.top-0')
    const h1 = document.querySelector('h1')
    const sub = h1?.parentElement?.querySelector('p')
    const next = document.querySelector('[data-testid="next-fallback"] button')
    return {
      vw: innerWidth,
      hud: box(hud),
      title: box(h1),
      sub: box(sub),
      next: box(next),
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
    }
  })
  console.log(JSON.stringify({ name, ...m }))
}

await page.goto(base)
await page.getByRole('button', { name: 'English' }).click()
await page.getByRole('button', { name: 'First Checkup' }).click()
await page.getByRole('button', { name: 'Skip' }).click()
await page.waitForTimeout(600)

const runs = [
  ['clinic', { lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: false } }],
  ['tools', { lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true } }],
  ['brush', { lang: 'en', path: 'checkup', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, 'tools-2': true } }],
  ['prepare', { lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true } }],
  ['spray', { lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, prepare: true } }],
  ['visit', { lang: 'en', path: 'treatment', childName: 'Omar', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true, prepare: true, spray: true } }],
  ['prepare-ar', { lang: 'ar', path: 'treatment', childName: 'عمر', freePlay: false, heroEarned: false, stars: { clinic: true, tools: true } }],
]

for (const [name, st] of runs) {
  await state(st)
  await page.reload()
  await page.getByTestId('start-adventure').getByRole('button').click()
  await measure(name)
}

await browser.close()
