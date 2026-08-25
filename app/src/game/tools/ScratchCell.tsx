import { useEffect, useRef, useState } from 'react'

/**
 * One cell of the tools board, covered until a child scratches it open.
 *
 * The cover is a canvas. Dragging a finger across it erases, a tap punches a
 * generous hole, and once enough has come away the whole thing fades and the
 * instrument underneath is revealed. Both gestures work on purpose: scratching
 * is the game, but a child who only ever taps must still get through — this
 * product has no fail states and no dead ends.
 *
 * Nothing here draws the instrument. The board art sits behind, already whole;
 * this only takes the cover off it.
 */
/**
 * Nine covers, so the board is not the same square repeated. Each is a pastel
 * foil with its own two-tone sheen and its own speckle, and a cell always wears
 * the same one — a child who comes back to a half-finished board should find it
 * the way they left it.
 */
const FOILS = [
  { from: '#bfe6dd', mid: '#a8dcd2', to: '#9ed3c8', fleck: '#ffffff' },
  { from: '#cfe4f7', mid: '#b3d3f0', to: '#a2c8ea', fleck: '#ffffff' },
  { from: '#e2dcf3', mid: '#cec5e8', to: '#c0b5e2', fleck: '#fdfcff' },
  { from: '#fbe2cf', mid: '#f6cfb2', to: '#f0c19f', fleck: '#fffaf4' },
  { from: '#fbeec4', mid: '#f6e3a4', to: '#f0d98d', fleck: '#fffdf0' },
  { from: '#fadbe2', mid: '#f4c3ce', to: '#eeb3c1', fleck: '#fff8fa' },
  { from: '#cfeee8', mid: '#b2e0d7', to: '#a0d6cb', fleck: '#f5fffd' },
  { from: '#d8dcf5', mid: '#c0c6ec', to: '#b0b7e6', fleck: '#fbfcff' },
  { from: '#dcecd2', mid: '#c4dfb5', to: '#b4d5a2', fleck: '#f8fff2' },
] as const

