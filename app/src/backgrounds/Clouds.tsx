import { Floating } from '../components/motion/Floating'

/**
 * Clouds at three depths — nearer ones bigger, faster and sharper, far ones
 * small, slow and blurred. That parallax is what stops the sky reading as a
 * flat backdrop.
 *
 * All three sit below the caption band on purpose: the top of the panel
 * belongs to the HUD and the screen title, and a cloud drifting behind the
 * words reads as a smudge rather than as weather.
 */
export function Clouds() {
  return (
    <>
      <Floating duration={9} amplitude={7} className="absolute top-[22%] start-[3%] opacity-90">
        <Cloud w={120} />
      </Floating>
      <Floating duration={12} amplitude={10} className="absolute top-[38%] end-[5%] opacity-60 blur-[1px]">
        <Cloud w={90} />
      </Floating>
      <Floating duration={15} amplitude={6} className="absolute top-[55%] start-[10%] opacity-35 blur-[2px]">
        <Cloud w={64} />
      </Floating>
    </>
  )
}

export function Cloud({ w }: { w: number }) {
  return (
    <svg width={w} viewBox="0 0 110 60">
      <ellipse cx="35" cy="40" rx="30" ry="18" fill="white" />
      <ellipse cx="65" cy="32" rx="26" ry="20" fill="white" />
      <ellipse cx="88" cy="44" rx="20" ry="14" fill="white" />
    </svg>
  )
}
