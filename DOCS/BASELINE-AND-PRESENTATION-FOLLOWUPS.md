# Baseline release and later presentation work

Robin's direction, 2026-10-13: a stable, fully working release including billing
comes first. Its success gates and motivates the distinctive presentation work.
These notes capture the conversation; they do not mark billing or later features
as implemented or approve new providers, costs, or deployments.

## Baseline offer

Alby remains available for both comprehensive readings and turn-by-turn
micropayments. Credit cards add a one-time prepaid package sized to accommodate
minimum charges and processing fees, at an already understandable reading price
(approximately USD 30 discussed, not a frozen checkout price). No subscription
or unlimited flat-rate inference promise.

The package delivers a comprehensive reading, a well-formatted chart and PDF,
and a disclosed follow-up allowance. The PDF includes bullet-point summaries of
the conversational explorations. Even a modest opportunity to explore a reading
adds value beyond a take-it-or-leave-it PDF. Account for actual inference,
summarization, payment, and variable delivery costs before fixing the allowance;
enforce spend, usage, and concurrency limits on the server.

The baseline release gate is a verified purchase → reading → follow-up → export
journey, with entitlement recovery and correct allowance enforcement. Keep Alby
and the credit-card package as complementary payment choices. Existing billing,
identity/sync, and infrastructure contracts remain relevant; reconcile this
updated offer with them before implementation.

## Remaining reading and export refinements

- Hide automatically generated initial instructions from the conversation using
  explicit message metadata; retain them internally for inference.
- Remove the editorial 650-word ceiling. Keep natal synthesis separate from
  dated current-transit interpretation, with calculated-facts grounding and
  honest birth-time/location limitations. Backend output and spend bounds remain.
- Diagnose long-reading voice interruptions and validate mobile playback. Voice
  recovery work is described separately in CHECKLIST.md and HOSTED_CHAT.md.
- Export legible chart graphics and a paginated comprehensive PDF with follow-up
  topic summaries. Exclude internal instructions and preserve uncertainty.

## Presentation work after the baseline succeeds

Robin explicitly released chart highlighting on 15 October 2026. The bounded
implementation now uses `[[chart:TARGET;TARGET]]` and `[[chart:clear]]` in model
output, with an exact inventory of the displayed natal chart supplied in the
prompt. The application strips commands from conversation/voice/export, validates
targets, and drives React/Three.js focus. House focus includes calculated
occupants; aspect focus uses only an actual named chord. Saved reply controls
reapply valid cues, while narration advances by existing speech word offsets.
Manual selections remain independent. Unknown-time houses/angles, invented
aspects and arbitrary DOM selectors/scripts are rejected. Native Windows Chrome
verification uses real chart geometry with controlled inference/speech callbacks;
live provider adherence, audible timing and physical devices remain unverified.
Camera foreground/orientation and narrated recording below remain future work.

1. Select text and use a context-menu highlighter with a slightly imperfect
   hand-drawn marker effect. Persist highlights and let customers return to the
   original passage through a highlights list.
2. Give Natally validated presentation commands to foreground the natal torus,
   orient a specified house (for example, house 1 at nine o'clock), focus relevant
   planets, and glow the lines of an actual calculated aspect. Coordinate these
   changes with narration and return to karaoke between explanations. Commands
   must use known chart entities/aspects, never invent geometry or gain access
   to billing/admin tools. Define the command interface before prompting for it.
3. Record narrated chart walkthroughs as optional add-on purchases. MP4 includes
   the voice; animated WebP/GIF/APNG can provide silent segments or previews.
   Record after chart/narration choreography is reliable.
4. While the local voice model loads, show Natally setting up her modest shoppe:
   trying to inflate the torus out of breath, then using a bike pump; hammering
   up a makeshift wooden sign reading exactly **PSYCHICK NATALLY**. Keep progress,
   error, and retry information usable; honor reduced-motion preferences.

The sign expresses Robin's brief: simple and inexpensive, without fancy bells
and whistles, with Natally putting her heart into her work. It is not a request
to redesign the character. The browser/share title now uses PSYCHICK NATALLY;
the animated wooden sign and loading scene are not implemented.

## Established mascot restoration

Robin explicitly requests restoring the real animated Natally rather than
another Gemini-generated substitute. This checkout's NatallyAvatar currently
draws an SVG imitation that references `natally-idle-400.webp` in comments. No
original animated asset is tracked or available in this workspace. The obvious
asset path on the current Surge deployment returned 404; the custom domain did
not provide it during this session. An original asset or authoritative URL is
needed before changing the default. Do not generate or redraw a replacement and
call it the original. Preserve explicit user-uploaded avatars when restoring the
default unless Robin instructs otherwise.