export function ScratchCell({
  testid,
  label,
  onRevealed,
  style,
  variant = 0,
  disabled = false,
}: {
  testid: string
  label: string
  onRevealed: () => void
  /** Where the cell sits on its board. The mechanic knows nothing else about it. */
  style: React.CSSProperties
  /** Which foil this cell wears. Stable per cell. */
  variant?: number
  disabled?: boolean
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const done = useRef(false)
  const strokes = useRef(0)
  const taps = useRef(0)
  const [revealed, setRevealed] = useState(false)

  /**
   * Share of the cover that has to come away before it gives up. High on
   * purpose: the point is to scratch the whole cell clear, not to nick a corner
   * and have the prize fall out.
   */
  const THRESHOLD = 0.7

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const w = host.clientWidth
    const h = host.clientHeight
    if (!w || !h) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)

    // jsdom has no 2D context. Without one the cell simply opens on a tap,
    // which is what the tests drive and what a child gets as a fallback.
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctxRef.current = ctx
    ctx.scale(dpr, dpr)

    // The cover: a pastel foil with a sheen, so it reads as something to rub
    // away rather than as a missing image. Angle and speckle shift with the
    // variant so nine of them do not look like one tiled square.
    const foil = FOILS[variant % FOILS.length]
    const tilt = variant % 3
    const grad = ctx.createLinearGradient(
      tilt === 1 ? w : 0,
      0,
      tilt === 1 ? 0 : w,
      tilt === 2 ? 0 : h,
    )
    grad.addColorStop(0, foil.from)
    grad.addColorStop(0.45, foil.mid)
    grad.addColorStop(0.55, foil.from)
    grad.addColorStop(1, foil.to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Speckle, so there is visible texture coming away under the finger. The
    // step numbers are coprime with the cell size, which keeps the scatter from
    // falling into rows.
    ctx.fillStyle = foil.fleck
    ctx.globalAlpha = 0.55
    const stepX = 37 + variant * 6
    const stepY = 61 + variant * 4
    for (let i = 0; i < 30 + variant; i++) {
      const x = ((i * stepX) % Math.round(w - 6)) + 3
      const y = ((i * stepY) % Math.round(h - 6)) + 3
      ctx.beginPath()
      ctx.arc(x, y, 1.6 + ((i + variant) % 3) * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }, [variant])

  const erase = (x: number, y: number) => {
    const ctx = ctxRef.current
    const host = hostRef.current
    if (!ctx || !host) return
    // Wide enough that clearing seven tenths of a cell stays a game rather than
    // a chore for a four-year-old's finger.
    const r = Math.max(13, Math.min(host.clientWidth, host.clientHeight) * 0.28)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = r * 2
    if (last.current) {
      ctx.beginPath()
      ctx.moveTo(last.current.x, last.current.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    last.current = { x, y }
  }

  /** How much has come away. Sampled coarsely — this runs mid-drag. */
  const clearedShare = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return 0
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let clear = 0
    let seen = 0
    // every 7th pixel in each direction is plenty to tell half from not-half
    const step = 7 * 4
    for (let i = 3; i < data.length; i += step) {
      seen++
      if (data[i] < 40) clear++
    }
    return seen ? clear / seen : 0
  }

  const finish = () => {
    if (done.current) return
    done.current = true
    setRevealed(true)
    onRevealed()
  }

  const check = () => {
    if (done.current) return
    if (clearedShare() >= THRESHOLD) finish()
  }

  const point = (e: React.PointerEvent) => {
    const host = hostRef.current
    if (!host) return null
    const r = host.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDown = (e: React.PointerEvent) => {
    if (disabled || done.current) return
    moved.current = false
    last.current = null
    const p = point(e)
    if (p) erase(p.x, p.y)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onMove = (e: React.PointerEvent) => {
    if (disabled || done.current || e.buttons === 0) return
    const p = point(e)
    if (!p) return
    moved.current = true
    erase(p.x, p.y)
    if (++strokes.current % 6 === 0) check()
  }

  const onUp = (e: React.PointerEvent) => {
    if (disabled || done.current) return
    last.current = null
    // A tap, not a drag.
    //
    // A press takes a bite out of the cover; it cannot take the cover off. The
    // game asks the child to scratch, so pressing a cell four times must not be
    // a way past that — it looks like the mechanic working when it is the
    // mechanic being sidestepped, and the child never does the thing the screen
    // is for.
    //
    // The bite still grows a little, and it still has to: a fixed one is
    // idempotent, so a child pressing the same spot over and over would sit at
    // the same coverage forever, and this game has no dead ends. Capped where
    // a circle cannot reach seven tenths of a cell on its own — presses spread
    // around the cell will still get there, one press in one place never will,
    // and dragging remains far and away the quickest way to do it.
    if (!moved.current) {
      const host = hostRef.current
      const p = point(e)
      const ctx = ctxRef.current
      if (!ctx || !host) {
        finish()
        return
      }
      if (p) {
        taps.current++
        const reach = Math.min(host.clientWidth, host.clientHeight)
        const r = reach * Math.min(0.2 + taps.current * 0.03, 0.5)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    check()
  }

  return (
    <div
      ref={hostRef}
      data-testid={testid}
      role="button"
      aria-label={label}
      aria-disabled={disabled || done.current}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        last.current = null
      }}
      onKeyDown={e => {
        if (disabled || done.current) return
        if (e.key === 'Enter' || e.key === ' ') finish()
      }}
      className="absolute touch-none select-none"
      style={{ ...style, cursor: revealed || disabled ? 'default' : 'pointer' }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        data-testid={`${testid}-cover`}
        className="w-full h-full rounded-[14%] transition-opacity duration-500"
        style={{ opacity: revealed ? 0 : 1, pointerEvents: 'none' }}
      />
    </div>
  )
}
