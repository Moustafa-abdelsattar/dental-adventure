import { t, type Lang } from './i18n'

const W = 1080
const H = 1527

/**
 * Draws the Dental Hero certificate to a canvas and returns it as a PNG blob.
 * Uses the localized strings; empty name falls back to "A Brave Dental Hero".
 */
export async function renderCertificate({ name, lang, date }: { name: string; lang: Lang; date: Date }): Promise<Blob> {
  await (document.fonts?.ready ?? Promise.resolve())
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const font = lang === 'ar' ? "'Baloo Bhaijaan 2'" : "'Baloo 2'"
  if ('direction' in ctx) ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  ctx.textAlign = 'center'

  // cream background + double gold border
  ctx.fillStyle = '#fef9f0'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#d9a94a'
  ctx.lineWidth = 14
  roundRect(ctx, 40, 40, W - 80, H - 80, 40)
  ctx.stroke()
  ctx.lineWidth = 4
  roundRect(ctx, 70, 70, W - 140, H - 140, 30)
  ctx.stroke()

  // title
  ctx.fillStyle = '#8b6fd8'
  ctx.font = `bold 74px ${font}`
  ctx.fillText(t(lang, 'cert.title'), W / 2, 220)

  // Milo — the custom art if it loads, else the drawn fallback
  const miloImg = await loadImage('/art/milo-celebrate.webp', 500)
  if (miloImg) ctx.drawImage(miloImg, W / 2 - 210, 300, 420, 420)
  else drawMilo(ctx, W / 2, 500, 2.2)

  // awarded to
  ctx.fillStyle = '#3a3560'
  ctx.font = `bold 44px ${font}`
  ctx.fillText(t(lang, 'cert.awardedTo'), W / 2, 800)
  ctx.fillStyle = '#3b7fc4'
  ctx.font = `bold 88px ${font}`
  ctx.fillText(name.trim() || t(lang, 'cert.defaultName'), W / 2, 910)
  ctx.strokeStyle = '#d9a94a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(240, 940)
  ctx.lineTo(W - 240, 940)
  ctx.stroke()

  ctx.fillStyle = '#3a3560'
  ctx.font = `bold 40px ${font}`
  ctx.fillText(t(lang, 'cert.for'), W / 2, 1030)

  // five gold stars (drawn, not emoji — consistent on every device)
  for (let i = 0; i < 5; i++) drawStar(ctx, W / 2 + (i - 2) * 105, 1120, 40, '#f0b429')

  // rosette
  ctx.fillStyle = '#3b7fc4'
  ctx.beginPath()
  ctx.arc(W / 2, 1290, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 30px ${font}`
  ctx.fillText('DENTAL', W / 2, 1282)
  ctx.fillText('HERO', W / 2, 1318)

  // date
  ctx.fillStyle = '#3a3560'
  ctx.font = `bold 34px ${font}`
  ctx.fillText(date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB'), W / 2, 1420)

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const x = cx + Math.cos(a) * radius
    const y = cy + Math.sin(a) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

/** Loads an image with a timeout; resolves null on failure (e.g. tests). */
function loadImage(src: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    const timer = setTimeout(() => resolve(null), timeoutMs)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawMilo(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(0, -60)
  ctx.bezierCurveTo(52, -60, 74, -26, 72, 22)
  ctx.bezierCurveTo(70, 62, 60, 90, 49, 115)
  ctx.bezierCurveTo(42, 131, 27, 130, 24, 111)
  ctx.bezierCurveTo(21, 94, 12, 86, 0, 86)
  ctx.bezierCurveTo(-12, 86, -21, 94, -24, 111)
  ctx.bezierCurveTo(-27, 130, -42, 131, -49, 115)
  ctx.bezierCurveTo(-60, 90, -70, 62, -72, 22)
  ctx.bezierCurveTo(-74, -26, -52, -60, 0, -60)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#dfe7f5'
  ctx.lineWidth = 5
  ctx.stroke()
  // eyes + smile + cheeks
  ctx.fillStyle = '#3a3560'
  ctx.beginPath()
  ctx.ellipse(-24, 10, 9, 12, 0, 0, Math.PI * 2)
  ctx.ellipse(24, 10, 9, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#3a3560'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(-18, 38)
  ctx.quadraticCurveTo(0, 52, 18, 38)
  ctx.stroke()
  ctx.fillStyle = 'rgba(249,168,197,0.7)'
  ctx.beginPath()
  ctx.arc(-42, 30, 9, 0, Math.PI * 2)
  ctx.arc(42, 30, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
