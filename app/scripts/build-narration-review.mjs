// Builds docs/narration-review/index.html — every screen of the game, in play
// order, with the narration that runs on it, both languages side by side, each
// clip playable, each line editable.
//
// The timeline below is transcribed from the screens themselves, not guessed:
// where a line is awaited, where the game waits for a tap, where Arabic and
// English diverge. Anything marked `en` or `ar` only genuinely only plays in
// that language.
//
// Usage: node scripts/build-narration-review.mjs
//   (screenshots come from scripts/capture-narration-review.mjs)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const R = p => resolve(import.meta.dirname, '..', p)
const ROOT = p => resolve(import.meta.dirname, '../..', p)

const EN = JSON.parse(readFileSync(R('src/content/strings/en.json'), 'utf8'))
const AR = JSON.parse(readFileSync(R('src/content/strings/ar.json'), 'utf8'))
// Clip durations, cached next to the page so it rebuilds on a machine without
// ffmpeg. Anything not in the cache is measured now and folded back in, so a
// regenerated clip picks up its new length without a manual step.
const DUR_CACHE = ROOT('docs/narration-review/clip-durations.json')
const DUR = existsSync(DUR_CACHE) ? JSON.parse(readFileSync(DUR_CACHE, 'utf8')) : { en: {}, ar: {} }
let measured = 0
for (const lang of ['en', 'ar']) {
  DUR[lang] ??= {}
  for (const f of readdirSync(R(`public/audio/${lang}`))) {
    if (!f.endsWith('.mp3')) continue
    const id = f.replace(/\.mp3$/, '')
    if (DUR[lang][id] != null) continue
    try {
      const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
        R(`public/audio/${lang}/${f}`)], { encoding: 'utf8' })
      DUR[lang][id] = Math.round(parseFloat(out) * 1000) / 1000
      measured++
    } catch {
      // no ffprobe here — the row simply shows no duration
    }
  }
}
if (measured) writeFileSync(DUR_CACHE, JSON.stringify(DUR, null, 1))

// Which Arabic clips are human recordings, established from the audio itself by
// scripts/fingerprint-arabic-voice.mjs. Reading it off
// Arabic-narration-used/manifest.json was wrong: that manifest covers only the
// second import batch, so recordings from the first (the .ogg intake) were being
// reported as TTS — prepare.intro among them, which a later commit then cut as
// "generated filler".
const provPath = ROOT('docs/narration-review/voice-provenance.json')
const PROV = existsSync(provPath) ? JSON.parse(readFileSync(provPath, 'utf8')) : {}
const voiceOf = id => PROV[id]?.voice ?? null

const dur = (lang, id) => DUR[lang]?.[id] ?? null

// Silent clips. 93 of the 126 Arabic files are byte-identical 5060-byte
// placeholders measuring -91 dB — digital silence, not quiet audio. Detected by
// size rather than trusted from a list, so this stays true as clips are redone.
const SILENT = { en: new Set(), ar: new Set() }
for (const lang of ['en', 'ar']) {
  const dir = R(`public/audio/${lang}`)
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.mp3') && statSync(resolve(dir, f)).size < 6000) SILENT[lang].add(f.replace(/\.mp3$/, ''))
  }
}
const isSilent = (lang, id) => SILENT[lang].has(id)

// ─── the timeline ────────────────────────────────────────────────────────────
// kind: line | sfx | gap | tap | idle | note
// only: undefined (both) | 'en' | 'ar'

