// Cuts the nine instruments out of the board render.
//
// The board is what a child actually meets: nine friendly characters, each with
// a face, in nine cream cells. The card that opens when a cell is scratched
// clear has to show that same character — a second, faceless render of the same
// instrument reads as a different object, and a four-year-old has no reason to
// believe the two are the same tool.
//
// So the cut-outs come from the board itself, not from the isolated sheet that
// shipped first. That sheet (art-in/source-art/tools/isolated.png) draws the
// same nine instruments without faces and, in places, in other colours — its
// brush is pink where the board's is blue, its clamp a bare figure of eight.
// It cut easily, being flat white, but it was the wrong art.
//
// Cutting from the board is a little more work because the cell panel is cream
// and so are most of the instruments. What saves it is that the panel is flat:
// it holds one colour to within a few levels, while every instrument carries
// shading. So the key is not "how cream is this pixel" but "how far is it from
// the panel colour measured on this very cell", flooded in from the crop edge
// so that enclosed pale areas — the mirror's face, the pump cap — stay put.
//
//   1. crop each cell from the geometry the game already uses, inset a hair so
//      the cell's own rounded border falls outside
//   2. measure the panel colour from the crop's border ring
//   3. flood in from the edges, taking anything within TOL of that colour
//   4. what the flood never reached is instrument, sparkle, droplet — or the
//      step number, which is dropped by where it sits
//
// Usage: node scripts/cut-tools.mjs [--debug]

import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '../../art-in/source-art/tools/board.png')
const OUT = resolve(import.meta.dirname, '../public/art')
const GEOMETRY = resolve(import.meta.dirname, '../src/content/tools-board.json')
const DEBUG = process.argv.includes('--debug')

/** How far off the panel colour a pixel has to be before it counts as paint. */
const TOL = 16
/**
 * Share of the cell taken off each edge.
 *
 * Enough to clear the cell's own rounded border and the shading under it —
 * neither is panel colour, so anything less leaves a hoop of border around the
 * instrument, connected all the way round and far too big to dismiss as
 * speckle. The cost is that a tool running off its cell, like the suction
 * tube, loses a few more pixels of hose. That is a better trade than a card
 * with a chunk of somebody else's frame in the corner.
 */
const INSET = 0.04
/** Islands smaller than this share of the cell are anti-aliasing, not art. */
const MIN_ISLAND = 0.0006
/**
 * Where the step number sits. Every cell carries one in its top-left corner and
 * no cell decorates that corner with anything else, so an island that fits
 * inside this box is the number and goes.
 */
const BADGE = { x: 0.26, y: 0.34 }
/** Breathing room kept around the instrument. */
const PAD = 8
/** Longest edge of a shipped tool. */
const MAX_EDGE = 360

const board = JSON.parse(await readFile(GEOMETRY, 'utf8'))
const { width: W, height: H } = await sharp(SRC).metadata()

const middle = v => [...v].sort((a, b) => a - b)[v.length >> 1]

/** The crop for one cell: the cell the game knows, minus the inset. */
const cropOf = name => {
  const cell = board.cells[name]
  return {
    left: Math.round(((cell.left + cell.width * INSET) / 100) * W),
    top: Math.round(((cell.top + cell.height * INSET) / 100) * H),
    width: Math.round(((cell.width * (1 - 2 * INSET)) / 100) * W),
    height: Math.round(((cell.height * (1 - 2 * INSET)) / 100) * H),
  }
}

const read = async name => {
  const box = cropOf(name)
  const { data, info } = await sharp(SRC).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: box.width, h: box.height, C: info.channels }
}

// ---- the panel colour, measured across the whole board ------------------------
//
// Per cell it would be the median of that cell's border ring — median and not
// mean, because a droplet or a tool running off the edge cannot move the middle
// of several hundred samples the way it would drag an average.
//
// But one cell can still be read wrong: the x-ray camera is wide enough that
// its cell's ring lands on the frame rather than on the panel, and a cell that
// mistakes its frame for its background keeps the background and cuts out
// nothing. The nine panels are one flat cream, so the answer is to ask all nine
// and take the middle. Eight honest cells outvote the odd one.
const panel = await (async () => {
  const perCell = []
  for (const name of board.order) {
    const { data, w, h, C } = await read(name)
    const ring = []
    for (let x = 0; x < w; x++) {
      ring.push((2 * w + x) * C)
      ring.push(((h - 3) * w + x) * C)
    }
    for (let y = 0; y < h; y++) {
      ring.push((y * w + 2) * C)
      ring.push((y * w + w - 3) * C)
    }
    perCell.push([0, 1, 2].map(ch => middle(ring.map(o => data[o + ch]))))
  }
  return [0, 1, 2].map(ch => middle(perCell.map(p => p[ch])))
})()
console.log(`panel ${panel.join(',')}`)

