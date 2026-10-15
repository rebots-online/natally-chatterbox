# Browser-local Supertonic voice replacement

Authority: Robin's request to finish the Supertonic replacement of Gemini TTS.
Scope: Studio speech only; hosted chat access is a separate unresolved task.

## Voice USP and listening acceptance

Operator listening result: REJECTED — current deployed voice sounds much older
in both timbre and diction. Functional acceptance does not supersede this.
Robin subsequently selected F4 and requested a higher-pitched kawaii cartoon
delivery matching the mascot. Implement F4, playback pitch 1.30 and synthesis
speed 0.85 as the candidate default; slower synthesis offsets the accelerated
playback approximately, not as an exact duration guarantee. Preserve valid saved
choices; expose an explicit Use F4 Kawaii control for existing users. Keep a
natural-reference comparison available. The shared sample lives in
`src/services/voiceService.ts:1` and is used by configuration preview and the
verification page. `NATALLY_SYSTEM_PROMPT` in `src/services/natallyChat.ts:46`
owns spoken register, independently of the speaker embedding. If none of the
presets meets the voice brief, this model requires replacement or an authorized
voice-adaptation path; pitch shifting is not acceptance.

Robin's explicit brief: Gen-Z ennui, relatable, approachable, and engaging enough
to encourage voluntary return use. Delivery should sound warm, conversational,
lightly world-weary and wry, with the explicitly requested high-pitched cartoon
mascot character, not mechanically cheerful or unintelligibly rushed.
Preserve emotional nuance in the authored text;
do not insert stock catchphrases or rewrite meaning for TTS.

The selected Supertonic model has preset speakers and speed, not Gemini-style
free-text acting instructions. Do not present dormant persona controls as
emotion conditioning. Listen to actual output for natural phrasing, pauses,
warmth, understated humour, and intelligibility over full readings. A passing
download/playback test does not satisfy this product-quality gate. If the
model cannot meet it, report that limitation rather than labeling audio effects
as expressive synthesis. No manufactured emotional dependency or pressure to
return is part of this brief.

## Evidence and decision

The existing `supertonicTts.ts` is an unconnected stub. Its model HEAD request
does not instantiate an engine, and synthesis always returns null. The MNN
model card describes a native CLI. The WebML Supertonic Space demonstrates
`onnx-community/Supertonic-TTS-ONNX` using Transformers.js. Use that browser
route with WebGPU when available and local WASM when not. Neither path sends
reading text to a speech server or requires Firebase. No hosted or system-voice
fallback is permitted. Loading failures are visible and retryable.

Sources: https://huggingface.co/spaces/webml-community/Supertonic-TTS-WebGPU/tree/main/src
and https://huggingface.co/yunfengwang/supertonic-tts-mnn.

## Entity contract