const SCREENS = [
  {
    id: 'language',
    n: '01',
    title: 'Choose language',
    file: 'src/screens/LanguageScreen.tsx',
    shots: ['01-language'],
    blurb:
      'The first thing anyone sees. Both languages are on screen at once, so the child (or parent) can pick without reading. Tapping a button unlocks audio, starts the music and speaks the greeting in that language.',
    events: [
      { kind: 'tap', label: 'Child taps a language' },
      { kind: 'line', id: 'lang.greet' },
      { kind: 'note', text: 'Background music is meant to start here. It never does — /audio/music.mp3 does not exist. See defect D3.' },
    ],
  },
  {
    id: 'parent-visit',
    n: '02',
    title: 'For parents — which visit',
    file: 'src/screens/ParentScreen.tsx',
    shots: ['02-parent-visit'],
    blurb: 'A parent-facing gate. Silent on purpose — this screen is not for the child.',
    events: [{ kind: 'note', text: 'No narration. Copy shown: parent.forParents, parent.whichVisit, parent.checkup, parent.treatment.' }],
  },
  {
    id: 'parent-name',
    n: '03',
    title: "For parents — child's name",
    file: 'src/screens/ParentScreen.tsx',
    shots: ['03-parent-name'],
    blurb: 'Optional. The name is substituted into {name} in many lines below — but the clips are baked, so the spoken line never says it. Only the on-screen text does.',
    events: [{ kind: 'note', text: 'No narration. Copy shown: parent.childName, parent.namePlaceholder, ui.next, parent.skip.' }],
  },
  {
    id: 'welcome',
    n: '04',
    title: 'Welcome',
    file: 'src/screens/WelcomeScreen.tsx',
    shots: ['04-welcome'],
    blurb: 'Milo introduces himself. A returning child gets the second line instead of the first.',
    events: [
      { kind: 'line', id: 'milo.welcome', label: 'First time' },
      { kind: 'line', id: 'milo.welcomeBack', label: 'Returning child (any star already earned)' },
    ],
  },
  {
    id: 'clinic',
    n: '05',
    title: 'Meet the dental clinic',
    file: 'src/screens/ClinicScreen.tsx',
    shots: ['05-clinic', '06-clinic-card'],
    blurb:
      'The room, with four things in it that move where they stand. The child presses each one; a card opens 500 ms after the press and cannot be dismissed until its line has finished. Order is the child’s, not the game’s.',
    events: [
      { kind: 'line', id: 'clinic.intro', label: 'On arrival — gates every hotspot until it ends' },
      { kind: 'idle', label: 'If nothing is pressed for 10 s, Milo points at the next unexplored object' },
      { kind: 'line', id: 'milo.hint.tap' },
      { kind: 'tap', label: 'Child presses an object — any of the four, any order' },
      { kind: 'line', id: 'clinic.light.desc' },
      { kind: 'line', id: 'clinic.suction.desc' },
      { kind: 'line', id: 'clinic.chair.desc' },
      { kind: 'line', id: 'clinic.syringe.desc' },
      { kind: 'line', id: 'clinic.done', label: 'All four explored — awards the star' },
      { kind: 'line', id: 'story.calmer1', only: 'en', label: 'Interstitial: Milo appears between modules' },
      { kind: 'note', only: 'ar', text: 'Arabic skips the interstitial and the star-earned line entirely, so the recorded voice is never followed by generated filler.' },
    ],
  },
  {
    id: 'tools',
    n: '06',
    title: 'Meet the friendly tools',
    file: 'src/screens/ToolsScreen.tsx',
    shots: ['07-tools', '08-tools-card'],
    blurb:
      'Four covered cells. The child scratches a cover away (a press alone will not do it) and the tool underneath introduces itself. Four tools, not nine — the other five still have copy and clips but are not on any board.',
    events: [
      { kind: 'line', id: 'tools.title', only: 'ar', label: 'Arabic reads the screen title aloud first' },
      { kind: 'line', id: 'tools.intro' },
      { kind: 'tap', label: 'Child scratches a cell clear' },
      { kind: 'line', id: 'tool.mirror.desc' },
      { kind: 'line', id: 'tool.explorer.desc' },
      { kind: 'line', id: 'tool.spray.desc' },
      { kind: 'line', id: 'tool.brush.desc' },
      { kind: 'line', id: 'tools.done', label: 'All four met' },
      { kind: 'line', id: 'story.calmer2', only: 'en', label: 'Interstitial' },
    ],
  },
  {
    id: 'prepare',
    n: '07',
    title: 'Prepare the tooth',
    file: 'src/screens/PrepareScreen.tsx',
    shots: ['09-prepare', '10-prepare-spray', '11-prepare-brush'],
    blurb:
      'Two steps: the sleepy juice, then the polishing brush. The juice is watched; the cleaning is done by the child, one sticky spot at a time. This screen runs on BOTH paths — a child booked for a first check-up is shown the sleepy juice here. See defect D2.',
    events: [
      { kind: 'line', id: 'prepare.intro', only: 'en' },
      { kind: 'line', id: 'prepare.step.spray', only: 'en', label: 'Step 1 prompt' },
      { kind: 'note', only: 'ar', text: 'Arabic says nothing on arrival: 8815468 "Remove generated Arabic tooth prep filler" returns early before both lines above, so an Arabic child meets this screen in silence and hears the step-1 prompt only after they have already tapped. The premise was wrong — ar/prepare.intro.mp3 is not generated. It correlates at 1.000 with Arabic-narration/phase 3 intro.ogg: 6.95s of the human voice, already in the bundle and already precached, just never played. Dropping the early return is the whole fix. See defect D6.' },
      { kind: 'tap', label: 'Child taps the juice (a wrong tool wiggles instead)' },
      { kind: 'line', id: 'milo.hint.tap', only: 'en', label: 'Only on a wrong tap' },
      { kind: 'gap', ms: 500, label: 'The tooth closes its eyes' },
      { kind: 'line', id: 'prepare.step.spray', only: 'ar', label: 'The only time Arabic hears this line — after the tap it is asking for' },
      { kind: 'gap', ms: 1900, label: 'The juice rises, tips and puffs' },
      { kind: 'line', id: 'milo.great', only: 'en' },
      { kind: 'line', id: 'prepare.step.brush', label: 'Step 2 prompt' },
      { kind: 'tap', label: 'Child picks up the brush' },
      { kind: 'line', id: 'prepare.step.scrub', only: 'en' },
      { kind: 'tap', label: 'Child presses each of four sticky spots' },
      { kind: 'sfx', file: 'ar/decay-removal-sfx', only: 'ar', label: 'Plays once, on the first spot only' },
      { kind: 'line', id: 'milo.praise.1', only: 'en', label: 'After the 1st spot' },
      { kind: 'line', id: 'milo.praise.2', only: 'en', label: 'After the 2nd spot' },
      { kind: 'line', id: 'milo.praise.3', only: 'en', label: 'After the 3rd spot' },
      { kind: 'note', text: 'milo.praise.4 exists in both languages and has a clip, but the 4th spot ends the step before it can play. It is never heard.' },
      { kind: 'line', id: 'prepare.done', label: 'Tooth clean — awards the star' },
      { kind: 'line', id: 'story.reversal', only: 'en', label: 'Interstitial (check-up path)' },
      { kind: 'line', id: 'story.calmer3', only: 'en', label: 'Interstitial (treatment path)' },
    ],
  },
  {
    id: 'visit',
    n: '08',
    title: 'Your dental visit',
    file: 'src/screens/VisitScreen.tsx',
    shots: ['12-visit-meet', '13-visit-stop', '14-visit-paused', '15-visit-steps'],
    // The frames, grouped by the narration that drives them, with the times
    // measured off a real run rather than read off the cue table. A flat strip
    // implied one continuous sequence; it is three different things.
    frameGroups: [
      {
        title: 'Before the walk-through — the stop-signal beat',
        frames: [{ src: 'visit-step-hand', label: 'stop signal' }],
      },
      {
        title: 'Arabic — all four run under one 35.52 s recording (visit.simulation)',
        only: 'ar',
        frames: [
          { src: 'visit-step-chair', label: 'chair', at: 'from 0:00' },
          { src: 'visit-step-light', label: 'light', at: '+15.7 s' },
          { src: 'visit-step-mirror', label: 'mirror', at: '+20.2 s' },
          { src: 'visit-step-sleepy', label: 'sleepy juice', at: '+28.8 s — holds to the end' },
        ],
      },
      {
        title: 'Arabic — then one recorded line each. The two counting pictures are one moment',
        only: 'ar',
        frames: [
          { src: 'visit-step-count', label: 'count', at: 'eyes shut, 7 fingers — holds through the whole count' },
          { src: 'visit-step-count-ten', label: 'count to ten', at: 'last 1.2 s only — arrives on "عشرة"' },
          { src: 'visit-step-clean', label: 'clean', at: 'visit.step.clean' },
        ],
      },
      {
        title: 'English — one spoken line per frame, 900 ms between; no counting frames',
        only: 'en',
        frames: [
          { src: 'visit-step-chair', label: 'chair' },
          { src: 'visit-step-light', label: 'light' },
          { src: 'visit-step-mirror', label: 'mirror' },
          { src: 'visit-step-sleepy', label: 'sleepy juice' },
          { src: 'visit-step-clean', label: 'clean' },
        ],
      },
    ],
    blurb:
      'The walk-through, and the one screen where the two languages are built differently. English speaks five separate step lines with a 900 ms pause between them. Arabic plays a single 35.5 s recording and moves the picture on timed cues underneath it.',
    events: [
      { kind: 'line', id: 'visit.meetDr' },
      { kind: 'line', id: 'visit.maskPrompt', only: 'ar' },
      { kind: 'tap', label: 'Child taps the mask' },
      { kind: 'line', id: 'visit.maskOff' },
      { kind: 'line', id: 'visit.handPrompt', only: 'ar' },
      { kind: 'line', id: 'visit.stopSignal', only: 'en' },
      { kind: 'tap', label: 'Child raises the stop hand' },
      { kind: 'gap', ms: 1500, label: 'Everything freezes' },
      { kind: 'line', id: 'visit.stopSignalDone' },
      { kind: 'line', id: 'visit.simulation', only: 'ar', label: 'One recording through sleepy juice; picture cues at 7.54 s, 15.74 s, 20.18 s, 28.74 s' },
      { kind: 'line', id: 'visit.step.count', only: 'ar', label: 'Shows visit-step-count.webp' },
      { kind: 'line', id: 'visit.countToTen', only: 'ar', label: 'Shows visit-step-count-ten.webp' },
      { kind: 'line', id: 'visit.step.chair', only: 'en' },
      { kind: 'gap', ms: 900, only: 'en' },
      { kind: 'line', id: 'visit.step.light', only: 'en' },
      { kind: 'gap', ms: 900, only: 'en' },
      { kind: 'line', id: 'visit.step.mirror', only: 'en' },
      { kind: 'gap', ms: 900, only: 'en' },
      { kind: 'line', id: 'visit.step.sleepy', only: 'en' },
      { kind: 'gap', ms: 900, only: 'en' },
      { kind: 'line', id: 'visit.step.clean' },
      { kind: 'gap', ms: 900, only: 'en' },
      { kind: 'line', id: 'visit.done', label: 'Awards the star' },
      { kind: 'line', id: 'milo.starEarned', only: 'en', label: 'The visit is the only module with no interstitial, so this plays instead' },
    ],
  },
  {
    id: 'reward',
    n: '09',
    title: 'Dental Hero certificate',
    file: 'src/screens/RewardScreen.tsx',
    shots: ['16-reward'],
    blurb: 'Five stars, three bursts at 0 / 350 / 700 ms, and the certificate the parent can print or share.',
    events: [
      { kind: 'line', id: 'reward.narration' },
      { kind: 'note', text: 'Also shown, never spoken: reward.congrats, reward.hero, story.together, cert.title, cert.awardedTo, cert.for, cert.defaultName.' },
    ],
  },
]

