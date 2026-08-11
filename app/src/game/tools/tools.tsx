import type { FC } from 'react'
import { motion } from 'motion/react'
import { toolPalette as P, TOOL_STROKE as SW } from './palette'
import { ToolFace } from './ToolFace'
import { Sparkle } from '../Sparkle'

export type ToolId = 'mirror' | 'explorer' | 'suction' | 'syringe' | 'brush' | 'xray' | 'ring' | 'umbrella' | 'spray'

interface ToolSvgProps {
  demo?: boolean
}

/** Small tooth receiving care (used by ring/umbrella/spray). Simple dot eyes — the ToolFace lives on the tool itself. */
function MiniTooth({ x, y, s = 1, sleepy = false }: { x: number; y: number; s?: number; sleepy?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 -14 C11 -14 16 -7 15 3 C14 11 12 15 9 19 C7 22 4 22 4 18 C4 14 2 13 0 13 C-2 13 -4 14 -4 18 C-4 22 -7 22 -9 19 C-12 15 -14 11 -15 3 C-16 -7 -11 -14 0 -14 Z"
        fill="#ffffff"
        stroke={P.metal}
        strokeWidth="2.5"
      />
      {sleepy ? (
        <>
          <path d="M-7 -2 q2.5 3 5 0" stroke={P.outline} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M2 -2 q2.5 3 5 0" stroke={P.outline} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="-4.5" cy="-2" r="1.8" fill={P.outline} />
          <circle cx="4.5" cy="-2" r="1.8" fill={P.outline} />
        </>
      )}
      <path d="M-3 4 q3 3 6 0" stroke={P.outline} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  )
}


const MirrorSvg: FC<ToolSvgProps> = ({ demo }) => (
  <motion.svg viewBox="0 0 120 120" animate={demo ? { rotate: [0, -8, 8, 0] } : {}} transition={{ duration: 2, repeat: demo ? Infinity : 0, ease: 'easeInOut' }}>
    <rect x="54" y="58" width="12" height="52" rx="8" fill={P.metal} stroke={P.outline} strokeWidth={SW} />
    <circle cx="60" cy="38" r="26" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <circle cx="60" cy="38" r="17" fill="#ffffff" />
    {demo && <Sparkle x={49} y={27} />}
    <ToolFace cx={60} cy={40} />
  </motion.svg>
)

const ExplorerSvg: FC<ToolSvgProps> = ({ demo }) => (
  <motion.svg viewBox="0 0 120 120" animate={demo ? { y: [0, 6, 0, 6, 0] } : {}} transition={{ duration: 1.6, repeat: demo ? Infinity : 0, ease: 'easeInOut' }}>
    <rect x="52" y="46" width="16" height="60" rx="8" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <path d="M60 46 C60 30 60 24 48 20 C42 18 40 24 46 27 C52 30 52 34 52 40" fill="none" stroke={P.metal} strokeWidth={SW + 2} strokeLinecap="round" />
    <rect x="52" y="62" width="16" height="18" rx="8" fill={P.grip} opacity="0.5" />
    <ToolFace cx={60} cy={72} />
  </motion.svg>
)

const SuctionSvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <path d="M52 108 L52 52 Q52 40 62 36 L82 28" fill="none" stroke={P.accent} strokeWidth={16} strokeLinecap="round" />
    <path d="M52 108 L52 52 Q52 40 62 36 L82 28" fill="none" stroke={P.body} strokeWidth={9} strokeLinecap="round" />
    {demo && (
      <>
        {[0, 0.4, 0.8].map(d => (
          <motion.circle key={d} r="4" fill={P.accent} initial={{ cx: 82, cy: 28, opacity: 0 }} animate={{ cx: [82, 62, 52], cy: [28, 40, 70], opacity: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: d }} />
        ))}
      </>
    )}
    <circle cx="52" cy="88" r="15" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <ToolFace cx={52} cy={88} />
  </svg>
)

const SyringeSvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <rect x="34" y="52" width="44" height="24" rx="12" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <rect x="42" y="76" width="16" height="26" rx="8" fill={P.grip} stroke={P.outline} strokeWidth={SW} />
    <path d="M78 60 L96 52" stroke={P.metal} strokeWidth={SW + 4} strokeLinecap="round" />
    {demo && (
      <>
        {[0, 0.25, 0.5, 0.75, 1].map((d, i) => (
          <motion.circle key={d} r="3.2" fill={P.accent} initial={{ cx: 98, cy: 50, opacity: 0 }} animate={{ cx: 98 + 14 + (i % 3) * 4, cy: 50 - 14 + i * 6, opacity: [0, 0.85, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: d }} />
        ))}
      </>
    )}
    <ToolFace cx={56} cy={64} />
  </svg>
)

const BrushSvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <rect x="52" y="52" width="16" height="56" rx="8" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <motion.g animate={demo ? { rotate: 360 } : {}} transition={{ duration: 1.2, repeat: demo ? Infinity : 0, ease: 'linear' }} style={{ originX: '60px', originY: '32px' }}>
      <circle cx="60" cy="32" r="18" fill={P.grip} stroke={P.outline} strokeWidth={SW} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return <line key={i} x1={60 + Math.cos(a) * 10} y1={32 + Math.sin(a) * 10} x2={60 + Math.cos(a) * 16} y2={32 + Math.sin(a) * 16} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      })}
    </motion.g>
    {demo && (
      <>
        <Sparkle x={86} y={24} />
        <Sparkle x={34} y={38} delay={0.5} />
      </>
    )}
    <ToolFace cx={60} cy={78} />
  </svg>
)

const XraySvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <rect x="30" y="40" width="60" height="44" rx="16" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <circle cx="60" cy="62" r="13" fill={P.accent} stroke={P.outline} strokeWidth={SW} />
    <circle cx="60" cy="62" r="6" fill="#ffffff" opacity="0.85" />
    {/* soft ring pulse — deliberately NO flash */}
    {demo && (
      <motion.circle cx="60" cy="62" r="16" fill="none" stroke={P.sparkle} strokeWidth="3" animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} style={{ originX: '60px', originY: '62px' }} />
    )}
    <rect x="52" y="84" width="16" height="22" rx="8" fill={P.metal} stroke={P.outline} strokeWidth={SW} />
    <ToolFace cx={60} cy={34} scale={0.9} />
  </svg>
)

const RingSvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <MiniTooth x={60} y={62} s={1.4} />
    <motion.path
      d="M60 26 A 36 36 0 1 0 60.01 26"
      fill="none"
      stroke={P.grip}
      strokeWidth={SW + 5}
      strokeLinecap="round"
      strokeDasharray="200 40"
      animate={demo ? { scale: [1.08, 0.98, 1.08] } : {}}
      transition={{ duration: 1.8, repeat: demo ? Infinity : 0, ease: 'easeInOut' }}
      style={{ originX: '60px', originY: '62px' }}
    />
    {demo && (
      <>
        <circle cx="42" cy="66" r="4" fill={P.grip} opacity="0.5" />
        <circle cx="78" cy="66" r="4" fill={P.grip} opacity="0.5" />
      </>
    )}
    <ToolFace cx={60} cy={106} scale={0.8} />
  </svg>
)

const UmbrellaSvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <MiniTooth x={60} y={84} s={1.2} />
    <motion.g animate={demo ? { rotate: [-3, 3, -3] } : {}} transition={{ duration: 2.2, repeat: demo ? Infinity : 0, ease: 'easeInOut' }} style={{ originX: '60px', originY: '40px' }}>
      <path d="M24 44 Q60 8 96 44 Q84 36 72 44 Q66 38 60 44 Q54 38 48 44 Q36 36 24 44 Z" fill={P.accent} stroke={P.outline} strokeWidth={SW} />
      <line x1="60" y1="44" x2="60" y2="60" stroke={P.metal} strokeWidth={SW} strokeLinecap="round" />
    </motion.g>
    {demo && (
      <>
        {[30, 60, 90].map((x, i) => (
          <motion.circle key={x} r="3.5" fill={P.accent} initial={{ cx: x, cy: 6, opacity: 0 }} animate={{ cy: [6, 30, 22], cx: [x, x, x + (x < 60 ? -14 : 14)], opacity: [0, 1, 0] }} transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.35 }} />
        ))}
      </>
    )}
    <ToolFace cx={60} cy={26} scale={0.8} />
  </svg>
)

const SpraySvg: FC<ToolSvgProps> = ({ demo }) => (
  <svg viewBox="0 0 120 120">
    <rect x="34" y="44" width="30" height="56" rx="12" fill={P.body} stroke={P.outline} strokeWidth={SW} />
    <rect x="40" y="30" width="18" height="16" rx="6" fill={P.grip} stroke={P.outline} strokeWidth={SW} />
    <path d="M58 36 L72 36" stroke={P.metal} strokeWidth={SW + 2} strokeLinecap="round" />
    {demo && (
      <>
        <Sparkle x={84} y={28} size={4} />
        <Sparkle x={92} y={40} delay={0.4} size={5} />
        <Sparkle x={82} y={50} delay={0.8} size={3.5} />
      </>
    )}
    <MiniTooth x={92} y={78} s={1.1} sleepy={!!demo} />
    <ToolFace cx={49} cy={70} />
  </svg>
)

export const TOOLS: Record<ToolId, { Svg: FC<ToolSvgProps> }> = {
  mirror: { Svg: MirrorSvg },
  explorer: { Svg: ExplorerSvg },
  suction: { Svg: SuctionSvg },
  syringe: { Svg: SyringeSvg },
  brush: { Svg: BrushSvg },
  xray: { Svg: XraySvg },
  ring: { Svg: RingSvg },
  umbrella: { Svg: UmbrellaSvg },
  spray: { Svg: SpraySvg },
}
