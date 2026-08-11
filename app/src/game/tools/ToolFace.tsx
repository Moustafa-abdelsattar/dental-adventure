import { toolPalette } from './palette'

/**
 * The single friendly face shared by ALL nine tools (same proportions as Milo).
 * Every tool renders exactly one — including the Explorer, the tool most
 * likely to worry a child.
 */
export function ToolFace({ cx, cy, scale = 1, sleeping = false }: { cx: number; cy: number; scale?: number; sleeping?: boolean }) {
  const e = 7 * scale // eye offset
  const r = 2.6 * scale
  return (
    <g data-toolface transform={`translate(${cx} ${cy})`}>
      {sleeping ? (
        <>
          <path d={`M${-e - r} 0 q${r} ${r * 1.2} ${r * 2} 0`} stroke={toolPalette.outline} strokeWidth={1.8 * scale} fill="none" strokeLinecap="round" />
          <path d={`M${e - r} 0 q${r} ${r * 1.2} ${r * 2} 0`} stroke={toolPalette.outline} strokeWidth={1.8 * scale} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-e} cy={0} r={r} fill={toolPalette.outline} />
          <circle cx={e} cy={0} r={r} fill={toolPalette.outline} />
        </>
      )}
      <path
        d={`M${-4 * scale} ${5 * scale} q${4 * scale} ${4 * scale} ${8 * scale} 0`}
        stroke={toolPalette.outline}
        strokeWidth={1.8 * scale}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}
