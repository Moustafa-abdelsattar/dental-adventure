import { chromium } from '@playwright/test'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = resolve(appRoot, '..')
const outRoot = resolve(workspaceRoot, 'Arabic-narration-used')
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

const entries = [
  {
    id: 'milo.welcome',
    source: 'Arabic-narration-redo/01-shared-milo-lines/recordings/1.m4a.mp4',
    target: 'app/public/audio/ar/milo.welcome.mp3',
    screenshot: '00-start-screen.png',
    frame: 'Start screen before entering the clinic',
    note: 'Milo opening line on the Arabic welcome screen.',
  },
  {
    id: 'clinic.intro',
    source: 'Arabic-narration-redo/02-clinic-exploration/recordings/first record in the clinic exploration after milo screen.m4a.mp4',
    target: 'app/public/audio/ar/clinic.intro.mp3',
    screenshot: '01-clinic-start.png',
    frame: 'Clinic appears after pressing start',
    note: 'First narration on the clinic exploration screen.',
  },
  {
    id: 'clinic.chair.desc',
    source: 'Arabic-narration-redo/02-clinic-exploration/recordings/كرسى الاسنان.m4a.mp4',
    target: 'app/public/audio/ar/clinic.chair.desc.mp3',
    screenshot: '02-clinic-chair.png',
    frame: 'Chair tapped in clinic exploration',
    note: 'Spoken when the dental chair is tapped.',
  },
  {
    id: 'clinic.light.desc',
    source: 'Arabic-narration-redo/02-clinic-exploration/recordings/النور.m4a.mp4',
    target: 'app/public/audio/ar/clinic.light.desc.mp3',
    screenshot: '03-clinic-light.png',
    frame: 'Light tapped in clinic exploration',
    note: 'Spoken when the clinic light is tapped.',
  },
  {
    id: 'clinic.suction.desc',
    source: 'Arabic-narration-redo/02-clinic-exploration/recordings/مستر عطشان.m4a.mp4',
    target: 'app/public/audio/ar/clinic.suction.desc.mp3',
    screenshot: '04-clinic-suction.png',
    frame: 'Suction tapped in clinic exploration',
    note: 'Spoken when the suction tool is tapped.',
  },
  {
    id: 'clinic.syringe.desc',
    source: 'Arabic-narration-redo/02-clinic-exploration/recordings/مياههوا.m4a.mp4',
    target: 'app/public/audio/ar/clinic.syringe.desc.mp3',
    screenshot: '05-clinic-syringe.png',
    frame: 'Water/air tool tapped in clinic exploration',
    note: 'Spoken when the water/air syringe is tapped.',
  },
  {
    id: 'prepare.step.brush',
    source: 'Arabic-narration-redo/04-practice-brushing/recordings/�خطوة الدش الصغنون.m4a.mp4',
    target: 'app/public/audio/ar/prepare.step.brush.mp3',
    screenshot: '06-tooth-after-juice.png',
    frame: 'Tooth simulation after sleepy juice',
    note: 'The shower/brush step after the sleepy juice.',
  },
  {
    id: 'decay-removal-sfx',
    source: 'Arabic-narration-redo/04-practice-brushing/recordings/الاصوات و هو بيشيل السوسة.m4a.mp4',
    target: 'app/public/audio/ar/decay-removal-sfx.mp3',
    screenshot: '07-tooth-removing-decay.png',
    frame: 'Tooth simulation while removing decay',
    note: 'Sound effect while the child removes the decay/stains.',
  },
  {
    id: 'prepare.done',
    source: 'Arabic-narration-redo/04-practice-brushing/recordings/بعد ما يشيل السوسة.m4a.mp4',
    target: 'app/public/audio/ar/prepare.done.mp3',
    screenshot: '08-tooth-cleaned.png',
    frame: 'Tooth simulation after all decay is removed',
    note: 'Narration after the tooth cleanup finishes.',
  },
  {
    id: 'visit.meetDr',
    source: 'Arabic-narration-redo/مقدمة الدكتورة.m4a.mp4',
    target: 'app/public/audio/ar/visit.meetDr.mp3',
    screenshot: '09-dentist-masked.png',
    frame: 'Dentist visit starts',
    note: 'First dentist visit narration before the mask prompt.',
  },
  {
    id: 'visit.maskPrompt',
    source: 'Arabic-narration-redo/الدكتورة.m4a.mp4',
    target: 'app/public/audio/ar/visit.maskPrompt.mp3',
    screenshot: '09-dentist-masked.png',
    frame: 'Dentist mask prompt before tapping',
    note: 'Prompt before the child can tap the mask.',
  },
  {
    id: 'visit.maskOff',
    source: 'Arabic-narration/phase 4 after mask.ogg',
    target: 'app/public/audio/ar/visit.maskOff.mp3',
    screenshot: '10-dentist-after-mask.png',
    frame: 'After the mask is removed',
    note: 'Narration while the unmasked dentist remains visible.',
  },
  {
    id: 'visit.handPrompt',
    source: 'Arabic-narration-redo/ازاى هيرفع ايده معدل.m4a.mp4',
    target: 'app/public/audio/ar/visit.handPrompt.mp3',
    screenshot: '11-raise-hand-prompt.png',
    frame: 'Before the raise-hand button is pressed',
    note: 'Long prompt before the hand button becomes clickable.',
  },
]

