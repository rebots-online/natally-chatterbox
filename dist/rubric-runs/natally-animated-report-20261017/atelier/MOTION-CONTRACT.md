# Natally embodied conversation — motion and integration contract



Authority: Robin, 17 October 2026. Status: **refined design/prototype handoff; production and latency acceptance unpassed**. Authority includes the operator’s human-factors, animated-report, atelier and mouth-options updates in this project.



## 1. Scope and invariants



Use the current Chatterbox model, revision, runtime, reference audio, sampling parameters and inference provider/settings without change. The design does not authorize application checkout edits, model substitutions, new providers, services or deployment. The implementation engineer must inspect the current application through its required CodeGraph workflow before mapping these conceptual events onto existing code; the names below are an adapter contract, not claims about existing source symbols.



The authoritative ordering is: **new submission / explicit Stop → already-ready answer → eligible prepared cue → nonessential art**. An interruption acknowledgement itself is preemptible. No cue can reserve an audio turn ahead of a ready answer. No animation completion, cue ending, warmup task, chart calculation or rendering callback is a prerequisite for existing answer scheduling.



The prototype deliberately creates no inference client, TTS engine, AudioContext, speech synthesis, microphone request or network request. Voice events and counts are simulated. It contains arbitrary chart geometry labelled as a design fixture and no personal birth/profile/history data. Freeform input is displayed locally and starts the same labelled example, not a fabricated model response to its contents.



## 2. State and motion table



| State / entry evidence | Gaze and blink | Hands / ball | Room and chart | Voice / exit |

|---|---|---|---|---|

| Idle / no active work | Weighted user 60%, ball 30%, chart 10%; independent blink 2.4–6.4s | Small caress 1.3–2.3s, with independently varied 2.7–6s start intervals; ball low | One 1.8s room-light gesture per 6.5–12s interval; no inferred chart focus | Silently prepare eligible reusable cues only if compute is idle; submission interrupts immediately |

| Receipt / accepted submission, before understanding | Face user, one small settled response; no knowing nod | Hand settles; ball neutral | Chart focus cleared; room still | Vary soft closed hum, quiet intake or neutral “One moment”; no claim of understanding; history/cooldown and missing-buffer rules apply |

| Inference / actual provider work | Ball-peering with returns to user; independent blink | Bounded caress followed by real pauses; steady low ball | One sparse opacity effect in Full mode; no room effects in Light mode | No invented progress or understanding; keep input and Stop active |

| First-answer TTS / first unit text received, PCM not ready | Ball and user attention; no preview of unheard chart findings | Cheap caress continues within visual budget | Retain neutral chart until playback starts; sparse warm light | Eligible post-inference bridge from received text, already prepared and outside cooldown; no foreground cue generation |

| Answer playback / actual audible unit start | Gaze follows validated semantic focus, then user; blink independent | Caress may resume at bounded varying pace; ball brighter from actual audio state/envelope | Focus only the unit's validated planet/house/aspect; active layer change can accompany spoken mention | Answer owns output; updates played count only at actual end |

| Later generation gap / previous unit ended, next PCM unavailable, turn remains open | Peer into ball, then return to user; randomized holds and independent blink | Caress at varied speed, pause, settle; ball low and steady | Full: one sparse warm glint; Light: no room effects. Keep only previous chart focus | At most one eligible continuation cue tied to completed unit, subject to history/cooldown. Otherwise gesture and silence. Answer-ready preempts immediately |

| Interruption / Send or Stop | Immediate return toward user; clear planned gaze | Freeze caress at safe rest; no flourish | Clear spoken highlight; room still | Abort inference/TTS as supported, detach old playback, cancel cue timers; optional settled low grunt, short closed Mm or “Go ahead” from an eligible ready pool; never surprise/wonderment |

| Error / explicit provider, synthesis or playback failure | Attentive stillness, not celebratory blinking | No hand activity, steady low ball | Persistent readable error; no misleading chart highlight | No retry loop. Retry / text fallback / new submission available |

