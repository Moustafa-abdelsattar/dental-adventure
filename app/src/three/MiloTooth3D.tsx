import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { audio } from '../lib/audio'

/**
 * Interactive 3D Milo — the welcome-screen hero moment.
 * Drag to spin him, tap to hear the last line again.
 * Built from primitives (no model files) so the chunk stays small
 * and cheap enough for low-end phones.
 */
function ToothBody({ spinY }: { spinY: React.RefObject<number> }) {
  const group = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.position.y = Math.sin(t * 0.9) * 0.09
    // ease toward the dragged angle, with a slow idle turn on top
    const idle = Math.sin(t * 0.35) * 0.25
    group.current.rotation.y += (spinY.current + idle - group.current.rotation.y) * 0.08
    group.current.rotation.z = Math.sin(t * 0.7) * 0.03
  })
  return (
    <group ref={group}>
      {/* crown */}
      <mesh scale={[1.05, 1.08, 0.92]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
      {/* root legs */}
      <mesh position={[-0.42, -1.05, 0]} rotation={[0, 0, 0.16]}>
        <coneGeometry args={[0.34, 0.9, 32]} />
        <meshStandardMaterial color="#f4f7fd" roughness={0.4} />
      </mesh>
      <mesh position={[0.42, -1.05, 0]} rotation={[0, 0, -0.16]}>
        <coneGeometry args={[0.34, 0.9, 32]} />
        <meshStandardMaterial color="#f4f7fd" roughness={0.4} />
      </mesh>
      {/* cape scarf */}
      <mesh position={[0, -0.55, 0]} rotation={[0.15, 0, 0]} scale={[1, 0.5, 0.95]}>
        <torusGeometry args={[0.92, 0.16, 20, 48]} />
        <meshStandardMaterial color="#3b7fc4" roughness={0.5} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.34, 0.22, 0.85]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial color="#3a3560" roughness={0.2} />
      </mesh>
      <mesh position={[0.34, 0.22, 0.85]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial color="#3a3560" roughness={0.2} />
      </mesh>
      <mesh position={[-0.3, 0.27, 0.94]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.38, 0.27, 0.94]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* cheeks */}
      <mesh position={[-0.62, -0.05, 0.72]} scale={[1, 1, 0.4]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#f9a8c5" roughness={0.6} />
      </mesh>
      <mesh position={[0.62, -0.05, 0.72]} scale={[1, 1, 0.4]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#f9a8c5" roughness={0.6} />
      </mesh>
      {/* smile — proud of the crown surface so it always shows */}
      <mesh position={[0, -0.1, 0.93]} rotation={[0.35, 0, Math.PI + Math.PI * 0.075]}>
        <torusGeometry args={[0.26, 0.055, 16, 40, Math.PI * 0.85]} />
        <meshStandardMaterial color="#3a3560" roughness={0.3} />
      </mesh>
    </group>
  )
}

export default function MiloTooth3D({ size = 230 }: { size?: number }) {
  const spinY = useRef(0)
  const dragging = useRef<{ x: number; base: number } | null>(null)
  const [hint, setHint] = useState(true)

  return (
    <div
      style={{ width: size, height: size * 1.15, touchAction: 'pan-y' }}
      data-testid="milo-3d"
      onPointerDown={e => {
        dragging.current = { x: e.clientX, base: spinY.current }
        setHint(false)
      }}
      onPointerMove={e => {
        if (dragging.current) spinY.current = dragging.current.base + (e.clientX - dragging.current.x) * 0.02
      }}
      onPointerUp={e => {
        if (dragging.current && Math.abs(e.clientX - dragging.current.x) < 6) void audio.replayLast()
        dragging.current = null
      }}
      onPointerLeave={() => {
        dragging.current = null
      }}
    >
      <Canvas camera={{ position: [0, 0, 4.2], fov: 40 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-3, -1, 2]} intensity={0.35} color="#7ec8f2" />
        <ToothBody spinY={spinY} />
      </Canvas>
      {hint && (
        <div className="text-center text-ink/40 font-bold text-sm -mt-2 select-none" aria-hidden>
          ⟲ ⟳
        </div>
      )}
    </div>
  )
}