| Entity | Target | Role and signature |
|---|---|---|
| `supertonicSpeak` | `src/services/supertonicTts.ts:1` | `(text: string, options?: {voice?: string; speed?: number}) => Promise<{samples: Float32Array; sampleRate: number}>`; lazy shared worker, reject errors |
| `splitSpeechText` | `src/services/supertonicTts.ts:1` | `(text: string, limit?: number) => string[]`; bounded chunks, no dropped tail |
| `subscribeVoiceStatus` | `src/services/supertonicTts.ts:1` | callback subscription for loading/ready/synthesizing/error status |
| worker handler | `src/services/supertonic.worker.ts:1` | serialized synth requests with IDs, progress, transferable PCM; pinned model revision and runtime |
| `VoiceSettings` | `src/services/voiceService.ts:5` | preserve preferences; migrate engine to `supertonic-onnx`, supported voice IDs F1–F5/M1/M2; remove paid options |
| `DEFAULT_VOICE_SETTINGS` | `src/services/voiceService.ts:21` | `VoiceSettings`; F4, pitch 1.30, rate 0.85, kawaii_chibi |
| `loadVoiceSettings` | `src/services/voiceService.ts:35` | `() => VoiceSettings`; retain valid local choices; validate finite ranges; absent/invalid and unsupported legacy speaker fall back to candidate defaults |
| `NATALLY_VOICE_SAMPLE` | `src/services/voiceService.ts:3` | shared short cartoon audition text, no character memory implementation |
| F4 preset action | `src/components/NatallyConfigModal.tsx:246` | existing voice panel button applies default speaker/pitch/rate/personality only, preserves mute/avatar/sprite and saves through existing callbacks |
| `speakNatallyText` | `src/services/voiceService.ts:1` | preserve current callback signature and boolean return; chunked local PCM playback, stop invalidates pending audio, errors call onEnd |
| `stopSpeaking` | `src/services/voiceService.ts:1` | stop active playback and invalidate in-flight utterance |
| `NatallyConfigModal` | `src/components/NatallyConfigModal.tsx:1` | replace existing engine block with local voice options and live status; keep existing preview |
| voice tests | `tests/supertonic.test.ts:1` | deterministic chunking, preference migration, playback cancellation and no hosted fallback |
| voice verification page | `tests/voice-browser.html:1` | signed-out real-service playback and status display; built as a second entry via `vite.config.ts` |
| `initSupertonic` | `src/services/supertonicTts.ts:1` | `() => Promise<void>`; coalesced preload of the real engine, no synthesis; retry after failure |
| `scheduleSupertonicPreload` | `src/services/supertonicTts.ts:1` | `() => () => void`; idle-scheduled preload with timer fallback, respect Save-Data, swallow background failure only |
| `FirstLight` effect | `src/components/onboarding/FirstLight.tsx:79` | schedules preload at onboarding mount without blocking intake or displaying a modal |
| `SUPERTONIC_MODEL_FILES` | `src/services/supertonicDownload.ts:1` | immutable path-to-byte-count manifest for pinned model revision |
| `SupertonicDownloadProgress` | `src/services/supertonicDownload.ts:1` | `update({file,status,loaded}) => {loadedBytes,totalBytes}`; monotonic per-file counters, clamped, no double counting |
| `VoiceDownloadStatus` | `src/components/VoiceDownloadStatus.tsx:1` | subscribes to `VoiceStatus`, bottom thin native progress and byte labels; model download distinct from runtime preparation; mounted in `src/main.tsx` |

Worker owns model lifetime; startup and synthesis failures reject all matching
requests without permanently poisoning later initialization. First download is
disclosed. Cache model downloads with the runtime's browser cache, bounded PCM
reuse in worker. Keep synthesis off the UI thread. Existing language/accent and
persona settings must not claim controls that this English model does not have.
Speed controls actual synthesis; pitch is explicitly a playback effect.

### F4 Kawaii release amendment — 2026-10-12 02:12 EDT

Robin requests best-guess implementation with no audition gate; subjective tuning
is deferred. `getVoicePreset(env)` in `src/services/voiceService.ts` returns the
validated speaker/pitch/rate fields from public build-time Vite environment values.
Defaults: F4, 1.30 pitch, 0.85 speed. `voicePresetVersion`, persisted by
`saveVoiceSettings`, is the three-value signature. Missing/changed signatures
apply the current preset on load, preserving mute/avatar/sprite and other unrelated
settings; unchanged signatures preserve valid user overrides. This supersedes
preserving unversioned audio choices so existing installs actually receive F4.
Document variables in `.env.example` and rebuild/redeploy semantics in
`HOSTED_CHAT.md`. No new chat persona or lore behavior is part of this release.

## Operator verification protocol

Use the existing voice preview signed out. Observe model download, real PCM
generation and playback, then repeat after download. Stop during synthesis and
confirm no late audio. Check a browser without WebGPU via the WASM path. Record
which devices/backends were actually exercised; do not equate tests/build with
subjective voice quality or mobile compatibility.

## Observed local verification

Transformers.js is pinned to 4.3.1; the Space's older 3.8.1 dependency introduced
reported transitive vulnerabilities and was not retained. Existing unrelated
Firebase audit findings remain. Updating the existing esbuild development
dependency to 0.28 also resolves its peer-version conflict with Vite 8.3.

The in-app Chromium browser exposed WebGPU but returned no GPU adapter. A
capability-presence check alone caused initialization failure; the loader now
requests an adapter before selecting that backend. The real application voice
service subsequently generated speech on WASM and reached playback completion
on the signed-out verification page. This is playback lifecycle evidence, not
an assessment of accent, emotional expressiveness, or phone performance.

Production Surge verification: main onboarding showed 55.4 / 262.8 MB while
Next remained usable. It transitioned to a separate preparation state and
cleared the strip after readiness. The built `/tests/voice-browser.html` uses
the same speech module as the app and reached `Local playback completed
successfully` with `wasm`; a subsequent Speak/Stop sequence ended as stopped.
No Firebase session was required for either preload or speech.

