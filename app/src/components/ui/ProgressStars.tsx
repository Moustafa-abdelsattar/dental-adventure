/** StarFly animates toward this element; registered on mount. */
export const hudTarget: { current: HTMLElement | null } = { current: null }

/**
 * The journey currency, always visible. Earned stars glow; the ones still to
 * come stay greyed rather than hidden, so the child can see how much adventure
 * is left — the row never changes length.
 */
export function ProgressStars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div
      ref={el => {
        hudTarget.current = el
      }}
      className="flex gap-0.5 shrink-0"
    >
      {Array.from({ length: total }, (_, i) => (
        <img
          key={i}
          src="/art/star.svg"
          alt=""
          draggable={false}
          data-testid={i < count ? 'star-filled' : 'star-empty'}
          className={`w-6 select-none transition-all ${i < count ? 'drop-shadow-[0_0_6px_rgba(255,212,94,0.9)]' : 'opacity-25 grayscale'}`}
        />
      ))}
    </div>
  )
}