entries.push(
  ...[
    {
      id: 'lang.greet',
      source: 'app/public/audio/ar/lang.greet.mp3',
      target: 'app/public/audio/ar/lang.greet.mp3',
      screenshot: '00-language-screen.png',
      frame: 'Arabic language selected',
      note: 'Confirmation after choosing Arabic.',
    },
    {
      id: 'milo.welcomeBack',
      source: 'app/public/audio/ar/milo.welcomeBack.mp3',
      target: 'app/public/audio/ar/milo.welcomeBack.mp3',
      screenshot: '00-start-screen.png',
      frame: 'Returning child start screen',
      note: 'Opening line for a returning Arabic session.',
    },
    {
      id: 'milo.hint.tap',
      source: 'app/public/audio/ar/milo.hint.tap.mp3',
      target: 'app/public/audio/ar/milo.hint.tap.mp3',
      screenshot: '01-clinic-start.png',
      frame: 'Tap hint on interactive stages',
      note: 'Hint line after a wrong tap or a long idle wait.',
    },
    {
      id: 'milo.great',
      source: 'app/public/audio/ar/milo.great.mp3',
      target: 'app/public/audio/ar/milo.great.mp3',
      screenshot: '06-tooth-after-juice.png',
      frame: 'Between tooth-prep steps',
      note: 'Short praise before the next tooth-prep instruction.',
    },
    ...[1, 2, 3, 4].map(n => ({
      id: `milo.praise.${n}`,
      source: `app/public/audio/ar/milo.praise.${n}.mp3`,
      target: `app/public/audio/ar/milo.praise.${n}.mp3`,
      screenshot: '07-tooth-removing-decay.png',
      frame: 'Decay spot cleaned',
      note: 'Praise line while the child removes decay/stains.',
    })),
    {
      id: 'milo.starEarned',
      source: 'app/public/audio/ar/milo.starEarned.mp3',
      target: 'app/public/audio/ar/milo.starEarned.mp3',
      screenshot: '01-clinic-start.png',
      frame: 'Arabic module completed',
      note: 'Star-earned line after Arabic modules complete.',
    },
    {
      id: 'clinic.done',
      source: 'app/public/audio/ar/clinic.done.mp3',
      target: 'app/public/audio/ar/clinic.done.mp3',
      screenshot: '01-clinic-start.png',
      frame: 'Clinic exploration completed',
      note: 'Spoken after all clinic objects are explored.',
    },
    {
      id: 'tools.title',
      source: 'app/public/audio/ar/tools.title.mp3',
      target: 'app/public/audio/ar/tools.title.mp3',
      screenshot: '12-tools-start.png',
      frame: 'Tools scratch board starts',
      note: 'Arabic-only title narration before the scratch instruction.',
    },
    {
      id: 'tools.intro',
      source: 'app/public/audio/ar/tools.intro.mp3',
      target: 'app/public/audio/ar/tools.intro.mp3',
      screenshot: '12-tools-start.png',
      frame: 'Tools scratch board starts',
      note: 'Instruction before the scratch cells become active.',
    },
    ...['mirror', 'explorer', 'spray', 'brush'].map(toolId => ({
      id: `tool.${toolId}.desc`,
      source: `app/public/audio/ar/tool.${toolId}.desc.mp3`,
      target: `app/public/audio/ar/tool.${toolId}.desc.mp3`,
      screenshot: `13-tool-${toolId}.png`,
      frame: `${toolId} tool card revealed`,
      note: 'Spoken when this tool is scratched open.',
    })),
    {
      id: 'tools.done',
      source: 'app/public/audio/ar/tools.done.mp3',
      target: 'app/public/audio/ar/tools.done.mp3',
      screenshot: '12-tools-start.png',
      frame: 'Tools scratch board completed',
      note: 'Spoken after all current tool cards are found.',
    },
    {
      id: 'visit.stopSignalDone',
      source: 'app/public/audio/ar/visit.stopSignalDone.mp3',
      target: 'app/public/audio/ar/visit.stopSignalDone.mp3',
      screenshot: '18-hand-raised.png',
      frame: 'Hand was raised',
      note: 'Spoken after the child presses the raise-hand button.',
    },
    {
      id: 'visit.simulation',
      source: 'app/public/audio/ar/visit.simulation.mp3',
      target: 'app/public/audio/ar/visit.simulation.mp3',
      screenshot: '19-visit-simulation.png',
      frame: 'Dentist visit walkthrough starts',
      note: 'Long walkthrough narration for the dentist simulation.',
    },
    {
      id: 'visit.step.clean',
      source: 'app/public/audio/ar/visit.step.clean.mp3',
      target: 'app/public/audio/ar/visit.step.clean.mp3',
      screenshot: '19-visit-simulation.png',
      frame: 'Final cleaning step in visit walkthrough',
      note: 'Cleaning line in the dentist visit simulation.',
    },
    {
      id: 'visit.done',
      source: 'app/public/audio/ar/visit.done.mp3',
      target: 'app/public/audio/ar/visit.done.mp3',
      screenshot: '19-visit-simulation.png',
      frame: 'Dentist visit walkthrough finishes',
      note: 'Completion line for the dentist visit.',
    },
    {
      id: 'reward.narration',
      source: 'app/public/audio/ar/reward.narration.mp3',
      target: 'app/public/audio/ar/reward.narration.mp3',
      screenshot: '20-reward.png',
      frame: 'Final reward and certificate screen',
      note: 'Final Arabic celebration narration.',
    },
  ].filter(entry => !entries.some(existing => existing.id === entry.id)),
)

