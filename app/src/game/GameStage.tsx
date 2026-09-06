import type { ReactNode } from 'react'
import { AudioButton } from '../components/ui/AudioButton'

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
  audioReplayDisabled = false,
  scene,
  effects,
  children,
  action,
  tone = 'day',
  titleClassName = 'from-sky-deep to-grape',
  className = '',
}: {
  title: ReactNode
  intro?: ReactNode
  onIntroTap?: () => void
  audioReplayDisabled?: boolean
  /** Scenery for the world layer: drawn behind the subject and never tappable. */
  scene?: ReactNode
  /**
   * Glows, sparkles, mist, impact flashes. Drawn over the subject and under the
   * caption, and never tappable — an effect is watched, not hit.
   */
  effects?: ReactNode
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
          <>
            {/*
              The spoken line is not printed on the stage any more.

              It was two lines of caption when the English was a short script of
              its own. Once the English became a translation of the Arabic
              recordings it grew to seven or eight, which pushed the artwork
              down the screen and put a wall of text in front of a child who
              cannot read it — the audience for this game is four to eight, and
              every word of it is spoken aloud already.

              Kept in the accessibility tree rather than deleted: it is the only
              text alternative to the narration for anyone playing with the
              sound off or with a screen reader, and it costs nothing to leave
              where assistive technology can still reach it.
            */}
            <p className="sr-only" data-testid="narration-text">
              {intro}
            </p>
            {/* The replay button stays, and is now the whole control: a child
                who missed the line taps here to hear it again. */}
            <AudioButton onPress={onIntroTap} disabled={audioReplayDisabled} />
          </>
        )}
      </header>

      <div className="stage-subject">{children}</div>

      {effects && (
        <div className="stage-effects" aria-hidden data-testid="stage-effects">
          {effects}
        </div>
      )}

      {action && (
        <div data-testid="next-fallback" className="stage-action">
          {action}
        </div>
      )}
    </div>
  )
}
