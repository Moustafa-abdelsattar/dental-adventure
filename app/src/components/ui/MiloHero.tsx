import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { springs } from '../../lib/springs'
import { audio } from '../../lib/audio'

/**
 * The premium hero: Milo's clay-render art with pointer-tracking 3D tilt,
 * grab-and-release spring physics, a dynamic shadow that reacts to the
 * tilt, ambient sparkles, and a choreographed entrance.
 * Tap = hear the last line again.
 */
export function MiloHero({ src = '/art/milo.webp', size = 230, draggable = true }: { src?: string; size?: number; draggable?: boolean }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [13, -13]), { stiffness: 180, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 180, damping: 20 })
  const shadowX = useTransform(rotateY, [-16, 16], [14, -14])
  const shadowScale = useTransform(rotateX, [-13, 13], [1.06, 0.9])

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      style={{ perspective: 700, width: size, touchAction: 'none' }}
      onPointerMove={track}
      onPointerLeave={reset}
      onPointerUp={reset}
      data-testid="milo-hero"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        drag={draggable}
        dragSnapToOrigin
        dragElastic={0.16}
        dragTransition={{ bounceStiffness: 350, bounceDamping: 16 }}
        whileDrag={{ scale: 1.07 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void audio.replayLast()}
        className="relative cursor-grab active:cursor-grabbing"
      >
        {/* ambient sparkles */}
        {[
          { cls: 'top-[4%] start-[2%] w-6', delay: 0 },
          { cls: 'top-[16%] end-[0%] w-4', delay: 0.7 },
          { cls: 'bottom-[14%] start-[6%] w-3.5', delay: 1.3 },
        ].map(s => (
          <motion.img
            key={s.cls}
            src="/art/star.svg"
            alt=""
            draggable={false}
            className={`absolute ${s.cls} select-none pointer-events-none`}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.15, 0.5], rotate: [0, 20, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          />
        ))}
        <motion.img
          src={src}
          alt="Milo the Tooth"
          draggable={false}
          className="w-full select-none drop-shadow-xl"
          initial={{ opacity: 0, scale: 0.5, y: 26 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: springs.playful,
            scale: springs.playful,
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
          }}
        />
      </motion.div>
      {/* dynamic contact shadow */}
      <motion.div
        aria-hidden
        className="mx-auto mt-1 h-4 w-3/5 rounded-full bg-ink/15 blur-md"
        style={{ x: shadowX, scaleX: shadowScale }}
        animate={{ opacity: [0.5, 0.32, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </div>
  )
}
