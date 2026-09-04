// Works out, from the audio itself, which shipped Arabic clips are human
// recordings and which are still Edge TTS.
//
// The review sheet used to answer this from Arabic-narration-used/manifest.json,
// which only covers the second (redo) import batch. It knows nothing about the
// first batch — the .ogg files in Arabic-narration/ brought in by
// `d91d6bf "Add synced Arabic narration"` — so genuine recordings from that
// round were being reported as TTS. prepare.intro was one of them, and a commit
// went on to cut it as "generated filler".
//
// So this compares sound to sound: decode every shipped clip and every source
// recording to a loudness envelope, and correlate. A recording and the mp3 that
// was transcoded from it score ~1.000; unrelated clips of the same length score
// well under 0.6, so the threshold has plenty of room.
//
// Usage: node scripts/fingerprint-arabic-voice.mjs
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'

const R = p => resolve(import.meta.dirname, '..', p)
const ROOT = p => resolve(import.meta.dirname, '../..', p)

/** Loudness envelope: 8 kHz mono, RMS over 100 ms frames. */
function envelope(path) {
  let raw
  try {
    raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], {
      maxBuffer: 1 << 28,
    })
  } catch {
    return null
  }
  const n = 800
  const out = []
  for (let i = 0; i + n * 2 <= raw.length; i += n * 2) {
    let s = 0
    for (let j = 0; j < n; j++) {
      const v = raw.readInt16LE(i + j * 2) / 32768
      s += v * v
    }
    out.push(Math.sqrt(s / n))
  }
  return out
}

function corr(a, b) {
  const n = Math.min(a.length, b.length)
  if (n < 6) return 0
  let ma = 0, mb = 0
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i] }
  ma /= n; mb /= n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb
    num += x * y; da += x * x; db += y * y
  }
  return da && db ? num / Math.sqrt(da * db) : 0
}

// Every human recording we hold, wherever it lives.
const sources = []
const addDir = (dir, rel) => {
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) addDir(p, rel + '/' + f.name)
    else if (/\.(ogg|m4a|mp4|wav|mp3)$/i.test(f.name)) sources.push({ label: rel + '/' + f.name, path: p })
  }
}
addDir(ROOT('Arabic-narration'), 'Arabic-narration')
addDir(ROOT('Arabic-narration-redo'), 'Arabic-narration-redo')
addDir(ROOT('Arabic-narration-used/recordings'), 'Arabic-narration-used/recordings')

console.log(`sources: ${sources.length}`)
for (const s of sources) s.env = envelope(s.path)

const clipsDir = R('public/audio/ar')
const out = {}
let recorded = 0, tts = 0, silent = 0
for (const f of readdirSync(clipsDir)) {
  if (!f.endsWith('.mp3')) continue
  const id = f.replace(/\.mp3$/, '')
  const p = join(clipsDir, f)
  if (statSync(p).size < 6000) { out[id] = { voice: 'silent' }; silent++; continue }
  const env = envelope(p)
  let best = null
  if (env) {
    for (const s of sources) {
      if (!s.env) continue
      // only compare like with like — a transcode keeps its length
      if (Math.abs(s.env.length - env.length) > 3) continue
      const c = corr(env, s.env)
      if (!best || c > best.corr) best = { source: s.label, corr: Math.round(c * 1000) / 1000 }
    }
  }
  if (best && best.corr >= 0.9) { out[id] = { voice: 'recorded', ...best }; recorded++ }
  else { out[id] = { voice: 'tts', bestGuess: best?.source ?? null, corr: best?.corr ?? null }; tts++ }
}

writeFileSync(ROOT('docs/narration-review/voice-provenance.json'), JSON.stringify(out, null, 1))
console.log(`recorded ${recorded} · tts ${tts} · silent ${silent}`)
