// End-to-end audit of the deployed game: plays the whole visit in both
// languages against production, recording every clip that plays, every frame
// that appears, and anything the page throws.
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const URL = process.env.BASE ?? 'https://dental-adventure-production.up.railway.app/'
const DUR = JSON.parse(readFileSync('../docs/narration-review/clip-durations.json', 'utf8'))
const b = await chromium.launch()
const problems = []

for (const lang of ['en', 'ar']) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const errors = []
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  p.on('console', m => {
    if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`)
  })
  const missing = []
  p.on('response', r => {
    if (r.url().includes('/audio/') && r.status() >= 400) missing.push(`${r.status()} ${r.url().split('/audio/')[1]}`)
  })

  await p.addInitScript(dur => {
    window.__a = []
    window.__f = []
    window.__t0 = Date.now()
    HTMLMediaElement.prototype.play = function () {
      const k = (this.currentSrc || this.src || '').split('/audio/')[1]?.replace(/\.mp3$/, '') || ''
      const [l, id] = k.split('/')
      const s = (dur[l] && dur[l][id]) || 0.05
      if (id) window.__a.push({ t: Date.now() - window.__t0, id, s })
      setTimeout(() => this.dispatchEvent(new Event('ended')), s * 1000)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  }, DUR)

  await p.goto(URL)
  await p.evaluate(
    l =>
      localStorage.setItem(
        'dental-adventure-v1',
        JSON.stringify({
          state: {
            lang: l, path: 'treatment', childName: l === 'ar' ? 'ليلى' : 'Lina',
            freePlay: false, heroEarned: false,
            stars: { clinic: true, tools: true, prepare: true, spray: true },
          },
          version: 0,
        }),
      ),
    lang,
  )
  await p.reload()
  await p.waitForTimeout(800)
  await p.getByTestId('start-adventure').getByRole('button').click()
  await p.evaluate(() => {
    window.__t0 = Date.now()
    window.__a.length = 0
    setInterval(() => {
      const on = [...document.querySelectorAll('[data-testid^="visit-frame-"]')]
        .filter(e => e.dataset.active === 'true')
        .map(e => e.dataset.testid.replace('visit-frame-', ''))
      const last = window.__f[window.__f.length - 1]
      const now = on.join('+')
      if (!last || last.f !== now) window.__f.push({ t: Date.now() - window.__t0, f: now })
    }, 80)
  })

  for (let i = 0; i < 40; i++) {
    if (await p.getByTestId('raise-hand').count()) break
    await p.getByTestId('drnour-mask').click({ force: true }).catch(() => {})
    await p.waitForTimeout(800)
  }
  await p.getByTestId('raise-hand').waitFor({ timeout: 45000 })
  for (let i = 0; i < 40; i++) {
    await p.getByTestId('raise-hand').click({ force: true }).catch(() => {})
    await p.waitForTimeout(1000)
    if (await p.evaluate(() => window.__a.some(a => /simulation|step\.chair/.test(a.id)))) break
  }
  await p.waitForTimeout(lang === 'ar' ? 100000 : 60000)

  const r = await p.evaluate(() => ({ a: window.__a, f: window.__f }))
  const spoken = r.a.map(x => x.id)
  const frames = r.f.map(x => x.f).filter(Boolean).filter((v, i, a) => v !== a[i - 1])

  console.log(`\n── ${lang.toUpperCase()} ──`)
  console.log('  spoken :', spoken.join(' → '))
  console.log('  frames :', frames.join(' → '))
  console.log('  reached the end:', spoken.includes('visit.done'))
  console.log('  page errors:', errors.length ? errors : 'none')
  console.log('  audio 4xx/5xx:', missing.length ? missing : 'none')

  if (!spoken.includes('visit.done')) problems.push(`${lang}: never reached visit.done`)
  if (errors.length) problems.push(`${lang}: ${errors.length} page errors`)
  if (missing.length) problems.push(`${lang}: ${missing.length} audio requests failed`)
  // The walk-through starts after the stop-signal beat, so drop everything up
  // to and including the raised hand: before it the chair is the meet screen's
  // backdrop, not the first step.
  const want = ['chair', 'light', 'mirror', 'sleepy', 'count', 'count-ten', 'clean']
  const walk = frames.slice(frames.lastIndexOf('hand') + 1)
  const got = walk.filter(f => want.includes(f))
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${lang}: frame order ${got.join(',')} != ${want.join(',')}`)

  await p.close()
}

console.log('\n═══ VERDICT ═══')
console.log(problems.length ? problems.map(x => '  ✗ ' + x).join('\n') : '  no problems found')
await b.close()
