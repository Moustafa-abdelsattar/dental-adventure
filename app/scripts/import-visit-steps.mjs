// Imports the five visit-walkthrough frames.
//
// The frames come out of ChatGPT as separate renders on a flat background, and
// the game cross-fades one into the next. That only looks like a camera
// watching a room if the chair does not move between them, so this does two
// things the eye cannot do by hand:
//
//   1. cuts the background away by flooding in from the borders, which follows
//      the warm gradient behind the lit frame without eating into the subject
//   2. aligns every frame to the first one by matching the chair itself, then
//      crops all five to one shared canvas so they stack pixel-for-pixel
//
// Usage:  node scripts/import-visit-steps.mjs <folder-with-the-five-pngs>
import sharp from 'sharp'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = process.argv[2] ?? 'C:/Users/moust/Downloads'
const OUT = 'public/art'
const OUT_WIDTH = 820
const QUALITY = 82

/** Source stamp → the step it plays under. */
const FRAMES = [
  { stamp: '01_11_26', name: 'visit-step-chair' },
  { stamp: '01_13_32', name: 'visit-step-light' },
  { stamp: '01_16_27', name: 'visit-step-mirror' },
  { stamp: '01_18_12', name: 'visit-step-clean' },
  { stamp: '01_23_21', name: 'visit-step-hand' },
]

/** Anything this light, reached from the border, is background. */
const BG_LUMA = 200
/**
 * How far one background pixel may drift from the neighbour it spread from,
 * summed over the three channels.
 *
 * This is the number that decides whether the cut works. A vignette or a warm
 * glow changes by one or two levels per pixel, so a tight budget still walks
 * the whole gradient into the corners; an anti-aliased outline changes by
 * thirty or more in a single step, so the same budget stops dead at it. Set it
 * loose (it was 78) and the flood strolls through the boy's outline and eats
 * his face, his bib and the white of the chair, because those are lighter than
 * any luma floor worth having.
 */
const STEP_TOLERANCE = 12

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/**
 * Flood the background in from every border pixel.
 *
 * Compared against the neighbour it spread from rather than one fixed colour,
 * so a vignette or a warm glow stays background all the way into the corners;
 * the luma floor is what stops it leaking through an anti-aliased outline into
 * the boy's skin, which is warm and light too.
 */
function cutOut(data, w, h) {
  const alpha = new Uint8Array(w * h).fill(255)
  const seen = new Uint8Array(w * h)
  const stack = []

  const push = (x, y, from) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const i = y * w + x
    if (seen[i]) return
    const p = i * 3
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
    if (luma(r, g, b) < BG_LUMA) return
    if (from && Math.abs(r - from[0]) + Math.abs(g - from[1]) + Math.abs(b - from[2]) > STEP_TOLERANCE) return
    seen[i] = 1
    alpha[i] = 0
    stack.push([x, y, [r, g, b]])
  }

  for (let x = 0; x < w; x++) {
    push(x, 0, null)
    push(x, h - 1, null)
  }
  for (let y = 0; y < h; y++) {
    push(0, y, null)
    push(w - 1, y, null)
  }

  while (stack.length) {
    const [x, y, c] = stack.pop()
    push(x + 1, y, c)
    push(x - 1, y, c)
    push(x, y + 1, c)
    push(x, y - 1, c)
  }
  return alpha
}

/**
 * Eat the outline back, then ramp the alpha out over the next couple of pixels.
 *
 * Stopping the flood tight enough to save the boy's face leaves the pale
 * anti-aliased rim of the original background still attached to him — against
 * white you never see it, but the game stands him on a mint-and-cream room and
 * it reads as a cheap sticker cut. So the first ring inside the cut is dropped
 * outright and the two behind it are ramped, which removes the halo and softens
 * the edge in one pass.
 */
function trimEdge(alpha, w, h) {
  // distance, in pixels, from each subject pixel to the nearest background one
  const dist = new Uint8Array(w * h).fill(255)
  const queue = []
  for (let i = 0; i < w * h; i++) {
    if (alpha[i] === 0) {
      dist[i] = 0
      queue.push(i)
    }
  }
  const RAMP = [0, 0, 90, 190]
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    const d = dist[i]
    if (d >= RAMP.length - 1) continue
    const x = i % w
    const y = (i / w) | 0
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      if (dist[j] !== 255) continue
      dist[j] = d + 1
      queue.push(j)
    }
  }

  const out = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    out[i] = dist[i] < RAMP.length ? RAMP[dist[i]] : 255
  }
  return out
}

/** Greyscale of the opaque subject, for matching. Background reads as white. */
function subjectGrey(data, alpha, w, h) {
  const g = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 3
    g[i] = alpha[i] === 0 ? 255 : luma(data[p], data[p + 1], data[p + 2])
  }
  return g
}