const UNREACHABLE = [
  {
    id: 'spray',
    title: 'Quiet Counting Mission',
    file: 'src/screens/SprayScreen.tsx',
    why: 'checkup.json has no spray module, and ModuleHost filters it out of treatment.json. Defect D1.',
    events: [
      { kind: 'line', id: 'spray.intro' },
      { kind: 'gap', ms: 600 },
      ...Array.from({ length: 10 }, (_, i) => [
        { kind: 'line', id: `spray.count.${i + 1}` },
        { kind: 'gap', ms: 600 },
      ]).flat(),
      { kind: 'line', id: 'spray.done' },
    ],
  },
  {
    id: 'practice-brush',
    title: 'Make the Tooth Sparkle',
    file: 'src/screens/PracticeBrushScreen.tsx',
    why: 'No path manifest routes to the practice-brush kind. Its behaviour was folded into Prepare. Defect D2.',
    events: [
      { kind: 'line', id: 'practice.brush.intro' },
      { kind: 'line', id: 'tool.brush.name', label: 'On tapping the brush' },
      { kind: 'line', id: 'milo.hint.tap', label: 'On a spot tapped without the brush' },
      { kind: 'line', id: 'milo.praise.1' },
      { kind: 'line', id: 'milo.praise.2' },
      { kind: 'line', id: 'milo.praise.3' },
      { kind: 'line', id: 'milo.praise.4' },
      { kind: 'line', id: 'practice.brush.done' },
    ],
  },
]

// ─── clips nothing plays ─────────────────────────────────────────────────────
// Every string key gets a clip baked for it, whether or not anything ever
// speaks it. Two very different kinds of leftover fall out of that, so they are
// counted separately.
const spoken = new Set()
for (const s of [...SCREENS, ...UNREACHABLE]) for (const e of s.events) if (e.kind === 'line') spoken.add(e.id)

