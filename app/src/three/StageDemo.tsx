import { useReducedMotion } from 'motion/react'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { LazyStage } from './StageLazy'
import { Chair } from './ClinicScene/Chair'
import { Hotspot } from './ClinicScene/Hotspot'
import { Model, PIVOT } from './Model'
import { audio } from '../lib/audio'
import { t } from '../lib/i18n'
import { GameButton } from '../components/ui/GameButton'
import { Pop } from '../components/motion/Pop'

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
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  const [explored, setExplored] = useState(false)
  const [stalled, setStalled] = useState(false)

  // the same nudge the 2D screen already gives: if nothing is touched for ten
  // seconds, one thing starts asking harder
  useEffect(() => {
    if (selected || explored) return
    const timer = setTimeout(() => setStalled(true), 10_000)
    return () => clearTimeout(timer)
  }, [selected, explored])
  // ?stage3d=chair drives the real chair; ?stage3d=/models/foo.glb inspects any
  // converted model, which is how each new export gets eyeballed before it is
  // wired into a scene
  const mode = new URLSearchParams(location.search).get('stage3d')
  const chair = mode === 'chair'
  const clinic = mode === 'clinic'
  const modelUrl = mode && mode.endsWith('.glb') ? mode : null

  return (
    <div
      className="fixed inset-0 bg-cover bg-center"
      // The PPTX room itself, behind the canvas. The 3D objects stand in front
      // of it; everything that never moves stays a picture.
      style={chair ? { backgroundImage: 'url(/art/clinic-room.webp)' } : undefined}
    >
      <LazyStage
        reduced={reduced}
        // tapping a thing moves the camera to it, rather than scaling the thing
        // up — the room stays a room
        // aim a little high: the sheet takes the lower third, so the object it
        // describes has to sit above it
        focus={selected ? [0, 0.95, 0] : focus}
        frame={clinic ? { width: 2.9, height: 2.6 } : undefined}
        impact={impact}
        warmth={warm ? 4200 : 6500}
        lightIntensity={warm ? 1.15 : 1}
      >
        {/* With a backdrop behind, the floor must catch the shadow without
            painting over the room — shadowMaterial draws the shadow and
            nothing else. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[6, 48]} />
          {chair ? (
            <shadowMaterial opacity={0.28} color="#3a3560" />
          ) : (
            <meshStandardMaterial color="#dceefb" roughness={0.95} />
          )}
        </mesh>
        {clinic ? (
          // the Meshy clinic as the scene itself, standing on the stage floor
          <Model url="/models/clinic-room.glb" height={2.2} pivot={PIVOT.base} />
        ) : modelUrl ? (
          <Model url={modelUrl} height={1.6} pivot={PIVOT.base} />
        ) : chair ? (
          <Hotspot invite={!explored} active={!!selected} done={explored} urgent={stalled}>
            <Chair
              height={1.2}
              highlight={selected || hovered ? 0.2 : 0}
              onHover={setHovered}
              onTap={() => {
                setSelected(true)
                setStalled(false)
                void audio.say('en', 'clinic.chair.desc')
              }}
            />
          </Hotspot>
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

      {/* React owns every word and every control, above the canvas — never
          inside it. The canvas draws the room; it never draws UI. */}
      {(chair || clinic) && !selected && (
        <div className="absolute top-6 inset-x-0 px-6 text-center pointer-events-none">
          <h1 className="text-3xl font-bold bg-gradient-to-b from-sky-deep to-grape bg-clip-text text-transparent">
            {t('en', 'clinic.title')}
          </h1>
          <p className="text-ink/70 font-bold mt-1">{t('en', 'clinic.intro', { name: 'Omar' })}</p>
        </div>
      )}

      {/* A sheet on the floor of the screen, not a cover over it. The camera has
          just travelled to this object; hiding it behind a full-screen scrim
          would throw away the only reason to move the camera at all. */}
      {chair && selected && (
        <div className="absolute inset-x-0 bottom-0 z-40 p-4">
          <Pop className="bg-white/95 backdrop-blur rounded-3xl p-5 flex flex-col items-center gap-3 w-full max-w-sm mx-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-center">{t('en', 'clinic.chair.name')}</h2>
            <p
              className="text-lg text-center text-ink/70 font-bold"
              onClick={() => void audio.replayLast()}
            >
              {t('en', 'clinic.chair.desc')}
            </p>
            <GameButton
              label={t('en', 'ui.next')}
              onPress={() => {
                setSelected(false)
                setExplored(true)
              }}
            />
          </Pop>
        </div>
      )}

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
