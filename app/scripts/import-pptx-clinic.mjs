// Builds the Meet the Clinic scene from the client's own PowerPoint.
//
// `tooth game.pptx` turns out to already contain the layered scene the game
// needs. Slide 2 is the clinic room with the chair as a separate transparent
// image sitting exactly over its own position; slides 3 and 4 do the same for
// the overhead light and the delivery unit. All four share one 1402x1122
// canvas, so they composite back into the original render pixel for pixel —
// which is the registration that makes independent animation possible.
//
//   ppt/media/image1.png   the room
//   ppt/media/image2.png   the chair, in place
//   ppt/media/image3.png   the light, in place
//   ppt/media/image4.png   the delivery unit, in place  (1404x1123, off by one)
//
// Two things this has to fix on the way through:
//
// 1. The room still contains the chair, light and unit it was rendered with.
//    Lay the cut-outs on top and nothing shows — until one of them moves, and
//    the original underneath is revealed as a ghost. So the plate gets those
//    three regions erased through their own alpha and filled with a heavy blur
//    of the room. Crude inpainting, but the fill is only ever glimpsed as a
//    crescent for the second an object is animating, with the crisp cut-out
//    sitting back on top of it the rest of the time.
//
// 2. The wall sign reads "Healthy Teeth Happy Smile!" in baked-in English.
//    Half this game's audience reads Arabic. It gets blurred until the glowing
//    tooth is still a tooth and the words are gone.
//
// The rinse bowl beside the chair — the game's "little sink" — has no cut-out
// in the deck, so it is lifted out of the plate through a soft ellipse. That
// works because the layer sits over identical pixels at rest; only a gentle
// pulse is ever applied to it.
//
// Usage: node scripts/import-pptx-clinic.mjs [path-to-extracted-pptx]
import sharp from 'sharp'
import { resolve } from 'node:path'

const MEDIA =
  process.argv[2] ??
  'C:/Users/moust/AppData/Local/Temp/claude/F--Dental-kids/8e30c840-7ff3-4e05-b8a3-1fab08fb4c8e/scratchpad/pptx/ppt/media'
const OUT = resolve(import.meta.dirname, '../public/art')

const SRC_W = 1402
const SRC_H = 1122

/**
 * The room is a landscape render and a phone is a tall rectangle, which is a
 * problem when the four things a child must find span nearly the whole width.
 * Scale it to fill the height and the trolley goes off the side; show all of it
 * and two thirds of the screen is left over.
 *
 * So the shipped plate is cropped to the region the objects actually occupy —
 * from the lamp's ceiling mount down to the floor, and just outside the chair
 * and the counter. That is close to a portrait shape, so almost nothing is left
 * over, and every object still fits on screen at full width.
 *
 * Hotspots are measured from the cropped layers further down, so this crop
 * needs no numbers updating anywhere else.
 */
const CROP = { left: 280, top: 135, width: 911, height: 987 }

// Shipped size, following the crop's own shape.
const W = 1000
const H = Math.round((CROP.height / CROP.width) * W)

const p = f => `${MEDIA}/${f}`
const norm = f => sharp(p(f)).resize(SRC_W, SRC_H, { fit: 'fill' })

/** The wall sign, in source pixels. */
const SIGN = { left: 1058, top: 121, width: 314, height: 272 }

const LAYERS = [
  { file: 'image2.png', name: 'chair' },
  { file: 'image3.png', name: 'light' },
  { file: 'image4.png', name: 'table' }, // the delivery unit: "The Tool Table"
]

/** The rinse bowl on its stand, beside the chair. Source pixels. */
const BOWL = { cx: 786, cy: 590, rx: 68, ry: 52 }

// ---------------------------------------------------------------- the plate

// Union of the three cut-out alphas: everywhere the room needs repainting.
let maskGray = await norm(LAYERS[0].file).extractChannel(3).png().toBuffer()
for (const l of LAYERS.slice(1)) {
  const a = await norm(l.file).extractChannel(3).png().toBuffer()
  maskGray = await sharp(maskGray).composite([{ input: a, blend: 'lighten' }]).png().toBuffer()
}
// Spread it slightly so the fill reaches under the cut-out's own soft edge.
maskGray = await sharp(maskGray).blur(5).linear(1.8, 0).png().toBuffer()

const maskRGBA = await sharp({
  create: { width: SRC_W, height: SRC_H, channels: 3, background: '#ffffff' },
})
  .joinChannel(maskGray)
  .png()
  .toBuffer()

// Lifted and drained on top of the blur. The fill is only ever seen as a
// crescent behind a moving object, and a pale haze reads as depth there while
// a saturated smear reads as a second chair.
const smear = await norm('image1.png')
  .blur(45)
  .modulate({ brightness: 1.22, saturation: 0.35 })
  .png()
  .toBuffer()
const patch = await sharp(smear)
  .composite([{ input: maskRGBA, blend: 'dest-in' }])
  .png()
  .toBuffer()

// The sign, blurred past legibility and feathered so it is not a rectangle.
const signBlur = await norm('image1.png')
  .extract(SIGN)
  .blur(44)
  .modulate({ saturation: 0.55 })
  .png()
  .toBuffer()
const signMask = Buffer.from(
  `<svg width="${SIGN.width}" height="${SIGN.height}">
     <defs><radialGradient id="f" cx="50%" cy="50%" r="52%">
       <stop offset="68%" stop-color="#fff" stop-opacity="1"/>
       <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
     </radialGradient></defs>
     <rect width="100%" height="100%" fill="url(#f)"/>
   </svg>`,
)
const signPatch = await sharp(signBlur)
  .composite([{ input: signMask, blend: 'dest-in' }])
  .png()
  .toBuffer()

