import type { FC } from 'react'
import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import { toolPalette as P } from './palette'
import { Sparkle } from '../Sparkle'

export type ToolId = 'mirror' | 'explorer' | 'suction' | 'syringe' | 'brush' | 'xray' | 'ring' | 'umbrella' | 'spray'

interface ToolSvgProps {
  demo?: boolean
}

/**
 * Every tool is the owner's custom clay-render art (generated to match the
 * spec board's style) wrapped in its own Motion demo animation, with SVG
 * particle overlays (sparkles, drops, mist) on top.
 */
function ToolArt({
  id,
  demo,
  demoAnim,
  demoTransition,
  children,
}: {
  id: ToolId
  demo?: boolean
  demoAnim?: TargetAndTransition
  demoTransition?: Transition
  children?: React.ReactNode
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.img
        src={`/art/tool-${id}.webp`}
        alt=""
        draggable={false}
        className="w-[82%] h-[82%] object-contain drop-shadow-md select-none"
        animate={demo && demoAnim ? demoAnim : {}}
        transition={demo && demoTransition ? demoTransition : {}}
      />
      {demo && children && (
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full pointer-events-none">
          {children}
        </svg>
      )}
    </div>
  )
}

const MirrorArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="mirror" demo={demo} demoAnim={{ rotate: [0, -8, 8, 0] }} demoTransition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
    <Sparkle x={30} y={26} />
    <Sparkle x={92} y={40} delay={0.6} size={5} />
  </ToolArt>
)

const ExplorerArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="explorer" demo={demo} demoAnim={{ y: [0, 6, 0, 6, 0] }} demoTransition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
    <Sparkle x={88} y={88} size={5} />
  </ToolArt>
)

const SuctionArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="suction" demo={demo} demoAnim={{ y: [0, -4, 0] }} demoTransition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
    {[0, 0.4, 0.8].map(d => (
      <motion.circle key={d} r="4" fill={P.accent} initial={{ cx: 62, cy: 6, opacity: 0 }} animate={{ cy: [6, 18, 26], opacity: [0, 1, 0] }} transition={{ duration: 1.3, repeat: Infinity, delay: d }} />
    ))}
  </ToolArt>
)

const SyringeArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="syringe" demo={demo} demoAnim={{ rotate: [0, -6, 4, 0] }} demoTransition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
    {[0, 0.3, 0.6].map((d, i) => (
      <motion.circle key={d} r="3.4" fill={P.accent} initial={{ cx: 96, cy: 22, opacity: 0 }} animate={{ cx: [96, 104 + i * 4], cy: [22, 10 + i * 6], opacity: [0, 0.85, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: d }} />
    ))}
    <Sparkle x={22} y={96} delay={0.4} size={5} />
  </ToolArt>
)

const BrushArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="brush" demo={demo} demoAnim={{ rotate: [-10, 10, -10], x: [-3, 3, -3] }} demoTransition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}>
    <Sparkle x={30} y={24} />
    <Sparkle x={94} y={80} delay={0.5} />
  </ToolArt>
)

const XrayArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="xray" demo={demo} demoAnim={{ scale: [1, 1.04, 1] }} demoTransition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
    {/* soft ring pulse — deliberately NO flash */}
    <motion.circle cx="60" cy="60" r="34" fill="none" stroke={P.sparkle} strokeWidth="3" animate={{ scale: [1, 1.3], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} style={{ originX: '60px', originY: '60px' }} />
  </ToolArt>
)

const RingArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="ring" demo={demo} demoAnim={{ scale: [1.06, 0.97, 1.06] }} demoTransition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
    <Sparkle x={60} y={16} size={6} />
    <Sparkle x={24} y={70} delay={0.6} size={4} />
  </ToolArt>
)

const UmbrellaArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="umbrella" demo={demo} demoAnim={{ rotate: [-4, 4, -4] }} demoTransition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
    {[28, 60, 92].map((x, i) => (
      <motion.circle key={x} r="3.5" fill={P.accent} initial={{ cx: x, cy: 4, opacity: 0 }} animate={{ cy: [4, 26, 20], cx: [x, x, x + (x < 60 ? -12 : 12)], opacity: [0, 1, 0] }} transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.35 }} />
    ))}
  </ToolArt>
)

const SprayArt: FC<ToolSvgProps> = ({ demo }) => (
  <ToolArt id="spray" demo={demo} demoAnim={{ rotate: [0, -5, 0] }} demoTransition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
    <Sparkle x={88} y={24} size={5} />
    <Sparkle x={100} y={44} delay={0.4} size={6} />
    <Sparkle x={84} y={62} delay={0.8} size={4} />
  </ToolArt>
)

export const TOOLS: Record<ToolId, { Svg: FC<ToolSvgProps> }> = {
  mirror: { Svg: MirrorArt },
  explorer: { Svg: ExplorerArt },
  suction: { Svg: SuctionArt },
  syringe: { Svg: SyringeArt },
  brush: { Svg: BrushArt },
  xray: { Svg: XrayArt },
  ring: { Svg: RingArt },
  umbrella: { Svg: UmbrellaArt },
  spray: { Svg: SprayArt },
}
