import type { ReactNode } from 'react'

/**
 * The one frame every module screen sits in, so nothing jumps between steps:
 * the title always starts at the same height, the action button always ends at
 * the same height, and only the stage in between absorbs the size difference
 * between a wide clinic scene and a single tooth.
 *
 * The intro line reserves two lines of height whether the copy needs one, two
 * or none, because Arabic and English wrap differently and a child should not
 * see the artwork shift when the narration changes.
 */
export function ModuleFrame({
  title,
  intro,
  onIntroTap,
  children,
  action,
  className = '',
  titleClassName = 'from-sky-deep to-grape',
}: {
  title: ReactNode
  intro?: ReactNode
  onIntroTap?: () => void
  children: ReactNode
  action?: ReactNode
  className?: string
  titleClassName?: string
}) {
  return (
    <div className={`module-frame flex flex-col items-center px-4 ${className}`}>
      <header className="shrink-0 w-full flex flex-col items-center">
        <h1 className={`text-3xl font-bold text-center bg-gradient-to-b bg-clip-text text-transparent ${titleClassName}`}>
          {title}
        </h1>
        {intro !== undefined && (
          <p className="text-ink/60 font-bold text-center mt-1 min-h-14 text-balance" onClick={onIntroTap}>
            {intro}
          </p>
        )}
      </header>

      <div className="module-stage flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 py-2">
        {children}
      </div>

      {action && (
        <div data-testid="next-fallback" className="shrink-0 w-full max-w-xs flex flex-col pt-1">
          {action}
        </div>
      )}
    </div>
  )
}
