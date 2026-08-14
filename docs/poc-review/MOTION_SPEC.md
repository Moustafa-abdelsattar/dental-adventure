# Motion Specification

Authoritative source for all animation. Timings in sections 1–3 are extracted from the `p:timing` XML of `tooth game.pptx` and represent the client's exact intent.

---

## 0. Principles

Apply to every motion in the product. This list is what separates the rebuild from the prototype.

1. **Springs, not curves.** Physical simulation with stiffness and damping. Easing curves only for camera moves and motion paths.
2. **Anticipation.** A counter-move before the main move. The chair dips ~2% before it rises.
3. **Overshoot and settle.** Every arrival passes its target and returns. No motion stops dead.
4. **Squash and stretch.** Scale non-uniformly along the direction of travel. Requires deformable geometry — a reason objects must be 3D, not bitmaps.
5. **Secondary motion.** Child elements lag the parent by 60–100ms. Hoses, cables, the light's arm joints, Milo's cheeks.
6. **Stagger.** Nothing moves simultaneously. Offset siblings by 60–120ms.
7. **Impact frames.** One to two frames of flash, scale spike, or 3px camera shake at contact.
8. **Never static.** Idle loops always run: breathing, blinking, floating, a slow drift of specular highlights.
9. **Sound locked to motion.** Cue on the frame of impact, not the start of the move.

---

## 1. Act 1 — Dental clinic journey

### Chair teeter (PPTX slide 2)
Click-triggered. Source rotation is ±2° (`animRot by="120000"` = 2° in 1/60000° units).

```
Beat  Delay   Dur    Rotation
1     0ms     100ms  +2°
2     200ms   200ms  -2°   (by -4°)
3     400ms   200ms  +2°   (by +4°)
4     600ms   200ms  -2°   (by -4°)
5     800ms   200ms   0°   (by +2°)
Total 1000ms
```

**Amplify to ±7° for the rebuild.** ±2° is invisible on a phone. Preserve the five-beat rhythm and the decaying feel; drive it with a spring rather than discrete keyframes:

```js
useSpring({ rotation: pressed ? 0 : 0, config: { tension: 420, friction: 8, mass: 1.1 } })
// impulse-driven: apply angular velocity 9 rad/s on tap, let damping resolve it
```

Then: chair reclines 14° about its hinge, `{ tension: 160, friction: 24 }`, 90ms after the teeter settles. Headrest lags 80ms. Speech bubble fades in over 500ms (matches the PPTX text fade).

**Sound:** soft mechanical *whirr* on recline, gentle *thunk* at the stop.

### Light teeter (PPTX slide 3)
Same shape, slower — the client used longer durations here:

```
Beat  Delay    Dur    Rotation
1     0ms      180ms  +2°
2     360ms    360ms  -2°
3     720ms    360ms  +2°
4     1080ms   360ms  -2°
5     1440ms   360ms   0°
Total 1800ms
```

Text fades in 500ms first; the teeter starts as an `afterEffect` at +500ms. Exit at 2300ms.

Then the light switches on: emissive intensity 0 → 1 over 400ms with a 60ms flicker at 120ms. Bloom threshold drops, scene ambient warms from 6500K to 4200K over 600ms. Arm joints swing with 90ms stagger, distal joint last.

**Sound:** switch *click*, then a low warm hum fading in.

### Trolley pulse (PPTX slide 4)
`presetID="6"` grow/shrink, `dur="2000"`, click-triggered.

```
scale 1.00 → 1.14 → 1.00 over 2000ms
```

Do not use a symmetric ease. Weight it: reach 1.14 at 40% of the duration, hold ~10%, return over the remaining 50%. Instruments on the tray get 70ms secondary lag and a faint metallic shimmer at peak scale.

**Sound:** soft glass and metal *tink* cluster at peak.

### Clinic room reveal (PPTX slide 4)
`presetID="2" subtype="8"` fly in from left, `dur="500"`, `ppt_x` from `0-#ppt_w/2` → `#ppt_x`. Fires twice in the source.

```js
from: { x: '-70%', opacity: 0 }
to:   { x: '0%',   opacity: 1 }
config: { tension: 210, friction: 20 }
```

Add 6% motion blur along travel, decaying to 0 on arrival. Camera pushes in 3% simultaneously.

---

## 2. Act 2 — Our tools

### Sequential teeter chain (PPTX slide 6)
Four objects teeter in sequence, each on a 1000ms cadence, then a spray effect zooms in:

```
0ms      Mirror teeter        (1000ms, ±2°)
1000ms   Explorer teeter      (1000ms)
2000ms   Sleepy spray teeter  (1000ms)
3000ms   Polisher teeter      (1000ms)
4000ms   Spray mist grows in  (presetID 53 subtype 16, 500ms)
```

This is the client's *demonstration* order. In the product these become individually tapped, but keep the cadence for an attract-mode loop if the player idles more than 8 seconds.

### Per-tool signature animation
Plays when the detail sheet opens, at +420ms (after the sheet settles).

| Tool | Animation | Duration | Effect layer |
|---|---|---|---|
| Dental Mirror | Teeter + specular sweep across the disc | 900ms | Sparkles |
| Explorer | Tap down twice, 16px, -7° | 1000ms | — |
| Suction | Teeter | 900ms | Droplets rising into the tip |
| Air Water Syringe | Teeter | 900ms | Fine mist cone |
| Polishing Brush | Continuous spin, 360° | 1200ms | Sparkles |
| X-Ray Camera | Pulse 1→1.14→1 | 900ms | White flash, 18% peak at 180ms |
| Tooth Hugger Ring | Pulse, arms closing inward | 1400ms | — |
| Tooth Umbrella | Grow open from 0.2 scale | 700ms | Droplets sliding off |
| Magic Sleepy Spray | Teeter | 900ms | Sparkle mist with stars |

