// Lifting a generated render off its background.
//
// Every prompt in art-prompts/ asks for a plain flat background rather than a
// transparent one, because image models do not produce a clean alpha channel
// and a bad one is worse than none. The cut happens here instead, and both the
// visit walkthrough and the clinic instruments use it.

/** Anything this light, reached from the border, is background. */
export const BG_LUMA = 200

/**
 * How far one background pixel may drift from the neighbour it spread from,
 * summed over the three channels.
 *
 * This is the number that decides whether the cut works. A vignette, a warm
 * glow or a soft drop shadow changes by one or two levels per pixel, so a tight
 * budget still walks the whole gradient into the corners; an anti-aliased
 * outline changes by thirty or more in a single step, so the same budget stops
 * dead at it. Set it loose and the flood strolls through a boy's outline and
 * eats his face, because skin is lighter than any luma floor worth having.
 */
export const STEP_TOLERANCE = 12

export const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/**
 * Flood the background in from every border pixel.
 *
 * Compared against the neighbour it spread from rather than one fixed colour,
 * so a gradient stays background all the way into the corners.
 */
/**
 * A render's own drop shadow is the awkward case.
 *
 * Raise the luma floor high enough to protect a cream instrument and the flood
 * stops at the shadow, leaving a hard white ellipse stuck under it — invisible
 * on the white it was drawn on, glaring the moment it is stood on a coloured
 * floor. Lower the floor to catch the shadow and it eats the instrument, which
 * is no darker.
 *
 * Brightness cannot separate them, so colour does: a shadow is neutral grey and
 * cream is warm. Anything this close to grey, and this light, is shadow.
 */
export const SOFT_LUMA = 206
export const MAX_NEUTRAL_CHROMA = 12

export function cutOut(
  data,
  w,
  h,
  { bgLuma = BG_LUMA, stepTolerance = STEP_TOLERANCE, softLuma = null, maxChroma = MAX_NEUTRAL_CHROMA } = {},
) {
  const alpha = new Uint8Array(w * h).fill(255)
  const seen = new Uint8Array(w * h)
  const stack = []

  const push = (x, y, from) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const i = y * w + x
    if (seen[i]) return
    const p = i * 3
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
    const l = luma(r, g, b)
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) <= maxChroma
    const isBg = l >= bgLuma || (softLuma !== null && l >= softLuma && neutral)
    if (!isBg) return
    if (from && Math.abs(r - from[0]) + Math.abs(g - from[1]) + Math.abs(b - from[2]) > stepTolerance) return
    seen[i] = 1
    alpha[i] = 0
    stack.push([x, y, [r, g, b]])
  }

  for (let x = 0; x < w; x++) {
    push(x, 0, null)
    push(x, h - 1, null)
  }
  for (let y = 0; y < h; y++) {
    push(0, y, null)
    push(w - 1, y, null)
  }

  while (stack.length) {
    const [x, y, c] = stack.pop()
    push(x + 1, y, c)
    push(x - 1, y, c)
    push(x, y + 1, c)
    push(x, y - 1, c)
  }
  return alpha
}

/**
 * Eat the outline back, then ramp the alpha out over the next couple of pixels.
 *
 * Stopping the flood tight enough to save the subject leaves the pale
 * anti-aliased rim of the original background still attached to it — against
 * white you never see it, but stood on a mint-and-cream room it reads as a
 * cheap sticker cut. So the first ring inside the cut is dropped outright and
 * the two behind it are ramped.
 */
export function trimEdge(alpha, w, h) {
  const dist = new Uint8Array(w * h).fill(255)
  const queue = []
  for (let i = 0; i < w * h; i++) {
    if (alpha[i] === 0) {
      dist[i] = 0
      queue.push(i)
    }
  }
  const RAMP = [0, 0, 90, 190]
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
  for (let i = 0; i < w * h; i++) out[i] = dist[i] < RAMP.length ? RAMP[dist[i]] : 255
  return out
}

/** Read a file, cut its background away, and hand back raw RGBA. */
export async function cutToRgba(sharp, file, opts) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const alpha = trimEdge(cutOut(data, w, h, opts), w, h)
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3]
    rgba[i * 4 + 1] = data[i * 3 + 1]
    rgba[i * 4 + 2] = data[i * 3 + 2]
    rgba[i * 4 + 3] = alpha[i]
  }
  return { rgba, width: w, height: h, alpha, data }
}