function ensureInsideWorkspace(target) {
  const resolved = resolve(target)
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}\\`) && !resolved.startsWith(`${workspaceRoot}/`)) {
    throw new Error(`Refusing to write outside workspace: ${resolved}`)
  }
  return resolved
}

function duration(file) {
  try {
    return Number(
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], {
        encoding: 'utf8',
      }).trim(),
    )
  } catch {
    return null
  }
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function isPlaceholder(durationSeconds, sizeBytes) {
  return durationSeconds !== null && durationSeconds <= 0.6 && sizeBytes <= 6000
}

function fileSize(file) {
  try {
    const result = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=size', '-of', 'default=noprint_wrappers=1:nokey=1', file], {
      encoding: 'utf8',
    }).trim()
    return Number(result)
  } catch {
    return null
  }
}

async function seedSession(page, stars) {
  await page.goto(`${baseUrl}/?visit=treatment`, { waitUntil: 'networkidle' })
  await page.evaluate(nextStars => {
    localStorage.setItem(
      'dental-adventure-v1',
      JSON.stringify({
        state: {
          lang: 'ar',
          path: 'treatment',
          childName: '',
          stars: nextStars,
          heroEarned: false,
          freePlay: false,
        },
        version: 0,
      }),
    )
  }, stars)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('start-adventure').getByRole('button').click({ force: true })
}

async function waitEnabled(page, testid) {
  await page.waitForFunction(
    id => {
      const el = document.querySelector(`[data-testid="${id}"]`)
      if (!el) return false
      if (el instanceof HTMLButtonElement) return !el.disabled
      return el.getAttribute('aria-disabled') !== 'true'
    },
    testid,
  )
}

async function shot(page, filename) {
  await page.screenshot({ path: join(outRoot, 'screenshots', filename), fullPage: true })
}

async function captureScreenshots() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })

  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function play() {
      const src = this.currentSrc || this.src || ''
      const delay = src.includes('prepare.done') || src.includes('visit.maskOff') ? 1600 : 30
      window.setTimeout(() => this.dispatchEvent(new Event('ended')), delay)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function pause() {}
  })

  await page.goto(`${baseUrl}/?visit=treatment`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('dental-adventure-v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await shot(page, '00-language-screen.png')
  await page.locator('button[lang="ar"]').click({ force: true })
  await page.locator('button').nth(1).click({ force: true })
  await page.locator('button').last().click({ force: true })
  await page.getByTestId('start-adventure').waitFor({ state: 'visible' })
  await shot(page, '00-start-screen.png')

  await seedSession(page, { 'setup-complete': true })
  await page.getByTestId('clinic-scene').waitFor({ state: 'visible' })
  await shot(page, '01-clinic-start.png')

  const clinicItems = [
    ['chair', '02-clinic-chair.png'],
    ['light', '03-clinic-light.png'],
    ['suction', '04-clinic-suction.png'],
    ['syringe', '05-clinic-syringe.png'],
  ]
  for (const [id, filename] of clinicItems) {
    await seedSession(page, { 'setup-complete': true })
    await page.getByTestId('clinic-scene').waitFor({ state: 'visible' })
    await waitEnabled(page, `hotspot-${id}`)
    await page.getByTestId(`hotspot-${id}`).click({ force: true })
    await page.getByTestId('zoom-card').waitFor({ state: 'visible' })
    await shot(page, filename)
  }

  await seedSession(page, { clinic: true })
  await page.getByTestId('tools-board').waitFor({ state: 'visible' })
  await shot(page, '12-tools-start.png')

  for (const id of ['mirror', 'explorer', 'spray', 'brush']) {
    await seedSession(page, { clinic: true })
    await page.getByTestId('tools-board').waitFor({ state: 'visible' })
    await waitEnabled(page, `tool-${id}`)
    await page.getByTestId(`tool-${id}`).press('Enter')
    await page.getByTestId('zoom-card').waitFor({ state: 'visible' })
    await shot(page, `13-tool-${id}.png`)
  }

  await seedSession(page, { clinic: true, tools: true })
  await page.getByTestId('prep-spray').waitFor({ state: 'visible' })
  await shot(page, '17-tooth-prep-start.png')
  await waitEnabled(page, 'prep-spray')
  await page.getByTestId('prep-spray').click({ force: true })
  await waitEnabled(page, 'prep-brush')
  await shot(page, '06-tooth-after-juice.png')
  await page.getByTestId('prep-brush').click({ force: true })
  await page.getByTestId('prepare-brush-beat').waitFor({ state: 'visible' })
  await page.getByTestId('plaque-0').click({ force: true })
  await page.waitForTimeout(450)
  await shot(page, '07-tooth-removing-decay.png')
  for (const i of [1, 2, 3]) {
    await page.getByTestId(`plaque-${i}`).click({ force: true })
    await page.waitForTimeout(450)
  }
  await page.waitForTimeout(200)
  await shot(page, '08-tooth-cleaned.png')

  await seedSession(page, { clinic: true, tools: true, prepare: true, spray: true })
  await page.getByTestId('drnour').waitFor({ state: 'visible' })
  await shot(page, '09-dentist-masked.png')
  await page.getByTestId('drnour-mask').click({ force: true })
  await page.waitForTimeout(400)
  await shot(page, '10-dentist-after-mask.png')
  await page.getByTestId('raise-hand').waitFor({ state: 'visible' })
  await shot(page, '11-raise-hand-prompt.png')
  await page.getByTestId('raise-hand').click({ force: true })
  await page.getByTestId('paused-label').waitFor({ state: 'visible' })
  await shot(page, '18-hand-raised.png')
  await page.getByTestId('paused-label').waitFor({ state: 'hidden' })
  await page.getByTestId('visit-scene').waitFor({ state: 'visible' })
  await shot(page, '19-visit-simulation.png')

  await seedSession(page, { clinic: true, tools: true, prepare: true, spray: true, visit: true })
  await page.getByTestId('reward-screen').waitFor({ state: 'visible' })
  await shot(page, '20-reward.png')

  await browser.close()
}

function writeReview() {
  const strings = JSON.parse(readFileSync(resolve(appRoot, 'src/content/strings/ar.json'), 'utf8'))
  const manifest = entries.map(entry => {
    const sourceAbs = resolve(workspaceRoot, entry.source)
    const targetAbs = resolve(workspaceRoot, entry.target)
    const runtimeDuration = duration(targetAbs)
    const runtimeSize = fileSize(targetAbs)
    const needsRecording = isPlaceholder(runtimeDuration, runtimeSize)
    const cleanRecording = `recordings/${entry.id}${needsRecording ? '.m4a.mp4' : sourceAbs.endsWith('.mp3') ? '.mp3' : '.m4a.mp4'}`
    const runtimeAudio = `runtime-mp3/${basename(entry.target)}`
    if (!needsRecording) copyFileSync(sourceAbs, join(outRoot, cleanRecording))
    else
      writeFileSync(
        join(outRoot, 'recordings', `${entry.id}.NEEDS_RECORDING.txt`),
        `Record this line and save it as ${entry.id}.m4a.mp4 in this folder.\n\nAudio ID: ${entry.id}\nApp target: ${entry.target}\nCurrent Arabic text: ${strings[entry.id] ?? ''}\n`,
        'utf8',
      )
    copyFileSync(targetAbs, join(outRoot, runtimeAudio))
    return {
      ...entry,
      text: strings[entry.id] ?? '',
      sourceAbs,
      targetAbs,
      cleanRecording,
      runtimeAudio,
      needsRecording,
      sourceDuration: duration(sourceAbs),
      runtimeDuration,
      runtimeSize,
    }
  })

  writeFileSync(join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(
    join(outRoot, 'README.md'),
    [
      '# Arabic Narration Used Review',
      '',
      'Open `index.html` to review every currently imported Arabic recording with its matching starting frame.',
      '',
      'To replace one clip:',
      '',
      '1. Replace the matching file in `recordings/`. Example: `recordings/visit.maskOff.m4a.mp4`.',
      '   You can also drop `visit.maskOff.m4a.mp4`, `visit.maskOff.ogg`, or `visit.maskOff.mp3`; the importer will find it by audio ID.',
      '   Entries marked `Needs recording` currently only have a silent placeholder, so create the filename shown by `Replace here`.',
      '2. Tell me the audio ID you replaced.',
      '3. I will run `node scripts/import-arabic-narration-used.mjs visit.maskOff` from the project root.',
      '',
      'The app runtime targets are listed in `manifest.json` and in the HTML page.',
      '',
    ].join('\n'),
    'utf8',
  )

  const cards = manifest
    .map(
      entry => `
        <article class="card ${entry.needsRecording ? 'needs-recording' : ''}">
          <img src="screenshots/${htmlEscape(entry.screenshot)}" alt="${htmlEscape(entry.frame)}" loading="lazy">
          <div class="body">
            <h2>${htmlEscape(entry.id)}${entry.needsRecording ? '<span class="badge">Needs recording</span>' : ''}</h2>
            <p class="frame">${htmlEscape(entry.frame)}</p>
            <p class="note">${htmlEscape(entry.note)}</p>
            ${entry.text ? `<p class="arabic" dir="rtl">${htmlEscape(entry.text)}</p>` : ''}
            ${
              entry.needsRecording
                ? `<p class="missing-audio">No usable recording yet. The current app file is a short silent placeholder, so the audio control would show 0:00.</p>`
                : `<audio controls preload="metadata" src="${htmlEscape(entry.cleanRecording)}"></audio>`
            }
            <dl>
              <dt>Replace here</dt><dd><code>${htmlEscape(entry.cleanRecording)}</code></dd>
              <dt>Original source</dt><dd><code>${htmlEscape(entry.source)}</code></dd>
              <dt>App target</dt><dd><code>${htmlEscape(entry.target)}</code></dd>
              <dt>Duration</dt><dd>${entry.runtimeDuration?.toFixed(3) ?? 'unknown'}s</dd>
            </dl>
          </div>
        </article>`,
    )
    .join('\n')

  writeFileSync(
    join(outRoot, 'index.html'),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Arabic Narration Used Review</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      background: #eef5f9;
      color: #252440;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 18px 22px;
      background: rgba(255,255,255,.92);
      border-bottom: 1px solid #d7e4ec;
      backdrop-filter: blur(10px);
    }
    h1 { margin: 0 0 6px; font-size: 24px; }
    header p { margin: 0; color: #5b6179; line-height: 1.45; }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
      padding: 18px;
    }
    .card {
      overflow: hidden;
      border: 1px solid #d7e4ec;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 20px rgba(36, 45, 70, .08);
    }
    .card img {
      display: block;
      width: 100%;
      max-height: 520px;
      object-fit: contain;
      background: #e7f0f6;
      border-bottom: 1px solid #d7e4ec;
    }
    .body { padding: 14px; }
    h2 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #fff0c2;
      color: #7a4b00;
      font-size: 12px;
      font-weight: 800;
    }
    .needs-recording { border-color: #efc85d; }
    .frame { margin: 5px 0 0; font-weight: 700; color: #4e5590; }
    .note { margin: 7px 0 0; color: #5b6179; }
    .arabic {
      margin: 12px 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: #f7fafc;
      font-size: 18px;
      line-height: 1.6;
      font-weight: 700;
    }
    audio { width: 100%; margin: 8px 0 10px; }
    .missing-audio {
      margin: 10px 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fff8df;
      color: #6b4a00;
      font-weight: 700;
      line-height: 1.45;
    }
    dl {
      display: grid;
      grid-template-columns: 104px minmax(0, 1fr);
      gap: 7px 10px;
      margin: 0;
      font-size: 13px;
    }
    dt { color: #6b7280; font-weight: 700; }
    dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
    code {
      padding: 2px 4px;
      border-radius: 4px;
      background: #eef2f7;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <header>
    <h1>Arabic Narration Used Review</h1>
    <p>Each card shows the starting frame, the associated used recording, and where that recording imports into the app. Replace files inside <code>recordings/</code> using the audio ID filename.</p>
  </header>
  <main>${cards}
  </main>
</body>
</html>
`,
    'utf8',
  )
}

async function main() {
  ensureInsideWorkspace(outRoot)
  try {
    const res = await fetch(baseUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (error) {
    throw new Error(`Local app is not reachable at ${baseUrl}. Start Vite first. ${error.message}`)
  }

  rmSync(outRoot, { recursive: true, force: true })
  mkdirSync(join(outRoot, 'screenshots'), { recursive: true })
  mkdirSync(join(outRoot, 'recordings'), { recursive: true })
  mkdirSync(join(outRoot, 'runtime-mp3'), { recursive: true })

  await captureScreenshots()
  writeReview()

  console.log(`Wrote ${relative(workspaceRoot, join(outRoot, 'index.html'))}`)
  console.log(`Clean replacement recordings: ${relative(workspaceRoot, join(outRoot, 'recordings'))}`)
  console.log(`Entries: ${entries.length}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