| Muted / independent flag, may coexist with any state | Text-driven attention only, no pretend audio envelope | Bounded visual gestures allowed | Text focus can be labelled reading rather than speaking | Stop audio immediately; suppress all cues. Never replay skipped audio on unmute |



The native asset has no separated mouth, and this prototype keeps its original face. Per the later mouth-options authority, the future handoff now allows approved separate closed, slightly-open, wide and rounded poses, with optional finer visemes only after review. Drive poses from the existing shared AudioContext playback clock/envelope, not queued text or arbitrary talking loops. This is approximate articulation, not phoneme-alignment proof. The answer must never await envelope analysis; use neutral/closed pose if data is missing. Stop, mute and epoch change close the mouth immediately; closed hum/Mm takes stay closed. No facial ML model or additional library is installed or approved by this refinement.



## 3. Event envelope



Every event belongs to a monotonically changing turn epoch. Drop callbacks from old epochs before they reach UI or audio. A new submission does not await cancellation acknowledgements from old requests.



```ts

type TurnEvent = {

  type: string;

  turnId: string;

  epoch: number;

  eventId: string;                // Deduplicate delivery.

  monotonicMs: number;            // performance.now() in the owning context.

  unitId?: string;

  ordinal?: number;               // Explicit sequence, never arrival-order guesswork.

  text?: string;                  // Complete sentence from the existing stream.

  knownTotal?: number | null;     // null until the provider establishes it.

  focus?: {

    chartVersion: string;

    layer: 'natal' | 'current' | 'both';

    planetIds?: string[];

    houseIndices?: number[];

    aspectIds?: string[];

    groundedTextSpan: [number, number];

  };

};

```



| Integration event | Source of truth | Consumer action |

|---|---|---|

| `TURN_SUBMITTED` | Existing Send handler | Increment epoch synchronously; cancel current source, cue, timers and queued units; start existing inference immediately; optionally play ready receipt cue |

| `TURN_RECEIVED` | Local acceptance / transport receipt | Enter receipt; makes no claim of model understanding |

| `INFERENCE_STARTED` | Existing generation queue | Enter preparation; retain bounded attention gestures under the selected visual budget |

| `SENTENCE_RECEIVED` | Existing complete-sentence stream | Increment received once by unitId; show real text; resolve semantic IDs against current chart data |

| `TTS_PREPARE_STARTED` | Existing Chatterbox scheduler | Mark unit as preparing; preserve one-ahead strategy; no extra voice job |

| `TTS_UNIT_READY` | Actual usable PCM buffer | Increment prepared once; pass directly to existing playback scheduler; cancel any lower-priority cue synchronously |

| `PLAYBACK_STARTED` | Audio clock's actual start | Mark current unit; activate its validated chart focus and answer light; never use TTS readiness as audible-start proof |

| `PLAYBACK_ENDED` | Actual source end excluding cancellation | Increment played once. Enter gap only if turn is open and next usable buffer is absent |

| `GENERATION_GAP_ENTERED` | Queue inspection at unit end | Evaluate previous unit's continuation eligibility; dispatch at most one prepared local cue; otherwise stay silent |

| `TURN_FINISHED` | Provider completion plus final playback/text state | Set known total from real stream completion; release active focus |

| `INTERRUPT_REQUESTED` | Stop or new Send | Same synchronous cancellation lane; old callbacks cannot reassert state |

| `VOICE_MUTE_CHANGED` | User preference | Detach active audio and cue; maintain input/inference and useful text; do not replay on unmute |

| `TURN_ERROR` | Actual error, with stage/code/retryability | Persistent user-readable error and recovery controls; stop progress animation |

| `VISIBILITY_CHANGED` | Document visibility | Cancel nonessential motion and pending cues; coordinate audio policy with existing app, do not silently change its background behaviour |

| `DEVICE_PACING_OBSERVED` | Measured per-device queue/throughput samples | Inform a future adapter only; unavailable evidence stays unavailable; no automatic slowdown |

