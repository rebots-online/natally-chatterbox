# Natally — the reading room



Design authority: Robin's approved brief, 17 October 2026. Scope: this separate Open Design prototype only. This refinement applies HUMAN-FACTORS-UPDATE-20261017.md, ANIMATED-REPORT-REQUEST-20261017.md, ATELIER-ART-DIRECTION-20261017.md and the referenced mouth-options handoff.



## Design intent



A warm, candle-lit atelier, with the original amber-eyed Natally free-standing at its centre. Amber and gold illuminate wood, plaster, neatly shelved minerals and instruments. Violet remains in her turban, cloak and crystal ball. Calm ink surfaces carry the transcript and controls. During generation, she peers into and caresses the ball, pauses, and returns her attention to the person.



This is a responsive product screen, not a landing page. There is no signup funnel, fictitious personal reading, invented progress percentage or model configuration UI.



## Authority and assets



- `assets/natally-mascot.webp` is the supplied original. It is preserved without modification. Intrinsic dimensions: **400 × 400**, 124 frames, approximately 24 fps. It is not a high-resolution character rig.

- `assets/natally-still.webp` is a single-frame derivative of that exact asset. The original emblem remains in the navigation, using the still derivative so animation can actually be paused.

- The stage reuses the same pixels in SVG clipping regions for the cloak, head, eye interiors and caressing hand. No generated replacement face or character was introduced. The image remains square in every SVG image element; clip paths isolate parts deliberately.

- The room, gems, books, armillary sphere, hourglasses and nine candles are original inline SVG environment details. They depict an imaginary room, not real products or places requiring photography.

- No font downloads, remote images, CDNs, paid media, runtime dependencies, videos or rendering libraries are used.

- At large stage sizes the original raster can soften. Production-quality enlargement requires an approved higher-resolution asset or properly separated original character layers. The prototype's small bounded displacements do not substitute for that art deliverable.



## Source palette



The actual original was inspected before choosing tokens. Sampled source pixels included the night surround RGB **0, 8, 21**; turban shadow **55, 31, 62**; cloak **66, 40, 71**; ball highlight **255, 243, 180**; metal face **202, 182, 166**. The semantic palette is a restrained OKLch derivation of that art, not the generic Product defaults.



```css

--bg: oklch(0.17 0.022 294);

--surface: oklch(0.205 0.027 294);

--fg: oklch(0.94 0.014 79);

--muted: oklch(0.74 0.025 294);

--border: oklch(0.35 0.035 294);

--accent: oklch(0.81 0.105 80);

--violet: oklch(0.65 0.16 309);

--violet-light: oklch(0.79 0.105 309);

--deep: oklch(0.12 0.023 294);

--room: oklch(0.39 0.06 65);

--metal: oklch(0.64 0.043 72);

--wood: oklch(0.43 0.075 65);

--plaster: oklch(0.53 0.07 76);

--oak: oklch(0.32 0.055 58);

--wax: oklch(0.9 0.045 85);

--sky: oklch(0.22 0.04 262);

--jade: oklch(0.68 0.085 168);

--garnet: oklch(0.60 0.12 30);

--error: oklch(0.83 0.10 30);

--success: oklch(0.8 0.065 158);

```



The six semantic base tokens are also recorded in `brand-spec.md`. Violet/gold and magical glow are explicit requirements of this brief. They supersede the older white/blue Product palette and generic prohibitions against violet or glow. The warm plaster, wood, wax and mineral tokens implement the operator’s requested environment; jade and garnet are object materials, not additional UI accents. Gold has one solid UI action, Send; contextual chart highlighting is its second UI role. The supplied artwork and room materials keep their identity colors. Do not turn every label, border or link gold.



## Typography



```css

--font-display: Georgia, 'Times New Roman', serif;

--font-body: 'Segoe UI', Helvetica, Arial, sans-serif;

--font-mono: Consolas, 'Courier New', monospace;

```



Georgia supplies the warm reading-room voice without a font download. Segoe UI handles dense text and familiar controls. Mono is reserved for integration documentation; it is not a third face on the product screen.



- Main title: 32/1.15 desktop, 26/1.15 phone, 24 at 360px; tracking −.02em.

- Panel titles: 21–22px Georgia, approximately 1.2 leading.

- Transcript: 15px/1.65 Segoe UI; body UI 15px/1.55.

- Captions: 11–12px; uppercase labels 10px with .09–.17em tracking.

- Buttons: .02em tracking; 400 normal and 600 emphasis.

- Keep prose below 65 characters per line. Use real wrapping; never hide text overflow.



## Composition



### Wide desktop, 1101px and up



The main stage and conversation share one bordered workspace. The stage receives roughly 63% of the width; conversation roughly 37%. A 148px companion wheel sits below the room, avoiding the character silhouette. A wide rectangular star window spans the room. Fine Cassiopeia-like, Orion-like and dipper-like traces are atmospheric illustrations, not an ephemeris display. Three aligned shelf levels on each side hold gemstones, bottles, books, an armillary sphere, hourglasses and a compass. Nine candle points warm the shelves and table. No circular portal constrains the character. The transcript scrolls independently; the composer remains visible at the bottom of its panel.



### Tablet / open foldable, 701–1100px



Keep two usable panes, with a 320px minimum conversation column and simplified room labels. The character stays large while the chart shrinks to 110px. Controls wrap in the rehearsal area. This is responsive web, not a native foldable shell: hinge occlusion, physical spanning and device keyboard behaviour remain device acceptance work.