The byte bar covers the pinned model manifest, not an estimated elapsed-time
percentage. Browser-cache completion contributes each known file once. Runtime
initialization/download is a separate indeterminate preparation stage, not a
stalled model percentage. Save-Data suppresses automatic preload but does not
prevent explicitly requested speech.


## Adaptive speech and diction amendment — 2026-10-14

Authority: Robin requests lower resource use/device calibration, missing-word
repair and younger timbre/diction. This releases tuning; SOUL/two-lore stays
out of scope. Current evidence: chunks can exceed the configured target up to
1,000 characters; next-chunk inference always overlaps playback; sprite speech
can replace a preparing reading. These are verified mechanisms, not proof of
which caused the reported missing words on three physical devices.

| Entity | Target | Role and signature |
|---|---|---|
| `splitSpeechText` | `src/services/supertonicTts.ts:48` | Respect limit at word/clause boundaries; preserve words and Unicode surrogate pairs; overlong single words split only when unavoidable. |
| `LocalSpeech` | `src/services/supertonicTts.ts:2` | Add optional `generationMs`, `backend`, `clipReuse`; only fresh inference duration calibrates. |
| `getSpeechPolicy` | `src/services/voiceService.ts:36` | `(mode, capabilities, realTimeFactor) => {chunkChars, prefetch}`; auto 240 chars, gentle/low-memory 180, capped by configured limit. Start serial; overlap only with >=8 cores, >=8 GiB reported memory and measured ratio <0.35. Unknown capabilities stay conservative. |
| `isSpeechBusy` | `src/services/voiceService.ts:110` | `() => boolean`; true for preparation and playback until utterance completion/cancellation. |
| `VoiceSettings` | `src/services/voiceService.ts:5` | Add validated `resourceMode: 'auto'|'gentle'` and `tone: 'natural'|'soft'|'warm'`; preserve all other choices. |
| `speakNatallyText` | `src/services/voiceService.ts:139` | Measure fresh synthesis/audio ratio; adapt remaining chunk sizes, serialize gentle playback and generation, bound prefetch to one; resume audio before every chunk, check cancellation after awaits; playback latency hint. Two optional shelf filters alter tone independently of pitch, with gain headroom for the warm bass boost. |
| worker `synthesize` | `src/services/supertonic.worker.ts:98` | Return real inference duration/backend/cache flag; reject token overflow before upstream truncation; retain five passes, one WASM thread and pinned model. |
| `NatallySprite` | `src/components/NatallySprite.tsx:52` | Guard incidental speech with `isSpeechBusy`; keep chat toggle. Replace stock robotic greeting/idle text with relaxed, wry language, no lore system. |
| `NATALLY_SYSTEM_PROMPT` | `src/services/natallyChat.ts:48` | Short spoken clauses, contractions, understated Gen-Z phrasing; concrete examples without mandatory catchphrases or changing calculated facts. |
| `NatallyConfigModal` | `src/components/NatallyConfigModal.tsx:242` | Existing voice block gets resource and tone selectors; disclose gentle pauses and tone EQ. No new screen. |
| `getVoicePreset` | `src/services/voiceService.ts:22` | Candidate default F4, pitch 1.15, rate 0.9 for clearer youthful delivery. Environment retains control; changed preset migration follows existing contract. |
| regression tests | `tests/supertonic.test.ts:1` | Hard chunk bounds, no missing words, capability/measurement policy, conservative scheduling, stop races, pitch/tone/settings. |
| comparison page | `tests/voice-browser.html:1` | Existing real-service page gets resource/tone choices and natural pitch reference; device listening remains operator evidence. |

Tradeoff: serial chunks can pause between phrases; they protect playback from
inference contention without buffering an entire long reading in RAM. Adaptation
uses observed inference duration rather than a phone-model lookup or synthetic
CPU stress benchmark. Cached replay never masquerades as fast inference. Model
memory/download size remains unchanged. Shelf EQ changes spectral colour; it is
not learned emotion, accent or formant-preserving pitch shifting.

Parser gaps observed through CodeGraph: this Markdown, package.json, env example,
HOSTED_CHAT.md and comparison HTML require targeted reads. Source was mapped
through the verified graph. Checks: full Node suite, TypeScript, production build,
diff check, real browser generation and playback. Physical-device listening and
subjective voice acceptance remain separate from deterministic test acceptance.
