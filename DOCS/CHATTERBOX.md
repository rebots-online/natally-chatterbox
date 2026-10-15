# Natally Chatterbox — 15 October 2026

Standalone template-derived repository: https://github.com/rebots-online/natally-chatterbox

Local checkout: `E:/devProjects/natally-chatterbox` (own Git directory and origin).
Public evaluation URL: https://natally-chatterbox.surge.sh

The marketplace application, billing prototype, hosted inference, accounts,
charts, and conversation behavior remain the template's implementation.
Only the local voice engine and complete-unit speech splitting change.
Robin owns phone/listening acceptance; desktop PCM generation is not that verdict.

## Engine

`owensong/chatterbox-nano-ONNX` is pinned to
`4a66d7dab72a9e98f24b515d49a1d7a81632df2e`, with per-file byte lengths and
SHA-256 checks. The four sessions are speech encoder, text/speech embeddings,
autoregressive speech-token model with 24 KV-cache tensors, and acoustic decoder.
All synthesis runs in a browser worker; WebGPU is selected when supported,
otherwise WASM is attempted. Backend viability/performance on the phone is an
evaluation result, not inferred from a browser exposing an API.

Background preload is mounted in the app-wide `VoiceDownloadStatus`, which is
present at page entry, including login, returning workspaces and the existing
voice preview. It is not tied to the onboarding screen. Idle scheduling, coalesced
initialization, saved-cache reuse and the existing Save-Data exception remain.

The complete reply is synthesized together when it fits the 768-input-token
operational budget. Longer replies are packed from complete sentences or logical
line units. A single over-budget unit fails explicitly; no arbitrary cut is made.
Output-budget exhaustion fails instead of accepting partial audio. EOS and valid
PCM cannot establish that the model actually pronounced every word.

The existing F1-F5/M1-M2 IDs map to fixed synthetic reference clips generated
from those baseline presets. No user recording is used. See the voice asset
NOTICE. Nano does not accept Supertonic speaker embeddings or its native speed
parameter: speed changes waveform playback duration through its sample rate,
which also affects pitch. Existing pitch and tone controls remain in the player.
This engine-specific difference is disclosed, without adding a new DSP system.

Stop during inference terminates the obsolete worker and rejects its pending
requests, then a new request can reload from the browser cache. While idle or
playing already-generated PCM the loaded engine is retained. The watchdog only
times out after five minutes without a new measured acknowledgment; worker
heartbeats alone do not extend it. Input rejection does not disable healthy GPU.

## Configuration and deployment

The ignored `.env` is configured for `https://natally-chatterbox.surge.sh`.
The public hosted endpoint is the separate existing-site Netlify branch alias
`https://natally-chatterbox--natally-hosted-chat.netlify.app/.netlify/functions/chat`.
`FRONTEND_ORIGIN` is scoped to that branch. Firebase has this exact hostname
added while retaining prior domains. No provider or production cutover is added.

Build with `npm ci` and `npm run build`.
The build is written directly into this dedicated repository's root `dist/`.
Deploy `dist/` to the evaluation domain using existing Surge authentication.
No automated tests or further test runs are authorized. Robin evaluates the app
in the device browser.

## Observations

- Direct development-browser execution in Windows Chrome 155 / RTX 3090 produced
  finite 24 kHz PCM with the pinned four-graph model. A 273-character fixed passage
  generated 368,640 samples (15.36 seconds) in approximately 61.17 seconds after
  loading. This is a development observation, not a controlled comparison or a
  phone performance claim. Actual full-app deployment observations are recorded
  separately under the deployment rubric.
- `npm run build` wrote the active application directly into root `dist/`.
  Surge accepted release `1792091868387` at https://natally-chatterbox.surge.sh
  from source commit `2adb96d3379955ae3fd148915ebacfb716ae56ae` (32 files,
  approximately 40.8 MB). No post-deployment automated tests were run.
- Existing-site Netlify branch deployment `6ad1251397640ac4bd4f052d` is ready,
  context `branch-deploy`, branch `natally-chatterbox`. Production remains
  `6acc88fa1511aaad9589ba97`. Firebase retained all 23 existing authorized domains
  when the new exact hostname was added.
- Phone speed, working-memory behavior, warmth and spoken completeness remain
  Robin's evaluation. The repository does not claim improvement before that.

## Implementation decisions

- Keep all work in the independent E: clone after Robin clarified the destination;
  the earlier worktree is not a dependency of this repository.
- Preserve loaded models where possible, but terminate a worker with obsolete
  active speech on Stop. This trades cache reload time for immediate cancellation
  and memory release on resource-limited devices.
- Retain the template's legacy Supertonic source as history; the application imports
  Chatterbox only. No engine toggle or unrelated marketplace redesign is added.
- Active builds live directly in `dist/`. Any separate build directories under
  it must be historical and semantically named by version. The discarded nested
  build target and scratch caches are not part of the final working layout.