const ROSTER = new Set(
  ['checkup', 'treatment'].flatMap(p =>
    JSON.parse(readFileSync(R(`src/content/paths/${p}.json`), 'utf8')).modules.flatMap(m => m.toolIds ?? []),
  ),
)
const allToolIds = [...new Set(Object.keys(EN).filter(k => k.startsWith('tool.')).map(k => k.split('.')[1]))]
const offRoster = allToolIds.filter(id => !ROSTER.has(id))

// Copy that is not shown on screen either — the feature it belonged to is gone.
const RETIRED = new Set([
  'clinic.sink.name', 'clinic.sink.desc', 'clinic.table.name', 'clinic.table.desc',
  'tools.groupDone', 'prepare.step.ring', 'prepare.step.umbrella',
  ...allToolIds.map(id => `tool.${id}.fact`),
  ...offRoster.flatMap(id => [`tool.${id}.name`, `tool.${id}.desc`]),
].filter(k => k in EN))

const unspoken = Object.keys(EN).filter(k => !spoken.has(k) && DUR.en[k] != null)
const ORPHANS = unspoken.filter(k => !RETIRED.has(k))
const RETIRED_LIST = unspoken.filter(k => RETIRED.has(k))
const wastedBytes = [...unspoken].reduce((a, k) => a + (DUR.en[k] ?? 0) + (DUR.ar[k] ?? 0), 0)

// ─── render ──────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const secs = n => (n == null ? '—' : `${n.toFixed(2)}s`)

function voiceBadge(lang, id) {
  if (isSilent(lang, id))
    return `<span class="badge silent" title="5060-byte placeholder measuring -91 dB. Nothing is heard.">SILENT</span>`
  if (lang === 'en') return `<span class="badge tts" title="Microsoft Edge neural TTS, voice en-US-AndrewMultilingualNeural">TTS</span>`
  const p = PROV[id]
  if (p?.voice === 'recorded')
    return `<span class="badge rec" title="Human recording — matched to ${esc(p.source)} at ${p.corr} correlation">recorded</span>`
  return `<span class="badge tts" title="No human recording matched this clip">TTS</span>`
}

function lineRow(e, screenId, i) {
  const id = e.id
  const key = `${screenId}::${id}::${i}`
  const only = e.only
  const enOff = only === 'ar'
  const arOff = only === 'en'
  const mute = (only !== 'ar' && isSilent('en', id)) || (only !== 'en' && isSilent('ar', id))

  // One field per language, not a paragraph and a copy of it in a box. The
  // field IS the line; the original only reappears underneath once it has been
  // changed, so a row shows each sentence once until you touch it.
  const cell = (lang, off, offText) => {
    const txt = (lang === 'en' ? EN : AR)[id] ?? ''
    const rtl = lang === 'ar'
    if (off) return `<span class="dash">${offText}</span>`
    return `
      <div class="row-top">
        <button class="play" data-src="../../app/public/audio/${lang}/${esc(id)}.mp3" aria-label="Play ${esc(id)}">▶</button>
        <span class="dur">${secs(dur(lang, id))}</span>${voiceBadge(lang, id)}
      </div>
      <textarea class="edit" dir="${rtl ? 'rtl' : 'ltr'}"${rtl ? ' lang="ar"' : ''} data-field="${esc(key)}::${lang}"
        rows="1">${esc(txt)}</textarea>
      <p class="was" dir="${rtl ? 'rtl' : 'ltr'}"${rtl ? ' lang="ar"' : ''} hidden><span>was</span> ${esc(txt || '—')}</p>`
  }

  return `
  <tr class="line${only ? ' only-' + only : ''}${mute ? ' has-silent' : ''}" data-key="${esc(key)}" data-id="${esc(id)}">
    <td class="c-seq">${i + 1}</td>
    <td class="c-id">
      <code>${esc(id)}</code>
      ${only ? `<span class="badge lang-only">${only.toUpperCase()} only</span>` : ''}
      ${e.label ? `<span class="hint">${esc(e.label)}</span>` : ''}
    </td>
    <td class="c-lang en${enOff ? ' off' : ''}">${cell('en', enOff, 'not played in English')}</td>
    <td class="c-lang ar${arOff ? ' off' : ''}">${cell('ar', arOff, 'لا تُقال بالعربية')}</td>
    <td class="c-note"><textarea class="note" data-field="${esc(key)}::note" rows="1" placeholder="Note / action…"></textarea></td>
  </tr>`
}

function otherRow(e, i) {
  if (e.kind === 'sfx')
    return `<tr class="evt sfx"><td class="c-seq">${i + 1}</td><td colspan="4">
      <span class="tag">sound effect</span>
      <button class="play" data-src="../../app/public/audio/${esc(e.file)}.mp3">▶</button>
      <code>${esc(e.file)}.mp3</code>
      ${e.only ? `<span class="badge lang-only">${e.only.toUpperCase()} only</span>` : ''}
      ${e.label ? `<span class="hint">${esc(e.label)}</span>` : ''}</td></tr>`
  if (e.kind === 'gap')
    return `<tr class="evt gap"><td class="c-seq"></td><td colspan="4">
      <span class="tag">pause ${e.ms} ms</span>${e.only ? `<span class="badge lang-only">${e.only.toUpperCase()} only</span>` : ''}
      ${e.label ? `<span class="hint">${esc(e.label)}</span>` : ''}</td></tr>`
  if (e.kind === 'tap')
    return `<tr class="evt tap"><td class="c-seq"></td><td colspan="4">
      <span class="tag">waits for the child</span><span class="hint">${esc(e.label)}</span></td></tr>`
  if (e.kind === 'idle')
    return `<tr class="evt tap"><td class="c-seq"></td><td colspan="4">
      <span class="tag">idle timer</span><span class="hint">${esc(e.label)}</span></td></tr>`
  return `<tr class="evt note"><td class="c-seq"></td><td colspan="4">
    ${e.only ? `<span class="badge lang-only">${e.only.toUpperCase()} only</span>` : ''}
    <span class="hint">${esc(e.text)}</span></td></tr>`
}

