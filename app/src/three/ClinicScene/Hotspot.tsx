import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { DoubleSide, type Mesh } from 'three'

/**
 * The ring of light on the floor that says "this one, touch this one".
 *
 * A four-year-old cannot read the caption telling them to tap, so the object
 * has to invite the tap by itself. The ring breathes while the thing is
 * waiting, swells and steadies once it has been touched, and disappears once
 * the child has finished with it — the room gradually goes quiet as they work
 * through it, which is its own progress indicator.
 *
 * Deliberately a ring on the ground rather than an outline around the object:
 * outlines need a post-processing pass, which the performance budget names as
 * the first thing to cut.
 */
export function Hotspot({
  invite = true,
  active = false,
  done = false,
  radius = 0.62,
  urgent = false,
  children,
}: {
  /** Waiting to be found. */
  invite?: boolean
  /** Currently the one being looked at. */
  active?: boolean
  /** Already explored — the ring retires. */
  done?: boolean
  radius?: number
  /** The child has stalled; pulse harder. */
  urgent?: boolean
  children?: ReactNode
}) {
  const ring = useRef<Mesh>(null)

  useFrame(state => {
    const m = ring.current
    if (!m) return
    const t = state.clock.elapsedTime

    if (done) {
      m.visible = false
      return
    }
    m.visible = true

    if (active) {
      // steady and open once selected — the pulse would compete with the
      // panel the child is now reading
      m.scale.setScalar(1.16)
      ;(m.material as { opacity: number }).opacity = 0.5
      return
    }

    const speed = urgent ? 3.6 : 1.6
    const wave = (Math.sin(t * speed) + 1) / 2
    m.scale.setScalar(1 + wave * (urgent ? 0.2 : 0.11))
    ;(m.material as { opacity: number }).opacity = invite ? 0.22 + wave * (urgent ? 0.45 : 0.28) : 0
  })

  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[radius * 0.78, radius, 48]} />
        <meshBasicMaterial color="#ffd45e" transparent opacity={0.3} side={DoubleSide} depthWrite={false} />
      </mesh>
      {children}
    </group>
  )
}
