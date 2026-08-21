// Rebuilds the clinic screen from the room render that has the instruments in it.
//
// The first version of this screen stood the suction and the air-water syringe
// on the delivery unit as props laid over the room. Even redrawn in the room's
// own palette they were objects placed on a picture. This room was rendered
// with both of them already on the unit, lit by the same light and standing in
// their own holders, which is the only way they were ever going to look like
// they belong there.
//
// The render drops straight into the existing pipeline: same 1402x1122 source
// size, same composition, so the chair and the light cut out of the client's
// PowerPoint still land exactly on their counterparts here. Those two keep
// animating as they always did. Only the plate underneath changes, and the two
// instruments are new.
//
// Usage: node scripts/import-clinic-v2.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = '../art-in/source-art/clinic-v2.png'
const OUT = 'public/art'
const HOTSPOTS = 'src/content/clinic-hotspots.json'

// All four shared with scripts/import-pptx-clinic.mjs, which cut the originals.
const SRC_W = 1402
const SRC_H = 1122
const CROP = { left: 280, top: 135, width: 911, height: 987 }
const W = 1000
const H = Math.round((CROP.height / CROP.width) * W)

/** The wall sign, in source pixels. */
const SIGN = { left: 1058, top: 121, width: 314, height: 272 }

/**
 * Where each instrument stands on the plate, in plate pixels, measured off the
 * render itself.
 *
 * `lift` is the picture — the region cut out of the plate so the object can
 * move on its own. `hit` is the button, and it is deliberately much larger.
 * Drawn at the size the room gives them, these two are about thirty pixels
 * across on a phone; a four-year-old aiming a finger needs a target several
 * times that, and an invisible button owes the artwork nothing. The two boxes
 * are sized to sit side by side without touching, because the last time two
 * targets on this screen overlapped, one of them stopped working.
 */
const INSTRUMENTS = [
  {
    id: 'suction',
    detail: 'suction-room.png',
    lift: { left: 646, top: 446, width: 76, height: 154 },
    hit: { left: 62.0, top: 38.0, width: 12.5, height: 20.0 },
  },
  {
    id: 'syringe',
    detail: 'airwater-room.png',
    lift: { left: 746, top: 423, width: 144, height: 176 },
    hit: { left: 75.2, top: 36.0, width: 12.5, height: 22.0 },
  },
]

const src = () => sharp(resolve(SRC)).resize(SRC_W, SRC_H, { fit: 'fill' })

// ------------------------------------------------------------------ the sign

// Half this game's audience reads Arabic, and this render brought the English
// wall sign back sharp enough to read. Blurred until the glowing tooth is still
// a tooth and the words are gone, feathered so it is not a rectangle.
const signBlur = await src().extract(SIGN).blur(44).modulate({ saturation: 0.55 }).png().toBuffer()
const signMask = Buffer.from(
  `<svg width="${SIGN.width}" height="${SIGN.height}">
     <defs><radialGradient id="f" cx="50%" cy="50%" r="52%">
       <stop offset="68%" stop-color="#fff" stop-opacity="1"/>
       <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
     </radialGradient></defs>
     <rect width="100%" height="100%" fill="url(#f)"/>
   </svg>`,
)
const signPatch = await sharp(signBlur).composite([{ input: signMask, blend: 'dest-in' }]).png().toBuffer()

const silenced = await src().composite([{ input: signPatch, left: SIGN.left, top: SIGN.top }]).png().toBuffer()
let plate = await sharp(silenced).extract(CROP).resize(W, H).png().toBuffer()

// ----------------------------------------------------------- erasing the two

// The chair and the light rock when they are pressed, and this render has both
// of them painted into the room. Leave them there and the moment either one
// tips, the original underneath is revealed alongside it as a second chair. So
// the plate gets those two regions repainted with a heavy blur of itself, using
// the cut-outs' own alpha as the stencil — the same crude inpainting the first
// import did, and the fill is only ever glimpsed as a crescent for the second
// an object is moving.
let maskGray = null
for (const name of ['chair', 'light']) {
  const a = await sharp(resolve(OUT, `clinic-layer-${name}.webp`)).ensureAlpha().extractChannel(3).png().toBuffer()
  maskGray = maskGray ? await sharp(maskGray).composite([{ input: a, blend: 'lighten' }]).png().toBuffer() : a
}
maskGray = await sharp(maskGray).blur(5).linear(1.8, 0).png().toBuffer()

const maskRGBA = await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
  .joinChannel(maskGray)
  .png()
  .toBuffer()

const smear = await sharp(plate).blur(45).modulate({ brightness: 1.22, saturation: 0.35 }).png().toBuffer()
const patch = await sharp(smear).composite([{ input: maskRGBA, blend: 'dest-in' }]).png().toBuffer()
plate = await sharp(plate).composite([{ input: patch }]).png().toBuffer()

await sharp(plate).webp({ quality: 84 }).toFile(resolve(OUT, 'clinic-scene.webp'))
console.log(`✓ clinic-scene.webp        ${W}x${H}, chair and light erased, sign silenced`)

// ----------------------------------------------------- lifting the two tools

// Not erased from the plate, only copied off it through a soft-edged window.
// That works because the layer sits over pixels identical to the ones beneath
// it: at rest it is invisible, and the only thing ever applied to it is a
// gentle pulse, which never moves it far enough to show an edge. The same trick
// the rinse bowl used before these two replaced it.
const hotspots = JSON.parse(readFileSync(resolve(HOTSPOTS), 'utf8'))

for (const inst of INSTRUMENTS) {
  const { left, top, width, height } = inst.lift
  const window = Buffer.from(
    `<svg width="${width}" height="${height}">
       <defs><radialGradient id="f" cx="50%" cy="50%" r="58%">
         <stop offset="74%" stop-color="#fff" stop-opacity="1"/>
         <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
       </radialGradient></defs>
       <rect width="100%" height="100%" fill="url(#f)"/>
     </svg>`,
  )
  const region = await sharp(plate)
    .extract(inst.lift)
    .composite([{ input: window, blend: 'dest-in' }])
    .png()
    .toBuffer()

  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: region, left, top }])
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(resolve(OUT, `clinic-layer-${inst.id}.webp`))

  // The card's close-up comes from the instrument's own full-resolution render,
  // not from a hundred-pixel window lifted out of a room.
  await sharp(resolve('../art-in/source-art', inst.detail))
    .resize({ width: 640 })
    .webp({ quality: 86, alphaQuality: 95 })
    .toFile(resolve(OUT, `clinic-detail-${inst.id}.webp`))

  hotspots[inst.id] = inst.hit
  console.log(`✓ clinic-layer-${inst.id.padEnd(8)}  lifted ${width}x${height} at (${left},${top})`)
}

writeFileSync(resolve(HOTSPOTS), JSON.stringify(hotspots, null, 2) + '\n')
console.log('✓ clinic-hotspots.json     tap boxes updated')
