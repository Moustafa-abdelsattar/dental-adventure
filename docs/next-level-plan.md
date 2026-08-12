# Next-Level Plan — external product/UX/clinical review (saved 2026-08-12)

> Verdict: **6.8/10 as a prototype — with genuine 9/10 potential.**
> Core risk: *"It currently risks feeling like a collection of cute dental activities rather than one carefully designed journey that prepares a child for their real appointment."*
> The photo board is a product-requirements map, not an interface spec — use its structure and content, not its card-heavy layout.

## Provisional scorecard

| Area | Score | Judgment |
| --- | ---: | --- |
| Core concept | 9/10 | Clear problem and useful outcome |
| Character and visual appeal | 8/10 | Milo is strong and child-friendly |
| Child comprehension | 6.5/10 | Needs to become more voice-first and less instructional |
| Gameplay and interaction | 6/10 | Needs more satisfying actions and stronger feedback |
| Story and progression | 5.5/10 | Currently closer to sequential activities than an adventure |
| Anxiety-reduction design | 7/10 | Good foundation, but needs more child control and coping practice |
| Clinical accuracy | 6/10 | First-visit content is mixed with treatment procedures |
| Arabic–English experience | 6/10 | Translation alone is not enough; the whole interface must adapt |
| Accessibility | 5.5/10 | Needs larger targets, alternatives to dragging, and motion/audio controls |
| Research readiness | 5/10 | Consent, validity, and data separation need work |

Clinical foundation is sensible: positive pre-visit imagery, tell-show-do, descriptive praise, desensitization, distraction, breathing — all recognized pediatric behavior-guidance techniques (AAPD). An RCT with ages 4–7 found lower physiological anxiety after repeated exposure to a dental simulation game.

## What is already working

1. **Milo is the product anchor** — keep him present through the whole journey, not only intro/congrats.
2. **Role-reversal is excellent** — child helps Milo first, then experiences the same steps.
3. **Learning sequence is correct** — Explore → Learn → Practise → Experience → Reflect → Reward is the permanent backbone.
4. **Visual direction is reassuring** — rounded clay style, pastels, big expressions, nothing frightening.

## What is holding it back

| Problem | Recommended change |
| --- | --- |
| Scope mixes first visits and treatment visits | Make **Check-up & Cleaning** the default journey; rubber dam, clamp, sleepy gel, drill, sealant → optional clinic-selected modules |
| Nine instruments introduced together | First journey teaches only **mirror, suction, air/water, polisher**; nine-tool set becomes an optional library |
| The "story" is mostly a menu | Milo starts uncertain → child helps him prepare → midpoint role reversal → Milo guides the child |
| Child has limited control | Stop-hand signal, pause/repeat buttons, sound preview, never force a timed action |
| Copy risks false promises | No "no pain" / "magic"; friendly-but-truthful: "sleepy gel", "little water straw", "tooth camera" (+ real term in adult mode) |
| Reward is generic | Specific badges: Chair Explorer, Mirror Expert, Sound Detective, Pause-Signal Pro |
| Research controls mixed into child product | All data collection behind an adult gate; anonymous play is the default |

## The biggest content correction

The board describes a **first dental visit** but includes clamp/ring, rubber dam, topical anaesthetic, tooth-preparation. Split into:

- **"Milo's First Check-up"** (primary): enter clinic → meet dentist → sit in chair → bib → chair moves gently → light on → count teeth with mirror → suction/polish when relevant → sit up → praise/sticker.
- **"Milo Gets a Tooth Fixed"** (separate, optional/clinic-selected).

## Target session shape (6–8 minutes)

| Stage | Child experience | Purpose |
| --- | --- | --- |
| Adult setup | Parent/clinic selects age, language, visit type | Personalize without exposing settings to child |
| 1. Welcome | Milo waves, asks how the child feels (5 faces) | Trust + starting emotional state |
| 2. Explore the clinic | Tap chair, light, bib, cup, instrument table | Make environment predictable |
| 3. Meet essential tools | Mirror, suction, air/water, polisher — individually | Reduce cognitive overload |
| 4. Help Milo | Child uses each tool on Milo/friendly tooth | Role reversal, active learning |
| 5. Practise calm skills | Raise-hand pause, breathe with glowing star, count slowly | Practical coping for the real visit |
| 6. My dental visit | Child avatar experiences the sequence with Milo beside them | Transfer to the real appointment |
| 7. Ready check | Arrange four visit steps in order; pick a feeling again | Measure understanding + emotional change |
| 8. Reward | Milo celebrates; badges + certificate | End with competence |

## Alignment with the photo board

| Board section | Keep | Upgrade |
| --- | --- | --- |
| Welcome screen | Logo, Milo, language, start | Add feeling check; one dominant start action; voice narration |
| Meet the clinic | Chair, light, sink, table | Panoramic interactive room with animated hotspots, not four info cards |
| Meet the instruments | Friendly names, animations, sounds | 3–4 essential tools first; all nine in optional "Tool Room" |
| Tool-practice area | Central tooth + tool tray | Main gameplay: magnetic dragging, tap alternatives, visible effects, no punishment |
| Dental-visit simulation | Child in chair, numbered stages | Central emotional climax: chair movement, light, bib, mirror, sound preview, stop signal |
| Prepare-the-tooth | Strong mini-game | Move into separate treatment module |
| Sleepy-spray mission | Counting/calming useful | Separate calming from anaesthetic; eye-closing optional; never imply guaranteed no-pain |
| Reward screen | Celebration, stars, replay | Reward skills/knowledge, not speed or perfection |
| Certificate | Great parent takeaway | Printing + name entry behind adult gate |
| Anxiety assessment | Pre/post five-face structure | Validated or clearly labelled custom scale; anonymous; not a diagnosis |

