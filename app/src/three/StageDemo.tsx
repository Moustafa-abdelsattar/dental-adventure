import { useReducedMotion } from 'motion/react'
import { useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import { LazyStage } from './StageLazy'
import { Chair } from './ClinicScene/Chair'

/**
 * Publishes the renderer's own counters so the harness can check them against
 * the mobile budget: draw calls under 60, triangles under 120k. Demo-only —
 * it never ships inside the game.
 */
function StageStats() {
  const { gl, camera, scene, raycaster, size } = useThree()

  // demo-only probe: raycast from screen coords and report what was hit, so a
  // "tap does nothing" can be diagnosed without guessing
  ;(window as unknown as { __hit?: unknown }).__hit = (px: number, py: number) => {
    raycaster.setFromCamera(
      { x: (px / size.width) * 2 - 1, y: -(py / size.height) * 2 + 1 } as never,
      camera,
    )
    return raycaster.intersectObjects(scene.children, true).map(i => ({
      name: i.object.name || i.object.type,
      parents: (() => {
        const chain: string[] = []
        let o = i.object.parent
        while (o) {
          chain.push(o.name || o.type)
          o = o.parent
        }
        return chain.join(' < ')
      })(),
      distance: +i.distance.toFixed(2),
    }))
  }

  useFrame(() => {
    const chairPivot = scene.getObjectByName('chair-pivot')
    ;(window as unknown as { __stageStats?: unknown }).__stageStats = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      programs: gl.info.programs?.length ?? 0,
      dpr: gl.getPixelRatio(),
      // the camera itself, so "does it drift" can be answered without trying
      // to read pixels back out of a WebGL buffer that has already been cleared
      cam: [camera.position.x, camera.position.y, camera.position.z],
      chairDeg: chairPivot ? (chairPivot.rotation.z * 180) / Math.PI : null,
    }
  })
  return null
}

/**
 * A harness for the empty stage, reachable at `?stage3d=1`.
 *
 * It exists to prove the Phase 5 gate — that the lighting, the contact shadow
 * and the camera's idle drift make an empty stage feel alive before a single
 * model exists — and to give the scenes built on top of it somewhere to check
 * framing and light against. The primitives here are stand-ins, not art; the
 * real scenes replace them.
 */
export function StageDemo() {
  const reduced = useReducedMotion() ?? false
  const [focus, setFocus] = useState<[number, number, number] | null>(null)
  const [impact, setImpact] = useState(0)
  const [warm, setWarm] = useState(false)
  // ?stage3d=chair swaps the stand-ins for the real converted model
  const chair = new URLSearchParams(location.search).get('stage3d') === 'chair'

  return (
    <div className="fixed inset-0">
      <LazyStage
        reduced={reduced}
        focus={focus}
        impact={impact}
        warmth={warm ? 4200 : 6500}
        lightIntensity={warm ? 1.15 : 1}
      >
        {/* the ground the shadow lands on */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[6, 48]} />
          <meshStandardMaterial color="#dceefb" roughness={0.95} />
        </mesh>
        {chair ? (
          <Chair height={1.2} />
        ) : (
          <>
            {/* stand-ins, so there is something for the light to model */}
            <mesh position={[-0.9, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, 1, 0.9]} />
              <meshStandardMaterial color="#7ec8f2" roughness={0.55} />
            </mesh>
            <mesh position={[0.75, 0.42, 0.5]} castShadow receiveShadow>
              <sphereGeometry args={[0.42, 32, 24]} />
              <meshStandardMaterial color="#f97ba9" roughness={0.4} />
            </mesh>
          </>
        )}
        <StageStats />
      </LazyStage>

      {/* React owns every control, above the canvas — never inside it */}
      <div className="absolute bottom-6 inset-x-0 flex flex-wrap justify-center gap-2 px-4">
        <button
          data-testid="stage-focus"
          onClick={() => setFocus(f => (f ? null : [-0.9, 0.6, 0]))}
          className="min-h-11 px-4 rounded-full bg-white/90 font-bold shadow"
        >
          {focus ? 'Pull back' : 'Push in'}
        </button>
        <button
          data-testid="stage-impact"
          onClick={() => setImpact(i => i + 1)}
          className="min-h-11 px-4 rounded-full bg-white/90 font-bold shadow"
        >
          Impact
        </button>
        <button
          data-testid="stage-warm"
          onClick={() => setWarm(w => !w)}
          className="min-h-11 px-4 rounded-full bg-white/90 font-bold shadow"
        >
          {warm ? '4200K lamp' : '6500K day'}
        </button>
      </div>
    </div>
  )
}
