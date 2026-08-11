import { Floating } from '../motion/Floating'

/** Soft decorative sky: clouds, drifting stars, and a wave at the bottom. */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky/35 via-cream to-cream" />
      <Floating duration={7} className="absolute top-[8%] start-[6%] opacity-70">
        <Cloud w={110} />
      </Floating>
      <Floating duration={9} amplitude={9} className="absolute top-[16%] end-[8%] opacity-60">
        <Cloud w={80} />
      </Floating>
      <Floating duration={6} className="absolute top-[30%] start-[14%] text-sunny text-xl opacity-80">
        ✦
      </Floating>
      <Floating duration={8} amplitude={10} className="absolute top-[24%] end-[24%] text-sunny text-sm opacity-70">
        ✨
      </Floating>
      <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 375 90" preserveAspectRatio="none">
        <path d="M0 45 Q60 15 130 40 T260 38 T375 30 L375 90 L0 90 Z" fill="#7ec8f2" opacity="0.25" />
        <path d="M0 62 Q80 38 170 58 T375 52 L375 90 L0 90 Z" fill="#7ec8f2" opacity="0.35" />
      </svg>
    </div>
  )
}

function Cloud({ w }: { w: number }) {
  return (
    <svg width={w} viewBox="0 0 110 60">
      <ellipse cx="35" cy="40" rx="30" ry="18" fill="white" />
      <ellipse cx="65" cy="32" rx="26" ry="20" fill="white" />
      <ellipse cx="88" cy="44" rx="20" ry="14" fill="white" />
    </svg>
  )
}
