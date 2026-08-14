import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

export interface CameraRigProps {
  /** Where to look. Null rests at the stage's default framing. */
  focus?: [number, number, number] | null
  /** How far in to push when focused: 0 = no push, 1 = right up to it. */
  push?: number
  /** Bump this number to fire an impact shake. */
  impact?: number
  /** Honour prefers-reduced-motion: no drift, no shake, focus still works. */
  reduced?: boolean
  /**
   * The world-space box the camera must keep in view, in units. The rig backs
   * off far enough to fit it whichever way the screen is shaped — a portrait
   * phone is much narrower than it is tall, so a fixed distance that frames
   * nicely on a laptop crops both edges on a phone.
   */
  frame?: { width: number; height: number }
}

const HOME_HEIGHT = 1.35
const LOOK = new Vector3(0, 0.85, 0)
const DEFAULT_FRAME = { width: 3.4, height: 3.2 }

/** How far back the camera must sit to fit `frame` at this fov and aspect. */
export function distanceToFrame(frame: { width: number; height: number }, fovDeg: number, aspect: number) {
  const halfV = Math.tan((fovDeg * Math.PI) / 360)
  const forHeight = frame.height / 2 / halfV
  const forWidth = frame.width / 2 / (halfV * Math.max(aspect, 0.0001))
  // whichever constraint is tighter wins, so nothing is ever cropped
  return Math.max(forHeight, forWidth)
}

/** Idle drift, as a fraction of the camera's distance. The storyboard's 1.5%. */
const DRIFT = 0.015
/** Impact shake, in screen pixels — small enough to feel, not to read as a bug. */
const SHAKE_PX = 3
const SHAKE_MS = 320

/**
 * The camera. Three behaviours, in the order they override each other:
 *
 * - **Idle drift** — never perfectly still. A slow figure-of-eight at 1.5% of
 *   the camera's distance, which is below the threshold you can consciously
 *   see but above the one that makes a scene feel dead.
 * - **Push-in on focus** — tapping a thing moves the camera toward it rather
 *   than scaling the thing up, so the room stays a room.
 * - **Impact shake** — a couple of pixels, decaying fast, on the frame a tool
 *   actually lands. Sound and this are most of what sells an impact.
 */
export function CameraRig({
  focus = null,
  push = 0.35,
  impact = 0,
  reduced = false,
  frame = DEFAULT_FRAME,
}: CameraRigProps) {
  const { camera, size } = useThree()
  const shakeUntil = useRef(0)
  const target = useRef(new Vector3().copy(LOOK))
  const pos = useRef<Vector3 | null>(null)

  useEffect(() => {
    if (impact > 0) shakeUntil.current = performance.now() + SHAKE_MS
  }, [impact])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // clamp so a backgrounded tab doesn't teleport the camera on return
    const k = 1 - Math.pow(0.001, Math.min(delta, 0.1))

    const fov = 'fov' in camera ? (camera.fov as number) : 50
    const home = new Vector3(0, HOME_HEIGHT, distanceToFrame(frame, fov, size.width / size.height))
    // first frame: snap rather than sail in from wherever the camera started
    if (!pos.current) pos.current = home.clone()

    const wantLook = focus ? new Vector3(...focus) : LOOK
    const wantPos = focus
      ? new Vector3(...focus).lerp(home, 1 - push).setY(Math.max(home.y * (1 - push * 0.4), 0.6))
      : home

    pos.current.lerp(wantPos, k)
    target.current.lerp(wantLook, k)

    let x = pos.current.x
    let y = pos.current.y

    if (!reduced) {
      // a figure-of-eight, not a circle: the return path never retraces itself,
      // so it reads as breathing rather than as a loop
      const d = pos.current.distanceTo(target.current)
      x += Math.sin(t * 0.32) * d * DRIFT
      y += Math.sin(t * 0.51) * d * DRIFT * 0.6

      if (performance.now() < shakeUntil.current) {
        // px → world units at this distance, so the shake is the same size on
        // every screen regardless of viewport or field of view
        const worldPerPx = (2 * d * Math.tan((fov * Math.PI) / 360)) / size.height
        const left = (shakeUntil.current - performance.now()) / SHAKE_MS
        const amp = SHAKE_PX * worldPerPx * left * left
        x += (Math.random() - 0.5) * 2 * amp
        y += (Math.random() - 0.5) * 2 * amp
      }
    }

    camera.position.set(x, y, pos.current.z)
    camera.lookAt(target.current)
  })

  return null
}