| `VISUAL_BUDGET_CHANGED` | Explicit Full/Light preference or validated runtime budget controller | Change visual work only; never alter provider/model/audio timing |

| `CHART_COMPUTED` | Existing Swiss Ephemeris path | Supply real geometry, IDs, chartVersion and explicit as-of metadata |



The prototype exposes `window.NatallyPrototype` for local assessment (`preview`, `beginSequence`, `ready`, `stop`, `toggleMute`, `setLayer`, `snapshot`, `events`, `cueHistory`, `selectCue`, `compareCues`, `seekTimeline`, `playTimeline`, `pauseTimeline`). It is not the production event bus. Its background-tab handling cancels the rehearsal to prevent stale demo events on return.



## 4. Prepared cue contract



Pool keys include the unchanged model/revision/runtime/reference/sampling fingerprint, locale, cue function and content-eligibility tag. Reuse existing local storage/cache mechanisms; introduce no prerecorded download. A fingerprint change invalidates stale cached voice assets but does not authorize a model or setting change.



- Fill pools silently during truly idle compute windows, without audible playback. Give user work priority even over a running warmup job; abort where supported and use the existing resource arbitration path.

- Bounded proposal: at most 8 ready cue buffers, 12 seconds combined audio or 8 MiB decoded storage, whichever limit is reached first. Keep the existing model sample rate; do not resample or change runtime settings for this feature.

- Receipt: soft level-to-falling closed hum, quiet intake, or “One moment.” Pair with brief user-facing attention. Never acknowledge understanding before content exists.

- Interruption: settled low grunt, short closed Mm, or “Go ahead.” Pair with stopping the old hand gesture and returning to the person. Avoid surprise/wonderment; a new submitted message takes the receipt path instead.

- First answer: choose only after eligible text has arrived. An eligible prewarmed neutral bridge such as “Let’s start there” must match the upcoming content. Missing matching buffer means silence.

- Later gap: bind the decision to the last completed unit ID. A reflective exhale, low resonant hum or “Staying with that thought…” can connect to a completed reflective thought; it is not a new receipt. Lexical continuations require exact semantic eligibility and an already-ready buffer. No “I’ve found…” for an unheard finding. Ball-peering and caressing continue whether the eligible audio cue exists or not.

- Do not generate a missing cue on Send, during answer preparation, during a gap or in response to an audio cache miss.

- At most one later-gap cue per gap, max 1.8 seconds; avoid repeating the same cue on adjacent gaps. Silence is valid and preferable to irrelevant acknowledgement.

- A cue that arrives late from an old warmup callback remains cached at most; it must never autoplay.



```js

function onAnswerReady(unit, intendedAudioStart) {

  if (unit.epoch !== activeEpoch) return;

  cancelPendingCueTimers();

  detachCueSourceImmediately();  // Do not await end, fade, animation or cleanup.

  existingScheduleAnswer(unit, intendedAudioStart); // Original scheduling deadline.

  notifyVisualStateAfterScheduling(unit);

}



function onNewSubmission(text) {

  const epoch = ++activeEpoch;

  detachCurrentAudioImmediately();

  cancelPendingCueTimers();

  requestOldInferenceAndTtsAbort(); // Do not await.

  existingStartInference(text, epoch);

  maybeUseAlreadyPreparedReceiptCue(epoch);

}

```



If click prevention needs a gain ramp, it runs concurrently and cannot postpone answer scheduling. Test the resulting overlap and acoustic quality. Never wait for a cue's `ended` event or a Promise to resolve. UI motion is a nonblocking observer.



### Fatigue and recent-use rules



Proposed defaults for listening tests, not empirical claims:



1. Maintain session-wide recent-use history across turns and across all four cue contexts. Exact take IDs include prosody and model/reference fingerprint; changing the text label cannot reset identity.

2. Exclude the same exact take for 90 seconds. Exclude the last two voiced cue families, such as hum, breath, grunt, invitation or grounded bridge. Different Mm/Hmm spellings are not automatically distinct families.

