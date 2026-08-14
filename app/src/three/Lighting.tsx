/**
 * The lighting rig, sized to the mobile budget: exactly one shadow-casting
 * light, everything else free.
 *
 * `warmth` is a colour temperature in kelvin. Daylight sits around 6500K; the
 * clinic lamp coming on drops the room to about 4200K, which is the warm,
 * settled feeling the storyboard asks for. Animating this value is how the
 * light "switches on" without a flash.
 */
export function Lighting({ warmth = 6500, intensity = 1 }: { warmth?: number; intensity?: number }) {
  const tint = kelvinToRgb(warmth)
  return (
    <>
      {/* the one real light: keeps the shadow map small and the draw calls low */}
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.15 * intensity}
        color={tint}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      >
        {/* a tight frustum: shadow resolution is spent on the subject, not the room */}
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 20]} />
      </directionalLight>

      {/* warm bounce from the floor, cool from the sky — free, and it stops the
          shadow side going flat grey */}
      <hemisphereLight args={['#eaf6ff', '#ffe9c2', 0.85 * intensity]} />
      <ambientLight intensity={0.25 * intensity} color={tint} />
    </>
  )
}

/**
 * Approximate a colour temperature as a hex tint. Good enough for a stylised
 * scene and far cheaper than a physical light model. Returned as a string
 * rather than a triple so it drops straight into any three colour prop.
 */
export function kelvinToRgb(kelvin: number): string {
  const t = Math.min(Math.max(kelvin, 1500), 12000) / 100
  const byte = (v: number) =>
    Math.round(Math.min(Math.max(v, 0), 255))
      .toString(16)
      .padStart(2, '0')

  const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332)
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755)
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04

  return `#${byte(r)}${byte(g)}${byte(b)}`
}
