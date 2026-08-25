import { useEffect, useRef, useState } from 'react'
import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { Pop } from '../components/motion/Pop'
import { StarBurst } from '../components/motion/StarBurst'
import { GameButton } from '../components/ui/GameButton'
import { DoneBadge } from '../components/ui/DoneBadge'
import { GameStage } from '../game/GameStage'
import { milo } from '../game/Milo/bus'
import { springs, loops, STAGGER, teeter, TEETER_S, recline, lightWarmUp, pulse } from '../motion/springs'
import hotspots from '../content/clinic-hotspots.json'
import type { ModuleProps } from './registry'

type ItemId = 'chair' | 'light' | 'suction' | 'syringe'

/**
 * The clinic as the client storyboarded it.
 *
 * Slides 2, 3 and 4 of `tooth game.pptx` are one room with the chair, the
 * overhead light and the delivery unit each supplied as a separate transparent
 * image sitting exactly over its own position — "Press on the chair", and the
 * chair rocks where it stands. That is what this screen is: the room, with four
 * things in it that move in place. Not four cut-out props arranged in the
 * corners of a pastel background, which is what it used to be and which the
 * PowerPoint never asked for.
 *
 * The four are the chair, the light, the suction and the air-water syringe. The
 * rinse bowl and the delivery unit were here instead of the two instruments,
 * and both are still in the room — they are simply no longer things a child is
 * asked to press. The instruments came out of the unit's own hoses, which are
 * the right objects at hopelessly the wrong size: five near-identical grey
 * lines, none of them a target a four-year-old could hit. They are stood up as
 * their own props by `scripts/place-clinic-tools.mjs`.
 *
 * Every layer shares the plate's canvas, so each one is a full-size image at
 * `inset-0` and the artwork's own position does the placing. See
 * `scripts/import-pptx-clinic.mjs`.
 */

/**
 * The tap targets, measured from each layer's own alpha by
 * `scripts/import-pptx-clinic.mjs` and padded for a child's aim. The layer
 * images cannot be the buttons themselves — they are all full-canvas and mostly
 * transparent, so four of them stacked would mean only the topmost was ever
 * pressed.
 */
const ITEMS: { id: ItemId; nameId: StringId; descId: StringId }[] = [
  { id: 'light', nameId: 'clinic.light.name', descId: 'clinic.light.desc' },
  { id: 'suction', nameId: 'clinic.suction.name', descId: 'clinic.suction.desc' },
  { id: 'chair', nameId: 'clinic.chair.name', descId: 'clinic.chair.desc' },
  { id: 'syringe', nameId: 'clinic.syringe.name', descId: 'clinic.syringe.desc' },
]

/**
 * Objects that have their own close-up render, emitted by
 * `scripts/import-pptx-clinic.mjs`. The trolley is a beige box with hoses in
 * the room; everything that makes it interesting — the mirror, the little
 * camera, the tooth in its ring — only becomes legible at card size.
 */
// Both instruments are lifted straight out of the room at tap-target size, so
// the card shows the prop's own full-resolution render instead of a magnified
// crop of a two-hundred-pixel layer.
const DETAIL_ART = new Set<ItemId>(['suction', 'syringe', 'chair', 'light'])

const IDLE_HINT_MS = 10000
const CARD_DELAY_MS = 500
const TAP_SLOP_PX = 24
const BURST_MS = 900

