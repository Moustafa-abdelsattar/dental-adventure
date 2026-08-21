// Stands the suction and the air-water syringe in the clinic room.
//
// The room's own delivery unit wears its instruments as five thin grey hoses.
// They are the right things but the wrong size — indistinguishable from each
// other and far too small for a four-year-old to aim at — so the two the game
// wants a child to meet are lifted out and stood up as their own objects, big
// enough to press.
//
// They are rendered for this room rather than borrowed from the tools board.
// The board's versions were the first attempt and they read as stickers on a
// photograph: candy-bright against a muted room, lit flat from the front while
// everything behind them is lit softly from the upper left, and drawn straight
// on where the room is three-quarter from above. These are muted, lit to match,
// and each stands in its own cream cradle — which is also why nothing here
// paints a fake contact shadow any more. The shadow is in the render.
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
import { cutToRgba } from './lib/cutout.mjs'

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
  // These instruments are cream on white. The default flood, tuned for a boy
  // in a blue chair, treats anything above luma 200 as background and walks
  // straight through their bodies — so the floor is raised to just under pure
  // white, which is the only thing here that actually is the background.
  { id: 'suction', src: 'suction-room.png', left: 0.607, bottom: 0.60, width: 0.155, cut: { bgLuma: 250, softLuma: 206 } },
  { id: 'syringe', src: 'airwater-room.png', left: 0.783, bottom: 0.605, width: 0.165, cut: { bgLuma: 250, softLuma: 206 } },
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

  // Lifted off its flat background first — the prompt asks for white rather
  // than transparent, because a model's own alpha channel is worse than none.
  const cut = await cutToRgba(sharp, src, p.cut)
  const cutPng = await sharp(cut.rgba, { raw: { width: cut.width, height: cut.height, channels: 4 } })
    .png()
    .toBuffer()
  const trimmed = await sharp(cutPng).trim({ threshold: 1 }).png().toBuffer()
  const meta = await sharp(trimmed).metadata()

  const w = Math.round(CANVAS.width * p.width)
  const h = Math.round((w * meta.height) / meta.width)
  const left = Math.round(CANVAS.width * p.left)
  const top = Math.round(CANVAS.height * p.bottom - h)

  const prop = await sharp(trimmed).resize({ width: w }).png().toBuffer()

  const layer = await sharp({
    create: { ...CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: prop, left, top }])
    .png()
    .toBuffer()

  const out = `public/art/clinic-layer-${p.id}.webp`
  await sharp(layer).webp({ quality: 88, alphaQuality: 95 }).toFile(out)

  // the card's close-up: the prop on its own, big
  await sharp(trimmed)
    .resize({ width: 640 })
    .webp({ quality: 86, alphaQuality: 95 })
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
