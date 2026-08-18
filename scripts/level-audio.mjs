// Brings every narration clip to one loudness.
//
// A text-to-speech run does not come back level: the same voice reading a
// hundred lines lands anywhere across five or six decibels, loud on the excited
// lines and quiet on the calm ones. On a tablet at fixed volume that is a child
// leaning in for one sentence and flinching at the next, and it also moves the
// ground under the music, which ducks to a fixed fraction rather than to
// whatever this particular clip happens to be.
//
// So each clip is measured and given a flat gain — no compression, no limiting,
// nothing that touches the shape of the speech. TARGET is where the previous
// narration sat (measured across the set it replaced), so a voice change does
// not quietly become a volume change as well.
//
// Idempotent: run it twice and the second run finds everything already within
// TOLERANCE and leaves it alone.
//
// Usage: node scripts/level-audio.mjs [--lang=en|ar] [--target=-23] [--dry]
import { readdirSync, renameSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1]
const DRY = process.argv.includes('--dry')

/** LUFS. Where the narration sat before the voice change. */
const TARGET = Number(arg('target') ?? -23)
/**
 * Close enough to leave alone. Below this nobody can hear the difference, and
 * it has to be wider than the half decibel the mp3 round trip costs: encoding a
 * levelled clip back to 96k measures about 0.5 LUFS quieter than the gain says
 * it should, so a tighter tolerance would re-encode the whole set on every run,
 * each pass shaving another half decibel off for nothing.
 */
const TOLERANCE = 0.8

// ffmpeg reports its measurements on stderr, so both streams are read and
// joined; there is no mode in which the numbers arrive on stdout.
const ffmpeg = args => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8' })
  if (r.error) throw r.error
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

/** Integrated loudness of one file, in LUFS. */
const loudness = file => {
  const out = ffmpeg(['-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'])
  const m = out.match(/I:\s*(-?[\d.]+)\s*LUFS/)
  if (!m) throw new Error(`could not measure ${file}: ${out.trim().split('\n').slice(-2).join(' ')}`)
  return Number(m[1])
}

const LANGS = arg('lang') ? [arg('lang')] : ['en', 'ar']
let moved = 0
let left = 0

for (const lang of LANGS) {
  const dir = resolve(root, `app/public/audio/${lang}`)
  for (const name of readdirSync(dir).filter(f => f.endsWith('.mp3'))) {
    const file = resolve(dir, name)
    const before = loudness(file)
    const gain = TARGET - before
    if (Math.abs(gain) < TOLERANCE) {
      left++
      continue
    }
    if (DRY) {
      console.log(`${lang}/${name}  ${before.toFixed(1)} → ${TARGET}  (${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB)`)
      moved++
      continue
    }
    const tmp = `${file}.leveling.mp3`
    ffmpeg([
      '-loglevel', 'error', '-y',
      '-i', file,
      '-af', `volume=${gain.toFixed(2)}dB`,
      '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k',
      tmp,
    ])
    rmSync(file)
    renameSync(tmp, file)
    moved++
    console.log(`${lang}/${name.padEnd(28)} ${before.toFixed(1)} → ${loudness(file).toFixed(1)} LUFS`)
  }
}

console.log(`\n${moved} levelled, ${left} already within ${TOLERANCE} dB of ${TARGET} LUFS`)
