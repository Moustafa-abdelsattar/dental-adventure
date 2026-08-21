// Stands the suction and the air-water syringe in the clinic room.
//
// The room's own delivery unit wears its instruments as five thin grey hoses.
// They are the right things but the wrong size — indistinguishable from each
// other and far too small for a four-year-old to aim at — so the two the game
// wants a child to meet are lifted out and stood up as their own objects, big
// enough to press, using the prop renders already in art-in/source-art.
//
// Every clinic layer is a full-canvas transparent image whose own artwork does
// the positioning, so these are composed onto the same 1000x1083 canvas as the
// chair and the light. The hotspot box is then measured back off the alpha,
// exactly as scripts/import-pptx-clinic.mjs does for the originals, rather than
// typed in by hand.
//
// Usage: node scripts/place-clinic-tools.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CANVAS = { width: 1000, height: 1083 }
const HOTSPOTS = 'src/content/clinic-hotspots.json'

/**
 * Where each instrument stands, as a fraction of the canvas.
 *
 * `width` is the tap target as much as the picture: the overhead light, the
 * smallest of the objects that already worked, is 21.7% wide, so nothing here
 * goes far below that. `bottom` rests them on the delivery unit's tray so they
 * read as standing on it rather than floating over the room.
 */
const PLACEMENTS = [
  { id: 'suction', src: 'suction.png', left: 0.612, bottom: 0.565, width: 0.17 },
  { id: 'syringe', src: 'airwater.png', left: 0.792, bottom: 0.575, width: 0.155 },
]

/** Tightest box containing every pixel that is not fully transparent. */
async function alphaBox(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, maxX, maxY, w: info.width, h: info.height }
}

/** A child's aim is not precise; the originals are padded and so are these. */
const PAD = 0.02

const hotspots = JSON.parse(readFileSync(resolve(HOTSPOTS), 'utf8'))

for (const p of PLACEMENTS) {
  const src = resolve('../art-in/source-art', p.src)
  const meta = await sharp(src).metadata()
  const w = Math.round(CANVAS.width * p.width)
  const h = Math.round((w * meta.height) / meta.width)
  const left = Math.round(CANVAS.width * p.left)
  const top = Math.round(CANVAS.height * p.bottom - h)

  const prop = await sharp(src).resize({ width: w }).png().toBuffer()

  // A soft ellipse where it meets the tray. Without one an instrument reads as
  // hovering over the unit rather than standing in its holder — which is what
  // the first pass looked like, and the one thing that gave the paste away.
  const shadowW = Math.round(w * 0.62)
  const shadowH = Math.round(shadowW * 0.3)
  const shadow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${shadowW}" height="${shadowH}">` +
      `<defs><radialGradient id="g"><stop offset="0%" stop-color="#5b6b7a" stop-opacity="0.42"/>` +
      `<stop offset="70%" stop-color="#5b6b7a" stop-opacity="0.14"/>` +
      `<stop offset="100%" stop-color="#5b6b7a" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW / 2}" ry="${shadowH / 2}" fill="url(#g)"/></svg>`,
  )

  const layer = await sharp({
    create: { ...CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadow, left: left + Math.round((w - shadowW) / 2), top: top + h - Math.round(shadowH * 0.62) },
      { input: prop, left, top },
    ])
    .png()
    .toBuffer()

  const out = `public/art/clinic-layer-${p.id}.webp`
  await sharp(layer).webp({ quality: 88, alphaQuality: 95 }).toFile(out)

  // the card's close-up: the prop on its own, big
  await sharp(src).resize({ width: 640 }).webp({ quality: 86, alphaQuality: 95 })
    .toFile(`public/art/clinic-detail-${p.id}.webp`)

  const box = await alphaBox(layer)
  hotspots[p.id] = {
    left: +Math.max(0, (box.minX / box.w - PAD) * 100).toFixed(1),
    top: +Math.max(0, (box.minY / box.h - PAD) * 100).toFixed(1),
    width: +Math.min(100, ((box.maxX - box.minX) / box.w + PAD * 2) * 100).toFixed(1),
    height: +Math.min(100, ((box.maxY - box.minY) / box.h + PAD * 2) * 100).toFixed(1),
  }
  console.log(`${p.id.padEnd(8)} layer ${w}x${h} at (${left},${top})  hotspot`, hotspots[p.id])
}

// the sink and the table are still in the room; they are simply no longer
// things the child is asked to press
delete hotspots.sink
delete hotspots.table

writeFileSync(resolve(HOTSPOTS), JSON.stringify(hotspots, null, 2) + '\n')
console.log('wrote', HOTSPOTS)
