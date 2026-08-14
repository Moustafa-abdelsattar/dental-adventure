import { Canvas } from '@react-three/fiber'
import { ContactShadows, Preload } from '@react-three/drei'
import { Suspense, type ReactNode } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { CameraRig, type CameraRigProps } from './CameraRig'
import { Lighting } from './Lighting'

/**
 * The shared 3D stage. One canvas for the whole game — mounting a second one
 * would double the WebGL context, the lighting and the draw calls, and low-end
 * Android cannot afford any of that.
 *
 * Per the responsibility split the plan makes non-negotiable: this owns world,
 * models, lighting, camera and particles. Buttons, text, audio, menus and
 * progress stay in React, above the canvas. **No UI goes inside here.**
 *
 * Budget it is built to: draw calls under 60, triangles under 120k, device
 * pixel ratio capped at 2, exactly one shadow-casting light. Post-processing is
 * deliberately absent — it is the first thing to cut and the least essential.
 */
export function Stage({
  children,
  warmth,
  lightIntensity,
  shadow = true,
  ...rig
}: CameraRigProps & {
  children?: ReactNode
  /** Colour temperature in kelvin. 6500 daylight, 4200 lamp-on warm. */
  warmth?: number
  lightIntensity?: number
  /** Contact shadows off is the first thing to try on a struggling device. */
  shadow?: boolean
}) {
  return (
    <Canvas
      // capped at 2: beyond that a phone burns fill rate for pixels nobody sees
      dpr={[1, 2]}
      // percentage-closest-filtering: the soft variant is deprecated and falls
      // back to this anyway, so ask for it by name and skip the warning
      shadows="percentage"
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
      // the rig owns position from here — it has to solve for aspect first
      camera={{ fov: 42, near: 0.1, far: 60, position: [0, 1.35, 8] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Lighting warmth={warmth} intensity={lightIntensity} />
      <CameraRig {...rig} />

      <Suspense fallback={null}>
        {children}
        {/* low resolution on purpose — a soft blob under the subject reads as
            contact, and nobody looks at the shadow's detail */}
        {shadow && (
          <ContactShadows
            // a hair above the floor, never level with it: coplanar surfaces
            // z-fight, and it shows up as stripes through the shadow
            position={[0, 0.006, 0]}
            scale={9}
            resolution={256}
            blur={2.6}
            opacity={0.42}
            far={3}
            color="#3a3560"
          />
        )}
        {/* compile everything off-screen before the first visible frame, so the
            scene never pops in shader by shader */}
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
