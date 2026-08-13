import { useGame, selectStarCount } from '../../store/game'
import { t } from '../../lib/i18n'

/** StarFly animates toward this element; registered on mount. */
export const hudTarget: { current: HTMLElement | null } = { current: null }

export function ProgressHud() {
  const count = useGame(selectStarCount)
  const lang = useGame(s => s.lang)
  const childName = useGame(s => s.childName)
  return (
    <div
      className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-2 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-sm"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <span className="font-bold text-lg truncate me-2">
        {lang ? t(lang, 'ui.hudTitle', { name: childName }) : ''}
      </span>
      <div
        ref={el => {
          hudTarget.current = el
        }}
        className="flex gap-1 shrink-0"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <img
            key={i}
            src="/art/star.svg"
            alt=""
            draggable={false}
            data-testid={i < count ? 'star-filled' : 'star-empty'}
            className={`w-7 select-none transition-all ${i < count ? 'drop-shadow-[0_0_6px_rgba(255,212,94,0.9)]' : 'opacity-25 grayscale'}`}
          />
        ))}
      </div>
    </div>
  )
}
