// Turns the client's clinic render into the wall the four props stand against.
//
// Only the top of the render is used, and that is the whole trick. The render
// already contains a dental chair, dead centre, plus a stool and a delivery
// unit — and the game stands its own chair in front of it. A full-frame
// backdrop gives you two chairs arguing with each other, and blurring it hard
// enough to hide the second one turns the room into mush and takes the floor
// with it.
//
// Cropping at the chair's headrest instead gives a clean wall — ceiling,
// window, framed pictures, shelves, wall art — with no furniture in it at all.
// The stage's own floor carries the bottom of the frame, as it already did.
//
// Two fixes on the way through:
//
// 1. The wall sign says "Healthy Teeth Happy Smile!" in baked-in English. Half
//    this game's audience reads Arabic, and every other word in the product is
//    HTML for exactly that reason. That patch gets blurred until the glowing
//    tooth is still a tooth and the words are gone.
// 2. A gentle defocus and lift, so crisp props read as standing in front of it
//    and the caption stays legible over any part of the wall.
//
// Usage: node scripts/make-clinic-bg.mjs
import sharp from 'sharp'
import { resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '../public/art/clinic-room.webp')
const OUT = resolve(import.meta.dirname, '../public/art/clinic-room-bg.webp')

const W = 1280
const H = 1024

// The sign, in the coordinates of the resized image.
const SIGN = { left: 966, top: 111, width: 286, height: 247 }

const base = sharp(SRC).resize(W, H, { fit: 'fill' })

// Blur the sign hard enough that the lettering stops being lettering, while the
// glow and the tooth silhouette survive as wall decoration.
const patch = await base
  .clone()
  .extract(SIGN)
  .blur(22)
  .modulate({ saturation: 0.9 })
  .png()
  .toBuffer()

// Feather the patch edge so it does not show as a rectangle against the wall.
const mask = Buffer.from(
  `<svg width="${SIGN.width}" height="${SIGN.height}">
     <defs>
       <radialGradient id="f" cx="50%" cy="50%" r="52%">
         <stop offset="70%" stop-color="#fff" stop-opacity="1"/>
         <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
       </radialGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#f)"/>
   </svg>`,
)

const feathered = await sharp(patch)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer()

// A portrait phone crops hard to the centre of a landscape plate, so the useful
// part of the render is a tall slice through the middle: window and wall art at
// the top, chair and rug at the bottom. Keep the whole frame and let the stage
// choose; the defocus is what stops the chair inside it competing.
const patched = await base
  .clone()
  .composite([{ input: feathered, left: SIGN.left, top: SIGN.top }])
  .png()
  .toBuffer()

await sharp(patched)
  .blur(9)
  .modulate({ brightness: 1.12, saturation: 0.8 })
  .webp({ quality: 82 })
  .toFile(OUT)

console.log(`✓ clinic-room-bg.webp  (${W}x${H})`)
