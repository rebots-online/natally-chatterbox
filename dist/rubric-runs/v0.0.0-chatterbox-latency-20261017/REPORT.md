# Natally Chatterbox conversational latency baseline — 17 October 2026

Verdict: **current implementation fails the requested conversational latency
behavior; replacement approach and acceptance remain pending**. This is a
diagnostic baseline, not a repaired-release or whole-product PASS.

## Subject and method

- Inspected repository baseline: `062eb5951186a1d08172d93501e193a52c8aa540`.
  The existing runtime was built/deployed from `4f6530c` as recorded in
  HOSTED_CHAT.md; no runtime-source differences exist between those commits.
  Served index bytes matched the tracked deployment index in this run.
- Site: https://natally-chatterbox.surge.sh/; native Windows Chrome, existing
  normal profile. The signed-out existing `/tests/voice-browser.html` uses the
  actual application speech service, selected F4, Auto resources and Soft tone.
- Model: `owensong/chatterbox-nano-ONNX`, immutable revision
  `4a66d7dab72a9e98f24b515d49a1d7a81632df2e`; observed backend WebGPU.
- Only synthetic public sample text was entered. Existing opt-in tab-local
  measurements were enabled through the UI. No identity, provider reply,
  application state, audio or generated waveform was substituted.
- Stills and native measurement exports are the indexed evidence. There is no
  continuous screencast or recorded audio track. Audible word completeness,
  prosody and exact acoustic onset cannot be certified from these artifacts.
- UI timing below uses the automation host clock around a click and subsequent
  direct observation. It includes tool/browser round trips; it is not an audio
  hardware timestamp or a precise acoustic latency measurement.

## Indexed observations

| Trial / requirement | Observation | Evidence |
|---|---|---|
| Startup / cache | All 13 model/tokenizer file-completion records report `source: cache`. Engine/reference preparation request completed in **17,254 ms**. No model-weight download caused the subsequent fresh-generation delays. | [native events](01-three-sentence-native-measurements.json), [completed state](01-three-sentence-completed.jpg) |
| Three complete short sentences | `Beginning marker. This is the middle sentence. Ending marker.` Planning request: 3.4 ms. Speech request: **11,269 ms**. One decoder completion follows 73 language-model executions; the service generated a single whole-turn waveform. Playback page ultimately reported successful completion. | [native events](01-three-sentence-native-measurements.json), [completed state](01-three-sentence-completed.jpg) |
| Fresh single sentence, engine loaded | `The first words must be audible.` Planning: 0.7 ms. New speech request: **6,014.6 ms**, with no preload/file-read request. This isolates fresh synthesis from cached-weight startup. | [start](02-single-sentence-start.jpg), [completed observation](02-single-sentence-observed.jpg), [native events](02-warm-single-sentence-native-measurements.json) |
| Another fresh single sentence | `Another fresh sentence begins here.` Planning: 0.6 ms. New speech request: **6,847.4 ms**, again without preload/file reads. The page ultimately reported successful playback. | [start](03-fresh-sentence-start.jpg), [native events](03-fresh-single-sentence-native-measurements.json) |
| Cached audio replay | Replayed the immediately preceding sentence. Planning and speech requests each completed in **0.4 ms**. At the first direct UI observation, **287 ms after initiating the automated click**, the page displayed `Playing locally generated audio`. This supports prepared-audio reuse, not an exact first-sound timestamp or a zero-latency PASS. | [playing](04-cached-sentence-playing.jpg), [native events](04-cached-sentence-native-measurements.json) |
| Attempt to time first playback / audio duration | A further fresh sample, `Fresh speech needs to keep up.`, completed. The driver's wait-for-visible operation repeatedly timed out and missed the transient playing state. Both observation timestamps remain null. No first-audio time, playback duration, real-time factor or keep-ahead claim is derived from this attempt. | [start](05-paced-trial-start.jpg), [missed playback observation](05-paced-trial-missed-observation.jpg), [explicit null timing record](05-paced-trial-observation-times.json) |
| Ordinary production chat feedback | Existing normal-chat UI was inspected separately. The source marks the message speaking before the actual audio-start callback. The expanded bottom files/graphs display in Robin's attachment is diagnostic and cannot establish production-visible progress. No authenticated new conversation was submitted in this baseline. | Source: `NatallyChatbot.tsx` presentMessage / `VoiceDownloadStatus.tsx`; Robin's supplied screenshot. Production latency/interrupt acceptance remains pending. |

Exports are cumulative snapshots from the same tab; **do not add their event
counts or treat each export as an independent cohort**. Planning and synthesis
share the `1-100` workload label. The existing aggregate request average mixes
those operations, so the table above identifies individual request run IDs and
their actual graph executions instead of using that average as TTS latency.

Relevant native run IDs, in order:

- `mvcn2n09-1`: startup/reference preparation, 17,254 ms.
- `mvcn30bk-2`: three-sentence plan, 3.4 ms.
- `mvcn30bn-3`: three-sentence generation, 11,269 ms.
- `mvcn48p8-4`: warm single-sentence plan, 0.7 ms.
- `mvcn48pg-5`: warm single-sentence generation, 6,014.6 ms.
- `mvcn50ck-6`: second fresh single-sentence plan, 0.6 ms.
- `mvcn50cu-7`: second fresh single-sentence generation, 6,847.4 ms.
- `mvcn76g5-8`: cached replay plan, 0.4 ms.
- `mvcn76gg-9`: cached replay speech, 0.4 ms, no new graph executions.

## What this proves and what remains open

The published pipeline adds substantial new-generation delay even with the
engine loaded. Cached prepared audio avoids that generation work in this run.
Source inspection establishes whole-turn packing, complete-reply JSON barriers,
conditional prefetch and worker teardown on cancellation. These are concrete
targets for the proposed amendment in `DOCS/ARCHITECTURE.md` section 9.

This run does **not** prove latency is unavoidable after optimization, that
another model passes, that sentence generation keeps ahead of playback, that
every spoken word is complete, that an idle palette is ready on first-ever use,
or that interruptions/context/phones pass. No product code or deployment was
changed. The operator's zero-incremental-latency requirement remains in force.