Sheet entrance: `translateY(101%) → 0`, 380ms, `cubic-bezier(.22,1,.36,1)`. In the rebuild use `{ tension: 260, friction: 26 }`.

Tool lift to centre: rise 1.4 world units with 6° tilt toward camera, `{ tension: 190, friction: 18 }`, 120ms after tap. Camera dollies 8% closer.

**Sound per tool:** mirror *shimmer*, explorer *tick tick*, suction *slurp*, syringe *pssht*, polisher *whirr*, camera *shutter*, ring *soft clasp*, umbrella *fwoomp*, spray *sparkle chime*.

---

## 3. Act 3 — Let's practice

### Step 1 — Mirror, motion path (PPTX slide 8)
`presetID="37"` motion path, `dur="2000"`, `accel="50000" decel="50000"` — 50% acceleration, 50% deceleration.

```
Easing: cubic-bezier(.5, 0, .5, 1)
Path:   start  translate(-130%,  75%) rotate(-30°)
        mid    translate( -38%, -16%) rotate(-11°)
        end    translate(   0%,   0%) rotate(  0°)
```

Rebuild as a Catmull-Rom curve through three control points, with the mirror's rotation slaved to the path tangent. Add banking: roll into the curve by up to 8°. On arrival, a 2px camera shake and a specular flash on the disc.

### Step 2 — Sleepy spray (PPTX slide 9)
`presetID="2" subtype="2"` fly in from right, `dur="500"`, `ppt_x` from `1+#ppt_w/2`. Then the puff: `presetID="53" subtype="16"` grow + fade, `dur="500"`, at `delay="500"`.

```
Bottle:  x +70% → 0, opacity 0 → 1, 500ms   { tension: 210, friction: 20 }
Puff:    scale .28 → 2.0, opacity 0 → .9 → 0, 900ms ease-out, starts at +500ms
```

The bottle squashes 8% on the horizontal as it decelerates, then recovers. Nozzle recoils 4px on release.

### Step 3 — Air water rinse
Fly in from left, 500ms. Five droplets fall with staggered delays `0 / .12 / .06 / .20 / .15s`, 900ms each, `ease-in`. Droplets deform on the vertical as they accelerate.

### Step 4 — Suction
Fly in from right, 500ms. Three water blobs travel up into the tip, scaling 1 → 0.15 over 850ms, staggered `0 / .12 / .22s`. Blobs stretch along their path.

### Step 5 — Polisher and the clean tooth (PPTX slide 10)
Three chained effects in the source:

```
0ms     Polisher fades in           presetID 10, 500ms
500ms   Spray mist grows in         presetID 53 subtype 16, 500ms
then    Clean tooth barn-opens      presetID 16 subtype 21, 500ms
        — while the mist hides simultaneously (withEffect)
```

Barn open vertical = a centre-out reveal:

```
clip-path: inset(0 50% 0 50%) → inset(0 0 0 0)   500ms ease-out
```

Brush spins continuously while in contact, sparkles emit from the contact point, and the tooth's specular highlight ramps up as it polishes. The reveal is the payoff — give it a 3px shake and a rising chime.

---

## 4. Global motion

### Idle loops (always running)
```
Milo float       translateY 0 → -9px → 0, 3000ms, sine, infinite
Milo blink       every 3–6s, randomised, 120ms
Milo breathe     scale 1 → 1.015 → 1, 2600ms, offset from float
Guidance ring    scale .92 → 1.32, opacity .85 → 0, 1600ms ease-out, infinite
Light glow       opacity .45 → .9 → .45, 3400ms
Dust motes       12 particles, slow upward drift, parallax by depth
```

### Micro-interactions
```
Button press     scale .94, { tension: 600, friction: 18 }, release overshoots to 1.03
Card tap         scale .96 + 2px translateY, 90ms
Star award       scale .4 → 1.25 → 1, translateY 0 → -52px, opacity 0 → 1 → 0, 1400ms
Screen change    outgoing fades + scales to .96; incoming rises 24px, 60ms overlap
```

### Spring configs
```js
const SPRING = {
  snap:    { tension: 420, friction: 12 },  // tap reactions
  settle:  { tension: 180, friction: 22 },  // arrivals
  fly:     { tension: 210, friction: 20 },  // entrances
  camera:  { tension: 150, friction: 26 },  // dollies
  press:   { tension: 600, friction: 18 },  // button feedback
  lift:    { tension: 190, friction: 18 },  // tool to centre
  sheet:   { tension: 260, friction: 26 },  // bottom sheet
};
```

### Camera
Never locked. A 1.5% continuous drift keeps the frame alive. Push in 3–8% on focus events, pull back on release. 2–3px shake on impacts only. Parallax: background 0.2×, mid 0.6×, subject 1.0×, foreground 1.3× of pointer or device tilt.

---

## 5. Reduced motion

On `prefers-reduced-motion: reduce`:
- Hold entrance and exit end-states; no travel.
- Keep functional feedback — the light still turns on, the tooth still becomes clean.
- Drop idle loops, particles, camera drift, shake, and blur.
- Replace the guidance ring pulse with a static 4px `#FFCF3F` outline.