3. At most two voiced cues in a rolling 20-second window. A third nearby opportunity receives gesture and silence. Never queue it for delayed playback or generate a replacement on demand.

4. Eligibility, availability and audio priority are checked before selection. Sample randomly from eligible distinct families; silence is an explicit candidate/fallback. The prototype comparison is deterministic so the two/three-use difference can be inspected.

5. At most one continuation per gap. Cancelled cues still count as exposures if they began; muted/rejected/silent choices do not count as voiced exposures. Production must record actual audible onset, not just request creation.

6. The prototype caps its history at 24 entries, evicting silent annotations first so rapid silent submissions cannot erase recent voiced evidence. Production must retain sufficient timestamps for the full cooldown window regardless of event-log limits.

7. The comparison sandbox has independent fresh history and is labelled. Rehearse this context uses the conversation history. There is no production reset button.



| Context | Nonverbal alternatives | Short lexical alternative and gate | Gesture variation |

|---|---|---|---|

| Receipt | Soft closed hum; light quiet intake | “One moment.” No understanding asserted | Brief user-facing dip; small hand settle; attentive stillness |

| Settled interruption | Low falling grunt; short closed Mm | “Go ahead.” For Stop/open invitation, not a finding | Stop old hand; return gaze; settled small dip |

| Post-inference | Gentle intake; low settled assent | “Let’s start there.” Only after compatible text arrives | Small ball glance; slight user-facing settle |

| Continuation | Reflective exhale; low resonant hum | “Staying with that thought…” Only after a compatible completed unit | Slow caress; peer into ball; look back; quiet pause |



All palette entries in the prototype are textual descriptions of proposed takes, not recordings. Production retains the bounded local ready-pool budget; it need not keep every proposed take in memory at once. Missing or cooling-down choices produce silence, never foreground synthesis.



## 5. Chart truth and timing



Production uses the existing Swiss Ephemeris calculations and existing chart geometry/data paths. The fixture's arbitrary points must never be copied into production ephemeris data.



```ts

type ComputedChartPair = {

  chartVersion: string;

  natal: ExistingNatalChart;       // Existing authorized profile path only.

  current: ExistingComputedSky;

  asOfUtc: string;                // Actual calculation input, ISO-8601 UTC.

  computedAtUtc: string;          // Actual calculation completion wall clock.

  displayTimeZone: string;        // Existing user timezone setting.

  ephemerisVersion: string;       // Existing Swiss Ephemeris version.

};

```



At the calculation request boundary capture `asOfUtc = new Date().toISOString()` once and pass that exact instant into the existing current-sky calculation. Render that returned as-of time, localized with its timezone and a UTC accessible description. Never replace it with render time or an unlabeled “now.” If the user requests a historical instant, use and label that explicit instant instead.



An absent or invalid `asOfUtc` prevents a “today/current” live-data claim. Label the state unavailable, keep the natal layer usable, and allow the existing retry path. Do not refresh ephemeris while speech synthesis is competing for resources merely to animate the room. Refresh only through the application's established sky-update schedule.



Natal wheel positions remain anchored. Current geometry fades and rotates from an 18-degree staging offset to its *actual final orientation* in 420ms; this offset is a visual transition, never a fabricated ephemeris rotation. In reduced motion switch opacity/state without travel. Solid versus dashed styles and visible labels distinguish layers without relying only on color.



Semantic references must resolve to IDs from the same `chartVersion`. Missing, stale or ambiguous references produce no highlight. House highlighting requires the actual calculation/house system. Activate focus at the real unit's audible start, release on interruption/error, and do not pre-highlight an unheard next sentence. A muted reading state may follow visible text but must say reading rather than speaking.



## 6. Proposed performance limits — not measured acceptance



| Resource | Budget / policy |

|---|---|

| Added dependency count | 0 animation, chart or rendering packages |

| External runtime requests | 0 for scene, fonts, motion or cues |