### Narrow phone / closed foldable, 360–700px



Recompose vertically: room first, compact companion chart second, readable conversation third. The room is 310–335px tall. The 66px companion wheel is an overview; Explore and the persistent chart button open a full chart dialog. The input, Send, Stop and mute remain in a fixed bottom composer. Safe-area padding and Visual Viewport offsets accommodate browser keyboards without making the text field unavailable. Body clearance prevents the composer from covering the last content.



No horizontal carousel is used. All grid tracks that hold text use `minmax(0,…)`; controls wrap. The CSS audit covers 360, 390, 430, 600, 768, 820, 1024, 1366, 1440 and 1920px. Static width checks are distinct from browser/device acceptance.



## Components



- **Primary action:** one gold Send button, minimum 44px high. Enter sends; Shift+Enter adds a line; IME composition is respected. Empty submission uses native validation.

- **Stop:** remains next to mute and chart. It cancels the simulated turn and all stale turn timers, then offers a settled interruption cue. Disabled only when nothing is running.

- **Mute:** true toggle with `aria-pressed` and accessible name updates. It cancels cue/answer audio ownership immediately. It does not disable typing or restart skipped audio when unmuted.

- **Normal status:** plain state name plus cumulative received, prepared and played counts. The total stays unknown until completion. Prototype counts describe synthetic events only.

- **Transcript:** semantic log, safe text insertion, visible speaker labels, and a current-unit underline. No typing illusion substitutes for received text.

- **Companion chart:** solid natal geometry and dashed current geometry; Together uses a bounded layer intersection transition. Glowing focus follows unit start, and interruption clears it.

- **Chart dialog:** native modal, named close button, Escape dismissal and focus restoration. No personal data or dates are fabricated.

- **Prototype rehearsal:** explicitly labelled silent event controls. These are design assessment controls and must not ship in the production conversation UI.

- **Error:** visible, persistent until an explicit retry, text fallback or new submission. No endlessly running spinner.



## Motion and accessibility



See `MOTION-CONTRACT.md` for state semantics and budgets. Motion is restrained, independent and bounded; it does not delay text, playback or interruption. A visible Pause motion control is always available. Individual gestures finish, then rest for independently varied intervals. Inference, first-answer preparation and later gaps retain ball-peering and caressing. Full mode uses one sparse room-opacity channel, at 5–10 second start intervals during generation; Light mode removes room glints and reduces character work while preserving intermittent attention. Visual work never gates audio. Reduced motion removes gaze, hand and layer travel; static highlights and text still convey state.



All controls use native elements, target at least 44 × 44px, have focus-visible rings, and retain readable text on hover. Body and UI foregrounds use high-contrast light text on dark surfaces. Primary hover lightens the gold fill while retaining dark text. Disabled controls alone reduce contrast.





## Human-factors rehearsal



Below the existing state controls, “The pause, considered” is an explicitly labelled design report, not production UI or a hidden debug overlay.



- **Compare 2 uses / Compare 3 uses:** shows the old repeated Hmm against a deterministic illustration of a varied first cue, a different second family/gesture, and silence with attention on the third opportunity. Switch context between receipt, settled interruption, post-inference and continuation.

- **Palette:** contrasts closed hum, settled low grunt, quiet intake and reflective exhale with short eligible phrases. These are proposed semantic/prosodic takes described in text; no real voice is synthesized or played.

- **Recent history:** the conversation keeps cue history across turns. Rehearsing a different context does not reset fatigue. The comparison intentionally uses its own empty history and says so visibly.

- **Cooldown proposal:** 90 seconds per exact take, avoid the last two voiced families, and at most two voiced cues within a rolling 20 seconds. These are design defaults for listening studies, not established human-factors thresholds. Silence and gesture are legitimate outcomes.

- **Animated waterfall:** six narrative states with Play/Pause, native keyboard-operable scrubber and 0.5×/1×/2× demo speed. This controls the illustration only; it never changes user speech or a model. Lane widths encode illustrative order, not measured elapsed production time or generation percentage. Optional cue opportunities do not erase the hatched answer-wait lane.

- **Known observations:** the report separately displays the brief-supplied 9ms cue scheduling, 11.487s first answer and 4.061s maximum reported later gap. They are not stitched into a fictional trace. The engineer’s measured waterfall remains separate.

- **Cancellation:** Send, Stop, Answer ready, a new rehearsal, backgrounding, motion pause and reduced-motion preference stop report autoplay as appropriate. A stale playhead cannot restart an old answer or gap.



The initial design is preserved in `index-v2.html`, with companion pre-refinement document copies. The main `index.html` is the final artifact; the live before/after cue comparison is embedded there.



## Mouth handoff



The existing face is retained in the prototype. The referenced mouth-options research supersedes the previous blanket ban on a future mouth rig: use approved separate closed/slightly-open/wide/rounded poses and the existing audio playback clock/envelope. No facial ML model, lipsync dependency or extra analysis on the audio critical path is approved. Mm/hum cues use the closed pose; interruption and mute close it immediately. See MOTION-CONTRACT.md for the adapter boundary.



## Evidence boundary



This project is a runnable local visual and interaction prototype. It does not run inference, TTS, audio playback, Swiss Ephemeris, authentication or personal chart services. Animation measurements, production speech latency and real mobile keyboard behaviour must be measured in the application and on target devices. No latency acceptance PASS is asserted here.

