import type { ReactNode } from 'react'

/**
 * The stage every module plays on.
 *
 * Where the old card frame drew a white box and stood the artwork inside it,
 * this is the room itself: sky behind, a floor under foot, the subject
 * standing on that floor, and the words floating over the top. Nothing is
 * boxed, so the environment can become the thing the child touches.
 *
 * The card's one good idea survives: three fixed heights. The title always
 * starts at the same place, the action row always rests on the floor, and only
 * the subject layer between them absorbs the size difference between a wide
 * clinic scene and a single tooth. A child should never see the layout jump
 * between steps.
 *
 * The intro line still reserves two lines of height whether the copy needs
 * one, two or none, because Arabic and English wrap differently.
 */
export function GameStage({
  title,
  intro,
  onIntroTap,
  scene,
  children,
  action,
  tone = 'day',
  titleClassName = 'from-sky-deep to-grape',
  className = '',
}: {
  title: ReactNode
  intro?: ReactNode
  onIntroTap?: () => void
  /** Scenery for the world layer: drawn behind the subject and never tappable. */
  scene?: ReactNode
  children: ReactNode
  action?: ReactNode
  /** `night` dims the floor and cools the light, for the calm counting mission. */
  tone?: 'day' | 'night'
  titleClassName?: string
  className?: string
}) {
  return (
    <div className={`game-stage ${className}`} data-tone={tone} data-testid="game-stage">
      <div className="stage-world" aria-hidden>
        <div className="stage-floor" />
        {scene}
      </div>

      <header className="stage-caption">
        <h1
          className={`text-3xl font-bold text-center bg-gradient-to-b bg-clip-text text-transparent ${titleClassName}`}
        >
          {title}
        </h1>
        {intro !== undefined && (
          <p className="text-ink/70 font-bold text-center mt-1 min-h-14 text-balance" onClick={onIntroTap}>
            {intro}
          </p>
        )}
      </header>

      <div className="stage-subject">{children}</div>

      {action && (
        <div data-testid="next-fallback" className="stage-action">
          {action}
        </div>
      )}
    </div>
  )
}