| Stage assets | Reuse one 400px still texture; no video. Original remains in project provenance, not decoded by the page |

| Concurrent animation | Full: max 3 semantic character channels (gaze uses head + eyes), 1 room-opacity channel. Light: head + hand + sparse blink; no eye translation or room glints. One animation per element; no particle system |

| Main-thread animation work | Target p95 ≤0.5ms/frame and p99 ≤1ms/frame attributable to added art on target desktop; profile separately on phone |

| Paint / compositing | Transform and opacity only; static small gradients and one chart highlight filter. No animated filter radius, path geometry, box size or full-screen blur |

| JS scheduling | Character uses independent bounded timers; no continuous JS requestAnimationFrame loop. The explicitly played report alone updates its transform playhead at 12.5Hz and stops at the end. Cancel all scene/report timers when hidden or motion-paused |

| Synthesis / inference / gap | Preserve cheap ball-peering and caressing. Full: hand 1.3–2.2s / starts 2.7–6s; gaze 1.2–2s / starts 2.9–6.4s; one 1s room-opacity effect every 5–10s. Never gate audio. Light reduces work as below |

| Light performance mode | Hand 0.9–1.4s / starts 6–10s; head glance ≤1.1s / starts 4.5–8.5s; blink 4–8.5s; no room animation or eye translation. User-selectable prototype mode, not automatic hardware classification |

| Idle | Finite gestures with independent randomized rest/start intervals, one room-light/object/star-opacity gesture every 6.5–13s; visible pause control cancels all motion immediately |

| Reduced motion | No head/hand/eye travel, blink animation or chart rotation; static highlights and textual state persist |

| Hidden tab | 0 scene animation callbacks after cancellation; no queued cue on return |

| Memory | Cue pool bounded as above; event ledger max 150 records; one shared raster decoded by the browser |

| Inference / audio | **Zero added scheduling delay**; never wait for scene or cue cleanup. No model/runtime changes |



Random intervals are independent, bounded and weighted, not one global periodic loop. During answer playback, validated spoken focus overrides idle random gaze. During generation gaps, the ball/user attention policy takes priority over random glances toward future content; only the completed unit’s chart highlight may remain. Interruption invalidates queued gestures immediately. Brief hand motion must remain anatomically within the original joint/ball relationship. Separate approved layers are the production path for larger articulation.



## 7. Assessment and acceptance



### Prototype rehearsal



1. Select Speaking: unit 1 becomes visible, the ball brightens and the Venus fixture glows.

2. Select Later gap: one completed unit is shown; next unit is preparing, total unknown, with a continuation cue explicitly marked silent simulation.

3. Press Answer ready while the cue is active: cue cancellation is recorded before answer start; unit 2 starts without waiting, and the chart layers intersect.

4. Press Stop or Send during any active state: the old epoch, cue and scheduled units cannot reappear.

5. Mute: audio ownership and cues clear; text and submission stay usable. Unmute does not replay audio.

6. Select error: retry/text fallback/new submission remain available. Toggle motion and test reduced motion separately.

7. Open the chart and switch all three layer views; use Escape and return to the invoking control.

8. Compare 2 and 3 uses in each of the four cue contexts. Observe distinct families/gestures and the third quiet opportunity. Rehearse contexts repeatedly and verify recent history is retained.

9. Select Later gap in Full and Light visual modes: both retain bounded hand/gaze attention; Light removes room effects. Reduced motion keeps static attention and text.

10. Play/pause/scrub the waterfall and change demo speed. Use Stop, Send or Answer ready during it; no later report tick may reassert the old state.



### Runtime acceptance still required



Robin supplied a prior desktop measurement: **9ms prepared-cue scheduling, 11.487s to first answer, and up to 4.061s later-unit gaps** on RTX 3090 / 32GB. These are brief inputs, not measurements of this prototype and not acceptance thresholds.