// Two passes on purpose: sharp resizes before it composites, so doing both in
// one chain would try to lay a full-size patch onto an already-shrunk plate.
const plate = await norm('image1.png')
  .composite([
    { input: patch },
    { input: signPatch, left: SIGN.left, top: SIGN.top },
  ])
  .png()
  .toBuffer()

await sharp(plate).extract(CROP).resize(W, H).webp({ quality: 84 }).toFile(resolve(OUT, 'clinic-scene.webp'))
console.log('✓ clinic-scene.webp   room plate, objects erased, sign silenced')

// --------------------------------------------------------------- the layers

for (const l of LAYERS) {
  // Normalise to a buffer first. Two resizes in one chain collapse into the
  // last one, so the crop would be measured against the file's own dimensions
  // — and image4 is a pixel bigger than the rest.
  const full = await norm(l.file).png().toBuffer()
  await sharp(full)
    .extract(CROP)
    .resize(W, H)
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile(resolve(OUT, `clinic-layer-${l.name}.webp`))
  console.log(`✓ clinic-layer-${l.name}.webp`)
}

// The rinse bowl, lifted out of the plate through a soft ellipse.
const bowlMask = Buffer.from(
  `<svg width="${SRC_W}" height="${SRC_H}">
     <defs><radialGradient id="b" cx="50%" cy="50%" r="50%">
       <stop offset="72%" stop-color="#fff" stop-opacity="1"/>
       <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
     </radialGradient></defs>
     <ellipse cx="${BOWL.cx}" cy="${BOWL.cy}" rx="${BOWL.rx}" ry="${BOWL.ry}" fill="url(#b)"/>
   </svg>`,
)
const bowl = await norm('image1.png')
  .composite([{ input: bowlMask, blend: 'dest-in' }])
  .png()
  .toBuffer()
await sharp(bowl)
  .extract(CROP)
  .resize(W, H)
  .webp({ quality: 86, alphaQuality: 100 })
  .toFile(resolve(OUT, 'clinic-layer-sink.webp'))
console.log('✓ clinic-layer-sink.webp   rinse bowl, lifted from the plate')

// ---------------------------------------------------------- close-up detail
//
// Some objects are worth a proper look once a child has pressed them. The
// trolley in the room is a beige box with hoses; what actually matters about
// it is what is laid out on top — the mirror, the little camera, the tooth in
// its ring — and none of that is legible at the size it occupies in the scene.
// So the card gets its own render rather than a magnified crop of the plate.
//
// Optional and by name: an object without a file here just shows the crop.
const DETAIL = ['table']
const DETAIL_W = 900

for (const name of DETAIL) {
  const src = resolve(import.meta.dirname, `../../art-in/source-art/clinic/${name}-detail.png`)
  try {
    const m = await sharp(src).metadata()
    await sharp(src)
      .resize(DETAIL_W, Math.round((m.height / m.width) * DETAIL_W))
      .webp({ quality: 86 })
      .toFile(resolve(OUT, `clinic-detail-${name}.webp`))
    console.log(`✓ clinic-detail-${name}.webp`)
  } catch {
    console.warn(`! no close-up for "${name}" at art-in/source-art/clinic/${name}-detail.png — the card will crop the plate instead`)
  }
}

// ------------------------------------------------------------- the hotspots
//
// Where each object actually is, measured from its own alpha rather than
// guessed by eye. The game needs tap targets, and the layer images cannot be
// the buttons — they are all full-canvas and mostly transparent, so four of
// them stacked would mean only the topmost ever gets pressed.

/** Alpha below this is background, not object. */
const ALPHA_FLOOR = 24
/** Grown by this share of the scene on each side: children aim roughly. */
const PAD = 0.02

const bboxOf = async file => {
  const normalised = await sharp(file).resize(SRC_W, SRC_H, { fit: 'fill' }).png().toBuffer()
  const { data, info } = await sharp(normalised)
    .extract(CROP)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > ALPHA_FLOOR) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const pct = (v, total) => Math.round(((v / total) * 100 + Number.EPSILON) * 10) / 10
  const clamp = v => Math.max(0, Math.min(100, v))
  const left = clamp(pct(minX, CROP.width) - PAD * 100)
  const top = clamp(pct(minY, CROP.height) - PAD * 100)
  return {
    left,
    top,
    width: clamp(pct(maxX - minX, CROP.width) + PAD * 200),
    height: clamp(pct(maxY - minY, CROP.height) + PAD * 200),
  }
}

const hotspots = {}
for (const l of LAYERS) hotspots[l.name] = await bboxOf(p(l.file))
hotspots.sink = await bboxOf(resolve(OUT, 'clinic-layer-sink.webp'))

const { writeFileSync } = await import('node:fs')
writeFileSync(
  resolve(import.meta.dirname, '../src/content/clinic-hotspots.json'),
  // the scene's shape travels with the boxes, so the screen cannot drift from
  // whatever crop this script last produced
  JSON.stringify({ scene: { width: W, height: H }, ...hotspots }, null, 2) + '\n',
)
console.log('\n✓ src/content/clinic-hotspots.json')
for (const [k, v] of Object.entries(hotspots)) {
  console.log(`   ${k.padEnd(6)} ${v.left}% ${v.top}%  ${v.width}x${v.height}`)
}

console.log(`\nscene is ${W}x${H}; every layer shares that canvas.`)