## Milo's story arc

- **Beginning:** "I'm visiting the dentist today. I feel a little wiggly inside. Will you explore with me?"
- **Middle:** child helps Milo; after each activity Milo gets visibly calmer (posture, expression, brighter environment, calm voice).
- **Role reversal:** "You helped me get ready. Now I'll stay with you while you practise your visit."
- **Ending:** shared badge — "We know what happens next."
- Rewards preparation, knowledge, and control — never "be brave" / fear-as-failure.

## Instrument teaching formula (every tool)

1. What is it called? 2. What does it do? 3. What might it sound or feel like? 4. What can the child do?

> "This is the suction. We also call it the little water straw. It drinks extra water and makes a soft slurping sound. You can raise your hand whenever you want a pause."

First-journey tools:

| Friendly label | Real label | Interaction |
| --- | --- | --- |
| Tooth mirror | Dental mirror | Move reflection to find sparkling teeth |
| Water straw | Suction | Remove water drops from the tooth |
| Tiny shower | Air-water syringe | Rinse away foam |
| Tickly toothbrush | Polishing brush | Follow a gentle circular path |

Explorer, X-ray, rubber dam, clamp, topical anaesthetic, restorative tools: only when relevant to the selected visit.

## UI and visual direction

- Child-facing screen = one scene, one main character, one instruction, one primary action, tiny permanent nav.
- Layers: World (clinic) / Character (Milo + child) / Action (current tool/task) / Interface (progress, replay audio, pause, back).
- Avoid card-heavy worksheet look; the clinic should feel like a connected world.
- One art system: same clay render, camera, lighting, shadows, proportions, scale, radii, icon family, expressions. Never mix realistic tools, flat icons, emoji, and clay on one screen.
- Forgiving interactions: magnetic drag targets, tap-to-place alternative, Milo demonstrates after two misses, no red cross/buzzer/lost star/restart, success feedback explains ("The suction drank all the water.").
- Touch targets **56–72 CSS px** for this age group (WCAG minimum is 24, enhanced 44).
- Arabic is a separate interface: `dir="rtl"`, reversed flows, logical CSS properties, numbers/EN terms handling, Arabic line heights, professionally recorded Arabic audio, independent text fitting and animation timing.
- Audio: fully understandable without reading AND fully usable muted. One instruction per line, few seconds, permanent replay, pause before action, never overlap. Optional **"Hear the tool"** preview button — sound becomes predictable, not surprising.

## The differentiator: personalize to the child's actual visit

Clinic-facing setup selects: first check-up / cleaning / X-ray / sealant / filling / orthodontic visit → only relevant steps and instruments appear. Stronger version: clinic's chair colour, dentist photo/welcome, dentist's preferred terminology, exact appointment sequence, clinic-branded certificate, sensory options (quiet mode, reduced animation), QR code sent before the appointment. That makes it a **customizable pediatric dental preparation platform**, not a cute dentist game.

## Research and data layer

- Five-face Facial Image Scale has evidence in clinical context, but redesigned faces/labels/sequence = call it a **mood check** unless the implementation is validated.
- Research mode collects only: random anonymous session ID, age band, language, visit profile, pre/post face, activities completed, replays/pauses/skips, session duration, date-time when genuinely required.
- Never by default: name, email, photo, voice, free text.
- COPPA: notice, verifiable parental consent before collection, parental review/deletion, protection, minimal retention.
- Claims: OK now — "Designed to help children know what to expect." Needs validation — "Clinically proven to reduce dental anxiety." Never — "Eliminates fear" / "guarantees a pain-free visit."

## Build priority

### Priority 0 — Fix the product structure
1. Make Check-up & Cleaning the default module.
2. Move treatment tools into optional journeys.
3. Build one uninterrupted 6–8 minute path.
4. Give Milo a beginning, emotional change, and ending.
5. Replace "no pain" promises with truthful preparation.
6. Reduce the mandatory tool set to four.

### Priority 1 — Make it feel like a real game
1. Forgiving tool interactions with visible physical effects.
2. Teach the stop-hand signal and one breathing exercise.
3. Sound preview and replay.
4. Descriptive praise instead of generic "Great job."
5. Age modes for 4–5 and 6–8.
6. Complete proper Arabic RTL and voice implementation.
7. Reduced-motion and quiet modes.

### Priority 2 — Create the defensible product
1. Clinic-selected appointment pathways.
2. Clinic photo, voice and branding customization.
3. Adult-gated parent or dentist summary.
4. Anonymous research mode.
5. Validation with pediatric dentists and children.
6. Separate outcome reporting from the child's reward experience.

## North star

> After one short session, the child should be able to predict the main steps of the upcoming visit, recognize three or four relevant tools, demonstrate how to request a pause, use one calming technique, and feel more prepared.

**Explore → Practise → Rehearse → Reflect → Reward**
