# Dental Adventure — Egyptian Arabic Audio Script (canonical, adopted 2026-08-12)

The authoritative reference for all Arabic copy and narration. `app/src/content/strings/ar.json` follows this script; any new Arabic line must match its voice direction, naming, and banned-phrase rules.

## 1. Voice direction

**Milo's voice:** young Egyptian male, warm, friendly, calm. Clear Cairene dialect. A friendly older brother — not a presenter. Cheerful without shouting, no cartoon exaggeration, no baby talk. Slightly slower than conversation, gentle smile, short pause after every instruction.

**TTS prompt:** Warm young Egyptian male voice, natural Cairene dialect, friendly and reassuring, speaking to children aged four to eight. Calm playful energy, clear pronunciation, medium-slow pace, gentle smile, short pauses, never robotic, never overly excited, never babyish, never like a commercial announcer.

**Recording rules:** one instruction per clip, 2–6 s per clip, numbers as words, never overlap narration and SFX, use **"يلا نـ…"** so lines work for boys and girls, keep the replay button visible always.

## 2. Official Arabic names

| Concept | Name |
| --- | --- |
| Dental clinic | عيادة السنان |
| Dental chair | كرسي السنان |
| Dental light | نور الدكتور |
| Dental sink | الحوض الصغير |
| Instrument table | ترابيزة الأدوات |
| Dental mirror | المراية الصغيرة |
| Explorer | عصاية الكشف |
| Suction | الشفّاط |
| Air-water syringe | رشّاشة المَيّه والهوا |
| Polishing brush | فرشة التلميع |
| X-ray camera | كاميرا السنان |
| Dental clamp | حلقة السن |
| Rubber dam | غطا السن المطاطي |
| Topical anaesthetic | الجِلّ المهدّي (spray visual: البخّة المهدّية للّثة) |
| Dental Hero | مستكشف السنان |
| Calm mission | نجمة الهدوء |

Never "البخاخ السحري".

## 3. Key screen lines (as adopted into ar.json)

- **Language select:** «أهلاً! نختار اللغة اللي هنكمّل بيها.» / on Arabic: «تمام! هنكمّل بالعربي المصري.» / start: «يلا نبدأ المغامرة!»
- **Welcome (clips):** «أهلاً! أنا ميلو.» → «النهارده هنستكشف عيادة السنان سوا.» → «هنشوف المكان، ونتعرّف على الأدوات، ونعرف الزيارة بتمشي إزاي.» → «هنا مفيش استعجال. نقدر نسمع أي حاجة تاني، ونوقف وقت ما نحب.» → «جاهزين؟ يلا بينا!»
- **Feeling check (before):** «قبل ما نبدأ، ورّينا حاسّين بإيه دلوقتي.» / «ندوس على الوِش اللي شبه إحساسنا.» / «مفيش إجابة صح أو غلط. كل إحساس مهم.» Responses per face: happy5 «حلو أوي! نبدأ وإحنا مبسوطين.» happy4 «جميل! يلا نستكشف.» neutral «تمام. هنمشي خطوة خطوة.» worried2 «ولا يهمك. هنشوف كل حاجة بهدوء.» worried1 «إحساسك مهم. نقدر نوقف أو نسمع أي خطوة تاني.»
- **Clinic:** intro «دي عيادة السنان. كل حاجة هنا ليها شغلانة صغيرة. ندوس على أي حاجة عشان نعرفها.» Chair/light/sink/table each: name → what it does → «يلا نـ…» action → success. Light comfort: «لو النور قوي، ممكن نغمّض عينينا أو نقول للدكتور.» Complete: «استكشفنا العيادة كلها! دلوقتي بقينا عارفين المكان. وكسبنا نجمة!»
- **Tools:** intro «دلوقتي هنتعرّف على أدوات الدكتور. هنشوف أداة واحدة كل مرة. مش لازم نحفظ الأسامي.» Each tool: name → purpose → sound/feeling preview → interaction → success (see §2 names; full per-tool lines in the source script).
- **Practice:** «دلوقتي دورنا نساعد السن. نشوف العلامة، ونختار الأداة المناسبة. نسحب الأداة للسن، ولو السحب صعب نقدر ندوس عليها.»
- **Hints (never a buzzer, red cross, or "غلط"):** try1 «مش دي الأداة المطلوبة. نبص على العلامة تاني.» try2 «قريبين! ميلو هيورّينا المكان.» near-drop «قريب أوي. نحطّها جوه الدايرة.» idle «خد وقتك. اللمعة هتدلّنا.» retry «ولا يهمك. نجرب تاني.» demo «بص، ميلو هيعملها مرة.» → «دلوقتي نجرب سوا.»
- **Prepare the tooth (treatment-only):** title «نجهّز السن للعلاج»; ring → dam → gel steps with success lines; gel feeling «ممكن نحس بطعم مختلف شوية.»
- **Calm mission («نجمة الهدوء»):** «قبل ما نكمّل، ناخد لحظة هادية مع ميلو.» «ممكن نغمّض عينينا، أو نبص على النجمة.» breath in «نشمّ الهوا بهدوء.» out «ونطلّعه بالراحة.» count intro «يلا نعدّ سوا لحد عشرة.» numbers واحد…عشرة each a separate clip. Eyes open: «عادي جداً. نقدر نكمّل وإحنا باصّين على النجمة.» Paused: «مفيش استعجال. نبدأ لما نكون جاهزين.»
- **Stop-hand signal (own screen before the visit):** «قبل الزيارة، نتعلّم علامة مهمة.» «لو عايزين الدكتور يقف، نرفع إيدنا كده.» «الدكتور يقف، ويسمع إحنا محتاجين إيه.» «يلا نرفع إيد ميلو.» success «تمام! دي علامة الوقف. نقدر نستخدمها في أي وقت.»
- **Visit simulation:** intro «دلوقتي هنجرب زيارة صغيرة من أولها لآخرها. ميلو معانا طول الوقت. ونقدر نستخدم علامة الوقف وقت ما نحب.» Steps: chair → light (comfort: «لو النور قوي، نغمّض عينينا أو نرفع إيدنا.») → mirror («نفتح بُقّنا شوية، والمراية تبص.») → clean («صوتها ززز خفيف، وممكن تدغدغ شوية.») Complete: «خلصت الزيارة! عرفنا المكان، والأدوات، وكل خطوة. وكمان عرفنا إزاي نطلب وقفة. عاش! بقينا مستكشفين شاطرين.»
- **Feeling check (after):** «قبل ما نمشي، ورّينا حاسّين بإيه دلوقتي.» thanks «شكراً إنك قلت لنا. إحساسك مهم.» worried1 response: «شكراً إنك قلت لنا. خلّي حد كبير يعرف إننا محتاجين وقت أكتر قبل الزيارة.»
- **Reward:** «مبروك! خلّصنا مغامرة السنان.» «دلوقتي بقينا عارفين العيادة، والأدوات، وخطوات الزيارة.» «وكسبنا لقب: مستكشف السنان!» star «نجمة جديدة!» all «جمعنا كل النجوم!»
- **Buttons:** play again «نلعب من الأول» / certificate «نشوف الشهادة» / home «نرجع للبداية» / continue «نكمّل» / replay «نسمعها تاني»
- **Certificate:** «شهادة مستكشف السنان» — «دي شهادة مستكشف السنان.» «نكتب الاسم هنا.» «الشهادة دي عشان استكشفنا العيادة، واتعلّمنا خطوات الزيارة.» «مبروك! عملنا شغل جميل.» print «خلّي حد كبير يساعدنا نطبع الشهادة.»
- **System:** loading «لحظة صغيرة. العيادة بتتجهّز.» resume «رجعنا! نكمّل من هنا.» pause «وقفنا. نكمّل لما نكون جاهزين.» back «نرجع خطوة.» skip «نعدّي الخطوة دي.» unlocked «فتحنا جزء جديد!» locked «نكمّل الجزء اللي قبل ده الأول.» muted «الصوت مقفول. نقدر نشغّله من علامة السماعة.» exit «نخرج دلوقتي؟ تقدّمنا متسجّل.»