/**
 * How far this frame has to move to sit on top of the reference.
 *
 * Matches on a band down the left of the chair — the arm rest, the column and
 * the base. That strip is the one part of the picture the dentist never covers
 * and the boy never changes, so it is the only honest anchor in the set.
 */
function findOffset(ref, refW, refH, cur, curW, curH) {
  const bx = Math.round(refW * 0.04)
  const bw = Math.round(refW * 0.34)
  const by = Math.round(refH * 0.52)
  const bh = Math.round(refH * 0.42)
  const RANGE = 90
  const STEP_COARSE = 3

  let best = { dx: 0, dy: 0, score: Infinity }
  const score = (dx, dy) => {
    let sum = 0
    let n = 0
    for (let y = by; y < by + bh; y += 4) {
      const cy = y + dy
      if (cy < 0 || cy >= curH) return Infinity
      for (let x = bx; x < bx + bw; x += 4) {
        const cx = x + dx
        if (cx < 0 || cx >= curW) return Infinity
        sum += Math.abs(ref[y * refW + x] - cur[cy * curW + cx])
        n++
      }
    }
    return n ? sum / n : Infinity
  }

  for (let dy = -RANGE; dy <= RANGE; dy += STEP_COARSE) {
    for (let dx = -RANGE; dx <= RANGE; dx += STEP_COARSE) {
      const s = score(dx, dy)
      if (s < best.score) best = { dx, dy, score: s }
    }
  }
  for (let dy = best.dy - 3; dy <= best.dy + 3; dy++) {
    for (let dx = best.dx - 3; dx <= best.dx + 3; dx++) {
      const s = score(dx, dy)
      if (s < best.score) best = { dx, dy, score: s }
    }
  }
  return best
}

const files = await readdir(SRC)
const find = stamp => {
  const hit = files.find(f => f.includes(stamp) && f.toLowerCase().endsWith('.png'))
  if (!hit) throw new Error(`no PNG in ${SRC} matching ${stamp}`)
  return path.join(SRC, hit)
}

// 1 — cut every frame out of its background
const loaded = []
for (const frame of FRAMES) {
  const file = find(frame.stamp)
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const alpha = trimEdge(cutOut(data, w, h), w, h)
  const opaque = alpha.reduce((n, a) => n + (a > 0 ? 1 : 0), 0)
  console.log(`cut  ${frame.name.padEnd(18)} ${w}x${h}  subject ${((opaque / (w * h)) * 100).toFixed(1)}%`)
  loaded.push({ ...frame, data, alpha, w, h, grey: subjectGrey(data, alpha, w, h) })
}

// 2 — align every frame to the first, on the chair
const ref = loaded[0]
for (const f of loaded) {
  if (f === ref) {
    f.dx = 0
    f.dy = 0
    continue
  }
  const { dx, dy, score } = findOffset(ref.grey, ref.w, ref.h, f.grey, f.w, f.h)
  // moving the frame by (-dx,-dy) puts it under the reference
  f.dx = -dx
  f.dy = -dy
  console.log(`align ${f.name.padEnd(18)} dx=${f.dx} dy=${f.dy}  residual ${score.toFixed(1)}`)
}

// 3 — one canvas big enough for all of them, in reference coordinates
let minX = 0
let minY = 0
let maxX = ref.w
let maxY = ref.h
for (const f of loaded) {
  minX = Math.min(minX, f.dx)
  minY = Math.min(minY, f.dy)
  maxX = Math.max(maxX, f.dx + f.w)
  maxY = Math.max(maxY, f.dy + f.h)
}
const canvasW = maxX - minX
const canvasH = maxY - minY
console.log(`canvas ${canvasW}x${canvasH}`)

// 4 — composite each onto that canvas and write it out
for (const f of loaded) {
  const rgba = Buffer.alloc(f.w * f.h * 4)
  for (let i = 0; i < f.w * f.h; i++) {
    rgba[i * 4] = f.data[i * 3]
    rgba[i * 4 + 1] = f.data[i * 3 + 1]
    rgba[i * 4 + 2] = f.data[i * 3 + 2]
    rgba[i * 4 + 3] = f.alpha[i]
  }
  const out = path.join(OUT, `${f.name}.webp`)
  // Two passes on purpose: sharp resizes its input *before* compositing, so
  // asking one pipeline to do both would shrink the canvas out from under the
  // frame being placed on it.
  const placed = await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: rgba, raw: { width: f.w, height: f.h, channels: 4 }, left: f.dx - minX, top: f.dy - minY },
    ])
    .png()
    .toBuffer()
  await sharp(placed).resize({ width: OUT_WIDTH }).webp({ quality: QUALITY, alphaQuality: 90 }).toFile(out)
  console.log(`wrote ${out}`)
}