function screenSection(s, unreachable = false) {
  let n = 0
  const rows = s.events.map(e => (e.kind === 'line' ? lineRow(e, s.id, n++) : otherRow(e, n))).join('')
  const enTotal = s.events.filter(e => e.kind === 'line' && e.only !== 'ar').reduce((a, e) => a + (dur('en', e.id) ?? 0), 0)
  const arTotal = s.events.filter(e => e.kind === 'line' && e.only !== 'en').reduce((a, e) => a + (dur('ar', e.id) ?? 0), 0)
  // Name what each pair is showing — a section can carry three states and an
  // unlabelled row of near-identical phones tells you nothing.
  const stateName = n => n.replace(/^\d+-/, '').replace(/-/g, ' ')
  const shots = (s.shots ?? [])
    .map(
      name => `<figure>
        <div class="state">${esc(stateName(name))}</div>
        <div class="pair">
          <div><img loading="lazy" src="shots/en-${name}.png" alt="${esc(stateName(name))} in English"><figcaption>English</figcaption></div>
          <div><img loading="lazy" src="shots/ar-${name}.png" alt="${esc(stateName(name))} in Arabic"><figcaption><bdi>العربية</bdi></figcaption></div>
        </div>
      </figure>`,
    )
    .join('')
  const frames = (s.frameGroups ?? [])
    .map(
      g => `<div class="fgroup${g.only ? ' only-' + g.only : ''}">
        <div class="state">${esc(g.title)}</div>
        <div class="frames">${g.frames
          .map(
            f => `<figure class="frame">
              <img loading="lazy" src="../../app/public/art/${esc(f.src)}.webp" alt="${esc(f.label)}">
              <figcaption>${esc(f.label)}${f.at ? `<span class="at">${esc(f.at)}</span>` : ''}</figcaption>
            </figure>`,
          )
          .join('')}</div>
      </div>`,
    )
    .join('')

  return `
<section class="screen${unreachable ? ' unreachable' : ''}" id="s-${esc(s.id)}">
  <header class="s-head">
    <h2>${s.n ? `<span class="num">${s.n}</span>` : '<span class="num dead">!</span>'}${esc(s.title)}</h2>
    <code class="src">${esc(s.file)}</code>
  </header>
  ${unreachable ? `<p class="warn"><strong>Never runs in the shipped game.</strong> ${esc(s.why)}</p>` : ''}
  <p class="blurb">${esc(s.blurb ?? '')}</p>
  ${shots ? `<div class="shots">${shots}</div>` : ''}
  ${frames ? `<div class="framestrip">${frames}</div>` : ''}
  <div class="totals">
    <span>Spoken runtime — English <strong>${enTotal.toFixed(1)}s</strong></span>
    <span><bdi>العربية</bdi> <strong>${arTotal.toFixed(1)}s</strong></span>
    <span class="muted">excludes pauses and time waiting for the child</span>
  </div>
  <div class="tablewrap">
  <table>
    <thead><tr><th>#</th><th>String</th><th>English <span class="pen">click to edit</span></th><th><bdi>العربية</bdi> <span class="pen">click to edit</span></th><th>Note</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </div>
</section>`
}