## 4. Descriptive praise library (rotate; never repeat "برافو" every time)

«تمام! استخدمنا المراية عشان نشوف السن.» • «عاش! الشفّاط شال كل المَيّه.» • «الرشّاشة شالت الرغوة.» • «الفرشة خلّت السن نضيف ولامع.» • «ممتاز! عملنا الخطوات بالترتيب.» • «حلو! افتكرنا علامة الوقف.» • «عاش! أخدنا نفس هادي قبل ما نكمّل.» • «دلوقتي بقينا عارفين المكان.» • «عملناها بهدوء، خطوة خطوة.»

## 5. Banned phrases → replacements

| Never | Instead |
| --- | --- |
| ما تخافش | هنشوف كل حاجة بهدوء |
| مفيش حاجة تخوّف | هنشوف كل خطوة قبل ما تحصل |
| مش هيوجع / مفيش ألم | هنقول كل خطوة، ونقدر نطلب وقفة / ممكن نحس بلمسة، أو ضغط بسيط، أو تدغدغة |
| غمّض عينيك جامد / لازم تفضل مغمّض | ممكن نغمّض عينينا، أو نبص على النجمة / نقدر نفتح عينينا في أي وقت |
| البخاخ السحري | الجِلّ المهدّي أو البخّة المهدّية |
| الإبرة | real name only in an appropriate treatment journey, reviewed by a pediatric dentist |
| إنت شجاع عشان ما خفتش | عرفت الخطوات، واستخدمت علامة الوقف |
| غلط! | ولا يهمك. نجرب تاني |
| أسرع! | خد وقتك |
| حاول كويس | نبص على اللمعة، ونجرب سوا |
| لو ما عملتش كده مش هتكسب | كل محاولة بتعلّمنا حاجة |

## 6. First-visit audio order (normal journey)

Welcome → feeling check → chair → light → instrument table → mirror → suction → air-water → polisher → tool practice → breathing & counting → stop-hand signal → visit simulation → final feeling check → reward & certificate.

Treatment-only (never in the first visit): عصاية الكشف (when relevant), كاميرا السنان, حلقة السن, غطا السن المطاطي, الجِلّ المهدّي, and any filling/preparation activity.
