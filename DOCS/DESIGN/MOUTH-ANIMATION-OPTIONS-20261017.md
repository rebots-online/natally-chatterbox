# Natally mouth-animation options — 17 October 2026

Robin asked which mouth-animation systems suit this cartoon and remain light.
This is research and a recommendation, not a product dependency installation.
Application Chatterbox and inference models remain unchanged.

## Recommended integration direction

Natally's small stylized robot mouth is a good candidate for a layered 2D/2.5D
rig. Separate closed, slightly open, wide and rounded mouth poses from the face;
optionally add richer consonant/vowel poses after visual evaluation. Use actual
PCM playback timing and audio energy/frequency features, with fast attack and
gentler release, rather than estimated word durations. This is approximate
lip-sync, not a claim of phoneme alignment. Idle mouth/eyes/gesture motion remains
a separate semantic state machine.

An in-app Web Audio envelope/feature reader needs no neural weights. That is the
smallest proposed starting point. It must use the existing shared AudioContext
and buffer-source path rather than re-encoding to a media file or waiting for a
second inference pass. Cached idle backchannels could retain prepared timelines
with PCM; first playback must never await mouth analysis. Stop/mute/turn change
must stop the old audio and its mouth motion together. These are implementation
requirements for a future closed architecture, not measured performance claims.

## Current primary-source candidates

| System | Confirmed behavior | Fit / practical boundary |
|---|---|---|
| Wawa Lipsync | TypeScript/Web Audio, intended for 2D/3D browser characters. Source computes FFT bands, spectral/energy features and rule-based scores for visemes. MIT. | Useful lightweight browser reference/candidate; no neural model download in the inspected implementation. Its supplied interface creates its own AudioContext and connects HTML media, so integration with Natally's existing buffer playback requires adaptation. Approximate classification; no Natally benchmark yet. |
| Rhubarb Lip Sync | Native CLI analyzing WAVE/Ogg recordings. Six basic cartoon mouth shapes plus three optional extensions; timestamped JSON/TSV/XML mouth cues. Can use a dialogue file to improve recognition. | Strong cartoon-oriented candidate for idle preparation of repeated cues. Official release is a native tool, not a drop-in browser component. Any browser port/runtime and foreground cost require independent review. Never gate first audio on its analysis. |
| uLipSync | Unity MFCC audio analysis driving blend shapes/texture changes, including WebGL support. Documentation notes WebGL lacks its Job System/Burst optimization and recommends pre-baking when live analysis is not critical. | Relevant reference for a Unity character, but brings a different runtime than the existing React/browser app. No proposal to introduce Unity here. |

Sources inspected on 17 October 2026:

- [Wawa project and usage](https://github.com/wass08/wawa-lipsync)
- [Wawa actual analysis implementation](https://github.com/wass08/wawa-lipsync/blob/main/packages/wawa-lipsync/src/lipsync.ts)
- [Rhubarb official project/documentation](https://github.com/DanielSWolf/rhubarb-lip-sync)
- [uLipSync official documentation](https://github.com/hecomi/uLipSync)

No package size, FPS, millisecond overhead or phone/GPU compatibility is claimed
from documentation. Benchmark the chosen rig beside real Chatterbox synthesis,
including interruption, muted mode, silent samples and reduced motion. Mouth
animation and ambient art cannot PASS the still-failed zero-latency rubric.