Compare the unchanged app with art/cues disabled against the same app with this feature enabled, using identical prompts, context, provider settings, Chatterbox fingerprint and cache/warm state. Interleave runs to reduce provider/load drift. Capture submission, text receipt, TTS queue/start/ready, intended/actual audio start, unit ends, cue scheduling/cancellation, chart update and frame costs. Separate provider, synthesis, scheduler and render time; a better-looking pause is not a shorter pause.



Require direct traces showing no added audio-scheduling dependency and no missed original start deadline attributable to a cue or art. Compare first-answer and inter-unit latency distributions with measurement resolution and uncertainty reported; an underpowered “no significant difference” result is not zero-latency proof. Report any observed regression without rounding it away.



Exercise cold/missing/stale pools, answer-ready at every cue phase, rapid successive sends, muted/unmuted mid-unit, stop during TTS, cancelled callbacks, errors, total unknown, background/foreground and reduced motion. Verify audible continuation eligibility and naturalness through listening, not just event traces.



Phone and foldable acceptance must include actual keyboard open/close, safe areas, rotation, narrow exterior screen, unfolded screen and hinge configuration if supported. A responsive layout or desktop image does not prove on-device behaviour.



No application source checkout was inspected or changed, no real provider/audio/ephemeris call was made, and no deployment or latency PASS is part of this handoff.





## 8. Measured device pacing — future adapter only



Do not classify a device from a marketing name, GPU label or animation smoothness. No per-device throughput or queue samples are connected to this prototype. Preserve the current one-ahead sentence pipeline and the existing Chatterbox/inference configuration.



The future adapter consumes actual samples: complete-unit text arrival, synthesis queued/start/ready, decoded ready-audio duration, current playback remaining duration, queue depth, unit audio duration, generation wall time, cancellation and cold/warm cache state. Keep inference and TTS throughput separate. Use a rolling window with sample count and uncertainty; insufficient evidence means no tuning.



```ts

type DevicePacingObservation = {

  deviceSessionId: string;

  modelRuntimeFingerprint: string;   // Existing configuration, unchanged.

  sampleCount: number;

  observedAtMonotonicMs: number;

  readyAudioSeconds: number;

  playingRemainingSeconds: number;

  inferenceUnitSeconds: number[];

  synthesisRealTimeFactors: number[]; // Measured synthesis wall time / audio duration.

  queueStarvationIntervalsMs: number[];

  warmState: 'cold' | 'warm' | 'mixed';

};

```



The design may display a real “next unit ready” or “next unit preparing” condition and use measured starvation risk to choose among eligible prepared cues. It must not delay an already-ready answer to build a reserve, insert artificial pauses to hide generation, automatically slow the speaker/user, alter sentence meaning, or change providers/models. Any production scheduling optimization requires separate approval and identical-setting before/after measurement. The report's demo-speed control affects its illustration only.



## 9. Animated report evidence contract



The embedded waterfall is a six-state design simulation: receipt → inference → first voice preparation → answer playback → later gap → ready-answer preemption. It has Play/Pause, native scrub, demo-speed controls, a textual state description and reduced-motion support. Filled lanes show illustrative event ordering; they do not claim completed generation or measured time. Cue windows are optional: eligibility, history, missing buffers and mute may leave them silent. The hatched answer-wait lane remains visible regardless of attention animation.



The reported 9ms scheduling, 11.487s first answer and 4.061s maximum later gap remain separate observations from Robin's brief. Their raw event boundaries and cross-run relationship are not supplied. Do not reconstruct or animate them as one measured production trace. The separately prepared engineering waterfall should arrive with run IDs, monotonic clock origins, interval endpoints, provenance, missing-event markers and original scheduling deadlines. Until then its detailed lanes remain unavailable, rather than fabricated.



The fatigue before/after is a human-factors proposal, not evidence that annoyance or latency has improved. Actual listening studies should compare repeated versus varied cues and gesture-only pauses after two and three exposures, track perceived interruption/understanding, and retain real audio gaps in the evaluation. Never equate visual fascination with removal of unvoiced waiting.

