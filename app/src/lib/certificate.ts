import { t, type Lang } from './i18n'

const W = 2480
const H = 3508
const GOLD = '#d9a94a'
const INK = '#3a3560'
const GRAPE = '#8b6fd8'
const SKY = '#3b7fc4'
const BUBBLEGUM = '#f97ba9'
const MINT = '#7fd0ba'
const CREAM = '#fef9f0'

/**
 * Draws the Dental Hero certificate to a canvas and returns it as a PNG blob.
 * The canvas uses an A4 portrait ratio at 300 DPI for crisp print output.
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

  const childName = name.trim() || t(lang, 'cert.defaultName')
  const localizedDate = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')

  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, W, H)

  drawScallopBorder(ctx)

  ctx.strokeStyle = GOLD
  ctx.lineWidth = 30
  roundRect(ctx, 110, 110, W - 220, H - 220, 90)
  ctx.stroke()
  ctx.lineWidth = 8
  roundRect(ctx, 170, 170, W - 340, H - 340, 68)
  ctx.stroke()

  drawRibbon(ctx, W / 2, 360)

  ctx.fillStyle = GRAPE
  fitText(ctx, t(lang, 'cert.title'), W / 2, 570, 1760, 162, 102, font)

  const miloImg = await loadImage('/art/milo-celebrate.webp', 500)
  if (miloImg) ctx.drawImage(miloImg, W / 2 - 385, 720, 770, 770)
  else drawMilo(ctx, W / 2, 1110, 4)

  ctx.fillStyle = INK
  ctx.font = `bold 92px ${font}`
  ctx.fillText(t(lang, 'cert.awardedTo'), W / 2, 1635)

  ctx.fillStyle = SKY
  fitText(ctx, childName, W / 2, 1845, 1660, 210, 118, font)

  ctx.strokeStyle = GOLD
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(480, 1930)
  ctx.lineTo(W - 480, 1930)
  ctx.stroke()

  ctx.fillStyle = INK
  drawWrappedText(ctx, t(lang, 'cert.for'), W / 2, 2110, 1580, 82, 106, font)

  for (let i = 0; i < 5; i++) drawStar(ctx, W / 2 + (i - 2) * 210, 2365, 86, '#f0b429')

  const badges = ['Clinic Explorer', 'Tool Expert', 'Brave Counter']
  badges.forEach((label, i) => drawBadge(ctx, 560 + i * 680, 2660, label, font))

  drawRosette(ctx, W / 2, 3020, font)

  ctx.fillStyle = INK
  ctx.font = `bold 66px ${font}`
  ctx.fillText(localizedDate, W / 2, 3300)

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startPx: number,
  minPx: number,
  font: string,
) {
  let size = startPx
  while (size > minPx) {
    ctx.font = `bold ${size}px ${font}`
    const width = ctx.measureText(text)?.width ?? 0
    if (!width || width <= maxWidth) break
    size -= 6
  }
  ctx.fillText(text, x, y)
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  font: string,
) {
  ctx.font = `bold ${size}px ${font}`
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    const width = ctx.measureText(next)?.width ?? 0
    if (width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.slice(0, 3).forEach((wrappedLine, i) => ctx.fillText(wrappedLine, x, startY + i * lineHeight))
}

function drawScallopBorder(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.fillStyle = 'rgba(126, 200, 242, 0.24)'
  for (let x = 170; x <= W - 170; x += 180) {
    ctx.beginPath()
    ctx.arc(x, 124, 38, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, H - 124, 38, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let y = 250; y <= H - 250; y += 180) {
    ctx.beginPath()
    ctx.arc(124, y, 38, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(W - 124, y, 38, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawRibbon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save()
  ctx.fillStyle = SKY
  roundRect(ctx, cx - 460, cy - 88, 920, 176, 88)
  ctx.fill()
  ctx.fillStyle = BUBBLEGUM
  ctx.beginPath()
  ctx.moveTo(cx - 410, cy + 56)
  ctx.lineTo(cx - 520, cy + 260)
  ctx.lineTo(cx - 325, cy + 188)
  ctx.lineTo(cx - 190, cy + 316)
  ctx.lineTo(cx - 120, cy + 82)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 410, cy + 56)
  ctx.lineTo(cx + 520, cy + 260)
  ctx.lineTo(cx + 325, cy + 188)
  ctx.lineTo(cx + 190, cy + 316)
  ctx.lineTo(cx + 120, cy + 82)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = "bold 82px 'Baloo 2'"
  ctx.fillText('DENTAL HERO', cx, cy + 30)
  ctx.restore()
}

function drawBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, font: string) {
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(58, 53, 96, 0.16)'
  ctx.lineWidth = 5
  roundRect(ctx, cx - 250, cy - 70, 500, 140, 70)
  ctx.fill()
  ctx.stroke()
  drawStar(ctx, cx - 175, cy, 42, MINT)
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.font = `bold 48px ${font}`
  ctx.fillText(label, cx - 110, cy + 17)
  ctx.textAlign = 'center'
  ctx.restore()
}

function drawRosette(ctx: CanvasRenderingContext2D, cx: number, cy: number, font: string) {
  ctx.save()
  ctx.fillStyle = SKY
  ctx.beginPath()
  ctx.arc(cx, cy, 150, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 58px ${font}`
  ctx.fillText('DENTAL', cx, cy - 22)
  ctx.fillText('HERO', cx, cy + 48)
  ctx.restore()
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

/** Loads an image with a timeout; resolves null on failure, including tests. */
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
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.ellipse(-24, 10, 9, 12, 0, 0, Math.PI * 2)
  ctx.ellipse(24, 10, 9, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = INK
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