const enAll = Object.values(DUR.en).reduce((a, b) => a + b, 0)
const arAll = Object.values(DUR.ar).reduce((a, b) => a + b, 0)
const arRealAudio = Object.keys(DUR.ar).length - SILENT.ar.size
const arRecordedCount = Object.values(PROV).filter(v => v.voice === 'recorded').length
const arTtsCount = Object.values(PROV).filter(v => v.voice === 'tts').length
// Lines the shipped game actually speaks, whose clip is silence.
const LIVE_SILENT = []
for (const sc of SCREENS)
  for (const e of sc.events)
    if (e.kind === 'line')
      for (const lang of ['en', 'ar'])
        if (e.only !== (lang === 'en' ? 'ar' : 'en') && isSilent(lang, e.id))
          LIVE_SILENT.push({ screen: sc.title, id: e.id, lang })

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dental Adventure — Narration Review</title>
<link rel="icon" href="data:,">
<style>
:root{
  --bg:#f7f5f1; --panel:#fff; --ink:#221f33; --muted:#6b6780; --line:#e4e0d8;
  --accent:#5b4bd6; --accent-soft:#eeebff; --mint:#1d8a6a; --amber:#a86a12;
  --rose:#b32d5e; --rose-soft:#fdeef3;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --sans:"Segoe UI",system-ui,-apple-system,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#16151c; --panel:#1e1d26; --ink:#eceaf4; --muted:#9b96ad; --line:#2f2d3a;
  --accent:#a99bff; --accent-soft:#272244; --mint:#5fd3ab; --amber:#e0aa5a;
  --rose:#ff8fb4; --rose-soft:#38202b;
}}
:root[data-theme="dark"]{
  --bg:#16151c; --panel:#1e1d26; --ink:#eceaf4; --muted:#9b96ad; --line:#2f2d3a;
  --accent:#a99bff; --accent-soft:#272244; --mint:#5fd3ab; --amber:#e0aa5a;
  --rose:#ff8fb4; --rose-soft:#38202b;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 var(--sans)}
header.top{position:sticky;top:0;z-index:20;background:var(--panel);border-bottom:1px solid var(--line);
  padding:.7rem 1.25rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
header.top h1{font-size:1.05rem;margin:0;letter-spacing:-.01em}
header.top .sub{color:var(--muted);font-size:.82rem}
.spacer{flex:1}
button,.btn{font:inherit;border:1px solid var(--line);background:var(--panel);color:var(--ink);
  border-radius:8px;padding:.35rem .7rem;cursor:pointer}
button:hover{border-color:var(--accent)}
button.on{background:var(--accent);border-color:var(--accent);color:#fff}
main{max-width:1500px;margin:0 auto;padding:1.25rem}
.intro{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:1.1rem 1.25rem;margin-bottom:1.25rem}
.intro h2{margin:.1rem 0 .5rem;font-size:1rem}
.intro p{margin:.4rem 0;max-width:74ch}
.stats{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}
.stat{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:.5rem .75rem;min-width:8.5rem}
.stat b{display:block;font-size:1.15rem}
.stat span{color:var(--muted);font-size:.76rem}
section.screen{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:1.1rem 1.25rem;margin-bottom:1.1rem}
section.unreachable{border-color:var(--rose);background:var(--rose-soft)}
.s-head{display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}
.s-head h2{margin:0;font-size:1.1rem;display:flex;align-items:center;gap:.55rem}
.num{background:var(--accent);color:#fff;border-radius:7px;padding:.1rem .45rem;font:600 .78rem var(--mono)}
.num.dead{background:var(--rose)}
.src{font:.75rem var(--mono);color:var(--muted)}
.blurb{margin:.55rem 0 .9rem;color:var(--muted);max-width:88ch}
.warn{margin:.6rem 0;padding:.5rem .7rem;border-radius:9px;background:var(--panel);border:1px solid var(--rose);font-size:.87rem}
.shots{display:flex;gap:1.4rem;flex-wrap:wrap;margin-bottom:1rem}
figure{margin:0}
.state{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:.35rem}
.pair{display:flex;gap:.55rem}
.pair img{width:212px;border-radius:12px;border:1px solid var(--line);display:block;background:#fff;
  box-shadow:0 2px 10px rgba(34,31,51,.07)}
figcaption{font-size:.72rem;color:var(--muted);text-align:center;margin-top:.25rem}
@media(max-width:1150px){.pair img{width:168px}}
.framestrip{margin:0 0 1rem}
.frames{display:flex;gap:.6rem;flex-wrap:wrap;align-items:flex-start}
.frame{margin:0;width:112px}
.frame img{width:100%;border-radius:9px;border:1px solid var(--line);background:#fff;display:block}
.frame figcaption{font-size:.7rem;color:var(--muted);text-align:center;margin-top:.25rem;line-height:1.3}
.frame .at{display:block;font-size:.66rem;color:var(--accent);margin-top:.1rem}
.fgroup{margin-bottom:.9rem}
body.only-en .fgroup.only-ar{display:none}
body.only-ar .fgroup.only-en{display:none}
.totals{display:flex;gap:1rem;flex-wrap:wrap;font-size:.82rem;margin-bottom:.6rem;color:var(--muted)}
.totals strong{color:var(--ink)}
.tablewrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:880px}
th{text-align:start;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);
  padding:.4rem .5rem;border-bottom:1px solid var(--line);background:var(--panel)}
td{padding:.5rem;border-bottom:1px solid var(--line);vertical-align:top}
.c-seq{width:2.2rem;color:var(--muted);font:.78rem var(--mono)}
.c-id{width:14rem}
.c-id code{font:.78rem var(--mono);color:var(--accent);word-break:break-all}
.c-lang{width:26%}
.c-note{width:10rem}
tr.evt td{background:var(--bg)}
.tag{display:inline-block;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;
  color:var(--muted);border:1px dashed var(--line);border-radius:99px;padding:.05rem .55rem;margin-inline-end:.5rem}
.pen{text-transform:none;letter-spacing:0;font-weight:400;font-size:.68rem;opacity:.65}
.pen::before{content:"✎ "}
.hint{display:block;margin-top:.25rem;color:var(--muted);font-size:.79rem;line-height:1.4}
td.c-id .badge{margin-inline-start:.3rem}
tr.evt .hint,.alarm .hint{display:inline;margin:0}
.alarm li code{margin-inline-end:.4rem}
.badge{display:inline-block;font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  border-radius:99px;padding:.05rem .4rem;margin-inline-start:.35rem;vertical-align:middle}
.badge.tts{background:var(--accent-soft);color:var(--accent)}
.badge.rec{background:#dff5ec;color:var(--mint)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .badge.rec{background:#12352a}}
.badge.lang-only{background:transparent;border:1px solid var(--amber);color:var(--amber)}
.badge.silent{background:var(--rose);color:#fff}
tr.has-silent td{background:var(--rose-soft)}
.alarm{background:var(--rose-soft);border:2px solid var(--rose);border-radius:14px;padding:1rem 1.25rem;margin-bottom:1.25rem}
.alarm h2{margin:.1rem 0 .5rem;font-size:1rem;color:var(--rose)}
.alarm ul{margin:.5rem 0 0;padding-inline-start:1.1rem}
.alarm li{margin:.2rem 0}
.alarm code{font:.82rem var(--mono)}
.row-top{display:flex;align-items:center;gap:.4rem;margin-bottom:.25rem;flex-wrap:wrap}
.play{width:1.7rem;height:1.7rem;padding:0;border-radius:50%;line-height:1;font-size:.7rem}
.play.playing{background:var(--accent);color:#fff;border-color:var(--accent)}
.play.missing{border-color:var(--rose);color:var(--rose)}
.dur{font:.74rem var(--mono);color:var(--muted)}
.was{margin:.3rem 0 0;font-size:.82rem;color:var(--muted)}
.was span{display:inline-block;font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--amber);border:1px solid var(--amber);border-radius:99px;padding:0 .35rem;margin-inline-end:.35rem}
textarea{display:block;width:100%;font:.88rem/1.45 var(--sans);color:var(--ink);background:transparent;
  border:1px solid transparent;border-radius:7px;padding:.3rem .4rem;resize:none;overflow:hidden;min-height:1.9rem}
textarea:hover{border-color:var(--line)}
textarea.note{background:var(--bg);border-color:var(--line);font-size:.82rem;color:var(--muted)}
textarea:focus{outline:2px solid var(--accent);outline-offset:-1px}
textarea.dirty{border-color:var(--amber);background:#fffaf0}
:root[data-theme="dark"] textarea.dirty{background:#2b2418}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) textarea.dirty{background:#2b2418}}
.c-lang.off{color:var(--muted)}
.dash{font-size:.82rem;font-style:italic}
body.only-en .c-lang.ar,body.only-en th:nth-child(4){display:none}
body.only-ar .c-lang.en,body.only-ar th:nth-child(3){display:none}
body.only-en .pair div:nth-child(2),body.only-ar .pair div:nth-child(1){display:none}
.orphans{columns:3;column-gap:1.5rem;font:.8rem var(--mono)}
.orphans div{break-inside:avoid;padding:.1rem 0}
@media(max-width:820px){.orphans{columns:1}}
footer{color:var(--muted);font-size:.8rem;padding:2rem 1.25rem;text-align:center}
</style>
</head>
<body>

<header class="top">
  <h1>Dental Adventure — narration review</h1>
  <span class="sub">every screen · both languages · ${Object.keys(DUR.en).length + Object.keys(DUR.ar).length} clips</span>
  <span class="spacer"></span>
  <button id="m-both" class="on">Both</button>
  <button id="m-en">English</button>
  <button id="m-ar">العربية</button>
  <button id="theme">◐</button>
  <button id="export">Export edits</button>
  <button id="reset">Clear edits</button>
  <span class="sub" id="dirty"></span>
</header>

<main>
<div class="intro">
  <h2>How to use this</h2>
  <p>Every line the game speaks, in the order it speaks it, screen by screen. Press <strong>▶</strong> to hear the exact clip that ships. The boxes under each line are editable — type a revised line and it is kept in your browser; <strong>Export edits</strong> downloads only what you changed, as JSON plus a ready-to-paste patch for <code>en.json</code> / <code>ar.json</code>, and a list of which clips would need regenerating.</p>
  <p><strong>Changing a line is not free.</strong> Narration is baked one clip per string per language. An English edit means re-running <code>scripts/generate-audio-edge.mjs</code>; an Arabic edit on a line marked <span class="badge rec">recorded</span> means booking the voice again.</p>
  <p class="hint">Audio plays from <code>app/public/audio/</code> next door, so open this file from inside the repo. Rebuild it with <code>node scripts/build-narration-review.mjs</code>; refresh the screenshots with <code>node scripts/capture-narration-review.mjs</code>.</p>
  <div class="stats">
    <div class="stat"><b>${enAll.toFixed(0)}s</b><span>English, all clips</span></div>
    <div class="stat"><b>${arAll.toFixed(0)}s</b><span>Arabic, all clips</span></div>
    <div class="stat"><b>${arRecordedCount}</b><span>Arabic clips voiced by a person</span></div>
    <div class="stat"><b>${SILENT.ar.size}</b><span>Arabic clips that are silence</span></div>
    <div class="stat"><b>${unspoken.length}</b><span>clips nothing plays</span></div>
  </div>
</div>

<div class="alarm">
  <h2>⚠ ${LIVE_SILENT.length} lines the game speaks are silent files</h2>
  <p>${SILENT.ar.size} of the ${Object.keys(DUR.ar).length} Arabic clips are byte-identical 5060-byte placeholders measuring −91 dB. Arabic has <strong>no TTS fallback at all</strong> — every clip is either a human recording (${arRecordedCount} of them) or silence, so a line without a recording is not read by a robot voice, it simply says nothing. Most of the silence is for copy Arabic never speaks and costs only bandwidth. These ${LIVE_SILENT.length} are on the live path, and an Arabic-speaking child hears nothing where a voice is meant to be. Verified on the deployed build, not just locally.</p>
  <ul>${LIVE_SILENT.map(x => `<li><code>${esc(x.id)}</code> <span class="hint">${esc(x.lang.toUpperCase())} · ${esc(x.screen)}</span></li>`).join('')}</ul>
  <p class="hint" style="margin-top:.6rem">All of these are listed in <code>Arabic-narration-used/manifest.json</code> as imported recordings, with <code>runtimeDuration: 0.35</code> recorded against them — so the import wrote the placeholder and logged it. Every recording currently on disk has been matched against the shipped clips by <code>scripts/fingerprint-arabic-voice.mjs</code>, and none of them is one of these lines: they need a voice session, they are not waiting unimported. The four takes that are unused (<code>phase 4 before pressing the hand</code>, <code>phase 4 intro on dr lili</code>, <code>phase 4 mask</code>, <code>phase 4 polishing brush last thing</code>) are alternates of visit lines that are already voiced.</p>
</div>

${SCREENS.map(s => screenSection(s)).join('')}

<h2 style="margin:1.6rem 0 .8rem">Built, voiced, and unreachable</h2>
${UNREACHABLE.map(s => screenSection(s, true)).join('')}

<section class="screen">
  <header class="s-head"><h2><span class="num dead">!</span>Clips nothing plays</h2></header>
  <p class="blurb">The generator bakes a clip for every string key, whether or not anything speaks it. ${unspoken.length} keys — ${(wastedBytes / 60).toFixed(1)} minutes of audio across the two languages — are downloaded and precached onto every device without ever being heard. They fall into two very different piles.</p>

  <h3 style="font-size:.95rem;margin:1rem 0 .3rem">Shown on screen, never spoken (${ORPHANS.length})</h3>
  <p class="blurb">Button labels, screen titles, object names, the certificate wording. The child reads these (or a parent does) — but a pre-reader never hears them. Either the clip should not be generated, or the line should be spoken. Right now it is neither.</p>
  <div class="orphans">${ORPHANS.map(k => `<div><code>${esc(k)}</code></div>`).join('')}</div>

  <h3 style="font-size:.95rem;margin:1.2rem 0 .3rem">Retired copy (${RETIRED_LIST.length})</h3>
  <p class="blurb">Not shown anywhere either. The features these belonged to are gone: the rinse bowl and side table as pressable clinic objects, the rubber-dam ring and umbrella steps, the per-tool “fun fact” second sentence, and the five instruments (${offRoster.join(', ')}) cut when the board dropped from nine tools to four. Safe to delete, copy and clips together.</p>
  <div class="orphans">${RETIRED_LIST.map(k => `<div><code>${esc(k)}</code></div>`).join('')}</div>
</section>
</main>

<footer>Generated from the source of truth: the screen components, <code>strings/*.json</code>, the clip files themselves, and <code>Arabic-narration-used/manifest.json</code>.</footer>

<script>
(function(){
  var KEY='dental-narration-review-v1';
  var store={};
  try{store=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){store={}}

  function countDirty(){
    var n=Object.keys(store).length;
    document.getElementById('dirty').textContent = n? n+' edit'+(n>1?'s':'')+' saved locally' : '';
  }
  function save(){ try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){} countDirty(); }

  function grow(t){ t.style.height='auto'; t.style.height=(t.scrollHeight+2)+'px'; }
  function showWas(t){
    var was=t.parentElement.querySelector('.was');
    if(was) was.hidden = !t.classList.contains('dirty');
  }
  document.querySelectorAll('textarea').forEach(function(t){
    var f=t.dataset.field, base=t.value;
    t.dataset.base=base;
    if(store[f]!==undefined && store[f]!==base){ t.value=store[f]; t.classList.add('dirty'); }
    showWas(t);
    t.addEventListener('input',function(){
      if(t.value===t.dataset.base){ delete store[f]; t.classList.remove('dirty'); }
      else { store[f]=t.value; t.classList.add('dirty'); }
      showWas(t); grow(t); save();
    });
  });
  // Size every field to its content once the fonts have settled, so nothing is
  // clipped — Arabic wraps to more lines than the English beside it.
  function growAll(){ document.querySelectorAll('textarea').forEach(grow); }
  growAll();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(growAll);
  addEventListener('resize', growAll);
  countDirty();

  // one clip at a time
  var playing=null, cur=null;
  document.addEventListener('click',function(e){
    var b=e.target.closest('.play'); if(!b) return;
    if(cur){ cur.pause(); }
    if(playing===b){ playing.classList.remove('playing'); playing=null; cur=null; return; }
    if(playing) playing.classList.remove('playing');
    cur=new Audio(b.dataset.src); playing=b; b.classList.add('playing');
    cur.play().then(function(){ b.classList.remove('missing'); })
      .catch(function(){ b.classList.remove('playing'); b.classList.add('missing'); b.title='Clip would not play — open this file from inside the repo.'; playing=null; });
    cur.onended=function(){ b.classList.remove('playing'); playing=null; cur=null; };
  });

  // language mode
  var modes={'m-both':'','m-en':'only-en','m-ar':'only-ar'};
  Object.keys(modes).forEach(function(id){
    document.getElementById(id).addEventListener('click',function(){
      document.body.className=modes[id];
      requestAnimationFrame(growAll);
      Object.keys(modes).forEach(function(o){ document.getElementById(o).classList.toggle('on',o===id); });
    });
  });

  document.getElementById('theme').addEventListener('click',function(){
    var r=document.documentElement;
    var now=r.getAttribute('data-theme');
    var next = now==='dark' ? 'light' : now==='light' ? null : (matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark');
    if(next) r.setAttribute('data-theme',next); else r.removeAttribute('data-theme');
  });

  document.getElementById('reset').addEventListener('click',function(){
    if(!confirm('Discard every edit saved in this browser?')) return;
    store={}; save();
    document.querySelectorAll('textarea').forEach(function(t){ t.value=t.dataset.base; t.classList.remove('dirty'); showWas(t); grow(t); });
  });

  document.getElementById('export').addEventListener('click',function(){
    var en={}, ar={}, notes=[], regen={en:[],ar:[]};
    Object.keys(store).forEach(function(f){
      var p=f.split('::'); // screen :: stringId :: index :: field
      var sid=p[1], field=p[3];
      if(field==='note'){ notes.push({screen:p[0], string:sid, note:store[f]}); return; }
      if(field==='en'){ en[sid]=store[f]; regen.en.push(sid); }
      if(field==='ar'){ ar[sid]=store[f]; regen.ar.push(sid); }
    });
    var out={
      generated:new Date().toISOString(),
      note:'Paste stringPatch.en into app/src/content/strings/en.json (same for ar), then regenerate the clips listed in regenerate.',
      stringPatch:{en:en,ar:ar},
      regenerate:regen,
      notes:notes
    };
    var blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='narration-edits-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();
</script>
</body>
</html>
`

writeFileSync(ROOT('docs/narration-review/index.html'), html)
const shots = existsSync(ROOT('docs/narration-review/shots')) ? readdirSync(ROOT('docs/narration-review/shots')).length : 0
console.log('wrote docs/narration-review/index.html')
console.log(`  ${SCREENS.length} screens + ${UNREACHABLE.length} unreachable, ${shots} screenshots, ${ORPHANS.length} orphan clips`)
