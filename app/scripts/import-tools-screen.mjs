// Ships the tools screen plate: the delivery unit with an empty tray and an
// empty progress groove.
//
// Both emptinesses are deliberate. The instruments are laid onto the tray by
// the app, three at a time, because the game shows them in groups and because a
// picture of nine instruments cannot tell you which ones a child has already
// met. The groove is drawn empty for the same reason the wall sign had to lose
// its lettering: what slides along it has to be live, so it can move as tools
// are met and so it never contains a number that would need translating.
//
// Usage: node scripts/import-tools-screen.mjs
import sharp from 'sharp'
import { resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '../../art-in/source-art/tools/screen-portrait.png')
const OUT = resolve(import.meta.dirname, '../public/art/tools-screen.webp')

// Tall enough for a phone at 3x without carrying a megabyte around.
const W = 900

const meta = await sharp(SRC).metadata()
const H = Math.round((meta.height / meta.width) * W)

await sharp(SRC).resize(W, H).webp({ quality: 84 }).toFile(OUT)
console.log(`✓ tools-screen.webp  ${W}x${H}`)

// A blurred copy to stand behind it.
//
// The plate is squarer than a phone, so showing all of it leaves bands above
// and below. Cropping instead would push the instruments off the top, and
// letting the page colour show through makes the screen look like a picture
// pasted onto a form. This fills the remainder with the plate's own colours,
// far enough out of focus to read as depth rather than as a second trolley.
await sharp(SRC)
  .resize(Math.round(W / 2), Math.round(H / 2))
  .blur(22)
  .modulate({ brightness: 1.06, saturation: 0.8 })
  .webp({ quality: 70 })
  .toFile(OUT.replace('.webp', '-bg.webp'))
console.log('✓ tools-screen-bg.webp')