for (const name of board.order) {
  const { data, w, h, C } = await read(name)
  const N = w * h

  const isPanel = i => {
    const o = i * C
    return (
      Math.abs(data[o] - panel[0]) <= TOL &&
      Math.abs(data[o + 1] - panel[1]) <= TOL &&
      Math.abs(data[o + 2] - panel[2]) <= TOL
    )
  }

  // ---- flood the panel in from every edge -------------------------------------
  const outside = new Uint8Array(N)
  const stack = new Int32Array(N)
  let sp = 0
  const push = i => {
    if (!outside[i] && isPanel(i)) {
      outside[i] = 1
      stack[sp++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (sp > 0) {
    const p = stack[--sp]
    const x = p % w
    const y = (p / w) | 0
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (y > 0) push(p - w)
    if (y < h - 1) push(p + w)
  }

  // ---- islands -----------------------------------------------------------------
  const island = new Int32Array(N).fill(-1)
  const found = []
  let nextId = 0
  for (let seed = 0; seed < N; seed++) {
    if (outside[seed] || island[seed] !== -1) continue
    let sp2 = 0
    stack[sp2++] = seed
    island[seed] = nextId
    let count = 0
    let x0 = w, y0 = h, x1 = 0, y1 = 0
    while (sp2 > 0) {
      const p = stack[--sp2]
      count++
      const x = p % w
      const y = (p / w) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of nb) if (q >= 0 && !outside[q] && island[q] === -1) { island[q] = nextId; stack[sp2++] = q }
    }
    found.push({ id: nextId, count, x0, y0, x1, y1 })
    nextId++
  }

  const isBadge = s => s.x1 < w * BADGE.x && s.y1 < h * BADGE.y

  /**
   * Frame, not instrument.
   *
   * Whatever hair of the cell's own border the inset failed to clear comes back
   * as an island that runs along the crop edge: a hoop around the whole thing, a
   * strip under the tool, a wedge in a corner. All three are recognisable
   * without knowing what a border looks like — they touch the edge, and they are
   * either wafer-thin for their bounding box or too small to be a tool.
   *
   * An instrument may touch the edge too — the suction hose runs off its cell —
   * so touching alone decides nothing. It is touching *and* being flimsy.
   */
  const biggest = Math.max(...found.map(s => s.count))
  const isFrame = s => {
    const bw = s.x1 - s.x0 + 1
    const bh = s.y1 - s.y0 + 1
    const fill = s.count / (bw * bh)
    // a rail: many times longer than it is thick, and running most of the way
    // across the cell. No instrument is shaped like that; the cell's border is.
    if (Math.max(bw, bh) / Math.min(bw, bh) > 5 && Math.max(bw / w, bh / h) > 0.6) return true
    const touches = s.x0 === 0 || s.y0 === 0 || s.x1 === w - 1 || s.y1 === h - 1
    if (!touches) return false
    // A scrap on the edge: the frame's own corner, or the tail of one of the
    // stars that live out on the board between the cells and lean into this one.
    // An instrument may touch the edge as well — the suction hose runs off its
    // cell — so this asks for flimsy or small on top of touching, never
    // touching on its own.
    return fill < 0.2 || s.count < biggest * 0.25
  }

  /**
   * Decoration, not instrument.
   *
   * Each cell is dressed with something loose beside its tool — sparkles by the
   * mirror, a heart by the clamp, a trail of mist off the gel. On the board they
   * are the charm of the thing. Cut out with the instrument they are a liability:
   * the same asset has to work at card size, where they read as intended, and in
   * a picker tile a quarter of that, where a stray heart is just a smudge beside
   * a tool the child is trying to recognise. They also pull each cut-out's
   * bounding box a different way, so nine tools that should share a silhouette
   * end up nine different shapes with the instrument off-centre in each.
   *
   * So the instrument only, and let the game add its own sparkles in SVG where
   * it wants them — it already does, on the demo animations.
   *
   * A quarter of the largest piece is the line. Real parts of a tool are never
   * that small next to the body; decorations never come close to it.
   */
  const big = found.filter(s => s.count / N >= MIN_ISLAND)
  const isDecoration = s => s.count < biggest * 0.25
  const keep = big.filter(s => !isBadge(s) && !isFrame(s) && !isDecoration(s))
  const kept = new Set(keep.map(s => s.id))
  const dropped = big.filter(s => isBadge(s) || isFrame(s) || isDecoration(s))

  if (DEBUG) {
    for (const s of big) {
      const bw = s.x1 - s.x0 + 1
      const bh = s.y1 - s.y0 + 1
      console.log(
        `    ${kept.has(s.id) ? 'keep' : 'drop'}  ${String(s.count).padStart(6)}px  ` +
          `${String(bw).padStart(4)}x${String(bh).padStart(4)} at ${s.x0},${s.y0}  ` +
          `fill ${(s.count / (bw * bh)).toFixed(2)}  slim ${Math.min(bw / w, bh / h).toFixed(3)}`,
      )
    }
  }

  if (!keep.length) {
    console.error(`✗ ${name}: nothing survived the cut. Re-run with --debug.`)
    process.exit(1)
  }

  // ---- crop to what was kept, and write ----------------------------------------
  const bx0 = Math.max(0, Math.min(...keep.map(s => s.x0)) - PAD)
  const by0 = Math.max(0, Math.min(...keep.map(s => s.y0)) - PAD)
  const bx1 = Math.min(w - 1, Math.max(...keep.map(s => s.x1)) + PAD)
  const by1 = Math.min(h - 1, Math.max(...keep.map(s => s.y1)) + PAD)
  const cw = bx1 - bx0 + 1
  const chh = by1 - by0 + 1

  const rgb = Buffer.alloc(cw * chh * 3)
  const mask = Buffer.alloc(cw * chh)
  for (let y = 0; y < chh; y++) {
    for (let x = 0; x < cw; x++) {
      const src = (by0 + y) * w + (bx0 + x)
      const d = y * cw + x
      const o = src * C
      rgb[d * 3] = data[o]
      rgb[d * 3 + 1] = data[o + 1]
      rgb[d * 3 + 2] = data[o + 2]
      mask[d] = kept.has(island[src]) ? 255 : 0
    }
  }

  // Feather the matte by a hair. A hard alpha edge on a soft clay render reads
  // as a sticker cut out with scissors. Blur can hand back more than one
  // channel; take the first if so, or the mask lands in stripes.
  const blurred = await sharp(mask, { raw: { width: cw, height: chh, channels: 1 } })
    .blur(0.7)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const bc = blurred.info.channels
  const alpha = bc === 1 ? blurred.data : Buffer.alloc(cw * chh)
  if (bc !== 1) for (let i = 0; i < cw * chh; i++) alpha[i] = blurred.data[i * bc]

  await sharp(rgb, { raw: { width: cw, height: chh, channels: 3 } })
    .joinChannel(alpha, { raw: { width: cw, height: chh, channels: 1 } })
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(resolve(OUT, `tool-${name}.webp`))

  console.log(
    `✓ tool-${name}.webp  ${cw}x${chh}  ` +
      `${keep.length} piece${keep.length === 1 ? '' : 's'}, ${dropped.length} dropped`,
  )

  if (DEBUG) {
    const dbg = Buffer.alloc(N * 4)
    for (let i = 0; i < N; i++) {
      const on = kept.has(island[i])
      const o = i * C
      dbg[i * 4] = on ? data[o] : 255
      dbg[i * 4 + 1] = on ? data[o + 1] : 0
      dbg[i * 4 + 2] = on ? data[o + 2] : 255
      dbg[i * 4 + 3] = 255
    }
    await sharp(dbg, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(resolve(import.meta.dirname, `../../art-in/source-art/tools/debug-cut-${name}.png`))
  }
}

if (DEBUG) console.log('wrote debug cuts to art-in/source-art/tools/')
