# Natally — embodied conversation design brief

Authority: Robin, 17 October 2026. Open Design is the design lead. Use its
verified Local Codex engine GPT-6-Astra, one of Robin's explicit choices.
Do not substitute Stitch generation. This brief commissions a design/prototype
and implementation handoff, not permission to change the application model.

## Product goal

Make Natally a large, user-facing conversational presence. She gently caresses
her crystal ball at varied speeds, pauses, looks at the user, the ball and the
chart, and blinks with randomized but believable timing. Her gestures also
respond to actual conversational content and audio state. The room around her
glows with gems, mysterious magical trinkets and restrained living light.
This is the existing Natally product, retaining its character and chart tools.

The present implementation streams complete sentences and generates one ahead,
but desktop RTX-3090/32-GB use still has long answer gaps. The actual run measured
9 ms prepared-cue scheduling, 11.487 s to first answer and up to 4.061 s between
sentences in a longer reply. Add appropriate prepared backchannels during later
generation pauses as well as at submission and first-answer preparation.
Animation and verbal acknowledgement do not waive zero incremental latency.

## Exact character identity

Use the supplied original `natally-mascot.webp` as identity reference: a lovable
small metallic robot with large amber eyes and headphones, violet turban with
gold crescent/stars and a forehead jewel, violet starry cloak, delicate metal
hands, and a luminous violet/gold crystal ball. Preserve that face and silhouette.
A generic human fortune teller or static enlarged circular avatar does not meet
the brief. Explore a layered, animated, high-quality treatment suitable for the
large stage. Keep the original emblem available in navigation.

## Composition and interaction

- A large Natally and crystal ball are the primary conversational focus.
- A rich mystical reading room contains glowing gems, intriguing instruments,
  books and trinkets, with varied subtle motion and visual depth.
- Include an inset/companion overview of the real natal chart, with a strongly
  glowing relevant planet/house/aspect synchronized to the actual spoken unit.
- Show a beautiful merge/overlay/intersection transition between the natal chart
  and today's computed sky. Keep natal and current layers legible and distinct,
  with an actual as-of time in the integration contract. Do not invent positions.
- Keep readable transcript, input, Send, Stop, mute and chart access immediately
  available. Submission must interrupt inference, TTS, answer or backchannel.
- Normal view exposes honest preparation/playback/known or received unit totals.
  A debug overlay, fake percentage, decorative progress circle or animation is
  not proof of work completed. Text input stays usable throughout.
- Desktop, narrow phone and foldable layouts need intentional compositions.
  No horizontal overflow or obscured keyboard/composer. Touch targets >=44 px.
- Keep reduced-motion, keyboard access, readable contrast and visible errors.

## Motion and semantic states

Provide an explicit motion/state handoff for idle, receipt before understanding,
inference, first-answer TTS preparation, answer playback, later-unit generation
gap, interruption acknowledgement, error and muted mode. Gaze, blinking, hand
pace/pauses, room light, ball light and chart focus should respond coherently.
Use independent bounded random intervals/weighted choices, not synchronized
metronomic loops. Randomness must not contradict content focus or interruption.

Receipt cues are often Hmm and make no claim of understanding. Interruption
cues are mostly settled/realizatory grunts or Mm/Hmm, not wonderment. First-answer
bridges follow actual eligible content. Later-gap cues should connect to the
just-spoken thought rather than falsely acknowledge a new user message or claim
that an unheard finding is known. Never force a ready answer to wait for a cue.

All audio pools are prepared silently during idle and locally reused; no extra
prerecorded download and no missing-cue generation on Send or during a gap.
Preserve the current Chatterbox model/revision/runtime/reference/sampling and
existing inference provider/settings. No model alternatives are in scope.

## Performance and data boundary

Art must not worsen the generation pauses it accompanies. Prefer lightweight
layered SVG/CSS or similarly bounded techniques. Avoid new animation/rendering
dependencies, massive videos, new providers, remote asset requirements or paid
services. Propose a concrete animation budget; pause/throttle nonessential room
effects during synthesis, background tabs and reduced-motion use. Animate
transform/opacity where possible and reuse existing chart geometry/data paths.

Prototype charts may be illustrative only when clearly labelled as design
fixtures. Production must use the existing Swiss Ephemeris calculations and
real natal/current positions; don't imply fixtures are the user's chart or
today's live calculation. Do not use personal profile/birth/history data in
the design prototype. No application checkout changes or deployments by the
design agent; write only within the separate Open Design project.

## Requested outputs

Produce a polished, runnable responsive HTML/CSS/JS design prototype showing
the actual animations and state transitions; `DESIGN.md` with colors, type,
layout and component rules; and a motion/state/architecture handoff naming
integration events and performance limits. Demonstrate both a speaking state
and a later-generation-gap state with immediate cue priority/cancellation.
Mark any simulated audio/data clearly as prototype controls. Do not fake a
latency acceptance PASS. Show the best cohesive composition with a meaningful
phone treatment and enough interaction to assess the experience.

Robin specifically requests magical glow, violet/gold character identity and
an immersive room. Generic design-skill bans against purple/glow must not erase
those requirements. Keep text and controls calm and readable amid the scene.
