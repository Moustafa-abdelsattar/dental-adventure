// Takes the pale rim off the chair and the lamp.
//
// Those two are cut out of the client's PowerPoint, and they are laid over a
// room rendered separately. The cut carries a ring of the *original* room's
// pixels along its anti-aliased edge — invisible over the render it came from,
// a bright fringe over this one, and the reason the chair reads as a sticker
// while the suction and the syringe beside it do not. Those two were lifted out
// of this room's own plate, so they have no foreign edge to show.
//
// The fix is the same one the generated instruments needed: drop the outermost
// ring of the cut and ramp the alpha out over the next two pixels. The plate is
// then repainted through the trimmed alpha so the erased hole still sits under
// the object rather than peeking out beside it.
//
// Usage: node scripts/trim-clinic-layers.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = 'public/art'
const LAYERS = ['chair', 'light']

/** How far in to eat, and how the alpha ramps back up behind it. */
const RAMP = [0, 0, 110, 200]

/** Distance, in pixels, from each opaque pixel to the nearest see-through one. */
function rampAlpha(alpha, w, h) {
  const dist = new Uint8Array(w * h).fill(255)
  const queue = []
  for (let i = 0; i < w * h; i++) {
    if (alpha[i] < 24) {
      dist[i] = 0
      queue.push(i)
    }
  }
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
    // never brighten a pixel that was already partly see-through
    out[i] = Math.min(alpha[i], dist[i] < RAMP.length ? RAMP[dist[i]] : 255)
  }
  return out
}

for (const name of LAYERS) {
  const file = resolve(OUT, `clinic-layer-${name}.webp`)
  // Read into memory rather than handing sharp the path: it keeps the input
  // file open, and on Windows that blocks writing back over it afterwards.
  const source = readFileSync(file)
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info

  const alpha = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3]
  const before = alpha.reduce((n, a) => n + (a > 0 ? 1 : 0), 0)

  const trimmed = rampAlpha(alpha, w, h)
  for (let i = 0; i < w * h; i++) data[i * 4 + 3] = trimmed[i]
  const after = trimmed.reduce((n, a) => n + (a > 0 ? 1 : 0), 0)

  // Encode to a buffer first: sharp cannot read and write the same path in one
  // pipeline, and asking it to truncates the file it is still reading.
  const encoded = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 95 })
    .toBuffer()
  writeFileSync(file, encoded)
  console.log(`✓ clinic-layer-${name.padEnd(6)} edge trimmed, ${before - after} rim pixels dropped`)
}

console.log('\nnow re-run: node scripts/import-clinic-v2.mjs')
console.log('so the plate is repainted through the trimmed alpha')