export function ClinicScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [explored, setExplored] = useState<Set<ItemId>>(new Set())
  const [introDone, setIntroDone] = useState(false)
  const [open, setOpen] = useState<ItemId | null>(null)
  const [acting, setActing] = useState<ItemId | null>(null)
  const [narrationDone, setNarrationDone] = useState(false)
  const [burstFor, setBurstFor] = useState<ItemId | null>(null)
  const [hintFor, setHintFor] = useState<ItemId | null>(null)
  const doneRef = useRef(false)
  const sceneRef = useRef<HTMLDivElement>(null)
  const cardTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const narrationRun = useRef(0)

  useEffect(() => {
    let alive = true
    void audio.say(lang, 'clinic.intro').then(() => {
      if (alive) setIntroDone(true)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () => () => {
      clearTimeout(cardTimer.current)
      clearTimeout(burstTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!introDone || open || acting || explored.size >= ITEMS.length) return
    const timer = setTimeout(() => {
      const next = ITEMS.find(i => !explored.has(i.id))
      if (next) {
        setHintFor(next.id)
        milo.react('point')
        void audio.say(lang, 'milo.hint.tap')
      }
    }, IDLE_HINT_MS)
    return () => clearTimeout(timer)
  }, [introDone, open, acting, explored, lang])

  const tapItem = (id: ItemId) => {
    if (!introDone || acting || open) return
    setHintFor(null)
    setActing(id)
    setNarrationDone(false)
    milo.react('point')
    const item = ITEMS.find(i => i.id === id)!
    const run = ++narrationRun.current
    void audio.say(lang, item.descId).then(() => {
      if (narrationRun.current === run) setNarrationDone(true)
    })
    cardTimer.current = setTimeout(() => setOpen(id), CARD_DELAY_MS)
  }

  const pressed = useRef<{ id: ItemId; x: number; y: number } | null>(null)

  const onPointerDown = (id: ItemId) => (e: React.PointerEvent) => {
    pressed.current = { id, x: e.clientX, y: e.clientY }
  }

  const onPointerUp = (id: ItemId) => (e: React.PointerEvent) => {
    const start = pressed.current
    pressed.current = null
    if (!start || start.id !== id) return
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX) return
    tapItem(id)
  }

  const cancelPress = () => {
    pressed.current = null
  }

  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    const rect = sceneRef.current?.getBoundingClientRect()
    onComplete(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
  }

  const closeCard = async () => {
    if (!open || !narrationDone) return
    const justClosed = open
    const next = new Set(explored)
    next.add(justClosed)
    setExplored(next)
    setOpen(null)
    setActing(null)
    milo.react('happy')
    setBurstFor(justClosed)
    burstTimer.current = setTimeout(() => setBurstFor(null), BURST_MS)
    if (next.size === ITEMS.length && !doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'clinic.done')
      completeOnce()
    }
  }

  const openItem = open ? ITEMS.find(i => i.id === open)! : null

  return (
    <>
      <GameStage
        title={t(lang, 'clinic.title')}
        intro={t(lang, 'clinic.intro', { name: childName })}
        scene={
          <img
            src="/art/clinic-room-bg.webp"
            alt=""
            draggable={false}
            data-testid="clinic-room-bg"
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        }
        effects={<LightWash on={acting === 'light'} />}
        action={
          <GameButton label={t(lang, 'ui.next')} disabled={explored.size < ITEMS.length} onPress={completeOnce} />
        }
      >
        {/*
        The scene keeps the plate's proportions and is scaled to the height it
        is given, so on a portrait phone it stands taller than the stage is wide
        and the room is cropped at the sides rather than shrunk into a letterbox
        a child cannot aim at. Everything inside is positioned as a percentage of
        this box, which is the same coordinate space the artwork was cut in.
      */}
        {/* Width-driven, not height-driven. The room is wider than a phone and
          its four objects span nearly all of it, so scaling to fill the height
          pushes the trolley clean off the screen. Full width shows all four;
          the blurred copy behind carries the rest. */}
        <div
          ref={sceneRef}
          data-testid="clinic-scene"
          // Stood on the floor of the stage rather than floated in the middle.
          // The room is squarer than a phone, so something has to give; put all
          // of the slack in one band at the top, where the caption already sits,
          // instead of splitting it into two bands that read as letterboxing.
          className="absolute inset-x-0 bottom-0 w-full max-h-full"
          style={{ aspectRatio: `${hotspots.scene.width} / ${hotspots.scene.height}` }}
        >
          <img
            src="/art/clinic-scene.webp"
            alt=""
            draggable={false}
            // Dissolved along its top edge so the room fades up into the soft
            // band above rather than stopping on a ruled line. Kept shallower
            // than the lamp, which starts at 9%.
            className="absolute inset-0 w-full h-full object-contain select-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%)]"
          />

          {ITEMS.map((item, idx) => (
            <ObjectLayer
              key={item.id}
              id={item.id}
              idx={idx}
              state={
                acting === item.id ? 'active' : explored.has(item.id) ? 'done' : hintFor === item.id ? 'hint' : 'idle'
              }
            />
          ))}

          {/* Biggest first, so the smallest target ends up on top. The rinse bowl
            sits bodily inside the chair's box — draw them in list order and the
            chair covers the bowl, and one of the four objects simply cannot be
            pressed. */}
          {[...ITEMS]
            .sort((a, b) => hotspots[b.id].width * hotspots[b.id].height - hotspots[a.id].width * hotspots[a.id].height)
            .map((item, idx) => {
              const box = hotspots[item.id]
              const isExplored = explored.has(item.id)
              return (
                <button
                  key={item.id}
                  data-testid={`hotspot-${item.id}`}
                  aria-label={t(lang, item.nameId)}
                  disabled={!introDone || !!acting || !!open}
                  onPointerDown={onPointerDown(item.id)}
                  onPointerUp={onPointerUp(item.id)}
                  onPointerCancel={cancelPress}
                  style={{
                    left: `${box.left}%`,
                    top: `${box.top}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className="absolute rounded-3xl"
                >
                  {!isExplored && !acting && introDone && (
                    <TapHere key={`tap-${item.id}`} id={item.id} idx={idx} urgent={hintFor === item.id} />
                  )}
                  {/* On the object, not at the corner of its box. The rinse bowl's
                  box has its top-right corner up by the wall monitor, and a
                  tick floating over the monitor says the child explored the
                  wrong thing. */}
                  {isExplored && (
                    <DoneBadge
                      testid={`explored-${item.id}`}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9"
                    />
                  )}
                  {burstFor === item.id && <StarBurst show size={60} />}
                </button>
              )
            })}
        </div>
      </GameStage>

      {/* Outside the stage, like the tools card: the stage's caption layer sits
          above its subject layer, and a card left inside the subject is painted
          over by the title however high its z goes. */}
      {openItem && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-6"
          data-testid="zoom-card"
        >
          <Pop className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 w-full max-w-sm shadow-2xl">
            {/* Objects worth a closer look get their own render; the rest are
                lifted out of the room and magnified, still playing their beat. */}
            {DETAIL_ART.has(openItem.id) ? (
              <motion.img
                src={`/art/clinic-detail-${openItem.id}.webp`}
                alt=""
                draggable={false}
                data-testid={`detail-${openItem.id}`}
                onClick={() => void audio.replayLast()}
                className="w-full rounded-2xl select-none"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.playful}
              />
            ) : (
              <div className="relative w-44 aspect-[1280/1024] overflow-hidden" onClick={() => void audio.replayLast()}>
                <CardCrop id={openItem.id} />
              </div>
            )}
            <h2 className="text-2xl font-bold text-center">{t(lang, openItem.nameId)}</h2>
            <p className="text-lg text-center text-ink/70 font-bold" onClick={() => void audio.replayLast()}>
              {t(lang, openItem.descId)}
            </p>
            <GameButton label={t(lang, 'ui.next')} disabled={!narrationDone} onPress={() => void closeCard()} />
          </Pop>
        </div>
      )}
    </>
  )
}

/**
 * "Press here." One sits on every object the child has not found yet, from the
 * first second the room appears.
 *
 * A small marker rather than an outline around the object. The chair's box is
 * two thirds of the scene, so a ring around it reads as a giant blob rather
 * than as a target — and drawing rectangles over the client's room stops it
 * being a room. A dot with a ripple coming off it is what a four-year-old
 * already understands from every other game they have touched.
 */
function TapHere({ id, idx, urgent }: { id: ItemId; idx: number; urgent: boolean }) {
  const timing = { ...(urgent ? loops.urge : loops.breathe), delay: idx * STAGGER }
  return (
    <span
      aria-hidden
      data-testid={`ring-${id}`}
      // Never takes a tap. The ripple grows to twice its own width and spills
      // outside the object it belongs to, so on a screen where two objects
      // stand close together it lies across its neighbour's middle. It is
      // decoration — the press has to reach the button underneath.
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center pointer-events-none"
    >
      {/* the ripple, travelling outward and fading */}
      <motion.span
        className="absolute inset-0 rounded-full border-[3px] border-sunny"
        animate={{ scale: [1, 2.1], opacity: [0.85, 0] }}
        transition={{ duration: urgent ? 1 : 1.8, repeat: Infinity, ease: 'easeOut', delay: idx * STAGGER }}
      />
      {/* the marker itself */}
      <motion.span
        className="w-5 h-5 rounded-full bg-sunny border-2 border-white shadow-[0_2px_6px_rgba(58,53,96,0.35)]"
        animate={urgent ? { scale: [1, 1.35, 1] } : { scale: [1, 1.15, 1] }}
        transition={timing}
      />
    </span>
  )
}

/**
 * The whole room warming when the light comes on — `MOTION_SPEC.md` §1 asks for
 * the ambient to shift from 6500K to 4200K over 600ms. Room-scale, so it lives
 * in the stage's effects layer rather than inside the object.
 */
function LightWash({ on }: { on: boolean }) {
  return (
    <motion.div
      data-testid="light-wash"
      className="absolute inset-0 bg-[radial-gradient(55%_40%_at_46%_20%,rgba(255,233,168,0.9)_0%,rgba(255,233,168,0)_70%)]"
      initial={{ opacity: 0 }}
      animate={on ? { opacity: lightWarmUp.keyframes } : { opacity: 0 }}
      transition={on ? { ...lightWarmUp.transition, times: lightWarmUp.times } : { duration: 0.6, ease: 'easeOut' }}
    />
  )
}

/**
 * What each object does when it is pressed, from the `p:timing` table of the
 * client's file (`MOTION_SPEC.md` §1). The chair and the light are the two the
 * client animated by hand and they get their exact five-beat teeter; the sink
 * and the delivery unit get the trolley's weighted grow-and-shrink, which is
 * the client's beat for a piece of equipment with no script of its own.
 */
function activeBeat(id: ItemId): { anim: TargetAndTransition; transition: Transition } {
  if (id === 'chair' || id === 'light') {
    return {
      anim: { rotate: [...teeter.keyframes] },
      transition: { duration: TEETER_S[id], times: [...teeter.times], ease: 'easeInOut' },
    }
  }
  return {
    anim: { scale: [...pulse.keyframes] },
    transition: { ...pulse.transition, times: [...pulse.times] },
  }
}

/**
 * Each object's pivot, as a share of the scene — the point it actually turns
 * about in the room. The chair rocks on its foot, the lamp swings from its
 * ceiling mount, and the two pieces of equipment simply breathe about their
 * own middle.
 */
const ORIGIN: Record<ItemId, string> = {
  // the foot it rocks on
  chair: '44% 93%',
  // the top of the head, where the arm meets it — the arm itself stays in the
  // plate, so swinging from the ceiling would tear the lamp off its mount
  light: '47% 20%',
  // both stand in the unit's holder, so they tip about where they are gripped
  suction: '50% 88%',
  syringe: '50% 88%',
}

type LayerState = 'idle' | 'hint' | 'active' | 'done'

function ObjectLayer({ id, idx, state }: { id: ItemId; idx: number; state: LayerState }) {
  const beat =
    state === 'active'
      ? activeBeat(id)
      : state === 'hint'
        ? { anim: { scale: [1, 1.045, 1] }, transition: loops.urge }
        : state === 'idle'
          ? // Nothing in the room holds perfectly still. Small enough that four
            // at once is a room breathing, not four things wobbling.
            { anim: { scale: [1, 1.012, 1] }, transition: { ...loops.breathe, delay: idx * STAGGER } }
          : { anim: { scale: 1 }, transition: springs.soft }

  const reclined = state === 'active' && id === 'chair'
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      data-testid={`layer-${id}`}
      style={{ transformOrigin: ORIGIN[id] }}
      animate={{ rotate: reclined ? recline.degrees : 0 }}
      transition={reclined ? { ...recline.transition, delay: TEETER_S.chair + recline.delay } : recline.transition}
    >
      <motion.img
        src={`/art/clinic-layer-${id}.webp`}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none"
        style={{ transformOrigin: ORIGIN[id] }}
        animate={beat.anim}
        transition={beat.transition}
      />
    </motion.div>
  )
}

/**
 * The same layer again inside the card, blown up so the object fills the frame
 * instead of sitting wherever it happens to sit in the room.
 *
 * Derived from the measured box rather than dialled in by hand: enlarge until
 * the object's longer side fills the frame, then slide it so the object's
 * centre lands on the frame's centre. The card frame carries the scene's aspect
 * ratio, which is what lets one number do both axes.
 */
function cardView(id: ItemId) {
  const b = hotspots[id]
  const k = 1 / (Math.max(b.width, b.height) / 100)
  const cx = (b.left + b.width / 2) / 100
  const cy = (b.top + b.height / 2) / 100
  return {
    width: `${k * 100}%`,
    height: `${k * 100}%`,
    left: `${(0.5 - cx * k) * 100}%`,
    top: `${(0.5 - cy * k) * 100}%`,
  }
}

function CardCrop({ id }: { id: ItemId }) {
  const beat = activeBeat(id)
  return (
    <motion.img
      src={`/art/clinic-layer-${id}.webp`}
      alt=""
      draggable={false}
      className="absolute object-contain select-none max-w-none"
      style={{ ...cardView(id), transformOrigin: ORIGIN[id] }}
      animate={beat.anim}
      transition={beat.transition}
    />
  )
}
