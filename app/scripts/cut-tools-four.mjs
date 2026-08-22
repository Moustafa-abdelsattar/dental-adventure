// Splits the four-instrument set render into its four instruments.
//
// They are drawn in one frame on purpose — four separate renders drift apart in
// size, angle and finish no matter how carefully each prompt is written, and on
// a two-by-two board a child sees all four at once, so any drift is the first
// thing they notice. Drawn together they come out a set; this takes them apart
// again without disturbing that.
//
// The split is by column: with clear white between them, the gaps are columns
// where nothing at all survives the cut, so the instruments fall out as runs of
// occupied columns rather than needing boxes typed in.
//
// Usage: node scripts/cut-tools-four.mjs
import sharp from 'sharp'
import { resolve } from 'node:path'
import { cutToRgba } from './lib/cutout.mjs'

const SRC = '../art-in/source-art/tools-four.png'
const OUT = 'public/art'

/** Left to right, as drawn. */
const IDS = ['mirror', 'explorer', 'spray', 'brush']

// Cream instruments on white: the flood has to stop just under pure white or it
// walks through their bodies, and their own soft shadows are then keyed out by
// being neutral grey where the instruments are warm. Same two settings the
// clinic instruments needed.
const CUT = { bgLuma: 250, softLuma: 206 }

const { rgba, width, height, alpha } = await cutToRgba(sharp, resolve(SRC), CUT)

// Which columns have anything in them at all.
const occupied = new Uint8Array(width)
for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    if (alpha[y * width + x] > 8) {
      occupied[x] = 1
      break
    }
  }
}

const runs = []
let start = -1
for (let x = 0; x <= width; x++) {
  if (x < width && occupied[x]) {
    if (start < 0) start = x
  } else if (start >= 0) {
    // ignore specks: a real instrument is a good fraction of the frame
    if (x - start > width / 40) runs.push([start, x - 1])
    start = -1
  }
}

console.log(`found ${runs.length} instruments in ${width}x${height}`)
if (runs.length !== IDS.length) {
  throw new Error(`expected ${IDS.length} separated instruments, found ${runs.length} — check the render has clear space between them`)
}

const full = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer()

for (const [i, [x0, x1]] of runs.entries()) {
  const pad = 8
  const left = Math.max(0, x0 - pad)
  const w = Math.min(width - left, x1 - x0 + 1 + pad * 2)
  // Two passes: sharp reorders extract and trim inside one pipeline, and the
  // pair together throw rather than doing the obvious thing.
  const column = await sharp(full).extract({ left, top: 0, width: w, height }).png().toBuffer()
  const one = await sharp(column).trim({ threshold: 1 }).png().toBuffer()
  const m = await sharp(one).metadata()
  const out = resolve(OUT, `tool-${IDS[i]}.webp`)
  await sharp(one).resize({ width: 520, fit: 'inside' }).webp({ quality: 90, alphaQuality: 95 }).toFile(out)
  console.log(`✓ tool-${IDS[i].padEnd(9)} ${m.width}x${m.height}`)
}
